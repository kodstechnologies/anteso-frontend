// Script to generate CT Scan Excel templates
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createCTScanTemplate(hasTimer) {
    const wb = XLSX.utils.book_new();
    const allData = [];

    // Helper function to add section header
    const addSectionHeader = (title) => {
        allData.push([title]);
        allData.push([]);
    };

    // Helper function to create table with headers and empty rows
    const addTableTemplate = (headers, numRows = 3) => {
        allData.push(headers);
        // Add empty rows
        for (let i = 0; i < numRows; i++) {
            allData.push(Array(headers.length).fill(''));
        }
        allData.push([]);
    };

    // 1. Radiation Profile Width
    addSectionHeader('RADIATION PROFILE WIDTH FOR CT SCAN');
    addTableTemplate(['kVp', 'mA'], 1);
    addTableTemplate(['Applied', 'Measured'], 3);

    // 2. Measurement of Operating Potential
    addSectionHeader('MEASUREMENT OF OPERATING POTENTIAL');
    addTableTemplate(['kVp', 'mA'], 1);
    addTableTemplate(['Set KV', 'Measured KV'], 3);
    allData.push(['Tolerance']);
    allData.push(['Value', '', 'Type', 'percent', 'Sign', 'both']);
    allData.push([]);

    // 3. Measurement of mA Linearity (if hasTimer)
    if (hasTimer) {
        addSectionHeader('MEASUREMENT OF mA LINEARITY');
        addTableTemplate(['kVp', 'Slice Thickness (mm)', 'Time (ms)'], 1);
        addTableTemplate(['mA Applied', 'Meas 1', 'Meas 2', 'Meas 3', 'Avg Output', 'X', 'X MAX', 'X MIN', 'CoL', 'Remarks'], 3);
        allData.push(['Tolerance:', '']);
        allData.push([]);
    }

    // 4. Timer Accuracy (if hasTimer)
    if (hasTimer) {
        addSectionHeader('TIMER ACCURACY');
        addTableTemplate(['kVp', 'Slice Thickness (mm)', 'mA'], 1);
        addTableTemplate(['Applied Time in mSec', 'Measured Time in mSec', '% Error', 'Result'], 3);
        allData.push(['Tolerance:', '± 10 %']);
        allData.push([]);
    }

    // 5. Linearity of mAs Loading (if no timer)
    if (!hasTimer) {
        addSectionHeader('LINEARITY OF mAs LOADING');
        allData.push(['Exposure Conditions']);
        allData.push(['FCD', '', 'kV', '']);
        allData.push([]);
        addTableTemplate(['mAs Range', 'Meas 1', 'Meas 2', 'Meas 3'], 3);
        allData.push(['Tolerance:', '']);
        allData.push([]);
    }

    // 6. Measurement of CTDI
    addSectionHeader('MEASUREMENT OF CTDI');
    addTableTemplate(['kVp', 'mAs', 'Slice Thickness (mm)'], 1);
    addTableTemplate(['Results', 'Head', 'Body'], 5);
    allData.push(['Tolerance']);
    allData.push(['Sign', '', 'Value', '']);
    allData.push([]);

    // 7. Total Filtration
    addSectionHeader('TOTAL FILTRATION');
    addTableTemplate(['Applied KV', 'Applied MA', 'Time', 'Slice Thickness', 'Measured TF'], 1);

    // 8. Radiation Leakage Level
    addSectionHeader('RADIATION LEAKAGE LEVEL');
    allData.push(['Settings']);
    allData.push(['kV', '', 'mA', '', 'Time', '']);
    allData.push([]);
    allData.push(['Workload:', '']);
    allData.push(['Tolerance']);
    allData.push(['Value', '', 'Operator', '', 'Time', '']);
    allData.push([]);
    addTableTemplate(['Location', 'Front', 'Back', 'Left', 'Right', 'Unit'], 3);

    // 9. Output Consistency
    addSectionHeader('OUTPUT CONSISTENCY');
    allData.push(['Test Parameters']);
    allData.push(['mAs', '', 'Slice Thickness', '', 'Time', '']);
    allData.push([]);
    allData.push(['Measurement Count:', '']);
    allData.push(['Tolerance']);
    allData.push(['Operator', '', 'Value', '']);
    allData.push([]);
    addTableTemplate(['kVp', 'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5', 'Mean', 'COV', 'Remark'], 3);

    // 10. Low Contrast Resolution
    addSectionHeader('LOW CONTRAST RESOLUTION');
    allData.push(['Acquisition Parameters']);
    allData.push(['kVp', '', 'mA', '', 'Slice Thickness', '', 'WW', '']);
    allData.push([]);
    allData.push(['Result']);
    allData.push(['Observed Size', '', 'Contrast Level', '']);
    allData.push([]);

    // 11. High Contrast Resolution
    addSectionHeader('HIGH CONTRAST RESOLUTION');
    allData.push(['Operating Parameters']);
    allData.push(['kVp', '', 'mAs', '', 'Slice Thickness', '', 'WW', '']);
    allData.push([]);
    allData.push(['Result']);
    allData.push(['Observed Size', '', 'Contrast Difference', '']);
    allData.push([]);
    allData.push(['Tolerance']);
    allData.push(['Contrast Difference', '', 'Size', '', 'lp/cm', '', 'Expected Size', '', 'Expected lp/cm', '']);
    allData.push([]);

    // 12. Maximum Radiation Level (Radiation Protection Survey)
    addSectionHeader('MAXIMUM RADIATION LEVEL');
    allData.push(['Survey Information']);
    allData.push(['Survey Date', '', 'Valid Calibration', '', 'Applied Current', '', 'Applied Voltage', '', 'Exposure Time', '', 'Workload', '']);
    allData.push([]);
    addTableTemplate(['Location', 'mR/hr', 'Category'], 3);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set column widths for better readability
    const maxCols = Math.max(...allData.map(row => row.length));
    ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 20 }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'CT Scan Test Data Template');
    
    return wb;
}

// Generate templates
const templatesDir = path.join(__dirname, '../public/templates');

// Create WithTimer template
const wbWithTimer = createCTScanTemplate(true);
XLSX.writeFile(wbWithTimer, path.join(templatesDir, 'CTScan_Test_Data_Template_WithTimer.xlsx'));
console.log('✓ Created CTScan_Test_Data_Template_WithTimer.xlsx');

// Create NoTimer template
const wbNoTimer = createCTScanTemplate(false);
XLSX.writeFile(wbNoTimer, path.join(templatesDir, 'CTScan_Test_Data_Template_NoTimer.xlsx'));
console.log('✓ Created CTScan_Test_Data_Template_NoTimer.xlsx');

console.log('\n✅ Excel templates generated successfully!');

