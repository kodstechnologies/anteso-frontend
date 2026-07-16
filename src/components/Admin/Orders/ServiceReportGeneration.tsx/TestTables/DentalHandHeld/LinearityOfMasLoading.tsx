// components/TestTables/LinearityOfMasLoading.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addLinearityOfMasLoadingForDentalHandHeld,
    getLinearityOfMasLoadingByServiceIdForDentalHandHeld,
    updateLinearityOfMasLoadingForDentalHandHeld,
} from '../../../../../../api';
import { normalizeCsvComparisonOperator } from '../shared/parseRadiographyStyleTableFormat';
import { useRegisterTestExport } from '../shared/TestExportRegistry';

interface ExposureCondition {
    fcd: string;
    kv: string;
}

interface Table2Row {
    id: string;
    mAsRange: string;
    measuredOutputs: string[];
    average: string;
    x: string;
    xMax: string;
    xMin: string;
    col: string;
    remarks: string;
}

interface Props {
    serviceId: string;
    testId?: string | null;
    onTestSaved?: (testId: string) => void;
    onRefresh?: () => void;
    csvData?: any[];
}

const padMeasuredOutputs = (outputs: unknown, count: number): string[] => {
    const src = Array.isArray(outputs) ? outputs : [];
    const next = src.map((v) => (v != null ? String(v) : ''));
    while (next.length < count) next.push('');
    return next.slice(0, Math.max(count, 1));
};

