// components/TestTables/AccuracyOfOperatingPotential.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import {
  addAccuracyOfOperatingPotentialForMammography,
  getAccuracyOfOperatingPotentialByServiceIdForMammography,
  updateAccuracyOfOperatingPotentialForMammography,
} from '../../../../../../api';
import toast from 'react-hot-toast';

interface Table1Row {
  time: string;
  sliceThickness: string;
}

interface MAColumn {
  id: string;
  label: string; // e.g., "mA 10", "mA 50", "mA 100", etc.
  value: string;
}

interface Table2Row {
  id: string;
  setKV: string;
  maColumns: MAColumn[]; // Dynamic mA columns
  avgKvp: string;
  remarks: 'Pass' | 'Fail' | '';
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
  refreshKey?: number;
  initialData?: {
    table1?: Array<{ time: string; sliceThickness: string }>;
    table2?: Array<{ setKV: string;[key: string]: any }>;
    tolerance?: { value: string; type: 'percent' | 'absolute'; sign: 'plus' | 'minus' | 'both' };
  };
}

const normalizeToleranceSign = (sign: any): 'plus' | 'minus' | 'both' => {
  const raw = String(sign ?? '').trim().toLowerCase();
  if (raw === 'plus' || raw === '+') return 'plus';
  if (raw === 'minus' || raw === '-') return 'minus';
  if (raw === 'both' || raw === '±' || raw === '+/-' || raw === '+/-') return 'both';
  return 'both';
};

const TABLE2_META_KEYS = new Set([
  'setKV',
  'avgKvp',
  'remarks',
  'deviation',
  '_id',
  '__v',
  'id',
]);

function isMammoTable2MaKey(key: string): boolean {
  if (TABLE2_META_KEYS.has(key)) return false;
  if (/^ma\d+/i.test(key)) return true;
  if (/^mA\d+/i.test(key)) return true;
  if (/^\d+mA$/i.test(key)) return true;
  if (/^[a-zA-Z0-9]*mA\d+/i.test(key)) return true;
  return false;
}

function canonicalMammoMaKey(key: string): string {
  const raw = String(key || '').trim();
  let m = raw.match(/^ma(\d+)$/i);
  if (m) return `ma${m[1]}`;
  m = raw.match(/^mA(\d+)$/i);
  if (m) return `ma${m[1]}`;
  m = raw.match(/^(\d+)mA$/i);
  if (m) return `ma${m[1]}`;
  m = raw.match(/mA\s*(\d+)/i);
  if (m) return `ma${m[1]}`;
  return raw.replace(/\s+/g, '');
}

/** All mA column keys across rows (first row may omit empty fields). */
function collectMammoTable2MaKeys(table2: any[] | undefined): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const row of table2 || []) {
    if (!row || typeof row !== 'object') continue;
    for (const k of Object.keys(row)) {
      if (!isMammoTable2MaKey(k)) continue;
      const canonicalKey = canonicalMammoMaKey(k);
      if (seen.has(canonicalKey)) continue;
      seen.add(canonicalKey);
      order.push(canonicalKey);
    }
  }
  order.sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ''), 10);
    const nb = parseInt(String(b).replace(/\D/g, ''), 10);
    const aN = Number.isFinite(na) ? na : 1e9;
    const bN = Number.isFinite(nb) ? nb : 1e9;
    if (aN !== bN) return aN - bN;
    return a.localeCompare(b);
  });
  return order;
}

function formatMammoMaLabelFromKey(key: string): string {
  const k = String(key);
  let m = k.match(/^mA(\d+)$/i);
  if (m) return `mA ${m[1]}`;
  m = k.match(/^ma(\d+)$/i);
  if (m) return `mA ${m[1]}`;
  m = k.match(/^(\d+)mA$/i);
  if (m) return `mA ${m[1]}`;
  return k.replace(/([a-zA-Z])(\d)/g, '$1 $2');
}

