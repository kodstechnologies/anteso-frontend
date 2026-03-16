/**
 * Script to generate the C-Arm Excel test data template.
 * Run with: node scripts/generateCArmTemplate.cjs
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const rows = [
  // TEST: Accuracy of Irradiation Time
  ['TEST: ACCURACY OF IRRADIATION TIME'],
  ['FCD', '100', 'kV', '80', 'mA', '100'],
  ['Set Time (ms)', 'Measured Time (ms)'],
  ['100', ''],
  ['200', ''],
  ['400', ''],
  ['Tolerance', '<=', '10%'],
  [],

  // TEST: Total Filtration & Accuracy of Operating Potential
  ['TEST: TOTAL FILTRATION AND ACCURACY OF OPERATING POTENTIAL'],
  ['Applied kVp', 'Meas 1 (50 mA)', 'Meas 2 (100 mA)', 'Average kVp', 'Remarks'],
  ['60', '', '', '', ''],
  ['80', '', '', '', ''],
  ['100', '', '', '', ''],
  ['Total Filtration', 'Measured (mm Al)', 'Required (mm Al)', 'At kVp'],
  ['TotalFiltration', '', '2.5', '80'],
  [],

  // TEST: Consistency of Radiation Output
  ['TEST: CONSISTENCY OF RADIATION OUTPUT'],
  ['FFD (cm)', '100', 'Time (ms)', '100'],
  ['kV', 'mA', 'Meas 1', 'Meas 2', 'Meas 3', 'Mean', 'CoV'],
  ['80', '100', '', '', '', '', ''],
  ['100', '100', '', '', '', '', ''],
  ['Tolerance (CoV)', '0.02'],
  [],

  // TEST: Low Contrast Resolution
  ['TEST: LOW CONTRAST RESOLUTION'],
  ['Smallest Hole Size (mm)', 'Recommended Standard'],
  ['', ''],
  [],

  // TEST: High Contrast Resolution
  ['TEST: HIGH CONTRAST RESOLUTION'],
  ['Line Pairs per mm (Lp/mm)'],
  [''],
  [],

  // TEST: Exposure Rate At Table Top
  ['TEST: EXPOSURE RATE AT TABLE TOP'],
  ['AEC Tolerance (%)', '', 'Non-AEC Tolerance (%)', '', 'Min Focus Distance (cm)', '100'],
  ['Distance (cm)', 'mR 1', 'mR 2', 'mR 3'],
  ['100', '', '', ''],
  [],

  // TEST: Tube Housing Leakage
  ['TEST: TUBE HOUSING LEAKAGE'],
  ['FCD (cm)', '100', 'kV', '80', 'mA', '100', 'Time (min)', '1', 'Workload', '1000'],
  ['Tolerance (mGy/h)', '1.0'],
  ['Location', 'Left', 'Right', 'Front', 'Back', 'Top'],
  ['Tube', '', '', '', '', ''],
  ['Collimator', '', '', '', '', ''],
  [],

  // TEST: Linearity of mA Loading
  ['TEST: LINEARITY OF mA LOADING'],
  ['FCD (cm)', '100', 'kV', '80', 'Time (ms)', '100'],
  ['mA Station', 'Meas 1', 'Meas 2', 'Meas 3'],
  ['50', '', '', ''],
  ['100', '', '', ''],
  ['Tolerance (CoL)', '0.1'],
  [],

  // TEST: Linearity of mAs Loading
  ['TEST: LINEARITY OF mAs LOADING'],
  ['FCD (cm)', '100', 'kV', '80'],
  ['mAs', 'Meas 1', 'Meas 2', 'Meas 3'],
  ['5', '', '', ''],
  ['10', '', '', ''],
  ['Tolerance (CoL)', '0.1'],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, 'Test Data');

const outPath = path.join(outputDir, 'CArm_Template.xlsx');
XLSX.writeFile(wb, outPath);
console.log('C-Arm template written to:', outPath);
