// components/TestTables/TimerAccuracy.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Edit3, Save } from 'lucide-react';
import {
  addTimerAccuracy,
  getTimerAccuracyByTestId,
  getTimerAccuracyByServiceId,
  updateTimerAccuracy,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
  kvp: string;
  sliceThickness: string;
  ma: string;
}

interface Table2Row {
  id: string;
  setTime: string;
  observedTime: string;
  percentError: string;
  remarks: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const TimerAccuracy: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1: Fixed single row
  const [table1Row, setTable1Row] = useState<Table1Row>({ kvp: '', sliceThickness: '', ma: '' });

  // Table 2: Dynamic rows
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', setTime: '', observedTime: '', percentError: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('5');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // === Row Handling for Table 2 ===
  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), setTime: '', observedTime: '', percentError: '', remarks: '' },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    if (window.confirm('Delete this row?')) {
      setTable2Rows((prev) => prev.filter((r) => r.id !== id));
      if (hasSaved) setTimeout(() => onRefresh?.(), 100);
    }
  };

  const updateTable2 = (id: string, field: 'setTime' | 'observedTime' | 'remarks', value: string) => {
    setTable2Rows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // === Auto-calculate % Error + Pass/Fail ===
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0;

    return table2Rows.map((row) => {
      const set = parseFloat(row.setTime);
      const obs = parseFloat(row.observedTime);

      let percentError = '';
      let autoRemarks = '';

      if (!isNaN(set) && !isNaN(obs) && set > 0) {
        const error = ((Math.abs(set - obs) / set) * 100).toFixed(2);
        percentError = `${error}%`;
        autoRemarks = parseFloat(error) <= tol ? 'Pass' : 'Fail';
      }

      const finalRemarks = row.remarks.trim() === '' ? autoRemarks : row.remarks;
      return { ...row, percentError, remarks: finalRemarks };
    });
  }, [table2Rows, tolerance]);

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.kvp.trim() &&
      table1Row.sliceThickness.trim() &&
      table1Row.ma.trim() &&
      table2Rows.every(r => r.setTime.trim() && r.observedTime.trim())
    );
  }, [serviceId, table1Row, table2Rows]);

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
          const response = await getTimerAccuracyByTestId(propTestId);
          rec = response.data || response;
        } else {
          rec = await getTimerAccuracyByServiceId(serviceId);
        }

        if (rec) {
          setTestId(rec._id || propTestId);
          if (rec.table1?.[0]) {
            setTable1Row(rec.table1[0]);
          }

          if (Array.isArray(rec.table2) && rec.table2.length > 0) {
            setTable2Rows(
              rec.table2.map((r: any) => ({
                id: Date.now().toString() + Math.random(),
                setTime: String(r.setTime || ''),
                observedTime: String(r.observedTime || ''),
                percentError: '',
                remarks: String(r.remarks || ''),
              }))
            );
          }

          if (rec.tolerance) setTolerance(rec.tolerance);

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
  }, [serviceId, propTestId]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      table1: [table1Row],
      table2: table2Rows.map(r => ({
        setTime: parseFloat(r.setTime),
        observedTime: parseFloat(r.observedTime),
        remarks: r.remarks,
      })),
      tolerance,
    };

    try {
      let res;
      if (testId) {
        res = await updateTimerAccuracy(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addTimerAccuracy(serviceId, payload);
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
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Timer Accuracy Test</h2>

      {/* ==================== Table 1: Fixed Single Row ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Operating Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  kVp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Slice Thickness (mm)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  mA
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={table1Row.kvp}
                    onChange={e => setTable1Row(p => ({ ...p, kvp: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                      }`}
                    placeholder="80"
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={table1Row.sliceThickness}
                    onChange={e => setTable1Row(p => ({ ...p, sliceThickness: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                      }`}
                    placeholder="5.0"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={table1Row.ma}
                    onChange={e => setTable1Row(p => ({ ...p, ma: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                      }`}
                    placeholder="100"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== Table 2: Timer Accuracy ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Timer Accuracy Measurement
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Set Time (ms)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Observed Time (ms)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  % Error
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.map((row) => {
                const isPass = row.remarks === 'Pass';
                const isFail = row.remarks === 'Fail';
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-r">
                      <input
                        type="text"
                        value={row.setTime}
                        onChange={e => updateTable2(row.id, 'setTime', e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                          }`}
                        placeholder="100"
                      />
                    </td>
                    <td className="px-4 py-2 border-r">
                      <input
                        type="text"
                        value={row.observedTime}
                        onChange={e => updateTable2(row.id, 'observedTime', e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                          }`}
                        placeholder="98.5"
                      />
                    </td>
                    <td className="px-4 py-2 border-r font-medium bg-gray-50 text-center">
                      {row.percentError || '-'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isPass && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {isFail && <XCircle className="w-5 h-5 text-red-600" />}
                          <span className={isPass ? 'text-green-600' : isFail ? 'text-red-600' : 'text-gray-500'}>
                            {row.remarks || '—'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={e => updateTable2(row.id, 'remarks', e.target.value)}
                          disabled={isViewMode}
                          className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                            }`}
                          placeholder="Auto"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {table2Rows.length > 1 && (
                        <button
                          onClick={() => removeTable2Row(row.id)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && (
            <button
              onClick={addTable2Row}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (%):</span>
            <input
              type="number"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                }`}
              min="0"
              step="0.1"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
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
              {buttonText} Timer Accuracy
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TimerAccuracy;