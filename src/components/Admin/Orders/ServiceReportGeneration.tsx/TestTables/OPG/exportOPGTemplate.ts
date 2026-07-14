import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const appendSection = (rows: any[][], title: string, lines: any[][]) => {
  rows.push([`TEST: ${title}`]);
  lines.forEach((line) => rows.push(line));
  rows.push([]);
};

const accuracyOfOperatingPotentialSection = (): any[][] => [
  ["Applied kVp", "mA 1", "mA 2"],
  ["60", "60.2", "60.5"],
  ["70", "70.1", "70.4"],
  ["80", "80.3", "80.1"],
];

const totalFiltrationSection = (): any[][] => [
  ["Parameter", "Measured mm Al", "Required mm Al", "At kVp"],
  ["TotalFiltration", "2.6", "2.5", "80"],
];

const accuracyOfIrradiationTimeSection = (): any[][] => [
  ["FCD", "100", "kV", "70", "mA", "10"],
  ["Set Time (mSec)", "Measured Time (mSec)"],
  ["100", "102"],
  ["200", "198"],
];

const linearityMaLoadingSection = (): any[][] => [
  ["FCD", "100", "kV", "70", "Time", "0.1"],
  ["mA Station", "Measured mR 1", "Measured mR 2", "Measured mR 3"],
  ["5", "1.2", "1.25", "1.22"],
  ["10", "2.4", "2.45", "2.42"],
  ["CoL", "0.08"],
];

const linearityMasLoadingSection = (): any[][] => [
  ["FCD", "100", "kV", "80"],
  ["mAs Range", "Measured mR 1", "Measured mR 2", "Measured mR 3"],
  ["12", "1.2", "1.25", "1.22"],
  ["50", "2.4", "2.45", "2.42"],
  ["CoL", "0.08"],
];

const consistencySection = (): any[][] => [
  ["FFD", "100"],
  ["kVp", "mAs", "Meas 1", "Meas 2", "Meas 3"],
  ["80", "100", "10.2", "10.1", "10.3"],
];

const radiationLeakageSection = (): any[][] => [
  ["FFD", "100", "kVp", "120", "mA", "10", "Time", "1", "Tolerance", "1"],
  ["Workload", "100"],
  ["Location", "Left", "Right", "Top", "Up", "Down"],
  ["Front", "0.01", "0.02", "0.015", "0.012", "0.011"],
  ["Back", "0.012", "0.014", "0.011", "0.013", "0.015"],
];

const radiationProtectionSurveySection = (): any[][] => [
  [
    "",
    "",
    "Applied Current (mA)",
    "10",
    "Applied Voltage (kV)",
    "80",
    "Exposure Time (s)",
    "1",
    "Workload (mA.min/week)",
    "100",
  ],
  ["LOCATION", "MAX. RADIATION LEVEL (MR/HR)", "RESULT"],
  ["Control Console", "0.05", "Worker"],
  ["Waiting Area", "0.02", "Public"],
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
      }
      if (seenMasHeader && /^\d+(\.\d+)?$/.test(first)) {
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

/** Build OPG TEST: table rows for With Timer or No Timer. */
export const buildOPGTemplateRows = (hasTimer: boolean): any[][] => {
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
export const writeOPGTemplateFiles = (outputDir: string) => {
  const withTimer = buildOPGTemplateRows(true);
  const noTimer = buildOPGTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "Dental_OPG_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "Dental_OPG_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "Dental_OPG_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "Dental_OPG_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "Dental_OPG_Template.xlsx");
  const legacyCsvPath = path.join(outputDir, "Dental_OPG_Test_Data_Template.csv");

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
      XLSX.writeFile(wbCombined, path.join(outputDir, "Dental_OPG_Template.tmp.xlsx"));
      console.warn("OPG templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
