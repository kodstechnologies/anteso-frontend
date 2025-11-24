// components/TestTables/AccuracyOfOperatingPotential.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface RowData {
  id: string;
  appliedKvp: string;
  measuredValues: string[];
  averageKvp: string;
  remarks: "PASS" | "FAIL" | "-";
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const AccuracyOfOperatingPotential: React.FC<Props> = ({
  serviceId,
  testId: initialTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(initialTestId);
  const [isSaved, setIsSaved] = useState(!!initialTestId);
  const [isLoading, setIsLoading] = useState(!!initialTestId);
  const [isSaving, setIsSaving] = useState(false);

  const [mAStations, setMAStations] = useState<string[]>(["50 mA", "100 mA"]);
  const [rows, setRows] = useState<RowData[]>([
    { id: "1", appliedKvp: "60", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    { id: "2", appliedKvp: "80", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    { id: "3", appliedKvp: "100", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    { id: "4", appliedKvp: "120", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
  ]);

  const [toleranceSign, setToleranceSign] = useState<"+" | "-" | "±">("±");
  const [toleranceValue, setToleranceValue] = useState("5.0"); // Usually ±5% or ±5 kV

  // Load test data (mocked for now)
  useEffect(() => {
    if (initialTestId) {
      setIsLoading(false);
      setIsSaved(true);
    } else {
      setIsLoading(false);
    }
  }, [initialTestId]);

  // Save handler
  const saveTest = async () => {
    if (!serviceId) {
      toast.error("Service ID missing");
      return;
    }

    const payload = {
      mAStations,
      measurements: rows.map(r => ({
        appliedKvp: r.appliedKvp,
        measuredValues: r.measuredValues,
        averageKvp: r.averageKvp,
        remarks: r.remarks,
      })),
      tolerance: { sign: toleranceSign, value: toleranceValue },
    };

    setIsSaving(true);
    try {
      // Replace with real API
      // await saveAccuracyTest(testId || null, serviceId, payload);
      toast.success(testId ? "Updated successfully" : "Saved successfully");
      if (!testId) {
        const newId = Date.now().toString();
        setTestId(newId);
        onTestSaved?.(newId);
      }
      setIsSaved(true);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save on change
  useEffect(() => {
    if (isSaved && testId) {
      const timer = setTimeout(saveTest, 1000);
      return () => clearTimeout(timer);
    }
  }, [rows, mAStations, toleranceSign, toleranceValue]);

  // Column operations
  const addMAColumn = () => {
    setMAStations(prev => [...prev, "200 mA"]);
    setRows(prev => prev.map(row => ({ ...row, measuredValues: [...row.measuredValues, ""] })));
    setIsSaved(false);
  };

  const removeMAColumn = (index: number) => {
    if (mAStations.length <= 1) return;
    setMAStations(prev => prev.filter((_, i) => i !== index));
    setRows(prev => prev.map(row => ({
      ...row,
      measuredValues: row.measuredValues.filter((_, i) => i !== index),
    })));
    setIsSaved(false);
  };

  const updateMAHeader = (index: number, value: string) => {
    setMAStations(prev => prev.map((v, i) => i === index ? (value || `mA ${i + 1}`) : v));
    setIsSaved(false);
  };

  // Row operations
  const addRow = () => {
    const newRow: RowData = {
      id: Date.now().toString(),
      appliedKvp: "",
      measuredValues: Array(mAStations.length).fill(""),
      averageKvp: "",
      remarks: "-",
    };
    setRows(prev => [...prev, newRow]);
    setIsSaved(false);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
    setIsSaved(false);
  };

  // Cell update with auto-calculation
  const updateCell = (rowId: string, field: "appliedKvp" | number, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;

      let newRow = { ...row };

      if (field === "appliedKvp") {
        newRow.appliedKvp = value;
      } else {
        const newMeasured = [...row.measuredValues];
        newMeasured[field] = value;
        newRow.measuredValues = newMeasured;

        // Calculate average
        const nums = newMeasured.filter(v => v !== "" && !isNaN(Number(v))).map(Number);
        newRow.averageKvp = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "";
      }

      // Calculate remark
      const applied = parseFloat(newRow.appliedKvp || "0");
      const avg = parseFloat(newRow.averageKvp || "0");
      const tol = parseFloat(toleranceValue || "0");

      let remark: "PASS" | "FAIL" | "-" = "-";

      if (!isNaN(applied) && !isNaN(avg) && tol > 0) {
        const diff = Math.abs(avg - applied);
        const toleranceLimit = toleranceSign === "±" ? tol : toleranceSign === "+" ? applied + tol : applied - tol;

        if (toleranceSign === "+") {
          remark = avg <= toleranceLimit ? "PASS" : "FAIL";
        } else if (toleranceSign === "-") {
          remark = avg >= toleranceLimit ? "PASS" : "FAIL";
        } else {
          remark = diff <= tol ? "PASS" : "FAIL";
        }
      }

      newRow.remarks = remark;
      setIsSaved(false);
      return newRow;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-10">
      {/* Header + Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Accuracy of Operating Potential (kVp) at Different mA Stations
        </h2>

        <button
          onClick={saveTest}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition ${isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : isSaved
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <Edit3 className="w-5 h-5" />
              Edit
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Test
            </>
          )}
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-xl font-bold text-blue-900">
            kVp Accuracy Measurement
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r">
                  Applied kVp
                </th>
                <th colSpan={mAStations.length} className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                  <div className="flex items-center justify-between px-4">
                    <span>Measured kVp</span>
                    <button onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                  Average kVp
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                  Remarks
                </th>
                <th rowSpan={2} className="w-12"></th>
              </tr>
              <tr>
                {mAStations.map((station, idx) => (
                  <th key={idx} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={station}
                        onChange={(e) => updateMAHeader(idx, e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                      />
                      {mAStations.length > 1 && (
                        <button
                          onClick={() => removeMAColumn(idx)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-r">
                    <input
                      type="number"
                      value={row.appliedKvp}
                      onChange={(e) => updateCell(row.id, "appliedKvp", e.target.value)}
                      className="w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="80"
                    />
                  </td>
                  {row.measuredValues.map((val, idx) => (
                    <td key={idx} className="px-4 py-4 text-center border-r">
                      <input
                        type="number"
                        step="0.1"
                        value={val}
                        onChange={(e) => updateCell(row.id, idx, e.target.value)}
                        className="w-24 px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="0.0"
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold text-gray-800 border-r">
                    {row.averageKvp || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${row.remarks === "PASS" ? "bg-green-100 text-green-800" :
                        row.remarks === "FAIL" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-600"
                      }`}>
                      {row.remarks}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
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
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add kVp Row
          </button>
        </div>
      </div>

      {/* Tolerance Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-medium text-indigo-800">Acceptable Tolerance:</span>
          <select
            value={toleranceSign}
            onChange={(e) => { setToleranceSign(e.target.value as any); setIsSaved(false); }}
            className="px-5 py-2.5 border border-indigo-400 rounded-lg bg-white font-medium text-indigo-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="±">± (Plus or Minus)</option>
            <option value="+">+ (Positive only)</option>
            <option value="-">- (Negative only)</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => { setToleranceValue(e.target.value); setIsSaved(false); }}
            className="w-32 px-4 py-2.5 text-center border-2 border-indigo-400 rounded-lg font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
            placeholder="5.0"
          />
          <span className="font-medium text-indigo-800">kV</span>
        </div>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotential;