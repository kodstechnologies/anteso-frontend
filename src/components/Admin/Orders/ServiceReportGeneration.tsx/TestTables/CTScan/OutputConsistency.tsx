import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import {
  addOutputConsistency,
  getOutputConsistencyByTestId,
  getOutputConsistencyByServiceId,
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
  remark?: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string;
  tubeId?: string | null;
  onRefresh?: () => void;
  csvData?: any[];
}

const OutputConsistency: React.FC<Props> = ({ serviceId, testId: propTestId, tubeId, onRefresh, csvData }) => {
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

  const [measurementCount, setMeasurementCount] = useState<number>(5);

  const [tolerance, setTolerance] = useState<{
    operator: '<=' | '<' | '>=' | '>';
    value: string;
  }>({
    operator: '<=',
    value: '0.05',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Update output rows when measurement count changes
  useEffect(() => {
    setOutputRows((prev) =>
      prev.map((row) => {
        const diff = measurementCount - row.outputs.length;
        if (diff > 0) {
          return {
            ...row,
            outputs: [...row.outputs, ...Array(diff).fill('')],
          };
        }
        if (diff < 0) {
          return { ...row, outputs: row.outputs.slice(0, measurementCount) };
        }
        return row;
      })
    );
  }, [measurementCount]);

  // === CSV Data Injection ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Table 1: Parameters (mAs, Slice, Time)
      // Look for TestConditions_mAs, TestConditions_SliceThickness, TestConditions_Time
      const mas = csvData.find(r => r['Field Name'] === 'TestConditions_mAs' || r['Field Name'] === 'mAs')?.['Value'];
      const st = csvData.find(r => r['Field Name'] === 'TestConditions_SliceThickness' || r['Field Name'] === 'SliceThickness')?.['Value'];
      const time = csvData.find(r => r['Field Name'] === 'TestConditions_Time' || r['Field Name'] === 'Time')?.['Value'];

      if (mas || st || time) {
        setParameters(prev => ({
          ...prev,
          mas: mas || prev.mas,
          sliceThickness: st || prev.sliceThickness,
          time: time || prev.time
        }));
      }

      // Table 2: Output Measurements
      // Generator produces: OutputRow_kvp (e.g. 120), Result (e.g. 100.5)
      // Multiple rows expected.
      const rowIndices = [...new Set(csvData
        .filter(r => r['Field Name'] === 'OutputRow_kvp' || r['Field Name'] === 'Result')
        .map(r => parseInt(r['Row Index']))
        .filter(i => !isNaN(i) && i > 0)
      )];

      if (rowIndices.length > 0) {
        const newRows = rowIndices.map(idx => {
          const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
          const kvp = rowData.find(r => r['Field Name'] === 'OutputRow_kvp')?.['Value'] || '';

          // Support multiple measurements (Meas 1, Meas 2, ...)
          const outputs = Array(measurementCount).fill('');
          for (let i = 0; i < measurementCount; i++) {
            const val = rowData.find(r => r['Field Name'] === `Result_${i}`)?.['Value'];
            if (val) outputs[i] = val;
          }

          return {
            id: Date.now().toString() + Math.random(),
            kvp,
            outputs,
            mean: '',
            cov: '',
            remark: '' as const
          };
        });
        setOutputRows(newRows);
      }

      // Tolerance
      const tolVal = csvData.find(r => r['Field Name'] === 'Tolerance')?.['Value'];
      if (tolVal) {
        setTolerance(prev => ({ ...prev, value: tolVal }));
      }

      if (!testId) {
        setIsEditing(true);
      }
    }
  }, [csvData]);

  // Auto-calculate Mean & COV with per-row remarks
  const rowsWithCalc = useMemo(() => {
    // Tolerance value is stored as decimal (e.g., 0.05 for 5%)
    const tolValueDecimal = parseFloat(tolerance.value) || 0.05;

    return outputRows.map((row): OutputRow & { remark: 'Pass' | 'Fail' | '' } => {
      const nums = row.outputs
        .filter((v) => v.trim() !== '')
        .map((v) => parseFloat(v))
        .filter((n) => !isNaN(n) && n > 0);

      if (nums.length === 0) {
        return { ...row, mean: '', cov: '', remark: '' };
      }

      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;

      let cov = 0;
      if (nums.length > 1) {
        const variance =
          nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          nums.length;
        const stdDev = Math.sqrt(variance);
        cov = mean > 0 ? stdDev / mean : 0; // CoV as decimal
      }

      // Compare CoV (decimal) with tolerance (decimal)
      let passes = false;
      if (tolerance.operator === '<=' || tolerance.operator === '<') {
        passes = cov <= tolValueDecimal;
      } else {
        passes = cov >= tolValueDecimal;
      }

      return {
        ...row,
        mean: mean.toFixed(4),
        cov: cov.toFixed(4), // Display CoV as decimal (not percentage)
        remark: passes ? 'Pass' : 'Fail',
      };
    });
  }, [outputRows, tolerance]);

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let data = null;

        if (propTestId) {
          const response = await getOutputConsistencyByTestId(propTestId);
          data = response;
        } else {
          data = await getOutputConsistencyByServiceId(serviceId);
        }

        if (data) {
          setTestId(data._id || propTestId);
          setParameters(data.parameters || { id: '1', mas: '', sliceThickness: '', time: '' });

          if (data.outputRows && data.outputRows.length > 0) {
            const firstRow = data.outputRows[0];
            const numMeas = firstRow.outputs?.length || 5;
            setMeasurementCount(numMeas);
            setOutputRows(
              data.outputRows.map((row: any) => ({
                id: Date.now().toString() + Math.random(),
                kvp: row.kvp || '',
                outputs: row.outputs || Array(numMeas).fill(''),
                mean: row.mean || '',
                cov: row.cov || '',
                remark: row.remark || '',
              }))
            );
          }

          if (data.tolerance) {
            if (typeof data.tolerance === 'object') {
              setTolerance({
                operator: data.tolerance.operator || '<=',
                value: data.tolerance.value || '2.0',
              });
            } else {
              // Legacy format: just a string value
              setTolerance({
                operator: '<=',
                value: data.tolerance || '2.0',
              });
            }
          }
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setHasSaved(false);
          setIsEditing(true);
        }
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load test data');
        setHasSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId, propTestId]);

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
      outputRows: rowsWithCalc.map((row) => ({
        kvp: row.kvp.trim(),
        outputs: row.outputs.map(v => v.trim()),
        mean: row.mean || "",
        cov: row.cov || "",
        remark: row.remark || "",
      })),
      tolerance,
    };

    try {
      let res;
      if (testId) {
        res = await updateOutputConsistency(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addOutputConsistency(serviceId, payload);
        const newId = res.data?.testId || res.data?.data?.testId || res.data?._id;
        if (newId) {
          setTestId(newId);
        }
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
  const updateMeasurementCount = (count: number) => {
    if (count < 3 || count > 10) return;
    setMeasurementCount(count);
  };

  const addMeasurementColumn = (afterIndex: number) => {
    if (measurementCount >= 10) {
      toast.error('Maximum 10 measurements allowed');
      return;
    }
    const newCount = measurementCount + 1;
    setMeasurementCount(newCount);
    setOutputRows((prev) =>
      prev.map((row) => {
        const newOutputs = [...row.outputs];
        newOutputs.splice(afterIndex + 1, 0, '');
        return {
          ...row,
          outputs: newOutputs,
        };
      })
    );
  };

  const removeMeasurementColumn = (index: number) => {
    if (measurementCount <= 3) {
      toast.error('Minimum 3 measurements required');
      return;
    }
    const newCount = measurementCount - 1;
    setMeasurementCount(newCount);
    setOutputRows((prev) =>
      prev.map((row) => ({
        ...row,
        outputs: row.outputs.filter((_, i) => i !== index),
      }))
    );
  };

  const addRow = () => {
    if (isViewMode) return;
    setOutputRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        kvp: '',
        outputs: Array(measurementCount).fill(''),
        mean: '',
        cov: '',
        remark: '',
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
    <div className="p-6 space-y-10">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Reproducibility of Radiation Output (Consistency Test)
        </h2>
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : isViewMode ? (
            <>
              <Edit3 className="w-4 h-4" />
              Edit
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {testId ? 'Update' : 'Save'} Test
            </>
          )}
        </button>
      </div>

      {/* Table 1: Test Parameters */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-700">Test Parameters</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium text-gray-700">mAs:</label>
              <input
                type="text"
                value={parameters.mas}
                onChange={(e) => setParameters((p) => ({ ...p, mas: e.target.value }))}
                disabled={isViewMode}
                className={`w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="100"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium text-gray-700">Slice Thickness (mm):</label>
              <input
                type="text"
                value={parameters.sliceThickness}
                onChange={(e) => setParameters((p) => ({ ...p, sliceThickness: e.target.value }))}
                disabled={isViewMode}
                className={`w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="5"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium text-gray-700">Time (s):</label>
              <input
                type="text"
                value={parameters.time}
                onChange={(e) => setParameters((p) => ({ ...p, time: e.target.value }))}
                disabled={isViewMode}
                className={`w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="1.0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table 2: Radiation Output */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-700">
            Radiation Output Measurements (mGy)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 border-r">
                  kVp
                </th>
                {Array.from({ length: measurementCount }, (_, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r relative"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span>Meas {i + 1}</span>
                        {!isViewMode && measurementCount < 10 && (
                          <button
                            onClick={() => addMeasurementColumn(i)}
                            className="text-green-600 hover:bg-green-100 p-0.5 rounded transition"
                            title="Add column after this"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {!isViewMode && measurementCount > 3 && (
                        <button
                          onClick={() => removeMeasurementColumn(i)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded transition"
                          title="Remove this column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600 border-r">
                  Average
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600">
                  CoV / Result
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rowsWithCalc.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateOutputCell(row.id, 'kvp', e.target.value)}
                      disabled={isViewMode}
                      className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="120"
                    />
                  </td>
                  {row.outputs.map((val, idx) => (
                    <td key={idx} className="px-2 py-4 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateOutputCell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-20 px-2 py-1.5 text-center border rounded text-xs focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-5 py-4 text-center font-semibold border-r bg-blue-50">
                    {row.mean || '—'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${row.remark === 'Pass'
                        ? 'bg-green-100 text-green-800'
                        : row.remark === 'Fail'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {row.cov ? `${row.cov} → ${row.remark}` : '—'}
                    </span>
                  </td>
                  <td className="px-3 text-center">
                    {outputRows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        disabled={isViewMode}
                        className="text-red-600 hover:bg-red-50 p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add New Technique
            </button>
          )}
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-white rounded-lg border p-6 max-w-md shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Acceptance Criteria</h3>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Coefficient of Variation (CoV)</span>
          <select
            value={tolerance.operator}
            onChange={(e) => {
              setTolerance({ ...tolerance, operator: e.target.value as any });
            }}
            disabled={isViewMode}
            className={`px-4 py-2 border rounded font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          >
            <option value="<=">≤</option>
            <option value="<">&lt;</option>
            <option value=">=">≥</option>
            <option value=">">&gt;</option>
          </select>
          <input
            type="text"
            value={tolerance.value}
            onChange={(e) => {
              setTolerance({
                ...tolerance,
                value: e.target.value.replace(/[^0-9.]/g, ''),
              });
            }}
            disabled={isViewMode}
            className={`w-24 px-4 py-2 text-center border-2 border-blue-500 rounded font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
        </div>
        {/* <p className="text-sm text-gray-500 mt-3">
          Reference: IEC 61223-3-1 & AERB Safety Code
        </p> */}
      </div>
    </div>
  );
};

export default OutputConsistency;