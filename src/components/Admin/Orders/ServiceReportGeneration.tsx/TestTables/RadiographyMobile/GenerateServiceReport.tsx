// GenerateServiceReport.tsx for RadiographyMobile
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  getDetails,
  getTools,
  saveReportHeader,
  getReportHeaderForRadiographyMobile,
  proxyFile,
  getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobile,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile,
  getCentralBeamAlignmentByServiceIdForRadiographyMobile,
  getCongruenceByServiceIdForRadiographyMobile,
  getEffectiveFocalSpotByServiceIdForRadiographyMobile,
  getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobile,
  getConsistencyOfRadiationOutputByServiceIdForRadiographyMobile,
  getRadiationLeakageLevelByServiceIdForRadiographyMobile,
} from "../../../../../../api";
import { createRadiographyMobileUploadableExcel, RadiographyMobileExportData } from "./exportRadiographyMobileToExcel";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import CongruenceOfRadiation from "./CongruenceOfRadiation";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalSpot from "./EffectiveFocalSpot";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import LinearityOfMasLoadingStations from "./LinearityOfMasLoadingStations";
import ConsistencyOfRadiationOutput from "./ConsisitencyOfRadiationOutput";
import RadiationLeakageLevel from "./RadiationLeakageLevel";

interface Standard {
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
  engineerAssigned: { name: string };
  qaTests: Array<{ createdAt: string; qaTestReportNumber: string }>;
}

