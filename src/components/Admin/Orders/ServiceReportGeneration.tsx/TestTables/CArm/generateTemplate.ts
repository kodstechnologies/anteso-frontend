import * as path from "path";
import { writeCArmTemplateFiles } from "./exportCArmToExcel";

export const generateCArmTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeCArmTemplateFiles(outDir);
  console.log(
    `Wrote CArm_Test_Data_Template_WithTimer.xlsx, CArm_Test_Data_Template_NoTimer.xlsx, CArm_Template.xlsx (combined), and CSV templates in ${outDir}`
  );
};

if (typeof window === "undefined") {
  generateCArmTemplates();
}
