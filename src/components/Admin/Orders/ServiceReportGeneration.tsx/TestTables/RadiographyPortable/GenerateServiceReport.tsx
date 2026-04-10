// GenerateServiceReport.tsx for RadiographyPortable
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
  getReportHeaderForRadiographyPortable,
  proxyFile,
  getCongruenceByServiceIdForRadiographyPortable,
  getCentralBeamAlignmentByServiceIdForRadiographyPortable,
  getEffectiveFocalSpotByServiceIdForRadiographyPortable,
  getAccuracyOfIrradiationTimeByServiceIdForRadiographyPortable,
  getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable,
  getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable,
  getConsistencyOfRadiationOutputByServiceIdForRadiographyPortable,
  getRadiationLeakageLevelByServiceIdForRadiographyPortable,
} from "../../../../../../api";
import { createRadiographyPortableUploadableExcel, RadiographyPortableExportData } from "./exportRadiographyPortableToExcel";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import CongruenceOfRadiation from "./CongruenceOfRadiation";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalSpot from "./EffectiveFocalSpot";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import TotalFilteration from "./TotalFilteration";
import LinearityOfMasLoadingStations from "./LinearityOfMasLoadingStations";
import LinearityOfMaLoadingStations from "./LinearityOfMaLoadingStations";
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


