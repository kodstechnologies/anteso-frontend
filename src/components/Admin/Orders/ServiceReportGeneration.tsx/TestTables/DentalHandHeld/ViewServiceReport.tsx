// src/components/reports/ViewServiceReportDentalHandHeld.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  getReportHeaderForDentalHandHeld,
  getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalHandHeld,
  getLinearityOfTimeByServiceIdForDentalHandHeld,
  getReproducibilityOfRadiationOutputByServiceIdForDentalHandHeld,
  getTubeHousingLeakageByServiceIdForDentalHandHeld
} from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MainTestTableForDentalHandHeld from "./MainTestTableForDentalHandHeld";

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
  AccuracyOfOperatingPotentialAndTimeDentalHandHeld?: any;
  LinearityOfTimeDentalHandHeld?: any;
  ReproducibilityOfRadiationOutputDentalHandHeld?: any;
  TubeHousingLeakageDentalHandHeld?: any;
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

const ViewServiceReportDentalHandHeld: React.FC = () => {
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
        
        // Fetch report header
        const response = await getReportHeaderForDentalHandHeld(serviceId);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            ...data,
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          // Fetch all test data separately
          const [
            accuracyTest,
            linearityTest,
            reproducibilityTest,
            leakageTest
          ] = await Promise.allSettled([
            getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalHandHeld(serviceId).catch(() => null),
            getLinearityOfTimeByServiceIdForDentalHandHeld(serviceId).catch(() => null),
            getReproducibilityOfRadiationOutputByServiceIdForDentalHandHeld(serviceId).catch(() => null),
            getTubeHousingLeakageByServiceIdForDentalHandHeld(serviceId).catch(() => null)
          ]);

          setTestData({
            accuracyOfOperatingPotentialAndTime: accuracyTest.status === 'fulfilled' && accuracyTest.value?.data ? accuracyTest.value.data : null,
            linearityOfTime: linearityTest.status === 'fulfilled' && linearityTest.value?.data ? linearityTest.value.data : null,
            reproducibilityOfRadiationOutput: reproducibilityTest.status === 'fulfilled' && reproducibilityTest.value?.data ? reproducibilityTest.value.data : null,
            tubeHousingLeakage: leakageTest.status === 'fulfilled' && leakageTest.value?.data ? leakageTest.value.data : null,
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

      pdf.save(`DentalHandHeld-Report-${report?.testReportNumber || "report"}.pdf`);
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
              QA TEST REPORT FOR DENTAL HAND-HELD X-RAY EQUIPMENT
            </h1>
            <p className="text-center italic text-sm mb-10">
              (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
            </p>

            {/* Customer & Reference */}
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
              <div className="border-2 border-gray-600 p-5 text-lg">
                <p><strong>Customer:</strong> {report.customerName}</p>
                <p><strong>Address:</strong> {report.address}</p>
              </div>
            </section>

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
            <MainTestTableForDentalHandHeld testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential and Time */}
            {testData.accuracyOfOperatingPotentialAndTime?.rows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">1. Accuracy of Operating Potential (kVp) and Irradiation Time</h3>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">Applied kVp</th>
                        <th className="border border-black p-3">Set Time (s)</th>
                        <th className="border border-black p-3">mA Station 1 - kVp</th>
                        <th className="border border-black p-3">mA Station 1 - Time</th>
                        <th className="border border-black p-3">mA Station 2 - kVp</th>
                        <th className="border border-black p-3">mA Station 2 - Time</th>
                        <th className="border border-black p-3">Avg kVp</th>
                        <th className="border border-black p-3">Avg Time (s)</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotentialAndTime?.rows?.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3">{row.appliedKvp || row.appliedkVp || "-"}</td>
                          <td className="border p-3">{row.setTime || "-"}</td>
                          <td className="border p-3">{row.maStation1?.kvp || "-"}</td>
                          <td className="border p-3">{row.maStation1?.time || "-"}</td>
                          <td className="border p-3">{row.maStation2?.kvp || "-"}</td>
                          <td className="border p-3">{row.maStation2?.time || "-"}</td>
                          <td className="border p-3 font-semibold">{row.avgKvp || "-"}</td>
                          <td className="border p-3 font-semibold">{row.avgTime || "-"}</td>
                          <td className="border p-3 font-bold">
                            <span className={row.remark === "PASS" ? "text-green-600" : row.remark === "FAIL" ? "text-red-600" : "text-gray-600"}>
                              {row.remark || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tolerances */}
                <div className="bg-gray-50 p-4 rounded border mb-4">
                  <p className="text-sm">
                    <strong>kVp Tolerance:</strong> {testData.accuracyOfOperatingPotentialAndTime?.kvpToleranceSign || "±"} {testData.accuracyOfOperatingPotentialAndTime?.kvpToleranceValue || "5"} kV
                  </p>
                  <p className="text-sm">
                    <strong>Time Tolerance:</strong> {testData.accuracyOfOperatingPotentialAndTime?.timeToleranceSign || "±"} {testData.accuracyOfOperatingPotentialAndTime?.timeToleranceValue || "10"}%
                  </p>
                </div>

                {/* Total Filtration */}
                {testData.accuracyOfOperatingPotentialAndTime?.totalFiltration && (
                  <div className="bg-gray-50 p-4 rounded border mb-4">
                    <p className="text-sm">
                      <strong>Total Filtration:</strong> At {testData.accuracyOfOperatingPotentialAndTime.totalFiltration?.atKvp || "-"} kVp, 
                      Measured: {testData.accuracyOfOperatingPotentialAndTime.totalFiltration?.measured1 || "-"} mm Al and 
                      {testData.accuracyOfOperatingPotentialAndTime.totalFiltration?.measured2 || "-"} mm Al
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Linearity of Time */}
            {testData.linearityOfTime?.table2?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">2. Linearity of Time</h3>

                {/* Test Conditions */}
                {testData.linearityOfTime?.table1 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Test Conditions:</p>
                    <div className="text-sm">
                      <span className="font-medium">FCD:</span> {testData.linearityOfTime.table1?.fcd || "-"} cm,{' '}
                      <span className="font-medium">kV:</span> {testData.linearityOfTime.table1?.kv || "-"},{' '}
                      <span className="font-medium">mA:</span> {testData.linearityOfTime.table1?.ma || "-"}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3">Time (sec)</th>
                        <th className="border border-black p-3">Avg Output</th>
                        <th className="border border-black p-3">X (mGy/sec)</th>
                        <th className="border border-black p-3">X MAX</th>
                        <th className="border border-black p-3">X MIN</th>
                        <th className="border border-black p-3">CoL</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime?.table2?.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3 font-semibold">{row.time || "-"}</td>
                          <td className="border p-3">{row.average || "-"}</td>
                          <td className="border p-3">{row.x || "-"}</td>
                          <td className="border p-3">{row.xMax || "-"}</td>
                          <td className="border p-3">{row.xMin || "-"}</td>
                          <td className="border p-3 font-semibold">{row.col || "-"}</td>
                          <td className="border p-3 font-bold">
                            <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : "text-gray-600"}>
                              {row.remarks || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 rounded border mt-4">
                  <p className="text-sm">
                    <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfTime?.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfRadiationOutput?.outputRows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">3. Reproducibility of Radiation Output</h3>

                <div className="overflow-x-auto">
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
                      {testData.reproducibilityOfRadiationOutput?.outputRows?.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3 font-semibold">{row.kv || "-"}</td>
                          <td className="border p-3">{row.mas || "-"}</td>
                          <td className="border p-3 font-semibold">{row.avg || "-"}</td>
                          <td className="border p-3 font-bold">
                            <span className={row.remark?.includes("Pass") ? "text-green-600" : row.remark?.includes("Fail") ? "text-red-600" : "text-gray-600"}>
                              {row.remark || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 rounded border mt-4">
                  <p className="text-sm">
                    <strong>Acceptance Criteria:</strong> CV {testData.reproducibilityOfRadiationOutput?.tolerance?.operator || "<="} {testData.reproducibilityOfRadiationOutput?.tolerance?.value || "5.0"}%
                  </p>
                </div>
              </div>
            )}

            {/* 4. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">4. Radiation Leakage from Tube Housing</h3>

                {/* Test Settings */}
                {testData.tubeHousingLeakage?.measurementSettings && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Test Conditions:</p>
                    <div className="text-sm grid grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium">Distance:</span> {testData.tubeHousingLeakage.measurementSettings?.distance || "-"} cm
                      </div>
                      <div>
                        <span className="font-medium">kV:</span> {testData.tubeHousingLeakage.measurementSettings?.kv || "-"}
                      </div>
                      <div>
                        <span className="font-medium">mA:</span> {testData.tubeHousingLeakage.measurementSettings?.ma || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {testData.tubeHousingLeakage.measurementSettings?.time || "-"} sec
                      </div>
                    </div>
                  </div>
                )}

                {/* Leakage Measurements */}
                {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (
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
                          <th className="border border-black p-3">Max</th>
                          <th className="border border-black p-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.tubeHousingLeakage?.leakageMeasurements?.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border p-3">{row.location || "-"}</td>
                            <td className="border p-3">{row.front || "-"}</td>
                            <td className="border p-3">{row.back || "-"}</td>
                            <td className="border p-3">{row.left || "-"}</td>
                            <td className="border p-3">{row.right || "-"}</td>
                            <td className="border p-3">{row.top || "-"}</td>
                            <td className="border p-3 font-semibold">{row.max || "-"}</td>
                            <td className="border p-3">{row.unit || "mGy/h"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Final Results */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Workload:</p>
                      <p className="text-lg">
                        {testData.tubeHousingLeakage?.workload?.value || "-"} {testData.tubeHousingLeakage?.workload?.unit || "mA·min/week"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Maximum Radiation Leakage:</p>
                      <p className="text-lg font-bold">
                        {testData.tubeHousingLeakage?.calculatedResult?.finalLeakageRate || 
                          (() => {
                            const leakageMeasurements = testData.tubeHousingLeakage?.leakageMeasurements || [];
                            if (leakageMeasurements.length === 0) return "-";
                            const maxLeakage = Math.max(...leakageMeasurements.map((r: any) => parseFloat(r.max) || 0));
                            const workload = parseFloat(testData.tubeHousingLeakage?.workload?.value || "0") || 0;
                            if (workload > 0 && maxLeakage > 0) {
                              const result = ((workload * maxLeakage) / (60 * 100)) / 114;
                              return result.toFixed(3);
                            }
                            return "-";
                          })()} mGy/h
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm">
                      <strong>Tolerance:</strong> {testData.tubeHousingLeakage?.tolerance?.value || "1.0"} mGy/h {testData.tubeHousingLeakage?.tolerance?.operator === "less than or equal to" ? "≤" : testData.tubeHousingLeakage?.tolerance?.operator === "greater than or equal to" ? "≥" : "="} in {testData.tubeHousingLeakage?.tolerance?.time || "1"} hr
                    </p>
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

export default ViewServiceReportDentalHandHeld;
