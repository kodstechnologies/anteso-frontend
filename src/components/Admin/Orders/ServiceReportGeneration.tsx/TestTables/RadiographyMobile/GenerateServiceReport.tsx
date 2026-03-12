// GenerateServiceReport.tsx for RadiographyMobile
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getDetails, getTools, saveReportHeader, getReportHeaderForRadiographyMobile, proxyFile } from "../../../../../../api";

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
        await processExcelData(csvData);
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
  useEffect(() => {
    if (serviceId) {
      const stored = localStorage.getItem(`radiography-mobile-timer-${serviceId}`);
      if (stored !== null) {
        setHasTimer(stored === "true");
        setShowTimerModal(false);
      } else {
        setShowTimerModal(true);
      }
    }
  }, [serviceId]);

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

        let testDate = "";
        let testDueDate = "";
        if (firstTest?.createdAt) {
          const qaDate = new Date(firstTest.createdAt);
          testDate = qaDate.toISOString().split("T")[0];
          const due = new Date(qaDate);
          due.setFullYear(due.getFullYear() + 2);
          testDueDate = due.toISOString().split("T")[0];
        }

        setFormData({
          customerName: data.hospitalName,
          address: data.hospitalAddress,
          srfNumber: data.srfNumber,
          srfDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
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

  // ── Save header ───────────────────────────────────────────────────────────
  const handleSaveHeader = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
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

  // Convert parsed Excel workbook to the Field Name / Value / Row Index / Test Name format
  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const data: any[] = [];
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    if (jsonData.length === 0) return data;

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

  // Process the parsed rows and dispatch to component state (single state update so all sections apply)
  const processExcelData = async (csvData: any[]) => {
    try {
      setExcelUploading(true);

      const grouped: Record<string, any[]> = {};
      csvData.forEach(row => {
        const name = (row["Test Name"] || "").trim();
        if (name) { if (!grouped[name]) grouped[name] = []; grouped[name].push(row); }
      });

      const nextState: Record<string, any> = {};

      // --- Accuracy of Operating Potential ---
      if (grouped["Accuracy of Operating Potential"]?.length) {
        try {
          const data = grouped["Accuracy of Operating Potential"];
          const measurements: any[] = [];
          const mAStations: string[] = [];
          let tolerance = { sign: "±", value: "2.0" };
          const totalFiltration = { measured: "", required: "2.5", atKvp: "" };
          data.forEach(row => {
            const field = (row["Field Name"] || "").trim();
            const value = (row["Value"] || "").trim();
            const idx = parseInt(row["Row Index"] || "0");
            if (field === "Tolerance_Sign") tolerance.sign = value;
            if (field === "Tolerance_Value") tolerance.value = value;
            if (field === "TotalFiltration_Measured") totalFiltration.measured = value;
            if (field === "TotalFiltration_Required") totalFiltration.required = value;
            if (field === "MeasHeader" && !mAStations.includes(value)) mAStations.push(value);
            if (field.startsWith("Measurement_")) {
              while (measurements.length <= idx) measurements.push({ appliedKvp: "", measuredValues: [], averageKvp: "", remarks: "" });
              const fieldName = field.replace("Measurement_", "");
              if (fieldName === "AppliedKvp") measurements[idx].appliedKvp = value;
              else if (fieldName === "AverageKvp") measurements[idx].averageKvp = value;
              else if (fieldName.startsWith("Meas")) {
                const colIdx = parseInt(fieldName.replace("Meas", "")) - 1;
                while (measurements[idx].measuredValues.length <= colIdx) measurements[idx].measuredValues.push("");
                measurements[idx].measuredValues[colIdx] = value;
              }
            }
          });
          nextState.accuracyOfOperatingPotential = {
            mAStations: mAStations.length > 0 ? mAStations : ["50 mA", "100 mA"],
            measurements,
            tolerance,
            totalFiltration,
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
              if (fn === "MeasuredWidth") focalSpots[idx].measuredWidth = value;
              if (fn === "MeasuredHeight") focalSpots[idx].measuredHeight = value;
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
        const text = await readAsText(file);
        const workbook = XLSX.read(text, { type: "string" });
        const csvData = parseExcelToCSVFormat(workbook);
        await processExcelData(csvData);
      }
    } catch (err: any) {
      toast.error(`Failed to read file: ${err?.message || "Unknown error"}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        {/* Upload Excel */}
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition cursor-pointer text-sm font-medium ${excelUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
          <CloudArrowUpIcon className="w-5 h-5" />
          {excelUploading ? "Uploading..." : "Upload Excel"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
            disabled={excelUploading}
          />
        </label>
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
            <input type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2" />
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
          onClick={() => navigate(`/admin/orders/view-service-report-radiography-mobile?serviceId=${serviceId}`)}
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
