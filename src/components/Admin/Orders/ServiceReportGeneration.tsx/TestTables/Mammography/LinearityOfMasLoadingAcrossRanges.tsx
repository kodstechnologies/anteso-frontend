/**
 * Mammography "Linearity of mAs Loading (Across mAs Ranges)" — same UX as
 * RadiographyMobile/LinearityOfMasLoadingStations with hasTimer=false, wired to
 * mammography linearity-of-mas-loading APIs.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfMasLLoadingForMammography,
  getLinearityOfMasLLoadingByServiceIdForMammography,
  updateLinearityOfMasLLoadingForMammography,
} from '../../../../../../api';

interface ExposureCondition {
  fcd: string;
  kv: string;
  time: string;
}

interface Table2Row {
  id: string;
  mAsRange: string;
  measuredOutputs: string[];
  measuredOutputsStatus: boolean[];
  average: string;
  x: string;
  xMax: string;
  xMin: string;
  col: string;
  remarks: string;
}

export type LinearityMasAcrossInitial = {
  table1?: { fcd: string; kv: string; time?: string }[];
  table2?: { mAsRange?: string; mAsApplied?: string; measuredOutputs: string[]; average?: string; x?: string }[];
  measHeaders?: string[];
  tolerance?: string;
  toleranceOperator?: string;
  /** Legacy CSV / older mammography shape */
  exposureCondition?: { fcd: string; kv: string };
  measurementHeaders?: string[];
  measurements?: Array<{ mAsRange: string; measuredOutputs: (string | null)[] }>;
} | null;

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  refreshKey?: number;
  initialData?: LinearityMasAcrossInitial;
}

