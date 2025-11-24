// src/components/TestTables/DetailsOfRadiationProtection.tsx
import React from "react";

interface DetailsOfRadiationProtectionMammographyProps {
  /** ISO date string (e.g. "2025-11-15") – will be used as default value */
  surveyDate?: string;
  /** Yes/No or any string – e.g. "Yes", "No", "N/A" */
  hasValidCalibration?: string;

  /** Called when user changes the date */
  onSurveyDateChange?: (date: string) => void;
  /** Called when user changes the calibration status */
  onCalibrationChange?: (value: string) => void;
}

const DetailsOfRadiationProtectionMammography: React.FC<DetailsOfRadiationProtectionMammographyProps> = ({
  surveyDate = "",
  hasValidCalibration = "",
  onSurveyDateChange,
  onCalibrationChange,
}) => {
  return (
    <div className="w-full bg-white rounded-lg border border-gray-300 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Parameter
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Row 1: Date of Survey */}
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Date of Radiation Protection Survey
            </td>
            <td className="px-4 py-3">
              <input
                type="date"
                defaultValue={surveyDate}
                onChange={(e) => onSurveyDateChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select date"
              />
            </td>
          </tr>

          {/* Row 2: Calibration Certificate */}
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate:
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                defaultValue={hasValidCalibration}
                onChange={(e) => onCalibrationChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Yes, No, N/A"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DetailsOfRadiationProtectionMammography;