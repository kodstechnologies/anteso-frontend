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
import { generatePDF } from "../../../../../../utils/generatePDF";
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
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `DentalHandHeld-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
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
            QA TEST REPORT FOR DENTAL HAND-HELD X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6">
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer & Reference */}
          <section className="mb-4">
            <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
            <div className="border-2 border-gray-600 p-5 text-lg">
              <p><strong>Customer:</strong> {report.customerName}</p>
              <p><strong>Address:</strong> {report.address}</p>
            </div>
          </section>

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

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForDentalHandHeld testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential and Time */}
            {testData.accuracyOfOperatingPotentialAndTime?.rows?.length > 0 && (() => {
              // Calculate maxStations: find the maximum number of stations across all rows
              const maxStations = Math.max(
                ...testData.accuracyOfOperatingPotentialAndTime.rows.map((row: any) => {
                  if (row.maStations && Array.isArray(row.maStations)) {
                    return row.maStations.length;
                  } else if (row.maStation1 || row.maStation2) {
                    return 2; // Legacy format has 2 stations
                  }
                  return 0;
                }),
                2 // Default to at least 2 stations
              );

              return (
                <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                  <h3 className="text-xl font-bold mb-6">1. Accuracy of Operating Potential (kVp) and Irradiation Time</h3>

                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-2 border-black text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th rowSpan={2} className="border border-black p-3 bg-transparent print:bg-transparent">Applied kVp</th>
                            <th rowSpan={2} className="border border-black p-3 bg-transparent print:bg-transparent">Set Time (s)</th>
                            <th colSpan={maxStations * 2} className="border border-black p-3 text-center bg-transparent print:bg-transparent">Measured Values at mA Stations</th>
                            <th rowSpan={2} className="border border-black p-3 bg-blue-100">Avg kVp</th>
                            <th rowSpan={2} className="border border-black p-3 bg-blue-100">Avg Time (s)</th>
                            <th rowSpan={2} className="border border-black p-3 bg-green-100">Remarks</th>
                          </tr>
                          <tr>
                            {Array.from({ length: maxStations }).map((_, idx) => (
                              <React.Fragment key={idx}>
                                <th className="border border-black p-2 bg-transparent print:bg-transparent">mA Station {idx + 1} - kVp</th>
                                <th className="border border-black p-2 bg-transparent print:bg-transparent">mA Station {idx + 1} - Time</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testData.accuracyOfOperatingPotentialAndTime.rows.map((row: any, i: number) => {
                            // Handle both new format (maStations array) and legacy format (maStation1/maStation2)
                            let stations: any[] = [];
                            if (row.maStations && Array.isArray(row.maStations) && row.maStations.length > 0) {
                              // New format: use maStations array
                              stations = row.maStations;
                            } else if (row.maStation1 || row.maStation2) {
                              // Legacy format: convert to array
                              stations = [
                                row.maStation1 || { kvp: "", time: "" },
                                row.maStation2 || { kvp: "", time: "" },
                              ];
                            } else {
                              // No stations found, create empty array
                              stations = [];
                            }
                            // Pad with empty stations if needed
                            while (stations.length < maxStations) {
                              stations.push({ kvp: "", time: "" });
                            }
                          
                          // Debug: log the row data
                          if (i === 0) {
                            console.log("Row data:", row);
                            console.log("Stations:", stations);
                          }

                          return (
                            <tr key={i} className="text-center">
                              <td className="border p-3 font-semibold bg-transparent print:bg-transparent">{row.appliedKvp || row.appliedkVp || "-"}</td>
                              <td className="border p-3 font-semibold bg-transparent print:bg-transparent">{row.setTime || "-"}</td>
                              {stations.map((station: any, stationIdx: number) => {
                                // Handle both object format {kvp: "", time: ""} and direct values
                                const kvpValue = typeof station === 'object' ? (station?.kvp || "") : "";
                                const timeValue = typeof station === 'object' ? (station?.time || "") : "";
                                return (
                                  <React.Fragment key={stationIdx}>
                                    <td className="border p-3 bg-transparent print:bg-transparent">{kvpValue || "-"}</td>
                                    <td className="border p-3 bg-transparent print:bg-transparent">{timeValue || "-"}</td>
                                  </React.Fragment>
                                );
                              })}
                              <td className="border p-3 font-bold bg-blue-50">{row.avgKvp || "-"}</td>
                              <td className="border p-3 font-bold bg-blue-50">{row.avgTime || "-"}</td>
                              <td className={`border p-3 font-bold ${
                                row.remark === "PASS" || row.remark === "Pass" ? "bg-green-100 text-green-800" : 
                                row.remark === "FAIL" || row.remark === "Fail" ? "bg-red-100 text-red-800" : 
                                "bg-transparent print:bg-transparent"
                              }`}>
                                {row.remark || "-"}
                              </td>
                            </tr>
                          );
                        })}
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
              );
            })()}

            {/* 2. Linearity of Time */}
            {testData.linearityOfTime?.table2?.length > 0 && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
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
                        <th className="border border-black p-3 bg-transparent print:bg-transparent">Time (sec)</th>
                        <th className="border border-black p-3 bg-transparent print:bg-transparent">Avg Output</th>
                        <th className="border border-black p-3 bg-transparent print:bg-transparent">X (mGy/sec)</th>
                        <th className="border border-black p-3 bg-transparent print:bg-transparent">X MAX</th>
                        <th className="border border-black p-3 bg-transparent print:bg-transparent">X MIN</th>
                        <th className="border border-black p-3 bg-transparent print:bg-transparent">CoL</th>
                        <th className="border border-black p-3 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime?.table2?.map((row: any, i: number) => {
                        // Recalculate X if missing
                        let x = row.x;
                        if (!x || x === "-" || x === "") {
                          const ma = parseFloat(testData.linearityOfTime.table1?.ma || "0");
                          const outputs = (row.measuredOutputs || []).map((v: string) => parseFloat(v)).filter((v: number) => !isNaN(v) && v > 0);
                          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : 0;
                          const time = parseFloat(row.time || "0");
                          const mAs = ma > 0 && time > 0 ? ma * time : 0;
                          x = avg > 0 && mAs > 0 ? (avg / mAs).toFixed(4) : "-";
                        }
                        
                        return (
                          <tr key={i} className="text-center">
                            <td className="border p-3 font-semibold bg-transparent print:bg-transparent">{row.time || "-"}</td>
                            <td className="border p-3 bg-transparent print:bg-transparent">{row.average || "-"}</td>
                            <td className="border p-3 bg-transparent print:bg-transparent">{x || "-"}</td>
                            {i === 0 && (
                              <>
                                <td rowSpan={testData.linearityOfTime.table2.length} className="border p-3 align-middle bg-transparent print:bg-transparent">
                                  {testData.linearityOfTime.xMax || "-"}
                                </td>
                                <td rowSpan={testData.linearityOfTime.table2.length} className="border p-3 align-middle bg-transparent print:bg-transparent">
                                  {testData.linearityOfTime.xMin || "-"}
                                </td>
                                <td rowSpan={testData.linearityOfTime.table2.length} className="border p-3 font-semibold align-middle bg-transparent print:bg-transparent">
                                  {testData.linearityOfTime.col || "-"}
                                </td>
                                <td rowSpan={testData.linearityOfTime.table2.length} className={`border p-3 font-bold align-middle ${
                                  testData.linearityOfTime.remarks === "Pass" || testData.linearityOfTime.remarks === "PASS" ? "bg-green-100 text-green-800" : 
                                  testData.linearityOfTime.remarks === "Fail" || testData.linearityOfTime.remarks === "FAIL" ? "bg-red-100 text-red-800" : 
                                  "bg-transparent print:bg-transparent"
                                }`}>
                                  {testData.linearityOfTime.remarks || "-"}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
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
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">3. Reproducibility of Radiation Output</h3>

                {testData.reproducibilityOfRadiationOutput?.ffd && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>FFD:</strong> {testData.reproducibilityOfRadiationOutput.ffd} cm
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-3 bg-transparent print:bg-transparent">kV</th>
                        <th rowSpan={2} className="border border-black p-3 bg-transparent print:bg-transparent">mAs</th>
                        <th colSpan={testData.reproducibilityOfRadiationOutput?.outputRows?.[0]?.outputs?.length || 0} className="border border-black p-3 bg-transparent print:bg-transparent">
                          Radiation Output (mGy)
                        </th>
                        <th rowSpan={2} className="border border-black p-3 bg-blue-100">Avg (X̄)</th>
                        <th rowSpan={2} className="border border-black p-3 bg-green-100">CV % / Remark</th>
                      </tr>
                      <tr>
                        {testData.reproducibilityOfRadiationOutput?.outputRows?.[0]?.outputs?.map((_: any, idx: number) => (
                          <th key={idx} className="border border-black p-3 bg-transparent print:bg-transparent">Meas {idx + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.reproducibilityOfRadiationOutput?.outputRows?.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border p-3 font-semibold bg-transparent print:bg-transparent">{row.kv || "-"}</td>
                          <td className="border p-3 bg-transparent print:bg-transparent">{row.mas || "-"}</td>
                          {(row.outputs || []).map((output: any, idx: number) => (
                            <td key={idx} className="border p-3 bg-transparent print:bg-transparent">{output?.value || "-"}</td>
                          ))}
                          <td className="border p-3 font-semibold bg-blue-50">{row.avg || "-"}</td>
                          <td className={`border p-3 font-bold ${
                            row.remark?.includes("Pass") || row.remark?.includes("PASS") ? "bg-green-100 text-green-800" : 
                            row.remark?.includes("Fail") || row.remark?.includes("FAIL") ? "bg-red-100 text-red-800" : 
                            "bg-transparent print:bg-transparent"
                          }`}>
                            {row.remark || "-"}
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
            {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (() => {
              const leakageData = testData.tubeHousingLeakage;
              const settings = leakageData.measurementSettings || {};
              const maxLeakageResult = parseFloat(leakageData.calculatedResult?.maxLeakageIntermediate || '0');
              const maxLeakageResultMR = maxLeakageResult > 0 ? maxLeakageResult.toFixed(3) : '0';
              const finalLeakageRate = leakageData.calculatedResult?.finalLeakageRate || '0';
              const remark = leakageData.calculatedResult?.remark || '';
              const workloadInput = leakageData.workloadInput || '';
              const maxValue = Math.max(...(leakageData.leakageMeasurements || []).map((r: any) => parseFloat(r.max) || 0));
              
              return (
                <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                  <h3 className="text-xl font-bold mb-6">4. Tube Housing Leakage Radiation Test</h3>

                  {/* Operating Parameters */}
                  {settings && (
                    <div className="mb-6 bg-gray-50 p-4 rounded border">
                      <p className="font-semibold mb-3 text-base">Operating Parameters:</p>
                      <div className="text-sm grid grid-cols-4 gap-4">
                        <p><strong>Distance from the Focus (cm):</strong> {settings.distance || "-"}</p>
                        <p><strong>kVp:</strong> {settings.kv || "-"}</p>
                        <p><strong>mA:</strong> {settings.ma || "-"}</p>
                        <p><strong>Time (Sec):</strong> {settings.time || "-"}</p>
                      </div>
                    </div>
                  )}

                  {/* Exposure Level Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 text-left bg-transparent print:bg-transparent">Location (at 1.0 m from the focus)</th>
                          <th colSpan={5} className="border border-black p-3 text-center bg-transparent print:bg-transparent">Exposure Level (mR/hr)</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Result</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Remarks</th>
                        </tr>
                        <tr>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent"></th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Left</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Right</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Front</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Back</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent">Top</th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent"></th>
                          <th className="border border-black p-3 bg-transparent print:bg-transparent"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {leakageData.leakageMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 text-left bg-transparent print:bg-transparent">{row.location || "Tube"}</td>
                            <td className="border border-black p-3 bg-transparent print:bg-transparent">{row.left || "-"}</td>
                            <td className="border border-black p-3 bg-transparent print:bg-transparent">{row.right || "-"}</td>
                            <td className="border border-black p-3 bg-transparent print:bg-transparent">{row.front || "-"}</td>
                            <td className="border border-black p-3 bg-transparent print:bg-transparent">{row.back || "-"}</td>
                            <td className="border border-black p-3 bg-transparent print:bg-transparent">{row.top || "-"}</td>
                            <td className="border border-black p-3 font-semibold bg-transparent print:bg-transparent">{maxLeakageResultMR} mR in one hour</td>
                            <td className={`border border-black p-3 font-semibold ${
                              remark === "Pass" || remark === "PASS" ? "bg-green-100 text-green-800" : 
                              remark === "Fail" || remark === "FAIL" ? "bg-red-100 text-red-800" : 
                              "bg-transparent print:bg-transparent"
                            }`}>
                              {remark || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Work Load */}
                  {leakageData.workload && (
                    <div className="mb-6 bg-gray-50 p-4 rounded border">
                      <p className="font-semibold mb-2">Work Load:</p>
                      <p className="text-base">
                        Work Load: {leakageData.workload.value || "-"} {leakageData.workload.unit || "mA·min/week"}
                      </p>
                    </div>
                  )}

                  {/* Max Leakage Calculation */}
                  {workloadInput && settings.ma && settings.time && maxValue > 0 && (
                    <div className="mb-6 bg-gray-50 p-4 rounded border">
                      <p className="font-semibold mb-3">Max Leakage Calculation:</p>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>(</span>
                          <span className="font-medium">{workloadInput}</span>
                          <span>mAmin in 1 hr</span>
                          <span>X</span>
                          <span className="font-medium">{maxValue.toFixed(1)}</span>
                          <span>)</span>
                          <span>÷</span>
                          <span>(60</span>
                          <span>X</span>
                          <span className="font-medium">{settings.ma}</span>
                          <span>)</span>
                          <span>=</span>
                          <span className="font-semibold">{maxLeakageResultMR} mR in one hour</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          <p>max Exposure Level (mR/hr): {maxValue.toFixed(1)}</p>
                          <p>mA used for measurement: {settings.ma}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Maximum Radiation Leakage from Tube Housing */}
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Maximum Radiation Leakage from Tube Housing:</p>
                    <p className="text-lg font-semibold">
                      {finalLeakageRate || "0"} mGy in one hour
                    </p>
                  </div>

                  {/* Tolerance */}
                  {leakageData.tolerance && (
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="font-semibold mb-2">Tolerance:</p>
                      <p className="text-sm">
                        Maximum Leakage Radiation Level at 1 meter from the Focus should be{" "}
                        {leakageData.tolerance.operator === 'less than or equal to' ? '<' : 
                         leakageData.tolerance.operator === 'greater than or equal to' ? '>' : '='}{" "}
                        {leakageData.tolerance.value || "1"} mGy (114 mR) in one hour.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

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
