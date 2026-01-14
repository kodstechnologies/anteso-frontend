// GenerateReport-CTScan.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
    getRadiationProfileWidthByServiceIdForCTScan,
    saveReportHeader,
    getReportHeaderForCTScan,
    proxyFile,
    getMeasurementOfOperatingPotentialByServiceId,
    getMeasurementOfMaLinearityByServiceId,
    getTimerAccuracyByServiceId,
    getLinearityOfMasLoadingByServiceIdForCTScan,
    getMeasurementOfCTDIByServiceId,
    getTotalFilterationByServiceId,
    getRadiationLeakageByServiceId,
    getOutputConsistencyByServiceId,
    getLowContrastResolutionByServiceIdForCTScan,
    getHighContrastResolutionByServiceIdForCTScan,
    getRadiationProtectionSurveyByServiceIdForCTScan,
    getAlignmentOfTableGantryByServiceIdForCTScan,
    getTablePositionByServiceIdForCTScan,
    getGantryTiltByServiceIdForCTScan,
} from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";
import { createCTScanUploadableExcel, CTScanExportData } from "./exportCTScanToExcel";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import RadiationProfileWidth from "./RadiationProfileWidth";
import MeasurementOfMaLinearity from "./measurementOfMaLinearity";
import TimerAccuracy from "./TimerAccuracy";
import MeasurementOfOperatingPotential from "../MeasurementOfOperatingPotential";
import MeasurementOfCTDI from "./MeasurementOfCTDI";
import TotalFilterationForCTScan from "./TotalFilterationForCTScan";
import RadiationLeakageLeveFromXRayTube from "./RadiationLeakageLevelFromX-RayTubeHouse";
import MeasureMaxRadiationLevel from "./MeasureMaxRadiationLevel";
import ConsisitencyOfRadiationOutput from "./OutputConsistency";
import HighContrastResolutionForCTScan from "./HighContrastResolutionForCTScan";
import LowContrastResolutionForCT from "./LowContrastResolutionForCTScan";
// import MeasureMaxRadiationLevel from "./MeasureMaxRadiationLevel";
import DetailsOfRadiationProtection from "./DetailsOfRadiationProtection";
import LinearityOfMasLoading from "./LinearityOfMasLoading";
import AlignmentOfTableGantry from "./AlignmentOfTableGantry";
import TablePosition from "./TablePosition";
import GantryTilt from "./GantryTilt";
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

