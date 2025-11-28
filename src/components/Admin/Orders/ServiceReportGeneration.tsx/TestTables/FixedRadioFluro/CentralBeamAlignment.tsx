// src/components/TestTables/CentralBeamAlignment.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Edit3, Save, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface TechniqueRow {
  id: string;
  fcd: string;
  kv: string;
  mas: string;
}

interface TiltRow {
  id: string;
  operator: '<' | '>' | '<=' | '>=' | '=';
  value: string; // degrees
  remark: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const CentralBeamAlignment: React.FC<Props> = ({ serviceId, testId: propTestId, onTestSaved }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Table 1: Technique Factors (Fixed single row — no add/remove)
  const [techniqueRow, setTechniqueRow] = useState<TechniqueRow>({
    id: '1',
    fcd: '100',
    kv: '80',
    mas: '10',
  });

  // Table 2: Observed Tilt (one row)
  const [tiltRow, setTiltRow] = useState<TiltRow>({
    id: '1',
    operator: '<=',
    value: '2',
    remark: '',
  });

  // Tolerance outside table
  const [toleranceOperator, setToleranceOperator] = useState<'<' | '>' | '<=' | '>=' | '='>('<=');
  const [toleranceValue, setToleranceValue] = useState<string>('2');

  const operators = ['<', '>', '<=', '>=', '='] as const;

  // Auto calculate remark
  const processedTilt = useMemo(() => {
    const observed = parseFloat(tiltRow.value) || 0;
    const tolerance = parseFloat(toleranceValue) || 0;

    if (!tiltRow.value || !toleranceValue) return { ...tiltRow, remark: '' };

    let pass = false;
    if (tiltRow.operator === '<') pass = observed < tolerance;
    if (tiltRow.operator === '>') pass = observed > tolerance;
    if (tiltRow.operator === '<=') pass = observed <= tolerance;
    if (tiltRow.operator === '>=') pass = observed >= tolerance;
    if (tiltRow.operator === '=') pass = Math.abs(observed - tolerance) < 0.01;

    return { ...tiltRow, remark: pass ? 'Pass' : 'Fail' as 'Pass' | 'Fail' };
  }, [tiltRow, toleranceValue]);

  const finalResult = processedTilt.remark === 'Pass' ? 'PASS' :
    processedTilt.remark === 'Fail' ? 'FAIL' : 'PENDING';

  // Update technique fields
  const updateTechnique = (field: keyof TechniqueRow, value: string) => {
    setTechniqueRow(prev => ({ ...prev, [field]: value }));
  };

  const updateTilt = (field: 'operator' | 'value', value: string) => {
    setTiltRow(prev => ({ ...prev, [field]: value as any }));
  };

  // Save handler
  const handleSave = async () => {
    if (!serviceId) return toast.error("Service ID missing");

    const payload = {
      techniqueFactors: {
        fcd: parseFloat(techniqueRow.fcd) || 0,
        kv: parseFloat(techniqueRow.kv) || 0,
        mas: parseFloat(techniqueRow.mas) || 0,
      },
      observedTilt: {
        operator: tiltRow.operator,
        value: parseFloat(tiltRow.value) || 0,
        remark: processedTilt.remark,
      },
      tolerance: {
        operator: toleranceOperator,
        value: parseFloat(toleranceValue) || 0,
      },
      finalResult,
    };

    setIsSaving(true);
    try {
      toast.success(testId ? "Updated successfully!" : "Saved successfully!");
      setIsSaved(true);
      setIsEditing(false);
      if (!testId) {
        const newId = "mock-central-beam-123";
        setTestId(newId);
        onTestSaved?.(newId);
      }
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => setIsEditing(true);
  const isViewOnly = isSaved && !isEditing;
  const buttonText = !isSaved ? "Save Test" : isEditing ? "Update Test" : "Edit Test";
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Central Beam Alignment</h2>
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

      {/* Table 1: Technique Factors (Single Fixed Row) */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-bold bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          Technique Factors
        </h3>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">FCD (cm)</label>
              <input
                type="number"
                value={techniqueRow.fcd}
                onChange={(e) => updateTechnique('fcd', e.target.value)}
                disabled={isViewOnly}
                className="w-full px-4 py-3 text-center border-2 border-blue-300 rounded-lg font-medium focus:ring-4 focus:ring-blue-300"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">kV</label>
              <input
                type="number"
                value={techniqueRow.kv}
                onChange={(e) => updateTechnique('kv', e.target.value)}
                disabled={isViewOnly}
                className="w-full px-4 py-3 text-center border-2 border-blue-300 rounded-lg font-medium focus:ring-4 focus:ring-blue-300"
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">mAs</label>
              <input
                type="number"
                step="0.1"
                value={techniqueRow.mas}
                onChange={(e) => updateTechnique('mas', e.target.value)}
                disabled={isViewOnly}
                className="w-full px-4 py-3 text-center border-2 border-blue-300 rounded-lg font-medium focus:ring-4 focus:ring-blue-300"
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table 2: Observed Tilt */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-bold bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
        </h3>
        <div className="p-8">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={tiltRow.operator}
                  onChange={(e) => updateTilt('operator', e.target.value)}
                  disabled={isViewOnly}
                  className="appearance-none bg-white border-2 border-purple-400 rounded-lg px-6 py-4 pr-10 font-bold text-purple-900 focus:ring-4 focus:ring-purple-300"
                >
                  {operators.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none text-purple-600" />
              </div>
              <input
                type="number"
                step="0.1"
                value={tiltRow.value}
                onChange={(e) => updateTilt('value', e.target.value)}
                disabled={isViewOnly}
                className="w-32 px-6 py-4 text-center border-2 border-purple-400 rounded-lg font-extrabold text-purple-900 focus:ring-4 focus:ring-purple-300"
                placeholder="2"
              />
              <span className="text-3xl font-extrabold text-purple-700">°</span>
            </div>
            <div>
              <span className={`px-10 py-5 rounded-full text-xl font-bold ${processedTilt.remark === 'Pass'
                  ? 'bg-green-100 text-green-800'
                  : processedTilt.remark === 'Fail'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                {processedTilt.remark || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tolerance Field Outside Table */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-4 border-indigo-400 rounded-2xl p-10 text-center shadow-xl">
        <h3 className="text-2xl font-bold text-indigo-900 mb-8">Acceptance Criteria (Tolerance)</h3>
        <div className="flex items-center justify-center gap-6">
          <span className="text-xl font-medium text-indigo-800">Central beam tilt must be</span>
          <div className="relative">
            <select
              value={toleranceOperator}
              onChange={(e) => setToleranceOperator(e.target.value as any)}
              disabled={isViewOnly}
              className="appearance-none bg-white border-4 border-indigo-600 rounded-xl px-8 py-5 pr-14 font-extrabold text-indigo-900 text-2xl focus:ring-8 focus:ring-indigo-300"
            >
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none text-indigo-700" />
          </div>
          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewOnly}
            className="w-40 px-8 py-5 text-center border-4 border-indigo-600 rounded-xl font-extrabold text-indigo-900 text-2xl focus:ring-8 focus:ring-indigo-300"
            placeholder="2"
          />
          <span className="text-5xl font-extrabold text-indigo-800">°</span>
        </div>
      </div>

      {/* Final Result */}
    
    </div>
  );
};

export default CentralBeamAlignment;