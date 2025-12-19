// src/components/reports/ViewServiceReportInventionalRadiology.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForInventionalRadiology } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForInventionalRadiology from "./MainTestTableForInventionalRadiology";

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
  category: string;
  toolsUsed?: Tool[];
  notes?: Note[];

  // Test documents
  CentralBeamAlignmentInventionalRadiology?: any;
  EffectiveFocalSpotInventionalRadiology?: any;
  AccuracyOfIrradiationTimeInventionalRadiology?: any;
  TotalFilterationForInventionalRadiology?: any;
  ConsistencyOfRadiationOutputInventionalRadiology?: any;
  LowContrastResolutionInventionalRadiology?: any;
  HighContrastResolutionInventionalRadiology?: any;
  ExposureRateTableTopInventionalRadiology?: any;
  TubeHousingLeakageInventionalRadiology?: any;
  RadiationProtectionSurveyInventionalRadiology?: any;
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

const ViewServiceReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [testDataFrontal, setTestDataFrontal] = useState<any>({});
  const [testDataLateral, setTestDataLateral] = useState<any>({});

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if it's a double tube setup
        const savedTubeType = localStorage.getItem(`inventional_radiology_tube_type_${serviceId}`);
        const isDoubleTube = savedTubeType === 'double';
        
        // Always fetch single tube data (tubeId = null) for common tests and header
        const response = await getReportHeaderForInventionalRadiology(serviceId, null);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Interventional Radiology",
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
            category: data.category || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          if (isDoubleTube) {
            // Fetch both Tube Frontal and Tube Lateral data
            const [responseFrontal, responseLateral] = await Promise.all([
              getReportHeaderForInventionalRadiology(serviceId, 'frontal'),
              getReportHeaderForInventionalRadiology(serviceId, 'lateral'),
            ]);

            // Extract test data for Tube Frontal
            if (responseFrontal?.exists && responseFrontal?.data) {
              const dataFrontal = responseFrontal.data;
              setTestDataFrontal({
                centralBeamAlignment: dataFrontal.CentralBeamAlignmentInventionalRadiology || null,
                effectiveFocalSpot: dataFrontal.EffectiveFocalSpotInventionalRadiology || null,
                accuracyOfIrradiationTime: dataFrontal.AccuracyOfIrradiationTimeInventionalRadiology || null,
                totalFilteration: dataFrontal.TotalFilterationForInventionalRadiology || null,
                consistencyOfRadiationOutput: dataFrontal.ConsistencyOfRadiationOutputInventionalRadiology || null,
                lowContrastResolution: dataFrontal.LowContrastResolutionInventionalRadiology || null,
                highContrastResolution: dataFrontal.HighContrastResolutionInventionalRadiology || null,
                exposureRateTableTop: dataFrontal.ExposureRateTableTopInventionalRadiology || null,
                tubeHousingLeakage: dataFrontal.TubeHousingLeakageInventionalRadiology || null,
              });
            }

            // Extract test data for Tube Lateral
            if (responseLateral?.exists && responseLateral?.data) {
              const dataLateral = responseLateral.data;
              setTestDataLateral({
                centralBeamAlignment: dataLateral.CentralBeamAlignmentInventionalRadiology || null,
                effectiveFocalSpot: dataLateral.EffectiveFocalSpotInventionalRadiology || null,
                accuracyOfIrradiationTime: dataLateral.AccuracyOfIrradiationTimeInventionalRadiology || null,
                totalFilteration: dataLateral.TotalFilterationForInventionalRadiology || null,
                consistencyOfRadiationOutput: dataLateral.ConsistencyOfRadiationOutputInventionalRadiology || null,
                lowContrastResolution: dataLateral.LowContrastResolutionInventionalRadiology || null,
                highContrastResolution: dataLateral.HighContrastResolutionInventionalRadiology || null,
                exposureRateTableTop: dataLateral.ExposureRateTableTopInventionalRadiology || null,
                tubeHousingLeakage: dataLateral.TubeHousingLeakageInventionalRadiology || null,
              });
            }

            // Set combined test data for summary (common tests only)
            setTestData({
              // Common tests that don't have tubeId
              radiationProtectionSurvey: data.RadiationProtectionSurveyInventionalRadiology || null,
            });
          } else {
            // Single tube - use the response data
            setTestData({
              centralBeamAlignment: data.CentralBeamAlignmentInventionalRadiology || null,
              effectiveFocalSpot: data.EffectiveFocalSpotInventionalRadiology || null,
              accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeInventionalRadiology || null,
              totalFilteration: data.TotalFilterationForInventionalRadiology || null,
              consistencyOfRadiationOutput: data.ConsistencyOfRadiationOutputInventionalRadiology || null,
              lowContrastResolution: data.LowContrastResolutionInventionalRadiology || null,
              highContrastResolution: data.HighContrastResolutionInventionalRadiology || null,
              exposureRateTableTop: data.ExposureRateTableTopInventionalRadiology || null,
              tubeHousingLeakage: data.TubeHousingLeakageInventionalRadiology || null,
              radiationProtectionSurvey: data.RadiationProtectionSurveyInventionalRadiology || null,
            });
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Interventional Radiology report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  // Helper function to render test table for both tubes
  const renderTestTable = (
    testDataFrontal: any,
    testDataLateral: any,
    testDataSingle: any,
    renderTable: (data: any) => React.ReactNode
  ) => {
    if (isDoubleTube) {
      return (
        <>
          {testDataFrontal && (
            <div className="mb-4 print:mb-2">
              <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
              {renderTable(testDataFrontal)}
            </div>
          )}
          {testDataLateral && (
            <div className="mb-4 print:mb-2">
              <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
              {renderTable(testDataLateral)}
            </div>
          )}
        </>
      );
    } else {
      return testDataSingle ? renderTable(testDataSingle) : null;
    }
  };

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `InterventionalRadiology-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Interventional Radiology Report...</div>;

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
  
  // Check if it's a double tube setup
  const savedTubeType = localStorage.getItem(`inventional_radiology_tube_type_${serviceId}`);
  const isDoubleTube = savedTubeType === 'double';

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
            QA TEST REPORT FOR INTERVENTIONAL RADIOLOGY X-RAY EQUIPMENT
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
                  ["Category", report.category || "-"],
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

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none flex flex-col items-center" style={{ width: '100%', maxWidth: 'none' }}>
            {isDoubleTube ? (
              <>
                {/* Summary for Tube Frontal */}
                <div className="mb-8 print:mb-4 w-full flex flex-col items-center">
                  <h3 className="text-xl font-bold text-center mb-4 print:mb-2 print:text-base" style={{ fontSize: '14px' }}>
                    SUMMARY OF QA TEST RESULTS - TUBE FRONTAL
                  </h3>
                  <div className="w-full flex justify-center">
                    <MainTestTableForInventionalRadiology testData={testDataFrontal} />
                  </div>
                </div>
                {/* Summary for Tube Lateral */}
                <div className="mb-8 print:mb-4 w-full flex flex-col items-center">
                  <h3 className="text-xl font-bold text-center mb-4 print:mb-2 print:text-base" style={{ fontSize: '14px' }}>
                    SUMMARY OF QA TEST RESULTS - TUBE LATERAL
                  </h3>
                  <div className="w-full flex justify-center">
                    <MainTestTableForInventionalRadiology testData={testDataLateral} />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <MainTestTableForInventionalRadiology testData={testData} />
              </div>
            )}
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {((isDoubleTube && (testDataFrontal.accuracyOfIrradiationTime || testDataLateral.accuracyOfIrradiationTime)) || (!isDoubleTube && testData.accuracyOfIrradiationTime)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {isDoubleTube ? (
                  <>
                    {/* Tube Frontal */}
                    {testDataFrontal.accuracyOfIrradiationTime && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        {testDataFrontal.accuracyOfIrradiationTime.testConditions && (
                          <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                            <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                            <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                              FCD: {testDataFrontal.accuracyOfIrradiationTime.testConditions.fcd || "-"} cm |
                              kV: {testDataFrontal.accuracyOfIrradiationTime.testConditions.kv || "-"} |
                              mA: {testDataFrontal.accuracyOfIrradiationTime.testConditions.ma || "-"}
                            </div>
                          </div>
                        )}
                        {testDataFrontal.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataFrontal.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                                  const setTime = parseFloat(row.setTime);
                                  const measuredTime = parseFloat(row.measuredTime);
                                  let error = "-";
                                  if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                                    error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
                                  }
                                  const toleranceOp = testDataFrontal.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                                  const toleranceVal = parseFloat(testDataFrontal.accuracyOfIrradiationTime.tolerance?.value || "5");
                                  const errorVal = parseFloat(error);
                                  let isPass = false;
                                  if (!isNaN(errorVal) && !isNaN(toleranceVal)) {
                                    if (toleranceOp === "<=") isPass = errorVal <= toleranceVal;
                                    else if (toleranceOp === ">=") isPass = errorVal >= toleranceVal;
                                    else if (toleranceOp === "<") isPass = errorVal < toleranceVal;
                                    else if (toleranceOp === ">") isPass = errorVal > toleranceVal;
                                  }
                                  return (
                                    <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error}%</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                        <span className={isPass ? "text-green-600" : "text-red-600"}>
                                          {isPass ? "PASS" : "FAIL"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {testDataFrontal.accuracyOfIrradiationTime.tolerance && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                              <strong>Tolerance:</strong> Error {testDataFrontal.accuracyOfIrradiationTime.tolerance.operator || "<="} {testDataFrontal.accuracyOfIrradiationTime.tolerance.value || "-"}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tube Lateral */}
                    {testDataLateral.accuracyOfIrradiationTime && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        {testDataLateral.accuracyOfIrradiationTime.testConditions && (
                          <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                            <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                            <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                              FCD: {testDataLateral.accuracyOfIrradiationTime.testConditions.fcd || "-"} cm |
                              kV: {testDataLateral.accuracyOfIrradiationTime.testConditions.kv || "-"} |
                              mA: {testDataLateral.accuracyOfIrradiationTime.testConditions.ma || "-"}
                            </div>
                          </div>
                        )}
                        {testDataLateral.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataLateral.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                                  const setTime = parseFloat(row.setTime);
                                  const measuredTime = parseFloat(row.measuredTime);
                                  let error = "-";
                                  if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                                    error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
                                  }
                                  const toleranceOp = testDataLateral.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                                  const toleranceVal = parseFloat(testDataLateral.accuracyOfIrradiationTime.tolerance?.value || "5");
                                  const errorVal = parseFloat(error);
                                  let isPass = false;
                                  if (!isNaN(errorVal) && !isNaN(toleranceVal)) {
                                    if (toleranceOp === "<=") isPass = errorVal <= toleranceVal;
                                    else if (toleranceOp === ">=") isPass = errorVal >= toleranceVal;
                                    else if (toleranceOp === "<") isPass = errorVal < toleranceVal;
                                    else if (toleranceOp === ">") isPass = errorVal > toleranceVal;
                                  }
                                  return (
                                    <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error}%</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                        <span className={isPass ? "text-green-600" : "text-red-600"}>
                                          {isPass ? "PASS" : "FAIL"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {testDataLateral.accuracyOfIrradiationTime.tolerance && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                              <strong>Tolerance:</strong> Error {testDataLateral.accuracyOfIrradiationTime.tolerance.operator || "<="} {testDataLateral.accuracyOfIrradiationTime.tolerance.value || "-"}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {testData.accuracyOfIrradiationTime.testConditions && (
                      <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                        <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                        <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                          FCD: {testData.accuracyOfIrradiationTime.testConditions.fcd || "-"} cm |
                          kV: {testData.accuracyOfIrradiationTime.testConditions.kv || "-"} |
                          mA: {testData.accuracyOfIrradiationTime.testConditions.ma || "-"}
                        </div>
                      </div>
                    )}
                    {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                          const setTime = parseFloat(row.setTime);
                          const measuredTime = parseFloat(row.measuredTime);
                          let error = "-";
                          if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                            error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
                          }
                          const toleranceOp = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                          const toleranceVal = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "5");
                          const errorVal = parseFloat(error);
                          let isPass = false;
                          if (!isNaN(errorVal) && !isNaN(toleranceVal)) {
                            if (toleranceOp === "<=") isPass = errorVal <= toleranceVal;
                            else if (toleranceOp === ">=") isPass = errorVal >= toleranceVal;
                            else if (toleranceOp === "<") isPass = errorVal < toleranceVal;
                            else if (toleranceOp === ">") isPass = errorVal > toleranceVal;
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error}%</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {/* 2. Total Filtration */}
            {((isDoubleTube && (testDataFrontal.totalFilteration || testDataLateral.totalFilteration)) || (!isDoubleTube && testData.totalFilteration)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Total Filtration</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.totalFilteration && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        {testDataFrontal.totalFilteration.totalFiltration && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                              <strong>Total Filtration:</strong> Measured: {testDataFrontal.totalFilteration.totalFiltration.measured || "-"} mm Al | 
                              Required: {testDataFrontal.totalFilteration.totalFiltration.required || "-"} mm Al
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {testDataLateral.totalFilteration && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        {testDataLateral.totalFilteration.totalFiltration && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                              <strong>Total Filtration:</strong> Measured: {testDataLateral.totalFilteration.totalFiltration.measured || "-"} mm Al | 
                              Required: {testDataLateral.totalFilteration.totalFiltration.required || "-"} mm Al
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  testData.totalFilteration?.totalFiltration && (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Total Filtration:</strong> Measured: {testData.totalFilteration.totalFiltration.measured || "-"} mm Al | 
                        Required: {testData.totalFilteration.totalFiltration.required || "-"} mm Al
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* 3. Exposure Rate at Table Top */}
            {((isDoubleTube && (testDataFrontal.exposureRateTableTop || testDataLateral.exposureRateTableTop)) || (!isDoubleTube && testData.exposureRateTableTop)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Exposure Rate at Table Top</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.exposureRateTableTop && testDataFrontal.exposureRateTableTop.rows?.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDataFrontal.exposureRateTableTop.rows.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                    <span className={row.result === "PASS" ? "text-green-600" : row.result === "FAIL" ? "text-red-600" : ""}>
                                      {row.result || "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {testDataLateral.exposureRateTableTop && testDataLateral.exposureRateTableTop.rows?.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDataLateral.exposureRateTableTop.rows.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                    <span className={row.result === "PASS" ? "text-green-600" : row.result === "FAIL" ? "text-red-600" : ""}>
                                      {row.result || "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  testData.exposureRateTableTop?.rows?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.exposureRateTableTop.rows.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                              <span className={row.result === "PASS" ? "text-green-600" : row.result === "FAIL" ? "text-red-600" : ""}>
                                {row.result || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )
                )}
              </div>
            )}

            {/* 4. Low Contrast Resolution */}
            {((isDoubleTube && (testDataFrontal.lowContrastResolution || testDataLateral.lowContrastResolution)) || (!isDoubleTube && testData.lowContrastResolution)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Low Contrast Resolution</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.lowContrastResolution && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Smallest Hole Size:</strong> {testDataFrontal.lowContrastResolution.smallestHoleSize || "-"} mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Recommended Standard:</strong> {testDataFrontal.lowContrastResolution.recommendedStandard || "3.0"} mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Remarks:</strong>{" "}
                            <span className={testDataFrontal.lowContrastResolution.remark === "PASS" ? "text-green-600" : testDataFrontal.lowContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                              {testDataFrontal.lowContrastResolution.remark || "-"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {testDataLateral.lowContrastResolution && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Smallest Hole Size:</strong> {testDataLateral.lowContrastResolution.smallestHoleSize || "-"} mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Recommended Standard:</strong> {testDataLateral.lowContrastResolution.recommendedStandard || "3.0"} mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Remarks:</strong>{" "}
                            <span className={testDataLateral.lowContrastResolution.remark === "PASS" ? "text-green-600" : testDataLateral.lowContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                              {testDataLateral.lowContrastResolution.remark || "-"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Smallest Hole Size:</strong> {testData.lowContrastResolution.smallestHoleSize || "-"} mm
                    </p>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Recommended Standard:</strong> {testData.lowContrastResolution.recommendedStandard || "3.0"} mm
                    </p>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Remarks:</strong>{" "}
                      <span className={testData.lowContrastResolution.remark === "PASS" ? "text-green-600" : testData.lowContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                        {testData.lowContrastResolution.remark || "-"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. High Contrast Resolution */}
            {((isDoubleTube && (testDataFrontal.highContrastResolution || testDataLateral.highContrastResolution)) || (!isDoubleTube && testData.highContrastResolution)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. High Contrast Resolution</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.highContrastResolution && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Measured:</strong> {testDataFrontal.highContrastResolution.measuredLpPerMm || "-"} lp/mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Recommended Standard:</strong> {testDataFrontal.highContrastResolution.recommendedStandard || "1.50"} lp/mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Remarks:</strong>{" "}
                            <span className={testDataFrontal.highContrastResolution.remark === "PASS" ? "text-green-600" : testDataFrontal.highContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                              {testDataFrontal.highContrastResolution.remark || "-"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {testDataLateral.highContrastResolution && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Measured:</strong> {testDataLateral.highContrastResolution.measuredLpPerMm || "-"} lp/mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Recommended Standard:</strong> {testDataLateral.highContrastResolution.recommendedStandard || "1.50"} lp/mm
                          </p>
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                            <strong>Remarks:</strong>{" "}
                            <span className={testDataLateral.highContrastResolution.remark === "PASS" ? "text-green-600" : testDataLateral.highContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                              {testDataLateral.highContrastResolution.remark || "-"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Measured:</strong> {testData.highContrastResolution.measuredLpPerMm || "-"} lp/mm
                    </p>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Recommended Standard:</strong> {testData.highContrastResolution.recommendedStandard || "1.50"} lp/mm
                    </p>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Remarks:</strong>{" "}
                      <span className={testData.highContrastResolution.remark === "PASS" ? "text-green-600" : testData.highContrastResolution.remark === "FAIL" ? "text-red-600" : ""}>
                        {testData.highContrastResolution.remark || "-"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Tube Housing Leakage</h3>
                {testData.tubeHousingLeakage.leakageMeasurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Location</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Front</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Back</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Left</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Right</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Top</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.tubeHousingLeakage.leakageMeasurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.front || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.back || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.left || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.right || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.top || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl print:text-lg text-gray-500 mt-32 print:mt-16">
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

export default ViewServiceReport;