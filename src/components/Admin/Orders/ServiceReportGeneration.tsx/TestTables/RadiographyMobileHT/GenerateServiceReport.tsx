// RadioFluro.tsx
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
  getReportHeaderForRadiographyMobileHT,
  proxyFile,
  getCongruenceByServiceIdForRadiographyMobileHT,
  getCentralBeamAlignmentByServiceIdForRadiographyMobileHT,
  getEffectiveFocalSpotByServiceIdForRadiographyMobileHT,
  getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobileHT,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobileHT,
  getTotalFiltrationByServiceIdForRadiographyMobileHT,
  getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobileHT,
  getOutputConsistencyByServiceIdForRadiographyMobileHT,
  getRadiationLeakageLevelByServiceIdForRadiographyMobileHT,
  getRadiationProtectionSurveyByServiceIdForRadiographyMobileHT,
} from "../../../../../../api";
import { createRadiographyMobileHTUploadableExcel, RadiographyMobileHTExportData } from "./exportRadiographyMobileHTToExcel";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import CongruenceOfRadiation from "./CongruenceOfRadiation";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalSpot from "./EffectiveFocalSpot";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import TotalFilteration from "./TotalFilteration";
import LinearityOfMaLoading from "./LinearityOfMaLoadingStations";
import LinearityOfMasLoading from "./LinearityOfMasLoading";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
import RadiationLeakageLevel from "./RadiationLeakageLevel";
import RadiationProtectionSurvey from "./RadiationProtectionSurvey";

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

const RadiographyMobileHT: React.FC<{ serviceId: string; qaTestDate?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, csvFileUrl }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
  const [showTimerModal, setShowTimerModal] = useState(true); // Will be set based on localStorage

  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [csvDataForComponents, setCsvDataForComponents] = useState<{
    congruenceOfRadiation?: any;
    centralBeamAlignment?: any;
    effectiveFocalSpot?: any;
    accuracyOfIrradiationTime?: any;
    totalFilteration?: any;
    linearityOfMaLoading?: any;
    linearityOfMasLoading?: any;
    consistencyOfRadiationOutput?: any;
    radiationLeakageLevel?: any;
    radiationProtectionSurvey?: any;
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
  const [minIssueDate, setMinIssueDate] = useState(""); // QA test submitted date; issue date must be >= this
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

  // Check localStorage for timer preference on mount. When csvFileUrl is provided (redirect from ServiceDetails2), skip modal — config will be set from Excel in processCSVData.
  useEffect(() => {
    if (!serviceId) {
      setShowTimerModal(true);
      setHasTimer(null);
      return;
    }
    if (csvFileUrl) {
      setShowTimerModal(false);
      return;
    }
    const stored = localStorage.getItem(`radiography-mobile-ht-timer-${serviceId}`);
    if (stored !== null) {
      setHasTimer(stored === 'true');
      setShowTimerModal(false);
    } else {
      setShowTimerModal(true);
      setHasTimer(null);
    }
  }, [serviceId, csvFileUrl]);

  // Close modal and set timer choice
  const handleTimerChoice = (choice: boolean) => {
    setHasTimer(choice);
    setShowTimerModal(false);
    // Store in localStorage so it persists across refreshes
    if (serviceId) {
      localStorage.setItem(`radiography-mobile-ht-timer-${serviceId}`, String(choice));
    }
  };

  // Fetch initial data
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
        const firstTest = data.qaTests[0];
        const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
        const testDateSource = firstTest?.qatestSubmittedAt || firstTest?.createdAt;
        const testDateStr = testDateSource ? new Date(testDateSource).toISOString().split("T")[0] : "";
        let testDueDateStr = "";
        if (testDateStr) {
          const d = new Date(testDateStr);
          d.setFullYear(d.getFullYear() + 2);
          testDueDateStr = d.toISOString().split("T")[0];
        }

        setDetails(data);

        setMinIssueDate(testDateStr || "");
        // Pre-fill form from service details
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
          testDate: testDateStr,
          testDueDate: testDueDateStr,
          location: data.hospitalAddress,
          temperature: "",
          humidity: "",
          engineerNameRPId: data.engineerAssigned?.name || "",
          category: data.category || "",
        });

        // Map tools
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

  // Load report header and test IDs
  useEffect(() => {
    const loadReportHeader = async () => {
      if (!serviceId) return;
      try {
        const res = await getReportHeaderForRadiographyMobileHT(serviceId);
        if (res?.exists && res?.data) {
          // Update form data from report header
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
          if (res.data.testDate) setMinIssueDate(res.data.testDate);

          // Load existing notes, or use default if none exist
          if (res.data.notes && Array.isArray(res.data.notes) && res.data.notes.length > 0) {
            const notesTexts = res.data.notes.map((n: any) => n.text || n);
            setNotes(notesTexts);
          } else {
            setNotes(defaultNotes);
          }
        }
      } catch (err) {
        console.log("No report header found or failed to load:", err);
      }
    };
    loadReportHeader();
  }, [serviceId]);

  // CSV Parser
  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) return [];
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else current += char;
      }
      result.push(current.trim());
      return result;
    };
    const headers = parseLine(lines[0]);
    const data: any[] = [];
    const sectionToTestName: Record<string, string> = {
      "========== CONGRUENCE OF RADIATION ==========": "Congruence of Radiation",
      "========== CENTRAL BEAM ALIGNMENT ==========": "Central Beam Alignment",
      "========== EFFECTIVE FOCAL SPOT ==========": "Effective Focal Spot",
      "========== ACCURACY OF IRRADIATION TIME ==========": "Accuracy of Irradiation Time",
      "========== ACCURACY OF OPERATING POTENTIAL (kVp) & TOTAL FILTRATION ==========": "Total Filtration",
      "========== LINEARITY OF mA LOADING ==========": "Linearity of mA Loading",
      "========== LINEARITY OF mAs LOADING STATIONS ==========": "Linearity of mAs Loading",
      "========== OUTPUT CONSISTENCY ==========": "Output Consistency",
      "========== RADIATION LEAKAGE LEVEL ==========": "Radiation Leakage Level",
      "========== RADIATION PROTECTION SURVEY ==========": "Radiation Protection Survey",
    };
    let currentTestName = "";
    let rowIndexCounter: Record<string, number> = {};
    const rowStartFields = ["CongruenceMeasurement_Dimension", "ObservedTilt_Value", "FocalSpot_FocusType", "IrradiationTime_SetTime", "Measurement_AppliedKvp", "Table2_mAsApplied", "OutputRow_kV", "LeakageMeasurement_Location", "Location_Location"];
    let lastRowStart: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });
      const fieldName = (row["Field Name"] ?? "").trim();
      const value = (row["Value"] ?? "").trim();
      const firstCol = (row[headers[0]] ?? "").trim();
      if (firstCol.startsWith("==========") && firstCol.endsWith("==========")) {
        currentTestName = sectionToTestName[firstCol] ?? "";
        if (currentTestName) {
          rowIndexCounter[currentTestName] = 0;
          lastRowStart[currentTestName] = "";
        }
        continue;
      }
      if (!fieldName || firstCol.startsWith("---")) continue;
      if (currentTestName) {
        const isRowStart = rowStartFields.some((f) => fieldName === f);
        if (isRowStart) {
          const last = lastRowStart[currentTestName];
          if (last === undefined || last === "") {
            rowIndexCounter[currentTestName] = 0;
            lastRowStart[currentTestName] = value;
          } else if (last !== value) {
            rowIndexCounter[currentTestName] = (rowIndexCounter[currentTestName] ?? 0) + 1;
            lastRowStart[currentTestName] = value;
          }
        }
        data.push({
          "Field Name": fieldName,
          Value: value,
          "Row Index": String(rowIndexCounter[currentTestName] ?? 0),
          "Test Name": currentTestName,
        });
      }
    }
    return data;
  };

  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const data: any[] = [];
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
    if (jsonData.length === 0) return data;
    let headerRow = 0;
    let fieldCol = 0;
    let valueCol = 1;
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      for (let j = 0; j < (row?.length ?? 0); j++) {
        const cell = String(row[j] ?? "").trim().toLowerCase();
        if (cell === "field name" || cell === "fieldname") {
          headerRow = i;
          fieldCol = j;
        } else if (cell === "value") valueCol = j;
      }
    }
    const sectionToTestName: Record<string, string> = {
      "========== CONGRUENCE OF RADIATION ==========": "Congruence of Radiation",
      "========== CENTRAL BEAM ALIGNMENT ==========": "Central Beam Alignment",
      "========== EFFECTIVE FOCAL SPOT ==========": "Effective Focal Spot",
      "========== ACCURACY OF IRRADIATION TIME ==========": "Accuracy of Irradiation Time",
      "========== ACCURACY OF OPERATING POTENTIAL (kVp) & TOTAL FILTRATION ==========": "Total Filtration",
      "========== LINEARITY OF mA LOADING ==========": "Linearity of mA Loading",
      "========== LINEARITY OF mAs LOADING STATIONS ==========": "Linearity of mAs Loading",
      "========== OUTPUT CONSISTENCY ==========": "Output Consistency",
      "========== RADIATION LEAKAGE LEVEL ==========": "Radiation Leakage Level",
      "========== RADIATION PROTECTION SURVEY ==========": "Radiation Protection Survey",
    };
    let currentTestName = "";
    let rowIndexCounter: Record<string, number> = {};
    const rowStartFields = ["CongruenceMeasurement_Dimension", "ObservedTilt_Value", "FocalSpot_FocusType", "IrradiationTime_SetTime", "Measurement_AppliedKvp", "Table2_mAsApplied", "OutputRow_kV", "LeakageMeasurement_Location", "Location_Location"];
    let lastRowStart: Record<string, string> = {};
    for (let i = headerRow + 1; i < jsonData.length; i++) {
      const row = jsonData[i] ?? [];
      const fieldName = String(row[fieldCol] ?? "").trim();
      const value = String(row[valueCol] ?? "").trim();
      if (fieldName.startsWith("==========") && fieldName.endsWith("==========")) {
        currentTestName = sectionToTestName[fieldName] ?? "";
        if (currentTestName) {
          rowIndexCounter[currentTestName] = 0;
          lastRowStart[currentTestName] = "";
        }
        continue;
      }
      if (!fieldName || fieldName.startsWith("---")) continue;
      if (currentTestName) {
        const isRowStart = rowStartFields.some((f) => fieldName === f);
        if (isRowStart) {
          const last = lastRowStart[currentTestName];
          if (last === undefined || last === "") {
            rowIndexCounter[currentTestName] = 0;
            lastRowStart[currentTestName] = value;
          } else if (last !== value) {
            rowIndexCounter[currentTestName] = (rowIndexCounter[currentTestName] ?? 0) + 1;
            lastRowStart[currentTestName] = value;
          }
        }
        data.push({
          "Field Name": fieldName,
          Value: value,
          "Row Index": String(rowIndexCounter[currentTestName] ?? 0),
          "Test Name": currentTestName,
        });
      }
    }
    return data;
  };

  // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer hasTimer from Excel and skip timer modal.
  const processCSVData = async (csvData: any[], applyConfigFromExcel?: boolean) => {
    try {
      setCsvUploading(true);
      const grouped: Record<string, any[]> = {};
      csvData.forEach((row) => {
        const name = (row["Test Name"] ?? "").trim();
        if (name) {
          if (!grouped[name]) grouped[name] = [];
          grouped[name].push(row);
        }
      });

      if (applyConfigFromExcel && Object.keys(grouped).length > 0) {
        const hasTimerSection = !!(grouped["Accuracy of Irradiation Time"]?.length);
        setHasTimer(hasTimerSection);
        setShowTimerModal(false);
        if (serviceId) {
          localStorage.setItem(`radiography-mobile-ht-timer-${serviceId}`, String(hasTimerSection));
        }
      }

      if (grouped["Congruence of Radiation"]?.length) {
        const data = grouped["Congruence of Radiation"];
        const techniqueRows: any[] = [];
        const congruenceRows: any[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "TechniqueFactors_FCD" || f === "TechniqueFactors_kV" || f === "TechniqueFactors_mAs") {
            if (!techniqueRows[0]) techniqueRows[0] = { fcd: "100", kv: "80", mas: "10" };
            if (f === "TechniqueFactors_FCD") techniqueRows[0].fcd = v;
            if (f === "TechniqueFactors_kV") techniqueRows[0].kv = v;
            if (f === "TechniqueFactors_mAs") techniqueRows[0].mas = v;
          }
          if (f.startsWith("CongruenceMeasurement_")) {
            while (congruenceRows.length <= ri) congruenceRows.push({ dimension: "", observedShift: "", edgeShift: "", percentFED: "", tolerance: "2", remark: "" as "Pass" | "Fail" | "" });
            const key = f.replace("CongruenceMeasurement_", "");
            if (key === "Dimension") congruenceRows[ri].dimension = v;
            else if (key === "ObservedShift") congruenceRows[ri].observedShift = v;
            else if (key === "EdgeShift") congruenceRows[ri].edgeShift = v;
            else if (key === "PercentFED") congruenceRows[ri].percentFED = v;
            else if (key === "Tolerance") congruenceRows[ri].tolerance = v;
          }
        });
        setCsvDataForComponents((prev) => ({ ...prev, congruenceOfRadiation: { techniqueRows: techniqueRows.length ? techniqueRows : [{ fcd: "100", kv: "80", mas: "10" }], congruenceRows: congruenceRows.length ? congruenceRows : [] } }));
      }

      if (grouped["Central Beam Alignment"]?.length) {
        const data = grouped["Central Beam Alignment"];
        let fcd = "100", kv = "80", mAs = "10", observedTilt = "0.5", tiltOperator = "<=", toleranceValue = "1.5", toleranceOperator = "<=";
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          if (f === "TechniqueFactors_FCD") fcd = v;
          if (f === "TechniqueFactors_kV") kv = v;
          if (f === "TechniqueFactors_mAs") mAs = v;
          if (f === "ObservedTilt_Value") observedTilt = v;
          if (f === "ObservedTilt_Operator") tiltOperator = v;
          if (f === "Tolerance_Value") toleranceValue = v;
          if (f === "Tolerance_Operator") toleranceOperator = v;
        });
        setCsvDataForComponents((prev) => ({ ...prev, centralBeamAlignment: { techniqueFactors: { fcd, kv, mAs }, observedTilt: { value: observedTilt, operator: tiltOperator }, tolerance: { value: toleranceValue, operator: toleranceOperator } } }));
      }

      if (grouped["Effective Focal Spot"]?.length) {
        const data = grouped["Effective Focal Spot"];
        const focalSpots: any[] = [];
        let fcd = "60";
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "FCD") fcd = v;
          if (f.startsWith("FocalSpot_")) {
            while (focalSpots.length <= ri) focalSpots.push({ focusType: "", statedWidth: "", statedHeight: "", measuredWidth: "", measuredHeight: "" });
            const key = f.replace("FocalSpot_", "");
            if (key === "FocusType") focalSpots[ri].focusType = v;
            else if (key === "StatedWidth") focalSpots[ri].statedWidth = v;
            else if (key === "StatedHeight") focalSpots[ri].statedHeight = v;
            else if (key === "MeasuredWidth") focalSpots[ri].measuredWidth = v;
            else if (key === "MeasuredHeight") focalSpots[ri].measuredHeight = v;
          }
        });
        setCsvDataForComponents((prev) => ({ ...prev, effectiveFocalSpot: { fcd, focalSpots: focalSpots.length ? focalSpots : [] } }));
      }

      if (grouped["Accuracy of Irradiation Time"]?.length) {
        const data = grouped["Accuracy of Irradiation Time"];
        let fcd = "100", kv = "80", ma = "100", tolOp = "<=", tolVal = "5";
        const times: any[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "TestConditions_FCD") fcd = v;
          if (f === "TestConditions_kV") kv = v;
          if (f === "TestConditions_ma") ma = v;
          if (f === "Tolerance_Operator") tolOp = v;
          if (f === "Tolerance_Value") tolVal = v;
          if (f === "IrradiationTime_SetTime") {
            while (times.length <= ri) times.push({ setTime: "", measuredTime: "" });
            times[ri].setTime = v;
          } else if (f === "IrradiationTime_MeasuredTime" && times[ri]) times[ri].measuredTime = v;
        });
        setCsvDataForComponents((prev) => ({ ...prev, accuracyOfIrradiationTime: { testConditions: { fcd, kv, ma }, irradiationTimes: times.filter((t) => t.setTime || t.measuredTime), tolerance: { operator: tolOp, value: tolVal } } }));
      }

      if (grouped["Total Filtration"]?.length) {
        const data = grouped["Total Filtration"];
        const measurements: any[] = [];
        let toleranceSign = "±", toleranceValue = "2.0", totalFiltrationMeasured = "", totalFiltrationRequired = "2.5";
        const mAStations: string[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "Tolerance_Sign") toleranceSign = v;
          if (f === "Tolerance_Value") toleranceValue = v;
          if (f === "TotalFiltration_Measured") totalFiltrationMeasured = v;
          if (f === "TotalFiltration_Required") totalFiltrationRequired = v;
          if (f === "MeasHeader" && v && !mAStations.includes(v)) mAStations.push(v);
          if (f === "Measurement_AppliedKvp") {
            while (measurements.length <= ri) measurements.push({ appliedKvp: "", measuredValues: [], averageKvp: "", remarks: "-" as "PASS" | "FAIL" | "-" });
            measurements[ri].appliedKvp = v;
          } else if (f.startsWith("Measurement_Meas") && measurements[ri]) {
            const idx = parseInt(f.replace("Measurement_Meas", ""), 10) - 1;
            if (!isNaN(idx)) {
              while (measurements[ri].measuredValues.length <= idx) measurements[ri].measuredValues.push("");
              measurements[ri].measuredValues[idx] = v;
            }
          } else if (f === "Measurement_AverageKvp" && measurements[ri]) measurements[ri].averageKvp = v;
        });
        setCsvDataForComponents((prev) => ({ ...prev, totalFilteration: { mAStations: mAStations.length ? mAStations : ["50 mA", "100 mA"], measurements, tolerance: { sign: toleranceSign, value: toleranceValue }, totalFiltration: { measured: totalFiltrationMeasured, required: totalFiltrationRequired, atKvp: "" } } }));
      }

      if (grouped["Linearity of mA Loading"]?.length || grouped["Linearity of mAs Loading Stations"]?.length) {
        const data = grouped["Linearity of mA Loading"] ?? grouped["Linearity of mAs Loading Stations"] ?? [];
        let table1Fcd = "100", table1Kv = "80", tolerance = "0.1", toleranceOperator = "<=";
        const measHeaders: string[] = [];
        const table2Rows: any[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "Table1_FCD") table1Fcd = v;
          if (f === "Table1_kV") table1Kv = v;
          if (f === "Tolerance") tolerance = v;
          if (f === "ToleranceOperator") toleranceOperator = v;
          if (f === "MeasHeader" && v && !measHeaders.includes(v)) measHeaders.push(v);
          if (f === "Table2_mAsApplied") {
            while (table2Rows.length <= ri) table2Rows.push({ mAsApplied: "", meas: [] });
            table2Rows[ri].mAsApplied = v;
          } else if (f.startsWith("Table2_Meas") && table2Rows[ri]) {
            const idx = parseInt(f.replace("Table2_Meas", ""), 10) - 1;
            if (!isNaN(idx)) {
              while (table2Rows[ri].meas.length <= idx) table2Rows[ri].meas.push("");
              table2Rows[ri].meas[idx] = v;
            }
          }
        });
        const linearityData = { table1: { fcd: table1Fcd, kv: table1Kv }, tolerance, toleranceOperator, measHeaders: measHeaders.length ? measHeaders : ["Meas 1", "Meas 2", "Meas 3"], table2Rows: table2Rows.filter((row) => row.mAsApplied || row.meas.some((m: string) => m)) };
        setCsvDataForComponents((prev) => ({ ...prev, linearityOfMaLoading: linearityData, linearityOfMasLoading: linearityData }));
      }

      if (grouped["Output Consistency"]?.length) {
        const data = grouped["Output Consistency"];
        let ffd = "100", tolOp = "<=", tolVal = "0.05";
        const outputRows: any[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "FFD") ffd = v;
          if (f === "Tolerance_Operator") tolOp = v;
          if (f === "Tolerance_Value") tolVal = v;
          if (f === "OutputRow_kV") {
            while (outputRows.length <= ri) outputRows.push({ kv: "", mAs: "", meas: [], avg: "", cv: "" });
            outputRows[ri].kv = v;
          } else if (f === "OutputRow_mAs" && outputRows[ri]) outputRows[ri].mAs = v;
          else if (f.startsWith("OutputRow_Meas") && outputRows[ri]) {
            const idx = parseInt(f.replace("OutputRow_Meas", ""), 10) - 1;
            if (!isNaN(idx)) {
              while (outputRows[ri].meas.length <= idx) outputRows[ri].meas.push("");
              outputRows[ri].meas[idx] = v;
            }
          } else if (f === "OutputRow_Avg" && outputRows[ri]) outputRows[ri].avg = v;
          else if (f === "OutputRow_CV" && outputRows[ri]) outputRows[ri].cv = v;
        });
        setCsvDataForComponents((prev) => ({ ...prev, consistencyOfRadiationOutput: { ffd, tolerance: { operator: tolOp, value: tolVal }, outputRows: outputRows.filter((row) => row.kv || row.mAs) } }));
      }

      if (grouped["Radiation Leakage Level"]?.length) {
        const data = grouped["Radiation Leakage Level"];
        const settings = { fcd: "100", kv: "", ma: "", time: "" };
        let workload = "", toleranceValue = "1", toleranceOperator = "less than or equal to";
        const leakageMeasurements: any[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "Settings_FCD") settings.fcd = v;
          if (f === "Settings_kV") settings.kv = v;
          if (f === "Settings_ma") settings.ma = v;
          if (f === "Settings_Time") settings.time = v;
          if (f === "Workload") workload = v;
          if (f === "ToleranceValue") toleranceValue = v;
          if (f === "ToleranceOperator") toleranceOperator = v;
          if (f === "LeakageMeasurement_Location") {
            while (leakageMeasurements.length <= ri) leakageMeasurements.push({ location: "", left: "", right: "", front: "", back: "", top: "" });
            leakageMeasurements[ri].location = v;
          } else if (f.startsWith("LeakageMeasurement_") && leakageMeasurements[ri]) {
            const key = f.replace("LeakageMeasurement_", "").toLowerCase();
            if (key === "left") leakageMeasurements[ri].left = v;
            else if (key === "right") leakageMeasurements[ri].right = v;
            else if (key === "front") leakageMeasurements[ri].front = v;
            else if (key === "back") leakageMeasurements[ri].back = v;
            else if (key === "top") leakageMeasurements[ri].top = v;
          }
        });
        setCsvDataForComponents((prev) => ({ ...prev, radiationLeakageLevel: { settings, workload, toleranceValue, toleranceOperator, leakageMeasurements: leakageMeasurements.filter((m) => m.location || m.left || m.right) } }));
      }

      if (grouped["Radiation Protection Survey"]?.length) {
        const data = grouped["Radiation Protection Survey"];
        let surveyDate = "", hasValidCalibration = "", appliedCurrent = "100", appliedVoltage = "80", exposureTime = "1.0", workload = "5000";
        const locations: any[] = [];
        data.forEach((r) => {
          const f = (r["Field Name"] ?? "").trim();
          const v = (r["Value"] ?? "").trim();
          const ri = parseInt(r["Row Index"] ?? "0", 10);
          if (f === "SurveyDate") surveyDate = v;
          if (f === "HasValidCalibration") hasValidCalibration = v;
          if (f === "AppliedCurrent") appliedCurrent = v;
          if (f === "AppliedVoltage") appliedVoltage = v;
          if (f === "ExposureTime") exposureTime = v;
          if (f === "Workload") workload = v;
          if (f === "Location_Location") {
            while (locations.length <= ri) locations.push({ location: "", mRPerHr: "", category: "" });
            locations[ri].location = v;
          } else if (f === "Location_mRPerHr" && locations[ri]) locations[ri].mRPerHr = v;
          else if (f === "Location_Category" && locations[ri]) locations[ri].category = v;
        });
        setCsvDataForComponents((prev) => ({ ...prev, radiationProtectionSurvey: { surveyDate, hasValidCalibration, appliedCurrent, appliedVoltage, exposureTime, workload, locations: locations.filter((l) => l.location || l.mRPerHr) } }));
      }

      const count = Object.keys(grouped).length;
      if (count > 0) {
        toast.success(`CSV/Excel data loaded. ${count} section(s) filled. Please review and save.`);
        setTimeout(() => setRefreshKey(Date.now()), 50);
      } else {
        toast.error("No test data found in file. Check template format.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to process file");
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    const isCSV = /\.csv$/i.test(file.name);
    if (!isExcel && !isCSV) {
      toast.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const ab = ev.target?.result as ArrayBuffer;
          const wb = XLSX.read(ab, { type: "array" });
          const csvData = parseExcelToCSVFormat(wb);
          await processCSVData(csvData);
        } catch (err: any) {
          toast.error(err?.message ?? "Failed to read Excel file");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const text = ev.target?.result as string;
          const csvData = parseCSV(text);
          await processCSVData(csvData);
        } catch (err: any) {
          toast.error(err?.message ?? "Failed to read CSV file");
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const fetchAndProcess = async () => {
      if (!csvFileUrl) return;
      try {
        setCsvUploading(true);
        const urlLower = csvFileUrl.toLowerCase();
        const isExcel = urlLower.endsWith(".xlsx") || urlLower.endsWith(".xls");
        let csvData: any[] = [];
        if (isExcel) {
          const res = await proxyFile(csvFileUrl);
          const ab = await (res.data as Blob).arrayBuffer();
          const wb = XLSX.read(ab, { type: "array" });
          csvData = parseExcelToCSVFormat(wb);
        } else {
          const res = await proxyFile(csvFileUrl);
          const text = await (res.data as Blob).text();
          csvData = parseCSV(text);
        }
        if (csvData.length > 0) {
        await processCSVData(csvData, true);
          toast.success("File data loaded and filled.");
        } else {
          toast.error("File is empty or could not be parsed.");
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load file");
      } finally {
        setCsvUploading(false);
      }
    };
    fetchAndProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvFileUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if ((data as any).totalFiltration != null && typeof (data as any).totalFiltration === "object") return true;
      return false;
    };
    const checks: { name: string; check: () => Promise<boolean> }[] = [
      { name: "Congruence of radiation & Optical Field", check: async () => { try { return isSaved(await getCongruenceByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
      { name: "Central Beam Alignment", check: async () => { try { return isSaved(await getCentralBeamAlignmentByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
      { name: "Effective Focal Spot Measurement", check: async () => { try { return isSaved(await getEffectiveFocalSpotByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
      {
        name: "Accuracy Of Operating Potential & Total Filtration",
        check: async () => {
          try {
            const res = await getTotalFiltrationByServiceIdForRadiographyMobileHT(serviceId);
            return isSaved(res);
          } catch {
            return false;
          }
        },
      },
      { name: "Linearity (mA/mAs Loading)", check: async () => { try { return isSaved(await getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
      { name: "Output Consistency", check: async () => { try { return isSaved(await getOutputConsistencyByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
      { name: "Tube Housing Leakage", check: async () => { try { return isSaved(await getRadiationLeakageLevelByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
      { name: "Details Of Radiation Protection Survey", check: async () => { try { return isSaved(await getRadiationProtectionSurveyByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } } },
    ];
    if (hasTimer === true) {
      checks.push({
        name: "Accuracy Of Irradiation Time",
        check: async () => { try { return isSaved(await getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobileHT(serviceId)); } catch { return false; } },
      });
    }
    const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
    return results.filter((r) => !r.saved).map((r) => r.name);
  };

  // Export saved data to Excel (mirrors RadiographyFixed).
  const handleExportToExcel = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }
    try {
      toast.loading("Exporting data to Excel...", { id: "export-excel" });
      setCsvUploading(true);

      const exportData: Record<string, unknown> = {};

      try {
        const headerRes = await getReportHeaderForRadiographyMobileHT(serviceId);
        if (headerRes?.data || headerRes?.exists) {
          exportData.reportHeader = headerRes;
        }
      } catch (err) {
        console.log("Radiography Mobile HT report header not found or error:", err);
      }

      try {
        const res = await getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.accuracyOfIrradiationTime = res;
      } catch (err) {
        console.log("Accuracy of Irradiation Time not found or error:", err);
      }
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.accuracyOfOperatingPotential = res;
      } catch (err) {
        console.log("Accuracy of Operating Potential not found or error:", err);
      }
      try {
        const res = await getTotalFiltrationByServiceIdForRadiographyMobileHT(serviceId);
        if (res && (res.data || res.totalFiltration || res.measurements)) {
          exportData.totalFiltration = res;
        }
      } catch (err) {
        console.log("Total Filtration not found or error:", err);
      }
      try {
        const res = await getCentralBeamAlignmentByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.centralBeamAlignment = res;
      } catch (err) {
        console.log("Central Beam Alignment not found or error:", err);
      }
      try {
        const res = await getCongruenceByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.congruence = res;
      } catch (err) {
        console.log("Congruence of Radiation not found or error:", err);
      }
      try {
        const res = await getEffectiveFocalSpotByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.effectiveFocalSpot = res;
      } catch (err) {
        console.log("Effective Focal Spot not found or error:", err);
      }
      try {
        const res = await getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.linearityOfMaLoading = res;
      } catch (err) {
        console.log("Linearity of mAs Loading not found or error:", err);
      }
      try {
        const res = await getOutputConsistencyByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.outputConsistency = res;
      } catch (err) {
        console.log("Output Consistency not found or error:", err);
      }
      try {
        const res = await getRadiationLeakageLevelByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.radiationLeakageLevel = res;
      } catch (err) {
        console.log("Radiation Leakage Level not found or error:", err);
      }
      try {
        const res = await getRadiationProtectionSurveyByServiceIdForRadiographyMobileHT(serviceId);
        if (res) exportData.radiationProtectionSurvey = res;
      } catch (err) {
        console.log("Radiation Protection Survey not found or error:", err);
      }

      if (Object.keys(exportData).length === 0) {
        toast.error("No data found to export. Please save test data first.", { id: "export-excel" });
        return;
      }
      const wb = createRadiographyMobileHTUploadableExcel(exportData as RadiographyMobileHTExportData);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Radiography_Mobile_HT_Test_Data_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Data exported successfully!", { id: "export-excel" });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data: " + (error.message || "Unknown error"), { id: "export-excel" });
    } finally {
      setCsvUploading(false);
    }
  };

  // In RadioFluro.tsx - handleSaveHeader function (with validation: save header only after all test tables are saved)
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
        notes: notes.length > 0 ? notes.map((note, index) => ({
          slNo: `5.${index + 1}`,
          text: note,
        })) : [
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
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to save report header");
    } finally {
      setSaving(false);
    }
  };

  // MODAL POPUP — only when not coming from Excel URL (csvFileUrl)
  if (showTimerModal && hasTimer === null && serviceId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
          <p className="text-gray-600 mb-8">
            Does this Radiography (Mobile) with HT unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleTimerChoice(true)}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition transform hover:scale-105"
            >
              Yes, Has Timer
            </button>
            <button
              onClick={() => handleTimerChoice(false)}
              className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition transform hover:scale-105"
            >
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

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Generate Radiography (Mobile) with HT QA Test Report
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition cursor-pointer text-sm font-medium border border-green-200 disabled:opacity-50">
            <CloudArrowUpIcon className="w-5 h-5" />
            {csvUploading ? "Uploading…" : "Import Excel"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleCSVUpload}
              className="hidden"
              disabled={csvUploading}
            />
          </label>
          <button
            onClick={handleExportToExcel}
            disabled={csvUploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200 disabled:opacity-50"
          >
            {csvUploading ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <section className="mb-10 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">1. Name and Address of Customer</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              readOnly
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              readOnly
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Reference */}
      <section className="mb-10 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">2. Customer Reference</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">2.1 SRF Number</label>
            <input type="text" value={formData.srfNumber} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label className="block font-medium mb-1">SRF Date</label>
            <input
              type="date"
              name="srfDate"
              value={formData.srfDate}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">2.2 Test Report Number</label>
            <input
              type="text"
              name="testReportNumber"
              value={formData.testReportNumber}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Issue Date</label>
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              min={minIssueDate || undefined}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              title={minIssueDate ? `Must be on or after QA test date (${minIssueDate})` : undefined}
            />
          </div>
        </div>
      </section>

      {/* Device Details */}
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
          ].map((field) => (
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

      {/* Save & View */}
      <div className="my-10 flex justify-end gap-6">
        {saveSuccess && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            Report Header Saved Successfully!
          </div>
        )}
        {saveError && (
          <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-300">
            {saveError}
          </div>
        )}

        <button
          onClick={handleSaveHeader}
          disabled={saving}
          className={`px-8 py-3 rounded-lg font-bold text-white transition ${saving ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
            }`}
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
            navigate(`/admin/orders/view-service-report-radiography-mobile-ht?serviceId=${serviceId}`);
          }}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
        >
          View Generated Report
        </button>
      </div>

      {/* QA TESTS - Now Conditional */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
        {[
          {
            title: "Congruence of radiation & Optical Field",
            component: (
              <CongruenceOfRadiation
                key={`congruence-${refreshKey}`}
                serviceId={serviceId}
                initialData={csvDataForComponents.congruenceOfRadiation}
              />
            ),
          },
          { title: "Central Beam Alignment", component: <CentralBeamAlignment key={`central-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.centralBeamAlignment} /> },
          { title: "Effective Focal Spot Measurement", component: <EffectiveFocalSpot key={`focal-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.effectiveFocalSpot} /> },

          ...(hasTimer === true
            ? [
              {
                title: "Accuracy Of Irradiation Time",
                component: <AccuracyOfIrradiationTime key={`timer-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.accuracyOfIrradiationTime} />,
              },
            ]
            : []),

          { title: "Accuracy Of Operating Potential & Total Filtration", component: <TotalFilteration key={`total-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.totalFilteration} /> },

          ...(hasTimer === true
            ? [
              {
                title: "Linearity Of mA Loading",
                component: <LinearityOfMaLoading key={`linearity-ma-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.linearityOfMaLoading} />,
              },
            ]
            : hasTimer === false
              ? [
                {
                  title: "Linearity Of mAs Loading",
                  component: <LinearityOfMasLoading key={`linearity-mas-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.linearityOfMasLoading} />,
                },
              ]
              : []),

          { title: "Output Consistency", component: <ConsistencyOfRadiationOutput key={`consistency-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.consistencyOfRadiationOutput} /> },

          { title: "Tube Housing Leakage", component: <RadiationLeakageLevel key={`leakage-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.radiationLeakageLevel} /> },
          {
            title: "Details Of Radiation Protection Survey of the Installation",
            component: <RadiationProtectionSurvey key={`survey-${refreshKey}`} serviceId={serviceId} initialData={csvDataForComponents.radiationProtectionSurvey} />,
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

export default RadiographyMobileHT;
