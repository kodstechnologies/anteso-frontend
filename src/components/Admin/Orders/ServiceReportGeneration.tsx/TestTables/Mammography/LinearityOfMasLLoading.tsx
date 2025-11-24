// components/TestTables/LinearityOfMasLLoading.tsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Table1Row {
  id: string;
  fcd: string;
  kv: string;
}

interface Table2Row {
  id: string;
  mAsRange: string;
  measuredOutputs: string[];
  xMax: string;
  xMin: string;
  col: string;
  remarks: string;
}

const LinearityOfMasLLoading: React.FC = () => {
  /* ==================== Table 1: FCD & kV (Single Row Only) ==================== */
  const [exposureCondition] = useState<Table1Row>({
    id: '1',
    fcd: '100',
    kv: '80',
  });

  /* ==================== Table 2: Linearity Measurement ==================== */
  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);

  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', mAsRange: '5 - 10', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', mAsRange: '10 - 20', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', mAsRange: '20 - 50', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', mAsRange: '50 - 100', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');

  /* ---------- Measurement Column Handling ---------- */
  const addMeasColumn = () => {
    const newHeader = `Meas ${measHeaders.length + 1}`;
    setMeasHeaders(prev => [...prev, newHeader]);
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        measuredOutputs: [...row.measuredOutputs, ''],
      }))
    );
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(prev => prev.filter((_, i) => i !== idx));
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        measuredOutputs: row.measuredOutputs.filter((_, i) => i !== idx),
      }))
    );
  };

  const updateMeasHeader = (idx: number, value: string) => {
    setMeasHeaders(prev => {
      const copy = [...prev];
      copy[idx] = value || `Meas ${idx + 1}`;
      return copy;
    });
  };

  /* ---------- Table 2 Row Handling ---------- */
  const addTable2Row = () => {
    const newRow: Table2Row = {
      id: Date.now().toString(),
      mAsRange: '',
      measuredOutputs: Array(measHeaders.length).fill(''),
      xMax: '',
      xMin: '',
      col: '',
      remarks: '',
    };
    setTable2Rows(prev => [...prev, newRow]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows(prev => prev.filter(r => r.id !== id));
  };

  /* ---------- Cell Update ---------- */
  const updateTable2Cell = (
    rowId: string,
    field: 'mAsRange' | 'xMax' | 'xMin' | 'col' | 'remarks' | number,
    value: string
  ) => {
    setTable2Rows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;

        if (field === 'mAsRange' || field === 'xMax' || field === 'xMin' || field === 'col' || field === 'remarks') {
          return { ...row, [field]: value };
        }

        if (typeof field === 'number') {
          const newOutputs = [...row.measuredOutputs];
          newOutputs[field] = value;
          return { ...row, measuredOutputs: newOutputs };
        }
        return row;
      })
    );
  };

  /* ---------- Auto-calculate Avg, X, CoL, Remarks ---------- */
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;

    return table2Rows.map((row, i) => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v));
      const valid = outputs.filter(v => !isNaN(v) && v > 0);

      const avg = valid.length > 0
        ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(3)
        : '—';

      const x = avg !== '—'
        ? (parseFloat(avg)).toFixed(4)  // X = average output (since no single mAs)
        : '—';

      let xMax = row.xMax;
      let xMin = row.xMin;
      let col = row.col;
      let remarks = row.remarks;

      if (i < table2Rows.length - 1) {
        const nextRow = table2Rows[i + 1];
        const nextOutputs = nextRow.measuredOutputs.map(v => parseFloat(v));
        const nextValid = nextOutputs.filter(v => !isNaN(v) && v > 0);
        const nextAvg = nextValid.length > 0
          ? nextValid.reduce((a, b) => a + b, 0) / nextValid.length
          : 0;

        const currX = parseFloat(x);
        const nextX = nextAvg > 0 ? nextAvg : 0;

        if (!isNaN(currX) && currX > 0 && nextX > 0) {
          const maxVal = Math.max(currX, nextX);
          const minVal = Math.min(currX, nextX);
          const diff = Math.abs(currX - nextX);
          const sum = currX + nextX;
          const colVal = sum > 0 ? diff / sum : 0;

          xMax = xMax === '' ? maxVal.toFixed(4) : xMax;
          xMin = xMin === '' ? minVal.toFixed(4) : xMin;
          col = col === '' ? colVal.toFixed(3) : col;
          remarks = remarks === '' ? (colVal <= tol ? 'Pass' : 'Fail') : remarks;
        }
      }

      return {
        ...row,
        average: avg,
        x,
        xMax,
        xMin,
        col,
        remarks,
      };
    });
  }, [table2Rows, tolerance]);

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">
        Linearity of mAs Loading (Across mAs Ranges)
      </h2>

      {/* Table 1: Single Exposure Condition */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-teal-50 border-b">
          <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                FCD (cm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                kV
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-r">
                <input
                  type="text"
                  value={exposureCondition.fcd}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 text-center font-medium cursor-not-allowed"
                />
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={exposureCondition.kv}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 text-center font-medium cursor-not-allowed"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Linearity Across mAs Ranges */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">Linearity of Radiation Output Across mAs Ranges</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">
                  mAs Range
                </th>
                <th colSpan={measHeaders.length} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    <button onClick={addMeasColumn} className="p-2 text-green-600 hover:bg-green-100 rounded">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">Avg Output</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">X (mGy)</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">X MAX</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">X MIN</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">CoL</th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Remarks</th>
                <th rowSpan={2} className="w-12"></th>
              </tr>
              <tr>
                {measHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={e => updateMeasHeader(i, e.target.value)}
                        className="w-20 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      {measHeaders.length > 1 && (
                        <button onClick={() => removeMeasColumn(i)} className="text-red-600 p-1">
                          <Trash2 className="w-3 h-3" />
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
                      onChange={e => updateTable2Cell(p.id, 'mAsRange', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-center text-sm font-medium focus:ring-2 focus:ring-blue-500"
                      placeholder="10 - 20"
                    />
                  </td>
                  {p.measuredOutputs.map((val, idx) => (
                    <td key={idx} className="px-3 py-4 text-center border-r">
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={e => updateTable2Cell(p.id, idx, e.target.value)}
                        className="w-24 px-3 py-2 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.average}</td>
                  <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.x}</td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={p.xMax}
                      onChange={e => updateTable2Cell(p.id, 'xMax', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={p.xMin}
                      onChange={e => updateTable2Cell(p.id, 'xMin', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={p.col}
                      onChange={e => updateTable2Cell(p.id, 'col', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${p.remarks === 'Pass' ? 'bg-green-100 text-green-800' :
                        p.remarks === 'Fail' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {p.remarks || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {table2Rows.length > 1 && (
                      <button onClick={() => removeTable2Row(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <button
            onClick={addTable2Row}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" /> Add mAs Range
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) &lt;</span>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              className="w-28 px-4 py-2.5 border-2 border-blue-400 rounded-lg text-center font-bold focus:ring-4 focus:ring-blue-200"
              placeholder="0.1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearityOfMasLLoading;