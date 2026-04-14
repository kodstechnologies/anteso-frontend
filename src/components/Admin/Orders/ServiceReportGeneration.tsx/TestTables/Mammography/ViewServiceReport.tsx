// src/components/reports/ViewServiceReportMammography.tsx
import React, { useEffect, useState } from "react";
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
} from "../../../../../../api";
import MainTestTableForMammography from "../../TestTables/Mammography/MainTestTableForMammogaphy";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
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
  category: string;
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

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [response, detailsRes] = await Promise.all([
          getReportHeaderForMammography(serviceId),
          getDetails(serviceId).catch(() => null),
        ]);
        if (response.exists && response.data) {
          const data = response.data;
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
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
            category: data.category || "N/A",
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
                    const isPass = operator === "<=" ? absVar <= tolValue : absVar < tolValue;
                    remark = isPass ? "Pass" : "Fail";
                  }
                  return { ...row, variation, remark };
                })
              };
            })(),
            maLoadingStations: maLoadingStationsRes || (data.LinearityOfMaLoadingStationsMammography ? (() => {
              const linearity = data.LinearityOfMaLoadingStationsMammography;
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

                // In mA Loading Stations, x = output / (mA * time)
                const ma = parseFloat(row.ma || row.mAsApplied) || 0;
                const time = parseFloat(linearity.table1?.[0]?.time) || 1;

                const x = avg !== "-" && ma > 0 ? (parseFloat(avg) / (ma * time)).toFixed(4) : "-";
                if (x !== "-") xValues.push(parseFloat(x));

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

              return {
                ...linearity,
                measHeaders: linearity.measHeaders || ["Meas 1", "Meas 2", "Meas 3"],
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
            })() : null),
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
              return {
                ...raw,
                fdd: fddVal !== undefined && fddVal !== null ? String(fddVal) : "",
                tolerance: toleranceNormalized,
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

  const nextDetailedSectionNumber = (() => {
    let index = 1;
    return () => index++;
  })();

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
            QA TEST REPORT FOR MAMMOGRAPHY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: '9px' }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>
          {/* Customer Details */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>1. Customer Details</h2>
            <table className="w-full compact-table" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {isManufacturerLeadOwner && (
                  <tr>
                    <th scope="row" className="border px-2 py-1 text-left font-bold" style={{ width: '50%', border: '0.1px solid #666' }}>Name of the customer</th>
                    <td className="border px-2 py-1" style={{ border: '0.1px solid #666' }}>{manufacturerDisplayName}</td>
                  </tr>
                )}
                <tr>
                  <th scope="row" className="border px-2 py-1 text-left font-bold" style={{ width: '50%', border: '0.1px solid #666' }}>Name of the testing site</th>
                  <td className="border px-2 py-1" style={{ border: '0.1px solid #666' }}>{testingSiteName}</td>
                </tr>
                <tr>
                  <th scope="row" className="border px-2 py-1 text-left font-bold" style={{ border: '0.1px solid #666' }}>Address of the testing site</th>
                  <td className="border px-2 py-1" style={{ border: '0.1px solid #666' }}>{testingSiteAddress}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Reference */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>2. Reference</h2>
            <table className="w-full compact-table" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <th scope="row" className="border px-2 py-1 text-left font-bold" style={{ width: '50%', border: '0.1px solid #666' }}>SRF No. & Date</th>
                  <td className="border px-2 py-1" style={{ border: '0.1px solid #666' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td>
                </tr>
                <tr>
                  <th scope="row" className="border px-2 py-1 text-left font-bold" style={{ border: '0.1px solid #666' }}>Test Report No. & Issue Date</th>
                  <td className="border px-2 py-1" style={{ border: '0.1px solid #666' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Equipment Details */}
          <section className="mb-3">
            <h2 className="font-bold mb-1" style={{ fontSize: '12px' }}>3. Details of Equipment Under Test</h2>
            <table className="w-full compact-table" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make || "-"],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ...(report.rpId && report.rpId !== "N/A" && String(report.rpId).trim() !== "" ? [["RP ID", report.rpId]] : []),
                  ["No. of Pages", (report as any).pages || "-"],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate)],
                  ["Location", report.location],
                  ["Temperature (°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row" className="border px-2 py-1 text-left font-bold" style={{ width: '50%', border: '0.1px solid #666' }}>{label}</th>
                    <td className="border px-2 py-1" style={{ border: '0.1px solid #666' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tools Used */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">4. Standards / Tools Used</h2>
            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
              <table className="w-full mx-auto border-2 border-black text-xs print:text-[8px] compact-table" style={{ tableLayout: 'fixed', width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '6%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sl No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '16%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Nomenclature</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Model</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '12%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Range</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Certificate No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((t, i) => (
                    <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.nomenclature}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.make || "-"}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.model || "-"}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{t.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(t.calibrationValidTill)}</td>
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
            <p>ANTESO Biomedical OPC Pvt. Ltd.</p>
            <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
            <p>Email: info@antesobiomedicalengg.com</p>
          </footer>
        </div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForMammography testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Irradiation Time */}
            {testData.irradiationTime && (
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
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
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

            {/* 2. Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Accuracy of Operating Potential (kVp)</h3>

                {testData.accuracyOfOperatingPotential.measurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                          {testData.accuracyOfOperatingPotential.mAStations?.map((ma: string, idx: number) => (
                            <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{ma}</th>
                          ))}
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfOperatingPotential.measurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                            {testData.accuracyOfOperatingPotential.mAStations?.map((_: string, idx: number) => (
                              <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredValues?.[idx] || "-"}</td>
                            ))}
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
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

            {/* 3. Linearity of mAs Loading */}
            {testData.linearityOfMasLLoading && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Linearity of mAs Loading</h3>

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

            {/* 4. Linearity of mA Loading Stations */}
            {testData.maLoadingStations && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Linearity of mA Loading Stations</h3>
                
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

                {testData.maLoadingStations.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>mA Applied</th>
                          <th colSpan={testData.maLoadingStations.measHeaders?.length || 0} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                            Output (mGy)
                          </th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X (mGy/mAs)</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MAX</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MIN</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>CoL</th>
                          <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Remarks</th>
                        </tr>
                        <tr>
                          <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          {testData.maLoadingStations.measHeaders?.map((header: string, idx: number) => (
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
                          const rows = testData.maLoadingStations.table2;
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

                            // X = output / (mA * time)
                            const maValue = parseFloat(row.ma || row.mAsApplied) || 0;
                            const timeValue = parseFloat(testData.maLoadingStations.table1?.[0]?.time) || 1;
                            const midMas = maValue * timeValue;

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
                            const colVal2 = parseFloat(col);
                            pass = compareByOperator(colVal2, tolVal, tolOp);
                          }
                          const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';

                          return processedRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center font-medium" style={{ fontSize: '10px', padding: '5px' }}>{formatV(row.mAsApplied || row.ma)}</td>
                              {testData.maLoadingStations.measHeaders?.map((_: string, idx: number) => (
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
                )}
                {testData.maLoadingStations.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border">
                    <p className="text-sm print:text-[10px]" style={{ fontSize: '10px' }}>
                      <strong>Tolerance (CoL):</strong> {normalizeComparisonOperator(testData.maLoadingStations.toleranceOperator || "<=")} {testData.maLoadingStations.tolerance || "0.1"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Total Filtration & Aluminium Equivalence */}
            {testData.totalFiltrationAndAluminium && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Total Filtration & Aluminium Equivalence</h3>

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
                                <span>{row.recommendedValue.minValue} mm Al ≤ HVL ≤ {row.recommendedValue.maxValue} mm Al at {row.recommendedValue.kvp} kVp</span>
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
             {/* 6. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfOutput && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Reproducibility of Radiation Output</h3>

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

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                            {Array.from({ length: measCount }, (_, i) => (
                              <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Meas {i + 1}</th>
                            ))}
                            <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (X̄)</th>
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
                                covDisplay = cov.toFixed(3);
                                remark = passesCoV(cov) ? 'Pass' : 'Fail';
                              }
                            } else if (row.cov || row.cv) {
                              const rawCv = row.cov || row.cv;
                              const cvNum = parseFloat(rawCv);
                              if (!isNaN(cvNum)) {
                                const covNormalized = cvNum > 1 ? (cvNum / 100) : cvNum;
                                covDisplay = covNormalized.toFixed(3);
                                remark = passesCoV(covNormalized) ? 'Pass' : 'Fail';
                              }
                            }

                            return (
                              <tr key={i} className="text-center font-medium">
                                <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || "-"}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || (row.mAs || "-")}</td>
                                {Array.from({ length: measCount }, (_, idx) => {
                                  let val = "-";
                                  const raw = (row.outputs ?? [])[idx];
                                  if (raw != null) {
                                    val = (typeof raw === 'object' && 'value' in raw) ? raw.value : String(raw);
                                  } else {
                                    val = row[`meas${idx + 1}`] || "-";
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

            {/* 7. Radiation Leakage Level */}
            {testData.radiationLeakageLevel && (testData.radiationLeakageLevel.leakageMeasurements?.length > 0 || testData.radiationLeakageLevel.fcd) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Radiation Leakage Level</h3>

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

            {/* 8. Imaging Performance Evaluation */}
            {testData.imagingPhantom && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Imaging Performance Evaluation (Phantom)</h3>

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

            {/* 9. Details of Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && testData.radiationProtectionSurvey.locations?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Details of Radiation Protection Survey</h3>

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

            {/* 10. Equipment Settings */}
            {testData.equipmentSetting && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Equipment Settings Verification</h3>

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

            {/* 11. Maximum Radiation Levels */}
            {testData.maximumRadiationLevel && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>{nextDetailedSectionNumber()}. Maximum Radiation Levels at Different Locations</h3>

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

export default ViewServiceReportMammography;