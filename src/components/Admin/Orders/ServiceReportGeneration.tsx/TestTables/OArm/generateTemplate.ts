import * as path from "path";
import { writeOArmTemplateFiles } from "./exportOArmToExcel";

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
