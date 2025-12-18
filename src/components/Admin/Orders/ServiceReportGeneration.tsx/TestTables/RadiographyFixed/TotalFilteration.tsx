// src/components/TestTables/TotalFilterationForInventionalRadiology.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
    addTotalFiltrationForRadiographyFixed,
    getTotalFiltrationByTestIdForRadiographyFixed,
    getTotalFiltrationByServiceIdForRadiographyFixed,
    updateTotalFiltrationForRadiographyFixed,
} from "../../../../../../api"; 
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
}

const TotalFilteration: React.FC<TotalFilterationProps> = ({
    serviceId,
    testId: initialTestId = null,
    onTestSaved,
}) => {
    const [testId, setTestId] = useState<string | null>(initialTestId);
    const [isSaved, setIsSaved] = useState(!!initialTestId);
    const [isLoading, setIsLoading] = useState(!!initialTestId);
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
    const [totalFiltration, setTotalFiltration] = useState({ 
        measured: "", 
        required: "",
        atKvp: "" 
    });
    const [filtrationTolerance, setFiltrationTolerance] = useState({
        forKvGreaterThan70: "1.5",
        forKvBetween70And100: "2.0",
        forKvGreaterThan100: "2.5",
        kvThreshold1: "70",  // Threshold for "kV > 70" and lower bound for "70 ≤ kV ≤ 100"
        kvThreshold2: "100"  // Upper bound for "70 ≤ kV ≤ 100" and threshold for "kV > 100"
    });

    // Load existing test data
    useEffect(() => {
            const loadTest = async () => {
            if (!serviceId) {
                setIsLoading(false);
                return;
            }

                setIsLoading(true);
                try {
                let data = null;
                
                // Try loading by testId first if available
                if (initialTestId) {
                    const result = await getTotalFiltrationByTestIdForRadiographyFixed(initialTestId);
                    if (result?.data) {
                        data = result.data;
                    }
                } else {
                    // Try loading by serviceId
                    const result = await getTotalFiltrationByServiceIdForRadiographyFixed(serviceId);
                    if (result?.data) {
                        data = result.data;
                    }
                }

                    if (data) {
                    setTestId(data._id || null);
                        setMAStations(data.mAStations || ["50 mA", "100 mA"]);
                    if (data.measurements && data.measurements.length > 0) {
                        setRows(
                            data.measurements.map((m: any) => ({
                                id: Date.now().toString() + Math.random(),
                                appliedKvp: m.appliedKvp || "",
                                measuredValues: m.measuredValues || [],
                                averageKvp: m.averageKvp || "",
                                remarks: m.remarks || "-",
                            }))
                        );
                    }
                        setToleranceSign(data.tolerance?.sign || "±");
                        setToleranceValue(data.tolerance?.value || "2.0");
                        setTotalFiltration({
                            measured: data.totalFiltration?.measured || "",
                            required: data.totalFiltration?.required || "",
                            atKvp: data.totalFiltration?.atKvp || "",
                        });
                        setFiltrationTolerance({
                            forKvGreaterThan70: data.filtrationTolerance?.forKvGreaterThan70 || "1.5",
                            forKvBetween70And100: data.filtrationTolerance?.forKvBetween70And100 || "2.0",
                            forKvGreaterThan100: data.filtrationTolerance?.forKvGreaterThan100 || "2.5",
                            kvThreshold1: data.filtrationTolerance?.kvThreshold1 || "70",
                            kvThreshold2: data.filtrationTolerance?.kvThreshold2 || "100",
                        });
                        setIsSaved(true);
                } else {
                    setIsSaved(false);
                    }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    toast.error("Failed to load test data");
                }
                setIsSaved(false);
                } finally {
                    setIsLoading(false);
                }
            };
            loadTest();
    }, [serviceId, initialTestId]);

    // Save function
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
            let currentTestId = testId;

            // If no testId, try to get existing data by serviceId first
            if (!currentTestId) {
                try {
                    const existing = await getTotalFiltrationByServiceIdForRadiographyFixed(serviceId);
                    if (existing?.data?._id) {
                        currentTestId = existing.data._id;
                        setTestId(currentTestId);
                    }
                } catch (err) {
                    // No existing data, will create new
                }
            }

            if (currentTestId) {
                // Update existing
                result = await updateTotalFiltrationForRadiographyFixed(currentTestId, payload);
                toast.success("Updated successfully");
            } else {
                // Create new
                result = await addTotalFiltrationForRadiographyFixed(serviceId, payload);
                const newId = result?.data?._id || result?.data?.data?._id || result?._id;
                if (newId) {
                    setTestId(newId);
                    onTestSaved?.(newId);
                }
                toast.success("Saved successfully");
            }

            setIsSaved(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Save failed");
        } finally {
            setIsSaving(false);
        }
    };


    // Your existing functions
    const addMAColumn = () => {
        setMAStations(prev => [...prev, "200 mA"]);
        setRows(prev => prev.map(row => ({ ...row, measuredValues: [...row.measuredValues, ""] })));
        setIsSaved(false);
    };

    const removeMAColumn = (index: number) => {
        if (mAStations.length <= 1) return;
        setMAStations(prev => prev.filter((_, i) => i !== index));
        setRows(prev => prev.map(row => ({
            ...row,
            measuredValues: row.measuredValues.filter((_, i) => i !== index),
        })));
        setIsSaved(false);
    };

    const updateMAHeader = (index: number, value: string) => {
        setMAStations(prev => {
            const updated = [...prev];
            updated[index] = value || `mA ${index + 1}`;
            return updated;
        });
        setIsSaved(false);
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
        setIsSaved(false);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter(r => r.id !== id));
        setIsSaved(false);
    };

    const updateCell = (rowId: string, field: "appliedKvp" | number, value: string) => {
        setRows(prev => prev.map(row => {
            if (row.id !== rowId) return row;
            if (field === "appliedKvp") {
                setIsSaved(false);
                return { ...row, appliedKvp: value };
            }

            const newMeasured = [...row.measuredValues];
            newMeasured[field] = value;

            const nums = newMeasured.filter(v => v !== "" && !isNaN(Number(v))).map(Number);
            const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "";

            const applied = parseFloat(row.appliedKvp || "0");
            const avgNum = parseFloat(avg || "0");
            const tol = parseFloat(toleranceValue || "0");
            let remark: "PASS" | "FAIL" | "-" = "-";

            if (!isNaN(applied) && !isNaN(avgNum) && !isNaN(tol) && tol > 0) {
                const diff = Math.abs(avgNum - applied);
                remark = toleranceSign === "+" ? (avgNum <= applied + tol ? "PASS" : "FAIL")
                    : toleranceSign === "-" ? (avgNum >= applied - tol ? "PASS" : "FAIL")
                        : diff <= tol ? "PASS" : "FAIL";
            }

            setIsSaved(false);
            return { ...row, measuredValues: newMeasured, averageKvp: avg, remarks: remark };
        }));
    };

    // Calculate PASS/FAIL for Total Filtration based on tolerance table
    const getFiltrationRemark = (): "PASS" | "FAIL" | "-" => {
        const kvp = parseFloat(totalFiltration.atKvp);
        const measured = parseFloat(totalFiltration.required);
        const threshold1 = parseFloat(filtrationTolerance.kvThreshold1);
        const threshold2 = parseFloat(filtrationTolerance.kvThreshold2);

        if (isNaN(kvp) || isNaN(measured)) return "-";

        let requiredTolerance: number;

        // Determine which tolerance range applies based on kVp value
        // Logic according to requirements:
        // 1. If kV < threshold1 (e.g., < 70): measured must be >= forKvGreaterThan70 (e.g., >= 1.5) to PASS
        // 2. If threshold1 <= kV <= threshold2 (e.g., 70 <= kV <= 100): measured must be >= forKvBetween70And100 (e.g., >= 2.0) to PASS
        // 3. If kV > threshold2 (e.g., > 100): measured must be >= forKvGreaterThan100 (e.g., >= 2.5) to PASS
        
        if (kvp < threshold1) {
            // kV < threshold1 (e.g., < 70) - measured must be >= forKvGreaterThan70 (e.g., >= 1.5)
            requiredTolerance = parseFloat(filtrationTolerance.forKvGreaterThan70);
        } else if (kvp >= threshold1 && kvp <= threshold2) {
            // threshold1 <= kV <= threshold2 (e.g., 70 <= kV <= 100) - measured must be >= forKvBetween70And100 (e.g., >= 2.0)
            requiredTolerance = parseFloat(filtrationTolerance.forKvBetween70And100);
        } else {
            // kV > threshold2 (e.g., > 100) - measured must be >= forKvGreaterThan100 (e.g., >= 2.5)
            requiredTolerance = parseFloat(filtrationTolerance.forKvGreaterThan100);
        }

        if (isNaN(requiredTolerance)) return "-";

        // PASS if measured value is greater than or equal to the required tolerance
        return measured >= requiredTolerance ? "PASS" : "FAIL";
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
            {/* Save/Edit Button */}
            <div className="flex justify-end">
                <button
                    onClick={isSaved ? () => setIsSaved(false) : saveTest}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${isSaved
                            ? "bg-orange-600 text-white hover:bg-orange-700"
                            : "bg-teal-600 text-white hover:bg-teal-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : isSaved ? (
                        <>
                            <Edit3 className="w-5 h-5" />
                            Edit
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            {testId ? "Update Test" : "Save Test"}
                        </>
                    )}
                </button>
            </div>

            {/* Your Beautiful Table & UI */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-blue-50 border-b border-gray-300">
                    <h3 className="text-xl font-bold text-blue-900">
                        Accuracy of kVp at Different mA Stations
                    </h3>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                                Applied kVp
                            </th>
                            <th colSpan={mAStations.length} className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                                <div className="flex items-center justify-between">
                                    <span>Measured Values (kVp)</span>
                                    <button onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </th>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                                Average kVp
                            </th>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Remarks
                            </th>
                            <th rowSpan={2} className="w-12" />
                        </tr>
                        <tr>
                            {mAStations.map((header, idx) => (
                                <th key={idx} className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                                    <div className="flex items-center justify-center gap-1">
                                        <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => updateMAHeader(idx, e.target.value)}
                                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        {mAStations.length > 1 && (
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
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 border-r">
                                    <input
                                        type="number"
                                        value={row.appliedKvp}
                                        onChange={(e) => updateCell(row.id, "appliedKvp", e.target.value)}
                                        className="w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="80"
                                    />
                                </td>
                                {row.measuredValues.map((val, idx) => (
                                    <td key={idx} className="px-3 py-3 text-center border-r">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={val}
                                            onChange={(e) => updateCell(row.id, idx, e.target.value)}
                                            className="w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.0"
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
                                    {rows.length > 1 && (
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
                    <button onClick={addRow} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-5 h-5" /> Add Row
                    </button>
                </div>
            </div>

            {/* Tolerance */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
                <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
                <div className="flex items-center gap-4">
                    <span className="font-medium text-indigo-800">Tolerance:</span>
                    <select
                        value={toleranceSign}
                        onChange={(e) => { setToleranceSign(e.target.value as any); setIsSaved(false); }}
                        className="px-4 py-2 border border-indigo-400 rounded bg-white font-medium"
                    >
                        <option value="±">±</option>
                        <option value="+">Positive only (+)</option>
                        <option value="-">Negative only (-)</option>
                    </select>
                    <input
                        type="number"
                        step="0.1"
                        value={toleranceValue}
                        onChange={(e) => { setToleranceValue(e.target.value); setIsSaved(false); }}
                        className="w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-indigo-800">kV</span>
                </div>
            </div>

            {/* Total Filtration */}
            <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-8">
                <h3 className="text-xl font-bold text-green-800 mb-6">Total Filtration</h3>
                <div className="flex flex-col items-center justify-center gap-6">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <span className="text-xl font-medium text-gray-700">Total Filtration is (at</span>
                        <input
                            type="number"
                            step="1"
                            value={totalFiltration.atKvp}
                            onChange={(e) => { setTotalFiltration({ ...totalFiltration, atKvp: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-24 px-3 py-2 text-lg font-bold text-center border-2 rounded-lg ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200'}`}
                            placeholder="80"
                        />
                        <span className="text-xl font-medium text-gray-700">kVp)</span>
                        <input
                            type="number"
                            step="0.01"
                            value={totalFiltration.required}
                            onChange={(e) => { setTotalFiltration({ ...totalFiltration, required: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-32 px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200'}`}
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
                <ul className="space-y-3 text-amber-800">
                    <li className="flex items-center gap-3 flex-wrap">
                        <span>•</span>
                        <input
                            type="number"
                            step="0.1"
                            value={filtrationTolerance.forKvGreaterThan70}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, forKvGreaterThan70: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-20 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>mm Al for kV {"<"}</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold1}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold1: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                    </li>
                    <li className="flex items-center gap-3 flex-wrap">
                        <span>•</span>
                        <input
                            type="number"
                            step="0.1"
                            value={filtrationTolerance.forKvBetween70And100}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, forKvBetween70And100: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-20 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>mm Al for</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold1}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold1: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>≤ kV ≤</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold2}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold2: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                    </li>
                    <li className="flex items-center gap-3 flex-wrap">
                        <span>•</span>
                        <input
                            type="number"
                            step="0.1"
                            value={filtrationTolerance.forKvGreaterThan100}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, forKvGreaterThan100: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-20 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>mm Al for kV {">"}</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold2}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold2: e.target.value }); setIsSaved(false); }}
                            disabled={isSaved}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isSaved ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default TotalFilteration;