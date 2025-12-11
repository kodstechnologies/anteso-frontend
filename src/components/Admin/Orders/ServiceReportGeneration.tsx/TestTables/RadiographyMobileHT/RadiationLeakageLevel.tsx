'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addRadiationLeakageLevelForRadiographyMobileHT,
  getRadiationLeakageLevelByServiceIdForRadiographyMobileHT,
  updateRadiationLeakageLevelForRadiographyMobileHT,
} from '../../../../../../api';

interface SettingsRow {
  fcd: string;
  kv: string;
  ma: string;
  time: string;
}

interface LeakageRow {
  location: string;
  left: string;
  right: string;
  front: string;
  back: string;
  top: string;
  max: string;
  result: string;
  unit: string;
  mgy: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

export default function TubeHousingLeakage({ serviceId, testId: propTestId, onRefresh }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [settings, setSettings] = useState<SettingsRow>({
    fcd: '100',
    kv: '120',
    ma: '21',
    time: '2.0',
  });

  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    { location: 'Tube', left: '', right: '', front: '', back: '', top: '', max: '', result: '', unit: 'mR/h', mgy: '' },
    { location: 'Collimator', left: '', right: '', front: '', back: '', top: '', max: '', result: '', unit: 'mR/h', mgy: '' },
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [toleranceValue, setToleranceValue] = useState<string>('');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime, setToleranceTime] = useState<string>('1');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const maValue = parseFloat(settings.ma) || 0;
  const workloadValue = parseFloat(workload) || 0;

