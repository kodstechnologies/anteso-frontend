// components/TestTables/TotalFilterationForCTScan.tsx
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Row {
    id: string;
    appliedKV: string;
    appliedMA: string;
    time: string;
    sliceThickness: string;
    measuredTF: string; // stored as string for input control
    remark: string;
}

const TotalFilterationForCTScan: React.FC = () => {
    const [rows, setRows] = useState<Row[]>([
        {
            id: '1',
            appliedKV: '120',
            appliedMA: '100',
            time: '1.0',
            sliceThickness: '5.0',
            measuredTF: '2.50',
            remark: '',
        },
    ]);

    const [tolerance, setTolerance] = useState<string>('±0.5 mm');

    // Add new row
    const addRow = () => {
        setRows((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                appliedKV: '',
                appliedMA: '',
                time: '',
                sliceThickness: '',
                measuredTF: '',
                remark: '',
            },
        ]);
    };

    // Remove row (keep at least one)
    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    // Update any field
    const updateRow = (id: string, field: keyof Row, value: string) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;

                // Special handling: round Measured TF to 2 decimal places
                if (field === 'measuredTF') {
                    const num = parseFloat(value);
                    const rounded = isNaN(num) ? '' : num.toFixed(2);
                    return { ...row, [field]: rounded };
                }

                return { ...row, [field]: value };
            })
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Total Filtration for CT Scan
            </h2>

            {/* ==================== Main Table ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
                    Filtration Measurement
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Applied kV
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Applied mA
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Time (s)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Slice Thickness (mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Measured TF (mm of Al)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Remark
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.appliedKV}
                                            onChange={(e) => updateRow(row.id, 'appliedKV', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="120"
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.appliedMA}
                                            onChange={(e) => updateRow(row.id, 'appliedMA', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="100"
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.time}
                                            onChange={(e) => updateRow(row.id, 'time', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="1.0"
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.sliceThickness}
                                            onChange={(e) => updateRow(row.id, 'sliceThickness', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="5.0"
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="text"
                                            value={row.measuredTF}
                                            onChange={(e) => updateRow(row.id, 'measuredTF', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                                            placeholder="2.50"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={row.remark}
                                            onChange={(e) => updateRow(row.id, 'remark', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="e.g. Within limits"
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        {rows.length > 1 && (
                                            <button
                                                onClick={() => removeRow(row.id)}
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
                        onClick={addRow}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add Measurement
                    </button>
                </div>
            </div>

            {/* ==================== Tolerance (Outside) ==================== */}
            <div className="bg-white p-6 shadow-md rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerance for Total Filtration:
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g. ±0.5 mm"
                    />
                </div>
            </div>
        </div>
    );
};

export default TotalFilterationForCTScan;