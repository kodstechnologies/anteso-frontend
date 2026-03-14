import * as XLSX from "xlsx";

export interface RadiographyMobileHTExportData {
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

export const createRadiographyMobileHTUploadableExcel = (
  data: RadiographyMobileHTExportData
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

  // 1. Congruence of Radiation
  const cong = unwrap(data.congruence);
  if (cong?.techniqueFactors?.length || cong?.congruenceMeasurements?.length) {
    const tech = Array.isArray(cong.techniqueFactors) ? cong.techniqueFactors[0] || {} : {};
    const meas = Array.isArray(cong.congruenceMeasurements) ? cong.congruenceMeasurements : [];
    allData.push(["TEST: CONGRUENCE OF RADIATION"]);
    allData.push(["FCD", tech.fcd ?? "", "kV", tech.kv ?? "", "mAs", tech.mas ?? ""]);
    allData.push(["Dimension", "Observed Shift", "Edge Shift", "% FED", "Tolerance", "Remark"]);
    meas.forEach((m: any) => {
      allData.push([
        m.dimension ?? "",
        m.observedShift ?? "",
        m.edgeShift ?? "",
        m.percentFED ?? "",
        m.tolerance ?? "",
        m.remark ?? "",
      ]);
    });
    addBlank();
  }

  // 2. Central Beam Alignment
  const cba = unwrap(data.centralBeamAlignment);
  if (cba?.techniqueFactors || cba?.observedTilt) {
    const tf = cba.techniqueFactors || {};
    const obs = cba.observedTilt || {};
    allData.push(["TEST: CENTRAL BEAM ALIGNMENT"]);
    allData.push(["FCD", tf.fcd ?? "", "kV", tf.kv ?? "", "mAs", tf.mas ?? ""]);
    allData.push(["Observed Tilt", obs.value ?? "", "Remark", obs.remark ?? ""]);
    addBlank();
  }

  // 3. Effective Focal Spot
  const efs = unwrap(data.effectiveFocalSpot);
  if (efs?.focalSpots?.length) {
    allData.push(["TEST: EFFECTIVE FOCAL SPOT"]);
    allData.push(["FCD", efs.fcd ?? ""]);
    allData.push(["Focus Type", "Stated Width", "Stated Height", "Measured Width", "Measured Height", "Remark"]);
    efs.focalSpots.forEach((s: any) => {
      allData.push([
        s.focusType ?? "",
        s.statedWidth ?? "",
        s.statedHeight ?? "",
        s.measuredWidth ?? "",
        s.measuredHeight ?? "",
        s.remark ?? "",
      ]);
    });
    addBlank();
  }

  // 4. Accuracy of Irradiation Time
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
    const times = Array.isArray(aoi.irradiationTimes) ? aoi.irradiationTimes : [];
    allData.push(["Set Time (mSec)", "Measured Time (mSec)"]);
    times.forEach((t: any) => {
      allData.push([
        t.setTime ?? "",
        t.measuredTime ?? t.measuredTime1 ?? "",
      ]);
    });
    addBlank();
  }

  // 5. Accuracy of Operating Potential & Total Filtration
  const aop = unwrap(data.accuracyOfOperatingPotential);
  if (aop?.measurements?.length) {
    const rows = aop.measurements.map((row: any) => [
      row.appliedKvp ?? "",
      (row.measuredValues && row.measuredValues[0]) ?? "",
      (row.measuredValues && row.measuredValues[1]) ?? "",
      row.averageKvp ?? "",
      row.remarks ?? "",
    ]);
    addSection(
      "ACCURACY OF OPERATING POTENTIAL",
      ["Applied kVp", "Meas 1", "Meas 2", "Average kVp", "Remarks"],
      rows
    );
  }

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

  // 6. Linearity of mA Loading
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma) {
    const t1 = lma.table1 || lma.exposureCondition || {};
    const t2 = Array.isArray(lma.table2) ? lma.table2 : [];
    allData.push(["TEST: LINEARITY OF mA LOADING"]);
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
    addBlank();
  }

  // 7. Linearity of mAs Loading
  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas) {
    const t1 = lmas.table1?.[0] || lmas.table1 || {};
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
        r.mAsRange ?? r.ma ?? "",
        outs[0] ?? "",
        outs[1] ?? "",
        outs[2] ?? "",
      ]);
    });
    addBlank();
  }

  // 8. Output Consistency
  const oc = unwrap(data.outputConsistency);
  if (oc) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? "";
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

  // 9. Radiation Leakage Level
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
    addBlank();
  }

  // 10. Radiation Protection Survey
  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    allData.push(["TEST: RADIATION PROTECTION SURVEY REPORT"]);
    allData.push([
      "Survey Date",
      rps.surveyDate ?? "",
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
      "MAX. RADIATION LEVEL (MR/HR)",
      "RESULT",
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

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "RadiographyMobileHT");
  return wb;
};
