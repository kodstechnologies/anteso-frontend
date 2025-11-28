// src/components/TestTables/TubeHousingLeakage.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createTubeHousingLeakage,
  getTubeHousingLeakageById,
  getTubeHousingLeakageByServiceId,
  updateTubeHousingLeakage,
} from "../../../../../../api"; // Correct API imports

interface Settings {
  kv: string;
  ma: string;
  time: string;
  fcd: string;
}

interface LeakageRow {
  location: string;
  front: string;
  back: string;
  left: string;
  right: string;
  max: string;
  unit: string;
  remark: string;
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

export default function TubeHousingLeakage({ serviceId, testId: propTestId, onTestSaved }: Props) {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form Data
  const [settings, setSettings] = useState<Settings>({ kv: "", ma: "", time: "", fcd: "" });
  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    { location: "Tube", front: "", back: "", left: "", right: "", max: "", unit: "mGy/h", remark: "" },
  ]);
  const [workload, setWorkload] = useState<string>("");
  const [workloadUnit, setWorkloadUnit] = useState<string>("mA·min/week");
  const [toleranceValue, setToleranceValue] = useState<string>("1.0");
  const [toleranceOperator, setToleranceOperator] = useState<"less than or equal to" | "greater than or equal to" | "=">("less than or equal to");
  const [toleranceTime, setToleranceTime] = useState<string>("1");

  // Auto-calculate max per row
  const processedLeakage = useMemo(() => {
    return leakageRows.map(row => {
      const values = [row.front, row.back, row.left, row.right]
        .map(v => parseFloat(v) || 0);
      const max = values.length > 0 ? Math.max(...values).toFixed(3) : "";
      return { ...row, max };
    });
  }, [leakageRows]);

  // Max Leakage Calculation: (Workload × Max Reading) / (60 × 100)
  const maxLeakageResult = useMemo(() => {
    const workloadNum = parseFloat(workload) || 0;
    const maxReading = Math.max(...processedLeakage.map(r => parseFloat(r.max) || 0));
    if (workloadNum > 0 && maxReading > 0) {
      return ((workloadNum * maxReading) / (60 * 100)).toFixed(4);
    }
    return "";
  }, [workload, processedLeakage]);

  // Final Radiation Leakage (mGy/h) = Result ÷ 114
  const finalLeakage = useMemo(() => {
    const result = parseFloat(maxLeakageResult) || 0;
    return result > 0 ? (result / 114).toFixed(4) : "";
  }, [maxLeakageResult]);

  // Auto Pass/Fail
  const finalResult = useMemo(() => {
    const leakage = parseFloat(finalLeakage) || 0;
    const tolerance = parseFloat(toleranceValue) || 0;

    if (!toleranceValue || !finalLeakage) return "";

    if (toleranceOperator === "less than or equal to") return leakage <= tolerance ? "Pass" : "Fail";
    if (toleranceOperator === "greater than or equal to") return leakage >= tolerance ? "Pass" : "Fail";
    if (toleranceOperator === "=") return Math.abs(leakage - tolerance) < 0.001 ? "Pass" : "Fail";

    return "";
  }, [finalLeakage, toleranceValue, toleranceOperator]);

  // Load existing test
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;

        if (propTestId) {
          data = await getTubeHousingLeakageById(propTestId);
        } else {
          data = await getTubeHousingLeakageByServiceId(serviceId);
        }

        if (data) {
          setTestId(data._id);
          setSettings({
            kv: String(data.measurementSettings.kv || ""),
            ma: String(data.measurementSettings.ma || ""),
            time: String(data.measurementSettings.time || ""),
            fcd: String(data.measurementSettings.fcd || ""),
          });
          setLeakageRows(
            data.leakageMeasurements.map((r: any) => ({
              location: r.location || "Tube",
              front: String(r.front || ""),
              back: String(r.back || ""),
              left: String(r.left || ""),
              right: String(r.right || ""),
              max: "",
              unit: r.unit || "mGy/h",
              remark: "",
            }))
          );
          setWorkload(String(data.workload || ""));
          setWorkloadUnit(data.workloadUnit || "mA·min/week");
          setToleranceValue(data.tolerance || "1.0");
          setToleranceOperator(data.toleranceOperator || "less than or equal to");
          setToleranceTime(data.toleranceTime || "1");

          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err: any) {
        console.error("Load failed:", err);
        setIsSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [propTestId, serviceId]);

  // Save / Update
  const handleSave = async () => {
    if (!serviceId) return toast.error("Service ID missing");

    const payload = {
      measurementSettings: {
        kv: parseFloat(settings.kv) || 0,
        ma: parseFloat(settings.ma) || 0,
        time: parseFloat(settings.time) || 0,
        fcd: parseFloat(settings.fcd) || 0,
      },
      leakageMeasurements: leakageRows.map(r => ({
        location: r.location,
        front: parseFloat(r.front) || 0,
        back: parseFloat(r.back) || 0,
        left: parseFloat(r.left) || 0,
        right: parseFloat(r.right) || 0,
        unit: r.unit,
      })),
      workload: parseFloat(workload) || 0,
      workloadUnit,
      tolerance: toleranceValue.trim(),
      toleranceOperator,
      toleranceTime: toleranceTime.trim(),
      maxLeakagePerHour: finalLeakage,
      finalResult: finalResult || "",
    };

    setIsSaving(true);
    try {
      if (testId) {
        await updateTubeHousingLeakage(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createTubeHousingLeakage(serviceId, payload);
        const newId = res.data?._id || res.data?.testId;
        setTestId(newId);
        onTestSaved?.(newId);
        toast.success("Saved successfully!");
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => setIsEditing(true);

  const isViewOnly = isSaved && !isEditing;
  const buttonText = !isSaved ? "Save Test" : isEditing ? "Update Test" : "Edit Test";
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Loading test data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Radiation Leakage from Tube Housing</h2>
        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all shadow-md ${isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : isViewOnly
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-5 h-5" />
              {buttonText}
            </>
          )}
        </button>
      </div>

      {/* Measurement Settings */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <h3 className="px-6 py-4 text-lg font-semibold bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase">kV</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase">mA</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase">Time (sec)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase">FCD (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              {["kv", "ma", "time", "fcd"].map((field) => (
                <td key={field} className="px-6 py-4">
                  <input
                    type="text"
                    value={settings[field as keyof Settings]}
                    onChange={(e) => setSettings(prev => ({ ...prev, [field]: e.target.value }))}
                    disabled={isViewOnly}
                    className={`w-full px-4 py-2 text-center border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 ${isViewOnly ? "bg-gray-50 cursor-not-allowed" : ""
                      }`}
                    placeholder={field === "fcd" ? "100" : "120"}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Leakage Measurements */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <h3 className="px-6 py-4 text-lg font-semibold bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          Leakage Measurement Results
        </h3>
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase">Location</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Front</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Back</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Left</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Right</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Max</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Unit</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-blue-900 uppercase">Result</th>
            </tr>
          </thead>
          <tbody>
            {processedLeakage.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-t">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={row.location}
                    onChange={(e) => setLeakageRows(prev => prev.map((r, i) => i === idx ? { ...r, location: e.target.value } : r))}
                    disabled={isViewOnly}
                    className="w-full px-3 py-2 text-center border rounded-lg text-sm"
                  />
                </td>
                {["front", "back", "left", "right"].map((dir) => (
                  <td key={dir} className="px-6 py-4">
                    <input
                      type="number"
                      step="0.001"
                      value={leakageRows[idx][dir as keyof LeakageRow]}
                      onChange={(e) => setLeakageRows(prev => prev.map((r, i) => i === idx ? { ...r, [dir]: e.target.value } : r))}
                      disabled={isViewOnly}
                      className="w-full px-3 py-2 text-center border rounded-lg text-sm font-medium"
                    />
                  </td>
                ))}
                <td className="px-6 py-4 text-center font-bold bg-blue-50">{row.max || "-"}</td>
                <td className="px-6 py-4 text-center">{row.unit}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${finalResult === "Pass" ? "bg-green-100 text-green-800" : finalResult === "Fail" ? "bg-red-100 text-red-800" : "bg-gray-100"}`}>
                    {finalResult || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workload & Tolerance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-indigo-900 mb-4">Workload</h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={workload}
              onChange={(e) => setWorkload(e.target.value)}
              disabled={isViewOnly}
              className="w-32 px-4 py-3 text-center border-2 rounded-lg font-bold focus:ring-4 focus:ring-indigo-300"
            />
            <span className="text-lg font-medium">{workloadUnit}</span>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-indigo-300">
          <h3 className="text-lg font-bold text-indigo-900 mb-4">Acceptance Criteria</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg">Maximum Leakage ≤</span>
            <input
              type="number"
              step="0.1"
              value={toleranceValue}
              onChange={(e) => setToleranceValue(e.target.value)}
              disabled={isViewOnly}
              className="w-32 px-4 py-3 text-center border-2 border-indigo-500 rounded-lg font-bold focus:ring-4 focus:ring-indigo-300"
            />
            <span className="text-lg font-bold">mGy/h in {toleranceTime} hour</span>
          </div>
        </div>
      </div>

      {/* Final Result */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-purple-900 mb-4">Final Radiation Leakage</h3>
        <div className="text-4xl font-extrabold text-purple-800">
          {finalLeakage || "—"} mGy/h
        </div>
        <div className={`mt-4 text-2xl font-bold ${finalResult === "Pass" ? "text-green-600" : finalResult === "Fail" ? "text-red-600" : "text-gray-500"}`}>
          {finalResult || "Pending"}
        </div>
      </div>
    </div>
  );
}