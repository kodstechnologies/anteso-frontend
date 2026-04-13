'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addAccuracyOfIrradiationTimeForOArm,
  getAccuracyOfIrradiationTimeByServiceIdForOArm,
  updateAccuracyOfIrradiationTimeForOArm,
} from '../../../../../../api';

interface Table2Row {
  id: string;
  setTime: string;
  measuredTime: string;
}

interface Props {
  serviceId: string;
  csvData?: any[];
  onRefresh?: () => void;
}

// Map display tolerance operator to symbol (e.g. "less than or equal to" -> "<=")
function normalizeToleranceOperator(val: string): string {
  const v = (val || '').trim().toLowerCase();
  if (v === 'less than or equal to' || v === '<=') return '<=';
  if (v === 'greater than or equal to' || v === '>=') return '>=';
  if (v === 'less than' || v === '<') return '<';
  if (v === 'greater than' || v === '>') return '>';
  return '<=';
}

export default function AccuracyOfIrradiationTimeOArm({ serviceId, csvData, onRefresh }: Props) {
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [table1Row, setTable1Row] = useState({ fcd: '', kv: '', ma: '' });
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([{ id: '1', setTime: '', measuredTime: '' }]);
  const [toleranceOperator, setToleranceOperator] = useState('<=');
  const [toleranceValue, setToleranceValue] = useState('10');

  // Load saved data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getAccuracyOfIrradiationTimeByServiceIdForOArm(serviceId);
        const d = res?.data ?? res;
        if (d && (d._id || d.testConditions || d.irradiationTimes)) {
          setTestId(d._id || null);
          if (d.testConditions) {
            setTable1Row({
              fcd: String(d.testConditions.fcd ?? ''),
              kv: String(d.testConditions.kv ?? ''),
              ma: String(d.testConditions.ma ?? ''),
            });
          }
          if (Array.isArray(d.irradiationTimes) && d.irradiationTimes.length > 0) {
            setTable2Rows(
              d.irradiationTimes.map((t: any, i: number) => ({
                id: String(i + 1),
                setTime: String(t.setTime ?? ''),
                measuredTime: String(t.measuredTime ?? ''),
              }))
            );
          }
          if (d.tolerance) {
            setToleranceOperator(d.tolerance.operator || '<=');
            setToleranceValue(String(d.tolerance.value ?? '10'));
          }
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          toast.error('Failed to load Accuracy of Irradiation Time');
        }
        setIsSaved(false);
        setIsEditing(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId]);

  // Build state from CSV rows when CSV is provided (pre-fill / override)
  useEffect(() => {
    if (!Array.isArray(csvData) || csvData.length === 0) return;
    const cond: any = {};
    const rowMap: Record<number, { setTime?: string; measuredTime?: string }> = {};
    let tolVal = '';
    let tolOp = '';
    csvData.forEach((row: any) => {
      const key = row['Field Name'];
      const val = (row['Value'] ?? '').toString().trim();
      const idx = parseInt(row['Row Index'], 10) || 0;
      if (key === 'Table1_fcd') cond.fcd = val;
      else if (key === 'Table1_kv') cond.kv = val;
      else if (key === 'Table1_ma') cond.ma = val;
      else if (key === 'Table2_setTime') {
        if (!rowMap[idx]) rowMap[idx] = {};
        rowMap[idx].setTime = val;
      } else if (key === 'Table2_measuredTime') {
        if (!rowMap[idx]) rowMap[idx] = {};
        rowMap[idx].measuredTime = val;
      } else if (key === 'Tolerance_Value') tolVal = val;
      else if (key === 'Tolerance_Operator') tolOp = val;
    });
    if (Object.keys(cond).length > 0) setTable1Row(prev => ({ ...prev, ...cond }));
    const indices = Object.keys(rowMap).map(Number).sort((a, b) => a - b);
    if (indices.length > 0) {
      setTable2Rows(
        indices.map((idx, i) => ({
          id: String(i + 1),
          setTime: rowMap[idx].setTime ?? '',
          measuredTime: rowMap[idx].measuredTime ?? '',
        }))
      );
    }
    if (tolVal !== '') setToleranceValue(tolVal);
    if (tolOp !== '') setToleranceOperator(normalizeToleranceOperator(tolOp));
    setIsSaved(false);
    setIsEditing(true);
  }, [csvData]);

  const calcError = (set: string, meas: string): string => {
    const s = parseFloat(set);
    const m = parseFloat(meas);
    if (isNaN(s) || isNaN(m) || s === 0) return '-';
    return (Math.abs((m - s) / s) * 100).toFixed(2);
  };

  const getRemark = (errorPct: string): 'PASS' | 'FAIL' | '-' => {
    if (!toleranceValue || errorPct === '-') return '-';
    const err = parseFloat(errorPct);
    const tol = parseFloat(toleranceValue);
    if (isNaN(err) || isNaN(tol)) return '-';
    switch (toleranceOperator) {
      case '>': return err > tol ? 'PASS' : 'FAIL';
      case '<': return err < tol ? 'PASS' : 'FAIL';
      case '>=': return err >= tol ? 'PASS' : 'FAIL';
      case '<=': return err <= tol ? 'PASS' : 'FAIL';
      default: return '-';
    }
  };

  const addTable2Row = () => {
    setTable2Rows(prev => [...prev, { id: Date.now().toString(), setTime: '', measuredTime: '' }]);
  };

  const deleteTable2Row = (id: string) => {
    if (table2Rows.length > 1) setTable2Rows(prev => prev.filter(r => r.id !== id));
  };

  const updateTable2 = (id: string, field: keyof Table2Row, value: string) => {
    setTable2Rows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!serviceId) return;
    setSaving(true);
    try {
      const payload = {
        testConditions: { fcd: table1Row.fcd, kv: table1Row.kv, ma: table1Row.ma },
        irradiationTimes: table2Rows.map(r => ({ setTime: r.setTime, measuredTime: r.measuredTime })),
        tolerance: { operator: toleranceOperator, value: toleranceValue },
      };
      if (testId) {
        await updateAccuracyOfIrradiationTimeForOArm(testId, payload);
        toast.success('Updated successfully!');
      } else {
        const res = await addAccuracyOfIrradiationTimeForOArm(serviceId, payload);
        const newId = res?.data?._id ?? res?._id;
        if (newId) setTestId(newId);
        toast.success('Saved successfully!');
      }
      setIsSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isViewMode = isSaved && !isEditing;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Test Conditions */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">1. Test Conditions</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider">FDD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider">kV</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider">mA</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="px-4 py-3">
                <input type="text" value={table1Row.fcd} onChange={e => { setTable1Row(p => ({ ...p, fcd: e.target.value })); setIsSaved(false); }} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="100" />
              </td>
              <td className="px-4 py-3">
                <input type="text" value={table1Row.kv} onChange={e => { setTable1Row(p => ({ ...p, kv: e.target.value })); setIsSaved(false); }} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="80" />
              </td>
              <td className="px-4 py-3">
                <input type="text" value={table1Row.ma} onChange={e => { setTable1Row(p => ({ ...p, ma: e.target.value })); setIsSaved(false); }} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="100" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Accuracy Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">2. Accuracy of Irradiation Time</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 tracking-wider">Set Time (sec)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 tracking-wider">Measured Time (sec)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 tracking-wider">% Error</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 tracking-wider">Remarks</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table2Rows.map(row => {
              const error = calcError(row.setTime, row.measuredTime);
              const remark = getRemark(error);
              const isFail = remark === 'FAIL' && row.measuredTime.trim() !== '';
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="number" step="0.1" value={row.setTime} onChange={e => updateTable2(row.id, 'setTime', e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
                  </td>
                  <td className={isFail ? 'bg-red-100' : ''}>
                    <input type="number" step="0.1" value={row.measuredTime} onChange={e => updateTable2(row.id, 'measuredTime', e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border rounded text-sm ${isFail ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
                  </td>
                  <td className={`px-4 py-3 text-center font-medium ${isFail ? 'bg-red-100 text-red-800' : ''}`}>{error}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${remark === 'PASS' ? 'bg-green-100 text-green-800' : remark === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                      {remark || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {table2Rows.length > 1 && !isViewMode && (
                      <button type="button" onClick={() => deleteTable2Row(row.id)} className="text-red-600 hover:text-red-800">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-300 flex justify-start">
          {!isViewMode && (
            <button type="button" onClick={addTable2Row} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <PlusIcon className="h-4 w-4" /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Tolerance Setting — same as RadiographyFixed */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
        <h4 className="text-sm font-semibold text-indigo-900 mb-2">Tolerance Setting</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-indigo-800">Error should be</span>
          <select value={toleranceOperator} onChange={e => { setToleranceOperator(e.target.value); setIsSaved(false); }} disabled={isViewMode} className={`px-3 py-1 border border-indigo-300 rounded bg-white text-indigo-900 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
            <option value=">">greater than</option>
            <option value="<">less than</option>
            <option value=">=">greater than or equal to</option>
            <option value="<=">less than or equal to</option>
          </select>
          <input type="number" step="0.1" value={toleranceValue} onChange={e => { setToleranceValue(e.target.value); setIsSaved(false); }} disabled={isViewMode} className={`w-20 px-2 py-1 text-center border border-indigo-300 rounded bg-white ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} placeholder="10.0" />
          <span className="font-medium text-indigo-800">%</span>
        </div>
      </div>

      {/* Save / Edit */}
      <div className="flex justify-end gap-3">
        {isViewMode ? (
          <button type="button" onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium bg-orange-600 hover:bg-orange-700">
            <Edit3 className="w-4 h-4" />
            Edit Test Data
          </button>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium ${saving ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : testId ? 'Update Test Data' : 'Save Test Data'}
          </button>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Formula:</p>
        <p className="font-mono text-xs">% Error = |(Measured − Set) / Set| × 100</p>
      </div>
    </div>
  );
}
