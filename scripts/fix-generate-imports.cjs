const fs = require("fs");
const path = require("path");

const BASE = path.join(
  __dirname,
  "../src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables"
);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/Generate.*\.tsx$/.test(entry.name)) files.push(full);
  }
  return files;
}

for (const file of walk(BASE)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  content = content.replace(/,\r?\n,\s*(saveReportPdfFor[A-Za-z]+)/g, ",\n    $1");
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Fixed import:", path.relative(BASE, file));
  }
}

// FixedRadioFluro onReportLoaded
const fluroView = path.join(BASE, "FixedRadioFluro/ViewServiceReport.tsx");
let fluro = fs.readFileSync(fluroView, "utf8");
if (!fluro.includes("onReportLoaded?.()")) {
  fluro = fluro.replace(
    /(\n\s+\}\)\);\n)(\s+\} else \{\n\s+console\.error\("FixedRadioFluro report header missing)/,
    "$1          onReportLoaded?.();\n$2"
  );
  fs.writeFileSync(fluroView, fluro, "utf8");
  console.log("Fixed FixedRadioFluro onReportLoaded");
}

console.log("Import fix done.");
