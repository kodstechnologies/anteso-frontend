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
  toolsUsed?: Tool[]; // Make optional
  notes?: Note[]; // Make optional

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

// Default notes to use if none are provided
const defaultNotes: Note[] = [
  { slNo: "5.1", text: "The Test Report relates only to the above item only." },
  {
    slNo: "5.2",
    text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL.",
  },
  { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
  {
    slNo: "5.4",
    text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats.",
  },
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
          // Ensure arrays exist before setting state
          const data = response.data;
          const processedData: ReportData = {
            ...data,
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          };
          setReport(processedData);
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

  // Get notes array - use report notes if available, otherwise use defaults
  const notesArray = report.notes && report.notes.length > 0 ? report.notes : defaultNotes;

  // Get tools array - use report tools if available, otherwise use empty array
  const toolsArray = report.toolsUsed || [];

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
                    {toolsArray.length > 0 ? (
                      toolsArray.map((tool, i) => (
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
                {notesArray.map((n) => (
                  <p key={n.slNo}>
                    <strong>{n.slNo}.</strong> {n.text}
                  </p>
                ))}
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
                  </div>
                )}

                {testData.linearityOfmAsLoading && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">2. Linearity of mAs Loading</h3>
                    <p className="text-sm text-gray-600">
                      Linearity of mAs loading measurements are available for this service.
                    </p>
                  </div>
                )}

                {testData.lowContrastResolution && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">3. Low Contrast Resolution</h3>
                    <p className="text-sm text-gray-600">
                      Low contrast resolution measurements are available for this service.
                    </p>
                  </div>
                )}

                {testData.highContrastResolution && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">4. High Contrast Resolution</h3>
                    <p className="text-sm text-gray-600">
                      High contrast resolution measurements are available for this service.
                    </p>
                  </div>
                )}

                {testData.exposureRate && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">5. Exposure Rate at Table Top</h3>
                    <p className="text-sm text-gray-600">
                      Exposure rate measurements at table top are available for this service.
                    </p>
                  </div>
                )}

                {testData.tubeHousingLeakage && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">
                      6. Radiation Leakage from Tube Housing
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tube housing leakage measurements at 1 m from the focus are available for this
                      service.
                    </p>
                  </div>
                )}

                {testData.accuracyOfIrradiationTime && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">7. Accuracy of Irradiation Time</h3>
                    <p className="text-sm text-gray-600">
                      Irradiation time accuracy measurements are available for this service.
                    </p>
                  </div>
                )}

                {testData.outputConsistency && (
                  <div className="mb-12 print:mb-10">
                    <h3 className="text-xl font-bold mb-2">8. Output Consistency</h3>
                    <p className="text-sm text-gray-600">
                      Output consistency measurements (mean and COV) are available for this service.
                    </p>
                  </div>
                )}

                {!Object.values(testData).some(Boolean) && (
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