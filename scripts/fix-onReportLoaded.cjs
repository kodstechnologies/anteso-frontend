const fs = require("fs");
const path = require("path");

const BASE = path.join(
  __dirname,
  "../src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables"
);

const DIRS = [
  "BMD",
  "CTScan",
  "DentalConeBeamCT",
  "DentalHandHeld",
  "DentalIntra",
  "FixedRadioFluro",
  "Inventional-Radiology",
  "Mammography",
  "OArm",
  "OBI",
  "OPG",
  "RadiographyMobile",
  "RadiographyMobileHT",
  "RadiographyPortable",
];

for (const dir of DIRS) {
  const viewPath = path.join(BASE, dir, "ViewServiceReport.tsx");
  let content = fs.readFileSync(viewPath, "utf8");

  const fetchIdx = content.indexOf("const fetchReport = async () => {");
  if (fetchIdx !== -1) {
    const fetchEnd = content.indexOf("fetchReport();", fetchIdx);
    let block = content.slice(fetchIdx, fetchEnd);
    if (!block.includes("onReportLoaded")) {
      block = block.replace(
        /(\n\s+\} else \{\r?\n\s+setNotFound\(true\);\r?\n\s+\}\r?\n\s+\} catch)/,
        "\n          onReportLoaded?.();$1"
      );
      content = content.slice(0, fetchIdx) + block + content.slice(fetchEnd);
    }
  }

  fs.writeFileSync(viewPath, content, "utf8");
}

const mammoPath = path.join(BASE, "Mammography/GenerateReportMammography.tsx");
let mammo = fs.readFileSync(mammoPath, "utf8");
if (!mammo.includes("<ReportPdfCaptureHost")) {
  mammo = mammo.replace(
    /(\n    return \(\r?\n        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">\r?\n)/,
    `$1            <ReportPdfCaptureHost
                active={pdfSave.pdfCaptureActive}
                serviceId={serviceId}
                refreshKey={pdfSave.reportPreviewRefreshKey}
                autoSavePdfToken={pdfSave.autoSavePdfToken}
                onReportLoaded={pdfSave.onReportLoaded}
                onPdfSaveComplete={pdfSave.onPdfSaveComplete}
                ViewComponent={ViewServiceReportMammography}
                saveReportPdf={saveReportPdfForMammography}
                pdfFilenamePrefix="Mammography"
            />\n`
  );
  fs.writeFileSync(mammoPath, mammo, "utf8");
  console.log("Added Mammography ReportPdfCaptureHost");
}

console.log("onReportLoaded pass done.");
