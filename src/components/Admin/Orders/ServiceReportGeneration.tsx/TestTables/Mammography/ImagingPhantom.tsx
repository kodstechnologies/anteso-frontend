// components/TestTables/ImagingPhantom.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Save, Loader2, Plus, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addImagingPhantomForMammography,
  getImagingPhantomByServiceIdForMammography,
  updateImagingPhantomForMammography,
} from '../../../../../../api';

interface PhantomRow {
  id: string;
  name: string;
  visibleCount: string;
  toleranceOperator: '>' | '>=' | '<' | '<=' | '=';
  toleranceValue: string;
}

interface SavedRow {
  name: string;
  visibleCount: number;
  tolerance: {
    operator: '>' | '>=' | '<' | '<=' | '=';
    value: number;
  };
}

interface SavedData {
  _id?: string;
  rows: SavedRow[];
  remark: 'Pass' | 'Fail';
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const defaultRows: PhantomRow[] = [
  { id: '1', name: 'Fibers', visibleCount: '', toleranceOperator: '>=', toleranceValue: '5' },
  { id: '2', name: 'Microcalcifications', visibleCount: '', toleranceOperator: '>=', toleranceValue: '5' },
  { id: '3', name: 'Masses', visibleCount: '', toleranceOperator: '>=', toleranceValue: '4' },
];

const operators = ['>', '>=', '<', '<=', '='] as const;

const ImagingPhantom: React.FC<Props> = ({ serviceId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(null);
  const [rows, setRows] = useState<PhantomRow[]>(defaultRows);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  const isViewMode = hasSaved && !isEditing;

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        const data: SavedData | null = await getImagingPhantomByServiceIdForMammography(serviceId);
        if (data) {
          setRows(
            data.rows.length > 0
              ? data.rows.map((r, i) => ({
                id: Date.now().toString() + i,
                name: r.name,
                visibleCount: r.visibleCount.toString(),
                toleranceOperator: r.tolerance.operator,
                toleranceValue: r.tolerance.value.toString(),
              }))
              : defaultRows
          );
          setTestId(data._id || null);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load Imaging Phantom data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId]);

  // Save handler
  const handleSave = async () => {
    const hasEmpty = rows.some(r =>
      !r.name.trim() ||
      r.visibleCount.trim() === '' ||
      r.toleranceValue.trim() === ''
    );

    if (hasEmpty) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSaving(true);

    const payload = {
      rows: rows.map(r => ({
        name: r.name.trim(),
        visibleCount: parseInt(r.visibleCount, 10) || 0,
        tolerance: {
          operator: r.toleranceOperator,
          value: parseFloat(r.toleranceValue) || 0,
        },
      })),
    };

    try {
      if (testId) {
        await updateImagingPhantomForMammography(testId, payload);
        toast.success('Updated successfully!');
      } else {
        const res = await addImagingPhantomForMammography(serviceId, payload);
        setTestId(res.data._id || res.data.testId);
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);

  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  // Row operations
  const addRow = () => {
    if (isViewMode) return;
    setRows(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      visibleCount: '',
      toleranceOperator: '>=',
      toleranceValue: '',
    }]);
  };

  const removeRow = (id: string) => {
    if (isViewMode || rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof PhantomRow, value: any) => {
    if (isViewMode) return;
    setRows(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <span className="ml-4 text-lg">Loading Imaging Phantom Test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header + Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Mammography Phantom Image Quality Test
        </h2>

        <div className="flex items-center gap-4">
          {isSaving && <span className="text-sm text-gray-500">Saving...</span>}

          {isViewMode && (
            <button
              onClick={toggleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}

          {!isViewMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {buttonText} Test
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Phantom Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          Phantom Object Visibility
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r w-16">
                  Sr No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Name of the object
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Number of objects visible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tolerance (at AGD less than 3 mGy)
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center font-medium text-gray-700 border-r">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      readOnly={isViewMode}
                      placeholder="e.g. Fibers"
                      className={`w-full px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                        }`}
                    />
                  </td>

                  <td className="px-6 py-4 border-r">
                    <input
                      type="number"
                      min="0"
                      value={row.visibleCount}
                      onChange={(e) => updateRow(row.id, 'visibleCount', e.target.value)}
                      readOnly={isViewMode}
                      className={`w-24 px-3 py-2 text-center border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                        }`}
                      placeholder="0"
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <select
                          value={row.toleranceOperator}
                          onChange={(e) => updateRow(row.id, 'toleranceOperator', e.target.value as any)}
                          disabled={isViewMode}
                          className={`appearance-none bg-white border rounded-md px-4 py-2 pr-8 text-center font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                            ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                            : 'hover:border-gray-400'
                            }ividual
                          }`}
                        >
                          {operators.map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-4 h-4 pointer-events-none text-gray-500" />
                      </div>

                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.toleranceValue}
                        onChange={(e) => updateRow(row.id, 'toleranceValue', e.target.value)}
                        readOnly={isViewMode}
                        className={`w-24 px-3 py-2 text-center border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                          ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                          : 'border-gray-300'
                          }`}
                        placeholder="5"
                      />

                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {row.name.trim() ? `${row.name.toLowerCase()} must be clearly visible` : 'objects must be clearly visible'}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-4 text-center">
                    {rows.length > 1 && !isViewMode && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          {!isViewMode && (
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Object
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagingPhantom;