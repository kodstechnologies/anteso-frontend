// components/TestTables/ConsistencyOfRadiationOutput.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FCDData {
  value: string; // e.g. "100" cm
}

interface OutputMeasurement {
  value: string;
}

interface OutputRow {
  id: string;
  kv: string;
  mas: string;
  outputs: OutputMeasurement[];
  avg: string;
  cv: string;
  remark: 'Pass' | 'Fail' | '';
}

interface Tolerance {
  operator: '<=' | '<' | '>=' | '>';
  value: string; // e.g. "5.0"
}

const ConsistencyOfRadiationOutput: React.FC = () => {
  const [fcd, setFcd] = useState<FCDData>({ value: '' });
  const [measurementCount, setMeasurementCount] = useState<number>(5);

  const [tolerance, setTolerance] = useState<Tolerance>({
    operator: '<=',
    value: '5.0',
  });

  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kv: '80',
      mas: '100',
      outputs: Array(5).fill({ value: '' }),
      avg: '',
      cv: '',
      remark: '',
    },
  ]);

  // Calculate avg, CV and remark – pure calculation, no state mutation needed
  const rowsWithCalc = useMemo(() => {
    const tolValue = parseFloat(tolerance.value) || 5.0;

    return outputRows.map((row): OutputRow => {
      const values = row.outputs
        .map(m => parseFloat(m.value))
        .filter(v => !isNaN(v) && v > 0);

      if (values.length === 0) {
        return { ...row, avg: '', cv: '', remark: '' };
      }

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? (stdDev / avg) * 100 : 0;

      const passes =
        tolerance.operator === '<=' || tolerance.operator === '<'
          ? cv <= tolValue
          : cv >= tolValue;

      const remark: 'Pass' | 'Fail' = passes ? 'Pass' : 'Fail';

      return {
        ...row,
        avg: avg.toFixed(3),
        cv: cv.toFixed(2),
        remark,
      };
    });
  }, [outputRows, tolerance]);

  // Handlers
  const updateFcd = (value: string) => setFcd({ value });

  const updateMeasurementCount = (count: number) => {
    if (count < 3 || count > 10) return;
    setMeasurementCount(count);

    setOutputRows(prev =>
      prev.map(row => {
        const diff = count - row.outputs.length;
        if (diff > 0) {
          return {
            ...row,
            outputs: [...row.outputs, ...Array(diff).fill({ value: '' })],
          };
        }
        if (diff < 0) {
          return { ...row, outputs: row.outputs.slice(0, count) };
        }
        return row;
      })
    );
  };

  const addRow = () => {
    setOutputRows(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        kv: '',
        mas: '',
        outputs: Array(measurementCount).fill({ value: '' }),
        avg: '',
        cv: '',
        remark: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (outputRows.length <= 1) return;
    setOutputRows(prev => prev.filter(r => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'kv' | 'mas', value: string) => {
    setOutputRows(prev =>
      prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const updateMeasurement = (rowId: string, index: number, value: string) => {
    setOutputRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        const outputs = [...row.outputs];
        outputs[index] = { value: value.replace(/[^0-9.-]/g, '') };
        return { ...row, outputs };
      })
    );
  };

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">
        Reproducibility of Radiation Output (Consistency Test)
      </h2>

      {/* FCD */}
      <div className="bg-white rounded-lg border shadow-sm">
        
        <div className="p-6 flex items-center gap-4">
          <label className="w-48 text-sm font-medium text-gray-700">FCD:</label>
          <input
            type="text"
            value={fcd.value}
            onChange={e => updateFcd(e.target.value)}
            className="w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none"
            placeholder="100"
          />
          <span className="text-gray-600">cm</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">
            Radiation Output Measurements (mGy)
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">Measurements per row:</span>
            <input
              type="number"
              min="3"
              max="10"
              value={measurementCount}
              onChange={e => updateMeasurementCount(Number(e.target.value))}
              className="w-16 px-2 py-1 border rounded text-center"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r">
                  kV
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r">
                  mAs
                </th>
                {Array.from({ length: measurementCount }, (_, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r"
                  >
                    Meas {i + 1}
                  </th>
                ))}
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                  Average
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                  CV (%) / Result
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rowsWithCalc.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-r">
                    <input
                      type="text"
                      value={row.kv}
                      onChange={e => updateCell(row.id, 'kv', e.target.value)}
                      className="w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400"
                      placeholder="80"
                    />
                  </td>
                  <td className="px-5 py-4 border-r">
                    <input
                      type="text"
                      value={row.mas}
                      onChange={e => updateCell(row.id, 'mas', e.target.value)}
                      className="w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400"
                      placeholder="100"
                    />
                  </td>
                  {row.outputs.map((meas, i) => (
                    <td key={i} className="px-2 py-4 border-r">
                      <input
                        type="text"
                        value={meas.value}
                        onChange={e => updateMeasurement(row.id, i, e.target.value)}
                        className="w-20 px-2 py-1.5 text-center border rounded text-xs focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-5 py-4 text-center font-semibold border-r bg-blue-50">
                    {row.avg || '—'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                        row.remark === 'Pass'
                          ? 'bg-green-100 text-green-800'
                          : row.remark === 'Fail'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {row.cv ? `${row.cv}% → ${row.remark}` : '—'}
                    </span>
                  </td>
                  <td className="px-3 text-center">
                    {outputRows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="textMY-red-600 hover:bg-red-50 p-2 rounded transition"
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

        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Technique
          </button>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-white rounded-lg border p-6 max-w-md shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Acceptance Criteria</h3>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Coefficient of Variation (CV)</span>
          <select
            value={tolerance.operator}
            onChange={e =>
              setTolerance({ ...tolerance, operator: e.target.value as any })
            }
            className="px-4 py-2 border rounded font-medium"
          >
            <option value="<=">≤</option>
            <option value="<">&lt;</option>
            <option value=">=">≥</option>
            <option value=">">&gt;</option>
          </select>
          <input
            type="text"
            value={tolerance.value}
            onChange={e =>
              setTolerance({
                ...tolerance,
                value: e.target.value.replace(/[^0-9.]/g, ''),
              })
            }
            className="w-24 px-4 py-2 text-center border-2 border-blue-500 rounded font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <span className="text-gray-700">%</span>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Reference: IEC 61223-3-1 & AERB Safety Code
        </p>
      </div>
    </div>
  );
};

export default ConsistencyOfRadiationOutput;