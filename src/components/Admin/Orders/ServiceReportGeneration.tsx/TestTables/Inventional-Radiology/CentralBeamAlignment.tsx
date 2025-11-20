import React, { useState } from 'react';

const CentralBeamAlignment: React.FC = () => {
  // State for FCD table rows
  const [fcdRows, setFcdRows] = useState<string[]>(['']);

  // State for observed tilt rows
  const [tiltRows, setTiltRows] = useState<string[]>(['']);

  // State for tolerance
  const [toleranceValue, setToleranceValue] = useState<string>('1.5');
  // const [toleranceOperator, setToleranceOperator] = useState<'<' | '<=' | '>' | '>=' | '='>('≤');
    const [toleranceOperator, setToleranceOperator] = useState<'<' | '<=' | '>' | '>=' | '='>();


  // Add new empty row to FCD table
  const addFcdRow = () => {
    setFcdRows([...fcdRows, '']);
  };

  // Update FCD value
  const updateFcdRow = (index: number, value: string) => {
    const newRows = [...fcdRows];
    newRows[index] = value;
    setFcdRows(newRows);
  };

  // Add new empty row to Tilt table
  const addTiltRow = () => {
    setTiltRows([...tiltRows, '']);
  };

  // Update observed tilt value
  const updateTiltRow = (index: number, value: string) => {
    const newRows = [...tiltRows];
    newRows[index] = value;
    setTiltRows(newRows);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Central Beam Alignment</h1>

      {/* First Table: FCD (cm) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">FCD (cm)</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left">FCD (cm)</th>
              <th className="border border-gray-300 px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {fcdRows.map((value, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => updateFcdRow(index, e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter FCD in cm"
                  />
                </td>
                <td className="border border-gray-300 text-center">
                  {index === fcdRows.length - 1 && (
                    <button
                      onClick={addFcdRow}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      + Add
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Second Table: Observed Tilt */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">
          Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left">Observed Tilt (degrees)</th>
              <th className="border border-gray-300 px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {tiltRows.map((value, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => updateTiltRow(index, e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter observed tilt"
                  />
                </td>
                <td className="border border-gray-300 text-center">
                  {index === tiltRows.length - 1 && (
                    <button
                      onClick={addTiltRow}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      + Add
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tolerance Field - Outside the table */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tolerance - Central Beam Alignment</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-gray-700 font-medium">Acceptance Criteria:</span>
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm">
            <span className="text-lg">Tilt</span>
            <select
              value={toleranceOperator}
              onChange={(e) => setToleranceOperator(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="<">less than</option>
              <option value="<=">less than or equal to</option>
              <option value=">">greater than</option>
              <option value=">=">greater than or equal to</option>
              <option value="=">=</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={toleranceValue}
              onChange={(e) => setToleranceValue(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            />
            <span className="text-lg font-medium">degrees</span>
          </div>
          <span className="text-lg font-bold text-blue-700">
            → Currently set to: Tilt {toleranceOperator} {toleranceValue}°
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Default recommended tolerance: <strong>Tilt less than or equal to 1.5 degrees</strong>
        </p>
      </div>
    </div>
  );
};

export default CentralBeamAlignment;