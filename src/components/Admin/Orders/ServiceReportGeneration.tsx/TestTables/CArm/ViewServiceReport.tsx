// src/components/reports/ViewServiceReportCArm.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForCArm, getTubeHousingLeakageByServiceIdCArm, getDetails, getTools } from "../../../../../../api";
import { generatePDF } from "../../../../../../utils/generatePDF";
import { ReportPdfPageHeader } from "../RadiographyFixed/component/Header";
import { ReportPdfPageFooter } from "../RadiographyFixed/component/Footer";
import { ReportPdfPageFooterEnd } from "../RadiographyFixed/component/FooterEnd";
import { ReportPdfPageNoteQR } from "../RadiographyFixed/component/NoteQR";
import { ReportPdfPageDeclaration } from "../RadiographyFixed/component/Declaration";
import MainTestTableForCArm from "./MainTestTableForCArm";

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
  city?: string;
  hospitalName?: string;
  fullAddress?: string;
  leadOwner?: any;
  manufacturerName?: string;
  leadOwnerType?: string;
  leadOwnerRole?: string;
  leadOwnerName?: string;
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
  pages?: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  qrCode?: string;
  notes?: Note[];
  authorizedSignatoryName?: string;
  authorizedSignatorySignature?: string;

  // Test documents
  ExposureRateTableTopCArm?: any;
  HighContrastResolutionCArm?: any;
  LowContrastResolutionCArm?: any;
  OutputConsistencyForCArm?: any;
  TotalFilterationForCArm?: any;
  TubeHousingLeakageCArm?: any;
  LinearityOfmAsLoadingCArm?: any;
  AccuracyOfIrradiationTimeCArm?: any;
  LinearityOfMaLoadingCArm?: any;
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

/** First non-empty scalar from API (handles { value } wrappers and legacy key aliases). */
function pickOutputConsistencyScalar(...candidates: any[]): string {
  for (const v of candidates) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && v !== null && "value" in v) {
      const inner = (v as { value?: unknown }).value;
      if (inner === undefined || inner === null) continue;
      const s = String(inner).trim();
      if (s !== "") return s;
      continue;
    }
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return "";
}

/** API stores `measurementHeaders`; older UI used `headers`. Rows may use mA / remarks aliases. */
function normalizeCArmOutputConsistency(raw: any): any | null {
  if (!raw || typeof raw !== "object") return null;
  const headerList =
    Array.isArray(raw.measurementHeaders) && raw.measurementHeaders.length > 0
      ? raw.measurementHeaders
      : Array.isArray(raw.headers) && raw.headers.length > 0
        ? raw.headers
        : undefined;

  const outputRows = (raw.outputRows || []).map((row: any) => ({
    ...row,
    kvp: pickOutputConsistencyScalar(row.kvp, row.kVp, row.kV) || row.kvp,
    ma: pickOutputConsistencyScalar(row.ma, row.mA, row.mAs, row.current) || row.ma,
    remark: pickOutputConsistencyScalar(row.remark, row.remarks) || row.remark,
  }));

  return {
    ...raw,
    headers: headerList ?? raw.headers,
    measurementHeaders: raw.measurementHeaders ?? headerList,
    outputRows,
  };
}

