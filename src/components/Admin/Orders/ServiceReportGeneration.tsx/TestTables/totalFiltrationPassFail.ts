/** Shared Total Filtration PASS/FAIL (measured mm Al must meet or exceed required value per kV band). */

export type FiltrationToleranceBands = {
  forKvGreaterThan70?: string | number;
  forKvLessThan70?: string | number;
  forKvBetween70And100?: string | number;
  forKvGreaterThan100?: string | number;
  /** Legacy aliases used by some dental views */
  value1?: string | number;
  value2?: string | number;
  value3?: string | number;
  kvThreshold1?: string | number;
  kvThreshold2?: string | number;
  kvp1?: string | number;
  kvp2?: string | number;
};

export type FiltrationPassFail = "PASS" | "FAIL" | "-";

/** `exact` — measured must equal required; `minimum` — measured must be ≥ required */
export type TotalFiltrationCompareMode = "exact" | "minimum";

const sameMmAl = (a: number, b: number): boolean =>
  Math.abs(a - b) < 1e-6 || a.toFixed(2) === b.toFixed(2);

const num = (v: unknown, fallback: string): number =>
  parseFloat(String(v ?? fallback));

/**
 * Rules (defaults) — compareMode `exact`: measured mm Al must equal the stated value for that kV band.
 * compareMode `minimum`: PASS when measured mm Al is greater than or equal to the stated value.
 */
export function evaluateTotalFiltrationPassFail(
  atKvp: string | number | null | undefined,
  measuredMmAl: string | number | null | undefined,
  filtrationTolerance?: FiltrationToleranceBands | null,
  compareMode: TotalFiltrationCompareMode = "minimum"
): { remark: FiltrationPassFail; requiredMmAl: number } {
  const ft = filtrationTolerance || {};
  const kvp = parseFloat(String(atKvp ?? ""));
  const measured = parseFloat(String(measuredMmAl ?? ""));
  const t1 = num(ft.kvThreshold1 ?? ft.kvp1, "70");
  const t2 = num(ft.kvThreshold2 ?? ft.kvp2, "100");
  const exactLow = num(ft.forKvLessThan70 ?? ft.forKvGreaterThan70 ?? ft.value1, "1.5");
  const exactMid = num(ft.forKvBetween70And100 ?? ft.value2, "2.0");
  const exactHigh = num(ft.forKvGreaterThan100 ?? ft.value3, "2.5");

  if (isNaN(kvp) || isNaN(measured) || isNaN(t1) || isNaN(t2)) {
    return { remark: "-", requiredMmAl: NaN };
  }

  let requiredMmAl: number;
  if (kvp <= t1) {
    requiredMmAl = exactLow;
  } else if (kvp <= t2) {
    requiredMmAl = exactMid;
  } else {
    requiredMmAl = exactHigh;
  }

  if (isNaN(requiredMmAl)) {
    return { remark: "-", requiredMmAl: NaN };
  }

  const passes =
    compareMode === "minimum"
      ? measured >= requiredMmAl
      : sameMmAl(measured, requiredMmAl);

  return {
    remark: passes ? "PASS" : "FAIL",
    requiredMmAl,
  };
}
