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
    allData.push(["FCD", tc.fcd ?? "", "kV", tc.kv ?? "", "mA", tc.ma ?? ""]);
    allData.push(["Set Time (mSec)", "Measured Time (mSec)"]);
    aoi.irradiationTimes.forEach((t: any) =>
      allData.push([t.setTime ?? "", t.measuredTime ?? t.measuredTime1 ?? ""])
    );
    addBlank();
  }

  const cba = unwrap(data.centralBeamAlignment);
  if (cba?.measurements?.length > 0) {
    const rows = cba.measurements.map((m: any) => [m.observedTilt ?? "", m.tolerance ?? ""]);
    addSection("CENTRAL BEAM ALIGNMENT", ["Observed Tilt", "Tolerance"], rows);
  }

  const efs = unwrap(data.effectiveFocalSpot);
  if (efs?.table2?.length > 0) {
    const rows = efs.table2.map((r: any) => [
      r.focusType ?? "",
      r.measuredLpPerMm ?? "",
      r.recommendedStandard ?? "",
      r.smallestHoleSize ?? "",
    ]);
    addSection("EFFECTIVE FOCAL SPOT", ["Focus Type", "Measured lp/mm", "Recommended", "Smallest Hole"], rows);
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
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["FFD", ffdVal]);
    const maxOut = Math.max(...oc.outputRows.map((r: any) => (r.outputs || []).length));
    allData.push(["kVp", "mAs", ...Array.from({ length: maxOut }, (_, i) => `Reading ${i + 1}`), "Mean", "CoV"]);
    oc.outputRows.forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      allData.push([r.kv ?? r.kvp ?? "", r.mas ?? "", ...outs, r.mean ?? "", r.cov ?? ""]);
    });
    addBlank();
  }

  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2?.length > 0) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    allData.push(["TEST: LINEARITY OF mAs LOADING"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push(["mAs Range", "Measured 1", "Measured 2", "Measured 3"]);
    lmas.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || r.outputs || [];
      allData.push([r.mAsRange ?? r.mAsApplied ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
    addBlank();
  }

  const lcr = unwrap(data.lowContrastResolution);
  if (lcr?.testRows?.length > 0 || lcr?.readings?.length > 0) {
    const rows = (lcr.testRows || lcr.readings || []).map((r: any) => [r.testName ?? r.detail ?? "", r.result ?? r.value ?? ""]);
    addSection("LOW CONTRAST RESOLUTION", ["Test", "Result"], rows);
  }

  const hcr = unwrap(data.highContrastResolution);
  if (hcr?.measurements?.length > 0 || hcr?.readings?.length > 0) {
    const rows = (hcr.measurements || hcr.readings || []).map((r: any) => [
      r.measuredLpPerMm ?? r.detail ?? "",
      r.recommendedStandard ?? "",
      r.smallestHoleSize ?? "",
    ]);
    addSection("HIGH CONTRAST RESOLUTION", ["Measured lp/mm", "Recommended", "Smallest Hole"], rows);
  }

  const ert = unwrap(data.exposureRateTableTop);
  if (ert?.exposureRateRows?.length > 0) {
    const rows = ert.exposureRateRows.map((r: any) => [r.distance ?? "", r.rate ?? r.exposureRate ?? "", r.remarks ?? ""]);
    addSection("EXPOSURE RATE AT TABLE TOP", ["Distance", "Exposure Rate", "Remarks"], rows);
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
      rps.locations.forEach((l: any) => allData.push([l.location ?? "", l.mRPerHr ?? "", l.category ?? ""]));
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "InventionalRadiology");
  return wb;
};
