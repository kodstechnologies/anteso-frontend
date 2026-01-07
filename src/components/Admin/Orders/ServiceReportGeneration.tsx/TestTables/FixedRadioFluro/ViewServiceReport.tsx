// src/components/reports/ViewServiceReportFixedRadioFluro.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeader } from "../../../../../../api";
import FixedRadioFlouroResultTable from "./FixedRadioFluoroResultTable";
import MainTestTableForFixedRadioFluro from "./MainTestTableForFixedRadioFluro";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";

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
  srfNumber: string;
  srfDate: string;
  testReportNumber: string;
  issueDate: string;
  nomenclature: string;
  make: string;
  model: string;
  slNumber: string;
  condition: string;
  testingProcedureNumber: string;
  engineerNameRPId: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  category: string;
  // Test documents
  accuracyOfOperatingPotentialFixedRadioFluoro?: any;
  OutputConsistencyForFixedRadioFlouro?: any;
  LowContrastResolutionFixedRadioFlouro?: any;
  HighContrastResolutionFixedRadioFluoro?: any;
  ExposureRateTableTopFixedRadioFlouro?: any;
  LinearityOfmAsLoadingFixedRadioFluoro?: any;
  TubeHousingLeakageFixedRadioFlouro?: any;
  AccuracyOfIrradiationTimeFixedRadioFluoro?: any;
  CongruenceOfRadiationForRadioFluro?: any;
  CentralBeamAlignmentForRadioFluoro?: any;
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

