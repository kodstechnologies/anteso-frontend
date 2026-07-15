import * as XLSX from "xlsx";

export interface FixedRadioFluroExportData {
  reportHeader?: any;
  congruence?: any;
  centralBeamAlignment?: any;
  effectiveFocalSpot?: any;
  accuracyOfIrradiationTime?: any;
  totalFiltration?: any;
  linearityOfMaLoading?: any;
  linearityOfMasLoading?: any;
  outputConsistency?: any;
  lowContrastResolution?: any;
  highContrastResolution?: any;
  exposureRateTableTop?: any;
  radiationLeakageLevel?: any;
  radiationProtectionSurvey?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

const pad = (n: number) => Array(n).fill("");

/** TEST: table layout templates (Radiography Fixed style) for With Timer / No Timer. */
export const buildFixedRadioFluroTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  const sec = (title: string, lines: any[][]) => {
    rows.push([`TEST: ${title}`, ...pad(9)]);
    lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 10 - line.length))]));
    rows.push([]);
  };

  sec("CONGRUENCE OF RADIATION & OPTICAL FIELD", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Dimension", "Observed Shift (cm)", "Edge Shift (cm)", "Tolerance (%)"],
    ["Length", "0.2", "0.1", "2"],
    ["Width", "0.3", "0.1", "2"],
  ]);

  sec("CENTRAL BEAM ALIGNMENT", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Observed Tilt X (cm)", "0.5"],
    ["Observed Tilt Y (cm)", "0.3"],
    ["Tolerance Operator", "<="],
    ["Tolerance Value (cm)", "2"],
  ]);

  sec("EFFECTIVE FOCAL SPOT", [
    ["FFD (cm)", "100"],
    ["Focus Type", "Stated Focal Spot of Tube (f)", "Measured Focal Spot (Nominal)"],
    ["Large Focus", "1.2", "1.25"],
    ["Small Focus", "0.6", "0.65"],
  ]);

  if (hasTimer) {
    sec("ACCURACY OF IRRADIATION TIME", [
      ["FDD (cm)", "100", "kV", "80", "mA", "100"],
      ["Set Time (ms)", "Measured Time (ms)", "Tolerance Operator", "Tolerance Value (%)"],
      ["100", "98", "<=", "10"],
      ["200", "202"],
      ["500", "495"],
    ]);
  }

  sec("TOTAL FILTRATION", [
    ["Tolerance Sign", "±"],
    ["Tolerance Value (kVp)", "2"],
    ["Total Filtration Required (mm Al)", "2"],
    ["Total Filtration At kVp", "80"],
    ["mA Station 1", "50 mA"],
    ["mA Station 2", "100 mA"],
    ["Applied kVp", "Meas 1", "Meas 2"],
    ["60", "60.2", "60.1"],
    ["80", "80.1", "80.2"],
    ["100", "100.2", "100.1"],
  ]);

  if (hasTimer) {
    sec("LINEARITY OF mA LOADING", [
      ["FDD (cm)", "100", "kV", "80", "Time (sec)", "2"],
      ["mA Applied", "Meas 1", "Meas 2", "Meas 3"],
      ["50", "1.25", "1.26", "1.24"],
      ["100", "2.5", "2.51", "2.49"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  } else {
    sec("LINEARITY OF mAs LOADING", [
      ["FDD (cm)", "100", "kV", "80"],
      ["mAs Applied", "Meas 1", "Meas 2", "Meas 3"],
      ["10", "0.85", "0.84", "0.86"],
      ["20", "1.71", "1.7", "1.72"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  }

  sec("OUTPUT CONSISTENCY", [
    ["FDD (cm)", "100"],
    ["kVp", "mAs", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"],
    ["80", "100", "10.5", "10.4", "10.6", "10.5", "10.5"],
    ["Tolerance Operator", "<="],
    ["Tolerance Value (CoV)", "0.05"],
  ]);

  sec("LOW CONTRAST RESOLUTION", [
    ["Smallest Hole Size", "2"],
    ["Recommended Standard", "0.6"],
  ]);

  sec("HIGH CONTRAST RESOLUTION", [
    ["Measured lp/mm", "2.5"],
    ["Recommended Standard", "2"],
  ]);

  sec("EXPOSURE RATE AT TABLE TOP", [
    ["Distance (cm)", "Applied kVp", "Applied mA", "Exposure (mGy/min)", "Remark"],
    ["100", "80", "100", "5.2", "AEC Mode"],
    ["100", "100", "200", "4.8", "Manual Mode"],
    ["Tolerance AEC (%)", "10"],
    ["Tolerance Non-AEC (%)", "5"],
    ["Min Focus Distance (cm)", "30"],
  ]);

  sec("TUBE HOUSING LEAKAGE", [
    ["FDD (cm)", "100", "kV", "80", "mA", "100", "Time (min)", "1", "Workload", "5000"],
    ["Tolerance Value (mGy/h)", "1"],
    ["Tolerance Operator", "<="],
    ["Tolerance Time (h)", "1"],
    ["Location", "Left", "Right", "Front", "Back", "Top"],
    ["Tube", "0.05", "0.04", "0.06", "0.05", "0.07"],
  ]);

  sec("RADIATION PROTECTION SURVEY", [
    [
      "Applied Current (mA)",
      "100",
      "Applied Voltage (kV)",
      "80",
      "Exposure Time (s)",
      "1",
      "Workload (mA.min/week)",
      "5000",
    ],
    ["LOCATION", "mR/hr", "Category"],
    ["Control Room", "0.5", "worker"],
    ["Corridor", "0.2", "public"],
  ]);

  return rows;
};

export const rowsToCsv = (rows: any[][]): string =>
  rows.map((row) => row.map((c) => String(c ?? "")).join(",")).join("\n");

export const createFixedRadioFluroUploadableExcel = (
  data: FixedRadioFluroExportData
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  const addBlank = () => {
    allData.push([]);
  };

  const addSection = (title: string, headers: string[], rows: any[][]) => {
    allData.push([`TEST: ${title}`]);
    if (headers.length) allData.push(headers);
    rows.forEach((r) => allData.push(r));
    addBlank();
  };

  // 1. Congruence of radiation & Optical Field
  const congruence = unwrap(data.congruence);
  if (congruence?.measurements && Array.isArray(congruence.measurements) && congruence.measurements.length > 0) {
    const rows = congruence.measurements.map((m: any) => [
      m.dimension ?? "",
      m.radiation ?? "",
      m.optical ?? "",
      m.difference ?? "",
    ]);
    addSection(
      "CONGRUENCE OF RADIATION & OPTICAL FIELD",
      ["Dimension", "Radiation (cm)", "Optical (cm)", "Difference"],
      rows
    );
  }

  // 2. Central Beam Alignment
  const cba = unwrap(data.centralBeamAlignment);
  if (cba?.measurements && Array.isArray(cba.measurements) && cba.measurements.length > 0) {
    const rows = cba.measurements.map((m: any) => [
      m.observedTilt ?? "",
      m.tolerance ?? "",
    ]);
    addSection("CENTRAL BEAM ALIGNMENT", ["Observed Tilt", "Tolerance"], rows);
  }

  // 3. Effective Focal Spot
  const efs = unwrap(data.effectiveFocalSpot);
  if (efs?.table2 && Array.isArray(efs.table2) && efs.table2.length > 0) {
    const rows = efs.table2.map((r: any) => [
      r.focusType ?? "",
      r.measuredLpPerMm ?? "",
      r.recommendedStandard ?? "",
      r.smallestHoleSize ?? "",
    ]);
    addSection(
      "EFFECTIVE FOCAL SPOT",
      ["Focus Type", "Measured lp/mm", "Recommended Standard", "Smallest Hole Size"],
      rows
    );
  }

  // 4. Accuracy of Irradiation Time
  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi?.irradiationTimes && Array.isArray(aoi.irradiationTimes) && aoi.irradiationTimes.length > 0) {
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    const tc = aoi.testConditions || {};
    allData.push(["FCD", tc.fcd ?? "", "kV", tc.kv ?? "", "mA", tc.ma ?? ""]);
    allData.push(["Set Time (mSec)", "Measured Time (mSec)"]);
    aoi.irradiationTimes.forEach((t: any) => {
      allData.push([t.setTime ?? "", t.measuredTime ?? t.measuredTime1 ?? ""]);
    });
    addBlank();
  }

  // 5. Total Filtration
  const tf = unwrap(data.totalFiltration);
  if (tf?.totalFiltration) {
    const t = tf.totalFiltration;
    addSection(
      "TOTAL FILTRATION",
      ["Parameter", "Measured mm Al", "Required mm Al", "At kVp"],
      [["TotalFiltration", t.measured ?? "", t.required ?? "", t.atKvp ?? ""]]
    );
  }

  // 6. Linearity of mA Loading
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma?.table2 && Array.isArray(lma.table2) && lma.table2.length > 0) {
    const t1 = lma.table1 || {};
    allData.push(["TEST: LINEARITY OF mA LOADING"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? "", "Time", t1.time ?? ""]);
    const maxMeas = Math.max(...lma.table2.map((r: any) => (r.measuredOutputs || []).length));
    const measHeaders = Array.from({ length: maxMeas }, (_, i) => `Measured mR ${i + 1}`);
    allData.push(["mA Station", ...measHeaders, "Average", "mR/mAs"]);
    lma.table2.forEach((r: any) => {
      allData.push([
        r.ma ?? r.mAApplied ?? "",
        ...(r.measuredOutputs || []),
        r.average ?? "",
        r.x ?? "",
      ]);
    });
    addBlank();
  }

  // 7. Linearity of mAs Loading
  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2 && Array.isArray(lmas.table2) && lmas.table2.length > 0) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    allData.push(["TEST: LINEARITY OF mAs LOADING"]);
    allData.push(["FDD (cm)", t1.fcd ?? t1.FDD ?? "", "kV", t1.kv ?? t1.kV ?? ""]);
    const maxMeas = Math.max(
      ...lmas.table2.map((r: any) => (r.measuredOutputs || []).length),
      (lmas.measHeaders || lmas.measurementHeaders || []).length,
      3
    );
    const measHeaders =
      (lmas.measHeaders || lmas.measurementHeaders || []).length > 0
        ? [...(lmas.measHeaders || lmas.measurementHeaders)]
        : Array.from({ length: maxMeas }, (_, i) => `Meas ${i + 1}`);
    while (measHeaders.length < maxMeas) measHeaders.push(`Meas ${measHeaders.length + 1}`);
    allData.push(["mAs Applied", ...measHeaders.slice(0, maxMeas)]);
    lmas.table2.forEach((r: any) => {
      const outs = [...(r.measuredOutputs || [])];
      while (outs.length < maxMeas) outs.push("");
      allData.push([r.mAsRange ?? r.mAsApplied ?? "", ...outs.slice(0, maxMeas)]);
    });
    addBlank();
  }

  // 8. Output Consistency
  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows && Array.isArray(oc.outputRows) && oc.outputRows.length > 0) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
    allData.push(["TEST: OUTPUT CONSISTENCY"]);
    allData.push(["FDD (cm)", ffdVal]);
    const maxOut = Math.max(
      ...oc.outputRows.map((r: any) => (r.outputs || []).length),
      (oc.measurementHeaders || oc.measHeaders || []).length,
      3
    );
    const outHeaders =
      (oc.measurementHeaders || oc.measHeaders || []).length > 0
        ? [...(oc.measurementHeaders || oc.measHeaders)]
        : Array.from({ length: maxOut }, (_, i) => `Meas ${i + 1}`);
    while (outHeaders.length < maxOut) outHeaders.push(`Meas ${outHeaders.length + 1}`);
    allData.push(["kVp", "mAs", ...outHeaders.slice(0, maxOut)]);
    oc.outputRows.forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      while (outs.length < maxOut) outs.push("");
      allData.push([r.kv ?? r.kvp ?? "", r.mas ?? "", ...outs.slice(0, maxOut)]);
    });
    addBlank();
  }

  // 9. Low Contrast Resolution
  const lcr = unwrap(data.lowContrastResolution);
  if (lcr && (lcr.smallestHoleSize || lcr.recommendedStandard)) {
    allData.push(["TEST: LOW CONTRAST RESOLUTION"]);
    if (lcr.smallestHoleSize != null && String(lcr.smallestHoleSize).trim() !== "") {
      allData.push(["Smallest Hole Size", lcr.smallestHoleSize]);
    }
    if (lcr.recommendedStandard != null && String(lcr.recommendedStandard).trim() !== "") {
      allData.push(["Recommended Standard", lcr.recommendedStandard]);
    }
    addBlank();
  }

  // 10. High Contrast Resolution
  const hcr = unwrap(data.highContrastResolution);
  if (hcr && (hcr.measuredLpPerMm || hcr.recommendedStandard)) {
    allData.push(["TEST: HIGH CONTRAST RESOLUTION"]);
    if (hcr.measuredLpPerMm != null && String(hcr.measuredLpPerMm).trim() !== "") {
      allData.push(["Measured lp/mm", hcr.measuredLpPerMm]);
    }
    if (hcr.recommendedStandard != null && String(hcr.recommendedStandard).trim() !== "") {
      allData.push(["Recommended Standard", hcr.recommendedStandard]);
    }
    addBlank();
  }

  // 11. Exposure Rate Table Top
  const ert = unwrap(data.exposureRateTableTop);
  if (ert?.exposureRateRows && Array.isArray(ert.exposureRateRows) && ert.exposureRateRows.length > 0) {
    const rows = ert.exposureRateRows.map((r: any) => [
      r.distance ?? "",
      r.rate ?? r.exposureRate ?? "",
      r.remarks ?? "",
    ]);
    addSection("EXPOSURE RATE AT TABLE TOP", ["Distance", "Exposure Rate", "Remarks"], rows);
  }

  // 12. Tube Housing Leakage
  const rll = unwrap(data.radiationLeakageLevel);
  if (rll?.leakageMeasurements && Array.isArray(rll.leakageMeasurements) && rll.leakageMeasurements.length > 0) {
    const s = rll.settings || rll.testConditions || {};
    allData.push(["TEST: TUBE HOUSING LEAKAGE"]);
    allData.push(["FFD", s.fcd ?? s.ffd ?? "", "kVp", s.kv ?? "", "mA", s.ma ?? "", "Time", s.time ?? ""]);
    allData.push(["Location", "Left", "Right", "Top", "Up", "Down"]);
    rll.leakageMeasurements.forEach((l: any) => {
      allData.push([
        l.location ?? "",
        l.left ?? "",
        l.right ?? "",
        l.top ?? "",
        l.up ?? "",
        l.down ?? "",
      ]);
    });
    addBlank();
  }

  // 13. Radiation Protection Survey
  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    allData.push(["TEST: RADIATION PROTECTION SURVEY"]);
    allData.push([
      "Survey Date",
      rps.surveyDate ?? "",
      "Applied Current (mA)",
      rps.appliedCurrent ?? "",
      "Applied Voltage (kV)",
      rps.appliedVoltage ?? "",
      "Exposure Time (s)",
      rps.exposureTime ?? "",
    ]);
    if (Array.isArray(rps.locations) && rps.locations.length > 0) {
      allData.push(["Location", "Max. Radiation Level (mR/hr)", "Result"]);
      rps.locations.forEach((l: any) => {
        allData.push([l.location ?? "", l.mRPerHr ?? "", l.category ?? ""]);
      });
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "FixedRadioFluro");
  return wb;
};
