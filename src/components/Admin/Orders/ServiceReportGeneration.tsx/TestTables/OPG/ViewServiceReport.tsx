// src/components/reports/ViewServiceReportOPG.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDetails, getReportHeaderForOPG, getTools } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import MainTestTableForOPG from "./MainTestTableForOPG";

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
  city?: string;
  hospitalName?: string;
  fullAddress?: string;
  leadOwner?: any;
  manufacturerName?: string;
  leadOwnerType?: string;
  leadOwnerRole?: string;
  leadOwnerName?: string;
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
  // All OPG Tests
  AccuracyOfIrradiationTimeOPG?: any;
  AccuracyOfOperatingPotentialOPG?: any;
  OutputConsistencyForOPG?: any;
  LinearityOfMaLoadingOPG?: any;
  RadiationLeakageTestOPG?: any;
  RadiationProtectionSurveyOPG?: any;
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

const ViewServiceReportOPG: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});

  const firstNonEmptyString = (...values: any[]): string | undefined => {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      const text = String(value).trim();
      if (text && text.toLowerCase() !== "n/a" && text.toLowerCase() !== "na") return text;
    }
    return undefined;
  };

  const pickUlrFromObject = (obj: any): string | undefined => {
    if (!obj || typeof obj !== "object") return undefined;
    return firstNonEmptyString(
      obj.reportULRNumber,
      obj.reportUlrNumber,
      obj.ulrNumber,
      obj.ULRNumber,
      obj.ulrNo,
      obj.ULRNo,
      obj.ulr,
      obj.ULR,
      obj.qaTestReportULRNo
    );
  };

  const pickUlrFromQaTests = (qaTests: any): string | undefined => {
    if (!Array.isArray(qaTests)) return undefined;
    for (const test of qaTests) {
      const ulr = pickUlrFromObject(test);
      if (ulr) return ulr;
    }
    return undefined;
  };

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [response, detailsResponse, toolsRes] = await Promise.all([
          getReportHeaderForOPG(serviceId),
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
          const detailsData = detailsResponse?.data?.data || detailsResponse?.data || {};
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
          const resolvedUlr = firstNonEmptyString(
            pickUlrFromObject(data),
            pickUlrFromObject(detailsData),
            pickUlrFromQaTests(detailsData?.qaTests),
            "N/A"
          );

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
            reportULRNumber: resolvedUlr || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "OPG",
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
            toolsUsed: mergedTools,
            notes: data.notes || defaultNotes,
          });

          // Transform backend data structure to match ViewServiceReport expectations
          const transformOperatingPotential = (opData: any) => {
            if (!opData || typeof opData !== 'object') return null;
            // Skip if it's just an ObjectId string (not populated)
            if (typeof opData === 'string') return null;

            // Handle both cases: if measurements exists, use it; otherwise use rows if it exists
            const rows = opData.measurements || opData.rows || [];
            // Only return if we have actual data (rows or mAStations)
            if (!Array.isArray(rows) || rows.length === 0) {
              // Still return if mAStations exist (data might be structured differently)
              if (!Array.isArray(opData.mAStations) || opData.mAStations.length === 0) {
                return null;
              }
            }

            return {
              ...opData,
              rows: Array.isArray(rows) ? rows : [],
              mAStations: Array.isArray(opData.mAStations) ? opData.mAStations : [],
              toleranceSign:
                opData.tolerance?.sign ||
                opData.tolerance?.type ||
                opData.toleranceSign ||
                "±",
              toleranceValue:
                opData.tolerance?.value != null && opData.tolerance?.value !== ""
                  ? String(opData.tolerance.value)
                  : opData.toleranceValue != null && opData.toleranceValue !== ""
                    ? String(opData.toleranceValue)
                    : "2.0",
            };
          };

          const transformIrradiationTime = (itData: any) => {
            if (!itData || typeof itData !== 'object') return null;
            if (typeof itData === 'string') return null;
            const irradiationTimes = Array.isArray(itData.irradiationTimes) ? itData.irradiationTimes : (Array.isArray(itData.table2Rows) ? itData.table2Rows : []);
            if (!irradiationTimes || irradiationTimes.length === 0) return null;
            return {
              ...itData,
              irradiationTimes,
              testConditions: itData.testConditions || itData.table1Row || {},
              tolerance: itData.tolerance || { operator: "<=", value: "5" },
            };
          };

          const transformOutputConsistency = (ocData: any) => {
            if (!ocData || typeof ocData !== 'object') return null;
            if (typeof ocData === 'string') return null;
            const outputRows = Array.isArray(ocData.outputRows) ? ocData.outputRows :
              (Array.isArray(ocData.measurements) ? ocData.measurements : []);
            if (outputRows.length === 0) return null;
            const toleranceOperator = ocData.toleranceOperator || "<=";
            const toleranceValue = parseFloat(ocData.tolerance || "0.05");
            return {
              ...ocData,
              outputRows: outputRows.map((r: any) => ({
                ...r,
                kv: r.kv ?? r.kvp ?? "-",
                mas: r.mas ?? r.mAs ?? "-",
                remark: r.remark ?? r.remarks ?? "",
              })),
              measurementHeaders: Array.isArray(ocData.measurementHeaders) ? ocData.measurementHeaders : [],
              ffd: ocData.ffd || "",
              toleranceOperator,
              toleranceValue,
            };
          };

          const transformLinearity = (linData: any) => {
            if (!linData || typeof linData !== 'object') return null;
            if (typeof linData === 'string') return null;
            // Backend returns table2, but we normalize to table2Rows
            const table2Rows = Array.isArray(linData.table2Rows) ? linData.table2Rows : (Array.isArray(linData.table2) ? linData.table2 : []);
            if (table2Rows.length === 0) return null;
            return {
              ...linData,
              table2Rows,
              table1: linData.table1 || linData.exposureCondition || {},
            };
          };

          const transformRadiationLeakage = (rlData: any) => {
            if (!rlData || typeof rlData !== 'object') return null;
            if (typeof rlData === 'string') return null;

            // Transform API leakageMeasurements / leakageRows into normalized rows
            const sourceLeakageMeasurements = rlData.leakageMeasurements || rlData.leakageRows || [];
            const toleranceValue = parseFloat(rlData.toleranceValue || "1");
            const toleranceOperator = rlData.toleranceOperator || "<=";

            const leakageRows = Array.isArray(sourceLeakageMeasurements) ? sourceLeakageMeasurements.map((measurement: any) => {
              // Calculate max if not provided
              let maxValue = measurement.max;
              if (!maxValue || maxValue === "" || maxValue === "-") {
                const values = [
                  measurement.left,
                  measurement.right,
                  measurement.front || measurement.top,
                  measurement.back || measurement.up
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
                  const maxExposureLevelMR = (measurement.unit === 'mGy/h' || !measurement.unit) ? maxNum * 114 : maxNum;
                  const workloadVal = parseFloat(rlData.workload || "0");
                  const maVal = parseFloat(rlData.settings?.[0]?.ma || rlData.measurementSettings?.[0]?.ma || "1");

                  // Formula: (workload * maxExposureLevelMR) / (60 * maVal) / 114
                  const calculatedMGyResult = (workloadVal > 0 && maVal > 0) ? (workloadVal * maxExposureLevelMR) / (60 * maVal) / 114 : 0;

                  if (toleranceOperator === "<=" || toleranceOperator === "less than or equal to") {
                    remark = calculatedMGyResult <= toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === ">=" || toleranceOperator === "greater than or equal to") {
                    remark = calculatedMGyResult >= toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === "<" || toleranceOperator === "less than") {
                    remark = calculatedMGyResult < toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === ">" || toleranceOperator === "greater than") {
                    remark = calculatedMGyResult > toleranceValue ? "Pass" : "Fail";
                  } else if (toleranceOperator === "=" || toleranceOperator === "equal to") {
                    remark = Math.abs(calculatedMGyResult - toleranceValue) < 0.001 ? "Pass" : "Fail";
                  } else {
                    remark = "-";
                  }
                } else {
                  remark = "-";
                }
              }

              const fmt = (v: any) => {
                if (v === 0) return "0";
                if (v == null || v === "" || v === "-") return "-";
                return String(v);
              };
              return {
                location: measurement.location ?? "-",
                left: fmt(measurement.left),
                right: fmt(measurement.right),
                front: fmt(measurement.front ?? measurement.top),
                top: fmt(measurement.top),
                back: fmt(measurement.back ?? measurement.up),
                max: maxValue,
                unit: measurement.unit || "mGy/h",
                remark: remark,
              };
            }) : [];

            if (leakageRows.length === 0) return null;

            // Handle settings - could be array or single object
            let settingsArray = [];
            if (Array.isArray(rlData.settings) && rlData.settings.length > 0) {
              settingsArray = rlData.settings;
            } else if (Array.isArray(rlData.measurementSettings) && rlData.measurementSettings.length > 0) {
              settingsArray = rlData.measurementSettings.map((s: any) => ({
                ffd: s.ffd || s.fdd || "",
                kvp: s.kv || s.kvp || "",
                ma: s.ma || "",
                time: (s.time != null) ? String(s.time) : "",
              }));
            } else if (rlData.settings && typeof rlData.settings === 'object') {
              settingsArray = [rlData.settings];
            } else if (rlData.ffd || rlData.fdd || rlData.kvp || rlData.ma || rlData.time) {
              // Fallback: create settings array from top-level fields
              settingsArray = [{
                ffd: rlData.ffd || rlData.fdd || "",
                kvp: rlData.kvp || rlData.kv || "",
                ma: rlData.ma || "",
                time: rlData.time || "",
              }];
            }

            // Calculate overall max result if missing
            let maxLeakageResult = rlData.maxLeakageResult;
            let maxRadiationLeakage = rlData.maxRadiationLeakage;

            const hasResult = (val: any) => val != null && val !== "" && val !== "-";

            if (!hasResult(maxRadiationLeakage) && leakageRows.length > 0) {
              const workloadVal = parseFloat(rlData.workload);
              const maVal = parseFloat(settingsArray[0]?.ma);

              if (!isNaN(workloadVal) && !isNaN(maVal) && maVal > 0) {
                const maxRowMaxMR = Math.max(...leakageRows.map((r: any) => {
                  const val = parseFloat(r.max) || 0;
                  return r.unit === 'mGy/h' ? val * 114 : val;
                }));
                const resultMR = (workloadVal * maxRowMaxMR) / (60 * maVal);
                maxLeakageResult = resultMR.toFixed(3);
                maxRadiationLeakage = (resultMR / 114).toFixed(4);
              }
            }

            const s0 = settingsArray[0] || {};
            const leakageMeasurements = leakageRows.map((r: any) => ({
              location: r.location,
              left: r.left,
              right: r.right,
              front: r.front,
              back: r.back,
              top: r.top != null && r.top !== "" && r.top !== "-" ? r.top : "-",
              remark: r.remark,
            }));

            return {
              ...rlData,
              leakageRows,
              leakageMeasurements,
              settings: settingsArray,
              fcd: rlData.fcd || s0.fdd || s0.ffd || "",
              kv: s0.kvp || s0.kv || rlData.kv || rlData.kvp || "",
              ma: s0.ma || rlData.ma || "",
              time: s0.time != null ? String(s0.time) : rlData.time != null ? String(rlData.time) : "",
              workloadUnit: rlData.workloadUnit || "mA·min/week",
              toleranceValue: rlData.toleranceValue != null && rlData.toleranceValue !== "" ? String(rlData.toleranceValue) : "1",
              maxLeakageResult: hasResult(maxLeakageResult) ? String(maxLeakageResult) : "-",
              maxRadiationLeakage: hasResult(maxRadiationLeakage) ? String(maxRadiationLeakage) : "-",
              workload: rlData.workload != null ? String(rlData.workload) : "-",
            };
          };

          const transformRadiationSurvey = (rsData: any) => {
            if (!rsData || typeof rsData !== 'object') return null;
            if (typeof rsData === 'string') return null;
            const locations = Array.isArray(rsData.locations) ? rsData.locations : [];
            const hasMeta = !!(
              rsData.surveyDate ||
              rsData.hasValidCalibration ||
              rsData.appliedCurrent ||
              rsData.appliedVoltage ||
              rsData.exposureTime ||
              rsData.workload
            );
            if (locations.length === 0 && !hasMeta) return null;
            return {
              ...rsData,
              locations,
            };
          };

          const radiationProtectionSurvey = transformRadiationSurvey(data.RadiationProtectionSurveyOPG);

          setTestData({
            irradiationTime: transformIrradiationTime(data.AccuracyOfIrradiationTimeOPG),
            operatingPotential: transformOperatingPotential(data.AccuracyOfOperatingPotentialOPG),
            outputConsistency: transformOutputConsistency(data.OutputConsistencyForOPG),
            linearityOfMaLoading: transformLinearity(data.LinearityOfMaLoadingOPG),
            radiationLeakage: transformRadiationLeakage(data.RadiationLeakageTestOPG),
            radiationSurvey: radiationProtectionSurvey,
            radiationProtectionSurvey,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load OPG report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  const downloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    const btn = document.querySelector(".download-pdf-btn") as HTMLButtonElement;
    if (btn) {
      btn.textContent = "Generating PDF...";
      btn.disabled = true;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduced from 3 to 1.5 - still good quality but much smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        removeContainer: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("report-content");
          if (clonedElement) {
            clonedElement.style.width = '210mm';
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '20px';

            const nestedContainers = clonedElement.querySelectorAll<HTMLElement>('div');
            nestedContainers.forEach((div) => {
              if (div.style.maxWidth || div.classList.contains('max-w-5xl') || div.classList.contains('max-w-7xl')) {
                div.style.maxWidth = 'none';
                div.style.width = '100%';
              }
              if (div.classList.contains('p-8') || div.classList.contains('p-10')) {
                div.style.padding = '20px';
              }
            });

            const tables = clonedElement.querySelectorAll('table');
            tables.forEach((table: HTMLElement) => {
              table.style.breakInside = 'avoid';
              table.style.width = '100%';
              table.style.borderCollapse = 'collapse';
              table.style.tableLayout = 'auto';

              const cells = table.querySelectorAll<HTMLElement>('td, th');
              cells.forEach((cell) => {
                cell.style.breakInside = 'avoid';
                cell.style.wordWrap = 'break-word';
                cell.style.overflowWrap = 'break-word';
                cell.style.verticalAlign = 'top';
              });
            });

            const sections = clonedElement.querySelectorAll<HTMLElement>('section, div.mb-6, div.mb-8');
            sections.forEach((section) => {
              section.style.breakInside = 'avoid';
            });

            const buttons = clonedElement.querySelectorAll('button, .print\\:hidden');
            buttons.forEach((btn) => {
              (btn as HTMLElement).style.display = 'none';
            });
          }
        }
      });

      // Convert to JPEG with compression for much smaller file size
      const imgData = canvas.toDataURL("image/jpeg", 0.85); // JPEG at 85% quality - good balance
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`OPG-Report-${report?.testReportNumber || "report"}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      if (btn) {
        btn.textContent = "Download PDF";
        btn.disabled = false;
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading OPG Report...</div>;

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please save the OPG report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const toolsArray = report.toolsUsed || [];
  const notesArray = report.notes && report.notes.length > 0 ? report.notes : defaultNotes;
  const leadOwnerRole = String(
    report?.leadOwnerType ||
    report?.leadOwnerRole ||
    report?.leadOwner?.role ||
    report?.leadOwner?.leadOwnerType ||
    report?.leadOwner || ""
  ).trim().toLowerCase();
  const leadOwnerName = String(
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    report?.leadOwner || ""
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

  const radiationProtectionSurveyView = testData.radiationProtectionSurvey || testData.radiationSurvey;
  const nextDetailedSectionNumber = (() => {
    let sectionNumber = 1;
    return () => sectionNumber++;
  })();

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
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
            QA TEST REPORT FOR OPG
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: '9px' }}>
            (Periodic Quality Assurance shall be carried out at least once in five years as per AERB guidelines)
          </p>
          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {isManufacturerLeadOwner && (
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the customer</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{manufacturerDisplayName}</td>
                  </tr>
                )}
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testingSiteName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testingSiteAddress}</td>
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
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '10%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '10%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Model</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
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
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.make || "-"}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.model || "-"}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="text-center py-2 print:py-1" style={{ padding: '0px 1px', fontSize: '11px' }}>No tools recorded</td></tr>
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
            <MainTestTableForOPG testData={testData} />
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
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Accuracy of Irradiation Time</h3>
                {testData.irradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.irradiationTime.testConditions?.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.irradiationTime.testConditions?.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.irradiationTime.testConditions?.ma || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.irradiationTime.irradiationTimes.map((row: any, i: number) => {
                        const setTime = parseFloat(row.setTime);
                        const measuredTime = parseFloat(row.measuredTime);
                        const toleranceOperator = testData.irradiationTime.tolerance?.operator || "<=";
                        const toleranceValue = parseFloat(testData.irradiationTime.tolerance?.value || "5");

                        let deviation = "N/A";
                        let pass = false;

                        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
                          deviation = ((Math.abs(measuredTime - setTime) / setTime) * 100).toFixed(2);
                          const errorVal = parseFloat(deviation);
                          switch (toleranceOperator) {
                            case "<=": pass = errorVal <= toleranceValue; break;
                            case ">=": pass = errorVal >= toleranceValue; break;
                            case "<": pass = errorVal < toleranceValue; break;
                            case ">": pass = errorVal > toleranceValue; break;
                            default: pass = errorVal <= toleranceValue;
                          }
                        }

                        return (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{deviation !== "N/A" ? `${deviation}%` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Error {toleranceOperator} {toleranceValue}%</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}><span className={deviation !== "N/A" ? (pass ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : ""}>{deviation !== "N/A" ? (pass ? "PASS" : "FAIL") : "-"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {testData.irradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.irradiationTime.tolerance?.operator || "<="} {testData.irradiationTime.tolerance?.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Accuracy of Operating Potential and Total Filtration */}
            {(testData.operatingPotential?.rows?.length > 0 || testData.operatingPotential?.totalFiltration) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Accuracy of Operating Potential</h3>

                {testData.operatingPotential?.rows?.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Accuracy of Operating Potential (kVp)</h4>
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
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                              {row.measuredValues?.map((val: string, idx: number) => (
                                <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                              ))}
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}><span className={row.remarks === "Pass" || row.remarks === "PASS" ? "text-green-600 font-semibold" : row.remarks === "Fail" || row.remarks === "FAIL" ? "text-red-600 font-semibold" : ""}>{row.remarks || "-"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Tolerance (same pattern as RadiographyFixed totalFilteration kVp tolerance) */}
                    {(testData.operatingPotential.toleranceSign ||
                      testData.operatingPotential.toleranceValue ||
                      testData.operatingPotential.tolerance) && (
                      <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                          <strong>Tolerance:</strong>{" "}
                          {(testData.operatingPotential.toleranceSign ||
                            testData.operatingPotential.tolerance?.sign ||
                            testData.operatingPotential.tolerance?.type ||
                            "±")}{" "}
                          {(testData.operatingPotential.toleranceValue ||
                            testData.operatingPotential.tolerance?.value ||
                            "-")}{" "}
                          kVp
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Filtration Result */}
                {testData.operatingPotential?.totalFiltration && (() => {
                  const tf = testData.operatingPotential.totalFiltration;
                  const ft = testData.operatingPotential.filtrationTolerance || {};
                  const kvp = parseFloat(tf.atKvp ?? "");
                  const measured = parseFloat(tf.measured ?? "");
                  const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
                  const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");

                  let requiredTol = parseFloat(tf.required ?? "2.5");
                  if (!isNaN(kvp)) {
                    if (kvp < threshold1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                    else if (kvp >= threshold1 && kvp <= threshold2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                    else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                  }

                  const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                    ? (measured >= requiredTol ? "PASS" : "FAIL")
                    : "-";

                  return (
                    <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                      <h4 className="font-semibold mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>3.Total Filtration</h4>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>{tf.atKvp || "-"} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.measured || "-"} mm Al</td>
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
                  );
                })()}

              </div>
            )}

           
            {/* 4. Linearity of mA / mAs Loading */}
            {testData.linearityOfMaLoading?.table2Rows?.length > 0 && (() => {
              const linearityRows = testData.linearityOfMaLoading.table2Rows || [];
              const table1 = Array.isArray(testData.linearityOfMaLoading.table1)
                ? testData.linearityOfMaLoading.table1?.[0]
                : testData.linearityOfMaLoading.table1;
              const hasTime = table1?.time !== undefined && table1?.time !== null && String(table1?.time).trim() !== "";
              const hasMasShape = linearityRows.some((row: any) => row.mAsRange || row.mAsApplied);
              const linearityHeading = (!hasTime || hasMasShape)
                ? "Linearity of mAs Loading (Coefficient of Linearity)"
                : "Linearity of mA Loading (Coefficient of Linearity)";

              return (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. {linearityHeading}</h3>
                {(testData.linearityOfMaLoading.table1?.fcd != null || testData.linearityOfMaLoading.table1?.kv != null || testData.linearityOfMaLoading.table1?.time != null) && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>Time (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.linearityOfMaLoading.table1?.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.linearityOfMaLoading.table1?.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.linearityOfMaLoading.table1?.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.linearityOfMaLoading.table2Rows[0]?.ma ? "mA" : "mAs Range"}</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas 1</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas 2</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas 3</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Coefficient of Linearity</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMaLoading.table2Rows.map((row: any, i: number) => (
                        <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma || row.mAsRange || "-"}</td>
                          {row.measuredOutputs?.map((val: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.average || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.col || "-"}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}><span className={row.remarks === "Pass" || row.remarks === "PASS" ? "text-green-600 font-semibold" : row.remarks === "Fail" || row.remarks === "FAIL" ? "text-red-600 font-semibold" : ""}>{row.remarks || "-"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> Coefficient of Linearity ≤ {testData.linearityOfMaLoading.tolerance || "0.1"}
                  </p>
                </div>
              </div>
            )})()}

 {/* 3. Output Consistency */}
            {testData.outputConsistency?.outputRows?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Output Consistency</h3>
                {testData.outputConsistency.ffd != null && testData.outputConsistency.ffd !== "" && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0, maxWidth: '200px' }}>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.outputConsistency.ffd || "-"}</td>
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
                        <th colSpan={testData.outputConsistency.measurementHeaders?.length || testData.outputConsistency.outputRows[0]?.outputs?.length || 3} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Radiation Output mGy</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Avg. (X)</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Coefficient of Variation CoV</th>
                        <th rowSpan={2} className="border border-black p-2 print:p-1 text-center align-middle" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', verticalAlign: 'middle' }}>Remarks</th>
                      </tr>
                      <tr>
                        {(testData.outputConsistency.measurementHeaders ||
                          Array.from({ length: testData.outputConsistency.outputRows[0]?.outputs?.length || 3 }, (_, i) => i + 1)
                        ).map((h: string | number, idx: number) => (
                          <th key={idx} className="border border-black p-1 print:p-0.5 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{typeof h === 'number' ? h : idx + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testData.outputConsistency.outputRows.map((row: any, i: number) => {
                        const rawOutputs = Array.isArray(row.outputs) ? row.outputs : [];
                        const outputVals = rawOutputs.map((o: any) => (o && typeof o === 'object' && 'value' in o ? o.value : o));
                        const numCols = Math.max(outputVals.length, testData.outputConsistency.measurementHeaders?.length || 3);
                        return (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kv}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mas}</td>
                            {outputVals.map((val: any, idx: number) => (
                              <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val != null && val !== "" ? String(val) : "-"}</td>
                            ))}
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean ?? row.avg ?? "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {(() => {
                                const covVal = row.cov ?? row.cv;
                                if (covVal != null && covVal !== "") return covVal;

                                const values = outputVals
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
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {(() => {
                                const covRaw = row.cov ?? row.cv;
                                const covNum = covRaw != null && covRaw !== "" ? parseFloat(String(covRaw)) : NaN;
                                const tolNum = parseFloat(String(testData.outputConsistency.toleranceValue ?? testData.outputConsistency.tolerance ?? "0.05"));
                                const op = testData.outputConsistency.toleranceOperator || "<=";
                                let computedRemark = row.remark;
                                if ((!computedRemark || computedRemark === "-") && !Number.isNaN(covNum) && !Number.isNaN(tolNum)) {
                                  switch (op) {
                                    case "<":
                                      computedRemark = covNum < tolNum ? "Pass" : "Fail";
                                      break;
                                    case ">":
                                      computedRemark = covNum > tolNum ? "Pass" : "Fail";
                                      break;
                                    case ">=":
                                      computedRemark = covNum >= tolNum ? "Pass" : "Fail";
                                      break;
                                    case "=":
                                      computedRemark = Math.abs(covNum - tolNum) < 0.0001 ? "Pass" : "Fail";
                                      break;
                                    case "<=":
                                    default:
                                      computedRemark = covNum <= tolNum ? "Pass" : "Fail";
                                  }
                                }

                                return (
                                  <span className={computedRemark === "Pass" || computedRemark === "PASS" ? "text-green-600 font-semibold" : computedRemark === "Fail" || computedRemark === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                    {computedRemark || "-"}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.toleranceOperator || "<="} {typeof testData.outputConsistency.tolerance === 'object' ? (testData.outputConsistency.tolerance?.value ?? "0.05") : (testData.outputConsistency.tolerance || "0.05")}
                  </p>
                </div>
              </div>
            )}


            {/* 6. Tube Housing Leakage — layout aligned with RadiographyFixed ViewServiceReport */}
            {testData.radiationLeakage && (testData.radiationLeakage.leakageMeasurements?.length > 0 || testData.radiationLeakage.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                <h3 className="text-xl font-bold mb-2 print:text-sm" style={{ fontSize: "12px" }}>{nextDetailedSectionNumber()}. Tube Housing Leakage</h3>
                <div style={{ marginBottom: "4px" }}>
                  <table style={{ ...tableStyle, width: "100%" }} className="compact-table">
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
                          {testData.radiationLeakage.fcd || testData.radiationLeakage.settings?.[0]?.ffd || testData.radiationLeakage.settings?.[0]?.fdd || "100"}
                        </td>
                        <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                          {testData.radiationLeakage.kv || testData.radiationLeakage.settings?.[0]?.kvp || testData.radiationLeakage.settings?.[0]?.kv || "-"}
                        </td>
                        <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                          {testData.radiationLeakage.ma || testData.radiationLeakage.settings?.[0]?.ma || "-"}
                        </td>
                        <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                          {testData.radiationLeakage.time || testData.radiationLeakage.settings?.[0]?.time || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: "10px", marginBottom: "4px" }}>
                  <strong>Workload:</strong> {testData.radiationLeakage.workload || "-"} {testData.radiationLeakage.workloadUnit || "mA·min/week"}
                </p>
                {testData.radiationLeakage.leakageMeasurements?.length > 0 && (
                  <table style={{ ...tableStyle, fontSize: "10px" }} className="compact-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px", width: "15%", verticalAlign: "middle" })}>
                          Location
                        </th>
                        <th colSpan={5} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px" })}>
                          Exposure Level (mR/hr)
                        </th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px", verticalAlign: "middle" })}>
                          Result (mR in 1 hr)
                        </th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px", verticalAlign: "middle" })}>
                          Result (mGy in 1 hr)
                        </th>
                        <th rowSpan={2} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", fontSize: "10px", verticalAlign: "middle" })}>
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
                      {testData.radiationLeakage.leakageMeasurements.map((row: any, i: number) => {
                        const maValue = parseFloat(testData.radiationLeakage.ma || testData.radiationLeakage.settings?.[0]?.ma || "0");
                        const workloadValue = parseFloat(testData.radiationLeakage.workload || "0");
                        const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                        const rowMax = values.length > 0 ? Math.max(...values) : 0;
                        let calcMR = "-",
                          calcMGy = "-",
                          remark = row.remark || "-";
                        if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                          const resMR = (workloadValue * rowMax) / (60 * maValue);
                          calcMR = resMR.toFixed(3);
                          calcMGy = (resMR / 114).toFixed(4);
                          if (remark === "-" || !remark) {
                            remark = resMR / 114 <= (parseFloat(testData.radiationLeakage.toleranceValue) || 1.0) ? "Pass" : "Fail";
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
                  const rll = testData.radiationLeakage;
                  const maValue = parseFloat(rll.ma || rll.settings?.[0]?.ma || "0");
                  const workloadValue = parseFloat(rll.workload || "0");
                  const getSummary = (locName: string) => {
                    const row = rll.leakageMeasurements?.find((m: any) => m.location === locName);
                    if (!row) return null;
                    const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                    const rowMax = values.length > 0 ? Math.max(...values) : 0;
                    const resMR = (workloadValue * rowMax) / (60 * maValue);
                    return { rowMax, resMR, resMGy: resMR / 114 };
                  };
                  const tubeSummary = getSummary("Tube Housing");
                  const collimatorSummary = getSummary("Collimator");
                  return (
                    <div style={{ marginTop: "6px" }}>
                      <div style={{ border: "1px solid #888", padding: "4px 8px", marginBottom: "4px", background: "#fafafa" }}>
                        <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>Calculation Formula:</p>
                        <p style={{ fontSize: "10px", textAlign: "center", fontFamily: "monospace", border: "1px dashed #999", padding: "2px" }}>
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
                              Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong>
                            </p>
                            <p>
                              In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <strong>{tubeSummary.resMGy.toFixed(4)} mGy</strong>
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
                              Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong>
                            </p>
                            <p>
                              In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <strong>{collimatorSummary.resMGy.toFixed(4)} mGy</strong>
                            </p>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: "10px", marginTop: "4px", border: "0.1px solid #666", padding: "2px 6px" }}>
                        <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be &lt;{" "}
                        <strong>
                          {rll.toleranceValue || "1"} mGy ({parseFloat(rll.toleranceValue || "1") * 114} mR) in one hour.
                        </strong>
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 7. Details of Radiation Protection Survey — layout aligned with RadiographyFixed ViewServiceReport */}
            {radiationProtectionSurveyView && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: "8px" }}>
                <h3 className="text-xl font-bold mb-2 print:text-sm" style={{ fontSize: "12px" }}>
                  {nextDetailedSectionNumber()}. Details of Radiation Protection Survey
                </h3>
                {(radiationProtectionSurveyView.surveyDate || radiationProtectionSurveyView.hasValidCalibration) && (
                  <div style={{ marginBottom: "4px" }}>
                    <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>1. Survey Details</p>
                    <table style={tableStyle} className="compact-table">
                      <tbody>
                        <tr>
                          <th scope="row" style={cellStyle({ width: "60%", border: "0.1px solid #666", padding: "2px 6px", fontWeight: 700 })}>
                            Date of Radiation Protection Survey
                          </th>
                          <td style={cellStyle({ border: "0.1px solid #666" })}>
                            {radiationProtectionSurveyView.surveyDate ? formatDate(radiationProtectionSurveyView.surveyDate) : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={cellStyle({ border: "0.1px solid #666", padding: "2px 6px", fontWeight: 700 })}>
                            Whether Radiation Survey Meter used has Valid Calibration Certificate
                          </th>
                          <td style={cellStyle({ border: "0.1px solid #666" })}>{radiationProtectionSurveyView.hasValidCalibration || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {(radiationProtectionSurveyView.appliedCurrent || radiationProtectionSurveyView.appliedVoltage) && (
                  <div style={{ marginBottom: "4px" }}>
                    <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>2. Equipment Setting</p>
                    <table style={tableStyle} className="compact-table">
                      <tbody>
                        {[
                          ["Applied Current (mA)", radiationProtectionSurveyView.appliedCurrent],
                          ["Applied Voltage (kV)", radiationProtectionSurveyView.appliedVoltage],
                          ["Exposure Time(s)", radiationProtectionSurveyView.exposureTime],
                          ["Workload (mA min/week)", radiationProtectionSurveyView.workload],
                        ].map(([label, val]) => (
                          <tr key={String(label)}>
                            <th scope="row" style={cellStyle({ width: "50%", border: "0.1px solid #666", padding: "2px 6px", fontWeight: 700 })}>
                              {label}
                            </th>
                            <td style={cellStyle({ border: "0.1px solid #666" })}>{(val as any) || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {radiationProtectionSurveyView.locations?.length > 0 && (
                  <div style={{ marginBottom: "4px" }}>
                    <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>
                      3. Measured Maximum Radiation Levels (mR/hr) at different Locations
                    </p>
                    <table style={tableStyle} className="compact-table">
                      <thead>
                        <tr>
                          {["Location", "Max. Radiation Level", "Result", "Remarks"].map((h) => (
                            <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {radiationProtectionSurveyView.locations.map((loc: any, i: number) => (
                          <tr key={i}>
                            <td style={cellStyle({ border: "0.1px solid #666", padding: "2px 6px", textAlign: "left" })}>{loc.location || "-"}</td>
                            <td style={cellStyle({ border: "0.1px solid #666" })}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td style={cellStyle({ border: "0.1px solid #666" })}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td style={cellStyle({ border: "0.1px solid #666" })}>{loc.result || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ marginBottom: "4px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>4. Calculation Formula</p>
                  <table style={tableStyle} className="compact-table">
                    <tbody>
                      <tr>
                        <td style={cellStyle({ border: "0.1px solid #666", padding: "2px 6px", textAlign: "left" })}>
                          Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {radiationProtectionSurveyView.locations?.length > 0 &&
                  (() => {
                    const workerLocs = radiationProtectionSurveyView.locations.filter((loc: any) => loc.category === "worker");
                    const publicLocs = radiationProtectionSurveyView.locations.filter((loc: any) => loc.category === "public");
                    const maxWorkerLoc = workerLocs.reduce(
                      (max: any, loc: any) => ((parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max.mRPerWeek) || 0) ? loc : max),
                      workerLocs[0] || { mRPerHr: "", location: "" }
                    );
                    const maxPublicLoc = publicLocs.reduce(
                      (max: any, loc: any) => ((parseFloat(loc.mRPerWeek) || 0) > (parseFloat(max.mRPerWeek) || 0) ? loc : max),
                      publicLocs[0] || { mRPerHr: "", location: "" }
                    );
                    const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                    const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                    const workerResult = parseFloat(maxWorkerWeekly) > 0 ? (parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : "Fail") : "";
                    const publicResult = parseFloat(maxPublicWeekly) > 0 ? (parseFloat(maxPublicWeekly) <= 2 ? "Pass" : "Fail") : "";
                    return (
                      <div style={{ marginBottom: "4px" }}>
                        <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>5. Summary of Maximum Radiation Level/week (mR/wk)</p>
                        <table style={tableStyle} className="compact-table">
                          <thead>
                            <tr>
                              {["Category", "Result", "Remarks"].map((h) => (
                                <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <th scope="row" style={cellStyle({ border: "0.1px solid #666", fontWeight: 700 })}>
                                For Radiation Worker
                              </th>
                              <td style={cellStyle({ border: "0.1px solid #666" })}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td style={cellStyle({ border: "0.1px solid #666" })}>{workerResult || "-"}</td>
                            </tr>
                            <tr>
                              <th scope="row" style={cellStyle({ border: "0.1px solid #666", fontWeight: 700 })}>
                                For Public
                              </th>
                              <td style={cellStyle({ border: "0.1px solid #666" })}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td style={cellStyle({ border: "0.1px solid #666" })}>{publicResult || "-"}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: "4px", fontSize: "10px" }}>
                          {maxWorkerLoc.mRPerHr && parseFloat(maxWorkerLoc.mRPerHr) > 0 && (
                            <div style={{ border: "1px solid #ccc", padding: "3px 6px", marginBottom: "3px" }}>
                              <p style={{ fontWeight: "bold" }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                              <p>
                                <strong>Location:</strong> {maxWorkerLoc.location}
                              </p>
                              <p>
                                <strong>Formula:</strong> ({radiationProtectionSurveyView.workload || "—"} × {maxWorkerLoc.mRPerHr || "—"}) / (60 ×{" "}
                                {radiationProtectionSurveyView.appliedCurrent || "—"}) = {maxWorkerWeekly} mR/week
                              </p>
                            </div>
                          )}
                          {maxPublicLoc.mRPerHr && parseFloat(maxPublicLoc.mRPerHr) > 0 && (
                            <div style={{ border: "1px solid #ccc", padding: "3px 6px", marginBottom: "3px" }}>
                              <p style={{ fontWeight: "bold" }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                              <p>
                                <strong>Location:</strong> {maxPublicLoc.location}
                              </p>
                              <p>
                                <strong>Formula:</strong> ({radiationProtectionSurveyView.workload || "—"} × {maxPublicLoc.mRPerHr || "—"}) / (60 ×{" "}
                                {radiationProtectionSurveyView.appliedCurrent || "—"}) = {maxPublicWeekly} mR/week
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                <div style={{ marginBottom: "4px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px" }}>6. Permissible Limit</p>
                  <table style={tableStyle} className="compact-table">
                    <tbody>
                      <tr>
                        <th scope="row" style={cellStyle({ width: "50%", border: "0.1px solid #666", padding: "2px 6px", fontWeight: 700 })}>
                          For location of Radiation Worker
                        </th>
                        <td style={cellStyle({ border: "0.1px solid #666" })}>20 mSv in a year (40 mR/week)</td>
                      </tr>
                      <tr>
                        <th scope="row" style={cellStyle({ border: "0.1px solid #666", padding: "2px 6px", fontWeight: 700 })}>
                          For Location of Member of Public
                        </th>
                        <td style={cellStyle({ border: "0.1px solid #666" })}>1 mSv in a year (2mR/week)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No data fallback */}
            {
              Object.values(testData).every(v => !v) && (
                <p className="text-center text-xl text-gray-500 mt-32">
                  No test results available yet.
                </p>
              )
            }
          </div >
        </div >
      </div >

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .print\\:break-before-page { page-break-before: always; }
          @page { margin: 1cm; size: A4; }
          table, tr, td, th { page-break-inside: avoid; }
          h1,h2,h3 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportOPG;
