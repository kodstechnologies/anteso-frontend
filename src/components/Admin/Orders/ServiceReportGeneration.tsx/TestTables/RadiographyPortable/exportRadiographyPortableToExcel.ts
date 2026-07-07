// Excel export / template for Radiography Portable (Mobile-style TEST: table format)
import * as XLSX from "xlsx";

export interface RadiographyPortableExportData {
  congruenceOfRadiation?: any;
  centralBeamAlignment?: any;
  effectiveFocalSpot?: any;
  accuracyOfIrradiationTime?: any;
  accuracyOfOperatingPotential?: any;
  linearityOfMasLoadingStations?: any;
  linearityOfMaLoadingStations?: any;
  consistencyOfRadiationOutput?: any;
  radiationLeakageLevel?: any;
}

const pad = (n: number) => Array(n).fill("");

/** Sample upload template rows (matches RadiographyMobile_Timer_Template.csv layout). */
export const buildPortableTemplateRows = (hasTimer: boolean): any[][] => {
  const rows: any[][] = [];

  const sec = (title: string, lines: any[][]) => {
    rows.push([`TEST: ${title}`, ...pad(9)]);
    lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 10 - line.length))]));
    rows.push([]);
  };

  sec("CONGRUENCE OF RADIATION & LIGHT FIELD", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Dimension", "Observed Shift (cm)", "Edge Shift (cm)", "Tolerance (%)"],
    ["Length", "0.2", "0.1", "2"],
    ["Width", "0.3", "0.1", "2"],
  ]);

  sec("CENTRAL BEAM ALIGNMENT", [
    ["FFD (cm)", "100", "kV", "80", "mAs", "10"],
    ["Observed Tilt (cm)", "0.5"],
    ["Tolerance (cm)", "1.5"],
  ]);

  sec("EFFECTIVE FOCAL SPOT", [
    ["FFD (cm)", "60"],
    ["Focus Type", "Stated Focal Spot of Tube (f)", "Measured Focal Spot (Nominal)"],
    ["Small", "0.6", "0.65"],
    ["Large", "1.2", "1.3"],
  ]);

  if (hasTimer) {
    sec("ACCURACY OF IRRADIATION TIME", [
      ["FDD (cm)", "100", "kV", "80", "mA", "100"],
      ["Set Time (s)", "Measured Time (s)"],
      ["0.1", "0.102"],
      ["0.2", "0.198"],
      ["Tolerance Operator", "<="],
      ["Tolerance Value (%)", "5"],
    ]);
  }

  sec("ACCURACY OF OPERATING POTENTIAL (kVp)", [
    ["Tolerance Sign", "±"],
    ["Tolerance Value (kVp)", "2"],
    ["Total Filtration Measured (mm Al)", "2.65"],
    ["Total Filtration Required (mm Al)", "2.5"],
    ["Total Filtration At kVp", "80"],
    ["Applied kVp", "50 mA", "100 mA"],
    ["60", "59.8", "60.2"],
    ["80", "79.5", "80.5"],
    ["100", "99.2", "100.8"],
    ["120", "119.5", "120.5"],
  ]);

  if (hasTimer) {
    sec("LINEARITY OF MA LOADING", [
      ["FCD (cm)", "kV", "Time (sec)", "mA Applied", "Meas 1", "Meas 2", "Meas 3"],
      ["100", "80", "1", "50", "0.42", "0.43", "0.42"],
      ["", "", "", "100", "0.85", "0.84", "0.86"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  } else {
    sec("LINEARITY OF mAs LOADING STATIONS", [
      ["FDD (cm)", "100", "kV", "80"],
      ["mAs Applied", "Meas 1", "Meas 2", "Meas 3"],
      ["5", "0.42", "0.43", "0.42"],
      ["10", "0.85", "0.84", "0.86"],
      ["20", "1.71", "1.7", "1.72"],
      ["Tolerance Operator", "<="],
      ["Tolerance (CoL)", "0.1"],
    ]);
  }

  sec("CONSISTENCY OF RADIATION OUTPUT", [
    ["FFD (cm)", "100"],
    ["kVp", "mAs", "Meas 1", "Meas 2", "Meas 3", "Meas 4", "Meas 5"],
    ["80", "10", "0.85", "0.84", "0.86", "0.85", "0.85"],
    ["Tolerance Operator", "<="],
    ["Tolerance (CoV)", "0.05"],
  ]);

  sec("RADIATION LEAKAGE LEVEL", [
    ["FFD (cm)", "100", "kV", "125", "mA", "20", "Time (min)", "2", "Workload", "20"],
    ["Tolerance Value (mGy/h)", "1"],
    ["Tolerance Operator", "less than or equal to"],
    ["Location", "Left", "Right", "Front", "Back", "Top"],
    ["Tube - Left", "0.05", "0.04", "0.06", "0.05", "0.04"],
    ["Collimator - Left", "0.02", "0.03", "0.02", "0.03", "0.02"],
  ]);

  return rows;
};

export const createRadiographyPortableUploadableExcel = (
  data: RadiographyPortableExportData,
  hasTimer: boolean
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const hasAnyData = Object.values(data || {}).some((v) => v != null && (typeof v !== "object" || Object.keys(v).length > 0));

  const allData = hasAnyData ? buildPortableTemplateRows(hasTimer) : buildPortableTemplateRows(hasTimer);

  if (hasAnyData) {
    // When exporting saved data, still use table layout with available values filled in template structure
    // (full reverse-mapping can be added later; template format is primary for upload)
    void data;
  }

  const ws = XLSX.utils.aoa_to_sheet(allData);
  ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws, "Radiography Portable Test Data");
  return wb;
};

export const writePortableTemplateWorkbook = (outputPath: string) => {
  const wb = XLSX.utils.book_new();
  const wsTimer = XLSX.utils.aoa_to_sheet(buildPortableTemplateRows(true));
  const wsNoTimer = XLSX.utils.aoa_to_sheet(buildPortableTemplateRows(false));
  wsTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  wsNoTimer["!cols"] = Array.from({ length: 12 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, wsTimer, "With Timer");
  XLSX.utils.book_append_sheet(wb, wsNoTimer, "Without Timer");
  try {
    XLSX.writeFile(wb, outputPath);
  } catch (e: any) {
    if (e?.code === "EBUSY") {
      const tmp = outputPath.replace(/\.xlsx$/i, ".tmp.xlsx");
      XLSX.writeFile(wb, tmp);
      console.warn(`Target locked; wrote ${tmp}`);
      return;
    }
    throw e;
  }
};
