// Measurement of Operating Potential - dynamic mA columns (same as Radiography Fixed)
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import {
  addAccuracyOfOperatingPotentialForRadiographyPortable,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable,
  updateAccuracyOfOperatingPotentialForRadiographyPortable,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
  time: string;
  sliceThickness: string;
}

interface RowData {
  id: string;
  appliedKvp: string;
  measuredValues: string[];
  measuredValuesStatus: boolean[];
  averageKvp: string;
  averageKvpStatus?: boolean;
  remarks: 'PASS' | 'FAIL' | '-';
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  csvData?: any;
  refreshKey?: number;
}

const checkTolerance = (
  measured: number,
  applied: number,
  toleranceNum: number,
  sign: '+' | '-' | '±',
  isPercent: boolean
): boolean => {
  if (isNaN(measured) || isNaN(applied) || isNaN(toleranceNum) || applied === 0) return true;
  const allowedDiff = isPercent ? (applied * toleranceNum) / 100 : toleranceNum;
  const diff = Math.abs(measured - applied);
  if (sign === '+') return measured <= applied + allowedDiff;
  if (sign === '-') return measured >= applied - allowedDiff;
  return diff <= allowedDiff;
};

const AccuracyOfOperatingPotential: React.FC<Props> = ({
  serviceId,
  testId: propTestId,
  onRefresh,
  csvData,
  refreshKey,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [table1Row, setTable1Row] = useState<Table1Row>({ time: '', sliceThickness: '' });
  const [mAStations, setMAStations] = useState<string[]>(['@ mA 10', '@ mA 100', '@ mA 200']);
  const [rows, setRows] = useState<RowData[]>([
    { id: '1', appliedKvp: '', measuredValues: ['', '', ''], measuredValuesStatus: [], averageKvp: '', remarks: '-' },
  ]);

  const [toleranceValue, setToleranceValue] = useState<string>('5.0');
  const [toleranceType, setToleranceType] = useState<'percent' | 'absolute'>('percent');
  const [toleranceSign, setToleranceSign] = useState<'plus' | 'minus' | 'both'>('both');
  const signForCheck = toleranceSign === 'both' ? '±' : toleranceSign === 'plus' ? '+' : '-';

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const addMAColumn = () => {
    setMAStations((prev) => [...prev, `@ mA ${(prev.length + 1) * 10}`]);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredValues: [...row.measuredValues, ''],
        measuredValuesStatus: [...(row.measuredValuesStatus || []), true],
      }))
    );
    setHasSaved(false);
  };

  const removeMAColumn = (index: number) => {
    if (mAStations.length <= 1) return;
    setMAStations((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredValues: row.measuredValues.filter((_, i) => i !== index),
        measuredValuesStatus: (row.measuredValuesStatus || []).filter((_, i) => i !== index),
      }))
    );
    setHasSaved(false);
  };

  const updateMAHeader = (index: number, value: string) => {
    setMAStations((prev) => {
      const updated = [...prev];
      updated[index] = value || `mA ${index + 1}`;
      return updated;
    });
    setHasSaved(false);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        appliedKvp: '',
        measuredValues: Array(mAStations.length).fill(''),
        measuredValuesStatus: Array(mAStations.length).fill(true),
        averageKvp: '',
        remarks: '-',
      },
    ]);
    setHasSaved(false);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    setHasSaved(false);
  };

  const updateCell = (rowId: string, field: 'appliedKvp' | number, value: string) => {
    const tol = parseFloat(toleranceValue || '0');
    const isPercent = toleranceType === 'percent';

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === 'appliedKvp') {
          const applied = parseFloat(value || '0');
          const newMeasuredStatus = row.measuredValues.map((val) => {
            const measured = parseFloat(val || '0');
            return checkTolerance(measured, applied, tol, signForCheck, isPercent);
          });
          const nums = row.measuredValues.filter((v) => v !== '' && !isNaN(Number(v))).map(Number);
          const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '';
          const avgNum = parseFloat(avg || '0');
          const avgStatus = checkTolerance(avgNum, applied, tol, signForCheck, isPercent);
          const hasAnyFailure = newMeasuredStatus.some((s) => s === false) || avgStatus === false;
          const hasValidData =
            !isNaN(applied) &&
            applied > 0 &&
            !isNaN(tol) &&
            tol > 0 &&
            (row.measuredValues.some((v) => v !== '' && !isNaN(parseFloat(v))) || (!isNaN(avgNum) && avgNum > 0));
          const remark: 'PASS' | 'FAIL' | '-' = hasValidData ? (hasAnyFailure ? 'FAIL' : 'PASS') : '-';
          return {
            ...row,
            appliedKvp: value,
            measuredValuesStatus: newMeasuredStatus,
            averageKvp: avg,
            averageKvpStatus: avgStatus,
            remarks: remark,
          };
        }
        const newMeasured = [...row.measuredValues];
        newMeasured[field as number] = value;
        const nums = newMeasured.filter((v) => v !== '' && !isNaN(Number(v))).map(Number);
        const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '';
        const applied = parseFloat(row.appliedKvp || '0');
        const newMeasuredStatus = newMeasured.map((val) => {
          const measured = parseFloat(val || '0');
          return checkTolerance(measured, applied, tol, signForCheck, isPercent);
        });
        const avgNum = parseFloat(avg || '0');
        const avgStatus = checkTolerance(avgNum, applied, tol, signForCheck, isPercent);
        const hasAnyFailure = newMeasuredStatus.some((s) => s === false) || avgStatus === false;
        const hasValidData =
          !isNaN(applied) &&
          applied > 0 &&
          !isNaN(tol) &&
          tol > 0 &&
          (newMeasured.some((v) => v !== '' && !isNaN(parseFloat(v))) || (!isNaN(avgNum) && avgNum > 0));
        const remark: 'PASS' | 'FAIL' | '-' = hasValidData ? (hasAnyFailure ? 'FAIL' : 'PASS') : '-';
        return {
          ...row,
          measuredValues: newMeasured,
          measuredValuesStatus: newMeasuredStatus,
          averageKvp: avg,
          averageKvpStatus: avgStatus,
          remarks: remark,
        };
      })
    );
    setHasSaved(false);
  };

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.time.trim() &&
      table1Row.sliceThickness.trim() &&
      rows.every(
        (r) =>
          r.appliedKvp.trim() &&
          r.measuredValues.some((v) => v.trim())
      )
    );
  }, [serviceId, table1Row, rows]);

  // CSV data (map to new structure if needed)
  useEffect(() => {
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) return;
    const table1Data: Record<string, string> = {};
    const t2ByIndex: Record<number, Record<string, string>> = {};
    csvData.forEach((row: any) => {
      const field = (row['Field Name'] || '').trim();
      const value = (row['Value'] || '').trim();
      const idx = parseInt(row['Row Index'] || '0', 10);
      if (field.startsWith('Table1_')) table1Data[field.replace('Table1_', '').toLowerCase()] = value;
      if (field.startsWith('Table2_')) {
        if (!t2ByIndex[idx]) t2ByIndex[idx] = {};
        t2ByIndex[idx][field.replace('Table2_', '')] = value;
      }
      if (field === 'Tolerance_Value') setToleranceValue(value);
    });
    if (table1Data.time !== undefined) setTable1Row((p) => ({ ...p, time: table1Data.time || '' }));
    if (table1Data.slicethickness !== undefined) setTable1Row((p) => ({ ...p, sliceThickness: table1Data.slicethickness || '' }));
    const indices = Object.keys(t2ByIndex).map(Number).sort((a, b) => a - b);
    if (indices.length > 0) {
      const stations = ['@ mA 10', '@ mA 100', '@ mA 200'];
      setMAStations(stations);
      setRows(
        indices.map((idx, i) => {
          const r = t2ByIndex[idx];
          const vals = [r?.ma10 ?? '', r?.ma100 ?? '', r?.ma200 ?? ''];
          return {
            id: String(i + 1),
            appliedKvp: r?.setKV ?? '',
            measuredValues: vals,
            measuredValuesStatus: [],
            averageKvp: r?.avgKvp ?? '',
            remarks: '-' as const,
          };
        })
      );
      setIsEditing(true);
      setHasSaved(false);
    }
  }, [csvData, refreshKey]);

  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable(serviceId);
        if (!res?.data) {
          setIsLoading(false);
          return;
        }
        const rec = res.data;
        if (rec._id) setTestId(rec._id);
        if (rec.table1?.[0]) {
          setTable1Row({ time: rec.table1[0].time ?? '', sliceThickness: rec.table1[0].sliceThickness ?? '' });
        }
        if (rec.tolerance) {
          setToleranceValue(rec.tolerance.value ?? '2.0');
          setToleranceType(rec.tolerance.type === 'kvp' ? 'absolute' : (rec.tolerance.type || 'percent'));
          setToleranceSign(rec.tolerance.sign || 'both');
        }
        if (Array.isArray(rec.mAStations) && rec.mAStations.length > 0 && Array.isArray(rec.measurements) && rec.measurements.length > 0) {
          setMAStations(rec.mAStations.map(String));
          setRows(
            rec.measurements.map((m: any, i: number) => {
              const vals = (m.measuredValues ?? []).map((v: any) => String(v ?? ''));
              const applied = parseFloat(m.appliedKvp || '0');
              const tol = parseFloat(rec.tolerance?.value || '0');
              const isPercent = rec.tolerance?.type !== 'kvp';
              const sign = rec.tolerance?.sign === 'plus' ? '+' : rec.tolerance?.sign === 'minus' ? '-' : '±';
              const measuredStatus = vals.map((val: string) =>
                checkTolerance(parseFloat(val || '0'), applied, tol, sign, isPercent)
              );
              const avgNum = parseFloat(m.averageKvp || '0');
              const avgStatus = checkTolerance(avgNum, applied, tol, sign, isPercent);
              const hasFailure = measuredStatus.some((s: boolean) => s === false) || avgStatus === false;
              const hasData = applied > 0 && (vals.some((v: string) => v !== '' && !isNaN(parseFloat(v))) || (!isNaN(avgNum) && avgNum > 0));
              const remark = hasData ? (hasFailure ? 'FAIL' : 'PASS') : '-';
              return {
                id: Date.now().toString() + i,
                appliedKvp: String(m.appliedKvp ?? ''),
                measuredValues: vals,
                measuredValuesStatus: measuredStatus,
                averageKvp: String(m.averageKvp ?? ''),
                averageKvpStatus: avgStatus,
                remarks: remark as 'PASS' | 'FAIL' | '-',
              };
            })
          );
        } else if (Array.isArray(rec.table2) && rec.table2.length > 0) {
          setMAStations(['@ mA 10', '@ mA 100', '@ mA 200']);
          setRows(
            rec.table2.map((r: any, i: number) => ({
              id: Date.now().toString() + i,
              appliedKvp: String(r.setKV ?? ''),
              measuredValues: [
                String(r.ma10 ?? ''),
                String(r.ma100 ?? ''),
                String(r.ma200 ?? ''),
              ],
              measuredValuesStatus: [],
              averageKvp: String(r.avgKvp ?? ''),
              remarks: (r.remarks === 'Pass' || r.remarks === 'PASS' ? 'PASS' : r.remarks === 'Fail' || r.remarks === 'FAIL' ? 'FAIL' : '-') as 'PASS' | 'FAIL' | '-',
            }))
          );
        }
        setHasSaved(true);
        setIsEditing(false);
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, refreshKey]);

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);
    const payload = {
      table1: [table1Row],
      mAStations,
      measurements: rows.map((r) => ({
        appliedKvp: r.appliedKvp,
        measuredValues: r.measuredValues,
        averageKvp: r.averageKvp,
        remarks: r.remarks,
      })),
      tolerance: {
        value: toleranceValue,
        type: toleranceType === 'absolute' ? 'kvp' : 'percent',
        sign: toleranceSign,
      },
    };
    try {
      if (testId) {
        await updateAccuracyOfOperatingPotentialForRadiographyPortable(testId, payload);
        toast.success('Updated successfully!');
      } else {
        const res = await addAccuracyOfOperatingPotentialForRadiographyPortable(serviceId, payload);
        if (res?.data?._id) setTestId(res.data._id);
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
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
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Measurement of Operating Potential</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">Exposure Time vs Slice Thickness</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Time (ms)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Slice Thickness (mm)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-2 border-r">
                <input
                  type="text"
                  value={table1Row.time}
                  onChange={(e) => setTable1Row((p) => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="100"
                />
              </td>
              <td className="px-6 py-2">
                <input
                  type="text"
                  value={table1Row.sliceThickness}
                  onChange={(e) => setTable1Row((p) => ({ ...p, sliceThickness: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="5.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-300">
          <h3 className="text-xl font-bold text-blue-900">Accuracy of kVp at Different mA Stations</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider border-r">
                Applied kVp
              </th>
              <th colSpan={mAStations.length} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider border-r">
                <div className="flex items-center justify-between">
                  <span>Measured Values (kVp)</span>
                  {!isViewMode && (
                    <button type="button" onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider border-r">
                Average kVp
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider">
                Remarks
              </th>
              <th rowSpan={2} className="w-12" />
            </tr>
            <tr>
              {mAStations.map((header, idx) => (
                <th key={idx} className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                  <div className="flex items-center justify-center gap-1">
                    {!isViewMode ? (
                      <>
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => updateMAHeader(idx, e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        {mAStations.length > 1 && (
                          <button type="button" onClick={() => removeMAColumn(idx)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span>{header}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 border-r">
                  <input
                    type="number"
                    value={row.appliedKvp}
                    onChange={(e) => updateCell(row.id, 'appliedKvp', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="80"
                  />
                </td>
                {row.measuredValues.map((val, idx) => {
                  const hasValue = val !== '' && !isNaN(parseFloat(val));
                  const isValid =
                    row.measuredValuesStatus && row.measuredValuesStatus.length > idx
                      ? row.measuredValuesStatus[idx]
                      : true;
                  return (
                    <td key={idx} className={`px-3 py-3 text-center border-r ${hasValue && !isValid ? 'bg-red-100' : ''}`}>
                      <input
                        type="number"
                        step="0.1"
                        value={val}
                        onChange={(e) => updateCell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed border-gray-300' : hasValue && !isValid ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="0.0"
                      />
                    </td>
                  );
                })}
                <td
                  className={`px-6 py-3 text-center font-bold border-r ${row.averageKvp && row.averageKvp !== '-' && row.averageKvpStatus === false ? 'bg-red-100 text-red-800' : 'text-gray-800'
                    }`}
                >
                  {row.averageKvp || '-'}
                </td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${row.remarks === 'PASS' ? 'bg-green-100 text-green-800' : row.remarks === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {row.remarks}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {rows.length > 1 && !isViewMode && (
                    <button type="button" onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isViewMode && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button type="button" onClick={addRow} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Row
            </button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-medium text-indigo-800">Tolerance:</span>
          <select
            value={toleranceSign === 'both' ? '±' : toleranceSign === 'plus' ? '+' : '-'}
            onChange={(e) => {
              const v = e.target.value;
              setToleranceSign(v === '±' ? 'both' : v === '+' ? 'plus' : 'minus');
            }}
            disabled={isViewMode}
            className={`px-2 py-1 border border-indigo-300 rounded bg-white ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          >
            <option value="±">±</option>
            <option value="+">+</option>
            <option value="-">-</option>
          </select>
          <input
            type="text"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            className={`w-24 px-2 py-1 border border-indigo-300 rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="2.0"
          />
          <select
            value={toleranceType}
            onChange={(e) => setToleranceType(e.target.value as 'percent' | 'absolute')}
            disabled={isViewMode}
            className={`px-2 py-1 border border-indigo-300 rounded bg-white ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          >
            <option value="percent">%</option>
            <option value="absolute">kVp</option>
          </select>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Current: <strong>{toleranceSign === 'both' ? '±' : toleranceSign === 'plus' ? '+' : '-'}{toleranceValue}{toleranceType === 'percent' ? '%' : ' kVp'}</strong>
        </p>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={isViewMode ? () => setIsEditing(true) : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid) ? 'bg-gray-400 cursor-not-allowed' : isViewMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><ButtonIcon className="w-4 h-4" /> {buttonText} Measurement</>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotential;
