'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addTubeHousingLeakageForDentalHandHeld,
  getTubeHousingLeakageByServiceIdForDentalHandHeld,
  updateTubeHousingLeakageForDentalHandHeld,
} from "../../../../../../api";

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
  remark: string;
}

interface TubeHousingLeakageProps {
  serviceId: string;
  testId?: string | null;
  onRefresh?: () => void;
  onTestSaved?: (testId: string) => void;
  csvData?: any[];
}

export default function TubeHousingLeakage({
  serviceId,
  testId: propTestId,
  onRefresh,
  onTestSaved,
  csvData
}: TubeHousingLeakageProps) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [settings, setSettings] = useState<SettingsRow>({
    fcd: '100',
    kv: '120',
    ma: '21',
    time: '2.0',
  });

  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    {
      location: 'Tube',
      left: '',
      right: '',
      front: '',
      back: '',
      top: '',
      max: '',
      result: '',
      unit: 'mR/h',
      remark: '',
    },
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [toleranceValue, setToleranceValue] = useState<string>('1');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime, setToleranceTime] = useState<string>('1');

  const maValue = parseFloat(settings.ma) || 0;
  const workloadValue = parseFloat(workload) || 0;

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Process each row: max from 5 directions, then result (mR/h) = (workload * max) / (60 * mA), mGy = result/114, per-row remark
  const processedLeakage = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.left, row.right, row.front, row.back, row.top]
        .map((v) => parseFloat(v) || 0)
        .filter((v) => v > 0);
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

  // Per-row calculated results for summary (mR and mGy)
  const calculatedResults = useMemo(() => {
    return processedLeakage.map((row) => {
      const maxValue = parseFloat(row.max) || 0;
      let calculatedMR = '';
      let calculatedMGy = '—';
      if (maxValue > 0 && maValue > 0 && workloadValue > 0) {
        const resultMR = (workloadValue * maxValue) / (60 * maValue);
        calculatedMR = resultMR.toFixed(3);
        calculatedMGy = (resultMR / 114).toFixed(4);
      }
      return { location: row.location, max: row.max, calculatedMR, calculatedMGy };
    });
  }, [processedLeakage, maValue, workloadValue]);

  const maxExposureLevel = processedLeakage.length > 0
    ? Math.max(...processedLeakage.map((r) => parseFloat(r.max) || 0)).toFixed(2)
    : '';

  const calculatedMaxLeakage = maxExposureLevel && maValue > 0 && workloadValue > 0
    ? ((workloadValue * parseFloat(maxExposureLevel)) / (60 * maValue)).toFixed(3)
    : '—';

  const allCalculatedMR = calculatedResults.map((r) => parseFloat(r.calculatedMR) || 0);
  const globalMaxResultMR = allCalculatedMR.length > 0 ? Math.max(...allCalculatedMR) : 0;
  const globalMaxResultMGy = globalMaxResultMR > 0 ? (globalMaxResultMR / 114).toFixed(4) : '—';

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

  const addCollimatorRow = () => {
    const hasCollimator = leakageRows.some(row => row.location === 'Collimator');
    if (hasCollimator) {
      toast.error('Collimator can only be added once');
      return;
    }
    setLeakageRows(prev => [...prev, {
      location: 'Collimator',
      left: '',
      right: '',
      front: '',
      back: '',
      top: '',
      max: '',
      result: '',
      unit: 'mR/h',
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
      settings.fcd.trim() &&
      settings.kv.trim() &&
      settings.ma.trim() &&
      settings.time.trim() &&
      leakageRows.every(r =>
        r.left.trim() && r.right.trim() && r.front.trim() && r.back.trim() && r.top.trim()
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

          // Map measurementSettings (backend) to settings (frontend); backend uses distance, we use fcd
          if (testData.measurementSettings) {
            setSettings({
              fcd: testData.measurementSettings.distance ?? testData.measurementSettings.fcd ?? '100',
              kv: testData.measurementSettings.kv || '',
              ma: testData.measurementSettings.ma || '',
              time: testData.measurementSettings.time || '',
            });
          }

          // Map leakageMeasurements (backend) to leakageRows (frontend); Tube first, then Collimator
          if (testData.leakageMeasurements && testData.leakageMeasurements.length > 0) {
            const sorted = [...testData.leakageMeasurements].sort((a: any, b: any) => {
              if ((a.location || '').toLowerCase().includes('tube')) return -1;
              if ((b.location || '').toLowerCase().includes('tube')) return 1;
              return 0;
            });
            setLeakageRows(sorted.map((row: any) => ({
              location: row.location === 'Tube Housing' ? 'Tube' : (row.location || 'Tube'),
              left: row.left || '',
              right: row.right || '',
              front: row.front || '',
              back: row.back || '',
              top: row.top || '',
              max: row.max || '',
              result: row.result || '',
              unit: row.unit || 'mR/h',
              remark: row.remark || '',
            })));
          }

          if (testData.workload?.value) setWorkload(testData.workload.value);
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

  // === CSV Injection ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const fcdVal = csvData.find(r => r['Field Name'] === 'FCD' || r['Field Name'] === 'Distance')?.['Value'];
      const kvVal = csvData.find(r => r['Field Name'] === 'kV')?.['Value'];
      const maVal = csvData.find(r => r['Field Name'] === 'mA')?.['Value'];
      const timeVal = csvData.find(r => r['Field Name'] === 'Time')?.['Value'];
      if (fcdVal || kvVal || maVal || timeVal) {
        setSettings(prev => ({
          fcd: fcdVal || prev.fcd,
          kv: kvVal || prev.kv,
          ma: maVal || prev.ma,
          time: timeVal || prev.time
        }));
      }
      const workloadVal = csvData.find(r => r['Field Name'] === 'Workload')?.['Value'];
      if (workloadVal) setWorkload(workloadVal);

      const tubeRowIdx = csvData.find(r => (r['Field Name'] === 'Location' && (r['Value'] === 'Tube' || r['Value'] === 'Tube Housing')))?.['Row Index'];
      if (tubeRowIdx !== undefined) {
        const rowData = csvData.filter(r => r['Row Index'] === tubeRowIdx);
        const left = rowData.find(r => r['Field Name'] === 'Left')?.['Value'] || '';
        const right = rowData.find(r => r['Field Name'] === 'Right')?.['Value'] || '';
        const front = rowData.find(r => r['Field Name'] === 'Front')?.['Value'] || '';
        const back = rowData.find(r => r['Field Name'] === 'Back')?.['Value'] || '';
        const top = rowData.find(r => r['Field Name'] === 'Top')?.['Value'] || '';
        setLeakageRows([{
          location: 'Tube',
          left, right, front, back, top,
          max: '', result: '', unit: 'mR/h', remark: ''
        }]);
      }
      if (!testId) setIsEditing(true);
    }
  }, [csvData, testId]);

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
      const payload = {
        measurementSettings: {
          distance: settings.fcd,
          kv: settings.kv,
          ma: settings.ma,
          time: settings.time,
        },
        leakageMeasurements: processedLeakage.map(row => ({
          location: row.location,
          left: row.left,
          right: row.right,
          front: row.front,
          back: row.back,
          top: row.top,
          max: row.max,
          unit: row.unit,
        })),
        workload: { value: workload, unit: 'mAmin in one hr' },
        tolerance: {
          value: toleranceValue,
          operator: toleranceOperator,
          time: toleranceTime,
        },
        calculatedResult: {
          maxLeakageIntermediate: calculatedMaxLeakage,
          finalLeakageRate: globalMaxResultMGy,
          remark: finalRemark,
        },
      };

      let result;
      if (testId) {
        result = await updateTubeHousingLeakageForDentalHandHeld(testId, payload);
      } else {
        result = await addTubeHousingLeakageForDentalHandHeld(serviceId, payload);
        const newId = result?.data?._id || result?.data?.testId;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
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

      {/* Test Conditions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Test Conditions</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  border-r">FD  D (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  border-r">mA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 ">Time (Sec)</th>
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
              {['Left', 'Right', 'Front', 'Back', 'Top'].map((dir) => (
                <th key={dir} className="px-2 py-2 border-r font-medium">{dir}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedLeakage.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-r">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 border rounded text-sm font-medium bg-gray-50">{row.location}</span>
                    {!isViewMode && row.location !== 'Tube' && (
                      <button
                        type="button"
                        onClick={() => removeLeakageRow(idx)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
                {(['left', 'right', 'front', 'back', 'top'] as const).map((field) => {
                  const isFailed = row.remark === 'Fail';
                  const hasValue = leakageRows[idx][field] !== '' && !isNaN(parseFloat(leakageRows[idx][field]));
                  return (
                    <td key={field} className={`px-2 py-2 border-r ${isFailed && hasValue ? 'bg-red-100' : ''}`}>
                      <input
                        type="text"
                        value={leakageRows[idx][field]}
                        onChange={(e) => updateLeakage(idx, field, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full text-center border rounded text-xs ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : isFailed && hasValue ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="0.00"
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center font-medium border-r bg-gray-50">{row.result || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${row.remark === 'Pass' ? 'bg-green-100 text-green-800' : row.remark === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                    {row.remark || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isViewMode && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button
              type="button"
              onClick={addCollimatorRow}
              disabled={leakageRows.some(row => row.location === 'Collimator')}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${leakageRows.some(row => row.location === 'Collimator') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-4 h-4" />
              Add Collimator
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
                <span className={`ml-3 px-4 py-2 border-2 rounded-md font-bold text-lg ${calculatedMaxLeakage !== '—' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'}`}>
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
          {calculatedResults.map((result, idx) => {
            const row = processedLeakage[idx];
            const maxValue = row.max || '—';
            return (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-700 w-64">
                  Maximum Radiation Leakage from {result.location}:
                </span>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-2">
                    Formula: ({workload || '—'} mAmin in 1 hr × {maxValue} max Exposure Level (mR/hr)) / (60 × {maValue || '—'} mA used for measurement)
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
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
          className={`flex items-center gap-3 px-8 py-3 text-white font-medium rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid) ? 'bg-gray-400 cursor-not-allowed' : isViewMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
