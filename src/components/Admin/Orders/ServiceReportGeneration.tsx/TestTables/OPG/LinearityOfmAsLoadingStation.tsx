// components/TestTables/LinearityOfMasLoading.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfMaLoadingForOPG,
  getLinearityOfMaLoadingByServiceIdForOPG,
  getLinearityOfMaLoadingByTestIdForOPG,
  updateLinearityOfMaLoadingForOPG,
} from '../../../../../../api';

interface ExposureCondition {
  fcd: string;
  kv: string;
}

interface Table2Row {
  id: string;
  mAsRange: string;
  measuredOutputs: string[];
  average: string;
  x: string;
  xMax: string;
  xMin: string;
  col: string;
  remarks: string;
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
  onRefresh?: () => void;
  csvData?: any[];
}

const LinearityOfMasLoading: React.FC<Props> = ({ serviceId, testId: propTestId = null, onTestSaved, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Exposure Conditions
  const [exposureCondition, setExposureCondition] = useState<ExposureCondition>({ fcd: '100', kv: '80' });

  const [measHeaders, setMeasHeaders] = useState<string[]>(['Measured mR 1', 'Measured mR 2', 'Measured mR 3']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', mAsRange: '5 - 10', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', mAsRange: '10 - 20', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', mAsRange: '20 - 50', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', mAsRange: '50 - 100', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');

  // Handlers
  const addMeasColumn = () => {
    setMeasHeaders(p => [...p, `Measured mR ${p.length + 1}`]);
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: [...r.measuredOutputs, ''] })));
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(p => p.filter((_, i) => i !== idx));
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: r.measuredOutputs.filter((_, i) => i !== idx) })));
  };

  const addTable2Row = () => {
    setTable2Rows(p => [
      ...p,
      { id: Date.now().toString(), mAsRange: '', measuredOutputs: Array(measHeaders.length).fill(''), average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows(p => p.filter(r => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'mAsRange' | number, value: string) => {
    if (isViewMode) return;
    setTable2Rows(p =>
      p.map(r => {
        if (r.id !== rowId) return r;
        if (field === 'mAsRange') return { ...r, mAsRange: value };
        if (typeof field === 'number') {
          const outputs = [...r.measuredOutputs];
          outputs[field] = value;
          return { ...r, measuredOutputs: outputs };
        }
        return r;
      })
    );
  };

  // Load data from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getLinearityOfMaLoadingByServiceIdForOPG(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          if (data.table1) {
            setExposureCondition({
              fcd: data.table1.fcd || '100',
              kv: data.table1.kv || '80',
            });
          }
          // Note: Backend uses 'ma' field, but we need to convert it to mAsRange format for display
          // We'll use the ma value as-is and display it as mAsRange
          if (Array.isArray(data.table2) && data.table2.length > 0) {
            setTable2Rows(
              data.table2.map((r: any, i: number) => {
                // Convert ma back to mAsRange format (use ma value as mAsRange)
                const maValue = r.ma || '';
                const mAsRange = maValue ? `${maValue} mAs` : '';
                return {
                  id: String(i + 1),
                  mAsRange: mAsRange,
                  measuredOutputs: (r.measuredOutputs || []).map((v: any) => (v != null ? String(v) : '')),
                  average: r.average || '',
                  x: r.x || '',
                  xMax: r.xMax || '',
                  xMin: r.xMin || '',
                  col: r.col || '',
                  remarks: r.remarks || '',
                };
              })
            );
          }
          setTolerance(data.tolerance || '0.1');
          setHasSaved(true);
          setIsEditing(false);
          if (data._id && !propTestId) {
            onTestSaved?.(data._id);
          }
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load mAs linearity data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    load();
  }, [serviceId]);

  // CSV Data Injection
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      let newTable2Rows: Table2Row[] = [];
      let foundSettings = false;

      csvData.forEach((row, idx) => {
        const firstCell = row[0]?.toString()?.trim();

        // 1. Parameter Row: FCD, 100, kV, 70...
        if ((row.includes('FCD') || row.includes('fcd')) && (row.includes('kV') || row.includes('kv'))) {
          const fIndex = row.findIndex((c: any) => c?.toString().toLowerCase() === 'fcd');
          const kIndex = row.findIndex((c: any) => c?.toString().toLowerCase().includes('kv'));

          setExposureCondition({
            fcd: row[fIndex + 1]?.toString() || '',
            kv: row[kIndex + 1]?.toString() || ''
          });
          foundSettings = true;
        }
        // 2. Data Rows
        else if (firstCell && (!isNaN(parseFloat(firstCell)) || firstCell.includes('-'))) {
          const mAsRange = row[0]?.toString() || '';
          const potentialMeas = row.slice(1);
          const meas: string[] = [];

          potentialMeas.forEach((val: any) => {
            const s = val?.toString()?.trim();
            if (s && !isNaN(parseFloat(s)) && !['Pass', 'Fail', 'PASS', 'FAIL'].includes(s)) {
              meas.push(s);
            }
          });

          // Detect and strip imported calculation columns (Average, mR/mAs)
          if (meas.length > 2) {
            const mrmas = parseFloat(meas[meas.length - 1]);
            const avg = parseFloat(meas[meas.length - 2]);
            const others = meas.slice(0, -2).map(v => parseFloat(v));
            const calculatedAvg = others.reduce((a, b) => a + b, 0) / others.length;

            if (Math.abs(avg - calculatedAvg) < 0.1) {
              meas.splice(-2);
            }
          }

          newTable2Rows.push({
            id: String(idx + 1),
            mAsRange,
            measuredOutputs: meas,
            average: '',
            x: '', xMax: '', xMin: '', col: '', remarks: ''
          });
        }
      });

      if (newTable2Rows.length > 0) {
        // Update headers exactly matching the import count (min 3)
        const maxMeas = Math.max(...newTable2Rows.map(r => r.measuredOutputs.length));
        const finalHeaderCount = maxMeas || 3;

        if (finalHeaderCount !== measHeaders.length) {
          setMeasHeaders(Array.from({ length: finalHeaderCount }, (_, i) => `Measured mR ${i + 1}`));
        }

        // Pad all rows to match finalHeaderCount
        const paddedRows = newTable2Rows.map(row => {
          const paddedMeas = [...row.measuredOutputs];
          while (paddedMeas.length < finalHeaderCount) {
            paddedMeas.push('');
          }
          return { ...row, measuredOutputs: paddedMeas };
        });

        setTable2Rows(paddedRows);
        if (!testId) setIsEditing(true);
      }
    }
  }, [csvData]);

  // Save handler
  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      // Convert mAsRange to ma value (extract number from mAsRange string)
      const payload = {
        table1: {
          fcd: exposureCondition.fcd,
          kv: exposureCondition.kv,
          time: '', // mAs loading doesn't use time field
        },
        table2: processedTable2.map(r => {
          // Extract numeric value from mAsRange (e.g., "5 - 10" -> "7.5" or "10" -> "10")
          let maValue = '';
          const match = r.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          if (match) {
            // If it's a range, use midpoint
            const mid = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
            maValue = mid.toString();
          } else {
            // If it's a single value, extract it
            const singleMatch = r.mAsRange.match(/(\d+(?:\.\d+)?)/);
            maValue = singleMatch ? singleMatch[1] : r.mAsRange.replace(/[^\d.]/g, '');
          }

          return {
            ma: maValue || r.mAsRange,
            measuredOutputs: r.measuredOutputs.map(v => {
              const val = v.trim();
              return val === '' ? '' : val;
            }),
            average: r.average || '',
            x: r.x || '',
            xMax: r.xMax || '',
            xMin: r.xMin || '',
            col: r.col || '',
            remarks: r.remarks || '',
          };
        }),
        tolerance,
      };

      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getLinearityOfMaLoadingByServiceIdForOPG(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        // Update existing
        result = await updateLinearityOfMaLoadingForOPG(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        // Create new
        result = await addLinearityOfMaLoadingForOPG(serviceId, payload);
        const newId = result?.data?.testId || result?.data?._id;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(true);
  };
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  // CoL Calculation (same logic, fully client-side)
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';

      const match = row.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      const midMas = match
        ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
        : parseFloat(row.mAsRange) || 0;

      const x = avg !== '—' && midMas > 0 ? (parseFloat(avg) / midMas).toFixed(4) : '—';
      if (x !== '—') xValues.push(parseFloat(x));

      return { ...row, average: avg, x };
    });

    const hasData = xValues.length > 0;
    const xMax = hasData ? Math.max(...xValues).toFixed(4) : '—';
    const xMin = hasData ? Math.min(...xValues).toFixed(4) : '—';
    const colNum = hasData
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : 0;
    const col = hasData ? colNum.toFixed(3) : '—';
    const pass = hasData && colNum <= tol;

    return rowsWithX.map(row => ({
      ...row,
      col,
      remarks: hasData ? (pass ? 'Pass' : 'Fail') : '—',
    }));
  }, [table2Rows, tolerance]);

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
        <h2 className="text-2xl font-bold text-gray-800">Linearity of mAs Loading (Across mAs Ranges)</h2>
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
          ) : (
            <>
              <ButtonIcon className="w-4 h-4" />
              {buttonText} mAs Linearity
            </>
          )}
        </button>
      </div>

      {/* Exposure Conditions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-teal-50 border-b">
          <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">FCD (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">kV</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-6 py-4 border-r">
                <input
                  type="text"
                  value={exposureCondition.fcd}
                  onChange={e => setExposureCondition(p => ({ ...p, fcd: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={exposureCondition.kv}
                  onChange={e => setExposureCondition(p => ({ ...p, kv: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">Linearity of Radiation Output Across mAs Ranges</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mAs Range</th>
                <th colSpan={measHeaders.length} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">
                  <div className="flex items-center justify-between px-4">
                    <span>Radiation Output (mR)</span>
                    {!isViewMode && (
                      <button onClick={addMeasColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">Avg Output</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">X (mR/mAs)</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">CoL</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Remarks</th>
                <th rowSpan={2} className="w-12"></th>
              </tr>
              <tr>
                {measHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={e => {
                          setMeasHeaders(p => {
                            const c = [...p];
                            c[i] = e.target.value || `Meas ${i + 1}`;
                            return c;
                          });
                        }}
                        disabled={isViewMode}
                        className={`w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                          }`}
                      />
                      {measHeaders.length > 1 && !isViewMode && (
                        <button onClick={() => removeMeasColumn(i)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={p.mAsRange}
                      onChange={e => updateCell(p.id, 'mAsRange', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 text-center text-sm border rounded font-medium focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      placeholder="10 - 20"
                    />
                  </td>
                  {p.measuredOutputs.map((val, idx) => (
                    <td key={idx} className="px-3 py-4 text-center border-r">
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={e => updateCell(p.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-24 px-3 py-2 text-center text-sm border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                          }`}
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.average}</td>
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.x}</td>
                  <td className="px-6 py-4 text-center font-bold border-r bg-yellow-50">{p.col}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${p.remarks === 'Pass' ? 'bg-green-100 text-green-800' :
                      p.remarks === 'Fail' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                      {p.remarks}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {table2Rows.length > 1 && !isViewMode && (
                      <button onClick={() => removeTable2Row(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && (
            <button onClick={addTable2Row} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              <Plus className="w-5 h-5" /> Add mAs Range
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) ≤</span>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-32 px-4 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearityOfMasLoading;