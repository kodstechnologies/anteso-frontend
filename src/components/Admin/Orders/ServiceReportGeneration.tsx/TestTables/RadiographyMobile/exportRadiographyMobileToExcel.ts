import * as XLSX from "xlsx";

export interface RadiographyMobileExportData {
  reportHeader?: any;
  accuracyOfOperatingPotential?: any;
  accuracyOfIrradiationTime?: any;
  centralBeamAlignment?: any;
  congruence?: any;
  effectiveFocalSpot?: any;
  linearityOfMasLoading?: any;
  outputConsistency?: any;
  radiationLeakageLevel?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

const pad = (n: number) => Array(n).fill("");

/**
 * Separate templates by timer mode:
 * - With Timer: Accuracy of Irradiation Time + Linearity of mA Loading
 * - No Timer: Linearity of mAs Loading Stations (no irradiation / mA sections)
 */
export const buildMobileTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  const sec = (title: string, lines: any[][]) => {
    rows.push([`TEST: ${title}`, ...pad(9)]);
    lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 10 - line.length))]));
    rows.push([]);
  };

  sec("ACCURACY OF OPERATING POTENTIAL (kVp)", [
    ["Tolerance Sign", "-"],
    ["Tolerance Value (kVp)", "2"],
    [],
    ["Total Filtration Required (mm Al)", "2.5"],
    ["Total Filtration At kVp", "80"],
    ["Applied kVp", "50 mA", "100 mA"],
    ["60", "59.8", "60.2"],
    ["80", "79.5", "80.5"],
    ["100", "99.2", "100.8"],
    ["120", "119.5", "120.5"],
  ]);

  if (hasTimer) {
    sec("ACCURACY OF IRRADIATION TIME", [
      ["FDD (cm)", "100", "kV", "80", "mA", "100"],
      ["Set Time (s)", "Measured Time (s)"],
      ["0.1", "0.102"],
      ["0.2", "0.198"],
      ["0.5", "0.505"],
      ["Tolerance Operator", "<="],
      ["Tolerance Value (%)", "5"],
    ]);
  }

  sec("OUTPUT CONSISTENCY", [
    ["FDD (cm)", "100"],
    ["kVp", "mAs", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"],
    ["80", "10", "0.85", "0.84", "0.86", "0.85", "0.85"],
    ["Tolerance Operator", "<="],
    ["Tolerance (CoV)", "0.05"],
  ]);

  sec("CENTRAL BEAM ALIGNMENT", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Observed Tilt (cm)", "0.5"],
    ["Tolerance (cm)", "1.5"],
  ]);

  sec("CONGRUENCE OF RADIATION", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Dimension", "Observed Shift (cm)", "Edge Shift (cm)", "Tolerance (%)"],
    ["Length", "0.2", "0.1", "2"],
    ["Width", "0.3", "0.1", "2"],
  ]);

  sec("EFFECTIVE FOCAL SPOT", [
    ["FFD (cm)", "60"],
    ["Focus Type", "Stated Focal Spot of Tube (f)", "Measured Focal Spot (Nominal)"],
    ["Small", "0.6", "0.65"],
    ["Large", "1.2", "1.3"],
  ]);

  if (hasTimer) {
    sec("LINEARITY OF mA LOADING STATIONS", [
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
      ["5", "0.43", "0.42", "0.43"],
      ["10", "0.86", "0.85", "0.87"],
      ["20", "1.72", "1.71", "1.73"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  }

  sec("RADIATION LEAKAGE LEVEL", [
    ["FDD (cm)", "100", "kV", "125", "mA", "20", "Time (min)", "2", "Workload", "20"],
    ["Tolerance Value (mGy/h)", "1"],
    ["Tolerance Operator", "<"],
    ["Location", "Left", "Right", "Front", "Back", "Top"],
    ["Tube - Left", "0.05", "0.04", "0.06", "0.05", "0.04"],
    ["Collimator - Left", "0.02", "0.03", "0.02", "0.03", "0.02"],
  ]);

  return rows;
};

const writeWorkbookSafely = (wb: XLSX.WorkBook, outputPath: string) => {
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

/** Write separate With Timer / No Timer Excel templates. */
export const writeMobileTemplateWorkbook = (outputDir: string) => {
  const withTimerPath = `${outputDir}/Radiography_Mobile_Template_WithTimer.xlsx`;
  const noTimerPath = `${outputDir}/Radiography_Mobile_Template_NoTimer.xlsx`;
  const legacyPath = `${outputDir}/Radiography_Mobile_Template.xlsx`;

  const wbTimer = XLSX.utils.book_new();
  const wsTimer = XLSX.utils.aoa_to_sheet(buildMobileTemplateRows(true));
  wsTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wbTimer, wsTimer, "With Timer");
  writeWorkbookSafely(wbTimer, withTimerPath);
  writeWorkbookSafely(wbTimer, legacyPath);

  const wbNoTimer = XLSX.utils.book_new();
  const wsNoTimer = XLSX.utils.aoa_to_sheet(buildMobileTemplateRows(false));
  wsNoTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wbNoTimer, wsNoTimer, "Without Timer");
  writeWorkbookSafely(wbNoTimer, noTimerPath);
};

export const createRadiographyMobileUploadableExcel = (
  data: RadiographyMobileExportData
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

  // 1. Accuracy of Operating Potential (same as RadiographyFixed)
  const aop = unwrap(data.accuracyOfOperatingPotential);
  if (aop?.table2 && Array.isArray(aop.table2) && aop.table2.length > 0) {
    const rows = aop.table2.map((row: any) => [
      row.setKV ?? "",
      row.ma10 ?? row.ma1 ?? "",
      row.ma100 ?? row.ma2 ?? "",
      row.ma200 ?? row.ma3 ?? "",
    ]);
    addSection(
      "ACCURACY OF OPERATING POTENTIAL",
      ["Applied kVp", "mA Station 1 kVp", "mA Station 2 kVp", "mA Station 3 kVp"],
      rows
    );
  }

  // 2. Accuracy of Irradiation Time
  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi) {
    const tc = aoi.testConditions || {};
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    allData.push([
      "FCD",
      tc.fcd ?? "",
      "kV",
      tc.kv ?? "",
      "mA",
      tc.ma ?? "",
    ]);
    const times = Array.isArray(aoi.irradiationTimes)
      ? aoi.irradiationTimes
      : [];
    allData.push(["Set Time (mSec)", "Measured Time (mSec)"]);
    times.forEach((t: any) => {
      allData.push([
        t.setTime ?? "",
        t.measuredTime ?? t.measuredTime1 ?? "",
      ]);
    });
    addBlank();
  }

  // 3. Central Beam Alignment
  const cba = unwrap(data.centralBeamAlignment);
  if (cba && (cba.readings?.length || cba.measurements?.length)) {
    const rows = (cba.readings || cba.measurements || []).map((r: any) => [
      r.distance ?? r.appliedDistance ?? "",
      r.measured ?? r.measuredValue ?? "",
      r.remark ?? r.remarks ?? "",
    ]);
    addSection(
      "CENTRAL BEAM ALIGNMENT",
      ["Distance (cm)", "Measured (mm)", "Remarks"],
      rows
    );
  }

  // 4. Congruence
  const cong = unwrap(data.congruence);
  if (cong && (cong.readings?.length || cong.measurements?.length)) {
    const rows = (cong.readings || cong.measurements || []).map((r: any) => [
      r.opticalField ?? r.optical ?? "",
      r.radiationField ?? r.radiation ?? "",
      r.remark ?? r.remarks ?? "",
    ]);
    addSection(
      "CONGRUENCE OF RADIATION & OPTICAL FIELD",
      ["Optical Field (cm)", "Radiation Field (cm)", "Remarks"],
      rows
    );
  }

  // 5. Effective Focal Spot
  const efs = unwrap(data.effectiveFocalSpot);
  if (efs && (efs.measurements?.length || efs.readings?.length)) {
    const rows = (efs.measurements || efs.readings || []).map((r: any) => [
      r.appliedKvp ?? r.kvp ?? "",
      r.measured ?? r.measuredValue ?? "",
      r.remark ?? r.remarks ?? "",
    ]);
    addSection(
      "EFFECTIVE FOCAL SPOT MEASUREMENT",
      ["Applied kVp", "Measured (mm)", "Remarks"],
      rows
    );
  }

  // 6. Linearity of mAs Loading
  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas) {
    const t1 = lmas.table1?.[0] || {};
    const t2 = Array.isArray(lmas.table2) ? lmas.table2 : [];
    allData.push(["TEST: LINEARITY OF mAs LOADING"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push([
      "mAs Range",
      "Measured mR 1",
      "Measured mR 2",
      "Measured mR 3",
    ]);
    t2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([
        r.mAsRange ?? r.mAsApplied ?? r.ma ?? "",
        outs[0] ?? "",
        outs[1] ?? "",
        outs[2] ?? "",
      ]);
    });
    if (lmas.col !== undefined && lmas.col !== null && lmas.col !== "") {
      allData.push(["CoL", lmas.col]);
    }
    addBlank();
  }

  // 7. Consistency of Radiation Output
  const oc = unwrap(data.outputConsistency);
  if (oc) {
    const ffdVal = oc.ffd?.value ?? "";
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["FFD", ffdVal]);
    allData.push([
      "kVp",
      "mAs",
      "Reading (mR) 1",
      "Reading (mR) 2",
      "Reading (mR) 3",
    ]);
    const rows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
    rows.forEach((r: any) => {
      const outs = r.outputs || [];
      allData.push([
        r.kv ?? "",
        r.mas ?? "",
        outs[0]?.value ?? outs[0] ?? "",
        outs[1]?.value ?? outs[1] ?? "",
        outs[2]?.value ?? outs[2] ?? "",
      ]);
    });
    addBlank();
  }

  // 8. Radiation Leakage Level
  const rll = unwrap(data.radiationLeakageLevel);
  if (rll) {
    const s = rll.settings || {};
    allData.push(["TEST: RADIATION LEAKAGE LEVEL FROM X-RAY TUBE HOUSE"]);
    allData.push([
      "FFD",
      s.fcd ?? "",
      "kVp",
      s.kv ?? "",
      "mA",
      s.ma ?? "",
      "Time",
      s.time ?? "",
      "Tolerance",
      rll.toleranceValue ?? "",
    ]);
    if (rll.workload) {
      allData.push(["Workload", rll.workload]);
    }
    allData.push(["Location", "Left", "Right", "Top", "Up", "Down"]);
    const leaks = Array.isArray(rll.leakageMeasurements)
      ? rll.leakageMeasurements
      : [];
    leaks.forEach((l: any) => {
      allData.push([
        l.location ?? "",
        l.left ?? "",
        l.right ?? "",
        l.top ?? "",
        l.up ?? "",
        l.down ?? "",
      ]);
    });
  }

  if (allData.length === 0) {
    const hasTimerFallback =
      !!unwrap(data.accuracyOfIrradiationTime) ||
      !!(unwrap(data.linearityOfMasLoading)?.table1?.[0]?.time);
    const templateRows = buildMobileTemplateRows(hasTimerFallback);
    const wsEmpty = XLSX.utils.aoa_to_sheet(templateRows);
    wsEmpty["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, wsEmpty, "Radiography Mobile Test Data");
    return wb;
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, "RadiographyMobile");
  return wb;
};
