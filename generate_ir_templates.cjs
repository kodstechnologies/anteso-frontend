const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const templatesDir = './public/templates';

const escapeCsv = (val) => {
    const s = String(val ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

const rowsToCsv = (rows) =>
    rows.map((row) => row.map(escapeCsv).join(',')).join('\n') + '\n';

const pushBlank = (rows) => rows.push([]);

/** CENTRAL BEAM + EFFECTIVE FOCAL SPOT — Radiography Fixed / C-Arm family */
function appendCbaAndEfs(rows, suffix) {
    rows.push([`TEST: CENTRAL BEAM ALIGNMENT${suffix}`]);
    rows.push(['FFD (cm)', '100', 'kV', '80', 'mA', '100', 'Time', '0.1']);
    rows.push(['Observed Tilt (cm)', '0.5']);
    rows.push(['Tolerance Operator', '<=']);
    rows.push(['Tolerance Value (cm)', '1.5']);
    pushBlank(rows);

    rows.push([`TEST: EFFECTIVE FOCAL SPOT SIZE${suffix}`]);
    rows.push(['FFD (cm)', '100']);
    rows.push(['Focus Type', 'Stated Focal Spot (mm)', 'Measured Focal Spot (Nominal) (mm)']);
    rows.push(['Large Focus', '2', '1.25']);
    rows.push(['Small Focus', '0.6', '0.65']);
    pushBlank(rows);
}

/** LOW / HIGH CONTRAST — exact C-Arm headers */
function appendContrast(rows, suffix) {
    rows.push([`TEST: LOW CONTRAST RESOLUTION${suffix}`]);
    rows.push(['Smallest Hole Size (mm)', 'Recommended Standard']);
    rows.push(['1.0', '>= 1.0 mm']);
    pushBlank(rows);

    rows.push([`TEST: HIGH CONTRAST RESOLUTION${suffix}`]);
    rows.push(['Measured Resolution (lp/mm)', 'Recommended Standard (lp/mm)']);
    rows.push(['2.0', '>= 2.0 lp/mm']);
    pushBlank(rows);
}

function addSection(rows, title, headers, dataRows) {
    rows.push([`TEST: ${title}`]);
    rows.push(headers);
    dataRows.forEach((r) => rows.push(r));
    pushBlank(rows);
}

function buildTubeBlock(rows, suffix, includeMaLinearity) {
    addSection(
        rows,
        `ACCURACY OF IRRADIATION TIME${suffix}`,
        ['FDD (cm)', 'kV', 'mA', 'Set Time (mSec)', 'Measured Time (mSec)', 'Tolerance Operator', 'Tolerance Value'],
        [
            ['100', '80', '100', '200', '198', '<=', '10'],
            ['', '', '', '500', '497', '<=', '10'],
        ]
    );

    appendCbaAndEfs(rows, suffix);

    addSection(
        rows,
        `ACCURACY OF OPERATING POTENTIAL${suffix}`,
        [
            'mA',
            'Time',
            'Tolerance Operator',
            'Tolerance Value',
            'Header 1',
            'Header 2',
            'Header 3',
            'Set kV',
            'Meas 1',
            'Meas 2',
            'Meas 3',
        ],
        [
            ['100', '0.1', '<=', '5', '50 mA', '100 mA', '200 mA', '60', '59.8', '60.2', '60'],
            ['', '', '', '', '', '', '', '80', '79.8', '80.1', '79.9'],
        ]
    );

    addSection(
        rows,
        `TOTAL FILTRATION${suffix}`,
        ['Applied KV', 'Applied MA', 'Applied Time', 'Measured TF', 'Criteria'],
        [['80', '100', '0.1', '2.6', '2.5']]
    );

    rows.push([`TEST: CONSISTENCY OF RADIATION OUTPUT${suffix}`]);
    rows.push(['Tolerance Operator', '<=']);
    rows.push(['Tolerance Sign', '<=']);
    rows.push(['Tolerance Value (CoV)', '0.05']);
    rows.push([
        'FDD (cm)',
        'kV',
        'mA',
        'Time',
        'Header 1',
        'Header 2',
        'Header 3',
        'Header 4',
        'Header 5',
        'Meas 1',
        'Meas 2',
        'Meas 3',
        'Meas 4',
        'Meas 5',
    ]);
    rows.push([
        '100',
        '80',
        '100',
        '0.1',
        'Exposure 1',
        'Exposure 2',
        'Exposure 3',
        'Exposure 4',
        'Exposure 5',
        '0.5',
        '0.51',
        '0.5',
        '0.49',
        '0.5',
    ]);
    pushBlank(rows);

    if (includeMaLinearity) {
        addSection(
            rows,
            `MEASUREMENT OF MA LINEARITY${suffix}`,
            [
                'kVp',
                'Slice Thickness (mm)',
                'Time (ms)',
                'Tolerance Operator',
                'Tolerance',
                'Header 1',
                'Header 2',
                'Header 3',
                'mA Applied',
                'Meas 1',
                'Meas 2',
                'Meas 3',
            ],
            [
                ['80', '5', '100', '<=', '0.1', 'Meas 1', 'Meas 2', 'Meas 3', '50', '0.10', '0.11', '0.09'],
                ['', '', '', '', '', '', '', '', '100', '0.20', '0.21', '0.19'],
                ['', '', '', '', '', '', '', '', '200', '0.40', '0.41', '0.39'],
            ]
        );
    }

    appendContrast(rows, suffix);

    addSection(
        rows,
        `EXPOSURE RATE AT TABLE TOP${suffix}`,
        [
            'Max Exposure (AEC Mode) (cGy/Min)',
            'Max Exposure (Manual Mode) (cGy/Min)',
            'Min. Focus to Tabletop Distance',
            'Distance (cm)',
            'kV',
            'mA',
            'Mode',
            'Measured Rate',
            'Criteria',
        ],
        [
            ['10', '5', '30', '100', '80', '100', 'AEC', '0.5', '5'],
            ['', '', '', '100', '80', '100', 'Manual', '2.5', '5'],
        ]
    );

    addSection(
        rows,
        `TUBE HOUSING LEAKAGE${suffix}`,
        [
            'kV',
            'mA',
            'Time',
            'FDD (cm)',
            'Workload',
            'Location',
            'Left',
            'Right',
            'Front',
            'Back',
            'Top',
            'Tolerance Operator',
            'Tolerance Value',
        ],
        [['120', '21', '2', '100', '5000', 'Tube', '0.1', '0.1', '0.1', '0.1', '0.1', '<=', '1']]
    );
}

function generateTemplate(isDoubleTube) {
    const wb = XLSX.utils.book_new();
    const rows = [
        ['Interventional Radiology Test Data Template'],
        ['Instructions: Fill the values in the corresponding columns. Do not change the Test markers.'],
        [''],
    ];

    if (isDoubleTube) {
        buildTubeBlock(rows, ' - Frontal', true);
        buildTubeBlock(rows, ' - Lateral', true);
    } else {
        buildTubeBlock(rows, '', true);
    }

    addSection(
        rows,
        'RADIATION PROTECTION SURVEY REPORT',
        [
            'Location',
            'mR/hr',
            'Category',
            'Applied Voltage',
            'Applied Current',
            'Exposure Time',
            'Workload',
        ],
        [
            ['Control Console', '0.1', 'worker', '80', '100', '0.5', '5000'],
            ['Entrance Door', '0.05', 'public', '', '', '', ''],
        ]
    );

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Test Data');

    const xlsxName = isDoubleTube
        ? 'InterventionalRadiology_DoubleTube_Template.xlsx'
        : 'InterventionalRadiology_SingleTube_Template.xlsx';
    const csvName = isDoubleTube
        ? 'InterventionalRadiology_DoubleTube_Template.csv'
        : 'InterventionalRadiology_SingleTube_Template.csv';

    XLSX.writeFile(wb, path.join(templatesDir, xlsxName));
    console.log(`Generated ${xlsxName}`);

    const csvBody = rowsToCsv(rows);
    try {
        fs.writeFileSync(path.join(templatesDir, csvName), csvBody);
        console.log(`Generated ${csvName}`);
    } catch (err) {
        const alt = path.join(templatesDir, csvName + '.new');
        fs.writeFileSync(alt, csvBody);
        console.warn(`Could not write ${csvName} (${err.message}). Wrote ${path.basename(alt)} instead.`);
    }

    fs.writeFileSync(path.join(templatesDir, csvName.replace('.csv', '_updated.csv')), csvBody);
    console.log(`Generated ${csvName.replace('.csv', '_updated.csv')}`);
}

generateTemplate(false);
generateTemplate(true);
