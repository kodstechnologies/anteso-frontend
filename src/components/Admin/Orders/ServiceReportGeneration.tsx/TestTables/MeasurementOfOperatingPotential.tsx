// components/TestTables/MeasurementOfOperatingPotential.tsx
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Table 1: Time & Slice Thickness
interface Table1Row {
    id: string;
    time: string;
    sliceThickness: string;
}

// Table 2: kV at different mA + Avg + Remarks
interface Table2Row {
    id: string;
    setKV: string;
    ma10: string;
    ma100: string;
    ma200: string;
    avgKvp: string;
    remarks: string;
}

const MeasurementOfOperatingPotential: React.FC = () => {
    // === Table 1 ===
    const [table1Rows, setTable1Rows] = useState<Table1Row[]>([
        { id: '1', time: '', sliceThickness: '' },
    ]);

    const addTable1Row = () => {
        setTable1Rows((prev) => [
            ...prev,
            { id: Date.now().toString(), time: '', sliceThickness: '' },
        ]);
    };

    const removeTable1Row = (id: string) => {
        if (table1Rows.length <= 1) return;
        setTable1Rows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateTable1 = (id: string, field: 'time' | 'sliceThickness', value: string) => {
        setTable1Rows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // === Table 2 ===
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        {
            id: '1',
            setKV: '',
            ma10: '',
            ma100: '',
            ma200: '',
            avgKvp: '',
            remarks: '',
        },
    ]);

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
            },
        ]);
    };

    const removeTable2Row = (id: string) => {
        if (table2Rows.length <= 1) return;
        setTable2Rows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateTable2 = (
        id: string,
        field: 'setKV' | 'ma10' | 'ma100' | 'ma200' | 'avgKvp' | 'remarks',
        value: string
    ) => {
        setTable2Rows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // Auto-calculate avg kVp
    const calculateAvg = (row: Table2Row): string => {
        const values = [row.ma10, row.ma100, row.ma200]
            .map((v) => parseFloat(v))
            .filter((v) => !isNaN(v));
        if (values.length === 0) return '';
        return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    };

    // Tolerance
    const [tolerance, setTolerance] = useState<string>('');

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Measurement of Operating Potential
            </h2>

            {/* ==================== Table 1: Time & Slice Thickness ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Exposure Time vs Slice Thickness
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Time (ms)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Slice Thickness (mm)
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table1Rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.time}
                                            onChange={(e) => updateTable1(row.id, 'time', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="100"
                                        />
                                    </td>
                                    <td className="px-6 py-2">
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

            {/* ==================== Table 2: kV at mA Levels ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    kV Measurement at Different mA
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Set kV
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    @ mA 10
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    @ mA 100
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    @ mA 200
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Avg kVp
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Remarks
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table2Rows.map((row) => {
                                const avg = calculateAvg(row);
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border-r">
                                            <input
                                                type="text"
                                                value={row.setKV}
                                                onChange={(e) => updateTable2(row.id, 'setKV', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="80"
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-r">
                                            <input
                                                type="text"
                                                value={row.ma10}
                                                onChange={(e) => updateTable2(row.id, 'ma10', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="79.5"
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-r">
                                            <input
                                                type="text"
                                                value={row.ma100}
                                                onChange={(e) => updateTable2(row.id, 'ma100', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="80.1"
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-r">
                                            <input
                                                type="text"
                                                value={row.ma200}
                                                onChange={(e) => updateTable2(row.id, 'ma200', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="79.8"
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-r font-medium bg-gray-50 text-center">
                                            {avg || '-'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={row.remarks}
                                                onChange={(e) => updateTable2(row.id, 'remarks', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Pass"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            {table2Rows.length > 1 && (
                                                <button
                                                    onClick={() => removeTable2Row(row.id)}
                                                    className="text-red-600 hover:bg-red-100 p-1 rounded"
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
                <div className="px-6 py-3 bg-gray-50 border-t">
                    <button
                        onClick={addTable2Row}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
                </div>
            </div>

            {/* ==================== Tolerance Field ==================== */}
            <div className="bg-white p-6 shadow-md rounded-lg">
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

export default MeasurementOfOperatingPotential;