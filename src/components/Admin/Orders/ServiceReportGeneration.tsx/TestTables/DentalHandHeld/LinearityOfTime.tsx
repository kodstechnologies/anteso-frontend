// components/TestTables/LinearityOfTime.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfTimeForDentalHandHeld,
  getLinearityOfTimeByServiceIdForDentalHandHeld,
  updateLinearityOfTimeForDentalHandHeld,
} from "../../../../../../api";

interface Table1Row {
  fcd: string;
  kv: string;
  ma: string;  // ← Now mA (was Time)
}

interface Table2Row {
  id: string;
  time: string;                 // ← Time (sec) instead of mA
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
  testId?: string;
  onRefresh?: () => void;
  csvData?: any[];
}

const LinearityOfTime: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1: FCD, kV, mA (fixed)
  const [table1Row, setTable1Row] = useState<Table1Row>({ fcd: '', kv: '', ma: '' });

  // Table 2: Time (sec) + dynamic measurements
  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', time: '10', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', time: '20', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', time: '50', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', time: '100', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Column Handling
  const addMeasColumn = () => {
    const newHeader = `Meas ${measHeaders.length + 1}`;
    setMeasHeaders(prev => [...prev, newHeader]);
    setTable2Rows(prev =>
      prev.map(row => ({ ...row, measuredOutputs: [...row.measuredOutputs, ''] }))
    );
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(prev => prev.filter((_, i) => i !== idx));
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        measuredOutputs: row.measuredOutputs.filter((_, i) => i !== idx),
      }))
    );
  };

  const updateMeasHeader = (idx: number, value: string) => {
    setMeasHeaders(prev => {
      const copy = [...prev];
      copy[idx] = value || `Meas ${idx + 1}`;
      return copy;
    });
  };

  // Row Handling
  const addTable2Row = () => {
    const newRow: Table2Row = {
      id: Date.now().toString(),
      time: '',
      measuredOutputs: Array(measHeaders.length).fill(''),
      average: '',
      x: '',
      xMax: '',
      xMin: '',
      col: '',
      remarks: '',
    };
    setTable2Rows(prev => [...prev, newRow]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows(prev => prev.filter(r => r.id !== id));
  };

  const updateTable2Cell = (rowId: string, field: 'time' | number, value: string) => {
    setTable2Rows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        if (field === 'time') return { ...row, time: value };
        if (typeof field === 'number') {
          const newOutputs = [...row.measuredOutputs];
          newOutputs[field] = value;
          return { ...row, measuredOutputs: newOutputs };
        }
        return row;
      })
    );
  };

  // Auto-calculations: X = Output / (mA × Time) = Output / mAs
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const ma = parseFloat(table1Row.ma) || 0;
    const xValues: number[] = [];

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      // Calculate actual average of measurements
      const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';
      const time = parseFloat(row.time);

      // Calculate mAs = mA × time, then X = avg / mAs
      const mAs = ma > 0 && time > 0 ? ma * time : 0;
      const x = avg !== '—' && mAs > 0 ? (parseFloat(avg) / mAs).toFixed(4) : '—';

      if (x !== '—') xValues.push(parseFloat(x));

      // Explicitly set average and x, ignoring any existing values in row
      return {
        ...row,
        average: avg,  // This is the actual average of measurements
        x: x           // This is the calculated X value (avg / mAs)
      };
    });

    // Calculate xMax, xMin, col, and remarks once for all rows
    const xMax = xValues.length > 0 ? Math.max(...xValues).toFixed(4) : '—';
    const xMin = xValues.length > 0 ? Math.min(...xValues).toFixed(4) : '—';
    const colVal = xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
      ? ((parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))).toFixed(3)
      : '—';
    const pass = colVal !== '—' && parseFloat(colVal) <= tol;
    const remarks = pass ? 'Pass' : colVal === '—' ? '' : 'Fail';

    return {
      rows: rowsWithX,
      summary: { xMax, xMin, col: colVal, remarks, rowSpan: rowsWithX.length }
    };
  }, [table2Rows, tolerance, table1Row.ma]);

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.fcd.trim() &&
      table1Row.kv.trim() &&
      table1Row.ma.trim() &&
      table2Rows.every(r => r.time.trim() && r.measuredOutputs.some(v => v.trim()))
    );
  }, [serviceId, table1Row, table2Rows]);

  // Load existing test data
  useEffect(() => {
    if (!serviceId) return;

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getLinearityOfTimeByServiceIdForDentalHandHeld(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          if (testData.table1) {
            setTable1Row({
              fcd: testData.table1.fcd || '',
              kv: testData.table1.kv || '',
              ma: testData.table1.ma || '',
            });
          }
          if (testData.table2 && testData.table2.length > 0) {
            setTable2Rows(testData.table2.map((r: any) => ({
              id: r.id || Date.now().toString() + Math.random(),
              time: r.time || '',
              measuredOutputs: r.measuredOutputs || [],
              // Don't load average and x - they will be recalculated by processedTable2
            })));
          }
          if (testData.tolerance) {
            setTolerance(testData.tolerance);
          }
          setHasSaved(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load test data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [serviceId]);

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const fcd = csvData.find(r => r['Field Name'] === 'FCD')?.['Value'];
      const kv = csvData.find(r => r['Field Name'] === 'kV')?.['Value'];
      const ma = csvData.find(r => r['Field Name'] === 'mA')?.['Value'];

      if (fcd || kv || ma) {
        setTable1Row(prev => ({
          fcd: fcd || prev.fcd,
          kv: kv || prev.kv,
          ma: ma || prev.ma
        }));
      }

      const rowIndices = [...new Set(csvData
        .filter(r => r['Field Name'] && (r['Field Name'] === 'Time_sec' || r['Field Name'].startsWith('Measured_')))
        .map(r => parseInt(r['Row Index']))
        .filter(i => !isNaN(i) && i >= 0)
      )].sort((a, b) => a - b);

      if (rowIndices.length > 0) {
        const newTable2Rows = rowIndices.map(idx => {
          const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
          const time = rowData.find(r => r['Field Name'] === 'Time_sec')?.['Value'] || '';

          const measured: string[] = [];
          for (let i = 0; i < 10; i++) {
            const val = rowData.find(r => r['Field Name'] === `Measured_${i}`)?.['Value'];
            if (val !== undefined) measured.push(val);
            else break;
          }

          return {
            id: String(idx),
            time,
            measuredOutputs: measured,
            average: '',
            x: '', xMax: '', xMin: '', col: '', remarks: ''
          } as Table2Row;
        });

        setTable2Rows(newTable2Rows);

        const maxMeas = Math.max(...newTable2Rows.map(r => r.measuredOutputs.length));
        if (maxMeas > measHeaders.length) {
          const newCols = Array.from({ length: maxMeas - measHeaders.length }, (_, i) => `Meas ${measHeaders.length + i + 1}`);
          setMeasHeaders(prev => [...prev, ...newCols]);
        }
      }

      if (!testId && (rowIndices.length > 0 || fcd || kv || ma)) setIsEditing(true);
    }
  }, [csvData, testId, measHeaders.length]);

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        table1: table1Row,
        table2: processedTable2.rows.map(r => ({
          time: r.time,
          measuredOutputs: r.measuredOutputs,
          average: r.average,
          x: r.x,
        })),
        xMax: processedTable2.summary.xMax,
        xMin: processedTable2.summary.xMin,
        col: processedTable2.summary.col,
        remarks: processedTable2.summary.remarks,
        tolerance,
      };

      let result;
      if (testId) {
        result = await updateLinearityOfTimeForDentalHandHeld(testId, payload);
      } else {
        result = await addLinearityOfTimeForDentalHandHeld(serviceId, payload);
        if (result?.data?._id) {
          setTestId(result.data._id);
        }
      }

      setHasSaved(true);
      setIsEditing(false);
      toast.success(testId ? "Updated successfully" : "Saved successfully");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">Linearity of Time</h2>

      {/* Table 1: FCD, kV, mA */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">FCD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">mA</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input type="text" value={table1Row.fcd} onChange={e => setTable1Row(p => ({ ...p, fcd: e.target.value }))} disabled={isViewMode} className={`w-full px-2 py-1 border rounded text-sm text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="100" />
              </td>
              <td className="px-4 py-2 border-r">
                <input type="text" value={table1Row.kv} onChange={e => setTable1Row(p => ({ ...p, kv: e.target.value }))} disabled={isViewMode} className={`w-full px-2 py-1 border rounded text-sm text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="80" />
              </td>
              <td className="px-4 py-2">
                <input type="text" value={table1Row.ma} onChange={e => setTable1Row(p => ({ ...p, ma: e.target.value }))} disabled={isViewMode} className={`w-full px-2 py-1 border rounded text-sm text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="100" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 w-28 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r whitespace-nowrap">
                  Time (sec)
                </th>
                <th colSpan={measHeaders.length} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  <div className="flex items-center justify-between">
                    <span>Output (mGy)</span>
                    {!isViewMode && <button onClick={addMeasColumn} className="p-1 text-green-600 hover:bg-green-100 rounded"><Plus className="w-4 h-4" /></button>}
                  </div>
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Avg Output</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X (mGy/sec)</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X MAX</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X MIN</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">CoL</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Remarks</th>
                <th rowSpan={2} className="w-12 px-0 text-center" />
              </tr>
              <tr>
                {measHeaders.map((header, idx) => (
                  <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    <div className="flex items-center justify-center gap-1">
                      <input type="text" value={header} onChange={e => updateMeasHeader(idx, e.target.value)} disabled={isViewMode} className="w-20 px-1 py-0.5 text-xs border rounded" />
                      {measHeaders.length > 1 && !isViewMode && <button onClick={() => removeMeasColumn(idx)} className="p-0.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-3 h-3" /></button>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.rows.map((p, index) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r min-w-28">
                    <input type="text" value={p.time} onChange={e => updateTable2Cell(p.id, 'time', e.target.value)} disabled={isViewMode} className={`w-full px-3 py-1.5 border rounded text-sm font-medium text-center ${isViewMode ? 'bg-gray-50' : ''}`} placeholder="50" />
                  </td>
                  {p.measuredOutputs.map((val, colIdx) => (
                    <td key={colIdx} className="px-2 py-2 border-r">
                      <input type="number" step="any" value={val} onChange={e => updateTable2Cell(p.id, colIdx, e.target.value)} disabled={isViewMode} className="w-full px-2 py-1 border rounded text-sm text-center" />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.average}</td>
                  <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.x}</td>
                  {index === 0 && (
                    <>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle">
                        {processedTable2.summary.xMax}
                      </td>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle">
                        {processedTable2.summary.xMin}
                      </td>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle">
                        {processedTable2.summary.col}
                      </td>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-4 py-2 text-center align-middle">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${processedTable2.summary.remarks === 'Pass' ? 'bg-green-100 text-green-800' : processedTable2.summary.remarks === 'Fail' ? 'bg-red-100 text-red-800' : 'text-gray-400'}`}>
                          {processedTable2.summary.remarks || '—'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="w-12 px-0 py-2 text-center align-middle">
                    {table2Rows.length > 1 && !isViewMode && (
                      <button onClick={() => removeTable2Row(p.id)} className="text-red-600 hover:bg-red-100 p-1.5 rounded inline-flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && (
            <button onClick={addTable2Row} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) less than</span>
            <input type="number" step="0.001" value={tolerance} onChange={e => setTolerance(e.target.value)} disabled={isViewMode} className="w-24 px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><ButtonIcon className="w-4 h-4" /> {buttonText} Time Linearity</>}
        </button>
      </div>
    </div>
  );
};

export default LinearityOfTime;
