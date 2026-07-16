'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import {
  addRadiationLeakageLevelForOPG,
  getRadiationLeakageLevelByServiceIdForOPG,
  getRadiationLeakageLevelByTestIdForOPG,
  updateRadiationLeakageLevelForOPG,
} from '../../../../../../api';
import toast from 'react-hot-toast';
import { useRegisterTestExport } from '../shared/TestExportRegistry';

interface SettingsRow {
  ffd: string;
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
  csvData?: any[];
}

/** Only strict &lt;, &gt;, and = (legacy ≤/≥ from API/CSV map onto these). */
type LeakageToleranceOperator = 'less than' | 'greater than' | '=';

/** API/CSV symbols/phrases → one of the three operators above. */
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
  // Legacy “or equal” forms → closest strict operator for this form
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

/** Pass ⇔ scaled mGy vs tolerance at 4 dp. */
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

export default function RadiationLeakageLevelFromXRay({ serviceId, testId: propTestId, onRefresh, csvData }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Fixed rows
  const [settings, setSettings] = useState<SettingsRow>({ ffd: '', kv: '', ma: '', time: '' });
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

  const toleranceOpNormalized = normalizeLeakageToleranceOperator(toleranceOperator);

  // === Auto Max per row ===
  const processedLeakage = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.front, row.back, row.left, row.right]
        .map((v) => parseFloat(v) || 0)
        .filter((v) => v > 0);
      const max = values.length > 0 ? Math.max(...values).toFixed(3) : '';
      return { ...row, max };
    });
  }, [leakageRows]);

  // === Calculate mGy in one hour for each row (result / 114) ===
  const calculatedResults = useMemo(() => {
    return processedLeakage.map((row, idx) => {
      const rowMax = parseFloat(row.max) || 0;
      const maVal = parseFloat(settings.ma) || 1;
      const workloadVal = parseFloat(workload) || 0;

      let calculatedMR = '';
      let calculatedMGy = '—';

      if (rowMax > 0 && maVal > 0 && workloadVal > 0) {
        // Treat exposure level as mR/hr for calculation (convert mGy/h to mR/hr if needed)
        // If unit is mGy/h, convert to mR/hr: mGy/h × 114 = mR/hr
        const exposureLevelMR = row.unit === 'mGy/h' ? rowMax * 114 : rowMax;

        // Formula: (workload × max Exposure Level (mR/hr)) / (60 × mA used for measurement) = mR in one hour
        const resultMR = (workloadVal * exposureLevelMR) / (60 * maVal);
        calculatedMR = resultMR.toFixed(3);
        // Convert to mGy: result / 114 = mGy in one hour
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

  // === Global highest leakage (for final Pass/Fail) ===
  const allCalculatedMGy = calculatedResults.map(r => parseFloat(r.calculatedMGy || '0') || 0);
  const globalMaxResultMGy = allCalculatedMGy.length > 0 && Math.max(...allCalculatedMGy) > 0
    ? Math.max(...allCalculatedMGy).toFixed(4)
    : '—';

  // === Auto Remark ===
  const finalRemark = useMemo(() => {
    const result = parseFloat(globalMaxResultMGy || '0') || 0;
    const tolStr = String(toleranceValue ?? '').trim();
    const tol = parseFloat(tolStr);

    if (!tolStr || globalMaxResultMGy === '—' || Number.isNaN(tol)) return '';

    const pass = compareMgyToTolerance(result, tol, toleranceOpNormalized);
    return pass ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceValue, toleranceOpNormalized]);

  // === Update Handlers ===
  const updateSettings = (field: keyof SettingsRow, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
    setLeakageRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      settings.ffd.trim() &&
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

  // === Load Data ===
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getRadiationLeakageLevelByServiceIdForOPG(serviceId);
        const rec = res?.data;
        const hasCsvImport = csvData && csvData.length > 0;

        if (!rec) {
          setIsLoading(false);
          setIsEditing(true);
          return;
        }

        if (rec) {
          setTestId(rec._id || propTestId);

          if (!hasCsvImport) {
            if (rec.settings?.[0] || rec.measurementSettings?.[0]) {
              const s = rec.settings?.[0] || rec.measurementSettings?.[0];
              setSettings({
                ffd: String(s.ffd || s.fdd || s.fcd || ''),
                kv: String(s.kv || s.kvp || ''),
                ma: String(s.ma || ''),
                time: String(s.time || ''),
              });
            }

            if (Array.isArray(rec.leakageMeasurements)) {
              setLeakageRows(
                rec.leakageMeasurements.map((r: any) => ({
                  location: r.location || '',
                  front: String(r.front || r.top || ''),
                  back: String(r.back || r.up || ''),
                  left: String(r.left || ''),
                  right: String(r.right || ''),
                  max: '',
                  unit: r.unit || 'mGy/h',
                  remark: '',
                }))
              );
            }

            setWorkload(rec.workload || '');
            setWorkloadUnit(rec.workloadUnit || 'mA·min/week');
            setToleranceValue(rec.toleranceValue || rec.tolerance || '');
            setToleranceOperator(normalizeLeakageToleranceOperator(rec.toleranceOperator || 'less than'));
            setToleranceTime(rec.toleranceTime || '1');

            setHasSaved(true);
            setIsEditing(false);
          } else {
            setHasSaved(false);
            setIsEditing(true);
          }
        } else {
          setHasSaved(false);
          setIsEditing(true);
        }
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load data');
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId, csvData]);

  const cellStr = (c: unknown) => c?.toString()?.trim() ?? '';
  const cellLower = (c: unknown) => cellStr(c).toLowerCase();
  const isFfdLabel = (c: unknown) => ['ffd', 'fcd', 'fdd'].includes(cellLower(c));
  const isKvLabel = (c: unknown) => cellLower(c).includes('kv');
  const isMaLabel = (c: unknown) => cellLower(c) === 'ma';
  const isTimeLabel = (c: unknown) => {
    const s = cellLower(c);
    return s === 'time' || s === 'timer' || s.startsWith('time ') || s.startsWith('timer ');
  };
  const isTolLabel = (c: unknown) => {
    const s = cellLower(c);
    return s === 'tolerance' || s.startsWith('tolerance ');
  };

  // CSV Data Injection — apply after load finishes so server data does not overwrite import
  useEffect(() => {
    if (isLoading || !csvData || csvData.length === 0) return;

    const isHorizontalFormat = Array.isArray(csvData[0]);

    if (isHorizontalFormat) {
      const headerRow = csvData.find((r: any[]) => cellLower(r[0]) === 'location');
      const colMap: Record<string, number> = {};
      if (headerRow) {
        headerRow.forEach((c: unknown, i: number) => {
          const key = cellLower(c);
          if (i > 0 && key) colMap[key] = i;
        });
      } else {
        // Default column order matches UI Exposure Level (mGy): Front, Back, Left, Right
        colMap.front = 1;
        colMap.back = 2;
        colMap.left = 3;
        colMap.right = 4;
      }

      const getCol = (row: any[], ...names: string[]) => {
        for (const name of names) {
          const idx = colMap[name.toLowerCase()];
          if (idx != null && row[idx] != null && cellStr(row[idx]) !== '') {
            return cellStr(row[idx]);
          }
        }
        return '';
      };

      const newLeakageRows: LeakageRow[] = [];

      csvData.forEach((row: any[]) => {
        const first = cellStr(row[0]);
        const firstLower = first.toLowerCase();

        if (row.some(isFfdLabel) && row.some(isKvLabel)) {
          const fIndex = row.findIndex(isFfdLabel);
          const kIndex = row.findIndex(isKvLabel);
          const maIndex = row.findIndex(isMaLabel);
          const tIndex = row.findIndex(isTimeLabel);
          const tolIndex = row.findIndex(isTolLabel);

          setSettings(prev => ({
            ...prev,
            ffd: fIndex >= 0 && row[fIndex + 1] != null ? String(row[fIndex + 1]) : prev.ffd,
            kv: kIndex >= 0 && row[kIndex + 1] != null ? String(row[kIndex + 1]) : prev.kv,
            ma: maIndex >= 0 && row[maIndex + 1] != null ? String(row[maIndex + 1]) : prev.ma,
            time: tIndex >= 0 && row[tIndex + 1] != null ? String(row[tIndex + 1]) : prev.time,
          }));
          if (tolIndex >= 0 && row[tolIndex + 1] != null) {
            setToleranceValue(String(row[tolIndex + 1]));
          }
          return;
        }

        if (firstLower === 'workload' && row[1] != null) {
          setWorkload(String(row[1]));
          return;
        }

        if (firstLower === 'location') return;
        if (firstLower.startsWith('tolerance')) return;

        if (firstLower === 'front' || firstLower === 'back') {
          newLeakageRows.push({
            location: firstLower === 'front' ? 'Tube' : 'Collimator',
            left: getCol(row, 'left'),
            right: getCol(row, 'right'),
            front: getCol(row, 'front', 'top'),
            back: getCol(row, 'back', 'up', 'down'),
            max: '',
            unit: 'mGy/h',
            remark: '',
          });
          return;
        }

        if (firstLower === 'tube' || firstLower === 'collimator') {
          newLeakageRows.push({
            location: firstLower === 'collimator' ? 'Collimator' : 'Tube',
            left: getCol(row, 'left'),
            right: getCol(row, 'right'),
            front: getCol(row, 'front', 'top'),
            back: getCol(row, 'back', 'up', 'down'),
            max: '',
            unit: 'mGy/h',
            remark: '',
          });
        }
      });

      if (newLeakageRows.length > 0) {
        setLeakageRows(newLeakageRows);
      }

      setIsEditing(true);
      setHasSaved(false);
      return;
    }

    // Legacy vertical Field Name / Value format
    const getField = (...names: string[]) =>
      csvData.find((r: any) => names.includes(String(r['Field Name'] || '')))?.['Value'];

    const ffd = getField('FFD', 'ffd', 'FDD', 'fdd', 'FCD', 'fcd');
    const kv = getField('kV', 'kVp', 'kv', 'kvp');
    const ma = getField('mA', 'ma');
    const time = getField('Time', 'time');

    if (ffd || kv || ma || time) {
      setSettings(prev => ({
        ...prev,
        ffd: ffd ? String(ffd) : prev.ffd,
        kv: kv ? String(kv) : prev.kv,
        ma: ma ? String(ma) : prev.ma,
        time: time ? String(time) : prev.time,
      }));
    }

    const rowIndices = [...new Set(csvData
      .filter((r: any) => r['Field Name'] && (r['Field Name'].startsWith('Table2_') || r['Field Name'].startsWith('leakageRows_')))
      .map((r: any) => parseInt(r['Row Index']))
      .filter((i: number) => !isNaN(i) && i >= 0)
    )];

    if (rowIndices.length > 0) {
      const newRows = rowIndices.map(idx => {
        const rowData = csvData.filter((r: any) => parseInt(r['Row Index']) === idx);
        return {
          location: rowData.find((r: any) => ['Location', 'location', 'Table2_Area'].includes(r['Field Name']))?.['Value'] || '',
          front: rowData.find((r: any) => ['Front', 'front', 'Table2_Front', 'top', 'Top'].includes(r['Field Name']))?.['Value'] || '',
          back: rowData.find((r: any) => ['Back', 'back', 'Table2_Back', 'up', 'Up'].includes(r['Field Name']))?.['Value'] || '',
          left: rowData.find((r: any) => ['Left', 'left', 'Table2_Left'].includes(r['Field Name']))?.['Value'] || '',
          right: rowData.find((r: any) => ['Right', 'right', 'Table2_Right'].includes(r['Field Name']))?.['Value'] || '',
          max: '',
          unit: 'mGy/h',
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

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      measurementSettings: [
        {
          ffd: settings.ffd.trim(),
          kv: parseFloat(settings.kv) || 0,
          ma: parseFloat(settings.ma) || 0,
          time: parseFloat(settings.time) || 0,
        },
      ],
      settings: [
        {
          ffd: settings.ffd.trim(),
          kv: parseFloat(settings.kv) || 0,
          kvp: parseFloat(settings.kv) || 0,
          ma: parseFloat(settings.ma) || 0,
          time: parseFloat(settings.time) || 0,
        },
      ],
      leakageMeasurements: leakageRows.map(r => ({
        location: r.location,
        front: parseFloat(r.front) || 0,
        back: parseFloat(r.back) || 0,
        left: parseFloat(r.left) || 0,
        right: parseFloat(r.right) || 0,
        unit: r.unit,
      })),
      workload: parseFloat(workload) || 0,
      workloadUnit,
      tolerance: toleranceValue.trim(),
      toleranceOperator,
      toleranceTime: toleranceTime.trim(),
    };

    try {
      let res;
      if (testId) {
        res = await updateRadiationLeakageLevelForOPG(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addRadiationLeakageLevelForOPG(serviceId, payload);
        const newTestId = res?.data?.testId || res?.data?._id;
        if (newTestId) {
          setTestId(newTestId);
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

  const toggleEdit = () => {
    if (!hasSaved) return;
    setIsEditing(true);
  };

  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  const getExportData = useCallback(() => {
    const hasSettings =
      String(settings.ffd || '').trim() ||
      String(settings.kv || '').trim() ||
      String(settings.ma || '').trim() ||
      String(settings.time || '').trim();
    const hasLeakage = leakageRows.some(
      (r) =>
        String(r.location || '').trim() ||
        String(r.front || '').trim() ||
        String(r.back || '').trim() ||
        String(r.left || '').trim() ||
        String(r.right || '').trim()
    );
    if (!hasSettings && !hasLeakage) return null;
    return {
      measurementSettings: [
        {
          ffd: settings.ffd.trim(),
          kv: parseFloat(settings.kv) || 0,
          ma: parseFloat(settings.ma) || 0,
          time: parseFloat(settings.time) || 0,
        },
      ],
      settings: [
        {
          ffd: settings.ffd.trim(),
          kv: parseFloat(settings.kv) || 0,
          kvp: parseFloat(settings.kv) || 0,
          ma: parseFloat(settings.ma) || 0,
          time: parseFloat(settings.time) || 0,
        },
      ],
      leakageMeasurements: leakageRows.map((r) => ({
        location: r.location,
        front: parseFloat(r.front) || 0,
        back: parseFloat(r.back) || 0,
        left: parseFloat(r.left) || 0,
        right: parseFloat(r.right) || 0,
        unit: r.unit,
      })),
      workload: parseFloat(workload) || 0,
      workloadUnit,
      tolerance: toleranceValue.trim(),
      toleranceOperator,
      toleranceTime: toleranceTime.trim(),
    };
  }, [
    settings,
    leakageRows,
    workload,
    workloadUnit,
    toleranceValue,
    toleranceOperator,
    toleranceTime,
  ]);

  useRegisterTestExport('radiationLeakage', getExportData);

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

      {/* ==================== Table 1: FDD, kV, mA, Time ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">
                FDD (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">
                kV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">
                mA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                Time (sec)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.ffd}
                  onChange={(e) => updateSettings('ffd', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.kv}
                  onChange={(e) => updateSettings('kv', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="120"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.ma}
                  onChange={(e) => updateSettings('ma', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={settings.time}
                  onChange={(e) => updateSettings('time', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="1.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==================== Workload Input ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Workload</label>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="text"
            value={workload}
            onChange={(e) => setWorkload(e.target.value)}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
              }`}
            placeholder="500"
          />
          <input
            type="text"
            value={workloadUnit}
            onChange={(e) => setWorkloadUnit(e.target.value)}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
              }`}
            placeholder="mA·min/week"
          />
        </div>
      </div>

      {/* ==================== Table 2: Leakage Results (Fixed 1 row) ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Leakage Measurement Results
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                Location
              </th>
              <th colSpan={4} className="px-4 py-3 text-center text-xs font-medium text-gray-700  tracking-wider border-r">
                Exposure Level (mGy)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                Max
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                Unit
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">
                Remark
              </th>
            </tr>
            <tr>
              {['Front', 'Back', 'Left', 'Right'].map((dir) => (
                <th
                  key={dir}
                  className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
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
                    className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                      }`}
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
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                        }`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-2 py-2 border-r bg-gray-50">
                  <input
                    type="text"
                    value={row.max}
                    readOnly
                    className="w-full px-2 py-1 bg-gray-100 text-sm text-center font-medium"
                  />
                </td>
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateLeakage(idx, 'unit', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                      }`}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Work Load and Max Leakage Calculation */}
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
              className={`w-48 px-4 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="500"
            />
            <input
              type="text"
              value={workloadUnit}
              onChange={(e) => setWorkloadUnit(e.target.value)}
              disabled={isViewMode}
              className={`w-48 px-4 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="mA·min/week"
            />
          </div>
          {processedLeakage.map((row, idx) => {
            const rowMax = parseFloat(row.max) || 0;
            const maVal = parseFloat(settings.ma) || 0;
            const workloadVal = parseFloat(workload) || 0;
            const calculatedMR = calculatedResults[idx]?.calculatedMR || '—';
            const exposureLevelMR = row.unit === 'mGy/h' ? rowMax * 114 : rowMax;
            const maxExposureLevel = rowMax > 0 ? (row.unit === 'mGy/h' ? `${rowMax.toFixed(2)} mGy/h (= ${exposureLevelMR.toFixed(2)} mR/hr)` : `${rowMax.toFixed(2)} mR/hr`) : '—';

            return (
              <div key={idx} className="flex items-start gap-3">
                <label className="text-sm font-medium text-gray-700 w-48">Max Leakage =</label>
                <div className="flex-1">
                  <div className="text-sm text-gray-700 mb-2">
                    ({workload || '—'} {workloadUnit || 'mA·min/week'} × {maxExposureLevel} max Exposure Level) / (60 × {maVal || '—'} mA used for measurement)
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Calculated Max Leakage:</span>
                    <span className={`ml-3 px-4 py-2 border-2 rounded-md font-bold text-lg ${calculatedMR !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'
                      }`}>
                      {calculatedMR} mR in one hour
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== Summary of Maximum Radiation Leakage ==================== */}
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
                  <span className={`px-4 py-2 border-2 rounded-md font-semibold ${result.calculatedMGy !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50'
                    }`}>
                    {result.calculatedMGy !== '—' ? `${result.calculatedMGy} mGy` : '—'} in one hour
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== Tolerance ==================== */}
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
              <span
                className={
                  finalRemark === 'Pass' ? 'text-green-700' : 'text-red-700'
                }
              >
                {finalRemark}
              </span>
              <span className="font-normal text-gray-600 text-sm ml-2">
                (based on highest calculated leakage vs tolerance)
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {/* ==================== SAVE BUTTON ==================== */}
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