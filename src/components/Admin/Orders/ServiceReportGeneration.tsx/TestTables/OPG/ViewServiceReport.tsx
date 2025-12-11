// src/components/reports/ViewServiceReportOPG.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForOPG } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MainTestTableForOPG from "./MainTestTableForOPG";

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

  // All OPG Tests
  AccuracyOfIrradiationTimeOPG?: any;
  AccuracyOfOperatingPotentialOPG?: any;
  OutputConsistencyForOPG?: any;
  LinearityOfMaLoadingOPG?: any;
  RadiationLeakageTestOPG?: any;
  RadiationProtectionSurveyOPG?: any;
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

const ViewServiceReportOPG: React.FC = () => {
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
        const response = await getReportHeaderForOPG(serviceId);

        if (response?.exists && response.data) {
          const data = response.data;

          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "OPG",
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

          // Transform backend data structure to match ViewServiceReport expectations
          const transformOperatingPotential = (opData: any) => {
            if (!opData || typeof opData !== 'object') return null;
            // Skip if it's just an ObjectId string (not populated)
            if (typeof opData === 'string') return null;

            // Handle both cases: if measurements exists, use it; otherwise use rows if it exists
            const rows = opData.measurements || opData.rows || [];
            // Only return if we have actual data (rows or mAStations)
            if (!Array.isArray(rows) || rows.length === 0) {
              // Still return if mAStations exist (data might be structured differently)
              if (!Array.isArray(opData.mAStations) || opData.mAStations.length === 0) {
                return null;
              }
            }

            return {
              ...opData,
              rows: Array.isArray(rows) ? rows : [],
              mAStations: Array.isArray(opData.mAStations) ? opData.mAStations : [],
              toleranceSign: opData.tolerance?.type || opData.toleranceSign || "±",
              toleranceValue: opData.tolerance?.value || opData.toleranceValue || "2.0",
            };
          };

          const transformIrradiationTime = (itData: any) => {
            if (!itData || typeof itData !== 'object') return null;
            if (typeof itData === 'string') return null;
            const irradiationTimes = Array.isArray(itData.irradiationTimes) ? itData.irradiationTimes : (Array.isArray(itData.table2Rows) ? itData.table2Rows : []);
            if (!irradiationTimes || irradiationTimes.length === 0) return null;
            return {
              ...itData,
              irradiationTimes,
              testConditions: itData.testConditions || itData.table1Row || {},
              tolerance: itData.tolerance || { operator: "<=", value: "5" },
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
              measurementHeaders: Array.isArray(ocData.measurementHeaders) ? ocData.measurementHeaders : [],
              ffd: ocData.ffd || "",
            };
          };

          const transformLinearity = (linData: any) => {
            if (!linData || typeof linData !== 'object') return null;
            if (typeof linData === 'string') return null;
            // Backend returns table2, but we normalize to table2Rows
            const table2Rows = Array.isArray(linData.table2Rows) ? linData.table2Rows : (Array.isArray(linData.table2) ? linData.table2 : []);
            if (table2Rows.length === 0) return null;
            return {
              ...linData,
              table2Rows,
              table1: linData.table1 || linData.exposureCondition || {},
            };
          };

          const transformRadiationLeakage = (rlData: any) => {
            if (!rlData || typeof rlData !== 'object') return null;
            if (typeof rlData === 'string') return null;

            // Transform leakageMeasurements array to leakageRows array
            const leakageMeasurements = rlData.leakageMeasurements || rlData.leakageRows || [];
            const toleranceValue = parseFloat(rlData.toleranceValue || "1");
            const toleranceOperator = rlData.toleranceOperator || "<=";

            const leakageRows = Array.isArray(leakageMeasurements) ? leakageMeasurements.map((measurement: any) => {
              // Calculate max if not provided
              let maxValue = measurement.max;
              if (!maxValue || maxValue === "" || maxValue === "-") {
                const values = [
                  measurement.left,
                  measurement.right,
                  measurement.top || measurement.front,
                  measurement.up || measurement.back,
                  measurement.down
                ]
                  .map((v: any) => parseFloat(v) || 0)
                  .filter((v: number) => v > 0);
                maxValue = values.length > 0 ? Math.max(...values).toFixed(3) : "-";
              } else {
                maxValue = String(maxValue);
              }

              // Calculate remark if not provided
              let remark = measurement.remark || measurement.remarks || "";
              if (!remark || remark === "" || remark === "-") {
                const maxNum = parseFloat(maxValue);
                if (!isNaN(maxNum) && !isNaN(toleranceValue) && toleranceValue > 0) {
                  if (toleranceOperator === "<=" || toleranceOperator === "less than or equal to") {
                    remark = maxNum <= toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === ">=" || toleranceOperator === "greater than or equal to") {
                    remark = maxNum >= toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === "<" || toleranceOperator === "less than") {
                    remark = maxNum < toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === ">" || toleranceOperator === "greater than") {
                    remark = maxNum > toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === "=" || toleranceOperator === "equal to") {
                    remark = Math.abs(maxNum - toleranceValue) < 0.001 ? "Pass" : "Fail";
                  } else {
                    remark = "-";
                  }
                } else {
                  remark = "-";
                }
              }

              return {
                location: measurement.location || "-",
                left: measurement.left || "-",
                right: measurement.right || "-",
                top: measurement.top || measurement.front || "-",
                up: measurement.up || measurement.back || "-",
                down: measurement.down || "-",
                max: maxValue,
                unit: measurement.unit || "mGy/h",
                remark: remark,
              };
            }) : [];

            if (leakageRows.length === 0) return null;

            // Handle settings - could be array or single object
            let settingsArray = [];
            if (Array.isArray(rlData.settings) && rlData.settings.length > 0) {
              settingsArray = rlData.settings;
            } else if (rlData.settings && typeof rlData.settings === 'object') {
              settingsArray = [rlData.settings];
            } else if (rlData.ffd || rlData.kvp || rlData.ma || rlData.time) {
              // Fallback: create settings array from top-level fields
              settingsArray = [{
                ffd: rlData.ffd || "",
                kvp: rlData.kvp || rlData.kv || "",
                ma: rlData.ma || "",
                time: rlData.time || "",
              }];
            }

            return {
              ...rlData,
              leakageRows,
              settings: settingsArray,
              maxLeakageResult: rlData.maxLeakageResult || '',
              maxRadiationLeakage: rlData.maxRadiationLeakage || '',
            };
          };

          const transformRadiationSurvey = (rsData: any) => {
            if (!rsData || typeof rsData !== 'object') return null;
            if (typeof rsData === 'string') return null;
            const locations = Array.isArray(rsData.locations) ? rsData.locations : [];
            if (locations.length === 0) return null;
            return {
              ...rsData,
              locations,
            };
          };

          setTestData({
            irradiationTime: transformIrradiationTime(data.AccuracyOfIrradiationTimeOPG),
            operatingPotential: transformOperatingPotential(data.AccuracyOfOperatingPotentialOPG),
            outputConsistency: transformOutputConsistency(data.OutputConsistencyForOPG),
            linearityOfMaLoading: transformLinearity(data.LinearityOfMaLoadingOPG),
            radiationLeakage: transformRadiationLeakage(data.RadiationLeakageTestOPG),
            radiationSurvey: transformRadiationSurvey(data.RadiationProtectionSurveyOPG),
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load OPG report:", err);
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

            const nestedContainers = clonedElement.querySelectorAll<HTMLElement>('div');
            nestedContainers.forEach((div) => {
              if (div.style.maxWidth || div.classList.contains('max-w-5xl') || div.classList.contains('max-w-7xl')) {
                div.style.maxWidth = 'none';
                div.style.width = '100%';
              }
              if (div.classList.contains('p-8') || div.classList.contains('p-10')) {
                div.style.padding = '20px';
              }
            });

            const tables = clonedElement.querySelectorAll('table');
            tables.forEach((table: HTMLElement) => {
              table.style.breakInside = 'avoid';
              table.style.width = '100%';
              table.style.borderCollapse = 'collapse';
              table.style.tableLayout = 'auto';

              const cells = table.querySelectorAll<HTMLElement>('td, th');
              cells.forEach((cell) => {
                cell.style.breakInside = 'avoid';
                cell.style.wordWrap = 'break-word';
                cell.style.overflowWrap = 'break-word';
                cell.style.verticalAlign = 'top';
              });
            });

            const sections = clonedElement.querySelectorAll<HTMLElement>('section, div.mb-6, div.mb-8');
            sections.forEach((section) => {
              section.style.breakInside = 'avoid';
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

      pdf.save(`OPG-Report-${report?.testReportNumber || "report"}.pdf`);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading OPG Report...</div>;

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please save the OPG report header first.</p>
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
              QA TEST REPORT FOR OPG
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

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-12 print:p-8">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <MainTestTableForOPG testData={testData} />
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
                  <table className="w-full border border-black">
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
                        const setTime = parseFloat(row.setTime);
                        const measuredTime = parseFloat(row.measuredTime);
                        const toleranceOperator = testData.irradiationTime.tolerance?.operator || "<=";
                        const toleranceValue = parseFloat(testData.irradiationTime.tolerance?.value || "5");

                        let deviation = "N/A";
                        let pass = false;

                        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                          deviation = ((Math.abs(measuredTime - setTime) / setTime) * 100).toFixed(2);
                          const errorVal = parseFloat(deviation);

                          // Apply tolerance based on operator
                          switch (toleranceOperator) {
                            case "<=":
                              pass = errorVal <= toleranceValue;
                              break;
                            case ">=":
                              pass = errorVal >= toleranceValue;
                              break;
                            case "<":
                              pass = errorVal < toleranceValue;
                              break;
                            case ">":
                              pass = errorVal > toleranceValue;
                              break;
                            default:
                              pass = errorVal <= toleranceValue; // Default to <=
                          }
                        }

                        return (
                          <tr key={i}>
                            <td className="border border-black p-2 text-left">{row.setTime || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 text-center">{deviation !== "N/A" ? `${deviation}%` : "-"}</td>
                            <td className="border border-black p-2 text-center">{toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 text-center">{deviation !== "N/A" ? (pass ? "PASS" : "FAIL") : "-"}</td>
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
                  <table className="inline-block border border-black w-full" >
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
                  <table className="border border-black text-sm w-full">
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
              </div >
            )}

            {/* 4. Linearity of mA Loading */}
            {
              testData.linearityOfMaLoading?.table2Rows?.length > 0 && (
                <div className="mb-16 print:mb-12">
                  <h3 className="text-xl font-bold uppercase mb-4">4. LINEARITY OF MA LOADING</h3>
                  {/* Operating Parameters */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm">Operating parameters:</span>
                    <table className="w-full border border-black">
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
                          <th className="border border-black p-2 text-left">{testData.linearityOfMaLoading.table2Rows[0]?.ma ? "mA" : "mAs Range"}</th>
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
                            <td className="border border-black p-2 text-left">{row.ma || row.mAsRange || "-"}</td>
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
              )
            }

            {/* 5. Tube Housing Leakage */}
            {
              testData.radiationLeakage?.leakageRows?.length > 0 && (
                <div className="mb-16 print:mb-12 print:break-inside-avoid">
                  <h3 className="text-xl font-bold uppercase mb-2">5. TUBE HOUSING LEAKAGE</h3>

                  {/* Combined Table */}
                  <table className="w-full border-2 border-black text-sm">
                    <tbody>
                      {/* Operating Parameters Row */}
                      <tr>
                        <td colSpan={2} className="border border-black p-2 font-semibold">Operating parameters:</td>
                        <td className="border border-black p-2 text-center">FDD (cm)</td>
                        <td className="border border-black p-2 text-center">{testData.radiationLeakage.settings?.[0]?.ffd || "-"}</td>
                        <td className="border border-black p-2 text-center">kVp</td>
                        <td className="border border-black p-2 text-center">{testData.radiationLeakage.settings?.[0]?.kvp || "-"}</td>
                        <td className="border border-black p-2 text-center">mA</td>
                        <td className="border border-black p-2 text-center">{testData.radiationLeakage.settings?.[0]?.ma || "-"}</td>
                        <td className="border border-black p-2 text-center">Time (Sec)</td>
                        <td className="border border-black p-2 text-center">{testData.radiationLeakage.settings?.[0]?.time || "-"}</td>
                      </tr>

                      {/* Header Row 1 */}
                      <tr className="bg-gray-50">
                        <td rowSpan={2} className="border border-black p-2 font-semibold text-center">Location (at 1.0 m from the focus)</td>
                        <td colSpan={5} className="border border-black p-2 font-semibold text-center">Exposure Level (mR/hr)</td>
                        <td rowSpan={2} colSpan={2} className="border border-black p-2 font-semibold text-center">Result</td>
                        <td rowSpan={2} colSpan={2} className="border border-black p-2 font-semibold text-center">Remarks</td>
                      </tr>

                      {/* Header Row 2 - Sub-headers */}
                      <tr className="bg-gray-50">
                        <td className="border border-black p-2 font-semibold text-center">Left</td>
                        <td className="border border-black p-2 font-semibold text-center">Right</td>
                        <td className="border border-black p-2 font-semibold text-center">Top</td>
                        <td className="border border-black p-2 font-semibold text-center">Up</td>
                        <td className="border border-black p-2 font-semibold text-center">Down</td>
                      </tr>

                      {/* Data Rows */}
                      {testData.radiationLeakage.leakageRows.map((row: any, i: number) => {
                        // Use saved remark, or calculate based on maxRadiationLeakage vs tolerance
                        let remarkText = row.remark || "";
                        if (!remarkText) {
                          const tol = parseFloat(testData.radiationLeakage.toleranceValue) || 1;
                          const maxRadLeak = parseFloat(testData.radiationLeakage.maxRadiationLeakage) || 0;
                          remarkText = maxRadLeak <= tol ? "Pass" : "Fail";
                        }

                        return (
                          <tr key={i}>
                            <td className="border border-black p-2 text-center">{row.location || "Tube"}</td>
                            <td className="border border-black p-2 text-center">{row.left || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.right || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.top || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.up || "-"}</td>
                            <td className="border border-black p-2 text-center">{row.down || "-"}</td>
                            <td colSpan={2} className="border border-black p-2 text-center font-medium">{row.max || "-"} mR in one hour</td>
                            <td colSpan={2} className="border border-black p-2 text-center font-medium">{remarkText}</td>
                          </tr>
                        );
                      })}

                      {/* Work Load Row */}
                      <tr>
                        <td colSpan={10} className="border border-black p-2">
                          <span className="font-semibold">Work Load</span> {testData.radiationLeakage.workload || "-"} mAmin in one hr
                        </td>
                      </tr>

                      {/* Max Leakage Calculation */}
                      <tr>
                        <td rowSpan={2} className="border border-black p-2 font-semibold text-center">Max Leakage</td>
                        <td colSpan={4} className="border border-black p-2 text-center">
                          {testData.radiationLeakage.workload || "-"} mAmin in 1 hr X {Math.max(...testData.radiationLeakage.leakageRows.map((r: any) => parseFloat(r.max) || 0)).toFixed(1)}
                        </td>
                        <td colSpan={3} className="border border-black p-2 text-center">max Exposure Level (mR/hr)</td>
                        <td colSpan={2} rowSpan={2} className="border border-black p-2 text-center font-medium">
                          {testData.radiationLeakage.maxLeakageResult || Math.max(...testData.radiationLeakage.leakageRows.map((r: any) => parseFloat(r.max) || 0)).toFixed(3)} mR in one hour
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="border border-black p-2 text-center">
                          60 X {testData.radiationLeakage.settings?.[0]?.ma || "-"}
                        </td>
                        <td colSpan={3} className="border border-black p-2 text-center">mA used for measurement</td>
                      </tr>

                      {/* Maximum Radiation Leakage from Tube Housing */}
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="border border-black p-2 font-semibold">Maximum Radiation Leakage from Tube Housing</td>
                        <td colSpan={2} className="border border-black p-2 text-center font-medium">{testData.radiationLeakage.maxRadiationLeakage || "-"} mGy in one hour</td>
                      </tr>

                      {/* Tolerance Row */}
                      <tr>
                        <td colSpan={10} className="border border-black p-2">
                          <span className="font-semibold">Tolerance:</span> Maximum Leakage Radiation Level at 1 meter from the Focus should be {testData.radiationLeakage.toleranceOperator || "<"} {testData.radiationLeakage.toleranceValue || "1"} mGy (114 mR) in one hour.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            }
            {/* 6. Radiation Protection Survey */}
            {
              testData.radiationSurvey?.locations?.length > 0 && (
                <div className="mb-16 print:mb-12 print:break-inside-avoid">
                  <h3 className="text-xl font-bold uppercase mb-4">6. RADIATION PROTECTION SURVEY</h3>

                  {/* Survey Details Table */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Survey Details</h4>
                    <div className="overflow-x-auto">
                      <table className="border border-black text-sm" style={{ width: 'auto' }}>
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
                  {/* 3. Measured Maximum Radiation Levels */}
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
                          {testData.radiationSurvey.locations.map((loc: any, i: number) => (
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
                  {testData.radiationSurvey.locations?.length > 0 && (() => {
                    const workerLocs = testData.radiationSurvey.locations.filter((loc: any) => loc.category === "worker");
                    const publicLocs = testData.radiationSurvey.locations.filter((loc: any) => loc.category === "public");
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
              )
            }

            {/* No data fallback */}
            {
              Object.values(testData).every(v => !v) && (
                <p className="text-center text-xl text-gray-500 mt-32">
                  No test results available yet.
                </p>
              )
            }
          </div >
        </div >
      </div >

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

export default ViewServiceReportOPG;
