// src/components/TestTables/EffectiveFocalSpot.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addEffectiveFocalSpotForRadiographyPortable,
  getEffectiveFocalSpotByServiceIdForRadiographyPortable,
  getEffectiveFocalSpotByTestIdForRadiographyPortable,
  updateEffectiveFocalSpotForRadiographyPortable,
} from '../../../../../../api';

interface FocalSpotRow {
  id: string;
  focusType: 'Large Focus' | 'Small Focus';
  statedNominal: string;
  measuredNominal: string;
  remark: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
  csvData?: any;
  refreshKey?: number;
}

const EffectiveFocalSpot: React.FC<Props> = ({ serviceId, testId: propTestId, onTestSaved, csvData, refreshKey }) => {
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
      statedNominal: '2',
      measuredNominal: '',
      remark: '',
    },
    {
      id: 'small',
      focusType: 'Small Focus',
      statedNominal: '0.6',
      measuredNominal: '',
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
    const mUpper = parseFloat(mediumUpper) || 1.5;

    const tSmall = parseFloat(tolSmallMul) || 0.5;
    const tMedium = parseFloat(tolMediumMul) || 0.4;
    const tLarge = parseFloat(tolLargeMul) || 0.3;

    return rows.map(row => {
      const stated = parseFloat(row.statedNominal) || 0;
      const measured = parseFloat(row.measuredNominal) || 0;

      let multiplier = tMedium;
      if (stated < sLimit) multiplier = tSmall;
      else if (stated > mUpper) multiplier = tLarge;

      const allowed = stated + stated * multiplier;
      const roundedAllowed = Number.isFinite(allowed) ? Number(allowed.toFixed(4)) : allowed;
      const roundedMeasured = Number.isFinite(measured) ? Number(measured.toFixed(4)) : measured;
      const isPass = roundedMeasured <= roundedAllowed + 1e-9 && measured > 0;

      return {
        ...row,
        remark: measured > 0 ? (isPass ? 'Pass' : 'Fail') : ''
      };
    });
  }, [rows, tolSmallMul, smallLimit, tolMediumMul, mediumLower, mediumUpper, tolLargeMul]);

  const finalResult = processedRows.every(r => r.remark === 'Pass')
    ? 'PASS'
    : processedRows.some(r => r.remark === 'Fail')
      ? 'FAIL'
      : 'PENDING';

  // === Load CSV Data ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Table 1: FCD
      const fcdData = csvData.find((row: any) => row['Field Name']?.toLowerCase().includes('fcd'));
      if (fcdData) {
        setFcd(fcdData.Value);
      }

      // Table 2: Measurements
      const t2DataGrouped: any = {};
      csvData.filter((row: any) => row['Field Name'].startsWith('Table2_')).forEach((row: any) => {
        const fieldName = row['Field Name'].replace('Table2_', '');
        const rowIndex = row['Row Index'] || 0;
        if (!t2DataGrouped[rowIndex]) t2DataGrouped[rowIndex] = {};
        t2DataGrouped[rowIndex][fieldName] = row.Value;
      });

      const rowIndices = Object.keys(t2DataGrouped).sort((a, b) => Number(a) - Number(b));
      if (rowIndices.length > 0) {
          const newRows = rowIndices.map(idx => {
          const r = t2DataGrouped[idx];
          const focusType = r.focusType || '';
            const statedNominal =
              r.statedNominal != null && String(r.statedNominal).trim() !== ''
                ? Number(r.statedNominal)
                : (r.statedWidth != null && r.statedHeight != null
                    ? (Number(r.statedWidth) + Number(r.statedHeight)) / 2
                    : r.statedWidth ?? r.statedHeight);
            const measuredNominal =
              r.measuredNominal != null && String(r.measuredNominal).trim() !== ''
                ? Number(r.measuredNominal)
                : (r.measuredWidth != null && r.measuredHeight != null
                    ? (Number(r.measuredWidth) + Number(r.measuredHeight)) / 2
                    : r.measuredWidth ?? r.measuredHeight);
          return {
            id: focusType === 'Large Focus' ? 'large' : focusType === 'Small Focus' ? 'small' : idx,
            focusType: focusType,
              statedNominal: String(statedNominal ?? ''),
              measuredNominal: String(measuredNominal ?? ''),
            remark: r.remark || '',
          };
        });

        if (newRows.length > 0) {
          // We might need to ensure both large and small are present, but if Excel has it mapped correctly, it's fine.
          // Just set whatever comes from csv
          setRows(newRows as FocalSpotRow[]);
        }
      }

      setIsEditing(true);
      setIsSaved(false);
    }
  }, [csvData, refreshKey]);

  // Load existing test data
  useEffect(() => {
    if (!serviceId) return;
    const loadTest = async () => {
      try {
        const res = await getEffectiveFocalSpotByServiceIdForRadiographyPortable(serviceId);
        if (res?.data) {
          const data = res.data;
          setTestId(data._id);
          if (data.fcd) setFcd(String(data.fcd));
          if (data.toleranceCriteria) {
            setTolSmallMul(String(data.toleranceCriteria.small?.multiplier || '0.5'));
            setSmallLimit(String(data.toleranceCriteria.small?.upperLimit || '0.8'));
            setTolMediumMul(String(data.toleranceCriteria.medium?.multiplier || '0.4'));
            setMediumLower(String(data.toleranceCriteria.medium?.lowerLimit || '0.8'));
            setMediumUpper(String(data.toleranceCriteria.medium?.upperLimit || '1.5'));
            setTolLargeMul(String(data.toleranceCriteria.large?.multiplier || '0.3'));
          }
          if (data.focalSpots && data.focalSpots.length > 0) {
            setRows(
              data.focalSpots.slice(0, 2).map((spot: any, idx: number) => {
                const statedFromLegacy =
                  spot.statedWidth != null && spot.statedHeight != null
                    ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                    : spot.statedWidth ?? spot.statedHeight;
                const measuredFromLegacy =
                  spot.measuredWidth != null && spot.measuredHeight != null
                    ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                    : spot.measuredWidth ?? spot.measuredHeight;
                return {
                  id: idx === 0 ? 'large' : 'small',
                  focusType: spot.focusType || (idx === 0 ? 'Large Focus' : 'Small Focus'),
                  statedNominal: String(spot.statedNominal ?? statedFromLegacy ?? ''),
                  measuredNominal: String(spot.measuredNominal ?? measuredFromLegacy ?? ''),
                  remark: spot.remark || '',
                };
              })
            );
          }
          setIsSaved(true);
          setIsEditing(false);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error("Failed to load test data:", err);
        }
      }
    };
    loadTest();
  }, [serviceId]);

  const handleSave = async () => {
    if (!serviceId) return toast.error("Service ID missing");
    setIsSaving(true);
    try {
      const payload = {
        fcd: parseFloat(fcd) || 100,
        toleranceCriteria: {
          small: {
            multiplier: parseFloat(tolSmallMul) || 0.5,
            upperLimit: parseFloat(smallLimit) || 0.8,
          },
          medium: {
            multiplier: parseFloat(tolMediumMul) || 0.4,
            lowerLimit: parseFloat(mediumLower) || 0.8,
            upperLimit: parseFloat(mediumUpper) || 1.5,
          },
          large: {
            multiplier: parseFloat(tolLargeMul) || 0.3,
            lowerLimit: parseFloat(mediumUpper) || 1.5,
          },
        },
        focalSpots: processedRows.map(row => ({
          focusType: row.focusType,
          statedNominal: parseFloat(row.statedNominal) || 0,
          measuredNominal: parseFloat(row.measuredNominal) || 0,
          // Legacy compatibility
          statedWidth: parseFloat(row.statedNominal) || 0,
          statedHeight: parseFloat(row.statedNominal) || 0,
          measuredWidth: parseFloat(row.measuredNominal) || 0,
          measuredHeight: parseFloat(row.measuredNominal) || 0,
          remark: row.remark,
        })),
        finalResult: finalResult,
      };

      let result;
      if (testId) {
        result = await updateEffectiveFocalSpotForRadiographyPortable(testId, payload);
      } else {
        result = await addEffectiveFocalSpotForRadiographyPortable(serviceId, payload);
        if (result?.data?._id) {
          setTestId(result.data._id);
          onTestSaved?.(result.data._id);
        }
      }

      toast.success(testId ? "Updated successfully!" : "Saved successfully!");
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
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
        <h3 className="text-lg font-bold text-gray-800 mb-4">FFD (cm)</h3>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 ">Focus</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 ">Stated Focal Spot of Tube (f)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 ">Measured Focal Spot (Nominal)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900  leading-tight">
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
                    <input
                      type="number"
                      step="0.1"
                      value={row.statedNominal}
                      onChange={(e) => updateRow(row.id, 'statedNominal', e.target.value)}
                      disabled={isViewOnly}
                      className="w-32 px-4 py-2 text-center border rounded-lg font-bold focus:ring-2 focus:ring-purple-500"
                      placeholder="f"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.01"
                      value={row.measuredNominal}
                      onChange={(e) => updateRow(row.id, 'measuredNominal', e.target.value)}
                      disabled={isViewOnly}
                      className="w-32 px-4 py-2 text-center border-2 border-purple-400 rounded-lg font-bold focus:ring-4 focus:ring-purple-300"
                      placeholder="Nominal"
                    />
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