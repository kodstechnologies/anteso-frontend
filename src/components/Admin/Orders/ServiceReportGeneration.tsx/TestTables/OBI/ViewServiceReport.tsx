// src/components/reports/ViewServiceReportOBI.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForOBI, getDetails } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
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
  reportULRNumber?: string;
  testReportNumber?: string;
  issueDate?: any;
  nomenclature?: string;
  make?: string;
  model?: string;
  slNumber?: string;
  condition?: string;
  testingProcedureNumber?: string;
  engineerNameRPId?: string;
  rpId?: string;
  testDate?: any;
  testDueDate?: string;
  location?: string;
  temperature?: string;
  humidity?: string;
  pages?: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  category:any;
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

/** Matches LinearityOfTime.tsx â€” DB rows often omit summary fields; derive them for the PDF view. */
function computeOBILinearityOfMaLoadingSummaryFromRows(lotData: any) {
  const testConditions = lotData.testConditions || {};
  const time = parseFloat(testConditions.time) || 0;
  const tol = parseFloat(lotData.tolerance) || 0.1;
  const op = lotData.toleranceOperator || "<=";
  const rows = lotData.measurementRows || [];
  const mGyPerMAsValues: number[] = [];

  for (const row of rows) {
    let mGyPerMAsStr = row.mGyPerMAs != null ? String(row.mGyPerMAs).trim() : "";
    if (!mGyPerMAsStr) {
      const outputs = Array.isArray(row.radiationOutputs)
        ? row.radiationOutputs
            .map((v: any) => parseFloat(String(v)))
            .filter((n: number) => !isNaN(n) && n > 0)
        : [row.radiationOutput1, row.radiationOutput2, row.radiationOutput3]
            .map((v: any) => parseFloat(String(v)))
            .filter((n: number) => !isNaN(n) && n > 0);
      const averageOutput =
        outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : 0;
      const maApplied = parseFloat(String(row.maApplied));
      if (averageOutput > 0 && !isNaN(maApplied) && maApplied > 0 && time > 0) {
        mGyPerMAsStr = (averageOutput / (maApplied * time)).toFixed(4);
      }
    }
    const val = parseFloat(mGyPerMAsStr);
    if (!isNaN(val) && mGyPerMAsStr !== "") {
      mGyPerMAsValues.push(val);
    }
  }

  const xMax = mGyPerMAsValues.length > 0 ? Math.max(...mGyPerMAsValues).toFixed(4) : "";
  const xMin = mGyPerMAsValues.length > 0 ? Math.min(...mGyPerMAsValues).toFixed(4) : "";
  const colNum =
    xMax && xMin && parseFloat(xMax) + parseFloat(xMin) > 0
      ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
      : null;
  const coefficientOfLinearity =
    colNum !== null && colNum >= 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : "â€”";

  let remarks = "â€”";
  if (coefficientOfLinearity !== "â€”" && colNum !== null) {
    const colVal = parseFloat(coefficientOfLinearity);
    let pass = false;
    switch (op) {
      case "<":
        pass = colVal < tol;
        break;
      case ">":
        pass = colVal > tol;
        break;
      case "<=":
        pass = colVal <= tol;
        break;
      case ">=":
        pass = colVal >= tol;
        break;
      case "=":
        pass = Math.abs(colVal - tol) < 0.0001;
        break;
      default:
        pass = colVal <= tol;
    }
    remarks = pass ? "Pass" : "Fail";
  }

  return {
    xMax: xMax || "â€”",
    xMin: xMin || "â€”",
    coefficientOfLinearity,
    remarks,
  };
}

function hasOBILinearitySummaryValue(v: any): boolean {
  if (v == null) return false;
  const s = String(v).trim();
  return s !== "" && s !== "â€”";
}

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
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "On-Board Imaging (OBI)",
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
            category: data.category ,
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
                toleranceSign: opData.tolerance?.sign || "Â±",
                toleranceValue: opData.tolerance?.value || "2.0",
              };
            }

            // Fallback for old structure (table2)
            const table2 = Array.isArray(opData.table2) ? opData.table2 : [];
            if (table2.length === 0) return null;
            return {
              ...opData,
              table2,
              toleranceSign: opData.tolerance?.sign || opData.toleranceSign || "Â±",
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
            const base = {
              ...lotData,
              measurementRows,
              measHeaders: lotData.measHeaders,
              testConditions: lotData.testConditions || {},
            };
            const computed = computeOBILinearityOfMaLoadingSummaryFromRows(base);
            return {
              ...base,
              xMax: hasOBILinearitySummaryValue(lotData.xMax) ? lotData.xMax : computed.xMax,
              xMin: hasOBILinearitySummaryValue(lotData.xMin) ? lotData.xMin : computed.xMin,
              coefficientOfLinearity: hasOBILinearitySummaryValue(lotData.coefficientOfLinearity)
                ? lotData.coefficientOfLinearity
                : hasOBILinearitySummaryValue(lotData.col)
                  ? lotData.col
                  : computed.coefficientOfLinearity,
              remarks: hasOBILinearitySummaryValue(lotData.remarks) ? lotData.remarks : computed.remarks,
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

  /** Match RadiographyFixed PDF table styling for Tube Housing Leakage (and reuse elsewhere if needed). */
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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report?.reportULRNumber || ulrNumber}</td>
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
            QA TEST REPORT FOR ON-BOARD IMAGING (OBI)
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: '9px' }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the testing sit</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.customerName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address of the testing site</td>
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
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Engineer Name", report.engineerNameRPId || "-"],
                  ["RP ID", report.rpId || "-"],
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
            <p>2nd Floor, D-290, Sector â€“ 63, Noida, New Delhi â€“ 110085</p>
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

            {/* 6. Congruence of Radiation */}
            {testData.congruenceOfRadiation?.congruenceMeasurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Congruence of Radiation</h3>

                {/* Technique Factors */}
                {testData.congruenceOfRadiation.techniqueFactors && Array.isArray(testData.congruenceOfRadiation.techniqueFactors) && testData.congruenceOfRadiation.techniqueFactors.length > 0 && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Technique Factors:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                            <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.congruenceOfRadiation.techniqueFactors.map((tf: any, idx: number) => (
                            <tr key={idx}>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf.fcd || "-"}</td>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf.kv || "-"}</td>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{tf.mas || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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

            {/* 5. Central Beam Alignment */}
            {testData.centralBeamAlignment && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Central Beam Alignment</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Technique factors:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FFD (cm)</td>
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
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.centralBeamAlignment.tolerance?.operator } {testData.centralBeamAlignment.tolerance?.value || "-"}°</td>
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

            {/* 7. Effective Focal Spot */}
            {testData.effectiveFocalSpot?.focalSpots?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Effective Focal Spot</h3>
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
                        <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.effectiveFocalSpot.fcd || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}></th>
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
                            const numVal = typeof val === "number" ? val : parseFloat(val);
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
                                <span className={spot.remark === "Pass" || spot.remark === "PASS" ? "text-green-600" : spot.remark === "Fail" || spot.remark === "FAIL" ? "text-red-600" : ""}>
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

            {/* 3. Timer Test */}
            {testData.timerTest?.irradiationTimes?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Accuracy of Irradiation Time</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Operating parameters:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FDD (cm)</td>
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
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (sec)</th>
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
            {/* 2. Accuracy of Operating Potential */}
            {(testData.operatingPotential?.rows?.length > 0 || testData.operatingPotential?.table2?.length > 0) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Accuracy of Operating Potential (KVP)</h3>

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
                        <strong>Tolerance:</strong> {testData.operatingPotential.toleranceSign } {testData.operatingPotential.toleranceValue || "2.0"}kVp
                      </p>
                    </div>

                    {/* Total Filtration Display */}
                    {testData.operatingPotential.totalFiltration && (testData.operatingPotential.totalFiltration.measured || testData.operatingPotential.totalFiltration.required) && (() => {
                      const tf = testData.operatingPotential.totalFiltration;
                      const ft = testData.operatingPotential.filtrationTolerance || {};
                      // UI stores the measured HVL in 'required' field (same pattern as BMD)
                      const measuredVal = tf.required ?? tf.measured ?? "";
                      const measuredNum = parseFloat(measuredVal);
                      const kvpNum = parseFloat(tf.atKvp ?? "");
                      const k1 = parseFloat(ft.kvThreshold1 ?? "70");
                      const k2 = parseFloat(ft.kvThreshold2 ?? "100");
                      let requiredTol = NaN;
                      if (!isNaN(kvpNum)) {
                        if (kvpNum < k1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                        else if (kvpNum <= k2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                        else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                      }
                      // Fallback: use a fixed required value if no kVp-based threshold available
                      if (isNaN(requiredTol)) requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                      const filtrationRemark = (!isNaN(measuredNum) && !isNaN(requiredTol))
                        ? (measuredNum >= requiredTol ? "PASS" : "FAIL")
                        : "-";
                      return (
                        <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                          <h4 className="font-semibold mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>6. Total Filtration</h4>
                          <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <tbody>
                              {tf.atKvp && (
                                <tr>
                                  <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>At kVp</td>
                                  <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.atKvp} kVp</td>
                                </tr>
                              )}
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                                <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{measuredVal || "-"} mm Al</td>
                              </tr>
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
                                <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                  {!isNaN(requiredTol) ? `â‰¥ ${requiredTol} mm Al` : "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
                                <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                  <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>{filtrationRemark}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {Object.keys(ft).length > 0 && (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                              <span className="font-semibold">Tolerance criteria: </span>
                              {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} |&nbsp;
                              {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} â‰¤ kV â‰¤ {ft.kvThreshold2 ?? "100"} |&nbsp;
                              {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                        <strong>Tolerance:</strong> {testData.operatingPotential.toleranceSign } {testData.operatingPotential.toleranceValue || "2.0"}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}



            {/* 4. Output Consistency */}
            {testData.outputConsistency?.outputRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Output Consistency</h3>
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <span className="text-sm print:text-[9px] font-bold block mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Operating parameters:</span>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center font-bold w-1/4" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FDD (cm)</td>
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


            {/* 13. Low Contrast Sensitivity */}
            {testData.lowContrastSensitivity && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. Low Contrast Resolution</h3>
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
            {/* 12. High Contrast Sensitivity */}
            {testData.highContrastSensitivity && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. High Contrast Resolution</h3>
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

   {/* 9. Linearity of Time */}
   {testData.linearityOfTime?.measurementRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. Linearity of mA loading</h3>
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
                <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                  {(() => {
                    const lot = testData.linearityOfTime;
                    const rows = lot.measurementRows;
                    const numMeas = Math.max(
                      lot.measHeaders?.length ?? 0,
                      Array.isArray(rows[0]?.radiationOutputs) ? rows[0].radiationOutputs.length : 0,
                      3
                    );
                    const displayHeaders: string[] = lot.measHeaders?.length
                      ? [...lot.measHeaders]
                      : [];
                    while (displayHeaders.length < numMeas) {
                      displayHeaders.push(String(displayHeaders.length + 1));
                    }
                    const hdrs = displayHeaders.slice(0, numMeas);

                    const formatCell = (val: any) => {
                      if (val === undefined || val === null) return "-";
                      const str = String(val).trim();
                      return str === "" || str === "â€”" || str === "undefined" || str === "null" ? "-" : str;
                    };

                    const getOutputs = (row: any): string[] => {
                      let out: string[] = [];
                      if (Array.isArray(row.radiationOutputs)) {
                        out = [...row.radiationOutputs];
                      } else {
                        out = [row.radiationOutput1, row.radiationOutput2, row.radiationOutput3].map((v: any) =>
                          v !== undefined && v !== null ? String(v) : ""
                        );
                      }
                      while (out.length < numMeas) out.push("");
                      return out.slice(0, numMeas);
                    };

                    const xMax = formatCell(lot.xMax);
                    const xMin = formatCell(lot.xMin);
                    const colVal = hasOBILinearitySummaryValue(lot.coefficientOfLinearity)
                      ? String(lot.coefficientOfLinearity).trim()
                      : hasOBILinearitySummaryValue(lot.col)
                        ? String(lot.col).trim()
                        : formatCell(lot.coefficientOfLinearity ?? lot.col);
                    const remarks = formatCell(lot.remarks);

                    return (
                      <table
                        className="w-full border-2 border-black compact-table force-small-text"
                        style={{ fontSize: "10px", tableLayout: "fixed", width: "100%", borderCollapse: "collapse", borderSpacing: "0" }}
                      >
                        <thead className="bg-gray-100">
                          <tr>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              mA Applied
                            </th>
                            <th
                              colSpan={numMeas}
                              className="border border-black p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              Radiation Output (mGy)
                            </th>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              Avg Output
                            </th>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              mGy / mAs (X)
                            </th>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              X MAX
                            </th>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              X MIN
                            </th>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              CoL
                            </th>
                            <th
                              className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            >
                              Remarks
                            </th>
                          </tr>
                          <tr>
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                            {hdrs.map((header: string, idx: number) => (
                              <th
                                key={idx}
                                className="border border-black p-1.5 print:p-[3px] text-center"
                                style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                              >
                                {header || `Meas ${idx + 1}`}
                              </th>
                            ))}
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                            <th
                              className="border border-black border-t-0 p-1.5 print:p-[3px] text-center"
                              style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                            />
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: "10px" }}>
                              <td
                                className="border border-black p-1.5 print:p-[3px] text-center"
                                style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                              >
                                {formatCell(row.maApplied)}
                              </td>
                              {getOutputs(row).map((val: string, idx: number) => (
                                <td
                                  key={idx}
                                  className="border border-black p-1.5 print:p-[3px] text-center"
                                  style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                                >
                                  {formatCell(val)}
                                </td>
                              ))}
                              <td
                                className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                                style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                              >
                                {formatCell(row.averageOutput)}
                              </td>
                              <td
                                className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                                style={{ fontSize: "10px", padding: "5px", borderColor: "#000000", textAlign: "center" }}
                              >
                                {formatCell(row.mGyPerMAs)}
                              </td>
                              {i === 0 ? (
                                <>
                                  <td
                                    rowSpan={rows.length}
                                    className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                                    style={{
                                      fontSize: "10px",
                                      padding: "5px",
                                      verticalAlign: "middle",
                                      borderColor: "#000000",
                                      textAlign: "center",
                                    }}
                                  >
                                    {xMax}
                                  </td>
                                  <td
                                    rowSpan={rows.length}
                                    className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                                    style={{
                                      fontSize: "10px",
                                      padding: "5px",
                                      verticalAlign: "middle",
                                      borderColor: "#000000",
                                      textAlign: "center",
                                    }}
                                  >
                                    {xMin}
                                  </td>
                                  <td
                                    rowSpan={rows.length}
                                    className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                                    style={{
                                      fontSize: "10px",
                                      padding: "5px",
                                      verticalAlign: "middle",
                                      borderColor: "#000000",
                                      textAlign: "center",
                                    }}
                                  >
                                    {colVal}
                                  </td>
                                  <td
                                    rowSpan={rows.length}
                                    className="border border-black p-1.5 print:p-[3px] text-center"
                                    style={{
                                      fontSize: "10px",
                                      padding: "5px",
                                      verticalAlign: "middle",
                                      borderColor: "#000000",
                                      textAlign: "center",
                                    }}
                                  >
                                    <span
                                      className={
                                        remarks === "Pass"
                                          ? "text-green-600 font-semibold"
                                          : remarks === "Fail"
                                            ? "text-red-600 font-semibold"
                                            : ""
                                      }
                                      style={{ fontSize: "10px" }}
                                    >
                                      {remarks}
                                    </span>
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
                {/* Tolerance */}
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: "2px 4px", marginTop: "4px" }}>
                  <p className="text-sm print:text-[10px]" style={{ fontSize: "10px", margin: "2px 0" }}>
                    <strong>Tolerance (CoL):</strong>{" "}
                    {testData.linearityOfTime.toleranceOperator === "<="
                      ? "â‰¤"
                      : testData.linearityOfTime.toleranceOperator === ">="
                        ? "â‰¥"
                        : testData.linearityOfTime.toleranceOperator || "â‰¤"}{" "}
                    {testData.linearityOfTime.tolerance || "0.1"}
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
                    <strong>Tolerance:</strong> Coefficient of Linearity {testData.linearityOfMasLoading.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )}

            {/* 11. Tube Housing Leakage — structure aligned with RadiographyFixed (radiationLeakageLevel); OBI uses tubeHousingLeakage */}
            {(() => {
              const leakageData = testData.radiationLeakageLevel || testData.tubeHousingLeakage;
              if (!leakageData || (!leakageData.leakageMeasurements?.length && !leakageData.fcd)) return null;
              return (
                <div className="mb-4 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                  <h3 className="font-bold mb-2" style={{ fontSize: "12px" }}>
                    11. Tube Housing Leakage
                  </h3>
                  <div style={{ marginBottom: "4px" }}>
                    <table style={{ ...tableStyle, width: "100%" }}>
                      <thead>
                        <tr>
                          {["FDD (cm)", "kV", "mA", "Time (Sec)"].map((h) => (
                            <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", padding: "1px 8px" })}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                            {leakageData.fcd || leakageData.settings?.fcd || "100"}
                          </td>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                            {leakageData.kv || leakageData.settings?.kv || "-"}
                          </td>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                            {leakageData.ma || leakageData.settings?.ma || "-"}
                          </td>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                            {leakageData.time || leakageData.settings?.time || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: "10px", marginBottom: "4px" }}>
                    <strong>Workload:</strong> {leakageData.workload || "-"}{" "}
                    {leakageData.workloadUnit || "mA·min/week"}
                  </p>
                  {leakageData.leakageMeasurements?.length > 0 && (
                    <table style={{ ...tableStyle, fontSize: "10px" }}>
                      <thead>
                        <tr>
                          <th
                            rowSpan={2}
                            style={cellStyle({
                              fontWeight: 700,
                              border: "0.1px solid #666",
                              fontSize: "10px",
                              width: "15%",
                              verticalAlign: "middle",
                            })}
                          >
                            Location
                          </th>
                          <th colSpan={5} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                            Exposure Level (mR/hr)
                          </th>
                          <th
                            rowSpan={2}
                            style={cellStyle({
                              fontWeight: 700,
                              border: "0.1px solid #666",
                              fontSize: "10px",
                              verticalAlign: "middle",
                            })}
                          >
                            Result (mR in 1 hr)
                          </th>
                          <th
                            rowSpan={2}
                            style={cellStyle({
                              fontWeight: 700,
                              border: "0.1px solid #666",
                              fontSize: "10px",
                              verticalAlign: "middle",
                            })}
                          >
                            Result (mGy in 1 hr)
                          </th>
                          <th
                            rowSpan={2}
                            style={cellStyle({
                              fontWeight: 700,
                              border: "0.1px solid #666",
                              fontSize: "10px",
                              verticalAlign: "middle",
                            })}
                          >
                            Remarks
                          </th>
                        </tr>
                        <tr>
                          {["Left", "Right", "Front", "Back", "Top"].map((h) => (
                            <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leakageData.leakageMeasurements.map((row: any, i: number) => {
                          const maValue = parseFloat(leakageData.ma || leakageData.settings?.ma || "0");
                          const workloadValue = parseFloat(leakageData.workload || "0");
                          const values = [row.left, row.right, row.front, row.back, row.top]
                            .map((v: any) => parseFloat(v) || 0)
                            .filter((v: number) => v > 0);
                          const rowMax = values.length > 0 ? Math.max(...values) : 0;
                          let calcMR = "-";
                          let calcMGy = "-";
                          let remark = row.remark || "-";
                          if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                            const resMR = (workloadValue * rowMax) / (60 * maValue);
                            calcMR = resMR.toFixed(3);
                            calcMGy = (resMR / 114).toFixed(4);
                            if (remark === "-" || !remark) {
                              remark =
                                resMR / 114 <= (parseFloat(leakageData.toleranceValue) || 1.0) ? "Pass" : "Fail";
                            }
                          }
                          return (
                            <tr key={i}>
                              <th scope="row" style={cellStyle({ border: "0.1px solid #666", fontSize: "10px", fontWeight: 700 })}>
                                {row.location || "-"}
                              </th>
                              {(["left", "right", "front", "back", "top"] as const).map((k) => (
                                <td key={k} style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>
                                  {(row as any)[k] || "-"}
                                </td>
                              ))}
                              <td style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>{calcMR}</td>
                              <td style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>{calcMGy}</td>
                              <td style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>{remark}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {(() => {
                    const maValue = parseFloat(leakageData.ma || leakageData.settings?.ma || "0");
                    const workloadValue = parseFloat(leakageData.workload || "0");
                    const findRow = (...names: string[]) =>
                      leakageData.leakageMeasurements?.find((m: any) =>
                        names.some((n) => m.location === n || String(m.location || "").toLowerCase() === n.toLowerCase())
                      );
                    const getSummary = (row: any) => {
                      if (!row) return null;
                      const values = [row.left, row.right, row.front, row.back, row.top]
                        .map((v: any) => parseFloat(v) || 0)
                        .filter((v: number) => v > 0);
                      const rowMax = values.length > 0 ? Math.max(...values) : 0;
                      if (!(rowMax > 0 && maValue > 0 && workloadValue > 0)) return null;
                      const resMR = (workloadValue * rowMax) / (60 * maValue);
                      return { rowMax, resMR, resMGy: resMR / 114 };
                    };
                    const tubeSummary = getSummary(findRow("Tube Housing", "Tube"));
                    const collimatorSummary = getSummary(findRow("Collimator"));
                    return (
                      <div style={{ marginTop: "6px" }}>
                        <div
                          style={{
                            border: "1px solid #888",
                            padding: "4px 8px",
                            marginBottom: "4px",
                            background: "#fafafa",
                          }}
                        >
                          <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>Calculation Formula:</p>
                          <p
                            style={{
                              fontSize: "10px",
                              textAlign: "center",
                              fontFamily: "monospace",
                              border: "1px dashed #999",
                              padding: "2px",
                            }}
                          >
                            Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                          </p>
                          <p style={{ fontSize: "9px", marginTop: "2px", color: "#555", fontStyle: "italic" }}>
                            Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {tubeSummary && (
                            <div style={{ flex: 1, border: "0.1px solid #666", padding: "4px", fontSize: "10px" }}>
                              <p style={{ fontWeight: "bold", marginBottom: "2px" }}>Tube Housing Summary:</p>
                              <p>
                                Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong>
                              </p>
                              <p>
                                Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) ={" "}
                                <strong>{tubeSummary.resMR.toFixed(3)} mR</strong>
                              </p>
                              <p>
                                In mGy: {tubeSummary.resMR.toFixed(3)} / 114 ={" "}
                                <strong>{tubeSummary.resMGy.toFixed(4)} mGy</strong>
                              </p>
                            </div>
                          )}
                          {collimatorSummary && (
                            <div style={{ flex: 1, border: "0.1px solid #666", padding: "4px", fontSize: "10px" }}>
                              <p style={{ fontWeight: "bold", marginBottom: "2px" }}>Collimator Summary:</p>
                              <p>
                                Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong>
                              </p>
                              <p>
                                Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) ={" "}
                                <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong>
                              </p>
                              <p>
                                In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 ={" "}
                                <strong>{collimatorSummary.resMGy.toFixed(4)} mGy</strong>
                              </p>
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: "10px", marginTop: "4px", border: "0.1px solid #666", padding: "2px 6px" }}>
                          <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt;{" "}
                          <strong>
                            {leakageData.toleranceValue || "1"} mGy (
                            {parseFloat(leakageData.toleranceValue || "1") * 114} mR) in one hour.
                          </strong>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}


            {/* 11. Radiation Protection Survey */}
            {testData.radiationProtection?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>12. Details of Radiation Protection Survey</h3>

                {/* 1. Survey Details */}
                {(testData.radiationProtection.surveyDate || testData.radiationProtection.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtection.surveyDate ? formatDate(testData.radiationProtection.surveyDate) : "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtection.hasValidCalibration || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Equipment Setting */}
                {(testData.radiationProtection.appliedCurrent || testData.radiationProtection.appliedVoltage || testData.radiationProtection.exposureTime || testData.radiationProtection.workload) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>2. Equipment Setting</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Current (mA)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtection.appliedCurrent || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Voltage (kV)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtection.appliedVoltage || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Exposure Time(s)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtection.exposureTime || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Workload (mA min/week)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtection.workload || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Measured Maximum Radiation Levels */}
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
                        {testData.radiationProtection.locations.map((loc: any, i: number) => (
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

                {/* 4. Calculation Formula */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>4. Calculation Formula</h4>
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

                {/* 5. Summary */}
                {(() => {
                  const workerLocs = testData.radiationProtection.locations.filter((l: any) => l.category === 'worker');
                  const publicLocs = testData.radiationProtection.locations.filter((l: any) => l.category === 'public');
                  const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => (parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max.mRPerWeek) || 0) ? loc : max, workerLocs[0] || { mRPerHr: '', location: '' });
                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => (parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max.mRPerWeek) || 0) ? loc : max, publicLocs[0] || { mRPerHr: '', location: '' });
                  const maxWorkerWeekly = workerLocs.length > 0 ? Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0)).toFixed(3) : "0.000";
                  const maxPublicWeekly = publicLocs.length > 0 ? Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0)).toFixed(3) : "0.000";
                  const workerResult = parseFloat(maxWorkerWeekly) > 0 && parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : parseFloat(maxWorkerWeekly) > 40 ? "Fail" : "";
                  const publicResult = parseFloat(maxPublicWeekly) > 0 && parseFloat(maxPublicWeekly) <= 2 ? "Pass" : parseFloat(maxPublicWeekly) > 2 ? "Fail" : "";
                  return (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
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
                      <div className="mt-2 print:mt-1 space-y-2 print:space-y-1">
                        {maxWorkerLocation.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-3 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-1" style={{ fontSize: '11px', margin: '2px 0' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxWorkerLocation.location}</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Formula:</strong> ({testData.radiationProtection.workload || 'â€”'} mAmin/week Ã— {maxWorkerLocation.mRPerHr || 'â€”'} mR/hr) / (60 Ã— {testData.radiationProtection.appliedCurrent || 'â€”'} mA)</p>
                            <p className="text-xs print:text-[8px] mt-1" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxWorkerWeekly} mR/week</p>
                          </div>
                        )}
                        {maxPublicLocation.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-3 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-1" style={{ fontSize: '11px', margin: '2px 0' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxPublicLocation.location}</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Formula:</strong> ({testData.radiationProtection.workload || 'â€”'} mAmin/week Ã— {maxPublicLocation.mRPerHr || 'â€”'} mR/hr) / (60 Ã— {testData.radiationProtection.appliedCurrent || 'â€”'} mA)</p>
                            <p className="text-xs print:text-[8px] mt-1" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxPublicWeekly} mR/week</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Permissible Limit */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>6. Permissible Limit</h4>
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
            )}

     {/* 1. Alignment Test */}
     {testData.alignmentTest?.testRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>13. Alignment Test</h3>
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

