/** Parse Radiography-Fixed-style TEST: table CSV/Excel into FixedRadioFluro Field Name/Value rows. */

export type FluroParsedRow = {
  "Field Name": string;
  Value: string;
  "Row Index": string;
  "Test Name": string;
};

const pushRow = (
  rows: FluroParsedRow[],
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

const isExposureConditionRow = (line: string): boolean => {
  const cond = splitLine(line);
  const label0 = (cond[0] || "").toLowerCase();
  if (!/^(fdd|fcd|ffd)(\s*\(cm\))?$/.test(label0)) return false;
  const distanceVal = cond[1] || "";
  return distanceVal !== "" && !isNaN(Number(distanceVal));
};

const resolveTestName = (label: string): string | null => {
  const u = label.trim().toUpperCase();
  if (u.includes("CONGRUENCE") && u.includes("RADIATION")) return "Congruence of Radiation";
  if (u.includes("CENTRAL BEAM")) return "Central Beam Alignment";
  if (u.includes("EFFECTIVE FOCAL SPOT")) return "Effective Focal Spot";
  if (u.includes("ACCURACY OF IRRADIATION")) return "Accuracy of Irradiation Time";
  if (u.includes("TOTAL FILTRATION")) return "Total Filtration";
  if (u.includes("LINEARITY") && u.includes("MAS")) return "Linearity of mAs Loading";
  if (u.includes("LINEARITY") && u.includes("MA")) return "Linearity of mA Loading";
  if (u.includes("OUTPUT CONSISTENCY") || u.includes("CONSISTENCY OF RADIATION")) return "Output Consistency";
  if (u.includes("LOW CONTRAST")) return "Low Contrast Resolution";
  if (u.includes("HIGH CONTRAST")) return "High Contrast Resolution";
  if (u.includes("EXPOSURE RATE")) return "Exposure Rate Table Top";
  if (u.includes("TUBE HOUSING") || u.includes("LEAKAGE")) return "Tube Housing Leakage";
  if (u.includes("RADIATION PROTECTION")) return "Radiation Protection Survey";
  return null;
};

export const isFixedRadioFluroTableFormat = (text: string): boolean =>
  /(^|\n)\s*TEST:/i.test(text);

export const parseFixedRadioFluroTableCSV = (text: string): FluroParsedRow[] => {
  const lines = text.split(/\r?\n/);
  const rows: FluroParsedRow[] = [];

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

    const label = raw.slice(5).split(",")[0].trim().toUpperCase();
    const testName = resolveTestName(label);
    if (!testName) {
      i++;
      continue;
    }

    // --- Congruence ---
    if (testName === "Congruence of Radiation") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "TechniqueFactors_FFD", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "TechniqueFactors_kV", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "TechniqueFactors_mAs", cond[5], 0);

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const dim = cells[0] || "";
        if (!dim || dim.toLowerCase() === "dimension") {
          j++;
          continue;
        }
        pushRow(rows, testName, "CongruenceMeasurement_Dimension", dim, rowIdx);
        if (cells[1]) pushRow(rows, testName, "CongruenceMeasurement_ObservedShift", cells[1], rowIdx);
        if (cells[2]) pushRow(rows, testName, "CongruenceMeasurement_EdgeShift", cells[2], rowIdx);
        if (cells[3]) pushRow(rows, testName, "CongruenceMeasurement_Tolerance", cells[3], rowIdx);
        rowIdx++;
        j++;
      }
      i = j;
      continue;
    }

    // --- Central Beam ---
    if (testName === "Central Beam Alignment") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "TestConditions_FFD", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "TestConditions_kV", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "TestConditions_mAs", cond[5], 0);

      for (let j = i + 2; j < Math.min(lines.length, i + 8); j++) {
        const cells = splitLine(lines[j].trim());
        const lc = (cells[0] || "").toLowerCase();
        const val = cells[1] || "";
        if (lc.includes("observed tilt x")) pushRow(rows, testName, "ObservedTilt_X", val, 0);
        else if (lc.includes("observed tilt y")) pushRow(rows, testName, "ObservedTilt_Y", val, 0);
        else if (lc === "observed tilt (cm)" || lc === "observed tilt") pushRow(rows, testName, "ObservedTilt_X", val, 0);
        else if (lc === "tolerance operator") pushRow(rows, testName, "Tolerance_Operator", val, 0);
        else if (lc.startsWith("tolerance value")) pushRow(rows, testName, "Tolerance_Value", val, 0);
        else if (lc.startsWith("tolerance (cm)")) pushRow(rows, testName, "Tolerance_Value", val, 0);
      }
      i = i + 6;
      continue;
    }

    // --- Effective Focal Spot ---
    if (testName === "Effective Focal Spot") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "FFD", cond[1], 0);

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const focus = cells[0] || "";
        if (!focus || focus.toLowerCase() === "focus type") {
          j++;
          continue;
        }
        pushRow(rows, testName, "FocalSpot_FocusType", focus, rowIdx);
        if (cells[1]) pushRow(rows, testName, "FocalSpot_StatedNominal", cells[1], rowIdx);
        if (cells[2]) pushRow(rows, testName, "FocalSpot_MeasuredNominal", cells[2], rowIdx);
        rowIdx++;
        j++;
      }
      i = j;
      continue;
    }

    // --- Accuracy of Irradiation Time ---
    if (testName === "Accuracy of Irradiation Time") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "TestConditions_FDD", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "TestConditions_kV", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "TestConditions_ma", cond[5], 0);

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        if (lc === "tolerance operator") {
          pushRow(rows, testName, "Tolerance_Operator", cells[1] || "", 0);
        } else if (lc.startsWith("tolerance value")) {
          pushRow(rows, testName, "Tolerance_Value", cells[1] || "", 0);
        } else if (lc.startsWith("set time")) {
          if (cells[1]) pushRow(rows, testName, "IrradiationTime_SetTime", cells[1], rowIdx);
          if (cells[2]) pushRow(rows, testName, "IrradiationTime_MeasuredTime", cells[2], rowIdx);
          rowIdx++;
        } else if (cells[0] && !isNaN(Number(cells[0]))) {
          pushRow(rows, testName, "IrradiationTime_SetTime", cells[0], rowIdx);
          if (cells[1]) pushRow(rows, testName, "IrradiationTime_MeasuredTime", cells[1], rowIdx);
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Total Filtration ---
    if (testName === "Total Filtration") {
      let headerLineIdx = -1;
      let j = i + 1;
      for (; j < lines.length; j++) {
        const l = lines[j].trim();
        if (!l) continue;
        if (l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        const val = cells[1] || "";
        if (lc === "tolerance sign") pushRow(rows, testName, "Tolerance_Sign", val, 0);
        else if (lc.startsWith("tolerance value")) pushRow(rows, testName, "Tolerance_Value", val, 0);
        else if (lc.startsWith("total filtration required")) pushRow(rows, testName, "TotalFiltration_Required", val, 0);
        else if (lc.startsWith("total filtration at")) pushRow(rows, testName, "TotalFiltration_AtKvp", val, 0);
        else if (lc.startsWith("total filtration measured")) pushRow(rows, testName, "TotalFiltration_Measured", val, 0);
        else if (/^ma station \d+$/i.test(cells[0] || "")) pushRow(rows, testName, "mAStations", val, 0);
        else if (lc.startsWith("applied kvp") || lc.startsWith("applied kv")) {
          headerLineIdx = j;
          break;
        }
      }

      if (headerLineIdx >= 0) {
        let rowIdx = 0;
        j = headerLineIdx + 1;
        while (j < lines.length) {
          const l = lines[j].trim();
          if (!l || l.startsWith("TEST:")) break;
          const cells = splitLine(l);
          const kv = cells[0] || "";
          if (!kv) break;
          pushRow(rows, testName, "Measurement_AppliedKvp", kv, rowIdx);
          for (let c = 1; c < cells.length; c++) {
            const v = cells[c] || "";
            if (v) pushRow(rows, testName, `Measurement_Meas${c}`, v, rowIdx);
          }
          rowIdx++;
          j++;
        }
        i = j;
      } else {
        i = j;
      }
      continue;
    }

    // --- Linearity mA ---
    if (testName === "Linearity of mA Loading") {
      const nextLine = (lines[i + 1] || "").trim();
      if (isExposureConditionRow(nextLine)) {
        const cond = splitLine(nextLine);
        for (let k = 0; k < cond.length - 1; k += 2) {
          const lc = (cond[k] || "").toLowerCase();
          const val = cond[k + 1] || "";
          if (!val) continue;
          if (/fdd|fcd|ffd/.test(lc)) pushRow(rows, testName, "Table1_FDD", val, 0);
          else if (lc === "kv") pushRow(rows, testName, "Table1_kV", val, 0);
          else if (/time/.test(lc)) pushRow(rows, testName, "Table1_Time", val, 0);
        }
        let rowIdx = 0;
        let j = i + 3;
        while (j < lines.length) {
          const l = lines[j].trim();
          if (!l || l.startsWith("TEST:")) break;
          const cells = splitLine(l);
          const labelCell = cells[0] || "";
          if (labelCell === "Tolerance Operator") pushRow(rows, testName, "ToleranceOperator", cells[1] || "", 0);
          else if (labelCell.startsWith("Tolerance")) pushRow(rows, testName, "Tolerance", cells[1] || "", 0);
          else if (labelCell && !isNaN(Number(labelCell))) {
            pushRow(rows, testName, "Table2_ma", labelCell, rowIdx);
            for (let c = 1; c < cells.length; c++) {
              const v = cells[c] || "";
              if (v) pushRow(rows, testName, `Table2_Meas${c}`, v, rowIdx);
            }
            rowIdx++;
          }
          j++;
        }
        i = j;
        continue;
      }
      i++;
      continue;
    }

    // --- Linearity mAs ---
    if (testName === "Linearity of mAs Loading") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Table1_FDD", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Table1_kV", cond[3], 0);

      const headerCells = splitLine(lines[i + 2] || "");
      const headerLabel = (headerCells[0] || "").trim();
      if (/^mAs\s*(Applied|Range)/i.test(headerLabel)) {
        for (let c = 1; c < headerCells.length; c++) {
          const h = headerCells[c];
          if (!h) continue;
          if (/^(average|mR\/mAs|col|remarks?)$/i.test(h)) break;
          pushRow(rows, testName, "MeasHeader", h, 0);
        }
      } else {
        for (let c = 1; c < headerCells.length; c++) {
          const h = headerCells[c];
          if (h && /meas|reading/i.test(h)) pushRow(rows, testName, "MeasHeader", h, 0);
        }
      }

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const labelCell = cells[0] || "";
        const lc = labelCell.toLowerCase();
        if (labelCell === "Tolerance Operator") pushRow(rows, testName, "ToleranceOperator", cells[1] || "", 0);
        else if (lc.startsWith("tolerance")) pushRow(rows, testName, "Tolerance", cells[1] || "", 0);
        else if (
          labelCell &&
          labelCell !== "mAs Range" &&
          labelCell !== "mAs Applied" &&
          !lc.startsWith("tolerance")
        ) {
          pushRow(rows, testName, "Table2_mAsApplied", labelCell, rowIdx);
          for (let c = 1; c < cells.length; c++) {
            pushRow(rows, testName, `Table2_Meas${c}`, cells[c] || "", rowIdx);
          }
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Output Consistency ---
    if (testName === "Output Consistency") {
      const ffdLine = splitLine(lines[i + 1] || "");
      if (ffdLine[1]) pushRow(rows, testName, "FDD", ffdLine[1], 0);

      const headerCells = splitLine(lines[i + 2] || "");
      const firstHeader = (headerCells[0] || "").trim();
      const secondHeader = (headerCells[1] || "").trim();
      if (/^kvp$/i.test(firstHeader) && /^mas$/i.test(secondHeader)) {
        for (let c = 2; c < headerCells.length; c++) {
          const h = headerCells[c];
          if (!h) continue;
          if (/^(mean|cov|remarks?)$/i.test(h)) break;
          pushRow(rows, testName, "MeasHeader", h, 0);
        }
      } else {
        for (let c = 2; c < headerCells.length; c++) {
          const h = headerCells[c];
          if (h && /meas|reading/i.test(h)) pushRow(rows, testName, "MeasHeader", h, 0);
        }
      }

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        if (lc === "tolerance operator") pushRow(rows, testName, "Tolerance_Operator", cells[1] || "", 0);
        else if (lc.startsWith("tolerance value") || lc.startsWith("tolerance (cov)")) {
          pushRow(rows, testName, "Tolerance_Value", cells[1] || "", 0);
        } else if (cells[0] && !isNaN(Number(cells[0]))) {
          if (cells[0]) pushRow(rows, testName, "OutputRow_kV", cells[0], rowIdx);
          if (cells[1]) pushRow(rows, testName, "OutputRow_mAs", cells[1], rowIdx);
          for (let c = 2; c < cells.length; c++) {
            pushRow(rows, testName, `OutputRow_Meas${c - 1}`, cells[c] || "", rowIdx);
          }
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Low Contrast ---
    if (testName === "Low Contrast Resolution") {
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l) {
          j++;
          continue;
        }
        if (l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        const val = cells[1] || "";
        if (lc.includes("recommended")) pushRow(rows, testName, "RecommendedStandard", val, 0);
        else if (lc.includes("smallest hole")) pushRow(rows, testName, "SmallestHoleSize", val, 0);
        j++;
      }
      i = j;
      continue;
    }

    // --- High Contrast ---
    if (testName === "High Contrast Resolution") {
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l) {
          j++;
          continue;
        }
        if (l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        const val = cells[1] || "";
        if (lc.includes("measured")) pushRow(rows, testName, "MeasuredLpPerMm", val, 0);
        else if (lc.includes("recommended")) pushRow(rows, testName, "RecommendedStandard", val, 0);
        j++;
      }
      i = j;
      continue;
    }

    // --- Exposure Rate ---
    if (testName === "Exposure Rate Table Top") {
      let rowIdx = 0;
      let j = i + 2;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        if (lc.includes("tolerance aec")) pushRow(rows, testName, "Tolerance_AecTolerance", cells[1] || "", 0);
        else if (lc.includes("tolerance non-aec") || lc.includes("non-aec")) {
          pushRow(rows, testName, "Tolerance_NonAecTolerance", cells[1] || "", 0);
        } else if (lc.includes("min focus")) pushRow(rows, testName, "Tolerance_MinFocusDistance", cells[1] || "", 0);
        else if (cells[0] && !isNaN(Number(cells[0]))) {
          pushRow(rows, testName, "ExposureRateRow_Distance", cells[0], rowIdx);
          if (cells[1]) pushRow(rows, testName, "ExposureRateRow_AppliedKv", cells[1], rowIdx);
          if (cells[2]) pushRow(rows, testName, "ExposureRateRow_AppliedMa", cells[2], rowIdx);
          if (cells[3]) pushRow(rows, testName, "ExposureRateRow_Exposure", cells[3], rowIdx);
          if (cells[4]) pushRow(rows, testName, "ExposureRateRow_Remark", cells[4], rowIdx);
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Tube Housing Leakage ---
    if (testName === "Tube Housing Leakage") {
      const cond = splitLine(lines[i + 1] || "");
      if (cond[1]) pushRow(rows, testName, "Settings_FDD", cond[1], 0);
      if (cond[3]) pushRow(rows, testName, "Settings_kV", cond[3], 0);
      if (cond[5]) pushRow(rows, testName, "Settings_ma", cond[5], 0);
      if (cond[7]) pushRow(rows, testName, "Settings_time", cond[7], 0);
      if (cond[9]) pushRow(rows, testName, "Workload", cond[9], 0);

      let rowIdx = 0;
      let j = i + 2;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        if (lc.startsWith("tolerance value")) pushRow(rows, testName, "ToleranceValue", cells[1] || "", 0);
        else if (lc === "tolerance operator") pushRow(rows, testName, "ToleranceOperator", cells[1] || "", 0);
        else if (lc.startsWith("tolerance time")) pushRow(rows, testName, "ToleranceTime", cells[1] || "", 0);
        else if (lc === "location") {
          j++;
          continue;
        } else if (cells[0] && cells[0].toLowerCase() !== "location") {
          pushRow(rows, testName, "LeakageMeasurement_Location", cells[0], rowIdx);
          if (cells[1]) pushRow(rows, testName, "LeakageMeasurement_Left", cells[1], rowIdx);
          if (cells[2]) pushRow(rows, testName, "LeakageMeasurement_Right", cells[2], rowIdx);
          if (cells[3]) pushRow(rows, testName, "LeakageMeasurement_Front", cells[3], rowIdx);
          if (cells[4]) pushRow(rows, testName, "LeakageMeasurement_Back", cells[4], rowIdx);
          if (cells[5]) pushRow(rows, testName, "LeakageMeasurement_Top", cells[5], rowIdx);
          rowIdx++;
        }
        j++;
      }
      i = j;
      continue;
    }

    // --- Radiation Protection Survey ---
    if (testName === "Radiation Protection Survey") {
      const cond = splitLine(lines[i + 1] || "");
      for (let k = 0; k < cond.length - 1; k += 2) {
        const lc = (cond[k] || "").toLowerCase();
        const val = cond[k + 1] || "";
        if (!val) continue;
        if (lc.includes("applied current")) pushRow(rows, testName, "AppliedCurrent", val, 0);
        else if (lc.includes("applied voltage")) pushRow(rows, testName, "AppliedVoltage", val, 0);
        else if (lc.includes("exposure time")) pushRow(rows, testName, "ExposureTime", val, 0);
        else if (lc.includes("workload")) pushRow(rows, testName, "Workload", val, 0);
      }

      let rowIdx = 0;
      let j = i + 3;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l || l.startsWith("TEST:")) break;
        const cells = splitLine(l);
        const lc = (cells[0] || "").toLowerCase();
        if (lc === "location" || lc === "survey date") {
          j++;
          continue;
        }
        pushRow(rows, testName, "Location_Location", cells[0], rowIdx);
        if (cells[1]) pushRow(rows, testName, "Location_mRPerHr", cells[1], rowIdx);
        if (cells[2]) pushRow(rows, testName, "Location_Category", cells[2], rowIdx);
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

export const parseFixedRadioFluroTableMatrix = (matrix: any[][]): FluroParsedRow[] => {
  const text = matrix
    .map((row) =>
      (Array.isArray(row) ? row : [])
        .map((c) => (c !== undefined && c !== null ? String(c) : ""))
        .join(",")
    )
    .join("\n");
  return parseFixedRadioFluroTableCSV(text);
};
