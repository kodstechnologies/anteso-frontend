// src/components/TestTables/AccuracyOfOperatingPotentialAndTime.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface MAStationData {
    kvp: string;
    time: string;
}

interface RowData {
    id: string;
    setTime: string; // User enters this → this is the "Set Time"
    maStation1: MAStationData;
    maStation2: MAStationData;
    avgKvp: string;
    avgTime: string;
    remark: "PASS" | "FAIL" | "-";
}

interface AccuracyOfOperatingPotentialAndTimeProps {
    serviceId: string;
    testId?: string | null;
    onTestSaved?: (testId: string) => void;
}

const AccuracyOfOperatingPotentialAndTime: React.FC<AccuracyOfOperatingPotentialAndTimeProps> = ({
    serviceId,
    testId: initialTestId = null,
    onTestSaved,
}) => {
    const [testId, setTestId] = useState<string | null>(initialTestId);
    const [isSaved, setIsSaved] = useState(!!initialTestId);
    const [isSaving, setIsSaving] = useState(false);

    const [rows, setRows] = useState<RowData[]>([
        {
            id: "1",
            setTime: "",
            maStation1: { kvp: "", time: "" },
            maStation2: { kvp: "", time: "" },
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
        atKvp: "",
        measured1: "",
        measured2: "",
    });

    // Total Filtration Tolerance (back to your original editable style)
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

    // Auto-calculate averages and remarks
    const calculateRow = (row: RowData): RowData => {
        const setTimeVal = parseFloat(row.setTime) || 0;
        const kvp1 = parseFloat(row.maStation1.kvp) || 0;
        const kvp2 = parseFloat(row.maStation2.kvp) || 0;
        const time1 = parseFloat(row.maStation1.time) || 0;
        const time2 = parseFloat(row.maStation2.time) || 0;

        const validKvps = [kvp1, kvp2].filter(v => v > 0);
        const validTimes = [time1, time2].filter(v => v > 0);

        const avgKvp = validKvps.length > 0
            ? (validKvps.reduce((a, b) => a + b, 0) / validKvps.length).toFixed(1)
            : "";
        const avgTime = validTimes.length > 0
            ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(3)
            : "";

        let remark: "PASS" | "FAIL" | "-" = "-";

        if (setTimeVal > 0 && avgTime !== "" && avgKvp !== "") {
            const avgTimeNum = parseFloat(avgTime);
            const avgKvpNum = parseFloat(avgKvp);
            const tolTime = parseFloat(timeToleranceValue) || 0;
            const tolKvp = parseFloat(kvpToleranceValue) || 0;

            const timePass = timeToleranceSign === "±"
                ? Math.abs(avgTimeNum - setTimeVal) / setTimeVal * 100 <= tolTime
                : avgTimeNum <= setTimeVal * (1 + tolTime / 100);

            const kvpPass = kvpToleranceSign === "±"
                ? Math.abs(avgKvpNum - setTimeVal) <= tolKvp
                : kvpToleranceSign === "+"
                    ? avgKvpNum <= setTimeVal + tolKvp
                    : avgKvpNum >= setTimeVal - tolKvp;

            remark = timePass && kvpPass ? "PASS" : "FAIL";
        }

        return { ...row, avgKvp, avgTime, remark };
    };

    const updateRow = (id: string, field: string, value: string) => {
        setRows(prev => prev.map(row => {
            if (row.id !== id) return row;
            const updated: any = { ...row };
            if (field === "setTime") updated.setTime = value;
            else if (field === "ma1_kvp") updated.maStation1.kvp = value;
            else if (field === "ma1_time") updated.maStation1.time = value;
            else if (field === "ma2_kvp") updated.maStation2.kvp = value;
            else if (field === "ma2_time") updated.maStation2.time = value;
            return calculateRow(updated);
        }));
        setIsSaved(false);
    };

    const addRow = () => {
        setRows(prev => [...prev, {
            id: Date.now().toString(),
            setTime: "",
            maStation1: { kvp: "", time: "" },
            maStation2: { kvp: "", time: "" },
            avgKvp: "",
            avgTime: "",
            remark: "-",
        }]);
        setIsSaved(false);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter(r => r.id !== id));
        setIsSaved(false);
    };

    const saveTest = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 800));
        toast.success("Test saved successfully!");
        setIsSaving(false);
        setIsSaved(true);
    };

    useEffect(() => {
        if (isSaved && testId) {
            const timeout = setTimeout(saveTest, 1500);
            return () => clearTimeout(timeout);
        }
    }, [rows, kvpToleranceSign, kvpToleranceValue, timeToleranceSign, timeToleranceValue, totalFiltration, filtrationTolerance]);

    return (
        <div className="p-6 max-w-full overflow-x-auto space-y-10">

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={saveTest}
                    disabled={isSaving || isSaved}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${isSaved
                            ? "bg-gray-500 text-white hover:bg-gray-600"
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
                            <Save className="w-5 h-5" />
                            Saved
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Test
                        </>
                    )}
                </button>
            </div>

            {/* Main Table */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <h3 className="text-2xl font-bold">Accuracy of Operating Potential (kVp) and Irradiation Time</h3>
                </div>

                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase border-r">
                                Set Time (s)
                            </th>
                            <th colSpan={4} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase text-center border-r">
                                Measured Values at mA Stations
                            </th>
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase border-r text-center">
                                Avg kVp
                            </th>
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase border-r text-center">
                                Avg Time (s)
                            </th>
                            <th rowSpan={2} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase text-center">
                                Remark
                            </th>
                            <th rowSpan={2} className="w-12"></th>
                        </tr>
                        <tr>
                            {["mA Station 1", "mA Station 2"].map((station, i) => (
                                <th key={i} colSpan={2} className="px-4 py-3 text-xs font-semibold text-center bg-gray-100 border-r">
                                    {station}
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-gray-100">
                            <th className="px-2 py-2"></th>
                            {["kVp", "Time(s)", "kVp", "Time(s)"].map((h, i) => (
                                <th key={i} className="px-4 py-3 text-xs font-medium text-gray-600 border-r">{h}</th>
                            ))}
                            <th colSpan={3}></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-blue-50 transition">
                                {/* Set Time - User Editable */}
                                <td className="px-6 py-4 border-r">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={row.setTime}
                                        onChange={(e) => updateRow(row.id, "setTime", e.target.value)}
                                        className="w-full px-3 py-2 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="0.100"
                                    />
                                </td>

                                {/* mA Station 1 */}
                                <td className="px-3 py-4 border-r">
                                    <input type="number" step="0.1" value={row.maStation1.kvp}
                                        onChange={(e) => updateRow(row.id, "ma1_kvp", e.target.value)}
                                        className="w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-4 border-r">
                                    <input type="number" step="0.001" value={row.maStation1.time}
                                        onChange={(e) => updateRow(row.id, "ma1_time", e.target.value)}
                                        className="w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                                </td>

                                {/* mA Station 2 */}
                                <td className="px-3 py-4 border-r">
                                    <input type="number" step="0.1" value={row.maStation2.kvp}
                                        onChange={(e) => updateRow(row.id, "ma2_kvp", e.target.value)}
                                        className="w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-4 border-r">
                                    <input type="number" step="0.001" value={row.maStation2.time}
                                        onChange={(e) => updateRow(row.id, "ma2_time", e.target.value)}
                                        className="w-full px-3 py-2 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                                </td>

                                <td className="px-6 py-4 text-center font-bold text-blue-700 border-r">{row.avgKvp || "-"}</td>
                                <td className="px-6 py-4 text-center font-bold text-blue-700 border-r">{row.avgTime || "-"}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-5 py-2 rounded-full font-bold text-sm ${row.remark === "PASS" ? "bg-green-100 text-green-800" :
                                            row.remark === "FAIL" ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-600"
                                        }`}>
                                        {row.remark}
                                    </span>
                                </td>
                                <td className="px-3 py-4 text-center">
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

            {/* Tolerances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-300 shadow-lg">
                    <h4 className="text-lg font-bold text-purple-900 mb-4">Tolerance for kVp</h4>
                    <div className="flex items-center gap-4">
                        <select value={kvpToleranceSign} onChange={(e) => { setKvpToleranceSign(e.target.value as any); setIsSaved(false); }}
                            className="px-4 py-2 border border-purple-400 rounded bg-white font-medium">
                            <option value="±">±</option>
                            <option value="+">Positive (+)</option>
                            <option value="-">Negative (-)</option>
                        </select>
                        <input type="number" value={kvpToleranceValue} onChange={(e) => { setKvpToleranceValue(e.target.value); setIsSaved(false); }}
                            className="w-28 px-4 py-2 text-center border border-purple-400 rounded font-medium" />
                        <span className="font-medium text-purple-800">kV</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-300 shadow-lg">
                    <h4 className="text-lg font-bold text-teal-900 mb-4">Tolerance for Irradiation Time</h4>
                    <div className="flex items-center gap-4">
                        <select value={timeToleranceSign} onChange={(e) => { setTimeToleranceSign(e.target.value as any); setIsSaved(false); }}
                            className="px-4 py-2 border border-teal-400 rounded bg-white font-medium">
                            <option value="±">±</option>
                            <option value="+">+ only</option>
                        </select>
                        <input type="number" value={timeToleranceValue} onChange={(e) => { setTimeToleranceValue(e.target.value); setIsSaved(false); }}
                            className="w-28 px-4 py-2 text-center border border-teal-400 rounded font-medium" />
                        <span className="font-medium text-teal-800">%</span>
                    </div>
                </div>
            </div>

            {/* Total Filtration */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-300 p-8">
                <h3 className="text-xl font-bold text-emerald-800 mb-6">Total Filtration</h3>
                <div className="flex items-center justify-center gap-10 text-lg">
                    <span>Total Filtration is (at</span>
                    <input type="number" value={totalFiltration.atKvp} onChange={(e) => setTotalFiltration({ ...totalFiltration, atKvp: e.target.value })}
                        className="w-24 px-4 py-2 text-center border-2 border-gray-400 rounded-lg font-bold" placeholder="80" />
                    <span>kVp)</span>
                    <input type="number" step="0.01" value={totalFiltration.measured1}
                        onChange={(e) => setTotalFiltration({ ...totalFiltration, measured1: e.target.value })}
                        className="w-32 px-4 py-3 text-2xl font-bold text-center border-2 border-emerald-500 rounded-lg focus:ring-4 focus:ring-emerald-200" placeholder="2.3" />
                    <span className="text-2xl font-bold">and</span>
                    <input type="number" step="0.01" value={totalFiltration.measured2}
                        onChange={(e) => setTotalFiltration({ ...totalFiltration, measured2: e.target.value })}
                        className="w-32 px-4 py-3 text-2xl font-bold text-center border-2 border-emerald-500 rounded-lg focus:ring-4 focus:ring-emerald-200" placeholder="2.5" />
                    <span className="text-3xl font-bold text-emerald-700">mm Al</span>
                </div>
            </div>

            {/* Total Filtration Tolerance - YOUR ORIGINAL STYLE */}
            <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-6">
                <h4 className="text-lg font-bold text-amber-900 mb-4">Tolerance for Total Filtration</h4>
                <div className="flex flex-wrap items-center gap-3 text-amber-800 font-medium text-lg">
                    <input type="number" step="0.1" value={filtrationTolerance.value1}
                        onChange={(e) => setFiltrationTolerance({ ...filtrationTolerance, value1: e.target.value })}
                        className="w-24 px-3 py-2 border border-amber-600 rounded font-bold text-amber-900" />
                    <span>mm Al for kV</span>
                    <span className="font-bold text-amber-900">{filtrationTolerance.operator1}</span>
                    <input type="number" value={filtrationTolerance.kvp1}
                        onChange={(e) => setFiltrationTolerance({ ...filtrationTolerance, kvp1: e.target.value })}
                        className="w-24 px-3 py-2 border border-amber-600 rounded font-bold text-amber-900" />
                    <span className="mx-2">,</span>
                    <input type="number" step="0.1" value={filtrationTolerance.value2}
                        onChange={(e) => setFiltrationTolerance({ ...filtrationTolerance, value2: e.target.value })}
                        className="w-24 px-3 py-2 border border-amber-600 rounded font-bold text-amber-900" />
                    <span>mm Al for</span>
                    <span className="font-mono text-amber-900">{filtrationTolerance.operator2}</span>
                    <input type="number" value={filtrationTolerance.kvp2}
                        onChange={(e) => setFiltrationTolerance({ ...filtrationTolerance, kvp2: e.target.value })}
                        className="w-24 px-3 py-2 border border-amber-600 rounded font-bold text-amber-900" />
                    <span className="mx-2">,</span>
                    <input type="number" step="0.1" value={filtrationTolerance.value3}
                        onChange={(e) => setFiltrationTolerance({ ...filtrationTolerance, value3: e.target.value })}
                        className="w-24 px-3 py-2 border border-amber-600 rounded font-bold text-amber-900" />
                    <span>mm Al for kV</span>
                    <span className="font-bold text-amber-900">{filtrationTolerance.operator3}</span>
                    <input type="number" value={filtrationTolerance.kvp3}
                        onChange={(e) => setFiltrationTolerance({ ...filtrationTolerance, kvp3: e.target.value })}
                        className="w-24 px-3 py-2 border border-amber-600 rounded font-bold text-amber-900" />
                </div>
            </div>
        </div>
    );
};

export default AccuracyOfOperatingPotentialAndTime;