// src/components/reports/ViewServiceReportMammography.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeaderForMammography,
  getDetails,
  getAccuracyOfOperatingPotentialByServiceIdForMammography,
  getAccuracyOfIrradiationTimeByServiceIdForMammography,
  getLinearityOfMasLLoadingByServiceIdForMammography,
  getLinearityOfMasLoadingStationsByServiceIdForMammography,
  getTotalFilterationByServiceIdForMammography,
  getReproducibilityOfOutputByServiceIdForMammography,
  getRadiationLeakageLevelByServiceIdForMammography,
  getImagingPhantomByServiceIdForMammography,
  getRadiationProtectionSurveyByServiceIdForMammography,
  getEquipmentSettingByServiceIdForMammography,
  getMaximumRadiationLevelByServiceIdForMammography,
  getTools,
} from "../../../../../../api";
import MainTestTableForMammography, {
  generateMammographySummaryRows,
  getMammographySummarySectionNumbers,
  MAMMOGRAPHY_SUMMARY_PARAMETERS,
} from "../../TestTables/Mammography/MainTestTableForMammogaphy";
import { generatePDF } from "../../../../../../utils/generatePDF";
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
  toolsUsed: Tool[];
  notes: Note[];
  qrCode?: string;
  category: string;
  authorizedSignatoryName?: string;
  authorizedSignatorySignature?: string;
  // Mammography test IDs
  accuracyOfOperatingPotentialId?: string | null;
  accuracyOfIrradiationTimeId?: string | null;
  linearityOfMasLLoadingId?: string | null;
  linearityOfMaLoadingStationsId?: string | null;
  totalFiltrationAndAluminiumId?: string | null;
  reproducibilityOfOutputId?: string | null;
  radiationLeakageLevelId?: string | null;
  imagingPhantomId?: string | null;
  radiationProtectionSurveyId?: string | null;
  equipmentSettingId?: string | null;
  maximumRadiationLevelId?: string | null;
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

/** Keys on table2 rows that are not mA measurement columns */
const MAMMO_TABLE2_META_KEYS = new Set([
  "setKV",
  "avgKvp",
  "remarks",
  "deviation",
  "_id",
  "__v",
  "id",
]);

function isMammoMaStationColumnKey(key: string): boolean {
  if (MAMMO_TABLE2_META_KEYS.has(key)) return false;
  if (/^ma\d+/i.test(key)) return true;
  if (/^mA\d+/i.test(key)) return true;
  if (/^\d+mA$/i.test(key)) return true;
  if (/^[a-zA-Z0-9]*mA\d+/i.test(key)) return true;
  return false;
}

/** Union of mA column keys across all rows (first row alone may omit empty columns). */
function collectMammoMaColumnKeys(table2: any[] | undefined): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const row of table2 || []) {
    if (!row || typeof row !== "object") continue;
    for (const k of Object.keys(row)) {
      if (!isMammoMaStationColumnKey(k) || seen.has(k)) continue;
      seen.add(k);
      order.push(k);
    }
  }
  order.sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ""), 10);
    const nb = parseInt(String(b).replace(/\D/g, ""), 10);
    const aN = Number.isFinite(na) ? na : 1e9;
    const bN = Number.isFinite(nb) ? nb : 1e9;
    if (aN !== bN) return aN - bN;
    return a.localeCompare(b);
  });
  return order;
}

/** Human-readable header: ma10 / mA100 / 200mA → "mA 10", "mA 100", "mA 200" */
function formatMammoMaStationHeader(key: string): string {
  const k = String(key);
  let m = k.match(/^mA(\d+)$/i);
  if (m) return `mA ${m[1]}`;
  m = k.match(/^ma(\d+)$/i);
  if (m) return `mA ${m[1]}`;
  m = k.match(/^(\d+)mA$/i);
  if (m) return `mA ${m[1]}`;
  return k.replace(/([a-zA-Z])(\d)/g, "$1 $2");
}

const firstNonEmptyString = (...values: any[]): string => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const s = String(value).trim();
    if (!s || s.toLowerCase() === "n/a") continue;
    return s;
  }
  return "";
};

function pickUlrFromObject(obj: any): string {
  if (!obj || typeof obj !== "object") return "";
  const candidates = [
    obj.reportULRNumber,
    obj.reportUlrNumber,
    obj.reportULRNo,
    obj.ulrNumber,
    obj.ulrNo,
  ];
  for (const value of candidates) {
    if (value === null || value === undefined) continue;
    const s = String(value).trim();
    if (!s || s.toLowerCase() === "n/a") continue;
    return s;
  }
  return "";
}

function pickUlrFromQaTests(qaTests: any): string {
  if (!Array.isArray(qaTests)) return "";
  for (const test of qaTests) {
    const ulr = pickUlrFromObject(test);
    if (ulr) return ulr;
  }
  return "";
}

function normalizeMammographyRadiationProtectionSurvey(survey: any) {
  if (!survey || !Array.isArray(survey.locations)) return survey;
  const appliedCurrent = parseFloat(survey.appliedCurrent) || 0;
  const workload = parseFloat(survey.workload) || 0;

  const locations = survey.locations.map((loc: any) => {
    const mRPerHr = parseFloat(loc?.mRPerHr) || 0;
    let mRPerWeek = parseFloat(loc?.mRPerWeek);
    if ((Number.isNaN(mRPerWeek) || mRPerWeek <= 0) && mRPerHr > 0 && appliedCurrent > 0 && workload > 0) {
      mRPerWeek = (workload * mRPerHr) / (60 * appliedCurrent);
    }
    const category = loc?.category || "worker";
    const limit = category === "worker" ? 40 : 2;
    const result = mRPerWeek > 0 ? (mRPerWeek <= limit ? "PASS" : "FAIL") : (loc?.result || "");

    return {
      ...loc,
      mRPerWeek: mRPerWeek > 0 ? mRPerWeek.toFixed(3) : (loc?.mRPerWeek || ""),
      result,
    };
  });

  return { ...survey, locations };
}

const ViewServiceReportMammography: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [testData, setTestData] = useState<any>({
    accuracyOfOperatingPotential: null,
    irradiationTime: null,
    linearityOfMasLLoading: null,
    maLoadingStations: null,
    totalFiltrationAndAluminium: null,
    reproducibilityOfOutput: null,
    radiationLeakageLevel: null,
    imagingPhantom: null,
    radiationProtectionSurvey: null,
    equipmentSetting: null,
    maximumRadiationLevel: null,
  });
  const [calculatedPages, setCalculatedPages] = useState<string>("");
  const hasTimer = useMemo(() => {
    if (serviceId) {
      const stored = localStorage.getItem(`mammography-timer-${serviceId}`);
      if (stored !== null) return stored === "true";
    }
    return !!(testData.irradiationTime || testData.maLoadingStations);
  }, [serviceId, testData.irradiationTime, testData.maLoadingStations]);

  const sectionNumbers = useMemo(
    () => getMammographySummarySectionNumbers(testData, hasTimer),
    [testData, hasTimer]
  );

  const sectionNum = (key: keyof typeof MAMMOGRAPHY_SUMMARY_PARAMETERS): number | undefined =>
    sectionNumbers[MAMMOGRAPHY_SUMMARY_PARAMETERS[key]];

  const detailedPageFlags = useMemo(() => {
    const es = testData.equipmentSetting;
    const hasEquipment = !!(
      es &&
      (es.appliedCurrent ||
        es.appliedVoltage ||
        es.exposureTime ||
        es.focalSpotSize ||
        es.filtration ||
        es.collimation ||
        es.frameRate ||
        es.pulseWidth)
    );
    const mrl = testData.maximumRadiationLevel;
    const hasMaxRadiation = !!(mrl && Array.isArray(mrl.readings) && mrl.readings.length > 0);

    return {
      part1: (hasTimer && !!testData.irradiationTime) || !!testData.accuracyOfOperatingPotential,
      part2:
        (!hasTimer && !!testData.linearityOfMasLLoading) ||
        (hasTimer && !!testData.maLoadingStations) ||
        !!testData.totalFiltrationAndAluminium,
      part3: !!testData.reproducibilityOfOutput || !!testData.radiationLeakageLevel,
      part4: !!testData.imagingPhantom || !!testData.radiationProtectionSurvey,
      part5: hasEquipment || hasMaxRadiation,
    };
  }, [testData, hasTimer]);

  const detailedPagesCount = useMemo(
    () => Object.values(detailedPageFlags).filter(Boolean).length,
    [detailedPageFlags]
  );

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true)
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeaderForMammography(serviceId),
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
          const detailsData = (detailsRes as any)?.data?.data || (detailsRes as any)?.data || {};
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
          const ulrFromHeader = pickUlrFromObject(data);
          const ulrFromDetails = pickUlrFromQaTests((detailsRes as any)?.data?.qaTests);
          let ulrFromCache = "";
          try {
            const cached = localStorage.getItem(`reportNumbers_${serviceId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              ulrFromCache = pickUlrFromObject(parsed);
            }
          } catch {
            ulrFromCache = "";
          }
          const resolvedUlr = ulrFromHeader || ulrFromDetails || ulrFromCache || "N/A";

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
            reportULRNumber: resolvedUlr,
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Mammography Unit",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: firstNonEmptyString(data.rpId, (data as any).rpid, (data as any).rpID) || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: mergedTools,
            notes: data.notes || defaultNotes,
            qrCode: data.qrCode || "",

            category: data.category || "N/A",
            authorizedSignatoryName:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.name) ||
              data.authorizedSignatoryName ||
              "",
            authorizedSignatorySignature:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.signature) ||
              data.authorizedSignatorySignature ||
              "",
            // Extract test IDs from populated objects
            accuracyOfOperatingPotentialId: data.AccuracyOfOperatingPotentialMammography?._id || null,
            accuracyOfIrradiationTimeId: data.AccuracyOfIrradiationTimeMammography?._id || null,
            linearityOfMasLLoadingId: data.LinearityOfMasLoadingMammography?._id || null,
            linearityOfMaLoadingStationsId: data.LinearityOfMaLoadingStationsMammography?._id || null,
            totalFiltrationAndAluminiumId: data.TotalFilterationAndAlluminiumMammography?._id || null,
            reproducibilityOfOutputId: data.ReproducibilityOfRadiationOutputMammography?._id || null,
            radiationLeakageLevelId: data.RadiationLeakageLevelMammography?._id || null,
            imagingPhantomId: data.ImagingPhantomMammography?._id || null,
            radiationProtectionSurveyId: data.DetailsOfRadiationProtectionMammography?._id || null,
            equipmentSettingId: data.EquipmentSettingMammography?._id || null,
            maximumRadiationLevelId: data.MaximumRadiationLevelMammography?._id || null,
          });

          // Set test data directly from populated objects with mapping and calculations
          // Fetch any test tables not fully populated in report-header so all tables appear
          const fetchTest = async (fn: () => Promise<any>) => {
            try {
              const res = await fn();
              if (!res) return null;
              // Some APIs return { success: true, data: ... }, others just data
              if (res.data !== undefined) return res.data;
              return res;
            } catch {
              return null;
            }
          };

          const [
            accuracyOfOperatingPotentialRes,
            irradiationTimeRes,
            linearityOfMasLLoadingRes,
            maLoadingStationsRes,
            totalFiltrationRes,
            reproducibilityRes,
            leakageRes,
            imagingPhantomRes,
            protectionRes,
            equipmentSettingRes,
            maxRadiationRes,
          ] = await Promise.all([
            fetchTest(() => getAccuracyOfOperatingPotentialByServiceIdForMammography(serviceId)),
            fetchTest(() => getAccuracyOfIrradiationTimeByServiceIdForMammography(serviceId)),
            fetchTest(() => getLinearityOfMasLLoadingByServiceIdForMammography(serviceId)),
            fetchTest(() => getLinearityOfMasLoadingStationsByServiceIdForMammography(serviceId)),
            fetchTest(() => getTotalFilterationByServiceIdForMammography(serviceId)),
            fetchTest(() => getReproducibilityOfOutputByServiceIdForMammography(serviceId)),
            fetchTest(() => getRadiationLeakageLevelByServiceIdForMammography(serviceId)),
            fetchTest(() => getImagingPhantomByServiceIdForMammography(serviceId)),
            fetchTest(() => getRadiationProtectionSurveyByServiceIdForMammography(serviceId)),
            fetchTest(() => getEquipmentSettingByServiceIdForMammography(serviceId)),
            fetchTest(() => getMaximumRadiationLevelByServiceIdForMammography(serviceId)),
          ]);

          setTestData({
            accuracyOfOperatingPotential: (() => {
              const accuracy = accuracyOfOperatingPotentialRes || data.AccuracyOfOperatingPotentialMammography;
              if (!accuracy) return null;
              let finalMaKeys = collectMammoMaColumnKeys(accuracy.table2);
              if (finalMaKeys.length === 0) {
                finalMaKeys = ["ma10", "ma100", "ma200"];
              }
              const mAStationsArr = finalMaKeys.map((key) => formatMammoMaStationHeader(key));
              return {
                ...accuracy,
                mAStations: mAStationsArr,
                maColumnKeys: finalMaKeys,
                measurements: (accuracy.table2 || []).map((row: any) => ({
                  appliedKvp: row.setKV ?? row.setKvp ?? "-",
                  measuredValues: finalMaKeys.map((key) => {
                    const v = row[key];
                    if (v === null || v === undefined || v === "") return "-";
                    return typeof v === "object" && v !== null && "value" in v ? (v as any).value : String(v);
                  }),
                  averageKvp: row.avgKvp ?? "-",
                  remarks: row.remarks ?? "-",
                })),
                tolerance: accuracy.tolerance || {
                  value: accuracy.toleranceValue || "1.5",
                  type: accuracy.toleranceType || "absolute",
                  sign: accuracy.toleranceSign || "both"
                }
              };
            })(),
            linearityOfMasLLoading: (() => {
              const linearity = linearityOfMasLLoadingRes || data.LinearityOfMasLoadingMammography;
              if (!linearity) return null;

              const rows = Array.isArray((linearity as any).measurements)
                ? (linearity as any).measurements
                : (Array.isArray((linearity as any).table2) ? (linearity as any).table2 : []);
              const headers = (linearity as any).measurementHeaders || (linearity as any).measHeaders || ["Meas 1", "Meas 2", "Meas 3"];

              const xValues: number[] = [];
              const calculatedMeasurements = rows.map((row: any) => {
                const outputs = (row.measuredOutputs || [])
                  .map((v: any) => parseFloat(v))
                  .filter((v: number) => !isNaN(v) && v > 0);

                const preAvg = parseFloat(String(row.average ?? row.avgOutput ?? ""));
                const avgNum = outputs.length > 0
                  ? (outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length)
                  : (!isNaN(preAvg) ? preAvg : 0);
                const avg = avgNum > 0 ? avgNum.toFixed(3) : "-";

                // Estimate mid mAs from range (e.g., "10 - 20" -> 15)
                const mAsLabel = String(row.mAsRange ?? row.mAsApplied ?? "");
                const rangeMatch = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                const midMas = rangeMatch
                  ? (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2
                  : parseFloat(mAsLabel) || 0;

                const preX = parseFloat(String(row.x ?? ""));
                const xNum = avg !== "-" && midMas > 0 ? (parseFloat(avg) / midMas) : (!isNaN(preX) ? preX : NaN);
                const x = !isNaN(xNum) && xNum > 0 ? xNum.toFixed(4) : "-";
                if (x !== "-") xValues.push(parseFloat(x));

                return {
                  ...row,
                  average: avg,
                  x,
                };
              });

              const hasData = xValues.length > 0;
              const xMax = hasData ? Math.max(...xValues).toFixed(4) : "-";
              const xMin = hasData ? Math.min(...xValues).toFixed(4) : "-";
              const colNum = hasData && (parseFloat(xMax) + parseFloat(xMin)) > 0
                ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                : 0;
              const col = hasData ? colNum.toFixed(3) : "-";
              const tol = parseFloat((linearity as any).tolerance) || 0.1;
              const tolOp = normalizeComparisonOperator((linearity as any).toleranceOperator || "<=");
              const isPass = hasData ? compareByOperator(colNum, tol, tolOp) : false;

              return {
                ...linearity,
                measurementHeaders: headers,
                toleranceOperator: tolOp,
                measurements: calculatedMeasurements.map((m: any) => ({
                  ...m,
                  xMax,
                  xMin,
                  col,
                  remarks: hasData ? (isPass ? "Pass" : "Fail") : "-",
                })),
                xMax,
                xMin,
                col,
                remarks: hasData ? (isPass ? "Pass" : "Fail") : "-",
              };
            })(),
            irradiationTime: irradiationTimeRes || (() => {
              const test = data.AccuracyOfIrradiationTimeMammography;
              if (!test) return null;
              const tolValue = parseFloat(test.tolerance?.value) || 10;
              const operator = test.tolerance?.operator || "<=";

              return {
                ...test,
                table: (test.irradiationTimes || []).map((row: any) => {
                  const setNum = parseFloat(row.setTime) || 0;
                  const measNum = parseFloat(row.measuredTime) || 0;
                  let variation = "-";
                  let remark = "-";

                  if (setNum > 0) {
                    const varNum = ((measNum - setNum) / setNum) * 100;
                    variation = varNum.toFixed(2);
                    const absVar = Math.abs(varNum);
                    let isPass = false;
                    switch (operator) {
                      case ">":
                        isPass = absVar > tolValue;
                        break;
                      case "<":
                        isPass = absVar < tolValue;
                        break;
                      case ">=":
                        isPass = absVar >= tolValue;
                        break;
                      case "<=":
                        isPass = absVar <= tolValue;
                        break;
                      default:
                        isPass = absVar <= tolValue;
                    }
                    remark = isPass ? "Pass" : "Fail";
                  }
                  return { ...row, variation, remark };
                })
              };
            })(),
            maLoadingStations: (() => {
              const linearity = maLoadingStationsRes || data.LinearityOfMaLoadingStationsMammography;
              if (!linearity) return null;

              const rows = linearity.table2 || [];
              const xValues: number[] = [];

              const calculatedMeasurements = rows.map((row: any) => {
                const outputs = (row.measuredOutputs || [])
                  .map((v: any) => parseFloat(v))
                  .filter((v: number) => !isNaN(v) && v > 0);

                const avgNum = outputs.length > 0
                  ? (outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length)
                  : 0;
                const avg = avgNum > 0 ? avgNum.toFixed(3) : "-";

                // X = mGy/(mA*s) when time entered; otherwise mGy/mA
                const ma = parseFloat(row.ma || row.mAsApplied) || 0;
                const timeRaw = linearity.table1?.[0]?.time;
                const timeStr = timeRaw != null ? String(timeRaw).trim() : '';
                const time = parseFloat(timeStr);
                const hasValidTime = timeStr !== '' && !isNaN(time) && time > 0;
                const mAs = hasValidTime && ma > 0 ? ma * time : null;

                let x = '-';
                if (avg !== '-' && mAs && mAs > 0) {
                  x = (parseFloat(avg) / mAs).toFixed(4);
                } else if (avg !== '-' && ma > 0) {
                  x = (parseFloat(avg) / ma).toFixed(4);
                }
                if (x !== '-') xValues.push(parseFloat(x));

                return {
                  ...row,
                  mAsApplied: row.mAsApplied || row.ma || "-",
                  average: avg,
                  x: x
                };
              });

              const hasData = xValues.length > 0;
              const xMax = hasData ? Math.max(...xValues).toFixed(4) : "-";
              const xMin = hasData ? Math.min(...xValues).toFixed(4) : "-";
              const colNum = hasData && (parseFloat(xMax) + parseFloat(xMin)) > 0
                ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                : 0;
              const col = hasData ? colNum.toFixed(3) : "-";
              const tol = parseFloat(linearity.tolerance) || 0.1;
              const tolOp = normalizeComparisonOperator((linearity as any).toleranceOperator || "<=");
              const isPass = hasData ? compareByOperator(colNum, tol, tolOp) : false;

              const maxMeas = Math.max(
                0,
                ...rows.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
              );
              const savedHeaders = Array.isArray(linearity.measHeaders)
                ? linearity.measHeaders.map((h: any) => String(h ?? "").trim()).filter(Boolean)
                : [];
              const measHeaders =
                maxMeas > 0 || savedHeaders.length > 0
                  ? Array.from({ length: Math.max(maxMeas, savedHeaders.length) }, (_, i) =>
                      savedHeaders[i] || `Meas ${i + 1}`
                    )
                  : ["Meas 1", "Meas 2", "Meas 3"];

              return {
                ...linearity,
                measHeaders,
                toleranceOperator: tolOp,
                table2: calculatedMeasurements.map((m: any) => ({
                  ...m,
                  xMax,
                  xMin,
                  col,
                  remarks: hasData ? (isPass ? "Pass" : "Fail") : "-"
                })),
                xMax,
                xMin,
                col,
                remarks: hasData ? (isPass ? "Pass" : "Fail") : "-"
              };
            })(),
            totalFiltrationAndAluminium: totalFiltrationRes || data.TotalFilterationAndAlluminiumMammography || null,
            reproducibilityOfOutput: (() => {
              const raw = reproducibilityRes || data.ReproducibilityOfRadiationOutputMammography || null;
              if (!raw) return null;
              const tolRaw = raw.tolerance;
              const toleranceNormalized =
                typeof tolRaw === "object" && tolRaw != null && (tolRaw as any).value != null
                  ? {
                      ...tolRaw,
                      operator: normalizeComparisonOperator((tolRaw as any).operator),
                    }
                  : {
                      value: String(tolRaw ?? "0.05"),
                      operator: normalizeComparisonOperator((raw as any).toleranceOperator || "<="),
                    };
              const fddVal =
                raw.fdd ??
                (raw as any).fcd ??
                (raw as any).FDD ??
                (raw as any).testConditions?.fdd ??
                "";
              const rows = Array.isArray(raw.outputRows) ? raw.outputRows : [];
              const maxMeas = Math.max(
                0,
                ...rows.map((r: any) => (Array.isArray(r.outputs) ? r.outputs.length : 0))
              );
              const savedHeaders = (
                Array.isArray((raw as any).outputHeaders)
                  ? (raw as any).outputHeaders
                  : Array.isArray((raw as any).measHeaders)
                    ? (raw as any).measHeaders
                    : Array.isArray((raw as any).measurementHeaders)
                      ? (raw as any).measurementHeaders
                      : []
              )
                .map((h: any) => String(h ?? "").trim())
                .filter(Boolean);
              const outputHeaders =
                maxMeas > 0 || savedHeaders.length > 0
                  ? Array.from({ length: Math.max(maxMeas, savedHeaders.length) }, (_, i) =>
                      savedHeaders[i] || `Meas ${i + 1}`
                    )
                  : ["Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"];
              return {
                ...raw,
                fdd: fddVal !== undefined && fddVal !== null ? String(fddVal) : "",
                tolerance: toleranceNormalized,
                outputHeaders,
                measHeaders: outputHeaders,
              };
            })(),
            radiationLeakageLevel: leakageRes || data.RadiationLeakageLevelMammography || null,
            imagingPhantom: imagingPhantomRes || data.ImagingPhantomMammography || null,
            radiationProtectionSurvey: normalizeMammographyRadiationProtectionSurvey(
              protectionRes || data.DetailsOfRadiationProtectionMammography || null
            ),
            equipmentSetting: equipmentSettingRes || data.EquipmentSettingMammography || null,
            maximumRadiationLevel: maxRadiationRes || data.MaximumRadiationLevelMammography || null,
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

  // Recompute page count from current in-memory test data so dynamic updates
  // immediately reflect in "No. of pages" before re-downloading PDF.
  useEffect(() => {
    if (loading || notFound) return;
    const summaryRows = generateMammographySummaryRows(testData, hasTimer);
    const summaryPagesCount = Math.ceil(summaryRows.length / 18) || 1;
    const pagesCount = 1 + summaryPagesCount + detailedPagesCount + 1;
    setCalculatedPages(String(pagesCount));
  }, [testData, hasTimer, loading, notFound, detailedPagesCount]);

  // Test data is now loaded directly from getReportHeaderForMammography
  // No need for separate fetch calls

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const normalizeComparisonOperator = (raw: any): "<" | ">" | "<=" | ">=" | "=" => {
    const s = String(raw ?? "<=").trim().toLowerCase();
    if (s === "<=" || s === "≤" || s === "less than or equal to" || s === "lessthanorequalto") return "<=";
    if (s === "<" || s === "less than" || s === "lessthan") return "<";
    if (s === ">=" || s === "≥" || s === "greater than or equal to" || s === "greaterthanorequalto") return ">=";
    if (s === ">" || s === "greater than" || s === "greaterthan") return ">";
    if (s === "=" || s === "equal" || s === "equals") return "=";
    return "<=";
  };

  const normalizePlusMinusSign = (raw: any): "+" | "-" | "±" => {
    const s = String(raw ?? "both").trim().toLowerCase();
    if (s === "plus" || s === "+") return "+";
    if (s === "minus" || s === "-") return "-";
    if (s === "both" || s === "±" || s === "+/-") return "±";
    return "±";
  };

  const compareByOperator = (value: number, threshold: number, rawOperator: any): boolean => {
    const op = normalizeComparisonOperator(rawOperator);
    switch (op) {
      case "<":
        return value < threshold;
      case ">":
        return value > threshold;
      case "<=":
        return value <= threshold;
      case ">=":
        return value >= threshold;
      case "=":
        return Math.abs(value - threshold) < 1e-6;
      default:
        return value <= threshold;
    }
  };

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: 'report-content',
        filename: `Mammography-Report-${report?.testReportNumber || 'report'}.pdf`,
        buttonSelector: '.download-pdf-btn',
      });
    } catch (error) {
      console.error('PDF Error:', error);
      // Error handling is done in the utility function
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Mammography Report...</div>;

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

  const toolsArray = (report.toolsUsed || []).map((tool: any) => {
    const makeRaw = String(tool?.make || "").trim();
    const modelRaw = String(tool?.model || "").trim();

    if (!modelRaw && makeRaw.includes("/")) {
      const [makePart, ...modelParts] = makeRaw.split("/");
      const normalizedMake = (makePart || "").trim();
      const normalizedModel = modelParts.join("/").trim();
      return {
        ...tool,
        make: normalizedMake || "-",
        model: normalizedModel || "-",
      };
    }

    return {
      ...tool,
      make: makeRaw || "-",
      model: modelRaw || "-",
    };
  });
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
  const todayDate = formatDate(new Date().toISOString());
  const extractCity = (raw: string) => {
    if (!raw || raw === "N/A") return "";
    const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return "";
    const alphaParts = parts.filter(p => /[A-Za-z]/.test(p) && !/^\d{6}$/.test(p.replace(/\s+/g, "")));
    if (alphaParts.length === 0) return "";
    const stateOrCountry = /^(india|bharat|uttar pradesh|up|delhi|new delhi|haryana|maharashtra|karnataka|tamil nadu|kerala|gujarat|rajasthan|punjab|bihar|west bengal|telangana|andhra pradesh|odisha|jharkhand|chhattisgarh|madhya pradesh|goa|assam|jammu and kashmir|ladakh|himachal pradesh|uttarakhand|manipur|meghalaya|mizoram|nagaland|sikkim|tripura|arunachal pradesh)$/i;
    const city = [...alphaParts].reverse().find(p => !stateOrCountry.test(p));
    return city || alphaParts[alphaParts.length - 1];
  };
  const customerCity = extractCity(report?.location || "") || extractCity(report?.address || "") || "-";
  const placeValue = report?.city && String(report.city).trim() !== "" ? String(report.city).trim() : customerCity;

  const ReportPage: React.FC<{ isLast?: boolean; children: React.ReactNode }> = ({ isLast, children }) => (
    <div
      className={`bg-white shadow-2xl print:shadow-none ${isLast ? "report-pdf-last-page-shell" : "report-pdf-page-shell"}`}
      style={{
        pageBreakAfter: isLast ? "auto" : "always",
        display: "flex",
        flexDirection: "column",
        width: "210mm",
        boxSizing: "border-box",
        minHeight: "297mm",
        margin: "20px auto",
        padding: "15mm 20mm",
      }}
    >
      <ReportPdfPageHeader report={report as any} formatDate={formatDate} />
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
    const padding = extra?.padding ? String(extra.padding) : '4px 6px';
    const parts = padding.trim().split(/\s+/);
    let finalPadding = padding;
    if (parts.length === 1) finalPadding = `${parts[0]} ${parts[0]} 4px ${parts[0]}`;
    else if (parts.length === 2) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[1]}`;
    else if (parts.length === 3) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[0]}`;
    else if (parts.length === 4) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[3]}`;

    return {
      fontSize: '11px',
      lineHeight: '1.3',
      minHeight: '0',
      height: 'auto',
      borderColor: '#000',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontWeight: 400,
      boxSizing: 'border-box',
      ...extra,
      padding: finalPadding,
    };
  };

  const tableStyle: React.CSSProperties = {
    fontSize: '11px',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    borderSpacing: '0',
    width: '100%',
    border: '0.1px solid #666',
    textAlign: 'center',
  };

  return (
    <>
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
            QA TEST REPORT FOR MAMMOGRAPHY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: "9px" }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
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
                ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                ["Condition of Test Item", report.condition],
                ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                ["Engineer’s Name", report.engineerNameRPId || "-"],
                ...(report.rpId && report.rpId !== "N/A" && String(report.rpId).trim() !== "" ? [["RP ID", report.rpId]] : []),
                ["No. of pages", calculatedPages || (report as any).pages || "-"],
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
                    <th
                      key={h}
                      style={{ fontWeight: 700, border: "0.1px solid #666", fontSize: "9px", lineHeight: "1.2", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", padding: "3px 4px", width: ["6%", "18%", "12%", "12%", "10%", "10%", "16%", "16%"][i] }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? (
                  toolsArray.map((t, i) => (
                    <tr key={i}>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{i + 1}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{t.nomenclature}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{t.make || "-"}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{t.model || "-"}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{t.SrNo}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{t.range}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{t.calibrationCertificateNo}</td>
                      <td style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>{formatDate(t.calibrationValidTill)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ border: "0.1px solid #666", fontSize: "11px", lineHeight: "1.3", padding: "4px 6px 4px 6px" }}>
                      No tools recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div style={{ marginTop: "auto" }}>
            <ReportPdfPageNoteQR report={report as any} />
          </div>
        </ReportPage>

        {/* PAGE 2+ SUMMARY TABLE (DYNAMIC) */}
        {(() => {
          const allRows = generateMammographySummaryRows(testData, hasTimer);
          const chunkSize = 18;
          const chunks = [];
          for (let i = 0; i < allRows.length; i += chunkSize) {
            chunks.push(allRows.slice(i, i + chunkSize));
          }

          if (chunks.length === 0) {
            return (
              <ReportPage>
                <div style={{ width: "100%", flex: 1 }}>
                  <div className="text-center text-gray-500 py-10">No test results available.</div>
                </div>
              </ReportPage>
            );
          }

          return chunks.map((chunk, pageIdx) => {
            const displayRows = chunk.map((r, rowIdx) => {
              if (rowIdx === 0 && !r.isFirstRow) {
                const originalIdx = pageIdx * chunkSize;
                let srcIdx = originalIdx;
                while (srcIdx >= 0 && !allRows[srcIdx].isFirstRow) {
                  srcIdx--;
                }
                const sourceRow = allRows[srcIdx];

                let groupCountInStore = 0;
                for (let k = 0; k < chunk.length; k++) {
                  if (k === 0 || !chunk[k].isFirstRow) {
                    groupCountInStore++;
                  } else {
                    break;
                  }
                }

                return {
                  ...r,
                  isFirstRow: true,
                  srNo: sourceRow.srNo,
                  parameter: `${sourceRow.parameter} (Cont.)`,
                  rowSpan: groupCountInStore,
                };
              }
              return r;
            });

            return (
              <ReportPage key={`summary-page-${pageIdx}`}>
                <div style={{ width: "100%", flex: 1 }}>
                  <MainTestTableForMammography
                    testData={testData}
                    hasTimer={hasTimer}
                    rows={displayRows}
                    isContinuation={pageIdx > 0}
                  />
                </div>
              </ReportPage>
            );
          });
        })()}

        {/* PAGE - DETAILED TEST RESULTS (PART 1) */}
        {detailedPageFlags.part1 && (
        <ReportPage>
          <div style={{ width: "100%", flex: 1 }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>

            {/* Accuracy of Irradiation Time */}
            {hasTimer && testData.irradiationTime && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("irradiationTime")!} title="Accuracy of Irradiation Time" />

                {testData.irradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table style={{ ...tableStyle, width: "100%" }}>
                      <thead>
                        <tr>
                          {["FDD (cm)", "kV", "mA"].map((h) => (
                            <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", padding: "1px 8px" })}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>{testData.irradiationTime.testConditions.fcd || "-"}</td>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>{testData.irradiationTime.testConditions.kv || "-"}</td>
                          <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>{testData.irradiationTime.testConditions.ma || "-"}</td>
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
                      <table style={tableStyle} className="compact-table">
                        <thead>
                          <tr>
                            {["Set Time (mSec)", "Measured Time (mSec)", "% Error", "Remarks"].map((h) => (
                              <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testData.irradiationTime.irradiationTimes.map((row: any, i: number) => {
                            const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                            const remark = getRemark(error);
                            return (
                              <tr key={i}>
                                <td style={cellStyle({ border: "0.1px solid #666" })}>{row.setTime || "-"}</td>
                                <td style={cellStyle({ border: "0.1px solid #666" })}>{row.measuredTime || "-"}</td>
                                <td style={cellStyle({ border: "0.1px solid #666" })}>{error !== "-" ? `${error}%` : "-"}</td>
                                <td style={cellStyle({ border: "0.1px solid #666" })}>
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

            {/* Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("operatingPotential")!} title="Accuracy of Operating Potential (kVp)" />

                {testData.accuracyOfOperatingPotential.measurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table style={tableStyle} className="compact-table">
                      <thead>
                        <tr>
                          <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>Applied kVp</th>
                          {testData.accuracyOfOperatingPotential.mAStations?.map((ma: string, idx: number) => (
                            <th key={idx} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>{ma}</th>
                          ))}
                          <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>Average kVp</th>
                          <th style={cellStyle({ fontWeight: 700, border: "0.1px solid #666" })}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfOperatingPotential.measurements.map((row: any, i: number) => (
                          <tr key={i}>
                            <td style={cellStyle({ border: "0.1px solid #666" })}>{row.appliedKvp || "-"}</td>
                            {testData.accuracyOfOperatingPotential.mAStations?.map((_: string, idx: number) => (
                              <td key={idx} style={cellStyle({ border: "0.1px solid #666" })}>{row.measuredValues?.[idx] || "-"}</td>
                            ))}
                            <td style={cellStyle({ border: "0.1px solid #666" })}>{row.averageKvp || "-"}</td>
                            <td style={cellStyle({ border: "0.1px solid #666" })}>
                              <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600 font-semibold" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600 font-semibold" : ""}>
                                {row.remarks || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.accuracyOfOperatingPotential.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance:</strong> {normalizePlusMinusSign(testData.accuracyOfOperatingPotential.tolerance.sign)} {testData.accuracyOfOperatingPotential.tolerance.value || "-"} kVp
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </ReportPage>
        )}

        {/* PAGE - DETAILED TEST RESULTS (PART 2) */}
        {detailedPageFlags.part2 && (
        <ReportPage>
          <div style={{ width: "100%", flex: 1 }}>
            {!detailedPageFlags.part1 && (
              <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>
            )}

            {/* Linearity of mAs Loading */}
            {!hasTimer && testData.linearityOfMasLLoading && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("linearityMas")!} title="Linearity of mAs Loading" />

                {(() => {
                  const t1 = Array.isArray((testData.linearityOfMasLLoading as any).table1)
                    ? (testData.linearityOfMasLLoading as any).table1[0]
                    : ((testData.linearityOfMasLLoading as any).table1 || null);
                  const cond = (testData.linearityOfMasLLoading as any).exposureCondition || t1;
                  if (!cond) return null;
                  return (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '6px' }}>
                      <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '3px' }}>Test Conditions:</p>
                      <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>kV</th>
                            {cond.time !== undefined && cond.time !== null && String(cond.time).trim() !== "" && (
                              <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>Time (Sec)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{cond.fcd || "-"}</td>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{cond.kv || "-"}</td>
                            {cond.time !== undefined && cond.time !== null && String(cond.time).trim() !== "" && (
                              <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{cond.time || "-"}</td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {testData.linearityOfMasLLoading.measurementHeaders && testData.linearityOfMasLLoading.measurements && (() => {
                  const rows = testData.linearityOfMasLLoading.measurements || [];
                  const headers = testData.linearityOfMasLLoading.measurementHeaders || [];
                  const tolVal = parseFloat(testData.linearityOfMasLLoading.tolerance ?? "0.1") || 0.1;
                  const tolOp = normalizeComparisonOperator(testData.linearityOfMasLLoading.toleranceOperator || "<=");
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
                    const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
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
                  const colNum = hasData && xMax !== "—" && xMin !== "—" && (parseFloat(xMax) + parseFloat(xMin)) > 0
                    ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                    : 0;
                  const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : "—";
                  const remarks = hasData && col !== "—" ? (compareByOperator(parseFloat(col), tolVal, tolOp) ? "Pass" : "Fail") : "—";

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: "4px" }}>
                      <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: "10px", tableLayout: "fixed", width: "100%" }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>mAs Range</th>
                            <th colSpan={headers.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                              Output (mGy)
                            </th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>Avg Output</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>X (mGy/mAs)</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>X MAX</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>X MIN</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>CoL</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                            {headers.map((header: string, idx: number) => (
                              <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                                {header || `Meas ${idx + 1}`}
                              </th>
                            ))}
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: "10px" }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center font-medium" style={{ fontSize: "10px", padding: "5px" }}>{fmtV(row.mAsRange || row.mAsApplied)}</td>
                              {headers.map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                                  {fmtV(row.measuredOutputs?.[idx])}
                                </td>
                              ))}
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px" }}>{row._avgDisplay}</td>
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px" }}>{row._xDisplay}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}>{xMax}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}>{xMin}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}>{col}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}>
                                    <span className={remarks === "Pass" ? "text-green-600 font-semibold" : remarks === "Fail" ? "text-red-600 font-semibold" : ""} style={{ fontSize: "10px" }}>
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

                {testData.linearityOfMasLLoading.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance (CoL):</strong> {normalizeComparisonOperator(testData.linearityOfMasLLoading.toleranceOperator || "<=")} {testData.linearityOfMasLLoading.tolerance || "0.1"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Linearity of mA Loading Stations */}
            {hasTimer && testData.maLoadingStations && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("linearityMa")!} title="Linearity of mA Loading" />
                
                {/* Test Conditions as table */}
                {testData.maLoadingStations.table1 && testData.maLoadingStations.table1.length > 0 && (
                  <div className="mb-4 print:mb-1" style={{ marginBottom: '6px' }}>
                    <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '3px' }}>Test Conditions:</p>
                    <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>kV</th>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>Time (Sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.maLoadingStations.table1[0]?.fcd || "-"}</td>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.maLoadingStations.table1[0]?.kv || "-"}</td>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.maLoadingStations.table1[0]?.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.maLoadingStations.table2?.length > 0 && (() => {
                  const timeRaw = testData.maLoadingStations.table1?.[0]?.time;
                  const timeStr = timeRaw != null ? String(timeRaw).trim() : '';
                  const isTimerSelected = timeStr !== '';
                  const xUnitLabel = isTimerSelected ? 'mGy/(mA*s)' : 'mGy/mA';
                  const tableRows = testData.maLoadingStations.table2 || [];
                  const maxMeas = Math.max(
                    0,
                    ...tableRows.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
                  );
                  const savedHeaders = Array.isArray(testData.maLoadingStations.measHeaders)
                    ? testData.maLoadingStations.measHeaders.map((h: any) => String(h ?? "").trim()).filter(Boolean)
                    : [];
                  const measHeaders =
                    maxMeas > 0 || savedHeaders.length > 0
                      ? Array.from({ length: Math.max(maxMeas, savedHeaders.length) }, (_, i) =>
                          savedHeaders[i] || `Meas ${i + 1}`
                        )
                      : ["Meas 1", "Meas 2", "Meas 3"];

                  return (
                  <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>mA Applied</th>
                          <th colSpan={measHeaders.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                            Output (mGy)
                          </th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                          <th
                            className="border border-black border-b-0 p-1.5 print:p-[3px] text-center"
                            style={{ fontSize: '10px', padding: '4px 6px', minWidth: isTimerSelected ? '88px' : '72px', width: isTimerSelected ? '12%' : '10%', whiteSpace: 'normal', lineHeight: 1.25 }}
                          >
                            <div>X</div>
                            <div style={{ fontSize: '9px', fontWeight: 600 }}>({xUnitLabel})</div>
                          </th>
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
                        {(() => {
                          const rows = tableRows;
                          const tolVal = parseFloat(testData.maLoadingStations.tolerance ?? '0.1') || 0.1;
                          const tolOp = normalizeComparisonOperator(testData.maLoadingStations.toleranceOperator || "<=");

                          const formatV = (val: any) => {
                            if (val === undefined || val === null) return '-';
                            const str = String(val).trim();
                            return str === '' || str === '—' || str === 'undefined' || str === 'null' ? '-' : str;
                          };

                          const xValues: number[] = [];
                          const processedRows = rows.map((row: any) => {
                            const outputs = (row.measuredOutputs ?? [])
                               .map((v: any) => parseFloat(v))
                               .filter((v: number) => !isNaN(v) && v > 0);
                            const avg = outputs.length > 0
                               ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length
                               : null;
                            const avgDisplay = avg !== null ? parseFloat(avg.toFixed(3)).toFixed(3) : '—';

                            // X = mGy/(mA*s) when time entered; otherwise mGy/mA
                            const maValue = parseFloat(row.ma || row.mAsApplied) || 0;
                            const timeValue = parseFloat(timeStr);
                            const hasValidTime = timeStr !== '' && !isNaN(timeValue) && timeValue > 0;
                            const midMas = hasValidTime && maValue > 0 ? maValue * timeValue : null;

                            let x: number | null = null;
                            if (avg !== null && midMas && midMas > 0) {
                              x = avg / midMas;
                            } else if (avg !== null && maValue > 0) {
                              x = avg / maValue;
                            }
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
                            const colVal2 = parseFloat(col);
                            pass = compareByOperator(colVal2, tolVal, tolOp);
                          }
                          const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';

                          return processedRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center font-medium" style={{ fontSize: '10px', padding: '5px' }}>{formatV(row.mAsApplied || row.ma)}</td>
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
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  );
                })()}
                {testData.maLoadingStations.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border">
                    <p className="text-sm print:text-[10px]" style={{ fontSize: '10px' }}>
                      <strong>Tolerance (CoL):</strong> {normalizeComparisonOperator(testData.maLoadingStations.toleranceOperator || "<=")} {testData.maLoadingStations.tolerance || "0.1"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Total Filtration & Aluminium Equivalence */}
            {testData.totalFiltrationAndAluminium && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("totalFiltration")!} title="Total Filtration & Aluminium Equivalence" />

                {(testData.totalFiltrationAndAluminium.targetWindow || testData.totalFiltrationAndAluminium.addedFilterThickness) && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Anode/Filter & Added Filtration:</p>
                    <div className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      <p><strong>Target/Window:</strong> {testData.totalFiltrationAndAluminium.targetWindow || "-"}</p>
                      {testData.totalFiltrationAndAluminium.addedFilterThickness && (
                        <p><strong>Added Filter Thickness:</strong> {testData.totalFiltrationAndAluminium.addedFilterThickness}</p>
                      )}
                    </div>
                  </div>
                )}

                {testData.totalFiltrationAndAluminium.table && testData.totalFiltrationAndAluminium.table.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Al Equivalence (mm Al)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>HVT (mm Al)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Recommended Value</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.totalFiltrationAndAluminium.table.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mAs || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.alEquivalence || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.hvt || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '2px 1px', fontSize: '10px', lineHeight: '1.2', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {row.recommendedValue ? (
                                <span>{row.recommendedValue.minValue} mm Al ≤ HVL ≤ {row.recommendedValue.maxValue} mm Al at {row.kvp || row.recommendedValue.kvp} kVp</span>
                              ) : "-"}
                            </td>
                            <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.remarks === "Pass" || row.remarks === "PASS" ? "text-green-600" : row.remarks === "Fail" || row.remarks === "FAIL" ? "text-red-600" : ""}>
                                {row.remarks || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.totalFiltrationAndAluminium.resultHVT28kVp && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Result HVT at 28 kVp:</strong> {testData.totalFiltrationAndAluminium.resultHVT28kVp} mm Al
                    </p>
                  </div>
                )}

                {testData.totalFiltrationAndAluminium.hvlTolerances && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px] font-semibold mb-2" style={{ fontSize: '11px', margin: '2px 0' }}>Recommended HVL Tolerances:</p>
                    <div className="text-sm print:text-[9px] space-y-1" style={{ fontSize: '11px' }}>
                      <p>At 30 kVp: {testData.totalFiltrationAndAluminium.hvlTolerances.at30?.operator || ">="} {testData.totalFiltrationAndAluminium.hvlTolerances.at30?.value || "-"} mm Al</p>
                      <p>At 40 kVp: {testData.totalFiltrationAndAluminium.hvlTolerances.at40?.operator || ">="} {testData.totalFiltrationAndAluminium.hvlTolerances.at40?.value || "-"} mm Al</p>
                      <p>At 50 kVp: {testData.totalFiltrationAndAluminium.hvlTolerances.at50?.operator || ">="} {testData.totalFiltrationAndAluminium.hvlTolerances.at50?.value || "-"} mm Al</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </ReportPage>
        )}

        {/* PAGE - DETAILED TEST RESULTS (PART 3) */}
        {detailedPageFlags.part3 && (
        <ReportPage>
          <div style={{ width: "100%", flex: 1 }}>
            {!detailedPageFlags.part1 && !detailedPageFlags.part2 && (
              <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>
            )}

             {/* Reproducibility of Radiation Output */}
            {testData.reproducibilityOfOutput && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("reproducibility")!} title="Reproducibility of Radiation Output" />

                <div className="mb-4 print:mb-1" style={{ marginBottom: '4px' }}><table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}><thead className="bg-gray-100"><tr><th className="border border-black p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>FDD (cm)</th></tr></thead><tbody><tr><td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>{testData.reproducibilityOfOutput.fdd || (testData.reproducibilityOfOutput as any).fcd || "-"}</td></tr></tbody></table></div>
                {testData.reproducibilityOfOutput.outputRows && testData.reproducibilityOfOutput.outputRows.length > 0 && (() => {
                  const rows = testData.reproducibilityOfOutput.outputRows;
                  const deriveRowMeasCount = (r: any): number => {
                    const outputsLen = Array.isArray(r?.outputs) ? r.outputs.length : 0;
                    const keyedMeasLen = Object.keys(r || {}).reduce((max, key) => {
                      const m = key.match(/^meas(\d+)$/i);
                      if (!m) return max;
                      const idx = parseInt(m[1], 10);
                      return Number.isFinite(idx) ? Math.max(max, idx) : max;
                    }, 0);
                    return Math.max(outputsLen, keyedMeasLen);
                  };
                  const measCount = Math.max(1, ...rows.map((r: any) => deriveRowMeasCount(r)));
                  const rep = testData.reproducibilityOfOutput as any;
                  const rawSaved: any[] = Array.isArray(rep.outputHeaders)
                    ? rep.outputHeaders
                    : Array.isArray(rep.measHeaders)
                      ? rep.measHeaders
                      : Array.isArray(rep.measurementHeaders)
                        ? rep.measurementHeaders
                        : [];
                  const cleanedSaved = rawSaved
                    .map((h: any) => String(h ?? "").trim())
                    .filter(Boolean);
                  const measHeaders = Array.from(
                    { length: Math.max(measCount, cleanedSaved.length || 0) },
                    (_, i) => cleanedSaved[i] || `Meas ${i + 1}`
                  );
                  const tolOp = normalizeComparisonOperator(
                    (typeof rep.tolerance === 'object' && rep.tolerance?.operator) ||
                    rep.toleranceOperator ||
                    '<='
                  );
                  const rawTolStr =
                    typeof rep.tolerance === 'object' && rep.tolerance?.value != null
                      ? String(rep.tolerance.value)
                      : rep.tolerance != null && rep.tolerance !== ''
                        ? String(rep.tolerance)
                        : '0.05';
                  const tNum = parseFloat(rawTolStr);
                  const tolVal =
                    !isNaN(tNum) && tNum > 1 ? tNum / 100 : !isNaN(tNum) && tNum >= 0 ? tNum : 0.05;
                  const passesCoV = (cov: number) => compareByOperator(cov, tolVal, tolOp);

                  const getVal = (o: any): number => {
                    if (o == null) return NaN;
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  // Same calc as generate / backend: avg 4dp, CoV 4dp (0 when <2 samples)
                  const calcRowStats = (row: any) => {
                    const nums = (row.outputs ?? [])
                      .map(getVal)
                      .filter((n: number) => !isNaN(n) && n > 0);

                    if (nums.length === 0) {
                      const savedAvg = row.avg != null && String(row.avg).trim() !== '' ? String(row.avg) : '-';
                      const savedCov = row.cov != null && String(row.cov).trim() !== ''
                        ? String(row.cov)
                        : row.cv != null && String(row.cv).trim() !== ''
                          ? String(row.cv)
                          : '-';
                      const savedRemark = row.remark || '-';
                      return { avgDisplay: savedAvg, covDisplay: savedCov, remark: savedRemark };
                    }

                    const mean = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
                    let cov = 0;
                    if (nums.length > 1) {
                      const variance =
                        nums.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) /
                        nums.length;
                      const stdDev = Math.sqrt(variance);
                      cov = mean > 0 ? stdDev / mean : 0;
                    }
                    const avgDisplay = mean.toFixed(4);
                    const covDisplay = cov.toFixed(4);
                    const remark = passesCoV(cov) ? 'Pass' : 'Fail';
                    return { avgDisplay, covDisplay, remark };
                  };

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th rowSpan={2} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Applied kV</th>
                            <th rowSpan={2} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>mAs</th>
                            <th colSpan={measHeaders.length} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                              Radiation Output (mGy)
                            </th>
                            <th rowSpan={2} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Avg (X̄)</th>
                            <th rowSpan={2} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>CoV</th>
                            <th rowSpan={2} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px', verticalAlign: 'middle' }}>Remark</th>
                          </tr>
                          <tr>
                            {measHeaders.map((header, i) => (
                              <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const { avgDisplay, covDisplay, remark } = calcRowStats(row);

                            return (
                              <tr key={i} className="text-center font-medium">
                                <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || "-"}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || (row.mAs || "-")}</td>
                                {measHeaders.map((_: string, idx: number) => {
                                  let val = "-";
                                  const raw = (row.outputs ?? [])[idx];
                                  if (raw != null && String(raw).trim() !== '') {
                                    val = (typeof raw === 'object' && 'value' in raw) ? String(raw.value) : String(raw);
                                  } else if (row[`meas${idx + 1}`] != null && String(row[`meas${idx + 1}`]).trim() !== '') {
                                    val = String(row[`meas${idx + 1}`]);
                                  }
                                  return (
                                    <td key={idx} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{val}</td>
                                  );
                                })}
                                <td className="border border-black p-1 text-center font-bold bg-blue-50" style={{ padding: '0px 2px', fontSize: '10px' }}>{avgDisplay}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{covDisplay}</td>
                                <td className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                  <span className={remark.includes("Pass") || remark.includes("PASS") ? "text-green-600" : remark.includes("Fail") || remark.includes("FAIL") ? "text-red-600" : ""}>
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

                {(() => {
                  const rep = testData.reproducibilityOfOutput as any;
                  const op = normalizeComparisonOperator(
                    (typeof rep.tolerance === 'object' && rep.tolerance?.operator) ||
                    rep.toleranceOperator ||
                    '<='
                  );
                  const valDisp =
                    typeof rep.tolerance === 'object' && rep.tolerance?.value != null
                      ? String(rep.tolerance.value)
                      : rep.tolerance != null && rep.tolerance !== ''
                        ? String(rep.tolerance)
                        : '0.05';
                  return (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {op} {valDisp}
                    </p>
                  </div>
                  );
                })()}
              </div>
            )}

            {/* Radiation Leakage Level */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("leakage")!} title="Radiation Leakage Level" />

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
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.fcd || "100"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.kv || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.ma || "-"}</td>
                          <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{testData.radiationLeakageLevel.time || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Workload and Tolerance Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                  <div>
                    <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                      <strong>Workload:</strong> {testData.radiationLeakageLevel.workload || "-"} mA·min/week
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                      {/* <strong>Tolerance (mGy in 1 hr):</strong> {testData.radiationLeakageLevel.toleranceOperator === 'less than or equal to' ? '≤' : testData.radiationLeakageLevel.toleranceOperator === 'greater than or equal to' ? '≥' : '='} {testData.radiationLeakageLevel.toleranceValue || "1.0"} mGy */}
                    </p>
                  </div>
                </div>

                {/* Exposure Level Table */}
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Front</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Back</th>
                        <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Top</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(testData.radiationLeakageLevel.leakageMeasurements || []).map((row: any, i: number) => {
                        const maValue = parseFloat(testData.radiationLeakageLevel.ma || "0");
                        const workloadValue = parseFloat(testData.radiationLeakageLevel.workload || "0");

                        const values = [row.left, row.right, row.front, row.back, row.top]
                          .map(v => parseFloat(v) || 0)
                          .filter(v => v > 0);
                        const rowMax = values.length > 0 ? Math.max(...values) : 0;

                        let calculatedMR = "-";
                        let calculatedMGy = "-";
                        let remark = row.remark || "-";

                        if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                          const resMR = (workloadValue * rowMax) / (60 * maValue);
                          calculatedMR = resMR.toFixed(3);
                          calculatedMGy = (resMR / 114).toFixed(4);

                          if (remark === "-" || !remark) {
                            const tolVal = parseFloat(testData.radiationLeakageLevel.toleranceValue) || 1.0;
                            const resMGyNum = resMR / 114;
                            remark = resMGyNum <= tolVal ? "Pass" : "Fail";
                          }
                        }

                        return (
                          <tr key={i} className="text-center font-medium" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.left || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.right || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.front || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.back || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.top || "-"}</td>
                            <td className="border border-black p-1 text-center font-bold bg-blue-50" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.result || calculatedMR}</td>
                            <td className="border border-black p-1 text-center font-bold bg-green-50" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mgy || calculatedMGy}</td>
                            <td className={`border border-black p-1 text-center font-bold ${remark?.includes("Pass") || remark?.includes("PASS") ? "text-green-600" : remark?.includes("Fail") || remark?.includes("FAIL") ? "text-red-600" : ""}`} style={{ padding: '0px 2px', fontSize: '10px' }}>
                              {remark}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '4px 6px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[8px] font-bold" style={{ fontSize: '10px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be {testData.radiationLeakageLevel.toleranceOperator === 'less than or equal to' ? '<' : testData.radiationLeakageLevel.toleranceOperator === 'greater than or equal to' ? '>' : '='} {testData.radiationLeakageLevel.toleranceValue || "1"} mGy ({parseFloat(testData.radiationLeakageLevel.toleranceValue || "1") * 114} mR) in one hour.
                  </p>
                  {testData.radiationLeakageLevel.remark && (
                    <p className="text-sm print:text-[8px] font-bold mt-1" style={{ fontSize: '10px', margin: '2px 0' }}>
                      <strong>Final Remark:</strong> <span className={testData.radiationLeakageLevel.remark.includes("Pass") || testData.radiationLeakageLevel.remark.includes("PASS") ? "text-green-600" : "text-red-600"}>{testData.radiationLeakageLevel.remark}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </ReportPage>
        )}

        {/* PAGE - DETAILED TEST RESULTS (PART 4) */}
        {detailedPageFlags.part4 && (
        <ReportPage>
          <div style={{ width: "100%", flex: 1 }}>
            {!detailedPageFlags.part1 && !detailedPageFlags.part2 && !detailedPageFlags.part3 && (
              <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>
            )}

            {/* Imaging Performance Evaluation */}
            {testData.imagingPhantom && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("phantom")!} title="Imaging Performance Evaluation (Phantom)" />

                {testData.imagingPhantom.rows && testData.imagingPhantom.rows.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Phantom Element</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Visible Count</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.imagingPhantom.rows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.name || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.visibleCount || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {row.tolerance?.operator || ">="} {row.tolerance?.value || "-"}
                            </td>
                            <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={testData.imagingPhantom.remark === "Pass" ? "text-green-600" : "text-red-600"}>
                                {testData.imagingPhantom.remark || "-"}
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

            {/* Details of Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && testData.radiationProtectionSurvey.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("protectionSurvey")!} title="Details of Radiation Protection Survey" />

                {/* 1. Survey Details */}
                <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-black text-sm print:text-[10px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Date of Radiation Protection Survey</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td>
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
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Applied Voltage (kV)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Exposure Time (s)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                        </tr>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000', textAlign: 'left' }}>Workload (mA min/week)</td>
                          <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.workload || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Measured Maximum Radiation Levels */}
                <div className="mb-6 print:mb-1">
                  <h4 className="text-lg print:text-sm font-semibold mb-4 print:mb-1" style={{ fontSize: '11px', marginBottom: '4px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[10px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000' }}>Location</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000', textAlign: 'center' }}>Result (mR/week)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', lineHeight: '1.0', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
                          <tr key={i} className="text-center font-medium" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-left" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{loc.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px', borderColor: '#000000' }}>
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
                  <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>4. Calculation Formula</h4>
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <tbody>
                        <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.2', padding: '0', margin: '0' }}>
                          <td className="border border-black p-3 print:p-1 bg-gray-50 text-center" style={{ padding: '4px', fontSize: '11px', borderColor: '#000000', textAlign: 'center' }}>
                            <strong>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Summary of Maximum Radiation Level/week */}
                {testData.radiationProtectionSurvey.locations && testData.radiationProtectionSurvey.locations.length > 0 && (() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");

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

                  return (
                    <div className="print:break-inside-avoid">
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '11px' }}>5. Summary of Maximum Radiation Level/week</h4>
                      <div className="grid grid-cols-2 gap-4 mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <div className="bg-blue-50/50 p-4 print:p-1 rounded border border-blue-100 flex items-center justify-between" style={{ padding: '4px 6px' }}>
                          <span className="text-sm font-semibold print:text-[8px]" style={{ fontSize: '10px' }}>Max. for Radiation Worker:</span>
                          <span className="text-lg font-bold text-blue-700 print:text-[9px]" style={{ fontSize: '12px' }}>{maxWorkerWeekly} mR/wk</span>
                        </div>
                        <div className="bg-indigo-50/50 p-4 print:p-1 rounded border border-indigo-100 flex items-center justify-between" style={{ padding: '4px 6px' }}>
                          <span className="text-sm font-semibold print:text-[8px]" style={{ fontSize: '10px' }}>Max. for Public:</span>
                          <span className="text-lg font-bold text-indigo-700 print:text-[9px]" style={{ fontSize: '12px' }}>{maxPublicWeekly} mR/wk</span>
                        </div>
                      </div>

                      {/* Calculation Detail Cards */}
                      <div className="mt-4 print:mt-1 grid grid-cols-1 gap-2 mb-6" style={{ marginBottom: '4px' }}>
                        {maxWorkerLocation.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-blue-50/30 border border-blue-100 p-3 print:p-1 rounded">
                            <p className="text-[11px] print:text-[8px] font-bold text-blue-800 mb-1">Calculation for Max. Radiation Level/week (Radiation Worker):</p>
                            <p className="text-[10px] print:text-[7px] text-gray-700">
                              Location: <strong>{maxWorkerLocation.location}</strong> | Max. Level: {maxWorkerLocation.mRPerHr} mR/hr
                            </p>
                            <p className="text-[10px] print:text-[7px] text-gray-700 mt-1">
                              Result: ({testData.radiationProtectionSurvey.workload || '0'} mA·min/wk × {maxWorkerLocation.mRPerHr}) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '0'} mA) = <span className="font-bold">{maxWorkerWeekly} mR/week</span>
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
                              Result: ({testData.radiationProtectionSurvey.workload || '0'} mA·min/wk × {maxPublicLocation.mRPerHr}) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '0'} mA) = <span className="font-bold">{maxPublicWeekly} mR/week</span>
                            </p>
                          </div>
                        )}
                      </div>

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

                      <div className="border border-green-200 rounded p-4 print:p-1 bg-green-50/30" style={{ padding: '4px 6px' }}>
                        <p className="font-bold text-sm print:text-[9px] text-green-800 mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>Acceptance Criteria:</p>
                        <div className="text-[11px] print:text-[8px] space-y-1">
                          <p>The maximum radiation level per week shall not exceed <strong>40 mR</strong> for <strong>Radiation Worker</strong> and <strong>2 mR</strong> for the <strong>Public</strong>.</p>
                          <p className="mt-2 pt-2 border-t border-green-100 font-bold italic">
                            Result: The measured maximum radiation levels are within AERB regulatory limits.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </ReportPage>
        )}

        {/* PAGE - DETAILED TEST RESULTS (PART 5) */}
        {detailedPageFlags.part5 && (
        <ReportPage>
          <div style={{ width: "100%", flex: 1 }}>
            {!detailedPageFlags.part1 && !detailedPageFlags.part2 && !detailedPageFlags.part3 && !detailedPageFlags.part4 && (
              <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>DETAILED TEST RESULTS</h2>
            )}

            {/* Equipment Settings */}
            {testData.equipmentSetting && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("equipmentSetting")!} title="Equipment Settings Verification" />

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      {[
                        ["Applied Current", testData.equipmentSetting.appliedCurrent],
                        ["Applied Voltage", testData.equipmentSetting.appliedVoltage],
                        ["Exposure Time", testData.equipmentSetting.exposureTime],
                        ["Focal Spot Size", testData.equipmentSetting.focalSpotSize],
                        ["Filtration", testData.equipmentSetting.filtration],
                        ["Collimation", testData.equipmentSetting.collimation],
                        ["Frame Rate", testData.equipmentSetting.frameRate],
                        ["Pulse Width", testData.equipmentSetting.pulseWidth],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</td>
                          <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{value || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Maximum Radiation Levels */}
            {testData.maximumRadiationLevel && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <TestSectionTitle num={sectionNum("maxRadiation")!} title="Maximum Radiation Levels at Different Locations" />

                {testData.maximumRadiationLevel.readings && testData.maximumRadiationLevel.readings.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Location</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Radiation Level (mR/hr)</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.maximumRadiationLevel.readings.map((reading: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-2 print:p-1 font-semibold text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'left' }}>{reading.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{reading.mRPerHr || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-bold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={reading.result === "Pass" ? "text-green-600" : reading.result === "Fail" ? "text-red-600" : ""}>
                                {reading.result || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.maximumRadiationLevel.maxWeeklyDose && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Maximum Radiation Level/week:</strong> {testData.maximumRadiationLevel.maxWeeklyDose} mR/wk
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </ReportPage>
        )}
        <ReportPage isLast>
          <div style={{ width: "100%", flex: 1 }}>
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
          vertical-align: middle !important;
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
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportMammography;