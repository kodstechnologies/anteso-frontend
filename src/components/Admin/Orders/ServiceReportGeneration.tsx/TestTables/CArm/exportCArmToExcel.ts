import * as XLSX from "xlsx";

export interface CArmExportData {
  reportHeader?: any;
  accuracyOfIrradiationTime?: any;
  totalFiltration?: any;
  outputConsistency?: any;
  lowContrastResolution?: any;
  highContrastResolution?: any;
  exposureRateAtTableTop?: any;
  tubeHousingLeakage?: any;
  linearityOfMaLoading?: any;
  linearityOfMasLoading?: any;
  [key: string]: any;
}

const unwrap = (raw: any) => (raw && raw.data ? raw.data : raw);

const addSection = (allData: any[][], title: string, headers: string[], rows: any[][]) => {
  allData.push([`TEST: ${title}`]);
  if (headers.length) allData.push(headers);
  rows.forEach((r) => allData.push(Array.isArray(r) ? r : [r]));
  allData.push([]);
};

export const createCArmUploadableExcel = (data: CArmExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  // Report header summary
  const header = data.reportHeader?.data || data.reportHeader;
  if (header) {
    allData.push(["REPORT HEADER"]);
    allData.push(["Customer", header.customerName ?? ""]);
    allData.push(["Address", header.address ?? ""]);
    allData.push(["SRF Number", header.srfNumber ?? ""]);
    allData.push(["Test Report Number", header.testReportNumber ?? ""]);
    allData.push([]);
  }

  const aoi = unwrap(data.accuracyOfIrradiationTime);
  if (aoi?.testConditions || aoi?.irradiationTimes?.length) {
    const tc = aoi.testConditions || {};
    const times = Array.isArray(aoi.irradiationTimes) ? aoi.irradiationTimes : [];
    allData.push(["TEST: ACCURACY OF IRRADIATION TIME"]);
    allData.push(["FDD (cm)", tc.fcd ?? "", "kV", tc.kv ?? "", "mA", tc.ma ?? ""]);
    allData.push(["Set Time (sec)", "Measured Time (sec)"]);
    times.forEach((t: any) => allData.push([t.setTime ?? "", t.measuredTime ?? t.measuredTime1 ?? ""]));
    allData.push([]);
  }

  const tf = unwrap(data.totalFiltration);
  if (tf?.measurements?.length || tf?.mAStations?.length) {
    const stations = tf.mAStations || ["50 mA", "100 mA"];
    const tol = tf.tolerance || {};
    const tFil = tf.totalFiltration || {};
    const headerRow = [
      "Tolerance Sign",
      "Tolerance Value",
      "TF Measured",
      "TF Required",
      ...stations.map((_: string, i: number) => `Header ${i + 1}`),
      "Applied kVp",
      ...stations.map((_: string, i: number) => `Meas ${i + 1}`),
    ];
    const measurements = tf.measurements || [];
    const dataRows = measurements.map((m: any, idx: number) => {
      const outs = m.measuredValues || [];
      const base = idx === 0
        ? [tol.sign ?? "±", tol.value ?? "2.0", tFil.measured ?? "", tFil.required ?? "", ...stations]
        : Array(4 + stations.length).fill("");
      return [...base, m.appliedKvp ?? "", ...stations.map((_: string, i: number) => outs[i] ?? "")];
    });
    if (dataRows.length === 0) {
      dataRows.push(["±", "2.0", tFil.measured ?? "", tFil.required ?? "", ...stations, "", ...stations.map(() => "")]);
    }
    addSection(allData, "TOTAL FILTRATION", headerRow, dataRows);
  }

  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows?.length || oc?.parameters || oc?.ffd) {
    const p = oc.parameters || oc.ffd || {};
    const ffd = typeof p === "object" ? (p.ffd ?? p.value ?? "100") : String(p ?? "100");
    const time = oc.parameters?.time ?? oc.time ?? "100";
    const tol = oc.tolerance ?? oc.outputTolerance ?? "0.02";
    const measHeaders = oc.measurementHeaders || oc.measHeaders || oc.headers || ["Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"];
    const headerRow = [
      "FDD (cm)",
      "Time (s)",
      "Tolerance",
      ...measHeaders.map((_: string, i: number) => `Header ${i + 1}`),
      "kVp",
      "mA",
      ...measHeaders.map((_: string, i: number) => `Meas ${i + 1}`),
    ];
    const outputRows = oc.outputRows || [];
    const dataRows = outputRows.map((r: any, idx: number) => {
      const outs = (r.outputs || []).map((o: any) => (typeof o === "object" ? o.value : o) ?? "");
      const base = idx === 0 ? [ffd, time, tol, ...measHeaders] : Array(3 + measHeaders.length).fill("");
      return [...base, r.kvp ?? r.kv ?? "", r.ma ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")];
    });
    addSection(allData, "CONSISTENCY OF RADIATION OUTPUT", headerRow, dataRows);
  }

  const lcr = unwrap(data.lowContrastResolution);
  if (lcr?.readings?.length || lcr?.measurements?.length) {
    const rows = (lcr.readings || lcr.measurements || []).map((r: any) => [r.diameter ?? r.size ?? "", r.visible ?? r.result ?? "", r.remarks ?? ""]);
    addSection(allData, "LOW CONTRAST RESOLUTION", ["Smallest Hole Size (mm)", "Recommended Standard"], rows);
  }

  const hcr = unwrap(data.highContrastResolution);
  if (hcr?.readings?.length || hcr?.measurements?.length) {
    const rows = (hcr.readings || hcr.measurements || []).map((r: any) => [r.lpPerMm ?? r.value ?? "", r.remarks ?? ""]);
    addSection(allData, "HIGH CONTRAST RESOLUTION", ["Measured Resolution (lp/mm)", "Recommended Standard (lp/mm)"], rows);
  }

  const exp = unwrap(data.exposureRateAtTableTop);
  if (exp?.rows?.length) {
    const headerRow = [
      "Max Exposure (AEC Mode) (cGy/Min)",
      "Max Exposure (Manual Mode) (cGy/Min)",
      "Min. Focus to Tabletop Distance",
      "Distance (cm)",
      "Applied kV",
      "Applied mA",
      "Exposure (cGy/Min)",
    ];
    const dataRows = exp.rows.map((r: any, idx: number) => {
      const base =
        idx === 0
          ? [exp.aecTolerance ?? "10", exp.nonAecTolerance ?? "5", exp.minFocusDistance ?? "30"]
          : ["", "", ""];
      return [...base, r.distance ?? "", r.appliedKv ?? "", r.appliedMa ?? "", r.exposure ?? ""];
    });
    addSection(allData, "EXPOSURE RATE AT TABLE TOP", headerRow, dataRows);
  }

  const leak = unwrap(data.tubeHousingLeakage);
  if (leak?.readings?.length || leak?.measurements?.length) {
    const rows = (leak.readings || leak.measurements || []).map((r: any) => [r.location ?? "", r.value ?? r.leakage ?? "", r.remarks ?? ""]);
    addSection(allData, "TUBE HOUSING LEAKAGE", ["Location", "Value (mR/h)", "Remarks"], rows);
  }

  const lma = unwrap(data.linearityOfMaLoading);
  if (lma?.table2?.length) {
    allData.push(["TEST: LINEARITY OF mA LOADING"]);
    allData.push(["mA Station", "Measured mR 1", "Measured mR 2", "Measured mR 3"]);
    lma.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.mAApplied ?? r.ma ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
    allData.push([]);
  }

  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas) {
    const t1 = lmas.table1?.[0] || {};
    const t2 = Array.isArray(lmas.table2) ? lmas.table2 : [];
    const measHeaders = lmas.measHeaders || ["Meas 1", "Meas 2", "Meas 3"];
    const headerRow = [
      "FDD (cm)",
      "kV",
      "Tol Operator",
      "Tol Value",
      ...measHeaders.map((_: string, i: number) => `Header ${i + 1}`),
      "mAs Range",
      ...measHeaders.map((_: string, i: number) => `Meas ${i + 1}`),
    ];
    const dataRows = t2.map((r: any, idx: number) => {
      const outs = r.measuredOutputs || [];
      const base =
        idx === 0
          ? [t1.fcd ?? "", t1.kv ?? "", lmas.toleranceOperator ?? "<", lmas.tolerance ?? "0.1", ...measHeaders]
          : Array(4 + measHeaders.length).fill("");
      return [...base, r.mAsApplied ?? r.mAsRange ?? "", ...measHeaders.map((_: string, i: number) => outs[i] ?? "")];
    });
    addSection(allData, "LINEARITY OF MAS LOADING", headerRow, dataRows);
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "C-Arm Test Data");
  return wb;
};
