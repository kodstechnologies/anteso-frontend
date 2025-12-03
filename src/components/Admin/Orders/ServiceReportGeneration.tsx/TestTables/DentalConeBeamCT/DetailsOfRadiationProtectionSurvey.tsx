// components/TestTables/RadiationProtectionSurvey.tsx
'use client';

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Edit3, Save } from "lucide-react";
import toast from "react-hot-toast";
import {
  addRadiationProtectionSurveyForFixedRadioFluro,
  getRadiationProtectionSurveyByServiceIdForFixedRadioFluro,
  updateRadiationProtectionSurveyForFixedRadioFluro,
} from "../../../../../../api";

interface LocationData {
  id: string;
  location: string;
  mRPerHr: string;
  mRPerWeek: string;
  result: string;
  category: "worker" | "public";
}
interface Props {
  serviceId: string;
}

const RadiationProtectionSurvey: React.FC<Props> = ({ serviceId }) => {
  const [testId, setTestId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [surveyDate, setSurveyDate] = useState<string>("");
  const [hasValidCalibration, setHasValidCalibration] = useState<string>("");

  const [appliedCurrent, setAppliedCurrent] = useState<string>("100");
  const [appliedVoltage, setAppliedVoltage] = useState<string>("80");
  const [exposureTime, setExposureTime] = useState<string>("0.5");
  const [workload, setWorkload] = useState<string>("5000");

  const [locations, setLocations] = useState<LocationData[]>([
    { id: "1", location: "Control Console (Operator Position)", mRPerHr: "", mRPerWeek: "", result: "", category: "worker" },
    { id: "2", location: "Outside Lead Glass / View Window", mRPerHr: "", mRPerWeek: "", result: "", category: "worker" },
    { id: "3", location: "Technician Entrance Door (Service Door)", mRPerHr: "", mRPerWeek: "", result: "", category: "worker" },
    { id: "4", location: "Wall D (Console Wall)", mRPerHr: "", mRPerWeek: "", result: "", category: "worker" },
    { id: "5", location: "Wall C", mRPerHr: "", mRPerWeek: "", result: "", category: "public" },
    { id: "6", location: "Wall B", mRPerHr: "", mRPerWeek: "", result: "", category: "public" },
    { id: "7", location: "Wall A", mRPerHr: "", mRPerWeek: "", result: "", category: "public" },
    { id: "8", location: "Outside Patient Entrance Door", mRPerHr: "", mRPerWeek: "", result: "", category: "public" },
    { id: "9", location: "Patient Waiting Area", mRPerHr: "", mRPerWeek: "", result: "", category: "public" },
  ]);

  // Formula: mR/week = (Workload × mR/hr) / (60 × mA used)
  const calculateMRPerWeek = (mRPerHr: string) => {
    const hr = parseFloat(mRPerHr) || 0;
    const mA = parseFloat(appliedCurrent) || 1;
    const wl = parseFloat(workload) || 0;
    if (hr <= 0 || mA <= 0 || wl <= 0) return "";
    return ((wl * hr) / (60 * mA)).toFixed(3);
  };

  useEffect(() => {
    setLocations(prev =>
      prev.map(item => {
        const mRPerWeek = calculateMRPerWeek(item.mRPerHr);
        const weekly = parseFloat(mRPerWeek) || 0;
        const limit = item.category === "worker" ? 40 : 2;
        const result = weekly > 0 ? (weekly <= limit ? "PASS" : "FAIL") : "";
        return { ...item, mRPerWeek, result };
      })
    );
  }, [locations.map(l => l.mRPerHr).join(), appliedCurrent, workload]);

  const addRow = (category: "worker" | "public") => {
    const newRow: LocationData = {
      id: Date.now().toString(),
      location: "New Location",
      mRPerHr: "",
      mRPerWeek: "",
      result: "",
      category
    };
    setLocations(prev => [...prev, newRow]);
  };

  const removeRow = (id: string) => {
    setLocations(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: "location" | "mRPerHr", value: string) => {
    setLocations(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Group locations
  const workerLocations = locations.filter(l => l.category === "worker");
  const publicLocations = locations.filter(l => l.category === "public");

  const maxWorkerWeekly = Math.max(...workerLocations.map(r => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
  const maxPublicWeekly = Math.max(...publicLocations.map(r => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);

  // Load existing survey
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getRadiationProtectionSurveyByServiceIdForFixedRadioFluro(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setSurveyDate(data.surveyDate ? new Date(data.surveyDate).toISOString().split('T')[0] : "");
          setHasValidCalibration(data.hasValidCalibration || "");
          setAppliedCurrent(data.appliedCurrent || "100");
          setAppliedVoltage(data.appliedVoltage || "80");
          setExposureTime(data.exposureTime || "0.5");
          setWorkload(data.workload || "5000");
          if (Array.isArray(data.locations) && data.locations.length > 0) {
            setLocations(
              data.locations.map((l: any, i: number) => ({
                id: Date.now().toString() + i,
                location: l.location || "",
                mRPerHr: l.mRPerHr || "",
                mRPerWeek: l.mRPerWeek || "",
                result: l.result || "",
                category: l.category || "worker",
              }))
            );
          }
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load radiation protection survey");
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Service ID missing");
      return;
    }
    if (!surveyDate.trim()) {
      toast.error("Please select a survey date");
      return;
    }
    if (!hasValidCalibration.trim()) {
      toast.error("Please select calibration status");
      return;
    }

    const payload = {
      surveyDate,
      hasValidCalibration,
      appliedCurrent,
      appliedVoltage,
      exposureTime,
      workload,
      locations: locations.map(l => ({
        location: l.location,
        mRPerHr: l.mRPerHr,
        mRPerWeek: l.mRPerWeek,
        result: l.result,
        category: l.category,
      })),
    };

    setIsSaving(true);
    try {
      let res;
      if (testId) {
        res = await updateRadiationProtectionSurveyForFixedRadioFluro(testId, payload);
        toast.success("Updated successfully");
      } else {
        res = await addRadiationProtectionSurveyForFixedRadioFluro(serviceId, payload);
        const newId = res?.data?._id || res?.data?.data?._id;
        if (newId) setTestId(newId);
        toast.success("Saved successfully");
      }
      setIsSaved(true);
      setIsEditing(false);
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
    <div className="w-full max-w-7xl mx-auto p-6 space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Radiation Protection Survey Report
        </h1>
        <button
          onClick={isViewMode ? () => setIsEditing(true) : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition shadow-md ${isViewMode ? "bg-orange-600 hover:bg-orange-700" : "bg-teal-600 hover:bg-teal-700"}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isViewMode ? <Edit3 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {isViewMode ? "Edit" : testId ? "Update" : "Save"} Survey
            </>
          )}
        </button>
      </div>

      {/* 1. Survey Details */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-2xl font-bold text-white">1. Survey Details</h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Survey</label>
            <input type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)}
              disabled={isViewMode}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Calibration Certificate?</label>
            <select value={hasValidCalibration} onChange={e => setHasValidCalibration(e.target.value)}
              disabled={isViewMode}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Equipment Settings */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="px-8 py-5 bg-gradient-to-r from-teal-600 to-teal-700">
          <h2 className="text-2xl font-bold text-white">2. Equipment Settings Used</h2>
        </div>
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Applied Current (mA)</label>
            <input type="number" value={appliedCurrent} onChange={e => setAppliedCurrent(e.target.value)}
              disabled={isViewMode}
              className={`mt-1 w-full px-4 py-3 text-center border rounded-lg ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Applied Voltage (kV)</label>
            <input type="number" value={appliedVoltage} onChange={e => setAppliedVoltage(e.target.value)}
              disabled={isViewMode}
              className={`mt-1 w-full px-4 py-3 text-center border rounded-lg ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="80" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Exposure Time (s)</label>
            <input type="number" step="0.001" value={exposureTime} onChange={e => setExposureTime(e.target.value)}
              disabled={isViewMode}
              className={`mt-1 w-full px-4 py-3 text-center border rounded-lg ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="0.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Workload (mA min/week)</label>
            <input type="number" value={workload} onChange={e => setWorkload(e.target.value)}
              disabled={isViewMode}
              className={`mt-1 w-full px-4 py-3 text-center border rounded-lg ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="5000" />
          </div>
        </div>
      </section>

      {/* 3. Maximum Radiation Level Survey - With RowSpan */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 bg-gradient-to-r from-purple-600 to-purple-700">
          <h2 className="text-2xl font-bold text-white">3. Maximum Radiation Level Survey</h2>
        </div>
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-purple-900 uppercase tracking-wider">Max. Radiation Level (mR/hr)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-purple-900 uppercase tracking-wider">mR/week</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-purple-900 uppercase tracking-wider">Result</th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Worker Rows */}
                {workerLocations.map((row, index) => (
                  <tr key={row.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4">
                        <input
                        type="text"
                        value={row.location}
                        onChange={e => updateRow(row.id, "location", e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        step="0.001"
                        value={row.mRPerHr}
                        onChange={e => updateRow(row.id, "mRPerHr", e.target.value)}
                        disabled={isViewMode}
                        className={`w-28 px-3 py-2 text-center border border-gray-300 rounded-md ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="0.000"
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-800">
                      {row.mRPerWeek || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-5 py-2 rounded-full text-xs font-bold ${row.result === "PASS" ? "bg-green-100 text-green-800" :
                          row.result === "FAIL" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                        }`}>
                        {row.result || "—"}
                      </span>
                    </td>
                    {/* RowSpan for Worker */}
                    {index === 0 && (
                      <td rowSpan={workerLocations.length} className="text-center align-middle bg-blue-100 border-l-4 border-blue-600">
                        <div className="transform -rotate-90 whitespace-nowrap text-lg font-bold text-blue-900 tracking-wider">
                          FOR RADIATION WORKER
                        </div>
                      </td>
                    )}
                    {/* Delete button */}
                    {!isViewMode && (
                      <td className="px-3 py-4 text-center">
                        <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Public Rows */}
                {publicLocations.map((row, index) => (
                  <tr key={row.id} className="hover:bg-purple-50">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.location}
                        onChange={e => updateRow(row.id, "location", e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        step="0.001"
                        value={row.mRPerHr}
                        onChange={e => updateRow(row.id, "mRPerHr", e.target.value)}
                        disabled={isViewMode}
                        className={`w-28 px-3 py-2 text-center border border-gray-300 rounded-md ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="0.000"
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-800">
                      {row.mRPerWeek || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-5 py-2 rounded-full text-xs font-bold ${row.result === "PASS" ? "bg-green-100 text-green-800" :
                          row.result === "FAIL" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                        }`}>
                        {row.result || "—"}
                      </span>
                    </td>
                    {/* RowSpan for Public */}
                    {index === 0 && (
                      <td rowSpan={publicLocations.length} className="text-center align-middle bg-purple-100 border-l-4 border-purple-600">
                        <div className="transform -rotate-90 whitespace-nowrap text-lg font-bold text-purple-900 tracking-wider">
                          FOR PUBLIC
                        </div>
                      </td>
                    )}
                    {/* Delete button */}
                    {!isViewMode && (
                      <td className="px-3 py-4 text-center">
                        <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Buttons */}
          {!isViewMode && (
            <div className="flex justify-center gap-8 mt-8">
              <button onClick={() => addRow("worker")} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Add Worker Location
            </button>
            <button onClick={() => addRow("public")} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus className="w-5 h-5" /> Add Public Location
            </button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-blue-300 rounded-2xl p-8 text-center shadow-lg">
              <h3 className="text-xl font-bold text-blue-900">Maximum Radiation Level/week</h3>
              <p className="text-lg text-blue-700 mt-1">(For Radiation Worker)</p>
              <p className="text-5xl font-extrabold text-blue-800 mt-4">
                {maxWorkerWeekly} <span className="text-2xl font-normal">mR/week</span>
              </p>
              <p className="text-lg text-blue-700 mt-4 font-semibold">Limit: ≤ 40 mR/week</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-4 border-purple-300 rounded-2xl p-8 text-center shadow-lg">
              <h3 className="text-xl font-bold text-purple-900">Maximum Radiation Level/week</h3>
              <p className="text-lg text-purple-700 mt-1">(For Public)</p>
              <p className="text-5xl font-extrabold text-purple-800 mt-4">
                {maxPublicWeekly} <span className="text-2xl font-normal">mR/week</span>
              </p>
              <p className="text-lg text-purple-700 mt-4 font-semibold">Limit: ≤ 2 mR/week</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RadiationProtectionSurvey;