/** Format central beam observed tilt for display (degree symbol before value). */
export function formatCentralBeamObservedTilt(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  const s = String(value).trim();
  if (!s || s === "-") return "-";
  return `°${s}`;
}
