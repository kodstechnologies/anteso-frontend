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
  const [tolerance, setTolerance] = useState<string>('');

  // Parse tolerance (±10%, +5%, 10%, etc.)
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

  // Auto compute PASS/FAIL
  const remark = useMemo(() => {
    const measured = parseFloat(measuredLpPerMm);
    const standard = parseFloat(recommendedStandard);

    if (isNaN(measured) || isNaN(standard)) return '';
    if (!tolerance.trim()) return 'Tolerance required';

    const parsed = parseTolerance(tolerance);
    if (!parsed) return 'Invalid tolerance';

    const { value: tolPercent, isPlusMinus } = parsed;
    const tolAmount = (standard * tolPercent) / 100;

    const lowerLimit = isPlusMinus ? standard - tolAmount : standard;
    const upperLimit = standard + tolAmount;

    const isPass = measured >= lowerLimit && (isPlusMinus ? measured <= upperLimit : true);

    return isPass ? 'PASS' : 'FAIL';
  }, [measuredLpPerMm, recommendedStandard, tolerance]);

  // Load existing test
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
          setTestId(data._id);
          setMeasuredLpPerMm(data.measuredLpPerMm || '');
          setRecommendedStandard(data.recommendedStandard || '1.50');
          setTolerance(data.tolerance || '');
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
      toast.error("Please enter measured value");
      return;
    }
    if (!tolerance.trim()) {
      toast.error("Please enter tolerance");
      return;
    }

    setIsSaving(true);
    const payload = {
      measuredLpPerMm: measuredLpPerMm.trim(),
      recommendedStandard: recommendedStandard.trim(),
      tolerance: tolerance.trim(),
    };

    try {
      if (testId) {
        await updateHighContrastResolutionForCArm(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createHighContrastResolutionForCArm(serviceId, payload);
        const newId = res.data?._id || res.data?.testId;
        setTestId(newId);
        onTestSaved?.(newId);
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

  const startEditing = () => {
    setIsEditing(true);
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">High Contrast Resolution</h2>

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
              {buttonText}
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
                lp/mm (line pairs per millimeter)
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
                  placeholder="1.50"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                Minimum required resolution
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tolerance Input */}
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
                placeholder="e.g. ±10%, +5%, 10%"
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

      {/* Optional: Show computed limits */}
      {remark && remark !== 'Tolerance required' && remark !== 'Invalid tolerance' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Acceptance Range:</strong>{' '}
          {parseTolerance(tolerance)?.isPlusMinus
            ? `${(parseFloat(recommendedStandard) - (parseFloat(recommendedStandard) * parseTolerance(tolerance)!.value) / 100).toFixed(3)} – ${(parseFloat(recommendedStandard) + (parseFloat(recommendedStandard) * parseTolerance(tolerance)!.value) / 100).toFixed(3)} lp/mm`
            : `≥ ${recommendedStandard} lp/mm`}
        </div>
      )}
    </div>
  );
};

export default HighContrastResolutionForCArm;