'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createTubeHousingLeakageForOArm,
  getTubeHousingLeakageByIdForOArm,
  getTubeHousingLeakageByServiceIdForOArm,
  updateTubeHousingLeakageForOArm,
} from '../../../../../../api';

interface SettingsRow {
  fcd: string;
  kv: string;
  ma: string;
  time: string;
}

interface LeakageRow {
  location: 'Tube' | 'Collimator';
  left: string;
  right: string;
  front: string;
  back: string;
  top: string;
}

interface ProcessedRow extends LeakageRow {
  max: string;
  resultMR: string;   // mR/h → 2 decimal places
  resultMGy: string;  // mGy/h → 3 decimal places
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

export default function TubeHousingLeakageForOArm({ serviceId, testId: propTestId, onRefresh }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<SettingsRow>({
    fcd: '100',
    kv: '120',
    ma: '21',
    time: '2.0',
  });

  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    { location: 'Tube', left: '', right: '', front: '', back: '', top: '' },
    { location: 'Collimator', left: '', right: '', front: '', back: '', top: '' },
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [toleranceValue, setToleranceValue] = useState<string>('1.0');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime] = useState<string>('1');

  // Load data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        let data = null;
        if (propTestId) {
          data = await getTubeHousingLeakageByIdForOArm(propTestId);
        } else {
          data = await getTubeHousingLeakageByServiceIdForOArm(serviceId);
        }

        if (data) {
          setTestId(data._id || null);
          if (data.settings) {
            setSettings({
              fcd: data.settings.fcd || '100',
              kv: data.settings.kv || '120',
              ma: data.settings.ma || '21',
              time: data.settings.time || '2.0',
            });
          }
          if (data.leakageRows && Array.isArray(data.leakageRows)) {
            setLeakageRows(data.leakageRows);
          }
          setWorkload(data.workload || '');
          setToleranceValue(data.toleranceValue || '1.0');
          setToleranceOperator(data.toleranceOperator || 'less than or equal to');
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load tube housing leakage data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, propTestId]);

  const maValue = parseFloat(settings.ma) || 0;
  const workloadValue = parseFloat(workload) || 0;

  // Correct Formula: Leakage (mR/h) = (Workload × Max_Reading) / (60 × mA)
  const processedLeakage: ProcessedRow[] = useMemo(() => {
    return leakageRows.map((row) => {
      const values = [row.left, row.right, row.front, row.back, row.top]
        .map(v => parseFloat(v) || 0)
        .filter(v => v > 0);

      const maxReading = values.length > 0 ? Math.max(...values) : 0;
      const maxStr = maxReading > 0 ? maxReading.toFixed(2) : '';

      let resultMR = '';
      let resultMGy = '';

      if (maxReading > 0 && maValue > 0 && workloadValue > 0) {
        const leakageMR = (workloadValue * maxReading) / (60 * maValue);
        resultMR = leakageMR.toFixed(2);        // 2 decimal places (e.g., 3.08)
        resultMGy = (leakageMR / 114).toFixed(3); // 3 decimal places (e.g., 0.027)
      }

      return {
        ...row,
        max: maxStr,
        resultMR,
        resultMGy,
      };
    });
  }, [leakageRows, workload, maValue, workloadValue]);

  // Extract final results
  const tubeLeakageMR = processedLeakage[0].resultMR ? parseFloat(processedLeakage[0].resultMR) : 0;
  const collimatorLeakageMR = processedLeakage[1].resultMR ? parseFloat(processedLeakage[1].resultMR) : 0;

  const highestLeakageMR = Math.max(tubeLeakageMR, collimatorLeakageMR);
  const highestLeakageMGy = highestLeakageMR > 0 ? (highestLeakageMR / 114).toFixed(3) : '—';

  // Final Pass/Fail
  const finalRemark = useMemo(() => {
    if (!toleranceValue || highestLeakageMR === 0) return '';
    const result = parseFloat(highestLeakageMGy || '0') || 0;
    const limit = parseFloat(toleranceValue) || 0;

    if (toleranceOperator === 'less than or equal to') return result <= limit ? 'Pass' : 'Fail';
    if (toleranceOperator === 'greater than or equal to') return result >= limit ? 'Pass' : 'Fail';
    if (toleranceOperator === '=') return Math.abs(result - limit) < 0.01 ? 'Pass' : 'Fail';
    return '';
  }, [highestLeakageMGy, toleranceValue, toleranceOperator, highestLeakageMR]);

  const updateSettings = (field: keyof SettingsRow, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof Omit<LeakageRow, 'location'>, value: string) => {
    setLeakageRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
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
      leakageRows.every(row =>
        row.left.trim() && row.right.trim() && row.front.trim() && row.back.trim() && row.top.trim()
      )
    );
  }, [serviceId, settings, workload, toleranceValue, leakageRows]);

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        settings,
        leakageRows,
        workload,
        toleranceValue,
        toleranceOperator,
        toleranceTime,
      };

      let result;
      let currentTestId = testId;

      if (!currentTestId) {
        try {
          const existing = await getTubeHousingLeakageByServiceIdForOArm(serviceId);
          if (existing?._id) {
            currentTestId = existing._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        result = await updateTubeHousingLeakageForOArm(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        result = await createTubeHousingLeakageForOArm(serviceId, payload);
        const newId = result?.data?._id || result?._id;
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
    if (hasSaved) setIsEditing(true);
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tube Housing Leakage Test</h2>

      {/* Measurement Settings */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-semibold bg-gray-50 border-b">Measurement Settings</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">FCD (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">kV</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">mA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (sec)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              {(['fcd', 'kv', 'ma', 'time'] as const).map(field => (
                <td key={field} className="px-6 py-4 border-r">
                  <input
                    type="text"
                    value={settings[field]}
                    onChange={e => updateSettings(field, e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 text-center border rounded-md text-sm font-medium ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Workload */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Workload (mA·min/week)</label>
        <input
          type="text"
          value={workload}
          onChange={e => setWorkload(e.target.value)}
          disabled={isViewMode}
          placeholder="e.g. 500"
          className={`w-64 px-4 py-3 border rounded-lg text-lg font-medium ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
        />
      </div>

      {/* Leakage Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-semibold bg-gray-50 border-b">Leakage Measurements (mR/h)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left font-medium border-r">Location</th>
                <th colSpan={5} className="px-4 py-3 text-center border-r">Measured Values</th>
                <th rowSpan={2} className="px-4 py-3 font-medium border-r bg-gray-200">Max</th>
                <th rowSpan={2} className="px-4 py-3 font-medium border-r bg-blue-100">Leakage (mR/h)</th>
                <th rowSpan={2} className="px-4 py-3 font-medium bg-green-100">Leakage (mGy/h)</th>
              </tr>
              <tr>
                {['Left', 'Right', 'Front', 'Back', 'Top'].map(dir => (
                  <th key={dir} className="px-3 py-2 border-r font-medium">{dir}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedLeakage.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-semibold border-r">{row.location}</td>
                  {(['left', 'right', 'front', 'back', 'top'] as const).map(field => (
                    <td key={field} className="px-2 py-3 border-r">
                      <input
                        type="text"
                        value={leakageRows[idx][field]}
                        onChange={e => updateLeakage(idx, field, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full text-center px-2 py-1 border rounded text-sm font-medium ${isViewMode ? 'bg-gray-100' : 'border-gray-300 focus:border-blue-500'
                          }`}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center font-bold border-r bg-gray-100">{row.max || '—'}</td>
                  <td className="px-4 py-4 text-center font-bold border-r bg-blue-50">{row.resultMR || '—'}</td>
                  <td className="px-4 py-4 text-center font-bold bg-green-50">{row.resultMGy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Tube Leakage</h3>
          <div className="text-3xl font-bold text-blue-700">{tubeLeakageMR.toFixed(2)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {(tubeLeakageMR / 114).toFixed(3)} mGy/h</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-3">Collimator Leakage</h3>
          <div className="text-3xl font-bold text-purple-700">{collimatorLeakageMR.toFixed(2)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {(collimatorLeakageMR / 114).toFixed(3)} mGy/h</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-300">
          <h3 className="text-lg font-bold text-orange-900 mb-3">Highest Leakage</h3>
          <div className="text-3xl font-bold text-orange-700">{highestLeakageMR.toFixed(2)} mR/h</div>
          <div className="text-2xl font-bold text-green-800 mt-2">= {highestLeakageMGy} mGy/h</div>
          <div className="mt-6 text-center">
            <span className={`inline-block px-8 py-4 rounded-full text-2xl font-bold ${finalRemark === 'Pass' ? 'bg-green-600 text-white' :
              finalRemark === 'Fail' ? 'bg-red-600 text-white' :
                'bg-gray-400 text-white'
              }`}>
              {finalRemark || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Acceptance Criteria</h3>
        <div className="flex flex-wrap items-center gap-4 text-lg">
          <span className="font-medium">Leakage should be</span>
          <select
            value={toleranceOperator}
            onChange={e => setToleranceOperator(e.target.value as any)}
            disabled={isViewMode}
            className={`px-4 py-2 border rounded-lg font-medium ${isViewMode ? 'bg-gray-100' : ''}`}
          >
            <option value="less than or equal to">less than or equal to</option>
            <option value="greater than or equal to">greater than or equal to</option>
            <option value="=">equal to</option>
          </select>
          <input
            type="text"
            value={toleranceValue}
            onChange={e => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            className={`w-32 px-4 py-3 text-center text-2xl font-bold border-2 rounded-lg ${isViewMode ? 'bg-gray-100' : 'border-blue-500'
              }`}
            placeholder="1.000"
          />
          <span className="font-medium">mGy/h in {toleranceTime} hour</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mt-10">
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
          className={`flex items-center gap-3 px-10 py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-teal-600 hover:bg-teal-700'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-6 h-6" />
              {buttonText} Test
            </>
          )}
        </button>
      </div>
    </div>
  );
}
