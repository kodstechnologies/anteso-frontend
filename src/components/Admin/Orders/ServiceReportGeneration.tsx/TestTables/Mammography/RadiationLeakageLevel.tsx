'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsRow {
  distance: string;
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

export default function RadiationLeakageLevel({ serviceId, testId: propTestId, onRefresh }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [settings, setSettings] = useState<SettingsRow>({
    distance: '100',
    kv: '120',
    ma: '21',
    time: '2.0',
  });

  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    { location: 'Tube', left: '', right: '', front: '', back: '', top: '', max: '', result: '', unit: 'mR/h', mgy: '' },
    { location: 'Collimator', left: '', right: '', front: '', back: '', top: '', max: '', result: '', unit: 'mR/h', mgy: '' },
  ]);

  const [workload, setWorkload] = useState<string>('500');
  const [toleranceArea, setToleranceArea] = useState<string>('10');
  const [toleranceDimension, setToleranceDimension] = useState<string>('20');
  const [toleranceDistance, setToleranceDistance] = useState<string>('5');
  const [toleranceLimit, setToleranceLimit] = useState<string>('0.02');
  const [toleranceTime, setToleranceTime] = useState<string>('1');

  const [isSaving, setIsSaving] = useState(false);
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
        mgy = (calculatedResult / 114).toFixed(4); // 1 mGy/h ≈ 114 mR/h
      }

      return { ...row, max, result, mgy };
    });
  }, [leakageRows, workload, settings.ma]);

  const tubeResultMR = processedLeakage[0].result ? parseFloat(processedLeakage[0].result) : 0;
  const collimatorResultMR = processedLeakage[1].result ? parseFloat(processedLeakage[1].result) : 0;

  const tubeResultMGy = tubeResultMR > 0 ? (tubeResultMR / 114).toFixed(4) : '—';
  const collimatorResultMGy = collimatorResultMR > 0 ? (collimatorResultMR / 114).toFixed(4) : '—';

  const globalMaxResultMR = Math.max(tubeResultMR, collimatorResultMR);
  const globalMaxResultMGy = globalMaxResultMR > 0 ? (globalMaxResultMR / 114).toFixed(4) : '—';

  const finalRemark = useMemo(() => {
    const result = parseFloat(globalMaxResultMGy || '0') || 0;
    const limit = parseFloat(toleranceLimit) || 0;

    if (!toleranceLimit || globalMaxResultMR === 0) return '';

    return result <= limit ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceLimit, globalMaxResultMR]);

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
      workload.trim() &&
      toleranceLimit.trim() &&
      leakageRows.every(r =>
        r.left.trim() && r.right.trim() && r.front.trim() && r.back.trim() && r.top.trim()
      )
    );
  }, [serviceId, settings, workload, toleranceLimit, leakageRows]);

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    setTimeout(() => {
      toast.success('Radiation Leakage Level saved successfully!');
      setHasSaved(true);
      setIsEditing(false);
      setTestId('mock-test-id-leakage-456');
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
      <h2 className="text-2xl font-bold mb-6">Radiation Leakage Level Test</h2>

      {/* Measurement Settings */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Measurement Settings</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">
                Distance from Focus (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">mA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (sec)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="hover:bg-gray-50">
              {(['distance', 'kv', 'ma', 'time'] as const).map((field) => (
                <td key={field} className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={settings[field]}
                    onChange={(e) => updateSettings(field, e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded text-sm text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
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
          className={`w-48 px-4 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
          placeholder="500"
        />
      </div>

      {/* Leakage Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Leakage Measurement Results (at 5.0 cm from the External Surface of X-Ray Tube)
        </h3>
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
                      className={`w-full text-center border rounded text-xs ${isViewMode ? 'bg-gray-50' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-medium border-r bg-gray-50">{row.max || '—'}</td>
                <td className="px-3 py-3 text-center font-medium border-r bg-blue-50">{row.result || '—'}</td>
                <td className="px-3 py-3 text-center font-medium border-r bg-green-50">{row.mgy || '—'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${finalRemark === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : finalRemark === 'Fail'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                    {finalRemark || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Final Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Max Leakage from Tube</h3>
          <div className="text-2xl font-bold text-blue-700">{tubeResultMR.toFixed(4)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {tubeResultMGy} mGy/h</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-3">Max Leakage from Collimator</h3>
          <div className="text-2xl font-bold text-purple-700">{collimatorResultMR.toFixed(4)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {collimatorResultMGy} mGy/h</div>
        </div>

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

      {/* Tolerance Limit (AERB Standard) */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Tolerance Limit (AERB Safety Code)</h3>
        <div className="text-sm space-y-3 text-amber-800">
          <p>
            The Leakage Radiation averaged over an area of{' '}
            <input
              type="text"
              value={toleranceArea}
              onChange={(e) => setToleranceArea(e.target.value)}
              disabled={isViewMode}
              className="w-16 mx-1 px-2 py-1 text-center border border-amber-400 rounded bg-white font-medium"
            /> cm², with no linear dimension greater than{' '}
            <input
              type="text"
              value={toleranceDimension}
              onChange={(e) => setToleranceDimension(e.target.value)}
              disabled={isViewMode}
              className="w-16 mx-1 px-2 py-1 text-center border border-amber-400 rounded bg-white font-medium"
            /> cm and located at{' '}
            <input
              type="text"
              value={toleranceDistance}
              onChange={(e) => setToleranceDistance(e.target.value)}
              disabled={isViewMode}
              className="w-16 mx-1 px-2 py-1 text-center border border-amber-400 rounded bg-white font-bold"
            /> cm from any point on the external surface of X-Ray Tube housing does not exceed
          </p>
          <p className="font-bold text-lg">
            <input
              type="text"
              value={toleranceLimit}
              onChange={(e) => setToleranceLimit(e.target.value)}
              disabled={isViewMode}
              className="w-24 mx-2 px-3 py-1 text-center border-2 border-amber-500 rounded bg-white font-bold text-amber-900"
            /> mGy in {toleranceTime} hour
          </p>
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
              {buttonText} Radiation Leakage Level
            </>
          )}
        </button>
      </div>
    </div>
  );
}