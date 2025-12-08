// components/TestTables/LeadApron/LeadApronTest.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addLeadApronTest,
  getLeadApronTestByServiceId,
  updateLeadApronTest,
} from '../../../../../../api';

interface LeadApronTestProps {
  serviceId: string;
  testId?: string | null;
  onTestSaved?: (testId: string) => void;
}

const LeadApronTest: React.FC<LeadApronTestProps> = ({
  serviceId,
  testId: initialTestId = null,
  onTestSaved,
}) => {
  const [testId, setTestId] = useState<string | null>(initialTestId);
  const [loading, setLoading] = useState(!!initialTestId);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(!!initialTestId);
  const [isEditing, setIsEditing] = useState(false);

  const isViewMode = isSaved && !isEditing;

  // Report Details
  const [reportDetails, setReportDetails] = useState({
    institutionName: '',
    institutionCity: '',
    equipmentType: 'Lead Apron',
    equipmentId: '',
    personTesting: '',
    serviceAgency: '',
    testDate: '',
    testDuration: '',
  });

  // Operating Parameters
  const [operatingParameters, setOperatingParameters] = useState({
    ffd: '',
    kv: '',
    mas: '',
  });

  // Dose Measurements
  const [doseMeasurements, setDoseMeasurements] = useState({
    neutral: '',
    position1: '',
    position2: '',
    position3: '',
    averageValue: '',
    percentReduction: '',
    remark: '',
  });

  // Footer
  const [footer, setFooter] = useState({
    place: '',
    date: '',
    signature: '',
    serviceEngineerName: '',
    serviceAgencyName: '',
    serviceAgencySeal: '',
  });

  // Auto-calculate Average Value and % Reduction
  const calculations = useMemo(() => {
    const neutral = parseFloat(doseMeasurements.neutral) || 0;
    const pos1 = parseFloat(doseMeasurements.position1) || 0;
    const pos2 = parseFloat(doseMeasurements.position2) || 0;
    const pos3 = parseFloat(doseMeasurements.position3) || 0;

    const positions = [pos1, pos2, pos3].filter(v => v > 0);
    const avg = positions.length > 0
      ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(4)
      : '';

    const percentReduction = neutral > 0 && avg
      ? (((neutral - parseFloat(avg)) / neutral) * 100).toFixed(2)
      : '';

    // Determine remark based on % reduction (typically >= 99% is Pass)
    let remark = '';
    if (percentReduction) {
      const reduction = parseFloat(percentReduction);
      remark = reduction >= 99 ? 'Pass, Can use further' : 'Fail';
    }

    return { avg, percentReduction, remark };
  }, [doseMeasurements.neutral, doseMeasurements.position1, doseMeasurements.position2, doseMeasurements.position3]);

  // Update calculations when values change
  useEffect(() => {
    if (calculations.avg) {
      setDoseMeasurements(prev => ({
        ...prev,
        averageValue: calculations.avg,
        percentReduction: calculations.percentReduction,
        remark: calculations.remark,
      }));
    }
  }, [calculations]);

  // Load saved data
  useEffect(() => {
    const fetchData = async () => {
      if (!serviceId) return;
      setLoading(true);
      try {
        const res = await getLeadApronTestByServiceId(serviceId);
        const data = res?.data;
        if (data) {
          setTestId(data._id || null);
          setReportDetails({
            institutionName: data.reportDetails?.institutionName || '',
            institutionCity: data.reportDetails?.institutionCity || '',
            equipmentType: data.reportDetails?.equipmentType || 'Lead Apron',
            equipmentId: data.reportDetails?.equipmentId || '',
            personTesting: data.reportDetails?.personTesting || '',
            serviceAgency: data.reportDetails?.serviceAgency || '',
            testDate: data.reportDetails?.testDate ? new Date(data.reportDetails.testDate).toISOString().split('T')[0] : '',
            testDuration: data.reportDetails?.testDuration || '',
          });
          setOperatingParameters(data.operatingParameters || {
            ffd: '',
            kv: '',
            mas: '',
          });
          setDoseMeasurements(data.doseMeasurements || {
            neutral: '',
            position1: '',
            position2: '',
            position3: '',
            averageValue: '',
            percentReduction: '',
            remark: '',
          });
          setFooter({
            place: data.footer?.place || '',
            date: data.footer?.date ? new Date(data.footer.date).toISOString().split('T')[0] : '',
            signature: data.footer?.signature || '',
            serviceEngineerName: data.footer?.serviceEngineerName || '',
            serviceAgencyName: data.footer?.serviceAgencyName || '',
            serviceAgencySeal: data.footer?.serviceAgencySeal || '',
          });
          setIsSaved(true);
          setIsEditing(false);
        } else {
          setIsSaved(false);
          setIsEditing(true);
        }
      } catch (err) {
        console.log('No saved data or failed to load:', err);
        setIsSaved(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceId]);

  // Save / Update
  const handleSave = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    const payload = {
      reportDetails: {
        ...reportDetails,
        testDate: reportDetails.testDate ? new Date(reportDetails.testDate).toISOString() : null,
      },
      operatingParameters,
      doseMeasurements: {
        ...doseMeasurements,
        averageValue: calculations.avg,
        percentReduction: calculations.percentReduction,
        remark: calculations.remark,
      },
      // footer: {
      //   ...footer,
      //   date: footer.date ? new Date(footer.date).toISOString() : null,
      // },
    };

    setSaving(true);
    try {
      let result;
      if (testId) {
        result = await updateLeadApronTest(testId, payload);
        toast.success('Updated successfully!');
      } else {
        result = await addLeadApronTest(serviceId, payload);
        const newTestId = result?.data?.testId || result?.data?._id;
        if (newTestId) {
          setTestId(newTestId);
          onTestSaved?.(newTestId);
        }
        toast.success('Saved successfully!');
      }
      setIsSaved(true);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header with Edit/Save Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Lead Apron Test Report</h2>
        <button
          onClick={isViewMode ? startEditing : handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-lg transition-all ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : isViewMode
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isViewMode ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isViewMode ? 'Edit' : testId ? 'Update' : 'Save'} Test
            </>
          )}
        </button>
      </div>

      {/* Report Details Section */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            Report Details
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">1. Name of the Institution and City</label>
            <input
              type="text"
              value={reportDetails.institutionName}
              onChange={(e) => setReportDetails({ ...reportDetails, institutionName: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              placeholder="Institution Name"
            />
            <input
              type="text"
              value={reportDetails.institutionCity}
              onChange={(e) => setReportDetails({ ...reportDetails, institutionCity: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">2. Type of Equipment</label>
            <input
              type="text"
              value={reportDetails.equipmentType}
              onChange={(e) => setReportDetails({ ...reportDetails, equipmentType: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">3. Equipment Id</label>
            <input
              type="text"
              value={reportDetails.equipmentId}
              onChange={(e) => setReportDetails({ ...reportDetails, equipmentId: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">4. Name of Person Testing the Equipment</label>
            <input
              type="text"
              value={reportDetails.personTesting}
              onChange={(e) => setReportDetails({ ...reportDetails, personTesting: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Name of Service Agency</label>
            <input
              type="text"
              value={reportDetails.serviceAgency}
              onChange={(e) => setReportDetails({ ...reportDetails, serviceAgency: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">5. Dates and Duration of the Tests</label>
            <input
              type="date"
              value={reportDetails.testDate}
              onChange={(e) => setReportDetails({ ...reportDetails, testDate: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
            <input
              type="text"
              value={reportDetails.testDuration}
              onChange={(e) => setReportDetails({ ...reportDetails, testDuration: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2 ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              placeholder="0.15 Hr"
            />
          </div>
        </div>
      </div>

      {/* Operating Parameters */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            Operating Parameters: Tested on Direct Radiation
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">FFD (cm)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">kV</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">mAs</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={operatingParameters.ffd}
                  onChange={(e) => setOperatingParameters({ ...operatingParameters, ffd: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={operatingParameters.kv}
                  onChange={(e) => setOperatingParameters({ ...operatingParameters, kv: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="100"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={operatingParameters.mas}
                  onChange={(e) => setOperatingParameters({ ...operatingParameters, mas: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="10"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dose Value and Reading Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            Dose Value and Reading
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dose Value</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Reading</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">Neutral</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  step="0.0001"
                  value={doseMeasurements.neutral}
                  onChange={(e) => setDoseMeasurements({ ...doseMeasurements, neutral: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="0.1953"
                />
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">Position 1</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  step="0.0001"
                  value={doseMeasurements.position1}
                  onChange={(e) => setDoseMeasurements({ ...doseMeasurements, position1: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="0.00042"
                />
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">Position 2</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  step="0.0001"
                  value={doseMeasurements.position2}
                  onChange={(e) => setDoseMeasurements({ ...doseMeasurements, position2: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="0.00053"
                />
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">Position 3</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  step="0.0001"
                  value={doseMeasurements.position3}
                  onChange={(e) => setDoseMeasurements({ ...doseMeasurements, position3: e.target.value })}
                  disabled={isViewMode}
                  className={`w-full px-2 py-1 text-center border border-gray-300 rounded text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="0.00061"
                />
              </td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-3">Average Value</td>
              <td className="px-4 py-3 text-center">{calculations.avg || '—'}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-3">% Reduction in Dose (Remark)</td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>{calculations.percentReduction || '—'}</span>
                  {calculations.remark && (
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      calculations.remark.includes('Pass')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {calculations.remark}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      {/* <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            Footer Details
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
            <input
              type="text"
              value={footer.place}
              onChange={(e) => setFooter({ ...footer, place: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={footer.date}
              onChange={(e) => setFooter({ ...footer, date: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input
              type="text"
              value={footer.signature}
              onChange={(e) => setFooter({ ...footer, signature: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name of the Service Engineer</label>
            <input
              type="text"
              value={footer.serviceEngineerName}
              onChange={(e) => setFooter({ ...footer, serviceEngineerName: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name of Service Agency</label>
            <input
              type="text"
              value={footer.serviceAgencyName}
              onChange={(e) => setFooter({ ...footer, serviceAgencyName: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seal of Service Agency</label>
            <input
              type="text"
              value={footer.serviceAgencySeal}
              onChange={(e) => setFooter({ ...footer, serviceAgencySeal: e.target.value })}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default LeadApronTest;

