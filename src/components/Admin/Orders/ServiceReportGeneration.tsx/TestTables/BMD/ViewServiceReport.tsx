// src/components/reports/ViewServiceReportBMD.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForBMD, getReportNumbers, getAccuracyOfIrradiationTimeByServiceIdForBMD, getDetails } from "../../../../../../api";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
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
  testDate?: any;
  testDueDate?: string;
  location?: string;
  temperature?: string;
  humidity?: string;
  toolsUsed?: Tool[];
  notes?: Note[];
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
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
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
              
              // Calculate result (mR in one hour): (workload × max) / (60 × mA)
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
                timeToleranceSign: irrData.tolerance?.operator === ">" || irrData.tolerance?.operator === ">=" ? "+" : irrData.tolerance?.operator === "<" || irrData.tolerance?.operator === "<=" ? "-" : "±",
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
                appliedKvp: row.appliedKvp || row.appliedkVp || "", // Normalize field name
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

  // Fetch ULR Number
  useEffect(() => {
    const fetchULRNumber = async () => {
      if (!serviceId) return;
      try {
        // Try to get from service details
        const serviceDetails = await getDetails(serviceId);
        if (serviceDetails?.data?.qaTests && serviceDetails.data.qaTests.length > 0) {
          // Get the first QA test's ULR number
          const ulr = serviceDetails.data.qaTests[0]?.reportULRNumber;
          if (ulr) {
            setUlrNumber(ulr);
            return;
          }
        }
        
        // Fallback: Try to get from localStorage (check all keys that might contain reportNumbers)
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('reportNumbers_')) {
            try {
              const reportNumbers = JSON.parse(localStorage.getItem(key) || '{}');
              const serviceReport = reportNumbers[serviceId];
              if (serviceReport?.qatest?.reportULRNumber) {
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
      // Recalculate page count before generating PDF
      const reportContent = document.getElementById('report-content');
      if (reportContent) {
        const pageHeight = 1123 - 37.8; // A4 height minus margins
        const contentHeight = reportContent.scrollHeight;
        const estimatedPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
        setPageCount(String(estimatedPages));
      }
      
      await generatePDF({
        elementId: "report-content",
        filename: `BMD-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
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
            <img src={logoA} alt="NABL" className="h-28 print:h-12" />
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
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{ulrNumber}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <img src={logo} alt="Logo" className="h-28 print:h-12" />
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
          <section className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm" style={{ marginBottom: '2px', fontSize: '11px' }}>1. Customer Details</h2>
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
          <section className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm" style={{ marginBottom: '2px', fontSize: '11px' }}>2. Reference</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm" style={{ marginBottom: '2px', fontSize: '11px' }}>3. Equipment Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ["Category", report.category || "-"],
                  ["Location", report.location],
                  ["Test Date", formatDate(report.testDate)],
                  ["Total Pages", pageCount],
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
          <section className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm" style={{ marginBottom: '2px', fontSize: '11px' }}>4. Standards / Tools Used</h2>
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
          <section className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm" style={{ marginBottom: '2px', fontSize: '11px' }}>5. Notes</h2>
            <div className="ml-8 text-sm print:text-[8px] print:ml-4" style={{ fontSize: '12px', lineHeight: '1.2' }}>
              {notesArray.map(n => (
                <p key={n.slNo} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              ))}
            </div>
          </section>

          {/* Signature */}
          <div className="flex justify-between items-end mt-8 print:mt-1" style={{ marginTop: '2px' }}>
            <img src={AntesoQRCode} alt="QR" className="h-24 print:h-12" />
            <div className="text-center">
              <img src={Signature} alt="Signature" className="h-20 print:h-8 mx-auto mb-2 print:mb-1" />
              <p className="font-bold print:text-xs">Authorized Signatory</p>
            </div>
          </div>

          <footer className="text-center text-xs print:text-[8px] text-gray-600 mt-6 print:mt-1" style={{ marginTop: '2px' }}>
            <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
            <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
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
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. ACCURACY OF OPERATING POTENTIAL (KVP) AND IRRADIATION TIME</h3>
                <div className="overflow-x-auto print:overflow-visible">
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
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>kVp Tolerance : {testData.accuracyOfOperatingPotential.kvpToleranceSign || "±"} {testData.accuracyOfOperatingPotential.kvpToleranceValue || "5"} kV</p>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>Time Tolerance : {testData.accuracyOfOperatingPotential.timeToleranceSign || "±"} {testData.accuracyOfOperatingPotential.timeToleranceValue || "10"} %</p>
                </div>

              </div>
            )}

            {/* Total Filtration Section */}
            {testData.totalFiltration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1.TOTAL FILTRATION</h3>
                
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
                              {(row.measuredValues || []).map((val: string, idx: number) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
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
                        Tolerance : {testData.totalFiltration.tolerance?.sign || "±"} {testData.totalFiltration.tolerance?.value || "2.0"} kV
                      </p>
                    </div>
                  </div>
                )}

                {/* Total Filtration Details */}
                {testData.totalFiltration.totalFiltration && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Total Filtration</h4>
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured (mm Al)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Required (mm Al)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>At kVp</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center">
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.totalFiltration.totalFiltration.measured || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.totalFiltration.totalFiltration.required || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.totalFiltration.totalFiltration.atKvp || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Filtration Tolerance */}
                {testData.totalFiltration.filtrationTolerance && (
                  <div className="mt-4 print:mt-1" style={{ marginTop: '2px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Filtration Tolerance</h4>
                    <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      <p>For kV &gt; {testData.totalFiltration.filtrationTolerance.kvThreshold2 || "100"}: {testData.totalFiltration.filtrationTolerance.forKvGreaterThan100 || "2.5"} mm Al</p>
                      <p>For {testData.totalFiltration.filtrationTolerance.kvThreshold1 || "70"} ≤ kV ≤ {testData.totalFiltration.filtrationTolerance.kvThreshold2 || "100"}: {testData.totalFiltration.filtrationTolerance.forKvBetween70And100 || "2.0"} mm Al</p>
                      <p>For kV &gt; {testData.totalFiltration.filtrationTolerance.kvThreshold1 || "70"}: {testData.totalFiltration.filtrationTolerance.forKvGreaterThan70 || "1.5"} mm Al</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTimeFull?.irradiationTimes?.length > 0 && (
              <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. ACCURACY OF IRRADIATION TIME</h3>
                
                {/* Test Conditions */}
                {testData.accuracyOfIrradiationTimeFull.testConditions && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Test Conditions</h4>
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FCD (cm)</th>
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

                {/* Accuracy of Irradiation Time Table */}
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Accuracy of Irradiation Time</h4>
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
                </div>

                {/* Tolerance */}
                {testData.accuracyOfIrradiationTimeFull.tolerance && (
                  <div className="mt-4 print:mt-1" style={{ marginTop: '2px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      Tolerance : Error {testData.accuracyOfIrradiationTimeFull.tolerance.operator === ">" || testData.accuracyOfIrradiationTimeFull.tolerance.operator === ">=" ? ">" : testData.accuracyOfIrradiationTimeFull.tolerance.operator === "<" || testData.accuracyOfIrradiationTimeFull.tolerance.operator === "<=" ? "<" : "±"} {testData.accuracyOfIrradiationTimeFull.tolerance.value || "10"} %
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfRadiationOutput?.measurements?.length > 0 && (
              <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. REPRODUCIBILITY OF RADIATION OUTPUT (mGy)</h3>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>KV</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                        {testData.reproducibilityOfRadiationOutput.measurements.map((_: any, i: number) => (
                          <th key={i} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {i + 1}</th>
                        ))}
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average (X̄)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoV</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center">
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.reproducibilityOfRadiationOutput.kv || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.reproducibilityOfRadiationOutput.ma || "-"}</td>
                        {testData.reproducibilityOfRadiationOutput.measurements.map((m: any, i: number) => (
                          <td key={i} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{m.measured || "-"}</td>
                        ))}
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.reproducibilityOfRadiationOutput.mean || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.reproducibilityOfRadiationOutput.cov || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.reproducibilityOfRadiationOutput.result || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 print:mt-1" style={{ marginTop: '2px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>Tolerance : CoV ≤ {testData.reproducibilityOfRadiationOutput.tolerance?.value || "0.05"}</p>
                </div>
              </div>
            )}

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.rows?.length > 0 && (
              <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. LINEARITY OF MA LOADING</h3>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>mA Station</th>
                        {Array.isArray(testData.linearityOfMaLoading.rows[0]?.measuredOutputs) && testData.linearityOfMaLoading.rows[0].measuredOutputs.map((_: any, idx: number) => (
                          <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                        ))}
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average (X̄) mGy</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mGy/mAs (X̄)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Coefficient of Linearity</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMaLoading.rows.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>{row.ma || "-"}</td>
                          {Array.isArray(row.measuredOutputs) && row.measuredOutputs.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.average || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.x_bar || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.coefficient || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 print:mt-1" style={{ marginTop: '2px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>Tolerance : Coefficient of Linearity ≤ {testData.linearityOfMaLoading.tolerance || "0.1"}</p>
                </div>
              </div>
            )}

            {/* 5. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. RADIATION LEAKAGE LEVEL AT 1M FROM TUBE HOUSING</h3>
                
                {/* Operating Parameters */}
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Operating parameters:</h4>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance from the Focus (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Kvp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (Sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.tubeHousingLeakage.distance || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.tubeHousingLeakage.kvp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.tubeHousingLeakage.ma || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.tubeHousingLeakage.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exposure Level Table */}
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Exposure Level (mR/hr) at 1.0 m from the Focus</h4>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>Location (at 1.0 m from the focus)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Left</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Right</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Foot</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Head</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.tubeHousingLeakage.leakageRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>{row.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.left || "-"} {row.left !== "-" ? "mR/hr" : ""}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.right || "-"} {row.right !== "-" ? "mR/hr" : ""}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.foot || "-"} {row.foot !== "-" ? "mR/hr" : ""}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.head || "-"} {row.head !== "-" ? "mR/hr" : ""}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.result !== "-" ? `${row.result} mR in one hour` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.remark === "Pass" ? "text-green-600 font-semibold" : row.remark === "Fail" ? "text-red-600 font-semibold" : ""}>
                                {row.remark || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Work Load */}
                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Work Load:</h4>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                    {testData.tubeHousingLeakage.workload || "-"} mAmin in one hr
                  </p>
                </div>

                {/* Max Leakage Calculation */}
                {testData.tubeHousingLeakage.leakageRows.length > 0 && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Max Leakage:</h4>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      ({testData.tubeHousingLeakage.workload || "—"} mAmin in 1 hr × {Math.max(...testData.tubeHousingLeakage.leakageRows.map((r: any) => parseFloat(r.max || "0"))).toFixed(3) || "—"} max Exposure Level (mR/hr)) / (60 × {testData.tubeHousingLeakage.ma || "—"} mA used for measurement)
                    </p>
                    <p className="text-sm print:text-[9px] font-semibold mt-1" style={{ fontSize: '11px', marginTop: '2px' }}>
                      Calculated Max Leakage: {testData.tubeHousingLeakage.leakageRows[0]?.result !== "-" ? `${testData.tubeHousingLeakage.leakageRows[0].result} mR in one hour` : "—"}
                    </p>
                  </div>
                )}

                {/* Maximum Radiation Leakage from Tube Housing */}
                {testData.tubeHousingLeakage.maxMGy && testData.tubeHousingLeakage.maxMGy !== "-" && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Maximum Radiation Leakage from Tube Housing:</h4>
                    <p className="text-sm print:text-[9px] font-semibold" style={{ fontSize: '11px' }}>
                      {testData.tubeHousingLeakage.maxMGy} mGy in one hour
                    </p>
                  </div>
                )}

                {/* Tolerance */}
                <div className="mt-4 print:mt-1" style={{ marginTop: '2px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                    <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{' '}
                    {testData.tubeHousingLeakage.toleranceOperator === "less than or equal to" ? "<" : testData.tubeHousingLeakage.toleranceOperator === "greater than or equal to" ? ">" : "="}{' '}
                    {testData.tubeHousingLeakage.toleranceValue || "1"} mGy ({parseFloat(testData.tubeHousingLeakage.toleranceValue || "1") * 114} mR) in one hour.
                  </p>
                </div>
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold uppercase mb-4 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. RADIATION PROTECTION SURVEY</h3>

                {/* Survey Details Table */}
                <div className="mb-4 print:mb-2" style={{ marginBottom: '4px' }}>
                  <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-[9px]" style={{ fontSize: '11px', marginBottom: '2px' }}>Survey Details</h4>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>Survey Date</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied Current (mA)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied Voltage (kV)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure Time (s)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Workload (mA·min/week)</th>
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
                </div>

                {/* 3. Measured Maximum Radiation Levels */}
                <div className="mb-6 print:mb-2" style={{ marginBottom: '4px' }}>
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
                </div>

                {/* 4. Calculation Formula */}
                <div className="mb-6 print:mb-2" style={{ marginBottom: '4px' }}>
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
                </div>

                {/* 5. Summary of Maximum Radiation Level/week */}
                {(() => {
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
                })()}
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