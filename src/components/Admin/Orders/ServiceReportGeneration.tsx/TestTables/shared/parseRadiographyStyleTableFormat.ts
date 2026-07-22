/** Parse Radiography-Fixed-style vertical TEST: table CSV/Excel for C-Arm and O-Arm. */

import * as XLSX from "xlsx";

export type RadiographyStyleDevice = "carm" | "oarm";

export type StyleParsedRow = {
  "Test Name": string;
  "Field Name": string;
  Value: string;
  "Row Index": string;
};

const splitLine = (line: string) => line.split(",").map((c) => (c || "").trim());

const normalizeCsvToleranceSign = (raw: unknown): string => {
  const v = String(raw ?? "").trim();
  if (!v) return "±";
  if (/^\+-?$|^±$/.test(v)) return "±";
  if (v === "+") return "+";
  if (v === "-") return "-";
  return v;
};

export const normalizeCsvComparisonOperator = (raw: unknown): string => {
  const original = String(raw ?? "").trim();
  // Normalize common Unicode symbols Excel may insert
  const unicodeNormalized = original
    .replace(/≤|⩽/g, "<=")
    .replace(/≥|⩾/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/＝/g, "=");
  const v = unicodeNormalized.toLowerCase().replace(/\s+/g, " ").trim();
  if (!v) return "<=";
  if (v.includes("less than or equal") || v === "<=" || v === "=<" || v === "le") return "<=";
  if (v.includes("greater than or equal") || v === ">=" || v === "=>" || v === "ge") return ">=";
  if (v === "<" || v === "lt" || (v.includes("less than") && !v.includes("equal"))) return "<";
  if (v === ">" || v === "gt" || (v.includes("greater than") && !v.includes("equal"))) return ">";
  if (v === "=" || v === "==" || v === "eq") return "=";
  // Already a supported operator after unicode normalize
  if (["<", ">", "<=", ">=", "="].includes(unicodeNormalized.trim())) {
    return unicodeNormalized.trim();
  }
  return unicodeNormalized.trim() || "<=";
};

const formatMaStation = (val: string): string => {
  const v = val.trim();
  if (!v) return v;
  return /\bmA\b/i.test(v) ? v : `${v} mA`;
};

export const isExcelDateArtifact = (value: string): boolean =>
  /^\d{1,2}-[A-Za-z]{3}$/i.test(String(value ?? "").trim());

export const isMeasHeaderLabel = (label: string): boolean =>
  /^(?:Meas|Measured(?:\s*Output)?|Output)\s*\d+$/i.test(String(label ?? "").trim());

/** Keep Excel header text; only substitute when the cell is empty or an Excel date artifact. */
export const normalizeMeasHeaderLabel = (header: string, fallbackIndex: number): string => {
  const h = String(header ?? "").trim();
  if (!h || isExcelDateArtifact(h)) return `Meas ${fallbackIndex + 1}`;
  return h;
};

/** Coerce mAs row label from Excel (reject date-format corruption). */
export const coerceMasRangeLabel = (value: string): string | null => {
  const v = String(value ?? "").trim();
  if (!v || /^Tolerance/i.test(v)) return null;
  if (v === "mAs Range" || v === "mAs Applied" || v === "mAs") return null;
  if (isExcelDateArtifact(v)) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return v;
  if (/\d/.test(v) && (/\s+to\s+/i.test(v) || /\s*-\s*/.test(v))) {
    return v.replace(/\s+to\s+/gi, " - ");
  }
  return v;
};

const isMasRangeRowLabel = (value: string): boolean => coerceMasRangeLabel(value) !== null;

type MapperCtx = { device: RadiographyStyleDevice; rows: StyleParsedRow[] };

const push = (
  ctx: MapperCtx,
  testName: string,
  fieldName: string,
  value: string,
  rowIndex: number
) => {
  const v = String(value ?? "").trim();
  if (!v) return;
  ctx.rows.push({
    "Test Name": testName,
    "Field Name": fieldName,
    Value: v,
    "Row Index": String(rowIndex),
  });
};

