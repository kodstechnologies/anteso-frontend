'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import {
  addRadiationLeakageLevelForCBCT,
  getRadiationLeakageLevelByServiceIdForCBCT,
  getRadiationLeakageLevelByTestIdForCBCT,
  updateRadiationLeakageLevelForCBCT,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface SettingsRow {
  kv: string;
  ma: string;
  time: string;
}

interface LeakageRow {
  location: string;
  front: string;
  back: string;
  left: string;
  right: string;
  max: string;
  unit: string;
  remark: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  onTestSaved?: (testId: string) => void;
  csvData?: any[];
  refreshKey?: number;
}

/** Same operators as Radiography Fixed tube-housing leakage. */
type LeakageToleranceOperator = 'less than' | 'greater than' | '=';

function normalizeLeakageToleranceOperator(raw: unknown): LeakageToleranceOperator {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=');
  if (!s) return 'less than';
  if (s === '=' || s === '==' || s === 'equals' || s === 'equal to') return '=';
  if (s === '<' || s === 'less than' || s === 'lt') return 'less than';
  if (s === '>' || s === 'greater than' || s === 'gt') return 'greater than';
  if (s === '<=' || s === 'less than or equal to' || s === 'less than or equal' || s === 'lte')
    return 'less than';
  if (s === '>=' || s === 'greater than or equal to' || s === 'greater than or equal' || s === 'gte')
    return 'greater than';
  return 'less than';
}

function leakageToleranceSymbol(op: LeakageToleranceOperator): string {
  switch (op) {
    case 'less than':
      return '<';
    case 'greater than':
      return '>';
    case '=':
      return '=';
    default:
      return '<';
  }
}

const LEAKAGE_RESULT_MR_DECIMALS = 3;

function formatToleranceEquivalentMR(raw: string): string {
  const n = parseFloat(String(raw).trim());
  if (Number.isNaN(n)) return '—';
  return (n * 114).toFixed(LEAKAGE_RESULT_MR_DECIMALS);
}

function compareMgyToTolerance(mgyValue: number, tol: number, op: LeakageToleranceOperator): boolean {
  const scale = 10_000;
  const mi = Math.round(mgyValue * scale);
  const ti = Math.round(tol * scale);
  switch (op) {
    case 'less than':
      return mi < ti;
    case 'greater than':
      return mi > ti;
    case '=':
      return mi === ti;
    default:
      return mi < ti;
  }
}

