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

  // Safely extract value from potential Mongoose {value, _id} objects
  const safeVal = (v: any): string => {
    if (v == null) return "-";
    if (typeof v === "object" && "value" in v) return v.value ?? "-";
    return String(v);
  };

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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{safeVal(report.srfNumber)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>SRF Date</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: '#000000' }}>{formatDate(safeVal(report.srfDate))}</td>
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
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(report.customerName)}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(report.address)}</td>
                </tr>
              </tbody>
            </table>
          </section>
          {/* Reference */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(report.srfNumber)} / {formatDate(safeVal(report.srfDate))}</td></tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(report.testReportNumber)} / {formatDate(safeVal(report.issueDate))}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Details of Equipment Under Test</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {[
                  ["Nomenclature", safeVal(report.nomenclature)],
                  ["Make", safeVal(report.make) || "-"],
                  ["Model", safeVal(report.model)],
                  ["Serial No.", safeVal(report.slNumber)],
                  ["Category", safeVal(report.category) || "-"],
                  ["Condition", safeVal(report.condition)],
                  ["Testing Procedure No.", safeVal(report.testingProcedureNumber) || "-"],
                  ["Engineer Name & RP ID", safeVal(report.engineerNameRPId)],
                  ["Test Date", formatDate(safeVal(report.testDate))],
                  ["Due Date", formatDate(safeVal(report.testDueDate))],
                  ["Location", safeVal(report.location)],
                  ["Temperature (°C)", safeVal(report.temperature) || "-"],
                  ["Humidity (%)", safeVal(report.humidity) || "-"],
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
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(t.nomenclature)}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(t.make)} / {safeVal(t.model)}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(t.SrNo)}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(t.range)}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(t.calibrationCertificateNo)}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(safeVal(t.calibrationValidTill))}</td>
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
                <p key={safeVal(n.slNo)} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{safeVal(n.slNo)}.</strong> {safeVal(n.text)}</p>
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

            {/* Section numbering matches MainTestTable: 1 Irradiation Time, 2 kVp, 3 TF-Related(summary only), 4 Total Filtration, 5 Central Beam, 6 Congruence, 7 Focal Spot, 8 Linearity, 9 CoV, 10 Exposure, 11 Low Contrast, 12 High Contrast, 13 Tube Housing, 14 Radiation Protection */}

            {/* 6. Congruence of Radiation & Light Field */}
            {testData.congruenceOfRadiation && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Congruence of Radiation & Light Field</h3>

                {/* Technique Factors */}
                {testData.congruenceOfRadiation.techniqueFactors?.length > 0 && (
                  <div className="mb-4 print:mb-1">
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Technique Factors:</p>
                    <div className="overflow-x-auto">
                      <table className="border-2 border-black text-sm mb-4 compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>SID (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.congruenceOfRadiation.techniqueFactors.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(row.fcd || row.sid)}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(row.kv)}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(row.mas)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Dimension (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Observed Shift (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Shift in Edges (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>% of FED</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Tolerance (%)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Remarks</th>
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
                              <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px' }}>{safeVal(m.dimension || "—")}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px' }}>{safeVal(m.observedShift)}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px' }}>{safeVal(m.edgeShift)}</td>
                              <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px' }}>{percentFED != null ? `${percentFED}%` : "-"}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px' }}>{m.tolerance != null ? `≤ ${safeVal(m.tolerance)}%` : "≤ 2%"}</td>
                              <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px' }}>
                                <span className={isPass ? "text-green-600" : "text-red-600"}>{isPass ? "PASS" : "FAIL"}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" colSpan={3}>No detailed measurements available</td>
                          <td className="border border-black p-2 print:p-1 font-bold">FAIL</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Central Beam Alignment Test */}
            {testData.centralBeamAlignment && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Central Beam Alignment Test</h3>

                {/* Operating parameters */}
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div className="mb-4 print:mb-1">
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Operating parameters:</p>
                    <div className="overflow-x-auto">
                      <table className="border-2 border-black text-sm mb-4 compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>SID (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(testData.centralBeamAlignment.techniqueFactors.fcd || testData.centralBeamAlignment.techniqueFactors.sid)}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(testData.centralBeamAlignment.techniqueFactors.kv)}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(testData.centralBeamAlignment.techniqueFactors.mas)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '10px', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '500px' }}>
                    <tbody>
                      {testData.centralBeamAlignment.observedTilt && (testData.centralBeamAlignment.observedTilt.value != null || testData.centralBeamAlignment.observedTilt.remark) && (
                        <>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold w-1/2" style={{ padding: '2px 4px' }}>Observed tilt</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '2px 4px' }}>
                              {testData.centralBeamAlignment.observedTilt.value != null ? `${safeVal(testData.centralBeamAlignment.observedTilt.value)}°` : "-"}
                              {testData.centralBeamAlignment.observedTilt.remark && (
                                <span className={`ml-2 font-bold ${safeVal(testData.centralBeamAlignment.observedTilt.remark) === "Pass" ? "text-green-600" : "text-red-600"}`}>
                                  {safeVal(testData.centralBeamAlignment.observedTilt.remark)}
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '2px 4px' }}>Tolerance: Central Beam Alignment</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '2px 4px' }}>
                              {testData.centralBeamAlignment.tolerance?.value != null ? `${safeVal(testData.centralBeamAlignment.tolerance?.operator || "≤")} ${safeVal(testData.centralBeamAlignment.tolerance.value)}°` : "≤ 1.5°"}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Effective Focal Spot */}
            {testData.effectiveFocalSpot && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Effective Focal Spot Size</h3>
                {/* FFD small table */}
                <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(testData.effectiveFocalSpot.fcd)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}>Focus</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot of Tube</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot (Nominal)</th>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ width: '34%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.3' }}>
                            <div><strong>Tolerance:</strong></div>
                            <div>1. +{testData.effectiveFocalSpot?.toleranceCriteria?.small?.multiplier ?? 0.5} f for f &lt; {testData.effectiveFocalSpot?.toleranceCriteria?.small?.upperLimit ?? 0.8} mm</div>
                            <div>2. +{testData.effectiveFocalSpot?.toleranceCriteria?.medium?.multiplier ?? 0.4} f for {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.lowerLimit ?? 0.8} &lt;= f &lt;= {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.upperLimit ?? 1.5} mm</div>
                            <div>3. +{testData.effectiveFocalSpot?.toleranceCriteria?.large?.multiplier ?? 0.3} f for f &gt; {testData.effectiveFocalSpot?.toleranceCriteria?.large?.lowerLimit ?? 1.5} mm</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.effectiveFocalSpot.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                          const formatValue = (val: any) => {
                            if (val === undefined || val === null || val === "") return "-";
                            const numVal = typeof val === 'number' ? val : parseFloat(val);
                            if (isNaN(numVal)) return "-";
                            return numVal.toFixed(1);
                          };

                          const statedNominal = formatValue(
                            spot.statedNominal ??
                            (spot.statedWidth != null && spot.statedHeight != null
                              ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                              : spot.statedWidth ?? spot.statedHeight)
                          );
                          const measuredNominal = formatValue(
                            spot.measuredNominal ??
                            (spot.measuredWidth != null && spot.measuredHeight != null
                              ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                              : spot.measuredWidth ?? spot.measuredHeight)
                          );

                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>{spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={
                                  spot.remark === "Pass" || spot.remark === "PASS" ? "text-green-600" :
                                    spot.remark === "Fail" || spot.remark === "FAIL" ? "text-red-600" : ""
                                }>
                                  {spot.remark || "-"}
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

            {/* 1. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{safeVal(testData.accuracyOfIrradiationTime.testConditions.fcd || testData.accuracyOfIrradiationTime.testConditions.sid)}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{safeVal(testData.accuracyOfIrradiationTime.testConditions.kv)}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{safeVal(testData.accuracyOfIrradiationTime.testConditions.ma || testData.accuracyOfIrradiationTime.testConditions.mA)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (() => {
                  const tol = testData.accuracyOfIrradiationTime.tolerance;
                  const tolOp = tol?.operator || "<=";
                  const tolVal = parseFloat(tol?.value ?? "10");

                  const calcError = (set: string, meas: string): string => {
                    const s = parseFloat(set);
                    const m = parseFloat(meas);
                    if (isNaN(s) || isNaN(m) || s === 0) return "-";
                    return Math.abs((m - s) / s * 100).toFixed(2);
                  };

                  const getRemark = (errorPct: string): string => {
                    if (errorPct === "-" || isNaN(tolVal)) return "-";
                    const err = parseFloat(errorPct);
                    if (isNaN(err)) return "-";
                    switch (tolOp) {
                      case ">": return err > tolVal ? "PASS" : "FAIL";
                      case "<": return err < tolVal ? "PASS" : "FAIL";
                      case ">=": return err >= tolVal ? "PASS" : "FAIL";
                      case "<=": return err <= tolVal ? "PASS" : "FAIL";
                      default: return "-";
                    }
                  };

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                            const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                            const remark = getRemark(error);
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(row.setTime)}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(row.measuredTime)}</td>
                                <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error !== "-" ? `${error}%` : "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                    {remark}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "10"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Operating Potential (kVp)</h3>

                {/* Test Conditions */}
                {testData.accuracyOfOperatingPotential.table1?.length > 0 && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <p className="font-semibold text-xs print:text-[10px]" style={{ marginBottom: '2px' }}>Test Conditions:</p>
                    <div className="text-xs print:text-[9px] flex gap-4">
                      {testData.accuracyOfOperatingPotential.table1.map((c: any, i: number) => (
                        <div key={i} className="border border-gray-200 px-2 rounded bg-gray-50 uppercase">
                          mA: <span className="font-bold">{safeVal(c.mA || c.ma)}</span> | Time: <span className="font-bold">{safeVal(c.time)} ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-1 text-center font-bold" style={{ fontSize: '10px' }}>Set kVp</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ fontSize: '10px' }}>Measured kVp</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ fontSize: '10px' }}>% Deviation</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ fontSize: '10px' }}>Tolerance</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ fontSize: '10px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => {
                        const setKvp = parseFloat(row.setKvp || row.setKVp || row.setKV || "0");
                        const measuredKvp = parseFloat(row.measuredKvp || row.measuredKVp || row.avgKvp || "0");
                        const deviation = row.deviation != null ? row.deviation : (setKvp > 0 ? ((measuredKvp - setKvp) / setKvp) * 100 : 0);
                        return (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-1 font-semibold" style={{ fontSize: '10px' }}>{safeVal(row.setKvp || row.setKVp || row.setKV)}</td>
                            <td className="border border-black p-1" style={{ fontSize: '10px' }}>{safeVal(row.measuredKvp || row.measuredKVp || row.avgKvp)}</td>
                            <td className="border border-black p-1" style={{ fontSize: '10px' }}>{deviation != null ? deviation.toFixed(2) + "%" : "-"}</td>
                            <td className="border border-black p-1" style={{ fontSize: '10px' }}>±10%</td>
                            <td className="border border-black p-1 font-bold" style={{ fontSize: '10px' }}>
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

            {/* 4. Total Filtration */}
            {testData.totalFiltration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Total Filtration</h3>
                {(() => {
                  const tf = testData.totalFiltration;
                  const sub = tf.totalFiltration || {};
                  const measured = tf.measured ?? sub.measured ?? tf.measuredTF ?? "-";
                  const atKvp = tf.atKvp ?? sub.atKvp ?? tf.appliedKV ?? "-";
                  const required = tf.required ?? sub.required ?? "2.5";
                  return (
                    <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                      <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold">Applied kV</th>
                            <th className="border border-black p-1 text-center font-bold">Measured Total Filtration (mm Al)</th>
                            <th className="border border-black p-1 text-center font-bold">Tolerance</th>
                            <th className="border border-black p-1 text-center font-bold">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border border-black p-1 text-center">{safeVal(atKvp)} kV</td>
                            <td className="border border-black p-1 text-center">{safeVal(measured)} mm Al</td>
                            <td className="border border-black p-1 text-center">≥ {safeVal(required)} mm Al</td>
                            <td className="border border-black p-1 text-center font-bold">
                              <span className={tf.isPass !== false ? "text-green-600" : "text-red-600"}>
                                {tf.isPass !== false ? "PASS" : "FAIL"}
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

            {/* 8. Linearity of mAs Loading */}
            {(testData.linearityOfmAsLoading || testData.linearityOfMaLoading) && (
              <div className="mb-16 print:mb-12 test-section">
                <h3 className="text-lg font-bold mb-4 print:mb-1 print:text-sm" style={{ fontSize: '14px', marginBottom: '4px' }}>8. Linearity of mAs Loading</h3>
                {/* Test Conditions as table */}
                {(() => {
                  const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
                  const table1 = linearityData.table1 || linearityData.testConditions;
                  if (!table1 || (Array.isArray(table1) && table1.length === 0)) return null;

                  const conditions = Array.isArray(table1) ? table1[0] : table1;
                  return (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '6px' }}>
                      <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '3px' }}>Test Conditions:</p>
                      <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FCD (cm)</th>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>kV</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(conditions?.fcd || conditions?.sid)}</td>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(conditions?.kv)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
                  const rows = linearityData.table2 || [];
                  if (rows.length === 0) return null;

                  const tolVal = parseFloat(linearityData.tolerance ?? '0.1') || 0.1;
                  const tolOp = linearityData.toleranceOperator ?? '<=';
                  const measHeaders = linearityData.measHeaders || Array.from({ length: Math.max(...rows.map((r: any) => (r.measuredOutputs || []).length), 1) }, (_, i) => `Meas ${i + 1}`);

                  const formatV = (val: any) => {
                    if (val === undefined || val === null) return '-';
                    const str = String(val).trim();
                    return str === '' || str === '—' || str === 'undefined' || str === 'null' ? '-' : str;
                  };

                  // Recalculate values using same logic as reference
                  const xValues: number[] = [];
                  const processedRows = rows.map((row: any) => {
                    const outputs = (row.measuredOutputs ?? [])
                      .map((v: any) => parseFloat(v))
                      .filter((v: number) => !isNaN(v) && v > 0);
                    const avg = outputs.length > 0
                      ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length
                      : null;
                    const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : '—';

                    const mAsLabel = String(row.mAsApplied ?? row.mAs ?? row.mAsRange ?? '');
                    const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                    const midMas = match
                      ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
                      : parseFloat(mAsLabel) || 0;

                    const x = avg !== null && midMas > 0 ? avg / midMas : null;
                    const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : '—';
                    if (x !== null) xValues.push(parseFloat(x.toFixed(4)));

                    return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                  });

                  const hasData = xValues.length > 0;
                  const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : '—';
                  const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : '—';
                  const colNum = hasData && xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
                    ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                    : 0;
                  const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';

                  let pass = false;
                  if (hasData && col !== '—') {
                    const colVal = parseFloat(col);
                    switch (tolOp) {
                      case '<': pass = colVal < tolVal; break;
                      case '>': pass = colVal > tolVal; break;
                      case '<=': pass = colVal <= tolVal; break;
                      case '>=': pass = colVal >= tolVal; break;
                      case '=': pass = Math.abs(colVal - tolVal) < 0.0001; break;
                      default: pass = colVal <= tolVal;
                    }
                  }
                  const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>mA/mAs</th>
                            <th colSpan={measHeaders.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              Output (mGy)
                            </th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X (mGy/mA)</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MAX</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MIN</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>CoL</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            {measHeaders.map((header: string, idx: number) => (
                              <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                {header || `Meas ${idx + 1}`}
                              </th>
                            ))}
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>{formatV(row.mAsApplied ?? row.mAs ?? row.mAsRange)}</td>
                              {measHeaders.map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                  {formatV(row.measuredOutputs?.[idx])}
                                </td>
                              ))}
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row._avgDisplay}</td>
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row._xDisplay}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{xMax}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{xMin}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{col}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                    <span className={
                                      remarks === 'Pass' ? 'text-green-600 font-semibold' :
                                        remarks === 'Fail' ? 'text-red-600 font-semibold' : ''
                                    } style={{ fontSize: '10px' }}>
                                      {remarks}
                                    </span>
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {(() => {
                  const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
                  if (!linearityData.tolerance) return null;
                  return (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border">
                      <p className="text-sm print:text-[10px]" style={{ fontSize: '10px' }}>
                        <strong>Tolerance (CoL):</strong> {linearityData.toleranceOperator || "≤"} {linearityData.tolerance || "0.1"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 9. Consistency of Radiation Output */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. Consistency of Radiation Output</h3>
                
                {testData.outputConsistency.ffd?.value && (
                  <div className="mb-4 print:mb-1">
                    <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '150px' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.outputConsistency.ffd.value}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.outputConsistency.outputRows?.length > 0 && (() => {
                  const rows = testData.outputConsistency.outputRows;
                  const measCount = Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
                  const tolVal = parseFloat(testData.outputConsistency.tolerance?.value ?? '0.05') || 0.05;
                  const tolOp = testData.outputConsistency.tolerance?.operator ?? '<=';

                  const getVal = (o: any): number => {
                    if (o == null) return NaN;
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                            {Array.from({ length: measCount }, (_, i) => (
                              <th key={i} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Meas {i + 1}</th>
                            ))}
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (X̄)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>CoV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
                            const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                            const avgDisplay = avg !== null ? avg.toFixed(4) : (row.avg || '-');
                            let covDisplay = '-';
                            let remark = row.remark || '-';
                            if (avg !== null && avg > 0) {
                              const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
                              const cov = Math.sqrt(variance) / avg;
                              if (isFinite(cov)) {
                                covDisplay = cov.toFixed(3);
                                const passes = (tolOp === '<=' || tolOp === '<') ? cov <= tolVal : cov >= tolVal;
                                remark = passes ? 'Pass' : 'Fail';
                              }
                            } else if (row.cv) {
                              covDisplay = row.cv;
                            }
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || '-'}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || '-'}</td>
                                {Array.from({ length: measCount }, (_, j) => {
                                  const raw = (row.outputs ?? [])[j];
                                  const display = raw != null ? (typeof raw === 'object' && 'value' in raw ? raw.value : String(raw)) : '-';
                                  return (
                                    <td key={j} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{display || '-'}</td>
                                  );
                                })}
                                <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{avgDisplay}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{covDisplay}</td>
                                <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                  <span className={remark === 'Pass' ? 'text-green-600' : remark === 'Fail' ? 'text-red-600' : ''}>
                                    {remark}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[10px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value || "0.05"}
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* 11. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>11. Low Contrast Resolution</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr className="bg-blue-50">
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Diameter of the smallest size hole clearly resolved on the monitor</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold">{safeVal(testData.lowContrastResolution.smallestHoleSize || "1.0")} mm</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Recommended performance standard</td>
                        <td className="border border-black p-2 print:p-1 text-center">3.0 mm hole pattern must be resolved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 12. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>12. High Contrast Resolution</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr className="bg-blue-50">
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Bar strips resolved on the monitor</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold">{safeVal(testData.highContrastResolution.measuredLpPerMm || "1.0")} lp/mm</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Recommended performance standard</td>
                        <td className="border border-black p-2 print:p-1 text-center">1.50 lp/mm pattern must be resolved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 10. Exposure Rate at Table Top */}
            {testData.exposureRate && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. Exposure Rate at Table Top</h3>
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-1 text-center font-bold">Applied kV/mA</th>
                        <th className="border border-black p-1 text-center font-bold">Measured Exposure (cGy/min)</th>
                        <th className="border border-black p-1 text-center font-bold">Tolerance</th>
                        <th className="border border-black p-1 text-center font-bold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(testData.exposureRate.rows) && testData.exposureRate.rows.length > 0 ? (
                        testData.exposureRate.rows.map((row: any, i: number) => {
                          const exposure = parseFloat(row.exposure || "0");
                          const tolerance = row.remark?.toLowerCase().includes("aec") ? 10 : 5;
                          const isPass = exposure <= tolerance;
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-1 font-semibold">{safeVal(row.appliedKv)} kV / {safeVal(row.appliedMa)} mA</td>
                              <td className="border border-black p-1">{safeVal(row.exposure)}</td>
                              <td className="border border-black p-1">≤ {tolerance} cGy/min</td>
                              <td className="border border-black p-1 font-bold">
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-1 font-semibold">Exposure Rate</td>
                          <td className="border border-black p-1">{safeVal(testData.exposureRate.measuredValue)}</td>
                          <td className="border border-black p-1">≤ 5 cGy/min</td>
                          <td className="border border-black p-1 font-bold">
                            <span className={testData.exposureRate.isPass ? "text-green-600" : "text-red-600"}>
                              {testData.exposureRate.isPass ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 13. Tube Housing Leakage */}
            {testData.radiationLeakageLevel && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>13. Tube Housing Leakage</h3>

                {/* Technique Factors */}
                <div className="mb-4 print:mb-1">
                  <table className="border border-black text-sm mb-4 compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-1 text-center font-bold">FDD (cm)</th>
                        <th className="border border-black p-1 text-center font-bold">Applied kV</th>
                        <th className="border border-black p-1 text-center font-bold">Applied mA</th>
                        <th className="border border-black p-1 text-center font-bold">Time (sec)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center font-medium">
                        <td className="border border-black p-1">{safeVal(testData.radiationLeakageLevel.fdd)}</td>
                        <td className="border border-black p-1">{safeVal(testData.radiationLeakageLevel.kv)}</td>
                        <td className="border border-black p-1">{safeVal(testData.radiationLeakageLevel.ma)}</td>
                        <td className="border border-black p-1">{safeVal(testData.radiationLeakageLevel.time)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Location</th>
                        <th colSpan={5} className="border border-black p-1 text-center font-bold">Exposure Level (mR/hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Result (mR in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Result (mGy in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Remarks</th>
                      </tr>
                      <tr className="bg-gray-50 text-[10px]">
                        <th className="border border-black p-1 font-bold">Left</th>
                        <th className="border border-black p-1 font-bold">Right</th>
                        <th className="border border-black p-1 font-bold">Front</th>
                        <th className="border border-black p-1 font-bold">Back</th>
                        <th className="border border-black p-1 font-bold">Top</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationLeakageLevel.leakageMeasurements?.map((row: any, i: number) => {
                        const maValue = parseFloat(testData.radiationLeakageLevel.ma || "0");
                        const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");
                        const values = [row.left, row.right, row.front, row.back, row.top].map(v => parseFloat(v) || 0).filter(v => v > 0);
                        const rowMax = values.length > 0 ? Math.max(...values) : 0;
                        const resMR = rowMax > 0 && maValue > 0 ? (workloadValue * rowMax) / (60 * maValue) : 0;
                        const resMGy = resMR / 114;
                        const isPass = resMGy <= 1.0;
                        return (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-1 font-medium">{safeVal(row.location)}</td>
                            <td className="border border-black p-1">{safeVal(row.left)}</td>
                            <td className="border border-black p-1">{safeVal(row.right)}</td>
                            <td className="border border-black p-1">{safeVal(row.front)}</td>
                            <td className="border border-black p-1">{safeVal(row.back)}</td>
                            <td className="border border-black p-1">{safeVal(row.top)}</td>
                            <td className="border border-black p-1 font-semibold">{resMR > 0 ? resMR.toFixed(3) : "-"}</td>
                            <td className="border border-black p-1 font-semibold">{resMGy > 0 ? resMGy.toFixed(4) : "-"}</td>
                            <td className="border border-black p-1 font-bold">
                              <span className={isPass ? "text-green-600" : "text-red-600"}>{resMR > 0 ? (isPass ? "Pass" : "Fail") : "-"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Formula and Note Block */}
                <div className="mt-4 space-y-2 print:mt-1">
                  <div className="bg-gray-50 p-2 border border-dashed border-black text-center font-mono text-[9px] print:text-[8px]">
                    Max Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA) | [1 mGy = 114 mR]
                  </div>
                  <div className="bg-blue-50 p-2 border-l-4 border-blue-500 rounded text-[9px] print:text-[8px] leading-tight">
                    <strong>Note:</strong> The maximum leakage radiation from the X-ray tube housing and collimator, measured at a distance of 1 meter from the focus, averaged over an area of 100 cm², shall not exceed 1.0 mGy in one hour.
                  </div>
                </div>
              </div>
            )}

            {/* 14. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>14. Radiation Protection Survey</h3>

                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.hasValidCalibration)}</td>
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
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.appliedCurrent)}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Voltage (kV)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.appliedVoltage)}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Exposure Time(s)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.exposureTime)}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Workload (mA min/week)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.workload)}</td>
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
                              <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(loc.location)}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerHr != null ? `${safeVal(loc.mRPerHr)} mR/hr` : safeVal(loc.exposureRate)}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerWeek != null ? `${safeVal(loc.mRPerWeek)} mR/week` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={safeVal(loc.result) === "PASS" || safeVal(loc.result) === "Pass" ? "text-green-600 font-semibold" : safeVal(loc.result) === "FAIL" || safeVal(loc.result) === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {safeVal(loc.result || loc.remarks)}
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
      </div>

      {/* Summary Table */}
      <div className="px-8 py-12 print:p-8">
        <div className="max-w-5xl mx-auto print:max-w-none">
          {/* <FixedRadioFlouroResultTable testResults={summaryRows} /> */}
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