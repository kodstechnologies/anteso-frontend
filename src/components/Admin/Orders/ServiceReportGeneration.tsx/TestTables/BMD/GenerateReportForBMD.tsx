// GenerateReportForBMD.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { getDetails, getTools, saveReportHeader, getReportHeaderForBMD, proxyFile } from "../../../../../../api";

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

  // Check for timer preference from localStorage
  useEffect(() => {
    const timerChoice = localStorage.getItem(`bmd-timer-${serviceId}`);
    if (timerChoice !== null) {
      setHasTimer(timerChoice === 'true');
    }
  }, [serviceId]);

  // Parse CSV text into structured data
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

    const headers = parseLine(lines[0]);
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

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const fieldName = (row['Field Name'] || '').trim();
      const firstColumn = (row[headers[0]] || '').trim();

      // Check if this is a section header (in Field Name column or first column)
      const potentialSectionHeader = fieldName || firstColumn;
      if (potentialSectionHeader.startsWith('==========') && potentialSectionHeader.endsWith('==========')) {
        // Try exact match first
        currentTestName = sectionToTestName[potentialSectionHeader] || '';

        // If no exact match, try to find a matching key
        if (!currentTestName) {
          const matchingKey = Object.keys(sectionToTestName).find(key =>
            potentialSectionHeader.includes(key.replace(/==========/g, '').trim()) ||
            key.includes(potentialSectionHeader.replace(/==========/g, '').trim())
          );
          if (matchingKey) {
            currentTestName = sectionToTestName[matchingKey];
          }
        }

        console.log(`ParseCSV: Found section header: "${potentialSectionHeader}", mapped to test: "${currentTestName}"`);
        continue;
      }

      if (firstColumn.startsWith('---') || firstColumn === '' || !fieldName) {
        continue;
      }

      const isKnownField = fieldName.match(/^(Table|Tolerance|TestConditions|IrradiationTime|Measurement|Row|OutputRow|Settings|Workload|LeakageMeasurement|Location|SurveyDate|AppliedCurrent|AppliedVoltage|ExposureTime|mAStations|TotalFiltration|FiltrationTolerance)/);
      if (!isKnownField) {
        continue;
      }

      if (currentTestName) {
        row['Test Name'] = currentTestName;
        data.push(row);
      } else {
        console.warn(`ParseCSV: Found field "${fieldName}" but no current test name is set`);
      }
    }

    return data;
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
            }

            if (field === 'Tolerance_Value') tolerance.value = value;
            if (field === 'Tolerance_Type') tolerance.type = value as any;
            if (field === 'Tolerance_Sign') tolerance.sign = value as any;
          });

          if (table1Row.time || table1Row.sliceThickness || table2Rows.length > 0) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              accuracyOfOperatingPotential: {
                table1: [table1Row],
                table2: table2Rows,
                tolerance: tolerance,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
            toast.success('Accuracy of Operating Potential data loaded from CSV');
          }
        } catch (error: any) {
          console.error('Error processing Accuracy of Operating Potential:', error);
          toast.error(`Failed to process Accuracy of Operating Potential: ${error?.message || 'Unknown error'}`);
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
            toast.success('Accuracy of Irradiation Time data loaded from CSV');
          }
        } catch (error: any) {
          console.error('Error processing Accuracy of Irradiation Time:', error);
          toast.error(`Failed to process Accuracy of Irradiation Time: ${error?.message || 'Unknown error'}`);
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
          const totalFiltration = { measured: '', required: '', atKvp: '' };
          const filtrationTolerance = {
            forKvGreaterThan70: '1.5',
            forKvBetween70And100: '2.0',
            forKvGreaterThan100: '2.5',
            kvThreshold1: '70',
            kvThreshold2: '100',
          };

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'mAStations') {
              if (!mAStations.includes(value)) {
                mAStations.push(value);
              }
            }

            if (field === 'Tolerance_Sign') toleranceSign = value;
            if (field === 'Tolerance_Value') toleranceValue = value;

            if (field === 'TotalFiltration_Measured') totalFiltration.measured = value;
            if (field === 'TotalFiltration_Required') totalFiltration.required = value;
            if (field === 'TotalFiltration_AtKvp') totalFiltration.atKvp = value;

            if (field === 'FiltrationTolerance_ForKvGreaterThan70') filtrationTolerance.forKvGreaterThan70 = value;
            if (field === 'FiltrationTolerance_ForKvBetween70And100') filtrationTolerance.forKvBetween70And100 = value;
            if (field === 'FiltrationTolerance_ForKvGreaterThan100') filtrationTolerance.forKvGreaterThan100 = value;
            if (field === 'FiltrationTolerance_KvThreshold1') filtrationTolerance.kvThreshold1 = value;
            if (field === 'FiltrationTolerance_KvThreshold2') filtrationTolerance.kvThreshold2 = value;

            if (field.startsWith('Measurement_')) {
              while (measurements.length <= rowIndex) {
                measurements.push({ appliedKvp: '', measuredValues: [], averageKvp: '', remarks: '' });
              }
              const fieldName = field.replace('Measurement_', '');
              if (fieldName === 'AppliedKvp') {
                measurements[rowIndex].appliedKvp = value;
              } else if (fieldName.startsWith('Meas')) {
                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                while (measurements[rowIndex].measuredValues.length <= colIndex) {
                  measurements[rowIndex].measuredValues.push('');
                }
                measurements[rowIndex].measuredValues[colIndex] = value;
              } else if (fieldName === 'AverageKvp') {
                measurements[rowIndex].averageKvp = value;
                // Remarks will be calculated automatically by the component
              }
            }
          });

          if (measurements.length > 0 || mAStations.length > 0) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              totalFiltration: {
                mAStations: mAStations.length > 0 ? mAStations : ['50 mA', '100 mA'],
                measurements,
                tolerance: { sign: toleranceSign, value: toleranceValue },
                totalFiltration,
                filtrationTolerance,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
            toast.success('Total Filtration data loaded from CSV');
          }
        } catch (error: any) {
          console.error('Error processing Total Filtration:', error);
          toast.error(`Failed to process Total Filtration: ${error?.message || 'Unknown error'}`);
        }
      }

      // Process Linearity of mA Loading
      if (groupedData['Linearity of mA Loading'] && groupedData['Linearity of mA Loading'].length > 0) {
        try {
          const data = groupedData['Linearity of mA Loading'];
          const table1Row = { fcd: '', kv: '', time: '' };
          const table2Rows: any[] = [];
          let tolerance = '0.1';

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'Table1_FCD') table1Row.fcd = value;
            if (field === 'Table1_kV') table1Row.kv = value;
            if (field === 'Table1_Time') table1Row.time = value;
            if (field === 'Tolerance') tolerance = value;

            if (field.startsWith('Table2_')) {
              while (table2Rows.length <= rowIndex) {
                table2Rows.push({ ma: '', measuredOutputs: [], average: '', x: '', xMax: '', xMin: '', col: '', remarks: '' });
              }
              const fieldName = field.replace('Table2_', '');
              if (fieldName === 'ma') table2Rows[rowIndex].ma = value;
              else if (fieldName.startsWith('Meas')) {
                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                while (table2Rows[rowIndex].measuredOutputs.length <= colIndex) {
                  table2Rows[rowIndex].measuredOutputs.push('');
                }
                table2Rows[rowIndex].measuredOutputs[colIndex] = value;
              } else if (fieldName === 'Average') table2Rows[rowIndex].average = value;
              else if (fieldName === 'x') table2Rows[rowIndex].x = value;
              else if (fieldName === 'xMax') table2Rows[rowIndex].xMax = value;
              else if (fieldName === 'xMin') table2Rows[rowIndex].xMin = value;
              else if (fieldName === 'col') table2Rows[rowIndex].col = value;
              // Remarks will be calculated automatically by the component
            }
          });

          if (table1Row.fcd || table1Row.kv || table1Row.time || table2Rows.length > 0) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              linearityOfMaLoading: {
                table1: table1Row,
                table2: table2Rows,
                tolerance,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
            toast.success('Linearity of mA Loading data loaded from CSV');
          }
        } catch (error: any) {
          console.error('Error processing Linearity of mA Loading:', error);
          toast.error(`Failed to process Linearity of mA Loading: ${error?.message || 'Unknown error'}`);
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
          let tolerance = { operator: '<=', value: '5.0' };

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'Tolerance' || field === 'Tolerance_Value') tolerance.value = value;
            if (field === 'Tolerance_Operator') tolerance.operator = value;

            if (field.startsWith('OutputRow_')) {
              while (outputRows.length <= rowIndex) {
                outputRows.push({ kv: '', mas: '', outputs: [], remark: '' });
              }
              const fieldName = field.replace('OutputRow_', '').trim();
              const fieldNameLower = fieldName.toLowerCase();
              console.log(`Processing field: ${field}, fieldName: ${fieldName}, value: ${value}, rowIndex: ${rowIndex}`);

              if (fieldNameLower === 'kv') {
                outputRows[rowIndex].kv = value;
                console.log(`Set kv for row ${rowIndex}: ${value}`);
              } else if (fieldNameLower === 'mas') {
                outputRows[rowIndex].mas = value;
                console.log(`Set mas for row ${rowIndex}: ${value}`);
              } else if (fieldNameLower.startsWith('meas')) {
                const colIndex = parseInt(fieldNameLower.replace('meas', '')) - 1;
                if (!isNaN(colIndex) && colIndex >= 0) {
                  while (outputRows[rowIndex].outputs.length <= colIndex) {
                    outputRows[rowIndex].outputs.push({ value: '' });
                  }
                  outputRows[rowIndex].outputs[colIndex] = { value };
                  console.log(`Set Meas${colIndex + 1} for row ${rowIndex}: ${value}`);
                } else {
                  console.warn(`Invalid Meas index for field: ${fieldName}, value: ${value}`);
                }
                // Remark will be calculated automatically by the component
              } else {
                console.warn(`Unknown field name: ${fieldName} for value: ${value}`);
              }
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

          if (validOutputRows.length > 0) {
            const dataToSet = {
              outputRows: validOutputRows,
              tolerance,
            };
            console.log('Setting Reproducibility of Radiation Output data:', JSON.stringify(dataToSet, null, 2));
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              reproducibilityOfRadiationOutput: dataToSet,
            }));
            setCsvDataVersion(prev => prev + 1);
            toast.success('Reproducibility of Radiation Output data loaded from CSV');
          } else {
            console.warn('No valid output rows found for Reproducibility of Radiation Output. All rows:', outputRows);
          }
        } catch (error: any) {
          console.error('Error processing Reproducibility of Radiation Output:', error);
          toast.error(`Failed to process Reproducibility of Radiation Output: ${error?.message || 'Unknown error'}`);
        }
      }

      // Process Tube Housing Leakage
      if (groupedData['Tube Housing Leakage'] && groupedData['Tube Housing Leakage'].length > 0) {
        try {
          const data = groupedData['Tube Housing Leakage'];
          const measurementSettings = { distance: '', kv: '', ma: '', time: '' };
          const leakageMeasurements: any[] = [];
          let workload = '';
          let toleranceValue = '1';
          let toleranceOperator: 'less than or equal to' | 'greater than or equal to' | '=' = 'less than or equal to';
          let toleranceTime = '1';

          data.forEach((row) => {
            const field = (row['Field Name'] || '').trim();
            const value = (row['Value'] || '').trim();
            const rowIndexStr = (row['Row Index'] || '').trim();
            const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

            if (field === 'Settings_Distance') measurementSettings.distance = value;
            if (field === 'Settings_kV') measurementSettings.kv = value;
            if (field === 'Settings_ma') measurementSettings.ma = value;
            if (field === 'Settings_time') measurementSettings.time = value;
            if (field === 'Workload') workload = value;
            if (field === 'ToleranceValue') toleranceValue = value;
            if (field === 'ToleranceOperator') toleranceOperator = value as any;
            if (field === 'ToleranceTime') toleranceTime = value;

            if (field.startsWith('LeakageMeasurement_')) {
              while (leakageMeasurements.length <= rowIndex) {
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
              const fieldName = field.replace('LeakageMeasurement_', '');
              if (fieldName === 'Location') leakageMeasurements[rowIndex].location = value;
              if (fieldName === 'Left') leakageMeasurements[rowIndex].left = value;
              if (fieldName === 'Right') leakageMeasurements[rowIndex].right = value;
              if (fieldName === 'Front') leakageMeasurements[rowIndex].front = value;
              if (fieldName === 'Back') leakageMeasurements[rowIndex].back = value;
              if (fieldName === 'Top') leakageMeasurements[rowIndex].top = value;
            }
          });

          if (leakageMeasurements.length > 0) {
            setCsvDataForComponents((prev: any) => ({
              ...prev,
              tubeHousingLeakage: {
                measurementSettings,
                workload,
                leakageMeasurements: leakageMeasurements,
                toleranceValue,
                toleranceOperator,
                toleranceTime,
              }
            }));
            setCsvDataVersion(prev => prev + 1);
            toast.success('Tube Housing Leakage data loaded from CSV');
          }
        } catch (error: any) {
          console.error('Error processing Tube Housing Leakage:', error);
          toast.error(`Failed to process Tube Housing Leakage: ${error?.message || 'Unknown error'}`);
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
            toast.success('Radiation Protection Survey data loaded from CSV');
          }
        } catch (error: any) {
          console.error('Error processing Radiation Protection Survey:', error);
          toast.error(`Failed to process Radiation Protection Survey: ${error?.message || 'Unknown error'}`);
        }
      }

      toast.success('CSV data processed successfully!');
    } catch (error: any) {
      console.error('Error processing CSV data:', error);
      toast.error(`Failed to process CSV: ${error?.message || 'Unknown error'}`);
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

  // Convert Excel file to CSV format (Field Name, Value, Row Index)
  const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
    const data: any[] = [];

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    if (jsonData.length === 0) return data;

    // Find header row (should contain "Field Name", "Value", "Row Index")
    let headerRowIndex = -1;
    let fieldNameCol = -1;
    let valueCol = -1;
    let rowIndexCol = -1;

    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim().toLowerCase();
        if (cell === 'field name' || cell === 'fieldname') {
          headerRowIndex = i;
          fieldNameCol = j;
        } else if (cell === 'value') {
          valueCol = j;
        } else if (cell === 'row index' || cell === 'rowindex') {
          rowIndexCol = j;
        }
      }
      if (headerRowIndex !== -1 && valueCol !== -1) break;
    }

    // If headers not found, assume first row is headers
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      fieldNameCol = 0;
      valueCol = 1;
      rowIndexCol = 2;
    }

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

    // Process rows after header
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const fieldName = String(row[fieldNameCol] || '').trim();
      const value = String(row[valueCol] || '').trim();
      const rowIndex = String(row[rowIndexCol] || '').trim();

      // Check if this is a section header
      if (fieldName.startsWith('==========') && fieldName.endsWith('==========')) {
        currentTestName = sectionToTestName[fieldName] || '';
        continue;
      }

      // Skip empty rows or separator rows
      if (!fieldName || fieldName.startsWith('---')) continue;

      // Check if field name matches known patterns
      const isKnownField = fieldName.match(/^(Table|Tolerance|TestConditions|IrradiationTime|Measurement|Row|OutputRow|Settings|Workload|LeakageMeasurement|Location|SurveyDate|AppliedCurrent|AppliedVoltage|ExposureTime|mAStations|TotalFiltration|FiltrationTolerance)/);
      if (!isKnownField) continue;

      if (currentTestName) {
        data.push({
          'Field Name': fieldName,
          'Value': value,
          'Row Index': rowIndex,
          'Test Name': currentTestName,
        });
      }
    }

    return data;
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

        // Determine file type from URL
        const urlLower = csvFileUrl.toLowerCase();
        const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

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

        // Calculate test due date (2 years from test date)
        const testDateStr = firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "";
        let testDueDateStr = "";
        if (testDateStr) {
          const testDate = new Date(testDateStr);
          const dueDate = new Date(testDate);
          dueDate.setFullYear(dueDate.getFullYear() + 2);
          testDueDateStr = dueDate.toISOString().split("T")[0];
        }

        // Pre-fill form from service details
        setFormData({
          customerName: data.hospitalName,
          address: data.hospitalAddress,
          srfNumber: data.srfNumber,
          srfDate: testDateStr,
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
          }));

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
          // uncertainity: t.uncertainity,
        })),
        notes: notes.map((text, index) => ({ slNo: `5.${index + 1}`, text })),
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
        component: <RadiationProtectionSurvey key={`protection-${csvDataVersion}`} serviceId={serviceId} testId={savedTestIds['protection']} onTestSaved={(testId) => handleTestSaved('protection', testId)} initialData={csvDataForComponents.radiationProtectionSurvey} />
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Generate QA Test Report - BMD/DEXA
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
              Dated
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
              onChange={handleInputChange}
              className="border p-2 rounded-md w-full"
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
          onClick={() => navigate(`/admin/orders/view-service-report-bmd?serviceId=${serviceId}`)}
        >
          View Generated Report
        </button>
      </div>

      {/* CSV Upload Section */}
      <div className="mt-8 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Upload Test Data from Excel/CSV</h3>
            <p className="text-sm text-blue-700">
              {csvFileUrl ? (
                <>
                  <span className="font-semibold text-green-700">✓ File detected from Service Details. Auto-loading...</span>
                  {csvUploading && <span className="ml-2 text-blue-600">(Loading data...)</span>}
                </>
              ) : (
                'Upload a CSV or Excel file to automatically fill in test data. Download the template below for reference.'
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2">
              {/* <a
                href="/templates/BMD_Test_Data_Template.csv"
                download="BMD_Test_Data_Template.csv"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                Download Template (With Timer)
              </a> */}
              <a
                href="/templates/BMD_Test_Data_Template_NoTimer.csv"
                download="BMD_Test_Data_Template_NoTimer.csv"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                Download Template (No Timer)
              </a>
            </div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5" />
              {csvUploading ? 'Uploading...' : 'Upload CSV'}
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

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
        {testComponents}
      </div>
    </div>
  );
};

export default GenerateReportForBMD;