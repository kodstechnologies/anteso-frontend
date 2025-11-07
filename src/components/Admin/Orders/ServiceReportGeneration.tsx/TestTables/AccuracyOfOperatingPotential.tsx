import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface RowData {
    id: string;
    appliedKvp: string;
    measuredValues: string[];   // values for each column
    averageKvp: string;
    remarks: string;
}

const AccuracyOfOperatingPotential: React.FC = () => {
    const [rows, setRows] = useState<RowData[]>([
        {
            id: '1',
            appliedKvp: '',
            measuredValues: ['', '', ''],
            averageKvp: '',
            remarks: '',
        }, 
    ]);

    // **NEW** – array of column header names (one per measured column)
    const [measuredHeaders, setMeasuredHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);

    const [tolerance, setTolerance] = useState<string>('');

    /* ----------  Column handling ---------- */
    const addMeasuredColumn = () => {
        const newHeader = `Meas ${measuredHeaders.length + 1}`;
        setMeasuredHeaders((prev) => [...prev, newHeader]);

        setRows((prevRows) =>
            prevRows.map((row) => ({
                ...row,
                measuredValues: [...row.measuredValues, ''],
            }))
        );
    };

    const removeMeasuredColumn = (colIndex: number) => {
        if (measuredHeaders.length <= 1) return;
        setMeasuredHeaders((prev) => prev.filter((_, i) => i !== colIndex));

        setRows((prevRows) =>
            prevRows.map((row) => ({
                ...row,
                measuredValues: row.measuredValues.filter((_, i) => i !== colIndex),
            }))
        );
    };

    const updateHeader = (colIndex: number, newName: string) => {
        setMeasuredHeaders((prev) => {
            const copy = [...prev];
            copy[colIndex] = newName || `Meas ${colIndex + 1}`;
            return copy;
        });
    };

    /* ----------  Row handling ---------- */
    const addRow = () => {
        const newRow: RowData = {
            id: Date.now().toString(),
            appliedKvp: '',
            measuredValues: Array(measuredHeaders.length).fill(''),
            averageKvp: '',
            remarks: '',
        };
        setRows((prev) => [...prev, newRow]);
    };

    const removeRow = (rowId: string) => {
        if (rows.length <= 1) return;
        setRows((prev) => prev.filter((r) => r.id !== rowId));
    };

    /* ----------  Cell update (average calc) ---------- */
    const updateCell = (rowId: string, field: keyof RowData | number, value: string) => {
        setRows((prevRows) =>
            prevRows.map((row) => {
                if (row.id !== rowId) return row;

                if (field === 'appliedKvp' || field === 'remarks') {
                    return { ...row, [field]: value };
                }

                if (typeof field === 'number') {
                    const newMeasured = [...row.measuredValues];
                    newMeasured[field] = value;

                    const nums = newMeasured
                        .filter((v) => v !== '' && !isNaN(Number(v)))
                        .map(Number);
                    const avg =
                        nums.length > 0
                            ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
                            : '';

                    return { ...row, measuredValues: newMeasured, averageKvp: avg };
                }
                return row;
            })
        );
    };

    const measuredColumnsCount = measuredHeaders.length;

    return (
        <div className="p-6 max-w-full overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">Accuracy of Operating Potential</h2>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                rowSpan={2}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                            >
                                Applied kVp
                            </th>

                            <th
                                colSpan={measuredColumnsCount}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                            >
                                <div className="flex items-center justify-between">
                                    <span>Measured Values</span>
                                    <button
                                        onClick={addMeasuredColumn}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                                        title="Add Column"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </th>

                            <th
                                rowSpan={2}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                            >
                                Average kVp
                            </th>

                            <th
                                rowSpan={2}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Remarks
                            </th>

                            <th rowSpan={2} className="w-10" />
                        </tr>

                        {/* ---- DYNAMIC HEADERS ---- */}
                        <tr>
                            {measuredHeaders.map((header, idx) => (
                                <th
                                    key={idx}
                                    className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => updateHeader(idx, e.target.value)}
                                            className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Meas ${idx + 1}`}
                                        />
                                        {measuredColumnsCount > 1 && (
                                            <button
                                                onClick={() => removeMeasuredColumn(idx)}
                                                className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                                title="Remove Column"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap border-r">
                                    <input
                                        type="text"
                                        value={row.appliedKvp}
                                        onChange={(e) => updateCell(row.id, 'appliedKvp', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. 80"
                                    />
                                </td>

                                {row.measuredValues.map((val, colIdx) => (
                                    <td key={colIdx} className="px-2 py-2 whitespace-nowrap border-r">
                                        <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => updateCell(row.id, colIdx, e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.0"
                                        />
                                    </td>
                                ))}

                                <td className="px-4 py-2 whitespace-nowrap border-r font-medium">
                                    {row.averageKvp || '-'}
                                </td>

                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={row.remarks}
                                        onChange={(e) => updateCell(row.id, 'remarks', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter remarks"
                                    />
                                </td>

                                <td className="px-2 py-2 text-center">
                                    {rows.length > 1 && (
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="text-red-600 hover:bg-red-100 p-1 rounded"
                                            title="Remove Row"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Add Row */}
                <div className="px-4 py-3 bg-gray-50 border-t flex justify-start">
                    <button
                        onClick={addRow}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Row
                    </button>
                </div>
            </div>

            {/* Tolerance */}
            <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerance for kVp:
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. ±5% or ±2 kVp"
                    />
                    <span className="text-sm text-gray-500">%</span>
                </div>
            </div>
        </div>
    );
};

export default AccuracyOfOperatingPotential;