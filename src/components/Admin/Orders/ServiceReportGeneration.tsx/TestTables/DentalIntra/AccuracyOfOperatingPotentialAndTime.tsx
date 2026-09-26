import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addAccuracyOfOperatingPotentialAndTimeForDentalIntra,
  getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra,
  updateAccuracyOfOperatingPotentialAndTimeForDentalIntra,
} from "../../../../../../api";
import { evaluateTotalFiltrationPassFail } from "../totalFiltrationPassFail";

interface MAStationData {
  kvp: string;
  time: string;
}

interface RowData {
  id: string;
  appliedKvp: string;
  setTime: string;
  maStations: MAStationData[];
  avgKvp: string;
  avgTime: string;
  remark: "PASS" | "FAIL" | "-";
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
  csvData?: any[];
}

const AccuracyOfOperatingPotentialAndTime: React.FC<Props> = ({
  serviceId,
  testId: propTestId,
  onTestSaved,
  csvData,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [maStationCount, setMaStationCount] = useState<number>(2);
  const [rows, setRows] = useState<RowData[]>([
    {
      id: "1",
      appliedKvp: "60",
      setTime: "",
      maStations: [
        { kvp: "", time: "" },
        { kvp: "", time: "" },
      ],
      avgKvp: "",
      avgTime: "",
      remark: "-",
    },
    {
      id: "2",
      appliedKvp: "80",
      setTime: "",
      maStations: [
        { kvp: "", time: "" },
        { kvp: "", time: "" },
      ],
      avgKvp: "",
      avgTime: "",
      remark: "-",
    },
    {
      id: "3",
      appliedKvp: "100",
      setTime: "",
      maStations: [
        { kvp: "", time: "" },
        { kvp: "", time: "" },
      ],
      avgKvp: "",
      avgTime: "",
      remark: "-",
    },
    {
      id: "4",
      appliedKvp: "120",
      setTime: "",
      maStations: [
        { kvp: "", time: "" },
        { kvp: "", time: "" },
      ],
      avgKvp: "",
      avgTime: "",
      remark: "-",
    },
  ]);

  const [kvpToleranceSign, setKvpToleranceSign] = useState<"+" | "-" | "±">("±");
  const [kvpToleranceValue, setKvpToleranceValue] = useState("5");
  const [timeToleranceSign, setTimeToleranceSign] = useState<"+" | "-" | "±">("±");
  const [timeToleranceValue, setTimeToleranceValue] = useState("10");

  const [totalFiltration, setTotalFiltration] = useState({
    measured: "",
    required: "",
    atKvp: "",
  });

  const [filtrationTolerance, setFiltrationTolerance] = useState({
    forKvGreaterThan70: "1.5",
    forKvBetween70And100: "2.0",
    forKvGreaterThan100: "2.5",
    kvThreshold1: "70",
    kvThreshold2: "100",
  });

  const calculateRow = (row: RowData): RowData => {
    const appliedKvp = parseFloat(row.appliedKvp) || 0;
    const setTime = parseFloat(row.setTime) || 0;

    const stations = row.maStations || [];
    const validKvps = stations
      .map((s) => parseFloat(s?.kvp || "0") || 0)
      .filter((v) => v > 0);
    const validTimes = stations
      .map((s) => parseFloat(s?.time || "0") || 0)
      .filter((v) => v > 0);

    const avgKvp =
      validKvps.length > 0
        ? (validKvps.reduce((a, b) => a + b, 0) / validKvps.length).toFixed(1)
        : "";
    const avgTime =
      validTimes.length > 0
        ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(3)
        : "";

    let remark: "PASS" | "FAIL" | "-" = "-";

    if (appliedKvp > 0 && avgKvp) {
      const avgKvpNum = parseFloat(avgKvp);
      const tolKvp = parseFloat(kvpToleranceValue) || 0;
      const kvpPass =
        kvpToleranceSign === "±"
          ? Math.abs(avgKvpNum - appliedKvp) <= tolKvp
          : kvpToleranceSign === "+"
            ? avgKvpNum <= appliedKvp + tolKvp
            : avgKvpNum >= appliedKvp - tolKvp;

      let timePass = true;
      if (setTime > 0 && avgTime) {
        const avgTimeNum = parseFloat(avgTime);
        const tolTime = parseFloat(timeToleranceValue) || 0;
        const pctError = (Math.abs(avgTimeNum - setTime) / setTime) * 100;
        timePass =
          timeToleranceSign === "±"
            ? pctError <= tolTime
            : timeToleranceSign === "+"
              ? avgTimeNum <= setTime * (1 + tolTime / 100)
              : avgTimeNum >= setTime * (1 - tolTime / 100);
      }

      remark = kvpPass && timePass ? "PASS" : "FAIL";
    }

    return { ...row, avgKvp, avgTime, remark };
  };

  const recalculateAll = (nextRows: RowData[]) => nextRows.map(calculateRow);

  const updateRow = (
    id: string,
    field: string,
    value: string,
    stationIndex?: number,
    stationField?: "kvp" | "time"
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated: RowData = { ...row, maStations: [...(row.maStations || [])] };
        if (field === "appliedKvp") updated.appliedKvp = value;
        else if (field === "setTime") updated.setTime = value;
        else if (stationIndex !== undefined && stationField) {
          if (!updated.maStations[stationIndex]) {
            updated.maStations[stationIndex] = { kvp: "", time: "" };
          } else {
            updated.maStations[stationIndex] = { ...updated.maStations[stationIndex] };
          }
          updated.maStations[stationIndex][stationField] = value;
        }
        return calculateRow(updated);
      })
    );
    setIsSaved(false);
  };

  const addMaStationColumn = (afterIndex: number) => {
    if (maStationCount >= 10) {
      toast.error("Maximum 10 measurements allowed");
      return;
    }
    const newCount = maStationCount + 1;
    setMaStationCount(newCount);
    setRows((prev) =>
      recalculateAll(
        prev.map((row) => {
          const currentStations = [...(row.maStations || [])];
          while (currentStations.length < maStationCount) {
            currentStations.push({ kvp: "", time: "" });
          }
          return {
            ...row,
            maStations: [
              ...currentStations.slice(0, afterIndex + 1),
              { kvp: "", time: "" },
              ...currentStations.slice(afterIndex + 1),
            ],
          };
        })
      )
    );
    setIsSaved(false);
  };

  const removeMaStationColumn = (index: number) => {
    if (maStationCount <= 2) {
      toast.error("Minimum 2 measurements required");
      return;
    }
    setMaStationCount(maStationCount - 1);
    setRows((prev) =>
      recalculateAll(
        prev.map((row) => ({
          ...row,
          maStations: (row.maStations || []).filter((_, i) => i !== index),
        }))
      )
    );
    setIsSaved(false);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        appliedKvp: "",
        setTime: "",
        maStations: Array(maStationCount)
          .fill(null)
          .map(() => ({ kvp: "", time: "" })),
        avgKvp: "",
        avgTime: "",
        remark: "-",
      },
    ]);
    setIsSaved(false);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    setIsSaved(false);
  };

  const getFiltrationRemark = (): "PASS" | "FAIL" | "-" => {
    const measuredMmAl = totalFiltration.measured || "";
    return evaluateTotalFiltrationPassFail(
      totalFiltration.atKvp,
      measuredMmAl,
      filtrationTolerance
    ).remark;
  };

  const applyLoadedData = (testData: any) => {
    if (testData._id) setTestId(testData._id);
    if (testData.rows && testData.rows.length > 0) {
      const loadedRows = testData.rows.map((r: any) => {
        let maStations: MAStationData[] = [];
        if (r.maStations && Array.isArray(r.maStations)) {
          maStations = r.maStations.map((s: any) => ({
            kvp: s?.kvp ?? "",
            time: s?.time ?? "",
          }));
        } else {
          maStations = [
            r.maStation1 || { kvp: "", time: "" },
            r.maStation2 || { kvp: "", time: "" },
          ];
        }
        if (maStations.length === 0) {
          maStations = [
            { kvp: "", time: "" },
            { kvp: "", time: "" },
          ];
        }
        return calculateRow({
          id: Date.now().toString() + Math.random(),
          appliedKvp: r.appliedkVp || r.appliedKvp || "",
          setTime: r.setTime || "",
          maStations,
          avgKvp: r.avgKvp || "",
          avgTime: r.avgTime || "",
          remark: r.remark || "-",
        });
      });
      setRows(loadedRows);
      const maxStations = Math.max(
        ...loadedRows.map((r: RowData) => r.maStations.length),
        2
      );
      setMaStationCount(maxStations);
    }
    if (testData.kvpToleranceSign) setKvpToleranceSign(testData.kvpToleranceSign);
    if (testData.kvpToleranceValue) setKvpToleranceValue(String(testData.kvpToleranceValue));
    if (testData.timeToleranceSign) setTimeToleranceSign(testData.timeToleranceSign);
    if (testData.timeToleranceValue) setTimeToleranceValue(String(testData.timeToleranceValue));

    if (testData.totalFiltration) {
      const tf = testData.totalFiltration;
      setTotalFiltration({
        measured: tf.measured ?? tf.measured1 ?? "",
        required: tf.required ?? tf.measured2 ?? "",
        atKvp: tf.atKvp ?? tf.atKVp ?? "",
      });
    }
    if (testData.filtrationTolerance) {
      const ft = testData.filtrationTolerance;
      setFiltrationTolerance({
        forKvGreaterThan70: ft.forKvGreaterThan70 ?? ft.value1 ?? "1.5",
        forKvBetween70And100: ft.forKvBetween70And100 ?? ft.value2 ?? "2.0",
        forKvGreaterThan100: ft.forKvGreaterThan100 ?? ft.value3 ?? "2.5",
        kvThreshold1: ft.kvThreshold1 ?? ft.kvp1 ?? "70",
        kvThreshold2: ft.kvThreshold2 ?? ft.kvp2 ?? "100",
      });
    }
    setIsSaved(true);
  };

  useEffect(() => {
    if (!serviceId) return;

    const loadTest = async () => {
      setIsLoading(true);
      try {
        if (csvData && csvData.length > 0) {
          // Prefer saved DB data; CSV can still prefill if nothing saved
        }
        const data = await getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra(
          serviceId
        );
        if (data?.data) {
          applyLoadedData(data.data);
        } else if (csvData && csvData.length > 0) {
          applyCsvData(csvData);
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          toast.error("Failed to load test data");
        }
        if (csvData && csvData.length > 0) {
          applyCsvData(csvData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, csvData]);

  const applyCsvData = (data: any[]) => {
    const tolSign = data.find((r) => r["Field Name"] === "Tolerance_Sign" || r["Field Name"] === "kVp_Tolerance_Sign")?.["Value"];
    const tolVal = data.find((r) => r["Field Name"] === "Tolerance_Value" || r["Field Name"] === "kVp_Tolerance_Value")?.["Value"];
    const timeTolSign = data.find((r) => r["Field Name"] === "Time_Tolerance_Sign")?.["Value"];
    const timeTolVal = data.find((r) => r["Field Name"] === "Time_Tolerance_Value")?.["Value"];
    if (tolSign === "+" || tolSign === "-" || tolSign === "±") setKvpToleranceSign(tolSign);
    if (tolVal) setKvpToleranceValue(String(tolVal));
    if (timeTolSign === "+" || timeTolSign === "-" || timeTolSign === "±") setTimeToleranceSign(timeTolSign);
    if (timeTolVal) setTimeToleranceValue(String(timeTolVal));

    const tfMeasured =
      data.find((r) => r["Field Name"] === "Measured" || r["Field Name"] === "measured1")?.["Value"] || "";
    const tfAtKvp = data.find((r) => r["Field Name"] === "atKvp")?.["Value"] || "";
    if (tfMeasured || tfAtKvp) {
      setTotalFiltration((prev) => ({
        ...prev,
        measured: String(tfMeasured || prev.measured),
        atKvp: String(tfAtKvp || prev.atKvp),
      }));
    }

    const rowIndices = [
      ...new Set(
        data
          .map((r) => parseInt(r["Row Index"]))
          .filter((n) => !Number.isNaN(n))
      ),
    ].sort((a, b) => a - b);

    if (rowIndices.length === 0) return;

    let maxStations = 2;
    const loadedRows: RowData[] = rowIndices.map((idx) => {
      const rowData = data.filter((r) => parseInt(r["Row Index"]) === idx);
      const appliedKvp =
        rowData.find((r) => r["Field Name"] === "Applied_kVp" || r["Field Name"] === "appliedKvp")?.["Value"] || "";
      const setTime =
        rowData.find((r) => r["Field Name"] === "Set_Time" || r["Field Name"] === "setTime")?.["Value"] || "";

      const stations: MAStationData[] = [];
      for (let i = 1; i <= 10; i++) {
        const kvp =
          rowData.find(
            (r) =>
              r["Field Name"] === `Meas${i}_kVp` ||
              r["Field Name"] === `Station${i}_kVp` ||
              r["Field Name"] === `maStation${i}_kVp` ||
              r["Field Name"] === `Measured_${i - 1}`
          )?.["Value"] || "";
        const time =
          rowData.find(
            (r) =>
              r["Field Name"] === `Meas${i}_Time` ||
              r["Field Name"] === `Station${i}_Time` ||
              r["Field Name"] === `maStation${i}_Time`
          )?.["Value"] || "";
        if (kvp !== "" || time !== "" || i <= 2) {
          stations.push({ kvp: String(kvp), time: String(time) });
        }
        if (kvp !== "" || time !== "") maxStations = Math.max(maxStations, i);
      }
      while (stations.length < 2) stations.push({ kvp: "", time: "" });

      return calculateRow({
        id: `${idx}-${Date.now()}`,
        appliedKvp: String(appliedKvp),
        setTime: String(setTime),
        maStations: stations.slice(0, Math.max(2, maxStations)),
        avgKvp: "",
        avgTime: "",
        remark: "-",
      });
    });

    setMaStationCount(Math.max(2, maxStations));
    setRows(
      loadedRows.map((r) => ({
        ...r,
        maStations: [
          ...r.maStations,
          ...Array(Math.max(0, Math.max(2, maxStations) - r.maStations.length))
            .fill(null)
            .map(() => ({ kvp: "", time: "" })),
        ].slice(0, Math.max(2, maxStations)),
      }))
    );
    setIsSaved(false);
  };

  useEffect(() => {
    setRows((prev) => recalculateAll(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kvpToleranceSign, kvpToleranceValue, timeToleranceSign, timeToleranceValue]);

  const saveTest = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        rows: rows.map((r) => ({
          appliedKvp: r.appliedKvp,
          setTime: r.setTime,
          maStations: r.maStations,
          avgKvp: r.avgKvp,
          avgTime: r.avgTime,
          remark: r.remark,
        })),
        mAStations: Array.from({ length: maStationCount }, (_, i) => `Meas ${i + 1}`),
        kvpToleranceSign,
        kvpToleranceValue,
        timeToleranceSign,
        timeToleranceValue,
        totalFiltration: {
          atKvp: totalFiltration.atKvp,
          measured1: totalFiltration.measured,
          measured2: totalFiltration.required || totalFiltration.measured,
        },
        filtrationTolerance: {
          forKvGreaterThan70: filtrationTolerance.forKvGreaterThan70,
          forKvBetween70And100: filtrationTolerance.forKvBetween70And100,
          forKvGreaterThan100: filtrationTolerance.forKvGreaterThan100,
          kvThreshold1: filtrationTolerance.kvThreshold1,
          kvThreshold2: filtrationTolerance.kvThreshold2,
          value1: filtrationTolerance.forKvGreaterThan70,
          value2: filtrationTolerance.forKvBetween70And100,
          value3: filtrationTolerance.forKvGreaterThan100,
          kvp1: filtrationTolerance.kvThreshold1,
          kvp2: filtrationTolerance.kvThreshold2,
          kvp3: filtrationTolerance.kvThreshold2,
        },
      };

      let result;
      if (testId) {
        result = await updateAccuracyOfOperatingPotentialAndTimeForDentalIntra(testId, payload);
      } else {
        result = await addAccuracyOfOperatingPotentialAndTimeForDentalIntra(serviceId, payload);
        const newId = result?.data?._id || result?._id;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
      }

      setIsSaved(true);
      setIsEditing(false);
      toast.success(testId ? "Updated successfully" : "Saved successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const isViewMode = isSaved && !isEditing;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full space-y-8">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">
        ACCURACY OF OPERATING POTENTIAL &amp; TIME
      </h2>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  rowSpan={3}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r"
                >
                  Applied kVp
                </th>
                <th
                  rowSpan={3}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r"
                >
                  Set Time
                </th>
                <th
                  colSpan={maStationCount * 2}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r"
                >
                  Measured Values at mA Stations
                </th>
                <th
                  rowSpan={3}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r"
                >
                  Avg kVp
                </th>
                <th
                  rowSpan={3}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r"
                >
                  Avg Time
                </th>
                <th
                  rowSpan={3}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase"
                >
                  Remarks
                </th>
                {!isViewMode && <th rowSpan={3} className="w-10"></th>}
              </tr>
              <tr className="bg-gray-100">
                {Array.from({ length: maStationCount }).map((_, idx) => (
                  <th
                    key={idx}
                    colSpan={2}
                    className="px-3 py-2 text-xs font-medium text-gray-600 border-r"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Meas {idx + 1}</span>
                      {!isViewMode && maStationCount < 10 && (
                        <button
                          type="button"
                          onClick={() => addMaStationColumn(idx)}
                          className="text-green-600 hover:bg-green-100 p-0.5 rounded transition"
                          title="Add measurement after this"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                      {!isViewMode && maStationCount > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMaStationColumn(idx)}
                          className="text-red-600 hover:bg-red-100 p-0.5 rounded transition"
                          title="Delete this measurement"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50 text-xs">
                {Array.from({ length: maStationCount }).map((_, idx) => (
                  <React.Fragment key={idx}>
                    <th className="px-3 py-2 font-medium text-gray-600 border-r">kVp</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border-r">Time</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r">
                    <input
                      type="number"
                      step="1"
                      value={row.appliedKvp}
                      onChange={(e) => updateRow(row.id, "appliedKvp", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 text-center border rounded text-sm focus:border-blue-400 focus:outline-none ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      placeholder="80"
                    />
                  </td>
                  <td className="px-4 py-3 border-r">
                    <input
                      type="number"
                      step="0.001"
                      value={row.setTime}
                      onChange={(e) => updateRow(row.id, "setTime", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 text-center border rounded text-sm focus:border-blue-400 focus:outline-none ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      placeholder="0.100"
                    />
                  </td>
                  {Array.from({ length: maStationCount }).map((_, stationIdx) => {
                    const station = row.maStations[stationIdx] || { kvp: "", time: "" };
                    return (
                      <React.Fragment key={stationIdx}>
                        <td className="px-3 py-3 border-r">
                          <input
                            type="number"
                            step="0.1"
                            value={station.kvp}
                            onChange={(e) =>
                              updateRow(row.id, "", e.target.value, stationIdx, "kvp")
                            }
                            disabled={isViewMode}
                            className={`w-full px-2 py-1 text-center border rounded text-xs focus:border-blue-400 focus:outline-none ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                          />
                        </td>
                        <td className="px-3 py-3 border-r">
                          <input
                            type="number"
                            step="0.001"
                            value={station.time}
                            onChange={(e) =>
                              updateRow(row.id, "", e.target.value, stationIdx, "time")
                            }
                            disabled={isViewMode}
                            className={`w-full px-2 py-1 text-center border rounded text-xs focus:border-blue-400 focus:outline-none ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-medium border-r">
                    {row.avgKvp || "-"}
                  </td>
                  <td className="px-4 py-3 text-center font-medium border-r">
                    {row.avgTime || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        row.remark === "PASS"
                          ? "bg-green-100 text-green-700"
                          : row.remark === "FAIL"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {row.remark}
                    </span>
                  </td>
                  {!isViewMode && (
                    <td className="px-2 py-3 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isViewMode && (
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-start">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp</h4>
        <div className="flex items-center gap-4">
          <select
            value={kvpToleranceSign}
            onChange={(e) => {
              setKvpToleranceSign(e.target.value as "+" | "-" | "±");
              setIsSaved(false);
            }}
            disabled={isViewMode}
            className={`px-4 py-2 border border-indigo-400 rounded font-medium ${isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
          >
            <option value="±">±</option>
            <option value="+">+</option>
            <option value="-">-</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={kvpToleranceValue}
            onChange={(e) => {
              setKvpToleranceValue(e.target.value);
              setIsSaved(false);
            }}
            disabled={isViewMode}
            className={`w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500 ${isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
          />
          <span className="font-medium text-indigo-800">kV</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for Irradiation Time</h4>
        <div className="flex items-center gap-4">
          <select
            value={timeToleranceSign}
            onChange={(e) => {
              setTimeToleranceSign(e.target.value as "+" | "-" | "±");
              setIsSaved(false);
            }}
            disabled={isViewMode}
            className={`px-4 py-2 border border-indigo-400 rounded font-medium ${isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
          >
            <option value="±">±</option>
            <option value="+">+</option>
            <option value="-">-</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={timeToleranceValue}
            onChange={(e) => {
              setTimeToleranceValue(e.target.value);
              setIsSaved(false);
            }}
            disabled={isViewMode}
            className={`w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500 ${isViewMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
          />
          <span className="font-medium text-indigo-800">%</span>
        </div>
      </div>

      <div
        className={`bg-white shadow-lg rounded-lg border p-8 ${
          getFiltrationRemark() === "FAIL" ? "border-red-300 bg-red-50" : "border-gray-300"
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
              className={`w-24 px-3 py-2 text-lg font-bold text-center border-2 rounded-lg ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200"}`}
              placeholder="80"
            />
            <span className="text-xl font-medium text-gray-700">kVp)</span>
            <input
              type="number"
              step="0.01"
              value={totalFiltration.measured}
              onChange={(e) => {
                setTotalFiltration({ ...totalFiltration, measured: e.target.value });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-32 px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg ${
                isViewMode
                  ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                  : getFiltrationRemark() === "FAIL"
                    ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-200"
                    : "border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200"
              }`}
              placeholder="2.50"
            />
            <span className="text-3xl font-bold text-gray-800">mm of Al</span>
          </div>
          <div className="flex items-center justify-center">
            <span
              className={`text-5xl font-bold ${
                getFiltrationRemark() === "PASS"
                  ? "text-green-600"
                  : getFiltrationRemark() === "FAIL"
                    ? "text-red-600"
                    : "text-gray-400"
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
          <li className="flex items-center gap-3 flex-wrap">
            <span>•</span>
            <input
              type="number"
              step="0.1"
              value={filtrationTolerance.forKvGreaterThan70}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  forKvGreaterThan70: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-20 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
            <span>mm Al for kV {"≤"}</span>
            <input
              type="number"
              step="1"
              value={filtrationTolerance.kvThreshold1}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  kvThreshold1: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
          </li>
          <li className="flex items-center gap-3 flex-wrap">
            <span>•</span>
            <input
              type="number"
              step="0.1"
              value={filtrationTolerance.forKvBetween70And100}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  forKvBetween70And100: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-20 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
            <span>mm Al for</span>
            <input
              type="number"
              step="1"
              value={filtrationTolerance.kvThreshold1}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  kvThreshold1: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
            <span>≤ kV ≤</span>
            <input
              type="number"
              step="1"
              value={filtrationTolerance.kvThreshold2}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  kvThreshold2: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
          </li>
          <li className="flex items-center gap-3 flex-wrap">
            <span>•</span>
            <input
              type="number"
              step="0.1"
              value={filtrationTolerance.forKvGreaterThan100}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  forKvGreaterThan100: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-20 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
            <span>mm Al for kV {">"}</span>
            <input
              type="number"
              step="1"
              value={filtrationTolerance.kvThreshold2}
              onChange={(e) => {
                setFiltrationTolerance({
                  ...filtrationTolerance,
                  kvThreshold2: e.target.value,
                });
                setIsSaved(false);
              }}
              disabled={isViewMode}
              className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-amber-600 text-amber-900 bg-white"}`}
            />
          </li>
        </ul>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={isViewMode ? () => setIsEditing(true) : saveTest}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : isViewMode
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isViewMode ? <Edit3 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {isViewMode ? "Edit" : testId ? "Update" : "Save"} Test
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotentialAndTime;
