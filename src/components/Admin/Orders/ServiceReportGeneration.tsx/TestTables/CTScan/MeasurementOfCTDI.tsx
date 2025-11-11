// components/TestTables/MeasyrementOfCTDI.tsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Table1Row {
    id: string;
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
    // For peripheral: will hold dynamic readings
    readings?: PeripheralReading[];
}

const MeasurementOfCTDI: React.FC = () => {
    /* ==================== Table 1: kVp, mAs, Slice Thickness ==================== */
    const [table1Rows, setTable1Rows] = useState<Table1Row[]>([
        { id: '1', kvp: '', mAs: '', sliceThickness: '' },
    ]);

    const addTable1Row = () => {
        setTable1Rows((prev) => [
            ...prev,
            { id: Date.now().toString(), kvp: '', mAs: '', sliceThickness: '' },
        ]);
    };

    const removeTable1Row = (id: string) => {
        if (table1Rows.length <= 1) return;
        setTable1Rows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateTable1 = (id: string, field: 'kvp' | 'mAs' | 'sliceThickness', value: string) => {
        setTable1Rows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    /* ==================== Table 2: CTDI Calculations ==================== */
    const [peripheralLabels, setPeripheralLabels] = useState<string[]>(['A', 'B', 'C']);

    const initialRows: Table2Row[] = [
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
    ];

    const [table2Rows, setTable2Rows] = useState<Table2Row[]>(initialRows);

    /* ---------- Peripheral Column Handling ---------- */
    const addPeripheralColumn = () => {
        const nextLabel = String.fromCharCode(65 + peripheralLabels.length); // D, E, F...
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
        setPeripheralLabels((prev) => prev.filter((_, i) => i !== index));
        setTable2Rows((prev) =>
            prev.map((row) => {
                if (row.id === 'peripheral' && row.readings) {
                    return {
                        ...row,
                        readings: row.readings.filter((_, i) => i !== index),
                    };
                }
                return row;
            })
        );
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

    const updatePeripheralValue = (
        readingId: string,
        field: 'head' | 'body',
        value: string
    ) => {
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

    /* ---------- Auto-calculate CTDIp(mean), CTDIw ---------- */
    const processedTable2 = useMemo(() => {
        const round = (num: number) => (isNaN(num) ? '' : num.toFixed(2));

        const ctdicRow = table2Rows.find((r) => r.id === 'ctdic');
        const peripheralRow = table2Rows.find((r) => r.id === 'peripheral');
        const ctdiwRow = table2Rows.find((r) => r.id === 'ctdiw');
        const ctdiwRatedRow = table2Rows.find((r) => r.id === 'ctdiwRated');

        let ctdipHeadMean = '';
        let ctdipBodyMean = '';
        let ctdiwHead = '';
        let ctdiwBody = '';

        if (peripheralRow?.readings) {
            const headValues = peripheralRow.readings
                .map((r) => parseFloat(r.head))
                .filter((v) => !isNaN(v));
            const bodyValues = peripheralRow.readings
                .map((r) => parseFloat(r.body))
                .filter((v) => !isNaN(v));

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
            if (row.id === 'ctdip') {
                return { ...row, head: ctdipHeadMean, body: ctdipBodyMean };
            }
            if (row.id === 'ctdiw') {
                return { ...row, head: ctdiwHead, body: ctdiwBody };
            }
            return row;
        });
    }, [table2Rows]);

    /* ==================== Tolerance ==================== */
    const [expectedValue, setExpectedValue] = useState<string>('');
    const [expectedQuote, setExpectedQuote] = useState<string>('');
    const [maximumValue, setMaximumValue] = useState<string>('');
    const [maximumQuote, setMaximumQuote] = useState<string>('');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Measurement of CTDI</h2>

            {/* ==================== Table 1: kVp, mAs, Slice Thickness ==================== */}
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
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table1Rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.kvp}
                                            onChange={(e) => updateTable1(row.id, 'kvp', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="120"
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.mAs}
                                            onChange={(e) => updateTable1(row.id, 'mAs', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="100"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={row.sliceThickness}
                                            onChange={(e) => updateTable1(row.id, 'sliceThickness', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="5.0"
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        {table1Rows.length > 1 && (
                                            <button
                                                onClick={() => removeTable1Row(row.id)}
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
                <div className="px-6 py-3 bg-gray-50 border-t">
                    <button
                        onClick={addTable1Row}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
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
                                                    <button
                                                        onClick={addPeripheralColumn}
                                                        className="ml-4 p-1 text-green-600 hover:bg-green-100 rounded"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
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
                                                                className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            {peripheralLabels.length > 1 && (
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
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-2">
                                                        <input
                                                            type="text"
                                                            value={reading.body}
                                                            onChange={(e) => updatePeripheralValue(reading.id, 'body', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            {row.id === 'ctdiwRated' ? (
                                                <input
                                                    type="text"
                                                    value={row.head}
                                                    onChange={(e) => updateTable2Value(row.id, 'head', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            ) : row.id === 'ctdic' ? (
                                                <input
                                                    type="text"
                                                    value={row.head}
                                                    onChange={(e) => updateTable2Value(row.id, 'head', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <span className="block text-center font-medium">{row.head || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-2">
                                            {row.id === 'ctdiwRated' ? (
                                                <input
                                                    type="text"
                                                    value={row.body}
                                                    onChange={(e) => updateTable2Value(row.id, 'body', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            ) : row.id === 'ctdic' ? (
                                                <input
                                                    type="text"
                                                    value={row.body}
                                                    onChange={(e) => updateTable2Value(row.id, 'body', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expected Value
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={expectedValue}
                                onChange={(e) => setExpectedValue(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 10.50"
                            />
                            <span className="self-center text-sm text-gray-600">mGy/100mAs</span>
                        </div>
                        <textarea
                            value={expectedQuote}
                            onChange={(e) => setExpectedQuote(e.target.value)}
                            rows={2}
                            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Quote or reference for expected value..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum Value
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={maximumValue}
                                onChange={(e) => setMaximumValue(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 12.00"
                            />
                            <span className="self-center text-sm text-gray-600">mGy/100mAs</span>
                        </div>
                        <textarea
                            value={maximumQuote}
                            onChange={(e) => setMaximumQuote(e.target.value)}
                            rows={2}
                            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Quote or reference for maximum limit..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeasurementOfCTDI;