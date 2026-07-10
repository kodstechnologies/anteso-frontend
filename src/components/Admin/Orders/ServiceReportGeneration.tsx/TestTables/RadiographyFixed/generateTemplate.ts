// Generate separate With Timer / No Timer Excel templates for Radiography Fixed
import * as path from "path";
import { writeFixedTemplateWorkbook } from "./exportRadiographyFixedToExcel";

export const generateRadiographyFixedTemplate = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeFixedTemplateWorkbook(outDir);
  console.log(`Wrote RadiographyFixed_Template_WithTimer.xlsx and RadiographyFixed_Template_NoTimer.xlsx in ${outDir}`);
};

if (typeof window === "undefined") {
  generateRadiographyFixedTemplate();
}