const ViewServiceReportFixedRadioFluro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [pageCount, setPageCount] = useState<string>('Calculating...');

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getReportHeader(serviceId);

        if (response.exists && response.data) {
          const data = response.data;
          setReport({
            ...data,
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          setTestData({
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotentialFixedRadioFluoro || null,
            outputConsistency: data.OutputConsistencyForFixedRadioFlouro || null,
            lowContrastResolution: data.LowContrastResolutionFixedRadioFlouro || null,
            highContrastResolution: data.HighContrastResolutionFixedRadioFluoro || null,
            exposureRate: data.ExposureRateTableTopFixedRadioFlouro || null,
            linearityOfmAsLoading: data.LinearityOfmAsLoadingFixedRadioFluoro || null,
            tubeHousingLeakage: data.TubeHousingLeakageFixedRadioFlouro || null,
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeFixedRadioFluoro || null,
            congruenceOfRadiation: data.CongruenceOfRadiationForRadioFluro || null,
            centralBeamAlignment: data.CentralBeamAlignmentForRadioFluoro || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  // Calculate page count
  useEffect(() => {
    if (report) {
      const calculatePages = () => {
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
          // Account for print margins (0.5cm top and bottom = 1cm total = ~37.8px)
          const pageHeight = 1123 - 37.8; // A4 height minus margins
          const contentHeight = reportContent.scrollHeight;
          const estimatedPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
          setPageCount(String(estimatedPages));
        }
      };
      
      // Calculate immediately and after a delay to ensure content is rendered
      calculatePages();
      const timer = setTimeout(calculatePages, 500);
      const timer2 = setTimeout(calculatePages, 1000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [report, testData]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `FixedRadioFluro-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Fixed RadioFluro Report...</div>;
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
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Print
        </button>
        <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Download PDF
        </button>
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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>SRF No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{report.srfNumber}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>SRF Date</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{formatDate(report.srfDate)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>ULR No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>TC9A43250001485F</td>
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
            QA TEST REPORT FOR FIXED RADIOGRAPHY & FLUOROSCOPY EQUIPMENT
          </h1>

          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Customer</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.customerName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.address}</td>
                </tr>
              </tbody>
            </table>
          </section>
          {/* Reference */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
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
                  ["Category", report.category || "-"],
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name & RP ID", report.engineerNameRPId],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate)],
                  ["Location", report.location],
                  ["Temperature (°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
                  ["Total Pages", pageCount],
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
              <table className="w-full border-2 border-black text-xs print:text-[8px] compact-table" style={{ tableLayout: 'fixed', width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '6%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sl No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '16%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Nomenclature</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make / Model</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Range</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Certificate No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((t, i) => (
                    <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.nomenclature}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.make} / {t.model}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(t.calibrationValidTill)}</td>
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
              {notesArray.length > 0 ? notesArray.map(n => (
                <p key={n.slNo} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              )) : <p>No notes added.</p>}
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
            <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
            <p>Email: info@antesobiomedicalengg.com</p>
          </footer>
        </div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none flex justify-center" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForFixedRadioFluro testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Operating Potential (kVp)</h3>

                {/* Test Conditions */}
                {testData.accuracyOfOperatingPotential.table1?.length > 0 && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <div className="text-sm print:text-[9px] grid grid-cols-2 md:grid-cols-4 gap-4" style={{ fontSize: '11px' }}>
                      {testData.accuracyOfOperatingPotential.table1.map((c: any, i: number) => (
                        <div key={i}>
                          <span className="font-medium">mA:</span> {c.mA || c.ma || "-"},{' '}
                          <span className="font-medium">Time:</span> {c.time || "-"} ms
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Deviation</th>
                        <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKvp || row.setKVp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredKvp || row.measuredKVp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.deviation != null ? row.deviation.toFixed(2) + "%" : "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>±10%</td>
                          <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={Math.abs(row.deviation || 0) <= 10 ? "text-green-600" : "text-red-600"}>
                              {Math.abs(row.deviation || 0) <= 10 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">2. Output Consistency</h3>
                {testData.outputConsistency.outputRows && Array.isArray(testData.outputConsistency.outputRows) && testData.outputConsistency.outputRows.length > 0 ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">FFD (cm)</th>
                          <th className="border border-black p-3 print:p-2">Mean</th>
                          <th className="border border-black p-3 print:p-2">COV</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => {
                          const cov = row.cov ? parseFloat(row.cov) : null;
                          const tolerance = testData.outputConsistency.tolerance ? parseFloat(testData.outputConsistency.tolerance) : 0.05;
                          const toleranceNum = tolerance > 1 ? tolerance / 100 : tolerance;
                          const isPass = cov != null ? cov <= toleranceNum : false;
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-3 print:p-2 font-semibold">{row.ffd || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{row.mean || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{cov != null ? cov.toFixed(3) : "-"}</td>
                              <td className="border border-black p-3 print:p-2">≤ {tolerance > 1 ? tolerance : tolerance * 100}%</td>
                              <td className="border border-black p-3 print:p-2 font-bold">
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : testData.outputConsistency.cov != null ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">Parameter</th>
                          <th className="border border-black p-3 print:p-2">Measured Value</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">Coefficient of Variation (COV)</td>
                          <td className="border border-black p-3 print:p-2">{testData.outputConsistency.cov.toFixed(3)}</td>
                          <td className="border border-black p-3 print:p-2">≤ 0.05</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={testData.outputConsistency.cov <= 0.05 ? "text-green-600" : "text-red-600"}>
                              {testData.outputConsistency.cov <= 0.05 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}

            {/* 3. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Low Contrast Resolution</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', wordWrap: 'break-word', overflowWrap: 'break-word', border: '2px solid #000000' }}>
                    <tbody>
                      {/* Row 1 - with green borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          Diameter of the smallest size hole clearly resolved on the monitor
                        </td>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          {testData.lowContrastResolution.smallestHoleSize || '1.0'} mm hole pattern must be resolved
                        </td>
                      </tr>
                      {/* Row 2 - with black borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          Recommended performance standard
                        </td>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          {testData.lowContrastResolution.recommendedStandard || '3.0'} mm hole pattern must be resolved
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. High Contrast Resolution</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', wordWrap: 'break-word', overflowWrap: 'break-word', border: '2px solid #000000' }}>
                    <tbody>
                      {/* Row 1 - with green borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          Bar strips resolved on the monitor
                        </td>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          {testData.highContrastResolution.measuredLpPerMm || '1.0'} lp/mm pattern must be resolved
                        </td>
                      </tr>
                      {/* Row 2 - with black borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          Recommended performance standard
                        </td>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          {testData.highContrastResolution.recommendedStandard || '1.50'} lp/mm pattern must be resolved
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Exposure Rate at Table Top */}
            {testData.exposureRate && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">5. Exposure Rate at Table Top</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Parameter</th>
                        <th className="border border-black p-3 print:p-2">Measured Value</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-3 print:p-2 font-semibold">Exposure Rate</td>
                        <td className="border border-black p-3 print:p-2">{testData.exposureRate.measuredValue || "N/A"} mGy/min</td>
                        <td className="border border-black p-3 print:p-2">≤ 5 mGy/min</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={(testData.exposureRate.measuredValue || 0) <= 5 ? "text-green-600" : "text-red-600"}>
                            {(testData.exposureRate.measuredValue || 0) <= 5 ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">6. Radiation Leakage from Tube Housing</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Parameter</th>
                        <th className="border border-black p-3 print:p-2">Measured Value</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-3 print:p-2 font-semibold">Radiation Leakage (at 1m distance)</td>
                        <td className="border border-black p-3 print:p-2">{testData.tubeHousingLeakage.leakageRate || "N/A"} mGy/hr</td>
                        <td className="border border-black p-3 print:p-2">≤ 1 mGy/hr</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={(testData.tubeHousingLeakage.leakageRate || 0) <= 1 ? "text-green-600" : "text-red-600"}>
                            {(testData.tubeHousingLeakage.leakageRate || 0) <= 1 ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Linearity of mAs Loading */}
            {testData.linearityOfmAsLoading && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">7. Linearity of mAs Loading</h3>
                {testData.linearityOfmAsLoading.table2 && Array.isArray(testData.linearityOfmAsLoading.table2) && testData.linearityOfmAsLoading.table2.length > 0 ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">mAs</th>
                          <th className="border border-black p-3 print:p-2">Measured Values</th>
                          <th className="border border-black p-3 print:p-2">Coefficient of Linearity</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.linearityOfmAsLoading.table2.map((row: any, i: number) => {
                          const col = row.col ? parseFloat(row.col) : null;
                          const isPass = col != null ? col <= 0.1 : false;
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-3 print:p-2 font-semibold">{row.mAs || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{row.measuredValues || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{col != null ? col.toFixed(3) : "-"}</td>
                              <td className="border border-black p-3 print:p-2">≤ 0.1</td>
                              <td className="border border-black p-3 print:p-2 font-bold">
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : testData.linearityOfmAsLoading.col != null ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">Parameter</th>
                          <th className="border border-black p-3 print:p-2">Measured Value</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">Coefficient of Linearity</td>
                          <td className="border border-black p-3 print:p-2">{testData.linearityOfmAsLoading.col.toFixed(3)}</td>
                          <td className="border border-black p-3 print:p-2">≤ 0.1</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={(testData.linearityOfmAsLoading.col || 0) <= 0.1 ? "text-green-600" : "text-red-600"}>
                              {(testData.linearityOfmAsLoading.col || 0) <= 0.1 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}

            {/* 8. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">8. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes) && testData.accuracyOfIrradiationTime.irradiationTimes.length > 0 ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">Set Time (ms)</th>
                          <th className="border border-black p-3 print:p-2">Measured Time (ms)</th>
                          <th className="border border-black p-3 print:p-2">% Error</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                          const setTime = parseFloat(row.setTime);
                          const measuredTime = parseFloat(row.measuredTime);
                          const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                          const toleranceValue = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "5");
                          let error = "-";
                          let isPass = false;

                          if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                            error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
                            const errorVal = parseFloat(error);

                            if (toleranceOperator === "<=") {
                              isPass = errorVal <= toleranceValue;
                            } else if (toleranceOperator === ">=") {
                              isPass = errorVal >= toleranceValue;
                            } else if (toleranceOperator === "=") {
                              isPass = Math.abs(errorVal - toleranceValue) < 0.01;
                            }
                          }

                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-3 print:p-2 font-semibold">{row.setTime || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{row.measuredTime || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{error}</td>
                              <td className="border border-black p-3 print:p-2">{toleranceOperator} {toleranceValue}%</td>
                              <td className="border border-black p-3 print:p-2 font-bold">
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : testData.accuracyOfIrradiationTime.maxDeviation != null ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">Parameter</th>
                          <th className="border border-black p-3 print:p-2">Measured Value</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">Maximum Deviation</td>
                          <td className="border border-black p-3 print:p-2">{testData.accuracyOfIrradiationTime.maxDeviation.toFixed(1)}%</td>
                          <td className="border border-black p-3 print:p-2">±5%</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={Math.abs(testData.accuracyOfIrradiationTime.maxDeviation || 0) <= 5 ? "text-green-600" : "text-red-600"}>
                              {Math.abs(testData.accuracyOfIrradiationTime.maxDeviation || 0) <= 5 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}

            {/* 9. Congruence of Radiation Field */}
            {testData.congruenceOfRadiation && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">9. Congruence of Radiation and Light Field</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Parameter</th>
                        <th className="border border-black p-3 print:p-2">Measured Value</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-3 print:p-2 font-semibold">Max Misalignment</td>
                        <td className="border border-black p-3 print:p-2">{testData.congruenceOfRadiation.maxMisalignment} cm</td>
                        <td className="border border-black p-3 print:p-2">≤ 2 cm</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={(testData.congruenceOfRadiation.maxMisalignment || 0) <= 2 ? "text-green-600" : "text-red-600"}>
                            {(testData.congruenceOfRadiation.maxMisalignment || 0) <= 2 ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 10. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">10. Central Beam Alignment</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Parameter</th>
                        <th className="border border-black p-3 print:p-2">Measured Value</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-3 print:p-2 font-semibold">Deviation</td>
                        <td className="border border-black p-3 print:p-2">{testData.centralBeamAlignment.deviation} mm</td>
                        <td className="border border-black p-3 print:p-2">≤ 1% of SID ({testData.centralBeamAlignment.sid || 100} mm)</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={(testData.centralBeamAlignment.deviation || 0) <= (0.01 * (testData.centralBeamAlignment.sid || 100)) ? "text-green-600" : "text-red-600"}>
                            {(testData.centralBeamAlignment.deviation || 0) <= (0.01 * (testData.centralBeamAlignment.sid || 100)) ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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

        {/* Summary Table */}
        <div className="px-8 py-12 print:p-8">
          <div className="max-w-5xl mx-auto print:max-w-none">
            {/* <FixedRadioFlouroResultTable testResults={summaryRows} /> */}
          </div>
        </div>
      </div>

      {/* Page Count Display */}
      <div className="fixed bottom-4 left-4 print:hidden z-50 bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-gray-300">
        <p className="text-sm font-semibold text-gray-700">
          Total Pages: <span className="text-blue-600">{pageCount}</span>
        </p>
      </div>

      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            counter-reset: page 1;
            margin: 0; 
            padding: 0; 
          }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
          @page { 
            margin: 0.5cm; 
            size: A4; 
            counter-increment: page;
          }
          @page:first {
            counter-reset: page 1;
          }
          body::after {
            content: "Page " counter(page) " of " counter(pages);
            position: fixed;
            bottom: 10px;
            right: 20px;
            font-size: 10px;
            color: #555;
          }
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

export default ViewServiceReportFixedRadioFluro;