// src/components/reports/ViewServiceReportRadiographyPortable.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForRadiographyPortable, saveReportHeader, getDetails, getTools } from "../../../../../../api";
import { generatePDF, estimateReportPages } from "../../../../../../utils/generatePDF";
import MainTestTableForRadiographyPortable from "./MainTestTableForRadiographyPortable";
import { ReportPdfPageHeader } from "../RadiographyFixed/component/Header";
import { ReportPdfPageFooter } from "../RadiographyFixed/component/Footer";
import { ReportPdfPageFooterEnd } from "../RadiographyFixed/component/FooterEnd";
import { ReportPdfPageNoteQR } from "../RadiographyFixed/component/NoteQR";
import { ReportPdfPageDeclaration } from "../RadiographyFixed/component/Declaration";

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
  rpId: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  qrCode?: string;
  notes?: Note[];
  pages: string;
  category: string;
  authorizedSignatoryName?: string;
  authorizedSignatorySignature?: string;
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
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeaderForRadiographyPortable(serviceId),
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
            toolsUsed: mergedTools,
            notes: data.notes || defaultNotes,
            pages: data.pages ?? "",
            qrCode: data.qrCode || "",

            category: data.category || "",
            authorizedSignatoryName:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.name) ||
              data.authorizedSignatoryName ||
              "",
            authorizedSignatorySignature:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.signature) ||
              data.authorizedSignatorySignature ||
              "",
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
  const todayDate = formatDate(new Date().toISOString());
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
    const padding = extra?.padding ? String(extra.padding) : '4px 6px';
    const parts = padding.trim().split(/\s+/);
    let finalPadding = padding;
    if (parts.length === 1) finalPadding = `${parts[0]} ${parts[0]} 4px ${parts[0]}`;
    else if (parts.length === 2) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[1]}`;
    else if (parts.length === 3) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[0]}`;
    else if (parts.length === 4) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[3]}`;

    return {
      fontSize: '11px',
      lineHeight: '1.3',
      minHeight: '0',
      height: 'auto',
      borderColor: '#000',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontWeight: 400,
      boxSizing: 'border-box',
      ...extra,
      padding: finalPadding,
    };
  };

  const tableStyle: React.CSSProperties = {
    fontSize: '11px',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    borderSpacing: '0',
    width: '100%',
    border: '0.1px solid #666',
    textAlign: 'center',
  };

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
            QA TEST REPORT FOR RADIOGRAPHY (PORTABLE) X-RAY EQUIPMENT
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
                ["No. of pages", report.pages || "-"],
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
            <MainTestTableForRadiographyPortable testData={testData} hasTimer={hasTimer} />
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
                <TestSectionTitle num={1} title="Congruence of Radiation & Light Field" />
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
                <TestSectionTitle num={2} title="Central Beam Alignment" />

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
                  {testData.centralBeamAlignment.observedTilt && (() => {
                    const observedRaw = testData.centralBeamAlignment?.observedTilt?.value;
                    const toleranceObj = testData.centralBeamAlignment?.tolerance;
                    const tolOpRaw = typeof toleranceObj === 'object' ? (toleranceObj.operator || "<") : "<";
                    const tolValRaw = typeof toleranceObj === 'object' ? (toleranceObj.value || "1.5") : "1.5";
                    const observed = parseFloat(String(observedRaw ?? ""));
                    const tolerance = parseFloat(String(tolValRaw ?? ""));

                    let computedRemark = "";
                    if (!Number.isNaN(observed) && !Number.isNaN(tolerance)) {
                      // Equality must be FAIL; treat <= as < and >= as >.
                      if (tolOpRaw === ">" || tolOpRaw === ">=") {
                        computedRemark = observed > tolerance ? "Pass" : "Fail";
                      } else if (tolOpRaw === "=") {
                        computedRemark = "Fail";
                      } else {
                        computedRemark = observed < tolerance ? "Pass" : "Fail";
                      }
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              <td className="border border-black p-3 font-medium w-1/2">Observed tilt</td>
                              <td className="border border-black p-3 text-center">
                                {testData.centralBeamAlignment.observedTilt.value || "-"}&deg;
                                {computedRemark && (
                                  <span className={`ml-2 ${computedRemark === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}`}>
                                    {computedRemark}
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
                    );
                  })()}
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
                <TestSectionTitle num={4} title="Accuracy of Irradiation Time" />
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
                  <TestSectionTitle num={5} title="Accuracy of Operating Potential" />
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
                    <TestSectionTitle num={6} title="Total Filtration" />
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
              const table2Rows = testData.linearityOfMasLoading.table2 || [];
              const maxOutLen = Math.max(
                0,
                ...table2Rows.map((r: any) => (r.measuredOutputs ?? r.readings ?? []).length)
              );
              const measHeadersRaw = Array.isArray(testData.linearityOfMasLoading.measHeaders)
                ? testData.linearityOfMasLoading.measHeaders
                : [];
              const measHeaders =
                measHeadersRaw.length > 0
                  ? [
                      ...measHeadersRaw.map((h: string, i: number) => h || `Meas ${i + 1}`),
                      ...Array.from(
                        { length: Math.max(0, maxOutLen - measHeadersRaw.length) },
                        (_, i) => `Meas ${measHeadersRaw.length + i + 1}`
                      ),
                    ]
                  : Array.from({ length: Math.max(maxOutLen, 1) }, (_, i) => `Meas ${i + 1}`);

              return (
                <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <TestSectionTitle
                    num={7}
                    title={isMaLoading ? "Linearity of mA Loading" : "Linearity of mAs Loading"}
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
                  {table2Rows.length > 0 && (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '12%', padding: '0px 2px', fontSize: '11px' }}>
                              {isMaLoading ? "mA" : "mAs Range"}
                            </th>
                            <th colSpan={measHeaders.length} className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '11px' }}>
                              Output (mGy)
                            </th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '12%', padding: '0px 2px', fontSize: '11px' }}>Avg Output</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '12%', padding: '0px 2px', fontSize: '11px' }}>
                              {isMaLoading ? "X (mGy/(mA*s))" : "X (mGy/mAs)"}
                            </th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '8%', padding: '0px 2px', fontSize: '11px' }}>X MAX</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '8%', padding: '0px 2px', fontSize: '11px' }}>X MIN</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '8%', padding: '0px 2px', fontSize: '11px' }}>CoL</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ width: '10%', padding: '0px 2px', fontSize: '11px' }}>Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ fontSize: '11px' }}></th>
                            {measHeaders.map((header: string, idx: number) => (
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
                          {table2Rows.map((row: any, i: number) => {
                            const xMax = testData.linearityOfMasLoading?.xMax;
                            const xMin = testData.linearityOfMasLoading?.xMin;
                            const col = testData.linearityOfMasLoading?.col;
                            const remarks = testData.linearityOfMasLoading?.remarks;
                            const isFirstRow = i === 0;
                            const rowSpan = table2Rows.length;
                            const measuredOutputs = row.measuredOutputs ?? row.readings ?? [];

                            const formatValue = (val: any) => {
                              if (val === undefined || val === null) return "-";
                              const str = String(val).trim();
                              return str === "" || str === "â€”" || str === "undefined" || str === "null" ? "-" : str;
                            };

                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mAsApplied || row.ma || "-"}</td>
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
                        <strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || ""} {testData.linearityOfMasLoading.tolerance || "0.1"}
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
                  const savedMeasHeaders = Array.isArray(testData.outputConsistency.measurementHeaders)
                    && testData.outputConsistency.measurementHeaders.length > 0
                    ? testData.outputConsistency.measurementHeaders
                    : Array.isArray(testData.outputConsistency.measHeaders)
                      && testData.outputConsistency.measHeaders.length > 0
                      ? testData.outputConsistency.measHeaders
                      : Array.from({ length: measCount }, (_, i) => `Meas ${i + 1}`);
                  const displayHeaders = [...savedMeasHeaders.map(String)];
                  while (displayHeaders.length < measCount) {
                    displayHeaders.push(`Meas ${displayHeaders.length + 1}`);
                  }
                  const rawTolVal = testData.outputConsistency.tolerance?.value;
                  const tolVal = (() => {
                    const n = parseFloat(String(rawTolVal ?? ''));
                    return Number.isFinite(n) ? n : 0.05;
                  })();
                  const tolOp = testData.outputConsistency.tolerance?.operator ?? '<=';
                  const tolValDisplay = Number.isFinite(parseFloat(String(rawTolVal ?? '')))
                    ? String(rawTolVal)
                    : '0.05';

                  const getVal = (o: any): number => {
                    if (o == null) return NaN;
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  return (
                    <>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                            {displayHeaders.slice(0, measCount).map((header: string, i: number) => (
                              <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{header || `Meas ${i + 1}`}</th>
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
                    {testData.outputConsistency.tolerance && (
                      <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                          <strong>Acceptance Criteria:</strong> CoV {tolOp || "<="} {tolValDisplay}
                        </p>
                      </div>
                    )}
                    </>
                  );
                })()}
                {!testData.outputConsistency.outputRows?.length && testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="}{' '}
                      {Number.isFinite(parseFloat(String(testData.outputConsistency.tolerance.value ?? '')))
                        ? testData.outputConsistency.tolerance.value
                        : "0.05"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 9. Tube Housing Leakage (aligned with Radiography Fixed view) */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                <TestSectionTitle num={9} title="Tube Housing Leakage" />
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
        </ReportPage>

        <ReportPage isLast>
          <div className="report-pdf-main" style={{ width: "100%", flex: 1 }}>
            <ReportPdfPageDeclaration
              todayDate={todayDate}
              customerCity={placeValue}
              qrCode={report.qrCode}
              engineerName={report.engineerNameRPId}
              authorizedSignatoryName={report.authorizedSignatoryName}
              authorizedSignatorySignature={report.authorizedSignatorySignature}
            />
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

export default ViewServiceReportRadiographyPortable;

