const fs = require("fs");
const path = require("path");

const NL = "\\r?\\n";
const BASE = path.join(
  __dirname,
  "../src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables"
);

const MACHINES = [
  { dir: "BMD", saveReportPdf: "saveReportPdfForBMD", loadingText: "Loading BMD Report..." },
  { dir: "CTScan", saveReportPdf: "saveReportPdfForCTScan", loadingText: "Loading CT Scan Report..." },
  { dir: "DentalConeBeamCT", saveReportPdf: "saveReportPdfForCBCT", loadingText: "Loading CBCT Report..." },
  { dir: "DentalHandHeld", saveReportPdf: "saveReportPdfForDentalHandHeld", loadingText: "Loading Report..." },
  { dir: "DentalIntra", saveReportPdf: "saveReportPdfForDentalIntra", loadingText: "Loading Dental Intra Report..." },
  { dir: "FixedRadioFluro", saveReportPdf: "saveReportPdfForFixedRadioFluro", loadingText: "Loading Fixed RadioFluro Report..." },
  { dir: "Inventional-Radiology", saveReportPdf: "saveReportPdfForInventionalRadiology", loadingText: "Loading Interventional Radiology Report..." },
  { dir: "Mammography", saveReportPdf: "saveReportPdfForMammography", loadingText: "Loading Mammography Report..." },
  { dir: "OArm", saveReportPdf: "saveReportPdfForOArm", loadingText: "Loading O-Arm Report..." },
  { dir: "OBI", saveReportPdf: "saveReportPdfForOBI", loadingText: "Loading OBI Report..." },
  { dir: "OPG", saveReportPdf: "saveReportPdfForOPG", loadingText: "Loading OPG Report..." },
  { dir: "RadiographyMobile", saveReportPdf: "saveReportPdfForRadiographyMobile", loadingText: "Loading Radiography Mobile Report..." },
  { dir: "RadiographyMobileHT", saveReportPdf: "saveReportPdfForRadiographyMobileHT", loadingText: "Loading Radiography Mobile with HT Report..." },
  { dir: "RadiographyPortable", saveReportPdf: "saveReportPdfForRadiographyPortable", loadingText: "Loading Radiography Portable Report..." },
];

function fixView(filePath, config) {
  let content = fs.readFileSync(filePath, "utf8");

  content = content.replace(new RegExp(`${NL}import \\{ saveReportPdfFor[^}]+ \\} from "\\$1";${NL}`, "g"), "\n");

  if (!content.includes('from "../shared/embeddedViewReportPdf"')) {
    content = content.replace(
      new RegExp(`import \\{ generatePDF \\} from "([^"]+)";${NL}`),
      `import { generatePDF } from "$1";\nimport {\n  EmbeddedViewReportPdfProps,\n  getEmbeddedReportContentId,\n  saveGeneratedReportPdfToDb,\n  useEmbeddedReportPdfAutoSave,\n} from "../shared/embeddedViewReportPdf";\n`
    );
  }

  if (!content.includes(config.saveReportPdf)) {
    content = content.replace(
      /(import \{)([^}]*)(} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/api";)/,
      (full, start, mid, end) => `${start}${mid.trim().replace(/,\s*$/, "")}, ${config.saveReportPdf} ${end}`
    );
  }

  content = content.replace(
    /const serviceId = searchParams\.get\("serviceId"\);/,
    `const serviceId = serviceIdProp || searchParams.get("serviceId");
  const reportContentId = getEmbeddedReportContentId(embedded);`
  );

  content = content.replace(
    new RegExp(`(\\s+try \\{${NL})\\s*setLoading\\(true\\);`, "g"),
    `$1        if (!embedded || !report) {
          setLoading(true);
        } else if (embedded) {
          setIsRefreshing(true);
        }`
  );

  const fetchIdx = content.indexOf("const fetchReport = async () => {");
  if (fetchIdx !== -1) {
    const fetchEnd = content.indexOf("fetchReport();", fetchIdx);
    let fetchBlock = content.slice(fetchIdx, fetchEnd);
    if (!fetchBlock.includes("setNotFound(false)")) {
      fetchBlock = fetchBlock.replace(/(\n\s*)setReport\(\{/, "\n$1setNotFound(false);\n$1setReport({");
    }
    if (!fetchBlock.includes("onReportLoaded")) {
      fetchBlock = fetchBlock.replace(
        /(\n\s+\} else \{\n\s+setNotFound\(true\);)/,
        "\n          onReportLoaded?.();$1"
      );
    }
    content = content.slice(0, fetchIdx) + fetchBlock + content.slice(fetchEnd);
  }

  content = content.replace(
    new RegExp(`(\\s+\\} finally \\{${NL}\\s+setLoading\\(false\\);${NL})(\\s+\\})`, "g"),
    (match, start, end) =>
      match.includes("setIsRefreshing(false)") ? match : `${start}        setIsRefreshing(false);\n${end}`
  );

  content = content.replace(
    new RegExp(`(\\s+fetchReport\\(\\);${NL}\\s+\\}, \\[serviceId\\]\\);)`, "g"),
    (m) => (m.includes("refreshKey") ? m : m.replace("[serviceId]", "[serviceId, refreshKey]"))
  );

  if (!content.includes("} else if (!report || isRefreshing)")) {
    content = content.replace(
      new RegExp(
        `(\\n\\s+)if \\(loading\\) return <div className="min-h-screen flex items-center justify-center text-2xl(?: font-semibold)?">${config.loadingText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/div>;${NL}${NL}(\\s+if \\(notFound \\|\\| !report\\))`
      ),
      `$1if (!embedded) {
$1  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">${config.loadingText}</div>;

$1  $2`
    );

    content = content.replace(
      /(\n\s+if \(notFound \|\| !report\) \{[\s\S]*?\n\s+\}\);\n)(\s+\})/,
      (match, notFoundBlock, closingBrace) => {
        const idx = content.indexOf(notFoundBlock);
        const before = content.slice(0, idx);
        if (!before.includes("if (!embedded) {")) return match;
        return `${notFoundBlock}${closingBrace}
  } else if (!report || isRefreshing) {
    return null;
  }`;
      }
    );
  }

  if (!content.includes("} else if (!report || isRefreshing)")) {
    content = content.replace(
      /(\n\s+)if \(loading\) \{\n([\s\S]*?\n\s+\}\);\n\s+\}\n\n)(\s+if \(notFound \|\| !report\))/,
      `$1if (!embedded) {
$1  if (loading) {
$2$1  }

$1  $3`
    );
    content = content.replace(
      /(\n\s+if \(notFound \|\| !report\) \{[\s\S]*?\n\s+\}\);\n)(\s+\})/,
      (match, notFoundBlock, closingBrace) => {
        const idx = content.indexOf(notFoundBlock);
        const before = content.slice(0, idx);
        if (!before.includes("if (!embedded) {")) return match;
        return `${notFoundBlock}${closingBrace}
  } else if (!report || isRefreshing) {
    return null;
  }`;
      }
    );
  }

  if (content.includes("{!embedded && (") && !content.match(/\}\)\r?\n\s+<div id=\{reportContentId\}/)) {
    content = content.replace(
      /(<div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">[\s\S]*?<\/div>)\r?\n(\s+<div id=\{reportContentId\})/,
      `$1\n      )}\n$2`
    );
  }

  fs.writeFileSync(filePath, content, "utf8");
}

for (const machine of MACHINES) {
  fixView(path.join(BASE, machine.dir, "ViewServiceReport.tsx"), machine);
  console.log(`Fixed: ${machine.dir}`);
}

console.log("Done.");
