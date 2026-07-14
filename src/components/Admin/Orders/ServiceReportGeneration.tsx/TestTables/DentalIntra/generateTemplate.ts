import * as path from "path";
import { writeDentalIntraTemplateFiles } from "./exportDentalIntraTemplate";

export const generateDentalIntraTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeDentalIntraTemplateFiles(outDir);
  console.log(
    "Wrote DentalIntra_Test_Data_Template_WithTimer.xlsx, DentalIntra_Test_Data_Template_NoTimer.xlsx, DentalIntra_Template.xlsx (combined), and CSV templates in",
    outDir
  );
};

if (typeof window === "undefined") {
  generateDentalIntraTemplates();
}
