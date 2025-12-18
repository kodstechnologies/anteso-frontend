// components/TestTables/TablePosition.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addTablePositionForCTScan,
  getTablePositionByServiceIdForCTScan,
  getTablePositionByTestIdForCTScan,
  updateTablePositionForCTScan,
} from '../../../../../../api';

interface ExposureParameter {
  kvp: string;
  ma: string;
  sliceThickness: string;
}

interface TableIncrementationRow {
  id: string;
  tablePosition: string;
  expected: string;
  measured: string;
}

interface Props {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
  onRefresh?: () => void;
}

const TablePosition: React.FC<Props> = ({ serviceId, testId: propTestId = null, onTestSaved, onRefresh }) => {
  const [testId, setTestId] = useState<string | null>(propTestId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // First table - Initial settings
  const [initialTablePosition, setInitialTablePosition] = useState<string>('');
  const [loadOnCouch, setLoadOnCouch] = useState<string>('');

  // Second table - Exposure Parameters
  const [exposureParameters, setExposureParameters] = useState<ExposureParameter[]>([
    { kvp: '', ma: '', sliceThickness: '' }
  ]);

  // Third table - Table Incrementation
  const [tableIncrementationRows, setTableIncrementationRows] = useState<TableIncrementationRow[]>([
    { id: '1', tablePosition: '', expected: '', measured: '' }
  ]);

  // Tolerance
  const [toleranceSign, setToleranceSign] = useState<'+' | '-' | '±'>('±');
  const [toleranceValue, setToleranceValue] = useState<string>('2');

  // Add exposure parameter row
  const addExposureParameterRow = () => {
    setExposureParameters([...exposureParameters, { kvp: '', ma: '', sliceThickness: '' }]);
  };

  const removeExposureParameterRow = (index: number) => {
    if (exposureParameters.length > 1) {
      setExposureParameters(exposureParameters.filter((_, i) => i !== index));
    }
  };

  const updateExposureParameter = (index: number, field: keyof ExposureParameter, value: string) => {
    setExposureParameters(exposureParameters.map((ep, i) => 
      i === index ? { ...ep, [field]: value } : ep
    ));
  };

  // Add table incrementation row
  const addTableIncrementationRow = () => {
    setTableIncrementationRows([...tableIncrementationRows, { 
      id: Date.now().toString(), 
      tablePosition: '', 
      expected: '', 
      measured: '' 
    }]);
  };

  const removeTableIncrementationRow = (id: string) => {
    if (tableIncrementationRows.length > 1) {
      setTableIncrementationRows(tableIncrementationRows.filter(row => row.id !== id));
    }
  };

  const updateTableIncrementationRow = (id: string, field: keyof TableIncrementationRow, value: string) => {
    setTableIncrementationRows(tableIncrementationRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Load data from backend
  useEffect(() => {
    const load = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getTablePositionByServiceIdForCTScan(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setInitialTablePosition(data.initialTablePosition || '');
          setLoadOnCouch(data.loadOnCouch || '');
          if (Array.isArray(data.exposureParameters) && data.exposureParameters.length > 0) {
            setExposureParameters(data.exposureParameters);
          }
          if (Array.isArray(data.tableIncrementation) && data.tableIncrementation.length > 0) {
            setTableIncrementationRows(data.tableIncrementation.map((row: any, i: number) => ({
              id: String(i + 1),
              tablePosition: row.tablePosition || '',
              expected: row.expected || '',
              measured: row.measured || '',
            })));
          }
          setToleranceSign(data.toleranceSign || '±');
          setToleranceValue(data.toleranceValue || '2');
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
          toast.error('Failed to load table position data');
        }
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId]);

  // Save handler
  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        initialTablePosition: initialTablePosition.trim(),
        loadOnCouch: loadOnCouch.trim(),
        exposureParameters: exposureParameters.map(ep => ({
          kvp: ep.kvp.trim(),
          ma: ep.ma.trim(),
          sliceThickness: ep.sliceThickness.trim(),
        })),
        tableIncrementation: tableIncrementationRows.map(row => ({
          tablePosition: row.tablePosition.trim(),
          expected: row.expected.trim(),
          measured: row.measured.trim(),
        })),
        toleranceSign,
        toleranceValue: toleranceValue.trim(),
      };

      let result_response;
      let currentTestId = testId;

      if (!currentTestId) {
        try {
          const existing = await getTablePositionByServiceIdForCTScan(serviceId);
          if (existing?.data?._id) {
            currentTestId = existing.data._id;
            setTestId(currentTestId);
          }
        } catch (err) {
          // No existing data, will create new
        }
      }

      if (currentTestId) {
        result_response = await updateTablePositionForCTScan(currentTestId, payload);
        toast.success('Updated successfully!');
      } else {
        result_response = await addTablePositionForCTScan(serviceId, payload);
        const newId = result_response?.data?.testId || result_response?.data?._id;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Table Position</h2>
        <button
          onClick={isViewMode ? toggleEdit : handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${
            isSaving
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
              {buttonText} Table Position
            </>
          )}
        </button>
      </div>

      {/* First Table - Initial Settings */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Initial Settings</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/2">
                Initial table position (arbitrary):
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={initialTablePosition}
                    onChange={(e) => setInitialTablePosition(e.target.value)}
                    disabled={isViewMode}
                    placeholder="Enter value"
                    className={`w-32 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm text-gray-600">cm</span>
                </div>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Load on couch:
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={loadOnCouch}
                    onChange={(e) => setLoadOnCouch(e.target.value)}
                    disabled={isViewMode}
                    placeholder="Enter value"
                    className={`w-32 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm text-gray-600">kg</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Second Table - Exposure Parameters */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-blue-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-blue-900">Exposure Parameters</h3>
          {!isViewMode && (
            <button
              onClick={addExposureParameterRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">kVp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">mA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Slice Thickness</th>
              {!isViewMode && exposureParameters.length > 1 && <th className="w-12"></th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exposureParameters.map((ep, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-r">
                  <input
                    type="text"
                    value={ep.kvp}
                    onChange={(e) => updateExposureParameter(index, 'kvp', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </td>
                <td className="px-6 py-4 border-r">
                  <input
                    type="text"
                    value={ep.ma}
                    onChange={(e) => updateExposureParameter(index, 'ma', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={ep.sliceThickness}
                    onChange={(e) => updateExposureParameter(index, 'sliceThickness', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </td>
                {!isViewMode && exposureParameters.length > 1 && (
                  <td className="px-3 py-4 text-center">
                    <button
                      onClick={() => removeExposureParameterRow(index)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Third Table - Applied Table Incrementation */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-green-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-green-900">Applied Table Incrementation</h3>
          {!isViewMode && (
            <button
              onClick={addTableIncrementationRow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                Table position from reference position (cm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">Expected (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Measured (cm)</th>
              {!isViewMode && tableIncrementationRows.length > 1 && <th className="w-12"></th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableIncrementationRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-r">
                  <input
                    type="text"
                    value={row.tablePosition}
                    onChange={(e) => updateTableIncrementationRow(row.id, 'tablePosition', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </td>
                <td className="px-6 py-4 border-r">
                  <input
                    type="text"
                    value={row.expected}
                    onChange={(e) => updateTableIncrementationRow(row.id, 'expected', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={row.measured}
                    onChange={(e) => updateTableIncrementationRow(row.id, 'measured', e.target.value)}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </td>
                {!isViewMode && tableIncrementationRows.length > 1 && (
                  <td className="px-3 py-4 text-center">
                    <button
                      onClick={() => removeTableIncrementationRow(row.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tolerance */}
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Tolerance:</label>
          <select
            value={toleranceSign}
            onChange={(e) => setToleranceSign(e.target.value as '+' | '-' | '±')}
            disabled={isViewMode}
            className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
            }`}
          >
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="±">±</option>
          </select>
          <input
            type="text"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            disabled={isViewMode}
            placeholder="Enter tolerance value"
            className={`w-32 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
            }`}
          />
          <span className="text-sm text-gray-600">mm</span>
        </div>
      </div>
    </div>
  );
};

export default TablePosition;

