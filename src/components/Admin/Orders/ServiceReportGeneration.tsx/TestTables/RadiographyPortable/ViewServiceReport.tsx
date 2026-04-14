// src/components/reports/ViewServiceReportRadiographyPortable.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForRadiographyPortable, saveReportHeader, getDetails } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF, estimateReportPages } from "../../../../../../utils/generatePDF";
import MainTestTableForRadiographyPortable from "./MainTestTableForRadiographyPortable";

interface Tool {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string
  SrNo: string;
  range: string;
  calibrationCertificateNo: string;
  calibrationValidTill: string;
}

interface Note {
  slNo: string;
  text: string;
}

interface ReportData {
  customerName: string;
  address: string;
  city?: string;
  hospitalName?: string;
  fullAddress?: string;
  leadOwner?: any;
  manufacturerName?: string;
  leadOwnerType?: string;
  leadOwnerRole?: string;
  leadOwnerName?: string;
  srfNumber: string;
  srfDate: string;
  reportULRNumber?: string;
  testReportNumber: string;
  issueDate: string;
  nomenclature: string;
  make: string;
  model: string;
  slNumber: string;
  condition: string;
  testingProcedureNumber: string;
  engineerNameRPId: string;
  rpId?: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  pages?: string;
  category: string;
  // Test documents
  AccuracyOfIrradiationTimeRadiographyPortable?: any;
  accuracyOfOperatingPotentialRadigraphyPortable?: any;
  CentralBeamAlignmentRadiographyPortable?: any;
  CongruenceOfRadiationRadioGraphyPortable?: any;
  EffectiveFocalSpotRadiographyPortable?: any;
  LinearityOfmAsLoadingRadiographyPortable?: any;
  ConsistencyOfRadiationOutputRadiographyPortable?: any;
  RadiationLeakageLevelRadiographyPortable?: any;
}

