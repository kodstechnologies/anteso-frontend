import * as path from "path";
import { writeDentalHandHeldTemplateFiles } from "./exportDentalHandHeldTemplate";

export const generateDentalHandHeldTemplates = () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  writeDentalHandHeldTemplateFiles(outDir);
  console.log(
    "Wrote DentalHandHeld_Test_Data_Template_WithTimer.xlsx, DentalHandHeld_Test_Data_Template_NoTimer.xlsx, DentalHandHeld_Template.xlsx (combined), and CSV templates in",
    outDir
  );
};

if (typeof window === "undefined") {
  generateDentalHandHeldTemplates();
}