const RadiographyPortable: React.FC<{ serviceId: string; qaTestDate?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, csvFileUrl }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false); // Will be set based on localStorage

  // State to store CSV data for components
  const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
  const [csvDataVersion, setCsvDataVersion] = useState(0); // Track CSV data updates to force re-render
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render of child components

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
    rpId: "",
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

  // Check localStorage for timer preference on mount. When csvFileUrl is provided (redirect from ServiceDetails2), skip modal — config will be set from Excel in processCSVData.
  useEffect(() => {
    if (!serviceId) return;
    if (csvFileUrl) {
      setShowTimerModal(false);
      return;
    }
    const stored = localStorage.getItem(`radiography-portable-timer-${serviceId}`);
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
      localStorage.setItem(`radiography-portable-timer-${serviceId}`, String(choice));
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

        // Pre-fill form from service details
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
          testDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
          testDueDate: "",
          location: data.hospitalAddress,
          temperature: "",
          humidity: "",
          engineerNameRPId: data.engineerAssigned?.name || "",
          rpId: data.rpId || "",
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
        const res = await getReportHeaderForRadiographyPortable(serviceId);
        if (res?.exists && res?.data) {
          // Update form data from report header
          setFormData(prev => ({
            ...prev,
            // category: res.data.category || prev.category,
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
            condition: res.data.condition || prev.condition,
            testingProcedureNumber: res.data.testingProcedureNumber || prev.testingProcedureNumber,
            testDate: res.data.testDate || prev.testDate,
            testDueDate: res.data.testDueDate || prev.testDueDate,
            location: res.data.location || prev.location,
            temperature: res.data.temperature || prev.temperature,
            humidity: res.data.humidity || prev.humidity,
            engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
            rpId: res.data.rpId || prev.rpId,
          }));

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
      return false;
    };
    const checks: { name: string; check: () => Promise<boolean> }[] = [
      { name: "Congruence of radiation & Optical Field", check: async () => { try { return isSaved(await getCongruenceByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
      { name: "Central Beam Alignment", check: async () => { try { return isSaved(await getCentralBeamAlignmentByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
      { name: "Effective Focal Spot Measurement", check: async () => { try { return isSaved(await getEffectiveFocalSpotByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
      { name: "Accuracy Of Operating Potential & Total Filtration", check: async () => { try { return isSaved(await getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
      { name: "Linearity Of mAs Loading Stations", check: async () => { try { return isSaved(await getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
      { name: "Output Consistency", check: async () => { try { return isSaved(await getConsistencyOfRadiationOutputByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
      { name: "Tube Housing Leakage", check: async () => { try { return isSaved(await getRadiationLeakageLevelByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } } },
    ];
    if (hasTimer === true) {
      checks.push({
        name: "Accuracy Of Irradiation Time",
        check: async () => { try { return isSaved(await getAccuracyOfIrradiationTimeByServiceIdForRadiographyPortable(serviceId)); } catch { return false; } },
      });
    }
    const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
    return results.filter((r) => !r.saved).map((r) => r.name);
  };

  const handleSaveHeader = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
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

  // Parse horizontal format into structured vertical data
  const parseHorizontalData = (rows: any[][]): any[] => {
    const data: any[] = [];
    let currentTestName = '';
    let currentTestNameBase = '';
    let headers: string[] = [];
    let isReadingTest = false;

    const testMarkerToInternalName: { [key: string]: string } = {
      'CONGRUENCE OF RADIATION & OPTICAL FIELD': 'Congruence of Radiation',
      'CONGRUENCE OF RADIATION & LIGHT FIELD': 'Congruence of Radiation',
      'CENTRAL BEAM ALIGNMENT': 'Central Beam Alignment',
      'EFFECTIVE FOCAL SPOT MEASUREMENT': 'Effective Focal Spot',
      'ACCURACY OF IRRADIATION TIME': 'Accuracy of Irradiation Time',
      'ACCURACY OF OPERATING POTENTIAL': 'Accuracy of Operating Potential',
      'LINEARITY OF mAs LOADING STATIONS': 'Linearity of mAs Loading Stations',
      'CONSISTENCY OF RADIATION OUTPUT': 'Consistency of Radiation Output',
      'REPRODUCIBILITY OF RADIATION OUTPUT (CONSISTENCY TEST)': 'Consistency of Radiation Output',
      'TUBE HOUSING LEAKAGE LEVEL': 'Radiation Leakage Level',
    };
    const markerUpperToInternal: Record<string, string> = Object.fromEntries(
      Object.entries(testMarkerToInternalName).map(([k, v]) => [String(k).trim().toUpperCase(), v])
    );

    const headerMap: { [test: string]: { [header: string]: string } } = {
      'Congruence of Radiation': {
        'FCD (cm)': 'Table1_FCD', 'kVp': 'Table1_kvp', 'mAs': 'Table1_mas', 'Field Size (cm)': 'Table1_fieldSize',
        'Deviation X (cm)': 'Table2_deviationX', 'Deviation Y (cm)': 'Table2_deviationY', 'Total Deviation (cm)': 'Table2_totalDeviation',
        'Shift in Edges (cm)': 'Table2_edgeShift', 'Edge Shift X (cm)': 'Table2_edgeShiftX', 'Edge Shift Y (cm)': 'Table2_edgeShiftY',
        'Shift in Edges X (cm)': 'Table2_edgeShiftX', 'Shift in Edges Y (cm)': 'Table2_edgeShiftY',
        'Tolerance (cm)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
      },
      'Central Beam Alignment': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv', 'mAs': 'Table1_mas',
        'Observed Tilt (deg)': 'Table2_observedTilt', 'Tolerance (deg)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
      },
      'Effective Focal Spot': {
        'FCD (cm)': 'Table1_fcd', 'Focus Type': 'Table2_focusType',
        'Stated Width': 'Table2_statedWidth', 'Stated Height': 'Table2_statedHeight',
        'Stated Nominal': 'Table2_statedNominal', 'Stated Focal Spot of Tube (f)': 'Table2_statedNominal',
        'Measured Width': 'Table2_measuredWidth', 'Measured Height': 'Table2_measuredHeight',
        'Measured Nominal': 'Table2_measuredNominal', 'Measured Focal Spot (Nominal)': 'Table2_measuredNominal',
        'Remarks': 'Table2_remark'
      },
      'Accuracy of Irradiation Time': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv', 'mA': 'Table1_ma',
        'Set Time (ms)': 'Table2_setTime', 'Measured Time (ms)': 'Table2_measuredTime', '% Error': 'Table2_percentError',
        'Tolerance (%)': 'Tolerance_Value', 'Tolerance Operator': 'Tolerance_operator', 'Remarks': 'Table2_remarks'
      },
      'Accuracy of Operating Potential': {
        'Time (ms)': 'Table1_time', 'Slice Thickness (mm)': 'Table1_sliceThickness',
        'Set kVp': 'Table2_setKV', '@ mA 10': 'Table2_ma10', '@ mA 100': 'Table2_ma100', '@ mA 200': 'Table2_ma200', 'Measured kVp': 'Table2_avgKvp',
        'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
      },
      'Linearity of mAs Loading Stations': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv',
        'mAs Range': 'Table2_mAsRange', 'Meas 1': 'Table2_meas1', 'Meas 2': 'Table2_meas2', 'Meas 3': 'Table2_meas3',
        'Average': 'Table2_average', 'X (mGy/mAs)': 'Table2_x',
        'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
      },
      'Consistency of Radiation Output': {
        'FCD (cm)': 'Table1_value', 'kVp': 'Table2_kv', 'kV': 'Table2_kv', 'mAs': 'Table2_mas',
        'Reading 1': 'Table2_reading1', 'Reading 2': 'Table2_reading2', 'Reading 3': 'Table2_reading3', 'Reading 4': 'Table2_reading4', 'Reading 5': 'Table2_reading5',
        'Meas 1': 'Table2_reading1', 'Meas 2': 'Table2_reading2', 'Meas 3': 'Table2_reading3', 'Meas 4': 'Table2_reading4', 'Meas 5': 'Table2_reading5',
        'Mean': 'Table2_average', 'COV (%)': 'Table2_cv', 'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
      },
      'Radiation Leakage Level': {
        'FCD (cm)': 'Table1_fcd', 'kVp': 'Table1_kv', 'mA': 'Table1_ma', 'Time (s)': 'Table1_time',
        'Workload': 'Workload', 'Location': 'Table2_location', 'Front (mR/h)': 'Table2_front', 'Back (mR/h)': 'Table2_back',
        'Left (mR/h)': 'Table2_left', 'Right (mR/h)': 'Table2_right', 'Top (mR/h)': 'Table2_top',
        'Tolerance (mR/h)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
      }
    };

    const sectionRowCounter: { [key: string]: number } = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].map(c => (c !== undefined && c !== null ? String(c) : '').trim());
      const firstCell = row[0];

      if (firstCell.startsWith('TEST: ')) {
        const rawTitle = firstCell.replace('TEST: ', '').trim();
        const internalBase = markerUpperToInternal[rawTitle.trim().toUpperCase()] || '';
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
          const header = (headers[cellIdx] || '').trim();
          let internalField = (headerMap[currentTestNameBase] || {})[header];
          // Congruence: flexible "Shift in Edges" match by header text
          if (!internalField && currentTestNameBase === 'Congruence of Radiation') {
            const h = header.toLowerCase();
            if (h.includes('shift') && h.includes('edge')) {
              internalField = 'Table2_edgeShift';
            }
            // Congruence: 9th column (index 8) = "Shift in Edges (cm)" when template has no header for it
            if (!internalField && cellIdx === 8) {
              internalField = 'Table2_edgeShift';
            }
          }
          const strVal = String(value ?? '').trim();
          const hasValue = strVal !== '';
          if (internalField && hasValue) {
            data.push({
              'Field Name': internalField,
              'Value': strVal,
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
    // Inject "Shift in Edges (cm)" column into Congruence section if missing (so 9th column is parsed)
    const edgeShiftHeader = 'Shift in Edges (cm)';
    for (let i = 0; i < jsonData.length; i++) {
      const row0 = String(jsonData[i]?.[0] ?? '');
      if (row0.startsWith('TEST: ') && row0.toUpperCase().includes('CONGRUENCE') && row0.toUpperCase().includes('RADIATION')) {
        const headerRow = jsonData[i + 1];
        if (Array.isArray(headerRow) && !headerRow.some((h: any) => /shift.*edge|edge.*shift/i.test(String(h).trim()))) {
          const insertAt = Math.max(0, headerRow.findIndex((h: any) => String(h).trim() === 'Total Deviation (cm)') + 1) || headerRow.length;
          headerRow.splice(insertAt, 0, edgeShiftHeader);
          const dataRow = jsonData[i + 2];
          if (Array.isArray(dataRow) && dataRow.length === headerRow.length - 1) {
            dataRow.splice(insertAt, 0, '');
          }
        }
        break;
      }
    }
    return parseHorizontalData(jsonData);
  };

  // Process CSV data and fill test tables.
  // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer hasTimer from Excel and skip timer modal.
  const processCSVData = async (csvData: any[], applyConfigFromExcel?: boolean) => {
    try {
      setCsvUploading(true);
      const groupedData: { [key: string]: any[] } = {};

      csvData.forEach((row) => {
        const testName = row['Test Name'];
        if (testName && testName.trim()) {
          if (!groupedData[testName]) {
            groupedData[testName] = [];
          }
          groupedData[testName].push(row);
        }
      });

      console.log('Radiography Portable CSV Data grouped:', groupedData);

      if (applyConfigFromExcel && Object.keys(groupedData).length > 0) {
        const hasTimerSection = !!(groupedData['Accuracy of Irradiation Time']?.length);
        setHasTimer(hasTimerSection);
        setShowTimerModal(false);
        if (serviceId) {
          localStorage.setItem(`radiography-portable-timer-${serviceId}`, String(hasTimerSection));
        }
      }

      // Build totalFiltration for TotalFilteration component (same as Radiography Fixed)
      const aop = groupedData['Accuracy of Operating Potential'];
      if (aop && Array.isArray(aop) && aop.length > 0) {
        const byRow: Record<number, { appliedKvp?: string; measuredValues?: string[] }> = {};
        let toleranceValue = '2.0';
        aop.forEach((r: any) => {
          const idx = r['Row Index'] ?? 0;
          if (!byRow[idx]) byRow[idx] = {};
          const field = r['Field Name'];
          const val = String(r['Value'] ?? '').trim();
          if (field === 'Table2_setKV') byRow[idx].appliedKvp = val;
          if (field === 'Table2_ma10') {
            if (!byRow[idx].measuredValues) byRow[idx].measuredValues = [];
            byRow[idx].measuredValues![0] = val;
          }
          if (field === 'Table2_ma100') {
            if (!byRow[idx].measuredValues) byRow[idx].measuredValues = [];
            byRow[idx].measuredValues![1] = val;
          }
          if (field === 'Table2_ma200') {
            if (!byRow[idx].measuredValues) byRow[idx].measuredValues = [];
            byRow[idx].measuredValues![2] = val;
          }
          if (field === 'Tolerance_Value') toleranceValue = val || '2.0';
        });
        const measurements = Object.keys(byRow)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => {
            const r = byRow[Number(k)];
            return {
              appliedKvp: r?.appliedKvp ?? '',
              measuredValues: r?.measuredValues ?? ['', '', ''],
            };
          });
        (groupedData as any).totalFiltration = {
          mAStations: ['10 mA', '100 mA', '200 mA'],
          measurements,
          tolerance: { sign: '±', value: toleranceValue },
        };
      }

      // Build accuracyOfIrradiationTime for component (same shape as Fixed)
      const aoiRows = groupedData['Accuracy of Irradiation Time'];
      if (aoiRows && Array.isArray(aoiRows) && aoiRows.length > 0) {
        const cond: any = {};
        const timesByRow: Record<number, { setTime?: string; measuredTime?: string }> = {};
        let tolValue = '10';
        let tolOperator = '<=';
        aoiRows.forEach((r: any) => {
          const field = r['Field Name'];
          const val = String(r['Value'] ?? '').trim();
          const rowIdx = r['Row Index'] ?? 0;
          if (field === 'Table1_fcd') cond.fcd = val;
          if (field === 'Table1_kv') cond.kv = val;
          if (field === 'Table1_ma') cond.ma = val;
          if (field === 'Table2_setTime') {
            if (!timesByRow[rowIdx]) timesByRow[rowIdx] = {};
            timesByRow[rowIdx].setTime = val;
          }
          if (field === 'Table2_measuredTime') {
            if (!timesByRow[rowIdx]) timesByRow[rowIdx] = {};
            timesByRow[rowIdx].measuredTime = val;
          }
          if (field === 'Tolerance_Value') tolValue = val || '10';
          if (field === 'Tolerance_operator') tolOperator = val || '<=';
        });
        const irradiationTimes = Object.keys(timesByRow)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => {
            const t = timesByRow[Number(k)];
            return { setTime: t?.setTime ?? '', measuredTime: t?.measuredTime ?? '' };
          });
        (groupedData as any).accuracyOfIrradiationTime = {
          testConditions: cond,
          irradiationTimes,
          tolerance: { operator: tolOperator, value: tolValue },
        };
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

  // Handle CSV file upload
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // When csvFileUrl is provided (e.g. from ServiceDetails2 after "complete" status or "Generate Report"),
  // fetch the Excel/CSV and auto-fill all test tables so the report is pre-filled.
  useEffect(() => {
    const fetchAndProcessFile = async () => {
      if (!csvFileUrl) {
        return;
      }

      console.log('Radiography Portable: Fetching file from URL (auto-fill from complete status):', csvFileUrl);

      try {
        setCsvUploading(true);

        const urlLower = csvFileUrl.toLowerCase();
        const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

        let csvData: any[] = [];

        if (isExcel) {
          console.log('Radiography Portable: Detected Excel file, fetching through proxy...');
          toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

          const response = await proxyFile(csvFileUrl);
          const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          console.log('Radiography Portable: Excel file parsed, sheets:', workbook.SheetNames);

          csvData = parseExcelToCSVFormat(workbook);
          console.log('Radiography Portable: Converted Excel to CSV format, rows:', csvData.length);
        } else {
          console.log('Radiography Portable: Detected CSV file, fetching through proxy...');
          toast.loading('Loading CSV data from file...', { id: 'csv-loading' });

          const response = await proxyFile(csvFileUrl);
          const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
          const text = await blob.text();
          console.log('Radiography Portable: CSV file fetched, length:', text.length);

          csvData = parseCSV(text);
        }

        console.log('Radiography Portable: Processed CSV data, total rows:', csvData.length);
        await processCSVData(csvData, true);
        toast.success('File loaded successfully!', { id: 'csv-loading' });
      } catch (error: any) {
        console.error('Radiography Portable: Error fetching/processing file:', error);
        toast.error('Failed to load file: ' + (error.message || 'Unknown error'), { id: 'csv-loading' });
      } finally {
        setCsvUploading(false);
      }
    };

    fetchAndProcessFile();
  }, [csvFileUrl]);

  // Export saved data to Excel (fetch all test tables from API, same as RadiographyFixed).
  const handleExportToExcel = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }
    try {
      toast.loading("Exporting data to Excel...", { id: "export-excel" });
      setCsvUploading(true);

      const exportData: RadiographyPortableExportData = {};

      try {
        const res = await getCongruenceByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.congruenceOfRadiation = res?.data ?? res;
      } catch (err) {
        console.log("Congruence not found or error:", err);
      }
      try {
        const res = await getCentralBeamAlignmentByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.centralBeamAlignment = res?.data ?? res;
      } catch (err) {
        console.log("Central Beam Alignment not found or error:", err);
      }
      try {
        const res = await getEffectiveFocalSpotByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.effectiveFocalSpot = res?.data ?? res;
      } catch (err) {
        console.log("Effective Focal Spot not found or error:", err);
      }
      try {
        const res = await getAccuracyOfIrradiationTimeByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.accuracyOfIrradiationTime = res?.data ?? res;
      } catch (err) {
        console.log("Accuracy of Irradiation Time not found or error:", err);
      }
      try {
        const res = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.accuracyOfOperatingPotential = res?.data ?? res;
      } catch (err) {
        console.log("Accuracy of Operating Potential not found or error:", err);
      }
      try {
        const res = await getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.linearityOfMasLoadingStations = res?.data ?? res;
      } catch (err) {
        console.log("Linearity of mAs Loading not found or error:", err);
      }
      try {
        const res = await getConsistencyOfRadiationOutputByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.consistencyOfRadiationOutput = res?.data ?? res;
      } catch (err) {
        console.log("Output Consistency not found or error:", err);
      }
      try {
        const res = await getRadiationLeakageLevelByServiceIdForRadiographyPortable(serviceId);
        if (res) exportData.radiationLeakageLevel = res?.data ?? res;
      } catch (err) {
        console.log("Radiation Leakage Level not found or error:", err);
      }

      if (Object.keys(exportData).length === 0) {
        toast.error("No data found to export. Please save test data first.", { id: "export-excel" });
        return;
      }

      const wb = createRadiographyPortableUploadableExcel(exportData, hasTimer || false);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Radiography_Portable_Test_Data_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Data exported successfully!", { id: "export-excel" });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data: " + (error.message || "Unknown error"), { id: "export-excel" });
    } finally {
      setCsvUploading(false);
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
            Does this Radiography (Portable) unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Generate Radiography (Portable) QA Test Report
      </h1>

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
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
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
            { label: "RP Id", name: "rpId" },
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
      <Notes />

      {/* Save & View */}
      <div className="my-10 flex justify-between items-center">
        <div className="flex gap-4">
          {/* Excel Upload Section */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={csvUploading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition flex items-center gap-2 ${csvUploading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              {csvUploading ? "Processing..." : "Import Excel"}
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={csvUploading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition flex items-center gap-2 ${csvUploading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 "
                }`}
            >
              {csvUploading ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
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
              navigate(`/admin/orders/view-service-report-radiography-portable?serviceId=${serviceId}`);
            }}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            View Generated Report
          </button>
        </div>
      </div>

      {/* QA TESTS - Now Conditional */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
        {[
          {
            title: "Congruence of radiation & Optical Field",
            component: <CongruenceOfRadiation serviceId={serviceId} csvData={csvDataForComponents['Congruence of Radiation']} refreshKey={refreshKey} />,
          },
          { title: "Central Beam Alignment", component: <CentralBeamAlignment serviceId={serviceId} csvData={csvDataForComponents['Central Beam Alignment']} refreshKey={refreshKey} /> },
          { title: "Effective Focal Spot Measurement", component: <EffectiveFocalSpot serviceId={serviceId} csvData={csvDataForComponents['Effective Focal Spot']} refreshKey={refreshKey} /> },

          // Timer Test — Only if user said YES
          ...(hasTimer === true
            ? [
              {
                title: "Accuracy Of Irradiation Time",
                component: <AccuracyOfIrradiationTime serviceId={serviceId} initialData={csvDataForComponents.accuracyOfIrradiationTime} csvDataVersion={csvDataVersion} />,
              },
            ]
            : []),

          { title: "Accuracy Of Operating Potential & Total Filtration", component: <TotalFilteration serviceId={serviceId} initialData={csvDataForComponents.totalFiltration} csvDataVersion={csvDataVersion} /> },
          // Linearity Test — Conditional on timer choice
          ...(hasTimer === true
            ? [
              {
                title: "Linearity Of mA Loading",
                component: <LinearityOfMaLoadingStations serviceId={serviceId} />,
              },
            ]
            : hasTimer === false
              ? [
                {
                  title: "Linearity Of mAs Loading Stations",
                  component: <LinearityOfMasLoadingStations serviceId={serviceId} csvData={csvDataForComponents['Linearity of mAs Loading Stations']} refreshKey={refreshKey} />,
                },
              ]
              : []),
          { title: "Consistency of Radiation Output", component: <ConsistencyOfRadiationOutput serviceId={serviceId} csvData={csvDataForComponents['Consistency of Radiation Output']} refreshKey={refreshKey} /> },
          { title: "Tube Housing Leakage", component: <RadiationLeakageLevel serviceId={serviceId} initialData={csvDataForComponents.radiationLeakageLevel} csvDataVersion={csvDataVersion} csvData={csvDataForComponents['Radiation Leakage Level']} refreshKey={refreshKey} /> },
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

export default RadiographyPortable;
