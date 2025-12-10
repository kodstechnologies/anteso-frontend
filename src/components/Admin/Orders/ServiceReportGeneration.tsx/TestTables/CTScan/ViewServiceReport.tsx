// src/components/reports/ViewServiceReportCTScan.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForCTScan } from "../../../../../../api";
import MainTestTableForCTScan from "./MainTestTableForCTScan";
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

  // Test documents from populated response
  RadiationProfileWidthForCTScan?: any;
  MeasurementOfOperatingPotential?: any;
  TimerAccuracy?: any;
  MeasurementOfMaLinearity?: any;
  MeasurementOfCTDI?: any;
  TotalFilterationForCTScan?: any;
  RadiationLeakageLevel?: any;
  MeasureMaxRadiationLevel?: any;
  OutputConsistency?: any;
  lowContrastResolutionForCTScan?: any;
  HighContrastResolutionForCTScan?: any;
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

const ViewServiceReportCTScan: React.FC = () => {
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
        const response = await getReportHeaderForCTScan(serviceId);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Computed Tomography",
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
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          // Extract test data from populated response
          setTestData({
            radiationProfile: data.RadiationProfileWidthForCTScan || null,
            operatingPotential: data.MeasurementOfOperatingPotential || null,
            maLinearity: data.MeasurementOfMaLinearity || null,
            timerAccuracy: data.TimerAccuracy || null,
            ctdi: data.MeasurementOfCTDI || null,
            totalFiltration: data.TotalFilterationForCTScan || null,
            leakage: data.RadiationLeakageLevel || null,
            measureMaxRadiationLevel: data.MeasureMaxRadiationLevel || null,
            outputConsistency: data.OutputConsistency || null,
            lowContrastResolution: data.lowContrastResolutionForCTScan || null,
            highContrastResolution: data.HighContrastResolutionForCTScan || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load CT Scan report:", err);
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
        filename: `CTScan-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading CT Scan Report...</div>;

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
            QA TEST REPORT FOR COMPUTED TOMOGRAPHY (CT SCAN) EQUIPMENT
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
            <MainTestTableForCTScan testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Radiation Profile Width */}
            {testData.radiationProfile && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">1. Radiation Profile Width / Slice Thickness</h3>
                {testData.radiationProfile.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Applied (mm)</th>
                          <th className="border border-black p-3">Measured (mm)</th>
                          <th className="border border-black p-3">Tolerance</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationProfile.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.applied || "-"}</td>
                            <td className="border p-3">{row.measured || "-"}</td>
                            <td className="border p-3">{row.tolerance || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
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

            {/* 2. Measurement of Operating Potential */}
            {testData.operatingPotential && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">2. Measurement of Operating Potential (kVp Accuracy)</h3>
                {testData.operatingPotential.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Set kV</th>
                          <th className="border border-black p-3">mA 10</th>
                          <th className="border border-black p-3">mA 100</th>
                          <th className="border border-black p-3">mA 200</th>
                          <th className="border border-black p-3">Avg kVp</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.operatingPotential.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.setKV || "-"}</td>
                            <td className="border p-3">{row.ma10 || "-"}</td>
                            <td className="border p-3">{row.ma100 || "-"}</td>
                            <td className="border p-3">{row.ma200 || "-"}</td>
                            <td className="border p-3 font-semibold">{row.avgKvp || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
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

            {/* 3. Measurement of mA Linearity */}
            {testData.maLinearity && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">3. Measurement of mA Linearity</h3>
                {testData.maLinearity.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">mAs Applied</th>
                          <th className="border border-black p-3">Avg Output</th>
                          <th className="border border-black p-3">X (mGy/mAs)</th>
                          <th className="border border-black p-3">X Max</th>
                          <th className="border border-black p-3">X Min</th>
                          <th className="border border-black p-3">CoL</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.maLinearity.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.mAsApplied || "-"}</td>
                            <td className="border p-3">{row.avgOutput || row.average || "-"}</td>
                            <td className="border p-3">{row.x || "-"}</td>
                            <td className="border p-3">{row.xMax || "-"}</td>
                            <td className="border p-3">{row.xMin || "-"}</td>
                            <td className="border p-3">{row.col || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
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

            {/* 4. Timer Accuracy */}
            {testData.timerAccuracy && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">4. Timer Accuracy</h3>
                {testData.timerAccuracy.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Set Time (ms)</th>
                          <th className="border border-black p-3">Observed Time (ms)</th>
                          <th className="border border-black p-3">% Error</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.timerAccuracy.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.setTime || "-"}</td>
                            <td className="border p-3">{row.observedTime || "-"}</td>
                            <td className="border p-3">{row.percentError || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
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

            {/* 5. Measurement of CTDI */}
            {testData.ctdi && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">5. Measurement of CTDI</h3>
                {testData.ctdi.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Results</th>
                          <th className="border border-black p-3">Head (mGy/100mAs)</th>
                          <th className="border border-black p-3">Body (mGy/100mAs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.ctdi.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3 font-medium">{row.result || "-"}</td>
                            <td className="border p-3">{row.head || "-"}</td>
                            <td className="border p-3">{row.body || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 6. Total Filtration */}
            {testData.totalFiltration && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">6. Total Filtration</h3>
                {testData.totalFiltration.rows?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Applied kV</th>
                          <th className="border border-black p-3">Applied mA</th>
                          <th className="border border-black p-3">Time (s)</th>
                          <th className="border border-black p-3">Slice Thickness (mm)</th>
                          <th className="border border-black p-3">Measured TF (mm Al)</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.totalFiltration.rows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.appliedKV || "-"}</td>
                            <td className="border p-3">{row.appliedMA || "-"}</td>
                            <td className="border p-3">{row.time || "-"}</td>
                            <td className="border p-3">{row.sliceThickness || "-"}</td>
                            <td className="border p-3 font-semibold">{row.measuredTF || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
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

            {/* 7. Radiation Leakage Level */}
            {testData.leakage && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">7. Radiation Leakage Level from X-Ray Tube House</h3>
                {testData.leakage.leakageMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Location</th>
                          <th className="border border-black p-3">Front</th>
                          <th className="border border-black p-3">Back</th>
                          <th className="border border-black p-3">Left</th>
                          <th className="border border-black p-3">Right</th>
                          <th className="border border-black p-3">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.leakage.leakageMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.location || "-"}</td>
                            <td className="border p-3">{row.front || "-"}</td>
                            <td className="border p-3">{row.back || "-"}</td>
                            <td className="border p-3">{row.left || "-"}</td>
                            <td className="border p-3">{row.right || "-"}</td>
                            <td className="border p-3 font-semibold">{row.max || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 8. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">8. Output Consistency</h3>
                {testData.outputConsistency.outputRows?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">kVp</th>
                          <th className="border border-black p-3">Mean (X̄)</th>
                          <th className="border border-black p-3">COV</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.kvp || "-"}</td>
                            <td className="border p-3 font-semibold">{row.mean || "-"}</td>
                            <td className="border p-3">{row.cov || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
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

            {/* 9. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">9. Low Contrast Resolution</h3>
                <div className="bg-gray-50 p-4 rounded border mb-4">
                  <p className="text-sm mb-2">
                    <strong>Observed Size:</strong> {testData.lowContrastResolution.result?.observedSize || testData.lowContrastResolution.observedSize || "-"} mm
                  </p>
                  <p className="text-sm mb-2">
                    <strong>Contrast Level:</strong> {testData.lowContrastResolution.result?.contrastLevel || testData.lowContrastResolution.contrastLevel || "-"}%
                  </p>
                  {testData.lowContrastResolution.acquisitionParams && (
                    <>
                      <p className="text-sm mb-2">
                        <strong>kVp:</strong> {testData.lowContrastResolution.acquisitionParams.kvp || "-"}
                      </p>
                      <p className="text-sm mb-2">
                        <strong>mA:</strong> {testData.lowContrastResolution.acquisitionParams.ma || "-"}
                      </p>
                      <p className="text-sm mb-2">
                        <strong>Slice Thickness:</strong> {testData.lowContrastResolution.acquisitionParams.sliceThickness || "-"} mm
                      </p>
                      <p className="text-sm">
                        <strong>Window Width:</strong> {testData.lowContrastResolution.acquisitionParams.ww || "-"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 10. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">10. High Contrast Resolution</h3>
                {testData.highContrastResolution.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Size (mm)</th>
                          <th className="border border-black p-3">Value</th>
                          <th className="border border-black p-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.highContrastResolution.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.size || "-"}</td>
                            <td className="border p-3">{row.value || "-"}</td>
                            <td className="border p-3">{row.unit || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 11. Measure Max Radiation Level */}
            {testData.measureMaxRadiationLevel && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">11. Measure Maximum Radiation Level</h3>
                {testData.measureMaxRadiationLevel.readings?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Location</th>
                          <th className="border border-black p-3">Radiation Level (mR/hr)</th>
                          <th className="border border-black p-3">Radiation Level (mR/week)</th>
                          <th className="border border-black p-3">Result</th>
                          <th className="border border-black p-3">Permissible Limit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.measureMaxRadiationLevel.readings.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.location || "-"}</td>
                            <td className="border p-3">{row.mRPerHr || "-"}</td>
                            <td className="border p-3">{row.mRPerWeek || "-"}</td>
                            <td className="border p-3">
                              <span className={row.result === "Pass" ? "text-green-600 font-bold" : row.result === "Fail" ? "text-red-600 font-bold" : ""}>
                                {row.result || "-"}
                              </span>
                            </td>
                            <td className="border p-3">{row.permissibleLimit || "-"}</td>
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
          @page { margin: 1cm; size: A4; }
          table, tr, td, th { page-break-inside: avoid; }
          h1,h2,h3,h4,h5,h6 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportCTScan;
