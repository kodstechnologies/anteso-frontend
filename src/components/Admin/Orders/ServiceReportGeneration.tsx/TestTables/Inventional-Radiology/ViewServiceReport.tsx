// src/components/reports/ViewServiceReportInventionalRadiology.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForInventionalRadiology } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForInventionalRadiology from "./MainTestTableForInventionalRadiology";

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
  category: string;
  toolsUsed?: Tool[];
  notes?: Note[];

  // Test documents
  AccuracyOfIrradiationTimeInventionalRadiology?: any;
  TotalFilterationForInventionalRadiology?: any;
  ExposureRateTableTopInventionalRadiology?: any;
  HighContrastResolutionInventionalRadiology?: any;
  LowContrastResolutionInventionalRadiology?: any;
  TubeHousingLeakageInventionalRadiology?: any;
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

const ViewServiceReport: React.FC = () => {
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
        const response = await getReportHeaderForInventionalRadiology(serviceId);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Interventional Radiology",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            category: data.category || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          // Extract test data from populated response
          setTestData({
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeInventionalRadiology || null,
            totalFilteration: data.TotalFilterationForInventionalRadiology || null,
            exposureRateTableTop: data.ExposureRateTableTopInventionalRadiology || null,
            highContrastResolution: data.HighContrastResolutionInventionalRadiology || null,
            lowContrastResolution: data.LowContrastResolutionInventionalRadiology || null,
            tubeHousingLeakage: data.TubeHousingLeakageInventionalRadiology || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Interventional Radiology report:", err);
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
        filename: `InterventionalRadiology-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Interventional Radiology Report...</div>;

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
              QA TEST REPORT FOR INTERVENTIONAL RADIOLOGY X-RAY EQUIPMENT
            </h1>
          <p className="text-center italic text-sm mb-6">
              (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
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
            <MainTestTableForInventionalRadiology testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">1. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Test Conditions:</h4>
                    <p className="text-sm">FCD: {testData.accuracyOfIrradiationTime.testConditions.fcd || "-"} cm, kV: {testData.accuracyOfIrradiationTime.testConditions.kv || "-"}, mA: {testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</p>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Set Time (mSec)</th>
                          <th className="border border-black p-3">Measured Time (mSec)</th>
                          <th className="border border-black p-3">% Error</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                          const setTime = parseFloat(row.setTime);
                          const measuredTime = parseFloat(row.measuredTime);
                          let error = "-";
                          if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                            error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
                          }
                          const toleranceOp = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                          const toleranceVal = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "5");
                          const errorVal = parseFloat(error);
                          let isPass = false;
                          if (!isNaN(errorVal) && !isNaN(toleranceVal)) {
                            if (toleranceOp === "<=") isPass = errorVal <= toleranceVal;
                            else if (toleranceOp === ">=") isPass = errorVal >= toleranceVal;
                            else if (toleranceOp === "<") isPass = errorVal < toleranceVal;
                            else if (toleranceOp === ">") isPass = errorVal > toleranceVal;
                          }
                          return (
                            <tr key={i} className="text-center">
                              <td className="border p-3">{row.setTime || "-"}</td>
                              <td className="border p-3">{row.measuredTime || "-"}</td>
                              <td className="border p-3">{error}%</td>
                              <td className="border p-3">
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
                )}
              </div>
            )}

            {/* 2. Total Filtration */}
            {testData.totalFilteration && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">2. Total Filtration</h3>
                {testData.totalFilteration.totalFiltration && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Total Filtration:</strong> Measured: {testData.totalFilteration.totalFiltration.measured || "-"} mm Al | 
                      Required: {testData.totalFilteration.totalFiltration.required || "-"} mm Al
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Exposure Rate at Table Top */}
            {testData.exposureRateTableTop && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">3. Exposure Rate at Table Top</h3>
                {testData.exposureRateTableTop.rows?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Distance (cm)</th>
                          <th className="border border-black p-3">Applied kV</th>
                          <th className="border border-black p-3">Applied mA</th>
                          <th className="border border-black p-3">Exposure (mGy/min)</th>
                          <th className="border border-black p-3">Mode</th>
                          <th className="border border-black p-3">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.exposureRateTableTop.rows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.distance || "-"}</td>
                            <td className="border p-3">{row.appliedKv || "-"}</td>
                            <td className="border p-3">{row.appliedMa || "-"}</td>
                            <td className="border p-3">{row.exposure || "-"}</td>
                            <td className="border p-3">{row.remark || "-"}</td>
                            <td className="border p-3">
                              <span className={row.result === "PASS" ? "text-green-600" : row.result === "FAIL" ? "text-red-600" : ""}>
                                {row.result || "-"}
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

            {/* 4. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">4. Low Contrast Resolution</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm">
                    <strong>Smallest Hole Size:</strong> {testData.lowContrastResolution.smallestHoleSize || "-"} mm
                  </p>
                  <p className="text-sm">
                    <strong>Recommended Standard:</strong> {testData.lowContrastResolution.recommendedStandard || "3.0"} mm
                  </p>
                  <p className="text-sm">
                    <strong>Remarks:</strong> <span className={testData.lowContrastResolution.remark === "PASS" ? "text-green-600" : testData.lowContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                      {testData.lowContrastResolution.remark || "-"}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* 5. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">5. High Contrast Resolution</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm">
                    <strong>Measured:</strong> {testData.highContrastResolution.measuredLpPerMm || "-"} lp/mm
                  </p>
                  <p className="text-sm">
                    <strong>Recommended Standard:</strong> {testData.highContrastResolution.recommendedStandard || "1.50"} lp/mm
                  </p>
                  <p className="text-sm">
                    <strong>Remarks:</strong> <span className={testData.highContrastResolution.remark === "PASS" ? "text-green-600" : testData.highContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                      {testData.highContrastResolution.remark || "-"}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* 6. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">6. Tube Housing Leakage</h3>
                {testData.tubeHousingLeakage.leakageMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Location</th>
                          <th className="border border-black p-3">Front</th>
                          <th className="border border-black p-3">Back</th>
                          <th className="border border-black p-3">Left</th>
                          <th className="border border-black p-3">Right</th>
                          <th className="border border-black p-3">Top</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.tubeHousingLeakage.leakageMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.location || "-"}</td>
                            <td className="border p-3">{row.front || "-"}</td>
                            <td className="border p-3">{row.back || "-"}</td>
                            <td className="border p-3">{row.left || "-"}</td>
                            <td className="border p-3">{row.right || "-"}</td>
                            <td className="border p-3">{row.top || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

export default ViewServiceReport;
