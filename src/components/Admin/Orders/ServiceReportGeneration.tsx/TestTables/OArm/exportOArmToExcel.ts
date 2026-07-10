import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import {
  appendRadiographyStyleSection,
  linearityMaSection,
  linearityMasSection,
  oarmOutputConsistencySection,
  totalFiltrationSection,
} from "../shared/radiographyStyleExcelSections";

export interface OArmExportData {
  reportHeader?: any;
  accuracyOfIrradiationTime?: any;
  totalFiltration?: any;
  outputConsistency?: any;
  highContrastResolution?: any;
  lowContrastResolution?: any;
  exposureRateAtTableTop?: any;
  tubeHousingLeakage?: any;
  linearityOfMasLoading?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

const addSection = (allData: any[][], title: string, headers: string[], rows: any[][]) => {
  allData.push([`TEST: ${title}`]);
  if (headers.length) allData.push(headers);
  rows.forEach((r) => allData.push(Array.isArray(r) ? r : [r]));
  allData.push([]);
};

export const createOArmUploadableExcel = (data: OArmExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];
  const addBlank = () => allData.push([]);

  const header = data.reportHeader?.data || data.reportHeader;
  if (header) {
    allData.push(["REPORT HEADER"]);
    allData.push(["Customer", header.customerName ?? ""]);
    allData.push(["Address", header.address ?? ""]);
    allData.push(["SRF Number", header.srfNumber ?? ""]);
    allData.push(["Test Report Number", header.testReportNumber ?? ""]);
    allData.push([]);
  }

  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi?.testConditions || aoi?.irradiationTimes?.length) {
    const tc = aoi.testConditions || {};
    const times = Array.isArray(aoi.irradiationTimes) ? aoi.irradiationTimes : [];
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    allData.push(["FDD (cm)", tc.fcd ?? "", "kV", tc.kv ?? "", "mA", tc.ma ?? ""]);
    allData.push(["Set Time (sec)", "Measured Time (sec)"]);
    times.forEach((t: any) => allData.push([t.setTime ?? "", t.measuredTime ?? ""]));
    addBlank();
  }

  const tf = unwrap(data.totalFiltration);
  if (tf?.measurements?.length || tf?.mAStations?.length) {
    allData.push(["TEST: TOTAL FILTRATION"]);
    const tol = tf.tolerance || {};
    const tFil = tf.totalFiltration || {};
    allData.push(["Tolerance Sign", tol.sign ?? "±"]);
    allData.push(["Tolerance Value (kVp)", tol.value ?? "2.0"]);
    if (tFil.measured) allData.push(["Total Filtration Measured (mm Al)", tFil.measured]);
    allData.push(["Total Filtration Required (mm Al)", tFil.required ?? ""]);
    if (tFil.atKvp) allData.push(["Total Filtration At kVp", tFil.atKvp]);
    const stations = tf.mAStations || [];
    stations.forEach((s: string, i: number) =>
      allData.push([`mA Station ${i + 1}`, String(s).replace(/\s*mA\s*$/i, "").trim()])
    );
    const maxMeas = Math.max(
      ...(tf.measurements || []).map((m: any) => (m.measuredValues || []).length),
      stations.length,
      1
    );
    const headerLabels =
      stations.length > 0
        ? stations
        : Array.from({ length: maxMeas }, (_, i) => `Measured ${i + 1}`);
    allData.push(["Applied kVp", ...headerLabels.slice(0, maxMeas)]);
    (tf.measurements || []).forEach((m: any) => {
      const outs = m.measuredValues || [];
      allData.push([m.appliedKvp ?? "", ...headerLabels.map((_: string, i: number) => outs[i] ?? "")]);
    });
    addBlank();
  }

  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows?.length || oc?.parameters) {
    const p = oc.parameters || {};
    const ffd = p.ffd ?? "100";
    const measHeaders = oc.measurementHeaders || ["Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"];
    allData.push(["TEST: OUTPUT CONSISTENCY"]);
    allData.push(["FDD (cm)", ffd]);
    if (p.time) allData.push(["Time (s)", p.time]);
    allData.push(["kVp", "mAs", ...measHeaders]);
    (oc.outputRows || []).forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (typeof o === "object" ? o.value : o) ?? "");
      allData.push([r.kvp ?? r.kv ?? "", r.ma ?? r.mas ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")]);
    });
    allData.push(["Tolerance Operator", "<="]);
    allData.push(["Tolerance Value (CoV)", oc.tolerance ?? "0.02"]);
    addBlank();
  }

  const hcr = unwrap(data.highContrastResolution);
  if (hcr?.readings?.length || hcr?.measurements?.length) {
    const rows = (hcr.readings || hcr.measurements || []).map((r: any) => [
      r.lpPerMm ?? r.value ?? "",
      r.remarks ?? r.recommendedStandard ?? "",
    ]);
    addSection(allData, "HIGH CONTRAST RESOLUTION", ["Measured lp/mm", "Recommended Standard"], rows);
  }

  const lcr = unwrap(data.lowContrastResolution);
  if (lcr?.readings?.length || lcr?.measurements?.length) {
    const rows = (lcr.readings || lcr.measurements || []).map((r: any) => [
      r.diameter ?? r.size ?? r.smallestHoleSize ?? "",
      r.visible ?? r.result ?? r.recommendedStandard ?? "",
    ]);
    addSection(allData, "LOW CONTRAST RESOLUTION", ["Smallest Hole Size", "Recommended Standard"], rows);
  }

  const exp = unwrap(data.exposureRateAtTableTop);
  if (exp?.readings?.length || exp?.measurements?.length || exp?.rows?.length) {
    const rows = (exp.readings || exp.measurements || exp.rows || []).map((r: any) => [
      r.distance ?? "",
      r.kv ?? r.appliedKv ?? "",
      r.ma ?? r.appliedMa ?? "",
      r.rate ?? r.exposure ?? r.value ?? "",
      r.mode ?? r.remarks ?? "",
    ]);
    addSection(allData, "EXPOSURE RATE AT TABLE TOP", ["Distance", "Applied kV", "Applied mA", "Exposure", "Mode"], rows);
  }

  const leak = unwrap(data.tubeHousingLeakage);
  if (leak?.readings?.length || leak?.measurements?.length) {
    const settings = leak.settings || leak.testConditions || {};
    const rows = (leak.readings || leak.measurements || []).map((r: any) => [
      settings.fcd ?? settings.fdd ?? "",
      settings.kv ?? "",
      settings.ma ?? "",
      settings.time ?? "",
      leak.workload ?? settings.workload ?? "",
      r.location ?? "",
      r.left ?? r.values?.left ?? "",
      r.right ?? r.values?.right ?? "",
      r.front ?? r.values?.front ?? "",
      r.back ?? r.values?.back ?? "",
      r.top ?? r.values?.top ?? "",
    ]);
    addSection(
      allData,
      "TUBE HOUSING LEAKAGE",
      ["FDD (cm)", "kV", "mA", "Time (sec)", "Workload", "Location", "Left", "Right", "Front", "Back", "Top"],
      rows
    );
  }

  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2?.length) {
    const isMa = lmas.selection === "mA" || lmas.isMaMode === true;
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    const measHeaders = lmas.measHeaders || ["Meas 1", "Meas 2", "Meas 3"];
    if (isMa) {
      allData.push(["TEST: LINEARITY OF MA LOADING"]);
      allData.push(["FDD (cm)", t1.fcd ?? "", "kV", t1.kv ?? "", "Time (s)", t1.time ?? ""]);
      allData.push(["mA Applied", ...measHeaders]);
      lmas.table2.forEach((r: any) => {
        const outs = r.measuredOutputs || [];
        allData.push([r.mAApplied ?? r.mAsRange ?? r.ma ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")]);
      });
      allData.push(["Tolerance Operator", lmas.toleranceOperator ?? "<="]);
      allData.push(["Tolerance Value (CoL)", lmas.tolerance ?? "0.1"]);
    } else {
      allData.push(["TEST: LINEARITY OF MAS LOADING"]);
      allData.push(["FDD (cm)", t1.fcd ?? "", "kV", t1.kv ?? ""]);
      allData.push(["mAs Range", ...measHeaders]);
      lmas.table2.forEach((r: any) => {
        const outs = r.measuredOutputs || [];
        allData.push([r.mAsApplied ?? r.mAsRange ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")]);
      });
      allData.push(["Tolerance Operator", lmas.toleranceOperator ?? "<="]);
      allData.push(["Tolerance Value (CoL)", lmas.tolerance ?? "0.1"]);
    }
    addBlank();
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "O-Arm Test Data");
  return wb;
};

const templateSec = (rows: any[][], title: string, header: string[], data: any[][]) => {
  rows.push([`TEST: ${title}`]);
  rows.push(header);
  for (const r of data) rows.push(r);
  rows.push([]);
};

/** Build O-Arm TEST: table template rows for With Timer or No Timer. */
export const buildOArmTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  if (hasTimer) {
    templateSec(
      rows,
      "ACCURACY OF IRRADIATION TIME",
      ["FDD (cm)", "kV", "mA", "Set Time (sec)", "Measured Time (sec)"],
      [
        ["100", "80", "100", "0.1", "0.102"],
        ["", "", "", "0.2", "0.198"],
        ["", "", "", "0.5", "0.505"],
      ]
    );
  }

  appendRadiographyStyleSection(rows, "TOTAL FILTRATION", totalFiltrationSection());
  appendRadiographyStyleSection(rows, "OUTPUT CONSISTENCY", oarmOutputConsistencySection());

  templateSec(rows, "HIGH CONTRAST RESOLUTION", ["Measured lp/mm", "Recommended Standard"], [["1.60", "1.50"]]);
  templateSec(rows, "LOW CONTRAST RESOLUTION", ["Smallest Hole Size", "Recommended Standard"], [["2.5", "3.0"]]);
  templateSec(
    rows,
    "EXPOSURE RATE AT TABLE TOP",
    ["Distance", "Applied kV", "Applied mA", "Exposure", "Mode"],
    [["100", "80", "100", "3.5", "AEC Mode"]]
  );
  templateSec(
    rows,
    "TUBE HOUSING LEAKAGE",
    ["FDD (cm)", "kV", "mA", "Time (sec)", "Workload", "Location", "Left", "Right", "Front", "Back", "Top"],
    [
      ["100", "120", "21", "2.0", "500", "Tube", "0.05", "0.03", "0.06", "0.04", "0.02"],
      ["", "", "", "", "", "Collimator", "0.02", "0.02", "0.03", "0.01", "0.01"],
    ]
  );

  if (hasTimer) {
    appendRadiographyStyleSection(rows, "LINEARITY OF MA LOADING", linearityMaSection());
  } else {
    appendRadiographyStyleSection(rows, "LINEARITY OF MAS LOADING", linearityMasSection());
  }

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

/** Write With Timer / No Timer CSV templates and separate + combined Excel files. */
export const writeOArmTemplateFiles = (outputDir: string) => {
  const withTimer = buildOArmTemplateRows(true);
  const noTimer = buildOArmTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "OArm_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "OArm_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "OArm_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "OArm_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "OArm_Template.xlsx");

  const wbCombined = XLSX.utils.book_new();
  const wsWithTimer = XLSX.utils.aoa_to_sheet(withTimer);
  const wsNoTimer = XLSX.utils.aoa_to_sheet(noTimer);
  wsWithTimer["!cols"] = Array.from({ length: 16 }, () => ({ wch: 18 }));
  wsNoTimer["!cols"] = Array.from({ length: 16 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wbCombined, wsWithTimer, "With Timer");
  XLSX.utils.book_append_sheet(wbCombined, wsNoTimer, "Without Timer");

  const wbWithTimer = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbWithTimer, XLSX.utils.aoa_to_sheet(withTimer), "With Timer");

  const wbNoTimer = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbNoTimer, XLSX.utils.aoa_to_sheet(noTimer), "Without Timer");

  const writeAll = () => {
    fs.writeFileSync(withTimerCsvPath, rowsToCsv(withTimer), "utf8");
    fs.writeFileSync(noTimerCsvPath, rowsToCsv(noTimer), "utf8");
    XLSX.writeFile(wbWithTimer, withTimerXlsxPath);
    XLSX.writeFile(wbNoTimer, noTimerXlsxPath);
    XLSX.writeFile(wbCombined, combinedXlsxPath);
  };

  try {
    writeAll();
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      fs.writeFileSync(withTimerCsvPath.replace(/\.csv$/i, ".csv.new"), rowsToCsv(withTimer), "utf8");
      fs.writeFileSync(noTimerCsvPath.replace(/\.csv$/i, ".csv.new"), rowsToCsv(noTimer), "utf8");
      XLSX.writeFile(wbWithTimer, withTimerXlsxPath.replace(/\.xlsx$/i, ".tmp.xlsx"));
      XLSX.writeFile(wbNoTimer, noTimerXlsxPath.replace(/\.xlsx$/i, ".tmp.xlsx"));
      XLSX.writeFile(wbCombined, path.join(outputDir, "OArm_Template.tmp.xlsx"));
      console.warn("O-Arm templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
