import * as XLSX from "xlsx";

export interface BMDSavedExportData {
  reportHeader?: any;
  accuracyOfIrradiationTime?: any;
  accuracyOfOperatingPotentialAndTime?: any;
  totalFiltration?: any;
  linearityOfMaLoading?: any;
  reproducibilityOfRadiationOutput?: any;
  radiationLeakageLevel?: any;
  radiationProtectionSurvey?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

export const createBMDSavedExcel = (data: BMDSavedExportData): XLSX.WorkBook => {
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

  const aop = unwrap(data.accuracyOfOperatingPotentialAndTime);
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
    addSection("TOTAL FILTRATION", ["Parameter", "Measured", "Required", "At kVp"], [
      ["TotalFiltration", t.measured ?? "", t.required ?? "", t.atKvp ?? ""],
    ]);
  }

  const lma = unwrap(data.linearityOfMaLoading);
  if (lma?.table2?.length > 0) {
    const t1 = lma.table1 || {};
    allData.push(["TEST: LINEARITY OF mA LOADING"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? "", "Time", t1.time ?? ""]);
    allData.push(["mA Station", "Measured 1", "Measured 2", "Measured 3", "Average", "mR/mAs"]);
    lma.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.ma ?? r.mAApplied ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? "", r.average ?? "", r.x ?? ""]);
    });
    addBlank();
  }

  const ro = unwrap(data.reproducibilityOfRadiationOutput);
  if (ro?.outputRows?.length > 0) {
    const ffdVal = ro.ffd?.value ?? ro.ffd ?? "";
    allData.push(["TEST: REPRODUCIBILITY OF RADIATION OUTPUT"]);
    allData.push(["FFD", ffdVal]);
    allData.push(["kVp", "mAs", "Reading 1", "Reading 2", "Reading 3", "Mean", "CoV"]);
    ro.outputRows.forEach((r: any) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      allData.push([r.kv ?? r.kvp ?? "", r.mas ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? "", r.mean ?? "", r.cov ?? ""]);
    });
    addBlank();
  }

  const rll = unwrap(data.radiationLeakageLevel);
  if (rll?.leakageMeasurements?.length > 0) {
    const s = rll.settings || rll.testConditions || {};
    allData.push(["TEST: RADIATION LEAKAGE LEVEL"]);
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
    addBlank();
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "BMD");
  return wb;
};
