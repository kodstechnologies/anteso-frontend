// src/components/TestTables/LowContrastResolution.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addLowContrastResolutionForInventionalRadiology,
    getLowContrastResolutionByServiceIdForInventionalRadiology,
    updateLowContrastResolutionForInventionalRadiology,
} from '../../../../../../api';

interface Props {
    serviceId: string;
    testId?: string | null;
    tubeId?: string | null;
    onTestSaved?: (testId: string) => void;
}

const LowContrastResolution: React.FC<Props> = ({
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

    const [smallestHoleSize, setSmallestHoleSize] = useState<string>('');
    const [recommendedStandard, setRecommendedStandard] = useState<string>('3.0');

    // Simple PASS/FAIL: smaller hole = better
    const remark = useMemo(() => {
        const measured = parseFloat(smallestHoleSize);
        const standard = parseFloat(recommendedStandard);

        if (isNaN(measured) || isNaN(standard)) return '';

        return measured < standard ? 'PASS' : 'FAIL';
    }, [smallestHoleSize, recommendedStandard]);

    // Load existing test
    useEffect(() => {
        const loadTest = async () => {
            setIsLoading(true);
            try {
                const data = await getLowContrastResolutionByServiceIdForInventionalRadiology(serviceId, tubeId);

                if (data?.data) {
                    setTestId(data.data._id);
                    setSmallestHoleSize(data.data.smallestHoleSize || '');
                    setRecommendedStandard(data.data.recommendedStandard || '3.0');
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
    }, [propTestId, serviceId, tubeId]);

    // Save / Update
    const handleSave = async () => {
        if (!smallestHoleSize.trim()) {
            toast.error("Please enter the smallest hole size");
            return;
        }

        if (!recommendedStandard.trim()) {
            toast.error("Please enter the recommended standard");
            return;
        }

        setIsSaving(true);
        const payload = {
            smallestHoleSize: smallestHoleSize.trim(),
            recommendedStandard: recommendedStandard.trim(),
            tubeId: tubeId || null,
        };

        try {
            if (testId) {
                await updateLowContrastResolutionForInventionalRadiology(testId, payload);
                toast.success("Updated successfully!");
            } else {
                const res = await addLowContrastResolutionForInventionalRadiology(serviceId, payload);
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

    const startEditing = () => setIsEditing(true);
    const isViewOnly = isSaved && !isEditing;

    const getButtonConfig = () => {
        if (!isSaved) return { text: 'Save Test', icon: Save };
        if (isEditing) return { text: 'Update Test', icon: Save };
        return { text: 'Edit Test', icon: Edit3 };
    };

    const { text: buttonText, icon: ButtonIcon } = getButtonConfig();

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
                                mm (smaller is better)
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
                                    placeholder="3.0"
                                />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                Maximum acceptable hole size
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Result */}
                <div className="px-6 py-6 bg-gray-50 border-t">
                    <div className="flex items-center justify-center gap-8">
                        <span className="text-xl font-bold text-gray-700">Result:</span>
                        <span
                            className={`inline-flex px-12 py-5 text-md font-extrabold rounded-full shadow-lg ${remark === 'PASS'
                                ? 'bg-green-100 text-green-800 border-4 border-green-300'
                                : remark === 'FAIL'
                                    ? 'bg-red-100 text-red-800 border-4 border-red-300'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {remark || '—'}
                        </span>
                    </div>

                    {/* Clear Criteria */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            <strong>Acceptance Criteria:</strong> Measured value must be <strong>less than</strong> Recommended Standard
                        </p>
                        {remark && (
                            <p className="mt-3 text-lg font-semibold">
                                {parseFloat(smallestHoleSize)} mm {'<'} {recommendedStandard} mm →{' '}
                                <span className={remark === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                                    {remark}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LowContrastResolution;
