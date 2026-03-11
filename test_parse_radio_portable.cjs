const XLSX = require("xlsx");

const headerMap = {
    'Congruence of Radiation': {
        'FCD (cm)': 'Table1_FCD', 'kVp': 'Table1_kvp', 'mAs': 'Table1_mas', 'Field Size (cm)': 'Table1_fieldSize',
        'Deviation X (cm)': 'Table2_deviationX', 'Deviation Y (cm)': 'Table2_deviationY', 'Total Deviation (cm)': 'Table2_totalDeviation',
        'Tolerance (cm)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    },
    'Central Beam Alignment': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv', 'mAs': 'Table1_mas',
        'Observed Tilt (deg)': 'Table2_observedTilt', 'Tolerance (deg)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    },
    'Effective Focal Spot': {
        'FCD (cm)': 'Table1_fcd', 'Focus Type': 'Table2_focusType',
        'Stated Width': 'Table2_statedWidth', 'Stated Height': 'Table2_statedHeight',
        'Measured Width': 'Table2_measuredWidth', 'Measured Height': 'Table2_measuredHeight', 'Remarks': 'Table2_remark'
    },
    'Accuracy of Irradiation Time': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv', 'mA': 'Table1_ma',
        'Set Time (ms)': 'Table2_setTime', 'Measured Time (ms)': 'Table2_measuredTime', '% Error': 'Table2_percentError',
        'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    },
    'Accuracy of Operating Potential': {
        'Time (ms)': 'Table1_time', 'Slice Thickness (mm)': 'Table1_sliceThickness',
        'Set kVp': 'Table2_setKV', '@ mA 10': 'Table2_ma10', '@ mA 100': 'Table2_ma100', '@ mA 200': 'Table2_ma200', 'Measured kVp': 'Table2_avgKvp',
        'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    },
    'Linearity of mAs Loading Stations': {
        'FCD (cm)': 'Table1_fcd', 'kV': 'Table1_kv',
        'mAs Range': 'Table2_mAsRange', 'Meas 1': 'Table2_meas1', 'Meas 2': 'Table2_meas2', 'Meas 3': 'Table2_meas3',
        'Average': 'Table2_average', 'X (mGy/mAs)': 'Table2_x',
        'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    },
    'Consistency of Radiation Output': {
        'FCD (cm)': 'Table1_value', 'kVp': 'Table2_kv', 'mAs': 'Table2_mas',
        'Reading 1': 'Table2_reading1', 'Reading 2': 'Table2_reading2', 'Reading 3': 'Table2_reading3', 'Reading 4': 'Table2_reading4', 'Reading 5': 'Table2_reading5',
        'Mean': 'Table2_average', 'COV (%)': 'Table2_cv', 'Tolerance (%)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    },
    'Radiation Leakage Level': {
        'FCD (cm)': 'Table1_fcd', 'kVp': 'Table1_kv', 'mA': 'Table1_ma', 'Time (s)': 'Table1_time',
        'Workload': 'Workload', 'Location': 'Table2_location', 'Front (mR/h)': 'Table2_front', 'Back (mR/h)': 'Table2_back',
        'Left (mR/h)': 'Table2_left', 'Right (mR/h)': 'Table2_right', 'Top (mR/h)': 'Table2_top',
        'Tolerance (mR/h)': 'Tolerance_Value', 'Remarks': 'Table2_remarks'
    }
};

const testMarkerToInternalName = {
    'CONGRUENCE OF RADIATION & OPTICAL FIELD': 'Congruence of Radiation',
    'CENTRAL BEAM ALIGNMENT': 'Central Beam Alignment',
    'EFFECTIVE FOCAL SPOT MEASUREMENT': 'Effective Focal Spot',
    'ACCURACY OF IRRADIATION TIME': 'Accuracy of Irradiation Time',
    'ACCURACY OF OPERATING POTENTIAL': 'Accuracy of Operating Potential',
    'LINEARITY OF mAs LOADING STATIONS': 'Linearity of mAs Loading Stations',
    'CONSISTENCY OF RADIATION OUTPUT': 'Consistency of Radiation Output',
    'TUBE HOUSING LEAKAGE LEVEL': 'Radiation Leakage Level',
};

const markerUpperToInternal = Object.fromEntries(
    Object.entries(testMarkerToInternalName).map(([k, v]) => [String(k).trim().toUpperCase(), v])
);

const wb = XLSX.readFile('public/templates/Radiography_Portable_Template.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

let currentTestNameBase = '';
let currentTestName = '';
let isReadingTest = false;
let headers = [];
let data = [];
const sectionRowCounter = {};

for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c || '').trim());
    const firstCell = row[0];

    if (firstCell.startsWith('TEST: ')) {
        const rawTitle = firstCell.replace('TEST: ', '').trim();
        const internalBase = markerUpperToInternal[rawTitle.trim().toUpperCase()] || '';
        currentTestNameBase = internalBase;
        currentTestName = internalBase;
        isReadingTest = true;
        headers = [];
        if (currentTestName) sectionRowCounter[currentTestName] = 0;
        continue;
    }

    if (isReadingTest && headers.length === 0 && row.some(c => c)) {
        headers = row;
        continue;
    }

    if (isReadingTest && row.every(c => !c)) {
        isReadingTest = false;
        continue;
    }

    if (isReadingTest && currentTestName && currentTestNameBase && headers.length > 0) {
        sectionRowCounter[currentTestName] = (sectionRowCounter[currentTestName] || 0) + 1;
        const rowIdx = sectionRowCounter[currentTestName];
        row.forEach((value, cellIdx) => {
            const header = headers[cellIdx];
            const internalField = (headerMap[currentTestNameBase] || {})[header];
            if (internalField && value) {
                data.push({
                    'Field Name': internalField,
                    'Value': value,
                    'Row Index': rowIdx,
                    'Test Name': currentTestName,
                });
            }
        });
    }
}

const groupedData = {};
data.forEach((row) => {
    const testName = row['Test Name'];
    if (testName && testName.trim()) {
        if (!groupedData[testName]) {
            groupedData[testName] = [];
        }
        groupedData[testName].push(row);
    }
});

console.log(JSON.stringify(groupedData, null, 2));
