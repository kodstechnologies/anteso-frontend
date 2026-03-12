// GenerateServiceReport.tsx for Lead Apron
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveReportHeaderForLeadApron, getReportHeaderForLeadApron, proxyFile } from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";
import { createLeadApronUploadableExcel, LeadApronExportData } from "./exportLeadApronToExcel";

import Standards from "../../Standards";
import Notes from "../../Notes";

// Test Component
import LeadApronTest from "./LeadApronTest";

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

const LeadApron: React.FC<{ serviceId: string; qaTestDate?: string | null; createdAt?: string | null; ulrNumber?: string | null; csvFileUrl?: string | null }> = ({ serviceId, qaTestDate, createdAt, ulrNumber, csvFileUrl }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [savedTestIds, setSavedTestIds] = useState<{
        LeadApronTest?: string;
    }>({});

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
        ulrNumber: "",
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

                // Use createdAt prop for SRF date, or fallback to firstTest createdAt
                const srfDateValue = createdAt ? (new Date(createdAt).toISOString().split("T")[0]) :
                    (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");

                // Use qaTestDate for test date, or fallback to firstTest createdAt
                const testDateValue = qaTestDate ? (new Date(qaTestDate).toISOString().split("T")[0]) :
                    (firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "");

                // Calculate due date as 2 years from test date
                let testDueDateValue = "";
                if (testDateValue) {
                    const testDate = new Date(testDateValue);
                    testDate.setFullYear(testDate.getFullYear() + 2);
                    testDueDateValue = testDate.toISOString().split("T")[0];
                }

                // Pre-fill form from service details
                setFormData(prev => ({
                    ...prev,
                    customerName: data.hospitalName,
                    address: data.hospitalAddress,
                    srfNumber: data.srfNumber,
                    srfDate: srfDateValue || prev.srfDate,
                    testReportNumber: firstTest?.qaTestReportNumber || prev.testReportNumber,
                    issueDate: prev.issueDate || new Date().toISOString().split("T")[0],
                    nomenclature: data.machineType,
                    make: prev.make || "",
                    model: data.machineModel,
                    slNumber: data.serialNumber,
                    category: prev.category || "",
                    condition: prev.condition || "OK",
                    testingProcedureNumber: prev.testingProcedureNumber || "",
                    pages: prev.pages || "",
                    testDate: testDateValue || prev.testDate,
                    testDueDate: testDueDateValue || prev.testDueDate,
                    location: data.hospitalAddress,
                    temperature: prev.temperature || "",
                    humidity: prev.humidity || "",
                    engineerNameRPId: data.engineerAssigned?.name || prev.engineerNameRPId,
                    ulrNumber: ulrNumber || prev.ulrNumber || "N/A",
                }));

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
                }));

                setTools(mappedTools || []);
            } catch (err: any) {
                console.error("Failed to load initial data:", err);
                // Set empty defaults to prevent infinite loading
                setDetails(null);
                setTools([]);
            } finally {
                setLoading(false);
            }
        };

        if (serviceId) {
            fetchInitialData();
        }
    }, [serviceId, createdAt, qaTestDate, ulrNumber]);

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

            await saveReportHeaderForLeadApron(serviceId, payload);
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
            'REPORT DETAILS': 'Report Details',
            'OPERATING PARAMETERS: TESTED ON DIRECT RADIATION': 'Operating Parameters',
            'DOSE MEASUREMENTS': 'Dose Measurements',
            'FOOTER DETAILS': 'Footer Details',
        };
        const markerUpperToInternal: Record<string, string> = Object.fromEntries(
            Object.entries(testMarkerToInternalName).map(([k, v]) => [String(k).trim().toUpperCase(), v])
        );

        const headerMap: { [test: string]: { [header: string]: string } } = {
            'Report Details': {
                'Institution Name': 'institutionName',
                'Institution City': 'institutionCity',
                'Equipment Type': 'equipmentType',
                'Equipment ID': 'equipmentId',
                'Person Testing': 'personTesting',
                'Service Agency': 'serviceAgency',
                'Test Date': 'testDate',
                'Test Duration': 'testDuration'
            },
            'Operating Parameters': {
                'FFD (cm)': 'ffd',
                'kV': 'kv',
                'mAs': 'mas'
            },
            'Dose Measurements': {
                'Parameter': 'parameter',
                'Value': 'value'
            },
            'Footer Details': {
                'Place': 'place',
                'Date': 'date',
                'Signature': 'signature',
                'Service Engineer Name': 'serviceEngineerName',
                'Service Agency Name': 'serviceAgencyName',
                'Service Agency Seal': 'serviceAgencySeal'
            }
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].map(c => String(c || '').trim());
            const firstCell = row[0];

            if (firstCell.startsWith('TEST: ')) {
                const rawTitle = firstCell.replace('TEST: ', '').trim();
                const internalBase = markerUpperToInternal[rawTitle.trim().toUpperCase()] || '';
                currentTestName = internalBase;
                isReadingTest = true;
                headers = [];
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
                // Special handling for Dose Measurements: keep rows as Parameter/Value pairs
                if (currentTestName === 'Dose Measurements' && headers.length >= 2) {
                    const parameter = row[0];
                    const value = row[1];
                    if (parameter && value) {
                        data.push({
                            'Field Name': 'doseRow',
                            'Parameter': parameter,
                            'Value': value,
                            'Test Name': currentTestName,
                        });
                    }
                } else {
                    row.forEach((value, cellIdx) => {
                        const header = headers[cellIdx];
                        const internalField = (headerMap[currentTestName] || {})[header];
                        if (internalField && value) {
                            data.push({
                                'Field Name': internalField,
                                'Value': value,
                                'Test Name': currentTestName,
                            });
                        }
                    });
                }
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

            console.log('Lead Apron CSV Data grouped:', groupedData);

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

    // Fetch and process CSV/Excel file from URL
    useEffect(() => {
        const fetchAndProcessFile = async () => {
            if (!csvFileUrl) {
                console.log('Lead Apron: No csvFileUrl provided, skipping file fetch');
                return;
            }

            console.log('Lead Apron: Fetching file from URL:', csvFileUrl);

            try {
                setCsvUploading(true);

                const urlLower = csvFileUrl.toLowerCase();
                const isExcel = urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls');

                let csvData: any[] = [];

                if (isExcel) {
                    console.log('Lead Apron: Detected Excel file, fetching through proxy...');
                    toast.loading('Loading Excel data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
                    const arrayBuffer = await blob.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                    console.log('Lead Apron: Excel file parsed, sheets:', workbook.SheetNames);

                    csvData = parseExcelToCSVFormat(workbook);
                    console.log('Lead Apron: Converted Excel to CSV format, rows:', csvData.length);
                } else {
                    console.log('Lead Apron: Detected CSV file, fetching through proxy...');
                    toast.loading('Loading CSV data from file...', { id: 'csv-loading' });

                    const response = await proxyFile(csvFileUrl);
                    const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
                    const text = await blob.text();
                    console.log('Lead Apron: CSV file fetched, length:', text.length);

                    csvData = parseCSV(text);
                }

                console.log('Lead Apron: Processed CSV data, total rows:', csvData.length);
                await processCSVData(csvData);
                toast.success('File loaded successfully!', { id: 'csv-loading' });
            } catch (error: any) {
                console.error('Lead Apron: Error fetching/processing file:', error);
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

            // Collect all test data in proper structure
            const exportData: LeadApronExportData = {};

            // Add API calls to fetch actual data here similar to other components
            // For now, we'll create a template

            // Create Excel with proper table structures
            const wb = createLeadApronUploadableExcel(exportData);

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Lead_Apron_Test_Data_${timestamp}.xlsx`;

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

    // Load report header and test IDs
    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForLeadApron(serviceId);
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
                        ulrNumber: res.data.ulrNumber || prev.ulrNumber || "N/A",
                    }));

                    // Save test IDs
                    setSavedTestIds({
                        LeadApronTest: res.data.LeadApronTest?._id || res.data.LeadApronTest,
                    });
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

    return (
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                Generate Lead Apron QA Test Report
            </h1>

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
            <Notes />

            {/* Save & View */}
            <div className="my-10 flex justify-between items-center">
                <div className="flex gap-4">
                    {/* Excel Upload Section */}
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".xlsx,.xls,.csv"
                            onChange={handleCSVUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={csvUploading}
                            className={`px-6 py-3 rounded-lg font-medium text-white transition flex items-center gap-2 ${csvUploading
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            <CloudArrowUpIcon className="w-5 h-5" />
                            {csvUploading ? "Processing..." : "Upload Excel"}
                        </button>
                        {/* <button
                            onClick={handleExportToExcel}
                            disabled={csvUploading}
                            className={`px-6 py-3 rounded-lg font-medium text-white transition ${csvUploading
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700"
                                }`}
                        >
                            {csvUploading ? "Exporting..." : "Export Template"}
                        </button> */}
                    </div>
                </div>

                <div className="flex gap-6">
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
                        onClick={() => navigate(`/admin/orders/view-service-report-lead-apron?serviceId=${serviceId}`)}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                    >
                        View Generated Report
                    </button>
                </div>
            </div>

            {/* Test Tables */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
                {[
                    {
                        title: "Lead Apron Test",
                        component: <LeadApronTest
                            serviceId={serviceId}
                            testId={savedTestIds.LeadApronTest || null}
                            csvData={csvDataForComponents}
                            refreshKey={refreshKey}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LeadApronTest: id }))}
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

export default LeadApron;

