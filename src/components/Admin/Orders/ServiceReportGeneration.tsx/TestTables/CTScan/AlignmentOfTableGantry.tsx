// components/TestTables/AlignmentOfTableGantry.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addAlignmentOfTableGantryForCTScan,
  getAlignmentOfTableGantryByServiceIdForCTScan,
  getAlignmentOfTableGantryByTestIdForCTScan,
  updateAlignmentOfTableGantryForCTScan,
} from '../../../../../../api';

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
  onRefresh?: () => void;
  csvData?: any[];
}

const AlignmentOfTableGantry: React.FC<Props> = ({ serviceId, testId: propTestId = null, onTestSaved, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const [result, setResult] = useState<string>('');
  const [toleranceSign, setToleranceSign] = useState<'+' | '-' | '±'>('±');
  const [toleranceValue, setToleranceValue] = useState<string>('2');

  // Calculate pass/fail remark
  const remark = useMemo(() => {
    if (!result.trim()) {
      return '';
    }

    const resultNum = parseFloat(result.trim());
    const toleranceNum = parseFloat(toleranceValue.trim());

    // If either value is not a valid number, return empty
    if (isNaN(resultNum) || isNaN(toleranceNum)) {
      return '';
    }

    let passes = false;

    if (toleranceSign === '±') {
      // Check if result is within ±toleranceValue
      passes = resultNum >= -toleranceNum && resultNum <= toleranceNum;
    } else if (toleranceSign === '+') {
      // Check if result is within 0 to +toleranceValue
      passes = resultNum >= 0 && resultNum <= toleranceNum;
    } else if (toleranceSign === '-') {
      // Check if result is within -toleranceValue to 0
      passes = resultNum >= -toleranceNum && resultNum <= 0;
    }

    return passes ? 'Pass' : 'Fail';
  }, [result, toleranceSign, toleranceValue]);

  // === CSV Data Injection ===
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const res = csvData.find(r => r['Field Name'] === 'Table1_Result' || r['Field Name'] === 'Table1_Value')?.['Value'];
      if (res) setResult(res);

      if (!testId) {
        setIsEditing(true);
      }
    }
  }, [csvData]);

  // Load data from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getAlignmentOfTableGantryByServiceIdForCTScan(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setResult(data.result || '');
          setToleranceSign(data.toleranceSign || '±');
          setToleranceValue(data.toleranceValue || '2');
          setHasSaved(true);
          setIsEditing(false);
          if (data._id && !propTestId) {
            onTestSaved?.(data._id);
          }
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load alignment data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  // Save handler
  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        result: result.trim(),
        toleranceSign,
        toleranceValue: toleranceValue.trim(),
        remark: remark || '',
      };

      let result_response;
      let currentTestId = testId;

      if (!currentTestId) {
        try {
          const existing = await getAlignmentOfTableGantryByServiceIdForCTScan(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        result_response = await updateAlignmentOfTableGantryForCTScan(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        result_response = await addAlignmentOfTableGantryForCTScan(serviceId, payload);
        const newId = result_response?.data?.testId || result_response?.data?._id;
        if (newId) {
          setTestId(newId);
          onTestSaved?.(newId);
        }
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(true);
  };
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
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
    <div className="p-6 max-w-full mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Alignment of Table/Gantry</h2>
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewMode
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
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
              {buttonText} Alignment
            </>
          )}
        </button>
      </div>

      {/* Instruction */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-gray-700 text-lg">
          Check the congruence between the gantry midline and table midline using plumb Line.
        </p>
      </div>

      {/* Results Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Alignment Results</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/2">
                Result (Gantry midline to table midline):
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  disabled={isViewMode}
                  placeholder="Enter result value"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                />
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Tolerance:
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <select
                    value={toleranceSign}
                    onChange={(e) => setToleranceSign(e.target.value as '+' | '-' | '±')}
                    disabled={isViewMode}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                      }`}
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="±">±</option>
                  </select>
                  <input
                    type="text"
                    value={toleranceValue}
                    onChange={(e) => setToleranceValue(e.target.value)}
                    disabled={isViewMode}
                    placeholder="Enter tolerance value"
                    className={`w-32 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                      }`}
                  />
                </div>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Remarks:
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${remark === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : remark === 'Fail'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  {remark || '—'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlignmentOfTableGantry;

