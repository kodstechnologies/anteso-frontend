// GenerateReport-DentalHandHeld.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { getDetails, getTools, saveReportHeader, getReportHeaderForDentalHandHeld } from "../../../../../../api";

// Test-table imports
import AccuracyOfOperatingPotentialAndTime from "./AccuracyOfOperatingPotentialAndTime";
import LinearityOfTime from "./LinearityOfTime";
import ReproducibilityOfRadiationOutput from "./ReproducibilityOfRadiationOutput";
import TubeHousingLeakage from "./TubeHousingLeakage";
import RadiationLeakageLevel from "./RadiationLeakageLevel";


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

interface DentalHandHeldProps {
    serviceId: string;
}

const GenerateReportForDentalHandHeld: React.FC<DentalHandHeldProps> = ({ serviceId }) => {
    const navigate = useNavigate();

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
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
                    testDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
                    testDueDate: "",
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

    // Load report header and test IDs
    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForDentalHandHeld(serviceId);
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

                    // Save test IDs
                    setSavedTestIds({
                        AccuracyOfOperatingPotentialAndTimeDentalHandHeld: res.data.AccuracyOfOperatingPotentialAndTimeDentalHandHeld?._id || res.data.AccuracyOfOperatingPotentialAndTimeDentalHandHeld,
                        LinearityOfTimeDentalHandHeld: res.data.LinearityOfTimeDentalHandHeld?._id || res.data.LinearityOfTimeDentalHandHeld,
                        ReproducibilityOfRadiationOutputDentalHandHeld: res.data.ReproducibilityOfRadiationOutputDentalHandHeld?._id || res.data.ReproducibilityOfRadiationOutputDentalHandHeld,
                        TubeHousingLeakageDentalHandHeld: res.data.TubeHousingLeakageDentalHandHeld?._id || res.data.TubeHousingLeakageDentalHandHeld,
                        RadiationLeakageTestDentalHandHeld: res.data.RadiationLeakageTestDentalHandHeld?._id || res.data.RadiationLeakageTestDentalHandHeld,
                    });
                }
            } catch (err) {
                console.log("No report header found or failed to load:", err);
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
                Generate QA Test Report - Dental Hand-held
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
                    className={`px-6 py-2 rounded-md font-medium text-white transition ${
                        saving ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                    {saving ? "Saving..." : "Save Report Header"}
                </button>
                <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => navigate(`/admin/orders/view-service-report-dental-hand-held?serviceId=${serviceId}`)}
                >
                    View Generated Report
                </button>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>

                {[
                    { title: "Accuracy Of Irradiation Time", component: <AccuracyOfOperatingPotentialAndTime serviceId={serviceId} /> },
                    { title: "Linearity Of Time", component: <LinearityOfTime serviceId={serviceId} /> },
                    { title: "Reproducibility Of Radiation Output", component: <ReproducibilityOfRadiationOutput serviceId={serviceId} /> },
                    { title: "Tube Housing Leakage", component: <TubeHousingLeakage serviceId={serviceId} /> },
                    // { title: "Radiation Leakage Level", component: <RadiationLeakageLevel serviceId={serviceId} /> },
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
        </div>
    );
};

export default GenerateReportForDentalHandHeld;
