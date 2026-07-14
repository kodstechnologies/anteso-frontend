// GenerateReportForBMD.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AuthorizedSignatorySelect from "../../AuthorizedSignatorySelect";
import * as XLSX from "xlsx";

import Standards from "../../Standards";
import Notes from "../../Notes";

import {
    getDetails,
    getTools,
    saveReportHeaderForBMD,
    getReportHeaderForBMD,
    getAccuracyOfIrradiationTimeByServiceIdForBMD,
    getTotalFiltrationByServiceIdForBMD,
    getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD,
    getLinearityOfMaLoadingByServiceIdForBMD,
    getReproducibilityOfRadiationOutputByServiceIdForBmd,
    getRadiationLeakageLevelByServiceIdForBMD,
    getRadiationProtectionSurveyByServiceIdForBmd,
    proxyFile,
} from "../../../../../../api";
import { createBMDSavedExcel, BMDSavedExportData } from "./exportBMDSavedToExcel";
import { isExcelFileUrl } from "../../../../../../utils/spreadsheetFile";

// Test-table imports
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import AccuracyOfOperaingPotential from "./AccuracyOfOperaingPotentialAndTime";
import TotalFilteration from "./TotalFilteration";
import LinearityOfMaLoading from "./LinearityOfMaLoading";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
import RadiationProtectionSurvey from "./RadiationProtectionSurvey";
import TubeHousingLeakage from "./TubeHousingLeakage";
import EquipmentSetting from "./EquipmentSetting";
import MaxRadiationLevel from "./MaxRadiationLevel";


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
  category?: string;
  [key: string]: any;
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

interface BMDProps {
  serviceId: string;
  csvFileUrl?: string | null;
  qaTestDate?: string | null;
}

