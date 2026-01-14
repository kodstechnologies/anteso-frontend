import XLSX from 'xlsx';
import path from 'path';

// Define the data structure
const data = [];

// Helper to add section
const addSection = (title, headers, rows) => {
    data.push(['TEST: ' + title]);
    data.push(headers);
    rows.forEach(row => data.push(row));
    data.push([]); // Empty row
};

// 1. RADIATION PROFILE WIDTH
addSection('RADIATION PROFILE WIDTH FOR CT SCAN',
    ['Applied', 'Measured', 'kVp', 'mA'],
    [
        ['0.6', '0.62', '120', '200'],
        ['1.25', '1.27', '', ''],
        ['3.0', '3.05', '', '']
    ]
);

// 2. MEASUREMENT OF OPERATING POTENTIAL
addSection('MEASUREMENT OF OPERATING POTENTIAL',
    ['Set kV', '@ mA 10', '@ mA 100', '@ mA 200', 'Time (ms)', 'Slice Thickness (mm)', 'Tol Value', 'Tol Type', 'Tol Sign'],
    [
        ['80', '80.1', '80.2', '80.3', '100', '5', '5', '%', '±'],
        ['100', '100.2', '100.1', '100.3', '', '', '', '', ''],
        ['120', '120.5', '120.4', '120.6', '', '', '', '', '']
    ]
);

// 3. MEASUREMENT OF MA LINEARITY
addSection('MEASUREMENT OF MA LINEARITY',
    ['kVp', 'Slice Thickness (mm)', 'Time (ms)', 'mA Applied', 'Meas 1', 'Meas 2', 'Meas 3'],
    [
        ['80', '5.0', '100', '10', '10.1', '10.2', '10.3'],
        ['80', '5.0', '100', '20', '20.2', '20.1', '20.3'],
        ['80', '5.0', '100', '50', '50.5', '50.4', '50.6'],
        ['80', '5.0', '100', '100', '101.0', '100.8', '101.2']
    ]
);

// 4. TIMER ACCURACY
addSection('TIMER ACCURACY',
    ['kVp', 'Slice Thickness (mm)', 'mA', 'Set Time (ms)', 'Observed Time (ms)', 'Tolerance (%)'],
    [
        ['80', '5.0', '100', '100', '98.5', '5'],
        ['80', '5.0', '100', '200', '199', '']
    ]
);

// 5. LINEARITY OF mAs LOADING
addSection('LINEARITY OF MAS LOADING',
    ['mAs Range', 'Result', 'FCD', 'kV', 'Tolerance'],
    [
        ['50', '4.5', '100', '120', '0.10'],
        ['100', '9.1', '', '', '']
    ]
);

// 6. MEASUREMENT OF CTDI
addSection('MEASUREMENT OF CTDI',
    ['kVp', 'mAs', 'Slice Thickness (mm)', 'CTDIw (Rated) Head', 'CTDIw (Rated) Body', 'Tol Value', 'Tol Sign', 'Type', 'Label', 'Head', 'Body'],
    [
        ['120', '100', '5.0', '15.5', '12.2', '5', '±', 'Axial Dose CTDIc', '', '16.0', '13.0'],
        ['', '', '', '', '', '', '', 'Peripheral Dose', 'A', '15.5', '12.5'],
        ['', '', '', '', '', '', '', 'Peripheral Dose', 'B', '15.7', '12.7'],
        ['', '', '', '', '', '', '', 'Peripheral Dose', 'C', '15.6', '12.6']
    ]
);

// 7. TOTAL FILTRATION
addSection('TOTAL FILTRATION',
    ['Applied KV', 'Applied MA', 'Time', 'Slice Thickness', 'Measured TF'],
    [
        ['120', '100', '1.0', '5', '7.5']
    ]
);

// 8. Reproducibility of Radiation Output (Consistency Test)
addSection('Reproducibility of Radiation Output (Consistency Test)',
    ['mAs', 'Slice Thickness (mm)', 'Time (s)', 'kVp', 'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5', 'COV', 'Tolerance'],
    [
        ['100', '5', '1.0', '120', '100.5', '100.3', '100.6', '100.4', '100.5', '', '0.05']
    ]
);

// 9. Radiation Leakage Level from X-Ray Tube House
addSection('Radiation Leakage Level from X-Ray Tube House',
    ['kV', 'mA', 'Time (sec)', 'Workload', 'Workload Unit', 'Tol Value', 'Tol Operator', 'Tol Time', 'Location', 'Front', 'Back', 'Left', 'Right'],
    [
        ['120', '100', '1.0', '500', 'mA·min/week', '1.0', 'less than or equal to', '1', 'Tube', '0.05', '0.03', '0.06', '0.04'],
        ['', '', '', '', '', '', '', '', 'Collimator', '0.02', '0.02', '0.03', '0.01']
    ]
);

// 10. LOW CONTRAST RESOLUTION
addSection('LOW CONTRAST RESOLUTION',
    ['Observed Size', 'Contrast Level', 'kVp', 'mA', 'Slice Thickness', 'WW'],
    [
        ['3.0', '1.0', '120', '200', '5', '400']
    ]
);

// 11. HIGH CONTRAST RESOLUTION
addSection('HIGH CONTRAST RESOLUTION',
    ['Observed Size', 'Contrast Difference', 'kVp', 'mAs', 'Slice Thickness', 'WW'],
    [
        ['0.5', '5.0', '120', '200', '5', '400']
    ]
);

// 12. ALIGNMENT OF TABLE/GANTRY
addSection('ALIGNMENT OF TABLE/GANTRY',
    ['Result', 'Tolerance'],
    [
        ['2.0', '±2.0']
    ]
);

// 13. TABLE POSITION
addSection('TABLE POSITION',
    ['Table Position', 'Expected', 'Measured', 'Initial Pos', 'Load', 'kVp', 'mA', 'Slice Thickness'],
    [
        ['10', '10', '10.1', '0', '100', '120', '200', '5.0'],
        ['20', '20', '19.9', '', '', '', '', '']
    ]
);

// 14. GANTRY TILT
addSection('GANTRY TILT',
    ['Type', 'Name/Actual', 'Value/Measured'],
    [
        ['Parameter', 'Tilt Param', '45'],
        ['Measurement', '0', '0.5'],
        ['Measurement', '30', '30.2']
    ]
);

// 15. MAXIMUM RADIATION LEVEL
addSection('MAXIMUM RADIATION LEVEL',
    ['Location', 'mR/hr', 'Category', 'Date', 'Calibrated', 'mA', 'kV', 'Time', 'Workload'],
    [
        ['Control Console', '0.02', 'worker', '2024-01-01', 'Yes', '100', '80', '0.5', '5000'],
        ['Patient Entrance Door', '0.05', 'worker', '', '', '', '', '', '']
    ]
);

// Create Workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Adjust column width
ws['!cols'] = Array(10).fill({ wch: 20 });

XLSX.utils.book_append_sheet(wb, ws, 'CT Scan Data');

// Write file
const templateDir = 'd:/projects/anteso-admin-frontend/public/templates';
const filename = path.join(templateDir, 'CTScan_SingleTube_Sample.xlsx');
XLSX.writeFile(wb, filename);

// Also generate CSV versions for WithTimer and NoTimer if needed? 
// The system links to:
// /templates/CTScan_Test_Data_Template_WithTimer.csv
// /templates/CTScan_Test_Data_Template_NoTimer.csv

// Also generate CSV versions for WithTimer and NoTimer
// Use a simple escape for commas in values
const escapeCSV = (val) => {
    if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
    }
    return val;
};

const csvContent = data.map(row => row.map(escapeCSV).join(',')).join('\n');
import fs from 'fs';
fs.writeFileSync(path.join(templateDir, 'CTScan_Test_Data_Template_WithTimer.csv'), csvContent);
fs.writeFileSync(path.join(templateDir, 'CTScan_Test_Data_Template_NoTimer.csv'), csvContent);

console.log(`Successfully created templates in ${templateDir}`);

