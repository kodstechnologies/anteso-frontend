import { RadiographyStyleDevice } from "./parseRadiographyStyleTableFormat";

const cellStr = (value: unknown) => String(value ?? "").trim();

const TEST_MARKER_TO_NAME: Record<RadiographyStyleDevice, Record<string, string>> = {
  carm: {
    "CONSISTENCY OF RADIATION OUTPUT": "Consistency of Radiation Output",
    "LINEARITY OF MA LOADING": "Linearity of mA Loading",
    "LINEARITY OF MAS LOADING": "Linearity of mAs Loading",
  },
  oarm: {
    "OUTPUT CONSISTENCY": "Output Consistency",
    "LINEARITY OF MA LOADING": "Linearity of mA Loading",
    "LINEARITY OF MAS LOADING": "Linearity of mAs Loading",
  },
};

/** Read meas header labels directly from the Excel/CSV matrix header row (most reliable for xlsx). */
export const extractMeasHeadersByTestFromMatrix = (
  matrix: any[][],
  device: RadiographyStyleDevice
): Record<string, string[]> => {
  const markerMap = TEST_MARKER_TO_NAME[device];
  const result: Record<string, string[]> = {};
  let currentTest = "";

  for (const row of matrix) {
    const c0 = cellStr(row?.[0]);
    if (/^TEST:/i.test(c0)) {
      const marker = c0.replace(/^TEST:\s*/i, "").trim().toUpperCase();
      currentTest = markerMap[marker] || "";
      continue;
    }
    if (!currentTest) continue;
    if (/^TEST:/i.test(c0)) {
      currentTest = "";
      continue;
    }

    const consistencyTest =
      device === "carm" ? "Consistency of Radiation Output" : "Output Consistency";
    if (currentTest === consistencyTest && /^kVp$/i.test(c0) && /^mAs$/i.test(cellStr(row[1]))) {
      const headers = row.slice(2).map(cellStr).filter(Boolean);
      if (headers.length) result[currentTest] = headers;
      continue;
    }

    if (
      (currentTest === "Linearity of mA Loading" || currentTest === "Linearity of mAs Loading") &&
      (/^mAs(\s*Range)?$/i.test(c0) || /^mA\s*Applied$/i.test(c0))
    ) {
      const headers = row.slice(1).map(cellStr).filter(Boolean);
      if (headers.length) result[currentTest] = headers;
    }
  }

  return result;
};

/** Replace Header_* rows with labels read straight from the sheet matrix. */
export const enrichParsedRowsWithMatrixMeasHeaders = (
  parsed: any[],
  matrix: any[][],
  device: RadiographyStyleDevice
): any[] => {
  const headersByTest = extractMeasHeadersByTestFromMatrix(matrix, device);
  if (!Object.keys(headersByTest).length) return parsed;

  const testsWithMatrixHeaders = new Set(Object.keys(headersByTest));
  const kept = parsed.filter((row) => {
    const testName = row["Test Name"];
    const field = String(row["Field Name"] ?? "");
    if (!testsWithMatrixHeaders.has(testName) || !/^Header_\d+$/i.test(field)) return true;
    return false;
  });

  const injected: any[] = [];
  for (const [testName, headers] of Object.entries(headersByTest)) {
    headers.forEach((label, idx) => {
      injected.push({
        "Test Name": testName,
        "Field Name": `Header_${idx + 1}`,
        Value: label,
        "Row Index": "0",
      });
    });
  }

  return [...kept, ...injected];
};
