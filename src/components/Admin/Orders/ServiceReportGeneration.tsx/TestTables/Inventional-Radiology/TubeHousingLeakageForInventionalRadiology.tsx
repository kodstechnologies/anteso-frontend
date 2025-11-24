'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [isLoading, setIsLoading] = useState(false);
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

      if (maxNum > 0 && maValue > 0 && workloadValue > 0) {
        const calculatedResult = (workloadValue * maxNum) / (60 * maValue);
        result = calculatedResult.toFixed(4);
        mgy = (calculatedResult / 114).toFixed(4);
      }

      return { ...row, max, result, mgy };
    });
  }, [leakageRows, workload, settings.ma]);

  // Individual results
  const tubeResultMR = processedLeakage[0].result ? parseFloat(processedLeakage[0].result) : 0;
  const collimatorResultMR = processedLeakage[1].result ? parseFloat(processedLeakage[1].result) : 0;

  const tubeResultMGy = tubeResultMR > 0 ? (tubeResultMR / 114).toFixed(4) : '—';
  const collimatorResultMGy = collimatorResultMR > 0 ? (collimatorResultMR / 114).toFixed(4) : '—';

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

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    setTimeout(() => {
      toast.success('Tube Housing Leakage saved successfully!');
      setHasSaved(true);
      setIsEditing(false);
      setTestId('mock-test-id-123');
      onRefresh?.();
      setIsSaving(false);
    }, 1000);
  };

  const toggleEdit = () => {
    if (!hasSaved) return;
    setIsEditing(true);
  };

  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">Tube Housing Leakage</h2>

      {/* Measurement Settings */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Measurement Settings</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">FCD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">mA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (sec)</th>
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

      {/* Workload */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Workload (mA·min/week)</label>
        <input
          type="text"
          value={workload}
          onChange={(e) => setWorkload(e.target.value)}
          disabled={isViewMode}
          className={`w-48 px-4 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          placeholder="500"
        />
      </div>

      {/* Leakage Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Leakage Measurement Results</h3>
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-3 py-2 border-r">Location</th>
              <th colSpan={5} className="px-3 py-2 text-center border-r">Exposure Level (mR/h)</th>
              <th rowSpan={2} className="px-3 py-2 border-r">Max</th>
              <th rowSpan={2} className="px-3 py-2 border-r">Result (mR/h)</th>
              <th rowSpan={2} className="px-3 py-2 border-r">mGy/h</th>
              <th rowSpan={2} className="px-3 py-2">Remark</th>
            </tr>
            <tr>
              {['Left', 'Right', 'Front', 'Back', 'Top'].map(dir => (
                <th key={dir} className="px-2 py-2 border-r">{dir}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedLeakage.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-3 font-medium border-r">{row.location}</td>
                {(['left', 'right', 'front', 'back', 'top'] as const).map(field => (
                  <td key={field} className="px-1 py-2 border-r">
                    <input
                      type="text"
                      value={leakageRows[idx][field]}
                      onChange={(e) => updateLeakage(idx, field, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full text-center border rounded text-xs ${isViewMode ? 'bg-gray-50' : ''}`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-medium border-r bg-gray-50">{row.max || '—'}</td>
                <td className="px-3 py-3 text-center font-medium border-r bg-blue-50">{row.result || '—'}</td>
                <td className="px-3 py-3 text-center font-medium border-r bg-green-50">{row.mgy || '—'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${finalRemark === 'Pass' ? 'bg-green-100 text-green-800' :
                      finalRemark === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                    }`}>
                    {finalRemark || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Final Results - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tube Leakage */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Max Leakage from Tube</h3>
          <div className="text-2xl font-bold text-blue-700">{tubeResultMR.toFixed(4)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {tubeResultMGy} mGy/h</div>
        </div>

        {/* Collimator Leakage */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-3">Max Leakage from Collimator</h3>
          <div className="text-2xl font-bold text-purple-700">{collimatorResultMR.toFixed(4)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {collimatorResultMGy} mGy/h</div>
        </div>

        {/* Highest Overall */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg rounded-lg p-6 border border-orange-300">
          <h3 className="text-lg font-bold text-orange-900 mb-3">Highest Leakage (Final Result)</h3>
          <div className="text-2xl font-bold text-orange-700">{globalMaxResultMR.toFixed(4)} mR/h</div>
          <div className="text-xl font-semibold text-green-800 mt-2">= {globalMaxResultMGy} mGy/h</div>
          <div className="mt-3 text-2xl font-bold">
            <span className={`px-4 py-2 rounded-full ${finalRemark === 'Pass' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {finalRemark || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Tolerance */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Tolerance Limit</h3>
        <div className="flex items-center gap-3 max-w-lg">
          <input
            type="text"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            className={`w-32 px-4 py-2 border-2 rounded-md text-center font-bold text-lg ${isViewMode ? 'bg-gray-50' : 'border-blue-iality'}`}
            placeholder="1.0000"
          />
          <select
            value={toleranceOperator}
            onChange={(e) => setToleranceOperator(e.target.value as any)}
            disabled={isViewMode}
            className={`px-4 py-2 border rounded-md font-medium ${isViewMode ? 'bg-gray-50' : ''}`}
          >
            <option value="less than or equal to">less than or equal to</option>
            <option value="greater than or equal to">greater than or equal to</option>
            <option value="=">=</option>
          </select>
          <span className="font-medium">mGy/h in {toleranceTime} hour</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
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