const RadiographyMobile: React.FC<{ serviceId: string; qaTestDate?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, csvFileUrl }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);

  const [excelUploading, setExcelUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // CSV data state to pass to each test component (pre-fills form from Excel upload)
  const [csvDataForComponents, setCsvDataForComponents] = useState<{
    accuracyOfOperatingPotential?: any;
    accuracyOfIrradiationTime?: any;
    outputConsistency?: any;
    centralBeamAlignment?: any;
    congruenceOfRadiation?: any;
    effectiveFocalSpot?: any;
    linearityOfMasLoading?: any;
    radiationLeakageLevel?: any;
  }>({});

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
    condition: "OK",
    testingProcedureNumber: "",
    pages: "",
    testDate: "",
    testDueDate: "",
    location: "",
    temperature: "",
    humidity: "",
    engineerNameRPId: "",
    category: "",
  });


  const [minIssueDate, setMinIssueDate] = useState(""); // QA test submitted date (YYYY-MM-DD); issue date must be >= this
  const defaultNotes = [
    "The Test Report relates only to the above item only.",
    "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL.",
    "Corrections/erasing invalidates the Test Report.",
    "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats.",
    "Any error in this Report should be brought to our knowledge within 30 days from the date of this report.",
    "Results reported are valid at the time of and under the stated conditions of measurements.",
    "Name, Address & Contact detail is provided by Customer.",
  ];
  const [notes, setNotes] = useState<string[]>(defaultNotes);

  // ── Handle csvFileUrl from prop (when status is complete / Generate Report from ServiceDetails2) ──
  // Uses proxyFile so the request is authenticated and avoids CORS/401 redirect to login
  useEffect(() => {
    const handleUrlUpload = async () => {
      if (!csvFileUrl) return;

      try {
        setExcelUploading(true);
        toast.loading("Loading Excel data from file...", { id: "excel-url-load" });
        const response = await proxyFile(csvFileUrl);
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const csvData = parseExcelToCSVFormat(workbook);
        await processExcelData(csvData, true);
        toast.success("Excel data loaded from file", { id: "excel-url-load" });
      } catch (err: any) {
        console.error("URL Excel upload error:", err);
        toast.error(err?.message || "Failed to load Excel from URL", { id: "excel-url-load" });
      } finally {
        setExcelUploading(false);
      }
    };

    handleUrlUpload();
  }, [csvFileUrl]);

  // ── Timer preference ──────────────────────────────────────────────────────
  // When csvFileUrl is provided (redirect from ServiceDetails2), skip modal — config will be set from Excel in processExcelData.
  useEffect(() => {
    if (!serviceId) return;
    if (csvFileUrl) {
      setShowTimerModal(false);
      return;
    }
    const stored = localStorage.getItem(`radiography-mobile-timer-${serviceId}`);
    if (stored !== null) {
      setHasTimer(stored === "true");
      setShowTimerModal(false);
    } else {
      setShowTimerModal(true);
    }
  }, [serviceId, csvFileUrl]);

  const handleTimerChoice = (choice: boolean) => {
    setHasTimer(choice);
    setShowTimerModal(false);
    if (serviceId) {
      localStorage.setItem(`radiography-mobile-timer-${serviceId}`, String(choice));
    }
  };

  // ── Load service details ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!serviceId) return;
      try {
        setLoading(true);
        const [detailsRes, toolsRes] = await Promise.all([
          getDetails(serviceId),
          getTools(serviceId),
        ]);

        const data = detailsRes.data;
        const firstTest = data.qaTests?.[0];
        setDetails(data);

        const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
        const testDateSource = firstTest?.qatestSubmittedAt || firstTest?.createdAt;
        let testDate = "";
        let testDueDate = "";
        if (testDateSource) {
          const qaDate = new Date(testDateSource);
          testDate = qaDate.toISOString().split("T")[0];
          const due = new Date(qaDate);
          due.setFullYear(due.getFullYear() + 2);
          testDueDate = due.toISOString().split("T")[0];
        }

        setMinIssueDate(testDate || "");
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
          condition: "OK",
          testingProcedureNumber: "",
          pages: "",
          testDate,
          testDueDate,
          location: "",
          temperature: "",
          humidity: "",
          engineerNameRPId: data.engineerAssigned?.name || "",
          category: data.category || "",
        });

        const mappedTools: Standard[] = toolsRes.data.toolsAssigned.map((t: any, i: number) => ({
          slNumber: String(i + 1),
          nomenclature: t.nomenclature,
          make: t.manufacturer || t.make,
          model: t.model,
          SrNo: t.SrNo,
          range: t.range,
          certificate: t.certificate || null,
          calibrationCertificateNo: t.calibrationCertificateNo,
          calibrationValidTill: t.calibrationValidTill.split("T")[0],
          uncertainity: "",
        }));
        setTools(mappedTools);
      } catch (err: any) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [serviceId]);

  // ── Load saved report header ──────────────────────────────────────────────
  useEffect(() => {
    const loadReportHeader = async () => {
      if (!serviceId) return;
      try {
        const res = await getReportHeaderForRadiographyMobile(serviceId);
        if (res?.exists && res?.data) {
          setFormData(prev => ({
            ...prev,
            customerName: res.data.customerName || prev.customerName,
            address: res.data.address || prev.address,
            srfNumber: res.data.srfNumber || prev.srfNumber,
            category: res.data.category || prev.category,
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
          if (res.data.notes && Array.isArray(res.data.notes) && res.data.notes.length > 0) {
            setNotes(res.data.notes.map((n: any) => n.text || n));
          } else {
            setNotes(defaultNotes);
          }
        }
      } catch (err) {
        console.log("No report header found:", err);
      }
    };
    loadReportHeader();
  }, [serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check which test tables are not saved; returns list of display names (mirrors RadiographyFixed).
  const getUnsavedTestNames = async (): Promise<string[]> => {
    const isSaved = (raw: any): boolean => {
      if (raw == null) return false;
      if (typeof raw !== "object") return false;
      if (raw.success && raw.data != null) return true;
      if (raw.data && typeof raw.data === "object" && (raw.data as any)._id) return true;
      const data = raw.data !== undefined ? raw.data : raw;
      if (data == null || typeof data !== "object") return false;
      if ((data as any)._id) return true;
      if ((data as any).data && (data as any).data._id) return true;
      if (Array.isArray((data as any).table2) && (data as any).table2.length > 0) return true;
      if (Array.isArray((data as any).measurements) && (data as any).measurements.length > 0) return true;
      return false;
    };
    const checks: { name: string; check: () => Promise<boolean> }[] = [
      { name: "Congruence of Radiation & Optical Field", check: async () => { try { return isSaved(await getCongruenceByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
      { name: "Central Beam Alignment", check: async () => { try { return isSaved(await getCentralBeamAlignmentByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
      { name: "Effective Focal Spot Measurement", check: async () => { try { return isSaved(await getEffectiveFocalSpotByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
      { name: "Accuracy Of Operating Potential", check: async () => { try { return isSaved(await getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
      { name: "Linearity Of mAs Loading Stations", check: async () => { try { return isSaved(await getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
      { name: "Output Consistency", check: async () => { try { return isSaved(await getConsistencyOfRadiationOutputByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
      { name: "Tube Housing Leakage", check: async () => { try { return isSaved(await getRadiationLeakageLevelByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } } },
    ];
    if (hasTimer === true) {
      checks.push({
        name: "Accuracy Of Irradiation Time",
        check: async () => { try { return isSaved(await getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobile(serviceId)); } catch { return false; } },
      });
    }
    const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
    return results.filter((r) => !r.saved).map((r) => r.name);
  };

  // ── Save header (only after all test tables are saved) ─────────────────────
  const handleSaveHeader = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      if (minIssueDate && formData.issueDate && formData.issueDate < minIssueDate) {
        const msg = "Issue date must be equal to or greater than the QA test submitted date.";
        setSaveError(msg);
        toast.error(msg);
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
        toolsUsed: tools.map(t => ({
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
        notes: notes.length > 0
          ? notes.map((note, index) => ({ slNo: `5.${index + 1}`, text: note }))
          : defaultNotes.map((text, i) => ({ slNo: `5.${i + 1}`, text })),
      };
      await saveReportHeader(serviceId, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to save report header");
    } finally {
      setSaving(false);
    }
  };

  // ── Excel section-to-test mapping ─────────────────────────────────────────
  const SECTION_MAP: Record<string, string> = {
    "========== ACCURACY OF OPERATING POTENTIAL (kVp) ==========": "Accuracy of Operating Potential",
    "========== ACCURACY OF IRRADIATION TIME ==========": "Accuracy of Irradiation Time",
    "========== OUTPUT CONSISTENCY ==========": "Output Consistency",
    "========== CENTRAL BEAM ALIGNMENT ==========": "Central Beam Alignment",
    "========== CONGRUENCE OF RADIATION ==========": "Congruence of Radiation",
    "========== EFFECTIVE FOCAL SPOT ==========": "Effective Focal Spot",
    "========== LINEARITY OF mAs LOADING STATIONS ==========": "Linearity of mAs Loading Stations",
    "========== RADIATION LEAKAGE LEVEL ==========": "Radiation Leakage Level",
  };

  const ROW_START_FIELDS = [
    "Measurement_AppliedKvp",
    "IrradiationTime_SetTime",
    "OutputRow_kV",
    "CongruenceMeasurement_Dimension",
    "FocalSpot_FocusType",
    "Table2_mAsApplied",
    "LeakageMeasurement_Location",
  ];

  // Parse CTScan-style horizontal format: "TEST: Section" then header row then data rows.
  // Outputs same row shape used by processExcelData: Field Name / Value / Row Index / Test Name.
  const parseHorizontalData = (rows: any[][]): any[] => {
    const out: any[] = [];
    let currentTestName = "";
    let headers: string[] = [];
    let isReading = false;
    const sectionRowCounter: Record<string, number> = {};

    const markerUpperToInternal: Record<string, string> = {
      "ACCURACY OF OPERATING POTENTIAL": "Accuracy of Operating Potential",
      "ACCURACY OF IRRADIATION TIME": "Accuracy of Irradiation Time",
      "OUTPUT CONSISTENCY": "Output Consistency",
      "CENTRAL BEAM ALIGNMENT": "Central Beam Alignment",
      "CONGRUENCE OF RADIATION": "Congruence of Radiation",
      "EFFECTIVE FOCAL SPOT": "Effective Focal Spot",
      "LINEARITY OF MAS LOADING STATIONS": "Linearity of mAs Loading Stations",
      "RADIATION LEAKAGE LEVEL": "Radiation Leakage Level",
      "TUBE HOUSING LEAKAGE": "Radiation Leakage Level",
    };

    const headerMap: Record<string, Record<string, string>> = {
      "Accuracy of Operating Potential": {
        "mA Station": "MeasHeader",
        "Applied kV": "Measurement_AppliedKvp",
        "Meas 1": "Measurement_Meas1",
        "Meas 2": "Measurement_Meas2",
        "Meas 3": "Measurement_Meas3",
        "Tolerance Sign": "Tolerance_Sign",
        "Tolerance Value": "Tolerance_Value",
        "TF Measured": "TotalFiltration_Measured",
        "TF Required": "TotalFiltration_Required",
      },
      "Accuracy of Irradiation Time": {
        "FCD": "TestConditions_FCD",
        "kV": "TestConditions_kV",
        "mA": "TestConditions_ma",
        "Set Time (ms)": "IrradiationTime_SetTime",
        "Measured Time (ms)": "IrradiationTime_MeasuredTime",
        "Tolerance Operator": "Tolerance_Operator",
        "Tolerance Value": "Tolerance_Value",
      },
      "Output Consistency": {
        "FFD": "FFD",
        "Tol Operator": "Tolerance_Operator",
        "Tol Value": "Tolerance_Value",
        "kV": "OutputRow_kV",
        "mAs": "OutputRow_mAs",
        "Meas 1": "OutputRow_Meas1",
        "Meas 2": "OutputRow_Meas2",
        "Meas 3": "OutputRow_Meas3",
        "Meas 4": "OutputRow_Meas4",
        "Meas 5": "OutputRow_Meas5",
      },
      "Central Beam Alignment": {
        "FCD": "TechniqueFactors_FCD",
        "kV": "TechniqueFactors_kV",
        "mAs": "TechniqueFactors_mAs",
        "Observed Tilt": "ObservedTilt_Value",
        "Tolerance": "Tolerance_Value",
      },
      "Congruence of Radiation": {
        "FCD": "TechniqueFactors_FCD",
        "kV": "TechniqueFactors_kV",
        "mAs": "TechniqueFactors_mAs",
        "Dimension": "CongruenceMeasurement_Dimension",
        "Observed Shift": "CongruenceMeasurement_ObservedShift",
        "Edge Shift": "CongruenceMeasurement_EdgeShift",
        "% FED": "CongruenceMeasurement_PercentFED",
        "Tolerance": "CongruenceMeasurement_Tolerance",
      },
      "Effective Focal Spot": {
        "FCD": "FCD",
        "Focus Type": "FocalSpot_FocusType",
        "Stated Width": "FocalSpot_StatedWidth",
        "Stated Height": "FocalSpot_StatedHeight",
        "Stated Nominal": "FocalSpot_StatedNominal",
        "Stated Focal Spot of Tube (f)": "FocalSpot_StatedNominal",
        "Measured Width": "FocalSpot_MeasuredWidth",
        "Measured Height": "FocalSpot_MeasuredHeight",
        "Measured Nominal": "FocalSpot_MeasuredNominal",
        "Measured Focal Spot (Nominal)": "FocalSpot_MeasuredNominal",
      },
      "Linearity of mAs Loading Stations": {
        "FCD": "Table1_FCD",
        "kV": "Table1_kV",
        "mAs Applied": "Table2_mAsApplied",
        "Meas 1": "Table2_Meas1",
        "Meas 2": "Table2_Meas2",
        "Meas 3": "Table2_Meas3",
        "Tolerance Operator": "ToleranceOperator",
        "Tolerance": "Tolerance",
      },
      "Radiation Leakage Level": {
        "FCD": "Settings_FCD",
        "kV": "Settings_kV",
        "mA": "Settings_ma",
        "Time": "Settings_Time",
        "Workload": "Workload",
        "Tol Value": "ToleranceValue",
        "Tol Operator": "ToleranceOperator",
        "Location": "LeakageMeasurement_Location",
        "Left": "LeakageMeasurement_Left",
        "Right": "LeakageMeasurement_Right",
        "Front": "LeakageMeasurement_Front",
        "Back": "LeakageMeasurement_Back",
        "Top": "LeakageMeasurement_Top",
      },
    };

    for (let i = 0; i < rows.length; i++) {
      const row = (rows[i] || []).map((c: any) => String(c ?? "").trim());
      const first = row[0] || "";

      if (/^TEST:\s*/i.test(first)) {
        const rawTitle = first.replace(/^TEST:\s*/i, "").trim();
        const internal = markerUpperToInternal[rawTitle.toUpperCase()] || "";
        currentTestName = internal;
        isReading = !!internal;
        headers = [];
        if (currentTestName) sectionRowCounter[currentTestName] = 0;
        continue;
      }

      if (isReading && headers.length === 0 && row.some((c) => c !== "")) {
        headers = row;
        continue;
      }

      if (isReading && row.every((c) => c === "")) {
        isReading = false;
        continue;
      }

      if (isReading && currentTestName && headers.length > 0) {
        const map = headerMap[currentTestName];
        if (!map) continue;
        const rowIdx = sectionRowCounter[currentTestName] ?? 0;
        sectionRowCounter[currentTestName] = rowIdx + 1;

        row.forEach((value, cellIdx) => {
          const header = (headers[cellIdx] || "").trim();
          const internalField = map[header];
          if (internalField && value !== "") {
            out.push({
              "Field Name": internalField,
              "Value": value,
              "Row Index": String(rowIdx),
              "Test Name": currentTestName,
            });
          }
        });
      }
    }

    return out;
  };

  // Convert parsed Excel workbook to the Field Name / Value / Row Index / Test Name format
  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const data: any[] = [];
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    if (jsonData.length === 0) return data;

    // If file looks like CTScan-style horizontal template, parse that.
    const firstNonEmpty = jsonData.find((r) => Array.isArray(r) && String(r[0] ?? "").trim() !== "");
    if (firstNonEmpty && /^TEST:\s*/i.test(String(firstNonEmpty[0] ?? "").trim())) {
      return parseHorizontalData(jsonData);
    }

    // Find "Field Name" / "Value" header columns (strip BOM and allow extra columns e.g. "Description")
    let headerRowIndex = -1, fieldNameCol = -1, valueCol = -1;
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row || !Array.isArray(row)) continue;
      for (let j = 0; j < row.length; j++) {
        const raw = String(row[j] ?? "").replace(/^\uFEFF/, "");
        const cell = raw.trim().toLowerCase();
        if (cell === "field name" || cell === "fieldname") { headerRowIndex = i; fieldNameCol = j; }
        else if (cell === "value") { valueCol = j; }
      }
      if (headerRowIndex !== -1 && valueCol !== -1) break;
    }
    if (headerRowIndex === -1) { headerRowIndex = 0; fieldNameCol = 0; valueCol = 1; }
    if (valueCol === -1 && fieldNameCol >= 0) valueCol = fieldNameCol + 1; // assume Value is next column

    let currentTestName = "";
    const rowIndexCounter: Record<string, number> = {};
    const lastRowStartField: Record<string, string> = {};

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !Array.isArray(row)) continue;
      const fieldName = String(row[fieldNameCol] ?? "").trim();
      const value = String(row[valueCol] ?? "").trim();

      if (!fieldName) continue;

      const trimmedFieldName = fieldName.trim();
      if ((trimmedFieldName.startsWith("=") && trimmedFieldName.endsWith("=")) || (trimmedFieldName.startsWith("-") && trimmedFieldName.endsWith("-"))) {
        // More robust section matching: extract text between equal/dash signs
        const sectionText = trimmedFieldName.replace(/[=-]/g, "").trim().toUpperCase();

        // Find match in SECTION_MAP by checking if its values or keys resemble the cleaned sectionText
        const match = Object.entries(SECTION_MAP).find(([key, _standardLabel]) => {
          const cleanKey = key.replace(/[=-]/g, "").trim().toUpperCase();
          return sectionText.includes(cleanKey) || cleanKey.includes(sectionText);
        });

        if (match) {
          currentTestName = match[1];
          rowIndexCounter[currentTestName] = 0;
          lastRowStartField[currentTestName] = "";
        }
        continue;
      }
      if (fieldName.startsWith("---")) continue;

      const isKnownField = fieldName.match(
        /^(Measurement|IrradiationTime|OutputRow|CongruenceMeasurement|FocalSpot|Table1|Table2|LeakageMeasurement|MeasHeader|Tolerance|TechniqueFactors|ObservedTilt|FCD|FFD|TestConditions|Settings|Workload|ToleranceValue|ToleranceOperator|TotalFiltration)/
      );
      if (!isKnownField) continue;

      if (currentTestName) {
        const isRowStart = ROW_START_FIELDS.includes(fieldName);
        if (isRowStart) {
          const last = lastRowStartField[currentTestName];
          if (last === undefined || last === "") {
            rowIndexCounter[currentTestName] = 0;
            lastRowStartField[currentTestName] = value;
          } else if (last !== value) {
            rowIndexCounter[currentTestName] = (rowIndexCounter[currentTestName] || 0) + 1;
            lastRowStartField[currentTestName] = value;
          }
        } else {
          if (rowIndexCounter[currentTestName] === undefined) rowIndexCounter[currentTestName] = 0;
        }
        data.push({
          "Field Name": fieldName,
          "Value": value,
          "Row Index": String(rowIndexCounter[currentTestName] || 0),
          "Test Name": currentTestName,
        });
      }
    }
    return data;
  };

  // Parse Dental-style table CSV (RadiographyMobile_Timer_Template.csv) into the same
  // internal "Field Name"/"Value"/"Row Index"/"Test Name" rows used by processExcelData.
  const parseTableCSVToRows = (text: string): any[] => {
    const lines = text.split(/\r?\n/);
    const rows: any[] = [];

    const pushRow = (testName: string, fieldName: string, value: string, rowIndex: number) => {
      rows.push({
        "Field Name": fieldName,
        "Value": value,
        "Row Index": String(Number.isFinite(rowIndex) ? rowIndex : 0),
        "Test Name": testName,
      });
    };

    let i = 0;
    while (i < lines.length) {
      const raw = lines[i].trim();
      if (!raw) { i++; continue; }

      if (raw.startsWith("TEST:")) {
        const label = raw.slice(5).trim();

        // 1) Accuracy of Operating Potential (kVp)
        if (label.startsWith("ACCURACY OF OPERATING POTENTIAL")) {
          const testName = "Accuracy of Operating Potential";
          const tolSign = (lines[i + 1] || "").split(",")[1] || "";
          const tolVal = (lines[i + 2] || "").split(",")[1] || "";
          const tfMeasured = (lines[i + 3] || "").split(",")[1] || "";
          const tfRequired = (lines[i + 4] || "").split(",")[1] || "";
          const header = (lines[i + 5] || "").split(",");

          if (tolSign) pushRow(testName, "Tolerance_Sign", tolSign, 0);
          if (tolVal) pushRow(testName, "Tolerance_Value", tolVal, 0);
          if (tfMeasured) pushRow(testName, "TotalFiltration_Measured", tfMeasured, 0);
          if (tfRequired) pushRow(testName, "TotalFiltration_Required", tfRequired, 0);

          // mA stations from header, starting at column 2
          for (let c = 1; c < header.length; c++) {
            const h = (header[c] || "").trim();
            if (h) pushRow(testName, "MeasHeader", h, 0);
          }

          // measurement rows start at i+6 until blank line or next TEST
          let rowIdx = 0;
          let j = i + 6;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const kv = (cells[0] || "").trim();
            if (kv) {
              pushRow(testName, "Measurement_AppliedKvp", kv, rowIdx);
              if (cells[1] !== undefined && cells[1] !== "") pushRow(testName, "Measurement_Meas1", cells[1], rowIdx);
              if (cells[2] !== undefined && cells[2] !== "") pushRow(testName, "Measurement_Meas2", cells[2], rowIdx);
              rowIdx++;
            }
            j++;
          }
          i = j;
          continue;
        }

        // 2) Accuracy of Irradiation Time
        if (label === "ACCURACY OF IRRADIATION TIME") {
          const testName = "Accuracy of Irradiation Time";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const ma = cond[5] || "";
          if (fcd) pushRow(testName, "TestConditions_FCD", fcd, 0);
          if (kv) pushRow(testName, "TestConditions_kV", kv, 0);
          if (ma) pushRow(testName, "TestConditions_ma", ma, 0);

          // time rows start at i+3 until we hit tolerance line or blank
          let rowIdx = 0;
          let j = i + 3;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l) break;
            if (l.startsWith("Tolerance")) break;
            const cells = l.split(",");
            const setT = (cells[0] || "").trim();
            const measT = (cells[1] || "").trim();
            if (setT || measT) {
              if (setT) pushRow(testName, "IrradiationTime_SetTime", setT, rowIdx);
              if (measT) pushRow(testName, "IrradiationTime_MeasuredTime", measT, rowIdx);
              rowIdx++;
            }
            j++;
          }
          // tolerance lines (if present)
          for (; j < Math.min(lines.length, i + 8); j++) {
            const l = lines[j].trim();
            if (!l) break;
            const cells = l.split(",");
            const labelCell = (cells[0] || "").trim();
            const valCell = (cells[1] || "").trim();
            if (labelCell === "Tolerance Operator") pushRow(testName, "Tolerance_Operator", valCell, 0);
            if (labelCell.startsWith("Tolerance Value")) pushRow(testName, "Tolerance_Value", valCell, 0);
          }
          i = j;
          continue;
        }

        // 3) Output Consistency
        if (label === "OUTPUT CONSISTENCY") {
          const testName = "Output Consistency";
          const ffdLine = (lines[i + 1] || "").split(",");
          const ffd = (ffdLine[1] || "").trim();
          if (ffd) pushRow(testName, "FFD", ffd, 0);

          // header at i+2, data at i+3
          const dataLine = lines[i + 3] || "";
          const cells = dataLine.split(",");
          let rowIdx = 0;
          if (cells.length >= 2) {
            const kv = (cells[0] || "").trim();
            const mas = (cells[1] || "").trim();
            if (kv) pushRow(testName, "OutputRow_kV", kv, rowIdx);
            if (mas) pushRow(testName, "OutputRow_mAs", mas, rowIdx);
            for (let c = 2; c < cells.length; c++) {
              const v = (cells[c] || "").trim();
              if (!v) continue;
              const measIdx = c - 1; // Meas1..5
              pushRow(testName, `OutputRow_Meas${measIdx}`, v, rowIdx);
            }
          }

          // tolerance lines around i+4,i+5
          for (let j = i + 4; j < Math.min(lines.length, i + 8); j++) {
            const l = lines[j].trim();
            if (!l) break;
            const parts = l.split(",");
            const labelCell = (parts[0] || "").trim();
            const valCell = (parts[1] || "").trim();
            if (labelCell === "Tolerance Operator") pushRow(testName, "Tolerance_Operator", valCell, 0);
            if (labelCell.startsWith("Tolerance")) pushRow(testName, "Tolerance_Value", valCell, 0);
          }
          i += 6;
          continue;
        }

        // 4) Central Beam Alignment
        if (label === "CENTRAL BEAM ALIGNMENT") {
          const testName = "Central Beam Alignment";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const mas = cond[5] || "";
          if (fcd) pushRow(testName, "TechniqueFactors_FCD", fcd, 0);
          if (kv) pushRow(testName, "TechniqueFactors_kV", kv, 0);
          if (mas) pushRow(testName, "TechniqueFactors_mAs", mas, 0);

          const obs = (lines[i + 2] || "").split(",");
          const tiltVal = obs[1] || "";
          if (tiltVal) pushRow(testName, "ObservedTilt_Value", tiltVal, 0);

          const tol = (lines[i + 3] || "").split(",");
          const tolVal = tol[1] || "";
          if (tolVal) pushRow(testName, "Tolerance_Value", tolVal, 0);
          // Operator left as default "<=" from component
          i += 4;
          continue;
        }

        // 5) Congruence of Radiation
        if (label === "CONGRUENCE OF RADIATION") {
          const testName = "Congruence of Radiation";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const mas = cond[5] || "";
          if (fcd) pushRow(testName, "TechniqueFactors_FCD", fcd, 0);
          if (kv) pushRow(testName, "TechniqueFactors_kV", kv, 0);
          if (mas) pushRow(testName, "TechniqueFactors_mAs", mas, 0);

          let rowIdx = 0;
          let j = i + 3; // skip header row at i+2
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const dim = (cells[0] || "").trim();
            const obsShift = (cells[1] || "").trim();
            const edgeShift = (cells[2] || "").trim();
            const percentFed = (cells[3] || "").trim();
            const tol = (cells[4] || "").trim();
            if (dim) {
              pushRow(testName, "CongruenceMeasurement_Dimension", dim, rowIdx);
              if (obsShift) pushRow(testName, "CongruenceMeasurement_ObservedShift", obsShift, rowIdx);
              if (edgeShift) pushRow(testName, "CongruenceMeasurement_EdgeShift", edgeShift, rowIdx);
              if (percentFed) pushRow(testName, "CongruenceMeasurement_PercentFED", percentFed, rowIdx);
              if (tol) pushRow(testName, "CongruenceMeasurement_Tolerance", tol, rowIdx);
              rowIdx++;
            }
            j++;
          }
          i = j;
          continue;
        }

        // 6) Effective Focal Spot
        if (label === "EFFECTIVE FOCAL SPOT") {
          const testName = "Effective Focal Spot";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          if (fcd) pushRow(testName, "FCD", fcd, 0);

          let rowIdx = 0;
          let j = i + 3; // skip header at i+2
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const fType = (cells[0] || "").trim();
            const sW = (cells[1] || "").trim();
            const sH = (cells[2] || "").trim();
            const mW = (cells[3] || "").trim();
            const mH = (cells[4] || "").trim();
            if (fType) {
              pushRow(testName, "FocalSpot_FocusType", fType, rowIdx);
              if (sW) pushRow(testName, "FocalSpot_StatedWidth", sW, rowIdx);
              if (sH) pushRow(testName, "FocalSpot_StatedHeight", sH, rowIdx);
              if (mW) pushRow(testName, "FocalSpot_MeasuredWidth", mW, rowIdx);
              if (mH) pushRow(testName, "FocalSpot_MeasuredHeight", mH, rowIdx);
              rowIdx++;
            }
            j++;
          }
          i = j;
          continue;
        }

        // 7) Linearity of mAs Loading Stations
        if (label === "LINEARITY OF mAs LOADING STATIONS") {
          const testName = "Linearity of mAs Loading Stations";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          if (fcd) pushRow(testName, "Table1_FCD", fcd, 0);
          if (kv) pushRow(testName, "Table1_kV", kv, 0);

          let rowIdx = 0;
          let j = i + 3; // data rows (skip header)
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const mAs = (cells[0] || "").trim();
            if (mAs && !isNaN(Number(mAs))) {
              pushRow(testName, "Table2_mAsApplied", mAs, rowIdx);
              if (cells[1] !== undefined) pushRow(testName, "Table2_Meas1", cells[1], rowIdx);
              if (cells[2] !== undefined) pushRow(testName, "Table2_Meas2", cells[2], rowIdx);
              if (cells[3] !== undefined) pushRow(testName, "Table2_Meas3", cells[3], rowIdx);
              rowIdx++;
            } else {
              // tolerance row
              const labelCell = (cells[0] || "").trim();
              const valCell = (cells[1] || "").trim();
              if (labelCell === "Tolerance Operator") pushRow(testName, "ToleranceOperator", valCell, 0);
              if (labelCell.startsWith("Tolerance")) pushRow(testName, "Tolerance", valCell, 0);
            }
            j++;
          }
          i = j;
          continue;
        }

        // 8) Radiation Leakage Level
        if (label === "RADIATION LEAKAGE LEVEL") {
          const testName = "Radiation Leakage Level";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const ma = cond[5] || "";
          const time = cond[7] || "";
          const workload = cond[9] || "";
          if (fcd) pushRow(testName, "Settings_FCD", fcd, 0);
          if (kv) pushRow(testName, "Settings_kV", kv, 0);
          if (ma) pushRow(testName, "Settings_ma", ma, 0);
          if (time) pushRow(testName, "Settings_Time", time, 0);
          if (workload) pushRow(testName, "Workload", workload, 0);

          const tolLine = (lines[i + 2] || "").split(",");
          const tolVal = tolLine[1] || "";
          const tolOpLine = (lines[i + 3] || "").split(",");
          const tolOp = tolOpLine[1] || "";
          if (tolVal) pushRow(testName, "ToleranceValue", tolVal, 0);
          if (tolOp) pushRow(testName, "ToleranceOperator", tolOp, 0);

          // location header at i+4, data at i+5+
          let rowIdx = 0;
          let j = i + 5;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const loc = (cells[0] || "").trim();
            if (loc) {
              pushRow(testName, "LeakageMeasurement_Location", loc, rowIdx);
              if (cells[1] !== undefined) pushRow(testName, "LeakageMeasurement_Left", cells[1], rowIdx);
              if (cells[2] !== undefined) pushRow(testName, "LeakageMeasurement_Right", cells[2], rowIdx);
              if (cells[3] !== undefined) pushRow(testName, "LeakageMeasurement_Front", cells[3], rowIdx);
              if (cells[4] !== undefined) pushRow(testName, "LeakageMeasurement_Back", cells[4], rowIdx);
              if (cells[5] !== undefined) pushRow(testName, "LeakageMeasurement_Top", cells[5], rowIdx);
              rowIdx++;
            }
            j++;
          }
          i = j;
          continue;
        }
      }

      i++;
    }

    return rows;
  };

  // Process the parsed rows and dispatch to component state (single state update so all sections apply).
  // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer hasTimer from Excel and skip timer modal.
  const processExcelData = async (csvData: any[], applyConfigFromExcel?: boolean) => {
    try {
      setExcelUploading(true);

      const grouped: Record<string, any[]> = {};
      csvData.forEach(row => {
        const name = (row["Test Name"] || "").trim();
        if (name) { if (!grouped[name]) grouped[name] = []; grouped[name].push(row); }
      });

      if (applyConfigFromExcel && Object.keys(grouped).length > 0) {
        const hasTimerSection = !!(grouped["Accuracy of Irradiation Time"]?.length);
        setHasTimer(hasTimerSection);
        setShowTimerModal(false);
        if (serviceId) {
          localStorage.setItem(`radiography-mobile-timer-${serviceId}`, String(hasTimerSection));
        }
      }

      const nextState: Record<string, any> = {};

      // --- Accuracy of Operating Potential (same format as Radiography Fixed) ---
      if (grouped["Accuracy of Operating Potential"]?.length) {
        try {
          const data = grouped["Accuracy of Operating Potential"];
          const measHeaders: string[] = [];
          const kVpMeasurements: any[] = [];
          const tol: any = {};
          let currentBlock: any = null;
          data.forEach((row: any) => {
            const key = (row["Key"] || row["Field Name"] || "").trim();
            const val = (row["Value"] || "").trim();
            if (key === "MeasHeader") {
              measHeaders.push(val);
            } else if (key === "Measurement_AppliedKvp") {
              currentBlock = { setKV: val, measurements: [] };
              kVpMeasurements.push(currentBlock);
            } else if (key.startsWith("Measurement_Meas") && currentBlock) {
              currentBlock.measurements.push(val);
            } else if (key.startsWith("Tolerance_")) {
              tol[key.split("_")[1]] = val;
            }
          });
          const table2 = kVpMeasurements.map((block: any) => ({
            setKV: block.setKV,
            measuredValues: block.measurements || [],
          }));
          nextState.accuracyOfOperatingPotential = {
            mAStations: measHeaders.length > 0 ? measHeaders : ["@ mA 10", "@ mA 100", "@ mA 200"],
            table2,
            tolerance: {
              sign: tol.Sign || tol.sign || "±",
              value: tol.Value || tol.value || "2.0",
            },
          };
        } catch (e: any) { toast.error(`Accuracy of Operating Potential: ${e?.message}`); }
      }

      // --- Accuracy of Irradiation Time ---
      if (grouped["Accuracy of Irradiation Time"]?.length) {
        try {
          const data = grouped["Accuracy of Irradiation Time"];
          const testConditions = { fcd: "", kv: "", ma: "" };
          const irradiationTimes: any[] = [];
          let toleranceOperator = "<=", toleranceValue = "5";
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field === "TestConditions_FCD") testConditions.fcd = value;
            if (field === "TestConditions_kV") testConditions.kv = value;
            if (field === "TestConditions_ma") testConditions.ma = value;
            if (field === "Tolerance_Operator") toleranceOperator = value;
            if (field === "Tolerance_Value") toleranceValue = value;
            if (field.startsWith("IrradiationTime_")) {
              while (irradiationTimes.length <= idx) irradiationTimes.push({ setTime: "", measuredTime: "" });
              if (field === "IrradiationTime_SetTime") irradiationTimes[idx].setTime = value;
              else if (field === "IrradiationTime_MeasuredTime") irradiationTimes[idx].measuredTime = value;
            }
          });
          nextState.accuracyOfIrradiationTime = { testConditions, irradiationTimes, tolerance: { operator: toleranceOperator, value: toleranceValue } };
        } catch (e: any) { toast.error(`Accuracy of Irradiation Time: ${e?.message}`); }
      }

      // --- Output Consistency ---
      if (grouped["Output Consistency"]?.length) {
        try {
          const data = grouped["Output Consistency"];
          let toleranceValue = "0.05", toleranceOperator = "<=";
          const outputRows: any[] = [];
          let ffd = "100";
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field === "Tolerance_Value") toleranceValue = value;
            if (field === "Tolerance_Operator") toleranceOperator = value;
            if (field === "FFD") ffd = value;
            if (field.startsWith("OutputRow_")) {
              while (outputRows.length <= idx) outputRows.push({ kv: "", mas: "", outputs: [], avg: "", remark: "" });
              const fn = field.replace("OutputRow_", "");
              if (fn === "kV") outputRows[idx].kv = value;
              if (fn === "mAs") outputRows[idx].mas = value;
              if (fn.startsWith("Meas")) {
                const colIdx = parseInt(fn.replace("Meas", "")) - 1;
                while (outputRows[idx].outputs.length <= colIdx) outputRows[idx].outputs.push({ value: "" });
                outputRows[idx].outputs[colIdx] = { value };
              }
            }
          });
          nextState.outputConsistency = { ffd: { value: ffd }, tolerance: { operator: toleranceOperator, value: toleranceValue }, outputRows };
        } catch (e: any) { toast.error(`Output Consistency: ${e?.message}`); }
      }

      // --- Central Beam Alignment ---
      if (grouped["Central Beam Alignment"]?.length) {
        try {
          const data = grouped["Central Beam Alignment"];
          const techniqueFactors = { fcd: "", kv: "", mas: "" };
          let observedTiltValue = "", observedTiltOperator = "<=", toleranceValue = "1.5", toleranceOperator = "<=";
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            if (field === "TechniqueFactors_FCD") techniqueFactors.fcd = value;
            if (field === "TechniqueFactors_kV") techniqueFactors.kv = value;
            if (field === "TechniqueFactors_mAs") techniqueFactors.mas = value;
            if (field === "ObservedTilt_Value") observedTiltValue = value;
            if (field === "ObservedTilt_Operator") observedTiltOperator = value;
            if (field === "Tolerance_Value") toleranceValue = value;
            if (field === "Tolerance_Operator") toleranceOperator = value;
          });
          nextState.centralBeamAlignment = {
            techniqueFactors,
            observedTilt: { value: observedTiltValue, operator: observedTiltOperator },
            tolerance: { value: toleranceValue, operator: toleranceOperator },
          };
        } catch (e: any) { toast.error(`Central Beam Alignment: ${e?.message}`); }
      }

      // --- Congruence of Radiation ---
      if (grouped["Congruence of Radiation"]?.length) {
        try {
          const data = grouped["Congruence of Radiation"];
          const congruenceMeasurements: any[] = [];
          const techniqueFactors: any[] = [];
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field.startsWith("TechniqueFactors_")) {
              while (techniqueFactors.length <= idx) techniqueFactors.push({ id: String(idx + 1), fcd: "100", kv: "80", mas: "10" });
              const fn = field.replace("TechniqueFactors_", "");
              if (fn === "FCD") techniqueFactors[idx].fcd = value;
              if (fn === "kV") techniqueFactors[idx].kv = value;
              if (fn === "mAs") techniqueFactors[idx].mas = value;
            }
            if (field.startsWith("CongruenceMeasurement_")) {
              while (congruenceMeasurements.length <= idx) congruenceMeasurements.push({ dimension: "", observedShift: "", edgeShift: "", percentFED: "", tolerance: "2" });
              const fn = field.replace("CongruenceMeasurement_", "");
              if (fn === "Dimension") congruenceMeasurements[idx].dimension = value;
              if (fn === "ObservedShift") congruenceMeasurements[idx].observedShift = value;
              if (fn === "EdgeShift") congruenceMeasurements[idx].edgeShift = value;
              if (fn === "PercentFED") congruenceMeasurements[idx].percentFED = value;
              if (fn === "Tolerance") congruenceMeasurements[idx].tolerance = value;
            }
          });
          nextState.congruenceOfRadiation = {
            techniqueFactors: techniqueFactors.length > 0 ? techniqueFactors : undefined,
            congruenceMeasurements,
          };
        } catch (e: any) { toast.error(`Congruence of Radiation: ${e?.message}`); }
      }

      // --- Effective Focal Spot ---
      if (grouped["Effective Focal Spot"]?.length) {
        try {
          const data = grouped["Effective Focal Spot"];
          let fcd = "";
          const focalSpots: any[] = [];
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field === "FCD") fcd = value;
            if (field.startsWith("FocalSpot_")) {
              while (focalSpots.length <= idx) focalSpots.push({ focusType: "", statedWidth: "", statedHeight: "", measuredWidth: "", measuredHeight: "" });
              const fn = field.replace("FocalSpot_", "");
              if (fn === "FocusType") focalSpots[idx].focusType = value;
              if (fn === "StatedWidth") focalSpots[idx].statedWidth = value;
              if (fn === "StatedHeight") focalSpots[idx].statedHeight = value;
              if (fn === "StatedNominal") focalSpots[idx].statedNominal = value;
              if (fn === "MeasuredWidth") focalSpots[idx].measuredWidth = value;
              if (fn === "MeasuredHeight") focalSpots[idx].measuredHeight = value;
              if (fn === "MeasuredNominal") focalSpots[idx].measuredNominal = value;
            }
          });
          nextState.effectiveFocalSpot = { fcd, focalSpots };
        } catch (e: any) { toast.error(`Effective Focal Spot: ${e?.message}`); }
      }

      // --- Linearity of mAs Loading Stations ---
      if (grouped["Linearity of mAs Loading Stations"]?.length) {
        try {
          const data = grouped["Linearity of mAs Loading Stations"];
          const table1: any[] = [];
          const measHeaders: string[] = [];
          let tolerance = "0.1", toleranceOperator = "<=";
          const table2: any[] = [];
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field.startsWith("Table1_")) {
              while (table1.length <= idx) table1.push({ fcd: "100", kv: "80" });
              const fn = field.replace("Table1_", "");
              if (fn === "FCD") table1[idx].fcd = value;
              if (fn === "kV") table1[idx].kv = value;
            }
            if (field === "Tolerance") tolerance = value;
            if (field === "ToleranceOperator") toleranceOperator = value;
            if (field === "MeasHeader" && !measHeaders.includes(value)) measHeaders.push(value);
            if (field.startsWith("Table2_")) {
              while (table2.length <= idx) table2.push({ mAsRange: "", measuredOutputs: [], average: "", x: "", xMax: "", xMin: "", coL: "" });
              const fn = field.replace("Table2_", "");
              if (fn === "mAsApplied" || fn === "mAsRange") table2[idx].mAsRange = value;
              if (fn === "Average") table2[idx].average = value;
              if (fn === "X") table2[idx].x = value;
              if (fn === "XMax") table2[idx].xMax = value;
              if (fn === "XMin") table2[idx].xMin = value;
              if (fn === "CoL") table2[idx].coL = value;
              if (fn.startsWith("Meas")) {
                const colIdx = parseInt(fn.replace("Meas", "")) - 1;
                while (table2[idx].measuredOutputs.length <= colIdx) table2[idx].measuredOutputs.push("");
                table2[idx].measuredOutputs[colIdx] = value;
              }
            }
          });
          nextState.linearityOfMasLoading = {
            table1,
            measHeaders: measHeaders.length > 0 ? measHeaders : ["Meas 1", "Meas 2", "Meas 3"],
            tolerance,
            toleranceOperator,
            table2,
          };
        } catch (e: any) { toast.error(`Linearity of mAs Loading Stations: ${e?.message}`); }
      }

      // --- Radiation Leakage Level ---
      if (grouped["Radiation Leakage Level"]?.length) {
        try {
          const data = grouped["Radiation Leakage Level"];
          const settings = { fcd: "", kv: "", ma: "", time: "" };
          let workload = "", toleranceValue = "1", toleranceOperator = "less than or equal to";
          const leakageMeasurements: any[] = [];
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field === "Settings_FCD") settings.fcd = value;
            if (field === "Settings_kV") settings.kv = value;
            if (field === "Settings_ma") settings.ma = value;
            if (field === "Settings_Time") settings.time = value;
            if (field === "Workload") workload = value;
            if (field === "ToleranceValue") toleranceValue = value;
            if (field === "ToleranceOperator") toleranceOperator = value;
            if (field.startsWith("LeakageMeasurement_")) {
              while (leakageMeasurements.length <= idx) leakageMeasurements.push({ location: "", left: "", right: "", front: "", back: "", top: "" });
              const fn = field.replace("LeakageMeasurement_", "");
              if (fn === "Location") leakageMeasurements[idx].location = value;
              if (fn === "Left") leakageMeasurements[idx].left = value;
              if (fn === "Right") leakageMeasurements[idx].right = value;
              if (fn === "Front") leakageMeasurements[idx].front = value;
              if (fn === "Back") leakageMeasurements[idx].back = value;
              if (fn === "Top") leakageMeasurements[idx].top = value;
            }
          });
          nextState.radiationLeakageLevel = {
            settings,
            workload,
            tolerance: { value: toleranceValue, operator: toleranceOperator },
            leakageMeasurements,
          };
        } catch (e: any) { toast.error(`Radiation Leakage Level: ${e?.message}`); }
      }

      const processedTests = Object.keys(grouped).filter(k => grouped[k].length > 0);
      if (Object.keys(nextState).length > 0) {
        setCsvDataForComponents(prev => ({ ...prev, ...nextState }));
        setRefreshKey(k => k + 1);
        toast.success(`Excel data loaded! ${processedTests.length} test(s) filled. Please review and save.`);
      } else {
        toast.error("No test data found in Excel. Please check the format.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to process Excel data");
    } finally {
      setExcelUploading(false);
    }
  };

  // ── Handle Excel file upload ──────────────────────────────────────────────
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCSV = file.name.endsWith(".csv");

    if (!isCSV && !isExcel) {
      toast.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    const readAsArrayBuffer = (f: File): Promise<ArrayBuffer> =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as ArrayBuffer);
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsArrayBuffer(f);
      });
    const readAsText = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsText(f);
      });

    try {
      if (isExcel) {
        const arrayBuffer = await readAsArrayBuffer(file);
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const csvData = parseExcelToCSVFormat(workbook);
        await processExcelData(csvData);
      } else {
        // CSV in Dental-style table format (RadiographyMobile_Timer_Template.csv)
        const text = await readAsText(file);
        const rows = parseTableCSVToRows(text);
        await processExcelData(rows);
      }
    } catch (err: any) {
      toast.error(`Failed to read file: ${err?.message || "Unknown error"}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Export saved data to Excel (all test tables) ───────────────────────────
  const handleExportToExcel = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }


    try {
      toast.loading("Exporting data to Excel...", { id: "export-excel" });
      setExcelUploading(true);

      const exportData: Record<string, unknown> = {};

      try {
        const headerRes = await getReportHeaderForRadiographyMobile(serviceId);
        if (headerRes?.data || headerRes?.exists) {
          exportData.reportHeader = headerRes;
        }
      } catch (err) {
        console.log("Radiography Mobile report header not found or error:", err);
      }

      try {
        const res = await getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.accuracyOfIrradiationTime = res;
      } catch (err) {
        console.log("Accuracy of Irradiation Time not found or error:", err);
      }

      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.accuracyOfOperatingPotential = res;
      } catch (err) {
        console.log("Accuracy of Operating Potential not found or error:", err);
      }

      try {
        const res = await getCentralBeamAlignmentByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.centralBeamAlignment = res;
      } catch (err) {
        console.log("Central Beam Alignment not found or error:", err);
      }

      try {
        const res = await getCongruenceByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.congruence = res;
      } catch (err) {
        console.log("Congruence not found or error:", err);
      }

      try {
        const res = await getEffectiveFocalSpotByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.effectiveFocalSpot = res;
      } catch (err) {
        console.log("Effective Focal Spot not found or error:", err);
      }

      try {
        const res = await getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.linearityOfMasLoading = res;
      } catch (err) {
        console.log("Linearity of mAs Loading not found or error:", err);
      }

      try {
        const res = await getConsistencyOfRadiationOutputByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.outputConsistency = res;
      } catch (err) {
        console.log("Output Consistency not found or error:", err);
      }

      try {
        const res = await getRadiationLeakageLevelByServiceIdForRadiographyMobile(serviceId);
        if (res) exportData.radiationLeakageLevel = res;
      } catch (err) {
        console.log("Radiation Leakage Level not found or error:", err);
      }

      if (Object.keys(exportData).length === 0) {
        toast.error("No data found to export. Please save test data first.", { id: "export-excel" });
        return;
      }

      const wb = createRadiographyMobileUploadableExcel(exportData as RadiographyMobileExportData);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Radiography_Mobile_Test_Data_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success("Data exported successfully!", { id: "export-excel" });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data: " + (error?.message || "Unknown error"), { id: "export-excel" });
    } finally {
      setExcelUploading(false);
    }
  };

  // ── Guard renders ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading report form...</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">
        Failed to load service details. Please try again.
      </div>
    );
  }

  if (showTimerModal && hasTimer === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
          <p className="text-gray-600 mb-8">
            Does this Radiography (Mobile) unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => handleTimerChoice(true)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition transform hover:scale-105">
              Yes, Has Timer
            </button>
            <button onClick={() => handleTimerChoice(false)} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition transform hover:scale-105">
              No Timer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When Excel is loading from URL, show loading until timer config is inferred
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
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">

      {/* ── Header row with title + Excel buttons ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Generate Radiography (Mobile) QA Test Report
        </h1>
        {/* Download templates */}
        {/* <div className="flex gap-2">
          <a
            href="/templates/RadiographyMobile_Timer_Template.csv"
            download
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium"
          >
            ⬇ Timer Template (CSV)
          </a>
          <a
            href="/templates/RadiographyMobile_NoTimer_Template.csv"
            download
            className="px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition text-xs font-medium"
          >
            ⬇ No-Timer Template (CSV)
          </a>
          <a
            href="/templates/RadiographyMobile_Test_Template.xlsx"
            download
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xs font-medium"
          >
            ⬇ XLSX Template
          </a>
        </div> */}
        <div className="flex flex-wrap gap-2">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition cursor-pointer text-sm font-medium ${excelUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
            <CloudArrowUpIcon className="w-5 h-5" />
            {excelUploading ? "Uploading..." : "Import Excel"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
              disabled={excelUploading}
            />
          </label>
          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={excelUploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition text-sm font-medium ${excelUploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            {excelUploading ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>

      {/* ── Form sections ── */}
      <section className="mb-10 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">1. Name and Address of Customer</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Customer Name</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label className="block font-medium mb-1">Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
          </div>
        </div>
      </section>

      <section className="mb-10 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">2. Customer Reference</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">2.1 SRF Number</label>
            <input type="text" value={formData.srfNumber} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label className="block font-medium mb-1">SRF Date</label>
            <input type="date" name="srfDate" value={formData.srfDate} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium mb-1">2.2 Test Report Number</label>
            <input type="text" name="testReportNumber" value={formData.testReportNumber} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium mb-1">Issue Date</label>
            <input type="date" name="issueDate" value={formData.issueDate} min={minIssueDate || undefined} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2" title={minIssueDate ? `Must be on or after QA test date (${minIssueDate})` : undefined} />
          </div>
        </div>
      </section>

      <section className="mb-10 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">3. Details of Device Under Test</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Nomenclature", name: "nomenclature", readOnly: true },
            { label: "Make", name: "make" },
            { label: "Model", name: "model", readOnly: true },
            { label: "Serial Number", name: "slNumber", readOnly: true },
            { label: "Category", name: "category" },
            { label: "Condition of Test Item", name: "condition" },
            { label: "Testing Procedure Number", name: "testingProcedureNumber" },
            { label: "No. of Pages", name: "pages" },
            { label: "Test Date", name: "testDate", type: "date" },
            { label: "Test Due Date", name: "testDueDate", type: "date" },
            { label: "Location", name: "location" },
            { label: "Temperature (°C)", name: "temperature", type: "number" },
            { label: "Humidity (%)", name: "humidity", type: "number" },
          ].map(field => (
            <div key={field.name}>
              <label className="block font-medium mb-1">{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={handleInputChange}
                readOnly={field.readOnly}
                className={`w-full border rounded-md px-3 py-2 ${field.readOnly ? "bg-gray-100" : ""}`}
              />
            </div>
          ))}
        </div>
      </section>

      <Standards standards={tools} />
      <Notes initialNotes={notes} onChange={setNotes} />

      {/* ── Save / View buttons ── */}
      <div className="my-10 flex justify-end gap-6">
        {saveSuccess && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            Report Header Saved Successfully!
          </div>
        )}
        {saveError && (
          <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-300">{saveError}</div>
        )}
        <button
          onClick={handleSaveHeader}
          disabled={saving}
          className={`px-8 py-3 rounded-lg font-bold text-white transition ${saving ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
        >
          {saving ? "Saving..." : "Save Report Header"}
        </button>
        <button
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
            navigate(`/admin/orders/view-service-report-radiography-mobile?serviceId=${serviceId}`);
          }}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
        >
          View Generated Report
        </button>
      </div>

      {/* ── QA Tests ── */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
        {[
          {
            title: "Congruence of Radiation & Optical Field",
            component: (
              <CongruenceOfRadiation
                key={`congruence-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents.congruenceOfRadiation}
              />
            ),
          },
          {
            title: "Central Beam Alignment",
            component: (
              <CentralBeamAlignment
                key={`central-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents.centralBeamAlignment}
              />
            ),
          },
          {
            title: "Effective Focal Spot Measurement",
            component: (
              <EffectiveFocalSpot
                key={`focal-spot-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents.effectiveFocalSpot}
              />
            ),
          },
          ...(hasTimer === true
            ? [
              {
                title: "Accuracy Of Irradiation Time",
                component: (
                  <AccuracyOfIrradiationTime
                    key={`timer-${refreshKey}`}
                    serviceId={serviceId}
                    refreshKey={refreshKey}
                    initialData={csvDataForComponents.accuracyOfIrradiationTime}
                  />
                ),
              },
            ]
            : []),
          {
            title: "Accuracy Of Operating Potential",
            component: (
              <AccuracyOfOperatingPotential
                key={`accuracy-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents.accuracyOfOperatingPotential}
              />
            ),
          },
          // Linearity Test — Conditional on timer choice
          ...(hasTimer === true
            ? [
              {
                title: "Linearity Of mA Loading",
                component: (
                  <LinearityOfMasLoadingStations
                    key={`linearity-ma-${refreshKey}`}
                    serviceId={serviceId}
                    refreshKey={refreshKey}
                    initialData={csvDataForComponents.linearityOfMasLoading}
                  />
                ),
              },
            ]
            : hasTimer === false
              ? [
                {
                  title: "Linearity Of mAs Loading Stations",
                  component: (
                    <LinearityOfMasLoadingStations
                      key={`linearity-mas-${refreshKey}`}
                      serviceId={serviceId}
                      refreshKey={refreshKey}
                      initialData={csvDataForComponents.linearityOfMasLoading}
                    />
                  ),
                },
              ]
              : []),
          {
            title: "Consistency of Radiation Output",
            component: (
              <ConsistencyOfRadiationOutput
                key={`output-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents.outputConsistency}
              />
            ),
          },
          {
            title: "Radiation Leakage Level",
            component: (
              <RadiationLeakageLevel
                key={`leakage-${refreshKey}`}
                serviceId={serviceId}
                refreshKey={refreshKey}
                initialData={csvDataForComponents.radiationLeakageLevel}
              />
            ),
          },
        ].map((item, i) => (
          <Disclosure key={i} defaultOpen={i === 0}>
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

export default RadiographyMobile;
