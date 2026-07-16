import * as XLSX from "xlsx";
import { resolveMeasHeaders, getMeasuredOutputs, cellStr } from "../shared/exportMeasHeaders";

export interface MammographySavedExportData {
  reportHeader?: any;
  accuracyOfOperatingPotential?: any;
  accuracyOfIrradiationTime?: any;
  totalFiltration?: any;
  linearityOfMaLoading?: any;
  linearityOfMasLoading?: any;
  reproducibilityOfOutput?: any;
  radiationLeakageLevel?: any;
  imagingPhantom?: any;
  radiationProtectionSurvey?: any;
  equipmentSetting?: any;
  maximumRadiationLevel?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

export const createMammographySavedExcel = (
  data: MammographySavedExportData
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

  // Accuracy of Operating Potential — dynamic mA stations
  const aop = unwrap(data.accuracyOfOperatingPotential);
  const aopMeasurements: any[] =
    Array.isArray(aop?.measurements) && aop.measurements.length > 0
      ? aop.measurements
      : Array.isArray(aop?.table2)
        ? aop.table2.map((row: any) => {
            const fromMeas = Object.keys(row || {})
              .filter((k) => /^meas\d+$/i.test(k))
              .sort(
                (a, b) =>
                  parseInt(a.replace(/\D/g, ""), 10) -
                  parseInt(b.replace(/\D/g, ""), 10)
              )
              .map((k) => row[k]);
            const fallback = [row.ma10, row.ma100, row.ma200, row.ma1, row.ma2, row.ma3].filter(
              (v) => v != null && String(v).trim() !== ""
            );
            return {
              appliedKvp: row.setKV ?? row.appliedKvp ?? "",
              measuredValues:
                Array.isArray(row.measuredValues) && row.measuredValues.length > 0
                  ? row.measuredValues
                  : fromMeas.length > 0
                    ? fromMeas
                    : fallback,
            };
          })
        : [];

  if (aopMeasurements.length > 0) {
    const maxMeas = Math.max(
      0,
      ...aopMeasurements.map((m: any) =>
        Array.isArray(m.measuredValues) ? m.measuredValues.length : 0
      )
    );
    const stations = resolveMeasHeaders(
      aop?.mAStations || aop?.measHeaders,
      maxMeas,
      "mA Station"
    );
    const tol = aop?.tolerance || {};
    allData.push(["TEST: ACCURACY OF OPERATING POTENTIAL (kVp)"]);
    if (tol.sign || tol.value || aop?.kvpToleranceSign || aop?.kvpToleranceValue) {
      allData.push(["Tolerance Sign", tol.sign ?? aop?.kvpToleranceSign ?? "±"]);
      allData.push(["Tolerance Value (kVp)", tol.value ?? aop?.kvpToleranceValue ?? ""]);
    }
    allData.push(["Applied kVp", ...stations]);
    aopMeasurements.forEach((row: any) => {
      const vals = Array.isArray(row.measuredValues) ? row.measuredValues : [];
      allData.push([
        row.appliedKvp ?? row.setKV ?? "",
        ...stations.map((_, i) => cellStr(vals[i])),
      ]);
    });
    addBlank();
  }

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

  const tf = unwrap(data.totalFiltration);
  if (tf?.totalFiltration) {
    const t = tf.totalFiltration;
    addSection("TOTAL FILTRATION & ALUMINIUM EQUIVALENCE", ["Parameter", "Measured", "Required", "At kVp"], [
      ["TotalFiltration", t.measured ?? "", t.required ?? "", t.atKvp ?? ""],
    ]);
  }

  // Linearity of mA — dynamic measHeaders
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma?.table2?.length > 0) {
    const t1 = Array.isArray(lma.table1) ? lma.table1[0] || {} : lma.table1 || {};
    const t2 = Array.isArray(lma.table2) ? lma.table2 : [];
    const maxMeas = Math.max(0, ...t2.map((r: any) => getMeasuredOutputs(r).length));
    const measHeaders = resolveMeasHeaders(
      lma.measHeaders || lma.measurementHeaders,
      maxMeas,
      "Measured"
    );
    allData.push(["TEST: LINEARITY OF mA LOADING"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? "", "Time", t1.time ?? ""]);
    allData.push(["mA Station", ...measHeaders, "Average", "mR/mAs"]);
    t2.forEach((r: any) => {
      const outs = getMeasuredOutputs(r);
      allData.push([
        r.ma ?? r.mAApplied ?? "",
        ...measHeaders.map((_, i) => outs[i] ?? ""),
        r.average ?? "",
        r.x ?? "",
      ]);
    });
    if (lma.tolerance != null || lma.toleranceOperator) {
      allData.push(["Tolerance Operator", lma.toleranceOperator ?? "<="]);
      allData.push(["Tolerance Value (CoL)", lma.tolerance ?? "0.1"]);
    }
    addBlank();
  }

