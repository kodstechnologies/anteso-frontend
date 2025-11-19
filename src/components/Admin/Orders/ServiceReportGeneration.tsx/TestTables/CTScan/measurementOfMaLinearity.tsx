// components/TestTables/measurementOfMaLinearity.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import {
    addMeasurementOfMaLinearity,
    getMeasurementOfMaLinearityByTestId,
    updateMeasurementOfMaLinearity,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
    kvp: string;
    sliceThickness: string;
    time: string;
}

interface Table2Row {
    id: string;
    mAsApplied: string;
    measuredOutputs: string[];
    average: string;
    x: string;
    xMax: string;
    xMin: string;
    col: string;
    remarks: string;
}

interface Props {
    serviceId: string;
    testId?: string;
    onRefresh?: () => void;
}

const MeasurementOfMaLinearity: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);

    // Table 1: Single row
    const [table1Row, setTable1Row] = useState<Table1Row>({ kvp: '', sliceThickness: '', time: '' });

    // Table 2: Dynamic rows + measurement columns
    const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        { id: '1', mAsApplied: '10', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '2', mAsApplied: '20', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '3', mAsApplied: '50', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '4', mAsApplied: '100', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    ]);

    const [tolerance, setTolerance] = useState<string>('0.1');

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // === Column Handling ===
    const addMeasColumn = () => {
        const newHeader = `Meas ${measHeaders.length + 1}`;
        setMeasHeaders((prev) => [...prev, newHeader]);
        setTable2Rows((prev) =>
            prev.map((row) => ({ ...row, measuredOutputs: [...row.measuredOutputs, ''] }))
        );
    };

    const removeMeasColumn = (idx: number) => {
        if (measHeaders.length <= 1) return;
        setMeasHeaders((prev) => prev.filter((_, i) => i !== idx));
        setTable2Rows((prev) =>
            prev.map((row) => ({
                ...row,
                measuredOutputs: row.measuredOutputs.filter((_, i) => i !== idx),
            }))
        );
    };

    const updateMeasHeader = (idx: number, value: string) => {
        setMeasHeaders((prev) => {
            const copy = [...prev];
            copy[idx] = value || `Meas ${idx + 1}`;
            return copy;
        });
    };

    // === Row Handling ===
    const addTable2Row = () => {
        const newRow: Table2Row = {
            id: Date.now().toString(),
            mAsApplied: '',
            measuredOutputs: Array(measHeaders.length).fill(''),
            average: '',
            x: '',
            xMax: '',
            xMin: '',
            col: '',
            remarks: '',
        };
        setTable2Rows((prev) => [...prev, newRow]);
    };

    const removeTable2Row = (id: string) => {
        if (table2Rows.length <= 1) return;
        setTable2Rows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateTable2Cell = (
        rowId: string,
        field: 'mAsApplied' | number,
        value: string
    ) => {
        setTable2Rows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row;
                if (field === 'mAsApplied') return { ...row, mAsApplied: value };
                if (typeof field === 'number') {
                    const newOutputs = [...row.measuredOutputs];
                    newOutputs[field] = value;
                    return { ...row, measuredOutputs: newOutputs };
                }
                return row;
            })
        );
    };

    // === Auto-calc: Avg, X, Xmax, Xmin, CoL, Remarks ===
    const processedTable2 = useMemo(() => {
        const tol = parseFloat(tolerance) || 0.1;
        const xValues: number[] = [];

        // First pass: calculate Avg and X
        const rowsWithX = table2Rows.map((row) => {
            const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
            const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';
            const mAs = parseFloat(row.mAsApplied);
            const x = avg !== '—' && mAs > 0 ? (parseFloat(avg) / mAs).toFixed(4) : '—';

            if (x !== '—') xValues.push(parseFloat(x));

            return { ...row, average: avg, x };
        });

        // Global Xmax, Xmin
        const xMax = xValues.length > 0 ? Math.max(...xValues).toFixed(4) : '—';
        const xMin = xValues.length > 0 ? Math.min(...xValues).toFixed(4) : '—';
        const colVal = xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
            ? ((parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))).toFixed(3)
            : '—';
        const pass = colVal !== '—' && parseFloat(colVal) <= tol;

        // Second pass: apply Xmax, Xmin, CoL, Remarks
        return rowsWithX.map((row) => ({
            ...row,
            xMax,
            xMin,
            col: colVal,
            remarks: pass ? 'Pass' : colVal === '—' ? '' : 'Fail',
        }));
    }, [table2Rows, tolerance]);

    // === Form Valid ===
    const isFormValid = useMemo(() => {
        return (
            !!serviceId &&
            table1Row.kvp.trim() &&
            table1Row.sliceThickness.trim() &&
            table1Row.time.trim() &&
            table2Rows.every(r => r.mAsApplied.trim() && r.measuredOutputs.some(v => v.trim()))
        );
    }, [serviceId, table1Row, table2Rows]);

    // === Load Data ===
    useEffect(() => {
        if (!testId) {
            setIsLoading(false);
            return;
        }
        const load = async () => {
            try {
                const { data } = await getMeasurementOfMaLinearityByTestId(testId);
                const rec = data;

                if (rec.table1?.[0]) {
                    setTable1Row(rec.table1[0]);
                }

                if (Array.isArray(rec.table2) && rec.table2.length > 0) {
                    const headers = rec.table2[0].measuredOutputs?.length > 0
                        ? Array.from({ length: rec.table2[0].measuredOutputs.length }, (_, i) => `Meas ${i + 1}`)
                        : measHeaders;
                    setMeasHeaders(headers);

                    setTable2Rows(
                        rec.table2.map((r: any) => ({
                            id: Date.now().toString() + Math.random(),
                            mAsApplied: String(r.mAsApplied),
                            measuredOutputs: r.measuredOutputs.map(String),
                            average: '',
                            x: '',
                            xMax: '',
                            xMin: '',
                            col: '',
                            remarks: '',
                        }))
                    );
                }

                if (rec.tolerance) setTolerance(rec.tolerance);

                setHasSaved(true);
                setIsEditing(false);
            } catch (e: any) {
                if (e.response?.status !== 404) toast.error('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [testId]);

    // === Save / Update ===
    // === Save / Update ===
    const handleSave = async () => {
        if (!isFormValid) return;
        setIsSaving(true);

        // Use the already processed data (includes avg, x, xmax, xmin, col, remarks)
        const payload = {
            table1: [table1Row],
            table2: processedTable2.map((row) => ({
                mAsApplied: parseFloat(row.mAsApplied) || 0,
                measuredOutputs: row.measuredOutputs.map(v => parseFloat(v) || null),
                avgOutput: row.average !== '—' ? parseFloat(row.average) : null,
                x: row.x !== '—' ? parseFloat(row.x) : null,
                xMax: row.xMax !== '—' ? parseFloat(row.xMax) : null,
                xMin: row.xMin !== '—' ? parseFloat(row.xMin) : null,
                col: row.col !== '—' ? parseFloat(row.col) : null,
                remarks: row.remarks || '',
            })),
            tolerance,
        };

        try {
            let res;
            if (testId) {
                res = await updateMeasurementOfMaLinearity(testId, payload);
                toast.success('Updated successfully!');
            } else {
                res = await addMeasurementOfMaLinearity(serviceId, payload);
                setTestId(res.data.testId);
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
        <div className="p-6 max-w-full overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">Measurement of mA Linearity</h2>

            {/* Table 1: Fixed */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">kVp</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Slice Thickness (mm)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (ms)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-r">
                                <input
                                    type="text"
                                    value={table1Row.kvp}
                                    onChange={e => setTable1Row(p => ({ ...p, kvp: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                        }`}
                                    placeholder="80"
                                />
                            </td>
                            <td className="px-4 py-2 border-r">
                                <input
                                    type="text"
                                    value={table1Row.sliceThickness}
                                    onChange={e => setTable1Row(p => ({ ...p, sliceThickness: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                        }`}
                                    placeholder="5.0"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="text"
                                    value={table1Row.time}
                                    onChange={e => setTable1Row(p => ({ ...p, time: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                        }`}
                                    placeholder="100"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Table 2 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                mAs Applied
                            </th>
                            <th
                                colSpan={measHeaders.length}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                            >
                                <div className="flex items-center justify-between">
                                    <span>Radiation Output (mGy)</span>
                                    {!isViewMode && (
                                        <button onClick={addMeasColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Avg Output</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X (mGy/mAs)</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X MAX</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">X MIN</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">CoL</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Remarks</th>
                            <th rowSpan={2} className="w-10" />
                        </tr>
                        <tr>
                            {measHeaders.map((header, idx) => (
                                <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                    <div className="flex items-center justify-center gap-1">
                                        <input
                                            type="text"
                                            value={header}
                                            onChange={e => updateMeasHeader(idx, e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                }`}
                                        />
                                        {measHeaders.length > 1 && !isViewMode && (
                                            <button onClick={() => removeMeasColumn(idx)} className="p-0.5 text-red-600 hover:bg-red-100 rounded">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {processedTable2.map((p, rowIndex) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                {/* mAs Applied */}
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={p.mAsApplied}
                                        onChange={e => updateTable2Cell(p.id, 'mAsApplied', e.target.value)}
                                        disabled={isViewMode}
                                        className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                    />
                                </td>

                                {/* Measurement Columns */}
                                {p.measuredOutputs.map((val, colIdx) => (
                                    <td key={colIdx} className="px-2 py-2 border-r">
                                        <input
                                            type="number"
                                            step="any"
                                            value={val}
                                            onChange={e => updateTable2Cell(p.id, colIdx, e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                }`}
                                        />
                                    </td>
                                ))}

                                {/* Calculated Columns */}
                                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.average}</td>
                                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.x}</td>
                                <td className="px-4 py-2 text-center border-r font-medium bg-yellow-50">{p.xMax}</td>
                                <td className="px-4 py-2 text-center border-r font-medium bg-yellow-50">{p.xMin}</td>
                                <td className="px-4 py-2 text-center border-r font-medium bg-yellow-50">{p.col}</td>

                                {/* Remarks */}
                                <td className="px-4 py-2 text-center">
                                    <span
                                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${p.remarks === 'Pass'
                                            ? 'bg-green-100 text-green-800'
                                            : p.remarks === 'Fail'
                                                ? 'bg-red-100 text-red-800'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        {p.remarks || '—'}
                                    </span>
                                </td>

                                {/* Delete Button – Always visible if >1 row */}
                                <td className="px-2 py-2 text-center">
                                    {table2Rows.length > 1 && (
                                        <button
                                            onClick={() => {
                                                // Confirm before delete
                                                if (window.confirm('Delete this row?')) {
                                                    removeTable2Row(p.id);
                                                    // If already saved, trigger parent refresh after delete
                                                    if (hasSaved) {
                                                        // Small delay to let state update
                                                        setTimeout(() => onRefresh?.(), 100);
                                                    }
                                                }
                                            }}
                                            className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                                            title="Delete Row"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                    {!isViewMode && (
                        <button
                            onClick={addTable2Row}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Row
                        </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm font-medium text-gray-700">Tolerance (CoL) less than</span>
                        <input
                            type="number"
                            step="0.001"
                            value={tolerance}
                            onChange={e => setTolerance(e.target.value)}
                            disabled={isViewMode}
                            className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                }`}
                        />
                    </div>
                </div>
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
                            {buttonText} mA Linearity
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MeasurementOfMaLinearity;