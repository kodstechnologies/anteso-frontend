import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// ---------- Table 1 – FCD ----------
interface FCDRow {
  id: string;
  fcd: string;
}

// ---------- Table 2 – Radiation Output ----------
interface OutputRow {
  id: string;
  kv: string;
  mas: string;
  outputs: string[];      // one entry per dynamic column
  avg: string;
  remark: string;
}

interface Props {
  serviceId: string;
  tubeId?: string | null;
}

const ConsisitencyOfRadiationOutput: React.FC<Props> = ({ serviceId, tubeId }) => {
  // ---- Table 1: FCD -------------------------------------------------
  const [fcdRows, setFcdRows] = useState<FCDRow[]>([{ id: '1', fcd: '' }]);

  const addFcdRow = () => {
    setFcdRows((prev) => [...prev, { id: Date.now().toString(), fcd: '' }]);
  };
  const removeFcdRow = (id: string) => {
    if (fcdRows.length <= 1) return;
    setFcdRows((prev) => prev.filter((r) => r.id !== id));
  };
  const updateFcdRow = (id: string, value: string) => {
    setFcdRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, fcd: value } : row))
    );
  };

  // ---- Table 2: Radiation Output ------------------------------------
  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kv: '',
      mas: '',
      outputs: ['', '', '', '', ''], // 5 starter columns
      avg: '',
      remark: '',
    },
  ]);

  // editable header names – start with “Meas 1 … Meas 5”
  const [outputHeaders, setOutputHeaders] = useState<string[]>([
    'Meas 1',
    'Meas 2',
    'Meas 3',
    'Meas 4',
    'Meas 5',
  ]);

  const outputColumnsCount = outputHeaders.length;

  // ---- Column handling ------------------------------------------------
  const addOutputColumn = () => {
    const newHeader = `Meas ${outputHeaders.length + 1}`;
    setOutputHeaders((prev) => [...prev, newHeader]);

    setOutputRows((prev) =>
      prev.map((row) => ({
        ...row,
        outputs: [...row.outputs, ''],
      }))
    );
  };

  const removeOutputColumn = (colIdx: number) => {
    if (outputHeaders.length <= 1) return;
    setOutputHeaders((prev) => prev.filter((_, i) => i !== colIdx));

    setOutputRows((prev) =>
      prev.map((row) => ({
        ...row,
        outputs: row.outputs.filter((_, i) => i !== colIdx),
      }))
    );
  };

  const updateHeader = (colIdx: number, newName: string) => {
    setOutputHeaders((prev) => {
      const copy = [...prev];
      copy[colIdx] = newName || `Meas ${colIdx + 1}`;
      return copy;
    });
  };

  // ---- Row handling --------------------------------------------------
  const addOutputRow = () => {
    setOutputRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        kv: '',
        mas: '',
        outputs: Array(outputColumnsCount).fill(''),
        avg: '',
        remark: '',
      },
    ]);
  };

  const removeOutputRow = (rowId: string) => {
    if (outputRows.length <= 1) return;
    setOutputRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // ---- Cell update ---------------------------------------------------
  const updateCell = (
    rowId: string,
    field: 'kv' | 'mas' | 'avg' | 'remark' | number,
    value: string
  ) => {
    setOutputRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (field === 'kv' || field === 'mas' || field === 'avg' || field === 'remark') {
          return { ...row, [field]: value };
        }

        // field === column index for measured outputs
        if (typeof field === 'number') {
          const newOutputs = [...row.outputs];
          newOutputs[field] = value;
          return { ...row, outputs: newOutputs };
        }
        return row;
      })
    );
  };

  // ---- Tolerance ------------------------------------------------------
  const [tolerance, setTolerance] = useState<string>('');

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">
        Consistency of Radiation Output
      </h2>

      {/* ==================== Table 1: FCD ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          FCD (cm)
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                FCD (cm)
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fcdRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-2">
                  <input
                    type="text"
                    value={row.fcd}
                    onChange={(e) => updateFcdRow(row.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  {fcdRows.length > 1 && (
                    <button
                      onClick={() => removeFcdRow(row.id)}
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
        <div className="px-6 py-3 bg-gray-50 border-t flex justify-start">
          <button
            onClick={addFcdRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* ==================== Table 2: Radiation Output ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Radiation Output Measurements
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              {/* ---- First header row ---- */}
              <tr>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  Applied kV
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  mAs
                </th>

                {/* Dynamic measured columns + plus button */}
                <th
                  colSpan={outputColumnsCount}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    <button
                      onClick={addOutputColumn}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Add Column"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  Avg (X̄)
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  Remarks
                </th>
                <th rowSpan={2} className="w-10" />
              </tr>

              {/* ---- Second header row (editable column names) ---- */}
              <tr>
                {outputHeaders.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => updateHeader(idx, e.target.value)}
                        className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Meas ${idx + 1}`}
                      />
                      {outputColumnsCount > 1 && (
                        <button
                          onClick={() => removeOutputColumn(idx)}
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

            {/* ---- Body ---- */}
            <tbody className="bg-white divide-y divide-gray-200">
              {outputRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {/* kV */}
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kv}
                      onChange={(e) => updateCell(row.id, 'kv', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="80"
                    />
                  </td>

                  {/* mAs */}
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.mas}
                      onChange={(e) => updateCell(row.id, 'mas', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </td>

                  {/* Dynamic measured outputs */}
                  {row.outputs.map((val, colIdx) => (
                    <td key={colIdx} className="px-2 py-2 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateCell(row.id, colIdx, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1.25"
                      />
                    </td>
                  ))}

                  {/* Avg */}
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.avg}
                      onChange={(e) => updateCell(row.id, 'avg', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1.25"
                    />
                  </td>

                  {/* Remarks */}
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => updateCell(row.id, 'remark', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Pass"
                    />
                  </td>

                  {/* Delete Row (only in the very last column) */}
                  <td className="px-2 py-2 text-center">
                    {outputRows.length > 1 && (
                      <button
                        onClick={() => removeOutputRow(row.id)}
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
        </div>

        {/* Add Row button (bottom) */}
        <div className="px-6 py-3 bg-gray-50 border-t flex justify-start">
          <button
            onClick={addOutputRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance
        </label>
        <div className="flex items-center gap-2 max-w-xs">
          <span className="text-sm text-gray-600">Less than or equal to</span>
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="5.0"
          />
        </div>
      </div>
    </div>
  );
};

export default ConsisitencyOfRadiationOutput;