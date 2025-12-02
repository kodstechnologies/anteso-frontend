// components/TestTables/LinearityOfMasLLoading.tsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, Edit3 } from 'lucide-react';

interface ExposureCondition {
  fcd: string;
  kv: string;
}

interface Table2Row {
  id: string;
  mAsRange: string;
  measuredOutputs: string[];
}

const LinearityOfMasLLoading: React.FC = () => {
  const [exposureCondition, setExposureCondition] = useState<ExposureCondition>({
    fcd: '100',
    kv: '80',
  });

  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', mAsRange: '5 - 10', measuredOutputs: ['', '', ''] },
    { id: '2', mAsRange: '10 - 20', measuredOutputs: ['', '', ''] },
    { id: '3', mAsRange: '20 - 50', measuredOutputs: ['', '', ''] },
    { id: '4', mAsRange: '50 - 100', measuredOutputs: ['', '', ''] },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');
  const [isEditing, setIsEditing] = useState(true); // Always editable (no save/load)

  // Handlers
  const addMeasColumn = () => {
    setMeasHeaders(p => [...p, `Meas ${p.length + 1}`]);
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: [...r.measuredOutputs, ''] })));
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(p => p.filter((_, i) => i !== idx));
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: r.measuredOutputs.filter((_, i) => i !== idx) })));
  };

  const addTable2Row = () => {
    setTable2Rows(p => [
      ...p,
      { id: Date.now().toString(), mAsRange: '', measuredOutputs: Array(measHeaders.length).fill('') },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows(p => p.filter(r => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'mAsRange' | number, value: string) => {
    setTable2Rows(p =>
      p.map(r => {
        if (r.id !== rowId) return r;
        if (field === 'mAsRange') return { ...r, mAsRange: value };
        if (typeof field === 'number') {
          const outputs = [...r.measuredOutputs];
          outputs[field] = value;
          return { ...r, measuredOutputs: outputs };
        }
        return r;
      })
    );
  };

  // CoL Calculation (same logic, fully client-side)
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';

      const match = row.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      const midMas = match
        ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
        : parseFloat(row.mAsRange) || 0;

      const x = avg !== '—' && midMas > 0 ? (parseFloat(avg) / midMas).toFixed(4) : '—';
      if (x !== '—') xValues.push(parseFloat(x));

      return { ...row, average: avg, x };
    });

    const hasData = xValues.length > 0;
    const xMax = hasData ? Math.max(...xValues).toFixed(4) : '—';
    const xMin = hasData ? Math.min(...xValues).toFixed(4) : '—';
    const colNum = hasData
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : 0;
    const col = hasData ? colNum.toFixed(3) : '—';
    const pass = hasData && colNum <= tol;

    return rowsWithX.map(row => ({
      ...row,
      col,
      remarks: hasData ? (pass ? 'Pass' : 'Fail') : '—',
    }));
  }, [table2Rows, tolerance]);

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Linearity of mAs Loading (Across mAs Ranges)</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-green-600">Local Mode (No Save)</span>
        </div>
      </div>

      {/* Exposure Conditions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-teal-50 border-b">
          <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">FCD (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">kV</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-6 py-4 border-r">
                <input
                  type="text"
                  value={exposureCondition.fcd}
                  onChange={e => setExposureCondition(p => ({ ...p, fcd: e.target.value }))}
                  className="w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={exposureCondition.kv}
                  onChange={e => setExposureCondition(p => ({ ...p, kv: e.target.value }))}
                  className="w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">Linearity of Radiation Output Across mAs Ranges</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mAs Range</th>
                <th colSpan={measHeaders.length} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">
                  <div className="flex items-center justify-between px-4">
                    <span>Radiation Output (mGy)</span>
                    <button onClick={addMeasColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">Avg Output</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">X (mGy/mAs)</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">CoL</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Remarks</th>
                <th rowSpan={2} className="w-12"></th>
              </tr>
              <tr>
                {measHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={e => {
                          setMeasHeaders(p => {
                            const c = [...p];
                            c[i] = e.target.value || `Meas ${i + 1}`;
                            return c;
                          });
                        }}
                        className="w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      {measHeaders.length > 1 && (
                        <button onClick={() => removeMeasColumn(i)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={p.mAsRange}
                      onChange={e => updateCell(p.id, 'mAsRange', e.target.value)}
                      className="w-full px-3 py-2 text-center text-sm border rounded font-medium focus:ring-2 focus:ring-blue-500"
                      placeholder="10 - 20"
                    />
                  </td>
                  {p.measuredOutputs.map((val, idx) => (
                    <td key={idx} className="px-3 py-4 text-center border-r">
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={e => updateCell(p.id, idx, e.target.value)}
                        className="w-24 px-3 py-2 text-center text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.average}</td>
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.x}</td>
                  <td className="px-6 py-4 text-center font-bold border-r bg-yellow-50">{p.col}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      p.remarks === 'Pass' ? 'bg-green-100 text-green-800' :
                      p.remarks === 'Fail' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.remarks}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {table2Rows.length > 1 && (
                      <button onClick={() => removeTable2Row(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={addTable2Row} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus className="w-5 h-5" /> Add mAs Range
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) ≤</span>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              className="w-32 px-4 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearityOfMasLLoading;