// components/TestTables/OBI/AlignmentTest.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addAlignmentTestForOBI,
  getAlignmentTestByServiceIdForOBI,
  updateAlignmentTestForOBI,
} from "../../../../../../api";

interface TestRow {
  id: string;
  testName: string;
  sign: string; // ≤, ≥, <, >, =
  value: string; // e.g., "1 mm"
}

interface Props {
  serviceId: string;
  testId?: string;
  onRefresh?: () => void;
}

const AlignmentTest: React.FC<Props> = ({ serviceId, testId: propTestId, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [testRows, setTestRows] = useState<TestRow[]>([
    {
      id: '1',
      testName: '',
      sign: '≤',
      value: '',
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const signOptions = [
    { value: '≤', label: '≤ (Less than or equal to)' },
    { value: '≥', label: '≥ (Greater than or equal to)' },
    { value: '<', label: '< (Less than)' },
    { value: '>', label: '> (Greater than)' },
    { value: '=', label: '= (Equal to)' },
  ];

  // Row Handling
  const addTestRow = () => {
    setTestRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        testName: '',
        sign: '≤',
        value: '',
      },
    ]);
  };

  const removeTestRow = (id: string) => {
    if (testRows.length <= 1) return;
    setTestRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTestRow = (
    id: string,
    field: 'testName' | 'sign' | 'value',
    value: string
  ) => {
    setTestRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Load existing test data
  useEffect(() => {
    if (!serviceId) return;

    const loadTest = async () => {
      setIsLoading(true);
      try {
        const data = await getAlignmentTestByServiceIdForOBI(serviceId);
        if (data?.data) {
          const testData = data.data;
          setTestId(testData._id);
          if (testData.testRows && testData.testRows.length > 0) {
            setTestRows(
              testData.testRows.map((r: any, index: number) => ({
                id: r.id || `row-${index}-${Date.now()}`,
                testName: r.testName || '',
                sign: r.sign || '≤',
                value: r.value || '',
              }))
            );
          }
          setHasSaved(true);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load test data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [serviceId]);

  const handleSave = async () => {
    // Validate that all rows have testName and value
    const hasEmptyRows = testRows.some(
      (row) => !row.testName.trim() || !row.value.trim()
    );

    if (hasEmptyRows) {
      toast.error('Please fill all test names and tolerance values');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        testRows: testRows.map((r) => ({
          testName: r.testName.trim(),
          sign: r.sign,
          value: r.value.trim(),
        })),
      };

      let result;
      if (testId) {
        result = await updateAlignmentTestForOBI(testId, payload);
      } else {
        result = await addAlignmentTestForOBI(serviceId, payload);
        if (result?.data?._id) {
          setTestId(result.data._id);
        }
      }

      setHasSaved(true);
      setIsEditing(false);
      toast.success(testId ? "Updated successfully" : "Saved successfully");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing(true);
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
    <div className="p-6 max-w-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Alignment Test</h2>
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
            isViewMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ButtonIcon className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : buttonText}
        </button>
      </div>

      {/* Test Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="px-6 py-3 text-lg font-semibold bg-blue-50 border-b">
          Alignment Test Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tolerance Value
                </th>
                {!isViewMode && <th className="w-12" />}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 border-r">
                    {isViewMode ? (
                      <span className="text-sm text-gray-900">{row.testName || '—'}</span>
                    ) : (
                      <input
                        type="text"
                        value={row.testName}
                        onChange={(e) =>
                          updateTestRow(row.id, 'testName', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Positional/re-positional accuracy of imager"
                      />
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {isViewMode ? (
                      <span className="text-sm text-gray-900">
                        {row.sign} {row.value || '—'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={row.sign}
                          onChange={(e) =>
                            updateTestRow(row.id, 'sign', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {signOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) =>
                            updateTestRow(row.id, 'value', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 1 mm"
                        />
                      </div>
                    )}
                  </td>
                  {!isViewMode && (
                    <td className="px-2 py-3 text-center">
                      {testRows.length > 1 && (
                        <button
                          onClick={() => removeTestRow(row.id)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isViewMode && (
          <div className="px-6 py-3 bg-gray-50 border-t">
            <button
              onClick={addTestRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlignmentTest;
