// src/components/reports/ViewServiceReportCBCT.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForCBCT } from "../../../../../../api";
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

  // All CBCT Tests
  AccuracyOfIrradiationTimeCBCT?: any;
  AccuracyOfOperatingPotentialCBCT?: any;
  OutputConsistencyForCBCT?: any;
  LinearityOfMaLoadingCBCT?: any;
  RadiationLeakageTestCBCT?: any;
  RadiationProtectionSurveyCBCT?: any;
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

const ViewServiceReportCBCT: React.FC = () => {
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
        const response = await getReportHeaderForCBCT(serviceId);

        if (response?.exists && response.data) {
          const data = response.data;

          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Dental Cone Beam CT (CBCT)",
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

          setTestData({
            irradiationTime: data.AccuracyOfIrradiationTimeCBCT || null,
            operatingPotential: data.AccuracyOfOperatingPotentialCBCT || null,
            outputConsistency: data.OutputConsistencyForCBCT || null,
            linearityOfMaLoading: data.LinearityOfMaLoadingCBCT || null,
            radiationLeakage: data.RadiationLeakageTestCBCT || null,
            radiationSurvey: data.RadiationProtectionSurveyCBCT || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load CBCT report:", err);
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

      pdf.save(`CBCT-Report-${report?.testReportNumber || "report"}.pdf`);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading CBCT Report...</div>;

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please save the CBCT report header first.</p>
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
              QA TEST REPORT FOR DENTAL CONE BEAM CT (CBCT)
            </h1>
            <p className="text-center italic text-sm mb-10">
              (Periodic Quality Assurance as per AERB Guidelines)
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
              <h2 className="font-bold text-lg mb-3">3. Equipment Details</h2>
              <table className="w-full border-2 border-gray-600 text-sm">
                <tbody>
                  {[
                    ["Nomenclature", report.nomenclature],
                    ["Make", report.make],
                    ["Model", report.model],
                    ["Serial No.", report.slNumber],
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
        <div className="print:break-before-page"></div>

        {/* PAGE 2+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.irradiationTime?.irradiationTimes?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">1. Accuracy of Irradiation Time</h3>
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <p className="font-semibold">Test Conditions:</p>
                  <p className="text-sm">
                    FCD: {testData.irradiationTime.testConditions?.fcd} cm | kV: {testData.irradiationTime.testConditions?.kv} | mA: {testData.irradiationTime.testConditions?.ma}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">Set Time (s)</th>
                        <th className="border border-black p-3">Measured Time (s)</th>
                        <th className="border border-black p-3">% Deviation</th>
                        <th className="border border-black p-3 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.irradiationTime.irradiationTimes.map((row: any, i: number) => {
                        const deviation = row.setTime && row.measuredTime
                          ? ((Math.abs(row.measuredTime - row.setTime) / row.setTime) * 100).toFixed(1)
                          : "N/A";
                        const pass = deviation !== "N/A" && Number(deviation) <= 5;
                        return (
                          <tr key={i} className="text-center">
                            <td className="border p-3 font-semibold">{row.setTime}</td>
                            <td className="border p-3">{row.measuredTime}</td>
                            <td className="border p-3">{deviation}%</td>
                            <td className="border p-3">±5%</td>
                            <td className="border p-3 font-bold">
                              <span className={pass ? "text-green-600" : "text-red-600"}>{pass ? "PASS" : "FAIL"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 2. Accuracy of Operating Potential */}
            {testData.operatingPotential?.measurements?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">2. Accuracy of Operating Potential (kVp)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">Applied kVp</th>
                        {testData.operatingPotential.mAStations?.map((s: string) => (
                          <th key={s} className="border border-black p-3">{s}</th>
                        ))}
                        <th className="border border-black p-3 bg-blue-100">Average kVp</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.operatingPotential.measurements.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3 font-semibold">{row.appliedKvp}</td>
                          {row.measuredValues.map((val: string, idx: number) => (
                            <td key={idx} className="border p-3">{val}</td>
                          ))}
                          <td className="border p-3 font-bold bg-blue-50">{row.averageKvp}</td>
                          <td className="border p-3 font-bold">
                            <span className={row.remarks === "PASS" ? "text-green-600" : "text-red-600"}>{row.remarks}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Output Consistency */}
            {testData.outputConsistency?.outputRows?.length > 0 && (
              <div className="mb-16 print:mb-12">
                <h3 className="text-xl font-bold mb-6">3. Output Consistency</h3>
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <p className="font-semibold">Test Conditions:</p>
                  <p className="text-sm">FFD: {testData.outputConsistency.ffd} cm</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">kVp</th>
                        <th className="border border-black p-3">mAs</th>
                        {testData.outputConsistency.measurementHeaders?.map((h: string) => (
                          <th key={h} className="border border-black p-3">{h}</th>
                        ))}
                        <th className="border border-black p-3 bg-blue-100">Mean</th>
                        <th className="border border-black p-3 bg-yellow-100">COV</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3 font-semibold">{row.kvp}</td>
                          <td className="border p-3">{row.mas}</td>
                          {row.outputs.map((val: string, idx: number) => (
                            <td key={idx} className="border p-3">{val}</td>
                          ))}
                          <td className="border p-3 font-bold bg-blue-50">{row.mean}</td>
                          <td className="border p-3 font-bold bg-yellow-50">{row.cov}</td>
                          <td className="border p-3 font-bold">
                            <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>{row.remarks}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.table2?.length > 0 && (
              <div className="mb-16 print:mb-12">
                <h3 className="text-xl font-bold mb-6">4. Linearity of mA Loading</h3>
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <p className="font-semibold">Test Conditions:</p>
                  <p className="text-sm">
                    FCD: {testData.linearityOfMaLoading.table1?.fcd} cm | kV: {testData.linearityOfMaLoading.table1?.kv} | Time: {testData.linearityOfMaLoading.table1?.time} s
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">mA</th>
                        <th className="border border-black p-3">Meas 1</th>
                        <th className="border border-black p-3">Meas 2</th>
                        <th className="border border-black p-3">Meas 3</th>
                        <th className="border border-black p-3 bg-blue-100">Average</th>
                        <th className="border border-black p-3 bg-yellow-100">Coefficient of Linearity</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMaLoading.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3 font-semibold">{row.ma}</td>
                          {row.measuredOutputs.map((val: string, idx: number) => (
                            <td key={idx} className="border p-3">{val}</td>
                          ))}
                          <td className="border p-3 font-bold bg-blue-50">{row.average}</td>
                          <td className="border p-3 font-bold bg-yellow-50">{row.col}</td>
                          <td className="border p-3 font-bold">
                            <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
                              {row.remarks}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Radiation Leakage Test */}
            {testData.radiationLeakage && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">5. Radiation Leakage Test</h3>
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <p className="font-semibold">Test Parameters:</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p><strong>Applied kV:</strong> {testData.radiationLeakage.appliedVoltage}</p>
                    <p><strong>Applied mA:</strong> {testData.radiationLeakage.appliedCurrent}</p>
                    <p><strong>Exposure Time:</strong> {testData.radiationLeakage.exposureTime} s</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">Location</th>
                        <th className="border border-black p-3">Measured Leakage (mR/hr)</th>
                        <th className="border border-black p-3 bg-green-100">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationLeakage.locations?.map((loc: any, i: number) => (
                        <tr key={i}>
                          <td className="border p-3">{loc.location}</td>
                          <td className="border p-3 text-center">{loc.mRPerHr || "-"}</td>
                          <td className="border p-3 text-center font-bold">
                            <span className={Number(loc.mRPerHr || 0) <= 100 ? "text-green-600" : "text-red-600"}>
                              {Number(loc.mRPerHr || 0) <= 100 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-400 rounded">
                  <p className="font-medium">
                    AERB Limit: Maximum leakage radiation ≤ 1 mGy (114 mR) in one hour at 1 meter from focus.
                  </p>
                </div>
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationSurvey && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold mb-6">6. Radiation Protection Survey</h3>
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <p className="font-semibold">Survey Details:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <p><strong>Survey Date:</strong> {formatDate(testData.radiationSurvey.surveyDate)}</p>
                    <p><strong>Workload:</strong> {testData.radiationSurvey.workload} mA-min/week</p>
                    <p><strong>Calibration Valid:</strong> {testData.radiationSurvey.hasValidCalibration}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">Location</th>
                        <th className="border border-black p-3">Measured (mR/hr)</th>
                        <th className="border border-black p-3">Weekly Dose (mR/week)</th>
                        <th className="border border-black p-3 bg-green-100">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationSurvey.locations?.map((loc: any, i: number) => (
                        <tr key={i}>
                          <td className="border p-3">{loc.location}</td>
                          <td className="border p-3 text-center">{loc.mRPerHr || "-"}</td>
                          <td className="border p-3 text-center">{loc.mRPerWeek || "-"}</td>
                          <td className="border p-3 text-center font-bold">
                            <span className={loc.result === "PASS" || loc.result?.toLowerCase().includes("safe") ? "text-green-600" : "text-red-600"}>
                              {loc.result || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32">
                No test results available yet.
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
          h1,h2,h3 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportCBCT;