// GenerateReport-CTScan.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { getRadiationProfileWidthByServiceId, saveReportHeader } from "../../../../../../api";
import { getDetails, getTools } from "../../../../../../api";

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
import MaximumRadiationLevel from "./MaximumRadiationLevel";

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

const DentalConeBeamCT: React.FC<{ serviceId: string }> = ({ serviceId }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [details, setDetails] = useState<DetailsResponse | null>(null);
    const [tools, setTools] = useState<Standard[]>([]);
    const [radiationProfileTest, setRadiationProfileTest] = useState<any>(null);
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
                    testDate: firstTest?.createdAt ? firstTest.createdAt.split("T")[0] : "",
                    testDueDate: "",
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
        const load = async () => {
            const data = await getRadiationProfileWidthByServiceId(serviceId);
            setRadiationProfileTest(data);
        };
        if (serviceId) load();
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
                Generate CT-Scan QA Test Report
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
                    onClick={() => navigate(`/admin/orders/view-service-report?serviceId=${serviceId}`)}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    View Generated Report
                </button>
            </div>

            {/* Test Tables */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>
                {[

                    { title: "Accuracy Of Irradiation Time", component: <AccuracyOfIrradiationTime serviceId={serviceId} /> },
                    { title: "Accuracy Of Operating Potential", component: <AccuracyOfOperatingPotential serviceId={serviceId} /> },
                    { title: "Total Filteration", component: <TotalFilteration  /> },
                    { title: "Linearity Of mA/mAs Loading", component: <LinearityOfmALoading serviceId={serviceId} /> },
                    { title: "Consistency Of Radiation Output", component: <ConsistencyOfRadiationOutput  serviceId={serviceId}/> },
                    { title: "Radiation Leakage Level", component: <RadiationLeakageLevel/> },
                    { title: "Equipment Setting", component: <EquipmentSetting /> },
                    { title: "Maximum Radiation Level", component: <MaximumRadiationLevel /> },




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