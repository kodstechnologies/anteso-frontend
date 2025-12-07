// components/TestTables/MeasurementOfOperatingPotential.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import {
  addAccuracyOfOperatingPotentialForRadiographyPortable,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable,
  updateAccuracyOfOperatingPotentialForRadiographyPortable,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
  time: string;
  sliceThickness: string;
}

interface Table2Row {
  id: string;
  setKV: string;
  ma10: string;
  ma100: string;
  ma200: string;
  avgKvp: string;
  remarks: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const MeasurementOfOperatingPotential: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1: Only 1 row
  const [table1Row, setTable1Row] = useState<Table1Row>({ time: '', sliceThickness: '' });

  // Table 2: Dynamic rows
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', setKV: '', ma10: '', ma100: '', ma200: '', avgKvp: '', remarks: '' },
  ]);

  const [toleranceValue, setToleranceValue] = useState<string>('5');
  const [toleranceType, setToleranceType] = useState<'percent' | 'absolute'>('percent');
  const [toleranceSign, setToleranceSign] = useState<'plus' | 'minus' | 'both'>('both');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // === Table 2: Add/Remove ===
  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        setKV: '',
        ma10: '',
        ma100: '',
        ma200: '',
        avgKvp: '',
        remarks: '',
      },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTable2 = (
    id: string,
    field: 'setKV' | 'ma10' | 'ma100' | 'ma200',
    value: string
  ) => {
    setTable2Rows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // === Auto-calculate Avg & Pass/Fail ===
  useEffect(() => {
    setTable2Rows((prev) =>
      prev.map((row) => {
        const values = [row.ma10, row.ma100, row.ma200]
          .map((v) => parseFloat(v))
          .filter((v) => !isNaN(v));
        const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '';

        const setKV = parseFloat(row.setKV);
        if (isNaN(setKV) || avg === '') {
          return { ...row, avgKvp: avg, remarks: '' };
        }

        const measured = parseFloat(avg);
        let withinTolerance = false;

        if (toleranceType === 'percent') {
          const tolerance = parseFloat(toleranceValue) || 0;
          const allowedDiff = (setKV * tolerance) / 100;
          if (toleranceSign === 'plus') withinTolerance = measured <= setKV + allowedDiff;
          else if (toleranceSign === 'minus') withinTolerance = measured >= setKV - allowedDiff;
          else withinTolerance = Math.abs(measured - setKV) <= allowedDiff;
        } else {
          const tolerance = parseFloat(toleranceValue) || 0;
          if (toleranceSign === 'plus') withinTolerance = measured <= setKV + tolerance;
          else if (toleranceSign === 'minus') withinTolerance = measured >= setKV - tolerance;
          else withinTolerance = Math.abs(measured - setKV) <= tolerance;
        }

        return {
          ...row,
          avgKvp: avg,
          remarks: withinTolerance ? 'Pass' : 'Fail',
        };
      })
    );
  }, [table2Rows, toleranceValue, toleranceType, toleranceSign]);

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.time.trim() &&
      table1Row.sliceThickness.trim() &&
      table2Rows.every((r) => r.setKV.trim() && (r.ma10.trim() || r.ma100.trim() || r.ma200.trim()))
    );
  }, [serviceId, table1Row, table2Rows]);

  // === Load Existing Data ===
  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable(serviceId);
        if (!res?.data) {
          setIsLoading(false);
          return;
        }
        const rec = res.data;

        // Table 1
        if (rec.table1?.[0]) {
          setTable1Row({
            time: rec.table1[0].time,
            sliceThickness: rec.table1[0].sliceThickness,
          });
        }

        // Table 2
        if (Array.isArray(rec.table2) && rec.table2.length > 0) {
          setTable2Rows(
            rec.table2.map((r: any) => ({
              id: Date.now().toString() + Math.random(),
              setKV: String(r.setKV),
              ma10: String(r.ma10),
              ma100: String(r.ma100),
              ma200: String(r.ma200),
              avgKvp: '',
              remarks: r.remarks,
            }))
          );
        }

        // Tolerance
        if (rec.tolerance) {
          setToleranceValue(rec.tolerance.value);
          setToleranceType(rec.tolerance.type);
          setToleranceSign(rec.tolerance.sign);
        }

        setHasSaved(true);
        setIsEditing(false);
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      table1: [table1Row],
      table2: table2Rows.map((r) => {
        const values = [r.ma10, r.ma100, r.ma200]
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));

        const avgKvp = values.length > 0
          ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
          : null;

        const setKV = parseFloat(r.setKV);
        let deviation = null;
        if (avgKvp && !isNaN(setKV)) {
          deviation = ((parseFloat(avgKvp) - setKV) / setKV * 100).toFixed(2);
        }

        return {
          setKV: setKV,
          ma10: parseFloat(r.ma10) || null,
          ma100: parseFloat(r.ma100) || null,
          ma200: parseFloat(r.ma200) || null,
          avgKvp: avgKvp ? parseFloat(avgKvp) : null,        // ← NOW SAVED
          deviation: deviation ? parseFloat(deviation) : null, // ← Optional: useful for PDF
          remarks: r.remarks,
        };
      }),
      toleranceValue,
      toleranceType,
      toleranceSign,
    };

    try {
      let res;
      if (testId) {
        res = await updateAccuracyOfOperatingPotentialForRadiographyPortable(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addAccuracyOfOperatingPotentialForRadiographyPortable(serviceId, payload);
        if (res?.data?._id) setTestId(res.data._id);
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
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Measurement of Operating Potential
      </h2>

      {/* Table 1: Single Row */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Exposure Time vs Slice Thickness
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Time (ms)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Slice Thickness (mm)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-2 border-r">
                <input
                  type="text"
                  value={table1Row.time}
                  onChange={(e) => setTable1Row((p) => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                    : 'border-gray-300'
                    }`}
                  placeholder="100"
                />
              </td>
              <td className="px-6 py-2">
                <input
                  type="text"
                  value={table1Row.sliceThickness}
                  onChange={(e) => setTable1Row((p) => ({ ...p, sliceThickness: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                    : 'border-gray-300'
                    }`}
                  placeholder="5.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          kV Measurement at Different mA
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Set kV
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  @ mA 10
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  @ mA 100
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  @ mA 200
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Avg kVp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pass/Fail
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table2Rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.setKV}
                      onChange={(e) => updateTable2(row.id, 'setKV', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                        }`}
                      placeholder="80"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.ma10}
                      onChange={(e) => updateTable2(row.id, 'ma10', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                        }`}
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.ma100}
                      onChange={(e) => updateTable2(row.id, 'ma100', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                        }`}
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.ma200}
                      onChange={(e) => updateTable2(row.id, 'ma200', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                        }`}
                    />
                  </td>
                  <td className="px-4 py-2 border-r font-medium bg-gray-50 text-center">
                    {row.avgKvp || '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${row.remarks === 'Pass'
                        ? 'bg-green-100 text-green-800'
                        : row.remarks === 'Fail'
                          ? 'bg-red-100 text-red-800'
                          : 'text-gray-400'
                        }`}
                    >
                      {row.remarks || '—'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {table2Rows.length > 1 && !isViewMode && (
                      <button
                        onClick={() => removeTable2Row(row.id)}
                        className="text-red-600 hover:bg-red-100 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isViewMode && (
          <div className="px-6 py-3 bg-gray-50 border-t">
            <button
              onClick={addTable2Row}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        )}
      </div>

      {/* Tolerance */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tolerance Setting</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance Value</label>
            <input
              type="number"
              value={toleranceValue}
              onChange={(e) => setToleranceValue(e.target.value)}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                : 'border-gray-300'
                }`}
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={toleranceType}
              onChange={(e) => setToleranceType(e.target.value as any)}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                : 'border-gray-300'
                }`}
            >
              <option value="percent">%</option>
              <option value="absolute">kVp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select
              value={toleranceSign}
              onChange={(e) => setToleranceSign(e.target.value as any)}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                : 'border-gray-300'
                }`}
            >
              <option value="both">± (Both)</option>
              <option value="plus">+ Only</option>
              <option value="minus">- Only</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Current: <strong>
            {toleranceSign === 'both' ? '±' : toleranceSign === 'plus' ? '+' : '-'}
            {toleranceValue}{toleranceType === 'percent' ? '%' : ' kVp'}
          </strong>
        </p>
      </div>

      {/* SAVE BUTTON */}
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
              {buttonText} Measurement
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MeasurementOfOperatingPotential;