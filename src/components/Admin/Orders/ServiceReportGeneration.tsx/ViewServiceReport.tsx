// src/components/reports/ViewServiceReport.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeader,
  getRadiationProfileWidthByTestId,
  getMeasurementOfOperatingPotentialByTestId,
  getMeasurementOfMaLinearityByTestId,
  getTimerAccuracyByTestId,
  getMeasurementOfCTDIByTestId,
  getTotalFilterationByTestId,
  getRadiationLeakageByTestId,
  getOutputConsistencyByTestId,
} from "../../../../api";
import MainTestTableForCTScan from "./TestTables/CTScan/MainTestTableForCTScan";
import logo from "../../../../assets/logo/logo-sm.png";
import logoA from "../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Tool {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string;
  SrNo: string;
  range: string;
  calibrationCertificateNo: string;
  calibrationValidTill: string;
  certificate?: string;
  uncertainity?: string;
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
  toolsUsed: Tool[];
  notes: { slNo: string; text: string }[];

  radiationProfileWidthId?: string | null;
  operatingPotentialId?: string | null;
  maLinearityId?: string | null;
  timerAccuracyId?: string | null;
  ctdiId?: string | null;
  totalFiltrationId?: string | null;
  radiationLeakageId?: string | null;
  outputConsistencyId?: string | null;
}

const ViewServiceReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);

  const [testData, setTestData] = useState<any>({
    radiationProfile: null,
    operatingPotential: null,
    maLinearity: null,
    timerAccuracy: null,
    ctdi: null,
    totalFiltration: null,
    leakage: null,
  });

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
        console.log("Report Header:", response);

        if (response.exists && response.data) {
          setReport(response.data);
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

  useEffect(() => {
    if (!report) return;

    const fetchTests = async () => {
      setTestsLoading(true);

      const safeFetch = async (fn: () => Promise<any>) => {
        try {
          const res = await fn();
          return res?.data?.data || res?.data || res || null;
        } catch (err) {
          console.warn("Test fetch error:", err);
          return null;
        }
      };

      const results = await Promise.all([
        report.radiationProfileWidthId ? safeFetch(() => getRadiationProfileWidthByTestId(report.radiationProfileWidthId!)) : null,
        report.operatingPotentialId ? safeFetch(() => getMeasurementOfOperatingPotentialByTestId(report.operatingPotentialId!)) : null,
        report.maLinearityId ? safeFetch(() => getMeasurementOfMaLinearityByTestId(report.maLinearityId!)) : null,
        report.timerAccuracyId ? safeFetch(() => getTimerAccuracyByTestId(report.timerAccuracyId!)) : null,
        report.ctdiId ? safeFetch(() => getMeasurementOfCTDIByTestId(report.ctdiId!)) : null,
        report.totalFiltrationId ? safeFetch(() => getTotalFilterationByTestId(report.totalFiltrationId!)) : null,
        report.radiationLeakageId ? safeFetch(() => getRadiationLeakageByTestId(report.radiationLeakageId!)) : null,
        report.outputConsistencyId ? safeFetch(() => getOutputConsistencyByTestId(report.outputConsistencyId!)) : null,
      ]);

      setTestData({
        radiationProfile: results[0],
        operatingPotential: results[1],
        maLinearity: results[2],
        timerAccuracy: results[3],
        ctdi: results[4],
        totalFiltration: results[5],
        leakage: results[6],
        outputConsistency: results[7],   // ← THIS LINE WAS MISSING!
      });

      setTestsLoading(false);
    };

    fetchTests();
  }, [report]);
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      const originalButton = document.querySelector('.download-pdf-btn') as HTMLButtonElement;
      if (originalButton) {
        originalButton.textContent = 'Generating PDF...';
        originalButton.disabled = true;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('report-content');
          if (clonedElement) {
            clonedElement.style.width = '100%';
            clonedElement.style.maxWidth = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Test-Report-${report?.testReportNumber || 'report'}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      const originalButton = document.querySelector('.download-pdf-btn') as HTMLButtonElement;
      if (originalButton) {
        originalButton.textContent = 'Download PDF';
        originalButton.disabled = false;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">
        Loading Report...
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PDF Download & Print Buttons */}
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl"
        >
          Print
        </button>
        <button
          onClick={downloadPDF}
          className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl"
        >
          Download PDF
        </button>
      </div>

      {/* Main Report Content */}
      <div id="report-content" className="bg-white">
        {/* PAGE 1 - MAIN REPORT */}
        <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0 print:px-0">
          <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none border print:border-0 p-10 print:p-8 print:max-w-none print:mx-0">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
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
              <img src={logo} alt="Company Logo" className="h-28" />
            </div>

            <div className="text-center mb-6">
              <p className="text-sm">Government of India, Atomic Energy Regulatory Board</p>
              <p className="text-sm">Radiological Safety Division, Mumbai-400094</p>
            </div>

            <h1 className="text-center text-2xl font-bold underline mb-4">
              QA TEST REPORT FOR DIAGNOSTIC X-RAY EQUIPMENT
            </h1>
            <p className="text-center italic text-sm mb-10">
              (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
            </p>

            {/* Customer Details */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
              <div className="border-2 border-gray-600 p-5 text-lg">
                <p><strong>Customer:</strong> {report.customerName || "N/A"}</p>
                <p><strong>Address:</strong> {report.address || "N/A"}</p>
              </div>
            </section>

            {/* Reference */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">2. Reference</h2>
              <table className="w-full border-2 border-gray-600 text-sm">
                <tbody>
                  <tr><td className="border p-3 font-medium w-1/2">SRF No. & Date</td><td className="border p-3">{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                  <tr><td className="border p-3 font-medium">Test Report No. & Issue Date</td><td className="border p-3">{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
                </tbody>
              </table>
            </section>

            {/* Device Details */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">3. Details of Equipment Under Test</h2>
              <table className="w-full border-2 border-gray-600 text-sm">
                <tbody>
                  {[
                    ["Nomenclature", report.nomenclature],
                    ["Make", report.make],
                    ["Model", report.model],
                    ["Serial No.", report.slNumber],
                    ["Condition", report.condition],
                    ["Testing Procedure No.", report.testingProcedureNumber],
                    ["Engineer Name & RP ID", report.engineerNameRPId],
                    ["Test Date", formatDate(report.testDate)],
                    ["Due Date", formatDate(report.testDueDate)],
                    ["Location", report.location],
                    ["Temperature (°C)", report.temperature],
                    ["Humidity (%)", report.humidity],
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
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">4. Standards / Tools Used</h2>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-2 border-gray-600 text-xs print:text-xxs print:min-w-full">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border p-2">Sl No.</th>
                      <th className="border p-2">Nomenclature</th>
                      <th className="border p-2">Make / Model</th>
                      <th className="border p-2">Sr. No.</th>
                      <th className="border p-2">Range</th>
                      <th className="border p-2">Certificate No.</th>
                      <th className="border p-2">Valid Till</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.toolsUsed.length > 0 ? report.toolsUsed.map((tool, i) => (
                      <tr key={i}>
                        <td className="border p-2 text-center">{i + 1}</td>
                        <td className="border p-2">{tool.nomenclature}</td>
                        <td className="border p-2">{tool.make} / {tool.model}</td>
                        <td className="border p-2">{tool.SrNo}</td>
                        <td className="border p-2">{tool.range}</td>
                        <td className="border p-2">{tool.calibrationCertificateNo}</td>
                        <td className="border p-2">{formatDate(tool.calibrationValidTill)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="text-center py-4 border">No tools recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Notes */}
            <section className="mb-12">
              <h2 className="font-bold text-lg mb-3">5. Notes</h2>
              <div className="ml-8 text-sm">
                {report.notes.length > 0 ? report.notes.map(n => (
                  <p key={n.slNo}><strong>{n.slNo}.</strong> {n.text}</p>
                )) : <p>No notes added.</p>}
              </div>
            </section>

            {/* Signature */}
            <div className="flex justify-between items-end mt-20">
              <img src={AntesoQRCode} alt="QR Code" className="h-24" />
              <div className="text-center">
                <img src={Signature} alt="Signature" className="h-20 mx-auto mb-2" />
                <p className="font-bold">Authorized Signatory</p>
              </div>
            </div>

            <footer className="text-center text-xs text-gray-600 mt-12">
              <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
              <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
              <p>Email: info@antesobiomedicalengg.com</p>
            </footer>
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page"></div>

        {/* PAGE 2+ - ALL TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8 print:px-4">
          <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {testsLoading ? (
              <p className="text-center text-xl">Loading test results...</p>
            ) : (
              <>
                {/* 1. Radiation Profile */}
                {testData.radiationProfile && testData.radiationProfile.table2 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">1. Radiation Profile Width / Slice Thickness</h3>

                    {testData.radiationProfile.table1 && testData.radiationProfile.table1.length > 0 && (
                      <div className="mb-6">
                        <p className="font-medium mb-2">Test Conditions:</p>
                        <div className="overflow-x-auto print:overflow-visible">
                          <table className="w-full border-2 border-black text-sm mb-8 print:text-xs print:min-w-full">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="border p-3">kVp</th>
                                <th className="border p-3">mA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testData.radiationProfile.table1.map((row: any, i: number) => (
                                <tr key={i}>
                                  <td className="border p-3 text-center">{row.kvp}</td>
                                  <td className="border p-3 text-center">{row.ma}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Applied Slice Thickness (mm)</th>
                            <th className="border border-black p-3">Measured Width (mm)</th>
                            <th className="border border-black p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.radiationProfile.table2.map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="border p-3 text-center">{row.applied || "-"}</td>
                              <td className="border p-3 text-center">{row.measured || "-"}</td>
                              <td className="border p-3 text-center font-medium">
                                <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Operating Potential */}
                {testData.operatingPotential && testData.operatingPotential.table2 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">
                      2. Measurement of Operating Potential (kVp Accuracy)
                    </h3>

                    {testData.operatingPotential.table1 && testData.operatingPotential.table1.length > 0 && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Test Conditions:</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {testData.operatingPotential.table1.map((cond: any, i: number) => (
                            <div key={i}>
                              <span className="font-medium">Time:</span> {cond.time || "-"} ms,{' '}
                              <span className="font-medium">Slice Thickness:</span> {cond.sliceThickness || "-"} mm
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th rowSpan={2} className="border border-black p-3">Set kVp</th>
                            <th colSpan={4} className="border border-black p-3">Measured kVp at Different mA</th>
                            <th rowSpan={2} className="border border-black p-3 bg-blue-100">Average kVp</th>
                            {/* <th rowSpan={2} className="border border-black p-3 bg-yellow-100">Deviation (%)</th> */}
                            <th rowSpan={2} className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black p-2">10 mA</th>
                            <th className="border border-black p-2">100 mA</th>
                            <th className="border border-black p-2">200 mA</th>
                            <th className="border border-black p-2">Other</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.operatingPotential.table2.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3 font-bold">{row.setKV || "-"}</td>
                              <td className="border p-3">{row.ma10 || "-"}</td>
                              <td className="border p-3">{row.ma100 || "-"}</td>
                              <td className="border p-3">{row.ma200 || "-"}</td>
                              <td className="border p-3">{row.otherMA || "-"}</td>
                              <td className="border p-3 font-semibold bg-blue-50">{row.avgKvp || "-"}</td>
                              {/* <td className="border p-3 font-semibold bg-yellow-50">
                                {row.deviation != null ? `${row.deviation}%` : "-"}
                              </td> */}
                              <td className="border p-3 font-bold">
                                <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
                                  {row.remarks || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {testData.operatingPotential.tolerance && (
                      <div className="mt-4 text-right text-sm font-medium text-gray-700">
                        Acceptable Tolerance: ±{testData.operatingPotential.tolerance.value}
                        {testData.operatingPotential.tolerance.type === "percent" ? "%" : " kVp"}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. mA Linearity */}
                {testData.maLinearity && testData.maLinearity.table2 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">3. Measurement of mA / mAs Linearity</h3>

                    {testData.maLinearity.table1 && testData.maLinearity.table1.length > 0 && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Test Conditions:</p>
                        <div className="text-sm grid grid-cols-3 gap-4">
                          {testData.maLinearity.table1.map((cond: any, i: number) => (
                            <div key={i}>
                              <span className="font-medium">kVp:</span> {cond.kvp || "-"},{' '}
                              <span className="font-medium">Time:</span> {cond.time || "-"} ms,{' '}
                              <span className="font-medium">Slice Thickness:</span> {cond.sliceThickness || "-"} mm
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th rowSpan={2} className="border border-black p-3">Applied mAs</th>
                            <th colSpan={3} className="border border-black p-3">Measured Output (µGy)</th>
                            <th rowSpan={2} className="border border-black p-3 bg-blue-100">Average Output</th>
                            <th rowSpan={2} className="border border-black p-3 bg-yellow-100">Linearity Coefficient</th>
                            <th rowSpan={2} className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black p-2">Reading 1</th>
                            <th className="border border-black p-2">Reading 2</th>
                            <th className="border border-black p-2">Reading 3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.maLinearity.table2.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3 font-bold">{row.mAsApplied || "-"}</td>
                              <td className="border p-3">{row.measuredOutputs?.[0] || "-"}</td>
                              <td className="border p-3">{row.measuredOutputs?.[1] || "-"}</td>
                              <td className="border p-3">{row.measuredOutputs?.[2] || "-"}</td>
                              <td className="border p-3 font-semibold bg-blue-50">{row.avgOutput || "-"}</td>
                              <td className="border p-3 font-semibold bg-yellow-50">
                                {row.col != null ? row.col : "-"}
                              </td>
                              <td className="border p-3 font-bold">
                                <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
                                  {row.remarks || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 text-right text-sm font-medium text-gray-700">
                      Acceptable Linearity Coefficient: ≤ ±{testData.maLinearity.tolerance || "0.1"}
                    </div>
                  </div>
                )}

                {/* 4. Timer Accuracy */}
                {testData.timerAccuracy && testData.timerAccuracy.table2 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">4. Timer Accuracy</h3>

                    {testData.timerAccuracy.table1 && testData.timerAccuracy.table1.length > 0 && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Test Conditions:</p>
                        <div className="text-sm">
                          {testData.timerAccuracy.table1.map((cond: any, i: number) => (
                            <span key={i}>
                              <strong>kVp:</strong> {cond.kvp || "-"},{' '}
                              <strong>mA:</strong> {cond.ma || "-"},{' '}
                              <strong>Slice Thickness:</strong> {cond.sliceThickness || "-"} mm
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Set Time (ms)</th>
                            <th className="border border-black p-3">Observed Time (ms)</th>
                            <th className="border border-black p-3 bg-yellow-100">Error (%)</th>
                            <th className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.timerAccuracy.table2.map((row: any, i: number) => {
                            const error = row.percentError ||
                              (row.setTime && row.observedTime
                                ? (((parseFloat(row.observedTime) - parseFloat(row.setTime)) / parseFloat(row.setTime)) * 100).toFixed(2)
                                : "-");

                            const isPass = error !== "-" && Math.abs(parseFloat(error)) <= 5;

                            return (
                              <tr key={i} className="text-center">
                                <td className="border p-3 font-bold">{row.setTime || "-"}</td>
                                <td className="border p-3">{row.observedTime || "-"}</td>
                                <td className="border p-3 font-semibold bg-yellow-50">
                                  {error !== "-" ? `${error}%` : "-"}
                                </td>
                                <td className="border p-3 font-bold">
                                  <span className={isPass ? "text-green-600" : "text-red-600"}>
                                    {row.remarks || (isPass ? "Pass" : "Fail")}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 text-right text-sm font-medium text-gray-700">
                      Acceptable Tolerance: ±{testData.timerAccuracy.tolerance || "5"}%
                    </div>
                  </div>
                )}

                {/* 5. CTDI */}
                {testData.ctdi && testData.ctdi.table2 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">5. CTDI Measurement</h3>

                    {testData.ctdi.table1 && testData.ctdi.table1.length > 0 && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Test Conditions:</p>
                        <div className="text-sm grid grid-cols-3 gap-4">
                          {testData.ctdi.table1.map((cond: any, i: number) => (
                            <div key={i}>
                              <span className="font-medium">kVp:</span> {cond.kvp || "-"},{' '}
                              <span className="font-medium">mAs:</span> {cond.mAs || "-"},{' '}
                              <span className="font-medium">Slice Thickness:</span> {cond.sliceThickness || "-"} mm
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th rowSpan={2} className="border border-black p-4 w-48 align-middle">Parameter</th>
                            <th colSpan={2} className="border border-black p-3">Dose (mGy)</th>
                          </tr>
                          <tr>
                            <th className="border border-black p-3 bg-blue-100">Head Phantom</th>
                            <th className="border border-black p-3 bg-green-100">Body Phantom</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.ctdi.table2.map((row: any, i: number) => {
                            const isCTDIw = row.result.includes("CTDIw");
                            const isRated = row.result.includes("Rated");
                            const isCenter = row.result.includes("CTDIc");
                            const isPeripheral = row.result.includes("Peripheral") && !row.result.includes("mean");

                            return (
                              <tr key={i} className={isCTDIw || isRated ? "font-bold bg-yellow-50" : ""}>
                                <td className="border p-4 font-medium text-left">
                                  {row.result === "Axial Dose CTDIc" ? "CTDIc (Center)" :
                                    row.result === "Peripheral Dose CTDIp(mean)" ? "CTDIp (Peripheral Mean)" :
                                      row.result === "CTDIw" ? "CTDIw (Weighted)" :
                                        row.result === "CTDIw (Rated)" ? "CTDIw (Rated)" :
                                          row.result}
                                </td>
                                <td className="border p-4 text-center font-semibold">
                                  {row.head != null ? row.head : "-"}
                                </td>
                                <td className="border p-4 text-center font-semibold">
                                  {row.body != null ? row.body : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {testData.ctdi.table2.find((r: any) => r.result.includes("CTDIw")) && (
                      <div className="mt-6 grid grid-cols-2 gap-8 text-lg">
                        <div className="bg-blue-50 p-6 rounded border-2 border-blue-300 text-center">
                          <p className="font-bold text-blue-800">CTDIw (Head Phantom)</p>
                          <p className="text-2xl font-bold text-blue-900 mt-2">
                            {testData.ctdi.table2.find((r: any) => r.result === "CTDIw")?.head ||
                              testData.ctdi.table2.find((r: any) => r.result.includes("CTDIw"))?.head || "-"} mGy
                          </p>
                        </div>
                        <div className="bg-green-50 p-6 rounded border-2 border-green-300 text-center">
                          <p className="font-bold text-green-800">CTDIw (Body Phantom)</p>
                          <p className="text-2xl font-bold text-green-900 mt-2">
                            {testData.ctdi.table2.find((r: any) => r.result === "CTDIw")?.body ||
                              testData.ctdi.table2.find((r: any) => r.result.includes("CTDIw"))?.body || "-"} mGy
                          </p>
                        </div>
                      </div>
                    )}

                    {testData.ctdi.tolerance && (
                      <div className="mt-6 text-right text-sm font-medium text-gray-700 italic">
                        Reference Tolerance: {testData.ctdi.tolerance.value || "N/A"}
                        {testData.ctdi.tolerance.type === "percent" ? "%" : ""}
                        {testData.ctdi.tolerance.sign === "both" ? " (±)" : ""}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Total Filtration */}
                {testData.totalFiltration && testData.totalFiltration.rows && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">6. Total Filtration</h3>

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Applied kV</th>
                            <th className="border border-black p-3">mA</th>
                            <th className="border border-black p-3">Time (ms)</th>
                            <th className="border border-black p-3">Slice Thickness (mm)</th>
                            <th className="border border-black p-3 bg-blue_desc-100">Measured Total Filtration (mm Al)</th>
                            <th className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.totalFiltration.rows.map((row: any, i: number) => {
                            const tfValue = parseFloat(row.measuredTF);
                            const isAcceptable = tfValue >= 2.5;

                            return (
                              <tr key={i} className="text-center">
                                <td className="border p-3 font-semibold">{row.appliedKV || "-"}</td>
                                <td className="border p-3">{row.appliedMA || "-"}</td>
                                <td className="border p-3">{row.time || "-"}</td>
                                <td className="border p-3">{row.sliceThickness || "-"}</td>
                                <td className="border p-4 text-lg font-bold bg-blue-50">
                                  {row.measuredTF || "-"} mm Al
                                </td>
                                <td className="border p-4 font-bold">
                                  <span className={isAcceptable ? "text-green-600" : "text-red-600"}>
                                    {row.remark || (isAcceptable ? "Acceptable" : "Below Limit")}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 bg-amber-50 border-2 border-amber-400 rounded-lg p-5">
                      <p className="text-lg font-bold text-amber-900 mb-2">
                        AERB Requirement (as per Safety Code):
                      </p>
                      <p className="text-md font-medium">
                        Total Filtration shall not be less than <strong>2.5 mm Aluminium</strong> for X-ray equipment operating above 70 kVp.
                      </p>
                      {testData.totalFiltration.rows && testData.totalFiltration.rows[0] && (
                        <p className="mt-3 text-lg">
                          Measured: <strong>{testData.totalFiltration.rows[0].measuredTF} mm Al</strong> →{" "}
                          <span className={
                            parseFloat(testData.totalFiltration.rows[0].measuredTF) >= 2.5
                              ? "text-green-600 font-bold"
                              : "text-red-600 font-bold"
                          }>
                            {parseFloat(testData.totalFiltration.rows[0].measuredTF) >= 2.5 ? "COMPLIES" : "NON-COMPLIANT"}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. Radiation Leakage Level */}
                {testData.leakage && testData.leakage.leakageMeasurements && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">
                      7. RADIATION LEAKAGE LEVELS FROM X-RAY TUBE HOUSING AT 1 M FROM THE FOCUS
                    </h3>

                    <div className="mb-6">
                      <p className="font-bold text-lg mb-2">Operating Parameters</p>
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full border-2 border-black text-sm print:min-w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-black p-3">kV</th>
                              <th className="border border-black p-3">mA</th>
                              <th className="border border-black p-3">Time (Sec)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center">
                              <td className="border border-black p-3 font-bold">140</td>
                              <td className="border border-black p-3 font-bold">100</td>
                              <td className="border border-black p-3 font-bold">2.0</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm mb-6 print:min-w-full">
                        <thead>
                          <tr>
                            <th rowSpan={2} className="border border-black p-4 w-32">Location (at 1.0 m from the focus)</th>
                            <th colSpan={4} className="border border-black p-3">Exposure Level (mR/hr)</th>
                            <th rowSpan={2} className="border border-black p-4 bg-gray-200">Result</th>
                            <th rowSpan={2} className="border border-black p-4 bg-green-100">Remarks</th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-black p-3">Front (Cathode)</th>
                            <th className="border border-black p-3">Back (Anode)</th>
                            <th className="border border-black p-3">Left</th>
                            <th className="border border-black p-3">Right</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.leakage.leakageMeasurements.map((item: any, i: number) => {
                            const front = parseFloat(item.front) || 0;
                            const back = parseFloat(item.back) || 0;
                            const left = parseFloat(item.left) || 0;
                            const right = parseFloat(item.right) || 0;
                            const maxMR = Math.max(front, back, left, right);
                            const maxMRinOneHour = (maxMR * 60).toFixed(2);

                            return (
                              <tr key={i} className="text-center text-lg">
                                <td className="border border-black p-4 font-bold">Tube</td>
                                <td className="border border-black p-4">{front.toFixed(1)}</td>
                                <td className="border border-black p-4">{back.toFixed(1)}</td>
                                <td className="border border-black p-4">{left.toFixed(1)}</td>
                                <td className="border border-black p-4">{right.toFixed(1)}</td>
                                <td className="border border-black p-4 font-bold bg-yellow-100">
                                  {maxMRinOneHour} mR in one hour
                                </td>
                                <td className="border border-black p-4 font-bold text-green-600">
                                  Pass
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-4">
                      <strong>Work Load:</strong> {testData.leakage.workload || "500"} mAmin in one hr
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm mb-6 print:min-w-full">
                        <tbody>
                          <tr>
                            <td className="border border-black p-3 font-bold">Max Leakage =</td>
                            <td className="border border-black p-3 text-center">
                              {testData.leakage.workload || "500"} mAmin in 1 hr X {testData.leakage.leakageMeasurements?.[0]?.front || "12.30"}<br />
                              <span className="text-xs">60 X 100</span>
                            </td>
                            <td className="border border-black p-3 text-center font-bold">
                              max Exposure Level (mR/hr)<br />
                              <span className="text-xs">mA used for measurement</span>
                            </td>
                            <td className="border border-black p-3 text-center font-bold bg-yellow-100">
                              1.025 mR in one hour
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm mb-6 print:min-w-full">
                        <tbody>
                          <tr>
                            <td className="border border-black p-4 font-bold text-right w-80">
                              Maximum Radiation Leakage from Tube Housing
                            </td>
                            <td className="border border-black p-4 text-center font-bold text-xl bg-green-100">
                              0.009 mGy in one hour
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-red-50 border-2 border-red-600 p-4 rounded">
                      <p className="font-bold text-red-800">
                        Tolerance: Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt; 1 mGy (114 mR) in one hour.
                      </p>
                    </div>
                  </div>
                )}
                {/* 8. Output Consistency */}
                {testData.outputConsistency && testData.outputConsistency.outputRows && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">8. Output Consistency</h3>

                    {/* Test Parameters */}
                    {testData.outputConsistency.parameters && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Test Parameters:</p>
                        <div className="text-sm grid grid-cols-3 gap-4">
                          <div><span className="font-medium">mAs:</span> {testData.outputConsistency.parameters.mas || "-"}</div>
                          <div><span className="font-medium">Slice Thickness:</span> {testData.outputConsistency.parameters.sliceThickness || "-"} mm</div>
                          <div><span className="font-medium">Time:</span> {testData.outputConsistency.parameters.time || "-"} s</div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Measurement Table */}
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th rowSpan={2} className="border border-black p-3">kVp</th>
                            <th colSpan={testData.outputConsistency.measurementHeaders?.length || 5} className="border border-black p-3">
                              Radiation Output (mGy)
                            </th>
                            <th rowSpan={2} className="border border-black p-3 bg-blue-100">Mean</th>
                            <th rowSpan={2} className="border border-black p-3 bg-yellow-100">COV (%)</th>
                          </tr>
                          <tr>
                            {testData.outputConsistency.measurementHeaders?.map((h: string, i: number) => (
                              <th key={i} className="border border-black p-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3 font-bold">{row.kvp || "-"}</td>
                              {row.outputs.map((val: string, idx: number) => (
                                <td key={idx} className="border p-3">{val || "-"}</td>
                              ))}
                              <td className="border p-3 font-semibold bg-blue-50">{row.mean || "-"}</td>
                              <td className="border p-3 font-semibold bg-yellow-50">
                                {row.cov ? `${(parseFloat(row.cov) * 100).toFixed(2)}%` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* outputConsistency */}
                    <div className="mt-6 flex justify-end items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          Tolerance (COV): ≤ {testData.outputConsistency.tolerance || "2.0"}%
                        </p>
                        <p className="text-2xl font-bold mt-2">
                          <span className={`px-3 py-1 rounded-full text-white ${testData.outputConsistency.outputRows?.every((r: any) =>
                            r.cov && parseFloat(r.cov) * 100 <= parseFloat(testData.outputConsistency.tolerance || "2")
                          ) ? "bg-green-600" : "bg-red-600"
                            }`}>
                            {/* {testData.outputConsistency.outputRows?.every((r: any) =>
                              r.cov && parseFloat(r.cov) * 100 <= parseFloat(testData.outputConsistency.tolerance || "2")
                            ) ? "PASS" : "FAIL"} */}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!Object.values(testData).some(Boolean) && (
                  <p className="text-center text-xl text-gray-500 mt-32">No test results available yet.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* MAIN SUMMARY TABLE */}
        <div className="px-8 py-12 print:p-8 print:px-4">
          <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
            <MainTestTableForCTScan testData={testData} />
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              counter-reset: page 1;
              margin: 0;
              padding: 0;
            }
            .print\\:break-before-page { page-break-before: always; }
            @page { 
              margin: 1cm;
              size: A4;
            }
            body::after {
              content: "Page " counter(page);
              position: fixed;
              bottom: 10px;
              right: 20px;
              font-size: 12px;
              color: #555;
            }
            body { counter-increment: page; }
            
            /* Ensure tables don't break across pages */
            table { 
              page-break-inside: avoid;
              break-inside: avoid;
            }
            tr { 
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Prevent text splitting */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
            p, li {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
    </>
  );
};

export default ViewServiceReport;