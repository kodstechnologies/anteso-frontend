/** Format degree symbol after the numeric value (e.g. "5°"). */
export function formatDegreeAfterValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  const s = String(value).trim().replace(/^°/, "");
  if (!s || s === "-") return "-";
  return s.endsWith("°") ? s : `${s}°`;
}

/** Effective focal spot tolerance string with lowercase f. */
export function formatEffectiveFocalSpotToleranceStr(
  smallMultiplier: number | string,
  smallLimit: number | string,
  mediumMultiplier: number | string,
  mediumLower: number | string,
  mediumUpper: number | string,
  largeMultiplier: number | string
): string {
  return `+${smallMultiplier} f FOR f < ${smallLimit} mm; +${mediumMultiplier} f FOR ${mediumLower} ≤ f ≤ ${mediumUpper} mm; +${largeMultiplier} f FOR f > ${mediumUpper} mm`;
}

/** Coefficient of Linearity measured value without "CoL = " prefix. */
export function formatCoefficientOfLinearityMeasured(col: string | number | undefined | null): string {
  if (col === undefined || col === null || col === "" || col === "-") return "-";
  const s = String(col).replace(/^CoL\s*=\s*/i, "").trim();
  const num = parseFloat(s);
  return isNaN(num) ? "-" : s;
}

/** kVp Accuracy tolerance display unit. */
export function formatKvpAccuracyTolerance(sign: string, value: string | number): string {
  return `${sign} ${value} kVp`;
}

/** Consistency of radiation output specified value — always uses mAs suffix. */
export function formatConsistencyOutputSpecified(
  kv: string | number | undefined | null,
  loadValue: string | number | undefined | null
): string {
  const kvStr = kv != null && String(kv).trim() !== "" ? String(kv).trim() : "";
  const rawLoad = loadValue != null && String(loadValue).trim() !== "" ? String(loadValue).trim() : "";

  if (!kvStr && !rawLoad) return "Varies";

  const loadNum = rawLoad.replace(/\s*(mA|mAs)\s*$/i, "").trim();

  if (kvStr && loadNum) return `at ${kvStr} kV ${loadNum} mAs`;
  if (kvStr) return `${kvStr} kV`;
  if (loadNum) return `at ${loadNum} mAs`;
  return "Varies";
}

type LeakageLocationRef = { location?: string } | string;

/** Dynamic tube housing leakage parameter title based on measured locations. */
export function getRadiationLeakageLevelParameterTitle(
  locations: LeakageLocationRef[] | undefined
): string {
  const locStrings = (locations || [])
    .map((item) => (typeof item === "string" ? item : item?.location || ""))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  let hasTube = false;
  let hasCollimator = false;

  for (const loc of locStrings) {
    if (loc.includes("collimator")) hasCollimator = true;
    else if (loc.includes("tube")) hasTube = true;
  }

  let sourcePart: string;
  if (hasTube && hasCollimator) {
    sourcePart = "tube housing and Collimator";
  } else if (hasTube) {
    sourcePart = "tube housing";
  } else if (hasCollimator) {
    sourcePart = "Collimator";
  } else {
    sourcePart = "tube housing and Collimator";
  }

  return `Radiation leakage level at 1m from ${sourcePart}`;
}
