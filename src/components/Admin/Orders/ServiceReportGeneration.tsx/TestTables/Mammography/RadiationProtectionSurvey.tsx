// src/components/TestTables/DetailsOfRadiationProtection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addRadiationProtectionSurveyForMammography,
  getRadiationProtectionSurveyByServiceIdForMammography,
  updateRadiationProtectionSurveyForMammography,
} from '../../../../../../api';

interface Props {
  serviceId: string;
  onRefresh?: () => void;
}

const DetailsOfRadiationProtection: React.FC<Props> = ({ serviceId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(null);
  const [surveyDate, setSurveyDate] = useState<string>('');
  const [hasValidCalibration, setHasValidCalibration] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  const isViewMode = hasSaved && !isEditing;

  // Load existing data
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getRadiationProtectionSurveyByServiceIdForMammography(serviceId);
        if (data) {
          setSurveyDate(data.surveyDate ? new Date(data.surveyDate).toISOString().split('T')[0] : '');
          setHasValidCalibration(data.hasValidCalibration || '');
          setTestId(data._id);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (err) {
        console.error('Failed to load radiation protection survey:', err);
        toast.error('Failed to load survey data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [serviceId]);

  const handleSave = async () => {
    if (!surveyDate.trim()) {
      toast.error('Please select a survey date');
      return;
    }
    if (!hasValidCalibration.trim()) {
      toast.error('Please enter calibration status');
      return;
    }

    setIsSaving(true);

    const payload = {
      surveyDate,
      hasValidCalibration: hasValidCalibration.trim(),
    };

    try {
      if (testId) {
        await updateRadiationProtectionSurveyForMammography(testId, payload);
        toast.success('Updated successfully!');
      } else {
        const res = await addRadiationProtectionSurveyForMammography(serviceId, payload);
        setTestId(res.data._id);
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-lg border">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="ml-3 text-gray-600">Loading Radiation Protection Survey...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
      {/* Header with Title + Action Button */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <h2 className="text-xl font-bold text-blue-900">
          Details of Radiation Protection Survey
        </h2>

        <div className="flex items-center gap-3">
          {isSaving && <span className="text-sm text-gray-600">Saving...</span>}

          {isViewMode && (
            <button
              onClick={toggleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}

          {!isViewMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {hasSaved ? 'Update' : 'Save'} Survey
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Parameter
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Date of Survey */}
          <tr className="hover:bg-gray-50 transition">
            <td className="px-6 py-5 text-sm font-medium text-gray-800 align-top">
              Date of Radiation Protection Survey
            </td>
            <td className="px-6 py-5">
              <input
                type="date"
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
                readOnly={isViewMode}
                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                    ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
              />
            </td>
          </tr>

          {/* Calibration Certificate */}
          <tr className="hover:bg-gray-50 transition">
            <td className="px-6 py-5 text-sm font-medium text-gray-800 align-top">
              Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate:
            </td>
            <td className="px-6 py-5">
              <input
                type="text"
                value={hasValidCalibration}
                onChange={(e) => setHasValidCalibration(e.target.value)}
                readOnly={isViewMode}
                placeholder="e.g. Yes, No, N/A"
                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                    ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Optional Footer Note */}
      <div className="px-6 py-4 bg-amber-50 border-t text-sm text-amber-800">
        <p className="font-medium">
          Note: Ensure the survey meter has a valid calibration certificate from an AERB-accredited laboratory.
        </p>
      </div>
    </div>
  );
};

export default DetailsOfRadiationProtection;