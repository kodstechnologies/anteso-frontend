// components/TestTables/MaxRadiationLevel.tsx
'use client';

import React, { useState, useEffect } from "react";

interface LocationData {
  location: string;
  mRPerHr: string;
  result: string; // Now shows: "Pass (≤ 2 mR/hr)" or "Fail (> 0.2 mR/hr)" or "—"
}

const MaxRadiationLevel: React.FC = () => {
  const fixedLocations = [
    "Control Console (Operator Position)",
    "Behind Chest Stand (if applicable)",
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

  // Auto-calculate result with limit included
  useEffect(() => {
    const updated = data.map((item) => {
      const hr = parseFloat(item.mRPerHr) || 0;
      const isWorkerArea = item.location.includes("Control Console") || item.location.includes("Behind Chest Stand");
      const limit = isWorkerArea ? 2 : 0.2;
      const limitText = isWorkerArea ? "≤ 2 mR/hr" : "≤ 0.2 mR/hr";

      let result = "";
      if (hr > 0 && hr <= limit) {
        result = `Pass (${limitText})`;
      } else if (hr > limit) {
        result = `Fail (> ${limit} mR/hr)`;
      }

      return { ...item, result };
    });
    setData(updated);
  }, [data.map((d) => d.mRPerHr).join()]);

  const handleInputChange = (index: number, value: string) => {
    const newData = [...data];
    newData[index].mRPerHr = value;
    setData(newData);
  };

  // Weekly dose calculation (AERB standard)
  const calculateWeeklyDose = (mRPerHr: string) => {
    const hr = parseFloat(mRPerHr) || 0;
    if (hr <= 0) return "0.000";
    return ((hr * 25000) / 60 / 100).toFixed(3);
  };

  const workerReadings = data.slice(0, 2);
  const publicReadings = data.slice(2);

  const maxWorkerWeekly = Math.max(
    ...workerReadings.map((d) => parseFloat(calculateWeeklyDose(d.mRPerHr)) || 0),
    0
  ).toFixed(3);

  const maxPublicWeekly = Math.max(
    ...publicReadings.map((d) => parseFloat(calculateWeeklyDose(d.mRPerHr)) || 0),
    0
  ).toFixed(3);

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Maximum Radiation Level Survey</h2>

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
                <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                  {row.location}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    step="0.001"
                    value={row.mRPerHr}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    className="w-full max-w-xs mx-auto px-3 py-2 text-center border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  {row.result ? (
                    <span
                      className={`inline-flex px-4 py-1.5 text-xs font-bold rounded-full ${
                        row.result.includes("Pass")
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.result}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 shadow-md">
          <h4 className="text-lg font-semibold text-blue-900">
            Max Radiation Level (Radiation Worker Area)
          </h4>
          <p className="text-3xl font-bold text-blue-800 mt-2">
            {maxWorkerWeekly} <span className="text-lg font-normal">mR/week</span>
          </p>
          <p className="text-sm text-blue-700 mt-1">Limit: ≤ 40 mR/week</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200 shadow-md">
          <h4 className="text-lg font-semibold text-purple-900">
            Max Radiation Level (Public Area)
          </h4>
          <p className="text-3xl font-bold text-purple-800 mt-2">
            {maxPublicWeekly} <span className="text-lg font-normal">mR/week</span>
          </p>
          <p className="text-sm text-purple-700 mt-1">Limit: ≤ 2 mR/week</p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 text-sm text-amber-900">
        <p className="font-bold text-amber-800 mb-2">Permissible Dose Limits (AERB/ICRP):</p>
        <ul className="list-disc list-inside space-y-1 text-amber-800">
          <li>
            <strong>Radiation Worker:</strong> 20 mSv/year ≈ <strong>40 mR/week</strong> (≤ 2 mR/hr at console)
          </li>
          <li>
            <strong>Member of Public:</strong> 1 mSv/year ≈ <strong>2 mR/week</strong> (≤ 0.2 mR/hr in public areas)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MaxRadiationLevel;