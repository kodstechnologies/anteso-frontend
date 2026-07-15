import * as XLSX from "xlsx";

export interface RadiographyFixedExportData {
  reportHeader?: any;
  accuracyOfOperatingPotential?: any;
  accuracyOfIrradiationTime?: any;
  totalFiltration?: any;
  centralBeamAlignment?: any;
  congruence?: any;
  effectiveFocalSpot?: any;
  linearityOfMaLoading?: any;
  linearityOfMasLoading?: any;
  outputConsistency?: any;
  radiationLeakageLevel?: any;
  radiationProtectionSurvey?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

const pad = (n: number) => Array(n).fill("");

const isMetaColumnHeader = (h: string) =>
  /^(avg|average|average\s*\(.*\)|mean|x̄|cov|cv|coL|col|remark|remarks|result|x\s*max|x\s*min)$/i.test(
    String(h ?? "").trim()
  );

const cellStr = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "object" && "value" in v) return String((v as any).value ?? "");
  return String(v);
};

/** Resolve dynamic measurement column labels from saved headers + data length. */
const resolveMeasHeaders = (
  saved: any,
  maxFromRows: number,
  fallbackPrefix = "Measured Output"
): string[] => {
  const raw = Array.isArray(saved)
    ? saved.map((h: any) => String(h ?? "").trim()).filter((h: string) => h && !isMetaColumnHeader(h))
    : [];
  const count = Math.max(maxFromRows, raw.length, 1);
  return Array.from({ length: count }, (_, i) => raw[i] || `${fallbackPrefix} ${i + 1}`);
};

/**
 * Separate templates by timer mode:
 * - With Timer: Accuracy of Irradiation Time + Linearity of mA Loading
 * - No Timer: Linearity of mAs Loading only (no irradiation / mA sections)
 */
export const buildFixedTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  const sec = (title: string, lines: any[][]) => {
    rows.push([`TEST: ${title}`, ...pad(9)]);
    lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 10 - line.length))]));
    rows.push([]);
  };

  sec("CONGRUENCE OF RADIATION", [
    ["FFD (cm)", "150", "kV", "20", "mAs", "20"],
    ["Dimensions", "Observed Shift (cm)", "Edge Shift (cm)", "Tolerance (% of FFD)"],
    ["? X ? + ? X' ?", "0.3", "0.1", "4"],
    ["? Y ? + ? Y' ?", "0.4", "0.3", "2"],
  ]);

  sec("CENTRAL BEAM ALIGNMENT", [
    ["FFD (cm)", "200", "kV", "20", "mAs", "10"],
    ["Observed Tilt (cm)", "1.2"],
    ["Tolerance Operator", "<"],
    ["Tolerance Value (cm)", "1.5"],
  ]);

  sec("EFFECTIVE FOCAL SPOT", [
    ["FFD (cm)", "100"],
    ["Focus Type", "Stated Focal Spot (mm)", "Measured Focal Spot (Nominal) (mm)"],
    ["Large Focus", "1.2", "1.3"],
    ["Small Focus", "0.6", "0.7"],
  ]);

  if (hasTimer) {
    sec("ACCURACY OF IRRADIATION TIME", [
      ["FDD (cm)", "100", "kV", "80", "mA", "100"],
      ["Set Time (ms)", "Measured Time 1 (ms)", "Tolerance Operator", "Tolerance Value (%)"],
      ["100", "98.5", "<=", "20"],
      ["200", "198"],
    ]);
  }

  sec("TOTAL FILTRATION", [
    ["Tolerance Sign", "±"],
    ["Tolerance Value (kVp)", "5"],
    ["Total Filtration Required (mm Al)", "2.5"],
    ["Total Filtration At kVp", "70"],
    ["mA Station 1", "50"],
    ["mA Station 2", "100"],
    ["mA Station 3", "23"],
    ["Applied kVp", "Measured 1", "Measured 2", "Measured 3"],
    ["60", "60.2", "60.1", "60.3"],
  ]);

  if (hasTimer) {
    sec("LINEARITY OF mA LOADING", [
      ["FDD (cm)", "100", "kV", "80", "Time (s)", "0.1"],
      ["mA Applied", "Measured Output 1", "Measured Output 2"],
      ["50", "0.5", "0.51"],
      ["100", "0.98"],
      ["Tolerance Operator", "<="],
      ["Tolerance Value (CoL)", "0.1"],
    ]);
  } else {
    sec("LINEARITY OF mAs LOADING", [
      ["FDD (cm)", "100", "kV", "80"],
      ["mAs Range", "Measured Output 1", "Measured Output 2", "Measured Output 3"],
      ["5 - 10", "0.5", "0.51", "0.49"],
      ["10 - 20", "1", "1.01", "0.99"],
      ["20 - 50", "2.5", "2.51", "2.49"],
      ["Tolerance Operator", "<="],
      ["Tolerance Value (CoL)", "0.1"],
    ]);
  }

  sec("CONSISTENCY OF RADIATION OUTPUT", [
    ["FDD (cm)", "100"],
    ["kVp", "mAs", "Output 1", "Output 2"],
    ["80", "10", "0.5", "0.51"],
    ["Tolerance Operator", "<="],
    ["Tolerance Value (CoV)", "0.05"],
  ]);

  sec("RADIATION LEAKAGE LEVEL", [
    ["FDD (cm)", "100", "kV", "120", "mA", "21", "Time (min)", "2", "Workload", "180"],
    ["Tolerance Value (mGy/h)", "1"],
    ["Tolerance Operator", "<"],
    ["Tolerance Time (h)", "1"],
    ["Location", "Left", "Right", "Front", "Back", "Top"],
    ["Tube", "0.1", "0.1", "0.1", "0.1", "0.1"],
  ]);

  sec("RADIATION PROTECTION SURVEY", [
    [
      "Applied Current (mA)",
      "100",
      "Applied Voltage (kV)",
      "80",
      "Exposure Time (s)",
      "0.5",
      "Workload (mA.min/week)",
      "5000",
    ],
    ["LOCATION", "mR/hr", "Category"],
    ["Control Console (Operator Position)", "0.1", "worker"],
    ["Outside Patient Entrance Door", "0.05", "public"],
  ]);

  return rows;
};

