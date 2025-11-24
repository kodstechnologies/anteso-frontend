// src/components/TestTables/EquipementSetting.tsx
import React from "react";

interface EquipementSettingMammographyProps {
    /** Applied Current in mA */
    appliedCurrent?: string;
    /** Applied Voltage in kV */
    appliedVoltage?: string;
    /** Exposure Time in seconds */
    exposureTime?: string;
    /** Workload in mA min/week */
    workload?: string;

    /** Callbacks */
    onAppliedCurrentChange?: (value: string) => void;
    onAppliedVoltageChange?: (value: string) => void;
    onExposureTimeChange?: (value: string) => void;
    onWorkloadChange?: (value: string) => void;
}

const EquipementSettingMammography: React.FC<EquipementSettingMammographyProps> = ({
    appliedCurrent = "",
    appliedVoltage = "",
    exposureTime = "",
    workload = "",
    onAppliedCurrentChange,
    onAppliedVoltageChange,
    onExposureTimeChange,
    onWorkloadChange,
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
                    {/* Applied Current (mA) */}
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
                            Applied Current (mA)
                        </td>
                        <td className="px-4 py-3">
                            <input
                                type="number"
                                step="0.1"
                                defaultValue={appliedCurrent}
                                onChange={(e) => onAppliedCurrentChange?.(e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 100"
                            />
                        </td>
                    </tr>

                    {/* Applied Voltage (kV) */}
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
                            Applied Voltage (kV)
                        </td>
                        <td className="px-4 py-3">
                            <input
                                type="number"
                                step="0.1"
                                defaultValue={appliedVoltage}
                                onChange={(e) => onAppliedVoltageChange?.(e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 80"
                            />
                        </td>
                    </tr>

                    {/* Exposure Time (s) */}
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
                            Exposure Time (s)
                        </td>
                        <td className="px-4 py-3">
                            <input
                                type="number"
                                step="0.001"
                                defaultValue={exposureTime}
                                onChange={(e) => onExposureTimeChange?.(e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 0.5"
                            />
                        </td>
                    </tr>

                    {/* Workload (mA min/week) */}
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
                            Workload (mA min/week)
                        </td>
                        <td className="px-4 py-3">
                            <input
                                type="number"
                                step="1"
                                defaultValue={workload}
                                onChange={(e) => onWorkloadChange?.(e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 300"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default EquipementSettingMammography;