const ViewServiceReportCArm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [timerChoice, setTimerChoice] = useState<boolean | null>(null);
  const [calculatedPages, setCalculatedPages] = useState<string>("");

  const pickRpId = (obj: any): string =>
    obj?.rpId || obj?.rpid || obj?.rpID || obj?.RPId || obj?.RPID || obj?.engineerAssigned?.rpId || obj?.engineerAssigned?.RPId || "N/A";

  const isToolUnexpired = (validTillRaw: string): boolean => {
    if (!validTillRaw) return false;
    const parsed = new Date(validTillRaw);
    if (Number.isNaN(parsed.getTime())) return false;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const validTillDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return validTillDate >= todayStart;
  };

  useEffect(() => {
    if (!serviceId) return;
    const stored = localStorage.getItem(`carm_timer_choice_${serviceId}`);
    if (stored !== null) {
      try {
        setTimerChoice(JSON.parse(stored));
      } catch {
        setTimerChoice(null);
      }
    }
  }, [serviceId]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeaderForCArm(serviceId),
          getDetails(serviceId).catch(() => null),
          getTools(serviceId).catch(() => null),
        ]);
        const normalizeTools = (raw: any): Tool[] => {
          if (!Array.isArray(raw)) return [];
          return raw.map((tool: any, index: number) => ({
            slNumber: String(tool?.slNumber || index + 1),
            nomenclature: tool?.nomenclature || "-",
            make: tool?.make || tool?.manufacturer || "-",
            model: tool?.model || "-",
            SrNo: tool?.SrNo || tool?.srNo || tool?.serialNumber || "-",
            range: tool?.range || "-",
            calibrationCertificateNo:
              tool?.calibrationCertificateNo || tool?.certificateNo || tool?.certificateNumber || "-",
            calibrationValidTill: tool?.calibrationValidTill || tool?.validTill || "",
          }));
        };
        const mergeTools = (primary: Tool[], secondary: Tool[]): Tool[] => {
          const seen = new Set<string>();
          const merged: Tool[] = [];
          const addUnique = (tool: Tool) => {
            const key = [
              String(tool.nomenclature || "").toLowerCase().trim(),
              String(tool.make || "").toLowerCase().trim(),
              String(tool.model || "").toLowerCase().trim(),
              String(tool.SrNo || "").toLowerCase().trim(),
              String(tool.calibrationCertificateNo || "").toLowerCase().trim(),
            ].join("|");
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(tool);
            }
          };
          primary.forEach(addUnique);
          secondary.forEach(addUnique);
          return merged.map((tool, idx) => ({ ...tool, slNumber: String(idx + 1) }));
        };
        const reportData =
          response?.data?.data ||
          (response?.exists ? response?.data : null) ||
          (response?.success && response?.data ? response.data : null) ||
          (response?.data && typeof response.data === "object" ? response.data : null);

        if (reportData) {
          const data = reportData;
          const headerTools = normalizeTools(
            data.toolsUsed || data.tools || data.standards || data.toolsAssigned
          );
          const assignedTools = normalizeTools(toolsRes?.data?.toolsAssigned || []);
          const mergedTools = mergeTools(headerTools, assignedTools);
          const detailsData = detailsRes?.data?.data || detailsRes?.data || {};
          const srfKey = data?.srfNumber || detailsData?.srfNumber || "";
          const cachedOrderBySrfRaw = srfKey ? localStorage.getItem(`order-basic-by-srf-${srfKey}`) : null;
          const cachedOrderBySrf = cachedOrderBySrfRaw ? JSON.parse(cachedOrderBySrfRaw) : {};
          const detailsLeadOwner =
            detailsData?.leadOwner ||
            detailsData?.leadowner ||
            cachedOrderBySrf?.leadOwner ||
            null;
          const detailsLeadOwnerRole = String(
            detailsData?.leadOwnerType ||
            detailsData?.leadOwnerRole ||
            cachedOrderBySrf?.leadOwner?.role ||
            detailsLeadOwner?.role ||
            ""
          ).trim();
          const detailsLeadOwnerName = String(
            detailsData?.manufacturerName ||
            cachedOrderBySrf?.manufacturerName ||
            detailsLeadOwner?.name ||
            ""
          ).trim();
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            city: data.city || detailsData?.city || "",
            hospitalName: data.hospitalName || detailsData?.hospitalName || cachedOrderBySrf?.hospitalName || "",
            fullAddress: data.fullAddress || detailsData?.fullAddress || cachedOrderBySrf?.fullAddress || "",
            leadOwner: data.leadOwner || data.leadowner || detailsLeadOwner || "",
            manufacturerName: data.manufacturerName || detailsData?.manufacturerName || cachedOrderBySrf?.manufacturerName || "",
            leadOwnerType: data.leadOwnerType || data.leadownerType || detailsLeadOwnerRole || "",
            leadOwnerRole: data.leadOwnerRole || data.leadownerRole || detailsLeadOwnerRole || "",
            leadOwnerName: data.leadOwnerName || detailsLeadOwnerName || "",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "C-Arm",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: pickRpId(data),
            pages: data.pages || "",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: mergedTools,
            qrCode: data.qrCode || "",

            notes: data.notes || defaultNotes,
            authorizedSignatoryName:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.name) ||
              data.authorizedSignatoryName ||
              "",
            authorizedSignatorySignature:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.signature) ||
              data.authorizedSignatorySignature ||
              "",
          });

          // Transform RadiationLeakageTest (CArm) data to match component expectations
          // Use report-linked data first; if missing, fetch by serviceId (test may exist but not be linked to report yet)
          let radiationLeakageData = data.TubeHousingLeakageCArm;
          if (!radiationLeakageData) {
            try {
              const byService = await getTubeHousingLeakageByServiceIdCArm(serviceId);
              radiationLeakageData = byService || null;
            } catch (_) {
              radiationLeakageData = null;
            }
          }
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
                front: measurement.front ?? measurement.top ?? "-",
                back: measurement.back ?? measurement.up ?? "-",
                left: measurement.left || "-",
                right: measurement.right || "-",
                top: measurement.top ?? measurement.down ?? "-",
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
            }

            transformedRadiationLeakage = {
              ...radiationLeakageData,
              leakageRows: leakageRows,
              settings: settingsArray,
              maxLeakageResult: radiationLeakageData.maxLeakageResult || '',
              maxRadiationLeakage: radiationLeakageData.maxRadiationLeakage || '',
            };
          }

          // Extract test data from populated response (tubeHousingLeakage: use transformed or raw API so section can render)
          setTestData({
            exposureRateTableTop: data.ExposureRateTableTopCArm || null,
            highContrastResolution: data.HighContrastResolutionCArm || null,
            lowContrastResolution: data.LowContrastResolutionCArm || null,
            outputConsistency: normalizeCArmOutputConsistency(data.OutputConsistencyForCArm),
            totalFilteration: data.TotalFilterationForCArm || null,
            operatingPotential: data.TotalFilterationForCArm || null, // Map from TotalFiltration as it contains Accuracy data
            tubeHousingLeakage: transformedRadiationLeakage || data.TubeHousingLeakageCArm || null,
            linearityOfMasLoading: data.LinearityOfmAsLoadingCArm || null,
            irradiationTime: data.AccuracyOfIrradiationTimeCArm || null,
            linearityOfMaLoading: data.LinearityOfMaLoadingCArm || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load C-Arm report:", err);
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
        filename: `CArm-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading C-Arm Report...</div>;

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

  const toolsArray = (report.toolsUsed || []).filter((tool) => isToolUnexpired(tool.calibrationValidTill));
  const leadOwnerRole = String(
    report?.leadOwnerType ||
    report?.leadOwnerRole ||
    report?.leadOwner?.role ||
    report?.leadOwner?.leadOwnerType ||
    report?.leadOwner ||
    ""
  ).trim().toLowerCase();
  const leadOwnerName = String(
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    report?.leadOwner ||
    ""
  ).trim();
  const isManufacturerLeadOwner =
    leadOwnerRole === "manufacturer" ||
    leadOwnerName.toLowerCase() === "manufacturer" ||
    !!String(report?.manufacturerName || "").trim();
  const manufacturerDisplayName =
    report?.manufacturerName ||
    report?.leadOwnerName ||
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    "-";
  const testingSiteName = report?.hospitalName || report?.customerName || "-";
  const testingSiteAddress = report?.fullAddress || report?.address || "-";
  const todayDate = formatDate(new Date().toISOString());
  const extractCity = (raw: string) => {
    if (!raw || raw === "N/A") return "";
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return "";
    const alphaParts = parts.filter((p) => /[A-Za-z]/.test(p) && !/^\d{6}$/.test(p.replace(/\s+/g, "")));
    if (alphaParts.length === 0) return "";
    const stateOrCountry = /^(india|bharat|uttar pradesh|up|delhi|new delhi|haryana|maharashtra|karnataka|tamil nadu|kerala|gujarat|rajasthan|punjab|bihar|west bengal|telangana|andhra pradesh|odisha|jharkhand|chhattisgarh|madhya pradesh|goa|assam|jammu and kashmir|ladakh|himachal pradesh|uttarakhand|manipur|meghalaya|mizoram|nagaland|sikkim|tripura|arunachal pradesh)$/i;
    const city = [...alphaParts].reverse().find((p) => !stateOrCountry.test(p));
    return city || alphaParts[alphaParts.length - 1];
  };
  const customerCity = extractCity(report?.location || "") || extractCity(report?.address || "") || "-";
  const placeValue = report?.city && String(report.city).trim() !== "" ? String(report.city).trim() : customerCity;
  const hasMaLinearity = !!testData.linearityOfMaLoading;
  const hasMasLinearity = !!testData.linearityOfMasLoading;
  const showMaLinearity =
    timerChoice === true
      ? (hasMaLinearity || !hasMasLinearity)
      : timerChoice === false
        ? (hasMaLinearity && !hasMasLinearity)
        : hasMaLinearity;
  const showMasLinearity =
    timerChoice === false
      ? (hasMasLinearity || !hasMaLinearity)
      : timerChoice === true
        ? (hasMasLinearity && !hasMaLinearity)
        : (hasMasLinearity && !hasMaLinearity);

  const ReportPage: React.FC<{
    isLast?: boolean;
    children: React.ReactNode;
  }> = ({ isLast, children }) => (
    <div
      className={`bg-white shadow-2xl print:shadow-none ${isLast ? "report-pdf-last-page-shell" : "report-pdf-page-shell"}`}
      style={{
        pageBreakAfter: "always",
        display: "flex",
        flexDirection: "column",
        width: "210mm",
        boxSizing: "border-box",
        minHeight: "297mm",
        margin: "20px auto",
        padding: "15mm 20mm",
      }}
    >
      <ReportPdfPageHeader report={report} formatDate={formatDate} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        {children}
      </div>
      {isLast ? (
        <ReportPdfPageFooterEnd todayDate={todayDate} customerCity={placeValue} />
      ) : (
        <ReportPdfPageFooter todayDate={todayDate} customerCity={placeValue} />
      )}
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="font-bold mb-1 text-[12px]">{title}</h2>
  );

  const TestSectionTitle = ({ num, title }: { num: number; title: string }) => (
    <h3 className="font-bold mb-2" style={{ fontSize: "12px" }}>
      {num}. {title}
    </h3>
  );

  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => {
    const padding = extra?.padding ? String(extra.padding) : "4px 6px";
    const parts = padding.trim().split(/\s+/);
    let finalPadding = padding;
    if (parts.length === 1) finalPadding = `${parts[0]} ${parts[0]} 4px ${parts[0]}`;
    else if (parts.length === 2) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[1]}`;
    else if (parts.length === 3) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[0]}`;
    else if (parts.length === 4) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[3]}`;

    return {
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
      padding: finalPadding,
    };
  };

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

      <div id="report-content" className="fixed-report-pdf">
        {/* PAGE 1 - MAIN REPORT */}
        <ReportPage>
          <h1 className="text-center font-bold underline mb-2" style={{ fontSize: "15px" }}>
            QA TEST REPORT FOR C-ARM X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: "9px" }}>
            (Periodic Quality Assurance shall be carried out at least once in five years as per AERB guidelines)
          </p>

          <section className="mb-3 text-[10px]">
            <SectionTitle title="1. Customer Details" />
            <div className="space-y-[2px]">
              {[
                ...(isManufacturerLeadOwner ? [["Name of the customer", manufacturerDisplayName]] : []),
                ["Name of the testing site", testingSiteName],
                ["Address of the testing site", testingSiteAddress],
              ].map(([label, value], index) => (
                <div key={label} className="flex">
                  <div className="w-6 text-right pr-1 font-semibold">1.{index + 1}</div>
                  <div className="w-64 font-semibold">{label}</div>
                  <div className="px-1 font-semibold">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-3 text-[10px]">
            <SectionTitle title="2. Customer Reference" />
            <div className="space-y-1">
              <div className="flex">
                <div className="w-6 text-right pr-1">2.1</div>
                <div className="w-64">SRF No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{report.srfNumber}</div>
                <div className="w-20">SRF Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(report.srfDate)}</div>
              </div>
              <div className="flex">
                <div className="w-6 text-right pr-1">2.2</div>
                <div className="w-64">Test Report No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{report.testReportNumber}</div>
                <div className="w-20">Issue Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(report.issueDate)}</div>
              </div>
            </div>
          </section>

          <section className="mb-3 text-[10px]">
            <SectionTitle title="3. Details Of Device Under Test" />
            <div className="space-y-[2px]">
              {[
                ["Nomenclature / Type of equipment", report.nomenclature],
                ["Make", report.make || "-"],
                ["Model", report.model],
                ["Sl. No.", report.slNumber],
                ["Condition of Test Item", report.condition],
                ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                ["Engineer's Name", report.engineerNameRPId || "-"],
                ["RP ID", report.rpId || "-"],
                ["No. of pages", calculatedPages || report.pages || "-"],
                ["QA Test Date", formatDate(report.testDate)],
                ["QA Test Due Date", formatDate(report.testDueDate)],
                ["Testing done at Location", report.location],
                ["Temperature (°C)", report.temperature || "-"],
                ["Humidity in RH (%)", report.humidity || "-"],
              ].map(([label, value], index) => (
                <div key={label} className="flex">
                  <div className="w-6 text-right pr-1">3.{index + 1}</div>
                  <div className="w-64">{label}</div>
                  <div className="px-1">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-3">
            <h2 className="font-bold mb-4" style={{ fontSize: "12px" }}>
              4. Standards / Tools Used
            </h2>
            <table style={{ ...tableStyle, tableLayout: "fixed" }} className="compact-table">
              <thead>
                <tr>
                  {["Sl No.", "Nomenclature", "Make", "Model", "Sr. No.", "Range", "Certificate No.", "Valid Till"].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={cellStyle({
                          fontWeight: 700,
                          border: "0.1px solid #666",
                          fontSize: "9px",
                          lineHeight: "1.2",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          padding: "3px 4px",
                          width: ["6%", "18%", "12%", "12%", "10%", "10%", "16%", "16%"][i],
                        })}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? (
                  toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{i + 1}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.nomenclature}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.make || "-"}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.model || "-"}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.SrNo}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.range}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.calibrationCertificateNo}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={cellStyle({ border: "0.1px solid #666" })}>
                      No tools recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div style={{ marginTop: "auto" }}>
            <ReportPdfPageNoteQR report={report} />
          </div>
        </ReportPage>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <ReportPage>
          <div style={{ width: "100%", flex: 1 }}>
            <MainTestTableForCArm testData={testData} hasTimer={timerChoice === true} />
          </div>
        </ReportPage>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>
              DETAILED TEST RESULTS
            </h2>

            {/* 1. Accuracy of Irradiation Time — only when unit has a timer */}
            {timerChoice === true && testData.irradiationTime && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {testData.irradiationTime.testConditions && (
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
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.irradiationTime.testConditions.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.irradiationTime.testConditions.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.irradiationTime.testConditions.ma || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.irradiationTime.irradiationTimes?.length > 0 && (() => {
                  const tol = testData.irradiationTime.tolerance;
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
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (sec)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.irradiationTime.irradiationTimes.map((row: any, i: number) => {
                            const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                            const remark = getRemark(error);
                            return (
                              <tr key={i} className="text-center">  
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
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
                {testData.irradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.irradiationTime.tolerance.operator || "<="} {testData.irradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Accuracy of Operating Potential (from Total Filtration document) */}
            {testData.operatingPotential?.measurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Operating Potential</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Applied kVp</th>
                        {testData.operatingPotential.mAStations?.map((ma: string, idx: number) => (
                          <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{ma}</th>
                        ))}
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Avg kVp</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.operatingPotential.measurements.map((row: any, i: number) => (
                        <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.appliedKvp || "-"}</td>
                          {row.measuredValues?.map((val: any, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.averageKvp || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>
                            <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600" : ""}>{row.remarks || "-"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(() => {
                  const tol =
                    testData.operatingPotential?.tolerance || testData.totalFilteration?.tolerance;
                  if (!tol) return null;
                  return (
                    <p className="text-sm print:text-[9px]" style={{ fontSize: "11px", marginTop: "2px" }}>
                      <strong>Tolerance:</strong> {tol.sign || "±"} {tol.value || "-"} kVp
                    </p>
                  );
                })()}
              </div>
            )}

            {/* 3. Total Filtration */}
            {testData.totalFilteration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                {testData.totalFilteration.totalFiltration && (() => {
                  const tf = testData.totalFilteration.totalFiltration;
                  const ft = testData.totalFilteration.filtrationTolerance || {};
                  const kvp = parseFloat(tf.atKvp ?? "");
                  const measured = parseFloat(tf.measured ?? "");
                  const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
                  const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");

                  let requiredTol = NaN;
                  if (!isNaN(kvp)) {
                    if (kvp < threshold1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                    else if (kvp <= threshold2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                    else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                  }
                  if (isNaN(requiredTol)) {
                    requiredTol = parseFloat(tf.required ?? "");
                  }

                  const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                    ? (measured >= requiredTol ? "PASS" : "FAIL")
                    : "-";

                  return (
                    <div className="rounded" style={{ padding: "4px 6px", marginTop: "4px" }}>
                      <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: "4px", fontSize: "12px" }}>
                        3. Total Filtration
                      </h3>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: "11px", borderCollapse: "collapse", borderSpacing: "0" }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: "0px 4px", fontSize: "11px" }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: "0px 4px", fontSize: "11px" }}>{tf.atKvp || "-"} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: "0px 4px", fontSize: "11px" }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: "0px 4px", fontSize: "11px" }}>{tf.measured || "-"} mm Al</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: "0px 4px", fontSize: "11px" }}>Required (Tolerance)</td>
                            <td className="border border-black text-center" style={{ padding: "0px 4px", fontSize: "11px" }}>
                              {!isNaN(requiredTol) ? `≥ ${requiredTol} mm Al` : "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: "0px 4px", fontSize: "11px" }}>Result</td>
                            <td className="border border-black text-center font-bold" style={{ padding: "0px 4px", fontSize: "11px" }}>
                              <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>
                                {filtrationRemark}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: "4px", fontSize: "10px", color: "#555" }}>
                        <span className="font-semibold">Tolerance criteria: </span>
                        {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV ≤ {ft.kvThreshold1 ?? "70"} |&nbsp;
                        {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} ≤ kV ≤ {ft.kvThreshold2 ?? "100"} |&nbsp;
                        {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. Output Consistency */}
            {testData.outputConsistency && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Consistency of Radiation Output</h3>
                {testData.outputConsistency.parameters && (
                  <div className="overflow-x-auto mb-4 print:mb-1">
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>FFD (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Time (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.outputConsistency.parameters.ffd ?? "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.outputConsistency.parameters.time ?? "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.outputConsistency.outputRows?.length > 0 && (() => {
                  const oc = testData.outputConsistency;
                  const headers =
                    (oc.measurementHeaders && oc.measurementHeaders.length > 0
                      ? oc.measurementHeaders
                      : oc.headers && oc.headers.length > 0
                        ? oc.headers
                        : null) ||
                    (() => {
                    const first = oc.outputRows[0];
                    const out = Array.isArray(first?.outputs) ? first.outputs : (first?.outputs && typeof first.outputs === 'object' ? Object.values(first.outputs) : []);
                    return out.map((_: any, idx: number) => `Meas ${idx + 1}`);
                  })();
                  const colCount = headers.length;
                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                            {headers.map((h: string, hi: number) => (
                              <th key={hi} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{h}</th>
                            ))}
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.5)' }}>Mean (X̄)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>COV</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oc.outputRows.map((row: any, i: number) => {
                            const rawOutputs = Array.isArray(row.outputs) ? row.outputs : (row.outputs && typeof row.outputs === 'object' && !Array.isArray(row.outputs) ? Object.values(row.outputs) : []);
                            const outputs = rawOutputs.map((v: any) => (v && typeof v === 'object' && 'value' in v) ? v.value : v);
                            const kvpDisp = pickOutputConsistencyScalar(row.kvp, row.kVp, row.kV) || "-";
                            const maDisp = pickOutputConsistencyScalar(row.ma, row.mA, row.mAs, row.current) || "-";
                            const remarkRaw = row.remark ?? row.remarks;
                            const remarkStr: string =
                              remarkRaw && typeof remarkRaw === "object" && "value" in remarkRaw
                                ? String((remarkRaw as any).value ?? "")
                                : String(remarkRaw ?? "");
                            return (
                              <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{kvpDisp}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{maDisp}</td>
                                {headers.slice(0, colCount).map((_: string, hi: number) => (
                                  <td key={hi} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{(outputs[hi] ?? row[`meas${hi + 1}`] ?? "-")}</td>
                                ))}
                                <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.3)' }}>{row.mean || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  {(() => {
                                    const covVal = row.cov ?? row.cv;
                                    if (covVal != null && covVal !== "") return covVal;

                                    const values = (outputs as any[])
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
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                  <span className={remarkStr === "Pass" ? "text-green-600 font-semibold" : remarkStr === "Fail" ? "text-red-600 font-semibold" : ""}>{remarkStr || "-"}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {testData.outputConsistency.tolerance != null && testData.outputConsistency.tolerance !== '' && (
                  <p className="text-sm mb-1" style={{ fontSize: '11px' }}><strong>Tolerance (COV):</strong> Less than or equal to {testData.outputConsistency.tolerance}</p>
                )}
                {testData.outputConsistency.finalRemark != null && testData.outputConsistency.finalRemark !== '' && (
                  <p className="text-sm" style={{ fontSize: '11px' }}><strong>Final Result:</strong> <span className={testData.outputConsistency.finalRemark === "Pass" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{testData.outputConsistency.finalRemark}</span></p>
                )}
              </div>
            )}

            {/* 5. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Low Contrast Resolution</h3>
                {testData.lowContrastResolution.resolutionRows?.length > 0 ? (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Resolution (lp/mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.lowContrastResolution.resolutionRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.resolution || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                              <span className={row.remark === "Pass" ? "text-green-600" : row.remark === "Fail" ? "text-red-600" : ""}>{row.remark || "-"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 font-semibold bg-gray-100">Smallest Hole Size Visible (mm)</td>
                          <td className="border border-black p-3 text-center">{testData.lowContrastResolution.smallestHoleSize || "-"}</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold bg-gray-100">Recommended Standard (mm)</td>
                          <td className="border border-black p-3 text-center">{testData.lowContrastResolution.recommendedStandard || "-"}</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold bg-gray-100">Result</td>
                          <td className="border border-black p-3 text-center">
                            <span className={parseFloat(testData.lowContrastResolution.smallestHoleSize || "0") <= parseFloat(testData.lowContrastResolution.recommendedStandard || "999") ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                              {parseFloat(testData.lowContrastResolution.smallestHoleSize || "0") <= parseFloat(testData.lowContrastResolution.recommendedStandard || "999") ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 6. High Contrast Resolution */}
            {testData.highContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. High Contrast Resolution</h3>
                {testData.highContrastResolution.resolutionRows?.length > 0 ? (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Resolution (lp/mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.highContrastResolution.resolutionRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.resolution || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                              <span className={row.remark === "Pass" ? "text-green-600" : row.remark === "Fail" ? "text-red-600" : ""}>{row.remark || "-"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <tbody>
                        <tr>
                          <td className="border border-black p-3 font-semibold bg-gray-100">Measured Resolution (lp/mm)</td>
                          <td className="border border-black p-3 text-center">{testData.highContrastResolution.measuredLpPerMm || "-"}</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold bg-gray-100">Recommended Standard (lp/mm)</td>
                          <td className="border border-black p-3 text-center">{testData.highContrastResolution.recommendedStandard || "-"}</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 font-semibold bg-gray-100">Result</td>
                          <td className="border border-black p-3 text-center">
                            <span className={parseFloat(testData.highContrastResolution.measuredLpPerMm || "0") >= parseFloat(testData.highContrastResolution.recommendedStandard || "0") ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                              {parseFloat(testData.highContrastResolution.measuredLpPerMm || "0") >= parseFloat(testData.highContrastResolution.recommendedStandard || "0") ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 7. Exposure Rate at Table Top */}
            {testData.exposureRateTableTop && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Exposure Rate at Table Top</h3>
                {testData.exposureRateTableTop.rows?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (cGy/Min)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.exposureRateTableTop.rows.map((row: any, i: number) => {
                          const aecTol = parseFloat(testData.exposureRateTableTop.aecTolerance || "10") || 0;
                          const nonAecTol = parseFloat(testData.exposureRateTableTop.nonAecTolerance || "5") || 0;
                          const exposure = parseFloat(row.exposure);
                          let result = row.result || "";
                          if (result === "" && !isNaN(exposure) && row.remark) {
                            const isPass = (row.remark === "AEC Mode" && exposure <= aecTol) || (row.remark === "Manual Mode" && exposure <= nonAecTol);
                            result = isPass ? "PASS" : "FAIL";
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.remark || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                <span className={result === "PASS" ? "text-green-600 font-semibold" : result === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                  {result || "-"}
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

            {/* 8. Tube Housing Leakage — same layout/structure as RadiographyFixed "8. Radiation Leakage Level" */}
            {testData.tubeHousingLeakage && (() => {
              const rll = testData.tubeHousingLeakage;
              const settings0 =
                Array.isArray(rll.settings) && rll.settings[0]
                  ? rll.settings[0]
                  : !Array.isArray(rll.settings) && rll.settings && typeof rll.settings === "object"
                    ? rll.settings
                    : ({} as Record<string, unknown>);
              const leakageMeasurements =
                Array.isArray(rll.leakageMeasurements) && rll.leakageMeasurements.length > 0
                  ? rll.leakageMeasurements
                  : Array.isArray(rll.leakageRows) && rll.leakageRows.length > 0
                    ? rll.leakageRows.map((r: any) => ({
                        location: r.location,
                        left: r.left,
                        right: r.right,
                        front: r.front,
                        back: r.back,
                        top: r.top,
                        remark: r.remark,
                      }))
                    : [];
              if (!(leakageMeasurements.length > 0 || rll.fcd || (settings0 as any).fcd)) return null;
              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: "4px", fontSize: "12px" }}>
                    8. Tube Housing Leakage
                  </h3>

                  <div className="mb-4 print:mb-1">
                    <div className="overflow-x-auto mb-2 print:mb-1">
                      <table
                        className="border-2 border-black text-sm print:text-[8px] compact-table"
                        style={{ fontSize: "10px", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: "0", maxWidth: "400px" }}
                      >
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              FFD (cm)
                            </th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              kV
                            </th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              mA
                            </th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              Time (Sec)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: "auto", minHeight: "0", lineHeight: "1.0", padding: "0", margin: "0" }}>
                            <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              {rll.fcd ?? (settings0 as any).fcd ?? "100"}
                            </td>
                            <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              {rll.kv ?? (settings0 as any).kv ?? "-"}
                            </td>
                            <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              {rll.ma ?? (settings0 as any).ma ?? "-"}
                            </td>
                            <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                              {rll.time ?? (settings0 as any).time ?? "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                    <div>
                      <p className="text-xs print:text-[8px]" style={{ fontSize: "10px" }}>
                        <strong>Workload:</strong> {rll.workload ?? "-"} {rll.workloadUnit ?? "mA·min/week"}
                      </p>
                    </div>
                    <div>
                      {/* <p className="text-xs print:text-[8px]" style={{ fontSize: "10px" }}>
                        <strong>Tolerance (mGy in 1 hr):</strong> {rll.toleranceValue ?? "-"}{" "}
                        {rll.toleranceOperator === "less than or equal to"
                          ? "≤"
                          : rll.toleranceOperator === "greater than or equal to"
                            ? "≥"
                            : "="}{" "}
                        {rll.toleranceTime ?? "1"} hr
                      </p> */}
                    </div>
                  </div>

                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: "4px" }}>
                    <table
                      className="w-full border-2 border-black text-sm print:text-[8px] compact-table"
                      style={{ fontSize: "10px", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: "0" }}
                    >
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th
                            rowSpan={2}
                            className="border border-black p-1 text-center font-bold"
                            style={{ width: "15%", padding: "0px 2px", fontSize: "10px" }}
                          >
                            Location
                          </th>
                          <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Exposure Level (mR/hr)
                          </th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Result (mR in 1 hr)
                          </th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Result (mGy in 1 hr)
                          </th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Remarks
                          </th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Left
                          </th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Right
                          </th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Front
                          </th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Back
                          </th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                            Top
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leakageMeasurements.map((row: any, i: number) => {
                          const maValue = parseFloat(String(rll.ma ?? (settings0 as any).ma ?? "0"));
                          const workloadValue = parseFloat(String(rll.workload ?? "0"));
                          const values = [row.left, row.right, row.front, row.back, row.top]
                            .map((v) => parseFloat(String(v)) || 0)
                            .filter((v) => v > 0);
                          const rowMax = values.length > 0 ? Math.max(...values) : 0;
                          let calculatedMR = "-";
                          let calculatedMGy = "-";
                          let remark = row.remark || "-";
                          if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                            const resMR = (workloadValue * rowMax) / (60 * maValue);
                            calculatedMR = resMR.toFixed(3);
                            calculatedMGy = (resMR / 114).toFixed(4);
                            if (remark === "-" || !remark) {
                              const tolVal = parseFloat(String(rll.toleranceValue)) || 1.0;
                              const resMGyNum = resMR / 114;
                              remark = resMGyNum <= tolVal ? "Pass" : "Fail";
                            }
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: "auto", minHeight: "0", lineHeight: "1.0", padding: "0", margin: "0" }}>
                              <td className="border border-black p-1 text-center font-medium" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {row.location || "-"}
                              </td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {row.left || "-"}
                              </td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {row.right || "-"}
                              </td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {row.front || "-"}
                              </td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {row.back || "-"}
                              </td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {row.top || "-"}
                              </td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {calculatedMR}
                              </td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                {calculatedMGy}
                              </td>
                              <td className="border border-black p-1 text-center" style={{ padding: "0px 2px", fontSize: "10px" }}>
                                <span
                                  className={
                                    remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""
                                  }
                                >
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {(() => {
                    const maValue = parseFloat(String(rll.ma ?? (settings0 as any).ma ?? "0"));
                    const workloadValue = parseFloat(String(rll.workload ?? "0"));
                    const getSummaryForLocation = (locName: string) => {
                      let row: any;
                      if (locName === "Tube Housing") {
                        row = leakageMeasurements.find((m: any) => {
                          const loc = String(m.location || "").trim();
                          const l = loc.toLowerCase();
                          return loc === "Tube Housing" || loc === "Tube" || (l.includes("tube") && !l.includes("collimator"));
                        });
                      } else if (locName === "Collimator") {
                        row = leakageMeasurements.find((m: any) => {
                          const loc = String(m.location || "").trim().toLowerCase();
                          return loc === "collimator" || loc.includes("collimator");
                        });
                      } else {
                        row = leakageMeasurements.find((m: any) => m.location === locName);
                      }
                      if (!row) return null;
                      const vals = [row.left, row.right, row.front, row.back, row.top]
                        .map((v) => parseFloat(String(v)) || 0)
                        .filter((v) => v > 0);
                      const rowMax = vals.length > 0 ? Math.max(...vals) : 0;
                      if (maValue <= 0 || workloadValue <= 0 || rowMax <= 0) return null;
                      const resMR = (workloadValue * rowMax) / (60 * maValue);
                      const resMGy = resMR / 114;
                      return { rowMax, resMR, resMGy };
                    };
                    const tubeSummary = getSummaryForLocation("Tube Housing");
                    const collimatorSummary = getSummaryForLocation("Collimator");
                    return (
                      <div className="space-y-4 print:space-y-1">
                        <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
                          <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
                          <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                            Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
                          </div>
                          <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                            Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 print:gap-1">
                          {tubeSummary && (
                            <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                              <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">Tube Housing Summary:</p>
                              <div className="text-[11px] print:text-[8px] space-y-1">
                                <p>
                                  Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong>
                                </p>
                                <p>
                                  Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) ={" "}
                                  <strong>{tubeSummary.resMR.toFixed(3)} mR</strong>
                                </p>
                                <p>
                                  In mGy: {tubeSummary.resMR.toFixed(3)} / 114 ={" "}
                                  <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy</span>
                                </p>
                              </div>
                            </div>
                          )}
                          {collimatorSummary && (
                            <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                              <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">Collimator Summary:</p>
                              <div className="text-[11px] print:text-[8px] space-y-1">
                                <p>
                                  Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong>
                                </p>
                                <p>
                                  Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) ={" "}
                                  <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong>
                                </p>
                                <p>
                                  In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 ={" "}
                                  <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy</span>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
                          <p className="text-[11px] print:text-[8px] leading-relaxed">
                            <strong>Note:</strong> The maximum leakage radiation from the X-ray tube housing and collimator, measured at a distance of 1 meter from the focus, averaged over an area of 100 cm², shall not exceed 1.0 mGy in one hour when the tube is operated at its maximum rated continuous filament current at the maximum rated tube potential.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* 10. Linearity of mAs Loading */}
            {showMasLinearity && testData.linearityOfMasLoading && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={10} title="Linearity of mAs Loading" />
                {testData.linearityOfMasLoading.table1 &&
                  (() => {
                    const t1 = Array.isArray(testData.linearityOfMasLoading.table1)
                      ? testData.linearityOfMasLoading.table1[0]
                      : testData.linearityOfMasLoading.table1;
                    if (!t1) return null;
                    return (
                      <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "10px" }}>Test Conditions:</p>
                        <table style={{ ...tableStyle, width: "100%" }}>
                          <thead>
                            <tr>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", padding: "1px 12px" })}>
                                FDD (cm)
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", padding: "1px 12px" })}>
                                kV
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 12px" })}>
                                {t1?.fcd || "-"}
                              </td>
                              <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 12px" })}>
                                {t1?.kv || "-"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                {testData.linearityOfMasLoading.table2?.length > 0 &&
                  (() => {
                    const rows = testData.linearityOfMasLoading.table2;
                    const tolVal = parseFloat(testData.linearityOfMasLoading.tolerance ?? "0.1") || 0.1;
                    const tolOp = testData.linearityOfMasLoading.toleranceOperator ?? "<";
                    const fmtV = (val: any) => {
                      if (val === undefined || val === null) return "-";
                      const s = String(val).trim();
                      return s === "" || s === "—" || s === "undefined" || s === "null" ? "-" : s;
                    };
                    const xValues: number[] = [];
                    const processedRows = rows.map((row: any) => {
                      const outputs = (row.measuredOutputs ?? [])
                        .map((v: any) => parseFloat(v))
                        .filter((v: number) => !isNaN(v) && v > 0);
                      const avg =
                        outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                      const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : "—";
                      const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? "");
                      const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                      const midMas = match ? (parseFloat(match[1]) + parseFloat(match[2])) / 2 : parseFloat(mAsLabel) || 0;
                      const x = avg !== null && midMas > 0 ? avg / midMas : null;
                      const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : "—";
                      if (x !== null) xValues.push(parseFloat(x.toFixed(4)));
                      return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                    });
                    const hasData = xValues.length > 0;
                    const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : "—";
                    const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : "—";
                    const colNum =
                      hasData && xMax !== "—" && xMin !== "—" && parseFloat(xMax) + parseFloat(xMin) > 0
                        ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                        : 0;
                    const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : "—";
                    let pass = false;
                    if (hasData && col !== "—") {
                      const cv = parseFloat(col);
                      switch (tolOp) {
                        case "<":
                          pass = cv < tolVal;
                          break;
                        case ">":
                          pass = cv > tolVal;
                          break;
                        case "<=":
                          pass = cv <= tolVal;
                          break;
                        case ">=":
                          pass = cv >= tolVal;
                          break;
                        default:
                          pass = cv <= tolVal;
                      }
                    }
                    const remarks = hasData && col !== "—" ? (pass ? "Pass" : "Fail") : "—";
                    const measHeaders = testData.linearityOfMasLoading.measHeaders || [];
                    return (
                      <div style={{ marginBottom: "4px" }}>
                        <table style={{ ...tableStyle, fontSize: "10px" }}>
                          <thead>
                            <tr>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                mAs Range
                              </th>
                              <th
                                colSpan={measHeaders.length}
                                style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}
                              >
                                Output (mGy)
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                Avg Output
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                X (mGy/mAs)
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                X MAX
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                X MIN
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                CoL
                              </th>
                              <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                                Remarks
                              </th>
                            </tr>
                            <tr>
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                              {measHeaders.map((h: string, idx: number) => (
                                <th
                                  key={idx}
                                  style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}
                                >
                                  {h || `Meas ${idx + 1}`}
                                </th>
                              ))}
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                              <th style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedRows.map((row: any, i: number) => (
                              <tr key={i}>
                                <td style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>
                                  {fmtV(row.mAsApplied ?? row.mAsRange)}
                                </td>
                                {measHeaders.map((_: string, idx: number) => (
                                  <td key={idx} style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>
                                    {fmtV(row.measuredOutputs?.[idx])}
                                  </td>
                                ))}
                                <td style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>
                                  {row._avgDisplay}
                                </td>
                                <td style={cellStyle({ border: "0.1px solid #666", fontSize: "10px" })}>
                                  {row._xDisplay}
                                </td>
                                {i === 0 ? (
                                  <>
                                    <td
                                      rowSpan={rows.length}
                                      style={cellStyle({
                                        border: "0.1px solid #666",
                                        fontSize: "10px",
                                        verticalAlign: "middle",
                                      })}
                                    >
                                      {xMax}
                                    </td>
                                    <td
                                      rowSpan={rows.length}
                                      style={cellStyle({
                                        border: "0.1px solid #666",
                                        fontSize: "10px",
                                        verticalAlign: "middle",
                                      })}
                                    >
                                      {xMin}
                                    </td>
                                    <td
                                      rowSpan={rows.length}
                                      style={cellStyle({
                                        border: "0.1px solid #666",
                                        fontSize: "10px",
                                        verticalAlign: "middle",
                                      })}
                                    >
                                      {col}
                                    </td>
                                    <td
                                      rowSpan={rows.length}
                                      style={cellStyle({
                                        border: "0.1px solid #666",
                                        fontSize: "10px",
                                        verticalAlign: "middle",
                                      })}
                                    >
                                      {remarks}
                                    </td>
                                  </>
                                ) : null}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p style={{ fontSize: "10px", marginTop: "2px" }}>
                          <strong>Tolerance (CoL):</strong> {testData.linearityOfMasLoading.toleranceOperator || "≤"}{" "}
                          {testData.linearityOfMasLoading.tolerance || "0.1"}
                        </p>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* 9. Linearity of mA Loading */}
            {showMaLinearity && testData.linearityOfMaLoading && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. Linearity of mA Loading</h3>
                {testData.linearityOfMaLoading.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA Applied</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.5)' }}>Average Output</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X (mGy/mA)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Max</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Min</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.linearityOfMaLoading.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mAsApplied || row.ma || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(191, 219, 254, 0.3)' }}>{row.average || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.x || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.xMax || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.xMin || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.col || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                              <span className={(row.remarks === "Pass" || row.remarks === "PASS") ? "text-green-600" : (row.remarks === "Fail" || row.remarks === "FAIL") ? "text-red-600" : ""}>
                                {row.remarks || "-"}
                              </span>
                            </td>
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
              <p className="text-center text-gray-500" style={{ marginTop: "32px", fontSize: "14px" }}>
                No detailed test results available for this report.
              </p>
            )}
          </div>
        </ReportPage>

        <ReportPage isLast>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
            <ReportPdfPageDeclaration
              todayDate={todayDate}
              customerCity={placeValue}
              qrCode={report.qrCode}
              engineerName={report.engineerNameRPId}
              authorizedSignatoryName={report.authorizedSignatoryName}
              authorizedSignatorySignature={report.authorizedSignatorySignature}
            />
          </div>
        </ReportPage>
      </div>

      <style>{`
        .fixed-report-pdf {
          font-family: "Times New Roman", Times, serif;
          color: #000;
          font-size: 11px;
          line-height: 1.3;
        }
        .fixed-report-pdf h1,
        .fixed-report-pdf h2,
        .fixed-report-pdf h3,
        .fixed-report-pdf h4 {
          font-family: "Times New Roman", Times, serif;
          font-weight: 700;
          color: #000;
        }
        .fixed-report-pdf table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          text-align: center !important;
          width: 100%;
        }
        .fixed-report-pdf td,
        .fixed-report-pdf th {
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          text-align: center !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          padding-left: 2px !important;
          padding-right: 2px !important;
          line-height: 1.1 !important;
        }
        .is-generating-pdf td,
        .is-generating-pdf th {
          padding-top: 4px !important;
          padding-bottom: 12px !important;
        }
        .fixed-report-pdf .report-pdf-page-shell,
        .fixed-report-pdf .report-pdf-last-page-shell {
          display: flex !important;
          flex-direction: column !important;
          min-height: 297mm !important;
          height: auto !important;
          box-sizing: border-box !important;
          background: white !important;
        }
        .fixed-report-pdf .report-pdf-last-main {
          flex: 1 1 auto !important;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          @page { margin: 0; size: A4; }
          .fixed-report-pdf { width: 210mm; margin: 0 auto; }
          .fixed-report-pdf .report-pdf-page-shell,
          .fixed-report-pdf .report-pdf-last-page-shell {
             margin: 0 !important;
             box-shadow: none !important;
             page-break-after: always !important;
          }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportCArm;