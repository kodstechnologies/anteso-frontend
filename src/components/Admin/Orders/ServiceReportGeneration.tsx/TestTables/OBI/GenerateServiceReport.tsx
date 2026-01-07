// GenerateServiceReport-OBI.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { saveReportHeader, getReportHeaderForOBI } from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import AlignmentTest from "./AlignmentTest";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import TimerTest from "./TimerTest";
import OutputConsistency from "./OutputConsistency";
import CentralBeamAlignment from "./CentralBeamAlignment";
import CongruenceOfRadiation from "./CongruenceOfRadiation";
import EffectiveFocalSpot from "./EffectiveFocalSpot";
import LinearityOfMasLoadingStation from "./LinearityOfMasLoadingStation";
import LinearityOfTime from "./LinearityOfTime";
import TubeHousingLeakage from "./TubeHousingLeakage";
import RadiationProtection from "./RadiationProtection";
import HighContrastSensitivity from "./HighContrastSensitivity";
import LowContrastSensitivity from "./LowContrastSensitivity";

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

const OBI: React.FC<{ serviceId: string; csvFileUrl?: string | null }> = ({ serviceId, csvFileUrl }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [originalTools, setOriginalTools] = useState<any[]>([]);
    const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
    const [showTimerModal, setShowTimerModal] = useState(false); // Will be set based on localStorage
    const [savedTestIds, setSavedTestIds] = useState<{
        AlignmentTestOBI?: string;
        accuracyOfOperatingPotentialOBI?: string;
        TimerTestOBI?: string;
        OutputConsistencyOBI?: string;
        CentralBeamAlignmentOBI?: string;
        CongruenceOfRadiationOBI?: string;
        EffectiveFocalSpotOBI?: string;
        LinearityOfMasLoadingStationsOBI?: string;
        LinearityOfTimeOBI?: string;
        TubeHousingLeakageOBI?: string;
        RadiationProtectionSurveyOBI?: string;
        HighContrastSensitivityOBI?: string;
        LowContrastSensitivityOBI?: string;
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
        category: "",
        condition: "OK",
        testingProcedureNumber: "",
        pages: "",
        testDate: "",
        testDueDate: "",
        location: "",
        temperature: "",
        humidity: "",
        engineerNameRPId: "",
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
        timerTest?: any;
        outputConsistency?: any;
        centralBeamAlignment?: any;
        congruenceOfRadiation?: any;
        effectiveFocalSpot?: any;
        linearityOfMasLoading?: any;
        linearityOfTime?: any;
        tubeHousingLeakage?: any;
        radiationProtection?: any;
        highContrastSensitivity?: any;
        lowContrastSensitivity?: any;
    }>({});

    // Debug: Log CSV data when it changes
    useEffect(() => {
        console.log('csvDataForComponents updated:', csvDataForComponents);
    }, [csvDataForComponents]);

    // Check localStorage for timer preference on mount
    useEffect(() => {
        if (serviceId) {
            const stored = localStorage.getItem(`obi-timer-${serviceId}`);
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
            localStorage.setItem(`obi-timer-${serviceId}`, String(choice));
        }
    };

    // Only fetch initial service details and tools — NOT saved report
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
                console.log("data", data);
                const firstTest = data.qaTests?.[0];

                setDetails(data);

                // Calculate test due date (2 years from QA test date)
                let testDate = "";
                let testDueDate = "";
                if (firstTest?.createdAt) {
                    const qaTestDate = new Date(firstTest.createdAt);
                    testDate = qaTestDate.toISOString().split("T")[0];
                    // Add 2 years
                    const dueDate = new Date(qaTestDate);
                    dueDate.setFullYear(dueDate.getFullYear() + 2);
                    testDueDate = dueDate.toISOString().split("T")[0];
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
                    category: "",
                    condition: "OK",
                    testingProcedureNumber: "",
                    pages: "",
                    testDate: testDate,
                    testDueDate: testDueDate,
                    location: "", // Don't auto-fill location
                    temperature: "",
                    humidity: "",
                    engineerNameRPId: data.engineerAssigned?.name || "",
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
                setOriginalTools(toolsRes.data.toolsAssigned || []);

                // Load existing report header data if available
                try {
                    const reportRes = await getReportHeaderForOBI(serviceId);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // CSV Parser Function - handles quoted values
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
            '========== ACCURACY OF OPERATING POTENTIAL (kVp) ==========': 'Accuracy of Operating Potential',
            '========== ACCURACY OF IRRADIATION TIME ==========': 'Accuracy of Irradiation Time',
            '========== OUTPUT CONSISTENCY ==========': 'Output Consistency',
            '========== CENTRAL BEAM ALIGNMENT ==========': 'Central Beam Alignment',
            '========== CONGRUENCE OF RADIATION ==========': 'Congruence of Radiation',
            '========== EFFECTIVE FOCAL SPOT ==========': 'Effective Focal Spot',
            '========== LINEARITY OF mAs LOADING STATIONS ==========': 'Linearity of mAs Loading Stations',
            '========== LINEARITY OF TIME ==========': 'Linearity of Time',
            '========== TUBE HOUSING LEAKAGE ==========': 'Tube Housing Leakage',
            '========== RADIATION PROTECTION SURVEY ==========': 'Radiation Protection Survey',
            '========== HIGH CONTRAST SENSITIVITY ==========': 'High Contrast Sensitivity',
            '========== LOW CONTRAST SENSITIVITY ==========': 'Low Contrast Sensitivity',
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
            
            if (firstColumn.startsWith('==========') && firstColumn.endsWith('==========')) {
                currentTestName = sectionToTestName[firstColumn] || '';
                continue;
            }
            
            if (firstColumn.startsWith('---') || firstColumn === '' || !fieldName) {
                continue;
            }
            
            const isKnownField = fieldName.match(/^(Table|Tolerance|ExposureCondition|Measurement|TestConditions|IrradiationTime|TechniqueFactors|FocalSpot|LeakageMeasurement|Location|SurveyDate|HasValidCalibration|AppliedCurrent|AppliedVoltage|ExposureTime|MeasHeader|Table1|Table2|ObservedTilt|FCD|FFD|kV|mA|mAs|Time|Settings|Workload|RadiationOutput|OutputRow|TotalFiltration|CongruenceMeasurement|MeasurementRow|MeasuredLpPerMm|RecommendedStandard|SmallestHoleSize|ToleranceOperator|ToleranceValue)/);
            if (!isKnownField) {
                continue;
            }
            
            if (currentTestName) {
                row['Test Name'] = currentTestName;
                data.push(row);
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
                'Output Consistency': 'Output Consistency',
                'Central Beam Alignment': 'Central Beam Alignment',
                'Congruence of Radiation': 'Congruence of Radiation',
                'Effective Focal Spot': 'Effective Focal Spot',
                'Linearity of mAs Loading Stations': 'Linearity of mAs Loading Stations',
                'Linearity of Time': 'Linearity of Time',
                'Tube Housing Leakage': 'Tube Housing Leakage',
                'Radiation Protection Survey': 'Radiation Protection Survey',
                'High Contrast Sensitivity': 'High Contrast Sensitivity',
                'Low Contrast Sensitivity': 'Low Contrast Sensitivity',
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
                    const measurements: any[] = [];
                    const mAStations: string[] = [];
                    let ffd = '';
                    let tolerance = { sign: '±', value: '2.0' };
                    const totalFiltration = { measured: '', required: '2.5' };

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'FFD') ffd = value;
                        if (field === 'Tolerance_Sign') tolerance.sign = value;
                        if (field === 'Tolerance_Value') tolerance.value = value;
                        if (field === 'TotalFiltration_Measured') totalFiltration.measured = value;
                        if (field === 'TotalFiltration_Required') totalFiltration.required = value;
                        
                        if (field === 'MeasHeader') {
                            if (!mAStations.includes(value)) {
                                mAStations.push(value);
                            }
                        }

                        if (field.startsWith('Measurement_')) {
                            while (measurements.length <= rowIndex) {
                                measurements.push({ appliedKvp: '', measuredValues: [], averageKvp: '', remarks: '' });
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
                        }
                    });

                    // Always set the data if we processed any rows, even if measurements is empty
                    // This ensures the component receives the data structure
                    const csvData = {
                        ffd,
                        mAStations: mAStations.length > 0 ? mAStations : ['10', '100', '200'],
                        measurements: measurements.length > 0 ? measurements : [],
                        tolerance,
                        totalFiltration,
                    };
                    console.log('✓ Accuracy of Operating Potential data prepared for form:', csvData);
                    console.log('  - ffd:', ffd);
                    console.log('  - mAStations:', csvData.mAStations);
                    console.log('  - measurements count:', measurements.length);
                    console.log('  - tolerance:', tolerance);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        accuracyOfOperatingPotential: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Accuracy of Operating Potential:', error);
                    toast.error(`Failed to process Accuracy of Operating Potential: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Timer Test
            if (groupedData['Accuracy of Irradiation Time'] && groupedData['Accuracy of Irradiation Time'].length > 0) {
                try {
                    const data = groupedData['Accuracy of Irradiation Time'];
                    const testConditions = { fcd: '', kv: '', ma: '' };
                    const irradiationTimes: any[] = [];
                    let toleranceOperator = '<=';
                    let toleranceValue = '5';

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

                    // Always set the data structure, even if some fields are empty
                    const csvData = {
                        testConditions,
                        irradiationTimes: irradiationTimes.length > 0 ? irradiationTimes : [],
                        tolerance: {
                            operator: toleranceOperator,
                            value: toleranceValue,
                        },
                    };
                    console.log('✓ Accuracy of Irradiation Time data prepared for form:', csvData);
                    console.log('  - testConditions:', testConditions);
                    console.log('  - irradiationTimes count:', irradiationTimes.length);
                    console.log('  - tolerance:', csvData.tolerance);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        timerTest: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Accuracy of Irradiation Time:', error);
                    toast.error(`Failed to process Accuracy of Irradiation Time: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Output Consistency
            if (groupedData['Output Consistency'] && groupedData['Output Consistency'].length > 0) {
                try {
                    const data = groupedData['Output Consistency'];
                    let ffd = '';
                    let toleranceValue = '0.05';
                    const outputRows: any[] = [];
                    let maxCols = 0;

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'FFD') ffd = value;
                        if (field === 'Tolerance_Value') toleranceValue = value;

                        if (field.startsWith('OutputRow_')) {
                            while (outputRows.length <= rowIndex) {
                                outputRows.push({ kv: '', mas: '', outputs: [], avg: '', cv: '' });
                            }
                            const fieldName = field.replace('OutputRow_', '');
                            if (fieldName === 'kV') outputRows[rowIndex].kv = value;
                            if (fieldName === 'mAs') outputRows[rowIndex].mas = value; // Component uses 'mas', not 'mAs'
                            if (fieldName === 'Avg') outputRows[rowIndex].avg = value;
                            if (fieldName === 'CV') outputRows[rowIndex].cv = value;
                            if (fieldName.startsWith('Meas')) {
                                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                                while (outputRows[rowIndex].outputs.length <= colIndex) {
                                    outputRows[rowIndex].outputs.push({ value: '' });
                                }
                                outputRows[rowIndex].outputs[colIndex] = { value };
                                maxCols = Math.max(maxCols, colIndex + 1);
                            }
                        }
                    });

                    // Generate headers based on max columns found
                    const headers = Array.from({ length: maxCols || 3 }, (_, i) => `Meas ${i + 1}`);

                    const csvData = {
                        ffd,
                        tolerance: { operator: '<=' as const, value: toleranceValue },
                        outputRows: outputRows.length > 0 ? outputRows : [],
                        headers: headers,
                    };
                    console.log('✓ Output Consistency data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        outputConsistency: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Output Consistency:', error);
                    toast.error(`Failed to process Output Consistency: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Central Beam Alignment
            if (groupedData['Central Beam Alignment'] && groupedData['Central Beam Alignment'].length > 0) {
                try {
                    const data = groupedData['Central Beam Alignment'];
                    const techniqueFactors: { fcd: string; kv: string; mas: string } = { fcd: '', kv: '', mas: '' };
                    let observedTiltValue = '';
                    let observedTiltOperator = '<=';
                    let toleranceValue = '1.5';
                    let toleranceOperator = '<=';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();

                        if (field === 'TechniqueFactors_FCD') techniqueFactors.fcd = value;
                        if (field === 'TechniqueFactors_kV') techniqueFactors.kv = value;
                        if (field === 'TechniqueFactors_mAs') techniqueFactors.mas = value; // Component uses 'mas'
                        if (field === 'ObservedTilt_Value') observedTiltValue = value;
                        if (field === 'ObservedTilt_Operator') observedTiltOperator = value;
                        if (field === 'Tolerance_Value') toleranceValue = value;
                        if (field === 'Tolerance_Operator') toleranceOperator = value;
                    });

                    const csvData = {
                        techniqueFactors,
                        observedTilt: { value: observedTiltValue, operator: observedTiltOperator },
                        tolerance: { value: toleranceValue, operator: toleranceOperator },
                    };
                    console.log('✓ Central Beam Alignment data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        centralBeamAlignment: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Central Beam Alignment:', error);
                    toast.error(`Failed to process Central Beam Alignment: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Congruence of Radiation
            if (groupedData['Congruence of Radiation'] && groupedData['Congruence of Radiation'].length > 0) {
                try {
                    const data = groupedData['Congruence of Radiation'];
                    const rows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field.startsWith('CongruenceMeasurement_')) {
                            while (rows.length <= rowIndex) {
                                rows.push({ dimension: '', observedShift: '', edgeShift: '', percentFED: '', tolerance: '', remark: '' as 'Pass' | 'Fail' | '' });
                            }
                            const fieldName = field.replace('CongruenceMeasurement_', '');
                            if (fieldName === 'Dimension') rows[rowIndex].dimension = value;
                            if (fieldName === 'ObservedShift') rows[rowIndex].observedShift = value;
                            if (fieldName === 'EdgeShift') rows[rowIndex].edgeShift = value;
                            if (fieldName === 'PercentFED') rows[rowIndex].percentFED = value;
                            if (fieldName === 'Tolerance') rows[rowIndex].tolerance = value;
                        }
                    });

                    const csvData = {
                        rows: rows.length > 0 ? rows : [],
                    };
                    console.log('✓ Congruence of Radiation data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        congruenceOfRadiation: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Congruence of Radiation:', error);
                    toast.error(`Failed to process Congruence of Radiation: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Effective Focal Spot
            if (groupedData['Effective Focal Spot'] && groupedData['Effective Focal Spot'].length > 0) {
                try {
                    const data = groupedData['Effective Focal Spot'];
                    let fcd = '';
                    const focalSpots: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'FCD') fcd = value;

                        if (field.startsWith('FocalSpot_')) {
                            while (focalSpots.length <= rowIndex) {
                                focalSpots.push({ focusType: '', statedWidth: '', statedHeight: '', measuredWidth: '', measuredHeight: '', remark: '' as 'Pass' | 'Fail' | '' });
                            }
                            const fieldName = field.replace('FocalSpot_', '');
                            if (fieldName === 'FocusType') focalSpots[rowIndex].focusType = value;
                            if (fieldName === 'StatedWidth') focalSpots[rowIndex].statedWidth = value;
                            if (fieldName === 'StatedHeight') focalSpots[rowIndex].statedHeight = value;
                            if (fieldName === 'MeasuredWidth') focalSpots[rowIndex].measuredWidth = value;
                            if (fieldName === 'MeasuredHeight') focalSpots[rowIndex].measuredHeight = value;
                        }
                    });

                    const csvData = {
                        fcd,
                        focalSpots: focalSpots.length > 0 ? focalSpots : [],
                    };
                    console.log('✓ Effective Focal Spot data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        effectiveFocalSpot: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Effective Focal Spot:', error);
                    toast.error(`Failed to process Effective Focal Spot: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Linearity of mAs Loading Stations
            if (groupedData['Linearity of mAs Loading Stations'] && groupedData['Linearity of mAs Loading Stations'].length > 0) {
                try {
                    const data = groupedData['Linearity of mAs Loading Stations'];
                    const table1 = { fcd: '', kv: '', time: '' };
                    const headers: string[] = [];
                    let tolerance = '0.1';
                    let toleranceOperator = '<=';
                    const table2Rows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'Table1_FCD') table1.fcd = value;
                        if (field === 'Table1_kV') table1.kv = value;
                        if (field === 'Table1_Time') table1.time = value;
                        if (field === 'Tolerance') tolerance = value;
                        if (field === 'ToleranceOperator') toleranceOperator = value;
                        if (field === 'MeasHeader') {
                            if (!headers.includes(value)) {
                                headers.push(value);
                            }
                        }

                        if (field.startsWith('Table2_')) {
                            while (table2Rows.length <= rowIndex) {
                                table2Rows.push({ mAsApplied: '', measurements: [], average: '', x: '', xMax: '', xMin: '', coL: '', remark: '' as 'Pass' | 'Fail' | '' });
                            }
                            const fieldName = field.replace('Table2_', '');
                            if (fieldName === 'mAsApplied') table2Rows[rowIndex].mAsApplied = value;
                            if (fieldName === 'Average') table2Rows[rowIndex].average = value;
                            if (fieldName === 'X') table2Rows[rowIndex].x = value;
                            if (fieldName === 'XMax') table2Rows[rowIndex].xMax = value;
                            if (fieldName === 'XMin') table2Rows[rowIndex].xMin = value;
                            if (fieldName === 'CoL') table2Rows[rowIndex].coL = value;
                            if (fieldName.startsWith('Meas')) {
                                const colIndex = parseInt(fieldName.replace('Meas', '')) - 1;
                                while (table2Rows[rowIndex].measurements.length <= colIndex) {
                                    table2Rows[rowIndex].measurements.push('');
                                }
                                table2Rows[rowIndex].measurements[colIndex] = value;
                            }
                        }
                    });

                    const csvData = {
                        table1,
                        headers: headers.length > 0 ? headers : ['Meas 1', 'Meas 2', 'Meas 3'],
                        tolerance: { value: tolerance, operator: toleranceOperator },
                        table2Rows: table2Rows.length > 0 ? table2Rows : [],
                    };
                    console.log('✓ Linearity of mAs Loading Stations data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        linearityOfMasLoading: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Linearity of mAs Loading Stations:', error);
                    toast.error(`Failed to process Linearity of mAs Loading Stations: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Linearity of Time
            if (groupedData['Linearity of Time'] && groupedData['Linearity of Time'].length > 0) {
                try {
                    const data = groupedData['Linearity of Time'];
                    const testConditions = { fdd: '', kv: '', time: '' };
                    const headers: string[] = [];
                    let tolerance = '0.1';
                    const measurementRows: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'TestConditions_FDD') testConditions.fdd = value;
                        if (field === 'TestConditions_kV') testConditions.kv = value;
                        if (field === 'TestConditions_Time') testConditions.time = value;
                        if (field === 'Tolerance') tolerance = value;
                        if (field === 'MeasHeader') {
                            if (!headers.includes(value)) {
                                headers.push(value);
                            }
                        }

                        if (field.startsWith('MeasurementRow_')) {
                            while (measurementRows.length <= rowIndex) {
                                measurementRows.push({ maApplied: '', radiationOutputs: [], averageOutput: '', mGyPerMAs: '', remark: '' as 'Pass' | 'Fail' | '' });
                            }
                            const fieldName = field.replace('MeasurementRow_', '');
                            if (fieldName === 'maApplied') measurementRows[rowIndex].maApplied = value;
                            if (fieldName === 'AverageOutput') measurementRows[rowIndex].averageOutput = value;
                            if (fieldName === 'mGyPerMAs') measurementRows[rowIndex].mGyPerMAs = value;
                            if (fieldName.startsWith('RadiationOutput')) {
                                const colIndex = parseInt(fieldName.replace('RadiationOutput', '')) - 1;
                                while (measurementRows[rowIndex].radiationOutputs.length <= colIndex) {
                                    measurementRows[rowIndex].radiationOutputs.push('');
                                }
                                measurementRows[rowIndex].radiationOutputs[colIndex] = value;
                            }
                        }
                    });

                    const csvData = {
                        testConditions,
                        headers: headers.length > 0 ? headers : ['Meas 1', 'Meas 2', 'Meas 3'],
                        tolerance,
                        measurementRows: measurementRows.length > 0 ? measurementRows : [],
                    };
                    console.log('✓ Linearity of Time data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        linearityOfTime: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Linearity of Time:', error);
                    toast.error(`Failed to process Linearity of Time: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Tube Housing Leakage
            if (groupedData['Tube Housing Leakage'] && groupedData['Tube Housing Leakage'].length > 0) {
                try {
                    const data = groupedData['Tube Housing Leakage'];
                    const settings = { fcd: '', kv: '', ma: '', time: '' };
                    let workload = '';
                    let toleranceValue = '1';
                    let toleranceOperator = 'less than or equal to';
                    const leakageMeasurements: any[] = [];

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();
                        const rowIndex = parseInt(row['Row Index'] || '0');

                        if (field === 'Settings_FCD') settings.fcd = value;
                        if (field === 'Settings_kV') settings.kv = value;
                        if (field === 'Settings_ma') settings.ma = value;
                        if (field === 'Settings_Time') settings.time = value;
                        if (field === 'Workload') workload = value;
                        if (field === 'ToleranceValue') toleranceValue = value;
                        if (field === 'ToleranceOperator') toleranceOperator = value;

                        if (field.startsWith('LeakageMeasurement_')) {
                            while (leakageMeasurements.length <= rowIndex) {
                                leakageMeasurements.push({ location: '', left: '', right: '', front: '', back: '', top: '', remark: '' as 'Pass' | 'Fail' | '' });
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

                    const csvData = {
                        settings,
                        workload,
                        tolerance: { value: toleranceValue, operator: toleranceOperator },
                        leakageMeasurements: leakageMeasurements.length > 0 ? leakageMeasurements : [],
                    };
                    console.log('✓ Tube Housing Leakage data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        tubeHousingLeakage: csvData
                    }));
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
                                locations.push({ location: '', mRPerHr: '', category: '' });
                            }
                            const fieldName = field.replace('Location_', '');
                            if (fieldName === 'Location') locations[rowIndex].location = value;
                            if (fieldName === 'mRPerHr') locations[rowIndex].mRPerHr = value;
                            if (fieldName === 'Category') locations[rowIndex].category = value;
                        }
                    });

                    const csvData = {
                        surveyDate,
                        hasValidCalibration,
                        appliedCurrent,
                        appliedVoltage,
                        exposureTime,
                        workload,
                        locations: locations.length > 0 ? locations : [],
                    };
                    console.log('✓ Radiation Protection Survey data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        radiationProtection: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Radiation Protection Survey:', error);
                    toast.error(`Failed to process Radiation Protection Survey: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process High Contrast Sensitivity
            if (groupedData['High Contrast Sensitivity'] && groupedData['High Contrast Sensitivity'].length > 0) {
                try {
                    const data = groupedData['High Contrast Sensitivity'];
                    let measuredLpPerMm = '';
                    let recommendedStandard = '';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();

                        if (field === 'MeasuredLpPerMm') measuredLpPerMm = value;
                        if (field === 'RecommendedStandard') recommendedStandard = value;
                    });

                    const csvData = {
                        measuredLpPerMm,
                        recommendedStandard,
                    };
                    console.log('✓ High Contrast Sensitivity data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        highContrastSensitivity: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing High Contrast Sensitivity:', error);
                    toast.error(`Failed to process High Contrast Sensitivity: ${error?.message || 'Unknown error'}`);
                }
            }

            // Process Low Contrast Sensitivity
            if (groupedData['Low Contrast Sensitivity'] && groupedData['Low Contrast Sensitivity'].length > 0) {
                try {
                    const data = groupedData['Low Contrast Sensitivity'];
                    let smallestHoleSize = '';
                    let recommendedStandard = '';

                    data.forEach((row) => {
                        const field = (row['Field Name'] || '').trim();
                        const value = (row['Value'] || '').trim();

                        if (field === 'SmallestHoleSize') smallestHoleSize = value;
                        if (field === 'RecommendedStandard') recommendedStandard = value;
                    });

                    const csvData = {
                        smallestHoleSize,
                        recommendedStandard,
                    };
                    console.log('✓ Low Contrast Sensitivity data prepared for form:', csvData);
                    setCsvDataForComponents(prev => ({
                        ...prev,
                        lowContrastSensitivity: csvData
                    }));
                } catch (error: any) {
                    console.error('Error processing Low Contrast Sensitivity:', error);
                    toast.error(`Failed to process Low Contrast Sensitivity: ${error?.message || 'Unknown error'}`);
                }
            }

            const processedTests = Object.keys(groupedData).filter(key => groupedData[key].length > 0);
            console.log(`Processed ${processedTests.length} test(s) from CSV`);
            
            if (processedTests.length > 0) {
                toast.success(`CSV data loaded successfully! ${processedTests.length} test(s) filled. Please review and save manually.`);
                
                // Force refresh of all test components to load the CSV data
                // Use setTimeout to ensure all state updates are batched first
                setTimeout(() => {
                    const newKey = Date.now();
                    console.log('Setting refreshKey to:', newKey);
                    setRefreshKey(newKey);
                }, 50);
            } else {
                toast.error('No test data found in CSV file. Please check the format.');
            }
        } catch (error: any) {
            console.error('Error processing CSV:', error);
            toast.error(error?.message || 'Failed to process CSV data');
        } finally {
            setCsvUploading(false);
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
                
                const response = await fetch(csvFileUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
                }

                const text = await response.text();
                const csvData = parseCSV(text);
                
                if (csvData.length > 0) {
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

    const handleSaveHeader = async () => {
        setSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
            const payload = {
                ...formData,
                toolsUsed: originalTools.map((t: any) => ({
                    toolId: t._id || t.toolId || null,
                    SrNo: t.SrNo,
                    nomenclature: t.nomenclature,
                    make: t.manufacturer || t.make,
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

    // Load report header and test IDs
    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForOBI(serviceId);
                if (res?.exists && res?.data) {
                    // Save test IDs
                    const testIds = {
                        AlignmentTestOBI: res.data.AlignmentTestOBI?._id || res.data.AlignmentTestOBI,
                        accuracyOfOperatingPotentialOBI: res.data.accuracyOfOperatingPotentialOBI?._id || res.data.accuracyOfOperatingPotentialOBI,
                        TimerTestOBI: res.data.TimerTestOBI?._id || res.data.TimerTestOBI,
                        OutputConsistencyOBI: res.data.OutputConsistencyOBI?._id || res.data.OutputConsistencyOBI,
                        CentralBeamAlignmentOBI: res.data.CentralBeamAlignmentOBI?._id || res.data.CentralBeamAlignmentOBI,
                        CongruenceOfRadiationOBI: res.data.CongruenceOfRadiationOBI?._id || res.data.CongruenceOfRadiationOBI,
                        EffectiveFocalSpotOBI: res.data.EffectiveFocalSpotOBI?._id || res.data.EffectiveFocalSpotOBI,
                        LinearityOfMasLoadingStationsOBI: res.data.LinearityOfMasLoadingStationsOBI?._id || res.data.LinearityOfMasLoadingStationsOBI,
                        LinearityOfTimeOBI: res.data.LinearityOfTimeOBI?._id || res.data.LinearityOfTimeOBI,
                        TubeHousingLeakageOBI: res.data.TubeHousingLeakageOBI?._id || res.data.TubeHousingLeakageOBI,
                        RadiationProtectionSurveyOBI: res.data.RadiationProtectionSurveyOBI?._id || res.data.RadiationProtectionSurveyOBI,
                    };
                    setSavedTestIds(testIds);
                }
            } catch (err) {
                console.log("No report header found or failed to load:", err);
            }
        };
        loadReportHeader();
    }, [serviceId]);

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
                        Does this On-Board Imaging (OBI) unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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
                    Generate On-Board Imaging (OBI) QA Test Report
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
                        <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} readOnly className="w-full border rounded-md px-3 py-2 bg-gray-100" />
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
                    onClick={() => navigate(`/admin/orders/view-service-report-obi?serviceId=${serviceId}`)}
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
                        title: "Congruence Of Radiation",
                        component: <CongruenceOfRadiation
                            key={`congruence-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.CongruenceOfRadiationOBI || undefined}
                            onTestSaved={() => { }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.congruenceOfRadiation}
                        />
                    },
                    {
                        title: "Central Beam Alignment",
                        component: <CentralBeamAlignment
                            key={`central-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.CentralBeamAlignmentOBI || undefined}
                            onTestSaved={() => { }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.centralBeamAlignment}
                        />
                    },
                    {
                        title: "Effective Focal Spot",
                        component: <EffectiveFocalSpot
                            key={`focal-spot-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.EffectiveFocalSpotOBI || undefined}
                            onTestSaved={() => { }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.effectiveFocalSpot}
                        />
                    },

                    // Timer Test — Only if user said YES
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Timer Test",
                                component: <TimerTest
                                    key={`timer-${refreshKey}`}
                                    serviceId={serviceId}
                                    refreshKey={refreshKey}
                                    initialData={csvDataForComponents.timerTest}
                                />,
                            },
                        ]
                        : []),
                    {
                        title: "Accuracy Of Operating Potential",
                        component: <AccuracyOfOperatingPotential
                            key={`accuracy-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.accuracyOfOperatingPotentialOBI || undefined}
                            onRefresh={() => { }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.accuracyOfOperatingPotential}
                        />
                    },

                    {
                        title: "Output Consistency",
                        component: <OutputConsistency
                            key={`output-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.OutputConsistencyOBI || undefined}
                            onTestSaved={() => { }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.outputConsistency}
                        />
                    },
                    {
                        title: "High Contrast Sensitivity",
                        component: <HighContrastSensitivity
                            key={`high-contrast-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.HighContrastSensitivityOBI || undefined}
                            onTestSaved={(id) => {
                                setSavedTestIds(prev => ({ ...prev, HighContrastSensitivityOBI: id }));
                            }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.highContrastSensitivity}
                        />
                    },
                    {
                        title: "Low Contrast Sensitivity",
                        component: <LowContrastSensitivity
                            key={`low-contrast-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.LowContrastSensitivityOBI || undefined}
                            onTestSaved={(id) => {
                                setSavedTestIds(prev => ({ ...prev, LowContrastSensitivityOBI: id }));
                            }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.lowContrastSensitivity}
                        />
                    },
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Linearity Of Time",
                                component: <LinearityOfTime
                                    key={`linearity-time-${refreshKey}`}
                                    serviceId={serviceId}
                                    testId={savedTestIds.LinearityOfTimeOBI || undefined}
                                    onRefresh={() => { }}
                                    refreshKey={refreshKey}
                                    initialData={csvDataForComponents.linearityOfTime}
                                />,
                            },
                        ]
                        : hasTimer === false
                            ? [
                                {
                                    title: "Linearity Of mAs Loading Stations",
                                    component: <LinearityOfMasLoadingStation
                                        key={`linearity-mas-${refreshKey}`}
                                        serviceId={serviceId}
                                        testId={savedTestIds.LinearityOfMasLoadingStationsOBI || undefined}
                                        onRefresh={() => { }}
                                        refreshKey={refreshKey}
                                        initialData={csvDataForComponents.linearityOfMasLoading}
                                    />,
                                },
                            ]
                            : []),

                    // Linearity Test — Conditional

                    {
                        title: "Tube Housing Leakage",
                        component: <TubeHousingLeakage
                            key={`tube-leakage-${refreshKey}`}
                            serviceId={serviceId}
                            testId={savedTestIds.TubeHousingLeakageOBI || undefined}
                            onRefresh={() => { }}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.tubeHousingLeakage}
                        />
                    },
                    {
                        title: "Radiation Protection Survey",
                        component: <RadiationProtection
                            key={`radiation-protection-${refreshKey}`}
                            serviceId={serviceId}
                            refreshKey={refreshKey}
                            initialData={csvDataForComponents.radiationProtection}
                        />
                    },
                    {
                        title: "Alignment Test",
                        component: <AlignmentTest
                            serviceId={serviceId}
                            testId={savedTestIds.AlignmentTestOBI || undefined}
                            onRefresh={() => { }}
                        />
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

export default OBI;
