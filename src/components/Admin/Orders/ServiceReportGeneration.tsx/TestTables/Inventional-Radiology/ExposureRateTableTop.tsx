// src/components/TestTables/ExposureRateTableTop.tsx
import React, { useState, useEffect } from "react";
import { Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addExposureRateTableTop,
  getExposureRateTableTopByTestId,
  updateExposureRateTableTop,
} from "../../../../../../api";

interface Row {
  id: string;
  distance: string;
  appliedKv: string;
  appliedMa: string;
  exposure: string;
  remark: "AEC Mode" | "Manual Mode" | "";
}

interface ExposureRateTableTopProps {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const ExposureRateTableTop: React.FC<ExposureRateTableTopProps> = ({
  serviceId,
  testId: initialTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(initialTestId);
  const [isSaved, setIsSaved] = useState(!!initialTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Only show loader when actually loading

  const [rows, setRows] = useState<Row[]>([
    { id: "1", distance: "100", appliedKv: "80", appliedMa: "100", exposure: "", remark: "" },
  ]);

  const [aecTolerance, setAecTolerance] = useState("10");
  const [nonAecTolerance, setNonAecTolerance] = useState("5");
  const [minFocusDistance, setMinFocusDistance] = useState("30");

  // Only load data if testId exists
  useEffect(() => {
    console.log("inside useEffect--------")
    console.log("🚀 ~ ExposureRateTableTop ~ initialTestId:", initialTestId)
    if (!initialTestId) {
      setIsLoading(false);
      return;
    }

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getExposureRateTableTopByTestId(initialTestId);
        if (data && data.rows) {
          setRows(
            data.rows.map((r: any, i: number) => ({
              id: Date.now().toString() + i,
              distance: r.distance || "",
              appliedKv: r.appliedKv || "",
              appliedMa: r.appliedMa || "",
              exposure: r.exposure || "",
              remark: r.remark || "",
            }))
          );
          setAecTolerance(data.aecTolerance || "10");
          setNonAecTolerance(data.nonAecTolerance || "5");
          setMinFocusDistance(data.minFocusDistance || "30");
          setIsSaved(true);
          setIsEditing(false);
        }
      } catch (err) {
        toast.error("Failed to load test data");
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [initialTestId]);

  // Auto-calculate remark — Fixed dependency
  useEffect(() => {
    setRows((prev) =>
      prev.map((row) => {
        const exposure = parseFloat(row.exposure);
        if (isNaN(exposure)) return { ...row, remark: "" };

        const aecLimit = parseFloat(aecTolerance);
        const nonAecLimit = parseFloat(nonAecTolerance);

        if (!isNaN(aecLimit) && exposure <= aecLimit) {
          return { ...row, remark: "AEC Mode" };
        } else if (!isNaN(nonAecLimit) && exposure <= nonAecLimit) {
          return { ...row, remark: "Manual Mode" };
        } else {
          return { ...row, remark: "Manual Mode" };
        }
      })
    );
  }, [rows.map((r) => r.exposure).join(","), aecTolerance, nonAecTolerance]);

  // Save function
  const saveTest = async () => {
    if (!serviceId) {
      toast.error("Service ID missing");
      return;
    }

    const payload = {
      rows: rows.map((r) => ({
        distance: r.distance,
        appliedKv: r.appliedKv,
        appliedMa: r.appliedMa,
        exposure: r.exposure,
        remark: r.remark,
      })),
      aecTolerance,
      nonAecTolerance,
      minFocusDistance,
    };

    setIsSaving(true);
    try {
      let result;
      if (testId) {
        result = await updateExposureRateTableTop(testId, payload);
        toast.success("Updated successfully");
      } else {
        result = await addExposureRateTableTop(serviceId, payload);
        if (result.success && result.data?.testId) {
          setTestId(result.data.testId);
          onTestSaved?.(result.data.testId);
          toast.success("Saved successfully");
        }
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when editing (only after first save)
  useEffect(() => {
    if (isEditing && testId && isSaved) {
      const timer = setTimeout(saveTest, 1200);
      return () => clearTimeout(timer);
    }
  }, [rows, aecTolerance, nonAecTolerance, minFocusDistance, isEditing, testId, isSaved]);

  const startEditing = () => setIsEditing(true);

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof Row, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const isEditable = isEditing || !isSaved;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      {/* Edit / Save Button */}
      <div className="flex justify-end">
        <button
          onClick={isSaved && !isEditing ? startEditing : saveTest}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition shadow-md ${isSaved && !isEditing
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : isSaved && !isEditing ? (
            <>
              <Edit3 className="w-5 h-5" />
              Edit
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Test
            </>
          )}
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800">Exposure Rate at Table Top</h2>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">
                Distance from Focus to Tabletop (cm)
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">
                Applied kV
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">
                Applied mA
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">
                Exposure at Table Top
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                Remark
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 border-r">
                  <input
                    type="number"
                    value={row.distance}
                    onChange={(e) => updateRow(row.id, "distance", e.target.value)}
                    disabled={!isEditable}
                    className={`w-full px-3 py-2 text-center border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${isEditable ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
                    placeholder="100"
                  />
                </td>
                <td className="px-4 py-3 border-r">
                  <input
                    type="number"
                    value={row.appliedKv}
                    onChange={(e) => updateRow(row.id, "appliedKv", e.target.value)}
                    disabled={!isEditable}
                    className={`w-full px-3 py-2 text-center border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${isEditable ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
                    placeholder="80"
                  />
                </td>
                <td className="px-4 py-3 border-r">
                  <input
                    type="number"
                    value={row.appliedMa}
                    onChange={(e) => updateRow(row.id, "appliedMa", e.target.value)}
                    disabled={!isEditable}
                    className={`w-full px-3 py-2 text-center border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${isEditable ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
                    placeholder="100"
                  />
                </td>
                <td className="px-4 py-3 border-r">
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.exposure}
                      onChange={(e) => updateRow(row.id, "exposure", e.target.value)}
                      disabled={!isEditable}
                      className={`w-32 px-3 py-2 text-center border rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 ${isEditable ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-50 cursor-not-allowed"
                        }`}
                      placeholder="4.2"
                    />
                    <span className="text-sm font-bold text-gray-700">cGy/Min</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`inline-flex px-5 py-2 rounded-full text-sm font-bold ${row.remark === "AEC Mode"
                        ? "bg-green-100 text-green-800"
                        : row.remark === "Manual Mode"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {row.remark || "-"}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={!isEditable}
                      className={`p-2 rounded-lg transition ${isEditable ? "text-red-600 hover:bg-red-100" : "text-red-300 cursor-not-allowed"
                        }`}
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

      {/* Acceptance Criteria */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-8 shadow-md">
        <h3 className="text-xl font-bold text-indigo-900 mb-6">Acceptance Criteria</h3>
        <div className="space-y-5 text-indigo-800 font-medium">
          <div className="flex items-center gap-4">
            <span>1. Exposure rate without AEC mode ≤</span>
            <input
              type="number"
              step="0.1"
              value={nonAecTolerance}
              onChange={(e) => setNonAecTolerance(e.target.value)}
              disabled={!isEditable}
              className={`w-24 px-3 py-2 text-center border-2 rounded-lg font-bold focus:ring-4 ${isEditable
                  ? "border-indigo-400 text-indigo-900 bg-white focus:ring-indigo-300"
                  : "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                }`}
            />
            <span>cGy/Min</span>
          </div>
          <div className="flex items-center gap-4">
            <span>2. Exposure rate with AEC mode ≤</span>
            <input
              type="number"
              step="0.1"
              value={aecTolerance}
              onChange={(e) => setAecTolerance(e.target.value)}
              disabled={!isEditable}
              className={`w-24 px-3 py-2 text-center border-2 rounded-lg font-bold focus:ring-4 ${isEditable
                  ? "border-indigo-400 text-indigo-900 bg-white focus:ring-indigo-300"
                  : "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                }`}
            />
            <span>cGy/Min</span>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-indigo-300">
            <span>Minimum focus to tabletop distance shall be</span>
            <input
              type="number"
              step="1"
              value={minFocusDistance}
              onChange={(e) => setMinFocusDistance(e.target.value)}
              disabled={!isEditable}
              className={`w-20 px-3 py-2 text-center border-2 rounded-lg font-bold focus:ring-4 ${isEditable
                  ? "border-purple-400 text-purple-900 bg-white focus:ring-purple-300"
                  : "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                }`}
            />
            <span className="font-bold text-purple-800">cm for fluoroscopy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExposureRateTableTop;