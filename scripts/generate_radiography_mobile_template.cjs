/**
 * Script to generate the Radiography Mobile Excel test data template.
 * Run with: node scripts/generate_radiography_mobile_template.js
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Build Field Name / Value rows
const rows = [
    ['Field Name', 'Value', 'Description / Instructions'],

    // ===== Accuracy of Operating Potential =====
    ['========== ACCURACY OF OPERATING POTENTIAL (kVp) ==========', '', 'Section separator – do not edit'],
    ['--- mA Station Headers ---', '', ''],
    ['MeasHeader', '50 mA', 'Add one MeasHeader row per mA station (e.g. 50 mA, 100 mA, 200 mA)'],
    ['MeasHeader', '100 mA', ''],
    ['MeasHeader', '200 mA', ''],
    ['--- Measurements (one block per applied kVp) ---', '', ''],
    ['Measurement_AppliedKvp', '60', 'Applied kVp value'],
    ['Measurement_Meas1', '', 'Measured kVp at mA station 1'],
    ['Measurement_Meas2', '', 'Measured kVp at mA station 2'],
    ['Measurement_Meas3', '', 'Measured kVp at mA station 3'],
    ['Measurement_AppliedKvp', '80', ''],
    ['Measurement_Meas1', '', ''],
    ['Measurement_Meas2', '', ''],
    ['Measurement_Meas3', '', ''],
    ['Measurement_AppliedKvp', '100', ''],
    ['Measurement_Meas1', '', ''],
    ['Measurement_Meas2', '', ''],
    ['Measurement_Meas3', '', ''],
    ['Measurement_AppliedKvp', '120', ''],
    ['Measurement_Meas1', '', ''],
    ['Measurement_Meas2', '', ''],
    ['Measurement_Meas3', '', ''],
    ['--- Tolerance ---', '', ''],
    ['Tolerance_Sign', '±', '±, + or -'],
    ['Tolerance_Value', '2.0', 'Tolerance in kV'],
    ['--- Total Filtration ---', '', ''],
    ['TotalFiltration_Measured', '', 'Measured total filtration in mm Al'],
    ['TotalFiltration_Required', '2.5', 'Required minimum in mm Al'],

    // ===== Accuracy of Irradiation Time =====
    ['========== ACCURACY OF IRRADIATION TIME ==========', '', 'Section separator – do not edit'],
    ['TestConditions_FCD', '100', 'Focus-to-detector distance (cm)'],
    ['TestConditions_kV', '80', 'kV used for test'],
    ['TestConditions_ma', '100', 'mA used for test'],
    ['IrradiationTime_SetTime', '100', 'Set time in ms'],
    ['IrradiationTime_MeasuredTime', '', 'Measured time in ms'],
    ['IrradiationTime_SetTime', '200', ''],
    ['IrradiationTime_MeasuredTime', '', ''],
    ['IrradiationTime_SetTime', '400', ''],
    ['IrradiationTime_MeasuredTime', '', ''],
    ['Tolerance_Operator', '<=', 'Operator: <=, >=, ='],
    ['Tolerance_Value', '5', 'Tolerance value (%)'],

    // ===== Output Consistency =====
    ['========== OUTPUT CONSISTENCY ==========', '', 'Section separator – do not edit'],
    ['--- Measurement Headers ---', '', ''],
    ['MeasHeader', 'Meas 1', 'Add one MeasHeader per measurement column'],
    ['MeasHeader', 'Meas 2', ''],
    ['MeasHeader', 'Meas 3', ''],
    ['--- Output Rows (one block per kV/mAs combination) ---', '', ''],
    ['OutputRow_kV', '80', 'kV value'],
    ['OutputRow_mAs', '20', 'mAs value'],
    ['OutputRow_Meas1', '', 'Measurement 1 value (mGy)'],
    ['OutputRow_Meas2', '', ''],
    ['OutputRow_Meas3', '', ''],
    ['OutputRow_kV', '100', ''],
    ['OutputRow_mAs', '20', ''],
    ['OutputRow_Meas1', '', ''],
    ['OutputRow_Meas2', '', ''],
    ['OutputRow_Meas3', '', ''],
    ['Tolerance_Value', '0.05', 'CoV tolerance (e.g. 0.05 = 5%)'],

    // ===== Central Beam Alignment =====
    ['========== CENTRAL BEAM ALIGNMENT ==========', '', 'Section separator – do not edit'],
    ['TechniqueFactors_FCD', '100', 'FCD in cm'],
    ['TechniqueFactors_kV', '80', 'kV'],
    ['TechniqueFactors_mAs', '10', 'mAs'],
    ['ObservedTilt_Value', '', 'Observed tilt value'],
    ['ObservedTilt_Operator', '<=', 'Operator'],
    ['Tolerance_Value', '1.5', 'Tolerance in degrees'],
    ['Tolerance_Operator', '<=', 'Operator'],

    // ===== Congruence of Radiation =====
    ['========== CONGRUENCE OF RADIATION ==========', '', 'Section separator – do not edit'],
    ['CongruenceMeasurement_Dimension', 'Left', 'Dimension label'],
    ['CongruenceMeasurement_ObservedShift', '', 'Observed shift (mm)'],
    ['CongruenceMeasurement_EdgeShift', '', 'Edge shift (mm)'],
    ['CongruenceMeasurement_PercentFED', '', '% of FED'],
    ['CongruenceMeasurement_Tolerance', '2', 'Tolerance (%)'],
    ['CongruenceMeasurement_Dimension', 'Right', ''],
    ['CongruenceMeasurement_ObservedShift', '', ''],
    ['CongruenceMeasurement_EdgeShift', '', ''],
    ['CongruenceMeasurement_PercentFED', '', ''],
    ['CongruenceMeasurement_Tolerance', '2', ''],
    ['CongruenceMeasurement_Dimension', 'Top', ''],
    ['CongruenceMeasurement_ObservedShift', '', ''],
    ['CongruenceMeasurement_EdgeShift', '', ''],
    ['CongruenceMeasurement_PercentFED', '', ''],
    ['CongruenceMeasurement_Tolerance', '2', ''],
    ['CongruenceMeasurement_Dimension', 'Bottom', ''],
    ['CongruenceMeasurement_ObservedShift', '', ''],
    ['CongruenceMeasurement_EdgeShift', '', ''],
    ['CongruenceMeasurement_PercentFED', '', ''],
    ['CongruenceMeasurement_Tolerance', '2', ''],

    // ===== Effective Focal Spot =====
    ['========== EFFECTIVE FOCAL SPOT ==========', '', 'Section separator – do not edit'],
    ['FCD', '100', 'Focus-to-detector distance (cm)'],
    ['FocalSpot_FocusType', 'Small', 'Focus type label'],
    ['FocalSpot_StatedWidth', '', 'Stated width (mm)'],
    ['FocalSpot_StatedHeight', '', 'Stated height (mm)'],
    ['FocalSpot_MeasuredWidth', '', 'Measured width (mm)'],
    ['FocalSpot_MeasuredHeight', '', 'Measured height (mm)'],
    ['FocalSpot_FocusType', 'Large', ''],
    ['FocalSpot_StatedWidth', '', ''],
    ['FocalSpot_StatedHeight', '', ''],
    ['FocalSpot_MeasuredWidth', '', ''],
    ['FocalSpot_MeasuredHeight', '', ''],

    // ===== Linearity of mAs Loading Stations =====
    ['========== LINEARITY OF mAs LOADING STATIONS ==========', '', 'Section separator – do not edit'],
    ['Table1_FCD', '100', 'FCD in cm'],
    ['Table1_kV', '80', 'kV'],
    ['Table1_Time', '0.1', 'Time in seconds'],
    ['MeasHeader', 'Meas 1', 'Add one MeasHeader per measurement column'],
    ['MeasHeader', 'Meas 2', ''],
    ['MeasHeader', 'Meas 3', ''],
    ['Table2_mAsApplied', '5', 'Applied mAs'],
    ['Table2_Meas1', '', 'Measurement 1 (mGy)'],
    ['Table2_Meas2', '', ''],
    ['Table2_Meas3', '', ''],
    ['Table2_mAsApplied', '10', ''],
    ['Table2_Meas1', '', ''],
    ['Table2_Meas2', '', ''],
    ['Table2_Meas3', '', ''],
    ['Table2_mAsApplied', '20', ''],
    ['Table2_Meas1', '', ''],
    ['Table2_Meas2', '', ''],
    ['Table2_Meas3', '', ''],
    ['Tolerance', '0.1', 'CoL tolerance'],
    ['ToleranceOperator', '<=', '<=, >=, ='],

    // ===== Radiation Leakage Level =====
    ['========== RADIATION LEAKAGE LEVEL ==========', '', 'Section separator – do not edit'],
    ['Settings_FCD', '100', 'FCD in cm'],
    ['Settings_kV', '120', 'kV'],
    ['Settings_ma', '21', 'mA'],
    ['Settings_Time', '2.0', 'Time in seconds'],
    ['Workload', '180', 'Workload in mAmin/hr'],
    ['LeakageMeasurement_Location', 'Tube', 'Location label (Tube or Collimator)'],
    ['LeakageMeasurement_Left', '', 'Left measurement (mR/hr)'],
    ['LeakageMeasurement_Right', '', 'Right measurement (mR/hr)'],
    ['LeakageMeasurement_Front', '', 'Front measurement (mR/hr)'],
    ['LeakageMeasurement_Back', '', 'Back measurement (mR/hr)'],
    ['LeakageMeasurement_Top', '', 'Top measurement (mR/hr)'],
    ['LeakageMeasurement_Location', 'Collimator', '(Optional) Add Collimator row if needed'],
    ['LeakageMeasurement_Left', '', ''],
    ['LeakageMeasurement_Right', '', ''],
    ['LeakageMeasurement_Front', '', ''],
    ['LeakageMeasurement_Back', '', ''],
    ['LeakageMeasurement_Top', '', ''],
    ['ToleranceValue', '1', 'Tolerance in mGy'],
    ['ToleranceOperator', 'less than or equal to', 'less than or equal to / greater than or equal to / ='],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);

// Column widths
ws['!cols'] = [
    { wch: 45 },  // Field Name
    { wch: 20 },  // Value
    { wch: 60 },  // Description
];

// Style header row (bold) — only supported in xlsx-style, but we can freeze panes
ws['!freeze'] = { xSplit: 0, ySplit: 1 };

XLSX.utils.book_append_sheet(wb, ws, 'Test Data');

// Also add an Instructions sheet
const instructions = [
    ['RADIOGRAPHY MOBILE TEST DATA TEMPLATE — INSTRUCTIONS'],
    [''],
    ['HOW TO USE:'],
    ['1. Fill in the Value column for each field.'],
    ['2. Do NOT edit Field Name cells or section separator rows (=====).'],
    ['3. To add more measurement rows, copy existing rows and paste below.'],
    ['4. Save as .xlsx and upload using the Upload Excel button in the app.'],
    [''],
    ['SECTION GUIDES:'],
    ['• ACCURACY OF OPERATING POTENTIAL: Add one MeasHeader per mA station. Then for each kVp row, enter Measurement_Meas1/Meas2/etc. values.'],
    ['• OUTPUT CONSISTENCY: Add MeasHeader rows first, then OutputRow blocks per kV/mAs combo.'],
    ['• LINEARITY OF mAs LOADING STATIONS: Add MeasHeader rows first, then Table2 blocks per mAs value.'],
    ['• RADIATION LEAKAGE LEVEL: Tube row is mandatory. Collimator is optional — delete if not needed.'],
    [''],
    ['TIPS:'],
    ['• Leave Value blank for auto-calculated fields (Average, Pass/Fail, etc.)'],
    ['• Tolerance operators: <=, >=, ='],
    ['• Tolerance sign (kVp accuracy): ±, +, or -'],
];
const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
wsInstr['!cols'] = [{ wch: 100 }];
XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

const outputPath = path.join(outputDir, 'RadiographyMobile_Test_Template.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('✅ Template generated at:', outputPath);
