// src/components/reports/ViewServiceReportRadiographyMobile.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForRadiographyMobile, getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile, getDetails, getTools } from "../../../../../../api";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForRadiographyMobile from "./MainTestTableForRadiographyMobile";
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
  notes?: Note[];
  category: string;
  // Test documents
  AccuracyOfIrradiationTimeRadiographyMobile?: any;
  accuracyOfOperatingPotentialRadigraphyMobile?: any;
  CentralBeamAlignmentRadiographyMobile?: any;
  CongruenceOfRadiationRadioGraphyMobile?: any;
  EffectiveFocalSpotRadiographyMobile?: any;
  LinearityOfmAsLoadingRadiographyMobile?: any;
  ConsistencyOfRadiationOutputRadiographyMobile?: any;
  RadiationLeakageLevelRadiographyMobile?: any;
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

const ViewServiceReportRadiographyMobile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const pickRpId = (obj: any): string =>
    obj?.rpId || obj?.rpid || obj?.rpID || obj?.RPId || obj?.engineerAssigned?.rpId || "N/A";

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

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [calculatedPages, setCalculatedPages] = useState<string>("");
  const hasTimer = serviceId
    ? localStorage.getItem(`radiography-mobile-timer-${serviceId}`) === 'true'
    : false;

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
          getReportHeaderForRadiographyMobile(serviceId),
          getDetails(serviceId),
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
        console.log("response", response);
        if (response?.exists && response?.data) {
          const data = response.data;
          const headerTools = normalizeTools(
            data.toolsUsed || data.tools || data.standards || data.toolsAssigned
          );
          const assignedTools = normalizeTools(toolsRes?.data?.toolsAssigned || []);
          const mergedTools = mergeTools(headerTools, assignedTools);
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
            nomenclature: data.nomenclature || "Radiography (Mobile)",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: pickRpId(data),
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "At Site",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: mergedTools,
            notes: data.notes || defaultNotes,
            category: data.category || "",
          });

          // Extract test data from populated response
          // Fetch accuracy of operating potential directly to get totalFiltration + filtrationTolerance
          let accOpPot = data.accuracyOfOperatingPotentialRadigraphyMobile || null;
          try {
            const freshRes = await getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile(serviceId);
            if (freshRes?.data) accOpPot = freshRes.data;
          } catch (_) { /* use header data as fallback */ }

          // Build totalFilteration from accuracyOfOperatingPotential (same data source as Fixed)
          const totalFilteration = accOpPot ? {
            measurements: accOpPot.table2 || [],
            mAStations: accOpPot.mAStations || [],
            tolerance: accOpPot.tolerance || null,
            totalFiltration: accOpPot.totalFiltration || null,
            filtrationTolerance: accOpPot.filtrationTolerance || null,
          } : null;
          setTestData({
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeRadiographyMobile || null,
            accuracyOfOperatingPotential: accOpPot,
            totalFilteration,
            centralBeamAlignment: data.CentralBeamAlignmentRadiographyMobile || null,
            congruence: data.CongruenceOfRadiationRadioGraphyMobile || null,
            effectiveFocalSpot: data.EffectiveFocalSpotRadiographyMobile || null,
            linearityOfMasLoading: data.LinearityOfmAsLoadingRadiographyMobile || null,
            outputConsistency: data.ConsistencyOfRadiationOutputRadiographyMobile || null,
            radiationLeakageLevel: data.RadiationLeakageLevelRadiographyMobile || null,
          });

          // Keep page count behavior consistent with RadiographyFixed.
          let pagesCount = 1;
          const detailedTestSections = [
            { data: data.CongruenceOfRadiationRadioGraphyMobile, pages: 0.5 },
            { data: data.CentralBeamAlignmentRadiographyMobile, pages: 0.5 },
            { data: data.EffectiveFocalSpotRadiographyMobile, pages: 0.5 },
            { data: data.AccuracyOfIrradiationTimeRadiographyMobile, pages: 0.5 },
            { data: accOpPot, pages: 1 },
            { data: data.LinearityOfmAsLoadingRadiographyMobile, pages: 1 },
            { data: data.ConsistencyOfRadiationOutputRadiographyMobile, pages: 1 },
            { data: data.RadiationLeakageLevelRadiographyMobile, pages: 1 },
          ];
          let detailedPages = 0;
          detailedTestSections.forEach((section) => {
            if (section.data && typeof section.data === "object" && Object.keys(section.data).length > 0) {
              detailedPages += section.pages;
            }
          });
          pagesCount += Math.ceil(detailedPages);
          setCalculatedPages(String(pagesCount));
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Radiography Mobile report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));
  const todayDate = new Date().toLocaleDateString("en-GB");
  const extractCity = (raw: string) => {
    if (!raw || raw === "N/A") return "";
    const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return "";
    const alphaParts = parts.filter(p => /[A-Za-z]/.test(p) && !/^\d{6}$/.test(p.replace(/\s+/g, "")));
    if (alphaParts.length === 0) return "";
    const stateOrCountry = /^(india|bharat|uttar pradesh|up|delhi|new delhi|haryana|maharashtra|karnataka|tamil nadu|kerala|gujarat|rajasthan|punjab|bihar|west bengal|telangana|andhra pradesh|odisha|jharkhand|chhattisgarh|madhya pradesh|goa|assam|jammu and kashmir|ladakh|himachal pradesh|uttarakhand|manipur|meghalaya|mizoram|nagaland|sikkim|tripura|arunachal pradesh)$/i;
    const city = [...alphaParts].reverse().find(p => !stateOrCountry.test(p));
    return city || alphaParts[alphaParts.length - 1];
  };
  const customerCity = extractCity(report?.location || "") || extractCity(report?.address || "") || "-";
  const placeValue = report?.city && String(report.city).trim() !== "" ? String(report.city).trim() : customerCity;
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

  const ReportPage: React.FC<{
    isLast?: boolean;
    children: React.ReactNode;
  }> = ({ isLast, children }) => (
    <div
      className={`bg-white shadow-2xl print:shadow-none ${isLast ? "report-pdf-last-page-shell" : "report-pdf-page-shell"}`}
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
      <ReportPdfPageHeader report={report!} formatDate={formatDate} />
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

  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="font-bold mb-1 text-[12px]">{title}</h2>
  );

  const TestSectionTitle = ({ num, title }: { num: number; title: string }) => (
    <h3 className="font-bold mb-2" style={{ fontSize: "12px" }}>
      {num}. {title}
    </h3>
  );

  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => {
    const padding = extra?.padding ? String(extra.padding) : "4px 6px";
    const parts = padding.trim().split(/\s+/);
    let finalPadding = padding;
    if (parts.length === 1) finalPadding = `${parts[0]} ${parts[0]} 4px ${parts[0]}`;
    else if (parts.length === 2) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[1]}`;
    else if (parts.length === 3) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[0]}`;
    else if (parts.length === 4) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[3]}`;

    return {
      fontSize: "11px",
      lineHeight: "1.3",
      minHeight: "0",
      height: "auto",
      borderColor: "#000",
      textAlign: "center",
      verticalAlign: "middle",
      fontWeight: 400,
      boxSizing: "border-box",
      ...extra,
      padding: finalPadding,
    };
  };

  const tableStyle: React.CSSProperties = {
    fontSize: "11px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    borderSpacing: "0",
    width: "100%",
    border: "0.1px solid #666",
    textAlign: "center",
  };

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `RadiographyMobile-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Radiography Mobile Report...</div>;

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
        {/* PAGE 1 - MAIN REPORT */}
        <ReportPage>
          <div className="report-pdf-main" style={{ width: "100%" }}>
          <h1 className="text-center font-bold underline mb-2" style={{ fontSize: "15px" }}>
            QA TEST REPORT FOR RADIOGRAPHY (MOBILE) X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: "9px" }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>
          {/* Customer Details */}
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

          {/* Reference */}
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
                <div className="w-28">{formatDate(report.srfDate)}</div>
              </div>
              <div className="flex">
                <div className="w-6 text-right pr-1">2.2</div>
                <div className="w-64">Test Report No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{report.testReportNumber}</div>
                <div className="w-20">Issue Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(report.issueDate)}</div>
              </div>
            </div>
          </section>

          {/* Equipment Details */}
          <section className="mb-3 text-[10px]">
            <SectionTitle title="3. Details Of Device Under Test" />
            <div className="space-y-[2px]">
              {[
                ["Nomenclature / Type of equipment", report.nomenclature],
                ["Make", report.make || "-"],
                ["Model", report.model],
                ["Sl. No.", report.slNumber],
                ...(report.category && report.category !== "N/A" ? [["Category", report.category]] : []),
                ["Condition of Test Item", report.condition],
                ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                ["Engineer’s Name", report.engineerNameRPId || "-"],
                ["RP ID", report.rpId || "-"],
                ["No. of pages", calculatedPages || report.pages || "-"],
                ["QA Test Date", formatDate(report.testDate)],
                ["QA Test Due Date", formatDate(report.testDueDate)],
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

          {/* Tools Used */}
          <section className="mb-3">
            <h2 className="font-bold mb-4" style={{ fontSize: "12px" }}>
              4. Standards / Tools Used
            </h2>
            <table style={{ ...tableStyle, tableLayout: "fixed" }} className="compact-table">
              <thead>
                <tr>
                  {["Sl No.", "Nomenclature", "Make", "Model", "Sr. No.", "Range", "Certificate No.", "Valid Till"].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={cellStyle({
                          fontWeight: 700,
                          border: "0.1px solid #666",
                          fontSize: "9px",
                          lineHeight: "1.2",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          padding: "3px 4px",
                          width: ["6%", "18%", "12%", "12%", "10%", "10%", "16%", "16%"][i],
                        })}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? (
                  toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{i + 1}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.nomenclature}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.make || "-"}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.model || "-"}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.SrNo}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.range}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.calibrationCertificateNo}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={cellStyle({ border: "0.1px solid #666" })}>
                      No tools recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Notes */}
          <section className="mb-3 text-[10px]">
            <SectionTitle title="5. Notes" />
            <div className="space-y-[2px]">
              {notesArray.map((n) => (
                <div key={n.slNo} className="flex">
                  <div className="w-10 text-right pr-1">{n.slNo}</div>
                  <div className="w-2">:</div>
                  <div className="flex-1 break-words">{n.text}</div>
                </div>
              ))}
            </div>
          </section>
          <ReportPdfPageNoteQR report={report!} />
          </div>
        </ReportPage>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <ReportPage>
          <div className="report-pdf-main test-section" style={{ width: "100%" }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none', flex: 1 }}>
            <MainTestTableForRadiographyMobile testData={testData} hasTimer={hasTimer} />
          </div>
          </div>
        </ReportPage>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <ReportPage>
          <div className="report-pdf-main test-section" style={{ width: "100%" }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none', flex: 1 }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>
              DETAILED TEST RESULTS
            </h2>

            {/* 4. Congruence */}
            {testData.congruence && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={1} title="Congruence of Radiation & Optical Field" />
                {testData.congruence.techniqueFactors && Array.isArray(testData.congruence.techniqueFactors) && testData.congruence.techniqueFactors.length > 0 && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '11px' }}>Technique Factors:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ fontSize: '11px' }}>FFD (cm)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ fontSize: '11px' }}>kV</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ fontSize: '11px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.congruence.techniqueFactors.map((tf: any, idx: number) => (
                            <tr key={idx} className="text-center">
                              <td className="border border-black p-2 print:p-1">{tf.fcd || "-"}</td>
                              <td className="border border-black p-2 print:p-1">{tf.kv || "-"}</td>
                              <td className="border border-black p-2 print:p-1">{tf.mas || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                <TestSectionTitle num={2} title="Central Beam Alignment" />

                {/* Operating parameters */}
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div className="mb-6">
                    <p className="font-semibold mb-2 text-sm">Operating parameters:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm mb-4">
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
                  <p className="text-sm mb-3">
                    Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
                  </p>
                  {testData.centralBeamAlignment.observedTilt && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm">
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
                <TestSectionTitle num={3} title="Effective Focal Spot Size" />
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
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px' }}>Focus Type</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '22%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot (f)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '22%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot (f_meas)</th>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ width: '44%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>Tolerance:</strong>
                              {/* <span><strong>FCD (cm)</strong> {testData.effectiveFocalSpot.fcd || "-"}</span> */}
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
                            if (val === undefined || val === null || val === "") return null;
                            const numVal = typeof val === 'number' ? val : parseFloat(val);
                            if (Number.isNaN(numVal)) return null;
                            return numVal;
                          };

                          const statedWidth = formatValue(spot.statedWidth);
                          const statedHeight = formatValue(spot.statedHeight);
                          const measuredWidth = formatValue(spot.measuredWidth);
                          const measuredHeight = formatValue(spot.measuredHeight);

                          const statedNominal = statedWidth !== null && statedHeight !== null ? (statedWidth + statedHeight) / 2 : (statedWidth ?? statedHeight);
                          const measuredNominal = measuredWidth !== null && measuredHeight !== null ? (measuredWidth + measuredHeight) / 2 : (measuredWidth ?? measuredHeight);

                          // Calculate tolerance limit
                          let toleranceLimit = "-";
                          if (statedNominal !== null) {
                            const tc = testData.effectiveFocalSpot.toleranceCriteria || {};
                            const smallLimit = parseFloat(tc.small?.upperLimit ?? "0.8");
                            const smallMult = parseFloat(tc.small?.multiplier ?? "0.5");
                            const mediumLimit = parseFloat(tc.medium?.upperLimit ?? "1.5");
                            const mediumMult = parseFloat(tc.medium?.multiplier ?? "0.4");
                            const largeMult = parseFloat(tc.large?.multiplier ?? "0.3");

                            let multiplier = 0.5;
                            if (statedNominal < smallLimit) multiplier = smallMult;
                            else if (statedNominal <= mediumLimit) multiplier = mediumMult;
                            else multiplier = largeMult;

                            toleranceLimit = (statedNominal * (1 + multiplier)).toFixed(2);
                          }

                          const displayValue = (val: any) => val !== null && val !== undefined ? (typeof val === 'number' ? val.toFixed(1) : val) : "-";

                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                {spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}
                              </td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px' }}>{displayValue(statedNominal)}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px' }}>{displayValue(measuredNominal)}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px' }}>
                                <span className={spot.remark === "Pass" || spot.remark === "PASS" ? "text-green-600 font-bold" : spot.remark === "Fail" || spot.remark === "FAIL" ? "text-red-600 font-bold" : ""}>
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
                <TestSectionTitle num={4} title="Accuracy of Irradiation Time" />

                {/* Test Conditions Table */}
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-4 print:mb-1">
                    <div className="overflow-x-auto mb-2 print:mb-1">
                      <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '300px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FDD (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Accuracy Table */}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                          <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (sec)</th>
                          <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                          <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
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
                              case ">": pass = err <= tolVal; break; // Note: Logic is "error should be <= tol" for PASS
                              case "<": pass = err < tolVal; break;
                              case ">=": pass = err <= tolVal; break;
                              case "<=": pass = err <= tolVal; break;
                              default: pass = err <= tolVal;
                            }
                            remark = pass ? "Pass" : "Fail";
                          }

                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{errorPct !== "-" ? `${errorPct}%` : "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
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
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={5} title="Accuracy of Operating Potential" />
                {testData.accuracyOfOperatingPotential.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                          {(testData.accuracyOfOperatingPotential.mAStations || ['10 mA', '100 mA']).map((label: string, j: number) => (
                            <th key={j} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => {
                          const cells = Array.isArray(row.measuredValues) ? row.measuredValues : [row.ma10, row.ma100];
                          const stations = testData.accuracyOfOperatingPotential.mAStations || ['10 mA', '100 mA'];
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV ?? row.appliedKvp ?? "-"}</td>
                              {stations.map((_: string, j: number) => (
                                <td key={j} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{cells[j] != null && cells[j] !== '' ? cells[j] : "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp ?? "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={(row.remarks === "PASS" || row.remarks === "Pass") ? "text-green-600" : (row.remarks === "FAIL" || row.remarks === "Fail") ? "text-red-600" : ""}>
                                  {row.remarks ?? "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfOperatingPotential.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: "2px 4px", marginTop: "4px" }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: "11px", margin: "2px 0" }}>
                      <strong>Tolerance:</strong> {testData.accuracyOfOperatingPotential.tolerance.sign || "±"} {testData.accuracyOfOperatingPotential.tolerance.value || "-"} kVp
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2.5. Total Filtration (standalone section when totalFilteration exists, matching Fixed) */}
            {testData.totalFilteration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={6} title="Total Filtration" />
                  {/* {testData.totalFilteration.measurements?.length > 0 && (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Accuracy of Operating Potential</h4>
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
                      {testData.totalFilteration.tolerance && (
                        <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Tolerance:</strong> {testData.totalFilteration.tolerance.sign || "±"} {testData.totalFilteration.tolerance.value || "-"}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}  */}
                {testData.totalFilteration.totalFiltration && (() => {
                  const tf = testData.totalFilteration.totalFiltration;
                  const ft = testData.totalFilteration.filtrationTolerance || {};
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
                    <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
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
                  );
                })()}
              </div>
            )}


            {/* 6. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading && (() => {
              const isMaLoading = testData.linearityOfMasLoading?.table1?.[0]?.time !== undefined &&
                testData.linearityOfMasLoading?.table1?.[0]?.time !== null &&
                String(testData.linearityOfMasLoading?.table1?.[0]?.time).trim() !== "";

              return (
                <div className="mb-16 print:mb-12 test-section">
                  <TestSectionTitle
                    num={7}
                    title={isMaLoading ? "Linearity of mA Loading Stations" : "Linearity of mAs Loading Stations"}
                  />
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
                    <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            {/* Row 1: Top half of "rowspans" and the main "colspans" */}
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              {isMaLoading ? "mA" : "mAs Range"}
                            </th>
                            <th colSpan={testData.linearityOfMasLoading.measHeaders?.length || 0} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              Output (mGy)
                            </th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              {isMaLoading ? "X " : "X"}
                            </th>
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
                          {testData.linearityOfMasLoading.table2.map((row: any, i: number) => {
                            const formatValue = (val: any) => {
                              if (val === undefined || val === null) return "-";
                              const str = String(val).trim();
                              return str === "" || str === "—" || str === "undefined" || str === "null" ? "-" : str;
                            };

                            return (
                              <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                                <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>{row.mAsApplied || "-"}</td>
                                {testData.linearityOfMasLoading.measHeaders?.map((_: string, idx: number) => (
                                  <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                    {formatValue(row.measuredOutputs?.[idx] ?? row.outputs?.[idx])}
                                  </td>
                                ))}
                                <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row.average || "-"}</td>
                                <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row.x || "-"}</td>
                                {i === 0 ? (
                                  <>
                                    <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                      {formatValue(testData.linearityOfMasLoading?.xMax)}
                                    </td>
                                    <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                      {formatValue(testData.linearityOfMasLoading?.xMin)}
                                    </td>
                                    <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                      {formatValue(testData.linearityOfMasLoading?.col)}
                                    </td>
                                    <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                      <span className={
                                        testData.linearityOfMasLoading?.remarks === "Pass" ||
                                          testData.linearityOfMasLoading?.remarks === "PASS" ?
                                          "text-green-600 font-semibold" :
                                          testData.linearityOfMasLoading?.remarks === "Fail" ||
                                            testData.linearityOfMasLoading?.remarks === "FAIL" ?
                                            "text-red-600 font-semibold" : ""
                                      } style={{ fontSize: '10px' }}>
                                        {formatValue(testData.linearityOfMasLoading?.remarks)}
                                      </span>
                                    </td>
                                  </>
                                ) : null}
                              </tr>
                            );
                          })}
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
              );
            })()}

            {/* 7. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={8} title="Consistency of Radiation Output" />
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
                {testData.outputConsistency.outputRows?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg (X̄)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoV / Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => {
                          const computeCovFromOutputs = (outputs: any[]): number | null => {
                            if (!Array.isArray(outputs) || outputs.length === 0) return null;
                            const values = outputs
                              .map((v) => {
                                if (v == null) return NaN;
                                if (typeof v === "number") return v;
                                if (typeof v === "string") return parseFloat(v);
                                // Sometimes outputs are objects like { value: "23" }
                                if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                                return NaN;
                              })
                              .filter((n) => !Number.isNaN(n));

                            if (values.length === 0) return null;

                            const mean = values.reduce((a, b) => a + b, 0) / values.length;
                            if (!mean || mean === 0) return null;
                            const variance =
                              values.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / values.length;
                            const stdDev = Math.sqrt(variance);
                            const cov = stdDev / mean;
                            return Number.isFinite(cov) ? cov : null;
                          };

                          const covVal = row.cov ?? row.cv ?? (row.outputs ? computeCovFromOutputs(row.outputs) : null);
                          const covDisplay =
                            covVal != null && covVal !== ""
                              ? (typeof covVal === "number"
                                ? covVal.toFixed(3)
                                : parseFloat(String(covVal)).toFixed(3))
                              : "-";
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kv || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas || "-"}</td>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avg || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remark?.includes("Pass") ? "text-green-600" : row.remark?.includes("Fail") ? "text-red-600" : ""}>
                                  {covDisplay !== "-" ? `${covDisplay} / ${row.remark || "-"}` : (row.remark || "-")}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value ?? "0.05"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 9. Tube Housing Leakage (aligned with Radiography Fixed view) */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={9} title="Tube Housing Leakage" />
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
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
                <p style={{ fontSize: '10px', marginBottom: '4px' }}>
                  <strong>Workload:</strong> {testData.radiationLeakageLevel.workload || "-"} {testData.radiationLeakageLevel.workloadUnit || "mA·min/week"}
                </p>
                {testData.radiationLeakageLevel.leakageMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-2 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ width: '15%', padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Location</th>
                          <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Exposure Level (mR/hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Result (mR in 1 hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Result (mGy in 1 hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold align-middle" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Remarks</th>
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
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <th scope="row" className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px', fontWeight: 700 }}>{row.location || "-"}</th>
                              {(["left", "right", "front", "back", "top"] as const).map((k) => (
                                <td key={k} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row[k] || "-"}</td>
                              ))}
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calcMR}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calcMGy}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{remark}</td>
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
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ border: '1px solid #888', padding: '4px 8px', marginBottom: '4px', background: '#fafafa' }}>
                        <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Calculation Formula:</p>
                        <p style={{ fontSize: '10px', textAlign: 'center', fontFamily: 'monospace', border: '1px dashed #999', padding: '2px' }}>
                          Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                        </p>
                        <p style={{ fontSize: '9px', marginTop: '2px', color: '#555', fontStyle: 'italic' }}>
                          Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2" style={{ display: 'flex', gap: '8px' }}>
                        {tubeSummary && (
                          <div style={{ flex: 1, border: '0.1px solid #666', padding: '4px', fontSize: '10px', minWidth: '140px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>Tube Housing Summary:</p>
                            <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <strong>{tubeSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                        {collimatorSummary && (
                          <div style={{ flex: 1, border: '0.1px solid #666', padding: '4px', fontSize: '10px', minWidth: '140px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>Collimator Summary:</p>
                            <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <strong>{collimatorSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '10px', marginTop: '4px', border: '0.1px solid #666', padding: '2px 6px' }}>
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt; <strong>{leak.toleranceValue || '1'} mGy ({parseFloat(leak.toleranceValue || '1') * 114} mR) in one hour.</strong>
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
        </ReportPage>

        <ReportPage isLast>
          <div className="report-pdf-main" style={{ width: "100%", flex: 1 }}>
            <ReportPdfPageDeclaration todayDate={todayDate} customerCity={placeValue} />
          </div>
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
          vertical-align: middle !important;
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

export default ViewServiceReportRadiographyMobile;
