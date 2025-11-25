// src/components/TestTables/AccuracyOfOperatingPotential.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  addAccuracyOfOperatingPotentialForMammography,
  getAccuracyOfOperatingPotentialByServiceIdForMammography,
  updateAccuracyOfOperatingPotentialForMammography,
} from "../../../../../../api";

interface RowData {
  id: string;
  appliedKvp: string;
  measuredValues: string[];
  averageKvp: string;
  remarks: "PASS" | "FAIL" | "-";
}

interface Props {
  serviceId: string;
}

const AccuracyOfOperatingPotential: React.FC<Props> = ({ serviceId }) => {
  const [testId, setTestId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);        // This was the bug
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [mAStations, setMAStations] = useState<string[]>(["28 kV", "30 kV"]);
  const [rows, setRows] = useState<RowData[]>([
    { id: "1", appliedKvp: "25", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    { id: "2", appliedKvp: "28", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    { id: "3", appliedKvp: "30", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    { id: "4", appliedKvp: "35", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
  ]);

  const [toleranceSign, setToleranceSign] = useState<"+" | "-" | "±">("±");
  const [toleranceValue, setToleranceValue] = useState("1.5");

  // LOAD DATA FROM SERVER
  useEffect(() => {
    if (!serviceId) return;

    const loadTest = async () => {
      try {
        setIsLoading(true);
        const res = await getAccuracyOfOperatingPotentialByServiceIdForMammography(serviceId);

        // SUCCESS: Data exists in DB
        if (res?.data?.data) {
          const data = res.data.data;

          setTestId(data._id);
          setMAStations(data.mAStations || ["28 kV", "30 kV"]);

          setRows(
            data.measurements?.map((m: any, i: number) => ({
              id: Date.now().toString() + i,
              appliedKvp: String(m.appliedKvp || ""),
              measuredValues: m.measuredValues || Array(data.mAStations?.length || 2).fill(""),
              averageKvp: String(m.averageKvp || ""),
              remarks: (m.remarks as "PASS" | "FAIL" | "-") || "-",
            })) || rows
          );

          setToleranceSign(data.tolerance?.sign || "±");
          setToleranceValue(data.tolerance?.value || "1.5");

          // THIS LINE WAS MISSING → THIS IS THE MAIN FIX
          // setIsSaved(true);
          setIsSaved(true);
          setIsEditing(false);
        }
        // No data yet → first time user
        else {
          setIsSaved(false);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load saved data");
        }
        // 404 = no saved data → normal for first time
        setIsSaved(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [serviceId]);

  // SAVE / UPDATE
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
      let result;
      if (testId) {
        result = await updateAccuracyOfOperatingPotentialForMammography(testId, payload);
        toast.success("Updated successfully");
      } else {
        result = await addAccuracyOfOperatingPotentialForMammography(serviceId, payload);
        if (result?.data?.data?._id) {
          setTestId(result.data.data._id);
        }
        toast.success("Saved successfully");
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save
  useEffect(() => {
    if (isEditing && testId) {
      const timer = setTimeout(saveTest, 1500);
      return () => clearTimeout(timer);
    }
  }, [rows, mAStations, toleranceSign, toleranceValue, isEditing, testId]);

  const isEditable = isEditing || !isSaved;

  // Handlers
  const addMAColumn = () => {
    setMAStations(prev => [...prev, "35 kV"]);
    setRows(prev => prev.map(r => ({ ...r, measuredValues: [...r.measuredValues, ""] })));
    setIsEditing(true);
  };

  const removeMAColumn = (index: number) => {
    if (mAStations.length <= 1) return;
    setMAStations(prev => prev.filter((_, i) => i !== index));
    setRows(prev => prev.map(r => ({
      ...r,
      measuredValues: r.measuredValues.filter((_, i) => i !== index),
    })));
    setIsEditing(true);
  };

  const updateMAHeader = (index: number, value: string) => {
    setMAStations(prev => prev.map((v, i) => (i === index ? value : v)));
    setIsEditing(true);
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now().toString(),
      appliedKvp: "",
      measuredValues: Array(mAStations.length).fill(""),
      averageKvp: "",
      remarks: "-",
    }]);
    setIsEditing(true);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
    setIsEditing(true);
  };

  const updateCell = (rowId: string, field: "appliedKvp" | number, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;

      const newRow = { ...row };

      if (field === "appliedKvp") {
        newRow.appliedKvp = value;
      } else {
        newRow.measuredValues = [...row.measuredValues];
        newRow.measuredValues[field] = value;

        const nums = newRow.measuredValues
          .filter(v => v !== "" && !isNaN(Number(v)))
          .map(v => Number(v));

        newRow.averageKvp = nums.length > 0
          ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
          : "";
      }

      // Recalculate remarks
      const applied = parseFloat(newRow.appliedKvp || "0");
      const avg = parseFloat(newRow.averageKvp || "0");
      const tol = parseFloat(toleranceValue || "0");

      if (!isNaN(applied) && !isNaN(avg) && tol > 0) {
        const diff = Math.abs(avg - applied);
        newRow.remarks = toleranceSign === "±"
          ? (diff <= tol ? "PASS" : "FAIL")
          : toleranceSign === "+"
            ? (avg <= applied + tol ? "PASS" : "FAIL")
            : (avg >= applied - tol ? "PASS" : "FAIL");
      } else {
        newRow.remarks = "-";
      }

      return newRow;
    }));
    setIsEditing(true);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Accuracy of Operating Potential (kVp) – Mammography
        </h2>

        <button
          onClick={() => (isSaved && !isEditing ? setIsEditing(true) : saveTest())}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition shadow-md ${isSaving
            ? "bg-gray-500 cursor-not-allowed"
            : isSaved && !isEditing
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-teal-600 hover:bg-teal-700"
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : isSaved && !isEditing ? (
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

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-xl font-bold text-blue-900">kVp Accuracy Measurement</h3>
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
                    {isEditable && (
                      <button onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
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
                        disabled={!isEditable}
                        className="w-28 px-2 py-1 text-xs border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                      {mAStations.length > 1 && isEditable && (
                        <button onClick={() => removeMAColumn(idx)} className="text-red-600 hover:bg-red-100 p-1 rounded">
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="28"
                    />
                  </td>
                  {row.measuredValues.map((val, idx) => (
                    <td key={idx} className="px-4 py-4 text-center border-r">
                      <input
                        type="number"
                        step="0.1"
                        value={val}
                        onChange={(e) => updateCell(row.id, idx, e.target.value)}
                        disabled={!isEditable}
                        className="w-24 px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="0.0"
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold text-gray-800 border-r">
                    {row.averageKvp || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${row.remarks === "PASS"
                        ? "bg-green-100 text-green-800"
                        : row.remarks === "FAIL"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {row.remarks}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {rows.length > 1 && isEditable && (
                      <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
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
            disabled={!isEditable}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add kVp Row
          </button>
        </div>
      </div>

      {/* Tolerance */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-medium text-indigo-800">Acceptable Tolerance:</span>
          <select
            value={toleranceSign}
            onChange={(e) => { setToleranceSign(e.target.value as any); setIsEditing(true); }}
            disabled={!isEditable}
            className="px-5 py-2.5 border border-indigo-400 rounded-lg bg-white font-medium text-indigo-900 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
          >
            <option value="±">± (Plus or Minus)</option>
            <option value="+">+ (Positive only)</option>
            <option value="-">- (Negative only)</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => { setToleranceValue(e.target.value); setIsEditing(true); }}
            disabled={!isEditable}
            className="w-32 px-4 py-2.5 text-center border-2 border-indigo-400 rounded-lg font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
            placeholder="1.5"
          />
          <span className="font-medium text-indigo-800">kV</span>
        </div>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotential;