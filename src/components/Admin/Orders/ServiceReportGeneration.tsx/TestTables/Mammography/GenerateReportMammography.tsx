// src/components/reports/generate/GenerateReport-Mammography.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { 
    getDetails, 
    getTools, 
    saveReportHeader, 
    getReportHeaderForMammography,
    addAccuracyOfOperatingPotentialForMammography,
    addLinearityOfMasLLoadingForMammography,
    addTotalFilterationForMammography,
    addReproducibilityOfOutputForMammography,
    addRadiationLeakageLevelForMammography,
    addImagingPhantomForMammography,
    addRadiationProtectionSurveyForMammography,
} from "../../../../../../api";

// Mammography Test Components
import AccuracyOfOperatingPotential from "../Mammography/AccuracyOfOperatingPotential";
import LinearityOfMasLLoading from "../Mammography/LinearityOfMasLLoading";
import TotalFiltrationAndAluminium from "../Mammography/TotalFilterationAndAlluminium";
import ReproducibilityOfOutput from "../Mammography/ReproducibilityOfOutput";
import RadiationLeakageLevel from "../Mammography/RadiationLeakageLevel";
import ImagingPhantom from "../Mammography/ImagingPhantom";
import RadiationProtectionSurvey from "../Mammography/RadiationProtectionSurvey";
import EquipementSetting from "../Mammography/EquipmentSetting";
import MaximumRadiationLevel from "../Mammography/MaximumRadiationLevel";
// Timer-dependent test components
import AccuracyOfIrradiationTime from "../Mammography/AccuracyOfIrradiationTime";
import LinearityOfMaLoadingStations from "../Mammography/LinearityOfMaLoadingStations";

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
    uncertainity?: string;
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

