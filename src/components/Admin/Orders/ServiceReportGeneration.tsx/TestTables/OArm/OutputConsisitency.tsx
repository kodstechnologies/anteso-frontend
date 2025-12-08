// src/components/TestTables/OutputConsistencyForOArm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createOutputConsistencyForOArm,
  getOutputConsistencyForOArm,
  getOutputConsistencyByServiceIdForOArm,
  updateOutputConsistencyForOArm,
} from "../../../../../../api";

interface Parameters {
  id: string;
  ffd: string;
  time: string;
}

interface OutputRow {
  id: string;
  kvp: string;
  ma: string;
  outputs: string[];
  mean: string;
  cov: string;
  remark?: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const OutputConsistencyForOArm: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [parameters, setParameters] = useState<Parameters>({
    id: '1',
    ffd: '100',
    time: '1.0',
  });

  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kvp: '80',
      ma: '100',
      outputs: ['', '', '', '', ''],
      mean: '',
      cov: '',
      remark: '',
    },
  ]);

  const [headers, setHeaders] = useState<string[]>([
    'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
  ]);

  const [tolerance, setTolerance] = useState<string>('0.02'); // Decimal: 2% = 0.02

  // Auto-calculate Mean, COV (decimal), and Remark per row
  const processedRows = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.02;

    return outputRows.map(row => {
      const nums = row.outputs
        .filter(v => v.trim() !== '')
        .map(v => parseFloat(v))
        .filter(n => !isNaN(n));

      if (nums.length === 0) {
        return { ...row, mean: '', cov: '', remark: '' };
      }

      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      let cov = 0;
      if (nums.length > 1) {
        const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
        cov = Math.sqrt(variance) / mean;
      }

      const remark = cov <= tol ? 'Pass' : 'Fail';

      return {
        ...row,
        mean: mean.toFixed(3),
        cov: cov.toFixed(3),
        remark,
      };
    });
  }, [outputRows, tolerance]);

  // Final Result (overall)
  const finalRemark = useMemo(() => {
    if (!isSaved || processedRows.length === 0) return '';
    return processedRows.every(r => r.remark === 'Pass' || r.remark === '') ? 'Pass' : 'Fail';
  }, [processedRows, isSaved]);

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;
        if (propTestId) {
          data = await getOutputConsistencyForOArm(propTestId);
        } else {
          data = await getOutputConsistencyByServiceIdForOArm(serviceId);
        }

        if (data) {
          setTestId(data._id || data.testId);
          setParameters({
            id: '1',
            ffd: data.parameters?.ffd || '100',
            time: data.parameters?.time || '1.0',
          });
          setOutputRows(
            data.outputRows?.map((row: any) => ({
              id: Date.now().toString() + Math.random(),
              kvp: row.kvp || '',
              ma: row.ma || '100',
              outputs: row.outputs || Array(headers.length).fill(''),
              mean: row.mean || '',
              cov: row.cov || '',
              remark: row.remark || '',
            })) || outputRows
          );
          setHeaders(data.measurementHeaders || headers);
          setTolerance(data.tolerance || '0.02');
          setIsSaved(true);
        } else {
          setIsSaved(false);
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
    if (!serviceId) return toast.error('Service ID is missing');
    setIsSaving(true);

    const payload = {
      parameters: {
        ffd: parameters.ffd.trim(),
        time: parameters.time.trim(),
      },
      outputRows: processedRows.map(row => ({
        kvp: row.kvp.trim(),
        ma: row.ma.trim(),
        outputs: row.outputs.map(v => v.trim()),
        mean: row.mean || "",
        cov: row.cov || "",
        remark: row.remark || "",
      })),
      measurementHeaders: headers,
      tolerance: tolerance.trim(),
    };

    try {
      let result;
      if (testId) {
        result = await updateOutputConsistencyForOArm(testId, payload);
        toast.success('Updated successfully!');
      } else {
        result = await createOutputConsistencyForOArm(serviceId, payload);
        const newId = result.data?._id || result.data?.testId;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success('Saved successfully!');
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

  // Dynamic handlers
  const addColumn = () => {
    if (isViewMode) return;
    setHeaders(prev => [...prev, `Meas ${prev.length + 1}`]);
    setOutputRows(rows => rows.map(r => ({ ...r, outputs: [...r.outputs, ''] })));
  };

  const removeColumn = (idx: number) => {
    if (isViewMode || headers.length <= 1) return;
    setHeaders(prev => prev.filter((_, i) => i !== idx));
    setOutputRows(rows => rows.map(r => ({ ...r, outputs: r.outputs.filter((_, i) => i !== idx) })));
  };

  const updateHeader = (idx: number, value: string) => {
    if (isViewMode) return;
    setHeaders(prev => prev.map((h, i) => i === idx ? (value || `Meas ${idx + 1}`) : h));
  };

  const addRow = () => {
    if (isViewMode) return;
    setOutputRows(prev => [...prev, {
      id: Date.now().toString(),
      kvp: '',
      ma: '100',
      outputs: Array(headers.length).fill(''),
      mean: '',
      cov: '',
      remark: '',
    }]);
  };

  const removeRow = (id: string) => {
    if (isViewMode || outputRows.length <= 1) return;
    setOutputRows(prev => prev.filter(r => r.id !== id));
  };

  const updateOutputCell = (rowId: string, field: 'kvp' | 'ma' | number, value: string) => {
    if (isViewMode) return;
    setOutputRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      if (field === 'kvp') return { ...row, kvp: value };
      if (field === 'ma') return { ...row, ma: value };
      const outputs = [...row.outputs];
      outputs[field] = value;
      return { ...row, outputs };
    }));
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
          onClick={isViewMode ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' :
              isViewMode ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-teal-600 hover:bg-teal-700'
            }`}
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>{isViewMode ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isViewMode ? 'Edit' : testId ? 'Update' : 'Save'} Test
            </>
          )}
        </button>
      </div>

      {/* Table 1: FFD & Time */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          Test Parameters
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">FFD (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time (s)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={parameters.ffd}
                  onChange={(e) => setParameters(p => ({ ...p, ffd: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="100"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={parameters.time}
                  onChange={(e) => setParameters(p => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="1.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Output Consistency with Remark */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          Radiation Output Consistency
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">kVp</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mA</th>
                <th colSpan={headers.length} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r relative">
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    {!isViewMode && (
                      <button onClick={addColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">Mean (X̄)</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">COV</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">Remark</th>
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
                        className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
              {processedRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateOutputCell(row.id, 'kvp', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="80"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.ma}
                      onChange={(e) => updateOutputCell(row.id, 'ma', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="100"
                    />
                  </td>
                  {row.outputs.map((val, idx) => (
                    <td key={idx} className="px-2 py-2 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateOutputCell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 border-r text-center font-medium">
                    {row.mean || '-'}
                  </td>
                  <td className="px-4 py-2 border-r text-center font-medium">
                    {row.cov || '-'}
                  </td>
                  <td className="px-4 py-2 border-r text-center">
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${row.remark === 'Pass' ? 'bg-green-100 text-green-800' :
                        row.remark === 'Fail' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-500'
                      }`}>
                      {row.remark || '—'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {processedRows.length > 1 && !isViewMode && (
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
            <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          )}
        </div>
      </div>

      {/* Tolerance & Final Result */}
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance (COV Less than or equal to)
        </label>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">Less than or equal to</span>
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            disabled={isViewMode}
            className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="0.02"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Final Result:</span>
          <span className={`inline-flex px-6 py-3 text-lg font-bold rounded-full ${finalRemark === 'Pass' ? 'bg-green-100 text-green-800' :
              finalRemark === 'Fail' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-500'
            }`}>
            {finalRemark || '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OutputConsistencyForOArm;
