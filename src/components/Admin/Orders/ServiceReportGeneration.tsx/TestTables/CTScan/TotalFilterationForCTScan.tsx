// components/TestTables/TotalFilterationForCTScan.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import {
    addTotalFilteration,
    getTotalFilterationByTestId,
    getTotalFilterationByServiceId,
    updateTotalFilteration,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Row {
    appliedKV: string;
    appliedMA: string;
    time: string;
    sliceThickness: string;
    measuredTF: string; // stored as string, rounded to 2 decimals
}

interface Props {
    serviceId: string;
    testId?: string;
    onRefresh?: () => void;
}

const TotalFilterationForCTScan: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);

    // Single fixed row
    const [row, setRow] = useState<Row>({
        appliedKV: '',
        appliedMA: '',
        time: '',
        sliceThickness: '',
        measuredTF: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // === Auto Remark: Pass if ≥ 2.5, else Fail ===
    const remark = useMemo(() => {
        const tf = parseFloat(row.measuredTF);
        if (isNaN(tf)) return '';
        return tf >= 2.5 ? 'Pass' : 'Fail';
    }, [row.measuredTF]);

    // === Update Row Field ===
    const updateField = (field: keyof Row, value: string) => {
        setRow(prev => ({ ...prev, [field]: value }));
    };

    // === Handle blur for measuredTF to round to 2 decimals ===
    const handleMeasuredTFBlur = () => {
        const num = parseFloat(row.measuredTF);
        if (!isNaN(num)) {
            setRow(prev => ({ ...prev, measuredTF: num.toFixed(2) }));
        } else if (row.measuredTF.trim() === '') {
            setRow(prev => ({ ...prev, measuredTF: '' }));
        }
    };

    // === Form Valid ===
    const isFormValid = useMemo(() => {
        return (
            !!serviceId &&
            row.appliedKV.trim() &&
            row.appliedMA.trim() &&
            row.time.trim() &&
            row.sliceThickness.trim() &&
            row.measuredTF.trim()
        );
    }, [serviceId, row]);

    // === Load Data ===
    useEffect(() => {
        const load = async () => {
            if (!serviceId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                let rec = null;

                if (propTestId) {
                    const response = await getTotalFilterationByTestId(propTestId);
                    rec = response.data || response;
                } else {
                    rec = await getTotalFilterationByServiceId(serviceId);
                }

                if (rec) {
                    setTestId(rec._id || propTestId);
                    if (rec.rows?.[0]) {
                        const r = rec.rows[0];
                        setRow({
                            appliedKV: String(r.appliedKV || ''),
                            appliedMA: String(r.appliedMA || ''),
                            time: String(r.time || ''),
                            sliceThickness: String(r.sliceThickness || ''),
                            measuredTF: r.measuredTF ? parseFloat(r.measuredTF).toFixed(2) : '',
                        });
                    }
                    setHasSaved(true);
                    setIsEditing(false);
                } else {
                    setHasSaved(false);
                    setIsEditing(true);
                }
            } catch (e: any) {
                if (e.response?.status !== 404) toast.error('Failed to load data');
                setHasSaved(false);
                setIsEditing(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [serviceId, propTestId]);

    // === Save / Update ===
    const handleSave = async () => {
        if (!isFormValid) return;
        setIsSaving(true);

        const payload = {
            rows: [
                {
                    ...row,
                    measuredTF: parseFloat(row.measuredTF),
                },
            ],
        };

        try {
            let res;
            if (testId) {
                res = await updateTotalFilteration(testId, payload);
                toast.success('Updated successfully!');
            } else {
                res = await addTotalFilteration(serviceId, payload);
                const newId = res.data?.testId || res.data?.data?.testId || res.data?._id;
                if (newId) {
                    setTestId(newId);
                }
                toast.success('Saved successfully!');
            }
            setHasSaved(true);
            setIsEditing(false);
            onRefresh?.();
        } catch (e: any) {
            toast.error(e.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEdit = () => {
        if (!hasSaved) return;
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
        <div className="p-6 max-w-7xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Total Filtration for CT Scan
            </h2>

            {/* ==================== Main Table: Single Row ==================== */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-teal-50 border-b">
                    Filtration Measurement
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Applied kV
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Applied mA
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Time (s)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Slice Thickness (mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                    Measured TF (mm of Al)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Remark
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={row.appliedKV}
                                        onChange={e => updateField('appliedKV', e.target.value)}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="120"
                                    />
                                </td>
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={row.appliedMA}
                                        onChange={e => updateField('appliedMA', e.target.value)}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="100"
                                    />
                                </td>
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={row.time}
                                        onChange={e => updateField('time', e.target.value)}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="1.0"
                                    />
                                </td>
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={row.sliceThickness}
                                        onChange={e => updateField('sliceThickness', e.target.value)}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="5.0"
                                    />
                                </td>
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={row.measuredTF}
                                        onChange={e => updateField('measuredTF', e.target.value)}
                                        onBlur={handleMeasuredTFBlur}
                                        disabled={isViewMode}
                                        className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                            }`}
                                        placeholder="2.50"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${remark === 'Pass' ? 'bg-green-100 text-green-800' : remark === 'Fail' ? 'bg-red-100 text-red-800' : 'text-gray-400'
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

            {/* ==================== SAVE BUTTON ==================== */}
            <div className="flex justify-end mt-6">
                <button
                    onClick={isViewMode ? toggleEdit : handleSave}
                    disabled={isSaving || (!isViewMode && !isFormValid)}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isViewMode
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
                            {buttonText} Filtration
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TotalFilterationForCTScan;