const fs = require("fs");
const path =
  "d:/PRAJWALA/anteso/anteso-frontend/src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/CTScan/ViewServiceReport.tsx";
let s = fs.readFileSync(path, "utf8");

const startMarker =
  "  // Shared/common tests rendered once (after both tube passes) for double-tube reports\n  const renderSharedTestSections = () => (";
const endMarker = "  );\n\n  const toolsArray";

const startIdx = s.indexOf(startMarker);
const endIdx = s.indexOf(endMarker);
if (startIdx < 0 || endIdx < 0) {
  console.error("Markers not found", startIdx, endIdx);
  process.exit(1);
}

const oldFn = s.slice(startIdx, endIdx);

function extractSection(src, commentLabel) {
  const re = new RegExp(
    "\\n      /\\* " +
      commentLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      " \\*/[\\s\\S]*?(?=\\n      /\\*|\\n    </>)"
  );
  const m = src.match(re);
  if (!m) throw new Error("Section not found: " + commentLabel);
  return m[0];
}

const sections = {
  timer: extractSection(oldFn, "1. Timer Accuracy"),
  ctdi: extractSection(oldFn, "2. Measurement of CTDI"),
  lowContrast: extractSection(oldFn, "3. Low Contrast Resolution"),
  totalFilt: extractSection(oldFn, "4. Total Filtration"),
  tablePos: extractSection(oldFn, "5. Table Position"),
  gantry: extractSection(oldFn, "6. Gantry Tilt Measurement"),
  measureMax: extractSection(oldFn, "7. Measure Max Radiation Level"),
  survey: extractSection(oldFn, "8. Radiation Protection Survey Report"),
  alignment: extractSection(oldFn, "9. Alignment of Table/Gantry"),
};

function toData(section) {
  return section.replace(/testData\./g, "data.");
}

function renumber(section, fromNum, toNum, titleHint) {
  let out = section.replace(
    new RegExp("/\\* " + fromNum + "\\. "),
    "/* " + toNum + ". "
  );
  out = out.replace(
    new RegExp(
      ">" +
        fromNum +
        "\\. " +
        titleHint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    ),
    ">" + toNum + ". " + titleHint
  );
  return out;
}

const addTube = [
  renumber(toData(sections.timer), 1, 7, "Timer Accuracy"),
  renumber(toData(sections.ctdi), 2, 8, "Measurement of CTDI"),
  renumber(toData(sections.lowContrast), 3, 9, "Low Contrast Resolution"),
  renumber(toData(sections.totalFilt), 4, 10, "Total Filtration"),
  renumber(
    toData(sections.measureMax),
    7,
    11,
    "Measure Maximum Radiation Level"
  ),
].join("");

const common = [
  renumber(sections.tablePos, 5, 1, "Table Position"),
  renumber(sections.gantry, 6, 2, "Gantry Tilt Measurement"),
  renumber(sections.survey, 8, 3, "Radiation Protection Survey Report"),
  renumber(sections.alignment, 9, 4, "Alignment of Table/Gantry"),
].join("");

const newBlock = `  // Per-tube additional tests (7-11) for double-tube reports — data comes from testDataTubeA/B
  const renderAdditionalTubeTests = (data: any) => (
    <>${addTube}
    </>
  );

  // Shared mechanical / common tests rendered once after both tube passes
  const renderCommonMechanicalTests = () => (
    <>${common}
    </>
  );

`;

s = s.slice(0, startIdx) + newBlock + s.slice(endIdx);

// Insert renderAdditionalTubeTests after leakage section in tubePasses map
const leakageEnd =
  "{renderLeakageSection(pass.data.leakage)}\n                      </div>\n                    )}";
const leakageIdx = s.indexOf(leakageEnd);
if (leakageIdx < 0) {
  console.error("Leakage section end not found");
  process.exit(1);
}
const insertAt = leakageIdx + leakageEnd.length;
const insertSnippet = "\n                    {renderAdditionalTubeTests(pass.data)}";
s = s.slice(0, insertAt) + insertSnippet + s.slice(insertAt);

if (!s.includes("{renderSharedTestSections()}")) {
  console.error("renderSharedTestSections call not found");
  process.exit(1);
}
s = s.replace("{renderSharedTestSections()}", "{renderCommonMechanicalTests()}");

fs.writeFileSync(path, s);
console.log("OK");
console.log(
  "has renderAdditionalTubeTests:",
  s.includes("const renderAdditionalTubeTests")
);
console.log(
  "has renderCommonMechanicalTests:",
  s.includes("const renderCommonMechanicalTests")
);
console.log(
  "old renderShared left:",
  s.includes("renderSharedTestSections")
);
console.log(
  "call additional:",
  s.includes("{renderAdditionalTubeTests(pass.data)}")
);
console.log(
  "call common:",
  s.includes("{renderCommonMechanicalTests()}")
);
