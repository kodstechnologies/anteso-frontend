import * as path from "path";
import { writeOPGTemplateFiles } from "./exportOPGTemplate";

export const generateOPGTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeOPGTemplateFiles(outDir);
  console.log(
    "Wrote Dental_OPG_Test_Data_Template_WithTimer.xlsx, Dental_OPG_Test_Data_Template_NoTimer.xlsx, Dental_OPG_Template.xlsx (combined), and CSV templates in",
    outDir
  );
};

if (typeof window === "undefined") {
  generateOPGTemplates();
}
