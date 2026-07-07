/** Parse Mobile-style TEST: table CSV/Excel rows into Portable Field Name/Value rows. */

export type PortableParsedRow = {
  "Field Name": string;
  Value: string;
  "Row Index": string;
  "Test Name": string;
};

const pushRow = (
  rows: PortableParsedRow[],
  testName: string,
  fieldName: string,
  value: string,
  rowIndex: number
) => {
  const v = String(value ?? "").trim();
  if (!v) return;
  rows.push({
    "Field Name": fieldName,
    Value: v,
    "Row Index": String(Number.isFinite(rowIndex) ? rowIndex : 0),
    "Test Name": testName,
  });
};

const splitLine = (line: string) => line.split(",").map((c) => (c || "").trim());

const resolveTestName = (label: string): string | null => {
  const u = label.trim().toUpperCase();
  if (u.includes("CONGRUENCE") && u.includes("RADIATION")) return "Congruence of Radiation";
  if (u.includes("CENTRAL BEAM")) return "Central Beam Alignment";
  if (u.includes("EFFECTIVE FOCAL SPOT")) return "Effective Focal Spot";
  if (u.includes("ACCURACY OF IRRADIATION")) return "Accuracy of Irradiation Time";
  if (u.includes("ACCURACY OF OPERATING")) return "Accuracy of Operating Potential";
  if (u.includes("LINEARITY") && u.includes("MAS")) return "Linearity Of mAs Loading";
  if (u.includes("LINEARITY") && u.includes("MA")) return "Linearity Of mA Loading";
  if (u.includes("CONSISTENCY") || u.includes("OUTPUT CONSISTENCY")) return "Consistency of Radiation Output";
  if (u.includes("LEAKAGE") || u.includes("TUBE HOUSING")) return "Radiation Leakage Level";
  return null;
};

const isVerticalMetadataRow = (row: any[]): boolean => {
  if (!Array.isArray(row) || row.length === 0) return false;
  const c0 = String(row[0] ?? "").trim();
  const c1 = String(row[1] ?? "").trim();
  const c2 = String(row[2] ?? "").trim();

  if (c0 === "Tolerance Sign" || c0.startsWith("Tolerance Value")) return true;
  if (c0.startsWith("Total Filtration")) return true;
  if (c0 === "Dimension") return true;
  if (c0 === "Set Time (s)" || c0 === "Set Time (ms)") return true;
  if (c0 === "mAs Applied") return true;
  if (c0 === "Location") return true;
  if (c0.startsWith("Applied kVp") || c0.startsWith("Applied kV")) return true;
  if (c0 === "Focus Type") return true;

  // Vertical: FCD/FFD/FDD (cm),100,kV,80,mAs,10
  if (/^(FCD|FFD|FDD)(\s*\(cm\))?$/i.test(c0) && (c2 === "kV" || c2 === "kVp")) return true;
  // Vertical: FCD/FFD/FDD (cm),60 (effective focal spot)
  if (/^(FCD|FFD|FDD)(\s*\(cm\))?$/i.test(c0) && c1 !== "" && !/^(kVp|kV|Focus Type|mAs|Field Size)/i.test(c1)) return true;

  // Vertical: FFD (cm),100 (consistency)
  if (c0 === "FFD (cm)" && c1 !== "" && !/^kVp$/i.test(c1)) return true;
  if (c0 === "FDD (cm)" && c1 !== "" && !/^kVp$/i.test(c1)) return true;

  return false;
};

export const isPortableTableFormat = (matrix: any[][]): boolean => {
  for (let i = 0; i < matrix.length; i++) {
    const cell = String(matrix[i]?.[0] ?? "").trim();
    if (!cell.startsWith("TEST:")) continue;
    const nextRow = matrix[i + 1];
    if (!Array.isArray(nextRow)) return false;
    return isVerticalMetadataRow(nextRow);
  }
  return false;
};

export const matrixToLines = (matrix: any[][]): string[] =>
  matrix.map((row) =>
    (Array.isArray(row) ? row : [])
      .map((c) => (c !== undefined && c !== null ? String(c) : ""))
      .join(",")
  );

export const parsePortableTableCSV = (text: string): PortableParsedRow[] => {
  const lines = text.split(/\r?\n/);
  const rows: PortableParsedRow[] = [];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i].trim();
    if (!raw) {
      i++;
      continue;
    }

    if (!raw.startsWith("TEST:")) {
      i++;
      continue;
    }

    const label = raw.slice(5).split(",")[0].trim();
    const testName = resolveTestName(label);
    if (!testName) {
      i++;
      continue;
    }

    // --- Congruence ---
    if (testName === "Congruence of Radiation") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_FCD", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Table1_kvp", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "Table1_mas", cond[5], 0);

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const dim = cells[0] || "";
        const obs = cells[1] || "";
        const edge = cells[2] || "";
        const tol = cells[3] || cells[4] || "";
        const dimL = dim.toLowerCase();
        if (dimL === "length" || dim.includes("X")) {
          pushRow(rows, testName, "Table2_deviationX", obs, 0);
          pushRow(rows, testName, "Table2_edgeShiftX", edge, 0);
          if (tol) pushRow(rows, testName, "Tolerance_Value", tol, 0);
          rowIdx = 1;
        } else if (dimL === "width" || dim.includes("Y")) {
          pushRow(rows, testName, "Table2_deviationY", obs, 1);
          pushRow(rows, testName, "Table2_edgeShiftY", edge, 1);
          if (tol) pushRow(rows, testName, "Tolerance_Value", tol, 1);
          rowIdx = 2;
        } else if (dim) {
          pushRow(rows, testName, "Table2_deviationX", obs, rowIdx);
          pushRow(rows, testName, "Table2_edgeShift", edge, rowIdx);
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Central Beam ---
    if (testName === "Central Beam Alignment") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_fcd", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Table1_kv", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "Table1_mas", cond[5], 0);
      const obs = splitLine(lines[i + 2] || "");
      if (obs[1]) pushRow(rows, testName, "Table2_observedTilt", obs[1], 0);
      const tol = splitLine(lines[i + 3] || "");
      if (tol[1]) pushRow(rows, testName, "Tolerance_Value", tol[1], 0);
      i += 4;
      continue;
    }

    // --- Effective Focal Spot ---
    if (testName === "Effective Focal Spot") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_fcd", cond[1], 0);

      const header = splitLine(lines[i + 2] || "").map((h) => h.toLowerCase());
      const colIndex = (predicates: ((h: string) => boolean)[]) =>
        header.findIndex((h) => predicates.some((p) => p(h)));
      const idxFocus = colIndex([(h) => h.includes("focus")]);
      const idxStatedNom = colIndex([(h) => h.includes("stated focal") || h.includes("stated nominal")]);
      const idxMeasNom = colIndex([
        (h) => h.includes("measured focal") || (h.includes("measured") && h.includes("nominal")),
      ]);
      const useNominal = idxStatedNom >= 0 && idxMeasNom >= 0;

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const get = (idx: number) => (idx >= 0 ? cells[idx] || "" : "");
        const fType = get(idxFocus >= 0 ? idxFocus : 0);
        if (!fType) {
          j++;
          continue;
        }
        pushRow(rows, testName, "Table2_focusType", fType, rowIdx);
        if (useNominal) {
          pushRow(rows, testName, "Table2_statedNominal", get(idxStatedNom), rowIdx);
          pushRow(rows, testName, "Table2_measuredNominal", get(idxMeasNom), rowIdx);
        } else {
          pushRow(rows, testName, "Table2_statedWidth", get(1), rowIdx);
          pushRow(rows, testName, "Table2_statedHeight", get(2), rowIdx);
          pushRow(rows, testName, "Table2_measuredWidth", get(3), rowIdx);
          pushRow(rows, testName, "Table2_measuredHeight", get(4), rowIdx);
        }
        rowIdx++;
        j++;
      }
      i = j;
      continue;
    }

    // --- Accuracy of Irradiation Time ---
    if (testName === "Accuracy of Irradiation Time") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_fcd", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Table1_kv", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "Table1_ma", cond[5], 0);

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        if (l.startsWith("Tolerance")) {
          const cells = splitLine(l);
          if (cells[0] === "Tolerance Operator") pushRow(rows, testName, "Tolerance_operator", cells[1], 0);
          if (cells[0].startsWith("Tolerance Value")) pushRow(rows, testName, "Tolerance_Value", cells[1], 0);
          j++;
          continue;
        }
        const cells = splitLine(l);
        const setT = cells[0] || "";
        const measT = cells[1] || "";
        if (setT || measT) {
          pushRow(rows, testName, "Table2_setTime", setT, rowIdx);
          pushRow(rows, testName, "Table2_measuredTime", measT, rowIdx);
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Accuracy of Operating Potential ---
    if (testName === "Accuracy of Operating Potential") {
      let headerLineIdx = -1;
      let j = i + 1;
      for (; j < lines.length; j++) {
        const l = lines[j].trim();
        if (!l) continue;
        if (l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const labelCell = cells[0] || "";
        const valCell = cells[1] || "";
        if (labelCell.startsWith("Applied kVp") || labelCell.startsWith("Applied kV")) {
          headerLineIdx = j;
          break;
        }
        if (labelCell === "Tolerance Sign" || labelCell.startsWith("Tolerance Sign")) {
          pushRow(rows, testName, "Tolerance_Sign", valCell, 0);
        } else if (labelCell.startsWith("Tolerance Value")) {
          pushRow(rows, testName, "Tolerance_Value", valCell, 0);
        } else if (labelCell.startsWith("Total Filtration Measured")) {
          pushRow(rows, testName, "TotalFiltration_Measured", valCell, 0);
        } else if (labelCell.startsWith("Total Filtration Required")) {
          pushRow(rows, testName, "TotalFiltration_Required", valCell, 0);
        } else if (labelCell.startsWith("Total Filtration At kVp") || labelCell === "At kVp") {
          pushRow(rows, testName, "TotalFiltration_AtKvp", valCell, 0);
        }
      }

      if (headerLineIdx >= 0) {
        const header = splitLine(lines[headerLineIdx]);
        const stations: string[] = [];
        for (let c = 1; c < header.length; c++) {
          const h = header[c] || "";
          if (h) {
            stations.push(h);
            pushRow(rows, testName, "MeasHeader", h, 0);
          }
        }
        let rowIdx = 0;
        j = headerLineIdx + 1;
        while (j < lines.length) {
          const l = lines[j].trim();
          if (!l || l.startsWith("TEST:")) break;
          const cells = splitLine(l);
          const applied = cells[0] || "";
          if (!applied) {
            j++;
            continue;
          }
          pushRow(rows, testName, "Table2_setKV", applied, rowIdx);
          pushRow(rows, testName, "Measurement_AppliedKvp", applied, rowIdx);
          for (let c = 1; c < cells.length; c++) {
            const v = cells[c] || "";
            if (!v) continue;
            pushRow(rows, testName, `Measurement_Meas${c}`, v, rowIdx);
            if (c === 1) pushRow(rows, testName, "Table2_ma10", v, rowIdx);
            if (c === 2) pushRow(rows, testName, "Table2_ma100", v, rowIdx);
            if (c === 3) pushRow(rows, testName, "Table2_ma200", v, rowIdx);
          }
          rowIdx++;
          j++;
        }
        i = j;
        continue;
      }
    }

    // --- Linearity mAs ---
    if (testName === "Linearity Of mAs Loading") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_fcd", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Table1_kv", cond[3], 0);

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const mAs = cells[0] || "";
        if (mAs && !isNaN(Number(mAs))) {
          pushRow(rows, testName, "Table2_mAsRange", mAs, rowIdx);
          pushRow(rows, testName, "Table2_meas1", cells[1] || "", rowIdx);
          pushRow(rows, testName, "Table2_meas2", cells[2] || "", rowIdx);
          pushRow(rows, testName, "Table2_meas3", cells[3] || "", rowIdx);
          rowIdx++;
        } else if (cells[0] === "Tolerance Operator") {
          pushRow(rows, testName, "Tolerance_operator", cells[1] || "", 0);
        } else if (cells[0].startsWith("Tolerance")) {
          pushRow(rows, testName, "Tolerance_Value", cells[1] || "", 0);
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Linearity mA ---
    if (testName === "Linearity Of mA Loading") {
      const header = splitLine(lines[i + 1] || "");
      const col = (name: string) =>
        header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
      const idxFcd = col("FCD (cm)") >= 0 ? col("FCD (cm)") : col("FCD");
      const idxKv = col("kV");
      const idxTime = col("Time (sec)") >= 0 ? col("Time (sec)") : col("Time");
      const idxMa = col("mA Applied") >= 0 ? col("mA Applied") : col("mAs Applied");
      const idxMeas = [1, 2, 3].map((n) => col(`Meas ${n}`)).filter((idx) => idx >= 0);

      let rowIdx = 0;
      for (let j = i + 2; j < lines.length; j++) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const fcd = idxFcd >= 0 ? cells[idxFcd] || "" : "";
        const kv = idxKv >= 0 ? cells[idxKv] || "" : "";
        const time = idxTime >= 0 ? cells[idxTime] || "" : "";
        const ma = idxMa >= 0 ? cells[idxMa] || "" : "";
        if (fcd) pushRow(rows, testName, "Table1_fcd", fcd, 0);
        if (kv) pushRow(rows, testName, "Table1_kv", kv, 0);
        if (time) pushRow(rows, testName, "Table1_time", time, 0);
        if (ma && !isNaN(Number(ma))) {
          pushRow(rows, testName, "Table2_ma", ma, rowIdx);
          idxMeas.forEach((mIdx, mi) => {
            pushRow(rows, testName, `Table2_meas${mi + 1}`, cells[mIdx] || "", rowIdx);
          });
          rowIdx++;
        } else if (cells[0] === "Tolerance Operator") {
          pushRow(rows, testName, "Tolerance_operator", cells[1] || "", 0);
        } else if (cells[0].startsWith("Tolerance")) {
          pushRow(rows, testName, "Tolerance_Value", cells[1] || "", 0);
        }
      }
      i = i + 2 + rowIdx;
      continue;
    }

    // --- Consistency of Radiation Output ---
    if (testName === "Consistency of Radiation Output") {
      const ffdLine = splitLine(lines[i + 1] || "");
      const ffd = ffdLine[1] || "";
      if (ffd) {
        pushRow(rows, testName, "Table1_value", ffd, 0);
        pushRow(rows, testName, "FCD", ffd, 0);
      }

      const dataLine = lines[i + 3] || "";
      const cells = splitLine(dataLine);
      const rowIdx = 0;
      if (cells[0]) pushRow(rows, testName, "Table2_kv", cells[0], rowIdx);
      if (cells[1]) pushRow(rows, testName, "Table2_mas", cells[1], rowIdx);
      for (let c = 2; c < cells.length; c++) {
        const v = cells[c] || "";
        if (!v) continue;
        pushRow(rows, testName, `Table2_reading${c - 1}`, v, rowIdx);
        pushRow(rows, testName, `OutputRow_Meas${c - 1}`, v, rowIdx);
      }

      for (let j = i + 4; j < Math.min(lines.length, i + 8); j++) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const parts = splitLine(l);
        if (parts[0] === "Tolerance Operator") pushRow(rows, testName, "Tolerance_Operator", parts[1], 0);
        if (parts[0].startsWith("Tolerance")) pushRow(rows, testName, "Tolerance_Value", parts[1], 0);
      }
      i += 6;
      continue;
    }

    // --- Radiation Leakage ---
    if (testName === "Radiation Leakage Level") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_fcd", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Table1_kv", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "Table1_ma", cond[5], 0);
      if (cond[7]) pushRow(rows, testName, "Table1_time", cond[7], 0);
      if (cond[9]) pushRow(rows, testName, "Workload", cond[9], 0);

      const tolVal = splitLine(lines[i + 2] || "");
      if (tolVal[1]) pushRow(rows, testName, "Tolerance_Value", tolVal[1], 0);
      const tolOp = splitLine(lines[i + 3] || "");
      if (tolOp[1]) pushRow(rows, testName, "Tolerance_operator", tolOp[1], 0);

      let rowIdx = 0;
      let j = i + 5;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const loc = cells[0] || "";
        if (!loc) {
          j++;
          continue;
        }
        const location = loc.replace(/\s*-\s*/g, " - ").trim();
        pushRow(rows, testName, "Table2_location", location, rowIdx);
        pushRow(rows, testName, "Table2_left", cells[1] || "", rowIdx);
        pushRow(rows, testName, "Table2_right", cells[2] || "", rowIdx);
        pushRow(rows, testName, "Table2_front", cells[3] || "", rowIdx);
        pushRow(rows, testName, "Table2_back", cells[4] || "", rowIdx);
        pushRow(rows, testName, "Table2_top", cells[5] || "", rowIdx);
        rowIdx++;
        j++;
      }
      i = j;
      continue;
    }

    i++;
  }

  return rows;
};

export const parsePortableTableMatrix = (matrix: any[][]): PortableParsedRow[] =>
  parsePortableTableCSV(matrixToLines(matrix).join("\n"));
