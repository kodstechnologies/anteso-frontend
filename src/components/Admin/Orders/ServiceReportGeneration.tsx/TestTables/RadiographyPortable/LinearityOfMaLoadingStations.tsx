// components/TestTables/LinearityOfMaLoading.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfMasLoadingStationsForRadiographyPortable,
  getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable,
  updateLinearityOfMasLoadingStationsForRadiographyPortable,
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
  initialData?: any;
  csvDataVersion?: number;
}

const LinearityOfMaLoading: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh, initialData, csvDataVersion }) => {
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
  const [toleranceOperator, setToleranceOperator] = useState<string>('<');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Apply Excel/CSV-derived initial data (same pattern as Radiography Fixed)
  useEffect(() => {
    if (!initialData || !csvDataVersion) return;
    const sanitizeNumeric = (v: unknown, fallback: string) => {
      const s = String(v ?? '').trim();
      if (!s || /tolerance|operator|meas|applied/i.test(s) || Number.isNaN(Number(s))) return fallback;
      return s;
    };
    const padOutputs = (outputs: string[], count: number) => {
      const next = outputs.map((v) => (v != null ? String(v) : ''));
      while (next.length < count) next.push('');
      return next.slice(0, count);
    };
    const rawT1 = initialData.table1;
    const t1 = rawT1 && !Array.isArray(rawT1) ? rawT1 : rawT1?.[0];
    if (t1) {
      setTable1Row((prev) => ({
        ...prev,
        fcd: sanitizeNumeric(t1.fcd ?? t1.fdd ?? t1.ffd, prev.fcd),
        kv: sanitizeNumeric(t1.kv ?? t1.kV ?? t1.kVp, prev.kv),
        time: sanitizeNumeric(t1.time ?? t1.Time, prev.time),
      }));
    }
    if (initialData.table2?.length > 0) {
      const maxOutputs = Math.max(
        0,
        ...initialData.table2.map((r: any) => (r.measuredOutputs ?? []).length),
        Array.isArray(initialData.measHeaders) ? initialData.measHeaders.length : 0,
      );
      const headerCount = Math.max(maxOutputs, 1);
      const headers =
        Array.isArray(initialData.measHeaders) && initialData.measHeaders.length > 0
          ? padOutputs(initialData.measHeaders.map(String), headerCount).map((h, i) => h || `Meas ${i + 1}`)
          : Array.from({ length: headerCount }, (_, i) => `Meas ${i + 1}`);
      setMeasHeaders(headers);
      setTable2Rows(
        initialData.table2.map((r: any, i: number) => {
          const outputs = (r.measuredOutputs ?? []).map((v: any) => (v != null ? String(v) : ''));
          return {
            id: (i + 1).toString(),
            ma: String(r.mAApplied ?? r.ma ?? r.mAsApplied ?? ''),
            measuredOutputs: padOutputs(outputs, headerCount),
            average: '',
            x: '',
            xMax: '',
            xMin: '',
            col: '',
            remarks: '',
          };
        })
      );
    } else if (Array.isArray(initialData.measHeaders) && initialData.measHeaders.length > 0) {
      setMeasHeaders(initialData.measHeaders.map((h: any, i: number) => String(h || `Meas ${i + 1}`)));
    }
    if (initialData.tolerance !== undefined) setTolerance(String(initialData.tolerance));
    if (initialData.toleranceOperator) setToleranceOperator(String(initialData.toleranceOperator));
    setHasSaved(false);
    setIsEditing(true);
  }, [csvDataVersion]);

  // Keep each row's measuredOutputs aligned with measHeaders (avoids column shift / hidden mA column)
  useEffect(() => {
    const n = measHeaders.length;
    if (n <= 0) return;
    setTable2Rows((prev) => {
      if (!prev.some((row) => row.measuredOutputs.length !== n)) return prev;
      return prev.map((row) => {
        const out = [...row.measuredOutputs];
        while (out.length < n) out.push('');
        if (out.length > n) out.length = n;
        return { ...row, measuredOutputs: out };
      });
    });
  }, [measHeaders.length]);

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
      const avg = outputs.length > 0 ? parseFloat((outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(4)) : null;
      const avgDisplay = avg !== null ? avg.toFixed(4) : '—';

      const ma = parseFloat(row.ma);
      const timeSec = parseFloat(table1Row.time);
      const hasValidTime = !isNaN(timeSec) && timeSec > 0;
      const mAs = !isNaN(ma) && ma > 0 && hasValidTime ? ma * timeSec : null;

      // Time entered: X = mGy/(mA*s). Otherwise: X = mGy/mA.
      let x: number | null = null;
      if (avg !== null && mAs && mAs > 0) {
        x = parseFloat((avg / mAs).toFixed(4));
      } else if (avg !== null && !isNaN(ma) && ma > 0) {
        x = parseFloat((avg / ma).toFixed(4));
      }

      const xDisplay = x !== null ? x.toFixed(4) : '—';

      if (x !== null) xValues.push(x);

      return { ...row, average: avgDisplay, x: xDisplay };
    });

    const hasData = xValues.length > 0;
    const xMax = hasData ? Math.max(...xValues).toFixed(4) : '—';
    const xMin = hasData ? Math.min(...xValues).toFixed(4) : '—';
    const colNum = xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : null;
    const colVal = colNum !== null ? colNum.toFixed(4) : '—';

    let pass = false;
    let remarks = '';
    if (hasData && colVal !== '—' && colNum !== null) {
      const colParsed = parseFloat(colVal);
      switch (toleranceOperator) {
        case '<':
          pass = colParsed < tol;
          break;
        case '>':
          pass = colParsed > tol;
          break;
        case '<=':
          pass = colParsed <= tol;
          break;
        case '>=':
          pass = colParsed >= tol;
          break;
        case '=':
          pass = Math.abs(colParsed - tol) < 0.0001;
          break;
        default:
          pass = colParsed <= tol;
      }
      remarks = pass ? 'Pass' : 'Fail';
    }

    return {
      rows: rowsWithX,
      summary: { xMax, xMin, col: colVal, remarks, rowSpan: rowsWithX.length },
    };
  }, [table2Rows, tolerance, toleranceOperator, table1Row.time, measHeaders.length]);

  const hasValidTime = useMemo(() => {
    const timeSec = parseFloat(table1Row.time);
    return table1Row.time.trim() !== '' && !Number.isNaN(timeSec) && timeSec > 0;
  }, [table1Row.time]);

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.fcd.trim() &&
      table1Row.kv.trim() &&
      hasValidTime &&
      table2Rows.every(r => r.ma.trim() && r.measuredOutputs.some(v => v.trim()))
    );
  }, [serviceId, table1Row, table2Rows, hasValidTime]);

  // === Load Data from backend ===
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Prefer Excel/CSV import over stale API data (same as Radiography Fixed)
      if (csvDataVersion) {
        setIsLoading(false);
        return;
      }
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable(serviceId);
        if (cancelled) return;
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setTable1Row({
            fcd: data.table1?.[0]?.fcd || '',
            kv: data.table1?.[0]?.kv || '',
            time: data.table1?.[0]?.time || '',
          });
          const mh =
            data.measHeaders && data.measHeaders.length > 0 ? data.measHeaders : ['Meas 1', 'Meas 2', 'Meas 3'];
          setMeasHeaders(mh);
          if (Array.isArray(data.table2) && data.table2.length > 0) {
            const colCount = mh.length;
            setTable2Rows(
              data.table2.map((r: any) => {
                const outputs = (r.measuredOutputs || []).map((v: any) => (v != null ? String(v) : ''));
                while (outputs.length < colCount) outputs.push('');
                if (outputs.length > colCount) outputs.length = colCount;
                return {
                  id: Date.now().toString() + Math.random(),
                  ma: r.mAsApplied || r.ma || '',
                  measuredOutputs: outputs,
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
          setToleranceOperator(data.toleranceOperator || '<=');
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (!cancelled && err.response?.status !== 404) {
          toast.error('Failed to load mA linearity data');
        }
        if (!cancelled) setIsEditing(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [serviceId, csvDataVersion]);

  // === Save Handler (connected to Fixed Radio Fluoro API) ===
  const handleSave = async () => {
    console.log('handleSave called', { isFormValid, serviceId, testId, table1Row, table2Rows: table2Rows.length });

    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    if (!isFormValid) {
      toast.error(hasValidTime ? 'Please fill all required fields' : 'Time (sec) must be greater than 0');
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
        table2: processedTable2.rows.map(r => ({
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
        toleranceOperator,
        xMax: processedTable2.summary.xMax,
        xMin: processedTable2.summary.xMin,
        col: processedTable2.summary.col,
        remarks: processedTable2.summary.remarks,
      };

      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable(serviceId);
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
        result = await updateLinearityOfMasLoadingStationsForRadiographyPortable(currentTestId, payload);
        console.log('Update result:', result);
        toast.success('Updated successfully!');
      } else {
        // Create new (backend uses upsert, so this will work even if data exists)
        console.log('Creating new with serviceId:', serviceId);
        result = await addLinearityOfMasLoadingStationsForRadiographyPortable(serviceId, payload);
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
  const isTimerSelected = String(table1Row.time || '').trim() !== '';
  // This component is mA Loading (with timer). Do not show mAs Loading heading.
  const tableTitle = 'Linearity of mA Loading';
  const sectionTitle = 'Linearity of Radiation Output Across mA Stations';
  const xUnitLabel = isTimerSelected ? 'mGy/(mA*s)' : 'mGy/mA';

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
      <h2 className="text-2xl font-bold mb-6">{tableTitle}</h2>

      {!isViewMode && table1Row.time.trim() && !hasValidTime && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            Time (sec) must be greater than 0 for X = mGy/(mA × sec) calculation.
          </p>
        </div>
      )}

      {/* Table 1: FCD, kV, Time (sec) */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8 border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">FCD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">kV</th>
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
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : !hasValidTime && table1Row.time.trim() ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.5"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: mA, output (mGy), X — unit depends on whether time (sec) is entered */}
      <div className="bg-white shadow-md rounded-lg border border-gray-200">
        <div className="px-4 py-3 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">{sectionTitle}</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-max w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-20 min-w-[7rem] w-28 px-6 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r border-gray-200 whitespace-nowrap bg-blue-50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]"
              >
                mA
              </th>
              <th
                colSpan={measHeaders.length}
                className="px-4 py-3 text-center text-xs font-medium text-gray-700  tracking-wider border-r"
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
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Avg output (mGy)</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X ({xUnitLabel})</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X MAX</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X MIN</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">CoL</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">Remarks</th>
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
            {processedTable2.rows.map((p, index) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 min-w-[7rem] w-28 px-4 py-2 border-r border-gray-200 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  <input
                    type="text"
                    value={p.ma}
                    onChange={e => updateTable2Cell(p.id, 'ma', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full min-w-0 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
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
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${processedTable2.summary.remarks === 'Pass'
                          ? 'bg-green-100 text-green-800'
                          : processedTable2.summary.remarks === 'Fail'
                            ? 'bg-red-100 text-red-800'
                            : 'text-gray-400'
                          }`}
                      >
                        {processedTable2.summary.remarks || '—'}
                      </span>
                    </td>
                  </>
                )}

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
        </div>

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
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL)</span>
            <select
              value={toleranceOperator}
              onChange={e => setToleranceOperator(e.target.value)}
              disabled={isViewMode}
              className={`px-3 py-2 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            >
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
              <option value="<=">&lt;=</option>
              <option value=">=">&gt;=</option>
              <option value="=">=</option>
            </select>
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
              {buttonText} {isTimerSelected ? 'mAs' : 'mA'} Linearity
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LinearityOfMaLoading;