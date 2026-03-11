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
        { title: 'ACCURACY OF IRRADIATION TIME', headers: ['FCD (cm)', 'kV', 'mA', 'Set Time (mSec)', 'Measured Time (mSec)', 'Tolerance Operator', 'Tolerance Value'] },
        { title: 'CENTRAL BEAM ALIGNMENT', headers: ['kV', 'mA', 'Time', 'Result', 'Tolerance'] },
        { title: 'EFFECTIVE FOCAL SPOT SIZE', headers: ['kV', 'mA', 'Focal Spot Size', 'Measured Dimension (W)', 'Measured Dimension (L)', 'Tolerance Width', 'Tolerance Length'] },
        { title: 'ACCURACY OF OPERATING POTENTIAL', headers: ['mA', 'Time', 'Set kV', 'Measured kV', 'Tolerance Operator', 'Tolerance Value'] },
        { title: 'TOTAL FILTRATION', headers: ['Applied KV', 'Applied MA', 'Applied Time', 'Measured TF', 'Criteria'] },
        { title: 'CONSISTENCY OF RADIATION OUTPUT', headers: ['kV', 'mA', 'Time', 'Exposure 1', 'Exposure 2', 'Exposure 3', 'Exposure 4', 'Exposure 5', 'Average', 'COV', 'Tolerance'] },
        { title: 'LOW CONTRAST RESOLUTION', headers: ['kV', 'mA', 'Time', 'Observed Resolution', 'Criteria'] },
        { title: 'HIGH CONTRAST RESOLUTION', headers: ['kV/mAs', 'Measured Resolution', 'Criteria'] },
        { title: 'EXPOSURE RATE AT TABLE TOP', headers: ['kV', 'mA', 'Mode', 'Measured Rate', 'Criteria'] },
        { title: 'TUBE HOUSING LEAKAGE', headers: ['kV', 'mA', 'Time', 'FCD (cm)', 'Workload', 'Location', 'Left', 'Right', 'Front', 'Back', 'Top', 'Tolerance Operator', 'Tolerance Value'] },
        { title: 'RADIATION PROTECTION SURVEY REPORT', headers: ['Location', 'mR/hr', 'Category', 'Applied Voltage', 'Applied Current', 'Exposure Time', 'Survey Date', 'Calibration Valid', 'Workload'] }
    ];

    const tubeSuffixes = isDoubleTube ? [' - Frontal', ' - Lateral'] : [''];

    tests.forEach(test => {
        tubeSuffixes.forEach(suffix => {
            rows.push([`TEST: ${test.title}${suffix}`]);
            rows.push(test.headers);
            // Add a sample row
            const sampleRow = test.headers.map(h => {
                if (h.includes('Tolerance')) return suffix.includes('Frontal') || suffix === '' ? '10' : '10'; // Default tolerance
                if (h === 'Tolerance Operator') return '<=';
                if (h === 'Category') return 'worker';
                if (h === 'Calibration Valid') return 'Yes';
                if (h === 'Location') return 'Tube';
                return '';
            });
            rows.push(sampleRow);
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
