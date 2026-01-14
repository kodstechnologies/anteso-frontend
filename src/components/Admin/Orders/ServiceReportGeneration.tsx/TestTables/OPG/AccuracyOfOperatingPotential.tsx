// src/components/TestTables/AccuracyOfOperatingPotential.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
    addAccuracyOfOperatingPotentialForOPG,
    getAccuracyOfOperatingPotentialByServiceIdForOPG,
    updateAccuracyOfOperatingPotentialForOPG,
} from "../../../../../../api";

interface RowData {
    id: string;
    appliedKvp: string;
    measuredValues: string[];
    averageKvp: string;
    remarks: "PASS" | "FAIL" | "-";
}

interface AccuracyOfOperatingPotentialProps {
    serviceId: string;
    testId?: string | null;
    onTestSaved?: (testId: string) => void;
    csvData?: any[];
}

const AccuracyOfOperatingPotential: React.FC<AccuracyOfOperatingPotentialProps> = ({
    serviceId,
    testId: initialTestId = null,
    onTestSaved,
    csvData
}) => {
    const [testId, setTestId] = useState<string | null>(initialTestId);
    const [isSaved, setIsSaved] = useState(!!initialTestId);
    const [isLoading, setIsLoading] = useState(!!initialTestId);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isViewMode = isSaved && !isEditing;

    const [mAStations, setMAStations] = useState<string[]>(["50 mA", "100 mA"]);
    const [ffd, setFfd] = useState<string>(""); // FFD (cm) shown on top-right
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
        kvThreshold1: "70",
        kvThreshold2: "100"
    });

    // Load existing test data
    useEffect(() => {
        const loadTest = async () => {
            if (!serviceId) return;
            setIsLoading(true);
            try {
                const res = await getAccuracyOfOperatingPotentialByServiceIdForOPG(serviceId);
                const data = res?.data;
                if (data) {
                    setTestId(data._id || null);
                    setMAStations(data.mAStations || ["50 mA", "100 mA"]);
                    setFfd(data.ffd || "");
                    setRows(
                        data.measurements?.map((m: any, i: number) => ({
                            id: String(i + 1),
                            appliedKvp: m.appliedKvp || "",
                            measuredValues: m.measuredValues || [],
                            averageKvp: m.averageKvp || "",
                            remarks: m.remarks || "-",
                        })) || rows
                    );
                    setToleranceSign(data.tolerance?.type || "±");
                    setToleranceValue(data.tolerance?.value || "2.0");
                    setTotalFiltration({
                        measured: data.totalFiltration?.measured || "",
                        required: data.totalFiltration?.required || "",
                        atKvp: data.totalFiltration?.atKvp || "",
                    });
                    if (data.filtrationTolerance) {
                        setFiltrationTolerance({
                            forKvGreaterThan70: data.filtrationTolerance.forKvGreaterThan70 || "1.5",
                            forKvBetween70And100: data.filtrationTolerance.forKvBetween70And100 || "2.0",
                            forKvGreaterThan100: data.filtrationTolerance.forKvGreaterThan100 || "2.5",
                            kvThreshold1: data.filtrationTolerance.kvThreshold1 || "70",
                            kvThreshold2: data.filtrationTolerance.kvThreshold2 || "100",
                        });
                    }
                    setIsSaved(true);
                    setIsEditing(false);
                    if (data._id && !initialTestId) {
                        onTestSaved?.(data._id);
                    }
                } else {
                    setIsSaved(false);
                    setIsEditing(true);
                }
            } catch (err) {
                console.log("No saved data or failed to load:", err);
                setIsSaved(false);
                setIsEditing(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadTest();
    }, [serviceId]);

    // CSV Data Injection
    useEffect(() => {
        if (csvData && csvData.length > 0) {
            // Check for Total Filtration row
            const tfRow = csvData.find(r => {
                const s = String(r[0]).trim();
                return s === 'TotalFiltration' || s === 'Total Filtration';
            });

            if (tfRow) {
                // Template: Total Filtration,Measured,2.5,Required,2.5,atKvp,80
                // Export: TotalFiltration,Measured,2.5,Required,2.5,atKvp,80

                const measIdx = tfRow.findIndex((c: any) => String(c).trim().toLowerCase() === 'measured' || String(c).trim().toLowerCase().includes('measured'));
                const reqIdx = tfRow.findIndex((c: any) => String(c).trim().toLowerCase() === 'required' || String(c).trim().toLowerCase().includes('required'));
                const kvpIdx = tfRow.findIndex((c: any) => String(c).trim().toLowerCase() === 'atkvp' || String(c).trim().toLowerCase().includes('at kvp'));

                setTotalFiltration({
                    measured: measIdx !== -1 ? tfRow[measIdx + 1]?.toString() || '' : (tfRow[1] || ''),
                    required: reqIdx !== -1 ? tfRow[reqIdx + 1]?.toString() || '' : (tfRow[2] || ''),
                    atKvp: kvpIdx !== -1 ? tfRow[kvpIdx + 1]?.toString() || '' : (tfRow[3] || '')
                });
            }

            const dataRows = csvData.filter(r => r[0] !== 'TotalFiltration' && !isNaN(parseFloat(r[0])));

            if (dataRows.length > 0) {
                const newRows = dataRows.map((row, idx) => {
                    // Applied kVp is row[0]
                    const applied = row[0];
                    // Take following columns but ignore trailing non-numeric or PASS/FAIL
                    const potentialMeasured = row.slice(1);
                    const measured: string[] = [];

                    potentialMeasured.forEach((val: any) => {
                        const s = val?.toString()?.trim();
                        if (s && !isNaN(parseFloat(s)) && !['Pass', 'Fail', 'PASS', 'FAIL'].includes(s)) {
                            measured.push(s);
                        }
                    });

                    // If we have more than 2 measurements, most likely the last one is Average kVp.
                    // We should only take as many as we need OR just re-calculate everything.
                    // In our new template, there are only measured values.
                    // In an exported file, there might be Average and Remark.
                    // We already filtered PASS/FAIL above. Now let's try to detect if the last numeric is Average.
                    if (measured.length > 1) {
                        // Average is usually (M1+M2...)/n. 
                        // If we have 3 numeric values, and the 3rd is the average of 1st and 2nd, we drop it.
                        const last = parseFloat(measured[measured.length - 1]);
                        const others = measured.slice(0, -1).map(v => parseFloat(v));
                        const avgOfOthers = others.reduce((a, b) => a + b, 0) / others.length;
                        if (Math.abs(last - avgOfOthers) < 0.1) {
                            measured.pop(); // Drop the imported average
                        }
                    }

                    const baseRow = {
                        id: String(idx + 1),
                        appliedKvp: applied?.toString() || '',
                        measuredValues: measured,
                        averageKvp: "",
                        remarks: "-" as any
                    };

                    // Recalculate average and remarks using the recalcRow function
                    return recalcRow(baseRow);
                });

                setRows(newRows);

                // Update mA headers count exactly matching the import count (min 2)
                const maxMeas = Math.max(...newRows.map(r => r.measuredValues.length));
                const finalCount = maxMeas || 2;
                if (finalCount !== mAStations.length) {
                    setMAStations(Array.from({ length: finalCount }, (_, i) => `mA ${i + 1}`));
                }

                if (!testId) setIsEditing(true);
            }
        }
    }, [csvData]);

    // Save function
    const saveTest = async () => {
        if (!serviceId) {
            toast.error("Service ID is missing");
            return;
        }

        const payload = {
            mAStations,
            ffd,
            measurements: rows.map(r => ({
                appliedKvp: r.appliedKvp,
                measuredValues: r.measuredValues,
                averageKvp: r.averageKvp,
                remarks: r.remarks,
            })),
            tolerance: { type: toleranceSign, value: toleranceValue },
            totalFiltration,
            filtrationTolerance,
        };

        setIsSaving(true);
        try {
            let result;
            if (testId) {
                result = await updateAccuracyOfOperatingPotentialForOPG(testId, payload);
                toast.success("Updated successfully");
            } else {
                result = await addAccuracyOfOperatingPotentialForOPG(serviceId, payload);
                const newTestId = result?.data?.testId || result?.data?._id;
                if (newTestId) {
                    setTestId(newTestId);
                    onTestSaved?.(newTestId);
                }
                toast.success("Saved successfully");
            }

            setIsSaved(true);
            setIsEditing(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = () => {
        setIsEditing(true);
        setIsSaved(false);
    };

    // Your existing functions
    const addMAColumn = () => {
        if (isViewMode) return;
        setMAStations(prev => [...prev, "200 mA"]);
        setRows(prev => prev.map(row => ({ ...row, measuredValues: [...row.measuredValues, ""] })));
    };

    const removeMAColumn = (index: number) => {
        if (isViewMode || mAStations.length <= 1) return;
        setMAStations(prev => prev.filter((_, i) => i !== index));
        setRows(prev => prev.map(row => ({
            ...row,
            measuredValues: row.measuredValues.filter((_, i) => i !== index),
        })));
    };

    const updateMAHeader = (index: number, value: string) => {
        if (isViewMode) return;
        setMAStations(prev => {
            const updated = [...prev];
            updated[index] = value || `mA ${index + 1}`;
            return updated;
        });
    };

    const addRow = () => {
        if (isViewMode) return;
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
        if (isViewMode || rows.length <= 1) return;
        setRows(prev => prev.filter(r => r.id !== id));
    };

    // Helper to recompute average & remark for a row using current tolerance settings
    const recalcRow = (row: RowData, measuredValuesOverride?: string[]): RowData => {
        const measured = measuredValuesOverride ?? row.measuredValues;
        const nums = measured.filter(v => v !== "" && !isNaN(Number(v))).map(Number);
        const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "";

        const applied = parseFloat(row.appliedKvp || "0");
        const avgNum = parseFloat(avg || "0");
        const tol = parseFloat(toleranceValue || "0");
        let remark: "PASS" | "FAIL" | "-" = "-";

        if (!isNaN(applied) && !isNaN(avgNum) && !isNaN(tol) && tol > 0) {
            const diff = Math.abs(avgNum - applied);
            const EPS = 1e-6; // guard against floating point rounding
            remark = diff <= tol + EPS ? "PASS" : "FAIL";
        }

        return { ...row, measuredValues: measured, averageKvp: avg, remarks: remark };
    };

    const updateCell = (rowId: string, field: "appliedKvp" | number, value: string) => {
        if (isViewMode) return;
        setRows(prev => prev.map(row => {
            if (row.id !== rowId) return row;
            if (field === "appliedKvp") {
                // Recalculate remark using new applied kVp
                const updatedRow = { ...row, appliedKvp: value };
                return recalcRow(updatedRow);
            }

            const newMeasured = [...row.measuredValues];
            newMeasured[field] = value;

            return recalcRow(row, newMeasured);
        }));
    };

    // Recalculate remarks when tolerance settings change
    useEffect(() => {
        setRows(prev =>
            prev.map(row => recalcRow(row))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toleranceSign, toleranceValue]);

    const getFiltrationRemark = (): "PASS" | "FAIL" | "-" => {
        const m = parseFloat(totalFiltration.measured);
        const kvp = parseFloat(totalFiltration.atKvp);

        if (isNaN(m) || isNaN(kvp)) return "-";

        const threshold1 = parseFloat(filtrationTolerance.kvThreshold1);
        const threshold2 = parseFloat(filtrationTolerance.kvThreshold2);

        let requiredTolerance: number;

        if (kvp < threshold1) {
            requiredTolerance = parseFloat(filtrationTolerance.forKvGreaterThan70);
        } else if (kvp >= threshold1 && kvp <= threshold2) {
            requiredTolerance = parseFloat(filtrationTolerance.forKvBetween70And100);
        } else {
            requiredTolerance = parseFloat(filtrationTolerance.forKvGreaterThan100);
        }

        if (isNaN(requiredTolerance)) return "-";

        return m >= requiredTolerance ? "PASS" : "FAIL";
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Accuracy of Operating Potential</h2>
                <button
                    onClick={isViewMode ? startEditing : saveTest}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : isViewMode
                            ? "bg-orange-600 text-white hover:bg-orange-700"
                            : "bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300"
                        }`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            {isViewMode ? <Edit3 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {isViewMode ? "Edit" : testId ? "Update" : "Save"} Test
                        </>
                    )}
                </button>
            </div>

            {/* Main Table */}
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
                                    {!isViewMode && (
                                        <button onClick={addMAColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
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
                                            disabled={isViewMode}
                                            className={`w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                        {mAStations.length > 1 && !isViewMode && (
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
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
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
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
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
                                    {rows.length > 1 && !isViewMode && (
                                        <button onClick={() => removeRow(row.id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!isViewMode && (
                    <div className="px-6 py-4 bg-gray-50 border-t">
                        <button onClick={addRow} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Plus className="w-5 h-5" /> Add Row
                        </button>
                    </div>
                )}
            </div>

            {/* Tolerance */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
                <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
                <div className="flex items-center gap-4">
                    <span className="font-medium text-indigo-800">Tolerance:</span>
                    <select
                        value={toleranceSign}
                        onChange={(e) => { setToleranceSign(e.target.value as any); }}
                        disabled={isViewMode}
                        className={`px-4 py-2 border border-indigo-400 rounded font-medium ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    >
                        <option value="±">±</option>
                        <option value="+">Positive only (+)</option>
                        <option value="-">Negative only (-)</option>
                    </select>
                    <input
                        type="number"
                        step="0.1"
                        value={toleranceValue}
                        onChange={(e) => { setToleranceValue(e.target.value); }}
                        disabled={isViewMode}
                        className={`w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                    />
                    <span className="font-medium text-indigo-800">kV</span>
                </div>
            </div>

            {/* Total Filtration */}
            <div className={`bg-white shadow-lg rounded-lg border p-8 ${getFiltrationRemark() === "FAIL" ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}>
                <h3 className="text-xl font-bold text-green-800 mb-6">Total Filtration</h3>
                <div className="flex flex-col items-center justify-center gap-6">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <span className="text-xl font-medium text-gray-700">Total Filtration is (at</span>
                        <input
                            type="number"
                            step="1"
                            value={totalFiltration.atKvp}
                            onChange={(e) => { setTotalFiltration({ ...totalFiltration, atKvp: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-24 px-3 py-2 text-lg font-bold text-center border-2 rounded-lg ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200'}`}
                            placeholder="80"
                        />
                        <span className="text-xl font-medium text-gray-700">kVp)</span>
                        <input
                            type="number"
                            step="0.01"
                            value={totalFiltration.measured}
                            onChange={(e) => { setTotalFiltration({ ...totalFiltration, measured: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-32 px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg ${isViewMode
                                ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                                : getFiltrationRemark() === "FAIL"
                                    ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-200'
                                    : 'border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-200'
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
                <ul className="space-y-3 text-amber-800">
                    <li className="flex items-center gap-3 flex-wrap">
                        <span>•</span>
                        <input
                            type="number"
                            step="0.1"
                            value={filtrationTolerance.forKvGreaterThan70}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, forKvGreaterThan70: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-20 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>mm Al for kV {"<"}</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold1}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold1: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                    </li>
                    <li className="flex items-center gap-3 flex-wrap">
                        <span>•</span>
                        <input
                            type="number"
                            step="0.1"
                            value={filtrationTolerance.forKvBetween70And100}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, forKvBetween70And100: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-20 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>mm Al for</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold1}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold1: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>≤ kV ≤</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold2}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold2: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                    </li>
                    <li className="flex items-center gap-3 flex-wrap">
                        <span>•</span>
                        <input
                            type="number"
                            step="0.1"
                            value={filtrationTolerance.forKvGreaterThan100}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, forKvGreaterThan100: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-20 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                        <span>mm Al for kV {">"}</span>
                        <input
                            type="number"
                            step="1"
                            value={filtrationTolerance.kvThreshold2}
                            onChange={(e) => { setFiltrationTolerance({ ...filtrationTolerance, kvThreshold2: e.target.value }); setIsSaved(false); }}
                            disabled={isViewMode}
                            className={`w-16 px-2 py-1 text-center border rounded font-bold ${isViewMode ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-amber-600 text-amber-900 bg-white'}`}
                        />
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AccuracyOfOperatingPotential;