function cellValueFromRow(row: any, key: string): string {
  const canonicalKey = canonicalMammoMaKey(key);
  const num = canonicalKey.match(/^ma(\d+)$/i)?.[1];
  const candidates = num
    ? [canonicalKey, `mA${num}`, `ma${num}`, `${num}mA`]
    : [canonicalKey, key];

  let v: any = undefined;
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(row || {}, c)) {
      v = row?.[c];
      break;
    }
  }
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'object' && v !== null && 'value' in v) return String((v as any).value ?? '');
  return String(v);
}

function maColumnsFromKeys(maKeys: string[]): MAColumn[] {
  return maKeys.map((key) => ({
    id: `ma-key-${key}`,
    label: formatMammoMaLabelFromKey(key),
    value: '',
  }));
}

const AccuracyOfOperatingPotential: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh, refreshKey, initialData }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Table 1: Only 1 row
  const [table1Row, setTable1Row] = useState<Table1Row>({ time: '', sliceThickness: '' });

  // Default mA columns
  const defaultMAColumns: MAColumn[] = [
    { id: '1', label: 'mA 10', value: '' },
    { id: '2', label: 'mA 100', value: '' },
    { id: '3', label: 'mA 200', value: '' },
  ];

  // Table 2: Dynamic rows with dynamic mA columns
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    {
      id: '1',
      setKV: '',
      maColumns: [...defaultMAColumns],
      avgKvp: '',
      remarks: ''
    },
  ]);

  // Global mA columns configuration (shared across all rows)
  const [globalMAColumns, setGlobalMAColumns] = useState<MAColumn[]>([...defaultMAColumns]);

  const [toleranceValue, setToleranceValue] = useState<string>('1.5');
  const [toleranceType, setToleranceType] = useState<'percent' | 'absolute'>('absolute');
  const [toleranceSign, setToleranceSign] = useState<'plus' | 'minus' | 'both'>('both');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Add mA column (inline in table header, like RadiographyFixed TotalFilteration)
  const addMAColumn = () => {
    const newColumn: MAColumn = {
      id: `ma-col-${Date.now()}`,
      label: '200 mA',
      value: '',
    };
    setGlobalMAColumns(prev => [...prev, newColumn]);
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        maColumns: [...row.maColumns, { ...newColumn, value: '' }],
      }))
    );
  };

  // Remove mA column by index (from table header row)
  const removeMAColumn = (index: number) => {
    if (globalMAColumns.length <= 1) {
      toast.error('At least one mA column is required');
      return;
    }
    const columnId = globalMAColumns[index].id;
    setGlobalMAColumns(prev => prev.filter(col => col.id !== columnId));
    setTable2Rows(prev =>
      prev.map(row => ({
        ...row,
        maColumns: row.maColumns.filter(col => col.id !== columnId),
      }))
    );
  };

  // Update mA column header label (editable in table header) — must mirror into every row for save + consistency
  const updateMAHeader = (index: number, value: string) => {
    setGlobalMAColumns(prev => {
      const next = [...prev];
      if (!next[index]) return prev;
      const colId = next[index].id;
      const label = value.trim() || `mA ${index + 1}`;
      next[index] = { ...next[index], label };
      setTable2Rows((rows) =>
        rows.map((row) => ({
          ...row,
          maColumns: row.maColumns.map((c) => (c.id === colId ? { ...c, label } : c)),
        }))
      );
      return next;
    });
  };

  // === Table 2: Add/Remove Rows ===
  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        setKV: '',
        maColumns: globalMAColumns.map(col => ({ ...col, value: '' })), // Copy current global columns
        avgKvp: '',
        remarks: '',
      },
    ]);
  };

  const removeTable2Row = (id: string) => {
    if (table2Rows.length <= 1) return;
    setTable2Rows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTable2SetKV = (rowId: string, value: string) => {
    setTable2Rows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, setKV: value } : row))
    );
  };

  const updateTable2MAColumn = (rowId: string, columnId: string, value: string) => {
    setTable2Rows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          maColumns: row.maColumns.map(col =>
            col.id === columnId ? { ...col, value } : col
          )
        };
      })
    );
  };

  // === Auto-calculate Avg & Pass/Fail ===
  const table2RowsWithCalculations = useMemo(() => {
    return table2Rows.map((row) => {
      // Get all mA values that are not empty
      const values = row.maColumns
        .map(col => parseFloat(col.value))
        .filter(v => !isNaN(v));

      const avg = values.length > 0
        ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
        : '';

      const setKV = parseFloat(row.setKV);
      if (isNaN(setKV) || avg === '') {
        return { ...row, avgKvp: avg, remarks: '' as const };
      }

      const measured = parseFloat(avg);
      let withinTolerance = false;

      if (toleranceType === 'percent') {
        const tolerance = parseFloat(toleranceValue) || 0;
        const allowedDiff = (setKV * tolerance) / 100;
        if (toleranceSign === 'plus') withinTolerance = measured <= setKV + allowedDiff;
        else if (toleranceSign === 'minus') withinTolerance = measured >= setKV - allowedDiff;
        else withinTolerance = Math.abs(measured - setKV) <= allowedDiff;
      } else {
        const tolerance = parseFloat(toleranceValue) || 0;
        if (toleranceSign === 'plus') withinTolerance = measured <= setKV + tolerance;
        else if (toleranceSign === 'minus') withinTolerance = measured >= setKV - tolerance;
        else withinTolerance = Math.abs(measured - setKV) <= tolerance;
      }

      return {
        ...row,
        avgKvp: avg,
        remarks: (withinTolerance ? 'Pass' : 'Fail') as 'Pass' | 'Fail',
      };
    });
  }, [table2Rows, toleranceValue, toleranceType, toleranceSign]);

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      table1Row.time.trim() &&
      table1Row.sliceThickness.trim() &&
      table2Rows.every((r) =>
        r.setKV.trim() &&
        r.maColumns.some(col => col.value.trim()) // At least one mA value filled
      )
    );
  }, [serviceId, table1Row, table2Rows]);

  // === Load CSV Initial Data ===
  useEffect(() => {
    if (initialData) {
      console.log('AccuracyOfOperatingPotential: Loading initial data from CSV:', initialData);
      if (initialData.table1 && initialData.table1.length > 0) {
        setTable1Row({
          time: String(initialData.table1[0].time || ''),
          sliceThickness: String(initialData.table1[0].sliceThickness || ''),
        });
      }

      if (initialData.table2 && initialData.table2.length > 0) {
        const maKeys = collectMammoTable2MaKeys(initialData.table2);
        const loadedMAColumns =
          maKeys.length > 0 ? maColumnsFromKeys(maKeys) : [...defaultMAColumns];

        setGlobalMAColumns(loadedMAColumns);

        setTable2Rows(
          initialData.table2.map((r, idx) => ({
            id: `csv-row-${Date.now()}-${idx}`,
            setKV: String(r.setKV || ''),
            maColumns: loadedMAColumns.map((col) => {
              const storageKey =
                col.id.startsWith('ma-key-') ? col.id.slice('ma-key-'.length) : col.label.replace(/\s+/g, '');
              return {
                ...col,
                value: cellValueFromRow(r, storageKey),
              };
            }),
            avgKvp: '',
            remarks: (r.remarks as '' | 'Pass' | 'Fail') || '',
          }))
        );
      }

      if (initialData.tolerance) {
        setToleranceValue(initialData.tolerance.value || '1.5');
        setToleranceType(initialData.tolerance.type || 'absolute');
        setToleranceSign(normalizeToleranceSign(initialData.tolerance.sign));
      }
      setIsEditing(true);
      setIsLoading(false);
    }
  }, [initialData]);

  // === Load Existing Data ===
  useEffect(() => {
    if (!serviceId || initialData) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const res = await getAccuracyOfOperatingPotentialByServiceIdForMammography(serviceId);
        const rec = res;

        if (!rec) {
          setIsLoading(false);
          return;
        }

        if (rec._id) setTestId(rec._id);

        // Table 1
        if (rec.table1 && Array.isArray(rec.table1) && rec.table1.length > 0) {
          setTable1Row({
            time: String(rec.table1[0].time || ''),
            sliceThickness: String(rec.table1[0].sliceThickness || ''),
          });
        }

        // Table 2 — union mA keys from all rows (Mongo may omit empty keys on the first row)
        if (Array.isArray(rec.table2) && rec.table2.length > 0) {
          const maKeys = collectMammoTable2MaKeys(rec.table2);
          const loadedMAColumns =
            maKeys.length > 0 ? maColumnsFromKeys(maKeys) : [...defaultMAColumns];

          setGlobalMAColumns(loadedMAColumns);

          setTable2Rows(
            rec.table2.map((r: any, idx: number) => ({
              id: `row-${Date.now()}-${idx}`,
              setKV: String(r.setKV ?? ''),
              maColumns: loadedMAColumns.map((col) => {
                const storageKey =
                  col.id.startsWith('ma-key-') ? col.id.slice('ma-key-'.length) : col.label.replace(/\s+/g, '');
                return {
                  ...col,
                  value: cellValueFromRow(r, storageKey),
                };
              }),
              avgKvp: '',
              remarks: r.remarks || '',
            }))
          );
        }

        // Tolerance
        if (rec.tolerance) {
          setToleranceValue(String(rec.tolerance.value || '1.5'));
          setToleranceType(rec.tolerance.type || 'absolute');
          setToleranceSign(normalizeToleranceSign(rec.tolerance.sign));
        }

        setHasSaved(true);
        setIsEditing(false);
      } catch (e: any) {
        console.error('AccuracyOfOperatingPotential: Error loading data:', e);
        if (e.response?.status !== 404) toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, refreshKey, initialData]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    // Build dynamic payload
    const payload: any = {
      table1: [table1Row],
      table2: table2RowsWithCalculations.map((r) => {
        // Create dynamic object with mA columns
        const maValues: any = {};
        r.maColumns.forEach(col => {
          // Persist normalized key to avoid duplicate columns after reload (mA10/ma10/10mA)
          const key = canonicalMammoMaKey(col.label);
          maValues[key] = parseFloat(col.value) || null;
        });

        const values = r.maColumns
          .map(col => parseFloat(col.value))
          .filter(v => !isNaN(v));

        const avgKvp = values.length > 0
          ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
          : null;

        const setKV = parseFloat(r.setKV);
        let deviation: string | null = null;
        if (avgKvp && !isNaN(setKV)) {
          deviation = ((parseFloat(avgKvp) - setKV) / setKV * 100).toFixed(2);
        }

        return {
          setKV: setKV,
          ...maValues, // Spread dynamic mA values
          avgKvp: avgKvp ? parseFloat(avgKvp) : null,
          deviation: deviation ? parseFloat(deviation) : null,
          remarks: r.remarks,
        };
      }),
      toleranceValue,
      toleranceType,
      toleranceSign,
    };

    try {
      let res;
      if (testId) {
        res = await updateAccuracyOfOperatingPotentialForMammography(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addAccuracyOfOperatingPotentialForMammography(serviceId, payload);
        if (res?.data?.data?.testId) setTestId(res.data.data.testId);
        else if (res?.data?.data?._id) setTestId(res.data.data._id);
        toast.success('Saved successfully!');
      }
      setHasSaved(true);
      setIsEditing(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (!hasSaved) return;
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
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Accuracy of Operating Potential (kVp) – Mammography
      </h2>

      {/* Table 1: Single Row */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Exposure Time vs Slice Thickness
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700  tracking-wider border-r">
                Time (ms)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700  tracking-wider">
                Slice Thickness (mm)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-2 border-r">
                <input
                  type="text"
                  value={table1Row.time}
                  onChange={(e) => setTable1Row((p) => ({ ...p, time: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                      ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                      : 'border-gray-300'
                    }`}
                  placeholder="100"
                />
              </td>
              <td className="px-6 py-2">
                <input
                  type="text"
                  value={table1Row.sliceThickness}
                  onChange={(e) => setTable1Row((p) => ({ ...p, sliceThickness: e.target.value }))}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode
                      ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300'
                      : 'border-gray-300'
                    }`}
                  placeholder="5.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2 – header layout like RadiographyFixed TotalFilteration */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-300">
          <h3 className="text-xl font-bold text-blue-900">
            Accuracy of kVp at Different mA Stations
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider border-r">
                  Applied kVp
                </th>
                <th colSpan={globalMAColumns.length} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider border-r">
                  <div className="flex items-center justify-between">
                    <span>Measured Values (kVp)</span>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={addMAColumn}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider border-r">
                  Average kVp
                </th>
                <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-600 tracking-wider">
                  Remarks
                </th>
                <th rowSpan={2} className="w-12" />
              </tr>
              <tr>
                {globalMAColumns.map((col, idx) => (
                  <th key={col.id} className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r">
                    {isViewMode ? (
                      col.label
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          value={col.label}
                          onChange={(e) => updateMAHeader(idx, e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        {globalMAColumns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMAColumn(idx)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table2RowsWithCalculations.map((row) => {
                const baseRow = table2Rows.find(r => r.id === row.id) || row;
                const isFail = row.remarks === 'Fail';
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 border-r">
                      <input
                        type="number"
                        value={baseRow.setKV}
                        onChange={(e) => updateTable2SetKV(row.id, e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                          }`}
                        placeholder="28"
                      />
                    </td>
                    {globalMAColumns.map(col => {
                      const maCol = baseRow.maColumns.find(mc => mc.id === col.id);
                      const hasValue = maCol?.value !== '' && !isNaN(parseFloat(maCol?.value || ''));
                      return (
                        <td key={col.id} className={`px-3 py-3 text-center border-r ${hasValue && isFail ? 'bg-red-100' : ''}`}>
                          <input
                            type="number"
                            step="0.1"
                            value={maCol?.value || ''}
                            onChange={(e) => updateTable2MAColumn(row.id, col.id, e.target.value)}
                            disabled={isViewMode}
                            className={`w-full px-3 py-2 text-center border rounded text-sm focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : hasValue && isFail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            placeholder="0.0"
                          />
                        </td>
                      );
                    })}
                    <td className={`px-6 py-3 text-center font-bold border-r ${row.avgKvp && isFail ? 'bg-red-100 text-red-800' : 'text-gray-800'}`}>
                      {row.avgKvp || '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${row.remarks === 'Pass' ? 'bg-green-100 text-green-800' : row.remarks === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {row.remarks || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {table2Rows.length > 1 && !isViewMode && (
                        <button
                          type="button"
                          onClick={() => removeTable2Row(row.id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isViewMode && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <button
              type="button"
              onClick={addTable2Row}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" /> Add Row
            </button>
          </div>
        )}
      </div>

      {/* Tolerance for kVp Accuracy (same as RadiographyFixed TotalFilteration) */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-300 shadow-md">
        <h4 className="text-lg font-bold text-indigo-900 mb-4">Tolerance for kVp Accuracy</h4>
        <div className="flex items-center gap-4">
          <span className="font-medium text-indigo-800">Tolerance:</span>
          <select
            value={toleranceSign}
            onChange={(e) => setToleranceSign(e.target.value as 'plus' | 'minus' | 'both')}
            disabled={isViewMode}
            className={`px-4 py-2 border border-indigo-400 rounded bg-white font-medium ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
          >
            <option value="both">±</option>
            <option value="plus">Positive only (+)</option>
            <option value="minus">Negative only (-)</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            className={`w-28 px-4 py-2 text-center border border-indigo-400 rounded font-medium focus:ring-2 focus:ring-indigo-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
          />
          <span className="font-medium text-indigo-800">kV</span>
        </div>
      </div>

      {/* SAVE BUTTON */}
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
              {buttonText} Measurement
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccuracyOfOperatingPotential;