// GenerateReport-InventionalRadiology.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { getDetails, getTools, saveReportHeader, getReportHeaderForDentalIntra, proxyFile } from "../../../../../../api";

// Test-table imports
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
// import AccuracyOfOperatingPotentialAndTime from "./AccuracyOfOperatingPotentialAndTime";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
// import LinearityOfTime from "./LinearityOfTime";
import LinearityOfmALoading from "./LinearityOfmALoading";
import LinearityOfMasLoading from "./LinearityOfMasLoading";
// import ReproducibilityOfRadiationOutput from "./ReproducibilityOfRadiationOutput";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
// import TubeHousingLeakage from "./TubeHousingLeakage";
import RadiationLeakageLevel from "./RadiationLeakageLevel";
import DetailsOfRadiationProtection from "./DetailsOfRadiationProtection";

import { createDentalIntraUploadableExcel, DentalIntraExportData } from "./exportDentalIntraToExcel";
import {
    getAccuracyOfOperatingPotentialByServiceIdForDentalIntra,
    getAccuracyOfIrradiationTimeByServiceIdForDentalIntra,
    getLinearityOfMaLoadingByServiceIdForDentalIntra,
    getLinearityOfMasLoadingByServiceIdForDentalIntra,
    getConsistencyOfRadiationOutputByServiceIdForDentalIntra,
    getRadiationLeakageLevelByServiceIdForDentalIntra, // Used by RadiationLeakageLevel component
    getRadiationProtectionSurveyByServiceIdForDentalIntra
} from "../../../../../../api";


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

interface DentalProps {
    serviceId: string;
    qaTestDate?: string | null;
    csvFileUrl?: string | null;
}

