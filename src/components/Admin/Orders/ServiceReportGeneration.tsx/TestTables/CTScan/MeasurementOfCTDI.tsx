// components/TestTables/MeasurementOfCTDI.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import {
    addMeasurementOfCTDI,
    getMeasurementOfCTDIByTestId,
    getMeasurementOfCTDIByServiceId,
    updateMeasurementOfCTDI,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
    kvp: string;
    mAs: string;
    sliceThickness: string;
}

interface PeripheralReading {
    id: string;
    label: string;
    head: string;
    body: string;
}

interface Table2Row {
    id: string;
    result: string;
    head: string;
    body: string;
    readings?: PeripheralReading[];
}

interface Tolerance {
    expected: { value: string; quote: string };
    maximum: { value: string; quote: string };
}

interface Props {
    serviceId: string;
    testId?: string;
    tubeId?: string | null;
    onRefresh?: () => void;
}

const MeasurementOfCTDI: React.FC<Props> = ({ serviceId, testId: propTestId, tubeId, onRefresh }) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);

    // Table 1: Fixed single row
    const [table1Row, setTable1Row] = useState<Table1Row>({ kvp: '', mAs: '', sliceThickness: '' });

    // Table 2: Fixed structure + dynamic peripheral
    const [peripheralLabels, setPeripheralLabels] = useState<string[]>(['A', 'B', 'C']);
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        { id: 'ctdic', result: 'Axial Dose CTDIc', head: '', body: '' },
        {
            id: 'peripheral',
            result: 'Peripheral Dose',
            head: '',
            body: '',
            readings: peripheralLabels.map((label) => ({
                id: Date.now().toString() + label,
                label,
                head: '',
                body: '',
            })),
        },
        { id: 'ctdip', result: 'Peripheral Dose CTDIp(mean)', head: '', body: '' },
        { id: 'ctdiw', result: 'CTDIw', head: '', body: '' },
        { id: 'ctdiwRated', result: 'CTDIw (Rated)', head: '', body: '' },
    ]);

    const [tolerance, setTolerance] = useState<Tolerance>({
        expected: { value: '', quote: '' },
        maximum: { value: '', quote: '' },
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // === Peripheral Column Handling ===
    const addPeripheralColumn = () => {
        const nextLabel = String.fromCharCode(65 + peripheralLabels.length);
        setPeripheralLabels((prev) => [...prev, nextLabel]);
        setTable2Rows((prev) =>
            prev.map((row) => {
                if (row.id === 'peripheral' && row.readings) {
                    return {
                        ...row,
                        readings: [
                            ...row.readings,
                            { id: Date.now().toString() + nextLabel, label: nextLabel, head: '', body: '' },
                        ],
                    };
                }
                return row;
            })
        );
    };

    const removePeripheralColumn = (index: number) => {
        if (peripheralLabels.length <= 1) return;
        if (window.confirm('Delete this peripheral column?')) {
            setPeripheralLabels((prev) => prev.filter((_, i) => i !== index));
            setTable2Rows((prev) =>
                prev.map((row) => {
                    if (row.id === 'peripheral' && row.readings) {
                        return { ...row, readings: row.readings.filter((_, i) => i !== index) };
                    }
                    return row;
                })
            );
            if (hasSaved) setTimeout(() => onRefresh?.(), 100);
        }
    };

    const updatePeripheralLabel = (index: number, value: string) => {
        const clean = value.trim().toUpperCase() || String.fromCharCode(65 + index);
        setPeripheralLabels((prev) => {
            const copy = [...prev];
            copy[index] = clean;
            return copy;
        });
        setTable2Rows((prev) =>
            prev.map((row) => {
                if (row.id === 'peripheral' && row.readings) {
                    const newReadings = [...row.readings];
                    newReadings[index].label = clean;
                    return { ...row, readings: newReadings };
                }
                return row;
            })
        );
    };

    const updatePeripheralValue = (readingId: string, field: 'head' | 'body', value: string) => {
        setTable2Rows((prev) =>
            prev.map((row) => {
                if (row.id === 'peripheral' && row.readings) {
                    const newReadings = row.readings.map((r) =>
                        r.id === readingId ? { ...r, [field]: value } : r
                    );
                    return { ...row, readings: newReadings };
                }
                return row;
            })
        );
    };

    const updateTable2Value = (rowId: string, field: 'head' | 'body', value: string) => {
        setTable2Rows((prev) =>
            prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
        );
    };

    // === Auto-calculate CTDIp(mean), CTDIw ===
    const processedTable2 = useMemo(() => {
        const round = (num: number) => (isNaN(num) ? '' : num.toFixed(2));

        const ctdicRow = table2Rows.find((r) => r.id === 'ctdic');
        const peripheralRow = table2Rows.find((r) => r.id === 'peripheral');

        let ctdipHeadMean = '';
        let ctdipBodyMean = '';
        let ctdiwHead = '';
        let ctdiwBody = '';

        if (peripheralRow?.readings) {
            const headValues = peripheralRow.readings.map((r) => parseFloat(r.head)).filter((v) => !isNaN(v));
            const bodyValues = peripheralRow.readings.map((r) => parseFloat(r.body)).filter((v) => !isNaN(v));

            const headMean = headValues.length > 0 ? headValues.reduce((a, b) => a + b, 0) / headValues.length : NaN;
            const bodyMean = bodyValues.length > 0 ? bodyValues.reduce((a, b) => a + b, 0) / bodyValues.length : NaN;

            ctdipHeadMean = round(headMean);
            ctdipBodyMean = round(bodyMean);

            const ctdicHead = parseFloat(ctdicRow?.head || '0');
            const ctdicBody = parseFloat(ctdicRow?.body || '0');

            if (!isNaN(ctdicHead) && !isNaN(headMean)) {
                ctdiwHead = round((1 / 3) * ctdicHead + (2 / 3) * headMean);
            }
            if (!isNaN(ctdicBody) && !isNaN(bodyMean)) {
                ctdiwBody = round((1 / 3) * ctdicBody + (2 / 3) * bodyMean);
            }
        }

        return table2Rows.map((row) => {
            if (row.id === 'ctdip') return { ...row, head: ctdipHeadMean, body: ctdipBodyMean };
            if (row.id === 'ctdiw') return { ...row, head: ctdiwHead, body: ctdiwBody };
            return row;
        });
    }, [table2Rows]);

    // === Form Valid ===
    const isFormValid = useMemo(() => {
        return (
            !!serviceId &&
            table1Row.kvp.trim() &&
            table1Row.mAs.trim() &&
            table1Row.sliceThickness.trim() &&
            table2Rows.find(r => r.id === 'ctdic')?.head.trim() &&
            table2Rows.find(r => r.id === 'ctdic')?.body.trim() &&
            table2Rows.find(r => r.id === 'peripheral')?.readings?.every(r => r.head.trim() && r.body.trim())
        );
    }, [serviceId, table1Row, table2Rows]);

    // === Load Data ===
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
                    const response = await getMeasurementOfCTDIByTestId(propTestId);
                    rec = response.data || response;
                } else {
                    rec = await getMeasurementOfCTDIByServiceId(serviceId);
                }

                if (rec) {
                    setTestId(rec._id || propTestId);
                    if (rec.table1?.[0]) {
                        setTable1Row(rec.table1[0]);
                    }

                    if (Array.isArray(rec.table2)) {
                        const peripheralRow = rec.table2.find((r: any) => r.id === 'peripheral');
                        if (peripheralRow?.readings) {
                            setPeripheralLabels(peripheralRow.readings.map((r: any) => r.label));
                        }

                        setTable2Rows(
                            rec.table2.map((r: any) => {
                                if (r.id === 'peripheral') {
                                    return {
                                        ...r,
                                        readings: r.readings?.map((rd: any) => ({
                                            id: Date.now().toString() + rd.label,
                                            label: rd.label,
                                            head: String(rd.head || ''),
                                            body: String(rd.body || ''),
                                        })) || [],
                                    };
                                }
                                return {
                                    ...r,
                                    head: String(r.head || ''),
                                    body: String(r.body || ''),
                                };
                            })
                        );
                    }

                    if (rec.tolerance) {
                        setTolerance({
                            expected: { value: rec.tolerance.expected?.value || '', quote: rec.tolerance.expected?.quote || '' },
                            maximum: { value: rec.tolerance.maximum?.value || '', quote: rec.tolerance.maximum?.quote || '' },
                        });
                    }

                    setHasSaved(true);
                    setIsEditing(false);
                } else {
                    setHasSaved(false);
                    setIsEditing(true);
                }
            } catch (e: any) {
                if (e.response?.status !== 404) toast.error('Failed to load data');
                setHasSaved(false);
                setIsEditing(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [serviceId, propTestId]);

    // === Save / Update ===
    const handleSave = async () => {
        if (!isFormValid) return;
        setIsSaving(true);

        const payload = {
            table1: [table1Row],
            table2: table2Rows.map(r => {
                if (r.id === 'peripheral') {
                    return {
                        id: r.id,
                        result: r.result,
                        readings: r.readings?.map(rd => ({
                            label: rd.label,
                            head: parseFloat(rd.head) || null,
                            body: parseFloat(rd.body) || null,
                        })),
                    };
                }
                return {
                    id: r.id,
                    result: r.result,
                    head: parseFloat(r.head) || null,
                    body: parseFloat(r.body) || null,
                };
            }),
            tolerance,
        };

        try {
            let res;
            if (testId) {
                res = await updateMeasurementOfCTDI(testId, payload);
                toast.success('Updated successfully!');
            } else {
                res = await addMeasurementOfCTDI(serviceId, payload);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Measurement of CTDI</h2>

            {/* ==================== Table 1: Fixed Single Row ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Operating Parameters
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    kVp
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    mAs
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Slice Thickness (mm)
                                </th>
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
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="120"
                                    />
                                </td>
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={table1Row.mAs}
                                        onChange={e => setTable1Row(p => ({ ...p, mAs: e.target.value }))}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="100"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={table1Row.sliceThickness}
                                        onChange={e => setTable1Row(p => ({ ...p, sliceThickness: e.target.value }))}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="5.0"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==================== Table 2: CTDI Results ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    CTDI Results (mGy/100mAs)
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Results
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Head
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Body
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {processedTable2.map((row) => {
                                if (row.id === 'peripheral' && row.readings) {
                                    return (
                                        <React.Fragment key={row.id}>
                                            <tr className="bg-gray-50 font-medium">
                                                <td colSpan={3} className="px-6 py-2 text-left border-r">
                                                    {row.result}
                                                    {!isViewMode && (
                                                        <button
                                                            onClick={addPeripheralColumn}
                                                            className="ml-4 p-1 text-green-600 hover:bg-green-100 rounded"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {row.readings.map((reading, idx) => (
                                                <tr key={reading.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-2 pl-12 border-r">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={reading.label}
                                                                onChange={(e) => updatePeripheralLabel(idx, e.target.value)}
                                                                disabled={isViewMode}
                                                                className={`w-12 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                                    }`}
                                                            />
                                                            {peripheralLabels.length > 1 && !isViewMode && (
                                                                <button
                                                                    onClick={() => removePeripheralColumn(idx)}
                                                                    className="text-red-600 hover:bg-red-100 p-0.5 rounded"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2 border-r">
                                                        <input
                                                            type="text"
                                                            value={reading.head}
                                                            onChange={(e) => updatePeripheralValue(reading.id, 'head', e.target.value)}
                                                            disabled={isViewMode}
                                                            className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                                }`}
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <input
                                                            type="text"
                                                            value={reading.body}
                                                            onChange={(e) => updatePeripheralValue(reading.id, 'body', e.target.value)}
                                                            disabled={isViewMode}
                                                            className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                                }`}
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                }

                                return (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-2 font-medium border-r">{row.result}</td>
                                        <td className="px-6 py-2 border-r">
                                            {row.id === 'ctdiwRated' || row.id === 'ctdic' ? (
                                                <input
                                                    type="text"
                                                    value={row.head}
                                                    onChange={(e) => updateTable2Value(row.id, 'head', e.target.value)}
                                                    disabled={isViewMode}
                                                    className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                        }`}
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <span className="block text-center font-medium">{row.head || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-2">
                                            {row.id === 'ctdiwRated' || row.id === 'ctdic' ? (
                                                <input
                                                    type="text"
                                                    value={row.body}
                                                    onChange={(e) => updateTable2Value(row.id, 'body', e.target.value)}
                                                    disabled={isViewMode}
                                                    className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                                        }`}
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <span className="block text-center font-medium">{row.body || '—'}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==================== Tolerance Section ==================== */}
            <div className="bg-white p-6 shadow-md rounded-lg space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Tolerance</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Value</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tolerance.expected.value}
                                onChange={(e) => setTolerance(p => ({ ...p, expected: { ...p.expected, value: e.target.value } }))}
                                disabled={isViewMode}
                                className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                    }`}
                                placeholder="e.g. 10.50"
                            />
                            <span className="self-center text-sm text-gray-600">mGy/100mAs</span>
                        </div>
                        <textarea
                            value={tolerance.expected.quote}
                            onChange={(e) => setTolerance(p => ({ ...p, expected: { ...p.expected, quote: e.target.value } }))}
                            rows={2}
                            disabled={isViewMode}
                            className={`mt-2 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                }`}
                            placeholder="Quote or reference..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Value</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tolerance.maximum.value}
                                onChange={(e) => setTolerance(p => ({ ...p, maximum: { ...p.maximum, value: e.target.value } }))}
                                disabled={isViewMode}
                                className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                    }`}
                                placeholder="e.g. 12.00"
                            />
                            <span className="self-center text-sm text-gray-600">mGy/100mAs</span>
                        </div>
                        <textarea
                            value={tolerance.maximum.quote}
                            onChange={(e) => setTolerance(p => ({ ...p, maximum: { ...p.maximum, quote: e.target.value } }))}
                            rows={2}
                            disabled={isViewMode}
                            className={`mt-2 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                }`}
                            placeholder="Quote or reference..."
                        />
                    </div>
                </div>
            </div>

            {/* ==================== SAVE BUTTON ==================== */}
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
                            {buttonText} CTDI
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MeasurementOfCTDI;