const GenerateReportForBMD: React.FC<BMDProps> = ({ serviceId, csvFileUrl, qaTestDate }) => {
  const navigate = useNavigate();

  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasTimer, setHasTimer] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to store CSV data for components
  const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
  const [csvDataVersion, setCsvDataVersion] = useState(0); // Track CSV data updates to force re-render

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
    rpId: "",
        authorizedSignatory: "",
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

  // Check for timer preference from localStorage
  useEffect(() => {
    const timerChoice = localStorage.getItem(`bmd-timer-${serviceId}`);
    if (timerChoice !== null) {
      setHasTimer(timerChoice === 'true');
    }
  }, [serviceId]);

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

  const parseFieldValueData = (rows: string[][]): any[] => {
    if (rows.length === 0) return [];
    const headers = rows[0];
    const data: any[] = [];

    const sectionToTestName: { [key: string]: string } = {
      '========== ACCURACY OF OPERATING POTENTIAL (KVP) ==========': 'Accuracy of Operating Potential',
      '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy of Irradiation Time',
      '========== TOTAL FILTRATION ==========': 'Total Filtration',
      '========== LINEARITY OF MA LOADING ==========': 'Linearity of mA Loading',
      '========== REPRODUCIBILITY OF RADIATION OUTPUT ==========': 'Reproducibility of Radiation Output',
      '========== RADIATION LEAKAGE LEVEL AT 1M FROM TUBE HOUSING ==========': 'Tube Housing Leakage',
      '========== RADIATION PROTECTION SURVEY ==========': 'Radiation Protection Survey',
    };

    let currentTestName = '';
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const row: any = {};
      headers.forEach((header, index) => { row[header] = values[index] || ''; });

      const fieldName = (row['Field Name'] || '').trim();
      const firstColumn = (row[headers[0]] || '').trim();
      const potentialSectionHeader = fieldName || firstColumn;

      if (potentialSectionHeader.startsWith('==========') && potentialSectionHeader.endsWith('==========')) {
        currentTestName = sectionToTestName[potentialSectionHeader] || '';
        continue;
      }
      if (firstColumn.startsWith('---') || firstColumn === '' || !fieldName) continue;

      const isKnownField = fieldName.match(/^(Table|Tolerance|TestConditions|IrradiationTime|Measurement|Row|OutputRow|Settings|Workload|LeakageMeasurement|Location|SurveyDate|AppliedCurrent|AppliedVoltage|ExposureTime|mAStations|TotalFiltration|FiltrationTolerance|FCD|FFD|MeasurementCount|MeasColumnLabels)/);
      if (!isKnownField) continue;

      if (currentTestName) {
        row['Test Name'] = currentTestName;
        data.push(row);
      }
    }
    return data;
  };

  const parseHorizontalBmdTemplate = (rows: string[][]): any[] => {
    const data: any[] = [];
    let i = 0;
    const pushRow = (field: string, value: string, rowIndex: number, testName: string) => {
      if (String(value ?? '').trim() === '') return;
      data.push({ 'Field Name': field, 'Value': String(value).trim(), 'Row Index': String(rowIndex), 'Test Name': testName });
    };

    const isTestHeader = (r: string[]) => /^TEST\s*:/i.test((r[0] || '').trim());
    while (i < rows.length) {
      const row = rows[i] || [];
      const titleCell = (row[0] || '').trim();
      if (!isTestHeader(row)) { i++; continue; }
      const title = titleCell.replace(/^TEST\s*:/i, '').trim().toUpperCase();
      i++;
      while (i < rows.length && rows[i].every((c) => !String(c || '').trim())) i++;
      if (i >= rows.length) break;
      const header = rows[i] || [];
      i++;

      const sectionRows: string[][] = [];
      while (i < rows.length && !isTestHeader(rows[i])) {
        if (rows[i].some((c) => String(c || '').trim())) sectionRows.push(rows[i]);
        i++;
      }

      if (title.includes('ACCURACY OF IRRADIATION TIME')) {
        const headerLower = header.map((h) => String(h || '').trim().toLowerCase());
        const setTimeIdx = headerLower.findIndex((h) => h.includes('set time'));
        const measuredTimeIdx = headerLower.findIndex((h) => h.includes('measured time'));
        const tolOperatorIdx = headerLower.findIndex((h) => h.includes('tol operator') || h.includes('tolerance operator'));
        const tolValueIdx = headerLower.findIndex((h) => h.includes('tol value') || h.includes('tolerance value'));

        sectionRows.forEach((r, idx) => {
          if (idx === 0) {
            pushRow('TestConditions_FCD', r[0], 0, 'Accuracy of Irradiation Time');
            pushRow('TestConditions_kV', r[1], 0, 'Accuracy of Irradiation Time');
            pushRow('TestConditions_ma', r[2], 0, 'Accuracy of Irradiation Time');
            pushRow(
              'Tolerance_Operator',
              r[tolOperatorIdx >= 0 ? tolOperatorIdx : 6],
              0,
              'Accuracy of Irradiation Time'
            );
            pushRow(
              'Tolerance_Value',
              r[tolValueIdx >= 0 ? tolValueIdx : 7],
              0,
              'Accuracy of Irradiation Time'
            );
          }
          pushRow(
            'IrradiationTime_SetTime',
            r[setTimeIdx >= 0 ? setTimeIdx : 3],
            idx,
            'Accuracy of Irradiation Time'
          );
          pushRow(
            'IrradiationTime_MeasuredTime',
            r[measuredTimeIdx >= 0 ? measuredTimeIdx : 4],
            idx,
            'Accuracy of Irradiation Time'
          );
        });
      } else if (title.includes('ACCURACY OF OPERATING POTENTIAL')) {
        if (sectionRows.length > 0) {
          const first = sectionRows[0];
          const appliedKvpIdx = header.findIndex((h) => String(h || '').trim().toLowerCase() === 'applied kvp');
          const measStartIdx = appliedKvpIdx >= 0 ? appliedKvpIdx + 1 : 6;
          const labels = first
            .slice(2, appliedKvpIdx >= 0 ? appliedKvpIdx : 6)
            .map((x) => String(x || '').trim())
            .filter(Boolean);
          if (labels.length) pushRow('MeasColumnLabels', labels.join(','), 0, 'Accuracy of Operating Potential');
          pushRow('Tolerance_Sign', first[0], 0, 'Accuracy of Operating Potential');
          pushRow('Tolerance_Value', first[1], 0, 'Accuracy of Operating Potential');
          // Parse data rows using detected column positions from header
          sectionRows.forEach((r, idx) => {
            pushRow('Table2_SetKV', r[appliedKvpIdx >= 0 ? appliedKvpIdx : 6], idx, 'Accuracy of Operating Potential');
            const measCols = r.slice(measStartIdx).map((v) => String(v || '').trim());
            measCols.forEach((val, mIdx) => {
              if (val) {
                pushRow(`Table2_Meas${mIdx + 1}`, val, idx, 'Accuracy of Operating Potential');
              }
            });
          });
          continue;
        }
      } else if (title.includes('TOTAL FILTRATION')) {
        if (sectionRows.length > 0) {
          pushRow('TotalFiltration_Measured', sectionRows[0][0], 0, 'Total Filtration');
          pushRow('TotalFiltration_Required', sectionRows[0][1], 0, 'Total Filtration');
          pushRow('TotalFiltration_AtKvp', sectionRows[0][2], 0, 'Total Filtration');
        }
      } else if (title.includes('LINEARITY OF MA LOADING')) {
        if (sectionRows.length > 0) {
          const first = sectionRows[0];
          const headerLower = header.map((h) => String(h || '').trim().toLowerCase());
          const fddIdx = headerLower.findIndex((h) => h.includes('fdd') || h.includes('ffd') || h.includes('fcd'));
          const kvIdx = headerLower.findIndex((h) => h === 'kv' || h === 'kvp' || h.includes('k v'));
          const timeIdx = headerLower.findIndex((h) => h.includes('time'));
          const tolOpIdx = headerLower.findIndex((h) => h.includes('tol operator') || h.includes('tolerance operator'));
          const tolValIdx = headerLower.findIndex((h) => h.includes('tol value') || h.includes('tolerance value'));
          const maIdx = headerLower.findIndex((h) => h === 'ma' || h.includes('m a'));
          const measIdxs = headerLower
            .map((h, idx) => ({ h, idx }))
            .filter((x) => /^meas\s*\d+$/i.test(x.h))
            .map((x) => x.idx);
          const headerLabelIdxs = headerLower
            .map((h, idx) => ({ h, idx }))
            .filter((x) => /^header\s*\d+$/i.test(x.h))
            .map((x) => x.idx);

          pushRow('Table1_FCD', first[fddIdx >= 0 ? fddIdx : 0], 0, 'Linearity of mA Loading');
          pushRow('Table1_kV', first[kvIdx >= 0 ? kvIdx : 1], 0, 'Linearity of mA Loading');
          pushRow('Table1_Time', first[timeIdx >= 0 ? timeIdx : 2], 0, 'Linearity of mA Loading');
          pushRow('ToleranceOperator', first[tolOpIdx >= 0 ? tolOpIdx : 3], 0, 'Linearity of mA Loading');
          pushRow('Tolerance', first[tolValIdx >= 0 ? tolValIdx : 4], 0, 'Linearity of mA Loading');
          const labels = (headerLabelIdxs.length > 0
            ? headerLabelIdxs.map((idx) => first[idx])
            : [first[5], first[6], first[7]])
            .map((x) => String(x || '').trim())
            .filter(Boolean);
          if (labels.length) pushRow('MeasColumnLabels', labels.join(','), 0, 'Linearity of mA Loading');
          sectionRows.forEach((r, idx) => {
            pushRow('Table2_ma', r[maIdx >= 0 ? maIdx : 8], idx, 'Linearity of mA Loading');
            if (measIdxs.length > 0) {
              measIdxs.forEach((colIdx, mIdx) => {
                pushRow(`Table2_Meas${mIdx + 1}`, r[colIdx], idx, 'Linearity of mA Loading');
              });
            } else {
              pushRow('Table2_Meas1', r[9], idx, 'Linearity of mA Loading');
              pushRow('Table2_Meas2', r[10], idx, 'Linearity of mA Loading');
              pushRow('Table2_Meas3', r[11], idx, 'Linearity of mA Loading');
            }
          });
          continue;
        }
      } else if (title.includes('REPRODUCIBILITY OF RADIATION OUTPUT')) {
        if (sectionRows.length > 0) {
          const first = sectionRows[0];
          const headerLower = header.map((h) => String(h || '').trim().toLowerCase());
          const kvIdx = headerLower.findIndex((h) => h === 'kv' || h === 'kvp' || h.includes('k v'));
          const masIdx = headerLower.findIndex((h) => h === 'mas' || h.includes('m as'));
          const measIdxs = headerLower
            .map((h, idx) => ({ h, idx }))
            .filter((x) => /^meas\s*\d+$/i.test(x.h))
            .map((x) => x.idx);
          const headerLabelIdxs = headerLower
            .map((h, idx) => ({ h, idx }))
            .filter((x) => /^header\s*\d+$/i.test(x.h))
            .map((x) => x.idx);

          pushRow('FCD_Value', first[0], 0, 'Reproducibility of Radiation Output');
          pushRow('Tolerance_Operator', first[1], 0, 'Reproducibility of Radiation Output');
          pushRow('Tolerance_Value', first[2], 0, 'Reproducibility of Radiation Output');
          const labels = (headerLabelIdxs.length > 0
            ? headerLabelIdxs.map((idx) => first[idx])
            : [first[3], first[4], first[5], first[6], first[7]])
            .map((x) => String(x || '').trim())
            .filter(Boolean);
          if (labels.length) pushRow('MeasColumnLabels', labels.join(','), 0, 'Reproducibility of Radiation Output');
          sectionRows.forEach((r, idx) => {
            pushRow('OutputRow_kV', r[kvIdx >= 0 ? kvIdx : 8], idx, 'Reproducibility of Radiation Output');
            pushRow('OutputRow_mas', r[masIdx >= 0 ? masIdx : 9], idx, 'Reproducibility of Radiation Output');
            if (measIdxs.length > 0) {
              measIdxs.forEach((colIdx, mIdx) => {
                pushRow(`OutputRow_Meas${mIdx + 1}`, r[colIdx], idx, 'Reproducibility of Radiation Output');
              });
            } else {
              pushRow('OutputRow_Meas1', r[10], idx, 'Reproducibility of Radiation Output');
              pushRow('OutputRow_Meas2', r[11], idx, 'Reproducibility of Radiation Output');
              pushRow('OutputRow_Meas3', r[12], idx, 'Reproducibility of Radiation Output');
              pushRow('OutputRow_Meas4', r[13], idx, 'Reproducibility of Radiation Output');
              pushRow('OutputRow_Meas5', r[14], idx, 'Reproducibility of Radiation Output');
            }
          });
          continue;
        }
      } else if (title.includes('RADIATION LEAKAGE LEVEL')) {
        if (sectionRows.length > 0) {
          const first = sectionRows[0];
          const headerLower = header.map((h) => String(h || '').trim().toLowerCase());
          const fddIdx = headerLower.findIndex((h) => h.includes('fdd') || h.includes('ffd') || h.includes('fcd'));
          const kvIdx = headerLower.findIndex((h) => h === 'kv' || h === 'kvp' || h.includes('k v'));
          const maIdx = headerLower.findIndex((h) => h === 'ma' || h.includes('m a'));
          const timeIdx = headerLower.findIndex((h) => h.includes('time'));
          const workloadIdx = headerLower.findIndex((h) => h.includes('workload'));
          const tolValIdx = headerLower.findIndex((h) => h.includes('tol value') || h.includes('tolerance value'));
          const tolOpIdx = headerLower.findIndex((h) => h.includes('tol operator') || h.includes('tolerance operator'));
          const locationIdx = headerLower.findIndex((h) => h === 'location');
          const frontIdx = headerLower.findIndex((h) => h === 'front');
          const backIdx = headerLower.findIndex((h) => h === 'back');
          const leftIdx = headerLower.findIndex((h) => h === 'left');
          const rightIdx = headerLower.findIndex((h) => h === 'right');
          const topIdx = headerLower.findIndex((h) => h === 'top');

          pushRow('Settings_FCD', first[fddIdx >= 0 ? fddIdx : 0], 0, 'Tube Housing Leakage');
          pushRow('Settings_kV', first[kvIdx >= 0 ? kvIdx : 1], 0, 'Tube Housing Leakage');
          pushRow('Settings_ma', first[maIdx >= 0 ? maIdx : 2], 0, 'Tube Housing Leakage');
          pushRow('Settings_Time', first[timeIdx >= 0 ? timeIdx : 3], 0, 'Tube Housing Leakage');
          pushRow('Workload', first[workloadIdx >= 0 ? workloadIdx : 4], 0, 'Tube Housing Leakage');
          pushRow('ToleranceValue', first[tolValIdx >= 0 ? tolValIdx : 6], 0, 'Tube Housing Leakage');
          pushRow('ToleranceOperator', first[tolOpIdx >= 0 ? tolOpIdx : 7], 0, 'Tube Housing Leakage');
          const labels = [
            header[frontIdx >= 0 ? frontIdx : 9],
            header[backIdx >= 0 ? backIdx : 10],
            header[leftIdx >= 0 ? leftIdx : 11],
            header[rightIdx >= 0 ? rightIdx : 12],
            header[topIdx >= 0 ? topIdx : 13],
          ].map((x) => String(x || '').trim()).filter(Boolean);
          if (labels.length) pushRow('MeasColumnLabels', labels.join(','), 0, 'Tube Housing Leakage');
          sectionRows.forEach((r, idx) => {
            pushRow('LeakageMeasurement_Location', r[locationIdx >= 0 ? locationIdx : 8], idx, 'Tube Housing Leakage');
            pushRow('LeakageMeasurement_Front', r[frontIdx >= 0 ? frontIdx : 9], idx, 'Tube Housing Leakage');
            pushRow('LeakageMeasurement_Back', r[backIdx >= 0 ? backIdx : 10], idx, 'Tube Housing Leakage');
            pushRow('LeakageMeasurement_Left', r[leftIdx >= 0 ? leftIdx : 11], idx, 'Tube Housing Leakage');
            pushRow('LeakageMeasurement_Right', r[rightIdx >= 0 ? rightIdx : 12], idx, 'Tube Housing Leakage');
            pushRow('LeakageMeasurement_Top', r[topIdx >= 0 ? topIdx : 13], idx, 'Tube Housing Leakage');
          });
          continue;
        }
      } else if (title.includes('RADIATION PROTECTION SURVEY')) {
        if (sectionRows.length > 0) {
          const first = sectionRows[0];
          pushRow('AppliedCurrent', first[0], 0, 'Radiation Protection Survey');
          pushRow('AppliedVoltage', first[1], 0, 'Radiation Protection Survey');
          pushRow('ExposureTime', first[2], 0, 'Radiation Protection Survey');
          pushRow('Workload', first[3], 0, 'Radiation Protection Survey');
        }
        let locationRow = 0;
        sectionRows.slice(1).forEach((r) => {
          const location = String(r[0] || '').trim();
          if (!location || /^LOCATION$/i.test(location)) return;
          pushRow('Location_Location', r[0], locationRow, 'Radiation Protection Survey');
          pushRow('Location_mRPerHr', r[1], locationRow, 'Radiation Protection Survey');
          pushRow('Location_Category', r[2], locationRow, 'Radiation Protection Survey');
          locationRow++;
        });
      }
    }

    return data;
  };

  // Parse CSV text into structured data
  const parseCSV = (text: string): any[] => {
    const rows = text.split('\n').map((line) => parseLine(line)).filter((r) => r.some((c) => String(c || '').trim()));
    if (rows.length === 0) return [];
    const first = (rows[0][0] || '').trim().toLowerCase();
    if (first === 'field name' || first === 'fieldname') {
      return parseFieldValueData(rows);
    }
    return parseHorizontalBmdTemplate(rows);
  };

  // Process CSV data and fill test tables
  const processCSVData = async (csvData: any[]) => {
    try {
      setCsvUploading(true);

      const groupedData: { [key: string]: any[] } = {};
      const testNameMap: { [key: string]: string } = {
        'Accuracy of Operating Potential': 'Accuracy of Operating Potential',
        'Accuracy of Irradiation Time': 'Accuracy of Irradiation Time',
        'Total Filtration': 'Total Filtration',
        'Linearity of mA Loading': 'Linearity of mA Loading',
        'Reproducibility of Radiation Output': 'Reproducibility of Radiation Output',
        'Tube Housing Leakage': 'Tube Housing Leakage',
        'Radiation Protection Survey': 'Radiation Protection Survey',
      };

      csvData.forEach(row => {
        let testName = (row['Test Name'] || '').trim();
        const normalizedName = Object.keys(testNameMap).find(key =>
          key.toLowerCase() === testName.toLowerCase() ||
          testName.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(testName.toLowerCase())
        );

        if (normalizedName) {
          testName = normalizedName;
        }

        if (testName) {
          if (!groupedData[testName]) {
            groupedData[testName] = [];
          }
          groupedData[testName].push(row);
        }
      });

      // Process Accuracy of Operating Potential
      if (groupedData['Accuracy of Operating Potential'] && groupedData['Accuracy of Operating Potential'].length > 0) {
        try {
          const data = groupedData['Accuracy of Operating Potential'];
          const table1Row = { time: '', sliceThickness: '' };
          const table2Rows: any[] = [];
          let tolerance = { value: '5', type: 'percent' as const, sign: 'both' as const };
          let measColumnLabels: string[] = [];

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'Table1_Time') table1Row.time = value;
            if (field === 'Table1_SliceThickness') table1Row.sliceThickness = value;

            if (field.startsWith('Table2_')) {
              while (table2Rows.length <= rowIndex) {
                table2Rows.push({ setKV: '', ma10: '', ma100: '', ma200: '', avgKvp: '', remarks: '' });
              }
              const fieldName = field.replace('Table2_', '');
              if (fieldName === 'SetKV') table2Rows[rowIndex].setKV = value;
              if (fieldName === 'ma10') table2Rows[rowIndex].ma10 = value;
              if (fieldName === 'ma100') table2Rows[rowIndex].ma100 = value;
              if (fieldName === 'ma200') table2Rows[rowIndex].ma200 = value;
              const measMatch = fieldName.match(/^Meas(\d+)$/i);
              if (measMatch) {
                table2Rows[rowIndex][`meas${measMatch[1]}`] = value;
              }
            }

            if (field === 'Tolerance_Value') tolerance.value = value;
            if (field === 'Tolerance_Type') tolerance.type = value as any;
            if (field === 'Tolerance_Sign') tolerance.sign = value as any;
            if (field === 'MeasColumnLabels') {
              measColumnLabels = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            }
          });

          if (table1Row.time || table1Row.sliceThickness || table2Rows.length > 0) {
            const opMeasurements = table2Rows
              .filter((r: any) => r.setKV)
              .map((r: any) => {
                const measuredValues = Object.keys(r)
                  .filter((k) => /^meas\d+$/i.test(k))
                  .sort((a, b) => parseInt(a.replace(/[^0-9]/g, ''), 10) - parseInt(b.replace(/[^0-9]/g, ''), 10))
                  .map((k) => r[k])
                  .filter((v: string) => String(v || '').trim() !== '');
                const fallbackMeasured = [r.ma10, r.ma100, r.ma200].filter((v: string) => String(v || '').trim() !== '');
                const valuesForAvg = (measuredValues.length > 0 ? measuredValues : fallbackMeasured)
                  .map((v: string) => parseFloat(String(v)))
                  .filter((n: number) => !isNaN(n));
                const computedAverageKvp = valuesForAvg.length > 0
                  ? (valuesForAvg.reduce((sum: number, n: number) => sum + n, 0) / valuesForAvg.length).toFixed(2)
                  : '';
                return {
                  appliedKvp: r.setKV,
                  measuredValues: measuredValues.length > 0 ? measuredValues : fallbackMeasured,
                  averageKvp: r.avgKvp || computedAverageKvp,
                  remarks: r.remarks || '-',
                };
              });
            const derivedMeasCount = Math.max(0, ...opMeasurements.map((m: any) => m.measuredValues?.length || 0));
            const opMAStations = measColumnLabels.length > 0
              ? measColumnLabels
              : (derivedMeasCount > 0 ? Array.from({ length: derivedMeasCount }, (_, i) => `mA Station ${i + 1}`) : ['10 mA', '100 mA', '200 mA']);
            const opTolerance = {
              sign: tolerance.sign === 'both' ? '±' : tolerance.sign === 'plus' ? '+' : tolerance.sign === 'minus' ? '-' : tolerance.sign,
              value: tolerance.value,
            };

            setCsvDataForComponents((prev: any) => {
              const existingTf = prev.totalFiltration || {};
              const hasTfMeasurements = existingTf.measurements?.length > 0;
              return {
                ...prev,
                accuracyOfOperatingPotential: {
                  table1: [table1Row],
                  table2: table2Rows,
                  tolerance: tolerance,
                },
                totalFiltration: {
                  ...existingTf,
                  mAStations: hasTfMeasurements ? existingTf.mAStations : (existingTf.mAStations?.length ? existingTf.mAStations : opMAStations),
                  measurements: hasTfMeasurements ? existingTf.measurements : (opMeasurements.length > 0 ? opMeasurements : existingTf.measurements),
                  tolerance: existingTf.tolerance || opTolerance,
                  totalFiltration: existingTf.totalFiltration || { measured: '', required: '', atKvp: '' },
                  filtrationTolerance: existingTf.filtrationTolerance,
                },
              };
            });
            setCsvDataVersion(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error processing Accuracy of Operating Potential:', error);
        }
      }

      // Process Accuracy of Irradiation Time (process if timer exists OR if data is present in CSV)
      if (groupedData['Accuracy of Irradiation Time'] && groupedData['Accuracy of Irradiation Time'].length > 0) {
        try {
          const data = groupedData['Accuracy of Irradiation Time'];
          const testConditions = { fcd: '', kv: '', ma: '' };
          const irradiationTimes: any[] = [];
          let toleranceOperator = '<=';
          let toleranceValue = '10';

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'TestConditions_FCD') testConditions.fcd = value;
            if (field === 'TestConditions_kV') testConditions.kv = value;
            if (field === 'TestConditions_ma') testConditions.ma = value;

            if (field === 'Tolerance_Operator') toleranceOperator = value;
            if (field === 'Tolerance_Value') toleranceValue = value;

            if (field === 'IrradiationTime_SetTime' || field === 'IrradiationTime_MeasuredTime') {
              while (irradiationTimes.length <= rowIndex) {
                irradiationTimes.push({ setTime: '', measuredTime: '' });
              }
              if (field === 'IrradiationTime_SetTime') {
                irradiationTimes[rowIndex].setTime = value;
              } else if (field === 'IrradiationTime_MeasuredTime') {
                irradiationTimes[rowIndex].measuredTime = value;
              }
            }
          });

          if (testConditions.fcd || testConditions.kv || testConditions.ma || irradiationTimes.length > 0) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              accuracyOfIrradiationTime: {
                testConditions,
                irradiationTimes,
                tolerance: {
                  operator: toleranceOperator,
                  value: toleranceValue,
                },
              }
            }));
            setCsvDataVersion(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error processing Accuracy of Irradiation Time:', error);
        }
      }

      // Process Total Filtration
      if (groupedData['Total Filtration'] && groupedData['Total Filtration'].length > 0) {
        try {
          const data = groupedData['Total Filtration'];
          const mAStations: string[] = [];
          const measurements: any[] = [];
          let toleranceSign = '±';
          let toleranceValue = '2.0';
          let hasToleranceSignFromCsv = false;
          let hasToleranceValueFromCsv = false;
          const totalFiltration = { measured: '', required: '', atKvp: '' };
          const filtrationTolerance = {
            forKvGreaterThan70: '1.5',
            forKvBetween70And100: '2.0',
            forKvGreaterThan100: '2.5',
            kvThreshold1: '70',
            kvThreshold2: '100',
          };
          let measurementRowIdx = -1;

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            let rowIndex = rowIndexStr === '' ? -1 : parseInt(rowIndexStr);
            if (isNaN(rowIndex as number)) rowIndex = -1;

            if (field === 'mAStations') {
              if (!mAStations.includes(value)) {
                mAStations.push(value);
              }
            }

            if (field === 'Tolerance_Sign' && value) {
              toleranceSign = value;
              hasToleranceSignFromCsv = true;
            }
            if (field === 'Tolerance_Value' && value) {
              toleranceValue = value;
              hasToleranceValueFromCsv = true;
            }

            if (field === 'TotalFiltration_Measured') totalFiltration.measured = value;
            if (field === 'TotalFiltration_Required') totalFiltration.required = value;
            if (field === 'TotalFiltration_AtKvp') totalFiltration.atKvp = value;

            if (field === 'FiltrationTolerance_ForKvGreaterThan70') filtrationTolerance.forKvGreaterThan70 = value;
            if (field === 'FiltrationTolerance_ForKvBetween70And100') filtrationTolerance.forKvBetween70And100 = value;
            if (field === 'FiltrationTolerance_ForKvGreaterThan100') filtrationTolerance.forKvGreaterThan100 = value;
            if (field === 'FiltrationTolerance_KvThreshold1') filtrationTolerance.kvThreshold1 = value;
            if (field === 'FiltrationTolerance_KvThreshold2') filtrationTolerance.kvThreshold2 = value;
            if (field === 'FiltrationTolerance_Value') filtrationTolerance.forKvBetween70And100 = value;

            if (field === 'Measurement_AppliedKvp') {
              measurementRowIdx = rowIndex >= 0 ? rowIndex : measurementRowIdx + 1;
              while (measurements.length <= measurementRowIdx) {
                measurements.push({ appliedKvp: '', measuredValues: [], averageKvp: '', remarks: '' });
              }
              measurements[measurementRowIdx].appliedKvp = value;
            } else if (field.startsWith('Measurement_')) {
              const activeIdx = rowIndex >= 0 ? rowIndex : Math.max(measurementRowIdx, 0);
              while (measurements.length <= activeIdx) {
                measurements.push({ appliedKvp: '', measuredValues: [], averageKvp: '', remarks: '' });
              }
              measurementRowIdx = activeIdx;
              const fieldName = field.replace('Measurement_', '');
              if (fieldName === 'AppliedKvp') {
                measurements[activeIdx].appliedKvp = value;
              } else if (fieldName.startsWith('Meas')) {
                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                while (measurements[activeIdx].measuredValues.length <= colIndex) {
                  measurements[activeIdx].measuredValues.push('');
                }
                measurements[activeIdx].measuredValues[colIndex] = value;
              } else if (fieldName === 'AverageKvp') {
                measurements[activeIdx].averageKvp = value;
              }
            }
          });

          const hasTotalFiltrationValues =
            String(totalFiltration.measured || '').trim() !== '' ||
            String(totalFiltration.required || '').trim() !== '' ||
            String(totalFiltration.atKvp || '').trim() !== '';

          if (measurements.length > 0 || mAStations.length > 0 || hasTotalFiltrationValues) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              totalFiltration: {
                mAStations:
                  mAStations.length > 0
                    ? mAStations
                    : (prev.totalFiltration?.mAStations?.length
                      ? prev.totalFiltration.mAStations
                      : ['50 mA', '100 mA']),
                measurements:
                  measurements.length > 0
                    ? measurements
                    : (prev.totalFiltration?.measurements || []),
                tolerance: {
                  sign: hasToleranceSignFromCsv
                    ? toleranceSign
                    : (prev.totalFiltration?.tolerance?.sign || '±'),
                  value: hasToleranceValueFromCsv
                    ? toleranceValue
                    : (prev.totalFiltration?.tolerance?.value || '2.0'),
                },
                totalFiltration: {
                  measured: String(totalFiltration.measured || '').trim() !== ''
                    ? totalFiltration.measured
                    : (prev.totalFiltration?.totalFiltration?.measured || ''),
                  required: String(totalFiltration.required || '').trim() !== ''
                    ? totalFiltration.required
                    : (prev.totalFiltration?.totalFiltration?.required || ''),
                  atKvp: String(totalFiltration.atKvp || '').trim() !== ''
                    ? totalFiltration.atKvp
                    : (prev.totalFiltration?.totalFiltration?.atKvp || ''),
                },
                filtrationTolerance: {
                  forKvGreaterThan70: String(filtrationTolerance.forKvGreaterThan70 || '').trim() !== ''
                    ? filtrationTolerance.forKvGreaterThan70
                    : (prev.totalFiltration?.filtrationTolerance?.forKvGreaterThan70 || '1.5'),
                  forKvBetween70And100: String(filtrationTolerance.forKvBetween70And100 || '').trim() !== ''
                    ? filtrationTolerance.forKvBetween70And100
                    : (prev.totalFiltration?.filtrationTolerance?.forKvBetween70And100 || '2.0'),
                  forKvGreaterThan100: String(filtrationTolerance.forKvGreaterThan100 || '').trim() !== ''
                    ? filtrationTolerance.forKvGreaterThan100
                    : (prev.totalFiltration?.filtrationTolerance?.forKvGreaterThan100 || '2.5'),
                  kvThreshold1: String(filtrationTolerance.kvThreshold1 || '').trim() !== ''
                    ? filtrationTolerance.kvThreshold1
                    : (prev.totalFiltration?.filtrationTolerance?.kvThreshold1 || '70'),
                  kvThreshold2: String(filtrationTolerance.kvThreshold2 || '').trim() !== ''
                    ? filtrationTolerance.kvThreshold2
                    : (prev.totalFiltration?.filtrationTolerance?.kvThreshold2 || '100'),
                },
              }
            }));
            setCsvDataVersion(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error processing Total Filtration:', error);
        }
      }

      // Process Linearity of mA Loading
      if (groupedData['Linearity of mA Loading'] && groupedData['Linearity of mA Loading'].length > 0) {
        try {
          const data = groupedData['Linearity of mA Loading'];
          const table1Row = { fcd: '', kv: '', time: '' };
          const table2Rows: any[] = [];
          let tolerance = '0.1';
          let toleranceOperator = '<=';
          let measHeaders: string[] = [];
          let currentRow: any = null;
          let currentRowIdx = -1;

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'Table1_FCD' || field === 'ExposureCondition_fcd') table1Row.fcd = value;
            if (field === 'Table1_kV' || field === 'ExposureCondition_kv') table1Row.kv = value;
            if (field === 'Table1_Time' || field === 'ExposureCondition_time') table1Row.time = value;
            if (field === 'Tolerance' || field === 'Tolerance_value') tolerance = value;
            if (field === 'ToleranceOperator' || field === 'Tolerance_operator') toleranceOperator = value || '<=';
            if (field === 'MeasColumnLabels') {
              measHeaders = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            }

            if (field === 'Table2_mAApplied' || field === 'Table2_mAsApplied' || field === 'Table2_ma') {
              currentRowIdx++;
              currentRow = { ma: value, measuredOutputs: [] };
              table2Rows[currentRowIdx] = currentRow;
            } else if ((field.startsWith('Table2_measuredOutput') || field.startsWith('Table2_Meas')) && currentRow) {
              const m1 = field.match(/^Table2_measuredOutput(\d+)$/);
              const m2 = field.match(/^Table2_Meas(\d+)$/);
              const mIdx = m1 ? parseInt(m1[1]) - 1 : m2 ? parseInt(m2[1]) - 1 : -1;
              if (mIdx >= 0) {
                while (currentRow.measuredOutputs.length <= mIdx) currentRow.measuredOutputs.push('');
                currentRow.measuredOutputs[mIdx] = value;
              }
            } else if (field.startsWith('Table2_')) {
              while (table2Rows.length <= rowIndex) {
                table2Rows.push({ ma: '', measuredOutputs: [], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' });
              }
              const fieldName = field.replace('Table2_', '');
              const measMatch = fieldName.match(/^Meas(\d+)$/);
              if (measMatch) {
                const colIndex = parseInt(measMatch[1]) - 1;
                while (table2Rows[rowIndex].measuredOutputs.length <= colIndex) table2Rows[rowIndex].measuredOutputs.push('');
                table2Rows[rowIndex].measuredOutputs[colIndex] = value;
              } else if (fieldName === 'mAApplied' || fieldName === 'mAsApplied' || fieldName === 'ma') {
                table2Rows[rowIndex].ma = value;
              } else if (fieldName === 'Average') table2Rows[rowIndex].average = value;
              else if (fieldName === 'x') table2Rows[rowIndex].x = value;
              else if (fieldName === 'xMax') table2Rows[rowIndex].xMax = value;
              else if (fieldName === 'xMin') table2Rows[rowIndex].xMin = value;
              else if (fieldName === 'col') table2Rows[rowIndex].col = value;
            }
          });

          if (table1Row.fcd || table1Row.kv || table1Row.time || table2Rows.length > 0) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              linearityOfMaLoading: {
                table1: table1Row,
                table2: table2Rows,
                tolerance,
                toleranceOperator,
                measHeaders,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error processing Linearity of mA Loading:', error);
        }
      }

      // Process Reproducibility of Radiation Output
      console.log('Checking for Reproducibility of Radiation Output data...');
      console.log('Available keys in groupedData:', Object.keys(groupedData));
      console.log('Reproducibility data:', groupedData['Reproducibility of Radiation Output']);

      if (groupedData['Reproducibility of Radiation Output'] && groupedData['Reproducibility of Radiation Output'].length > 0) {
        try {
          const data = groupedData['Reproducibility of Radiation Output'];
          console.log('Processing Reproducibility of Radiation Output, data rows:', data.length);
          const outputRows: any[] = [];
          let measurementHeaders: string[] = [];
          let tolerance = { operator: '<=', value: '5.0' };
          let fcdValue = '';
          let outputRowIdx = -1;

          const applyOutputField = (fieldName: string, value: string, explicitIdx: number) => {
            if (fieldName.toLowerCase() === 'kv') {
              outputRowIdx = explicitIdx >= 0 ? explicitIdx : outputRowIdx + 1;
              while (outputRows.length <= outputRowIdx) {
                outputRows.push({ kv: '', mas: '', outputs: [], remark: '' });
              }
              outputRows[outputRowIdx].kv = value;
            } else if (fieldName.toLowerCase() === 'mas') {
              const idx = explicitIdx >= 0 ? explicitIdx : Math.max(outputRowIdx, 0);
              while (outputRows.length <= idx) {
                outputRows.push({ kv: '', mas: '', outputs: [], remark: '' });
              }
              outputRowIdx = idx;
              outputRows[idx].mas = value;
            } else if (fieldName.toLowerCase().startsWith('meas')) {
              const idx = explicitIdx >= 0 ? explicitIdx : Math.max(outputRowIdx, 0);
              while (outputRows.length <= idx) {
                outputRows.push({ kv: '', mas: '', outputs: [], remark: '' });
              }
              outputRowIdx = idx;
              const colIndex = parseInt(fieldName.toLowerCase().replace('meas', '')) - 1;
              if (!isNaN(colIndex) && colIndex >= 0) {
                while (outputRows[idx].outputs.length <= colIndex) {
                  outputRows[idx].outputs.push({ value: '' });
                }
                outputRows[idx].outputs[colIndex] = { value };
              }
            }
          };

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            let rowIndex = rowIndexStr === '' ? -1 : parseInt(rowIndexStr);
            if (isNaN(rowIndex as number)) rowIndex = -1;

            if (field === 'Tolerance' || field === 'Tolerance_Value') tolerance.value = value;
            if (field === 'Tolerance_Operator') tolerance.operator = value;
            if (field === 'MeasColumnLabels') {
              measurementHeaders = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            }
            if (field === 'FCD_Value' || field === 'FCD' || field === 'FFD' || field === 'FFD_Value' || field === 'Row_FCD' || field === 'Row_FFD') {
              fcdValue = value;
            }

            if (field.startsWith('OutputRow_')) {
              applyOutputField(field.replace('OutputRow_', '').trim(), value, rowIndex);
            } else if (field.startsWith('Row_')) {
              applyOutputField(field.replace('Row_', '').trim(), value, rowIndex);
            }
          });

          // Log all rows before filtering
          console.log('All outputRows before filtering:', JSON.stringify(outputRows, null, 2));

          // Filter out empty rows - but be more lenient, keep rows that have any data
          const validOutputRows = outputRows.filter(row => {
            const hasKv = row.kv && row.kv.trim() !== '';
            const hasMas = row.mas && row.mas.trim() !== '';
            const hasOutputs = row.outputs && row.outputs.length > 0 && row.outputs.some((o: any) => o && o.value && String(o.value).trim() !== '');
            const isValid = hasKv || hasMas || hasOutputs;
            console.log(`Row validation:`, { row, hasKv, hasMas, hasOutputs, isValid });
            return isValid;
          });

          console.log('Valid outputRows after filtering:', JSON.stringify(validOutputRows, null, 2));

          if (validOutputRows.length > 0 || fcdValue) {
            const dataToSet = {
              outputRows: validOutputRows,
              tolerance,
              measurementHeaders,
              ...(fcdValue ? { fcd: { value: fcdValue } } : {}),
            };
            console.log('Setting Reproducibility of Radiation Output data:', JSON.stringify(dataToSet, null, 2));
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              reproducibilityOfRadiationOutput: dataToSet,
            }));
            setCsvDataVersion(prev => prev + 1);
          } else {
            console.warn('No valid output rows found for Reproducibility of Radiation Output. All rows:', outputRows);
          }
        } catch (error: any) {
          console.error('Error processing Reproducibility of Radiation Output:', error);
        }
      }

      // Process Tube Housing Leakage
      if (groupedData['Tube Housing Leakage'] && groupedData['Tube Housing Leakage'].length > 0) {
        try {
          const data = groupedData['Tube Housing Leakage'];
          const measurementSettings = { distance: '', kv: '', ma: '', time: '' };
          const leakageMeasurements: any[] = [];
          let workload = '';
          let leakageHeaders: string[] = [];
          let toleranceValue = '1';
          let toleranceOperator: 'less than or equal to' | 'greater than or equal to' | '=' = 'less than or equal to';
          let toleranceTime = '1';

          let leakageRowIdx = -1;
          const normalizeLeakageLocation = (loc: string) => {
            const s = loc.toLowerCase();
            if (s.includes('collimator')) return 'Collimator';
            if (s.includes('tube')) return 'Tube';
            return loc;
          };

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            let rowIndex = rowIndexStr === '' ? -1 : parseInt(rowIndexStr);
            if (isNaN(rowIndex as number)) rowIndex = -1;

            if (field === 'Settings_Distance' || field === 'Settings_FCD' || field === 'Settings_FDD' || field === 'Settings_FFD') {
              measurementSettings.distance = value;
            }
            if (field === 'Settings_kV') measurementSettings.kv = value;
            if (field === 'Settings_ma' || field === 'Settings_mA') measurementSettings.ma = value;
            if (field === 'Settings_time' || field === 'Settings_Time') measurementSettings.time = value;
            if (field === 'Workload') workload = value;
            if (field === 'MeasColumnLabels') {
              leakageHeaders = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            }
            if (field === 'ToleranceValue') toleranceValue = value;
            if (field === 'ToleranceOperator') toleranceOperator = value as any;
            if (field === 'ToleranceTime') toleranceTime = value;

            if (field.startsWith('LeakageMeasurement_')) {
              const fieldName = field.replace('LeakageMeasurement_', '');
              if (fieldName === 'Location') {
                leakageRowIdx = rowIndex >= 0 ? rowIndex : leakageRowIdx + 1;
              }
              const activeIdx = fieldName === 'Location'
                ? leakageRowIdx
                : (rowIndex >= 0 ? rowIndex : Math.max(leakageRowIdx, 0));
              while (leakageMeasurements.length <= activeIdx) {
                leakageMeasurements.push({
                  location: '',
                  left: '',
                  right: '',
                  front: '',
                  back: '',
                  top: '',
                  max: '',
                  unit: 'mR/h',
                });
              }
              if (fieldName === 'Location') leakageMeasurements[activeIdx].location = normalizeLeakageLocation(value);
              if (fieldName === 'Left') leakageMeasurements[activeIdx].left = value;
              if (fieldName === 'Right') leakageMeasurements[activeIdx].right = value;
              if (fieldName === 'Front') leakageMeasurements[activeIdx].front = value;
              if (fieldName === 'Back') leakageMeasurements[activeIdx].back = value;
              if (fieldName === 'Top') leakageMeasurements[activeIdx].top = value;
            }
          });

          if (leakageMeasurements.length > 0 || measurementSettings.kv || measurementSettings.ma) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              tubeHousingLeakage: {
                measurementSettings,
                workload,
                leakageMeasurements: leakageMeasurements,
                leakageHeaders,
                toleranceValue,
                toleranceOperator,
                toleranceTime,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error processing Tube Housing Leakage:', error);
        }
      }

      // Process Radiation Protection Survey
      if (groupedData['Radiation Protection Survey'] && groupedData['Radiation Protection Survey'].length > 0) {
        try {
          const data = groupedData['Radiation Protection Survey'];
          let surveyDate = '';
          let appliedCurrent = '';
          let appliedVoltage = '';
          let exposureTime = '';
          let workload = '';
          let calibrationCertificateValid = '';
          const locations: any[] = [];

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'SurveyDate') surveyDate = value;
            if (field === 'AppliedCurrent') appliedCurrent = value;
            if (field === 'AppliedVoltage') appliedVoltage = value;
            if (field === 'ExposureTime') exposureTime = value;
            if (field === 'Workload') workload = value;
            if (field === 'CalibrationCertificateValid') calibrationCertificateValid = value;

            if (field.startsWith('Location_')) {
              while (locations.length <= rowIndex) {
                locations.push({
                  location: '',
                  mRPerHr: '',
                  mRPerWeek: '',
                  result: '',
                  category: '',
                });
              }
              const fieldName = field.replace('Location_', '');
              if (fieldName === 'Location') locations[rowIndex].location = value;
              if (fieldName === 'mRPerHr') locations[rowIndex].mRPerHr = value;
              if (fieldName === 'mRPerWeek') locations[rowIndex].mRPerWeek = value;
              if (fieldName === 'Result') locations[rowIndex].result = value;
              if (fieldName === 'Category') locations[rowIndex].category = value;
            }
          });

          if (locations.length > 0 || surveyDate || appliedCurrent) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              radiationProtectionSurvey: {
                surveyDate,
                appliedCurrent,
                appliedVoltage,
                exposureTime,
                workload,
                calibrationCertificateValid,
                locations,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error processing Radiation Protection Survey:', error);
        }
      }

    } catch (error: any) {
      console.error('Error processing CSV data:', error);
      throw error;
    } finally {
      setCsvUploading(false);
    }
  };

  // Handle CSV file upload
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    // For Excel files, we'd need a library like xlsx, but for now we'll support CSV
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      toast.error('Excel file support coming soon. Please convert to CSV first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const csvData = parseCSV(text);
        await processCSVData(csvData);
        toast.success('File data loaded and auto-filled successfully!');
      } catch (error: any) {
        console.error('Error reading CSV file:', error);
        toast.error(`Failed to read CSV file: ${error?.message || 'Unknown error'}`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read CSV file');
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert Excel file to CSV format (supports Field-Value and TEST: templates)
  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    if (jsonData.length === 0) return [];
    const rows = jsonData.map((r) => r.map((c) => String(c ?? '').trim())).filter((r) => r.some((c) => c));
    if (rows.length === 0) return [];
    const first = (rows[0][0] || '').trim().toLowerCase();
    if (first === 'field name' || first === 'fieldname') {
      return parseFieldValueData(rows);
    }
    return parseHorizontalBmdTemplate(rows);
  };

  // Fetch and process CSV/Excel file from URL (passed from ServiceDetails2)
  useEffect(() => {
    const fetchAndProcessFile = async () => {
      if (!csvFileUrl) {
        console.log('GenerateReportForBMD: No csvFileUrl provided, skipping file fetch');
        return;
      }

      console.log('GenerateReportForBMD: Fetching file from URL:', csvFileUrl);

      try {
        setCsvUploading(true);

        const isExcel = isExcelFileUrl(csvFileUrl);

        let csvData: any[] = [];

        if (isExcel) {
          console.log('GenerateReportForBMD: Detected Excel file, fetching through proxy...');
          toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

          // Use proxy endpoint (uses AWS SDK on backend, same as s3Fetch.js)
          const response = await proxyFile(csvFileUrl);
          // response.data is a Blob when using responseType: 'blob'
          const arrayBuffer = await response.data.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          console.log('GenerateReportForBMD: Excel file parsed, sheets:', workbook.SheetNames);

          // Convert Excel to CSV format
          csvData = parseExcelToCSVFormat(workbook);
          console.log('GenerateReportForBMD: Converted Excel to CSV format, rows:', csvData.length);
        } else {
          console.log('GenerateReportForBMD: Detected CSV file, fetching through proxy...');
          toast.loading('Loading CSV data from file...', { id: 'csv-loading' });

          // Use proxy endpoint (uses AWS SDK on backend, same as s3Fetch.js)
          const response = await proxyFile(csvFileUrl);
          // response.data is a Blob when using responseType: 'blob'
          const text = await response.data.text();
          console.log('GenerateReportForBMD: CSV file fetched, length:', text.length);
          console.log('GenerateReportForBMD: First 500 chars of CSV:', text.substring(0, 500));

          // Parse CSV
          csvData = parseCSV(text);
        }

        console.log('GenerateReportForBMD: Parsed data, rows:', csvData.length);
        console.log('GenerateReportForBMD: First few rows:', csvData.slice(0, 5));

        if (csvData.length > 0) {
          console.log('GenerateReportForBMD: Processing data...');
          await processCSVData(csvData);
          console.log('GenerateReportForBMD: Data processed successfully');
          toast.success('File data loaded and auto-filled successfully!', { id: 'csv-loading' });
        } else {
          console.warn('GenerateReportForBMD: No data found in file');
          toast.error('File is empty or could not be parsed', { id: 'csv-loading' });
        }
      } catch (error: any) {
        console.error('GenerateReportForBMD: Error fetching or processing file:', error);

        // Try to extract error message from response
        let errorMessage = 'Unknown error';
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.response?.data) {
          // If error response is a JSON blob, try to parse it
          if (error.response.data instanceof Blob && error.response.data.type === 'application/json') {
            try {
              const errorText = await error.response.data.text();
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorMessage;
              if (errorJson.details) {
                console.error('Error details:', errorJson.details);
                errorMessage += ` (Key: ${errorJson.details.key}, Bucket: ${errorJson.details.bucket})`;
              }
            } catch (parseError) {
              // If parsing fails, use default message
            }
          }
        }

        toast.error(`Failed to load file: ${errorMessage}`, { id: 'csv-loading' });
      } finally {
        setCsvUploading(false);
      }
    };

    fetchAndProcessFile();
  }, [csvFileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const firstTest = data.qaTests[0];

        setDetails(data);

        // SRF date = order created at; Test date = QA test submitted at (or createdAt)
        const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
        const testDateSource = firstTest?.qatestSubmittedAt || firstTest?.createdAt;
        const testDateStr = testDateSource ? new Date(testDateSource).toISOString().split("T")[0] : "";
        let testDueDateStr = "";
        if (testDateStr) {
          const testDate = new Date(testDateStr);
          const dueDate = new Date(testDate);
          dueDate.setFullYear(dueDate.getFullYear() + 2);
          testDueDateStr = dueDate.toISOString().split("T")[0];
        }

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
          rpId: data.rpId || "",
          category: data.category || "",
        });

        const mapped: Standard[] = toolRes.data.toolsAssigned.map(
          (t: any, idx: number) => ({
            slNumber: String(idx + 1),
            nomenclature: t.nomenclature,
            make: t.manufacturer || t.make,
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

  // Load report header and test IDs
  useEffect(() => {
    const loadReportHeader = async () => {
      if (!serviceId) return;
      try {
        const res = await getReportHeaderForBMD(serviceId);
        if (res?.exists && res?.data) {
          // Calculate test due date if testDate exists but testDueDate is missing
          let calculatedTestDueDate = res.data.testDueDate;
          if (res.data.testDate && !res.data.testDueDate) {
            const testDate = new Date(res.data.testDate);
            if (!isNaN(testDate.getTime())) {
              const dueDate = new Date(testDate);
              dueDate.setFullYear(dueDate.getFullYear() + 2);
              calculatedTestDueDate = dueDate.toISOString().split("T")[0];
            }
          }

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
            testDueDate: calculatedTestDueDate || prev.testDueDate,
            location: res.data.location || prev.location,
            temperature: res.data.temperature || prev.temperature,
            humidity: res.data.humidity || prev.humidity,
            engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
            rpId: res.data.rpId || prev.rpId,
                        authorizedSignatory: (typeof res.data.authorizedSignatory === "object" ? res.data.authorizedSignatory?._id : res.data.authorizedSignatory) || prev.authorizedSignatory || "",
          }));
          if (res.data.testDate) setMinIssueDate(res.data.testDate);

          // Load existing notes, or use default if none exist
          if (res.data.notes && Array.isArray(res.data.notes) && res.data.notes.length > 0) {
            const notesTexts = res.data.notes.map((n: any) => n.text || n);
            setNotes(notesTexts);
          } else {
            setNotes(defaultNotes);
          }

          // Save test IDs
          const testIds = {
            accuracy: res.data.accuracy?._id || res.data.accuracy,
            linearity: res.data.linearity?._id || res.data.linearity,
            reproducibility: res.data.reproducibility?._id || res.data.reproducibility,
            leakage: res.data.leakage?._id || res.data.leakage,
            protection: res.data.protection?._id || res.data.protection,
          };
          setSavedTestIds(testIds);
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

  // Auto-calculate test due date when test date changes (2 years from test date)
  useEffect(() => {
    if (formData.testDate) {
      const testDate = new Date(formData.testDate);
      if (!isNaN(testDate.getTime())) {
        const dueDate = new Date(testDate);
        dueDate.setFullYear(dueDate.getFullYear() + 2);
        const dueDateStr = dueDate.toISOString().split("T")[0];
        setFormData(prev => {
          // Only update if it's different to avoid infinite loops
          if (prev.testDueDate !== dueDateStr) {
            return { ...prev, testDueDate: dueDateStr };
          }
          return prev;
        });
      }
    }
  }, [formData.testDate]);

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
    if (Array.isArray((data as any).locations) && (data as any).locations.length > 0) return true;
    return false;
  };

  const getUnsavedTestNames = async (): Promise<string[]> => {
    const run = (name: string, fn: () => Promise<any>) => ({ name, check: async () => { try { return isSaved(await fn()); } catch { return false; } } });
    const checks: { name: string; check: () => Promise<boolean> }[] = [
      run("Accuracy Of Operating Potential & Total Filtration", () => getTotalFiltrationByServiceIdForBMD(serviceId)),
      run("Linearity Of Ma Loading stations", () => getLinearityOfMaLoadingByServiceIdForBMD(serviceId)),
      run("Reproducibility Of Radiation Output", () => getReproducibilityOfRadiationOutputByServiceIdForBmd(serviceId)),
      run("Radiation Leakage Level at 1m from tube housing and collimator", () => getRadiationLeakageLevelByServiceIdForBMD(serviceId)),
      run("Radiation Protection Survey", () => getRadiationProtectionSurveyByServiceIdForBmd(serviceId)),
    ];
    if (hasTimer !== false) {
      checks.push(run("Accuracy Of Irradiation Time", () => getAccuracyOfIrradiationTimeByServiceIdForBMD(serviceId)));
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
        rpid: formData.rpId,
        rpID: formData.rpId,
        RPId: formData.rpId,
        RPID: formData.rpId,
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
          // uncertainity: t.uncertainity,
        })),
        notes: notes.map((text, index) => ({ slNo: `5.${index + 1}`, text })),
      };

      await saveReportHeaderForBMD(serviceId, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to save report header");
    } finally {
      setSaving(false);
    }
  };

  const handleExportSavedData = async () => {
    if (!serviceId) {
      toast.error("Service ID is missing");
      return;
    }
    try {
      toast.loading("Exporting data to Excel...", { id: "export-excel" });
      setIsExporting(true);
      const exportData: BMDSavedExportData & { reportHeader?: any } = {};

      try {
        const headerRes = await getReportHeaderForBMD(serviceId);
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

      exportData.accuracyOfIrradiationTime = await fetchTest(() => getAccuracyOfIrradiationTimeByServiceIdForBMD(serviceId));
      exportData.totalFiltration = await fetchTest(() => getTotalFiltrationByServiceIdForBMD(serviceId));
      exportData.accuracyOfOperatingPotentialAndTime = await fetchTest(() => getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD(serviceId));
      exportData.linearityOfMaLoading = await fetchTest(() => getLinearityOfMaLoadingByServiceIdForBMD(serviceId));
      exportData.reproducibilityOfRadiationOutput = await fetchTest(() => getReproducibilityOfRadiationOutputByServiceIdForBmd(serviceId));
      exportData.radiationLeakageLevel = await fetchTest(() => getRadiationLeakageLevelByServiceIdForBMD(serviceId));
      exportData.radiationProtectionSurvey = await fetchTest(() => getRadiationProtectionSurveyByServiceIdForBmd(serviceId));

      const hasData = Object.keys(exportData).filter((k) => k !== "reportHeader").some((k) => exportData[k] != null);
      if (!hasData) {
        toast.error("No data found to export. Please save test data first.", { id: "export-excel" });
        return;
      }
      const wb = createBMDSavedExcel(exportData as BMDSavedExportData);
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `BMD_Test_Data_${timestamp}.xlsx`);
      toast.success("Data exported successfully!", { id: "export-excel" });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data: " + (error?.message || "Unknown error"), { id: "export-excel" });
    } finally {
      setIsExporting(false);
    }
  };

  // Memoize test components to recreate them when CSV data changes
  // MUST be called before any conditional returns to follow Rules of Hooks
  const testComponents = useMemo(() => {
    const testItems = [
      {
        title: "Accuracy Of Irradiation Time",
        component: <AccuracyOfIrradiationTime key={`accuracy-time-${csvDataVersion}`} serviceId={serviceId} initialData={csvDataForComponents.accuracyOfIrradiationTime} />,
        show: hasTimer !== false // Show if timer is true or not yet determined
      },
      {
        title: "Accuracy Of Operating Potential & Total Filtration",
        component: <TotalFilteration key={`total-filtration-${csvDataVersion}`} serviceId={serviceId} initialData={csvDataForComponents.totalFiltration || csvDataForComponents.accuracyOfOperatingPotential} />
      },
      {
        title: "Linearity Of Ma Loading stations",
        component: <LinearityOfMaLoading key={`linearity-${csvDataVersion}`} serviceId={serviceId} testId={savedTestIds['linearity']} onRefresh={() => { }} initialData={csvDataForComponents.linearityOfMaLoading} />
      },
      {
        title: "Reproducibility Of Radiation Output",
        component: (() => {
          const data = csvDataForComponents.reproducibilityOfRadiationOutput;
          // Create a unique key based on the data content to force remount when data changes
          const dataKey = data && data.outputRows ?
            `reproducibility-${csvDataVersion}-${JSON.stringify(data.outputRows).slice(0, 50)}` :
            `reproducibility-${csvDataVersion}`;
          console.log('GenerateReportForBMD: Passing reproducibilityOfRadiationOutput to component:', data, 'key:', dataKey);
          return <ConsistencyOfRadiationOutput
            key={dataKey}
            serviceId={serviceId}
            testId={savedTestIds['reproducibility']}
            onTestSaved={(testId) => handleTestSaved('reproducibility', testId)}
            initialData={data}
          />;
        })()
      },
      {
        title: "Radiation Leakage Level at 1m from tube housing and collimator",
        component: <TubeHousingLeakage key={`leakage-${csvDataVersion}`} serviceId={serviceId} testId={savedTestIds['leakage']} onRefresh={() => { }} initialData={csvDataForComponents.tubeHousingLeakage} />
      },
      {
        title: "Radiation Protection Survey",
        component: (
          <RadiationProtectionSurvey
            key={`protection-${csvDataVersion}`}
            serviceId={serviceId}
            testId={savedTestIds['protection']}
            onTestSaved={(testId) => handleTestSaved('protection', testId)}
            initialData={csvDataForComponents.radiationProtectionSurvey}
            initialSurveyDate={formData.testDate || minIssueDate || ""}
          />
        )
      },
      // { title: "Equipment Setting", component: <EquipmentSetting serviceId={serviceId} /> },
      // { title: "Maximum Radiation level", component: <MaxRadiationLevel serviceId={serviceId} /> },
    ];

    return testItems.filter(item => item.show !== false).map((item: any, idx: number) => (
      <Disclosure key={`${idx}-${csvDataVersion}`} defaultOpen={idx === 0}>
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
    ));
  }, [csvDataForComponents, csvDataVersion, serviceId, savedTestIds, hasTimer, handleTestSaved]);

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

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Generate QA Test Report - BMD/DEXA
      </h1>

      {/* Excel Actions — same layout as Dental Cone Beam CT */}
      <div className="flex flex-wrap gap-4 justify-center mb-8 print:hidden">
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            id="excel-upload-bmd"
            accept=".xlsx, .xls ,.csv"
            onChange={handleCSVUpload}
            className="hidden"
            disabled={csvUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={csvUploading}
            className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition shadow disabled:opacity-50"
          >
            {csvUploading ? "Uploading..." : "Import Excel Data"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleExportSavedData}
          disabled={isExporting || csvUploading}
          className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow ${(isExporting || csvUploading) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isExporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>
      {csvFileUrl && (
        <p className="text-sm text-gray-600 text-center mb-6">
          {csvUploading ? (
            <span className="text-blue-600">Auto-loading Excel from Service Details...</span>
          ) : (
            <>
              File loaded from: <span className="font-mono text-xs">{csvFileUrl}</span>
            </>
          )}
        </p>
      )}

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
          ].map((field, i) => (
            <div key={i}>
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

      
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-blue-700 mb-3">Authorized Signatory</h2>
                <div className="max-w-xl">
                    <AuthorizedSignatorySelect
                        value={formData.authorizedSignatory}
                        onChange={(selected) =>
                            setFormData((prev) => ({
                                ...prev,
                                authorizedSignatory: selected?._id || "",
                            }))
                        }
                    />
                </div>
            </section>

            <Standards standards={tools} />
      <Notes initialNotes={notes} onChange={setNotes} />

      {/* Save & View Report Buttons */}
      <div className="mt-8 flex justify-end gap-4 items-center">
        {saveSuccess && (
          <span className="text-green-600 font-medium animate-pulse">
            Report Header Saved Successfully!
          </span>
        )}
        {saveError && (
          <span className="text-red-600 font-medium">
            {saveError}
          </span>
        )}
        <button
          onClick={handleSaveHeader}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
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
            navigate(`/admin/orders/view-service-report-bmd?serviceId=${serviceId}`);
          }}
        >
          View Generated Report
        </button>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
        {testComponents}
      </div>
    </div>
  );
};

export default GenerateReportForBMD;