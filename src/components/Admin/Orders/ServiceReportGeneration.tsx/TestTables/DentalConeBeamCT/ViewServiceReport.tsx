// src/components/reports/ViewServiceReportCBCT.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForCBCT, getRadiationProtectionSurveyByServiceIdForCBCT } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
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
  toolsUsed?: Tool[];
  notes?: Note[];
  category?: string;
  qaTestSubmittedAt?: string;

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
          const toNumber = (v: any): number => {
            if (v == null || v === "") return NaN;
            if (typeof v === "number") return v;
            if (typeof v === "string") return parseFloat(v);
            if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
            return NaN;
          };
          const firstValidNumber = (...vals: any[]): number => {
            for (const val of vals) {
              const n = toNumber(val);
              if (Number.isFinite(n)) return n;
            }
            return NaN;
          };

          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Dental Cone Beam CT (CBCT)",
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
            qaTestSubmittedAt: data.qaTestSubmittedAt || "",
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
              toleranceSign: operatingPotentialData.tolerance?.sign || operatingPotentialData.tolerance?.type || "±",
              toleranceValue: operatingPotentialData.tolerance?.value || "2.0",
              mAStations: operatingPotentialData.mAStations || [],
            };
          }

          // Transform RadiationLeakageTestCBCT data to match component expectations
          const radiationLeakageData = data.RadiationLeakageTestCBCT;
          let transformedRadiationLeakage = null;

          if (radiationLeakageData) {
            // Transform leakageMeasurements array to leakageRows array
            const toleranceValue = parseFloat(radiationLeakageData.toleranceValue || radiationLeakageData.tolerance || "1");
            const toleranceOperator = radiationLeakageData.toleranceOperator || "less than or equal to";
            const workloadValue = firstValidNumber(radiationLeakageData.workload, 0);

            const leakageRows = (radiationLeakageData.leakageMeasurements || radiationLeakageData.leakageRows || []).map((measurement: any) => {
              const numFrom = (v: any) => {
                if (v == null || v === "") return 0;
                if (typeof v === "number") return v;
                if (typeof v === "string") return parseFloat(v) || 0;
                if (typeof v === "object" && "value" in v) return parseFloat((v as any).value) || 0;
                return 0;
              };
              // Calculate max if not provided
              let maxValue = measurement.max;
              if (!maxValue || maxValue === "" || maxValue === "-") {
                const values = [
                  measurement.left,
                  measurement.right,
                  measurement.front,
                  measurement.back,
                  measurement.top,
                  measurement.up,
                  measurement.down
                ]
                  .map((v: any) => numFrom(v))
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
                  const tolOpNormalized = toleranceOperator.toLowerCase();
                  if (tolOpNormalized === "<=" || tolOpNormalized === "less than or equal to") {
                    remark = maxNum <= toleranceValue ? "Pass" : "Fail";
                  } else if (tolOpNormalized === ">=" || tolOpNormalized === "greater than or equal to") {
                    remark = maxNum >= toleranceValue ? "Pass" : "Fail";
                  } else if (tolOpNormalized === "<" || tolOpNormalized === "less than") {
                    remark = maxNum < toleranceValue ? "Pass" : "Fail";
                  } else if (tolOpNormalized === ">" || tolOpNormalized === "greater than") {
                    remark = maxNum > toleranceValue ? "Pass" : "Fail";
                  } else if (tolOpNormalized === "=" || tolOpNormalized === "equal to") {
                    remark = Math.abs(maxNum - toleranceValue) < 0.001 ? "Pass" : "Fail";
                  } else {
                    remark = "-";
                  }
                } else {
                  remark = "-";
                }
              }

              const fmt = (v: any) => {
                if (v == null || v === "" || v === undefined) return "-";
                if (typeof v === "object" && "value" in v) {
                  const val = (v as any).value;
                  return val != null && val !== "" ? String(val) : "-";
                }
                return String(v);
              };
              return {
                location: measurement.location ?? "-",
                left: fmt(measurement.left ?? measurement.Left),
                right: fmt(measurement.right ?? measurement.Right),
                front: fmt(measurement.front ?? measurement.Front),
                back: fmt(measurement.back ?? measurement.Back),
                top: fmt(measurement.top ?? measurement.Top),
                up: fmt(measurement.up ?? measurement.Up),
                down: fmt(measurement.down ?? measurement.Down),
                max: maxValue,
                unit: measurement.unit || "mGy/h",
                remark: remark,
              };
            });

            // Handle settings - could be array or single object, and check various possible field names
            let settingsArray = [];
            const rawSettings = radiationLeakageData.measurementSettings || radiationLeakageData.settings || radiationLeakageData.measurementSettingsArray;

            if (Array.isArray(rawSettings) && rawSettings.length > 0) {
              settingsArray = rawSettings;
            } else if (rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)) {
              settingsArray = [rawSettings];
            } else if (radiationLeakageData.ma || radiationLeakageData.mA || radiationLeakageData.kv || radiationLeakageData.kvp || radiationLeakageData.time) {
              // Fallback: create settings array from top-level fields
              settingsArray = [{
                ma: radiationLeakageData.ma || radiationLeakageData.mA || "",
                kv: radiationLeakageData.kv || radiationLeakageData.kvp || "",
                time: radiationLeakageData.time || "",
                ffd: radiationLeakageData.ffd || ""
              }];
            }

            transformedRadiationLeakage = {
              ...radiationLeakageData,
              leakageRows: leakageRows,
              settings: settingsArray,
              workload: workloadValue,
              ma: firstValidNumber(
                radiationLeakageData.ma,
                radiationLeakageData.mA,
                settingsArray?.[0]?.ma,
                settingsArray?.[0]?.mA,
                settingsArray?.[0]?.appliedCurrent,
                radiationLeakageData.measurementSettings?.[0]?.ma,
                radiationLeakageData.measurementSettings?.[0]?.mA
              ),
              toleranceValue: toleranceValue,
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
            totalFiltration: operatingPotentialData?.totalFiltration ?? data.AccuracyOfOperatingPotentialCBCT?.totalFiltration ?? null,
          });

          // Fetch radiation protection survey directly to ensure locations are populated
          try {
            const surveyRes = await getRadiationProtectionSurveyByServiceIdForCBCT(serviceId);
            const surveyData = surveyRes?.data?.data || surveyRes?.data || surveyRes;
            if (surveyData?.locations?.length > 0) {
              setTestData((prev: any) => ({ ...prev, radiationSurvey: surveyData }));
            }
          } catch { /* ignore */ }

          // Transform LinearityOfMaLoadingCBCT data
          const linearityData = data.LinearityOfMaLoadingCBCT;
          if (linearityData && Array.isArray(linearityData.table2)) {
            setTestData((prev: any) => ({
              ...prev,
              linearityOfMaLoading: {
                ...linearityData,
                table2Rows: linearityData.table2.map((r: any, i: number) => ({
                  id: String(i + 1),
                  ma: r.ma || '-',
                  measuredOutputs: r.measuredOutputs || [],
                  average: r.average || '-',
                  x: r.x || '-',
                  xMax: r.xMax || '-',
                  xMin: r.xMin || '-',
                  col: r.col || '-',
                  remarks: r.remarks || '-',
                }))
              }
            }));
          }
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

          <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div>
          <h1 className="text-center text-2xl font-bold underline mb-4 print:mb-2 print:text-base" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR DENTAL CONE BEAM CT (CBCT)
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
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Details of Equipment Under Test</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make || "-"],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Condition", report.condition || "-"],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ["RP ID", report.rpId || "-"],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate || "")],
                  ["Location", report.location],
                  ["Temperature (°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
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
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.irradiationTime?.irradiationTimes?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {testData.irradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FFD (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.irradiationTime.testConditions.fcd || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.irradiationTime.testConditions.kv || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.irradiationTime.testConditions.ma || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
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
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Error {toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={pass ? "text-green-600" : "text-red-600"}>{pass ? "PASS" : "FAIL"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {testData.irradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.irradiationTime.tolerance.operator || "<="} {testData.irradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
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
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${row.remarks === "Pass" || row.remarks === "PASS" ? "bg-green-100 text-green-800" : row.remarks === "Fail" || row.remarks === "FAIL" ? "bg-red-100 text-red-800" : "text-gray-500"}`}>
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

            {/* 5. Total Filtration */}
            {testData.totalFiltration && (() => {
              const tf = testData.totalFiltration;
              const kvp = parseFloat(tf.atKvp || tf.appliedKV || tf.kv || "");
              const measured = parseFloat(tf.measuredTF || tf.measured || "");

              let requiredTol = 2.5; // Default for CBCT/General
              if (!isNaN(kvp)) {
                if (kvp < 70) requiredTol = 1.5;
                else if (kvp <= 100) requiredTol = 2.0;
                else requiredTol = 2.5;
              }

              const filtrationRemark = (!isNaN(measured))
                ? (measured >= requiredTol ? "PASS" : "FAIL")
                : "-";

              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Total Filtration</h3>
                  <div className="border-2 border-black rounded overflow-hidden" style={{ marginTop: '4px' }}>
                    <table className="w-full border-collapse text-sm compact-table" style={{ fontSize: '11px' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black font-semibold bg-gray-50 p-2 w-1/2 text-left" style={{ padding: '4px 8px' }}>Specified at kVp</td>
                          <td className="border border-black text-center p-2" style={{ padding: '4px 8px' }}>{tf.atKvp || tf.appliedKV || tf.kv || "-"} kVp</td>
                        </tr>
                        <tr>
                          <td className="border border-black font-semibold bg-gray-50 p-2 text-left" style={{ padding: '4px 8px' }}>Measured Total Filtration</td>
                          <td className="border border-black text-center p-2" style={{ padding: '4px 8px' }}>{tf.measuredTF || tf.measured || "-"} mm Al</td>
                        </tr>
                        <tr>
                          <td className="border border-black font-semibold bg-gray-50 p-2 text-left" style={{ padding: '4px 8px' }}>Required (Tolerance)</td>
                          <td className="border border-black text-center p-2" style={{ padding: '4px 8px' }}>
                            ≥ {requiredTol} mm Al
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black font-semibold bg-gray-50 p-2 text-left" style={{ padding: '4px 8px' }}>Result / Remarks</td>
                          <td className="border border-black text-center p-2 font-bold" style={{ padding: '4px 8px' }}>
                            <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>
                              {filtrationRemark}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* <div className="mt-2 text-[10px] text-gray-600 italic">
                    Tolerance criteria: ≥ 2.5 mm Al (for applied potential over 70 kVp) as per AERB guidelines.
                  </div> */}
                </div>
              );
            })()}
            {/* 2.5. Total Filtration */}
            {/* {testData.totalFiltration && (testData.totalFiltration.measured != null || testData.totalFiltration.required != null) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Total Filtration</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>At kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured (mm Al)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Required (mm Al)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.totalFiltration.atKvp ?? "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.totalFiltration.measured ?? "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.totalFiltration.required ?? "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )} */}

  {/* 4. Linearity of mA Loading */}
            {testData.linearityOfMaLoading?.table2Rows?.length > 0 && (() => {
              const rows = testData.linearityOfMaLoading.table2Rows;
              const measHeaders = testData.linearityOfMaLoading.measurementHeaders || ["Meas 1", "Meas 2", "Meas 3"];
              const measCount = measHeaders.length;
              const tolerance = testData.linearityOfMaLoading.tolerance || "0.1";

              // Calculate overall Xmax, Xmin, CoL if not already pre-calculated
              const xResults = rows.map((row: any) => {
                const outputsArr = Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
                const values = outputsArr.map((v: any) => parseFloat(String(v))).filter((n: number) => !isNaN(n) && n > 0);
                const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
                const ma = parseFloat(row.ma) || 0;
                const time = parseFloat(testData.linearityOfMaLoading.table1?.time) || 0;
                const mas = ma * time || 1; // Fallback to 1 to avoid division by zero
                const x = mas > 0 ? avg / mas : 0;
                return { avg, x, row };
              });

              const xValues = xResults.map((r: any) => r.x).filter((x: number) => x > 0);
              const xMax = xValues.length > 0 ? Math.max(...xValues) : 0;
              const xMin = xValues.length > 0 ? Math.min(...xValues) : 0;
              const col = (xMax + xMin) > 0 ? Math.abs(xMax - xMin) / (xMax + xMin) : 0;
              const isPassOverall = col <= parseFloat(tolerance);

              return (
                <div className="mb-16 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity of mA Loading</h3>

                  {/* Test Conditions Table */}
                  <div className="mb-4 print:mb-1">
                    <div className="overflow-x-auto mb-2 print:mb-1">
                      <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '350px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FDD (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Time (Sec)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.linearityOfMaLoading.table1?.fcd || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.linearityOfMaLoading.table1?.kv || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.linearityOfMaLoading.table1?.time || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>mA Station</th>
                          {measHeaders.map((h: string, idx: number) => (
                            <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{h}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>Avg. Output (mGy)</th>
                          <th className="border border-black p-2 print:p-1 text-center font-bold bg-blue-50" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>X (mGy/mAs)</th>
                          <th className="border border-black p-2 print:p-1 text-center font-bold bg-yellow-50" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                          <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-50" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {xResults.map((res: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{res.row.ma || "-"}</td>
                            {Array.from({ length: measCount }).map((_, idx) => (
                              <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>
                                {res.row.measuredOutputs?.[idx] || "-"}
                              </td>
                            ))}
                            <td className="border border-black p-2 print:p-1 text-center font-semibold" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{res.avg > 0 ? res.avg.toFixed(3) : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{res.x > 0 ? res.x.toFixed(4) : "-"}</td>
                            {i === 0 && (
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 text-center font-bold align-middle bg-yellow-50" style={{ padding: '0px 4px', fontSize: '12px', borderColor: '#000000', verticalAlign: 'middle' }}>
                                {col > 0 ? col.toFixed(3) : "-"}
                              </td>
                            )}
                            {i === 0 && (
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 text-center font-bold align-middle bg-green-50" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', verticalAlign: 'middle' }}>
                                <span className={isPassOverall ? "text-green-600" : "text-red-600"}>
                                  {isPassOverall ? "Pass" : "Fail"}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Coefficient Detail Card */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50/30 border border-blue-100 p-3 print:p-1 rounded">
                      <p className="text-[11px] print:text-[8px] font-bold text-blue-800">Calculation Summary:</p>
                      <p className="text-[10px] print:text-[7px] text-gray-700 mt-1">
                        X<sub>max</sub> = <strong>{xMax > 0 ? xMax.toFixed(4) : "-"}</strong> | X<sub>min</sub> = <strong>{xMin > 0 ? xMin.toFixed(4) : "-"}</strong>
                      </p>
                      <p className="text-[10px] print:text-[7px] text-gray-700">
                        CoL = |X<sub>max</sub> - X<sub>min</sub>| / (X<sub>max</sub> + X<sub>min</sub>) = <strong>{col > 0 ? col.toFixed(3) : "-"}</strong>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 print:p-1 rounded border flex flex-col justify-center">
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                        <strong>Acceptance Criteria:</strong>
                      </p>
                      <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                        Coefficient of Linearity ≤ {tolerance}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Output Consistency */}
            {testData.outputConsistency?.outputRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Output Consistency</h3>
                {testData.outputConsistency.ffd != null && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>FDD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.outputConsistency.ffd || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
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
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => {
                        const outputsArr = Array.isArray(row.outputs) ? row.outputs : [];
                        const outputVals = outputsArr.map((v: any) => (typeof v === 'object' && v != null && 'value' in v ? v.value : v));
                        const numCols = Math.max(outputVals.length, testData.outputConsistency.measurementHeaders?.length || 3);
                        const cells = Array.from({ length: numCols }, (_, idx) => outputVals[idx] != null && outputVals[idx] !== "" ? String(outputVals[idx]) : "-");
                        return (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp ?? row.kv ?? "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas ?? row.mAs ?? "-"}</td>
                          {cells.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean ?? row.avg ?? "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            {(() => {
                              const covVal = row.cov ?? row.cv;
                              if (covVal != null && covVal !== "") return covVal;

                              const values: number[] = outputVals
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
                          <td className="border border-black p-2 print:p-1 text-center font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                            <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
                              {row.remarks || "-"}
                            </span>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
                {/* Tolerance Statement */}
                {testData.outputConsistency.tolerance != null && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance?.operator ?? "<="} {testData.outputConsistency.tolerance?.value ?? testData.outputConsistency.tolerance ?? "0.05"}
                    </p>
                  </div>
                )}
              </div>
            )}

          


            {/* 6. Radiation Leakage Test */}
            {testData.radiationLeakage?.leakageRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Measurement of Radiation Leakage Level from X-ray Tube House</h3>
                
                {/* Table Layout */}
                <div className="overflow-x-auto mb-4 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ width: '15%', padding: '0px 2px', fontSize: '10px' }}>Location</th>
                        <th colSpan={4} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Exposure Level (mR/hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mR in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mGy in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remarks</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Left</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Right</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Front</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Back</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.radiationLeakage.leakageRows.map((row: any, i: number) => {
                        const toNum = (v: any): number => {
                          if (v == null || v === "") return NaN;
                          if (typeof v === "number") return v;
                          if (typeof v === "string") return parseFloat(v);
                          if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                          return NaN;
                        };
                        const pickNum = (...vals: any[]): number => {
                          for (const val of vals) {
                            const n = toNum(val);
                            if (Number.isFinite(n)) return n;
                          }
                          return NaN;
                        };
                        const maValue = pickNum(
                          testData.radiationLeakage.ma,
                          testData.radiationLeakage.mA,
                          testData.radiationLeakage.settings?.[0]?.ma,
                          testData.radiationLeakage.settings?.[0]?.mA,
                          testData.radiationLeakage.settings?.[0]?.appliedCurrent,
                          testData.radiationLeakage.measurementSettings?.[0]?.ma,
                          testData.radiationLeakage.measurementSettings?.[0]?.mA,
                          testData.radiationLeakage.measurementSettings?.[0]?.appliedCurrent
                        );
                        const workloadValue = pickNum(testData.radiationLeakage.workload, 0);

                        // CBCT: exposure columns are Left / Right / Front / Back only
                        const left = parseFloat(row.left || "0");
                        const right = parseFloat(row.right || "0");
                        const front = parseFloat(row.front || "0");
                        const back = parseFloat(row.back || "0");

                        const values = [left, right, front, back].filter(v => v > 0);
                        const rowMax = values.length > 0 ? Math.max(...values) : 0;
                        
                        // Convert to mR/hr if unit is mGy/h
                        const exposureLevelMR = (row.unit === 'mGy/h' ? rowMax * 114 : rowMax);

                        let calculatedMR = "-";
                        let calculatedMGy = "-";
                        let remark = row.remark || "-";

                        if (exposureLevelMR > 0 && maValue > 0 && workloadValue > 0) {
                          const resMR = (workloadValue * exposureLevelMR) / (60 * maValue);
                          calculatedMR = resMR.toFixed(3);
                          calculatedMGy = (resMR / 114).toFixed(4);

                          if (remark === "-" || !remark) {
                            const tolVal = parseFloat(testData.radiationLeakage.toleranceValue) || 1.0;
                            const resMGyNum = resMR / 114;
                            remark = resMGyNum <= tolVal ? "Pass" : "Fail";
                          }
                        }

                        return (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.left || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.right || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.front || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.back || "-"}</td>
                            <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMR}</td>
                            <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMGy}</td>
                            <td className="border border-black p-1 text-center font-semibold text-xs" style={{ padding: '0px 2px', fontSize: '10px' }}>
                              <span className={remark === "Pass" || remark === "PASS" ? "text-green-600 font-bold" : remark === "Fail" || remark === "FAIL" ? "text-red-600 font-bold" : ""}>
                                {remark}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Calculation and Summary Blocks */}
                {(() => {
                  const toNum = (v: any): number => {
                    if (v == null || v === "") return NaN;
                    if (typeof v === "number") return v;
                    if (typeof v === "string") return parseFloat(v);
                    if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                    return NaN;
                  };
                  const pickNum = (...vals: any[]): number => {
                    for (const val of vals) {
                      const n = toNum(val);
                      if (Number.isFinite(n)) return n;
                    }
                    return NaN;
                  };
                  const maValue = pickNum(
                    testData.radiationLeakage.ma,
                    testData.radiationLeakage.mA,
                    testData.radiationLeakage.settings?.[0]?.ma,
                    testData.radiationLeakage.settings?.[0]?.mA,
                    testData.radiationLeakage.settings?.[0]?.appliedCurrent,
                    testData.radiationLeakage.measurementSettings?.[0]?.ma,
                    testData.radiationLeakage.measurementSettings?.[0]?.mA,
                    testData.radiationLeakage.measurementSettings?.[0]?.appliedCurrent
                  );
                  const workloadValue = pickNum(testData.radiationLeakage.workload, 0);

                  const getSummaryForLocation = (locName: string) => {
                    const row = testData.radiationLeakage.leakageRows.find((m: any) => m.location === locName);
                    if (!row) return null;
                    const l = parseFloat(row.left || "0");
                    const r = parseFloat(row.right || "0");
                    const f = parseFloat(row.front || "0");
                    const b = parseFloat(row.back || "0");

                    const values = [l, r, f, b].filter(v => v > 0);
                    const rowMax = values.length > 0 ? Math.max(...values) : 0;
                    const exposureLevelMR = (row.unit === 'mGy/h' ? rowMax * 114 : rowMax);
                    if (!(exposureLevelMR > 0 && maValue > 0 && workloadValue > 0)) return null;
                    const resMR = (workloadValue * exposureLevelMR) / (60 * maValue);
                    const resMGy = resMR / 114;
                    return { rowMax, exposureLevelMR, resMR, resMGy, unit: row.unit };
                  };

                  const tubeSummary = getSummaryForLocation("Tube");
                  const collimatorSummary = getSummaryForLocation("Collimator");

                  return (
                    <div className="space-y-4 print:space-y-1">
                      {/* Formula Block */}
                      <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
                        <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
                        <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                          Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                        </div>
                        <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                          Where: Workload = {Number.isFinite(workloadValue) ? workloadValue : "-"} mA·min/week | mA = {Number.isFinite(maValue) && maValue > 0 ? maValue : "-"} | 1 mGy = 114 mR
                        </p>
                      </div>

                      {/* Summary Blocks */}
                      <div className="grid grid-cols-2 gap-4 print:gap-1">
                        {tubeSummary && (
                          <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                            <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">Tube Housing Summary:</p>
                            <div className="text-[11px] print:text-[8px] space-y-1">
                              <p>Max Measured: <strong>{tubeSummary.rowMax} {tubeSummary.unit}</strong></p>
                              {tubeSummary.unit === 'mGy/h' && <p className="text-[10px] italic">({tubeSummary.rowMax} × 114 = {tubeSummary.exposureLevelMR.toFixed(2)} mR/hr)</p>}
                              <p>Result: ({workloadValue} × {tubeSummary.exposureLevelMR.toFixed(3)}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                              <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy</span></p>
                            </div>
                          </div>
                        )}
                        {collimatorSummary && (
                          <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                            <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">Collimator Summary:</p>
                            <div className="text-[11px] print:text-[8px] space-y-1">
                              <p>Max Measured: <strong>{collimatorSummary.rowMax} {collimatorSummary.unit}</strong></p>
                              {collimatorSummary.unit === 'mGy/h' && <p className="text-[10px] italic">({collimatorSummary.rowMax} × 114 = {collimatorSummary.exposureLevelMR.toFixed(2)} mR/hr)</p>}
                              <p>Result: ({workloadValue} × {collimatorSummary.exposureLevelMR.toFixed(3)}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                              <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy</span></p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tolerance Narrative */}
                      <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
                        <p className="text-[11px] print:text-[8px] leading-relaxed">
                          <strong>Note:</strong> The maximum leakage radiation from the X-ray tube housing and collimator, measured at a distance of 1 meter from the focus, averaged over an area of 100 cm², shall not exceed 1.0 mGy in one hour when the tube is operated at its maximum rated continuous filament current at the maximum rated tube potential.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 6. Radiation Protection Survey */}
            {testData.radiationSurvey?.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Details of Radiation Protection Survey</h3>

                {/* 1. Survey Details */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-black text-sm print:text-[10px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Date of Radiation Protection Survey</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{formatDate(report?.qaTestSubmittedAt || testData.radiationSurvey.surveyDate || "") || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationSurvey.hasValidCalibration || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Equipment Setting */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>2. Equipment Setting</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-black text-sm print:text-[10px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Applied Current (mA)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationSurvey.appliedCurrent || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Applied Voltage (kV)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationSurvey.appliedVoltage || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Exposure Time (s)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationSurvey.exposureTime || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Workload (mA min/week)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationSurvey.workload || "-"}</td>
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
                          <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000' }}>Location</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationSurvey.locations.map((loc: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{loc.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td className="border border-black p-2 print:p-1" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td className="border border-black p-2 print:p-1" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>
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
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 print:p-1 bg-gray-50 text-center" style={{ padding: '4px', fontSize: '11px', lineHeight: '1.2', borderColor: '#000000', textAlign: 'center' }}>
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

                  const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, workerLocs[0] || { mRPerHr: '', location: '', mRPerWeek: '0' });

                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, publicLocs[0] || { mRPerHr: '', location: '', mRPerWeek: '0' });

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
                              <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>Category</th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>For Radiation Worker</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {workerResult || "-"}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>For Public</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {publicResult || "-"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Calculation Detail Cards */}
                      <div className="mt-4 print:mt-1 grid grid-cols-1 gap-2">
                        {maxWorkerLocation.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-blue-50/30 border border-blue-100 p-3 print:p-1 rounded">
                            <p className="text-[11px] print:text-[8px] font-bold text-blue-800 mb-1">Calculation for Max. Radiation Level/week (Radiation Worker):</p>
                            <p className="text-[10px] print:text-[7px] text-gray-700">
                              Location: <strong>{maxWorkerLocation.location}</strong> | Max. Level: {maxWorkerLocation.mRPerHr} mR/hr
                            </p>
                            <p className="text-[10px] print:text-[7px] text-gray-700 mt-1">
                              Result: ({testData.radiationSurvey.workload || '0'} mA·min/wk × {maxWorkerLocation.mRPerHr}) / (60 × {testData.radiationSurvey.appliedCurrent || '0'} mA) = <span className="font-bold">{maxWorkerWeekly} mR/week</span>
                            </p>
                          </div>
                        )}
                        {maxPublicLocation.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-indigo-50/30 border border-indigo-100 p-3 print:p-1 rounded">
                            <p className="text-[11px] print:text-[8px] font-bold text-indigo-800 mb-1">Calculation for Max. Radiation Level/week (Public):</p>
                            <p className="text-[10px] print:text-[7px] text-gray-700">
                              Location: <strong>{maxPublicLocation.location}</strong> | Max. Level: {maxPublicLocation.mRPerHr} mR/hr
                            </p>
                            <p className="text-[10px] print:text-[7px] text-gray-700 mt-1">
                              Result: ({testData.radiationSurvey.workload || '0'} mA·min/wk × {maxPublicLocation.mRPerHr}) / (60 × {testData.radiationSurvey.appliedCurrent || '0'} mA) = <span className="font-bold">{maxPublicWeekly} mR/week</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Permissible Limit */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-[10px]" style={{ marginBottom: '2px', fontSize: '11px' }}>6. Permissible Limit</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-black text-sm print:text-[10px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold w-1/2 text-left" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>For location of Radiation Worker</td>
                          <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>20 mSv in a year (40 mR/week)</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold text-left" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>For Location of Member of Public</td>
                          <td className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>1 mSv in a year (2mR/week)</td>
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