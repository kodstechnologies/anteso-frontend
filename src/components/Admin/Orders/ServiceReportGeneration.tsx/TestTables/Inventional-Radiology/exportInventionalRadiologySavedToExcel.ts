import * as XLSX from "xlsx";

export interface InventionalRadiologySavedExportData {
  reportHeader?: any;
  accuracyOfIrradiationTime?: any;
  centralBeamAlignment?: any;
  effectiveFocalSpot?: any;
  accuracyOfOperatingPotential?: any;
  totalFiltration?: any;
  consistencyOfRadiationOutput?: any;
  linearityOfMasLoading?: any;
  measurementOfMaLinearity?: any;
  /** Double-tube: Frontal / Lateral Measurement of mA Linearity (written with TEST suffix). */
  measurementOfMaLinearityFrontal?: any;
  measurementOfMaLinearityLateral?: any;
  lowContrastResolution?: any;
  highContrastResolution?: any;
  exposureRateTableTop?: any;
  tubeHousingLeakage?: any;
  radiationProtectionSurvey?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

export const createInventionalRadiologySavedExcel = (
  data: InventionalRadiologySavedExportData
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  const addBlank = () => allData.push([]);
  const addSection = (title: string, headers: string[], rows: any[][]) => {
    allData.push([`TEST: ${title}`]);
    if (headers.length) allData.push(headers);
    rows.forEach((r) => allData.push(r));
    addBlank();
  };

  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi?.irradiationTimes?.length > 0) {
    const tc = aoi.testConditions || {};
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    allData.push(["FDD (cm)", tc.fcd ?? "", "kV", tc.kv ?? "", "mA", tc.ma ?? ""]);
    allData.push(["Set Time (mSec)", "Measured Time (mSec)"]);
    aoi.irradiationTimes.forEach((t: any) =>
      allData.push([t.setTime ?? "", t.measuredTime ?? t.measuredTime1 ?? ""])
    );
    addBlank();
  }

  const cba = unwrap(data.centralBeamAlignment);
  if (cba?.techniqueFactors || cba?.observedTilt || cba?.measurements?.length > 0) {
    const tf = cba.techniqueFactors || {};
    const obs =
      cba.observedTilt?.value ??
      cba.measurements?.[0]?.observedTilt ??
      cba.observedTilt ??
      "";
    const tol = cba.tolerance || {};
    allData.push(["TEST: CENTRAL BEAM ALIGNMENT"]);
    allData.push([
      "FFD (cm)",
      tf.fcd ?? "",
      "kV",
      tf.kv ?? "",
      "mA",
      tf.mas ?? tf.ma ?? "",
      "Time",
      tf.time ?? "",
    ]);
    allData.push(["Observed Tilt (cm)", obs]);
    allData.push(["Tolerance Operator", tol.operator ?? "<="]);
    allData.push(["Tolerance Value (cm)", tol.value ?? ""]);
    addBlank();
  }

  const efs = unwrap(data.effectiveFocalSpot);
  if (efs?.focalSpots?.length > 0 || efs?.table2?.length > 0) {
    const spots = efs.focalSpots || efs.table2 || [];
    allData.push(["TEST: EFFECTIVE FOCAL SPOT SIZE"]);
    if (efs.fcd) allData.push(["FFD (cm)", efs.fcd]);
    allData.push(["Focus Type", "Stated Focal Spot (mm)", "Measured Focal Spot (Nominal) (mm)"]);
    spots.forEach((r: any) => {
      allData.push([
        r.focusType ?? "",
        r.statedNominal ?? r.statedWidth ?? "",
        r.measuredNominal ?? r.measuredWidth ?? "",
      ]);
    });
    addBlank();
  }

  const aop = unwrap(data.accuracyOfOperatingPotential);
  if (aop?.table2?.length > 0) {
    const rows = aop.table2.map((row: any) => [
      row.setKV ?? "",
      row.ma10 ?? row.ma1 ?? "",
      row.ma100 ?? row.ma2 ?? "",
      row.ma200 ?? row.ma3 ?? "",
    ]);
    addSection("ACCURACY OF OPERATING POTENTIAL", ["Applied kVp", "mA 1 kVp", "mA 2 kVp", "mA 3 kVp"], rows);
  }

  const tf = unwrap(data.totalFiltration);
  if (tf?.totalFiltration) {
    const t = tf.totalFiltration;
    addSection("TOTAL FILTRATION", ["Parameter", "Measured mm Al", "Required mm Al", "At kVp"], [
      ["TotalFiltration", t.measured ?? "", t.required ?? "", t.atKvp ?? ""],
    ]);
  }

