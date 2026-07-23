// components/TestTables/ConsistencyOfRadiationOutput.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    csvData?: any[];
}

const ConsistencyOfRadiationOutput: React.FC<Props> = ({
    serviceId,
    testId: propTestId = null,
    tubeId,
    onTestSaved,
    csvData,
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

    const [tolerance, setTolerance] = useState<{
        operator: '<=' | '<' | '>=' | '>';
        value: string;
    }>({
        operator: '<=',
        value: '0.05',
    });

    const csvDataRef = useRef(csvData);
    csvDataRef.current = csvData;

    const getField = (row: any) => String(row?.['Field Name'] ?? row?.fieldName ?? '').trim();
    const getValue = (row: any) => {
        const v = row?.['Value'] ?? row?.value;
        return v === undefined || v === null ? '' : String(v).trim();
    };
    const getRowIndex = (row: any) => {
        const n = parseInt(String(row?.['Row Index'] ?? row?.rowIndex ?? '0'), 10);
        return Number.isNaN(n) ? 0 : n;
    };

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
                // CoV formula same as RadiographyFixed: population variance (divide by N), then stdDev/mean as decimal
                let cov = 0;
                if (nums.length > 0 && mean > 0) {
                    const variance =
                        nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nums.length;
                    const stdDev = Math.sqrt(variance);
                    cov = stdDev / mean;
                }

                let remarks: 'Pass' | 'Fail' | '' = '';
                if (tolerance.value) {
                    const tol = parseFloat(tolerance.value);
                    if (!isNaN(tol) && !isNaN(cov)) {
                        const passes =
                            tolerance.operator === '<=' || tolerance.operator === '<'
                                ? cov <= tol
                                : cov >= tol;
                        remarks = passes ? 'Pass' : 'Fail';
                    }
                }

                return {
                    ...row,
                    mean: mean.toFixed(3),
                    cov: cov.toFixed(3),
                    remarks,
                };
            })
        );
    }, [outputRows.map((r) => r.outputs.join(',')).join('|'), tolerance.operator, tolerance.value]);

    // Final Remark
    const remark = useMemo(() => {
        if (!tolerance.value || !isSaved) return '';
        const tol = parseFloat(tolerance.value);
        if (isNaN(tol)) return '';

        const allPass = outputRows.every((row) => {
            if (!row.cov) return true;
            const cov = parseFloat(row.cov);
            if (isNaN(cov)) return true;
            return tolerance.operator === '<=' || tolerance.operator === '<'
                ? cov <= tol
                : cov >= tol;
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
            if (csvData && csvData.length > 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, tubeId);
                // Do not overwrite UI if Excel/CSV data arrived while this request was in flight
                if (csvDataRef.current && csvDataRef.current.length > 0) {
                    setIsLoading(false);
                    return;
                }
                const data = res?.data;

                if (data) {
                    setTestId(data._id || data.testId);
                    setFdd(data.fdd?.value || '');
                    setOutputRows(
                        data.outputRows?.map((row: any, i: number) => {
                            const covVal = row.cov ? parseFloat(row.cov) : 0;
                            const tolVal = data.tolerance?.value ? parseFloat(data.tolerance.value) : parseFloat(data.tolerance) || 0.05;
                            const op = data.tolerance?.operator || '<=';
                            let remarks: 'Pass' | 'Fail' | '' = '';
                            if (!isNaN(covVal) && !isNaN(tolVal)) {
                                const passes = op === '<=' || op === '<' ? covVal <= tolVal : covVal >= tolVal;
                                remarks = passes ? 'Pass' : 'Fail';
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
                    const loadedOp = data.tolerance?.operator;
                    setTolerance({
                        operator: (['<=', '<', '>=', '>'].includes(loadedOp) ? loadedOp : '<=') as '<=' | '<' | '>=' | '>',
                        value: data.tolerance?.value || (typeof data.tolerance === 'string' ? data.tolerance : '0.05'),
                    });
                    setIsSaved(true);
                    setIsEditing(false);
                } else {
                    setIsSaved(false);
                    setIsEditing(true);
                }
            } catch (err: any) {
                if (csvDataRef.current && csvDataRef.current.length > 0) {
                    setIsLoading(false);
                    return;
                }
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
    }, [propTestId, serviceId, tubeId, csvData]);

    // CSV Data Injection — horizontal (Table2_ExpN) + vertical (Table1_Output / Table1_MeasN / Table1_mas)
    useEffect(() => {
        if (!csvData || csvData.length === 0) return;

        const isKvField = (f: string) =>
            f === 'Table1_kv' || f === 'Table1_kvp' || f === 'Table1_kV' || f === 'OutputRow_kvp';
        const isMasField = (f: string) =>
            f === 'Table1_ma' || f === 'Table1_mas' || f === 'Table1_mAs' || f === 'Table1_mA' || f === 'mAs';
        const isOutputField = (f: string) =>
            /^Table2_Exp\d+$/i.test(f) ||
            /^Table1_Meas\d+$/i.test(f) ||
            /^Table1_Output(_\d+)?$/i.test(f) ||
            /^Result_\d+$/i.test(f);

        const tableRows = csvData.filter((r) => {
            const f = getField(r);
            return isKvField(f) || isMasField(f) || isOutputField(f);
        });

        if (tableRows.length > 0) {
            const measHeaders = csvData
                .filter((r) => getField(r) === 'MeasHeader')
                .map((r) => getValue(r))
                .filter(Boolean);

            const maxExpIdx = csvData.reduce((max, r) => {
                const f = getField(r);
                const m =
                    f.match(/^Table2_Exp(\d+)$/i) ||
                    f.match(/^Table1_Meas(\d+)$/i) ||
                    f.match(/^Result_(\d+)$/i) ||
                    f.match(/^Table1_Output_(\d+)$/i);
                if (!m) {
                    if (/^Table1_Output$/i.test(f)) return Math.max(max, 1);
                    return max;
                }
                const n = /^Result_|^Table1_Output_/i.test(f)
                    ? parseInt(m[1], 10) + 1
                    : parseInt(m[1], 10);
                return isNaN(n) ? max : Math.max(max, n);
            }, 0);

            const outputColCount =
                measHeaders.length > 0 ? measHeaders.length : maxExpIdx > 0 ? maxExpIdx : 5;

            if (measHeaders.length > 0) {
                setHeaders(measHeaders);
            } else if (maxExpIdx > 0) {
                setHeaders(Array.from({ length: maxExpIdx }, (_, i) => `Meas ${i + 1}`));
            }

            const rowIndices = Array.from(new Set(tableRows.map((r) => getRowIndex(r)))).sort(
                (a, b) => a - b
            );

            // Horizontal: FDD on row 0, measurements on 1+. Vertical: kv/mas/output on row 0.
            const dataIndices =
                rowIndices.some((i) => i > 0) &&
                rowIndices.some((i) => i === 0) &&
                !tableRows.some((r) => getRowIndex(r) === 0 && isOutputField(getField(r)))
                    ? rowIndices.filter((i) => i > 0)
                    : rowIndices;

            const resolveOutput = (idx: number, n: number): string => {
                const candidates = [
                    `Table2_Exp${n}`,
                    `Table1_Meas${n}`,
                    n === 1 ? 'Table1_Output' : '',
                    `Table1_Output_${n - 1}`,
                    `Result_${n - 1}`,
                ].filter(Boolean);
                for (const name of candidates) {
                    const hit = csvData.find((r) => getField(r) === name && getRowIndex(r) === idx);
                    if (hit && getValue(hit) !== '') return getValue(hit);
                }
                return '';
            };

            const newRows = dataIndices.map((idx, i) => {
                const kv = getValue(csvData.find((r) => isKvField(getField(r)) && getRowIndex(r) === idx));
                // UI field is mAs — use Excel mAs/mA value as-is (do NOT multiply by Time)
                const explicitMas = getValue(
                    csvData.find(
                        (r) =>
                            (getField(r) === 'Table1_mas' || getField(r) === 'Table1_mAs') &&
                            getRowIndex(r) === idx
                    )
                );
                const maRaw = getValue(
                    csvData.find(
                        (r) =>
                            (getField(r) === 'Table1_ma' ||
                                getField(r) === 'Table1_mA' ||
                                getField(r) === 'mAs') &&
                            getRowIndex(r) === idx
                    )
                );
                const mas = explicitMas || maRaw;

                return {
                    id: String(i + 1),
                    kvp: kv,
                    mas,
                    outputs: Array.from({ length: outputColCount }, (_, n) => resolveOutput(idx, n + 1)),
                    mean: '',
                    cov: '',
                    remarks: '' as 'Pass' | 'Fail' | '',
                };
            });

            const usable = newRows.filter(
                (r) =>
                    r.kvp.trim() !== '' ||
                    r.mas.trim() !== '' ||
                    r.outputs.some((o) => String(o).trim() !== '')
            );
            if (usable.length > 0) setOutputRows(usable);
        }

        const fddVal =
            getValue(csvData.find((r) => getField(r) === 'Table1_fcd')) ||
            getValue(csvData.find((r) => getField(r) === 'Table1_fdd'));
        if (fddVal) setFdd(fddVal);

        const tolOp = getValue(
            csvData.find((r) =>
                ['ToleranceOperator', 'Tolerance_Operator', 'Tolerance Sign', 'Tolerance_Sign'].includes(
                    getField(r)
                )
            )
        );
        const tol = getValue(
            csvData.find((r) =>
                ['Tolerance', 'Tolerance_Value', 'Tolerance Value'].includes(getField(r))
            )
        );
        if (tolOp || tol) {
            setTolerance((prev) => ({
                ...prev,
                ...(tolOp && ['<=', '<', '>=', '>'].includes(String(tolOp).trim())
                    ? { operator: String(tolOp).trim() as '<=' | '<' | '>=' | '>' }
                    : {}),
                ...(tol ? { value: String(tol).trim() } : {}),
            }));
        }

        setIsEditing(true);
        setIsSaved(false);
    }, [csvData]);

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
                operator: tolerance.operator,
                value: tolerance.value.trim(),
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
        setIsSaved(false);
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
            <h2 className="text-2xl font-bold text-gray-800">
                Reproducibility of Radiation Output (Consistency Test)
            </h2>

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
                                {headers.map((header, i) => (
                                    <th
                                        key={i}
                                        className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r relative"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={header}
                                                    onChange={(e) => updateHeader(i, e.target.value)}
                                                    disabled={isViewMode}
                                                    className={`w-20 px-1 py-0.5 text-xs border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                                                />
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
                                            {!isViewMode && headers.length > 1 && (
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
                                                {row.cov ? `${row.cov} → ${row.remarks}` : '—'}
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
                    <select
                        value={tolerance.operator}
                        onChange={(e) => {
                            setTolerance({ ...tolerance, operator: e.target.value as any });
                            setIsSaved(false);
                        }}
                        disabled={isViewMode}
                        className={`px-4 py-2 border rounded font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    >
                        <option value="<=">≤</option>
                        <option value="<">&lt;</option>
                        <option value=">=">≥</option>
                        <option value=">">&gt;</option>
                    </select>
                    <input
                        type="text"
                        value={tolerance.value}
                        onChange={e => {
                            setTolerance({
                                ...tolerance,
                                value: e.target.value.replace(/[^0-9.]/g, ''),
                            });
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

            <div className="flex justify-end mt-6">
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
        </div>
    );
};

export default ConsistencyOfRadiationOutput;
