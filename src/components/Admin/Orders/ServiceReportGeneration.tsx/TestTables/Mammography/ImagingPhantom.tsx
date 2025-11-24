// components/TestTables/ImagingPhantom.tsx
import React, { useState, useEffect } from 'react';
import { Edit3, Save, Loader2, Plus, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhantomRow {
  id: string;
  name: string;
  visibleCount: string;
  toleranceOperator: '>' | '>=' | '<' | '<=' | '=';
  toleranceValue: string;
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

const ImagingPhantom: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [rows, setRows] = useState<PhantomRow[]>(defaultRows);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const isViewMode = hasSaved && !isEditing;

  // Load data
  useEffect(() => {
    if (!testId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        // Replace with real API when ready
        // const { data } = await getImagingPhantom(testId);
        // setRows(data.rows?.length ? data.rows : defaultRows);
        setHasSaved(true);
      } catch (e) {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [testId]);

  // Save handler
  const handleSave = async () => {
    const hasEmpty = rows.some(r =>
      !r.name.trim() ||
      !r.visibleCount.trim() ||
      !r.toleranceValue.trim()
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
      remark: rows.every(r => {
        const visible = parseFloat(r.visibleCount) || 0;
        const tol = parseFloat(r.toleranceValue) || 0;
        switch (r.toleranceOperator) {
          case '>': return visible > tol;
          case '>=': return visible >= tol;
          case '<': return visible < tol;
          case '<=': return visible <= tol;
          case '=': return visible === tol;
          default: return false;
        }
      }) ? 'Pass' : 'Fail',
    };

    try {
      // Replace with real API
      // await saveImagingPhantom(testId || null, payload);
      toast.success(testId ? 'Updated successfully!' : 'Saved successfully!');
      if (!testId) setTestId('new-id');
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (hasSaved) {
      setIsEditing(true);
    }
  };

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

  const updateRow = (id: string, field: keyof PhantomRow, value: string) => {
    if (isViewMode) return;
    setRows(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="ml-3 text-gray-600">Loading...</span>
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

        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewMode
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-4 h-4" />
              {buttonText} Test
            </>
          )}
        </button>
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
                  Tolerance (at AGD &lt; 3 mGy)
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {/* Sr No */}
                  <td className="px-6 py-4 text-center font-medium text-gray-700 border-r">
                    {index + 1}
                  </td>

                  {/* Object Name */}
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      disabled={isViewMode}
                      placeholder="e.g. Fibers"
                      className={`w-full px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                          ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                          : 'border-gray-300'
                        }`}
                    />
                  </td>

                  {/* Visible Count */}
                  <td className="px-6 py-4 border-r">
                    <input
                      type="number"
                      min="0"
                      value={row.visibleCount}
                      onChange={(e) => updateRow(row.id, 'visibleCount', e.target.value)}
                      disabled={isViewMode}
                      className={`w-24 px-3 py-2 text-center border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                          ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                          : 'border-gray-300'
                        }`}
                      placeholder="0"
                    />
                  </td>

                  {/* Tolerance */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Operator Dropdown */}
                      <div className="relative">
                        <select
                          value={row.toleranceOperator}
                          onChange={(e) => updateRow(row.id, 'toleranceOperator', e.target.value as any)}
                          disabled={isViewMode}
                          className={`appearance-none bg-white border rounded-md px-4 py-2 pr-8 text-center font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                              ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                              : 'hover:border-gray-400'
                            }`}
                        >
                          {operators.map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-4 h-4 pointer-events-none text-gray-500" />
                      </div>

                      {/* Tolerance Value */}
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.toleranceValue}
                        onChange={(e) => updateRow(row.id, 'toleranceValue', e.target.value)}
                        disabled={isViewMode}
                        className={`w-24 px-3 py-2 text-center border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                            ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                            : 'border-gray-300'
                          }`}
                        placeholder="5"
                      />

                      {/* Auto Text */}
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {row.name.trim() ? `${row.name.toLowerCase()} must be clearly visible` : 'objects must be clearly visible'}
                      </span>
                    </div>
                  </td>

                  {/* Delete Button */}
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

        {/* Add Row Button */}
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

      {/* Optional Info */}
      {/* <div className="bg-amber-50 border border-amber-300 rounded-lg p-6">
        <p className="text-sm text-amber-900 font-medium">
          Note: All objects must be clearly visible at an average glandular dose less than 3 mGy
        </p>
      </div> */}
    </div>
  );
};

export default ImagingPhantom;