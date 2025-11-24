'use client';

import React, { useState, useEffect } from "react";

interface LocationData {
  location: string;
  mRPerHr: string;
  result: "Pass" | "Fail" | "";
}

const MaximumRadiationLevel: React.FC = () => {
  // Updated locations as per your requirement
  const fixedLocations = [
    "Control Console (Operator Position)",
    "Behind Lead Glass",
    "Technician Entrance Door",
    "Outside Patient Entrance Door",
    "Patient Waiting Area",
  ];

  const [data, setData] = useState<LocationData[]>(
    fixedLocations.map((loc) => ({
      location: loc,
      mRPerHr: "",
      result: "",
    }))
  );

  // Auto-calculate Pass/Fail
  useEffect(() => {
    const updated = data.map((item) => {
      const value = parseFloat(item.mRPerHr) || 0;
      const limit = item.location.includes("Control Console") || item.location.includes("Behind Lead Glass")
        ? 2     // Worker area
        : 0.2;  // Public area

      const result: "Pass" | "Fail" | "" = value > 0 && value <= limit
        ? "Pass"
        : value > limit
          ? "Fail"
          : "";

      return { ...item, result };
    });
    setData(updated);
  }, [data.map((d) => d.mRPerHr).join()]);

  const handleInputChange = (index: number, value: string) => {
    const newData = [...data];
    newData[index].mRPerHr = value;
    setData(newData);
  };

  // Standard AERB conversion: mR/hr → mR/week (25000 pulses/year assumed)
  const calculateWeeklyDose = (mRPerHr: string) => {
    const hr = parseFloat(mRPerHr) || 0;
    if (hr <= 0) return 0;
    return ((hr * 25000) / 60 / 100).toFixed(3); // → mR/week
  };

  const weeklyDoses = data.map((item) => calculateWeeklyDose(item.mRPerHr));
  const maxWeeklyDose = Math.max(...weeklyDoses.map(Number), 0).toFixed(3);

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800">
        Maximum Radiation Level Survey
      </h2>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Measured Radiation Level (mR/hr)
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  {row.location}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    step="0.001"
                    value={row.mRPerHr}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    className="w-full max-w-xs mx-auto px-3 py-2 text-center border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.000"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex px-4 py-1.5 text-xs font-bold rounded-full ${row.result === "Pass"
                        ? "bg-green-100 text-green-800"
                        : row.result === "Fail"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {row.result || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Single Summary Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-300 shadow-md text-center">
          <h4 className="text-lg font-semibold text-indigo-900">
            Maximum Radiation Level/week (mR/wk)
          </h4>
          <p className="text-4xl font-bold text-indigo-800 mt-3">
            {maxWeeklyDose}
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 text-sm text-amber-900">
        <p className="font-bold text-amber-800 mb-2">
          Permissible Dose Limits (AERB/ICRP):
        </p>
        <ul className="list-disc list-inside space-y-1 text-amber-800">
          <li>
            <strong>Radiation Worker Areas</strong> (Control Console, Behind Lead Glass): ≤ 2 mR/hr → ~40 mR/week
          </li>
          <li>
            <strong>Public Areas</strong> (Doors, Waiting Area): ≤ 0.2 mR/hr → ~2 mR/week
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MaximumRadiationLevel;