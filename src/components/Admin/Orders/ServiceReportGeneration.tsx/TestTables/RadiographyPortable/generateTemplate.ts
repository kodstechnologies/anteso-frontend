// Generate Excel template for Radiography Portable
import * as path from "path";
import { writePortableTemplateWorkbook } from "./exportRadiographyPortableToExcel";

export const generateRadiographyPortableTemplate = () => {
  const out = path.join(process.cwd(), "public", "templates", "Radiography_Portable_Template.xlsx");
  writePortableTemplateWorkbook(out);
  console.log(`Wrote ${out}`);
};

if (typeof window === "undefined") {
  generateRadiographyPortableTemplate();
}
