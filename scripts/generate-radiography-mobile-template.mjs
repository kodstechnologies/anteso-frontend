import XLSX from "xlsx";

const rows = [];
const sec = (title, header, data) => {
  rows.push([`TEST: ${title}`]);
  rows.push(header);
  for (const r of data) rows.push(r);
  rows.push([]);
};

// 1) Accuracy of Operating Potential
sec(
  "ACCURACY OF OPERATING POTENTIAL",
  ["mA Station", "Applied kV", "Meas 1", "Meas 2", "Meas 3", "Tolerance Sign", "Tolerance Value", "TF Measured", "TF Required"],
  [
    ["50 mA", "60", "", "", "", "±", "2.0", "", "2.5"],
    ["100 mA", "80", "", "", "", "", "", "", ""],
    ["200 mA", "100", "", "", "", "", "", "", ""],
  ]
);

// 2) Accuracy of Irradiation Time (only if timer exists)
sec(
  "ACCURACY OF IRRADIATION TIME",
  ["FCD", "kV", "mA", "Set Time (ms)", "Measured Time (ms)", "Tolerance Operator", "Tolerance Value"],
  [
    ["100", "80", "100", "100", "", "<=", "5"],
    ["", "", "", "200", "", "", ""],
    ["", "", "", "400", "", "", ""],
  ]
);

// 3) Output Consistency
sec(
  "OUTPUT CONSISTENCY",
  ["FFD", "Tol Operator", "Tol Value", "kV", "mAs", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"],
  [
    ["100", "<=", "0.05", "80", "10", "", "", "", "", ""],
    ["", "", "", "100", "20", "", "", "", "", ""],
  ]
);

// 4) Central Beam Alignment
sec(
  "CENTRAL BEAM ALIGNMENT",
  ["FCD", "kV", "mAs", "Observed Tilt", "Tolerance"],
  [["100", "80", "10", "", "1.5"]]
);

// 5) Congruence of Radiation
sec(
  "CONGRUENCE OF RADIATION",
  ["FCD", "kV", "mAs", "Dimension", "Observed Shift", "Edge Shift", "% FED", "Tolerance"],
  [
    ["100", "80", "10", "X", "", "", "", "2"],
    ["", "", "", "Y", "", "", "", "2"],
  ]
);

// 6) Effective Focal Spot
sec(
  "EFFECTIVE FOCAL SPOT",
  ["FCD", "Focus Type", "Stated Width", "Stated Height", "Measured Width", "Measured Height"],
  [
    ["100", "Small", "", "", "", ""],
    ["", "Large", "", "", "", ""],
  ]
);

// 7) Linearity of mAs Loading Stations
sec(
  "LINEARITY OF MAS LOADING STATIONS",
  ["FCD", "kV", "mAs Applied", "Meas 1", "Meas 2", "Meas 3", "Tolerance Operator", "Tolerance"],
  [
    ["100", "80", "10", "", "", "", "<=", "0.1"],
    ["", "", "20", "", "", "", "", ""],
    ["", "", "50", "", "", "", "", ""],
  ]
);

// 8) Radiation Leakage Level
sec(
  "RADIATION LEAKAGE LEVEL",
  ["FCD", "kV", "mA", "Time", "Workload", "Tol Value", "Tol Operator", "Location", "Left", "Right", "Front", "Back", "Top"],
  [
    ["100", "80", "100", "1.0", "5000", "1.0", "less than or equal to", "Tube", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "Collimator", "", "", "", "", ""],
  ]
);

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test Data");
XLSX.writeFile(wb, "public/templates/Radiography_Mobile_Template.xlsx");
console.log(`Wrote public/templates/Radiography_Mobile_Template.xlsx (${rows.length} rows)`);

