import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Row {
  id: string;
  parameter: string;
  value: string;
}

const HighContrastResolution: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([
    { id: '1', parameter: '', value: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('');

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now().toString(), parameter: '', value: '' },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: 'parameter' | 'value', newValue: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: newValue } : row
      )
    );
  };

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">High Contrast Resolution</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Parameters
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Values
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {/* Parameter */}
                <td className="px-4 py-2 whitespace-nowrap border-r">
                  <input
                    type="text"
                    value={row.parameter}
                    onChange={(e) => updateRow(row.id, 'parameter', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Line Pairs (lp/mm)"
                  />
                </td>

                {/* Value */}
                <td className="px-4 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 10"
                  />
                </td>

                {/* Remove Button */}
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

        {/* Add Row + Tolerance */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Tolerance &lt;</span>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. ±10%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolution;