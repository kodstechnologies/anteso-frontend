// components/TestTables/LowContrastResolutionForCTScan.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createLowContrastResolutionForCTScan,
  getLowContrastResolutionForCTScan,
  getLowContrastResolutionByServiceIdForCTScan,
  updateLowContrastResolutionForCTScan,
} from '../../../../../../api';

interface Props {
  serviceId: string;
  testId?: string | null;
  tubeId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const LowContrastResolutionForCTScan: React.FC<Props> = ({
  serviceId,
  testId: propTestId = null,
  tubeId,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(propTestId);
  const [isSaved, setIsSaved] = useState(!!propTestId);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [kvp, setKvp] = useState('120');
  const [ma, setMa] = useState('200');
  const [sliceThickness, setSliceThickness] = useState('5.0');
  const [ww, setWw] = useState('400');
  const [observedSize, setObservedSize] = useState('5.0');
  const [contrastLevel, setContrastLevel] = useState('1.0');

  const minimumTolerance = '5.0 mm at 1% contrast difference (minimum)';
  const expectedTolerance = '2.5 mm at 0.5% contrast difference (expected)';

  const observed = parseFloat(observedSize);
  const isValidNumber = !isNaN(observed) && observed > 0;

  const status = !isValidNumber
    ? 'incomplete'
    : observed <= 5.0
      ? 'pass'
      : 'fail';

  const isExpectedMet = isValidNumber && observed <= 2.5;

  // Load existing test data
  useEffect(() => {
    const loadTest = async () => {
      setIsLoading(true);
      try {
        let data = null;

        if (propTestId) {
          data = await getLowContrastResolutionForCTScan(propTestId);
        } else {
          data = await getLowContrastResolutionByServiceIdForCTScan(serviceId);
        }

        if (data) {
          setTestId(data._id || data.testId);
          if (data.acquisitionParams) {
            setKvp(data.acquisitionParams.kvp || '120');
            setMa(data.acquisitionParams.ma || '200');
            setSliceThickness(data.acquisitionParams.sliceThickness || '5.0');
            setWw(data.acquisitionParams.ww || '400');
          }
          if (data.result) {
            setObservedSize(data.result.observedSize || '5.0');
            setContrastLevel(data.result.contrastLevel || '1.0');
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
      acquisitionParams: {
        kvp: kvp.trim(),
        ma: ma.trim(),
        sliceThickness: sliceThickness.trim(),
        ww: ww.trim(),
      },
      result: {
        observedSize: observedSize.trim(),
        contrastLevel: contrastLevel.trim(),
      },
    };

    try {
      if (testId) {
        await updateLowContrastResolutionForCTScan(testId, payload);
        toast.success("Updated successfully!");
      } else {
        const res = await createLowContrastResolutionForCTScan(serviceId, payload);
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
            Low Contrast Resolution for CT Scan
          </h1>
          <p className="text-gray-600 mt-2">Quality Control Test – Detectability Assessment</p>
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

      {/* Table 1: Acquisition Parameters */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Acquisition Parameters</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">kVp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">mA</th>
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
                    value={ma}
                    onChange={(e) => setMa(e.target.value)}
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

      {/* Table 2: Low Contrast Result */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Low Contrast Resolution Result</h2>
        </div>
        <div className="p-8">
          <table className="min-w-full">
            <tbody>
              <tr className="border-b-2 border-gray-200">
                <td className="py-6 px-4 text-lg font-medium text-gray-800 w-1/3">
                  Low Contrast Resolution
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
                    placeholder="5.0"
                  />
                  <p className="text-sm text-gray-600 mt-2">mm (smallest visible object)</p>
                </td>
                <td className="py-6 px-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl font-medium">at</span>
                    <input
                      type="text"
                      value={contrastLevel}
                      onChange={(e) => setContrastLevel(e.target.value)}
                      disabled={isViewOnly}
                      className={`w-20 px-4 py-4 text-2xl font-bold text-center border-4 border-indigo-500 rounded-lg focus:ring-4 focus:ring-indigo-300 ${isViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    <span className="text-xl font-medium">%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">contrast difference</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tolerance & Small Result Badge */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Acceptance Criteria */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-6">Acceptance Criteria</h3>
          <div className="space-y-6 text-lg">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 mt-1 text-xl">•</span>
              <div>
                <span className="font-semibold text-gray-800">Minimum Required:</span><br />
                <span className="text-blue-700 font-medium">{minimumTolerance}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 mt-1 text-xl">•</span>
              <div>
                <span className="font-semibold text-gray-800">Expected Performance:</span><br />
                <span className={`font-medium ${isExpectedMet ? 'text-green-700' : 'text-gray-600'}`}>
                  {expectedTolerance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Small PASS/FAIL Badge */}
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
      {/* <div className="mt-10 bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-3">Remark</h3>
        <p className={`text-lg font-medium leading-relaxed ${status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
          {status === 'pass' &&
            `The CT scanner can detect low-contrast objects as small as ${observedSize} mm at ${contrastLevel}% contrast difference. This meets the minimum acceptance criterion.`}
          {status === 'fail' &&
            `The CT scanner can only detect down to ${observedSize} mm at ${contrastLevel}% contrast difference, which does NOT meet the minimum requirement of ≤ 5.0 mm.`}
          {status === 'incomplete' &&
            'Please enter the smallest visible low-contrast object size to determine compliance.'}
        </p>
      </div> */}
    </div>
  );
};

export default LowContrastResolutionForCTScan;