  const oc = unwrap(data.consistencyOfRadiationOutput);
  if (oc?.outputRows?.length > 0) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
    const savedHeaders: string[] = Array.isArray(oc.measurementHeaders) && oc.measurementHeaders.length > 0
      ? oc.measurementHeaders.map((h: unknown) => String(h ?? ""))
      : (() => {
          const rows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
          const colCount = Math.max(0, ...rows.map((r: any) => (r.outputs ?? []).length));
          return Array.from({ length: colCount || 5 }, (_, i: number) => `Meas ${i + 1}`);
        })();
    const tol = oc.tolerance || {};
    const tolOp = tol.operator || "<=";
    const tolVal = tol.value ?? "0.05";
    const headerCols = savedHeaders.map((_, i) => `Header ${i + 1}`);
    const measCols = savedHeaders.map((_, i) => `Meas ${i + 1}`);
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["Tolerance Operator", tolOp]);
    allData.push(["Tolerance Sign", tolOp]);
    allData.push(["Tolerance Value (CoV)", tolVal]);
    allData.push(["FDD (cm)", "kV", "mA", "Time", ...headerCols, ...measCols]);
    const rows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
    rows.forEach((r: any, idx: number) => {
      const outs = (r.outputs ?? []).map((o: any) => (typeof o === "object" && o != null ? o.value ?? "" : o ?? ""));
      const headerValues = idx === 0 ? savedHeaders : Array(savedHeaders.length).fill("");
      allData.push([
        idx === 0 ? (ffdVal || "") : "",
        r.kvp ?? r.kv ?? "",
        r.mas ?? "",
        "",
        ...headerValues,
        ...savedHeaders.map((_, i) => outs[i] ?? ""),
      ]);
    });
    addBlank();
  }

  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2?.length > 0) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    allData.push(["TEST: LINEARITY OF mAs LOADING"]);
    allData.push(["FDD (cm)", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push(["mAs Range", "Measured 1", "Measured 2", "Measured 3"]);
    lmas.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || r.outputs || [];
      allData.push([r.mAsRange ?? r.mAsApplied ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
    addBlank();
  }

  const appendMeasurementOfMaLinearity = (raw: any, titleSuffix = "") => {
    const mol = unwrap(raw);
    if (!mol?.table2?.length) return;
    const t1 = mol.table1?.[0] || mol.table1 || {};
    const maxOut = Math.max(
      1,
      ...(mol.table2 || []).map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
    );
    const savedHeaders = Array.isArray(mol.measurementHeaders) && mol.measurementHeaders.length > 0
      ? mol.measurementHeaders.map((h: any, i: number) => String(h || `Meas ${i + 1}`))
      : Array.isArray(mol.measHeaders) && mol.measHeaders.length > 0
        ? mol.measHeaders.map((h: any, i: number) => String(h || `Meas ${i + 1}`))
        : Array.from({ length: maxOut }, (_, i) => `Meas ${i + 1}`);
    while (savedHeaders.length < maxOut) savedHeaders.push(`Meas ${savedHeaders.length + 1}`);
    const hdrs = savedHeaders.slice(0, maxOut);
    const headerCols = hdrs.map((_: string, i: number) => `Header ${i + 1}`);
    allData.push([`TEST: MEASUREMENT OF MA LINEARITY${titleSuffix}`]);
    allData.push([
      "kVp",
      "Slice Thickness (mm)",
      "Time (ms)",
      "Tolerance Operator",
      "Tolerance",
      ...headerCols,
      "mA Applied",
      ...hdrs.map((_: string, i: number) => `Meas ${i + 1}`),
    ]);
    mol.table2.forEach((r: any, idx: number) => {
      const outs = (r.measuredOutputs || []).map((o: any) => (o == null ? "" : String(o)));
      const prefix =
        idx === 0
          ? [
              t1.kvp ?? "",
              t1.sliceThickness ?? "",
              t1.time ?? "",
              mol.toleranceOperator ?? "<=",
              mol.tolerance ?? "0.1",
              ...hdrs,
            ]
          : Array(5 + hdrs.length).fill("");
      allData.push([...prefix, r.mAsApplied ?? "", ...hdrs.map((_, i) => outs[i] ?? "")]);
    });
    addBlank();
  };

  // Double-tube: Frontal / Lateral sections (with TEST suffixes for re-import)
  if (data.measurementOfMaLinearityFrontal || data.measurementOfMaLinearityLateral) {
    appendMeasurementOfMaLinearity(data.measurementOfMaLinearityFrontal, " - Frontal");
    appendMeasurementOfMaLinearity(data.measurementOfMaLinearityLateral, " - Lateral");
  } else {
    appendMeasurementOfMaLinearity(data.measurementOfMaLinearity);
  }

  const lcr = unwrap(data.lowContrastResolution);
  if (lcr?.smallestHoleSize || lcr?.recommendedStandard) {
    const std = String(lcr.recommendedStandard ?? "1.0");
    addSection("LOW CONTRAST RESOLUTION", ["Smallest Hole Size (mm)", "Recommended Standard"], [[
      lcr.smallestHoleSize ?? "",
      /mm/i.test(std) ? std : `>= ${std} mm`,
    ]]);
  } else if (lcr?.testRows?.length > 0 || lcr?.readings?.length > 0) {
    const rows = (lcr.testRows || lcr.readings || []).map((r: any) => [
      r.smallestHoleSize ?? r.testName ?? r.detail ?? "",
      r.recommendedStandard ?? r.result ?? r.value ?? "",
    ]);
    addSection("LOW CONTRAST RESOLUTION", ["Smallest Hole Size (mm)", "Recommended Standard"], rows);
  }

  const hcr = unwrap(data.highContrastResolution);
  if (hcr?.measuredLpPerMm || hcr?.recommendedStandard) {
    const std = String(hcr.recommendedStandard ?? "2.0");
    addSection("HIGH CONTRAST RESOLUTION", ["Measured Resolution (lp/mm)", "Recommended Standard (lp/mm)"], [[
      hcr.measuredLpPerMm ?? "",
      /lp\/mm/i.test(std) ? std : `>= ${std} lp/mm`,
    ]]);
  } else if (hcr?.measurements?.length > 0 || hcr?.readings?.length > 0) {
    const rows = (hcr.measurements || hcr.readings || []).map((r: any) => [
      r.measuredLpPerMm ?? r.detail ?? "",
      r.recommendedStandard ?? "",
    ]);
    addSection("HIGH CONTRAST RESOLUTION", ["Measured Resolution (lp/mm)", "Recommended Standard (lp/mm)"], rows);
  }

  const ert = unwrap(data.exposureRateTableTop);
  if (ert?.rows?.length > 0) {
    allData.push(["TEST: EXPOSURE RATE AT TABLE TOP"]);
    allData.push([
      "Max Exposure (AEC Mode) (cGy/Min)",
      "Max Exposure (Manual Mode) (cGy/Min)",
      "Min. Focus to Tabletop Distance",
      "Distance (cm)",
      "kV",
      "mA",
      "Mode",
      "Measured Rate",
      "Criteria",
    ]);
    ert.rows.forEach((r: any, idx: number) => {
      const mode =
        r.remark === "AEC Mode" ? "AEC" : r.remark === "Manual Mode" ? "Manual" : r.remark ?? "";
      const prefix =
        idx === 0
          ? [ert.aecTolerance ?? "10", ert.nonAecTolerance ?? "5", ert.minFocusDistance ?? "30"]
          : ["", "", ""];
      allData.push([
        ...prefix,
        r.distance ?? "",
        r.appliedKv ?? "",
        r.appliedMa ?? "",
        mode,
        r.exposure ?? "",
        "",
      ]);
    });
    addBlank();
  }

  const rll = unwrap(data.tubeHousingLeakage);
  if (rll?.leakageMeasurements?.length > 0) {
    const s = rll.settings || rll.testConditions || {};
    allData.push(["TEST: TUBE HOUSING LEAKAGE"]);
    allData.push(["FFD", s.fcd ?? s.ffd ?? "", "kVp", s.kv ?? "", "mA", s.ma ?? "", "Time", s.time ?? ""]);
    allData.push(["Location", "Left", "Right", "Top", "Up", "Down"]);
    rll.leakageMeasurements.forEach((l: any) =>
      allData.push([l.location ?? "", l.left ?? "", l.right ?? "", l.top ?? "", l.up ?? "", l.down ?? ""])
    );
    addBlank();
  }

  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    allData.push(["TEST: RADIATION PROTECTION SURVEY REPORT"]);
    allData.push([
      "Location",
      "mR/hr",
      "Category",
      "Applied Voltage",
      "Applied Current",
      "Exposure Time",
      "Workload",
    ]);
    const locs = Array.isArray(rps.locations) ? rps.locations : [];
    locs.forEach((l: any, idx: number) => {
      allData.push([
        l.location ?? "",
        l.mRPerHr ?? "",
        l.category ?? "",
        idx === 0 ? (rps.appliedVoltage ?? "") : "",
        idx === 0 ? (rps.appliedCurrent ?? "") : "",
        idx === 0 ? (rps.exposureTime ?? "") : "",
        idx === 0 ? (rps.workload ?? "") : "",
      ]);
    });
    addBlank();
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "InventionalRadiology");
  return wb;
};
