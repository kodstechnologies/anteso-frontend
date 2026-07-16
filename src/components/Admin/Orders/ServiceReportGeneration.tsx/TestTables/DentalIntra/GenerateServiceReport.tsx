// GenerateReport-InventionalRadiology.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AuthorizedSignatorySelect from "../../AuthorizedSignatorySelect";
import * as XLSX from "xlsx";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { getDetails, getTools, saveReportHeaderForDentalIntra, getReportHeaderForDentalIntra, proxyFile } from "../../../../../../api";

// Test-table imports
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
// import AccuracyOfOperatingPotentialAndTime from "./AccuracyOfOperatingPotentialAndTime";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
// import LinearityOfTime from "./LinearityOfTime";
import LinearityOfmALoading from "./LinearityOfmALoading"
import LinearityOfMasLoading from "./LinearityOfMasLoading";
// import ReproducibilityOfRadiationOutput from "./ReproducibilityOfRadiationOutput";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
// import TubeHousingLeakage from "./TubeHousingLeakage";
import RadiationLeakageLevel from "./RadiationLeakageLevel";
import DetailsOfRadiationProtection from "./DetailsOfRadiationProtection";

import { createDentalIntraUploadableExcel, DentalIntraExportData } from "./exportDentalIntraToExcel";
import { isExcelFileUrl } from "../../../../../../utils/spreadsheetFile";
import { normalizeCsvComparisonOperator } from "../shared/parseRadiographyStyleTableFormat";
import { TestExportRegistryProvider, useTestExportRegistry } from "../shared/TestExportRegistry";
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

