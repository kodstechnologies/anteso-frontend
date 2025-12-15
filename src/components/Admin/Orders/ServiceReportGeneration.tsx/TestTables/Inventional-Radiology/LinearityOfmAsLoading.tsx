import React, { useState, useEffect } from 'react';
import { Save, Loader2, Edit3, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addLinearityOfmAsLoadingForInventionalRadiology,
    getLinearityOfmAsLoadingByServiceIdForInventionalRadiology
} from "../../../../../../api";

interface Table1Row {
    fcd: string;
    kv: string;
    time: string;
}

interface Table2Row {
    mAsApplied: string;
    measuredOutputs: string[];
    average: string;
    x: string;
}

interface Props {
    serviceId: string;
}

const LinearityOfmAsLoading: React.FC<Props> = ({ serviceId }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(true);

    const [table1, setTable1] = useState<Table1Row[]>([{ fcd: '', kv: '', time: '' }]);
    const [table2, setTable2] = useState<Table2Row[]>([{ mAsApplied: '', measuredOutputs: ['', '', '', ''], average: '', x: '' }]);

    const [xMax, setXMax] = useState('');
    const [xMin, setXMin] = useState('');
    const [col, setCol] = useState('');
    const [tolerance, setTolerance] = useState('0.1');
    const [remarks, setRemarks] = useState('');

    // Auto Calc
    useEffect(() => {
        // 1. Update Table 2 Calculations (Average & X)
        const newTable2 = table2.map(row => {
            const validMs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v));
            let avg = 0;
            let x = 0;
            if (validMs.length > 0) {
                avg = validMs.reduce((a, b) => a + b, 0) / validMs.length;
                const mAs = parseFloat(row.mAsApplied);
                if (!isNaN(mAs) && mAs !== 0) {
                    x = avg / mAs;
                }
            }
            return {
                ...row,
                average: avg > 0 ? avg.toFixed(2) : '',
                x: x > 0 ? x.toFixed(2) : ''
            };
        });

        // Check if we need to update state to avoid infinite loops
        // We'll calculate stats from `newTable2` for Xmax, Xmin, CoL
        const allXs = newTable2.map(r => parseFloat(r.x)).filter(v => !isNaN(v) && v > 0);
        let newXMax = '';
        let newXMin = '';
        let newCol = '';
        let newRemark = '';

        if (allXs.length > 0) {
            const max = Math.max(...allXs);
            const min = Math.min(...allXs);
            const colVal = (max - min) / (max + min);

            newXMax = max.toFixed(2);
            newXMin = min.toFixed(2);
            newCol = colVal.toFixed(4);
            newRemark = colVal <= parseFloat(tolerance) ? 'Pass' : 'Fail';
        }

        // Optimization: Only set state if deep equal check fails? 
        // For restoration, I'll rely on triggering update only if values significantly differ or rely on User input primarily triggering re-renders.
        // Ideally, update derived values in render, but XMax etc need own display.
        // I'll set these "derived" states. Note: This effect runs on `table2` changes. 
        // I must NOT setTable2 inside here if it creates a loop. I constructed `newTable2` but didn't set it yet.
        // BUT! I must update the row.average/x in the UI.

        // To properly break loop: Only setTable2 if calculated values differ from current row values.
        const isDiff = newTable2.some((r, i) => r.average !== table2[i].average || r.x !== table2[i].x);
        if (isDiff) {
            setTable2(newTable2);
            // This will trigger effect again. Convergence should happen in 1 step because newTable2 calc is deterministic.
            return;
        }

        // If table2 is stable, update summary stats
        if (newXMax !== xMax || newXMin !== xMin || newCol !== col || newRemark !== remarks) {
            setXMax(newXMax);
            setXMin(newXMin);
            setCol(newCol);
            setRemarks(newRemark);
        }

    }, [table2, tolerance]);

    const handleTable1Change = (idx: number, field: keyof Table1Row, val: string) => {
        const newData = [...table1];
        newData[idx][field] = val;
        setTable1(newData);
    };

    const handleTable2Change = (idx: number, field: string, val: string, subIdx?: number) => {
        const newData = [...table2];
        if (field === 'measuredOutputs' && typeof subIdx === 'number') {
            newData[idx].measuredOutputs[subIdx] = val;
        } else if (field === 'mAsApplied') {
            newData[idx].mAsApplied = val;
        }
        setTable2(newData);
    };

    useEffect(() => {
        const loadData = async () => {
            if (!serviceId) return;
            setLoading(true);
            try {
                const res = await getLinearityOfmAsLoadingByServiceIdForInventionalRadiology(serviceId);
                if (res?.data) {
                    const d = res.data;
                    if (d.table1) setTable1(d.table1);
                    if (d.table2) setTable2(d.table2);
                    setXMax(d.xMax || '');
                    setXMin(d.xMin || '');
                    setCol(d.col || '');
                    setRemarks(d.remarks || '');
                    setTolerance(d.tolerance || '0.1');
                    setIsSaved(true);
                    setIsEditing(false);
                }
            } catch (err) {
                // console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [serviceId]);

    const handleSave = async () => {
        if (!serviceId) return toast.error("Service ID missing");
        setSaving(true);
        try {
            await addLinearityOfmAsLoadingForInventionalRadiology(serviceId, {
                table1,
                table2,
                xMax,
                xMin,
                col,
                remarks,
                tolerance
            });
            toast.success("Linearity mAs Data Saved");
            setIsSaved(true);
            setIsEditing(false);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const isViewMode = isSaved && !isEditing;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Linearity of mAs Loading</h3>
                <button
                    onClick={isViewMode ? () => setIsEditing(true) : handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition ${isViewMode ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isViewMode ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isViewMode ? "Edit" : "Save"}
                </button>
            </div>

            <div className="p-6">
                {/* Table 1 */}
                <h4 className="font-semibold text-gray-700 mb-2">Settings (Technique Factors)</h4>
                <div className="grid grid-cols-1 gap-2 mb-6">
                    {table1.map((row, i) => (
                        <div key={i} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">FCD (cm)</label>
                                <input type="text" value={row.fcd} onChange={e => handleTable1Change(i, 'fcd', e.target.value)} disabled={isViewMode} className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">kV</label>
                                <input type="text" value={row.kv} onChange={e => handleTable1Change(i, 'kv', e.target.value)} disabled={isViewMode} className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Time (ms)</label>
                                <input type="text" value={row.time} onChange={e => handleTable1Change(i, 'time', e.target.value)} disabled={isViewMode} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table 2 */}
                <h4 className="font-semibold text-gray-700 mb-2">Measurements</h4>
                <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse border border-gray-200 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">mAs Applied</th>
                                <th className="border p-2" colSpan={4}>Measured Output (mGy)</th>
                                <th className="border p-2">Average</th>
                                <th className="border p-2">X (mGy/mAs)</th>
                                {!isViewMode && <th className="border p-2"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {table2.map((row, i) => (
                                <tr key={i}>
                                    <td className="border p-2">
                                        <input type="number" value={row.mAsApplied} onChange={e => handleTable2Change(i, 'mAsApplied', e.target.value)} disabled={isViewMode} className="w-full p-1 border rounded" />
                                    </td>
                                    {row.measuredOutputs.map((v, j) => (
                                        <td key={j} className="border p-2">
                                            <input type="number" value={v} onChange={e => handleTable2Change(i, 'measuredOutputs', e.target.value, j)} disabled={isViewMode} className="w-full p-1 border rounded" />
                                        </td>
                                    ))}
                                    <td className="border p-2 bg-gray-50">{row.average}</td>
                                    <td className="border p-2 bg-gray-50">{row.x}</td>
                                    {!isViewMode && (
                                        <td className="border p-2 text-center">
                                            <button onClick={() => setTable2(table2.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isViewMode && (
                        <button onClick={() => setTable2([...table2, { mAsApplied: '', measuredOutputs: ['', '', '', ''], average: '', x: '' }])} className="mt-2 text-blue-600 text-sm font-medium flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Row
                        </button>
                    )}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded border">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">X Max</label>
                        <div className="font-mono text-lg">{xMax || '-'}</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">X Min</label>
                        <div className="font-mono text-lg">{xMin || '-'}</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">CoL</label>
                        <div className="font-mono text-lg text-blue-600">{col || '-'}</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Remark</label>
                        <div className={`font-bold text-lg ${remarks === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>{remarks || '-'}</div>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tolerance</label>
                        <input type="number" value={tolerance} onChange={e => setTolerance(e.target.value)} disabled={isViewMode} className="ml-2 w-20 p-1 border rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinearityOfmAsLoading;
