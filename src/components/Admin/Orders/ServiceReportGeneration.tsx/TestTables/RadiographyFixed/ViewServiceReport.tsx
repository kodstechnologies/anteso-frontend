// src/components/reports/ViewServiceReportRadiographyFixed.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDetails, getReportHeaderForRadiographyFixed } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForRadiographyFixed from "./MainTestTableForRadiographyFixed";

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
  rpId: string;
  pages: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  category: string;
  AccuracyOfIrradiationTimeRadiographyFixed?: any;
  accuracyOfOperatingPotentialRadigraphyFixed?: any;
  CentralBeamAlignmentRadiographyFixed?: any;
  CongruenceOfRadiationRadioGraphyFixed?: any;
  EffectiveFocalSpotRadiographyFixed?: any;
  LinearityOfmAsLoadingRadiographyFixed?: any;
  ConsistencyOfRadiationOutputFixedRadiography?: any;
  RadiationLeakageLevelRadiographyFixed?: any;
  RadiationProtectionSurveyRadiographyFixed?: any;
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

/** Logos + SRF / ULR box — repeated at the top of each PDF page section. */
const ReportPdfPageHeader: React.FC<{
  report: ReportData;
  formatDate: (dateStr: string) => string;
}> = ({ report, formatDate }) => (
  <div className="report-pdf-page-header flex justify-between items-center mb-4 print:mb-2">
    <img src={logoA} alt="NABL" className="h-24 print:h-16" />
    <div className="text-right">
      <table style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px', border: '0.1px solid #666' }}>
        <tbody>
          {[["SRF No.:", report.srfNumber], ["SRF Date:", formatDate(report.srfDate)], ["ULR No.:", report.reportULRNumber || "N/A"]].map(([label, val]) => (
            <tr key={String(label)}>
              <th scope="row" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', whiteSpace: 'nowrap', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle', border: '0.1px solid #666', boxSizing: 'border-box' }}>{label}</th>
              <td style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', whiteSpace: 'nowrap', fontWeight: 400, textAlign: 'center', verticalAlign: 'middle', border: '0.1px solid #666', boxSizing: 'border-box' }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <img src={logo} alt="Logo" className="h-24 print:h-16" />
  </div>
);

/** Company footer — repeated at the bottom of each PDF page section. */
const ReportPdfPageFooter: React.FC<{
  todayDate: string;
  customerCity: string;
}> = ({ todayDate, customerCity }) => (
  <div
    className="report-pdf-footer-block"
    style={{
      width: '100%',
      flexShrink: 0,
      marginTop: 'auto',
      paddingTop: '10px',
      borderTop: '1px solid #ccc',
    }}
  >
    <p style={{ fontSize: '10px', lineHeight: '1.2' }}><strong>Date:</strong> {todayDate}</p>
    <p style={{ fontSize: '10px', lineHeight: '1.2' }}><strong>Place:</strong> {customerCity}</p>
    <footer style={{ textAlign: 'center', fontSize: '9px', color: '#555', marginTop: '6px', lineHeight: '1.25' }}>
      <p>ANTESO Biomedical OPC Pvt. Ltd.</p>
      <p>2nd Floor, D-290, PKT-7, Sector - 6, Rohini, New Delhi - 110085</p>
      <p>Ph.: 011-47069720. Mob. No. 08470809720, 08427349720, 08470809720</p>
      <p>Email: antesobiomedical@gmail.com, info@antesobiomedicalopc.com</p>
    </footer>
  </div>
);

const ViewServiceReportRadiographyFixed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const pickRpId = (obj: any): string =>
    obj?.rpId || obj?.rpid || obj?.rpID || obj?.RPId || obj?.RPID || obj?.engineerAssigned?.rpId || obj?.engineerAssigned?.RPId || "N/A";

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [calculatedPages, setCalculatedPages] = useState<string>("");
  const hasTimer = serviceId
    ? localStorage.getItem(`radiography-fixed-timer-${serviceId}`) === 'true'
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
        const [response, detailsRes] = await Promise.all([
          getReportHeaderForRadiographyFixed(serviceId),
          getDetails(serviceId),
        ]);
        const detailsData = detailsRes?.data || {};
        const detailsFirstQaTest = Array.isArray(detailsData?.qaTests) ? detailsData.qaTests[0] : null;
        const detailsLeadOwner = detailsData?.leadOwner || detailsData?.leadowner || null;
        const detailsLeadOwnerRole = String(
          detailsData?.leadOwnerType ||
          detailsData?.leadOwnerRole ||
          detailsLeadOwner?.role ||
          ""
        ).trim();
        const detailsLeadOwnerName = String(
          detailsData?.manufacturerName ||
          detailsLeadOwner?.name ||
          ""
        ).trim();

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            city: data.city || detailsData?.city || "",
            hospitalName: data.hospitalName || "",
            fullAddress: data.fullAddress || "",
            leadOwner: data.leadOwner || data.leadowner || detailsLeadOwner || "",
            manufacturerName: data.manufacturerName || detailsData?.manufacturerName || "",
            leadOwnerType: data.leadOwnerType || data.leadownerType || detailsLeadOwnerRole || "",
            leadOwnerRole: data.leadOwnerRole || data.leadownerRole || detailsLeadOwnerRole || "",
            leadOwnerName: data.leadOwnerName || detailsLeadOwnerName || "",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber:
              data.reportULRNumber ||
              data.reportUlrNumber ||
              data.reportULRNo ||
              data.ulrNumber ||
              detailsFirstQaTest?.reportULRNumber ||
              detailsFirstQaTest?.reportUlrNumber ||
              detailsFirstQaTest?.reportULRNo ||
              detailsFirstQaTest?.ulrNumber ||
              "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Radiography (Fixed)",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: pickRpId(data),
            pages: data.pages || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
            category: data.category || "N/A",
          });

          setTestData({
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeRadiographyFixed || null,
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotentialRadigraphyFixed || null,
            totalFilteration: data.TotalFilterationRadiographyFixed || null,
            centralBeamAlignment: data.CentralBeamAlignmentRadiographyFixed || null,
            congruence: data.CongruenceOfRadiationRadioGraphyFixed || null,
            effectiveFocalSpot: data.EffectiveFocalSpotRadiographyFixed || null,
            linearityOfMasLoading: data.LinearityOfmAsLoadingRadiographyFixed || null,
            outputConsistency: data.ConsistencyOfRadiationOutputFixedRadiography || null,
            radiationLeakageLevel: data.RadiationLeakageLevelRadiographyFixed || null,
            radiationProtectionSurvey: data.RadiationProtectionSurveyRadiographyFixed || null,
          });

          const savedPages = data.pages != null ? String(data.pages).trim() : "";
          if (savedPages) {
            setCalculatedPages(savedPages);
          } else {
            let pagesCount = 1;
            const detailedTestSections = [
              { data: data.AccuracyOfIrradiationTimeRadiographyFixed, pages: 0.5 },
              { data: data.accuracyOfOperatingPotentialRadigraphyFixed, pages: 1 },
              { data: data.TotalFilterationRadiographyFixed, pages: 0.5 },
              { data: data.CentralBeamAlignmentRadiographyFixed, pages: 0.5 },
              { data: data.CongruenceOfRadiationRadioGraphyFixed, pages: 0.5 },
              { data: data.EffectiveFocalSpotRadiographyFixed, pages: 0.5 },
              { data: data.LinearityOfmAsLoadingRadiographyFixed, pages: 1 },
              { data: data.ConsistencyOfRadiationOutputFixedRadiography, pages: 1 },
              { data: data.RadiationLeakageLevelRadiographyFixed, pages: 1.5 },
              { data: data.RadiationProtectionSurveyRadiographyFixed, pages: 1.5 },
            ];

            let detailedPages = 0;
            detailedTestSections.forEach(section => {
              if (section.data && typeof section.data === 'object' && Object.keys(section.data).length > 0) {
                detailedPages += section.pages;
              }
            });
            pagesCount += Math.ceil(detailedPages);
            setCalculatedPages(String(pagesCount));
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Radiography Fixed report:", err);
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

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `RadiographyFixed-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Radiography Fixed Report...</div>;

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

  // Shared thin-border cell style
  /** Table body / value cells: centered, normal weight (headers use <th> + CSS). */
  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '4px 6px',
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
  });

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
        <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Download PDF
        </button>
      </div>

      <div id="report-content" className="fixed-report-pdf">
        {/* PAGE 1 - MAIN REPORT */}
        <div
          className="bg-white px-8 py-2 report-pdf-page-shell"
          style={{
            pageBreakAfter: 'always',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            boxSizing: 'border-box',
            minHeight: '282mm',
          }}
        >
          <ReportPdfPageHeader report={report} formatDate={formatDate} />
          {/* <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div> */}

          <h1 className="text-center font-bold underline mb-2" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR RADIOGRAPHY (FIXED) X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: '9px' }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>1. Customer Details</h2>
            <table style={tableStyle} className="compact-table">
              <tbody>
                {isManufacturerLeadOwner && (
                  <tr>
                    <th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', fontWeight: 700 })}>Name of the customer</th>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{manufacturerDisplayName}</td>
                  </tr>
                )}
                <tr>
                  <th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', fontWeight: 700 })}>Name of the testing site</th>
                  <td style={cellStyle({ border: '0.1px solid #666' })}>{report.customerName}</td>
                </tr>
                <tr>
                  <th scope="row" style={cellStyle({ border: '0.1px solid #666', fontWeight: 700 })}>Address of the testing site</th>
                  <td style={cellStyle({ border: '0.1px solid #666' })}>{report.address}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Reference */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>2. Reference</h2>
            <table style={tableStyle} className="compact-table">
              <tbody>
                <tr><th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', fontWeight: 700 })}>SRF No. & Date</th><td style={cellStyle({ border: '0.1px solid #666' })}>{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr><th scope="row" style={cellStyle({ border: '0.1px solid #666', fontWeight: 700 })}>Test Report No. & Issue Date</th><td style={cellStyle({ border: '0.1px solid #666' })}>{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>3. Details of Equipment Under Test</h2>
            <table style={tableStyle} className="compact-table">
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make || "-"],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ...(report.category && report.category !== "N/A" ? [["Category", report.category]] : []),
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ["RP ID", report.rpId],
                  ["No. of Pages", calculatedPages || "-"],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate)],
                  ["Location", report.location],
                  ["Temperature (°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', fontWeight: 700 })}>{label}</th>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tools Used */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>4. Standards / Tools Used</h2>
            <table style={{ ...tableStyle, tableLayout: 'fixed' }} className="compact-table">
              <thead>
                <tr>
                  {["Sl No.", "Nomenclature", "Make", "Model", "Sr. No.", "Range", "Certificate No.", "Valid Till"].map((h, i) => (
                    <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', width: ['6%', '18%', '12%', '12%', '10%', '10%', '16%', '16%'][i] })}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
                  <tr key={i}>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{i + 1}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{tool.nomenclature}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{tool.make || "-"}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{tool.model || "-"}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{tool.SrNo}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{tool.range}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{tool.calibrationCertificateNo}</td>
                    <td style={cellStyle({ border: '0.1px solid #666' })}>{formatDate(tool.calibrationValidTill)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={cellStyle({ border: '0.1px solid #666' })}>No tools recorded</td></tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Notes */}
          <section className="mb-4">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>5. Notes</h2>
            <div style={{ marginLeft: '16px', fontSize: '11px', lineHeight: '1.3' }}>
              {notesArray.map(n => (
                <p key={n.slNo} style={{ marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              ))}
            </div>
          </section>

          {/* Signature */}
          <div className="flex justify-between items-end mt-6">
            <img src={AntesoQRCode} alt="QR" className="h-20 print:h-14" />
            <div className="text-center">
              <img src={Signature} alt="Signature" className="h-16 print:h-12 mx-auto mb-1" />
              <p className="font-bold" style={{ fontSize: '10px' }}>Authorized Signatory</p>
            </div>
          </div>
          <ReportPdfPageFooter todayDate={todayDate} customerCity={placeValue} />
        </div>

        {/* PAGE 2 - SUMMARY TABLE */}
        <div
          className="bg-white px-8 py-2 test-section report-pdf-page-shell"
          style={{
            pageBreakAfter: 'always',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            boxSizing: 'border-box',
            minHeight: '282mm',
          }}
        >
          <ReportPdfPageHeader report={report} formatDate={formatDate} />
          <div style={{ width: '100%', flex: 1 }}>
            <MainTestTableForRadiographyFixed testData={testData} hasTimer={hasTimer} />
          </div>
          <ReportPdfPageFooter todayDate={todayDate} customerCity={placeValue} />
        </div>

        {/* PAGE 3+ - DETAILED TEST RESULTS (footer pinned to bottom of last page in PDF via clone styles) */}
        <div
          className="bg-white px-8 py-2 test-section report-pdf-last-page-shell"
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            boxSizing: 'border-box',
            minHeight: '282mm',
          }}
        >
          <ReportPdfPageHeader report={report} formatDate={formatDate} />
          <div className="report-pdf-last-main" style={{ width: '100%', flex: 1 }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: '16px' }}>DETAILED TEST RESULTS</h2>

            {/* 1. Congruence */}
            {testData.congruence && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>1. Congruence of Radiation &amp; Optical Field</h3>
                {testData.congruence.techniqueFactors && Array.isArray(testData.congruence.techniqueFactors) && testData.congruence.techniqueFactors.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '2px' }}>Technique Factors:</p>
                    <table style={{ ...tableStyle, width: '100%' }}>
                      <thead><tr>
                        {["FFD (cm)", "kV", "mAs"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 8px' })}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {testData.congruence.techniqueFactors.map((tf: any, idx: number) => (
                          <tr key={idx}>
                            <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{tf.fcd || "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{tf.kv || "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{tf.mas || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.congruence.congruenceMeasurements?.length > 0 && (
                  <table style={tableStyle} className="compact-table">
                    <thead><tr>
                      {["Dimension", "Observed Shift (cm)", "Edge Shift (cm)", "% FFD", "Tolerance (%)", "Remarks"].map(h => (
                        <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {testData.congruence.congruenceMeasurements.map((row: any, i: number) => (
                        <tr key={i}>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.dimension || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.observedShift || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.edgeShift || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.percentFED || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.tolerance || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 2. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>2. Central Beam Alignment</h3>
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>Operating parameters:</p>
                    <table style={{ ...tableStyle, width: '100%' }}>
                      <thead><tr>
                        {["FFD (cm)", "kV", "mAs"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 8px' })}>{h}</th>)}
                      </tr></thead>
                      <tbody><tr>
                        <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.centralBeamAlignment.techniqueFactors.fcd || "-"}</td>
                        <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.centralBeamAlignment.techniqueFactors.kv || "-"}</td>
                        <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.centralBeamAlignment.techniqueFactors.mas || "-"}</td>
                      </tr></tbody>
                    </table>
                  </div>
                )}
                {testData.centralBeamAlignment.observedTilt && (
                  <div>
                    <p style={{ fontSize: '11px', marginBottom: '4px' }}>Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam</p>
                    <table style={tableStyle} className="compact-table">
                      <tbody>
                        <tr>
                          <th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', fontWeight: 700 })}>Observed tilt</th>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>
                            {testData.centralBeamAlignment.observedTilt.value || "-"}&deg;
                            {testData.centralBeamAlignment.observedTilt.remark && (
                              <span style={{ marginLeft: '8px' }}>{testData.centralBeamAlignment.observedTilt.remark}</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={cellStyle({ border: '0.1px solid #666', fontWeight: 700 })}>Tolerance: Central Beam Alignment</th>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>
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
            )}

            {/* 3. Effective Focal Spot */}
            {testData.effectiveFocalSpot && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>3. Effective Focal Spot Size</h3>
                <div style={{ marginBottom: '4px' }}>
                  <table style={{ ...tableStyle, width: '100%' }}>
                    <thead><tr><th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 12px' })}>FFD (cm)</th></tr></thead>
                    <tbody><tr><td style={cellStyle({ border: '0.1px solid #666', padding: '1px 12px' })}>{testData.effectiveFocalSpot.fcd || "-"}</td></tr></tbody>
                  </table>
                </div>
                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <table style={tableStyle} className="compact-table">
                    <thead><tr>
                      <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', width: '14%' })}></th>
                      <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', width: '26%' })}>Stated Focal Spot of Tube (mm)</th>
                      <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', width: '26%' })}>Measured Focal Spot (mm)</th>
                      <th style={{ ...cellStyle({ fontWeight: 700, border: '0.1px solid #666', width: '34%' }), textAlign: 'center', fontSize: '10px', lineHeight: '1.3', padding: '2px 4px' }}>
                        Tolerance:<br />
                        1. +{testData.effectiveFocalSpot?.toleranceCriteria?.small?.multiplier ?? 0.5} f for f &lt; {testData.effectiveFocalSpot?.toleranceCriteria?.small?.upperLimit ?? 0.8} mm<br />
                        2. +{testData.effectiveFocalSpot?.toleranceCriteria?.medium?.multiplier ?? 0.4} f for {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.lowerLimit ?? 0.8} &lt;= f &lt;= {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.upperLimit ?? 1.5} mm<br />
                        3. +{testData.effectiveFocalSpot?.toleranceCriteria?.large?.multiplier ?? 0.3} f for f &gt; {testData.effectiveFocalSpot?.toleranceCriteria?.large?.lowerLimit ?? 1.5} mm
                      </th>
                    </tr></thead>
                    <tbody>
                      {testData.effectiveFocalSpot.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                        const fmt = (val: any) => {
                          if (val === undefined || val === null || val === "") return "-";
                          const n = typeof val === 'number' ? val : parseFloat(val);
                          return isNaN(n) ? "-" : n.toFixed(1);
                        };
                        const stated = fmt(spot.statedNominal ?? (spot.statedWidth != null && spot.statedHeight != null ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2 : spot.statedWidth ?? spot.statedHeight));
                        const measured = fmt(spot.measuredNominal ?? (spot.measuredWidth != null && spot.measuredHeight != null ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2 : spot.measuredWidth ?? spot.measuredHeight));
                        return (
                          <tr key={i}>
                            <th scope="row" style={cellStyle({ border: '0.1px solid #666', padding: '2px 4px', fontWeight: 700 })}>{spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}</th>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{stated}</td>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{measured}</td>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{spot.remark || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 4. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>4. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '2px' }}>Test Conditions:</p>
                    <table style={{ ...tableStyle, width: '100%' }}>
                      <thead><tr>
                        {["FDD (cm)", "kV", "mA"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 8px' })}>{h}</th>)}
                      </tr></thead>
                      <tbody><tr>
                        <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                        <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                        <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
                      </tr></tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (() => {
                  const tol = testData.accuracyOfIrradiationTime.tolerance;
                  const tolOp = tol?.operator || "<=";
                  const tolVal = parseFloat(tol?.value ?? "10");
                  const calcError = (set: string, meas: string) => {
                    const s = parseFloat(set), m = parseFloat(meas);
                    if (isNaN(s) || isNaN(m) || s === 0) return "-";
                    return Math.abs((m - s) / s * 100).toFixed(2);
                  };
                  const getRemark = (errorPct: string) => {
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
                    <div style={{ marginBottom: '4px' }}>
                      <table style={tableStyle} className="compact-table">
                        <thead><tr>
                          {["Set Time (sec)", "Measured Time (sec)", "% Error", "Remarks"].map(h => (
                            <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                            const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                            const remark = getRemark(error);
                            return (
                              <tr key={i}>
                                <td style={cellStyle({ border: '0.1px solid #666' })}>{row.setTime || "-"}</td>
                                <td style={cellStyle({ border: '0.1px solid #666' })}>{row.measuredTime || "-"}</td>
                                <td style={cellStyle({ border: '0.1px solid #666' })}>{error !== "-" ? `${error}%` : "-"}</td>
                                <td style={cellStyle({ border: '0.1px solid #666' })}>{remark}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {tol && <p style={{ fontSize: '11px', marginTop: '2px' }}><strong>Tolerance:</strong> Error {tol.operator || "<="} {tol.value || "-"}%</p>}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 5. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>5. Accuracy of Operating Potential</h3>
                {testData.accuracyOfOperatingPotential.table2?.length > 0 && (
                  <table style={tableStyle} className="compact-table">
                    <thead><tr>
                      {["Set kV", "10 mA", "100 mA", "200 mA", "Avg kVp", "Remarks"].map(h => (
                        <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                        <tr key={i}>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.setKV || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.ma10 || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.ma100 || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.ma200 || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.avgKvp || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666' })}>{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 6. Total Filtration */}
            {testData.totalFilteration && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                {testData.totalFilteration.measurements?.length > 0 && (
                  <>
                    <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>5. Accuracy of Operating Potential</h3>
                    <table style={tableStyle} className="compact-table">
                      <thead><tr>
                        <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>Applied kVp</th>
                        {testData.totalFilteration.mAStations?.map((ma: string, idx: number) => (
                          <th key={idx} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>{ma}</th>
                        ))}
                        <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>Average kVp</th>
                        <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>Remarks</th>
                      </tr></thead>
                      <tbody>
                        {testData.totalFilteration.measurements.map((row: any, i: number) => (
                          <tr key={i}>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{row.appliedKvp || "-"}</td>
                            {testData.totalFilteration.mAStations?.map((_: string, idx: number) => (
                              <td key={idx} style={cellStyle({ border: '0.1px solid #666' })}>{row.measuredValues?.[idx] || "-"}</td>
                            ))}
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{row.averageKvp || "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{row.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {testData.totalFilteration.tolerance && (
                      <p style={{ fontSize: '11px', marginTop: '2px' }}><strong>Tolerance:</strong> {testData.totalFilteration.tolerance.sign || "±"} {testData.totalFilteration.tolerance.value || "-"} kVp</p>
                    )}
                  </>
                )}
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
                    <div style={{ marginTop: '6px' }}>
                      <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>6. Total Filtration</h3>
                      <table style={tableStyle} className="compact-table">
                        <tbody>
                          {[["At kVp", `${tf.atKvp || "-"} kVp`], ["Measured Total Filtration", `${tf.required || "-"} mm Al`], ["Required (Tolerance)", !isNaN(reqTol) ? `≥ ${reqTol} mm Al` : "-"], ["Result", filtRemark]].map(([label, val]) => (
                            <tr key={label}>
                              <th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', padding: '2px 6px', fontWeight: 700 })}>{label}</th>
                              <td style={cellStyle({ border: '0.1px solid #666' })}>{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ fontSize: '10px', marginTop: '3px', color: '#444' }}>
                        <strong>Tolerance criteria: </strong>
                        {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} | {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} ≤ kV ≤ {ft.kvThreshold2 ?? "100"} | {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 7. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>{hasTimer ? "7. Linearity of mA Loading" : "7. Linearity of mAs Loading"}</h3>
                {testData.linearityOfMasLoading.table1 && (() => {
                  const t1 = Array.isArray(testData.linearityOfMasLoading.table1) ? testData.linearityOfMasLoading.table1[0] : testData.linearityOfMasLoading.table1;
                  if (!t1) return null;
                  return (
                    <div style={{ marginBottom: '4px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Test Conditions:</p>
                      <table style={{ ...tableStyle, width: '100%' }}>
                        <thead><tr>
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 12px' })}>FDD (cm)</th>
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 12px' })}>kV</th>
                          {hasTimer && <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 12px' })}>Time (sec)</th>}
                        </tr></thead>
                        <tbody><tr>
                          <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 12px' })}>{t1?.fcd || "-"}</td>
                          <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 12px' })}>{t1?.kv || "-"}</td>
                          {hasTimer && <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 12px' })}>{t1?.time || "-"}</td>}
                        </tr></tbody>
                      </table>
                    </div>
                  );
                })()}
                {testData.linearityOfMasLoading.table2?.length > 0 && (() => {
                  const rows = testData.linearityOfMasLoading.table2;
                  const tolVal = parseFloat(testData.linearityOfMasLoading.tolerance ?? '0.1') || 0.1;
                  const tolOp = testData.linearityOfMasLoading.toleranceOperator ?? '<=';
                  const fmtV = (val: any) => { if (val === undefined || val === null) return '-'; const s = String(val).trim(); return s === '' || s === '—' || s === 'undefined' || s === 'null' ? '-' : s; };
                  const xValues: number[] = [];
                  const processedRows = rows.map((row: any) => {
                    const outputs = (row.measuredOutputs ?? []).map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v) && v > 0);
                    const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                    const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : '—';
                    const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? '');
                    const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                    const midMas = match ? (parseFloat(match[1]) + parseFloat(match[2])) / 2 : parseFloat(mAsLabel) || 0;
                    const x = avg !== null && midMas > 0 ? avg / midMas : null;
                    const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : '—';
                    if (x !== null) xValues.push(parseFloat(x.toFixed(4)));
                    return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                  });
                  const hasData = xValues.length > 0;
                  const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : '—';
                  const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : '—';
                  const colNum = hasData && xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0 ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin)) : 0;
                  const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';
                  let pass = false;
                  if (hasData && col !== '—') { const cv = parseFloat(col); switch (tolOp) { case '<': pass = cv < tolVal; break; case '>': pass = cv > tolVal; break; case '<=': pass = cv <= tolVal; break; case '>=': pass = cv >= tolVal; break; default: pass = cv <= tolVal; } }
                  const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';
                  const measHeaders = testData.linearityOfMasLoading.measHeaders || [];
                  return (
                    <div style={{ marginBottom: '4px' }}>
                      <table style={{ ...tableStyle, fontSize: '10px' }}>
                        <thead>
                          <tr>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>mA</th>
                            <th colSpan={measHeaders.length} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Output (mGy)</th>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Avg Output</th>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>X</th>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>X MAX</th>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>X MIN</th>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>CoL</th>
                            <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Remarks</th>
                          </tr>
                          <tr>
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                            {measHeaders.map((h: string, idx: number) => <th key={idx} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>{h || `Meas ${idx + 1}`}</th>)}
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                            <th style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedRows.map((row: any, i: number) => (
                            <tr key={i}>
                              <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{fmtV(row.mAsApplied ?? row.mAsRange)}</td>
                              {measHeaders.map((_: string, idx: number) => <td key={idx} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{fmtV(row.measuredOutputs?.[idx])}</td>)}
                              <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row._avgDisplay}</td>
                              <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row._xDisplay}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={rows.length} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>{xMax}</td>
                                  <td rowSpan={rows.length} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>{xMin}</td>
                                  <td rowSpan={rows.length} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>{col}</td>
                                  <td rowSpan={rows.length} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>{remarks}</td>
                                </>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ fontSize: '10px', marginTop: '2px' }}><strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || "≤"} {testData.linearityOfMasLoading.tolerance || "0.1"}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 8. Consistency of Radiation Output */}
            {testData.outputConsistency && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>8. Consistency of Radiation Output</h3>
                {testData.outputConsistency.ffd?.value && (
                  <div style={{ marginBottom: '4px' }}>
                    <table style={{ ...tableStyle, width: '100%' }}>
                      <thead><tr><th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 12px' })}>FDD (cm)</th></tr></thead>
                      <tbody><tr><td style={cellStyle({ border: '0.1px solid #666', padding: '1px 12px' })}>{testData.outputConsistency.ffd.value}</td></tr></tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.outputRows?.length > 0 && (() => {
                  const rows = testData.outputConsistency.outputRows;
                  const measCount = Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
                  const tolVal = parseFloat(testData.outputConsistency.tolerance?.value ?? '0.05') || 0.05;
                  const tolOp = testData.outputConsistency.tolerance?.operator ?? '<=';
                  const getVal = (o: any): number => { if (o == null) return NaN; if (typeof o === 'number') return o; if (typeof o === 'string') return parseFloat(o); if (typeof o === 'object' && 'value' in o) return parseFloat(o.value); return NaN; };
                  return (
                    <div style={{ marginBottom: '4px' }}>
                      <table style={{ ...tableStyle, fontSize: '10px', tableLayout: 'auto' }}>
                        <thead><tr>
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>kV</th>
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>mAs</th>
                          {Array.from({ length: measCount }, (_, i) => <th key={i} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Meas {i + 1}</th>)}
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Avg (X̄)</th>
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>CoV</th>
                          <th style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Remark</th>
                        </tr></thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
                            const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                            const avgDisplay = avg !== null ? avg.toFixed(4) : (row.avg || '-');
                            let covDisplay = '-', remark = row.remark || '-';
                            if (avg !== null && avg > 0) {
                              const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
                              const cov = Math.sqrt(variance) / avg;
                              if (isFinite(cov)) { covDisplay = cov.toFixed(3); remark = (tolOp === '<=' || tolOp === '<') ? (cov <= tolVal ? 'Pass' : 'Fail') : (cov >= tolVal ? 'Pass' : 'Fail'); }
                            } else if (row.cv) { covDisplay = row.cv; }
                            return (
                              <tr key={i}>
                                <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row.kv || '-'}</td>
                                <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row.mas || '-'}</td>
                                {Array.from({ length: measCount }, (_, j) => { const raw = (row.outputs ?? [])[j]; const display = raw != null ? (typeof raw === 'object' && 'value' in raw ? raw.value : String(raw)) : '-'; return <td key={j} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{display || '-'}</td>; })}
                                <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{avgDisplay}</td>
                                <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{covDisplay}</td>
                                <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{remark}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {testData.outputConsistency.tolerance && <p style={{ fontSize: '11px', marginTop: '2px' }}><strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value || "0.05"}</p>}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 9. Tube Housing Leakage */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>9. Tube Housing Leakage</h3>
                <div style={{ marginBottom: '4px' }}>
                  <table style={{ ...tableStyle, width: '100%' }}>
                    <thead><tr>
                      {["FDD (cm)", "kV", "mA", "Time (Sec)"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 8px' })}>{h}</th>)}
                    </tr></thead>
                    <tbody><tr>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.radiationLeakageLevel.fcd || testData.radiationLeakageLevel.settings?.fcd || "100"}</td>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.radiationLeakageLevel.kv || testData.radiationLeakageLevel.settings?.kv || "-"}</td>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "-"}</td>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{testData.radiationLeakageLevel.time || testData.radiationLeakageLevel.settings?.time || "-"}</td>
                    </tr></tbody>
                  </table>
                </div>
                <p style={{ fontSize: '10px', marginBottom: '4px' }}><strong>Workload:</strong> {testData.radiationLeakageLevel.workload || "-"} {testData.radiationLeakageLevel.workloadUnit || "mA·min/week"}</p>
                {testData.radiationLeakageLevel.leakageMeasurements?.length > 0 && (
                  <table style={{ ...tableStyle, fontSize: '10px' }}>
                    <thead>
                      <tr>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', width: '15%', verticalAlign: 'middle' })}>Location</th>
                        <th colSpan={5} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Exposure Level (mR/hr)</th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>Result (mR in 1 hr)</th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>Result (mGy in 1 hr)</th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>Remarks</th>
                      </tr>
                      <tr>
                        {["Left", "Right", "Front", "Back", "Top"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationLeakageLevel.leakageMeasurements.map((row: any, i: number) => {
                        const maValue = parseFloat(testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "0");
                        const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");
                        const values = [row.left, row.right, row.front, row.back, row.top].map(v => parseFloat(v) || 0).filter(v => v > 0);
                        const rowMax = values.length > 0 ? Math.max(...values) : 0;
                        let calcMR = "-", calcMGy = "-", remark = row.remark || "-";
                        if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                          const resMR = (workloadValue * rowMax) / (60 * maValue);
                          calcMR = resMR.toFixed(3); calcMGy = (resMR / 114).toFixed(4);
                          if (remark === "-" || !remark) { remark = (resMR / 114) <= (parseFloat(testData.radiationLeakageLevel.toleranceValue) || 1.0) ? "Pass" : "Fail"; }
                        }
                        return (
                          <tr key={i}>
                            <th scope="row" style={cellStyle({ border: '0.1px solid #666', fontSize: '10px', fontWeight: 700 })}>{row.location || "-"}</th>
                            {["left", "right", "front", "back", "top"].map(k => <td key={k} style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{(row as any)[k] || "-"}</td>)}
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{calcMR}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{calcMGy}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{remark}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {(() => {
                  const maValue = parseFloat(testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.settings?.ma || "0");
                  const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");
                  const getSummary = (locName: string) => {
                    const row = testData.radiationLeakageLevel.leakageMeasurements?.find((m: any) => m.location === locName);
                    if (!row) return null;
                    const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                    const rowMax = values.length > 0 ? Math.max(...values) : 0;
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {tubeSummary && (
                          <div style={{ flex: 1, border: '0.1px solid #666', padding: '4px', fontSize: '10px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>Tube Housing Summary:</p>
                            <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <strong>{tubeSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                        {collimatorSummary && (
                          <div style={{ flex: 1, border: '0.1px solid #666', padding: '4px', fontSize: '10px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>Collimator Summary:</p>
                            <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <strong>{collimatorSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '10px', marginTop: '4px', border: '0.1px solid #666', padding: '2px 6px' }}>
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt; <strong>{testData.radiationLeakageLevel.toleranceValue || '1'} mGy ({parseFloat(testData.radiationLeakageLevel.toleranceValue || '1') * 114} mR) in one hour.</strong>
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 10. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-4 test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>10. Details of Radiation Protection Survey</h3>
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>1. Survey Details</p>
                    <table style={tableStyle} className="compact-table">
                      <tbody>
                        <tr><th scope="row" style={cellStyle({ width: '60%', border: '0.1px solid #666', padding: '2px 6px', fontWeight: 700 })}>Date of Radiation Protection Survey</th><td style={cellStyle({ border: '0.1px solid #666' })}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td></tr>
                        <tr><th scope="row" style={cellStyle({ border: '0.1px solid #666', padding: '2px 6px', fontWeight: 700 })}>Whether Radiation Survey Meter used has Valid Calibration Certificate</th><td style={cellStyle({ border: '0.1px solid #666' })}>{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {(testData.radiationProtectionSurvey.appliedCurrent || testData.radiationProtectionSurvey.appliedVoltage) && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>2. Equipment Setting</p>
                    <table style={tableStyle} className="compact-table">
                      <tbody>
                        {[["Applied Current (mA)", testData.radiationProtectionSurvey.appliedCurrent], ["Applied Voltage (kV)", testData.radiationProtectionSurvey.appliedVoltage], ["Exposure Time(s)", testData.radiationProtectionSurvey.exposureTime], ["Workload (mA min/week)", testData.radiationProtectionSurvey.workload]].map(([label, val]) => (
                          <tr key={label}><th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', padding: '2px 6px', fontWeight: 700 })}>{label}</th><td style={cellStyle({ border: '0.1px solid #666' })}>{val || "-"}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</p>
                    <table style={tableStyle} className="compact-table">
                      <thead><tr>
                        {["Location", "Max. Radiation Level", "Result", "Remarks"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                          <tr key={i}>
                            <td style={cellStyle({ border: '0.1px solid #666', padding: '2px 6px' })}>{loc.location || "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666' })}>{loc.result || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ marginBottom: '4px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>4. Calculation Formula</p>
                  <table style={tableStyle} className="compact-table">
                    <tbody><tr><td style={cellStyle({ border: '0.1px solid #666', padding: '2px 6px' })}>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</td></tr></tbody>
                  </table>
                </div>
                {testData.radiationProtectionSurvey.locations?.length > 0 && (() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");
                  const maxWorkerLoc = workerLocs.reduce((max: any, loc: any) => (parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max.mRPerWeek) || 0) ? loc : max, workerLocs[0] || { mRPerHr: '', location: '' });
                  const maxPublicLoc = publicLocs.reduce((max: any, loc: any) => (parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max.mRPerWeek) || 0) ? loc : max, publicLocs[0] || { mRPerHr: '', location: '' });
                  const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const workerResult = parseFloat(maxWorkerWeekly) > 0 ? (parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : "Fail") : "";
                  const publicResult = parseFloat(maxPublicWeekly) > 0 ? (parseFloat(maxPublicWeekly) <= 2 ? "Pass" : "Fail") : "";
                  return (
                    <div style={{ marginBottom: '4px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</p>
                      <table style={tableStyle} className="compact-table">
                        <thead><tr>{["Category", "Result", "Remarks"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666' })}>{h}</th>)}</tr></thead>
                        <tbody>
                          <tr><th scope="row" style={cellStyle({ border: '0.1px solid #666', fontWeight: 700 })}>For Radiation Worker</th><td style={cellStyle({ border: '0.1px solid #666' })}>{maxWorkerWeekly || "0.000"} mR/week</td><td style={cellStyle({ border: '0.1px solid #666' })}>{workerResult || "-"}</td></tr>
                          <tr><th scope="row" style={cellStyle({ border: '0.1px solid #666', fontWeight: 700 })}>For Public</th><td style={cellStyle({ border: '0.1px solid #666' })}>{maxPublicWeekly || "0.000"} mR/week</td><td style={cellStyle({ border: '0.1px solid #666' })}>{publicResult || "-"}</td></tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '4px', fontSize: '10px' }}>
                        {maxWorkerLoc.mRPerHr && parseFloat(maxWorkerLoc.mRPerHr) > 0 && (
                          <div style={{ border: '1px solid #ccc', padding: '3px 6px', marginBottom: '3px' }}>
                            <p style={{ fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                            <p><strong>Location:</strong> {maxWorkerLoc.location}</p>
                            <p><strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} × {maxWorkerLoc.mRPerHr || '—'}) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'}) = {maxWorkerWeekly} mR/week</p>
                          </div>
                        )}
                        {maxPublicLoc.mRPerHr && parseFloat(maxPublicLoc.mRPerHr) > 0 && (
                          <div style={{ border: '1px solid #ccc', padding: '3px 6px', marginBottom: '3px' }}>
                            <p style={{ fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p><strong>Location:</strong> {maxPublicLoc.location}</p>
                            <p><strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} × {maxPublicLoc.mRPerHr || '—'}) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'}) = {maxPublicWeekly} mR/week</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ marginBottom: '4px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>6. Permissible Limit</p>
                  <table style={tableStyle} className="compact-table">
                    <tbody>
                      <tr><th scope="row" style={cellStyle({ width: '50%', border: '0.1px solid #666', padding: '2px 6px', fontWeight: 700 })}>For location of Radiation Worker</th><td style={cellStyle({ border: '0.1px solid #666' })}>20 mSv in a year (40 mR/week)</td></tr>
                      <tr><th scope="row" style={cellStyle({ border: '0.1px solid #666', padding: '2px 6px', fontWeight: 700 })}>For Location of Member of Public</th><td style={cellStyle({ border: '0.1px solid #666' })}>1 mSv in a year (2mR/week)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-gray-500" style={{ marginTop: '32px', fontSize: '14px' }}>No detailed test results available for this report.</p>
            )}
          </div>

          <ReportPdfPageFooter todayDate={todayDate} customerCity={placeValue} />
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
        /* Nuclear border reset — nothing renders thicker than 0.1px */
        .fixed-report-pdf table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          text-align: center !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .fixed-report-pdf table td p,
        .fixed-report-pdf table th p,
        .fixed-report-pdf table td span,
        .fixed-report-pdf table th span {
          text-align: center !important;
        }
        .fixed-report-pdf td,
        .fixed-report-pdf th {
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          text-align: center !important;
          border-radius: 0 !important;
          outline: none !important;
          box-shadow: none !important;
          padding: 4px 6px !important;
          line-height: 1.3 !important;
          height: auto !important;
          min-height: 16px !important;
          white-space: normal !important;
          word-break: break-word !important;
        }
        .fixed-report-pdf table thead th,
        .fixed-report-pdf table tbody th {
          font-weight: 700 !important;
        }
        .fixed-report-pdf table tbody td {
          font-weight: 400 !important;
        }
        /* Hairline only — override Tailwind thick borders (avoid matching border-2xl etc.) */
        .fixed-report-pdf .border-2,
        .fixed-report-pdf .border-4,
        .fixed-report-pdf .border-8 {
          border-width: 0.1px !important;
        }
        .fixed-report-pdf .compact-table td,
        .fixed-report-pdf .compact-table th {
          padding: 4px 6px !important;
          line-height: 1.3 !important;
        }
        .fixed-report-pdf .rounded,
        .fixed-report-pdf .rounded-lg,
        .fixed-report-pdf .rounded-r,
        .fixed-report-pdf .rounded-xl {
          border-radius: 0 !important;
        }
        .fixed-report-pdf .shadow-xl,
        .fixed-report-pdf .shadow-2xl {
          box-shadow: none !important;
        }
        .fixed-report-pdf .overflow-x-auto {
          overflow: visible !important;
        }
        .fixed-report-pdf .report-pdf-page-header {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .fixed-report-pdf .report-pdf-footer-block {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-top: auto !important;
        }
        .fixed-report-pdf .report-pdf-last-page-shell {
          display: flex !important;
          flex-direction: column !important;
          min-height: 282mm !important;
          box-sizing: border-box !important;
        }
        .fixed-report-pdf .report-pdf-page-shell {
          display: flex !important;
          flex-direction: column !important;
          min-height: 282mm !important;
          box-sizing: border-box !important;
        }
        .fixed-report-pdf .report-pdf-last-main {
          flex: 1 1 auto !important;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          @page { margin: 0.5cm; size: A4; }
          .print\\:break-before-page { page-break-before: always; }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
          /* Absolute border reset for print (report root only) */
          .fixed-report-pdf table {
            border-width: 0.1px !important;
            border-style: solid !important;
            border-color: #666 !important;
            border-collapse: collapse !important;
            box-sizing: border-box !important;
          }
          .fixed-report-pdf td,
          .fixed-report-pdf th {
            border-width: 0.1px !important;
            border-style: solid !important;
            border-color: #666 !important;
            box-sizing: border-box !important;
          }
          .fixed-report-pdf td,
          .fixed-report-pdf th {
            padding: 4px 6px !important;
            line-height: 1.3 !important;
            height: auto !important;
            min-height: 16px !important;
            white-space: normal !important;
            text-align: center !important;
            vertical-align: middle !important;
          }
          .fixed-report-pdf thead th,
          .fixed-report-pdf tbody th {
            font-weight: 700 !important;
          }
          .fixed-report-pdf tbody td {
            font-weight: 400 !important;
          }
          .fixed-report-pdf .report-pdf-last-page-shell {
            min-height: 282mm !important;
          }
          .fixed-report-pdf .report-pdf-page-shell {
            min-height: 282mm !important;
          }
          thead { display: table-header-group; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
        }
      `}</style>
      </div>

    </>
  );
};

export default ViewServiceReportRadiographyFixed;