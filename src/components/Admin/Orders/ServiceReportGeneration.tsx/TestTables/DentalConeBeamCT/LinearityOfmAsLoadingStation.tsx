// components/TestTables/LinearityOfMasLoading.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLinearityOfMaLoadingForCBCT,
  getLinearityOfMaLoadingByServiceIdForCBCT,
  getLinearityOfMaLoadingByTestIdForCBCT,
  updateLinearityOfMaLoadingForCBCT,
} from '../../../../../../api';

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

const LinearityOfMasLoading: React.FC<Props> = ({ serviceId, testId: propTestId = null, onTestSaved, onRefresh, csvData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Exposure Conditions
  const [exposureCondition, setExposureCondition] = useState<ExposureCondition>({ fcd: '100', kv: '80' });

  const [measHeaders, setMeasHeaders] = useState<string[]>(['Measured mR 1', 'Measured mR 2', 'Measured mR 3']);
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: '1', mAsRange: '5 - 10', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '2', mAsRange: '10 - 20', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '3', mAsRange: '20 - 50', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    { id: '4', mAsRange: '50 - 100', measuredOutputs: ['', '', ''], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('0.1');

  // Handlers
  const addMeasColumn = () => {
    setMeasHeaders(p => [...p, `Measured mR ${p.length + 1}`]);
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: [...r.measuredOutputs, ''] })));
  };

  const removeMeasColumn = (idx: number) => {
    if (measHeaders.length <= 1) return;
    setMeasHeaders(p => p.filter((_, i) => i !== idx));
    setTable2Rows(p => p.map(r => ({ ...r, measuredOutputs: r.measuredOutputs.filter((_, i) => i !== idx) })));
  };

  const addTable2Row = () => {
    setTable2Rows(p => [
      ...p,
      { id: Date.now().toString(), mAsRange: '', measuredOutputs: Array(measHeaders.length).fill(''), average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows(p => p.filter(r => r.id !== id));
  };

  const updateCell = (rowId: string, field: 'mAsRange' | number, value: string) => {
    if (isViewMode) return;
    setTable2Rows(p =>
      p.map(r => {
        if (r.id !== rowId) return r;
        if (field === 'mAsRange') return { ...r, mAsRange: value };
        if (typeof field === 'number') {
          const outputs = [...r.measuredOutputs];
          outputs[field] = value;
          return { ...r, measuredOutputs: outputs };
        }
        return r;
      })
    );
  };

  // Load data from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getLinearityOfMaLoadingByServiceIdForCBCT(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          if (data.table1) {
            setExposureCondition({
              fcd: data.table1.fcd || '100',
              kv: data.table1.kv || '80',
            });
          }
          // Note: Backend uses 'ma' field, but we need to convert it to mAsRange format for display
          // We'll use the ma value as-is and display it as mAsRange
          if (Array.isArray(data.table2) && data.table2.length > 0) {
            setTable2Rows(
              data.table2.map((r: any, i: number) => {
                // Convert ma back to mAsRange format (use ma value as mAsRange)
                const maValue = r.ma || '';
                const mAsRange = maValue ? `${maValue} mAs` : '';
                return {
                  id: String(i + 1),
                  mAsRange: mAsRange,
                  measuredOutputs: (r.measuredOutputs || []).map((v: any) => (v != null ? String(v) : '')),
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
          toast.error('Failed to load mAs linearity data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    load();
  }, [serviceId]);

  // CSV Data Injection
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // 1. Identify Header Row to determine where measurements end
      // Look for row containing "Average" or "Avg"
      let headerRowIndex = -1;
      let avgColIndex = -1;

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        // Check if any cell matches "Average" or "Avg" or "Mean" (case insensitive)
        const idx = row.findIndex((cell: any) => {
          const s = String(cell).toLowerCase().trim();
          return s === 'average' || s === 'avg' || s === 'mean';
        });
        if (idx !== -1) {
          headerRowIndex = i;
          avgColIndex = idx;
          break;
        }
      }

      // 2. Separate data rows
      // Stop before "Coefficient of Linearity" / "CoL" section if present
      const colRowIndex = csvData.findIndex(r => r[0] === 'Coefficient of Linearity' || r[0] === 'CoL');

      let tableRows = colRowIndex !== -1 ? csvData.slice(0, colRowIndex) : csvData;

      // Filter valid rows: Must have content, length > 1, AND first cell value is typically numeric (mAs)
      // Exclude header row found above
      tableRows = tableRows.filter((r, idx) => {
        if (headerRowIndex !== -1 && idx === headerRowIndex) return false;
        // Check if first cell is numeric-ish (mAs value) to exclude other headers
        const first = String(r[0]).trim();
        // Allow numeric "10" or range "10-20"
        return r[0] && r.length > 1 && /^[\d\.\-\s]+$/.test(first);
      });

      if (tableRows.length > 0) {
        const newRows = tableRows.map((row, idx) => {
          // Determine slice end index
          // If we found "Average" column, measurements end there.
          // If NOT found, try to find KNOWN tail columns by checking if cells look like headers (rare)
          // Or use heuristic: usually tail has Average, mR/mAs, CoL, Remarks (4 cols) or Average, mR/mAs (2 cols)
          // If user says mismatched CoL/Remarks, it means they ARE present.
          // Check for specific columns at the end if strict logic failed

          let sliceEnd = avgColIndex;
          if (sliceEnd === -1) {
            // Heuristic: Inspect tail of the row for "Pass/Fail" (Remarks) and CoL.
            // We assume the structure: mAs, Meas..., [Avg], [mR/mAs], [CoL], [Remarks]
            // We want to find where Meas ends.

            let effectiveLen = row.length;
            const lastVal = String(row[effectiveLen - 1]).toLowerCase().trim();

            // Check for Remarks (Pass/Fail)
            if (lastVal === 'pass' || lastVal === 'fail') {
              effectiveLen--; // Exclude Remarks
            }

            // Check for CoL (typically small number < 1.0 or numeric)
            // But be careful not to consume mR/mAs (which can be anything).
            // BUT CoL is usually the LAST numeric column before Remarks.
            // If we found Remarks, we are at CoL?
            // The user file seems to have CoL.
            // If we see a very small number or just assume standard 3 calculated cols (Avg, X, CoL)?
            // If user has Pass/Fail, they likely have CoL.
            // Let's assume if existing length > effectiveLen, we stripped Remarks.
            // If we haven't stripped Remarks (no Pass/Fail), maybe no Remarks column?

            // Let's assume the LAST 2 columns of the remaining are Avg, X? 
            // Or Avg, X, CoL?
            // Standard Template has NO calculated columns.
            // User file has calculated columns.

            // If effectiveLen (after stripping Remarks) is > 1 + N (measurements).
            // We don't know N.

            // Safest Heuristic:
            // If we stripped 'Pass/Fail', assume we also have CoL, X, Avg leading up to it?
            // Or just assume standard 2 extra cols (Avg, X) are present if NOT template?
            // The user image shows 3 calc columns: Avg, X, CoL. Plus Remarks.
            // So 4 extra columns total.
            // If we found Remarks, assume -3 more?

            if (effectiveLen < row.length) {
              // found remarks. likely 3 more calc columns (CoL, X, Avg)
              // But maybe only 2 (X, Avg)?
              // Let's peek at effectiveLen-1 (CoL?).
              // If it's numeric, exclude it?
              // We need to return `sliceEnd` which EXCLUDES Avg.

              // Let's assume if Remarks found, sliceEnd = effectiveLen - 3. (CoL, X, Avg).
              // But to be safe vs Template (length 4, all data), we check values.

              // If row has Pass/Fail, it's definitely PROCESSED data.
              // Implies Avg, X, CoL exist.
              sliceEnd = effectiveLen - 3;
            } else {
              // No Pass/Fail.
              // Could be Template (Raw Data) OR Processed file without Remarks.
              // Template: 50, 50.1, 50.2. All numbers.
              // Processed: 50, 50.1, 50.1 (Avg), 1.0 (X).
              // Hard to distinguish Avg from Meas.
              // BUT usually Avg is ~ Meas. X is small (mR/mAs).

              // If last column (effectiveLen-1) is significantly smaller than others (mR/mAs or CoL)?
              // X = mR/mAs = ~1.0. Meas = 50.
              // If row[last] << row[0]?
              // 50 vs 1.0. Yes.
              // Template: 50 vs 50.3. No.

              const buffer = 2; // Assume at least 2 calc columns (Avg, X) if looks like processed
              const last = parseFloat(row[effectiveLen - 1]);
              const firstMeas = parseFloat(row[1]);

              if (!isNaN(last) && !isNaN(firstMeas) && last < firstMeas * 0.1) {
                // Last val is >10x smaller than measurement. Likely mR/mAs or CoL.
                // Assume it's a calculated column.
                // Assume 2 columns (Avg, X)?
                sliceEnd = effectiveLen - 2;
              } else {
                // Everything looks like measurement.
                sliceEnd = effectiveLen;
              }
            }
          }

          // Safety: sliceEnd must be > 1
          sliceEnd = Math.max(1, sliceEnd);

          const mAsStation = row[0];

          // Meas values: indices 1 to sliceEnd
          const values = row.slice(1, sliceEnd);

          // Average and mR/mAs are usually after sliceEnd
          // We don't really use them except for display/verify if needed?
          // We recalculate Average anyway?
          // Previous logic imported them:
          const avg = row[sliceEnd];
          const mrMas = row[sliceEnd + 1];
          // We can't easily extract CoL/Remarks if we don't know offset.

          return {
            id: String(idx + 1),
            mAsRange: mAsStation?.toString() || '',
            measuredOutputs: values.map((v: any) => v?.toString() || ''),
            average: avg?.toString() || '',
            x: '', xMax: '', xMin: '', col: '', remarks: ''
          };
        });

        setTable2Rows(newRows);

        const maxMeas = Math.max(...newRows.map(r => r.measuredOutputs.length));
        if (maxMeas > measHeaders.length) {
          const newCols = Array.from({ length: maxMeas - measHeaders.length }, (_, i) => `Measured mR ${measHeaders.length + i + 1}`);
          setMeasHeaders(prev => [...prev, ...newCols]);
        }
        if (!testId) setIsEditing(true);
      }
    }
  }, [csvData]);

  // Save handler
  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      // Convert mAsRange to ma value (extract number from mAsRange string)
      const payload = {
        table1: {
          fcd: exposureCondition.fcd,
          kv: exposureCondition.kv,
          time: '', // mAs loading doesn't use time field
        },
        table2: processedTable2.map(r => {
          // Extract numeric value from mAsRange (e.g., "5 - 10" -> "7.5" or "10" -> "10")
          let maValue = '';
          const match = r.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          if (match) {
            // If it's a range, use midpoint
            const mid = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
            maValue = mid.toString();
          } else {
            // If it's a single value, extract it
            const singleMatch = r.mAsRange.match(/(\d+(?:\.\d+)?)/);
            maValue = singleMatch ? singleMatch[1] : r.mAsRange.replace(/[^\d.]/g, '');
          }

          return {
            ma: maValue || r.mAsRange,
            measuredOutputs: r.measuredOutputs.map(v => {
              const val = v.trim();
              return val === '' ? '' : val;
            }),
            average: r.average || '',
            x: r.x || '',
            xMax: r.xMax || '',
            xMin: r.xMin || '',
            col: r.col || '',
            remarks: r.remarks || '',
          };
        }),
        tolerance,
      };

      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getLinearityOfMaLoadingByServiceIdForCBCT(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        // Update existing
        result = await updateLinearityOfMaLoadingForCBCT(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        // Create new
        result = await addLinearityOfMaLoadingForCBCT(serviceId, payload);
        const newId = result?.data?.testId || result?.data?._id;
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

  // CoL Calculation (same logic, fully client-side)
  const processedTable2 = useMemo(() => {
    const tol = parseFloat(tolerance) || 0.1;
    const xValues: number[] = [];

    const rowsWithX = table2Rows.map(row => {
      const outputs = row.measuredOutputs.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const avg = outputs.length > 0 ? (outputs.reduce((a, b) => a + b, 0) / outputs.length).toFixed(3) : '—';

      const match = row.mAsRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      const midMas = match
        ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
        : parseFloat(row.mAsRange) || 0;

      const x = avg !== '—' && midMas > 0 ? (parseFloat(avg) / midMas).toFixed(4) : '—';
      if (x !== '—') xValues.push(parseFloat(x));

      return { ...row, average: avg, x };
    });

    const hasData = xValues.length > 0;
    const xMax = hasData ? Math.max(...xValues).toFixed(4) : '—';
    const xMin = hasData ? Math.min(...xValues).toFixed(4) : '—';
    const colNum = hasData
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : 0;
    const col = hasData ? colNum.toFixed(3) : '—';
    const pass = hasData && colNum <= tol;

    return rowsWithX.map(row => ({
      ...row,
      col,
      remarks: hasData ? (pass ? 'Pass' : 'Fail') : '—',
    }));
  }, [table2Rows, tolerance]);

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Linearity of mAs Loading (Across mAs Ranges)</h2>
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
              {buttonText} mAs Linearity
            </>
          )}
        </button>
      </div>

      {/* Exposure Conditions */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-teal-50 border-b">
          <h3 className="text-lg font-semibold text-teal-900">Exposure Conditions</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">FCD (cm)</th>
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

      {/* Main Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="text-lg font-semibold text-blue-900">Linearity of Radiation Output Across mAs Ranges</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r">mAs Range</th>
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
                  <td className="px-6 py-4 border-r">
                    <input
                      type="text"
                      value={p.mAsRange}
                      onChange={e => updateCell(p.id, 'mAsRange', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 text-center text-sm border rounded font-medium focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      placeholder="10 - 20"
                    />
                  </td>
                  {p.measuredOutputs.map((val, idx) => (
                    <td key={idx} className="px-3 py-4 text-center border-r">
                      <input
                        type="number"
                        step="any"
                        value={val}
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
            <span className="text-sm font-medium text-gray-700">Tolerance (CoL) ≤</span>
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
    </div>
  );
};

export default LinearityOfMasLoading;