  // Linearity of mAs — dynamic measHeaders
  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2?.length > 0) {
    const t1 = Array.isArray(lmas.table1) ? lmas.table1[0] || {} : lmas.table1 || {};
    const t2 = Array.isArray(lmas.table2) ? lmas.table2 : [];
    const maxMeas = Math.max(0, ...t2.map((r: any) => getMeasuredOutputs(r).length));
    const measHeaders = resolveMeasHeaders(
      lmas.measHeaders || lmas.measurementHeaders,
      maxMeas,
      "Measured"
    );
    allData.push(["TEST: LINEARITY OF mAs LOADING"]);
    allData.push(["FCD", t1.fcd ?? "", "kV", t1.kv ?? ""]);
    allData.push(["mAs Range", ...measHeaders, "Average", "mR/mAs"]);
    t2.forEach((r: any) => {
      const outs = getMeasuredOutputs(r);
      allData.push([
        r.mAsRange ?? r.mAsApplied ?? r.mas ?? "",
        ...measHeaders.map((_, i) => outs[i] ?? ""),
        r.average ?? "",
        r.x ?? "",
      ]);
    });
    if (lmas.tolerance != null || lmas.toleranceOperator) {
      allData.push(["Tolerance Operator", lmas.toleranceOperator ?? "<="]);
      allData.push(["Tolerance Value (CoL)", lmas.tolerance ?? "0.1"]);
    }
    addBlank();
  }

  // Reproducibility — dynamic outputHeaders / measurementHeaders
  const ro = unwrap(data.reproducibilityOfOutput);
  if (ro?.outputRows?.length > 0 || ro?.tolerance != null || ro?.toleranceOperator) {
    const ffdVal = ro.ffd?.value ?? ro.ffd ?? "";
    const tolOp = ro.toleranceOperator ?? ro.tolerance?.operator ?? "<=";
    const tolVal = ro.tolerance?.value ?? (typeof ro.tolerance === "object" ? "" : ro.tolerance) ?? "0.05";
    const rows = Array.isArray(ro.outputRows) ? ro.outputRows : [];
    const maxMeas = Math.max(0, ...rows.map((r: any) => getMeasuredOutputs(r).length));
    const measHeaders = resolveMeasHeaders(
      ro.outputHeaders || ro.measurementHeaders || ro.measHeaders,
      maxMeas,
      "Reading"
    );
    allData.push(["TEST: REPRODUCIBILITY OF RADIATION OUTPUT"]);
    allData.push(["Tolerance Operator", tolOp]);
    allData.push(["Tolerance Value (CoV)", tolVal]);
    if (ffdVal !== "" && ffdVal != null) allData.push(["FFD", ffdVal]);
    allData.push(["kVp", "mAs", ...measHeaders, "Mean", "CoV"]);
    rows.forEach((r: any) => {
      const outs = getMeasuredOutputs(r);
      allData.push([
        r.kv ?? r.kvp ?? "",
        r.mas ?? "",
        ...measHeaders.map((_, i) => outs[i] ?? ""),
        r.mean ?? r.avg ?? "",
        r.cov ?? r.cv ?? "",
      ]);
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

  const ip = unwrap(data.imagingPhantom);
  if (ip && (ip.readings?.length > 0 || ip.measurements?.length > 0 || ip.testRows?.length > 0)) {
    const rows = (ip.testRows || ip.measurements || ip.readings || []).map((r: any) => [
      r.testName ?? r.detail ?? r.parameter ?? "",
      r.result ?? r.value ?? r.measured ?? "",
    ]);
    addSection("IMAGING PERFORMANCE EVALUATION (PHANTOM)", ["Test", "Result"], rows);
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

  const es = unwrap(data.equipmentSetting);
  if (es && Object.keys(es).length > 0) {
    allData.push(["TEST: EQUIPMENT SETTINGS VERIFICATION"]);
    Object.entries(es).forEach(([k, v]) => {
      if (k !== "_id" && v != null) allData.push([k, String(v)]);
    });
    addBlank();
  }

  const mrl = unwrap(data.maximumRadiationLevel);
  if (mrl?.locations?.length > 0 || mrl?.readings?.length > 0) {
    const rows = (mrl.locations || mrl.readings || []).map((r: any) => [
      r.location ?? "",
      r.mRPerHr ?? r.value ?? "",
      r.remarks ?? "",
    ]);
    addSection("MAXIMUM RADIATION LEVELS AT DIFFERENT LOCATIONS", ["Location", "Level (mR/hr)", "Remarks"], rows);
  }

  const ws = XLSX.utils.aoa_to_sheet(allData.length > 0 ? allData : [["No data"]]);
  XLSX.utils.book_append_sheet(wb, ws, "Mammography");
  return wb;
};
