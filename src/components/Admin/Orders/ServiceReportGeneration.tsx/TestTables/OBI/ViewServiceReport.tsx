// src/components/reports/ViewServiceReportOBI.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForOBI } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MainTestTableForOBI from "./MainTestTableForOBI";

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

  // All OBI Tests
  AlignmentTestOBI?: any;
  accuracyOfOperatingPotentialOBI?: any;
  TimerTestOBI?: any;
  OutputConsistencyOBI?: any;
  CentralBeamAlignmentOBI?: any;
  CongruenceOfRadiationOBI?: any;
  EffectiveFocalSpotOBI?: any;
  LinearityOfMasLoadingStationsOBI?: any;
  LinearityOfTimeOBI?: any;
  TubeHousingLeakageOBI?: any;
  RadiationProtectionSurveyOBI?: any;
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

const ViewServiceReportOBI: React.FC = () => {
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
        const response = await getReportHeaderForOBI(serviceId);

        if (response?.exists && response.data) {
          const data = response.data;

          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "On-Board Imaging (OBI)",
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

          // Transform backend data structures to match frontend expectations
          const transformAlignmentTest = (atData: any) => {
            if (!atData || typeof atData !== 'object') return null;
            if (typeof atData === 'string') return null;
            const testRows = Array.isArray(atData.testRows) ? atData.testRows : [];
            if (testRows.length === 0) return null;
            return { ...atData, testRows };
          };

          const transformOperatingPotential = (opData: any) => {
            if (!opData || typeof opData !== 'object') return null;
            if (typeof opData === 'string') return null;
            const table2 = Array.isArray(opData.table2) ? opData.table2 : [];
            if (table2.length === 0) return null;
            return {
              ...opData,
              table2,
              toleranceSign: opData.tolerance?.sign || opData.toleranceSign || "±",
              toleranceValue: opData.tolerance?.value || opData.toleranceValue || "2.0",
            };
          };

          const transformTimerTest = (ttData: any) => {
            if (!ttData || typeof ttData !== 'object') return null;
            if (typeof ttData === 'string') return null;
            const irradiationTimes = Array.isArray(ttData.irradiationTimes) ? ttData.irradiationTimes : [];
            if (irradiationTimes.length === 0) return null;
            return {
              ...ttData,
              irradiationTimes,
              testConditions: ttData.testConditions || {},
              tolerance: ttData.tolerance || { operator: "<=", value: "5" },
            };
          };

          const transformOutputConsistency = (ocData: any) => {
            if (!ocData || typeof ocData !== 'object') return null;
            if (typeof ocData === 'string') return null;
            const outputRows = Array.isArray(ocData.outputRows) ? ocData.outputRows : [];
            if (outputRows.length === 0) return null;
            return {
              ...ocData,
              outputRows,
              ffd: ocData.ffd || {},
            };
          };

          const transformCentralBeamAlignment = (cbaData: any) => {
            if (!cbaData || typeof cbaData !== 'object') return null;
            if (typeof cbaData === 'string') return null;
            return cbaData;
          };

          const transformCongruenceOfRadiation = (corData: any) => {
            if (!corData || typeof corData !== 'object') return null;
            if (typeof corData === 'string') return null;
            const congruenceMeasurements = Array.isArray(corData.congruenceMeasurements) ? corData.congruenceMeasurements : [];
            if (congruenceMeasurements.length === 0) return null;
            return {
              ...corData,
              congruenceMeasurements,
              techniqueFactors: Array.isArray(corData.techniqueFactors) ? corData.techniqueFactors : [],
            };
          };

          const transformEffectiveFocalSpot = (efsData: any) => {
            if (!efsData || typeof efsData !== 'object') return null;
            if (typeof efsData === 'string') return null;
            const focalSpots = Array.isArray(efsData.focalSpots) ? efsData.focalSpots : [];
            if (focalSpots.length === 0) return null;
            return { ...efsData, focalSpots };
          };

          const transformLinearityOfMasLoading = (lomData: any) => {
            if (!lomData || typeof lomData !== 'object') return null;
            if (typeof lomData === 'string') return null;
            const table2 = Array.isArray(lomData.table2) ? lomData.table2 : [];
            if (table2.length === 0) return null;
            return {
              ...lomData,
              table2,
              table1: Array.isArray(lomData.table1) ? lomData.table1 : [],
              measHeaders: Array.isArray(lomData.measHeaders) ? lomData.measHeaders : [],
            };
          };

          const transformLinearityOfTime = (lotData: any) => {
            if (!lotData || typeof lotData !== 'object') return null;
            if (typeof lotData === 'string') return null;
            const measurementRows = Array.isArray(lotData.measurementRows) ? lotData.measurementRows : [];
            if (measurementRows.length === 0) return null;
            return {
              ...lotData,
              measurementRows,
              testConditions: lotData.testConditions || {},
            };
          };

          const transformTubeHousingLeakage = (thlData: any) => {
            if (!thlData || typeof thlData !== 'object') return null;
            if (typeof thlData === 'string') return null;
            const leakageMeasurements = Array.isArray(thlData.leakageMeasurements) ? thlData.leakageMeasurements : [];
            if (leakageMeasurements.length === 0) return null;
            return {
              ...thlData,
              leakageMeasurements,
            };
          };

          const transformRadiationProtection = (rpData: any) => {
            if (!rpData || typeof rpData !== 'object') return null;
            if (typeof rpData === 'string') return null;
            const locations = Array.isArray(rpData.locations) ? rpData.locations : [];
            if (locations.length === 0) return null;
            return { ...rpData, locations };
          };

          setTestData({
            alignmentTest: transformAlignmentTest(data.AlignmentTestOBI),
            operatingPotential: transformOperatingPotential(data.accuracyOfOperatingPotentialOBI),
            timerTest: transformTimerTest(data.TimerTestOBI),
            outputConsistency: transformOutputConsistency(data.OutputConsistencyOBI),
            centralBeamAlignment: transformCentralBeamAlignment(data.CentralBeamAlignmentOBI),
            congruenceOfRadiation: transformCongruenceOfRadiation(data.CongruenceOfRadiationOBI),
            effectiveFocalSpot: transformEffectiveFocalSpot(data.EffectiveFocalSpotOBI),
            linearityOfMasLoading: transformLinearityOfMasLoading(data.LinearityOfMasLoadingStationsOBI),
            linearityOfTime: transformLinearityOfTime(data.LinearityOfTimeOBI),
            tubeHousingLeakage: transformTubeHousingLeakage(data.TubeHousingLeakageOBI),
            radiationProtection: transformRadiationProtection(data.RadiationProtectionSurveyOBI),
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load OBI report:", err);
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

    const btn = document.querySelector(".download-pdf-btn") as HTMLButtonElement;
    if (btn) {
      btn.textContent = "Generating PDF...";
      btn.disabled = true;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduced from 3 to 1.5 - still good quality but much smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        removeContainer: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("report-content");
          if (clonedElement) {
            clonedElement.style.width = '210mm';
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '20px';
            
            const nestedContainers = clonedElement.querySelectorAll('div');
            nestedContainers.forEach((div: HTMLElement) => {
              if (div.style.maxWidth || div.classList.contains('max-w-5xl') || div.classList.contains('max-w-7xl')) {
                div.style.maxWidth = 'none';
                div.style.width = '100%';
              }
              if (div.classList.contains('p-8') || div.classList.contains('p-10')) {
                div.style.padding = '20px';
              }
            });

            const tables = clonedElement.querySelectorAll('table');
            tables.forEach((table) => {
              (table as HTMLElement).style.breakInside = 'avoid';
              (table as HTMLElement).style.width = '100%';
              (table as HTMLElement).style.borderCollapse = 'collapse';
              (table as HTMLElement).style.tableLayout = 'auto';
              
              const cells = table.querySelectorAll('td, th');
              cells.forEach((cell) => {
                (cell as HTMLElement).style.breakInside = 'avoid';
                (cell as HTMLElement).style.wordWrap = 'break-word';
                (cell as HTMLElement).style.overflowWrap = 'break-word';
                (cell as HTMLElement).style.verticalAlign = 'top';
              });
            });

            const sections = clonedElement.querySelectorAll('section, div.mb-6, div.mb-8');
            sections.forEach((section) => {
              (section as HTMLElement).style.breakInside = 'avoid';
            });

            const buttons = clonedElement.querySelectorAll('button, .print\\:hidden');
            buttons.forEach((btn) => {
              (btn as HTMLElement).style.display = 'none';
            });
          }
        }
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

      pdf.save(`OBI-Report-${report?.testReportNumber || "report"}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      if (btn) {
        btn.textContent = "Download PDF";
        btn.disabled = false;
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading OBI Report...</div>;

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please save the OBI report header first.</p>
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
              QA TEST REPORT FOR ON-BOARD IMAGING (OBI)
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
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <MainTestTableForOBI testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Alignment Test */}
            {testData.alignmentTest?.testRows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">1. ALIGNMENT TEST</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Test Name</th>
                        <th className="border border-black p-2 text-center">Tolerance Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.alignmentTest.testRows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.testName || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.sign} {row.value || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Accuracy of Operating Potential */}
            {testData.operatingPotential?.table2?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">2. ACCURACY OF OPERATING POTENTIAL (KVP)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Set kV</th>
                        <th className="border border-black p-2 text-center">@ mA 10</th>
                        <th className="border border-black p-2 text-center">@ mA 100</th>
                        <th className="border border-black p-2 text-center">@ mA 200</th>
                        <th className="border border-black p-2 text-center">Avg kVp</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.operatingPotential.table2.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.setKV || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.ma10 || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.ma100 || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.ma200 || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.avgKvp || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Tolerance : {testData.operatingPotential.toleranceSign || "±"}{testData.operatingPotential.toleranceValue || "2.0"}%</p>
                </div>
              </div>
            )}

            {/* 3. Timer Test */}
            {testData.timerTest?.irradiationTimes?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">3. ACCURACY OF IRRADIATION TIME</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FCD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.timerTest.testConditions?.fcd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.timerTest.testConditions?.kv || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mA</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.timerTest.testConditions?.ma || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Set Time (mSec)</th>
                        <th className="border border-black p-2 text-center">Measured Time (mSec)</th>
                        <th className="border border-black p-2 text-center">Tolerance</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.timerTest.irradiationTimes.map((row: any, i: number) => {
                        const toleranceOperator = testData.timerTest.tolerance?.operator || "<=";
                        const toleranceValue = testData.timerTest.tolerance?.value || "5";
                        return (
                          <tr key={i}>
                            <td className="border border-black p-2 text-left">{row.setTime || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 text-center">{toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 text-center">-</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Output Consistency */}
            {testData.outputConsistency?.outputRows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">4. OUTPUT CONSISTENCY</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FFD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.outputConsistency.ffd?.value || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 text-left">Applied kV</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">mAs</th>
                        <th colSpan={testData.outputConsistency.outputRows[0]?.outputs?.length || 3} className="border border-black p-2 text-center">
                          Radiation Output mGy
                        </th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Avg. (X)</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Coefficient of Variation CoV</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                      <tr>
                        {Array.from({ length: testData.outputConsistency.outputRows[0]?.outputs?.length || 3 }, (_, i) => (
                          <th key={i} className="border border-black p-1 text-center text-xs">{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.kv || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.mas || "-"}</td>
                          {row.outputs?.map((val: any, idx: number) => (
                            <td key={idx} className="border border-black p-2 text-center">{val.value || val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 text-center">{row.avg || "-"}</td>
                          <td className="border border-black p-2 text-center">-</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Tolerance : CoV &lt; {testData.outputConsistency.tolerance?.value || "0.05"}</p>
                </div>
              </div>
            )}

            {/* 5. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">5. CENTRAL BEAM ALIGNMENT</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Technique factors:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FCD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.centralBeamAlignment.techniqueFactors?.fcd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.centralBeamAlignment.techniqueFactors?.kv || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mAs</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.centralBeamAlignment.techniqueFactors?.mas || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Observed Tilt</th>
                        <th className="border border-black p-2 text-center">Tolerance</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-left">{testData.centralBeamAlignment.observedTilt?.value ? `${testData.centralBeamAlignment.observedTilt.value}°` : "-"}</td>
                        <td className="border border-black p-2 text-center">{testData.centralBeamAlignment.tolerance?.operator || "≤"} {testData.centralBeamAlignment.tolerance?.value || "-"}°</td>
                        <td className="border border-black p-2 text-center">{testData.centralBeamAlignment.finalResult || testData.centralBeamAlignment.observedTilt?.remark || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Congruence of Radiation */}
            {testData.congruenceOfRadiation?.congruenceMeasurements?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">6. CONGRUENCE OF RADIATION</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Dimension</th>
                        <th className="border border-black p-2 text-center">Observed Shift (cm)</th>
                        <th className="border border-black p-2 text-center">Edge Shift (cm)</th>
                        <th className="border border-black p-2 text-center">% FED</th>
                        <th className="border border-black p-2 text-center">Tolerance (%)</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.congruenceOfRadiation.congruenceMeasurements.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.dimension || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.observedShift || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.edgeShift || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.percentFED || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.tolerance || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Effective Focal Spot */}
            {testData.effectiveFocalSpot?.focalSpots?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">7. EFFECTIVE FOCAL SPOT</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">FCD:</span>
                  <span className="text-sm font-semibold">{testData.effectiveFocalSpot.fcd || "-"} cm</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Focus Type</th>
                        <th className="border border-black p-2 text-center">Stated Width (mm)</th>
                        <th className="border border-black p-2 text-center">Stated Height (mm)</th>
                        <th className="border border-black p-2 text-center">Measured Width (mm)</th>
                        <th className="border border-black p-2 text-center">Measured Height (mm)</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.effectiveFocalSpot.focalSpots.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.focusType || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.statedWidth || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.statedHeight || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.measuredWidth || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.measuredHeight || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Final Result: {testData.effectiveFocalSpot.finalResult || "-"}</p>
                </div>
              </div>
            )}

            {/* 8. Linearity of mAs Loading Stations */}
            {testData.linearityOfMasLoading?.table2?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">8. LINEARITY OF MAS LOADING STATIONS</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      {testData.linearityOfMasLoading.table1?.map((row: any, idx: number) => (
                        <tr key={idx}>
                          <td className="border border-black px-3 py-1 text-center text-sm">FCD (cm)</td>
                          <td className="border border-black px-3 py-1 text-center text-sm">{row.fcd || "-"}</td>
                          <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                          <td className="border border-black px-3 py-1 text-center text-sm">{row.kv || "-"}</td>
                          <td className="border border-black px-3 py-1 text-center text-sm">Time (s)</td>
                          <td className="border border-black px-3 py-1 text-center text-sm">{row.time || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">mAs Applied</th>
                        {(testData.linearityOfMasLoading.measHeaders || Array.from({ length: testData.linearityOfMasLoading.table2[0]?.measuredOutputs?.length || 3 }, (_, i) => `Meas ${i + 1}`)).map((h: string, idx: number) => (
                          <th key={idx} className="border border-black p-2 text-center">{h}</th>
                        ))}
                        <th className="border border-black p-2 text-center">Average</th>
                        <th className="border border-black p-2 text-center">X</th>
                        <th className="border border-black p-2 text-center">X MAX</th>
                        <th className="border border-black p-2 text-center">X MIN</th>
                        <th className="border border-black p-2 text-center">CoL</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMasLoading.table2.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.mAsApplied || "-"}</td>
                          {row.measuredOutputs?.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 text-center">{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 text-center">{row.average || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.x || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.xMax || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.xMin || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.col || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Tolerance : Coefficient of Linearity ≤ {testData.linearityOfMasLoading.tolerance || "0.1"}</p>
                </div>
              </div>
            )}

            {/* 9. Linearity of Time */}
            {testData.linearityOfTime?.measurementRows?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">9. LINEARITY OF TIME</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Test conditions:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FDD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.linearityOfTime.testConditions?.fdd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.linearityOfTime.testConditions?.kv || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">Time (Sec)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.linearityOfTime.testConditions?.time || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 text-left">mA Applied</th>
                        <th colSpan={3} className="border border-black p-2 text-center">Radiation Output (mGy)</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">Average Output (mGy)</th>
                        <th rowSpan={2} className="border border-black p-2 text-center">mGy / mAs (X)</th>
                      </tr>
                      <tr>
                        <th className="border border-black p-1 text-center text-xs">1</th>
                        <th className="border border-black p-1 text-center text-xs">2</th>
                        <th className="border border-black p-1 text-center text-xs">3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime.measurementRows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.maApplied || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.radiationOutput1 || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.radiationOutput2 || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.radiationOutput3 || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.averageOutput || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.mGyPerMAs || "-"}</td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={5} className="border border-black p-2 text-center">Summary</td>
                        <td className="border border-black p-2 text-center">X MAX: {testData.linearityOfTime.xMax || "-"} | X MIN: {testData.linearityOfTime.xMin || "-"}</td>
                      </tr>
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={5} className="border border-black p-2 text-center">Coefficient of Linearity (CoL): {testData.linearityOfTime.coefficientOfLinearity || "-"}</td>
                        <td className="border border-black p-2 text-center">{testData.linearityOfTime.remarks || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">Tolerance : CoL &lt; {testData.linearityOfTime.tolerance || "0.1"}</p>
                </div>
              </div>
            )}

            {/* 10. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">10. TUBE HOUSING LEAKAGE</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Operating parameters:</span>
                  <table className="inline-block border border-black" style={{ width: 'auto' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black px-3 py-1 text-center text-sm">FCD (cm)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.tubeHousingLeakage.fcd || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">kV</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.tubeHousingLeakage.kv || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">mA</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.tubeHousingLeakage.ma || "-"}</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">Time (s)</td>
                        <td className="border border-black px-3 py-1 text-center text-sm">{testData.tubeHousingLeakage.time || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Location</th>
                        <th className="border border-black p-2 text-center">Left</th>
                        <th className="border border-black p-2 text-center">Right</th>
                        <th className="border border-black p-2 text-center">Front</th>
                        <th className="border border-black p-2 text-center">Back</th>
                        <th className="border border-black p-2 text-center">Top</th>
                        <th className="border border-black p-2 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.tubeHousingLeakage.leakageMeasurements.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-left">{row.location || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.left || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.right || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.front || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.back || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.top || "-"}</td>
                          <td className="border border-black p-2 text-center">{row.remark || testData.tubeHousingLeakage.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="text-sm">
                    Tolerance : Maximum leakage radiation {testData.tubeHousingLeakage.toleranceOperator === "less than or equal to" ? "≤" : testData.tubeHousingLeakage.toleranceOperator === "greater than or equal to" ? "≥" : "="} {testData.tubeHousingLeakage.toleranceValue || "1"} mGy/h ({testData.tubeHousingLeakage.toleranceTime || "1"} hour)
                  </p>
                </div>
              </div>
            )}

            {/* 11. Radiation Protection Survey */}
            {testData.radiationProtection?.locations?.length > 0 && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold uppercase mb-4">11. RADIATION PROTECTION SURVEY</h3>
                
                {/* Survey Details Table */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Survey Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
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
                          <td className="border border-black p-2 text-left">{formatDate(testData.radiationProtection.surveyDate) || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtection.appliedCurrent || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtection.appliedVoltage || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtection.exposureTime || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtection.workload || "-"}</td>
                          <td className="border border-black p-2 text-center">{testData.radiationProtection.hasValidCalibration || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm" style={{ width: 'auto' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left">Location</th>
                        <th className="border border-black p-2 text-center">Max. Radiation Level (mR/hr)</th>
                        <th className="border border-black p-2 text-center">mR/week</th>
                        <th className="border border-black p-2 text-center">Status</th>
                        <th className="border border-black p-2 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationProtection.locations.map((loc: any, i: number) => (
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
          h1, h2, h3 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportOBI;
