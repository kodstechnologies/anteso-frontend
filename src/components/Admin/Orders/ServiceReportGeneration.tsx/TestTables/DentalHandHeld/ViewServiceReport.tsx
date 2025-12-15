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
          <div className="flex justify-between items-center mb-4 print:mb-2">
            <img src={logoA} alt="NABL" className="h-28 print:h-20" />
            <div className="text-right">
              <table className="text-xs print:text-[7px] border border-black compact-table" style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px' }}>
                <tbody>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>SRF No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.srfNumber}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>SRF Date</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{formatDate(report.srfDate)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>ULR No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>TC9A43250001485F</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <img src={logo} alt="Logo" className="h-28 print:h-20" />
          </div>

          <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div>

          <h1 className="text-center text-2xl font-bold underline mb-4 print:mb-2 print:text-base" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR DENTAL HAND-HELD X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Customer</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.customerName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.address}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Reference */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Details of Equipment Under Test</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
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
                  <tr key={label} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tools Used */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">4. Standards / Tools Used</h2>
            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
              <table className="w-full border-2 border-black text-xs print:text-[8px] compact-table" style={{ tableLayout: 'fixed', width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '6%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sl No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '16%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Nomenclature</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make / Model</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Range</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Certificate No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
                    <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.nomenclature}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.make} / {tool.model}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="text-center py-2 print:py-1" style={{ padding: '0px 1px', fontSize: '11px' }}>No tools recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section className="mb-6 print:mb-3">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">5. Notes</h2>
            <div className="ml-8 text-sm print:text-[8px] print:ml-4" style={{ fontSize: '12px', lineHeight: '1.2' }}>
              {notesArray.map(n => (
                <p key={n.slNo} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              ))}
            </div>
          </section>

          {/* Signature */}
          <div className="flex justify-between items-end mt-8 print:mt-4">
            <img src={AntesoQRCode} alt="QR" className="h-24 print:h-16" />
            <div className="text-center">
              <img src={Signature} alt="Signature" className="h-20 print:h-16 mx-auto mb-2 print:mb-1" />
              <p className="font-bold print:text-xs">Authorized Signatory</p>
            </div>
          </div>

          <footer className="text-center text-xs print:text-[8px] text-gray-600 mt-6 print:mt-3">
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
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

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
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Operating Potential (kVp) and Irradiation Time</h3>

                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (s)</th>
                            <th colSpan={maxStations * 2} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Values at mA Stations</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-blue-100" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-blue-100" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg Time (s)</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-green-100" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                          <tr>
                            {Array.from({ length: maxStations }).map((_, idx) => (
                              <React.Fragment key={idx}>
                                <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA Station {idx + 1} - kVp</th>
                                <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA Station {idx + 1} - Time</th>
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

                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || row.appliedkVp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                              {stations.map((station: any, stationIdx: number) => {
                                // Handle both object format {kvp: "", time: ""} and direct values
                                const kvpValue = typeof station === 'object' ? (station?.kvp || "") : "";
                                const timeValue = typeof station === 'object' ? (station?.time || "") : "";
                                return (
                                  <React.Fragment key={stationIdx}>
                                    <td className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{kvpValue || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{timeValue || "-"}</td>
                                  </React.Fragment>
                                );
                              })}
                              <td className="border border-black p-2 print:p-1 font-bold text-center bg-blue-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 font-bold text-center bg-blue-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgTime || "-"}</td>
                              <td className={`border border-black p-2 print:p-1 font-bold text-center ${
                                row.remark === "PASS" || row.remark === "Pass" ? "bg-green-100 text-green-800" : 
                                row.remark === "FAIL" || row.remark === "Fail" ? "bg-red-100 text-red-800" : 
                                "bg-transparent print:bg-transparent"
                              }`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                {row.remark || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tolerances */}
                  <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>kVp Tolerance:</strong> {testData.accuracyOfOperatingPotentialAndTime?.kvpToleranceSign || "±"} {testData.accuracyOfOperatingPotentialAndTime?.kvpToleranceValue || "5"} kV
                    </p>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Time Tolerance:</strong> {testData.accuracyOfOperatingPotentialAndTime?.timeToleranceSign || "±"} {testData.accuracyOfOperatingPotentialAndTime?.timeToleranceValue || "10"}%
                    </p>
                  </div>

                  {/* Total Filtration */}
                  {testData.accuracyOfOperatingPotentialAndTime?.totalFiltration && (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
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
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Linearity of Time</h3>

                {/* Test Conditions */}
                {testData.linearityOfTime?.table1 && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      <span className="font-medium">FCD:</span> {testData.linearityOfTime.table1?.fcd || "-"} cm,{' '}
                      <span className="font-medium">kV:</span> {testData.linearityOfTime.table1?.kv || "-"},{' '}
                      <span className="font-medium">mA:</span> {testData.linearityOfTime.table1?.ma || "-"}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X (mGy/sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center bg-green-100" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
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
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.time || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.average || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{x || "-"}</td>
                            {i === 0 && (
                              <>
                                <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfTime.xMax || "-"}
                                </td>
                                <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfTime.xMin || "-"}
                                </td>
                                <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 font-semibold align-middle text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfTime.col || "-"}
                                </td>
                                <td rowSpan={testData.linearityOfTime.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle text-center ${
                                  testData.linearityOfTime.remarks === "Pass" || testData.linearityOfTime.remarks === "PASS" ? "bg-green-100 text-green-800" : 
                                  testData.linearityOfTime.remarks === "Fail" || testData.linearityOfTime.remarks === "FAIL" ? "bg-red-100 text-red-800" : 
                                  "bg-transparent print:bg-transparent"
                                }`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
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

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfTime?.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfRadiationOutput?.outputRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Reproducibility of Radiation Output</h3>

                {testData.reproducibilityOfRadiationOutput?.ffd && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>FFD:</strong> {testData.reproducibilityOfRadiationOutput.ffd} cm
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                        <th colSpan={testData.reproducibilityOfRadiationOutput?.outputRows?.[0]?.outputs?.length || 0} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          Radiation Output (mGy)
                        </th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-blue-100" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg (X̄)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center bg-green-100" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CV % / Remark</th>
                      </tr>
                      <tr>
                        {testData.reproducibilityOfRadiationOutput?.outputRows?.[0]?.outputs?.map((_: any, idx: number) => (
                          <th key={idx} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.reproducibilityOfRadiationOutput?.outputRows?.map((row: any, i: number) => (
                        <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 font-semibold text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kv || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas || "-"}</td>
                          {(row.outputs || []).map((output: any, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center bg-transparent print:bg-transparent" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{output?.value || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-semibold text-center bg-blue-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avg || "-"}</td>
                          <td className={`border border-black p-2 print:p-1 font-bold text-center ${
                            row.remark?.includes("Pass") || row.remark?.includes("PASS") ? "bg-green-100 text-green-800" : 
                            row.remark?.includes("Fail") || row.remark?.includes("FAIL") ? "bg-red-100 text-red-800" : 
                            "bg-transparent print:bg-transparent"
                          }`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            {row.remark || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
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
                <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Tube Housing Leakage Radiation Test</h3>

                  {/* Operating Parameters */}
                  {settings && (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>FDD (cm)</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{settings.distance || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>kV</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{settings.kv || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>mA</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{settings.ma || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Time (Sec)</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{settings.time || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Exposure Level Table */}
                  {leakageData.leakageMeasurements?.length > 0 && (
                    <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead>
                          <tr>
                            {/* Row 1: Top half of "rowspans" and the main "colspans" */}
                            <th className="border border-black border-b-0 p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Location<br />(at 1.0 m<br />from the<br />focus)</th>
                            <th colSpan={5} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Exposure Level (mR/hr)</th>
                            <th className="border border-black border-b-0 p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Result</th>
                            <th className="border border-black border-b-0 p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Remarks</th>
                          </tr>
                          <tr>
                            {/* Row 2: Bottom half (empty for rowspans) and sub-headers */}
                            <th className="border border-black border-t-0 p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}></th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Left</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Right</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Front</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Back</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>Top</th>
                            <th className="border border-black border-t-0 p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}></th>
                            <th className="border border-black border-t-0 p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {leakageData.leakageMeasurements.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{row.location || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{row.left || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{row.right || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{row.front || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{row.back || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{row.top || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>{maxLeakageResultMR} mR in one hour</td>
                              <td className={`border border-black p-2 print:p-1 text-center font-semibold ${
                                remark === "Pass" || remark === "PASS" ? "bg-green-100 text-green-800" : 
                                remark === "Fail" || remark === "FAIL" ? "bg-red-100 text-red-800" : 
                                "bg-transparent print:bg-transparent"
                              }`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                {remark || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Work Load */}
                  {leakageData.workload && (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }} colSpan={6}>
                              <strong>Work Load:</strong> {leakageData.workload.value || "-"} {leakageData.workload.unit || "mA·min/week"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Max Leakage Calculation */}
                  {workloadInput && settings.ma && settings.time && maxValue > 0 && (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td rowSpan={2} className="border border-black p-2 print:p-1 text-center font-medium" style={{ width: '80px', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                              Max<br />Leakage =
                            </td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                              {workloadInput} mAmin in 1 hr X {maxValue.toFixed(2)}
                            </td>
                            <td rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ width: '180px', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                              max Exposure Level (mR/hr)<br />
                              <span className="border-t border-black inline-block w-full mt-1 pt-1">mA used for measurement</span>
                            </td>
                            <td rowSpan={2} className="border border-black p-2 print:p-1 text-center font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                              {maxLeakageResultMR} mR in one hour
                            </td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                              60 X {settings.ma}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Maximum Radiation Leakage from Tube Housing */}
                  <div className="mb-2 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ width: '70%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                            <span className="underline">Maximum Radiation Leakage from Tube Housing</span>
                          </td>
                          <td className="border border-black p-2 print:p-1 text-center font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'transparent' }}>
                            {finalLeakageRate || "0"} mGy in one hour
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tolerance */}
                  {leakageData.tolerance && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm">
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{" "}
                        {leakageData.tolerance.operator === 'less than or equal to' ? '< ' : 
                         leakageData.tolerance.operator === 'greater than or equal to' ? '≥ ' : ''}
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
          @page { margin: 0.5cm; size: A4; }
          table, tr, td, th { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .compact-table {
            font-size: 11px !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
          }
          .compact-table td, .compact-table th {
            padding: 0px 1px !important;
            font-size: 11px !important;
            line-height: 1.0 !important;
            min-height: 0 !important;
            height: auto !important;
            vertical-align: middle !important;
            border-color: #000000 !important;
            text-align: center !important;
          }
          table, td, th {
            border-color: #000000 !important;
          }
          table td, table th {
            text-align: center !important;
          }
          .force-small-text {
            font-size: 7px !important;
          }
          .force-small-text td, .force-small-text th {
            font-size: 7px !important;
            padding: 0px 1px !important;
            line-height: 1.0 !important;
          }
          .compact-table tr {
            height: auto !important;
            min-height: 0 !important;
            line-height: 1.0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          thead { display: table-header-group; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
          table { 
            border-collapse: collapse; 
            border-spacing: 0;
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          table td, table th {
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          table.border-2, table[class*="border-2"] {
            border-width: 1px !important;
          }
          table td.border-2, table th.border-2,
          table td[class*="border-2"], table th[class*="border-2"] {
            border-width: 1px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportDentalHandHeld;
