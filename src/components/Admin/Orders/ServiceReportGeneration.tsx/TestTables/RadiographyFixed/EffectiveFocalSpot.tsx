// src/components/TestTables/EffectiveFocalSpot.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FocalSpotRow {
  id: string;
  focusType: 'Large Focus' | 'Small Focus';
  statedWidth: string;
  statedHeight: string;
  measuredWidth: string;
  measuredHeight: string;
  remark: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const EffectiveFocalSpot: React.FC<Props> = ({ serviceId, testId: propTestId, onTestSaved }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [fcd, setFcd] = useState<string>('100');

  // Editable tolerance values in header
  const [tolSmallMul, setTolSmallMul] = useState<string>('0.5');
  const [smallLimit, setSmallLimit] = useState<string>('0.8');

  const [tolMediumMul, setTolMediumMul] = useState<string>('0.4');
  const [mediumLower, setMediumLower] = useState<string>('0.8');
  const [mediumUpper, setMediumUpper] = useState<string>('1.5');

  const [tolLargeMul, setTolLargeMul] = useState<string>('0.3');

  // CORRECT: mutable state
  const [rows, setRows] = useState<FocalSpotRow[]>([
    {
      id: 'large',
      focusType: 'Large Focus',
      statedWidth: '1.2',
      statedHeight: '1.2',
      measuredWidth: '',
      measuredHeight: '',
      remark: '',
    },
    {
      id: 'small',
      focusType: 'Small Focus',
      statedWidth: '0.6',
      statedHeight: '0.6',
      measuredWidth: '',
      measuredHeight: '',
      remark: '',
    },
  ]);

  // Update any field in a row
  const updateRow = (id: string, field: keyof FocalSpotRow, value: string) => {
    setRows(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Auto-calculate Pass/Fail
  const processedRows = useMemo(() => {
    const sLimit = parseFloat(smallLimit) || 0.8;
    const mLower = parseFloat(mediumLower) || 0.8;
    const mUpper = parseFloat(mediumUpper) || 1.5;

    const tSmall = parseFloat(tolSmallMul) || 0.5;
    const tMedium = parseFloat(tolMediumMul) || 0.4;
    const tLarge = parseFloat(tolLargeMul) || 0.3;

    return rows.map(row => {
      const sw = parseFloat(row.statedWidth) || 0;
      const sh = parseFloat(row.statedHeight) || 0;
      const mw = parseFloat(row.measuredWidth) || 0;
      const mh = parseFloat(row.measuredHeight) || 0;

      const avgStated = (sw + sh) / 2;
      const avgMeasured = (mw + mh) / 2;

      let multiplier = tMedium;
      if (avgStated < sLimit) multiplier = tSmall;
      else if (avgStated > mUpper) multiplier = tLarge;

      const allowed = avgStated + avgStated * multiplier;
      const isPass = avgMeasured <= allowed && mw > 0 && mh > 0;

      return {
        ...row,
        remark: mw > 0 && mh > 0
          ? (isPass ? 'Pass' : 'Fail')
          : ''
      };
    });
  }, [rows, tolSmallMul, smallLimit, tolMediumMul, mediumLower, mediumUpper, tolLargeMul]);

  const finalResult = processedRows.every(r => r.remark === 'Pass')
    ? 'PASS'
    : processedRows.some(r => r.remark === 'Fail')
      ? 'FAIL'
      : 'PENDING';

  const handleSave = async () => {
    if (!serviceId) return toast.error("Service ID missing");
    setIsSaving(true);
    try {
      toast.success(testId ? "Updated successfully!" : "Saved successfully!");
      setIsSaved(true);
      setIsEditing(false);
      if (!testId) {
        const newId = "mock-focalspot-123";
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
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Effective Focal Spot Size</h2>
        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all shadow-md ${isSaving ? "bg-gray-400 cursor-not-allowed" : isViewOnly ? "bg-orange-600 hover:bg-orange-700" : "bg-teal-600 hover:bg-teal-700"
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
              {!isSaved ? "Save Test" : isEditing ? "Update Test" : "Edit Test"}
            </>
          )}
        </button>
      </div>

      {/* FCD */}
      <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Focal Spot Distance (FCD)</h3>
        <div className="flex items-center justify-center gap-4">
          <input
            type="number"
            value={fcd}
            onChange={(e) => setFcd(e.target.value)}
            disabled={isViewOnly}
            className="w-40 px-5 py-3 text-2xl font-bold text-center border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-300"
          />
          <span className="text-2xl font-bold text-blue-700">cm</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-bold bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          Effective Focal Spot Size Measurement
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Focus</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Stated Value (mm × mm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase">Measured Value (mm × mm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase leading-tight">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>+</span>
                      <input type="number" step="0.1" value={tolSmallMul} onChange={(e) => setTolSmallMul(e.target.value)} disabled={isViewOnly}
                        className="w-14 px-2 py-1 text-center border border-green-600 rounded font-bold text-green-700" />
                      <span>f for f {"<"}</span>
                      <input type="number" step="0.1" value={smallLimit} onChange={(e) => setSmallLimit(e.target.value)} disabled={isViewOnly}
                        className="w-16 px-2 py-1 text-center border border-green-600 rounded font-bold text-green-700" />
                      <span>mm</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>+</span>
                      <input type="number" step="0.1" value={tolMediumMul} onChange={(e) => setTolMediumMul(e.target.value)} disabled={isViewOnly}
                        className="w-14 px-2 py-1 text-center border border-green-600 rounded font-bold text-green-700" />
                      <span>f for</span>
                      <input type="number" step="0.1" value={mediumLower} onChange={(e) => setMediumLower(e.target.value)} disabled={isViewOnly}
                        className="w-16 px-2 py-1 text-center border border-green-600 rounded font-bold text-green-700" />
                      <span>≤ f ≤</span>
                      <input type="number" step="0.1" value={mediumUpper} onChange={(e) => setMediumUpper(e.target.value)} disabled={isViewOnly}
                        className="w-16 px-2 py-1 text-center border border-green-600 rounded font-bold text-green-700" />
                      <span>mm</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>+</span>
                      <input type="number" step="0.1" value={tolLargeMul} onChange={(e) => setTolLargeMul(e.target.value)} disabled={isViewOnly}
                        className="w-14 px-2 py-1 text-center border border-green-600 rounded font-bold text-green-700" />
                      <span>f for f {">"}</span>
                      <input type="number" step="0.1" value={mediumUpper} disabled className="w-16 px-2 py-1 text-center bg-gray-100 text-gray-500" />
                      <span>mm</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 border-t">
                  <td className="px-6 py-4 font-bold text-gray-800">{row.focusType}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input type="number" step="0.1" value={row.statedWidth} onChange={(e) => updateRow(row.id, 'statedWidth', e.target.value)} disabled={isViewOnly}
                        className="w-24 px-4 py-2 text-center border rounded-lg font-bold focus:ring-2 focus:ring-purple-500" />
                      <span className="text-xl font-bold">×</span>
                      <input type="number" step="0.1" value={row.statedHeight} onChange={(e) => updateRow(row.id, 'statedHeight', e.target.value)} disabled={isViewOnly}
                        className="w-24 px-4 py-2 text-center border rounded-lg font-bold focus:ring-2 focus:ring-purple-500" />
                      <span className="text-sm font-medium text-gray-600">mm</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.measuredWidth}
                        onChange={(e) => updateRow(row.id, 'measuredWidth', e.target.value)}
                        disabled={isViewOnly}
                        className="w-28 px-4 py-2 text-center border-2 border-purple-400 rounded-lg font-bold focus:ring-4 focus:ring-purple-300"
                        placeholder="0.00"
                      />
                      <span className="text-xl font-bold">×</span>
                      <input
                        type="number"
                        step="0.01"
                        value={row.measuredHeight}
                        onChange={(e) => updateRow(row.id, 'measuredHeight', e.target.value)}
                        disabled={isViewOnly}
                        className="w-28 px-4 py-2 text-center border-2 border-purple-400 rounded-lg font-bold focus:ring-4 focus:ring-purple-300"
                        placeholder="0.00"
                      />
                      <span className="text-sm font-medium text-gray-600">mm</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-12 py-4 rounded-full text-xl font-bold min-w-36 ${row.remark === 'Pass'
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

      {/* Final Result */}
   
    </div>
  );
};

export default EffectiveFocalSpot;