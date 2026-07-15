import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import {
  buildFixedRadioFluroTemplateRows,
  rowsToCsv,
} from "./exportFixedRadioFluroToExcel";

export const writeFixedRadioFluroTemplateFiles = (outputDir: string) => {
  const withTimer = buildFixedRadioFluroTemplateRows(true);
  const noTimer = buildFixedRadioFluroTemplateRows(false);

  const withTimerPath = path.join(outputDir, "FixedRadioFluro_Test_Data_Template_WithTimer.csv");
  const noTimerPath = path.join(outputDir, "FixedRadioFluro_Test_Data_Template_NoTimer.csv");

  const wb = XLSX.utils.book_new();
  const wsTimer = XLSX.utils.aoa_to_sheet(withTimer);
  const wsNoTimer = XLSX.utils.aoa_to_sheet(noTimer);
  wsTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
  wsNoTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsTimer, "With Timer");
  XLSX.utils.book_append_sheet(wb, wsNoTimer, "Without Timer");

  try {
    fs.writeFileSync(withTimerPath, rowsToCsv(withTimer), "utf8");
    fs.writeFileSync(noTimerPath, rowsToCsv(noTimer), "utf8");
    XLSX.writeFile(wb, path.join(outputDir, "FixedRadioFluro_Test_Data_Template.xlsx"));
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      fs.writeFileSync(withTimerPath.replace(/\.csv$/i, ".csv.new"), rowsToCsv(withTimer), "utf8");
      fs.writeFileSync(noTimerPath.replace(/\.csv$/i, ".csv.new"), rowsToCsv(noTimer), "utf8");
      const tmpXlsx = path.join(outputDir, "FixedRadioFluro_Test_Data_Template.tmp.xlsx");
      XLSX.writeFile(wb, tmpXlsx);
      console.warn(`Templates locked; wrote .csv.new files and ${tmpXlsx}`);
      return;
    }
    throw e;
  }
};

export const generateFixedRadioFluroTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeFixedRadioFluroTemplateFiles(outDir);
  console.log(
    `Wrote FixedRadioFluro_Test_Data_Template_WithTimer.csv, FixedRadioFluro_Test_Data_Template_NoTimer.csv, and FixedRadioFluro_Test_Data_Template.xlsx in ${outDir}`
  );
};

if (typeof window === "undefined") {
  generateFixedRadioFluroTemplates();
}
