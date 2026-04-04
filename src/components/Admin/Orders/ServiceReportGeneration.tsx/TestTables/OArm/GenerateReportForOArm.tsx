// GenerateReport-OArm.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import Standards from "../../Standards";
import Notes from "../../Notes";

import {
  getDetails,
  getTools,
  saveReportHeader,
  getReportHeaderForOArm,
  getTotalFilterationByServiceIdForOArm,
  getOutputConsistencyByServiceIdForOArm,
  getHighContrastResolutionByServiceIdForOArm,
  getLowContrastResolutionByServiceIdForOArm,
  getExposureRateByServiceIdForOArm,
  getTubeHousingLeakageByServiceIdForOArm,
  getLinearityOfMasLoadingStationByServiceIdForOArm,
  proxyFile,
} from "../../../../../../api";
import { createOArmUploadableExcel, OArmExportData } from "./exportOArmToExcel";

// Test-table imports
import TotalFilteration from "./TotalFilteration";
import OutputConsisitency from "./OutputConsisitency";
import HighContrastResolution from "./HighContrastResolution";
import LowContrastResolution from "./LowContrastResolution";
import ExposureRateAtTableTop from "./ExposureRateAtTableTop";
import TubeHousingLeakage from "./TubeHousingLeakage";
import LinearityOfMasLoadingStations from "./LinearityOfMasLoadingStations";
import AccuracyOfIrradiationTimeOArm from "./AccuracyOfIrradiationTimeOArm";

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

interface OArmProps {
  serviceId: string;
  qaTestDate?: string | null;
  csvFileUrl?: string | null;
}

