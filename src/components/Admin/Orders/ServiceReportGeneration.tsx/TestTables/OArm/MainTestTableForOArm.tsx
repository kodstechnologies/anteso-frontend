// src/components/reports/TestTables/OArm/MainTestTableForOArm.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  /** When true, linearity summary uses "mA Loading"; when false, "mAs Loading". Prefer `linearityOfMasLoading.selection === 'mA'` from saved data. */
  hasTimer?: boolean;
}

const MainTestTableForOArm: React.FC<MainTestTableProps> = ({ testData, hasTimer = false }) => {
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

  // Congruence of Radiation & Optical Field — RadiographyFixed
  if (testData.congruence?.congruenceMeasurements && Array.isArray(testData.congruence.congruenceMeasurements)) {
    const validRows = testData.congruence.congruenceMeasurements.filter((row: any) => row.dimension || row.percentFED);
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

  // Central Beam Alignment — RadiographyFixed
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

  // Effective Focal Spot Size — RadiographyFixed
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

  // Accuracy of Irradiation Time(sec) — RadiographyFixed
  if (testData.accuracyOfIrradiationTime?.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.accuracyOfIrradiationTime.tolerance?.value || "5";
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

  // Accuracy of Operating Potential (kVp Accuracy) — RadiographyFixed table2
  if (testData.accuracyOfOperatingPotential?.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKV || row.avgKvp);
    if (validRows.length > 0) {
      const toleranceSign =
        testData.accuracyOfOperatingPotential.tolerance?.sign ||
        testData.accuracyOfOperatingPotential.toleranceSign ||
        "±";
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
            isPass = deviation <= parseFloat(toleranceValue);
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

  // Accuracy of Operating Potential (from Total Filtration / shared O-Arm document) — RadiographyFixed
  const tfRoot = testData.totalFilteration || testData.operatingPotential;
  if (tfRoot?.measurements && Array.isArray(tfRoot.measurements)) {
    const validRows = tfRoot.measurements.filter((row: any) => row.appliedKvp || row.averageKvp || row.measuredValues);
    if (validRows.length > 0) {
      const toleranceSign = tfRoot.tolerance?.sign || "±";
      const toleranceValue = tfRoot.tolerance?.value || "2.0";
      const testRows = validRows.map((row: any) => {
        let avgKvpNum: number | null = null;
        if (row.averageKvp !== undefined && row.averageKvp !== null && row.averageKvp !== "") {
          const val = parseFloat(row.averageKvp);
          if (!isNaN(val)) avgKvpNum = val;
        }
        if (avgKvpNum === null && Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          const vals = row.measuredValues
            .map((v: any) => parseFloat(v))
            .filter((v: number) => !isNaN(v));
          if (vals.length > 0) avgKvpNum = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        }
        let measuredDisplay: string;
        if (avgKvpNum !== null) {
          measuredDisplay = avgKvpNum.toFixed(2);
        } else if (Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          measuredDisplay =
            row.measuredValues.filter((v: any) => v !== undefined && v !== null && v !== "").join(", ") || "-";
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

  // Total Filtration — RadiographyFixed (required = mm Al in Fixed UI; O-Arm may use measured)
  if (testData.totalFilteration?.totalFiltration) {
    const tfBlock = testData.totalFilteration.totalFiltration;
    const measuredStr = tfBlock.required || tfBlock.measured || "-";
    const atKvp =
      tfBlock.atKvp ||
      tfBlock.appliedKV ||
      tfBlock.appliedKvp ||
      (Array.isArray(testData.totalFilteration.measurements)
        ? testData.totalFilteration.measurements.find((r: any) => r.appliedKvp)?.appliedKvp
        : undefined) ||
      "-";

    const kvp = parseFloat(String(atKvp));
    const measuredVal = parseFloat(String(measuredStr));

    const ft = testData.totalFilteration.filtrationTolerance || {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      forKvLessThan70: "1.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
    };

    const threshold1 = parseFloat(String(ft.kvThreshold1 ?? "70"));
    const threshold2 = parseFloat(String(ft.kvThreshold2 ?? "100"));

    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal) && !isNaN(threshold1) && !isNaN(threshold2)) {
      let requiredTolerance: number;
      const lowBand = parseFloat(String(ft.forKvLessThan70 ?? ft.forKvGreaterThan70 ?? "1.5"));
      const midBand = parseFloat(String(ft.forKvBetween70And100 ?? "2.0"));
      const highBand = parseFloat(String(ft.forKvGreaterThan100 ?? "2.5"));
      if (kvp < threshold1) requiredTolerance = lowBand;
      else if (kvp >= threshold1 && kvp <= threshold2) requiredTolerance = midBand;
      else requiredTolerance = highBand;

      if (!isNaN(requiredTolerance)) isPass = measuredVal >= requiredTolerance;
    }

    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";
    const atKvpStr = atKvp !== undefined && atKvp !== null && String(atKvp).trim() !== "" ? String(atKvp).trim() : "";

    addRowsForTest("Total Filtration", [
      {
        specified: atKvpStr !== "" ? `${atKvpStr} kVp` : "-",
        measured: measuredStr !== "-" && measuredStr !== "" ? `${measuredStr} mm Al` : "-",
        tolerance: toleranceStr,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  // Linearity of mA / mAs Loading (Coefficient of Linearity) — RadiographyFixed
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const linearityLabel = hasTimer
      ? "Linearity of mA Loading (Coefficient of Linearity)"
      : "Linearity of mAs Loading (Coefficient of Linearity)";

    const appliedLabel = (row: any) => row.mAsApplied ?? row.mAsRange ?? row.ma;
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => {
      const v = appliedLabel(row);
      return v != null && String(v).trim() !== "";
    });
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

      let colValue =
        testData.linearityOfMasLoading.col ||
        testData.linearityOfMasLoading.coefficient ||
        testData.linearityOfMasLoading.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? row.readings ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg =
            outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const mAsLabel = String(appliedLabel(row) ?? "");
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

  // Consistency of Radiation Output (CoV) — RadiographyFixed
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter(
      (row: any) =>
        row.kv ||
        row.kvp ||
        row.cv ||
        row.cov ||
        (row.outputs && row.outputs.length > 0) ||
        row.remark
    );

    if (validRows.length > 0) {
      const tolRaw = testData.outputConsistency.tolerance;
      const toleranceOperator =
        typeof tolRaw === "object" && tolRaw !== null && tolRaw.operator != null ? tolRaw.operator : "<=";
      const toleranceValue =
        typeof tolRaw === "object" && tolRaw !== null && tolRaw.value != null
          ? String(tolRaw.value)
          : typeof tolRaw === "string" || typeof tolRaw === "number"
            ? String(tolRaw)
            : "0.05";

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
          const tol = parseFloat(toleranceValue);
          if (toleranceOperator === "<=") isPass = cv <= tol;
          else if (toleranceOperator === "<") isPass = cv < tol;
          else if (toleranceOperator === ">=") isPass = cv >= tol;
          else if (toleranceOperator === ">") isPass = cv > tol;
        }

        const kvValue = asDisplayNumber(row.kv ?? row.kV ?? row.kvp ?? row.setKV ?? row.setKv ?? tableLevelKv);
        const maValue = asDisplayNumber(
          row.mA ??
            row.ma ??
            row.mas ??
            row.mAs ??
            row.tubeCurrent ??
            row.setMA ??
            row.setMa ??
            tableLevelMa
        );
        const specifiedDisplay =
          kvValue && maValue
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

  // Radiation leakage level at 1m from tube housing — RadiographyFixed + O-Arm tube housing
  const leakParent = testData.radiationLeakageLevel || testData.tubeHousingLeakage;
  const leakMeasurements =
    leakParent &&
    (Array.isArray(leakParent.leakageMeasurements) && leakParent.leakageMeasurements.length > 0
      ? leakParent.leakageMeasurements
      : Array.isArray(leakParent.leakageRows)
        ? leakParent.leakageRows
        : []);

  if (leakParent && Array.isArray(leakMeasurements) && leakMeasurements.length > 0) {
    const validRows = leakMeasurements.filter(
      (row: any) =>
        row.location ||
        row.max ||
        row.result ||
        row.front ||
        row.back ||
        row.left ||
        row.right ||
        row.top
    );
    if (validRows.length > 0) {
      const toleranceValue = leakParent.toleranceValue || "1";
      const toleranceUnit = validRows[0]?.unit || leakParent.leakageMeasurements?.[0]?.unit || "mGy in one hour";

      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;

        if (row.result) {
          const resultValue = parseFloat(String(row.result));
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
          const maxValue = parseFloat(String(row.max));
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

        if (row.remark || leakParent.remark) {
          const remark = row.remark || leakParent.remark;
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

  // Radiation Protection Survey — RadiographyFixed
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
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

  // --- O-Arm specific (after shared QA blocks) ---
  if (testData.highContrastResolution) {
    const measuredLpPerMm = testData.highContrastResolution.measuredLpPerMm || "";
    const recommendedStandard = testData.highContrastResolution.recommendedStandard || "1.50";
    const measured = parseFloat(measuredLpPerMm);
    const standard = parseFloat(recommendedStandard);
    const isPass = !isNaN(measured) && !isNaN(standard) && measured >= standard;
    addRowsForTest("High Contrast Resolution", [
      {
        specified: "Line Pairs per mm",
        measured: measuredLpPerMm ? `${measuredLpPerMm} lp/mm` : "-",
        tolerance: `≥ ${recommendedStandard} lp/mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  if (testData.lowContrastResolution) {
    const smallestHoleSize = testData.lowContrastResolution.smallestHoleSize || "";
    const recommendedStandard = testData.lowContrastResolution.recommendedStandard || "3.0";
    const measured = parseFloat(smallestHoleSize);
    const standard = parseFloat(recommendedStandard);
    const isPass = !isNaN(measured) && !isNaN(standard) && measured <= standard;
    addRowsForTest("Low Contrast Resolution", [
      {
        specified: "Smallest Visible Hole",
        measured: smallestHoleSize ? `${smallestHoleSize} mm` : "-",
        tolerance: `≤ ${recommendedStandard} mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  if (testData.exposureRateTableTop?.rows && Array.isArray(testData.exposureRateTableTop.rows)) {
    const validRows = testData.exposureRateTableTop.rows.filter((row: any) => row.distance || row.exposure);
    if (validRows.length > 0) {
      const aecTol = testData.exposureRateTableTop.aecTolerance || "10";
      const manualTol = testData.exposureRateTableTop.nonAecTolerance || "5";

      const testRows = validRows.map((row: any) => {
        const isPass = row.result === "PASS" || row.result === "Pass";
        const isAEC = row.remark === "AEC Mode";
        const toleranceVal = isAEC ? aecTol : manualTol;

        return {
          specified: row.distance ? `${row.distance} cm` : "-",
          measured: row.exposure ? `${row.exposure} cGy/min` : "-",
          tolerance: `≤ ${toleranceVal} cGy/min`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
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
        <table
          className="border border-black text-xs print:text-[9px] print:min-w-full"
          style={{ width: "auto", textAlign: "center", borderCollapse: "collapse", borderWidth: 1, borderStyle: "solid", borderColor: "#000" }}
        >
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-12 text-center align-middle font-bold print:text-[9px]">Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-72 print:text-[9px]">Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32 print:text-[9px]">Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32 print:text-[9px]">Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-40 print:text-[9px]">Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold bg-green-100 w-24 print:text-[9px]">Remarks</th>
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
                      className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center align-middle font-normal bg-transparent print:bg-transparent print:text-[9px] print:leading-tight"
                    >
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td
                      rowSpan={row.rowSpan}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-normal leading-tight print:leading-tight bg-transparent print:bg-transparent print:text-[9px]"
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
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle text-xs print:text-[9px] leading-tight print:leading-tight bg-transparent print:bg-transparent"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td
                    className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle print:text-[9px] print:leading-tight ${
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

export default MainTestTableForOArm;