const defaultNotes: Note[] = [
  { slNo: "5.1", text: "The Test Report relates only to the above item only." },
  { slNo: "5.2", text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL." },
  { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
  { slNo: "5.4", text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats." },
  { slNo: "5.5", text: "Any error in this Report should be brought to our knowledge within 30 days from the date of this report." },
  { slNo: "5.6", text: "Results reported are valid at the time of and under the stated conditions of measurements." },
  { slNo: "5.7", text: "Name, Address & Contact detail is provided by Customer." },
];

const ViewServiceReportRadiographyPortable: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const pickUlr = (src: any): string => {
    if (!src || typeof src !== "object") return "";
    const candidates = [
      src.reportULRNumber,
      src.reportUlrNumber,
      src.reportULRNo,
      src.reportUlrNo,
      src.ulrNumber,
      src.ULRNumber,
      src.ulrNo,
      src.ULRNo,
      (src as any).report_ulr_number,
    ];
    for (const c of candidates) {
      const s = c != null ? String(c).trim() : "";
      if (s && s.toLowerCase() !== "n/a") return s;
    }
    return "";
  };

  const hasTimer = serviceId
    ? localStorage.getItem(`radiography-portable-timer-${serviceId}`) === 'true'
    : false;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [response, detailsRes] = await Promise.all([
          getReportHeaderForRadiographyPortable(serviceId),
          getDetails(serviceId),
        ]);
        const detailsData = detailsRes?.data?.data || detailsRes?.data || {};
        const srfKey = response?.data?.srfNumber || detailsData?.srfNumber || "";
        const cachedOrderBySrfRaw = srfKey ? localStorage.getItem(`order-basic-by-srf-${srfKey}`) : null;
        const cachedOrderBySrf = cachedOrderBySrfRaw ? JSON.parse(cachedOrderBySrfRaw) : {};
        const detailsFirstQaTest = Array.isArray(detailsData?.qaTests) ? detailsData.qaTests[0] : null;
        const detailsLeadOwner =
          detailsData?.leadOwner ||
          detailsData?.leadowner ||
          cachedOrderBySrf?.leadOwner ||
          null;
        const detailsLeadOwnerRole = String(
          detailsData?.leadOwnerType ||
          detailsData?.leadOwnerRole ||
          cachedOrderBySrf?.leadOwner?.role ||
          detailsLeadOwner?.role ||
          ""
        ).trim();
        const detailsLeadOwnerName = String(
          detailsData?.manufacturerName ||
          cachedOrderBySrf?.manufacturerName ||
          detailsLeadOwner?.name ||
          ""
        ).trim();

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            city: data.city || detailsData?.city || "",
            hospitalName: data.hospitalName || detailsData?.hospitalName || cachedOrderBySrf?.hospitalName || "",
            fullAddress: data.fullAddress || detailsData?.fullAddress || cachedOrderBySrf?.fullAddress || "",
            leadOwner: data.leadOwner || data.leadowner || detailsLeadOwner || "",
            manufacturerName: data.manufacturerName || detailsData?.manufacturerName || cachedOrderBySrf?.manufacturerName || "",
            leadOwnerType: data.leadOwnerType || data.leadownerType || detailsLeadOwnerRole || "",
            leadOwnerRole: data.leadOwnerRole || data.leadownerRole || detailsLeadOwnerRole || "",
            leadOwnerName: data.leadOwnerName || detailsLeadOwnerName || "",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber:
              pickUlr(data) ||
              pickUlr(detailsFirstQaTest) ||
              pickUlr(detailsData) ||
              pickUlr((detailsData as any)?.qatest) ||
              pickUlr((detailsData as any)?.serviceReport?.qatest) ||
              "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Radiography (Portable)",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: data.rpId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "At Site",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
            pages: data.pages ?? "",
            category: data.category || "",
          });

          // Extract test data from populated response
          setTestData({
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeRadiographyPortable || null,
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotentialRadigraphyPortable || null,
            centralBeamAlignment: data.CentralBeamAlignmentRadiographyPortable || null,
            congruence: data.CongruenceOfRadiationRadioGraphyPortable || null,
            effectiveFocalSpot: data.EffectiveFocalSpotRadiographyPortable || null,
            linearityOfMasLoading: data.LinearityOfmAsLoadingRadiographyPortable || null,
            outputConsistency: data.ConsistencyOfRadiationOutputRadiographyPortable || null,
            radiationLeakageLevel: data.RadiationLeakageLevelRadiographyPortable || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Radiography Portable report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `RadiographyPortable-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
      const pageCount = estimateReportPages("report-content");
      const response = await getReportHeaderForRadiographyPortable(serviceId!);
      if (response?.exists && response?.data && report) {
        const d = response.data as any;
        const payload = {
          customerName: d.customerName,
          address: d.address,
          srfNumber: d.srfNumber,
          srfDate: d.srfDate,
          testReportNumber: d.testReportNumber,
          issueDate: d.issueDate,
          nomenclature: d.nomenclature,
          make: d.make,
          model: d.model,
          slNumber: d.slNumber,
          condition: d.condition,
          testingProcedureNumber: d.testingProcedureNumber,
          engineerNameRPId: d.engineerNameRPId,
          rpId: d.rpId,
          testDate: d.testDate,
          testDueDate: d.testDueDate,
          location: d.location,
          temperature: d.temperature,
          humidity: d.humidity,
          toolsUsed: d.toolsUsed,
          notes: d.notes,
          pages: String(pageCount),
        };
        await saveReportHeader(serviceId!, payload);
        setReport((prev) => (prev ? { ...prev, pages: String(pageCount) } : null));
      }
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Radiography Portable Report...</div>;

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please generate and save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const toolsArray = report.toolsUsed || [];
  const notesArray = report.notes && report.notes.length > 0 ? report.notes : defaultNotes;
  const leadOwnerRole = String(
    report?.leadOwnerType ||
    report?.leadOwnerRole ||
    report?.leadOwner?.role ||
    report?.leadOwner?.leadOwnerType ||
    report?.leadOwner || ""
  ).trim().toLowerCase();
  const leadOwnerName = String(
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    report?.leadOwner || ""
  ).trim();
  const isManufacturerLeadOwner =
    leadOwnerRole === "manufacturer" ||
    leadOwnerName.toLowerCase() === "manufacturer" ||
    !!String(report?.manufacturerName || "").trim();
  const manufacturerDisplayName =
    report?.manufacturerName ||
    report?.leadOwnerName ||
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    "-";
  const testingSiteName = report?.hospitalName || report?.customerName || "-";
  const testingSiteAddress = report?.fullAddress || report?.address || "-";

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        {/* <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Print
        </button> */}
        <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Download PDF
        </button>
      </div>

      <div id="report-content">
        {/* PAGE 1 - MAIN REPORT */}
        <div className="bg-white print:py-0 px-8 py-2 print:px-8 print:py-2" style={{ pageBreakAfter: 'always' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4 print:mb-2">
            <img src={logoA} alt="NABL" className="h-28 print:h-20" />
            <div className="text-right">
              <table className="text-xs print:text-[7px] border border-black compact-table" style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px' }}>
                <tbody>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>SRF No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.srfNumber}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>SRF Date</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{formatDate(report.srfDate)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>ULR No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.reportULRNumber || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <img src={logo} alt="Logo" className="h-28 print:h-20" />
          </div>

          <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div>

          <h1 className="text-center text-2xl font-bold underline mb-4 print:mb-2 print:text-base" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR RADIOGRAPHY (PORTABLE) X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {isManufacturerLeadOwner && (
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the customer</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{manufacturerDisplayName}</td>
                  </tr>
                )}
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testingSiteName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testingSiteAddress}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Reference */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Details of Equipment Under Test</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make || "-"],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ["RP ID", report.rpId || "-"],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate)],
                  ["Location", report.location],
                  ["Temperature (°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
                  ["No. of Pages", report.pages || "-"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tools Used */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">4. Standards / Tools Used</h2>
            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
              <table className="w-full border-2 border-black text-xs print:text-[9px] compact-table" style={{ tableLayout: 'fixed', width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <thead className="bg-gray-200 print:bg-gray-100">
                  <tr>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '6%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sl No.</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '16%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Nomenclature</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make / Model</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Range</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Certificate No.</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.nomenclature}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.make} / {tool.model}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="text-center py-2 print:py-1" style={{ padding: '0px 1px', fontSize: '11px' }}>No tools recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section className="mb-6 print:mb-3">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">5. Notes</h2>
            <div className="ml-8 text-sm print:text-[8px] print:ml-4" style={{ fontSize: '12px', lineHeight: '1.2' }}>
              {notesArray.map(n => (
                <p key={n.slNo} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              ))}
            </div>
          </section>

          {/* Signature */}
          <div className="flex justify-between items-end mt-8 print:mt-4">
            <img src={AntesoQRCode} alt="QR" className="h-24 print:h-16" />
            <div className="text-center">
              <img src={Signature} alt="Signature" className="h-20 print:h-16 mx-auto mb-2 print:mb-1" />
              <p className="font-bold print:text-xs">Authorized Signatory</p>
            </div>
          </div>
          <footer className="text-center text-xs print:text-[8px] text-gray-600 mt-6 print:mt-3">
            <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
            <p>2nd Floor, D-290, Sector â€“ 63, Noida, New Delhi â€“ 110085</p>
            <p>Email: info@antesobiomedicalengg.com</p>
          </footer>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForRadiographyPortable testData={testData} hasTimer={hasTimer} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* 4. Congruence */}
            {testData.congruence && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Congruence of Radiation & Light Field</h3>
                {testData.congruence.techniqueFactors && (Array.isArray(testData.congruence.techniqueFactors) ? testData.congruence.techniqueFactors.length > 0 : testData.congruence.techniqueFactors) && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Technique Factors:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mAs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(testData.congruence.techniqueFactors) ? testData.congruence.techniqueFactors : [testData.congruence.techniqueFactors]).map((tf: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf?.fcd ?? "-"}</td>
                            <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf?.kv ?? "-"}</td>
                            <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf?.mas ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.congruence.congruenceMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Dimension</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Observed Shift (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Edge Shift (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% FED</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance (%)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.congruence.congruenceMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.dimension || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.observedShift || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.edgeShift || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.percentFED || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.tolerance || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.remark === "Pass" ? "text-green-600" : row.remark === "Fail" ? "text-red-600" : ""}>
                                {row.remark || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-16 print:mb-2 print:break-inside-avoid" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Central Beam Alignment</h3>

                {/* Operating parameters */}
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div className="mb-6">
                    <p className="font-semibold mb-2 text-sm text-[11px]" style={{ fontSize: '11px' }}>Operating parameters:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm mb-4 compact-table" style={{ fontSize: '11px' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3">FFD (cm)</th>
                            <th className="border border-black p-3">kV</th>
                            <th className="border border-black p-3">mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border border-black p-3">{testData.centralBeamAlignment.techniqueFactors.fcd || "-"}</td>
                            <td className="border border-black p-3">{testData.centralBeamAlignment.techniqueFactors.kv || "-"}</td>
                            <td className="border border-black p-3">{testData.centralBeamAlignment.techniqueFactors.mas || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Central Beam Alignment Evaluation */}
                <div className="mb-4">
                  <p className="text-sm mb-3 text-[11px]" style={{ fontSize: '11px' }}>
                    Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
                  </p>
                  {testData.centralBeamAlignment.observedTilt && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black p-3 font-medium w-1/2">Observed tilt</td>
                            <td className="border border-black p-3 text-center">
                              {testData.centralBeamAlignment.observedTilt.value || "-"}&deg;
                              {testData.centralBeamAlignment.observedTilt.remark && (
                                <span className={`ml-2 ${testData.centralBeamAlignment.observedTilt.remark === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}`}>
                                  {testData.centralBeamAlignment.observedTilt.remark}
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3 font-medium">Tolerance: Central Beam Alignment</td>
                            <td className="border border-black p-3 text-center">
                              {testData.centralBeamAlignment.tolerance && typeof testData.centralBeamAlignment.tolerance === 'object'
                                ? `${testData.centralBeamAlignment.tolerance.operator || "<"} ${testData.centralBeamAlignment.tolerance.value || "1.5"}°`
                                : (testData.centralBeamAlignment.tolerance || "< 1.5°")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* 5. Effective Focal Spot */}
            {testData.effectiveFocalSpot && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Effective Focal Spot Size</h3>
                <div className="mb-4 print:mb-1">
                  <div className="overflow-x-auto mb-2 print:mb-1">
                    <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '150px' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FFD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.effectiveFocalSpot.fcd || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px' }}>Focus Type</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '24%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot of Tube(mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '24%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot(mm)</th>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ width: '30%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>Tolerance:</strong>
                            </div>
                            <div>1. +{testData.effectiveFocalSpot?.toleranceCriteria?.small?.multiplier ?? 0.5} f for f &lt; {testData.effectiveFocalSpot?.toleranceCriteria?.small?.upperLimit ?? 0.8} mm</div>
                            <div>2. +{testData.effectiveFocalSpot?.toleranceCriteria?.medium?.multiplier ?? 0.4} f for {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.lowerLimit ?? 0.8} &lt;= f &lt;= {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.upperLimit ?? 1.5} mm</div>
                            <div>3. +{testData.effectiveFocalSpot?.toleranceCriteria?.large?.multiplier ?? 0.3} f for f &gt; {testData.effectiveFocalSpot?.toleranceCriteria?.large?.lowerLimit ?? 1.5} mm</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.effectiveFocalSpot.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                          const formatValue = (val: any) => {
                            if (val === undefined || val === null || val === "") return "-";
                            const numVal = typeof val === "number" ? val : parseFloat(val);
                            if (isNaN(numVal)) return "-";
                            return numVal.toFixed(1);
                          };

                          const statedNominal = formatValue(
                            spot.statedNominal ??
                            (spot.statedWidth != null && spot.statedHeight != null
                              ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                              : spot.statedWidth ?? spot.statedHeight)
                          );
                          const measuredNominal = formatValue(
                            spot.measuredNominal ??
                            (spot.measuredWidth != null && spot.measuredHeight != null
                              ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                              : spot.measuredWidth ?? spot.measuredHeight)
                          );

                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                {spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}
                              </td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={spot.remark === "Pass" || spot.remark === "PASS" ? "text-green-600 font-semibold" : spot.remark === "Fail" || spot.remark === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                  {spot.remark || "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 1. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (sec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Error (%)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                          const setTime = parseFloat(row.setTime);
                          const measuredTime = parseFloat(row.measuredTime);
                          let errorPct = "-";
                          let remark = "-";

                          if (!isNaN(setTime) && !isNaN(measuredTime) && setTime !== 0) {
                            const err = Math.abs((measuredTime - setTime) / setTime * 100);
                            errorPct = err.toFixed(2);

                            const tolVal = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value) || 10;
                            const tolOp = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";

                            let pass = false;
                            switch (tolOp) {
                              case ">": pass = err > tolVal; break;
                              case "<": pass = err < tolVal; break;
                              case ">=": pass = err >= tolVal; break;
                              case "<=": pass = err <= tolVal; break;
                              default: pass = err <= tolVal;
                            }
                            remark = pass ? "Pass" : "Fail";
                          }

                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.setTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.measuredTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px' }}>{errorPct !== "-" ? `${errorPct}%` : "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential && (() => {
              const aop = testData.accuracyOfOperatingPotential;
              const useMeasurements = Array.isArray(aop.measurements) && aop.measurements.length > 0;
              const stations = (useMeasurements && aop.mAStations?.length) ? aop.mAStations : ['10 mA', '100 mA', '200 mA'];
              const rows = useMeasurements ? aop.measurements : (aop.table2 || []);
              if (rows.length === 0) return null;
              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Accuracy of Operating Potential</h3>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                          {stations.map((label: string, j: number) => (
                            <th key={j} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row: any, i: number) => {
                          const cells = useMeasurements ? (row.measuredValues || []) : [row.ma10, row.ma100, row.ma200];
                          const appliedKvp = useMeasurements ? row.appliedKvp : row.setKV;
                          const avgKvp = useMeasurements ? row.averageKvp : row.avgKvp;
                          const remark = row.remarks || "-";
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{appliedKvp || "-"}</td>
                              {stations.map((_: string, j: number) => (
                                <td key={j} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{cells[j] != null && cells[j] !== '' ? cells[j] : "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{avgKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={remark === "PASS" || remark === "Pass" ? "text-green-600" : remark === "FAIL" || remark === "Fail" ? "text-red-600" : ""}>
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {aop.tolerance && (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Tolerance:</strong> {((sign: any) => {
                          if (!sign) return "±";
                          const s = String(sign).toLowerCase().replace(/\s+/g, "");
                          if (s.includes("plus") && s.includes("minus")) return "±";
                          if (s === "both" || s === "±") return "±";
                          if (s === "plus" || s === "+") return "+";
                          if (s === "minus" || s === "-") return "-";
                          return sign;
                        })(aop.tolerance?.sign)} {aop.tolerance.value}{aop.tolerance.type === 'percent' ? '%' : ' kVp'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 6. Total Filtration (layout aligned with Radiography Fixed view) */}
            {testData.accuracyOfOperatingPotential?.totalFiltration && (() => {
              const aop = testData.accuracyOfOperatingPotential;
              const tf = aop.totalFiltration || {};
              if (!(tf.atKvp || tf.required || tf.measured)) return null;
              const ft = aop.filtrationTolerance || {};
              const kvp = parseFloat(tf.atKvp ?? "");
              const measured = parseFloat(tf.required ?? "");
              const t1 = parseFloat(ft.kvThreshold1 ?? "70");
              const t2 = parseFloat(ft.kvThreshold2 ?? "100");
              let reqTol = NaN;
              if (!isNaN(kvp)) {
                if (kvp < t1) reqTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                else if (kvp <= t2) reqTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                else reqTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
              }
              const filtRemark = (!isNaN(measured) && !isNaN(reqTol)) ? (measured >= reqTol ? "PASS" : "FAIL") : "-";
              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                  <div style={{ marginTop: "6px" }}>
                    <h3 className="text-xl font-bold mb-2 print:mb-1 print:text-sm" style={{ marginBottom: "4px", fontSize: "12px" }}>6. Total Filtration</h3>
                    <table className="w-full border border-black text-sm compact-table" style={{ fontSize: "11px", borderCollapse: "collapse", borderSpacing: "0" }}>
                      <tbody>
                        {[
                          ["At kVp", `${tf.atKvp || "-"} kVp`],
                          ["Measured Total Filtration", `${tf.required || "-"} mm Al`],
                          ["Required (Tolerance)", !isNaN(reqTol) ? `≥ ${reqTol} mm Al` : "-"],
                          ["Result", filtRemark],
                        ].map(([label, val]) => (
                          <tr key={label}>
                            <th scope="row" className="border border-black font-medium text-left" style={{ width: "50%", padding: "2px 6px", fontSize: "11px" }}>{label}</th>
                            <td className="border border-black text-center" style={{ padding: "0px 4px", fontSize: "11px" }}>
                              {label === "Result" ? (
                                <span className={String(val) === "PASS" ? "text-green-600 font-bold" : String(val) === "FAIL" ? "text-red-600 font-bold" : ""}>
                                  {val}
                                </span>
                              ) : (
                                val
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{ fontSize: "10px", marginTop: "3px", color: "#444" }}>
                      <strong>Tolerance criteria: </strong>
                      {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} | {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} ≤ kV ≤ {ft.kvThreshold2 ?? "100"} | {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                    </p>
                  </div>
                </div>
              );
            })()}





            {/* 6. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading && (() => {
              const isMaLoading = testData.linearityOfMasLoading?.table1?.[0]?.time !== undefined &&
                testData.linearityOfMasLoading?.table1?.[0]?.time !== null &&
                String(testData.linearityOfMasLoading?.table1?.[0]?.time).trim() !== "";

              return (
                <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>
                    {isMaLoading ? "7. Linearity of mA Loading" : "7. Linearity of mAs Loading"}
                  </h3>
                  {/* Test Conditions - table format */}
                  {testData.linearityOfMasLoading.table1 && testData.linearityOfMasLoading.table1.length > 0 && (
                    <div className="mb-6 bg-gray-50 p-4 rounded border print:p-1" style={{ marginBottom: '4px' }}>
                      <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '2px', fontSize: '11px' }}>Test Conditions:</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', maxWidth: '400px' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ fontSize: '11px' }}>FDD (cm)</th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ fontSize: '11px' }}>kV</th>
                              {isMaLoading && <th className="border border-black p-2 print:p-1 text-center" style={{ fontSize: '11px' }}>Time (sec)</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {testData.linearityOfMasLoading.table1.map((row: any, idx: number) => (
                              <tr key={idx} className="text-center">
                                <td className="border border-black p-2 print:p-1">{row.fcd ?? "-"}</td>
                                <td className="border border-black p-2 print:p-1">{row.kv ?? "-"}</td>
                                {isMaLoading && <td className="border border-black p-2 print:p-1">{row.time ?? "-"}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {testData.linearityOfMasLoading.table2?.length > 0 && (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '12%', padding: '0px 2px', fontSize: '11px' }}>
                              {isMaLoading ? "mA" : "mAs Range"}
                            </th>
                            <th colSpan={testData.linearityOfMasLoading.measHeaders?.length || 0} className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '11px' }}>
                              Output (mGy)
                            </th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '12%', padding: '0px 2px', fontSize: '11px' }}>Avg Output</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '12%', padding: '0px 2px', fontSize: '11px' }}>
                              {isMaLoading ? "X (mGy/mA)" : "X (mGy/mAs)"}
                            </th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '8%', padding: '0px 2px', fontSize: '11px' }}>X MAX</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '8%', padding: '0px 2px', fontSize: '11px' }}>X MIN</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '8%', padding: '0px 2px', fontSize: '11px' }}>CoL</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '10%', padding: '0px 2px', fontSize: '11px' }}>Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            {testData.linearityOfMasLoading.measHeaders?.map((header: string, idx: number) => (
                              <th key={idx} className="border border-black p-1 print:p-0.5 text-xs text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                {header || `Meas ${idx + 1}`}
                              </th>
                            ))}
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.linearityOfMasLoading.table2.map((row: any, i: number) => {
                            const xMax = testData.linearityOfMasLoading?.xMax;
                            const xMin = testData.linearityOfMasLoading?.xMin;
                            const col = testData.linearityOfMasLoading?.col;
                            const remarks = testData.linearityOfMasLoading?.remarks;
                            const isFirstRow = i === 0;
                            const rowSpan = testData.linearityOfMasLoading.table2.length;
                            const measHeaders = testData.linearityOfMasLoading?.measHeaders || [];
                            const measuredOutputs = row.measuredOutputs ?? row.readings ?? [];

                            const formatValue = (val: any) => {
                              if (val === undefined || val === null) return "-";
                              const str = String(val).trim();
                              return str === "" || str === "â€”" || str === "undefined" || str === "null" ? "-" : str;
                            };

                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mAsApplied || "-"}</td>
                                {measHeaders.map((_: string, idx: number) => (
                                  <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                    {formatValue(measuredOutputs[idx])}
                                  </td>
                                ))}
                                <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.average || "-"}</td>
                                <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.x || "-"}</td>
                                {isFirstRow && (
                                  <td rowSpan={rowSpan} className="border border-black p-2 print:p-1 align-middle font-medium bg-yellow-50 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {formatValue(xMax)}
                                  </td>
                                )}
                                {isFirstRow && (
                                  <td rowSpan={rowSpan} className="border border-black p-2 print:p-1 align-middle font-medium bg-yellow-50 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {formatValue(xMin)}
                                  </td>
                                )}
                                {isFirstRow && (
                                  <td rowSpan={rowSpan} className="border border-black p-2 print:p-1 align-middle font-medium bg-yellow-50 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {formatValue(col)}
                                  </td>
                                )}
                                {isFirstRow && (
                                  <td rowSpan={rowSpan} className="border border-black p-2 print:p-1 align-middle text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                    <span className={remarks === "Pass" || remarks === "PASS" ? "text-green-600 font-semibold" : remarks === "Fail" || remarks === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                      {formatValue(remarks)}
                                    </span>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {testData.linearityOfMasLoading.tolerance && (
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm">
                        <strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || "â‰¤"} {testData.linearityOfMasLoading.tolerance || "0.1"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 7. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. Consistency of Radiation Output</h3>
                {/* FDD small table */}
                {testData.outputConsistency.ffd?.value && (
                  <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.outputConsistency.ffd.value}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.outputRows?.length > 0 && (() => {
                  const rows = testData.outputConsistency.outputRows;
                  const measCount = Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
                  const tolVal = parseFloat(testData.outputConsistency.tolerance?.value ?? '0.05') || 0.05;
                  const tolOp = testData.outputConsistency.tolerance?.operator ?? '<=';

                  const getVal = (o: any): number => {
                    if (o == null) return NaN;
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                            {Array.from({ length: measCount }, (_, i) => (
                              <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Meas {i + 1}</th>
                            ))}
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (XÌ„)</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>CoV</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
                            const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                            const avgDisplay = avg !== null ? avg.toFixed(4) : (row.avg || '-');
                            let covDisplay = '-';
                            let remark = row.remark || '-';
                            if (avg !== null && avg > 0) {
                              const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
                              const cov = Math.sqrt(variance) / avg;
                              if (isFinite(cov)) {
                                covDisplay = cov.toFixed(3);
                                const passes = (tolOp === '<=' || tolOp === '<') ? cov <= tolVal : cov >= tolVal;
                                remark = passes ? 'Pass' : 'Fail';
                              }
                            } else if (row.cv || row.cov) {
                              covDisplay = row.cv || row.cov;
                            }
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || '-'}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || '-'}</td>
                                {Array.from({ length: measCount }, (_, j) => {
                                  const raw = (row.outputs ?? [])[j];
                                  const display = raw != null ? (typeof raw === 'object' && 'value' in raw ? raw.value : String(raw)) : '-';
                                  return (
                                    <td key={j} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{display || '-'}</td>
                                  );
                                })}
                                <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{avgDisplay}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{covDisplay}</td>
                                <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                  <span className={remark === 'Pass' ? 'text-green-600' : remark === 'Fail' ? 'text-red-600' : ''}>
                                    {remark}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value || "0.05"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 9. Tube Housing Leakage (aligned with Radiography Fixed view) */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                <h3 className="text-xl font-bold mb-2 print:mb-1 print:text-sm" style={{ marginBottom: "4px", fontSize: "12px" }}>9. Tube Housing Leakage</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: "4px" }}>
                  <div className="overflow-x-auto mb-2 print:mb-1">
                    <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: "10px", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: "0", maxWidth: "400px" }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>FDD (cm)</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>kV</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>mA</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Time (Sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center" style={{ height: "auto", minHeight: "0", lineHeight: "1.0", padding: "0", margin: "0" }}>
                          <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>{testData.radiationLeakageLevel.fcd || testData.radiationLeakageLevel.settings?.fcd || "100"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>{testData.radiationLeakageLevel.kv || testData.radiationLeakageLevel.settings?.kv || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>{testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>{testData.radiationLeakageLevel.time || testData.radiationLeakageLevel.settings?.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <p style={{ fontSize: "10px", marginBottom: "4px" }}>
                  <strong>Workload:</strong> {testData.radiationLeakageLevel.workload || "-"} {testData.radiationLeakageLevel.workloadUnit || "mA·min/week"}
                </p>
                {testData.radiationLeakageLevel.leakageMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-2 print:mb-1" style={{ marginBottom: "4px" }}>
                    <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: "10px", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: "0" }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ width: "15%", padding: "0px 2px", fontSize: "10px", verticalAlign: "middle" }}>Location</th>
                          <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Exposure Level (mR/hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ padding: "0px 2px", fontSize: "10px", verticalAlign: "middle" }}>Result (mR in 1 hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ padding: "0px 2px", fontSize: "10px", verticalAlign: "middle" }}>Result (mGy in 1 hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ padding: "0px 2px", fontSize: "10px", verticalAlign: "middle" }}>Remarks</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Left</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Right</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Front</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Back</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>Top</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationLeakageLevel.leakageMeasurements.map((row: any, i: number) => {
                          const maValue = parseFloat(testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "0");
                          const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");
                          const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                          const rowMax = values.length > 0 ? Math.max(...values) : 0;
                          let calcMR = "-";
                          let calcMGy = "-";
                          let remark: string = row.remark || "-";
                          if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                            const resMR = (workloadValue * rowMax) / (60 * maValue);
                            calcMR = resMR.toFixed(3);
                            calcMGy = (resMR / 114).toFixed(4);
                            if (remark === "-" || !remark) {
                              remark = (resMR / 114) <= (parseFloat(testData.radiationLeakageLevel.toleranceValue) || 1.0) ? "Pass" : "Fail";
                            }
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: "auto", minHeight: "0", lineHeight: "1.0", padding: "0", margin: "0" }}>
                              <th scope="row" className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px", fontWeight: 700 }}>{row.location || "-"}</th>
                              {(["left", "right", "front", "back", "top"] as const).map((k) => (
                                <td key={k} className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>{row[k] || "-"}</td>
                              ))}
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: "0px 2px", fontSize: "10px" }}>{calcMR}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: "0px 2px", fontSize: "10px" }}>{calcMGy}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>{remark}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {(() => {
                  const leak = testData.radiationLeakageLevel;
                  const maValue = parseFloat(leak.ma || leak.settings?.ma || "0");
                  const workloadValue = parseFloat(leak.workload || "0");
                  const getSummary = (locName: string) => {
                    const row = leak.leakageMeasurements?.find((m: any) => m.location === locName);
                    if (!row) return null;
                    const vals = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                    const rowMax = vals.length > 0 ? Math.max(...vals) : 0;
                    const resMR = (workloadValue * rowMax) / (60 * maValue);
                    return { rowMax, resMR, resMGy: resMR / 114 };
                  };
                  const tubeSummary = getSummary("Tube Housing");
                  const collimatorSummary = getSummary("Collimator");
                  return (
                    <div style={{ marginTop: "6px" }}>
                      <div style={{ border: "1px solid #888", padding: "4px 8px", marginBottom: "4px", background: "#fafafa" }}>
                        <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>Calculation Formula:</p>
                        <p style={{ fontSize: "10px", textAlign: "center", fontFamily: "monospace", border: "1px dashed #999", padding: "2px" }}>
                          Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                        </p>
                        <p style={{ fontSize: "9px", marginTop: "2px", color: "#555", fontStyle: "italic" }}>
                          Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2" style={{ display: "flex", gap: "8px" }}>
                        {tubeSummary && (
                          <div style={{ flex: 1, border: "0.1px solid #666", padding: "4px", fontSize: "10px", minWidth: "140px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "2px" }}>Tube Housing Summary:</p>
                            <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <strong>{tubeSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                        {collimatorSummary && (
                          <div style={{ flex: 1, border: "0.1px solid #666", padding: "4px", fontSize: "10px", minWidth: "140px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "2px" }}>Collimator Summary:</p>
                            <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <strong>{collimatorSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: "10px", marginTop: "4px", border: "0.1px solid #666", padding: "2px 6px" }}>
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt; <strong>{leak.toleranceValue || "1"} mGy ({parseFloat(leak.toleranceValue || "1") * 114} mR) in one hour.</strong>
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32">
                No detailed test results available for this report.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
          @page { margin: 0.5cm; size: A4; }
          table, tr, td, th { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .compact-table {
            font-size: 11px !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
          }
          .compact-table td, .compact-table th {
            padding: 0px 1px !important;
            font-size: 11px !important;
            line-height: 1.0 !important;
            min-height: 0 !important;
            height: auto !important;
            vertical-align: middle !important;
            border-color: #000000 !important;
            text-align: center !important;
          }
          table, td, th {
            border-color: #000000 !important;
          }
          table td, table th {
            text-align: center !important;
          }
          .force-small-text {
            font-size: 7px !important;
          }
          .force-small-text td, .force-small-text th {
            font-size: 7px !important;
            padding: 0px 1px !important;
            line-height: 1.0 !important;
          }
          .compact-table tr {
            height: auto !important;
            min-height: 0 !important;
            line-height: 1.0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          thead { display: table-header-group; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
          table { 
            border-collapse: collapse; 
            border-spacing: 0;
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          table td, table th {
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          table.border-2, table[class*="border-2"] {
            border-width: 1px !important;
          }
          table td.border-2, table th.border-2,
          table td[class*="border-2"], table th[class*="border-2"] {
            border-width: 1px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportRadiographyPortable;

