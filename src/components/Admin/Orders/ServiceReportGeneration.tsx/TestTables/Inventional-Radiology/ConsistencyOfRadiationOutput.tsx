// components/TestTables/ConsistencyOfRadiationOutput.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addConsistencyOfRadiationOutputForInventionalRadiology,
    getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology,
    updateConsistencyOfRadiationOutputForInventionalRadiology,
} from '../../../../../../api';

interface OutputRow {
    id: string;
    kvp: string;
    mas: string;
    outputs: string[];
    mean: string;
    cov: string;
    remarks: 'Pass' | 'Fail' | '';
}

interface Props {
    serviceId: string;
    testId?: string | null;
    onTestSaved?: (testId: string) => void;
}

const ConsistencyOfRadiationOutput: React.FC<Props> = ({
    serviceId,
    testId: propTestId = null,
    onTestSaved,
}) => {
    const [testId, setTestId] = useState<string | null>(propTestId);
    const [isSaved, setIsSaved] = useState(!!propTestId);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [fdd, setFdd] = useState<string>('');

    const [outputRows, setOutputRows] = useState<OutputRow[]>([
        {
            id: '1',
            kvp: '',
            mas: '',
            outputs: ['', '', '', '', ''],
            mean: '',
            cov: '',
            remarks: '',
        },
    ]);

    const [headers, setHeaders] = useState<string[]>([
        'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
    ]);

    const [tolerance, setTolerance] = useState<string>('0.05');

    // Auto-calculate Mean, COV, and Remarks
    useEffect(() => {
        setOutputRows((rows) =>
            rows.map((row) => {
                const nums = row.outputs
                    .filter((v) => v.trim() !== '')
                    .map((v) => parseFloat(v))
                    .filter((n) => !isNaN(n));

                if (nums.length === 0) {
                    return { ...row, mean: '', cov: '', remarks: '' };
                }

                const mean = nums.reduce((a, b) => a + b, 0) / nums.length;

                let cov = 0;
                if (nums.length > 1) {
                    const variance =
                        nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                        (nums.length - 1);
                    cov = Math.sqrt(variance) / mean;
                }

                let remarks: 'Pass' | 'Fail' | '' = '';
                if (tolerance) {
                    const tol = parseFloat(tolerance);
                    if (!isNaN(tol) && !isNaN(cov)) {
                        remarks = cov <= tol ? 'Pass' : 'Fail';
                    }
                }

                return {
                    ...row,
                    mean: mean.toFixed(3),
                    cov: cov.toFixed(4),
                    remarks,
                };
            })
        );
    }, [outputRows.map((r) => r.outputs.join(',')).join('|'), tolerance]);

    // Final Remark
    const remark = useMemo(() => {
        if (!tolerance || !isSaved) return '';
        const tol = parseFloat(tolerance);
        if (isNaN(tol)) return '';

        const allPass = outputRows.every((row) => {
            if (!row.cov) return true;
            return parseFloat(row.cov) <= tol;
        });

        return allPass ? 'Pass' : 'Fail';
    }, [outputRows, tolerance, isSaved]);

    // Load test data
    useEffect(() => {
        const loadTest = async () => {
            setIsLoading(true);
            try {
                const res = await getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId);
                const data = res?.data;

                if (data) {
                    setTestId(data._id || data.testId);
                    setFdd(data.fdd?.value || '');
                    setOutputRows(
                        data.outputRows?.map((row: any, i: number) => {
                            const covVal = row.cov ? parseFloat(row.cov) : 0;
                            const tolVal = data.tolerance?.value ? parseFloat(data.tolerance.value) : parseFloat(data.tolerance) || 0.05;
                            let remarks: 'Pass' | 'Fail' | '' = '';
                            if (!isNaN(covVal) && !isNaN(tolVal)) {
                                remarks = covVal <= tolVal ? 'Pass' : 'Fail';
                            }
                            return {
                                id: String(i + 1),
                                kvp: row.kvp || '',
                                mas: row.mas || '',
                                outputs: row.outputs || Array(headers.length).fill(''),
                                mean: row.mean || '',
                                cov: row.cov || '',
                                remarks,
                            };
                        }) || outputRows
                    );
                    setHeaders(data.measurementHeaders || headers);
                    setTolerance(data.tolerance?.value || data.tolerance || '0.05');
                    setIsSaved(true);
                } else {
                    setIsSaved(false);
                }
            } catch (err: any) {
                console.error("Load failed:", err);
                setIsSaved(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadTest();
    }, [propTestId, serviceId]);

    // Save / Update
    const handleSave = async () => {
        if (!serviceId) {
            toast.error('Service ID is missing');
            return;
        }

        setIsSaving(true);

        const payload = {
            fdd: { value: fdd.trim() },
            outputRows: outputRows.map((row) => ({
                kvp: row.kvp.trim(),
                mas: row.mas.trim(),
                outputs: row.outputs.map(v => v.trim()),
                mean: row.mean || "",
                cov: row.cov || "",
                remarks: row.remarks || "",
            })),
            measurementHeaders: headers,
            tolerance: {
                operator: "<=",
                value: tolerance.trim(),
            },
        };

        try {
            let result;
            if (testId) {
                result = await updateConsistencyOfRadiationOutputForInventionalRadiology(testId, payload);
                toast.success('Updated successfully!');
            } else {
                result = await addConsistencyOfRadiationOutputForInventionalRadiology(serviceId, payload);
                const newId = result?.data?.testId || result?.data?._id;
                if (newId) {
                    setTestId(newId);
                    onTestSaved?.(newId);
                }
                toast.success('Saved successfully!');
            }
            setIsSaved(true);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = () => {
        setIsSaved(false);
    };

    const isViewMode = isSaved;

    // Dynamic handlers
    const addColumn = () => {
        if (isViewMode) return;
        const newHeader = `Meas ${headers.length + 1}`;
        setHeaders((prev) => [...prev, newHeader]);
        setOutputRows((rows) =>
            rows.map((r) => ({ ...r, outputs: [...r.outputs, ''] }))
        );
    };

    const removeColumn = (idx: number) => {
        if (isViewMode || headers.length <= 1) return;
        setHeaders((prev) => prev.filter((_, i) => i !== idx));
        setOutputRows((rows) =>
            rows.map((r) => ({
                ...r,
                outputs: r.outputs.filter((_, i) => i !== idx),
            }))
        );
    };

    const updateHeader = (idx: number, value: string) => {
        if (isViewMode) return;
        setHeaders((prev) => {
            const copy = [...prev];
            copy[idx] = value || `Meas ${idx + 1}`;
            return copy;
        });
    };

    const addRow = () => {
        if (isViewMode) return;
        setOutputRows((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                kvp: '',
                mas: '',
                outputs: Array(headers.length).fill(''),
                mean: '',
                cov: '',
                remarks: '',
            },
        ]);
    };

    const removeRow = (id: string) => {
        if (isViewMode || outputRows.length <= 1) return;
        setOutputRows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateOutputCell = (rowId: string, field: 'kvp' | 'mas' | number, value: string) => {
        if (isViewMode) return;
        setOutputRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                if (field === 'kvp') return { ...row, kvp: value };
                if (field === 'mas') return { ...row, mas: value };
                const newOutputs = [...row.outputs];
                newOutputs[field] = value;
                return { ...row, outputs: newOutputs };
            })
        );
    };

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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Consistency of Radiation Output</h2>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">FDD (cm)</span>
                        <input
                            type="number"
                            value={fdd}
                            onChange={(e) => setFdd(e.target.value)}
                            disabled={isViewMode}
                            className={`w-24 px-3 py-1.5 text-center border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                }`}
                            placeholder="100"
                        />
                    </div>

                    <button
                        onClick={isViewMode ? startEditing : handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isViewMode
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                {isViewMode ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {isViewMode ? 'Edit' : testId ? 'Update' : 'Save'} Test
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Radiation Output */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
                    Radiation Output Consistency
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                            <tr>
                                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                                    kVp
                                </th>
                                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                                    mAs
                                </th>
                                <th
                                    colSpan={headers.length}
                                    className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Radiation Output (mGy)</span>
                                        {!isViewMode && (
                                            <button onClick={addColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </th>
                                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                                    Mean (X̄)
                                </th>
                                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                                    CoV
                                </th>
                                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                                    Remarks
                                </th>
                            </tr>
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">
                                        <div className="flex items-center justify-center gap-1">
                                            <input
                                                type="text"
                                                value={h}
                                                onChange={(e) => updateHeader(i, e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                            />
                                            {headers.length > 1 && !isViewMode && (
                                                <button onClick={() => removeColumn(i)} className="text-red-600 hover:bg-red-100 p-0.5 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {outputRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.kvp}
                                            onChange={(e) => updateOutputCell(row.id, 'kvp', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                            placeholder="80"
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.mas}
                                            onChange={(e) => updateOutputCell(row.id, 'mas', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                            placeholder="100"
                                        />
                                    </td>
                                    {row.outputs.map((val, idx) => (
                                        <td key={idx} className="px-2 py-2 border-r">
                                            <input
                                                type="text"
                                                value={val}
                                                onChange={(e) => updateOutputCell(row.id, idx, e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                                placeholder="0.00"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 border-r text-center font-medium">
                                        {row.mean ? parseFloat(row.mean).toFixed(3) : '-'}
                                    </td>
                                    <td className="px-4 py-2 border-r text-center font-medium">
                                        {row.cov ? parseFloat(row.cov).toFixed(4) : '-'}
                                    </td>
                                    <td className="px-4 py-2 border-r text-center">
                                        {row.remarks && (
                                            <span
                                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${row.remarks === 'Pass'
                                                        ? 'bg-green-100 text-green-800'
                                                        : row.remarks === 'Fail'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}
                                            >
                                                {row.remarks}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t">
                    {!isViewMode && (
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Row
                        </button>
                    )}
                </div>
            </div>

            {/* Tolerance & Final Remark */}
            <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerance
                </label>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">CoV &lt;</span>
                    <input
                        type="text"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        disabled={isViewMode}
                        className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="0.05"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Final Result:</span>
                    <span
                        className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${remark === 'Pass'
                            ? 'bg-green-100 text-green-800'
                            : remark === 'Fail'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                    >
                        {remark || '—'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConsistencyOfRadiationOutput;
