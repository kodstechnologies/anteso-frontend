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
  ["Applied kVp", "mA 1", "mA 2"],
  ["60", "60.1", "60.2"],
  ["80", "80.1", "80.2"],
  ["100", "100.1", "100.2"],
  ["120", "120.1", "120.2"],
];

// Radiography Fixed style: vertical key-value rows
const totalFiltrationSection = (): any[][] => [
  ["Total Filtration Measured (mm Al)", "2.1"],
  ["Total Filtration Required (mm Al)", "2.0"],
  ["Total Filtration At kVp", "80"],
];

const accuracyOfIrradiationTimeSection = (): any[][] => [
  ["FDD (cm)", "kV", "mA", "Set Time (mSec)", "mA Station 1 Time", "mA Station 2 Time"],
  ["100", "80", "100", "100", "101", "99"],
  ["100", "80", "100", "200", "201", "199"],
];

const linearityOfTimeSection = (): any[][] => [
  ["FDD (cm)", "kV", "mA", "Time Station (sec)", "Measured mR 1", "Measured mR 2", "Measured mR 3"],
  ["100", "80", "100", "0.1", "10.1", "10.2", "10.1"],
  ["100", "80", "100", "0.2", "20.1", "20.2", "20.1"],
];

const linearityMaLoadingSection = (): any[][] => [
  ["FDD (cm)", "kV", "Time", "mA Station", "Measured mR 1", "Measured mR 2", "Measured mR 3"],
  ["100", "80", "0.5", "50", "5.1", "5.2", "5.1"],
  ["100", "80", "0.5", "100", "10.1", "10.2", "10.1"],
  ["100", "80", "0.5", "200", "20.1", "20.2", "20.1"],
  ["100", "80", "0.5", "300", "30.1", "30.2", "30.1"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
];

const linearityMasLoadingSection = (): any[][] => [
  ["FDD (cm)", "kV", "mAs Range", "Measured mR 1", "Measured mR 2", "Measured mR 3"],
  ["100", "80", "5", "4.1", "4.2", "4.1"],
  ["100", "80", "10", "8.1", "8.2", "8.1"],
  ["100", "80", "20", "16.1", "16.2", "16.1"],
  ["100", "80", "50", "40.1", "40.2", "40.1"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
];

const consistencySection = (): any[][] => [
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoV)", "0.05"],
  ["FDD (cm)", "Test kV", "Test mAs", "Meas 1", "Meas 2", "Meas 3"],
  ["40", "120", "100", "50.1", "50.2", "50.1"],
];

const tubeHousingLeakageSection = (): any[][] => [
  [
    "Distance",
    "kV",
    "mA",
    "Time",
    "Workload",
    "Tolerance Value",
    "Tolerance Operator",
    "Tolerance Time",
    "Location",
    "Front",
    "Back",
    "Left",
    "Right",
    "Top",
  ],
  [
    "100",
    "120",
    "100",
    "1",
    "500",
    "1",
    "<=",
    "1",
    "Tube",
    "0.01",
    "0.02",
    "0.01",
    "0.01",
    "0.02",
  ],
];

const radiationProtectionSurveySection = (): any[][] => [
  ["kV", "mA", "Time", "Workload", "Location", "mR/hr"],
  ["80", "100", "0.5", "5000", "Control Console (Operator Position)", "0.02"],
  ["80", "100", "0.5", "5000", "Outside Patient Entrance Door", "0.01"],
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
      if (/^(?:FCD|FDD(?:\s*\(cm\))?)$/i.test(first) || /^mAs Range$/i.test(first)) {
        seenMasHeader = true;
      }
      if (seenMasHeader && /^\d+(\.\d+)?$/.test(first) && !/^(?:FCD|FDD(?:\s*\(cm\))?)$/i.test(first)) {
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

/** Build Dental Hand Held TEST: table rows for With Timer or No Timer. */
export const buildDentalHandHeldTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  appendSection(rows, "ACCURACY OF OPERATING POTENTIAL", accuracyOfOperatingPotentialSection());
  appendSection(rows, "TOTAL FILTRATION", totalFiltrationSection());

  if (hasTimer) {
    appendSection(rows, "ACCURACY OF IRRADIATION TIME", accuracyOfIrradiationTimeSection());
    appendSection(rows, "LINEARITY OF TIME", linearityOfTimeSection());
    appendSection(rows, "LINEARITY OF mA LOADING", linearityMaLoadingSection());
  } else {
    appendSection(rows, "LINEARITY OF mAs LOADING", linearityMasLoadingSection());
  }

  appendSection(rows, "CONSISTENCY OF RADIATION OUTPUT", consistencySection());
  appendSection(rows, "TUBE HOUSING LEAKAGE", tubeHousingLeakageSection());
  appendSection(rows, "RADIATION PROTECTION SURVEY REPORT", radiationProtectionSurveySection());

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

/** Write With Timer / No Timer CSV + Excel templates under public/templates. */
export const writeDentalHandHeldTemplateFiles = (outputDir: string) => {
  const withTimer = buildDentalHandHeldTemplateRows(true);
  const noTimer = buildDentalHandHeldTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "DentalHandHeld_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "DentalHandHeld_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "DentalHandHeld_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "DentalHandHeld_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "DentalHandHeld_Template.xlsx");
  const legacyCsvPath = path.join(outputDir, "DentalHandHeld_Test_Data_Template.csv");

  const wsWithTimer = aoaToTextSafeSheet(withTimer);
  const wsNoTimer = aoaToTextSafeSheet(noTimer);
  wsWithTimer["!cols"] = Array.from({ length: 14 }, () => ({ wch: 18 }));
  wsNoTimer["!cols"] = Array.from({ length: 14 }, () => ({ wch: 18 }));

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
      XLSX.writeFile(wbCombined, path.join(outputDir, "DentalHandHeld_Template.tmp.xlsx"));
      console.warn("Dental Hand Held templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
