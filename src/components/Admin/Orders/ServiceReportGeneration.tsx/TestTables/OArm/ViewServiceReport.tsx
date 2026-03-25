// src/components/reports/ViewServiceReportOArm.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForOArm, saveReportHeader } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MainTestTableForOArm from "./MainTestTableForOArm";

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
  reportULRNumber?: string;
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
  pages?: string;

  // Test documents
  ExposureRateTableTopOArm?: any;
  HighContrastResolutionOArm?: any;
  LowContrastResolutionOArm?: any;
  OutputConsistencyForOArm?: any;
  TotalFilterationForOArm?: any;
  TubeHousingLeakageOArm?: any;
  LinearityOfMasLoadingStationOArm?: any;
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

const ViewServiceReportOArm: React.FC = () => {
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
        const response = await getReportHeaderForOArm(serviceId);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "O-Arm",
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

          // Transform Tube Housing Leakage Data
          const tubeHousingData = data.TubeHousingLeakageOArm;
          let transformedRadiationLeakage = null;

          if (tubeHousingData) {
            const leakageRows = tubeHousingData.leakageMeasurements || tubeHousingData.leakageRows || [];
            const toleranceValue = parseFloat(tubeHousingData.toleranceValue || "1.0");
            const toleranceOperator = tubeHousingData.toleranceOperator || "less than or equal to";

            const processedRows = leakageRows.map((row: any) => {
              const values = [row.left, row.right, row.front, row.back, row.top]
                .map((v: any) => parseFloat(v) || 0)
                .filter((v: number) => v > 0);

              const maxReading = values.length > 0 ? Math.max(...values) : 0;
              const maxStr = maxReading > 0 ? maxReading.toFixed(2) : ""; // Raw max

              // If backend doesn't provide remark, calculate it
              let remark = row.remark;
              if (!remark && maxReading > 0) {
                // Note: true Pass/Fail deps on workload calculation (mGy/h), but if we only have raw values here we might skip
                // However, usually we expect backend/component to save 'max' (mGy/h value hopefully calculated).
                // For now, if 'max' is the mGy value:
                const maxVal = parseFloat(row.max || maxStr); // Assuming row.max is the final calculated mGy/h if present
                if (toleranceOperator === 'less than or equal to') {
                  remark = maxVal <= toleranceValue ? 'Pass' : 'Fail';
                } else if (toleranceOperator === 'greater than or equal to') {
                  remark = maxVal >= toleranceValue ? 'Pass' : 'Fail';
                }
              }

              return {
                ...row,
                max: row.max || maxStr, // Use saved max or calculated raw max
                remark: remark || (maxReading === 0 ? "" : "Pass"), // Fallback if no tolerance check possible
              };
            });

            transformedRadiationLeakage = {
              ...tubeHousingData,
              leakageRows: processedRows,
              maxRadiationLeakage: tubeHousingData.maxRadiationLeakage || tubeHousingData.maxLeakageResult || "",
            };
          }

          // Tube housing: ensure fcd, kv, ma, time from top-level or settings
          if (transformedRadiationLeakage) {
            const sh = tubeHousingData?.settings;
            const firstSettings = Array.isArray(sh) ? sh[0] : sh;
            transformedRadiationLeakage.fcd = transformedRadiationLeakage.fcd ?? firstSettings?.fcd ?? tubeHousingData?.fcd;
            transformedRadiationLeakage.kv = transformedRadiationLeakage.kv ?? firstSettings?.kv ?? tubeHousingData?.kv;
            transformedRadiationLeakage.ma = transformedRadiationLeakage.ma ?? firstSettings?.ma ?? tubeHousingData?.ma;
            transformedRadiationLeakage.time = transformedRadiationLeakage.time ?? firstSettings?.time ?? tubeHousingData?.time;
          }

          // Extract test data from populated response
          setTestData({
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeOArm || null,
            exposureRateTableTop: data.ExposureRateTableTopOArm || null,
            highContrastResolution: data.HighContrastResolutionOArm || null,
            lowContrastResolution: data.LowContrastResolutionOArm || null,
            outputConsistency: data.OutputConsistencyForOArm || null,
            totalFilteration: data.TotalFilterationForOArm || null,
            operatingPotential: data.TotalFilterationForOArm || null,
            tubeHousingLeakage: transformedRadiationLeakage,
            linearityOfMasLoading: data.LinearityOfmAsLoadingOArm || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load O-Arm report:", err);
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

      const canvas = await html2canvas(element, {
        scale: 1.5, // Optimized for smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
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

      pdf.save(`OArm-Report-${report?.testReportNumber || "report"}.pdf`);
      const { estimateReportPages } = await import("../../../../../../utils/generatePDF");
      const pageCount = estimateReportPages("report-content");
      const response = await getReportHeaderForOArm(serviceId!);
      if (response?.exists && response?.data && report) {
        const d = response.data as any;
        const payload = {
          customerName: d.customerName,
          address: d.address,
          srfNumber: d.srfNumber,
          srfDate: d.srfDate,
          testReportNumber: d.testReportNumber,
          issueDate: d.issueDate,
          nomenclature: d.nomenclature,
          make: d.make,
          model: d.model,
          slNumber: d.slNumber,
          condition: d.condition,
          testingProcedureNumber: d.testingProcedureNumber,
          engineerNameRPId: d.engineerNameRPId,
          testDate: d.testDate,
          testDueDate: d.testDueDate,
          location: d.location,
          temperature: d.temperature,
          humidity: d.humidity,
          toolsUsed: d.toolsUsed,
          notes: d.notes,
          pages: String(pageCount),
        };
        await saveReportHeader(serviceId!, payload);
        setReport((prev) => (prev ? { ...prev, pages: String(pageCount) } : null));
      }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading O-Arm Report...</div>;

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
                      <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.reportULRNumber || "N/A"}</td>
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
              QA TEST REPORT FOR O-ARM X-RAY EQUIPMENT
            </h1>
            <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
              (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
            </p>

            {/* Customer Details */}
            <section className="mb-4 print:mb-2">
              <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
              <div className="border-2 border-black p-2 print:p-1 text-sm print:text-[11px]" style={{ fontSize: '11px', padding: '4px 8px' }}>
                <p style={{ margin: '2px 0' }}><strong>Customer:</strong> {report.customerName}</p>
                <p style={{ margin: '2px 0' }}><strong>Address:</strong> {report.address}</p>
              </div>
            </section>

            {/* Reference */}
            <section className="mb-4 print:mb-2">
              <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <tbody>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td>
                  </tr>
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
                    ["No. of Pages", report.pages ?? "-"],
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
                  <thead>
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
            <section className="mb-8 print:mb-4">
              <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">5. Notes</h2>
              <div className="ml-8 text-sm print:text-[10px]" style={{ fontSize: '10px' }}>
                {notesArray.map(n => (
                  <p key={n.slNo} style={{ margin: '2px 0' }}><strong>{n.slNo}.</strong> {n.text}</p>
                ))}
              </div>
            </section>

            {/* Signature */}
            <div className="flex justify-between items-end mt-12 print:mt-8">
              <img src={AntesoQRCode} alt="QR" className="h-24 print:h-16" />
              <div className="text-center">
                <img src={Signature} alt="Signature" className="h-20 print:h-12 mx-auto mb-2 print:mb-1" />
                <p className="font-bold print:text-xs">Authorized Signatory</p>
              </div>
            </div>

            <footer className="text-center text-xs print:text-[8px] text-gray-600 mt-8 print:mt-4" style={{ fontSize: '9px' }}>
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
            <MainTestTableForOArm testData={testData} />
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
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Total Filtration — Accuracy of Operating Potential table + Total Filtration result (like RadiographyFixed) */}
            {testData.totalFilteration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Total Filtration</h3>
                {testData.totalFilteration.measurements?.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Accuracy of Operating Potential</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead>
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                            {testData.totalFilteration.mAStations?.map((ma: string, idx: number) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{ma}</th>
                            ))}
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.totalFilteration.measurements.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                              {testData.totalFilteration.mAStations?.map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredValues?.[idx] || "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remarks || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {testData.totalFilteration.tolerance && (
                      <div className="p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                          <strong>Tolerance:</strong> {testData.totalFilteration.tolerance.sign || "±"} {testData.totalFilteration.tolerance.value || "-"}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {testData.totalFilteration.totalFiltration && (
                  <div className="p-6 print:p-1 rounded-lg border" style={{ padding: '2px 4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Total Filtration</h4>
                    <div className="space-y-2 print:space-y-0">
                      <p className="text-base print:text-[9px]" style={{ fontSize: '11px' }}>
                        <strong>Measured:</strong> {testData.totalFilteration.totalFiltration.measured || "-"} mm Al
                      </p>
                      <p className="text-base print:text-[9px]" style={{ fontSize: '11px' }}>
                        <strong>Required:</strong> {testData.totalFilteration.totalFiltration.required || "-"} mm Al
                        {testData.totalFilteration.totalFiltration.atKvp ? ` (at ${testData.totalFilteration.totalFiltration.atKvp} kVp)` : ""}
                      </p>
                    </div>
                    {testData.totalFilteration.filtrationTolerance && (
                      <p className="text-sm mt-2 print:text-[9px]" style={{ fontSize: '11px' }}>
                        <strong>Tolerance for Total Filtration:</strong> {testData.totalFilteration.filtrationTolerance.forKvGreaterThan70 || "1.5"} mm Al for kV &lt; {testData.totalFilteration.filtrationTolerance.kvThreshold1 || "70"}; {testData.totalFilteration.filtrationTolerance.forKvBetween70And100 || "2.0"} mm Al for {testData.totalFilteration.filtrationTolerance.kvThreshold1 || "70"} ≤ kV ≤ {testData.totalFilteration.filtrationTolerance.kvThreshold2 || "100"}; {testData.totalFilteration.filtrationTolerance.forKvGreaterThan100 || "2.5"} mm Al for kV &gt; {testData.totalFilteration.filtrationTolerance.kvThreshold2 || "100"}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Output Consistency — same columns as Generate: parameters + kVp, mA, Meas 1..N, Mean, COV, Remark */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Consistency of Radiation Output</h3>
                {testData.outputConsistency.parameters && (
                  <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>FFD (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Time (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.outputConsistency.parameters.ffd ?? "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.outputConsistency.parameters.time ?? "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.outputRows?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          {(() => {
                            const hdr = testData.outputConsistency.measurementHeaders;
                            const arr = Array.isArray(hdr) && hdr.length > 0 ? hdr : (testData.outputConsistency.outputRows[0]?.outputs && Array.isArray(testData.outputConsistency.outputRows[0].outputs))
                              ? Array.from({ length: testData.outputConsistency.outputRows[0].outputs.length }, (_, i) => `Meas ${i + 1}`)
                              : [];
                            return arr.map((h: string, hi: number) => (
                            <th key={hi} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{h}</th>
                          ));
                          })()}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mean (X̄)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>COV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => {
                          const outputs = Array.isArray(row.outputs) ? row.outputs : (row.outputs && typeof row.outputs === 'object' && !Array.isArray(row.outputs) ? Object.values(row.outputs) : []);
                          const headers = testData.outputConsistency.measurementHeaders || outputs.map((_: any, idx: number) => `Meas ${idx + 1}`);
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma || "-"}</td>
                              {headers.map((_: string, hi: number) => (
                                <td key={hi} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{outputs[hi] ?? row[`meas${hi + 1}`] ?? "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                {(() => {
                                  const covVal = row.cov ?? row.cv;
                                  if (covVal != null && covVal !== "") return covVal;

                                  const values: number[] = (Array.isArray(row.outputs) ? row.outputs : [])
                                    .map((v: any) => {
                                      if (v == null) return NaN;
                                      if (typeof v === "number") return v;
                                      if (typeof v === "string") return parseFloat(v);
                                      if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                                      return NaN;
                                    })
                                    .filter((n: number) => !Number.isNaN(n));

                                  if (values.length === 0) return "-";
                                  const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                                  if (!mean) return "-";
                                  const variance = values.reduce((sum: number, n: number) => sum + Math.pow(n - mean, 2), 0) / values.length;
                                  const stdDev = Math.sqrt(variance);
                                  const computedCov = stdDev / mean;
                                  return Number.isFinite(computedCov) ? computedCov.toFixed(4) : "-";
                                })()}
                              </td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remark === "Pass" ? "text-green-600" : row.remark === "Fail" ? "text-red-600" : ""}>
                                  {row.remark || "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.tolerance != null && testData.outputConsistency.tolerance !== '' && (
                  <p className="text-sm mb-1" style={{ fontSize: '11px' }}><strong>Tolerance (COV):</strong> Less than or equal to {testData.outputConsistency.tolerance}</p>
                )}
              </div>
            )}

            {/* 4. High Contrast Resolution — as table */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. High Contrast Resolution</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 print:p-1 font-medium" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>Measured Resolution (lp/mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{testData.highContrastResolution.measuredLpPerMm || "-"}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 font-medium" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>Recommended Standard (lp/mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{testData.highContrastResolution.recommendedStandard || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Low Contrast Resolution — as table */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Low Contrast Resolution</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 print:p-1 font-medium" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>Smallest Hole Size (mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{testData.lowContrastResolution.smallestHoleSize || "-"}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 font-medium" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>Recommended Standard (mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{testData.lowContrastResolution.recommendedStandard || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Exposure Rate at Table Top */}
            {testData.exposureRateTableTop && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Exposure Rate at Table Top</h3>
                {testData.exposureRateTableTop.rows?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.exposureRateTableTop.rows.map((row: any, i: number) => {
                          const aecTol = parseFloat(testData.exposureRateTableTop.aecTolerance || "10") || 0;
                          const nonAecTol = parseFloat(testData.exposureRateTableTop.nonAecTolerance || "5") || 0;
                          const exp = parseFloat(row.exposure);
                          let result = row.result;
                          if (result === undefined || result === null || result === "") {
                            if (!isNaN(exp) && row.remark) {
                              const pass = (row.remark === "AEC Mode" && exp <= aecTol) || (row.remark === "Manual Mode" && exp <= nonAecTol);
                              result = pass ? "PASS" : "FAIL";
                            } else result = "-";
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={result === "PASS" ? "text-green-600" : result === "FAIL" ? "text-red-600" : ""}>
                                  {result || "-"}
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

            {/* 7. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (() => {
              const data = testData.tubeHousingLeakage;
              const rows = data.leakageRows || data.leakageMeasurements || [];
              const tubeRow = rows.find((m: any) => m.location === 'Tube');
              const collimatorRow = rows.find((m: any) => m.location === 'Collimator');
              const tubeMax = parseFloat(tubeRow?.max) || 0;
              const collimatorMax = parseFloat(collimatorRow?.max) || 0;
              const overallMax = Math.max(tubeMax, collimatorMax, ...rows.map((r: any) => parseFloat(r.max) || 0));
              const workloadVal = parseFloat(data.workload) || 0;
              const maVal = parseFloat(data.ma) || 0;
              const highestLeakageMR = data.highestLeakageMR || (maVal > 0 && workloadVal > 0 ? ((workloadVal * overallMax) / (60 * maVal)).toFixed(4) : "-");
              const maxLeakageTubeMGy = data.maxLeakageTubeMGy ?? tubeRow?.mgy ?? "-";
              const maxLeakageCollimatorMGy = data.maxLeakageCollimatorMGy ?? collimatorRow?.mgy ?? "-";
              const tdStyle = { padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' as const };
              return (
                <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Tube Housing Leakage</h3>
                  <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 font-medium text-center" style={tdStyle}>FDD (cm)</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{data.fcd || "-"}</td>
                          <td className="border border-black p-2 print:p-1 font-medium text-center" style={tdStyle}>kV</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{data.kv || "-"}</td>
                          <td className="border border-black p-2 print:p-1 font-medium text-center" style={tdStyle}>mA</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{data.ma || "-"}</td>
                          <td className="border border-black p-2 print:p-1 font-medium text-center" style={tdStyle}>Time (Sec)</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{data.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 0 && (
                    <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead>
                          <tr>
                            <th className="border border-black border-b-0 p-2 print:p-1 text-center" style={tdStyle}>Location<br />(at 1.0 m<br />from the<br />focus)</th>
                            <th colSpan={5} className="border border-black p-2 print:p-1 text-center" style={tdStyle}>Exposure Level (mR/hr)</th>
                            <th className="border border-black border-b-0 p-2 print:p-1 text-center" style={tdStyle}>Result</th>
                            <th className="border border-black border-b-0 p-2 print:p-1 text-center" style={tdStyle}>Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black border-t-0 p-2 print:p-1 text-center" style={tdStyle}></th>
                            <th className="border border-black p-2 print:p-1 text-center" style={tdStyle}>Left</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={tdStyle}>Right</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={tdStyle}>Front</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={tdStyle}>Back</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={tdStyle}>Top</th>
                            <th className="border border-black border-t-0 p-2 print:p-1 text-center" style={tdStyle}></th>
                            <th className="border border-black border-t-0 p-2 print:p-1 text-center" style={tdStyle}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const resultMGy = row.location === 'Tube' ? maxLeakageTubeMGy : row.location === 'Collimator' ? maxLeakageCollimatorMGy : (row.mgy ?? "-");
                            return (
                              <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                <td className="border border-black p-2 print:p-1 text-center font-medium" style={tdStyle}>{row.location || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{row.left || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{row.right || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{row.front || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{row.back || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{row.top || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{resultMGy} mGy in one hour</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>
                                  <span className={row.remark === "Pass" ? "text-green-600 font-semibold" : row.remark === "Fail" ? "text-red-600 font-semibold" : ""}>{row.remark || "-"}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ ...tdStyle, width: 'auto' }} colSpan={6}>
                            <strong>Work Load:</strong> {data.workload || "-"} mAmin in one hr
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td rowSpan={2} className="border border-black p-2 print:p-1 text-center font-medium" style={{ width: '80px', ...tdStyle }}>Max<br />Leakage =</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>{data.workload || "-"} mAmin in 1 hr X {overallMax > 0 ? overallMax.toFixed(2) : "-"}</td>
                          <td rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ width: '180px', ...tdStyle }}>max Exposure Level (mR/hr)<br /><span className="border-t border-black inline-block w-full mt-1 pt-1">mA used for measurement</span></td>
                          <td rowSpan={2} className="border border-black p-2 print:p-1 text-center font-semibold" style={tdStyle}>{highestLeakageMR} mR in one hour</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={tdStyle}>60 X {data.ma || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {(data.toleranceValue != null && data.toleranceValue !== '') && (
                    <div className="p-3 rounded border" style={{ fontSize: '11px' }}>
                      <p><strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be {data.toleranceOperator === 'less than or equal to' ? '≤ ' : data.toleranceOperator === 'greater than or equal to' ? '≥ ' : ''}{data.toleranceValue || "1"} mGy (114 mR) in one hour.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 8. Linearity of mAs Loading — table1 (Test Conditions) + table2 with Measured Values like RadiographyFixed */}
            {testData.linearityOfMasLoading && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. Linearity of mAs Loading</h3>
                {testData.linearityOfMasLoading.table1 && testData.linearityOfMasLoading.table1.length > 0 && (
                  <div className="mb-6 print:mb-1 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '4px' }}>Test Conditions:</p>
                    <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      FCD: {testData.linearityOfMasLoading.table1[0]?.fcd || "-"} cm | kV: {testData.linearityOfMasLoading.table1[0]?.kv || "-"} | Time: {testData.linearityOfMasLoading.table1[0]?.time || "-"} sec
                    </div>
                  </div>
                )}
                {testData.linearityOfMasLoading.table2?.length > 0 && (() => {
                  const lin = testData.linearityOfMasLoading;
                  const measHeadersArr = lin.measHeaders && Array.isArray(lin.measHeaders) ? lin.measHeaders : [];
                  const numMeas = measHeadersArr.length || Math.max(0, ...(lin.table2 || []).map((r: any) => (r.measuredOutputs && Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0)));
                  const formatVal = (val: any) => (val === undefined || val === null || String(val).trim() === "" ? "-" : String(val));
                  return (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs Applied</th>
                          {Array.from({ length: numMeas }, (_, idx) => (
                            <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{measHeadersArr[idx] || `Meas ${idx + 1}`}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average Output</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X (mGy/mAs)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Max</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Min</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lin.table2.map((row: any, i: number) => {
                          const outputs = row.measuredOutputs && Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatVal(row.mAsApplied)}</td>
                              {Array.from({ length: numMeas }, (_, idx) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatVal(outputs[idx])}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatVal(row.average)}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatVal(row.x)}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={lin.table2.length} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', verticalAlign: 'middle', borderColor: '#000000', textAlign: 'center' }}>{formatVal(lin.xMax)}</td>
                                  <td rowSpan={lin.table2.length} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', verticalAlign: 'middle', borderColor: '#000000', textAlign: 'center' }}>{formatVal(lin.xMin)}</td>
                                  <td rowSpan={lin.table2.length} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', verticalAlign: 'middle', borderColor: '#000000', textAlign: 'center' }}>{formatVal(lin.col)}</td>
                                  <td rowSpan={lin.table2.length} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', verticalAlign: 'middle', borderColor: '#000000', textAlign: 'center' }}>{formatVal(lin.remarks)}</td>
                                </>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  );
                })()}
                {testData.linearityOfMasLoading.tolerance != null && testData.linearityOfMasLoading.tolerance !== '' && (
                  <div className="p-4 print:p-1 rounded border" style={{ fontSize: '11px' }}>
                    <p className="text-sm print:text-[9px]"><strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || "≤"} {testData.linearityOfMasLoading.tolerance || "0.1"}</p>
                  </div>
                )}
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

export default ViewServiceReportOArm;
