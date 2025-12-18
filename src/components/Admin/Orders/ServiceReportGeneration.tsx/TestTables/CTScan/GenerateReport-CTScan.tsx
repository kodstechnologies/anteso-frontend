// GenerateReport-CTScan.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { getRadiationProfileWidthByServiceIdForCTScan, saveReportHeader, getReportHeaderForCTScan } from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";

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

const CTScanReport: React.FC<{ serviceId: string; qaTestDate?: string | null; createdAt?: string | null }> = ({ serviceId, qaTestDate, createdAt }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [radiationProfileTest, setRadiationProfileTest] = useState<any>(null);
    const [showTimerModal, setShowTimerModal] = useState(false); // Don't show by default
    const [hasTimer, setHasTimer] = useState<boolean | null>(null); // null = not answered
    const [savedTestIds, setSavedTestIds] = useState<{
        LinearityOfMasLoadingCTScan?: string;
    }>({});

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

    // Load report header to check for timer test and show modal if needed
    useEffect(() => {
        const loadReportHeader = async () => {
            if (!serviceId) return;
            try {
                const res = await getReportHeaderForCTScan(serviceId);
                if (res?.exists && res?.data) {
                    // Check if AccuracyOfIrradiationTime test exists
                    if (res.data.AccuracyOfIrradiationTimeCTScan) {
                        setHasTimer(true);
                        setShowTimerModal(false);
                    } else {
                        // Check localStorage for saved choice
                        const savedChoice = localStorage.getItem(`ctscan_timer_choice_${serviceId}`);
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
                    const savedChoice = localStorage.getItem(`ctscan_timer_choice_${serviceId}`);
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
                const savedChoice = localStorage.getItem(`ctscan_timer_choice_${serviceId}`);
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

    // Close modal and set timer choice
    const handleTimerChoice = (choice: boolean) => {
        setHasTimer(choice);
        setShowTimerModal(false);
        // Persist choice in localStorage
        localStorage.setItem(`ctscan_timer_choice_${serviceId}`, JSON.stringify(choice));
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

            <Standards standards={tools} />
            <Notes />

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

            {/* Test Tables */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
                {[
                    // { title: "Radiation Profile Width/Slice Thickness", component: <RadiationProfileWidth serviceId={serviceId} /> },
                    {
                        title: "Radiation Profile Width for CT Scan",
                        component: (
                            <RadiationProfileWidth
                                serviceId={serviceId}
                                testId={radiationProfileTest?._id || null}   // ← magic line
                                onTestSaved={(id: any) => console.log("Radiation Profile saved:", id)}
                            />
                        ),
                    },
                    { title: "Measurement of Operating Potential", component: <MeasurementOfOperatingPotential serviceId={serviceId} /> },
                    // Show based on timer choice
                    ...(hasTimer === true ? [
                        { title: "Measurement of mA Linearity", component: <MeasurementOfMaLinearity serviceId={serviceId} /> },
                        { title: "Timer Accuracy", component: <TimerAccuracy serviceId={serviceId} /> },
                    ] : hasTimer === false ? [
                        { title: "Linearity of mAs Loading", component: <LinearityOfMasLoading serviceId={serviceId} testId={savedTestIds.LinearityOfMasLoadingCTScan || null} onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfMasLoadingCTScan: id }))} /> },
                    ] : []),
                    { title: "Measurement of CTDI", component: <MeasurementOfCTDI serviceId={serviceId} /> },
                    { title: "Total Filtration", component: <TotalFilterationForCTScan serviceId={serviceId} /> },
                    { title: "Radiation Leakage Level", component: <RadiationLeakageLeveFromXRayTube serviceId={serviceId} /> },
                    { title: "Output Consistency", component: <ConsisitencyOfRadiationOutput serviceId={serviceId} /> },
                    { title: "Low Contrast Resolution", component: <LowContrastResolutionForCT serviceId={serviceId} /> },
                    { title: "High Contrast Resolution", component: <HighContrastResolutionForCTScan serviceId={serviceId} /> },
                    { title: "Alignment of Table/Gantry", component: <AlignmentOfTableGantry serviceId={serviceId} /> },
                    { title: "Table Position", component: <TablePosition serviceId={serviceId} /> },
                    { title: "Gantry Tilt", component: <GantryTilt serviceId={serviceId} /> },
                    { title: "Maximum Radiation Level", component: <DetailsOfRadiationProtection serviceId={serviceId} /> },



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

export default CTScanReport;