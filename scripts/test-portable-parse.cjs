const XLSX = require("xlsx");
const path = require("path");

// Minimal copy of detection logic
function isVerticalMetadataRow(row) {
  if (!Array.isArray(row) || row.length === 0) return false;
  const c0 = String(row[0] ?? "").trim();
  const c1 = String(row[1] ?? "").trim();
  const c2 = String(row[2] ?? "").trim();
  if (c0 === "Tolerance Sign" || c0.startsWith("Tolerance Value")) return true;
  if (c0.startsWith("Total Filtration")) return true;
  if (c0 === "Dimension") return true;
  if (c0 === "Set Time (s)" || c0 === "Set Time (ms)") return true;
  if (c0 === "mAs Applied") return true;
  if (c0 === "Location") return true;
  if (c0.startsWith("Applied kVp") || c0.startsWith("Applied kV")) return true;
  if (c0 === "Focus Type") return true;
  if (c0 === "FCD (cm)" && (c2 === "kV" || c2 === "kVp")) return true;
  if (c0 === "FCD (cm)" && c1 !== "" && !/^(kVp|kV|Focus Type|mAs|Field Size)/i.test(c1)) return true;
  if (c0 === "FFD (cm)" && c1 !== "" && !/^kVp$/i.test(c1)) return true;
  return false;
}

function isPortableTableFormat(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    const cell = String(matrix[i]?.[0] ?? "").trim();
    if (!cell.startsWith("TEST:")) continue;
    const nextRow = matrix[i + 1];
    if (!Array.isArray(nextRow)) return false;
    return isVerticalMetadataRow(nextRow);
  }
  return false;
}

const oldPath = path.join(__dirname, "../public/templates/Radiography_Portable_Template.xlsx");
const newPath = path.join(__dirname, "../public/templates/Radiography_Portable_Template.tmp.xlsx");

for (const [label, p] of [
  ["OLD", oldPath],
  ["NEW", newPath],
]) {
  try {
    const wb = XLSX.readFile(p);
    const m = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    console.log(label, "isTable", isPortableTableFormat(m), "sheet", wb.SheetNames[0]);
  } catch (e) {
    console.log(label, "error", e.message);
  }
}
