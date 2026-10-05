import * as path from "path";
import { writeDentalIntraTemplateFiles } from "./exportDentalIntraTemplate";

export const generateDentalIntraTemplates = async () => {
  const outDir = path.join(process.cwd(), "public", "templates");
  await writeDentalIntraTemplateFiles(outDir);
  console.log(
    "Wrote DentalIntra_Test_Data_Template.xlsx / .csv (single template matching generate UI) in",
    outDir
  );
};

if (typeof window === "undefined") {
  void generateDentalIntraTemplates();
}
