import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FocalSpotRow {
  id: string;
  stated: string;
  measured: string;
  tolerance: string;
}

const EffectiveFocalspotMeasurement: React.FC = () => {
  const [rows, setRows] = useState<FocalSpotRow[]>([
    { id: '1', stated: '', measured: '', tolerance: '' },
  ]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now().toString(), stated: '', measured: '', tolerance: '' },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: 'stated' | 'measured' | 'tolerance',
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">Effective Focal Spot Measurement</h2>

      {/* Focal Spot Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Focal Spot Size
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Stated Value (mm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Measured Value (mm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tolerance (± mm)
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {/* Stated Value */}
                <td className="px-6 py-2 border-r">
                  <input
                    type="text"
                    value={row.stated}
                    onChange={(e) => updateRow(row.id, 'stated', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1.2"
                  />
                </td>
                {/* Measured Value */}
                <td className="px-6 py-2 border-r">
                  <input
                    type="text"
                    value={row.measured}
                    onChange={(e) => updateRow(row.id, 'measured', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1.18"
                  />
                </td>
                {/* Tolerance */}
                <td className="px-6 py-2">
                  <input
                    type="text"
                    value={row.tolerance}
                    onChange={(e) => updateRow(row.id, 'tolerance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.3"
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

        {/* Add Row Button at Bottom */}
        <div className="px-6 py-3 bg-gray-50 border-t flex justify-start">
          <button
            onClick={addRow}
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

export default EffectiveFocalspotMeasurement;