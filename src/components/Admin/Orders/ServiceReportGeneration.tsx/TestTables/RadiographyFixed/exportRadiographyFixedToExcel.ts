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

  // 3. Total Filtration
  const tf = unwrap(data.totalFiltration);
  if (tf?.totalFiltration) {
    const t = tf.totalFiltration;
    const rows = [
      ["TotalFiltration", t.measured ?? "", t.required ?? "", t.atKvp ?? ""],
    ];
    addSection(
      "TOTAL FILTRATION",
      ["Parameter", "Measured mm Al", "Required mm Al", "At kVp"],
      rows
    );
  }

  // 4. Linearity of Time (from Linearity of mA Loading table1/table2)
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma) {
    const t1 = lma.table1 || {};
    const t2 = Array.isArray(lma.table2) ? lma.table2 : [];
    allData.push(["TEST: LINEARITY OF TIME"]);
    allData.push([
      "FCD",
      t1.fcd ?? "",
      "kV",
      t1.kv ?? "",
      "Time Station (sec)",
      t1.time ?? "",
    ]);
    allData.push([
      "mA Station",
      "Measured mR 1",
      "Measured mR 2",
      "Measured mR 3",
    ]);
    t2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([
        r.mAApplied ?? r.mAsApplied ?? r.ma ?? "",
        outs[0] ?? "",
        outs[1] ?? "",
        outs[2] ?? "",
      ]);
    });
    if (lma.col !== undefined && lma.col !== null && lma.col !== "") {
      allData.push(["CoL", lma.col]);
    }
    addBlank();
  }

  // 5. Linearity of mAs Loading (if available)
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
        r.mAsRange ?? "",
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

  // 6. Consistency of Radiation Output
  const oc = unwrap(data.outputConsistency);
  if (oc) {
    const ffdVal = oc.ffd?.value ?? "";
    const rows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
    const measCount = Math.max(
      ...rows.map((r: any) => (r.outputs ?? []).length),
      Array.isArray(oc.measurementHeaders) ? oc.measurementHeaders.length : 0,
      1
    );
    const headerLabels = Array.isArray(oc.measurementHeaders) && oc.measurementHeaders.length > 0
      ? [...oc.measurementHeaders]
      : Array.from({ length: measCount }, (_, i) => `Meas ${i + 1}`);
    while (headerLabels.length < measCount) headerLabels.push(`Meas ${headerLabels.length + 1}`);
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["FFD", ffdVal]);
    allData.push(["kVp", "mAs", ...headerLabels.slice(0, measCount)]);
    rows.forEach((r: any) => {
      const outs = r.outputs || [];
      const rowData = [
        r.kv ?? "",
        r.mas ?? "",
        ...Array.from({ length: measCount }, (_, i) => outs[i]?.value ?? outs[i] ?? ""),
      ];
      allData.push(rowData);
    });
    const tolOp = oc.tolerance?.operator ?? oc.toleranceOperator ?? "<=";
    const tolVal = oc.tolerance?.value ?? oc.toleranceValue ?? "";
    allData.push(["Tolerance Operator", tolOp]);
    allData.push(["Tolerance Value (CoV)", tolVal]);
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

