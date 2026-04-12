// src/components/reports/ViewServiceReportDentalIntra.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForDentalIntra, getAccuracyOfIrradiationTimeByServiceIdForDentalIntra } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForDentalIntra from "./MainTestTableForDentalIntra";

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
  rpId?: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  category: string;

  AccuracyOfOperatingPotentialAndTimeDentalIntra?: any;
  AccuracyOfIrradiationTimeDentalIntra?: any;
  LinearityOfTimeDentalIntra?: any;
  ReproducibilityOfRadiationOutputDentalIntra?: any;
  TubeHousingLeakageDentalIntra?: any;
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

const ViewServiceReportDentalIntra: React.FC = () => {
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
        const response = await getReportHeaderForDentalIntra(serviceId);

        console.log("Raw API Response:", response);

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
            nomenclature: data.nomenclature || "Dental (Intra Oral)",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: data.rpId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
            category: data.category || "",
          });

          const accuracyData = data.AccuracyOfOperatingPotentialAndTimeDentalIntra || null;
          if (accuracyData && accuracyData.rows) {
            console.log("Accuracy data loaded:", accuracyData);
            console.log("First row:", accuracyData.rows[0]);
          }
          // Normalize Leakage Data
          const leakageData = data.TubeHousingLeakageDentalIntra || data.RadiationLeakageTestDentalIntra || null;
          let normalizedLeakage = null;

          if (leakageData) {
            // Check if it's the newer model (RadiationLeakageTestDentalIntra)
            if (leakageData.toleranceValue) {
              normalizedLeakage = {
                ...leakageData,
                measurementSettings: leakageData.settings?.[0] ? {
                  distance: leakageData.settings[0].ffd,
                  kv: leakageData.settings[0].kvp,
                  ma: leakageData.settings[0].ma,
                  time: leakageData.settings[0].time
                } : {},
                workload: {
                  value: leakageData.workload,
                  unit: leakageData.workloadUnit
                },
                tolerance: {
                  value: leakageData.toleranceValue,
                  operator: leakageData.toleranceOperator,
                  time: leakageData.toleranceTime
                },
                calculatedResult: {
                  maxLeakageIntermediate: leakageData.maxLeakageResult,
                  finalLeakageRate: leakageData.maxRadiationLeakage,
                  remark: leakageData.leakageMeasurements?.[0]?.remark || ""
                }
              };
            } else {
              normalizedLeakage = leakageData;
            }
          }

          setTestData({
            accuracyOfOperatingPotentialAndTime: data.AccuracyOfOperatingPotentialAndTimeDentalIntra || null,
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeDentalIntra || null,
            linearityOfTime: data.LinearityOfTimeDentalIntra || null,
            linearityOfMasLoading: data.LinearityOfmAsLoadingDentalIntra || null,
            reproducibilityOfRadiationOutput: data.ReproducibilityOfRadiationOutputDentalIntra || null,
            tubeHousingLeakage: data.TubeHousingLeakageDentalIntra || null,
            radiationLeakageLevel: data.RadiationLeakageTestDentalIntra || null,
            radiationProtectionSurvey: data.RadiationProtectionSurveyDentalIntra || null,
          });

          // Fetch irradiation time directly to get testConditions (fcd, kv, ma)
          try {
            const irradRes = await getAccuracyOfIrradiationTimeByServiceIdForDentalIntra(serviceId);
            const irradData = irradRes?.data?.data || irradRes?.data || irradRes;
            if (irradData && typeof irradData === "object") {
              const tc = irradData.testConditions || {};
              setTestData((prev: any) => ({
                ...prev,
                accuracyOfIrradiationTime: {
                  ...irradData,
                  testConditions: {
                    fcd: tc.fcd ?? tc.ffd ?? "",
                    kv: tc.kv ?? "",
                    ma: tc.ma ?? "",
                  },
                },
              }));
            }
          } catch { /* ignore */ }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Dental Intra report:", err);
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
        filename: `DentalIntra-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Dental Intra Report...</div>;

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

  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "4px 6px",
    fontSize: "11px",
    lineHeight: "1.3",
    minHeight: "0",
    height: "auto",
    borderColor: "#000",
    textAlign: "center",
    verticalAlign: "middle",
    fontWeight: 400,
    boxSizing: "border-box",
    ...extra,
  });

  const tableStyle: React.CSSProperties = {
    fontSize: "11px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    borderSpacing: "0",
    width: "100%",
    border: "0.1px solid #666",
    textAlign: "center",
  };

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        {/* <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Print
        </button> */}
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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.reportULRNumber || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <img src={logo} alt="Logo" className="h-28 print:h-20" />
          </div>

          {/* <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div> */}

          <h1 className="text-center text-2xl font-bold underline mb-4 print:mb-2 print:text-base" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR DENTAL INTRAORAL X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance shall be carried out at least once in five years as per AERB guidelines)
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
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ["RP ID", report.rpId || "-"],
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

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForDentalIntra testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

  {/* 2b. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2) && testData.linearityOfMasLoading.table2.length > 0 && (() => {
              const processedRows = testData.linearityOfMasLoading.table2 || [];
              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2b. Linearity of mAs Loading</h3>

                  {testData.linearityOfMasLoading.table1 && (
                    <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        Applied Potential: {testData.linearityOfMasLoading.table1.kv || "-"} kV |
                        FCD: {testData.linearityOfMasLoading.table1.fcd || "-"} cm |
                        Timer: {testData.linearityOfMasLoading.table1.time || "N/A"}
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                          {(Array.isArray(processedRows[0]?.measuredOutputs) ? processedRows[0].measuredOutputs : []).map((_: any, idx: number) => (
                            <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.5)' }}>Average</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(254, 249, 195, 0.5)' }}>X (mGy/mAs)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Max</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Min</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma || "-"}</td>
                            {(row.measuredOutputs || []).map((val: string, idx: number) => (
                              <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                            ))}
                            <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.3)' }}>{row.average || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(254, 249, 195, 0.3)' }}>{row.x || "-"}</td>
                            {i === 0 && (
                              <>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfMasLoading?.table2?.[0]?.xMax || "-"}
                                </td>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfMasLoading?.table2?.[0]?.xMin || "-"}
                                </td>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 font-semibold text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfMasLoading?.table2?.[0]?.col || "-"}
                                </td>
                                <td rowSpan={processedRows.length} className={`border border-black p-2 print:p-1 font-bold text-center align-middle ${testData.linearityOfMasLoading?.table2?.[0]?.remarks === "Pass" ? "text-green-600" : "text-red-600"}`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                  {testData.linearityOfMasLoading?.table2?.[0]?.remarks || "-"}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfMasLoading?.tolerance || "0.1"}
                    </p>
                  </div>
                </div>
              );
            })()}


    {/* 1a. Accuracy of Irradiation Time - separate table */}
                  <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                    <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {(() => {
                  const irrad = testData.accuracyOfIrradiationTime;
                  const aop = testData.accuracyOfOperatingPotentialAndTime;
                  const tcI = irrad?.testConditions || {};
                  const tcA = aop?.testConditions || {};
                  const fdd = tcI.fcd || tcI.fdd || tcI.ffd || tcA.fcd || tcA.fdd || tcA.ffd || "";
                  const kvTc = tcI.kv || tcA.kv || "";
                  const maTc = tcI.ma || tcA.ma || "";
                  const hasTc = !!(fdd || kvTc || maTc);
                  return (
                    <>
                      {hasTc && (
                        <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                          <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                          <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                            <thead className="bg-gray-100"><tr>
                              <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                              <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                              <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                            </tr></thead>
                            <tbody><tr>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{fdd || "-"}</td>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{kvTc || "-"}</td>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{maTc || "-"}</td>
                            </tr></tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })()}
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (s)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (s)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((testData.accuracyOfIrradiationTime?.rows || testData.accuracyOfOperatingPotentialAndTime?.rows) || []).map((row: any, i: number) => {
                            const calcError = (set: string, meas: string): string => {
                              const s = parseFloat(set);
                              const m = parseFloat(meas);
                              if (isNaN(s) || isNaN(m) || s === 0) return "-";
                              return Math.abs(((m - s) / s) * 100).toFixed(2);
                            };

                            const measuredValue = String(row.maStations?.[0]?.time ?? row.avgTime ?? '');
                            const errorPct = calcError(String(row.setTime ?? ''), measuredValue);
                            const remark = row.remark || "-";

                            return (
                              <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{measuredValue || "-"}</td>
                                <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{errorPct !== "-" ? `${errorPct}%` : "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  <span className={remark === "PASS" || remark === "Pass" ? "text-green-600 font-semibold" : remark === "FAIL" || remark === "Fail" ? "text-red-600 font-semibold" : "text-gray-600"}>
                                    {remark}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Tolerance:</strong> Error{" "}
                        {testData.accuracyOfIrradiationTime?.tolerance?.operator ||
                          testData.accuracyOfIrradiationTime?.timeToleranceSign ||
                          testData.accuracyOfOperatingPotentialAndTime?.timeToleranceSign ||
                          "<="}{" "}
                        {testData.accuracyOfIrradiationTime?.tolerance?.value ??
                          testData.accuracyOfIrradiationTime?.timeToleranceValue ??
                          testData.accuracyOfOperatingPotentialAndTime?.timeToleranceValue ??
                          "10"}
                        %
                      </p>
                    </div>
                  </div>
            {/* 1. Accuracy of Operating Potential - separate table like RadiographyFixed */}
            {testData?.accuracyOfOperatingPotentialAndTime?.rows && Array.isArray(testData.accuracyOfOperatingPotentialAndTime.rows) && testData.accuracyOfOperatingPotentialAndTime.rows.length > 0 && (() => {
              const maxStations = Math.max(
                ...(testData.accuracyOfOperatingPotentialAndTime?.rows || []).map((row: any) => {
                  if (row.maStations && Array.isArray(row.maStations) && row.maStations.length > 0) return row.maStations.length;
                  if (row.maStation1 || row.maStation2) return 2;
                  return 0;
                }),
                2
              );
              return (
                <>
                  <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                    <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Operating Potential</h3>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                            {Array.from({ length: maxStations }).map((_, idx) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA Station {idx + 1}</th>
                            ))}
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(testData.accuracyOfOperatingPotentialAndTime?.rows || []).map((row: any, i: number) => {
                            let stations: any[] = row.maStations && Array.isArray(row.maStations) ? row.maStations : (row.maStation1 || row.maStation2 ? [row.maStation1 || { kvp: "" }, row.maStation2 || { kvp: "" }] : []);
                            while (stations.length < maxStations) stations.push({ kvp: "" });
                            return (
                              <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || row.appliedkVp || "-"}</td>
                                {stations.map((s: any, idx: number) => (
                                  <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{typeof s === 'object' ? (s?.kvp ?? "") : ""}</td>
                                ))}
                                <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  <span className={row.remark === "PASS" ? "text-green-600" : row.remark === "FAIL" ? "text-red-600" : "text-gray-600"}>{row.remark || "-"}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}><strong>kVp Tolerance:</strong> {testData.accuracyOfOperatingPotentialAndTime?.kvpToleranceSign || "±"} {testData.accuracyOfOperatingPotentialAndTime?.kvpToleranceValue || "5"} kV</p>
                    </div>
                  </div>

              

                  {/* 1b. Total Filtration - separate section like RadiographyFixed */}
                  {testData.accuracyOfOperatingPotentialAndTime?.totalFiltration && (testData.accuracyOfOperatingPotentialAndTime.totalFiltration.measured1 != null || testData.accuracyOfOperatingPotentialAndTime.totalFiltration.measured != null) && (() => {
                    const tf = testData.accuracyOfOperatingPotentialAndTime.totalFiltration;
                    const ft = testData.accuracyOfOperatingPotentialAndTime.filtrationTolerance || {};
                    const kvp = parseFloat(tf.atKvp ?? "");
                    const measured = parseFloat(tf.measured1 ?? tf.measured ?? "");
                    const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
                    const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");

                    let requiredTol = parseFloat(tf.measured2 ?? tf.required ?? "2.5");
                    if (!isNaN(kvp)) {
                      if (kvp < threshold1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                      else if (kvp >= threshold1 && kvp <= threshold2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                      else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                    }

                    const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                      ? (measured >= requiredTol ? "PASS" : "FAIL")
                      : "-";

                    return (
                      <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                        <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Total Filtration</h3>
                        <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                          <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <tbody>
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>At kVp</td>
                                <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>{tf.atKvp || "-"} kVp</td>
                              </tr>
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                                <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.measured1 ?? tf.measured ?? "-"} mm Al</td>
                              </tr>
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
                                <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                  {!isNaN(requiredTol) ? `≥ ${requiredTol} mm Al` : "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
                                <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                  <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>
                                    {filtrationRemark}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {/* Filtration Tolerance Reference */}
                          <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                            <span className="font-semibold">Tolerance criteria: </span>
                            {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} |&nbsp;
                            {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} ≤ kV ≤ {ft.kvThreshold2 ?? "100"} |&nbsp;
                            {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            })()}

            {/* 2. Linearity of mAs loading */}
            {testData.linearityOfTime?.table2 && Array.isArray(testData.linearityOfTime.table2) && testData.linearityOfTime.table2.length > 0 && (() => {
              const ma = parseFloat(testData.linearityOfTime.table1?.ma || "0");
              const processedRows = (testData.linearityOfTime.table2 || []).map((row: any) => {
                let x = row.x;
                if (!x || x === "-" || x === "") {
                  const outputs = (row.measuredOutputs || []).map((v: string) => parseFloat(v)).filter((v: number) => !isNaN(v) && v > 0);
                  const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : 0;
                  const time = parseFloat(row.time || "0");
                  const mAs = ma > 0 && time > 0 ? ma * time : 0;
                  x = avg > 0 && mAs > 0 ? (avg / mAs).toFixed(4) : "-";
                }
                return { ...row, x };
              });

              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity of mAs loading</h3>

                  {testData.linearityOfTime?.table1 && (
                    <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                      <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                      <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>time(sec)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.linearityOfTime.table1.fcd || "-"}</td>
                            <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.linearityOfTime.table1.kv || "-"}</td>
                            <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.linearityOfTime.table1.ma || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          {(Array.isArray(processedRows[0]?.measuredOutputs) ? processedRows[0].measuredOutputs : []).map((_: any, idx: number) => (
                            <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.5)' }}>Average</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(254, 249, 195, 0.5)' }}>X </th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Max</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Min</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.time || "-"}</td>
                            {(row.measuredOutputs || []).map((val: string, idx: number) => (
                              <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                            ))}
                            <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.3)' }}>{row.average || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(254, 249, 195, 0.3)' }}>{row.x || "-"}</td>
                            {i === 0 && (
                              <>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfTime?.xMax || "-"}
                                </td>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfTime?.xMin || "-"}
                                </td>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 font-semibold text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {testData.linearityOfTime?.col || "-"}
                                </td>
                                <td rowSpan={processedRows.length} className="border border-black p-2 print:p-1 font-bold text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                  <span className={testData.linearityOfTime?.remarks === "Pass" ? "text-green-600" : testData.linearityOfTime?.remarks === "Fail" ? "text-red-600" : "text-gray-600"}>
                                    {testData.linearityOfTime?.remarks || "-"}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfTime?.tolerance || "0.1"}
                    </p>
                  </div>
                </div>
              );
            })()}

          

            {/* 3. Consistency of Radiation Output */}
            {testData.reproducibilityOfRadiationOutput?.outputRows && Array.isArray(testData.reproducibilityOfRadiationOutput.outputRows) && testData.reproducibilityOfRadiationOutput.outputRows.length > 0 && (() => {
              const rows = testData.reproducibilityOfRadiationOutput.outputRows;
              const measHeaders = Array.isArray(rows[0]?.outputs) ? rows[0].outputs.map((_: any, idx: number) => `Meas ${idx + 1}`) : [];
              const tolVal = parseFloat(testData.reproducibilityOfRadiationOutput.tolerance?.value ?? '0.05') || 0.05;
              const tolOp = testData.reproducibilityOfRadiationOutput.tolerance?.operator ?? '<=';

              const getVal = (o: any): number => {
                if (o == null) return NaN;
                if (typeof o === 'number') return o;
                if (typeof o === 'string') return parseFloat(o);
                if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                return NaN;
              };

              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Consistency of Radiation Output</h3>

                  {/* FFD Table */}
                  {testData.reproducibilityOfRadiationOutput?.ffd && (
                    <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.reproducibilityOfRadiationOutput.ffd}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                          {measHeaders.map((header: string, idx: number) => (
                            <th key={idx} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{header}</th>
                          ))}
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (X̄)</th>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>CoV</th>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row: any, i: number) => {
                          const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
                          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                          const avgDisplay = avg !== null ? avg.toFixed(4) : (row.avg || (row.averageOutput || '-'));
                          let covDisplay = '-';
                          let remark = row.remark || row.remarks || '-';

                          if (avg !== null && avg > 0) {
                            const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
                            const cov = Math.sqrt(variance) / avg;
                            if (isFinite(cov)) {
                              covDisplay = cov.toFixed(3);
                              const t = (tolVal >= 1 ? tolVal / 100 : tolVal);
                              const passes = (tolOp === '<=' || tolOp === '<') ? cov <= t : cov >= t;
                              remark = passes ? 'Pass' : 'Fail';
                            }
                          } else if (row.cv || row.cov) {
                            covDisplay = String(row.cv || row.cov);
                          }

                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || '-'}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || '-'}</td>
                              {(row.outputs ?? []).map((output: any, idx: number) => {
                                const val = typeof output === 'object' && 'value' in output ? output.value : String(output);
                                return (
                                  <td key={idx} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{val || '-'}</td>
                                );
                              })}
                              {/* Empty cells if some rows have fewer measurements */}
                              {Array.from({ length: measHeaders.length - (row.outputs ?? []).length }).map((_, idx) => (
                                <td key={`empty-${idx}`} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>-</td>
                              ))}
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{avgDisplay}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{covDisplay}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                <span className={remark === 'Pass' || remark === 'PASS' ? 'text-green-600' : remark === 'Fail' || remark === 'FAIL' ? 'text-red-600' : ''}>
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {testData.reproducibilityOfRadiationOutput.tolerance && (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                      <p className="text-sm print:text-[10px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Acceptance Criteria:</strong> CoV {testData.reproducibilityOfRadiationOutput.tolerance.operator || "<="} {testData.reproducibilityOfRadiationOutput.tolerance.value || "0.05"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 4. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements) && testData.tubeHousingLeakage.leakageMeasurements.length > 0 && (() => {
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
                    <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                      <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Operating Parameters:</p>
                      <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                        Distance from the Focus: {settings.distance || "-"} cm |
                        kVp: {settings.kv || "-"} |
                        mA: {settings.ma || "-"} |
                        Time: {settings.time || "-"} Sec
                      </div>
                    </div>
                  )}

                  {/* Exposure Level Table */}
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Location (at 1.0 m from the focus)</th>
                          <th colSpan={5} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure Level (mR/hr)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                        <tr>
                          <th className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}></th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Left</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Right</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Front</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Back</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Top</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}></th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(leakageData.leakageMeasurements || []).map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{row.location || "Tube"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.left || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.right || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.front || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.back || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.top || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{maxLeakageResultMR} mR in one hour</td>
                            <td className={`border border-black p-2 print:p-1 font-semibold text-center ${remark === "Pass" ? "text-green-600" : remark === "Fail" ? "text-red-600" : ""}`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {remark || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Work Load */}
                  {leakageData.workload && (
                    <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                      <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Work Load:</p>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        {leakageData.workload.value || "-"} {leakageData.workload.unit || "mA·min/week"}
                      </p>
                    </div>
                  )}

                  {/* Max Leakage Calculation */}
                  {workloadInput && settings?.ma && settings?.time && maxValue > 0 && (
                    <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                      <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Max Leakage Calculation:</p>
                      <div className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        ({workloadInput} mAmin in 1 hr × {maxValue.toFixed(1)}) ÷ (60 × {settings?.ma}) = {maxLeakageResultMR} mR in one hour
                      </div>
                      <div className="text-xs print:text-[7px] text-gray-600 mt-2 print:mt-0.5" style={{ fontSize: '9px', marginTop: '4px' }}>
                        <p>max Exposure Level (mR/hr): {maxValue.toFixed(1)}</p>
                        <p>mA used for measurement: {settings?.ma}</p>
                      </div>
                    </div>
                  )}

                  {/* Maximum Radiation Leakage from Tube Housing */}
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Maximum Radiation Leakage from Tube Housing:</p>
                    <p className="text-lg print:text-sm font-semibold" style={{ fontSize: '13px', margin: '2px 0' }}>
                      {finalLeakageRate || "0"} mGy in one hour
                    </p>
                  </div>

                  {/* Tolerance */}
                  {leakageData?.tolerance && (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{" "}
                        {leakageData?.tolerance?.operator === 'less than or equal to' ? '<' :
                          leakageData?.tolerance?.operator === 'greater than or equal to' ? '>' : '='}{" "}
                        {leakageData?.tolerance?.value || "1"} mGy (114 mR) in one hour.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 6. Radiation Leakage Level — layout aligned with RadiographyFixed "Tube Housing Leakage" */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (() => {
              const rll = testData.radiationLeakageLevel;
              const sArr = Array.isArray(rll.settings) ? rll.settings : [];
              const s0 = (sArr[0] && typeof sArr[0] === "object" ? sArr[0] : {}) as Record<string, any>;
              const setFlat = rll.settings && typeof rll.settings === "object" && !Array.isArray(rll.settings) ? rll.settings : {};
              const fddCell = rll.fcd || setFlat.fcd || s0.fdd || s0.fcd || s0.ffd || "100";
              const kvCell = rll.kv || setFlat.kv || s0.kvp || s0.kv || "-";
              const maCell = rll.ma || setFlat.ma || s0.ma || "-";
              const timeCell =
                rll.time != null && rll.time !== ""
                  ? String(rll.time)
                  : setFlat.time != null && setFlat.time !== ""
                    ? String(setFlat.time)
                    : s0.time != null && s0.time !== ""
                      ? String(s0.time)
                      : "-";

              const leakageRowFront = (row: any) => row?.front ?? row?.up;
              const leakageRowBack = (row: any) => row?.back ?? row?.down;
              const exposureMaxMRhr = (row: any) => {
                const u = String(row?.unit || "").toLowerCase();
                const nums = [row?.left, row?.right, leakageRowFront(row), leakageRowBack(row), row?.top]
                  .map((v: any) => parseFloat(String(v)) || 0)
                  .filter((n: number) => n > 0);
                const rawMax = nums.length ? Math.max(...nums) : 0;
                if (rawMax <= 0) return 0;
                if (u.includes("mgy") || u.includes("gy")) return rawMax * 114;
                return rawMax;
              };

              return (
              <div className="mb-4 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="font-bold mb-2" style={{ fontSize: '12px' }}>6. Radiation Leakage Level</h3>
                <div style={{ marginBottom: '4px' }}>
                  <table style={{ ...tableStyle, width: '100%' }}>
                    <thead><tr>
                      {["FDD (cm)", "kV", "mA", "Time (Sec)"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', padding: '1px 8px' })}>{h}</th>)}
                    </tr></thead>
                    <tbody><tr>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{fddCell}</td>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{kvCell}</td>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{maCell}</td>
                      <td style={cellStyle({ border: '0.1px solid #666', padding: '1px 8px' })}>{timeCell}</td>
                    </tr></tbody>
                  </table>
                </div>
                <p style={{ fontSize: '10px', marginBottom: '4px' }}><strong>Workload:</strong> {rll.workload || "-"} {rll.workloadUnit || "mA·min/week"}</p>
                {rll.leakageMeasurements?.length > 0 && (
                  <table style={{ ...tableStyle, fontSize: '10px' }}>
                    <thead>
                      <tr>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', width: '15%', verticalAlign: 'middle' })}>Location</th>
                        <th colSpan={5} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>Exposure Level (mR/hr)</th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>Result (mR in 1 hr)</th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>Result (mGy in 1 hr)</th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px', verticalAlign: 'middle' })}>Remarks</th>
                      </tr>
                      <tr>
                        {["Left", "Right", "Front", "Back", "Top"].map(h => <th key={h} style={cellStyle({ fontWeight: 700, border: '0.1px solid #666', fontSize: '10px' })}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rll.leakageMeasurements.map((row: any, i: number) => {
                        const maValue = parseFloat(String(rll.ma || setFlat.ma || s0.ma || "0"));
                        const workloadValue = parseFloat(String(rll.workload || "0"));
                        const rowMax = exposureMaxMRhr(row);
                        let calcMR = "-", calcMGy = "-", remark = row.remark || row.remarks || "-";
                        if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                          const resMR = (workloadValue * rowMax) / (60 * maValue);
                          calcMR = resMR.toFixed(3); calcMGy = (resMR / 114).toFixed(4);
                          if (remark === "-" || !remark) { remark = (resMR / 114) <= (parseFloat(String(rll.toleranceValue)) || 1.0) ? "Pass" : "Fail"; }
                        } else {
                          calcMR = row.resultMR != null && row.resultMR !== "" ? String(row.resultMR) : "-";
                          calcMGy = row.resultMGy != null && row.resultMGy !== "" ? String(row.resultMGy) : "-";
                        }
                        const dispFront = leakageRowFront(row);
                        const dispBack = leakageRowBack(row);
                        return (
                          <tr key={i}>
                            <th scope="row" style={cellStyle({ border: '0.1px solid #666', fontSize: '10px', fontWeight: 700 })}>{row.location || "-"}</th>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row.left ?? "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row.right ?? "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{dispFront ?? "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{dispBack ?? "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{row.top ?? "-"}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{calcMR}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{calcMGy}</td>
                            <td style={cellStyle({ border: '0.1px solid #666', fontSize: '10px' })}>{remark}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {(() => {
                  const maValue = parseFloat(String(rll.ma || setFlat.ma || s0.ma || "0"));
                  const workloadValue = parseFloat(String(rll.workload || "0"));
                  const getSummary = (locName: string) => {
                    const row = rll.leakageMeasurements?.find((m: any) => m.location === locName);
                    if (!row) return null;
                    const rowMax = exposureMaxMRhr(row);
                    if (rowMax <= 0 || maValue <= 0 || workloadValue <= 0) return null;
                    const resMR = (workloadValue * rowMax) / (60 * maValue);
                    return { rowMax, resMR, resMGy: resMR / 114 };
                  };
                  const tubeSummary = getSummary("Tube Housing");
                  const collimatorSummary = getSummary("Collimator");
                  return (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ border: '1px solid #888', padding: '4px 8px', marginBottom: '4px', background: '#fafafa' }}>
                        <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Calculation Formula:</p>
                        <p style={{ fontSize: '10px', textAlign: 'center', fontFamily: 'monospace', border: '1px dashed #999', padding: '2px' }}>
                          Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                        </p>
                        <p style={{ fontSize: '9px', marginTop: '2px', color: '#555', fontStyle: 'italic' }}>
                          Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {tubeSummary && (
                          <div style={{ flex: 1, border: '0.1px solid #666', padding: '4px', fontSize: '10px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>Tube Housing Summary:</p>
                            <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <strong>{tubeSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                        {collimatorSummary && (
                          <div style={{ flex: 1, border: '0.1px solid #666', padding: '4px', fontSize: '10px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>Collimator Summary:</p>
                            <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                            <p>Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                            <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <strong>{collimatorSummary.resMGy.toFixed(4)} mGy</strong></p>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '10px', marginTop: '4px', border: '0.1px solid #666', padding: '2px 6px' }}>
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt; <strong>{rll.toleranceValue || '1'} mGy ({parseFloat(String(rll.toleranceValue || '1')) * 114} mR) in one hour.</strong>
                      </p>
                    </div>
                  );
                })()}
              </div>
              );
            })()}

            {/* 5. Radiation Protection Survey - structure like RadiographyFixed */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Details of Radiation Protection Survey</h3>
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {(testData.radiationProtectionSurvey.appliedCurrent || testData.radiationProtectionSurvey.appliedVoltage || testData.radiationProtectionSurvey.exposureTime || testData.radiationProtectionSurvey.workload) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>2. Equipment Setting</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Current (mA)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Voltage (kV)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Exposure Time(s)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Workload (mA min/week)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.workload || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Location</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.location || "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={loc.result === "PASS" || loc.result === "Pass" ? "text-green-600 font-semibold" : loc.result === "FAIL" || loc.result === "Fail" ? "text-red-600 font-semibold" : ""}>{loc.result || "-"}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>4. Calculation Formula</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 bg-gray-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                            <strong>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {testData.radiationProtectionSurvey.locations?.length > 0 && (() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");

                  // Find locations with maximum values
                  const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, workerLocs[0] || { mRPerHr: '', location: '' });

                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, publicLocs[0] || { mRPerHr: '', location: '' });

                  const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const workerResult = parseFloat(maxWorkerWeekly) > 0 && parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : parseFloat(maxWorkerWeekly) > 40 ? "Fail" : "";
                  const publicResult = parseFloat(maxPublicWeekly) > 0 && parseFloat(maxPublicWeekly) <= 2 ? "Pass" : parseFloat(maxPublicWeekly) > 2 ? "Fail" : "";

                  return (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Category</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Radiation Worker</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>{workerResult || "-"}</span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>{publicResult || "-"}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {/* Calculation Formulas */}
                      <div className="mt-4 print:mt-1 space-y-3 print:space-y-1">
                        {/* Worker Calculation */}
                        {maxWorkerLocation.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Location:</strong> {maxWorkerLocation.location}
                            </p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxWorkerLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Result:</strong> {maxWorkerWeekly} mR/week
                            </p>
                          </div>
                        )}
                        {/* Public Calculation */}
                        {maxPublicLocation.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Location:</strong> {maxPublicLocation.location}
                            </p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxPublicLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Result:</strong> {maxPublicWeekly} mR/week
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>6. Permissible Limit</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For location of Radiation Worker</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>20 mSv in a year (40 mR/week)</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Location of Member of Public</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>1 mSv in a year (2mR/week)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* No data fallback */}
            {testData && typeof testData === "object" && Object.values(testData).every((v: any) => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32 print:mt-16">
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

export default ViewServiceReportDentalIntra;