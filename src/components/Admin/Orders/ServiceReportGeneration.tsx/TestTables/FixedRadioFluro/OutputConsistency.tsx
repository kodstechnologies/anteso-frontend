// src/components/TestTables/OutputConsistencyForCArm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createOutputConsistencyForCArm,
  getOutputConsistencyForCArm,
  getOutputConsistencyByServiceIdForCArm,
  updateOutputConsistencyForCArm,
} from "../../../../../../api";

interface OutputRow {
  id: string;
  ffd: string;
  outputs: string[];
  mean: string;
  cov: string;
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const OutputConsistency: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Single FFD for the entire test (top input)
  const [ffd, setFfd] = useState<string>('100');

  // Dynamic measurement rows
  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      ffd: '',
      outputs: ['', '', '', '', ''],
      mean: '',
      cov: '',
    },
  ]);

  const [headers, setHeaders] = useState<string[]>([
    'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
  ]);

  const [tolerance, setTolerance] = useState<string>('2.0');

  // Auto-calculate Mean & COV
  useEffect(() => {
    setOutputRows((rows) =>
      rows.map((row) => {
        const nums = row.outputs
          .filter((v) => v.trim() !== '')
          .map((v) => parseFloat(v))
          .filter((n) => !isNaN(n));

        if (nums.length === 0) {
          return { ...row, mean: '', cov: '' };
        }

        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        let cov = 0;

        if (nums.length > 1) {
          const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
          cov = Math.sqrt(variance) / mean;
        }

        return {
          ...row,
          mean: mean.toFixed(3),
          cov: cov.toFixed(4),
        };
      })
    );
  }, [outputRows.map((r) => r.outputs.join(',')).join('|')]);

  // Final Pass/Fail
  const finalRemark = useMemo(() => {
    if (!tolerance || outputRows.length === 0) return '';
    const tol = parseFloat(tolerance);
    if (isNaN(tol)) return '';

    const allPass = outputRows.every((row) => {
      if (!row.cov) return true;
      return parseFloat(row.cov) * 100 <= tol;
    });

    return allPass ? 'Pass' : 'Fail';
  }, [outputRows, tolerance]);

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;
        if (propTestId) {
          data = await getOutputConsistencyForCArm(propTestId);
        } else {
          data = await getOutputConsistencyByServiceIdForCArm(serviceId);
        }

        if (data) {
          setTestId(data._id || data.testId);
          setFfd(data.ffd || '100');
          setTolerance(data.tolerance || '2.0');
          setHeaders(data.measurementHeaders || headers);

          setOutputRows(
            data.outputRows?.map((row: any) => ({
              id: Date.now().toString() + Math.random(),
              ffd: row.ffd || '',
              outputs: row.outputs || Array(headers.length).fill(''),
              mean: row.mean || '',
              cov: row.cov || '',
            })) || outputRows
          );
          setIsSaved(true);
        }
      } catch (err) {
        console.error("Load failed:", err);
        setIsSaved(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [propTestId, serviceId]);

  // Save / Update
  const handleSave = async () => {
    if (!serviceId) return toast.error('Service ID missing');
    if (!ffd.trim()) return toast.error('Please enter FFD');

    setIsSaving(true);

    const payload = {
      ffd: ffd.trim(),
      outputRows: outputRows.map((row) => ({
        ffd: row.ffd.trim(),
        outputs: row.outputs.map((v) => v.trim()),
        mean: row.mean || '',
        cov: row.cov || '',
      })),
      measurementHeaders: headers,
      tolerance: tolerance.trim(),
    };

    try {
      let result;
      if (testId) {
        result = await updateOutputConsistencyForCArm(testId, payload);
        toast.success('Test updated successfully!');
      } else {
        result = await createOutputConsistencyForCArm(serviceId, payload);
        const newId = result.data?._id || result.data?.testId;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success('Test saved successfully!');
      }
      setIsSaved(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => setIsSaved(false);
  const isViewMode = isSaved;

  // Column Management
  const addColumn = () => {
    if (isViewMode) return;
    const newHeader = `Meas ${headers.length + 1}`;
    setHeaders((prev) => [...prev, newHeader]);
    setOutputRows((rows) =>
      rows.map((r) => ({ ...r, outputs: [...r.outputs, ''] }))
    );
  };

  const removeColumn = (idx: number) => {
    if (isViewMode || headers.length <= 1) return;
    setHeaders((prev) => prev.filter((_, i) => i !== idx));
    setOutputRows((rows) =>
      rows.map((r) => ({
        ...r,
        outputs: r.outputs.filter((_, i) => i !== idx),
      }))
    );
  };

  const updateHeader = (idx: number, value: string) => {
    if (isViewMode) return;
    setHeaders((prev) => {
      const copy = [...prev];
      copy[idx] = value || `Meas ${idx + 1}`;
      return copy;
    });
  };

  // Row Management
  const addRow = () => {
    if (isViewMode) return;
    setOutputRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ffd: '',
        outputs: Array(headers.length).fill(''),
        mean: '',
        cov: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (isViewMode || outputRows.length <= 1) return;
    setOutputRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'ffd' | number, value: string) => {
    if (isViewMode) return;
    setOutputRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === 'ffd') return { ...row, ffd: value };
        const newOutputs = [...row.outputs];
        newOutputs[field] = value;
        return { ...row, outputs: newOutputs };
      })
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <span className="ml-4 text-lg">Loading test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Output Consistency Test</h2>
        <button
          onClick={isViewMode ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewMode
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isViewMode ? <Edit3 className="w-6 h-6" /> : <Save className="w-6 h-6" />}
              {isViewMode ? 'Edit Test' : testId ? 'Update Test' : 'Save Test'}
            </>
          )}
        </button>
      </div>

      {/* FFD Input */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-2xl p-8 shadow-lg">
        <h3 className="text-xl font-bold text-teal-900 mb-6">Test Geometry</h3>
        <div className="flex items-center gap-6 max-w-md">
          <label className="text-lg font-semibold text-gray-800">FFD (Focus-to-Detector Distance):</label>
          <input
            type="text"
            value={ffd}
            onChange={(e) => setFfd(e.target.value)}
            disabled={isViewMode}
            className={`w-48 px-6 py-4 text-2xl font-bold text-center border-4 rounded-xl focus:ring-4 focus:ring-teal-400 transition-all ${isViewMode ? 'bg-gray-100 border-gray-300 text-gray-600' : 'border-teal-500 bg-white'
              }`}
            placeholder="100"
          />
          <span className="text-3xl font-extrabold text-teal-700">cm</span>
        </div>
      </div>

      {/* Output Table */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        <h3 className="px-8 py-5 text-xl font-bold bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          Radiation Output Measurements (mGy)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r">FFD (cm)</th>
                <th colSpan={headers.length} className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase border-r relative">
                  <div className="flex items-center justify-between pr-10">
                    <span>Radiation Output (mGy)</span>
                    {!isViewMode && (
                      <button onClick={addColumn} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r">Mean</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r">COV (%)</th>
                <th className="w-12" />
              </tr>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-700 border-r">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        disabled={isViewMode}
                        className="w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      {headers.length > 1 && !isViewMode && (
                        <button onClick={() => removeColumn(i)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {outputRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.ffd}
                      onChange={(e) => updateCell(row.id, 'ffd', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 text-center font-medium border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </td>
                  {row.outputs.map((val, idx) => (
                    <td key={idx} className="px-3 py-4 border-r text-center">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateCell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className="w-24 px-3 py-2 text-center border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 border-r text-center font-semibold text-blue-700">
                    {row.mean || '—'}
                  </td>
                  <td className="px-6 py-4 border-r text-center font-semibold text-purple-700">
                    {row.cov ? (parseFloat(row.cov) * 100).toFixed(2) + '%' : '—'}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {outputRows.length > 1 && !isViewMode && (
                      <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isViewMode && (
          <div className="p-6 bg-gray-50 border-t">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Measurement Set
            </button>
          </div>
        )}
      </div>

      {/* Tolerance & Final Result */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-4 border-purple-400 rounded-3xl p-10 shadow-2xl text-center">
        <h3 className="text-2xl font-bold text-purple-900 mb-8">Acceptance Criteria</h3>
        <div className="flex items-center justify-center gap-6 text-xl">
          <span className="font-semibold text-purple-800">Coefficient of Variation (COV) must be ≤</span>
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            disabled={isViewMode}
            className="w-32 px-6 py-4 text-center text-3xl font-extrabold border-4 border-purple-600 rounded-xl focus:ring-8 focus:ring-purple-300"
            placeholder="2.0"
          />
          <span className="text-4xl font-extrabold text-purple-700">%</span>
        </div>

        <div className="mt-12">
          <p className="text-3xl font-bold text-purple-900">
            Final Result:{' '}
            <span
              className={`inline-block px-12 py-6 rounded-full text-4xl font-bold border-8 ${finalRemark === 'Pass'
                  ? 'bg-green-500 text-white border-green-600'
                  : finalRemark === 'Fail'
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-gray-300 text-gray-700 border-gray-400'
                }`}
            >
              {finalRemark || 'Pending'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OutputConsistency