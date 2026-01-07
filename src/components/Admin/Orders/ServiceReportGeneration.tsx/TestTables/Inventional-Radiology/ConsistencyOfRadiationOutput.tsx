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
    tubeId?: string | null;
    onTestSaved?: (testId: string) => void;
}

const ConsistencyOfRadiationOutput: React.FC<Props> = ({
    serviceId,
    testId: propTestId = null,
    tubeId,
    onTestSaved,
}) => {
    const [testId, setTestId] = useState<string | null>(propTestId);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
            if (!serviceId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, tubeId);
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
                    setIsEditing(false);
                } else {
                    setIsSaved(false);
                    setIsEditing(true);
                }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    toast.error('Failed to load test data');
                }
                setIsSaved(false);
                setIsEditing(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadTest();
    }, [propTestId, serviceId, tubeId]);

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
            tubeId: tubeId || null,
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
            setIsEditing(false);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEdit = () => {
        setIsEditing(true);
        setIsSaved(false);
    };

    const isViewMode = isSaved && !isEditing;

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
        <div className="p-6 space-y-10">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Reproducibility of Radiation Output (Consistency Test)
                </h2>
                <button
                    onClick={isViewMode ? toggleEdit : handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
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
                    ) : isViewMode ? (
                        <>
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            {testId ? 'Update' : 'Save'} Test
                        </>
                    )}
                </button>
            </div>

            {/* FCD */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 flex items-center gap-4">
                    <label className="w-48 text-sm font-medium text-gray-700">FDD(cm):</label>
                    <input
                        type="text"
                        value={fdd}
                        onChange={e => setFdd(e.target.value)}
                        disabled={isViewMode}
                        className={`w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="100"
                    />
                    <span className="text-gray-600">cm</span>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-700">
                        Radiation Output Measurements (mGy)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600  border-r">
                                    kV
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600  border-r">
                                    mAs
                                </th>
                                {Array.from({ length: headers.length }, (_, i) => (
                                    <th
                                        key={i}
                                        className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r relative"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1">
                                                <span>Meas {i + 1}</span>
                                                {!isViewMode && headers.length < 10 && (
                                                    <button
                                                        onClick={() => addColumn()}
                                                        className="text-green-600 hover:bg-green-100 p-0.5 rounded transition"
                                                        title="Add column after this"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {!isViewMode && headers.length > 3 && (
                                                <button
                                                    onClick={() => removeColumn(i)}
                                                    className="text-red-600 hover:bg-red-100 p-1 rounded transition"
                                                    title="Remove this column"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600  border-r">
                                    Average
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600 ">
                                    CoV / Result
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {outputRows.map((row) => {
                                const isFailed = row.remarks === 'Fail';
                                const hasValue = row.cov && parseFloat(row.cov) > 0;
                                
                                return (
                                    <tr key={row.id} className={`hover:bg-gray-50 ${isFailed && hasValue ? 'bg-red-50' : ''}`}>
                                        <td className="px-5 py-4 border-r">
                                            <input
                                                type="text"
                                                value={row.kvp}
                                                onChange={e => updateOutputCell(row.id, 'kvp', e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                                placeholder="80"
                                            />
                                        </td>
                                        <td className="px-5 py-4 border-r">
                                            <input
                                                type="text"
                                                value={row.mas}
                                                onChange={e => updateOutputCell(row.id, 'mas', e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                                placeholder="100"
                                            />
                                        </td>
                                        {row.outputs.map((val, idx) => (
                                            <td key={idx} className="px-2 py-4 border-r">
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={e => updateOutputCell(row.id, idx, e.target.value)}
                                                    disabled={isViewMode}
                                                    className={`w-20 px-2 py-1.5 text-center border rounded text-xs focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-5 py-4 text-center font-semibold border-r bg-blue-50">
                                            {row.mean || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                                                    row.remarks === 'Pass'
                                                        ? 'bg-green-100 text-green-800'
                                                        : row.remarks === 'Fail'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {row.cov ? `${row.cov}% → ${row.remarks}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 text-center">
                                            {outputRows.length > 1 && (
                                                <button
                                                    onClick={() => removeRow(row.id)}
                                                    disabled={isViewMode}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                    {!isViewMode && (
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Technique
                        </button>
                    )}
                </div>
            </div>

            {/* Acceptance Criteria */}
            <div className="bg-white rounded-lg border p-6 max-w-md shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4">Acceptance Criteria</h3>
                <div className="flex items-center gap-4">
                    <span className="text-gray-700">Coefficient of Variation (CoV)</span>
                    <span className="text-gray-700">&lt;=</span>
                    <input
                        type="text"
                        value={tolerance}
                        onChange={e => {
                            setTolerance(e.target.value.replace(/[^0-9.]/g, ''));
                            setIsSaved(false);
                        }}
                        disabled={isViewMode}
                        className={`w-24 px-4 py-2 text-center border-2 border-blue-500 rounded font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                    Reference: IEC 61223-3-1 & AERB Safety Code
                </p>
            </div>
        </div>
    );
};

export default ConsistencyOfRadiationOutput;
