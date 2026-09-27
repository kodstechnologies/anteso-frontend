import { formatDegreeAfterValue } from "./shared/mainTestTableDisplay";

/** Format central beam observed tilt for display (degree symbol after value). */
export function formatCentralBeamObservedTilt(value: unknown): string {
  return formatDegreeAfterValue(value);
}
