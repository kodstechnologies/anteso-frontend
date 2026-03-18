import XLSX from "xlsx";

const rows = [];
function sec(title, header, data) {
  rows.push([`TEST: ${title}`]);
  rows.push(header);
  for (const r of data) rows.push(r);
  rows.push([]);
}

sec(
  "ACCURACY OF IRRADIATION TIME",
  ["FCD", "kV", "mA", "Set Time (ms)", "Measured Time (ms)", "Tol Operator", "Tol Value"],
  [
    ["100", "80", "100", "100", "98.5", "<=", "10"],
    ["", "", "", "200", "199", "", ""],
    ["", "", "", "400", "398", "", ""],
  ],
);

sec(
  "TOTAL FILTRATION",
  ["mA Station", "Applied kV", "Meas 1", "Meas 2", "Meas 3", "Avg kV", "Tolerance Sign", "Tolerance Value", "TF Measured", "TF Required"],
  [
    ["50 mA", "50", "50.1", "50.2", "", "", "±", "2.0", "1.2", "1.5"],
    ["100 mA", "70", "70.1", "70.0", "", "", "", "", "", ""],
    ["100 mA", "90", "90.2", "90.1", "", "", "", "", "", ""],
  ],
);

sec(
  "CONSISTENCY OF RADIATION OUTPUT",
  ["FFD", "Time", "Tolerance", "Header 1", "Header 2", "Header 3", "Header 4", "Header 5", "kV", "mA", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"],
  [
    ["100", "100", "0.02", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5", "50", "2", "0.10", "0.11", "0.10", "0.09", "0.10"],
    ["", "", "", "", "", "", "", "", "70", "4", "0.20", "0.21", "0.20", "", ""],
  ],
);

sec("LOW CONTRAST RESOLUTION", ["Hole Size", "Standard"], [["1.0", ">= 1.0 mm"]]);
sec("HIGH CONTRAST RESOLUTION", ["lp/mm", "Standard"], [["2.0", ">= 2.0 lp/mm"]]);

sec(
  "EXPOSURE RATE AT TABLE TOP",
  ["AEC Tolerance", "Non-AEC Tolerance", "Min Focus Distance", "Distance", "kVp", "mA", "Exposure", "Mode"],
  [
    ["10", "5", "30", "100", "80", "100", "0.5", "AEC Mode"],
    ["", "", "", "100", "80", "100", "0.6", "Manual Mode"],
  ],
);

sec(
  "TUBE HOUSING LEAKAGE",
  ["FCD", "kV", "mA", "Time", "Workload", "Tol Value", "Tol Operator", "Location", "Front", "Back", "Left", "Right", "Top"],
  [
    ["100", "80", "100", "1", "1000", "1.0", "less than or equal to", "Tube", "0.05", "0.03", "0.06", "0.04", "0.02"],
    ["", "", "", "", "", "", "", "Collimator", "0.02", "0.02", "0.03", "0.01", ""],
  ],
);

sec(
  "LINEARITY OF MA LOADING",
  ["FCD", "kV", "Time", "Tolerance", "Header 1", "Header 2", "Header 3", "mA", "Meas 1", "Meas 2", "Meas 3"],
  [
    ["100", "70", "100", "0.1", "Meas 1", "Meas 2", "Meas 3", "1", "0.10", "0.11", "0.09"],
    ["", "", "", "", "", "", "", "2", "0.20", "0.21", "0.19"],
  ],
);

sec(
  "LINEARITY OF MAS LOADING",
  ["FCD", "kV", "Tol Operator", "Tol Value", "Header 1", "Header 2", "Header 3", "mAs", "Meas 1", "Meas 2", "Meas 3"],
  [
    ["100", "80", "<=", "0.1", "Meas 1", "Meas 2", "Meas 3", "5", "0.10", "0.11", "0.09"],
    ["", "", "", "", "", "", "", "10", "0.20", "0.21", "0.19"],
  ],
);

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test Data");
XLSX.writeFile(wb, "public/templates/CArm_Template.xlsx");
console.log(`Wrote public/templates/CArm_Template.xlsx (${rows.length} rows)`);

