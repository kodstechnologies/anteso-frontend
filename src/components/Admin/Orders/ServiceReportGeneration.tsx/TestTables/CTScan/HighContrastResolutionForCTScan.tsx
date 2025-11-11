// components/TestTables/HighContrastResolutionForCTScan.tsx
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Table 1: Parameters
interface ParamRow {
  id: string;
  parameter: string;
  value: string;
}

// Table 2: Results
interface ResultRow {
  id: string;
  size: string;
  value: string;
  unit: string;
}

const HighContrastResolutionForCTScan: React.FC = () => {
  /* ==================== Table 1: Parameters ==================== */
  const [paramRows, setParamRows] = useState<ParamRow[]>([
    { id: '1', parameter: 'Line Pairs (lp/mm)', value: '10' },
  ]);

  const addParamRow = () => {
    setParamRows((prev) => [
      ...prev,
      { id: Date.now().toString(), parameter: '', value: '' },
    ]);
  };

  const removeParamRow = (id: string) => {
    if (paramRows.length <= 1) return;
    setParamRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateParamRow = (id: string, field: 'parameter' | 'value', newValue: string) => {
    setParamRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: newValue } : row
      )
    );
  };

  /* ==================== Table 2: Results ==================== */
  const [resultRows, setResultRows] = useState<ResultRow[]>([
    { id: '1', size: '1.0', value: 'Visible', unit: 'lp/mm' },
  ]);

  const addResultRow = () => {
    setResultRows((prev) => [
      ...prev,
      { id: Date.now().toString(), size: '', value: '', unit: '' },
    ]);
  };

  const removeResultRow = (id: string) => {
    if (resultRows.length <= 1) return;
    setResultRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateResultRow = (
    id: string,
    field: 'size' | 'value' | 'unit',
    newValue: string
  ) => {
    setResultRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: newValue } : row
      )
    );
  };

  /* ==================== Tolerance ==================== */
  const [tolerance, setTolerance] = useState<string>('±10%');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        High Contrast Resolution for CT Scan
      </h2>

      {/* ==================== Table 1: Parameters ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Test Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Parameter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Value
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paramRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.parameter}
                      onChange={(e) => updateParamRow(row.id, 'parameter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Line Pairs (lp/mm)"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateParamRow(row.id, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 10"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {paramRows.length > 1 && (
                      <button
                        onClick={() => removeParamRow(row.id)}
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
            onClick={addParamRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Parameter
          </button>
        </div>
      </div>

      {/* ==================== Table 2: Results ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-green-50 border-b">
          Resolution Results
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Size (mm)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.size}
                      onChange={(e) => updateResultRow(row.id, 'size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1.0"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateResultRow(row.id, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Visible"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateResultRow(row.id, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="lp/mm"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {resultRows.length > 1 && (
                      <button
                        onClick={() => removeResultRow(row.id)}
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
            onClick={addResultRow}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Result
          </button>
        </div>
      </div>

      {/* ==================== Tolerance (Outside) ==================== */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance for Resolution:
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. ±10% or ≥10 lp/mm"
          />
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolutionForCTScan;