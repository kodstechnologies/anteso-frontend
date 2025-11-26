// src/components/TestTables/EquipmentSetting.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addEquipmentSettingForMammography,
    getEquipmentSettingByServiceIdForMammography,
    updateEquipmentSettingForMammography,
} from '../../../../../../api';

interface EquipmentSetting {
    appliedCurrent: string;
    appliedVoltage: string;
    exposureTime: string;
    focalSpotSize: string;
    filtration: string;
    collimation: string;
    frameRate: string;
    pulseWidth: string;
}

interface Props {
    serviceId: string;
    onRefresh?: () => void;
}

const EquipmentSetting: React.FC<Props> = ({ serviceId, onRefresh }) => {
    const [testId, setTestId] = useState<string | null>(null);

    const [settings, setSettings] = useState<EquipmentSetting>({
        appliedCurrent: '',
        appliedVoltage: '',
        exposureTime: '',
        focalSpotSize: '',
        filtration: '',
        collimation: '',
        frameRate: '',
        pulseWidth: '',
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true);
    const [hasSaved, setHasSaved] = useState(false);

    const isViewMode = hasSaved && !isEditing;

    // Load existing data
    useEffect(() => {
        const load = async () => {
            if (!serviceId) {
                setIsLoading(false);
                return;
            }

            try {
                const data = await getEquipmentSettingByServiceIdForMammography(serviceId);
                if (data) {
                    setSettings({
                        appliedCurrent: data.appliedCurrent || '',
                        appliedVoltage: data.appliedVoltage || '',
                        exposureTime: data.exposureTime || '',
                        focalSpotSize: data.focalSpotSize || '',
                        filtration: data.filtration || '',
                        collimation: data.collimation || '',
                        frameRate: data.frameRate || '',
                        pulseWidth: data.pulseWidth || '',
                    });
                    setTestId(data._id);
                    setHasSaved(true);
                    setIsEditing(false);
                }
            } catch (err) {
                console.error('Failed to load equipment settings:', err);
                toast.error('Failed to load equipment settings');
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [serviceId]);

    const handleSave = async () => {
        // Basic validation - at least one field should be filled
        const hasValue = Object.values(settings).some(v => v.trim() !== '');
        if (!hasValue) {
            toast.error('Please fill at least one parameter');
            return;
        }

        setIsSaving(true);

        const payload = { ...settings };

        try {
            if (testId) {
                await updateEquipmentSettingForMammography(testId, payload);
                toast.success('Equipment settings updated successfully!');
            } else {
                const res = await addEquipmentSettingForMammography(serviceId, payload);
                setTestId(res.data._id);
                toast.success('Equipment settings saved successfully!');
            }
            setHasSaved(true);
            setIsEditing(false);
            onRefresh?.();
        } catch (err: any) {
            toast.error(err.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEdit = () => setIsEditing(true);

    const updateField = (field: keyof EquipmentSetting, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-lg border">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <span className="ml-3 text-gray-600">Loading Equipment Settings...</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
                <h2 className="text-xl font-bold text-indigo-900">
                    Equipment Settings & Technique Parameters
                </h2>

                <div className="flex items-center gap-3">
                    {isSaving && <span className="text-sm text-gray-600">Saving...</span>}

                    {isViewMode && (
                        <button
                            onClick={toggleEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </button>
                    )}

                    {!isViewMode && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {hasSaved ? 'Update' : 'Save'} Settings
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Settings Table */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Parameter
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Value
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {/* Applied Current */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Applied Current (mA)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.appliedCurrent}
                                onChange={(e) => updateField('appliedCurrent', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 100"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>

                    {/* Applied Voltage */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Applied Voltage (kV)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.appliedVoltage}
                                onChange={(e) => updateField('appliedVoltage', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 28"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>

                    {/* Exposure Time */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Exposure Time (ms)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.exposureTime}
                                onChange={(e) => updateField('exposureTime', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 500"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>

                    {/* Focal Spot Size */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Focal Spot Size (mm)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.focalSpotSize}
                                onChange={(e) => updateField('focalSpotSize', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 0.3 / 0.1"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>

                    {/* Filtration */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Filtration (mm Al eq.)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.filtration}
                                onChange={(e) => updateField('filtration', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 0.03 Mo + 0.5 Al"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>

                    {/* Collimation */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Collimation</td>
                        <td className="px-6 py-5">
                            <select
                                value={settings.collimation}
                                onChange={(e) => updateField('collimation', e.target.value)}
                                disabled={isViewMode}
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    }`}
                            >
                                <option value="">Select...</option>
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </td>
                    </tr>

                    {/* Frame Rate */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Frame Rate (fps)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.frameRate}
                                onChange={(e) => updateField('frameRate', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 15, 30"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>

                    {/* Pulse Width */}
                    <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-800">Pulse Width (ms)</td>
                        <td className="px-6 py-5">
                            <input
                                type="text"
                                value={settings.pulseWidth}
                                onChange={(e) => updateField('pulseWidth', e.target.value)}
                                readOnly={isViewMode}
                                placeholder="e.g. 5, 10"
                                className={`w-full px-4 py-2.5 border rounded-md text-sm font-medium transition ${isViewMode
                                        ? 'bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300'
                                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer Note */}
            <div className="px-6 py-4 bg-amber-50 border-t text-sm text-amber-800">
                <p className="font-medium">
                    Note: These parameters are used during image acquisition and affect dose calculation.
                </p>
            </div>
        </div>
    );
};

export default EquipmentSetting;