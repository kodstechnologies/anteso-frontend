// GenerateReport-InventionalRadiology.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { getDetails, getTools, saveReportHeader, getReportHeaderForCArm, getAccuracyOfIrradiationTimeByServiceIdForCArm, proxyFile } from "../../../../../../api";

// Test-table imports (unchanged)
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import TotalFilteration from "./TotalFilteration";
// import LinearityOfmAsLoading from "../LinearityOfmAsLoading";
import ConsisitencyOfRadiationOutput from "./OutputConsisitency";
import LowContrastResolution from "./LowContrastResolution";
import HighContrastResolution from "./HighContrastResolution";
import ExposureRateAtTableTop from "./ExposureRateAtTableTop";
import TubeHousingLeakage from "./TubeHousingLeakage";
import LinearityOfMaLoading from "./LinearityOfMaLoadingStations";
import LinearityOfMasLoading from "./LinearityOfMasLoadingStations";

export interface Standard {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string;
  SrNo: string;
  range: string;
  certificate: string | null;
  calibrationCertificateNo: string;
  calibrationValidTill: string;
  uncertainity: string;
}

interface DetailsResponse {
  hospitalName: string;
  hospitalAddress: string;
  srfNumber: string;
  machineType: string;
  machineModel: string;
  serialNumber: string;
  engineerAssigned: {
    name: string;
    email: string;
    designation: string;
  };
  qaTests: Array<{
    qaTestId: string;
    qaTestReportNumber: string;
    reportULRNumber: string;
    createdAt: string;
  }>;
}

interface ToolsResponse {
  toolsAssigned: Array<{
    _id: string;
    toolId: string;
    SrNo: string;
    nomenclature: string;
    manufacturer: string;
    model: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    range: string;
    certificate: string | null;
  }>;
}

interface CArmProps {
  serviceId: string;
  qaTestDate?: string | null;
  csvFileUrl?: string | null;
}

