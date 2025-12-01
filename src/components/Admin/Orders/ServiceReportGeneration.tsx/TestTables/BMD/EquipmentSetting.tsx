'use client';

import React from "react";

interface EquipmentSettingProps {
  appliedCurrent?: string;
  appliedVoltage?: string;
  exposureTime?: string;
  focalSpotSize?: string;
  filtration?: string;
  collimation?: string;
  frameRate?: string;
  pulseWidth?: string;

  onAppliedCurrentChange?: (value: string) => void;
  onAppliedVoltageChange?: (value: string) => void;
  onExposureTimeChange?: (value: string) => void;
  onFocalSpotSizeChange?: (value: string) => void;
  onFiltrationChange?: (value: string) => void;
  onCollimationChange?: (value: string) => void;
  onFrameRateChange?: (value: string) => void;
  onPulseWidthChange?: (value: string) => void;
}

const EquipmentSetting: React.FC<EquipmentSettingProps> = ({
  appliedCurrent = "",
  appliedVoltage = "",
  exposureTime = "",
  focalSpotSize = "",
  filtration = "",
  collimation = "",
  frameRate = "",
  pulseWidth = "",
  onAppliedCurrentChange,
  onAppliedVoltageChange,
  onExposureTimeChange,
  onFocalSpotSizeChange,
  onFiltrationChange,
  onCollimationChange,
  onFrameRateChange,
  onPulseWidthChange,
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
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Applied Current (mA)
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={appliedCurrent}
                onChange={(e) => onAppliedCurrentChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5–15"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Applied Voltage (kV)
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={appliedVoltage}
                onChange={(e) => onAppliedVoltageChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 70–120"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Exposure Time / Pulse Width (ms)
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={exposureTime}
                onChange={(e) => onExposureTimeChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3–50"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Focal Spot Size (mm)
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={focalSpotSize}
                onChange={(e) => onFocalSpotSizeChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 0.3 / 0.6 / 1.0"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Total Filtration (mm Al eq.)
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={filtration}
                onChange={(e) => onFiltrationChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. ≥2.5"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Collimation
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={collimation}
                onChange={(e) => onCollimationChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Automatic / Manual"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Frame Rate (fps)
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={frameRate}
                onChange={(e) => onFrameRateChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3–30"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Pulse Width (ms) in Pulsed Mode
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={pulseWidth}
                onChange={(e) => onPulseWidthChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3–10"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentSetting;