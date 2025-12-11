// src/components/reports/ViewServiceReportRadiographyFixed.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForRadiographyFixed } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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

const ViewServiceReportRadiographyFixed: React.FC = () => {
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
        const response = await getReportHeaderForRadiographyFixed(serviceId);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Radiography (Fixed)",
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
            category: data.category || "N/A",
          });

          // Extract test data from populated response
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

  const downloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    try {
      const btn = document.querySelector(".download-pdf-btn") as HTMLButtonElement;
      if (btn) {
        btn.textContent = "Generating PDF...";
        btn.disabled = true;
      }

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
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

      pdf.save(`RadiographyFixed-Report-${report?.testReportNumber || "report"}.pdf`);
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
              QA TEST REPORT FOR RADIOGRAPHY (FIXED) X-RAY EQUIPMENT
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
            <MainTestTableForRadiographyFixed testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">1. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Test Conditions:</p>
                    <div className="text-sm">
                      FCD: {testData.accuracyOfIrradiationTime.testConditions.fcd || "-"} cm | 
                      kV: {testData.accuracyOfIrradiationTime.testConditions.kv || "-"} | 
                      mA: {testData.accuracyOfIrradiationTime.testConditions.ma || "-"}
                    </div>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Set Time (mSec)</th>
                          <th className="border border-black p-3">Measured Time (mSec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.setTime || "-"}</td>
                            <td className="border p-3">{row.measuredTime || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">2. Accuracy of Operating Potential</h3>
                {testData.accuracyOfOperatingPotential.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Set kV</th>
                          <th className="border border-black p-3">10 mA</th>
                          <th className="border border-black p-3">100 mA</th>
                          <th className="border border-black p-3">200 mA</th>
                          <th className="border border-black p-3">Avg kVp</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.setKV || "-"}</td>
                            <td className="border p-3">{row.ma10 || "-"}</td>
                            <td className="border p-3">{row.ma100 || "-"}</td>
                            <td className="border p-3">{row.ma200 || "-"}</td>
                            <td className="border p-3 font-semibold">{row.avgKvp || "-"}</td>
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

            {/* 2.5. Total Filtration */}
            {testData.totalFilteration && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">2.5. Total Filtration</h3>
                
                {/* Accuracy of Operating Potential Table */}
                {testData.totalFilteration.measurements?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">Accuracy of Operating Potential</h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-2 border-black text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3">Applied kVp</th>
                            {testData.totalFilteration.mAStations?.map((ma: string, idx: number) => (
                              <th key={idx} className="border border-black p-3">{ma}</th>
                            ))}
                            <th className="border border-black p-3">Average kVp</th>
                            <th className="border border-black p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.totalFilteration.measurements.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3">{row.appliedKvp || "-"}</td>
                              {testData.totalFilteration.mAStations?.map((_: string, idx: number) => (
                                <td key={idx} className="border p-3">{row.measuredValues?.[idx] || "-"}</td>
                              ))}
                              <td className="border p-3 font-semibold">{row.averageKvp || "-"}</td>
                              <td className="border p-3">
                                <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600 font-semibold" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Tolerance */}
                    {testData.totalFilteration.tolerance && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border">
                        <p className="text-sm">
                          <strong>Tolerance:</strong> {testData.totalFilteration.tolerance.sign || "±"} {testData.totalFilteration.tolerance.value || "-"}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Filtration Result */}
                {testData.totalFilteration.totalFiltration && (
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <h4 className="text-lg font-semibold mb-4">Total Filtration</h4>
                    <div className="space-y-2">
                      <p className="text-base">
                        <strong>Measured:</strong> {testData.totalFilteration.totalFiltration.measured || "-"} mm Al
                      </p>
                      <p className="text-base">
                        <strong>Required:</strong> {testData.totalFilteration.totalFiltration.required || "-"} mm Al
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">3. Central Beam Alignment</h3>
                
                {/* Operating parameters */}
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div className="mb-6">
                    <p className="font-semibold mb-2 text-sm">Operating parameters:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm mb-4">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3">FFD (cm)</th>
                            <th className="border border-black p-3">kV</th>
                            <th className="border border-black p-3">mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border border-black p-3">{testData.centralBeamAlignment.techniqueFactors.fcd || "-"}</td>
                            <td className="border border-black p-3">{testData.centralBeamAlignment.techniqueFactors.kv || "-"}</td>
                            <td className="border border-black p-3">{testData.centralBeamAlignment.techniqueFactors.mas || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Central Beam Alignment Evaluation */}
                <div className="mb-4">
                  <p className="text-sm mb-3">
                    Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
                  </p>
                  {testData.centralBeamAlignment.observedTilt && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-black text-sm">
                        <tbody>
                          <tr>
                            <td className="border border-black p-3 font-medium w-1/2">Observed tilt</td>
                            <td className="border border-black p-3 text-center">
                              {testData.centralBeamAlignment.observedTilt.value || "-"}
                              {testData.centralBeamAlignment.observedTilt.remark && (
                                <span className={`ml-2 ${testData.centralBeamAlignment.observedTilt.remark === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}`}>
                                  {testData.centralBeamAlignment.observedTilt.remark}
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3 font-medium">Tolerance: Central Beam Alignment</td>
                            <td className="border border-black p-3 text-center">
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
              </div>
            )}

            {/* 4. Congruence */}
            {testData.congruence && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">4. Congruence of Radiation & Optical Field</h3>
                {testData.congruence.congruenceMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Dimension</th>
                          <th className="border border-black p-3">Observed Shift (cm)</th>
                          <th className="border border-black p-3">Edge Shift (cm)</th>
                          <th className="border border-black p-3">% FED</th>
                          <th className="border border-black p-3">Tolerance (%)</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.congruence.congruenceMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.dimension || "-"}</td>
                            <td className="border p-3">{row.observedShift || "-"}</td>
                            <td className="border p-3">{row.edgeShift || "-"}</td>
                            <td className="border p-3">{row.percentFED || "-"}</td>
                            <td className="border p-3">{row.tolerance || "-"}</td>
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

            {/* 5. Effective Focal Spot */}
            {testData.effectiveFocalSpot && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">5. Effective Focal Spot Size</h3>
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <p className="text-sm">
                    <strong>FCD:</strong> {testData.effectiveFocalSpot.fcd || "-"} cm
                  </p>
                </div>
                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Focus Type</th>
                          <th className="border border-black p-3">Stated (mm × mm)</th>
                          <th className="border border-black p-3">Measured (mm × mm)</th>
                          <th className="border border-black p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.effectiveFocalSpot.focalSpots.map((spot: any, i: number) => {
                          // Format values to always show one decimal place (e.g., 1.0, 2.0)
                          const formatValue = (val: any) => {
                            if (val === undefined || val === null || val === "") return "-";
                            const numVal = typeof val === 'number' ? val : parseFloat(val);
                            if (isNaN(numVal)) return "-";
                            // Always show one decimal place for consistency
                            return numVal.toFixed(1);
                          };
                          
                          const statedWidth = formatValue(spot.statedWidth);
                          const statedHeight = formatValue(spot.statedHeight);
                          const measuredWidth = formatValue(spot.measuredWidth);
                          const measuredHeight = formatValue(spot.measuredHeight);
                          
                          return (
                            <tr key={i} className="text-center">
                              <td className="border p-3">{spot.focusType || "-"}</td>
                              <td className="border p-3">{statedWidth} × {statedHeight}</td>
                              <td className="border p-3">{measuredWidth} × {measuredHeight}</td>
                              <td className="border p-3">
                                <span className={spot.remark === "Pass" ? "text-green-600" : spot.remark === "Fail" ? "text-red-600" : ""}>
                                  {spot.remark || "-"}
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

            {/* 6. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">6. Linearity of mAs Loading</h3>
                {/* Test Conditions */}
                {testData.linearityOfMasLoading.table1 && testData.linearityOfMasLoading.table1.length > 0 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2 text-sm">Test Conditions:</p>
                    <div className="text-sm">
                      FCD: {testData.linearityOfMasLoading.table1[0]?.fcd || "-"} cm | 
                      kV: {testData.linearityOfMasLoading.table1[0]?.kv || "-"} | 
                      Time: {testData.linearityOfMasLoading.table1[0]?.time || "-"} sec
                    </div>
                  </div>
                )}
                {testData.linearityOfMasLoading.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th rowSpan={2} className="border border-black p-3">mA</th>
                          <th colSpan={testData.linearityOfMasLoading.measHeaders?.length || 0} className="border border-black p-3">
                            Output (mGy)
                          </th>
                          <th rowSpan={2} className="border border-black p-3">Avg Output</th>
                          <th rowSpan={2} className="border border-black p-3">X (mGy/mA)</th>
                          <th rowSpan={2} className="border border-black p-3">X MAX</th>
                          <th rowSpan={2} className="border border-black p-3">X MIN</th>
                          <th rowSpan={2} className="border border-black p-3">CoL</th>
                          <th rowSpan={2} className="border border-black p-3">Remarks</th>
                        </tr>
                        <tr>
                          {testData.linearityOfMasLoading.measHeaders?.map((header: string, idx: number) => (
                            <th key={idx} className="border border-black p-2 text-xs">
                              {header || `Meas ${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {testData.linearityOfMasLoading.table2.map((row: any, i: number) => {
                          const xMax = testData.linearityOfMasLoading?.xMax;
                          const xMin = testData.linearityOfMasLoading?.xMin;
                          const col = testData.linearityOfMasLoading?.col;
                          const remarks = testData.linearityOfMasLoading?.remarks;
                          const isFirstRow = i === 0;
                          const rowSpan = testData.linearityOfMasLoading.table2.length;
                          const measHeaders = testData.linearityOfMasLoading?.measHeaders || [];
                          const measuredOutputs = row.measuredOutputs || [];
                          
                          // Format values - ensure they display properly
                          const formatValue = (val: any) => {
                            if (val === undefined || val === null) return "-";
                            const str = String(val).trim();
                            return str === "" || str === "—" || str === "undefined" || str === "null" ? "-" : str;
                          };
                          
                          return (
                            <tr key={i} className="text-center">
                              <td className="border p-3">{row.mAsApplied || "-"}</td>
                              {measHeaders.map((_: string, idx: number) => (
                                <td key={idx} className="border p-3">
                                  {formatValue(measuredOutputs[idx])}
                                </td>
                              ))}
                              <td className="border p-3 font-medium">{row.average || "-"}</td>
                              <td className="border p-3 font-medium">{row.x || "-"}</td>
                              {isFirstRow && (
                                <td rowSpan={rowSpan} className="border p-3 align-middle font-medium bg-yellow-50">
                                  {formatValue(xMax)}
                                </td>
                              )}
                              {isFirstRow && (
                                <td rowSpan={rowSpan} className="border p-3 align-middle font-medium bg-yellow-50">
                                  {formatValue(xMin)}
                                </td>
                              )}
                              {isFirstRow && (
                                <td rowSpan={rowSpan} className="border p-3 align-middle font-medium bg-yellow-50">
                                  {formatValue(col)}
                                </td>
                              )}
                              {isFirstRow && (
                                <td rowSpan={rowSpan} className="border p-3 align-middle">
                                  <span className={remarks === "Pass" || remarks === "PASS" ? "text-green-600 font-semibold" : remarks === "Fail" || remarks === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                    {formatValue(remarks)}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.linearityOfMasLoading.tolerance && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || "≤"} {testData.linearityOfMasLoading.tolerance || "0.1"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">7. Consistency of Radiation Output</h3>
                {testData.outputConsistency.outputRows?.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">kV</th>
                          <th className="border border-black p-3">mAs</th>
                          <th className="border border-black p-3">Avg (X̄)</th>
                          <th className="border border-black p-3">CV % / Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.kv || "-"}</td>
                            <td className="border p-3">{row.mas || "-"}</td>
                            <td className="border p-3 font-semibold">{row.avg || "-"}</td>
                            <td className="border p-3">
                              <span className={row.remark?.includes("Pass") ? "text-green-600" : row.remark?.includes("Fail") ? "text-red-600" : ""}>
                                {row.remark || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Acceptance Criteria:</strong> CV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value || "5.0"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 8. Radiation Leakage Level */}
            {testData.radiationLeakageLevel && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">8. Radiation Leakage Level</h3>
                {testData.radiationLeakageLevel.leakageMeasurements?.length > 0 && (
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
                        {testData.radiationLeakageLevel.leakageMeasurements.map((row: any, i: number) => (
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

            {/* 9. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">9. Details of Radiation Protection Survey</h3>
                
                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">1. Survey Details</h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-2 border-black text-sm">
                        <tbody>
                          <tr>
                            <td className="border border-black p-3 font-semibold w-1/2">Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3">{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3 font-semibold">Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 font-semibold">{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Equipment Setting */}
                {(testData.radiationProtectionSurvey.appliedCurrent || testData.radiationProtectionSurvey.appliedVoltage || testData.radiationProtectionSurvey.exposureTime || testData.radiationProtectionSurvey.workload) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">2. Equipment Setting</h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-2 border-black text-sm">
                        <tbody>
                          <tr>
                            <td className="border border-black p-3 font-semibold w-1/2">Applied Current (mA)</td>
                            <td className="border border-black p-3">{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3 font-semibold">Applied Voltage (kV)</td>
                            <td className="border border-black p-3">{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3 font-semibold">Exposure Time(s)</td>
                            <td className="border border-black p-3">{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3 font-semibold">Workload (mA min/week)</td>
                            <td className="border border-black p-3">{testData.radiationProtectionSurvey.workload || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Measured Maximum Radiation Levels */}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-2 border-black text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 text-left">Location</th>
                            <th className="border border-black p-3">Max. Radiation Level</th>
                            <th className="border border-black p-3">Result</th>
                            <th className="border border-black p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border p-3 text-left">{loc.location || "-"}</td>
                              <td className="border p-3">{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                              <td className="border p-3">{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                              <td className="border p-3">
                                <span className={loc.result === "PASS" || loc.result === "Pass" ? "text-green-600 font-semibold" : loc.result === "FAIL" || loc.result === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {loc.result || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Calculation Formula */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">4. Calculation Formula</h4>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 bg-gray-50">
                            <strong>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Summary of Maximum Radiation Level/week */}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");
                  const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const workerResult = parseFloat(maxWorkerWeekly) > 0 && parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : parseFloat(maxWorkerWeekly) > 40 ? "Fail" : "";
                  const publicResult = parseFloat(maxPublicWeekly) > 0 && parseFloat(maxPublicWeekly) <= 2 ? "Pass" : parseFloat(maxPublicWeekly) > 2 ? "Fail" : "";
                  
                  return (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4">5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full border-2 border-black text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-3">Category</th>
                              <th className="border border-black p-3">Result</th>
                              <th className="border border-black p-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center">
                              <td className="border border-black p-3 font-semibold">For Radiation Worker</td>
                              <td className="border border-black p-3">{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3">
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {workerResult || "-"}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center">
                              <td className="border border-black p-3 font-semibold">For Public</td>
                              <td className="border border-black p-3">{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3">
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {publicResult || "-"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Permissible Limit */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">6. Permissible Limit</h4>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 font-semibold w-1/2">For location of Radiation Worker</td>
                          <td className="border border-black p-3">20 mSv in a year (40 mR/week)</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold">For Location of Member of Public</td>
                          <td className="border border-black p-3">1 mSv in a year (2mR/week)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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

export default ViewServiceReportRadiographyFixed;
