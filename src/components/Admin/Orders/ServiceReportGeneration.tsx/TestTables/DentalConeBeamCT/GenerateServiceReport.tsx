// GenerateReport-CTScan.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { saveReportHeader, getReportHeaderForCBCT, getAccuracyOfOperatingPotentialByServiceIdForCBCT, getAccuracyOfIrradiationTimeByServiceIdForCBCT, getLinearityOfMaLoadingByServiceIdForCBCT, getConsistencyOfRadiationOutputByServiceIdForCBCT, getRadiationLeakageLevelByServiceIdForCBCT, getRadiationProtectionSurveyByServiceIdForCBCT, proxyFile } from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";
import * as XLSX from 'xlsx';
import { createCBCTUploadableExcel } from './exportCBCTToExcel';

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Components
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import TotalFilteration from "./TotalFilteration";
import LinearityOfmALoading from "./LinearityOfmALoading";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
import RadiationLeakageLevel from "./RadiationLeakageLevel";
import EquipmentSetting from "./EquipmentSetting";
import LinearityOfMasLoading from "./LinearityOfmAsLoadingStation"
import DetailsOfRadiationProtection from "./DetailsOfRadiationProtectionSurvey";
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

const DentalConeBeamCT: React.FC<{ serviceId: string; qaTestDate?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, csvFileUrl }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [showTimerModal, setShowTimerModal] = useState(false); // Don't show by default
    const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
    const [savedTestIds, setSavedTestIds] = useState<{
        AccuracyOfIrradiationTimeCBCT?: string;
        AccuracyOfOperatingPotentialCBCT?: string;
        OutputConsistencyForCBCT?: string;
        LinearityOfMaLoadingCBCT?: string;
        RadiationLeakageTestCBCT?: string;
        RadiationProtectionSurveyCBCT?: string;
    }>({});
    const [csvData, setCsvData] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
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

    const parseHorizontalData = (rows: any[][]): any[] => {
        const data: any[] = [];
        let currentTestName = '';
        let headers: string[] = [];
        let isReadingTest = false;

        const testMarkerToInternalName: { [key: string]: string } = {
            'LINEARITY OF mAs LOADING': 'linearityOfMasLoading',
            'LINEARITY OF mA LOADING': 'linearityOfMaLoading',
            'ACCURACY OF OPERATING POTENTIAL': 'accuracyOfOperatingPotential',
            'ACCURACY OF IRRADIATION TIME': 'accuracyOfIrradiationTime',
            'TOTAL FILTRATION': 'accuracyOfOperatingPotential',
            'CONSISTENCY OF RADIATION OUTPUT': 'consistencyOfRadiationOutput',
            'RADIATION LEAKAGE LEVEL FROM X-RAY TUBE HOUSE': 'radiationLeakageLevel',
            'RADIATION PROTECTION SURVEY REPORT': 'radiationProtectionSurvey'
        };

        const headerMap: { [test: string]: { [header: string]: string } } = {
            'accuracyOfOperatingPotential': {
                'Applied kVp': 'Applied_kVp', 'applied kvp': 'Applied_kVp', 'Applied KVp': 'Applied_kVp',
                'Average kVp': 'Average_kVp', 'average kvp': 'Average_kVp', 'Average KVp': 'Average_kVp',
                'Remarks': 'Remarks', 'remarks': 'Remarks',
                'mA 1': 'Measured_0', 'mA 2': 'Measured_1', 'mA 3': 'Measured_2', 'mA 4': 'Measured_3', 'mA 5': 'Measured_4',
                'ma 1': 'Measured_0', 'ma 2': 'Measured_1', 'ma 3': 'Measured_2', 'ma 4': 'Measured_3', 'ma 5': 'Measured_4',
                'Parameter': 'Parameter', 'parameter': 'Parameter',
                'Measured (mm Al)': 'Measured', 'measured (mm al)': 'Measured',
                'Required (mm Al)': 'Required', 'required (mm al)': 'Required',
                'At kVp': 'atKvp', 'at kvp': 'atKvp', 'at kVp': 'atKvp',
                'kV': 'kV', 'kv': 'kV', 'KV': 'kV',
                'kVp': 'kV', 'kvp': 'kV', 'KVp': 'kV', 'KVP': 'kV',
                'mA': 'mA', 'ma': 'mA', 'MA': 'mA',
                'FCD': 'FCD', 'fcd': 'FCD', 'FFD': 'FFD', 'ffd': 'FFD'
            },
            'accuracyOfIrradiationTime': {
                'Set Time (mSec)': 'Set_Time', 'set time (msec)': 'Set_Time',
                'Measured Time (mSec)': 'Measured_Time', 'measured time (msec)': 'Measured_Time',
                '% Error': 'Error', '% error': 'Error',
                'kV': 'kV', 'kv': 'kV', 'KV': 'kV',
                'kVp': 'kV', 'kvp': 'kV', 'KVp': 'kV', 'KVP': 'kV',
                'mA': 'mA', 'ma': 'mA', 'MA': 'mA',
                'FCD': 'FCD', 'fcd': 'FCD', 'FFD': 'FFD', 'ffd': 'FFD'
            },
            'linearityOfMaLoading': {
                'mA Station': 'mA_Station', 'ma station': 'mA_Station', 'MA Station': 'mA_Station',
                'Average': 'Average', 'average': 'Average',
                'mR/mAs': 'mR_mAs', 'mr/mas': 'mR_mAs', 'mR/mAs ': 'mR_mAs',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2', 'Measured mR 4': 'Measured_3', 'Measured mR 5': 'Measured_4',
                'measured mr 1': 'Measured_0', 'measured mr 2': 'Measured_1', 'measured mr 3': 'Measured_2', 'measured mr 4': 'Measured_3', 'measured mr 5': 'Measured_4',
                'kV': 'kV', 'kv': 'kV', 'KV': 'kV',
                'kVp': 'kV', 'kvp': 'kV', 'KVp': 'kV', 'KVP': 'kV',
                'mA': 'mA', 'ma': 'mA', 'MA': 'mA',
                'time': 'time', 'Time': 'time', 'Timer': 'time', 'timer': 'time',
                'FCD': 'FCD', 'fcd': 'FCD', 'FFD': 'FFD', 'ffd': 'FFD'
            },
            'linearityOfMasLoading': {
                'mAs Range': 'mAs_Range', 'mas range': 'mAs_Range',
                'Average': 'Average', 'average': 'Average',
                'mR/mAs': 'mR_mAs', 'mr/mas': 'mR_mAs',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2', 'Measured mR 4': 'Measured_3', 'Measured mR 5': 'Measured_4',
                'measured mr 1': 'Measured_0', 'measured mr 2': 'Measured_1', 'measured mr 3': 'Measured_2', 'measured mr 4': 'Measured_3', 'measured mr 5': 'Measured_4',
                'kV': 'kV', 'kv': 'kV', 'KV': 'kV',
                'kVp': 'kV', 'kvp': 'kV', 'KVp': 'kV', 'KVP': 'kV',
                'mA': 'mA', 'ma': 'mA', 'MA': 'mA',
                'FCD': 'FCD', 'fcd': 'FCD', 'FFD': 'FFD', 'ffd': 'FFD'
            },
            'consistencyOfRadiationOutput': {
                'kVp': 'kVp', 'kvp': 'kVp', 'Kvp': 'kVp',
                'mAs': 'mAs', 'mas': 'mAs',
                'Mean': 'Mean', 'mean': 'Mean',
                'CoV': 'CoV', 'cov': 'CoV', 'COV': 'CoV',
                'Remarks': 'Remarks', 'remarks': 'Remarks',
                'Meas 1': 'Measured_0', 'Meas 2': 'Measured_1', 'Meas 3': 'Measured_2', 'Meas 4': 'Measured_3', 'Meas 5': 'Measured_4',
                'meas 1': 'Measured_0', 'meas 2': 'Measured_1', 'meas 3': 'Measured_2', 'meas 4': 'Measured_3', 'meas 5': 'Measured_4',
                'FFD': 'FFD', 'ffd': 'FFD'
            },
            'radiationLeakageLevel': {
                'Location': 'Table2_Area', 'location': 'Table2_Area',
                'Front': 'Table2_Front', 'front': 'Table2_Front',
                'Back': 'Table2_Back', 'back': 'Table2_Back',
                // Template variants that use Top/Up/Down instead of Front/Back
                'Top': 'Table2_Front', 'top': 'Table2_Front',
                'Up': 'Table2_Back', 'up': 'Table2_Back', 'Down': 'Table2_Back', 'down': 'Table2_Back',
                'Left': 'Table2_Left', 'left': 'Table2_Left',
                'Right': 'Table2_Right', 'right': 'Table2_Right',
                'Max Leakage': 'Table2_Max', 'max leakage': 'Table2_Max',
                'Unit': 'Table2_Unit', 'unit': 'Table2_Unit',
                'Remark': 'Table2_Remark', 'remark': 'Table2_Remark',
                'kV': 'kV', 'kv': 'kV', 'KV': 'kV',
                'kVp': 'kV', 'kvp': 'kV', 'KVp': 'kV', 'KVP': 'kV',
                'mA': 'mA', 'ma': 'mA', 'MA': 'mA',
                'FFD': 'FFD', 'ffd': 'FFD',
                'Time': 'Time', 'time': 'Time',
                // Workload + tolerance fields (consumed by the component)
                'Workload': 'Workload', 'workload': 'Workload',
                'Workload Unit': 'WorkloadUnit', 'workload unit': 'WorkloadUnit', 'WorkloadUnit': 'WorkloadUnit', 'workloadunit': 'WorkloadUnit',
                'Tolerance': 'ToleranceValue', 'tolerance': 'ToleranceValue', 'Tolerance Value': 'ToleranceValue', 'tolerance value': 'ToleranceValue',
                'Tolerance Operator': 'ToleranceOperator', 'tolerance operator': 'ToleranceOperator',
                'Tolerance Time': 'ToleranceTime', 'tolerance time': 'ToleranceTime'
            },
            'radiationProtectionSurvey': {
                'LOCATION': 'Location', 'location': 'Location', 'Location': 'Location',
                'MAX. RADIATION LEVEL (MR/HR)': 'mR_hr', 'max. radiation level (mr/hr)': 'mR_hr',
                'MR/WEEK': 'mR_week', 'mr/week': 'mR_week',
                'STATUS': 'Status', 'status': 'Status',
                'RESULT': 'Result', 'result': 'Result',
                'LOCATION ': 'Location', 'MAX. RADIATION LEVEL (mR/hr)': 'mR_hr',
                'Category': 'Category', 'category': 'Category',
                // Settings row labels
                'Applied Current (mA)': 'mA', 'APPLIED CURRENT (MA)': 'mA',
                'Applied Voltage (kV)': 'kV', 'APPLIED VOLTAGE (KV)': 'kV',
                'Exposure Time (s)': 'Time', 'EXPOSURE TIME (S)': 'Time',
                'Workload (mA.min/week)': 'Workload', 'WORKLOAD (MA.MIN/WEEK)': 'Workload',
                'mA': 'mA', 'ma': 'mA', 'MA': 'mA',
                'kV': 'kV', 'kv': 'kV', 'KV': 'kV',
                'kVp': 'kV', 'kvp': 'kV', 'KVp': 'kV', 'KVP': 'kV',
                'Time': 'Time', 'time': 'Time',
                'Workload': 'Workload', 'workload': 'Workload'
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
                const allowsMultiPair = ['linearityOfMaLoading', 'radiationLeakageLevel', 'radiationProtectionSurvey', 'accuracyOfIrradiationTime'].includes(currentTestName);
                if (allowsMultiPair) {
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
                            // e.g. "mA Station, Measured mR 1" – this is actually a header row, not settings
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
                    // Single cell matching a header? Could be a header row with 1 col or just noise.
                    // If it's the first non-empty row, let's assume it's headers.
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

    const processCSVData = (csvData: any[]) => {
        const groupedData: { [key: string]: any[] } = {};
        csvData.forEach((row) => {
            const testName = row['Test Name'];
            if (testName) {
                if (!groupedData[testName]) groupedData[testName] = [];
                groupedData[testName].push(row);
            }
        });
        return groupedData;
    };

    const addYearsToDate = (dateStr: string, years: number): string => {
        if (!dateStr) return "";
        const base = dateStr.split("T")[0];
        const d = new Date(base);
        if (Number.isNaN(d.getTime())) return base;
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split("T")[0];
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
                const firstTest = data.qaTests[0];

                setDetails(data);

                const rawTestDate =
                    qaTestDate ||
                    firstTest?.createdAt ||
                    "";
                const baseTestDate = rawTestDate ? rawTestDate.split("T")[0] : "";
                const dueDate = baseTestDate ? addYearsToDate(baseTestDate, 5) : "";

                // Pre-fill form from service details
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

    // Close modal and set timer choice
    const handleTimerChoice = (choice: boolean) => {
        setHasTimer(choice);
        setShowTimerModal(false);
        // Persist choice in localStorage
        localStorage.setItem(`cbct_timer_choice_${serviceId}`, JSON.stringify(choice));
    };

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
    // Load report header and test IDs
    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForCBCT(serviceId);
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

                    // Load existing notes, or use default if none exist
                    if (res.data.notes && Array.isArray(res.data.notes) && res.data.notes.length > 0) {
                        const notesTexts = res.data.notes.map((n: any) => n.text || n);
                        setNotes(notesTexts);
                    } else {
                        setNotes(defaultNotes);
                    }

                    // Save test IDs
                    const testIds = {
                        AccuracyOfIrradiationTimeCBCT: res.data.AccuracyOfIrradiationTimeCBCT?._id || res.data.AccuracyOfIrradiationTimeCBCT,
                        AccuracyOfOperatingPotentialCBCT: res.data.AccuracyOfOperatingPotentialCBCT?._id || res.data.AccuracyOfOperatingPotentialCBCT,
                        OutputConsistencyForCBCT: res.data.OutputConsistencyForCBCT?._id || res.data.OutputConsistencyForCBCT,
                        LinearityOfMaLoadingCBCT: res.data.LinearityOfMaLoadingCBCT?._id || res.data.LinearityOfMaLoadingCBCT,
                        RadiationLeakageTestCBCT: res.data.RadiationLeakageTestCBCT?._id || res.data.RadiationLeakageTestCBCT,
                        RadiationProtectionSurveyCBCT: res.data.RadiationProtectionSurveyCBCT?._id || res.data.RadiationProtectionSurveyCBCT,
                    };
                    setSavedTestIds(testIds);

                    // If AccuracyOfIrradiationTimeCBCT exists, set hasTimer to true
                    if (testIds.AccuracyOfIrradiationTimeCBCT) {
                        setHasTimer(true);
                        setShowTimerModal(false);
                    } else {
                        // Check localStorage for saved choice
                        const savedChoice = localStorage.getItem(`cbct_timer_choice_${serviceId}`);
                        if (savedChoice !== null) {
                            setHasTimer(JSON.parse(savedChoice));
                            setShowTimerModal(false);
                        } else {
                            // Only show modal if no saved choice and no existing test
                            setShowTimerModal(true);
                        }
                    }
                } else {
                    // No report header exists, check localStorage
                    const savedChoice = localStorage.getItem(`cbct_timer_choice_${serviceId}`);
                    if (savedChoice !== null) {
                        setHasTimer(JSON.parse(savedChoice));
                        setShowTimerModal(false);
                    } else {
                        // Show modal only if no saved choice
                        setShowTimerModal(true);
                    }
                }
            } catch (err) {
                console.log("No report header found or failed to load:", err);
                // On error, check localStorage
                const savedChoice = localStorage.getItem(`cbct_timer_choice_${serviceId}`);
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

    // Fetch and process file from URL (for auto-fill)
    useEffect(() => {
        const fetchAndProcessFile = async () => {
            if (!csvFileUrl) {
                console.log('CBCT: No csvFileUrl provided, skipping file fetch');
                return;
            }

            console.log('CBCT: Fetching file from URL:', csvFileUrl);

            try {
                toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

                // Extract file extension from URL (remove query parameters first)
                const urlWithoutQuery = csvFileUrl.split('?')[0].split('#')[0];
                const urlLower = urlWithoutQuery.toLowerCase();
                const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

                if (isExcel) {
                    const response = await proxyFile(csvFileUrl);
                    const arrayBuffer = await response.data.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                    const wsname = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[wsname];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    const parsed = parseHorizontalData(jsonData as any[]);
                    const grouped = processCSVData(parsed);
                    setCsvData(grouped);
                    toast.success('Excel data loaded successfully!', { id: 'csv-loading' });
                } else {
                    const response = await proxyFile(csvFileUrl);
                    const text = await response.data.text();

                    // Simple CSV to array of arrays
                    const rows = text.split('\n').map((line: any) => line.split(','));
                    const parsed = parseHorizontalData(rows);
                    const grouped = processCSVData(parsed);
                    setCsvData(grouped);
                    toast.success('CSV data loaded successfully!', { id: 'csv-loading' });
                }
            } catch (error: any) {
                console.error('CBCT: Error fetching/processing file:', error);
                toast.error('Failed to load file: ' + (error.message || 'Unknown error'), { id: 'csv-loading' });
            }
        };

        fetchAndProcessFile();
    }, [csvFileUrl]);

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
                        Does this Dental Cone Beam CT unit have a selectable <strong>Irradiation Time (Timer)</strong> setting?
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }); // Array of arrays

            const rawParsed = parseHorizontalData(jsonData as any[]);
            const grouped = processCSVData(rawParsed);
            console.log("Parsed & Grouped CSV Data:", grouped);
            setCsvData(grouped);
            toast.success("Excel data imported successfully!");
        };
        reader.readAsBinaryString(file);
    };

    const handleExportSavedData = async () => {
        if (!serviceId) return;
        setIsExporting(true);
        try {
            // Fetch all data
            const [
                kvpRes,
                timeRes,
                linMaRes,
                // linMasRes, // Assume one linearity test usually
                consRes,
                leakRes,
                protRes
            ] = await Promise.all([
                getAccuracyOfOperatingPotentialByServiceIdForCBCT(serviceId),
                getAccuracyOfIrradiationTimeByServiceIdForCBCT(serviceId),
                getLinearityOfMaLoadingByServiceIdForCBCT(serviceId),
                getConsistencyOfRadiationOutputByServiceIdForCBCT(serviceId),
                getRadiationLeakageLevelByServiceIdForCBCT(serviceId),
                getRadiationProtectionSurveyByServiceIdForCBCT(serviceId)
            ]);

            // Construct data object
            const exportData = {
                accuracyOfOperatingPotential: kvpRes?.data,
                accuracyOfIrradiationTime: timeRes?.data,
                linearityOfMaLoading: linMaRes?.data, // Determine if it's mA or mAs based on data
                outputConsistency: consRes?.data,
                radiationLeakage: leakRes?.data,
                radiationProtectionSurvey: protRes?.data
            };

            // Check for mAs linearity if mA is empty or user selected no timer?
            // Actually `getLinearityOfMaLoadingByServiceIdForCBCT` might handle both or we need `getLinearityOfMasLoading`.
            // Assuming separate for now if needed.
            // If hasTimer is false, we might want to check the mAs endpoint. 
            // But for now let's stick to what's imported.

            const wb = createCBCTUploadableExcel(exportData);
            XLSX.writeFile(wb, `CBCT_Report_${serviceId}.xlsx`);
            toast.success("Report data exported!");

        } catch (err) {
            console.error(err);
            toast.error("Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    // Helper to trigger hidden file input
    const triggerFileInput = () => {
        document.getElementById('excel-upload')?.click();
    };

    return (
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                Generate Dental Cone Beam CT QA Test Report
            </h1>

            {/* Excel Actions */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
                {/* <a
                    href="/templates/Dental_CBCT_Test_Data_Template.csv"
                    download
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow"
                >
                    Download Excel Template
                </a> */}

                <div className="relative">
                    <input
                        type="file"
                        id="excel-upload"
                        accept=".xlsx, .xls ,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={triggerFileInput}
                        className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition shadow"
                    >
                        Import Excel Data
                    </button>
                </div>
                <button
                    onClick={handleExportSavedData}
                    disabled={isExporting}
                    className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isExporting ? 'Exporting...' : 'Export Saved Data'}
                </button>
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
                    onClick={() => navigate(`/admin/orders/view-service-report-dental-cone-beam-ct?serviceId=${serviceId}`)}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    View Generated Report
                </button>
            </div>

            {/* Test Tables */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
                {[
                    {
                        title: "Accuracy Of Operating Potential",
                        component: <AccuracyOfOperatingPotential
                            serviceId={serviceId}
                            testId={savedTestIds.AccuracyOfOperatingPotentialCBCT || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, AccuracyOfOperatingPotentialCBCT: id }))}
                            csvData={csvData?.accuracyOfOperatingPotential}
                        />
                    },
                    // { title: "Total Filteration", component: <TotalFilteration /> },

                    // Timer Test — Only if user said YES
                    ...(hasTimer === true
                        ? [
                            {
                                title: "Accuracy Of Irradiation Time",
                                component: <AccuracyOfIrradiationTime
                                    serviceId={serviceId}
                                    testId={savedTestIds.AccuracyOfIrradiationTimeCBCT || null}
                                    onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, AccuracyOfIrradiationTimeCBCT: id }))}
                                    csvData={csvData?.accuracyOfIrradiationTime}
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
                                    testId={savedTestIds.LinearityOfMaLoadingCBCT || undefined}
                                    csvData={csvData?.linearityOfMaLoading}
                                />,
                            },
                        ]
                        : hasTimer === false
                            ? [
                                {
                                    title: "Linearity Of mAs Loading",
                                    component: <LinearityOfMasLoading
                                        serviceId={serviceId}
                                        testId={savedTestIds.LinearityOfMaLoadingCBCT || null}
                                        onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfMaLoadingCBCT: id }))}
                                        csvData={csvData?.linearityOfMasLoading}
                                    />,
                                },
                            ]
                            : []),

                    {
                        title: "Consistency Of Radiation Output",
                        component: <ConsistencyOfRadiationOutput
                            serviceId={serviceId}
                            testId={savedTestIds.OutputConsistencyForCBCT || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, OutputConsistencyForCBCT: id }))}
                            csvData={csvData?.consistencyOfRadiationOutput}
                        />
                    },
                    {
                        title: "Radiation Leakage Level",
                        component: <RadiationLeakageLevel
                            serviceId={serviceId}
                            testId={savedTestIds.RadiationLeakageTestCBCT || undefined}
                            csvData={csvData?.radiationLeakageLevel}
                        />
                    },
                    // { title: "Equipment Setting", component: <EquipmentSetting /> },
                    // { title: "Maximum Radiation Level", component: <MaximumRadiationLevel /> },
                    {
                        title: "Details Of Radiation Protection",
                        component: <DetailsOfRadiationProtection
                            serviceId={serviceId}
                            csvData={csvData?.radiationProtectionSurvey}
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

export default DentalConeBeamCT;