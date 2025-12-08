// components/TestTables/HighContrastResolutionForCTScan.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createHighContrastResolutionForCTScan,
  getHighContrastResolutionForCTScan,
  getHighContrastResolutionByServiceIdForCTScan,
  updateHighContrastResolutionForCTScan,
} from '../../../../../../api';

// Table 1: Parameters
interface ParamRow {
  id: string;
  parameter: string;
  value: string;
}

// Table 2: Results
interface ResultRow {
  id: string;
  size: string;
  value: string;
  unit: string;
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const HighContrastResolutionForCTScan: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* ==================== Table 1: Parameters ==================== */
  const [paramRows, setParamRows] = useState<ParamRow[]>([
    { id: '1', parameter: 'Line Pairs (lp/mm)', value: '10' },
  ]);

  /* ==================== Table 2: Results ==================== */
  const [resultRows, setResultRows] = useState<ResultRow[]>([
    { id: '1', size: '1.0', value: 'Visible', unit: 'lp/mm' },
  ]);

  /* ==================== Tolerance ==================== */
  const [tolerance, setTolerance] = useState<string>('±10%');

  // Load existing test data
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;

        if (propTestId) {
          data = await getHighContrastResolutionForCTScan(propTestId);
        } else {
          data = await getHighContrastResolutionByServiceIdForCTScan(serviceId);
        }

        if (data) {
          setTestId(data._id || data.testId);
          if (data.table1 && Array.isArray(data.table1) && data.table1.length > 0) {
            setParamRows(
              data.table1.map((row: any, idx: number) => ({
                id: String(idx + 1),
                parameter: row.parameter || '',
                value: row.value || '',
              }))
            );
          }
          if (data.table2 && Array.isArray(data.table2) && data.table2.length > 0) {
            setResultRows(
              data.table2.map((row: any, idx: number) => ({
                id: String(idx + 1),
                size: row.size || '',
                value: row.value || '',
                unit: row.unit || '',
              }))
            );
          }
          if (data.tolerance) setTolerance(data.tolerance);
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Load failed:", err);
        setIsSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [propTestId, serviceId]);

  // Save / Update
  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      table1: paramRows.map(row => ({
        parameter: row.parameter.trim(),
        value: row.value.trim(),
      })),
      table2: resultRows.map(row => ({
        size: row.size.trim(),
        value: row.value.trim(),
        unit: row.unit.trim(),
      })),
      tolerance: tolerance.trim(),
    };

    try {
      if (testId) {
        await updateHighContrastResolutionForCTScan(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createHighContrastResolutionForCTScan(serviceId, payload);
        const newId = res.data?._id || res.data?.testId;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success("Saved successfully!");
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => setIsEditing(true);
  const isViewOnly = isSaved && !isEditing;

  const buttonText = !isSaved ? 'Save Test' : isEditing ? 'Update Test' : 'Edit Test';
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

  const addParamRow = () => {
    if (isViewOnly) return;
    setParamRows((prev) => [
      ...prev,
      { id: Date.now().toString(), parameter: '', value: '' },
    ]);
  };

  const removeParamRow = (id: string) => {
    if (isViewOnly || paramRows.length <= 1) return;
    setParamRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateParamRow = (id: string, field: 'parameter' | 'value', newValue: string) => {
    if (isViewOnly) return;
    setParamRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: newValue } : row
      )
    );
  };

  const addResultRow = () => {
    if (isViewOnly) return;
    setResultRows((prev) => [
      ...prev,
      { id: Date.now().toString(), size: '', value: '', unit: '' },
    ]);
  };

  const removeResultRow = (id: string) => {
    if (isViewOnly || resultRows.length <= 1) return;
    setResultRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateResultRow = (
    id: string,
    field: 'size' | 'value' | 'unit',
    newValue: string
  ) => {
    if (isViewOnly) return;
    setResultRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: newValue } : row
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          High Contrast Resolution for CT Scan
        </h2>
        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewOnly
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
              {buttonText}
            </>
          )}
        </button>
      </div>

      {/* ==================== Table 1: Parameters ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Test Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Parameter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Value
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paramRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.parameter}
                      onChange={(e) => updateParamRow(row.id, 'parameter', e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g. Line Pairs (lp/mm)"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateParamRow(row.id, 'value', e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g. 10"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {paramRows.length > 1 && !isViewOnly && (
                      <button
                        onClick={() => removeParamRow(row.id)}
                        className="text-red-600 hover:bg-red-100 p-1 rounded"
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
        <div className="px-6 py-3 bg-gray-50 border-t">
          {!isViewOnly && (
            <button
              onClick={addParamRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Parameter
            </button>
          )}
        </div>
      </div>

      {/* ==================== Table 2: Results ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-green-50 border-b">
          Resolution Results
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Size (mm)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.size}
                      onChange={(e) => updateResultRow(row.id, 'size', e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="1.0"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateResultRow(row.id, 'value', e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="Visible"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateResultRow(row.id, 'unit', e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="lp/mm"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {resultRows.length > 1 && !isViewOnly && (
                      <button
                        onClick={() => removeResultRow(row.id)}
                        className="text-red-600 hover:bg-red-100 p-1 rounded"
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
        <div className="px-6 py-3 bg-gray-50 border-t">
          {!isViewOnly && (
            <button
              onClick={addResultRow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Result
            </button>
          )}
        </div>
      </div>

      {/* ==================== Tolerance (Outside) ==================== */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance for Resolution:
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            disabled={isViewOnly}
            className={`flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="e.g. ±10% or ≥10 lp/mm"
          />
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolutionForCTScan;
