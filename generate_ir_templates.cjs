const XLSX = require('xlsx');
const path = require('path');

const templatesDir = './public/templates';

function generateTemplate(isDoubleTube) {
    const wb = XLSX.utils.book_new();
    const rows = [
        ['Interventional Radiology Test Data Template'],
        ['Instructions: Fill the values in the corresponding columns. Do not change the Test markers.'],
        ['']
    ];

    const tests = [
        { title: 'ACCURACY OF IRRADIATION TIME', headers: ['FDD (cm)', 'kV', 'mA', 'Set Time (mSec)', 'Measured Time (mSec)', 'Tolerance Operator', 'Tolerance Value'] },
        { title: 'CENTRAL BEAM ALIGNMENT', headers: ['FFD (cm)', 'kV', 'mA', 'Time', 'Result', 'Tolerance'] },
        { title: 'EFFECTIVE FOCAL SPOT SIZE', headers: ['Stated Focal Spot (mm)', 'Measured Focal Spot (Nominal) (mm)'] },
        { title: 'ACCURACY OF OPERATING POTENTIAL', headers: ['mA', 'Time', 'Set kV', 'Measured kV', 'Tolerance Operator', 'Tolerance Value'] },
        { title: 'TOTAL FILTRATION', headers: ['Applied KV', 'Applied MA', 'Applied Time', 'Measured TF', 'Criteria'] },
        { title: 'CONSISTENCY OF RADIATION OUTPUT', headers: ['FDD (cm)', 'kV', 'mA', 'Time', 'Tolerance', 'Header 1', 'Header 2', 'Header 3', 'Header 4', 'Header 5', 'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Meas 5'] },
        { title: 'MEASUREMENT OF MA LINEARITY', headers: ['kVp', 'Slice Thickness (mm)', 'Time (ms)', 'Tolerance', 'Header 1', 'Header 2', 'Header 3', 'mA Applied', 'Meas 1', 'Meas 2', 'Meas 3'] },
        { title: 'LOW CONTRAST RESOLUTION', headers: ['Smallest Hole Size (mm)', 'Recommended Standard'] },
        { title: 'HIGH CONTRAST RESOLUTION', headers: ['Measured Resolution (lp/mm)', 'Recommended Standard (lp/mm)'] },
        { title: 'EXPOSURE RATE AT TABLE TOP', headers: ['Max Exposure (AEC Mode) (cGy/Min)', 'Max Exposure (Manual Mode) (cGy/Min)', 'Min. Focus to Tabletop Distance', 'Distance (cm)', 'kV', 'mA', 'Mode', 'Measured Rate', 'Criteria'] },
        { title: 'TUBE HOUSING LEAKAGE', headers: ['kV', 'mA', 'Time', 'FDD (cm)', 'Workload', 'Location', 'Left', 'Right', 'Front', 'Back', 'Top', 'Tolerance Operator', 'Tolerance Value'] },
        { title: 'RADIATION PROTECTION SURVEY REPORT', headers: ['Location', 'mR/hr', 'Category', 'Applied Voltage', 'Applied Current', 'Exposure Time', 'Survey Date', 'Calibration Valid', 'Workload'] }
    ];

    const tubeSuffixes = isDoubleTube ? [' - Frontal', ' - Lateral'] : [''];

    tests.forEach(test => {
        tubeSuffixes.forEach(suffix => {
            rows.push([`TEST: ${test.title}${suffix}`]);
            rows.push(test.headers);
            if (test.title === 'EFFECTIVE FOCAL SPOT SIZE') {
                rows.push(['2', '1.25']);
                rows.push(['0.6', '0.65']);
            } else if (test.title === 'LOW CONTRAST RESOLUTION') {
                rows.push(['1.0', '>= 1.0 mm']);
            } else if (test.title === 'HIGH CONTRAST RESOLUTION') {
                rows.push(['2.0', '>= 2.0 lp/mm']);
            } else {
            // Add a sample row
            const sampleRow = test.headers.map(h => {
                if (test.title === 'MEASUREMENT OF MA LINEARITY') {
                    if (h === 'kVp') return '80';
                    if (h === 'Slice Thickness (mm)') return '5';
                    if (h === 'Time (ms)') return '100';
                    if (h === 'Tolerance') return '0.1';
                    if (h.startsWith('Header')) return h.replace('Header ', 'Meas ');
                    if (h === 'mA Applied') return '50';
                    if (h.startsWith('Meas')) return '0.10';
                }
                if (test.title === 'EXPOSURE RATE AT TABLE TOP') {
                    if (h === 'Max Exposure (AEC Mode) (cGy/Min)') return '10';
                    if (h === 'Max Exposure (Manual Mode) (cGy/Min)') return '5';
                    if (h === 'Min. Focus to Tabletop Distance') return '30';
                    if (h === 'Distance (cm)') return '100';
                    if (h === 'kV') return '80';
                    if (h === 'mA') return '100';
                    if (h === 'Mode') return 'AEC';
                    if (h === 'Measured Rate') return '0.5';
                    if (h === 'Criteria') return '5';
                }
                if (h.includes('Tolerance')) return suffix.includes('Frontal') || suffix === '' ? '10' : '10'; // Default tolerance
                if (h === 'Tolerance Operator') return '<=';
                if (h === 'Category') return 'worker';
                if (h === 'Calibration Valid') return 'Yes';
                if (h === 'Location') return 'Tube';
                return '';
            });
            rows.push(sampleRow);
            }
            rows.push(['']); // Blank row after each test section
        });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Test Data');

    const fileName = isDoubleTube ? 'InterventionalRadiology_DoubleTube_Template.xlsx' : 'InterventionalRadiology_SingleTube_Template.xlsx';
    XLSX.writeFile(wb, path.join(templatesDir, fileName));
    console.log(`Generated ${fileName}`);
}

generateTemplate(false);
generateTemplate(true);
