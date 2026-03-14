import * as XLSX from "xlsx";

export interface RadiographyMobileExportData {
  reportHeader?: any;
  accuracyOfOperatingPotential?: any;
  accuracyOfIrradiationTime?: any;
  centralBeamAlignment?: any;
  congruence?: any;
  effectiveFocalSpot?: any;
  linearityOfMasLoading?: any;
  outputConsistency?: any;
  radiationLeakageLevel?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

export const createRadiographyMobileUploadableExcel = (
  data: RadiographyMobileExportData
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

  // 1. Accuracy of Operating Potential (same as RadiographyFixed)
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

  // 3. Central Beam Alignment
  const cba = unwrap(data.centralBeamAlignment);
  if (cba && (cba.readings?.length || cba.measurements?.length)) {
    const rows = (cba.readings || cba.measurements || []).map((r: any) => [
      r.distance ?? r.appliedDistance ?? "",
      r.measured ?? r.measuredValue ?? "",
      r.remark ?? r.remarks ?? "",
    ]);
    addSection(
      "CENTRAL BEAM ALIGNMENT",
      ["Distance (cm)", "Measured (mm)", "Remarks"],
      rows
    );
  }

  // 4. Congruence
  const cong = unwrap(data.congruence);
  if (cong && (cong.readings?.length || cong.measurements?.length)) {
    const rows = (cong.readings || cong.measurements || []).map((r: any) => [
      r.opticalField ?? r.optical ?? "",
      r.radiationField ?? r.radiation ?? "",
      r.remark ?? r.remarks ?? "",
    ]);
    addSection(
      "CONGRUENCE OF RADIATION & OPTICAL FIELD",
      ["Optical Field (cm)", "Radiation Field (cm)", "Remarks"],
      rows
    );
  }

  // 5. Effective Focal Spot
  const efs = unwrap(data.effectiveFocalSpot);
  if (efs && (efs.measurements?.length || efs.readings?.length)) {
    const rows = (efs.measurements || efs.readings || []).map((r: any) => [
      r.appliedKvp ?? r.kvp ?? "",
      r.measured ?? r.measuredValue ?? "",
      r.remark ?? r.remarks ?? "",
    ]);
    addSection(
      "EFFECTIVE FOCAL SPOT MEASUREMENT",
      ["Applied kVp", "Measured (mm)", "Remarks"],
      rows
    );
  }

  // 6. Linearity of mAs Loading
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
        r.mAsRange ?? r.mAsApplied ?? r.ma ?? "",
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

  // 7. Consistency of Radiation Output
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

  // 8. Radiation Leakage Level
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
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "RadiographyMobile");
  return wb;
};
