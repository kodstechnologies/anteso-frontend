// src/components/TestTables/AccuracyOfOperatingPotentialAndTime.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit3, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  addAccuracyOfOperatingPotentialAndTimeForBMD,
  getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD,
  updateAccuracyOfOperatingPotentialAndTimeForBMD,
} from "../../../../../../api";

interface MeasuredValue {
  kvp: string;
  time: string;
}

interface RowData {
  id: string;
  appliedKvp: string;
  setTime: string;
  measuredValues: MeasuredValue[]; // Dynamic array matching mAStations
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

  // Dynamic Columns State
  const [mAStations, setMAStations] = useState<string[]>(["mA Station 1", "mA Station 2"]);

  const [rows, setRows] = useState<RowData[]>([
    {
      id: "1",
      appliedKvp: "80",
      setTime: "0.100",
      measuredValues: [{ kvp: "", time: "" }, { kvp: "", time: "" }],
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

    // Filter valid numeric inputs from dynamic columns
    const validKvps: number[] = [];
    const validTimes: number[] = [];

    row.measuredValues.forEach(m => {
      const k = parseFloat(m.kvp);
      const t = parseFloat(m.time);
      if (k > 0) validKvps.push(k);
      if (t > 0) validTimes.push(t);
    });

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

  const updateRow = (id: string, field: string, value: string, colIndex?: number, subField?: "kvp" | "time") => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const updated: any = { ...row };

        if (field === "appliedKvp") updated.appliedKvp = value;
        else if (field === "setTime") updated.setTime = value;
        else if (field === "measured" && typeof colIndex === 'number' && subField) {
          // Ensure measuredValues array exists and has length
          while (updated.measuredValues.length <= colIndex) {
            updated.measuredValues.push({ kvp: "", time: "" });
          }
          updated.measuredValues[colIndex][subField] = value;
        }

        return calculateRow(updated);
      })
    );
    setIsSaved(false);
  };

  const addRow = () => {
    // Create new measuredValues array matching current mAStations length
    const newMeasuredValues = mAStations.map(() => ({ kvp: "", time: "" }));

    setRows(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        appliedKvp: "",
        setTime: "",
        measuredValues: newMeasuredValues,
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

  // --- Dynamic Column Management ---
  const addMAStation = () => {
    const newStationName = `mA Station ${mAStations.length + 1}`;
    setMAStations(prev => [...prev, newStationName]);
    // Add empty measurement objects to all existing rows
    setRows(prev => prev.map(row => ({
      ...row,
      measuredValues: [...row.measuredValues, { kvp: "", time: "" }]
    })));
    setIsSaved(false);
  };

  const removeMAStation = (index: number) => {
    if (mAStations.length <= 1) {
      toast.error("At least one station is required");
      return;
    }
    setMAStations(prev => prev.filter((_, i) => i !== index));
    // Remove corresponding measurements from all rows
    setRows(prev => prev.map(row => ({
      ...row,
      measuredValues: row.measuredValues.filter((_, i) => i !== index),
      // Recalculate works automatically if I call calculateRow, but here I'm just filtering.
      // Need to recalculate after array modification? Yes.
    })).map(calculateRow));
    setIsSaved(false);
  };

  const updateMAStationName = (index: number, name: string) => {
    const newStations = [...mAStations];
    newStations[index] = name;
    setMAStations(newStations);
    setIsSaved(false);
  };


  // Load existing test data
  useEffect(() => {
    if (!serviceId) return;

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);

          // Restore mAStations if valid, else default
          let loadedStations = ["mA Station 1", "mA Station 2"];
          if (testData.mAStations && Array.isArray(testData.mAStations) && testData.mAStations.length > 0) {
            loadedStations = testData.mAStations;
          }
          setMAStations(loadedStations);

          if (testData.rows && testData.rows.length > 0) {
            setRows(testData.rows.map((r: any) => {
              // Handle Migration from old legacy fields (maStation1, maStation2) to new dynamic measuredValues
              let measuredValues: MeasuredValue[] = [];

              if (r.measuredValues && Array.isArray(r.measuredValues) && r.measuredValues.length > 0) {
                measuredValues = r.measuredValues;
              } else {
                // Legacy fallback
                if (r.maStation1) measuredValues.push(r.maStation1);
                if (r.maStation2) measuredValues.push(r.maStation2);

                // Pad if needed to match loadedStations
                while (measuredValues.length < loadedStations.length) {
                  measuredValues.push({ kvp: "", time: "" });
                }
              }

              return {
                id: Date.now().toString() + Math.random(),
                appliedKvp: r.appliedkVp || r.appliedKvp || "",
                setTime: r.setTime || "",
                measuredValues,
                avgKvp: r.avgKvp || "",
                avgTime: r.avgTime || "",
                remark: r.remark || "-",
              };
            }));
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
          measuredValues: r.measuredValues,
          avgKvp: r.avgKvp,
          avgTime: r.avgTime,
          remark: r.remark,
        })),
        mAStations, // Save the dynamic column labels
        kvpToleranceSign,
        kvpToleranceValue,
        timeToleranceSign,
        timeToleranceValue,
        totalFiltration,
        filtrationTolerance,
      };

      let result;
      if (testId) {
        result = await updateAccuracyOfOperatingPotentialAndTimeForBMD(testId, payload);
      } else {
        result = await addAccuracyOfOperatingPotentialAndTimeForBMD(serviceId, payload);
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
        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-700">
            Accuracy of kVp and Irradiation Time
          </h3>
          {!isViewMode && (
            <button
              onClick={addMAStation}
              className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add mA Station
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r sticky left-0 bg-gray-50 z-10">
                  Applied kVp
                </th>
                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border-r sticky left-20 bg-gray-50 z-10">
                  Set Time (s)
                </th>

                {/* Dynamic mA Station Headers */}
                {mAStations.map((station, idx) => (
                  <th key={idx} colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border-r group relative min-w-[160px]">
                    <div className="flex items-center justify-center gap-2">
                      {isViewMode ? (
                        <span>{station}</span>
                      ) : (
                        <input
                          value={station}
                          onChange={(e) => updateMAStationName(idx, e.target.value)}
                          className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-center w-24 text-xs"
                        />
                      )}
                      {!isViewMode && mAStations.length > 1 && (
                        <button onClick={() => removeMAStation(idx)} className="text-red-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}

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
                {/* Subheaders for each station */}
                {mAStations.map((_, idx) => (
                  <React.Fragment key={idx}>
                    <th className="px-3 py-2 text-xs font-medium text-gray-600 border-r text-center">kVp</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-600 border-r text-center">Time</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r sticky left-0 bg-white">
                    <input
                      type="number"
                      step="1"
                      value={row.appliedKvp}
                      onChange={e => updateRow(row.id, "appliedKvp", e.target.value)}
                      disabled={isViewMode}
                      className={`w-20 px-2 py-1 text-center border rounded text-sm focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="80"
                    />
                  </td>
                  <td className="px-4 py-3 border-r sticky left-20 bg-white">
                    <input
                      type="number"
                      step="0.001"
                      value={row.setTime}
                      onChange={e => updateRow(row.id, "setTime", e.target.value)}
                      disabled={isViewMode}
                      className={`w-20 px-2 py-1 text-center border rounded text-sm focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="0.100"
                    />
                  </td>

                  {/* Dynamic Measurement Inputs */}
                  {mAStations.map((_, colIdx) => (
                    <React.Fragment key={colIdx}>
                      <td className="px-2 py-3 border-r">
                        <input
                          type="number"
                          step="0.1"
                          value={row.measuredValues[colIdx]?.kvp || ""}
                          onChange={e => updateRow(row.id, "measured", e.target.value, colIdx, "kvp")}
                          disabled={isViewMode}
                          className={`w-full px-2 py-1 text-center border rounded text-xs focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-2 py-3 border-r">
                        <input
                          type="number"
                          step="0.001"
                          value={row.measuredValues[colIdx]?.time || ""}
                          onChange={e => updateRow(row.id, "measured", e.target.value, colIdx, "time")}
                          disabled={isViewMode}
                          className={`w-full px-2 py-1 text-center border rounded text-xs focus:border-blue-400 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                      </td>
                    </React.Fragment>
                  ))}

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
                    {rows.length > 1 && !isViewMode && (
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