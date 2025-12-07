'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addTubeHousingLeakageForDentalHandHeld,
  getTubeHousingLeakageByServiceIdForDentalHandHeld,
  updateTubeHousingLeakageForDentalHandHeld,
} from "../../../../../../api";

interface SettingsRow {
  distance: string;
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
  top: string;
  max: string;
  unit: string;
  remark: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

export default function TubeHousingLeakage({ serviceId, testId: propTestId, onRefresh }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [settings, setSettings] = useState<SettingsRow>({
    distance: '',
    kv: '',
    ma: '',
    time: '',
  });

  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    {
      location: 'Tube Housing',
      front: '',
      back: '',
      left: '',
      right: '',
      top: '',
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

  // Auto calculate Max from 5 directions
  const processedLeakage = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.front, row.back, row.left, row.right, row.top]
        .map((v) => parseFloat(v) || 0)
        .filter((v) => v > 0);
      const max = values.length > 0 ? Math.max(...values).toFixed(3) : '';
      return { ...row, max };
    });
  }, [leakageRows]);

  // Max Leakage Calculation
  const maxLeakageResult = useMemo(() => {
    const workloadVal = parseFloat(workload) || 0;
    const maxLeakage = Math.max(...processedLeakage.map(r => parseFloat(r.max) || 0));
    if (workloadVal > 0 && maxLeakage > 0) {
      return ((workloadVal * maxLeakage) / (60 * 100)).toFixed(3);
    }
    return '';
  }, [workload, processedLeakage]);

  const finalLeakageRate = useMemo(() => {
    const result = parseFloat(maxLeakageResult) || 0;
    return result > 0 ? (result / 114).toFixed(3) : '';
  }, [maxLeakageResult]);

  // Auto Remark
  const finalRemark = useMemo(() => {
    const measured = parseFloat(finalLeakageRate) || 0;
    const tol = parseFloat(toleranceValue) || 0;

    if (!toleranceValue || !finalLeakageRate) return '';

    let pass = false;
    if (toleranceOperator === 'less than or equal to') pass = measured <= tol;
    if (toleranceOperator === 'greater than or equal to') pass = measured >= tol;
    if (toleranceOperator === '=') pass = Math.abs(measured - tol) < 0.001;

    return pass ? 'Pass' : 'Fail';
  }, [finalLeakageRate, toleranceValue, toleranceOperator]);

  const updateSettings = (field: keyof SettingsRow, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
    setLeakageRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      settings.distance.trim() &&
      settings.kv.trim() &&
      settings.ma.trim() &&
      settings.time.trim() &&
      leakageRows.every(r =>
        r.front.trim() && r.back.trim() && r.left.trim() && r.right.trim() && r.top.trim()
      ) &&
      workload.trim() &&
      toleranceValue.trim()
    );
  }, [serviceId, settings, leakageRows, workload, toleranceValue]);

  // Load existing test data
  useEffect(() => {
    if (!serviceId) return;
    
    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getTubeHousingLeakageByServiceIdForDentalHandHeld(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          
          // Map measurementSettings (backend) to settings (frontend)
          if (testData.measurementSettings) {
            setSettings({
              distance: testData.measurementSettings.distance || '',
              kv: testData.measurementSettings.kv || '',
              ma: testData.measurementSettings.ma || '',
              time: testData.measurementSettings.time || '',
            });
          }
          
          // Map leakageMeasurements (backend) to leakageRows (frontend)
          if (testData.leakageMeasurements && testData.leakageMeasurements.length > 0) {
            setLeakageRows(testData.leakageMeasurements.map((row: any) => ({
              location: row.location || 'Tube Housing',
              front: row.front || '',
              back: row.back || '',
              left: row.left || '',
              right: row.right || '',
              top: row.top || '',
              max: row.max || '',
              unit: row.unit || 'mGy/h',
              remark: row.remark || '',
            })));
          }
          
          // Map workload (backend has {value, unit}) to separate state
          if (testData.workload) {
            setWorkload(testData.workload.value || '');
            setWorkloadUnit(testData.workload.unit || 'mA·min/week');
          }
          
          // Map tolerance (backend has {value, operator, time}) to separate state
          if (testData.tolerance) {
            setToleranceValue(testData.tolerance.value || '');
            setToleranceOperator(testData.tolerance.operator || 'less than or equal to');
            setToleranceTime(testData.tolerance.time || '1');
          }
          
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load test data");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTest();
  }, [serviceId]);

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Please fill all fields');
      return;
    }
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }

    setIsSaving(true);
    try {
      // Map frontend state to backend schema structure
      const payload = {
        measurementSettings: {
          distance: settings.distance,
          kv: settings.kv,
          ma: settings.ma,
          time: settings.time,
        },
        leakageMeasurements: processedLeakage.map(row => ({
          location: row.location,
          front: row.front,
          back: row.back,
          left: row.left,
          right: row.right,
          top: row.top,
          max: row.max,
          unit: row.unit,
        })),
        workload: {
          value: workload,
          unit: workloadUnit,
        },
        tolerance: {
          value: toleranceValue,
          operator: toleranceOperator,
          time: toleranceTime,
        },
        calculatedResult: {
          maxLeakageIntermediate: maxLeakageResult,
          finalLeakageRate: finalLeakageRate,
          remark: finalRemark,
        },
      };

      let result;
      if (testId) {
        result = await updateTubeHousingLeakageForDentalHandHeld(testId, payload);
      } else {
        result = await addTubeHousingLeakageForDentalHandHeld(serviceId, payload);
        if (result?.data?._id || result?.data?.testId) {
          setTestId(result.data._id || result.data.testId);
        }
      }

      setHasSaved(true);
      setIsEditing(false);
      toast.success(testId ? "Updated successfully" : "Saved successfully");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Save failed");
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
      <h2 className="text-2xl font-bold mb-6">Tube Housing Leakage Radiation Test</h2>

      {/* ==================== Table 1: Distance, kV, mA, Time ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Distance from Focus (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                kV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                mA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time (sec)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.distance}
                  onChange={(e) => updateSettings('distance', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="100"
                />
              </td>
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
                  placeholder="200"
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

      {/* ==================== Workload ==================== */}
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

      {/* ==================== Table 2: 5 Directions + Top ==================== */}
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
                Exposure Level (mGy/h)
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
              {['Front', 'Back', 'Left', 'Right', 'Top'].map((dir) => (
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
                  <input
                    type="text"
                    value={row.location}
                    onChange={(e) => updateLeakage(idx, 'location', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="Tube Housing"
                  />
                </td>
                {(['front', 'back', 'left', 'right', 'top'] as const).map((field) => (
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

      {/* ==================== Max Leakage Calculation ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Max Leakage Calculation</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{workload || '—'}</span>
          <span>×</span>
          <span className="font-medium">
            {Math.max(...processedLeakage.map(r => parseFloat(r.max) || 0)).toFixed(3) || '—'}
          </span>
          <span>÷</span>
          <span className="font-medium">60</span>
          <span>×</span>
          <span className="font-medium">100</span>
          <span>=</span>
          <input
            type="text"
            value={maxLeakageResult}
            readOnly
            className="w-24 px-2 py-1 bg-gray-100 text-sm font-medium text-center rounded"
          />
        </div>
      </div>

      {/* ==================== Final Leakage Rate ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Maximum Radiation Leakage from Tube Housing</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={finalLeakageRate}
            readOnly
            className="w-32 px-3 py-2 bg-gray-100 text-sm font-medium text-center rounded"
          />
          <span className="text-sm text-gray-600">mGy/h</span>
          <span className="text-sm text-gray-500 italic">(Result ÷ 114)</span>
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