export const createRadiographyFixedUploadableExcel = (
  data: RadiographyFixedExportData
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

  // 1. Accuracy of Operating Potential
  const aop = unwrap(data.accuracyOfOperatingPotential);
  if (aop?.table2 && Array.isArray(aop.table2) && aop.table2.length > 0) {
    const rows = aop.table2.map((row: any) => [
      row.setKV ?? "",
      row.ma10 ?? row.ma1 ?? "",
      row.ma100 ?? row.ma2 ?? "",
      row.ma200 ?? row.ma3 ?? "",
      row.avgKvp ?? "",
      row.remarks ?? "",
    ]);
    addSection(
      "ACCURACY OF OPERATING POTENTIAL",
      ["Applied kVp", "mA Station 1 kVp", "mA Station 2 kVp", "mA Station 3 kVp", "Average", "Remark"],
      rows
    );
  }

  // 2. Accuracy of Irradiation Time
  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi) {
    const tc = aoi.testConditions || {};
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    allData.push([
      "FDD (cm)",
      tc.fcd ?? tc.ffd ?? "",
      "kV",
      tc.kv ?? "",
      "mA",
      tc.ma ?? "",
    ]);
    const times = Array.isArray(aoi.irradiationTimes)
      ? aoi.irradiationTimes
      : [];
    allData.push(["Set Time (ms)", "Measured Time 1 (ms)", "Tolerance Operator", "Tolerance Value (%)"]);
    times.forEach((t: any, i: number) => {
      allData.push([
        t.setTime ?? "",
        t.measuredTime ?? t.measuredTime1 ?? "",
        i === 0 ? (aoi.toleranceOperator ?? aoi.tolerance?.operator ?? "") : "",
        i === 0 ? (aoi.toleranceValue ?? aoi.tolerance?.value ?? aoi.tolerance ?? "") : "",
      ]);
    });
    addBlank();
  }

  // 3. Total Filtration (dynamic mA stations + remarks)
  const tf = unwrap(data.totalFiltration);
  if (tf && (Array.isArray(tf.measurements) || tf.totalFiltration || Array.isArray(tf.mAStations))) {
    const measurements = Array.isArray(tf.measurements) ? tf.measurements : [];
    const maxMeas = Math.max(
      0,
      ...measurements.map((m: any) => (Array.isArray(m.measuredValues) ? m.measuredValues.length : 0))
    );
    const stations =
      Array.isArray(tf.mAStations) && tf.mAStations.length > 0
        ? tf.mAStations.map((s: any) => String(s ?? "").trim()).filter(Boolean)
        : Array.from({ length: Math.max(maxMeas, 1) }, (_, i) => `Measured ${i + 1}`);

    allData.push(["TEST: TOTAL FILTRATION"]);
    allData.push(["Tolerance Sign", tf.tolerance?.sign ?? "±"]);
    allData.push(["Tolerance Value (kVp)", tf.tolerance?.value ?? ""]);
    if (tf.totalFiltration?.measured != null && String(tf.totalFiltration.measured).trim() !== "") {
      allData.push(["Total Filtration Measured (mm Al)", tf.totalFiltration.measured]);
    }
    allData.push(["Total Filtration Required (mm Al)", tf.totalFiltration?.required ?? ""]);
    allData.push(["Total Filtration At kVp", tf.totalFiltration?.atKvp ?? ""]);
    stations.forEach((station: string, i: number) => {
      const numeric = String(station).replace(/\s*mA$/i, "").trim();
      allData.push([`mA Station ${i + 1}`, numeric || station]);
    });
    allData.push([
      "Applied kVp",
      ...stations,
      "Average",
      "Remark",
    ]);
    measurements.forEach((m: any) => {
      const vals = Array.from({ length: stations.length }, (_, i) =>
        cellStr(m.measuredValues?.[i])
      );
      allData.push([
        m.appliedKvp ?? "",
        ...vals,
        m.averageKvp ?? "",
        m.remarks ?? m.remark ?? "",
      ]);
    });
    addBlank();
  }

  // 4–5. Linearity of mA / mAs Loading (same API; detect by Time)
  const linearity =
    unwrap(data.linearityOfMasLoading) ||
    unwrap(data.linearityOfMaLoading);
  if (linearity) {
    const t1 = Array.isArray(linearity.table1)
      ? linearity.table1[0] || {}
      : linearity.table1 || {};
    const t2 = Array.isArray(linearity.table2) ? linearity.table2 : [];
    const timeStr = t1.time != null ? String(t1.time).trim() : "";
    const hasTime = timeStr !== "";
    const title = hasTime ? "LINEARITY OF mA LOADING" : "LINEARITY OF mAs LOADING";
    const maxMeas = Math.max(
      0,
      ...t2.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
    );
    const measHeaders = resolveMeasHeaders(
      linearity.measHeaders || linearity.measurementHeaders,
      maxMeas,
      "Measured Output"
    );

    allData.push([`TEST: ${title}`]);
    if (hasTime) {
      allData.push([
        "FDD (cm)",
        t1.fcd ?? "",
        "kV",
        t1.kv ?? "",
        "Time (s)",
        timeStr,
      ]);
      allData.push(["mA Applied", ...measHeaders]);
      t2.forEach((r: any) => {
        const outs = Array.isArray(r.measuredOutputs) ? r.measuredOutputs : [];
        allData.push([
          r.mAApplied ?? r.mAsApplied ?? r.ma ?? "",
          ...measHeaders.map((_, i) => cellStr(outs[i])),
        ]);
      });
    } else {
      allData.push(["FDD (cm)", t1.fcd ?? "", "kV", t1.kv ?? ""]);
      allData.push(["mAs Range", ...measHeaders]);
      t2.forEach((r: any) => {
        const outs = Array.isArray(r.measuredOutputs) ? r.measuredOutputs : [];
        allData.push([
          r.mAsRange ?? r.mAsApplied ?? r.ma ?? "",
          ...measHeaders.map((_, i) => cellStr(outs[i])),
        ]);
      });
    }
    allData.push([
      "Tolerance Operator",
      linearity.toleranceOperator ?? "<=",
    ]);
    allData.push([
      "Tolerance Value (CoL)",
      linearity.tolerance ?? "0.1",
    ]);
    if (linearity.col != null && String(linearity.col).trim() !== "") {
      allData.push(["CoL", linearity.col]);
    }
    if (linearity.remarks != null && String(linearity.remarks).trim() !== "") {
      allData.push(["Remark", linearity.remarks]);
    }
    addBlank();
  }

  // 6. Consistency of Radiation Output
  const oc = unwrap(data.outputConsistency);
  if (oc) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
    const rows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
    const maxMeas = Math.max(
      0,
      ...rows.map((r: any) => (Array.isArray(r.outputs) ? r.outputs.length : 0))
    );
    const headerLabels = resolveMeasHeaders(
      oc.measurementHeaders || oc.measHeaders || oc.outputHeaders,
      maxMeas,
      "Output"
    );
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["FDD (cm)", ffdVal]);
    allData.push(["kVp", "mAs", ...headerLabels, "Average", "CoV", "Remark"]);
    rows.forEach((r: any) => {
      const outs = Array.isArray(r.outputs) ? r.outputs : [];
      allData.push([
        r.kv ?? r.kvp ?? "",
        r.mas ?? r.mAs ?? "",
        ...headerLabels.map((_, i) => cellStr(outs[i])),
        r.avg ?? r.average ?? r.mean ?? "",
        r.cv ?? r.cov ?? "",
        r.remark ?? r.remarks ?? "",
      ]);
    });
    const tolOp = oc.tolerance?.operator ?? oc.toleranceOperator ?? "<=";
    const tolVal = oc.tolerance?.value ?? oc.toleranceValue ?? oc.tolerance ?? "";
    allData.push(["Tolerance Operator", tolOp]);
    allData.push(["Tolerance Value (CoV)", typeof tolVal === "object" ? "" : tolVal]);
    addBlank();
  }

  // 7. Radiation Leakage Level
  const rll = unwrap(data.radiationLeakageLevel);
  if (rll) {
    const s = rll.settings || {};
    const leakageOpRaw = String(rll.toleranceOperator ?? "").trim().toLowerCase();
    const leakageOpSymbol =
      leakageOpRaw === ">" || leakageOpRaw === "greater than" || leakageOpRaw === "gt"
        ? ">"
        : leakageOpRaw === "=" || leakageOpRaw === "==" || leakageOpRaw === "equals" || leakageOpRaw === "equal to"
          ? "="
          : "<";
    allData.push(["TEST: RADIATION LEAKAGE LEVEL"]);
    allData.push([
      "FDD (cm)",
      s.fcd ?? "",
      "kV",
      s.kv ?? "",
      "mA",
      s.ma ?? "",
      "Time (min)",
      s.time ?? "",
      "Workload",
      rll.workload ?? "",
    ]);
    allData.push(["Tolerance Value (mGy/h)", rll.toleranceValue ?? ""]);
    allData.push(["Tolerance Operator", leakageOpSymbol]);
    allData.push(["Tolerance Time (h)", rll.toleranceTime ?? ""]);
    allData.push(["Location", "Left", "Right", "Front", "Back", "Top"]);
    const leaks = Array.isArray(rll.leakageMeasurements)
      ? rll.leakageMeasurements
      : [];
    leaks.forEach((l: any) => {
      allData.push([
        l.location ?? "",
        l.left ?? "",
        l.right ?? "",
        l.front ?? "",
        l.back ?? "",
        l.top ?? "",
      ]);
    });
    addBlank();
  }

  // 8. Radiation Protection Survey (survey date is set in UI to today — not exported)
  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    allData.push(["TEST: RADIATION PROTECTION SURVEY"]);
    allData.push([
      "Applied Current (mA)",
      rps.appliedCurrent ?? "",
      "Applied Voltage (kV)",
      rps.appliedVoltage ?? "",
      "Exposure Time (s)",
      rps.exposureTime ?? "",
      "Workload (mA.min/week)",
      rps.workload ?? "",
    ]);
    allData.push([
      "LOCATION",
      "mR/hr",
      "Category",
    ]);
    const locs = Array.isArray(rps.locations) ? rps.locations : [];
    locs.forEach((l: any) => {
      allData.push([
        l.location ?? "",
        l.mRPerHr ?? "",
        l.category ?? "",
      ]);
    });
  }

  if (allData.length === 0) {
    const hasTimerFallback =
      !!unwrap(data.accuracyOfIrradiationTime) || !!unwrap(data.linearityOfMaLoading);
    const templateRows = buildFixedTemplateRows(hasTimerFallback);
    const wsEmpty = XLSX.utils.aoa_to_sheet(templateRows);
    wsEmpty["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, wsEmpty, "Radiography Fixed Test Data");
    return wb;
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws, "RadiographyFixed");
  return wb;
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
export const writeFixedTemplateWorkbook = (outputDir: string) => {
  const withTimerPath = `${outputDir}/RadiographyFixed_Template_WithTimer.xlsx`;
  const noTimerPath = `${outputDir}/RadiographyFixed_Template_NoTimer.xlsx`;

  const wbTimer = XLSX.utils.book_new();
  const wsTimer = XLSX.utils.aoa_to_sheet(buildFixedTemplateRows(true));
  wsTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wbTimer, wsTimer, "With Timer");
  writeWorkbookSafely(wbTimer, withTimerPath);

  const wbNoTimer = XLSX.utils.book_new();
  const wsNoTimer = XLSX.utils.aoa_to_sheet(buildFixedTemplateRows(false));
  wsNoTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wbNoTimer, wsNoTimer, "Without Timer");
  writeWorkbookSafely(wbNoTimer, noTimerPath);
};