const OArm: React.FC<OArmProps> = ({ serviceId, csvFileUrl }) => {
  const navigate = useNavigate();

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // State to store CSV data for components
  const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
  const [csvDataVersion, setCsvDataVersion] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    srfNumber: "",
    srfDate: "",
    reportULRNumber: "",
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
  const [minIssueDate, setMinIssueDate] = useState(""); // QA test submitted date; issue date must be >= this
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
        const data = detRes.data;
        const firstTest = data.qaTests?.[0];
        const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
        const testDateSource = firstTest?.qatestSubmittedAt || firstTest?.createdAt;
        const testDateStr = testDateSource ? new Date(testDateSource).toISOString().split("T")[0] : "";
        let testDueDateStr = "";
        if (testDateStr) {
          const d = new Date(testDateStr);
          d.setFullYear(d.getFullYear() + 2);
          testDueDateStr = d.toISOString().split("T")[0];
        }

        setMinIssueDate(testDateStr || "");
        setFormData({
          customerName: data.hospitalName,
          address: data.hospitalAddress,
          srfNumber: data.srfNumber,
          srfDate: srfDateStr,
          reportULRNumber: firstTest?.reportULRNumber || "",
          testReportNumber: firstTest?.qaTestReportNumber || "",
          issueDate: new Date().toISOString().split("T")[0],
          nomenclature: data.machineType,
          make: "",
          model: data.machineModel,
          slNumber: data.serialNumber,
          category: "",
          condition: "OK",
          testingProcedureNumber: "",
          pages: "",
          testDate: testDateStr,
          testDueDate: testDueDateStr,
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

  // Timer preference: when csvFileUrl is provided (redirect from ServiceDetails2), skip modal — config will be set from Excel in processCSVData.
  useEffect(() => {
    if (!serviceId) return;
    if (csvFileUrl) {
      setShowTimerModal(false);
      return;
    }
    const stored = localStorage.getItem(`oarm_timer_choice_${serviceId}`);
    if (stored !== null) {
      setHasTimer(JSON.parse(stored));
      setShowTimerModal(false);
    } else {
      setShowTimerModal(true);
    }
  }, [serviceId, csvFileUrl]);

  const handleTimerChoice = (choice: boolean) => {
    setHasTimer(choice);
    setShowTimerModal(false);
    if (serviceId) localStorage.setItem(`oarm_timer_choice_${serviceId}`, JSON.stringify(choice));
  };

  useEffect(() => {
    const loadReportHeader = async () => {
      if (!serviceId) return;
      try {
        const res = await getReportHeaderForOArm(serviceId);
        if (res?.exists && res?.data) {
          setFormData(prev => ({
            ...prev,
            customerName: res.data.customerName || prev.customerName,
            address: res.data.address || prev.address,
            srfNumber: res.data.srfNumber || prev.srfNumber,
            srfDate: res.data.srfDate || prev.srfDate,
            reportULRNumber: res.data.reportULRNumber || prev.reportULRNumber,
            testReportNumber: res.data.testReportNumber || prev.testReportNumber,
            issueDate: res.data.issueDate || prev.issueDate,
            nomenclature: res.data.nomenclature || prev.nomenclature,
            make: res.data.make || prev.make,
            model: res.data.model || prev.model,
            slNumber: res.data.slNumber || prev.slNumber,
            condition: res.data.condition || prev.condition,
            testingProcedureNumber: res.data.testingProcedureNumber || prev.testingProcedureNumber,
            testDate: res.data.testDate || prev.testDate,
            testDueDate: res.data.testDueDate || prev.testDueDate,
            location: res.data.location || prev.location,
            temperature: res.data.temperature || prev.temperature,
            humidity: res.data.humidity || prev.humidity,
            engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
          }));
          if (res.data.testDate) setMinIssueDate(res.data.testDate);
        }
      } catch (err) {
        console.log("No report header found or failed to load:", err);
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

  const isSaved = (raw: any): boolean => {
    if (raw == null) return false;
    if (typeof raw !== "object") return false;
    if (raw.success && raw.data != null) return true;
    if (raw.data && typeof raw.data === "object" && (raw.data as any)._id) return true;
    const data = raw.data !== undefined ? raw.data : raw;
    if (data == null || typeof data !== "object") return false;
    if ((data as any)._id) return true;
    if (Array.isArray((data as any).table2) && (data as any).table2.length > 0) return true;
    if (Array.isArray((data as any).readings) && (data as any).readings.length > 0) return true;
    if (Array.isArray((data as any).measurements) && (data as any).measurements.length > 0) return true;
    if ((data as any).totalFiltration != null && typeof (data as any).totalFiltration === "object") return true;
    return false;
  };

  const getUnsavedTestNames = async (): Promise<string[]> => {
    const checks: { name: string; check: () => Promise<boolean> }[] = [
      { name: "Total Filteration", check: async () => { try { return isSaved(await getTotalFilterationByServiceIdForOArm(serviceId)); } catch { return false; } } },
      { name: "Consistency Of Radiation Output", check: async () => { try { return isSaved(await getOutputConsistencyByServiceIdForOArm(serviceId)); } catch { return false; } } },
      { name: "High Contrast Resolution", check: async () => { try { return isSaved(await getHighContrastResolutionByServiceIdForOArm(serviceId)); } catch { return false; } } },
      { name: "Low Contrast Resolution", check: async () => { try { return isSaved(await getLowContrastResolutionByServiceIdForOArm(serviceId)); } catch { return false; } } },
      { name: "Exposure Rate At Table Top", check: async () => { try { return isSaved(await getExposureRateByServiceIdForOArm(serviceId)); } catch { return false; } } },
      { name: "Tube Housing Leakage", check: async () => { try { return isSaved(await getTubeHousingLeakageByServiceIdForOArm(serviceId)); } catch { return false; } } },
      { name: "Linearity Of mAs Loading", check: async () => { try { return isSaved(await getLinearityOfMasLoadingStationByServiceIdForOArm(serviceId)); } catch { return false; } } },
    ];
    const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
    return results.filter((r) => !r.saved).map((r) => r.name);
  };

  const handleSaveHeader = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (minIssueDate && formData.issueDate && formData.issueDate < minIssueDate) {
        toast.error("Issue date must be equal to or greater than the QA test submitted date.");
        setSaving(false);
        return;
      }
      const unsaved = await getUnsavedTestNames();
      if (unsaved.length > 0) {
        const message =
          unsaved.length === 1
            ? `${unsaved[0]} table is not saved. Please fill and save this test table before saving the report header.`
            : `You must fill and save all test tables before saving the report header. Missing: ${unsaved.join(", ")}.`;
        setSaveError(message);
        toast.error(message, { duration: 5000 });
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        machineType: "O-Arm",
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

  const handleExportToExcel = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }
    try {
      toast.loading("Exporting data to Excel...", { id: "export-excel-oarm" });
      setCsvUploading(true);
      const exportData: Record<string, unknown> = {};
      try {
        const headerRes = await getReportHeaderForOArm(serviceId);
        if (headerRes?.exists && headerRes?.data) exportData.reportHeader = headerRes;
      } catch (err) {
        console.log("O-Arm report header not found or error:", err);
      }
      try {
        const res = await getTotalFilterationByServiceIdForOArm(serviceId);
        if (res) exportData.totalFiltration = res;
      } catch (err) {
        console.log("Total Filtration not found or error:", err);
      }
      try {
        const res = await getOutputConsistencyByServiceIdForOArm(serviceId);
        if (res) exportData.outputConsistency = res;
      } catch (err) {
        console.log("Output Consistency not found or error:", err);
      }
      try {
        const res = await getHighContrastResolutionByServiceIdForOArm(serviceId);
        if (res) exportData.highContrastResolution = res;
      } catch (err) {
        console.log("High Contrast Resolution not found or error:", err);
      }
      try {
        const res = await getLowContrastResolutionByServiceIdForOArm(serviceId);
        if (res) exportData.lowContrastResolution = res;
      } catch (err) {
        console.log("Low Contrast Resolution not found or error:", err);
      }
      try {
        const res = await getExposureRateByServiceIdForOArm(serviceId);
        if (res) exportData.exposureRateAtTableTop = res;
      } catch (err) {
        console.log("Exposure Rate not found or error:", err);
      }
      try {
        const res = await getTubeHousingLeakageByServiceIdForOArm(serviceId);
        if (res) exportData.tubeHousingLeakage = res;
      } catch (err) {
        console.log("Tube Housing Leakage not found or error:", err);
      }
      try {
        const res = await getLinearityOfMasLoadingStationByServiceIdForOArm(serviceId);
        if (res) exportData.linearityOfMasLoading = res;
      } catch (err) {
        console.log("Linearity of mAs Loading not found or error:", err);
      }
      if (Object.keys(exportData).length <= 1 && !exportData.reportHeader) {
        toast.error("No data found to export. Please save test data first.", { id: "export-excel-oarm" });
        return;
      }
      const wb = createOArmUploadableExcel(exportData as OArmExportData);
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `O-Arm_Test_Data_${timestamp}.xlsx`);
      toast.success("Data exported successfully!", { id: "export-excel-oarm" });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data: " + (error?.message || "Unknown error"), { id: "export-excel-oarm" });
    } finally {
      setCsvUploading(false);
    }
  };

  // ── CSV/Excel Parsing Infrastructure ─────────────────────────────────────
  const parseHorizontalData = (rows: any[][]): any[] => {
    const data: any[] = [];
    let currentTestName = '';
    let currentTestNameBase = '';
    let headers: string[] = [];
    let isReadingTest = false;

    const testMarkerToInternalName: { [key: string]: string } = {
      'TOTAL FILTRATION': 'Total Filtration',
      'OUTPUT CONSISTENCY': 'Output Consistency',
      'HIGH CONTRAST RESOLUTION': 'High Contrast Resolution',
      'LOW CONTRAST RESOLUTION': 'Low Contrast Resolution',
      'EXPOSURE RATE AT TABLE TOP': 'Exposure Rate At Table Top',
      'TUBE HOUSING LEAKAGE': 'Tube Housing Leakage',
      'LINEARITY OF MAS LOADING': 'Linearity of mAs Loading',
      'ACCURACY OF IRRADIATION TIME': 'Accuracy of Irradiation Time',
    };
    const markerUpperToInternal: Record<string, string> = Object.fromEntries(
      Object.entries(testMarkerToInternalName).map(([k, v]) => [String(k).trim().toUpperCase(), v])
    );

    const headerMap: { [test: string]: { [header: string]: string } } = {
      'Total Filtration': {
        'Applied KVp': 'Table2_AppliedKvp',
        'Meas 1': 'Table2_Meas_0', 'Meas 2': 'Table2_Meas_1', 'Meas 3': 'Table2_Meas_2',
        'Meas 4': 'Table2_Meas_3', 'Meas 5': 'Table2_Meas_4',
      },
      'Output Consistency': {
        'FFD': 'Param_FFD', 'Time': 'Param_Time',
        'kVp': 'Row_kvp', 'mA': 'Row_ma',
        'Meas 1': 'Row_Output_0', 'Meas 2': 'Row_Output_1', 'Meas 3': 'Row_Output_2',
        'Meas 4': 'Row_Output_3', 'Meas 5': 'Row_Output_4',
      },
      'High Contrast Resolution': {
        'Measured lp/mm': 'MeasuredLpPerMm', 'Recommended Standard': 'RecommendedStandard',
      },
      'Low Contrast Resolution': {
        'Smallest Hole Size': 'SmallestHoleSize', 'Recommended Standard': 'RecommendedStandard',
      },
      'Exposure Rate At Table Top': {
        'Distance': 'Row_Distance', 'Applied kV': 'Row_AppliedKv', 'Applied mA': 'Row_AppliedMa',
        'Exposure': 'Row_Exposure', 'Mode': 'Row_Mode',
      },
      'Tube Housing Leakage': {
        'FCD': 'Settings_FCD', 'kV': 'Settings_KV', 'mA': 'Settings_MA', 'Time': 'Settings_Time',
        'Workload': 'Workload',
        'Location': 'Leakage_Location', 'Left': 'Leakage_Left', 'Right': 'Leakage_Right',
        'Front': 'Leakage_Front', 'Back': 'Leakage_Back', 'Top': 'Leakage_Top',
      },
      'Linearity of mAs Loading': {
        'FCD': 'Exposure_FCD', 'kV': 'Exposure_KV',
        'mAs Range': 'Row_mAsRange',
        'Meas 1': 'Row_Meas_0', 'Meas 2': 'Row_Meas_1', 'Meas 3': 'Row_Meas_2',
        'Meas 4': 'Row_Meas_3', 'Meas 5': 'Row_Meas_4',
      },
      'Accuracy of Irradiation Time': {
        'FCD': 'Table1_fcd', 'kV': 'Table1_kv', 'mA': 'Table1_ma',
        'Set Time (ms)': 'Table2_setTime', 'Measured Time (ms)': 'Table2_measuredTime',
        'Tolerance': 'Tolerance_Value', 'Tolerance Operator': 'Tolerance_Operator',
      },
    };

    const sectionRowCounter: { [key: string]: number } = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].map(c => String(c || '').trim());
      const firstCell = row[0];

      if (firstCell.startsWith('TEST: ')) {
        const rawTitle = firstCell.replace('TEST: ', '').trim();
        const rawUpper = rawTitle.toUpperCase();
        const internalBase = markerUpperToInternal[rawUpper] || '';
        currentTestNameBase = internalBase;
        currentTestName = internalBase;
        isReadingTest = true;
        headers = [];
        if (currentTestName) sectionRowCounter[currentTestName] = 0;
        continue;
      }

      if (isReadingTest && headers.length === 0 && row.some(c => c)) {
        headers = row;
        continue;
      }

      if (isReadingTest && row.every(c => !c)) {
        isReadingTest = false;
        continue;
      }

      if (isReadingTest && currentTestName && currentTestNameBase && headers.length > 0) {
        sectionRowCounter[currentTestName] = (sectionRowCounter[currentTestName] || 0) + 1;
        const rowIdx = sectionRowCounter[currentTestName];
        row.forEach((value, cellIdx) => {
          const header = headers[cellIdx];
          const internalField = (headerMap[currentTestNameBase] || {})[header];
          if (internalField && value) {
            data.push({
              'Field Name': internalField,
              'Value': value,
              'Row Index': rowIdx,
              'Test Name': currentTestName,
            });
          }
        });
      }
    }
    return data;
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').map(line => line.split(',').map(c => c.trim()));
    return parseHorizontalData(lines);
  };

  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    return parseHorizontalData(jsonData);
  };

  // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer hasTimer from Excel and skip timer modal.
  const processCSVData = async (csvData: any[], applyConfigFromExcel?: boolean) => {
    try {
      setCsvUploading(true);
      const groupedData: { [key: string]: any[] } = {};
      csvData.forEach((row) => {
        const testName = row['Test Name'];
        if (testName && testName.trim()) {
          if (!groupedData[testName]) groupedData[testName] = [];
          groupedData[testName].push(row);
        }
      });
      console.log('O-Arm CSV Data grouped:', groupedData);

      if (applyConfigFromExcel && Object.keys(groupedData).length > 0) {
        const hasTimerSection = !!(groupedData['Accuracy of Irradiation Time']?.length);
        setHasTimer(hasTimerSection);
        setShowTimerModal(false);
        if (serviceId) {
          localStorage.setItem(`oarm_timer_choice_${serviceId}`, JSON.stringify(hasTimerSection));
        }
      }

      setCsvDataForComponents(groupedData);
      setCsvDataVersion(prev => prev + 1);
      setRefreshKey(prev => prev + 1);
      toast.success('CSV data loaded successfully!');
    } catch (error: any) {
      console.error('Error processing CSV data:', error);
      toast.error('Failed to process CSV data: ' + (error.message || 'Unknown error'));
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');
    if (!isExcel && !isCSV) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }
    try {
      setCsvUploading(true);
      toast.loading('Processing file...', { id: 'csv-upload' });
      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const csvData = parseExcelToCSVFormat(workbook);
        await processCSVData(csvData);
      } else {
        const text = await file.text();
        const csvData = parseCSV(text);
        await processCSVData(csvData);
      }
      toast.success('File uploaded successfully!', { id: 'csv-upload' });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file: ' + (error.message || 'Unknown error'), { id: 'csv-upload' });
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Fetch and process CSV/Excel file from URL (passed from ServiceDetails2)
  useEffect(() => {
    const fetchAndProcessFile = async () => {
      if (!csvFileUrl) return;
      console.log('O-Arm: Fetching file from URL:', csvFileUrl);
      try {
        setCsvUploading(true);
        const urlLower = csvFileUrl.toLowerCase();
        const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');
        let csvData: any[] = [];
        if (isExcel) {
          toast.loading('Loading Excel data from file...', { id: 'csv-loading' });
          const response = await proxyFile(csvFileUrl);
          const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          csvData = parseExcelToCSVFormat(workbook);
        } else {
          toast.loading('Loading CSV data from file...', { id: 'csv-loading' });
          const response = await proxyFile(csvFileUrl);
          const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
          const text = await blob.text();
          csvData = parseCSV(text);
        }
        await processCSVData(csvData, true);
        toast.success('File loaded successfully!', { id: 'csv-loading' });
      } catch (error: any) {
        console.error('O-Arm: Error fetching/processing file:', error);
        toast.error('Failed to load file: ' + (error.message || 'Unknown error'), { id: 'csv-loading' });
      } finally {
        setCsvUploading(false);
      }
    };
    fetchAndProcessFile();
  }, [csvFileUrl]);
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
            Does this O-Arm unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
          </p>
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => handleTimerChoice(true)}
              className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition"
            >
              Yes, Has Timer
            </button>
            <button
              onClick={() => handleTimerChoice(false)}
              className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 transition"
            >
              No Timer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (csvFileUrl && hasTimer === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">
          Loading Excel data and configuring report...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Generate QA Test Report - O-Arm
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
              SRF Date
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
            <input type="date" name="issueDate" value={formData.issueDate} min={minIssueDate || undefined} onChange={handleInputChange} className="border p-2 rounded-md w-full" title={minIssueDate ? `Must be on or after QA test date (${minIssueDate})` : undefined} />
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

      {/* CSV/Excel Upload Section */}
      <section className="mb-10 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Upload Test Data (CSV/Excel)</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload-input-oarm"
            />
            <label
              htmlFor="csv-upload-input-oarm"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              {csvUploading ? 'Uploading...' : 'Upload CSV/Excel File'}
            </label>
            {/* <a
              href="/templates/OArm_Test_Data_Template.csv"
              download
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Download Template
            </a> */}
          </div>
          {csvFileUrl && (
            <p className="text-sm text-gray-600">
              File loaded from: <span className="font-mono text-xs">{csvFileUrl}</span>
            </p>
          )}
        </div>
      </section>

      <Standards standards={tools} />
      <Notes />

      {/* Save Header, Export Excel, and View Report Buttons */}
      <div className="mt-8 flex flex-wrap justify-end gap-4 items-center">
        <button
          type="button"
          onClick={handleExportToExcel}
          disabled={csvUploading}
          className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 text-sm font-medium disabled:opacity-50"
        >
          {csvUploading ? "Exporting..." : "Export Excel"}
        </button>
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
          onClick={async () => {
            const unsaved = await getUnsavedTestNames();
            if (unsaved.length > 0) {
              const message =
                unsaved.length === 1
                  ? `${unsaved[0]} table is not saved. Please fill and save this test table before viewing the report.`
                  : `You must fill and save all test tables before viewing the report. Missing: ${unsaved.join(", ")}.`;
              toast.error(message, { duration: 5000 });
              return;
            }
            navigate(`/admin/orders/view-service-report-o-arm?serviceId=${serviceId}`);
          }}
        >
          View Generated Report
        </button>
      </div>

      {/* QA Tests */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>

        {[
          ...(hasTimer ? [{ title: "Accuracy of Irradiation Time", component: <AccuracyOfIrradiationTimeOArm serviceId={serviceId} csvData={csvDataForComponents['Accuracy of Irradiation Time']} /> }] : []),
          { title: "Total Filteration", component: <TotalFilteration serviceId={serviceId} csvData={csvDataForComponents['Total Filtration']} /> },
          { title: "Consistency Of Radiation Output", component: <OutputConsisitency serviceId={serviceId} csvData={csvDataForComponents['Output Consistency']} /> },
          { title: "High Contrast Resolution", component: <HighContrastResolution serviceId={serviceId} csvData={csvDataForComponents['High Contrast Resolution']} /> },
          { title: "Low Contrast Resolution", component: <LowContrastResolution serviceId={serviceId} csvData={csvDataForComponents['Low Contrast Resolution']} /> },
          { title: "Exposure Rate At Table Top", component: <ExposureRateAtTableTop serviceId={serviceId} csvData={csvDataForComponents['Exposure Rate At Table Top']} /> },
          { title: "Tube Housing Leakage", component: <TubeHousingLeakage serviceId={serviceId} csvData={csvDataForComponents['Tube Housing Leakage']} /> },
          { title: "Linearity Of mAs Loading", component: <LinearityOfMasLoadingStations serviceId={serviceId} csvData={csvDataForComponents['Linearity of mAs Loading']} /> },
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

export default OArm;
