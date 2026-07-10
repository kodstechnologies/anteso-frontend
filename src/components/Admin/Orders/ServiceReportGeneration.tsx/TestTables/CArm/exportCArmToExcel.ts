import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import {
  appendRadiographyStyleSection,
  linearityMaSection,
  linearityMasSection,
  outputConsistencySection,
  totalFiltrationSection,
} from "../shared/radiographyStyleExcelSections";

export interface CArmExportData {
  reportHeader?: any;
  accuracyOfIrradiationTime?: any;
  totalFiltration?: any;
  outputConsistency?: any;
  lowContrastResolution?: any;
  highContrastResolution?: any;
  exposureRateAtTableTop?: any;
  tubeHousingLeakage?: any;
  linearityOfMaLoading?: any;
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

export const createCArmUploadableExcel = (data: CArmExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];
  const addBlank = () => allData.push([]);

  // Report header summary
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
    times.forEach((t: any) => allData.push([t.setTime ?? "", t.measuredTime ?? t.measuredTime1 ?? ""]));
    allData.push([]);
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
    stations.forEach((s: string, i: number) => allData.push([`mA Station ${i + 1}`, String(s).replace(/\s*mA\s*$/i, "").trim()]));
    const maxMeas = Math.max(...(tf.measurements || []).map((m: any) => (m.measuredValues || []).length), stations.length, 1);
    const headerLabels = stations.length > 0 ? stations : Array.from({ length: maxMeas }, (_, i) => `Meas ${i + 1}`);
    allData.push(["Applied kVp", ...headerLabels.slice(0, maxMeas)]);
    (tf.measurements || []).forEach((m: any) => {
      const outs = m.measuredValues || [];
      allData.push([m.appliedKvp ?? "", ...headerLabels.map((_: string, i: number) => outs[i] ?? "")]);
    });
    addBlank();
  }

  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows?.length || oc?.parameters || oc?.ffd) {
    const p = oc.parameters || oc.ffd || {};
    const ffd = typeof p === "object" ? (p.ffd ?? p.value ?? "100") : String(p ?? "100");
    const measHeaders = oc.measurementHeaders || oc.measHeaders || oc.headers || ["Meas 1", "Meas 2", "Meas 3"];
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["FDD (cm)", ffd]);
    if (p?.time) allData.push(["Time (s)", p.time]);
    allData.push(["kVp", "mAs", ...measHeaders]);
    (oc.outputRows || []).forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (typeof o === "object" ? o.value : o) ?? "");
      allData.push([r.kvp ?? r.kv ?? "", r.ma ?? r.mas ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")]);
    });
    allData.push(["Tolerance Operator", "<="]);
    allData.push(["Tolerance Value (CoV)", oc.tolerance ?? oc.outputTolerance ?? "0.02"]);
    addBlank();
  }

  const lcr = unwrap(data.lowContrastResolution);
  if (lcr?.readings?.length || lcr?.measurements?.length) {
    const rows = (lcr.readings || lcr.measurements || []).map((r: any) => [r.diameter ?? r.size ?? "", r.visible ?? r.result ?? "", r.remarks ?? ""]);
    addSection(allData, "LOW CONTRAST RESOLUTION", ["Smallest Hole Size (mm)", "Recommended Standard"], rows);
  }

  const hcr = unwrap(data.highContrastResolution);
  if (hcr?.readings?.length || hcr?.measurements?.length) {
    const rows = (hcr.readings || hcr.measurements || []).map((r: any) => [r.lpPerMm ?? r.value ?? "", r.remarks ?? ""]);
    addSection(allData, "HIGH CONTRAST RESOLUTION", ["Measured Resolution (lp/mm)", "Recommended Standard (lp/mm)"], rows);
  }

  const exp = unwrap(data.exposureRateAtTableTop);
  if (exp?.rows?.length) {
    const headerRow = [
      "Max Exposure (AEC Mode) (cGy/Min)",
      "Max Exposure (Manual Mode) (cGy/Min)",
      "Min. Focus to Tabletop Distance",
      "Distance (cm)",
      "Applied kV",
      "Applied mA",
      "Exposure (cGy/Min)",
    ];
    const dataRows = exp.rows.map((r: any, idx: number) => {
      const base =
        idx === 0
          ? [exp.aecTolerance ?? "10", exp.nonAecTolerance ?? "5", exp.minFocusDistance ?? "30"]
          : ["", "", ""];
      return [...base, r.distance ?? "", r.appliedKv ?? "", r.appliedMa ?? "", r.exposure ?? ""];
    });
    addSection(allData, "EXPOSURE RATE AT TABLE TOP", headerRow, dataRows);
  }

  const leak = unwrap(data.tubeHousingLeakage);
  if (leak?.readings?.length || leak?.measurements?.length) {
    const rows = (leak.readings || leak.measurements || []).map((r: any) => [r.location ?? "", r.value ?? r.leakage ?? "", r.remarks ?? ""]);
    addSection(allData, "TUBE HOUSING LEAKAGE", ["Location", "Value (mR/h)", "Remarks"], rows);
  }

  const lma = unwrap(data.linearityOfMaLoading);
  if (lma?.table2?.length) {
    const t1 = lma.table1 || {};
    const measHeaders = lma.measHeaders || ["Meas 1", "Meas 2", "Meas 3"];
    allData.push(["TEST: LINEARITY OF mA LOADING"]);
    allData.push(["FDD (cm)", t1.fcd ?? "", "kV", t1.kv ?? "", "Time (s)", t1.time ?? ""]);
    allData.push(["mA Applied", ...measHeaders]);
    lma.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.mAApplied ?? r.ma ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")]);
    });
    allData.push(["Tolerance Operator", lma.toleranceOperator ?? "<="]);
    allData.push(["Tolerance Value (CoL)", lma.tolerance ?? "0.1"]);
    addBlank();
  }

  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2?.length) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    const t2 = Array.isArray(lmas.table2) ? lmas.table2 : [];
    const measHeaders = lmas.measHeaders || ["Meas 1", "Meas 2", "Meas 3"];
    allData.push(["TEST: LINEARITY OF MAS LOADING"]);
    allData.push(["FDD (cm)", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push(["mAs Range", ...measHeaders]);
    t2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.mAsApplied ?? r.mAsRange ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")]);
    });
    allData.push(["Tolerance Operator", lmas.toleranceOperator ?? "<="]);
    allData.push(["Tolerance Value (CoL)", lmas.tolerance ?? "0.1"]);
    addBlank();
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "C-Arm Test Data");
  return wb;
};

const templateSec = (rows: any[][], title: string, header: string[], data: any[][]) => {
  rows.push([`TEST: ${title}`]);
  rows.push(header);
  for (const r of data) rows.push(r);
  rows.push([]);
};

/** Build C-Arm TEST: table template rows for With Timer or No Timer. */
export const buildCArmTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  if (hasTimer) {
    templateSec(
      rows,
      "ACCURACY OF IRRADIATION TIME",
      ["FDD (cm)", "kV", "mA", "Set Time (sec)", "Measured Time (sec)", "Tol Operator", "Tol Value"],
      [
        ["100", "80", "100", "100", "98.5", "<=", "10"],
        ["", "", "", "200", "199", "", ""],
        ["", "", "", "400", "398", "", ""],
      ]
    );
  }

  appendRadiographyStyleSection(rows, "TOTAL FILTRATION", totalFiltrationSection());
  appendRadiographyStyleSection(rows, "CONSISTENCY OF RADIATION OUTPUT", outputConsistencySection());

  templateSec(rows, "LOW CONTRAST RESOLUTION", ["Smallest Hole Size (mm)", "Recommended Standard"], [["1.0", ">= 1.0 mm"]]);
  templateSec(
    rows,
    "HIGH CONTRAST RESOLUTION",
    ["Measured Resolution (lp/mm)", "Recommended Standard (lp/mm)"],
    [["2.0", ">= 2.0 lp/mm"]]
  );

  templateSec(
    rows,
    "EXPOSURE RATE AT TABLE TOP",
    [
      "Max Exposure (AEC Mode) (cGy/Min)",
      "Max Exposure (Manual Mode) (cGy/Min)",
      "Min. Focus to Tabletop Distance",
      "Distance (cm)",
      "Applied kV",
      "Applied mA",
      "Exposure (cGy/Min)",
    ],
    [
      ["10", "5", "30", "100", "80", "100", "0.5"],
      ["", "", "", "100", "80", "100", "0.6"],
    ]
  );

  templateSec(
    rows,
    "TUBE HOUSING LEAKAGE",
    [
      "FDD (cm)",
      "kV",
      "mA",
      "Time (sec)",
      "Workload (mA·min/week)",
      "Tol Value",
      "Tol Operator",
      "Location",
      "Front",
      "Back",
      "Left",
      "Right",
      "Top",
    ],
    [
      ["100", "80", "100", "1", "1000", "1.0", "less than or equal to", "Tube", "0.05", "0.03", "0.06", "0.04", "0.02"],
      ["", "", "", "", "", "", "", "Collimator", "0.02", "0.02", "0.03", "0.01", ""],
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
export const writeCArmTemplateFiles = (outputDir: string) => {
  const withTimer = buildCArmTemplateRows(true);
  const noTimer = buildCArmTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "CArm_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "CArm_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "CArm_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "CArm_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "CArm_Template.xlsx");

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
    try {
      XLSX.writeFile(wbCombined, path.join(outputDir, "CArm_Template.tmp.xlsx"));
    } catch {
      XLSX.writeFile(wbCombined, path.join(outputDir, "CArm_Template.tmp.xlsx.new"));
    }
  };

  try {
    writeAll();
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      fs.writeFileSync(withTimerCsvPath.replace(/\.csv$/i, ".csv.new"), rowsToCsv(withTimer), "utf8");
      fs.writeFileSync(noTimerCsvPath.replace(/\.csv$/i, ".csv.new"), rowsToCsv(noTimer), "utf8");
      XLSX.writeFile(wbWithTimer, withTimerXlsxPath.replace(/\.xlsx$/i, ".tmp.xlsx"));
      XLSX.writeFile(wbNoTimer, noTimerXlsxPath.replace(/\.xlsx$/i, ".tmp.xlsx"));
      XLSX.writeFile(wbCombined, path.join(outputDir, "CArm_Template.tmp.xlsx"));
      console.warn("C-Arm templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
