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

function fixFetchBlock(content) {
  const fetchIdx = content.indexOf("const fetchReport = async () => {");
  if (fetchIdx === -1) return content;
  const fetchEnd = content.indexOf("fetchReport();", fetchIdx);
  let block = content.slice(fetchIdx, fetchEnd);

  if (!block.includes("onReportLoaded")) {
    block = block.replace(
      /(\n\s+setTestData\([\s\S]*?\);\n)(\s+\} else \{\n\s+setNotFound\(true\);)/,
      "$1          onReportLoaded?.();\n$2"
    );
    block = block.replace(
      /(\n\s+setReport\([\s\S]*?\);\n)(\s+\} else \{\n\s+setNotFound\(true\);)/,
      (match, before, after) =>
        before.includes("onReportLoaded") ? match : `${before}          onReportLoaded?.();\n${after}`
    );
  }

  return content.slice(0, fetchIdx) + block + content.slice(fetchEnd);
}

function wrapLoadingGuards(content) {
  // Remove accidental embedded guard injected inside JSX
  content = content.replace(
    /\n\s+\} else if \(!report \|\| isRefreshing\) \{\n\s+return null;\n\s+\}\)\(\)\}/g,
    "\n        })()}"
  );

  const marker = content.indexOf("\n  const downloadPDF = async () => {");
  if (marker === -1) return content;

  const afterDownload = content.indexOf("\n  };", marker);
  if (afterDownload === -1) return content;

  const tailStart = afterDownload + "\n  };".length;
  const nextConst = content.slice(tailStart).search(/\n  const [a-zA-Z]/);
  if (nextConst === -1) return content;

  const guardBlock = content.slice(tailStart, tailStart + nextConst);

  if (guardBlock.includes("} else if (!report || isRefreshing)")) {
    return content;
  }

  let cleaned = guardBlock
    .replace(/\n  if \(!embedded\) \{\s*/g, "\n")
    .replace(/\n\s+\n/g, "\n")
    .trim();

  const wrapped = `
  if (!embedded) {
${cleaned
  .split("\n")
  .map((line) => (line.trim() ? `    ${line.trimStart()}` : line))
  .join("\n")}
  } else if (!report || isRefreshing) {
    return null;
  }
`;

  return content.slice(0, tailStart) + wrapped + content.slice(tailStart + nextConst);
}

for (const dir of DIRS) {
  const filePath = path.join(BASE, dir, "ViewServiceReport.tsx");
  let content = fs.readFileSync(filePath, "utf8");
  content = fixFetchBlock(content);
  content = wrapLoadingGuards(content);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Final fix: ${dir}`);
}

console.log("Done.");
