// src/components/TestTables/LowContrastResolutionForCArm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createLowContrastResolutionForCArm,
  getLowContrastResolutionForCArm,
  getLowContrastResolutionByServiceIdForCArm,
  updateLowContrastResolutionForCArm,
} from "../../../../../../api";

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const LowContrastResolutionForCArm: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [smallestHoleSize, setSmallestHoleSize] = useState<string>('');
  const [recommendedStandard, setRecommendedStandard] = useState<string>('3.0');
  const [tolerance, setTolerance] = useState<string>('');

  // Parse tolerance (±5%, +10%, 5%, etc.)
  const parseTolerance = (tol: string): { value: number; isPlusMinus: boolean } | null => {
    if (!tol.trim()) return null;
    const cleaned = tol.trim().replace('%', '').trim();
    const match = cleaned.match(/^([±+-]?\d*\.?\d+)$/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    if (isNaN(num)) return null;
    const isPlusMinus = cleaned.includes('±');
    return { value: Math.abs(num), isPlusMinus };
  };

  // Auto compute PASS/FAIL — smaller hole = better
  const remark = useMemo(() => {
    const measured = parseFloat(smallestHoleSize);
    const standard = parseFloat(recommendedStandard);

    if (isNaN(measured) || isNaN(standard)) return '';
    if (!tolerance.trim()) return 'Tolerance required';

    const parsed = parseTolerance(tolerance);
    if (!parsed) return 'Invalid tolerance';

    const { value: tolPercent, isPlusMinus } = parsed;
    const tolAmount = (standard * tolPercent) / 100;

    const upperLimit = standard + tolAmount;           // Acceptable upper bound (worse)
    const lowerLimit = isPlusMinus ? standard - tolAmount : 0;

    const isPass = measured <= upperLimit && measured >= lowerLimit;

    return isPass ? 'PASS' : 'FAIL';
  }, [smallestHoleSize, recommendedStandard, tolerance]);

  // Load existing test
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;

        if (propTestId) {
          data = await getLowContrastResolutionForCArm(propTestId);
        } else {
          data = await getLowContrastResolutionByServiceIdForCArm(serviceId);
        }

        if (data) {
          setTestId(data._id);
          setSmallestHoleSize(data.smallestHoleSize || '');
          setRecommendedStandard(data.recommendedStandard || '3.0');
          setTolerance(data.tolerance || '');
          setIsSaved(true);
          setIsEditing(false); // Start in view mode when data exists
        } else {
          setIsSaved(false);
          setIsEditing(true); // Start in edit mode when no data exists
        }
      } catch (err) {
        console.error("Load failed:", err);
        setIsSaved(false);
        setIsEditing(true); // Start in edit mode on error
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [propTestId, serviceId]);

  // Save / Update
  const handleSave = async () => {
    if (!smallestHoleSize.trim()) {
      toast.error("Please enter smallest hole size");
      return;
    }
    if (!tolerance.trim()) {
      toast.error("Please enter tolerance");
      return;
    }

    setIsSaving(true);
    const payload = {
      smallestHoleSize: smallestHoleSize.trim(),
      recommendedStandard: recommendedStandard.trim(),
      tolerance: tolerance.trim(),
    };

    try {
      if (testId) {
        await updateLowContrastResolutionForCArm(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createLowContrastResolutionForCArm(serviceId, payload);
        const newId = res.data?._id || res.data?.testId;
        setTestId(newId);
        onTestSaved?.(newId);
        toast.success("Saved successfully!");
      }
      setIsSaved(true);
      setIsEditing(false); // Switch to view mode after saving
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const isViewOnly = isSaved && !isEditing;

  // Determine button text and icon based on current state
  const getButtonConfig = () => {
    if (!isSaved) {
      return { text: 'Save Test', icon: Save };
    } else if (isEditing) {
      return { text: 'Update Test', icon: Save };
    } else {
      return { text: 'Edit Test', icon: Edit3 };
    }
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Low Contrast Resolution</h2>

        <button
          onClick={isViewOnly ? startEditing : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewOnly
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700'
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
              {buttonConfig.text}
            </>
          )}
        </button>
      </div>

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
                Diameter of smallest hole clearly resolved
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={smallestHoleSize}
                  onChange={(e) => setSmallestHoleSize(e.target.value)}
                  disabled={isViewOnly}
                  className={`w-full text-center px-4 py-2 border rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  placeholder="2.5"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                mm (smaller = better)
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
                  className={`w-full text-center px-4 py-2 border rounded-md bg-blue-50 font-medium ${isViewOnly ? 'cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                    }`}
                  placeholder="3.0"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                Maximum acceptable hole size
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tolerance & Result */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Tolerance:</span>
              <input
                type="text"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                disabled={isViewOnly}
                className={`w-48 px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                placeholder="e.g. ±5%, +10%"
              />
            </div>

            {/* Final Result */}
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-700">Result:</span>
              <span
                className={`inline-flex px-6 py-3 text-xl font-bold rounded-full ${remark === 'PASS'
                    ? 'bg-green-100 text-green-800'
                    : remark === 'FAIL'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {remark || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Show acceptance range */}
      {remark && !remark.includes('required') && !remark.includes('Invalid') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Acceptance Range:</strong>{' '}
          {parseTolerance(tolerance)?.isPlusMinus
            ? `${(
              parseFloat(recommendedStandard) -
              (parseFloat(recommendedStandard) * parseTolerance(tolerance)!.value) / 100
            ).toFixed(2)} – ${(
              parseFloat(recommendedStandard) +
              (parseFloat(recommendedStandard) * parseTolerance(tolerance)!.value) / 100
            ).toFixed(2)} mm`
            : `≤ ${(
              parseFloat(recommendedStandard) +
              (parseFloat(recommendedStandard) * parseTolerance(tolerance)!.value) / 100
            ).toFixed(2)} mm`}
        </div>
      )}
    </div>
  );
};

export default LowContrastResolutionForCArm;