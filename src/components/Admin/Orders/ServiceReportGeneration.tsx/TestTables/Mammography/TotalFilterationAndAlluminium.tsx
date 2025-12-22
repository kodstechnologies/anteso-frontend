// components/TestTables/TotalFiltrationAndAluminium.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addTotalFilterationForMammography,
  getTotalFilterationByServiceIdForMammography,
  updateTotalFilterationForMammography,
} from '../../../../../../api'; // Adjust path as needed

interface RecommendedValue {
  minValue: string;
  maxValue: string;
  kvp: string;
}

interface TableRow {
  id: string;
  kvp: string;
  mAs: string;
  alEquivalence: string;
  hvt: string;
  remarks: 'Pass' | 'Fail' | '';
  recommendedValue?: RecommendedValue;
}

interface SavedData {
  targetWindow: string;
  addedFilterThickness: string | null;
  table: { 
    kvp: number | null; 
    mAs: number | null; 
    alEquivalence: number | null; 
    hvt: number | null; 
    remarks?: 'Pass' | 'Fail' | '';
    recommendedValue?: { minValue: number | null; maxValue: number | null; kvp: number | null };
  }[];
  resultHVT28kVp: number | null;
  _id?: string;
}

const TotalFiltrationAndAluminium: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const [testId, setTestId] = useState<string | null>(null);

  const [targetWindow, setTargetWindow] = useState('Molybdenum target, Beryllium window or Rh/Rh or W/Al');
  const [addedFilterThickness, setAddedFilterThickness] = useState('');
  const [rows, setRows] = useState<TableRow[]>([
    { 
      id: '1', 
      kvp: '28', 
      mAs: '', 
      alEquivalence: '', 
      hvt: '', 
      remarks: '',
      recommendedValue: { minValue: '0.30', maxValue: '0.37', kvp: '28' }
    },
  ]);
  const [resultHVT, setResultHVT] = useState('');
  const [resultHVTKvp, setResultHVTKvp] = useState('28');


  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Calculate remarks for each row based on recommended values
  const rowsWithRemarks = useMemo(() => {
    return rows.map((row) => {
      if (!row.recommendedValue) {
        return { ...row, remarks: '' as const };
      }

      const minValue = parseFloat(row.recommendedValue.minValue);
      const maxValue = parseFloat(row.recommendedValue.maxValue);
      const recommendedKvpNum = parseFloat(row.recommendedValue.kvp);
      const rowKvp = parseFloat(row.kvp);

      // Only calculate remark if this row's kVp matches the recommended kVp
      if (isNaN(rowKvp) || isNaN(recommendedKvpNum) || rowKvp !== recommendedKvpNum) {
        return { ...row, remarks: '' as const };
      }

      const hvtValue = parseFloat(row.hvt);
      if (isNaN(hvtValue) || isNaN(minValue) || isNaN(maxValue)) {
        return { ...row, remarks: '' as const };
      }

      // Check if HVT is within recommended range: minValue ≤ HVT ≤ maxValue
      const passes = hvtValue >= minValue && hvtValue <= maxValue;
      return {
        ...row,
        remarks: (passes ? 'Pass' : 'Fail') as 'Pass' | 'Fail',
      };
    });
  }, [rows]);


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
              remarks: (t.remarks as 'Pass' | 'Fail' | '') || '',
              recommendedValue: t.recommendedValue ? {
                minValue: t.recommendedValue.minValue?.toString() || '0.30',
                maxValue: t.recommendedValue.maxValue?.toString() || '0.37',
                kvp: t.recommendedValue.kvp?.toString() || t.kvp?.toString() || '28',
              } : { minValue: '0.30', maxValue: '0.37', kvp: t.kvp?.toString() || '28' },
            }))
          );
          setResultHVT(data.resultHVT28kVp?.toString() || '');
          // Try to find the kVp from the table that matches the result HVT
          const resultHvtValue = data.resultHVT28kVp ? parseFloat(data.resultHVT28kVp.toString()) : null;
          const resultRow = resultHvtValue ? data.table.find((t: any) => {
            const rowHvt = t.hvt ? parseFloat(t.hvt.toString()) : null;
            return rowHvt !== null && Math.abs(rowHvt - resultHvtValue) < 0.001;
          }) : null;
          if (resultRow && resultRow.kvp !== null && resultRow.kvp !== undefined) {
            setResultHVTKvp(resultRow.kvp.toString());
          } else if (data.table.length > 0 && data.table[0].kvp !== null && data.table[0].kvp !== undefined) {
            setResultHVTKvp(data.table[0].kvp.toString());
          }
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
      table: rowsWithRemarks.map(r => ({
        kvp: parseFloat(r.kvp) || null,
        mAs: parseFloat(r.mAs) || null,
        alEquivalence: parseFloat(r.alEquivalence) || null,
        hvt: parseFloat(r.hvt) || null,
        remarks: r.remarks || '',
        recommendedValue: r.recommendedValue ? {
          minValue: parseFloat(r.recommendedValue.minValue) || null,
          maxValue: parseFloat(r.recommendedValue.maxValue) || null,
          kvp: parseFloat(r.recommendedValue.kvp) || null,
        } : null,
      })),
      resultHVT28kVp: parseFloat(resultHVT) || null,
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
      remarks: '',
      recommendedValue: { minValue: '0.30', maxValue: '0.37', kvp: '' },
    }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof TableRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateRecommendedValue = (id: string, field: 'minValue' | 'maxValue' | 'kvp', value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          recommendedValue: {
            ...(r.recommendedValue || { minValue: '0.30', maxValue: '0.37', kvp: r.kvp || '28' }),
            [field]: value,
          },
        };
      }
      return r;
    }));
  };



  // Auto-update recommended values for rows when targetWindow changes
  useEffect(() => {
    const targetWindowLower = targetWindow.toLowerCase();
    const defaultValues = { minValue: '0.30', maxValue: '0.37', kvp: '28' };
    
    setRows(prev => prev.map(row => ({
      ...row,
      recommendedValue: row.recommendedValue || defaultValues,
    })));
  }, [targetWindow]);

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

          {hasSaved && !isEditing && (
            <button
              onClick={toggleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}

          {(isEditing || !hasSaved) && (
            <button
              onClick={saveData}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : testId ? 'Update' : 'Save'} Test
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
              readOnly={isViewMode}
              className={`w-full px-4 py-2 border rounded-md font-medium ${!isViewMode ? 'border-gray-300 focus:ring-2 focus:ring-teal-500' : 'bg-gray-50 cursor-not-allowed'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Added Filter Thickness (mm Molybdenum)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={addedFilterThickness}
                onChange={(e) => setAddedFilterThickness(e.target.value)}
                readOnly={isViewMode}
                placeholder="0.03"
                className={`w-32 px-4 py-2 border rounded-md text-center ${!isViewMode ? 'focus:ring-2 focus:ring-teal-500' : 'bg-gray-50 cursor-not-allowed'}`}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">HVT (mm Al)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r bg-indigo-50">Recommended Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase bg-green-100">Remarks</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rowsWithRemarks.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateRow(row.id, 'kvp', e.target.value)}
                      readOnly={isViewMode}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${!isViewMode ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                      placeholder="28"
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.mAs}
                      onChange={(e) => updateRow(row.id, 'mAs', e.target.value)}
                      readOnly={isViewMode}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${!isViewMode ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.alEquivalence}
                      onChange={(e) => updateRow(row.id, 'alEquivalence', e.target.value)}
                      readOnly={isViewMode}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${!isViewMode ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={row.hvt}
                      onChange={(e) => updateRow(row.id, 'hvt', e.target.value)}
                      readOnly={isViewMode}
                      className={`w-full px-3 py-2 text-center border rounded text-sm ${!isViewMode ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`}
                    />
                  </td>
                  <td className="px-6 py-4 border-r bg-indigo-50">
                    {isViewMode ? (
                      <div className="text-xs text-center">
                        {row.recommendedValue ? (
                          <span className="font-semibold text-indigo-900">
                            {row.recommendedValue.minValue} mm Al ≤ HVL ≤ {row.recommendedValue.maxValue} mm Al at {row.recommendedValue.kvp} kVp
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap text-xs">
                        <input
                          type="text"
                          value={row.recommendedValue?.minValue || ''}
                          onChange={(e) => updateRecommendedValue(row.id, 'minValue', e.target.value)}
                          className="w-14 px-1 py-1 text-center border rounded text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="0.30"
                        />
                        <span className="text-gray-600">≤ HVL ≤</span>
                        <input
                          type="text"
                          value={row.recommendedValue?.maxValue || ''}
                          onChange={(e) => updateRecommendedValue(row.id, 'maxValue', e.target.value)}
                          className="w-14 px-1 py-1 text-center border rounded text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="0.37"
                        />
                        <span className="text-gray-600">at</span>
                        <input
                          type="text"
                          value={row.recommendedValue?.kvp || ''}
                          onChange={(e) => updateRecommendedValue(row.id, 'kvp', e.target.value)}
                          className="w-12 px-1 py-1 text-center border rounded text-xs focus:ring-1 focus:ring-indigo-500"
                          placeholder="28"
                        />
                        <span className="text-gray-600">kVp</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        row.remarks === 'Pass'
                          ? 'bg-green-100 text-green-800'
                          : row.remarks === 'Fail'
                          ? 'bg-red-100 text-red-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {row.remarks || '—'}
                    </span>
                  </td>
                  <td className="px-3 text-center">
                    {!isViewMode && rows.length > 1 && (
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
          {!isViewMode && (
            <button onClick={addRow} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-amber-900">
            Result: The HVT of the unit is{' '}
            <span className={`inline-block w-32 px-4 py-2 bg-white border-2 border-amber-600 rounded font-bold text-amber-900 ${!isViewMode ? 'cursor-text' : ''}`}>
              {isViewMode ? (
                resultHVT || '—'
              ) : (
                <input
                  type="text"
                  value={resultHVT}
                  onChange={(e) => setResultHVT(e.target.value)}
                  className="w-full text-center bg-transparent border-none outline-none font-bold text-amber-900"
                  placeholder="—"
                />
              )}
            </span>{' '}
            mm Al at{' '}
            <span className={`inline-block w-24 px-4 py-2 bg-white border-2 border-amber-600 rounded font-bold text-amber-900 ${!isViewMode ? 'cursor-text' : ''}`}>
              {isViewMode ? (
                resultHVTKvp || '—'
              ) : (
                <input
                  type="text"
                  value={resultHVTKvp}
                  onChange={(e) => setResultHVTKvp(e.target.value)}
                  className="w-full text-center bg-transparent border-none outline-none font-bold text-amber-900"
                  placeholder="28"
                />
              )}
            </span>{' '}
            kVp
          </p>
        </div>
      </div>

    </div>
  );
};

export default TotalFiltrationAndAluminium;