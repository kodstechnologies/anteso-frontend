import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Row {
  id: string;
  distance: string;
  appliedKv: string;
  appliedMa: string;
  exposure: string;
  remark: string;
}

const ExposureRateTableTop: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([
    {
      id: '1',
      distance: '',
      appliedKv: '',
      appliedMa: '',
      exposure: '',
      remark: '',
    },
  ]);

  const [tolerance, setTolerance] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        distance: '',
        appliedKv: '',
        appliedMa: '',
        exposure: '',
        remark: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (
    id: string,
    field: 'distance' | 'appliedKv' | 'appliedMa' | 'exposure' | 'remark',
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">Exposure Rate at Table Top</h2>

      {/* ==================== Main Table ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Distance from Focus to Tabletop (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Applied kV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Applied mA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Exposure at Table Top (mGy)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remark
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {/* Distance */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.distance}
                    onChange={(e) => updateRow(row.id, 'distance', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </td>

                {/* Applied kV */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.appliedKv}
                    onChange={(e) => updateRow(row.id, 'appliedKv', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="80"
                  />
                </td>

                {/* Applied mA */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.appliedMa}
                    onChange={(e) => updateRow(row.id, 'appliedMa', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </td>

                {/* Exposure */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.exposure}
                    onChange={(e) => updateRow(row.id, 'exposure', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.85"
                  />
                </td>

                {/* Remark */}
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={row.remark}
                    onChange={(e) => updateRow(row.id, 'remark', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pass"
                  />
                </td>

                {/* Remove Row */}
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

        {/* Add Row Button */}
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

      {/* ==================== Tolerance & Note (Outside Table) ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tolerance
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">&lt;</span>
              <input
                type="text"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. ±10%"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. All values within tolerance"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExposureRateTableTop;