import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const appendSection = (rows: any[][], title: string, lines: any[][]) => {
  rows.push([`TEST: ${title}`]);
  lines.forEach((line) => rows.push(line));
  rows.push([]);
};

const accuracyOfOperatingPotentialSection = (): any[][] => [
  ["Tolerance Sign", "±"],
  ["Tolerance Value (kVp)", "5"],
  ["Applied kVp", "mA 1", "mA 2", "Average kVp", "Remarks"],
  ["60", "60.2", "60.5", "", ""],
  ["70", "70.1", "70.4", "", ""],
  ["80", "80.3", "80.1", "", ""],
];

const totalFiltrationSection = (): any[][] => [
  ["Parameter", "Measured (mm Al)", "Required (mm Al)", "At kVp"],
  ["TotalFiltration", "2.6", "2.5", "80"],
];

const accuracyOfIrradiationTimeSection = (): any[][] => [
  ["FDD (cm)", "100", "kV", "80", "mA", "100"],
  ["Set Time (ms)", "Measured Time 1 (ms)", "Tolerance Operator", "Tolerance Value (%)"],
  ["100", "98.5", "<=", "20"],
  ["200", "198"],
];

const linearityMaLoadingSection = (): any[][] => [
  ["FDD (cm)", "100", "kV", "80", "Time (s)", "0.1"],
  ["mA Applied", "Measured Output 1", "Measured Output 2"],
  ["50", "0.5", "0.51"],
  ["100", "0.98"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
];

const linearityMasLoadingSection = (): any[][] => [
  ["FDD (cm)", "100", "kV", "80"],
  ["mAs Range", "Measured Output 1", "Measured Output 2", "Measured Output 3"],
  ["5", "0.5", "0.51", "0.49"],
  ["10", "1", "1.01", "0.99"],
  ["20", "2.5", "2.51", "2.49"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
];

const consistencySection = (): any[][] => [
  ["FDD (cm)", "100"],
  ["kVp", "mAs", "Output 1", "Output 2"],
  ["80", "10", "0.5", "0.51"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoV)", "0.05"],
];

const radiationLeakageSection = (): any[][] => [
  ["kV", "120", "mA", "10", "Time", "1.0", "Workload", "100", "Tolerance", "1.0", "Tolerance Operator", "<"],
  ["Location", "Left", "Right", "Top", "Up", "Down", "Max Leakage", "Unit", "Remark"],
  ["Tube", "0.01", "0.015", "0.012", "0.011", "0.010", "", "mGy/h", ""],
  ["Collimator", "0.012", "0.011", "0.014", "0.013", "0.012", "", "mGy/h", ""],
];

const radiationProtectionSurveySection = (): any[][] => [
  [
    "Applied Current (mA)",
    "10",
    "Applied Voltage (kV)",
    "80",
    "Exposure Time (s)",
    "1.0",
    "Workload (mA.min/week)",
    "100",
  ],
  ["LOCATION", "MAX. RADIATION LEVEL (MR/HR)", "MR/WEEK", "STATUS", "RESULT"],
  ["Control Console", "0.05", "", "", "Worker"],
  ["Waiting Area", "0.02", "", "", "Public"],
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
      if (/^mAs Range$/i.test(first)) {
        seenMasHeader = true;
        return;
      }
      if (/^Tolerance/i.test(first) || /^CoL$/i.test(first) || /^Remark$/i.test(first)) {
        return;
      }
      if (seenMasHeader && first) {
        markText(r, 0);
      }
    }
  });
};

const aoaToTextSafeSheet = (rows: any[][]) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  applyTextFormatGuards(ws, rows);
  return ws;
};

/** Build CBCT TEST: table rows for With Timer or No Timer. */
export const buildCBCTTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  appendSection(rows, "ACCURACY OF OPERATING POTENTIAL", accuracyOfOperatingPotentialSection());
  appendSection(rows, "TOTAL FILTRATION", totalFiltrationSection());

  if (hasTimer) {
    appendSection(rows, "ACCURACY OF IRRADIATION TIME", accuracyOfIrradiationTimeSection());
    appendSection(rows, "LINEARITY OF mA LOADING", linearityMaLoadingSection());
  } else {
    appendSection(rows, "LINEARITY OF mAs LOADING", linearityMasLoadingSection());
  }

  appendSection(rows, "CONSISTENCY OF RADIATION OUTPUT", consistencySection());
  appendSection(rows, "RADIATION LEAKAGE LEVEL FROM X-RAY TUBE HOUSE", radiationLeakageSection());
  appendSection(rows, "RADIATION PROTECTION SURVEY REPORT", radiationProtectionSurveySection());

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

/** Write With Timer / No Timer CSV + Excel templates under public/templates. */
export const writeCBCTTemplateFiles = (outputDir: string) => {
  const withTimer = buildCBCTTemplateRows(true);
  const noTimer = buildCBCTTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "Dental_CBCT_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "Dental_CBCT_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "Dental_CBCT_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "Dental_CBCT_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "Dental_CBCT_Template.xlsx");
  const legacyCsvPath = path.join(outputDir, "Dental_CBCT_Test_Data_Template.csv");

  const wsWithTimer = aoaToTextSafeSheet(withTimer);
  const wsNoTimer = aoaToTextSafeSheet(noTimer);
  wsWithTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
  wsNoTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));

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
    fs.writeFileSync(legacyCsvPath, rowsToCsv(withTimer), "utf8");
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
      XLSX.writeFile(wbCombined, path.join(outputDir, "Dental_CBCT_Template.tmp.xlsx"));
      console.warn("CBCT templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