const mapTotalFiltration = (ctx: MapperCtx, lines: string[], startIdx: number): number => {
  const testName = ctx.device === "oarm" ? "Total Filtration" : "Total Filtration";
  const maStations: string[] = [];
  let j = startIdx + 1;

  for (; j < lines.length; j++) {
    const l = lines[j].trim();
    if (!l) continue;
    if (/^mA\s*Station/i.test(l)) break;
    if (l.startsWith("TEST:")) return j;
    const cells = splitLine(l);
    const label = cells[0] || "";
    const val = cells[1] || "";
    if (label === "Tolerance Sign") push(ctx, testName, "Tolerance_Sign", normalizeCsvToleranceSign(val), 0);
    else if (/^Tolerance Value/i.test(label)) push(ctx, testName, "Tolerance_Value", val, 0);
    else if (/^Total Filtration Measured/i.test(label)) push(ctx, testName, "TotalFiltration_Measured", val, 0);
    else if (/^Total Filtration Required/i.test(label)) push(ctx, testName, "TotalFiltration_Required", val, 0);
    else if (/^Total Filtration At kVp/i.test(label)) push(ctx, testName, "TotalFiltration_AtKvp", val, 0);
    else if (/^Total Filtration \(mm Al\)/i.test(label)) push(ctx, testName, "TotalFiltration_Required", val, 0);
  }

  for (; j < lines.length; j++) {
    const l = lines[j].trim();
    if (!l) continue;
    if (/^Applied kVp/i.test(l)) {
      j++;
      break;
    }
    const cells = splitLine(l);
    const label = cells[0] || "";
    const val = cells[1] || "";
    if (/^mA\s*Station/i.test(label) && val) {
      maStations.push(formatMaStation(val));
      if (ctx.device === "carm") push(ctx, testName, "mAStations", formatMaStation(val), 0);
      else push(ctx, testName, `Header_${maStations.length}`, formatMaStation(val), 0);
    }
  }

  let headerCells: string[] = [];
  if (j > 0 && j <= lines.length) {
    const headerLine = lines[j - 1]?.trim() || "";
    if (/^Applied kVp/i.test(headerLine)) headerCells = splitLine(headerLine);
  }

  const measHeaders = headerCells.slice(1).filter(Boolean);
  measHeaders.forEach((h, idx) => {
    const stationLabel = maStations[idx] || normalizeMeasHeaderLabel(h, idx);
    if (ctx.device === "carm") {
      push(ctx, testName, `Header_${idx + 1}`, stationLabel, 0);
    } else if (!maStations.length) {
      push(ctx, testName, `Header_${idx + 1}`, normalizeMeasHeaderLabel(h, idx), 0);
    }
  });

  let idx = 0;
  for (; j < lines.length; j++) {
    const l = lines[j].trim();
    if (!l || l.startsWith("TEST:")) break;
    const cells = splitLine(l);
    const kvp = cells[0] || "";
    if (!kvp || isNaN(Number(kvp))) continue;
    if (ctx.device === "carm") {
      push(ctx, testName, "Measurement_AppliedKvp", kvp, idx);
      for (let c = 1; c < cells.length; c++) {
        if (cells[c]) push(ctx, testName, `Measurement_Meas${c}`, cells[c], idx);
      }
    } else {
      push(ctx, testName, "Table2_AppliedKvp", kvp, idx + 1);
      for (let c = 1; c < cells.length; c++) {
        if (cells[c]) push(ctx, testName, `Table2_Meas_${c - 1}`, cells[c], idx + 1);
      }
    }
    idx++;
  }
  return j;
};

const mapOutputConsistency = (ctx: MapperCtx, lines: string[], startIdx: number): number => {
  const testName =
    ctx.device === "oarm" ? "Output Consistency" : "Consistency of Radiation Output";
  const ffdLine = splitLine(lines[startIdx + 1] || "");
  const ffd = ffdLine[1] || ffdLine[0]?.replace(/FDD\s*\(cm\)/i, "").trim() || "";
  if (ffd && !/^FDD|^FFD|^Time|^kVp/i.test(ffd)) {
    push(ctx, testName, ctx.device === "oarm" ? "Param_FFD" : "Parameters_FFD", ffd, 0);
  }

  let headerLineIdx = startIdx + 2;
  let headerCells = splitLine(lines[headerLineIdx] || "");
  if (/^Time\s*\(/i.test(headerCells[0] || "")) {
    push(ctx, testName, ctx.device === "oarm" ? "Param_Time" : "Parameters_Time", headerCells[1] || "", 0);
    headerLineIdx += 1;
    headerCells = splitLine(lines[headerLineIdx] || "");
  }

  const outputHeaders = headerCells.slice(2).map((h) => h.trim()).filter(Boolean);
  outputHeaders.forEach((h, headerIdx) => {
    push(ctx, testName, `Header_${headerIdx + 1}`, normalizeMeasHeaderLabel(h, headerIdx), 0);
  });

  let idx = 0;
  let j = headerLineIdx + 1;
  while (j < lines.length) {
    const l = lines[j].trim();
    if (!l || l.startsWith("TEST:")) break;
    const cells = splitLine(l);
    const labelCell = cells[0] || "";
    const valCell = cells[1] || "";

    if (/^tolerance\s*operator$/i.test(labelCell)) {
      const op = normalizeCsvComparisonOperator(valCell);
      if (ctx.device === "oarm") push(ctx, testName, "Tolerance_Operator", op, 0);
      else push(ctx, testName, "Output_ToleranceOperator", op, 0);
      j++;
      continue;
    }
    if (/^tolerance\s*value/i.test(labelCell) || /^tolerance\s*\(cov\)/i.test(labelCell) || labelCell === "Tolerance") {
      if (valCell) push(ctx, testName, ctx.device === "oarm" ? "Tolerance_Value" : "Output_Tolerance", valCell, 0);
      j++;
      continue;
    }

    const kv = labelCell;
    const mas = valCell;
    if (kv || mas) {
      const rowIdx = ctx.device === "oarm" ? idx + 1 : idx;
      if (kv) push(ctx, testName, ctx.device === "oarm" ? "Row_kvp" : "Output_kV", kv, rowIdx);
      if (mas) push(ctx, testName, ctx.device === "oarm" ? "Row_ma" : "Output_mA", mas, rowIdx);
      const outputCount = outputHeaders.length > 0 ? outputHeaders.length : Math.max(0, cells.length - 2);
      for (let col = 0; col < outputCount; col++) {
        const val = cells[col + 2];
        if (val !== undefined && String(val).trim() !== "") {
          if (ctx.device === "oarm") push(ctx, testName, `Row_Output_${col}`, String(val).trim(), rowIdx);
          else push(ctx, testName, `Output_Meas${col + 1}`, String(val).trim(), rowIdx);
        }
      }
      idx++;
    }
    j++;
  }
  return j;
};

const mapLinearityMa = (ctx: MapperCtx, lines: string[], startIdx: number): number => {
  const testName = "Linearity of mA Loading";
  const cond = splitLine(lines[startIdx + 1] || "");
  const fcd = cond[1] || "";
  const kv = cond[3] || "";
  const time = cond[5] || "";
  if (fcd) push(ctx, testName, ctx.device === "oarm" ? "Exposure_FCD" : "Linearity_FCD", fcd, 0);
  if (kv) push(ctx, testName, ctx.device === "oarm" ? "Exposure_KV" : "Linearity_kV", kv, 0);
  if (time) push(ctx, testName, ctx.device === "oarm" ? "Exposure_Time" : "Linearity_Time", time, 0);

  const headerCells = splitLine(lines[startIdx + 2] || "");
  const measHeaders = headerCells.slice(1).map((h) => h.trim()).filter(Boolean);
  measHeaders.forEach((h, i) =>
    push(ctx, testName, `Header_${i + 1}`, normalizeMeasHeaderLabel(h, i), 0)
  );

  let idx = 0;
  let j = startIdx + 3;
  while (j < lines.length) {
    const l = lines[j].trim();
    if (!l || l.startsWith("TEST:")) break;
    const cells = splitLine(l);
    const first = cells[0] || "";
    if (first === "Tolerance Operator") {
      const op = normalizeCsvComparisonOperator(cells[1] || "");
      if (ctx.device === "oarm") push(ctx, testName, "Tolerance_Operator", op, 0);
      else push(ctx, testName, "Linearity_ToleranceOperator", op, 0);
      j++;
      continue;
    }
    if (/^Tolerance Value/i.test(first)) {
      const val = cells[1] || "";
      if (val) {
        if (ctx.device === "oarm") push(ctx, testName, "Tolerance_Value", val, 0);
        else {
          push(ctx, testName, "Linearity_Tolerance", val, 0);
          push(ctx, testName, "Linearity_ToleranceValue", val, 0);
        }
      }
      j++;
      continue;
    }
    if (first !== "mA Applied" && first && !isNaN(Number(first))) {
      const rowIdx = ctx.device === "oarm" ? idx + 1 : idx;
      push(ctx, testName, ctx.device === "oarm" ? "Row_mAsRange" : "Linearity_mA", first, rowIdx);
      for (let c = 1; c < cells.length; c++) {
        if (cells[c]) {
          if (ctx.device === "oarm") push(ctx, testName, `Row_Meas_${c - 1}`, cells[c], rowIdx);
          else push(ctx, testName, `Linearity_Meas${c}`, cells[c], rowIdx);
        }
      }
      idx++;
    }
    j++;
  }
  return j;
};

const mapLinearityMas = (ctx: MapperCtx, lines: string[], startIdx: number): number => {
  const testName = "Linearity of mAs Loading";
  const cond = splitLine(lines[startIdx + 1] || "");
  const fcd = cond[1] || "";
  const kv = cond[3] || "";
  if (fcd) push(ctx, testName, ctx.device === "oarm" ? "Exposure_FCD" : "Linearity_FCD", fcd, 0);
  if (kv) push(ctx, testName, ctx.device === "oarm" ? "Exposure_KV" : "Linearity_kV", kv, 0);

  const headerCells = splitLine(lines[startIdx + 2] || "");
  const measHeaders = headerCells.slice(1).map((h) => h.trim()).filter(Boolean);
  measHeaders.forEach((h, i) =>
    push(ctx, testName, `Header_${i + 1}`, normalizeMeasHeaderLabel(h, i), 0)
  );

  let idx = 0;
  let j = startIdx + 3;
  while (j < lines.length) {
    const l = lines[j].trim();
    if (!l || l.startsWith("TEST:")) break;
    const cells = splitLine(l);
    const first = cells[0] || "";
    if (first === "Tolerance Operator") {
      const op = normalizeCsvComparisonOperator(cells[1] || "");
      push(ctx, testName, "Linearity_ToleranceOperator", op, 0);
      if (ctx.device === "oarm") push(ctx, testName, "Tolerance_Operator", op, 0);
      j++;
      continue;
    }
    if (/^Tolerance Value/i.test(first)) {
      const val = cells[1] || "";
      if (val) {
        push(ctx, testName, "Linearity_ToleranceValue", val, 0);
        if (ctx.device === "oarm") push(ctx, testName, "Tolerance_Value", val, 0);
      }
      j++;
      continue;
    }
    if (isMasRangeRowLabel(first)) {
      const rowIdx = ctx.device === "oarm" ? idx + 1 : idx;
      const rangeLabel = coerceMasRangeLabel(first) ?? first;
      push(ctx, testName, ctx.device === "oarm" ? "Row_mAsRange" : "Linearity_mAsRange", rangeLabel, rowIdx);
      push(ctx, testName, "Linearity_mAs", rangeLabel, rowIdx);
      for (let c = 1; c < cells.length; c++) {
        if (cells[c]) {
          if (ctx.device === "oarm") push(ctx, testName, `Row_Meas_${c - 1}`, cells[c], rowIdx);
          else push(ctx, testName, `Linearity_Meas${c}`, cells[c], rowIdx);
        }
      }
      idx++;
    }
    j++;
  }
  return j;
};

export const isRadiographyStyleVerticalFormat = (text: string): boolean => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (/^TEST:\s*TOTAL FILTRATION/i.test(lines[i])) {
      const next = lines[i + 1] || "";
      return /^Tolerance Sign,/i.test(next);
    }
    if (
      /^TEST:\s*CONSISTENCY OF RADIATION OUTPUT/i.test(lines[i]) ||
      /^TEST:\s*OUTPUT CONSISTENCY/i.test(lines[i])
    ) {
      const next = lines[i + 1] || "";
      return /^FDD\s*\(cm\),/i.test(next) || /^FFD\s*\(cm\),/i.test(next);
    }
  }
  return false;
};

export const parseRadiographyStyleTableCSV = (
  text: string,
  device: RadiographyStyleDevice
): StyleParsedRow[] => {
  const ctx: MapperCtx = { device, rows: [] };
  const lines = text.split(/\r?\n/);

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i].trim();
    if (!raw.startsWith("TEST:")) {
      i++;
      continue;
    }
    const label = raw.slice(5).split(",")[0].trim().toUpperCase();

    if (label === "TOTAL FILTRATION") {
      i = mapTotalFiltration(ctx, lines, i);
      continue;
    }
    if (label === "CONSISTENCY OF RADIATION OUTPUT" || label === "OUTPUT CONSISTENCY") {
      i = mapOutputConsistency(ctx, lines, i);
      continue;
    }
    if (label === "LINEARITY OF MA LOADING") {
      i = mapLinearityMa(ctx, lines, i);
      continue;
    }
    if (label === "LINEARITY OF MAS LOADING" || label === "LINEARITY OF MAS LOADING") {
      i = mapLinearityMas(ctx, lines, i);
      continue;
    }
    i++;
  }

  return ctx.rows;
};

export const matrixToCsvText = (matrix: any[][]): string =>
  matrix
    .map((row) =>
      (Array.isArray(row) ? row : [])
        .map((c) => (c !== undefined && c !== null ? String(c) : ""))
        .join(",")
    )
    .join("\n");

/** Read worksheet rows using Excel formatted text (cell.w) when available — avoids date corruption on mAs Range. */
export const sheetRowsFromWorksheet = (ws: XLSX.WorkSheet): any[][] => {
  const ref = ws["!ref"];
  if (!ref) return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];

  const range = XLSX.utils.decode_range(ref);
  const rows: any[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: any[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) {
        row.push("");
        continue;
      }
      if (cell.w != null && String(cell.w).trim() !== "") {
        row.push(String(cell.w).trim());
      } else if (cell.t === "s") {
        row.push(String(cell.v ?? ""));
      } else if (cell.t === "n") {
        row.push(String(cell.v ?? ""));
      } else {
        row.push(cell.v ?? "");
      }
    }
    rows.push(row);
  }
  return rows;
};
