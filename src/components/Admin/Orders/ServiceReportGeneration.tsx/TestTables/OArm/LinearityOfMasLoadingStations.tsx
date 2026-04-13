// components/TestTables/LinearityOfMasLoadingStationsForOArm.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createLinearityOfMasLoadingStationForOArm,
  getLinearityOfMasLoadingStationByServiceIdForOArm,
  updateLinearityOfMasLoadingStationForOArm,
} from '../../../../../../api';

interface Table1Row { fcd: string; kv: string; time: string; }
interface Table2Row {
  id: string;
  mAsRange: string; // mA value when mode=mA, mAs range when mode=mAs
  measuredOutputs: string[];
  measuredOutputsStatus: boolean[];
  average: string; x: string; xMax: string; xMin: string; col: string; remarks: string;
}
interface Props {
  serviceId: string; testId?: string; onRefresh?: () => void; csvData?: any[];
  mode?: 'mA' | 'mAs'; // mA = timer mode (X = mGy/(mA*s)), mAs = no timer (X = mGy/mAs)
}

const LinearityOfMasLoadingStationsForOArm: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh, csvData, mode }) => {
  const isMaMode = mode === 'mA';
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Table 1 — mA mode has FDD + kV + Time; mAs mode has FDD + kV
  const [table1Row, setTable1Row] = useState<Table1Row>({ fcd: '100', kv: '80', time: '' });

  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);
  
  const defaultRows = (): Table2Row[] => isMaMode
    ? [
        { id: '1', mAsRange: '50',  measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '2', mAsRange: '100', measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '3', mAsRange: '200', measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '4', mAsRange: '300', measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
      ]
    : [
        { id: '1', mAsRange: '5',   measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '2', mAsRange: '10',  measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '3', mAsRange: '20',  measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '4', mAsRange: '50', measuredOutputs: ['', '', ''], measuredOutputsStatus: [true, true, true], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
      ];

  const [table2Rows, setTable2Rows] = useState<Table2Row[]>(defaultRows);
  const [tolerance, setTolerance] = useState<string>('0.1');
  const [toleranceOperator, setToleranceOperator] = useState<string>('<=');

  /** Keep one measurement cell per header so thead colSpan matches tbody (fixes mA column shifting). */
  const padOutputsToLen = (outputs: string[], len: number): string[] => {
    const o = [...outputs];
    while (o.length < len) o.push('');
    if (o.length > len) o.length = len;
    return o;
  };

  const asMaCellString = (v: unknown): string => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
    return String(v).trim();
  };

  // Column handlers
  const addMeasColumn = () => {
    setMeasHeaders(prev => [...prev, `Meas ${prev.length + 1}`]);
    setTable2Rows(prev =>
      prev.map(row => ({ 
        ...row, 
        measuredOutputs: [...row.measuredOutputs, ''],
        measuredOutputsStatus: [...(row.measuredOutputsStatus || []), true]
      }))
    );
  };
  
  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(prev => prev.filter((_, i) => i !== idx));
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        measuredOutputs: row.measuredOutputs.filter((_, i) => i !== idx),
        measuredOutputsStatus: (row.measuredOutputsStatus || []).filter((_, i) => i !== idx),
      }))
    );
  };
  
  const addTable2Row = () => setTable2Rows(prev => [...prev, {
    id: Date.now().toString(), 
    mAsRange: '',
    measuredOutputs: Array(measHeaders.length).fill(''),
    measuredOutputsStatus: Array(measHeaders.length).fill(true),
    average: '', x: '', xMax: '', xMin: '', col: '', remarks: '',
  }]);
  
  const removeTable2Row = (id: string) => { 
    if (table2Rows.length <= 1) return; 
    setTable2Rows(prev => prev.filter(r => r.id !== id)); 
  };
  
  const updateCell = (rowId: string, field: 'mAsRange' | number, value: string) => {
    if (isViewMode) return;
    setTable2Rows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      if (field === 'mAsRange') return { ...r, mAsRange: value };
      if (typeof field === 'number') {
        const outputs = [...r.measuredOutputs]; 
        outputs[field] = value;
        return { ...r, measuredOutputs: outputs };
      }
      return r;
    }));
  };

  // Load from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) { setIsLoading(false); return; }
      try {
        const data = await getLinearityOfMasLoadingStationByServiceIdForOArm(serviceId);
        if (data) {
          setTestId(data._id || null);
          if (data.table1?.[0]) {
            setTable1Row({ fcd: data.table1[0].fcd || '100', kv: data.table1[0].kv || '80', time: data.table1[0].time || '' });
          }
          const headers = data.measHeaders?.length > 0 ? data.measHeaders : ['Meas 1', 'Meas 2', 'Meas 3'];
          setMeasHeaders(headers);
          if (Array.isArray(data.table2) && data.table2.length > 0) {
            const colCount = headers.length;
            setTable2Rows(
              data.table2.map((r: any, idx: number) => ({
                id: Date.now().toString() + Math.random() + idx,
                mAsRange: asMaCellString(r.mAsApplied ?? r.mAsRange ?? r.ma ?? ''),
                measuredOutputs: padOutputsToLen(
                  (r.measuredOutputs || []).map((v: any) => asMaCellString(v)),
                  colCount
                ),
                measuredOutputsStatus: Array(colCount).fill(true),
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
          setToleranceOperator(data.toleranceOperator || '<=');
          setHasSaved(true); 
          setIsEditing(false);
        } else { 
          setIsEditing(true); 
        }
      } catch (err: any) {
        if (err.response?.status !== 404) toast.error('Failed to load linearity data');
        setIsEditing(true);
      } finally { setIsLoading(false); }
    };
    load();
  }, [serviceId]);

  // Align row output counts with measurement headers (covers add/remove column + API mismatch)
  useEffect(() => {
    const len = measHeaders.length;
    if (len < 1) return;
    setTable2Rows(prev => {
      let needsUpdate = false;
      const next = prev.map(r => {
        const mo = r.measuredOutputs || [];
        const status = r.measuredOutputsStatus || [];
        if (mo.length === len && status.length === len) return r;
        needsUpdate = true;
        return { 
          ...r, 
          measuredOutputs: padOutputsToLen(mo, len),
          measuredOutputsStatus: Array(len).fill(true)
        };
      });
      return needsUpdate ? next : prev;
    });
  }, [measHeaders]);

  // CSV data import
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;
    try {
      const rowMap: { [idx: number]: any } = {};
      csvData.forEach((item: any) => {
        const idx = item['Row Index'];
        if (!rowMap[idx]) rowMap[idx] = {};
        rowMap[idx][item['Field Name']] = item['Value'];
      });
      
      const firstRow = rowMap[1] || {};
      if (firstRow['Exposure_FCD'] || firstRow['Exposure_KV'] || firstRow['Exposure_Time']) {
        setTable1Row(p => ({
          ...p,
          fcd: firstRow['Exposure_FCD'] || p.fcd,
          kv: firstRow['Exposure_KV'] || p.kv,
          time: firstRow['Exposure_Time'] != null && firstRow['Exposure_Time'] !== '' ? String(firstRow['Exposure_Time']) : p.time,
        }));
      }
      
      const newRows: Table2Row[] = [];
      Object.keys(rowMap).forEach(idxStr => {
        const r = rowMap[parseInt(idxStr)];
        const measuredOutputs: string[] = [];
        for (let m = 0; m < 10; m++) { 
          const val = r[`Row_Meas_${m}`]; 
          if (val !== undefined && val !== '') measuredOutputs.push(String(val)); 
        }
        if (r['Row_mAsRange'] || measuredOutputs.length > 0) {
          const colCount = Math.max(measuredOutputs.length, measHeaders.length, 3);
          const paddedOutputs = padOutputsToLen(measuredOutputs, colCount);
          newRows.push({ 
            id: Date.now().toString() + Math.random() + idxStr, 
            mAsRange: r['Row_mAsRange'] || '',
            measuredOutputs: paddedOutputs,
            measuredOutputsStatus: Array(paddedOutputs.length).fill(true), 
            average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' 
          });
        }
      });
      
      if (newRows.length > 0) {
        const colCount = Math.max(
          ...newRows.map(r => r.measuredOutputs.length),
          measHeaders.length,
          3
        );
        setMeasHeaders(Array.from({ length: colCount }, (_, i) => `Meas ${i + 1}`));
        setTable2Rows(
          newRows.map(r => ({
            ...r,
            measuredOutputs: padOutputsToLen(r.measuredOutputs, colCount),
            measuredOutputsStatus: Array(colCount).fill(true),
          }))
        );
        setHasSaved(false);
        setIsEditing(true);
      }
    } catch (err) { 
      console.error('Linearity CSV error:', err); 
    }
  }, [csvData]);

  // CoL calculation
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const timeSec = parseFloat(table1Row.time) || 0;
    const xValues: number[] = [];

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(String(v))).filter(v => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? outputs.reduce((a, b) => a + b, 0) / outputs.length : null;
      const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : '—';

      const mAsLabel = String(row.mAsRange ?? '').trim();
      const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      const midVal = match ? (parseFloat(match[1]) + parseFloat(match[2])) / 2 : parseFloat(mAsLabel) || 0;

      let x: number | null = null;
      if (avg !== null && midVal > 0) {
        if (isMaMode && timeSec > 0) x = avg / (midVal * timeSec); // mGy / (mA * s)
        else if (!isMaMode) x = avg / midVal;                       // mGy / mAs
      }
      const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : '—';
      if (x !== null) xValues.push(parseFloat(x.toFixed(4)));
      return { ...row, average: avgDisplay, x: xDisplay };
    });

    const hasData = xValues.length > 0;
    const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : '—';
    const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : '—';
    const colNum = hasData && xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin)) : 0;
    const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';

    let pass = false;
    if (hasData && col !== '—') {
      const c = parseFloat(col);
      switch (toleranceOperator) {
        case '<': pass = c < tol; break; 
        case '>': pass = c > tol; break;
        case '<=': pass = c <= tol; break; 
        case '>=': pass = c >= tol; break;
        case '=': pass = Math.abs(c - tol) < 0.0001; break; 
        default: pass = c <= tol;
      }
    }
    const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';

    const rowsWithStatus = rowsWithX.map(row => ({
      ...row,
      measuredOutputsStatus: row.measuredOutputs.map(val => {
        const n = parseFloat(String(val));
        if (isNaN(n) || n <= 0) return true;
        return pass || !hasData || col === '—';
      }),
    }));

    return { rows: rowsWithStatus, summary: { xMax, xMin, col, remarks, rowSpan: rowsWithStatus.length } };
  }, [table2Rows, tolerance, toleranceOperator, isMaMode, table1Row.time, measHeaders.length]);

  const processedRowById = useMemo(() => {
    const map = new Map<string, any>();
    processedTable2.rows.forEach((row) => map.set(row.id, row));
    return map;
  }, [processedTable2.rows]);

  // Save handler
  const handleSave = async () => {
    if (!serviceId) { toast.error('Service ID is missing'); return; }
    setIsSaving(true);
    try {
      const payload = {
        selection: isMaMode ? 'mA' : 'mAs',
        table1: [table1Row],
        table2: processedTable2.rows.map(r => ({
          mAsApplied: r.mAsRange, 
          ma: r.mAsRange,
          measuredOutputs: r.measuredOutputs.map(v => { 
            const val = v.trim(); 
            return val === '' ? null : (isNaN(parseFloat(val)) ? val : parseFloat(val)); 
          }),
          average: r.average || '', 
          x: r.x || '',
        })),
        measHeaders, 
        tolerance, 
        toleranceOperator,
        xMax: processedTable2.summary.xMax, 
        xMin: processedTable2.summary.xMin,
        col: processedTable2.summary.col, 
        remarks: processedTable2.summary.remarks,
      };
      
      let currentTestId = testId;
      if (!currentTestId) {
        try { 
          const ex = await getLinearityOfMasLoadingStationByServiceIdForOArm(serviceId); 
          if (ex?._id) { 
            currentTestId = ex._id; 
            setTestId(currentTestId); 
          } 
        } catch {}
      }
      
      if (currentTestId) {
        await updateLinearityOfMasLoadingStationForOArm(currentTestId, payload); 
        toast.success('Updated successfully!');
      } else {
        const result = await createLinearityOfMasLoadingStationForOArm(serviceId, payload);
        const newId = result?.data?._id || result?.data?.data?._id || result?._id;
        if (newId) setTestId(newId);
        toast.success('Saved successfully!');
      }
      setHasSaved(true); 
      setIsEditing(false); 
      onRefresh?.();
    } catch (err: any) { 
      toast.error(err?.response?.data?.message || err?.message || 'Save failed'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const toggleEdit = () => setIsEditing(true);
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;
  const xLabel = isMaMode ? 'mGy/(mA·s)' : 'mGy/mAs';
  const rowLabel = isMaMode ? 'mA' : 'mAs Range';

  if (isLoading) return (
    <div className="flex items-center justify-center p-10">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="ml-2">Loading...</span>
    </div>
  );

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Linearity of {isMaMode ? 'mA' : 'mAs'} Loading</h2>
        <button onClick={isViewMode ? toggleEdit : handleSave} disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : isViewMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'}`}>
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><ButtonIcon className="w-4 h-4" />{buttonText} {isMaMode ? 'mA' : 'mAs'} Linearity</>}
        </button>
      </div>

      {/* Table 1 — Exposure Conditions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-teal-50 border-b">
          <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 border-r">FDD (cm)</th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-700 ${isMaMode ? 'border-r' : ''}`}>kV</th>
              {isMaMode && <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Time (sec)</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-6 py-4 border-r">
                <input type="text" value={table1Row.fcd} onChange={e => setTable1Row(p => ({ ...p, fcd: e.target.value }))} disabled={isViewMode}
                  className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
              </td>
              <td className={`px-6 py-4 ${isMaMode ? 'border-r' : ''}`}>
                <input type="text" value={table1Row.kv} onChange={e => setTable1Row(p => ({ ...p, kv: e.target.value }))} disabled={isViewMode}
                  className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
              </td>
              {isMaMode && (
                <td className="px-6 py-4">
                  <input type="text" value={table1Row.time} onChange={e => setTable1Row(p => ({ ...p, time: e.target.value }))} disabled={isViewMode} placeholder="e.g. 0.5"
                    className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">Linearity of Radiation Output Across {isMaMode ? 'mA' : 'mAs'} Ranges</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <colgroup>
              <col className="w-[6.5rem]" />
              {measHeaders.map((_, i) => (
                <col key={`mcol-${i}`} className="w-[6.5rem]" />
              ))}
              <col className="w-[5.5rem]" />
              <col className="w-[6rem]" />
              <col className="w-[5rem]" />
              <col className="w-[5rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[6.5rem]" />
              <col className="w-12" />
            </colgroup>
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-700 border-r align-middle">{rowLabel}</th>
                <th colSpan={measHeaders.length} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  <div className="flex items-center justify-between px-4">
                    <span>Radiation Output (mGy)</span>
                    {!isViewMode && <button onClick={addMeasColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg"><Plus className="w-5 h-5" /></button>}
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">Avg Output</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">X ({xLabel})</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">X MAX</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">X MIN</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">CoL</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700">Remarks</th>
                <th rowSpan={2} className="w-12" />
              </tr>
              <tr>
                {measHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r">
                    <div className="flex items-center justify-center gap-2">
                      <input type="text" value={h} onChange={e => { setMeasHeaders(p => { const c = [...p]; c[i] = e.target.value || `Meas ${i + 1}`; return c; }); }} disabled={isViewMode}
                        className={`w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
                      {measHeaders.length > 1 && !isViewMode && <button onClick={() => removeMeasColumn(i)} className="text-red-600 hover:bg-red-100 p-1 rounded"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table2Rows.map((row, index) => {
                const computed = processedRowById.get(row.id) || row;
                return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 border-r align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.mAsRange === undefined || row.mAsRange === null ? '' : String(row.mAsRange)}
                      onChange={e => updateCell(row.id, 'mAsRange', e.target.value)}
                      disabled={isViewMode}
                      placeholder={isMaMode ? '100' : '10 - 20'}
                      className={`w-full min-w-0 px-2 py-2 text-center text-sm text-gray-900 border rounded font-medium focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''}`}
                    />
                  </td>
                  {measHeaders.map((_, idx) => {
                    const val = row.measuredOutputs[idx] ?? '';
                    const hasValue = val !== '' && !isNaN(parseFloat(String(val))) && parseFloat(String(val)) > 0;
                    const isValid = computed.measuredOutputsStatus?.[idx] !== false;
                    return (
                      <td key={idx} className={`px-2 py-4 text-center border-r align-top ${hasValue && !isValid ? 'bg-red-100' : ''}`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={val}
                          onChange={e => updateCell(row.id, idx, e.target.value)}
                          disabled={isViewMode}
                          className={`w-full min-w-0 px-2 py-2 text-center text-sm text-gray-900 border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : hasValue && !isValid ? 'border-red-500 bg-red-50' : ''}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{computed.average}</td>
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{computed.x}</td>
                  {index === 0 && (
                    <>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-6 py-4 text-center font-bold border-r bg-yellow-50 align-middle">{processedTable2.summary.xMax}</td>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-6 py-4 text-center font-bold border-r bg-yellow-50 align-middle">{processedTable2.summary.xMin}</td>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-6 py-4 text-center font-bold border-r bg-yellow-50 align-middle">{processedTable2.summary.col}</td>
                      <td rowSpan={processedTable2.summary.rowSpan} className="px-6 py-4 text-center align-middle">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${processedTable2.summary.remarks === 'Pass' ? 'bg-green-100 text-green-800' : processedTable2.summary.remarks === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                          {processedTable2.summary.remarks || '—'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-4 text-center">
                    {table2Rows.length > 1 && !isViewMode && <button onClick={() => removeTable2Row(row.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-5 h-5" /></button>}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && <button onClick={addTable2Row} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"><Plus className="w-5 h-5" /> Add {rowLabel}</button>}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL)</span>
            <select value={toleranceOperator} onChange={e => setToleranceOperator(e.target.value)} disabled={isViewMode}
              className={`px-3 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}>
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
              <option value="<=">&lt;=</option>
              <option value=">=">&gt;=</option>
              <option value="=">=</option>
            </select>
            <input type="number" step="0.001" value={tolerance} onChange={e => setTolerance(e.target.value)} disabled={isViewMode}
              className={`w-32 px-4 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearityOfMasLoadingStationsForOArm;