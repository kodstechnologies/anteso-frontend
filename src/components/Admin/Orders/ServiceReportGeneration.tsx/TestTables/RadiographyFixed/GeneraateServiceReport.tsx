// RadioFluro.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
  getDetails,
  getTools,
  saveReportHeader,
  getReportHeaderForRadiographyFixed,
  getRadiationProfileWidthByServiceId,
  proxyFile,
  getAccuracyOfIrradiationTimeByServiceIdForRadiographyFixed,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyFixed,
  getTotalFiltrationByServiceIdForRadiographyFixed,
  getCentralBeamAlignmentByServiceIdForRadiographyFixed,
  getCongruenceByServiceIdForRadiographyFixed,
  getEffectiveFocalSpotByServiceIdForRadiographyFixed,
  getLinearityOfMasLoadingStationsByServiceIdForRadiographyFixed,
  getOutputConsistencyByServiceIdForRadiographyFixed,
  getRadiationLeakageLevelByServiceIdForRadiographyFixed,
  getRadiationProtectionSurveyByServiceIdForRadiographyFixed,
} from "../../../../../../api";
import * as XLSX from "xlsx";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { createRadiographyFixedUploadableExcel, RadiographyFixedExportData } from "./exportRadiographyFixedToExcel";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import CongruenceOfRadiation from "./CongruenceOfRadiation";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalSpot from "./EffectiveFocalSpot";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import TotalFilteration from "./TotalFilteration";
import LinearityOfMaLoading from "./LinearityOfMaLoadingStations"
import LinearityOfMasLoading from "./LinearityOfMasLoading";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
import RadiationLeakageLevel from "./RadiationLeakageLevel";
import RadiationProtectionSurvey from "./RadiationProtectionSurvey"

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
  orderCreatedAt?: string;
  machineType: string;
  machineModel: string;
  serialNumber: string;
  engineerAssigned: { name: string };
  qaTests: Array<{ createdAt: string; qaTestReportNumber: string; qatestSubmittedAt?: string; reportULRNumber?: string }>;
}

