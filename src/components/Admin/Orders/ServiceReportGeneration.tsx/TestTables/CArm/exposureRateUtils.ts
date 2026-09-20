export type ExposureRateMode = "AEC Mode" | "Manual Mode" | "";

/** Map Excel/API mode values to the UI select options. */
export function normalizeExposureMode(raw: unknown): ExposureRateMode {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!s) return "";
  if (
    s === "manual mode" ||
    s === "manual" ||
    s.includes("manual") ||
    s.includes("non-aec") ||
    s.includes("non aec") ||
    s.includes("nonaec")
  ) {
    return "Manual Mode";
  }
  if (s === "aec mode" || s === "aec" || s.includes("aec") || s.includes("automatic")) {
    return "AEC Mode";
  }
  return "";
}

export function computeExposureRateRowResult(
  row: { exposure?: string | number; remark?: string; mode?: string },
  aecTolerance: string | number,
  nonAecTolerance: string | number
): "PASS" | "FAIL" | "" {
  const exposure = parseFloat(String(row.exposure ?? ""));
  const aecLimit = parseFloat(String(aecTolerance)) || 0;
  const manualLimit = parseFloat(String(nonAecTolerance)) || 0;
  const mode = normalizeExposureMode(row.remark ?? row.mode);

  if (Number.isNaN(exposure) || !mode) return "";

  const isPass =
    (mode === "AEC Mode" && exposure <= aecLimit) ||
    (mode === "Manual Mode" && exposure <= manualLimit);

  return isPass ? "PASS" : "FAIL";
}
