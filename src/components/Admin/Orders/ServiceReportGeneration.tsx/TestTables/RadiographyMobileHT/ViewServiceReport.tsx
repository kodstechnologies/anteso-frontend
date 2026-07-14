// src/components/reports/ViewServiceReportRadiographyMobileHT.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForRadiographyMobileHT, getDetails, getTools } from "../../../../../../api";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForRadiographyMobileHT from "./MainTestTableForRadiographyMobileHT";
import { normalizeCsvComparisonOperator } from "../shared/parseRadiographyStyleTableFormat";
import { ReportPdfPageHeader } from "../RadiographyFixed/component/Header";
import { ReportPdfPageFooter } from "../RadiographyFixed/component/Footer";
import { ReportPdfPageFooterEnd } from "../RadiographyFixed/component/FooterEnd";
import { ReportPdfPageNoteQR } from "../RadiographyFixed/component/NoteQR";
import { ReportPdfPageDeclaration } from "../RadiographyFixed/component/Declaration";

interface Tool {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string;
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
  qrCode?: string;
  notes?: Note[];
  category: string;
  qaTestSubmittedAt?: string;
  // Test documents
  AccuracyOfIrradiationTimeRadiographyMobileHT?: any;
  accuracyOfOperatingPotentialRadiographyMobileHT?: any;
  CentralBeamAlignmentRadiographyMobileHT?: any;
  CongruenceOfRadiationRadiographyMobileHT?: any;
  EffectiveFocalSpotRadiographyMobileHT?: any;
  LinearityOfmAsLoadingRadiographyMobileHT?: any;
  ConsistencyOfRadiationOutputRadiographyMobileHT?: any;
  RadiationLeakageLevelRadiographyMobileHT?: any;
  RadiationProtectionSurveyRadiographyMobileHT?: any;
  TotalFilterationRadiographyMobileHT?: any;
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

const ViewServiceReportRadiographyMobileHT: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const hasTimer = serviceId
    ? localStorage.getItem(`radiography-mobile-ht-timer-${serviceId}`) === 'true'
    : false;
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
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeaderForRadiographyMobileHT(serviceId),
          getDetails(serviceId).catch(() => null),
          getTools(serviceId).catch(() => null),
        ]);
        const normalizeTools = (raw: any): Tool[] => {
          if (!Array.isArray(raw)) return [];
          return raw.map((tool: any, index: number) => ({
            slNumber: String(tool?.slNumber || index + 1),
            nomenclature: tool?.nomenclature || "-",
            make: tool?.make || tool?.manufacturer || "-",
            model: tool?.model || "-",
            SrNo: tool?.SrNo || tool?.srNo || tool?.serialNumber || "-",
            range: tool?.range || "-",
            calibrationCertificateNo:
              tool?.calibrationCertificateNo || tool?.certificateNo || tool?.certificateNumber || "-",
            calibrationValidTill: tool?.calibrationValidTill || tool?.validTill || "",
          }));
        };
        const mergeTools = (primary: Tool[], secondary: Tool[]): Tool[] => {
          const seen = new Set<string>();
          const merged: Tool[] = [];
          const addUnique = (tool: Tool) => {
            const key = [
              String(tool.nomenclature || "").toLowerCase().trim(),
              String(tool.make || "").toLowerCase().trim(),
              String(tool.model || "").toLowerCase().trim(),
              String(tool.SrNo || "").toLowerCase().trim(),
              String(tool.calibrationCertificateNo || "").toLowerCase().trim(),
            ].join("|");
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(tool);
            }
          };
          primary.forEach(addUnique);
          secondary.forEach(addUnique);
          return merged.map((tool, idx) => ({ ...tool, slNumber: String(idx + 1) }));
        };
        const reportData =
          response?.data?.data ||
          (response?.exists ? response?.data : null) ||
          (response?.success && response?.data ? response.data : null) ||
          (response?.data && typeof response.data === "object" ? response.data : null);

        if (reportData) {
          const data = reportData;
          const headerTools = normalizeTools(
            data.toolsUsed || data.tools || data.standards || data.toolsAssigned
          );
          const assignedTools = normalizeTools(toolsRes?.data?.toolsAssigned || []);
          const mergedTools = mergeTools(headerTools, assignedTools);
          const detailsData = detailsRes?.data?.data || detailsRes?.data || {};
          const srfKey = data?.srfNumber || detailsData?.srfNumber || "";
          const cachedOrderBySrfRaw = srfKey ? localStorage.getItem(`order-basic-by-srf-${srfKey}`) : null;
          const cachedOrderBySrf = cachedOrderBySrfRaw ? JSON.parse(cachedOrderBySrfRaw) : {};
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
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Radiography (Mobile) with HT",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: data.rpId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: mergedTools,
            notes: data.notes || defaultNotes,
            qrCode: data.qrCode || "",

            category: data.category || "",
            qaTestSubmittedAt: data.qaTestSubmittedAt || "",
          });

          // Extract test data from populated response
          setTestData({
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeRadiographyMobileHT || null,
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotentialRadiographyMobileHT || null,
            centralBeamAlignment: data.CentralBeamAlignmentRadiographyMobileHT || null,
            congruence: data.CongruenceOfRadiationRadiographyMobileHT || null,
            effectiveFocalSpot: data.EffectiveFocalSpotRadiographyMobileHT || null,
            linearityOfMasLoading: data.LinearityOfmAsLoadingRadiographyMobileHT || null,
            outputConsistency: data.ConsistencyOfRadiationOutputRadiographyMobileHT || null,
            radiationLeakageLevel: data.RadiationLeakageLevelRadiographyMobileHT || null,
            radiationProtectionSurvey: data.RadiationProtectionSurveyRadiographyMobileHT || null,
            totalFilteration: data.TotalFilterationRadiographyMobileHT || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Radiography Mobile with HT report:", err);
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
        filename: `RadiographyMobileHT-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Radiography Mobile with HT Report...</div>;

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
    report?.leadOwner ||
    ""
  ).trim().toLowerCase();
  const leadOwnerName = String(
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    report?.leadOwner ||
    ""
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
  const todayDate = formatDate(new Date().toISOString());
  const extractCity = (value?: string) => {
    if (!value) return "";
    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "";
  };
  const customerCity = report?.city || extractCity(report?.address);
  const placeValue = customerCity || report?.location || "Noida";

  const ReportPage: React.FC<{ children: React.ReactNode; isLast?: boolean; className?: string }> = ({
    children,
    isLast = false,
    className = "",
  }) => (
    <div
      className={`bg-white shadow-2xl print:shadow-none ${isLast ? "report-pdf-last-page-shell" : "report-pdf-page-shell"} ${className}`}
      style={{
        pageBreakAfter: "always",
        display: "flex",
        flexDirection: "column",
        width: "210mm",
        boxSizing: "border-box",
        minHeight: "297mm",
        margin: "20px auto",
        padding: "15mm 20mm",
      }}
    >
      <ReportPdfPageHeader report={report as any} formatDate={formatDate} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        {children}
      </div>
      {isLast ? (
        <ReportPdfPageFooterEnd todayDate={todayDate} customerCity={placeValue} />
      ) : (
        <ReportPdfPageFooter todayDate={todayDate} customerCity={placeValue} />
      )}
    </div>
  );
  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="font-bold mb-1 text-[12px]">{title}</h2>
  );

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

      <div id="report-content" className="fixed-report-pdf">
        <ReportPage>
          <h1 className="text-center font-bold underline mb-2" style={{ fontSize: "15px" }}>
            QA TEST REPORT FOR RADIOGRAPHY (MOBILE) WITH HT X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: "9px" }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>
          <section className="mb-3 text-[10px]">
            <SectionTitle title="1. Customer Details" />
            <div className="space-y-[2px]">
              {[
                ...(isManufacturerLeadOwner ? [["Name of the customer", manufacturerDisplayName]] : []),
                ["Name of the testing site", testingSiteName],
                ["Address of the testing site", testingSiteAddress],
              ].map(([label, value], index) => (
                <div key={String(label)} className="flex">
                  <div className="w-6 text-right pr-1 font-semibold">1.{index + 1}</div>
                  <div className="w-64 font-semibold">{label}</div>
                  <div className="px-1 font-semibold">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-3 text-[10px]">
            <SectionTitle title="2. Customer Reference" />
            <div className="space-y-1">
              <div className="flex">
                <div className="w-6 text-right pr-1">2.1</div>
                <div className="w-64">SRF No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{report.srfNumber}</div>
                <div className="w-20">SRF Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(report.srfDate || "")}</div>
              </div>
              <div className="flex">
                <div className="w-6 text-right pr-1">2.2</div>
                <div className="w-64">Test Report No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{report.testReportNumber}</div>
                <div className="w-20">Issue Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(report.issueDate || "")}</div>
              </div>
            </div>
          </section>
          <section className="mb-3 text-[10px]">
            <SectionTitle title="3. Details Of Device Under Test" />
            <div className="space-y-[2px]">
              {[
                ["Nomenclature / Type of equipment", report.nomenclature],
                ["Make", report.make || "-"],
                ["Model", report.model],
                ["Sl. No.", report.slNumber],
                ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                ["Condition of Test Item", report.condition],
                ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                ["Engineer’s Name", report.engineerNameRPId || "-"],
                ["RP ID", report.rpId || "-"],
                ["QA Test Date", formatDate(report.testDate || "")],
                ["QA Test Due Date", formatDate(report.testDueDate || "")],
                ["Testing done at Location", report.location],
                ["Temperature (°C)", report.temperature || "-"],
                ["Humidity in RH (%)", report.humidity || "-"],
              ].map(([label, value], index) => (
                <div key={String(label)} className="flex">
                  <div className="w-6 text-right pr-1">3.{index + 1}</div>
                  <div className="w-64">{label}</div>
                  <div className="px-1">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-3">
            <h2 className="font-bold mb-4" style={{ fontSize: "12px" }}>4. Standards / Tools Used</h2>
            <table className="compact-table" style={{ fontSize: "11px", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: "0", width: "100%", border: "0.1px solid #666", textAlign: "center" }}>
              <thead>
                <tr>
                  {["Sl No.", "Nomenclature", "Make", "Model", "Sr. No.", "Range", "Certificate No.", "Valid Till"].map((h, i) => (
                    <th key={h} style={{ fontWeight: 700, border: "0.1px solid #666", fontSize: "9px", lineHeight: "1.2", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", padding: "3px 4px", width: ["6%", "18%", "12%", "12%", "10%", "10%", "16%", "16%"][i] }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? (
                  toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{i + 1}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.nomenclature}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.make || "-"}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.model || "-"}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.SrNo}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.range}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.calibrationCertificateNo}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>No tools recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
          <div style={{ marginTop: "auto" }}>
            <ReportPdfPageNoteQR report={report as any} />
          </div>
        </ReportPage>
        <ReportPage className="test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForRadiographyMobileHT testData={testData} hasTimer={hasTimer} />
          </div>
        </ReportPage>
        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <ReportPage className="test-section">
          <div className="report-pdf-last-main max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>

 {/* 4. Congruence of Radiation & Light Field */}
 {testData.congruence && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Congruence of Radiation & Light Field</h3>
                {(testData.congruence.techniqueFactors && (Array.isArray(testData.congruence.techniqueFactors) ? testData.congruence.techniqueFactors.length > 0 : true)) && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '10px' }}>Technique Factors:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(testData.congruence.techniqueFactors)
                            ? testData.congruence.techniqueFactors.map((tf: any, idx: number) => (
                              <tr key={idx}>
                                <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf.fcd ?? tf.ffd ?? "-"}</td>
                                <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf.kv ?? "-"}</td>
                                <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf.mas ?? "-"}</td>
                              </tr>
                            ))
                            : (
                              <tr>
                                <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{(testData.congruence.techniqueFactors as any)?.fcd ?? (testData.congruence.techniqueFactors as any)?.ffd ?? "-"}</td>
                                <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{(testData.congruence.techniqueFactors as any)?.kv ?? "-"}</td>
                                <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{(testData.congruence.techniqueFactors as any)?.mas ?? "-"}</td>
                              </tr>
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {testData.congruence.congruenceMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
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
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
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
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Central Beam Alignment</h3>
                {/* Operating parameters */}
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div className="mb-6">
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Operating parameters:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm mb-4 compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FFD (cm)</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.techniqueFactors.fcd || "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.techniqueFactors.kv || "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.techniqueFactors.mas || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Central Beam Alignment Evaluation */}
                <div className="mb-4">
                  <p className="text-sm mb-3 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '4px' }}>
                    Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
                  </p>
                  {testData.centralBeamAlignment.observedTilt && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Observed Tilt</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {testData.centralBeamAlignment.observedTilt.value || "-"}
                              {testData.centralBeamAlignment.observedTilt.value && testData.centralBeamAlignment.observedTilt.value !== "-" ? "°" : ""}
                            </td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {testData.centralBeamAlignment.tolerance?.operator || "="} {testData.centralBeamAlignment.tolerance?.value || "1.5"}°
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
                {/* FFD small table */}
                <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.effectiveFocalSpot.fcd || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}></th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot of Tube</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot (Nominal)</th>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ width: '34%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <div><strong>Tolerance:</strong></div>
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
                            const numVal = typeof val === 'number' ? val : parseFloat(val);
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
                              <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>{spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={
                                  spot.remark === "Pass" || spot.remark === "PASS" ? "text-green-600" :
                                    spot.remark === "Fail" || spot.remark === "FAIL" ? "text-red-600" : ""
                                }>
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
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Test Conditions:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FCD (cm)</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (() => {
                  const tolOp = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                  const tolVal = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "10");
                  const calcError = (set: string, meas: string): string => {
                    const s = parseFloat(set);
                    const m = parseFloat(meas);
                    if (isNaN(s) || isNaN(m) || s === 0) return "-";
                    return Math.abs(((m - s) / s) * 100).toFixed(2);
                  };
                  const getRemark = (errorPct: string): string => {
                    if (errorPct === "-" || isNaN(tolVal)) return "-";
                    const err = parseFloat(errorPct);
                    if (isNaN(err)) return "-";
                    switch (tolOp) {
                      case ">": return err > tolVal ? "PASS" : "FAIL";
                      case "<": return err < tolVal ? "PASS" : "FAIL";
                      case ">=": return err >= tolVal ? "PASS" : "FAIL";
                      case "<=": return err <= tolVal ? "PASS" : "FAIL";
                      default: return "-";
                    }
                  };
                  return (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                          const error = calcError(String(row.setTime ?? ""), String(row.measuredTime ?? ""));
                          const remark = getRemark(error);
                          return (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error !== "-" ? `${error}%` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>{remark}</span>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  );
                })()}
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "10"}%
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* 2. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Accuracy of Operating Potential</h3>
                {testData.accuracyOfOperatingPotential.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>10 mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>100 mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>200 mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma10 || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma100 || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma200 || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
                                {row.remarks || "-"}
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
            {/* 2.5. Total Filtration */}
            {testData.totalFilteration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Accuracy of Operating Potential</h3>
                {/* Accuracy of Operating Potential Table */}
                {testData.totalFilteration.measurements?.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    {/* <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Accuracy of Operating Potential</h4> */}
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                            {testData.totalFilteration.mAStations?.map((ma: string, idx: number) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{ma}</th>
                            ))}
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.totalFilteration.measurements.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                              {testData.totalFilteration.mAStations?.map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredValues?.[idx] || "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600 font-semibold" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Tolerance */}
                    {testData.totalFilteration.tolerance && (
                      <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                          <strong>Tolerance:</strong> {testData.totalFilteration.tolerance.sign || "±"} {testData.totalFilteration.tolerance.value || "-"}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {/* Total Filtration Result */}
                {testData.totalFilteration.totalFiltration && (() => {
                  const tf = testData.totalFilteration.totalFiltration;
                  // NOTE: The UI stores the measured mm Al value in tf.required (field naming quirk)
                  // and the kVp in tf.appliedKV
                  const kvp = parseFloat(tf.appliedKV ?? "");
                  const measured = parseFloat(tf.required ?? "");

                  // Derive required tolerance from kVp thresholds (AERB standard)
                  let requiredTol = NaN;
                  if (!isNaN(kvp)) {
                    if (kvp < 70) requiredTol = 1.5;
                    else if (kvp <= 100) requiredTol = 2.0;
                    else requiredTol = 2.5;
                  }

                  const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                    ? (measured >= requiredTol ? "PASS" : "FAIL")
                    : "-";

                  return (
                    <div className="rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                      <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6.Total Filtration</h3>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.appliedKV || "-"} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.required || "-"} mm Al</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              {!isNaN(requiredTol) ? `≥ ${requiredTol} mm Al` : "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
                            <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>
                                {filtrationRemark}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      {/* Filtration Tolerance Reference */}
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                        <span className="font-semibold">Tolerance criteria: </span>
                        1.5 mm Al for kV &lt; 70 |&nbsp;
                        2.0 mm Al for 70 ≤ kV ≤ 100 |&nbsp;
                        2.5 mm Al for kV &gt; 100
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

           
        
            {/* 6. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading && (
              <div className="mb-16 print:mb-12 test-section">
                <h3 className="text-lg font-bold mb-4 print:mb-1 print:text-sm" style={{ fontSize: '14px', marginBottom: '4px' }}>
                  {hasTimer ? "7. Linearity of mA Loading" : "7. Linearity of mAs Loading"}
                </h3>
                {/* Test Conditions */}
                {testData.linearityOfMasLoading.table1 && testData.linearityOfMasLoading.table1.length > 0 && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 rounded border print:p-1" style={{ marginBottom: '4px' }}>
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '4px' }}>Test Conditions:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>FCD (cm)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>kV</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Time (sec)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.linearityOfMasLoading.table1.map((row: any, idx: number) => (
                            <tr key={idx} className="text-center">
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.fcd ?? "-"}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.kv ?? "-"}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.time ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {testData.linearityOfMasLoading.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          {/* Row 1: Top half of "rowspans" and the main "colspans" */}
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>mA</th>
                          <th colSpan={testData.linearityOfMasLoading.measHeaders?.length || 0} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                            Output (mGy)
                          </th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X (mGy/mA)</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MAX</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MIN</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>CoL</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Remarks</th>
                        </tr>
                        <tr>
                          {/* Row 2: Bottom half of "rowspans" (empty) and sub-headers */}
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          {testData.linearityOfMasLoading.measHeaders?.map((header: string, idx: number) => (
                            <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              {header || `Meas ${idx + 1}`}
                            </th>
                          ))}
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const rows = testData.linearityOfMasLoading.table2;
                          const tolVal = parseFloat(testData.linearityOfMasLoading.tolerance ?? '0.1') || 0.1;
                          const tolOp = testData.linearityOfMasLoading.toleranceOperator ?? '<';

                          const formatV = (val: any) => {
                            if (val === undefined || val === null) return '-';
                            const str = String(val).trim();
                            return str === '' || str === '—' || str === 'undefined' || str === 'null' ? '-' : str;
                          };

                          // Recompute X per row and summary values
                          const xValues: number[] = [];
                          const processedRows = rows.map((row: any) => {
                            const outputs = (row.measuredOutputs ?? row.readings ?? [])
                              .map((v: any) => parseFloat(v))
                              .filter((v: number) => !isNaN(v) && v > 0);
                            const avg = outputs.length > 0
                              ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length
                              : null;
                            const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : (row.average || '—');

                            const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? '');
                            const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                            const midMas = match
                              ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
                              : parseFloat(mAsLabel) || 0;

                            const x = avg !== null && midMas > 0 ? avg / midMas : null;
                            const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : (row.x || '—');
                            if (x !== null) xValues.push(parseFloat(x.toFixed(4)));

                            return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                          });

                          const hasData = xValues.length > 0;
                          const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : (formatV(testData.linearityOfMasLoading?.xMax));
                          const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : (formatV(testData.linearityOfMasLoading?.xMin));
                          const colNum = hasData && xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
                            ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                            : 0;
                          const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : (formatV(testData.linearityOfMasLoading?.col));

                          let pass = false;
                          if (col !== '—' && col !== '-') {
                            const colVal2 = parseFloat(col);
                            switch (tolOp) {
                              case '<': pass = colVal2 < tolVal; break;
                              case '>': pass = colVal2 > tolVal; break;
                              case '<=': pass = colVal2 <= tolVal; break;
                              case '>=': pass = colVal2 >= tolVal; break;
                              case '=': pass = Math.abs(colVal2 - tolVal) < 0.0001; break;
                              default: pass = colVal2 <= tolVal;
                            }
                          }
                          const remarks = (col !== '—' && col !== '-') ? (pass ? 'Pass' : 'Fail') : (formatV(testData.linearityOfMasLoading?.remarks));

                          return processedRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>{formatV(row.mAsApplied ?? row.mAsRange)}</td>
                              {testData.linearityOfMasLoading.measHeaders?.map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                  {formatV((row.measuredOutputs ?? row.readings)?.[idx])}
                                </td>
                              ))}
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row._avgDisplay}</td>
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row._xDisplay}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{xMax}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{xMin}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{col}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                    <span className={remarks === 'Pass' ? 'text-green-600 font-semibold' : remarks === 'Fail' ? 'text-red-600 font-semibold' : ''} style={{ fontSize: '10px' }}>
                                      {remarks}
                                    </span>
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.linearityOfMasLoading.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border">
                    <p className="text-sm print:text-[10px]" style={{ fontSize: '10px' }}>
                      <strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || "≤"} {testData.linearityOfMasLoading.tolerance || "0.1"}
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* 7. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. Consistency of Radiation Output</h3>
                {/* FFD small table */}
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
                  const savedHeaders = Array.isArray(testData.outputConsistency.headers) && testData.outputConsistency.headers.length > 0
                    ? testData.outputConsistency.headers
                    : null;
                  const measCount = savedHeaders?.length ?? Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
                  const headerLabels = savedHeaders ?? Array.from({ length: measCount }, (_, i) => `Meas ${i + 1}`);
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
                            {headerLabels.map((label: string, i: number) => (
                              <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{label}</th>
                            ))}
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (X̄)</th>
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
                            } else if (row.cv) {
                              covDisplay = row.cv;
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
            {/* 8. Radiation Leakage Level */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. Tube Housing Leakage</h3>

                {/* Test Conditions Table */}
                <div className="mb-4 print:mb-1">
                  <div className="overflow-x-auto mb-2 print:mb-1">
                    <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FDD (cm)</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mA</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Time (Sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.fcd || testData.radiationLeakageLevel.settings?.fcd || "100"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.kv || testData.radiationLeakageLevel.settings?.kv || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.time || testData.radiationLeakageLevel.settings?.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Workload Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                  <div>
                    <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                      <strong>Workload:</strong> {testData.radiationLeakageLevel.workload || "-"} {testData.radiationLeakageLevel.workloadUnit || "mA·min/week"}
                    </p>
                  </div>
                </div>

                {/* Exposure Level Table */}
                {testData.radiationLeakageLevel.leakageMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ width: '15%', padding: '0px 2px', fontSize: '10px' }}>Location</th>
                          <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Exposure Level (mR/hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mR in 1 hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mGy in 1 hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remarks</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Left</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Right</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Front</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Back</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Top</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationLeakageLevel.leakageMeasurements.map((row: any, i: number) => {
                          const maValue = parseFloat(testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "0");
                          const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");
                          const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                          const rowMax = values.length > 0 ? Math.max(...values) : 0;
                          let calculatedMR = "-";
                          let calculatedMGy = "-";
                          let remark = row.remark || "-";
                          if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                            const resMR = (workloadValue * rowMax) / (60 * maValue);
                            calculatedMR = resMR.toFixed(3);
                            calculatedMGy = (resMR / 114).toFixed(4);
                            if (remark === "-" || !remark) {
                              const tolVal = parseFloat(testData.radiationLeakageLevel.toleranceValue) || 1.0;
                              remark = (resMR / 114) <= tolVal ? "Pass" : "Fail";
                            }
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.left || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.right || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.front || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.back || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.top || "-"}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMR}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMGy}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>{remark}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Calculation and Summary */}
                {testData.radiationLeakageLevel.leakageMeasurements?.length > 0 && (() => {
                  const maValue = parseFloat(testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "0");
                  const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");
                  const getSummaryForLocation = (locName: string) => {
                    const row = testData.radiationLeakageLevel.leakageMeasurements.find((m: any) => m.location === locName);
                    if (!row) return null;
                    const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                    const rowMax = values.length > 0 ? Math.max(...values) : 0;
                    const resMR = (workloadValue * rowMax) / (60 * maValue);
                    return { rowMax, resMR, resMGy: resMR / 114 };
                  };
                  const tubeSummary = getSummaryForLocation("Tube Housing");
                  const collimatorSummary = getSummaryForLocation("Collimator");
                  return (
                    <div className="space-y-4 print:space-y-1">
                      <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
                        <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
                        <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                          Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                        </div>
                        <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                          Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 print:gap-1">
                        {tubeSummary && (
                          <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                            <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">Tube Housing Summary:</p>
                            <div className="text-[11px] print:text-[8px] space-y-1">
                              <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                              <p>Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                              <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy</span></p>
                            </div>
                          </div>
                        )}
                        {collimatorSummary && (
                          <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                            <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">Collimator Summary:</p>
                            <div className="text-[11px] print:text-[8px] space-y-1">
                              <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                              <p>Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                              <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy</span></p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
                        <p className="text-[11px] print:text-[8px] leading-relaxed">
                          <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{' '}
                          {normalizeCsvComparisonOperator(testData.radiationLeakageLevel.toleranceOperator || '<=')}{' '}
                          <strong>{testData.radiationLeakageLevel.toleranceValue || '1'} mGy ({parseFloat(testData.radiationLeakageLevel.toleranceValue || '1') * 114} mR) in one hour.</strong>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {/* 9. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. Details of Radiation Protection Survey</h3>
                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* 2. Equipment Setting */}
                {(testData.radiationProtectionSurvey.appliedCurrent || testData.radiationProtectionSurvey.appliedVoltage || testData.radiationProtectionSurvey.exposureTime || testData.radiationProtectionSurvey.workload) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>2. Equipment Setting</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Current (mA)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Voltage (kV)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Exposure Time(s)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Workload (mA min/week)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.workload || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* 3. Measured Maximum Radiation Levels */}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Location</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.location || "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={loc.result === "PASS" || loc.result === "Pass" ? "text-green-600 font-semibold" : loc.result === "FAIL" || loc.result === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {loc.result || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* 4. Calculation Formula */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>4. Calculation Formula</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 bg-gray-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                            <strong>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* 5. Summary of Maximum Radiation Level/week */}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");
                  const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => {
                    return (parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max?.mRPerWeek) || 0) ? loc : max;
                  }, workerLocs[0] || { mRPerHr: '', location: '' });
                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => {
                    return (parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max?.mRPerWeek) || 0) ? loc : max;
                  }, publicLocs[0] || { mRPerHr: '', location: '' });
                  const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const workerResult = parseFloat(maxWorkerWeekly) > 0 && parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : parseFloat(maxWorkerWeekly) > 40 ? "Fail" : "";
                  const publicResult = parseFloat(maxPublicWeekly) > 0 && parseFloat(maxPublicWeekly) <= 2 ? "Pass" : parseFloat(maxPublicWeekly) > 2 ? "Fail" : "";
                  return (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Category</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Radiation Worker</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>{workerResult || "-"}</span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>{publicResult || "-"}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 print:mt-1 space-y-3 print:space-y-1">
                        {maxWorkerLocation?.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxWorkerLocation.location}</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxWorkerLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxWorkerWeekly} mR/week</p>
                          </div>
                        )}
                        {maxPublicLocation?.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxPublicLocation.location}</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxPublicLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxPublicWeekly} mR/week</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32 print:mt-8 print:text-sm">
                No detailed test results available for this report.
              </p>
            )}
          </div>
        </ReportPage>
        <ReportPage isLast>
          <ReportPdfPageDeclaration
              todayDate={todayDate}
              customerCity={placeValue}
              qrCode={report.qrCode}
              engineerName={report.engineerNameRPId}
            />
        </ReportPage>
      </div>
      <style>{`
        .fixed-report-pdf {
          font-family: "Times New Roman", Times, serif;
          color: #000;
          font-size: 11px;
          line-height: 1.3;
        }
        .fixed-report-pdf h1,
        .fixed-report-pdf h2,
        .fixed-report-pdf h3,
        .fixed-report-pdf h4 {
          font-family: "Times New Roman", Times, serif;
          font-weight: 700;
          color: #000;
        }
        .fixed-report-pdf table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          text-align: center !important;
          width: 100%;
        }
        .fixed-report-pdf td,
        .fixed-report-pdf th {
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          text-align: center !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          padding-left: 2px !important;
          padding-right: 2px !important;
          line-height: 1.1 !important;
        }
        .is-generating-pdf td,
        .is-generating-pdf th {
          padding-top: 4px !important;
          padding-bottom: 12px !important;
        }
        .header-cell-simulated {
          padding-top: 5px;
          padding-bottom: 0px;
        }
        .is-generating-pdf .header-cell-simulated {
          padding-top: 0px;
        }
        .fixed-report-pdf .report-pdf-page-shell,
        .fixed-report-pdf .report-pdf-last-page-shell {
          display: flex !important;
          flex-direction: column !important;
          min-height: 297mm !important;
          height: auto !important;
          box-sizing: border-box !important;
          background: white !important;
        }
        .fixed-report-pdf .report-pdf-last-main {
          flex: 1 1 auto !important;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          @page { margin: 0; size: A4; }
          .fixed-report-pdf { width: 210mm; margin: 0 auto; }
          .fixed-report-pdf .report-pdf-page-shell,
          .fixed-report-pdf .report-pdf-last-page-shell {
             margin: 0 !important;
             box-shadow: none !important;
             page-break-after: always !important;
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportRadiographyMobileHT;