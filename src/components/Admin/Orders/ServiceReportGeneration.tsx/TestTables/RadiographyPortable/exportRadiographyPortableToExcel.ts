// Excel export / template for Radiography Portable (Mobile-style TEST: table format)
import * as XLSX from "xlsx";

export interface RadiographyPortableExportData {
  congruenceOfRadiation?: any;
  centralBeamAlignment?: any;
  effectiveFocalSpot?: any;
  accuracyOfIrradiationTime?: any;
  accuracyOfOperatingPotential?: any;
  linearityOfMasLoadingStations?: any;
  linearityOfMaLoadingStations?: any;
  consistencyOfRadiationOutput?: any;
  radiationLeakageLevel?: any;
}

const pad = (n: number) => Array(n).fill("");

/** Sample upload template rows (matches RadiographyMobile_Timer_Template.csv layout). */
export const buildPortableTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  const sec = (title: string, lines: any[][]) => {
    rows.push([`TEST: ${title}`, ...pad(9)]);
    lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 10 - line.length))]));
    rows.push([]);
  };

  sec("CONGRUENCE OF RADIATION & LIGHT FIELD", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Dimension", "Observed Shift (cm)", "Edge Shift (cm)", "Tolerance (%)"],
    ["Length", "0.2", "0.1", "2"],
    ["Width", "0.3", "0.1", "2"],
  ]);

  sec("CENTRAL BEAM ALIGNMENT", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Observed Tilt (cm)", "0.5"],
    ["Tolerance (cm)", "1.5"],
  ]);

  sec("EFFECTIVE FOCAL SPOT", [
    ["FFD (cm)", "60"],
    ["Focus Type", "Stated Focal Spot of Tube (f)", "Measured Focal Spot (Nominal)"],
    ["Small", "0.6", "0.65"],
    ["Large", "1.2", "1.3"],
  ]);

  if (hasTimer) {
    sec("ACCURACY OF IRRADIATION TIME", [
      ["FDD (cm)", "100", "kV", "80", "mA", "100"],
      ["Set Time (s)", "Measured Time (s)"],
      ["0.1", "0.102"],
      ["0.2", "0.198"],
      ["Tolerance Operator", "<="],
      ["Tolerance Value (%)", "5"],
    ]);
  }

  sec("ACCURACY OF OPERATING POTENTIAL (kVp)", [
    ["Tolerance Sign", "±"],
    ["Tolerance Value (kVp)", "2"],
    ["Total Filtration Measured (mm Al)", "2.65"],
    ["Total Filtration Required (mm Al)", "2.5"],
    ["Total Filtration At kVp", "80"],
    ["Applied kVp", "50 mA", "100 mA"],
    ["60", "59.8", "60.2"],
    ["80", "79.5", "80.5"],
    ["100", "99.2", "100.8"],
    ["120", "119.5", "120.5"],
  ]);

  if (hasTimer) {
    sec("LINEARITY OF MA LOADING", [
      ["FCD (cm)", "100", "kV", "80", "Time (sec)", "1"],
      ["mA Applied", "Meas 1", "Meas 2", "Meas 3"],
      ["50", "0.42", "0.43", "0.42"],
      ["100", "0.85", "0.84", "0.86"],
      ["200", "1.71", "1.70", "1.72"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  } else {
    sec("LINEARITY OF mAs LOADING STATIONS", [
      ["FDD (cm)", "100", "kV", "80"],
      ["mAs Applied", "Meas 1", "Meas 2", "Meas 3"],
      ["5", "0.42", "0.43", "0.42"],
      ["10", "0.85", "0.84", "0.86"],
      ["20", "1.71", "1.7", "1.72"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  }

  sec("CONSISTENCY OF RADIATION OUTPUT", [
    ["FFD (cm)", "100"],
    ["kVp", "mAs", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"],
    ["80", "10", "0.85", "0.84", "0.86", "0.85", "0.85"],
    ["Tolerance Operator", "<="],
    ["Tolerance (CoV)", "0.05"],
  ]);

  sec("RADIATION LEAKAGE LEVEL", [
    ["FFD (cm)", "100", "kV", "125", "mA", "20", "Time (min)", "2", "Workload", "20"],
    ["Tolerance Value (mGy/h)", "1"],
    ["Tolerance Operator", "less than or equal to"],
    ["Location", "Left", "Right", "Front", "Back", "Top"],
    ["Tube - Left", "0.05", "0.04", "0.06", "0.05", "0.04"],
    ["Collimator - Left", "0.02", "0.03", "0.02", "0.03", "0.02"],
  ]);

  return rows;
};

export const createRadiographyPortableUploadableExcel = (
  data: RadiographyPortableExportData,
  hasTimer: boolean
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];
  const unwrap = (value: any) => value?.data ?? value?.record ?? value;
  const list = (...values: any[]) => values.find(Array.isArray) || [];
  const first = (value: any) => Array.isArray(value) ? (value[0] || {}) : (value || {});
  const value = (...values: any[]) => values.find((item) => item !== undefined && item !== null && item !== "") ?? "";
  const section = (title: string, body: any[][]) => {
    if (!body.length) return;
    rows.push([`TEST: ${title}`], ...body, []);
  };

  const congruence = unwrap(data.congruenceOfRadiation);
  if (congruence) {
    const settings = first(congruence.table1 ?? congruence.settings);
    const measurements = list(congruence.table2, congruence.measurements, congruence.readings);
    section("CONGRUENCE OF RADIATION & OPTICAL FIELD", [
      ["FCD (cm)", value(settings.fcd, settings.ffd), "kVp", value(settings.kvp, settings.kv), "mAs", settings.mas],
      ["Field Size (cm)", "Deviation X (cm)", "Deviation Y (cm)", "Shift in Edges (cm)", "Remarks"],
      ...measurements.map((item: any) => [
        value(item.fieldSize, item.dimension),
        value(item.deviationX, item.observedShift),
        value(item.deviationY, item.edgeShift),
        value(item.edgeShift, item.totalDeviation),
        value(item.remarks, item.remark),
      ]),
      ["Tolerance (cm)", value(congruence.toleranceValue, congruence.tolerance?.value, congruence.tolerance)],
    ]);
  }

  const central = unwrap(data.centralBeamAlignment);
  if (central) {
    const settings = first(central.table1 ?? central.settings);
    const measurements = list(central.table2, central.measurements, central.readings);
    section("CENTRAL BEAM ALIGNMENT", [
      ["FCD (cm)", value(settings.fcd, settings.ffd), "kV", value(settings.kv, settings.kvp), "mAs", settings.mas],
      ["Observed Tilt (deg)", "Remarks"],
      ...measurements.map((item: any) => [value(item.observedTilt, item.measured, item.measuredValue), value(item.remarks, item.remark)]),
      ["Tolerance (deg)", value(central.toleranceValue, central.tolerance?.value, central.tolerance)],
    ]);
  }

  const focal = unwrap(data.effectiveFocalSpot);
  if (focal) {
    const settings = first(focal.table1 ?? focal.settings);
    const measurements = list(focal.table2, focal.measurements, focal.readings);
    section("EFFECTIVE FOCAL SPOT", [
      ["FCD (cm)", value(settings.fcd, settings.ffd)],
      ["Focus Type", "Stated Width", "Stated Height", "Stated Nominal", "Measured Width", "Measured Height", "Measured Nominal", "Remarks"],
      ...measurements.map((item: any) => [
        value(item.focusType, item.type),
        item.statedWidth,
        item.statedHeight,
        value(item.statedNominal, item.statedFocalSpot),
        item.measuredWidth,
        item.measuredHeight,
        value(item.measuredNominal, item.measuredFocalSpot, item.measuredValue),
        value(item.remarks, item.remark),
      ]),
    ]);
  }

  const irradiation = unwrap(data.accuracyOfIrradiationTime);
  if (hasTimer && irradiation) {
    const settings = first(irradiation.table1 ?? irradiation.testConditions);
    const measurements = list(irradiation.table2, irradiation.irradiationTimes, irradiation.measurements);
    section("ACCURACY OF IRRADIATION TIME", [
      ["FCD (cm)", value(settings.fcd, settings.ffd), "kV", value(settings.kv, settings.kvp), "mA", settings.ma],
      ["Set Time (ms)", "Measured Time (ms)", "% Error", "Remarks"],
      ...measurements.map((item: any) => [
        item.setTime,
        value(item.measuredTime, item.measuredTime1),
        value(item.percentError, item.error),
        value(item.remarks, item.remark),
      ]),
      ["Tolerance Operator", value(irradiation.toleranceOperator, irradiation.tolerance?.operator)],
      ["Tolerance (%)", value(irradiation.toleranceValue, irradiation.tolerance?.value, irradiation.tolerance)],
    ]);
  }

  const potential = unwrap(data.accuracyOfOperatingPotential);
  if (potential) {
    const settings = first(potential.table1 ?? potential.testConditions);
    const measurements = list(potential.table2, potential.measurements);
    const stationHeaders = potential.measurementHeaders || potential.maStations || [];
    const maxStations = Math.max(3, ...measurements.map((item: any) => (item.measuredValues || []).length));
    const headers = Array.from({ length: maxStations }, (_, index) => stationHeaders[index] || `Meas ${index + 1}`);
    const filtration = potential.totalFiltration || {};
    section("ACCURACY OF OPERATING POTENTIAL", [
      ["Time (ms)", settings.time, "Slice Thickness (mm)", settings.sliceThickness],
      ["Set kVp", ...headers, "Remarks"],
      ...measurements.map((item: any) => {
        const measured = item.measuredValues || [item.ma10, item.ma100, item.ma200];
        return [value(item.appliedKvp, item.setKV, item.setKvp), ...headers.map((_: string, index: number) => measured[index] ?? ""), value(item.remarks, item.remark)];
      }),
      ["Tolerance (%)", value(potential.toleranceValue, potential.tolerance?.value, potential.tolerance)],
      ["Total Filtration Measured (mm Al)", value(filtration.measured, potential.totalFiltrationMeasured)],
      ["Total Filtration Required (mm Al)", value(filtration.required, potential.totalFiltrationRequired)],
      ["Total Filtration At kVp", value(filtration.atKvp, potential.totalFiltrationAtKvp)],
    ]);
  }

  const linearity = unwrap(hasTimer ? data.linearityOfMaLoadingStations : data.linearityOfMasLoadingStations);
  if (linearity) {
    const settings = first(linearity.table1 ?? linearity.testConditions);
    const measurements = list(linearity.table2, linearity.measurements);
    const measurementHeaders = linearity.measurementHeaders || [];
    const maxMeasurements = Math.max(3, ...measurements.map((item: any) => (item.measuredOutputs || item.radiationOutputs || []).length));
    const headers = Array.from({ length: maxMeasurements }, (_, index) => measurementHeaders[index] || `Meas ${index + 1}`);
    section(hasTimer ? "LINEARITY OF MA LOADING" : "LINEARITY OF mAs LOADING", [
      ["FCD (cm)", value(settings.fcd, settings.fdd, settings.ffd), "kV", value(settings.kv, settings.kvp), "Time (sec)", settings.time],
      [hasTimer ? "mA Applied" : "mAs Applied", ...headers, "Remarks"],
      ...measurements.map((item: any) => {
        const measured = item.measuredOutputs || item.radiationOutputs || [];
        return [value(item.ma, item.mA, item.mAsRange, item.mAsApplied), ...headers.map((_: string, index: number) => value(measured[index]?.value, measured[index])), value(item.remarks, item.remark)];
      }),
      ["Tolerance Operator", value(linearity.toleranceOperator, linearity.tolerance?.operator)],
      ["Tolerance (CoL)", value(linearity.toleranceValue, linearity.tolerance?.value, linearity.col)],
    ]);
  }

  const consistency = unwrap(data.consistencyOfRadiationOutput);
  if (consistency) {
    const settings = first(consistency.table1 ?? consistency.ffd ?? consistency.settings);
    const measurements = list(consistency.table2, consistency.outputRows, consistency.measurements);
    const measurementHeaders = consistency.measurementHeaders || [];
    const maxMeasurements = Math.max(5, ...measurements.map((item: any) => (item.radiationOutputs || item.outputs || item.readings || []).length));
    const headers = Array.from({ length: maxMeasurements }, (_, index) => measurementHeaders[index] || `Meas ${index + 1}`);
    section("CONSISTENCY OF RADIATION OUTPUT", [
      ["FFD (cm)", value(settings.value, settings.ffd, settings.fcd)],
      ["kVp", "mAs", ...headers, "Remarks"],
      ...measurements.map((item: any) => {
        const measured = item.radiationOutputs || item.outputs || item.readings || [];
        return [value(item.kv, item.kvp), item.mas, ...headers.map((_: string, index: number) => value(measured[index]?.value, measured[index])), value(item.remarks, item.remark)];
      }),
      ["Tolerance Operator", value(consistency.toleranceOperator, consistency.tolerance?.operator)],
      ["Tolerance (CoV)", value(consistency.toleranceValue, consistency.tolerance?.value, consistency.cov)],
    ]);
  }

  const leakage = unwrap(data.radiationLeakageLevel);
  if (leakage) {
    const settings = first(leakage.table1 ?? leakage.settings);
    const measurements = list(leakage.table2, leakage.leakageMeasurements, leakage.measurements);
    section("RADIATION LEAKAGE LEVEL", [
      ["FCD (cm)", value(settings.fcd, leakage.fcd), "kVp", value(settings.kv, settings.kvp, leakage.kv), "mA", value(settings.ma, leakage.ma), "Time (s)", value(settings.time, leakage.time)],
      ["Workload", leakage.workload],
      ["Location", "Front (mR/h)", "Back (mR/h)", "Left (mR/h)", "Right (mR/h)", "Top (mR/h)", "Remarks"],
      ...measurements.map((item: any) => [item.location, item.front, item.back, item.left, item.right, item.top, value(item.remarks, item.remark)]),
      ["Tolerance Operator", value(leakage.toleranceOperator, leakage.tolerance?.operator)],
      ["Tolerance (mR/h)", value(leakage.toleranceValue, leakage.tolerance?.value, leakage.tolerance)],
    ]);
  }

  if (!rows.length) rows.push(["No test data available"]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws, "Radiography Portable Test Data");
  return wb;
};

export const writePortableTemplateWorkbook = (outputPath: string) => {
  const wb = XLSX.utils.book_new();
  const wsTimer = XLSX.utils.aoa_to_sheet(buildPortableTemplateRows(true));
  const wsNoTimer = XLSX.utils.aoa_to_sheet(buildPortableTemplateRows(false));
  wsTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  wsNoTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, wsTimer, "With Timer");
  XLSX.utils.book_append_sheet(wb, wsNoTimer, "Without Timer");
  try {
    XLSX.writeFile(wb, outputPath);
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      const tmp = outputPath.replace(/\.xlsx$/i, ".tmp.xlsx");
      XLSX.writeFile(wb, tmp);
      console.warn(`Target locked; wrote ${tmp}`);
      return;
    }
    throw e;
  }
};
