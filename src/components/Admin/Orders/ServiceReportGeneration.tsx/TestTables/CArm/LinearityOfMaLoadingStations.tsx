// components/TestTables/LinearityOfMaLoading.tsx
 'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfMasLoadingStationsForFixedRadioFluro,
  getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro,
  updateLinearityOfMasLoadingStationsForFixedRadioFluro,
} from '../../../../../../api';

interface Table1Row {
  fcd: string;
  kv: string;
  time: string;
}

interface Table2Row {
  id: string;
  ma: string;                    // Changed from mAsApplied
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
}

const LinearityOfMaLoading: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1: FCD, kV, Time (sec)
  const [table1Row, setTable1Row] = useState<Table1Row>({ fcd: '', kv: '', time: '' });

  // Table 2: mA values + dynamic measurement columns
  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', ma: '50', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', ma: '100', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', ma: '200', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', ma: '300', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // === Column Handling ===
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

  // === Row Handling ===
  const addTable2Row = () => {
    const newRow: Table2Row = {
      id: Date.now().toString(),
      ma: '',
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

  const updateTable2Cell = (
    rowId: string,
    field: 'ma' | number,
    value: string
  ) => {
    setTable2Rows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        if (field === 'ma') return { ...row, ma: value };
        if (typeof field === 'number') {
          const newOutputs = [...row.measuredOutputs];
          newOutputs[field] = value;
          return { ...row, measuredOutputs: newOutputs };
        }
        return row;
      })
    );
  };

  // === Auto-calc: Avg, X, Xmax, Xmin, CoL, Remarks ===
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';
      const ma = parseFloat(row.ma);
      const x = avg !== '—' && ma > 0 ? (parseFloat(avg) / ma).toFixed(4) : '—';

      if (x !== '—') xValues.push(parseFloat(x));

      return { ...row, average: avg, x };
    });

    const xMax = xValues.length > 0 ? Math.max(...xValues).toFixed(4) : '—';
    const xMin = xValues.length > 0 ? Math.min(...xValues).toFixed(4) : '—';
    const colVal = xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
      ? ((parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))).toFixed(3)
      : '—';
    const pass = colVal !== '—' && parseFloat(colVal) <= tol;

    return rowsWithX.map(row => ({
      ...row,
      xMax,
      xMin,
      col: colVal,
      remarks: pass ? 'Pass' : colVal === '—' ? '' : 'Fail',
    }));
  }, [table2Rows, tolerance]);

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.fcd.trim() &&
      table1Row.kv.trim() &&
      table1Row.time.trim() &&
      table2Rows.every(r => r.ma.trim() && r.measuredOutputs.some(v => v.trim()))
    );
  }, [serviceId, table1Row, table2Rows]);

  // === Load Data from backend ===
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setTable1Row({
            fcd: data.table1?.[0]?.fcd || '',
            kv: data.table1?.[0]?.kv || '',
            time: data.table1?.[0]?.time || '',
          });
          setMeasHeaders(data.measHeaders && data.measHeaders.length > 0 ? data.measHeaders : ['Meas 1', 'Meas 2', 'Meas 3']);
          if (Array.isArray(data.table2) && data.table2.length > 0) {
            setTable2Rows(
              data.table2.map((r: any) => ({
                id: Date.now().toString() + Math.random(),
                ma: r.mAsApplied || r.ma || '',
                measuredOutputs: (r.measuredOutputs || []).map((v: any) => (v != null ? String(v) : '')),
                average: r.average || '',
                x: r.x || '',
                xMax: r.xMax || '',
                xMin: r.xMin || '',
                col: r.col || '',
                remarks: r.remarks || '',
              }))
            );
          }
          setTolerance(data.tolerance || '0.1');
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load mA linearity data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  // === Save Handler (connected to Fixed Radio Fluoro API) ===
  const handleSave = async () => {
    console.log('handleSave called', { isFormValid, serviceId, testId, table1Row, table2Rows: table2Rows.length });
    
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }
    
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      console.log('Form validation failed:', { 
        fcd: table1Row.fcd, 
        kv: table1Row.kv, 
        time: table1Row.time,
        table2Rows: table2Rows.map(r => ({ ma: r.ma, hasOutputs: r.measuredOutputs.some(v => v.trim()) }))
      });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Starting save...', { serviceId, testId });
      // Use processedTable2 to get calculated values
      const payload = {
        table1: [table1Row],
        table2: processedTable2.map(r => ({
          mAsApplied: r.ma,
          measuredOutputs: r.measuredOutputs.map(v => {
            const val = v.trim();
            return val === '' ? null : (isNaN(parseFloat(val)) ? val : parseFloat(val));
          }),
          average: r.average || '',
          x: r.x || '',
          xMax: r.xMax || '',
          xMin: r.xMin || '',
          col: r.col || '',
          remarks: r.remarks || '',
        })),
        measHeaders,
        tolerance,
      };
      
      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      console.log('Payload prepared:', payload);
      
      if (currentTestId) {
        // Update existing
        console.log('Updating with testId:', currentTestId);
        result = await updateLinearityOfMasLoadingStationsForFixedRadioFluro(currentTestId, payload);
        console.log('Update result:', result);
        toast.success('Updated successfully!');
      } else {
        // Create new (backend uses upsert, so this will work even if data exists)
        console.log('Creating new with serviceId:', serviceId);
        result = await addLinearityOfMasLoadingStationsForFixedRadioFluro(serviceId, payload);
        console.log('Create result:', result);
        const newId = result?.data?._id || result?.data?.data?._id || result?._id;
        if (newId) {
          setTestId(newId);
        }
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      console.error('Save error:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    console.log('toggleEdit called');
    setIsEditing(true);
  };
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">Linearity of mA Loading</h2>

      {/* Table 1: FCD, kV, Time (sec) */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">FCD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (sec)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={table1Row.fcd}
                  onChange={e => setTable1Row(p => ({ ...p, fcd: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={table1Row.kv}
                  onChange={e => setTable1Row(p => ({ ...p, kv: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="80"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={table1Row.time}
                  onChange={e => setTable1Row(p => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="0.5"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: mA + Output (mGy) */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              {/* Header – make mA column wider */}
              <th
                rowSpan={2}
                className="px-6 py-3 w-28 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r whitespace-nowrap"
              >
                mA
              </th>
              <th
                colSpan={measHeaders.length}
                className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
              >
                <div className="flex items-center justify-between">
                  <span>Output (mGy)</span>
                  {!isViewMode && (
                    <button onClick={addMeasColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Avg Output</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X (mGy/mA)</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X MAX</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X MIN</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">CoL</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Remarks</th>
              <th rowSpan={2} className="w-10" />
            </tr>
            <tr>
              {measHeaders.map((header, idx) => (
                <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={e => updateMeasHeader(idx, e.target.value)}
                      disabled={isViewMode}
                      className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    />
                    {measHeaders.length > 1 && !isViewMode && (
                      <button onClick={() => removeMeasColumn(idx)} className="p-0.5 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedTable2.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.ma}
                    onChange={e => updateTable2Cell(p.id, 'ma', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="100"
                  />
                </td>

                {p.measuredOutputs.map((val, colIdx) => (
                  <td key={colIdx} className="px-2 py-2 border-r">
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={e => updateTable2Cell(p.id, colIdx, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    />
                  </td>
                ))}

                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.average}</td>
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.x}</td>
                <td className="px-4 py-2 text-center border-r font-medium bg-yellow-50">{p.xMax}</td>
                <td className="px-4 py-2 text-center border-r font-medium bg-yellow-50">{p.xMin}</td>
                <td className="px-4 py-2 text-center border-r font-medium bg-yellow-50">{p.col}</td>

                <td className="px-4 py-2 text-center">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${p.remarks === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : p.remarks === 'Fail'
                        ? 'bg-red-100 text-red-800'
                        : 'text-gray-400'
                      }`}
                  >
                    {p.remarks || '—'}
                  </span>
                </td>

                <td className="px-2 py-2 text-center">
                  {table2Rows.length > 1 && !isViewMode && (
                    <button
                      onClick={() => window.confirm('Delete this row?') && removeTable2Row(p.id)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && (
            <button
              onClick={addTable2Row}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) less than</span>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end mt-6">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Button clicked', { isViewMode, isSaving, isFormValid });
            if (isViewMode) {
              toggleEdit();
            } else {
              handleSave();
            }
          }}
          disabled={isSaving || (isViewMode ? false : !isFormValid)}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
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
              {buttonText} mA Linearity
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LinearityOfMaLoading;