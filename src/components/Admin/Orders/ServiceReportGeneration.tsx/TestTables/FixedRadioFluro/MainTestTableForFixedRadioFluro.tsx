import React from "react";

interface MainTestTableProps {
  testData: any;
  hasTimer?: boolean;
}

const MainTestTableForFixedRadioFluro: React.FC<MainTestTableProps> = ({ testData, hasTimer = true }) => {
  const rows: any[] = [];
  let srNo = 1;
  const asDisplayNumber = (value: any): string | null => {
    if (value === undefined || value === null || value === "") return null;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isNaN(n) ? String(value).trim() || null : String(Number(n));
  };

  const addRowsForTest = (
    parameter: string,
    testRows: Array<{
      specified: string | number;
      measured: string | number;
      tolerance: string;
      remarks: "Pass" | "Fail";
    }>,
    toleranceRowSpan: boolean = false,
    measuredRowSpan: boolean = false
  ) => {
    if (testRows.length === 0) return;

    const sharedTolerance = toleranceRowSpan ? testRows[0]?.tolerance : null;
    const sharedMeasured = measuredRowSpan ? testRows[0]?.measured : null;

    testRows.forEach((testRow, idx) => {
      rows.push({
        srNo: idx === 0 ? srNo++ : null,
        parameter: idx === 0 ? parameter : null,
        rowSpan: idx === 0 ? testRows.length : 0,
        specified: testRow.specified,
        measured: measuredRowSpan ? (idx === 0 ? sharedMeasured : null) : testRow.measured,
        measuredRowSpan: measuredRowSpan ? (idx === 0 ? testRows.length : 0) : 0,
        hasMeasuredRowSpan: measuredRowSpan,
        tolerance: toleranceRowSpan ? (idx === 0 ? sharedTolerance : null) : testRow.tolerance,
        toleranceRowSpan: toleranceRowSpan ? (idx === 0 ? testRows.length : 0) : 0,
        hasToleranceRowSpan: toleranceRowSpan,
        remarks: testRow.remarks,
        isFirstRow: idx === 0,
      });
    });
  };

  // 1. Congruence of Radiation & Optical Field
  if (testData.congruenceOfRadiation?.congruenceMeasurements && Array.isArray(testData.congruenceOfRadiation.congruenceMeasurements)) {
    const validRows = testData.congruenceOfRadiation.congruenceMeasurements.filter((row: any) => row.dimension || row.percentFED);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const percentFED = row.percentFED || "-";
        const tolerance = row.tolerance || "2";
        const isPass = row.remark === "Pass" || (percentFED !== "-" && parseFloat(percentFED) <= parseFloat(tolerance));
        return {
          specified: row.dimension || "-",
          measured: percentFED !== "-" ? `${percentFED}%` : "-",
          tolerance: `≤ ${tolerance}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Congruence of Radiation & Optical Field", testRows);
    }
  }

  // 2. Central Beam Alignment
  if (testData.centralBeamAlignment?.observedTilt) {
    const tiltValue = testData.centralBeamAlignment.observedTilt.value || "-";
    const toleranceOperator = testData.centralBeamAlignment.tolerance?.operator || "<=";
    const toleranceValue = testData.centralBeamAlignment.tolerance?.value || "5";

    // Determine pass/fail based on tolerance
    let isPass = false;
    if (testData.centralBeamAlignment.observedTilt.remark === "Pass" || testData.centralBeamAlignment.observedTilt.remark === "PASS") {
      isPass = true;
    } else if (testData.centralBeamAlignment.observedTilt.remark === "Fail" || testData.centralBeamAlignment.observedTilt.remark === "FAIL") {
      isPass = false;
    } else if (tiltValue !== "-") {
      const observed = parseFloat(tiltValue);
      const tol = parseFloat(toleranceValue);
      if (!isNaN(observed) && !isNaN(tol)) {
        if (toleranceOperator === "<") {
          isPass = observed < tol;
        } else if (toleranceOperator === ">") {
          isPass = observed > tol;
        } else if (toleranceOperator === "<=") {
          isPass = observed <= tol;
        } else if (toleranceOperator === ">=") {
          isPass = observed >= tol;
        } else if (toleranceOperator === "=") {
          isPass = Math.abs(observed - tol) < 0.01;
        }
      }
    }

    // Format specified value (use tolerance value as specified)
    const specifiedValue = `${toleranceOperator} ${toleranceValue}°`;
    const toleranceDisplay = `${toleranceOperator} ${toleranceValue}°`;

    addRowsForTest("Central Beam Alignment", [{
      specified: specifiedValue,
      measured: tiltValue !== "-" ? `${tiltValue}°` : "-",
      tolerance: toleranceDisplay,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 3. Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((spot: any) => spot.focusType || spot.measuredWidth);
    if (validRows.length > 0) {
      const formatValue = (val: any) => {
        if (val === undefined || val === null || val === "") return null;
        const numVal = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(numVal)) return null;
        return numVal.toFixed(1);
      };

      const toleranceCriteria = testData.effectiveFocalSpot.toleranceCriteria || {};
      const smallMultiplier = parseFloat(toleranceCriteria.small?.multiplier || "0.5");
      const smallLimit = parseFloat(toleranceCriteria.small?.upperLimit || "0.8");
      const mediumMultiplier = parseFloat(toleranceCriteria.medium?.multiplier || "0.4");
      const mediumLower = parseFloat(toleranceCriteria.medium?.lowerLimit || "0.8");
      const mediumUpper = parseFloat(toleranceCriteria.medium?.upperLimit || "1.5");
      const largeMultiplier = parseFloat(toleranceCriteria.large?.multiplier || "0.3");

      const toleranceStr = `+${smallMultiplier} F FOR F < ${smallLimit} mm; +${mediumMultiplier} F FOR ${mediumLower} ≤ F ≤ ${mediumUpper} mm; +${largeMultiplier} F FOR F > ${mediumUpper} mm`;

      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS";
        const statedWidth = formatValue(spot.statedWidth);
        const measuredWidth = formatValue(spot.measuredWidth);

        return {
          specified: statedWidth !== null ? `${statedWidth} mm` : "-",
          measured: measuredWidth !== null ? `${measuredWidth} mm` : "-",
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows, true);
    }
  }

  // 4. Accuracy of Irradiation Time
  if (testData.accuracyOfIrradiationTime?.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.accuracyOfIrradiationTime.tolerance?.value || "5";
      const testRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const measuredTime = parseFloat(row.measuredTime);
        let error = "-";
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
          const errorVal = parseFloat(error);
          const tol = parseFloat(toleranceValue);

          if (toleranceOperator === "<=") isPass = errorVal <= tol;
          else if (toleranceOperator === ">=") isPass = errorVal >= tol;
          else if (toleranceOperator === "=") isPass = Math.abs(errorVal - tol) < 0.01;
        }

        return {
          specified: row.setTime || "-",
          measured: row.measuredTime || "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time(sec)", testRows);
    }
  }

  // 5. Accuracy of Operating Potential (kVp Accuracy)
  if (testData.accuracyOfOperatingPotential?.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKV || row.avgKvp);
    if (validRows.length > 0) {
      const toleranceSignRaw =
        testData.accuracyOfOperatingPotential.tolerance?.sign ||
        testData.accuracyOfOperatingPotential.toleranceSign ||
        "±";
      let toleranceSign = toleranceSignRaw;
      if (typeof toleranceSignRaw === "string") {
        const lowered = toleranceSignRaw.toLowerCase().replace(/\s+/g, "");
        if (lowered.includes("plus") && lowered.includes("minus")) toleranceSign = "±";
        else if (lowered === "plus") toleranceSign = "+";
        else if (lowered === "minus") toleranceSign = "-";
      }

      const toleranceValue =
        testData.accuracyOfOperatingPotential.tolerance?.value ||
        testData.accuracyOfOperatingPotential.toleranceValue ||
        "2.0";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") isPass = true;
        else if (row.remarks === "FAIL" || row.remarks === "Fail") isPass = false;
        else {
          const appliedKvp = parseFloat(row.setKV);
          const avgKvp = parseFloat(row.avgKvp);
          if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }
        }
        return {
          specified: row.setKV || "-",
          measured: row.avgKvp || "-",
          tolerance: `${toleranceSign} ${toleranceValue} kVp`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 6. Total Filtration accuracy of operating potential (optional intermediate)
  if (testData.totalFiltration?.measurements && Array.isArray(testData.totalFiltration.measurements)) {
    const validRows = testData.totalFiltration.measurements.filter((row: any) => row.appliedKvp || row.averageKvp || row.measuredValues);
    if (validRows.length > 0) {
      const toleranceSign = testData.totalFiltration.tolerance?.sign || "±";
      const toleranceValue = testData.totalFiltration.tolerance?.value || "2.0";
      const testRows = validRows.map((row: any) => {
        let avgKvpNum: number | null = null;
        if (row.averageKvp !== undefined && row.averageKvp !== null && row.averageKvp !== "") {
          const val = parseFloat(row.averageKvp);
          if (!isNaN(val)) avgKvpNum = val;
        }
        if (avgKvpNum === null && Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          const vals = row.measuredValues.map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v));
          if (vals.length > 0) avgKvpNum = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        }
        let measuredDisplay: string;
        if (avgKvpNum !== null) measuredDisplay = avgKvpNum.toFixed(2);
        else if (Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          measuredDisplay = row.measuredValues.filter((v: any) => v !== undefined && v !== null && v !== "").join(", ") || "-";
        } else {
          measuredDisplay = "-";
        }

        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") isPass = true;
        else if (row.remarks === "FAIL" || row.remarks === "Fail") isPass = false;
        else if (avgKvpNum !== null) {
          const appliedKvp = parseFloat(row.appliedKvp);
          if (!isNaN(appliedKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvpNum - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            if (!isNaN(tol)) isPass = deviation <= tol;
          }
        }
        return {
          specified: row.appliedKvp || "-",
          measured: measuredDisplay,
          tolerance: `${toleranceSign} ${toleranceValue} kVp`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential", testRows);
    }
  }

  // 7. Total Filtration Result
  if (testData.totalFiltration?.totalFiltration) {
    const measuredStr = testData.totalFiltration.totalFiltration.required || "-";
    const requiredStr = testData.totalFiltration.totalFiltration.measured || "-";
    const atKvp = testData.totalFiltration.totalFiltration.atKvp || "-";

    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(measuredStr);

    const ft = testData.totalFiltration.filtrationTolerance || {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
    };

    const threshold1 = parseFloat(ft.kvThreshold1);
    const threshold2 = parseFloat(ft.kvThreshold2);

    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal)) {
      let requiredTolerance: number;
      if (kvp < threshold1) {
        requiredTolerance = parseFloat(ft.forKvGreaterThan70);
      } else if (kvp >= threshold1 && kvp <= threshold2) {
        requiredTolerance = parseFloat(ft.forKvBetween70And100);
      } else {
        requiredTolerance = parseFloat(ft.forKvGreaterThan100);
      }

      if (!isNaN(requiredTolerance)) {
        isPass = measuredVal >= requiredTolerance;
      }
    }

    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";

    addRowsForTest("Total Filtration", [{
      specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
      measured: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      tolerance: toleranceStr,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 8. Linearity of mAs Loading
  const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
  if (linearityData?.table2 && Array.isArray(linearityData.table2)) {
    const linearityLabel = hasTimer
      ? "Linearity of mA Loading (Coefficient of Linearity)"
      : "Linearity of mAs Loading (Coefficient of Linearity)";

    const validRows = linearityData.table2.filter((row: any) => row.mAsApplied || row.mAs || row.mAsRange);
    if (validRows.length > 0) {
      const tolerance = linearityData.tolerance || "0.1";
      const toleranceOperator = linearityData.toleranceOperator || "<=";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === 'number') return o;
        if (typeof o === 'string') return parseFloat(o);
        if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
        return NaN;
      };

      let colValue = linearityData.col || linearityData.coefficient || linearityData.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? []).map(getVal).filter((v: number) => !isNaN(v) && v > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const mAsLabel = String(row.mAsApplied ?? row.mAs ?? row.mAsRange ?? "");
          const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          const midMas = match ? (parseFloat(match[1]) + parseFloat(match[2])) / 2 : parseFloat(mAsLabel) || 0;

          if (avg !== null && midMas > 0) {
            const xVal = avg / midMas;
            if (isFinite(xVal)) xValues.push(xVal);
          }
        });

        if (xValues.length > 0) {
          const xMax = Math.max(...xValues);
          const xMin = Math.min(...xValues);
          if (xMax + xMin > 0) colValue = Math.abs(xMax - xMin) / (xMax + xMin);
        }
      }

      const colRaw = parseFloat(String(colValue));
      const col = (!isNaN(colRaw) && isFinite(colRaw)) ? colRaw.toFixed(3) : "-";

      let isPass = linearityData.remarks === "Pass" || linearityData.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(tolerance);
        if (toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const tableLevelKv =
        linearityData?.kv ??
        linearityData?.kV ??
        linearityData?.setKv ??
        linearityData?.setKV ??
        (Array.isArray(linearityData?.table1)
          ? linearityData?.table1?.[0]?.kv
          : linearityData?.table1?.kv);

      const firstRow = validRows[0] || {};
      const kvValue = asDisplayNumber(firstRow.kv ?? firstRow.kV ?? firstRow.setKV ?? firstRow.setKv ?? tableLevelKv);
      const testRows = [{
        specified: kvValue ? `at ${kvValue} kV` : "-",
        measured: col !== "-" ? `CoL = ${col}` : "-",
        tolerance: `${toleranceOperator} ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest(linearityLabel, testRows);
    }
  }

  // 9. Consistency of Radiation Output (CoV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) =>
      row.kv || row.cv || (row.outputs && row.outputs.length > 0) || row.remark
    );

    if (validRows.length > 0) {
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = testData.outputConsistency.tolerance?.value || "0.05";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === 'number') return o;
        if (typeof o === 'string') return parseFloat(o);
        if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
        return NaN;
      };

      const tableLevelKv =
        testData.outputConsistency?.kv ??
        testData.outputConsistency?.kV ??
        testData.outputConsistency?.setKV ??
        testData.outputConsistency?.setKv;
      const tableLevelMa =
        testData.outputConsistency?.mA ??
        testData.outputConsistency?.ma ??
        testData.outputConsistency?.mas ??
        testData.outputConsistency?.tubeCurrent ??
        testData.outputConsistency?.setMA ??
        testData.outputConsistency?.setMa;

      const testRows = validRows.map((row: any) => {
        const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
        const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

        let cvValue = row.cv || row.cov;
        if (!cvValue && avg !== null && avg > 0) {
          const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
          const cov = Math.sqrt(variance) / avg;
          if (isFinite(cov)) cvValue = cov;
        }

        const formattedCv = cvValue !== undefined && cvValue !== null && cvValue !== "" && cvValue !== "-"
          ? (typeof cvValue === 'number' ? cvValue.toFixed(3) : parseFloat(String(cvValue)).toFixed(3))
          : "-";

        let isPass = row.remark === "Pass" || row.remark === "PASS";
        if (!isPass && formattedCv !== "-") {
          const cv = parseFloat(formattedCv);
          const tol = parseFloat(String(toleranceValue));
          if (toleranceOperator === "<=") isPass = cv <= tol;
          else if (toleranceOperator === "<") isPass = cv < tol;
          else if (toleranceOperator === ">=") isPass = cv >= tol;
          else if (toleranceOperator === ">") isPass = cv > tol;
        }

        const kvValue = asDisplayNumber(row.kv ?? row.kV ?? row.setKV ?? row.setKv ?? tableLevelKv);
        const maValue = asDisplayNumber(
          row.mA ??
          row.ma ??
          row.mas ??
          row.tubeCurrent ??
          row.setMA ??
          row.setMa ??
          tableLevelMa
        );
        const specifiedDisplay = kvValue && maValue
          ? `at ${kvValue} kV ${maValue} mA`
          : kvValue
            ? `at ${kvValue} kV`
            : "Varies";

        return {
          specified: specifiedDisplay,
          measured: formattedCv !== "-" ? "CoV = " + formattedCv : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CoV)", testRows, true);
    }
  }

  // 10. Low Contrast Resolution (Fluro specific)
  if (testData.lowContrastResolution && Object.keys(testData.lowContrastResolution).length > 0) {
    const hole = testData.lowContrastResolution.smallestHoleSize;
    if (hole != null && hole !== "") {
      const limit = testData.lowContrastResolution.recommendedStandard || "4";
      const isPass = parseFloat(hole) <= parseFloat(limit);
      addRowsForTest("Low Contrast Resolution", [{
        specified: "Smallest Visible Hole",
        measured: `${hole} mm`,
        tolerance: `≤ ${limit} mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 11. High Contrast Resolution (Fluro specific)
  if (testData.highContrastResolution && Object.keys(testData.highContrastResolution).length > 0) {
    const lp = testData.highContrastResolution.measuredLpPerMm;
    if (lp != null && lp !== "") {
      const limit = testData.highContrastResolution.recommendedStandard || "1.0";
      const isPass = parseFloat(lp) >= parseFloat(limit);
      addRowsForTest("High Contrast Resolution", [{
        specified: "Line Pairs per mm",
        measured: `${lp} lp/mm`,
        tolerance: `≥ ${limit} lp/mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 12. Exposure Rate at Table Top (Fluro specific)
  if (testData.exposureRate?.rows && Array.isArray(testData.exposureRate.rows)) {
    const validRows = testData.exposureRate.rows.filter((row: any) => row.exposure);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const isAec = row.remark?.toLowerCase().includes("aec") || false;
        const tolerance = isAec ? (testData.exposureRate.aecTolerance || "10") : (testData.exposureRate.nonAecTolerance || "5");
        const isPass = parseFloat(row.exposure) <= parseFloat(tolerance);
        return {
          specified: `${row.appliedKv || "-"} kV at ${row.appliedMa || "-"} mA`,
          measured: `${row.exposure || "-"} cGy/min`,
          tolerance: `≤ ${tolerance} cGy/min`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
    }
  }

  // 13. Tube Housing Leakage (Radiation Leakage Level)
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location && (row.max || row.result || row.front || row.back || row.mgy));
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.toleranceValue || "1";
      const toleranceUnit = testData.tubeHousingLeakage.leakageMeasurements[0]?.unit || "mGy in one hour";

      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;

        if (row.result) {
          const resultValue = parseFloat(row.result);
          if (!isNaN(resultValue)) {
            if (toleranceUnit === "mGy/h" || toleranceUnit === "mGy in one hour") {
              measuredValue = `${(resultValue / 114).toFixed(4)} mGy in one hour`;
              isPass = (resultValue / 114) <= parseFloat(toleranceValue);
            } else {
              measuredValue = `${resultValue.toFixed(4)} ${toleranceUnit}`;
              isPass = resultValue <= parseFloat(toleranceValue);
            }
          }
        } else if (row.max || row.mgy) {
          const maxValue = parseFloat(row.max || row.mgy);
          if (!isNaN(maxValue) && maxValue > 0) {
            if (toleranceUnit === "mGy/h" || toleranceUnit === "mGy in one hour") {
              measuredValue = `${(maxValue / 114).toFixed(4)} mGy in one hour`;
              isPass = (maxValue / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${maxValue.toFixed(2)} ${toleranceUnit}`;
              isPass = maxValue < parseFloat(toleranceValue);
            }
          }
        } else {
          // Fallback: calculate max from all directions
          const values = [row.front, row.back, row.left, row.right, row.top].map(v => parseFloat(v) || 0).filter(v => v > 0);
          if (values.length > 0) {
            const max = Math.max(...values);
            if (toleranceUnit === "mGy/h" || toleranceUnit === "mGy in one hour") {
              measuredValue = `${(max / 114).toFixed(4)} mGy in one hour`;
              isPass = (max / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${max.toFixed(2)} ${toleranceUnit}`;
              isPass = max < parseFloat(toleranceValue);
            }
          }
        }

        if (row.remark || testData.tubeHousingLeakage.remark) {
          const remark = row.remark || testData.tubeHousingLeakage.remark;
          if (remark === "PASS" || remark === "Pass") isPass = true;
          else if (remark === "FAIL" || remark === "Fail") isPass = false;
        }

        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: `≤ ${toleranceValue} ${toleranceUnit}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }

  // 14. Radiation Protection Survey
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const getMeasuredFromLocation = (loc: any): string | number | null => {
      const candidates = [
        loc?.mRPerWeek,
        loc?.exposureRate,
        loc?.mRPerHr,
        loc?.measuredValue,
        loc?.measuredValues,
        loc?.measured,
      ];

      for (const raw of candidates) {
        if (raw === undefined || raw === null) continue;
        if (Array.isArray(raw)) {
          const compact = raw.filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
          if (compact.length > 0) return compact.join(", ");
          continue;
        }
        if (typeof raw === "string") {
          const trimmed = raw.trim();
          if (trimmed !== "") return trimmed;
          continue;
        }
        return raw;
      }
      return null;
    };

    const validRows = testData.radiationProtectionSurvey.locations.filter((loc: any) => {
      const measuredVal = getMeasuredFromLocation(loc);
      return Boolean((loc?.location && String(loc.location).trim() !== "") || measuredVal !== null);
    });
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const measuredRaw = getMeasuredFromLocation(loc);
        const measuredDisplay = measuredRaw !== null ? String(measuredRaw) : "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const measuredNum = parseFloat(measuredDisplay);
        const hasNumericMeasured = !Number.isNaN(measuredNum);
        const isPass =
          loc.result === "PASS" ||
          loc.remarks === "Pass" ||
          (hasNumericMeasured && measuredNum <= limit);
        return {
          specified: loc.location || "-",
          measured: measuredDisplay !== "-" ? `${measuredDisplay} mR/week` : "-",
          tolerance: loc.category === "worker" ? "≤ 40 mR/week" : "≤ 2 mR/week",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Protection Survey", testRows);
    }
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-2">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
        SUMMARY OF QA TEST RESULTS
      </h2>

      <div className="overflow-x-auto print:overflow-visible print:max-w-none flex justify-center">
        <table className="border-2 border-black text-xs print:text-[9px] print:min-w-full" style={{ width: 'auto' }}>
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-12 text-center print:text-[9px]">Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-left w-72 print:text-[9px]">Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-32 print:text-[9px]">Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-32 print:text-[9px]">Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-40 print:text-[9px]">Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center bg-green-100 w-24 print:text-[9px]">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const shouldRenderTolerance =
                (!row.hasToleranceRowSpan && row.toleranceRowSpan === 0) ||
                (row.hasToleranceRowSpan && row.isFirstRow);

              const shouldRenderMeasured =
                (!row.hasMeasuredRowSpan && row.measuredRowSpan === 0) ||
                (row.hasMeasuredRowSpan && row.isFirstRow);

              return (
                <tr key={index}>
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center font-bold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-left font-medium leading-tight print:leading-tight bg-transparent print:bg-transparent print:text-[9px]">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center font-semibold"
                    >
                      {row.measured}
                    </td>
                  )}
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center text-xs print:text-[9px] leading-tight print:leading-tight bg-transparent print:bg-transparent"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center print:text-[9px] print:leading-tight ${row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                    {row.remarks}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainTestTableForFixedRadioFluro;
