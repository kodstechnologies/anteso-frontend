'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addRadiationLeakageLevelForMammography,
  getRadiationLeakageLevelByServiceIdForMammography,
  updateRadiationLeakageLevelForMammography,
} from '../../../../../../api';

interface SettingsRow {
  distance: string;
  kv: string;
  ma: string;
  time: string;
}

interface Measurement {
  direction: string;
  value: string;
}

interface LeakageLocation {
  location: 'Tube' | 'Collimator';
  measurements: Measurement[];
  max: string;
  resultMR: string;
  resultMGy: string;
}

interface SavedData {
  _id?: string;
  distanceFromFocus: string;
  kv: string;
  ma: string;
  time: string;
  workload: string;
  leakageLocations: LeakageLocation[];
  highestLeakageMR: string;
  highestLeakageMGy: string;
  finalRemark: string;
  toleranceArea: string;
  toleranceDimension: string;
  toleranceDistance: string;
  toleranceLimit: string;
  toleranceTime: string;
}
interface LeakageRow {
  location: 'Tube' | 'Collimator';
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

export default function RadiationLeakageLevel({ serviceId, onRefresh }: Props) {
  const [testId, setTestId] = useState<string | null>(null);

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
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

  const tubeResultMR = processedLeakage[0].result ? parseFloat(processedLeakage[0].result) : 0;
  const collimatorResultMR = processedLeakage[1].result ? parseFloat(processedLeakage[1].result) : 0;

  const globalMaxResultMR = Math.max(tubeResultMR, collimatorResultMR);
  const globalMaxResultMGy = globalMaxResultMR > 0 ? (globalMaxResultMR / 114).toFixed(4) : '';

  const finalRemark = useMemo(() => {
    const result = parseFloat(globalMaxResultMGy || '0') || 0;
    const limit = parseFloat(toleranceLimit) || 0;
    if (!toleranceLimit || globalMaxResultMR === 0) return '';
    return result <= limit ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceLimit]);

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      try {
        const data: SavedData | null = await getRadiationLeakageLevelByServiceIdForMammography(serviceId);
        if (data) {
          setSettings({
            distance: data.distanceFromFocus || '100',
            kv: data.kv || '120',
            ma: data.ma || '21',
            time: data.time || '2.0',
          });
          setWorkload(data.workload || '500');

          // Map measurements
          const tube = data.leakageLocations.find(l => l.location === 'Tube');
          const collimator = data.leakageLocations.find(l => l.location === 'Collimator');

          const mapMeasurements = (loc: LeakageLocation | undefined) => {
            if (!loc) return { left: '', right: '', front: '', back: '', top: '' };
            const map = { left: '', right: '', front: '', back: '', top: '' };
            loc.measurements.forEach(m => {
              if (m.direction.toLowerCase() in map) {
                (map as any)[m.direction.toLowerCase()] = m.value;
              }
            });
            return map;
          };

          setLeakageRows([
            { location: 'Tube', ...mapMeasurements(tube), max: tube?.max || '', result: tube?.resultMR || '', unit: 'mR/h', mgy: tube?.resultMGy || '' },
            { location: 'Collimator', ...mapMeasurements(collimator), max: collimator?.max || '', result: collimator?.resultMR || '', unit: 'mR/h', mgy: collimator?.resultMGy || '' },
          ]);

          setToleranceArea(data.toleranceArea || '10');
          setToleranceDimension(data.toleranceDimension || '20');
          setToleranceDistance(data.toleranceDistance || '5');
          setToleranceLimit(data.toleranceLimit || '0.02');
          setToleranceTime(data.toleranceTime || '1');

          setTestId(data._id || null);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const handleSave = async () => {
    if (!serviceId) return;
    setIsSaving(true);

    const payload = {
      distanceFromFocus: settings.distance,
      kv: settings.kv,
      ma: settings.ma,
      time: settings.time,
      workload,
      leakageLocations: leakageRows.map(row => ({
        location: row.location,
        measurements: [
          { direction: 'Left', value: row.left },
          { direction: 'Right', value: row.right },
          { direction: 'Front', value: row.front },
          { direction: 'Back', value: row.back },
          { direction: 'Top', value: row.top },
        ].filter(m => m.value.trim() !== ''),
        max: processedLeakage.find(r => r.location === row.location)?.max || '',
        resultMR: processedLeakage.find(r => r.location === row.location)?.result || '',
        resultMGy: processedLeakage.find(r => r.location === row.location)?.mgy || '',
      })),
      highestLeakageMR: globalMaxResultMR.toFixed(4),
      highestLeakageMGy: globalMaxResultMGy,
      finalRemark,
      toleranceArea,
      toleranceDimension,
      toleranceDistance,
      toleranceLimit,
      toleranceTime,
    };

    try {
      if (testId) {
        await updateRadiationLeakageLevelForMammography(testId, payload);
        toast.success('Updated successfully!');
      } else {
        const res = await addRadiationLeakageLevelForMammography(serviceId, payload);
        setTestId(res.data._id || res.data.testId);
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);
  const isViewMode = hasSaved && !isEditing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <span className="ml-4 text-lg">Loading Radiation Leakage Level Test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Radiation Leakage Level Test</h2>
        <div className="flex items-center gap-4">
          {isSaving && <span className="text-sm text-gray-500">Saving...</span>}
          {isViewMode && (
            <button onClick={toggleEdit} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
          {!isViewMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {hasSaved ? 'Update' : 'Save'} Test
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rest of your beautiful UI stays exactly the same */}
      {/* ... (Measurement Settings, Workload, Table, Final Results, Tolerance) ... */}
      {/* Just paste your existing JSX below this line — it works perfectly */}

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
                    onChange={(e) => setSettings(prev => ({ ...prev, [field]: e.target.value }))}
                    readOnly={isViewMode}
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
          readOnly={isViewMode}
          className={`w-48 px-4 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
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
                      onChange={(e) => setLeakageRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: e.target.value } : r))}
                      readOnly={isViewMode}
                      className={`w-full text-center border rounded text-xs ${isViewMode ? 'bg-gray-50' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-medium border-r bg-gray-50">{row.max || '—'}</td>
                <td className="px-3 py-3 text-center font-medium border-r bg-blue-50">{row.result || '—'}</td>
                <td className="px-3 py-3 text-center font-medium border-r bg-green-50">{row.mgy || '—'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${finalRemark === 'Pass' ? 'bg-green-100 text-green-800' : finalRemark === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
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
          <div className="text-xl font-semibold text-green-700 mt-2">= {tubeResultMR > 0 ? (tubeResultMR / 114).toFixed(4) : '—'} mGy/h</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-3">Max Leakage from Collimator</h3>
          <div className="text-2xl font-bold text-purple-700">{collimatorResultMR.toFixed(4)} mR/h</div>
          <div className="text-xl font-semibold text-green-700 mt-2">= {collimatorResultMR > 0 ? (collimatorResultMR / 114).toFixed(4) : '—'} mGy/h</div>
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

      {/* Tolerance Limit */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Tolerance Limit (AERB Safety Code)</h3>
        <div className="text-sm space-y-3 text-amber-800">
          <p>
            The Leakage Radiation averaged over an area of{' '}
            <input type="text" value={toleranceArea} onChange={e => setToleranceArea(e.target.value)} readOnly={isViewMode} className="w-16 mx-1 px-2 py-1 text-center border border-amber-400 rounded bg-white font-medium" /> cm²,
            with no linear dimension greater than{' '}
            <input type="text" value={toleranceDimension} onChange={e => setToleranceDimension(e.target.value)} readOnly={isViewMode} className="w-16 mx-1 px-2 py-1 text-center border border-amber-400 rounded bg-white font-medium" /> cm
            and located at{' '}
            <input type="text" value={toleranceDistance} onChange={e => setToleranceDistance(e.target.value)} readOnly={isViewMode} className="w-16 mx-1 px-2 py-1 text-center border border-amber-400 rounded bg-white font-bold" /> cm
            from any point on the external surface of X-Ray Tube housing does not exceed
          </p>
          <p className="font-bold text-lg">
            <input type="text" value={toleranceLimit} onChange={e => setToleranceLimit(e.target.value)} readOnly={isViewMode} className="w-24 mx-2 px-3 py-1 text-center border-2 border-amber-500 rounded bg-white font-bold text-amber-900" /> mGy in {toleranceTime} hour
          </p>
        </div>
      </div>
    </div>
  );
}