// components/TestTables/TotalFiltrationAndAluminium.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addTotalFilterationForMammography,
  getTotalFilterationByServiceIdForMammography,
  updateTotalFilterationForMammography,
} from '../../../../../../api'; // Adjust path as needed

interface TableRow {
  id: string;
  kvp: string;
  mAs: string;
  alEquivalence: string;
  hvt: string;
}

interface HvlToleranceItem {
  operator: '>' | '>=' | '<' | '<=' | '=';
  value: string;
}

interface HvlTolerances {
  at30: HvlToleranceItem;
  at40: HvlToleranceItem;
  at50: HvlToleranceItem;
}

interface SavedData {
  targetWindow: string;
  addedFilterThickness: string | null;
  table: { kvp: number | null; mAs: number | null; alEquivalence: number | null; hvt: number | null }[];
  resultHVT28kVp: number | null;
  hvlTolerances: HvlTolerances;
  _id?: string;
}

const operators = ['>', '>=', '<', '<=', '='] as const;

const TotalFiltrationAndAluminium: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const [testId, setTestId] = useState<string | null>(null);

  const [targetWindow, setTargetWindow] = useState('Molybdenum target, Beryllium window or Rh/Rh or W/Al');
  const [addedFilterThickness, setAddedFilterThickness] = useState('');
  const [rows, setRows] = useState<TableRow[]>([
    { id: '1', kvp: '28', mAs: '', alEquivalence: '', hvt: '' },
  ]);
  const [resultHVT28kVp, setResultHVT28kVp] = useState('');

  const [hvlTolerances, setHvlTolerances] = useState<HvlTolerances>({
    at30: { operator: '>=', value: '0.30' },
    at40: { operator: '>=', value: '0.40' },
    at50: { operator: '>=', value: '0.50' },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Auto-sync HVT at 28 kVp
  const hvtAt28kVp = useMemo(() => {
    const row = rows.find(r => r.kvp.trim() === '28');
    return row?.hvt.trim() || '';
  }, [rows]);

  useEffect(() => {
    if (hvtAt28kVp && !resultHVT28kVp) {
      setResultHVT28kVp(hvtAt28kVp);
    }
  }, [hvtAt28kVp, resultHVT28kVp]);

  // Load data from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      try {
        const data: SavedData | null = await getTotalFilterationByServiceIdForMammography(serviceId);
        if (data) {
          setTargetWindow(data.targetWindow || '');
          setAddedFilterThickness(data.addedFilterThickness || '');
          setRows(
            data.table.map((t, i) => ({
              id: Date.now().toString() + i,
              kvp: t.kvp?.toString() || '',
              mAs: t.mAs?.toString() || '',
              alEquivalence: t.alEquivalence?.toString() || '',
              hvt: t.hvt?.toString() || '',
            }))
          );
          setResultHVT28kVp(data.resultHVT28kVp?.toString() || '');
          setHvlTolerances(data.hvlTolerances || {
            at30: { operator: '>=', value: '0.30' },
            at40: { operator: '>=', value: '0.40' },
            at50: { operator: '>=', value: '0.50' },
          });
          setTestId(data._id || null);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (err) {
        console.error("Failed to load Total Filtration data:", err);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  // Save handler
  const saveData = async () => {
    if (!serviceId) return;

    setIsSaving(true);
    const payload = {
      targetWindow,
      addedFilterThickness: addedFilterThickness || null,
      table: rows.map(r => ({
        kvp: parseFloat(r.kvp) || null,
        mAs: parseFloat(r.mAs) || null,
        alEquivalence: parseFloat(r.alEquivalence) || null,
        hvt: parseFloat(r.hvt) || null,
      })),
      resultHVT28kVp: parseFloat(resultHVT28kVp) || null,
      hvlTolerances: {
        at30: { operator: hvlTolerances.at30.operator, value: parseFloat(hvlTolerances.at30.value) || null },
        at40: { operator: hvlTolerances.at40.operator, value: parseFloat(hvlTolerances.at40.value) || null },
        at50: { operator: hvlTolerances.at50.operator, value: parseFloat(hvlTolerances.at50.value) || null },
      },
    };

    try {
      if (testId) {
        await updateTotalFilterationForMammography(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await addTotalFilterationForMammography(serviceId, payload);
        setTestId(res.data._id);
        toast.success("Saved successfully!");
      }
      setHasSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const isViewMode = hasSaved && !isEditing;

  // Row operations
  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now().toString(),
      kvp: '',
      mAs: '',
      alEquivalence: '',
      hvt: '',
    }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof TableRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateTolerance = (kvp: 'at30' | 'at40' | 'at50', field: 'operator' | 'value', value: string) => {
    setHvlTolerances(prev => ({
      ...prev,
      [kvp]: { ...prev[kvp], [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <span className="ml-3 text-lg">Loading Total Filtration Test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Total Filtration & Aluminium Equivalence (HVT) - Mammography
        </h2>

        <div className="flex items-center gap-4">
          {isSaving && <span className="text-sm text-gray-500">Saving...</span>}

          {hasSaved && (
            <button
              onClick={toggleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          )}

          {isEditing && (
            <button
              onClick={saveData}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {testId ? 'Update' : 'Save'} Test
            </button>
          )}
        </div>
      </div>

      {/* Anode/Filter & Added Filter */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <h3 className="px-6 py-4 text-lg font-semibold bg-teal-50 border-b text-teal-900">
          Target / Filter & Added Filtration
        </h3>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anode/Filter Combination</label>
            <input
              type="text"
              value={targetWindow}
              onChange={(e) => setTargetWindow(e.target.value)}
              readOnly={!isEditing}
              className={`w-full px-4 py-2 border rounded-md font-medium ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-teal-500' : 'bg-gray-50 cursor-not-allowed'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Added Filter Thickness (mm Molybdenum)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={addedFilterThickness}
                onChange={(e) => setAddedFilterThickness(e.target.value)}
                readOnly={!isEditing}
                placeholder="0.03"
                className={`w-32 px-4 py-2 border rounded-md text-center ${isEditing ? 'focus:ring-2 focus:ring-teal-500' : 'bg-gray-50 cursor-not-allowed'}`}
              />
              <span className="text-sm text-gray-600">mm Molybdenum</span>
            </div>
          </div>
        </div>
      </div>

      {/* HVT Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <h3 className="px-6 py-4 text-lg font-semibold bg-blue-50 border-b text-blue-900">
          HVT Measurement Data
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">kVp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mAs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">Al Equivalence (mm Al)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">HVT (mm Al)</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateRow(row.id, 'kvp', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                      placeholder="28"
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.mAs}
                      onChange={(e) => updateRow(row.id, 'mAs', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.alEquivalence}
                      onChange={(e) => updateRow(row.id, 'alEquivalence', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={row.hvt}
                      onChange={(e) => updateRow(row.id, 'hvt', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                    />
                  </td>
                  <td className="px-3 text-center">
                    {isEditing && rows.length > 1 && (
                      <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          {isEditing && (
            <button onClick={addRow} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 text-center">
        <p className="text-xl font-bold text-amber-900">
          Result: The HVT of the unit is{' '}
          <span className="inline-block w-32 px-4 py-2 bg-white border-2 border-amber-600 rounded font-bold text-amber-900">
            {resultHVT28kVp || '—'}
          </span>{' '}
          mm Al at 28 kVp
        </p>
      </div>

      {/* Recommended HVL Tolerances */}
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Recommended Minimum HVL Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(['at30', 'at40', 'at50'] as const).map((key) => {
            const t = hvlTolerances[key];
            const label = key === 'at30' ? '30 kVp' : key === 'at40' ? '40 kVp' : '50 kVp';
            return (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">First HVL at {label}</label>
                <div className="flex items-center gap-3">
                  <select
                    value={t.operator}
                    onChange={(e) => updateTolerance(key, 'operator', e.target.value)}
                    disabled={!isEditing}
                    className={`px-4 py-2 border rounded-md font-medium ${isEditing ? 'cursor-pointer' : 'bg-gray-50 cursor-not-allowed'}`}
                  >
                    {operators.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input
                    type="text"
                    value={t.value}
                    onChange={(e) => updateTolerance(key, 'value', e.target.value)}
                    disabled={!isEditing}
                    className={`w-28 px-4 py-2 text-center border rounded-md font-medium ${isEditing ? 'focus:ring-2 focus:ring-teal-500' : 'bg-gray-50 cursor-not-allowed'}`}
                  />
                  <span className="text-sm text-gray-600">mm Al</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TotalFiltrationAndAluminium;