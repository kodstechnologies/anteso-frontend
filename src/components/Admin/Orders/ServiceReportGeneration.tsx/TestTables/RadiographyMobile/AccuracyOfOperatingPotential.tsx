// Accuracy of Operating Potential – same layout as Radiography Fixed (TotalFilteration)
// Diagram: Accuracy of kVp at Different mA Stations, Tolerance for kVp Accuracy, Total Filtration, Tolerance for Total Filtration
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addAccuracyOfOperatingPotentialForRadiographyMobile,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile,
  updateAccuracyOfOperatingPotentialForRadiographyMobile,
} from "../../../../../../api";

interface RowData {
  id: string;
  appliedKvp: string;
  measuredValues: string[];
  measuredValuesStatus: boolean[];
  averageKvp: string;
  averageKvpStatus?: boolean;
  remarks: "PASS" | "FAIL" | "-";
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onRefresh?: () => void;
  refreshKey?: number;
  initialData?: any;
  csvDataVersion?: number;
}

// Same formula as Radiography Fixed (TotalFilteration): absolute kV tolerance; ± / + / −
const checkTolerance = (
  measured: number,
  applied: number,
  tolerance: number,
  sign: "+" | "-" | "±"
): boolean => {
  if (isNaN(measured) || isNaN(applied) || isNaN(tolerance) || tolerance <= 0 || applied === 0) return true;
  const diff = Math.abs(measured - applied);
  if (sign === "+") return measured <= applied + tolerance;
  if (sign === "-") return measured >= applied - tolerance;
  return diff <= tolerance;
};

