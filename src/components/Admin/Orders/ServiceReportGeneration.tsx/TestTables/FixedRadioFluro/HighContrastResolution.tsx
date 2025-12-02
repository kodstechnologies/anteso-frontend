import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addHighContrastResolutionForFixedRadioFluro,
  getHighContrastResolutionByServiceIdForFixedRadioFluro,
  updateHighContrastResolutionForFixedRadioFluro,
} from '../../../../../../api';

interface Props {
  serviceId: string;
}

const HighContrastResolution: React.FC<Props> = ({ serviceId }) => {
  const [measuredLpPerMm, setMeasuredLpPerMm] = useState<string>('');
  const [recommendedStandard, setRecommendedStandard] = useState<string>('1.50');
  const [tolerance, setTolerance] = useState<string>('');
  const [testId, setTestId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parse tolerance (supports ±5%, +10%, 5%, etc.)
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

  // Hidden PASS/FAIL logic (higher lp/mm = better)
  const remark = useMemo(() => {
    const measuredStr = measuredLpPerMm.trim();
    const standardStr = recommendedStandard.trim();
    const tolInput = tolerance.trim();

    if (!measuredStr || !standardStr) return '';
    if (!tolInput) return 'Tolerance not set';

    const measured = parseFloat(measuredStr);
    const standard = parseFloat(standardStr);

    if (isNaN(measured) || isNaN(standard)) return '';

    const parsedTol = parseTolerance(tolInput);
    if (!parsedTol) return '';

    const { value: tolPercent, isPlusMinus } = parsedTol;
    const toleranceAmount = (standard * tolPercent) / 100;

    // Higher value = better performance
    const lowerLimit = isPlusMinus ? standard - toleranceAmount : standard;
    const upperLimit = standard + toleranceAmount;

    const isPass = measured >= lowerLimit && measured <= upperLimit;

    return isPass ? 'PASS' : 'FAIL';
  }, [measuredLpPerMm, recommendedStandard, tolerance]);

  // Load from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getHighContrastResolutionByServiceIdForFixedRadioFluro(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setMeasuredLpPerMm(String(data.measuredLpPerMm ?? ''));
          setRecommendedStandard(String(data.recommendedStandard ?? '1.50'));
          setTolerance(String(data.tolerance ?? ''));
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load High Contrast Resolution data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID missing');
      return;
    }
    if (!measuredLpPerMm.trim()) {
      toast.error('Enter measured lp/mm');
      return;
    }
    setIsSaving(true);
    const payload = {
      measuredLpPerMm,
      recommendedStandard,
      tolerance,
      remark,
    };
    try {
      let res;
      if (testId) {
        res = await updateHighContrastResolutionForFixedRadioFluro(testId, payload);
        toast.success('Updated successfully');
      } else {
        res = await addHighContrastResolutionForFixedRadioFluro(serviceId, payload);
        const newId = res?.data?._id || res?.data?.data?._id;
        if (newId) setTestId(newId);
        toast.success('Saved successfully');
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const isViewMode = isSaved && !isEditing;
  const ButtonIcon = isViewMode ? Edit3 : Save;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">High Contrast Resolution</h2>
        <button
          onClick={isViewMode ? () => setIsEditing(true) : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium ${isSaving
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-teal-600 hover:bg-teal-700'}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-4 h-4" />
              {isViewMode ? 'Edit' : testId ? 'Update' : 'Save'} Test
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit / Requirement
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Row 1: Measured Value */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">
                Bar strips resolved on the monitor (lp/mm)
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={measuredLpPerMm}
                  onChange={(e) => setMeasuredLpPerMm(e.target.value)}
                  disabled={isViewMode}
                  className={`w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g. 1.60"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                lp/mm pattern must be resolved
              </td>
            </tr>

            {/* Row 2: Recommended Standard */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Recommended performance standard
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={recommendedStandard}
                  onChange={(e) => setRecommendedStandard(e.target.value)}
                  disabled={isViewMode}
                  className={`w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 ${isViewMode ? 'cursor-not-allowed' : ''}`}
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                lp/mm pattern must be resolved
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tolerance Input */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Tolerance &lt;</span>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g. ±10%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolution;