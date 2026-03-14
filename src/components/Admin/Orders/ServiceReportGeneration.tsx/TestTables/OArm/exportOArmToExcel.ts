import * as XLSX from "xlsx";

export interface OArmExportData {
  reportHeader?: any;
  totalFiltration?: any;
  outputConsistency?: any;
  highContrastResolution?: any;
  lowContrastResolution?: any;
  exposureRateAtTableTop?: any;
  tubeHousingLeakage?: any;
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

export const createOArmUploadableExcel = (data: OArmExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  const header = data.reportHeader?.data || data.reportHeader;
  if (header) {
    allData.push(["REPORT HEADER"]);
    allData.push(["Customer", header.customerName ?? ""]);
    allData.push(["Address", header.address ?? ""]);
    allData.push(["SRF Number", header.srfNumber ?? ""]);
    allData.push(["Test Report Number", header.testReportNumber ?? ""]);
    allData.push([]);
  }

  const tf = unwrap(data.totalFiltration);
  if (tf?.totalFiltration) {
    const t = tf.totalFiltration;
    addSection(allData, "TOTAL FILTRATION", ["Parameter", "Measured", "Required", "At kVp"], [["TotalFiltration", t.measured ?? "", t.required ?? "", t.atKvp ?? ""]]);
  }

  const oc = unwrap(data.outputConsistency);
  if (oc?.outputRows?.length || oc?.ffd) {
    allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
    allData.push(["FFD", oc.ffd?.value ?? ""]);
    allData.push(["kVp", "mAs", "Reading 1", "Reading 2", "Reading 3"]);
    (oc.outputRows || []).forEach((r: any) => {
      const outs = r.outputs || [];
      allData.push([r.kv ?? "", r.mas ?? "", outs[0]?.value ?? outs[0] ?? "", outs[1]?.value ?? outs[1] ?? "", outs[2]?.value ?? outs[2] ?? ""]);
    });
    allData.push([]);
  }

  const hcr = unwrap(data.highContrastResolution);
  if (hcr?.readings?.length || hcr?.measurements?.length) {
    const rows = (hcr.readings || hcr.measurements || []).map((r: any) => [r.lpPerMm ?? r.value ?? "", r.remarks ?? ""]);
    addSection(allData, "HIGH CONTRAST RESOLUTION", ["lp/mm", "Remarks"], rows);
  }

  const lcr = unwrap(data.lowContrastResolution);
  if (lcr?.readings?.length || lcr?.measurements?.length) {
    const rows = (lcr.readings || lcr.measurements || []).map((r: any) => [r.diameter ?? r.size ?? "", r.visible ?? r.result ?? "", r.remarks ?? ""]);
    addSection(allData, "LOW CONTRAST RESOLUTION", ["Diameter (mm)", "Visible", "Remarks"], rows);
  }

  const exp = unwrap(data.exposureRateAtTableTop);
  if (exp?.readings?.length || exp?.measurements?.length) {
    const rows = (exp.readings || exp.measurements || []).map((r: any) => [r.kv ?? "", r.ma ?? "", r.distance ?? "", r.rate ?? r.value ?? "", r.remarks ?? ""]);
    addSection(allData, "EXPOSURE RATE AT TABLE TOP", ["kV", "mA", "Distance", "Rate", "Remarks"], rows);
  }

  const leak = unwrap(data.tubeHousingLeakage);
  if (leak?.readings?.length || leak?.measurements?.length) {
    const rows = (leak.readings || leak.measurements || []).map((r: any) => [r.location ?? "", r.value ?? r.leakage ?? "", r.remarks ?? ""]);
    addSection(allData, "TUBE HOUSING LEAKAGE", ["Location", "Value (mR/h)", "Remarks"], rows);
  }

  const lmas = unwrap(data.linearityOfMasLoading);
  if (lmas?.table2?.length) {
    allData.push(["TEST: LINEARITY OF mAs LOADING"]);
    allData.push(["mAs Range", "Measured mR 1", "Measured mR 2", "Measured mR 3"]);
    lmas.table2.forEach((r: any) => {
      const outs = r.measuredOutputs || [];
      allData.push([r.mAsRange ?? "", outs[0] ?? "", outs[1] ?? "", outs[2] ?? ""]);
    });
    allData.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, ws, "O-Arm Test Data");
  return wb;
};
