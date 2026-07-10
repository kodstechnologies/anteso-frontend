import * as path from "path";
import { writeFixedRadioFluroTemplateFiles } from "./exportFixedRadioFluroToExcel";

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