const CArm: React.FC<CArmProps> = ({ serviceId, csvFileUrl }) => {
  const navigate = useNavigate();

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false); // Will be set based on localStorage
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    srfNumber: "",
    srfDate: "",
    testReportNumber: "",
    issueDate: "",
    nomenclature: "",
    make: "",
    model: "",
    slNumber: "",
    category: "",
    condition: "OK",
    testingProcedureNumber: "",
    pages: "",
    testDate: "",
    testDueDate: "",
    location: "",
    temperature: "",
    humidity: "",
    engineerNameRPId: "",
  });

  const [csvUploading, setCsvUploading] = useState(false);
  const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!serviceId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [detRes, toolRes] = await Promise.all([
          getDetails(serviceId),
          getTools(serviceId),
        ]);

        setDetails(detRes.data);
        const firstTest = detRes.data.qaTests?.[0];

        setFormData({
          customerName: detRes.data.hospitalName,
          address: detRes.data.hospitalAddress,
          srfNumber: detRes.data.srfNumber,
          srfDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
          testReportNumber: firstTest?.qaTestReportNumber || "",
          issueDate: new Date().toISOString().split("T")[0],
          nomenclature: detRes.data.machineType,
          make: "",
          model: detRes.data.machineModel,
          slNumber: detRes.data.serialNumber,
          category: "",
          condition: "OK",
          testingProcedureNumber: "",
          pages: "",
          testDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
          testDueDate: "",
          location: detRes.data.hospitalAddress,
          temperature: "",
          humidity: "",
          engineerNameRPId: detRes.data.engineerAssigned?.name || "",
        });

        const mapped: Standard[] = toolRes.data.toolsAssigned.map(
          (t: any, idx: number) => ({
            slNumber: String(idx + 1),
            nomenclature: t.nomenclature,
            make: t.manufacturer,
            model: t.model,
            SrNo: t.SrNo,
            range: t.range,
            certificate: t.certificate ?? "",
            calibrationCertificateNo: t.calibrationCertificateNo,
            calibrationValidTill: t.calibrationValidTill.split("T")[0],
            uncertainity: "",
          })
        );
        setTools(mapped);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [serviceId]);

  // Check localStorage for timer preference on mount
  useEffect(() => {
    if (serviceId) {
      const stored = localStorage.getItem(`carm_timer_choice_${serviceId}`);
      if (stored !== null) {
        setHasTimer(JSON.parse(stored));
        setShowTimerModal(false);
      }
    }
  }, [serviceId]);

  useEffect(() => {
    const loadReportHeader = async () => {
      if (!serviceId) return;
      try {
        const res = await getReportHeaderForCArm(serviceId);
        if (res?.exists && res?.data) {
          setFormData(prev => ({
            ...prev,
            customerName: res.data.customerName || prev.customerName,
            address: res.data.address || prev.address,
            srfNumber: res.data.srfNumber || prev.srfNumber,
            srfDate: res.data.srfDate || prev.srfDate,
            testReportNumber: res.data.testReportNumber || prev.testReportNumber,
            issueDate: res.data.issueDate || prev.issueDate,
            nomenclature: res.data.nomenclature || prev.nomenclature,
            make: res.data.make || prev.make,
            model: res.data.model || prev.model,
            slNumber: res.data.slNumber || prev.slNumber,
            category: res.data.category || prev.category,
            condition: res.data.condition || prev.condition,
            testingProcedureNumber: res.data.testingProcedureNumber || prev.testingProcedureNumber,
            testDate: res.data.testDate || prev.testDate,
            testDueDate: res.data.testDueDate || prev.testDueDate,
            location: res.data.location || prev.location,
            temperature: res.data.temperature || prev.temperature,
            humidity: res.data.humidity || prev.humidity,
            engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
          }));

          // Check if AccuracyOfIrradiationTimeCArm exists
          const hasIrradiationTimeTest = res.data.AccuracyOfIrradiationTimeCArm?._id || res.data.AccuracyOfIrradiationTimeCArm;
          if (hasIrradiationTimeTest) {
            setHasTimer(true);
            setShowTimerModal(false);
          } else {
            // Check localStorage for saved choice
            const savedChoice = localStorage.getItem(`carm_timer_choice_${serviceId}`);
            if (savedChoice !== null) {
              setHasTimer(JSON.parse(savedChoice));
              setShowTimerModal(false);
            } else {
              // Only show modal if no saved choice and no existing test
              setShowTimerModal(true);
            }
          }
        } else {
          // No report header exists, check localStorage
          const savedChoice = localStorage.getItem(`carm_timer_choice_${serviceId}`);
          if (savedChoice !== null) {
            setHasTimer(JSON.parse(savedChoice));
            setShowTimerModal(false);
          } else {
            // Show modal only if no saved choice
            setShowTimerModal(true);
          }
        }
      } catch (err) {
        console.log("No report header found or failed to load:", err);
        // On error, check localStorage
        const savedChoice = localStorage.getItem(`carm_timer_choice_${serviceId}`);
        if (savedChoice !== null) {
          setHasTimer(JSON.parse(savedChoice));
          setShowTimerModal(false);
        } else {
          setShowTimerModal(true);
        }
      }
    };
    loadReportHeader();
  }, [serviceId]);

  const formatDate = (iso: string) => iso.split("T")[0];
  const [savedTestIds, setSavedTestIds] = useState<Record<string, string>>({});

  // Helper to save testId when a test is saved
  const handleTestSaved = (testName: string, testId: string) => {
    setSavedTestIds(prev => ({
      ...prev,
      [testName]: testId
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveHeader = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const payload = {
        ...formData,
        toolsUsed: tools.map((t) => ({
          tool: t.certificate || null,
          SrNo: t.SrNo,
          nomenclature: t.nomenclature,
          make: t.make,
          model: t.model,
          range: t.range,
          calibrationCertificateNo: t.calibrationCertificateNo,
          calibrationValidTill: t.calibrationValidTill,
          certificate: t.certificate,
          uncertainity: t.uncertainity,
        })),
        notes: [
          { slNo: "5.1", text: "The Test Report relates only to the above item only." },
          {
            slNo: "5.2",
            text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL.",
          },
          { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
          {
            slNo: "5.4",
            text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats.",
          },
          { slNo: "5.5", text: "Any error in this Report should be brought to our knowledge within 30 days from the date of this report." },
          { slNo: "5.6", text: "Results reported are valid at the time of and under the stated conditions of measurements." },
          { slNo: "5.7", text: "Name, Address & Contact detail is provided by Customer." },
        ],
      };

      await saveReportHeader(serviceId, payload);
      setSaveSuccess(true);
      toast.success("Report header saved successfully!");
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to save report header";
      setSaveError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Close modal and set timer choice
  const handleTimerChoice = (choice: boolean) => {
    setHasTimer(choice);
    setShowTimerModal(false);
    // Persist choice in localStorage
    localStorage.setItem(`carm_timer_choice_${serviceId}`, JSON.stringify(choice));
  };

  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const data: any[] = [];
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    if (jsonData.length === 0) return data;

    let fieldNameCol = -1;
    let valueCol = -1;
    let headerRowIndex = -1;

    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim().toLowerCase();
        if (cell === 'field name' || cell === 'fieldname') {
          headerRowIndex = i;
          fieldNameCol = j;
        } else if (cell === 'value') {
          valueCol = j;
        }
      }
      if (fieldNameCol !== -1 && valueCol !== -1) break;
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      fieldNameCol = 0;
      valueCol = 1;
    }

    const sectionToTestName: { [key: string]: string } = {
      '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy of Irradiation Time',
      '========== TOTAL FILTRATION ==========': 'Total Filtration',
      '========== CONSISTENCY OF RADIATION OUTPUT ==========': 'Consistency of Radiation Output',
      '========== LOW CONTRAST RESOLUTION ==========': 'Low Contrast Resolution',
      '========== HIGH CONTRAST RESOLUTION ==========': 'High Contrast Resolution',
      '========== EXPOSURE RATE AT TABLE TOP ==========': 'Exposure Rate At Table Top',
      '========== TUBE HOUSING LEAKAGE ==========': 'Tube Housing Leakage',
      '========== LINEARITY OF MA LOADING ==========': 'Linearity of mA Loading',
      '========== LINEARITY OF MAS LOADING ==========': 'Linearity of mAs Loading',
    };

    let currentTestName = '';
    const rowIndexCounter: { [key: string]: number } = {};
    const lastRowStartField: { [key: string]: string } = {};

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const fieldName = String(row[fieldNameCol] || '').trim();
      const value = String(row[valueCol] || '').trim();

      if (fieldName.startsWith('==========') && fieldName.endsWith('==========')) {
        currentTestName = sectionToTestName[fieldName] || '';
        rowIndexCounter[currentTestName] = 0;
        lastRowStartField[currentTestName] = '';
        continue;
      }

      if (!fieldName || fieldName.startsWith('---')) continue;

      if (currentTestName) {
        const rowStartFields = [
          'IrradiationTime_SetTime',
          'Measurement_AppliedKvp',
          'Linearity_mA',
          'Linearity_mAs',
          'Output_kV',
          'LowContrast_HoleSize',
          'HighContrast_LpMm',
          'ExposureRate_Distance',
          'Leakage_Location'
        ];

        const isRowStart = rowStartFields.some(startField => fieldName.startsWith(startField));

        if (isRowStart) {
          rowIndexCounter[currentTestName] = (rowIndexCounter[currentTestName] || 0) + 1;
        }

        data.push({
          'Field Name': fieldName,
          'Value': value,
          'Row Index': (rowIndexCounter[currentTestName] || 0) - 1,
          'Test Name': currentTestName,
        });
      }
    }
    return data;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const parsedData = parseExcelToCSVFormat(workbook);

        if (parsedData.length > 0) {
          await processCSVData(parsedData);
          setRefreshKey(prev => prev + 1);
          toast.success("File data uploaded and processed!");
        } else {
          toast.error("No valid test data found in the file.");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error("Failed to process the uploaded file.");
      } finally {
        setCsvUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Auto-load Excel from URL when csvFileUrl is passed (e.g. after complete status / Generate Report from ServiceDetails2)
  // Uses proxyFile so the request is authenticated and avoids CORS/401 redirect to login
  useEffect(() => {
    if (!csvFileUrl) return;

    const loadFromUrl = async () => {
      try {
        setCsvUploading(true);
        toast.loading("Loading Excel data from file...", { id: "carm-csv-load" });
        const response = await proxyFile(csvFileUrl);
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const parsedData = parseExcelToCSVFormat(workbook);
        if (parsedData.length > 0) {
          await processCSVData(parsedData);
          setRefreshKey((prev) => prev + 1);
          toast.success("Excel data loaded from file", { id: "carm-csv-load" });
        } else {
          toast.error("No valid test data found in the file", { id: "carm-csv-load" });
        }
      } catch (err: any) {
        console.error("C-Arm: Error loading file from URL", err);
        toast.error(err?.message || "Failed to load Excel from file", { id: "carm-csv-load" });
      } finally {
        setCsvUploading(false);
      }
    };

    loadFromUrl();
  }, [csvFileUrl]);

  const processCSVData = async (csvData: any[]) => {
    const groupedData: { [key: string]: any[] } = {};
    csvData.forEach(row => {
      const testName = row['Test Name'];
      if (testName) {
        if (!groupedData[testName]) groupedData[testName] = [];
        groupedData[testName].push(row);
      }
    });

    const processed: any = {};

    // Helper to extract data for specific components
    // (This will be expanded as we see the specific structure needed by each component)
    Object.keys(groupedData).forEach(testName => {
      processed[testName] = groupedData[testName];
    });

    setCsvDataForComponents(processed);
  };

  // Conditional returns after all hooks so hook count is consistent every render
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <p className="text-lg">Loading report data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!details) {
    return <div className="max-w-6xl mx-auto p-8">No data received.</div>;
  }
  if (showTimerModal && hasTimer === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Availability</h3>
          <p className="text-gray-600 mb-8 text-center">
            Does this C-Arm unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
          </p>
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => handleTimerChoice(true)}
              className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition transform hover:scale-105"
            >
              Yes, Has Timer
            </button>
            <button
              onClick={() => handleTimerChoice(false)}
              className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 transition transform hover:scale-105"
            >
              No Timer
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Generate QA Test Report - C-Arm
      </h1>

      {/* 1. Customer Name & Address */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          1. Name and Address of Customer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className="border p-2 rounded-md w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="border p-2 rounded-md w-full"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* 2. Customer Reference */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          2. Customer Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              2.1 SRF Number
            </label>
            <input
              type="text"
              defaultValue={details.srfNumber}
              className="border p-2 rounded-md w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dated
            </label>
            <input
              type="date"
              defaultValue={formatDate(details.qaTests[0]?.createdAt ?? "")}
              className="border p-2 rounded-md w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              2.2 Test Report Number
            </label>
            <input
              type="text"
              defaultValue={details.qaTests[0]?.qaTestReportNumber ?? "N/A"}
              className="border p-2 rounded-md w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input type="date" className="border p-2 rounded-md w-full" />
          </div>
        </div>
      </section>

      {/* 3. Device Under Test */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          3. Details of the Device Under Test
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nomenclature", name: "nomenclature", value: formData.nomenclature, readOnly: true },
            { label: "Make", name: "make", value: formData.make, readOnly: false },
            { label: "Model", name: "model", value: formData.model, readOnly: true },
            { label: "Serial Number", name: "slNumber", value: formData.slNumber, readOnly: true },
            { label: "Category", name: "category", value: formData.category, readOnly: false },
            { label: "Condition of Test Item", name: "condition", value: formData.condition, readOnly: false },
            { label: "Testing Procedure Number", name: "testingProcedureNumber", value: formData.testingProcedureNumber, readOnly: false },
            { label: "No. of Pages", name: "pages", value: formData.pages, readOnly: false },
            { label: "QA Test Date", name: "testDate", value: formData.testDate, type: "date", readOnly: false },
            { label: "QA Test Due Date", name: "testDueDate", value: formData.testDueDate, type: "date", readOnly: false },
            { label: "Testing Done At Location", name: "location", value: formData.location, readOnly: false },
            { label: "Temperature (°C)", name: "temperature", value: formData.temperature, type: "number", readOnly: false },
            { label: "Humidity (RH %)", name: "humidity", value: formData.humidity, type: "number", readOnly: false },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type ?? "text"}
                name={field.name}
                value={field.value}
                onChange={handleInputChange}
                className="border p-2 rounded-md w-full"
                readOnly={field.readOnly}
              />
            </div>
          ))}
        </div>
      </section>

      <Standards standards={tools} />
      <Notes />

      {/* Save Header and View Report Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          type="button"
          onClick={handleSaveHeader}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-bold ${saving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
            } text-white`}
        >
          {saving ? "Saving..." : "Save Report Header"}
        </button>
        {saveSuccess && (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            Header saved successfully!
          </div>
        )}
        {saveError && (
          <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
            {saveError}
          </div>
        )}
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
          onClick={() => navigate(`/admin/orders/view-service-report-c-arm?serviceId=${serviceId}`)}
        >
          View Generated Report
        </button>
      </div>

      {/* CSV/Excel Upload Section */}
      <div className="mt-12 mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Upload Test Data</h3>
            <p className="text-sm text-blue-700">
              Upload a CSV or Excel file to auto-fill test data. Download templates below.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2">
              <a
                href="/templates/CArm_Test_Data_Template_WithTimer.csv"
                download="CArm_Test_Data_Template_WithTimer.csv"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                Template (With Timer)
              </a>
              <a
                href="/templates/CArm_Test_Data_Template_NoTimer.csv"
                download="CArm_Test_Data_Template_NoTimer.csv"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                Template (No Timer)
              </a>
              <a
                href="/templates/CArm_Template.xlsx"
                download="CArm_Template.xlsx"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                ⬇ Excel Template (.xlsx)
              </a>
            </div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 text-sm">
              <CloudArrowUpIcon className="w-5 h-5" />
              {csvUploading ? 'Uploading...' : 'Upload CSV/Excel'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleCSVUpload}
                className="hidden"
                disabled={csvUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* QA Tests - Conditional Linearity */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>

        {[
          {
            title: "Accuracy Of Irradiation Time",
            component: <AccuracyOfIrradiationTime
              key={`timer-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['Accuracy of Irradiation Time']}
            />
          },
          {
            title: "Total Filtration",
            component: <TotalFilteration
              key={`total-filtration-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['Total Filtration']}
            />
          },
          {
            title: "Consistency Of Radiation Output",
            component: <ConsisitencyOfRadiationOutput
              key={`output-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['Consistency of Radiation Output']}
            />
          },
          {
            title: "Low Contrast Resolution",
            component: <LowContrastResolution
              key={`low-contrast-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['Low Contrast Resolution']}
            />
          },
          {
            title: "High Contrast Resolution",
            component: <HighContrastResolution
              key={`high-contrast-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['High Contrast Resolution']}
            />
          },
          {
            title: "Exposure Rate At Table Top",
            component: <ExposureRateAtTableTop
              key={`exposure-rate-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['Exposure Rate At Table Top']}
            />
          },
          {
            title: "Tube Housing Leakage",
            component: <TubeHousingLeakage
              key={`tube-leakage-${refreshKey}`}
              serviceId={serviceId}
              refreshKey={refreshKey}
              initialData={csvDataForComponents['Tube Housing Leakage']}
            />
          },

          // Conditional Linearity Test
          ...(hasTimer === true
            ? [{
              title: "Linearity Of mA Loading",
              component: <LinearityOfMaLoading
                key={`linearity-ma-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents['Linearity of mA Loading']}
              />
            }]
            : hasTimer === false
              ? [{
                title: "Linearity Of mAs Loading",
                component: <LinearityOfMasLoading
                  key={`linearity-mas-${refreshKey}`}
                  serviceId={serviceId}
                  refreshKey={refreshKey}
                  initialData={csvDataForComponents['Linearity of mAs Loading']}
                />
              }]
              : []
          ),

        ].map((item, idx) => (
          <Disclosure key={idx} defaultOpen={idx === 0}>
            {({ open }) => (
              <>
                <Disclosure.Button className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg mb-2 transition">
                  <span>{item.title}</span>
                  <ChevronDownIcon className={`w-6 h-6 transition-transform ${open ? "rotate-180" : ""}`} />
                </Disclosure.Button>

                <Disclosure.Panel className="border border-gray-300 rounded-b-lg p-6 bg-gray-50 mb-6">
                  {item.component}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
};

export default CArm;