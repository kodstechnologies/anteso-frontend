/** Shared save-time validation for Total Filtration test sections. */

export type TotalFiltrationInput = {
  atKvp?: string | number | null;
  measured?: string | number | null;
  required?: string | number | null;
  measured1?: string | number | null;
  measured2?: string | number | null;
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function isFilledNumber(value: unknown): boolean {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  const n = parseFloat(trimmed);
  return Number.isFinite(n);
}

/** Resolve the mm Al value from the various field names used across machine types. */
export function getTotalFiltrationMmAl(tf: TotalFiltrationInput): string {
  for (const candidate of [tf.required, tf.measured, tf.measured1, tf.measured2]) {
    const s = String(candidate ?? "").trim();
    if (s) return s;
  }
  return "";
}

/** Standard radiography-style Total Filtration: requires kVp and mm Al. */
export function validateTotalFiltrationSave(tf: TotalFiltrationInput): ValidationResult {
  if (!isFilledNumber(tf.atKvp)) {
    return { ok: false, message: "Please enter kVp for Total Filtration" };
  }
  if (!isFilledNumber(getTotalFiltrationMmAl(tf))) {
    return { ok: false, message: "Please enter Total Filtration value (mm Al)" };
  }
  return { ok: true };
}

export type MammographyFiltrationRow = {
  kvp?: string;
  mAs?: string;
  alEquivalence?: string;
  hvt?: string;
};

/** Mammography Total Filtration & Aluminium: requires at least one measured HVT or Al equivalence. */
export function validateMammographyTotalFiltrationSave(
  rows: MammographyFiltrationRow[],
  resultHVT?: string
): ValidationResult {
  if (isFilledNumber(resultHVT)) {
    return { ok: true };
  }
  const hasRowMeasurement = rows.some(
    (row) => isFilledNumber(row.hvt) || isFilledNumber(row.alEquivalence)
  );
  if (!hasRowMeasurement) {
    return {
      ok: false,
      message: "Please enter HVT or Al equivalence for at least one row, or fill Result HVT at 28 kVp",
    };
  }
  const missingKvp = rows.some(
    (row) =>
      (isFilledNumber(row.hvt) || isFilledNumber(row.alEquivalence)) && !isFilledNumber(row.kvp)
  );
  if (missingKvp) {
    return { ok: false, message: "Please enter kVp for rows with HVT or Al equivalence values" };
  }
  return { ok: true };
}