const GenerateReportMammography: React.FC<{ serviceId: string; csvFileUrl?: string | null }> = ({ serviceId, csvFileUrl }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
    const [showTimerModal, setShowTimerModal] = useState(false); // Will be set based on localStorage

    const [formData, setFormData] = useState({
        customerName: "",
        address: "",
        srfNumber: "",
        srfDate: "",
        testReportNumber: "",
        issueDate: "",
        nomenclature: "Mammography Unit",
        make: "",
        model: "",
        slNumber: "",
        condition: "OK",
        testingProcedureNumber: "AERB/MAMMO/2023",
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
    const [csvUploading, setCsvUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Store CSV data to pass to components (without auto-saving)
    const [csvDataForComponents, setCsvDataForComponents] = useState<{
        accuracyOfOperatingPotential?: any;
        accuracyOfIrradiationTime?: any;
        linearityOfMasLoading?: any;
        linearityOfMaLoadingStations?: any;
        totalFiltration?: any;
        reproducibilityOfOutput?: any;
        radiationLeakageLevel?: any;
        imagingPhantom?: any;
        radiationProtectionSurvey?: any;
    }>({});

    // CSV Parser Function - handles quoted values
    const parseCSV = (text: string): any[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        // Parse header
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
        
        // Map section headers to test names
        const sectionToTestName: { [key: string]: string } = {
            '========== ACCURACY OF OPERATING POTENTIAL (kVp) ==========': 'Accuracy of Operating Potential',
            '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy of Irradiation Time',
            '========== LINEARITY OF mAs LOADING (ACROSS mAs RANGES) ==========': 'Linearity of mAs Loading',
            '========== LINEARITY OF mA LOADING STATIONS ==========': 'Linearity of mA Loading Stations',
            '========== TOTAL FILTRATION & ALUMINIUM EQUIVALENCE ==========': 'Total Filtration & Aluminium',
            '========== REPRODUCIBILITY OF RADIATION OUTPUT ==========': 'Reproducibility of Output',
            '========== RADIATION LEAKAGE LEVEL (5 cm from Tube Housing) ==========': 'Radiation Leakage Level',
            '========== IMAGING PERFORMANCE EVALUATION (PHANTOM) ==========': 'Imaging Phantom',
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
            
            // Check if this is a section header
            if (firstColumn.startsWith('==========') && firstColumn.endsWith('==========')) {
                currentTestName = sectionToTestName[firstColumn] || '';
                console.log('Found section header:', firstColumn, '-> Test Name:', currentTestName);
                continue;
            }
            
            // Skip table headers, empty rows, and column header rows
            if (firstColumn.startsWith('---') || firstColumn === '' || !fieldName) {
                continue;
            }
            
            // Skip column header rows (rows where field name doesn't match known field prefixes)
            // These are the actual table column headers like "Time (ms)", "Slice Thickness (mm)", etc.
            const isKnownField = fieldName.match(/^(Table|Tolerance|ExposureCondition|Measurement|TargetWindow|AddedFilter|Result|OutputRow|Settings|Workload|LeakageMeasurement|PhantomRow|Location|SurveyDate|HasValidCalibration|AppliedCurrent|AppliedVoltage|ExposureTime|TestConditions|IrradiationTime|MeasHeader|Table1|Table2)/);
            if (!isKnownField) {
                // This is likely a column header row, skip it
                continue;
            }
            
            // Add test name to row if we have a current test
            if (currentTestName) {
                row['Test Name'] = currentTestName;
                data.push(row);
            } else {
                // Skip rows outside of test sections
                continue;
            }
        }
        
        return data;
    };

    // Process CSV data and fill test tables
    const processCSVData = async (csvData: any[]) => {
        try {
            setCsvUploading(true);

            // Group data by test name (normalize test names)
            const groupedData: { [key: string]: any[] } = {};
            const testNameMap: { [key: string]: string } = {
                'Accuracy of Operating Potential': 'Accuracy of Operating Potential',
                'Accuracy of Irradiation Time': 'Accuracy of Irradiation Time',
                'Linearity of mAs Loading': 'Linearity of mAs Loading',
                'Linearity of mA Loading Stations': 'Linearity of mA Loading Stations',
                'Total Filtration & Aluminium': 'Total Filtration & Aluminium',
                'Reproducibility of Output': 'Reproducibility of Output',
                'Radiation Leakage Level': 'Radiation Leakage Level',
                'Imaging Phantom': 'Imaging Phantom',
                'Radiation Protection Survey': 'Radiation Protection Survey',
            };

            csvData.forEach(row => {
                let testName = (row['Test Name'] || '').trim();
                // Try to match with known test names (case-insensitive, handle variations)
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

            console.log('CSV Data rows:', csvData.length);
            console.log('Grouped data keys:', Object.keys(groupedData));
            Object.keys(groupedData).forEach(key => {
                console.log(`  ${key}: ${groupedData[key].length} rows`);
            });

            // Process Accuracy of Operating Potential
            if (groupedData['Accuracy of Operating Potential'] && groupedData['Accuracy of Operating Potential'].length > 0) {
                try {
                const data = groupedData['Accuracy of Operating Potential'];
                console.log('Processing Accuracy of Operating Potential, rows:', data.length);
                const table1Row = { time: '', sliceThickness: '' };
                const table2Rows: any[] = [];
                let tolerance = { value: '1.5', type: 'absolute' as const, sign: 'both' as const };

                data.forEach((row, idx) => {
                    const field = (row['Field Name'] || '').trim();
                    const value = (row['Value'] || '').trim();
                    const rowIndexStr = (row['Row Index'] || '').trim();
                    const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;
                    
                    if (idx < 5) {
                        console.log(`  Row ${idx}: field="${field}", value="${value}", rowIndex="${rowIndexStr}" -> ${rowIndex}`);
                    }

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

                console.log('Accuracy of Operating Potential - table1Row:', table1Row);
                console.log('Accuracy of Operating Potential - table2Rows:', table2Rows);
                console.log('Accuracy of Operating Potential - tolerance:', tolerance);
                
                if (table1Row.time || table1Row.sliceThickness || table2Rows.length > 0) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        accuracyOfOperatingPotential: {
                            table1: [table1Row],
                            table2: table2Rows,
                            tolerance: tolerance,
                        }
                    }));
                    console.log('✓ Accuracy of Operating Potential data prepared for form');
                } else {
                    console.log('⚠ Accuracy of Operating Potential: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Accuracy of Operating Potential:', error);
                    toast.error(`Failed to process Accuracy of Operating Potential: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Accuracy of Irradiation Time
            if (groupedData['Accuracy of Irradiation Time'] && groupedData['Accuracy of Irradiation Time'].length > 0) {
                try {
                    const data = groupedData['Accuracy of Irradiation Time'];
                    console.log('Processing Accuracy of Irradiation Time, rows:', data.length);
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

                    console.log('Accuracy of Irradiation Time - testConditions:', testConditions);
                    console.log('Accuracy of Irradiation Time - irradiationTimes:', irradiationTimes);
                    console.log('Accuracy of Irradiation Time - tolerance:', { operator: toleranceOperator, value: toleranceValue });

                    if (testConditions.fcd || testConditions.kv || testConditions.ma || irradiationTimes.length > 0) {
                        setCsvDataForComponents(prev => ({
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
                        console.log('✓ Accuracy of Irradiation Time data prepared for form');
                    } else {
                        console.log('⚠ Accuracy of Irradiation Time: No data found');
                    }
                } catch (error: any) {
                    console.error('Error processing Accuracy of Irradiation Time:', error);
                    toast.error(`Failed to process Accuracy of Irradiation Time: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Linearity of mAs Loading
            if (groupedData['Linearity of mAs Loading'] && groupedData['Linearity of mAs Loading'].length > 0) {
                try {
                const data = groupedData['Linearity of mAs Loading'];
                const exposureCondition = { fcd: '100', kv: '80' };
                const measurementHeaders: string[] = [];
                const measurements: any[] = [];
                let tolerance = '0.1';

                data.forEach(row => {
                    const field = row['Field Name'] || '';
                    const value = row['Value'] || '';
                    const rowIndex = parseInt(row['Row Index'] || '0');

                    if (field === 'ExposureCondition_FCD') exposureCondition.fcd = value;
                    if (field === 'ExposureCondition_kV') exposureCondition.kv = value;
                    if (field === 'MeasurementHeader') {
                        if (!measurementHeaders.includes(value)) {
                            measurementHeaders.push(value);
                        }
                    }
                    if (field === 'Tolerance') tolerance = value;

                    if (field.startsWith('Measurement_')) {
                        while (measurements.length <= rowIndex) {
                            measurements.push({ mAsRange: '', measuredOutputs: [] });
                        }
                        const fieldName = field.replace('Measurement_', '');
                        if (fieldName === 'mAsRange') {
                            measurements[rowIndex].mAsRange = value;
                        } else if (fieldName.startsWith('Meas')) {
                            const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                            while (measurements[rowIndex].measuredOutputs.length <= colIndex) {
                                measurements[rowIndex].measuredOutputs.push(null);
                            }
                            // Store as string to match component's expected format
                            measurements[rowIndex].measuredOutputs[colIndex] = value.trim() === '' ? null : value;
                        }
                    }
                });

                if (measurements.length > 0) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        linearityOfMasLoading: {
                            exposureCondition,
                            measurementHeaders: measurementHeaders.length > 0 ? measurementHeaders : ['Meas 1', 'Meas 2', 'Meas 3'],
                            measurements: measurements,
                            tolerance,
                        }
                    }));
                    console.log('✓ Linearity of mAs Loading data prepared for form');
                } else {
                    console.log('⚠ Linearity of mAs Loading: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Linearity of mAs Loading:', error);
                    toast.error(`Failed to process Linearity of mAs Loading: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Linearity of mA Loading Stations
            if (groupedData['Linearity of mA Loading Stations'] && groupedData['Linearity of mA Loading Stations'].length > 0) {
                try {
                    const data = groupedData['Linearity of mA Loading Stations'];
                    console.log('Processing Linearity of mA Loading Stations, rows:', data.length);
                    const table1Row = { fcd: '', kv: '', time: '' };
                    const measurementHeaders: string[] = [];
                    const table2Rows: any[] = [];
                    let tolerance = '0.1';
                    let toleranceOperator = '<=';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndexStr = (row['Row Index'] || '').trim();
                        const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;

                        if (field === 'Table1_FCD') table1Row.fcd = value;
                        if (field === 'Table1_kV') table1Row.kv = value;
                        if (field === 'Table1_Time') table1Row.time = value;

                        if (field === 'MeasHeader') {
                            if (!measurementHeaders.includes(value)) {
                                measurementHeaders.push(value);
                            }
                        }

                        if (field === 'Tolerance') tolerance = value;
                        if (field === 'ToleranceOperator') toleranceOperator = value;

                        if (field.startsWith('Table2_')) {
                            while (table2Rows.length <= rowIndex) {
                                table2Rows.push({ ma: '', measuredOutputs: [] });
                            }
                            const fieldName = field.replace('Table2_', '');
                            if (fieldName === 'ma') {
                                table2Rows[rowIndex].ma = value;
                            } else if (fieldName.startsWith('Meas')) {
                                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                                while (table2Rows[rowIndex].measuredOutputs.length <= colIndex) {
                                    table2Rows[rowIndex].measuredOutputs.push(null);
                                }
                                table2Rows[rowIndex].measuredOutputs[colIndex] = value.trim() === '' ? null : value;
                            }
                        }
                    });

                    if (table1Row.fcd || table1Row.kv || table1Row.time || table2Rows.length > 0) {
                        setCsvDataForComponents(prev => ({
                            ...prev,
                            linearityOfMaLoadingStations: {
                                table1: [table1Row],
                                measHeaders: measurementHeaders.length > 0 ? measurementHeaders : ['Meas 1', 'Meas 2', 'Meas 3'],
                                table2: table2Rows,
                                tolerance,
                                toleranceOperator,
                            }
                        }));
                        console.log('✓ Linearity of mA Loading Stations data prepared for form');
                    } else {
                        console.log('⚠ Linearity of mA Loading Stations: No data found');
                    }
                } catch (error: any) {
                    console.error('Error processing Linearity of mA Loading Stations:', error);
                    toast.error(`Failed to process Linearity of mA Loading Stations: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Total Filtration & Aluminium
            if (groupedData['Total Filtration & Aluminium'] && groupedData['Total Filtration & Aluminium'].length > 0) {
                try {
                const data = groupedData['Total Filtration & Aluminium'];
                console.log('Processing Total Filtration & Aluminium, rows:', data.length);
                let targetWindow = '';
                let addedFilterThickness = '';
                const tableRows: any[] = [];
                let resultHVT28kVp = '';

                data.forEach((row, idx) => {
                    const field = (row['Field Name'] || '').trim();
                    const value = (row['Value'] || '').trim();
                    const rowIndexStr = (row['Row Index'] || '').trim();
                    const rowIndex = rowIndexStr === '' ? 0 : parseInt(rowIndexStr) || 0;
                    
                    if (idx < 5) {
                        console.log(`  Row ${idx}: field="${field}", value="${value}", rowIndex="${rowIndexStr}" -> ${rowIndex}`);
                    }

                    if (field === 'TargetWindow') targetWindow = value;
                    if (field === 'AddedFilterThickness') addedFilterThickness = value;
                    if (field === 'ResultHVT28kVp') resultHVT28kVp = value;

                    if (field.startsWith('Table_')) {
                        while (tableRows.length <= rowIndex) {
                            tableRows.push({
                                kvp: null,
                                mAs: null,
                                alEquivalence: null,
                                hvt: null,
                                remarks: '',
                                recommendedValue: { minValue: null, maxValue: null, kvp: null },
                            });
                        }
                        const fieldName = field.replace('Table_', '');
                        if (fieldName === 'kVp') tableRows[rowIndex].kvp = parseFloat(value) || null;
                        if (fieldName === 'mAs') tableRows[rowIndex].mAs = parseFloat(value) || null;
                        if (fieldName === 'AlEquivalence') tableRows[rowIndex].alEquivalence = parseFloat(value) || null;
                        if (fieldName === 'HVT') tableRows[rowIndex].hvt = parseFloat(value) || null;
                        if (fieldName === 'RecommendedValue_Min') tableRows[rowIndex].recommendedValue.minValue = parseFloat(value) || null;
                        if (fieldName === 'RecommendedValue_Max') tableRows[rowIndex].recommendedValue.maxValue = parseFloat(value) || null;
                        if (fieldName === 'RecommendedValue_kVp') tableRows[rowIndex].recommendedValue.kvp = parseFloat(value) || null;
                    }
                });

                console.log('Total Filtration & Aluminium - targetWindow:', targetWindow);
                console.log('Total Filtration & Aluminium - addedFilterThickness:', addedFilterThickness);
                console.log('Total Filtration & Aluminium - tableRows:', tableRows);
                console.log('Total Filtration & Aluminium - resultHVT28kVp:', resultHVT28kVp);
                
                if (tableRows.length > 0 || targetWindow || addedFilterThickness || resultHVT28kVp) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        totalFiltration: {
                            targetWindow: targetWindow || 'Molybdenum target, Beryllium window or Rh/Rh or W/Al',
                            addedFilterThickness: addedFilterThickness || null,
                            table: tableRows,
                            resultHVT28kVp: resultHVT28kVp,
                        }
                    }));
                    console.log('✓ Total Filtration & Aluminium data prepared for form');
                } else {
                    console.log('⚠ Total Filtration & Aluminium: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Total Filtration & Aluminium:', error);
                    toast.error(`Failed to process Total Filtration & Aluminium: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Reproducibility of Output
            if (groupedData['Reproducibility of Output'] && groupedData['Reproducibility of Output'].length > 0) {
                try {
                const data = groupedData['Reproducibility of Output'];
                const outputRows: any[] = [];
                let tolerance = '5.0';

                data.forEach(row => {
                    const field = row['Field Name'] || '';
                    const value = row['Value'] || '';
                    const rowIndex = parseInt(row['Row Index'] || '0');

                    if (field === 'Tolerance') tolerance = value;

                    if (field.startsWith('OutputRow_')) {
                        while (outputRows.length <= rowIndex) {
                            outputRows.push({ kv: '', mas: '', outputs: [], avg: '', cov: '', remark: '' });
                        }
                        const fieldName = field.replace('OutputRow_', '');
                        if (fieldName === 'kV') outputRows[rowIndex].kv = value;
                        if (fieldName === 'mAs') outputRows[rowIndex].mas = value;
                        if (fieldName.startsWith('Meas')) {
                            const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                            while (outputRows[rowIndex].outputs.length <= colIndex) {
                                outputRows[rowIndex].outputs.push('');
                            }
                            outputRows[rowIndex].outputs[colIndex] = value;
                        }
                    }
                });

                if (outputRows.length > 0) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        reproducibilityOfOutput: {
                            outputRows: outputRows,
                            tolerance,
                        }
                    }));
                    console.log('✓ Reproducibility of Output data prepared for form');
                } else {
                    console.log('⚠ Reproducibility of Output: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Reproducibility of Output:', error);
                    toast.error(`Failed to process Reproducibility of Output: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Radiation Leakage Level
            if (groupedData['Radiation Leakage Level'] && groupedData['Radiation Leakage Level'].length > 0) {
                try {
                const data = groupedData['Radiation Leakage Level'];
                const settings = { fcd: '100', kv: '120', ma: '21', time: '2.0' };
                const leakageMeasurements: any[] = [];
                let workload = '';
                let toleranceValue = '';
                let toleranceOperator: 'less than or equal to' | 'greater than or equal to' | '=' = 'less than or equal to';
                let toleranceTime = '1';

                data.forEach(row => {
                    const field = row['Field Name'] || '';
                    const value = row['Value'] || '';
                    const rowIndex = parseInt(row['Row Index'] || '0');

                    if (field === 'Settings_FCD') settings.fcd = value;
                    if (field === 'Settings_kV') settings.kv = value;
                    if (field === 'Settings_ma') settings.ma = value;
                    if (field === 'Settings_time') settings.time = value;
                    if (field === 'Workload') workload = value;
                    if (field === 'ToleranceValue') toleranceValue = value;
                    if (field === 'ToleranceOperator') toleranceOperator = value as any;
                    if (field === 'ToleranceTime') toleranceTime = value;

                    if (field.startsWith('LeakageMeasurement_')) {
                        while (leakageMeasurements.length <= rowIndex) {
                            leakageMeasurements.push({
                                location: '',
                                left: 0,
                                right: 0,
                                front: 0,
                                back: 0,
                                top: 0,
                                max: '',
                                result: '',
                                unit: 'mR/h',
                                mgy: '',
                            });
                        }
                        const fieldName = field.replace('LeakageMeasurement_', '');
                        if (fieldName === 'Location') leakageMeasurements[rowIndex].location = value;
                        if (fieldName === 'Left') leakageMeasurements[rowIndex].left = parseFloat(value) || 0;
                        if (fieldName === 'Right') leakageMeasurements[rowIndex].right = parseFloat(value) || 0;
                        if (fieldName === 'Front') leakageMeasurements[rowIndex].front = parseFloat(value) || 0;
                        if (fieldName === 'Back') leakageMeasurements[rowIndex].back = parseFloat(value) || 0;
                        if (fieldName === 'Top') leakageMeasurements[rowIndex].top = parseFloat(value) || 0;
                    }
                });

                if (leakageMeasurements.length > 0) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        radiationLeakageLevel: {
                            settings,
                            workload,
                            leakageMeasurements: leakageMeasurements,
                            toleranceValue,
                            toleranceOperator,
                            toleranceTime,
                        }
                    }));
                    console.log('✓ Radiation Leakage Level data prepared for form');
                } else {
                    console.log('⚠ Radiation Leakage Level: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Radiation Leakage Level:', error);
                    toast.error(`Failed to process Radiation Leakage Level: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Imaging Phantom
            if (groupedData['Imaging Phantom'] && groupedData['Imaging Phantom'].length > 0) {
                try {
                const data = groupedData['Imaging Phantom'];
                const rows: any[] = [];

                data.forEach(row => {
                    const field = row['Field Name'] || '';
                    const value = row['Value'] || '';
                    const rowIndex = parseInt(row['Row Index'] || '0');

                    if (field.startsWith('PhantomRow_')) {
                        while (rows.length <= rowIndex) {
                            rows.push({
                                name: '',
                                visibleCount: 0,
                                tolerance: { operator: '>=' as const, value: 0 },
                                remark: '',
                            });
                        }
                        const fieldName = field.replace('PhantomRow_', '');
                        if (fieldName === 'Name') rows[rowIndex].name = value;
                        if (fieldName === 'VisibleCount') rows[rowIndex].visibleCount = parseInt(value) || 0;
                        if (fieldName === 'ToleranceOperator') rows[rowIndex].tolerance.operator = value as any;
                        if (fieldName === 'ToleranceValue') rows[rowIndex].tolerance.value = parseFloat(value) || 0;
                    }
                });

                if (rows.length > 0) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        imagingPhantom: {
                            rows: rows,
                        }
                    }));
                    console.log('✓ Imaging Phantom data prepared for form');
                } else {
                    console.log('⚠ Imaging Phantom: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Imaging Phantom:', error);
                    toast.error(`Failed to process Imaging Phantom: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Radiation Protection Survey
            if (groupedData['Radiation Protection Survey'] && groupedData['Radiation Protection Survey'].length > 0) {
                try {
                const data = groupedData['Radiation Protection Survey'];
                let surveyDate = '';
                let hasValidCalibration = '';
                let appliedCurrent = '100';
                let appliedVoltage = '28';
                let exposureTime = '0.5';
                let workload = '5000';
                const locations: any[] = [];

                data.forEach(row => {
                    const field = row['Field Name'] || '';
                    const value = row['Value'] || '';
                    const rowIndex = parseInt(row['Row Index'] || '0');

                    if (field === 'SurveyDate') surveyDate = value;
                    if (field === 'HasValidCalibration') hasValidCalibration = value;
                    if (field === 'AppliedCurrent') appliedCurrent = value;
                    if (field === 'AppliedVoltage') appliedVoltage = value;
                    if (field === 'ExposureTime') exposureTime = value;
                    if (field === 'Workload') workload = value;

                    if (field.startsWith('Location_')) {
                        while (locations.length <= rowIndex) {
                            locations.push({
                                location: '',
                                mRPerHr: '',
                                mRPerWeek: '',
                                result: '',
                                category: 'worker' as const,
                            });
                        }
                        const fieldName = field.replace('Location_', '');
                        if (fieldName === 'Location') locations[rowIndex].location = value;
                        if (fieldName === 'mRPerHr') locations[rowIndex].mRPerHr = value;
                        if (fieldName === 'Category') locations[rowIndex].category = value as any;
                    }
                });

                if (locations.length > 0 || surveyDate || hasValidCalibration) {
                    // Store data for component instead of saving
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        radiationProtectionSurvey: {
                            surveyDate,
                            hasValidCalibration,
                            appliedCurrent,
                            appliedVoltage,
                            exposureTime,
                            workload,
                            locations: locations,
                        }
                    }));
                    console.log('✓ Radiation Protection Survey data prepared for form');
                } else {
                    console.log('⚠ Radiation Protection Survey: No data found');
                }
                } catch (error: any) {
                    console.error('Error processing Radiation Protection Survey:', error);
                    toast.error(`Failed to process Radiation Protection Survey: ${error?.message || 'Unknown error'}`);
                }
            }

            const processedTests = Object.keys(groupedData).filter(key => groupedData[key].length > 0);
            console.log(`Processed ${processedTests.length} test(s) from CSV`);
            
            if (processedTests.length > 0) {
                toast.success(`CSV data loaded successfully! ${processedTests.length} test(s) filled. Please review and save manually.`);
                
                // Force refresh of all test components to load the CSV data
                const newKey = Date.now();
                console.log('Setting refreshKey to:', newKey);
                setRefreshKey(newKey);
            } else {
                toast.error('No test data found in CSV file. Please check the format.');
            }
        } catch (error: any) {
            console.error('Error processing CSV:', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to process CSV data');
        } finally {
            setCsvUploading(false);
        }
    };

    // Check localStorage for timer preference on mount
    useEffect(() => {
        if (serviceId) {
            const stored = localStorage.getItem(`mammography-timer-${serviceId}`);
            if (stored !== null) {
                setHasTimer(stored === 'true');
                setShowTimerModal(false);
            } else {
                setShowTimerModal(true);
            }
        }
    }, [serviceId]);

    // Close modal and set timer choice
    const handleTimerChoice = (choice: boolean) => {
        setHasTimer(choice);
        setShowTimerModal(false);
        // Store in localStorage so it persists across refreshes
        if (serviceId) {
            localStorage.setItem(`mammography-timer-${serviceId}`, String(choice));
        }
    };

    // Handle CSV file upload
    const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                console.log('CSV file content (first 500 chars):', text.substring(0, 500));
                const csvData = parseCSV(text);
                console.log('Parsed CSV data:', csvData);
                console.log('Number of rows parsed:', csvData.length);
                if (csvData.length > 0) {
                    console.log('First row sample:', csvData[0]);
                }
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
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    // Fetch and process CSV file from URL (passed from ServiceDetails2)
    useEffect(() => {
        const fetchAndProcessCSV = async () => {
            if (!csvFileUrl) return;

            try {
                console.log('Fetching CSV file from URL:', csvFileUrl);
                setCsvUploading(true);
                
                // Fetch the file from the URL
                const response = await fetch(csvFileUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
                }

                const text = await response.text();
                console.log('CSV file content fetched, length:', text.length);
                
                // Parse and process the CSV
                const csvData = parseCSV(text);
                console.log('Parsed CSV data:', csvData);
                console.log('Number of rows parsed:', csvData.length);
                
                if (csvData.length > 0) {
                    console.log('First row sample:', csvData[0]);
                    await processCSVData(csvData);
                } else {
                    console.warn('No data found in CSV file');
                }
            } catch (error: any) {
                console.error('Error fetching or processing CSV file:', error);
                toast.error(`Failed to load CSV file: ${error?.message || 'Unknown error'}`);
            } finally {
                setCsvUploading(false);
            }
        };

        fetchAndProcessCSV();
    }, [csvFileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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

                setFormData({
                    customerName: data.hospitalName,
                    address: data.hospitalAddress,
                    srfNumber: data.srfNumber,
                    srfDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
                    testReportNumber: firstTest?.qaTestReportNumber || "",
                    issueDate: new Date().toISOString().split("T")[0],
                    nomenclature: "Mammography Unit",
                    make: "",
                    model: data.machineModel,
                    slNumber: data.serialNumber,
                    condition: "OK",
                    testingProcedureNumber: "AERB/MAMMO/2023",
                    pages: "",
                    testDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
                    testDueDate: "",
                    location: data.hospitalAddress,
                    temperature: "",
                    humidity: "",
                    engineerNameRPId: data.engineerAssigned?.name || "",
                    category: data.category || "",
                });

                const mappedTools: Standard[] = toolsRes.data.toolsAssigned.map((t: any, i: number) => ({
                    slNumber: String(i + 1),
                    nomenclature: t.nomenclature,
                    make: t.manufacturer || t.make || "",
                    model: t.model || "",
                    SrNo: t.SrNo,
                    range: t.range || "",
                    certificate: t.certificate || null,
                    calibrationCertificateNo: t.calibrationCertificateNo || "",
                    calibrationValidTill: t.calibrationValidTill.split("T")[0],
                }));
                console.log("🚀 ~ fetchInitialData ~ mappedTools:", mappedTools)

                setTools(mappedTools);

                // Load existing report header data if available
                try {
                    const reportRes = await getReportHeaderForMammography(serviceId);
                    if (reportRes.exists && reportRes.data) {
                        const reportData = reportRes.data;
                        // Update formData with existing report data
                        setFormData((prev) => ({
                            ...prev,
                            customerName: reportData.customerName || prev.customerName,
                            address: reportData.address || prev.address,
                            srfNumber: reportData.srfNumber || prev.srfNumber,
                            srfDate: reportData.srfDate || prev.srfDate,
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
                console.error("Failed to load data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [serviceId]);

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
                    SrNo: t.SrNo,
                    nomenclature: t.nomenclature,
                    make: t.make,
                    model: t.model,
                    range: t.range,
                    calibrationCertificateNo: t.calibrationCertificateNo,
                    calibrationValidTill: t.calibrationValidTill,
                    certificate: t.certificate,
                })),
                notes: notes.length > 0 ? notes.map((note, index) => ({
                    slNo: `5.${index + 1}`,
                    text: note,
                })) : [
                    { slNo: "5.1", text: "The Test Report relates only to the above item tested." },
                    { slNo: "5.2", text: "Partial reproduction of this report is not allowed without written approval." },
                    { slNo: "5.3", text: "Any discrepancies must be reported within 15 days of receipt." },
                    { slNo: "5.4", text: "Testing performed as per AERB Safety Code for Medical Diagnostic X-ray Equipment." },
                    { slNo: "5.5", text: "Results are valid under stated test conditions." },
                ],
            };

            await saveReportHeader(serviceId, payload);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 5000);
        } catch (err: any) {
            setSaveError(err?.response?.data?.message || "Failed to save report header");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl font-medium text-gray-700">Loading Mammography Report Form...</div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">
                Failed to load service details.
            </div>
        );
    }

    // MODAL POPUP
    if (showTimerModal && hasTimer === null) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
                    <p className="text-gray-600 mb-8">
                        Does this Mammography unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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

    return (
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                    Generate Mammography QA Test Report
                </h1>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
                        <CloudArrowUpIcon className="w-5 h-5" />
                        {csvUploading ? 'Uploading...' : 'Upload CSV'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleCSVUpload}
                            className="hidden"
                            disabled={csvUploading}
                        />
                    </label>
                </div>
            </div>

            {/* Customer Info */}
            <section className="mb-10 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-700 mb-4">1. Name and Address of Customer</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Customer Name</label>
                        <input type="text" value={formData.customerName} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Address</label>
                        <input type="text" value={formData.address} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
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
                        { label: "Condition", name: "condition" },
                        { label: "Testing Procedure No.", name: "testingProcedureNumber" },
                        { label: "No. of Pages", name: "pages" },
                        { label: "Test Date", name: "testDate", type: "date" },
                        { label: "Due Date", name: "testDueDate", type: "date" },
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

            {/* <Standards standards={tools} /> */}
            <Notes initialNotes={notes} onChange={setNotes} />

            {/* Save & View Buttons */}
            <div className="my-10 flex justify-end gap-6">
                {saveSuccess && (
                    <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
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
                    {saving ? "Saving Header..." : "Save Report Header"}
                </button>

                <button
                    onClick={() => navigate(`/admin/orders/view-service-report-mammography?serviceId=${serviceId}`)}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    View Generated Report
                </button>
            </div>

            {/* QA Tests */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>

                {[
                    { title: "Accuracy of Operating Potential (kVp)", component: <AccuracyOfOperatingPotential key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.accuracyOfOperatingPotential} /> },
                    
                    // Timer Test — Only if user said YES
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Accuracy Of Irradiation Time",
                                component: <AccuracyOfIrradiationTime key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.accuracyOfIrradiationTime} />,
                            },
                        ]
                        : []),

                    { title: "Total Filtration & Aluminium Equivalence", component: <TotalFiltrationAndAluminium key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.totalFiltration} /> },

                    // Linearity Test — Conditional
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Linearity Of mA Loading",
                                component: <LinearityOfMaLoadingStations key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.linearityOfMaLoadingStations} />,
                            },
                        ]
                        : hasTimer === false
                            ? [
                                {
                                    title: "Linearity Of mAs Loading",
                                    component: <LinearityOfMasLLoading key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.linearityOfMasLoading} />,
                                },
                            ]
                            : []),

                    { title: "Reproducibility of Radiation Output", component: <ReproducibilityOfOutput key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.reproducibilityOfOutput} /> },
                    { title: "Radiation Leakage Level (5 cm from Tube Housing)", component: <RadiationLeakageLevel key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.radiationLeakageLevel} /> },
                    { title: "Imaging Performance Evaluation (Phantom)", component: <ImagingPhantom key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.imagingPhantom} /> },
                    { title: "Radiation Protection Survey", component: <RadiationProtectionSurvey key={refreshKey} serviceId={serviceId} refreshKey={refreshKey} initialData={csvDataForComponents.radiationProtectionSurvey} /> },
                    // { title: "Equipment Settings Verification", component: <EquipementSetting serviceId={serviceId} /> },
                    // { title: "Maximum Radiation Levels at Different Locations", component: <MaximumRadiationLevel serviceId={serviceId} /> },
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

export default GenerateReportMammography;