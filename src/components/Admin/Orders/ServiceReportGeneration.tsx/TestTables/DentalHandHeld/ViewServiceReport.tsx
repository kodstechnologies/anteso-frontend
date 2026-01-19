// src/components/reports/ViewServiceReportDentalHandHeld.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeaderForDentalHandHeld,
  getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld,
  getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld,
  getLinearityOfTimeByServiceIdForDentalHandHeld,
  getLinearityOfMaLoadingByServiceIdForDentalHandHeld,
  getLinearityOfMasLoadingByServiceIdForDentalHandHeld,
  getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld,
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
            accuracyPotential,
            accuracyTime,
            linearityTime,
            linearityMa,
            linearityMas,
            consistency,
            leakageTest
          ] = await Promise.allSettled([
            getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld(serviceId),
            getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfTimeByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfMaLoadingByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfMasLoadingByServiceIdForDentalHandHeld(serviceId),
            getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld(serviceId),
            getTubeHousingLeakageByServiceIdForDentalHandHeld(serviceId)
          ]);

          setTestData({
            accuracyOfOperatingPotential: accuracyPotential.status === 'fulfilled' && accuracyPotential.value?.data ? accuracyPotential.value.data : null,
            accuracyOfIrradiationTime: accuracyTime.status === 'fulfilled' && accuracyTime.value?.data ? accuracyTime.value.data : null,
            linearityOfTime: linearityTime.status === 'fulfilled' && linearityTime.value?.data ? linearityTime.value.data : null,
            linearityOfmALoading: linearityMa.status === 'fulfilled' && linearityMa.value?.data ? linearityMa.value.data : null,
            linearityOfMasLoading: linearityMas.status === 'fulfilled' && linearityMas.value?.data ? linearityMas.value.data : null,
            consistencyOfRadiationOutput: consistency.status === 'fulfilled' && consistency.value?.data ? consistency.value.data : null,
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

            {/* 1. Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential?.measurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Operating Potential (kVp)</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold">Applied kVp</th>
                        <th colSpan={testData.accuracyOfOperatingPotential.mAStations?.length || 0} className="border border-black p-2 print:p-1 text-center font-bold">Measured Values (kVp)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-blue-100">Average kVp</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                      <tr>
                        {testData.accuracyOfOperatingPotential.mAStations?.map((s: string, idx: number) => (
                          <th key={idx} className="border border-black p-2 print:p-1 text-center font-bold">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.measurements.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{row.appliedKvp || "-"}</td>
                          {row.measuredValues?.map((v: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1">{v || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-bold bg-blue-50">{row.averageKvp || "-"}</td>
                          <td className={`border border-black p-2 print:p-1 font-bold ${row.remarks === "PASS" ? "text-green-800 bg-green-100" : row.remarks === "FAIL" ? "text-red-800 bg-red-100" : ""}`}>{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> {testData.accuracyOfOperatingPotential?.tolerance?.type || "±"} {testData.accuracyOfOperatingPotential?.tolerance?.value || "2.0"} kV
                  </p>
                </div>
              </div>
            )}

            {/* 2. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime?.irradiationTimes?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Irradiation Time</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Set Time (mSec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Measured Time (mSec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">% Error</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                        const s = parseFloat(row.setTime);
                        const m = parseFloat(row.measuredTime);
                        const err = (!isNaN(s) && !isNaN(m) && s !== 0) ? Math.abs((m - s) / s * 100).toFixed(2) : "-";

                        return (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 font-semibold">{row.setTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1">{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-bold">{err !== "-" ? `${err}%` : "-"}</td>
                            <td className={`border border-black p-2 print:p-1 font-bold ${row.remark === "PASS" ? "text-green-800 bg-green-100" : row.remark === "FAIL" ? "text-red-800 bg-red-100" : ""}`}>{row.remark || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> {testData.accuracyOfIrradiationTime?.tolerance?.operator || "≤"} {testData.accuracyOfIrradiationTime?.tolerance?.value || "10"}%
                  </p>
                </div>
              </div>
            )}

            {/* 3. Linearity of Time */}
            {testData.linearityOfTime?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Linearity of Time</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Time (sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{row.time || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.average || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.x || "-"}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle">{testData.linearityOfTime.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle">{testData.linearityOfTime.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{testData.linearityOfTime.col || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${testData.linearityOfTime.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {testData.linearityOfTime.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
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

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfmALoading?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity of mA Loading</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">mA</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/mA)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfmALoading.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{row.ma || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.average || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.x || "-"}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{row.col || "-"}</td>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${row.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {row.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfmALoading?.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Linearity of mAs Loading</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">mAs Range</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/mAs)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMasLoading.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{row.mAsRange || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.average || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.x || "-"}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{row.col || "-"}</td>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${row.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {row.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfMasLoading?.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 6. Consistency of Radiation Output */}
            {testData.consistencyOfRadiationOutput?.outputRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Consistency of Radiation Output</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold">kV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold">mAs</th>
                        <th colSpan={testData.consistencyOfRadiationOutput.measurementHeaders?.length || 0} className="border border-black p-2 print:p-1 text-center font-bold">Radiation Output (mGy)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-blue-100">Avg Output</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">CoV / Remark</th>
                      </tr>
                      <tr>
                        {testData.consistencyOfRadiationOutput.measurementHeaders?.map((h: string, idx: number) => (
                          <th key={idx} className="border border-black p-2 print:p-1 text-center font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.consistencyOfRadiationOutput.outputRows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{row.kvp || "-"}</td>
                          <td className="border border-black p-2 print:p-1">{row.mas || "-"}</td>
                          {row.outputs?.map((v: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1">{v || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-bold bg-blue-50">{row.mean || "-"}</td>
                          <td className={`border border-black p-2 print:p-1 font-bold ${row.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : row.remarks?.toUpperCase() === "FAIL" ? "text-red-800 bg-red-100" : ""}`}>
                            {row.cov && row.remarks ? `${row.cov} / ${row.remarks}` : row.cov || row.remarks || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoV):</strong> ≤ {testData.consistencyOfRadiationOutput?.tolerance || "0.05"}
                  </p>
                </div>
              </div>
            )}

            {/* 7. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (() => {
              const leakageData = testData.tubeHousingLeakage;
              const settings = leakageData.measurementSettings || {};
              const finalLeakageRate = leakageData.calculatedResult?.finalLeakageRate || '0';
              const remark = leakageData.calculatedResult?.remark || '';

              return (
                <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Tube Housing Leakage Radiation Test</h3>

                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 font-medium">kV: {settings.kv || "-"}</td>
                          <td className="border border-black p-2 font-medium">mA: {settings.ma || "-"}</td>
                          <td className="border border-black p-2 font-medium">Time (Sec): {settings.time || "-"}</td>
                          <td className="border border-black p-2 font-medium">FDD (cm): {settings.distance || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-x-auto mb-4 print:mb-1">
                    <table className="w-full border-2 border-black text-sm compact-table">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2">Location</th>
                          <th className="border border-black p-2">Exposure Level (mR/hr)</th>
                          <th className="border border-black p-2">Result (mR in 1hr)</th>
                          <th className="border border-black p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leakageData.leakageMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center font-bold">
                            <td className="border border-black p-2">{row.location || "-"}</td>
                            <td className="border border-black p-2">{row.max || "-"}</td>
                            <td className="border border-black p-2">{leakageData.calculatedResult?.maxLeakageIntermediate || "-"}</td>
                            <td className={`border border-black p-2 ${remark === "PASS" || remark === "Pass" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>{remark || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-2 print:mb-1">
                    <table className="w-full border-2 border-black text-sm compact-table">
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 text-center underline font-bold">Maximum Radiation Leakage from Tube Housing</td>
                          <td className="border border-black p-2 text-center font-bold">{finalLeakageRate || "0"} mGy in one hour</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm font-bold">
                      Tolerance: Maximum Leakage Radiation Level at 1 meter from the Focus should be ≤ {leakageData.tolerance?.value || "1"} mGy in one hour.
                    </p>
                  </div>
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
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportDentalHandHeld;
