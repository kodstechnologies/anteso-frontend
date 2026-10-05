import * as XLSX from "xlsx";

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

const linearityOfTimeSection = (): any[][] => [
  ["FDD (cm)", "kV", "mA", "Time Station (sec)", "Measured mR 1", "Measured mR 2", "Measured mR 3"],
  ["100", "80", "100", "0.1", "10.1", "10.2", "10.1"],
  ["100", "80", "100", "0.2", "20.1", "20.2", "20.1"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
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

const consistencySection = (): any[][] => [
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoV)", "0.05"],
  ["FFD", "Test kV", "Test mAs", "Meas 1", "Meas 2", "Meas 3", "Mean", "CoV"],
  ["40", "120", "100", "50.1", "50.2", "50.1", "50.13", "0.01"],
];

const radiationLeakageSection = (): any[][] => [
  [
    "Distance",
    "kV",
    "mA",
    "Time",
    "Location",
    "Front",
    "Back",
    "Left",
    "Right",
    "Top",
    "Max",
    "Unit",
    "Remark",
    "Workload",
    "Workload Unit",
    "Tolerance Value",
    "Tolerance Operator",
    "Tolerance Time",
  ],
  [
    "100",
    "120",
    "100",
    "1",
    "Tube",
    "0.01",
    "0.02",
    "0.01",
    "0.01",
    "0.02",
    "0.02",
    "mR/h",
    "",
    "500",
    "mA in one hour",
    "1",
    "<=",
    "1",
  ],
];

const radiationProtectionSurveySection = (): any[][] => [
  ["kV", "mA", "Time", "Workload", "Location", "mR/hr"],
  ["80", "100", "0.5", "500", "Control Console (Operator Position)", "0.02"],
  ["80", "100", "0.5", "500", "Outside Patient Entrance Door", "0.01"],
];

/** Single Dental Intra import template matching current generate UI. */
export const buildDentalIntraTemplateRows = (_hasTimer?: boolean): any[][] => {
  const rows: any[][] = [];

  appendSection(rows, "ACCURACY OF OPERATING POTENTIAL & TIME", accuracyOfOperatingPotentialAndTimeSection());
  appendSection(rows, "TOTAL FILTRATION", totalFiltrationSection());
  appendSection(rows, "LINEARITY OF TIME", linearityOfTimeSection());
  appendSection(rows, "LINEARITY OF mA LOADING", linearityMaLoadingSection());
  appendSection(rows, "CONSISTENCY OF RADIATION OUTPUT", consistencySection());
  appendSection(rows, "RADIATION LEAKAGE LEVEL", radiationLeakageSection());
  appendSection(rows, "RADIATION PROTECTION SURVEY REPORT", radiationProtectionSurveySection());

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

/** Browser-safe workbook for Download Import Template. */
export const createDentalIntraImportTemplateWorkbook = (): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(buildDentalIntraTemplateRows());
  ws["!cols"] = Array.from({ length: 18 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, "Dental Intra Import");
  return wb;
};

/** Write CSV + Excel templates under public/templates (Node script only). */
export const writeDentalIntraTemplateFiles = async (outputDir: string) => {
  const { writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");

  const templateRows = buildDentalIntraTemplateRows();
  const csvPath = join(outputDir, "DentalIntra_Test_Data_Template.csv");
  const xlsxPath = join(outputDir, "DentalIntra_Test_Data_Template.xlsx");
  const aliasXlsxPath = join(outputDir, "DentalIntra_Template.xlsx");
  const withTimerCsvPath = join(outputDir, "DentalIntra_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = join(outputDir, "DentalIntra_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = join(outputDir, "DentalIntra_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = join(outputDir, "DentalIntra_Test_Data_Template_NoTimer.xlsx");

  const wb = createDentalIntraImportTemplateWorkbook();
  const csv = rowsToCsv(templateRows);

  const writeAll = () => {
    writeFileSync(csvPath, csv, "utf8");
    writeFileSync(withTimerCsvPath, csv, "utf8");
    writeFileSync(noTimerCsvPath, csv, "utf8");
    XLSX.writeFile(wb, xlsxPath);
    XLSX.writeFile(wb, aliasXlsxPath);
    XLSX.writeFile(wb, withTimerXlsxPath);
    XLSX.writeFile(wb, noTimerXlsxPath);
  };

  try {
    writeAll();
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      writeFileSync(csvPath.replace(/\.csv$/i, ".csv.new"), csv, "utf8");
      XLSX.writeFile(wb, xlsxPath.replace(/\.xlsx$/i, ".tmp.xlsx"));
      XLSX.writeFile(wb, join(outputDir, "DentalIntra_Template.tmp.xlsx"));
      console.warn("Dental Intra templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};