const LinearityOfMasLoading: React.FC<Props> = ({ serviceId, testId: propTestId = null, onTestSaved, onRefresh, csvData }) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    const [exposureCondition, setExposureCondition] = useState<ExposureCondition>({ fcd: '100', kv: '80' });

    const [measHeaders, setMeasHeaders] = useState<string[]>(['Measured mR 1', 'Measured mR 2', 'Measured mR 3']);
    const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
        { id: '1', mAsRange: '5', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '2', mAsRange: '10', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '3', mAsRange: '20', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
        { id: '4', mAsRange: '50', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    ]);

    const [tolerance, setTolerance] = useState<string>('0.1');
    const [toleranceOperator, setToleranceOperator] = useState<string>('<=');

    const isViewMode = hasSaved && !isEditing;

    const syncRowsToHeaderCount = (rows: Table2Row[], headerCount: number): Table2Row[] =>
        rows.map((r) => ({ ...r, measuredOutputs: padMeasuredOutputs(r.measuredOutputs, headerCount) }));

    const addMeasColumn = () => {
        if (isViewMode) return;
        const nextCount = measHeaders.length + 1;
        setMeasHeaders((p) => [...p, `Measured mR ${p.length + 1}`]);
        setTable2Rows((rows) => syncRowsToHeaderCount(rows, nextCount));
    };

    const removeMeasColumn = (idx: number) => {
        if (measHeaders.length <= 1) return;
        setMeasHeaders((p) => p.filter((_, i) => i !== idx));
        setTable2Rows((p) =>
            p.map((r) => ({
                ...r,
                measuredOutputs: r.measuredOutputs.filter((_, i) => i !== idx),
            }))
        );
    };

    const addTable2Row = () => {
        setTable2Rows((p) => [
            ...p,
            {
                id: Date.now().toString(),
                mAsRange: '',
                measuredOutputs: Array(measHeaders.length).fill(''),
                average: '',
                x: '',
                xMax: '',
                xMin: '',
                col: '',
                remarks: '',
            },
        ]);
    };

    const removeTable2Row = (id: string) => {
        if (table2Rows.length <= 1) return;
        setTable2Rows((p) => p.filter((r) => r.id !== id));
    };

    const updateCell = (rowId: string, field: 'mAsRange' | number, value: string) => {
        if (isViewMode) return;
        setTable2Rows((p) =>
            p.map((r) => {
                if (r.id !== rowId) return r;
                if (field === 'mAsRange') return { ...r, mAsRange: value };
                if (typeof field === 'number') {
                    const outputs = padMeasuredOutputs(r.measuredOutputs, measHeaders.length);
                    outputs[field] = value;
                    return { ...r, measuredOutputs: outputs };
                }
                return r;
            })
        );
    };

    useEffect(() => {
        const load = async () => {
            if (!serviceId) {
                setIsLoading(false);
                return;
            }
            const hasCsvImport = Array.isArray(csvData) && csvData.length > 0;
            try {
                const res = await getLinearityOfMasLoadingByServiceIdForDentalHandHeld(serviceId);
                const data = res?.data;
                if (data) {
                    setTestId(data._id || null);
                    if (!hasCsvImport) {
                        if (data.table1) {
                            setExposureCondition({
                                fcd: data.table1.fcd || '100',
                                kv: data.table1.kv || '80',
                            });
                        }
                        if (Array.isArray(data.table2) && data.table2.length > 0) {
                            const maxCols = Math.max(
                                Array.isArray(data.measHeaders) ? data.measHeaders.length : 0,
                                ...data.table2.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0)),
                                3
                            );
                            const headers =
                                Array.isArray(data.measHeaders) && data.measHeaders.length > 0
                                    ? Array.from({ length: maxCols }, (_, i) =>
                                        String(data.measHeaders[i] ?? '').trim() || `Measured mR ${i + 1}`
                                      )
                                    : Array.from({ length: maxCols }, (_, i) => `Measured mR ${i + 1}`);
                            setMeasHeaders(headers);
                            setTable2Rows(
                                data.table2.map((r: any, i: number) => {
                                    const maValue = r.mAsRange || r.ma || r.mas || '';
                                    const mAsRange = maValue
                                        ? (/\bmAs\b/i.test(String(maValue)) || /[-–]/.test(String(maValue))
                                            ? String(maValue)
                                            : `${maValue}`)
                                        : '';
                                    return {
                                        id: String(i + 1),
                                        mAsRange,
                                        measuredOutputs: padMeasuredOutputs(r.measuredOutputs, headers.length),
                                        average: r.average || '',
                                        x: r.x || '',
                                        xMax: r.xMax || '',
                                        xMin: r.xMin || '',
                                        col: r.col || '',
                                        remarks: r.remarks || '',
                                    };
                                })
                            );
                        }
                        setTolerance(data.tolerance || '0.1');
                        setToleranceOperator(
                            normalizeCsvComparisonOperator(data.toleranceOperator || '<=')
                        );
                        setHasSaved(true);
                        setIsEditing(false);
                    } else {
                        setIsEditing(true);
                        setHasSaved(false);
                    }
                    if (data._id && !propTestId) {
                        onTestSaved?.(data._id);
                    }
                } else {
                    setIsEditing(true);
                }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    toast.error('Failed to load mAs linearity data');
                }
                setIsEditing(true);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [serviceId, csvData]);

    useEffect(() => {
        if (csvData && csvData.length > 0) {
            const csvMeasLabels = csvData.find(r => r['Field Name'] === 'MeasColumnLabels')?.['Value'];
            const fcd = csvData.find(r => r['Field Name'] === 'FCD')?.['Value'];
            const kv = csvData.find(r => r['Field Name'] === 'kV')?.['Value'];
            const tolOp = csvData.find(r => {
                const f = String(r['Field Name'] || '').trim();
                return (
                    f === 'Tolerance_Operator' ||
                    f === 'ToleranceOperator' ||
                    f === 'Tolerance_Sign' ||
                    /^tolerance[_\s]?operator$/i.test(f) ||
                    /^tol[_\s]?operator$/i.test(f)
                );
            })?.['Value'];
            const tolVal = csvData.find(r => {
                const f = String(r['Field Name'] || '').trim();
                return (
                    f === 'Tolerance' ||
                    f === 'Tolerance_Value' ||
                    f === 'Tolerance Value' ||
                    /^tolerance[_\s]?value/i.test(f) ||
                    /^tol[_\s]?value$/i.test(f)
                );
            })?.['Value'];

            if (fcd || kv) {
                setExposureCondition(prev => ({
                    fcd: fcd || prev.fcd,
                    kv: kv || prev.kv
                }));
            }

            if (tolOp != null && String(tolOp).trim() !== '') {
                const op = normalizeCsvComparisonOperator(tolOp);
                if (['<', '>', '<=', '>=', '='].includes(op)) setToleranceOperator(op);
            }
            if (tolVal != null && String(tolVal).trim() !== '') setTolerance(String(tolVal).trim());

            const rowIndices = [...new Set(csvData
                .filter(r => r['Field Name'] && (r['Field Name'] === 'mAs_Range' || r['Field Name'].startsWith('Measured_')))
                .map(r => parseInt(r['Row Index']))
                .filter(i => !isNaN(i) && i >= 0)
            )].sort((a, b) => a - b);

            if (rowIndices.length > 0) {
                const newRows = rowIndices.map(idx => {
                    const rowData = csvData.filter(r => parseInt(r['Row Index']) === idx);
                    const mAsRange = rowData.find(r => r['Field Name'] === 'mAs_Range')?.['Value'] || '';

                    const measured: string[] = [];
                    for (let i = 0; i < 20; i++) {
                        const val = rowData.find(r => r['Field Name'] === `Measured_${i}`)?.['Value'];
                        if (val !== undefined) measured.push(val);
                        else break;
                    }

                    return {
                        id: String(idx),
                        mAsRange,
                        measuredOutputs: measured,
                        average: '',
                        x: '', xMax: '', xMin: '', col: '', remarks: ''
                    } as Table2Row;
                });

                const maxMeas = Math.max(3, ...newRows.map(r => r.measuredOutputs.length));
                const labelList = csvMeasLabels
                    ? String(csvMeasLabels).split(',').map((h: string) => h.trim()).filter(Boolean)
                    : [];
                const headers = Array.from({ length: maxMeas }, (_, i) =>
                    labelList[i] || `Measured mR ${i + 1}`
                );
                setMeasHeaders(headers);
                setTable2Rows(syncRowsToHeaderCount(newRows, headers.length));
            }

            if (!testId && (rowIndices.length > 0 || fcd || kv)) setIsEditing(true);
        }
    }, [csvData, testId]);

    const handleSave = async () => {
        if (!serviceId) {
            toast.error('Service ID is missing');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                table1: {
                    fcd: exposureCondition.fcd,
                    kv: exposureCondition.kv,
                    time: '',
                },
                table2: processedTable2.map(r => {
                    let maValue = '';
                    const match = r.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                    if (match) {
                        const mid = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
                        maValue = mid.toString();
                    } else {
                        const singleMatch = r.mAsRange.match(/(\d+(?:\.\d+)?)/);
                        maValue = singleMatch ? singleMatch[1] : r.mAsRange.replace(/[^\d.]/g, '');
                    }

                    return {
                        mAsRange: r.mAsRange || '',
                        ma: r.mAsRange || maValue,
                        mas: r.mAsRange || maValue,
                        measuredOutputs: padMeasuredOutputs(r.measuredOutputs, measHeaders.length).map(v => {
                            const val = v.trim();
                            return val === '' ? '' : val;
                        }),
                        average: r.average || '',
                        x: r.x || '',
                        xMax: r.xMax || '',
                        xMin: r.xMin || '',
                        col: r.col || '',
                        remarks: r.remarks === 'Pass' || r.remarks === 'Fail' ? r.remarks : '',
                    };
                }),
                tolerance,
                toleranceOperator,
                measHeaders,
            };

            let result;
            let currentTestId = testId;

            if (!currentTestId) {
                try {
                    const existing = await getLinearityOfMasLoadingByServiceIdForDentalHandHeld(serviceId);
                    if (existing?.data?._id) {
                        currentTestId = existing.data._id;
                        setTestId(currentTestId);
                    }
                } catch (err) {
                    // No existing data, will create new
                }
            }

            if (currentTestId) {
                result = await updateLinearityOfMasLoadingForDentalHandHeld(currentTestId, payload);
                toast.success('Updated successfully!');
            } else {
                result = await addLinearityOfMasLoadingForDentalHandHeld(serviceId, payload);
                const newId = result?.data?.testId || result?.data?._id;
                if (newId) {
                    setTestId(newId);
                    onTestSaved?.(newId);
                }
                toast.success('Saved successfully!');
            }
            // Keep columns locked to current headers after save
            setTable2Rows((prev) => syncRowsToHeaderCount(prev, measHeaders.length));
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
    const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
    const ButtonIcon = isViewMode ? Edit3 : Save;

    const processedTable2 = useMemo(() => {
        const tol = parseFloat(tolerance) || 0.1;
        const xValues: number[] = [];
        const colCount = Math.max(measHeaders.length, 1);

        const rowsWithX = table2Rows.map(row => {
            const measuredOutputs = padMeasuredOutputs(row.measuredOutputs, colCount);
            const outputs = measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
            const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';

            const match = row.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
            const midMas = match
                ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
                : parseFloat(row.mAsRange) || 0;

            const x = avg !== '—' && midMas > 0 ? (parseFloat(avg) / midMas).toFixed(4) : '—';
            if (x !== '—') xValues.push(parseFloat(x));

            return { ...row, measuredOutputs, average: avg, x };
        });

        const hasData = xValues.length > 0;
        const xMax = hasData ? Math.max(...xValues).toFixed(4) : '—';
        const xMin = hasData ? Math.min(...xValues).toFixed(4) : '—';
        const colNum = hasData
            ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
            : 0;
        const col = hasData ? colNum.toFixed(3) : '—';

        let pass = false;
        if (hasData && col !== '—') {
            switch (toleranceOperator) {
                case '<': pass = colNum < tol; break;
                case '>': pass = colNum > tol; break;
                case '<=': pass = colNum <= tol; break;
                case '>=': pass = colNum >= tol; break;
                case '=': pass = Math.abs(colNum - tol) < 0.0001; break;
                default: pass = colNum <= tol;
            }
        }

        return rowsWithX.map(row => ({
            ...row,
            xMax,
            xMin,
            col,
            remarks: hasData ? (pass ? 'Pass' : 'Fail') : '—',
        }));
    }, [table2Rows, measHeaders.length, tolerance, toleranceOperator]);

    const isFormValid = useMemo(() => {
        return (
            !!serviceId &&
            exposureCondition.fcd.trim() &&
            exposureCondition.kv.trim() &&
            table2Rows.every(r => r.mAsRange.trim() && r.measuredOutputs.some(v => v.trim()))
        );
    }, [serviceId, exposureCondition, table2Rows]);

    const getExportData = useCallback(() => {
        const hasRows = processedTable2.some(
            (r) => String(r.mAsRange || '').trim() || r.measuredOutputs.some((v) => String(v).trim())
        );
        const hasConditions =
            String(exposureCondition.fcd || '').trim() || String(exposureCondition.kv || '').trim();
        if (!hasRows && !hasConditions) return null;
        return {
            table1: {
                fcd: exposureCondition.fcd,
                kv: exposureCondition.kv,
                time: '',
            },
            table2: processedTable2.map((r) => ({
                mAsRange: r.mAsRange || '',
                ma: r.mAsRange || '',
                mas: r.mAsRange || '',
                measuredOutputs: r.measuredOutputs.map((v) => {
                    const val = v.trim();
                    return val === '' ? '' : val;
                }),
                average: r.average || '',
                x: r.x || '',
                xMax: r.xMax || '',
                xMin: r.xMin || '',
                col: r.col || '',
                remarks: r.remarks === 'Pass' || r.remarks === 'Fail' ? r.remarks : '',
            })),
            readings: processedTable2.map((r) => ({
                mas: r.mAsRange,
                meas1: r.measuredOutputs[0] || '',
                meas2: r.measuredOutputs[1] || '',
                meas3: r.measuredOutputs[2] || '',
                average: r.average || '',
                mRmAs: r.x || '',
                col: r.col || '',
            })),
            tolerance,
            toleranceOperator,
            measHeaders,
        };
    }, [processedTable2, exposureCondition, tolerance, toleranceOperator, measHeaders]);

    useRegisterTestExport('linearityOfMasLoading', getExportData);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto space-y-10">
            <h2 className="text-2xl font-bold text-gray-800">Linearity of mAs Loading (Across mAs Ranges)</h2>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-teal-50 border-b">
                    <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">FDD (cm)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">kV</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-6 py-4 border-r">
                                <input
                                    type="text"
                                    value={exposureCondition.fcd}
                                    onChange={e => setExposureCondition(p => ({ ...p, fcd: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                        }`}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <input
                                    type="text"
                                    value={exposureCondition.kv}
                                    onChange={e => setExposureCondition(p => ({ ...p, kv: e.target.value }))}
                                    disabled={isViewMode}
                                    className={`w-full px-4 py-2 text-center border rounded font-medium border-gray-300 focus:ring-2 focus:ring-teal-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                        }`}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-blue-50 border-b">
                    <h3 className="text-lg font-semibold text-blue-900">Linearity of Radiation Output Across mAs Ranges</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-max w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                            <tr>
                                <th rowSpan={2} className="sticky left-0 z-10 bg-blue-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r whitespace-nowrap">mAs Range</th>
                                <th colSpan={measHeaders.length} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">
                                    <div className="flex items-center justify-between px-4">
                                        <span>Radiation Output (mGy)</span>
                                        {!isViewMode && (
                                            <button onClick={addMeasColumn} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </th>
                                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">Avg Output</th>
                                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">X (mGy/mAs)</th>
                                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase border-r">CoL</th>
                                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Remarks</th>
                                <th rowSpan={2} className="w-12"></th>
                            </tr>
                            <tr>
                                {measHeaders.map((h, i) => (
                                    <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r">
                                        <div className="flex items-center justify-center gap-2">
                                            <input
                                                type="text"
                                                value={h}
                                                onChange={e => {
                                                    setMeasHeaders(p => {
                                                        const c = [...p];
                                                        c[i] = e.target.value || `Meas ${i + 1}`;
                                                        return c;
                                                    });
                                                }}
                                                disabled={isViewMode}
                                                className={`w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                    }`}
                                            />
                                            {measHeaders.length > 1 && !isViewMode && (
                                                <button onClick={() => removeMeasColumn(i)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {processedTable2.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r">
                                        <input
                                            type="text"
                                            value={p.mAsRange}
                                            onChange={e => updateCell(p.id, 'mAsRange', e.target.value)}
                                            disabled={isViewMode}
                                            className={`w-full min-w-[120px] px-3 py-2 text-center text-sm border rounded font-medium focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                }`}
                                            placeholder="10 - 20"
                                        />
                                    </td>
                                    {measHeaders.map((_, idx) => (
                                        <td key={idx} className="px-3 py-4 text-center border-r">
                                            <input
                                                type="number"
                                                step="any"
                                                value={p.measuredOutputs[idx] ?? ''}
                                                onChange={e => updateCell(p.id, idx, e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-24 px-3 py-2 text-center text-sm border rounded focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                                    }`}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.average}</td>
                                    <td className="px-6 py-4 text-center font-bold border-r bg-gray-50">{p.x}</td>
                                    <td className="px-6 py-4 text-center font-bold border-r bg-yellow-50">{p.col}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${p.remarks === 'Pass' ? 'bg-green-100 text-green-800' :
                                            p.remarks === 'Fail' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {p.remarks}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        {table2Rows.length > 1 && !isViewMode && (
                                            <button onClick={() => removeTable2Row(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                    {!isViewMode && (
                        <button onClick={addTable2Row} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            <Plus className="w-5 h-5" /> Add mAs Range
                        </button>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                        <span className="text-sm font-medium text-gray-700">Tolerance (CoL)</span>
                        <select
                            value={toleranceOperator}
                            onChange={e => setToleranceOperator(e.target.value)}
                            disabled={isViewMode}
                            className={`px-3 py-2.5 border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                        >
                            <option value="<">&lt;</option>
                            <option value=">">&gt;</option>
                            <option value="<=">&lt;=</option>
                            <option value=">=">&gt;=</option>
                            <option value="=">=</option>
                        </select>
                        <input
                            type="number"
                            step="0.001"
                            value={tolerance}
                            onChange={e => setTolerance(e.target.value)}
                            disabled={isViewMode}
                            className={`w-32 px-4 py-2.5 text-center font-bold border-2 border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                                }`}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button
                    onClick={isViewMode ? toggleEdit : handleSave}
                    disabled={isSaving || (isViewMode ? false : !isFormValid)}
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
                            {buttonText} mAs Linearity
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LinearityOfMasLoading;
