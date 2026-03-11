import React, { useState, useMemo, useEffect } from 'react';
import {
  addHighContrastResolutionForInventionalRadiology,
  getHighContrastResolutionByServiceIdForInventionalRadiology,
  updateHighContrastResolutionForInventionalRadiology
} from '../../../../../../api';
import toast from 'react-hot-toast';
import { Loader2, Save, Edit3 } from "lucide-react";

interface Props {
  serviceId: string;
  testId?: string | null;
  tubeId?: string | null;
  onTestSaved?: (testId: string) => void;
  csvData?: any[];
}

const HighContrastResolutionForInventionalRadiology: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  tubeId,
  onTestSaved,
  csvData,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [measuredLpPerMm, setMeasuredLpPerMm] = useState<string>('');
  const [recommendedStandard, setRecommendedStandard] = useState<string>('1.50');
  const [tolerance, setTolerance] = useState<string>('');

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

  // Load existing test
  React.useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getHighContrastResolutionByServiceIdForInventionalRadiology(serviceId, tubeId);
        const testData = data?.data || data;
        if (testData) {
          setTestId(testData._id);
          setMeasuredLpPerMm(testData.measuredLpPerMm || '');
          setRecommendedStandard(testData.recommendedStandard || '1.50');
          setTolerance(testData.tolerance || '');
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
  }, [serviceId, tubeId]);

  // CSV Data Injection (do not auto-open edit mode)
  React.useEffect(() => {
    if (csvData && csvData.length > 0) {
      const measuredVal = csvData.find(r => r['Field Name'] === 'Table1_measuredLpPerMm')?.['Value'];
      if (measuredVal) setMeasuredLpPerMm(measuredVal);

      const standardVal = csvData.find(r => r['Field Name'] === 'Table1_recommendedStandard')?.['Value'];
      if (standardVal) setRecommendedStandard(standardVal);

      const tolVal = csvData.find(r => r['Field Name'] === 'Table1_tolerance')?.['Value'];
      if (tolVal) setTolerance(tolVal);
    }
  }, [csvData]);

  const handleSave = async () => {
    if (!measuredLpPerMm.trim()) {
      toast.error("Please enter measured lp/mm");
      return;
    }

    const payload = {
      measuredLpPerMm,
      recommendedStandard,
      tolerance,
      tubeId: tubeId || null,
    };

    setIsSaving(true);
    try {
      if (testId) {
        await updateHighContrastResolutionForInventionalRadiology(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await addHighContrastResolutionForInventionalRadiology(serviceId, payload);
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

  const isViewOnly = isSaved && !isEditing;
  const buttonText = !isSaved ? "Save Test" : isEditing ? "Update Test" : "Edit Test";
  const ButtonIcon = !isSaved || isEditing ? Save : Edit3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-8 text-xs">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">High Contrast Resolution</h2>
        <button
          onClick={isViewOnly ? () => setIsEditing(true) : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition shadow-md ${isSaving ? "bg-gray-400 cursor-not-allowed" : isViewOnly ? "bg-orange-600 hover:bg-orange-700" : "bg-teal-600 hover:bg-teal-700"}`}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonIcon className="w-5 h-5" />
              <span>{buttonText}</span>
            </div>
          )}
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider border-r">
                Parameter
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider border-r w-40">
                Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                Unit / Requirement
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-5 text-sm font-medium text-gray-700">
                Bar strips resolved on the monitor (lp/mm)
              </td>
              <td className="px-6 py-5 border-x">
                <input
                  type="text"
                  value={measuredLpPerMm}
                  onChange={(e) => setMeasuredLpPerMm(e.target.value)}
                  disabled={isViewOnly}
                  className={`w-full px-4 py-2 border rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isViewOnly ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-white text-blue-900 border-blue-300"}`}
                  placeholder="0.00"
                />
              </td>
              <td className="px-6 py-5 text-sm text-gray-600 bg-gray-50/50 italic">
                lp/mm pattern must be resolved
              </td>
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-5 text-sm font-medium text-gray-700">
                Recommended performance standard
              </td>
              <td className="px-6 py-5 border-x">
                <input
                  type="text"
                  value={recommendedStandard}
                  onChange={(e) => setRecommendedStandard(e.target.value)}
                  disabled={isViewOnly}
                  className={`w-full px-4 py-2 border rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isViewOnly ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-blue-50 text-blue-900 border-blue-200"}`}
                />
              </td>
              <td className="px-6 py-5 text-sm text-gray-600 bg-gray-50/50 italic">
                lp/mm pattern must be resolved
              </td>
            </tr>

            <tr className="bg-gray-50/30">
              <td className="px-6 py-4 text-sm font-bold text-gray-800 uppercase tracking-wider">
                Final Assessment
              </td>
              <td className="px-6 py-4 border-x text-center">
                <div className={`inline-flex items-center px-6 py-2 rounded-full text-sm font-bold shadow-sm ${remark === 'PASS' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                  {remark || '—'}
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-500 italic">
                (Based on measured vs standard)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tolerance Input */}
        <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Set Compliance Threshold</span>
            <p className="text-sm text-gray-600">Define the acceptable deviation from recommended standard.</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-bold text-gray-700 ml-2">Tolerance &lt;</span>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              disabled={isViewOnly}
              className={`w-40 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center transition-all ${isViewOnly ? "bg-gray-50 text-gray-500" : "bg-white text-blue-900 border-blue-200"}`}
              placeholder="e.g. ±10%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolutionForInventionalRadiology;