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
  if (efs?.table2?.length > 0) {
    const rows = efs.table2.map((r: any) => [r.focusType ?? "", r.measuredLpPerMm ?? "", r.recommendedStandard ?? "", r.smallestHoleSize ?? ""]);
    addSection("EFFECTIVE FOCAL SPOT", ["Focus Type", "Measured lp/mm", "Recommended", "Smallest Hole"], rows);
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
  if (aop?.table2?.length > 0) {
    const rows = aop.table2.map((row: any) => [row.setKV ?? "", row.ma10 ?? row.ma1 ?? "", row.ma100 ?? row.ma2 ?? "", row.ma200 ?? row.ma3 ?? ""]);
    addSection("ACCURACY OF OPERATING POTENTIAL", ["Applied kVp", "mA 1 kVp", "mA 2 kVp", "mA 3 kVp"], rows);
  }

  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows?.length > 0) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
    allData.push(["TEST: OUTPUT CONSISTENCY"]);
    allData.push(["FFD", ffdVal]);
    const maxOut = Math.max(...oc.outputRows.map((r: any) => (r.outputs || []).length));
    allData.push(["kVp", "mAs", ...Array.from({ length: maxOut }, (_, i) => `Reading ${i + 1}`), "Mean", "CoV"]);
    oc.outputRows.forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      allData.push([r.kv ?? r.kvp ?? "", r.mas ?? "", ...outs, r.mean ?? "", r.cov ?? ""]);
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
  if (lot?.table2?.length > 0) {
    const t1 = lot.table1 || {};
    allData.push(["TEST: LINEARITY OF TIME"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? "", "Time", t1.time ?? ""]);
    allData.push(["mA Station", "Measured 1", "Measured 2", "Measured 3"]);
    lot.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.ma ?? r.mAApplied ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
    addBlank();
  }

  const lmas = unwrap(data.linearityOfMasLoadingStations);
  if (lmas?.table2?.length > 0) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
    allData.push(["TEST: LINEARITY OF mAs LOADING STATIONS"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push(["mAs Range", "Measured 1", "Measured 2", "Measured 3"]);
    lmas.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || r.outputs || [];
      allData.push([r.mAsRange ?? r.mAsApplied ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
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
