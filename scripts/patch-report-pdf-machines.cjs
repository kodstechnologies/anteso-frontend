/**
 * Patch Generate + ViewServiceReport for report PDF save on header.
 * Run: node scripts/patch-report-pdf-machines.js
 */
const fs = require("fs");
const path = require("path");

const BASE = path.join(
  __dirname,
  "../src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables"
);

const MACHINES = [
  {
    dir: "BMD",
    generate: "GenerateReportForBMD.tsx",
    viewComponent: "ViewServiceReportBMD",
    saveReportHeaderCall: "await saveReportHeaderForBMD(serviceId, payload);",
    saveReportPdf: "saveReportPdfForBMD",
    prefix: "BMD",
  },
  {
    dir: "CTScan",
    generate: "GenerateReport-CTScan.tsx",
    viewComponent: "ViewServiceReportCTScan",
    saveReportHeaderCall:
      "await saveReportHeaderForCTScan(serviceId, payload, headerTubeId);",
    saveReportPdf: "saveReportPdfForCTScan",
    prefix: "CTScan",
  },
  {
    dir: "DentalConeBeamCT",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportCBCT",
    saveReportHeaderCall: "await saveReportHeaderForCBCT(serviceId, payload);",
    saveReportPdf: "saveReportPdfForCBCT",
    prefix: "CBCT",
  },
  {
    dir: "DentalHandHeld",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportDentalHandHeld",
    saveReportHeaderCall:
      "await saveReportHeaderForDentalHandHeld(serviceId, payload);",
    saveReportPdf: "saveReportPdfForDentalHandHeld",
    prefix: "DentalHandHeld",
  },
  {
    dir: "DentalIntra",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportDentalIntra",
    saveReportHeaderCall:
      "await saveReportHeaderForDentalIntra(serviceId, payload);",
    saveReportPdf: "saveReportPdfForDentalIntra",
    prefix: "DentalIntra",
  },
  {
    dir: "FixedRadioFluro",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportFixedRadioFluro",
    saveReportHeaderCall:
      "await saveReportHeaderForFixedRadioFluro(serviceId, payload);",
    saveReportPdf: "saveReportPdfForFixedRadioFluro",
    prefix: "FixedRadioFluro",
  },
  {
    dir: "Inventional-Radiology",
    generate: "GenerateReportInventionalRadiology.tsx",
    viewComponent: "ViewServiceReport",
    saveReportHeaderCall:
      "await saveReportHeaderForInventionalRadiology(serviceId, payload, headerTubeId);",
    saveReportPdf: "saveReportPdfForInventionalRadiology",
    prefix: "InventionalRadiology",
  },
  {
    dir: "Mammography",
    generate: "GenerateReportMammography.tsx",
    viewComponent: "ViewServiceReportMammography",
    saveReportHeaderCall:
      "await saveReportHeaderForMammography(serviceId, payload);",
    saveReportPdf: "saveReportPdfForMammography",
    prefix: "Mammography",
  },
  {
    dir: "OArm",
    generate: "GenerateReportForOArm.tsx",
    viewComponent: "ViewServiceReportOArm",
    saveReportHeaderCall: "await saveReportHeader(serviceId, payload);",
    saveReportPdf: "saveReportPdfForOArm",
    prefix: "OArm",
  },
  {
    dir: "OBI",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportOBI",
    saveReportHeaderCall: "await saveReportHeaderForOBI(serviceId, payload);",
    saveReportPdf: "saveReportPdfForOBI",
    prefix: "OBI",
  },
  {
    dir: "OPG",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportOPG",
    saveReportHeaderCall: "await saveReportHeaderForOPG(serviceId, payload);",
    saveReportPdf: "saveReportPdfForOPG",
    prefix: "OPG",
  },
  {
    dir: "RadiographyMobile",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportRadiographyMobile",
    saveReportHeaderCall:
      "await saveReportHeaderForRadiographyMobile(serviceId, payload);",
    saveReportPdf: "saveReportPdfForRadiographyMobile",
    prefix: "RadiographyMobile",
  },
  {
    dir: "RadiographyMobileHT",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportRadiographyMobileHT",
    saveReportHeaderCall:
      "await saveReportHeaderForRadiographyMobileHT(serviceId, payload);",
    saveReportPdf: "saveReportPdfForRadiographyMobileHT",
    prefix: "RadiographyMobileHT",
  },
  {
    dir: "RadiographyPortable",
    generate: "GenerateServiceReport.tsx",
    viewComponent: "ViewServiceReportRadiographyPortable",
    saveReportHeaderCall:
      "await saveReportHeaderForRadiographyPortable(serviceId, payload);",
    saveReportPdf: "saveReportPdfForRadiographyPortable",
    prefix: "RadiographyPortable",
  },
];

function patchViewServiceReport(config) {
  const filePath = path.join(config.dir, "ViewServiceReport.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("useEmbeddedReportPdfAutoSave")) {
    console.log(`  View already patched: ${config.dir}`);
    return;
  }

  const { viewComponent, saveReportPdf, prefix } = config;

  if (!content.includes("EmbeddedViewReportPdfProps")) {
    content = content.replace(
      /import \{ generatePDF \} from "([^"]+)";\n/,
      `import { generatePDF } from "$1";\nimport {\n  EmbeddedViewReportPdfProps,\n  getEmbeddedReportContentId,\n  saveGeneratedReportPdfToDb,\n  useEmbeddedReportPdfAutoSave,\n} from "../shared/embeddedViewReportPdf";\n`
    );
  }

  if (!content.includes(saveReportPdf)) {
    content = content.replace(
      /from "(\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/api)";/,
      (match) => {
        if (match.includes(saveReportPdf)) return match;
        return match.replace(
          "api",
          `api";\nimport { ${saveReportPdf} } from "$1`
        );
      }
    );
    // Fix double import if api line already had imports only
    content = content.replace(
      /import \{([^}]*)\} from "(\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/api)";\nimport \{ ([^}]*)\} from "\2";/,
      'import { $1, $3 } from "$2";'
    );
    // Simpler: add to first api import
    content = content.replace(
      /(import \{[^}]*)(} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/api";)/,
      (full, start, end) => {
        if (full.includes(saveReportPdf)) return full;
        return `${start}, ${saveReportPdf} ${end}`;
      }
    );
  }

  content = content.replace(
    new RegExp(`const ${viewComponent}: React\\.FC = \\(\\) => \\{`),
    `interface ${viewComponent}Props extends EmbeddedViewReportPdfProps {}

const ${viewComponent}: React.FC<${viewComponent}Props> = ({
  serviceIdProp,
  embedded = false,
  refreshKey = 0,
  onReportLoaded,
  autoSavePdfToken = 0,
  onPdfSaveComplete,
  saveReportPdf = ${saveReportPdf},
  pdfFilenamePrefix = "${prefix}",
}) => {`
  );

  content = content.replace(
    /const \[searchParams\] = useSearchParams\(\);\n\s*const serviceId = searchParams\.get\("serviceId"\);/,
    `const [searchParams] = useSearchParams();
  const serviceId = serviceIdProp || searchParams.get("serviceId");
  const reportContentId = getEmbeddedReportContentId(embedded);`
  );

  if (!content.includes("isRefreshing")) {
    content = content.replace(
      /const \[notFound, setNotFound\] = useState\(false\);/,
      `const [notFound, setNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);`
    );
  }

  content = content.replace(
    /(\s+try \{\n)\s*setLoading\(true\);/,
    `$1        if (!embedded || !report) {
          setLoading(true);
        } else if (embedded) {
          setIsRefreshing(true);
        }`
  );

  // Add setNotFound(false) before first setReport in fetch effect
  const fetchIdx = content.indexOf("const fetchReport = async () => {");
  if (fetchIdx !== -1) {
    const fetchEnd = content.indexOf("fetchReport();", fetchIdx);
    const fetchBlock = content.slice(fetchIdx, fetchEnd);
    if (!fetchBlock.includes("setNotFound(false)")) {
      const setReportIdx = fetchBlock.indexOf("setReport({");
      if (setReportIdx !== -1) {
        const before = fetchBlock.slice(0, setReportIdx);
        const after = fetchBlock.slice(setReportIdx);
        const patchedBlock =
          before.replace(/\n(\s*)setReport\(\{$/, "\n$1setNotFound(false);\n$1setReport({") +
          after;
        content =
          content.slice(0, fetchIdx) + patchedBlock + content.slice(fetchEnd);
      }
    }
  }

  // Add onReportLoaded before else setNotFound in fetch
  content = content.replace(
    /(\s+setTestData\([\s\S]*?\);\n)(\s+\} else \{\n\s+setNotFound\(true\);)/,
    (match, before, elseBlock) => {
      if (before.includes("onReportLoaded")) return match;
      return `${before}          onReportLoaded?.();\n${elseBlock}`;
    }
  );

  content = content.replace(
    /(\s+\} finally \{\n\s+setLoading\(false\);\n)(\s+\})/,
    `$1        setIsRefreshing(false);\n$2`
  );

  content = content.replace(
    /(\s+fetchReport\(\);\n\s+\}, \[serviceId\]\);)/,
    (m) => m.replace("[serviceId]", "[serviceId, refreshKey]")
  );

  const autoSaveBlock = `
  useEmbeddedReportPdfAutoSave({
    embedded,
    autoSavePdfToken,
    serviceId,
    report,
    loading,
    isRefreshing,
    reportContentId,
    pdfFilenamePrefix,
    saveReportPdf,
    onPdfSaveComplete,
  });
`;

  content = content.replace(
    /(\n\s+const downloadPDF = async \(\) => \{)/,
    `${autoSaveBlock}$1`
  );

  content = content.replace(
    /const downloadPDF = async \(\) => \{[\s\S]*?\n  \};/,
    `const downloadPDF = async () => {
    try {
      if (!serviceId || !report) return;
      await saveGeneratedReportPdfToDb({
        serviceId,
        reportContentId,
        testReportNumber: report.testReportNumber,
        pdfFilenamePrefix,
        saveReportPdf,
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };`
  );

  // Single-line loading guard
  content = content.replace(
    /(\n\s+)if \(loading\) return (<[^;]+;)\n\n(\s+if \(notFound \|\| !report\))/,
    `$1if (!embedded) {
$1  if (loading) return$2

$1  $3`
  );

  // Wrap notFound block closing before next const/function
  content = content.replace(
    /(\n\s+if \(notFound \|\| !report\) \{[\s\S]*?\n\s+\}\);\n)(\s+\})/,
    (match, notFoundBlock, closing) => {
      if (match.includes("isRefreshing")) return match;
      return `${notFoundBlock}${closing}
  } else if (!report || isRefreshing) {
    return null;
  }`;
    }
  );

  // Multiline loading guard (BMD style)
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
      (match, notFoundBlock, closing) => {
        if (content.indexOf("isRefreshing") < content.indexOf(notFoundBlock)) return match;
        return `${notFoundBlock}${closing}
  } else if (!report || isRefreshing) {
    return null;
  }`;
      }
    );
  }

  // Floating download button
  if (!content.includes("{!embedded && (")) {
    content = content.replace(
      /(\n\s+)(<\/?(?:div[^>]*className="fixed bottom-8 right-8|{\/\* Floating Buttons \*\/}))/,
      (match, indent, tag) => {
        if (content.includes("{!embedded && (")) return match;
        return `${indent}{!embedded && (
${indent}  ${tag}`;
      }
    );
    content = content.replace(
      /(<div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">[\s\S]*?<\/div>)\n(\s+<div id=\{?reportContentId|"report-content")/,
      `$1\n      )}\n$2`
    );
  }

  content = content.replace(/id="report-content"/g, "id={reportContentId}");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`  View patched: ${config.dir}`);
}

function patchGenerateFile(config) {
  const filePath = path.join(config.dir, config.generate);
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("useReportPdfSaveOnHeader")) {
    console.log(`  Generate already patched: ${config.dir}`);
    return;
  }

  const { viewComponent, saveReportPdf, prefix, saveReportHeaderCall } = config;

  if (!content.includes('from "react-hot-toast"')) {
    content = content.replace(
      /(import React[^\n]*\n)/,
      `$1import toast from "react-hot-toast";\n`
    );
  }

  content = content.replace(
    /(import \{[^}]*)(} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/api";)/,
    (full, start, end) => {
      if (full.includes(saveReportPdf)) return full;
      return `${start}, ${saveReportPdf} ${end}`;
    }
  );

  if (!content.includes("useReportPdfSaveOnHeader")) {
    content = content.replace(
      /(import Standards from "\.\.\/\.\.\/Standards";)/,
      `import { useReportPdfSaveOnHeader } from "../shared/useReportPdfSaveOnHeader";\nimport ReportPdfCaptureHost from "../shared/ReportPdfCaptureHost";\nimport ${viewComponent} from "./ViewServiceReport";\n$1`
    );
    if (!content.includes("useReportPdfSaveOnHeader")) {
      content = content.replace(
        /(import React[^\n]*\n(?:import[^\n]*\n)*)/,
        `$1import { useReportPdfSaveOnHeader } from "../shared/useReportPdfSaveOnHeader";\nimport ReportPdfCaptureHost from "../shared/ReportPdfCaptureHost";\nimport ${viewComponent} from "./ViewServiceReport";\n`
      );
    }
  }

  content = content.replace(
    /const \[saving, setSaving\] = useState\(false\);/,
    `const [saving, setSaving] = useState(false);
  const pdfSave = useReportPdfSaveOnHeader();`
  );

  const headerReplacement = `${saveReportHeaderCall}
      await pdfSave.saveReportPdfAfterHeader();
      toast.success("Report header saved successfully");`;

  if (!content.includes("saveReportPdfAfterHeader")) {
    content = content.replace(saveReportHeaderCall, headerReplacement);
  }

  const captureHost = `
      <ReportPdfCaptureHost
        active={pdfSave.pdfCaptureActive}
        serviceId={serviceId}
        refreshKey={pdfSave.reportPreviewRefreshKey}
        autoSavePdfToken={pdfSave.autoSavePdfToken}
        onReportLoaded={pdfSave.onReportLoaded}
        onPdfSaveComplete={pdfSave.onPdfSaveComplete}
        ViewComponent={${viewComponent}}
        saveReportPdf={${saveReportPdf}}
        pdfFilenamePrefix="${prefix}"
      />
`;

  content = content.replace(
    /(\n\s+return \(\n\s+<div className="max-w-)/,
    `$1`.replace(
      'return (\n    <div className="max-w-',
      `return (\n    <div className="max-w-`
    )
  );

  // Insert capture host after main return div opening
  content = content.replace(
    /(\n\s+return \(\n\s+<div className="max-w-[^"]+"[^>]*>\n)/,
    `$1${captureHost}`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`  Generate patched: ${config.dir}`);
}

for (const machine of MACHINES) {
  console.log(`Patching ${machine.dir}...`);
  const fullDir = path.join(BASE, machine.dir);
  patchViewServiceReport({ ...machine, dir: fullDir });
  patchGenerateFile({ ...machine, dir: fullDir });
}

console.log("Done.");
