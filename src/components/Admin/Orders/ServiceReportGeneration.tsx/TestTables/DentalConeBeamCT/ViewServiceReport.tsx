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
import MainTestTableForDentalConeBeamCT from "./MainTestTableForDentalConeBeamCT";

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
  category?: string;

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

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-12 print:p-8">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <MainTestTableForDentalConeBeamCT testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.irradiationTime?.irradiationTimes?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">1. ACCURACY OF IRRADIATION TIME</h3>
                {/* Operating Parameters */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FCD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.irradiationTime.testConditions?.fcd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.irradiationTime.testConditions?.kv || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mA</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.irradiationTime.testConditions?.ma || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Set Time (Sec.)</th>
                        <th className="border border-black p-2 text-center">Measured Time</th>
                        <th className="border border-black p-2 text-center">% Error</th>
                        <th className="border border-black p-2 text-center">Tolerance</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.irradiationTime.irradiationTimes.map((row: any, i: number) => {
                        const deviation = row.setTime && row.measuredTime
                          ? ((Math.abs(row.measuredTime - row.setTime) / row.setTime) * 100).toFixed(2)
                          : "N/A";
                        const pass = deviation !== "N/A" && Number(deviation) <= 5;
                        const toleranceOperator = testData.irradiationTime.tolerance?.operator || "<=";
                        const toleranceValue = testData.irradiationTime.tolerance?.value || "5";
                        return (
                          <tr key={i}>
                            <td className="border border-black p-2 text-left">{row.setTime || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 text-center">{deviation !== "N/A" ? `${deviation}%` : "-"}</td>
                            <td className="border border-black p-2 text-center">{toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 text-center">{pass ? "PASS" : "FAIL"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 2. Accuracy of Operating Potential */}
            {testData.operatingPotential?.rows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">2. ACCURACY OF OPERATING POTENTIAL (KVP)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Applied kVp</th>
                        {testData.operatingPotential.mAStations?.map((s: string) => (
                          <th key={s} className="border border-black p-2 text-center">{s}</th>
                        ))}
                        <th className="border border-black p-2 text-center">Average kVp</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.operatingPotential.rows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.appliedKvp || "-"}</td>
                          {row.measuredValues?.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 text-center">{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 text-center">{row.averageKvp || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remarks || "-"}</td>
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
                <h3 className="text-xl font-bold uppercase mb-4">3. OUTPUT CONSISTENCY</h3>
                {/* Operating Parameters */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FFD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.outputConsistency.ffd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">-</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mA</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 text-left">Applied kV</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">mAs</th>
                        <th colSpan={testData.outputConsistency.measurementHeaders?.length || testData.outputConsistency.outputRows[0]?.outputs?.length || 3} className="border border-black p-2 text-center">
                          Radiation Output mGy
                        </th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Avg. (X)</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Coefficient of Variation CoV</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                      <tr>
                        {(testData.outputConsistency.measurementHeaders || 
                          Array.from({ length: testData.outputConsistency.outputRows[0]?.outputs?.length || 3 }, (_, i) => i + 1)
                        ).map((h: string | number, idx: number) => (
                          <th key={idx} className="border border-black p-1 text-center text-xs">
                            {typeof h === 'number' ? h : idx + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.kvp}</td>
                          <td className="border border-black p-2 text-center">{row.mas}</td>
                          {row.outputs.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 text-center">{val}</td>
                          ))}
                          <td className="border border-black p-2 text-center">{row.mean || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.cov || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="mt-4">
                  <p className="text-sm">Tolerance : CoV &lt; {testData.outputConsistency.tolerance || "0.05"}</p>
                </div>
              </div>
            )}

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.table2Rows?.length > 0 && (
              <div className="mb-16 print:mb-12">
                <h3 className="text-xl font-bold uppercase mb-4">4. LINEARITY OF MA LOADING</h3>
                {/* Operating Parameters */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FCD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.linearityOfMaLoading.table1?.fcd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.linearityOfMaLoading.table1?.kv || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">Time (s)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.linearityOfMaLoading.table1?.time || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">mA</th>
                        <th className="border border-black p-2 text-center">Meas 1</th>
                        <th className="border border-black p-2 text-center">Meas 2</th>
                        <th className="border border-black p-2 text-center">Meas 3</th>
                        <th className="border border-black p-2 text-center">Average</th>
                        <th className="border border-black p-2 text-center">Coefficient of Linearity</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMaLoading.table2Rows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.ma || "-"}</td>
                          {row.measuredOutputs?.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 text-center">{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 text-center">{row.average || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.col || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="mt-4">
                  <p className="text-sm">Tolerance : Coefficient of Linearity ≤ {testData.linearityOfMaLoading.tolerance || "0.1"}</p>
                </div>
              </div>
            )}

            {/* 5. Radiation Leakage Test */}
            {testData.radiationLeakage?.leakageRows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">5. RADIATION LEAKAGE TEST</h3>
                {/* Operating Parameters */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FFD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.radiationLeakage.settings?.[0]?.ffd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kVp</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.radiationLeakage.settings?.[0]?.kvp || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mA</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.radiationLeakage.settings?.[0]?.ma || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">Time (s)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.radiationLeakage.settings?.[0]?.time || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Location</th>
                        <th className="border border-black p-2 text-center">Left</th>
                        <th className="border border-black p-2 text-center">Right</th>
                        <th className="border border-black p-2 text-center">Top</th>
                        <th className="border border-black p-2 text-center">Up</th>
                        <th className="border border-black p-2 text-center">Down</th>
                        <th className="border border-black p-2 text-center">Max</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationLeakage.leakageRows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.location || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.left || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.right || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.top || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.up || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.down || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.max || "-"} {row.unit || "mGy/h"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="mt-4">
                  <p className="text-sm">
                    Tolerance : Maximum leakage radiation ≤ {testData.radiationLeakage.toleranceValue || "1"} mGy/h ({testData.radiationLeakage.toleranceTime || "1"} hour)
                  </p>
                </div>
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationSurvey?.locations?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">6. RADIATION PROTECTION SURVEY</h3>
                
                {/* Survey Details Table */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Survey Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-black text-sm">
                      <thead>
                        <tr>
                          <th className="border border-black p-2 text-left">Survey Date</th>
                          <th className="border border-black p-2 text-center">Applied Current (mA)</th>
                          <th className="border border-black p-2 text-center">Applied Voltage (kV)</th>
                          <th className="border border-black p-2 text-center">Exposure Time (s)</th>
                          <th className="border border-black p-2 text-center">Workload (mA·min/week)</th>
                          <th className="border border-black p-2 text-center">Valid Calibration Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 text-left">{formatDate(testData.radiationSurvey.surveyDate) || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationSurvey.appliedCurrent || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationSurvey.appliedVoltage || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationSurvey.exposureTime || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationSurvey.workload || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationSurvey.hasValidCalibration || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Location</th>
                        <th className="border border-black p-2 text-center">Max. Radiation Level (mR/hr)</th>
                        <th className="border border-black p-2 text-center">mR/week</th>
                        <th className="border border-black p-2 text-center">Result</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationSurvey.locations.map((loc: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{loc.location || "-"}</td>
                          <td className="border border-black p-2 text-center">{loc.mRPerHr || "-"}</td>
                          <td className="border border-black p-2 text-center">{loc.mRPerWeek || "-"}</td>
                          <td className="border border-black p-2 text-center">{loc.result || "-"}</td>
                          <td className="border border-black p-2 text-center">{loc.calculatedResult || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="mt-4">
                  <p className="text-sm">
                    Tolerance : For Radiation Worker ≤ 40 mR/week | For Public ≤ 2 mR/week
                  </p>
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