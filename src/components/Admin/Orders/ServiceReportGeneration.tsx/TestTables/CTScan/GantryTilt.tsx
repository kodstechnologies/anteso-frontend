

import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface Parameter {
    id: string;
    name: string;
    value: string;
}

interface Measurement {
    id: string;
    actual: string;
    measured: string;
}

export default function GantryTilt() {
    // Parameters table state
    const [parameters, setParameters] = useState<Parameter[]>([
        { id: '1', name: 'Parameter 1', value: '' }
    ]);

    // Measurements table state
    const [measurements, setMeasurements] = useState<Measurement[]>([
        { id: '1', actual: '', measured: '' }
    ]);

    const TOLERANCE = '±2°';

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

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Gantry Tilt Measurement</h1>

                    {/* Parameters Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Parameters</h2>
                            <button
                                onClick={addParameterRow}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Column
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="text-left p-3 font-medium text-gray-700">Parameter Name</th>
                                        <th className="text-left p-3 font-medium text-gray-700">Value</th>
                                        {parameters.length > 1 && (
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
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Parameter name"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={param.value}
                                                    onChange={(e) => updateParameter(param.id, 'value', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Value"
                                                />
                                            </td>
                                            {parameters.length > 1 && (
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
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Measurement Results</h2>
                            <button
                                onClick={addMeasurementRow}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Row
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="text-left p-3 font-medium text-gray-700">Actual Gantry Tilt</th>
                                        <th className="text-left p-3 font-medium text-gray-700">Measured Gantry Tilt</th>
                                        <th className="text-left p-3 font-medium text-gray-700">Tolerance</th>
                                        {measurements.length > 1 && (
                                            <th className="w-12 p-3"></th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {measurements.map((measurement) => (
                                        <tr key={measurement.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={measurement.actual}
                                                    onChange={(e) => updateMeasurement(measurement.id, 'actual', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., 0°"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={measurement.measured}
                                                    onChange={(e) => updateMeasurement(measurement.id, 'measured', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., 1.5°"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md font-medium">
                                                    {TOLERANCE}
                                                </div>
                                            </td>
                                            {measurements.length > 1 && (
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
                </div>
            </div>
        </>
    );
}