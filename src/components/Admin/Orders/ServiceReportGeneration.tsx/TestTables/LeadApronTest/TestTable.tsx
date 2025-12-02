// components/TestTables/ScatterRadiationTest.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Technique {
    ffd: string;
    kv: string;
    mas: string;
}

interface DoseRow {
    id: string;
    position: string;
    doseValue: string;  // User enters
    reading: string;    // User enters
}

const ScatterRadiationTest: React.FC = () => {
    // First Table - Technique Factors
    const [technique, setTechnique] = useState<Technique>({
        ffd: '100',
        kv: '80',
        mas: '10',
    });

    // Second Table - Dose Measurements
    const [doseRows, setDoseRows] = useState<DoseRow[]>([
        { id: 'neutral', position: 'Neutral', doseValue: '', reading: '' },
        { id: '1', position: 'Position 1', doseValue: '', reading: '' },
        { id: '2', position: 'Position 2', doseValue: '', reading: '' },
    ]);

    // Add new position row
    const addRow = () => {
        const newId = Date.now().toString();
        const newPosition = `Position ${doseRows.filter(r => r.id !== 'neutral').length + 1}`;
        setDoseRows(prev => [...prev, { id: newId, position: newPosition, doseValue: '', reading: '' }]);
    };

    // Remove row (except Neutral)
    const removeRow = (id: string) => {
        if (id === 'neutral') return;
        setDoseRows(prev => prev.filter(r => r.id !== id));
    };

    // Update dose value or reading
    const updateRow = (id: string, field: 'doseValue' | 'reading', value: string) => {
        setDoseRows(prev =>
            prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // Calculations
    const calculations = useMemo(() => {
        const neutralRow = doseRows.find(r => r.id === 'neutral');
        const neutralDose = parseFloat(neutralRow?.doseValue || '0') || 0;

        const otherRows = doseRows.filter(r => r.id !== 'neutral');
        const values = otherRows
            .map(r => parseFloat(r.doseValue))
            .filter(v => !isNaN(v) && v > 0);

        const avg = values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;

        const reductionPercent = neutralDose > 0
            ? ((neutralDose - avg) / neutralDose) * 100
            : 0;

        const remark = neutralDose > 0 && avg > 0
            ? (reductionPercent >= 50 ? 'PASS' : 'FAIL')  // Example: ≥50% reduction = PASS
            : '';

        return {
            neutralDose: neutralDose.toFixed(3),
            avg: avg.toFixed(3),
            reductionPercent: reductionPercent.toFixed(2),
            remark,
        };
    }, [doseRows]);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-center text-gray-800">
                Scatter Radiation & Collimator Assessment
            </h1>

            {/* First Table: Technique Factors */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-5">
                    <h2 className="text-2xl font-bold text-white">1. Technique Factors Used</h2>
                </div>
                <div className="p-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-4 px-6 text-gray-700 font-semibold">FFD (cm)</th>
                                <th className="text-left py-4 px-6 text-gray-700 font-semibold">kV</th>
                                <th className="text-left py-4 px-6 text-gray-700 font-semibold">mAs</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-4 px-6">
                                    <input
                                        type="text"
                                        value={technique.ffd}
                                        onChange={(e) => setTechnique({ ...technique, ffd: e.target.value })}
                                        className="w-32 px-4 py-3 text-center border-2 border-indigo-300 rounded-lg font-medium focus:border-indigo-600 focus:outline-none"
                                        placeholder="100"
                                    />
                                </td>
                                <td className="py-4 px-6">
                                    <input
                                        type="text"
                                        value={technique.kv}
                                        onChange={(e) => setTechnique({ ...technique, kv: e.target.value })}
                                        className="w-32 px-4 py-3 text-center border-2 border-indigo-300 rounded-lg font-medium focus:border-indigo-600 focus:outline-none"
                                        placeholder="80"
                                    />
                                </td>
                                <td className="py-4 px-6">
                                    <input
                                        type="text"
                                        value={technique.mas}
                                        onChange={(e) => setTechnique({ ...technique, mas: e.target.value })}
                                        className="w-32 px-4 py-3 text-center border-2 border-indigo-300 rounded-lg font-medium focus:border-indigo-600 focus:outline-none"
                                        placeholder="10"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Second Table: Dose Measurements */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-5">
                    <h2 className="text-2xl font-bold text-white">2. Scatter Radiation Measurement</h2>
                </div>
                <div className="p-8">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-teal-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-teal-900 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-teal-900 uppercase tracking-wider">
                                        Dose Values (µGy)
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-teal-900 uppercase tracking-wider">
                                        Readings
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-teal-900 uppercase tracking-wider">
                                        Average Value
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-teal-900 uppercase tracking-wider">
                                        % Reduction in Dose
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-teal-900 uppercase tracking-wider">
                                        Remark
                                    </th>
                                    <th className="w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {doseRows.map((row, index) => {
                                    const isNeutral = row.id === 'neutral';
                                    const isCalculatedRow = index === doseRows.length - 2 && doseRows.length > 2;

                                    if (isCalculatedRow) {
                                        return null; // We'll render average row separately
                                    }

                                    return (
                                        <tr key={row.id} className={`${isNeutral ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isNeutral ? 'Neutral (No Collimation)' : row.position}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={row.doseValue}
                                                    onChange={(e) => updateRow(row.id, 'doseValue', e.target.value)}
                                                    disabled={isNeutral && row.doseValue === '' ? false : false}
                                                    className={`w-32 px-4 py-2 text-center border rounded-lg font-medium ${isNeutral ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                        } focus:border-teal-500 focus:outline-none`}
                                                    placeholder={isNeutral ? "Enter neutral dose" : "0.000"}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="text"
                                                    value={row.reading}
                                                    onChange={(e) => updateRow(row.id, 'reading', e.target.value)}
                                                    className="w-32 px-4 py-2 text-center border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                                                    placeholder="Notes"
                                                />
                                            </td>
                                            {isNeutral ? (
                                                <>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-700">—</td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-700">—</td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-700">Reference</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 text-center">—</td>
                                                    <td className="px-6 py-4 text-center">—</td>
                                                    <td className="px-6 py-4 text-center">—</td>
                                                </>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                {!isNeutral && (
                                                    <button
                                                        onClick={() => removeRow(row.id)}
                                                        className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Average & Result Row */}
                                <tr className="bg-teal-50 font-bold text-teal-900 border-t-4 border-teal-600">
                                    <td className="px-6 py-4">Average of Positions</td>
                                    <td className="px-6 py-4 text-center">{calculations.avg}</td>
                                    <td className="px-6 py-4 text-center">—</td>
                                    <td className="px-6 py-4 text-center text-xl">
                                        {calculations.avg}
                                    </td>
                                    <td className="px-6 py-4 text-center text-xl">
                                        {calculations.reductionPercent}%
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${calculations.remark === 'PASS'
                                                ? 'bg-green-100 text-green-800'
                                                : calculations.remark === 'FAIL'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {calculations.remark || '—'}
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={addRow}
                            className="flex items-center gap-3 px-8 py-4 bg-teal-600 text-white text-lg font-medium rounded-xl hover:bg-teal-700 transition shadow-lg"
                        >
                            <Plus className="w-6 h-6" />
                            Add New Position
                        </button>
                    </div>

                    {/* Final Recommendation */}
                    <div className="mt-12 p-8 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-300">
                        <h3 className="text-2xl font-bold text-teal-900 mb-4">Final Result</h3>
                        <p className="text-lg leading-relaxed text-teal-800">
                            {calculations.remark === 'PASS'
                                ? `Excellent collimation performance! Scatter radiation reduced by ${calculations.reductionPercent}%. Complies with AERB and IEC guidelines.`
                                : calculations.remark === 'FAIL'
                                    ? `Warning: Only ${calculations.reductionPercent}% reduction achieved. Collimator/light field alignment may be poor or shielding inadequate. Immediate recalibration/replacement recommended.`
                                    : 'Please enter Neutral dose and position measurements to evaluate collimator efficiency.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScatterRadiationTest;