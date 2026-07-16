// components/TestTables/ConsistencyOfRadiationOutput.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addConsistencyOfRadiationOutputForRadiographyPortable,
  getConsistencyOfRadiationOutputByServiceIdForRadiographyPortable,
  updateConsistencyOfRadiationOutputForRadiographyPortable,
} from '../../../../../../api';

interface FCDData {
  value: string; // e.g. "100" cm
}

interface OutputMeasurement {
  value: string;
}

interface OutputRow {
  id: string;
  kv: string;
  mas: string;
  outputs: OutputMeasurement[];
  avg: string;
  cv: string;
  remark: 'Pass' | 'Fail' | '';
}

interface Tolerance {
  operator: '<=' | '<' | '>=' | '>';
  value: string; // e.g. "5.0"
}

interface Props {
  serviceId: string;
  testId?: string;
  onTestSaved?: (testId: string) => void;
  csvData?: any;
  refreshKey?: number;
}

const ConsistencyOfRadiationOutput: React.FC<Props> = ({
  serviceId,
  testId: propTestId,
  onTestSaved,
  csvData,
  refreshKey
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [ffd, setFFD] = useState<FCDData>({ value: '' });
  const [measurementCount, setMeasurementCount] = useState<number>(5);
  const [measurementHeaders, setMeasurementHeaders] = useState<string[]>([
    'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
  ]);

  const [tolerance, setTolerance] = useState<Tolerance>({
    operator: '<=',
    value: '0.05', // decimal, e.g. 0.05 for 5%
  });

  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kv: '80',
      mas: '100',
      outputs: Array(5).fill({ value: '' }),
      avg: '',
      cv: '',
      remark: '',
    },
  ]);

  // Calculate avg, CoV and remark – same formula as Radiography Fixed (CoV as decimal, no %)
  const rowsWithCalc = useMemo(() => {
    const tolValueDecimal = parseFloat(tolerance.value) || 0.05;

    return outputRows.map((row): OutputRow => {
      const values = row.outputs
        .map(m => parseFloat(m.value))
        .filter(v => !isNaN(v) && v > 0);

      if (values.length === 0) {
        return { ...row, avg: '', cv: '', remark: '' };
      }

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const covDecimal = avg > 0 ? (stdDev / avg) : 0;

      const passes =
        tolerance.operator === '<=' || tolerance.operator === '<'
          ? covDecimal <= tolValueDecimal
          : covDecimal >= tolValueDecimal;

      const remark: 'Pass' | 'Fail' = passes ? 'Pass' : 'Fail';

      return {
        ...row,
        avg: avg.toFixed(4),
        cv: covDecimal.toFixed(4), // CoV as decimal (no %)
        remark,
      };
    });
  }, [outputRows, tolerance]);

  // Handlers
  const updateFcd = (value: string) => {
    setFFD({ value });
    setIsSaved(false);
  };

  const updateMeasurementCount = (count: number) => {
    if (count < 3 || count > 10) return;
    setMeasurementCount(count);
    setMeasurementHeaders(prev => {
      const diff = count - prev.length;
      if (diff > 0) {
        return [
          ...prev,
          ...Array.from({ length: diff }, (_, i) => `Meas ${prev.length + i + 1}`),
        ];
      }
      if (diff < 0) {
        return prev.slice(0, count);
      }
      return prev;
    });

    setOutputRows(prev =>
      prev.map(row => {
        const diff = count - row.outputs.length;
        if (diff > 0) {
          return {
            ...row,
            outputs: [...row.outputs, ...Array(diff).fill({ value: '' })],
          };
        }
        if (diff < 0) {
          return { ...row, outputs: row.outputs.slice(0, count) };
        }
        return row;
      })
    );
    setIsSaved(false);
  };

  const addMeasurementColumn = (afterIndex: number) => {
    if (measurementCount >= 10) {
      toast.error('Maximum 10 measurements allowed');
      return;
    }
    const newCount = measurementCount + 1;
    setMeasurementCount(newCount);
    setMeasurementHeaders(prev => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, `Meas ${afterIndex + 2}`);
      while (next.length < newCount) next.push(`Meas ${next.length + 1}`);
      return next.slice(0, newCount);
    });
    setOutputRows(prev =>
      prev.map(row => {
        const newOutputs = [...row.outputs];
        newOutputs.splice(afterIndex + 1, 0, { value: '' });
        return {
          ...row,
          outputs: newOutputs,
        };
      })
    );
    setIsSaved(false);
  };

  const removeMeasurementColumn = (index: number) => {
    if (measurementCount <= 3) {
      toast.error('Minimum 3 measurements required');
      return;
    }
    const newCount = measurementCount - 1;
    setMeasurementCount(newCount);
    setMeasurementHeaders(prev => prev.filter((_, i) => i !== index));
    setOutputRows(prev =>
      prev.map(row => ({
        ...row,
        outputs: row.outputs.filter((_, i) => i !== index),
      }))
    );
    setIsSaved(false);
  };

  const updateMeasurementHeader = (index: number, value: string) => {
    setMeasurementHeaders(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setIsSaved(false);
  };

  const addRow = () => {
    setOutputRows(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        kv: '',
        mas: '',
        outputs: Array(measurementCount).fill({ value: '' }),
        avg: '',
        cv: '',
        remark: '',
      },
    ]);
    setIsSaved(false);
  };

  const removeRow = (id: string) => {
    if (outputRows.length <= 1) return;
    setOutputRows(prev => prev.filter(r => r.id !== id));
    setIsSaved(false);
  };

  const updateCell = (rowId: string, field: 'kv' | 'mas', value: string) => {
    setOutputRows(prev =>
      prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row))
    );
    setIsSaved(false);
  };


  const updateMeasurement = (rowId: string, index: number, value: string) => {
    setOutputRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        const outputs = [...row.outputs];
        outputs[index] = { value: value.replace(/[^0-9.-]/g, '') };
        return { ...row, outputs };
      })
    );
    setIsSaved(false);
  };

  // === Load CSV Data ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // FCD (parser sends Table1_value, export may use FCD)
      const fcdData = csvData.find((row: any) => row['Field Name'] === 'FCD' || row['Field Name'] === 'Table1_value');
      if (fcdData) {
        setFFD({ value: String(fcdData.Value ?? '') });
      }

      // Dynamic meas headers from Excel
      const measHeaderValues = csvData
        .filter((row: any) => row['Field Name'] === 'MeasHeader')
        .sort((a: any, b: any) => Number(a['Row Index'] || 0) - Number(b['Row Index'] || 0))
        .map((row: any) => String(row.Value ?? '').trim())
        .filter(Boolean);

      // Measurements: accept Measurement_* (legacy) and Table2_* (Excel parser output)
      const measDataGrouped: any = {};
      csvData.forEach((row: any) => {
        const fn = row['Field Name'];
        const rowIndex = row['Row Index'] || 0;
        const val = row.Value;
        const strVal = val !== undefined && val !== null ? String(val) : '';
        if (fn?.startsWith('Measurement_')) {
          const fieldName = fn.replace('Measurement_', '');
          if (!measDataGrouped[rowIndex]) measDataGrouped[rowIndex] = {};
          measDataGrouped[rowIndex][fieldName] = strVal;
        }
        if (fn?.startsWith('Table2_')) {
          const fieldName = fn.replace('Table2_', '');
          if (!measDataGrouped[rowIndex]) measDataGrouped[rowIndex] = {};
          measDataGrouped[rowIndex][fieldName] = strVal;
        }
        if (fn?.startsWith('OutputRow_Meas')) {
          const n = fn.replace('OutputRow_Meas', '');
          if (!measDataGrouped[rowIndex]) measDataGrouped[rowIndex] = {};
          measDataGrouped[rowIndex][`reading${n}`] = strVal;
        }
      });

      const rowIndices = Object.keys(measDataGrouped).sort((a, b) => Number(a) - Number(b));

      let maxMeas = measHeaderValues.length > 0 ? measHeaderValues.length : 5;
      rowIndices.forEach(idx => {
        const r = measDataGrouped[idx];
        for (let i = 10; i >= 1; i--) {
          if (r[`reading${i}`]) {
            maxMeas = Math.max(maxMeas, i);
            break;
          }
        }
      });
      setMeasurementCount(maxMeas);
      if (measHeaderValues.length > 0) {
        const headers = [...measHeaderValues];
        while (headers.length < maxMeas) headers.push(`Meas ${headers.length + 1}`);
        setMeasurementHeaders(headers.slice(0, maxMeas));
      } else {
        setMeasurementHeaders(Array.from({ length: maxMeas }, (_, i) => `Meas ${i + 1}`));
      }

      if (rowIndices.length > 0) {
        const newRows = rowIndices.map((idx, i) => {
          const r = measDataGrouped[idx];
          const outputs = [];
          for (let j = 1; j <= maxMeas; j++) {
            outputs.push({ value: r[`reading${j}`] || '' });
          }
          return {
            id: String(i + 1),
            kv: r.kv || r.kvp || '',
            mas: r.mas || '',
            outputs,
            avg: r.mean || r.average || '',
            cv: r.cov || '',
            remark: r.remark || r.remarks || '',
          };
        });
        setOutputRows(newRows as OutputRow[]);
      }

      // Tolerance: operator/sign must not overwrite numeric value
      const normalizeOp = (raw: string): Tolerance['operator'] | null => {
        const s = String(raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
        if (s === '<=' || s === '≤' || s.includes('lessthanorequal')) return '<=';
        if (s === '<' || s === 'less than' || s === 'lessthan') return '<';
        if (s === '>=' || s === '≥' || s.includes('greaterthanorequal')) return '>=';
        if (s === '>' || s === 'greaterthan') return '>';
        return null;
      };
      const isNumericTol = (v: unknown) => {
        const s = String(v ?? '').trim();
        return s !== '' && !Number.isNaN(Number(s));
      };

      const tolOpRow = csvData.find((row: any) =>
        row['Field Name'] === 'Tolerance_Operator' ||
        row['Field Name'] === 'Tolerance_operator' ||
        row['Field Name'] === 'Tolerance_Sign' ||
        row['Field Name'] === 'ToleranceOperator'
      );
      const tolValCandidates = csvData.filter((row: any) =>
        row['Field Name'] === 'Tolerance_Value' ||
        row['Field Name'] === 'Tolerance_value' ||
        row['Field Name'] === 'Tolerance'
      );
      const tolValRow = tolValCandidates.find((row: any) => isNumericTol(row.Value)) ||
        tolValCandidates.find((row: any) => {
          const s = String(row.Value ?? '').trim();
          return s !== '' && !normalizeOp(s);
        });

      setTolerance(prev => {
        const next = { ...prev };
        if (tolOpRow) {
          const op = normalizeOp(String(tolOpRow.Value ?? ''));
          if (op) next.operator = op;
        }
        // If Tolerance_Value accidentally holds an operator (legacy bug), use it as operator only
        const firstTol = tolValCandidates[0];
        if (firstTol && !isNumericTol(firstTol.Value)) {
          const opFromVal = normalizeOp(String(firstTol.Value ?? ''));
          if (opFromVal && !tolOpRow) next.operator = opFromVal;
        }
        if (tolValRow && isNumericTol(tolValRow.Value)) {
          next.value = String(tolValRow.Value).trim();
        }
        return next;
      });

      setIsEditing(true);
      setIsSaved(false);
    }
  }, [csvData, refreshKey]);

  // Load existing test data (skip when CSV/Excel data is present so we don't overwrite)
  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }
    if (csvData && csvData.length > 0) {
      setIsLoading(false);
      return;
    }

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getConsistencyOfRadiationOutputByServiceIdForRadiographyPortable(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          if (testData.ffd?.value) {
            setFFD({ value: testData.ffd.value });
          }
          if (testData.outputRows && testData.outputRows.length > 0) {
            const firstRow = testData.outputRows[0];
            const numMeas = firstRow.outputs?.length || 5;
            setMeasurementCount(numMeas);
            const savedHeaders = Array.isArray(testData.measurementHeaders)
              ? testData.measurementHeaders
              : Array.isArray(testData.measHeaders)
                ? testData.measHeaders
                : [];
            if (savedHeaders.length > 0) {
              const next = [...savedHeaders.map(String)];
              while (next.length < numMeas) next.push(`Meas ${next.length + 1}`);
              setMeasurementHeaders(next.slice(0, numMeas));
            } else {
              setMeasurementHeaders(Array.from({ length: numMeas }, (_, i) => `Meas ${i + 1}`));
            }
            setOutputRows(testData.outputRows.map((r: any) => ({
              id: Date.now().toString() + Math.random(),
              kv: r.kv || '',
              mas: r.mas || '',
              outputs: r.outputs?.map((o: any) => ({ value: o.value || '' })) || Array(numMeas).fill({ value: '' }),
              avg: r.avg || '',
              cv: '',
              remark: r.remark || '',
            })));
          }
          if (testData.tolerance) {
            const v = testData.tolerance.value;
            const opRaw = String(testData.tolerance.operator ?? '<=');
            const numericValue = v != null && v !== '' && !Number.isNaN(Number(v))
              ? String(v)
              : '0.05';
            // Guard against legacy saves where operator leaked into value
            const op = (['<=', '<', '>=', '>'].includes(opRaw) ? opRaw : '<=') as Tolerance['operator'];
            setTolerance({
              operator: op,
              value: numericValue,
            });
          }
          setIsSaved(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load test data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [serviceId, csvData]);

  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ffd,
        measurementHeaders,
        outputRows: rowsWithCalc.map(r => ({
          kv: r.kv,
          mas: r.mas,
          outputs: r.outputs,
          avg: r.avg,
          remark: r.remark,
        })),
        tolerance,
      };

      let result;
      if (testId) {
        result = await updateConsistencyOfRadiationOutputForRadiographyPortable(testId, payload);
      } else {
        result = await addConsistencyOfRadiationOutputForRadiographyPortable(serviceId, payload);
        if (result?.data?._id) {
          setTestId(result.data._id);
          onTestSaved?.(result.data._id);
        }
      }

      setIsSaved(true);
      setIsEditing(false);
      toast.success(testId ? 'Updated successfully' : 'Saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  const isViewMode = isSaved && !isEditing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">
        Reproducibility of Radiation Output (Consistency Test)
      </h2>

      {/* FCD */}
      <div className="bg-white rounded-lg border shadow-sm">

        <div className="p-6 flex items-center gap-4">
          <label className="w-48 text-sm font-medium text-gray-700">FFD(cm):</label>
          <input
            type="text"
            value={ffd.value}
            onChange={e => updateFcd(e.target.value)}
            disabled={isViewMode}
            className={`w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="100"
          />
          <span className="text-gray-600">cm</span>
        </div>
      </div>

      {/* Main Table */}
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
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600  border-r">
                  kV
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600  border-r">
                  mAs
                </th>
                {Array.from({ length: measurementCount }, (_, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r relative"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={measurementHeaders[i] || `Meas ${i + 1}`}
                          onChange={e => updateMeasurementHeader(i, e.target.value)}
                          disabled={isViewMode}
                          className={`w-24 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
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
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600  border-r">
                  Average
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600 ">
                  CoV / Remark
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rowsWithCalc.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-r">
                    <input
                      type="text"
                      value={row.kv}
                      onChange={e => updateCell(row.id, 'kv', e.target.value)}
                      disabled={isViewMode}
                      className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="80"
                    />
                  </td>
                  <td className="px-5 py-4 border-r">
                    <input
                      type="text"
                      value={row.mas}
                      onChange={e => updateCell(row.id, 'mas', e.target.value)}
                      disabled={isViewMode}
                      className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="100"
                    />
                  </td>
                  {row.outputs.map((meas, i) => (
                    <td key={i} className="px-2 py-4 border-r">
                      <input
                        type="text"
                        value={meas.value}
                        onChange={e => updateMeasurement(row.id, i, e.target.value)}
                        disabled={isViewMode}
                        className={`w-20 px-2 py-1.5 text-center border rounded text-xs focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-5 py-4 text-center font-semibold border-r bg-blue-50">
                    {row.avg || '—'}
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
                      {row.cv ? `${row.cv} → ${row.remark}` : (row.remark || '—')}
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
          <span className="text-gray-700">Coefficient of Variation (CV)</span>
          <select
            value={tolerance.operator}
            onChange={e => {
              setTolerance({ ...tolerance, operator: e.target.value as any });
              setIsSaved(false);
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
            onChange={e => {
              setTolerance({
                ...tolerance,
                value: e.target.value.replace(/[^0-9.]/g, ''),
              });
              setIsSaved(false);
            }}
            disabled={isViewMode}
            className={`w-24 px-4 py-2 text-center border-2 border-blue-500 rounded font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
          <span className="text-gray-700">(decimal e.g. 0.05)</span>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Reference: IEC 61223-3-1 & AERB Safety Code
        </p>
      </div>

      <div className="flex justify-end mt-6">
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
    </div>
  );
};

export default ConsistencyOfRadiationOutput;