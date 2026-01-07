// components/TestTables/OBI/LinearityOfTime.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfTimeForOBI,
  getLinearityOfTimeByServiceIdForOBI,
  updateLinearityOfTimeForOBI,
} from "../../../../../../api";

interface TestConditions {
  fdd: string;  // FDD (cm)
  kv: string;  // kV
  time: string; // Time (Sec)
}

interface MeasurementRow {
  id: string;
  maApplied: string; // mA Applied
  measuredOutputs: string[]; // Dynamic array of Radiation Outputs (mGy)
  averageOutput: string; // Average Output (mGy) - calculated
  mGyPerMAs: string; // mGy / mAs (X) - calculated
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  refreshKey?: number;
  initialData?: {
    testConditions?: {
      fdd: string;
      kv: string;
      time: string;
    };
    headers?: string[];
    tolerance?: string;
    measurementRows?: Array<{
      maApplied: string;
      radiationOutputs: string[];
      averageOutput?: string;
      mGyPerMAs?: string;
    }>;
  };
}

const LinearityOfTime: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh, refreshKey, initialData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Test Conditions (Fixed)
  const [testConditions, setTestConditions] = useState<TestConditions>({
    fdd: '',
    kv: '',
    time: '',
  });

  const [measHeaders, setMeasHeaders] = useState<string[]>(['1', '2', '3']);

  // Measurement Rows (Dynamic)
  const [measurementRows, setMeasurementRows] = useState<MeasurementRow[]>([
    {
      id: '1',
      maApplied: '',
      measuredOutputs: ['', '', ''],
      averageOutput: '',
      mGyPerMAs: '',
    },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');
  const [toleranceOperator, setToleranceOperator] = useState<string>('<=');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Column Handling
  const addMeasColumn = () => {
    setMeasHeaders((prev) => [...prev, `${prev.length + 1}`]);
    setMeasurementRows((prev) =>
      prev.map((row) => ({ ...row, measuredOutputs: [...row.measuredOutputs, ''] }))
    );
  };

  const removeMeasColumn = (index: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders((prev) => prev.filter((_, i) => i !== index));
    setMeasurementRows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredOutputs: row.measuredOutputs.filter((_, i) => i !== index),
      }))
    );
  };

  // Row Handling
  const addMeasurementRow = () => {
    setMeasurementRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        maApplied: '',
        measuredOutputs: Array(measHeaders.length).fill(''),
        averageOutput: '',
        mGyPerMAs: '',
      },
    ]);
  };

  const removeMeasurementRow = (id: string) => {
    if (measurementRows.length <= 1) return;
    setMeasurementRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateMeasurementRow = (
    id: string,
    field: 'maApplied' | number,
    value: string
  ) => {
    setMeasurementRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (typeof field === 'number') {
          const newOutputs = [...row.measuredOutputs];
          newOutputs[field] = value;
          return { ...row, measuredOutputs: newOutputs };
        }
        return { ...row, [field]: value };
      })
    );
  };

  // Auto-calculations
  const processedRows = useMemo(() => {
    const time = parseFloat(testConditions.time) || 0;
    const tol = parseFloat(tolerance) || 0.1;
    const mGyPerMAsValues: number[] = [];

    const rowsWithCalculations = measurementRows.map((row) => {
      // Calculate Average Output
      const outputs = row.measuredOutputs
        .map(v => parseFloat(v))
        .filter((v) => !isNaN(v) && v > 0);

      const averageOutput =
        outputs.length > 0
          ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(4)
          : '';

      // Calculate mGy / mAs (X)
      const maApplied = parseFloat(row.maApplied);
      const mGyPerMAs =
        averageOutput && !isNaN(maApplied) && maApplied > 0 && time > 0
          ? (parseFloat(averageOutput) / (maApplied * time)).toFixed(4)
          : '';

      if (mGyPerMAs) {
        mGyPerMAsValues.push(parseFloat(mGyPerMAs));
      }

      return {
        ...row,
        averageOutput,
        mGyPerMAs,
      };
    });

    // Calculate X MAX, X MIN, CoL, and Remarks
    const xMax = mGyPerMAsValues.length > 0 ? Math.max(...mGyPerMAsValues).toFixed(4) : '';
    const xMin = mGyPerMAsValues.length > 0 ? Math.min(...mGyPerMAsValues).toFixed(4) : '';

    const colNum = xMax && xMin && (parseFloat(xMax) + parseFloat(xMin)) > 0
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : null;
    const col = colNum !== null && colNum >= 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';

    // Determine pass/fail based on tolerance operator and CoL value
    let pass = false;
    let remarks = '—';
    
    if (col !== '—' && colNum !== null) {
      const colVal = parseFloat(col);
      switch (toleranceOperator) {
        case '<':
          pass = colVal < tol;
          break;
        case '>':
          pass = colVal > tol;
          break;
        case '<=':
          pass = colVal <= tol;
          break;
        case '>=':
          pass = colVal >= tol;
          break;
        case '=':
          pass = Math.abs(colVal - tol) < 0.0001;
          break;
        default:
          pass = colVal <= tol;
      }
      remarks = pass ? 'Pass' : 'Fail';
    }

    return {
      rows: rowsWithCalculations,
      xMax: xMax || '—',
      xMin: xMin || '—',
      coefficientOfLinearity: col,
      remarks,
    };
  }, [measurementRows, testConditions.time, tolerance, toleranceOperator]);

  // Load CSV Initial Data
  useEffect(() => {
    if (initialData) {
      console.log('LinearityOfTime: Loading initial data from CSV:', initialData);
      if (initialData.testConditions) {
        setTestConditions({
          fdd: initialData.testConditions.fdd || '',
          kv: initialData.testConditions.kv || '',
          time: initialData.testConditions.time || '',
        });
      }
      if (initialData.headers && initialData.headers.length > 0) {
        setMeasHeaders(initialData.headers);
      }
      if (initialData.tolerance) {
        setTolerance(initialData.tolerance);
      }
      if (initialData.measurementRows && initialData.measurementRows.length > 0) {
        const numCols = initialData.headers?.length || initialData.measurementRows[0]?.radiationOutputs?.length || 3;
        setMeasurementRows(
          initialData.measurementRows.map((r, i) => ({
            id: `csv-row-${Date.now()}-${i}`,
            maApplied: r.maApplied || '',
            measuredOutputs: r.radiationOutputs || Array(numCols).fill(''),
            averageOutput: r.averageOutput || '',
            mGyPerMAs: r.mGyPerMAs || '',
          }))
        );
      }
      setIsEditing(true);
      setIsLoading(false);
      console.log('LinearityOfTime: CSV data loaded into form');
    }
  }, [initialData]);

  // Load existing test data
  useEffect(() => {
    // Skip loading if we have initial CSV data
    if (initialData) {
      return;
    }

    if (!serviceId) return;

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getLinearityOfTimeByServiceIdForOBI(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          if (testData.testConditions) {
            setTestConditions({
              fdd: testData.testConditions.fdd || '',
              kv: testData.testConditions.kv || '',
              time: testData.testConditions.time || '',
            });
          }
          if (testData.measHeaders && testData.measHeaders.length > 0) {
            setMeasHeaders(testData.measHeaders);
          }
          if (testData.measurementRows && testData.measurementRows.length > 0) {
            setMeasurementRows(
              testData.measurementRows.map((r: any) => ({
                id: r.id || Date.now().toString() + Math.random(),
                maApplied: r.maApplied || '',
                measuredOutputs: Array.isArray(r.radiationOutputs)
                  ? r.radiationOutputs
                  : [r.radiationOutput1 || '', r.radiationOutput2 || '', r.radiationOutput3 || ''].filter(val => val !== undefined), // Fallback for old data
                averageOutput: r.averageOutput || '',
                mGyPerMAs: r.mGyPerMAs || '',
              }))
            );
            // Ensure row outputs match headers length
            setMeasurementRows(prev => prev.map(row => {
              const currentLen = row.measuredOutputs.length;
              const targetLen = testData.measHeaders?.length || 3;
              if (currentLen < targetLen) {
                return { ...row, measuredOutputs: [...row.measuredOutputs, ...Array(targetLen - currentLen).fill('')] };
              }
              return row;
            }));
          }
          if (testData.tolerance) {
            setTolerance(testData.tolerance);
          }
          if (testData.toleranceOperator) {
            setToleranceOperator(testData.toleranceOperator);
          }
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load test data");
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [serviceId, initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        testConditions,
        measurementRows: processedRows.rows.map((r) => ({
          maApplied: r.maApplied,
          radiationOutputs: r.measuredOutputs,
          averageOutput: r.averageOutput,
          mGyPerMAs: r.mGyPerMAs,
        })),
        measHeaders,
        tolerance,
        toleranceOperator,
        xMax: processedRows.xMax,
        xMin: processedRows.xMin,
        coefficientOfLinearity: processedRows.coefficientOfLinearity,
        remarks: processedRows.remarks,
      };

      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getLinearityOfTimeByServiceIdForOBI(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        result = await updateLinearityOfTimeForOBI(currentTestId, payload);
        toast.success("Updated successfully");
      } else {
        result = await addLinearityOfTimeForOBI(serviceId, payload);
        const newId = result?.data?._id || result?.data?.data?._id || result?._id;
        if (newId) {
          setTestId(newId);
        }
        toast.success("Saved successfully");
      }

      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Calculate colspan for summary first cell
  // Layout: mA | Meas Columns... | Avg | X | Delete (only update mode)
  // Summary: Colspan (mA + Meas + Avg) | X Max | ...
  const summaryColSpan = 1 + measHeaders.length + 1;

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">Linearity of Time</h2>

      {/* Table 1: FDD, kV, Time (sec) */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">FFD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider border-r">kV</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Time (sec)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={testConditions.fdd}
                  onChange={e => setTestConditions(p => ({ ...p, fdd: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={testConditions.kv}
                  onChange={e => setTestConditions(p => ({ ...p, kv: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="60"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={testConditions.time}
                  onChange={e => setTestConditions(p => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                  placeholder="0.10"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: mA + Output (mGy) */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              {/* Header – make mA column wider */}
              <th
                rowSpan={2}
                className="px-6 py-3 w-28 text-left text-xs font-medium text-gray-700  tracking-wider border-r whitespace-nowrap"
              >
                mA Applied
              </th>
              <th
                colSpan={measHeaders.length}
                className="px-4 py-3 text-center text-xs font-medium text-gray-700  tracking-wider border-r"
              >
                <div className="flex items-center justify-between">
                  <span>Output (mGy)</span>
                  {!isViewMode && (
                    <button onClick={addMeasColumn} className="p-1 text-green-600 hover:bg-green-100 rounded">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Avg Output</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X (mGy/mAs)</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X MAX</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X MIN</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">CoL</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">Remarks</th>
              <th rowSpan={2} className="w-10" />
            </tr>
            <tr>
              {measHeaders.map((header, idx) => (
                <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={e => {
                        const val = e.target.value;
                        setMeasHeaders(prev => {
                          const newHeaders = [...prev];
                          newHeaders[idx] = val;
                          return newHeaders;
                        });
                      }}
                      disabled={isViewMode}
                      className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    />
                    {measHeaders.length > 1 && !isViewMode && (
                      <button onClick={() => removeMeasColumn(idx)} className="p-0.5 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedRows.rows.map((p, index) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.maApplied}
                    onChange={e => updateMeasurementRow(p.id, 'maApplied', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    placeholder="100"
                  />
                </td>

                {p.measuredOutputs.map((val, colIdx) => (
                  <td key={colIdx} className="px-2 py-2 border-r">
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={e => updateMeasurementRow(p.id, colIdx, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    />
                  </td>
                ))}

                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.averageOutput}</td>
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">{p.mGyPerMAs}</td>
                {index === 0 && (
                  <>
                    <td rowSpan={processedRows.rows.length} className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle">
                      {processedRows.xMax}
                    </td>
                    <td rowSpan={processedRows.rows.length} className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle">
                      {processedRows.xMin}
                    </td>
                    <td rowSpan={processedRows.rows.length} className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle">
                      {processedRows.coefficientOfLinearity}
                    </td>
                    <td rowSpan={processedRows.rows.length} className="px-4 py-2 text-center align-middle">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${processedRows.remarks === 'Pass'
                          ? 'bg-green-100 text-green-800'
                          : processedRows.remarks === 'Fail'
                            ? 'bg-red-100 text-red-800'
                            : 'text-gray-400'
                          }`}
                      >
                        {processedRows.remarks || '—'}
                      </span>
                    </td>
                  </>
                )}

                <td className="px-2 py-2 text-center">
                  {measurementRows.length > 1 && !isViewMode && (
                    <button
                      onClick={() => removeMeasurementRow(p.id)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
          {!isViewMode && (
            <button
              onClick={addMeasurementRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL)</span>
            <select
              value={toleranceOperator}
              onChange={e => setToleranceOperator(e.target.value)}
              disabled={isViewMode}
              className={`px-3 py-2 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            >
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
              <option value="<=">&lt;=</option>
              <option value=">=">&gt;=</option>
              <option value="=">=</option>
            </select>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end mt-6">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isViewMode) {
              toggleEdit();
            } else {
              handleSave();
            }
          }}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-4 h-4" />
              {buttonText} Linearity
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LinearityOfTime;



// interface Props {
//   serviceId: string;
//   testId?: string;
//   onRefresh?: () => void;
// }

// const LinearityOfTime: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
//   const [testId, setTestId] = useState<string | null>(propTestId || null);

//   // Test Conditions (Fixed)
//   const [testConditions, setTestConditions] = useState<TestConditions>({
//     fdd: '',
//     kv: '',
//     time: '',
//   });

//   // Measurement Rows (Dynamic)
//   const [measurementRows, setMeasurementRows] = useState<MeasurementRow[]>([
//     {
//       id: '1',
//       maApplied: '',
//       radiationOutput1: '',
//       radiationOutput2: '',
//       radiationOutput3: '',
//       averageOutput: '',
//       mGyPerMAs: '',
//     },
//   ]);

//   const [tolerance, setTolerance] = useState<string>('0.1');

//   const [isSaving, setIsSaving] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [hasSaved, setHasSaved] = useState(false);

//   // Row Handling
//   const addMeasurementRow = () => {
//     setMeasurementRows((prev) => [
//       ...prev,
//       {
//         id: Date.now().toString(),
//         maApplied: '',
//         radiationOutput1: '',
//         radiationOutput2: '',
//         radiationOutput3: '',
//         averageOutput: '',
//         mGyPerMAs: '',
//       },
//     ]);
//   };

//   const removeMeasurementRow = (id: string) => {
//     if (measurementRows.length <= 1) return;
//     setMeasurementRows((prev) => prev.filter((r) => r.id !== id));
//   };

//   const updateMeasurementRow = (
//     id: string,
//     field: 'maApplied' | 'radiationOutput1' | 'radiationOutput2' | 'radiationOutput3',
//     value: string
//   ) => {
//     setMeasurementRows((prev) =>
//       prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
//     );
//   };

//   // Auto-calculations
//   const processedRows = useMemo(() => {
//     const time = parseFloat(testConditions.time) || 0;
//     const tol = parseFloat(tolerance) || 0.1;
//     const mGyPerMAsValues: number[] = [];

//     const rowsWithCalculations = measurementRows.map((row) => {
//       // Calculate Average Output
//       const outputs = [
//         parseFloat(row.radiationOutput1),
//         parseFloat(row.radiationOutput2),
//         parseFloat(row.radiationOutput3),
//       ].filter((v) => !isNaN(v) && v > 0);

//       const averageOutput =
//         outputs.length > 0
//           ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(4)
//           : '';

//       // Calculate mGy / mAs (X)
//       const maApplied = parseFloat(row.maApplied);
//       const mGyPerMAs =
//         averageOutput && !isNaN(maApplied) && maApplied > 0 && time > 0
//           ? (parseFloat(averageOutput) / (maApplied * time)).toFixed(4)
//           : '';

//       if (mGyPerMAs) {
//         mGyPerMAsValues.push(parseFloat(mGyPerMAs));
//       }

//       return {
//         ...row,
//         averageOutput,
//         mGyPerMAs,
//       };
//     });

//     // Calculate X MAX, X MIN, CoL, and Remarks
//     const xMax = mGyPerMAsValues.length > 0 ? Math.max(...mGyPerMAsValues).toFixed(4) : '';
//     const xMin = mGyPerMAsValues.length > 0 ? Math.min(...mGyPerMAsValues).toFixed(4) : '';

//     const col =
//       xMax && xMin && (parseFloat(xMax) + parseFloat(xMin)) > 0
//         ? ((parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))).toFixed(4)
//         : '';

//     const remarks = col && parseFloat(col) < tol ? 'Pass' : col ? 'Fail' : '';

//     return {
//       rows: rowsWithCalculations,
//       xMax,
//       xMin,
//       coefficientOfLinearity: col,
//       remarks,
//     };
//   }, [measurementRows, testConditions.time, tolerance]);

//   // Load existing test data
//   useEffect(() => {
//     if (!serviceId) return;

//     const loadTest = async () => {
//       setIsLoading(true);
//       try {
//         const data = await getLinearityOfTimeByServiceIdForOBI(serviceId);
//         if (data?.data) {
//           const testData = data.data;
//           setTestId(testData._id);
//           if (testData.testConditions) {
//             setTestConditions({
//               fdd: testData.testConditions.fdd || '',
//               kv: testData.testConditions.kv || '',
//               time: testData.testConditions.time || '',
//             });
//           }
//           if (testData.measurementRows && testData.measurementRows.length > 0) {
//             setMeasurementRows(
//               testData.measurementRows.map((r: any) => ({
//                 id: r.id || Date.now().toString() + Math.random(),
//                 maApplied: r.maApplied || '',
//                 radiationOutput1: r.radiationOutput1 || '',
//                 radiationOutput2: r.radiationOutput2 || '',
//                 radiationOutput3: r.radiationOutput3 || '',
//                 averageOutput: r.averageOutput || '',
//                 mGyPerMAs: r.mGyPerMAs || '',
//               }))
//             );
//           }
//           if (testData.tolerance) {
//             setTolerance(testData.tolerance);
//           }
//           setHasSaved(true);
//         }
//       } catch (err: any) {
//         if (err.response?.status !== 404) {
//           toast.error("Failed to load test data");
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadTest();
//   }, [serviceId]);

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       const payload = {
//         testConditions,
//         measurementRows: processedRows.rows.map((r) => ({
//           maApplied: r.maApplied,
//           radiationOutput1: r.radiationOutput1,
//           radiationOutput2: r.radiationOutput2,
//           radiationOutput3: r.radiationOutput3,
//           averageOutput: r.averageOutput,
//           mGyPerMAs: r.mGyPerMAs,
//         })),
//         tolerance,
//         xMax: processedRows.xMax,
//         xMin: processedRows.xMin,
//         coefficientOfLinearity: processedRows.coefficientOfLinearity,
//         remarks: processedRows.remarks,
//       };

//       let result;
//       if (testId) {
//         result = await updateLinearityOfTimeForOBI(testId, payload);
//       } else {
//         result = await addLinearityOfTimeForOBI(serviceId, payload);
//         if (result?.data?._id) {
//           setTestId(result.data._id);
//         }
//       }

//       setHasSaved(true);
//       setIsEditing(false);
//       toast.success(testId ? "Updated successfully" : "Saved successfully");
//       onRefresh?.();
//     } catch (err: any) {
//       toast.error(err.response?.data?.message || "Save failed");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const toggleEdit = () => setIsEditing(true);
//   const isViewMode = hasSaved && !isEditing;
//   const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
//   const ButtonIcon = isViewMode ? Edit3 : Save;

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center p-10">
//         <Loader2 className="w-8 h-8 animate-spin" />
//         <span className="ml-2">Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-full overflow-x-auto">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold">Linearity of Time</h2>
//         <button
//           onClick={isViewMode ? toggleEdit : handleSave}
//           disabled={isSaving}
//           className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${isViewMode
//             ? 'bg-blue-600 text-white hover:bg-blue-700'
//             : 'bg-green-600 text-white hover:bg-green-700'
//             } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
//         >
//           {isSaving ? (
//             <Loader2 className="w-4 h-4 animate-spin" />
//           ) : (
//             <ButtonIcon className="w-4 h-4" />
//           )}
//           {isSaving ? 'Saving...' : buttonText}
//         </button>
//       </div>

//       {/* Test Conditions Table */}
//       <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
//         <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
//           Test Conditions
//         </h3>
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
//                 FDD (cm)
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
//                 kV
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                 Time (Sec)
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             <tr className="hover:bg-gray-50">
//               <td className="px-6 py-2 border-r">
//                 <input
//                   type="text"
//                   value={testConditions.fdd}
//                   onChange={(e) =>
//                     setTestConditions((p) => ({ ...p, fdd: e.target.value }))
//                   }
//                   disabled={isViewMode}
//                   className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                     ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                     : 'border-gray-300'
//                     }`}
//                   placeholder="100"
//                 />
//               </td>
//               <td className="px-6 py-2 border-r">
//                 <input
//                   type="text"
//                   value={testConditions.kv}
//                   onChange={(e) =>
//                     setTestConditions((p) => ({ ...p, kv: e.target.value }))
//                   }
//                   disabled={isViewMode}
//                   className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                     ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                     : 'border-gray-300'
//                     }`}
//                   placeholder="60"
//                 />
//               </td>
//               <td className="px-6 py-2">
//                 <input
//                   type="text"
//                   value={testConditions.time}
//                   onChange={(e) =>
//                     setTestConditions((p) => ({ ...p, time: e.target.value }))
//                   }
//                   disabled={isViewMode}
//                   className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                     ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                     : 'border-gray-300'
//                     }`}
//                   placeholder="0.10"
//                 />
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Main Measurement Table */}
//       <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
//         <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
//           Measurements
//         </h3>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th
//                   rowSpan={2}
//                   className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
//                 >
//                   mA Applied
//                 </th>
//                 <th
//                   colSpan={3}
//                   className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
//                 >
//                   Radiation Output (mGy)
//                 </th>
//                 <th
//                   rowSpan={2}
//                   className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
//                 >
//                   Average Output (mGy)
//                 </th>
//                 <th
//                   rowSpan={2}
//                   className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
//                 >
//                   mGy / mAs (X)
//                 </th>
//                 <th className="w-12" rowSpan={2} />
//               </tr>
//               <tr>
//                 <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
//                   1
//                 </th>
//                 <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
//                   2
//                 </th>
//                 <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
//                   3
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {processedRows.rows.map((row) => (
//                 <tr key={row.id} className="hover:bg-gray-50">
//                   <td className="px-4 py-2 border-r">
//                     <input
//                       type="text"
//                       value={row.maApplied}
//                       onChange={(e) =>
//                         updateMeasurementRow(row.id, 'maApplied', e.target.value)
//                       }
//                       disabled={isViewMode}
//                       className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                         ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                         : 'border-gray-300'
//                         }`}
//                       placeholder="50"
//                     />
//                   </td>
//                   <td className="px-4 py-2 border-r">
//                     <input
//                       type="text"
//                       value={row.radiationOutput1}
//                       onChange={(e) =>
//                         updateMeasurementRow(row.id, 'radiationOutput1', e.target.value)
//                       }
//                       disabled={isViewMode}
//                       className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                         ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                         : 'border-gray-300'
//                         }`}
//                     />
//                   </td>
//                   <td className="px-4 py-2 border-r">
//                     <input
//                       type="text"
//                       value={row.radiationOutput2}
//                       onChange={(e) =>
//                         updateMeasurementRow(row.id, 'radiationOutput2', e.target.value)
//                       }
//                       disabled={isViewMode}
//                       className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                         ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                         : 'border-gray-300'
//                         }`}
//                     />
//                   </td>
//                   <td className="px-4 py-2 border-r">
//                     <input
//                       type="text"
//                       value={row.radiationOutput3}
//                       onChange={(e) =>
//                         updateMeasurementRow(row.id, 'radiationOutput3', e.target.value)
//                       }
//                       disabled={isViewMode}
//                       className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                         ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                         : 'border-gray-300'
//                         }`}
//                     />
//                   </td>
//                   <td className="px-4 py-2 border-r font-medium bg-gray-50 text-center">
//                     {row.averageOutput || '—'}
//                   </td>
//                   <td className="px-4 py-2 font-medium bg-gray-50 text-center">
//                     {row.mGyPerMAs || '—'}
//                   </td>
//                   <td className="px-2 py-2 text-center">
//                     {measurementRows.length > 1 && !isViewMode && (
//                       <button
//                         onClick={() => removeMeasurementRow(row.id)}
//                         className="text-red-600 hover:bg-red-100 p-1 rounded"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//               {/* Summary Row */}
//               <tr className="bg-blue-50 font-semibold">
//                 <td colSpan={5} className="px-4 py-2 text-center border-r">
//                   Summary
//                 </td>
//                 <td className="px-4 py-2 text-center border-r">
//                   X MAX: {processedRows.xMax || '—'}
//                 </td>
//                 <td className="px-4 py-2 text-center">
//                   X MIN: {processedRows.xMin || '—'}
//                 </td>
//                 <td />
//               </tr>
//               <tr className="bg-blue-50 font-semibold">
//                 <td colSpan={6} className="px-4 py-2 text-center border-r">
//                   Coefficient of Linearity (CoL): {processedRows.coefficientOfLinearity || '—'}
//                 </td>
//                 <td className="px-4 py-2 text-center">
//                   <span
//                     className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${processedRows.remarks === 'Pass'
//                       ? 'bg-green-100 text-green-800'
//                       : processedRows.remarks === 'Fail'
//                         ? 'bg-red-100 text-red-800'
//                         : 'text-gray-400'
//                       }`}
//                   >
//                     {processedRows.remarks || '—'}
//                   </span>
//                 </td>
//                 <td />
//               </tr>
//             </tbody>
//           </table>
//         </div>
//         {!isViewMode && (
//           <div className="px-6 py-3 bg-gray-50 border-t">
//             <button
//               onClick={addMeasurementRow}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
//             >
//               <Plus className="w-4 h-4" /> Add Row
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Tolerance */}
//       <div className="bg-white p-6 shadow-md rounded-lg">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Tolerance Setting</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Tolerance (CoL &lt; value)
//             </label>
//             <input
//               type="text"
//               value={tolerance}
//               onChange={(e) => setTolerance(e.target.value)}
//               disabled={isViewMode}
//               className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
//                 ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
//                 : 'border-gray-300'
//                 }`}
//               placeholder="0.1"
//             />
//           </div>
//         </div>
//         <p className="mt-2 text-sm text-gray-600">
//           Tolerance: CoL &lt; {tolerance || '0.1'}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default LinearityOfTime;