const LinearityOfMasLoadingAcrossRanges: React.FC<Props> = ({
  serviceId,
  testId: propTestId,
  onRefresh,
  refreshKey,
  initialData,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const [exposureCondition, setExposureCondition] = useState<ExposureCondition>({ fcd: '100', kv: '80', time: '' });

  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', mAsRange: '5', measuredOutputs: ['', '', ''], measuredOutputsStatus: [], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', mAsRange: '10', measuredOutputs: ['', '', ''], measuredOutputsStatus: [], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', mAsRange: '20', measuredOutputs: ['', '', ''], measuredOutputsStatus: [], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', mAsRange: '50', measuredOutputs: ['', '', ''], measuredOutputsStatus: [], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');
  const [toleranceOperator, setToleranceOperator] = useState<string>('<=');

  const addMeasColumn = () => {
    setMeasHeaders(p => [...p, `Meas ${p.length + 1}`]);
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: [...r.measuredOutputs, ''] })));
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(p => p.filter((_, i) => i !== idx));
    setTable2Rows(p =>
      p.map(r => ({
        ...r,
        measuredOutputs: r.measuredOutputs.filter((_, i) => i !== idx),
        measuredOutputsStatus: (r.measuredOutputsStatus || []).filter((_, i) => i !== idx),
      }))
    );
  };

  const addTable2Row = () => {
    setTable2Rows(p => [
      ...p,
      {
        id: Date.now().toString(),
        mAsRange: '',
        measuredOutputs: Array(measHeaders.length).fill(''),
        measuredOutputsStatus: Array(measHeaders.length).fill(true),
        average: '',
        x: '',
        xMax: '',
        xMin: '',
        col: '',
        remarks: '',
      },
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

  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      if (initialData) {
        setIsLoading(false);
        return;
      }
      try {
        const data: any = await getLinearityOfMasLLoadingByServiceIdForMammography(serviceId);
        if (data) {
          setTestId(data._id || data.id || null);
          const ec = data.exposureCondition || (data.table1 && data.table1[0]);
          if (ec) {
            setExposureCondition({
              fcd: String(ec.fcd ?? '100'),
              kv: String(ec.kv ?? '80'),
              time: String(ec.time ?? ''),
            });
          }
          const headers = data.measHeaders || data.measurementHeaders;
          setMeasHeaders(Array.isArray(headers) && headers.length > 0 ? headers : ['Meas 1', 'Meas 2', 'Meas 3']);
          const rows = data.table2 || data.measurements;
          if (Array.isArray(rows) && rows.length > 0) {
            setTable2Rows(
              rows.map((r: any, i: number) => ({
                id: `${Date.now()}-${i}`,
                mAsRange: String(r.mAsApplied ?? r.mAsRange ?? ''),
                measuredOutputs: (r.measuredOutputs || []).map((v: any) => (v != null ? String(v) : '')),
                measuredOutputsStatus: [],
                average: '',
                x: '',
                xMax: '',
                xMin: '',
                col: '',
                remarks: '',
              }))
            );
          }
          setTolerance(String(data.tolerance ?? '0.1'));
          setToleranceOperator(data.toleranceOperator || '<=');
          setHasSaved(true);
          setIsEditing(false);
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
  }, [serviceId, refreshKey, initialData]);

  useEffect(() => {
    if (!initialData) return;

    if (initialData.table1?.length) {
      setExposureCondition({
        fcd: String(initialData.table1[0].fcd ?? '100'),
        kv: String(initialData.table1[0].kv ?? '80'),
        time: String(initialData.table1[0].time ?? ''),
      });
    } else if (initialData.exposureCondition) {
      setExposureCondition({
        fcd: String(initialData.exposureCondition.fcd ?? '100'),
        kv: String(initialData.exposureCondition.kv ?? '80'),
        time: '',
      });
    }

    const headers = initialData.measHeaders || initialData.measurementHeaders;
    if (headers?.length) {
      setMeasHeaders(headers);
    }

    if (initialData.table2?.length) {
      setTable2Rows(
        initialData.table2.map((r, i) => ({
          id: String(i + 1),
          mAsRange: String(r.mAsRange ?? r.mAsApplied ?? ''),
          measuredOutputs: (r.measuredOutputs || []).map(v => String(v ?? '')),
          measuredOutputsStatus: [],
          average: '',
          x: '',
          xMax: '',
          xMin: '',
          col: '',
          remarks: '',
        }))
      );
    } else if (initialData.measurements?.length) {
      const cols = Math.max(
        ...(initialData.measurements.map(m => m.measuredOutputs?.length || 0) || [0]),
        initialData.measurementHeaders?.length || 0,
        3
      );
      let hdrs = [...(initialData.measurementHeaders || [])];
      while (hdrs.length < cols) hdrs.push(`Meas ${hdrs.length + 1}`);
      setMeasHeaders(hdrs);
      setTable2Rows(
        initialData.measurements.map((m, i) => {
          const outputs = (m.measuredOutputs || []).map(v => (v != null ? String(v) : ''));
          const pad = [...outputs];
          while (pad.length < cols) pad.push('');
          return {
            id: `csv-${i}`,
            mAsRange: String(m.mAsRange || ''),
            measuredOutputs: pad,
            measuredOutputsStatus: [],
            average: '',
            x: '',
            xMax: '',
            xMin: '',
            col: '',
            remarks: '',
          };
        })
      );
    }

    if (initialData.tolerance != null) setTolerance(String(initialData.tolerance));
    if (initialData.toleranceOperator) setToleranceOperator(initialData.toleranceOperator);

    setHasSaved(false);
    setIsEditing(true);
  }, [initialData]);

  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];

    const timeSec = parseFloat(exposureCondition.time);
    const hasValidTime = !isNaN(timeSec) && timeSec > 0;

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? outputs.reduce((a, b) => a + b, 0) / outputs.length : null;
      const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : '—';

      const match = row.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      const midMas = match ? (parseFloat(match[1]) + parseFloat(match[2])) / 2 : parseFloat(row.mAsRange) || 0;

      let x: number | null = null;
      if (avg !== null && midMas > 0 && hasValidTime) {
        x = avg / (midMas * timeSec);
      } else if (avg !== null && midMas > 0 && !hasValidTime) {
        x = avg / midMas;
      }

      const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : '—';
      if (x !== null) xValues.push(parseFloat(x.toFixed(4)));

      return { ...row, average: avgDisplay, x: xDisplay };
    });

    const hasData = xValues.length > 0;
    const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : '—';
    const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : '—';

    const colNum =
      hasData && xMax !== '—' && xMin !== '—' && parseFloat(xMax) + parseFloat(xMin) > 0
        ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
        : 0;
    const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';

    let pass = false;
    if (hasData && col !== '—') {
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
    }

    const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';

    const rowsWithStatus = rowsWithX.map(row => {
      const measuredStatus = row.measuredOutputs.map(val => {
        const numVal = parseFloat(val);
        if (isNaN(numVal) || numVal <= 0) return true;
        if (!pass && hasData && col !== '—') return false;
        return true;
      });
      return { ...row, measuredOutputsStatus: measuredStatus };
    });

    return {
      rows: rowsWithStatus,
      summary: { xMax, xMin, col, remarks, rowSpan: rowsWithStatus.length },
    };
  }, [table2Rows, tolerance, toleranceOperator, exposureCondition.time]);

  const processedRowById = useMemo(() => {
    const map = new Map<string, any>();
    processedTable2.rows.forEach(row => map.set(row.id, row));
    return map;
  }, [processedTable2.rows]);

  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      const mammographyPayload = {
        exposureCondition: { fcd: exposureCondition.fcd, kv: exposureCondition.kv },
        measurementHeaders: measHeaders,
        measurements: processedTable2.rows.map(r => ({
          mAsRange: r.mAsRange,
          measuredOutputs: r.measuredOutputs.map(v => {
            const val = v.trim();
            return val === '' ? null : isNaN(parseFloat(val)) ? null : parseFloat(val);
          }),
        })),
        tolerance,
        toleranceOperator,
      };

      let currentTestId = testId;
      if (!currentTestId) {
        try {
          const existing: any = await getLinearityOfMasLLoadingByServiceIdForMammography(serviceId);
          if (existing?._id || existing?.id) {
            currentTestId = existing._id || existing.id;
            setTestId(currentTestId);
          }
        } catch {
          /* no existing */
        }
      }

      if (currentTestId) {
        await updateLinearityOfMasLLoadingForMammography(currentTestId, mammographyPayload);
        toast.success('Updated successfully!');
      } else {
        const result: any = await addLinearityOfMasLLoadingForMammography(serviceId, mammographyPayload);
        const newId = result?.data?._id || result?.data?.id || result?._id || result?.id;
        if (newId) setTestId(String(newId));
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
          type="button"
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${
            isSaving
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
              {buttonText} Linearity
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-teal-50 border-b">
          <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 border-r">FDD (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 border-r">kV</th>
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
                  className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${
                    isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </td>
              <td className="px-6 py-4 border-r">
                <input
                  type="text"
                  value={exposureCondition.kv}
                  onChange={e => setExposureCondition(p => ({ ...p, kv: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${
                    isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">Linearity of mAs Loading</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-700 border-r">
                  mAs
                </th>
                <th colSpan={measHeaders.length} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  <div className="flex items-center justify-between px-4">
                    <span>Radiation Output (mGy)</span>
                    {!isViewMode && (
                      <button type="button" onClick={addMeasColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  Avg Output
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  X (mGy/mAs)
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  X MAX
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  X MIN
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 border-r">
                  CoL
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700">
                  Remarks
                </th>
                <th rowSpan={2} className="w-12" />
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
                        className={`w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 ${
                          isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      />
                      {measHeaders.length > 1 && !isViewMode && (
                        <button type="button" onClick={() => removeMeasColumn(i)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                    <td className="px-6 py-4 border-r">
                      <input
                        type="text"
                        value={row.mAsRange}
                        onChange={e => updateCell(row.id, 'mAsRange', e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-3 py-2 text-center text-sm border rounded font-medium focus:ring-2 focus:ring-blue-500 ${
                          isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                        placeholder="10"
                      />
                    </td>
                    {row.measuredOutputs.map((val, idx) => {
                      const hasValue = val !== '' && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
                      const isValid =
                        computed.measuredOutputsStatus && computed.measuredOutputsStatus.length > idx
                          ? computed.measuredOutputsStatus[idx]
                          : true;

                      return (
                        <td key={idx} className={`px-3 py-4 text-center border-r ${hasValue && !isValid ? 'bg-red-100' : ''}`}>
                          <input
                            type="number"
                            step="any"
                            value={val}
                            onChange={e => updateCell(row.id, idx, e.target.value)}
                            disabled={isViewMode}
                            className={`w-24 px-3 py-2 text-center text-sm border rounded focus:ring-2 focus:ring-blue-500 ${
                              isViewMode
                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                                : hasValue && !isValid
                                  ? 'border-red-500 bg-red-50'
                                  : ''
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{computed.average}</td>
                    <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{computed.x}</td>
                    {index === 0 && (
                      <>
                        <td
                          rowSpan={processedTable2.summary.rowSpan}
                          className="px-6 py-4 text-center font-bold border-r bg-yellow-50 align-middle"
                        >
                          {processedTable2.summary.xMax}
                        </td>
                        <td
                          rowSpan={processedTable2.summary.rowSpan}
                          className="px-6 py-4 text-center font-bold border-r bg-yellow-50 align-middle"
                        >
                          {processedTable2.summary.xMin}
                        </td>
                        <td
                          rowSpan={processedTable2.summary.rowSpan}
                          className="px-6 py-4 text-center font-bold border-r bg-yellow-50 align-middle"
                        >
                          {processedTable2.summary.col}
                        </td>
                        <td rowSpan={processedTable2.summary.rowSpan} className="px-6 py-4 text-center align-middle">
                          <span
                            className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                              processedTable2.summary.remarks === 'Pass'
                                ? 'bg-green-100 text-green-800'
                                : processedTable2.summary.remarks === 'Fail'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {processedTable2.summary.remarks || '—'}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-3 py-4 text-center">
                      {table2Rows.length > 1 && !isViewMode && (
                        <button type="button" onClick={() => removeTable2Row(row.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && (
            <button type="button" onClick={addTable2Row} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              <Plus className="w-5 h-5" /> Add mAs Range
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL)</span>
            <select
              value={toleranceOperator}
              onChange={e => setToleranceOperator(e.target.value)}
              disabled={isViewMode}
              className={`px-3 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${
                isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
              }`}
            >
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
              <option value="<=">&lt;=</option>
              <option value=">=">&gt;=</option>
              <option value="=">=</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-32 px-4 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${
                isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearityOfMasLoadingAcrossRanges;
