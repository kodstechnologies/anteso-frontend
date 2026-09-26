import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const appendSection = (rows: any[][], title: string, lines: any[][]) => {
  rows.push([`TEST: ${title}`]);
  lines.forEach((line) => rows.push(line));
  rows.push([]);
};

/** Combined Accuracy of Operating Potential & Time — matches generate UI. */
const accuracyOfOperatingPotentialAndTimeSection = (): any[][] => [
  ["kVp Tolerance Sign", "±"],
  ["kVp Tolerance Value", "5"],
  ["Time Tolerance Sign", "±"],
  ["Time Tolerance Value (%)", "10"],
  ["Applied kVp", "Set Time", "Meas 1 kVp", "Meas 1 Time", "Meas 2 kVp", "Meas 2 Time"],
  ["60", "0.100", "60.1", "0.101", "60.2", "0.099"],
  ["80", "0.100", "80.1", "0.101", "80.2", "0.099"],
  ["100", "0.100", "100.1", "0.101", "100.2", "0.099"],
  ["120", "0.100", "120.1", "0.101", "120.2", "0.099"],
];

const totalFiltrationSection = (): any[][] => [
  ["Total Filtration Measured (mm Al)", "2.1"],
  ["Total Filtration Required (mm Al)", "2.0"],
  ["Total Filtration At kVp", "80"],
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

const radiationLeakageSection = (): any[][] => [
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
  ["80", "100", "0.5", "500", "Control Console (Operator Position)", "0.02"],
  ["80", "100", "0.5", "500", "Outside Patient Entrance Door", "0.01"],
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

/** Single Dental Intra template matching current generate UI (no timer/no-timer split). */
export const buildDentalIntraTemplateRows = (_hasTimer?: boolean): any[][] => {
  const rows: any[][] = [];

  appendSection(rows, "ACCURACY OF OPERATING POTENTIAL & TIME", accuracyOfOperatingPotentialAndTimeSection());
  appendSection(rows, "TOTAL FILTRATION", totalFiltrationSection());
  appendSection(rows, "LINEARITY OF mAs LOADING", linearityMasLoadingSection());
  appendSection(rows, "LINEARITY OF mA LOADING", linearityMaLoadingSection());
  appendSection(rows, "CONSISTENCY OF RADIATION OUTPUT", consistencySection());
  appendSection(rows, "RADIATION LEAKAGE LEVEL", radiationLeakageSection());
  appendSection(rows, "RADIATION PROTECTION SURVEY REPORT", radiationProtectionSurveySection());

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

/** Write one Dental Intra CSV + Excel template under public/templates. */
export const writeDentalIntraTemplateFiles = (outputDir: string) => {
  const templateRows = buildDentalIntraTemplateRows();

  const csvPath = path.join(outputDir, "DentalIntra_Test_Data_Template.csv");
  const xlsxPath = path.join(outputDir, "DentalIntra_Test_Data_Template.xlsx");
  const aliasXlsxPath = path.join(outputDir, "DentalIntra_Template.xlsx");
  // Legacy filenames — same single template so old links stay valid
  const withTimerCsvPath = path.join(outputDir, "DentalIntra_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "DentalIntra_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "DentalIntra_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "DentalIntra_Test_Data_Template_NoTimer.xlsx");

  const ws = aoaToTextSafeSheet(templateRows);
  ws["!cols"] = Array.from({ length: 14 }, () => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dental Intra");

  const csv = rowsToCsv(templateRows);

  const writeAll = () => {
    fs.writeFileSync(csvPath, csv, "utf8");
    fs.writeFileSync(withTimerCsvPath, csv, "utf8");
    fs.writeFileSync(noTimerCsvPath, csv, "utf8");
    XLSX.writeFile(wb, xlsxPath);
    XLSX.writeFile(wb, aliasXlsxPath);
    XLSX.writeFile(wb, withTimerXlsxPath);
    XLSX.writeFile(wb, noTimerXlsxPath);
  };

  try {
    writeAll();
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      fs.writeFileSync(csvPath.replace(/\.csv$/i, ".csv.new"), csv, "utf8");
      XLSX.writeFile(wb, xlsxPath.replace(/\.xlsx$/i, ".tmp.xlsx"));
      XLSX.writeFile(wb, path.join(outputDir, "DentalIntra_Template.tmp.xlsx"));
      console.warn("Dental Intra templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
