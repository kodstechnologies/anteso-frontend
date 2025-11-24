import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import {
    addRadiationProfileWidth,
    getRadiationProfileWidthByTestId,
    updateRadiationProfileWidth,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row { kvp: string; ma: string; }
interface Table2Row {
    id: number;
    applied: string;
    measured: string;
    criteriaValue: string;
    toleranceValue: string;
    remarks: string;
}
interface Props { serviceId: string; testId?: string; onTestSaved?: (testId: string) => void;}

const RadiationProfileWidth: React.FC<Props> = ({ serviceId, testId: propTestId ,onTestSaved}) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);
    const [table1Row, setTable1Row] = useState<Table1Row>({ kvp: '', ma: '' });
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        { id: 1, applied: '', measured: '', criteriaValue: '0.5 mm', toleranceValue: '', remarks: '' },
        { id: 2, applied: '', measured: '', criteriaValue: '±50%', toleranceValue: '', remarks: '' },
        { id: 3, applied: '', measured: '', criteriaValue: '±1.0 mm', toleranceValue: '', remarks: '' },
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // ← NEW: controls edit mode
    const [hasSaved, setHasSaved] = useState(false);   // ← NEW: track if saved once

    const TOLERANCE_RULES = [
        { label: 'a. Less than 1.0 mm', type: 'fixed' as const, value: 0.5 },
        { label: 'b. 1.0 mm to 2.0 mm', type: 'percent' as const, value: 50 },
        { label: 'c. Above 2.0 mm', type: 'fixed' as const, value: 1.0 },
    ];

    // ---- helpers ----
    const updateTable1 = (f: 'kvp' | 'ma', v: string) => setTable1Row(p => ({ ...p, [f]: v }));
    const updateTable2 = (id: number, f: 'applied' | 'measured', v: string) =>
        setTable2Rows(p => p.map(r => (r.id === id ? { ...r, [f]: v } : r)));

    // ---- auto-calc tolerance ----
    useEffect(() => {
        setTable2Rows(prev =>
            prev.map(row => {
                const a = parseFloat(row.applied) || 0;
                const m = parseFloat(row.measured) || 0;
                if (!a || !m) return { ...row, toleranceValue: '', remarks: '' };
                const rule = TOLERANCE_RULES[row.id - 1];
                const tol = rule.type === 'fixed' ? rule.value : (a * rule.value) / 100;
                const pass = m >= a - tol && m <= a + tol;
                return { ...row, toleranceValue: `±${tol.toFixed(3)}`, remarks: pass ? 'Pass' : 'Fail' };
            })
        );
    }, [table2Rows.map(r => `${r.id}-${r.applied}-${r.measured}`).join()]);

    // ---- form valid ----
    const isFormValid = useMemo(() => {
        return (
            !!serviceId &&
            table1Row.kvp.trim() &&
            table1Row.ma.trim() &&
            table2Rows.every(r => r.applied.trim() && r.measured.trim())
        );
    }, [serviceId, table1Row, table2Rows]);

    // ---- load existing data ----
    useEffect(() => {
        if (!testId) {
            setIsLoading(false);
            return;
        }
        const load = async () => {
            try {
                const { data } = await getRadiationProfileWidthByTestId(testId);
                const rec = data;
                if (rec.table1?.[0]) {
                    setTable1Row({ kvp: rec.table1[0].kvp, ma: rec.table1[0].ma });
                }
                if (Array.isArray(rec.table2) && rec.table2.length === 3) {
                    setTable2Rows(prev =>
                        prev.map((r, i) => ({
                            ...r,
                            applied: String(rec.table2[i].applied),
                            measured: String(rec.table2[i].measured),
                            toleranceValue: rec.table2[i].tolerance || '',
                            remarks: rec.table2[i].remarks || '',
                        }))
                    );
                }
                setHasSaved(true);
                setIsEditing(false); // start in view mode
            } catch (e: any) {
                if (e.response?.status !== 404) toast.error('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [testId]);

    // ---- handle save / update ----
    const handleSave = async () => {
        if (!isFormValid) return;
        setIsSaving(true);

        const payload = {
            table1: [{ kvp: table1Row.kvp.trim(), ma: table1Row.ma.trim() }],
            table2: table2Rows.map(r => ({
                applied: parseFloat(r.applied),
                measured: parseFloat(r.measured),
                tolerance: r.toleranceValue,
                remarks: r.remarks,
            })),
        };

        try {
            let res;
            if (testId) {
                res = await updateRadiationProfileWidth(testId, payload);
                toast.success('Updated successfully!');
            } else {
                res = await addRadiationProfileWidth(serviceId, payload);
                setTestId(res.data.testId);
                toast.success('Saved successfully!');
            }
            setHasSaved(true);
            setIsEditing(false); // lock form after save
        } catch (e: any) {
            toast.error(e.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    // ---- toggle edit mode ----
    const toggleEdit = () => {
        if (!hasSaved) return;
        setIsEditing(true);
    };

    // ---- button state ----
    const isViewMode = hasSaved && !isEditing;
    const buttonText = isViewMode ? 'Edit' : (testId ? 'Update' : 'Save');
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
        <div className="p-6 max-w-6xl mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Radiation Profile Width</h2>

            {/* Table 1 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Tube Operating Parameters
                </h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">kVp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">mA</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-2 border-r">
                                <input
                                    type="text"
                                    value={table1Row.kvp}
                                    onChange={e => updateTable1('kvp', e.target.value)}
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                            ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                            : 'border-gray-300'
                                        }`}
                                    placeholder="80"
                                />
                            </td>
                            <td className="px-6 py-2">
                                <input
                                    type="text"
                                    value={table1Row.ma}
                                    onChange={e => updateTable1('ma', e.target.value)}
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                            ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                            : 'border-gray-300'
                                        }`}
                                    placeholder="100"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Table 2 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
                    Slice Thickness Measurement
                </h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Applied (mm)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Measured (mm)</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Criteria</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Tolerance (± mm)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {table2Rows.map(row => {
                            const rule = TOLERANCE_RULES[row.id - 1];
                            return (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.applied}
                                            onChange={e => updateTable2(row.id, 'applied', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                                    : 'border-gray-300'
                                                }`}
                                            placeholder={row.id === 1 ? '0.6' : row.id === 2 ? '1.25' : '3.0'}
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.measured}
                                            onChange={e => updateTable2(row.id, 'measured', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                                                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                                                    : 'border-gray-300'
                                                }`}
                                            placeholder={row.id === 1 ? '1.0' : row.id === 2 ? '1.30' : '3.8'}
                                        />
                                    </td>
                                    <td className="px-4 py-2 border-r text-center text-xs">{rule.label}</td>
                                    <td className="px-4 py-2 border-r text-center text-xs">
                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{row.toleranceValue || '—'}</span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${row.remarks === 'Pass'
                                                    ? 'bg-green-100 text-green-800'
                                                    : row.remarks === 'Fail'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'text-gray-400'
                                                }`}
                                        >
                                            {row.remarks || '—'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex justify-end mt-6">
                <button
                    onClick={isViewMode ? toggleEdit : handleSave}
                    disabled={isSaving || (!isViewMode && !isFormValid)}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${isSaving || (!isViewMode && !isFormValid)
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
                            {buttonText} Radiation Profile Width
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default RadiationProfileWidth;