import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// === Table 1: kVp and mA ===
interface Table1Row {
    id: string;
    kvp: string;
    ma: string;
}

// === Table 2: Slice Thickness ===
interface Table2Row {
    id: string;
    applied: string;
    measured: string;
    tolerancePlus: string;
    toleranceMinus: string;
    remarks: string;
}

const RadiationProfileWidth: React.FC = () => {
    // --- Table 1 State ---
    const [table1Rows, setTable1Rows] = useState<Table1Row[]>([
        { id: '1', kvp: '', ma: '' },
    ]);

    const addTable1Row = () => {
        setTable1Rows((prev) => [
            ...prev,
            { id: Date.now().toString(), kvp: '', ma: '' },
        ]);
    };

    const removeTable1Row = (id: string) => {
        if (table1Rows.length <= 1) return;
        setTable1Rows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateTable1 = (id: string, field: 'kvp' | 'ma', value: string) => {
        setTable1Rows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // --- Table 2 State ---
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        {
            id: '1',
            applied: '',
            measured: '',
            tolerancePlus: '',
            toleranceMinus: '',
            remarks: '',
        },
    ]);

    const addTable2Row = () => {
        setTable2Rows((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                applied: '',
                measured: '',
                tolerancePlus: '',
                toleranceMinus: '',
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
        field: 'applied' | 'measured' | 'tolerancePlus' | 'toleranceMinus' | 'remarks',
        value: string
    ) => {
        setTable2Rows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Radiation Profile Width
            </h2>

            {/* ==================== Table 1: kVp and mA ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Tube Operating Parameters
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    kVp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    mA
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
                                            value={row.kvp}
                                            onChange={(e) => updateTable1(row.id, 'kvp', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="80"
                                        />
                                    </td>
                                    <td className="px-6 py-2">
                                        <input
                                            type="text"
                                            value={row.ma}
                                            onChange={(e) => updateTable1(row.id, 'ma', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="100"
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        {table1Rows.length > 1 && (
                                            <button
                                                onClick={() => removeTable1Row(row.id)}
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
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t flex justify-start">
                    <button
                        onClick={addTable1Row}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Row
                    </button>
                </div>
            </div>

            {/* ==================== Table 2: Slice Thickness ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Slice Thickness Measurement
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Applied Slice Thickness (mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Measured Slice Thickness (mm)
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Tolerance (± mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Remarks
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table2Rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    {/* Applied */}
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.applied}
                                            onChange={(e) => updateTable2(row.id, 'applied', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="5.0"
                                        />
                                    </td>

                                    {/* Measured */}
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.measured}
                                            onChange={(e) => updateTable2(row.id, 'measured', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="4.8"
                                        />
                                    </td>

                                    {/* Tolerance (±) – split into two inputs */}
                                    <td className="px-4 py-2 border-r">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-600">±</span>
                                            <input
                                                type="text"
                                                value={row.tolerancePlus}
                                                onChange={(e) => updateTable2(row.id, 'tolerancePlus', e.target.value)}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.5"
                                            />
                                            <span className="text-xs text-gray-600">/</span>
                                            <input
                                                type="text"
                                                value={row.toleranceMinus}
                                                onChange={(e) => updateTable2(row.id, 'toleranceMinus', e.target.value)}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.5"
                                            />
                                        </div>
                                    </td>

                                    {/* Remarks */}
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={row.remarks}
                                            onChange={(e) => updateTable2(row.id, 'remarks', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Pass"
                                        />
                                    </td>

                                    {/* Remove Row */}
                                    <td className="px-2 py-2 text-center">
                                        {table2Rows.length > 1 && (
                                            <button
                                                onClick={() => removeTable2Row(row.id)}
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
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t flex justify-start">
                    <button
                        onClick={addTable2Row}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RadiationProfileWidth;