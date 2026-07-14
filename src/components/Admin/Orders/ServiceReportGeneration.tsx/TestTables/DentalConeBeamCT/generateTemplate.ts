import * as path from "path";
import { writeCBCTTemplateFiles } from "./exportCBCTTemplate";

export const generateCBCTTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeCBCTTemplateFiles(outDir);
  console.log(
    "Wrote Dental_CBCT_Test_Data_Template_WithTimer.xlsx, Dental_CBCT_Test_Data_Template_NoTimer.xlsx, Dental_CBCT_Template.xlsx (combined), and CSV templates in",
    outDir
  );
};

if (typeof window === "undefined") {
  generateCBCTTemplates();
}
