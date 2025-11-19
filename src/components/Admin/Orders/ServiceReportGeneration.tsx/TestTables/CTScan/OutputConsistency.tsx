import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import {
  addOutputConsistency,
  getOutputConsistencyByTestId,
  updateOutputConsistency,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
  id: string;
  mas: string;
  sliceThickness: string;
  time: string;
}

interface OutputRow {
  id: string;
  kvp: string;
  outputs: string[];
  mean: string;
  cov: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const OutputConsistency: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1 - Fixed parameters
  const [parameters, setParameters] = useState<Table1Row>({
    id: '1',
    mas: '',
    sliceThickness: '',
    time: '',
  });

  // Table 2 - Dynamic rows
  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kvp: '',
      outputs: ['', '', '', '', ''],
      mean: '',
      cov: '',
    },
  ]);

  const [headers, setHeaders] = useState<string[]>([
    'Meas 1',
    'Meas 2',
    'Meas 3',
    'Meas 4',
    'Meas 5',
  ]);

  const [tolerance, setTolerance] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Auto-calculate Mean & COV
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
          const variance =
            nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            (nums.length - 1);
          cov = Math.sqrt(variance) / mean; // This is Coefficient of Variation (COV)
        }

        return {
          ...row,
          mean: mean.toFixed(3),        // ← 3 decimal places
          cov: cov.toFixed(4),          // ← decimal (not %), 4 digits precision
        };
      })
    );
  }, [outputRows.map((r) => r.outputs.join(',')).join('|')]);
  // Auto Remark: Pass if all COVs ≤ tolerance
  const remark = useMemo(() => {
    if (!tolerance || !hasSaved) return '';
    const tol = parseFloat(tolerance);
    if (isNaN(tol)) return '';

    const allPass = outputRows.every((row) => {
      if (!row.cov) return true;
      return parseFloat(row.cov) * 100 <= tol;
    });

    return allPass ? 'Pass' : 'Fail';
  }, [outputRows, tolerance, hasSaved]);

  // Load existing data
  useEffect(() => {
    if (!testId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        console.log("-----------------------entered otput consistency")
        const { data } = await getOutputConsistencyByTestId(testId);

        setParameters(data.parameters || { id: '1', mas: '', sliceThickness: '', time: '' });
        setOutputRows(data.outputRows || []);
        setHeaders(data.measurementHeaders || headers);
        setTolerance(data.tolerance || '');
        setHasSaved(true);
        setIsEditing(false);
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load test data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [testId]);

  // Save / Update
  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);

    const payload = {
      parameters: {
        mas: parameters.mas.trim(),
        sliceThickness: parameters.sliceThickness.trim(),
        time: parameters.time.trim(),
      },
      outputRows: outputRows.map((row) => ({
        kvp: row.kvp.trim(),
        outputs: row.outputs.map(v => v.trim()),
        mean: row.mean || "",
        cov: row.cov || "",
      })),
      measurementHeaders: headers,
      tolerance: tolerance.trim(),
    };

    try {
      let res;
      if (testId) {
        res = await updateOutputConsistency(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addOutputConsistency(serviceId, payload);
        setTestId(res.data.testId);
        toast.success('Saved successfully!');
      }
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
    if (!hasSaved) return;
    setIsEditing(true);
  };

  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  // Dynamic handlers
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

  const addRow = () => {
    if (isViewMode) return;
    setOutputRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        kvp: '',
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

  const updateOutputCell = (rowId: string, field: 'kvp' | number, value: string) => {
    if (isViewMode) return;
    setOutputRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === 'kvp') return { ...row, kvp: value };
        const newOutputs = [...row.outputs];
        newOutputs[field] = value;
        return { ...row, outputs: newOutputs };
      })
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
    <div className="p-6 max-w-full mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Output Consistency</h2>

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

      {/* Table 1: Test Parameters */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          Test Parameters
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">mAs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Slice Thickness (mm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time (s)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={parameters.mas}
                  onChange={(e) => setParameters((p) => ({ ...p, mas: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  placeholder="100"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={parameters.sliceThickness}
                  onChange={(e) => setParameters((p) => ({ ...p, sliceThickness: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  placeholder="5"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={parameters.time}
                  onChange={(e) => setParameters((p) => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  placeholder="1.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Radiation Output */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          Radiation Output Consistency
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  kVp
                </th>
                <th
                  colSpan={headers.length}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r relative"
                >
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    {!isViewMode && (
                      <button onClick={addColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  Mean (X̄)
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  COV (%)
                </th>
                <th rowSpan={2} className="w-10" />
              </tr>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        disabled={isViewMode}
                        className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                      />
                      {headers.length > 1 && !isViewMode && (
                        <button onClick={() => removeColumn(i)} className="text-red-600 hover:bg-red-100 p-0.5 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outputRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateOutputCell(row.id, 'kvp', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      placeholder="120"
                    />
                  </td>
                  {row.outputs.map((val, idx) => (
                    <td key={idx} className="px-2 py-2 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateOutputCell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 border-r text-center font-medium">
                    {row.mean ? parseFloat(row.mean).toFixed(3) : '-'}
                  </td>
                  <td className="px-4 py-2 border-r text-center font-medium">
                    {row.cov ? parseFloat(row.cov).toFixed(4) : '-'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {outputRows.length > 1 && !isViewMode && (
                      <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-1 rounded">
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
          {!isViewMode && (
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          )}
        </div>
      </div>

      {/* Tolerance & Final Remark */}
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance (COV ≤)
        </label>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">Less than or equal to</span>
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            disabled={isViewMode}
            className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            placeholder="2.0"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Final Result:</span>
          <span
            className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${remark === 'Pass'
              ? 'bg-green-100 text-green-800'
              : remark === 'Fail'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-500'
              }`}
          >
            {remark || '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OutputConsistency;