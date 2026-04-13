// src/components/reports/TestTables/RadiographyMobile/MainTestTableForRadiographyMobile.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  hasTimer?: boolean;
}

const MainTestTableForRadiographyMobile: React.FC<MainTestTableProps> = ({ testData, hasTimer = false }) => {
  const rows: any[] = [];
  let srNo = 1;

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

  // 4. Congruence of Radiation & Optical Field
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
          tolerance: ` ${tolerance}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Congruence of Radiation & Optical Field", testRows);
    }
  }

  // 3. Central Beam Alignment
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

    // Format specified value and display with degree symbol (Â°)
    const specifiedValue = `${toleranceOperator} ${toleranceValue}°`;
    const toleranceDisplay = `${toleranceOperator} ${toleranceValue}°`;

    addRowsForTest("Central Beam Alignment", [{
      specified: specifiedValue,
      measured: tiltValue !== "-" ? `${tiltValue}°` : "-",
      tolerance: toleranceDisplay,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }
  // 5. Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((spot: any) => spot.focusType || spot.measuredWidth);
    if (validRows.length > 0) {
      // Format values to always show one decimal place (e.g., 1.0, 2.0)
      const formatValue = (val: any) => {
        if (val === undefined || val === null || val === "") return null;
        const numVal = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(numVal)) return null;
        return numVal.toFixed(1);
      };

      const toleranceCriteria = testData.effectiveFocalSpot.toleranceCriteria || {};

      // Format tolerance criteria as: +0.5 F FOR F < 0.8 MM, +0.4 F FOR 0.8 ≤ F ≤ 1.5 MM, +0.3 F FOR F > 1.5 MM
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
        const statedHeight = formatValue(spot.statedHeight);
        const measuredWidth = formatValue(spot.measuredWidth);
        const measuredHeight = formatValue(spot.measuredHeight);

        return {
          // Show single value instead of 2x2 style values in summary.
          specified: statedWidth !== null ? `${statedWidth} mm` : "-",
          measured: measuredWidth !== null ? `${measuredWidth} mm` : "-",
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows, true); // Use toleranceRowSpan since all rows share the same tolerance
    }
  }
  // 1. Accuracy of Irradiation Time
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

          if (toleranceOperator === "<=") {
            isPass = errorVal <= tol;
          } else if (toleranceOperator === ">=") {
            isPass = errorVal >= tol;
          } else if (toleranceOperator === "=") {
            isPass = Math.abs(errorVal - tol) < 0.01;
          }
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

  // 2. Accuracy of Operating Potential (kVp Accuracy)
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
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
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

  // 2.5. Total Filtration (from totalFilteration like Fixed, or from accuracyOfOperatingPotential.totalFiltration)
  if (testData.totalFilteration?.totalFiltration) {
    const tf = testData.totalFilteration.totalFiltration;
    const measuredStr = tf.required || tf.measured || "-";
    const atKvp = tf.atKvp || "-";
    const measuredVal = parseFloat(measuredStr);
    const kvp = parseFloat(atKvp);
    const ft = testData.totalFilteration.filtrationTolerance || { forKvGreaterThan70: "1.5", forKvBetween70And100: "2.0", forKvGreaterThan100: "2.5", kvThreshold1: "70", kvThreshold2: "100" };
    const threshold1 = parseFloat(ft.kvThreshold1);
    const threshold2 = parseFloat(ft.kvThreshold2);
    let requiredTol = NaN;
    if (!isNaN(kvp)) {
      requiredTol = kvp < threshold1 ? parseFloat(ft.forKvGreaterThan70) : kvp >= threshold1 && kvp <= threshold2 ? parseFloat(ft.forKvBetween70And100) : parseFloat(ft.forKvGreaterThan100);
    }
    const isPass = !isNaN(measuredVal) && !isNaN(requiredTol) ? measuredVal >= requiredTol : false;
    addRowsForTest("Total Filtration", [{
      specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
      measured: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      tolerance: !isNaN(requiredTol) ? ` ${requiredTol} mm Al` : "-",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  } else if (testData.accuracyOfOperatingPotential?.totalFiltration && (testData.accuracyOfOperatingPotential.totalFiltration.atKvp || testData.accuracyOfOperatingPotential.totalFiltration.required)) {
    const tf = testData.accuracyOfOperatingPotential.totalFiltration;
    const ft = testData.accuracyOfOperatingPotential.filtrationTolerance || { forKvGreaterThan70: "1.5", forKvBetween70And100: "2.0", forKvGreaterThan100: "2.5", kvThreshold1: "70", kvThreshold2: "100" };
    const measuredStr = String(tf.required ?? tf.measured ?? "-");
    const atKvp = String(tf.atKvp ?? "-");
    const measuredVal = parseFloat(measuredStr);
    const kvp = parseFloat(atKvp);
    const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
    const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");
    let requiredTol = NaN;
    if (!isNaN(kvp)) {
      requiredTol = kvp < threshold1 ? parseFloat(ft.forKvGreaterThan70 ?? "1.5") : kvp >= threshold1 && kvp <= threshold2 ? parseFloat(ft.forKvBetween70And100 ?? "2.0") : parseFloat(ft.forKvGreaterThan100 ?? "2.5");
    }
    const isPass = !isNaN(measuredVal) && !isNaN(requiredTol) ? measuredVal >= requiredTol : false;
    addRowsForTest("Total Filtration", [{
      specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
      measured: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      tolerance: !isNaN(requiredTol) ? `â‰¥ ${requiredTol} mm Al` : "-",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }



  // 6. Linearity of mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied || row.col != null || row.x != null);
    if (validRows.length > 0) {
      const linearityKv = testData.linearityOfMasLoading?.table1?.[0]?.kv || testData.linearityOfMasLoading?.kv || "";
      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === 'number') return o;
        if (typeof o === 'string') return parseFloat(o);
        if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
        return NaN;
      };

      const tolerance = parseFloat(testData.linearityOfMasLoading.tolerance ?? "0.1") || 0.1;
      const toleranceOperator = testData.linearityOfMasLoading.toleranceOperator || "<=";

      // Calculate on-the-fly if col is missing or NaN
      let colValue = testData.linearityOfMasLoading.col || testData.linearityOfMasLoading.coefficient || testData.linearityOfMasLoading.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

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
          if (xMax + xMin > 0) {
            colValue = Math.abs(xMax - xMin) / (xMax + xMin);
          }
        }
      }

      const colRaw = parseFloat(String(colValue));
      const col = (!isNaN(colRaw) && isFinite(colRaw)) ? colRaw.toFixed(3) : "-";

      let isPass = testData.linearityOfMasLoading.remarks === "Pass" || testData.linearityOfMasLoading.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        if (toleranceOperator === "<=") isPass = c <= tolerance;
        else if (toleranceOperator === "<") isPass = c < tolerance;
        else if (toleranceOperator === ">=") isPass = c >= tolerance;
        else if (toleranceOperator === ">") isPass = c > tolerance;
      }

      // Keep one summary row like RadiographyFixed so "Specified Values" naturally follows single-row behavior.
      addRowsForTest(
        hasTimer
          ? "Linearity of mA Loading Stations (Coefficient of Linearity)"
          : "Linearity of mAs Loading Stations (Coefficient of Linearity)",
        [{
          specified: linearityKv ? `at ${linearityKv} kV` : "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]
      );
    }
  }

  // 7. Consistency of Radiation Output (CoV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) =>
      row.kv || row.cv || (row.outputs && row.outputs.length > 0) || row.remark
    );

    if (validRows.length > 0) {
      const toleranceValue = testData.outputConsistency.tolerance?.value || "0.05";
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === 'number') return o;
        if (typeof o === 'string') return parseFloat(o);
        if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
        return NaN;
      };

      const testRows = validRows.map((row: any) => {
        // Calculate on-the-fly if cv is missing
        const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
        const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

        let cvValue = row.cv || row.cov;
        if (!cvValue && avg !== null && avg > 0) {
          const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
          const cov = Math.sqrt(variance) / avg;
          if (isFinite(cov)) {
            cvValue = cov;
          }
        }

        const formattedCv = cvValue !== undefined && cvValue !== null && cvValue !== "" && cvValue !== "-"
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

        return {
          specified: (row.kv || row.kvp) && (row.ma || row.mas || row.mAs)
            ? `at ${row.kv || row.kvp} kV ${row.ma || row.mas || row.mAs} mA`
            : ((row.kv || row.kvp) ? `${row.kv || row.kvp} kV` : "Varies"),
          measured: formattedCv !== "-" ? "CoV = " + formattedCv : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CoV)", testRows, true);
    }
  }

  // 8. Radiation Leakage Level
  if (testData.radiationLeakageLevel?.leakageMeasurements && Array.isArray(testData.radiationLeakageLevel.leakageMeasurements)) {
    const validRows = testData.radiationLeakageLevel.leakageMeasurements.filter((row: any) => row.location || row.front || row.back);
    if (validRows.length > 0) {
      const toleranceValue = testData.radiationLeakageLevel.toleranceValue || "1";
      const testRows = validRows.map((row: any) => {
        // Find max value from all directions
        const values = [row.front, row.back, row.left, row.right, row.top].map(v => parseFloat(v) || 0);
        const max = Math.max(...values);
        const maxStr = max > 0 ? max.toFixed(2) : "-";
        const isPass = maxStr !== "-" && parseFloat(maxStr) < parseFloat(toleranceValue);
        return {
          specified: row.location || "-",
          measured: maxStr !== "-" ? `${maxStr} mGy in one hour` : "-",
          tolerance: ` ${toleranceValue} mGy in one hour`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
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
        <table className="border-2 border-black text-xs print:text-[9px] print:min-w-full compact-table" style={{ width: 'auto', fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-12 text-center print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-72 print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', textAlign: 'center' }}>Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-32 print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-32 print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-40 print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center bg-green-100 w-24 print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>Remarks</th>
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
                <tr key={index} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center font-bold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-medium leading-tight print:leading-tight bg-transparent print:bg-transparent print:text-[9px]" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', textAlign: 'center' }}>
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center bg-transparent print:bg-transparent print:text-[9px] print:leading-tight" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', textAlign: 'center' }}>{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight"
                      style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', textAlign: 'center' }}
                    >
                      {row.measured}
                    </td>
                  )}
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center text-xs print:text-[9px] leading-tight print:leading-tight bg-transparent print:bg-transparent"
                      style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center print:text-[9px] print:leading-tight ${row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`} style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto' }}>
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

export default MainTestTableForRadiographyMobile;