  // Process each row: calculate max, result (mR/h), mGy/h
  const processedLeakage = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.left, row.right, row.front, row.back, row.top]
        .map(v => parseFloat(v) || 0)
        .filter(v => v > 0);

      const max = values.length > 0 ? Math.max(...values).toFixed(2) : '';
      const maxNum = parseFloat(max) || 0;

      let result = '';
      let mgy = '';
      let remark = '';

      if (maxNum > 0 && maValue > 0 && workloadValue > 0) {
        const calculatedResult = (workloadValue * maxNum) / (60 * maValue);
        result = calculatedResult.toFixed(3);
        const mgyValue = calculatedResult / 114;
        mgy = mgyValue.toFixed(4);
        
        // Calculate Pass/Fail for this row
        const tol = parseFloat(toleranceValue) || 0;
        if (tol > 0) {
          let pass = false;
          if (toleranceOperator === 'less than or equal to') pass = mgyValue <= tol;
          if (toleranceOperator === 'greater than or equal to') pass = mgyValue >= tol;
          if (toleranceOperator === '=') pass = Math.abs(mgyValue - tol) < 0.01;
          remark = pass ? 'Pass' : 'Fail';
        }
      }

      return { ...row, max, result, mgy, remark };
    });
  }, [leakageRows, workload, settings.ma, toleranceValue, toleranceOperator]);

  // Individual results
  const tubeResultMR = processedLeakage[0].result ? parseFloat(processedLeakage[0].result) : 0;
  const collimatorResultMR = processedLeakage[1].result ? parseFloat(processedLeakage[1].result) : 0;

  const tubeResultMGy = tubeResultMR > 0 ? (tubeResultMR / 114).toFixed(4) : '—';
  const collimatorResultMGy = collimatorResultMR > 0 ? (collimatorResultMR / 114).toFixed(4) : '—';

  // Get max exposure level for calculation display
  const maxExposureLevel = Math.max(
    ...processedLeakage.map(row => parseFloat(row.max) || 0)
  ).toFixed(2);

  // Calculated max leakage (highlighted value)
  const calculatedMaxLeakage = maxExposureLevel && maValue > 0 && workloadValue > 0
    ? ((workloadValue * parseFloat(maxExposureLevel)) / (60 * maValue)).toFixed(3)
    : '—';

  // Global highest leakage (for final Pass/Fail)
  const globalMaxResultMR = Math.max(tubeResultMR, collimatorResultMR);
  const globalMaxResultMGy = globalMaxResultMR > 0 ? (globalMaxResultMR / 114).toFixed(4) : '—';

  // Final Pass/Fail
  const finalRemark = useMemo(() => {
    const result = parseFloat(globalMaxResultMGy || '0') || 0;
    const tol = parseFloat(toleranceValue) || 0;

    if (!toleranceValue || globalMaxResultMR === 0) return '';

    let pass = false;
    if (toleranceOperator === 'less than or equal to') pass = result <= tol;
    if (toleranceOperator === 'greater than or equal to') pass = result >= tol;
    if (toleranceOperator === '=') pass = Math.abs(result - tol) < 0.01;

    return pass ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceValue, toleranceOperator, globalMaxResultMR]);

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
      settings.fcd.trim() &&
      settings.kv.trim() &&
      settings.ma.trim() &&
      settings.time.trim() &&
      workload.trim() &&
      toleranceValue.trim() &&
      leakageRows.every(r =>
        r.left.trim() && r.right.trim() && r.front.trim() && r.back.trim() && r.top.trim()
      )
    );
  }, [serviceId, settings, workload, toleranceValue, leakageRows]);

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getRadiationLeakageLevelByServiceIdForRadiographyMobileHT(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          if (data.fcd) setSettings({ fcd: data.fcd, kv: data.kv || '', ma: data.ma || '', time: data.time || '' });
          if (data.workload) setWorkload(data.workload);
          if (data.toleranceValue) setToleranceValue(data.toleranceValue);
          if (data.toleranceOperator) setToleranceOperator(data.toleranceOperator);
          if (data.toleranceTime) setToleranceTime(data.toleranceTime);
          if (Array.isArray(data.leakageMeasurements) && data.leakageMeasurements.length > 0) {
            setLeakageRows(data.leakageMeasurements.map((m: any) => ({
              location: m.location || '',
              left: String(m.left ?? ''),
              right: String(m.right ?? ''),
              front: String(m.front ?? ''),
              back: String(m.back ?? ''),
              top: String(m.top ?? ''),
              max: String(m.max ?? ''),
              result: String(m.result ?? ''),
              unit: m.unit || 'mR/h',
              mgy: String(m.mgy ?? ''),
            })));
          }
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load Tube Housing Leakage data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const handleSave = async () => {
    console.log('handleSave called', { isFormValid, serviceId, testId });

    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fcd: settings.fcd,
        kv: settings.kv,
        ma: settings.ma,
        time: settings.time,
        workload,
        leakageMeasurements: processedLeakage.map(row => ({
          location: row.location,
          left: parseFloat(row.left) || 0,
          right: parseFloat(row.right) || 0,
          front: parseFloat(row.front) || 0,
          back: parseFloat(row.back) || 0,
          top: parseFloat(row.top) || 0,
          max: row.max,
          result: row.result,
          unit: row.unit,
          mgy: row.mgy,
        })),
        toleranceValue,
        toleranceOperator,
        toleranceTime,
        remark: finalRemark,
      };

      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getRadiationLeakageLevelByServiceIdForRadiographyMobileHT(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        // Update existing
        result = await updateRadiationLeakageLevelForRadiographyMobileHT(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        // Create new
        result = await addRadiationLeakageLevelForRadiographyMobileHT(serviceId, payload);
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
      <h2 className="text-2xl font-bold mb-6">Radiation Leakage Level</h2>

      {/* Test Conditions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Test Conditions</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">FDD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">mA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (Sec)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="hover:bg-gray-50">
              {(['fcd', 'kv', 'ma', 'time'] as const).map((field) => (
                <td key={field} className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={settings[field]}
                    onChange={(e) => updateSettings(field, e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded text-sm text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Exposure Level Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Exposure Level (mR/hr) at 1.0 m from the Focus</h3>
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 border-r font-medium">Location</th>
              <th colSpan={5} className="px-4 py-3 text-center border-r font-medium">Exposure Level (mR/hr)</th>
              <th rowSpan={2} className="px-4 py-3 border-r font-medium">Result (mR in one hour)</th>
              <th rowSpan={2} className="px-4 py-3 font-medium">Remarks</th>
            </tr>
            <tr>
              {['Left', 'Right', 'Front', 'Back', 'Top'].map(dir => (
                <th key={dir} className="px-2 py-2 border-r font-medium">{dir}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedLeakage.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium border-r">{row.location}</td>
                {(['left', 'right', 'front', 'back', 'top'] as const).map(field => (
                  <td key={field} className="px-2 py-2 border-r">
                    <input
                      type="text"
                      value={leakageRows[idx][field]}
                      onChange={(e) => updateLeakage(idx, field, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full text-center border rounded text-xs ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-medium border-r bg-gray-50">{row.result || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    row.remark === 'Pass' ? 'bg-green-100 text-green-800' :
                    row.remark === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                  }`}>
                    {row.remark || '—'}
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
              placeholder="180"
            />
            <span className="text-sm text-gray-600">mAmin in one hr</span>
          </div>
          <div className="flex items-start gap-3">
            <label className="text-sm font-medium text-gray-700 w-48">Max Leakage =</label>
            <div className="flex-1">
              <div className="text-sm text-gray-700 mb-2">
                ({workload || '—'} mAmin in 1 hr × {maxExposureLevel || '—'} max Exposure Level (mR/hr)) / (60 × {maValue || '—'} mA used for measurement)
              </div>
              <div className="mt-2">
                <span className="text-sm font-medium text-gray-700">Calculated Max Leakage:</span>
                <span className={`ml-3 px-4 py-2 border-2 rounded-md font-bold text-lg ${
                  calculatedMaxLeakage !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'
                }`}>
                  {calculatedMaxLeakage} mR in one hour
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary of Maximum Radiation Leakage */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Summary of Maximum Radiation Leakage</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 w-64">Maximum Radiation Leakage from Tube Housing:</span>
            <span className="px-4 py-2 bg-gray-50 border rounded-md font-semibold">
              {tubeResultMGy !== '—' ? `${tubeResultMGy} mGy` : '—'} in one hour
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 w-64">Maximum Radiation Leakage from Tube Collimator:</span>
            <span className="px-4 py-2 bg-gray-50 border rounded-md font-semibold">
              {collimatorResultMGy !== '—' ? `${collimatorResultMGy} mGy` : '—'} in one hour
            </span>
          </div>
        </div>
      </div>

      {/* Tolerance */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Tolerance</h3>
        <div className="text-sm text-gray-700">
          <p>
            <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{' '}
            <select
              value={toleranceOperator}
              onChange={(e) => setToleranceOperator(e.target.value as any)}
              disabled={isViewMode}
              className={`px-2 py-1 border rounded text-sm font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="less than or equal to">&lt;</option>
              <option value="greater than or equal to">&gt;</option>
              <option value="=">=</option>
            </select>
            {' '}
            <input
              type="text"
              value={toleranceValue}
              onChange={(e) => setToleranceValue(e.target.value)}
              disabled={isViewMode}
              className={`w-24 px-2 py-1 border rounded text-sm text-center font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="1"
            />
            {' '}mGy ({parseFloat(toleranceValue || '1') * 114} mR) in one hour.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
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
          className={`flex items-center gap-3 px-8 py-3 text-white font-medium rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-5 h-5" />
              {buttonText} Tube Housing Leakage
            </>
          )}
        </button>
      </div>
    </div>
  );
}
