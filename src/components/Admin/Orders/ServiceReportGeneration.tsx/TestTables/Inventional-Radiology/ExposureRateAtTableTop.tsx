// src/components/TestTables/ExposureRateAtTableTop.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Save, Edit3, Loader2, Plus, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
    addExposureRateTableTop,
    getExposureRateTableTopByTestId,
    getExposureRateTableTopByServiceIdForInventionalRadiology,
    updateExposureRateTableTop
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
    tubeId?: string | null;
    onTestSaved?: (testId: string) => void;
    csvData?: any[];
}

const ExposureRateAtTableTop: React.FC<Props> = ({
    serviceId,
    testId: propTestId = null,
    tubeId,
    onTestSaved,
    csvData,
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

    const minFocus = parseFloat(minFocusDistance);
    const hasValidMinFocus = !Number.isNaN(minFocus) && minFocus > 0;
    const distanceValidationByRow = useMemo(() => {
        return rows.reduce<Record<string, string>>((acc, row) => {
            const distanceRaw = (row.distance || "").trim();
            if (!distanceRaw) {
                acc[row.id] = "Distance is required";
                return acc;
            }

            const distanceVal = parseFloat(distanceRaw);
            if (Number.isNaN(distanceVal)) {
                acc[row.id] = "Distance must be a valid number";
                return acc;
            }

            if (!hasValidMinFocus) {
                acc[row.id] = "Enter valid Min. Focus to Tabletop Distance";
                return acc;
            }

            if (distanceVal > minFocus) {
                acc[row.id] = `Distance must be <= ${minFocusDistance} cm`;
            }

            return acc;
        }, {});
    }, [rows, hasValidMinFocus, minFocus, minFocusDistance]);

    const computeRowResult = (row: Row, aecLimit: number, manualLimit: number): string => {
        const exposure = parseFloat(row.exposure);
        if (isNaN(exposure) || !row.remark) return "";
        const isPass =
            (row.remark === "AEC Mode" && exposure <= aecLimit) ||
            (row.remark === "Manual Mode" && exposure <= manualLimit);
        return isPass ? "PASS" : "FAIL";
    };

    // Compute PASS/FAIL for each row
    const rowsWithResult = useMemo(() => {
        const aecLimit = parseFloat(aecTolerance) || 0;
        const manualLimit = parseFloat(nonAecTolerance) || 0;
        return rows.map(row => ({
            ...row,
            result: computeRowResult(row, aecLimit, manualLimit),
        }));
    }, [rows, aecTolerance, nonAecTolerance]);

    const applySavedData = (testData: any) => {
        const savedRows = Array.isArray(testData?.rows) ? testData.rows : [];
        setTestId(testData?._id || propTestId || null);
        setRows(
            savedRows.length > 0
                ? savedRows.map((r: any, i: number) => ({
                    id: `${testData?._id || "row"}-${i}`,
                    distance: r.distance || "",
                    appliedKv: r.appliedKv || "",
                    appliedMa: r.appliedMa || "",
                    exposure: r.exposure || "",
                    remark: r.remark || "",
                }))
                : [{ id: "1", distance: "100", appliedKv: "80", appliedMa: "100", exposure: "", remark: "" }]
        );
        setAecTolerance(testData?.aecTolerance || "10");
        setNonAecTolerance(testData?.nonAecTolerance || "5");
        setMinFocusDistance(testData?.minFocusDistance || "30");
        setIsSaved(true);
        setIsEditing(false);
    };

    const applyCsvData = (source: any[]) => {
        const getField = (r: any) => String(r?.['Field Name'] ?? r?.fieldName ?? '').trim();
        const getValue = (r: any) => {
            const v = r?.['Value'] ?? r?.value;
            return v === undefined || v === null ? '' : String(v).trim();
        };
        const getRowIndex = (r: any) => {
            const n = parseInt(String(r?.['Row Index'] ?? r?.rowIndex ?? '0'), 10);
            return Number.isNaN(n) ? 0 : n;
        };
        const normalizeMode = (mode: string): Row['remark'] => {
            const m = String(mode || '').trim().toLowerCase();
            if (!m) return '';
            if (m === 'aec' || m === 'aec mode' || m.includes('aec')) return 'AEC Mode';
            if (m === 'manual' || m === 'manual mode' || m.includes('manual')) return 'Manual Mode';
            return '';
        };

        const tableRows = source.filter((r) => {
            const f = getField(r);
            return (
                f === 'Table1_kv' ||
                f === 'Table1_ma' ||
                f === 'Table2_Mode' ||
                f === 'Table1_Mode' ||
                f === 'Table2_MeasuredRate' ||
                f === 'Table1_Exposure' ||
                f === 'Table2_Distance' ||
                f === 'Table1_Distance'
            );
        });

        if (tableRows.length > 0) {
            const rowIndices = Array.from(new Set(tableRows.map((r) => getRowIndex(r)))).sort(
                (a, b) => a - b
            );

            // Build one UI row per Excel data row index that has measurement fields.
            // Tolerances are stored on row 0 separately (Table1_aecTolerance etc.) and must not
            // create an empty first measurement row when only row 0 has kv/ma from a bad parse.
            const measurementIndices = rowIndices.filter((idx) =>
                tableRows.some((r) => {
                    if (getRowIndex(r) !== idx) return false;
                    const f = getField(r);
                    return (
                        f === 'Table2_Mode' ||
                        f === 'Table1_Mode' ||
                        f === 'Table2_MeasuredRate' ||
                        f === 'Table1_Exposure' ||
                        f === 'Table2_Distance' ||
                        f === 'Table1_Distance' ||
                        f === 'Table1_kv' ||
                        f === 'Table1_ma'
                    );
                })
            );

            // If both 0 and >0 exist, keep all indices that have real row content (mode/rate/kv/ma/distance)
            const dataIndices =
                measurementIndices.length > 0 ? measurementIndices : rowIndices.filter((i) => i > 0);

            const newRows = (dataIndices.length > 0 ? dataIndices : rowIndices).map((idx, i): Row => {
                const kv = getValue(source.find((r) => getField(r) === 'Table1_kv' && getRowIndex(r) === idx));
                const ma = getValue(source.find((r) => getField(r) === 'Table1_ma' && getRowIndex(r) === idx));
                const exposure =
                    getValue(source.find((r) => getField(r) === 'Table2_MeasuredRate' && getRowIndex(r) === idx)) ||
                    getValue(source.find((r) => getField(r) === 'Table1_Exposure' && getRowIndex(r) === idx));
                const mode =
                    getValue(source.find((r) => getField(r) === 'Table2_Mode' && getRowIndex(r) === idx)) ||
                    getValue(source.find((r) => getField(r) === 'Table1_Mode' && getRowIndex(r) === idx));
                const distance =
                    getValue(source.find((r) => getField(r) === 'Table2_Distance' && getRowIndex(r) === idx)) ||
                    getValue(source.find((r) => getField(r) === 'Table1_Distance' && getRowIndex(r) === idx));

                return {
                    id: `${Date.now()}-${idx}-${i}`,
                    distance: String(distance),
                    appliedKv: String(kv),
                    appliedMa: String(ma),
                    exposure: String(exposure),
                    remark: normalizeMode(mode),
                };
            });
            const usable = newRows.filter(
                (r) =>
                    r.distance.trim() !== '' ||
                    r.appliedKv.trim() !== '' ||
                    r.appliedMa.trim() !== '' ||
                    r.exposure.trim() !== '' ||
                    r.remark !== ''
            );
            if (usable.length > 0) setRows(usable);
        }

        const aecTolVal = getValue(source.find((r) => getField(r) === 'Table1_aecTolerance'));
        if (aecTolVal) setAecTolerance(String(aecTolVal));

        const manualTolVal = getValue(source.find((r) => getField(r) === 'Table1_nonAecTolerance'));
        if (manualTolVal) setNonAecTolerance(String(manualTolVal));

        const minFocusVal = getValue(source.find((r) => getField(r) === 'Table1_minFocusDistance'));
        if (minFocusVal) setMinFocusDistance(String(minFocusVal));

        setIsSaved(false);
        setIsEditing(true);
    };

    const reloadSavedData = async (savedTestId?: string | null) => {
        if (savedTestId) {
            const byId = await getExposureRateTableTopByTestId(savedTestId);
            const testData = byId?.data || byId;
            if (testData?._id) {
                applySavedData(testData);
                return;
            }
        }
        const byService = await getExposureRateTableTopByServiceIdForInventionalRadiology(serviceId, tubeId);
        if (byService?._id) {
            applySavedData(byService);
        }
    };

    useEffect(() => {
        const loadTest = async () => {
            if (!serviceId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                let data = null;
                if (propTestId) {
                    data = await getExposureRateTableTopByTestId(propTestId);
                } else {
                    data = await getExposureRateTableTopByServiceIdForInventionalRadiology(serviceId, tubeId);
                }

                const testData = data ? (data?.data || data) : null;
                const hasSavedRows = Array.isArray(testData?.rows) && testData.rows.length > 0;

                // Excel/CSV upload takes priority so multi-row template data always fills the UI
                if (csvData && csvData.length > 0) {
                    applyCsvData(csvData);
                    if (testData?._id) setTestId(testData._id);
                    return;
                }

                if (testData?._id && hasSavedRows) {
                    applySavedData(testData);
                    return;
                }

                if (testData?._id) {
                    applySavedData(testData);
                    return;
                }

                setIsSaved(false);
                setIsEditing(true);
            } catch (err) {
                console.error("Load failed:", err);
                if (csvData && csvData.length > 0) {
                    applyCsvData(csvData);
                } else {
                    setIsSaved(false);
                    setIsEditing(true);
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadTest();
    }, [propTestId, serviceId, tubeId, csvData]);

    // Save handler
    const handleSave = async () => {
        if (rows.some(r => !r.exposure.trim() || !r.remark)) {
            toast.error("Please fill exposure and select mode for all rows");
            return;
        }

        if (!hasValidMinFocus) {
            toast.error("Please enter a valid Min. Focus to Tabletop Distance");
            return;
        }

        const invalidDistanceRow = rows.find((r) => Boolean(distanceValidationByRow[r.id]));

        if (invalidDistanceRow) {
            toast.error(
                `Distance (cm) must be less than or equal to Min. Focus to Tabletop Distance (${minFocusDistance} cm)`
            );
            return;
        }

        const aecLimit = parseFloat(aecTolerance) || 0;
        const manualLimit = parseFloat(nonAecTolerance) || 0;
        const payload = {
            rows: rows.map(r => ({
                distance: r.distance.trim(),
                appliedKv: r.appliedKv.trim(),
                appliedMa: r.appliedMa.trim(),
                exposure: r.exposure.trim(),
                remark: r.remark,
                result: computeRowResult(r, aecLimit, manualLimit),
            })),
            aecTolerance: aecTolerance.trim(),
            nonAecTolerance: nonAecTolerance.trim(),
            minFocusDistance: minFocusDistance.trim(),
            tubeId: tubeId || null,
        };

        setIsSaving(true);
        try {
            let savedTestId = testId;
            if (testId) {
                await updateExposureRateTableTop(testId, payload);
                toast.success("Updated successfully!");
            } else {
                const res = await addExposureRateTableTop(serviceId, payload);
                savedTestId = res?.data?.testId || res?.data?._id || res?.testId || null;
                setTestId(savedTestId);
                onTestSaved?.(savedTestId || "");
                toast.success("Saved successfully!");
            }
            await reloadSavedData(savedTestId);
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
            <h2 className="text-2xl font-bold text-gray-800">Exposure Rate at Table Top</h2>

            {/* Dynamic Table */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900  tracking-wider border-r">Distance (cm)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900  tracking-wider border-r">Applied kV</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900  tracking-wider border-r">Applied mA</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900  tracking-wider border-r">Exposure (cGy/Min)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900  tracking-wider border-r">Mode</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900  tracking-wider">Result</th>
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
                                            className={`w-full px-3 py-2 text-center border rounded-md text-sm ${isViewOnly ? "bg-gray-50" : ""} ${!isViewOnly && distanceValidationByRow[row.id] ? "border-red-500" : ""}`}
                                        />
                                        {!isViewOnly && distanceValidationByRow[row.id] && (
                                            <p className="mt-1 text-xs text-red-600">{distanceValidationByRow[row.id]}</p>
                                        )}
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
                                    : hasValidMinFocus
                                        ? "border-purple-400 text-purple-900 bg-white"
                                        : "border-red-500 text-purple-900 bg-white"
                                    }`}
                            />
                            <span className="text-lg font-bold text-purple-800">cm</span>
                        </div>
                        {!isViewOnly && !hasValidMinFocus && (
                            <p className="mt-1 text-xs text-red-600">Enter a valid value greater than 0</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6">
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
        </div>
    );
};

export default ExposureRateAtTableTop;