const GenerateReportForDentalContent: React.FC<DentalProps> = ({ serviceId, qaTestDate, csvFileUrl }) => {
    const exportRegistry = useTestExportRegistry();
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
        location: "At site",
        temperature: "",
        humidity: "",
        engineerNameRPId: "",
        rpId: "",
        authorizedSignatory: "",
    });

    const [minIssueDate, setMinIssueDate] = useState(""); // QA test submitted date; issue date must be >= this
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

                const firstTest = data.qaTests[0];
                const srfDateStr = data.orderCreatedAt ? new Date(data.orderCreatedAt).toISOString().split("T")[0] : "";
                const rawTestDate = firstTest?.qatestSubmittedAt || firstTest?.createdAt || qaTestDate || "";
                const baseTestDate = rawTestDate ? (typeof rawTestDate === "string" ? rawTestDate.split("T")[0] : "") : "";
                const dueDate = baseTestDate ? addYearsToDate(baseTestDate, 5) : "";

                setMinIssueDate(baseTestDate || "");
                setFormData({
                    customerName: data.hospitalName,
                    address: data.hospitalAddress,
                    srfNumber: data.srfNumber,
                    srfDate: srfDateStr || baseTestDate || "",
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
                    testDate: baseTestDate,
                    testDueDate: dueDate,
                    location: "At site",
                    temperature: "",
                    humidity: "",
                    engineerNameRPId: data.engineerAssigned?.name || "",
                    rpId: data.rpId,
                    authorizedSignatory: "",
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
            if (csvFileUrl) return; // Timer/config will be set from Excel in fetchAndProcessFile
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
                        reportULRNumber: res.data.reportULRNumber || prev.reportULRNumber,
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
                        location: res.data.location || prev.location || "At site",
                        temperature: res.data.temperature || prev.temperature,
                        humidity: res.data.humidity || prev.humidity,
                        engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
                        rpId: res.data.rpId || prev.rpId,
                        authorizedSignatory: (typeof res.data.authorizedSignatory === "object" ? res.data.authorizedSignatory?._id : res.data.authorizedSignatory) || prev.authorizedSignatory || "",
                    }));

                    // Save test IDs
                    setSavedTestIds({
                        AccuracyOfOperatingPotentialDentalIntra: res.data.AccuracyOfOperatingPotentialDentalIntra?._id || res.data.AccuracyOfOperatingPotentialDentalIntra,
                        AccuracyOfIrradiationTimeDentalIntra: res.data.AccuracyOfIrradiationTimeDentalIntra?._id || res.data.AccuracyOfIrradiationTimeDentalIntra,
                        AccuracyOfOperatingPotentialAndTimeDentalIntra: res.data.AccuracyOfOperatingPotentialAndTimeDentalIntra?._id || res.data.AccuracyOfOperatingPotentialAndTimeDentalIntra,
                        LinearityOfTimeDentalIntra: res.data.LinearityOfTimeDentalIntra?._id || res.data.LinearityOfTimeDentalIntra,
                        LinearityOfMaLoadingDentalIntra: res.data.LinearityOfMaLoadingDentalIntra?._id || res.data.LinearityOfMaLoadingDentalIntra,
                        LinearityOfmAsLoadingDentalIntra: res.data.LinearityOfmAsLoadingDentalIntra?._id || res.data.LinearityOfmAsLoadingDentalIntra,
                        ConsistencyOfRadiationOutputDentalIntra: res.data.ConsistencyOfRadiationOutputDentalIntra?._id || res.data.ConsistencyOfRadiationOutputDentalIntra,
                        ReproducibilityOfRadiationOutputDentalIntra: res.data.ReproducibilityOfRadiationOutputDentalIntra?._id || res.data.ReproducibilityOfRadiationOutputDentalIntra,
                        RadiationLeakageLevelDentalIntra: res.data.RadiationLeakageLevelDentalIntra?._id || res.data.RadiationLeakageLevelDentalIntra,
                        TubeHousingLeakageDentalIntra: res.data.TubeHousingLeakageDentalIntra?._id || res.data.TubeHousingLeakageDentalIntra,
                    });

                    // Resolve timer mode:
                    // 1) honor explicitly saved local choice first
                    // 2) fallback to existing saved tests only when no local choice exists
                    const savedChoice = localStorage.getItem(`dental_intra_timer_choice_${serviceId}`);
                    if (savedChoice !== null) {
                        setHasTimer(JSON.parse(savedChoice));
                        setShowTimerModal(false);
                    } else {
                        const hasIrradiation = !!res.data.AccuracyOfIrradiationTimeDentalIntra;
                        const hasMaLinearity = !!res.data.LinearityOfMaLoadingDentalIntra;
                        const hasMasLinearity = !!res.data.LinearityOfmAsLoadingDentalIntra;

                        if (hasMasLinearity && !hasIrradiation && !hasMaLinearity) {
                            setHasTimer(false);
                            setShowTimerModal(false);
                        } else if (hasIrradiation || hasMaLinearity) {
                            setHasTimer(true);
                            setShowTimerModal(false);
                        } else if (hasMasLinearity) {
                            setHasTimer(false);
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
        if (Array.isArray((data as any).readings) && (data as any).readings.length > 0) return true;
        if (Array.isArray((data as any).table2) && (data as any).table2.length > 0) return true;
        if (Array.isArray((data as any).measurements) && (data as any).measurements.length > 0) return true;
        return false;
    };

    const getUnsavedTestNames = async (): Promise<string[]> => {
        const checks: { name: string; check: () => Promise<boolean> }[] = [
            { name: "Accuracy Of Operating Potential", check: async () => { try { return isSaved(await getAccuracyOfOperatingPotentialByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Consistency Of Radiation Output", check: async () => { try { return isSaved(await getConsistencyOfRadiationOutputByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Radiation Leakage Level", check: async () => { try { return isSaved(await getRadiationLeakageLevelByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Details Of Radiation Protection", check: async () => { try { return isSaved(await getRadiationProtectionSurveyByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
        ];
        if (hasTimer === true) {
            checks.push({ name: "Accuracy Of Irradiation Time", check: async () => { try { return isSaved(await getAccuracyOfIrradiationTimeByServiceIdForDentalIntra(serviceId)); } catch { return false; } } });
            checks.push({ name: "Linearity Of mA Loading", check: async () => { try { return isSaved(await getLinearityOfMaLoadingByServiceIdForDentalIntra(serviceId)); } catch { return false; } } });
        } else if (hasTimer === false) {
            checks.push({ name: "Linearity Of mAs Loading", check: async () => { try { return isSaved(await getLinearityOfMasLoadingByServiceIdForDentalIntra(serviceId)); } catch { return false; } } });
        }
        const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
        return results.filter((r) => !r.saved).map((r) => r.name);
    };

    const handleSaveHeader = async () => {
        setSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
            if (minIssueDate && formData.issueDate && formData.issueDate < minIssueDate) {
                toast.error("Issue date must be equal to or greater than the QA test submitted date.");
                setSaving(false);
                return;
            }
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

            await saveReportHeaderForDentalIntra(serviceId, payload);
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
        let sectionDynamicMeasCols: number[] = [];
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
                // Radiography Fixed style vertical key-value rows for Total Filtration
                'Total Filtration Measured (mm Al)': 'Measured',
                'Total Filtration Required (mm Al)': 'Required',
                'Total Filtration At kVp': 'atKvp',
                'kV': 'kV', 'kVp': 'kVp',
                'Tolerance Sign': 'Tolerance_Sign', 'tolerance sign': 'Tolerance_Sign',
                'Tolerance Value (kVp)': 'Tolerance_Value', 'Tolerance Value': 'Tolerance_Value',
                'tolerance value (kvp)': 'Tolerance_Value', 'tolerance value': 'Tolerance_Value',
                'Tolerance': 'Tolerance_Value', 'tolerance': 'Tolerance_Value',
                'mA 1': 'Measured_0', 'mA 2': 'Measured_1', 'mA 3': 'Measured_2', 'mA 4': 'Measured_3', 'mA 5': 'Measured_4',
            },
            'accuracyOfIrradiationTime': {
                'Set Time (mSec)': 'Set_Time',
                'mA Station 1 Time': 'Measured_Time',
                'mA Station 2 Time': 'Measured_Time_ignore', // Component handles only one measured time per row currently
                'Measured Time (mSec)': 'Measured_Time',
                'kV': 'kV', 'kVp': 'kVp',
                'FCD': 'FCD', 'FDD': 'FCD', 'FDD (cm)': 'FCD', 'mA': 'mA',
            },
            'linearityOfMaLoading': {
                'mA Station': 'mA_Station',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2', 'Measured mR 4': 'Measured_3', 'Measured mR 5': 'Measured_4',
                'kV': 'kV', 'Time': 'time', 'FCD': 'FCD', 'FDD': 'FCD', 'FDD (cm)': 'FCD',
                'Tolerance Operator': 'Tolerance_Operator', 'tolerance operator': 'Tolerance_Operator',
                'Tol Operator': 'Tolerance_Operator', 'tol operator': 'Tolerance_Operator',
                'Tolerance Sign': 'Tolerance_Operator', 'tolerance sign': 'Tolerance_Operator',
                'Tolerance Value (CoL)': 'Tolerance', 'Tolerance Value': 'Tolerance',
                'tolerance value (col)': 'Tolerance', 'Tol Value': 'Tolerance', 'Tolerance': 'Tolerance',
            },
            'linearityOfMasLoading': {
                'mAs Range': 'mAs_Range',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2', 'Measured mR 4': 'Measured_3', 'Measured mR 5': 'Measured_4',
                'kV': 'kV', 'FCD': 'FCD', 'FDD': 'FCD', 'FDD (cm)': 'FCD',
                'Tolerance Operator': 'Tolerance_Operator', 'tolerance operator': 'Tolerance_Operator',
                'Tol Operator': 'Tolerance_Operator', 'tol operator': 'Tolerance_Operator',
                'Tolerance Sign': 'Tolerance_Operator', 'tolerance sign': 'Tolerance_Operator',
                'Tolerance Value (CoL)': 'Tolerance', 'Tolerance Value': 'Tolerance',
                'tolerance value (col)': 'Tolerance', 'Tol Value': 'Tolerance', 'Tolerance': 'Tolerance',
            },
            'LinearityOfTime': {
                'FCD': 'FCD', 'FDD': 'FCD', 'FDD (cm)': 'FCD', 'kV': 'kV', 'mA': 'mA',
                'Time Station (sec)': 'time',
                'Measured mR 1': 'Measured_0', 'Measured mR 2': 'Measured_1', 'Measured mR 3': 'Measured_2',
            },
            'consistencyOfRadiationOutput': {
                'FFD': 'FFD', 'ffd': 'FFD', 'FDD': 'FFD', 'fdd': 'FFD', 'FDD (cm)': 'FFD', 'FCD': 'FFD', 'fcd': 'FFD',
                'Test kV': 'kVp', 'Test kVp': 'kVp', 'Test KV': 'kVp',
                'kV': 'kVp', 'kv': 'kVp', 'KV': 'kVp',
                'kVp': 'kVp', 'kvp': 'kVp', 'KVp': 'kVp', 'KVP': 'kVp',
                'Test mAs': 'mAs', 'Test Mas': 'mAs',
                'mAs': 'mAs', 'mas': 'mAs', 'MAS': 'mAs',
                'Mean': 'Mean', 'mean': 'Mean', 'Average': 'Mean', 'average': 'Mean',
                'CoV': 'CoV', 'cov': 'CoV', 'COV': 'CoV',
                'Remarks': 'Remarks', 'remarks': 'Remarks', 'Remark': 'Remarks', 'remark': 'Remarks',
                'Tolerance Operator': 'Tolerance_Operator', 'tolerance operator': 'Tolerance_Operator',
                'Tol Operator': 'Tolerance_Operator', 'tol operator': 'Tolerance_Operator',
                'Tolerance Value (CoV)': 'Tolerance_Value', 'Tolerance Value': 'Tolerance_Value',
                'tolerance value (cov)': 'Tolerance_Value', 'tolerance value': 'Tolerance_Value',
                'Tol Value': 'Tolerance_Value', 'tol value': 'Tolerance_Value',
                'Tolerance': 'Tolerance_Value', 'tolerance': 'Tolerance_Value',
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

        const skipProtectionSurveyFields = new Set(['Date', 'Survey Date', 'survey date']);

        const sectionRowCounter: { [key: string]: number } = {};
        const testsWithMeasLabelMeta = new Set([
            'accuracyOfOperatingPotential',
            'linearityOfMaLoading',
            'linearityOfMasLoading',
            'consistencyOfRadiationOutput',
        ]);
        const dynamicMeasFieldPrefixByTest: Record<string, string> = {
            accuracyOfOperatingPotential: 'Measured_',
            linearityOfMaLoading: 'Measured_',
            linearityOfMasLoading: 'Measured_',
            consistencyOfRadiationOutput: 'Measured_',
        };
        const fixedHeadersByTest: Record<string, Set<string>> = {
            accuracyOfOperatingPotential: new Set([
                'Applied kVp', 'applied kvp', 'Applied KVp',
                'Measured 1', 'Measured 2', 'Measurement 1', 'Measurement 2',
                'Measured (mm Al)', 'Required (mm Al)', 'At kVp', 'kV', 'kVp',
                'mA 1', 'mA 2', 'mA 3', 'mA 4', 'mA 5',
                'Tolerance Sign', 'Tolerance Value (kVp)', 'Tolerance Value', 'Tolerance',
            ]),
            linearityOfMaLoading: new Set([
                'mA Station', 'kV', 'Time', 'FCD', 'FDD', 'FDD (cm)',
                'Measured mR 1', 'Measured mR 2', 'Measured mR 3', 'Measured mR 4', 'Measured mR 5',
                'Tolerance Operator', 'tolerance operator', 'Tol Operator', 'tol operator',
                'Tolerance Sign', 'tolerance sign',
                'Tolerance Value (CoL)', 'Tolerance Value', 'tolerance value (col)', 'Tol Value', 'Tolerance',
            ]),
            linearityOfMasLoading: new Set([
                'mAs Range', 'kV', 'FCD', 'FDD', 'FDD (cm)',
                'Measured mR 1', 'Measured mR 2', 'Measured mR 3', 'Measured mR 4', 'Measured mR 5',
                'Tolerance Operator', 'tolerance operator', 'Tol Operator', 'tol operator',
                'Tolerance Sign', 'tolerance sign',
                'Tolerance Value (CoL)', 'Tolerance Value', 'tolerance value (col)', 'Tol Value', 'Tolerance',
            ]),
            consistencyOfRadiationOutput: new Set([
                'FFD', 'ffd', 'FDD', 'fdd', 'FDD (cm)', 'FCD', 'fcd',
                'Test kV', 'Test kVp', 'Test KV',
                'kV', 'kv', 'KV', 'kVp', 'kvp', 'KVp', 'KVP',
                'Test mAs', 'Test Mas', 'mAs', 'mas', 'MAS',
                'Mean', 'mean', 'Average', 'average',
                'CoV', 'cov', 'COV',
                'Remarks', 'remarks', 'Remark', 'remark',
                'Tolerance Operator', 'tolerance operator', 'Tol Operator', 'tol operator',
                'Tolerance Value (CoV)', 'Tolerance Value', 'tolerance value (cov)', 'tolerance value',
                'Tol Value', 'tol value', 'Tolerance', 'tolerance',
            ]),
        };
        const isDynamicMeasHeader = (testName: string, header: string, map: Record<string, string>) => {
            const h = String(header || '').trim();
            if (!h) return false;
            if (map[h]) return false;
            if (!dynamicMeasFieldPrefixByTest[testName]) return false;
            return !fixedHeadersByTest[testName]?.has(h);
        };

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
                sectionDynamicMeasCols = [];
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
                sectionDynamicMeasCols = [];
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
                        'Value': fieldForKey === 'Tolerance_Operator'
                            ? normalizeCsvComparisonOperator(row[1])
                            : row[1],
                        'Row Index': fieldForKey.startsWith('Tolerance') ? 0 : sectionRowCounter[currentTestName],
                        'Test Name': currentTestName,
                    });
                    continue;
                }

                const matches = row.filter(c => (headerMap[currentTestName] || {})[c]).length;
                if (matches >= 2 || (matches === 1 && row.filter(c => c).length > 2)) {
                    headers = row;
                    sectionDynamicMeasCols = [];
                    const map = headerMap[currentTestName] || {};
                    headers.forEach((headerCell, idx) => {
                        if (isDynamicMeasHeader(currentTestName, headerCell, map)) {
                            sectionDynamicMeasCols.push(idx);
                        }
                    });
                    if (testsWithMeasLabelMeta.has(currentTestName)) {
                        const measLabels = sectionDynamicMeasCols
                            .map((idx) => String(row[idx] || '').trim())
                            .filter(Boolean);
                        if (measLabels.length > 0) {
                            data.push({
                                'Field Name': 'MeasColumnLabels',
                                'Value': measLabels.join(','),
                                'Row Index': 0,
                                'Test Name': currentTestName,
                            });
                        }
                    }
                    continue;
                } else if (matches === 1 && row.filter(c => c).length === 1) {
                    headers = row;
                    continue;
                }
            }

            if (isReadingTest && currentTestName && headers.length > 0) {
                // Allow RF-style key-value rows after table data (e.g. Tolerance Operator / Value)
                const fieldForKey = (headerMap[currentTestName] || {})[firstCell];
                if (fieldForKey && row[1] && row.slice(2).every(c => !c)) {
                    const value = fieldForKey === 'Tolerance_Operator'
                        ? normalizeCsvComparisonOperator(row[1])
                        : row[1];
                    data.push({
                        'Field Name': fieldForKey,
                        'Value': value,
                        'Row Index': 0,
                        'Test Name': currentTestName,
                    });
                    continue;
                }
                sectionRowCounter[currentTestName]++;
                const rowIdx = sectionRowCounter[currentTestName];
                row.forEach((value, cellIdx) => {
                    const header = headers[cellIdx];
                    let internalField = (headerMap[currentTestName] || {})[header];
                    if (!internalField && dynamicMeasFieldPrefixByTest[currentTestName]) {
                        const dynIdx = sectionDynamicMeasCols.indexOf(cellIdx);
                        if (dynIdx >= 0) {
                            internalField = `${dynamicMeasFieldPrefixByTest[currentTestName]}${dynIdx}`;
                        }
                    }
                    if (internalField && value) {
                        if (currentTestName === 'radiationProtectionSurvey' && skipProtectionSurveyFields.has(header)) {
                            return;
                        }
                        data.push({
                            'Field Name': internalField,
                            'Value': internalField === 'Tolerance_Operator'
                                ? normalizeCsvComparisonOperator(value)
                                : value,
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

    // When applyConfigFromExcel is true (file from ServiceDetails2 redirect), infer hasTimer from Excel and skip timer modal.
    const processCSVData = async (csvData: any[], applyConfigFromExcel?: boolean) => {
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

        if (Object.keys(grouped).length > 0) {
            const savedChoice = serviceId ? localStorage.getItem(`dental_intra_timer_choice_${serviceId}`) : null;
            const hasTimerSection = !!(
                grouped['accuracyOfIrradiationTime']?.length ||
                grouped['linearityOfMaLoading']?.length ||
                grouped['LinearityOfTime']?.length
            );
            const hasMasSection = !!grouped['linearityOfMasLoading']?.length;

            if (savedChoice !== null) {
                setHasTimer(JSON.parse(savedChoice));
                setShowTimerModal(false);
            } else if (hasTimerSection && !hasMasSection) {
                setHasTimer(true);
                setShowTimerModal(false);
                if (serviceId) {
                    localStorage.setItem(`dental_intra_timer_choice_${serviceId}`, JSON.stringify(true));
                }
            } else if (hasMasSection && !hasTimerSection) {
                setHasTimer(false);
                setShowTimerModal(false);
                if (serviceId) {
                    localStorage.setItem(`dental_intra_timer_choice_${serviceId}`, JSON.stringify(false));
                }
            } else if (hasTimerSection || applyConfigFromExcel) {
                setHasTimer(hasTimerSection);
                setShowTimerModal(false);
                if (serviceId) {
                    localStorage.setItem(`dental_intra_timer_choice_${serviceId}`, JSON.stringify(hasTimerSection));
                }
            }
        }

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

                const isExcel = isExcelFileUrl(csvFileUrl);

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
                await processCSVData(csvData, true);
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

            const pageData = exportRegistry?.collect() ?? {};
            const exportData: DentalIntraExportData = {};

            // 1. Accuracy of Operating Potential
            if (pageData.accuracyOfOperatingPotential != null) {
                exportData.accuracyOfOperatingPotential = pageData.accuracyOfOperatingPotential;
            } else {
                try {
                    const res = await getAccuracyOfOperatingPotentialByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.accuracyOfOperatingPotential = res.data;
                } catch (err) { console.log("AccuracyOfOperatingPotential data not found"); }
            }

            // 2. Accuracy of Irradiation Time
            if (pageData.accuracyOfIrradiationTime != null) {
                exportData.accuracyOfIrradiationTime = pageData.accuracyOfIrradiationTime;
            } else {
                try {
                    const res = await getAccuracyOfIrradiationTimeByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.accuracyOfIrradiationTime = res.data;
                } catch (err) { console.log("AccuracyOfIrradiationTime data not found"); }
            }

            // 3. Linearity of mA / mAs Loading (Dependent on timer)
            if (hasTimer === true) {
                if (pageData.linearityOfMaLoading != null) {
                    exportData.linearityOfMaLoading = pageData.linearityOfMaLoading;
                } else {
                    try {
                        const res = await getLinearityOfMaLoadingByServiceIdForDentalIntra(serviceId);
                        if (res?.data) exportData.linearityOfMaLoading = res.data;
                    } catch (err) { console.log("LinearityOfMaLoading data not found"); }
                }
            } else {
                if (pageData.linearityOfMasLoading != null) {
                    exportData.linearityOfMasLoading = pageData.linearityOfMasLoading;
                } else {
                    try {
                        const res = await getLinearityOfMasLoadingByServiceIdForDentalIntra(serviceId);
                        if (res?.data) exportData.linearityOfMasLoading = res.data;
                    } catch (err) { console.log("LinearityOfMasLoading data not found"); }
                }
            }

            // 4. Consistency of Radiation Output
            if (pageData.consistencyOfRadiationOutput != null) {
                exportData.consistencyOfRadiationOutput = pageData.consistencyOfRadiationOutput;
            } else {
                try {
                    const res = await getConsistencyOfRadiationOutputByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.consistencyOfRadiationOutput = res.data;
                } catch (err) { console.log("ConsistencyOfRadiationOutput data not found"); }
            }

            // 5. Radiation Leakage Level / Tube Housing Leakage
            if (pageData.radiationLeakageLevel != null) {
                exportData.radiationLeakageLevel = pageData.radiationLeakageLevel;
            } else {
                try {
                    const res = await getRadiationLeakageLevelByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.radiationLeakageLevel = res.data;
                } catch (err) { console.log("RadiationLeakageLevel data not found"); }
            }

            // 6. Details of Radiation Protection Survey
            if (pageData.radiationProtectionSurvey != null) {
                exportData.radiationProtectionSurvey = pageData.radiationProtectionSurvey;
            } else {
                try {
                    const res = await getRadiationProtectionSurveyByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.radiationProtectionSurvey = res.data;
                } catch (err) { console.log("RadiationProtectionSurvey data not found"); }
            }

            const hasData = Object.keys(exportData).length > 0;
            if (!hasData) {
                toast.error("No data found to export. Enter test data on this page or save test data first.", { id: "export-excel" });
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

    // MODAL POPUP — only when not coming from Excel URL (csvFileUrl)
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
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Generate QA Test Report - Dental Intra
            </h1>

            {/* Excel Actions */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="excel-upload-dental-intra"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => document.getElementById("excel-upload-dental-intra")?.click()}
                        className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition shadow"
                    >
                        {csvUploading ? "Uploading..." : "Import Excel Data"}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={handleExportToExcel}
                    disabled={csvUploading}
                    className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow ${csvUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {csvUploading ? "Exporting..." : "Export Excel"}
                </button>
            </div>

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
                        navigate(`/admin/orders/view-service-report-dental-intra?serviceId=${serviceId}`);
                    }}
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
                                    onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfMaLoadingDentalIntra: id }))}
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
                                        testId={savedTestIds.LinearityOfmAsLoadingDentalIntra || null}
                                        onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfmAsLoadingDentalIntra: id }))}
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
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, RadiationLeakageLevelDentalIntra: id }))}
                            csvData={csvDataForComponents['radiationLeakageLevel']}
                        />
                    },
                    {
                        title: "Details Of Radiation Protection",
                        component: <DetailsOfRadiationProtection
                            serviceId={serviceId}
                            testId={savedTestIds.RadiationProtectionSurveyDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, RadiationProtectionSurveyDentalIntra: id }))}
                            csvData={csvDataForComponents['radiationProtectionSurvey']}
                            initialSurveyDate={qaTestDate ?? formData.testDate ?? undefined}
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

const GenerateReportForDental: React.FC<DentalProps> = (props) => (
    <TestExportRegistryProvider>
        <GenerateReportForDentalContent {...props} />
    </TestExportRegistryProvider>
);

export default GenerateReportForDental;