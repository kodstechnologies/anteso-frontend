import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const pad = (n: number) => Array(n).fill("");

const appendSection = (rows: any[][], title: string, lines: any[][]) => {
  rows.push([`TEST: ${title}`, ...pad(13)]);
  lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 14 - line.length))]));
  rows.push([]);
};

const accuracyOfOperatingPotentialSection = (): any[][] => [
  ["Time (ms)", "", "Set kV", "10 mA", "100 mA", "200 mA", "300 mA", "Tol Value", "Tol Sign"],
  ["100", "", "25", "25.1", "25.0", "25.2", "24.9", "1.5", "±"],
  ["100", "", "28", "28.1", "28.0", "28.2", "27.9", "", ""],
  ["", "", "35", "35.1", "35.0", "35.2", "34.9", "", ""],
  ["", "", "40", "40.1", "40.0", "40.2", "39.9", "", ""],
  ["", "", "49", "49.1", "49.0", "49.2", "48.9", "", ""],
];

const accuracyOfIrradiationTimeSection = (): any[][] => [
  ["FDD (cm)", "kV", "mA", "Set Time (ms)", "Measured Time (ms)", "", "Tol Operator", "Tol Value"],
  ["100", "28", "100", "100", "98.5", "", "<=", "5"],
  ["100", "28", "100", "200", "199.2", "", "", ""],
];

const linearityMaLoadingSection = (): any[][] => [
  ["FDD (cm)", "kV", "Time (sec)", "mA", "Meas 1", "Meas 2", "Meas 3", "Tolerance", "Tol Operator"],
  ["100", "28", "0.1", "50", "4.8", "4.9", "4.7", "0.1", "<="],
  ["", "", "", "100", "9.5", "9.6", "9.4", "", ""],
  ["", "", "", "200", "19.0", "19.1", "18.9", "", ""],
];

const linearityMasLoadingSection = (): any[][] => [
  ["FDD (cm)", "kV", "mAs", "Meas 1", "Meas 2", "Meas 3", "Tolerance", "Tol Operator"],
  ["100", "28", "5", "4.50", "4.51", "4.49", "0.1", "<="],
  ["", "", "10", "9.10", "9.11", "9.09", "", ""],
  ["", "", "20", "18.20", "18.21", "18.19", "", ""],
  ["", "", "50", "45.00", "45.10", "44.90", "", ""],
];

const totalFiltrationSection = (): any[][] => [
  [
    "Target Window",
    "Added Filter (mm)",
    "HVT at 28 kVp",
    "kVp",
    "mAs",
    "",
    "Al Equiv (mm)",
    "HVT",
    "Rec Min",
    "Rec Max",
  ],
  ["Molybdenum target Beryllium window", "0.03", "", "28", "50", "", "0.45", "0.42", "2.0", "3.0"],
  ["", "", "", "30", "63", "", "0.48", "0.45", "2.0", "3.0"],
];

const reproducibilityOfOutputSection = (): any[][] => [
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoV)", "0.05"],
  ["FDD (cm)", "kV", "mAs", "Measured Output 1", "Measured Output 2", "Measured Output 3"],
  ["65", "25", "25", "10.5", "10.4", "10.6"],
  ["", "28", "25", "12.1", "12.0", "12.2"],
  ["", "35", "25", "14.5", "14.4", "14.6"],
  ["", "40", "25", "16.2", "16.1", "16.3"],
  ["", "49", "25", "18.0", "17.9", "18.1"],
];

const radiationLeakageSection = (): any[][] => [
  [
    "FDD (cm)",
    "kV",
    "mA",
    "Time (Sec)",
    "Workload",
    "",
    "Tol Value",
    "Tol Operator",
    "Tol Time",
    "Location",
    "Left",
    "Right",
    "Front",
    "Back",
    "Top",
  ],
  ["100", "120", "21", "2", "500", "", "1", "<=", "1", "TUBE", "0.05", "0.03", "0.06", "0.04", "0.02"],
  ["", "", "", "", "", "", "", "", "", "COLLIMATOR", "0.02", "0.02", "0.03", "0.01", "0.01"],
];

const imagingPhantomSection = (): any[][] => [
  ["Name", "Visible Count", "Tol Operator", "Tol Value"],
  ["Fibers", "5", ">=", "4"],
  ["Micro Calcification", "6", ">=", "6"],
  ["Masses", "4", ">=", "3"],
];

const radiationProtectionSurveySection = (): any[][] => [
  ["", "", "mA", "kV", "Time", "", "Workload", "Location", "mR/hr", "Category"],
  ["", "", "100", "80", "0.5", "", "300", "Control Console (Operator Position)", "0.05", "worker"],
  ["", "", "", "", "", "", "", "Outside Lead Glass", "0.03", "worker"],
  ["", "", "", "", "", "", "", "Outside Patient Entrance Door", "0.02", "public"],
  ["", "", "", "", "", "", "", "Patient Waiting Area", "0.01", "public"],
];

/** Mark mAs column cells as text so Excel does not convert them to dates. */
const applyTextFormatGuards = (ws: XLSX.WorkSheet, rows: any[][]) => {
  let inLinearityMas = false;
  let seenMasHeader = false;

  rows.forEach((row, r) => {
    const first = String(row[0] ?? "").trim();

    if (/^TEST:\s*LINEARITY OF MAS LOADING/i.test(first)) {
      inLinearityMas = true;
      seenMasHeader = false;
      return;
    }
    if (/^TEST:/i.test(first)) {
      inLinearityMas = false;
      seenMasHeader = false;
    }

    const markText = (rowIdx: number, colIdx: number) => {
      const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      const existing = ws[addr];
      const value = existing?.v ?? row[colIdx];
      if (value === undefined || value === null || value === "") return;
      ws[addr] = { t: "s", v: String(value) };
    };

    if (inLinearityMas) {
      if (/^mAs(\s*Range)?$/i.test(first) || (/^FDD/i.test(first) && /^kV$/i.test(String(row[1] ?? "").trim()))) {
        if (/^mAs/i.test(first) || row.some((c, i) => i > 1 && /^Meas/i.test(String(c ?? "")))) {
          seenMasHeader = true;
          row.forEach((cell, c) => {
            if (c > 2 && String(cell ?? "").trim()) markText(r, c);
          });
        }
      }
      if (seenMasHeader && /^\d+(\.\d+)?$/.test(first)) {
        markText(r, 2);
      } else if (seenMasHeader && first === "" && /^\d+(\.\d+)?$/.test(String(row[2] ?? "").trim())) {
        markText(r, 2);
      }
    }
  });
};

const aoaToTextSafeSheet = (rows: any[][]) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  applyTextFormatGuards(ws, rows);
  return ws;
};

/** Build Mammography TEST: table rows for With Timer or No Timer. */
export const buildMammographyTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  appendSection(rows, "ACCURACY OF OPERATING POTENTIAL", accuracyOfOperatingPotentialSection());

  if (hasTimer) {
    appendSection(rows, "ACCURACY OF IRRADIATION TIME", accuracyOfIrradiationTimeSection());
    appendSection(rows, "LINEARITY OF MA LOADING STATIONS", linearityMaLoadingSection());
  } else {
    appendSection(rows, "LINEARITY OF MAS LOADING", linearityMasLoadingSection());
  }

  appendSection(rows, "TOTAL FILTRATION & ALUMINIUM", totalFiltrationSection());
  appendSection(rows, "REPRODUCIBILITY OF OUTPUT", reproducibilityOfOutputSection());
  appendSection(rows, "RADIATION LEAKAGE LEVEL", radiationLeakageSection());
  appendSection(rows, "IMAGING PHANTOM", imagingPhantomSection());
  appendSection(rows, "RADIATION PROTECTION SURVEY", radiationProtectionSurveySection());

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

/** Write With Timer / No Timer CSV + Excel templates under public/templates. */
export const writeMammographyTemplateFiles = (outputDir: string) => {
  const withTimer = buildMammographyTemplateRows(true);
  const noTimer = buildMammographyTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "Mammography_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "Mammography_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "Mammography_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "Mammography_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "Mammography_Template.xlsx");

  const wsWithTimer = aoaToTextSafeSheet(withTimer);
  const wsNoTimer = aoaToTextSafeSheet(noTimer);
  wsWithTimer["!cols"] = Array.from({ length: 16 }, () => ({ wch: 18 }));
  wsNoTimer["!cols"] = Array.from({ length: 16 }, () => ({ wch: 18 }));

  const wbCombined = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbCombined, wsWithTimer, "With Timer");
  XLSX.utils.book_append_sheet(wbCombined, wsNoTimer, "Without Timer");

  const wbWithTimer = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbWithTimer, aoaToTextSafeSheet(withTimer), "With Timer");

  const wbNoTimer = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbNoTimer, aoaToTextSafeSheet(noTimer), "Without Timer");

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
      XLSX.writeFile(wbCombined, path.join(outputDir, "Mammography_Template.tmp.xlsx"));
      console.warn("Mammography templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
