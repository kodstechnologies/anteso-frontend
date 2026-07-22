const stripDistanceSuffix = (label: string) =>
  String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s*\(cm\)\s*/g, "");

/** True for FCD / FDD / FFD labels (with or without "(cm)"). */
export const isDistanceFieldLabel = (value: unknown): boolean => {
  const s = stripDistanceSuffix(String(value ?? ""));
  return s === "fcd" || s === "fdd" || s === "ffd";
};

/** Map Excel/template headers (Measured Output N, Output N, Measured mR N) to UI "Meas N". */
export const toUiMeasHeaderLabel = (header: string, fallbackIndex: number): string => {
  const h = String(header ?? "").trim();
  const measuredOutput = h.match(/^Measured Output\s*(\d+)$/i);
  if (measuredOutput) return `Meas ${measuredOutput[1]}`;
  const output = h.match(/^Output\s*(\d+)$/i);
  if (output) return `Meas ${output[1]}`;
  const meas = h.match(/^Meas(?:ured(?:\s*Output)?|\s*mR)?\s*(\d+)$/i);
  if (meas) return `Meas ${meas[1]}`;
  if (!h || /^\d{1,2}-[A-Za-z]{3}$/i.test(h)) return `Meas ${fallbackIndex + 1}`;
  return h;
};

/** Map UI "Meas N" headers to Excel column labels. */
export const toExcelMeasHeaderLabel = (
  header: string,
  fallbackIndex: number,
  excelPrefix: "Measured Output" | "Output" = "Measured Output"
): string => {
  const h = String(header ?? "").trim();
  const meas = h.match(/^Meas\s*(\d+)$/i);
  if (meas) return `${excelPrefix} ${meas[1]}`;
  if (excelPrefix === "Measured Output") {
    if (/^Measured Output\s*\d+$/i.test(h)) return h;
    const fromOutput = h.match(/^Output\s*(\d+)$/i);
    if (fromOutput) return `Measured Output ${fromOutput[1]}`;
  } else {
    if (/^Output\s*\d+$/i.test(h)) return h;
    const fromMeasuredOutput = h.match(/^Measured Output\s*(\d+)$/i);
    if (fromMeasuredOutput) return `Output ${fromMeasuredOutput[1]}`;
  }
  const measuredMr = h.match(/^Measured mR\s*(\d+)$/i);
  if (measuredMr) return `${excelPrefix} ${measuredMr[1]}`;
  if (!h || /^\d{1,2}-[A-Za-z]{3}$/i.test(h)) return `${excelPrefix} ${fallbackIndex + 1}`;
  return h;
};

export const resolveExcelMeasHeaders = (
  saved: any,
  maxFromRows: number,
  excelPrefix: "Measured Output" | "Output" = "Measured Output"
): string[] => {
  const uiHeaders = resolveMeasHeaders(saved, maxFromRows, "Meas");
  return uiHeaders.map((h, i) => toExcelMeasHeaderLabel(h, i, excelPrefix));
};

/** Prefer saved custom headers; pad to match measurement column count. */
export const resolveMeasHeaders = (
  saved: any,
  maxFromRows: number,
  fallbackPrefix = "Meas"
): string[] => {
  const cleaned = Array.isArray(saved)
    ? saved.map((h: any) => String(h ?? "").trim()).filter(Boolean)
    : [];
  const count = Math.max(maxFromRows, cleaned.length);
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => cleaned[i] || `${fallbackPrefix} ${i + 1}`);
};

export const cellStr = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "object" && "value" in v) return String((v as any).value ?? "");
  return String(v);
};

/** Collect measured outputs from table2 / readings / meas1..N shapes. */
export const getMeasuredOutputs = (row: any): string[] => {
  if (Array.isArray(row?.measuredOutputs)) {
    return row.measuredOutputs.map((v: any) => cellStr(v));
  }
  if (Array.isArray(row?.outputs)) {
    return row.outputs.map((o: any) => cellStr(o));
  }
  if (Array.isArray(row?.measuredValues)) {
    return row.measuredValues.map((v: any) => cellStr(v));
  }
  const fromKeys = Object.keys(row || {})
    .filter((k) => /^meas\d+$/i.test(k))
    .sort(
      (a, b) =>
        parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10)
    )
    .map((k) => cellStr(row[k]));
  if (fromKeys.length > 0) return fromKeys;
  return [row?.meas1, row?.meas2, row?.meas3, row?.meas4, row?.meas5]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v));
};
