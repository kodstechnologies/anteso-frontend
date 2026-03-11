import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const handleExportToExcel = (details: any, tools: any[]) => {
  if (!details) {
    toast.error("No details available to export");
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. Header Sheet
  const headerData = [
    ["Interventional Radiology Report Template"],
    [""],
    ["Hospital Name", details.hospitalName],
    ["Hospital Address", details.hospitalAddress],
    ["Machine Type", details.machineType],
    ["Machine Model", details.machineModel],
    ["Serial Number", details.serialNumber],
    ["SRF Number", details.srfNumber],
    [""],
    ["Quality Assurance Tools Used"],
    ["Sl No", "Nomenclature", "Make", "Model", "Sr No", "Calibration Valid Till"]
  ];

  tools.forEach((tool, index) => {
    headerData.push([
      (index + 1).toString(),
      tool.nomenclature,
      tool.make,
      tool.model,
      tool.SrNo,
      tool.calibrationValidTill
    ]);
  });

  const headerWs = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.book_append_sheet(wb, headerWs, "Report Header");

  // 2. Data Template Sheet
  const templateData = [
    ["Component", "Field Name", "Row Index", "Value", "Description"],
    ["AccuracyOfIrradiationTime", "Table1_fcd", "0", "", "FCD (cm)"],
    ["AccuracyOfIrradiationTime", "Table1_kv", "0", "", "kV"],
    ["AccuracyOfIrradiationTime", "Table1_ma", "0", "", "mA"],
    ["AccuracyOfIrradiationTime", "Table2_SetTime", "0", "", "Set Time (ms)"],
    ["AccuracyOfIrradiationTime", "Table2_MeasuredTime", "0", "", "Measured Time (ms)"],
    ["AccuracyOfIrradiationTime", "ToleranceOperator", "0", "±", "Tolerance Operator"],
    ["AccuracyOfIrradiationTime", "ToleranceValue", "0", "10", "Tolerance Value (%)"],
    
    ["CentralBeamAlignment", "Table1_fcd", "0", "", "FCD (cm)"],
    ["CentralBeamAlignment", "Table1_kv", "0", "", "kV"],
    ["CentralBeamAlignment", "Table1_ma", "0", "", "mA"],
    ["CentralBeamAlignment", "Table1_time", "0", "", "Time (ms)"],
    ["CentralBeamAlignment", "ObservedTilt", "0", "", "Observed Tilt (deg)"],
    ["CentralBeamAlignment", "Tolerance", "0", "1.5", "Tolerance (deg)"],

    ["EffectiveFocalSpot", "Table1_fcd", "0", "", "FCD (cm)"],
    ["EffectiveFocalSpot", "Table1_kv", "0", "", "kV"],
    ["EffectiveFocalSpot", "Table1_ma", "0", "", "mA"],
    ["EffectiveFocalSpot", "Table1_time", "0", "", "Time (ms)"],
    ["EffectiveFocalSpot", "MeasuredDimension1", "0", "", "Measured Dimension 1 (mm)"],
    ["EffectiveFocalSpot", "MeasuredDimension2", "0", "", "Measured Dimension 2 (mm)"],
    ["EffectiveFocalSpot", "TolerancePercentage", "0", "50", "Tolerance (%)"],

    ["AccuracyOfOperatingPotential", "Table1_fcd", "0", "", "FCD (cm)"],
    ["AccuracyOfOperatingPotential", "Table1_ma", "0", "", "mA"],
    ["AccuracyOfOperatingPotential", "Table1_time", "0", "", "Time (ms)"],
    ["AccuracyOfOperatingPotential", "Table2_SetKV", "0", "", "Set kV"],
    ["AccuracyOfOperatingPotential", "Table2_MeasuredKV", "0", "", "Measured kV"],
    ["AccuracyOfOperatingPotential", "ToleranceOperator", "0", "±", "Tolerance Operator"],
    ["AccuracyOfOperatingPotential", "ToleranceValue", "0", "10", "Tolerance Value (%)"],

    ["TotalFilteration", "Table1_fcd", "0", "", "FCD (cm)"],
    ["TotalFilteration", "Table1_kv", "0", "", "kV"],
    ["TotalFilteration", "Table1_ma", "0", "", "mA"],
    ["TotalFilteration", "Table1_time", "0", "", "Time (ms)"],
    ["TotalFilteration", "Table2_Thickness", "0", "0", "Al thickness (mm)"],
    ["TotalFilteration", "Table2_Output", "0", "", "Output (mGy)"],
    ["TotalFilteration", "Tolerance", "0", "2.5", "Recommended Standard (mm Al)"],

    ["ConsistencyOfRadiationOutput", "Table1_fdd", "0", "", "FDD (cm)"],
    ["ConsistencyOfRadiationOutput", "Table1_kv", "0", "", "Measured kVp"],
    ["ConsistencyOfRadiationOutput", "Table1_mAs", "0", "", "Fixed mAs"],
    ["ConsistencyOfRadiationOutput", "Table1_Output", "0", "", "Output (mGy)"],
    ["ConsistencyOfRadiationOutput", "Tolerance", "0", "0.05", "Tolerance (CoV)"],

    ["LinearityOfmAsLoading", "Table1_fcd", "0", "", "FCD (cm)"],
    ["LinearityOfmAsLoading", "Table1_kv", "0", "", "kV"],
    ["LinearityOfmAsLoading", "Table1_time", "0", "", "Time (ms)"],
    ["LinearityOfmAsLoading", "Table2_mAsApplied", "0", "", "mAs Applied"],
    ["LinearityOfmAsLoading", "Table2_MeasuredOutput1", "0", "", "Measured Output 1 (mGy)"],
    ["LinearityOfmAsLoading", "Table2_MeasuredOutput2", "0", "", "Measured Output 2 (mGy)"],
    ["LinearityOfmAsLoading", "Table2_MeasuredOutput3", "0", "", "Measured Output 3 (mGy)"],
    ["LinearityOfmAsLoading", "Table2_MeasuredOutput4", "0", "", "Measured Output 4 (mGy)"],
    ["LinearityOfmAsLoading", "Tolerance", "0", "0.1", "Tolerance (CoL)"],

    ["ExposureRateAtTableTop", "Table1_Distance", "0", "", "Distance (cm)"],
    ["ExposureRateAtTableTop", "Table1_AppliedKV", "0", "", "Applied kV"],
    ["ExposureRateAtTableTop", "Table1_AppliedMA", "0", "", "Applied mA"],
    ["ExposureRateAtTableTop", "Table1_Exposure", "0", "", "Exposure (cGy/Min)"],
    ["ExposureRateAtTableTop", "Table1_Mode", "0", "", "Mode (AEC/Manual)"],
    ["ExposureRateAtTableTop", "Table1_aecTolerance", "0", "10", "AEC Tolerance"],
    ["ExposureRateAtTableTop", "Table1_nonAecTolerance", "0", "5", "Manual Tolerance"],
    ["ExposureRateAtTableTop", "Table1_minFocusDistance", "0", "30", "Min Focus Distance"],

    ["TubeHousingLeakage", "Table1_fcd", "0", "", "FCD (cm)"],
    ["TubeHousingLeakage", "Table1_kv", "0", "", "kV"],
    ["TubeHousingLeakage", "Table1_ma", "0", "", "mA"],
    ["TubeHousingLeakage", "Table1_time", "0", "", "Exposure Time (s)"],
    ["TubeHousingLeakage", "Table1_workload", "0", "", "Workload (mA-min/hr)"],
    ["TubeHousingLeakage", "Table2_Location", "0", "", "Location"],
    ["TubeHousingLeakage", "Table2_Left", "0", "", "Left (mGy/h)"],
    ["TubeHousingLeakage", "Table2_Right", "0", "", "Right (mGy/h)"],
    ["TubeHousingLeakage", "Table2_Front", "0", "", "Front (mGy/h)"],
    ["TubeHousingLeakage", "Table2_Back", "0", "", "Back (mGy/h)"],
    ["TubeHousingLeakage", "Table2_Top", "0", "", "Top (mGy/h)"],
    ["TubeHousingLeakage", "ToleranceOperator", "0", "less than or equal to", "Operator"],
    ["TubeHousingLeakage", "ToleranceValue", "0", "1", "Value (mGy/h)"],

    ["RadiationProtectionInterventionalRadiology", "SurveyDate", "0", "", "Survey Date (YYYY-MM-DD)"],
    ["RadiationProtectionInterventionalRadiology", "HasValidCalibration", "0", "Yes", "Calibration Valid? (Yes/No)"],
    ["RadiationProtectionInterventionalRadiology", "AppliedCurrent", "0", "100", "Applied mA"],
    ["RadiationProtectionInterventionalRadiology", "AppliedVoltage", "0", "80", "Applied kV"],
    ["RadiationProtectionInterventionalRadiology", "ExposureTime", "0", "0.5", "Exposure Time (s)"],
    ["RadiationProtectionInterventionalRadiology", "Workload", "0", "5000", "Workload (mA-min/wk)"],
    ["RadiationProtectionInterventionalRadiology", "Table1_Location", "0", "", "Location"],
    ["RadiationProtectionInterventionalRadiology", "Table1_mRPerHr", "0", "", "mGy/hr"],
    ["RadiationProtectionInterventionalRadiology", "Table1_Category", "0", "worker", "Category (worker/public)"],

    ["HighContrastResolution", "MeasuredLpPerMm", "0", "", "Measured lp/mm"],
    ["HighContrastResolution", "RecommendedStandard", "0", "1.50", "Recommended Standard"],
    ["HighContrastResolution", "Tolerance", "0", "±0", "Tolerance"],

    ["LowContrastResolution", "SmallestHoleSize", "0", "", "Smallest Hole Size (mm)"],
    ["LowContrastResolution", "RecommendedStandard", "0", "3.0", "Recommended Standard"],
    ["LowContrastResolution", "Tolerance", "0", "±0", "Tolerance"],
  ];

  const templateWs = XLSX.utils.aoa_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, templateWs, "Data Template");

  // Export
  XLSX.writeFile(wb, `Inventional_Radiology_Template_${details.srfNumber || 'New'}.xlsx`);
  toast.success("Excel template exported successfully!");
};
