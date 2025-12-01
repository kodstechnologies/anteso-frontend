// components/TestTables/ConsistencyOfRadiationOutput.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save } from 'lucide-react';

interface OutputMeasurement {
  value: string;
}

interface OutputRow {
  id: string;
  kv: string;
  mas: string;
  outputs: OutputMeasurement[];
  avg: string;
  remark: string;
}

interface Tolerance {
  operator: string;
  value: string;
}

const ReproducibilityOfRadiationOutput: React.FC = () => {
  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kv: '28',
      mas: '100',
      outputs: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }],
      avg: '',
      remark: '',
    },
  ]);

  const [outputHeaders, setOutputHeaders] = useState<string[]>([
    'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
  ]);

  const [tolerance, setTolerance] = useState<Tolerance>({ operator: '<=', value: '5.0' });
  const [isEditing, setIsEditing] = useState(true);

  const outputColumnsCount = outputHeaders.length;

  // Auto calculate average, CV, and remark
  useEffect(() => {
    const toleranceValue = parseFloat(tolerance.value) || 5.0;

    setOutputRows(prev =>
      prev.map(row => {
        const values = row.outputs
          .map(m => parseFloat(m.value))
          .filter(v => !isNaN(v) && v > 0);

        if (values.length === 0) {
          return { ...row, avg: '', remark: '' };
        }

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const avgStr = avg.toFixed(3);

        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const cv = avg > 0 ? (stdDev / avg) * 100 : 0;
        const cvStr = cv.toFixed(2);

        const remark = cv <= toleranceValue ? 'Pass' : 'Fail';

        return { ...row, avg: avgStr, remark: `${cvStr}% → ${remark}` };
      })
    );
  }, [outputRows.map(r => r.outputs.map(o => o.value).join()).join(), tolerance.value]);

  // Column handlers
  const addOutputColumn = () => {
    const newHeader = `Meas ${outputHeaders.length + 1}`;
    setOutputHeaders(prev => [...prev, newHeader]);
    setOutputRows(prev => prev.map(row => ({
      ...row,
      outputs: [...row.outputs, { value: '' }],
    })));
  };

  const removeOutputColumn = (idx: number) => {
    if (outputHeaders.length <= 3) return;
    setOutputHeaders(prev => prev.filter((_, i) => i !== idx));
    setOutputRows(prev => prev.map(row => ({
      ...row,
      outputs: row.outputs.filter((_, i) => i !== idx),
    })));
  };

  const updateHeader = (idx: number, value: string) => {
    setOutputHeaders(prev => prev.map((h, i) => i === idx ? (value || `Meas ${i + 1}`) : h));
  };

  // Row handlers
  const addOutputRow = () => {
    setOutputRows(prev => [...prev, {
      id: Date.now().toString(),
      kv: '28',
      mas: '100',
      outputs: Array(outputColumnsCount).fill(null).map(() => ({ value: '' })),
      avg: '',
      remark: '',
    }]);
  };

  const removeOutputRow = (id: string) => {
    if (outputRows.length <= 1) return;
    setOutputRows(prev => prev.filter(r => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'kv' | 'mas' | number, value: string) => {
    setOutputRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        if (field === 'kv' || field === 'mas') return { ...row, [field]: value };
        if (typeof field === 'number') {
          const outputs = [...row.outputs];
          outputs[field] = { value };
          return { ...row, outputs };
        }
        return row;
      })
    );
  };

  const toggleEdit = () => setIsEditing(prev => !prev);

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Consistency of Radiation Output (Reproducibility)
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleEdit}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" /> Save & Lock
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <h3 className="px-6 py-4 text-lg font-semibold bg-blue-50 text-blue-900 border-b">
          Radiation Output Measurements
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">kV</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mAs</th>
                <th colSpan={outputColumnsCount} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    {isEditing && (
                      <button onClick={addOutputColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">Avg (X̄)</th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">CV % / Remark</th>
                <th rowSpan={2} className="w-10" />
              </tr>
              <tr>
                {outputHeaders.map((h, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHeader(i, e.target.value)}
                        readOnly={!isEditing}
                        className="w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      {isEditing && outputColumnsCount > 3 && (
                        <button onClick={() => removeOutputColumn(i)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outputRows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kv}
                      onChange={e => updateCell(row.id, 'kv', e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-3 py-2 text-center border rounded text-sm bg-white"
                      placeholder="28"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.mas}
                      onChange={e => updateCell(row.id, 'mas', e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-3 py-2 text-center border rounded text-sm bg-white"
                      placeholder="100"
                    />
                  </td>
                  {row.outputs.map((measurement, i) => (
                    <td key={i} className="px-2 py-2 border-r">
                      <input
                        type="text"
                        value={measurement.value}
                        onChange={e => updateCell(row.id, i, e.target.value)}
                        readOnly={!isEditing}
                        className="w-full px-3 py-2 text-center border rounded text-sm bg-white"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 border-r font-medium text-center bg-blue-50">
                    {row.avg || '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${row.remark.includes('Pass') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {row.remark || '—'}
                    </span>
                  </td>
                  <td className="px-2 text-center">
                    {isEditing && outputRows.length > 1 && (
                      <button onClick={() => removeOutputRow(row.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-start">
          {isEditing && (
            <button onClick={addOutputRow} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Technique
            </button>
          )}
        </div>
      </div>

      {/* Tolerance */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-6 max-w-md">
        <label className="block text-lg font-semibold text-gray-800 mb-3">
          Acceptance Criteria (CV {tolerance.operator} {tolerance.value}%)
        </label>
        <div className="flex items-center gap-4">
          <span className="text-lg">CV</span>
          <span className="text-3xl font-bold">{tolerance.operator}</span>
          <input
            type="text"
            value={tolerance.value}
            onChange={e => setTolerance(prev => ({ ...prev, value: e.target.value }))}
            readOnly={!isEditing}
            className="w-32 px-4 py-3 text-xl font-bold text-center border-4 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-300 bg-white"
          />
          <span className="text-lg">%</span>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          IEC 61223-3-1 & AERB: Coefficient of Variation should be {tolerance.operator} {tolerance.value}%
        </p>
      </div>
    </div>
  );
};

export default ReproducibilityOfRadiationOutput;