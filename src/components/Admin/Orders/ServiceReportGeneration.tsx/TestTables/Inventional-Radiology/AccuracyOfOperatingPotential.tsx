import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import {
  addAccuracyOfOperatingPotentialForInventionalRadiology,
  getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology,
  updateAccuracyOfOperatingPotentialForInventionalRadiology,
} from '../../../../../../api';
import toast from 'react-hot-toast';

// mA columns are dynamic: maColumnLabels e.g. ["10", "100", "200"], row.ma keyed by label
interface Table2Row {
  id: string;
  setKV: string;
  ma: Record<string, string>;
  avgKvp: string;
  remarks: 'Pass' | 'Fail' | '';
  failedCells?: Record<string, boolean>;
}

interface Props {
  serviceId: string;
  testId?: string | null;
  tubeId?: string | null;
  onTestSaved?: (testId: string) => void;
  csvData?: any[];
}

const emptyMa = (labels: string[]) => labels.reduce((acc, l) => ({ ...acc, [l]: '' }), {} as Record<string, string>);
const emptyFailed = (labels: string[]) => ({ ...Object.fromEntries(labels.map(l => [l, false])), avgKvp: false });

const AccuracyOfOperatingPotential: React.FC<Props> = ({ serviceId, testId: propTestId, tubeId, onTestSaved, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [maColumnLabels, setMaColumnLabels] = useState<string[]>(['10', '100', '200']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', setKV: '', ma: { '10': '', '100': '', '200': '' }, avgKvp: '', remarks: '', failedCells: { '10': false, '100': false, '200': false, avgKvp: false } },
  ]);

  const [toleranceValue, setToleranceValue] = useState<string>('5');
  const [toleranceType, setToleranceType] = useState<'percent' | 'absolute'>('percent');
  const [toleranceSign, setToleranceSign] = useState<'plus' | 'minus' | 'both'>('both');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        setKV: '',
        ma: emptyMa(maColumnLabels),
        avgKvp: '',
        remarks: '',
        failedCells: emptyFailed(maColumnLabels),
      },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const addMaColumn = () => {
    const last = maColumnLabels[maColumnLabels.length - 1];
    const num = Number(last);
    const newLabel = !isNaN(num) ? String(num + (num >= 100 ? 100 : 10)) : `mA${maColumnLabels.length + 1}`;
    setMaColumnLabels((prev) => [...prev, newLabel]);
    setTable2Rows((prev) =>
      prev.map((r) => ({
        ...r,
        ma: { ...r.ma, [newLabel]: '' },
        failedCells: { ...(r.failedCells || {}), [newLabel]: false },
      }))
    );
  };

  const removeMaColumn = (index: number) => {
    if (maColumnLabels.length <= 1) return;
    const label = maColumnLabels[index];
    setMaColumnLabels((prev) => prev.filter((_, i) => i !== index));
    setTable2Rows((prev) =>
      prev.map((r) => {
        const { [label]: _, ...restMa } = r.ma;
        const failed = { ...(r.failedCells || {}) };
        delete failed[label];
        return { ...r, ma: restMa, failedCells: failed };
      })
    );
  };

  const checkTolerance = useCallback((measured: number, setKV: number): boolean => {
    if (isNaN(measured) || isNaN(setKV) || setKV <= 0) return false;
    if (toleranceType === 'percent') {
      const tolerance = parseFloat(toleranceValue) || 0;
      const allowedDiff = (setKV * tolerance) / 100;
      if (toleranceSign === 'plus') return measured <= setKV + allowedDiff;
      if (toleranceSign === 'minus') return measured >= setKV - allowedDiff;
      return Math.abs(measured - setKV) <= allowedDiff;
    }
    const tolerance = parseFloat(toleranceValue) || 0;
    if (toleranceSign === 'plus') return measured <= setKV + tolerance;
    if (toleranceSign === 'minus') return measured >= setKV - tolerance;
    return Math.abs(measured - setKV) <= tolerance;
  }, [toleranceValue, toleranceType, toleranceSign]);

  const calculateRowValues = useCallback((row: Table2Row): Table2Row => {
    const setKV = parseFloat(row.setKV);
    const labels = maColumnLabels;
    if (isNaN(setKV) || setKV <= 0) {
      return { ...row, avgKvp: '', remarks: '', failedCells: emptyFailed(labels) };
    }
    const failedCells: Record<string, boolean> = {};
    let allPass = true;
    const values: number[] = [];
    for (const label of labels) {
      const val = parseFloat(row.ma[label] ?? '');
      const pass = isNaN(val) || checkTolerance(val, setKV);
      failedCells[label] = !isNaN(val) && !pass;
      if (!pass) allPass = false;
      if (!isNaN(val)) values.push(val);
    }
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '';
    const avgPass = avg === '' || checkTolerance(parseFloat(avg), setKV);
    failedCells.avgKvp = avg !== '' && !avgPass;
    if (!avgPass) allPass = false;
    return {
      ...row,
      avgKvp: avg,
      remarks: allPass ? 'Pass' : 'Fail',
      failedCells,
    };
  }, [checkTolerance, maColumnLabels]);

  useEffect(() => {
    setTable2Rows((prev) => prev.map((row) => calculateRowValues(row)));
  }, [calculateRowValues]);

  const updateTable2 = (id: string, field: 'setKV' | string, value: string) => {
    setTable2Rows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === 'setKV') return calculateRowValues({ ...row, setKV: value });
        if (maColumnLabels.includes(field)) return calculateRowValues({ ...row, ma: { ...row.ma, [field]: value } });
        return row;
      })
    );
  };

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table2Rows.every((r) => r.setKV.trim() && maColumnLabels.some((l) => (r.ma[l] || '').trim()))
    );
  }, [serviceId, table2Rows, maColumnLabels]);

  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology(serviceId, tubeId);
        if (!res?.data || (typeof res.data === 'object' && Object.keys(res.data).length === 0)) {
          setIsLoading(false);
          return;
        }
        const rec = res.data;
        if (rec._id) setTestId(rec._id);

        if (Array.isArray(rec.table2) && rec.table2.length > 0) {
          const labels = Array.isArray(rec.maColumnLabels) && rec.maColumnLabels.length > 0
            ? rec.maColumnLabels.map((l: any) => String(l))
            : ['10', '100', '200'];
          setMaColumnLabels(labels);
          setTable2Rows(
            rec.table2.map((r: any) => {
              const ma: Record<string, string> = {};
              if (r.ma && typeof r.ma === 'object') {
                labels.forEach((l: string) => { ma[l] = String(r.ma[l] ?? ''); });
              } else {
                ma['10'] = String(r.ma10 ?? '');
                ma['100'] = String(r.ma100 ?? '');
                ma['200'] = String(r.ma200 ?? '');
              }
              return {
                id: Date.now().toString() + Math.random(),
                setKV: String(r.setKV ?? ''),
                ma,
                avgKvp: '',
                remarks: (r.remarks || '') as 'Pass' | 'Fail' | '',
                failedCells: emptyFailed(labels),
              };
            })
          );
        }

        if (rec.tolerance) {
          setToleranceValue(rec.tolerance.value || rec.tolerance);
          setToleranceType(rec.tolerance.type || 'percent');
          setToleranceSign(rec.tolerance.sign || 'both');
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
  }, [serviceId, tubeId, propTestId]);

  useEffect(() => {
    if (!csvData || csvData.length === 0) return;
    const table2Results = csvData.filter(r => r['Field Name'] === 'Table2_SetKV' || r['Field Name'] === 'Table2_MeasuredKV');
    if (table2Results.length > 0) {
      const rowIndices = Array.from(new Set(table2Results.map(r => parseInt(r['Row Index'])))).filter(i => !isNaN(i)).sort((a, b) => a - b);
      const newRows = rowIndices.map(idx => {
        const setKV = csvData.find(r => r['Field Name'] === 'Table2_SetKV' && parseInt(r['Row Index']) === idx)?.['Value'] || '';
        const measuredKV = csvData.find(r => r['Field Name'] === 'Table2_MeasuredKV' && parseInt(r['Row Index']) === idx)?.['Value'] || '';
        const ma = emptyMa(maColumnLabels);
        if (maColumnLabels[0]) ma[maColumnLabels[0]] = measuredKV;
        return {
          id: Date.now().toString() + Math.random() + idx,
          setKV,
          ma,
          avgKvp: '',
          remarks: '' as 'Pass' | 'Fail' | '',
          failedCells: emptyFailed(maColumnLabels),
        };
      });
      if (newRows.length > 0) setTable2Rows(newRows.map(row => calculateRowValues(row)));
    }
    const tolVal = csvData.find(r => r['Field Name'] === 'ToleranceValue')?.['Value'];
    if (tolVal) setToleranceValue(tolVal);
    if (!testId) setIsEditing(true);
  }, [csvData, testId, maColumnLabels]);

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      tubeId: tubeId === null ? 'null' : tubeId,
      maColumnLabels,
      table2: table2Rows.map((r) => ({
        setKV: r.setKV,
        ma: { ...r.ma },
        avgKvp: r.avgKvp || '',
        remarks: r.remarks,
      })),
      toleranceValue,
      toleranceType,
      toleranceSign,
    };

    try {
      if (testId) {
        await updateAccuracyOfOperatingPotentialForInventionalRadiology(testId, payload);
        onTestSaved?.(testId);
        toast.success('Updated successfully!');
      } else {
        const res = await addAccuracyOfOperatingPotentialForInventionalRadiology(serviceId, payload);
        const newId = res?.data?._id || res?.data?.testId;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Save failed');
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
        Accuracy of kVp at Different mA Stations {tubeId ? `- ${tubeId === 'frontal' ? 'Tube Frontal' : 'Tube Lateral'}` : ''}
      </h2>

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
                {maColumnLabels.map((label, idx) => (
                  <th key={label} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                    <span>@ mA {label}</span>
                    {!isViewMode && maColumnLabels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaColumn(idx)}
                        className="ml-1 text-red-600 hover:bg-red-50 p-0.5 rounded"
                        title="Remove column"
                      >
                        <Trash2 className="w-3 h-3 inline" />
                      </button>
                    )}
                  </th>
                ))}
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
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                      placeholder="80"
                    />
                  </td>
                  {maColumnLabels.map((label) => (
                    <td key={label} className={`px-4 py-2 border-r ${row.failedCells?.[label] ? 'bg-red-50' : ''}`}>
                      <input
                        type="text"
                        value={row.ma[label] ?? ''}
                        onChange={(e) => updateTable2(row.id, label, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : row.failedCells?.[label] ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </td>
                  ))}
                  <td className={`px-4 py-2 border-r font-medium text-center ${row.failedCells?.avgKvp ? 'bg-red-50' : 'bg-gray-50'}`}>
                    {row.avgKvp || '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${row.remarks === 'Pass' ? 'bg-green-100 text-green-800' : row.remarks === 'Fail' ? 'bg-red-100 text-red-800' : 'text-gray-400'}`}
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
          <div className="px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-2">
            <button
              onClick={addTable2Row}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
            <button
              onClick={addMaColumn}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add mA Column
            </button>
          </div>
        )}
      </div>

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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            >
              <option value="both">± (Both)</option>
              <option value="plus">+ Only</option>
              <option value="minus">- Only</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Current: <strong>{toleranceSign === 'both' ? '±' : toleranceSign === 'plus' ? '+' : '-'}{toleranceValue}{toleranceType === 'percent' ? '%' : ' kVp'}</strong>
        </p>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving || (!isViewMode && !isFormValid)}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid) ? 'bg-gray-400 cursor-not-allowed' : isViewMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'}`}
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

export default AccuracyOfOperatingPotential;
