// src/components/TestTables/CentralBeamAlignment.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Edit3, Save, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addCentralBeamAlignmentForInventionalRadiology,
  getCentralBeamAlignmentByServiceIdForInventionalRadiology,
  updateCentralBeamAlignmentForInventionalRadiology,
} from '../../../../../../api';

interface TechniqueRow {
  id: string;
  fcd: string;
  kv: string;
  mas: string;
}

interface TiltRow {
  id: string;
  value: string;
  remark: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string | null;
  tubeId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const CentralBeamAlignment: React.FC<Props> = ({ serviceId, testId: propTestId, tubeId, onTestSaved }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [techniqueRow, setTechniqueRow] = useState<TechniqueRow>({
    id: '1',
    fcd: '100',
    kv: '80',
    mas: '10',
  });

  const [observedTilt, setObservedTilt] = useState<string>('1.8');

  const [toleranceOperator, setToleranceOperator] = useState<'<' | '>' | '<=' | '>=' | '='>('<=');
  const [toleranceValue, setToleranceValue] = useState<string>('2');

  const operators = ['<', '>', '<=', '>=', '='] as const;

  const evaluation = useMemo(() => {
    const observed = parseFloat(observedTilt) || 0;
    const tolerance = parseFloat(toleranceValue) || 0;

    if (isNaN(observed) || isNaN(tolerance) || !observedTilt || !toleranceValue) {
      return { remark: '' as const, pass: false };
    }

    const pass = observed <= tolerance;

    return {
      remark: pass ? 'Pass' : 'Fail' as 'Pass' | 'Fail',
      pass,
    };
  }, [observedTilt, toleranceValue, toleranceOperator]);

  const finalResult = evaluation.remark === 'Pass' ? 'PASS' :
    evaluation.remark === 'Fail' ? 'FAIL' : 'PENDING';

  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, tubeId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          if (data.techniqueFactors) {
            setTechniqueRow({
              id: '1',
              fcd: String(data.techniqueFactors.fcd ?? ''),
              kv: String(data.techniqueFactors.kv ?? ''),
              mas: String(data.techniqueFactors.mas ?? ''),
            });
          }
          if (data.observedTilt) {
            setObservedTilt(String(data.observedTilt.value ?? ''));
          }
          if (data.tolerance) {
            setToleranceOperator(data.tolerance.operator || '<=');
            setToleranceValue(String(data.tolerance.value ?? '2'));
          }
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load Central Beam Alignment data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, propTestId, tubeId]);

  const updateTechnique = (field: keyof TechniqueRow, value: string) => {
    setTechniqueRow(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!serviceId) return toast.error("Service ID missing");

    const payload = {
      techniqueFactors: {
        fcd: parseFloat(techniqueRow.fcd) || 0,
        kv: parseFloat(techniqueRow.kv) || 0,
        mas: parseFloat(techniqueRow.mas) || 0,
      },
      observedTilt: {
        value: parseFloat(observedTilt) || 0,
        remark: evaluation.remark,
      },
      tolerance: {
        operator: toleranceOperator,
        value: parseFloat(toleranceValue) || 0,
      },
      finalResult,
      tubeId: tubeId || null,
    };

    setIsSaving(true);
    try {
      let res;
      if (testId) {
        res = await updateCentralBeamAlignmentForInventionalRadiology(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addCentralBeamAlignmentForInventionalRadiology(serviceId, payload);
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
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Central Beam Alignment Test</h2>
        </div>
        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : isViewOnly
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-6 h-6" />
              {buttonText}
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        <h3 className="px-8 py-5 text-xl font-bold bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          Technique Factors Used
        </h3>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">FCD (cm)</label>
              <input
                type="number"
                value={techniqueRow.fcd}
                onChange={(e) => updateTechnique('fcd', e.target.value)}
                disabled={isViewOnly}
                className="w-full px-6 py-4 text-center text-lg font-semibold border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-300 transition-all"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">kV</label>
              <input
                type="number"
                value={techniqueRow.kv}
                onChange={(e) => updateTechnique('kv', e.target.value)}
                disabled={isViewOnly}
                className="w-full px-6 py-4 text-center text-lg font-semibold border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-300 transition-all"
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">mAs</label>
              <input
                type="number"
                step="0.1"
                value={techniqueRow.mas}
                onChange={(e) => updateTechnique('mas', e.target.value)}
                disabled={isViewOnly}
                className="w-full px-6 py-4 text-center text-lg font-semibold border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-300 transition-all"
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        <h3 className="px-8 py-5 text-xl font-bold bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          Measured Central Beam Tilt
        </h3>
        <div className="p-12">
          <div className="flex flex-col items-center gap-10">
            <p className="text-lg text-gray-700 text-center max-w-3xl">
              Observe the separation of the two steel ball images on the radiograph and measure the central beam tilt angle.
            </p>

            <div className="flex items-center gap-10">
              <span className="text-2xl font-bold text-purple-800">Observed Tilt:</span>
              <input
                type="number"
                step="0.1"
                value={observedTilt}
                onChange={(e) => setObservedTilt(e.target.value)}
                disabled={isViewOnly}
                className="w-48 px-8 py-6 text-center text-4xl font-extrabold text-purple-900 border-4 border-purple-500 rounded-2xl focus:ring-8 focus:ring-purple-300 transition-all"
                placeholder="1.8"
              />
              <span className="text-6xl font-extrabold text-purple-700">°</span>
            </div>

            <div className="mt-8">
              <span className={`px-16 py-8 rounded-full text-3xl font-bold shadow-lg border-4 ${evaluation.remark === 'Pass'
                  ? 'bg-green-100 text-green-800 border-green-500'
                  : evaluation.remark === 'Fail'
                    ? 'bg-red-100 text-red-800 border-red-500'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}>
                {evaluation.remark || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-4 border-indigo-500 rounded-3xl p-12 text-center shadow-2xl">
        <h3 className="text-3xl font-bold text-indigo-900 mb-10">Acceptance Criteria</h3>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <span className="text-2xl font-bold text-indigo-800">Central beam tilt must be</span>

          <div className="relative">
            <select
              value={toleranceOperator}
              onChange={(e) => setToleranceOperator(e.target.value as any)}
              disabled={isViewOnly}
              className="appearance-none bg-white border-4 border-indigo-600 rounded-2xl px-10 py-6 pr-16 font-extrabold text-indigo-900 text-3xl focus:ring-8 focus:ring-indigo-300"
            >
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none text-indigo-700" />
          </div>

          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewOnly}
            className="w-48 px-10 py-6 text-center text-4xl font-extrabold text-indigo-900 border-4 border-indigo-600 rounded-2xl focus:ring-8 focus:ring-indigo-300"
            placeholder="2"
          />
          <span className="text-7xl font-extrabold text-indigo-800">°</span>
        </div>

        <div className="mt-12">
          <p className="text-2xl font-bold text-indigo-900">
            Final Result: <span className={`ml-4 px-8 py-4 rounded-full text-3xl ${finalResult === 'PASS' ? 'bg-green-500 text-white' :
                finalResult === 'FAIL' ? 'bg-red-500 text-white' :
                  'bg-gray-400 text-white'
              }`}>
              {finalResult}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CentralBeamAlignment;
