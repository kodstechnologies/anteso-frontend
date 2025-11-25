'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addReproducibilityOfOutputForMammography,
  getReproducibilityOfOutputByServiceIdForMammography,
  updateReproducibilityOfOutputForMammography,
} from '../../../../../../api'; // Adjust path

interface OutputRow {
  id: string;
  kv: string;
  mas: string;
  outputs: string[];
  avg: string;
  remark: string;
}

interface SavedData {
  outputRows: {
    kv: string;
    mas: string;
    outputs: string[];
    avg: string;
    remark: string;
  }[];
  tolerance: string;
  _id?: string;
}

const ReproducibilityOfOutput: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const [testId, setTestId] = useState<string | null>(null);
  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kv: '28',
      mas: '100',
      outputs: ['', '', '', '', ''],
      avg: '',
      remark: '',
    },
  ]);
  const [outputHeaders, setOutputHeaders] = useState<string[]>([
    'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
  ]);
  const [tolerance, setTolerance] = useState<string>('5.0');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);   // Start in edit mode
  const [hasSaved, setHasSaved] = useState(false);

  const outputColumnsCount = outputHeaders.length;

  // Auto calculate average and CV + remark
  useEffect(() => {
    setOutputRows(prev => prev.map(row => {
      const values = row.outputs
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (values.length === 0) {
        return { ...row, avg: '', remark: '' };
      }

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const avgStr = avg.toFixed(3);

      // Coefficient of Variation
      const stdDev = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / values.length);
      const cv = values.length > 1 ? (stdDev / avg) * 100 : 0;
      const cvStr = cv.toFixed(2);

      const toleranceVal = parseFloat(tolerance) || 5.0;
      const remark = cv <= toleranceVal ? 'Pass' : 'Fail';

      return { ...row, avg: avgStr, remark };
    }));
  }, [outputRows.map(r => r.outputs.join()).join(), tolerance]);

  // Load data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      try {
        const data: SavedData | null = await getReproducibilityOfOutputByServiceIdForMammography(serviceId);
        if (data) {
          setOutputRows(data.outputRows.map((r, i) => ({
            id: Date.now().toString() + i,
            kv: r.kv || '',
            mas: r.mas || '',
            outputs: r.outputs || [],
            avg: r.avg || '',
            remark: r.remark || '',
          })));
          setTolerance(data.tolerance || '5.0');
          setTestId(data._id || null);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (err) {
        console.error(err);
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
      outputRows: outputRows.map(r => ({
        kv: r.kv,
        mas: r.mas,
        outputs: r.outputs,
        avg: r.avg,
        remark: r.remark,
      })),
      tolerance,
    };

    try {
      if (testId) {
        await updateReproducibilityOfOutputForMammography(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await addReproducibilityOfOutputForMammography(serviceId, payload);
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

  const toggleEdit = () => setIsEditing(prev => !prev);

  const showEditButton = hasSaved && !isEditing;
  const showSaveButton = isEditing;

  // Column & Row handlers
  const addOutputColumn = () => {
    const newHeader = `Meas ${outputHeaders.length + 1}`;
    setOutputHeaders(prev => [...prev, newHeader]);
    setOutputRows(prev => prev.map(row => ({ ...row, outputs: [...row.outputs, ''] })));
  };

  const removeOutputColumn = (idx: number) => {
    if (outputHeaders.length <= 3) return; // min 3 recommended
    setOutputHeaders(prev => prev.filter((_, i) => i !== idx));
    setOutputRows(prev => prev.map(row => ({
      ...row,
      outputs: row.outputs.filter((_, i) => i !== idx),
    })));
  };

  const updateHeader = (idx: number, value: string) => {
    setOutputHeaders(prev => prev.map((h, i) => i === idx ? (value || `Meas ${i + 1}`) : h));
  };

  const addOutputRow = () => {
    setOutputRows(prev => [...prev, {
      id: Date.now().toString(),
      kv: '28',
      mas: '100',
      outputs: Array(outputColumnsCount).fill(''),
      avg: '',
      remark: '',
    }]);
  };

  const removeOutputRow = (id: string) => {
    if (outputRows.length <= 1) return;
    setOutputRows(prev => prev.filter(r => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'kv' | 'mas' | number, value: string) => {
    setOutputRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      if (field === 'kv' || field === 'mas') {
        return { ...row, [field]: value };
      }
      if (typeof field === 'number') {
        const outputs = [...row.outputs];
        outputs[field] = value;
        return { ...row, outputs };
      }
      return row;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <span className="ml-4 text-lg">Loading Reproducibility Test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Consistency of Radiation Output (Reproducibility)
        </h2>

        <div className="flex items-center gap-4">
          {isSaving && <span className="text-sm text-gray-500">Saving...</span>}

          {showEditButton && (
            <button
              onClick={toggleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}

          {showSaveButton && (
            <button
              onClick={saveData}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {hasSaved ? 'Update' : 'Save'} Test
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <h3 className="px-6 py-4 text-lg font-semibold bg-blue-50 text-blue-900 border-b">
          Radiation Output Measurements
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">kV</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mAs</th>
                <th colSpan={outputColumnsCount} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    {isEditing && (
                      <button onClick={addOutputColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">Avg (X̄)</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">CV % / Remark</th>
                <th rowSpan={2} className="w-10" />
              </tr>
              <tr>
                {outputHeaders.map((h, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        readOnly={!isEditing}
                        className="w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      {isEditing && outputColumnsCount > 3 && (
                        <button onClick={() => removeOutputColumn(i)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outputRows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kv}
                      onChange={e => updateCell(row.id, 'kv', e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-3 py-2 text-center border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.mas}
                      onChange={e => updateCell(row.id, 'mas', e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-3 py-2 text-center border rounded text-sm"
                    />
                  </td>
                  {row.outputs.map((val, i) => (
                    <td key={i} className="px-2 py-2 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={e => updateCell(row.id, i, e.target.value)}
                        readOnly={!isEditing}
                        className="w-full px-3 py-2 text-center border rounded text-sm"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 border-r font-medium text-center bg-blue-50">
                    {row.avg || '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${row.remark === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {row.remark || '—'}
                    </span>
                  </td>
                  <td className="px-2 text-center">
                    {isEditing && outputRows.length > 1 && (
                      <button onClick={() => removeOutputRow(row.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-start">
          {isEditing && (
            <button onClick={addOutputRow} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Technique
            </button>
          )}
        </div>
      </div>

      {/* Tolerance */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-6 max-w-md">
        <label className="block text-lg font-semibold text-gray-800 mb-3">
          Acceptance Criteria (CV ≤ {tolerance}%)
        </label>
        <div className="flex items-center gap-4">
          <span className="text-lg">CV ≤</span>
          <input
            type="text"
            value={tolerance}
            onChange={e => setTolerance(e.target.value)}
            readOnly={!isEditing}
            className="w-32 px-4 py-3 text-xl font-bold text-center border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-300"
          />
          <span className="text-lg">%</span>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          IEC 61223-3-1 & AERB: Coefficient of Variation should be ≤ 5%
        </p>
      </div>
    </div>
  );
};

export default  ReproducibilityOfOutput;