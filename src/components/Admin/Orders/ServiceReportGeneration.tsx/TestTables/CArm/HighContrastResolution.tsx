// src/components/TestTables/HighContrastResolutionForCArm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createHighContrastResolutionForCArm,
  getHighContrastResolutionForCArm,
  getHighContrastResolutionByServiceIdForCArm,
  updateHighContrastResolutionForCArm,
} from "../../../../../../api";

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const HighContrastResolutionForCArm: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [measuredLpPerMm, setMeasuredLpPerMm] = useState<string>('');
  const [recommendedStandard, setRecommendedStandard] = useState<string>('1.50');

  // PASS if Measured > Recommended Standard (higher resolution = better)
  const remark = useMemo(() => {
    const measured = parseFloat(measuredLpPerMm);
    const standard = parseFloat(recommendedStandard);

    if (isNaN(measured) || isNaN(standard)) return '';

    return measured > standard ? 'PASS' : 'FAIL';
  }, [measuredLpPerMm, recommendedStandard]);

  // Load existing test data
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;

        if (propTestId) {
          data = await getHighContrastResolutionForCArm(propTestId);
        } else {
          data = await getHighContrastResolutionByServiceIdForCArm(serviceId);
        }

        if (data) {
          setTestId(data._id || data.testId);
          setMeasuredLpPerMm(data.measuredLpPerMm || '');
          setRecommendedStandard(data.recommendedStandard || '1.50');
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Load failed:", err);
        setIsSaved(false);
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [propTestId, serviceId]);

  // Save / Update
  const handleSave = async () => {
    if (!measuredLpPerMm.trim()) {
      toast.error("Please enter the measured resolution (lp/mm)");
      return;
    }
    if (!recommendedStandard.trim()) {
      toast.error("Please enter the recommended standard");
      return;
    }

    setIsSaving(true);
    const payload = {
      measuredLpPerMm: measuredLpPerMm.trim(),
      recommendedStandard: recommendedStandard.trim(),
    };

    try {
      if (testId) {
        await updateHighContrastResolutionForCArm(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createHighContrastResolutionForCArm(serviceId, payload);
        const newId = res.data?._id || res.data?.testId;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success("Saved successfully!");
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => setIsEditing(true);
  const isViewOnly = isSaved && !isEditing;

  const buttonText = !isSaved ? 'Save Test' : isEditing ? 'Update Test' : 'Edit Test';
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">High Contrast Resolution</h2>

        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewOnly
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-4 h-4" />
              {buttonText}
            </>
          )}
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-40">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Unit / Requirement
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Measured Value */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Bar strips resolved on the monitor
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={measuredLpPerMm}
                  onChange={(e) => setMeasuredLpPerMm(e.target.value)}
                  disabled={isViewOnly}
                  className={`w-full text-center px-4 py-2 border rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  placeholder="1.60"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                lp/mm (higher is better)
              </td>
            </tr>

            {/* Recommended Standard */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Recommended performance standard
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={recommendedStandard}
                  onChange={(e) => setRecommendedStandard(e.target.value)}
                  disabled={isViewOnly}
                  className={`w-full text-center px-4 py-2 border rounded-md bg-blue-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'cursor-not-allowed' : ''
                    }`}
                  placeholder="1.50"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                Minimum required resolution
              </td>
            </tr>
          </tbody>
        </table>

        {/* Result Section */}
        <div className="px-6 py-8 bg-gray-50 border-t">
          <div className="text-center space-y-6">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-700 mb-4">Result</span>
              <span
                className={`inline-flex px-16 py-6 text-md font-extrabold rounded-full shadow-xl border-4 ${remark === 'PASS'
                    ? 'bg-green-100 text-green-800 border-green-400'
                    : remark === 'FAIL'
                      ? 'bg-red-100 text-red-800 border-red-400'
                      : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}
              >
                {remark || '—'}
              </span>
            </div>

            {/* Acceptance Criteria */}
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 max-w-2xl mx-auto">
              <p className="text-lg font-semibold text-blue-900">
                Acceptance Criteria:
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-800">
                Measured Resolution <span className="text-teal-600">&gt;</span> Recommended Standard
              </p>
              {remark && (
                <p className="mt-4 text-xl">
                  {measuredLpPerMm} lp/mm {' > '} {recommendedStandard} lp/mm →{' '}
                  <span className={remark === 'PASS' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {remark}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolutionForCArm;