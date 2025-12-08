// src/components/TestTables/ExposureRateTableTopForOArm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Save, Edit3, Loader2, Plus, ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  createExposureRateForOArm,
  getExposureRateForOArm,
  getExposureRateByServiceIdForOArm,
  updateExposureRateForOArm,
} from "../../../../../../api";

interface Row {
  id: string;
  distance: string;
  appliedKv: string;
  appliedMa: string;
  exposure: string;
  remark: "AEC Mode" | "Manual Mode" | "";
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const ExposureRateTableTopForOArm: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [rows, setRows] = useState<Row[]>([
    { id: "1", distance: "100", appliedKv: "80", appliedMa: "100", exposure: "", remark: "" },
  ]);

  const [aecTolerance, setAecTolerance] = useState("10");
  const [nonAecTolerance, setNonAecTolerance] = useState("5");
  const [minFocusDistance, setMinFocusDistance] = useState("30");

  // Compute PASS/FAIL for each row
  const rowsWithResult = useMemo(() => {
    return rows.map(row => {
      const exposure = parseFloat(row.exposure);
      const aecLimit = parseFloat(aecTolerance) || 0;
      const manualLimit = parseFloat(nonAecTolerance) || 0;

      if (isNaN(exposure) || !row.remark) {
        return { ...row, result: "" };
      }

      const isPass =
        (row.remark === "AEC Mode" && exposure <= aecLimit) ||
        (row.remark === "Manual Mode" && exposure <= manualLimit);

      return { ...row, result: isPass ? "PASS" : "FAIL" };
    });
  }, [rows, aecTolerance, nonAecTolerance]);

  // Load existing test
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;
        if (propTestId) {
          data = await getExposureRateForOArm(propTestId);
        } else {
          data = await getExposureRateByServiceIdForOArm(serviceId);
        }

        if (data) {
          setTestId(data._id);
          setRows(
            data.rows?.map((r: any, i: number) => ({
              id: Date.now().toString() + i,
              distance: r.distance || "",
              appliedKv: r.appliedKv || "",
              appliedMa: r.appliedMa || "",
              exposure: r.exposure || "",
              remark: r.remark || "",
            })) || []
          );
          setAecTolerance(data.aecTolerance || "10");
          setNonAecTolerance(data.nonAecTolerance || "5");
          setMinFocusDistance(data.minFocusDistance || "30");
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Load failed:", err);
        setIsSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadTest();
  }, [propTestId, serviceId]);

  // Save handler
  const handleSave = async () => {
    if (rows.some(r => !r.exposure.trim() || !r.remark)) {
      toast.error("Please fill exposure and select mode for all rows");
      return;
    }

    const payload = {
      rows: rows.map(r => ({
        distance: r.distance.trim(),
        appliedKv: r.appliedKv.trim(),
        appliedMa: r.appliedMa.trim(),
        exposure: r.exposure.trim(),
        remark: r.remark,
      })),
      aecTolerance: aecTolerance.trim(),
      nonAecTolerance: nonAecTolerance.trim(),
      minFocusDistance: minFocusDistance.trim(),
    };

    setIsSaving(true);
    try {
      if (testId) {
        await updateExposureRateForOArm(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createExposureRateForOArm(serviceId, payload);
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

  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now().toString(),
      distance: "100",
      appliedKv: "80",
      appliedMa: "100",
      exposure: "",
      remark: "",
    }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof Row, value: string) => {
    setRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

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
        <h2 className="text-2xl font-bold text-gray-800">Exposure Rate at Table Top</h2>
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

      {/* Dynamic Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">Distance (cm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">Applied kV</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">Applied mA</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">Exposure (cGy/Min)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">Mode</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Result</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rowsWithResult.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r">
                    <input
                      type="text"
                      value={row.distance}
                      onChange={(e) => updateRow(row.id, "distance", e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 text-center border rounded-md text-sm ${isViewOnly ? "bg-gray-50" : ""}`}
                    />
                  </td>
                  <td className="px-4 py-3 border-r">
                    <input
                      type="text"
                      value={row.appliedKv}
                      onChange={(e) => updateRow(row.id, "appliedKv", e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 text-center border rounded-md text-sm ${isViewOnly ? "bg-gray-50" : ""}`}
                    />
                  </td>
                  <td className="px-4 py-3 border-r">
                    <input
                      type="text"
                      value={row.appliedMa}
                      onChange={(e) => updateRow(row.id, "appliedMa", e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-3 py-2 text-center border rounded-md text-sm ${isViewOnly ? "bg-gray-50" : ""}`}
                    />
                  </td>
                  <td className="px-4 py-3 border-r">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.exposure}
                        onChange={(e) => updateRow(row.id, "exposure", e.target.value)}
                        disabled={isViewOnly}
                        className={`w-32 px-3 py-2 text-center border rounded-md text-sm font-medium ${isViewOnly ? "bg-gray-50" : ""}`}
                      />
                      <span className="text-sm font-bold text-gray-700">cGy/Min</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={row.remark}
                      onChange={(e) => updateRow(row.id, "remark", e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full px-4 py-2 text-center rounded-lg font-medium text-sm appearance-none ${row.remark === "AEC Mode" ? "bg-green-100 text-green-800"
                          : row.remark === "Manual Mode" ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        } ${isViewOnly ? "opacity-80" : "cursor-pointer"}`}
                    >
                      <option value="">Select</option>
                      <option value="AEC Mode">AEC Mode</option>
                      <option value="Manual Mode">Manual Mode</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {row.result ? (
                      <div className="flex items-center justify-center">
                        {row.result === "PASS" ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                            PASS
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full font-bold">
                            <XCircle className="w-5 h-5" />
                            FAIL
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {rows.length > 1 && !isViewOnly && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isViewOnly && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        )}
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-8 shadow-md">
        <h3 className="text-xl font-bold text-indigo-900 mb-6">Acceptance Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-indigo-800 font-medium">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold">Max Exposure (Manual Mode)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                value={nonAecTolerance}
                onChange={(e) => setNonAecTolerance(e.target.value)}
                disabled={isViewOnly}
                className={`w-32 px-4 py-3 text-center border-2 rounded-lg font-bold text-2xl ${isViewOnly
                    ? "border-gray-300 bg-gray-100 text-gray-500"
                    : "border-indigo-400 text-indigo-900 bg-white"
                  }`}
              />
              <span className="text-lg">cGy/Min</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold">Max Exposure (AEC Mode)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                value={aecTolerance}
                onChange={(e) => setAecTolerance(e.target.value)}
                disabled={isViewOnly}
                className={`w-32 px-4 py-3 text-center border-2 rounded-lg font-bold text-2xl ${isViewOnly
                    ? "border-gray-300 bg-gray-100 text-gray-500"
                    : "border-indigo-400 text-indigo-900 bg-white"
                  }`}
              />
              <span className="text-lg">cGy/Min</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold">Min. Focus to Tabletop Distance</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="1"
                value={minFocusDistance}
                onChange={(e) => setMinFocusDistance(e.target.value)}
                disabled={isViewOnly}
                className={`w-28 px-4 py-3 text-center border-2 rounded-lg font-bold text-2xl ${isViewOnly
                    ? "border-gray-300 bg-gray-100 text-gray-500"
                    : "border-purple-400 text-purple-900 bg-white"
                  }`}
              />
              <span className="text-lg font-bold text-purple-800">cm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExposureRateTableTopForOArm;
