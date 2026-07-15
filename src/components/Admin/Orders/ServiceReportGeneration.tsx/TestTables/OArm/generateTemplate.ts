import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import {
  aoaToTextSafeSheet,
  buildOArmTemplateRows,
  rowsToCsv,
} from "./exportOArmToExcel";

export const writeOArmTemplateFiles = (outputDir: string) => {
  const withTimer = buildOArmTemplateRows(true);
  const noTimer = buildOArmTemplateRows(false);

  const withTimerCsvPath = path.join(outputDir, "OArm_Test_Data_Template_WithTimer.csv");
  const noTimerCsvPath = path.join(outputDir, "OArm_Test_Data_Template_NoTimer.csv");
  const withTimerXlsxPath = path.join(outputDir, "OArm_Test_Data_Template_WithTimer.xlsx");
  const noTimerXlsxPath = path.join(outputDir, "OArm_Test_Data_Template_NoTimer.xlsx");
  const combinedXlsxPath = path.join(outputDir, "OArm_Template.xlsx");

  const wbCombined = XLSX.utils.book_new();
  const wsWithTimer = aoaToTextSafeSheet(withTimer);
  const wsNoTimer = aoaToTextSafeSheet(noTimer);
  wsWithTimer["!cols"] = Array.from({ length: 16 }, () => ({ wch: 18 }));
  wsNoTimer["!cols"] = Array.from({ length: 16 }, () => ({ wch: 18 }));
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
      XLSX.writeFile(wbCombined, path.join(outputDir, "OArm_Template.tmp.xlsx"));
      console.warn("O-Arm templates locked; wrote .new / .tmp variants");
      return;
    }
    throw e;
  }
};

export const generateOArmTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeOArmTemplateFiles(outDir);
  console.log(
    `Wrote OArm_Test_Data_Template_WithTimer.xlsx, OArm_Test_Data_Template_NoTimer.xlsx, OArm_Template.xlsx (combined), and CSV templates in ${outDir}`
  );
};

if (typeof window === "undefined") {
  generateOArmTemplates();
}
