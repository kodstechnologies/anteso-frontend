// ReproducibilityOfOutput.tsx — FIXED FOR YOUR SCHEMA
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addReproducibilityOfOutputForMammography,
  getReproducibilityOfOutputByServiceIdForMammography,
  updateReproducibilityOfOutputForMammography,
} from '../../../../../../api';

// ---------- Radiation Output ----------
interface OutputRow {
  id: string;
  kv: string;
  mas: string;
  outputs: string[];      // one entry per dynamic column
  avg: string;
  cov: string;
  remark: string;
}

interface SavedData {
  outputRows: {
    kv: string;
    mas: string;
    outputs: string[];
    avg: string;
    cov: string;
    remark: string;
  }[];
  tolerance?: string;
  _id?: string;
}

const ReproducibilityOfOutput: React.FC<{ 
  serviceId: string; 
  refreshKey?: number;
  initialData?: {
    outputRows?: Array<{ kv: string; mas: string; outputs: string[] }>;
    tolerance?: string;
  };
}> = ({ serviceId, refreshKey, initialData }) => {
  const [testId, setTestId] = useState<string | null>(null);
  
  // ---- Radiation Output ------------------------------------
  const [outputRows, setOutputRows] = useState<OutputRow[]>([
    {
      id: '1',
      kv: '',
      mas: '',
      outputs: ['', '', '', '', ''], // 5 starter columns
      avg: '',
      cov: '',
      remark: '',
    },
  ]);

  // editable header names – start with "Meas 1 … Meas 5"
  const [outputHeaders, setOutputHeaders] = useState<string[]>([
    'Meas 1',
    'Meas 2',
    'Meas 3',
    'Meas 4',
    'Meas 5',
  ]);

  const outputColumnsCount = outputHeaders.length;

  // ---- Tolerance ------------------------------------------------------
  const [tolerance, setTolerance] = useState<string>('0.05');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  // Auto-calculate Avg, CV, and Remark for each row
  const rowsWithCalc = useMemo(() => {
    // Tolerance value is stored as percentage (e.g., "5.0" for 5%)
    const tolValuePercent = parseFloat(tolerance) || 5.0;
    const tolValueDecimal = tolValuePercent / 100; // Convert to decimal

    return outputRows.map((row): OutputRow & { remark: 'Pass' | 'Fail' | '' } => {
      const nums = row.outputs
        .filter((v) => v.trim() !== '')
        .map((v) => parseFloat(v))
        .filter((n) => !isNaN(n) && n > 0);

      if (nums.length === 0) {
        return { ...row, avg: '', cov: '', remark: '' };
      }

      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      
      let cov = 0;
      if (nums.length > 1) {
        const variance =
          nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          nums.length;
        const stdDev = Math.sqrt(variance);
        cov = mean > 0 ? stdDev / mean : 0; // CoV as decimal
      }

      // Compare CoV (decimal) with tolerance (decimal)
      const passes = cov <= tolValueDecimal;

      return {
        ...row,
        avg: mean.toFixed(4),
        cov: cov.toFixed(4), // Display CoV as decimal (not percentage)
        remark: passes ? 'Pass' : 'Fail',
      };
    });
  }, [outputRows, tolerance]);

  // ---- Column handling ------------------------------------------------
  const addOutputColumn = () => {
    const newHeader = `Meas ${outputHeaders.length + 1}`;
    setOutputHeaders((prev) => [...prev, newHeader]);

    setOutputRows((prev) =>
      prev.map((row) => ({
        ...row,
        outputs: [...row.outputs, ''],
      }))
    );
  };

  const removeOutputColumn = (colIdx: number) => {
    if (outputHeaders.length <= 1) return;
    setOutputHeaders((prev) => prev.filter((_, i) => i !== colIdx));

    setOutputRows((prev) =>
      prev.map((row) => ({
        ...row,
        outputs: row.outputs.filter((_, i) => i !== colIdx),
      }))
    );
  };

  const updateHeader = (colIdx: number, newName: string) => {
    setOutputHeaders((prev) => {
      const copy = [...prev];
      copy[colIdx] = newName || `Meas ${colIdx + 1}`;
      return copy;
    });
  };

  // Load CSV Initial Data
  useEffect(() => {
    if (initialData) {
      console.log('ReproducibilityOfOutput: Loading initial data from CSV:', initialData);
      if (initialData.outputRows && initialData.outputRows.length > 0) {
        const firstRow = initialData.outputRows[0];
        const numCols = firstRow.outputs?.length || 5;
        setOutputHeaders(Array.from({ length: numCols }, (_, i) => `Meas ${i + 1}`));
        setOutputRows(
          initialData.outputRows.map((r, i) => ({
            id: `csv-row-${Date.now()}-${i}`,
            kv: r.kv || '',
            mas: r.mas || '',
            outputs: r.outputs || [],
            avg: '',
            cov: '',
            remark: '',
          }))
        );
      }
      if (initialData.tolerance) {
        setTolerance(initialData.tolerance);
      }
      setIsEditing(true);
      setIsLoading(false);
      console.log('ReproducibilityOfOutput: CSV data loaded into form');
    }
  }, [initialData]);

  // Load data
  useEffect(() => {
    // Skip loading if we have initial CSV data
    if (initialData) {
      return;
    }
    
    // Reset state when refreshKey changes
    if (refreshKey !== undefined) {
      setIsLoading(true);
      setOutputRows([{
        id: '1',
        kv: '',
        mas: '',
        outputs: ['', '', '', '', ''],
        avg: '',
        cov: '',
        remark: '',
      }]);
      setOutputHeaders(['Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5']);
      setTolerance('0.05');
      setHasSaved(false);
      setIsEditing(true);
    }
    
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        console.log('ReproducibilityOfOutput: Loading data, refreshKey:', refreshKey);
        const res = await getReproducibilityOfOutputByServiceIdForMammography(serviceId);
        // API returns res.data.data directly
        const data = res;
        console.log('ReproducibilityOfOutput: Loaded data:', data);
        if (data) {
          setTestId(data._id || null);
          
          // Load output rows
          if (data.outputRows && Array.isArray(data.outputRows) && data.outputRows.length > 0) {
            const firstRow = data.outputRows[0];
            const numCols = firstRow.outputs?.length || 5;
            setOutputHeaders(Array.from({ length: numCols }, (_, i) => `Meas ${i + 1}`));
            
            setOutputRows(data.outputRows.map((r: any, i: number) => ({
              id: Date.now().toString() + i,
              kv: String(r.kv || ''),
              mas: String(r.mas || ''),
              outputs: Array.isArray(r.outputs) ? r.outputs.map((o: any) => String(o || '')) : Array(numCols).fill(''),
              avg: String(r.avg || ''),
              cov: String(r.cov || ''),
              remark: String(r.remark || ''),
            })));
          }
          
          if (data.tolerance) setTolerance(String(data.tolerance));
          
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, refreshKey, initialData]);

  // Save handler
  const saveData = async () => {
    if (!serviceId) return;
    setIsSaving(true);

    const payload = {
      outputRows: rowsWithCalc.map(r => ({
        kv: r.kv,
        mas: r.mas,
        outputs: r.outputs,
        avg: r.avg,
        cov: r.cov,
        remark: r.remark || '',
      })),
      tolerance,
    };

    try {
      let result;
      let currentTestId = testId;

      // If no testId, try to get existing data by serviceId first
      if (!currentTestId) {
        try {
          const existing = await getReproducibilityOfOutputByServiceIdForMammography(serviceId);
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
        result = await updateReproducibilityOfOutputForMammography(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        // Create new
        result = await addReproducibilityOfOutputForMammography(serviceId, payload);
        const newId = result?.data?._id || result?.data?.data?._id || result?._id;
        if (newId) {
          setTestId(newId);
        }
        toast.success('Saved successfully!');
      }

      setHasSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);
  const isViewMode = hasSaved && !isEditing;
  const buttonText = isViewMode ? 'Edit' : testId ? 'Update' : 'Save';
  const ButtonIcon = isViewMode ? Edit3 : Save;

  // ---- Row handling --------------------------------------------------
  const addOutputRow = () => {
    setOutputRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        kv: '',
        mas: '',
        outputs: Array(outputColumnsCount).fill(''),
        avg: '',
        cov: '',
        remark: '',
      },
    ]);
  };

  const removeOutputRow = (rowId: string) => {
    if (outputRows.length <= 1) return;
    setOutputRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // ---- Cell update ---------------------------------------------------
  const updateCell = (
    rowId: string,
    field: 'kv' | 'mas' | 'avg' | 'cov' | 'remark' | number,
    value: string
  ) => {
    setOutputRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (field === 'kv' || field === 'mas' || field === 'avg' || field === 'cov' || field === 'remark') {
          return { ...row, [field]: value };
        }

        // field === column index for measured outputs
        if (typeof field === 'number') {
          const newOutputs = [...row.outputs];
          newOutputs[field] = value;
          return { ...row, outputs: newOutputs };
        }
        return row;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <span className="ml-4 text-lg">Loading Reproducibility Test...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">
        Consistency of Radiation Output
      </h2>

      {/* ==================== Radiation Output ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Radiation Output Measurements
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              {/* ---- First header row ---- */}
              <tr>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  Applied kV
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  mAs
                </th>

                {/* Dynamic measured columns + plus button */}
                <th
                  colSpan={outputColumnsCount}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  <div className="flex items-center justify-between">
                    <span>Radiation Output (mGy)</span>
                    {!isViewMode && (
                      <button
                        onClick={addOutputColumn}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Add Column"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>

                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  Avg (X̄)
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  CV
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-green-100"
                >
                  Remarks
                </th>
                <th rowSpan={2} className="w-10" />
              </tr>

              {/* ---- Second header row (editable column names) ---- */}
              <tr>
                {outputHeaders.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => updateHeader(idx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-20 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder={`Meas ${idx + 1}`}
                      />
                      {!isViewMode && outputColumnsCount > 1 && (
                        <button
                          onClick={() => removeOutputColumn(idx)}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                          title="Remove Column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* ---- Body ---- */}
            <tbody className="bg-white divide-y divide-gray-200">
              {rowsWithCalc.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {/* kV */}
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.kv}
                      onChange={(e) => updateCell(row.id, 'kv', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="28"
                    />
                  </td>

                  {/* mAs */}
                  <td className="px-4 py-2 border-r">
                    <input
                      type="text"
                      value={row.mas}
                      onChange={(e) => updateCell(row.id, 'mas', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="100"
                    />
                  </td>

                  {/* Dynamic measured outputs */}
                  {row.outputs.map((val, colIdx) => (
                    <td key={colIdx} className="px-2 py-2 border-r">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateCell(row.id, colIdx, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="1.25"
                      />
                    </td>
                  ))}

                  {/* Avg */}
                  <td className="px-4 py-2 border-r bg-blue-50">
                    <span className="w-full px-2 py-1 text-sm text-center font-medium text-gray-700">
                      {row.avg || '—'}
                    </span>
                  </td>

                  {/* CV */}
                  <td className="px-4 py-2 border-r bg-blue-50">
                    <span className="w-full px-2 py-1 text-sm text-center font-medium text-gray-700">
                      {row.cov || '—'}
                    </span>
                  </td>

                  {/* Remarks */}
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        row.remark === 'Pass'
                          ? 'bg-green-100 text-green-800'
                          : row.remark === 'Fail'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {row.remark || '—'}
                    </span>
                  </td>

                  {/* Delete Row (only in the very last column) */}
                  <td className="px-2 py-2 text-center">
                    {!isViewMode && outputRows.length > 1 && (
                      <button
                        onClick={() => removeOutputRow(row.id)}
                        className="text-red-600 hover:bg-red-100 p-1 rounded"
                        title="Remove Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row button (bottom) */}
        {!isViewMode && (
          <div className="px-6 py-3 bg-gray-50 border-t flex justify-start">
            <button
              onClick={addOutputRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Acceptance Criteria (CV ≤ {tolerance || '5.0'}%)
        </label>
        <div className="flex items-center gap-2 max-w-xs">
          <span className="text-sm text-gray-600">CV ≤</span>
          <input
            type="text"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            disabled={isViewMode}
            className={`w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center font-medium ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="5.0"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          IEC 61223-3-1 & AERB: Coefficient of Variation should be ≤ {tolerance || '5.0'}%
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isViewMode) {
              toggleEdit();
            } else {
              saveData();
            }
          }}
          disabled={isSaving}
          className={`flex items-center gap-3 px-8 py-3 text-white font-medium rounded-lg transition-all ${isSaving
            ? 'bg-gray-400 cursor-not-allowed'
            : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ButtonIcon className="w-5 h-5" />
              {buttonText} Consistency of Radiation Output
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReproducibilityOfOutput;