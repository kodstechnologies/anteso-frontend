import { enrichParsedRowsWithMatrixMeasHeaders } from "./enrichMeasHeadersFromMatrix";
import {
  isRadiographyStyleVerticalFormat,
  matrixToCsvText,
  parseRadiographyStyleTableCSV,
  RadiographyStyleDevice,
} from "./parseRadiographyStyleTableFormat";

const VERTICAL_TESTS: Record<RadiographyStyleDevice, Set<string>> = {
  carm: new Set([
    "Total Filtration",
    "Consistency of Radiation Output",
    "Linearity of mA Loading",
    "Linearity of mAs Loading",
  ]),
  oarm: new Set([
    "Total Filtration",
    "Output Consistency",
    "Linearity of mA Loading",
    "Linearity of mAs Loading",
  ]),
};

/** Replace TF / output consistency / linearity rows when file uses Radiography-Fixed vertical layout. */
export const mergeWithRadiographyVerticalParse = (
  parsed: any[],
  matrix: any[][],
  device: RadiographyStyleDevice
): any[] => {
  const text = matrixToCsvText(matrix);
  if (!isRadiographyStyleVerticalFormat(text)) return parsed;

  const vertical = parseRadiographyStyleTableCSV(text, device);
  if (!vertical.length) return parsed;

  const tests = VERTICAL_TESTS[device];
  return [...parsed.filter((r) => !tests.has(r["Test Name"])), ...vertical];
};

/** Same merge for raw CSV text (e.g. O-Arm .csv upload). */
export const mergeTextWithRadiographyVerticalParse = (
  parsed: any[],
  text: string,
  device: RadiographyStyleDevice
): any[] => {
  if (!isRadiographyStyleVerticalFormat(text)) return parsed;

  const vertical = parseRadiographyStyleTableCSV(text, device);
  if (!vertical.length) return parsed;

  const tests = VERTICAL_TESTS[device];
  return [...parsed.filter((r) => !tests.has(r["Test Name"])), ...vertical];
};
