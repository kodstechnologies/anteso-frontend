import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Table 1: FCM & Time
interface SettingsRow {
  id: string;
  fcm: string;
  time: string;
}

// Table 2: Leakage Data
interface LeakageRow {
  id: string;
  location: string;
  left: string;
  right: string;
  front: string;
  back: string;
  top: string;
  result: string;
  remark: string;
}

const RadiationLeakageLevel: React.FC = () => {
  // === Table 1: FCM & Time ===
  const [settingsRows, setSettingsRows] = useState<SettingsRow[]>([
    { id: '1', fcm: '', time: '' },
  ]);

  const addSettingsRow = () => {
    setSettingsRows((prev) => [
      ...prev,
      { id: Date.now().toString(), fcm: '', time: '' },
    ]);
  };

  const removeSettingsRow = (id: string) => {
    if (settingsRows.length <= 1) return;
    setSettingsRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateSettingsRow = (id: string, field: 'fcm' | 'time', value: string) => {
    setSettingsRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // === Table 2: Leakage Measurements ===
  const [leakageRows, setLeakageRows] = useState<LeakageRow[]>([
    {
      id: '1',
      location: 'Tube',
      left: '',
      right: '',
      front: '',
      back: '',
      top: '',
      result: '',
      remark: '',
    },
    {
      id: '2',
      location: 'Collimator',
      left: '',
      right: '',
      front: '',
      back: '',
      top: '',
      result: '',
      remark: '',
    },
  ]);

  const addLeakageRow = () => {
    setLeakageRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        location: '',
        left: '',
        right: '',
        front: '',
        back: '',
        top: '',
        result: '',
        remark: '',
      },
    ]);
  };

  const removeLeakageRow = (id: string) => {
    if (leakageRows.length <= 1) return;
    setLeakageRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateLeakageRow = (
    id: string,
    field:
      | 'location'
      | 'left'
      | 'right'
      | 'front'
      | 'back'
      | 'top'
      | 'result'
      | 'remark',
    value: string
  ) => {
    setLeakageRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // === Tolerance & Notes (outside) ===
  const [tolerance, setTolerance] = useState<string>('');
  const [notes, setNotes] = useState<string[]>(['']);

  const addNote = () => {
    setNotes((prev) => [...prev, '']);
  };

  const removeNote = (index: number) => {
    if (notes.length <= 1) return;
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNote = (index: number, value: string) => {
    setNotes((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  return (
    <div className="p-6 max-w-full overflow-x-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">Radiation Leakage Level</h2>

      {/* ==================== Table 1: FCM & Time ==================== */}
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
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {settingsRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={row.fcm}
                    onChange={(e) => updateSettingsRow(row.id, 'fcm', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.time}
                    onChange={(e) => updateSettingsRow(row.id, 'time', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1.0"
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  {settingsRows.length > 1 && (
                    <button
                      onClick={() => removeSettingsRow(row.id)}
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
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-start">
          <button
            onClick={addSettingsRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* ==================== Table 2: Leakage Results ==================== */}
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
              <th rowSpan={2} className="w-12" />
            </tr>
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Left
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Right
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Front
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Back
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Top
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leakageRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {/* Location */}
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={row.location}
                    onChange={(e) => updateLeakageRow(row.id, 'location', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Tube"
                  />
                </td>
                {/* Left */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.left}
                    onChange={(e) => updateLeakageRow(row.id, 'left', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.02"
                  />
                </td>
                {/* Right */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.right}
                    onChange={(e) => updateLeakageRow(row.id, 'right', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.01"
                  />
                </td>
                {/* Front */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.front}
                    onChange={(e) => updateLeakageRow(row.id, 'front', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.03"
                  />
                </td>
                {/* Back */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.back}
                    onChange={(e) => updateLeakageRow(row.id, 'back', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.02"
                  />
                </td>
                {/* Top */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="text"
                    value={row.top}
                    onChange={(e) => updateLeakageRow(row.id, 'top', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.01"
                  />
                </td>
                {/* Result */}
                <td className="px-4 py-2 border-r">
                  <input
                    type="text"
                    value={row.result}
                    onChange={(e) => updateLeakageRow(row.id, 'result', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.018"
                  />
                </td>
                {/* Remark */}
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.remark}
                    onChange={(e) => updateLeakageRow(row.id, 'remark', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pass"
                  />
                </td>
                {/* Remove */}
                <td className="px-2 py-2 text-center">
                  {leakageRows.length > 1 && (
                    <button
                      onClick={() => removeLeakageRow(row.id)}
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

        {/* Add Row Button at Bottom */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-start">
          <button
            onClick={addLeakageRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* ==================== Tolerance & Notes (Outside) ==================== */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tolerance (mGy/h)
          </label>
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-sm text-gray-600">Less than or equal to</span>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="1.0"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <button
              onClick={addNote}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-3 h-3" />
              Add Note
            </button>
          </div>
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => updateNote(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter note..."
                />
                {notes.length > 1 && (
                  <button
                    onClick={() => removeNote(index)}
                    className="text-red-600 hover:bg-red-100 p-1 rounded"
                    title="Remove Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiationLeakageLevel;