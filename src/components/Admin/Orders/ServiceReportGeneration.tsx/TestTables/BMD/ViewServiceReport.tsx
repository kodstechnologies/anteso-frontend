// src/components/reports/ViewServiceReportBMD.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForBMD, saveReportHeaderForBMD, getReportNumbers, getAccuracyOfIrradiationTimeByServiceIdForBMD, getDetails, getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF, estimateReportPages } from "../../../../../../utils/generatePDF";
import MainTestTableForBMD from "./MainTestTableForBMD";
// Removed individual test API imports as we are now using aggregated header


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
  category?: string;
  condition?: string;
  testingProcedureNumber?: string;
  engineerNameRPId?: string;
  rpId?: string;
  testDate?: any;
  testDueDate?: string;
  location?: string;
  temperature?: string;
  humidity?: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  pages?: string;
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

const ViewServiceReportBMD: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [ulrNumber, setUlrNumber] = useState<string>("N/A");
  const [pageCount, setPageCount] = useState<string>("Calculating...");

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch report header and all test data in one call
        const response = await getReportHeaderForBMD(serviceId);

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
            nomenclature: data.nomenclature || "BMD/DEXA",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            category: data.category || "-",
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
            pages: data.pages ?? "",
          });

          // Set test data directly from the aggregated response
          // Assuming the backend follows the convention of embedding test/model names keys

          // Transform Tube Housing Leakage data
          let transformedTubeHousingLeakage = null;
          if (data.tubeHousingLeakage) {
            const rawLeakage = data.tubeHousingLeakage;

            // Get measurement settings
            const distance = rawLeakage.measurementSettings?.distance || "";
            const kvp = rawLeakage.measurementSettings?.kv || "";
            const ma = rawLeakage.measurementSettings?.ma || "";
            const time = rawLeakage.measurementSettings?.time || "";
            const workloadValue = parseFloat(rawLeakage.workload?.value || "0");
            const maValue = parseFloat(ma || "0");

            // Map leakageMeasurements to leakageRows with calculations
            const leakageRows = rawLeakage.leakageMeasurements?.map((m: any) => {
              const left = parseFloat(m.left || "0");
              const right = parseFloat(m.right || "0");
              const foot = parseFloat(m.front || m.top || "0"); // Map front/top to foot
              const head = parseFloat(m.back || m.up || "0");   // Map back/up to head

              // Calculate max from all directions
              const values = [left, right, foot, head].filter(v => v > 0);
              const max = values.length > 0 ? Math.max(...values).toFixed(3) : "0";

              // Calculate result (mR in one hour): (workload Ã— max) / (60 Ã— mA)
              let result = "-";
              if (workloadValue > 0 && parseFloat(max) > 0 && maValue > 0) {
                const calculatedMR = (workloadValue * parseFloat(max)) / (60 * maValue);
                result = calculatedMR.toFixed(3);
              }

              // Calculate mGy: result / 114
              const mgy = result !== "-" ? (parseFloat(result) / 114).toFixed(4) : "-";

              // Determine remark based on tolerance
              let remark = "-";
              const toleranceValue = parseFloat(rawLeakage.tolerance?.value || "1");
              const toleranceOp = rawLeakage.tolerance?.operator || "less than or equal to";
              if (mgy !== "-" && toleranceValue > 0) {
                const mgyValue = parseFloat(mgy);
                let pass = false;
                if (toleranceOp === "less than or equal to") pass = mgyValue <= toleranceValue;
                else if (toleranceOp === "greater than or equal to") pass = mgyValue >= toleranceValue;
                else if (toleranceOp === "=") pass = Math.abs(mgyValue - toleranceValue) < 0.01;
                remark = pass ? "Pass" : "Fail";
              }

              return {
                location: m.location || "Tube",
                left: left > 0 ? left.toFixed(3) : "-",
                right: right > 0 ? right.toFixed(3) : "-",
                foot: foot > 0 ? foot.toFixed(3) : "-",
                head: head > 0 ? head.toFixed(3) : "-",
                max: max,
                result: result, // mR in one hour
                mgy: mgy,      // mGy in one hour
                remark: remark,
                unit: m.unit || "mR/h",
              };
            }) || [];

            // Get global maximum mGy for the summary
            const allMGy = leakageRows.map((r: any) => parseFloat(r.mgy || "0")).filter((v: number) => v > 0);
            const maxMGy = allMGy.length > 0 ? Math.max(...allMGy).toFixed(4) : "-";

            transformedTubeHousingLeakage = {
              ...rawLeakage,
              leakageRows,
              distance: distance,
              kvp: kvp,
              ma: ma,
              time: time,
              workload: rawLeakage.workload?.value || "-",
              maxMGy: maxMGy, // Maximum radiation leakage in mGy
              toleranceValue: rawLeakage.tolerance?.value || "1",
              toleranceOperator: rawLeakage.tolerance?.operator || "less than or equal to",
              toleranceTime: rawLeakage.tolerance?.time || "1",
            };
          }

          // Transform Linearity of mA Loading data
          let transformedLinearityOfMaLoading = null;
          if (data.linearityOfMaLoading) {
            const rawLin = data.linearityOfMaLoading;
            transformedLinearityOfMaLoading = {
              ...rawLin,
              rows: rawLin.table2?.map((r: any) => ({
                ma: r.ma || "-",
                measuredOutputs: r.measuredOutputs || [],
                average: r.average || "-",
                x_bar: r.x || "-",
                coefficient: r.col || "-",
                remark: r.remarks || "-",
              })) || [],
            };
          }

          // Transform Reproducibility data
          let transformedReproducibility = null;
          if (data.reproducibilityOfRadiationOutput && data.reproducibilityOfRadiationOutput.outputRows?.length > 0) {
            const rawRepro = data.reproducibilityOfRadiationOutput;
            const row = rawRepro.outputRows[0];
            const measurements = row.outputs?.map((o: any) => parseFloat(o.value) || 0) || [];

            // Calculate stats
            const n = measurements.length;
            const sum = measurements.reduce((a: number, b: number) => a + b, 0);
            const mean = n > 0 ? sum / n : 0;

            let variance = 0;
            if (n > 1) {
              const sumDiffSq = measurements.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0);
              variance = sumDiffSq / (n - 1);
            }
            const stdDev = Math.sqrt(variance);
            const cov = mean > 0 ? (stdDev / mean) : 0;

            transformedReproducibility = {
              ...rawRepro,
              kv: row.kv || "-",
              ma: row.mas || "-",
              time: "",
              measurements: row.outputs?.map((o: any) => ({ measured: o.value })) || [],
              mean: mean.toFixed(4),
              cov: cov.toFixed(4),
              result: row.remark || "-",
            };
          }

          // Fetch accuracyOfIrradiationTime separately
          let accuracyOfIrradiationTime = null;
          let accuracyOfIrradiationTimeFull = null; // Store full data for detailed view
          try {
            const irrTimeRes = await getAccuracyOfIrradiationTimeByServiceIdForBMD(serviceId);
            if (irrTimeRes?.data) {
              const irrData = irrTimeRes.data;
              // Store full data for detailed view
              accuracyOfIrradiationTimeFull = irrData;
              // Transform to match MainTestTableForBMD expected structure
              accuracyOfIrradiationTime = {
                rows: irrData.irradiationTimes?.map((t: any) => ({
                  setTime: t.setTime || "",
                  avgTime: t.measuredTime || "",
                  remark: t.remark || "-",
                })) || [],
                timeToleranceSign: irrData.tolerance?.operator === ">" || irrData.tolerance?.operator === ">=" ? "+" : irrData.tolerance?.operator === "<" || irrData.tolerance?.operator === "<=" ? "-" : "Â±",
                timeToleranceValue: irrData.tolerance?.value || "10",
              };
            }
          } catch (err) {
            console.log("No accuracyOfIrradiationTime data found:", err);
          }

          // Transform accuracyOfOperatingPotential to normalize field names
          let transformedAccuracyOfOperatingPotential = null;
          if (data.accuracyOfOperatingPotential) {
            transformedAccuracyOfOperatingPotential = {
              ...data.accuracyOfOperatingPotential,
              rows: data.accuracyOfOperatingPotential.rows?.map((row: any) => ({
                ...row,
                appliedKvp: row.appliedKvp || row.appliedkVp || "",
                setTime: row.setTime || "",
                avgKvp: row.avgKvp || "",
                avgTime: row.avgTime || "",
                remark: row.remark || "-",
                measuredValues: row.measuredValues || [],
              })) || [],
            };
          }

          // Transform Total Filtration data
          let transformedTotalFiltration = null;
          if (data.totalFiltration) {
            transformedTotalFiltration = data.totalFiltration;

            // For BMD, accuracyOfOperatingPotential is captured via the Total Filtration table's 'measurements'.
            // Map it if accuracyOfOperatingPotential is missing.
            if (!transformedAccuracyOfOperatingPotential && data.totalFiltration.measurements && data.totalFiltration.measurements.length > 0) {
              transformedAccuracyOfOperatingPotential = {
                rows: data.totalFiltration.measurements.map((m: any) => ({
                  appliedKvp: m.appliedKvp,
                  setTime: "",
                  avgKvp: m.averageKvp || "",
                  avgTime: "",
                  remark: m.remarks || "-",
                  measuredValues: m.measuredValues || [],
                })),
                mAStations: data.totalFiltration.mAStations || ["50 mA", "100 mA"],
                kvpToleranceSign: data.totalFiltration.tolerance?.sign || "Â±",
                kvpToleranceValue: data.totalFiltration.tolerance?.value || "2.0",
                timeToleranceSign: "Â±",
                timeToleranceValue: "10"
              };
            }
          }

          setTestData({
            accuracyOfOperatingPotential: transformedAccuracyOfOperatingPotential,
            accuracyOfIrradiationTime: accuracyOfIrradiationTime,
            accuracyOfIrradiationTimeFull: accuracyOfIrradiationTimeFull, // Store full data for detailed view
            reproducibilityOfRadiationOutput: transformedReproducibility,
            linearityOfMaLoading: transformedLinearityOfMaLoading,
            tubeHousingLeakage: transformedTubeHousingLeakage,
            totalFiltration: transformedTotalFiltration,
            radiationProtectionSurvey: data.radiationProtectionSurvey || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load BMD report:", err);
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

      // Calculate immediately and after delays to ensure content is rendered
      calculatePages();
      const timer = setTimeout(calculatePages, 500);
      const timer2 = setTimeout(calculatePages, 1000);
      const timer3 = setTimeout(calculatePages, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [report, testData]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `BMD-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
      const pageCountNum = estimateReportPages("report-content");
      setPageCount(String(pageCountNum));
      const response = await getReportHeaderForBMD(serviceId!);
      if (response?.exists && response?.data && report) {
        const d = response.data as any;
        const payload = {
          ...d,
          pages: String(pageCountNum),
        };
        await saveReportHeaderForBMD(serviceId!, payload);
        setReport((prev) => (prev ? { ...prev, pages: String(pageCountNum) } : null));
      }
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">
        Loading BMD Report...
      </div>
    );
  }

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
              <table className="text-xs print:text-[9px] border border-black compact-table" style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px' }}>
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

          <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div>

          <h1 className="text-center text-2xl font-bold underline mb-4 print:mb-2 print:text-base" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR BMD/DEXA
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
                  ["Make", report.make],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Location", report.location],
                  ["Test Date", formatDate(report.testDate)],
                  ["Engineer Name", report.engineerNameRPId || "-"],
                  ["RP ID", report.rpId || "-"],
                  ["No. of Pages", report.pages ?? "-"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{value || "-"}</td>
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

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForBMD testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-4">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential and Time */}
            {testData.accuracyOfOperatingPotential?.rows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1.Accuracy of Irradiation Time</h3>
                {/* <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>Applied kVp</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (s)</th>

                        {(testData.accuracyOfOperatingPotential.mAStations || ["mA Station 1", "mA Station 2"]).map((station: string, idx: number) => (
                          <th key={idx} colSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{station}</th>
                        ))}

                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg Time</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                      <tr>
                        {(testData.accuracyOfOperatingPotential.mAStations || ["mA Station 1", "mA Station 2"]).map((_: any, idx: number) => (
                          <React.Fragment key={idx}>
                            <th className="border border-black p-1 text-xs print:text-[8px] text-center" style={{ padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                            <th className="border border-black p-1 text-xs print:text-[8px] text-center" style={{ padding: '0px 1px', fontSize: '10px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.accuracyOfOperatingPotential.rows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>{row.appliedKvp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>

                          {(testData.accuracyOfOperatingPotential.mAStations || ["Station 1", "Station 2"]).map((_: any, idx: number) => {
                            // Handle legacy structure where measuredValues might not be array or fallback to maStation1/2
                            let mVal = { kvp: "-", time: "-" };
                            if (Array.isArray(row.measuredValues) && row.measuredValues[idx]) {
                              mVal = row.measuredValues[idx];
                            } else if (idx === 0 && row.maStation1) {
                              mVal = row.maStation1;
                            } else if (idx === 1 && row.maStation2) {
                              mVal = row.maStation2;
                            }
                            return (
                              <React.Fragment key={idx}>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{mVal.kvp || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{mVal.time || "-"}</td>
                              </React.Fragment>
                            );
                          })}

                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgTime || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 print:mt-1 grid grid-cols-2 gap-4 print:gap-1" style={{ marginTop: '2px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>kVp Tolerance : {testData.accuracyOfOperatingPotential.kvpToleranceSign || "Â±"} {testData.accuracyOfOperatingPotential.kvpToleranceValue || "5"} kV</p>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>Time Tolerance : {testData.accuracyOfOperatingPotential.timeToleranceSign || "Â±"} {testData.accuracyOfOperatingPotential.timeToleranceValue || "10"} %</p>
                </div> */}

                {/* Accuracy of Irradiation Time â€” shown inside section 1 */}
                {testData.accuracyOfIrradiationTimeFull?.irradiationTimes?.length > 0 && (
                  <div className="mt-6 print:mt-2" style={{ marginTop: '8px' }}>
                    {/* <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '4px' }}>Accuracy of Irradiation Time</h4> */}

                    {/* Test Conditions */}
                    {testData.accuracyOfIrradiationTimeFull.testConditions && (
                      <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                        <h5 className="text-xs font-semibold mb-1 print:text-[9px]" style={{ fontSize: '10px', marginBottom: '2px' }}>Test Conditions</h5>
                        <div className="overflow-x-auto print:overflow-visible">
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FDD (cm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-center">
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.accuracyOfIrradiationTimeFull.testConditions.fcd || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.accuracyOfIrradiationTimeFull.testConditions.kv || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.accuracyOfIrradiationTimeFull.testConditions.ma || "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Irradiation Time Table */}
                    <div className="overflow-x-auto print:overflow-visible">
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
                          {testData.accuracyOfIrradiationTimeFull.irradiationTimes.map((row: any, i: number) => {
                            const setTime = parseFloat(row.setTime) || 0;
                            const measuredTime = parseFloat(row.measuredTime) || 0;
                            const error = setTime > 0 ? Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2) : "-";
                            const toleranceValue = parseFloat(testData.accuracyOfIrradiationTimeFull.tolerance?.value || "10");
                            const toleranceOp = testData.accuracyOfIrradiationTimeFull.tolerance?.operator || "<=";
                            let remark = "-";
                            if (error !== "-" && !isNaN(parseFloat(error))) {
                              const errorVal = parseFloat(error);
                              switch (toleranceOp) {
                                case ">": remark = errorVal > toleranceValue ? "FAIL" : "PASS"; break;
                                case "<": remark = errorVal < toleranceValue ? "PASS" : "FAIL"; break;
                                case ">=": remark = errorVal >= toleranceValue ? "FAIL" : "PASS"; break;
                                case "<=": remark = errorVal <= toleranceValue ? "PASS" : "FAIL"; break;
                                default: remark = "-";
                              }
                            }
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error !== "-" ? `${error}%` : "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>{remark}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Tolerance */}
                    {testData.accuracyOfIrradiationTimeFull.tolerance && (
                      <div className="mt-2 print:mt-1" style={{ marginTop: '2px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                          Tolerance : Error {testData.accuracyOfIrradiationTimeFull.tolerance.operator === ">" || testData.accuracyOfIrradiationTimeFull.tolerance.operator === ">=" ? ">" : testData.accuracyOfIrradiationTimeFull.tolerance.operator === "<" || testData.accuracyOfIrradiationTimeFull.tolerance.operator === "<=" ? "<" : "Â±"} {testData.accuracyOfIrradiationTimeFull.tolerance.value || "10"} %
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Filtration result card â€” shown inside section 1, following RadiographyFixed pattern
                {testData.totalFiltration?.totalFiltration && (() => {
                  const tf = testData.totalFiltration.totalFiltration;
                  const ft = testData.totalFiltration.filtrationTolerance || {};
                  const kvp = parseFloat(tf.atKvp ?? "");
                  const measured = parseFloat(tf.required ?? tf.measured ?? "");
                  const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
                  const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");
                  let requiredTol = NaN;
                  if (!isNaN(kvp)) {
                    if (kvp < threshold1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                    else if (kvp <= threshold2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                    else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                  }
                  const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                    ? (measured >= requiredTol ? "PASS" : "FAIL")
                    : "-";
                  return (
                    <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '8px' }}>
                      <h4 className="font-semibold mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Total Filtration</h4>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.atKvp || "-"} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.required || tf.measured || "-"} mm Al</td>
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
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                        <span className="font-semibold">Tolerance criteria: </span>
                        {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} |&nbsp;
                        {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} â‰¤ kV â‰¤ {ft.kvThreshold2 ?? "100"} |&nbsp;
                        {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                      </div>
                    </div>
                  );
                })()} */}
              </div>
            )}

            {/* 2. Total Filtration Section */}
            {testData.totalFiltration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2.Accuracy Of Operating Potential</h3>

                {/* kV Measurement at Different mA */}
                {testData.totalFiltration.measurements && testData.totalFiltration.measurements.length > 0 && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>kV Measurement at Different mA</h4>
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                            {(testData.totalFiltration.mAStations || []).map((station: string, idx: number) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{station}</th>
                            ))}
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.totalFiltration.measurements.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                              {(testData.totalFiltration.mAStations || []).map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  {(row.measuredValues && row.measuredValues[idx]) || "-"}
                                </td>
                              ))}
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remarks === "PASS" ? "text-green-600 font-semibold" : row.remarks === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 print:mt-1" style={{ marginTop: '2px' }}>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                        Tolerance : {testData.totalFiltration.tolerance?.sign || "Â±"} {testData.totalFiltration.tolerance?.value || "2.0"} kV
                      </p>
                    </div>
                  </div>
                )}

                {/* Total Filtration Details */}
                {testData.totalFiltration.totalFiltration && (() => {
                  const tf = testData.totalFiltration.totalFiltration;
                  const ft = testData.totalFiltration.filtrationTolerance || {};
                  const kvp = parseFloat(tf.atKvp ?? "");
                  // NOTE: the UI stores the measured HVL value in 'required' field (not 'measured')
                  const measuredVal = tf.required ?? tf.measured ?? "";
                  const measured = parseFloat(measuredVal);
                  const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
                  const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");

                  let requiredTol = NaN;
                  if (!isNaN(kvp)) {
                    if (kvp < threshold1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                    else if (kvp <= threshold2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                    else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                  }

                  const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                    ? (measured >= requiredTol ? "PASS" : "FAIL")
                    : "-";

                  return (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>3.Total Filtration</h4>
                      <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                        <table className="w-full border-collapse text-sm compact-table" style={{ fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              <td className="border border-black font-semibold bg-gray-50 w-1/2 text-left" style={{ padding: '0px 4px', fontSize: '11px' }}>At kVp</td>
                              <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.atKvp || "-"} kVp</td>
                            </tr>
                            <tr>
                              <td className="border border-black font-semibold bg-gray-50 text-left" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                              <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{measuredVal || "-"} mm Al</td>
                            </tr>
                            <tr>
                              <td className="border border-black font-semibold bg-gray-50 text-left" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
                              <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                {!isNaN(requiredTol) ? `â‰¥ ${requiredTol} mm Al` : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-black font-semibold bg-gray-50 text-left" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
                              <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>
                                  {filtrationRemark}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                          <span className="font-semibold">Tolerance criteria: </span>
                          {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} |&nbsp;
                          {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} â‰¤ kV â‰¤ {ft.kvThreshold2 ?? "100"} |&nbsp;
                          {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.rows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold  mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity Of mA loading</h3>

                {/* Test Conditions */}
                {testData.linearityOfMaLoading.table1 && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '3px' }}>Test Conditions:</p>
                    <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>kV</th>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>Time (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.linearityOfMaLoading.table1?.fcd || "-"}</td>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.linearityOfMaLoading.table1?.kv || "-"}</td>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.linearityOfMaLoading.table1?.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Linearity Table â€” recalculate CoL inline */}
                {(() => {
                  const rows = testData.linearityOfMaLoading.rows;
                  const tolVal = parseFloat(testData.linearityOfMaLoading.tolerance ?? '0.1') || 0.1;
                  const xValues: number[] = [];
                  const processed = rows.map((row: any) => {
                    const outputs = (row.measuredOutputs ?? []).map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v) && v > 0);
                    const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                    const avgDisplay = avg !== null ? avg.toFixed(3) : (row.average || 'â€”');
                    const ma = parseFloat(row.ma);
                    const x = avg !== null && ma > 0 ? avg / ma : null;
                    const xDisplay = x !== null ? x.toFixed(4) : (row.x_bar || 'â€”');
                    if (x !== null) xValues.push(parseFloat(x.toFixed(4)));
                    return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                  });
                  const hasData = xValues.length > 0;
                  const xMax = hasData ? Math.max(...xValues) : NaN;
                  const xMin = hasData ? Math.min(...xValues) : NaN;
                  const col = hasData && (xMax + xMin) > 0 ? Math.abs(xMax - xMin) / (xMax + xMin) : NaN;
                  const colDisplay = !isNaN(col) ? col.toFixed(4) : (rows[0]?.coefficient || 'â€”');
                  const pass = !isNaN(col) ? col <= tolVal : (rows[0]?.remark?.toUpperCase() === 'PASS');
                  const remarkDisplay = !isNaN(col) ? (pass ? 'PASS' : 'FAIL') : (rows[0]?.remark || 'â€”');
                  const measCount = Math.max(...rows.map((r: any) => (r.measuredOutputs ?? []).length), 0);

                  return (
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mA</th>
                            {Array.from({ length: measCount }, (_, i) => (
                              <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Meas {i + 1}</th>
                            ))}
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg Output</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>X </th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>X MAX</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>X MIN</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>CoL</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processed.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.ma || '-'}</td>
                              {Array.from({ length: measCount }, (_, j) => (
                                <td key={j} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                  {(row.measuredOutputs ?? [])[j] || '-'}
                                </td>
                              ))}
                              <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row._avgDisplay}</td>
                              <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row._xDisplay}</td>
                              {i === 0 && (
                                <>
                                  <td rowSpan={processed.length} className="border border-black p-1 text-center font-medium bg-yellow-50 align-middle" style={{ padding: '0px 2px', fontSize: '10px' }}>{!isNaN(xMax) ? xMax.toFixed(4) : 'â€”'}</td>
                                  <td rowSpan={processed.length} className="border border-black p-1 text-center font-medium bg-yellow-50 align-middle" style={{ padding: '0px 2px', fontSize: '10px' }}>{!isNaN(xMin) ? xMin.toFixed(4) : 'â€”'}</td>
                                  <td rowSpan={processed.length} className="border border-black p-1 text-center font-bold bg-yellow-50 align-middle" style={{ padding: '0px 2px', fontSize: '10px' }}>{colDisplay}</td>
                                  <td rowSpan={processed.length} className={`border border-black p-1 text-center font-bold align-middle ${pass ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`} style={{ padding: '0px 2px', fontSize: '10px' }}>{remarkDisplay}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="mt-2 print:mt-1" style={{ marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>Tolerance : Coefficient of Linearity â‰¤ {testData.linearityOfMaLoading.tolerance || "0.1"}</p>
                </div>
              </div>
            )}
            {/* 2. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfRadiationOutput?.outputRows?.length > 0 && (() => {
              const repro = testData.reproducibilityOfRadiationOutput;
              const rows = repro.outputRows;
              const measCount = Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
              const tolVal = parseFloat(repro.tolerance?.value ?? '0.05') || 0.05;
              const tolOp = repro.tolerance?.operator ?? '<=';

              /** BMD model stores FDD as `fcd: { value }` (same as entry form â€œFDD(cm)â€). */
              const fddCmDisplay = (() => {
                const f = repro.fcd;
                if (f != null && typeof f === "object" && "value" in f) {
                  const v = (f as { value?: unknown }).value;
                  if (v != null && String(v).trim() !== "") return String(v).trim();
                }
                if (typeof f === "string" && f.trim() !== "") return f.trim();
                const ffd = (repro as { ffd?: { value?: unknown } | string }).ffd;
                if (ffd != null && typeof ffd === "object" && "value" in ffd) {
                  const v = ffd.value;
                  if (v != null && String(v).trim() !== "") return String(v).trim();
                }
                if (typeof ffd === "string" && ffd.trim() !== "") return ffd.trim();
                return "-";
              })();

              const getVal = (o: any): number => {
                if (o == null) return NaN;
                if (typeof o === 'number') return o;
                if (typeof o === 'string') return parseFloat(o);
                if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                return NaN;
              };

              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold  mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Reproducibility of radiation output(mGy)</h3>
                  <div className="mb-3 print:mb-1" style={{ marginBottom: '6px' }}>
                    <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '3px' }}>Operating parameters</p>
                    <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{fddCmDisplay}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                          {Array.from({ length: measCount }, (_, i) => (
                            <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Meas {i + 1}</th>
                          ))}
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (XÌ„)</th>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>CoV</th>
                          <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Remark</th>
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
                              covDisplay = cov.toFixed(4);
                              const passes = (tolOp === '<=' || tolOp === '<') ? cov <= tolVal : cov >= tolVal;
                              remark = passes ? 'Pass' : 'Fail';
                            }
                          } else if (row.cv) {
                            covDisplay = row.cv;
                          }
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || row.kvp || '-'}</td>
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
                                <span className={remark === 'Pass' ? 'text-green-600' : remark === 'Fail' ? 'text-red-600' : ''}>{remark}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 p-2 print:p-1 rounded border mt-2" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {tolOp} {tolVal}
                    </p>
                  </div>
                </div>
              );
            })()}


            {/* 5. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold  mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Radiation leakage level at 1m from tube housing</h3>

                {/* Operating Parameters */}
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <div className="overflow-x-auto mb-2 print:mb-1">
                    <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Distance from Focus (cm)</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kVp</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mA</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Time (Sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.tubeHousingLeakage.distance || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.tubeHousingLeakage.kvp || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.tubeHousingLeakage.ma || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.tubeHousingLeakage.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Workload and Tolerance */}
                <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                  <div>
                    <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                      <strong>Workload:</strong> {testData.tubeHousingLeakage.workload || "-"} mAmin in one hr
                    </p>
                  </div>
                  <div>
                    {/* <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                      <strong>Tolerance:</strong> {testData.tubeHousingLeakage.toleranceOperator === "less than or equal to" ? "â‰¤" : testData.tubeHousingLeakage.toleranceOperator === "greater than or equal to" ? "â‰¥" : "="} {testData.tubeHousingLeakage.toleranceValue || "1"} mGy ({parseFloat(testData.tubeHousingLeakage.toleranceValue || "1") * 114} mR) in one hour
                    </p> */}
                  </div>
                </div>

                {/* Exposure Level Table */}
                <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ width: '15%', padding: '0px 2px', fontSize: '10px' }}>Location</th>
                        <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Exposure Level (mR/hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mR in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mGy in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remarks</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Left</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Right</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Foot</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Head</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Top</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.tubeHousingLeakage.leakageRows.map((row: any, i: number) => {
                        const maValue = parseFloat(testData.tubeHousingLeakage.ma || "0");
                        const workloadValue = parseFloat(testData.tubeHousingLeakage.workload || "0");
                        // leakageRows already have foot/head mapped from front/back; also try raw fields
                        const rawLeakage = testData.tubeHousingLeakage.leakageMeasurements?.[i];
                        const leftVal = parseFloat(row.left || rawLeakage?.left || "0") || 0;
                        const rightVal = parseFloat(row.right || rawLeakage?.right || "0") || 0;
                        const footVal = parseFloat(row.foot || rawLeakage?.front || rawLeakage?.top || "0") || 0;
                        const headVal = parseFloat(row.head || rawLeakage?.back || rawLeakage?.up || "0") || 0;
                        const topVal = parseFloat(rawLeakage?.top || "0") || 0;
                        const rowMax = Math.max(leftVal, rightVal, footVal, headVal, topVal);
                        let calculatedMR = "-";
                        let calculatedMGy = "-";
                        let remark = row.remark || "-";
                        if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                          const resMR = (workloadValue * rowMax) / (60 * maValue);
                          calculatedMR = resMR.toFixed(3);
                          calculatedMGy = (resMR / 114).toFixed(4);
                          if (remark === "-" || !remark) {
                            const tolVal = parseFloat(testData.tubeHousingLeakage.toleranceValue) || 1.0;
                            remark = (resMR / 114) <= tolVal ? "Pass" : "Fail";
                          }
                        }
                        return (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leftVal > 0 ? leftVal.toFixed(3) : "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{rightVal > 0 ? rightVal.toFixed(3) : "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{footVal > 0 ? footVal.toFixed(3) : "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{headVal > 0 ? headVal.toFixed(3) : "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{topVal > 0 ? topVal.toFixed(3) : "-"}</td>
                            <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMR}</td>
                            <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMGy}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                              <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>{remark}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Formula and Summary */}
                {(() => {
                  const maValue = parseFloat(testData.tubeHousingLeakage.ma || "0");
                  const workloadValue = parseFloat(testData.tubeHousingLeakage.workload || "0");
                  const allMGy = testData.tubeHousingLeakage.leakageRows.map((r: any) => parseFloat(r.mgy || "0")).filter((v: number) => v > 0);
                  const maxMGy = allMGy.length > 0 ? Math.max(...allMGy) : NaN;
                  return (
                    <div className="space-y-2 print:space-y-1">
                      <div className="bg-gray-50 p-3 print:p-1 rounded border border-gray-200">
                        <p className="text-sm print:text-[10px] font-bold mb-1">Calculation Formula:</p>
                        <div className="bg-white p-2 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                          Maximum Leakage (mR in 1 hr) = (Workload Ã— Max Exposure) / (60 Ã— mA)
                        </div>
                        <p className="text-[10px] print:text-[8px] mt-1 text-gray-600 italic">
                          Where: Workload = {workloadValue} mAmin/hr | mA = {maValue} | 1 mGy = 114 mR
                        </p>
                      </div>
                      {!isNaN(maxMGy) && (
                        <div className="bg-gray-50 p-2 print:p-1 rounded border">
                          <p className="text-sm print:text-[9px] font-semibold" style={{ fontSize: '11px' }}>
                            Maximum Radiation Leakage from Tube Housing: {maxMGy.toFixed(4)} mGy in one hour
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold  mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Radiation protection survey</h3>

                {/* Survey Details Table */}
                {/* <div className="mb-4 print:mb-2" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Survey Details</h4>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>Survey Date</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied Current (mA)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied Voltage (kV)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure Time (s)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Workload (mAÂ·min/week)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Calibration Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>{formatDate(testData.radiationProtectionSurvey.surveyDate) || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProtectionSurvey.workload || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProtectionSurvey.calibrationCertificateValid || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div> */}

                {/* 3. Measured Maximum Radiation Levels */}
                {/* <div className="mb-6 print:mb-2" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                  <div className="overflow-x-auto mb-6 print:mb-2 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>Location</th>
                          <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                          <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>{loc.location || "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={loc.result === "PASS" || loc.result === "Pass" ? "text-green-600 font-semibold" : loc.result === "FAIL" || loc.result === "Fail" ? "text-red-600 font-semibold" : ""}>
                                {loc.result || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div> */}

                {/* 4. Calculation Formula */}
                {/* <div className="mb-6 print:mb-2" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>4. Calculation Formula</h4>
                  <div className="overflow-x-auto mb-6 print:mb-2 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 print:p-1 bg-gray-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                            <strong>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div> */}

                {/* 5. Summary of Maximum Radiation Level/week */}
                {/* {(() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");

                  const maxWorkerWeekly = workerLocs.length > 0
                    ? Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0)).toFixed(3)
                    : "0.000";

                  const maxPublicWeekly = publicLocs.length > 0
                    ? Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0)).toFixed(3)
                    : "0.000";

                  const workerResult = parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : "Fail";
                  const publicResult = parseFloat(maxPublicWeekly) <= 2 ? "Pass" : "Fail";

                  return (
                    <div className="mb-6 print:mb-2" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="overflow-x-auto mb-6 print:mb-2 print:overflow-visible" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Category</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center">
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>For Radiation Worker</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{maxWorkerWeekly} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                  {workerResult}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center">
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{maxPublicWeekly} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                  {publicResult}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()} */}
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                {/* <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Details of Radiation Protection Survey</h3> */}

                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration || testData.radiationProtectionSurvey.calibrationCertificateValid) && (
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
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.hasValidCalibration || testData.radiationProtectionSurvey.calibrationCertificateValid || "-"}</td>
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
                {(() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");
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
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || 'â€”'} mAmin/week Ã— {maxWorkerLocation.mRPerHr || 'â€”'} mR/hr) / (60 Ã— {testData.radiationProtectionSurvey.appliedCurrent || 'â€”'} mA)</p>
                            <p className="text-xs print:text-[8px] mt-1" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxWorkerWeekly} mR/week</p>
                          </div>
                        )}
                        {maxPublicLocation.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-3 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-1" style={{ fontSize: '11px', margin: '2px 0' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxPublicLocation.location}</p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || 'â€”'} mAmin/week Ã— {maxPublicLocation.mRPerHr || 'â€”'} mR/hr) / (60 Ã— {testData.radiationProtectionSurvey.appliedCurrent || 'â€”'} mA)</p>
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

export default ViewServiceReportBMD;
