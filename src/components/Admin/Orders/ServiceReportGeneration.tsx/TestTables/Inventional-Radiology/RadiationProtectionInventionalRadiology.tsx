'use client';

import React from "react";

interface RadiationProtectionInterventionalRadiologyProps {
  surveyDate?: string;
  surveyMeterModel?: string;
  calibrationCertificateValid?: string;
  leadApronsAvailable?: string;
  thyroidShieldsAvailable?: string;
  leadGlassesAvailable?: string;
  ceilingSuspendedShield?: string;
  tableLeadCurtain?: string;
  doseAreaProductMeter?: string;
  patientDoseMonitoring?: string;

  onSurveyDateChange?: (date: string) => void;
  onSurveyMeterModelChange?: (value: string) => void;
  onCalibrationCertificateValidChange?: (value: string) => void;
  onLeadApronsAvailableChange?: (value: string) => void;
  onThyroidShieldsAvailableChange?: (value: string) => void;
  onLeadGlassesAvailableChange?: (value: string) => void;
  onCeilingSuspendedShieldChange?: (value: string) => void;
  onTableLeadCurtainChange?: (value: string) => void;
  onDoseAreaProductMeterChange?: (value: string) => void;
  onPatientDoseMonitoringChange?: (value: string) => void;
}

const RadiationProtectionInterventionalRadiology: React.FC<RadiationProtectionInterventionalRadiologyProps> = ({
  surveyDate = "",
  surveyMeterModel = "",
  calibrationCertificateValid = "",
  leadApronsAvailable = "",
  thyroidShieldsAvailable = "",
  leadGlassesAvailable = "",
  ceilingSuspendedShield = "",
  tableLeadCurtain = "",
  doseAreaProductMeter = "",
  patientDoseMonitoring = "",
  onSurveyDateChange,
  onSurveyMeterModelChange,
  onCalibrationCertificateValidChange,
  onLeadApronsAvailableChange,
  onThyroidShieldsAvailableChange,
  onLeadGlassesAvailableChange,
  onCeilingSuspendedShieldChange,
  onTableLeadCurtainChange,
  onDoseAreaProductMeterChange,
  onPatientDoseMonitoringChange,
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
              Value / Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Date of Radiation Protection Survey
            </td>
            <td className="px-4 py-3">
              <input
                type="date"
                value={surveyDate}
                onChange={(e) => onSurveyDateChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Radiation Survey Meter Model & Serial No.
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={surveyMeterModel}
                onChange={(e) => onSurveyMeterModelChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Victoreen 451P, S/N: 123456"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Survey Meter has Valid Calibration Certificate
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={calibrationCertificateValid}
                onChange={(e) => onCalibrationCertificateValidChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yes / No / N/A"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Lead Aprons (0.5 mm Pb eq.) Available
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={leadApronsAvailable}
                onChange={(e) => onLeadApronsAvailableChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yes / No / Quantity"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Thyroid Shields Available
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={thyroidShieldsAvailable}
                onChange={(e) => onThyroidShieldsAvailableChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yes / No"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Lead Glasses (0.75 mm Pb eq.) Available
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={leadGlassesAvailable}
                onChange={(e) => onLeadGlassesAvailableChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yes / No"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Ceiling Suspended Protective Screen
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={ceilingSuspendedShield}
                onChange={(e) => onCeilingSuspendedShieldChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Available / Not Available"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Table-mounted Lead Curtain / Drape
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={tableLeadCurtain}
                onChange={(e) => onTableLeadCurtainChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Available / Not Available"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Dose Area Product (DAP) Meter Installed
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={doseAreaProductMeter}
                onChange={(e) => onDoseAreaProductMeterChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yes / No"
              />
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top">
              Real-time Patient Dose Monitoring System
            </td>
            <td className="px-4 py-3">
              <input
                type="text"
                value={patientDoseMonitoring}
                onChange={(e) => onPatientDoseMonitoringChange?.(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Available / Not Available"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RadiationProtectionInterventionalRadiology;