// components/TestTables/ConsistencyOfRadiationOutput.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    addOutputConsistencyForOBI,
    getOutputConsistencyByServiceIdForOBI,
    updateOutputConsistencyForOBI,
} from '../../../../../../api';

interface FCDData {
    value: string; // e.g. "100" cm
}

interface OutputMeasurement {
    value: string;
}

interface OutputRow {
    id: string;
    kv: string;
    mas: string;
    outputs: OutputMeasurement[]; // Keeping OBI structure but using it dynamically
    avg: string;
    cv: string; // "CV" in OBI, "COV" in C-Arm. Keeping OBI naming for model compatibility if needed, distinct from C-Arm backend keys
    remark: 'Pass' | 'Fail' | '';
}

interface Tolerance {
    operator: '<=' | '<' | '>=' | '>';
    value: string; // e.g. "5.0"
}

interface Props {
    serviceId: string;
    testId?: string;
    onTestSaved?: (testId: string) => void;
    refreshKey?: number;
    initialData?: {
        ffd?: string;
        tolerance?: {
            operator: '<=' | '<' | '>=' | '>';
            value: string;
        };
        outputRows?: Array<{
            kv: string;
            mAs: string;
            outputs: Array<{ value: string }>;
            avg?: string;
            cv?: string;
        }>;
        headers?: string[];
    };
}