export default function RadiationLeakageLevelFromXRay({ serviceId, testId: propTestId, onRefresh, onTestSaved, csvData, refreshKey }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [settings, setSettings] = useState<SettingsRow>({ kv: '', ma: '', time: '' });
  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    {
      location: 'Tube',
      front: '',
      back: '',
      left: '',
      right: '',
      max: '',
      unit: 'mGy/h',
      remark: '',
    },
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [workloadUnit, setWorkloadUnit] = useState<string>('mA·min/week');
  const [toleranceValue, setToleranceValue] = useState<string>('1');
  const [toleranceOperator, setToleranceOperator] = useState<LeakageToleranceOperator>('less than');
  const [toleranceTime, setToleranceTime] = useState<string>('1');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const getPrimitive = (v: any) => {
    if (v == null) return "";
    if (typeof v === "object" && "value" in v) return (v as any).value ?? "";
    return v;
  };

  const toleranceOpNormalized = normalizeLeakageToleranceOperator(toleranceOperator);

  const processedLeakage = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.front, row.back, row.left, row.right]
        .map((v) => parseFloat(v) || 0)
        .filter((v) => v > 0);
      const max = values.length > 0 ? Math.max(...values).toFixed(3) : '';
      return { ...row, max };
    });
  }, [leakageRows]);

  const calculatedResults = useMemo(() => {
    return processedLeakage.map((row) => {
      const rowMax = parseFloat(row.max) || 0;
      const maVal = parseFloat(settings.ma) || 1;
      const workloadVal = parseFloat(workload) || 0;

      let calculatedMR = '';
      let calculatedMGy = '—';

      if (rowMax > 0 && maVal > 0 && workloadVal > 0) {
        const exposureLevelMR = row.unit === 'mGy/h' ? rowMax * 114 : rowMax;
        const resultMR = (workloadVal * exposureLevelMR) / (60 * maVal);
        calculatedMR = resultMR.toFixed(3);
        calculatedMGy = (resultMR / 114).toFixed(4);
      }

      return {
        location: row.location,
        max: row.max,
        calculatedMR,
        calculatedMGy,
      };
    });
  }, [processedLeakage, settings.ma, workload]);

  const allCalculatedMGy = calculatedResults.map(r => parseFloat(r.calculatedMGy || '0') || 0);
  const globalMaxResultMGy = allCalculatedMGy.length > 0 && Math.max(...allCalculatedMGy) > 0
    ? Math.max(...allCalculatedMGy).toFixed(4)
    : '—';

  const finalRemark = useMemo(() => {
    const result = parseFloat(globalMaxResultMGy || '0') || 0;
    const tolStr = String(toleranceValue ?? '').trim();
    const tol = parseFloat(tolStr);

    if (!tolStr || globalMaxResultMGy === '—' || Number.isNaN(tol)) return '';

    const pass = compareMgyToTolerance(result, tol, toleranceOpNormalized);
    return pass ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceValue, toleranceOpNormalized]);

  const updateSettings = (field: 'kv' | 'ma' | 'time', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
    setLeakageRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addCollimatorRow = () => {
    const hasCollimator = leakageRows.some(row => row.location === 'Collimator');
    if (hasCollimator) {
      toast.error('Collimator can only be added once');
      return;
    }
    setLeakageRows(prev => [...prev, {
      location: 'Collimator',
      front: '',
      back: '',
      left: '',
      right: '',
      max: '',
      unit: 'mGy/h',
      remark: '',
    }]);
  };

  const removeLeakageRow = (index: number) => {
    if (index === 0 || leakageRows[index].location === 'Tube') {
      toast.error('Tube row cannot be removed');
      return;
    }
    setLeakageRows(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      settings.kv.trim() &&
      settings.ma.trim() &&
      settings.time.trim() &&
      leakageRows.every(r =>
        r.front.trim() && r.back.trim() && r.left.trim() && r.right.trim()
      ) &&
      workload.trim() &&
      toleranceValue.trim()
    );
  }, [serviceId, settings, leakageRows, workload, toleranceValue]);

  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = propTestId
          ? await getRadiationLeakageLevelByTestIdForCBCT(propTestId)
          : await getRadiationLeakageLevelByServiceIdForCBCT(serviceId);
        const rec = res?.data?.data || res?.data || res || null;
        if (!rec) {
          setIsLoading(false);
          setIsEditing(true);
          return;
        }

        if (rec) {
          setTestId(rec._id || propTestId);

          const hasCsvImport = csvData && csvData.length > 0;
          if (!hasCsvImport) {
            if (rec.settings?.[0] || rec.measurementSettings?.[0]) {
              const s = rec.settings?.[0] || rec.measurementSettings?.[0];
              setSettings({
                kv: s.kv || s.kvp || s.kV || s.kVp || s.appliedVoltage ? String(getPrimitive(s.kv ?? s.kvp ?? s.kV ?? s.kVp ?? s.appliedVoltage) ?? '') : '',
                ma: s.ma || s.mA || s.appliedCurrent ? String(getPrimitive(s.ma ?? s.mA ?? s.appliedCurrent) ?? '') : '',
                time: s.time || s.exposureTime ? String(getPrimitive(s.time ?? s.exposureTime) ?? '') : '',
              });
            } else {
              setSettings({
                kv: rec.kv || rec.kvp || rec.kV ? String(getPrimitive(rec.kv ?? rec.kvp ?? rec.kV ?? rec.kVp ?? rec.appliedVoltage) ?? '') : '',
                ma: rec.ma || rec.mA ? String(getPrimitive(rec.ma ?? rec.mA ?? rec.appliedCurrent) ?? '') : '',
                time: rec.time || rec.exposureTime ? String(getPrimitive(rec.time ?? rec.exposureTime) ?? '') : '',
              });
            }

            if (Array.isArray(rec.leakageMeasurements)) {
              setLeakageRows(
                rec.leakageMeasurements.map((r: any) => ({
                  location: String(r.location ?? ''),
                  front: r.front != null && r.front !== 0 ? String(getPrimitive(r.front) ?? '') : '',
                  back: r.back != null && r.back !== 0 ? String(getPrimitive(r.back) ?? '') : '',
                  left: r.left != null && r.left !== 0 ? String(getPrimitive(r.left) ?? '') : '',
                  right: r.right != null && r.right !== 0 ? String(getPrimitive(r.right) ?? '') : '',
                  max: '',
                  unit: String(getPrimitive(r.unit) ?? 'mGy/h'),
                  remark: '',
                }))
              );
            }

            setWorkload(String(rec.workload ?? ''));
            setWorkloadUnit(String(rec.workloadUnit ?? 'mA·min/week'));
            setToleranceValue(String(rec.toleranceValue ?? rec.tolerance?.value ?? rec.tolerance ?? '1'));
            setToleranceOperator(
              normalizeLeakageToleranceOperator(rec.toleranceOperator ?? rec.tolerance?.operator ?? 'less than')
            );
            setToleranceTime(String(rec.toleranceTime ?? '1'));

            setHasSaved(true);
            setIsEditing(false);
          } else {
            setHasSaved(false);
            setIsEditing(true);
          }
        }
      } catch (e: any) {
        if (e?.response?.status !== 404) {
          toast.error(e.message || 'Failed to load leakage data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId, refreshKey, propTestId, csvData]);

  useEffect(() => {
    if (isLoading || !csvData || csvData.length === 0) return;

    const getField = (...names: string[]) =>
      csvData.find((r: any) => names.includes(String(r['Field Name'] || '')))?.['Value'];

    const kv = getField('kV', 'kVp', 'kv', 'kvp');
    const ma = getField('mA', 'ma');
    const time = getField('Time', 'time');

    if (kv || ma || time) {
      setSettings(prev => ({
        ...prev,
        kv: kv ? String(kv) : prev.kv,
        ma: ma ? String(ma) : prev.ma,
        time: time ? String(time) : prev.time,
      }));
    }

    const rowIndices = [...new Set(csvData
      .filter(r => r['Field Name'] && (r['Field Name'].startsWith('Table2_') || r['Field Name'].startsWith('leakageRows_')))
      .map(r => parseInt(r['Row Index']))
      .filter(i => !isNaN(i) && i >= 0)
    )];

    if (rowIndices.length > 0) {
      const newRows = rowIndices.map(idx => {
        const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
        return {
          location: rowData.find(r => ['Location', 'location', 'Table2_Area'].includes(r['Field Name']))?.['Value'] || '',
          front: rowData.find(r => ['Front', 'front', 'Table2_Front'].includes(r['Field Name']))?.['Value'] || '',
          back: rowData.find(r => ['Back', 'back', 'Table2_Back'].includes(r['Field Name']))?.['Value'] || '',
          left: rowData.find(r => ['Left', 'left', 'Table2_Left'].includes(r['Field Name']))?.['Value'] || '',
          right: rowData.find(r => ['Right', 'right', 'Table2_Right'].includes(r['Field Name']))?.['Value'] || '',
          max: '',
          unit: rowData.find(r => ['Unit', 'unit', 'Table2_Unit'].includes(r['Field Name']))?.['Value'] || 'mGy/h',
          remark: '',
        };
      });
      setLeakageRows(newRows);
    }

    const wl = getField('Workload', 'workload');
    const wlUnit = getField('WorkloadUnit', 'workloadUnit');
    const tol = getField('ToleranceValue', 'toleranceValue', 'Tolerance', 'tolerance');
    const tolOp = getField('ToleranceOperator');
    const tolTime = getField('ToleranceTime');

    if (wl) setWorkload(String(wl));
    if (wlUnit) setWorkloadUnit(String(wlUnit));
    if (tol) setToleranceValue(String(tol));
    if (tolOp) setToleranceOperator(normalizeLeakageToleranceOperator(tolOp));
    if (tolTime) setToleranceTime(String(tolTime));

    setIsEditing(true);
    setHasSaved(false);
  }, [csvData, isLoading]);

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      settings: [
        {
          ffd: '',
          kvp: settings.kv.trim(),
          ma: settings.ma.trim(),
          time: settings.time.trim(),
        },
      ],
      leakageMeasurements: processedLeakage.map(r => ({
        location: r.location,
        front: String(r.front ?? '').trim(),
        back: String(r.back ?? '').trim(),
        left: String(r.left ?? '').trim(),
        right: String(r.right ?? '').trim(),
        max: String(r.max ?? '').trim(),
        unit: r.unit,
        remark: String(r.remark ?? '').trim(),
      })),
      workload: workload.trim() || '0',
      workloadUnit,
      toleranceValue: toleranceValue.trim(),
      toleranceOperator,
      toleranceTime: toleranceTime.trim(),
      maxRadiationLeakage: globalMaxResultMGy === '—' ? '' : globalMaxResultMGy,
      maxLeakageResult: calculatedResults[0]?.calculatedMR || '',
    };

    try {
      let res;
      if (testId) {
        res = await updateRadiationLeakageLevelForCBCT(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addRadiationLeakageLevelForCBCT(serviceId, payload);
        const newTestId = res?.data?.testId || res?.data?._id;
        if (newTestId) {
          setTestId(newTestId);
          onTestSaved?.(newTestId);
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

  const toggleEdit = () => setIsEditing(true);
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
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">Radiation Leakage Level from X-Ray</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider border-r">mA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Time (sec)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.kv}
                  onChange={(e) => updateSettings('kv', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="120"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.ma}
                  onChange={(e) => updateSettings('ma', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={settings.time}
                  onChange={(e) => updateSettings('time', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="1.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Workload</label>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="text"
            value={workload}
            onChange={(e) => setWorkload(e.target.value)}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            placeholder="500"
          />
          <input
            type="text"
            value={workloadUnit}
            onChange={(e) => setWorkloadUnit(e.target.value)}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            placeholder="mA·min/week"
          />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-3 flex justify-between items-center bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Leakage Measurement Results</h3>
          {!isViewMode && (
            <button
              type="button"
              onClick={addCollimatorRow}
              disabled={leakageRows.some(row => row.location === 'Collimator')}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium ${leakageRows.some(row => row.location === 'Collimator') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Add Collimator
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r">Location</th>
              <th colSpan={4} className="px-4 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-r">Exposure Level (mGy)</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r">Max</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r">Unit</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r">Remark</th>
              {!isViewMode && (
                <th rowSpan={2} className="px-2 py-3 text-center text-xs font-medium text-gray-700 tracking-wider">Action</th>
              )}
            </tr>
            <tr>
              {['Front', 'Back', 'Left', 'Right'].map((dir) => (
                <th key={dir} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  {dir}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedLeakage.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <select
                    value={row.location}
                    onChange={(e) => updateLeakage(idx, 'location', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  >
                    <option value="Tube">Tube</option>
                    <option value="Collimator">Collimator</option>
                  </select>
                </td>
                {(['front', 'back', 'left', 'right'] as const).map((field) => (
                  <td key={field} className="px-2 py-2 border-r">
                    <input
                      type="text"
                      value={leakageRows[idx][field]}
                      onChange={(e) => updateLeakage(idx, field, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-2 py-2 border-r bg-gray-50">
                  <input type="text" value={row.max} readOnly className="w-full px-2 py-1 bg-gray-100 text-sm text-center font-medium" />
                </td>
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateLeakage(idx, 'unit', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block w-full px-2 py-1 text-sm text-center font-medium rounded ${finalRemark === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : finalRemark === 'Fail'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100'
                      }`}
                  >
                    {finalRemark || '—'}
                  </span>
                </td>
                {!isViewMode && (
                  <td className="px-2 py-2 text-center">
                    {leakageRows.length > 1 && row.location !== 'Tube' && (
                      <button type="button" onClick={() => removeLeakageRow(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Work Load and Max Leakage Calculation</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-48">Work Load:</label>
            <input
              type="text"
              value={workload}
              onChange={(e) => setWorkload(e.target.value)}
              disabled={isViewMode}
              className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
              placeholder="500"
            />
            <input
              type="text"
              value={workloadUnit}
              onChange={(e) => setWorkloadUnit(e.target.value)}
              disabled={isViewMode}
              className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
              placeholder="mA·min/week"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Summary of Maximum Radiation Leakage</h3>
        <div className="space-y-3">
          {calculatedResults.map((result, idx) => {
            const row = processedLeakage[idx];
            const maxValue = row.max || '—';
            const maVal = parseFloat(settings.ma) || 0;

            return (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-700 w-64">
                  Maximum Radiation Leakage from {result.location}:
                </span>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-2">
                    Formula: ({workload || '—'} {workloadUnit || 'mA·min/week'} × {maxValue} max Exposure Level ({row.unit === 'mGy/h' ? `${maxValue} mGy/h (= ${(parseFloat(maxValue || '0') * 114).toFixed(2)} mR/hr)` : `${maxValue} mR/hr`})) / (60 × {maVal || '—'} mA used for measurement) ÷ 114
                  </div>
                  <span className={`px-4 py-2 border-2 rounded-md font-semibold ${result.calculatedMGy !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50'}`}>
                    {result.calculatedMGy !== '—' ? `${result.calculatedMGy} mGy` : '—'} in one hour
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tolerance — same wording as Radiography Fixed */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Tolerance</h3>
        <div className="text-sm text-gray-700">
          <p>
            <strong>Tolerance:</strong> Calculated leakage (in one hour) must satisfy{' '}
            <select
              value={toleranceOperator}
              onChange={(e) =>
                setToleranceOperator(normalizeLeakageToleranceOperator(e.target.value))
              }
              disabled={isViewMode}
              className={`px-2 py-1 border rounded text-sm font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="less than">{'<'}</option>
              <option value="greater than">{">"}</option>
              <option value="=">{'='}</option>
            </select>{' '}
            <input
              type="text"
              value={toleranceValue}
              onChange={(e) => setToleranceValue(e.target.value)}
              disabled={isViewMode}
              className={`min-w-[6.5rem] max-w-[14rem] w-auto px-2 py-1 border rounded text-sm text-center font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="1"
            />
            {' '}
            (
            <span className="tabular-nums font-medium">{formatToleranceEquivalentMR(toleranceValue)}</span> mR) in one hour.
          </p>
          <p className="mt-2 text-xs text-gray-600">
            Formula: (workload × max exposure mR/h) ÷ (60 × mA) ÷ 114. Pass when this value{' '}
            <span className="font-mono">{leakageToleranceSymbol(toleranceOpNormalized)}</span> tolerance (compare at 4 decimal places).
          </p>
          {finalRemark ? (
            <p className="mt-4 text-base font-semibold">
              Overall result:{' '}
              <span className={finalRemark === 'Pass' ? 'text-green-700' : 'text-red-700'}>
                {finalRemark}
              </span>
              <span className="font-normal text-gray-600 text-sm ml-2">
                (based on highest calculated leakage vs tolerance)
              </span>
            </p>
          ) : null}
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
              {buttonText} Leakage
            </>
          )}
        </button>
      </div>
    </div>
  );
}
