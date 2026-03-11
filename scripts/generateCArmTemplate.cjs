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
  ['Field Name', 'Value', 'Description / Instructions'],

  // ===== Accuracy of Irradiation Time =====
  ['========== ACCURACY OF IRRADIATION TIME ==========', '', 'Section separator – do not edit'],
  ['TestConditions_FCD', '100', 'Focus-to-detector distance (cm)'],
  ['TestConditions_kV', '80', 'kV'],
  ['TestConditions_ma', '100', 'mA'],
  ['IrradiationTime_SetTime', '100', 'Set time (ms)'],
  ['IrradiationTime_MeasuredTime', '', 'Measured time (ms)'],
  ['IrradiationTime_SetTime', '200', ''],
  ['IrradiationTime_MeasuredTime', '', ''],
  ['IrradiationTime_SetTime', '400', ''],
  ['IrradiationTime_MeasuredTime', '', ''],
  ['Tolerance_Operator', '<=', 'Operator: <=, >=, ='],
  ['Tolerance_Value', '10', 'Tolerance value (%)'],

  // ===== Total Filtration =====
  ['========== TOTAL FILTRATION ==========', '', 'Section separator – do not edit'],
  ['mAStations', '50 mA', 'mA station header'],
  ['mAStations', '100 mA', ''],
  ['Tolerance_Sign', '±', '±, + or -'],
  ['Tolerance_Value', '2.0', 'Tolerance in kV'],
  ['TotalFiltration_Measured', '', 'Measured total filtration (mm Al)'],
  ['TotalFiltration_Required', '2.5', 'Required minimum (mm Al)'],
  ['Measurement_AppliedKvp', '60', 'Applied kVp'],
  ['Measurement_Meas1', '', 'Measured at station 1'],
  ['Measurement_Meas2', '', 'Measured at station 2'],
  ['Measurement_AverageKvp', '', 'Average kVp'],
  ['Measurement_AppliedKvp', '80', ''],
  ['Measurement_Meas1', '', ''],
  ['Measurement_Meas2', '', ''],
  ['Measurement_AverageKvp', '', ''],
  ['Measurement_AppliedKvp', '100', ''],
  ['Measurement_Meas1', '', ''],
  ['Measurement_Meas2', '', ''],
  ['Measurement_AverageKvp', '', ''],

  // ===== Consistency of Radiation Output =====
  ['========== CONSISTENCY OF RADIATION OUTPUT ==========', '', 'Section separator – do not edit'],
  ['Parameters_FFD', '100', 'FFD (cm)'],
  ['Parameters_Time', '100', 'Time (ms)'],
  ['Output_Tolerance', '0.02', 'CoV tolerance'],
  ['Header_1', 'Meas 1', 'Measurement column header'],
  ['Header_2', 'Meas 2', ''],
  ['Header_3', 'Meas 3', ''],
  ['Output_kV', '80', 'kV'],
  ['Output_mA', '100', 'mA'],
  ['Output_Meas1', '', 'Measurement 1'],
  ['Output_Meas2', '', 'Measurement 2'],
  ['Output_Meas3', '', 'Measurement 3'],
  ['Output_kV', '100', ''],
  ['Output_mA', '100', ''],
  ['Output_Meas1', '', ''],
  ['Output_Meas2', '', ''],
  ['Output_Meas3', '', ''],

  // ===== Low Contrast Resolution =====
  ['========== LOW CONTRAST RESOLUTION ==========', '', 'Section separator – do not edit'],
  ['LowContrast_HoleSize', '', 'Smallest hole size (mm)'],
  ['LowContrast_Standard', '', 'Recommended standard'],

  // ===== High Contrast Resolution =====
  ['========== HIGH CONTRAST RESOLUTION ==========', '', 'Section separator – do not edit'],
  ['HighContrast_LpMm', '', 'Line pairs per mm'],

  // ===== Exposure Rate At Table Top =====
  ['========== EXPOSURE RATE AT TABLE TOP ==========', '', 'Section separator – do not edit'],
  ['ExposureRate_AecTolerance', '', 'AEC tolerance'],
  ['ExposureRate_NonAecTolerance', '', 'Non-AEC tolerance'],
  ['ExposureRate_MinFocusDistance', '100', 'Min focus distance (cm)'],
  ['ExposureRate_Distance', '100', 'Distance (cm)'],
  ['ExposureRate_Meas1', '', 'Measurement 1'],
  ['ExposureRate_Meas2', '', 'Measurement 2'],
  ['ExposureRate_Meas3', '', 'Measurement 3'],

  // ===== Tube Housing Leakage =====
  ['========== TUBE HOUSING LEAKAGE ==========', '', 'Section separator – do not edit'],
  ['Leakage_FCD', '100', 'FCD (cm)'],
  ['Leakage_kV', '80', 'kV'],
  ['Leakage_mA', '100', 'mA'],
  ['Leakage_Time', '1', 'Time (min)'],
  ['Leakage_Workload', '1000', 'Workload'],
  ['Leakage_ToleranceValue', '1.0', 'Tolerance value'],
  ['Leakage_ToleranceOperator', 'less than or equal to', 'Tolerance operator'],
  ['Leakage_Tube_Left', '', 'Tube – Left (mR/h)'],
  ['Leakage_Tube_Right', '', 'Tube – Right'],
  ['Leakage_Tube_Front', '', 'Tube – Front'],
  ['Leakage_Tube_Back', '', 'Tube – Back'],
  ['Leakage_Tube_Top', '', 'Tube – Top'],
  ['Leakage_Collimator_Left', '', 'Collimator – Left'],
  ['Leakage_Collimator_Right', '', 'Collimator – Right'],
  ['Leakage_Collimator_Front', '', 'Collimator – Front'],
  ['Leakage_Collimator_Back', '', 'Collimator – Back'],
  ['Leakage_Collimator_Top', '', 'Collimator – Top'],

  // ===== Linearity of mA Loading =====
  ['========== LINEARITY OF MA LOADING ==========', '', 'Section separator – do not edit'],
  ['Linearity_FCD', '100', 'FCD (cm)'],
  ['Linearity_kV', '80', 'kV'],
  ['Linearity_Time', '100', 'Time (ms)'],
  ['Linearity_Tolerance', '0.1', 'Tolerance'],
  ['Header_1', 'Meas 1', 'Measurement header'],
  ['Header_2', 'Meas 2', ''],
  ['Header_3', 'Meas 3', ''],
  ['Linearity_mA', '50', 'mA station'],
  ['Linearity_Meas1', '', 'Measured 1'],
  ['Linearity_Meas2', '', 'Measured 2'],
  ['Linearity_Meas3', '', 'Measured 3'],
  ['Linearity_mA', '100', ''],
  ['Linearity_Meas1', '', ''],
  ['Linearity_Meas2', '', ''],
  ['Linearity_Meas3', '', ''],

  // ===== Linearity of mAs Loading =====
  ['========== LINEARITY OF MAS LOADING ==========', '', 'Section separator – do not edit'],
  ['Linearity_FCD', '100', 'FCD (cm)'],
  ['Linearity_kV', '80', 'kV'],
  ['Linearity_Tolerance', '0.1', 'Tolerance'],
  ['Header_1', 'Meas 1', ''],
  ['Header_2', 'Meas 2', ''],
  ['Header_3', 'Meas 3', ''],
  ['Linearity_mAs', '5', 'mAs value'],
  ['Linearity_Meas1', '', ''],
  ['Linearity_Meas2', '', ''],
  ['Linearity_Meas3', '', ''],
  ['Linearity_mAs', '10', ''],
  ['Linearity_Meas1', '', ''],
  ['Linearity_Meas2', '', ''],
  ['Linearity_Meas3', '', ''],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, 'Test Data');

const outPath = path.join(outputDir, 'CArm_Template.xlsx');
XLSX.writeFile(wb, outPath);
console.log('C-Arm template written to:', outPath);
