// src/components/TestTables/AccuracyOfOperatingPotentialAndTime.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addAccuracyOfOperatingPotentialAndTimeForDentalIntra,
  getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra,
  updateAccuracyOfOperatingPotentialAndTimeForDentalIntra,
} from "../../../../../../api";

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
  testId?: string;
  onTestSaved?: (testId: string) => void;
}

const AccuracyOfOperatingPotentialAndTime: React.FC<Props> = ({ 
  serviceId, 
  testId: propTestId,
  onTestSaved 
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
      appliedKvp: "80",
      setTime: "0.100",
      maStations: [
        { kvp: "", time: "" },
        { kvp: "", time: "" },
      ],
      avgKvp: "",
      avgTime: "",
      remark: "-",
    },
  ]);

  // Tolerances
  const [kvpToleranceSign, setKvpToleranceSign] = useState<"+" | "-" | "±">("±");
  const [kvpToleranceValue, setKvpToleranceValue] = useState("5");
  const [timeToleranceSign, setTimeToleranceSign] = useState<"+" | "±">("±");
  const [timeToleranceValue, setTimeToleranceValue] = useState("10");

  // Total Filtration
  const [totalFiltration, setTotalFiltration] = useState({
    atKvp: "80",
    measured1: "",
    measured2: "",
  });

  const [filtrationTolerance, setFiltrationTolerance] = useState({
    value1: "1.5",
    operator1: "≤",
    kvp1: "70",
    value2: "2.0",
    operator2: "70 < kV ≤",
    kvp2: "100",
    value3: "2.5",
    operator3: ">",
    kvp3: "100",
  });

  // Calculate averages and remark
  const calculateRow = (row: RowData): RowData => {
    const appliedKvp = parseFloat(row.appliedKvp) || 0;
    const setTime = parseFloat(row.setTime) || 0;

    const stations = row.maStations || [];
    const validKvps = stations
      .map(s => parseFloat(s?.kvp || "0") || 0)
      .filter(v => v > 0);
    const validTimes = stations
      .map(s => parseFloat(s?.time || "0") || 0)
      .filter(v => v > 0);

    const avgKvp = validKvps.length > 0
      ? (validKvps.reduce((a, b) => a + b, 0) / validKvps.length).toFixed(1)
      : "";
    const avgTime = validTimes.length > 0
      ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(3)
      : "";

    let remark: "PASS" | "FAIL" | "-" = "-";

    if (appliedKvp > 0 && setTime > 0 && avgKvp && avgTime) {
      const avgKvpNum = parseFloat(avgKvp);
      const avgTimeNum = parseFloat(avgTime);
      const tolKvp = parseFloat(kvpToleranceValue) || 0;
      const tolTime = parseFloat(timeToleranceValue) || 0;

      const kvpPass = kvpToleranceSign === "±"
        ? Math.abs(avgKvpNum - appliedKvp) <= tolKvp
        : kvpToleranceSign === "+"
          ? avgKvpNum <= appliedKvp + tolKvp
          : avgKvpNum >= appliedKvp - tolKvp;

      const timePass = timeToleranceSign === "±"
        ? Math.abs(avgTimeNum - setTime) / setTime * 100 <= tolTime
        : avgTimeNum <= setTime * (1 + tolTime / 100);

      remark = kvpPass && timePass ? "PASS" : "FAIL";
    }

    return { ...row, avgKvp, avgTime, remark };
  };

  const updateRow = (id: string, field: string, value: string, stationIndex?: number, stationField?: 'kvp' | 'time') => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const updated: any = { ...row };
        if (field === "appliedKvp") updated.appliedKvp = value;
        else if (field === "setTime") updated.setTime = value;
        else if (stationIndex !== undefined && stationField) {
          if (!updated.maStations) updated.maStations = [];
          if (!updated.maStations[stationIndex]) updated.maStations[stationIndex] = { kvp: "", time: "" };
          updated.maStations[stationIndex][stationField] = value;
        }
        return calculateRow(updated);
      })
    );
    setIsSaved(false);
  };

  const addMaStationColumn = (afterIndex: number) => {
    if (maStationCount >= 10) {
      toast.error('Maximum 10 mA stations allowed');
      return;
    }
    const newCount = maStationCount + 1;
    setMaStationCount(newCount);
    setRows(prev =>
      prev.map(row => {
        // Ensure all rows have the same number of stations
        const currentStations = row.maStations || [];
        const paddedStations = [...currentStations];
        // Pad with empty stations if needed
        while (paddedStations.length < maStationCount) {
          paddedStations.push({ kvp: "", time: "" });
        }
        return {
          ...row,
          maStations: [
            ...paddedStations.slice(0, afterIndex + 1),
            { kvp: "", time: "" },
            ...paddedStations.slice(afterIndex + 1),
          ],
        };
      })
    );
    setIsSaved(false);
  };

  const removeMaStationColumn = (index: number) => {
    if (maStationCount <= 2) {
      toast.error('Minimum 2 mA stations required');
      return;
    }
    const newCount = maStationCount - 1;
    setMaStationCount(newCount);
    setRows(prev =>
      prev.map(row => ({
        ...row,
        maStations: (row.maStations || []).filter((_, i) => i !== index),
      }))
    );
    setIsSaved(false);
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        appliedKvp: "",
        setTime: "",
        maStations: Array(maStationCount).fill(null).map(() => ({ kvp: "", time: "" })),
        avgKvp: "",
        avgTime: "",
        remark: "-",
      },
    ]);
    setIsSaved(false);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
    setIsSaved(false);
  };

  // Load existing test data
  useEffect(() => {
    if (!serviceId) return;
    
    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          if (testData.rows && testData.rows.length > 0) {
            const loadedRows = testData.rows.map((r: any) => {
              // Handle backward compatibility: convert maStation1/maStation2 to array
              let maStations: MAStationData[] = [];
              if (r.maStations && Array.isArray(r.maStations)) {
                maStations = r.maStations;
              } else {
                // Legacy format: maStation1, maStation2
                maStations = [
                  r.maStation1 || { kvp: "", time: "" },
                  r.maStation2 || { kvp: "", time: "" },
                ];
              }
              return {
                id: Date.now().toString() + Math.random(),
                appliedKvp: r.appliedkVp || r.appliedKvp || "",
                setTime: r.setTime || "",
                maStations,
                avgKvp: r.avgKvp || "",
                avgTime: r.avgTime || "",
                remark: r.remark || "-",
              };
            });
            setRows(loadedRows);
            // Set maStationCount based on loaded data
            const maxStations = Math.max(...loadedRows.map((r: RowData) => r.maStations.length), 2);
            setMaStationCount(maxStations);
          }
          if (testData.kvpToleranceSign) setKvpToleranceSign(testData.kvpToleranceSign);
          if (testData.kvpToleranceValue) setKvpToleranceValue(testData.kvpToleranceValue);
          if (testData.timeToleranceSign) setTimeToleranceSign(testData.timeToleranceSign);
          if (testData.timeToleranceValue) setTimeToleranceValue(testData.timeToleranceValue);
          if (testData.totalFiltration) setTotalFiltration(testData.totalFiltration);
          if (testData.filtrationTolerance) setFiltrationTolerance(testData.filtrationTolerance);
          setIsSaved(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load test data");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTest();
  }, [serviceId]);

  const saveTest = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        rows: rows.map(r => ({
          appliedKvp: r.appliedKvp,
          setTime: r.setTime,
          maStations: r.maStations,
          avgKvp: r.avgKvp,
          avgTime: r.avgTime,
          remark: r.remark,
        })),
        kvpToleranceSign,
        kvpToleranceValue,
        timeToleranceSign,
        timeToleranceValue,
        totalFiltration,
        filtrationTolerance,
      };

      let result;
      if (testId) {
        result = await updateAccuracyOfOperatingPotentialAndTimeForDentalIntra(testId, payload);
      } else {
        result = await addAccuracyOfOperatingPotentialAndTimeForDentalIntra(serviceId, payload);
        if (result?.data?._id) {
          setTestId(result.data._id);
          onTestSaved?.(result.data._id);
        }
      }

      setIsSaved(true);
      setIsEditing(false);
      toast.success(testId ? "Updated successfully" : "Saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(true);
    setIsSaved(false);
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
      {/* Header & Save Button */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Accuracy of Operating Potential (kVp) and Irradiation Time
        </h2>
        <button
          onClick={isViewMode ? toggleEdit : saveTest}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${isViewMode
              ? "bg-orange-600 text-white hover:bg-orange-700"
              : isSaved
              ? "bg-gray-400 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : isViewMode ? (
            <>
              <Edit3 className="w-4 h-4" />
              Edit
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {testId ? "Update" : "Save"} Test
            </>
          )}
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="text-lg font-medium text-gray-700">
            Accuracy of kVp and Irradiation Time
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r">
                  Applied kVp
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r">
                  Set Time (s)
                </th>
                <th colSpan={maStationCount * 2} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                  Measured Values at mA Stations
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                  Avg kVp
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r">
                  Avg Time (s)
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                  Remark
                </th>
                <th rowSpan={2} className="w-10"></th>
              </tr>
              <tr className="bg-gray-100">
                {Array.from({ length: maStationCount }).map((_, idx) => (
                  <th key={idx} colSpan={2} className="px-3 py-2 text-xs font-medium text-gray-600 border-r relative">
                    <div className="flex items-center justify-center gap-1">
                      <span>mA Station {idx + 1}</span>
                      {!isViewMode && maStationCount < 10 && (
                        <button
                          type="button"
                          onClick={() => addMaStationColumn(idx)}
                          className="text-green-600 hover:bg-green-100 p-0.5 rounded transition"
                          title="Add column after this"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                      {!isViewMode && maStationCount > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMaStationColumn(idx)}
                          className="text-red-600 hover:bg-red-100 p-0.5 rounded transition"
                          title="Delete this column"
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
                <th colSpan={3}></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r">
                    <input
                      type="number"
                      step="1"
                      value={row.appliedKvp}
                      onChange={e => updateRow(row.id, "appliedKvp", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 text-center border rounded text-sm focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="80"
                    />
                  </td>
                  <td className="px-4 py-3 border-r">
                    <input
                      type="number"
                      step="0.001"
                      value={row.setTime}
                      onChange={e => updateRow(row.id, "setTime", e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 text-center border rounded text-sm focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                            onChange={e => updateRow(row.id, "", e.target.value, stationIdx, 'kvp')}
                            disabled={isViewMode}
                            className={`w-full px-2 py-1 text-center border rounded text-xs focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          />
                        </td>
                        <td className="px-3 py-3 border-r">
                          <input
                            type="number"
                            step="0.001"
                            value={station.time}
                            onChange={e => updateRow(row.id, "", e.target.value, stationIdx, 'time')}
                            disabled={isViewMode}
                            className={`w-full px-2 py-1 text-center border rounded text-xs focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-medium border-r">{row.avgKvp || "-"}</td>
                  <td className="px-4 py-3 text-center font-medium border-r">{row.avgTime || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${row.remark === "PASS" ? "bg-green-100 text-green-700" :
                        row.remark === "FAIL" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                      }`}>
                      {row.remark}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
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

        <div className="px-4 py-3 bg-gray-50 border-t flex justify-start">
          {!isViewMode && (
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          )}
        </div>
      </div>

      {/* Tolerances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded border">
          <h4 className="font-medium text-gray-700 mb-3">kVp Tolerance</h4>
          <div className="flex items-center gap-3">
            <select
              value={kvpToleranceSign}
              onChange={e => setKvpToleranceSign(e.target.value as any)}
              disabled={isViewMode}
              className={`px-3 py-1 border rounded text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="±">±</option>
              <option value="+">Positive (+)</option>
              <option value="-">Negative (-)</option>
            </select>
            <input
              type="number"
              value={kvpToleranceValue}
              onChange={e => setKvpToleranceValue(e.target.value)}
              disabled={isViewMode}
              className={`w-20 px-2 py-1 border rounded text-center text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            <span className="text-sm text-gray-600">kV</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded border">
          <h4 className="font-medium text-gray-700 mb-3">Time Tolerance</h4>
          <div className="flex items-center gap-3">
            <select
              value={timeToleranceSign}
              onChange={e => setTimeToleranceSign(e.target.value as any)}
              disabled={isViewMode}
              className={`px-3 py-1 border rounded text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="±">±</option>
              <option value="+">+ Only</option>
            </select>
            <input
              type="number"
              value={timeToleranceValue}
              onChange={e => setTimeToleranceValue(e.target.value)}
              disabled={isViewMode}
              className={`w-20 px-2 py-1 border rounded text-center text-sm ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>
      </div>

      {/* Total Filtration */}
      <div className="bg-gray-50 p-6 rounded border">
        <h3 className="font-medium text-gray-700 mb-4">Total Filtration</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Total Filtration is (at</span>
          <input
            type="number"
            value={totalFiltration.atKvp}
            onChange={e => setTotalFiltration({ ...totalFiltration, atKvp: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="80"
          />
          <span>kVp)</span>
          <input
            type="number"
            step="0.01"
            value={totalFiltration.measured1}
            onChange={e => setTotalFiltration({ ...totalFiltration, measured1: e.target.value })}
            disabled={isViewMode}
            className={`w-32 px-3 py-2 border rounded font-medium text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="2.30"
          />
          <span>and</span>
          <input
            type="number"
            step="0.01"
            value={totalFiltration.measured2}
            onChange={e => setTotalFiltration({ ...totalFiltration, measured2: e.target.value })}
            disabled={isViewMode}
            className={`w-32 px-3 py-2 border rounded font-medium text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="2.50"
          />
          <span>mm Al</span>
        </div>
      </div>

      {/* Filtration Tolerance */}
      <div className="bg-gray-50 p-6 rounded border">
        <h3 className="font-medium text-gray-700 mb-4">Filtration Tolerance</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <input type="number" step="0.1" value={filtrationTolerance.value1}
            onChange={e => setFiltrationTolerance({ ...filtrationTolerance, value1: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
          <span>mm Al for kV</span>
          <span className="font-medium">{filtrationTolerance.operator1}</span>
          <input type="number" value={filtrationTolerance.kvp1}
            onChange={e => setFiltrationTolerance({ ...filtrationTolerance, kvp1: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
          <span>,</span>
          <input type="number" step="0.1" value={filtrationTolerance.value2}
            onChange={e => setFiltrationTolerance({ ...filtrationTolerance, value2: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
          <span>mm Al for</span>
          <code className="px-2 py-1 bg-gray-200 rounded text-xs">
            {filtrationTolerance.operator2}
          </code>
          <input type="number" value={filtrationTolerance.kvp2}
            onChange={e => setFiltrationTolerance({ ...filtrationTolerance, kvp2: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
          <span>,</span>
          <input type="number" step="0.1" value={filtrationTolerance.value3}
            onChange={e => setFiltrationTolerance({ ...filtrationTolerance, value3: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
          <span>mm Al for kV</span>
          <span className="font-medium">{filtrationTolerance.operator3}</span>
          <input type="number" value={filtrationTolerance.kvp3}
            onChange={e => setFiltrationTolerance({ ...filtrationTolerance, kvp3: e.target.value })}
            disabled={isViewMode}
            className={`w-20 px-2 py-1 border rounded text-center ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
        </div>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotentialAndTime;