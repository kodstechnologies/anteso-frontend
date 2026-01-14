'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import {
  addRadiationLeakage,
  getRadiationLeakageByTestId,
  getRadiationLeakageByServiceId,
  updateRadiationLeakage,
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
  tubeId?: string | null;
  onRefresh?: () => void;
  csvData?: any[];
}

export default function RadiationLeakageLevelFromXRay({ serviceId, testId: propTestId, tubeId, onRefresh, csvData }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Fixed rows
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
      const values = [row.front, row.back, row.left, row.right]
        .map((v) => parseFloat(v) || 0)
        .filter((v) => v > 0);
      const max = values.length > 0 ? Math.max(...values).toFixed(3) : '';
      return { ...row, max };
    });
  }, [leakageRows]);

  // === Calculate leakage result for each row (in mR in one hour) ===
  const rowLeakageResults = useMemo(() => {
    const workloadVal = parseFloat(workload) || 0;
    const maVal = parseFloat(settings.ma) || 1;

    return processedLeakage.map(row => {
      const rowMax = parseFloat(row.max) || 0;
      if (workloadVal > 0 && rowMax > 0 && maVal > 0) {
        // Formula: (workload × max Exposure Level (mR/hr)) / (60 × mA used for measurement) = mR in one hour
        return ((workloadVal * rowMax) / (60 * maVal)).toFixed(3);
      }
      return '';
    });
  }, [workload, processedLeakage, settings.ma]);

  // === Calculate mGy in one hour for each row (result / 114) ===
  // Following Radiography Fixed formula structure
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
    const tol = parseFloat(toleranceValue) || 0;

    if (!toleranceValue || globalMaxResultMGy === '—') return '';

    let pass = false;
    if (toleranceOperator === 'less than or equal to') pass = result <= tol;
    if (toleranceOperator === 'greater than or equal to') pass = result >= tol;
    if (toleranceOperator === '=') pass = Math.abs(result - tol) < 0.01;

    return pass ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceValue, toleranceOperator]);

  // === CSV Data Injection ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Settings
      const kv = csvData.find(r => r['Field Name'] === 'Table1_kvp')?.['Value'];
      const ma = csvData.find(r => r['Field Name'] === 'Table1_ma')?.['Value'];
      const time = csvData.find(r => r['Field Name'] === 'Table1_Time')?.['Value'];

      // Note: Workload is not in the standard template provided, so we leave it as is if not found.

      if (kv || ma || time) {
        setSettings(prev => ({
          ...prev,
          kv: kv || prev.kv,
          ma: ma || prev.ma,
          time: time || prev.time
        }));
      }

      // Leakage Rows
      const rowIndices = [...new Set(csvData
        .filter(r => r['Field Name'].startsWith('Table2_'))
        .map(r => parseInt(r['Row Index']))
        .filter(i => !isNaN(i) && i > 0)
      )];

      if (rowIndices.length > 0) {
        const newRows = rowIndices.map(idx => {
          const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
          return {
            location: rowData.find(r => r['Field Name'] === 'Table2_Area')?.['Value'] || '',
            front: rowData.find(r => r['Field Name'] === 'Table2_Front')?.['Value'] || '',
            back: rowData.find(r => r['Field Name'] === 'Table2_Back')?.['Value'] || '',
            left: rowData.find(r => r['Field Name'] === 'Table2_Left')?.['Value'] || '',
            right: rowData.find(r => r['Field Name'] === 'Table2_Right')?.['Value'] || '',
            max: '',
            unit: 'mGy/h',
            remark: '',
          };
        });
        setLeakageRows(newRows);
      }

      // Workload and Tolerance
      const wl = csvData.find(r => r['Field Name'] === 'Workload')?.['Value'];
      const wlUnit = csvData.find(r => r['Field Name'] === 'WorkloadUnit')?.['Value'];
      const tol = csvData.find(r => r['Field Name'] === 'Tolerance')?.['Value'];
      const tolOp = csvData.find(r => r['Field Name'] === 'ToleranceOperator')?.['Value'];
      const tolTime = csvData.find(r => r['Field Name'] === 'ToleranceTime')?.['Value'];

      if (wl) setWorkload(wl);
      if (wlUnit) setWorkloadUnit(wlUnit);
      if (tol) setToleranceValue(tol);
      if (tolOp) setToleranceOperator(tolOp as any);
      if (tolTime) setToleranceTime(tolTime);

      if (!testId) {
        setIsEditing(true);
      }
    }
  }, [csvData]);

  // === Update Handlers ===
  const updateSettings = (field: 'kv' | 'ma' | 'time', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
    setLeakageRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addLeakageRow = () => {
    setLeakageRows(prev => [
      ...prev,
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
  };

  const removeLeakageRow = (index: number) => {
    if (leakageRows.length <= 1) return;
    setLeakageRows(prev => prev.filter((_, i) => i !== index));
  };

  // === Form Valid ===
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

  // === Load Data ===
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let rec = null;

        if (propTestId) {
          const response = await getRadiationLeakageByTestId(propTestId);
          rec = response.data || response;
        } else {
          rec = await getRadiationLeakageByServiceId(serviceId);
        }

        if (rec) {
          setTestId(rec._id || propTestId);

          if (rec.measurementSettings?.[0]) {
            setSettings({
              kv: String(rec.measurementSettings[0].kv),
              ma: String(rec.measurementSettings[0].ma),
              time: String(rec.measurementSettings[0].time),
            });
          }

          if (Array.isArray(rec.leakageMeasurements)) {
            setLeakageRows(
              rec.leakageMeasurements.map((r: any) => ({
                location: r.location || '',
                front: String(r.front),
                back: String(r.back),
                left: String(r.left),
                right: String(r.right),
                max: '',
                unit: r.unit || 'mGy/h',
                remark: '',
              }))
            );
          }

          setWorkload(rec.workload || '');
          setWorkloadUnit(rec.workloadUnit || 'mA·min/week');
          setToleranceValue(rec.tolerance || '');
          setToleranceOperator(rec.toleranceOperator || 'less than or equal to');
          setToleranceTime(rec.toleranceTime || '1');

          setHasSaved(true);
          setIsEditing(false);
        } else {
          setHasSaved(false);
          setIsEditing(true);
        }
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load data');
        setHasSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId, propTestId]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      measurementSettings: [
        {
          kv: parseFloat(settings.kv) || 0,
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
        res = await updateRadiationLeakage(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addRadiationLeakage(serviceId, payload);
        const newId = res.data?.testId || res.data?.data?.testId || res.data?._id;
        if (newId) {
          setTestId(newId);
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

      {/* ==================== Table 1: kV, mA, Time (Fixed) ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
        {!isViewMode && (
          <div className="px-6 py-3 bg-gray-50 border-t">
            <button
              onClick={addLeakageRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        )}
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance (mGy/h)
        </label>
        <div className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
              }`}
            placeholder="1.0"
          />
          <select
            value={toleranceOperator}
            onChange={(e) => setToleranceOperator(e.target.value as any)}
            disabled={isViewMode}
            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
              }`}
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
            className={`w-20 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
              }`}
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