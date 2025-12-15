// src/components/reports/ViewServiceReportBMD.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForBMD } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForBMD from "./MainTestTableForBMD";
// Removed individual test API imports as we are now using aggregated header


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
  category?: string;
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

const ViewServiceReportBMD: React.FC = () => {
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
        // Fetch report header and all test data in one call
        const response = await getReportHeaderForBMD(serviceId);

        if (response?.exists && response.data) {
          const data = response.data;

          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "BMD/DEXA",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            category: data.category || "-",
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

          // Set test data directly from the aggregated response
          // Assuming the backend follows the convention of embedding test/model names keys

          // Transform Tube Housing Leakage data
          let transformedTubeHousingLeakage = null;
          if (data.tubeHousingLeakage) {
            const rawLeakage = data.tubeHousingLeakage;

            // Map leakageMeasurements to leakageRows
            const leakageRows = rawLeakage.leakageMeasurements?.map((m: any) => ({
              location: m.location || "Tube Housing",
              left: m.left || "-",
              right: m.right || "-",
              top: m.top || m.front || "-", // Map front to top/front column
              up: m.up || m.back || "-",    // Map back to up/back column
              max: m.max || "-",
              unit: m.unit || "mGy/h",
              remark: rawLeakage.calculatedResult?.remark || "-",
            })) || [];

            // Calculate mAs if not present, from settings
            const ma = rawLeakage.measurementSettings?.ma || "";
            const time = rawLeakage.measurementSettings?.time || "";
            const mas = (parseFloat(ma) && parseFloat(time))
              ? (parseFloat(ma) * parseFloat(time)).toFixed(2)
              : "-";

            transformedTubeHousingLeakage = {
              ...rawLeakage,
              leakageRows,
              kvp: rawLeakage.measurementSettings?.kv || "-",
              mas: mas,
              // Handle workload object -> string
              workload: rawLeakage.workload?.value || "-",
              // Handle calculated result object -> string
              calculatedResult: rawLeakage.calculatedResult?.finalLeakageRate || rawLeakage.calculatedResult?.maxLeakageIntermediate || "-",
              toleranceValue: rawLeakage.tolerance?.value || "1",
              toleranceTime: rawLeakage.tolerance?.time || "1",
            };
          }

          // Transform Linearity of mA Loading data
          let transformedLinearityOfMaLoading = null;
          if (data.linearityOfMaLoading) {
            const rawLin = data.linearityOfMaLoading;
            transformedLinearityOfMaLoading = {
              ...rawLin,
              rows: rawLin.table2?.map((r: any) => ({
                ma: r.ma || "-",
                measuredOutputs: r.measuredOutputs || [],
                average: r.average || "-",
                x_bar: r.x || "-",
                coefficient: r.col || "-",
                remark: r.remarks || "-",
              })) || [],
            };
          }

          // Transform Reproducibility data
          let transformedReproducibility = null;
          if (data.reproducibilityOfRadiationOutput && data.reproducibilityOfRadiationOutput.outputRows?.length > 0) {
            const rawRepro = data.reproducibilityOfRadiationOutput;
            const row = rawRepro.outputRows[0];
            const measurements = row.outputs?.map((o: any) => parseFloat(o.value) || 0) || [];

            // Calculate stats
            const n = measurements.length;
            const sum = measurements.reduce((a: number, b: number) => a + b, 0);
            const mean = n > 0 ? sum / n : 0;

            let variance = 0;
            if (n > 1) {
              const sumDiffSq = measurements.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0);
              variance = sumDiffSq / (n - 1);
            }
            const stdDev = Math.sqrt(variance);
            const cov = mean > 0 ? (stdDev / mean) : 0;

            transformedReproducibility = {
              ...rawRepro,
              kv: row.kv || "-",
              ma: row.mas || "-",
              time: "",
              measurements: row.outputs?.map((o: any) => ({ measured: o.value })) || [],
              mean: mean.toFixed(4),
              cov: cov.toFixed(4),
              result: row.remark || "-",
            };
          }

          setTestData({
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotential || null,
            reproducibilityOfRadiationOutput: transformedReproducibility,
            linearityOfMaLoading: transformedLinearityOfMaLoading,
            tubeHousingLeakage: transformedTubeHousingLeakage,
            radiationProtectionSurvey: data.radiationProtectionSurvey || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load BMD report:", err);
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
        filename: `BMD-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading report...</div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Report not found</div>
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
              QA TEST REPORT FOR BMD/DEXA
            </h1>
          <p className="text-center italic text-sm mb-6">
              (Periodic Quality Assurance as per AERB Guidelines)
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

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>

            <MainTestTableForBMD testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential and Time */}
            {testData.accuracyOfOperatingPotential?.rows?.length > 0 && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">1. ACCURACY OF OPERATING POTENTIAL (KVP) AND IRRADIATION TIME</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 text-left">Applied kVp</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Set Time (s)</th>

                        {(testData.accuracyOfOperatingPotential.mAStations || ["mA Station 1", "mA Station 2"]).map((station: string, idx: number) => (
                          <th key={idx} colSpan={2} className="border border-black p-2 text-center">{station}</th>
                        ))}

                        <th rowSpan={2} className="border border-black p-2 text-center">Avg kVp</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Avg Time</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                      <tr>
                        {(testData.accuracyOfOperatingPotential.mAStations || ["mA Station 1", "mA Station 2"]).map((_: any, idx: number) => (
                          <React.Fragment key={idx}>
                            <th className="border border-black p-1 text-xs text-center">kVp</th>
                            <th className="border border-black p-1 text-xs text-center">Time</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.rows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.appliedKvp || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.setTime || "-"}</td>

                          {(testData.accuracyOfOperatingPotential.mAStations || ["Station 1", "Station 2"]).map((_: any, idx: number) => {
                            // Handle legacy structure where measuredValues might not be array or fallback to maStation1/2
                            let mVal = { kvp: "-", time: "-" };
                            if (Array.isArray(row.measuredValues) && row.measuredValues[idx]) {
                              mVal = row.measuredValues[idx];
                            } else if (idx === 0 && row.maStation1) {
                              mVal = row.maStation1;
                            } else if (idx === 1 && row.maStation2) {
                              mVal = row.maStation2;
                            }
                            return (
                              <React.Fragment key={idx}>
                                <td className="border border-black p-2 text-center">{mVal.kvp || "-"}</td>
                                <td className="border border-black p-2 text-center">{mVal.time || "-"}</td>
                              </React.Fragment>
                            );
                          })}

                          <td className="border border-black p-2 text-center">{row.avgKvp || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.avgTime || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <p className="text-sm">kVp Tolerance : {testData.accuracyOfOperatingPotential.kvpToleranceSign || "±"} {testData.accuracyOfOperatingPotential.kvpToleranceValue || "5"} kV</p>
                  <p className="text-sm">Time Tolerance : {testData.accuracyOfOperatingPotential.timeToleranceSign || "±"} {testData.accuracyOfOperatingPotential.timeToleranceValue || "10"} %</p>
                </div>

                {/* Total Filtration Display */}
                {testData.accuracyOfOperatingPotential.totalFiltration && (
                  <div className="mt-2 text-sm">
                    <p>
                      Total Filtration is {testData.accuracyOfOperatingPotential.totalFiltration.measured1 || "-"} and {testData.accuracyOfOperatingPotential.totalFiltration.measured2 || "-"} mm Al (at {testData.accuracyOfOperatingPotential.totalFiltration.atKvp || "-"} kVp)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfRadiationOutput?.measurements?.length > 0 && (
              <div className="mb-16 print:mb-12">
                <h3 className="text-xl font-bold uppercase mb-4">2. REPRODUCIBILITY OF RADIATION OUTPUT (mGy)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-center">KV</th>
                        <th className="border border-black p-2 text-center">mAs</th>
                        {testData.reproducibilityOfRadiationOutput.measurements.map((_: any, i: number) => (
                          <th key={i} className="border border-black p-2 text-center">Meas {i + 1}</th>
                        ))}
                        <th className="border border-black p-2 text-center">Average (X̄)</th>
                        <th className="border border-black p-2 text-center">CoV</th>
                        <th className="border border-black p-2 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-center">{testData.reproducibilityOfRadiationOutput.kv || "-"}</td>
                        <td className="border border-black p-2 text-center">{testData.reproducibilityOfRadiationOutput.ma || "-"}</td>
                        {testData.reproducibilityOfRadiationOutput.measurements.map((m: any, i: number) => (
                          <td key={i} className="border border-black p-2 text-center">{m.measured || "-"}</td>
                        ))}
                        <td className="border border-black p-2 text-center">{testData.reproducibilityOfRadiationOutput.mean || "-"}</td>
                        <td className="border border-black p-2 text-center">{testData.reproducibilityOfRadiationOutput.cov || "-"}</td>
                        <td className="border border-black p-2 text-center">{testData.reproducibilityOfRadiationOutput.result || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Tolerance : CoV ≤ {testData.reproducibilityOfRadiationOutput.tolerance?.value || "0.05"}</p>
                </div>
              </div>
            )}

            {/* 3. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.rows?.length > 0 && (
              <div className="mb-16 print:mb-12">
                <h3 className="text-xl font-bold uppercase mb-4">3. LINEARITY OF MA LOADING</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">mA Station</th>
                        {Array.isArray(testData.linearityOfMaLoading.rows[0]?.measuredOutputs) && testData.linearityOfMaLoading.rows[0].measuredOutputs.map((_: any, idx: number) => (
                          <th key={idx} className="border border-black p-2 text-center">Meas {idx + 1}</th>
                        ))}
                        <th className="border border-black p-2 text-center">Average (X̄) mGy</th>
                        <th className="border border-black p-2 text-center">mGy/mAs (X̄)</th>
                        <th className="border border-black p-2 text-center">Coefficient of Linearity</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMaLoading.rows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.ma || "-"}</td>
                          {Array.isArray(row.measuredOutputs) && row.measuredOutputs.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 text-center">{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 text-center">{row.average || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.x_bar || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.coefficient || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Tolerance : Coefficient of Linearity ≤ {testData.linearityOfMaLoading.tolerance || "0.1"}</p>
                </div>
              </div>
            )}

            {/* 4. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageRows?.length > 0 && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">4. RADIATION LEAKAGE LEVEL AT 1M FROM TUBE HOUSING</h3>
                {/* Operating Parameters */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">kVp</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.tubeHousingLeakage.kvp || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mAs</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.tubeHousingLeakage.mas || "-"}</td>
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
                        <th className="border border-black p-2 text-center">Top/Front</th>
                        <th className="border border-black p-2 text-center">Up/Back</th>
                        <th className="border border-black p-2 text-center">Max</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.tubeHousingLeakage.leakageRows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.location || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.left || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.right || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.top || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.up || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.max || "-"} {row.unit || "mGy/h"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">
                    Tolerance : Max leakage ≤ {testData.tubeHousingLeakage.toleranceValue || "1"} mGy/h in {testData.tubeHousingLeakage.toleranceTime || "1"} hour
                  </p>
                </div>

                {/* Max Leakage Calculation */}
                {testData.tubeHousingLeakage.workload && testData.tubeHousingLeakage.mas && (
                  <div className="mt-6 bg-gray-50 p-4 rounded">
                    <h4 className="text-sm font-semibold mb-3">Max Leakage Calculation</h4>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium">{testData.tubeHousingLeakage.workload || "—"}</span>
                      <span>×</span>
                      <span className="font-medium">
                        {Math.max(...testData.tubeHousingLeakage.leakageRows.map((r: any) => parseFloat(r.max) || 0)).toFixed(3) || "—"}
                      </span>
                      <span>÷</span>
                      <span className="font-medium">60</span>
                      <span>×</span>
                      <span className="font-medium">{testData.tubeHousingLeakage.mas || "—"}</span>
                      <span>=</span>
                      <span className="font-medium">{testData.tubeHousingLeakage.calculatedResult || "—"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey?.locations?.length > 0 && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid">
                <h3 className="text-xl font-bold uppercase mb-4">5. RADIATION PROTECTION SURVEY</h3>

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
                          <td className="border border-black p-2 text-left">{formatDate(testData.radiationProtectionSurvey.surveyDate) || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtectionSurvey.workload || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtectionSurvey.calibrationCertificateValid || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Measured Maximum Radiation Levels */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 text-left">Location</th>
                          <th className="border border-black p-3 text-center">Max. Radiation Level</th>
                          <th className="border border-black p-3 text-center">Result</th>
                          <th className="border border-black p-3 text-center">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 text-left">{loc.location || "-"}</td>
                            <td className="border border-black p-3 text-center">{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td className="border border-black p-3 text-center">{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td className="border border-black p-3 text-center">
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
                {(() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");

                  const maxWorkerWeekly = workerLocs.length > 0
                    ? Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0)).toFixed(3)
                    : "0.000";

                  const maxPublicWeekly = publicLocs.length > 0
                    ? Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0)).toFixed(3)
                    : "0.000";

                  const workerResult = parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : "Fail";
                  const publicResult = parseFloat(maxPublicWeekly) <= 2 ? "Pass" : "Fail";

                  return (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4">5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full border-2 border-black text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-3 text-center">Category</th>
                              <th className="border border-black p-3 text-center">Result</th>
                              <th className="border border-black p-3 text-center">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center">
                              <td className="border border-black p-3 font-semibold">For Radiation Worker</td>
                              <td className="border border-black p-3">{maxWorkerWeekly} mR/week</td>
                              <td className="border border-black p-3">
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                  {workerResult}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center">
                              <td className="border border-black p-3 font-semibold">For Public</td>
                              <td className="border border-black p-3">{maxPublicWeekly} mR/week</td>
                              <td className="border border-black p-3">
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                  {publicResult}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
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

export default ViewServiceReportBMD;
