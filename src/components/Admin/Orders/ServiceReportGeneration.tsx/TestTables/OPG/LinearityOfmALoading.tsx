// components/TestTables/LinearityOfMaLoading.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfMaLoadingForOPG,
  getLinearityOfMaLoadingByServiceIdForOPG,
  updateLinearityOfMaLoadingForOPG,
} from '../../../../../../api';
import { useRegisterTestExport } from '../shared/TestExportRegistry';

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
  csvData?: any[];
}

const LinearityOfMaLoading: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1: FCD, kV, Time (sec)
  const [table1Row, setTable1Row] = useState<Table1Row>({ fcd: '', kv: '', time: '' });

  // Table 2: mA values + dynamic measurement columns
  const [measHeaders, setMeasHeaders] = useState<string[]>(['Measured mR 1', 'Measured mR 2', 'Measured mR 3']);
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
  const csvAppliedRef = useRef(false);
  const csvDataKeyRef = useRef<string>('');

  const padOutputs = (outputs: string[], count: number) => {
    const next = (outputs || []).map((v) => (v != null ? String(v) : ''));
    while (next.length < count) next.push('');
    return next.slice(0, count);
  };

  // === Column Handling ===
  const addMeasColumn = () => {
    const nextCount = measHeaders.length + 1;
    setMeasHeaders(prev => [...prev, `Measured mR ${prev.length + 1}`]);
    setTable2Rows(rows =>
      rows.map(row => ({
        ...row,
        measuredOutputs: padOutputs(row.measuredOutputs || [], nextCount),
      }))
    );
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(prev => prev.filter((_, i) => i !== idx));
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        measuredOutputs: (row.measuredOutputs || []).filter((_, i) => i !== idx),
      }))
    );
  };

  const updateMeasHeader = (idx: number, value: string) => {
    setMeasHeaders(prev => {
      const copy = [...prev];
      copy[idx] = value || `Measured mR ${idx + 1}`;
      return copy;
    });
  };

  // Keep row cell counts aligned with measurement headers
  useEffect(() => {
    const len = measHeaders.length;
    if (len < 1) return;
    setTable2Rows(prev => {
      let needsUpdate = false;
      const next = prev.map(r => {
        const mo = r.measuredOutputs || [];
        if (mo.length === len) return r;
        needsUpdate = true;
        return { ...r, measuredOutputs: padOutputs(mo, len) };
      });
      return needsUpdate ? next : prev;
    });
  }, [measHeaders]);

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
          const newOutputs = padOutputs(row.measuredOutputs || [], Math.max(measHeaders.length, field + 1));
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
      const rowHasValidTime = !isNaN(timeSec) && timeSec > 0;
      const mAs = !isNaN(ma) && ma > 0 && rowHasValidTime ? ma * timeSec : null;
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
    const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : '—';
    const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : '—';
    const colNum = hasData && xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : null;
    const col = hasData && colNum !== null && colNum >= 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';

    let pass = false;
    let remarks = '—';
    if (hasData && col !== '—' && colNum !== null) {
      const colVal = parseFloat(col);
      switch (toleranceOperator) {
        case '<':
          pass = colVal < tol;
          break;
        case '>':
          pass = colVal > tol;
          break;
        case '<=':
          pass = colVal <= tol;
          break;
        case '>=':
          pass = colVal >= tol;
          break;
        case '=':
          pass = Math.abs(colVal - tol) < 0.0001;
          break;
        default:
          pass = colVal <= tol;
      }
      remarks = pass ? 'Pass' : 'Fail';
    }

    return {
      rows: rowsWithX,
      summary: { xMax, xMin, col, remarks, rowSpan: rowsWithX.length },
    };
  }, [table2Rows, tolerance, toleranceOperator, table1Row.time]);

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
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await getLinearityOfMaLoadingByServiceIdForOPG(serviceId);
        const data = res?.data;
        const hasCsvImport = !!(csvData && csvData.length > 0);
        if (data) {
          setTestId(data._id || null);
          if (!hasCsvImport) {
            setTable1Row({
              fcd: data.table1?.fcd || '',
              kv: data.table1?.kv || '',
              time: data.table1?.time || '',
            });
            if (Array.isArray(data.table2) && data.table2.length > 0) {
              const maxOutputs = Math.max(
                0,
                ...data.table2.map((r: any) => (r.measuredOutputs || []).length),
                Array.isArray(data.measHeaders) ? data.measHeaders.length : 0,
              );
              const headerCount = Math.max(maxOutputs, 3);
              const headers =
                Array.isArray(data.measHeaders) && data.measHeaders.length > 0
                  ? padOutputs(data.measHeaders.map(String), headerCount).map((h, i) => h || `Measured mR ${i + 1}`)
                  : Array.from({ length: headerCount }, (_, i) => `Measured mR ${i + 1}`);
              setMeasHeaders(headers);
              setTable2Rows(
                data.table2.map((r: any, i: number) => ({
                  id: String(i + 1),
                  ma: r.ma || '',
                  measuredOutputs: padOutputs(
                    (r.measuredOutputs || []).map((v: any) => (v != null ? String(v) : '')),
                    headerCount,
                  ),
                  average: '',
                  x: '',
                  xMax: '',
                  xMin: '',
                  col: '',
                  remarks: '',
                }))
              );
            } else if (Array.isArray(data.measHeaders) && data.measHeaders.length > 0) {
              setMeasHeaders(data.measHeaders);
            }
            setTolerance(data.tolerance || '0.1');
            setToleranceOperator(data.toleranceOperator || '<');
            setHasSaved(true);
            setIsEditing(false);
          } else {
            setHasSaved(false);
            setIsEditing(true);
          }
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
    // Only re-fetch when service changes. CSV import is handled by a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const isFcdLabel = (c: unknown) => {
    const s = c?.toString()?.trim().toLowerCase() || '';
    return s === 'fcd' || s === 'fdd' || s === 'ffd';
  };
  const isKvLabel = (c: unknown) => (c?.toString()?.trim().toLowerCase() || '').includes('kv');
  const isTimeLabel = (c: unknown) => {
    const s = c?.toString()?.trim().toLowerCase() || '';
    return s === 'timer' || s === 'time' || s.startsWith('time ') || s.startsWith('timer ');
  };

  const isMaStationHeaderRow = (row: any[]) => {
    const c0 = String(row?.[0] ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    return c0 === 'ma station' || c0.startsWith('ma station');
  };

  const preserveExcelHeaderCell = (header: unknown): string => {
    const h = String(header ?? '').trim();
    if (!h || /^\d{1,2}-[A-Za-z]{3}$/i.test(h)) return '';
    return h;
  };

  const readMeasHeadersFromCsv = (rows: any[]): string[] => {
    const meta = rows.find((r) => String(r?.[0] ?? '').trim() === '__MEAS_HEADERS__');
    if (meta) {
      return meta.slice(1).map((c:any) => preserveExcelHeaderCell(c)).filter(Boolean);
    }
    const headerRow = rows.find((row) => isMaStationHeaderRow(row));
    if (!headerRow) return [];
    return headerRow
      .slice(1)
      .map((c: any) => preserveExcelHeaderCell(c))
      .filter((s: string) => s && !/^mr\/mas$/i.test(s));
  };

  // CSV Data Injection — apply once per import after load finishes
  useEffect(() => {
    if (isLoading || !csvData || csvData.length === 0) return;

    // Stable key so re-renders / isLoading flips do not wipe columns added in the UI
    const csvKey = JSON.stringify(csvData);
    if (csvAppliedRef.current && csvDataKeyRef.current === csvKey) return;
    csvAppliedRef.current = true;
    csvDataKeyRef.current = csvKey;

    let newTable2Rows: Table2Row[] = [];
    let foundSettings = false;
    let customMeasHeaders = readMeasHeadersFromCsv(csvData);

    csvData.forEach((row, idx) => {
        const firstCell = row[0]?.toString()?.trim();

        if (String(firstCell || '') === '__MEAS_HEADERS__') return;

        // Tolerance Operator / Value rows
        if (firstCell && /^(Tolerance Operator|Tol Operator|Tolerance_Operator)$/i.test(firstCell)) {
          const op = String(row[1] ?? '').trim();
          if (['<', '>', '<=', '>=', '='].includes(op)) setToleranceOperator(op);
          return;
        }
        if (firstCell && /^(Tolerance Value \(CoL\)|Tolerance Value|Tol Value|Tolerance)$/i.test(firstCell)) {
          const val = String(row[1] ?? '').trim();
          if (val) setTolerance(val);
          return;
        }

        // 1. Parameter Row: FCD, 100, kV, 70, Time, 0.1 — only rows with Time/Timer (mA loading)
        const hasFcd = row.some((c: any) => isFcdLabel(c));
        const hasKv = row.some((c: any) => isKvLabel(c));
        const tIndex = row.findIndex((c: any) => isTimeLabel(c));
        if (hasFcd && hasKv && tIndex >= 0) {
          const fIndex = row.findIndex((c: any) => isFcdLabel(c));
          const kIndex = row.findIndex((c: any) => isKvLabel(c));

          setTable1Row({
            fcd: row[fIndex + 1] != null ? String(row[fIndex + 1]) : '',
            kv: row[kIndex + 1] != null ? String(row[kIndex + 1]) : '',
            time: row[tIndex + 1] != null ? String(row[tIndex + 1]) : '',
          });
          foundSettings = true;
        }
        // 2. Data Rows
        else if (firstCell && !isMaStationHeaderRow(row) && !isNaN(parseFloat(firstCell))) {
          // Format in Template: mA Station, Meas 1, Meas 2... 
          // Format in Export: mA Station, Meas 1, Meas 2, Average, mR/mAs
          const ma = row[0]?.toString() || '';

          const potentialMeas = row.slice(1);
          const meas: string[] = [];

          potentialMeas.forEach((val: any) => {
            const s = val?.toString()?.trim();
            // If it's numeric and not a known remark
            if (s && !isNaN(parseFloat(s)) && !['Pass', 'Fail', 'PASS', 'FAIL'].includes(s)) {
              meas.push(s);
            }
          });

          // Detect and strip imported calculation columns (Average, mR/mAs)
          // ONLY if it looks like a processed file (e.g. has Pass/Fail in original row or magnitude shift)
          const hasRemark = row.some((c: any) => ['Pass', 'Fail', 'PASS', 'FAIL'].includes(c?.toString()?.trim()));

          if (meas.length > 2) {
            const mrmas = parseFloat(meas[meas.length - 1]);
            const avg = parseFloat(meas[meas.length - 2]);
            const firstMeas = parseFloat(meas[0]);

            // Heuristic: mR/mAs is usually ~1.0, while output is ~10-100.
            // Also check if Average matches early readings.
            if (hasRemark || (mrmas < firstMeas * 0.2 && !isNaN(mrmas))) {
              meas.splice(-2);
            }
          }

          newTable2Rows.push({
            id: String(idx + 1),
            ma,
            measuredOutputs: meas,
            average: '',
            x: '', xMax: '', xMin: '', col: '', remarks: ''
          });
        }
      });

      if (customMeasHeaders.length > 0 || newTable2Rows.length > 0) {
        const maxMeasFromImport = newTable2Rows.length > 0
          ? Math.max(...newTable2Rows.map(r => r.measuredOutputs.length))
          : 0;
        const finalHeaderCount = Math.max(maxMeasFromImport, customMeasHeaders.length, 3);

        setMeasHeaders(() => {
          const base = (customMeasHeaders.length > 0
            ? customMeasHeaders
            : Array.from({ length: finalHeaderCount }, (_, i) => `Measured mR ${i + 1}`)
          ).slice(0, finalHeaderCount);
          while (base.length < finalHeaderCount) {
            base.push(`Measured mR ${base.length + 1}`);
          }
          return base;
        });

        if (newTable2Rows.length > 0) {
          const paddedRows = newTable2Rows.map(row => {
            const paddedMeas = [...row.measuredOutputs];
            while (paddedMeas.length < finalHeaderCount) {
              paddedMeas.push('');
            }
            return { ...row, measuredOutputs: paddedMeas };
          });

          setTable2Rows(paddedRows);
        } else if (customMeasHeaders.length > 0) {
          setTable2Rows(prev =>
            prev.map(r => ({
              ...r,
              measuredOutputs: Array(finalHeaderCount).fill('').map((_, i) => r.measuredOutputs[i] ?? ''),
            }))
          );
        }

        setHasSaved(false);
        setIsEditing(true);
      }

    if (!testId && (newTable2Rows.length > 0 || foundSettings)) setIsEditing(true);
  }, [csvData, isLoading]);

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
        table1: {
          fcd: table1Row.fcd,
          kv: table1Row.kv,
          time: table1Row.time,
        },
        table2: processedTable2.rows.map(r => ({
          ma: r.ma,
          // Keep empty slots so added column count survives reload
          measuredOutputs: padOutputs(r.measuredOutputs || [], measHeaders.length).map(v => String(v).trim()),
          average: r.average || '',
          x: r.x || '',
          xMax: processedTable2.summary.xMax,
          xMin: processedTable2.summary.xMin,
          col: processedTable2.summary.col,
          remarks: processedTable2.summary.remarks,
        })),
        measHeaders,
        tolerance,
        toleranceOperator,
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

      console.log('Payload prepared:', payload);

      if (currentTestId) {
        // Update existing
        console.log('Updating with testId:', currentTestId);
        result = await updateLinearityOfMaLoadingForOPG(currentTestId, payload);
        console.log('Update result:', result);
        toast.success('Updated successfully!');
      } else {
        // Create new (backend uses upsert, so this will work even if data exists)
        console.log('Creating new with serviceId:', serviceId);
        result = await addLinearityOfMaLoadingForOPG(serviceId, payload);
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
  const tableTitle = 'Linearity of mA Loading';
  const sectionTitle = 'Linearity of mA Loading Stations';
  const xUnitLabel = hasValidTime ? 'mGy/(mA*s)' : 'mGy/mA';

  const getExportData = useCallback(() => {
    const hasRows = processedTable2.rows.some(
      (r) =>
        String(r.ma || '').trim() ||
        r.measuredOutputs.some((v) => String(v).trim())
    );
    const hasConditions =
      String(table1Row.fcd || '').trim() ||
      String(table1Row.kv || '').trim() ||
      String(table1Row.time || '').trim();
    if (!hasRows && !hasConditions) return null;
    return {
      table1: {
        fcd: table1Row.fcd,
        kv: table1Row.kv,
        time: table1Row.time,
      },
      table2: processedTable2.rows.map((r) => ({
        ma: r.ma,
        measuredOutputs: padOutputs(r.measuredOutputs || [], measHeaders.length).map((v) => String(v).trim()),
        average: r.average || '',
        x: r.x || '',
        xMax: processedTable2.summary.xMax,
        xMin: processedTable2.summary.xMin,
        col: processedTable2.summary.col,
        remarks: processedTable2.summary.remarks,
      })),
      measHeaders,
      tolerance,
      toleranceOperator,
    };
  }, [processedTable2, table1Row, measHeaders, tolerance, toleranceOperator]);

  useRegisterTestExport('linearityOfMaLoading', getExportData);

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
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">FDD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Time (sec)</th>
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

      {/* Table 2: mA + Output — scroll wide tables; sticky mA column stays visible */}
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
                  <span>Output (mR)</span>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addMeasColumn}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Add measurement column"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Avg Output</th>
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
                      <button
                        type="button"
                        onClick={() => removeMeasColumn(idx)}
                        className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        title="Remove column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedTable2.rows.map((p, rowIdx) => (
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

                {measHeaders.map((_, colIdx) => (
                  <td key={colIdx} className="px-2 py-2 border-r">
                    <input
                      type="number"
                      step="any"
                      value={p.measuredOutputs[colIdx] ?? ''}
                      onChange={e => updateTable2Cell(p.id, colIdx, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    />
                  </td>
                ))}

                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">
                  {p.average}
                </td>
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">
                  {p.x}
                </td>
                {/* Show X MAX / X MIN / CoL only once using rowSpan, centered vertically */}
                {rowIdx === 0 && (
                  <>
                    <td
                      rowSpan={processedTable2.summary.rowSpan}
                      className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle"
                    >
                      {processedTable2.summary.xMax}
                    </td>
                    <td
                      rowSpan={processedTable2.summary.rowSpan}
                      className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle"
                    >
                      {processedTable2.summary.xMin}
                    </td>
                    <td
                      rowSpan={processedTable2.summary.rowSpan}
                      className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle"
                    >
                      {processedTable2.summary.col}
                    </td>
                    <td
                      rowSpan={processedTable2.summary.rowSpan}
                      className="px-4 py-2 text-center align-middle"
                    >
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
              className={`w-24 px-3 py-2 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
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