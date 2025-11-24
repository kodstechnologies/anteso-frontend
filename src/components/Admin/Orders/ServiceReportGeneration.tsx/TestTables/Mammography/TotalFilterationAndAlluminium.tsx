// components/TestTables/TotalFiltrationAndAluminium.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const operators = ['>', '>=', '<', '<=', '='] as const;

const TotalFiltrationAndAluminium: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [targetWindow, setTargetWindow] = useState('Molybdenum target, Beryllium window or Rh/Rh or W/Al');
  const [addedFilterThickness, setAddedFilterThickness] = useState('');
  const [rows, setRows] = useState<TableRow[]>([
    { id: '1', kvp: '28', mAs: '', alEquivalence: '', hvt: '' },
  ]);
  const [resultHVT28kVp, setResultHVT28kVp] = useState('');

  // HVL tolerances with operator + value
  const [hvlTolerances, setHvlTolerances] = useState<HvlTolerances>({
    at30: { operator: '>=', value: '0.3' },
    at40: { operator: '>=', value: '0.4' },
    at50: { operator: '>=', value: '0.5' },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Auto-sync result HVT at 28 kVp
  const hvtAt28kVp = useMemo(() => {
    const row = rows.find(r => r.kvp.trim() === '28');
    return row?.hvt.trim() || '';
  }, [rows]);

  useEffect(() => {
    if (hvtAt28kVp && !resultHVT28kVp) {
      setResultHVT28kVp(hvtAt28kVp);
    }
  }, [hvtAt28kVp, resultHVT28kVp]);

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      targetWindow.trim() &&
      rows.every(r => r.kvp.trim() && r.mAs.trim() && r.alEquivalence.trim() && r.hvt.trim())
    );
  }, [serviceId, targetWindow, rows]);

  // Load data
  useEffect(() => {
    if (!testId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        setHasSaved(true);
      } catch (e) {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [testId]);

  // Save handler
  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

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
      toast.success(testId ? 'Updated successfully!' : 'Saved successfully!');
      if (!testId) setTestId('new-id');
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

  // Row operations
  const addRow = () => {
    if (isViewMode) return;
    setRows(prev => [...prev, {
      id: Date.now().toString(),
      kvp: '',
      mAs: '',
      alEquivalence: '',
      hvt: '',
    }]);
  };

  const removeRow = (id: string) => {
    if (isViewMode || rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof TableRow, value: string) => {
    if (isViewMode) return;
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateTolerance = (kvp: 'at30' | 'at40' | 'at50', field: 'operator' | 'value', value: string) => {
    if (isViewMode) return;
    setHvlTolerances(prev => ({
      ...prev,
      [kvp]: { ...prev[kvp], [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header + Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Total Filtration & Aluminium Equivalence (HVT) - Mammography
        </h2>

        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewMode
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300'
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
              {buttonText} Test
            </>
          )}
        </button>
      </div>

      {/* Anode/Filter & Added Filter */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          Target / Filter & Added Filtration
        </h3>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anode/Filter Combination
            </label>
            <input
              type="text"
              value={targetWindow}
              onChange={(e) => setTargetWindow(e.target.value)}
              disabled={isViewMode}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
                }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Added Filter Thickness (mm Molybdenum)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={addedFilterThickness}
                onChange={(e) => setAddedFilterThickness(e.target.value)}
                disabled={isViewMode}
                placeholder="0.03"
                className={`w-32 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
                  }`}
              />
              <span className="text-sm text-gray-600">mm Molybdenum</span>
            </div>
          </div>
        </div>
      </div>

      {/* HVT Measurement Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
          HVT Measurement Data
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  Operating Potential (kVp)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  mAs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  Al Equivalence of Compression Device (mm Al)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  HVT (mm Al)
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateRow(row.id, 'kvp', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      placeholder="28"
                    />
                  </td>
                  <td className="px-6 py-3 border-r">
                    <input
                      type="text"
                      value={row.mAs}
                      onChange={(e) => updateRow(row.id, 'mAs', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                    />
                  </td>
                  <td className="px-6 py-3 border-r">
                    <input
                      type="text"
                      value={row.alEquivalence}
                      onChange={(e) => updateRow(row.id, 'alEquivalence', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={row.hvt}
                      onChange={(e) => updateRow(row.id, 'hvt', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                    />
                  </td>
                  <td className="px-2 text-center">
                    {rows.length > 1 && !isViewMode && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:bg-red-100 p-1.5 rounded"
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

        <div className="px-6 py-4 bg-gray-50 border-t">
          {!isViewMode && (
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-6">
        <p className="text-lg font-semibold text-amber-900">
          Result: The HVT of the unit is{' '}
          <input
            type="text"
            value={resultHVT28kVp}
            onChange={(e) => setResultHVT28kVp(e.target.value)}
            disabled={isViewMode}
            className={`inline-block w-32 px-3 py-1 text-center font-bold text-amber-900 bg-transparent border-b-2 border-amber-600 focus:outline-none ${isViewMode ? 'border-transparent' : ''
              }`}
            placeholder="0.00"
          />{' '}
          mm of Al for 28 kVp
        </p>
      </div>

      {/* Editable Recommended HVL Values with Dropdown */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Recommended Minimum HVL Values
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(['at30', 'at40', 'at50'] as const).map((kvp) => {
            const tolerance = hvlTolerances[kvp];
            const label = kvp === 'at30' ? '30 kVp' : kvp === 'at40' ? '40 kVp' : '50 kVp';

            return (
              <div key={kvp} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  First HVL at {label}
                </label>
                <div className="flex items-center gap-3">
                  {/* Operator Dropdown */}
                  <div className="relative">
                    <select
                      value={tolerance.operator}
                      onChange={(e) => updateTolerance(kvp, 'operator', e.target.value)}
                      disabled={isViewMode}
                      className={`appearance-none bg-white border rounded-md px-4 py-2 pr-8 text-center font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                          ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                          : 'hover:border-gray-400'
                        }`}
                    >
                      {operators.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 pointer-events-none text-gray-500" />
                  </div>

                  {/* Value Input */}
                  <input
                    type="text"
                    value={tolerance.value}
                    onChange={(e) => updateTolerance(kvp, 'value', e.target.value)}
                    disabled={isViewMode}
                    className={`w-32 px-4 py-2 border rounded-md text-center font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode
                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                        : 'border-gray-300'
                      }`}
                    placeholder="0.3"
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