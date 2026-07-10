// Generate separate With Timer / No Timer Excel templates for Radiography Mobile
import * as path from "path";
import { writeMobileTemplateWorkbook } from "./exportRadiographyMobileToExcel";

export const generateRadiographyMobileTemplate = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeMobileTemplateWorkbook(outDir);
  console.log(
    `Wrote Radiography_Mobile_Template_WithTimer.xlsx, Radiography_Mobile_Template_NoTimer.xlsx, and Radiography_Mobile_Template.xlsx in ${outDir}`
  );
};

if (typeof window === "undefined") {
  generateRadiographyMobileTemplate();
}
