// src/components/reports/TestTables/OBI/MainTestTableForOBI.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  hasTimer?: boolean;
}

const MainTestTableForOBI: React.FC<MainTestTableProps> = ({ testData, hasTimer = false }) => {
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

  // Congruence of Radiation & Optical Field (RadiographyFixed + OBI key)
  const congruenceBlock = testData.congruenceOfRadiation || testData.congruence;
  if (congruenceBlock?.congruenceMeasurements && Array.isArray(congruenceBlock.congruenceMeasurements)) {
    const validRows = congruenceBlock.congruenceMeasurements.filter((row: any) => row.dimension || row.percentFED);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const percentFED = row.percentFED || "-";
        const tolerance = row.tolerance || "2";
        const isPass =
          row.remark === "Pass" ||
          row.remark === "PASS" ||
          (percentFED !== "-" && parseFloat(percentFED) <= parseFloat(tolerance));
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

  // Central Beam Alignment
  if (testData.centralBeamAlignment?.observedTilt) {
    const tiltValue = testData.centralBeamAlignment.observedTilt.value || "-";
    const toleranceOperator = testData.centralBeamAlignment.tolerance?.operator || "<=";
    const toleranceValue = testData.centralBeamAlignment.tolerance?.value || "5";

    let isPass = false;
    if (
      testData.centralBeamAlignment.observedTilt.remark === "Pass" ||
      testData.centralBeamAlignment.observedTilt.remark === "PASS"
    ) {
      isPass = true;
    } else if (
      testData.centralBeamAlignment.observedTilt.remark === "Fail" ||
      testData.centralBeamAlignment.observedTilt.remark === "FAIL"
    ) {
      isPass = false;
    } else if (tiltValue !== "-") {
      const observed = parseFloat(tiltValue);
      const tol = parseFloat(toleranceValue);
      if (!isNaN(observed) && !isNaN(tol)) {
        if (toleranceOperator === "<") isPass = observed < tol;
        else if (toleranceOperator === ">") isPass = observed > tol;
        else if (toleranceOperator === "<=") isPass = observed <= tol;
        else if (toleranceOperator === ">=") isPass = observed >= tol;
        else if (toleranceOperator === "=") isPass = Math.abs(observed - tol) < 0.01;
      }
    }

    const specifiedValue = `${toleranceOperator} ${toleranceValue}°`;
    const toleranceDisplay = `${toleranceOperator} ${toleranceValue}°`;

    addRowsForTest("Central Beam Alignment", [
      {
        specified: specifiedValue,
        measured: tiltValue !== "-" ? `${tiltValue}°` : "-",
        tolerance: toleranceDisplay,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  // Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((spot: any) => spot.focusType || spot.measuredWidth);
    if (validRows.length > 0) {
      const formatValue = (val: any) => {
        if (val === undefined || val === null || val === "") return null;
        const numVal = typeof val === "number" ? val : parseFloat(val);
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

  // Accuracy of Irradiation Time — OBI uses timerTest; align with RadiographyFixed (accuracyOfIrradiationTime)
  const irrBlock = testData.accuracyOfIrradiationTime || testData.timerTest;
  if (irrBlock?.irradiationTimes && Array.isArray(irrBlock.irradiationTimes)) {
    const validRows = irrBlock.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = irrBlock.tolerance?.operator || "<=";
      const toleranceValue = irrBlock.tolerance?.value || "5";
      const testRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const measuredTime = parseFloat(row.measuredTime);
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          const errorVal = Math.abs(((measuredTime - setTime) / setTime) * 100);
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

  // Accuracy of Operating Potential (kVp Accuracy) — OBI operatingPotential
  const opData = testData.operatingPotential;
  if (opData && (opData.rows || opData.table2)) {
    const rowsToProcess = opData.rows || opData.table2;
    if (Array.isArray(rowsToProcess)) {
      const validRows = rowsToProcess.filter((row: any) => row.appliedKvp || row.averageKvp || row.setKV || row.avgKvp);
      if (validRows.length > 0) {
        const toleranceSign =
          opData.tolerance?.sign || opData.toleranceSign || testData.accuracyOfOperatingPotential?.tolerance?.sign || "±";
        const toleranceValue =
          opData.tolerance?.value || opData.toleranceValue || testData.accuracyOfOperatingPotential?.tolerance?.value || "2.0";
        const testRows = validRows.map((row: any) => {
          let isPass = false;
          if (row.remarks === "PASS" || row.remarks === "Pass") isPass = true;
          else if (row.remarks === "FAIL" || row.remarks === "Fail") isPass = false;
          else {
            const appliedKvp = parseFloat(row.appliedKvp || row.setKV);
            const avgKvp = parseFloat(row.averageKvp || row.avgKvp);
            if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
              const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
              const tol = parseFloat(toleranceValue);
              isPass = deviation <= tol;
            }
          }
          return {
            specified: row.appliedKvp || row.setKV || "-",
            measured: row.averageKvp || row.avgKvp || "-",
            tolerance: `${toleranceSign} ${toleranceValue} kVp`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
      }
    }
  }

  // Total Filtration — RadiographyFixed (nested under operatingPotential for OBI)
  if (opData?.totalFiltration) {
    const tf = opData.totalFiltration;
    const measuredStr = tf.required ?? tf.measured ?? "-";
    const atKvp = tf.atKvp || "-";
    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(String(measuredStr));

    const ft = opData.filtrationTolerance || testData.totalFilteration?.filtrationTolerance || {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
    };

    const threshold1 = parseFloat(String(ft.kvThreshold1 ?? "70"));
    const threshold2 = parseFloat(String(ft.kvThreshold2 ?? "100"));

    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal) && !isNaN(threshold1) && !isNaN(threshold2)) {
      let requiredTolerance: number;
      if (kvp < threshold1) requiredTolerance = parseFloat(String(ft.forKvGreaterThan70 ?? "1.5"));
      else if (kvp >= threshold1 && kvp <= threshold2)
        requiredTolerance = parseFloat(String(ft.forKvBetween70And100 ?? "2.0"));
      else requiredTolerance = parseFloat(String(ft.forKvGreaterThan100 ?? "2.5"));

      if (!isNaN(requiredTolerance)) isPass = measuredVal >= requiredTolerance;
    }

    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";

    addRowsForTest("Total Filtration", [
      {
        specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
        measured: measuredStr !== "-" && measuredStr !== "" ? `${measuredStr} mm Al` : "-",
        tolerance: toleranceStr,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  // Linearity of mAs / mA Loading (Coefficient of Linearity)
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const linearityLabel = hasTimer
      ? "Linearity of mA Loading (Coefficient of Linearity)"
      : "Linearity of mAs Loading (Coefficient of Linearity)";

    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const toleranceOperator = testData.linearityOfMasLoading.toleranceOperator || "<=";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(o.value);
        return NaN;
      };

      let colValue = testData.linearityOfMasLoading.col || testData.linearityOfMasLoading.coefficient || testData.linearityOfMasLoading.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg =
            outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? "");
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
      const col = !isNaN(colRaw) && isFinite(colRaw) ? colRaw.toFixed(3) : "-";

      let isPass = testData.linearityOfMasLoading.remarks === "Pass" || testData.linearityOfMasLoading.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(tolerance);
        if (toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const tableLevelKv =
        testData.linearityOfMasLoading?.kv ??
        testData.linearityOfMasLoading?.kV ??
        testData.linearityOfMasLoading?.setKv ??
        testData.linearityOfMasLoading?.setKV ??
        (Array.isArray(testData.linearityOfMasLoading?.table1)
          ? testData.linearityOfMasLoading?.table1?.[0]?.kv
          : testData.linearityOfMasLoading?.table1?.kv);

      const firstRow = validRows[0] || {};
      const kvValue = asDisplayNumber(firstRow.kv ?? firstRow.kV ?? firstRow.setKV ?? firstRow.setKv ?? tableLevelKv);

      addRowsForTest(linearityLabel, [
        {
          specified: kvValue ? `at ${kvValue} kV` : "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ]);
    }
  }

  // Consistency of Radiation Output (CoV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter(
      (row: any) => row.kv || row.cv || row.cov || (row.outputs && row.outputs.length > 0) || row.remark
    );

    if (validRows.length > 0) {
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = testData.outputConsistency.tolerance?.value || "0.05";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(o.value);
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

        const formattedCv =
          cvValue !== undefined && cvValue !== null && cvValue !== "" && cvValue !== "-"
            ? (typeof cvValue === "number" ? cvValue.toFixed(3) : parseFloat(String(cvValue)).toFixed(3))
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
          row.mA ?? row.ma ?? row.mas ?? row.tubeCurrent ?? row.setMA ?? row.setMa ?? tableLevelMa
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

  // Radiation leakage level — RadiographyFixed pattern; OBI uses tubeHousingLeakage (result = mR in one hour → use mGy/h path)
  const leakageBlock = testData.radiationLeakageLevel || testData.tubeHousingLeakage;
  if (leakageBlock?.leakageMeasurements && Array.isArray(leakageBlock.leakageMeasurements)) {
    const validRows = leakageBlock.leakageMeasurements.filter(
      (row: any) => row.location && (row.max || row.result || row.front || row.back || row.left || row.right)
    );
    if (validRows.length > 0) {
      const toleranceValue = leakageBlock.toleranceValue || leakageBlock.tolerance?.value || "1";
      const isTubeHousing = leakageBlock === testData.tubeHousingLeakage;
      const toleranceUnit =
        validRows[0]?.unit || (isTubeHousing ? "mGy/h" : "mGy in one hour");

      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;

        if (row.mgy != null && row.mgy !== "" && row.mgy !== "-") {
          const g = parseFloat(String(row.mgy));
          if (!isNaN(g)) {
            measuredValue = `${g.toFixed(4)} mGy in one hour`;
            isPass = g <= parseFloat(String(toleranceValue));
          }
        } else if (row.result) {
          const resultValue = parseFloat(row.result);
          if (!isNaN(resultValue)) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(resultValue / 114).toFixed(4)} mGy in one hour`;
              isPass = resultValue / 114 < parseFloat(String(toleranceValue));
            } else {
              measuredValue = `${resultValue.toFixed(4)} ${toleranceUnit}`;
              isPass = resultValue < parseFloat(String(toleranceValue));
            }
          }
        } else if (row.max) {
          const maxValue = parseFloat(row.max);
          if (!isNaN(maxValue) && maxValue > 0) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(maxValue / 114).toFixed(4)} mGy in one hour`;
              isPass = maxValue / 114 < parseFloat(String(toleranceValue));
            } else {
              measuredValue = `${maxValue.toFixed(2)} ${toleranceUnit}`;
              isPass = maxValue < parseFloat(String(toleranceValue));
            }
          }
        } else {
          const values = [row.front, row.back, row.left, row.right, row.top]
            .map((v: any) => parseFloat(v) || 0)
            .filter((v: number) => v > 0);
          if (values.length > 0) {
            const max = Math.max(...values);
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(max / 114).toFixed(4)} mGy in one hour`;
              isPass = max / 114 < parseFloat(String(toleranceValue));
            } else {
              measuredValue = `${max.toFixed(2)} ${toleranceUnit}`;
              isPass = max < parseFloat(String(toleranceValue));
            }
          }
        }

        if (row.remark || leakageBlock.remark) {
          const remark = row.remark || leakageBlock.remark;
          if (remark === "PASS" || remark === "Pass") isPass = true;
          else if (remark === "FAIL" || remark === "Fail") isPass = false;
        }

        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: `≤ ${toleranceValue} ${toleranceUnit === "mGy/h" ? "mGy in one hour" : toleranceUnit}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }

  // Radiation Protection Survey
  const rpsBlock = testData.radiationProtectionSurvey || testData.radiationProtection;
  if (rpsBlock?.locations && Array.isArray(rpsBlock.locations)) {
    const validRows = rpsBlock.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const mRPerWeek = loc.mRPerWeek || "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const isPass =
          loc.result === "PASS" ||
          loc.result === "Pass" ||
          (mRPerWeek !== "-" && parseFloat(mRPerWeek) <= limit);
        return {
          specified: loc.location || "-",
          measured: mRPerWeek !== "-" ? `${mRPerWeek} mR/week` : "-",
          tolerance: loc.category === "worker" ? "≤ 40 mR/week" : "≤ 2 mR/week",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Protection Survey", testRows);
    }
  }

  // --- OBI-specific sections (unchanged behaviour, string tolerances) ---

  if (testData.lowContrastSensitivity) {
    const lcsData = testData.lowContrastSensitivity;
    if (lcsData.smallestHoleSize || lcsData.recommendedStandard) {
      const measured = parseFloat(lcsData.smallestHoleSize || "999");
      const standard = parseFloat(lcsData.recommendedStandard || "0");
      const isPass = !isNaN(measured) && !isNaN(standard) && measured < standard;

      addRowsForTest("Low Contrast Resolution", [
        {
          specified: `Recommended <= ${lcsData.recommendedStandard || "-"} mm`,
          measured: lcsData.smallestHoleSize ? `${lcsData.smallestHoleSize} mm` : "-",
          tolerance: `< ${lcsData.recommendedStandard || "-"} mm`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ]);
    }
  }

  if (testData.highContrastSensitivity) {
    const hcsData = testData.highContrastSensitivity;
    if (hcsData.measuredLpPerMm || hcsData.recommendedStandard) {
      const measured = parseFloat(hcsData.measuredLpPerMm || "0");
      const standard = parseFloat(hcsData.recommendedStandard || "0");
      const isPass = !isNaN(measured) && !isNaN(standard) && measured > standard;

      addRowsForTest("High Contrast Resolution", [
        {
          specified: `Recommended >= ${hcsData.recommendedStandard || "-"} lp/mm`,
          measured: hcsData.measuredLpPerMm ? `${hcsData.measuredLpPerMm} lp/mm` : "-",
          tolerance: `> ${hcsData.recommendedStandard || "-"} lp/mm`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ]);
    }
  }

  if (testData.linearityOfTime?.measurementRows && Array.isArray(testData.linearityOfTime.measurementRows)) {
    const validRows = testData.linearityOfTime.measurementRows.filter((row: any) => row.maApplied || row.mGyPerMAs);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      const col = testData.linearityOfTime.coefficientOfLinearity || "-";
      const isPass =
        testData.linearityOfTime.remarks === "Pass" ||
        (col !== "-" && parseFloat(String(col)) <= parseFloat(String(tolerance)));
      addRowsForTest("Linearity Of mA loading", [
        {
          specified: "Coefficient of Linearity",
          measured: col,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ]);
    }
  }

  if (testData.alignmentTest?.testRows && Array.isArray(testData.alignmentTest.testRows)) {
    const validRows = testData.alignmentTest.testRows.filter((row: any) => row.parameter || row.measured);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const isPass =
          row.remark === "Pass" ||
          row.remark === "PASS" ||
          row.result === "Pass" ||
          row.result === "PASS";
        return {
          specified: row.parameter || row.specified || "-",
          measured: row.measured || row.measuredValue || "-",
          tolerance: row.tolerance || row.toleranceValue || "-",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Alignment Test", testRows);
    }
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-20 print:mt-12">
      <h2 className="text-2xl font-bold text-center underline mb-8 print:mb-6">
        SUMMARY OF QA TEST RESULTS
      </h2>

      <div className="overflow-x-auto print:overflow-visible print:max-w-none flex justify-center">
        <table
          className="border border-black text-xs print:text-xxs print:min-w-full"
          style={{ width: "auto", textAlign: "center", borderCollapse: "collapse", borderWidth: 1, borderStyle: "solid", borderColor: "#000" }}
        >
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-12 text-center align-middle font-bold print:text-[9px]">
                Sr. No.
              </th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-72 print:text-[9px]">
                Parameters Used
              </th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32 print:text-[9px]">
                Specified Values
              </th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32 print:text-[9px]">
                Measured Values
              </th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-40 print:text-[9px]">
                Tolerance
              </th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold bg-green-100 w-24 print:text-[9px]">
                Remarks
              </th>
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
                    <td
                      rowSpan={row.rowSpan}
                      className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center align-middle font-normal print:text-[9px]"
                    >
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td
                      rowSpan={row.rowSpan}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-normal leading-tight print:text-[9px]"
                    >
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center align-middle font-normal">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center align-middle font-normal"
                    >
                      {row.measured}
                    </td>
                  )}
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle text-xs print:text-[9px] leading-tight"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td
                    className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle print:text-[9px] ${
                      row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
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

export default MainTestTableForOBI;
