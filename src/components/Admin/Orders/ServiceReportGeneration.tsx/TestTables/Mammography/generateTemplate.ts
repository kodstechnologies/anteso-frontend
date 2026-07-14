import * as path from "path";
import { writeMammographyTemplateFiles } from "./exportMammographyTemplate";

export const generateMammographyTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeMammographyTemplateFiles(outDir);
  console.log(
    "Wrote Mammography_Test_Data_Template_WithTimer.xlsx, Mammography_Test_Data_Template_NoTimer.xlsx, Mammography_Template.xlsx (combined), and CSV templates in",
    outDir
  );
};

if (typeof window === "undefined") {
  generateMammographyTemplates();
}