const RadiographyFixed: React.FC<{ serviceId: string; qaTestDate?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, csvFileUrl }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [radiationProfileTest, setRadiationProfileTest] = useState<any>(null);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
  const [showTimerModal, setShowTimerModal] = useState(false); // Will be set based on localStorage

  // Excel/CSV State
  const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
  const [csvDataVersion, setCsvDataVersion] = useState(0);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (!serviceId) return;
    if (csvFileUrl) {
      setShowTimerModal(false);
      return;
    }
    const stored = localStorage.getItem(`radiography-fixed-timer-${serviceId}`);
    if (stored !== null) {
      setHasTimer(stored === 'true');
      setShowTimerModal(false);
    } else {
      setShowTimerModal(true);
    }
  }, [serviceId, csvFileUrl]);

  // Close modal and set timer choice
  const handleTimerChoice = (choice: boolean) => {
    setHasTimer(choice);
    setShowTimerModal(false);
    // Store in localStorage so it persists across refreshes
    if (serviceId) {
      localStorage.setItem(`radiography-fixed-timer-${serviceId}`, String(choice));
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

        setDetails(data);

        // SRF date = order created at; Test date = QA test submitted at (or createdAt)
        const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
        const testDateSource = firstTest?.qatestSubmittedAt || firstTest?.createdAt;
        let testDate = "";
        let testDueDate = "";
        if (testDateSource) {
          const qaTestDate = new Date(testDateSource);
          testDate = qaTestDate.toISOString().split("T")[0];
          const dueDate = new Date(qaTestDate);
          dueDate.setFullYear(dueDate.getFullYear() + 2);
          testDueDate = dueDate.toISOString().split("T")[0];
        }

        setMinIssueDate(testDate || "");
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
          testDate: testDate,
          testDueDate: testDueDate,
          location: "", // Don't auto-fill location
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

        // Load existing report header data if available
        try {
          const reportRes = await getReportHeaderForRadiographyFixed(serviceId);
          if (reportRes.exists && reportRes.data) {
            const reportData = reportRes.data;
            // Update formData with existing report data
            // Note: testDate and testDueDate are calculated from QA test date, don't override them
            setFormData((prev) => ({
              ...prev,
              customerName: reportData.customerName || prev.customerName,
              address: reportData.address || prev.address,
              srfNumber: reportData.srfNumber || prev.srfNumber,
              srfDate: reportData.srfDate || prev.srfDate,
              reportULRNumber: reportData.reportULRNumber || prev.reportULRNumber,
              testReportNumber: reportData.testReportNumber || prev.testReportNumber,
              issueDate: reportData.issueDate || prev.issueDate,
              nomenclature: reportData.nomenclature || prev.nomenclature,
              make: reportData.make || prev.make,
              model: reportData.model || prev.model,
              slNumber: reportData.slNumber || prev.slNumber,
              category: reportData.category || prev.category,
              condition: reportData.condition || prev.condition,
              testingProcedureNumber: reportData.testingProcedureNumber || prev.testingProcedureNumber,
              pages: reportData.pages || prev.pages,
              // testDate and testDueDate are calculated from QA test date, keep calculated values
              location: reportData.location || prev.location, // Allow saved location to override
              temperature: reportData.temperature || prev.temperature,
              humidity: reportData.humidity || prev.humidity,
              engineerNameRPId: reportData.engineerNameRPId || prev.engineerNameRPId,
            }));
            if (reportData.testDate) setMinIssueDate(reportData.testDate);

            // Load existing notes, or use default if none exist
            if (reportData.notes && Array.isArray(reportData.notes) && reportData.notes.length > 0) {
              const notesTexts = reportData.notes.map((n: any) => n.text || n);
              setNotes(notesTexts);
            } else {
              setNotes(defaultNotes);
            }
          }
        } catch (reportErr) {
          console.error("Failed to load existing report:", reportErr);
          // Continue without existing report data
        }
      } catch (err: any) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [serviceId]);

  // Fetch radiation profile
  useEffect(() => {
    const load = async () => {
      const data = await getRadiationProfileWidthByServiceId(serviceId);
      setRadiationProfileTest(data);
    };
    if (serviceId) load();
  }, [serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- CSV/Excel Logic ---

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    // Normalize: if first column is 'Field Name' (mobile template), treat it as 'Key'
    const headers = rawHeaders.map(h => h.trim() === 'Field Name' ? 'Key' : h.trim() === 'Description / Instructions' ? 'Description' : h);
    const data: any[] = [];
    let currentTestName = '';

    const sectionMap: { [key: string]: string } = {
      '========== DEVICE DETAILS ==========': 'Device Details',
      '========== CONGRUENCE OF RADIATION ==========': 'Congruence Of Radiation',
      '========== CENTRAL BEAM ALIGNMENT ==========': 'Central Beam Alignment',
      '========== EFFECTIVE FOCAL SPOT ==========': 'Effective Focal Spot',
      '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy Of Irradiation Time',
      '========== TOTAL FILTRATION ==========': 'Total Filtration',
      // Template uses these exact headers:
      '========== ACCURACY OF OPERATING POTENTIAL (KVP) ==========': 'Accuracy Of Operating Potential',
      '========== LINEARITY OF MAS LOADING STATIONS ==========': 'Linearity Of mA Loading',
      '========== OUTPUT CONSISTENCY ==========': 'Consistency Of Radiation Output',
      // Legacy / alternate headers
      '========== LINEARITY OF MA LOADING ==========': 'Linearity Of mA Loading',
      '========== LINEARITY OF MAS LOADING ==========': 'Linearity Of mAs Loading',
      '========== CONSISTENCY OF RADIATION OUTPUT ==========': 'Consistency Of Radiation Output',
      '========== RADIATION LEAKAGE LEVEL ==========': 'Radiation Leakage Level',
      '========== RADIATION PROTECTION SURVEY ==========': 'Radiation Protection Survey',
    };

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const key = (row['Key'] || '').trim();
      if (key.startsWith('==========') && key.endsWith('==========')) {
        currentTestName = sectionMap[key.toUpperCase()] || '';
        continue;
      }

      if (currentTestName) {
        row['Test Name'] = currentTestName;
        data.push(row);
      }
    }
    return data;
  };

  // Parse Dental-style table CSV (RadiographyFixed_Template_WithTimer.csv) into the same
  // internal "Key"/"Value"/"Index"/"Test Name" rows used by processCSVData.
  const parseTableCSVToRows = (text: string): any[] => {
    const lines = text.split(/\r?\n/);
    const rows: any[] = [];

    const pushRow = (testName: string, key: string, value: string, index: number) => {
      rows.push({
        Key: key,
        Value: value,
        Index: String(Number.isFinite(index) ? index : 0),
        "Test Name": testName,
      });
    };

    let i = 0;
    while (i < lines.length) {
      const raw = lines[i].trim();
      if (!raw) { i++; continue; }

      if (raw.startsWith("TEST:")) {
        const label = raw.slice(5).trim();

        // 1) Congruence of Radiation
        if (label === "CONGRUENCE OF RADIATION") {
          const testName = "Congruence Of Radiation";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const mas = cond[5] || "";
          if (fcd) pushRow(testName, "TechniqueFactors_fcd", fcd, 0);
          if (kv) pushRow(testName, "TechniqueFactors_kv", kv, 0);
          if (mas) pushRow(testName, "TechniqueFactors_mas", mas, 0);

          let idx = 0;
          let j = i + 3; // skip header at i+2
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const dim = (cells[0] || "").trim();
            const obs = (cells[1] || "").trim();
            const edge = (cells[2] || "").trim();
            const tol = (cells[3] || "").trim();
            if (dim) {
              pushRow(testName, "Measurement_dimension", dim, idx);
              if (obs) pushRow(testName, "Measurement_observedShift", obs, idx);
              if (edge) pushRow(testName, "Measurement_edgeShift", edge, idx);
              if (tol) pushRow(testName, "Measurement_tolerance", tol, idx);
              idx++;
            }
            j++;
          }
          i = j;
          continue;
        }

        // 2) Central Beam Alignment
        if (label === "CENTRAL BEAM ALIGNMENT") {
          const testName = "Central Beam Alignment";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const mas = cond[5] || "";
          if (fcd) pushRow(testName, "TechniqueFactors_fcd", fcd, 0);
          if (kv) pushRow(testName, "TechniqueFactors_kv", kv, 0);
          if (mas) pushRow(testName, "TechniqueFactors_mas", mas, 0);

          const obsLine = (lines[i + 2] || "").split(",");
          const tiltVal = obsLine[1] || "";
          if (tiltVal) pushRow(testName, "ObservedTilt_value", tiltVal, 0);

          const tolOpLine = (lines[i + 3] || "").split(",");
          const tolOp = (tolOpLine[1] || "").trim();
          if (tolOp) pushRow(testName, "Tolerance_operator", tolOp, 0);
          const tolValLine = (lines[i + 4] || "").split(",");
          const tolVal = (tolValLine[1] || "").trim();
          if (tolVal) pushRow(testName, "Tolerance_value", tolVal, 0);
          i += 5;
          continue;
        }

        // 3) Effective Focal Spot
        if (label === "EFFECTIVE FOCAL SPOT") {
          const testName = "Effective Focal Spot";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          if (fcd) pushRow(testName, "FCD", fcd, 0);

          // tolerance lines
          let j = i + 2;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l) { j++; continue; }
            if (l.startsWith("Focus Type")) { break; }
            const cells = l.split(",");
            const labelCell = (cells[0] || "").trim();
            const valCell = (cells[1] || "").trim();
            if (labelCell === "Tolerance Small Multiplier") pushRow(testName, "ToleranceCriteria_tolSmallMul", valCell, 0);
            if (labelCell === "Tolerance Small Limit") pushRow(testName, "ToleranceCriteria_smallLimit", valCell, 0);
            if (labelCell === "Tolerance Medium Multiplier") pushRow(testName, "ToleranceCriteria_tolMediumMul", valCell, 0);
            if (labelCell === "Tolerance Medium Lower") pushRow(testName, "ToleranceCriteria_mediumLower", valCell, 0);
            if (labelCell === "Tolerance Medium Upper") pushRow(testName, "ToleranceCriteria_mediumUpper", valCell, 0);
            if (labelCell === "Tolerance Large Multiplier") pushRow(testName, "ToleranceCriteria_tolLargeMul", valCell, 0);
            j++;
          }

          // focal spot rows start where header "Focus Type..." is
          while (j < lines.length && !lines[j].trim().startsWith("Focus Type")) j++;
          j++; // first data row
          let idx = 0;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const fType = (cells[0] || "").trim();
            if (fType) {
              const sW = (cells[1] || "").trim();
              const sH = (cells[2] || "").trim();
              const mW = (cells[3] || "").trim();
              const mH = (cells[4] || "").trim();
              pushRow(testName, "FocalSpot_focusType", fType, idx);
              if (sW) pushRow(testName, "FocalSpot_statedWidth", sW, idx);
              if (sH) pushRow(testName, "FocalSpot_statedHeight", sH, idx);
              if (mW) pushRow(testName, "FocalSpot_measuredWidth", mW, idx);
              if (mH) pushRow(testName, "FocalSpot_measuredHeight", mH, idx);
              if (sW) pushRow(testName, "FocalSpot_statedNominal", sW, idx);
              if (mW) pushRow(testName, "FocalSpot_measuredNominal", mW, idx);
              idx++;
            }
            j++;
          }
          i = j;
          continue;
        }

        // 4) Accuracy of Irradiation Time
        if (label === "ACCURACY OF IRRADIATION TIME") {
          const testName = "Accuracy Of Irradiation Time";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const ma = cond[5] || "";
          if (fcd) pushRow(testName, "TestConditions_fcd", fcd, 0);
          if (kv) pushRow(testName, "TestConditions_kv", kv, 0);
          if (ma) pushRow(testName, "TestConditions_ma", ma, 0);

          let idx = 0;
          let j = i + 3; // data rows
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const setTime = (cells[0] || "").trim();
            const meas1 = (cells[1] || "").trim();
            const meas2 = (cells[2] || "").trim();
            if (setTime) {
              pushRow(testName, "IrradiationTime_setTime", setTime, idx);
              if (meas1) pushRow(testName, "IrradiationTime_measuredTime1", meas1, idx);
              if (meas2) pushRow(testName, "IrradiationTime_measuredTime2", meas2, idx);
              idx++;
            } else {
              const labelCell = (cells[0] || "").trim();
              const valCell = (cells[1] || "").trim();
              if (labelCell === "Tolerance Operator") pushRow(testName, "Tolerance_operator", valCell, 0);
              if (labelCell.startsWith("Tolerance Value")) pushRow(testName, "Tolerance_value", valCell, 0);
            }
            j++;
          }
          i = j;
          continue;
        }

        // 5) Total Filtration
        if (label === "TOTAL FILTRATION") {
          const testName = "Total Filtration";
          // tolerance and total filtration summary
          let j = i + 1;
          for (; j < lines.length; j++) {
            const l = lines[j].trim();
            if (!l) continue;
            if (l.startsWith("mA Station")) break;
            const cells = l.split(",");
            const labelCell = (cells[0] || "").trim();
            const valCell = (cells[1] || "").trim();
            if (labelCell === "Tolerance Sign") pushRow(testName, "Tolerance_sign", valCell, 0);
            if (labelCell.startsWith("Tolerance Value")) pushRow(testName, "Tolerance_value", valCell, 0);
            if (labelCell.startsWith("Total Filtration Measured")) pushRow(testName, "TotalFiltration_measured", valCell, 0);
            if (labelCell.startsWith("Total Filtration Required")) pushRow(testName, "TotalFiltration_required", valCell, 0);
            if (labelCell.startsWith("Total Filtration At kVp")) pushRow(testName, "TotalFiltration_atKvp", valCell, 0);
          }

          // mA station rows
          for (; j < lines.length; j++) {
            const l = lines[j].trim();
            if (!l) { continue; }
            if (l.startsWith("Applied kVp")) { j++; break; }
            const cells = l.split(",");
            const labelCell = (cells[0] || "").trim();
            const valCell = (cells[1] || "").trim();
            if (labelCell.startsWith("mA Station")) pushRow(testName, "mAStations", valCell, 0);
          }

          // measurement rows
          let idx = 0;
          for (; j < lines.length; j++) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const kvp = (cells[0] || "").trim();
            if (kvp) {
              pushRow(testName, "Measurement_appliedKvp", kvp, idx);
              if (cells[1] !== undefined) pushRow(testName, "Measurement_measuredValue1", cells[1], idx);
              if (cells[2] !== undefined) pushRow(testName, "Measurement_measuredValue2", cells[2], idx);
              if (cells[3] !== undefined) pushRow(testName, "Measurement_measuredValue3", cells[3], idx);
              idx++;
            }
          }
          i = j;
          continue;
        }

        // 6) Linearity of mA Loading
        if (label === "LINEARITY OF mA LOADING") {
          const testName = "Linearity Of mA Loading";
          const cond = (lines[i + 1] || "").split(",");
          const fcd = cond[1] || "";
          const kv = cond[3] || "";
          const time = cond[5] || "";
          if (fcd) pushRow(testName, "ExposureCondition_fcd", fcd, 0);
          if (kv) pushRow(testName, "ExposureCondition_kv", kv, 0);
          if (time) pushRow(testName, "ExposureCondition_time", time, 0);

          let idx = 0;
          let j = i + 3;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const ma = (cells[0] || "").trim();
            if (ma && !isNaN(Number(ma))) {
              pushRow(testName, "Table2_mAApplied", ma, idx);
              if (cells[1] !== undefined) pushRow(testName, "Table2_measuredOutput1", cells[1], idx);
              if (cells[2] !== undefined) pushRow(testName, "Table2_measuredOutput2", cells[2], idx);
              idx++;
            } else {
              const labelCell = (cells[0] || "").trim();
              const valCell = (cells[1] || "").trim();
              if (labelCell === "Tolerance Operator") pushRow(testName, "Tolerance_operator", valCell, 0);
              if (labelCell.startsWith("Tolerance Value")) pushRow(testName, "Tolerance_value", valCell, 0);
            }
            j++;
          }
          i = j;
          continue;
        }

        // 7) Consistency of Radiation Output
        if (label === "CONSISTENCY OF RADIATION OUTPUT") {
          const testName = "Consistency Of Radiation Output";
          const ffdLine = (lines[i + 1] || "").split(",");
          const ffd = ffdLine[1] || "";
          if (ffd) pushRow(testName, "FFD", ffd, 0);

          const dataLine = lines[i + 3] || "";
          const cells = dataLine.split(",");
          let idx = 0;
          const kv = (cells[0] || "").trim();
          const mas = (cells[1] || "").trim();
          if (kv) pushRow(testName, "Measurement_kv", kv, idx);
          if (mas) pushRow(testName, "Measurement_mas", mas, idx);
          if (cells[2] !== undefined) pushRow(testName, "Measurement_output1", cells[2], idx);
          if (cells[3] !== undefined) pushRow(testName, "Measurement_output2", cells[3], idx);

          // tolerance from next line(s)
          for (let j = i + 4; j < Math.min(lines.length, i + 8); j++) {
            const l = lines[j].trim();
            if (!l) break;
            const parts = l.split(",");
            const labelCell = (parts[0] || "").trim();
            const valCell = (parts[1] || "").trim();
            if (labelCell.startsWith("Tolerance")) pushRow(testName, "Tolerance", valCell, 0);
          }
          i += 6;
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
          if (fcd) pushRow(testName, "Settings_fcd", fcd, 0);
          if (kv) pushRow(testName, "Settings_kv", kv, 0);
          if (ma) pushRow(testName, "Settings_ma", ma, 0);
          if (time) pushRow(testName, "Settings_time", time, 0);
          if (workload) pushRow(testName, "Workload", workload, 0);

          const tolValLine = (lines[i + 2] || "").split(",");
          const tolVal = tolValLine[1] || "";
          if (tolVal) pushRow(testName, "Tolerance_value", tolVal, 0);
          const tolOpLine = (lines[i + 3] || "").split(",");
          const tolOp = tolOpLine[1] || "";
          if (tolOp) pushRow(testName, "Tolerance_operator", tolOp, 0);
          const tolTimeLine = (lines[i + 4] || "").split(",");
          const tolTime = tolTimeLine[1] || "";
          if (tolTime) pushRow(testName, "Tolerance_time", tolTime, 0);

          // location rows
          let idx = 0;
          let j = i + 6; // skip header at i+5
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const loc = (cells[0] || "").trim();
            if (loc) {
              pushRow(testName, "Leakage_location", loc, idx);
              if (cells[1] !== undefined) pushRow(testName, "Leakage_left", cells[1], idx);
              if (cells[2] !== undefined) pushRow(testName, "Leakage_right", cells[2], idx);
              if (cells[3] !== undefined) pushRow(testName, "Leakage_front", cells[3], idx);
              if (cells[4] !== undefined) pushRow(testName, "Leakage_back", cells[4], idx);
              if (cells[5] !== undefined) pushRow(testName, "Leakage_top", cells[5], idx);
              idx++;
            }
            j++;
          }
          i = j;
          continue;
        }

        // 9) Radiation Protection Survey
        if (label === "RADIATION PROTECTION SURVEY") {
          const testName = "Radiation Protection Survey";
          const header = (lines[i + 1] || "").split(",");
          const vals = (lines[i + 2] || "").split(",");
          const getVal = (label: string): string => {
            const idx = header.findIndex(h => h.trim() === label);
            return idx >= 0 ? (vals[idx] || "").trim() : "";
          };
          const surveyDate = getVal("Survey Date");
          const appliedCurrent = getVal("Applied Current (mA)");
          const appliedVoltage = getVal("Applied Voltage (kV)");
          const exposureTime = getVal("Exposure Time (s)");
          const workload = getVal("Workload (mA.min/week)");
          if (surveyDate) pushRow(testName, "surveyDate", surveyDate, 0);
          if (appliedCurrent) pushRow(testName, "appliedCurrent", appliedCurrent, 0);
          if (appliedVoltage) pushRow(testName, "appliedVoltage", appliedVoltage, 0);
          if (exposureTime) pushRow(testName, "exposureTime", exposureTime, 0);
          if (workload) pushRow(testName, "workload", workload, 0);

          // locations header at i+3, rows at i+4+
          let idx = 0;
          let j = i + 4;
          while (j < lines.length) {
            const l = lines[j].trim();
            if (!l || l.startsWith("TEST:")) break;
            const cells = l.split(",");
            const loc = (cells[0] || "").trim();
            if (loc) {
              const mR = (cells[1] || "").trim();
              const cat = (cells[2] || "").trim();
              pushRow(testName, "Location_location", loc, idx);
              if (mR) pushRow(testName, "Location_mRPerHr", mR, idx);
              if (cat) pushRow(testName, "Location_category", cat, idx);
              idx++;
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

  // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer hasTimer from Excel and skip timer modal
  const processCSVData = async (csvData: any[], applyConfigFromExcel?: boolean) => {
    try {
      setCsvUploading(true);
      const groupedData: { [key: string]: any[] } = {};

      csvData.forEach(row => {
        const testName = row['Test Name'];
        if (testName) {
          if (!groupedData[testName]) groupedData[testName] = [];
          groupedData[testName].push(row);
        }
      });

      if (applyConfigFromExcel && Object.keys(groupedData).length > 0) {
        const hasTimerSection = !!groupedData['Accuracy Of Irradiation Time'];
        setHasTimer(hasTimerSection);
        setShowTimerModal(false);
        if (serviceId) {
          localStorage.setItem(`radiography-fixed-timer-${serviceId}`, String(hasTimerSection));
        }
      }

      const newDataForComponents: any = {};

      // Device Details
      if (groupedData['Device Details']) {
        const details = groupedData['Device Details'];
        setFormData(prev => {
          const updated = { ...prev };
          details.forEach(row => {
            const key = row['Key'];
            const val = row['Value'];
            if (key in updated) (updated as any)[key] = val;
          });
          return updated;
        });
      }

      // Congruence
      if (groupedData['Congruence Of Radiation']) {
        const data = groupedData['Congruence Of Radiation'];
        const techniqueFactors: any[] = [];
        const measurements: any[] = [];
        data.forEach(row => {
          const key = row['Key'];
          const val = row['Value'];
          const idx = parseInt(row['Index']) || 0;
          if (key.startsWith('TechniqueFactors_')) {
            if (!techniqueFactors[idx]) techniqueFactors[idx] = {};
            techniqueFactors[idx][key.split('_')[1]] = val;
          } else if (key.startsWith('Measurement_')) {
            if (!measurements[idx]) measurements[idx] = {};
            measurements[idx][key.split('_')[1]] = val;
          }
        });
        newDataForComponents.congruence = { techniqueFactors, congruenceMeasurements: measurements };
      }

      // Central Beam Alignment
      if (groupedData['Central Beam Alignment']) {
        const data = groupedData['Central Beam Alignment'];
        const tech: any = {};
        const obs: any = {};
        const tol: any = {};
        data.forEach(row => {
          const key = row['Key'];
          const val = row['Value'];
          if (key.startsWith('TechniqueFactors_')) tech[key.split('_')[1]] = val;
          else if (key.startsWith('ObservedTilt_')) obs[key.split('_')[1]] = val;
          else if (key.startsWith('Tolerance_')) tol[key.split('_')[1]] = val;
        });
        newDataForComponents.centralBeamAlignment = { techniqueFactors: tech, observedTilt: obs, tolerance: tol };
      }

      // Focal Spot
      if (groupedData['Effective Focal Spot']) {
        const data = groupedData['Effective Focal Spot'];
        let fcd = '100';
        const tol: any = {};
        const spots: any[] = [];
        data.forEach(row => {
          const key = row['Key'];
          const val = row['Value'];
          const idx = parseInt(row['Index']) || 0;
          if (key === 'FCD') fcd = val;
          else if (key.startsWith('ToleranceCriteria_')) tol[key.split('_')[1]] = val;
          else if (key.startsWith('FocalSpot_')) {
            if (!spots[idx]) spots[idx] = {};
            spots[idx][key.split('_')[1]] = val;
          }
        });
        newDataForComponents.effectiveFocalSpot = { fcd, toleranceCriteria: tol, focalSpots: spots };
      }

      // Accuracy Of Irradiation Time
      if (groupedData['Accuracy Of Irradiation Time']) {
        const data = groupedData['Accuracy Of Irradiation Time'];
        const cond: any = {};
        const times: any[] = [];
        const tol: any = {};
        data.forEach(row => {
          const key = row['Key'];
          const val = row['Value'];
          const idx = parseInt(row['Index']) || 0;
          if (key.startsWith('TestConditions_')) cond[key.split('_')[1]] = val;
          else if (key.startsWith('IrradiationTime_')) {
            if (!times[idx]) times[idx] = {};
            const field = key.split('_')[1]; // setTime or measuredTime
            times[idx][field] = val;
          }
          else if (key.startsWith('Tolerance_')) tol[key.split('_')[1]] = val;
        });
        newDataForComponents.accuracyOfIrradiationTime = { testConditions: cond, irradiationTimes: times, tolerance: tol };
      }

      // Accuracy of Operating Potential (kVp) — from template section
      if (groupedData['Accuracy Of Operating Potential']) {
        const data = groupedData['Accuracy Of Operating Potential'];
        const measHeaders: string[] = [];
        const kVpMeasurements: any[] = [];
        const tol: any = {};
        const total: any = {};
        let currentBlock: any = null;
        data.forEach(row => {
          const key = (row['Key'] || '').trim();
          const val = (row['Value'] || '').trim();
          if (key === 'MeasHeader') {
            measHeaders.push(val);
          } else if (key === 'Measurement_AppliedKvp') {
            // Start a new measurement block
            currentBlock = { setKV: val, measurements: [] };
            kVpMeasurements.push(currentBlock);
          } else if (key.startsWith('Measurement_Meas') && currentBlock) {
            currentBlock.measurements.push(val);
          } else if (key.startsWith('Tolerance_')) {
            tol[key.split('_')[1]] = val;
          } else if (key.startsWith('TotalFiltration_')) {
            total[key.split('_')[1]] = val;
          }
        });
        // Convert to table2 format for AccuracyOfOperatingPotential component
        const table2 = kVpMeasurements.map(block => {
          const row: any = { setKV: block.setKV };
          if (block.measurements[0] !== undefined) row.ma10 = block.measurements[0];
          if (block.measurements[1] !== undefined) row.ma100 = block.measurements[1];
          if (block.measurements[2] !== undefined) row.ma200 = block.measurements[2];
          return row;
        });
        // Also store in totalFiltration format for TotalFilteration component
        const tfMeasurements = kVpMeasurements.map(block => ({
          appliedKvp: block.setKV,
          measuredValues: block.measurements,
        }));
        const tfTotalFiltration = {
          measured: total.Measured || total.measured || '',
          required: total.Required || total.required || '',
          atKvp: total.AtKvp || total.atKvp || '',
        };
        newDataForComponents.totalFiltration = {
          mAStations: measHeaders,
          measurements: tfMeasurements,
          tolerance: { sign: tol.Sign || tol.sign || '±', value: tol.Value || tol.value || '2.0' },
          totalFiltration: tfTotalFiltration,
        };
      }

      // Total Filtration / Accuracy of kVp (template: mAStations, Measurement_appliedKvp, Measurement_measuredValue1/2/3, TotalFiltration_*)
      if (groupedData['Total Filtration']) {
        const data = groupedData['Total Filtration'];
        const ma: string[] = [];
        const meas: any[] = [];
        const tol: any = {};
        const total: any = {};
        let currentMeasIdx = -1;
        let currentMeas: any = null;
        data.forEach(row => {
          const key = (row['Key'] || '').trim();
          const val = (row['Value'] || '').trim();
          const idx = parseInt(row['Index']) || 0;
          if (key === 'mAStations') {
            if (!ma.includes(val)) ma.push(val);
          } else if (key === 'Measurement_appliedKvp') {
            currentMeasIdx++;
            currentMeas = { appliedKvp: val, measuredValues: [] };
            meas[currentMeasIdx] = currentMeas;
          } else if (key.startsWith('Measurement_measuredValue') && currentMeas) {
            const m = key.match(/^Measurement_measuredValue(\d+)$/);
            if (m) {
              const mIdx = parseInt(m[1]) - 1;
              while (currentMeas.measuredValues.length <= mIdx) currentMeas.measuredValues.push('');
              currentMeas.measuredValues[mIdx] = val;
            }
          } else if (key.startsWith('Measurement_')) {
            if (!meas[idx]) meas[idx] = { appliedKvp: '', measuredValues: [] };
            const field = key.split('_')[1];
            const measMatch = field.match(/^Meas(\d+)$/);
            const measValMatch = field.match(/^measuredValue(\d+)$/);
            if (measMatch) {
              const mIdx = parseInt(measMatch[1]) - 1;
              meas[idx].measuredValues[mIdx] = val;
            } else if (measValMatch) {
              const mIdx = parseInt(measValMatch[1]) - 1;
              while (meas[idx].measuredValues.length <= mIdx) meas[idx].measuredValues.push('');
              meas[idx].measuredValues[mIdx] = val;
            } else {
              meas[idx][field] = val;
            }
          } else if (key.startsWith('Tolerance_')) tol[key.split('_')[1]] = val;
          else if (key.startsWith('TotalFiltration_')) total[key.split('_')[1]] = val;
        });
        newDataForComponents.totalFiltration = {
          mAStations: ma.length ? ma : ['50', '100'],
          measurements: meas.filter(Boolean),
          tolerance: { sign: tol.Sign || tol.sign || '±', value: tol.Value || tol.value || '2.0' },
          totalFiltration: { measured: total.Measured || total.measured || '', required: total.Required || total.required || '', atKvp: total.AtKvp || total.atKvp || '' },
        };
      }

      // Linearity of mA Loading (template: LINEARITY OF MA LOADING — ExposureCondition_*, Table2_mAApplied, Table2_measuredOutput1/2)
      if (groupedData['Linearity Of mA Loading']) {
        const data = groupedData['Linearity Of mA Loading'];
        const cond: any = {};
        const rows: any[] = [];
        let tol = '';
        let tolOp = '<=';
        let currentRow: any = null;
        let currentRowIdx = -1;
        data.forEach(row => {
          const key = (row['Key'] || '').trim();
          const val = (row['Value'] || '').trim();
          const idx = parseInt(row['Index']) || 0;
          if (key.startsWith('ExposureCondition_')) {
            cond[key.split('_')[1]] = val;
          } else if (key.startsWith('Table1_')) {
            cond[key.split('_')[1]] = val;
          } else if (key === 'Table2_mAApplied' || key === 'Table2_mAsApplied') {
            currentRowIdx++;
            currentRow = { mAApplied: val, measuredOutputs: [] };
            rows[currentRowIdx] = currentRow;
          } else if ((key.startsWith('Table2_measuredOutput') || key.startsWith('Table2_Meas')) && currentRow) {
            const m1 = key.match(/^Table2_measuredOutput(\d+)$/);
            const m2 = key.match(/^Table2_Meas(\d+)$/);
            const mIdx = m1 ? parseInt(m1[1]) - 1 : m2 ? parseInt(m2[1]) - 1 : -1;
            if (mIdx >= 0) {
              while (currentRow.measuredOutputs.length <= mIdx) currentRow.measuredOutputs.push('');
              currentRow.measuredOutputs[mIdx] = val;
            }
          } else if (key.startsWith('Table2_')) {
            if (!rows[idx]) rows[idx] = { mAApplied: '', measuredOutputs: [] };
            const field = key.split('_')[1];
            const measMatch = field.match(/^Meas(\d+)$/);
            if (measMatch) {
              const mIdx = parseInt(measMatch[1]) - 1;
              rows[idx].measuredOutputs[mIdx] = val;
            } else {
              rows[idx][field] = val;
            }
          } else if (key === 'Tolerance') {
            tol = val;
          } else if (key === 'ToleranceOperator') {
            tolOp = val;
          } else if (key.startsWith('Tolerance_')) {
            if (key === 'Tolerance_value') tol = val;
            else if (key === 'Tolerance_operator') tolOp = val;
          }
        });
        newDataForComponents.linearityOfMaLoading = { table1: cond, table2: rows.filter(Boolean), tolerance: tol, toleranceOperator: tolOp };
      }

      // Linearity of mAs Loading
      if (groupedData['Linearity Of mAs Loading']) {
        const data = groupedData['Linearity Of mAs Loading'];
        const cond: any = {};
        const rows: any[] = [];
        const tol: any = {};
        data.forEach(row => {
          const key = row['Key'];
          const val = row['Value'];
          const idx = parseInt(row['Index']) || 0;
          if (key.startsWith('Table1_')) cond[key.split('_')[1]] = val;
          else if (key.startsWith('Table2_')) {
            if (!rows[idx]) rows[idx] = { measuredOutputs: [] };
            const field = key.split('_')[1];
            const measMatch = field.match(/^Meas(\d+)$/);
            if (measMatch) {
              const mIdx = parseInt(measMatch[1]) - 1;
              rows[idx].measuredOutputs[mIdx] = val;
            } else {
              rows[idx][field] = val;
            }
          }
          else if (key.startsWith('Tolerance_')) tol[key.split('_')[1]] = val;
        });
        newDataForComponents.linearityOfMasLoading = { table1: cond, table2: rows, tolerance: tol.value, toleranceOperator: tol.operator };
      }

      // Reproducibility of Radiation Output / Consistency (template: FFD, Measurement_kv, Measurement_mas, Measurement_output1/2, Tolerance)
      if (groupedData['Consistency Of Radiation Output']) {
        const data = groupedData['Consistency Of Radiation Output'];
        let ffd = '100';
        const rows: any[] = [];
        let tol = '0.05';
        let tolOp = '<=';
        let currentRow: any = null;
        let currentRowIdx = -1;
        data.forEach(row => {
          const key = (row['Key'] || '').trim();
          const val = (row['Value'] || '').trim();
          const idx = parseInt(row['Index']) || 0;
          if (key === 'FFD') ffd = val;
          else if (key === 'Tolerance_Value' || key === 'Tolerance_value') tol = val;
          else if (key === 'Tolerance') tol = val;
          else if (key === 'Tolerance_Operator' || key === 'Tolerance_operator' || key === 'ToleranceOperator') tolOp = val;
          else if (key === 'Measurement_kv') {
            currentRowIdx++;
            currentRow = { kv: val, mas: '', outputs: [] };
            rows[currentRowIdx] = currentRow;
          } else if (key === 'Measurement_mas' && currentRow) {
            currentRow.mas = val;
          } else if (key.startsWith('Measurement_output') && currentRow) {
            const m = key.match(/^Measurement_output(\d+)$/);
            if (m) {
              const oIdx = parseInt(m[1]) - 1;
              while (currentRow.outputs.length <= oIdx) currentRow.outputs.push({ value: '' });
              currentRow.outputs[oIdx] = { value: val };
            }
          } else if (key === 'OutputRow_kV') {
            currentRowIdx++;
            currentRow = { kv: val, mas: '', outputs: [] };
            rows[currentRowIdx] = currentRow;
          } else if (key === 'OutputRow_mAs' && currentRow) {
            currentRow.mas = val;
          } else if (key.startsWith('OutputRow_Meas') && currentRow) {
            const measMatch = key.match(/^OutputRow_Meas(\d+)$/);
            if (measMatch) {
              const oIdx = parseInt(measMatch[1]) - 1;
              currentRow.outputs[oIdx] = { value: val };
            }
          } else if (key.startsWith('OutputRow_')) {
            if (!rows[idx]) rows[idx] = { kv: '', mas: '', outputs: [] };
            const field = key.split('_')[1];
            const measMatch = field.match(/^Meas(\d+)$/);
            if (measMatch) {
              const oIdx = parseInt(measMatch[1]) - 1;
              rows[idx].outputs[oIdx] = { value: val };
            } else {
              rows[idx][field] = val;
            }
          }
        });
        data.forEach(row => {
          if ((row['Key'] || '').trim() === 'Tolerance_Value' || (row['Key'] || '').trim() === 'Tolerance') tol = (row['Value'] || '').trim();
        });
        newDataForComponents.consistencyOfRadiationOutput = { ffd, outputRows: rows.filter(Boolean), tolerance: { value: tol, operator: tolOp } };
      }

      // Leakage
      if (groupedData['Radiation Leakage Level']) {
        const data = groupedData['Radiation Leakage Level'];
        const set: any = {};
        const rows: any[] = [];
        let wl = '';
        const tol: any = {};
        let currentLeakage: any = null;
        let currentLeakageIdx = -1;
        data.forEach(row => {
          const key = (row['Key'] || '').trim();
          const val = (row['Value'] || '').trim();
          const idx = parseInt(row['Index']) || 0;
          if (key.startsWith('Settings_')) set[key.split('_')[1]] = val;
          else if (key === 'Workload') wl = val;
          else if (key === 'LeakageMeasurement_Location') {
            // New leakage block
            currentLeakageIdx++;
            currentLeakage = { Location: val };
            rows[currentLeakageIdx] = currentLeakage;
          } else if (key.startsWith('LeakageMeasurement_') && currentLeakage) {
            const field = key.split('_')[1];
            currentLeakage[field] = val;
          } else if (key.startsWith('Leakage_')) {
            if (!rows[idx]) rows[idx] = {};
            rows[idx][key.split('_')[1]] = val;
          } else if (key === 'ToleranceValue') tol.value = val;
          else if (key === 'ToleranceOperator') tol.operator = val;
          else if (key.startsWith('Tolerance_')) tol[key.split('_')[1]] = val;
        });
        newDataForComponents.radiationLeakageLevel = { settings: set, leakageMeasurements: rows.filter(Boolean), workload: wl, toleranceValue: tol.value, toleranceOperator: tol.operator, toleranceTime: tol.time };
      }

      // Survey
      if (groupedData['Radiation Protection Survey']) {
        const data = groupedData['Radiation Protection Survey'];
        let date = '';
        let curr = '';
        let volt = '';
        let time = '';
        let wl = '';
        const locs: any[] = [];
        data.forEach(row => {
          const key = row['Key'];
          const val = row['Value'];
          const idx = parseInt(row['Index']) || 0;
          if (key === 'surveyDate') date = val;
          else if (key === 'appliedCurrent') curr = val;
          else if (key === 'appliedVoltage') volt = val;
          else if (key === 'exposureTime') time = val;
          else if (key === 'workload') wl = val;
          else if (key.startsWith('Location_')) {
            if (!locs[idx]) locs[idx] = {};
            locs[idx][key.split('_')[1]] = val;
          }
        });
        newDataForComponents.radiationProtectionSurvey = { surveyDate: date, appliedCurrent: curr, appliedVoltage: volt, exposureTime: time, workload: wl, locations: locs };
      }

      console.log('[CSV Debug] groupedData keys:', Object.keys(groupedData));
      console.log('[CSV Debug] newDataForComponents:', JSON.stringify(newDataForComponents, null, 2));
      setCsvDataForComponents(newDataForComponents);
      setCsvDataVersion(v => v + 1);
      toast.success('Excel data processed successfully!');
    } catch (err: any) {
      toast.error('Failed to process Excel data');
      console.error(err);
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (isExcel) {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          const csvData = parseCSV(csv);
          await processCSVData(csvData);
        } else {
          // CSV: support Dental-style table format (RadiographyFixed_Template_WithTimer.csv)
          const text = e.target?.result as string;
          const rows = parseTableCSVToRows(text);
          await processCSVData(rows);
        }
      } catch (error: any) {
        toast.error('Failed to read file');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export saved data to Excel (currently creates a basic workbook; can be expanded to include all test tables)
  const handleExportToExcel = async () => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    try {
      toast.loading('Exporting data to Excel...', { id: 'export-excel' });
      setCsvUploading(true);

      const exportData: Record<string, unknown> = {};

      // 0. Report Header
      try {
        const headerRes = await getReportHeaderForRadiographyFixed(serviceId);
        if (headerRes?.data || headerRes?.exists) {
          exportData.reportHeader = headerRes;
        }
      } catch (err) {
        console.log("Radiography Fixed report header not found or error:", err);
      }

      // 1. Accuracy of Irradiation Time
      try {
        const res = await getAccuracyOfIrradiationTimeByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.accuracyOfIrradiationTime = res;
      } catch (err) {
        console.log("Accuracy of Irradiation Time not found or error:", err);
      }

      // 2. Accuracy of Operating Potential
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.accuracyOfOperatingPotential = res;
      } catch (err) {
        console.log("Accuracy of Operating Potential not found or error:", err);
      }

      // 3. Total Filtration
      try {
        const res = await getTotalFiltrationByServiceIdForRadiographyFixed(serviceId);
        if (res && (res.data || res.totalFiltration || res.measurements)) {
          exportData.totalFiltration = res;
        }
      } catch (err) {
        console.log("Total Filtration not found or error:", err);
      }

      // 4. Central Beam Alignment
      try {
        const res = await getCentralBeamAlignmentByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.centralBeamAlignment = res;
      } catch (err) {
        console.log("Central Beam Alignment not found or error:", err);
      }

      // 5. Congruence of Radiation & Optical Field
      try {
        const res = await getCongruenceByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.congruence = res;
      } catch (err) {
        console.log("Congruence of Radiation not found or error:", err);
      }

      // 6. Effective Focal Spot
      try {
        const res = await getEffectiveFocalSpotByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.effectiveFocalSpot = res;
      } catch (err) {
        console.log("Effective Focal Spot not found or error:", err);
      }

      // 7. Linearity of mAs Loading
      try {
        const res = await getLinearityOfMasLoadingStationsByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.linearityOfMasLoading = res;
      } catch (err) {
        console.log("Linearity of mAs Loading not found or error:", err);
      }

      // 8. Output Consistency
      try {
        const res = await getOutputConsistencyByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.outputConsistency = res;
      } catch (err) {
        console.log("Output Consistency not found or error:", err);
      }

      // 9. Radiation Leakage Level
      try {
        const res = await getRadiationLeakageLevelByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.radiationLeakageLevel = res;
      } catch (err) {
        console.log("Radiation Leakage Level not found or error:", err);
      }

      // 10. Radiation Protection Survey
      try {
        const res = await getRadiationProtectionSurveyByServiceIdForRadiographyFixed(serviceId);
        if (res) exportData.radiationProtectionSurvey = res;
      } catch (err) {
        console.log("Radiation Protection Survey not found or error:", err);
      }

      // If no data collected, show message
      if (Object.keys(exportData).length === 0) {
        toast.error('No data found to export. Please save test data first.', { id: 'export-excel' });
        return;
      }
      const wb = createRadiographyFixedUploadableExcel(exportData as RadiographyFixedExportData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Radiography_Fixed_Test_Data_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success('Data exported successfully!', { id: 'export-excel' });
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data: ' + (error.message || 'Unknown error'), { id: 'export-excel' });
    } finally {
      setCsvUploading(false);
    }
  };

  // Auto-upload from CSV/Excel file URL (passed from ServiceDetails2 when status is complete)
  // Uses proxyFile so the request is authenticated and avoids CORS/401 redirect to login
  useEffect(() => {
    if (!csvFileUrl) return;
    const autoLoad = async () => {
      try {
        setCsvUploading(true);
        toast.loading('Auto-loading Excel data from file...', { id: 'auto-load' });
        const response = await proxyFile(csvFileUrl);
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(ws);
        const parsed = parseCSV(csv);
        await processCSVData(parsed, true);
        toast.success('Excel data auto-loaded!', { id: 'auto-load' });
      } catch (err: any) {
        console.error('Auto-upload failed:', err);
        toast.error(err?.message || 'Failed to auto-load Excel data', { id: 'auto-load' });
      } finally {
        setCsvUploading(false);
      }
    };
    autoLoad();
  }, [csvFileUrl]);

  // Check which test tables are not saved; returns list of display names.
  const getUnsavedTestNames = async (): Promise<string[]> => {
    // Backend can return: { success: true, data: document }, { success: true, data: { _id } }, { success: true, data: null }, or document with _id
    const isSaved = (raw: any): boolean => {
      if (raw == null) return false;
      if (typeof raw !== "object") return false;
      // Any success with non-null data (including update shape: { success: true, message: "...", data: { _id } })
      if (raw.success && raw.data != null) return true;
      // Minimal data shape: { data: { _id: "..." } } (e.g. from update response)
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
      { name: "Congruence of radiation & Optical Field", check: async () => { try { return isSaved(await getCongruenceByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
      { name: "Central Beam Alignment", check: async () => { try { return isSaved(await getCentralBeamAlignmentByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
      { name: "Effective Focal Spot Measurement", check: async () => { try { return isSaved(await getEffectiveFocalSpotByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
      {
        name: "Accuracy Of Operating Potential & Total Filtration",
        check: async () => {
          try {
            const [aop] = await Promise.all([
              // getAccuracyOfOperatingPotentialByServiceIdForRadiographyFixed(serviceId),
              getTotalFiltrationByServiceIdForRadiographyFixed(serviceId),
            ]);
            return isSaved(aop)
          } catch {
            return false;
          }
        },
      },
      { name: "Linearity (mA/mAs Loading)", check: async () => { try { return isSaved(await getLinearityOfMasLoadingStationsByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
      { name: "Output Consistency", check: async () => { try { return isSaved(await getOutputConsistencyByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
      { name: "Tube Housing Leakage", check: async () => { try { return isSaved(await getRadiationLeakageLevelByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
      { name: "Details Of Radiation Protection Survey", check: async () => { try { return isSaved(await getRadiationProtectionSurveyByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } } },
    ];
    if (hasTimer === true) {
      checks.push({
        name: "Accuracy Of Irradiation Time",
        check: async () => { try { return isSaved(await getAccuracyOfIrradiationTimeByServiceIdForRadiographyFixed(serviceId)); } catch { return false; } },
      });
    }
    const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
    return results.filter((r) => !r.saved).map((r) => r.name);
  };

  // In RadioFluro.tsx - handleSaveHeader function
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

  // MODAL POPUP — only when not coming from Excel URL (csvFileUrl)
  if (showTimerModal && hasTimer === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
          <p className="text-gray-600 mb-8">
            Does this Radiography (Fixed) unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Generate Radiography (Fixed) QA Test Report
        </h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          {/* <button
            onClick={() => {
              const templateName = hasTimer
                ? 'RadiographyFixed_Template_WithTimer.csv'
                : 'RadiographyFixed_Template_NoTimer.csv';
              window.open(`/templates/${templateName}`, '_blank');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
          >
            Download Template
          </button> */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={csvUploading}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium border border-green-200 disabled:opacity-50"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            {csvUploading ? 'Uploading...' : 'Import Excel'}
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={csvUploading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200 disabled:opacity-50"
          >
            {csvUploading ? 'Exporting...' : 'Export Excel'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
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
            navigate(`/admin/orders/view-service-report-radiography-fixed?serviceId=${serviceId}`);
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
                serviceId={serviceId}
                initialData={csvDataForComponents.congruence}
                csvDataVersion={csvDataVersion}
              />
            ),
          },
          {
            title: "Central Beam Alignment",
            component: <CentralBeamAlignment serviceId={serviceId} initialData={csvDataForComponents.centralBeamAlignment} csvDataVersion={csvDataVersion} />,
          },
          {
            title: "Effective Focal Spot Measurement",
            component: <EffectiveFocalSpot serviceId={serviceId} initialData={csvDataForComponents.effectiveFocalSpot} csvDataVersion={csvDataVersion} />,
          },

          // Timer Test — Only if user said YES
          ...(hasTimer === true
            ? [
              {
                title: "Accuracy Of Irradiation Time",
                component: <AccuracyOfIrradiationTime serviceId={serviceId} initialData={csvDataForComponents.accuracyOfIrradiationTime} csvDataVersion={csvDataVersion} />,
              },
            ]
            : []),

          {
            title: "Accuracy Of Operating Potential & Total Filtration",
            component: <TotalFilteration serviceId={serviceId} initialData={csvDataForComponents.totalFiltration} csvDataVersion={csvDataVersion} />,
          },

          // Linearity Test — Conditional
          ...(hasTimer === true
            ? [
              {
                title: "Linearity Of mA Loading",
                component: <LinearityOfMaLoading serviceId={serviceId} initialData={csvDataForComponents.linearityOfMaLoading} csvDataVersion={csvDataVersion} />,
              },
            ]
            : hasTimer === false
              ? [
                {
                  title: "Linearity Of mAs Loading",
                  component: <LinearityOfMasLoading serviceId={serviceId} initialData={csvDataForComponents.linearityOfMasLoading} csvDataVersion={csvDataVersion} />,
                },
              ]
              : []),

          {
            title: "Output Consistency",
            component: <ConsistencyOfRadiationOutput serviceId={serviceId} initialData={csvDataForComponents.consistencyOfRadiationOutput} csvDataVersion={csvDataVersion} />,
          },
          {
            title: "Tube Housing Leakage",
            component: <RadiationLeakageLevel serviceId={serviceId} initialData={csvDataForComponents.radiationLeakageLevel} csvDataVersion={csvDataVersion} />,
          },
          {
            title: "Details Of Radiation Protection Survey of the Installation",
            component: <RadiationProtectionSurvey serviceId={serviceId} initialData={csvDataForComponents.radiationProtectionSurvey} csvDataVersion={csvDataVersion} />,
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

export default RadiographyFixed;
