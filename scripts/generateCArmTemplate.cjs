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

const rows = [];
function sec(title, header, data) {
  rows.push([`TEST: ${title}`]);
  rows.push(header);
  for (const r of data) rows.push(r);
  rows.push([]);
}

sec(
  'ACCURACY OF IRRADIATION TIME',
  ['FDD (cm)', 'kV', 'mA', 'Set Time (sec)', 'Measured Time (sec)', 'Tol Operator', 'Tol Value'],
  [
    ['100', '80', '100', '100', '98.5', '<=', '10'],
    ['', '', '', '200', '199', '', ''],
    ['', '', '', '400', '398', '', ''],
  ],
);

sec(
  'TOTAL FILTRATION',
  [
    'Tolerance Sign',
    'Tolerance Value',
    'TF Measured',
    'TF Required',
    'Header 1',
    'Header 2',
    'Header 3',
    'Applied kVp',
    'Meas 1',
    'Meas 2',
    'Meas 3',
  ],
  [
    ['±', '2.0', '1.2', '1.5', '50 mA', '100 mA', '200 mA', '60', '60.1', '60.2', '60.0'],
    ['', '', '', '', '', '', '', '80', '80.1', '80.2', '80.0'],
    ['', '', '', '', '', '', '', '100', '100.1', '100.2', '100.0'],
    ['', '', '', '', '', '', '', '120', '120.1', '120.2', '120.0'],
  ],
);

sec(
  'CONSISTENCY OF RADIATION OUTPUT',
  [
    'FDD (cm)',
    'Time (s)',
    'Tolerance',
    'Header 1',
    'Header 2',
    'Header 3',
    'Header 4',
    'Header 5',
    'kVp',
    'mA',
    'Meas 1',
    'Meas 2',
    'Meas 3',
    'Meas 4',
    'Meas 5',
  ],
  [
    ['100', '100', '0.02', 'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5', '80', '100', '10.5', '10.4', '10.6', '10.5', '10.5'],
    ['', '', '', '', '', '', '', '', '100', '100', '12.1', '12.0', '12.2', '12.1', '12.0'],
  ],
);

sec('LOW CONTRAST RESOLUTION', ['Smallest Hole Size (mm)', 'Recommended Standard'], [['1.0', '>= 1.0 mm']]);
sec('HIGH CONTRAST RESOLUTION', ['Measured Resolution (lp/mm)', 'Recommended Standard (lp/mm)'], [['2.0', '>= 2.0 lp/mm']]);

sec(
  'EXPOSURE RATE AT TABLE TOP',
  [
    'Max Exposure (AEC Mode) (cGy/Min)',
    'Max Exposure (Manual Mode) (cGy/Min)',
    'Min. Focus to Tabletop Distance',
    'Distance (cm)',
    'Applied kV',
    'Applied mA',
    'Exposure (cGy/Min)',
  ],
  [
    ['10', '5', '30', '100', '80', '100', '0.5'],
    ['', '', '', '100', '80', '100', '0.6'],
  ],
);

sec(
  'TUBE HOUSING LEAKAGE',
  [
    'FDD (cm)',
    'kV',
    'mA',
    'Time (sec)',
    'Workload (mA·min/week)',
    'Tol Value',
    'Tol Operator',
    'Location',
    'Front',
    'Back',
    'Left',
    'Right',
    'Top',
  ],
  [
    ['100', '80', '100', '1', '1000', '1.0', 'less than or equal to', 'Tube', '0.05', '0.03', '0.06', '0.04', '0.02'],
    ['', '', '', '', '', '', '', 'Collimator', '0.02', '0.02', '0.03', '0.01', ''],
  ],
);

sec(
  'LINEARITY OF MA LOADING',
  ['FDD (cm)', 'kV', 'Time (sec)', 'Tolerance', 'Header 1', 'Header 2', 'Header 3', 'mA', 'Meas 1', 'Meas 2', 'Meas 3'],
  [
    ['100', '70', '100', '0.1', 'Meas 1', 'Meas 2', 'Meas 3', '50', '0.10', '0.11', '0.09'],
    ['', '', '', '', '', '', '', '100', '0.20', '0.21', '0.19'],
    ['', '', '', '', '', '', '', '200', '0.40', '0.41', '0.39'],
  ],
);

sec(
  'LINEARITY OF MAS LOADING',
  ['FDD (cm)', 'kV', 'Tol Operator', 'Tol Value', 'Header 1', 'Header 2', 'Header 3', 'mAs Range', 'Meas 1', 'Meas 2', 'Meas 3'],
  [
    ['100', '80', '<', '0.1', 'Meas 1', 'Meas 2', 'Meas 3', '5 - 10', '0.50', '0.51', '0.49'],
    ['', '', '', '', '', '', '', '10 - 20', '1.00', '1.01', '0.99'],
    ['', '', '', '', '', '', '', '20 - 50', '2.50', '2.51', '2.49'],
    ['', '', '', '', '', '', '', '50 - 100', '5.00', '5.01', '4.99'],
  ],
);

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, 'Test Data');

for (const name of ['CArm_Template.xlsx', 'CArm_Template.tmp.xlsx']) {
  const outPath = path.join(outputDir, name);
  try {
    XLSX.writeFile(wb, outPath);
    console.log('C-Arm template written to:', outPath);
  } catch (err) {
    console.warn(`Could not write ${outPath}:`, err.message);
  }
}
