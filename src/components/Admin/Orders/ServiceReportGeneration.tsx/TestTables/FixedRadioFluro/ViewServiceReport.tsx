// src/components/reports/ViewServiceReportFixedRadioFluro.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeader } from "../../../../../../api";
import FixedRadioFlouroResultTable from "./FixedRadioFluoroResultTable";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
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
  category?: string;
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
  notes: Note[];

  accuracyOfOperatingPotentialFixedRadioFluoro?: any;
  OutputConsistencyForFixedRadioFluoro?: any;
  LowContrastResolutionFixedRadioFlouro?: any;
  HighContrastResolutionFixedRadioFluoro?: any;
  ExposureRateTableTopFixedRadioFlouro?: any;
  LinearityOfmAsLoadingFixedRadioFluoro?: any;
  TubeHousingLeakageFixedRadioFlouro?: any;
  AccuracyOfIrradiationTimeFixedRadioFluoro?: any;

  CongruenceOfRadiationForRadioFluro?: any;
  CentralBeamAlignmentForRadioFluoro?: any;
}


const ViewServiceReportFixedRadioFluro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [testsLoading, setTestsLoading] = useState(false);
  const [testData, setTestData] = useState<any>({
    accuracyOfOperatingPotential: null,
    totalFiltration: null,
    outputConsistency: null,
    lowContrastResolution: null,
    highContrastResolution: null,
    exposureRate: null,
    linearityOfmAsLoading: null,
    tubeHousingLeakage: null,
    accuracyOfIrradiationTime: null,
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
        if (response.exists && response.data) {
          // Ensure arrays have default values
          setReport({
            ...response.data,
            toolsUsed: response.data.toolsUsed || [],
            notes: response.data.notes || [],
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

  // For Fixed Radio Fluoro, test data comes directly populated in the header
  useEffect(() => {
    if (!report) return;

    setTestsLoading(true);
    setTestData({
      accuracyOfOperatingPotential: report.accuracyOfOperatingPotentialFixedRadioFluoro,
      outputConsistency: report.OutputConsistencyForFixedRadioFluoro,
      lowContrastResolution: report.LowContrastResolutionFixedRadioFlouro,
      highContrastResolution: report.HighContrastResolutionFixedRadioFluoro,
      exposureRate: report.ExposureRateTableTopFixedRadioFlouro,
      linearityOfmAsLoading: report.LinearityOfmAsLoadingFixedRadioFluoro,
      tubeHousingLeakage: report.TubeHousingLeakageFixedRadioFlouro,
      accuracyOfIrradiationTime: report.AccuracyOfIrradiationTimeFixedRadioFluoro,
    });


    setTestsLoading(false);
  }, [report]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const downloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    try {
      const btn = document.querySelector(".download-pdf-btn") as HTMLButtonElement;
      if (btn) {
        btn.textContent = "Generating PDF...";
        btn.disabled = true;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`FixedRadioFluro-Report-${report?.testReportNumber || "report"}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF");
    } finally {
      const btn = document.querySelector(".download-pdf-btn") as HTMLButtonElement;
      if (btn) {
        btn.textContent = "Download PDF";
        btn.disabled = false;
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
          <p>Please generate and save the report header first.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Build a simple summary table input for FixedRadioFluroResultTable
  const summaryRows = [
    {
      srNo: "1",
      parameterTested: "Accuracy of Operating Potential",
      specifiedValue: "",
      measuredValue: testData.accuracyOfOperatingPotential ? "Measured" : "Not Tested",
      tolerance: "As per AERB protocol",
      remark: "",
    },
    {
      srNo: "2",
      parameterTested: "Linearity of mAs Loading",
      specifiedValue: "",
      measuredValue: testData.linearityOfmAsLoading ? "Measured" : "Not Tested",
      tolerance: "CoL ≤ 0.1",
      remark: "",
    },
    {
      srNo: "3",
      parameterTested: "Low Contrast Resolution",
      specifiedValue: "",
      measuredValue: testData.lowContrastResolution ? "Measured" : "Not Tested",
      tolerance: "As per AERB protocol",
      remark: "",
    },
    {
      srNo: "4",
      parameterTested: "High Contrast Resolution",
      specifiedValue: "",
      measuredValue: testData.highContrastResolution ? "Measured" : "Not Tested",
      tolerance: "As per AERB protocol",
      remark: "",
    },
    {
      srNo: "5",
      parameterTested: "Exposure Rate at Table Top",
      specifiedValue: "",
      measuredValue: testData.exposureRate ? "Measured" : "Not Tested",
      tolerance: "As per AERB protocol",
      remark: "",
    },
    {
      srNo: "6",
      parameterTested: "Tube Housing Leakage",
      specifiedValue: "< 1 mGy in one hour",
      measuredValue: testData.tubeHousingLeakage ? "Measured" : "Not Tested",
      tolerance: "< 1 mGy in one hour",
      remark: "",
    },
    {
      srNo: "7",
      parameterTested: "Accuracy of Irradiation Time",
      specifiedValue: "",
      measuredValue: testData.accuracyOfIrradiationTime ? "Measured" : "Not Tested",
      tolerance: "±5 %",
      remark: "",
    },
    {
      srNo: "8",
      parameterTested: "Output Consistency",
      specifiedValue: "",
      measuredValue: testData.outputConsistency ? "Measured" : "Not Tested",
      tolerance: "COV ≤ 2 %",
      remark: "",
    },
  ];

  return (
    <>
      {/* Floating buttons */}
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

      <div id="report-content" className="bg-white">
        {/* PAGE 1 - MAIN REPORT */}
        <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0">
          <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none border print:border-0 p-10 print:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <img src={logoA} alt="NABL" className="h-28" />
              <div className="text-right">
                <table className="text-xs border border-gray-600">
                  <tbody>
                    <tr>
                      <td className="border px-3 py-1 font-bold">SRF No.</td>
                      <td className="border px-3 py-1">{report.srfNumber}</td>
                    </tr>
                    <tr>
                      <td className="border px-3 py-1 font-bold">SRF Date</td>
                      <td className="border px-3 py-1">{formatDate(report.srfDate)}</td>
                    </tr>
                    <tr>
                      <td className="border px-3 py-1 font-bold">ULR No.</td>
                      <td className="border px-3 py-1">TC9A43250001485F</td>
                    </tr>
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
              QA TEST REPORT FOR FIXED RADIOGRAPHY & FLUOROSCOPY EQUIPMENT
            </h1>
            <p className="text-center italic text-sm mb-10">
              (Periodic Quality Assurance shall be carried out at least once in two years as per AERB
              guidelines)
            </p>

            {/* Customer Details */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
              <div className="border-2 border-gray-600 p-5 text-lg">
                <p>
                  <strong>Customer:</strong> {report.customerName || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {report.address || "N/A"}
                </p>
              </div>
            </section>

            {/* Reference */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">2. Reference</h2>
              <table className="w-full border-2 border-gray-600 text-sm">
                <tbody>
                  <tr>
                    <td className="border p-3 font-medium w-1/2">SRF No. &amp; Date</td>
                    <td className="border p-3">
                      {report.srfNumber} / {formatDate(report.srfDate)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Test Report No. &amp; Issue Date</td>
                    <td className="border p-3">
                      {report.testReportNumber} / {formatDate(report.issueDate)}
                    </td>
                  </tr>
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
                    ["Category", report.category || ""],
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
                    {report.toolsUsed && report.toolsUsed.length > 0 ? (
                      report.toolsUsed.map((tool, i) => (
                        <tr key={i}>
                          <td className="border p-2 text-center">{i + 1}</td>
                          <td className="border p-2">{tool.nomenclature}</td>
                          <td className="border p-2">
                            {tool.make} / {tool.model}
                          </td>
                          <td className="border p-2">{tool.SrNo}</td>
                          <td className="border p-2">{tool.range}</td>
                          <td className="border p-2">{tool.calibrationCertificateNo}</td>
                          <td className="border p-2">{formatDate(tool.calibrationValidTill)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 border">
                          No tools recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Notes */}
            <section className="mb-12">
              <h2 className="font-bold text-lg mb-3">5. Notes</h2>
              <div className="ml-8 text-sm">
                {report.notes && report.notes.length > 0 ? (
                  report.notes.map((n) => (
                    <p key={n.slNo}>
                      <strong>{n.slNo}.</strong> {n.text}
                    </p>
                  ))
                ) : (
                  <p>No notes added.</p>
                )}
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

        {/* PAGE 2+ - DETAILED TEST RESULTS (HIGH LEVEL) */}
        <div className="bg-white px-8 py-12 print:p-8 print:px-4">
          <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
            <h2 className="text-3xl font-bold text-center underline mb-16">
              DETAILED TEST RESULTS
            </h2>

            {testsLoading ? (
              <p className="text-center text-xl">Loading test results...</p>
            ) : (
              <>
                {/* 1. Accuracy of Operating Potential */}
                {testData.accuracyOfOperatingPotential && testData.accuracyOfOperatingPotential.table2 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">1. Accuracy of Operating Potential (kVp)</h3>

                    {testData.accuracyOfOperatingPotential.table1 && testData.accuracyOfOperatingPotential.table1.length > 0 && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Test Conditions:</p>
                        <div className="text-sm">
                          {testData.accuracyOfOperatingPotential.table1.map((cond: any, i: number) => (
                            <div key={i} className="mb-1">
                              <span className="font-medium">Time:</span> {cond.time || "-"},{' '}
                              <span className="font-medium">Slice Thickness:</span> {cond.sliceThickness || "-"}
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
                            <th colSpan={3} className="border border-black p-3">Measured kVp at Different mA</th>
                            <th rowSpan={2} className="border border-black p-3 bg-blue-100">Average kVp</th>
                            <th rowSpan={2} className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black p-2">10 mA</th>
                            <th className="border border-black p-2">100 mA</th>
                            <th className="border border-black p-2">200 mA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3 font-bold">{row.setKV || "-"}</td>
                              <td className="border p-3">{row.ma10 || "-"}</td>
                              <td className="border p-3">{row.ma100 || "-"}</td>
                              <td className="border p-3">{row.ma200 || "-"}</td>
                              <td className="border p-3 font-semibold bg-blue-50">{row.avgKvp || "-"}</td>
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

                    {testData.accuracyOfOperatingPotential.tolerance && (
                      <div className="mt-4 text-right text-sm font-medium text-gray-700">
                        Acceptable Tolerance: {testData.accuracyOfOperatingPotential.tolerance.sign === "minus" ? "-" : "±"}
                        {testData.accuracyOfOperatingPotential.tolerance.value}
                        {testData.accuracyOfOperatingPotential.tolerance.type === "percent" ? "%" : " kVp"}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Low Contrast Resolution */}
                {testData.lowContrastResolution && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">2. Low Contrast Resolution</h3>
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Smallest Hole Size (mm)</th>
                            <th className="border border-black p-3">Recommended Standard (mm)</th>
                            <th className="border border-black p-3">Tolerance</th>
                            <th className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border p-3 font-semibold">{testData.lowContrastResolution.smallestHoleSize || "-"}</td>
                            <td className="border p-3">{testData.lowContrastResolution.recommendedStandard || "-"}</td>
                            <td className="border p-3">{testData.lowContrastResolution.tolerance || "-"}</td>
                            <td className="border p-3 font-bold">
                              <span className={testData.lowContrastResolution.remark === "Pass" ? "text-green-600" : "text-red-600"}>
                                {testData.lowContrastResolution.remark || "Pending"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. High Contrast Resolution */}
                {testData.highContrastResolution && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">3. High Contrast Resolution</h3>
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Measured LP/mm</th>
                            <th className="border border-black p-3">Recommended Standard (LP/mm)</th>
                            <th className="border border-black p-3">Tolerance</th>
                            <th className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border p-3 font-semibold">{testData.highContrastResolution.measuredLpPerMm || "-"}</td>
                            <td className="border p-3">{testData.highContrastResolution.recommendedStandard || "-"}</td>
                            <td className="border p-3">{testData.highContrastResolution.tolerance || "-"}</td>
                            <td className="border p-3 font-bold">
                              <span className={testData.highContrastResolution.remark === "Pass" ? "text-green-600" : "text-red-600"}>
                                {testData.highContrastResolution.remark || "Pending"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Exposure Rate at Table Top */}
                {testData.exposureRate && testData.exposureRate.rows && testData.exposureRate.rows.length > 0 && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">4. Exposure Rate at Table Top</h3>
                    <div className="mb-4 text-sm text-gray-600">
                      <p><strong>Non-AEC Tolerance:</strong> {testData.exposureRate.nonAecTolerance || "-"}%</p>
                      <p><strong>AEC Tolerance:</strong> {testData.exposureRate.aecTolerance || "-"}%</p>
                      <p><strong>Minimum Focus Distance:</strong> {testData.exposureRate.minFocusDistance || "-"} cm</p>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Distance (cm)</th>
                            <th className="border border-black p-3">Applied kV</th>
                            <th className="border border-black p-3">Applied mA</th>
                            <th className="border border-black p-3">Exposure (mGy)</th>
                            <th className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.exposureRate.rows.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3">{row.distance || "-"}</td>
                              <td className="border p-3">{row.appliedKv || "-"}</td>
                              <td className="border p-3">{row.appliedMa || "-"}</td>
                              <td className="border p-3 font-semibold">{row.exposure || "-"}</td>
                              <td className="border p-3">{row.remark || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Congruence of Radiation */}
                {report?.CongruenceOfRadiationForRadioFluro && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">5. Congruence of Radiation</h3>
                    {report.CongruenceOfRadiationForRadioFluro.techniqueFactors && (
                      <div className="mb-4 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Technique Factors:</p>
                        <div className="text-sm">
                          <span className="font-medium">FCD:</span> {report.CongruenceOfRadiationForRadioFluro.techniqueFactors[0]?.fcd || "-"} cm,{' '}
                          <span className="font-medium">kV:</span> {report.CongruenceOfRadiationForRadioFluro.techniqueFactors[0]?.kv || "-"},{' '}
                          <span className="font-medium">mAs:</span> {report.CongruenceOfRadiationForRadioFluro.techniqueFactors[0]?.mas || "-"}
                        </div>
                      </div>
                    )}
                    {report.CongruenceOfRadiationForRadioFluro.congruenceMeasurements && report.CongruenceOfRadiationForRadioFluro.congruenceMeasurements.length > 0 && (
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="border border-black p-3">Dimension</th>
                              <th className="border border-black p-3">Observed Shift (mm)</th>
                              <th className="border border-black p-3">Edge Shift (mm)</th>
                              <th className="border border-black p-3">% FED</th>
                              <th className="border border-black p-3">Tolerance (%)</th>
                              <th className="border border-black p-3 bg-green-100">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.CongruenceOfRadiationForRadioFluro.congruenceMeasurements.map((row: any, i: number) => (
                              <tr key={i} className="text-center">
                                <td className="border p-3 font-bold">{row.dimension || "-"}</td>
                                <td className="border p-3">{row.observedShift || "-"}</td>
                                <td className="border p-3">{row.edgeShift || "-"}</td>
                                <td className="border p-3">{row.percentFED || "-"}</td>
                                <td className="border p-3">{row.tolerance || "-"}</td>
                                <td className="border p-3 font-bold">
                                  <span className={row.remark === "Pass" ? "text-green-600" : "text-red-600"}>
                                    {row.remark || "Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {report.CongruenceOfRadiationForRadioFluro.finalResult && (
                      <div className="mt-4 text-right text-sm font-medium">
                        <span className="font-bold">Final Result: </span>
                        <span className={report.CongruenceOfRadiationForRadioFluro.finalResult === "PASS" ? "text-green-600" : "text-red-600"}>
                          {report.CongruenceOfRadiationForRadioFluro.finalResult}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Central Beam Alignment */}
                {report?.CentralBeamAlignmentForRadioFluoro && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">6. Central Beam Alignment</h3>
                    {report.CentralBeamAlignmentForRadioFluoro.techniqueFactors && (
                      <div className="mb-4 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Technique Factors:</p>
                        <div className="text-sm">
                          <span className="font-medium">FCD:</span> {report.CentralBeamAlignmentForRadioFluoro.techniqueFactors.fcd || "-"} cm,{' '}
                          <span className="font-medium">kV:</span> {report.CentralBeamAlignmentForRadioFluoro.techniqueFactors.kv || "-"},{' '}
                          <span className="font-medium">mAs:</span> {report.CentralBeamAlignmentForRadioFluoro.techniqueFactors.mas || "-"}
                        </div>
                      </div>
                    )}
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-black p-3">Observed Tilt</th>
                            <th className="border border-black p-3">Tolerance</th>
                            <th className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border p-3 font-semibold">
                              {report.CentralBeamAlignmentForRadioFluoro.observedTilt?.operator || ""} {report.CentralBeamAlignmentForRadioFluoro.observedTilt?.value || "-"}°
                            </td>
                            <td className="border p-3">
                              {report.CentralBeamAlignmentForRadioFluoro.tolerance?.operator || ""} {report.CentralBeamAlignmentForRadioFluoro.tolerance?.value || "-"}°
                            </td>
                            <td className="border p-3 font-bold">
                              <span className={report.CentralBeamAlignmentForRadioFluoro.observedTilt?.remark === "Pass" ? "text-green-600" : "text-red-600"}>
                                {report.CentralBeamAlignmentForRadioFluoro.observedTilt?.remark || "Pending"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {report.CentralBeamAlignmentForRadioFluoro.finalResult && (
                      <div className="mt-4 text-right text-sm font-medium">
                        <span className="font-bold">Final Result: </span>
                        <span className={report.CentralBeamAlignmentForRadioFluoro.finalResult === "PASS" ? "text-green-600" : "text-red-600"}>
                          {report.CentralBeamAlignmentForRadioFluoro.finalResult}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 7. Linearity of mAs Loading */}
                {(testData.linearityOfmAsLoading?.table2Rows || report?.LinearityOfmAsLoadingFixedRadioFluoro?.table2Rows) && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">7. Linearity of mAs Loading</h3>
                    {(testData.linearityOfmAsLoading?.exposureCondition || report?.LinearityOfmAsLoadingFixedRadioFluoro?.exposureCondition) && (
                      <div className="mb-4 bg-gray-50 p-4 rounded border">
                        <p className="font-semibold mb-2">Exposure Conditions:</p>
                        <div className="text-sm">
                          <span className="font-medium">FCD:</span> {testData.linearityOfmAsLoading?.exposureCondition?.fcd || report?.LinearityOfmAsLoadingFixedRadioFluoro?.exposureCondition?.fcd || "-"} cm,{' '}
                          <span className="font-medium">kV:</span> {testData.linearityOfmAsLoading?.exposureCondition?.kv || report?.LinearityOfmAsLoadingFixedRadioFluoro?.exposureCondition?.kv || "-"}
                        </div>
                      </div>
                    )}
                    {(testData.linearityOfmAsLoading?.table2Rows || report?.LinearityOfmAsLoadingFixedRadioFluoro?.table2Rows) && (
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full border-2 border-black text-sm print:text-xs print:min-w-full">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="border border-black p-3">mAs Range</th>
                              <th colSpan={3} className="border border-black p-3">Measured Outputs</th>
                              <th className="border border-black p-3 bg-blue-100">Average</th>
                              <th className="border border-black p-3 bg-yellow-100">Coefficient (CoL)</th>
                              <th className="border border-black p-3 bg-green-100">Remarks</th>
                            </tr>
                            <tr>
                              <th></th>
                              <th className="border border-black p-2">Reading 1</th>
                              <th className="border border-black p-2">Reading 2</th>
                              <th className="border border-black p-2">Reading 3</th>
                              <th></th>
                              <th></th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(testData.linearityOfmAsLoading?.table2Rows || report?.LinearityOfmAsLoadingFixedRadioFluoro?.table2Rows || []).map((row: any, i: number) => (
                              <tr key={i} className="text-center">
                                <td className="border p-3 font-bold">{row.mAsRange || "-"}</td>
                                <td className="border p-3">{row.measuredOutputs?.[0] || "-"}</td>
                                <td className="border p-3">{row.measuredOutputs?.[1] || "-"}</td>
                                <td className="border p-3">{row.measuredOutputs?.[2] || "-"}</td>
                                <td className="border p-3 font-semibold bg-blue-50">{row.average || "-"}</td>
                                <td className="border p-3 font-semibold bg-yellow-50">{row.col || "-"}</td>
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
                    )}
                    {(testData.linearityOfmAsLoading?.tolerance || report?.LinearityOfmAsLoadingFixedRadioFluoro?.tolerance) && (
                      <div className="mt-4 text-right text-sm font-medium text-gray-700">
                        Acceptable Tolerance: ≤ {testData.linearityOfmAsLoading?.tolerance || report?.LinearityOfmAsLoadingFixedRadioFluoro?.tolerance || "0.1"}
                      </div>
                    )}
                  </div>
                )}

                {/* 8. Output Consistency */}
                {testData.outputConsistency && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">8. Output Consistency</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Output consistency measurements (mean and COV) are available for this service.
                    </p>
                  </div>
                )}

                {/* 9. Tube Housing Leakage */}
                {testData.tubeHousingLeakage && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">9. Radiation Leakage from Tube Housing</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Tube housing leakage measurements at 1 m from the focus are available for this service.
                    </p>
                  </div>
                )}

                {/* 10. Accuracy of Irradiation Time */}
                {testData.accuracyOfIrradiationTime && (
                  <div className="mb-16 print:mb-12">
                    <h3 className="text-xl font-bold mb-4">10. Accuracy of Irradiation Time</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Irradiation time accuracy measurements are available for this service.
                    </p>
                  </div>
                )}

                {!Object.values(testData).some(Boolean) && !report?.CongruenceOfRadiationForRadioFluro && !report?.CentralBeamAlignmentForRadioFluoro && (
                  <p className="text-center text-xl text-gray-500 mt-32">
                    No test results available yet.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* MAIN SUMMARY TABLE */}
        <div className="px-8 py-12 print:p-8 print:px-4">
          <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
            <FixedRadioFlouroResultTable testResults={summaryRows} />
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              margin: 0;
              padding: 0;
            }
            .print\\:break-before-page { page-break-before: always; }
            @page { 
              margin: 1cm;
              size: A4;
            }
            table { 
              page-break-inside: avoid;
              break-inside: avoid;
            }
            tr { 
              page-break-inside: avoid;
              break-inside: avoid;
            }
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

export default ViewServiceReportFixedRadioFluro;