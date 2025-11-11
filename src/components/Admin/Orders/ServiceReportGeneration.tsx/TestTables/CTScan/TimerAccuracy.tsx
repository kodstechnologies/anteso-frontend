// components/TestTables/TimerAccuracy.tsx
import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Table 1: kVp, Slice Thickness, mA
interface Table1Row {
  id: string;
  kvp: string;
  sliceThickness: string;
  ma: string;
}

// Table 2: Set Time, Observed Time, % Error, Remark
interface Table2Row {
  id: string;
  setTime: string;
  observedTime: string;
  percentError: string; // auto-calculated
  remarks: string;
}

const TimerAccuracy: React.FC = () => {
  // === Table 1 ===
  const [table1Rows, setTable1Rows] = useState<Table1Row[]>([
    { id: '1', kvp: '', sliceThickness: '', ma: '' },
  ]);

  const addTable1Row = () => {
    setTable1Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), kvp: '', sliceThickness: '', ma: '' },
    ]);
  };

  const removeTable1Row = (id: string) => {
    if (table1Rows.length <= 1) return;
    setTable1Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTable1 = (
    id: string,
    field: 'kvp' | 'sliceThickness' | 'ma',
    value: string
  ) => {
    setTable1Rows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // === Table 2 ===
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', setTime: '', observedTime: '', percentError: '', remarks: '' },
  ]);

  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), setTime: '', observedTime: '', percentError: '', remarks: '' },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTable2 = (
    id: string,
    field: 'setTime' | 'observedTime' | 'remarks',
    value: string
  ) => {
    setTable2Rows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // === Tolerance ===
  const [tolerance, setTolerance] = useState<string>('5'); // e.g. 5%

  // === Auto-calculate % Error ===
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0;

    return table2Rows.map((row) => {
      const set = parseFloat(row.setTime);
      const obs = parseFloat(row.observedTime);

      let percentError = '';
      let remarks = row.remarks;

      if (!isNaN(set) && !isNaN(obs) && set > 0) {
        const error = ((Math.abs(set - obs) / set) * 100).toFixed(2);
        percentError = `${error}%`;

        // Auto-remarks based on tolerance
        if (remarks === '' || remarks.toLowerCase().includes('auto')) {
          remarks = parseFloat(error) <= tol ? 'Pass' : 'Fail';
        }
      }

      return { ...row, percentError, remarks };
    });
  }, [table2Rows, tolerance]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Timer Accuracy Test</h2>

      {/* ==================== Table 1: kVp, Slice Thickness, mA ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Operating Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  kVp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Slice Thickness (mm)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  mA
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table1Rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kvp}
                      onChange={(e) => updateTable1(row.id, 'kvp', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="80"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.sliceThickness}
                      onChange={(e) => updateTable1(row.id, 'sliceThickness', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5.0"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.ma}
                      onChange={(e) => updateTable1(row.id, 'ma', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {table1Rows.length > 1 && (
                      <button
                        onClick={() => removeTable1Row(row.id)}
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
            onClick={addTable1Row}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>
      </div>

      {/* ==================== Table 2: Timer Accuracy ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Timer Accuracy Measurement
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Set Time (ms)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Observed Time (ms)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  % Error
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.setTime}
                      onChange={(e) => updateTable2(row.id, 'setTime', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.observedTime}
                      onChange={(e) => updateTable2(row.id, 'observedTime', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="98.5"
                    />
                  </td>
                  <td className="px-4 py-2 border-r font-medium bg-gray-50 text-center">
                    {row.percentError || '-'}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => updateTable2(row.id, 'remarks', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Pass"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {table2Rows.length > 1 && (
                      <button
                        onClick={() => removeTable2Row(row.id)}
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
            onClick={addTable2Row}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>
      </div>

      {/* ==================== Tolerance Field ==================== */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tolerance for Timer Accuracy (%):
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 5"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </div>
    </div>
  );
};

export default TimerAccuracy;