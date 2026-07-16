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

const cellStr = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "object" && "value" in v) return String((v as any).value ?? "");
  return String(v);
};

/** Resolve dynamic measurement column labels from saved headers + data length. */
const resolveMeasHeaders = (
  saved: any,
  maxFromRows: number,
  fallbackPrefix = "Meas"
): string[] => {
  const raw = Array.isArray(saved)
    ? saved.map((h: any) => String(h ?? "").trim()).filter(Boolean)
    : [];
  const count = Math.max(maxFromRows, raw.length, 1);
  return Array.from({ length: count }, (_, i) => raw[i] || `${fallbackPrefix} ${i + 1}`);
};

const headerLabelCols = (count: number) =>
  Array.from({ length: count }, (_, i) => `Header ${i + 1}`);

const measCols = (count: number) =>
  Array.from({ length: count }, (_, i) => `Meas ${i + 1}`);

export const createBMDSavedExcel = (data: BMDSavedExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  const addBlank = () => allData.push([]);

  // 1. Accuracy of Irradiation Time
  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi?.irradiationTimes?.length > 0) {
    const tc = aoi.testConditions || {};
    const tol = aoi.tolerance || {};
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    allData.push([
      "FDD (cm)",
      "kV",
      "mA",
      "Set Time (sec)",
      "Measured Time (sec)",
      "",
      "Tol Operator",
      "Tol Value",
    ]);
    aoi.irradiationTimes.forEach((t: any, idx: number) => {
      if (idx === 0) {
        allData.push([
          tc.fcd ?? "",
          tc.kv ?? "",
          tc.ma ?? "",
          t.setTime ?? "",
          t.measuredTime ?? t.measuredTime1 ?? "",
          "",
          tol.operator ?? "<=",
          tol.value ?? "",
        ]);
      } else {
        allData.push([
          "",
          "",
          "",
          t.setTime ?? "",
          t.measuredTime ?? t.measuredTime1 ?? "",
        ]);
      }
    });
    addBlank();
  }

  // 2. Accuracy of Operating Potential (dynamic mA station headers + meas columns)
  const aop =
    unwrap(data.accuracyOfOperatingPotentialAndTime) ||
    unwrap(data.accuracyOfOperatingPotential);
  const tfForOp = unwrap(data.totalFiltration);

  // Prefer totalFiltration.measurements (page export) when present — has full dynamic columns
  const opMeasurements: any[] =
    Array.isArray(tfForOp?.measurements) && tfForOp.measurements.length > 0
      ? tfForOp.measurements
      : Array.isArray(aop?.measurements) && aop.measurements.length > 0
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

  if (opMeasurements.length > 0) {
    const maxMeas = Math.max(
      0,
      ...opMeasurements.map((m: any) =>
        Array.isArray(m.measuredValues) ? m.measuredValues.length : 0
      )
    );
    const stations = resolveMeasHeaders(
      aop?.mAStations || tfForOp?.mAStations || aop?.measHeaders || aop?.measurementHeaders,
      maxMeas,
      "mA Station"
    );
    const tol = aop?.tolerance || tfForOp?.tolerance || {};
    const tolSign = tol.sign ?? aop?.kvpToleranceSign ?? "±";
    const tolValue = tol.value ?? aop?.kvpToleranceValue ?? "";

    allData.push(["TEST: ACCURACY OF OPERATING POTENTIAL (KVP)"]);
    allData.push([
      "Tolerance Sign",
      "Tolerance Value",
      ...headerLabelCols(stations.length),
      "Applied kVp",
      ...measCols(stations.length),
    ]);
    opMeasurements.forEach((m: any, idx: number) => {
      const vals = Array.from({ length: stations.length }, (_, i) =>
        cellStr(m.measuredValues?.[i])
      );
      if (idx === 0) {
        allData.push([
          tolSign,
          tolValue,
          ...stations,
          m.appliedKvp ?? m.setKV ?? "",
          ...vals,
        ]);
      } else {
        allData.push([
          "",
          "",
          ...Array(stations.length).fill(""),
          m.appliedKvp ?? m.setKV ?? "",
          ...vals,
        ]);
      }
    });
    addBlank();
  }

  // 3. Total Filtration summary
  const tf = unwrap(data.totalFiltration);
  const tfSummary = tf?.totalFiltration || aop?.totalFiltration;
  if (tfSummary && (tfSummary.measured || tfSummary.required || tfSummary.atKvp)) {
    allData.push(["TEST: TOTAL FILTRATION"]);
    allData.push(["Measured (mm Al)", "Required (mm Al)", "At kVp"]);
    allData.push([
      tfSummary.measured ?? "",
      tfSummary.required ?? "",
      tfSummary.atKvp ?? "",
    ]);
    addBlank();
  }

  // 4. Linearity of mA Loading — dynamic Header N + Meas N
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma?.table2?.length > 0) {
    const t1 = Array.isArray(lma.table1) ? lma.table1[0] || {} : lma.table1 || {};
    const t2 = Array.isArray(lma.table2) ? lma.table2 : [];
    const maxMeas = Math.max(
      0,
      ...t2.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
    );
    const headers = resolveMeasHeaders(lma.measHeaders || lma.measurementHeaders, maxMeas, "Meas");

    allData.push(["TEST: LINEARITY OF MA LOADING"]);
    allData.push([
      "FDD (cm)",
      "kV",
      "Time (sec)",
      "Tol Operator",
      "Tol Value",
      "",
      ...headerLabelCols(headers.length),
      "mA",
      ...measCols(headers.length),
    ]);
    t2.forEach((r: any, idx: number) => {
      const outs = Array.isArray(r.measuredOutputs) ? r.measuredOutputs : [];
      const measVals = headers.map((_, i) => cellStr(outs[i]));
      if (idx === 0) {
        allData.push([
          t1.fcd ?? "",
          t1.kv ?? "",
          t1.time ?? "",
          lma.toleranceOperator ?? "<=",
          lma.tolerance ?? "0.1",
          "",
          ...headers,
          r.ma ?? r.mAApplied ?? "",
          ...measVals,
        ]);
      } else {
        allData.push([
          "",
          "",
          "",
          "",
          "",
          "",
          ...Array(headers.length).fill(""),
          r.ma ?? r.mAApplied ?? "",
          ...measVals,
        ]);
      }
    });
    addBlank();
  }

  // 5. Reproducibility of Radiation Output — dynamic Header N + Meas N
  const ro = unwrap(data.reproducibilityOfRadiationOutput);
  if (ro?.outputRows?.length > 0) {
    const ffdVal = ro.ffd?.value ?? ro.fcd?.value ?? ro.ffd ?? ro.fcd ?? "";
    const rows = Array.isArray(ro.outputRows) ? ro.outputRows : [];
    const maxMeas = Math.max(
      0,
      ...rows.map((r: any) => (Array.isArray(r.outputs) ? r.outputs.length : 0))
    );
    const headers = resolveMeasHeaders(
      ro.measurementHeaders || ro.measHeaders || ro.outputHeaders,
      maxMeas,
      "Meas"
    );
    const tol = ro.tolerance || {};
    const tolOp = tol.operator ?? ro.toleranceOperator ?? "<=";
    const tolVal = tol.value ?? ro.toleranceValue ?? "";

    allData.push(["TEST: REPRODUCIBILITY OF RADIATION OUTPUT"]);
    allData.push([
      "FDD (cm)",
      "Tol Operator",
      "Tol Value",
      ...headerLabelCols(headers.length),
      "",
      "kV",
      "mAs",
      ...measCols(headers.length),
    ]);
    rows.forEach((r: any, idx: number) => {
      const outs = (r.outputs || []).map((o: any) => (o?.value !== undefined ? o.value : o));
      const measVals = headers.map((_, i) => cellStr(outs[i]));
      if (idx === 0) {
        allData.push([
          ffdVal,
          tolOp,
          tolVal,
          ...headers,
          "",
          r.kv ?? r.kvp ?? "",
          r.mas ?? "",
          ...measVals,
        ]);
      } else {
        allData.push([
          "",
          "",
          "",
          ...Array(headers.length).fill(""),
          "",
          r.kv ?? r.kvp ?? "",
          r.mas ?? "",
          ...measVals,
        ]);
      }
    });
    addBlank();
  }

  // 6. Radiation Leakage Level
  const rll = unwrap(data.radiationLeakageLevel);
  if (rll?.leakageMeasurements?.length > 0) {
    const s = rll.settings || rll.measurementSettings || rll.testConditions || {};
    const workload =
      typeof rll.workload === "object" ? rll.workload?.value ?? "" : rll.workload ?? "";
    const tolVal = rll.toleranceValue ?? rll.tolerance?.value ?? "1";
    const tolOp = rll.toleranceOperator ?? rll.tolerance?.operator ?? "<=";
    const dirHeaders =
      Array.isArray(rll.leakageHeaders) && rll.leakageHeaders.length > 0
        ? rll.leakageHeaders.map((h: any) => String(h ?? "").trim()).filter(Boolean)
        : ["Front", "Back", "Left", "Right", "Top"];

    const dirValueFor = (l: any, header: string) => {
      const key = String(header || "").trim().toLowerCase();
      if (key === "front" || key === "foot") return cellStr(l.front ?? l.foot);
      if (key === "back" || key === "head" || key === "up") return cellStr(l.back ?? l.up ?? l.head);
      if (key === "left") return cellStr(l.left);
      if (key === "right") return cellStr(l.right);
      if (key === "top" || key === "down") return cellStr(l.top ?? l.down);
      // Fallback by position for custom labels
      return "";
    };

    allData.push(["TEST: RADIATION LEAKAGE LEVEL AT 1M FROM TUBE HOUSING"]);
    allData.push([
      "FDD (cm)",
      "kV",
      "mA",
      "Time (sec)",
      "Workload (mA·min/week)",
      "",
      "Tol Value",
      "Tol Operator",
      "Location",
      "",
      ...dirHeaders,
    ]);
    rll.leakageMeasurements.forEach((l: any, idx: number) => {
      const dirVals = dirHeaders.map((h: string, i: number) => {
        const byName = dirValueFor(l, h);
        if (byName) return byName;
        // If custom header names, fall back to standard field order
        const fallbacks = [l.front, l.back, l.left, l.right, l.top];
        return cellStr(fallbacks[i]);
      });

      if (idx === 0) {
        allData.push([
          s.fcd ?? s.ffd ?? s.distance ?? "",
          s.kv ?? "",
          s.ma ?? "",
          s.time ?? "",
          workload,
          "",
          tolVal,
          tolOp,
          l.location ?? "",
          "",
          ...dirVals,
        ]);
      } else {
        allData.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          l.location ?? "",
          "",
          ...dirVals,
        ]);
      }
    });
    addBlank();
  }

  // 7. Radiation Protection Survey
  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    allData.push(["TEST: RADIATION PROTECTION SURVEY"]);
    allData.push([
      "Applied Current (mA)",
      "Applied Voltage (kV)",
      "Exposure Time (s)",
      "Workload (mA min/week)",
    ]);
    allData.push([
      rps.appliedCurrent ?? "",
      rps.appliedVoltage ?? "",
      rps.exposureTime ?? "",
      rps.workload ?? "",
    ]);
    addBlank();
    if (Array.isArray(rps.locations) && rps.locations.length > 0) {
      allData.push(["LOCATION", "MAX. RADIATION LEVEL (MR/HR)", "CATEGORY"]);
      rps.locations.forEach((l: any) =>
        allData.push([l.location ?? "", l.mRPerHr ?? "", l.category ?? ""])
      );
      addBlank();
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(allData.length > 0 ? allData : [["No data"]]);
  XLSX.utils.book_append_sheet(wb, ws, "BMD");
  return wb;
};
