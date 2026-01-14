// src/components/reports/ViewServiceReportOBI.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForOBI, getDetails } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
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
  pages?: string;
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
  HighContrastSensitivityOBI?: any;
  LowContrastSensitivityOBI?: any;
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
  const [calculatedPages, setCalculatedPages] = useState<string>("");
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

            // Handle new structure (measurements)
            if (opData.measurements && Array.isArray(opData.measurements)) {
              const rows = opData.measurements.map((measurement: any) => ({
                appliedKvp: measurement.appliedKvp || "-",
                averageKvp: measurement.averageKvp || "-",
                measuredValues: measurement.measuredValues || [],
                remarks: measurement.remarks || "-",
              }));

              return {
                ...opData,
                rows, // New structure uses 'rows'
                mAStations: opData.mAStations || [],
                totalFiltration: opData.totalFiltration || { measured: "", required: "" },
                ffd: opData.ffd || "",
                toleranceSign: opData.tolerance?.sign || "±",
                toleranceValue: opData.tolerance?.value || "2.0",
              };
            }

            // Fallback for old structure (table2)
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
              outputRows: outputRows.map((row: any) => {
                // Calculate CV if missing (backward compatibility)
                if (!row.cv && !row.cov && row.outputs && row.outputs.length > 0) {
                  const values = row.outputs.map((o: any) => parseFloat(o.value || o)).filter((n: number) => !isNaN(n));
                  if (values.length > 0) {
                    const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / (values.length > 1 ? values.length - 1 : 1);
                    const stdDev = Math.sqrt(variance);
                    const cv = mean > 0 ? (stdDev / mean) : 0;
                    row.cv = cv.toFixed(4);
                  }
                }
                return row;
              }),
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
              measHeaders: lotData.measHeaders, // Headers for dynamic columns
              testConditions: lotData.testConditions || {},
            };
          };

          const transformTubeHousingLeakage = (thlData: any) => {
            if (!thlData || typeof thlData !== 'object') return null;
            if (typeof thlData === 'string') return null;

            let leakageMeasurements = Array.isArray(thlData.leakageMeasurements) ? thlData.leakageMeasurements : [];

            // If measurements are empty but we have old flat structure (unlikely for array but good to be safe), handle or skip
            // Ensure we have at least 2 rows (Tube and Collimator) structure or similar
            if (leakageMeasurements.length === 0) return null;

            // Recalculate values if missing (backward compatibility or missing from save)
            const workloadValue = parseFloat(thlData.workload) || 0;
            const maValue = parseFloat(thlData.ma) || 0;

            leakageMeasurements = leakageMeasurements.map((row: any) => {
              const values = [row.left, row.right, row.front, row.back, row.top]
                .map((v: any) => parseFloat(v) || 0)
                .filter((v: number) => v > 0);

              const calculatedMax = values.length > 0 ? Math.max(...values).toFixed(2) : (row.max || '');
              const maxNum = parseFloat(calculatedMax) || 0;

              let result = row.result;
              let mgy = row.mgy;

              if ((!result || result === '0' || result === '') && maxNum > 0 && maValue > 0 && workloadValue > 0) {
                const val = (workloadValue * maxNum) / (60 * maValue);
                result = val.toFixed(4);
                if (!mgy) {
                  mgy = (val / 114).toFixed(4);
                }
              }

              return {
                ...row,
                max: calculatedMax,
                result: result || '',
                mgy: mgy || '',
              };
            });

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

          const transformHighContrastSensitivity = (hcsData: any) => {
            if (!hcsData || typeof hcsData !== 'object') return null;
            if (typeof hcsData === 'string') return null;
            return hcsData;
          };

          const transformLowContrastSensitivity = (lcsData: any) => {
            if (!lcsData || typeof lcsData !== 'object') return null;
            if (typeof lcsData === 'string') return null;
            return lcsData;
          };

          const transformedTestData = {
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
            highContrastSensitivity: transformHighContrastSensitivity(data.HighContrastSensitivityOBI),
            lowContrastSensitivity: transformLowContrastSensitivity(data.LowContrastSensitivityOBI),
          };

          setTestData(transformedTestData);

          // Calculate pages based on content structure
          // Page 1: Main report header (always present)
          // Page 2: Summary table (always present if any tests exist)
          let pagesCount = 2;
          
          // Count detailed test sections that will be displayed
          // The report structure has page breaks: page 1, page 2 (summary), then detailed tests
          const detailedTestSections = [
            { name: 'alignmentTest', data: transformedTestData.alignmentTest, estimatedPages: 0.5 }, // Small section
            { name: 'operatingPotential', data: transformedTestData.operatingPotential, estimatedPages: 1 },
            { name: 'timerTest', data: transformedTestData.timerTest, estimatedPages: 0.5 },
            { name: 'outputConsistency', data: transformedTestData.outputConsistency, estimatedPages: 1 },
            { name: 'centralBeamAlignment', data: transformedTestData.centralBeamAlignment, estimatedPages: 0.5 },
            { name: 'congruenceOfRadiation', data: transformedTestData.congruenceOfRadiation, estimatedPages: 0.5 },
            { name: 'effectiveFocalSpot', data: transformedTestData.effectiveFocalSpot, estimatedPages: 0.5 },
            { name: 'linearityOfMasLoading', data: transformedTestData.linearityOfMasLoading, estimatedPages: 1 },
            { name: 'linearityOfTime', data: transformedTestData.linearityOfTime, estimatedPages: 1 },
            { name: 'tubeHousingLeakage', data: transformedTestData.tubeHousingLeakage, estimatedPages: 1.5 }, // Large section with calculations
            { name: 'radiationProtection', data: transformedTestData.radiationProtection, estimatedPages: 1.5 }, // Large section
            { name: 'highContrastSensitivity', data: transformedTestData.highContrastSensitivity, estimatedPages: 0.5 },
            { name: 'lowContrastSensitivity', data: transformedTestData.lowContrastSensitivity, estimatedPages: 0.5 },
          ];

          // Calculate total pages for detailed sections
          let detailedPages = 0;
          detailedTestSections.forEach(section => {
            if (section.data !== null && section.data !== undefined) {
              // Check if data is an object with content
              if (typeof section.data === 'object' && Object.keys(section.data).length > 0) {
                detailedPages += section.estimatedPages;
              }
            }
          });

          // Round up to nearest integer for detailed pages
          pagesCount += Math.ceil(detailedPages);

          setCalculatedPages(String(pagesCount));
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
        // The key format is: reportNumbers_${orderId}
        // We need to search all keys that start with 'reportNumbers_'
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


  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `OBI-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{ulrNumber}</td>
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
            QA TEST REPORT FOR ON-BOARD IMAGING (OBI)
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance as per AERB Guidelines)
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
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Equipment Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make || "-"],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ["Location", report.location],
                  ["Test Date", formatDate(report.testDate)],
                  ["No. of Pages", calculatedPages || report.pages || "-"],
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
            <MainTestTableForOBI testData={testData} />
          </div>
        </div>
        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>
        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* 1. Alignment Test */}
            {testData.alignmentTest?.testRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Alignment Test</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Name</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.alignmentTest.testRows.map((row: any, i: number) => (
                        <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.testName || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.sign} {row.value || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Accuracy of Operating Potential */}
            {(testData.operatingPotential?.rows?.length > 0 || testData.operatingPotential?.table2?.length > 0) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. ACCURACY OF OPERATING POTENTIAL (KVP)</h3>

                {/* NEW STRUCTURE RENDER */}
                {testData.operatingPotential?.rows?.length > 0 ? (
                  <>
                    {/* FFD Display */}
                    {testData.operatingPotential.ffd && (
                      <div className="mb-4 print:mb-1 flex flex-col gap-2" style={{ marginBottom: '4px' }}>
                        <span className="text-sm print:text-[9px] font-bold" style={{ fontSize: '11px' }}>Operating parameters:</span>
                        <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <tbody>
                            <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center font-bold w-1/4" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FFD (cm)</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.operatingPotential.ffd}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

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
                            <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                              {row.measuredValues?.map((val: string, idx: number) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600 font-semibold" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Tolerance */}
                    <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px', marginBottom: '4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Tolerance:</strong> {testData.operatingPotential.toleranceSign || "±"} {testData.operatingPotential.toleranceValue || "2.0"}%
                      </p>
                    </div>

                    {/* Total Filtration Display */}
                    {testData.operatingPotential.totalFiltration && (testData.operatingPotential.totalFiltration.measured || testData.operatingPotential.totalFiltration.required) && (
                      <div className="bg-gray-50 p-6 print:p-1 rounded-lg border" style={{ padding: '2px 4px' }}>
                        <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Total Filtration</h4>
                        <div className="space-y-2 print:space-y-0">
                          <p className="text-base print:text-[9px]" style={{ fontSize: '11px' }}>
                            <strong>Measured:</strong> {testData.operatingPotential.totalFiltration.measured || "-"} mm Al
                          </p>
                          <p className="text-base print:text-[9px]" style={{ fontSize: '11px' }}>
                            <strong>Required:</strong> {testData.operatingPotential.totalFiltration.required || "-"} mm Al
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* OLD STRUCTURE RENDER (Fallback) */
                  <>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>@ mA 10</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>@ mA 100</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>@ mA 200</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.operatingPotential.table2.map((row: any, i: number) => (
                            <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma10 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma100 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma200 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600 font-semibold" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Tolerance */}
                    <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                        <strong>Tolerance:</strong> {testData.operatingPotential.toleranceSign || "±"} {testData.operatingPotential.toleranceValue || "2.0"}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. Timer Test */}
            {testData.timerTest?.irradiationTimes?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. ACCURACY OF IRRADIATION TIME</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Operating parameters:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FCD (cm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.timerTest.testConditions?.fcd || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.timerTest.testConditions?.kv || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.timerTest.testConditions?.ma || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.timerTest.irradiationTimes.map((row: any, i: number) => {
                        const toleranceOperator = testData.timerTest.tolerance?.operator || "<=";
                        const toleranceValue = testData.timerTest.tolerance?.value || "5";
                        return (
                          <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>-</td>
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
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. OUTPUT CONSISTENCY</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Operating parameters:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold w-1/4" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FFD (cm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.outputConsistency.ffd?.value || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                        <th colSpan={testData.outputConsistency.outputRows[0]?.outputs?.length || 3} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          Radiation Output mGy
                        </th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg. (X)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Coefficient of Variation CoV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                      <tr>
                        {Array.from({ length: testData.outputConsistency.outputRows[0]?.outputs?.length || 3 }, (_, i) => (
                          <th key={i} className="border border-black p-1 print:p-0.5 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                        <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kv || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas || "-"}</td>
                          {row.outputs?.map((val: any, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val.value || val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avg || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.cv || row.cov || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> CoV &lt; {testData.outputConsistency.tolerance?.value || "0.05"}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. CENTRAL BEAM ALIGNMENT</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Technique factors:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FCD (cm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.techniqueFactors?.fcd || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.techniqueFactors?.kv || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.techniqueFactors?.mas || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Observed Tilt</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.observedTilt?.value ? `${testData.centralBeamAlignment.observedTilt.value}°` : "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.tolerance?.operator || "≤"} {testData.centralBeamAlignment.tolerance?.value || "-"}°</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          <span className={testData.centralBeamAlignment.finalResult === "Pass" || testData.centralBeamAlignment.observedTilt?.remark === "Pass" ? "text-green-600 font-semibold" : testData.centralBeamAlignment.finalResult === "Fail" || testData.centralBeamAlignment.observedTilt?.remark === "Fail" ? "text-red-600 font-semibold" : ""}>
                            {testData.centralBeamAlignment.finalResult || testData.centralBeamAlignment.observedTilt?.remark || "-"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Congruence of Radiation */}
            {testData.congruenceOfRadiation?.congruenceMeasurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. CONGRUENCE OF RADIATION</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Dimension</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Observed Shift (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Edge Shift (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% FED</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance (%)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.congruenceOfRadiation.congruenceMeasurements.map((row: any, i: number) => (
                        <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.dimension || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.observedShift || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.edgeShift || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.percentFED || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.tolerance || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={row.remark === "Pass" || row.remark === "PASS" ? "text-green-600 font-semibold" : row.remark === "Fail" || row.remark === "FAIL" ? "text-red-600 font-semibold" : ""}>
                              {row.remark || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Effective Focal Spot */}
            {testData.effectiveFocalSpot?.focalSpots?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. EFFECTIVE FOCAL SPOT</h3>
                <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>FCD:</strong> {testData.effectiveFocalSpot.fcd || "-"} cm
                  </p>
                </div>
                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Focus Type</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Stated Width (mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Stated Height (mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Width (mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Height (mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.effectiveFocalSpot.focalSpots.map((row: any, i: number) => (
                          <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.focusType || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.statedWidth || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.statedHeight || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredWidth || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredHeight || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.remark === "Pass" || row.remark === "PASS" ? "text-green-600 font-semibold" : row.remark === "Fail" || row.remark === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                {row.remark || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Final Result:</strong> {testData.effectiveFocalSpot.finalResult || "-"}
                  </p>
                </div>
              </div>
            )}

            {/* 8. Linearity of mAs Loading Stations */}
            {testData.linearityOfMasLoading?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. LINEARITY OF MAS LOADING STATIONS</h3>
                {testData.linearityOfMasLoading.table1 && testData.linearityOfMasLoading.table1.length > 0 && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border print:p-1" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '4px' }}>Operating parameters:</p>
                    <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      FCD: {testData.linearityOfMasLoading.table1[0]?.fcd || "-"} cm |
                      kV: {testData.linearityOfMasLoading.table1[0]?.kv || "-"} |
                      Time: {testData.linearityOfMasLoading.table1[0]?.time || "-"} sec
                    </div>
                  </div>
                )}
                {testData.linearityOfMasLoading.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>mAs Applied</th>
                          <th colSpan={testData.linearityOfMasLoading.measHeaders?.length || testData.linearityOfMasLoading.table2[0]?.measuredOutputs?.length || 0} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>
                            Output (mGy)
                          </th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>Avg Output</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>X (mGy/mAs)</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>X MAX</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>X MIN</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                        <tr>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                          {(testData.linearityOfMasLoading.measHeaders || Array.from({ length: testData.linearityOfMasLoading.table2[0]?.measuredOutputs?.length || 3 }, (_, i) => `Meas ${i + 1}`)).map((h: string, idx: number) => (
                            <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>
                              {h || `Meas ${idx + 1}`}
                            </th>
                          ))}
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.linearityOfMasLoading.table2.map((row: any, i: number) => (
                          <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.mAsApplied || "-"}</td>
                            {row.measuredOutputs?.map((val: string, idx: number) => (
                              <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                            ))}
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.average || "-"}</td>
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.x || "-"}</td>
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.xMax || "-"}</td>
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.xMin || "-"}</td>
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.col || "-"}</td>
                            <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', borderColor: '#000000', textAlign: 'center' }}>{row.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Tolerance */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> Coefficient of Linearity ≤ {testData.linearityOfMasLoading.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 9. Linearity of Time */}
            {testData.linearityOfTime?.measurementRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. LINEARITY OF TIME</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Test conditions:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FDD (cm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.linearityOfTime.testConditions?.fdd || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.linearityOfTime.testConditions?.kv || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (Sec)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.linearityOfTime.testConditions?.time || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA Applied</th>
                        <th colSpan={testData.linearityOfTime.measHeaders?.length || 3} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Radiation Output (mGy)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average Output (mGy)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mGy / mAs (X)</th>
                      </tr>
                      <tr>
                        {testData.linearityOfTime.measHeaders ? (
                          testData.linearityOfTime.measHeaders.map((header: string, i: number) => (
                            <th key={i} className="border border-black p-1 print:p-0.5 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{header}</th>
                          ))
                        ) : (
                          <>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>1</th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>2</th>
                            <th className="border border-black p-1 print:p-0.5 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>3</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime.measurementRows.map((row: any, i: number) => (
                        <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.maApplied || "-"}</td>
                          {Array.isArray(row.radiationOutputs) ? (
                            row.radiationOutputs.map((val: string, idx: number) => (
                              <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                            ))
                          ) : (
                            // Fallback for old data
                            <>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.radiationOutput1 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.radiationOutput2 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.radiationOutput3 || "-"}</td>
                            </>
                          )}
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageOutput || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mGyPerMAs || "-"}</td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr className="bg-blue-50 font-semibold" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td colSpan={(testData.linearityOfTime.measHeaders?.length || 3) + 2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Summary</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X MAX: {testData.linearityOfTime.xMax || "-"} | X MIN: {testData.linearityOfTime.xMin || "-"}</td>
                      </tr>
                      <tr className="bg-blue-50 font-semibold" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td colSpan={(testData.linearityOfTime.measHeaders?.length || 3) + 2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Coefficient of Linearity (CoL): {testData.linearityOfTime.coefficientOfLinearity || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.linearityOfTime.remarks || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Tolerance */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> CoL &lt; {testData.linearityOfTime.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 10. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. TUBE HOUSING LEAKAGE</h3>

                {/* Operating Parameters */}
                <div className="mb-4">
                  <h4 className="font-bold underline mb-2 text-sm">Operating parameters:</h4>
                  <table className="w-full border-2 border-black text-sm" style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td className="border-r border-black px-4 py-2 font-bold w-32 bg-gray-50 print:bg-transparent">FDD (cm)</td>
                        <td className="border-r border-black p-2 text-center">{testData.tubeHousingLeakage.fcd || "-"}</td>
                        <td className="border-r border-black px-4 py-2 font-bold w-16 bg-gray-50 print:bg-transparent">kV</td>
                        <td className="border-r border-black p-2 text-center">{testData.tubeHousingLeakage.kv || "-"}</td>
                        <td className="border-r border-black px-4 py-2 font-bold w-16 bg-gray-50 print:bg-transparent">mA</td>
                        <td className="border-r border-black p-2 text-center">{testData.tubeHousingLeakage.ma || "-"}</td>
                        <td className="border-r border-black px-4 py-2 font-bold w-16 bg-gray-50 print:bg-transparent">Time</td>
                        <td className="p-2 text-center">{testData.tubeHousingLeakage.time || "-"} Sec</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Leakage Table */}
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm" style={{ width: '100%' }}>
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th rowSpan={2} className="border-r border-black px-2 py-2 text-left w-32 bg-gray-50 print:bg-transparent">Location<br />(at 1.0 m)</th>
                        <th colSpan={5} className="border-r border-black px-2 py-1 text-center border-b border-black bg-gray-50 print:bg-transparent">Exposure Level (mR/hr)</th>
                        <th colSpan={2} className="border-r border-black px-2 py-2 text-center w-64 bg-gray-50 print:bg-transparent">Result</th>
                        <th rowSpan={2} className="px-2 py-2 text-center w-24 bg-gray-50 print:bg-transparent">Remarks</th>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <th className="border-r border-black px-2 py-1 text-center w-24 bg-gray-50 print:bg-transparent">Left</th>
                        <th className="border-r border-black px-2 py-1 text-center w-24 bg-gray-50 print:bg-transparent">Right</th>
                        <th className="border-r border-black px-2 py-1 text-center w-24 bg-gray-50 print:bg-transparent">Front</th>
                        <th className="border-r border-black px-2 py-1 text-center w-24 bg-gray-50 print:bg-transparent">Back</th>
                        <th className="border-r border-black px-2 py-1 text-center w-24 bg-gray-50 print:bg-transparent">Top</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {testData.tubeHousingLeakage.leakageMeasurements.map((row: any, i: number) => (
                        <tr key={i} className="divide-x divide-black border-b border-black">
                          <td className="px-3 py-2 font-bold text-center">{row.location || "-"}</td>
                          <td className="px-1 py-1 text-center">{row.left || "-"}</td>
                          <td className="px-1 py-1 text-center">{row.right || "-"}</td>
                          <td className="px-1 py-1 text-center">{row.front || "-"}</td>
                          <td className="px-1 py-1 text-center">{row.back || "-"}</td>
                          <td className="px-1 py-1 text-center">{row.top || "-"}</td>
                          <td className="px-2 py-2 text-right font-bold w-24 border-r-0">{row.result || "-"}</td>
                          <td className="px-2 py-2 text-left w-40 border-l-0">mR in one hour</td>
                          <td className="px-2 py-2 text-center font-bold">Pass</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation & Workload */}
                {(() => {
                  const tubeRow = testData.tubeHousingLeakage.leakageMeasurements[0] || {};
                  const collRow = testData.tubeHousingLeakage.leakageMeasurements[1] || {};

                  const tubeMax = parseFloat(tubeRow.max || '0');
                  const collMax = parseFloat(collRow.max || '0');
                  const maxExposure = Math.max(tubeMax, collMax).toFixed(2);

                  const maxResultMR = Math.max(parseFloat(tubeRow.result || '0'), parseFloat(collRow.result || '0')).toFixed(3);
                  const workload = testData.tubeHousingLeakage.workload || "180";
                  const maUsed = testData.tubeHousingLeakage.ma || "50";

                  const tubeResultMGy = tubeRow.mgy || (parseFloat(tubeRow.result || '0') / 114).toFixed(3);
                  const collResultMGy = collRow.mgy || (parseFloat(collRow.result || '0') / 114).toFixed(3);

                  return (
                    <>
                      <div className="border-2 border-black p-0 mb-6 text-sm">
                        <div className="p-2 border-b border-black flex items-center gap-2">
                          <span className="font-bold">Work Load</span>
                          <span className="font-bold px-2">{workload}</span>
                          <span>mAmin in one hr</span>
                        </div>

                        <div className="flex w-full divide-x-2 divide-black">
                          <div className="p-4 flex items-center justify-center w-48 font-bold border-r border-black bg-gray-50 print:bg-transparent">
                            Max<br />Leakage =
                          </div>
                          <div className="flex-grow flex items-center justify-center p-2 relative">
                            <div className="flex flex-col items-center justify-center w-full">
                              <div className="w-full text-center border-b-2 border-black pb-1 mb-1 font-medium">
                                {workload} mAmin in 1 hr X {maxExposure}
                                <span className="ml-4 text-xs font-normal print:hidden">(max Exposure Level mR/hr)</span>
                              </div>
                              <div className="w-full text-center pt-1 font-medium">
                                60 X {maUsed}
                                <span className="ml-4 text-xs font-normal print:hidden">(mA used for measurement)</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 flex items-center justify-center w-64 border-l border-black font-bold text-lg bg-gray-50 print:bg-transparent">
                            {maxResultMR} mR in one hour
                          </div>
                        </div>
                      </div>

                      {/* Final Results */}
                      <div className="border-2 border-black text-sm mb-6">
                        <div className="flex justify-between items-center p-2 border-b border-black">
                          <span className="font-medium">Maximum Radiation Leakage from Tube Housing</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{tubeResultMGy}</span>
                            <span>mGy in one hour</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-2 border-b border-black">
                          <span className="font-medium">Maximum Radiation Leakage from Tube Collimator</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{collResultMGy}</span>
                            <span>mGy in one hour</span>
                          </div>
                        </div>
                        <div className="p-2 font-bold bg-gray-50 print:bg-transparent">
                          Tolerance: Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt; 1 mGy (114 mR) in one hour.
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* 11. Radiation Protection Survey */}
            {testData.radiationProtection?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>11. RADIATION PROTECTION SURVEY</h3>

                {/* 1. Date & Calibration Table */}
                <table className="w-full border-2 border-black text-sm mb-6">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="px-2 py-1 border-r border-black font-medium w-3/4">Date of Radiation Protection Survey</td>
                      <td className="px-2 py-1 text-center font-bold">{formatDate(testData.radiationProtection.surveyDate) || "-"}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 border-r border-black font-medium">Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate:</td>
                      <td className="px-2 py-1 text-center font-bold">{testData.radiationProtection.hasValidCalibration || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. Equipment Setting */}
                <div className="mb-6">
                  <h4 className="font-bold underline mb-2">Equipment Setting:-</h4>
                  <table className="w-full border-2 border-black text-sm">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="px-2 py-1 border-r border-black font-medium w-3/4">Applied Current (mA)</td>
                        <td className="px-2 py-1 text-center">{testData.radiationProtection.appliedCurrent || "-"}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-2 py-1 border-r border-black font-medium">Applied Voltage (kV)</td>
                        <td className="px-2 py-1 text-center">{testData.radiationProtection.appliedVoltage || "-"}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-2 py-1 border-r border-black font-medium">Exposure Time(s):</td>
                        <td className="px-2 py-1 text-center">{testData.radiationProtection.exposureTime || "-"}</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 border-r border-black font-medium">Workload (mA min/week)</td>
                        <td className="px-2 py-1 text-center">{testData.radiationProtection.workload || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Measurement Table */}
                <div className="mb-0">
                  <p className="mb-1 font-medium">Provide the measured Maximum Radiation Levels (mR/hr) at different Locations</p>
                  <table className="w-full border-2 border-black text-sm">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="px-2 py-2 border-r border-black text-center w-1/3">Location</th>
                        <th className="px-2 py-2 border-r border-black text-center w-1/4">Max. Radiation Level</th>
                        <th className="px-2 py-2 border-r border-black text-center w-1/4">Result</th>
                        <th className="px-2 py-2 text-center w-1/6">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {testData.radiationProtection.locations.map((loc: any, i: number) => {
                        const isPass = loc.result === "PASS" || loc.result === "Pass";
                        return (
                          <tr key={i} className="divide-x divide-black border-b border-black">
                            <td className="px-2 py-1 text-left">{loc.location || "-"}</td>
                            <td className="px-2 py-1 text-center">{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td className="px-2 py-1 text-center font-bold">{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td className="px-2 py-1 text-center font-bold">{isPass ? "Pass" : "Fail"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. Formula Block */}
                <div className="border-2 border-t-0 border-black p-4 text-center font-medium text-sm">
                  <p className="mb-1">Maximum Radiation level/week (mR/wk) = <span className="underline">Work Load X Max. Radiation Level (mR/hr)</span></p>
                  <p>60 X mA used for measurement</p>
                </div>

                {/* 5. Summary Rows */}
                {(() => {
                  const workerLocs = testData.radiationProtection.locations.filter((l: any) => l.category === 'worker');
                  const publicLocs = testData.radiationProtection.locations.filter((l: any) => l.category === 'public');

                  const maxWorker = workerLocs.reduce((max: number, curr: any) => Math.max(max, parseFloat(curr.mRPerWeek) || 0), 0);
                  const maxPublic = publicLocs.reduce((max: number, curr: any) => Math.max(max, parseFloat(curr.mRPerWeek) || 0), 0);

                  const workerStatus = maxWorker <= 40 ? "Pass" : "Fail";
                  const publicStatus = maxPublic <= 2 ? "Pass" : "Fail";

                  return (
                    <table className="w-full border-2 border-t-0 border-black text-sm mb-6">
                      <tbody className="divide-y divide-black">
                        <tr className="divide-x divide-black font-bold">
                          <td className="px-2 py-2 w-1/2">Maximum Radiation Level/week (mR/wk)</td>
                          <td className="px-2 py-2 w-1/4 text-center"></td>
                          <td className="px-2 py-2 text-right w-1/8">{maxWorker > 0 ? `${maxWorker.toFixed(3)} mR/week` : "-"}</td>
                          <td className="px-2 py-2 text-center w-1/8">{maxWorker > 0 ? workerStatus : "-"}</td>
                        </tr>
                        <tr className="divide-x divide-black font-bold">
                          <td className="px-2 py-2">Maximum Radiation Level/week (mR/wk) For Public</td>
                          <td className="px-2 py-2 text-center"></td>
                          <td className="px-2 py-2 text-right">{maxPublic > 0 ? `${maxPublic.toFixed(3)} mR/week` : "-"}</td>
                          <td className="px-2 py-2 text-center">{maxPublic > 0 ? publicStatus : "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })()}

                {/* 6. Permissible Limit */}
                <div className="border-2 border-black p-2 text-sm font-medium">
                  <p className="underline mb-2">Permissible Limit :</p>
                  <p>For location of Radiation Worker: 20 mSv in a year (40 mR/week)</p>
                  <p>For Location of Member of Public: 1 mSv in a year (2mR/week)</p>
                </div>
              </div>
            )}

            {/* 12. High Contrast Sensitivity */}
            {testData.highContrastSensitivity && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>12. HIGH CONTRAST SENSITIVITY</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(243, 244, 246, 0.5)' }}>Bar strips resolved on the monitor (lp/mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.highContrastSensitivity.measuredLpPerMm || "-"}</td>
                      </tr>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(243, 244, 246, 0.5)' }}>Recommended performance standard (lp/mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.highContrastSensitivity.recommendedStandard || "-"}</td>
                      </tr>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(243, 244, 246, 0.5)' }}>Result</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          <span className={
                            parseFloat(testData.highContrastSensitivity.measuredLpPerMm || "0") >
                              parseFloat(testData.highContrastSensitivity.recommendedStandard || "0")
                              ? "text-green-600 font-bold" : "text-red-600 font-bold"
                          }>
                            {testData.highContrastSensitivity.remarks || (
                              parseFloat(testData.highContrastSensitivity.measuredLpPerMm || "0") >
                                parseFloat(testData.highContrastSensitivity.recommendedStandard || "0")
                                ? "PASS" : "FAIL"
                            )}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 13. Low Contrast Sensitivity */}
            {testData.lowContrastSensitivity && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>13. LOW CONTRAST SENSITIVITY</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(243, 244, 246, 0.5)' }}>Diameter of smallest hole clearly resolved (mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.lowContrastSensitivity.smallestHoleSize || "-"}</td>
                      </tr>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(243, 244, 246, 0.5)' }}>Recommended performance standard (mm)</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.lowContrastSensitivity.recommendedStandard || "-"}</td>
                      </tr>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(243, 244, 246, 0.5)' }}>Result</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          <span className={
                            parseFloat(testData.lowContrastSensitivity.smallestHoleSize || "999") <
                              parseFloat(testData.lowContrastSensitivity.recommendedStandard || "0")
                              ? "text-green-600 font-bold" : "text-red-600 font-bold"
                          }>
                            {testData.lowContrastSensitivity.remarks || (
                              parseFloat(testData.lowContrastSensitivity.smallestHoleSize || "999") <
                                parseFloat(testData.lowContrastSensitivity.recommendedStandard || "0")
                                ? "PASS" : "FAIL"
                            )}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32 print:mt-8 print:text-sm">
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

export default ViewServiceReportOBI;
