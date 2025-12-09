// src/components/TestTables/CongruenceOfRadiation.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addCongruenceOfRadiationForOBI,
  getCongruenceOfRadiationByServiceIdForOBI,
  updateCongruenceOfRadiationForOBI,
} from '../../../../../../api';

interface TechniqueRow {
  id: string;
  fcd: string;
  kv: string;
  mas: string;
}

interface CongruenceRow {
  id: string;
  dimension: string;
  observedShift: string;
  edgeShift: string;
  percentFED: string;
  tolerance: string;
  remark: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const CongruenceOfRadiation: React.FC<Props> = ({ serviceId, testId: propTestId, onTestSaved }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Table 1: Technique Factors
  const [techniqueRows, setTechniqueRows] = useState<TechniqueRow[]>([
    { id: '1', fcd: '100', kv: '80', mas: '10' },
  ]);

  // Table 2: Congruence Measurement
  const [congruenceRows, setCongruenceRows] = useState<CongruenceRow[]>([
    { id: 'x', dimension: 'Ι X Ι + Ι X’ Ι', observedShift: '', edgeShift: '', percentFED: '', tolerance: '2', remark: '' },
    { id: 'y', dimension: 'Ι Y Ι + Ι Y’ Ι', observedShift: '', edgeShift: '', percentFED: '', tolerance: '2', remark: '' },
  ]);

  // Auto-calculate % FED = (Observed Shift + Edge Shift) / FCD × 100
  const processedRows = useMemo(() => {
    const fcd = parseFloat(techniqueRows[0]?.fcd) || 0;

    return congruenceRows.map(row => {
      const obs = parseFloat(row.observedShift) || 0;
      const edge = parseFloat(row.edgeShift) || 0;
      const sum = obs + edge;
      const percentFED = fcd > 0 ? ((sum / fcd) * 100).toFixed(2) : '';
      const tol = parseFloat(row.tolerance) || 0;
      const remark = percentFED && tol > 0
        ? (parseFloat(percentFED) <= tol ? 'Pass' : 'Fail')
        : '';

      return { ...row, percentFED, remark };
    });
  }, [congruenceRows, techniqueRows]);

  // Add new technique row
  const addTechniqueRow = () => {
    setTechniqueRows(prev => [...prev, {
      id: Date.now().toString(),
      fcd: '100',
      kv: '80',
      mas: '10',
    }]);
  };

  const removeTechniqueRow = (id: string) => {
    if (techniqueRows.length <= 1) return;
    setTechniqueRows(prev => prev.filter(r => r.id !== id));
  };

  const updateTechniqueRow = (id: string, field: keyof TechniqueRow, value: string) => {
    setTechniqueRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // Update congruence row
  const updateCongruenceRow = (id: string, field: keyof CongruenceRow, value: string) => {
    setCongruenceRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      setIsLoading(true);
      try {
        const res = await getCongruenceOfRadiationByServiceIdForOBI(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          if (Array.isArray(data.techniqueFactors) && data.techniqueFactors.length > 0) {
            setTechniqueRows(
              data.techniqueFactors.map((t: any, i: number) => ({
                id: String(i + 1),
                fcd: String(t.fcd ?? ''),
                kv: String(t.kv ?? ''),
                mas: String(t.mas ?? ''),
              }))
            );
          }
          if (Array.isArray(data.congruenceMeasurements) && data.congruenceMeasurements.length > 0) {
            setCongruenceRows(
              data.congruenceMeasurements.map((r: any, i: number) => ({
                id: i === 0 ? 'x' : i === 1 ? 'y' : String(i + 1),
                dimension: r.dimension || '',
                observedShift: String(r.observedShift ?? ''),
                edgeShift: String(r.edgeShift ?? ''),
                percentFED: String(r.percentFED ?? ''),
                tolerance: String(r.tolerance ?? ''),
                remark: (r.remark as any) || '',
              }))
            );
          }
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load Congruence data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, propTestId]);

  // Save handler
  const handleSave = async () => {
    if (!serviceId) return toast.error("Service ID missing");

    const payload = {
      techniqueFactors: techniqueRows,
      congruenceMeasurements: processedRows.map(r => ({
        dimension: r.dimension,
        observedShift: parseFloat(r.observedShift) || 0,
        edgeShift: parseFloat(r.edgeShift) || 0,
        percentFED: parseFloat(r.percentFED) || 0,
        tolerance: parseFloat(r.tolerance) || 0,
        remark: r.remark,
      })),
    };

    setIsSaving(true);
    try {
      let res;
      if (testId) {
        res = await updateCongruenceOfRadiationForOBI(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addCongruenceOfRadiationForOBI(serviceId, payload);
        const newId = res?.data?._id || res?.data?.data?._id;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success('Saved successfully!');
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => setIsEditing(true);
  const isViewOnly = isSaved && !isEditing;
  const buttonText = !isSaved ? "Save Test" : isEditing ? "Update Test" : "Edit Test";
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Congruence of Radiation & Light Field</h2>
        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all shadow-md ${isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : isViewOnly
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-teal-600 hover:bg-teal-700"
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-5 h-5" />
              {buttonText}
            </>
          )}
        </button>
      </div>

      {/* Table 1: Technique Factors */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-bold bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          Technique Factors
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase">FCD (cm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase">kV</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase">mAs</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {techniqueRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 border-t">
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={row.fcd}
                      onChange={(e) => updateTechniqueRow(row.id, 'fcd', e.target.value)}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 text-center border rounded-lg font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={row.kv}
                      onChange={(e) => updateTechniqueRow(row.id, 'kv', e.target.value)}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 text-center border rounded-lg font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.1"
                      value={row.mas}
                      onChange={(e) => updateTechniqueRow(row.id, 'mas', e.target.value)}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 text-center border rounded-lg font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 text-center">
                    {techniqueRows.length > 1 && !isViewOnly && (
                      <button
                        onClick={() => removeTechniqueRow(row.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isViewOnly && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button
              onClick={addTechniqueRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        )}
      </div>

      {/* Table 2: Congruence Measurement */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-bold bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          Congruence of Radiation Field with Light Field
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Dimension (cm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Observed Shift (cm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Shift in Edges (cm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">% of FED</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Tolerance (%)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 border-t">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {row.dimension}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.1"
                      value={row.observedShift}
                      onChange={(e) => updateCongruenceRow(row.id, 'observedShift', e.target.value)}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 text-center border rounded-lg font-medium focus:ring-2 focus:ring-purple-500"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.1"
                      value={row.edgeShift}
                      onChange={(e) => updateCongruenceRow(row.id, 'edgeShift', e.target.value)}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 text-center border rounded-lg font-medium focus:ring-2 focus:ring-purple-500"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="px-6 py-4 text-center font-bold bg-purple-50">
                    {row.percentFED || '—'}%
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={row.tolerance}
                        onChange={(e) => updateCongruenceRow(row.id, 'tolerance', e.target.value)}
                        disabled={isViewOnly}
                        className="w-20 px-3 py-2 text-center border rounded-lg font-bold focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="font-bold text-purple-700">%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-5 py-2 rounded-full text-sm font-bold ${row.remark === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : row.remark === 'Fail'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {row.remark || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Result Summary */}
      {/* <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-indigo-900 mb-4">
          Final Result
        </h3>
        <div className={`text-4xl font-extrabold ${processedRows.every(r => r.remark === 'Pass')
            ? 'text-green-600'
            : processedRows.some(r => r.remark === 'Fail')
              ? 'text-red-600'
              : 'text-gray-500'
          }`}>
          {processedRows.every(r => r.remark === 'Pass') ? 'PASS' :
            processedRows.some(r => r.remark === 'Fail') ? 'FAIL' : 'PENDING'}
        </div>
      </div> */}
    </div>
  );
};

export default CongruenceOfRadiation;