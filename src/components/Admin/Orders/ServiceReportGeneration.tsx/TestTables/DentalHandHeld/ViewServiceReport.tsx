// src/components/reports/ViewServiceReportDentalHandHeld.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeaderForDentalHandHeld,
  getDetails,
  getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld,
  getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld,
  getLinearityOfTimeByServiceIdForDentalHandHeld,
  getLinearityOfMaLoadingByServiceIdForDentalHandHeld,
  getLinearityOfMasLoadingByServiceIdForDentalHandHeld,
  getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld,
  getTubeHousingLeakageByServiceIdForDentalHandHeld,
  getRadiationProtectionSurveyByServiceIdForDentalHandHeld,
  getTools
} from "../../../../../../api";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForDentalHandHeld from "./MainTestTableForDentalHandHeld";
import { ReportPdfPageHeader } from "../RadiographyFixed/component/Header";
import { ReportPdfPageFooter } from "../RadiographyFixed/component/Footer";
import { ReportPdfPageFooterEnd } from "../RadiographyFixed/component/FooterEnd";
import { ReportPdfPageNoteQR } from "../RadiographyFixed/component/NoteQR";
import { ReportPdfPageDeclaration } from "../RadiographyFixed/component/Declaration";

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

const ViewServiceReportDentalHandHeld: React.FC = () => {
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

        // Fetch report header + service details
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeaderForDentalHandHeld(serviceId),
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
          const unwrap = (res: any) => {
            if (!res) return null;
            return res.data?.data ?? res.data ?? res ?? null;
          };
          const pick = (...vals: any[]) => vals.find((v) => v != null) ?? null;
          const normalizeOperatingPotential = (d: any) => {
            if (!d) return null;
            const mappedRows = Array.isArray(d.rows)
              ? d.rows.map((r: any) => {
                const measuredFromStations = Array.isArray(r?.maStations)
                  ? r.maStations.map((m: any) => m?.kvp ?? m?.kVp ?? m?.value ?? "")
                  : [];
                return {
                  ...r,
                  appliedKvp: r?.appliedKvp ?? r?.kvp ?? r?.kVp ?? "",
                  measuredValues: Array.isArray(r?.measuredValues) && r.measuredValues.length > 0
                    ? r.measuredValues
                    : measuredFromStations,
                  averageKvp: r?.averageKvp ?? r?.avgKvp ?? "",
                  remarks: r?.remarks ?? r?.remark ?? "-",
                };
              })
              : [];
            const derivedCount = mappedRows.reduce(
              (m: number, r: any) => Math.max(m, Array.isArray(r?.measuredValues) ? r.measuredValues.length : 0),
              0
            );
            const headers =
              (Array.isArray(d.mAStations) && d.mAStations.length > 0
                ? d.mAStations
                : Array.from({ length: derivedCount }, (_, i) => `mA ${i + 1}`));
            return {
              ...d,
              measurements: d.measurements || mappedRows,
              mAStations: headers,
              kvpToleranceSign: d.kvpToleranceSign ?? d.tolerance?.type ?? "±",
              kvpToleranceValue: d.kvpToleranceValue ?? d.tolerance?.value ?? "2.0",
              tolerance: {
                type: d.kvpToleranceSign ?? d.tolerance?.type ?? "±",
                value: d.kvpToleranceValue ?? d.tolerance?.value ?? "2.0",
              },
            };
          };
          const normalizeIrradiationTime = (d: any) => {
            if (!d) return null;
            const mappedFromRows = Array.isArray(d.rows)
              ? d.rows.map((r: any) => ({
                setTime: r?.setTime ?? r?.set_time ?? "",
                measuredTime:
                  r?.measuredTime ??
                  r?.measured_time ??
                  r?.maStations?.[0]?.time ??
                  r?.mAStations?.[0]?.time ??
                  "",
                remark: r?.remark ?? r?.remarks ?? "",
              }))
              : [];
            return {
              ...d,
              irradiationTimes: d.irradiationTimes || d.table2 || mappedFromRows,
              testConditions: {
                fcd: d?.testConditions?.fcd ?? d?.ffd ?? d?.fcd ?? d?.rows?.[0]?.fcd ?? "",
                kv: d?.testConditions?.kv ?? d?.rows?.[0]?.appliedKvp ?? d?.rows?.[0]?.kv ?? "",
                ma: d?.testConditions?.ma ?? d?.mAStations?.[0] ?? d?.rows?.[0]?.maStations?.[0]?.ma ?? "",
              },
              tolerance: {
                operator: d?.timeToleranceSign ?? d?.tolerance?.operator ?? "<=",
                value: d?.timeToleranceValue ?? d?.tolerance?.value ?? "10",
              }
            };
          };
          const normalizeLinearity = (d: any) => {
            if (!d) return null;
            const table2 = (d.table2 || d.table2Rows || []).map((r: any) => {
              const maVal = r.mAsRange ?? r.mas ?? r.ma ?? r.mAsApplied ?? "";
              return {
                ...r,
                mAsRange: maVal,
                ma: r.ma ?? maVal,
                mas: r.mas ?? maVal,
                measuredOutputs: Array.isArray(r.measuredOutputs) ? r.measuredOutputs : [],
                average: r.average ?? r.avg ?? "",
                x: r.x ?? "",
                xMax: r.xMax ?? "",
                xMin: r.xMin ?? "",
                col: r.col ?? r.colValue ?? "",
                remarks: r.remarks ?? r.remark ?? "",
              };
            });
            return {
              ...d,
              table2,
              measHeaders: Array.isArray(d.measHeaders) ? d.measHeaders : [],
            };
          };
          const normalizeConsistency = (d: any) => {
            if (!d) return null;
            const rows = d.outputRows || d.rows || [];
            const mappedRows = rows.map((r: any) => {
              const kv = r.kv || r.kvp || '';
              const mean = r.mean || r.avg || '';
              const cov = r.cov || r.cv || '';
              const remark = r.remark || r.remarks || '';
              return {
                ...r,
                kv,
                kvp: kv,
                mas: r.mas || '',
                outputs: r.outputs || [],
                mean,
                avg: mean,
                cov,
                cv: cov,
                remark,
                remarks: remark,
              };
            });
            const headers =
              (Array.isArray(d.measurementHeaders) && d.measurementHeaders.length > 0
                ? d.measurementHeaders
                : Array.isArray(d.measHeaders) && d.measHeaders.length > 0
                  ? d.measHeaders
                  : []);
            return { ...d, outputRows: mappedRows, measurementHeaders: headers };
          };
          const normalizeLeakage = (d: any) => {
            if (!d) return null;
            // Support both direct fields and nested rows
            const measurements = d.leakageMeasurements || d.leakageRows || [];
            const settingsObj = d.measurementSettings?.[0] || d.measurementSettings || d.settings?.[0] || d.settings || {};
            const normalizedSettings = {
              fcd: settingsObj.fcd || settingsObj.distance || d.fcd || d.distance || "",
              kv: settingsObj.kv || settingsObj.kvp || d.kv || d.kvp || "",
              ma: settingsObj.ma || settingsObj.mA || d.ma || d.mA || "",
              time:
                settingsObj.time ||
                settingsObj.Time ||
                settingsObj.timeSec ||
                settingsObj.timeInSec ||
                settingsObj.exposureTime ||
                d.time ||
                d.Time ||
                d.timeSec ||
                d.timeInSec ||
                d.exposureTime ||
                "",
            };

            return {
              ...d,
              leakageMeasurements: measurements,
              // Keep a predictable shape for render section
              measurementSettings: normalizedSettings,
              fcd: normalizedSettings.fcd,
              kv: normalizedSettings.kv,
              ma: normalizedSettings.ma,
              time: normalizedSettings.time,
              workload: d.workload?.value || d.workload || "",
              workloadUnit: d.workload?.unit || d.workloadUnit || "mA·min/week",
              toleranceValue: d.tolerance?.value || d.toleranceValue || "1",
              toleranceOperator: d.tolerance?.operator || d.toleranceOperator || "less than or equal to",
              toleranceTime: d.tolerance?.time || d.toleranceTime || "1",
              calculatedResult: d.calculatedResult || {}
            };
          };
          const normalizeRadiationProtection = (d: any) => {
            if (!d) return null;
            return {
              ...d,
              locations: d.locations || [],
              appliedCurrent: d.appliedCurrent || "100",
              appliedVoltage: d.appliedVoltage || "80",
              exposureTime: d.exposureTime || "0.5",
              workload: d.workload || "5000"
            };
          };
          const normalizeTotalFilteration = (d: any) => {
            if (!d) return null;
            // Always return data if it exists; provide defaults for missing sub-objects
            return {
              ...d,
              totalFiltration: d.totalFiltration ?? {},
              filtrationTolerance: d.filtrationTolerance ?? {
                forKvGreaterThan70: "1.5",
                forKvBetween70And100: "2.0",
                forKvGreaterThan100: "2.5",
                kvThreshold1: "70",
                kvThreshold2: "100",
              },
            };
          };
          setReport({
            ...data,
            city: data.city || detailsData?.city || "",
            hospitalName: data.hospitalName || detailsData?.hospitalName || cachedOrderBySrf?.hospitalName || "",
            fullAddress: data.fullAddress || detailsData?.fullAddress || cachedOrderBySrf?.fullAddress || "",
            leadOwner: data.leadOwner || data.leadowner || detailsLeadOwner || "",
            manufacturerName: data.manufacturerName || detailsData?.manufacturerName || cachedOrderBySrf?.manufacturerName || "",
            leadOwnerType: data.leadOwnerType || data.leadownerType || detailsLeadOwnerRole || "",
            leadOwnerRole: data.leadOwnerRole || data.leadownerRole || detailsLeadOwnerRole || "",
            leadOwnerName: data.leadOwnerName || detailsLeadOwnerName || "",
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

          // Fetch all test data separately
          const [
            accuracyPotential,
            accuracyTime,
            linearityTime,
            linearityMa,
            linearityMas,
            consistency,
            leakageTest,
            radiationProtection
          ] = await Promise.allSettled([
            getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld(serviceId),
            getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfTimeByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfMaLoadingByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfMasLoadingByServiceIdForDentalHandHeld(serviceId),
            getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld(serviceId),
            getTubeHousingLeakageByServiceIdForDentalHandHeld(serviceId),
            getRadiationProtectionSurveyByServiceIdForDentalHandHeld(serviceId)
          ]);

          const accuracyPotentialData = accuracyPotential.status === 'fulfilled' ? unwrap(accuracyPotential.value) : null;
          const accuracyTimeData = accuracyTime.status === 'fulfilled' ? unwrap(accuracyTime.value) : null;
          const linearityTimeData = linearityTime.status === 'fulfilled' ? unwrap(linearityTime.value) : null;
          const linearityMaData = linearityMa.status === 'fulfilled' ? unwrap(linearityMa.value) : null;
          const linearityMasData = linearityMas.status === 'fulfilled' ? unwrap(linearityMas.value) : null;
          const consistencyData = consistency.status === 'fulfilled' ? unwrap(consistency.value) : null;
          const leakageData = leakageTest.status === 'fulfilled' ? unwrap(leakageTest.value) : null;
          const radiationProtectionData = radiationProtection.status === 'fulfilled' ? unwrap(radiationProtection.value) : null;

          const headerCombined = data.AccuracyOfOperatingPotentialAndTimeDentalHandHeld || null;

          const masNormalized = normalizeLinearity(pick(linearityMasData, data.LinearityOfmAsLoadingDentalHandHeld));
          const maNormalized = normalizeLinearity(pick(linearityMaData, data.LinearityOfMaLoadingDentalHandHeld));
          const timeNormalized = normalizeLinearity(pick(linearityTimeData, data.LinearityOfTimeDentalHandHeld));
          const irrNormalized = normalizeIrradiationTime(pick(accuracyTimeData, headerCombined));

          const hasMasRows = !!(
            masNormalized &&
            Array.isArray(masNormalized.table2) &&
            masNormalized.table2.length > 0
          );
          const hasMaRows = !!(
            maNormalized &&
            Array.isArray(maNormalized.table2) &&
            maNormalized.table2.length > 0
          );
          const hasRealIrradiationRows = !!(
            irrNormalized &&
            Array.isArray(irrNormalized.irradiationTimes) &&
            irrNormalized.irradiationTimes.some(
              (r: any) =>
                String(r?.setTime ?? "").trim() !== "" ||
                String(r?.measuredTime ?? "").trim() !== ""
            )
          );

          // No-timer mode: mAs loading present and no dedicated timer-mode tests
          const isNoTimerMode = hasMasRows && !hasMaRows && !hasRealIrradiationRows;

          setTestData({
            accuracyOfOperatingPotential: normalizeOperatingPotential(pick(accuracyPotentialData, headerCombined)),
            accuracyOfIrradiationTime: isNoTimerMode ? null : (hasRealIrradiationRows ? irrNormalized : null),
            linearityOfTime: isNoTimerMode ? null : timeNormalized,
            linearityOfmALoading: isNoTimerMode ? null : maNormalized,
            linearityOfMasLoading: masNormalized,
            consistencyOfRadiationOutput: normalizeConsistency(pick(
              consistencyData,
              data.ConsistencyOfRadiationOutputDentalHandHeld,
              data.ReproducibilityOfRadiationOutputDentalHandHeld
            )),
            tubeHousingLeakage: normalizeLeakage(pick(leakageData, data.TubeHousingLeakageDentalHandHeld)),
            radiationProtectionSurvey: normalizeRadiationProtection(
              pick(radiationProtectionData, data.RadiationProtectionSurveyDentalHandHeld)
            ),
            totalFilteration: normalizeTotalFilteration(
              // Prefer accuracyPotentialData which contains totalFiltration + filtrationTolerance
              pick(
                accuracyPotentialData,
                headerCombined,
                data.TotalFilterationDentalHandHeld,
                data.totalFilterationDentalHandHeld,
                data.totalFilteration
              )
            ),
            _isNoTimerMode: isNoTimerMode,
          });
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

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));
  const displayValue = (v: any) => {
    if (v == null || v === "") return "-";
    if (typeof v === "object" && "value" in v) {
      const inner = (v as any).value;
      return inner == null || inner === "" ? "-" : String(inner);
    }
    return String(v);
  };
  const formatToleranceOperatorSymbol = (operator: any, fallback = "≤") => {
    const raw = String(operator ?? "").trim();
    if (!raw) return fallback;
    const lower = raw.toLowerCase();
    if (lower === "<=" || lower === "≤" || lower === "lte" || lower === "less than or equal to") return "≤";
    if (lower === "<" || lower === "lt" || lower === "less than") return "<";
    if (lower === ">=" || lower === "≥" || lower === "gte" || lower === "greater than or equal to") return "≥";
    if (lower === ">" || lower === "gt" || lower === "greater than") return ">";
    if (lower === "=" || lower === "==" || lower === "eq" || lower === "equal to") return "=";
    if (raw === "+" || raw === "-" || raw === "±") return raw;
    return raw;
  };
  const normalizeToleranceValue = (tol: any, fallback = "-") => {
    if (tol == null || tol === "") return fallback;
    if (typeof tol === "object") {
      const v = "value" in tol ? (tol as any).value : null;
      return v != null && v !== "" ? String(v) : fallback;
    }
    return String(tol);
  };
  const normalizeToleranceOperator = (tol: any, fallback = "≤") => {
    if (tol == null || tol === "") return fallback;
    if (typeof tol === "object") {
      const op = "operator" in tol ? (tol as any).operator : null;
      if (op != null && op !== "") return formatToleranceOperatorSymbol(op, fallback);
      return fallback;
    }
    return formatToleranceOperatorSymbol(tol, fallback);
  };

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `DentalHandHeld-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Loading Report...</div>;
  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please generate and save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg">
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
  const extractCity = (value?: string) => {
    if (!value) return "";
    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "";
  };
  const customerCity = report?.city || extractCity(report?.address);
  const placeValue = customerCity || report?.location || "Noida";

  const ReportPage: React.FC<{ children: React.ReactNode; isLast?: boolean; className?: string }> = ({
    children,
    isLast = false,
    className = "",
  }) => (
    <div
      className={`bg-white shadow-2xl print:shadow-none ${isLast ? "report-pdf-last-page-shell" : "report-pdf-page-shell"} ${className}`}
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
  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="font-bold mb-1 text-[12px]">
      {title}
    </h2>
  );

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
            QA TEST REPORT FOR DENTAL HAND-HELD X-RAY EQUIPMENT
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
                <div key={String(label)} className="flex">
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
                ["Engineer’s Name", report.engineerNameRPId || "-"],
                ["RP ID", report.rpId || "-"],
                ["QA Test Date", formatDate(report.testDate)],
                ["QA Test Due Date", formatDate(report.testDueDate)],
                ["Testing done at Location", report.location],
                ["Temperature (°C)", report.temperature || "-"],
                ["Humidity in RH (%)", report.humidity || "-"],
              ].map(([label, value], index) => (
                <div key={String(label)} className="flex">
                  <div className="w-6 text-right pr-1">3.{index + 1}</div>
                  <div className="w-64">{label}</div>
                  <div className="px-1">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-3">
            <h2 className="font-bold mb-4" style={{ fontSize: "12px" }}>4. Standards / Tools Used</h2>
            <table className="compact-table" style={{ fontSize: "11px", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: "0", width: "100%", border: "0.1px solid #666", textAlign: "center" }}>
              <thead>
                <tr>
                  {["Sl No.", "Nomenclature", "Make", "Model", "Sr. No.", "Range", "Certificate No.", "Valid Till"].map((h, i) => (
                    <th key={h} style={{ fontWeight: 700, border: "0.1px solid #666", fontSize: "9px", lineHeight: "1.2", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", padding: "3px 4px", width: ["6%", "18%", "12%", "12%", "10%", "10%", "16%", "16%"][i] }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? (
                  toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{i + 1}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.nomenclature}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.make || "-"}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.model || "-"}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.SrNo}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.range}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{tool.calibrationCertificateNo}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>No tools recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
          <div style={{ marginTop: "auto" }}>
            <ReportPdfPageNoteQR report={report as any} />
          </div>
        </ReportPage>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <ReportPage className="test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForDentalHandHeld
              testData={testData}
              hasTimer={
                !testData._isNoTimerMode &&
                Boolean(
                  testData.accuracyOfIrradiationTime?.irradiationTimes?.some(
                    (r: any) =>
                      String(r?.setTime ?? "").trim() !== "" ||
                      String(r?.measuredTime ?? "").trim() !== ""
                  ) ||
                    testData.linearityOfmALoading?.table2?.length
                )
              }
            />
          </div>
        </ReportPage>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <ReportPage className="test-section">
          <div className="report-pdf-last-main max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>


            {/* 2. Accuracy of Irradiation Time — timer mode only */}
            {!testData._isNoTimerMode && testData.accuracyOfIrradiationTime?.irradiationTimes?.some(
              (r: any) => String(r?.setTime ?? "").trim() !== "" || String(r?.measuredTime ?? "").trim() !== ""
            ) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
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
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
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
                    <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="report-data-table border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
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
                {testData.accuracyOfIrradiationTime.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}


            {/* 1. Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential?.measurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Operating Potential (kVp)</h3>
                {(() => {
                  const rows = testData.accuracyOfOperatingPotential.measurements || [];
                  const measCount = Math.max(
                    testData.accuracyOfOperatingPotential.mAStations?.length || 0,
                    ...rows.map((r: any) => (Array.isArray(r?.measuredValues) ? r.measuredValues.length : 0)),
                    1
                  );
                  const headers = (testData.accuracyOfOperatingPotential.mAStations?.length
                    ? testData.accuracyOfOperatingPotential.mAStations
                    : Array.from({ length: measCount }, (_: any, i: number) => `mA ${i + 1}`));

                  return (
                    <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="report-data-table border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold">Applied kVp</th>
                            <th colSpan={measCount} className="border border-black p-2 print:p-1 text-center font-bold">Measured Values (kVp)</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-blue-100">Average kVp</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                          </tr>
                          <tr>
                            {headers.map((s: string, idx: number) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center font-bold">{displayValue(s)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const vals = Array.isArray(row?.measuredValues)
                              ? row.measuredValues
                              : Array.isArray(row?.maStations)
                                ? row.maStations.map((m: any) => m?.kvp ?? m?.kVp ?? m?.value ?? "")
                                : [];
                            const rowRemark = row?.remarks ?? row?.remark ?? "-";
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(row?.appliedKvp ?? row?.kvp ?? row?.kVp)}</td>
                                {Array.from({ length: measCount }, (_: any, idx: number) => (
                                  <td key={idx} className="border border-black p-2 print:p-1">{displayValue(vals[idx])}</td>
                                ))}
                                <td className="border border-black p-2 print:p-1 font-bold bg-blue-50">{displayValue(row?.averageKvp ?? row?.avgKvp)}</td>
                                <td className={`border border-black p-2 print:p-1 font-bold ${String(rowRemark).toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : String(rowRemark).toUpperCase() === "FAIL" ? "text-red-800 bg-red-100" : ""}`}>{displayValue(rowRemark)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> {testData.accuracyOfOperatingPotential?.kvpToleranceSign || testData.accuracyOfOperatingPotential?.tolerance?.type || "±"} {testData.accuracyOfOperatingPotential?.kvpToleranceValue || testData.accuracyOfOperatingPotential?.tolerance?.value || "2.0"} kV
                  </p>
                </div>
              </div>
            )}


            {/* 2A. Total Filteration */}
            {testData.totalFilteration?.totalFiltration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Total Filteration</h3>
                {(() => {
                  const tf = testData.totalFilteration.totalFiltration || {};
                  const ft = testData.totalFilteration.filtrationTolerance || {};
                  const primitive = (v: any) => {
                    if (v == null) return "";
                    if (typeof v === "object" && "value" in v) return (v as any).value ?? "";
                    return v;
                  };
                  const toNum = (v: any): number => {
                    const raw = primitive(v);
                    if (raw == null || raw === "") return NaN;
                    if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
                    const s = String(raw).trim();
                    const direct = Number(s);
                    if (Number.isFinite(direct)) return direct;
                    const m = s.match(/-?\d+(\.\d+)?/);
                    return m ? Number(m[0]) : NaN;
                  };
                  const tfAtKvp = tf.atKvp ?? tf.kvp ?? tf.kV ?? "";
                  const tfMeasured1 = tf.measured1 ?? tf.measured ?? tf.measuredValue ?? "";
                  const tfMeasured2 = tf.measured2 ?? tf.required ?? tf.requiredValue ?? "";
                  const kvpNum = toNum(tfAtKvp);
                  const measured1 = toNum(tfMeasured1);
                  const measured2 = toNum(tfMeasured2);
                  const measuredForDecision = !isNaN(measured1) ? measured1 : (!isNaN(measured2) ? measured2 : NaN);

                  const k1 = toNum(ft.kvp1 ?? ft.kvThreshold1);
                  const k2 = toNum(ft.kvp2 ?? ft.kvThreshold2);
                  let reqVal = ft.value3 ?? ft.forKvGreaterThan100;
                  let reqOp = ft.operator3 || ">=";
                  if (!isNaN(kvpNum) && !isNaN(k1) && kvpNum < k1) {
                    reqVal = ft.value1 ?? ft.forKvGreaterThan70;
                    reqOp = ft.operator1 || ">=";
                  } else if (!isNaN(kvpNum) && !isNaN(k1) && !isNaN(k2) && kvpNum >= k1 && kvpNum <= k2) {
                    reqVal = ft.value2 ?? ft.forKvBetween70And100;
                    reqOp = ft.operator2 || ">=";
                  }

                  const normalizedOp =
                    reqOp === "≤" ? "<=" :
                      reqOp === "≥" ? ">=" :
                        String(reqOp).toLowerCase() === "less than or equal to" ? "<=" :
                          String(reqOp).toLowerCase() === "greater than or equal to" ? ">=" :
                            String(reqOp).toLowerCase() === "less than" ? "<" :
                              String(reqOp).toLowerCase() === "greater than" ? ">" :
                                reqOp === "=" ? "==" : reqOp;
                  let reqNum = toNum(reqVal);
                  if (isNaN(reqNum)) {
                    const candidates = [
                      ft.value1, ft.value2, ft.value3,
                      ft.forKvGreaterThan70, ft.forKvBetween70And100, ft.forKvGreaterThan100
                    ].map(toNum).filter((n: number) => !isNaN(n));
                    reqNum = candidates.length > 0 ? candidates[0] : NaN;
                  }
                  // Legacy payload fallback: measured2 often stores required tolerance value.
                  if (isNaN(reqNum)) {
                    const legacyRequired = toNum(tfMeasured2);
                    if (!isNaN(legacyRequired)) {
                      reqNum = legacyRequired;
                    }
                  }
                  let remark = "-";
                  if (!isNaN(measuredForDecision) && !isNaN(reqNum)) {
                    if (normalizedOp === ">=" || normalizedOp === ">") remark = measuredForDecision >= reqNum ? "PASS" : "FAIL";
                    else if (normalizedOp === "<=" || normalizedOp === "<") remark = measuredForDecision <= reqNum ? "PASS" : "FAIL";
                    else remark = measuredForDecision >= reqNum ? "PASS" : "FAIL";
                  }

                  return (
                    <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>{displayValue(tfAtKvp)} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              {displayValue(tfMeasured1)}
                              {(tfMeasured2 !== "" && tfMeasured2 !== null && tfMeasured2 !== undefined) ? ` / ${displayValue(tfMeasured2)}` : ""}
                              {" "}mm Al
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              {!isNaN(reqNum) ? `${normalizedOp === "==" ? "=" : (normalizedOp || ">=")} ${reqNum} mm Al` : "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
                            <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              <span className={remark === "PASS" ? "text-green-600" : remark === "FAIL" ? "text-red-600" : ""}>{remark}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                        <span className="font-semibold">Tolerance criteria: </span>
                        {displayValue(ft.value1 ?? ft.forKvGreaterThan70)} mm Al for kV &lt; {displayValue(ft.kvp1 ?? ft.kvThreshold1)} |&nbsp;
                        {displayValue(ft.value2 ?? ft.forKvBetween70And100)} mm Al for {displayValue(ft.kvp1 ?? ft.kvThreshold1)} ≤ kV ≤ {displayValue(ft.kvp2 ?? ft.kvThreshold2)} |&nbsp;
                        {displayValue(ft.value3 ?? ft.forKvGreaterThan100)} mm Al for kV &gt; {displayValue(ft.kvp2 ?? ft.kvThreshold2)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3. Linearity of Time — timer mode only */}
            {!testData._isNoTimerMode && testData.linearityOfTime?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Linearity of Time</h3>

                <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="report-data-table border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Time (sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(row.time)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.average)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.x)}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle">{testData.linearityOfTime.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle">{testData.linearityOfTime.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{testData.linearityOfTime.col || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${testData.linearityOfTime.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {testData.linearityOfTime.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> {normalizeToleranceOperator(testData.linearityOfTime?.tolerance, "≤")} {normalizeToleranceValue(testData.linearityOfTime?.tolerance, "0.1")}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Linearity of mA Loading — timer mode only */}
            {!testData._isNoTimerMode && testData.linearityOfmALoading?.table2?.length > 0 && (() => {
              const rows = testData.linearityOfmALoading.table2;
              const tolerance = normalizeToleranceValue(testData.linearityOfmALoading?.tolerance, "0.1");
              const toleranceOperator = testData.linearityOfmALoading?.toleranceOperator || normalizeToleranceOperator(testData.linearityOfmALoading?.tolerance, "<");
              const table1 = Array.isArray(testData.linearityOfmALoading.table1)
                ? testData.linearityOfmALoading.table1?.[0]
                : testData.linearityOfmALoading.table1;
              const hasTime = table1?.time !== undefined && table1?.time !== null && String(table1?.time).trim() !== "";
              const timeStr = hasTime ? String(table1?.time).trim() : '';
              const timeVal = parseFloat(timeStr);
              const hasValidTime = timeStr !== '' && !isNaN(timeVal) && timeVal > 0;
              const xUnitLabel = hasTime ? 'mGy/(mA*s)' : 'mGy/mA';

              const xResults = rows.map((row: any) => {
                const outputsArr = Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
                const values = outputsArr.map((v: any) => parseFloat(String(v))).filter((n: number) => !isNaN(n) && n > 0);
                const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
                const ma = parseFloat(row.ma) || 0;
                const mAs = hasValidTime && ma > 0 ? ma * timeVal : null;
                let x = 0;
                if (avg > 0 && mAs && mAs > 0) {
                  x = avg / mAs;
                } else if (avg > 0 && ma > 0) {
                  x = avg / ma;
                }
                return { avg, x, row };
              });

              const xValues = xResults.map((r: any) => r.x).filter((x: number) => x > 0);
              const xMax = xValues.length > 0 ? Math.max(...xValues) : 0;
              const xMin = xValues.length > 0 ? Math.min(...xValues) : 0;
              const col = (xMax + xMin) > 0 ? Math.abs(xMax - xMin) / (xMax + xMin) : 0;
              const tolNum = parseFloat(tolerance);
              let isPassOverall = false;
              if (col > 0 && !isNaN(tolNum)) {
                switch (toleranceOperator) {
                  case '<': isPassOverall = col < tolNum; break;
                  case '>': isPassOverall = col > tolNum; break;
                  case '<=': isPassOverall = col <= tolNum; break;
                  case '>=': isPassOverall = col >= tolNum; break;
                  case '=': isPassOverall = Math.abs(col - tolNum) < 0.0001; break;
                  default: isPassOverall = col <= tolNum;
                }
              }

              return (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity of mA Loading</h3>
                {(table1?.fcd != null || table1?.kv != null || table1?.time != null) && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100"><tr>
                        <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                        <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                        <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>Time (s)</th>
                      </tr></thead>
                      <tbody><tr>
                        <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{table1?.fcd || "-"}</td>
                        <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{table1?.kv || "-"}</td>
                        <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{table1?.time || "-"}</td>
                      </tr></tbody>
                    </table>
                  </div>
                )}
                <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="report-data-table border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">mA</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-blue-50">X ({xUnitLabel})</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xResults.map((res: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(res.row.ma)}</td>
                          <td className="border border-black p-2 print:p-1">{res.avg > 0 ? res.avg.toFixed(4) : displayValue(res.row.average)}</td>
                          <td className="border border-black p-2 print:p-1 font-bold">{res.x > 0 ? res.x.toFixed(4) : displayValue(res.row.x)}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 align-middle">{col > 0 ? xMax.toFixed(4) : (rows[0]?.xMax || "-")}</td>
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 align-middle">{col > 0 ? xMin.toFixed(4) : (rows[0]?.xMin || "-")}</td>
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 font-bold align-middle">{col > 0 ? col.toFixed(4) : (rows[0]?.col || "-")}</td>
                              <td rowSpan={rows.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${isPassOverall ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {isPassOverall ? "Pass" : col > 0 ? "Fail" : (rows[0]?.remarks || "-")}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> {toleranceOperator} {tolerance}
                  </p>
                </div>
              </div>
            )})()}

            {/* 5. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading?.table2?.length > 0 && (() => {
              const rows = testData.linearityOfMasLoading.table2;
              const table1 = Array.isArray(testData.linearityOfMasLoading.table1)
                ? testData.linearityOfMasLoading.table1?.[0]
                : testData.linearityOfMasLoading.table1;
              const measHeadersRaw = Array.isArray(testData.linearityOfMasLoading.measHeaders)
                ? testData.linearityOfMasLoading.measHeaders
                : [];
              const maxOutLen = Math.max(
                0,
                ...rows.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0)),
                measHeadersRaw.length,
                1
              );
              const measHeaders =
                measHeadersRaw.length > 0
                  ? Array.from({ length: Math.max(maxOutLen, measHeadersRaw.length) }, (_, i) =>
                      String(measHeadersRaw[i] ?? "").trim() || `Measured mR ${i + 1}`
                    )
                  : Array.from({ length: maxOutLen }, (_, i) => `Measured mR ${i + 1}`);

              const xResults = rows.map((row: any) => {
                const outputsArr = Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
                const values = outputsArr.map((v: any) => parseFloat(String(v))).filter((n: number) => !isNaN(n) && n > 0);
                const avg = values.length > 0
                  ? values.reduce((a: number, b: number) => a + b, 0) / values.length
                  : parseFloat(String(row.average || "")) || 0;
                const masLabel = String(row.mAsRange ?? row.mas ?? row.ma ?? "").trim();
                const rangeMatch = masLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                const midMas = rangeMatch
                  ? (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2
                  : parseFloat(masLabel.replace(/[^\d.]/g, "")) || 0;
                let x = parseFloat(String(row.x || "")) || 0;
                if ((!x || x <= 0) && avg > 0 && midMas > 0) {
                  x = avg / midMas;
                }
                return { row, masLabel, avg, x, outputsArr };
              });

              const xValues = xResults.map((r: any) => r.x).filter((x: number) => x > 0);
              const xMax = xValues.length > 0 ? Math.max(...xValues) : 0;
              const xMin = xValues.length > 0 ? Math.min(...xValues) : 0;
              const col = (xMax + xMin) > 0 ? Math.abs(xMax - xMin) / (xMax + xMin) : 0;
              const tolerance = normalizeToleranceValue(testData.linearityOfMasLoading?.tolerance, "0.1");
              const toleranceOperator =
                testData.linearityOfMasLoading?.toleranceOperator ||
                normalizeToleranceOperator(testData.linearityOfMasLoading?.tolerance, "<=");
              const tolNum = parseFloat(tolerance);
              let isPassOverall = false;
              if (col > 0 && !isNaN(tolNum)) {
                switch (toleranceOperator) {
                  case '<': isPassOverall = col < tolNum; break;
                  case '>': isPassOverall = col > tolNum; break;
                  case '<=': isPassOverall = col <= tolNum; break;
                  case '>=': isPassOverall = col >= tolNum; break;
                  case '=': isPassOverall = Math.abs(col - tolNum) < 0.0001; break;
                  default: isPassOverall = col <= tolNum;
                }
              }

              return (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Linearity of mAs Loading</h3>

                {(table1?.fcd != null || table1?.kv != null) && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100"><tr>
                        <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                        <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                      </tr></thead>
                      <tbody><tr>
                        <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{table1?.fcd || "-"}</td>
                        <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{table1?.kv || "-"}</td>
                      </tr></tbody>
                    </table>
                  </div>
                )}

                <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="report-data-table border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">mAs Range</th>
                        {measHeaders.map((header: string, idx: number) => (
                          <th key={idx} className="border border-black p-2 print:p-1 text-center font-bold">{header}</th>
                        ))}
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/mAs)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xResults.map((res: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(res.masLabel)}</td>
                          {measHeaders.map((_: string, idx: number) => (
                            <td key={idx} className="border border-black p-2 print:p-1">{displayValue(res.outputsArr[idx])}</td>
                          ))}
                          <td className="border border-black p-2 print:p-1">{res.avg > 0 ? res.avg.toFixed(4) : displayValue(res.row.average)}</td>
                          <td className="border border-black p-2 print:p-1">{res.x > 0 ? res.x.toFixed(4) : displayValue(res.row.x)}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 align-middle">{col > 0 ? xMax.toFixed(4) : (rows[0]?.xMax || "-")}</td>
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 align-middle">{col > 0 ? xMin.toFixed(4) : (rows[0]?.xMin || "-")}</td>
                              <td rowSpan={rows.length} className="border border-black p-2 print:p-1 font-bold align-middle">{col > 0 ? col.toFixed(4) : (rows[0]?.col || "-")}</td>
                              <td rowSpan={rows.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${isPassOverall ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {isPassOverall ? "Pass" : col > 0 ? "Fail" : (rows[0]?.remarks || "-")}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> {formatToleranceOperatorSymbol(toleranceOperator, "≤")} {tolerance}
                  </p>
                </div>
              </div>
              );
            })()}

            {/* 6. Consistency of Radiation Output */}
            {testData.consistencyOfRadiationOutput && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Consistency of Radiation Output</h3>
                {/* FFD small table */}
                {testData.consistencyOfRadiationOutput.ffd && (
                  <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.consistencyOfRadiationOutput.ffd}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.consistencyOfRadiationOutput.outputRows?.length > 0 && (() => {
                  const rows = testData.consistencyOfRadiationOutput.outputRows;
                  const headersRaw = Array.isArray(testData.consistencyOfRadiationOutput.measurementHeaders)
                    ? testData.consistencyOfRadiationOutput.measurementHeaders
                    : [];
                  const measCount = Math.max(
                    ...rows.map((r: any) => (r.outputs ?? []).length),
                    headersRaw.length,
                    1
                  );
                  const measHeaders =
                    headersRaw.length > 0
                      ? Array.from({ length: measCount }, (_, i) =>
                          String(headersRaw[i] ?? "").trim() || `Meas ${i + 1}`
                        )
                      : Array.from({ length: measCount }, (_, i) => `Meas ${i + 1}`);
                  const tol = testData.consistencyOfRadiationOutput.tolerance;
                  const tolVal = parseFloat(typeof tol === 'object' ? tol.value : tol) || 0.05;
                  const tolOp = (typeof tol === 'object' ? tol.operator : null) || '<=';

                  const getVal = (o: any): number => {
                    if (o == null) return NaN;
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  return (
                    <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="report-data-table border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black text-center">kV</th>
                            <th className="border border-black text-center">mAs</th>
                            {measHeaders.map((header: string, i: number) => (
                              <th key={i} className="border border-black text-center">{header}</th>
                            ))}
                            <th className="border border-black text-center">Avg (X̄)</th>
                            <th className="border border-black text-center">CoV</th>
                            <th className="border border-black text-center">Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
                            const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                            const avgDisplay = avg !== null ? avg.toFixed(4) : (row.mean || '-');
                            let covDisplay = '-';
                            let remark = row.remark || '-';
                            if (avg !== null && avg > 0) {
                              const variance = outputs.length > 1
                                ? outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / (outputs.length - 1)
                                : 0;
                              const cov = Math.sqrt(variance) / avg;
                              if (isFinite(cov)) {
                                covDisplay = cov.toFixed(4);
                                const passes = (tolOp === '<=' || tolOp === '<') ? cov <= tolVal : cov >= tolVal;
                                remark = passes ? 'Pass' : 'Fail';
                              }
                            } else if (row.cov) {
                              covDisplay = row.cov;
                            }
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black text-center">{row.kv || '-'}</td>
                                <td className="border border-black text-center">{row.mas || '-'}</td>
                                {Array.from({ length: measCount }, (_, j) => {
                                  const raw = (row.outputs ?? [])[j];
                                  const display = raw != null ? (typeof raw === 'object' && 'value' in raw ? raw.value : String(raw)) : '-';
                                  return (
                                    <td key={j} className="border border-black text-center">{display || '-'}</td>
                                  );
                                })}
                                <td className="border border-black text-center font-semibold">{avgDisplay}</td>
                                <td className="border border-black text-center">{covDisplay}</td>
                                <td className="border border-black text-center font-semibold">
                                  <span className={String(remark).toUpperCase() === 'PASS' ? 'text-green-600' : String(remark).toUpperCase() === 'FAIL' ? 'text-red-600' : ''}>
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
                {testData.consistencyOfRadiationOutput.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance (CoV):</strong> {normalizeToleranceOperator(testData.consistencyOfRadiationOutput?.tolerance, "≤")} {normalizeToleranceValue(testData.consistencyOfRadiationOutput?.tolerance, "0.05")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (() => {
              const leakageData = testData.tubeHousingLeakage;
              const settings =
                (Array.isArray(leakageData.measurementSettings)
                  ? leakageData.measurementSettings[0]
                  : leakageData.measurementSettings) ||
                (Array.isArray(leakageData.settings) ? leakageData.settings[0] : leakageData.settings) ||
                {};
              const measurements = leakageData.leakageMeasurements || [];
              const workload = leakageData.workload?.value || leakageData.workload || "0";
              const workloadUnit = leakageData.workload?.unit || "mA·min/week";
              const maUsed = parseFloat(leakageData.ma || settings.ma || "0") || 1;
              const workloadVal = parseFloat(String(workload)) || 0;
              const tolVal = parseFloat(leakageData.tolerance?.value || leakageData.toleranceValue || "1.0") || 1.0;
              const tolOp = leakageData.tolerance?.operator || leakageData.toleranceOperator || "less than or equal to";
              const tolTime = leakageData.tolerance?.time || leakageData.toleranceTime || "1";

              const getDisplayOp = (op: string) => {
                if (op === "less than or equal to") return "≤";
                if (op === "greater than or equal to") return "≥";
                if (op === "<=") return "≤";
                if (op === ">=") return "≥";
                return op || "≤";
              };

              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Tube Housing Leakage Radiation Test</h3>

                  {/* Test Conditions Table */}
                  <div className="mb-4 print:mb-1">
                    <div className="overflow-x-auto mb-2 print:mb-1">
                      <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FDD (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mA</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Time (Sec)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leakageData.fcd || settings.distance || settings.fcd || "100"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leakageData.kv || settings.kv || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leakageData.ma || settings.ma || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                              {leakageData.time || settings.time || settings.Time || settings.timeSec || settings.timeInSec || settings.exposureTime || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Workload and Tolerance Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                    <div>
                      <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                        <strong>Workload:</strong> {workload} {workloadUnit}
                      </p>
                    </div>
                    <div></div>
                  </div>

                  {/* Exposure Level Table — Result columns match generate TubeHousingLeakage */}
                  <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="report-data-table border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ width: '15%', padding: '0px 2px', fontSize: '10px' }}>Location</th>
                          <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Exposure Level (mR/hr)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mR in one hour)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mGy in one hour)</th>
                          <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remarks</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Left</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Right</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Front</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Back</th>
                          <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Top</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.map((row: any, i: number) => {
                          const gets = (val: any) => parseFloat(val) || 0;
                          const values = [row.left, row.right, row.front, row.back, row.top].map(gets).filter(v => v > 0);
                          const parsedMax = parseFloat(String(row.max ?? ""));
                          const rowMax = !isNaN(parsedMax) && parsedMax > 0
                            ? parsedMax
                            : values.length > 0
                              ? Math.max(...values)
                              : 0;

                          let calculatedMR = "—";
                          let calculatedMGy = "—";
                          let remark = row.remark || row.remarks || "—";

                          // Generate stores exposures in mR/hr — same formula as TubeHousingLeakage
                          if (row.result != null && row.result !== "" && row.result !== "-") {
                            const savedMr = parseFloat(String(row.result));
                            if (!isNaN(savedMr) && savedMr > 0) {
                              calculatedMR = savedMr.toFixed(3);
                              const savedMgy = parseFloat(String(row.mgy ?? ""));
                              calculatedMGy = !isNaN(savedMgy) && String(row.mgy ?? "").trim() !== ""
                                ? savedMgy.toFixed(4)
                                : (savedMr / 114).toFixed(4);
                            }
                          } else if (rowMax > 0 && maUsed > 0 && workloadVal > 0) {
                            const resMRValue = (workloadVal * rowMax) / (60 * maUsed);
                            calculatedMR = resMRValue.toFixed(3);
                            const resMGyValue = resMRValue / 114;
                            calculatedMGy = resMGyValue.toFixed(4);
                          }

                          if ((remark === "—" || remark === "-" || !remark) && calculatedMGy !== "—") {
                            const resMGyValue = parseFloat(calculatedMGy);
                            const op = String(tolOp).trim().toLowerCase();
                            const scale = 10_000;
                            const mi = Math.round(resMGyValue * scale);
                            const ti = Math.round(tolVal * scale);
                            if (op === ">" || op === "greater than" || op === "gt" || op === "greater than or equal to" || op === ">=") {
                              remark = (op.includes("equal") || op === ">=") ? (mi >= ti ? "Pass" : "Fail") : (mi > ti ? "Pass" : "Fail");
                            } else if (op === "=" || op === "==" || op === "equals" || op === "equal to") {
                              remark = mi === ti ? "Pass" : "Fail";
                            } else if (op === "less than or equal to" || op === "<=") {
                              remark = mi <= ti ? "Pass" : "Fail";
                            } else {
                              remark = mi < ti ? "Pass" : "Fail";
                            }
                          }

                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.left || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.right || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.front || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.back || "-"}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.top || "-"}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMR}</td>
                              <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMGy}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                <span className={String(remark).toUpperCase() === "PASS" ? "text-green-600 font-bold" : String(remark).toUpperCase() === "FAIL" ? "text-red-600 font-bold" : ""}>
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Formula and Summary Blocks */}
                  {(() => {
                    const gets = (val: any) => parseFloat(val) || 0;
                    const getSummary = (match: (loc: string) => boolean) => {
                      const row = measurements.find((m: any) => match(String(m.location || "").toLowerCase()));
                      if (!row) return null;
                      const values = [row.left, row.right, row.front, row.back, row.top].map(gets).filter(v => v > 0);
                      const parsedMax = parseFloat(String(row.max ?? ""));
                      const max = !isNaN(parsedMax) && parsedMax > 0
                        ? parsedMax
                        : values.length > 0
                          ? Math.max(...values)
                          : 0;
                      if (max <= 0 || maUsed <= 0 || workloadVal <= 0) return null;
                      // Generate exposures are mR/hr
                      const resMR = (workloadVal * max) / (60 * maUsed);
                      const resMGy = resMR / 114;
                      return { max, resMR, resMGy, location: row.location };
                    };

                    const tubeSummary = getSummary((loc) => loc.includes("tube") && !loc.includes("collimator"));
                    const collimatorSummary = getSummary((loc) => loc.includes("collimator"));

                    return (
                      <div className="space-y-4 print:space-y-1">
                        <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
                          <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
                          <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                            Maximum Leakage (mR in one hour) = (Workload × Max Exposure mR/hr) / (60 × mA used for measurement)
                          </div>
                          <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                            Where: Workload = {workload} | mA = {maUsed} | 1 mGy = 114 mR
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 print:gap-1">
                          {tubeSummary && tubeSummary.max > 0 && (
                            <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                              <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">{tubeSummary.location} Summary:</p>
                              <div className="text-[11px] print:text-[8px] space-y-1">
                                <p>Max Measured: <strong>{tubeSummary.max.toFixed(2)} mR/hr</strong></p>
                                <p>Result: <strong>{tubeSummary.resMR.toFixed(3)} mR in one hour</strong></p>
                                <p>In mGy: <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy in one hour</span></p>
                              </div>
                            </div>
                          )}
                          {collimatorSummary && collimatorSummary.max > 0 && (
                            <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                              <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">{collimatorSummary.location} Summary:</p>
                              <div className="text-[11px] print:text-[8px] space-y-1">
                                <p>Max Measured: <strong>{collimatorSummary.max.toFixed(2)} mR/hr</strong></p>
                                <p>Result: <strong>{collimatorSummary.resMR.toFixed(3)} mR in one hour</strong></p>
                                <p>In mGy: <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy in one hour</span></p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
                          <p className="text-[11px] print:text-[8px] leading-relaxed">
                            <strong>Tolerance:</strong> Calculated leakage (in one hour) must satisfy{" "}
                            {getDisplayOp(tolOp)}{" "}
                            <strong>{tolVal} mGy ({(tolVal * 114).toFixed(3)} mR) in {tolTime} hour.</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* 8. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Details of Radiation Protection Survey</h3>

                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                    <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
                    <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
                {testData.radiationProtectionSurvey.locations?.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                    <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
                )}

                {/* 4. Calculation Formula */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>4. Calculation Formula</h4>
                  <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");

                  const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, workerLocs[0] || { mRPerHr: '', location: '' });

                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, publicLocs[0] || { mRPerHr: '', location: '' });

                  const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                  const workerResult = parseFloat(maxWorkerWeekly) > 0 && parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : parseFloat(maxWorkerWeekly) > 40 ? "Fail" : "";
                  const publicResult = parseFloat(maxPublicWeekly) > 0 && parseFloat(maxPublicWeekly) <= 2 ? "Pass" : parseFloat(maxPublicWeekly) > 2 ? "Fail" : "";

                  return (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                      <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {workerResult || "-"}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {publicResult || "-"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 print:mt-1 space-y-3 print:space-y-1">
                        {maxWorkerLocation.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Location:</strong> {maxWorkerLocation.location}
                            </p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxWorkerLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Result:</strong> {maxWorkerWeekly} mR/week
                            </p>
                          </div>
                        )}
                        {maxPublicLocation.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Location:</strong> {maxPublicLocation.location}
                            </p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxPublicLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Result:</strong> {maxPublicWeekly} mR/week
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Permissible Limit */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>6. Permissible Limit</h4>
                  <div className="report-data-table-wrap mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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

            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32">
                No detailed test results available for this report.
              </p>
            )}
          </div>
        </ReportPage>
        <ReportPage isLast>
          <ReportPdfPageDeclaration
              todayDate={todayDate}
              customerCity={placeValue}
              qrCode={report.qrCode}
              engineerName={report.engineerNameRPId}
              authorizedSignatoryName={report.authorizedSignatoryName}
              authorizedSignatorySignature={report.authorizedSignatorySignature}
            />
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
          padding-top: 6px !important;
          padding-bottom: 6px !important;
          padding-left: 4px !important;
          padding-right: 4px !important;
          line-height: 1.25 !important;
        }
        .fixed-report-pdf .report-data-table-wrap {
          overflow-x: hidden !important;
          max-width: 100%;
          width: 100%;
        }
        .fixed-report-pdf .report-data-table {
          width: 100% !important;
          min-width: 0 !important;
          table-layout: fixed !important;
        }
        .fixed-report-pdf .report-data-table th,
        .fixed-report-pdf .report-data-table td {
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          min-width: 0 !important;
          max-width: none !important;
          padding-top: 6px !important;
          padding-bottom: 6px !important;
          padding-left: 3px !important;
          padding-right: 3px !important;
          font-size: 10px !important;
        }
        .is-generating-pdf td,
        .is-generating-pdf th {
          padding-top: 4px !important;
          padding-bottom: 12px !important;
        }
        .header-cell-simulated {
          padding-top: 5px;
          padding-bottom: 0px;
        }
        .is-generating-pdf .header-cell-simulated {
          padding-top: 0px;
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
          .fixed-report-pdf .report-data-table th,
          .fixed-report-pdf .report-data-table td {
            font-size: 9px !important;
            padding-left: 2px !important;
            padding-right: 2px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportDentalHandHeld;
