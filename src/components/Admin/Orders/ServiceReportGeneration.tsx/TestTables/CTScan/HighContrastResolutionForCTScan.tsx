// components/TestTables/HighContrastResolutionForCTScan.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createHighContrastResolutionForCTScan,
  getHighContrastResolutionForCTScan,
  getHighContrastResolutionByServiceIdForCTScan,
  updateHighContrastResolutionForCTScan,
} from '../../../../../../api';

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const HighContrastResolutionForCTScan: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Operating Parameters
  const [kvp, setKvp] = useState('120');
  const [mas, setMas] = useState('200');
  const [sliceThickness, setSliceThickness] = useState('5.0');
  const [ww, setWw] = useState('400');

  // High Contrast Resolution Result
  const [observedSize, setObservedSize] = useState('1.0');
  const [contrastDifference, setContrastDifference] = useState('10');

  // Tolerance values (dynamic)
  const [toleranceContrastDifference, setToleranceContrastDifference] = useState('10');
  const [toleranceSize, setToleranceSize] = useState('1.6');
  const [toleranceLpCm, setToleranceLpCm] = useState('3.12');
  const [expectedSize, setExpectedSize] = useState('0.8');
  const [expectedLpCm, setExpectedLpCm] = useState('6.25');

  const observed = parseFloat(observedSize);
  const toleranceSizeNum = parseFloat(toleranceSize);
  const expectedSizeNum = parseFloat(expectedSize);
  const isValidNumber = !isNaN(observed) && observed > 0;

  // Status: pass if observed <= expected (better), fail if observed > tolerance, incomplete otherwise
  const status = !isValidNumber
    ? 'incomplete'
    : observed <= expectedSizeNum
      ? 'pass'
      : observed <= toleranceSizeNum
        ? 'pass'
        : 'fail';

  const isExpectedMet = isValidNumber && observed <= expectedSizeNum;

  // Load existing test data
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;

        if (propTestId) {
          data = await getHighContrastResolutionForCTScan(propTestId);
        } else {
          data = await getHighContrastResolutionByServiceIdForCTScan(serviceId);
        }

        if (data) {
          setTestId(data._id || data.testId);
          // Handle new format
          if (data.operatingParams) {
            setKvp(data.operatingParams.kvp || '120');
            setMas(data.operatingParams.mas || '200');
            setSliceThickness(data.operatingParams.sliceThickness || '5.0');
            setWw(data.operatingParams.ww || '400');
          }
          if (data.result) {
            setObservedSize(data.result.observedSize || '1.0');
            setContrastDifference(data.result.contrastDifference || '10');
          }
          if (data.tolerance) {
            setToleranceContrastDifference(data.tolerance.contrastDifference || '10');
            setToleranceSize(data.tolerance.size || '1.6');
            setToleranceLpCm(data.tolerance.lpCm || '3.12');
            setExpectedSize(data.tolerance.expectedSize || '0.8');
            setExpectedLpCm(data.tolerance.expectedLpCm || '6.25');
          }
          // Handle backward compatibility with old format (table1, table2, tolerance string)
          else if (data.table1 || data.table2) {
            // Try to extract from old format if needed
            if (data.table2 && data.table2.length > 0) {
              setObservedSize(data.table2[0]?.size || '1.0');
            }
          }
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
    if (!observedSize.trim()) {
      toast.error("Please enter the observed size");
      return;
    }

    setIsSaving(true);
    const payload = {
      operatingParams: {
        kvp: kvp.trim(),
        mas: mas.trim(),
        sliceThickness: sliceThickness.trim(),
        ww: ww.trim(),
      },
      result: {
        observedSize: observedSize.trim(),
        contrastDifference: contrastDifference.trim(),
      },
      tolerance: {
        contrastDifference: toleranceContrastDifference.trim(),
        size: toleranceSize.trim(),
        lpCm: toleranceLpCm.trim(),
        expectedSize: expectedSize.trim(),
        expectedLpCm: expectedLpCm.trim(),
      },
    };

    try {
      if (testId) {
        await updateHighContrastResolutionForCTScan(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createHighContrastResolutionForCTScan(serviceId, payload);
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
    <div className="p-8 max-w-5xl mx-auto space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-800">
            High Contrast Resolution for CT Scan
          </h1>
          <p className="text-gray-600 mt-2">Quality Control Test – Spatial Resolution Assessment</p>
        </div>
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

      {/* Table 1: Operating Parameters */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Operating Parameters</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">kVp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">mAs</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Slice Thickness (mm)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Window Width (WW)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={kvp}
                    onChange={(e) => setKvp(e.target.value)}
                    disabled={isViewOnly}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-medium ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={mas}
                    onChange={(e) => setMas(e.target.value)}
                    disabled={isViewOnly}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-medium ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={sliceThickness}
                    onChange={(e) => setSliceThickness(e.target.value)}
                    disabled={isViewOnly}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-medium ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={ww}
                    onChange={(e) => setWw(e.target.value)}
                    disabled={isViewOnly}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-medium ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: High Contrast Resolution Result */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">High Contrast Resolution Result</h2>
        </div>
        <div className="p-8">
          <table className="min-w-full">
            <tbody>
              <tr className="border-b-2 border-gray-200">
                <td className="py-6 px-4 text-lg font-medium text-gray-800 w-1/3">
                  Size of the smallest resolvable bar/hole pattern:
                </td>
                <td className="py-6 px-4 text-center">
                  <input
                    type="text"
                    value={observedSize}
                    onChange={(e) => setObservedSize(e.target.value)}
                    disabled={isViewOnly}
                    className={`w-32 px-6 py-4 text-2xl font-bold text-center rounded-lg border-4 transition-all ${status === 'pass'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : status === 'fail'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300'
                      } focus:ring-4 focus:ring-indigo-300 ${isViewOnly ? 'cursor-not-allowed' : ''}`}
                    placeholder="1.0"
                  />
                  <p className="text-sm text-gray-600 mt-2">mm</p>
                </td>
                <td className="py-6 px-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl font-medium">at</span>
                    <input
                      type="text"
                      value={contrastDifference}
                      onChange={(e) => setContrastDifference(e.target.value)}
                      disabled={isViewOnly}
                      className={`w-20 px-4 py-4 text-2xl font-bold text-center border-4 border-indigo-500 rounded-lg focus:ring-4 focus:ring-indigo-300 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    <span className="text-xl font-medium">%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Contrast Difference</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tolerance & Result Badge */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Acceptance Criteria */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-6">Tolerance</h3>
          <div className="space-y-6 text-lg">
            <div>
              <span className="font-semibold text-gray-800">Tolerance : At <input
                type="text"
                value={toleranceContrastDifference}
                onChange={(e) => setToleranceContrastDifference(e.target.value)}
                disabled={isViewOnly}
                className={`w-16 px-2 py-1 text-center border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 font-semibold ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />% contrast difference the size of the bar/hole pattern that could be resolvable should be <input
                type="text"
                value={toleranceSize}
                onChange={(e) => setToleranceSize(e.target.value)}
                disabled={isViewOnly}
                className={`w-16 px-2 py-1 text-center border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 font-semibold ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              /> mm (= <input
                type="text"
                value={toleranceLpCm}
                onChange={(e) => setToleranceLpCm(e.target.value)}
                disabled={isViewOnly}
                className={`w-20 px-2 py-1 text-center border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 font-semibold ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              /> lp/cm).</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Expected high contrast resolution: <input
                type="text"
                value={expectedSize}
                onChange={(e) => setExpectedSize(e.target.value)}
                disabled={isViewOnly}
                className={`w-16 px-2 py-1 text-center border border-green-300 rounded focus:ring-2 focus:ring-green-500 font-semibold ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              /> mm ( = <input
                type="text"
                value={expectedLpCm}
                onChange={(e) => setExpectedLpCm(e.target.value)}
                disabled={isViewOnly}
                className={`w-20 px-2 py-1 text-center border border-green-300 rounded focus:ring-2 focus:ring-green-500 font-semibold ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              /> lp/cm)</span>
            </div>
          </div>
        </div>

        {/* PASS/FAIL Badge */}
        <div className="flex items-center justify-center">
          <div className={`rounded-xl px-10 py-8 shadow-xl transition-all ${status === 'pass' ? 'bg-green-600' :
              status === 'fail' ? 'bg-red-600' :
                'bg-gray-500'
            } text-white`}>
            <div className="text-center">
              {status === 'pass' && <CheckCircle className="w-16 h-16 mx-auto mb-3" />}
              {status === 'fail' && <XCircle className="w-16 h-16 mx-auto mb-3" />}
              {status === 'incomplete' && <div className="w-16 h-16 mx-auto mb-3 bg-white bg-opacity-20 rounded-full" />}

              <h2 className="text-4xl font-bold uppercase">
                {status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'Pending'}
              </h2>
              <p className="text-sm mt-2 opacity-90">
                {status === 'pass' && 'Meets requirement'}
                {status === 'fail' && 'Does not meet'}
                {status === 'incomplete' && 'Enter value'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Remark */}
      <div className="mt-10 bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-3">Remark</h3>
        <p className={`text-lg font-medium leading-relaxed ${status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
          {status === 'pass' &&
            `The CT scanner can resolve high-contrast bar/hole patterns as small as ${observedSize} mm at ${contrastDifference}% contrast difference. This meets the acceptance criterion.`}
          {status === 'fail' &&
            `The CT scanner can only resolve down to ${observedSize} mm at ${contrastDifference}% contrast difference, which does NOT meet the requirement of ≤ ${toleranceSize} mm.`}
          {status === 'incomplete' &&
            'Please enter the smallest resolvable bar/hole pattern size to determine compliance.'}
        </p>
      </div>
    </div>
  );
};

export default HighContrastResolutionForCTScan;
