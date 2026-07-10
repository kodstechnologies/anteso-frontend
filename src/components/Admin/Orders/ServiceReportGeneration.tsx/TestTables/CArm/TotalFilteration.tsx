// src/components/TestTables/TotalFilterationForInventionalRadiology.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
    createTotalFilterationForCArm,
    getTotalFilterationForCArm,
    getTotalFilterationByServiceIdForCArm,
    updateTotalFilterationForCArm,
} from "../../../../../../api"; // Adjust path as needed

interface RowData {
    id: string;
    appliedKvp: string;
    measuredValues: string[];
    averageKvp: string;
    remarks: "PASS" | "FAIL" | "-";
}

interface TotalFilterationProps {
    serviceId: string;
    testId?: string | null;
    onTestSaved?: (testId: string) => void;
    refreshKey?: number;
    csvDataVersion?: number;
    initialData?: any;
}

const TotalFilteration: React.FC<TotalFilterationProps> = ({
    serviceId,
    testId: initialTestId = null,
    onTestSaved,
    refreshKey,
    csvDataVersion,
    initialData,
}) => {
    const [testId, setTestId] = useState<string | null>(initialTestId);
    const [isSaved, setIsSaved] = useState(!!initialTestId); // true = read-only, false = editing
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [mAStations, setMAStations] = useState<string[]>(["50 mA", "100 mA"]);
    const [rows, setRows] = useState<RowData[]>([
        { id: "1", appliedKvp: "60", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
        { id: "2", appliedKvp: "80", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
        { id: "3", appliedKvp: "100", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
        { id: "4", appliedKvp: "120", measuredValues: ["", ""], averageKvp: "", remarks: "-" },
    ]);

    const [toleranceSign, setToleranceSign] = useState<"+" | "-" | "±">("±");
    const [toleranceValue, setToleranceValue] = useState("2.0");
    const [totalFiltration, setTotalFiltration] = useState({ measured: "", required: "", atKvp: "" });
    const [filtrationTolerance, setFiltrationTolerance] = useState({
        forKvLessThan70: "1.5",
        forKvBetween70And100: "2.0",
        forKvGreaterThan100: "2.5",
        kvThreshold1: "70",
        kvThreshold2: "100",
    });

    const computeRowMetrics = (
        appliedKvp: string,
        measuredValues: string[],
        tolSign: "+" | "-" | "±",
        tolVal: string
    ): Pick<RowData, "averageKvp" | "remarks"> => {
        const nums = measuredValues.filter(v => v !== "" && !isNaN(Number(v))).map(Number);
        const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "";
        const applied = parseFloat(appliedKvp || "0");
        const avgNum = parseFloat(avg || "0");
        const tol = parseFloat(tolVal || "0");
        let remark: "PASS" | "FAIL" | "-" = "-";

        if (!isNaN(applied) && !isNaN(avgNum) && !isNaN(tol) && tol > 0) {
            const diff = Math.abs(avgNum - applied);
            remark = tolSign === "+"
                ? (avgNum <= applied + tol ? "PASS" : "FAIL")
                : tolSign === "-"
                    ? (avgNum >= applied - tol ? "PASS" : "FAIL")
                    : diff <= tol ? "PASS" : "FAIL";
        }

        return { averageKvp: avg, remarks: remark };
    };

    const applyImportedData = useCallback((data: any) => {
        if (!data) return;

        try {
            let sign: "+" | "-" | "±" = "±";
            let tolVal = "2.0";

            if (data.tolerance) {
                if (data.tolerance.sign) sign = data.tolerance.sign as "+" | "-" | "±";
                if (data.tolerance.value) tolVal = String(data.tolerance.value);
            }

            if (data.mAStations?.length > 0) {
                setMAStations(data.mAStations.map(String));
            }

            if (data.measurements?.length > 0) {
                const stationCount =
                    data.mAStations?.length ?? data.measurements[0]?.measuredValues?.length ?? 2;
                setRows(
                    data.measurements.map((m: any, i: number) => {
                        const measuredValues = [...(m.measuredValues ?? []).map(String)];
                        while (measuredValues.length < stationCount) measuredValues.push("");
                        const appliedKvp = String(m.appliedKvp ?? "");
                        return {
                            id: (i + 1).toString(),
                            appliedKvp,
                            measuredValues,
                            ...computeRowMetrics(appliedKvp, measuredValues, sign, tolVal),
                        };
                    })
                );
            }

            if (data.totalFiltration) {
                setTotalFiltration((prev) => ({
                    ...prev,
                    measured: String(data.totalFiltration.measured ?? prev.measured),
                    required: String(data.totalFiltration.required ?? prev.required),
                    atKvp: String(data.totalFiltration.atKvp ?? prev.atKvp),
                }));
            }

            setToleranceSign(sign);
            setToleranceValue(tolVal);
            setIsSaved(false);
            setIsLoading(false);
            toast.success("Total Filtration: Excel data loaded");
        } catch (err) {
            console.error("Error mapping CSV data for Total Filtration:", err);
        }
    }, []);

    // Apply Excel/CSV import (skip DB load while import is active)
    useEffect(() => {
        if (!initialData || !csvDataVersion) return;
        applyImportedData(initialData);
    }, [csvDataVersion, initialData, applyImportedData, refreshKey]);

    // Load test data on mount (by testId if available, otherwise by serviceId)
    useEffect(() => {
        const loadTestData = async () => {
            if (csvDataVersion) {
                setIsLoading(false);
                return;
            }
            if (!serviceId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                let data = null;

                if (initialTestId) {
                    data = await getTotalFilterationForCArm(initialTestId);
                } else {
                    data = await getTotalFilterationByServiceIdForCArm(serviceId);
                }

                if (csvDataVersion) return;

                if (data) {
                    setTestId(data._id || data.testId || null);
                    setMAStations(data.mAStations || ["50 mA", "100 mA"]);
                    setRows(
                        data.measurements?.map((m: any) => ({
                            id: Date.now().toString() + Math.random(),
                            appliedKvp: m.appliedKvp || "",
                            measuredValues: m.measuredValues || [],
                            averageKvp: m.averageKvp || "",
                            remarks: m.remarks || "-",
                        })) || rows
                    );
                    setToleranceSign(data.tolerance?.sign || "±");
                    setToleranceValue(data.tolerance?.value || "2.0");
                    setTotalFiltration({
                        measured: data.totalFiltration?.measured || "",
                        required: data.totalFiltration?.required || "",
                        atKvp: data.totalFiltration?.atKvp || "",
                    });
                    if (data.filtrationTolerance) {
                        setFiltrationTolerance({
                            forKvLessThan70: data.filtrationTolerance.forKvLessThan70 || "1.5",
                            forKvBetween70And100: data.filtrationTolerance.forKvBetween70And100 || "2.0",
                            forKvGreaterThan100: data.filtrationTolerance.forKvGreaterThan100 || "2.5",
                            kvThreshold1: data.filtrationTolerance.kvThreshold1 || "70",
                            kvThreshold2: data.filtrationTolerance.kvThreshold2 || "100",
                        });
                    }
                    setIsSaved(true); // Show "Edit" mode
                } else {
                    setIsSaved(false); // New test → allow editing
                }
            } catch (err: any) {
                console.error("Failed to load test:", err);
                setIsSaved(false); // On error, allow creating new
            } finally {
                setIsLoading(false);
            }
        };

        loadTestData();
    }, [initialTestId, serviceId, csvDataVersion]);

    // Save function (Create or Update)
    const saveTest = async () => {
        if (!serviceId) {
            toast.error("Service ID is missing");
            return;
        }

        const payload = {
            mAStations,
            measurements: rows.map(r => ({
                appliedKvp: r.appliedKvp,
                measuredValues: r.measuredValues,
                averageKvp: r.averageKvp,
                remarks: r.remarks,
            })),
            tolerance: { sign: toleranceSign, value: toleranceValue },
            totalFiltration,
            filtrationTolerance,
        };

        setIsSaving(true);
        try {
            let result;
            if (testId) {
                result = await updateTotalFilterationForCArm(testId, payload);
                toast.success("Updated successfully");
            } else {
                result = await createTotalFilterationForCArm(serviceId, payload);
                if (result.success && result.data?.testId) {
                    setTestId(result.data.testId);
                    onTestSaved?.(result.data.testId);
                }
                toast.success("Saved successfully");
            }

            setIsSaved(true); // Switch to read-only (show "Edit" button)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    // Enable editing mode
    const enableEditing = () => {
        setIsSaved(false);
        // toast.info("You are now editing. Click Save when done.");
    };

    // All your logic functions (with setIsSaved(false) removed from auto-trigger)
    const addMAColumn = () => {
        setMAStations(prev => [...prev, "200 mA"]);
        setRows(prev => prev.map(row => ({ ...row, measuredValues: [...row.measuredValues, ""] })));
    };

    const removeMAColumn = (index: number) => {
        if (mAStations.length <= 1) return;
        setMAStations(prev => prev.filter((_, i) => i !== index));
        setRows(prev => prev.map(row => ({
            ...row,
            measuredValues: row.measuredValues.filter((_, i) => i !== index),
        })));
    };

    const updateMAHeader = (index: number, value: string) => {
        setMAStations(prev => {
            const updated = [...prev];
            updated[index] = value || `mA ${index + 1}`;
            return updated;
        });
    };

    const addRow = () => {
        const newRow: RowData = {
            id: Date.now().toString(),
            appliedKvp: "",
            measuredValues: Array(mAStations.length).fill(""),
            averageKvp: "",
            remarks: "-",
        };
        setRows(prev => [...prev, newRow]);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const updateCell = (rowId: string, field: "appliedKvp" | number, value: string) => {
        setRows(prev => prev.map(row => {
            if (row.id !== rowId) return row;
            if (field === "appliedKvp") {
                const metrics = computeRowMetrics(value, row.measuredValues, toleranceSign, toleranceValue);
                return { ...row, appliedKvp: value, ...metrics };
            }

            const newMeasured = [...row.measuredValues];
            newMeasured[field] = value;
            const metrics = computeRowMetrics(row.appliedKvp, newMeasured, toleranceSign, toleranceValue);
            return { ...row, measuredValues: newMeasured, ...metrics };
        }));
    };

    const getFiltrationRemark = (): "PASS" | "FAIL" | "-" => {
        const kvp = parseFloat(totalFiltration.atKvp);
        const value = parseFloat(totalFiltration.required);
        const threshold1 = parseFloat(filtrationTolerance.kvThreshold1);
        const threshold2 = parseFloat(filtrationTolerance.kvThreshold2);
        if (isNaN(kvp) || isNaN(value)) return "-";

        let requiredTolerance: number;
        if (kvp < threshold1) {
            requiredTolerance = parseFloat(filtrationTolerance.forKvLessThan70);
        } else if (kvp >= threshold1 && kvp <= threshold2) {
            requiredTolerance = parseFloat(filtrationTolerance.forKvBetween70And100);
        } else {
            requiredTolerance = parseFloat(filtrationTolerance.forKvGreaterThan100);
        }
        if (isNaN(requiredTolerance)) return "-";
        return value >= requiredTolerance ? "PASS" : "FAIL";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full overflow-x-auto space-y-10">
            {/* Save / Edit Button */}
            <div className="flex justify-end">
                <button
                    onClick={isSaved ? enableEditing : saveTest}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${isSaved
                        ? "bg-gray-600 text-white hover:bg-gray-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : isSaved ? (
                        <>
                            <Edit3 className="w-5 h-5 " />
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

            {/* Disable all inputs when in saved (read-only) mode */}
            <div className={isSaved ? "pointer-events-none opacity-75" : ""}>
                {/* Your beautiful table & UI (unchanged) */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 bg-blue-50 border-b border-gray-300">
                        <h3 className="text-xl font-bold text-blue-900">
                            Accuracy of kVp at Different mA Stations
                        </h3>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-600 ercase tracking-wider border-r">
                                    Applied kVp
                                </th>
                                <th colSpan={mAStations.length} className="px-6 py-3 text-center text-xs font-medium text-gray-600  tracking-wider border-r">
                                    <div className="flex items-center justify-between">
                                        <span>Measured Values (kVp)</span>
                                        {!isSaved && (
                                            <button onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </th>
                                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600  tracking-wider border-r">
                                    Average kVp
                                </th>
                                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600  tracking-wider">
                                    Remarks
                                </th>
                                <th rowSpan={2} className="w-12" />
                            </tr>
                            <tr>
                                {mAStations.map((header, idx) => (
                                    <th key={idx} className="px-3 py-3 text-center text-xs font-medium text-gray-600  tracking-wider border-r">
                                        <div className="flex items-center justify-center gap-1">
                                            <input
                                                type="text"
                                                value={header}
                                                onChange={(e) => updateMAHeader(idx, e.target.value)}
                                                className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                disabled={isSaved}
                                            />
                                            {mAStations.length > 1 && !isSaved && (
                                                <button onClick={() => removeMAColumn(idx)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rows.map((row) => (
                                <tr key={row.id} className={`hover:bg-gray-50${row.remarks === "FAIL" ? " bg-red-50" : ""}`}>
                                    <td className="px-6 py-3 border-r">
                                        <input
                                            type="number"
                                            value={row.appliedKvp}
                                            onChange={(e) => updateCell(row.id, "appliedKvp", e.target.value)}
                                            className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500${row.remarks === "FAIL" ? " border-red-300 text-red-700" : " border-gray-300"}`}
                                            placeholder="80"
                                            disabled={isSaved}
                                        />
                                    </td>
                                    {row.measuredValues.map((val, idx) => (
                                        <td key={idx} className={`px-3 py-3 text-center border-r${row.remarks === "FAIL" ? " bg-red-50" : ""}`}>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={val}
                                                onChange={(e) => updateCell(row.id, idx, e.target.value)}
                                                className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500${row.remarks === "FAIL" ? " border-red-300 text-red-700" : " border-gray-300"}`}
                                                placeholder="0.0"
                                                disabled={isSaved}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-6 py-3 text-center font-bold text-gray-800 border-r">
                                        {row.averageKvp || "-"}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${row.remarks === "PASS" ? "bg-green-100 text-green-800" :
                                            row.remarks === "FAIL" ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-600"
                                            }`}>
                                            {row.remarks}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        {rows.length > 1 && !isSaved && (
                                            <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="px-6 py-4 bg-gray-50 border-t">
                        {!isSaved && (
                            <button onClick={addRow} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Plus className="w-5 h-5" /> Add Row
                            </button>
                        )}
                    </div>
                </div>

                {/* Tolerance */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
                    <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-indigo-800">Tolerance:</span>
                        <select
                            value={toleranceSign}
                            onChange={(e) => setToleranceSign(e.target.value as any)}
                            className="px-4 py-2 border border-indigo-400 rounded bg-white font-medium"
                            disabled={isSaved}
                        >
                            <option value="±">±</option>
                            <option value="+">Positive only (+)</option>
                            <option value="-">Negative only (-)</option>
                        </select>
                        <input
                            type="number"
                            step="0.1"
                            value={toleranceValue}
                            onChange={(e) => setToleranceValue(e.target.value)}
                            className="w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500"
                            disabled={isSaved}
                        />
                        <span className="font-medium text-indigo-800">kV</span>
                    </div>
                </div>

                {/* Total Filtration */}
                <div className={`bg-white shadow-lg rounded-lg border p-8 ${getFiltrationRemark() === "FAIL" && totalFiltration.required !== "" && !isNaN(parseFloat(totalFiltration.required)) ? "border-red-300 bg-red-50" : "border-gray-300"}`}>
                    <h3 className="text-xl font-bold text-green-800 mb-6">Total Filtration</h3>
                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            <span className="text-xl font-medium text-gray-700">Total Filtration is (at</span>
                            <input
                                type="number"
                                step="1"
                                value={totalFiltration.atKvp}
                                onChange={(e) => setTotalFiltration({ ...totalFiltration, atKvp: e.target.value })}
                                disabled={isSaved}
                                className={`w-24 px-3 py-2 text-lg font-bold text-center border-2 rounded-lg ${isSaved ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200"}`}
                                placeholder="80"
                            />
                            <span className="text-xl font-medium text-gray-700">kVp)</span>
                            <input
                                type="number"
                                step="0.01"
                                value={totalFiltration.required}
                                onChange={(e) => setTotalFiltration({ ...totalFiltration, required: e.target.value })}
                                disabled={isSaved}
                                className={`w-32 px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg ${isSaved
                                    ? "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                                    : getFiltrationRemark() === "FAIL" && totalFiltration.required !== "" && !isNaN(parseFloat(totalFiltration.required))
                                        ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-200"
                                        : "border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200"
                                    }`}
                                placeholder="2.50"
                            />
                            <span className="text-3xl font-bold text-gray-800">mm of Al</span>
                        </div>
                        <div className="flex items-center justify-center">
                            <span className={`text-5xl font-bold ${getFiltrationRemark() === "PASS" ? "text-green-600" : getFiltrationRemark() === "FAIL" ? "text-red-600" : "text-gray-400"}`}>
                                {getFiltrationRemark()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-6">
                    <p className="text-lg font-bold text-amber-900 mb-3">Tolerance for Total Filtration:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-amber-800">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold">For kV &lt; <input type="number" value={filtrationTolerance.kvThreshold1} onChange={e => setFiltrationTolerance(p => ({ ...p, kvThreshold1: e.target.value }))} disabled={isSaved} className="w-16 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white mx-1" /></label>
                            <div className="flex items-center gap-2">
                                <input type="number" step="0.1" value={filtrationTolerance.forKvLessThan70} onChange={e => setFiltrationTolerance(p => ({ ...p, forKvLessThan70: e.target.value }))} disabled={isSaved} className="w-20 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white" />
                                <span className="font-medium">mm Al</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold"><input type="number" value={filtrationTolerance.kvThreshold1} onChange={e => setFiltrationTolerance(p => ({ ...p, kvThreshold1: e.target.value }))} disabled={isSaved} className="w-16 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white mx-1" /> ≤ kV ≤ <input type="number" value={filtrationTolerance.kvThreshold2} onChange={e => setFiltrationTolerance(p => ({ ...p, kvThreshold2: e.target.value }))} disabled={isSaved} className="w-16 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white mx-1" /></label>
                            <div className="flex items-center gap-2">
                                <input type="number" step="0.1" value={filtrationTolerance.forKvBetween70And100} onChange={e => setFiltrationTolerance(p => ({ ...p, forKvBetween70And100: e.target.value }))} disabled={isSaved} className="w-20 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white" />
                                <span className="font-medium">mm Al</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold">For kV &gt; <input type="number" value={filtrationTolerance.kvThreshold2} onChange={e => setFiltrationTolerance(p => ({ ...p, kvThreshold2: e.target.value }))} disabled={isSaved} className="w-16 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white mx-1" /></label>
                            <div className="flex items-center gap-2">
                                <input type="number" step="0.1" value={filtrationTolerance.forKvGreaterThan100} onChange={e => setFiltrationTolerance(p => ({ ...p, forKvGreaterThan100: e.target.value }))} disabled={isSaved} className="w-20 px-2 py-1 border border-amber-400 rounded text-center font-bold bg-white" />
                                <span className="font-medium">mm Al</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TotalFilteration;