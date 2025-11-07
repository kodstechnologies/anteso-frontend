import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Table1Row {
  id: string;
  fcd: string;
  kv: string;
}

interface Table2Row {
  id: string;
  mAsApplied: string;
  measuredOutputs: string[];
  // Now manually editable
  xMax: string;
  xMin: string;
  col: string;
  remarks: string;
}

const LinearityOfmAsLoading: React.FC = () => {
  /* ==================== Table 1: FCD & kV Only ==================== */
  const [table1Rows, setTable1Rows] = useState<Table1Row[]>([
    { id: '1', fcd: '', kv: '' },
  ]);

  const addTable1Row = () => {
    setTable1Rows((prev) => [...prev, { id: Date.now().toString(), fcd: '', kv: '' }]);
  };

  const removeTable1Row = (id: string) => {
    if (table1Rows.length <= 1) return;
    setTable1Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTable1Cell = (rowId: string, field: 'fcd' | 'kv', value: string) => {
    setTable1Rows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  /* ==================== Table 2: Dynamic Measurement Columns ==================== */
  const [measHeaders, setMeasHeaders] = useState<string[]>(['Meas 1', 'Meas 2', 'Meas 3']);

  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', mAsApplied: '10', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', mAsApplied: '20', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', mAsApplied: '50', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', mAsApplied: '100', measuredOutputs: ['', '', ''], xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');

  /* ---------- Measurement Column Handling ---------- */
  const addMeasColumn = () => {
    const newHeader = `Meas ${measHeaders.length + 1}`;
    setMeasHeaders((prev) => [...prev, newHeader]);
    setTable2Rows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredOutputs: [...row.measuredOutputs, ''],
      }))
    );
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders((prev) => prev.filter((_, i) => i !== idx));
    setTable2Rows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredOutputs: row.measuredOutputs.filter((_, i) => i !== idx),
      }))
    );
  };

  const updateMeasHeader = (idx: number, value: string) => {
    setMeasHeaders((prev) => {
      const copy = [...prev];
      copy[idx] = value || `Meas ${idx + 1}`;
      return copy;
    });
  };

  /* ---------- Table 2 Row Handling ---------- */
  const addTable2Row = () => {
    const newRow: Table2Row = {
      id: Date.now().toString(),
      mAsApplied: '',
      measuredOutputs: Array(measHeaders.length).fill(''),
      xMax: '',
      xMin: '',
      col: '',
      remarks: '',
    };
    setTable2Rows((prev) => [...prev, newRow]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows((prev) => prev.filter((r) => r.id !== id));
  };

  /* ---------- Table 2 Cell Update (with manual override) ---------- */
  const updateTable2Cell = (
    rowId: string,
    field: 'mAsApplied' | 'xMax' | 'xMin' | 'col' | 'remarks' | number,
    value: string
  ) => {
    setTable2Rows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (field === 'mAsApplied' || field === 'xMax' || field === 'xMin' || field === 'col' || field === 'remarks') {
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

  /* ---------- Auto-calculate X, Avg, Xmax/Xmin, CoL, Remarks ---------- */
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;

    return table2Rows.map((row, i) => {
      // Parse measured outputs for current row
      const outputs = row.measuredOutputs.map(v => parseFloat(v));
      const valid = outputs.filter(v => !isNaN(v) && v > 0);

      const avg = valid.length > 0
        ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(3)
        : '—';

      const mAs = parseFloat(row.mAsApplied);
      const x = avg !== '—' && mAs > 0
        ? (parseFloat(avg) / mAs).toFixed(4)
        : '—';

      // Default values (only auto-fill if empty)
      let xMax = row.xMax;
      let xMin = row.xMin;
      let col = row.col;
      let remarks = row.remarks;

      // Only calculate linearity between consecutive rows
      if (i < table2Rows.length - 1) {
        const nextRow = table2Rows[i + 1];

        const nextOutputs = nextRow.measuredOutputs.map(v => parseFloat(v));
        const nextValid = nextOutputs.filter(v => !isNaN(v) && v > 0);
        const nextAvg = nextValid.length > 0
          ? nextValid.reduce((a, b) => a + b, 0) / nextValid.length
          : 0;
        const nextmAs = parseFloat(nextRow.mAsApplied);
        const xNext = nextmAs > 0 ? nextAvg / nextmAs : 0;

        const currX = parseFloat(x);
        if (!isNaN(currX) && currX > 0 && xNext > 0) {
          const maxVal = Math.max(currX, xNext);
          const minVal = Math.min(currX, xNext);
          const diff = Math.abs(currX - xNext);
          const sum = currX + xNext;
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
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">Linearity of mAs</h2>

      {/* ==================== Table 1: FCD & kV Only ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                FCD (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                kV
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table1Rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap border-r">
                  <input
                    type="text"
                    value={row.fcd}
                    onChange={(e) => updateTable1Cell(row.id, 'fcd', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={row.kv}
                    onChange={(e) => updateTable1Cell(row.id, 'kv', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="80"
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

        <div className="px-4 py-3 bg-gray-50 border-t flex justify-start">
          <button
            onClick={addTable1Row}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* ==================== Table 2: Linearity Results ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                mAs Applied
              </th>

              <th
                colSpan={measHeaders.length}
                className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
              >
                <div className="flex items-center justify-between">
                  <span>Radiation Output (mGy)</span>
                  <button
                    onClick={addMeasColumn}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                    title="Add Measurement Column"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </th>

              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Avg Output
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                X (mGy/mAs)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                X MAX
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                X MIN
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                CoL
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Remarks
              </th>
              <th rowSpan={2} className="w-10" />
            </tr>

            <tr>
              {measHeaders.map((header, idx) => (
                <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateMeasHeader(idx, e.target.value)}
                      className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Meas ${idx + 1}`}
                    />
                    {measHeaders.length > 1 && (
                      <button
                        onClick={() => removeMeasColumn(idx)}
                        className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        title="Remove Column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {processedTable2.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                {/* mAs Applied */}
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.mAsApplied}
                    onChange={(e) => updateTable2Cell(p.id, 'mAsApplied', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </td>

                {/* Dynamic Measured Outputs */}
                {p.measuredOutputs.map((val, colIdx) => (
                  <td key={colIdx} className="px-2 py-2 border-r">
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => updateTable2Cell(p.id, colIdx, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                ))}

                {/* Average Output (auto) */}
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">
                  {p.average}
                </td>

                {/* X (auto) */}
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">
                  {p.x}
                </td>

                {/* X MAX (editable) */}
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.xMax}
                    onChange={(e) => updateTable2Cell(p.id, 'xMax', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="—"
                  />
                </td>

                {/* X MIN (editable) */}
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.xMin}
                    onChange={(e) => updateTable2Cell(p.id, 'xMin', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="—"
                  />
                </td>

                {/* CoL (editable) */}
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.col}
                    onChange={(e) => updateTable2Cell(p.id, 'col', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="—"
                  />
                </td>

                {/* Remarks (editable) */}
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={p.remarks}
                    onChange={(e) => updateTable2Cell(p.id, 'remarks', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pass/Fail"
                  />
                </td>

                {/* Remove Row */}
                <td className="px-2 py-2 text-center">
                  {table2Rows.length > 1 && (
                    <button
                      onClick={() => removeTable2Row(p.id)}
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
            onClick={addTable2Row}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) &lt;</span>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="0.1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearityOfmAsLoading;