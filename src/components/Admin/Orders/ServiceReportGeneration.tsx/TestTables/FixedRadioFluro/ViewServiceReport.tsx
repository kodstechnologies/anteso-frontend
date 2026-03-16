// src/components/reports/ViewServiceReportFixedRadioFluro.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeader,
  getDetails,
  getTotalFiltrationByServiceIdForFixedRadioFluro,
  getEffectiveFocalSpotByServiceIdForFixedRadioFluro,
  getCongruenceByServiceIdForFixedRadioFluro,
  getCentralBeamAlignmentByServiceIdForFixedRadioFluro,
  getOutputConsistencyByServiceIdForFixedRadioFluro,
  getLowContrastResolutionByServiceIdForFixedRadioFluro,
  getHighContrastResolutionByServiceIdForFixedRadioFluro,
  getExposureRateByServiceIdForFixedRadioFluro,
  getTubeHousingLeakageByServiceIdForFixedRadioFluro,
  getRadiationProtectionSurveyByServiceIdForFixedRadioFluro,
  getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro,
  getLinearityOfMasLoadingByServiceIdForFixedRadioFluro,
  getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro,
  getAccuracyOfOperatingPotentialByServiceIdForFixedRadioFluro,
} from "../../../../../../api";
import FixedRadioFlouroResultTable from "./FixedRadioFluoroResultTable";
import MainTestTableForFixedRadioFluro from "./MainTestTableForFixedRadioFluro";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";

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
  category: string;
  reportULRNumber?: string;
  // Test documents
  accuracyOfOperatingPotentialFixedRadioFluoro?: any;
  OutputConsistencyForFixedRadioFlouro?: any;
  LowContrastResolutionFixedRadioFlouro?: any;
  HighContrastResolutionFixedRadioFluoro?: any;
  ExposureRateTableTopFixedRadioFlouro?: any;
  LinearityOfmAsLoadingFixedRadioFluoro?: any;
  TubeHousingLeakageFixedRadioFlouro?: any;
  AccuracyOfIrradiationTimeFixedRadioFluoro?: any;
  CongruenceOfRadiationForRadioFluro?: any;
  CentralBeamAlignmentForRadioFluoro?: any;
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

