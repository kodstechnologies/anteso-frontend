import React, { useState } from "react";
import Standards from "./Standards";
import Notes from "./Notes";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// Import all test tables
import AccuracyOfOperatingPotential from "./TestTables/AccuracyOfOperatingPotential";
import LinearityOfmAsLoading from "./TestTables/LinearityOfmAsLoading";
import LowContrastResolution from "./TestTables/LowContrastResolution";
import HighContrastResolution from "./TestTables/HighContrastResolution";
import ExposureRateTableTop from "./TestTables/ExposureRateTableTop";
import RadiationLeakageLevel from "./TestTables/RadiationLeakageLevel";
import EffectiveFocalspotMeasurement from "./TestTables/EffectiveFocalspotMeasurement";
import ConsisitencyOfRadiationOutput from "./TestTables/ConsisitencyOfRadiationOutput";
import RadiationProfileWidth from "./TestTables/RadiationProfileWidth";

export interface Standard {
    slNumber: string;
    nomenclature: string;
    make: string;
    model: string;
    SrNo: string;
    range: string;
    certificate: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    uncertainity: any;
}

const GenerateReport: React.FC = () => {
    const [standards] = useState<Standard[]>([
        {
            slNumber: "1",
            nomenclature: "Radiation Meter",
            make: "Thermo Fisher",
            model: "RadEye G20",
            SrNo: "123",
            range: "0–1000 µSv/h",
            certificate: "Cert-001",
            calibrationCertificateNo: "CAL12345",
            calibrationValidTill: "2026-05-30",
            uncertainity: "yes",
        },
        {
            slNumber: "2",
            nomenclature: "Ion Chamber Survey Meter",
            make: "Fluke",
            model: "451P",
            SrNo: "123",
            range: "0–5 R/h",
            certificate: "Cert-002",
            calibrationCertificateNo: "CAL67890",
            calibrationValidTill: "2025-12-20",
            uncertainity: "yes",
        },
    ]);

    const navigate = useNavigate();

    // Define accordion items
    const accordionItems = [
        { title: "Accuracy of Operating Potential", component: <AccuracyOfOperatingPotential /> },
        { title: "Linearity of mAs Loading", component: <LinearityOfmAsLoading /> },
        { title: "Low Contrast Resolution", component: <LowContrastResolution /> },
        { title: "High Contrast Resolution", component: <HighContrastResolution /> },
        { title: "Exposure Rate (Table Top)", component: <ExposureRateTableTop /> },
        { title: "Radiation Leakage Level", component: <RadiationLeakageLevel /> },
        { title: "Effective Focal Spot Measurement", component: <EffectiveFocalspotMeasurement /> },
        { title: "Consistency of Radiation Output", component: <ConsisitencyOfRadiationOutput /> },
        { title: "Radiation Profile Width/Slice Thickness", component: <RadiationProfileWidth /> },
    ];

    return (
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Generate QA Test Report
            </h1>

            {/* 1. Name and Address of Customer */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-blue-700 mb-3">
                    1. Name and Address of Customer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                </div>
            </section>

            {/* 2. Customer Reference */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-blue-700 mb-3">2. Customer Reference</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2.1 SRF Number</label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dated</label>
                        <input type="date" className="border p-2 rounded-md w-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2.2 Test Report Number</label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                        <input type="date" className="border p-2 rounded-md w-full" />
                    </div>
                </div>
            </section>

            {/* 3. Details of Device Under Test */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-blue-700 mb-3">
                    3. Details of the Device Under Test
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        "Nomenclature",
                        "Make",
                        "Model",
                        "Serial Number",
                        "Condition of Test Item",
                        "Testing Procedure Number",
                        "No. of Pages",
                        "QA Test Date",
                        "QA Test Due Date",
                        "Testing Done At Location",
                        "Temperature (°C)",
                        "Humidity (RH %)",
                    ].map((label, i) => (
                        <div key={i}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input
                                type={
                                    label.toLowerCase().includes("date")
                                        ? "date"
                                        : label.toLowerCase().includes("temperature") || label.toLowerCase().includes("humidity")
                                            ? "number"
                                            : "text"
                                }
                                className="border p-2 rounded-md w-full"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Standards & Notes */}
            <Standards standards={standards} />
            <Notes />

            {/* View Report Button */}
            <div className="mt-8 flex justify-end gap-4">
                <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => navigate('/admin/orders/view-service-report')}
                >
                    View Generated Report
                </button>
            </div>

            <div className="mt-10 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tests</h2>

                {accordionItems.map((item, index) => (
                    <Disclosure key={index} defaultOpen={index === 0}>
                        {({ open }) => (
                            <>
                                <Disclosure.Button
                                    className={`w-full flex justify-between items-center px-4 py-3 text-left font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 ${open ? "rounded-b-none" : ""
                                        }`}
                                >
                                    <span>{item.title}</span>
                                    <ChevronDownIcon
                                        className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${open ? "rotate-180" : ""
                                            }`}
                                    />
                                </Disclosure.Button>

                                <Disclosure.Panel className="border border-t-0 border-gray-300 rounded-b-lg p-6 bg-gray-50">
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

export default GenerateReport;