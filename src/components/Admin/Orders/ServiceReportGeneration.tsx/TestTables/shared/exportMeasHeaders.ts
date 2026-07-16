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
