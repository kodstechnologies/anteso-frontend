// src/components/TestTables/MeasureMaxRadiationLevel.tsx
import React, { useState, useEffect } from "react";

interface LocationData {
    location: string;
    mRPerHr: string;
    mRPerWeek: string;
    result: "Pass" | "Fail" | "";
    permissibleLimit: string;
}

const MeasureMaxRadiationLevel: React.FC = () => {
    // Fixed locations
    const fixedLocations = [
        // Group 1: ≤ 2 mR/hr
        "Control Console (Operator Position)",
        "Outside Lead Glass / View Window",
        "Outside Console Wall",
        "Gantry to Console Door Left",
        "Gantry to Console",
        // Group 2: ≤ 0.2 mR/hr
        "Outside Patient Entrance Door Left",
        "Outside Patient Entrance Door Centre",
        "Outside Patient Entrance Door Right",
        "Patient Waiting Area",
        "Bihind Windows (if applicable)",
    ];

    const [data, setData] = useState<LocationData[]>(
        fixedLocations.map((loc) => ({
            location: loc,
            mRPerHr: "",
            mRPerWeek: "",
            result: "",
            permissibleLimit:
                loc.includes("Control Console") ||
                    loc.includes("Outside Lead Glass") ||
                    loc.includes("Outside Console Wall") ||
                    loc.includes("Gantry to Console Door Left") ||
                    loc.includes("Gantry to Console")
                    ? "≤ 2 mR/hr"
                    : "≤ 0.2 mR/hr",
        }))
    );

    useEffect(() => {
        const updated = data.map((item) => {
            const hr = parseFloat(item.mRPerHr) || 0;


            const rawWeek = ((hr * 25000) / 60) / 100;
            const mRPerWeek = (Math.floor(rawWeek * 1000) / 1000).toFixed(3)
            // ----- Result (Pass/Fail) -----
            const limit = item.permissibleLimit === "≤ 2 mR/hr" ? 2 : 0.2;
            const result: "Pass" | "Fail" | "" = hr <= limit && hr >= 0 ? "Pass" : "Fail";

            return { ...item, mRPerWeek, result };
        });
        setData(updated);
    }, [data.map((d) => d.mRPerHr).join()]);

    const handleInputChange = (index: number, value: string) => {
        const newData = [...data];
        newData[index].mRPerHr = value;
        setData(newData);
    };


    const workerMax = Math.max(
        ...data.slice(0, 5).map((d) => parseFloat(d.mRPerWeek) || 0),
        0
    ).toFixed(3);

    const publicMax = Math.max(
        ...data.slice(5).map((d) => parseFloat(d.mRPerWeek) || 0),
        0
    ).toFixed(3);

    return (
        <div className="w-full space-y-6">
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                Radiation Level (mR/hr)
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                Radiation Level (mR/week)
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                Result
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                Permissible Limit
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                    {row.location}
                                </td>

                                {/* mR/hr input */}
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={row.mRPerHr}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        className="w-full px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </td>

                                <td className="px-4 py-3 text-center text-sm text-gray-700 font-medium">
                                    {row.mRPerWeek}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${row.result === "Pass"
                                            ? "bg-green-100 text-green-800"
                                            : row.result === "Fail"
                                                ? "bg-red-100 text-red-800"
                                                : "text-gray-400"
                                            }`}
                                    >
                                        {row.result || "—"}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-center text-sm text-gray-600">
                                    {row.permissibleLimit}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900">
                        Maximum Radiation Level/week (mR/wk) For Radiation Worker
                    </h4>
                    <p className="text-xl font-bold text-blue-800 mt-1">
                        {workerMax} mR/week
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900">
                        Maximum Radiation Level/week (mR/wk) For Public
                    </h4>
                    <p className="text-xl font-bold text-purple-800 mt-1">
                        {publicMax} mR/week
                    </p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                <p className="font-medium mb-1">Permissible Limits:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                        For location radiation worker:{" "}
                        <strong>20 mSv in a year (40 mR/week)</strong>
                    </li>
                    <li>
                        For location of member of public:{" "}
                        <strong>1 mSv in a year (2 mR/week)</strong>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default MeasureMaxRadiationLevel;