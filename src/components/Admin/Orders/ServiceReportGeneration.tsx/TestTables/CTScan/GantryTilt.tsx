// components/TestTables/GantryTilt.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addGantryTiltForCTScan,
    getGantryTiltByServiceIdForCTScan,
    getGantryTiltByTestIdForCTScan,
    updateGantryTiltForCTScan,
} from '../../../../../../api';

interface Parameter {
    id: string;
    name: string;
    value: string;
}

interface Measurement {
    id: string;
    actual: string;
    measured: string;
    remark?: string;
}

interface Props {
    serviceId: string;
    testId?: string | null;
    onTestSaved?: (testId: string) => void;
    onRefresh?: () => void;
    csvData?: any[];
}

const GantryTilt: React.FC<Props> = ({ serviceId, testId: propTestId = null, onTestSaved, onRefresh, csvData }) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // Parameters table state
    const [parameters, setParameters] = useState<Parameter[]>([
        { id: '1', name: 'Parameter 1', value: '' }
    ]);

    // Measurements table state
    const [measurements, setMeasurements] = useState<Measurement[]>([
        { id: '1', actual: '', measured: '' }
    ]);

    // Tolerance - dynamic
    const [toleranceSign, setToleranceSign] = useState<'+' | '-' | '±'>('±');
    const [toleranceValue, setToleranceValue] = useState<string>('2');
    const toleranceDisplay = `${toleranceSign}${toleranceValue}°`;

    // Calculate pass/fail remarks for each measurement
    const measurementsWithRemarks = useMemo(() => {
        return measurements.map((measurement) => {
            if (!measurement.actual.trim() || !measurement.measured.trim()) {
                return { ...measurement, remark: '' };
            }

            const actualNum = parseFloat(measurement.actual.trim().replace('°', ''));
            const measuredNum = parseFloat(measurement.measured.trim().replace('°', ''));
            const toleranceNum = parseFloat(toleranceValue.trim());

            // If any value is not a valid number, return empty remark
            if (isNaN(actualNum) || isNaN(measuredNum) || isNaN(toleranceNum)) {
                return { ...measurement, remark: '' };
            }

            // Calculate the difference (measured - actual)
            const difference = measuredNum - actualNum;

            let passes = false;

            if (toleranceSign === '±') {
                // Check if difference is within ±toleranceValue
                passes = difference >= -toleranceNum && difference <= toleranceNum;
            } else if (toleranceSign === '+') {
                // Check if difference is within 0 to +toleranceValue
                passes = difference >= 0 && difference <= toleranceNum;
            } else if (toleranceSign === '-') {
                // Check if difference is within -toleranceValue to 0
                passes = difference >= -toleranceNum && difference <= 0;
            }

            return {
                ...measurement,
                remark: passes ? 'Pass' : 'Fail',
            };
        });
    }, [measurements, toleranceSign, toleranceValue]);

    // Add new parameter row
    const addParameterRow = () => {
        const newParam: Parameter = {
            id: Date.now().toString(),
            name: `Parameter ${parameters.length + 1}`,
            value: ''
        };
        setParameters([...parameters, newParam]);
    };

    // Update parameter
    const updateParameter = (id: string, field: keyof Parameter, value: string) => {
        if (isViewMode) return;
        setParameters(parameters.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    // Delete parameter row
    const deleteParameter = (id: string) => {
        if (parameters.length > 1) {
            setParameters(parameters.filter(p => p.id !== id));
        }
    };

    // Add new measurement row
    const addMeasurementRow = () => {
        const newMeasurement: Measurement = {
            id: Date.now().toString(),
            actual: '',
            measured: ''
        };
        setMeasurements([...measurements, newMeasurement]);
    };

    // Update measurement
    const updateMeasurement = (id: string, field: keyof Measurement, value: string) => {
        if (isViewMode) return;
        setMeasurements(measurements.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    // Delete measurement row
    const deleteMeasurement = (id: string) => {
        if (measurements.length > 1) {
            setMeasurements(measurements.filter(m => m.id !== id));
        }
    };

    // === CSV Data Injection ===
    useEffect(() => {
        if (csvData && csvData.length > 0) {
            // Parameters and Measurements
            const allIndices = [...new Set(csvData
                .filter(r => r['Field Name'].startsWith('Table_'))
                .map(r => parseInt(r['Row Index']))
                .filter(i => !isNaN(i) && i > 0)
            )];

            if (allIndices.length > 0) {
                const newParams: Parameter[] = [];
                const newMeas: Measurement[] = [];

                allIndices.forEach(idx => {
                    const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
                    const type = rowData.find(r => r['Field Name'] === 'Table_Type')?.['Value'];
                    const nameActual = rowData.find(r => r['Field Name'] === 'Table_NameActual')?.['Value'] || '';
                    const valMeasured = rowData.find(r => r['Field Name'] === 'Table_ValueMeasured')?.['Value'] || '';

                    if (type === 'Parameter') {
                        newParams.push({
                            id: Date.now().toString() + nameActual + Math.random(),
                            name: nameActual,
                            value: valMeasured
                        });
                    } else if (type === 'Measurement') {
                        newMeas.push({
                            id: Date.now().toString() + nameActual + Math.random(),
                            actual: nameActual,
                            measured: valMeasured
                        });
                    }
                });

                if (newParams.length > 0) setParameters(newParams);
                if (newMeas.length > 0) setMeasurements(newMeas);
            }

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
                const res = await getGantryTiltByServiceIdForCTScan(serviceId);
                const data = res?.data;
                if (data) {
                    setTestId(data._id || null);
                    if (Array.isArray(data.parameters) && data.parameters.length > 0) {
                        setParameters(data.parameters.map((p: any, i: number) => ({
                            id: String(i + 1),
                            name: p.name || '',
                            value: p.value || '',
                        })));
                    }
                    if (Array.isArray(data.measurements) && data.measurements.length > 0) {
                        setMeasurements(data.measurements.map((m: any, i: number) => ({
                            id: String(i + 1),
                            actual: m.actual || '',
                            measured: m.measured || '',
                            remark: m.remark || '',
                        })));
                    }
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
                    toast.error('Failed to load gantry tilt data');
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
                parameters: parameters.map(p => ({
                    name: p.name.trim(),
                    value: p.value.trim(),
                })),
                measurements: measurementsWithRemarks.map(m => ({
                    actual: m.actual.trim(),
                    measured: m.measured.trim(),
                    remark: m.remark || '',
                })),
                toleranceSign,
                toleranceValue: toleranceValue.trim(),
            };

            let result_response;
            let currentTestId = testId;

            if (!currentTestId) {
                try {
                    const existing = await getGantryTiltByServiceIdForCTScan(serviceId);
                    if (existing?.data?._id) {
                        currentTestId = existing.data._id;
                        setTestId(currentTestId);
                    }
                } catch (err) {
                    // No existing data, will create new
                }
            }

            if (currentTestId) {
                result_response = await updateGantryTiltForCTScan(currentTestId, payload);
                toast.success('Updated successfully!');
            } else {
                result_response = await addGantryTiltForCTScan(serviceId, payload);
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
                <h2 className="text-2xl font-bold text-gray-800">Gantry Tilt Measurement</h2>
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
                            {buttonText} Gantry Tilt
                        </>
                    )}
                </button>
            </div>

            {/* Parameters Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Parameters</h3>
                    {!isViewMode && (
                        <button
                            onClick={addParameterRow}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Column
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-300 bg-gray-50">
                                <th className="text-left p-3 font-medium text-gray-700">Parameter Name</th>
                                <th className="text-left p-3 font-medium text-gray-700">Value</th>
                                {!isViewMode && parameters.length > 1 && (
                                    <th className="w-12 p-3"></th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {parameters.map((param) => (
                                <tr key={param.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={param.name}
                                            onChange={(e) => updateParameter(param.id, 'name', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                }`}
                                            placeholder="Parameter name"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={param.value}
                                            onChange={(e) => updateParameter(param.id, 'value', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                }`}
                                            placeholder="Value"
                                        />
                                    </td>
                                    {!isViewMode && parameters.length > 1 && (
                                        <td className="p-3">
                                            <button
                                                onClick={() => deleteParameter(param.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Measurement Results</h3>
                    {!isViewMode && (
                        <button
                            onClick={addMeasurementRow}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Row
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-300 bg-gray-50">
                                <th className="text-left p-3 font-medium text-gray-700">Actual Gantry Tilt</th>
                                <th className="text-left p-3 font-medium text-gray-700">Measured Gantry Tilt</th>
                                <th className="text-left p-3 font-medium text-gray-700">Tolerance</th>
                                <th className="text-left p-3 font-medium text-gray-700">Remarks</th>
                                {!isViewMode && measurements.length > 1 && (
                                    <th className="w-12 p-3"></th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {measurementsWithRemarks.map((measurement) => (
                                <tr key={measurement.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={measurement.actual}
                                            onChange={(e) => updateMeasurement(measurement.id, 'actual', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                }`}
                                            placeholder="e.g., 0°"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={measurement.measured}
                                            onChange={(e) => updateMeasurement(measurement.id, 'measured', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                }`}
                                            placeholder="e.g., 1.5°"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md font-medium">
                                            {toleranceDisplay}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${measurement.remark === 'Pass'
                                                ? 'bg-green-100 text-green-800'
                                                : measurement.remark === 'Fail'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {measurement.remark || '—'}
                                        </span>
                                    </td>
                                    {!isViewMode && measurements.length > 1 && (
                                        <td className="p-3">
                                            <button
                                                onClick={() => deleteMeasurement(measurement.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tolerance Section */}
            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Tolerance:</label>
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
                    <span className="text-sm text-gray-600">°</span>
                </div>
            </div>
        </div>
    );
};

export default GantryTilt;
