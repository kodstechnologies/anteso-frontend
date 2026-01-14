// components/TestTables/MeasurementOfOperatingPotential.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import {
    addMeasurementOfOperatingPotential,
    getMeasurementOfOperatingPotentialByTestId,
    getMeasurementOfOperatingPotentialByServiceId,
    updateMeasurementOfOperatingPotential,
} from '../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
    time: string;
    sliceThickness: string;
}

interface Table2Row {
    id: string;
    setKV: string;
    ma10: string;
    ma100: string;
    ma200: string;
    avgKvp: string;
    remarks: 'Pass' | 'Fail' | '';
    failedCells?: {
        ma10: boolean;
        ma100: boolean;
        ma200: boolean;
        avgKvp: boolean;
    };
}

interface Props {
    serviceId: string;
    testId?: string;
    tubeId?: 'A' | 'B' | null;
    onRefresh?: () => void;
    csvData?: any[];
}

const MeasurementOfOperatingPotential: React.FC<Props> = ({ serviceId, testId: propTestId, tubeId, onRefresh, csvData }) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);

    // Table 1: Only 1 row
    const [table1Row, setTable1Row] = useState<Table1Row>({ time: '', sliceThickness: '' });

    // Table 2: Dynamic rows
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        { id: '1', setKV: '', ma10: '', ma100: '', ma200: '', avgKvp: '', remarks: '', failedCells: { ma10: false, ma100: false, ma200: false, avgKvp: false } },
    ]);

    const [toleranceValue, setToleranceValue] = useState<string>('5');
    const [toleranceType, setToleranceType] = useState<'percent' | 'absolute'>('percent');
    const [toleranceSign, setToleranceSign] = useState<'plus' | 'minus' | 'both'>('both');

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // === Table 2: Add/Remove ===
    const addTable2Row = () => {
        setTable2Rows((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                setKV: '',
                ma10: '',
                ma100: '',
                ma200: '',
                avgKvp: '',
                remarks: '',
                failedCells: { ma10: false, ma100: false, ma200: false, avgKvp: false },
            },
        ]);
    };

    const removeTable2Row = (id: string) => {
        if (table2Rows.length <= 1) return;
        setTable2Rows((prev) => prev.filter((r) => r.id !== id));
    };

    // Helper function to check if a value is within tolerance
    const checkTolerance = useCallback((measured: number, setKV: number): boolean => {
        if (isNaN(measured) || isNaN(setKV) || setKV <= 0) return false;

        if (toleranceType === 'percent') {
            const tolerance = parseFloat(toleranceValue) || 0;
            const allowedDiff = (setKV * tolerance) / 100;
            if (toleranceSign === 'plus') return measured <= setKV + allowedDiff;
            else if (toleranceSign === 'minus') return measured >= setKV - allowedDiff;
            else return Math.abs(measured - setKV) <= allowedDiff;
        } else {
            const tolerance = parseFloat(toleranceValue) || 0;
            if (toleranceSign === 'plus') return measured <= setKV + tolerance;
            else if (toleranceSign === 'minus') return measured >= setKV - tolerance;
            else return Math.abs(measured - setKV) <= tolerance;
        }
    }, [toleranceValue, toleranceType, toleranceSign]);

    // Helper function to calculate row values (avg, remarks, failedCells)
    const calculateRowValues = useCallback((row: Table2Row): Table2Row => {
        const setKV = parseFloat(row.setKV);
        if (isNaN(setKV) || setKV <= 0) {
            return { ...row, avgKvp: '', remarks: '', failedCells: { ma10: false, ma100: false, ma200: false, avgKvp: false } };
        }

        // Check each mA value individually
        const ma10Value = parseFloat(row.ma10);
        const ma100Value = parseFloat(row.ma100);
        const ma200Value = parseFloat(row.ma200);

        const ma10Pass = isNaN(ma10Value) || checkTolerance(ma10Value, setKV);
        const ma100Pass = isNaN(ma100Value) || checkTolerance(ma100Value, setKV);
        const ma200Pass = isNaN(ma200Value) || checkTolerance(ma200Value, setKV);

        // Calculate average
        const values = [ma10Value, ma100Value, ma200Value]
            .filter((v) => !isNaN(v));
        const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '';

        // Check average value
        const avgPass = avg === '' || checkTolerance(parseFloat(avg), setKV);

        // Determine failed cells
        const failedCells = {
            ma10: !isNaN(ma10Value) && !ma10Pass,
            ma100: !isNaN(ma100Value) && !ma100Pass,
            ma200: !isNaN(ma200Value) && !ma200Pass,
            avgKvp: avg !== '' && !avgPass,
        };

        // Overall pass/fail: if any cell fails, the entire row fails
        const overallPass = ma10Pass && ma100Pass && ma200Pass && avgPass;

        return {
            ...row,
            avgKvp: avg,
            remarks: overallPass ? 'Pass' : 'Fail',
            failedCells,
        };
    }, [checkTolerance]);

    // === Auto-calculate Avg & Pass/Fail when tolerance settings change ===
    useEffect(() => {
        setTable2Rows((prev) =>
            prev.map((row) => calculateRowValues(row))
        );
    }, [calculateRowValues]);

    const updateTable2 = (
        id: string,
        field: 'setKV' | 'ma10' | 'ma100' | 'ma200',
        value: string
    ) => {
        setTable2Rows((prev) =>
            prev.map((row) => {
                if (row.id === id) {
                    const updatedRow = { ...row, [field]: value };
                    return calculateRowValues(updatedRow);
                }
                return row;
            })
        );
    };

    // === CSV Data Injection ===
    useEffect(() => {
        if (csvData && csvData.length > 0) {
            // Table 1: Map kvp->time, ma->sliceThickness based on logic inferred from export
            // Or look for specific Time/SliceThickness fields if they exist?
            // Export: ['kVp', 'mA'] headers but values correspond to time/sliceThickness.
            // So if user uses template, Table1_kvp -> Time, Table1_ma -> SliceThickness.
            const t1Time = csvData.find(r => r['Field Name'] === 'Table1_kvp' || r['Field Name'] === 'Table1_Time')?.['Value'];
            const t1Slice = csvData.find(r => r['Field Name'] === 'Table1_ma' || r['Field Name'] === 'Table1_SliceThickness')?.['Value'];

            if (t1Time || t1Slice) {
                setTable1Row(prev => ({
                    ...prev,
                    time: t1Time || prev.time,
                    sliceThickness: t1Slice || prev.sliceThickness
                }));
            }

            // Table 2
            // Find all unique row indices for Table 2
            const t2Indices = [...new Set(csvData
                .filter(r => r['Field Name'].startsWith('Table2_'))
                .map(r => parseInt(r['Row Index']))
                .filter(i => !isNaN(i) && i > 0)
            )];

            if (t2Indices.length > 0) {
                const newRows = t2Indices.map(idx => {
                    const setKV = csvData.find(r => r['Field Name'] === 'Table2_SetKV' && parseInt(r['Row Index']) === idx)?.['Value'] || '';
                    // Try to finding specific columns first, fallback to generic Result -> ma100
                    const ma10 = csvData.find(r => r['Field Name'] === 'Table2_ma10' && parseInt(r['Row Index']) === idx)?.['Value'] || '';
                    const ma100 = csvData.find(r => r['Field Name'] === 'Table2_ma100' && parseInt(r['Row Index']) === idx)?.['Value']
                        || csvData.find(r => r['Field Name'] === 'Table2_Result' && parseInt(r['Row Index']) === idx)?.['Value']
                        || '';
                    const ma200 = csvData.find(r => r['Field Name'] === 'Table2_ma200' && parseInt(r['Row Index']) === idx)?.['Value'] || '';

                    const row: Table2Row = {
                        id: Date.now().toString() + Math.random(),
                        setKV,
                        ma10,
                        ma100,
                        ma200,
                        avgKvp: '',
                        remarks: '',
                        failedCells: { ma10: false, ma100: false, ma200: false, avgKvp: false }
                    };
                    return calculateRowValues(row);
                });
                setTable2Rows(newRows);
            }

            // Tolerance
            const tolVal = csvData.find(r => r['Field Name'] === 'Tolerance_Value')?.['Value'];
            const tolType = csvData.find(r => r['Field Name'] === 'Tolerance_Type')?.['Value'];
            const tolSign = csvData.find(r => r['Field Name'] === 'Tolerance_Sign')?.['Value'];

            if (tolVal) setToleranceValue(tolVal);
            if (tolType) setToleranceType(tolType.toLowerCase().includes('kv') ? 'absolute' : 'percent');
            if (tolSign) setToleranceSign(tolSign.includes('plus') ? 'plus' : tolSign.includes('minus') ? 'minus' : 'both');

            if (!testId) {
                setIsEditing(true);
            }
        }
    }, [csvData, calculateRowValues]);

    // === Form Valid ===
    const isFormValid = useMemo(() => {
        return (
            !!serviceId &&
            table1Row.time.trim() &&
            table1Row.sliceThickness.trim() &&
            table2Rows.every((r) => r.setKV.trim() && (r.ma10.trim() || r.ma100.trim() || r.ma200.trim()))
        );
    }, [serviceId, table1Row, table2Rows]);

    // === Load Existing Data ===
    useEffect(() => {
        const load = async () => {
            if (!serviceId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                let rec = null;

                if (propTestId) {
                    const response = await getMeasurementOfOperatingPotentialByTestId(propTestId);
                    rec = response.data || response;
                } else {
                    rec = await getMeasurementOfOperatingPotentialByServiceId(serviceId, tubeId || null);
                }

                if (rec) {
                    setTestId(rec._id || propTestId);
                    // Table 1
                    if (rec.table1?.[0]) {
                        setTable1Row({
                            time: String(rec.table1[0].time || ''),
                            sliceThickness: String(rec.table1[0].sliceThickness || ''),
                        });
                    }

                    // Table 2
                    if (Array.isArray(rec.table2) && rec.table2.length > 0) {
                        setTable2Rows(
                            rec.table2.map((r: any) => ({
                                id: Date.now().toString() + Math.random(),
                                setKV: String(r.setKV || ''),
                                ma10: String(r.ma10 || ''),
                                ma100: String(r.ma100 || ''),
                                ma200: String(r.ma200 || ''),
                                avgKvp: '',
                                remarks: r.remarks || '',
                                failedCells: { ma10: false, ma100: false, ma200: false, avgKvp: false },
                            }))
                        );
                    }

                    // Tolerance
                    if (rec.tolerance) {
                        setToleranceValue(rec.tolerance.value || rec.tolerance);
                        setToleranceType(rec.tolerance.type || 'percent');
                        setToleranceSign(rec.tolerance.sign || 'both');
                    }

                    setHasSaved(true);
                    setIsEditing(false);
                } else {
                    setHasSaved(false);
                    setIsEditing(true);
                }
            } catch (e: any) {
                if (e.response?.status !== 404) {
                    // toast.error('Failed to load data');
                }
                setHasSaved(false);
                setIsEditing(true);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [serviceId, propTestId, tubeId]);

    // === Save / Update ===
    const handleSave = async () => {
        if (!isFormValid) return;
        setIsSaving(true);

        const payload = {
            table1: [table1Row],
            table2: table2Rows.map((r) => {
                const values = [r.ma10, r.ma100, r.ma200]
                    .map(v => parseFloat(v))
                    .filter(v => !isNaN(v));

                const avgKvp = values.length > 0
                    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
                    : null;

                const setKV = parseFloat(r.setKV);
                let deviation = null;
                if (avgKvp && !isNaN(setKV)) {
                    deviation = ((parseFloat(avgKvp) - setKV) / setKV * 100).toFixed(2);
                }

                return {
                    setKV: setKV,
                    ma10: parseFloat(r.ma10) || null,
                    ma100: parseFloat(r.ma100) || null,
                    ma200: parseFloat(r.ma200) || null,
                    avgKvp: avgKvp ? parseFloat(avgKvp) : null,        // ← NOW SAVED
                    deviation: deviation ? parseFloat(deviation) : null, // ← Optional: useful for PDF
                    remarks: r.remarks,
                };
            }),
            toleranceValue,
            toleranceType,
            toleranceSign,
            tubeId: tubeId || null,
        };

        try {
            let res;
            if (testId) {
                res = await updateMeasurementOfOperatingPotential(testId, payload);
                toast.success('Updated successfully!');
            } else {
                res = await addMeasurementOfOperatingPotential(serviceId, payload);
                const newId = res.data?.testId || res.data?.data?.testId || res.data?._id;
                if (newId) {
                    setTestId(newId);
                }
                toast.success('Saved successfully!');
            }
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Measurement of Operating Potential
            </h2>

            {/* Table 1: Single Row */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Exposure Time vs Slice Thickness
                </h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                                Time (ms)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">
                                Slice Thickness (mm)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-2 border-r">
                                <input
                                    type="text"
                                    value={table1Row.time}
                                    onChange={(e) => setTable1Row((p) => ({ ...p, time: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="100"
                                />
                            </td>
                            <td className="px-6 py-2">
                                <input
                                    type="text"
                                    value={table1Row.sliceThickness}
                                    onChange={(e) => setTable1Row((p) => ({ ...p, sliceThickness: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="5.0"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Table 2 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    kV Measurement at Different mA
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                                    Set kV
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                                    @ mA 10
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                                    @ mA 100
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                                    @ mA 200
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                                    Avg kVp
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">
                                    Pass/Fail
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table2Rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.setKV}
                                            onChange={(e) => updateTable2(row.id, 'setKV', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                                : 'border-gray-300'
                                                }`}
                                            placeholder="80"
                                        />
                                    </td>
                                    <td className={`px-4 py-2 border-r ${row.failedCells?.ma10 ? 'bg-red-100' : ''}`}>
                                        <input
                                            type="text"
                                            value={row.ma10}
                                            onChange={(e) => updateTable2(row.id, 'ma10', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${row.failedCells?.ma10 ? 'bg-red-50 border-red-300 text-red-700 font-semibold' : isViewMode
                                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                                : 'border-gray-300'
                                                }`}
                                        />
                                    </td>
                                    <td className={`px-4 py-2 border-r ${row.failedCells?.ma100 ? 'bg-red-100' : ''}`}>
                                        <input
                                            type="text"
                                            value={row.ma100}
                                            onChange={(e) => updateTable2(row.id, 'ma100', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${row.failedCells?.ma100 ? 'bg-red-50 border-red-300 text-red-700 font-semibold' : isViewMode
                                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                                : 'border-gray-300'
                                                }`}
                                        />
                                    </td>
                                    <td className={`px-4 py-2 border-r ${row.failedCells?.ma200 ? 'bg-red-100' : ''}`}>
                                        <input
                                            type="text"
                                            value={row.ma200}
                                            onChange={(e) => updateTable2(row.id, 'ma200', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${row.failedCells?.ma200 ? 'bg-red-50 border-red-300 text-red-700 font-semibold' : isViewMode
                                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                                : 'border-gray-300'
                                                }`}
                                        />
                                    </td>
                                    <td className={`px-4 py-2 border-r font-medium text-center ${row.failedCells?.avgKvp ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-50'}`}>
                                        {row.avgKvp || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${row.remarks === 'Pass'
                                                ? 'bg-green-100 text-green-800'
                                                : row.remarks === 'Fail'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'text-gray-400'
                                                }`}
                                        >
                                            {row.remarks || '—'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        {table2Rows.length > 1 && !isViewMode && (
                                            <button
                                                onClick={() => removeTable2Row(row.id)}
                                                className="text-red-600 hover:bg-red-100 p-1 rounded"
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
                {!isViewMode && (
                    <div className="px-6 py-3 bg-gray-50 border-t">
                        <button
                            onClick={addTable2Row}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Row
                        </button>
                    </div>
                )}
            </div>

            {/* Tolerance */}
            <div className="bg-white p-6 shadow-md rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tolerance Setting</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance Value</label>
                        <input
                            type="number"
                            value={toleranceValue}
                            onChange={(e) => setToleranceValue(e.target.value)}
                            disabled={isViewMode}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                : 'border-gray-300'
                                }`}
                            min="0"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={toleranceType}
                            onChange={(e) => setToleranceType(e.target.value as any)}
                            disabled={isViewMode}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                : 'border-gray-300'
                                }`}
                        >
                            <option value="percent">%</option>
                            <option value="absolute">kVp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                        <select
                            value={toleranceSign}
                            onChange={(e) => setToleranceSign(e.target.value as any)}
                            disabled={isViewMode}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                : 'border-gray-300'
                                }`}
                        >
                            <option value="both">± (Both)</option>
                            <option value="plus">+ Only</option>
                            <option value="minus">- Only</option>
                        </select>
                    </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                    Current: <strong>
                        {toleranceSign === 'both' ? '±' : toleranceSign === 'plus' ? '+' : '-'}
                        {toleranceValue}{toleranceType === 'percent' ? '%' : ' kVp'}
                    </strong>
                </p>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end mt-6">
                <button
                    onClick={isViewMode ? toggleEdit : handleSave}
                    disabled={isSaving || (!isViewMode && !isFormValid)}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isViewMode
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
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
                            {buttonText} Measurement
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MeasurementOfOperatingPotential;