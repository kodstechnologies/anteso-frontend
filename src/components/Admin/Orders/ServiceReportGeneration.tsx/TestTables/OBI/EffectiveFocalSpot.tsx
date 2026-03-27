// src/components/TestTables/EffectiveFocalSpot.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addEffectiveFocalSpotForOBI,
    getEffectiveFocalSpotByServiceIdForOBI,
    updateEffectiveFocalSpotForOBI,
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
    refreshKey?: number;
    initialData?: {
        fcd?: string;
        focalSpots?: Array<{
            focusType: string;
            statedNominal?: string;
            measuredNominal?: string;
            statedWidth: string;
            statedHeight: string;
            measuredWidth: string;
            measuredHeight: string;
        }>;
    };
}

const EffectiveFocalSpot: React.FC<Props> = ({ serviceId, testId: propTestId, onTestSaved, refreshKey, initialData }) => {
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

    const ensureTwoRows = (inputRows: FocalSpotRow[]): FocalSpotRow[] => {
        const defaults: FocalSpotRow[] = [
            { id: 'large', focusType: 'Large Focus', statedNominal: '2', measuredNominal: '', remark: '' },
            { id: 'small', focusType: 'Small Focus', statedNominal: '0.6', measuredNominal: '', remark: '' },
        ];
        return [0, 1].map((idx) => ({ ...defaults[idx], ...(inputRows[idx] || {}) }));
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
            const isPass = roundedMeasured <= roundedAllowed + 1e-9;

            // Remark logic: only show if measured values are entered
            const hasMeasured = measured > 0;

            return {
                ...row,
                remark: hasMeasured ? (isPass ? 'Pass' : 'Fail') : ''
            };
        });
    }, [rows, tolSmallMul, smallLimit, tolMediumMul, mediumLower, mediumUpper, tolLargeMul]);

    const finalResult = processedRows.every(r => r.remark === 'Pass' || r.remark === '') && processedRows.some(r => r.remark !== '')
        ? 'PASS'
        : processedRows.some(r => r.remark === 'Fail')
            ? 'FAIL'
            : 'PENDING';

    // Load CSV Initial Data
    useEffect(() => {
        if (initialData) {
            console.log('EffectiveFocalSpot: Loading initial data from CSV:', initialData);
            if (initialData.fcd) {
                setFcd(initialData.fcd);
            }
            if (initialData.focalSpots && initialData.focalSpots.length > 0) {
                setRows(
                    ensureTwoRows(
                        initialData.focalSpots.slice(0, 2).map((f, i) => {
                            const statedFromLegacy =
                                f.statedWidth != null && f.statedHeight != null
                                    ? (Number(f.statedWidth) + Number(f.statedHeight)) / 2
                                    : f.statedWidth ?? f.statedHeight;
                            const measuredFromLegacy =
                                f.measuredWidth != null && f.measuredHeight != null
                                    ? (Number(f.measuredWidth) + Number(f.measuredHeight)) / 2
                                    : f.measuredWidth ?? f.measuredHeight;
                            return {
                                id: i === 0 ? 'large' : 'small',
                                focusType: (f.focusType === 'Large' ? 'Large Focus' : f.focusType === 'Small' ? 'Small Focus' : (i === 0 ? 'Large Focus' : 'Small Focus')) as 'Large Focus' | 'Small Focus',
                                statedNominal: String(f.statedNominal ?? statedFromLegacy ?? ''),
                                measuredNominal: String(f.measuredNominal ?? measuredFromLegacy ?? ''),
                                remark: '' as 'Pass' | 'Fail' | '',
                            };
                        })
                    )
                );
            }
            setIsEditing(true);
            console.log('EffectiveFocalSpot: CSV data loaded into form');
        }
    }, [initialData]);

    // Load existing test data
    useEffect(() => {
        // Skip loading if we have initial CSV data
        if (initialData) {
            return;
        }

        if (!serviceId) return;
        const loadTest = async () => {
            try {
                const res = await getEffectiveFocalSpotByServiceIdForOBI(serviceId);
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
                            ensureTwoRows(
                                data.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                                    const statedFromLegacy =
                                        spot.statedWidth != null && spot.statedHeight != null
                                            ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                                            : spot.statedWidth ?? spot.statedHeight;
                                    const measuredFromLegacy =
                                        spot.measuredWidth != null && spot.measuredHeight != null
                                            ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                                            : spot.measuredWidth ?? spot.measuredHeight;
                                    return {
                                        id: spot._id || (i === 0 ? 'large' : 'small'),
                                        focusType: spot.focusType || (i === 0 ? 'Large Focus' : 'Small Focus'),
                                        statedNominal: String(spot.statedNominal ?? statedFromLegacy ?? ''),
                                        measuredNominal: String(spot.measuredNominal ?? measuredFromLegacy ?? ''),
                                        remark: spot.remark || '',
                                    };
                                })
                            )
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
                finalResult: finalResult === 'PENDING' ? 'FAIL' : finalResult,
            };

            let result;
            if (testId) {
                result = await updateEffectiveFocalSpotForOBI(testId, payload);
            } else {
                result = await addEffectiveFocalSpotForOBI(serviceId, payload);
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">FFD</h3>
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
                <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <h3 className="text-lg font-bold">
                        Effective Focal Spot Size Measurement
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-purple-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 ">Focus</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 ">Stated Focal Spot of Tube (f)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 ">Measured Focal Spot (Nominal)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-purple-900  leading-tight">
                                    <div className="space-y-3 text-sm normal-case">
                                        <div className="font-bold">Tolerance</div>
                                        <div className="flex items-center gap-2 flex-wrap bg-white/50 px-2 py-1 rounded">
                                            <span className="font-semibold">1.</span>
                                            <span className="font-bold">+</span>
                                            <input type="number" step="0.1" value={tolSmallMul} onChange={(e) => setTolSmallMul(e.target.value)} disabled={isViewOnly}
                                                className="w-14 px-1 py-0.5 text-center border border-purple-300 rounded text-purple-900 font-bold bg-white" />
                                            <span className="font-medium">f for f {"<"}</span>
                                            <input type="number" step="0.1" value={smallLimit} onChange={(e) => setSmallLimit(e.target.value)} disabled={isViewOnly}
                                                className="w-16 px-1 py-0.5 text-center border border-purple-300 rounded text-purple-900 font-bold bg-white" />
                                            <span className="text-gray-600">mm</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap bg-white/50 px-2 py-1 rounded">
                                            <span className="font-semibold">2.</span>
                                            <span className="font-bold">+</span>
                                            <input type="number" step="0.1" value={tolMediumMul} onChange={(e) => setTolMediumMul(e.target.value)} disabled={isViewOnly}
                                                className="w-14 px-1 py-0.5 text-center border border-purple-300 rounded text-purple-900 font-bold bg-white" />
                                            <span className="font-medium">f for</span>
                                            <input type="number" step="0.1" value={mediumLower} onChange={(e) => setMediumLower(e.target.value)} disabled={isViewOnly}
                                                className="w-16 px-1 py-0.5 text-center border border-purple-300 rounded text-purple-900 font-bold bg-white" />
                                            <span className="font-medium">≤ f ≤</span>
                                            <input type="number" step="0.1" value={mediumUpper} onChange={(e) => setMediumUpper(e.target.value)} disabled={isViewOnly}
                                                className="w-16 px-1 py-0.5 text-center border border-purple-300 rounded text-purple-900 font-bold bg-white" />
                                            <span className="text-gray-600">mm</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap bg-white/50 px-2 py-1 rounded">
                                            <span className="font-semibold">3.</span>
                                            <span className="font-bold">+</span>
                                            <input type="number" step="0.1" value={tolLargeMul} onChange={(e) => setTolLargeMul(e.target.value)} disabled={isViewOnly}
                                                className="w-14 px-1 py-0.5 text-center border border-purple-300 rounded text-purple-900 font-bold bg-white" />
                                            <span className="font-medium">f for f {">"}</span>
                                            <input type="number" step="0.1" value={mediumUpper} disabled className="w-16 px-1 py-0.5 text-center bg-gray-200 text-gray-500 border border-gray-300 rounded font-bold" />
                                            <span className="text-gray-600">mm</span>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 border-t">
                                    <td className="px-6 py-4 font-bold text-gray-800">
                                        {isViewOnly ? (
                                            <span className="text-gray-900">{row.focusType}</span>
                                        ) : (
                                            <select
                                                value={row.focusType}
                                                onChange={(e) => updateRow(row.id, 'focusType', e.target.value)}
                                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white"
                                            >
                                                <option value="Large Focus">Large Focus</option>
                                                <option value="Small Focus">Small Focus</option>
                                            </select>
                                        )}
                                    </td>
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
                                        <span className={`inline-block px-8 py-3 rounded-full text-lg font-bold min-w-28 ${row.remark === 'Pass'
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