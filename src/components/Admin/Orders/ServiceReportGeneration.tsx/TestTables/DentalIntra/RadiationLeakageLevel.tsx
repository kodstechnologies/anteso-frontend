'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import {
  addRadiationLeakageLevelForDentalIntra,
  getRadiationLeakageLevelByServiceIdForDentalIntra,
  getRadiationLeakageLevelByTestIdForDentalIntra,
  updateRadiationLeakageLevelForDentalIntra,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface SettingsRow {
  ffd: string;
  kvp: string;
  ma: string;
  time: string;
}

interface LeakageRow {
  location: string;
  left: string;
  right: string;
  top: string;
  up: string;
  down: string;
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

export default function RadiationLeakageLevelFromXRay({ serviceId, testId: propTestId, onRefresh, csvData }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Fixed rows
  const [settings, setSettings] = useState<SettingsRow>({ ffd: '', kvp: '', ma: '', time: '' });
  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    {
      location: 'Tube',
      left: '',
      right: '',
      top: '',
      up: '',
      down: '',
      max: '',
      unit: 'mGy/h',
      remark: '',
    },
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [workloadUnit, setWorkloadUnit] = useState<string>('mA·min/week');
  const [toleranceValue, setToleranceValue] = useState<string>('');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime, setToleranceTime] = useState<string>('1');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // === Auto Max per row ===
  const processedLeakage = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.left, row.right, row.top, row.up, row.down]
        .map((v) => parseFloat(v) || 0)
        .filter((v) => v > 0);
      const max = values.length > 0 ? Math.max(...values).toFixed(3) : '';
      return { ...row, max };
    });
  }, [leakageRows]);

  // === Calculate mGy in one hour for each row ===
  const calculatedResults = useMemo(() => {
    return processedLeakage.map((row, idx) => {
      const rowMax = parseFloat(row.max) || 0;
      const maVal = parseFloat(settings.ma) || 0;
      const workloadVal = parseFloat(workload) || 0;

      let calculatedMR = '';
      let calculatedMGy = '—';

      if (rowMax > 0 && maVal > 0 && workloadVal > 0) {
        // Adaptation of CBCT Formula logic:
        // CBCT: Exposure Level (mR/hr) = mGy/h * 114 (if unit is mGy/h)
        const exposureLevelMR = row.unit === 'mGy/h' ? rowMax * 114 : rowMax;

        // Formula: (workload * exposureLevelMR) / (60 * mA)
        const resultMR = (workloadVal * exposureLevelMR) / (60 * maVal);
        calculatedMR = resultMR.toFixed(3);

        // Convert to mGy: result / 114
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
    const tol = parseFloat(toleranceValue) || 0;

    if (!toleranceValue || globalMaxResultMGy === '—') return '';

    let pass = false;
    if (toleranceOperator === 'less than or equal to') pass = result <= tol;
    if (toleranceOperator === 'greater than or equal to') pass = result >= tol;
    if (toleranceOperator === '=') pass = Math.abs(result - tol) < 0.001;

    return pass ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceValue, toleranceOperator]);

  // === Update Handlers ===
  const updateSettings = (field: 'ffd' | 'kvp' | 'ma' | 'time', value: string) => {
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
      settings.kvp.trim() &&
      settings.ma.trim() &&
      settings.time.trim() &&
      leakageRows.every(r =>
        r.left.trim() && r.right.trim() && r.top.trim() && r.up.trim() && r.down.trim()
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
        const res = await getRadiationLeakageLevelByServiceIdForDentalIntra(serviceId);
        const rec = res?.data;
        if (!rec) {
          setIsLoading(false);
          setIsEditing(true);
          return;
        }

        setTestId(rec._id || null);
        if (rec.settings?.[0]) {
          setSettings({
            ffd: String(rec.settings[0].ffd || ''),
            kvp: String(rec.settings[0].kvp || rec.settings[0].kv || ''),
            ma: String(rec.settings[0].ma || ''),
            time: String(rec.settings[0].time || ''),
          });
        }

        if (Array.isArray(rec.leakageMeasurements)) {
          setLeakageRows(
            rec.leakageMeasurements.map((r: any) => ({
              location: r.location || '',
              left: String(r.left || ''),
              right: String(r.right || ''),
              top: String(r.top || r.front || ''),
              up: String(r.up || r.back || ''),
              down: String(r.down || ''),
              max: String(r.max || ''),
              unit: r.unit || '',
              remark: r.remark || '',
            }))
          );
        }

        setWorkload(rec.workload || '');
        setWorkloadUnit(rec.workloadUnit || '');
        setToleranceValue(rec.toleranceValue || '');
        setToleranceOperator(rec.toleranceOperator || 'less than or equal to');
        setToleranceTime(rec.toleranceTime || '');

        setHasSaved(true);
        setIsEditing(false);
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load data');
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId]);

  // === CSV Data Injection ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Settings
      const ffdVal = csvData.find(r => r['Field Name'] === 'distance')?.['Value']; // Mapped from Distance -> distance
      const kvVal = csvData.find(r => r['Field Name'] === 'kV')?.['Value'];
      const maVal = csvData.find(r => r['Field Name'] === 'mA')?.['Value'];
      const timeVal = csvData.find(r => r['Field Name'] === 'Time')?.['Value'];

      setSettings(prev => ({
        ...prev,
        ffd: ffdVal || prev.ffd,
        kvp: kvVal || prev.kvp,
        ma: maVal || prev.ma,
        time: timeVal || prev.time
      }));

      // Workload & Tolerance
      const wl = csvData.find(r => r['Field Name'] === 'Workload')?.['Value'];
      const wlUnit = csvData.find(r => r['Field Name'] === 'WorkloadUnit')?.['Value'];
      const tolVal = csvData.find(r => r['Field Name'] === 'ToleranceValue')?.['Value'];
      const tolOp = csvData.find(r => r['Field Name'] === 'ToleranceOperator')?.['Value'];
      const tolTime = csvData.find(r => r['Field Name'] === 'ToleranceTime')?.['Value'];

      if (wl) setWorkload(wl);
      if (wlUnit) setWorkloadUnit(wlUnit);
      if (tolVal) setToleranceValue(tolVal);
      if (tolOp) setToleranceOperator(tolOp as any);
      if (tolTime) setToleranceTime(tolTime);

      // Leakage Rows
      const rowIndices = [...new Set(csvData
        .filter(r => r['Field Name'] === 'Table2_Area' || r['Field Name'] === 'Table2_Front')
        .map(r => parseInt(r['Row Index']))
        .filter(i => !isNaN(i) && i >= 0)
      )].sort((a, b) => a - b);

      if (rowIndices.length > 0) {
        const newRows = rowIndices.map(idx => {
          const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
          const loc = rowData.find(r => r['Field Name'] === 'Table2_Area')?.['Value'] || 'Tube Housing';

          return {
            location: loc,
            left: rowData.find(r => r['Field Name'] === 'Table2_Left')?.['Value'] || '',
            right: rowData.find(r => r['Field Name'] === 'Table2_Right')?.['Value'] || '',
            top: rowData.find(r => r['Field Name'] === 'Table2_Top')?.['Value'] || '',
            up: rowData.find(r => r['Field Name'] === 'Table2_Front')?.['Value'] || '', // Front mapped to up
            down: rowData.find(r => r['Field Name'] === 'Table2_Back')?.['Value'] || '', // Back mapped to down
            max: '',
            unit: 'mGy/h',
            remark: ''
          };
        });
        // Actually, looking at template: Location, Front, Back, Left, Right, Top
        // Let's map Front->Top, Back->Up, Top->Down? Or ignore?
        // Let's rely on component logic finding mapped keys.
        // I will use distinct keys in the parser update coming next.

        setLeakageRows(newRows);
      }

      if (!testId && (rowIndices.length > 0 || ffdVal)) setIsEditing(true);

      // Since I can't easily iterate all rows without fixing mapping first, I will add simple logic here 
      // and FIX the parser map in the next step to output distinct keys like Table2_Up, Table2_Down.
    }
  }, [csvData]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      settings: [
        {
          ffd: settings.ffd,
          kvp: settings.kvp,
          ma: settings.ma,
          time: settings.time,
        },
      ],
      leakageMeasurements: leakageRows.map(r => ({
        location: r.location,
        left: r.left,
        right: r.right,
        top: r.top,
        up: r.up,
        down: r.down,
        max: r.max,
        unit: r.unit,
        remark: r.remark,
      })),
      workload: workload,
      workloadUnit,
      toleranceValue: toleranceValue.trim(),
      toleranceOperator,
      toleranceTime: toleranceTime.trim(),
    };

    try {
      let res;
      if (testId) {
        res = await updateRadiationLeakageLevelForDentalIntra(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addRadiationLeakageLevelForDentalIntra(serviceId, payload);
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

      {/* ==================== Table 1: FFD, kVp, mA, Time (Fixed) ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                FFD (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                kVp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                mA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time (Sec)
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
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.kvp}
                  onChange={(e) => updateSettings('kvp', e.target.value)}
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

      {/* ==================== Workload Input ==================== */}
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

      {/* ==================== Table 2: Leakage Results ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Leakage Measurement Results
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Location
              </th>
              <th colSpan={5} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Exposure Level (mGy)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Max
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Unit
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Remark
              </th>
            </tr>
            <tr>
              {['Left', 'Right', 'Top', 'Front', 'Back'].map((dir) => (
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
                  <input
                    type="text"
                    value={row.location}
                    onChange={(e) => updateLeakage(idx, 'location', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="Tube"
                  />
                </td>
                {/* Order: Left, Right, Top, Front(up), Back(down) */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={leakageRows[idx].left}
                    onChange={(e) => updateLeakage(idx, 'left', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={leakageRows[idx].right}
                    onChange={(e) => updateLeakage(idx, 'right', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={leakageRows[idx].top}
                    onChange={(e) => updateLeakage(idx, 'top', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={leakageRows[idx].up} // Front mapped to up
                    onChange={(e) => updateLeakage(idx, 'up', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={leakageRows[idx].down} // Back mapped to down
                    onChange={(e) => updateLeakage(idx, 'down', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="0.00"
                  />
                </td>
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
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-block w-full px-2 py-1 text-sm text-center font-medium rounded ${finalRemark === 'Pass' ? 'bg-green-100 text-green-800' : finalRemark === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                    {finalRemark || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==================== Work Load and Max Leakage Calculation ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Work Load and Max Leakage Calculation</h3>
        <div className="space-y-3">
          {processedLeakage.map((row, idx) => {
            const rowMax = parseFloat(row.max) || 0;
            const maVal = parseFloat(settings.ma) || 0;
            const calculatedMR = calculatedResults[idx]?.calculatedMR || '—';
            // Visual display logic similar to CBCT
            const exposureLevelMR = row.unit === 'mGy/h' ? rowMax * 114 : rowMax;
            const maxExposureLevel = rowMax > 0 ? (row.unit === 'mGy/h' ? `${rowMax.toFixed(2)} mGy/h (= ${exposureLevelMR.toFixed(2)} mR/hr)` : `${rowMax.toFixed(2)} mR/hr`) : '—';

            return (
              <div key={idx} className="flex items-start gap-3">
                <label className="text-sm font-medium text-gray-700 w-48">Max Leakage ({row.location}) =</label>
                <div className="flex-1">
                  <div className="text-sm text-gray-700 mb-2">
                    ({workload || '—'} {workloadUnit || 'mA·min/week'} × {maxExposureLevel} max Exposure Level) / (60 × {maVal || '—'} mA used for measurement)
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Calculated Max Leakage:</span>
                    <span className={`ml-3 px-4 py-2 border-2 rounded-md font-bold text-lg ${calculatedMR !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'}`}>
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
                  <span className={`px-4 py-2 border-2 rounded-md font-semibold ${result.calculatedMGy !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50'}`}>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance (mGy/h)
        </label>
        <div className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            placeholder="1.0"
          />
          <select
            value={toleranceOperator}
            onChange={(e) => setToleranceOperator(e.target.value as any)}
            disabled={isViewMode}
            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
          >
            <option value="less than or equal to">less than or equal to</option>
            <option value="greater than or equal to">greater than or equal to</option>
            <option value="=">=</option>
          </select>
          <span className="text-sm text-gray-600">in</span>
          <input
            type="text"
            value={toleranceTime}
            onChange={(e) => setToleranceTime(e.target.value)}
            disabled={isViewMode}
            className={`w-20 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            placeholder="1"
          />
          <span className="text-sm text-gray-600">hr</span>
        </div>
      </div>

      {/* ==================== SAVE BUTTON ==================== */}
      <div className="flex justify-end mt-6">
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid) ? 'bg-gray-400 cursor-not-allowed' : isViewMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'}`}
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

