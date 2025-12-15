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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Loading Report...</div>;
  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please generate and save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg">
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
          .test-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          th, td {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
        }
      `}</style>
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
            QA TEST REPORT FOR FIXED RADIOGRAPHY & FLUOROSCOPY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6">
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer & Reference */}
          <section className="mb-4">
            <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
            <div className="border-2 border-gray-600 p-5 text-lg">
              <p><strong>Customer:</strong> {report.customerName}</p>
              <p><strong>Address:</strong> {report.address}</p>
            </div>
          </section>

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
            <h2 className="font-bold text-lg mb-3">3. Details of Equipment Under Test</h2>
            <table className="w-full border-2 border-gray-600 text-sm">
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
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="border p-3 font-medium w-1/2">{label}</td>
                    <td className="border p-3">{value}</td>
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

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForFixedRadioFluro testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential?.table2?.length > 0 && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">1. Accuracy of Operating Potential (kVp)</h3>

                {/* Test Conditions */}
                {testData.accuracyOfOperatingPotential.table1?.length > 0 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Test Conditions:</p>
                    <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Set kVp</th>
                        <th className="border border-black p-3 print:p-2">Measured kVp</th>
                        <th className="border border-black p-3 print:p-2">% Deviation</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">{row.setKvp || row.setKVp || "-"}</td>
                          <td className="border border-black p-3 print:p-2">{row.measuredKvp || row.measuredKVp || "-"}</td>
                          <td className="border border-black p-3 print:p-2">{row.deviation != null ? row.deviation.toFixed(2) + "%" : "-"}</td>
                          <td className="border border-black p-3 print:p-2">±10%</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
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
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">3. Low Contrast Resolution</h3>
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
                        <td className="border border-black p-3 print:p-2 font-semibold">Smallest Visible Hole Size</td>
                        <td className="border border-black p-3 print:p-2">{testData.lowContrastResolution.smallestHoleSize} mm</td>
                        <td className="border border-black p-3 print:p-2">≤ {testData.lowContrastResolution.recommendedStandard} mm</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={Number(testData.lowContrastResolution.smallestHoleSize) <= Number(testData.lowContrastResolution.recommendedStandard) ? "text-green-600" : "text-red-600"}>
                            {Number(testData.lowContrastResolution.smallestHoleSize) <= Number(testData.lowContrastResolution.recommendedStandard) ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">4. High Contrast Resolution</h3>
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
                        <td className="border border-black p-3 print:p-2 font-semibold">Line Pairs per mm</td>
                        <td className="border border-black p-3 print:p-2">{testData.highContrastResolution.measuredLpPerMm} lp/mm</td>
                        <td className="border border-black p-3 print:p-2">≥ {testData.highContrastResolution.recommendedStandard} lp/mm</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={Number(testData.highContrastResolution.measuredLpPerMm) >= Number(testData.highContrastResolution.recommendedStandard) ? "text-green-600" : "text-red-600"}>
                            {Number(testData.highContrastResolution.measuredLpPerMm) >= Number(testData.highContrastResolution.recommendedStandard) ? "PASS" : "FAIL"}
                          </span>
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

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .print\\:break-before-page { page-break-before: always; }
          @page { margin: 1cm; size: A4; }
          table, tr, td, th { page-break-inside: avoid; }
          h1,h2,h3,h4,h5,h6 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportFixedRadioFluro;