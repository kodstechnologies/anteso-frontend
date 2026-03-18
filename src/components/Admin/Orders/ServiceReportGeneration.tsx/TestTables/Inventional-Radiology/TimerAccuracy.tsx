import React, { useEffect, useMemo, useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { Edit3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addTimerAccuracyForInventionalRadiology,
  getTimerAccuracyByServiceIdForInventionalRadiology,
  getTimerAccuracyByTestIdForInventionalRadiology,
  updateTimerAccuracyForInventionalRadiology,
} from "../../../../../../api";

interface Table1Row {
  kvp: string;
  sliceThickness: string;
  ma: string;
}

interface Table2Row {
  id: string;
  setTime: string;
  observedTime: string;
  percentError: string;
  remarks: string;
}

interface Props {
  serviceId: string;
  tubeId?: "frontal" | "lateral" | null;
  testId?: string;
  onRefresh?: () => void;
  csvData?: any[];
}

const TimerAccuracy: React.FC<Props> = ({ serviceId, tubeId, testId: propTestId, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [table1Row, setTable1Row] = useState<Table1Row>({ kvp: "", sliceThickness: "", ma: "" });
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: "1", setTime: "", observedTime: "", percentError: "", remarks: "" },
  ]);
  const [tolerance, setTolerance] = useState<string>("5");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), setTime: "", observedTime: "", percentError: "", remarks: "" },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    if (window.confirm("Delete this row?")) {
      setTable2Rows((prev) => prev.filter((r) => r.id !== id));
      if (hasSaved) setTimeout(() => onRefresh?.(), 100);
    }
  };

  const updateTable2 = (id: string, field: "setTime" | "observedTime" | "remarks", value: string) => {
    setTable2Rows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0;
    return table2Rows.map((row) => {
      const set = parseFloat(row.setTime);
      const obs = parseFloat(row.observedTime);
      let percentError = "";
      let autoRemarks = "";
      if (!isNaN(set) && !isNaN(obs) && set > 0) {
        const error = ((Math.abs(set - obs) / set) * 100).toFixed(2);
        percentError = `${error}%`;
        autoRemarks = parseFloat(error) <= tol ? "Pass" : "Fail";
      }
      const finalRemarks = row.remarks.trim() === "" ? autoRemarks : row.remarks;
      return { ...row, percentError, remarks: finalRemarks };
    });
  }, [table2Rows, tolerance]);

  // CSV injection (CTScan-style fields)
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;

    const kvp = csvData.find((r) => r["Field Name"] === "Table1_kvp")?.["Value"];
    const slice = csvData.find((r) => r["Field Name"] === "Table1_SliceThickness")?.["Value"];
    const ma = csvData.find((r) => r["Field Name"] === "Table1_ma")?.["Value"];
    if (kvp || slice || ma) {
      setTable1Row((prev) => ({
        ...prev,
        kvp: kvp || prev.kvp,
        sliceThickness: slice || prev.sliceThickness,
        ma: ma || prev.ma,
      }));
    }

    const t2Indices = [
      ...new Set(
        csvData
          .filter((r) => String(r["Field Name"] || "").startsWith("Table2_"))
          .map((r) => parseInt(String(r["Row Index"] ?? ""), 10))
          .filter((i) => !isNaN(i) && i >= 0)
      ),
    ].sort((a, b) => a - b);

    if (t2Indices.length > 0) {
      const newRows = t2Indices.map((idx) => {
        const setTime =
          csvData.find((r) => r["Field Name"] === "Table2_SetTime" && parseInt(String(r["Row Index"]), 10) === idx)?.[
            "Value"
          ] || "";
        const observedTime =
          csvData.find((r) => r["Field Name"] === "Table2_Result" && parseInt(String(r["Row Index"]), 10) === idx)?.[
            "Value"
          ] || "";
        return { id: Date.now().toString() + Math.random(), setTime, observedTime, percentError: "", remarks: "" };
      });
      setTable2Rows(newRows);
    }

    const tol = csvData.find((r) => r["Field Name"] === "Tolerance")?.["Value"];
    if (tol) setTolerance(tol);

    if (!testId) setIsEditing(true);
  }, [csvData]);

  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.kvp.trim() &&
      table1Row.sliceThickness.trim() &&
      table1Row.ma.trim() &&
      table2Rows.every((r) => r.setTime.trim() && r.observedTime.trim())
    );
  }, [serviceId, table1Row, table2Rows]);

  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        let rec: any = null;
        if (propTestId) {
          rec = await getTimerAccuracyByTestIdForInventionalRadiology(propTestId);
        } else {
          rec = await getTimerAccuracyByServiceIdForInventionalRadiology(serviceId, tubeId || null);
        }

        if (rec) {
          setTestId(rec._id || propTestId);
          if (rec.table1?.[0]) setTable1Row(rec.table1[0]);
          if (Array.isArray(rec.table2) && rec.table2.length > 0) {
            setTable2Rows(
              rec.table2.map((r: any) => ({
                id: Date.now().toString() + Math.random(),
                setTime: String(r.setTime || ""),
                observedTime: String(r.observedTime || ""),
                percentError: "",
                remarks: String(r.remarks || ""),
              }))
            );
          }
          if (rec.tolerance != null) setTolerance(String(rec.tolerance));
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setHasSaved(false);
          setIsEditing(true);
        }
      } catch (e: any) {
        setHasSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, propTestId, tubeId]);

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      table1: [table1Row],
      table2: table2Rows.map((r) => ({
        setTime: parseFloat(r.setTime),
        observedTime: parseFloat(r.observedTime),
        remarks: r.remarks,
      })),
      tolerance,
      tubeId: tubeId || null,
    };

    try {
      if (testId) {
        await updateTimerAccuracyForInventionalRadiology(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res: any = await addTimerAccuracyForInventionalRadiology(serviceId, payload);
        const newId = res?.data?.testId || res?.data?.data?.testId || res?.data?._id || res?.testId || res?._id;
        if (newId) setTestId(newId);
        toast.success("Saved successfully!");
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (!hasSaved) return;
    setIsEditing(true);
  };

  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? "Edit" : testId ? "Update" : "Save";
  const ButtonIcon = isViewMode ? Edit3 : Save;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Timer Accuracy Test</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">Operating Parameters</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                  kVp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                  Slice Thickness (mm)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">mA</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={table1Row.kvp}
                    onChange={(e) => setTable1Row((p) => ({ ...p, kvp: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                    }`}
                    placeholder="80"
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={table1Row.sliceThickness}
                    onChange={(e) => setTable1Row((p) => ({ ...p, sliceThickness: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                    }`}
                    placeholder="5.0"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={table1Row.ma}
                    onChange={(e) => setTable1Row((p) => ({ ...p, ma: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                    }`}
                    placeholder="100"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">Timer Accuracy Measurement</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                  Set Time (ms)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                  Observed Time (ms)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                  % Error
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                  Remarks
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700  tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.setTime}
                      onChange={(e) => updateTable2(row.id, "setTime", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center ${
                        isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                      }`}
                      placeholder="100"
                    />
                  </td>
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.observedTime}
                      onChange={(e) => updateTable2(row.id, "observedTime", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center ${
                        isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                      }`}
                      placeholder="98.5"
                    />
                  </td>
                  <td className="px-4 py-2 border-r text-center text-sm text-gray-700">{row.percentError}</td>
                  <td className="px-4 py-2 border-r text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        row.remarks.toLowerCase() === "pass"
                          ? "bg-green-100 text-green-800"
                          : row.remarks.toLowerCase() === "fail"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {row.remarks}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {!isViewMode && (
                      <button
                        onClick={() => removeTable2Row(row.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete row"
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

        {!isViewMode && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <button
              onClick={addTable2Row}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Tolerance (%)</label>
                <input
                  type="text"
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                  disabled={isViewMode}
                  className={`w-20 px-2 py-1 border rounded text-sm text-center ${
                    isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        {isViewMode ? (
          <button
            onClick={toggleEdit}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Edit3 className="w-5 h-5" />
            Edit
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium ${
              !isFormValid || isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {isSaving ? <CloudArrowUpIcon className="w-5 h-5 animate-spin" /> : <ButtonIcon className="w-5 h-5" />}
            {isSaving ? "Saving..." : buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default TimerAccuracy;

