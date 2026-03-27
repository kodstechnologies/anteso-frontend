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

  const [settings, setSettings] = useState<SettingsRow>({ fcd: '100', kv: '', ma: '', time: '' });
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
      mgy: '',
      remark: '',
    },
  ]);

  const [workload, setWorkload] = useState<string>('');
  const [workloadUnit, setWorkloadUnit] = useState<string>('mA·min/week');
  const [toleranceValue, setToleranceValue] = useState<string>('1');
  const [toleranceOperator, setToleranceOperator] = useState<'less than or equal to' | 'greater than or equal to' | '='>('less than or equal to');
  const [toleranceTime, setToleranceTime] = useState<string>('1');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const maValue = parseFloat(settings.ma) || 0;
  const workloadValue = parseFloat(workload) || 0;

  // Process each row: max from left, right, front, back, top; result (mR/h), mGy, per-row remark (RadiographyFixed structure)
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
        mgy = (calculatedResult / 114).toFixed(4);
        const tol = parseFloat(toleranceValue) || 0;
        if (tol > 0) {
          const mgyVal = calculatedResult / 114;
          let pass = false;
          if (toleranceOperator === 'less than or equal to') pass = mgyVal <= tol;
          if (toleranceOperator === 'greater than or equal to') pass = mgyVal >= tol;
          if (toleranceOperator === '=') pass = Math.abs(mgyVal - tol) < 0.01;
          remark = pass ? 'Pass' : 'Fail';
        }
      }

      return { ...row, max, result, mgy, remark };
    });
  }, [leakageRows, workload, settings.ma, toleranceValue, toleranceOperator]);

  const globalMaxResultMGy = processedLeakage.reduce((acc, row) => {
    const mgy = parseFloat(row.mgy || '0') || 0;
    return mgy > acc ? mgy : acc;
  }, 0);
  const finalRemark = useMemo(() => {
    const result = globalMaxResultMGy;
    const tol = parseFloat(toleranceValue) || 0;
    if (!toleranceValue || result === 0) return '';
    let pass = false;
    if (toleranceOperator === 'less than or equal to') pass = result <= tol;
    if (toleranceOperator === 'greater than or equal to') pass = result >= tol;
    if (toleranceOperator === '=') pass = Math.abs(result - tol) < 0.01;
    return pass ? 'Pass' : 'Fail';
  }, [globalMaxResultMGy, toleranceValue, toleranceOperator]);

  // === CSV Data Injection ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const fcd = csvData.find(r => r['Field Name'] === 'Table1_FCD' || r['Field Name'] === 'Table1_fcd')?.['Value'];
      const kv = csvData.find(r => r['Field Name'] === 'Table1_kvp')?.['Value'];
      const ma = csvData.find(r => r['Field Name'] === 'Table1_ma')?.['Value'];
      const time = csvData.find(r => r['Field Name'] === 'Table1_Time')?.['Value'];
      if (fcd || kv || ma || time) {
        setSettings(prev => ({
          ...prev,
          fcd: fcd || prev.fcd,
          kv: kv || prev.kv,
          ma: ma || prev.ma,
          time: time || prev.time
        }));
      }

      const rowIndices = [...new Set(csvData
        .filter(r => r['Field Name']?.startsWith('Table2_'))
        .map(r => parseInt(r['Row Index']))
        .filter(i => !isNaN(i) && i > 0)
      )];
      if (rowIndices.length > 0) {
        const newRows = rowIndices.map(idx => {
          const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
          return {
            location: rowData.find(r => r['Field Name'] === 'Table2_Area' || r['Field Name'] === 'Table2_Location')?.['Value'] || 'Tube',
            left: rowData.find(r => r['Field Name'] === 'Table2_Left')?.['Value'] || '',
            right: rowData.find(r => r['Field Name'] === 'Table2_Right')?.['Value'] || '',
            front: rowData.find(r => r['Field Name'] === 'Table2_Front')?.['Value'] || '',
            back: rowData.find(r => r['Field Name'] === 'Table2_Back')?.['Value'] || '',
            top: rowData.find(r => r['Field Name'] === 'Table2_Top')?.['Value'] || '',
            max: '',
            result: '',
            unit: 'mR/h',
            mgy: '',
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

  const updateSettings = (field: keyof SettingsRow, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
    setLeakageRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addLeakageRow = () => {
    if (leakageRows.some(r => r.location === 'Collimator')) return;
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
      mgy: '',
      remark: '',
    }]);
  };

  const removeLeakageRow = (index: number) => {
    if (index === 0 || leakageRows[index].location === 'Tube') return;
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
      leakageRows.every(r =>
        r.left.trim() && r.right.trim() && r.front.trim() && r.back.trim() && r.top.trim()
      )
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
          rec = await getRadiationLeakageByServiceId(serviceId, tubeId ?? null);
        }

        if (rec) {
          setTestId(rec._id || propTestId);

          if (rec.fcd !== undefined || rec.kv !== undefined || rec.ma !== undefined || rec.time !== undefined) {
            setSettings({
              fcd: String(rec.fcd ?? '100'),
              kv: String(rec.kv ?? rec.measurementSettings?.[0]?.kv ?? ''),
              ma: String(rec.ma ?? rec.measurementSettings?.[0]?.ma ?? ''),
              time: String(rec.time ?? rec.measurementSettings?.[0]?.time ?? ''),
            });
          }

          if (Array.isArray(rec.leakageMeasurements) && rec.leakageMeasurements.length > 0) {
            setLeakageRows(
              rec.leakageMeasurements.map((r: any) => ({
                location: r.location || 'Tube',
                left: String(r.left ?? ''),
                right: String(r.right ?? ''),
                front: String(r.front ?? ''),
                back: String(r.back ?? ''),
                top: String(r.top ?? ''),
                max: String(r.max ?? ''),
                result: String(r.result ?? ''),
                unit: r.unit || 'mR/h',
                mgy: String(r.mgy ?? ''),
                remark: r.remark || '',
              }))
            );
          }

          setWorkload(rec.workload || '');
          setWorkloadUnit(rec.workloadUnit || 'mA·min/week');
          setToleranceValue(rec.toleranceValue ?? rec.tolerance ?? '');
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
  }, [serviceId, propTestId, tubeId]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

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
      tubeId: tubeId === null ? 'null' : tubeId,
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

      {/* Test Conditions (RadiographyFixed structure) */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">Test Conditions</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  border-r">FFD (cm)</th>
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
                    placeholder={field === 'fcd' ? '100' : field === 'kv' ? '120' : field === 'ma' ? '21' : '2.0'}
                  />
                </td>
              ))}
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

      {/* Exposure Level Table (RadiographyFixed structure) */}
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
                    <span className="px-3 py-2 border rounded text-sm font-medium bg-gray-50">{row.location}</span>
                    {!isViewMode && row.location !== 'Tube' && (
                      <button type="button" onClick={() => removeLeakageRow(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Remove row">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
                {(['left', 'right', 'front', 'back', 'top'] as const).map(field => (
                  <td key={field} className={`px-2 py-2 border-r ${row.remark === 'Fail' ? 'bg-red-50' : ''}`}>
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
              onClick={addLeakageRow}
              disabled={leakageRows.some(row => row.location === 'Collimator')}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${leakageRows.some(row => row.location === 'Collimator') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-4 h-4" /> Add Collimator
            </button>
          </div>
        )}
      </div>

      {/* Workload and Tolerance */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Workload</label>
        <div className="flex items-center gap-2 max-w-md mb-4">
          <input
            type="text"
            value={workload}
            onChange={(e) => setWorkload(e.target.value)}
            disabled={isViewMode}
            className={`w-32 px-3 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="500"
          />
          <input
            type="text"
            value={workloadUnit}
            onChange={(e) => setWorkloadUnit(e.target.value)}
            disabled={isViewMode}
            className={`w-40 px-3 py-2 border rounded-md text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="mA·min/week"
          />
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tolerance (mGy/h)</label>
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