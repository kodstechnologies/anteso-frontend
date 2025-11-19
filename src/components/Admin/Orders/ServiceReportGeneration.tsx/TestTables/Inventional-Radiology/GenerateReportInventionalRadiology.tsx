// GenerateReport-InventionalRadiology.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Standards from "../../Standards";
import Notes from "../../Notes";

import { getDetails, getTools } from "../../../../../../api"; // <-- adjust the relative path

// ─────────────────────────────────────────────────────────────────────────────
// Test-table imports (adjust paths as per your folder structure)
import AccuracyOfIrradiationTime from "./AccuracyOfIrradiationTime";
import CentralBeamAlignment from "./CentralBeamAlignment";
import EffectiveFocalspotMeasurement from "./EffectiveFocalspotMeasurement";
import AccuracyOfOperatingPotential from "../AccuracyOfOperatingPotential";
import TotalFilteration from "../TotalFilteration";
import LinearityOfmAsLoading from "../LinearityOfmAsLoading";
import ConsisitencyOfRadiationOutput from "../CTScan/ConsisitencyOfRadiationOutput";
import LowContrastResolution from "../LowContrastResolution";
import HighContrastResolution from "../HighContrastResolution";
import ExposureRateTableTop from "./ExposureRateTableTop";
import TubeHousingLeakage from "./TubeHousingLeakage";
// Add more test components specific to Interventional Radiology if needed

export interface Standard {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string;
  SrNo: string;
  range: string;
  certificate: string | null;
  calibrationCertificateNo: string;
  calibrationValidTill: string; // ISO string → we’ll slice to YYYY-MM-DD
  uncertainity: string; // ← now a user-editable string
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
    calibrationValidTill: string; // ISO
    range: string;
    certificate: string | null;
  }>;
}

interface InventionalRadiologyProps {
  serviceId: string;
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */
const InventionalRadiology: React.FC<InventionalRadiologyProps> = ({ serviceId }) => {
  const navigate = useNavigate();

  /* --------------------------- STATE ------------------------------------ */
  const [details, setDetails] = useState<DetailsResponse | null>(null);
  const [tools, setTools] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------- FETCH DATA ------------------------------- */
  useEffect(() => {
    if (!serviceId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [detRes, toolRes] = await Promise.all([
          getDetails(serviceId),
          getTools(serviceId),
        ]);

        setDetails(detRes.data);
        const mapped: Standard[] = toolRes.data.toolsAssigned.map(
          (t: any, idx: number) => ({
            slNumber: String(idx + 1),
            nomenclature: t.nomenclature,
            make: t.manufacturer,
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

  /* --------------------------- RENDER ----------------------------------- */
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
        Generate QA Test Report - Interventional Radiology
      </h1>

      {/* ───────────────────── 1. Customer Name & Address ───────────────────── */}
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
              defaultValue={details.hospitalName}
              className="border p-2 rounded-md w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Address
            </label>
            <input
              type="text"
              defaultValue={details.hospitalAddress}
              className="border p-2 rounded-md w-full"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* ───────────────────── 2. Customer Reference ───────────────────── */}
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
              defaultValue={details.srfNumber}
              className="border p-2 rounded-md w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dated
            </label>
            <input
              type="date"
              defaultValue={formatDate(details.qaTests[0]?.createdAt ?? "")}
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
              defaultValue={details.qaTests[0]?.qaTestReportNumber ?? "N/A"}
              className="border p-2 rounded-md w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input type="date" className="border p-2 rounded-md w-full" />
          </div>
        </div>
      </section>

      {/* ───────────────────── 3. Device Under Test ───────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          3. Details of the Device Under Test
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nomenclature", value: details.machineType },
            { label: "Make", value: "" },
            { label: "Model", value: details.machineModel },
            { label: "Serial Number", value: details.serialNumber },
            { label: "Condition of Test Item", value: "" },
            { label: "Testing Procedure Number", value: "" },
            { label: "No. of Pages", value: "" },
            { label: "QA Test Date", value: formatDate(details.qaTests[0]?.createdAt ?? ""), type: "date" },
            { label: "QA Test Due Date", value: "", type: "date" },
            { label: "Testing Done At Location", value: details.hospitalAddress },
            { label: "Temperature (°C)", value: "", type: "number" },
            { label: "Humidity (RH %)", value: "", type: "number" },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type ?? "text"}
                defaultValue={field.value}
                className="border p-2 rounded-md w-full"
                readOnly={field.label === "Nomenclature" || field.label === "Model" || field.label === "Serial Number"}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────── Standards (Tools) ───────────────────── */}
      <Standards standards={tools} />

      {/* ───────────────────── Notes ───────────────────── */}
      <Notes />

      {/* ───────────────────── View Report Button ───────────────────── */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => navigate("/admin/orders/view-service-report")}
        >
          View Generated Report
        </button>
      </div>

      {/* <div className="mt-10 space-y-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Tests</h2>

        <div className="space-y-8">
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
            AccuracyOfIrradiationTime
            </h3>
            <AccuracyOfIrradiationTime serviceId={serviceId} />
          </div>


          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              CentralBeamAlignment
            </h3>
            <CentralBeamAlignment serviceId={serviceId} />
          </div>

    
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
             EffectiveFocalspotMeasurement
            </h3>
            <EffectiveFocalspotMeasurement serviceId={serviceId} />
          </div>

  
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              AccuracyOfOperatingPotential
            </h3>
            <AccuracyOfOperatingPotential serviceId={serviceId} />
          </div>

          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
             TotalFilteration
            </h3>
            <TotalFilteration serviceId={serviceId} />
          </div>


          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
             LinearityOfmAsLoading
            </h3>
            <LinearityOfmAsLoading serviceId={serviceId} />
          </div>

     
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ConsisitencyOfRadiationOutput
            </h3>
            <ConsisitencyOfRadiationOutput serviceId={serviceId} />
          </div>

         
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              LowContrastResolution
            </h3>
            <LowContrastResolution serviceId={serviceId} />
          </div>

    
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              HighContrastResolution
            </h3>
            <HighContrastResolution serviceId={serviceId} />
          </div>


          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ExposureRateTableTop
            </h3>
            <ExposureRateTableTop serviceId={serviceId} />
          </div>

          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              TubeHousingLeakage
            </h3>
            <TubeHousingLeakage serviceId={serviceId} />
          </div>

         
        </div>
      </div> */}
    </div>
  );
};

export default InventionalRadiology;