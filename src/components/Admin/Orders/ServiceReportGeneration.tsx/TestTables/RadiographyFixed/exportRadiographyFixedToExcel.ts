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

  // 7. Radiation Leakage Level
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

  // 8. Radiation Protection Survey
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
  XLSX.utils.book_append_sheet(wb, ws, "RadiographyFixed");
  return wb;
};

