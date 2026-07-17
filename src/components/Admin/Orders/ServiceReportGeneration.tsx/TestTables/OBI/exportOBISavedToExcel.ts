import * as XLSX from "xlsx";

export interface OBISavedExportData {
  reportHeader?: any;
  congruenceOfRadiation?: any;
  centralBeamAlignment?: any;
  effectiveFocalSpot?: any;
  timerTest?: any;
  accuracyOfOperatingPotential?: any;
  outputConsistency?: any;
  highContrastSensitivity?: any;
  lowContrastSensitivity?: any;
  linearityOfTime?: any;
  linearityOfMasLoadingStations?: any;
  tubeHousingLeakage?: any;
  radiationProtectionSurvey?: any;
  alignmentTest?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

export const createOBISavedExcel = (data: OBISavedExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  const addBlank = () => allData.push([]);
  const addSection = (title: string, headers: string[], rows: any[][]) => {
    allData.push([`TEST: ${title}`]);
    if (headers.length) allData.push(headers);
    rows.forEach((r) => allData.push(r));
    addBlank();
  };

  const congruence = unwrap(data.congruenceOfRadiation);
  if (congruence?.measurements?.length > 0) {
    const rows = congruence.measurements.map((m: any) => [m.dimension ?? "", m.radiation ?? "", m.optical ?? "", m.difference ?? ""]);
    addSection("CONGRUENCE OF RADIATION", ["Dimension", "Radiation (cm)", "Optical (cm)", "Difference"], rows);
  }

  const cba = unwrap(data.centralBeamAlignment);
  if (cba?.measurements?.length > 0) {
    const rows = cba.measurements.map((m: any) => [m.observedTilt ?? "", m.tolerance ?? ""]);
    addSection("CENTRAL BEAM ALIGNMENT", ["Observed Tilt", "Tolerance"], rows);
  }

  const efs = unwrap(data.effectiveFocalSpot);
  if (efs?.focalSpots?.length > 0) {
    allData.push(["========== EFFECTIVE FOCAL SPOT =========="]);
    allData.push(["Field Name", "Value"]);
    allData.push(["FCD", efs.fcd ?? ""]);
    efs.focalSpots.forEach((spot: any) => {
      const stated =
        spot.statedNominal ??
        (spot.statedWidth != null && spot.statedHeight != null
          ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
          : spot.statedWidth ?? spot.statedHeight ?? "");
      const measured =
        spot.measuredNominal ??
        (spot.measuredWidth != null && spot.measuredHeight != null
          ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
          : spot.measuredWidth ?? spot.measuredHeight ?? "");
      allData.push(["FocalSpot_FocusType", spot.focusType ?? ""]);
      allData.push(["FocalSpot_StatedNominal", stated]);
      allData.push(["FocalSpot_MeasuredNominal", measured]);
    });
    addBlank();
  }

  const timer = unwrap(data.timerTest);
  if (timer?.irradiationTimes?.length > 0) {
    const tc = timer.testConditions || {};
    allData.push(["TEST: TIMER TEST"]);
    allData.push(["FCD", tc.fcd ?? "", "kV", tc.kv ?? "", "mA", tc.ma ?? ""]);
    allData.push(["Set Time (mSec)", "Measured Time (mSec)"]);
    timer.irradiationTimes.forEach((t: any) => allData.push([t.setTime ?? "", t.measuredTime ?? t.measuredTime1 ?? ""]));
    addBlank();
  }

  const aop = unwrap(data.accuracyOfOperatingPotential);
  const aopRows = aop?.measurements?.length > 0 ? aop.measurements : aop?.table2 || [];
  if (aopRows.length > 0) {
    const maxMeasurements = Math.max(
      1,
      ...aopRows.map((row: any) =>
        Array.isArray(row.measuredValues)
          ? row.measuredValues.length
          : [row.ma10 ?? row.ma1, row.ma100 ?? row.ma2, row.ma200 ?? row.ma3].filter((v) => v != null).length
      )
    );
    const stations: string[] =
      Array.isArray(aop.mAStations) && aop.mAStations.length > 0
        ? Array.from({ length: maxMeasurements }, (_, i) => String(aop.mAStations[i] ?? `mA ${i + 1}`))
        : Array.from({ length: maxMeasurements }, (_, i) => `mA ${i + 1}`);
    const headerCols = stations.map((_, i) => `Header ${i + 1}`);
    const measCols = stations.map((_, i) => `Meas ${i + 1}`);

    allData.push(["TEST: ACCURACY OF KVP AT DIFFERENT MA STATIONS"]);
    allData.push(["FFD (cm)", "Tolerance Sign", "Tolerance Value", ...headerCols, "Applied kVp", ...measCols]);
    aopRows.forEach((row: any, idx: number) => {
      const measuredValues = Array.isArray(row.measuredValues)
        ? row.measuredValues
        : [row.ma10 ?? row.ma1, row.ma100 ?? row.ma2, row.ma200 ?? row.ma3];
      allData.push([
        idx === 0 ? (aop.ffd ?? "") : "",
        idx === 0 ? (aop.tolerance?.sign ?? "±") : "",
        idx === 0 ? (aop.tolerance?.value ?? "2.0") : "",
        ...(idx === 0 ? stations : Array(stations.length).fill("")),
        row.appliedKvp ?? row.setKV ?? "",
        ...stations.map((_, i) => measuredValues[i] ?? ""),
      ]);
    });
    addBlank();
  }

  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows?.length > 0) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
    const tolOp = oc.tolerance?.operator || "<=";
    const tolVal = oc.tolerance?.value ?? "0.05";
    const savedHeaders: string[] = Array.isArray(oc.headers) && oc.headers.length > 0
      ? oc.headers.map((h: unknown) => String(h ?? ""))
      : Array.isArray(oc.measurementHeaders) && oc.measurementHeaders.length > 0
        ? oc.measurementHeaders.map((h: unknown) => String(h ?? ""))
        : (() => {
            const rows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
            const colCount = Math.max(0, ...rows.map((r: any) => (r.outputs ?? []).length));
            return Array.from({ length: colCount || 3 }, (_, i: number) => `Meas ${i + 1}`);
          })();
    const headerCols = savedHeaders.map((_, i) => `Header ${i + 1}`);
    const measCols = savedHeaders.map((_, i) => `Meas ${i + 1}`);
    allData.push(["TEST: OUTPUT CONSISTENCY"]);
    allData.push(["FFD (cm)", "Tolerance Operator", "Tolerance Sign", "Tol Value", ...headerCols, "kV", "mAs", ...measCols]);
    oc.outputRows.forEach((r: any, idx: number) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      allData.push([
        idx === 0 ? ffdVal : "",
        idx === 0 ? tolOp : "",
        idx === 0 ? tolOp : "",
        idx === 0 ? tolVal : "",
        ...(idx === 0 ? savedHeaders : Array(savedHeaders.length).fill("")),
        r.kv ?? r.kvp ?? "",
        r.mas ?? "",
        ...savedHeaders.map((_, i) => outs[i] ?? ""),
      ]);
    });
    addBlank();
  }

  const hcs = unwrap(data.highContrastSensitivity);
  if (hcs?.measurements?.length > 0 || hcs?.readings?.length > 0) {
    const rows = (hcs.measurements || hcs.readings || []).map((r: any) => [r.measuredLpPerMm ?? r.detail ?? "", r.recommendedStandard ?? "", r.smallestHoleSize ?? ""]);
    addSection("HIGH CONTRAST SENSITIVITY", ["Measured lp/mm", "Recommended", "Smallest Hole"], rows);
  }

  const lcs = unwrap(data.lowContrastSensitivity);
  if (lcs?.testRows?.length > 0 || lcs?.readings?.length > 0) {
    const rows = (lcs.testRows || lcs.readings || []).map((r: any) => [r.testName ?? r.detail ?? "", r.result ?? r.value ?? ""]);
    addSection("LOW CONTRAST SENSITIVITY", ["Test", "Result"], rows);
  }

  const lot = unwrap(data.linearityOfTime);
  if (lot?.measurementRows?.length > 0 || lot?.table2?.length > 0) {
    const tc = lot.testConditions || lot.table1 || {};
    const rows = lot.measurementRows || lot.table2 || [];
    const maxMeasurements = Math.max(
      1,
      ...rows.map((r: any) => (r.radiationOutputs || r.measuredOutputs || []).length)
    );
    const savedHeaders = lot.measHeaders || lot.headers || [];
    const headers = Array.from(
      { length: Math.max(maxMeasurements, savedHeaders.length, 1) },
      (_, i) => String(savedHeaders[i] ?? `Meas ${i + 1}`)
    );
    const headerCols = headers.map((_, i) => `Header ${i + 1}`);
    const measCols = headers.map((_, i) => `Meas ${i + 1}`);
    allData.push(["TEST: LINEARITY OF TIME"]);
    allData.push(["FDD (cm)", "kV", "Time (sec)", "Tolerance Operator", "Tolerance Value", ...headerCols, "mA Applied", ...measCols]);
    rows.forEach((r: any, idx: number) => {
      const outs = r.radiationOutputs || r.measuredOutputs || [];
      allData.push([
        idx === 0 ? (tc.fdd ?? tc.fcd ?? "") : "",
        idx === 0 ? (tc.kv ?? "") : "",
        idx === 0 ? (tc.time ?? "") : "",
        idx === 0 ? (lot.toleranceOperator ?? "<=") : "",
        idx === 0 ? (lot.tolerance ?? "0.1") : "",
        ...(idx === 0 ? headers : Array(headers.length).fill("")),
        r.maApplied ?? r.ma ?? "",
        ...headers.map((_, i) => outs[i] ?? ""),
      ]);
    });
    addBlank();
  }

  const lmas = unwrap(data.linearityOfMasLoadingStations);
  if (lmas?.table2?.length > 0) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    allData.push(["========== LINEARITY OF mAs LOADING STATIONS =========="]);
    allData.push(["Field Name", "Value"]);
    allData.push(["Table1_FCD", t1.fcd ?? ""]);
    allData.push(["Table1_kV", t1.kv ?? ""]);
    const headers = lmas.measHeaders || ["Meas 1", "Meas 2", "Meas 3"];
    headers.forEach((h: string) => allData.push(["MeasHeader", h]));
    lmas.table2.forEach((r: any) => {
      const outs = (r.measuredOutputs || r.outputs || []).map((v: any) =>
        v != null && typeof v === "object" && "value" in v ? v.value : v
      );
      allData.push(["Table2_mAsApplied", r.mAsApplied ?? r.mAsRange ?? ""]);
      outs.forEach((val: any, idx: number) => allData.push([`Table2_Meas${idx + 1}`, val ?? ""]));
    });
    allData.push(["Tolerance", lmas.tolerance ?? "0.1"]);
    allData.push(["ToleranceOperator", lmas.toleranceOperator ?? "<="]);
    addBlank();
  }

  const rll = unwrap(data.tubeHousingLeakage);
  if (rll?.leakageMeasurements?.length > 0) {
    const s = rll.settings || rll.testConditions || {};
    allData.push(["TEST: TUBE HOUSING LEAKAGE"]);
    allData.push(["FFD", s.fcd ?? s.ffd ?? "", "kVp", s.kv ?? "", "mA", s.ma ?? "", "Time", s.time ?? ""]);
    allData.push(["Location", "Left", "Right", "Top", "Up", "Down"]);
    rll.leakageMeasurements.forEach((l: any) => allData.push([l.location ?? "", l.left ?? "", l.right ?? "", l.top ?? "", l.up ?? "", l.down ?? ""]));
    addBlank();
  }

  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    allData.push(["TEST: RADIATION PROTECTION SURVEY"]);
    allData.push(["Survey Date", rps.surveyDate ?? "", "Applied Current (mA)", rps.appliedCurrent ?? "", "Applied Voltage (kV)", rps.appliedVoltage ?? "", "Exposure Time (s)", rps.exposureTime ?? ""]);
    if (Array.isArray(rps.locations) && rps.locations.length > 0) {
      allData.push(["Location", "Max. Radiation Level (mR/hr)", "Result"]);
      rps.locations.forEach((l: any) => allData.push([l.location ?? "", l.mRPerHr ?? "", l.category ?? ""]));
    }
    addBlank();
  }

  const align = unwrap(data.alignmentTest);
  if (align && (align.measurements?.length > 0 || align.readings?.length > 0)) {
    const rows = (align.measurements || align.readings || []).map((r: any) => [r.parameter ?? r.detail ?? "", r.value ?? r.result ?? ""]);
    addSection("ALIGNMENT TEST", ["Parameter", "Value"], rows);
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "OBI");
  return wb;
};
