// RadioFluro.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getRadiationProfileWidthByServiceId, saveReportHeader, getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro, getReportHeader, proxyFile } from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import Congruence from "./CongruenceOfRadiation";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalSpot from "./EffectiveFocalSpot";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import TotalFilteration from "./TotalFilteration";
import LinearityOfMasLoading from "./LinearityOfMasLoading";
import LinearityOfmALoading from "./LinearityOfmALoadingstations";
import OutputConsistency from "./OutputConsistency";
import LowContrastResolution from "./LowContrastResolution";
import HighContrastResolution from "./HighContrastResolution";
import ExposureRateTableTop from "./ExposureRateTableTop";
import RadiationLeakageLevel from "./RadiationLeakageLevel";
import RadiationProtectionSurvey from "./RadiationProtectionSurvey";
import EquipementSetting from "./EquipmentSetting";

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

interface RadioFluroProps {
    serviceId: string;
    csvFileUrl?: string | null;
    qaTestDate?: string | null;
    createdAt?: string | null;
}

const RadioFluro: React.FC<RadioFluroProps> = ({ serviceId, csvFileUrl, qaTestDate, createdAt }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [radiationProfileTest, setRadiationProfileTest] = useState<any>(null);
    const [showTimerModal, setShowTimerModal] = useState(false); // Don't show by default
    const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
    
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

    // Close modal and set timer choice
    const handleTimerChoice = (choice: boolean) => {
        setHasTimer(choice);
        setShowTimerModal(false);
        // Persist choice in localStorage
        localStorage.setItem(`fixedradiofluro_timer_choice_${serviceId}`, JSON.stringify(choice));
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

                // Calculate test due date (2 years from test date)
                // Use qaTestDate if provided, otherwise use firstTest.createdAt
                const testDateStr = qaTestDate ? qaTestDate.split("T")[0] : (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");
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

    // Fetch radiation profile
    useEffect(() => {
        const load = async () => {
            const data = await getRadiationProfileWidthByServiceId(serviceId);
            setRadiationProfileTest(data);
        };
        if (serviceId) load();
    }, [serviceId]);

    // Check for existing timer test and localStorage choice
    useEffect(() => {
        const checkTimerTest = async () => {
            if (!serviceId) return;
            try {
                const res = await getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro(serviceId);
                if (res?.data) {
                    // Timer test exists, set hasTimer to true
                    setHasTimer(true);
                    setShowTimerModal(false);
                    localStorage.setItem(`fixedradiofluro_timer_choice_${serviceId}`, JSON.stringify(true));
                } else {
                    // Check localStorage for saved choice
                    const savedChoice = localStorage.getItem(`fixedradiofluro_timer_choice_${serviceId}`);
                    if (savedChoice !== null) {
                        setHasTimer(JSON.parse(savedChoice));
                        setShowTimerModal(false);
                    } else {
                        // Only show modal if no saved choice and no existing test
                        setShowTimerModal(true);
                    }
                }
            } catch (err) {
                // No timer test found, check localStorage
                const savedChoice = localStorage.getItem(`fixedradiofluro_timer_choice_${serviceId}`);
                if (savedChoice !== null) {
                    setHasTimer(JSON.parse(savedChoice));
                    setShowTimerModal(false);
                } else {
                    // Show modal only if no saved choice
                    setShowTimerModal(true);
                }
            }
        };
        checkTimerTest();
    }, [serviceId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Parse CSV text into structured data
    const parseCSV = (text: string): any[] => {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length === 0) return [];

        // Find header row
        let headerRowIndex = -1;
        let fieldNameCol = -1;
        let valueCol = -1;
        let rowIndexCol = -1;

        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const cells = lines[i].split(',').map(c => c.trim().toLowerCase());
            if (cells.includes('field name') || cells.includes('fieldname')) {
                headerRowIndex = i;
                fieldNameCol = cells.indexOf('field name') !== -1 ? cells.indexOf('field name') : cells.indexOf('fieldname');
                valueCol = cells.indexOf('value');
                rowIndexCol = cells.indexOf('row index') !== -1 ? cells.indexOf('row index') : cells.indexOf('rowindex');
                break;
            }
        }

        if (headerRowIndex === -1) {
            // Assume first row is header
            headerRowIndex = 0;
            fieldNameCol = 0;
            valueCol = 1;
            rowIndexCol = 2;
        }

        const data: any[] = [];
        const sectionToTestName: { [key: string]: string } = {
            '========== CONGRUENCE OF RADIATION & OPTICAL FIELD ==========': 'Congruence of Radiation',
            '========== CENTRAL BEAM ALIGNMENT ==========': 'Central Beam Alignment',
            '========== EFFECTIVE FOCAL SPOT ==========': 'Effective Focal Spot',
            '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy of Irradiation Time',
            '========== ACCURACY OF OPERATING POTENTIAL ==========': 'Accuracy of Operating Potential',
            '========== TOTAL FILTRATION ==========': 'Total Filtration',
            '========== LINEARITY OF MA LOADING ==========': 'Linearity of mA Loading',
            '========== LINEARITY OF MAS LOADING ==========': 'Linearity of mAs Loading',
            '========== OUTPUT CONSISTENCY ==========': 'Output Consistency',
            '========== LOW CONTRAST RESOLUTION ==========': 'Low Contrast Resolution',
            '========== HIGH CONTRAST RESOLUTION ==========': 'High Contrast Resolution',
            '========== EXPOSURE RATE AT TABLE TOP ==========': 'Exposure Rate Table Top',
            '========== TUBE HOUSING LEAKAGE ==========': 'Tube Housing Leakage',
            '========== RADIATION PROTECTION SURVEY ==========': 'Radiation Protection Survey',
        };

        let currentTestName = '';
        const rowIndexCounter: { [key: string]: number } = {};
        const lastRowStartField: { [key: string]: string } = {};

        for (let i = headerRowIndex + 1; i < lines.length; i++) {
            const cells = lines[i].split(',').map(c => c.trim());
            const fieldName = (cells[fieldNameCol] || '').trim();
            const value = (cells[valueCol] || '').trim();

            if (fieldName.startsWith('==========') && fieldName.endsWith('==========')) {
                currentTestName = sectionToTestName[fieldName] || '';
                rowIndexCounter[currentTestName] = 0;
                lastRowStartField[currentTestName] = '';
                continue;
            }

            if (!fieldName || fieldName.startsWith('---')) continue;

            const isKnownField = fieldName.match(/^(Table|Tolerance|ExposureCondition|Measurement|TestConditions|IrradiationTime|TechniqueFactors|FocalSpot|LeakageMeasurement|Location|SurveyDate|HasValidCalibration|AppliedCurrent|AppliedVoltage|ExposureTime|MeasHeader|Table1|Table2|ObservedTilt|FCD|FFD|kV|mA|mAs|Time|Settings|Workload|RadiationOutput|OutputRow|TotalFiltration|CongruenceMeasurement|MeasurementRow|MeasuredLpPerMm|RecommendedStandard|SmallestHoleSize|ToleranceOperator|ToleranceValue|TestRow|ExposureRateRow)/);
            if (!isKnownField) continue;

            if (currentTestName) {
                const rowStartFields = [
                    'Measurement_AppliedKvp',
                    'IrradiationTime_SetTime',
                    'OutputRow_kV',
                    'CongruenceMeasurement_Dimension',
                    'FocalSpot_FocusType',
                    'Table2_mAsApplied',
                    'MeasurementRow_maApplied',
                    'LeakageMeasurement_Location',
                    'Location_Location',
                    'TestRow_TestName',
                    'ExposureRateRow_Distance'
                ];

                const isRowStart = rowStartFields.some(startField => fieldName === startField);

                if (isRowStart) {
                    if (lastRowStartField[currentTestName] !== value) {
                        rowIndexCounter[currentTestName] = (rowIndexCounter[currentTestName] || 0) + 1;
                        lastRowStartField[currentTestName] = value;
                    }
                }

                data.push({
                    'Field Name': fieldName,
                    'Value': value,
                    'Row Index': rowIndexCounter[currentTestName] || 0,
                    'Test Name': currentTestName,
                });
            }
        }

        return data;
    };

    // Convert Excel file to CSV format
    const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
        const data: any[] = [];
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (jsonData.length === 0) return data;

        let fieldNameCol = -1;
        let valueCol = -1;
        let headerRowIndex = -1;

        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            for (let j = 0; j < row.length; j++) {
                const cell = String(row[j] || '').trim().toLowerCase();
                if (cell === 'field name' || cell === 'fieldname') {
                    headerRowIndex = i;
                    fieldNameCol = j;
                } else if (cell === 'value') {
                    valueCol = j;
                }
            }
            if (fieldNameCol !== -1 && valueCol !== -1) break;
        }

        if (headerRowIndex === -1) {
            headerRowIndex = 0;
            fieldNameCol = 0;
            valueCol = 1;
        }

        const sectionToTestName: { [key: string]: string } = {
            '========== CONGRUENCE OF RADIATION & OPTICAL FIELD ==========': 'Congruence of Radiation',
            '========== CENTRAL BEAM ALIGNMENT ==========': 'Central Beam Alignment',
            '========== EFFECTIVE FOCAL SPOT ==========': 'Effective Focal Spot',
            '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy of Irradiation Time',
            '========== ACCURACY OF OPERATING POTENTIAL ==========': 'Accuracy of Operating Potential',
            '========== TOTAL FILTRATION ==========': 'Total Filtration',
            '========== LINEARITY OF MA LOADING ==========': 'Linearity of mA Loading',
            '========== LINEARITY OF MAS LOADING ==========': 'Linearity of mAs Loading',
            '========== OUTPUT CONSISTENCY ==========': 'Output Consistency',
            '========== LOW CONTRAST RESOLUTION ==========': 'Low Contrast Resolution',
            '========== HIGH CONTRAST RESOLUTION ==========': 'High Contrast Resolution',
            '========== EXPOSURE RATE AT TABLE TOP ==========': 'Exposure Rate Table Top',
            '========== TUBE HOUSING LEAKAGE ==========': 'Tube Housing Leakage',
            '========== RADIATION PROTECTION SURVEY ==========': 'Radiation Protection Survey',
        };

        let currentTestName = '';
        const rowIndexCounter: { [key: string]: number } = {};
        const lastRowStartField: { [key: string]: string } = {};

        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const fieldName = String(row[fieldNameCol] || '').trim();
            const value = String(row[valueCol] || '').trim();

            if (fieldName.startsWith('==========') && fieldName.endsWith('==========')) {
                currentTestName = sectionToTestName[fieldName] || '';
                rowIndexCounter[currentTestName] = 0;
                lastRowStartField[currentTestName] = '';
                continue;
            }

            if (!fieldName || fieldName.startsWith('---')) continue;

            const isKnownField = fieldName.match(/^(Table|Tolerance|ExposureCondition|Measurement|TestConditions|IrradiationTime|TechniqueFactors|FocalSpot|LeakageMeasurement|Location|SurveyDate|HasValidCalibration|AppliedCurrent|AppliedVoltage|ExposureTime|MeasHeader|Table1|Table2|ObservedTilt|FCD|FFD|kV|mA|mAs|Time|Settings|Workload|RadiationOutput|OutputRow|TotalFiltration|CongruenceMeasurement|MeasurementRow|MeasuredLpPerMm|RecommendedStandard|SmallestHoleSize|ToleranceOperator|ToleranceValue|TestRow|ExposureRateRow)/);
            if (!isKnownField) continue;

            if (currentTestName) {
                const rowStartFields = [
                    'Measurement_AppliedKvp',
                    'IrradiationTime_SetTime',
                    'OutputRow_kV',
                    'CongruenceMeasurement_Dimension',
                    'FocalSpot_FocusType',
                    'Table2_mAsApplied',
                    'MeasurementRow_maApplied',
                    'LeakageMeasurement_Location',
                    'Location_Location',
                    'TestRow_TestName',
                    'ExposureRateRow_Distance'
                ];

                const isRowStart = rowStartFields.some(startField => fieldName === startField);

                if (isRowStart) {
                    if (lastRowStartField[currentTestName] !== value) {
                        rowIndexCounter[currentTestName] = (rowIndexCounter[currentTestName] || 0) + 1;
                        lastRowStartField[currentTestName] = value;
                    }
                }

                data.push({
                    'Field Name': fieldName,
                    'Value': value,
                    'Row Index': rowIndexCounter[currentTestName] || 0,
                    'Test Name': currentTestName,
                });
            }
        }
        return data;
    };

    // Process CSV data and populate component states
    const processCSVData = async (csvData: any[]) => {
        try {
            setCsvUploading(true);

            // Group data by test name
            const groupedData: { [key: string]: any[] } = {};
            const testNameMap: { [key: string]: string } = {
                'Congruence of Radiation': 'Congruence of Radiation',
                'Central Beam Alignment': 'Central Beam Alignment',
                'Effective Focal Spot': 'Effective Focal Spot',
                'Accuracy of Irradiation Time': 'Accuracy of Irradiation Time',
                'Total Filtration': 'Total Filtration',
                'Linearity of mA Loading': 'Linearity of mA Loading',
                'Linearity of mAs Loading': 'Linearity of mAs Loading',
                'Output Consistency': 'Output Consistency',
                'Low Contrast Resolution': 'Low Contrast Resolution',
                'High Contrast Resolution': 'High Contrast Resolution',
                'Exposure Rate Table Top': 'Exposure Rate Table Top',
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

            // Process Congruence of Radiation
            if (groupedData['Congruence of Radiation'] && groupedData['Congruence of Radiation'].length > 0) {
                try {
                    const data = groupedData['Congruence of Radiation'];
                    const techniqueRows: any[] = [];
                    const congruenceRows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field.startsWith('TechniqueFactors_')) {
                            const fieldName = field.replace('TechniqueFactors_', '');
                            if (techniqueRows.length === 0) {
                                techniqueRows.push({ fcd: '', kv: '', mas: '' });
                            }
                            if (fieldName === 'FCD') techniqueRows[0].fcd = value;
                            if (fieldName === 'kV') techniqueRows[0].kv = value;
                            if (fieldName === 'mAs') techniqueRows[0].mas = value;
                        }

                        if (field.startsWith('CongruenceMeasurement_')) {
                            while (congruenceRows.length <= rowIndex) {
                                congruenceRows.push({ dimension: '', observedShift: '', edgeShift: '', tolerance: '' });
                            }
                            const fieldName = field.replace('CongruenceMeasurement_', '');
                            if (fieldName === 'Dimension') congruenceRows[rowIndex].dimension = value;
                            if (fieldName === 'ObservedShift') congruenceRows[rowIndex].observedShift = value;
                            if (fieldName === 'EdgeShift') congruenceRows[rowIndex].edgeShift = value;
                            if (fieldName === 'Tolerance') congruenceRows[rowIndex].tolerance = value;
                        }
                    });

                    // Filter out empty congruence rows
                    const filteredCongruenceRows = congruenceRows.filter(r => r.dimension || r.observedShift || r.edgeShift);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        congruenceOfRadiation: {
                            techniqueRows: techniqueRows.length > 0 ? techniqueRows : [{ fcd: '', kv: '', mas: '' }],
                            congruenceRows: filteredCongruenceRows.length > 0 ? filteredCongruenceRows : [],
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Congruence of Radiation:', error);
                }
            }

            // Process Central Beam Alignment
            if (groupedData['Central Beam Alignment'] && groupedData['Central Beam Alignment'].length > 0) {
                try {
                    const data = groupedData['Central Beam Alignment'];
                    const testConditions = { fcd: '', kv: '', mas: '' };
                    let observedTiltX = '';
                    let observedTiltY = '';
                    let toleranceValue = '2';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();

                        if (field === 'TestConditions_FCD') testConditions.fcd = value;
                        if (field === 'TestConditions_kV') testConditions.kv = value;
                        if (field === 'TestConditions_mAs') testConditions.mas = value;
                        if (field === 'ObservedTilt_X') observedTiltX = value;
                        if (field === 'ObservedTilt_Y') observedTiltY = value;
                        if (field === 'Tolerance_Value') toleranceValue = value;
                    });

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        centralBeamAlignment: {
                            testConditions,
                            observedTiltX,
                            observedTiltY,
                            toleranceValue,
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Central Beam Alignment:', error);
                }
            }

            // Process Effective Focal Spot
            if (groupedData['Effective Focal Spot'] && groupedData['Effective Focal Spot'].length > 0) {
                try {
                    const data = groupedData['Effective Focal Spot'];
                    let fcd = '';
                    const focalSpots: any[] = [];
                    const tolerance = {
                        tolSmallMul: '0.5',
                        smallLimit: '0.8',
                        tolMediumMul: '0.4',
                        mediumLower: '0.8',
                        mediumUpper: '1.5',
                        tolLargeMul: '0.3',
                    };

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'FCD') fcd = value;
                        if (field === 'Tolerance_TolSmallMul') tolerance.tolSmallMul = value;
                        if (field === 'Tolerance_SmallLimit') tolerance.smallLimit = value;
                        if (field === 'Tolerance_TolMediumMul') tolerance.tolMediumMul = value;
                        if (field === 'Tolerance_MediumLower') tolerance.mediumLower = value;
                        if (field === 'Tolerance_MediumUpper') tolerance.mediumUpper = value;
                        if (field === 'Tolerance_TolLargeMul') tolerance.tolLargeMul = value;

                        if (field.startsWith('FocalSpot_')) {
                            while (focalSpots.length <= rowIndex) {
                                focalSpots.push({ focusType: '', statedWidth: '', statedHeight: '', measuredWidth: '', measuredHeight: '' });
                            }
                            const fieldName = field.replace('FocalSpot_', '');
                            if (fieldName === 'FocusType') focalSpots[rowIndex].focusType = value;
                            if (fieldName === 'StatedWidth') focalSpots[rowIndex].statedWidth = value;
                            if (fieldName === 'StatedHeight') focalSpots[rowIndex].statedHeight = value;
                            if (fieldName === 'MeasuredWidth') focalSpots[rowIndex].measuredWidth = value;
                            if (fieldName === 'MeasuredHeight') focalSpots[rowIndex].measuredHeight = value;
                        }
                    });

                    // Filter out empty rows
                    const filteredFocalSpots = focalSpots.filter(s => s.focusType || s.statedWidth || s.statedHeight || s.measuredWidth || s.measuredHeight);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        effectiveFocalSpot: {
                            fcd,
                            focalSpots: filteredFocalSpots.length > 0 ? filteredFocalSpots : [],
                            tolerance,
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Effective Focal Spot:', error);
                }
            }

            // Process Accuracy of Irradiation Time
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
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'TestConditions_FCD') testConditions.fcd = value;
                        if (field === 'TestConditions_kV') testConditions.kv = value;
                        if (field === 'TestConditions_ma') testConditions.ma = value;
                        if (field === 'Tolerance_Operator') toleranceOperator = value;
                        if (field === 'Tolerance_Value') toleranceValue = value;

                        if (field.startsWith('IrradiationTime_')) {
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

                    // Filter out empty rows
                    const filteredIrradiationTimes = irradiationTimes.filter(t => t.setTime || t.measuredTime);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        accuracyOfIrradiationTime: {
                            testConditions,
                            irradiationTimes: filteredIrradiationTimes.length > 0 ? filteredIrradiationTimes : [],
                            tolerance: { operator: toleranceOperator, value: toleranceValue },
                        }
                    }));
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
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'mAStations') {
                            if (!mAStations.includes(value)) {
                                mAStations.push(value);
                            }
                        }

                        if (field.startsWith('Measurement_')) {
                            while (measurements.length <= rowIndex) {
                                measurements.push({ appliedKvp: '', measuredValues: [], averageKvp: '' });
                            }
                            const fieldName = field.replace('Measurement_', '');
                            if (fieldName === 'AppliedKvp') measurements[rowIndex].appliedKvp = value;
                            if (fieldName === 'AverageKvp') measurements[rowIndex].averageKvp = value;
                            if (fieldName.startsWith('Meas')) {
                                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                                while (measurements[rowIndex].measuredValues.length <= colIndex) {
                                    measurements[rowIndex].measuredValues.push('');
                                }
                                measurements[rowIndex].measuredValues[colIndex] = value;
                            }
                            // Remarks will be calculated automatically by the component
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
                    });

                    // Filter out empty measurement rows
                    const filteredMeasurements = measurements.filter(m => m.appliedKvp || m.measuredValues.some((v: string) => v) || m.averageKvp);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        totalFiltration: {
                            mAStations: mAStations.length > 0 ? mAStations : ['50 mA', '100 mA'],
                            measurements: filteredMeasurements.length > 0 ? filteredMeasurements : [],
                            tolerance: { sign: toleranceSign, value: toleranceValue },
                            totalFiltration,
                            filtrationTolerance,
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Total Filtration:', error);
                }
            }

            // Process Linearity of mA Loading
            if (groupedData['Linearity of mA Loading'] && groupedData['Linearity of mA Loading'].length > 0) {
                try {
                    const data = groupedData['Linearity of mA Loading'];
                    const table1 = { fcd: '', kv: '', time: '' };
                    let tolerance = '0.1';
                    const table2Rows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'Table1_FCD') table1.fcd = value;
                        if (field === 'Table1_kV') table1.kv = value;
                        if (field === 'Table1_Time') table1.time = value;
                        if (field === 'Tolerance') tolerance = value;

                        if (field.startsWith('Table2_')) {
                            while (table2Rows.length <= rowIndex) {
                                table2Rows.push({ ma: '', meas1: '', meas2: '', meas3: '', average: '', x: '', xMax: '', xMin: '', col: '' });
                            }
                            const fieldName = field.replace('Table2_', '');
                            if (fieldName === 'ma') table2Rows[rowIndex].ma = value;
                            if (fieldName === 'Meas1') table2Rows[rowIndex].meas1 = value;
                            if (fieldName === 'Meas2') table2Rows[rowIndex].meas2 = value;
                            if (fieldName === 'Meas3') table2Rows[rowIndex].meas3 = value;
                            if (fieldName === 'Average') table2Rows[rowIndex].average = value;
                            if (fieldName === 'x') table2Rows[rowIndex].x = value;
                            if (fieldName === 'xMax') table2Rows[rowIndex].xMax = value;
                            if (fieldName === 'xMin') table2Rows[rowIndex].xMin = value;
                            if (fieldName === 'col') table2Rows[rowIndex].col = value;
                            // Remarks will be calculated automatically by the component
                        }
                    });

                    // Filter out empty rows
                    const filteredTable2Rows = table2Rows.filter(r => r.ma || r.meas1 || r.meas2 || r.meas3);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        linearityOfMALoading: {
                            table1,
                            tolerance,
                            table2Rows: filteredTable2Rows.length > 0 ? filteredTable2Rows : [],
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Linearity of mA Loading:', error);
                }
            }

            // Process Linearity of mAs Loading
            if (groupedData['Linearity of mAs Loading'] && groupedData['Linearity of mAs Loading'].length > 0) {
                try {
                    const data = groupedData['Linearity of mAs Loading'];
                    const table1 = { fcd: '', kv: '' };
                    let tolerance = '0.1';
                    const table2Rows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'Table1_FCD') table1.fcd = value;
                        if (field === 'Table1_kV') table1.kv = value;
                        if (field === 'Tolerance') tolerance = value;

                        if (field.startsWith('Table2_')) {
                            while (table2Rows.length <= rowIndex) {
                                table2Rows.push({ mAsApplied: '', meas1: '', meas2: '', meas3: '', average: '', x: '', xMax: '', xMin: '', col: '' });
                            }
                            const fieldName = field.replace('Table2_', '');
                            if (fieldName === 'mAsApplied') table2Rows[rowIndex].mAsApplied = value;
                            if (fieldName === 'Meas1') table2Rows[rowIndex].meas1 = value;
                            if (fieldName === 'Meas2') table2Rows[rowIndex].meas2 = value;
                            if (fieldName === 'Meas3') table2Rows[rowIndex].meas3 = value;
                            if (fieldName === 'Average') table2Rows[rowIndex].average = value;
                            if (fieldName === 'x') table2Rows[rowIndex].x = value;
                            if (fieldName === 'xMax') table2Rows[rowIndex].xMax = value;
                            if (fieldName === 'xMin') table2Rows[rowIndex].xMin = value;
                            if (fieldName === 'col') table2Rows[rowIndex].col = value;
                            // Remarks will be calculated automatically by the component
                        }
                    });

                    // Filter out empty rows
                    const filteredTable2Rows = table2Rows.filter(r => r.mAsApplied || r.meas1 || r.meas2 || r.meas3);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        linearityOfMAsLoading: {
                            table1,
                            tolerance,
                            table2Rows: filteredTable2Rows.length > 0 ? filteredTable2Rows : [],
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Linearity of mAs Loading:', error);
                }
            }

            // Process Output Consistency
            if (groupedData['Output Consistency'] && groupedData['Output Consistency'].length > 0) {
                try {
                    const data = groupedData['Output Consistency'];
                    let toleranceValue = '5';
                    const outputRows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'Tolerance_Value') toleranceValue = value;

                        if (field.startsWith('OutputRow_')) {
                            while (outputRows.length <= rowIndex) {
                                outputRows.push({ kv: '', mAs: '', meas1: '', meas2: '', meas3: '', average: '', cv: '' });
                            }
                            const fieldName = field.replace('OutputRow_', '');
                            if (fieldName === 'kV') outputRows[rowIndex].kv = value;
                            if (fieldName === 'mAs') outputRows[rowIndex].mAs = value;
                            if (fieldName === 'Meas1') outputRows[rowIndex].meas1 = value;
                            if (fieldName === 'Meas2') outputRows[rowIndex].meas2 = value;
                            if (fieldName === 'Meas3') outputRows[rowIndex].meas3 = value;
                            if (fieldName === 'Average') outputRows[rowIndex].average = value;
                            if (fieldName === 'CoV') outputRows[rowIndex].cv = value;
                        }
                    });

                    // Filter out empty rows
                    const filteredOutputRows = outputRows.filter(r => r.kv || r.mAs || r.meas1 || r.meas2 || r.meas3);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        outputConsistency: {
                            toleranceValue,
                            outputRows: filteredOutputRows.length > 0 ? filteredOutputRows : [],
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Output Consistency:', error);
                }
            }

            // Process Low Contrast Resolution
            if (groupedData['Low Contrast Resolution'] && groupedData['Low Contrast Resolution'].length > 0) {
                try {
                    const data = groupedData['Low Contrast Resolution'];
                    let measuredLpPerMm = '';
                    let recommendedStandard = '';
                    let smallestHoleSize = '';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();

                        if (field === 'MeasuredLpPerMm') measuredLpPerMm = value;
                        if (field === 'RecommendedStandard') recommendedStandard = value;
                        if (field === 'SmallestHoleSize') smallestHoleSize = value;
                    });

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        lowContrastResolution: {
                            measuredLpPerMm,
                            recommendedStandard,
                            smallestHoleSize,
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Low Contrast Resolution:', error);
                }
            }

            // Process High Contrast Resolution
            if (groupedData['High Contrast Resolution'] && groupedData['High Contrast Resolution'].length > 0) {
                try {
                    const data = groupedData['High Contrast Resolution'];
                    let measuredLpPerMm = '';
                    let recommendedStandard = '';
                    let smallestHoleSize = '';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();

                        if (field === 'MeasuredLpPerMm') measuredLpPerMm = value;
                        if (field === 'RecommendedStandard') recommendedStandard = value;
                        if (field === 'SmallestHoleSize') smallestHoleSize = value;
                    });

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        highContrastResolution: {
                            measuredLpPerMm,
                            recommendedStandard,
                            smallestHoleSize,
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing High Contrast Resolution:', error);
                }
            }

            // Process Exposure Rate Table Top
            if (groupedData['Exposure Rate Table Top'] && groupedData['Exposure Rate Table Top'].length > 0) {
                try {
                    const data = groupedData['Exposure Rate Table Top'];
                    const rows: any[] = [];
                    let aecTolerance = '10';
                    let nonAecTolerance = '5';
                    let minFocusDistance = '30';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field.startsWith('ExposureRateRow_')) {
                            while (rows.length <= rowIndex) {
                                rows.push({ distance: '', appliedKv: '', appliedMa: '', exposure: '', remark: '' });
                            }
                            const fieldName = field.replace('ExposureRateRow_', '');
                            if (fieldName === 'Distance') rows[rowIndex].distance = value;
                            if (fieldName === 'AppliedKv') rows[rowIndex].appliedKv = value;
                            if (fieldName === 'AppliedMa') rows[rowIndex].appliedMa = value;
                            if (fieldName === 'Exposure') rows[rowIndex].exposure = value;
                            if (fieldName === 'Remark') rows[rowIndex].remark = value;
                        }

                        if (field === 'Tolerance_AecTolerance') aecTolerance = value;
                        if (field === 'Tolerance_NonAecTolerance') nonAecTolerance = value;
                        if (field === 'Tolerance_MinFocusDistance') minFocusDistance = value;
                    });

                    // Filter out empty rows
                    const filteredRows = rows.filter(r => r.distance || r.appliedKv || r.appliedMa || r.exposure);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        exposureRateTableTop: {
                            rows: filteredRows.length > 0 ? filteredRows : [],
                            aecTolerance,
                            nonAecTolerance,
                            minFocusDistance,
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Exposure Rate Table Top:', error);
                }
            }

            // Process Tube Housing Leakage
            if (groupedData['Tube Housing Leakage'] && groupedData['Tube Housing Leakage'].length > 0) {
                try {
                    const data = groupedData['Tube Housing Leakage'];
                    const settings = { distance: '', kv: '', ma: '', time: '' };
                    let workload = '';
                    let toleranceValue = '1';
                    let toleranceOperator = '<=';
                    const leakageMeasurements: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'Settings_Distance') settings.distance = value;
                        if (field === 'Settings_kV') settings.kv = value;
                        if (field === 'Settings_ma') settings.ma = value;
                        if (field === 'Settings_time') settings.time = value;
                        if (field === 'Workload') workload = value;
                        if (field === 'ToleranceValue') toleranceValue = value;
                        if (field === 'ToleranceOperator') toleranceOperator = value;

                        if (field.startsWith('LeakageMeasurement_')) {
                            while (leakageMeasurements.length <= rowIndex) {
                                leakageMeasurements.push({ location: '', left: '', right: '', front: '', back: '', top: '', max: '' });
                            }
                            const fieldName = field.replace('LeakageMeasurement_', '');
                            if (fieldName === 'Location') leakageMeasurements[rowIndex].location = value;
                            if (fieldName === 'Left') leakageMeasurements[rowIndex].left = value;
                            if (fieldName === 'Right') leakageMeasurements[rowIndex].right = value;
                            if (fieldName === 'Front') leakageMeasurements[rowIndex].front = value;
                            if (fieldName === 'Back') leakageMeasurements[rowIndex].back = value;
                            if (fieldName === 'Top') leakageMeasurements[rowIndex].top = value;
                            if (fieldName === 'Max') leakageMeasurements[rowIndex].max = value;
                        }
                    });

                    // Filter out empty rows
                    const filteredLeakageMeasurements = leakageMeasurements.filter(m => m.location || m.left || m.right || m.front || m.back || m.top || m.max);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        tubeHousingLeakage: {
                            settings,
                            workload,
                            tolerance: { value: toleranceValue, operator: toleranceOperator },
                            leakageMeasurements: filteredLeakageMeasurements.length > 0 ? filteredLeakageMeasurements : [],
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Tube Housing Leakage:', error);
                }
            }

            // Process Radiation Protection Survey
            if (groupedData['Radiation Protection Survey'] && groupedData['Radiation Protection Survey'].length > 0) {
                try {
                    const data = groupedData['Radiation Protection Survey'];
                    let surveyDate = '';
                    let hasValidCalibration = '';
                    let appliedCurrent = '100';
                    let appliedVoltage = '80';
                    let exposureTime = '1.0';
                    let workload = '5000';
                    const locations: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'SurveyDate') surveyDate = value;
                        if (field === 'HasValidCalibration') hasValidCalibration = value;
                        if (field === 'AppliedCurrent') appliedCurrent = value;
                        if (field === 'AppliedVoltage') appliedVoltage = value;
                        if (field === 'ExposureTime') exposureTime = value;
                        if (field === 'Workload') workload = value;

                        if (field.startsWith('Location_')) {
                            while (locations.length <= rowIndex) {
                                locations.push({ location: '', mRPerHr: '', mRPerWeek: '', category: '' });
                            }
                            const fieldName = field.replace('Location_', '');
                            if (fieldName === 'Location') locations[rowIndex].location = value;
                            if (fieldName === 'mRPerHr') locations[rowIndex].mRPerHr = value;
                            if (fieldName === 'mRPerWeek') locations[rowIndex].mRPerWeek = value;
                            // Result will be calculated automatically by the component
                            if (fieldName === 'Category') locations[rowIndex].category = value;
                        }
                    });

                    const filteredLocations = locations.filter(loc => loc.location || loc.mRPerHr);

                    setCsvDataForComponents((prev: any) => ({
                        ...prev,
                        radiationProtectionSurvey: {
                            surveyDate,
                            hasValidCalibration,
                            appliedCurrent,
                            appliedVoltage,
                            exposureTime,
                            workload,
                            locations: filteredLocations.length > 0 ? filteredLocations : [],
                        }
                    }));
                } catch (error: any) {
                    console.error('Error processing Radiation Protection Survey:', error);
                }
            }

            const processedTests = Object.keys(groupedData).filter(key => groupedData[key].length > 0);
            console.log(`Processed ${processedTests.length} test(s) from CSV`);
            
            if (processedTests.length > 0) {
                setCsvDataVersion(prev => prev + 1);
                toast.success(`CSV data loaded successfully! ${processedTests.length} test(s) filled. Please review and save manually.`);
                
                // Force refresh of all test components to load the CSV data
                setTimeout(() => {
                    const newKey = Date.now();
                    console.log('Setting refreshKey to:', newKey);
                    setRefreshKey(newKey);
                }, 50);
            } else {
                toast.error('No test data found in CSV file. Please check the format.');
            }
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

        try {
            setCsvUploading(true);

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                        const csvData = parseExcelToCSVFormat(workbook);
                        await processCSVData(csvData);
                    } catch (error: any) {
                        console.error('Error reading Excel file:', error);
                        toast.error(`Failed to read Excel file: ${error?.message || 'Unknown error'}`);
                    } finally {
                        setCsvUploading(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const text = e.target?.result as string;
                        const csvData = parseCSV(text);
                        await processCSVData(csvData);
                    } catch (error: any) {
                        console.error('Error reading CSV file:', error);
                        toast.error(`Failed to read CSV file: ${error?.message || 'Unknown error'}`);
                    } finally {
                        setCsvUploading(false);
                    }
                };
                reader.readAsText(file);
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast.error(`Failed to upload file: ${error?.message || 'Unknown error'}`);
            setCsvUploading(false);
        }
    };

    // Fetch and process CSV/Excel file from URL (passed from ServiceDetails2)
    useEffect(() => {
        const fetchAndProcessFile = async () => {
            if (!csvFileUrl) {
                console.log('GenerateServiceReport: No csvFileUrl provided, skipping file fetch');
                return;
            }

            console.log('GenerateServiceReport: Fetching file from URL:', csvFileUrl);

            try {
                setCsvUploading(true);

                const urlLower = csvFileUrl.toLowerCase();
                const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

                let csvData: any[] = [];

                if (isExcel) {
                    console.log('GenerateServiceReport: Detected Excel file, fetching through proxy...');
                    toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const arrayBuffer = await response.data.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                    console.log('GenerateServiceReport: Excel file parsed, sheets:', workbook.SheetNames);

                    csvData = parseExcelToCSVFormat(workbook);
                    console.log('GenerateServiceReport: Converted Excel to CSV format, rows:', csvData.length);
                } else {
                    console.log('GenerateServiceReport: Detected CSV file, fetching through proxy...');
                    toast.loading('Loading CSV data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const text = await response.data.text();
                    console.log('GenerateServiceReport: CSV file fetched, length:', text.length);

                    csvData = parseCSV(text);
                }

                console.log('GenerateServiceReport: Parsed data, rows:', csvData.length);

                if (csvData.length > 0) {
                    console.log('GenerateServiceReport: Processing data...');
                    await processCSVData(csvData);
                    console.log('GenerateServiceReport: Data processed successfully');
                    toast.success('File data loaded and auto-filled successfully!', { id: 'csv-loading' });
                } else {
                    console.warn('GenerateServiceReport: No data found in file');
                    toast.error('File is empty or could not be parsed', { id: 'csv-loading' });
                }
            } catch (error: any) {
                console.error('GenerateServiceReport: Error fetching or processing file:', error);
                let errorMessage = 'Unknown error';
                if (error?.message) {
                    errorMessage = error.message;
                }
                toast.error(`Failed to load file: ${errorMessage}`, { id: 'csv-loading' });
            } finally {
                setCsvUploading(false);
            }
        };

        fetchAndProcessFile();
    }, [csvFileUrl]);

    // In RadioFluro.tsx - handleSaveHeader function
    const handleSaveHeader = async () => {
        setSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
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

    // MODAL POPUP
    if (showTimerModal && hasTimer === null) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
                    <p className="text-gray-600 mb-8">
                        Does this Radiography & Fluoroscopy unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                Generate Radiography and Fluoroscopy QA Test Report
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
                    onClick={() => navigate(`/admin/orders/view-service-report-fixed-radio-flouro?serviceId=${serviceId}`)}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    View Generated Report
                </button>
            </div>

            {/* CSV/Excel Upload Section */}
            <div className="mt-12 mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Upload Test Data</h3>
                        <p className="text-sm text-blue-700">
                            Upload a CSV or Excel file to auto-fill test data. Download templates below.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex gap-2">
                            <a
                                href="/templates/FixedRadioFluro_Test_Data_Template_WithTimer.csv"
                                download="FixedRadioFluro_Test_Data_Template_WithTimer.csv"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <CloudArrowUpIcon className="w-5 h-5" />
                                Download Template (With Timer)
                            </a>
                            <a
                                href="/templates/FixedRadioFluro_Test_Data_Template_NoTimer.csv"
                                download="FixedRadioFluro_Test_Data_Template_NoTimer.csv"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <CloudArrowUpIcon className="w-5 h-5" />
                                Download Template (No Timer)
                            </a>
                        </div>
                        <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
                            <CloudArrowUpIcon className="w-5 h-5" />
                            {csvUploading ? 'Uploading...' : 'Upload CSV/Excel'}
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

            {/* QA TESTS - Now Conditional */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
                {[
                    {
                        title: "Congruence of radiation & Optical Field",
                        component: (
                            <Congruence
                                key={`congruence-${refreshKey}`}
                                serviceId={serviceId}
                                testId={radiationProfileTest?._id || null}
                                onTestSaved={(id: any) => console.log("Radiation Profile saved:", id)}
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
                        )
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
                        )
                    },

                    // Timer Test — Only if user said YES
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

                    // { title: "Accuracy Of Operating Potential", component: <AccuracyOfOperatingPotential serviceId={serviceId} /> },
                    { 
                        title: "Total Filteration", 
                        component: (
                            <TotalFilteration 
                                key={`total-filtration-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.totalFiltration}
                            />
                        )
                    },

                    // Linearity Test — Conditional
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Linearity Of mA Loading",
                                component: (
                                    <LinearityOfmALoading 
                                        key={`linearity-ma-${refreshKey}`}
                                        serviceId={serviceId}
                                        refreshKey={refreshKey}
                                        initialData={csvDataForComponents.linearityOfMALoading}
                                    />
                                ),
                            },
                        ]
                        : hasTimer === false
                            ? [
                                {
                                    title: "Linearity Of mAs Loading",
                                    component: (
                                        <LinearityOfMasLoading 
                                            key={`linearity-mas-${refreshKey}`}
                                            serviceId={serviceId}
                                            refreshKey={refreshKey}
                                            initialData={csvDataForComponents.linearityOfMAsLoading}
                                        />
                                    ),
                                },
                            ]
                            : []),

                    { 
                        title: "Output Consistency", 
                        component: (
                            <OutputConsistency 
                                key={`output-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.outputConsistency}
                            />
                        )
                    },
                    { 
                        title: "Low Contrast Resolution", 
                        component: (
                            <LowContrastResolution 
                                key={`low-contrast-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.lowContrastResolution}
                            />
                        )
                    },
                    { 
                        title: "High Contrast Resolution", 
                        component: (
                            <HighContrastResolution 
                                key={`high-contrast-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.highContrastResolution}
                            />
                        )
                    },
                    { 
                        title: "Exposure Rate Table Top", 
                        component: (
                            <ExposureRateTableTop 
                                key={`exposure-rate-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.exposureRateTableTop}
                            />
                        )
                    },
                    { 
                        title: "Tube Housing Leakage", 
                        component: (
                            <RadiationLeakageLevel 
                                key={`tube-leakage-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.tubeHousingLeakage}
                            />
                        )
                    },
                    {
                        title: "Details Of Radiation Protection Survey of the Installation",
                        component: (
                            <RadiationProtectionSurvey 
                                key={`radiation-protection-${refreshKey}`}
                                serviceId={serviceId}
                                refreshKey={refreshKey}
                                initialData={csvDataForComponents.radiationProtectionSurvey}
                            />
                        ),
                    },
                    // { title: "Equipment Setting", component: <EquipementSetting serviceId={serviceId} /> },
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

export default RadioFluro;