const ConsistencyOfRadiationOutput: React.FC<Props> = ({
    serviceId,
    testId: propTestId,
    onTestSaved,
    refreshKey,
    initialData
}) => {
    const [testId, setTestId] = useState<string | null>(propTestId || null);
    const [hasSaved, setHasSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [ffd, setFFD] = useState<FCDData>({ value: '' });

    // C-Arm Style: Track headers for dynamic columns
  const [headers, setHeaders] = useState<string[]>([
    'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5',
  ]);

  const addColumn = () => {
    if (hasSaved && !isEditing) return;
    if (headers.length >= 10) {
      toast.error('Maximum 10 measurements allowed');
      return;
    }
    setHeaders(prev => [...prev, `Meas ${prev.length + 1}`]);
    setOutputRows(prev => prev.map(row => ({
      ...row,
      outputs: [...row.outputs, { value: '' }]
    })));
    setHasSaved(false);
  };

  const removeColumn = (index: number) => {
    if ((hasSaved && !isEditing) || headers.length <= 3) {
      toast.error('Minimum 3 measurements required');
      return;
    }
    setHeaders(prev => prev.filter((_, i) => i !== index));
    setOutputRows(prev => prev.map(row => ({
      ...row,
      outputs: row.outputs.filter((_, i) => i !== index)
    })));
    setHasSaved(false);
  };

  const updateHeader = (index: number, value: string) => {
    if (hasSaved && !isEditing) return;
    setHeaders(prev => {
      const newHeaders = [...prev];
      newHeaders[index] = value;
      return newHeaders;
    });
    setHasSaved(false);
  };

    const [tolerance, setTolerance] = useState<Tolerance>({
        operator: '<=',
        value: '0.05', // Default 0.05 to match typical OBI usage or C-Arm? C-Arm uses 0.02. Retaining 0.05 as per original OBI file.
    });

    const [outputRows, setOutputRows] = useState<OutputRow[]>([
        {
            id: '1',
            kv: '80',
            mas: '100',
            outputs: Array(5).fill({ value: '' }),
            avg: '',
            cv: '',
            remark: '',
        },
    ]);

    // Calculate avg, CV and remark
    const rowsWithCalc = useMemo(() => {
        const tolValue = parseFloat(tolerance.value) || 0.05;

        return outputRows.map((row): OutputRow => {
            const values = row.outputs
                .map(m => parseFloat(m.value))
                .filter(v => !isNaN(v) && v > 0);

            if (values.length === 0) {
                return { ...row, avg: '', cv: '', remark: '' };
            }

            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            // Variance
            const variance =
                values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length > 1 ? values.length - 1 : 1);

            const stdDev = Math.sqrt(variance);
            const cvDecimal = avg > 0 ? (stdDev / avg) : 0;

            // OBI typically displays basic decimal or %. 
            // C-Arm implementation calculates cov as decimal.
            // Let's formatting it to 4 decimals for display.
            const cvDisplay = cvDecimal.toFixed(4);

            const passes =
                tolerance.operator === '<=' ? cvDecimal <= tolValue :
                    tolerance.operator === '<' ? cvDecimal < tolValue :
                        tolerance.operator === '>=' ? cvDecimal >= tolValue :
                            cvDecimal > tolValue;

            const remark = passes ? 'Pass' : 'Fail';

            return {
                ...row,
                avg: avg.toFixed(3),
                cv: cvDisplay,
                remark,
            };
        });
    }, [outputRows, tolerance]);

    // Final Remark
    const finalRemark = useMemo(() => {
        if (!hasSaved || rowsWithCalc.length === 0) return '';
        return rowsWithCalc.every(r => r.remark === 'Pass' || r.remark === '') ? 'Pass' : 'Fail';
    }, [rowsWithCalc, hasSaved]);

    // Handlers
    const updateFcd = (value: string) => {
        setFFD({ value });
        setHasSaved(false);
    };


    const addRow = () => {
        setOutputRows(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                kv: '',
                mas: '',
                outputs: Array(headers.length).fill({ value: '' }),
                avg: '',
                cv: '',
                remark: '',
            },
        ]);
        setHasSaved(false);
    };

    const removeRow = (id: string) => {
        if (outputRows.length <= 1) return;
        setOutputRows(prev => prev.filter(r => r.id !== id));
        setHasSaved(false);
    };

    const updateCell = (rowId: string, field: 'kv' | 'mas', value: string) => {
        setOutputRows(prev =>
            prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row))
        );
        setHasSaved(false);
    };

    const updateMeasurement = (rowId: string, index: number, value: string) => {
        setOutputRows(prev =>
            prev.map(row => {
                if (row.id !== rowId) return row;
                const outputs = [...row.outputs];
                outputs[index] = { value: value };
                return { ...row, outputs };
            })
        );
        setHasSaved(false);
    };

    // Load CSV Initial Data
    useEffect(() => {
        if (initialData) {
            console.log('OutputConsistency: Loading initial data from CSV:', initialData);
            if (initialData.ffd) {
                setFFD({ value: initialData.ffd });
            }
            if (initialData.tolerance) {
                setTolerance(initialData.tolerance);
            }
            if (initialData.headers && initialData.headers.length > 0) {
                setHeaders(initialData.headers);
            }
            if (initialData.outputRows && initialData.outputRows.length > 0) {
                const firstRow = initialData.outputRows[0];
                const numCols = firstRow.outputs?.length || 5;
                if (!initialData.headers || initialData.headers.length === 0) {
                    setHeaders(Array.from({ length: numCols }, (_, i) => `Meas ${i + 1}`));
                }
                setOutputRows(
                    initialData.outputRows.map((r, i) => ({
                        id: `csv-row-${Date.now()}-${i}`,
                        kv: r.kv || '',
                        mas: (r as any).mas || r.mAs || '',
                        outputs: r.outputs || Array(numCols).fill({ value: '' }),
                        avg: r.avg || '',
                        cv: r.cv || '',
                        remark: '',
                    }))
                );
            }
            setIsEditing(true);
            setIsLoading(false);
            console.log('OutputConsistency: CSV data loaded into form');
        }
    }, [initialData]);

    // Load existing test data
    useEffect(() => {
        // Skip loading if we have initial CSV data
        if (initialData) {
            return;
        }

        if (!serviceId) {
            setIsLoading(false);
            return;
        }

        const loadTest = async () => {
            setIsLoading(true);
            try {
                const data = await getOutputConsistencyByServiceIdForOBI(serviceId);
                if (data?.data) {
                    const testData = data.data;
                    setTestId(testData._id);
                    if (testData.ffd?.value) {
                        setFFD({ value: testData.ffd.value });
                    }
                    if (testData.outputRows && testData.outputRows.length > 0) {
                        // Determine headers from max outputs length
                        const maxCols = Math.max(
                            ...testData.outputRows.map((r: any) => r.outputs?.length || 0),
                            5
                        );
                        // If headers were saved, we'd use them. But OBI model doesn't support headers yet.
                        // We generated generic headers.
                        const loadedHeaders = Array.from({ length: maxCols }, (_, i) => `Meas ${i + 1}`);
                        setHeaders(loadedHeaders);

                        setOutputRows(testData.outputRows.map((r: any) => ({
                            id: Date.now().toString() + Math.random(),
                            kv: r.kv || '',
                            mas: r.mas || '',
                            outputs: r.outputs && r.outputs.length > 0
                                ? r.outputs.map((o: any) => ({ value: o.value || '' }))
                                : Array(maxCols).fill({ value: '' }),
                            avg: r.avg || '',
                            cv: '',
                            remark: r.remark || '',
                        })));
                    }
                    if (testData.tolerance) {
                        setTolerance({
                            operator: testData.tolerance.operator || '<=',
                            value: testData.tolerance.value || '0.05',
                        });
                    }
                    setHasSaved(true);
                    setIsEditing(false);
                }
            } catch (err: any) {
                // Ignore 404
            } finally {
                setIsLoading(false);
            }
        };

        loadTest();
    }, [serviceId, initialData]);

    const handleSave = async () => {
        if (!serviceId) {
            toast.error('Service ID is missing');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ffd,
                outputRows: rowsWithCalc.map(r => ({
                    kv: r.kv,
                    mas: r.mas,
                    outputs: r.outputs, // { value: string }[]
                    avg: r.avg,
                    remark: r.remark,
                })),
                tolerance,
            };

            let result;
            if (testId) {
                result = await updateOutputConsistencyForOBI(testId, payload);
            } else {
                result = await addOutputConsistencyForOBI(serviceId, payload);
                if (result?.data?._id) {
                    setTestId(result.data._id);
                    onTestSaved?.(result.data._id);
                }
            }

            setHasSaved(true);
            setIsEditing(false);
            toast.success(testId ? 'Updated successfully' : 'Saved successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEdit = () => {
        setIsEditing(true);
        setHasSaved(false);
    };

    const isViewMode = hasSaved && !isEditing;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-10">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Reproducibility of Radiation Output (Consistency Test)
                </h2>
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
                    ) : isViewMode ? (
                        <>
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            {testId ? 'Update' : 'Save'} Test
                        </>
                    )}
                </button>
            </div>

            {/* FCD */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 flex items-center gap-4">
                    <label className="w-48 text-sm font-medium text-gray-700">FFD(cm):</label>
                    <input
                        type="text"
                        value={ffd.value}
                        onChange={e => updateFcd(e.target.value)}
                        disabled={isViewMode}
                        className={`w-32 px-4 py-2 border rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none ${isViewMode ? 'bg-gray-50 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                        placeholder="100"
                    />
                    <span className="text-gray-600">cm</span>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-700">
                        Radiation Output Measurements (mGy)
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600  border-r">
                                    kV
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-600  border-r">
                                    mAs
                                </th>
                                {Array.from({ length: headers.length }, (_, i) => (
                                    <th
                                        key={i}
                                        className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-r relative"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1">
                                                <span>Meas {i + 1}</span>
                                                {!isViewMode && headers.length < 10 && (
                                                    <button
                                                        onClick={() => addColumn()}
                                                        className="text-green-600 hover:bg-green-100 p-0.5 rounded transition"
                                                        title="Add column after this"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {!isViewMode && headers.length > 3 && (
                                                <button
                                                    onClick={() => removeColumn(i)}
                                                    className="text-red-600 hover:bg-red-100 p-1 rounded transition"
                                                    title="Remove this column"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600  border-r">
                                    Average
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-600 ">
                                    CoV / Result
                                </th>
                                <th className="w-12" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rowsWithCalc.map(row => {
                                const isFailed = row.remark === 'Fail';
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4 border-r">
                                            <input
                                                type="text"
                                                value={row.kv}
                                                onChange={e => updateCell(row.id, 'kv', e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                                placeholder="80"
                                            />
                                        </td>
                                        <td className="px-5 py-4 border-r">
                                            <input
                                                type="text"
                                                value={row.mas}
                                                onChange={e => updateCell(row.id, 'mas', e.target.value)}
                                                disabled={isViewMode}
                                                className={`w-20 px-3 py-2 text-center border rounded text-sm focus:border-blue-400 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                                placeholder="100"
                                            />
                                        </td>
                  {row.outputs.map((meas, i) => {
                    const hasValue = meas.value.trim() !== '' && !isNaN(parseFloat(meas.value));
                    return (
                      <td key={i} className={`px-2 py-4 border-r ${isFailed && hasValue ? 'bg-red-100' : ''}`}>
                        <input
                          type="text"
                          value={meas.value}
                          onChange={e => updateMeasurement(row.id, i, e.target.value)}
                          disabled={isViewMode}
                          className={`w-20 px-2 py-1.5 text-center border rounded text-xs focus:border-blue-400 ${isViewMode
                            ? 'bg-gray-50 cursor-not-allowed'
                            : isFailed && hasValue
                              ? 'border-red-500 bg-red-50'
                              : ''
                            }`}
                          placeholder="0.00"
                        />
                      </td>
                    );
                  })}
                                        <td className="px-5 py-4 text-center font-semibold border-r bg-blue-50">
                                            {row.avg || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                                                    row.remark === 'Pass'
                                                        ? 'bg-green-100 text-green-800'
                                                        : row.remark === 'Fail'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {row.cv ? `${row.cv}% → ${row.remark}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 text-center">
                                            {outputRows.length > 1 && (
                                                <button
                                                    onClick={() => removeRow(row.id)}
                                                    disabled={isViewMode}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                    {!isViewMode && (
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Technique
                        </button>
                    )}
                </div>
            </div>

      {/* Acceptance Criteria */}
      <div className="bg-white rounded-lg border p-6 max-w-md shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Acceptance Criteria</h3>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Coefficient of Variation (CoV)</span>
          <select
            value={tolerance.operator}
            onChange={e => {
              setTolerance({ ...tolerance, operator: e.target.value as any });
              setHasSaved(false);
            }}
            disabled={isViewMode}
            className={`px-4 py-2 border rounded font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          >
            <option value="<=">≤</option>
            <option value="<">&lt;</option>
            <option value=">=">≥</option>
            <option value=">">&gt;</option>
          </select>
          <input
            type="text"
            value={tolerance.value}
            onChange={e => {
              setTolerance({
                ...tolerance,
                value: e.target.value.replace(/[^0-9.]/g, ''),
              });
              setHasSaved(false);
            }}
            disabled={isViewMode}
            className={`w-24 px-4 py-2 text-center border-2 border-blue-500 rounded font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Reference: IEC 61223-3-1 & AERB Safety Code
        </p>
      </div>
    </div>
  );
};

export default ConsistencyOfRadiationOutput;