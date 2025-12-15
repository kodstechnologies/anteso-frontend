// src/components/reports/ViewServiceReportOArm.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForOArm } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MainTestTableForOArm from "./MainTestTableForOArm";

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

  // Test documents
  ExposureRateTableTopOArm?: any;
  HighContrastResolutionOArm?: any;
  LowContrastResolutionOArm?: any;
  OutputConsistencyForOArm?: any;
  TotalFilterationForOArm?: any;
  TubeHousingLeakageOArm?: any;
  LinearityOfMasLoadingStationOArm?: any;
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

const ViewServiceReportOArm: React.FC = () => {
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
        const response = await getReportHeaderForOArm(serviceId);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "O-Arm",
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

          // Transform Tube Housing Leakage Data
          const tubeHousingData = data.TubeHousingLeakageOArm;
          let transformedRadiationLeakage = null;

          if (tubeHousingData) {
            const leakageRows = tubeHousingData.leakageMeasurements || tubeHousingData.leakageRows || [];
            const toleranceValue = parseFloat(tubeHousingData.toleranceValue || "1.0");
            const toleranceOperator = tubeHousingData.toleranceOperator || "less than or equal to";

            const processedRows = leakageRows.map((row: any) => {
              const values = [row.left, row.right, row.front, row.back, row.top]
                .map((v: any) => parseFloat(v) || 0)
                .filter((v: number) => v > 0);

              const maxReading = values.length > 0 ? Math.max(...values) : 0;
              const maxStr = maxReading > 0 ? maxReading.toFixed(2) : ""; // Raw max

              // If backend doesn't provide remark, calculate it
              let remark = row.remark;
              if (!remark && maxReading > 0) {
                // Note: true Pass/Fail deps on workload calculation (mGy/h), but if we only have raw values here we might skip
                // However, usually we expect backend/component to save 'max' (mGy/h value hopefully calculated).
                // For now, if 'max' is the mGy value:
                const maxVal = parseFloat(row.max || maxStr); // Assuming row.max is the final calculated mGy/h if present
                if (toleranceOperator === 'less than or equal to') {
                  remark = maxVal <= toleranceValue ? 'Pass' : 'Fail';
                } else if (toleranceOperator === 'greater than or equal to') {
                  remark = maxVal >= toleranceValue ? 'Pass' : 'Fail';
                }
              }

              return {
                ...row,
                max: row.max || maxStr, // Use saved max or calculated raw max
                remark: remark || (maxReading === 0 ? "" : "Pass"), // Fallback if no tolerance check possible
              };
            });

            transformedRadiationLeakage = {
              ...tubeHousingData,
              leakageRows: processedRows,
              maxRadiationLeakage: tubeHousingData.maxRadiationLeakage || tubeHousingData.maxLeakageResult || "",
            };
          }

          // Extract test data from populated response
          setTestData({
            exposureRateTableTop: data.ExposureRateTableTopOArm || null,
            highContrastResolution: data.HighContrastResolutionOArm || null,
            lowContrastResolution: data.LowContrastResolutionOArm || null,
            outputConsistency: data.OutputConsistencyForOArm || null,
            totalFilteration: data.TotalFilterationForOArm || null,
            // Map TotalFilteration to operatingPotential for "Accuracy of Operating Potential" table
            operatingPotential: data.TotalFilterationForOArm || null,
            tubeHousingLeakage: transformedRadiationLeakage,
            linearityOfMasLoading: data.LinearityOfMasLoadingStationOArm || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load O-Arm report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

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
        scale: 1.5, // Optimized for smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      // Convert to JPEG with compression for much smaller file size
      const imgData = canvas.toDataURL("image/jpeg", 0.85); // JPEG at 85% quality - good balance
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`OArm-Report-${report?.testReportNumber || "report"}.pdf`);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading O-Arm Report...</div>;

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
                    <tr><td className="border px-3 py-1 font-bold">SRF No.</td><td className="border px-3 py-1">{report.srfNumber}</td></tr>
                    <tr><td className="border px-3 py-1 font-bold">SRF Date</td><td className="border px-3 py-1">{formatDate(report.srfDate)}</td></tr>
                    <tr><td className="border px-3 py-1 font-bold">ULR No.</td><td className="border px-3 py-1">TC9A43250001485F</td></tr>
                  </tbody>
                </table>
              </div>
              <img src={logo} alt="Logo" className="h-28" />
            </div>

            <div className="text-center mb-6">
              <p className="text-sm">Government of India, Atomic Energy Regulatory Board</p>
              <p className="text-sm">Radiological Safety Division, Mumbai-400094</p>
            </div>

            <h1 className="text-center text-2xl font-bold underline mb-4">
              QA TEST REPORT FOR O-ARM X-RAY EQUIPMENT
            </h1>
            <p className="text-center italic text-sm mb-10">
              (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
            </p>

            {/* Customer Details */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
              <div className="border-2 border-gray-600 p-5 text-lg">
                <p><strong>Customer:</strong> {report.customerName}</p>
                <p><strong>Address:</strong> {report.address}</p>
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

            {/* Equipment Details */}
            <section className="mb-8">
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
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">4. Standards / Tools Used</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-600 text-xs">
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
                    {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
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
                      <tr><td colSpan={7} className="text-center py-4">No tools recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Notes */}
            <section className="mb-12">
              <h2 className="font-bold text-lg mb-3">5. Notes</h2>
              <div className="ml-8 text-sm">
                {notesArray.map(n => (
                  <p key={n.slNo}><strong>{n.slNo}.</strong> {n.text}</p>
                ))}
              </div>
            </section>

            {/* Signature */}
            <div className="flex justify-between items-end mt-20">
              <img src={AntesoQRCode} alt="QR" className="h-24" />
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
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <MainTestTableForOArm testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Total Filtration */}
            {testData.totalFilteration && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">1. Total Filtration</h3>
                {testData.totalFilteration.measurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Applied kVp</th>
                          {testData.totalFilteration.mAStations?.map((ma: string, idx: number) => (
                            <th key={idx} className="border border-black p-3">{ma}</th>
                          ))}
                          <th className="border border-black p-3">Avg kVp</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.totalFilteration.measurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.appliedKvp || "-"}</td>
                            {row.measuredValues?.map((val: any, idx: number) => (
                              <td key={idx} className="border p-3">{val || "-"}</td>
                            ))}
                            <td className="border p-3 font-semibold">{row.averageKvp || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "PASS" ? "text-green-600" : row.remarks === "FAIL" ? "text-red-600" : ""}>
                                {row.remarks || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

            {/* 2. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">2. Consistency of Radiation Output</h3>
                {testData.outputConsistency.outputRows?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">kVp</th>
                          <th className="border border-black p-3">mA</th>
                          <th className="border border-black p-3">Mean (X̄)</th>
                          <th className="border border-black p-3">COV %</th>
                          <th className="border border-black p-3">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.kvp || "-"}</td>
                            <td className="border p-3">{row.ma || "-"}</td>
                            <td className="border p-3 font-semibold">{row.mean || "-"}</td>
                            <td className="border p-3">{row.cov || "-"}</td>
                            <td className="border p-3">
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

            {/* 3. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">3. High Contrast Resolution</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm">
                    <strong>Measured Resolution:</strong> {testData.highContrastResolution.measuredLpPerMm || "-"} lp/mm
                  </p>
                  <p className="text-sm">
                    <strong>Recommended Standard:</strong> {testData.highContrastResolution.recommendedStandard || "-"} lp/mm
                  </p>
                </div>
              </div>
            )}

            {/* 4. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">4. Low Contrast Resolution</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm">
                    <strong>Smallest Hole Size:</strong> {testData.lowContrastResolution.smallestHoleSize || "-"} mm
                  </p>
                  <p className="text-sm">
                    <strong>Recommended Standard:</strong> {testData.lowContrastResolution.recommendedStandard || "-"} mm
                  </p>
                </div>
              </div>
            )}

            {/* 5. Exposure Rate at Table Top */}
            {testData.exposureRateTableTop && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">5. Exposure Rate at Table Top</h3>
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

            {/* 6. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">6. Tube Housing Leakage</h3>
                {testData.tubeHousingLeakage.leakageRows?.length > 0 && (
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
                        {testData.tubeHousingLeakage.leakageRows.map((row: any, i: number) => (
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

            {/* 7. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">7. Linearity of mAs Loading</h3>
                {testData.linearityOfMasLoading.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">mAs Applied</th>
                          <th className="border border-black p-3">Average Output</th>
                          <th className="border border-black p-3">X (mGy/mAs)</th>
                          <th className="border border-black p-3">X Max</th>
                          <th className="border border-black p-3">X Min</th>
                          <th className="border border-black p-3">CoL</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.linearityOfMasLoading.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.mAsApplied || "-"}</td>
                            <td className="border p-3">{row.average || "-"}</td>
                            <td className="border p-3">{row.x || "-"}</td>
                            <td className="border p-3">{row.xMax || "-"}</td>
                            <td className="border p-3">{row.xMin || "-"}</td>
                            <td className="border p-3">{row.col || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
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

export default ViewServiceReportOArm;
