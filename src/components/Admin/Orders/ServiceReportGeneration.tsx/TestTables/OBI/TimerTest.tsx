// src/components/TestTables/AccuracyOfIrradiationTime.tsx
import React, { useState, useEffect } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Edit3, Save } from "lucide-react";
import toast from "react-hot-toast";
import {
    addTimerTestForOBI,
    getTimerTestByServiceIdForOBI,
    updateTimerTestForOBI,
} from "../../../../../../api";

interface AccuracyOfIrradiationTimeProps {
    serviceId: string;
    refreshKey?: number;
    initialData?: {
        testConditions?: {
            fcd: string;
            kv: string;
            ma: string;
        };
        irradiationTimes?: Array<{
            setTime: string;
            measuredTime: string;
        }>;
        tolerance?: {
            operator: string;
            value: string;
        };
    };
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
    refreshKey,
    initialData,
}) => {
    const [testId, setTestId] = useState<string | null>(null); // Mongo _id (optional, not strictly needed)
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
            case ">": return err > tol ? "FAIL" : "PASS";
            case "<": return err < tol ? "PASS" : "FAIL";
            case ">=": return err >= tol ? "FAIL" : "PASS";
            case "<=": return err <= tol ? "PASS" : "FAIL";
            default: return "-";
        }
    };

    // Load CSV Initial Data (separate useEffect)
    useEffect(() => {
        if (initialData) {
            console.log('AccuracyOfIrradiationTime OBI: Loading initial data from CSV:', initialData);
            console.log('AccuracyOfIrradiationTime OBI: initialData.testConditions:', initialData.testConditions);
            console.log('AccuracyOfIrradiationTime OBI: initialData.irradiationTimes:', initialData.irradiationTimes);
            console.log('AccuracyOfIrradiationTime OBI: initialData.irradiationTimes.length:', initialData.irradiationTimes?.length);
            
            setLoading(true);
            
            if (initialData.testConditions) {
                console.log('Setting testConditions:', initialData.testConditions);
                setTable1Row({
                    id: "1",
                    fcd: initialData.testConditions.fcd || "",
                    kv: initialData.testConditions.kv || "",
                    ma: initialData.testConditions.ma || "",
                });
            }
            
            if (initialData.irradiationTimes && initialData.irradiationTimes.length > 0) {
                console.log('Setting irradiationTimes, count:', initialData.irradiationTimes.length);
                const newRows = initialData.irradiationTimes.map((t, index) => {
                    console.log(`Row ${index}: setTime=${t.setTime}, measuredTime=${t.measuredTime}`);
                    return {
                        id: `csv-row-${Date.now()}-${index}`,
                        setTime: t.setTime || "",
                        measuredTime: t.measuredTime || "",
                    };
                });
                setTable2Rows(newRows);
            } else {
                console.warn('No irradiationTimes found in initialData');
            }
            
            if (initialData.tolerance) {
                console.log('Setting tolerance:', initialData.tolerance);
                setToleranceOperator(initialData.tolerance.operator || "<=");
                setToleranceValue(initialData.tolerance.value || "10");
            }
            
            setIsSaved(false);
            setLoading(false);
            console.log('AccuracyOfIrradiationTime OBI: CSV data loaded into form');
        }
    }, [initialData]);

    // Load saved data
    useEffect(() => {
        const fetchData = async () => {
            if (!serviceId) return;
            
            // Skip loading if we have initial CSV data
            if (initialData) {
                return;
            }
            
            setLoading(true);
            try {
                const res = await getTimerTestByServiceIdForOBI(serviceId);
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
                    setToleranceOperator(data.tolerance?.operator || "<=");
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
                setIsEditing(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [serviceId, refreshKey, initialData]);

    // Save / Update
    const handleSave = async () => {
        if (!serviceId) return;

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
            let res;
            if (testId) {
                res = await updateTimerTestForOBI(testId, payload);
            } else {
                res = await addTimerTestForOBI(serviceId, payload);
            }
            if (res?.data?._id) setTestId(res.data._id);
            setIsSaved(true);
            setIsEditing(false);
            toast.success(testId ? "Updated successfully!" : "Saved successfully!");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to save");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const isViewMode = isSaved && !isEditing;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-blue-600">Loading saved data...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">

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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700  tracking-wider">FFD (cm)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700  tracking-wider">kV</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700  tracking-wider">mA</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <input type="text" value={table1Row.fcd} onChange={(e) => updateTable1("fcd", e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} placeholder="100" />
                            </td>
                            <td className="px-4 py-3">
                                <input type="text" value={table1Row.kv} onChange={(e) => updateTable1("kv", e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} placeholder="80" />
                            </td>
                            <td className="px-4 py-3">
                                <input type="text" value={table1Row.ma} onChange={(e) => updateTable1("ma", e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} placeholder="100" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Accuracy Table */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
                    <h3 className="text-sm font-semibold text-blue-900  tracking-wider">
                        2. Accuracy of Irradiation Time
                    </h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700  tracking-wider">Set Time (mSec)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700  tracking-wider">Measured Time (mSec)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700  tracking-wider">% Error</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700  tracking-wider">Remarks</th>
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
                                    <td className="px-4 py-3"><input type="number" step="0.1" value={row.setTime} onChange={(e) => updateTable2(row.id, "setTime", e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} /></td>
                                    <td className={`px-4 py-3 ${isFail ? 'bg-red-100' : ''}`}><input type="number" step="0.1" value={row.measuredTime} onChange={(e) => updateTable2(row.id, "measuredTime", e.target.value)} disabled={isViewMode} className={`w-full px-2 py-1 text-center border ${isFail ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded text-sm ${isViewMode ? (isFail ? 'bg-red-50 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-500 cursor-not-allowed') : ''}`} /></td>
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
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-300 flex justify-start">
                    {!isViewMode && (
                        <button onClick={addTable2Row} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            <PlusIcon className="h-4 w-4" /> Add Row
                        </button>
                    )}
                </div>
            </div>

            {/* Tolerance */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-900 mb-2">Tolerance Setting</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-indigo-800">Error should be</span>
                    <select value={toleranceOperator} onChange={(e) => { setToleranceOperator(e.target.value); setIsSaved(false); }} disabled={isViewMode} className={`px-3 py-1 border border-indigo-300 rounded bg-white text-indigo-900 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}>
                        <option value=">">greater than</option>
                        <option value="<">less than</option>
                        <option value=">=">greater than or equal to</option>
                        <option value="<=">less than or equal to</option>
                    </select>
                    <input type="number" step="0.1" value={toleranceValue} onChange={(e) => { setToleranceValue(e.target.value); setIsSaved(false); }} disabled={isViewMode} className={`w-20 px-2 py-1 text-center border border-indigo-300 rounded bg-white ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} placeholder="10.0" />
                    <span className="font-medium text-indigo-800">%</span>
                </div>
            </div>

            {/* Save/Edit Button */}
            <div className="flex justify-end gap-3">
                {isViewMode ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium bg-orange-600 hover:bg-orange-700"
                    >
                        <Edit3 className="w-4 h-4" />
                        Edit Test Data
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium ${saving ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : testId ? "Update Test Data" : "Save Test Data"}
                    </button>
                )}
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