const AccuracyOfOperatingPotential: React.FC<Props> = ({
  serviceId,
  testId: initialTestId = null,
  onRefresh,
  refreshKey,
  initialData,
  csvDataVersion,
}) => {
  const [testId, setTestId] = useState<string | null>(initialTestId);
  const [isSaved, setIsSaved] = useState(!!initialTestId);
  const [isEditing, setIsEditing] = useState(!initialTestId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isViewMode = isSaved && !isEditing;

  const [mAStations, setMAStations] = useState<string[]>(["50 mA", "100 mA"]);
  const [rows, setRows] = useState<RowData[]>([
    { id: "1", appliedKvp: "60", measuredValues: ["", ""], measuredValuesStatus: [], averageKvp: "", remarks: "-" },
    { id: "2", appliedKvp: "80", measuredValues: ["", ""], measuredValuesStatus: [], averageKvp: "", remarks: "-" },
    { id: "3", appliedKvp: "100", measuredValues: ["", ""], measuredValuesStatus: [], averageKvp: "", remarks: "-" },
    { id: "4", appliedKvp: "120", measuredValues: ["", ""], measuredValuesStatus: [], averageKvp: "", remarks: "-" },
  ]);

  const [toleranceSign, setToleranceSign] = useState<"+" | "-" | "±">("±");
  const [toleranceValue, setToleranceValue] = useState("2.0");
  const [totalFiltration, setTotalFiltration] = useState({ measured: "", required: "", atKvp: "" });

  // Apply CSV/Excel initial data
  useEffect(() => {
    if (!initialData) return;
    if (initialData.mAStations?.length > 0) setMAStations(initialData.mAStations.map(String));
    if (initialData.table2?.length > 0) {
      const stationCount = initialData.mAStations?.length ?? mAStations.length;
      setRows(
        initialData.table2.map((r: any, i: number) => {
          const vals = Array.isArray(r.measuredValues)
            ? r.measuredValues.map((v: any) => String(v ?? ""))
            : [String(r.ma10 ?? ""), String(r.ma100 ?? ""), String(r.ma200 ?? "")];
          while (vals.length < stationCount) vals.push("");
          return {
            id: String(i + 1),
            appliedKvp: String(r.setKV ?? r.appliedKvp ?? ""),
            measuredValues: vals,
            measuredValuesStatus: [] as boolean[],
            averageKvp: String(r.avgKvp ?? ""),
            remarks: (r.remarks === "PASS" || r.remarks === "FAIL" ? r.remarks : "-") as "PASS" | "FAIL" | "-",
          };
        })
      );
    }
    if (initialData.measurements?.length > 0) {
      const stationCount = initialData.mAStations?.length ?? 2;
      setRows(
        initialData.measurements.map((m: any, i: number) => {
          const vals = (m.measuredValues ?? []).map(String);
          while (vals.length < stationCount) vals.push("");
          return {
            id: String(i + 1),
            appliedKvp: String(m.appliedKvp ?? ""),
            measuredValues: vals,
            measuredValuesStatus: [] as boolean[],
            averageKvp: "",
            remarks: "-" as const,
          };
        })
      );
    }
    if (initialData.tolerance) {
      if (initialData.tolerance.sign) setToleranceSign(initialData.tolerance.sign as "+" | "-" | "±");
      if (initialData.tolerance.value) setToleranceValue(String(initialData.tolerance.value));
    }
    if (initialData.totalFiltration) {
      setTotalFiltration((prev) => ({
        ...prev,
        measured: String(initialData.totalFiltration.measured ?? prev.measured),
        required: String(initialData.totalFiltration.required ?? prev.required),
        atKvp: String(initialData.totalFiltration.atKvp ?? prev.atKvp),
      }));
    }
  }, [csvDataVersion, initialData]);

  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }
    if (initialData && csvDataVersion === 0) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile(serviceId);
        if (!res?.data) {
          setIsLoading(false);
          return;
        }
        const rec = res.data;
        if (rec._id) {
          setTestId(rec._id);
          setIsSaved(true);
          setIsEditing(false);
        }
        const stations = rec.mAStations?.length ? rec.mAStations.map(String) : ["50 mA", "100 mA"];
        setMAStations(stations);
        if (rec.tolerance) {
          setToleranceSign((rec.tolerance.sign as "+" | "-" | "±") || "±");
          setToleranceValue(String(rec.tolerance.value ?? "2.0"));
        }
        if (rec.totalFiltration) {
          setTotalFiltration((prev) => ({
            measured: String(rec.totalFiltration.measured ?? prev.measured),
            required: String(rec.totalFiltration.required ?? prev.required),
            atKvp: String(rec.totalFiltration.atKvp ?? prev.atKvp),
          }));
        }
        if (Array.isArray(rec.table2) && rec.table2.length > 0) {
          const tolSign = (rec.tolerance?.sign as "+" | "-" | "±") || "±";
          const tolVal = parseFloat(String(rec.tolerance?.value ?? "2.0")) || 0;
          setRows(
            rec.table2.map((r: any) => {
              const measuredValues = Array.isArray(r.measuredValues)
                ? r.measuredValues.map(String)
                : [String(r.ma10 ?? ""), String(r.ma100 ?? ""), String(r.ma200 ?? "")];
              while (measuredValues.length < stations.length) measuredValues.push("");
              const applied = parseFloat(r.setKV || r.appliedKvp || "0");
              const statuses = measuredValues.map((v: string) =>
                checkTolerance(parseFloat(v || "0"), applied, tolVal, tolSign)
              );
              const nums = measuredValues.filter((v: string) => v !== "" && !isNaN(parseFloat(v))).map(Number);
              const avg = nums.length > 0 ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : "";
              const avgStatus = checkTolerance(parseFloat(avg || "0"), applied, tolVal, tolSign);
              const hasFail = statuses.some((s: boolean) => !s) || !avgStatus;
              const hasData = !isNaN(applied) && applied > 0 && (nums.length > 0 || (avg && !isNaN(parseFloat(avg))));
              let remark: "PASS" | "FAIL" | "-" = "-";
              if (hasData) remark = hasFail ? "FAIL" : "PASS";
              return {
                id: Date.now().toString() + Math.random(),
                appliedKvp: String(r.setKV ?? r.appliedKvp ?? ""),
                measuredValues,
                measuredValuesStatus: statuses,
                averageKvp: String(r.avgKvp ?? avg),
                averageKvpStatus: avgStatus,
                remarks: remark,
              };
            })
          );
        }
      } catch (e: any) {
        if (e?.response?.status !== 404) toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, refreshKey]);

  const getFiltrationRemark = (): "PASS" | "FAIL" | "-" => {
    const kvp = parseFloat(totalFiltration.atKvp);
    const measured = parseFloat(totalFiltration.required);
    if (isNaN(kvp) || isNaN(measured)) return "-";
    const threshold1 = 70;
    const threshold2 = 100;
    let required: number;
    if (kvp < threshold1) required = 1.5;
    else if (kvp >= threshold1 && kvp <= threshold2) required = 2.0;
    else required = 2.5;
    return measured >= required ? "PASS" : "FAIL";
  };

  const saveTest = async () => {
    setIsSaving(true);
    const payload: any = {
      table1: [],
      mAStations,
      table2: rows.map((r) => ({
        setKV: parseFloat(r.appliedKvp) || null,
        appliedKvp: r.appliedKvp,
        measuredValues: r.measuredValues.map((v) => (v.trim() ? parseFloat(v) : null)),
        ma10: r.measuredValues[0] ? parseFloat(r.measuredValues[0]) || null : null,
        ma100: r.measuredValues[1] ? parseFloat(r.measuredValues[1]) || null : null,
        ma200: r.measuredValues[2] ? parseFloat(r.measuredValues[2]) || null : null,
        avgKvp: r.averageKvp ? parseFloat(r.averageKvp) : null,
        remarks: r.remarks,
      })),
      tolerance: { sign: toleranceSign, value: toleranceValue },
      totalFiltration,
    };
    try {
      if (testId) {
        await updateAccuracyOfOperatingPotentialForRadiographyMobile(testId, payload);
        toast.success("Updated successfully");
      } else {
        const result = await addAccuracyOfOperatingPotentialForRadiographyMobile(serviceId, payload);
        const newId = result?.data?._id ?? result?.data?.data?._id ?? result?._id;
        if (newId) setTestId(newId);
        toast.success("Saved successfully");
      }
      setIsSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const addMAColumn = () => {
    setMAStations((prev) => [...prev, "200 mA"]);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredValues: [...row.measuredValues, ""],
        measuredValuesStatus: [...(row.measuredValuesStatus || []), true],
      }))
    );
    setIsSaved(false);
  };

  const removeMAColumn = (index: number) => {
    if (mAStations.length <= 1) return;
    setMAStations((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredValues: row.measuredValues.filter((_, i) => i !== index),
        measuredValuesStatus: (row.measuredValuesStatus || []).filter((_, i) => i !== index),
      }))
    );
    setIsSaved(false);
  };

  const updateMAHeader = (index: number, value: string) => {
    setMAStations((prev) => {
      const updated = [...prev];
      updated[index] = value || `mA ${index + 1}`;
      return updated;
    });
    setIsSaved(false);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        appliedKvp: "",
        measuredValues: Array(mAStations.length).fill(""),
        measuredValuesStatus: Array(mAStations.length).fill(true),
        averageKvp: "",
        remarks: "-",
      },
    ]);
    setIsSaved(false);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    setIsSaved(false);
  };

  const updateCell = (rowId: string, field: "appliedKvp" | number, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === "appliedKvp") {
          const applied = parseFloat(value || "0");
          const tol = parseFloat(toleranceValue || "0");
          const newMeasuredStatus = row.measuredValues.map((val) =>
            checkTolerance(parseFloat(val || "0"), applied, tol, toleranceSign)
          );
          const nums = row.measuredValues.filter((v) => v !== "" && !isNaN(Number(v))).map(Number);
          const avg = nums.length > 0 ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : "";
          const avgStatus = checkTolerance(parseFloat(avg || "0"), applied, tol, toleranceSign);
          const hasAnyFailure = newMeasuredStatus.some((s) => !s) || !avgStatus;
          const hasValidData =
            !isNaN(applied) &&
            applied > 0 &&
            !isNaN(tol) &&
            tol > 0 &&
            (row.measuredValues.some((v) => v !== "" && !isNaN(parseFloat(v))) || (avg && !isNaN(parseFloat(avg))));
          let remark: "PASS" | "FAIL" | "-" = "-";
          if (hasValidData) remark = hasAnyFailure ? "FAIL" : "PASS";
          return {
            ...row,
            appliedKvp: value,
            measuredValuesStatus: newMeasuredStatus,
            averageKvpStatus: avgStatus,
            remarks: remark,
          };
        }
        const newMeasured = [...row.measuredValues];
        newMeasured[field as number] = value;
        const nums = newMeasured.filter((v) => v !== "" && !isNaN(Number(v))).map(Number);
        const avg = nums.length > 0 ? (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toFixed(2) : "";
        const applied = parseFloat(row.appliedKvp || "0");
        const tol = parseFloat(toleranceValue || "0");
        const newMeasuredStatus = newMeasured.map((val) =>
          checkTolerance(parseFloat(val || "0"), applied, tol, toleranceSign)
        );
        const avgNum = parseFloat(avg || "0");
        const avgStatus = checkTolerance(avgNum, applied, tol, toleranceSign);
        const hasAnyFailure = newMeasuredStatus.some((s) => !s) || !avgStatus;
        const hasValidData =
          !isNaN(applied) &&
          applied > 0 &&
          !isNaN(tol) &&
          tol > 0 &&
          (newMeasured.some((v) => v !== "" && !isNaN(parseFloat(v))) || (!isNaN(avgNum) && avgNum > 0));
        let remark: "PASS" | "FAIL" | "-" = "-";
        if (hasValidData) remark = hasAnyFailure ? "FAIL" : "PASS";
        return {
          ...row,
          measuredValues: newMeasured,
          measuredValuesStatus: newMeasuredStatus,
          averageKvp: avg,
          averageKvpStatus: avgStatus,
          remarks: remark,
        };
      })
    );
    setIsSaved(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-10">
      <div className="flex justify-end">
        <button
          onClick={isViewMode ? () => setIsEditing(true) : saveTest}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${isViewMode ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-teal-600 text-white hover:bg-teal-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : isViewMode ? (
            <>
              <Edit3 className="w-5 h-5" />
              Edit
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {testId ? "Update Test" : "Save Test"}
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-300">
          <h3 className="text-xl font-bold text-blue-900">Accuracy of kVp at Different mA Stations</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider border-r">
                Applied kVp
              </th>
              <th colSpan={mAStations.length} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider border-r">
                <div className="flex items-center justify-between">
                  <span>Measured Values (kVp)</span>
                  {!isViewMode && (
                    <button type="button" onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider border-r">
                Average kVp
              </th>
              <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider">
                Remarks
              </th>
              <th rowSpan={2} className="w-12" />
            </tr>
            <tr>
              {mAStations.map((header, idx) => (
                <th key={idx} className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateMAHeader(idx, e.target.value)}
                      disabled={isViewMode}
                      readOnly={isViewMode}
                      className={`w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300"}`}
                    />
                    {!isViewMode && mAStations.length > 1 && (
                      <button type="button" onClick={() => removeMAColumn(idx)} className="p-1 text-red-600 hover:bg-red-100 rounded">
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
                <td className="px-6 py-3 border-r">
                  <input
                    type="number"
                    value={row.appliedKvp}
                    onChange={(e) => updateCell(row.id, "appliedKvp", e.target.value)}
                    disabled={isViewMode}
                    readOnly={isViewMode}
                    className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300"}`}
                    placeholder="80"
                  />
                </td>
                {row.measuredValues.map((val, idx) => {
                  const hasValue = val !== "" && !isNaN(parseFloat(val));
                  const isValid =
                    row.measuredValuesStatus && row.measuredValuesStatus.length > idx
                      ? row.measuredValuesStatus[idx]
                      : checkTolerance(
                        parseFloat(val || "0"),
                        parseFloat(row.appliedKvp || "0"),
                        parseFloat(toleranceValue || "0"),
                        toleranceSign
                      );
                  return (
                    <td key={idx} className={`px-3 py-3 text-center border-r ${hasValue && !isValid ? "bg-red-100" : ""}`}>
                      <input
                        type="number"
                        step="0.1"
                        value={val}
                        onChange={(e) => updateCell(row.id, idx, e.target.value)}
                        disabled={isViewMode}
                        readOnly={isViewMode}
                        className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 ${hasValue && !isValid ? "border-red-500 bg-red-50" : isViewMode ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300"
                          }`}
                        placeholder="0.0"
                      />
                    </td>
                  );
                })}
                <td
                  className={`px-6 py-3 text-center font-bold border-r ${row.averageKvp && row.averageKvp !== "-" && row.averageKvpStatus === false ? "bg-red-100 text-red-800" : "text-gray-800"
                    }`}
                >
                  {row.averageKvp || "-"}
                </td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${row.remarks === "PASS" ? "bg-green-100 text-green-800" : row.remarks === "FAIL" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {row.remarks}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {!isViewMode && rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isViewMode && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button type="button" onClick={addRow} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Row
            </button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
        <div className="flex items-center gap-4">
          <span className="font-medium text-indigo-800">Tolerance:</span>
          <select
            value={toleranceSign}
            onChange={(e) => {
              setToleranceSign(e.target.value as "+" | "-" | "±");
              setIsSaved(false);
            }}
            className="px-4 py-2 border border-indigo-400 rounded bg-white font-medium"
          >
            <option value="±">±</option>
            <option value="+">Positive only (+)</option>
            <option value="-">Negative only (-)</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => {
              setToleranceValue(e.target.value);
              setIsSaved(false);
            }}
            disabled={isViewMode}
            readOnly={isViewMode}
            className={`w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          <span className="font-medium text-indigo-800">kV</span>
        </div>
      </div>

      <div
        className={`bg-white shadow-lg rounded-lg border p-8 ${getFiltrationRemark() === "FAIL" && totalFiltration.required !== "" && !isNaN(parseFloat(totalFiltration.required))
            ? "border-red-300 bg-red-50"
            : "border-gray-300"
          }`}
      >
        <h3 className="text-xl font-bold text-green-800 mb-6">Total Filtration</h3>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="text-xl font-medium text-gray-700">Total Filtration is (at</span>
            <input
              type="number"
              step="1"
              value={totalFiltration.atKvp}
              onChange={(e) => {
                setTotalFiltration({ ...totalFiltration, atKvp: e.target.value });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              readOnly={isViewMode}
              className={`w-24 px-3 py-2 text-lg font-bold text-center border-2 rounded-lg focus:ring-4 ${isViewMode ? "border-gray-300 bg-gray-50 cursor-not-allowed" : "border-gray-400 focus:border-green-500 focus:ring-green-200"}`}
              placeholder="80"
            />
            <span className="text-xl font-medium text-gray-700">kVp)</span>
            <input
              type="number"
              step="0.01"
              value={totalFiltration.required}
              onChange={(e) => {
                setTotalFiltration({ ...totalFiltration, required: e.target.value });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              readOnly={isViewMode}
              className={`w-32 px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg focus:ring-4 ${getFiltrationRemark() === "FAIL" && totalFiltration.required !== "" && !isNaN(parseFloat(totalFiltration.required))
                  ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200"
                  : isViewMode ? "border-gray-300 bg-gray-50 cursor-not-allowed" : "border-gray-400 focus:border-green-500 focus:ring-green-200"
                }`}
              placeholder="2.50"
            />
            <span className="text-3xl font-bold text-gray-800">mm of Al</span>
          </div>
          <div className="flex items-center justify-center">
            <span
              className={`text-5xl font-bold ${getFiltrationRemark() === "PASS" ? "text-green-600" : getFiltrationRemark() === "FAIL" ? "text-red-600" : "text-gray-400"
                }`}
            >
              {getFiltrationRemark()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-6">
        <p className="text-lg font-bold text-amber-900 mb-3">Tolerance for Total Filtration:</p>
        <ul className="space-y-3 text-amber-800">
          <li>• 1.5 mm Al for kV &lt; 70</li>
          <li>• 2.0 mm Al for 70 ≤ kV ≤ 100</li>
          <li>• 2.5 mm Al for kV &gt; 100</li>
        </ul>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotential;
