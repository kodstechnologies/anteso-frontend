// src/components/reports/GenerateServiceReportDentalHandHeld.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    getReportHeaderForDentalHandHeld,
    saveReportHeaderForDentalHandHeld,
    getTools,
    getDetails
} from "../../../../../../api";
import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel
} from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Components
import MainTestTableForDentalHandHeld from "./MainTestTableForDentalHandHeld";
import AccuracyOfOperatingPotential from "./AccuracyOfOperatingPotential";
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import LinearityOfTime from "./LinearityOfTime";
import LinearityOfmALoading from "./LinearityOfmALoading";
import LinearityOfMasLoading from "./LinearityOfMasLoading";
import ConsistencyOfRadiationOutput from "./ConsistencyOfRadiationOutput";
import TubeHousingLeakage from "./TubeHousingLeakage";
import { CheckCircle2, ChevronUpIcon, FileText, Loader2, Save } from "lucide-react";
import axios from "axios";

interface DentalHandHeldProps {
    serviceId: string;
    qaTestDate?: string | null;
}

const GenerateReportForDentalHandHeld: React.FC<DentalHandHeldProps> = ({ serviceId, qaTestDate }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [isSavingHeader, setIsSavingHeader] = useState(false);
    const [headerSaved, setHeaderSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // CSV/Excel State
    const [csvFileUrl, setCsvFileUrl] = useState<string | null>(null);
    const [csvDataForComponents, setCsvDataForComponents] = useState<any[]>([]);
    const [isParsingCsv, setIsParsingCsv] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvDataVersion, setCsvDataVersion] = useState(0);

    // Tools state
    const [tools, setTools] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        customerName: "",
        address: "",
        srfNumber: "",
        srfDate: "",
        testReportNumber: "",
        issueDate: "",
        nomenclature: "Dental X-Ray (Hand-held)",
        make: "",
        model: "",
        slNumber: "",
        condition: "Satisfactory",
        testingProcedureNumber: "",
        pages: "",
        testDate: qaTestDate || "",
        testDueDate: "",
        location: "",
        temperature: "",
        humidity: "",
        engineerNameRPId: "",
        toolsUsed: [] as any[],
        csvFileUrl: ""
    });

    // --- CSV PARSING LOGIC START ---
    const parseHorizontalData = (jsonData: any[][]) => {
        if (!jsonData || jsonData.length === 0) return [];

        const headerRowIndex = jsonData.findIndex(row => row.includes('Sr No') || row.includes('Test Name') || row.includes('Field Name'));
        if (headerRowIndex === -1) return [];

        const headers = jsonData[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = jsonData.slice(headerRowIndex + 1);

        const headerMap: { [key: string]: number } = {};
        headers.forEach((h, i) => { if (h) headerMap[h] = i; });

        return dataRows.map(row => {
            const obj: any = {};
            headers.forEach((h, i) => {
                if (h) obj[h] = row[i] !== undefined ? String(row[i]).trim() : '';
            });
            return obj;
        }).filter(obj => obj['Test Name'] || obj['Field Name']);
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
        setCsvDataForComponents(csvData);
        setCsvDataVersion(prev => prev + 1);
        console.log('DentalHandHeld: Processed CSV data for components:', csvData);
    };

    const fetchAndParseFile = async (url: string) => {
        if (!url) return;
        setIsParsingCsv(true);
        try {
            const urlWithoutQuery = url.split('?')[0].split('#')[0];
            const isExcel = urlWithoutQuery.toLowerCase().endsWith('.xlsx') || urlWithoutQuery.toLowerCase().endsWith('.xls');

            if (isExcel) {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const workbook = XLSX.read(response.data, { type: 'buffer' });
                const parsed = parseExcelToCSVFormat(workbook);
                processCSVData(parsed);
            } else {
                const response = await axios.get(url);
                const parsed = parseCSV(response.data);
                processCSVData(parsed);
            }
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            toast.error("Failed to parse CSV/Excel data");
        } finally {
            setIsParsingCsv(false);
        }
    };
    // --- CSV PARSING LOGIC END ---

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!serviceId) return;
            try {
                setLoading(true);

                // Fetch service details for basic info
                const serviceRes = await getDetails(serviceId);
                const sData = serviceRes?.data;

                // Fetch tools
                const toolsRes = await getTools(serviceId);

                if (sData) {
                    const firstTest = sData.qaTests?.[0];
                    const rawTestDate = qaTestDate || firstTest?.createdAt || "";
                    const baseTestDate = rawTestDate ? rawTestDate.split("T")[0] : "";

                    setFormData(prev => ({
                        ...prev,
                        customerName: sData.hospitalName || prev.customerName,
                        address: sData.hospitalAddress || prev.address,
                        srfNumber: sData.srfNumber || prev.srfNumber,
                        srfDate: baseTestDate || prev.srfDate,
                        testReportNumber: firstTest?.qaTestReportNumber || prev.testReportNumber,
                        issueDate: new Date().toISOString().split("T")[0],
                        nomenclature: sData.machineType || prev.nomenclature,
                        model: sData.machineModel || prev.model,
                        slNumber: sData.serialNumber || prev.slNumber,
                        location: sData.hospitalAddress || prev.location,
                        testDate: baseTestDate || prev.testDate,
                        engineerNameRPId: sData.engineerAssigned?.name || prev.engineerNameRPId,
                        csvFileUrl: sData.csvFileUrl || ""
                    }));

                    if (sData.csvFileUrl) {
                        setCsvFileUrl(sData.csvFileUrl);
                        fetchAndParseFile(sData.csvFileUrl);
                    }
                }

                // Map tools data
                if (toolsRes?.data?.toolsAssigned) {
                    const mapped = toolsRes.data.toolsAssigned.map((t: any, idx: number) => ({
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
                    }));
                    setTools(mapped);
                }

                // Fetch existing report header
                const reportRes = await getReportHeaderForDentalHandHeld(serviceId);
                if (reportRes?.exists && reportRes?.data) {
                    const rData = reportRes.data;
                    setFormData(prev => ({
                        ...prev,
                        ...rData,
                        srfDate: rData.srfDate ? rData.srfDate.split('T')[0] : prev.srfDate,
                        issueDate: rData.issueDate ? rData.issueDate.split('T')[0] : prev.issueDate,
                        testDate: rData.testDate ? rData.testDate.split('T')[0] : prev.testDate,
                        testDueDate: rData.testDueDate ? rData.testDueDate.split('T')[0] : prev.testDueDate,
                    }));
                    setHeaderSaved(true);
                    if (rData.csvFileUrl && !sData?.csvFileUrl) {
                        setCsvFileUrl(rData.csvFileUrl);
                        fetchAndParseFile(rData.csvFileUrl);
                    }
                }
            } catch (err) {
                console.error("Error loading initial data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [serviceId, qaTestDate]);

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

            await saveReportHeaderForDentalHandHeld(serviceId, payload);
            setHeaderSaved(true);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
            toast.success("Report header saved!");
        } catch (err: any) {
            setSaveError(err?.response?.data?.message || "Failed to save report header");
            toast.error("Failed to save report header");
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            toast.error('Failed to upload file: ' + (error.message || 'Unknown error'), { id: 'csv-upload' });
        } finally {
            setCsvUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-8 text-center">
                <p className="text-lg">Loading report data…</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dental Hand-held Service Report</h1>
                    <p className="text-gray-500 mt-1">Generate and manage QA test reports</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.open(`/admin/orders/view-dental-hand-held?serviceId=${serviceId}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                    >
                        <FileText className="w-4 h-4" />
                        View Report
                    </button>
                    <button
                        onClick={handleSaveHeader}
                        disabled={isSavingHeader}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg shadow-blue-200 disabled:bg-blue-400"
                    >
                        {isSavingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {headerSaved ? "Update Header" : "Save Header"}
                    </button>
                </div>
            </div>

            {/* Header Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 italic">
                    <h2 className="text-lg font-semibold text-gray-800">Report Header Information</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Basic Fields */}
                    {Object.entries(formData).map(([key, value]) => {
                        if (key === 'toolsUsed' || key === 'csvFileUrl') return null;
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                <input
                                    type={key.toLowerCase().includes('date') ? 'date' : 'text'}
                                    value={value as string}
                                    onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {isParsingCsv && (
                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 p-4 rounded-lg animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Auto-populating data from {csvFileUrl?.split('/').pop()}...</span>
                </div>
            )}

            {/* QA Tests Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Quality Assurance Tests</h2>
                </div>

                {[
                    { title: "Main Test Results (Summary Table)", component: <MainTestTableForDentalHandHeld testData={csvDataForComponents} /> },
                    { title: "Accuracy Of Operating Potential", component: <AccuracyOfOperatingPotential serviceId={serviceId} csvData={csvDataForComponents} /> },
                    { title: "Accuracy Of Irradiation Time", component: <AccuracyOfIrradiationTime serviceId={serviceId} csvData={csvDataForComponents} /> },
                    { title: "Linearity Of Time", component: <LinearityOfTime serviceId={serviceId} csvData={csvDataForComponents} /> },
                    { title: "Linearity Of mA Loading", component: <LinearityOfmALoading serviceId={serviceId} csvData={csvDataForComponents} /> },
                    { title: "Linearity Of mAs Loading", component: <LinearityOfMasLoading serviceId={serviceId} csvData={csvDataForComponents} /> },
                    { title: "Consistency of Radiation Output", component: <ConsistencyOfRadiationOutput serviceId={serviceId} csvData={csvDataForComponents} /> },
                    { title: "Tube Housing Leakage", component: <TubeHousingLeakage serviceId={serviceId} /> },
                ].map((test, idx) => (
                    <Disclosure key={idx}>
                        {({ open }) => (
                            <div className={`rounded-xl border transition-all duration-200 ${open ? 'border-blue-200 bg-blue-50/10' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left font-semibold text-gray-800 focus:outline-none">
                                    <span className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${open ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {idx + 1}
                                        </div>
                                        {test.title}
                                    </span>
                                    <ChevronUpIcon className={`w-6 h-6 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : 'text-gray-400'}`} />
                                </DisclosureButton>
                                <DisclosurePanel className="px-6 pb-6 pt-2 border-t border-gray-100">
                                    {test.component}
                                </DisclosurePanel>
                            </div>
                        )}
                    </Disclosure>
                ))}
            </div>
        </div>
    );
};

export default GenerateReportForDentalHandHeld;
