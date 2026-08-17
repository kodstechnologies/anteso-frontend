const fs = require("fs");
const path = require("path");

const BASE = path.join(
  __dirname,
  "../src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables"
);

const FIXES = [
  {
    file: "BMD/GenerateReportForBMD.tsx",
    view: "ViewServiceReportBMD",
    saveReportPdf: "saveReportPdfForBMD",
    prefix: "BMD",
    mainReturnMatch: /(\n  return \(\n    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">\n)/,
  },
  {
    file: "OArm/GenerateReportForOArm.tsx",
    view: "ViewServiceReportOArm",
    saveReportPdf: "saveReportPdfForOArm",
    prefix: "OArm",
    mainReturnMatch: /(\n  return \(\n    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">\n)/,
  },
  {
    file: "Inventional-Radiology/GenerateReportInventionalRadiology.tsx",
    view: "ViewServiceReport",
    saveReportPdf: "saveReportPdfForInventionalRadiology",
    prefix: "InventionalRadiology",
    mainReturnMatch: /(\n  return \(\n    <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">\n)/,
  },
  {
    file: "DentalIntra/GenerateServiceReport.tsx",
    view: "ViewServiceReportDentalIntra",
    saveReportPdf: "saveReportPdfForDentalIntra",
    prefix: "DentalIntra",
    mainReturnMatch: /(\n    return \(\n        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">\n)/,
  },
  {
    file: "DentalHandHeld/GenerateServiceReport.tsx",
    view: "ViewServiceReportDentalHandHeld",
    saveReportPdf: "saveReportPdfForDentalHandHeld",
    prefix: "DentalHandHeld",
    mainReturnMatch: /(\n    return \(\n        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">\n)/,
  },
];

const captureHostBlock = (view, saveReportPdf, prefix, indent = "      ") => `
${indent}<ReportPdfCaptureHost
${indent}  active={pdfSave.pdfCaptureActive}
${indent}  serviceId={serviceId}
${indent}  refreshKey={pdfSave.reportPreviewRefreshKey}
${indent}  autoSavePdfToken={pdfSave.autoSavePdfToken}
${indent}  onReportLoaded={pdfSave.onReportLoaded}
${indent}  onPdfSaveComplete={pdfSave.onPdfSaveComplete}
${indent}  ViewComponent={${view}}
${indent}  saveReportPdf={${saveReportPdf}}
${indent}  pdfFilenamePrefix="${prefix}"
${indent}/>
`;

for (const fix of FIXES) {
  const filePath = path.join(BASE, fix.file);
  let content = fs.readFileSync(filePath, "utf8");

  content = content.replace(
    /\s*<ReportPdfCaptureHost[\s\S]*?\/>\n/g,
    "\n"
  );

  if (!content.includes("<ReportPdfCaptureHost")) {
    content = content.replace(
      fix.mainReturnMatch,
      `$1${captureHostBlock(fix.view, fix.saveReportPdf, fix.prefix, fix.file.includes("Dental") ? "            " : "      ")}`
    );
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Fixed capture host placement: ${fix.file}`);
}

console.log("Done.");
