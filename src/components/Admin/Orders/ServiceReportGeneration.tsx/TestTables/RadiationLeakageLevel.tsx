// components/TestTables/RadiationLeakageLevel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit3, Save } from 'lucide-react';
import {
  addRadiationLeakage,
  getRadiationLeakageByTestId,
  updateRadiationLeakage,
} from '../../../../../api';
import toast from 'react-hot-toast';

interface SettingsRow {
  fcm: string;
  time: string;
}

interface LeakageRow {
  location: string;
  left: string;
  right: string;
  front: string;
  back: string;
  top: string;
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const RadiationLeakageLevel: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);

  // Fixed rows
  const [settings, setSettings] = useState<SettingsRow>({ fcm: '', time: '' });
  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    { location: 'Tube', left: '', right: '', front: '', back: '', top: '' },
    { location: 'Collimator', left: '', right: '', front: '', back: '', top: '' },
  ]);

  const [tolerance, setTolerance] = useState<string>('');
  const [notes, setNotes] = useState<string[]>(['']);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // === Auto Result (max of 5) & Remark ===
  const processedLeakage = useMemo(() => {
    const tol = parseFloat(tolerance) || Infinity;

    return leakageRows.map((row) => {
      const values = [
        parseFloat(row.left),
        parseFloat(row.right),
        parseFloat(row.front),
        parseFloat(row.back),
        parseFloat(row.top),
      ].filter((v) => !isNaN(v));

      const max = values.length > 0 ? Math.max(...values) : NaN;
      const result = isNaN(max) ? '' : max.toFixed(3);
      const remark = !isNaN(max) && max <= tol ? 'Pass' : !isNaN(max) ? 'Fail' : '';

      return { ...row, result, remark };
    });
  }, [leakageRows, tolerance]);

  // === Update Handlers ===
  const updateSettings = (field: 'fcm' | 'time', value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateLeakage = (index: number, field: keyof LeakageRow, value: string) => {
    setLeakageRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const updateNote = (index: number, value: string) => {
    setNotes((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addNote = () => {
    setNotes((prev) => [...prev, '']);
  };

  const removeNote = (index: number) => {
    if (notes.length <= 1) return;
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  // === Form Valid ===
  const isFormValid = useMemo(() => {
    return (
      !!serviceId &&
      settings.fcm.trim() &&
      settings.time.trim() &&
      leakageRows.every((r) =>
        r.left.trim() && r.right.trim() && r.front.trim() && r.back.trim() && r.top.trim()
      ) &&
      tolerance.trim()
    );
  }, [serviceId, settings, leakageRows, tolerance]);

  // === Load Data ===
  useEffect(() => {
    if (!testId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data } = await getRadiationLeakageByTestId(testId);
        const rec = data;

        if (rec.measurementSettings?.[0]) {
          setSettings({
            fcm: String(rec.measurementSettings[0].fcm),
            time: String(rec.measurementSettings[0].time),
          });
        }

        if (Array.isArray(rec.leakageMeasurements)) {
          setLeakageRows(
            rec.leakageMeasurements.map((r: any) => ({
              location: r.location || '',
              left: String(r.left),
              right: String(r.right),
              front: String(r.front),
              back: String(r.back),
              top: String(r.top),
            }))
          );
        }

        setTolerance(rec.tolerance || '');
        setNotes(rec.notes && rec.notes.length > 0 ? rec.notes : ['']);

        setHasSaved(true);
        setIsEditing(false);
      } catch (e: any) {
        if (e.response?.status !== 404) toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [testId]);

  // === Save / Update ===
  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);

    const payload = {
      measurementSettings: [
        {
          fcm: parseFloat(settings.fcm) || 0,
          time: parseFloat(settings.time) || 0,
        },
      ],
      leakageMeasurements: leakageRows.map((r) => ({
        location: r.location,
        left: parseFloat(r.left) || 0,
        right: parseFloat(r.right) || 0,
        front: parseFloat(r.front) || 0,
        back: parseFloat(r.back) || 0,
        top: parseFloat(r.top) || 0,
      })),
      tolerance: tolerance.trim(),
      notes: notes.filter((n) => n.trim()),
    };

    try {
      let res;
      if (testId) {
        res = await updateRadiationLeakage(testId, payload);
        toast.success('Updated successfully!');
      } else {
        res = await addRadiationLeakage(serviceId, payload);
        setTestId(res.data.testId);
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
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">Radiation Leakage Level</h2>

      {/* ==================== Table 1: FCM & Time (Fixed) ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Measurement Settings
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                FCM (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time (sec)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 border-r">
                <input
                  type="text"
                  value={settings.fcm}
                  onChange={(e) => updateSettings('fcm', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={settings.time}
                  onChange={(e) => updateSettings('time', e.target.value)}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="1.0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==================== Table 2: Leakage Results (Fixed 2 rows) ==================== */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-gray-50 border-b">
          Leakage Measurement Results
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Location
              </th>
              <th colSpan={5} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Exposure Level (mGy)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Result (mGy/h)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Remark
              </th>
            </tr>
            <tr>
              {['Left', 'Right', 'Front', 'Back', 'Top'].map((dir) => (
                <th
                  key={dir}
                  className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  {dir}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedLeakage.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={row.location}
                    onChange={(e) => updateLeakage(idx, 'location', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                      }`}
                  />
                </td>
                {(['left', 'right', 'front', 'back', 'top'] as const).map((field) => (
                  <td key={field} className="px-2 py-2 border-r">
                    <input
                      type="text"
                      value={leakageRows[idx][field]}
                      onChange={(e) => updateLeakage(idx, field, e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                        }`}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 border-r">
                  <span className="block text-center font-medium">{row.result || '—'}</span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${row.remark === 'Pass'
                        ? 'bg-green-100 text-green-800'
                        : row.remark === 'Fail'
                          ? 'bg-red-100 text-red-800'
                          : 'text-gray-400'
                      }`}
                  >
                    {row.remark || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==================== Tolerance & Notes ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tolerance (mGy/h)
          </label>
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-sm text-gray-600">≤</span>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                }`}
              placeholder="1.0"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            {!isViewMode && (
              <button
                onClick={addNote}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Add Note
              </button>
            )}
          </div>
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => updateNote(index, e.target.value)}
                  disabled={isViewMode}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'border-gray-300'
                    }`}
                  placeholder="Enter note..."
                />
                {notes.length > 1 && !isViewMode && (
                  <button
                    onClick={() => removeNote(index)}
                    className="text-red-600 hover:bg-red-100 p-1 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== SAVE BUTTON ==================== */}
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
              {buttonText} Leakage
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RadiationLeakageLevel;