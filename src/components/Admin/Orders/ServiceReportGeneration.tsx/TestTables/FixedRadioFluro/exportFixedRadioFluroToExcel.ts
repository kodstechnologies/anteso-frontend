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
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push(["mAs Range", "Measured mR 1", "Measured mR 2", "Measured mR 3"]);
    lmas.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.mAsRange ?? r.mAsApplied ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
    addBlank();
  }

  // 8. Output Consistency
  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows && Array.isArray(oc.outputRows) && oc.outputRows.length > 0) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
    allData.push(["TEST: OUTPUT CONSISTENCY"]);
    allData.push(["FFD", ffdVal]);
    const maxOut = Math.max(...oc.outputRows.map((r: any) => (r.outputs || []).length));
    const outHeaders = Array.from({ length: maxOut }, (_, i) => `Reading ${i + 1}`);
    allData.push(["kVp", "mAs", ...outHeaders, "Mean", "CoV", "Remarks"]);
    oc.outputRows.forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      allData.push([r.kv ?? r.kvp ?? "", r.mas ?? "", ...outs, r.mean ?? "", r.cov ?? "", r.remarks ?? ""]);
    });
    addBlank();
  }

  // 9. Low Contrast Resolution
  const lcr = unwrap(data.lowContrastResolution);
  if (lcr && (lcr.readings?.length > 0 || lcr.testRows?.length > 0)) {
    const rows = (lcr.testRows || lcr.readings || []).map((r: any) => [
      r.testName ?? r.detail ?? "",
      r.result ?? r.value ?? "",
    ]);
    addSection("LOW CONTRAST RESOLUTION", ["Test", "Result"], rows);
  }

  // 10. High Contrast Resolution
  const hcr = unwrap(data.highContrastResolution);
  if (hcr && (hcr.readings?.length > 0 || hcr.measurements?.length > 0)) {
    const rows = (hcr.measurements || hcr.readings || []).map((r: any) => [
      r.measuredLpPerMm ?? r.detail ?? "",
      r.recommendedStandard ?? "",
      r.smallestHoleSize ?? "",
    ]);
    addSection("HIGH CONTRAST RESOLUTION", ["Measured lp/mm", "Recommended", "Smallest Hole"], rows);
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