const GenerateReportForDental: React.FC<DentalProps> = ({ serviceId, qaTestDate, csvFileUrl }) => {
    const navigate = useNavigate();

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [hasTimer, setHasTimer] = useState<boolean | null>(null);

    // State to store CSV data for components
    const [csvDataForComponents, setCsvDataForComponents] = useState<any>({});
    const [csvDataVersion, setCsvDataVersion] = useState(0);

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
    });

    const addYearsToDate = (dateStr: string, years: number): string => {
        if (!dateStr) return "";
        const base = dateStr.split("T")[0];
        const d = new Date(base);
        if (Number.isNaN(d.getTime())) return base;
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split("T")[0];
    };

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
                setDetails(data);

                // Pre-fill form from service details
                const firstTest = data.qaTests[0];

                const rawTestDate =
                    qaTestDate ||
                    firstTest?.createdAt ||
                    "";
                const baseTestDate = rawTestDate ? rawTestDate.split("T")[0] : "";
                const dueDate = baseTestDate ? addYearsToDate(baseTestDate, 5) : "";

                setFormData({
                    customerName: data.hospitalName,
                    address: data.hospitalAddress,
                    srfNumber: data.srfNumber,
                    srfDate: baseTestDate || "",
                    testReportNumber: firstTest?.qaTestReportNumber || "",
                    issueDate: new Date().toISOString().split("T")[0],
                    nomenclature: data.machineType,
                    make: "",
                    model: data.machineModel,
                    slNumber: data.serialNumber,
                    condition: "OK",
                    testingProcedureNumber: "",
                    pages: "",
                    testDate: baseTestDate,
                    testDueDate: dueDate,
                    location: data.hospitalAddress,
                    temperature: "",
                    humidity: "",
                    engineerNameRPId: data.engineerAssigned?.name || "",
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
    }, [serviceId, qaTestDate]);

    const formatDate = (iso: string) => iso.split("T")[0];
    const [savedTestIds, setSavedTestIds] = useState<Record<string, string>>({});

    // Helper to save testId when a test is saved
    const handleTestSaved = (testName: string, testId: string) => {
        setSavedTestIds(prev => ({
            ...prev,
            [testName]: testId
        }));
    };

    // Load report header and test IDs
    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForDentalIntra(serviceId);
                if (res?.exists && res?.data) {
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
                        condition: res.data.condition || prev.condition,
                        testingProcedureNumber: res.data.testingProcedureNumber || prev.testingProcedureNumber,
                        testDate: res.data.testDate || prev.testDate,
                        testDueDate: res.data.testDueDate || prev.testDueDate,
                        location: res.data.location || prev.location,
                        temperature: res.data.temperature || prev.temperature,
                        humidity: res.data.humidity || prev.humidity,
                        engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
                    }));

                    // Save test IDs
                    setSavedTestIds({
                        AccuracyOfOperatingPotentialDentalIntra: res.data.AccuracyOfOperatingPotentialDentalIntra?._id || res.data.AccuracyOfOperatingPotentialDentalIntra,
                        AccuracyOfIrradiationTimeDentalIntra: res.data.AccuracyOfIrradiationTimeDentalIntra?._id || res.data.AccuracyOfIrradiationTimeDentalIntra,
                        AccuracyOfOperatingPotentialAndTimeDentalIntra: res.data.AccuracyOfOperatingPotentialAndTimeDentalIntra?._id || res.data.AccuracyOfOperatingPotentialAndTimeDentalIntra,
                        LinearityOfTimeDentalIntra: res.data.LinearityOfTimeDentalIntra?._id || res.data.LinearityOfTimeDentalIntra,
                        LinearityOfMaLoadingDentalIntra: res.data.LinearityOfMaLoadingDentalIntra?._id || res.data.LinearityOfMaLoadingDentalIntra,
                        ConsistencyOfRadiationOutputDentalIntra: res.data.ConsistencyOfRadiationOutputDentalIntra?._id || res.data.ConsistencyOfRadiationOutputDentalIntra,
                        ReproducibilityOfRadiationOutputDentalIntra: res.data.ReproducibilityOfRadiationOutputDentalIntra?._id || res.data.ReproducibilityOfRadiationOutputDentalIntra,
                        RadiationLeakageLevelDentalIntra: res.data.RadiationLeakageLevelDentalIntra?._id || res.data.RadiationLeakageLevelDentalIntra,
                        TubeHousingLeakageDentalIntra: res.data.TubeHousingLeakageDentalIntra?._id || res.data.TubeHousingLeakageDentalIntra,
                    });

                    // If AccuracyOfIrradiationTimeDentalIntra exists, set hasTimer to true
                    if (res.data.AccuracyOfIrradiationTimeDentalIntra) {
                        setHasTimer(true);
                        setShowTimerModal(false);
                    } else {
                        const savedChoice = localStorage.getItem(`dental_intra_timer_choice_${serviceId}`);
                        if (savedChoice !== null) {
                            setHasTimer(JSON.parse(savedChoice));
                            setShowTimerModal(false);
                        } else {
                            setShowTimerModal(true);
                        }
                    }
                } else {
                    // No report header exists, check localStorage
                    const savedChoice = localStorage.getItem(`dental_intra_timer_choice_${serviceId}`);
                    if (savedChoice !== null) {
                        setHasTimer(JSON.parse(savedChoice));
                        setShowTimerModal(false);
                    } else {
                        setShowTimerModal(true);
                    }
                }
            } catch (err) {
                console.log("No report header found or failed to load:", err);
                // On error, check localStorage
                const savedChoice = localStorage.getItem(`dental_intra_timer_choice_${serviceId}`);
                if (savedChoice !== null) {
                    setHasTimer(JSON.parse(savedChoice));
                    setShowTimerModal(false);
                } else {
                    setShowTimerModal(true);
                }
            }
        };
        loadReportHeader();
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
                    toolId: t.certificate || null,
                    SrNo: t.SrNo,
                    nomenclature: t.nomenclature,
                    make: t.make,
                    model: t.model,
                    range: t.range,
                    calibrationCertificateNo: t.calibrationCertificateNo,
                    calibrationValidTill: t.calibrationValidTill,
                    certificate: t.certificate,
                    uncertainity: t.uncertainity || "",
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
            'ACCURACY OF OPERATING POTENTIAL': 'accuracyOfOperatingPotential',
            'ACCURACY OF IRRADIATION TIME': 'accuracyOfIrradiationTime',
            'TOTAL FILTRATION': 'accuracyOfOperatingPotential', // Maps to same component as OP usually, or handled there
            'LINEARITY OF TIME': 'LinearityOfTime',
            'LINEARITY OF mA LOADING': 'linearityOfMaLoading',
            'LINEARITY OF mAs LOADING': 'linearityOfMasLoading',
            'REPRODUCIBILITY OF RADIATION OUTPUT': 'consistencyOfRadiationOutput',
            'CONSISTENCY OF RADIATION OUTPUT': 'consistencyOfRadiationOutput',
            'TUBE HOUSING LEAKAGE': 'radiationLeakageLevel',
            'RADIATION LEAKAGE LEVEL': 'radiationLeakageLevel',
            'RADIATION PROTECTION SURVEY REPORT': 'radiationProtectionSurvey',
            'DETAILS OF RADIATION PROTECTION': 'radiationProtectionSurvey',
        };

        const headerMap: { [test: string]: { [header: string]: string } } = {
            'accuracyOfOperatingPotential': {
                'Applied kVp': 'Applied_kVp', 'applied kvp': 'Applied_kVp', 'Applied KVp': 'Applied_kVp',
                'mA Station 1 kVp': 'Measured_0', 'mA Station 2 kVp': 'Measured_1',
                'Measured 1': 'Measured', 'Measured 2': 'Required', // For Filtration
                'Measurement 1': 'Measured_0', 'Measurement 2': 'Measured_1', // Generic measurements
                'Measured (mm Al)': 'Measured',
                'Required (mm Al)': 'Required',
                'At kVp': 'atKvp',
                'kV': 'kV', 'kVp': 'kVp',
            },
            'accuracyOfIrradiationTime': {
                'Set Time (mSec)': 'Set_Time',
                'mA Station 1 Time': 'Measured_Time',
                'mA Station 2 Time': 'Measured_Time_ignore', // Component handles only one measured time per row currently
                'Measured Time (mSec)': 'Measured_Time',
                'kV': 'kV', 'kVp': 'kVp',
                'FCD': 'FCD', 'mA': 'mA',
            },
            'linearityOfMaLoading': {
                'mA Station': 'mA_Station',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2', 'Measured mR 4': 'Measured_3', 'Measured mR 5': 'Measured_4',
                'kV': 'kV', 'Time': 'time', 'FCD': 'FCD',
            },
            'linearityOfMasLoading': {
                'mAs Range': 'mAs_Range',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2', 'Measured mR 4': 'Measured_3', 'Measured mR 5': 'Measured_4',
                'kV': 'kV', 'FCD': 'FCD',
            },
            'LinearityOfTime': {
                'FCD': 'FCD', 'kV': 'kV', 'mA': 'mA',
                'Time Station (sec)': 'time',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2',
            },
            'consistencyOfRadiationOutput': {
                'FFD': 'FFD',
                'Test kV': 'kVp', 'Test mAs': 'mAs',
                'Meas 1': 'Measured_0', 'Meas 2': 'Measured_1', 'Meas 3': 'Measured_2', 'Meas 4': 'Measured_3', 'Meas 5': 'Measured_4',
            },
            'radiationLeakageLevel': {
                'Location': 'Table2_Area', 'Front': 'Table2_Front', 'Back': 'Table2_Back',
                'Left': 'Table2_Left', 'Right': 'Table2_Right', 'Top': 'Table2_Top',
                'Max Leakage': 'Table2_Max', 'Unit': 'Table2_Unit', 'Remark': 'Table2_Remark',
                'Distance': 'distance', 'kV': 'kV', 'mA': 'mA', 'Time': 'Time',
                'Workload': 'Workload', 'Workload Unit': 'WorkloadUnit',
                'Tolerance Value': 'ToleranceValue', 'Tolerance Operator': 'ToleranceOperator', 'Tolerance Time': 'ToleranceTime'
            },
            'radiationProtectionSurvey': {
                'Location': 'Location', 'mR/hr': 'mR_hr', 'Category': 'Category',
                'kV': 'kV', 'mA': 'mA', 'Time': 'Time', 'Workload': 'Workload'
            }
        };

        const sectionRowCounter: { [key: string]: number } = {};

        for (let i = 0; i < rows.length; i++) {
            if (!rows[i] || !Array.isArray(rows[i])) continue;
            const row = rows[i].map(c => String(c || '').trim());
            const firstCell = row[0];

            // Be tolerant: allow "TEST:XYZ" or "TEST : XYZ" (with/without spaces)
            if (firstCell && /^TEST\s*:/i.test(firstCell)) {
                const testTitle = firstCell.replace(/^TEST\s*:/i, '').trim().toUpperCase();
                let matchedInternalName = '';
                for (const marker in testMarkerToInternalName) {
                    if (testTitle.startsWith(marker.toUpperCase())) {
                        matchedInternalName = testMarkerToInternalName[marker];
                        break;
                    }
                }

                currentTestName = matchedInternalName;
                isReadingTest = true;
                headers = [];
                if (currentTestName) {
                    if (sectionRowCounter[currentTestName] === undefined) {
                        sectionRowCounter[currentTestName] = 0;
                    }
                }
                continue;
            }

            // If empty row, reset headers so next table within same section can be detected
            if (isReadingTest && row.every(c => !c)) {
                headers = [];
                continue;
            }

            // Detect special "settings" rows that contain multiple label/value pairs on one line
            if (isReadingTest && headers.length === 0 && currentTestName) {
                const map = headerMap[currentTestName] || {};
                const allowsMultiPair = ['linearityOfMaLoading', 'radiationLeakageLevel', 'radiationProtectionSurvey', 'accuracyOfIrradiationTime', 'consistencyOfRadiationOutput', 'LinearityOfTime', 'linearityOfMasLoading'].includes(currentTestName);
                if (allowsMultiPair) {
                    // Check if this row looks like a header row first
                    const headerMatches = row.filter(c => (headerMap[currentTestName] || {})[c]).length;
                    const isHeaderRow = headerMatches > 1 || (headerMatches === 1 && headerMap[currentTestName]?.[row.find(c => (headerMap[currentTestName] || {})[c]) || ''] && row.every(c => !((headerMap[currentTestName] || {})[c]) ? !c : true)); // Strict check: if mostly headers

                    if (!isHeaderRow) {
                        const pairs: { field: string; value: string }[] = [];
                        let hasHeaderLikeValue = false;
                        for (let idx = 0; idx < row.length - 1; idx += 2) {
                            const label = row[idx];
                            const value = row[idx + 1];
                            if (!label || !value) continue;
                            const internalLabel = map[label];
                            const internalValueAsHeader = map[value];
                            if (internalLabel && value) {
                                pairs.push({ field: internalLabel, value });
                            }
                            if (internalLabel && internalValueAsHeader) {
                                hasHeaderLikeValue = true;
                            }
                        }
                        if (pairs.length > 0 && !hasHeaderLikeValue) {
                            sectionRowCounter[currentTestName] = (sectionRowCounter[currentTestName] || 0) + 1;
                            const rowIdx = sectionRowCounter[currentTestName];
                            pairs.forEach(p => {
                                data.push({
                                    'Field Name': p.field,
                                    'Value': p.value,
                                    'Row Index': rowIdx,
                                    'Test Name': currentTestName,
                                });
                            });
                            continue;
                        }
                    }
                }
            }

            // Detect key-value row (Vertical) or headers (Horizontal)
            if (isReadingTest && headers.length === 0 && currentTestName) {
                // Check if it's a key-value row: [Key, Value] where Key matches a field
                const fieldForKey = (headerMap[currentTestName] || {})[firstCell];
                if (fieldForKey && row[1] && row.slice(2).every(c => !c)) {
                    sectionRowCounter[currentTestName] = (sectionRowCounter[currentTestName] || 0) + 1;
                    data.push({
                        'Field Name': fieldForKey,
                        'Value': row[1],
                        'Row Index': sectionRowCounter[currentTestName],
                        'Test Name': currentTestName,
                    });
                    continue;
                }

                const matches = row.filter(c => (headerMap[currentTestName] || {})[c]).length;
                if (matches >= 2 || (matches === 1 && row.filter(c => c).length > 2)) {
                    headers = row;
                    continue;
                } else if (matches === 1 && row.filter(c => c).length === 1) {
                    headers = row;
                    continue;
                }
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
        return parseHorizontalData(lines);
    };

    const parseExcelToCSVFormat = (workbook: XLSX.WorkBook): any[] => {
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        return parseHorizontalData(jsonData);
    };

    const processCSVData = async (csvData: any[]) => {
        const grouped: { [testName: string]: any[] } = {};
        csvData.forEach(item => {
            const testName = item['Test Name'];
            if (testName) {
                if (!grouped[testName]) {
                    grouped[testName] = [];
                }
                grouped[testName].push(item);
            }
        });

        setCsvDataForComponents(grouped);
        setCsvDataVersion(prev => prev + 1);
        console.log('DentalIntra: Processed CSV data for components:', grouped);
    };

    // Fetch and process CSV/Excel file from URL (passed from ServiceDetails2)
    useEffect(() => {
        const fetchAndProcessFile = async () => {
            if (!csvFileUrl) {
                console.log('DentalIntra: No csvFileUrl provided, skipping file fetch');
                return;
            }

            console.log('DentalIntra: Fetching file from URL:', csvFileUrl);

            try {
                setCsvUploading(true);

                // Strip query parameters and hash fragments for extension detection
                const urlWithoutQuery = csvFileUrl.split('?')[0].split('#')[0];
                const urlLower = urlWithoutQuery.toLowerCase();
                const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

                let csvData: any[] = [];

                if (isExcel) {
                    console.log('DentalIntra: Detected Excel file, fetching through proxy...');
                    toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const arrayBuffer = await response.data.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                    console.log('DentalIntra: Excel file parsed, sheets:', workbook.SheetNames);

                    csvData = parseExcelToCSVFormat(workbook);
                    console.log('DentalIntra: Converted Excel to CSV format, rows:', csvData.length);
                } else {
                    console.log('DentalIntra: Detected CSV file, fetching through proxy...');
                    toast.loading('Loading CSV data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const text = await response.data.text();
                    console.log('DentalIntra: CSV file fetched, length:', text.length);

                    csvData = parseCSV(text);
                }

                console.log('DentalIntra: Processed CSV data, total rows:', csvData.length);
                await processCSVData(csvData);
                toast.success('File loaded successfully!', { id: 'csv-loading' });
            } catch (error: any) {
                console.error('DentalIntra: Error fetching/processing file:', error);
                toast.error('Failed to load file: ' + (error.message || 'Unknown error'), { id: 'csv-loading' });
            } finally {
                setCsvUploading(false);
            }
        };

        fetchAndProcessFile();
    }, [csvFileUrl]);

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

    const handleExportToExcel = async () => {
        if (!serviceId) {
            toast.error("Invalid Service ID");
            return;
        }

        try {
            toast.loading("Exporting data to Excel...", { id: "export-excel" });
            setCsvUploading(true);

            const exportData: DentalIntraExportData = {};

            // 1. Accuracy of Operating Potential
            try {
                const res = await getAccuracyOfOperatingPotentialByServiceIdForDentalIntra(serviceId);
                if (res?.data) exportData.accuracyOfOperatingPotential = res.data;
            } catch (err) { console.log("AccuracyOfOperatingPotential data not found"); }

            // 2. Accuracy of Irradiation Time
            try {
                const res = await getAccuracyOfIrradiationTimeByServiceIdForDentalIntra(serviceId);
                if (res?.data) exportData.accuracyOfIrradiationTime = res.data;
            } catch (err) { console.log("AccuracyOfIrradiationTime data not found"); }

            // 3. Linearity of mA / mAs Loading (Dependent on timer)
            if (hasTimer === true) {
                try {
                    const res = await getLinearityOfMaLoadingByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.linearityOfMaLoading = res.data;
                } catch (err) { console.log("LinearityOfMaLoading data not found"); }
            } else {
                try {
                    const res = await getLinearityOfMasLoadingByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.linearityOfMasLoading = res.data;
                } catch (err) { console.log("LinearityOfMasLoading data not found"); }
            }

            // 4. Consistency of Radiation Output
            try {
                const res = await getConsistencyOfRadiationOutputByServiceIdForDentalIntra(serviceId);
                if (res?.data) exportData.consistencyOfRadiationOutput = res.data;
            } catch (err) { console.log("ConsistencyOfRadiationOutput data not found"); }

            // 5. Radiation Leakage Level / Tube Housing Leakage
            try {
                const res = await getRadiationLeakageLevelByServiceIdForDentalIntra(serviceId);
                if (res?.data) exportData.radiationLeakageLevel = res.data;
            } catch (err) { console.log("RadiationLeakageLevel data not found"); }

            // 6. Details of Radiation Protection Survey
            try {
                const res = await getRadiationProtectionSurveyByServiceIdForDentalIntra(serviceId);
                if (res?.data) exportData.radiationProtectionSurvey = res.data;
            } catch (err) { console.log("RadiationProtectionSurvey data not found"); }

            const hasData = Object.keys(exportData).length > 0;
            if (!hasData) {
                toast.error("No data found to export. Please save test data first.", { id: "export-excel" });
                return;
            }

            const wb = createDentalIntraUploadableExcel(exportData, hasTimer === true);
            const timestamp = new Date().toISOString().split("T")[0];
            const filename = `DentalIntra_Test_Data_${timestamp}.xlsx`;
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

    // Close modal and set timer choice
    const handleTimerChoice = (choice: boolean) => {
        setHasTimer(choice);
        setShowTimerModal(false);
        localStorage.setItem(`dental_intra_timer_choice_${serviceId}`, JSON.stringify(choice));
    };

    // MODAL POPUP
    if (showTimerModal && hasTimer === null) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-105 animate-in fade-in duration-300">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Timer Test Availability</h3>
                    <p className="text-gray-600 mb-8">
                        Does this Dental Intra unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Generate QA Test Report - Dental Intra
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
                        { label: "Condition of Test Item", name: "condition" },
                        { label: "Testing Procedure Number", name: "testingProcedureNumber" },
                        { label: "No. of Pages", name: "pages" },
                        { label: "QA Test Date", name: "testDate", type: "date" },
                        { label: "QA Test Due Date", name: "testDueDate", type: "date" },
                        { label: "Testing Done At Location", name: "location" },
                        { label: "Temperature (°C)", name: "temperature", type: "number" },
                        { label: "Humidity (RH %)", name: "humidity", type: "number" },
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
                            {csvUploading ? 'Uploading...' : 'Upload CSV/Excel File'}
                        </label>

                        <button
                            type="button"
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
            <Notes />

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
                    className={`px-6 py-2 rounded-md font-medium text-white transition ${saving ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                        }`}
                >
                    {saving ? "Saving..." : "Save Report Header"}
                </button>
                <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => navigate(`/admin/orders/view-service-report?serviceId=${serviceId}`)}
                >
                    View Generated Report
                </button>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>

                {[
                    {
                        title: "Accuracy Of Operating Potential",
                        component: <AccuracyOfOperatingPotential
                            serviceId={serviceId}
                            testId={savedTestIds.AccuracyOfOperatingPotentialDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, AccuracyOfOperatingPotentialDentalIntra: id }))}
                            csvData={csvDataForComponents['accuracyOfOperatingPotential']}
                        />
                    },
                    // Timer Test — Only if user said YES
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Accuracy Of Irradiation Time",
                                component: <AccuracyOfIrradiationTime
                                    serviceId={serviceId}
                                    testId={savedTestIds.AccuracyOfIrradiationTimeDentalIntra || null}
                                    onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, AccuracyOfIrradiationTimeDentalIntra: id }))}
                                    csvData={csvDataForComponents['accuracyOfIrradiationTime']}
                                />,
                            },
                        ]
                        : []),
                    // Linearity Test — Conditional
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Linearity Of mA Loading",
                                component: <LinearityOfmALoading
                                    serviceId={serviceId}
                                    testId={savedTestIds.LinearityOfMaLoadingDentalIntra || undefined}
                                    csvData={csvDataForComponents['linearityOfMaLoading']}
                                />,
                            },
                        ]
                        : hasTimer === false
                            ? [
                                {
                                    title: "Linearity Of mAs Loading",
                                    component: <LinearityOfMasLoading
                                        serviceId={serviceId}
                                        testId={savedTestIds.LinearityOfMaLoadingDentalIntra || null}
                                        onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfMaLoadingDentalIntra: id }))}
                                        csvData={csvDataForComponents['linearityOfMasLoading']}
                                    />,
                                },
                            ]
                            : []),
                    {
                        title: "Consistency Of Radiation Output",
                        component: <ConsistencyOfRadiationOutput
                            serviceId={serviceId}
                            testId={savedTestIds.ConsistencyOfRadiationOutputDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, ConsistencyOfRadiationOutputDentalIntra: id }))}
                            csvData={csvDataForComponents['consistencyOfRadiationOutput']}
                        />
                    },
                    {
                        title: "Radiation Leakage Level",
                        component: <RadiationLeakageLevel
                            serviceId={serviceId}
                            testId={savedTestIds.RadiationLeakageLevelDentalIntra || undefined}
                            csvData={csvDataForComponents['radiationLeakageLevel']}
                        />
                    },
                    {
                        title: "Details Of Radiation Protection",
                        component: <DetailsOfRadiationProtection
                            serviceId={serviceId}
                            csvData={csvDataForComponents['radiationProtectionSurvey']}
                        />
                    },
                ].map((item, idx) => (
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
        </div >
    );
};

export default GenerateReportForDental;