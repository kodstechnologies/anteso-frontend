// src/components/TestTables/CongruenceOfRadiation.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addCongruenceForRadiographyMobileHT,
  getCongruenceByServiceIdForRadiographyMobileHT,
  updateCongruenceForRadiographyMobileHT,
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
    { id: 'x', dimension: 'X + X′ (Length)', observedShift: '', edgeShift: '', percentFED: '', tolerance: '2', remark: '' },
    { id: 'y', dimension: 'Y + Y′ (Width)', observedShift: '', edgeShift: '', percentFED: '', tolerance: '2', remark: '' },
  ]);

  // Auto-calculate % FED and Remarks
  const processedRows = useMemo(() => {
    const fcd = parseFloat(techniqueRows[0]?.fcd) || 100;

    return congruenceRows.map(row => {
      const obs = parseFloat(row.observedShift) || 0;
      const edge = parseFloat(row.edgeShift) || 0;
      const sum = obs + edge;
      const percentFED = fcd > 0 ? ((sum / fcd) * 100).toFixed(2) : '0.00';
      const tol = parseFloat(row.tolerance) || 2;
      const remark = sum > 0 ? (parseFloat(percentFED) <= tol ? 'Pass' : 'Fail') : '';

      return {
        ...row,
        percentFED,
        remark: remark as 'Pass' | 'Fail' | '',
      };
    });
  }, [congruenceRows, techniqueRows]);

  // Add new technique row
  const addTechniqueRow = () => {
    setTechniqueRows(prev => [
      ...prev,
      { id: Date.now().toString(), fcd: '100', kv: '80', mas: '10' },
    ]);
  };

  const removeTechniqueRow = (id: string) => {
    if (techniqueRows.length <= 1) {
      toast.error("At least one technique row is required");
      return;
    }
    setTechniqueRows(prev => prev.filter(r => r.id !== id));
  };

  const updateTechniqueRow = (id: string, field: keyof TechniqueRow, value: string) => {
    setTechniqueRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const updateCongruenceRow = (id: string, field: keyof CongruenceRow, value: string) => {
    setCongruenceRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;

      setIsLoading(true);
      try {
        const res = await getCongruenceByServiceIdForRadiographyMobileHT(serviceId);
        const data = res?.data;

        if (data) {
          setTestId(data._id || null);
          setIsSaved(true);

          // Load technique factors
          if (Array.isArray(data.techniqueFactors) && data.techniqueFactors.length > 0) {
            setTechniqueRows(
              data.techniqueFactors.map((t: any, i: number) => ({
                id: String(i + 1),
                fcd: String(t.fcd ?? '100'),
                kv: String(t.kv ?? '80'),
                mas: String(t.mas ?? '10'),
              }))
            );
          }

          // Load congruence measurements
          if (Array.isArray(data.congruenceMeasurements) && data.congruenceMeasurements.length > 0) {
            setCongruenceRows(
              data.congruenceMeasurements.map((r: any, i: number) => ({
                id: i === 0 ? 'x' : 'y',
                dimension: r.dimension || (i === 0 ? 'X + X′ (Length)' : 'Y + Y′ (Width)'),
                observedShift: String(r.observedShift ?? ''),
                edgeShift: String(r.edgeShift ?? ''),
                percentFED: '',
                tolerance: String(r.tolerance ?? '2'),
                remark: '',
              }))
            );
          }
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
  }, [serviceId]);

  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }

    const payload = {
      techniqueFactors: techniqueRows.map(r => ({
        fcd: parseFloat(r.fcd) || 100,
        kv: parseFloat(r.kv) || 80,
        mas: parseFloat(r.mas) || 10,
      })),
      congruenceMeasurements: processedRows.map(r => ({
        dimension: r.dimension,
        observedShift: parseFloat(r.observedShift) || 0,
        edgeShift: parseFloat(r.edgeShift) || 0,
        percentFED: parseFloat(r.percentFED) || 0,
        tolerance: parseFloat(r.tolerance) || 2,
        remark: r.remark,
      })),
    };

    setIsSaving(true);
    try {
      let res;
      if (testId) {
        res = await updateCongruenceForRadiographyMobileHT(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addCongruenceForRadiographyMobileHT(serviceId, payload);
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

  const isViewOnly = isSaved && !isEditing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Loading Congruence Test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Congruence of Radiation & Light Field</h2>
        <button
          onClick={isViewOnly ? () => setIsEditing(true) : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewOnly
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isViewOnly ? <Edit3 className="w-6 h-6" /> : <Save className="w-6 h-6" />}
              {isViewOnly ? 'Edit Test' : isEditing ? 'Update Test' : 'Save Test'}
            </>
          )}
        </button>
      </div>

      {/* Table 1: Technique Factors */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h3 className="text-xl font-bold">Technique Factors Used</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 text-blue-900">
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">FCD (cm)</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">kV</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">mAs</th>
                  {!isViewOnly && <th className="w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {techniqueRows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={row.fcd}
                        onChange={(e) => updateTechniqueRow(row.id, 'fcd', e.target.value)}
                        disabled={isViewOnly}
                        className="w-full px-4 py-3 border rounded-lg text-center font-medium focus:ring-4 focus:ring-blue-200"
                        placeholder="100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={row.kv}
                        onChange={(e) => updateTechniqueRow(row.id, 'kv', e.target.value)}
                        disabled={isViewOnly}
                        className="w-full px-4 py-3 border rounded-lg text-center font-medium focus:ring-4 focus:ring-blue-200"
                        placeholder="80"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.1"
                        value={row.mas}
                        onChange={(e) => updateTechniqueRow(row.id, 'mas', e.target.value)}
                        disabled={isViewOnly}
                        className="w-full px-4 py-3 border rounded-lg text-center font-medium focus:ring-4 focus:ring-blue-200"
                        placeholder="10"
                      />
                    </td>
                    {!isViewOnly && techniqueRows.length > 1 && (
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => removeTechniqueRow(row.id)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isViewOnly && (
            <div className="mt-6 text-center">
              <button
                onClick={addTechniqueRow}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Technique Row
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table 2: Congruence Measurement */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-xl font-bold">Congruence of Radiation Field with Light Field</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-purple-50 text-purple-900">
                  <th className="px-8 py-4 text-left text-sm font-bold uppercase">Dimension</th>
                  <th className="px-8 py-4 text-left text-sm font-bold uppercase">Observed Shift (cm)</th>
                  <th className="px-8 py-4 text-left text-sm font-bold uppercase">Shift in Edges (cm)</th>
                  <th className="px-8 py-4 text-left text-sm font-bold uppercase">% of FED</th>
                  <th className="px-8 py-4 text-left text-sm font-bold uppercase">Tolerance (%)</th>
                  <th className="px-8 py-4 text-left text-sm font-bold uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {processedRows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="px-8 py-5 font-semibold text-gray-700">
                      {row.dimension}
                    </td>
                    <td className="px-8 py-5">
                      <input
                        type="number"
                        step="0.1"
                        value={row.observedShift}
                        onChange={(e) => updateCongruenceRow(row.id, 'observedShift', e.target.value)}
                        disabled={isViewOnly}
                        className="w-full px-4 py-3 border rounded-lg text-center font-medium focus:ring-4 focus:ring-purple-200"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="px-8 py-5">
                      <input
                        type="number"
                        step="0.1"
                        value={row.edgeShift}
                        onChange={(e) => updateCongruenceRow(row.id, 'edgeShift', e.target.value)}
                        disabled={isViewOnly}
                        className="w-full px-4 py-3 border rounded-lg text-center font-medium focus:ring-4 focus:ring-purple-200"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="inline-block px-6 py-3 bg-purple-100 text-purple-800 font-bold rounded-lg min-w-[80px]">
                        {row.percentFED}%
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={row.tolerance}
                          onChange={(e) => updateCongruenceRow(row.id, 'tolerance', e.target.value)}
                          disabled={isViewOnly}
                          className="w-24 px-4 py-3 border rounded-lg text-center font-bold focus:ring-4 focus:ring-purple-200"
                        />
                        <span className="text-purple-700 font-bold">%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className={`inline-block px-8 py-3 rounded-full text-sm font-bold ${row.remark === 'Pass'
                            ? 'bg-green-100 text-green-800'
                            : row.remark === 'Fail'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {row.remark || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CongruenceOfRadiation;