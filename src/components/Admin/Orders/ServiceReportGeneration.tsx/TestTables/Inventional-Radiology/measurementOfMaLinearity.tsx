import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addMeasurementOfMaLinearityForInventionalRadiology,
  getMeasurementOfMaLinearityByServiceIdForInventionalRadiology,
  getMeasurementOfMaLinearityByTestIdForInventionalRadiology,
  updateMeasurementOfMaLinearityForInventionalRadiology,
} from "../../../../../../api";

interface Table1Row {
  kvp: string;
  sliceThickness: string;
  time: string;
}

interface Table2Row {
  id: string;
  mAsApplied: string;
  measuredOutputs: string[];
  average: string;
  x: string;
  xMax: string;
  xMin: string;
  col: string;
  remarks: string;
  failedCells?: boolean[];
}

interface Props {
  serviceId: string;
  tubeId?: "frontal" | "lateral" | null;
  testId?: string;
  onRefresh?: () => void;
  csvData?: any[];
}

const MeasurementOfMaLinearity: React.FC<Props> = ({ serviceId, tubeId, testId: propTestId, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  const [table1Row, setTable1Row] = useState<Table1Row>({ kvp: "", sliceThickness: "", time: "" });
  const [measHeaders, setMeasHeaders] = useState<string[]>(["Meas 1", "Meas 2", "Meas 3"]);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: "1", mAsApplied: "10", measuredOutputs: ["", "", ""], average: "", x: "", xMax: "", xMin: "", col: "", remarks: "", failedCells: [] },
    { id: "2", mAsApplied: "20", measuredOutputs: ["", "", ""], average: "", x: "", xMax: "", xMin: "", col: "", remarks: "", failedCells: [] },
    { id: "3", mAsApplied: "50", measuredOutputs: ["", "", ""], average: "", x: "", xMax: "", xMin: "", col: "", remarks: "", failedCells: [] },
  ]);

  const [tolerance, setTolerance] = useState<string>("0.1");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const addMeasColumn = () => {
    const newHeader = `Meas ${measHeaders.length + 1}`;
    setMeasHeaders((prev) => [...prev, newHeader]);
    setTable2Rows((prev) => prev.map((row) => ({ ...row, measuredOutputs: [...row.measuredOutputs, ""] })));
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders((prev) => prev.filter((_, i) => i !== idx));
    setTable2Rows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredOutputs: row.measuredOutputs.filter((_, i) => i !== idx),
      })),
    );
  };

  const updateMeasHeader = (idx: number, value: string) => {
    setMeasHeaders((prev) => {
      const copy = [...prev];
      copy[idx] = value || `Meas ${idx + 1}`;
      return copy;
    });
  };

  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        mAsApplied: "",
        measuredOutputs: Array(measHeaders.length).fill(""),
        average: "",
        x: "",
        xMax: "",
        xMin: "",
        col: "",
        remarks: "",
        failedCells: Array(measHeaders.length).fill(false),
      },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTable2Cell = (rowId: string, field: "mAsApplied" | number, value: string) => {
    setTable2Rows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === "mAsApplied") return { ...row, mAsApplied: value };
        if (typeof field === "number") {
          const newOutputs = [...row.measuredOutputs];
          newOutputs[field] = value;
          return { ...row, measuredOutputs: newOutputs };
        }
        return row;
      }),
    );
  };

  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];
    const individualTolerance = 0.1; // 10% deviation allowed from average

    const rowsWithX = table2Rows.map((row) => {
      const outputs = row.measuredOutputs.map((v) => parseFloat(v)).filter((v) => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? outputs.reduce((a, b) => a + b, 0) / outputs.length : 0;
      const avgStr = avg > 0 ? avg.toFixed(3) : "—";

      const failedCells: boolean[] = row.measuredOutputs.map((val) => {
        const numVal = parseFloat(val);
        if (isNaN(numVal) || numVal <= 0 || avg <= 0) return false;
        const allowedDeviation = avg * individualTolerance;
        return Math.abs(numVal - avg) > allowedDeviation;
      });

      const mA = parseFloat(row.mAsApplied);
      const time = parseFloat(table1Row.time);
      const x = avgStr !== "—" && mA > 0 && time > 0 ? (avg / (mA * time)).toFixed(4) : "—";
      if (x !== "—") xValues.push(parseFloat(x));

      return { ...row, average: avgStr, x, failedCells };
    });

    const xMax = xValues.length > 0 ? Math.max(...xValues).toFixed(4) : "—";
    const xMin = xValues.length > 0 ? Math.min(...xValues).toFixed(4) : "—";
    const colVal =
      xMax !== "—" && xMin !== "—" && parseFloat(xMax) + parseFloat(xMin) > 0
        ? ((parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))).toFixed(3)
        : "—";
    const pass = colVal !== "—" && parseFloat(colVal) <= tol;

    return rowsWithX.map((row) => {
      const hasFailedCells = row.failedCells?.some(Boolean) || false;
      const overallPass = pass && !hasFailedCells;
      return {
        ...row,
        xMax,
        xMin,
        col: colVal,
        remarks: overallPass ? "Pass" : colVal === "—" ? "" : "Fail",
      };
    });
  }, [table2Rows, tolerance, table1Row.time]);

  // CSV injection (CTScan-style fields)
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;

    const kvp = csvData.find((r) => r["Field Name"] === "Table1_kvp")?.["Value"];
    const slice = csvData.find((r) => r["Field Name"] === "Table1_SliceThickness")?.["Value"];
    const time = csvData.find((r) => r["Field Name"] === "Table1_Time")?.["Value"];
    if (kvp || slice || time) {
      setTable1Row((prev) => ({ ...prev, kvp: kvp || prev.kvp, sliceThickness: slice || prev.sliceThickness, time: time || prev.time }));
    }

    const rowIndices = [
      ...new Set(
        csvData
          .filter((r) => String(r["Field Name"] || "").startsWith("Table2_"))
          .map((r) => parseInt(String(r["Row Index"] ?? ""), 10))
          .filter((i) => !isNaN(i) && i >= 0),
      ),
    ].sort((a, b) => a - b);

    if (rowIndices.length > 0) {
      const resultFields = csvData.filter((r) => String(r["Field Name"] || "").startsWith("Table2_Result_"));
      const maxResultIdx = resultFields.reduce((max: number, r: any) => {
        const idx = parseInt(String(r["Field Name"]).replace("Table2_Result_", ""), 10);
        return isNaN(idx) ? max : Math.max(max, idx);
      }, 0);
      const numMeas = Math.max(3, maxResultIdx + 1);
      const newHeaders = Array.from({ length: numMeas }, (_, i) => `Meas ${i + 1}`);
      setMeasHeaders(newHeaders);

      const newRows = rowIndices.map((idx) => {
        const rowData = csvData.filter((r) => parseInt(String(r["Row Index"]), 10) === idx);
        const mAsApplied = rowData.find((r) => r["Field Name"] === "Table2_mAsApplied")?.["Value"] || "";
        const outputs = Array(numMeas).fill("");
        newHeaders.forEach((_, hIdx) => {
          const val = rowData.find((r) => r["Field Name"] === `Table2_Result_${hIdx}`)?.["Value"];
          if (val) outputs[hIdx] = val;
        });
        return {
          id: Date.now().toString() + Math.random(),
          mAsApplied,
          measuredOutputs: outputs,
          average: "",
          x: "",
          xMax: "",
          xMin: "",
          col: "",
          remarks: "",
          failedCells: Array(numMeas).fill(false),
        };
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
      table1Row.time.trim() &&
      table2Rows.every((r) => r.mAsApplied.trim() && r.measuredOutputs.some((v) => v.trim()))
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
        if (propTestId) rec = await getMeasurementOfMaLinearityByTestIdForInventionalRadiology(propTestId);
        else rec = await getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, tubeId || null);

        if (rec) {
          setTestId(rec._id || propTestId);
          if (rec.table1?.[0]) setTable1Row(rec.table1[0]);
          if (Array.isArray(rec.table2) && rec.table2.length > 0) {
            const headers =
              rec.table2[0].measuredOutputs?.length > 0
                ? Array.from({ length: rec.table2[0].measuredOutputs.length }, (_, i) => `Meas ${i + 1}`)
                : measHeaders;
            setMeasHeaders(headers);
            setTable2Rows(
              rec.table2.map((r: any) => ({
                id: Date.now().toString() + Math.random(),
                mAsApplied: String(r.mAsApplied || ""),
                measuredOutputs: (r.measuredOutputs || []).map(String),
                average: "",
                x: "",
                xMax: "",
                xMin: "",
                col: "",
                remarks: "",
                failedCells: Array((r.measuredOutputs || []).length).fill(false),
              })),
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
      table2: processedTable2.map((row) => ({
        mAsApplied: parseFloat(row.mAsApplied) || 0,
        measuredOutputs: row.measuredOutputs.map((v) => (v.trim() === "" ? null : parseFloat(v))),
        avgOutput: row.average !== "—" ? parseFloat(row.average) : null,
        x: row.x !== "—" ? parseFloat(row.x) : null,
        xMax: row.xMax !== "—" ? parseFloat(row.xMax) : null,
        xMin: row.xMin !== "—" ? parseFloat(row.xMin) : null,
        col: row.col !== "—" ? parseFloat(row.col) : null,
        remarks: row.remarks || "",
      })),
      tolerance,
      tubeId: tubeId || null,
    };

    try {
      if (testId) {
        await updateMeasurementOfMaLinearityForInventionalRadiology(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res: any = await addMeasurementOfMaLinearityForInventionalRadiology(serviceId, payload);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Measurement of mA Linearity</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">Test Conditions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">kVp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Slice Thickness (mm)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">Time (ms)</th>
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
                    className={`w-full px-2 py-1 border rounded text-sm text-center ${
                      isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={table1Row.sliceThickness}
                    onChange={(e) => setTable1Row((p) => ({ ...p, sliceThickness: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center ${
                      isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={table1Row.time}
                    onChange={(e) => setTable1Row((p) => ({ ...p, time: e.target.value }))}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center ${
                      isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                    }`}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Measurements</h3>
          {!isViewMode && (
            <button onClick={addMeasColumn} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm">
              <Plus className="w-4 h-4" />
              Add Measurement Column
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">mA Applied</th>
                {measHeaders.map((h, idx) => (
                  <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                    <div className="flex items-center gap-2">
                      <input
                        value={h}
                        disabled={isViewMode}
                        onChange={(e) => updateMeasHeader(idx, e.target.value)}
                        className={`w-24 px-2 py-1 border rounded text-xs text-center ${
                          isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                        }`}
                      />
                      {!isViewMode && measHeaders.length > 1 && (
                        <button onClick={() => removeMeasColumn(idx)} className="text-red-600 hover:text-red-800" title="Remove column">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Avg</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">X</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Xmax</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Xmin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">CoL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">Remarks</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700  tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTable2.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.mAsApplied}
                      onChange={(e) => updateTable2Cell(row.id, "mAsApplied", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center ${
                        isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                      }`}
                    />
                  </td>
                  {row.measuredOutputs.map((val, idx) => (
                    <td key={idx} className="px-4 py-2 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateTable2Cell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border rounded text-sm text-center ${
                          isViewMode
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                            : row.failedCells?.[idx]
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                        }`}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 border-r text-center text-sm">{row.average}</td>
                  <td className="px-4 py-2 border-r text-center text-sm">{row.x}</td>
                  <td className="px-4 py-2 border-r text-center text-sm">{row.xMax}</td>
                  <td className="px-4 py-2 border-r text-center text-sm">{row.xMin}</td>
                  <td className="px-4 py-2 border-r text-center text-sm">{row.col}</td>
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
                      <button onClick={() => removeTable2Row(row.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete row">
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
            <button onClick={addTable2Row} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tolerance (CoL)</label>
              <input
                type="text"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                disabled={isViewMode}
                className={`w-24 px-2 py-1 border rounded text-sm text-center ${
                  isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300" : "border-gray-300"
                }`}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        {isViewMode ? (
          <button onClick={toggleEdit} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
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
            <Save className="w-5 h-5" />
            {isSaving ? "Saving..." : testId ? "Update" : "Save"}
          </button>
        )}
      </div>
    </div>
  );
};

export default MeasurementOfMaLinearity;

