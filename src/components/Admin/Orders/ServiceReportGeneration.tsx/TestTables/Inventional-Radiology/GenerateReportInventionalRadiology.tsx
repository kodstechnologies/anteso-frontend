// GenerateReport-InventionalRadiology.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  getReportHeaderForInventionalRadiology,
  proxyFile,
  getAccuracyOfIrradiationTimeByServiceId,
  getCentralBeamAlignmentByServiceIdForInventionalRadiology,
  getEffectiveFocalSpotByServiceIdForInventionalRadiology,
  getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology,
  getTotalFilterationByServiceIdForInventionalRadiology,
  getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology,
  getLinearityOfmAsLoadingByServiceIdForInventionalRadiology,
  getLowContrastResolutionByServiceIdForInventionalRadiology,
  getHighContrastResolutionByServiceIdForInventionalRadiology,
  getExposureRateTableTopByServiceIdForInventionalRadiology,
  getTubeHousingLeakageByServiceIdForInventionalRadiology,
  getRadiationProtectionSurveyByServiceIdForInventionalRadiology,
  getMeasurementOfMaLinearityByServiceIdForInventionalRadiology,
} from "../../../../../../api";

// Test-table imports
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalspotMeasurement from "./EffectiveFocalspotMeasurement";
import TotalFilteration from "./TotalFilterationForInventionalRadiology";
import LowContrastResolution from "./LowContrastResolutionInventionalRadiology";
import HighContrastResolution from "./HighContrastResolutionForInventionalRadiology";
import ExposureRateAtTableTop from "./ExposureRateAtTableTop";
import TubeHousingLeakage from "./TubeHousingLeakageForInventionalRadiology";
import RadiationProtectionInterventionalRadiology from "./RadiationProtectionInventionalRadiology";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
import MeasurementOfMaLinearity from "./measurementOfMaLinearity";

import { handleExportToExcel as exportToExcel } from "../../../../../../utils/exportInventionalRadiologyToExcel";
import { createInventionalRadiologySavedExcel, InventionalRadiologySavedExportData } from "./exportInventionalRadiologySavedToExcel";
// import EquipmentSettingForInterventionalRadiology from "./EquipmentSettingForInventionalRadiology";
// import MaxRadiationLevel from "./MaxRadiationLevel";
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

interface InventionalRadiologyProps {
  serviceId: string;
  qaTestDate?: string | null;
  csvFileUrl?: string | null;
}

const InventionalRadiology: React.FC<InventionalRadiologyProps> = ({ serviceId, qaTestDate, csvFileUrl: csvFileUrlProp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);


  // const [toUpload,setToUload]=useState<boolean>()
  // CSV/Excel related state
  const [csvUploading, setCsvUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [csvDataForComponents, setCsvDataForComponents] = useState<{ [key: string]: any[] }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Get csvFileUrl from prop (from GenericServiceTable) or location state (passed from ServiceDetails2 when complete / Generate Report)
  const csvFileUrl = csvFileUrlProp ?? location.state?.csvFileUrl ?? null;

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [originalTools, setOriginalTools] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTubeModal, setShowTubeModal] = useState(true); // Show tube selection modal first
  const [tubeType, setTubeType] = useState<'single' | 'double' | null>(null); // null = not selected yet

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
    reportULRNumber: "",
  });

  const [minIssueDate, setMinIssueDate] = useState(""); // QA test submitted date; issue date must be >= this
  // --- CSV/Excel Parsing Logic ---
  const parseHorizontalData = (rows: any[][]): any[] => {
    const data: any[] = [];
    let currentTestName = "";
    let currentTestNameBase = "";
    let headers: string[] = [];
    let isReadingTest = false;

    const markerUpperToInternal: { [key: string]: string } = {
      'ACCURACY OF IRRADIATION TIME': 'Accuracy Of Irradiation Time',
      'CENTRAL BEAM ALIGNMENT': 'Central Beam Alignment',
      'EFFECTIVE FOCAL SPOT SIZE': 'Effective Focal Spot Size',
      'ACCURACY OF OPERATING POTENTIAL': 'Accuracy Of Operating Potential',
      'TOTAL FILTRATION': 'Total Filtration',
      'CONSISTENCY OF RADIATION OUTPUT': 'Consistency Of Radiation Output',
      'MEASUREMENT OF MA LINEARITY': 'Measurement of mA Linearity',
      'LOW CONTRAST RESOLUTION': 'Low Contrast Resolution',
      'HIGH CONTRAST RESOLUTION': 'High Contrast Resolution',
      'EXPOSURE RATE AT TABLE TOP': 'Exposure Rate At Table Top',
      'TUBE HOUSING LEAKAGE': 'Tube Housing Leakage',
      'RADIATION PROTECTION SURVEY REPORT': 'Radiation Protection Survey Report',
    };

    const headerMap: { [key: string]: { [key: string]: string } } = {
      'Accuracy Of Irradiation Time': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv', 'mA': 'Table1_ma',
        'Set Time (mSec)': 'Table2_SetTime', 'Measured Time (mSec)': 'Table2_MeasuredTime',
        'Tolerance Operator': 'ToleranceOperator', 'Tolerance Value': 'ToleranceValue'
      },
      'Central Beam Alignment': {
        'kV': 'Table1_kv', 'mA': 'Table1_ma', 'Time': 'Table1_time',
        'Result': 'Table2_Result', 'Tolerance': 'Tolerance'
      },
      'Effective Focal Spot Size': {
        'kV': 'Table1_kv', 'mA': 'Table1_ma', 'Focal Spot Size': 'Table1_focalSpotSize',
        'Measured Dimension (W)': 'Table2_MeasuredWidth', 'Measured Dimension (L)': 'Table2_MeasuredLength',
        'Measured Nominal': 'Table2_MeasuredNominal', 'Measured Focal Spot (Nominal)': 'Table2_MeasuredNominal',
        'Tolerance Width': 'ToleranceWidth', 'Tolerance Length': 'ToleranceLength'
      },
      'Accuracy Of Operating Potential': {
        'mA': 'Table1_ma', 'Time': 'Table1_time',
        'Set kV': 'Table2_SetKV', 'Measured kV': 'Table2_MeasuredKV',
        'Tolerance Operator': 'ToleranceOperator', 'Tolerance Value': 'ToleranceValue'
      },
      'Total Filtration': {
        'Applied KV': 'Table1_kv', 'Applied MA': 'Table1_ma', 'Added Filtration': 'Table1_addedFiltration',
        'Measured TF': 'Table2_Result', 'Criteria': 'Criteria'
      },
      'Consistency Of Radiation Output': {
        'kV': 'Table1_kv', 'mA': 'Table1_ma', 'Time': 'Table1_time',
        'Exposure 1': 'Table2_Exp1', 'Exposure 2': 'Table2_Exp2', 'Exposure 3': 'Table2_Exp3',
        'Exposure 4': 'Table2_Exp4', 'Exposure 5': 'Table2_Exp5',
        'Average': 'Table2_Average', 'COV': 'Table2_COV', 'Tolerance': 'Tolerance'
      },
      // Match CTScan Measurement of mA Linearity component field names
      'Measurement of mA Linearity': {
        'kVp': 'Table1_kvp',
        'Slice Thickness (mm)': 'Table1_SliceThickness',
        'Time (ms)': 'Table1_Time',
        'mA Applied': 'Table2_mAsApplied',
        'Meas 1': 'Table2_Result_0',
        'Meas 2': 'Table2_Result_1',
        'Meas 3': 'Table2_Result_2',
        'Meas 4': 'Table2_Result_3',
        'Meas 5': 'Table2_Result_4',
        'Tolerance': 'Tolerance',
      },
      'Low Contrast Resolution': {
        'kV': 'Table1_kv', 'mA': 'Table1_ma', 'Time': 'Table1_time',
        'Observed Resolution': 'Table1_smallestHoleSize', 'Criteria': 'Table1_recommendedStandard'
      },
      'High Contrast Resolution': {
        'kV/mAs': 'Table1_kvmAs',
        'Measured Resolution': 'Table1_measuredLpPerMm', 'Criteria': 'Table1_recommendedStandard'
      },
      'Exposure Rate At Table Top': {
        'kV': 'Table1_kv', 'mA': 'Table1_ma',
        'Mode': 'Table2_Mode', 'Measured Rate': 'Table2_MeasuredRate', 'Criteria': 'Criteria'
      },
      'Tube Housing Leakage': {
        'kV': 'Table1_kv', 'mA': 'Table1_ma', 'Time': 'Table1_time', 'FCD (cm)': 'Table1_fcd', 'Workload': 'Table1_workload',
        'Location': 'Table1_Location',
        'Left': 'Table1_Left', 'Right': 'Table1_Right', 'Front': 'Table1_Front', 'Back': 'Table1_Back', 'Top': 'Table1_Top',
        'Tolerance Operator': 'ToleranceOperator', 'Tolerance Value': 'Table1_toleranceValue'
      },
      'Radiation Protection Survey Report': {
        'Location': 'Table1_location', 'mR/hr': 'Table1_mRPerHr', 'Category': 'Table1_category',
        'Applied Voltage': 'Table1_appliedVoltage', 'Applied Current': 'Table1_appliedCurrent', 'Exposure Time': 'Table1_exposureTime',
        'Survey Date': 'Table1_surveyDate', 'Calibration Valid': 'Table1_hasValidCalibration', 'Workload': 'Table1_workload'
      }
    };

    const sectionRowCounter: { [key: string]: number } = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].map(c => String(c || '').trim());
      const firstCell = row[0];

      if (firstCell.startsWith('TEST: ')) {
        // Always reset state when we see a new TEST: marker
        isReadingTest = false;
        headers = [];

        const rawTitle = firstCell.replace('TEST: ', '').trim();
        let tubeSuffix = '';
        let baseTitle = rawTitle;

        if (/\bTUBE\s*A\b/i.test(rawTitle) || /\bFRONTAL\b/i.test(rawTitle)) {
          tubeSuffix = ' - Frontal';
          baseTitle = rawTitle.replace(/\s*-\s*TUBE\s*A\s*$/i, '').replace(/\s*-\s*FRONTAL\s*$/i, '').trim();
        } else if (/\bTUBE\s*B\b/i.test(rawTitle) || /\bLATERAL\b/i.test(rawTitle)) {
          tubeSuffix = ' - Lateral';
          baseTitle = rawTitle.replace(/\s*-\s*TUBE\s*B\s*$/i, '').replace(/\s*-\s*LATERAL\s*$/i, '').trim();
        }

        const internalBase = markerUpperToInternal[baseTitle.trim().toUpperCase()] || '';
        currentTestNameBase = internalBase;
        currentTestName = internalBase ? `${internalBase}${tubeSuffix}` : '';
        isReadingTest = !!internalBase;
        headers = [];
        if (currentTestName) sectionRowCounter[currentTestName] = 0;
        if (!internalBase) {
          console.warn(`[IR CSV] Unknown test marker: "${baseTitle.trim().toUpperCase()}"`);
        }
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
    console.log('[IR CSV] Parsed field count:', data.length, 'Tests found:', [...new Set(data.map(d => d['Test Name']))]);
    return data;
  };

  // Map export template Component names -> internal Test Name (single tube)
  const componentToTestName: { [key: string]: string } = {
    'AccuracyOfIrradiationTime': 'Accuracy Of Irradiation Time',
    'CentralBeamAlignment': 'Central Beam Alignment',
    'EffectiveFocalSpot': 'Effective Focal Spot Size',
    'AccuracyOfOperatingPotential': 'Accuracy Of Operating Potential',
    'TotalFilteration': 'Total Filtration',
    'ConsistencyOfRadiationOutput': 'Consistency Of Radiation Output',
    'LinearityOfmAsLoading': 'Linearity Of mAs Loading',
    'MeasurementOfMaLinearity': 'Measurement of mA Linearity',
    'ExposureRateAtTableTop': 'Exposure Rate At Table Top',
    'TubeHousingLeakage': 'Tube Housing Leakage',
    'RadiationProtectionInterventionalRadiology': 'Radiation Protection Survey Report',
    'HighContrastResolution': 'High Contrast Resolution',
    'LowContrastResolution': 'Low Contrast Resolution',
  };

  // Normalize field names from export template to what components expect
  const normalizeFieldName = (component: string, fieldName: string, rowIndex: string | number): string => {
    const idx = typeof rowIndex === 'string' ? parseInt(rowIndex, 10) : rowIndex;
    if (component === 'EffectiveFocalSpot') {
      if (fieldName === 'MeasuredDimension1') return 'Table2_MeasuredWidth';
      if (fieldName === 'MeasuredDimension2') return 'Table2_MeasuredLength';
      if (fieldName === 'MeasuredNominal') return 'Table2_MeasuredNominal';
    }
    if (component === 'ConsistencyOfRadiationOutput') {
      if (fieldName === 'Table1_fdd') return 'Table1_fcd';
      if (fieldName === 'Table1_mAs') return 'Table1_mas';
      if (fieldName === 'Table1_Output') return `Table1_Meas${(isNaN(idx) ? 0 : idx) + 1}`;
    }
    if (component === 'TotalFilteration') {
      if (fieldName === 'Table2_Output') return 'Table2_MeasuredKV';
      if (fieldName === 'Table2_Thickness') return 'Table1_totalFiltration';
      if (fieldName === 'Table1_kv') return 'Table2_SetKV';
    }
    if (component === 'HighContrastResolution') {
      if (fieldName === 'MeasuredLpPerMm') return 'Table1_measuredLpPerMm';
      if (fieldName === 'RecommendedStandard') return 'Table1_recommendedStandard';
      if (fieldName === 'Tolerance') return 'Table1_tolerance';
    }
    if (component === 'LowContrastResolution') {
      if (fieldName === 'SmallestHoleSize') return 'Table1_smallestHoleSize';
      if (fieldName === 'RecommendedStandard') return 'Table1_recommendedStandard';
      if (fieldName === 'Tolerance') return 'Table1_tolerance';
    }
    return fieldName;
  };

  const parseVerticalData = (rows: any[][]): any[] => {
    if (rows.length < 2) return [];
    const headerRow = rows[0].map((c: any) => String(c || '').trim());
    const compIdx = headerRow.findIndex((h: string) => /component/i.test(h));
    const fieldIdx = headerRow.findIndex((h: string) => /field\s*name/i.test(h));
    const rowIdx = headerRow.findIndex((h: string) => /row\s*index/i.test(h));
    const valIdx = headerRow.findIndex((h: string) => /value/i.test(h) && !/field/i.test(h));
    if (compIdx < 0 || fieldIdx < 0 || valIdx < 0) return [];
    const ri = rowIdx >= 0 ? rowIdx : fieldIdx;
    const data: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].map((c: any) => String(c ?? '').trim());
      const comp = row[compIdx]?.trim() || '';
      const baseComp = comp.replace(/\s*-\s*(Frontal|Lateral|TUBE\s*A|TUBE\s*B)$/i, '').trim();
      let testName = componentToTestName[baseComp] || '';
      if (/Frontal|TUBE\s*A/i.test(comp)) testName = testName ? `${testName} - Frontal` : '';
      if (/Lateral|TUBE\s*B/i.test(comp)) testName = testName ? `${testName} - Lateral` : '';
      if (!testName) continue;
      const fieldName = row[fieldIdx] || '';
      const value = row[valIdx] ?? '';
      if (!fieldName) continue;
      const rowIndex = rowIdx >= 0 ? (row[ri] || '0') : '0';
      const normalizedField = normalizeFieldName(baseComp, fieldName, rowIndex);
      data.push({
        'Field Name': normalizedField,
        'Value': value,
        'Row Index': rowIndex,
        'Test Name': testName,
      });
    }
    return data;
  };

  const parseCSV = (text: string): any[] => {
    const normalized = text.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(line => line.split(',').map(c => String(c || '').trim()));
    const asRows = lines as any[][];
    const vertical = parseVerticalData(asRows);
    if (vertical.length > 0) return vertical;
    return parseHorizontalData(asRows);
  };

  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    const vertical = parseVerticalData(jsonData);
    if (vertical.length > 0) return vertical;
    return parseHorizontalData(jsonData);
  };

  // Process CSV data and populate component states.
  // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer tubeType (single vs double) from Excel and skip tube modal.
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

      console.log('IR CSV Data grouped:', groupedData);

      if (applyConfigFromExcel && Object.keys(groupedData).length > 0) {
        const keys = Object.keys(groupedData);
        const hasDoubleTube = keys.some((k) => / - Frontal\s*$/i.test(k) || / - Lateral\s*$/i.test(k));
        const inferredType: 'single' | 'double' = hasDoubleTube ? 'double' : 'single';
        setTubeType(inferredType);
        setShowTubeModal(false);
        localStorage.setItem(`inventional_radiology_tube_type_${serviceId}`, inferredType);
      }

      setCsvDataForComponents(groupedData);
      setRefreshKey(prev => prev + 1);
      toast.success('CSV/Excel data loaded successfully!');
    } catch (error: any) {
      console.error('Error processing CSV data:', error);
      toast.error('Failed to process data: ' + (error.message || 'Unknown error'));
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
      toast.error('Failed to upload file', { id: 'csv-upload' });
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportTemplate = () => {
    exportToExcel(details, tools);
  };

  const handleExportSavedData = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }
    try {
      toast.loading("Exporting data to Excel...", { id: "export-excel" });
      setIsExporting(true);
      const tubeId = tubeType === "single" ? null : "frontal";
      const exportData: InventionalRadiologySavedExportData & { reportHeader?: any } = {};

      try {
        const headerRes = await getReportHeaderForInventionalRadiology(serviceId, tubeId);
        if (headerRes?.data || headerRes?.exists) exportData.reportHeader = headerRes;
      } catch (err) {
        console.log("Report header not found or error:", err);
      }

      const fetchTest = async (fn: () => Promise<any>) => {
        try {
          const res = await fn();
          return res ?? null;
        } catch {
          return null;
        }
      };

      exportData.accuracyOfIrradiationTime = await fetchTest(() => getAccuracyOfIrradiationTimeByServiceId(serviceId, tubeId));
      exportData.centralBeamAlignment = await fetchTest(() => getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.effectiveFocalSpot = await fetchTest(() => getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.accuracyOfOperatingPotential = await fetchTest(() => getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.totalFiltration = await fetchTest(() => getTotalFilterationByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.consistencyOfRadiationOutput = await fetchTest(() => getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.linearityOfMasLoading = await fetchTest(() => getLinearityOfmAsLoadingByServiceIdForInventionalRadiology(serviceId));
      exportData.lowContrastResolution = await fetchTest(() => getLowContrastResolutionByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.highContrastResolution = await fetchTest(() => getHighContrastResolutionByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.exposureRateTableTop = await fetchTest(() => getExposureRateTableTopByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.tubeHousingLeakage = await fetchTest(() => getTubeHousingLeakageByServiceIdForInventionalRadiology(serviceId, tubeId));
      exportData.radiationProtectionSurvey = await fetchTest(() => getRadiationProtectionSurveyByServiceIdForInventionalRadiology(serviceId));

      const hasData = Object.keys(exportData).filter((k) => k !== "reportHeader").some((k) => exportData[k] != null);
      if (!hasData) {
        toast.error("No data found to export. Please save test data first.", { id: "export-excel" });
        return;
      }
      const wb = createInventionalRadiologySavedExcel(exportData as InventionalRadiologySavedExportData);
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Inventional_Radiology_Test_Data_${timestamp}.xlsx`);
      toast.success("Data exported successfully!", { id: "export-excel" });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data: " + (error?.message || "Unknown error"), { id: "export-excel" });
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-fill effect when csvFileUrl is present
  useEffect(() => {
    const fetchAndProcessFile = async () => {
      if (!csvFileUrl) return;

      try {
        setCsvUploading(true);
        const urlLower = csvFileUrl.toLowerCase();
        const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

        toast.loading('Loading data from file...', { id: 'csv-loading' });
        const response = await proxyFile(csvFileUrl);
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);

        let csvData: any[] = [];
        if (isExcel) {
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          csvData = parseExcelToCSVFormat(workbook);
        } else {
          const text = await blob.text();
          csvData = parseCSV(text);
        }

        await processCSVData(csvData, true);
        toast.success('File loaded successfully!', { id: 'csv-loading' });
      } catch (error: any) {
        console.error('Error fetching file:', error);
        toast.error('Failed to load file', { id: 'csv-loading' });
      } finally {
        setCsvUploading(false);
      }
    };

    fetchAndProcessFile();
  }, [csvFileUrl]);
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

  useEffect(() => {
    if (!serviceId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [detRes, toolRes] = await Promise.all([
          getDetails(serviceId),
          getTools(serviceId),
        ]);

        const data = detRes.data;
        const firstTest = data.qaTests?.[0];
        setDetails(data);

        const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
        const testDateSource = firstTest?.qatestSubmittedAt || firstTest?.createdAt;
        const testDateStr = testDateSource ? new Date(testDateSource).toISOString().split("T")[0] : "";
        let testDueDateStr = "";
        if (testDateStr) {
          const d = new Date(testDateStr);
          d.setFullYear(d.getFullYear() + 2);
          testDueDateStr = d.toISOString().split("T")[0];
        }

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
          rpId: data.rpId || "",
          category: "",
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
        setOriginalTools(toolRes.data.toolsAssigned || []);

        // Load existing report header data if available
        try {
          const reportRes = await getReportHeaderForInventionalRadiology(serviceId);
          if (reportRes.exists && reportRes.data) {
            const reportData = reportRes.data;
            // Update formData with existing report data
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
              testDate: reportData.testDate || prev.testDate,
              testDueDate: reportData.testDueDate || prev.testDueDate,
              location: reportData.location || prev.location,
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
        console.error(err);
        setError(err?.message ?? "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
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

  // Handle tube type selection
  const handleTubeTypeSelection = (type: 'single' | 'double') => {
    setTubeType(type);
    setShowTubeModal(false);
    // Save tube type to localStorage
    localStorage.setItem(`inventional_radiology_tube_type_${serviceId}`, type);
  };

  // Load saved tube type on mount (if exists). When csvFileUrl is provided (redirect from ServiceDetails2), skip modal — config will be set from Excel in processCSVData.
  useEffect(() => {
    if (!serviceId) return;

    if (csvFileUrl) {
      setShowTubeModal(false);
      return;
    }

    // Load saved tube type
    const savedTubeType = localStorage.getItem(`inventional_radiology_tube_type_${serviceId}`);
    if (savedTubeType === 'single' || savedTubeType === 'double') {
      setTubeType(savedTubeType as 'single' | 'double');
      setShowTubeModal(false);
    } else {
      // No saved tube type, show tube selection modal first
      setShowTubeModal(true);
    }
  }, [serviceId, csvFileUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (Array.isArray((data as any).measurements) && (data as any).measurements.length > 0) return true;
    if (Array.isArray((data as any).irradiationTimes) && (data as any).irradiationTimes.length > 0) return true;
    if (Array.isArray((data as any).outputRows) && (data as any).outputRows.length > 0) return true;
    if (Array.isArray((data as any).leakageMeasurements) && (data as any).leakageMeasurements.length > 0) return true;
    if ((data as any).totalFiltration != null && typeof (data as any).totalFiltration === "object") return true;
    if (Array.isArray((data as any).testRows) && (data as any).testRows.length > 0) return true;
    if (Array.isArray((data as any).exposureRateRows) && (data as any).exposureRateRows.length > 0) return true;
    if (Array.isArray((data as any).locations) && (data as any).locations.length > 0) return true;
    return false;
  };

  const getUnsavedTestNames = async (): Promise<string[]> => {
    if (!tubeType) return [];
    const run = (name: string, fn: () => Promise<any>) => ({ name, check: async () => { try { return isSaved(await fn()); } catch { return false; } } });
    const checks: { name: string; check: () => Promise<boolean> }[] = [];

    if (tubeType === "single") {
      const tid = null;
      checks.push(run("Accuracy of Irradiation Time", () => getAccuracyOfIrradiationTimeByServiceId(serviceId, tid)));
      checks.push(run("Central Beam Alignment", () => getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Effective Focal Spot Size", () => getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Total Filtration", () => getTotalFilterationByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Consistency of Radiation Output", () => getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Measurement of mA Linearity", () => getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Low Contrast Resolution", () => getLowContrastResolutionByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("High Contrast Resolution", () => getHighContrastResolutionByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Exposure Rate at Table Top", () => getExposureRateTableTopByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Tube Housing Leakage", () => getTubeHousingLeakageByServiceIdForInventionalRadiology(serviceId, tid)));
      checks.push(run("Radiation Protection Survey Report", () => getRadiationProtectionSurveyByServiceIdForInventionalRadiology(serviceId)));
    } else {
      checks.push(run("Accuracy of Irradiation Time - Frontal", () => getAccuracyOfIrradiationTimeByServiceId(serviceId, "frontal")));
      checks.push(run("Central Beam Alignment - Frontal", () => getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Effective Focal Spot Size - Frontal", () => getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Total Filtration - Frontal", () => getTotalFilterationByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Consistency of Radiation Output - Frontal", () => getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Measurement of mA Linearity - Frontal", () => getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Low Contrast Resolution - Frontal", () => getLowContrastResolutionByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("High Contrast Resolution - Frontal", () => getHighContrastResolutionByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Exposure Rate at Table Top - Frontal", () => getExposureRateTableTopByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Tube Housing Leakage - Frontal", () => getTubeHousingLeakageByServiceIdForInventionalRadiology(serviceId, "frontal")));
      checks.push(run("Accuracy of Irradiation Time - Lateral", () => getAccuracyOfIrradiationTimeByServiceId(serviceId, "lateral")));
      checks.push(run("Central Beam Alignment - Lateral", () => getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Effective Focal Spot Size - Lateral", () => getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Total Filtration - Lateral", () => getTotalFilterationByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Consistency of Radiation Output - Lateral", () => getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Measurement of mA Linearity - Lateral", () => getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Low Contrast Resolution - Lateral", () => getLowContrastResolutionByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("High Contrast Resolution - Lateral", () => getHighContrastResolutionByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Exposure Rate at Table Top - Lateral", () => getExposureRateTableTopByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Tube Housing Leakage - Lateral", () => getTubeHousingLeakageByServiceIdForInventionalRadiology(serviceId, "lateral")));
      checks.push(run("Radiation Protection Survey Report", () => getRadiationProtectionSurveyByServiceIdForInventionalRadiology(serviceId)));
    }
    const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
    return results.filter((r) => !r.saved).map((r) => r.name);
  };

  const handleSaveHeader = async () => {
    setSaving(true);
    setSaveSuccess(false);
    if (minIssueDate && formData.issueDate && formData.issueDate < minIssueDate) {
      toast.error("Issue date must be equal to or greater than the QA test submitted date.");
      setSaving(false);
      return;
    }
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
        toolsUsed: originalTools.map((t: any, idx: number) => ({
          toolId: t._id || t.toolId || null,
          SrNo: t.SrNo,
          nomenclature: t.nomenclature,
          make: t.manufacturer,
          model: t.model,
          range: t.range,
          calibrationCertificateNo: t.calibrationCertificateNo,
          calibrationValidTill: t.calibrationValidTill,
          certificate: t.certificate,
          uncertainity: "",
        })),
        notes: notes.length > 0 ? notes.map((note, index) => ({
          slNo: `5.${index + 1}`,
          text: note,
        })) : [
          { slNo: "5.1", text: "The Test Report relates only to the above item only." },
          { slNo: "5.2", text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL." },
          { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
          { slNo: "5.4", text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats." },
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

  // TUBE TYPE SELECTION MODAL - Show first
  if (showTubeModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Tube Configuration</h3>
          <p className="text-gray-600 mb-8">
            Please select the tube configuration for this Interventional Radiology unit:
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleTubeTypeSelection('single')}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition transform hover:scale-105 text-left"
            >
              Single Tube
            </button>
            <button
              onClick={() => handleTubeTypeSelection('double')}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition transform hover:scale-105 text-left"
            >
              Double Tube (Tube Frontal & Tube Lateral)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't show tests until tube type is selected
  if (!tubeType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Generate QA Test Report - Interventional Radiology
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
              className="border p-2 rounded-md w-full bg-gray-100"
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
              className="border p-2 rounded-md w-full bg-gray-100"
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
              name="srfNumber"
              value={formData.srfNumber}
              onChange={handleInputChange}
              className="border p-2 rounded-md w-full bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SRF Date
            </label>
            <input
              type="date"
              name="srfDate"
              value={formData.srfDate}
              onChange={handleInputChange}
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
              name="testReportNumber"
              value={formData.testReportNumber}
              onChange={handleInputChange}
              className="border p-2 rounded-md w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              min={minIssueDate || undefined}
              onChange={handleInputChange}
              className="border p-2 rounded-md w-full"
              title={minIssueDate ? `Must be on or after QA test date (${minIssueDate})` : undefined}
            />
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
            { label: "Nomenclature", name: "nomenclature", readOnly: true },
            { label: "Make", name: "make" },
            { label: "Model", name: "model", readOnly: true },
            { label: "Serial Number", name: "slNumber", readOnly: true },
            { label: "Category", name: "category" },
            { label: "Condition of Test Item", name: "condition" },
            { label: "Testing Procedure Number", name: "testingProcedureNumber" },
            { label: "No. of Pages", name: "pages" },
            { label: "QA Test Date", name: "testDate", type: "date" },
            { label: "QA Test Due Date", name: "testDueDate", type: "date" },
            { label: "Testing Done At Location", name: "location" },
            { label: "Temperature (°C)", name: "temperature", type: "number" },
            { label: "Humidity (RH %)", name: "humidity", type: "number" },
            { label: "RP Id", name: "rpId" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type ?? "text"}
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={handleInputChange}
                className={`border p-2 rounded-md w-full ${field.readOnly ? "bg-gray-100" : ""}`}
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
              id="csv-upload-input"
            />
            <label
              htmlFor="csv-upload-input"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              {csvUploading ? 'Uploading...' : 'Upload Excel'}
            </label>
            <button
              type="button"
              onClick={handleExportSavedData}
              disabled={isExporting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition shadow-md font-medium ${isExporting ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"} text-white`}
            >
              <CloudArrowUpIcon className="w-5 h-5 rotate-180" />
              {isExporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
          {csvFileUrl && (
            <p className="text-sm text-gray-600">
              File loaded from: <span className="font-mono text-xs">{csvFileUrl}</span>
            </p>
          )}
        </div>
      </section>

      <Standards standards={tools} />
      <Notes initialNotes={notes} onChange={setNotes} />

      {/* Save & View Buttons */}
      <div className="mt-8 flex justify-end gap-4">
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
          type="button"
          onClick={handleSaveHeader}
          disabled={saving}
          className={`px-8 py-3 rounded-lg font-bold text-white transition ${saving ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
        >
          {saving ? "Saving..." : "Save Report Header"}
        </button>
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
            navigate(`/admin/orders/view-service-report-inventional-radiology?serviceId=${serviceId}`);
          }}
        >
          View Generated Report
        </button>
      </div>

      {/* ============================== ACCORDION TESTS ============================== */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>

        {(tubeType === 'single' ? [
          {
            title: "Accuracy of Irradiation Time",
            component: (
              <AccuracyOfIrradiationTime
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Accuracy Of Irradiation Time']}
              />
            ),
          },
          {
            title: "Central Beam Alignment",
            component: (
              <CentralBeamAlignment
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Central Beam Alignment']}
              />
            ),
          },
          {
            title: "Effective Focal Spot Size",
            component: (
              <EffectiveFocalspotMeasurement
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Effective Focal Spot Size']}
              />
            ),
          },
          {
            title: "Total Filtration",
            component: (
              <TotalFilteration
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Total Filtration']}
              />
            ),
          },
          {
            title: "Consistency of Radiation Output",
            component: (
              <ConsistencyOfRadiationOutput
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Consistency Of Radiation Output']}
              />
            ),
          },
          {
            title: "Measurement of mA Linearity",
            component: (
              <MeasurementOfMaLinearity
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Measurement of mA Linearity']}
              />
            ),
          },
          {
            title: "Low Contrast Resolution",
            component: (
              <LowContrastResolution
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Low Contrast Resolution']}
              />
            ),
          },
          {
            title: "High Contrast Resolution",
            component: (
              <HighContrastResolution
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['High Contrast Resolution']}
              />
            ),
          },
          {
            title: "Exposure Rate at Table Top",
            component: (
              <ExposureRateAtTableTop
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Exposure Rate At Table Top']}
              />
            ),
          },
          {
            title: "Tube Housing Leakage",
            component: (
              <TubeHousingLeakage
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Tube Housing Leakage']}
              />
            ),
          },
          {
            title: "Radiation Protection Survey Report",
            component: (
              <RadiationProtectionInterventionalRadiology
                serviceId={serviceId}
                tubeId={null}
                csvData={csvDataForComponents['Radiation Protection Survey Report']}
              />
            ),
          },
        ] : [
          // ===== FRONTAL TUBE TESTS =====
          {
            title: "Accuracy of Irradiation Time - Frontal",
            component: <AccuracyOfIrradiationTime serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Accuracy Of Irradiation Time - Frontal']} />,
          },
          {
            title: "Central Beam Alignment - Frontal",
            component: <CentralBeamAlignment serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Central Beam Alignment - Frontal']} />,
          },
          {
            title: "Effective Focal Spot Size - Frontal",
            component: <EffectiveFocalspotMeasurement serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Effective Focal Spot Size - Frontal']} />,
          },
          {
            title: "Total Filtration - Frontal",
            component: <TotalFilteration serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Total Filtration - Frontal']} />,
          },
          {
            title: "Consistency of Radiation Output - Frontal",
            component: <ConsistencyOfRadiationOutput serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Consistency Of Radiation Output - Frontal']} />,
          },
          {
            title: "Measurement of mA Linearity - Frontal",
            component: <MeasurementOfMaLinearity serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Measurement of mA Linearity - Frontal']} />,
          },
          {
            title: "Low Contrast Resolution - Frontal",
            component: <LowContrastResolution serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Low Contrast Resolution - Frontal']} />,
          },
          {
            title: "High Contrast Resolution - Frontal",
            component: <HighContrastResolution serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['High Contrast Resolution - Frontal']} />,
          },
          {
            title: "Exposure Rate at Table Top - Frontal",
            component: <ExposureRateAtTableTop serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Exposure Rate At Table Top - Frontal']} />,
          },
          {
            title: "Tube Housing Leakage - Frontal",
            component: <TubeHousingLeakage serviceId={serviceId} tubeId="frontal" csvData={csvDataForComponents['Tube Housing Leakage - Frontal']} />,
          },

          // ===== LATERAL TUBE TESTS =====
          {
            title: "Accuracy of Irradiation Time - Lateral",
            component: <AccuracyOfIrradiationTime serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Accuracy Of Irradiation Time - Lateral']} />,
          },
          {
            title: "Central Beam Alignment - Lateral",
            component: <CentralBeamAlignment serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Central Beam Alignment - Lateral']} />,
          },
          {
            title: "Effective Focal Spot Size - Lateral",
            component: <EffectiveFocalspotMeasurement serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Effective Focal Spot Size - Lateral']} />,
          },
          {
            title: "Total Filtration - Lateral",
            component: <TotalFilteration serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Total Filtration - Lateral']} />,
          },
          {
            title: "Consistency of Radiation Output - Lateral",
            component: <ConsistencyOfRadiationOutput serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Consistency Of Radiation Output - Lateral']} />,
          },
          {
            title: "Measurement of mA Linearity - Lateral",
            component: <MeasurementOfMaLinearity serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Measurement of mA Linearity - Lateral']} />,
          },
          {
            title: "Low Contrast Resolution - Lateral",
            component: <LowContrastResolution serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Low Contrast Resolution - Lateral']} />,
          },
          {
            title: "High Contrast Resolution - Lateral",
            component: <HighContrastResolution serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['High Contrast Resolution - Lateral']} />,
          },
          {
            title: "Exposure Rate at Table Top - Lateral",
            component: <ExposureRateAtTableTop serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Exposure Rate At Table Top - Lateral']} />,
          },
          {
            title: "Tube Housing Leakage - Lateral",
            component: <TubeHousingLeakage serviceId={serviceId} tubeId="lateral" csvData={csvDataForComponents['Tube Housing Leakage - Lateral']} />,
          },

          // ===== COMMON TESTS =====
          {
            title: "Radiation Protection Survey Report",
            component: <RadiationProtectionInterventionalRadiology serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Radiation Protection Survey Report']} />,
          },
        ] as any)
          .map((item: any, idx: number) => (
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

export default InventionalRadiology;