// components/TestTables/OBI/LinearityOfTime.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Loader2, Edit3, Save } from "lucide-react";
import toast from "react-hot-toast";
import {
  addLinearityOfTimeMeasurementForOBI,
  getLinearityOfTimeMeasurementByServiceIdForOBI,
  updateLinearityOfTimeMeasurementForOBI,
} from "../../../../../../api";

interface TestConditions {
  ffd: string;
  kv: string;
  ma: string;
}

interface MeasurementRow {
  id: string;
  timeApplied: string;
  measuredOutputs: string[];
  averageOutput: string;
  x: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  refreshKey?: number;
  initialData?: {
    testConditions?: { ffd?: string; kv?: string; ma?: string };
    headers?: string[];
    tolerance?: string;
    toleranceOperator?: string;
    measurementRows?: Array<{
      timeApplied: string;
      radiationOutputs: string[];
      averageOutput?: string;
      x?: string;
    }>;
  };
}

const LinearityOfTime: React.FC<Props> = ({
  serviceId,
  testId: propTestId,
  onRefresh,
  refreshKey,
  initialData,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [testConditions, setTestConditions] = useState<TestConditions>({
    ffd: "",
    kv: "",
    ma: "",
  });
  const [measHeaders, setMeasHeaders] = useState<string[]>(["1", "2", "3"]);
  const [measurementRows, setMeasurementRows] = useState<MeasurementRow[]>([
    {
      id: "1",
      timeApplied: "",
      measuredOutputs: ["", "", ""],
      averageOutput: "",
      x: "",
    },
  ]);
  const [tolerance, setTolerance] = useState<string>("0.1");
  const [toleranceOperator, setToleranceOperator] = useState<string>("<=");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const addMeasColumn = () => {
    setMeasHeaders((prev) => [...prev, `${prev.length + 1}`]);
    setMeasurementRows((prev) =>
      prev.map((row) => ({
        ...row,
        measuredOutputs: [...row.measuredOutputs, ""],
      }))
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

  const addMeasurementRow = () => {
    setMeasurementRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timeApplied: "",
        measuredOutputs: Array(measHeaders.length).fill(""),
        averageOutput: "",
        x: "",
      },
    ]);
  };

  const removeMeasurementRow = (id: string) => {
    if (measurementRows.length <= 1) return;
    setMeasurementRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateMeasurementRow = (
    id: string,
    field: "timeApplied" | number,
    value: string
  ) => {
    setMeasurementRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (typeof field === "number") {
          const newOutputs = [...row.measuredOutputs];
          newOutputs[field] = value;
          return { ...row, measuredOutputs: newOutputs };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const processedRows = useMemo(() => {
    const ma = parseFloat(testConditions.ma) || 0;
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];

    const rowsWithCalculations = measurementRows.map((row) => {
      const outputs = row.measuredOutputs
        .map((v) => parseFloat(v))
        .filter((v) => !isNaN(v) && v > 0);

      const averageOutput =
        outputs.length > 0
          ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(4)
          : "";

      const timeApplied = parseFloat(row.timeApplied);
      // X = Average Output / (mA × Time Applied) → mGy/mAs
      const x =
        averageOutput &&
        !isNaN(timeApplied) &&
        timeApplied > 0 &&
        ma > 0
          ? (parseFloat(averageOutput) / (ma * timeApplied)).toFixed(4)
          : "";

      if (x) xValues.push(parseFloat(x));

      return { ...row, averageOutput, x };
    });

    const xMax =
      xValues.length > 0 ? Math.max(...xValues).toFixed(4) : "";
    const xMin =
      xValues.length > 0 ? Math.min(...xValues).toFixed(4) : "";

    const colNum =
      xMax && xMin && parseFloat(xMax) + parseFloat(xMin) > 0
        ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) /
          (parseFloat(xMax) + parseFloat(xMin))
        : null;
    const col =
      colNum !== null && colNum >= 0
        ? parseFloat(colNum.toFixed(4)).toFixed(4)
        : "—";

    let pass = false;
    let remark = "—";
    if (col !== "—" && colNum !== null) {
      const colVal = parseFloat(col);
      switch (toleranceOperator) {
        case "<":
          pass = colVal < tol;
          break;
        case ">":
          pass = colVal > tol;
          break;
        case "<=":
          pass = colVal <= tol;
          break;
        case ">=":
          pass = colVal >= tol;
          break;
        case "=":
          pass = Math.abs(colVal - tol) < 0.0001;
          break;
        default:
          pass = colVal <= tol;
      }
      remark = pass ? "Pass" : "Fail";
    }

    return {
      rows: rowsWithCalculations,
      xMax: xMax || "—",
      xMin: xMin || "—",
      col,
      remark,
    };
  }, [measurementRows, testConditions.ma, tolerance, toleranceOperator]);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.testConditions) {
      setTestConditions({
        ffd: initialData.testConditions.ffd || "",
        kv: initialData.testConditions.kv || "",
        ma: initialData.testConditions.ma || "",
      });
    }
    if (initialData.headers && initialData.headers.length > 0) {
      setMeasHeaders(initialData.headers);
    }
    if (initialData.tolerance != null && String(initialData.tolerance).trim() !== "") {
      const tol = String(initialData.tolerance).trim();
      // Ignore operator symbols accidentally parsed into the value field
      if (!["<", ">", "<=", ">=", "="].includes(tol)) {
        setTolerance(tol);
      }
    }
    if (initialData.toleranceOperator) {
      setToleranceOperator(initialData.toleranceOperator);
    }
    if (initialData.measurementRows && initialData.measurementRows.length > 0) {
      const numCols =
        initialData.headers?.length ||
        initialData.measurementRows[0]?.radiationOutputs?.length ||
        3;
      setMeasurementRows(
        initialData.measurementRows.map((r, i) => {
          const outputs =
            Array.isArray(r.radiationOutputs) && r.radiationOutputs.length > 0
              ? [...r.radiationOutputs]
              : Array(numCols).fill("");
          while (outputs.length < numCols) outputs.push("");
          return {
            id: `csv-row-${Date.now()}-${i}`,
            timeApplied: r.timeApplied || "",
            measuredOutputs: outputs,
            averageOutput: r.averageOutput || "",
            x: r.x || "",
          };
        })
      );
    }
    setIsEditing(true);
    setIsLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (initialData || !serviceId) return;

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getLinearityOfTimeMeasurementByServiceIdForOBI(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          if (testData.testConditions) {
            setTestConditions({
              ffd: testData.testConditions.ffd || "",
              kv: testData.testConditions.kv || "",
              ma: testData.testConditions.ma || "",
            });
          }
          if (testData.measHeaders?.length > 0) {
            setMeasHeaders(testData.measHeaders);
          }
          if (testData.measurementRows?.length > 0) {
            const targetLen = testData.measHeaders?.length || 3;
            setMeasurementRows(
              testData.measurementRows.map((r: any) => {
                const outputs = Array.isArray(r.radiationOutputs)
                  ? [...r.radiationOutputs]
                  : Array(targetLen).fill("");
                while (outputs.length < targetLen) outputs.push("");
                return {
                  id: Date.now().toString() + Math.random(),
                  timeApplied: r.timeApplied || "",
                  measuredOutputs: outputs,
                  averageOutput: r.averageOutput || "",
                  x: r.x || "",
                };
              })
            );
          }
          if (testData.tolerance) setTolerance(testData.tolerance);
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
          toast.error("Failed to load Linearity of Time data");
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [serviceId, initialData, refreshKey]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        testConditions,
        measurementRows: processedRows.rows.map((r) => ({
          timeApplied: r.timeApplied,
          radiationOutputs: r.measuredOutputs,
          averageOutput: r.averageOutput,
          x: r.x,
        })),
        measHeaders,
        tolerance,
        toleranceOperator,
        xMax: processedRows.xMax === "—" ? "" : processedRows.xMax,
        xMin: processedRows.xMin === "—" ? "" : processedRows.xMin,
        col: processedRows.col === "—" ? "" : processedRows.col,
        remark:
          processedRows.remark === "Pass" || processedRows.remark === "Fail"
            ? processedRows.remark
            : "",
      };

      let currentTestId = testId;
      if (!currentTestId) {
        try {
          const existing = await getLinearityOfTimeMeasurementByServiceIdForOBI(
            serviceId
          );
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch {
          // create new
        }
      }

      if (currentTestId) {
        await updateLinearityOfTimeMeasurementForOBI(currentTestId, payload);
        toast.success("Updated successfully");
      } else {
        const result = await addLinearityOfTimeMeasurementForOBI(
          serviceId,
          payload
        );
        const newId =
          result?.data?.testId ||
          result?.data?._id ||
          result?.data?.data?._id ||
          result?._id;
        if (newId) setTestId(newId);
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
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">Linearity of Time</h2>

      {/* Table 1: FFD, kV, mA */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider border-r">
                FFD (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider border-r">
                kV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                mA
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={testConditions.ffd}
                  onChange={(e) =>
                    setTestConditions((p) => ({ ...p, ffd: e.target.value }))
                  }
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isViewMode
                      ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                      : "border-gray-300"
                  }`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={testConditions.kv}
                  onChange={(e) =>
                    setTestConditions((p) => ({ ...p, kv: e.target.value }))
                  }
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isViewMode
                      ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                      : "border-gray-300"
                  }`}
                  placeholder="60"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={testConditions.ma}
                  onChange={(e) =>
                    setTestConditions((p) => ({ ...p, ma: e.target.value }))
                  }
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isViewMode
                      ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                      : "border-gray-300"
                  }`}
                  placeholder="100"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Time Applied + Radiation Output + summary */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-3 w-28 text-left text-xs font-medium text-gray-700 tracking-wider border-r whitespace-nowrap"
              >
                Time Applied
              </th>
              <th
                colSpan={measHeaders.length}
                className="px-4 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-r"
              >
                <div className="flex items-center justify-between">
                  <span>Radiation Output (mGy)</span>
                  {!isViewMode && (
                    <button
                      onClick={addMeasColumn}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r"
              >
                Average Output (mGy)
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r"
              >
                mGy / mAs (X)
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r"
              >
                X MAX
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r"
              >
                X MIN
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider border-r"
              >
                Coefficient of Linearity (CoL)
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 tracking-wider"
              >
                Remarks
              </th>
              <th rowSpan={2} className="w-10" />
            </tr>
            <tr>
              {measHeaders.map((header, idx) => (
                <th
                  key={idx}
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                >
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMeasHeaders((prev) => {
                          const next = [...prev];
                          next[idx] = val;
                          return next;
                        });
                      }}
                      disabled={isViewMode}
                      className={`w-20 px-1 py-0.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isViewMode
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                          : "border-gray-300"
                      }`}
                    />
                    {measHeaders.length > 1 && !isViewMode && (
                      <button
                        onClick={() => removeMeasColumn(idx)}
                        className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        type="button"
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
            {processedRows.rows.map((p, index) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={p.timeApplied}
                    onChange={(e) =>
                      updateMeasurementRow(p.id, "timeApplied", e.target.value)
                    }
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode
                        ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                        : "border-gray-300"
                    }`}
                    placeholder="0.10"
                  />
                </td>
                {p.measuredOutputs.map((val, colIdx) => (
                  <td key={colIdx} className="px-2 py-2 border-r">
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) =>
                        updateMeasurementRow(p.id, colIdx, e.target.value)
                      }
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isViewMode
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                          : "border-gray-300"
                      }`}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">
                  {p.averageOutput}
                </td>
                <td className="px-4 py-2 text-center border-r font-medium bg-gray-50">
                  {p.x}
                </td>
                {index === 0 && (
                  <>
                    <td
                      rowSpan={processedRows.rows.length}
                      className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle"
                    >
                      {processedRows.xMax}
                    </td>
                    <td
                      rowSpan={processedRows.rows.length}
                      className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle"
                    >
                      {processedRows.xMin}
                    </td>
                    <td
                      rowSpan={processedRows.rows.length}
                      className="px-4 py-2 text-center border-r font-medium bg-yellow-50 align-middle"
                    >
                      {processedRows.col}
                    </td>
                    <td
                      rowSpan={processedRows.rows.length}
                      className="px-4 py-2 text-center align-middle"
                    >
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          processedRows.remark === "Pass"
                            ? "bg-green-100 text-green-800"
                            : processedRows.remark === "Fail"
                              ? "bg-red-100 text-red-800"
                              : "text-gray-400"
                        }`}
                      >
                        {processedRows.remark || "—"}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-2 py-2 text-center">
                  {measurementRows.length > 1 && !isViewMode && (
                    <button
                      onClick={() => removeMeasurementRow(p.id)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                      type="button"
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
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">
              Tolerance (CoL)
            </span>
            <select
              value={toleranceOperator}
              onChange={(e) => setToleranceOperator(e.target.value)}
              disabled={isViewMode}
              className={`px-3 py-2 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 text-sm ${
                isViewMode
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : ""
              }`}
            >
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
              <option value="=">=</option>
            </select>
            <input
              type="number"
              step="0.001"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                isViewMode
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
                  : "border-gray-300"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isViewMode) setIsEditing(true);
            else handleSave();
          }}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${
            isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : isViewMode
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
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
              {buttonText} Linearity of Time
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LinearityOfTime;
