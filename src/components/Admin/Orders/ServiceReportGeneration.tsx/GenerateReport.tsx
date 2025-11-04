import React, { useState } from "react";
import Standards from "./Standards";
import Notes from "./Notes";
import { useNavigate } from "react-router-dom";
import AccuracyOfOperatingPotential from "./TestTables/AccuracyOfOperatingPotential";
export interface Standard {
    slNumber: string;
    nomenclature: string;
    make: string;
    model: string;
    range: string;
    certificate: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
}

const GenerateReport: React.FC = () => {
    // ✅ Only keep standards here
    const [standards, setStandards] = useState<Standard[]>([
        {
            slNumber: "1",
            nomenclature: "Radiation Meter",
            make: "Thermo Fisher",
            model: "RadEye G20",
            range: "0–1000 µSv/h",
            certificate: "Cert-001",
            calibrationCertificateNo: "CAL12345",
            calibrationValidTill: "2026-05-30",
        },
        {
            slNumber: "2",
            nomenclature: "Ion Chamber Survey Meter",
            make: "Fluke",
            model: "451P",
            range: "0–5 R/h",
            certificate: "Cert-002",
            calibrationCertificateNo: "CAL67890",
            calibrationValidTill: "2025-12-20",
        },
    ]);
    const navigate = useNavigate();

    return (
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Generate QA Test Report
            </h1>

            {/* 1️⃣ Name and Address of Customer */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-blue-700 mb-3">
                    1. Name and Address of Customer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name
                        </label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Address
                        </label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                </div>
            </section>

            {/* 2️⃣ Customer Reference */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-blue-700 mb-3">
                    2. Customer Reference
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            2.1 SRF Number
                        </label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dated
                        </label>
                        <input type="date" className="border p-2 rounded-md w-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            2.2 Test Report Number
                        </label>
                        <input type="text" className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Date
                        </label>
                        <input type="date" className="border p-2 rounded-md w-full" />
                    </div>
                </div>
            </section>

            {/* 3️⃣ Details of Device Under Test */}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                            </label>
                            <input
                                type={
                                    label.toLowerCase().includes("date")
                                        ? "date"
                                        : label.toLowerCase().includes("temperature") ||
                                            label.toLowerCase().includes("humidity")
                                            ? "number"
                                            : "text"
                                }
                                className="border p-2 rounded-md w-full"
                            />
                        </div>
                    ))}
                </div>
            </section>

            <Standards standards={standards} />
            <Notes />
            <div className="mt-8 flex justify-end gap-4">


                <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() =>navigate('/admin/orders/view-service-report')}
                >
                    View Generated Report
                </button>
            </div>
            <AccuracyOfOperatingPotential/>
        </div>
    );
};

export default GenerateReport;