const ViewServiceReportFixedRadioFluro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [pageCount, setPageCount] = useState<string>('Calculating...');
  const [ulrNumber, setUlrNumber] = useState<string>("N/A");

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getReportHeader(serviceId);

        if (response.exists && response.data) {
          const data = response.data;
          setReport({
            ...data,
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          const fromReport = {
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotentialFixedRadioFluoro || data.accuracyOfOperatingPotentialRadigraphyFixed || null,
            outputConsistency: data.OutputConsistencyForFixedRadioFlouro || data.ConsistencyOfRadiationOutputFixedRadiography || null,
            linearityOfmAsLoading: data.LinearityOfmAsLoadingFixedRadioFluoro || data.LinearityOfmAsLoadingRadiographyFixed || null,
            linearityOfMaLoading: data.LinearityOfmAsLoadingFixedRadioFluoro || data.LinearityOfmAsLoadingRadiographyFixed || null,
            tubeHousingLeakage: data.TubeHousingLeakageFixedRadioFlouro || data.RadiationLeakageLevelRadiographyFixed || null,
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeFixedRadioFluoro || data.AccuracyOfIrradiationTimeRadiographyFixed || null,
            congruenceOfRadiation: data.CongruenceOfRadiationForRadioFluro || data.CongruenceOfRadiationRadioGraphyFixed || null,
            centralBeamAlignment: data.CentralBeamAlignmentForRadioFluoro || data.CentralBeamAlignmentRadiographyFixed || null,
            effectiveFocalSpot: data.EffectiveFocalSpotRadiographyFixed || data.EffectiveFocalSpotForRadiographyFixedAndMobile || null,
            radiationProtectionSurvey: data.RadiationProtectionSurvey || data.RadiationProtectionSurveyRadiographyFixed || null,
            totalFiltration: data.TotalFilterationRadiographyFixed || null,
            lowContrastResolution: data.LowContrastResolutionFixedRadioFlouro || null,
            highContrastResolution: data.HighContrastResolutionFixedRadioFluoro || null,
            exposureRate: data.ExposureRateTableTopFixedRadioFlouro || null,
          };
          setTestData(fromReport);

          // Fetch any test tables not in report (e.g. Total Filtration, Effective Focal Spot when not linked) so all tables from Generate appear
          const fetchTest = async (fn: () => Promise<any>) => {
            try {
              const res = await fn();
              if (!res) return null;
              const inner = res?.data;
              if (inner?.data !== undefined) return inner.data;
              return inner ?? res;
            } catch {
              return null;
            }
          };
          const [
            totalFiltrationRes,
            effectiveFocalSpotRes,
            congruenceRes,
            centralBeamRes,
            outputConsistencyRes,
            lowContrastRes,
            highContrastRes,
            exposureRateRes,
            tubeHousingRes,
            radiationProtectionRes,
            accuracyOfIrradiationTimeRes,
            linearityOfMasRes,
            linearityOfMaStationsRes,
            accuracyOfOperatingPotentialRes,
          ] = await Promise.all([
            fetchTest(() => getTotalFiltrationByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getEffectiveFocalSpotByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getCongruenceByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getCentralBeamAlignmentByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getOutputConsistencyByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getLowContrastResolutionByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getHighContrastResolutionByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getExposureRateByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getTubeHousingLeakageByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getRadiationProtectionSurveyByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getLinearityOfMasLoadingByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getAccuracyOfOperatingPotentialByServiceIdForFixedRadioFluro(serviceId)),
          ]);

          setTestData((prev: any) => ({
            ...prev,
            totalFiltration: prev.totalFiltration || totalFiltrationRes || null,
            effectiveFocalSpot: prev.effectiveFocalSpot || effectiveFocalSpotRes || null,
            congruenceOfRadiation: prev.congruenceOfRadiation || congruenceRes || null,
            centralBeamAlignment: prev.centralBeamAlignment || centralBeamRes || null,
            outputConsistency: prev.outputConsistency || outputConsistencyRes || null,
            lowContrastResolution: prev.lowContrastResolution || lowContrastRes || null,
            highContrastResolution: prev.highContrastResolution || highContrastRes || null,
            exposureRate: prev.exposureRate || exposureRateRes || null,
            tubeHousingLeakage: prev.tubeHousingLeakage || tubeHousingRes || null,
            radiationProtectionSurvey: prev.radiationProtectionSurvey || radiationProtectionRes || null,
            accuracyOfIrradiationTime: prev.accuracyOfIrradiationTime || accuracyOfIrradiationTimeRes || null,
            linearityOfmAsLoading: prev.linearityOfmAsLoading || linearityOfMasRes || linearityOfMaStationsRes || null,
            linearityOfMaLoading: prev.linearityOfMaLoading || linearityOfMaStationsRes || null,
            accuracyOfOperatingPotential: prev.accuracyOfOperatingPotential || accuracyOfOperatingPotentialRes || null,
          }));
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

  // Fetch ULR Number (matching ServiceDetails2.tsx approach)
  useEffect(() => {
    const fetchULRNumber = async () => {
      if (!serviceId) return;
      try {
        // First, try to get from service details (qaTests)
        const serviceDetails = await getDetails(serviceId);
        if (serviceDetails?.data?.qaTests && serviceDetails.data.qaTests.length > 0) {
          const ulr = serviceDetails.data.qaTests[0]?.reportULRNumber;
          if (ulr && ulr !== "N/A") {
            setUlrNumber(ulr);
            return;
          }
        }

        // Second, try to get from localStorage reportNumbers (matching ServiceDetails2 pattern)
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('reportNumbers_')) {
            try {
              const reportNumbers = JSON.parse(localStorage.getItem(key) || '{}');
              const serviceReport = reportNumbers[serviceId];
              if (serviceReport?.qatest?.reportULRNumber && serviceReport.qatest.reportULRNumber !== "N/A") {
                setUlrNumber(serviceReport.qatest.reportULRNumber);
                return;
              }
            } catch (e) {
              // Continue to next key
            }
          }
        }

        // If still not found, set default
        setUlrNumber("N/A");
      } catch (err) {
        console.error("Failed to fetch ULR number:", err);
        setUlrNumber("N/A");
      }
    };
    fetchULRNumber();
  }, [serviceId]);

  // Calculate page count
  useEffect(() => {
    if (report) {
      const calculatePages = () => {
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
          // Account for print margins (0.5cm top and bottom = 1cm total = ~37.8px)
          const pageHeight = 1123 - 37.8; // A4 height minus margins
          const contentHeight = reportContent.scrollHeight;
          const estimatedPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
          setPageCount(String(estimatedPages));
        }
      };

      // Calculate immediately and after a delay to ensure content is rendered
      calculatePages();
      const timer = setTimeout(calculatePages, 500);
      const timer2 = setTimeout(calculatePages, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [report, testData]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `FixedRadioFluro-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Fixed RadioFluro Report...</div>;
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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>SRF No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{report.srfNumber}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>SRF Date</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{formatDate(report.srfDate)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>ULR No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{report?.reportULRNumber || ulrNumber}</td>
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
            QA TEST REPORT FOR FIXED RADIOGRAPHY & FLUOROSCOPY EQUIPMENT
          </h1>

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
                  ["Total Pages", pageCount],
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
                  {toolsArray.length > 0 ? toolsArray.map((t, i) => (
                    <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.nomenclature}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.make} / {t.model}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(t.calibrationValidTill)}</td>
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
              {notesArray.length > 0 ? notesArray.map(n => (
                <p key={n.slNo} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              )) : <p>No notes added.</p>}
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
          <div className="max-w-5xl mx-auto print:max-w-none flex justify-center" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForFixedRadioFluro testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* Section order matches MainTestTable Sr No: 1 Congruence, 2 Central Beam, then 3–13 below */}

            {/* 1. Congruence of Radiation & Light Field */}
            {testData.congruenceOfRadiation && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Congruence of Radiation & Light Field</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Parameter</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Measured Value</th>
                        <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(testData.congruenceOfRadiation.congruenceMeasurements) && testData.congruenceOfRadiation.congruenceMeasurements.length > 0 ? (
                        testData.congruenceOfRadiation.congruenceMeasurements.map((m: any, i: number) => {
                          const percentFED = m.percentFED != null ? parseFloat(m.percentFED) : null;
                          const tolVal = m.tolerance != null ? parseFloat(m.tolerance) : 2;
                          const isPass = percentFED != null ? percentFED <= tolVal : (m.remark === "Pass" || m.remark === "PASS");
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>{m.dimension || "—"}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{percentFED != null ? `${percentFED}%` : (m.observedShift != null ? `${m.observedShift} cm` : "-")}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{m.tolerance != null ? `≤ ${m.tolerance}%` : "≤ 2%"}</td>
                              <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={isPass ? "text-green-600" : "text-red-600"}>{isPass ? "PASS" : "FAIL"}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>Max Misalignment</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.congruenceOfRadiation.maxMisalignment ?? testData.congruenceOfRadiation.misalignment ?? "-"} cm</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>≤ 2 cm</td>
                          <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                            <span className={(parseFloat(testData.congruenceOfRadiation.maxMisalignment || testData.congruenceOfRadiation.misalignment) || 0) <= 2 ? "text-green-600" : "text-red-600"}>
                              {(parseFloat(testData.congruenceOfRadiation.maxMisalignment || testData.congruenceOfRadiation.misalignment) || 0) <= 2 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Central Beam Alignment Test */}
            {testData.centralBeamAlignment && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Central Beam Alignment Test</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Parameter</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Measured Value</th>
                        <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.centralBeamAlignment.observedTilt && (testData.centralBeamAlignment.observedTilt.value != null || testData.centralBeamAlignment.observedTilt.remark) ? (
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>Observed tilt</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.centralBeamAlignment.observedTilt.value != null ? `${testData.centralBeamAlignment.observedTilt.value}°` : (testData.centralBeamAlignment.observedTilt.remark || "-")}</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.centralBeamAlignment.tolerance?.value != null ? `${testData.centralBeamAlignment.tolerance?.operator || "≤"} ${testData.centralBeamAlignment.tolerance.value}°` : "≤ 1°"}</td>
                          <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                            <span className={testData.centralBeamAlignment.observedTilt.remark === "Pass" || testData.centralBeamAlignment.observedTilt.remark === "PASS" ? "text-green-600" : "text-red-600"}>
                              {testData.centralBeamAlignment.observedTilt.remark || "—"}
                            </span>
                          </td>
                        </tr>
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>Deviation</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.centralBeamAlignment.deviation ?? testData.centralBeamAlignment.value ?? "-"} mm</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>≤ 1% of SID ({testData.centralBeamAlignment.sid || 100} mm)</td>
                          <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                            <span className={(parseFloat(testData.centralBeamAlignment.deviation || testData.centralBeamAlignment.value) || 0) <= (0.01 * (testData.centralBeamAlignment.sid || 100)) ? "text-green-600" : "text-red-600"}>
                              {(parseFloat(testData.centralBeamAlignment.deviation || testData.centralBeamAlignment.value) || 0) <= (0.01 * (testData.centralBeamAlignment.sid || 100)) ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Accuracy of Operating Potential */}
            {testData.accuracyOfOperatingPotential?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Accuracy of Operating Potential (kVp)</h3>

                {/* Test Conditions */}
                {testData.accuracyOfOperatingPotential.table1?.length > 0 && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <div className="text-sm print:text-[9px] grid grid-cols-2 md:grid-cols-4 gap-4" style={{ fontSize: '11px' }}>
                      {testData.accuracyOfOperatingPotential.table1.map((c: any, i: number) => (
                        <div key={i}>
                          <span className="font-medium">mA:</span> {c.mA || c.ma || "-"},{' '}
                          <span className="font-medium">Time:</span> {c.time || "-"} ms
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Deviation</th>
                        <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => {
                        const setKvp = parseFloat(row.setKvp || row.setKVp || row.setKV || "0");
                        const measuredKvp = parseFloat(row.measuredKvp || row.measuredKVp || row.avgKvp || "0");
                        const deviation = row.deviation != null ? row.deviation : (setKvp > 0 ? ((measuredKvp - setKvp) / setKvp) * 100 : 0);
                        return (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKvp || row.setKVp || row.setKV || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredKvp || row.measuredKVp || row.avgKvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{deviation != null ? deviation.toFixed(2) + "%" : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>±10%</td>
                            <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={Math.abs(deviation || 0) <= 10 ? "text-green-600" : "text-red-600"}>
                                {Math.abs(deviation || 0) <= 10 ? "PASS" : "FAIL"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. Output Consistency (Consistency of Radiation Output) */}
            {testData.outputConsistency && (() => {
              const computeCov = (outputs: any[]): number | null => {
                if (!Array.isArray(outputs) || outputs.length === 0) return null;
                const values = outputs.map((o: any) => parseFloat(o?.value ?? o)).filter((v: number) => !isNaN(v) && v > 0);
                if (values.length === 0) return null;
                const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / values.length;
                const stdDev = Math.sqrt(variance);
                return avg > 0 ? stdDev / avg : null;
              };
              const tolVal = testData.outputConsistency.tolerance?.value ?? testData.outputConsistency.tolerance;
              const tolerance = typeof tolVal === "object" ? parseFloat(tolVal?.value ?? "0.05") : parseFloat(tolVal || "0.05");
              const toleranceNum = tolerance > 1 ? tolerance / 100 : tolerance;
              return (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. Consistency of Radiation Output</h3>
                {testData.outputConsistency.outputRows?.length > 0 ? (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg (X̄)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoV / Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.outputConsistency.outputRows.map((row: any, i: number) => {
                          let covVal: number | null = row.cv != null ? parseFloat(row.cv) : (row.cov != null ? parseFloat(row.cov) : null);
                          if (covVal === null && Array.isArray(row.outputs)) covVal = computeCov(row.outputs);
                          const displayCov = covVal != null ? covVal.toFixed(3) : (row.remark || "-");
                          const isPass = row.remark === "Pass" || row.remark === "PASS" || (covVal != null && covVal <= toleranceNum);
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kv || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas || "-"}</td>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avg || row.mean || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={isPass ? "text-green-600" : (row.remark?.includes("Fail") ? "text-red-600" : "")}>
                                  {row.remark || displayCov}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : testData.outputConsistency.cov != null ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Parameter</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Measured Value</th>
                          <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Tolerance</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>Coefficient of Variation (COV)</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{typeof testData.outputConsistency.cov === 'number' ? testData.outputConsistency.cov.toFixed(3) : testData.outputConsistency.cov}</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>≤ {toleranceNum}</td>
                          <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                            <span className={(parseFloat(testData.outputConsistency.cov) || 0) <= toleranceNum ? "text-green-600" : "text-red-600"}>
                              {(parseFloat(testData.outputConsistency.cov) || 0) <= toleranceNum ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value ?? toleranceNum}
                    </p>
              </div>
            )}
              </div>
              );
            })()}

            {/* 9. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. Low Contrast Resolution</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', wordWrap: 'break-word', overflowWrap: 'break-word', border: '2px solid #000000' }}>
                    <tbody>
                      {/* Row 1 - with green borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          Diameter of the smallest size hole clearly resolved on the monitor
                        </td>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          {testData.lowContrastResolution.smallestHoleSize || '1.0'} mm hole pattern must be resolved
                        </td>
                      </tr>
                      {/* Row 2 - with black borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          Recommended performance standard
                        </td>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          {testData.lowContrastResolution.recommendedStandard || '3.0'} mm hole pattern must be resolved
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 10. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. High Contrast Resolution</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', wordWrap: 'break-word', overflowWrap: 'break-word', border: '2px solid #000000' }}>
                    <tbody>
                      {/* Row 1 - with green borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          Bar strips resolved on the monitor
                        </td>
                        <td className="p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e', borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                          {testData.highContrastResolution.measuredLpPerMm || '1.0'} lp/mm pattern must be resolved
                        </td>
                      </tr>
                      {/* Row 2 - with black borders */}
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          Recommended performance standard
                        </td>
                        <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', borderWidth: '1px', textAlign: 'left' }}>
                          {testData.highContrastResolution.recommendedStandard || '1.50'} lp/mm pattern must be resolved
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 11. Exposure Rate at Table Top */}
            {testData.exposureRate && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>11. Exposure Rate at Table Top</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Applied kV/mA</th>
                        <th className="border border-black p-3 print:p-2">Measured Exposure (cGy/min)</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.exposureRate.rows && Array.isArray(testData.exposureRate.rows) && testData.exposureRate.rows.length > 0 ? (
                        testData.exposureRate.rows.map((row: any, i: number) => {
                          const exposure = parseFloat(row.exposure || "0");
                          const isAec = row.remark?.toLowerCase().includes("aec") || false;
                          const tolerance = isAec ? (testData.exposureRate.aecTolerance || "10") : (testData.exposureRate.nonAecTolerance || "5");
                          const isPass = exposure <= parseFloat(tolerance);
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-3 print:p-2 font-semibold">
                                {row.appliedKv || "-"} kV / {row.appliedMa || "-"} mA
                              </td>
                              <td className="border border-black p-3 print:p-2">{row.exposure || "-"} cGy/min</td>
                              <td className="border border-black p-3 print:p-2">≤ {tolerance} cGy/min</td>
                              <td className="border border-black p-3 print:p-2 font-bold">
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {row.remark || (isPass ? "PASS" : "FAIL")}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">Exposure Rate</td>
                          <td className="border border-black p-3 print:p-2">{testData.exposureRate.measuredValue || "N/A"} mGy/min</td>
                          <td className="border border-black p-3 print:p-2">≤ 5 mGy/min</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={(testData.exposureRate.measuredValue || 0) <= 5 ? "text-green-600" : "text-red-600"}>
                              {(testData.exposureRate.measuredValue || 0) <= 5 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 12. Tube Housing Leakage */}
            {testData.tubeHousingLeakage && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>12. Radiation Leakage from Tube Housing</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Location</th>
                        <th className="border border-black p-3 print:p-2">Measured Leakage (mGy/hr)</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.tubeHousingLeakage.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements) && testData.tubeHousingLeakage.leakageMeasurements.length > 0 ? (
                        testData.tubeHousingLeakage.leakageMeasurements.map((measure: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 print:p-2 font-semibold">{measure.location || "Tube Housing"}</td>
                            <td className="border border-black p-3 print:p-2">{measure.max || measure.mgy || "-"} mGy/hr</td>
                            <td className="border border-black p-3 print:p-2">≤ 1 mGy/hr</td>
                            <td className="border border-black p-3 print:p-2 font-bold">
                              <span className={(parseFloat(measure.max || measure.mgy || "0")) <= 1 ? "text-green-600" : "text-red-600"}>
                                {measure.result || ((parseFloat(measure.max || measure.mgy || "0")) <= 1 ? "PASS" : "FAIL")}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">Radiation Leakage (at 1m distance)</td>
                          <td className="border border-black p-3 print:p-2">{testData.tubeHousingLeakage.leakageRate || testData.tubeHousingLeakage.max || "N/A"} mGy/hr</td>
                          <td className="border border-black p-3 print:p-2">≤ 1 mGy/hr</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={(parseFloat(testData.tubeHousingLeakage.leakageRate || testData.tubeHousingLeakage.max || "0")) <= 1 ? "text-green-600" : "text-red-600"}>
                              {(parseFloat(testData.tubeHousingLeakage.leakageRate || testData.tubeHousingLeakage.max || "0")) <= 1 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Linearity of mAs / mA Loading — measured values as separate columns (like RadiographyFixed) */}
            {(testData.linearityOfmAsLoading || testData.linearityOfMaLoading) && (() => {
              const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
              const sectionTitle = testData.linearityOfMaLoading && !testData.linearityOfmAsLoading ? "7. Linearity of mA Loading" : "7. Linearity of mAs Loading";
              const numMeasCols = linearityData.table2?.length ? Math.max(...linearityData.table2.map((r: any) => (r.measuredOutputs || []).length), 1) : 0;
              const measHeaders = linearityData.measHeaders?.length ? linearityData.measHeaders : Array.from({ length: numMeasCols }, (_, i) => `Meas ${i + 1}`);
              const formatVal = (val: any) => {
                if (val === undefined || val === null) return "-";
                const str = String(val).trim();
                return str === "" || str === "—" || str === "undefined" || str === "null" ? "-" : str;
              };
              return (
              <div className="mb-16 print:mb-12 test-section">
                <h3 className="text-lg font-bold mb-4 print:mb-1 print:text-sm" style={{ fontSize: '14px', marginBottom: '4px' }}>{sectionTitle}</h3>
                {linearityData.table1 && linearityData.table1.length > 0 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border print:p-1">
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '4px' }}>Test Conditions:</p>
                    <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      FCD: {linearityData.table1[0]?.fcd || "-"} cm | kV: {linearityData.table1[0]?.kv || "-"} | Time: {linearityData.table1[0]?.time || "-"} sec
                    </div>
                  </div>
                )}
                {linearityData.table2?.length > 0 && numMeasCols > 0 ? (
                  <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>mAs Applied</th>
                          {measHeaders.map((header: string, idx: number) => (
                            <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>{header || `Meas ${idx + 1}`}</th>
                          ))}
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X (mGy/mA)</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MAX</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MIN</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>CoL</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linearityData.table2.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>{row.mAsApplied || row.mAs || "-"}</td>
                              {Array.from({ length: numMeasCols }, (_, idx) => (
                                <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                  {formatVal(row.measuredOutputs?.[idx])}
                                </td>
                              ))}
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row.average || "-"}</td>
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row.x || "-"}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={linearityData.table2.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{formatVal(linearityData.xMax)}</td>
                                  <td rowSpan={linearityData.table2.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{formatVal(linearityData.xMin)}</td>
                                  <td rowSpan={linearityData.table2.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{formatVal(linearityData.col)}</td>
                                  <td rowSpan={linearityData.table2.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                    <span className={linearityData.remarks === "Pass" || linearityData.remarks === "PASS" ? "text-green-600 font-semibold" : linearityData.remarks === "Fail" || linearityData.remarks === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                      {formatVal(linearityData.remarks)}
                                    </span>
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : linearityData.table2?.length > 0 ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '5px', fontSize: '10px' }}>mAs</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '5px', fontSize: '10px' }}>Measured Values</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '5px', fontSize: '10px' }}>CoL</th>
                          <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '5px', fontSize: '10px' }}>Tolerance</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '5px', fontSize: '10px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linearityData.table2.map((row: any, i: number) => {
                          const col = row.col != null ? parseFloat(row.col) : (row.x != null ? parseFloat(row.x) : null);
                          const mAs = row.mAs || row.mAsApplied || "-";
                          const measuredOutputs = Array.isArray(row.measuredOutputs) ? row.measuredOutputs.join(", ") : (row.measuredValues || row.measured || "-");
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '5px', fontSize: '10px' }}>{mAs}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '5px', fontSize: '10px' }}>{measuredOutputs}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '5px', fontSize: '10px' }}>{col != null ? col.toFixed(3) : "-"}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '5px', fontSize: '10px' }}>≤ 0.1</td>
                              <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '5px', fontSize: '10px' }}>
                                <span className={col != null && col <= 0.1 ? "text-green-600" : "text-red-600"}>{col != null && col <= 0.1 ? "PASS" : "FAIL"}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : linearityData.col != null ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '5px', fontSize: '10px' }}>Parameter</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '5px', fontSize: '10px' }}>Measured Value</th>
                          <th className="border border-black p-2 print:p-1 bg-blue-100 text-center" style={{ padding: '5px', fontSize: '10px' }}>Tolerance</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '5px', fontSize: '10px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '5px', fontSize: '10px' }}>Coefficient of Linearity</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '5px', fontSize: '10px' }}>{typeof linearityData.col === 'number' ? linearityData.col.toFixed(3) : linearityData.col}</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '5px', fontSize: '10px' }}>≤ 0.1</td>
                          <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '5px', fontSize: '10px' }}>
                            <span className={(parseFloat(linearityData.col) || 0) <= 0.1 ? "text-green-600" : "text-red-600"}>{(parseFloat(linearityData.col) || 0) <= 0.1 ? "PASS" : "FAIL"}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {linearityData.tolerance != null && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border">
                    <p className="text-sm print:text-[10px]" style={{ fontSize: '10px' }}><strong>Tolerance (CoL):</strong> {linearityData.toleranceOperator || "≤"} {linearityData.tolerance ?? "0.1"}</p>
              </div>
            )}
              </div>
              );
            })()}

            {/* 4. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes) && testData.accuracyOfIrradiationTime.irradiationTimes.length > 0 ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">Set Time (ms)</th>
                          <th className="border border-black p-3 print:p-2">Measured Time (ms)</th>
                          <th className="border border-black p-3 print:p-2">% Error</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                          const setTime = parseFloat(row.setTime);
                          const measuredTime = parseFloat(row.measuredTime);
                          const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
                          const toleranceValue = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "5");
                          let error = "-";
                          let isPass = false;

                          if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                            error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
                            const errorVal = parseFloat(error);

                            if (toleranceOperator === "<=") {
                              isPass = errorVal <= toleranceValue;
                            } else if (toleranceOperator === ">=") {
                              isPass = errorVal >= toleranceValue;
                            } else if (toleranceOperator === "=") {
                              isPass = Math.abs(errorVal - toleranceValue) < 0.01;
                            }
                          }

                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-3 print:p-2 font-semibold">{row.setTime || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{row.measuredTime || "-"}</td>
                              <td className="border border-black p-3 print:p-2">{error}</td>
                              <td className="border border-black p-3 print:p-2">{toleranceOperator} {toleranceValue}%</td>
                              <td className="border border-black p-3 print:p-2 font-bold">
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
                ) : testData.accuracyOfIrradiationTime.maxDeviation != null ? (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-2">Parameter</th>
                          <th className="border border-black p-3 print:p-2">Measured Value</th>
                          <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                          <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">Maximum Deviation</td>
                          <td className="border border-black p-3 print:p-2">{testData.accuracyOfIrradiationTime.maxDeviation.toFixed(1)}%</td>
                          <td className="border border-black p-3 print:p-2">±5%</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={Math.abs(testData.accuracyOfIrradiationTime.maxDeviation || 0) <= 5 ? "text-green-600" : "text-red-600"}>
                              {Math.abs(testData.accuracyOfIrradiationTime.maxDeviation || 0) <= 5 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}

            {/* 5. Total Filtration */}
            {testData.totalFiltration && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Total Filtration</h3>
                {(() => {
                  const tf = testData.totalFiltration;
                  const sub = tf.totalFiltration || {};
                  const measured = tf.measured ?? sub.measured ?? tf.measuredTF ?? "-";
                  const atKvp = tf.atKvp ?? sub.atKvp ?? tf.appliedKV ?? "-";
                  const required = tf.required ?? sub.required;
                  return (
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Applied kV</th>
                        <th className="border border-black p-3 print:p-2">Measured Total Filtration</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-3 print:p-2 font-semibold">{atKvp} kV</td>
                        <td className="border border-black p-3 print:p-2">{measured} mm Al</td>
                        <td className="border border-black p-3 print:p-2">{required != null ? `≥ ${required} mm Al` : "≥ 2.5 mm Al"}</td>
                        <td className="border border-black p-3 print:p-2 font-bold">
                          <span className={tf.isPass !== false ? "text-green-600" : "text-red-600"}>
                            {tf.isPass !== undefined ? (tf.isPass ? "PASS" : "FAIL") : "PASS"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                  );
                })()}
              </div>
            )}

            {/* 3. Effective Focal Spot */}
            {testData.effectiveFocalSpot && (
              <div className="mb-8 print:mb-6 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Effective Focal Spot</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-3 print:p-2">Nominal Focal Spot Size (f)</th>
                        <th className="border border-black p-3 print:p-2">Measured Focal Spot Size</th>
                        <th className="border border-black p-3 print:p-2 bg-blue-100">Tolerance</th>
                        <th className="border border-black p-3 print:p-2 bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.effectiveFocalSpot.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots) ? (
                        testData.effectiveFocalSpot.focalSpots.map((spot: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 print:p-2 font-semibold">{spot.statedWidth || "-"} x {spot.statedHeight || "-"} mm</td>
                            <td className="border border-black p-3 print:p-2">{spot.measuredWidth || "-"} x {spot.measuredHeight || "-"} mm</td>
                            <td className="border border-black p-3 print:p-2">{spot.remark || "Complies"}</td>
                            <td className="border border-black p-3 print:p-2 font-bold text-green-600">PASS</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-3 print:p-2 font-semibold">{testData.effectiveFocalSpot.nominalFocalSpotSize || "-"} mm</td>
                          <td className="border border-black p-3 print:p-2">{testData.effectiveFocalSpot.measuredFocalSpotSize || "-"} mm</td>
                          <td className="border border-black p-3 print:p-2">{testData.effectiveFocalSpot.tolerance || "-"}</td>
                          <td className="border border-black p-3 print:p-2 font-bold">
                            <span className={testData.effectiveFocalSpot.isPass ? "text-green-600" : "text-red-600"}>
                              {testData.effectiveFocalSpot.isPass ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 13. Details of Radiation Protection Survey (RadiographyFixed structure) */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>13. Details of Radiation Protection Survey</h3>
                {/* 1. Survey Details */}
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
                {/* 2. Equipment Setting */}
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
                {/* 3. Measured Maximum Radiation Levels */}
                {(testData.radiationProtectionSurvey.locations?.length > 0 || (testData.radiationProtectionSurvey.surveyRows && testData.radiationProtectionSurvey.surveyRows.length > 0)) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Location</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mR/week</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                          {(testData.radiationProtectionSurvey.locations || testData.radiationProtectionSurvey.surveyRows || []).map((loc: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.location || "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerHr != null ? `${loc.mRPerHr} mR/hr` : (loc.exposureRate || "-")}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerWeek != null ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={loc.result === "PASS" || loc.result === "Pass" ? "text-green-600 font-semibold" : loc.result === "FAIL" || loc.result === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {loc.result || loc.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                )}
                {/* 4. Calculation Formula */}
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
                {/* 5. Summary of Maximum Radiation Level/week */}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (() => {
                  const workerLocs = (testData.radiationProtectionSurvey.locations || []).filter((loc: any) => loc.category === "worker");
                  const publicLocs = (testData.radiationProtectionSurvey.locations || []).filter((loc: any) => loc.category === "public");
                  const maxWorkerWeekly = workerLocs.length ? Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3) : "0.000";
                  const maxPublicWeekly = publicLocs.length ? Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3) : "0.000";
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
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxWorkerWeekly} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>{workerResult || "-"}</span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxPublicWeekly} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>{publicResult || "-"}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
                {/* Fallback when no locations */}
                {(!testData.radiationProtectionSurvey.locations || testData.radiationProtectionSurvey.locations.length === 0) && (!testData.radiationProtectionSurvey.surveyRows || testData.radiationProtectionSurvey.surveyRows.length === 0) && (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Parameter</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>Radiation Protection Survey</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.radiationProtectionSurvey.result || testData.radiationProtectionSurvey.remarks || "Complies with AERB limits"}</td>
                          <td className="border border-black p-2 print:p-1 font-bold text-green-600" style={{ padding: '0px 1px', fontSize: '11px' }}>PASS</td>
                        </tr>
                      </tbody>
                    </table>
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

        {/* Summary Table */}
        <div className="px-8 py-12 print:p-8">
          <div className="max-w-5xl mx-auto print:max-w-none">
            {/* <FixedRadioFlouroResultTable testResults={summaryRows} /> */}
          </div>
        </div>
      </div>

      {/* Page Count Display */}
      <div className="fixed bottom-4 left-4 print:hidden z-50 bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-gray-300">
        <p className="text-sm font-semibold text-gray-700">
          Total Pages: <span className="text-blue-600">{pageCount}</span>
        </p>
      </div>

      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            counter-reset: page 1;
            margin: 0; 
            padding: 0; 
          }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
          @page { 
            margin: 0.5cm; 
            size: A4; 
            counter-increment: page;
          }
          @page:first {
            counter-reset: page 1;
          }
          body::after {
            content: "Page " counter(page) " of " counter(pages);
            position: fixed;
            bottom: 10px;
            right: 20px;
            font-size: 10px;
            color: #555;
          }
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

export default ViewServiceReportFixedRadioFluro;