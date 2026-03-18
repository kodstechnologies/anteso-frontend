'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTubeHousingLeakageByServiceIdCArm,
  createTubeHousingLeakageForCArm,
  updateTubeHousingLeakageForCArm,
  getTubeHousingLeakageByIdCArm,
} from "../../../../../../api";

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
  refreshKey?: number;
  initialData?: any[];
}

export default function TubeHousingLeakage({ serviceId, testId: propTestId, onRefresh, refreshKey, initialData }: Props) {
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
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [toleranceValue, setToleranceValue] = useState<string>('1.0');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime] = useState<string>('1');

  // Handle CSV initial data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      try {
        const s: SettingsRow = { fcd: "100", kv: "120", ma: "21", time: "2.0" };
        const rows: LeakageRow[] = [
          { location: 'Tube', left: '', right: '', front: '', back: '', top: '' },
        ];
        let w = "";
        let tVal = "1.0";
        let tOp: any = "less than or equal to";

        initialData.forEach(row => {
          const field = row['Field Name'];
          const val = row['Value'];
          const rowIndex = row['Row Index'];

          if (field === 'Leakage_FCD') s.fcd = val;
          if (field === 'Leakage_kV') s.kv = val;
          if (field === 'Leakage_mA') s.ma = val;
          if (field === 'Leakage_Time') s.time = val;
          if (field === 'Leakage_Workload') w = val;
          if (field === 'Leakage_ToleranceValue') tVal = val;
          if (field === 'Leakage_ToleranceOperator') tOp = val;

          if (field.startsWith('Leakage_')) {
            const loc = field.includes('Tube') ? 0 : field.includes('Collimator') ? 1 : -1;
            if (loc !== -1) {
              while (rows.length <= loc) {
                rows.push({ location: loc === 0 ? 'Tube' : 'Collimator', left: '', right: '', front: '', back: '', top: '' });
              }
              const subField = field.split('_')[1].toLowerCase() as keyof Omit<LeakageRow, 'location'>;
              if (['left', 'right', 'front', 'back', 'top'].includes(subField)) {
                rows[loc][subField] = val;
              }
            }
          }
        });

        setSettings(s);
        setLeakageRows(rows);
        setWorkload(w);
        setToleranceValue(tVal);
        setToleranceOperator(tOp);
        setHasSaved(false);
        setIsEditing(true);
      } catch (err) {
        console.error("Error mapping CSV data for Tube Housing Leakage:", err);
      }
    }
  }, [initialData, refreshKey]);

  const maValue = parseFloat(settings.ma) || 0;
  const workloadValue = parseFloat(workload) || 0;

  // Correct Formula: Leakage (mR in one hour) = (Workload × Max_Reading) / (60 × mA) — same as RadiographyFixed
  const processedLeakage: (ProcessedRow & { remark: string })[] = useMemo(() => {
    const tol = parseFloat(toleranceValue) || 0;
    return leakageRows.map((row) => {
      const values = [row.left, row.right, row.front, row.back, row.top]
        .map(v => parseFloat(v) || 0)
        .filter(v => v > 0);

      const maxReading = values.length > 0 ? Math.max(...values) : 0;
      const maxStr = maxReading > 0 ? maxReading.toFixed(2) : '';

      let resultMR = '';
      let resultMGy = '';
      let remark = '';

      if (maxReading > 0 && maValue > 0 && workloadValue > 0) {
        const leakageMR = (workloadValue * maxReading) / (60 * maValue);
        resultMR = leakageMR.toFixed(2);
        resultMGy = (leakageMR / 114).toFixed(3);
        if (tol > 0) {
          const mgyVal = parseFloat(resultMGy) || 0;
          if (toleranceOperator === 'less than or equal to') remark = mgyVal <= tol ? 'Pass' : 'Fail';
          else if (toleranceOperator === 'greater than or equal to') remark = mgyVal >= tol ? 'Pass' : 'Fail';
          else if (toleranceOperator === '=') remark = Math.abs(mgyVal - tol) < 0.01 ? 'Pass' : 'Fail';
        }
      }

      return {
        ...row,
        max: maxStr,
        resultMR,
        resultMGy,
        remark,
      };
    });
  }, [leakageRows, workload, maValue, workloadValue, toleranceValue, toleranceOperator]);

  // Extract final results
  const tubeLeakageMR = processedLeakage[0]?.resultMR ? parseFloat(processedLeakage[0].resultMR) : 0;
  const collimatorLeakageMR = processedLeakage[1]?.resultMR ? parseFloat(processedLeakage[1].resultMR) : 0;
  const maxExposureLevel = processedLeakage.length > 0
    ? Math.max(...processedLeakage.map(r => parseFloat(r.max) || 0)).toFixed(2)
    : '';
  const calculatedMaxLeakage = maxExposureLevel && maValue > 0 && workloadValue > 0
    ? ((workloadValue * parseFloat(maxExposureLevel)) / (60 * maValue)).toFixed(3)
    : '—';

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

  const addLeakageRow = () => {
    if (leakageRows.some(row => row.location === 'Collimator')) {
      toast.error('Collimator can only be added once');
      return;
    }
    setLeakageRows(prev => [...prev, { location: 'Collimator', left: '', right: '', front: '', back: '', top: '' }]);
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
      workload.trim() &&
      toleranceValue.trim() &&
      leakageRows.every(row =>
        row.left.trim() && row.right.trim() && row.front.trim() && row.back.trim() && row.top.trim()
      )
    );
  }, [serviceId, settings, workload, toleranceValue, leakageRows]);

  // Load data on mount
  // Load data on mount or when serviceId/propTestId changes
  useEffect(() => {
    const loadData = async () => {
      if (!serviceId || (initialData && initialData.length > 0)) {
        if (initialData && initialData.length > 0) {
          setHasSaved(false);
          setIsEditing(true);
        }
        setIsLoading(false);
        return;
      }
      try {
        let data = null;

        // Priority 1: If we already have a testId in state (from create/update), use it
        if (testId) {
          data = await getTubeHousingLeakageByIdCArm(testId);
        }
        // Priority 2: If parent passed a specific testId via prop
        else if (propTestId) {
          data = await getTubeHousingLeakageByIdCArm(propTestId);
          if (data) setTestId(data._id); // sync state
        }
        // Priority 3: Fallback to service-wide lookup (may return latest or null)
        else {
          data = await getTubeHousingLeakageByServiceIdCArm(serviceId);
        }

        if (data && data._id) {
          const id = data._id;
          setTestId(id);

          // Populate settings
          const s = Array.isArray(data.settings) ? data.settings[0] : data.settings || {};
          setSettings({
            fcd: s.fcd?.toString() || '100',
            kv: s.kv?.toString() || s.kvp?.toString() || '120',
            ma: s.ma?.toString() || '21',
            time: s.time?.toString() || '2.0',
          });

          setWorkload(data.workload?.toString() || '');
          setToleranceValue(data.toleranceValue?.toString() || '1.0');
          setToleranceOperator(data.toleranceOperator || 'less than or equal to');

          if (data.leakageMeasurements && Array.isArray(data.leakageMeasurements)) {
            setLeakageRows(
              data.leakageMeasurements.map((m: any) => ({
                location: m.location,
                left: m.left?.toString() || '',
                right: m.right?.toString() || '',
                front: m.front?.toString() || '',
                back: m.back?.toString() || '',
                top: m.top?.toString() || '',
              }))
            );
          }

          setHasSaved(true);
          setIsEditing(false);
        } else {
          // No existing data → new form
          setHasSaved(false);
          setIsEditing(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [serviceId, propTestId, testId]); // Add testId to dependencies!

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      settings: [settings],
      workload,
      toleranceValue,
      toleranceOperator,
      toleranceTime,
      leakageMeasurements: leakageRows.map(row => ({
        location: row.location,
        left: row.left,
        right: row.right,
        front: row.front,
        back: row.back,
        top: row.top,
      })),
      maxLeakageResult: highestLeakageMGy !== '—' ? highestLeakageMGy : '',
      finalRemark: finalRemark,
    };

    setIsSaving(true);
    try {
      let newTestId = testId;

      if (testId) {
        await updateTubeHousingLeakageForCArm(testId, payload);
        toast.success('Tube Housing Leakage test updated successfully!');
      } else {
        const res = await createTubeHousingLeakageForCArm(serviceId, payload);
        // Extract testId properly
        newTestId = res.data?._id || res.data?.testId || res._id;
        if (newTestId) {
          setTestId(newTestId);
        }
        toast.success('Tube Housing Leakage test saved successfully!');
      }

      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.(); // This will now reload using the correct testId
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save test');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (hasSaved) setIsEditing(true);
  };

  const isViewMode = hasSaved && !isEditing;
  const isViewOnly = hasSaved && !isEditing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tube Housing Leakage Test</h2>

      {/* Measurement Settings */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-semibold bg-gray-50 border-b">Measurement Settings</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  border-r">FCD (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  border-r">kV</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  border-r">mA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 ">Time (sec)</th>
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

      {/* Exposure Level Table — same structure as RadiographyFixed */}
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
                <td className="px-4 py-3 border-r">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 border rounded text-sm font-medium bg-gray-50">
                      {row.location}
                    </span>
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
                {(['left', 'right', 'front', 'back', 'top'] as const).map(field => {
                  const isFailed = row.remark === 'Fail';
                  const hasValue = leakageRows[idx][field] !== '' && !isNaN(parseFloat(leakageRows[idx][field]));
                  return (
                    <td key={field} className={`px-2 py-2 border-r ${isFailed && hasValue ? 'bg-red-100' : ''}`}>
                      <input
                        type="text"
                        value={leakageRows[idx][field]}
                        onChange={e => updateLeakage(idx, field, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full text-center border rounded text-xs ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : isFailed && hasValue ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="0.00"
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center font-medium border-r bg-gray-50">{row.resultMR || '—'}</td>
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
              onClick={addLeakageRow}
              disabled={leakageRows.some(row => row.location === 'Collimator')}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${leakageRows.some(row => row.location === 'Collimator') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-4 h-4" />
              Add Collimator
            </button>
          </div>
        )}
      </div>

      {/* Work Load and Max Leakage Calculation — same as RadiographyFixed */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Work Load and Max Leakage Calculation</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-48">Work Load:</label>
            <input
              type="text"
              value={workload}
              onChange={e => setWorkload(e.target.value)}
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
          {processedLeakage.map((row, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-700 w-64">
                Maximum Radiation Leakage from {row.location}:
              </span>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">
                  Formula: ({workload || '—'} mAmin in 1 hr × {row.max || '—'} max Exposure Level (mR/hr)) / (60 × {maValue || '—'} mA used for measurement)
                </div>
                <span className={`px-4 py-2 border-2 rounded-md font-semibold ${row.resultMGy ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50'}`}>
                  {row.resultMGy ? `${row.resultMGy} mGy` : '—'} in one hour
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tolerance — same wording as RadiographyFixed */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Tolerance</h3>
        <div className="text-sm text-gray-700">
          <p>
            <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{' '}
            <select
              value={toleranceOperator}
              onChange={e => setToleranceOperator(e.target.value as any)}
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
              onChange={e => setToleranceValue(e.target.value)}
              disabled={isViewMode}
              className={`w-24 px-2 py-1 border rounded text-sm text-center font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="1"
            />
            {' '}mGy ({parseFloat(toleranceValue || '1') * 114} mR) in one hour.
          </p>
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