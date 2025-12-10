// src/components/reports/ViewServiceReportBMD.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getRadiationProtectionSurveyByServiceIdForBmd, getReportHeader } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForBMD from "./MainTestTableForBMD";
import {
  getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD,
  getReproducibilityOfRadiationOutputByServiceIdForBmd,
  getLinearityOfMaLoadingByServiceIdForBMD,
  getRadiationLeakageLevelByServiceIdForBMD,
  // getRadiationProtectionSurveyByServiceIdForBmd,
} from "../../../../../../api";

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
  customerName?: string;
  address?: string;
  srfNumber?: string;
  srfDate?: any;
  testReportNumber?: string;
  issueDate?: any;
  nomenclature?: string;
  make?: string;
  model?: string;
  slNumber?: string;
  category?: string;
  condition?: string;
  testingProcedureNumber?: string;
  engineerNameRPId?: string;
  testDate?: any;
  testDueDate?: string;
  location?: string;
  temperature?: string;
  humidity?: string;
  toolsUsed?: Tool[];
  notes?: Note[];
}

const defaultNotes: Note[] = [
  { slNo: "5.1", text: "The Test Report relates only to the above item only." },
  { slNo: "5.2", text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL." },
  { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
  { slNo: "5.4", text: "Referred standard for Testing: AERB Safety Code for Medical Diagnostic X-ray Equipment and Installations." },
  { slNo: "5.5", text: "Any error in this Report should be brought to our knowledge within 30 days from the date of this report." },
  { slNo: "5.6", text: "Results reported are valid at the time of and under the stated conditions of measurements." },
  { slNo: "5.7", text: "Name, Address & Contact detail is provided by Customer." },
];

const ViewServiceReportBMD: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

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
        // Fetch report header - using generic endpoint for now
        const response = await getReportHeader(serviceId);

        if (response?.exists && response.data) {
          const data = response.data;

          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "BMD/DEXA",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            category: data.category || "-",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          // Fetch all BMD test data
          const [
            accuracyOfOperatingPotential,
            reproducibilityOfRadiationOutput,
            linearityOfMaLoading,
            tubeHousingLeakage,
            radiationProtectionSurvey,
          ] = await Promise.all([
            getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD(serviceId).catch(() => null),
            getReproducibilityOfRadiationOutputByServiceIdForBmd(serviceId).catch(() => null),
            getLinearityOfMaLoadingByServiceIdForBMD(serviceId).catch(() => null),
            getRadiationLeakageLevelByServiceIdForBMD(serviceId).catch(() => null),
            getRadiationProtectionSurveyByServiceIdForBmd(serviceId).catch(() => null),
          ]);

          setTestData({
            accuracyOfOperatingPotential: accuracyOfOperatingPotential?.data || null,
            reproducibilityOfRadiationOutput: reproducibilityOfRadiationOutput?.data || null,
            linearityOfMaLoading: linearityOfMaLoading?.data || null,
            tubeHousingLeakage: tubeHousingLeakage?.data || null,
            radiationProtectionSurvey: radiationProtectionSurvey?.data || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load BMD report:", err);
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
        filename: `BMD-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading report...</div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Report not found</div>
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

      <div id="report-content">
        {/* PAGE 1 - MAIN REPORT */}
        <div className="bg-white print:py-0 px-8 py-2 print:px-8 print:py-2" style={{ pageBreakAfter: 'always' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
              <img src={logoA} alt="NABL" className="h-28" />
              <div className="text-right">
                <table className="text-xs border border-gray-600">
                  <tbody>
                    <tr><td className="border px-3 py-1 font-bold">SRF No.</td><td className="border px-3 py-1">{report.srfNumber}</td></tr>
                    <tr><td className="border px-3 py-1 font-bold">SRF Date</td><td className="border px-3 py-1">{formatDate(report.srfDate)}</td></tr>
                    <tr><td className="border px-3 py-1 font-bold">ULR No.</td><td className="border px-3 py-1">TC9A43250001485F</td></tr>
                  </tbody>
                </table>
              </div>
              <img src={logo} alt="Logo" className="h-28" />
            </div>

          <div className="text-center mb-4">
            <p className="text-sm">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm">Radiological Safety Division, Mumbai-400094</p>
          </div>

          <h1 className="text-center text-2xl font-bold underline mb-4">
            QA TEST REPORT FOR BMD/DEXA
          </h1>
          <p className="text-center italic text-sm mb-6">
            (Periodic Quality Assurance as per AERB Guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-4">
            <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
            <div className="border-2 border-gray-600 p-5 text-lg">
              <p><strong>Customer:</strong> {report.customerName}</p>
              <p><strong>Address:</strong> {report.address}</p>
            </div>
          </section>

          {/* Reference */}
          <section className="mb-4">
            <h2 className="font-bold text-lg mb-3">2. Reference</h2>
            <table className="w-full border-2 border-gray-600 text-sm">
              <tbody>
                <tr><td className="border p-3 font-medium w-1/2">SRF No. & Date</td><td className="border p-3">{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr><td className="border p-3 font-medium">Test Report No. & Issue Date</td><td className="border p-3">{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-4">
            <h2 className="font-bold text-lg mb-3">3. Equipment Details</h2>
            <table className="w-full border-2 border-gray-600 text-sm">
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ["Category", report.category || "-"],
                  ["Location", report.location],
                  ["Test Date", formatDate(report.testDate)],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="border p-3 font-medium w-1/2">{label}</td>
                    <td className="border p-3">{value || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tools Used */}
          <section className="mb-4">
            <h2 className="font-bold text-lg mb-3">4. Standards / Tools Used</h2>
            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
              <table className="w-full border-2 border-gray-600 text-xs" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2" style={{ width: '6%' }}>Sl No.</th>
                    <th className="border p-2" style={{ width: '16%' }}>Nomenclature</th>
                    <th className="border p-2" style={{ width: '14%' }}>Make / Model</th>
                    <th className="border p-2" style={{ width: '14%' }}>Sr. No.</th>
                    <th className="border p-2" style={{ width: '14%' }}>Range</th>
                    <th className="border p-2" style={{ width: '18%' }}>Certificate No.</th>
                    <th className="border p-2" style={{ width: '18%' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td className="border p-2 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{i + 1}</td>
                      <td className="border p-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{tool.nomenclature}</td>
                      <td className="border p-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{tool.make} / {tool.model}</td>
                      <td className="border p-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{tool.SrNo}</td>
                      <td className="border p-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{tool.range}</td>
                      <td className="border p-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{tool.calibrationCertificateNo}</td>
                      <td className="border p-2" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="text-center py-4">No tools recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-3">5. Notes</h2>
            <div className="ml-8 text-sm">
              {notesArray.map(n => (
                <p key={n.slNo}><strong>{n.slNo}.</strong> {n.text}</p>
              ))}
            </div>
          </section>

          {/* Signature */}
          <div className="flex justify-between items-end mt-8">
            <img src={AntesoQRCode} alt="QR" className="h-24" />
            <div className="text-center">
              <img src={Signature} alt="Signature" className="h-20 mx-auto mb-2" />
              <p className="font-bold">Authorized Signatory</p>
            </div>
          </div>

          <footer className="text-center text-xs text-gray-600 mt-6">
            <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
            <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
            <p>Email: info@antesobiomedicalengg.com</p>
          </footer>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>

            <MainTestTableForBMD testData={testData} />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
          @page { margin: 1cm; size: A4; }
          table, tr, td, th { 
            page-break-inside: avoid; 
            break-inside: avoid;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          thead { display: table-header-group; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportBMD;