const CTScanReport: React.FC<{ serviceId: string; qaTestDate?: string | null; createdAt?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, createdAt, csvFileUrl }) => {
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
    const [showTubeModal, setShowTubeModal] = useState(true); // Show tube selection modal first
    const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
    const [tubeType, setTubeType] = useState<'single' | 'double' | null>(null); // null = not selected yet
    const [savedTestIds, setSavedTestIds] = useState<{
        LinearityOfMasLoadingCTScan?: string;
    }>({});

    // State to store CSV data for components
    const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
    const [csvDataVersion, setCsvDataVersion] = useState(0); // Track CSV data updates to force re-render
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render of child components

    // Helper function to add years to a date
    const addYearsToDate = (dateStr: string, years: number): string => {
        if (!dateStr) return "";
        const base = dateStr.split("T")[0];
        const d = new Date(base);
        if (Number.isNaN(d.getTime())) return base;
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split("T")[0];
    };

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
                const firstTest = data.qaTests[0];

                setDetails(data);

                // Calculate dates
                const srfDateValue = createdAt ? (new Date(createdAt).toISOString().split("T")[0]) :
                    (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");

                const rawTestDate = qaTestDate || firstTest?.createdAt || "";
                const testDateValue = rawTestDate ? rawTestDate.split("T")[0] : "";
                const testDueDateValue = testDateValue ? addYearsToDate(testDateValue, 2) : "";

                // Pre-fill form from service details
                setFormData({
                    customerName: data.hospitalName,
                    address: data.hospitalAddress,
                    srfNumber: data.srfNumber,
                    srfDate: srfDateValue,
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
                    testDate: testDateValue,
                    testDueDate: testDueDateValue,
                    location: data.hospitalAddress,
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
                    // uncertainity: "",
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
                notes: [
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
        let headers: string[] = [];
        let isReadingTest = false;

        const testMarkerToInternalName: { [key: string]: string } = {
            'RADIATION PROFILE WIDTH FOR CT SCAN': 'Radiation Profile Width',
            'MEASUREMENT OF OPERATING POTENTIAL': 'Measurement of Operating Potential',
            'MEASUREMENT OF MA LINEARITY': 'Measurement of mA Linearity',
            'TIMER ACCURACY': 'Timer Accuracy',
            'LINEARITY OF MAS LOADING': 'Linearity of mAs Loading',
            'MEASUREMENT OF CTDI': 'Measurement of CTDI',
            'TOTAL FILTRATION': 'Total Filtration',
            'RADIATION LEAKAGE LEVEL': 'Radiation Leakage Level',
            'Radiation Leakage Level from X-Ray Tube House': 'Radiation Leakage Level',
            'OUTPUT CONSISTENCY': 'Output Consistency',
            'Reproducibility of Radiation Output (Consistency Test)': 'Output Consistency',
            'LOW CONTRAST RESOLUTION': 'Low Contrast Resolution',
            'HIGH CONTRAST RESOLUTION': 'High Contrast Resolution',
            'ALIGNMENT OF TABLE/GANTRY': 'Alignment of Table/Gantry',
            'TABLE POSITION': 'Table Position',
            'GANTRY TILT': 'Gantry Tilt',
            'MAXIMUM RADIATION LEVEL': 'Maximum Radiation Level',
        };

        const headerMap: { [test: string]: { [header: string]: string } } = {
            'Radiation Profile Width': {
                'Applied': 'Table2_Applied', 'Measured': 'Table2_Measured', 'kVp': 'Table1_kvp', 'mA': 'Table1_ma'
            },
            'Measurement of Operating Potential': {
                'Set kV': 'Table2_SetKV', '@ mA 10': 'Table2_ma10', '@ mA 100': 'Table2_ma100', '@ mA 200': 'Table2_ma200',
                'Time (ms)': 'Table1_Time', 'Slice Thickness (mm)': 'Table1_SliceThickness',
                'Tol Value': 'Tolerance_Value', 'Tol Type': 'Tolerance_Type', 'Tol Sign': 'Tolerance_Sign',
                'Tol kV': 'Tolerance_Value'
            },
            'Measurement of mA Linearity': {
                'kVp': 'Table1_kvp', 'Slice Thickness (mm)': 'Table1_SliceThickness', 'Time (ms)': 'Table1_Time',
                'mA Applied': 'Table2_mAsApplied', 'Meas 1': 'Table2_Result_0', 'Meas 2': 'Table2_Result_1', 'Meas 3': 'Table2_Result_2', 'Meas 4': 'Table2_Result_3', 'Meas 5': 'Table2_Result_4'
            },
            'Timer Accuracy': {
                'kVp': 'Table1_kvp', 'Slice Thickness (mm)': 'Table1_SliceThickness', 'mA': 'Table1_ma',
                'Set Time (ms)': 'Table2_SetTime', 'Observed Time (ms)': 'Table2_Result', 'Tolerance (%)': 'Tolerance'
            },
            'Linearity of mAs Loading': {
                'mAs Range': 'Table2_mAsRange', 'Result': 'Table2_Result', 'FCD': 'ExposureCondition_FCD', 'kV': 'ExposureCondition_kV', 'Tolerance': 'Tolerance'
            },
            'Measurement of CTDI': {
                'kVp': 'Table1_kvp', 'mAs': 'Table1_ma', 'Slice Thickness (mm)': 'Table1_SliceThickness',
                'CTDIw (Rated) Head': 'Table2_RatedHead', 'CTDIw (Rated) Body': 'Table2_RatedBody',
                'Tol Value': 'Tolerance', 'Type': 'Table2_Type', 'Label': 'Table2_Label', 'Head': 'Table2_Head', 'Body': 'Table2_Body'
            },
            'Radiation Leakage Level': {
                'kV': 'Table1_kvp', 'mA': 'Table1_ma', 'Time (sec)': 'Table1_Time',
                'Workload': 'Workload', 'Workload Unit': 'WorkloadUnit', 'Tol Value': 'Tolerance',
                'Tol Operator': 'ToleranceOperator', 'Tol Time': 'ToleranceTime',
                'Location': 'Table2_Area', 'Front': 'Table2_Front', 'Back': 'Table2_Back', 'Left': 'Table2_Left', 'Right': 'Table2_Right'
            },
            'Output Consistency': {
                'mAs': 'TestConditions_mAs', 'Slice Thickness (mm)': 'TestConditions_SliceThickness', 'Time (s)': 'TestConditions_Time',
                'kVp': 'OutputRow_kvp', 'Meas 1': 'Result_0', 'Meas 2': 'Result_1', 'Meas 3': 'Result_2', 'Meas 4': 'Result_3', 'Meas 5': 'Result_4', 'COV': 'COV', 'Tolerance': 'Tolerance',
                'Result': 'Result'
            },
            'Total Filtration': {
                'Applied KV': 'Table1_kvp', 'Applied MA': 'Table1_ma', 'Time': 'Table1_Time', 'Slice Thickness': 'Table1_SliceThickness', 'Measured TF': 'Table2_Result'
            },
            'Low Contrast Resolution': {
                'Observed Size': 'Table2_Result', 'Contrast Level': 'Table2_Contrast',
                'kVp': 'Table1_kvp', 'mA': 'Table1_ma', 'Slice Thickness': 'Table1_SliceThickness', 'WW': 'Table1_WW'
            },
            'High Contrast Resolution': {
                'Observed Size': 'Table2_Result', 'Contrast Difference': 'Table2_Contrast',
                'kVp': 'Table1_kvp', 'mAs': 'Table1_mAs', 'Slice Thickness': 'Table1_SliceThickness', 'WW': 'Table1_WW'
            },
            'Alignment of Table/Gantry': {
                'Result': 'Table1_Result', 'Tolerance': 'Tolerance'
            },
            'Table Position': {
                'Table Position': 'Table3_TablePosition', 'Expected': 'Table3_Expected', 'Measured': 'Table3_Measured',
                'Initial Pos': 'Table1_InitialTablePosition', 'Load': 'Table1_LoadOnCouch',
                'kVp': 'Table2_kvp', 'mA': 'Table2_ma', 'Slice Thickness': 'Table2_SliceThickness'
            },
            'Gantry Tilt': {
                'Type': 'Table_Type', 'Name/Actual': 'Table_NameActual', 'Value/Measured': 'Table_ValueMeasured'
            },
            'Maximum Radiation Level': {
                'Location': 'Table2_Location', 'mR/hr': 'Table2_Result', 'Category': 'Table2_Category', 'Date': 'SurveyDate', 'Calibrated': 'HasValidCalibration', 'mA': 'AppliedCurrent', 'kV': 'AppliedVoltage', 'Time': 'ExposureTime', 'Workload': 'Workload'
            }
        };

        const sectionRowCounter: { [key: string]: number } = {};

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].map(c => String(c || '').trim());
            const firstCell = row[0];

            if (firstCell.startsWith('TEST: ')) {
                const testTitle = firstCell.replace('TEST: ', '').trim();
                currentTestName = testMarkerToInternalName[testTitle] || '';
                isReadingTest = true;
                headers = [];
                sectionRowCounter[currentTestName] = 0;
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

            if (isReadingTest && currentTestName && headers.length > 0) {
                sectionRowCounter[currentTestName]++;
                const rowIdx = sectionRowCounter[currentTestName];
                row.forEach((value, cellIdx) => {
                    const header = headers[cellIdx];
                    const internalField = (headerMap[currentTestName] || {})[header];
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
        return data;
    };

    const parseCSV = (text: string): any[] => {
        const lines = text.split('\n').map(line => line.split(',').map(c => c.trim()));
        // If it looks like the old vertical format, handle it specifically or just use horizontal parser
        // For simplicity and since user wants horizontal now, we use horizontal parser
        return parseHorizontalData(lines);
    };

    const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        return parseHorizontalData(jsonData);
    };

    // Process CSV data and fill test tables
    const processCSVData = async (csvData: any[]) => {
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

            console.log('CT Scan CSV Data grouped:', groupedData);

            // Process each test section
            // Note: This is a simplified version - you'll need to implement full processing for each test component
            // Similar to how FixedRadioFluro does it

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

    // Fetch and process CSV/Excel file from URL (passed from ServiceDetails2)
    useEffect(() => {
        const fetchAndProcessFile = async () => {
            if (!csvFileUrl) {
                console.log('CT Scan: No csvFileUrl provided, skipping file fetch');
                return;
            }

            console.log('CT Scan: Fetching file from URL:', csvFileUrl);

            try {
                setCsvUploading(true);

                const urlLower = csvFileUrl.toLowerCase();
                const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

                let csvData: any[] = [];

                if (isExcel) {
                    console.log('CT Scan: Detected Excel file, fetching through proxy...');
                    toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const arrayBuffer = await response.data.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                    console.log('CT Scan: Excel file parsed, sheets:', workbook.SheetNames);

                    csvData = parseExcelToCSVFormat(workbook);
                    console.log('CT Scan: Converted Excel to CSV format, rows:', csvData.length);
                } else {
                    console.log('CT Scan: Detected CSV file, fetching through proxy...');
                    toast.loading('Loading CSV data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const text = await response.data.text();
                    console.log('CT Scan: CSV file fetched, length:', text.length);

                    csvData = parseCSV(text);
                }

                console.log('CT Scan: Processed CSV data, total rows:', csvData.length);
                await processCSVData(csvData);
                toast.success('File loaded successfully!', { id: 'csv-loading' });
            } catch (error: any) {
                console.error('CT Scan: Error fetching/processing file:', error);
                toast.error('Failed to load file: ' + (error.message || 'Unknown error'), { id: 'csv-loading' });
            } finally {
                setCsvUploading(false);
            }
        };

        fetchAndProcessFile();
    }, [csvFileUrl]);

    // Export saved data to Excel with proper table structures
    const handleExportToExcel = async () => {
        if (!serviceId) {
            toast.error('Service ID is missing');
            return;
        }

        try {
            toast.loading('Exporting data to Excel...', { id: 'export-excel' });
            setCsvUploading(true);

            const tubeId = tubeType === 'single' ? null : 'A'; // For single tube, use null

            // Collect all test data in proper structure
            const exportData: CTScanExportData = {};

            // 1. Radiation Profile Width
            try {
                const rpwData = await getRadiationProfileWidthByServiceIdForCTScan(serviceId, tubeId);
                if (rpwData) {
                    exportData.radiationProfileWidth = rpwData;
                }
            } catch (err) {
                console.log('Radiation Profile Width not found or error:', err);
            }

            // 2. Measurement of Operating Potential
            try {
                const mopData = await getMeasurementOfOperatingPotentialByServiceId(serviceId, tubeId);
                if (mopData) {
                    exportData.measurementOfOperatingPotential = mopData;
                }
            } catch (err) {
                console.log('Measurement of Operating Potential not found or error:', err);
            }

            // 3. Measurement of mA Linearity (if hasTimer === true)
            if (hasTimer === true) {
                try {
                    const malData = await getMeasurementOfMaLinearityByServiceId(serviceId, tubeId);
                    if (malData) {
                        exportData.measurementOfMaLinearity = malData;
                    }
                } catch (err) {
                    console.log('Measurement of mA Linearity not found or error:', err);
                }

                // 4. Timer Accuracy
                try {
                    const taData = await getTimerAccuracyByServiceId(serviceId, tubeId);
                    if (taData) {
                        exportData.timerAccuracy = taData;
                    }
                } catch (err) {
                    console.log('Timer Accuracy not found or error:', err);
                }
            } else if (hasTimer === false) {
                // 5. Linearity of mAs Loading
                try {
                    const masData = await getLinearityOfMasLoadingByServiceIdForCTScan(serviceId, tubeId);
                    if (masData) {
                        exportData.linearityOfMasLoading = masData;
                    }
                } catch (err) {
                    console.log('Linearity of mAs Loading not found or error:', err);
                }
            }

            // 6. Measurement of CTDI
            try {
                const ctdiData = await getMeasurementOfCTDIByServiceId(serviceId, tubeId);
                if (ctdiData) {
                    exportData.measurementOfCTDI = ctdiData;
                }
            } catch (err) {
                console.log('Measurement of CTDI not found or error:', err);
            }

            // 7. Total Filtration
            try {
                const tfData = await getTotalFilterationByServiceId(serviceId, tubeId);
                if (tfData && tfData.rows?.[0]) {
                    exportData.totalFiltration = tfData;
                }
            } catch (err) {
                console.log('Total Filtration not found or error:', err);
            }

            // 8. Radiation Leakage Level
            try {
                const rlData = await getRadiationLeakageByServiceId(serviceId, tubeId);
                if (rlData) {
                    exportData.radiationLeakage = rlData;
                }
            } catch (err) {
                console.log('Radiation Leakage Level not found or error:', err);
            }

            // 9. Output Consistency
            try {
                const ocData = await getOutputConsistencyByServiceId(serviceId, tubeId);
                if (ocData) {
                    exportData.outputConsistency = ocData;
                }
            } catch (err) {
                console.log('Output Consistency not found or error:', err);
            }

            // 10. Low Contrast Resolution
            try {
                const lcrData = await getLowContrastResolutionByServiceIdForCTScan(serviceId, tubeId);
                if (lcrData) {
                    exportData.lowContrastResolution = lcrData;
                }
            } catch (err) {
                console.log('Low Contrast Resolution not found or error:', err);
            }

            // 11. High Contrast Resolution
            try {
                const hcrData = await getHighContrastResolutionByServiceIdForCTScan(serviceId, tubeId);
                if (hcrData) {
                    exportData.highContrastResolution = hcrData;
                }
            } catch (err) {
                console.log('High Contrast Resolution not found or error:', err);
            }

            // 12. Maximum Radiation Level (Radiation Protection Survey)
            try {
                const rpsRes = await getRadiationProtectionSurveyByServiceIdForCTScan(serviceId, tubeId);
                const rpsData = rpsRes?.data || rpsRes; // Handle both response object and direct data
                if (rpsData) {
                    exportData.radiationProtectionSurvey = rpsData;
                }
            } catch (err) {
                console.log('Radiation Protection Survey not found or error:', err);
            }

            // 13. Alignment of Table/Gantry
            try {
                const alignmentRes = await getAlignmentOfTableGantryByServiceIdForCTScan(serviceId);
                const alignmentData = alignmentRes?.data || alignmentRes;
                if (alignmentData) {
                    exportData.alignmentTableGantry = alignmentData;
                }
            } catch (err) {
                console.log('Alignment of Table/Gantry not found or error:', err);
            }

            // 14. Table Position
            try {
                const tablePosRes = await getTablePositionByServiceIdForCTScan(serviceId);
                const tablePosData = tablePosRes?.data || tablePosRes;
                if (tablePosData) {
                    exportData.tablePosition = tablePosData;
                }
            } catch (err) {
                console.log('Table Position not found or error:', err);
            }

            // 15. Gantry Tilt
            try {
                const gantryTiltRes = await getGantryTiltByServiceIdForCTScan(serviceId);
                const gantryTiltData = gantryTiltRes?.data || gantryTiltRes;
                if (gantryTiltData) {
                    exportData.gantryTilt = gantryTiltData;
                }
            } catch (err) {
                console.log('Gantry Tilt not found or error:', err);
            }

            // Check if we have any data
            const hasData = Object.keys(exportData).length > 0;
            if (!hasData) {
                toast.error('No data found to export. Please save test data first.', { id: 'export-excel' });
                return;
            }

            // Create Excel with proper table structures
            const wb = createCTScanUploadableExcel(exportData, hasTimer === true);

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `CTScan_Test_Data_${timestamp}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);
            toast.success('Data exported successfully!', { id: 'export-excel' });
        } catch (error: any) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export data: ' + (error.message || 'Unknown error'), { id: 'export-excel' });
        } finally {
            setCsvUploading(false);
        }
    };

    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForCTScan(serviceId);
                if (res?.exists && res?.data) {
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
                        testDueDate: res.data.testDueDate || prev.testDueDate,
                        location: res.data.location || prev.location,
                        temperature: res.data.temperature || prev.temperature,
                        humidity: res.data.humidity || prev.humidity,
                        engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
                    }));
                }
            } catch (err) {
                console.log("No report header found or failed to load:", err);
            }
        };
        loadReportHeader();
    }, [serviceId]);

    // Handle tube type selection - show timer modal after selection
    const handleTubeTypeSelection = (type: 'single' | 'double') => {
        setTubeType(type);
        setShowTubeModal(false);
        // Save tube type to localStorage
        localStorage.setItem(`ctscan_tube_type_${serviceId}`, type);

        // Always show timer modal after tube type selection
        // Load saved choice if exists, but still show modal to confirm/change
        const savedChoice = localStorage.getItem(`ctscan_timer_choice_${serviceId}`);
        if (savedChoice !== null) {
            setHasTimer(JSON.parse(savedChoice));
        }
        // Always show timer modal after tube selection
        setShowTimerModal(true);
    };

    // Close modal and set timer choice
    const handleTimerChoice = (choice: boolean) => {
        setHasTimer(choice);
        setShowTimerModal(false);
        // Persist choice in localStorage
        localStorage.setItem(`ctscan_timer_choice_${serviceId}`, JSON.stringify(choice));
    };

    // Load saved tube type on mount (if exists)
    useEffect(() => {
        if (!serviceId) return;

        // Load saved tube type
        const savedTubeType = localStorage.getItem(`ctscan_tube_type_${serviceId}`);
        if (savedTubeType === 'single' || savedTubeType === 'double') {
            setTubeType(savedTubeType as 'single' | 'double');
            setShowTubeModal(false);
            // Load saved timer choice if exists
            const savedChoice = localStorage.getItem(`ctscan_timer_choice_${serviceId}`);
            if (savedChoice !== null) {
                setHasTimer(JSON.parse(savedChoice));
            }
            // Always show timer modal when tube type is loaded from storage
            setShowTimerModal(true);
        } else {
            // No saved tube type, show tube selection modal first
            setShowTubeModal(true);
        }
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

    // TUBE TYPE SELECTION MODAL - Show first
    if (showTubeModal) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Tube Configuration</h3>
                    <p className="text-gray-600 mb-8">
                        Please select the tube configuration for this CT Scan:
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
                            Double Tube (Tube A & Tube B)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // TIMER TEST AVAILABILITY MODAL - Show after tube type selection
    if (showTimerModal && tubeType && hasTimer === null) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
                    <p className="text-gray-600 mb-8">
                        Does this CT Scan unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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

    // Don't show tests until tube type is selected and timer choice is made
    if (!tubeType || hasTimer === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl font-medium text-gray-700">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                Generate CT-Scan QA Test Report
            </h1>

            {/* Customer Info */}
            <section className="mb-10 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-700 mb-4">1. Name and Address of Customer</h2>
                <div className="grid md:grid-cols-1 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Customer Name</label>
                        <textarea
                            name="customerName"
                            value={formData.customerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                            readOnly
                            rows={2}
                            className="w-full border rounded-md px-3 py-2 bg-gray-100 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            readOnly
                            rows={3}
                            className="w-full border rounded-md px-3 py-2 bg-gray-100 resize-none"
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
                            {csvUploading ? 'Uploading...' : 'Upload CSV/Excel File'}
                        </label>
                        {/* <a
                            href={hasTimer === true
                                ? "/templates/CTScan_Test_Data_Template_WithTimer.csv"
                                : hasTimer === false
                                    ? "/templates/CTScan_Test_Data_Template_NoTimer.csv"
                                    : "#"
                            }
                            download
                            className={`px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition ${hasTimer === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => {
                                if (hasTimer === null) {
                                    e.preventDefault();
                                    toast.error('Please select timer availability first');
                                }
                            }}
                        >
                            Download Template
                        </a> */}
                        <button
                            onClick={handleExportToExcel}
                            disabled={csvUploading}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CloudArrowUpIcon className="w-5 h-5 rotate-180" />
                            {csvUploading ? 'Exporting...' : 'Export Saved Data to Excel'}
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
            <Notes allowDelete={false} />

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
                    onClick={() => navigate(`/admin/orders/view-service-report-ct-scan?serviceId=${serviceId}`)}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    View Generated Report
                </button>
            </div>

            {/* Tube Type Display - Show current selection */}
            {/* <section className="mb-10 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h2 className="text-xl font-semibold text-blue-700 mb-4">Tube Configuration</h2>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="tubeType"
                            checked={tubeType === 'single'}
                            readOnly
                            className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-lg font-medium text-gray-700">Single Tube</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="tubeType"
                            checked={tubeType === 'double'}
                            readOnly
                            className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-lg font-medium text-gray-700">Double Tube (Tube A & Tube B)</span>
                    </div>
                    <button
                        onClick={() => {
                            setShowTubeModal(true);
                            setShowTimerModal(false);
                            setHasTimer(null);
                        }}
                        className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                        Change Configuration
                    </button>
                </div>
                {tubeType && (
                    <p className="mt-4 text-sm text-gray-600">
                        Selected: <strong>{tubeType === 'single' ? 'Single Tube' : 'Double Tube (Tube A & Tube B)'}</strong>
                    </p>
                )}
            </section> */}

            {/* Test Tables */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
                {(tubeType === 'single' ? [
                    {
                        title: "Radiation Profile Width for CT Scan",
                        component: (
                            <RadiationProfileWidth
                                serviceId={serviceId}
                                testId={radiationProfileTest?._id || null}
                                tubeId={null}
                                onTestSaved={(id: any) => console.log("Radiation Profile saved:", id)}
                                csvData={csvDataForComponents['Radiation Profile Width']}
                            />
                        ),
                    },
                    { title: "Measurement of Operating Potential", component: <MeasurementOfOperatingPotential serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Measurement of Operating Potential']} /> },
                    ...(hasTimer === true ? [
                        { title: "Measurement of mA Linearity", component: <MeasurementOfMaLinearity serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Measurement of mA Linearity']} /> },
                        { title: "Timer Accuracy", component: <TimerAccuracy serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Timer Accuracy']} /> },
                    ] : hasTimer === false ? [
                        { title: "Linearity of mAs Loading", component: <LinearityOfMasLoading serviceId={serviceId} testId={savedTestIds.LinearityOfMasLoadingCTScan || null} tubeId={null} onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfMasLoadingCTScan: id }))} csvData={csvDataForComponents['Linearity of mAs Loading']} /> },
                    ] : []),
                    { title: "Measurement of CTDI", component: <MeasurementOfCTDI serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Measurement of CTDI']} /> },
                    { title: "Total Filtration", component: <TotalFilterationForCTScan serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Total Filtration']} /> },
                    { title: "Radiation Leakage Level", component: <RadiationLeakageLeveFromXRayTube serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Radiation Leakage Level']} /> },
                    { title: "Output Consistency", component: <ConsisitencyOfRadiationOutput serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Output Consistency']} /> },
                    { title: "Low Contrast Resolution", component: <LowContrastResolutionForCT serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Low Contrast Resolution']} /> },
                    { title: "High Contrast Resolution", component: <HighContrastResolutionForCTScan serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['High Contrast Resolution']} /> },
                    { title: "Alignment of Table/Gantry", component: <AlignmentOfTableGantry serviceId={serviceId} csvData={csvDataForComponents['Alignment of Table/Gantry']} /> },
                    { title: "Table Position", component: <TablePosition serviceId={serviceId} csvData={csvDataForComponents['Table Position']} /> },
                    { title: "Gantry Tilt", component: <GantryTilt serviceId={serviceId} csvData={csvDataForComponents['Gantry Tilt']} /> },
                    { title: "Maximum Radiation Level", component: <DetailsOfRadiationProtection serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Maximum Radiation Level']} /> },
                ] : [
                    // ===== TUBE A TESTS =====
                    {
                        title: "Radiation Profile Width for CT Scan - Tube A",
                        component: (
                            <RadiationProfileWidth
                                serviceId={serviceId}
                                tubeId="A"
                                onTestSaved={(id: any) => console.log("Radiation Profile Tube A saved:", id)}
                                csvData={csvDataForComponents['Radiation Profile Width']}
                            />
                        ),
                    },
                    { title: "Measurement of Operating Potential - Tube A", component: <MeasurementOfOperatingPotential serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Measurement of Operating Potential']} /> },
                    ...(hasTimer === true ? [
                        { title: "Measurement of mA Linearity - Tube A", component: <MeasurementOfMaLinearity serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Measurement of mA Linearity']} /> },
                        { title: "Timer Accuracy - Tube A", component: <TimerAccuracy serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Timer Accuracy']} /> },
                    ] : hasTimer === false ? [
                        { title: "Linearity of mAs Loading - Tube A", component: <LinearityOfMasLoading serviceId={serviceId} tubeId="A" onTestSaved={(id) => console.log("Tube A saved:", id)} csvData={csvDataForComponents['Linearity of mAs Loading']} /> },
                    ] : []),
                    { title: "Measurement of CTDI - Tube A", component: <MeasurementOfCTDI serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Measurement of CTDI']} /> },
                    { title: "Total Filtration - Tube A", component: <TotalFilterationForCTScan serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Total Filtration']} /> },
                    { title: "Radiation Leakage Level - Tube A", component: <RadiationLeakageLeveFromXRayTube serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Radiation Leakage Level']} /> },
                    { title: "Output Consistency - Tube A", component: <ConsisitencyOfRadiationOutput serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Output Consistency']} /> },
                    { title: "Low Contrast Resolution - Tube A", component: <LowContrastResolutionForCT serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['Low Contrast Resolution']} /> },
                    { title: "High Contrast Resolution - Tube A", component: <HighContrastResolutionForCTScan serviceId={serviceId} tubeId="A" csvData={csvDataForComponents['High Contrast Resolution']} /> },

                    // ===== TUBE B TESTS =====
                    {
                        title: "Radiation Profile Width for CT Scan - Tube B",
                        component: (
                            <RadiationProfileWidth
                                serviceId={serviceId}
                                tubeId="B"
                                onTestSaved={(id: any) => console.log("Radiation Profile Tube B saved:", id)}
                                csvData={csvDataForComponents['Radiation Profile Width']}
                            />
                        ),
                    },
                    { title: "Measurement of Operating Potential - Tube B", component: <MeasurementOfOperatingPotential serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Measurement of Operating Potential']} /> },
                    ...(hasTimer === true ? [
                        { title: "Measurement of mA Linearity - Tube B", component: <MeasurementOfMaLinearity serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Measurement of mA Linearity']} /> },
                        { title: "Timer Accuracy - Tube B", component: <TimerAccuracy serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Timer Accuracy']} /> },
                    ] : hasTimer === false ? [
                        { title: "Linearity of mAs Loading - Tube B", component: <LinearityOfMasLoading serviceId={serviceId} tubeId="B" onTestSaved={(id) => console.log("Tube B saved:", id)} csvData={csvDataForComponents['Linearity of mAs Loading']} /> },
                    ] : []),
                    { title: "Measurement of CTDI - Tube B", component: <MeasurementOfCTDI serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Measurement of CTDI']} /> },
                    { title: "Total Filtration - Tube B", component: <TotalFilterationForCTScan serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Total Filtration']} /> },
                    { title: "Radiation Leakage Level - Tube B", component: <RadiationLeakageLeveFromXRayTube serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Radiation Leakage Level']} /> },
                    { title: "Output Consistency - Tube B", component: <ConsisitencyOfRadiationOutput serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Output Consistency']} /> },
                    { title: "Low Contrast Resolution - Tube B", component: <LowContrastResolutionForCT serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['Low Contrast Resolution']} /> },
                    { title: "High Contrast Resolution - Tube B", component: <HighContrastResolutionForCTScan serviceId={serviceId} tubeId="B" csvData={csvDataForComponents['High Contrast Resolution']} /> },

                    // ===== COMMON TESTS (No Tube ID) =====
                    { title: "Radiation Protection Survey Report", component: <DetailsOfRadiationProtection serviceId={serviceId} tubeId={null} csvData={csvDataForComponents['Maximum Radiation Level']} /> },
                    { title: "Alignment of Table/Gantry", component: <AlignmentOfTableGantry serviceId={serviceId} csvData={csvDataForComponents['Alignment of Table/Gantry']} /> },
                    { title: "Table Position", component: <TablePosition serviceId={serviceId} csvData={csvDataForComponents['Table Position']} /> },
                    { title: "Gantry Tilt", component: <GantryTilt serviceId={serviceId} csvData={csvDataForComponents['Gantry Tilt']} /> },
                ] as any)
                    .map((item: any, i: number) => (
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

export default CTScanReport;