// src/components/reports/ViewServiceReportCBCT.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForCBCT } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
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

          // Transform API data to match component expectations
          const operatingPotentialData = data.AccuracyOfOperatingPotentialCBCT;
          let transformedOperatingPotential = null;

          if (operatingPotentialData) {
            // Transform measurements array to rows array
            const rows = operatingPotentialData.measurements?.map((measurement: any) => ({
              appliedKvp: measurement.appliedKvp || measurement.appliedKVp || "-",
              averageKvp: measurement.averageKvp || measurement.averageKVp || "-",
              measuredValues: measurement.measuredValues || measurement.measured || [],
              remarks: measurement.remarks || measurement.remark || "-",
            })) || [];

            transformedOperatingPotential = {
              ...operatingPotentialData,
              rows: rows,
              toleranceSign: operatingPotentialData.tolerance?.sign || "±",
              toleranceValue: operatingPotentialData.tolerance?.value || "2.0",
              mAStations: operatingPotentialData.mAStations || [],
            };
          }

          // Transform RadiationLeakageTestCBCT data to match component expectations
          const radiationLeakageData = data.RadiationLeakageTestCBCT;
          let transformedRadiationLeakage = null;

          if (radiationLeakageData) {
            // Transform leakageMeasurements array to leakageRows array
            const toleranceValue = parseFloat(radiationLeakageData.toleranceValue || "1");
            const toleranceOperator = radiationLeakageData.toleranceOperator || "<=";

            const leakageRows = radiationLeakageData.leakageMeasurements?.map((measurement: any) => {
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
            }) || [];

            // Handle settings - could be array or single object
            let settingsArray = [];
            if (Array.isArray(radiationLeakageData.settings) && radiationLeakageData.settings.length > 0) {
              settingsArray = radiationLeakageData.settings;
            } else if (radiationLeakageData.settings && typeof radiationLeakageData.settings === 'object') {
              settingsArray = [radiationLeakageData.settings];
            } else if (radiationLeakageData.ffd || radiationLeakageData.kvp || radiationLeakageData.ma || radiationLeakageData.time) {
              // Fallback: create settings array from top-level fields
              settingsArray = [{
                ffd: radiationLeakageData.ffd || "",
                kvp: radiationLeakageData.kvp || radiationLeakageData.kv || "",
                ma: radiationLeakageData.ma || "",
                time: radiationLeakageData.time || "",
              }];
            }

            transformedRadiationLeakage = {
              ...radiationLeakageData,
              leakageRows: leakageRows,
              settings: settingsArray,
              maxLeakageResult: radiationLeakageData.maxLeakageResult || '',
              maxRadiationLeakage: radiationLeakageData.maxRadiationLeakage || '',
            };
          }

          setTestData({
            irradiationTime: data.AccuracyOfIrradiationTimeCBCT || null,
            operatingPotential: transformedOperatingPotential,
            outputConsistency: data.OutputConsistencyForCBCT || null,
            linearityOfMaLoading: data.LinearityOfMaLoadingCBCT || null,
            radiationLeakage: transformedRadiationLeakage,
            radiationSurvey: data.RadiationProtectionSurveyCBCT || null,
            totalFiltration: operatingPotentialData?.totalFiltration || null,
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
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `CBCT-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
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

      <div id="report-content">
        {/* PAGE 1 - MAIN REPORT */}
        <div className="bg-white print:py-0 px-8 py-2 print:px-8 print:py-2" style={{ pageBreakAfter: 'always' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4 print:mb-2">
            <img src={logoA} alt="NABL" className="h-28 print:h-20" />
            <div className="text-right">
              <table className="text-xs border border-gray-600 print:text-[8px]">
                <tbody>
                  <tr><td className="border px-3 py-1 print:px-1 print:py-0 font-bold">SRF No.</td><td className="border px-3 py-1 print:px-1 print:py-0">{report.srfNumber}</td></tr>
                  <tr><td className="border px-3 py-1 print:px-1 print:py-0 font-bold">SRF Date</td><td className="border px-3 py-1 print:px-1 print:py-0">{formatDate(report.srfDate)}</td></tr>
                  <tr><td className="border px-3 py-1 print:px-1 print:py-0 font-bold">ULR No.</td><td className="border px-3 py-1 print:px-1 print:py-0">TC9A43250001485F</td></tr>
                </tbody>
              </table>
            </div>
            <img src={logo} alt="Logo" className="h-28 print:h-20" />
          </div>

          <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[10px] font-bold">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[10px] font-bold">Radiological Safety Division, Mumbai-400094</p>
          </div>

          <h1 className="text-center text-2xl print:text-xl font-bold underline mb-4 print:mb-2">
            QA TEST REPORT FOR DENTAL CONE BEAM CT (CBCT)
          </h1>
          <p className="text-center italic text-sm print:text-[9px] mb-6 print:mb-2">
            (Periodic Quality Assurance as per AERB Guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <div className="border-2 border-gray-600 p-5 print:p-2 text-lg print:text-xs">
              <p className="mb-1"><strong>Customer:</strong> {report.customerName}</p>
              <p><strong>Address:</strong> {report.address}</p>
            </div>
          </section>

          {/* Reference */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
            <table className="w-full border-2 border-gray-600 text-sm print:text-[9px]">
              <tbody>
                <tr><td className="border p-3 print:p-1 font-medium w-1/2">SRF No. & Date</td><td className="border p-3 print:p-1">{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr><td className="border p-3 print:p-1 font-medium">Test Report No. & Issue Date</td><td className="border p-3 print:p-1">{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Equipment Details</h2>
            <table className="w-full border-2 border-gray-600 text-sm print:text-[9px]">
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
                    <td className="border p-3 print:p-1 font-medium w-1/2">{label}</td>
                    <td className="border p-3 print:p-1">{value || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tools Used */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">4. Standards / Tools Used</h2>
            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
              <table className="w-full border-2 border-black text-xs print:text-[9px] compact-table" style={{ tableLayout: 'fixed', width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <thead className="bg-gray-200 print:bg-gray-100">
                  <tr>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '6%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sl No.</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '16%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Nomenclature</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make / Model</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Range</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Certificate No.</th>
                    <th className="border border-black p-2 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
                    <tr key={i}>
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

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForDentalConeBeamCT testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.irradiationTime?.irradiationTimes?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {/* Operating Parameters */}
                <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                  <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                  <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                    FCD: {testData.irradiationTime.testConditions?.fcd || "-"} cm |
                    kV: {testData.irradiationTime.testConditions?.kv || "-"} |
                    mA: {testData.irradiationTime.testConditions?.ma || "-"}
                  </div>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (Sec.)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
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
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{deviation !== "N/A" ? `${deviation}%` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
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
            {testData.operatingPotential?.rows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Operating Potential (kVp)</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                        {testData.operatingPotential.mAStations?.map((s: string) => (
                          <th key={s} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{s}</th>
                        ))}
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.operatingPotential.rows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                          {row.measuredValues?.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
                              {row.remarks || "-"}
                            </span>
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
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Output Consistency</h3>
                {/* Operating Parameters */}
                <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                  <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                  <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                    FFD: {testData.outputConsistency.ffd || "-"} cm
                  </div>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Applied kV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>mAs</th>
                        <th colSpan={testData.outputConsistency.measurementHeaders?.length || testData.outputConsistency.outputRows[0]?.outputs?.length || 3} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          Radiation Output mGy
                        </th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Avg. (X)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Coefficient of Variation CoV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Remarks</th>
                      </tr>
                      <tr>
                        {(testData.outputConsistency.measurementHeaders ||
                          Array.from({ length: testData.outputConsistency.outputRows[0]?.outputs?.length || 3 }, (_, i) => i + 1)
                        ).map((h: string | number, idx: number) => (
                          <th key={idx} className="border border-black p-1 print:p-0.5 text-xs text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            {typeof h === 'number' ? h : idx + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas}</td>
                          {row.outputs.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.cov || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
                              {row.remarks || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> CoV &lt; {testData.outputConsistency.tolerance || "0.05"}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.table2Rows?.length > 0 && (
              <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity of mA Loading</h3>
                {/* Operating Parameters */}
                <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                  <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                  <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                    FCD: {testData.linearityOfMaLoading.table1?.fcd || "-"} cm |
                    kV: {testData.linearityOfMaLoading.table1?.kv || "-"} |
                    Time: {testData.linearityOfMaLoading.table1?.time || "-"} s
                  </div>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas 1</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas 2</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas 3</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Coefficient of Linearity</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMaLoading.table2Rows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma || "-"}</td>
                          {row.measuredOutputs?.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.average || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.col || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
                              {row.remarks || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> Coefficient of Linearity ≤ {testData.linearityOfMaLoading.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Radiation Leakage Test */}
            {testData.radiationLeakage?.leakageRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Radiation Leakage Test</h3>
                {/* Operating Parameters */}
                <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                  <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                  <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                    FFD: {testData.radiationLeakage.settings?.[0]?.ffd || "-"} cm |
                    kVp: {testData.radiationLeakage.settings?.[0]?.kvp || "-"} |
                    mA: {testData.radiationLeakage.settings?.[0]?.ma || "-"} |
                    Time: {testData.radiationLeakage.settings?.[0]?.time || "-"} s
                  </div>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Location</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Left</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Right</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Top</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Up</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Down</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationLeakage.leakageRows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.location || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.left || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.right || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.top || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.up || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.down || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.max || "-"} {row.unit || "mGy/h"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={row.remark === "Pass" ? "text-green-600" : row.remark === "Fail" ? "text-red-600" : ""}>
                              {row.remark || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> Maximum leakage radiation ≤ {testData.radiationLeakage.toleranceValue || "1"} mGy/h ({testData.radiationLeakage.toleranceTime || "1"} hour)
                  </p>
                </div>

                {/* Max Leakage Calculation & Housing */}
                <div className="flex gap-4 mt-6 print:mt-2">
                  {testData.radiationLeakage.workload && testData.radiationLeakage.settings?.[0]?.ma && (
                    <div className="flex-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                      <h4 className="text-sm font-semibold mb-3 print:mb-1 print:text-[10px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Max Leakage Calculation</h4>
                      <div className="flex items-center gap-2 text-sm print:text-[9px]" style={{ fontSize: '10px' }}>
                        <span className="font-medium">{testData.radiationLeakage.workload || "—"}</span>
                        <span>×</span>
                        <span className="font-medium">
                          {Math.max(...testData.radiationLeakage.leakageRows.map((r: any) => parseFloat(r.max) || 0)).toFixed(3) || "—"}
                        </span>
                        <span>÷</span>
                        <span className="font-medium">60</span>
                        <span>×</span>
                        <span className="font-medium">{testData.radiationLeakage.settings?.[0]?.ma || "—"}</span>
                        <span>=</span>
                        <span className="font-medium">{testData.radiationLeakage.maxLeakageResult || "—"}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[10px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Maximum Radiation Leakage from Tube Housing</h4>
                    <div className="flex items-center gap-2">
                      <span className="font-medium print:text-[10px]" style={{ fontSize: '11px' }}>{testData.radiationLeakage.maxRadiationLeakage || "—"}</span>
                      <span className="text-sm text-gray-600 print:text-[9px]" style={{ fontSize: '10px' }}>mGy/h</span>
                    </div>

                    {/* Overall Pass/Fail Status */}
                    {testData.radiationLeakage.maxRadiationLeakage && testData.radiationLeakage.toleranceValue && (
                      <div className="mt-3 pt-3 border-t border-gray-300 print:mt-1 print:pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium print:text-[10px]" style={{ fontSize: '11px' }}>Test Status:</span>
                          {(() => {
                            const maxRadLeak = parseFloat(testData.radiationLeakage.maxRadiationLeakage) || 0;
                            const tol = parseFloat(testData.radiationLeakage.toleranceValue) || 0;
                            const tolOp = testData.radiationLeakage.toleranceOperator || "<=";

                            let isPass = false;
                            if (tolOp === "<=" || tolOp === "less than or equal to") {
                              isPass = maxRadLeak <= tol;
                            } else if (tolOp === ">=" || tolOp === "greater than or equal to") {
                              isPass = maxRadLeak >= tol;
                            } else if (tolOp === "<" || tolOp === "less than") {
                              isPass = maxRadLeak < tol;
                            } else if (tolOp === ">" || tolOp === "greater than") {
                              isPass = maxRadLeak > tol;
                            } else if (tolOp === "=" || tolOp === "equal to") {
                              isPass = Math.abs(maxRadLeak - tol) < 0.001;
                            }

                            return (
                              <span className={`px-3 py-1 rounded text-sm print:text-[9px] font-medium ${isPass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`} style={{ padding: '0px 4px' }}>
                                {isPass ? "PASS" : "FAIL"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationSurvey?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Radiation Protection Survey</h3>

                {/* Survey Details Table */}
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-0.5 print:text-[10px]" style={{ marginBottom: '2px', fontSize: '11px' }}>Survey Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Survey Date</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied Current (mA)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied Voltage (kV)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure Time (s)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Workload (mA·min/week)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Calibration Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(testData.radiationSurvey.surveyDate) || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationSurvey.appliedCurrent || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationSurvey.appliedVoltage || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationSurvey.exposureTime || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationSurvey.workload || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationSurvey.hasValidCalibration || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Measured Maximum Radiation Levels */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[10px]" style={{ marginBottom: '2px', fontSize: '11px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Location</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationSurvey.locations.map((loc: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{loc.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
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
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[10px]" style={{ marginBottom: '2px', fontSize: '11px' }}>4. Calculation Formula</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 print:p-1 bg-gray-50 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
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
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[10px]" style={{ marginBottom: '2px', fontSize: '11px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Category</th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center">
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>For Radiation Worker</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {workerResult || "-"}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center">
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>For Public</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
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
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[10px]" style={{ marginBottom: '2px', fontSize: '11px' }}>6. Permissible Limit</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 print:p-1 font-semibold w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>For location of Radiation Worker</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>20 mSv in a year (40 mR/week)</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>For Location of Member of Public</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>1 mSv in a year (2mR/week)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportCBCT;