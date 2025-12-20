// src/components/TestTables/AccuracyOfIrradiationTime.tsx
import React, { useState, useEffect } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Edit3, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addAccuracyOfIrradiationTimeForOPG,
  getAccuracyOfIrradiationTimeByServiceIdForOPG,
  updateAccuracyOfIrradiationTimeForOPG,
} from "../../../../../../api";

interface AccuracyOfIrradiationTimeProps {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

interface Table1Row {
  id: string;
  fcd: string;
  kv: string;
  ma: string;
}

interface Table2Row {
  id: string;
  setTime: string;
  measuredTime: string;
}

const AccuracyOfIrradiationTime: React.FC<AccuracyOfIrradiationTimeProps> = ({
  serviceId,
  testId: initialTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(initialTestId);
  const [loading, setLoading] = useState(!!initialTestId);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(!!initialTestId);
  const [isEditing, setIsEditing] = useState(false);
  
  const isViewMode = isSaved && !isEditing;

  // Test Conditions (Single Row)
  const [table1Row, setTable1Row] = useState<Table1Row>({
    id: "1",
    fcd: "",
    kv: "",
    ma: "",
  });

  // Irradiation Time Rows
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: "1", setTime: "", measuredTime: "" },
  ]);

  // Tolerance
  const [toleranceOperator, setToleranceOperator] = useState("<=");
  const [toleranceValue, setToleranceValue] = useState("10");

  const updateTable1 = (field: keyof Table1Row, value: string) => {
    setTable1Row((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), setTime: "", measuredTime: "" },
    ]);
    setIsSaved(false);
  };

  const deleteTable2Row = (id: string) => {
    if (table2Rows.length > 1) {
      setTable2Rows((prev) => prev.filter((r) => r.id !== id));
      setIsSaved(false);
    }
  };

  const updateTable2 = (id: string, field: keyof Table2Row, value: string) => {
    setTable2Rows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setIsSaved(false);
  };

  // Calculations
  const calcError = (set: string, meas: string): string => {
    const s = parseFloat(set);
    const m = parseFloat(meas);
    if (isNaN(s) || isNaN(m) || s === 0) return "-";
    return Math.abs((m - s) / s * 100).toFixed(2);
  };

  const getRemark = (errorPct: string): "PASS" | "FAIL" | "-" => {
    if (!toleranceValue || errorPct === "-") return "-";
    const err = parseFloat(errorPct);
    const tol = parseFloat(toleranceValue);
    if (isNaN(err) || isNaN(tol)) return "-";

    switch (toleranceOperator) {
      case ">":  return err > tol ? "FAIL" : "PASS";
      case "<":  return err < tol ? "PASS" : "FAIL";
      case ">=": return err >= tol ? "FAIL" : "PASS";
      case "<=": return err <= tol ? "PASS" : "FAIL";
      default:   return "-";
    }
  };

  // Load saved data
  useEffect(() => {
    const fetchData = async () => {
      if (!serviceId) return;
      setLoading(true);
      try {
        const res = await getAccuracyOfIrradiationTimeByServiceIdForOPG(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setTable1Row(data.testConditions || { id: "1", fcd: "", kv: "", ma: "" });
          setTable2Rows(
            data.irradiationTimes && data.irradiationTimes.length > 0
              ? data.irradiationTimes.map((t: any, i: number) => ({
                  id: String(i + 1),
                  setTime: t.setTime || "",
                  measuredTime: t.measuredTime || "",
                }))
              : [{ id: "1", setTime: "", measuredTime: "" }]
          );
          setToleranceOperator(data.tolerance?.operator || "");
          setToleranceValue(data.tolerance?.value || "10");
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err) {
        console.log("No saved data or failed to load:", err);
        setIsSaved(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceId]);

  // Save / Update
  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }

    const payload = {
      testConditions: {
        fcd: table1Row.fcd,
        kv: table1Row.kv,
        ma: table1Row.ma,
      },
      irradiationTimes: table2Rows.map((r) => ({
        setTime: r.setTime,
        measuredTime: r.measuredTime,
      })),
      tolerance: {
        operator: toleranceOperator,
        value: toleranceValue,
      },
    };

    setSaving(true);
    try {
      let result;
      if (testId) {
        result = await updateAccuracyOfIrradiationTimeForOPG(testId, payload);
        toast.success("Updated successfully!");
      } else {
        result = await addAccuracyOfIrradiationTimeForOPG(serviceId, payload);
        const newTestId = result?.data?.testId || result?.data?._id;
        if (newTestId) {
          setTestId(newTestId);
          onTestSaved?.(newTestId);
        }
        toast.success("Saved successfully!");
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Edit/Save Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Accuracy of Irradiation Time</h2>
        <button
          onClick={isViewMode ? startEditing : handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isViewMode ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isViewMode ? 'Edit' : testId ? 'Update' : 'Save'} Test
            </>
          )}
        </button>
      </div>

      {/* Test Conditions */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            1. Test Conditions
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">FCD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">kV</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">mA</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <input 
                  type="text" 
                  value={table1Row.fcd} 
                  onChange={(e) => updateTable1("fcd", e.target.value)} 
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="100" 
                />
              </td>
              <td className="px-4 py-3">
                <input 
                  type="text" 
                  value={table1Row.kv} 
                  onChange={(e) => updateTable1("kv", e.target.value)} 
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="80" 
                />
              </td>
              <td className="px-4 py-3">
                <input 
                  type="text" 
                  value={table1Row.ma} 
                  onChange={(e) => updateTable1("ma", e.target.value)} 
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="100" 
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Accuracy Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            2. Accuracy of Irradiation Time
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Set Time (mSec)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Measured Time (mSec)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">% Error</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table2Rows.map((row) => {
              const error = calcError(row.setTime, row.measuredTime);
              const remark = getRemark(error);
              const isFail = remark === "FAIL" && row.measuredTime && row.measuredTime.trim() !== "";
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      step="0.1" 
                      value={row.setTime} 
                      onChange={(e) => updateTable2(row.id, "setTime", e.target.value)} 
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`px-4 py-3 ${isFail ? 'bg-red-100' : ''}`}>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={row.measuredTime} 
                      onChange={(e) => updateTable2(row.id, "measuredTime", e.target.value)} 
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 text-center border ${isFail ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded text-sm ${isViewMode ? (isFail ? 'bg-red-50 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-500 cursor-not-allowed') : ''}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{error}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${remark === "PASS" ? "bg-green-100 text-green-800" : remark === "FAIL" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>
                      {remark || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {table2Rows.length > 1 && !isViewMode && (
                      <button onClick={() => deleteTable2Row(row.id)} className="text-red-600 hover:text-red-800">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isViewMode && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-300 flex justify-start">
            <button onClick={addTable2Row} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <PlusIcon className="h-4 w-4" /> Add Row
            </button>
          </div>
        )}
      </div>

      {/* Tolerance */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
        <h4 className="text-sm font-semibold text-indigo-900 mb-2">Tolerance Setting</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-indigo-800">Error should be</span>
          <select 
            value={toleranceOperator} 
            onChange={(e) => setToleranceOperator(e.target.value)} 
            disabled={isViewMode}
            className={`px-3 py-1 border border-indigo-300 rounded text-indigo-900 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          >
            <option value=">">greater than</option>
            <option value="<">less than</option>
            <option value=">=">greater than or equal to</option>
            <option value="<=">less than or equal to</option>
          </select>
          <input 
            type="number" 
            step="0.1" 
            value={toleranceValue} 
            onChange={(e) => { setToleranceValue(e.target.value); setIsSaved(false); }} 
            disabled={isViewMode}
            className={`w-20 px-2 py-1 text-center border border-indigo-300 rounded ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            placeholder="10.0" 
          />
          <span className="font-medium text-indigo-800">%</span>
        </div>
      </div>


      {/* Formula Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Formula:</p>
        <p className="font-mono text-xs">% Error = |(Measured − Set) / Set| × 100</p>
      </div>
    </div>
  );
};

export default AccuracyOfIrradiationTime;