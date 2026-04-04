'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
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
  location: string;
  left: string;
  right: string;
  front: string;
  back: string;
  top: string;
}

interface ProcessedRow extends LeakageRow {
  max: string;
  resultMR: string;
  resultMGy: string;
  remark: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  csvData?: any[];
}

export default function TubeHousingLeakageForOArm({ serviceId, testId: propTestId, onRefresh, csvData }: Props) {
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
  const [toleranceValue, setToleranceValue] = useState<string>('1');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime] = useState<string>('1');

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        let data = null;

        // Priority 1: If we already have a testId in state (from create/update), use it
        if (testId) {
          data = await getTubeHousingLeakageByIdForOArm(testId);
        }
        // Priority 2: If parent passed a specific testId via prop
        else if (propTestId) {
          data = await getTubeHousingLeakageByIdForOArm(propTestId);
          if (data) setTestId(data._id); // sync state
        }
        // Priority 3: Fallback to service-wide lookup (may return latest or null)
        else {
          data = await getTubeHousingLeakageByServiceIdForOArm(serviceId);
        }

        if (data) {
          // If we found data, ensure we set the testId so subsequent saves are updates
          if (data._id) setTestId(data._id);

          if (data.settings) {
            // Handle array or object structure for settings (robustness)
            const s = Array.isArray(data.settings) ? data.settings[0] : data.settings;
            setSettings({
              fcd: s.fcd?.toString() || '100',
              kv: s.kv?.toString() || '120',
              ma: s.ma?.toString() || '21',
              time: s.time?.toString() || '2.0',
            });
          }
          if (data.leakageMeasurements && Array.isArray(data.leakageMeasurements)) {
            const sorted = data.leakageMeasurements.sort((a: any, b: any) => (a.location === 'Tube' ? -1 : b.location === 'Tube' ? 1 : 0));
            setLeakageRows(sorted.map((m: any) => ({
              location: m.location || 'Tube',
              left: m.left?.toString() || '',
              right: m.right?.toString() || '',
              front: m.front?.toString() || '',
              back: m.back?.toString() || '',
              top: m.top?.toString() || '',
            })));
          } else if (data.leakageRows && Array.isArray(data.leakageRows)) {
            const sorted = data.leakageRows.sort((a: any, b: any) => (a.location === 'Tube' ? -1 : b.location === 'Tube' ? 1 : 0));
            setLeakageRows(sorted.map((m: any) => ({
              location: m.location || 'Tube',
              left: m.left?.toString() || '',
              right: m.right?.toString() || '',
              front: m.front?.toString() || '',
              back: m.back?.toString() || '',
              top: m.top?.toString() || '',
            })));
          }

          setWorkload(data.workload?.toString() || '');
          setToleranceValue(data.toleranceValue?.toString() || '1.0');
          setToleranceOperator(data.toleranceOperator || 'less than or equal to');
          setHasSaved(true);
          setIsEditing(false);
        } else {
          // No data found -> New Mode
          setTestId(null);
          setHasSaved(false);
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load tube housing leakage data');
          console.error("Load error:", err);
        }
        // On error (e.g. 404), assume new form
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, propTestId, testId]);

  // Process CSV data
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;
    console.log('TubeHousingLeakage: Processing CSV data', csvData);
    try {
      const rowMap: { [idx: number]: any } = {};
      csvData.forEach((item: any) => {
        const idx = item['Row Index'];
        if (!rowMap[idx]) rowMap[idx] = {};
        rowMap[idx][item['Field Name']] = item['Value'];
      });

      // Extract settings from first row
      const firstRow = rowMap[1] || {};
      if (firstRow['Settings_FCD'] || firstRow['Settings_KV'] || firstRow['Settings_MA'] || firstRow['Settings_Time']) {
        setSettings({
          fcd: firstRow['Settings_FCD'] || '100',
          kv: firstRow['Settings_KV'] || '120',
          ma: firstRow['Settings_MA'] || '21',
          time: firstRow['Settings_Time'] || '2.0',
        });
      }
      if (firstRow['Workload']) setWorkload(firstRow['Workload']);

      // Extract leakage rows
      const newLeakageRows: LeakageRow[] = [];
      Object.keys(rowMap).forEach(idxStr => {
        const r = rowMap[parseInt(idxStr)];
        if (r['Leakage_Location']) {
          newLeakageRows.push({
            location: r['Leakage_Location'] === 'Collimator' ? 'Collimator' : 'Tube',
            left: r['Leakage_Left'] || '',
            right: r['Leakage_Right'] || '',
            front: r['Leakage_Front'] || '',
            back: r['Leakage_Back'] || '',
            top: r['Leakage_Top'] || '',
          });
        }
      });

      if (newLeakageRows.length > 0) {
        setLeakageRows(newLeakageRows);
      }

      setHasSaved(false);
      setIsEditing(true);
      toast.success('Tube Housing Leakage: CSV data loaded');
    } catch (err) {
      console.error('TubeHousingLeakage CSV processing error:', err);
    }
  }, [csvData]);

  const maValue = parseFloat(settings.ma) || 0;
  const workloadValue = parseFloat(workload) || 0;

  // Same formula as RadiographyFixed: (workload × max) / (60 × mA) → mR/h; mGy = mR/114
  const processedLeakage: ProcessedRow[] = useMemo(() => {
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
        resultMR = leakageMR.toFixed(3);
        const mgyVal = leakageMR / 114;
        resultMGy = mgyVal.toFixed(4);
        const tol = parseFloat(toleranceValue) || 0;
        if (tol > 0) {
          if (toleranceOperator === 'less than or equal to') remark = mgyVal <= tol ? 'Pass' : 'Fail';
          else if (toleranceOperator === 'greater than or equal to') remark = mgyVal >= tol ? 'Pass' : 'Fail';
          else if (toleranceOperator === '=') remark = Math.abs(mgyVal - tol) < 0.01 ? 'Pass' : 'Fail';
        }
      }
      return { ...row, max: maxStr, resultMR, resultMGy, remark };
    });
  }, [leakageRows, workload, maValue, workloadValue, toleranceValue, toleranceOperator]);

  const maxExposureLevel = (processedLeakage.length > 0 ? Math.max(0, ...processedLeakage.map(row => parseFloat(row.max) || 0)) : 0).toFixed(2);
  const calculatedMaxLeakage = maxExposureLevel && maValue > 0 && workloadValue > 0
    ? ((workloadValue * parseFloat(maxExposureLevel)) / (60 * maValue)).toFixed(3)
    : '—';
  const allCalculatedMR = processedLeakage.map(r => parseFloat(r.resultMR) || 0);
  const highestLeakageMR = allCalculatedMR.length > 0 ? Math.max(...allCalculatedMR) : 0;
  const highestLeakageMGy = highestLeakageMR > 0 ? (highestLeakageMR / 114).toFixed(4) : '—';

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

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
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
      leakageRows.length > 0 &&
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
        settings: [settings], // Save as array often safer for backend consistency
        leakageMeasurements: processedLeakage.map(row => ({
          location: row.location,
          left: row.left,
          right: row.right,
          front: row.front,
          back: row.back,
          top: row.top,
          max: row.max,
          unit: 'mGy/h',
          remark: row.remark,
        })),
        workload,
        toleranceValue,
        toleranceOperator,
        maxLeakageResult: highestLeakageMGy,
        maxRadiationLeakage: highestLeakageMGy,
        finalRemark: finalRemark,
        toleranceTime,
      };

      let result;
      // Use locally scoped variable to avoid closure staleness, though we use current testId from state
      let currentTestId = testId;

      if (currentTestId) {
        result = await updateTubeHousingLeakageForOArm(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        result = await createTubeHousingLeakageForOArm(serviceId, payload);
        const newId = result?.data?._id || result?.data?.testId || result?._id;
        if (newId) {
          setTestId(newId);
          currentTestId = newId;
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  border-r">FDD (cm)</th>
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

      {/* Leakage Table — same structure as RadiographyFixed: Location, Left/Right/Front/Back/Top, Result (mR in one hour), Remarks */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-semibold bg-gray-50 border-b">Exposure Level (mR/hr) at 1.0 m from the Focus</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm divide-y divide-gray-200">
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
            <tbody className="divide-y divide-gray-200">
              {processedLeakage.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-2 border rounded text-sm font-medium bg-gray-50">{row.location}</span>
                      {!isViewMode && row.location !== 'Tube' && (
                        <button type="button" onClick={() => removeLeakageRow(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Remove row">
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
        </div>
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

      {/* Work Load and Max Leakage Calculation — same formula as RadiographyFixed */}
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

      {/* Summary of Maximum Radiation Leakage — same as RadiographyFixed */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Summary of Maximum Radiation Leakage</h3>
        <div className="space-y-3">
          {processedLeakage.map((row, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-700 w-64">Maximum Radiation Leakage from {row.location}:</span>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">
                  Formula: ({workload || '—'} mAmin in 1 hr × {row.max || '—'} max Exposure Level (mR/hr)) / (60 × {maValue || '—'} mA used for measurement)
                </div>
                <span className={`px-4 py-2 border-2 rounded-md font-semibold ${row.resultMGy ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50'}`}>
                  {row.resultMGy ? `${row.resultMGy} mGy in one hour` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall result and final Pass/Fail */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Overall</h3>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Highest Leakage:</span>
          <span className="px-4 py-2 border-2 rounded-md font-bold">{highestLeakageMGy} mGy/h</span>
          <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${finalRemark === 'Pass' ? 'bg-green-600 text-white' : finalRemark === 'Fail' ? 'bg-red-600 text-white' : 'bg-gray-400 text-white'}`}>
            {finalRemark || '—'}
          </span>
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
