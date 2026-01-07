// src/components/reports/TestTables/OBI/MainTestTableForOBI.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForOBI: React.FC<MainTestTableProps> = ({ testData }) => {
  const rows: any[] = [];
  let srNo = 1;

  const addRowsForTest = (
    parameter: string,
    testRows: Array<{
      specified: string | number;
      measured: string | number;
      tolerance: string | React.ReactNode;
      remarks: "Pass" | "Fail";
    }>,
    toleranceRowSpan: boolean = false
  ) => {
    if (testRows.length === 0) return;

    const sharedTolerance = toleranceRowSpan ? testRows[0]?.tolerance : null;

    testRows.forEach((testRow, idx) => {
      rows.push({
        srNo: idx === 0 ? srNo++ : null,
        parameter: idx === 0 ? parameter : null,
        rowSpan: idx === 0 ? testRows.length : 0,
        specified: testRow.specified,
        measured: testRow.measured,
        tolerance: toleranceRowSpan ? (idx === 0 ? sharedTolerance : null) : testRow.tolerance,
        toleranceRowSpan: toleranceRowSpan ? (idx === 0 ? testRows.length : 0) : 0,
        hasToleranceRowSpan: toleranceRowSpan,
        remarks: testRow.remarks,
        isFirstRow: idx === 0,
      });
    });
  };

  // 1. Accuracy of Operating Potential

  const opData = testData.operatingPotential;
  if (opData && (opData.rows || opData.table2)) {
    const rowsToProcess = opData.rows || opData.table2;
    if (Array.isArray(rowsToProcess)) {
      const validRows = rowsToProcess.filter((row: any) => row.appliedKvp || row.averageKvp || row.setKV || row.avgKvp);
      if (validRows.length > 0) {
        const toleranceSign = opData.toleranceSign || "±";
        const toleranceValue = opData.toleranceValue || "2.0";
        const testRows = validRows.map((row: any) => {
          let isPass = false;
          if (row.remarks === "PASS" || row.remarks === "Pass") {
            isPass = true;
          } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
            isPass = false;
          } else {
            const applied = parseFloat(row.appliedKvp || row.setKV);
            const measured = parseFloat(row.averageKvp || row.avgKvp);
            if (!isNaN(applied) && !isNaN(measured) && applied > 0) {
              const deviation = Math.abs(((measured - applied) / applied) * 100);
              const tol = parseFloat(toleranceValue);
              isPass = deviation <= tol;
            }
          }
          return {
            specified: row.appliedKvp || row.setKV || "-",
            measured: row.averageKvp || row.avgKvp || "-",
            tolerance: `${toleranceSign}${toleranceValue}%`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
      }
    }
  }

  // 2.1 Total Filtration (from Operating Potential)
  if (opData?.totalFiltration) {
    const tf = opData.totalFiltration;
    const measured = tf.measured || "-";
    const required = tf.required || "2.5";

    // Determine pass/fail
    let isPass = false;
    const measVal = parseFloat(measured);
    const reqVal = parseFloat(required);

    if (!isNaN(measVal) && !isNaN(reqVal)) {
      isPass = measVal >= reqVal;
    }

    addRowsForTest("Total Filtration", [{
      specified: `Required >= ${required} mm Al`,
      measured: measured !== "-" ? `${measured} mm Al` : "-",
      tolerance: `≥ ${required} mm Al`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 3. Timer Test
  if (testData.timerTest?.irradiationTimes && Array.isArray(testData.timerTest.irradiationTimes)) {
    const validRows = testData.timerTest.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.timerTest.tolerance?.operator || "<=";
      const toleranceValue = testData.timerTest.tolerance?.value || "5";
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
      addRowsForTest("Accuracy of Irradiation Time", testRows);
    }
  }

  // 4. Output Consistency (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kv || row.avg);
    if (validRows.length > 0) {
      const tolerance = testData.outputConsistency.tolerance?.value || "0.05";
      const testRows = validRows.map((row: any) => {
        // Calculate COV from outputs if available
        let cov = "-";
        if (row.outputs && Array.isArray(row.outputs) && row.outputs.length > 0) {
          const values = row.outputs.map((v: any) => parseFloat(v.value || v)).filter((v: number) => !isNaN(v));
          if (values.length > 0) {
            const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
            const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            cov = mean > 0 ? (stdDev / mean).toFixed(3) : "-";
          }
        } else if (row.avg) {
          // Use avg if available
          cov = parseFloat(row.avg).toFixed(3);
        }
        const isPass = row.remarks === "Pass" || (cov !== "-" && parseFloat(cov) <= parseFloat(tolerance));
        return {
          specified: row.kv ? `${row.kv} kV` : "Varies with kV",
          measured: cov,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (COV)", testRows, true);
    }
  }

  // 5. Central Beam Alignment
  if (testData.centralBeamAlignment) {
    const observedTilt = testData.centralBeamAlignment.observedTilt;
    const tolerance = testData.centralBeamAlignment.tolerance;
    if (observedTilt && tolerance) {
      const observed = parseFloat(observedTilt.value);
      const tol = parseFloat(tolerance.value);
      const operator = observedTilt.operator || "<=";
      let isPass = false;

      if (!isNaN(observed) && !isNaN(tol)) {
        if (operator === "<=") isPass = observed <= tol;
        else if (operator === ">=") isPass = observed >= tol;
        else if (operator === "=") isPass = Math.abs(observed - tol) < 0.01;
        else if (operator === "<") isPass = observed < tol;
        else if (operator === ">") isPass = observed > tol;
      }

      addRowsForTest("Central Beam Alignment", [{
        specified: "Observed Tilt",
        measured: observedTilt.value ? `${observedTilt.value}°` : "-",
        tolerance: `${tolerance.operator || "≤"} ${tolerance.value || "-"}°`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 6. Congruence of Radiation
  if (testData.congruenceOfRadiation?.congruenceMeasurements && Array.isArray(testData.congruenceOfRadiation.congruenceMeasurements)) {
    const validRows = testData.congruenceOfRadiation.congruenceMeasurements.filter((row: any) => row.dimension || row.percentFED);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const isPass = row.remark === "Pass" || row.remark === "PASS";
        return {
          specified: row.dimension || "-",
          measured: row.percentFED ? `${row.percentFED}%` : "-",
          tolerance: row.tolerance ? `≤ ${row.tolerance}%` : "-",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Congruence of Radiation", testRows);
    }
  }

  // 7. Effective Focal Spot
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((row: any) => row.focusType || row.measuredWidth);
    if (validRows.length > 0) {
      const testRows: Array<{
        specified: string | number;
        measured: string | number;
        tolerance: string | React.ReactNode;
        remarks: "Pass" | "Fail";
      }> = [];

      // Determine the tolerance string based on logic
      // + 0.5 f for f < 0.8 mm
      // + 0.4 f for 0.8 <= f <= 1.5 mm
      // + 0.3 f for f > 1.5 mm
      const toleranceDisplay = (
        <div className="flex flex-col gap-1 text-left text-xs">
          <span>+ 0.5 f for f &lt; 0.8 mm</span>
          <span>+ 0.4 f for 0.8 &le; f &le; 1.5 mm</span>
          <span>+ 0.3 f for f &gt; 1.5 mm</span>
        </div>
      );

      validRows.forEach((row: any, index: number) => {
        const isPass = row.remark === "Pass" || row.remark === "PASS";
        testRows.push({
          specified: row.focusType || "-",
          measured: row.measuredWidth && row.measuredHeight ? `${row.measuredWidth} × ${row.measuredHeight} mm` : "-",
          tolerance: toleranceDisplay, // Render JSX
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        });
      });

      addRowsForTest("Effective Focal Spot", testRows, true); // Use shared tolerance row span
    }
  }

  // 8. Linearity of mAs Loading Stations
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied || row.col);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const testRows = validRows.map((row: any) => {
        const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
        const isPass = row.remarks === "Pass" || row.remarks === "PASS" || (row.col ? parseFloat(row.col) <= parseFloat(tolerance) : false);
        return {
          specified: row.mAsApplied ? `${row.mAsApplied} mAs` : "-",
          measured: col,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Linearity of mAs Loading Stations (Coefficient of Linearity)", testRows);
    }
  }

  // 9. Linearity of Time
  if (testData.linearityOfTime?.measurementRows && Array.isArray(testData.linearityOfTime.measurementRows)) {
    const validRows = testData.linearityOfTime.measurementRows.filter((row: any) => row.maApplied || row.mGyPerMAs);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      const col = testData.linearityOfTime.coefficientOfLinearity || "-";
      const isPass = testData.linearityOfTime.remarks === "Pass" || (col !== "-" && parseFloat(col) < parseFloat(tolerance));
      addRowsForTest("Linearity of Time", [{
        specified: "Coefficient of Linearity",
        measured: col,
        tolerance: `CoL < ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 10. Tube Housing Leakage
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.toleranceValue || "1";
      const toleranceOperator = testData.tubeHousingLeakage.toleranceOperator || "less than or equal to";
      const testRows = validRows.map((row: any) => {
        // Calculate max from left, right, front, back, top
        const values = [
          parseFloat(row.left || "0"),
          parseFloat(row.right || "0"),
          parseFloat(row.front || "0"),
          parseFloat(row.back || "0"),
          parseFloat(row.top || "0"),
        ].filter(v => !isNaN(v) && v > 0);
        const max = values.length > 0 ? Math.max(...values).toFixed(3) : "-";
        const isPass = row.remark === "Pass" || (max !== "-" && parseFloat(max) < parseFloat(toleranceValue));
        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} mGy/h` : "-",
          tolerance: `${toleranceOperator === "less than or equal to" ? "≤" : toleranceOperator === "greater than or equal to" ? "≥" : "="} ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Tube Housing Leakage", testRows);
    }
  }

  // 11. High Contrast Sensitivity
  if (testData.highContrastSensitivity) {
    const hcsData = testData.highContrastSensitivity;
    if (hcsData.measuredLpPerMm || hcsData.recommendedStandard) {
      const measured = parseFloat(hcsData.measuredLpPerMm || "0");
      const standard = parseFloat(hcsData.recommendedStandard || "0");
      const isPass = !isNaN(measured) && !isNaN(standard) && measured > standard;
      
      addRowsForTest("High Contrast Sensitivity", [{
        specified: `Recommended >= ${hcsData.recommendedStandard || "-"} lp/mm`,
        measured: hcsData.measuredLpPerMm ? `${hcsData.measuredLpPerMm} lp/mm` : "-",
        tolerance: `> ${hcsData.recommendedStandard || "-"} lp/mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 12. Low Contrast Sensitivity
  if (testData.lowContrastSensitivity) {
    const lcsData = testData.lowContrastSensitivity;
    if (lcsData.smallestHoleSize || lcsData.recommendedStandard) {
      const measured = parseFloat(lcsData.smallestHoleSize || "999");
      const standard = parseFloat(lcsData.recommendedStandard || "0");
      const isPass = !isNaN(measured) && !isNaN(standard) && measured < standard;
      
      addRowsForTest("Low Contrast Sensitivity", [{
        specified: `Recommended <= ${lcsData.recommendedStandard || "-"} mm`,
        measured: lcsData.smallestHoleSize ? `${lcsData.smallestHoleSize} mm` : "-",
        tolerance: `< ${lcsData.recommendedStandard || "-"} mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
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

      <div className="overflow-x-auto print:overflow-visible print:max-w-none">
        <table className="w-full border-2 border-black text-xs print:text-xxs print:min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 w-12 text-center">Sr. No.</th>
              <th className="border border-black px-4 py-3 text-left w-72">Parameters Used</th>
              <th className="border border-black px-4 py-3 text-center w-32">Specified Values</th>
              <th className="border border-black px-4 py-3 text-center w-32">Measured Values</th>
              <th className="border border-black px-4 py-3 text-center w-40">Tolerance</th>
              <th className="border border-black px-4 py-3 text-center bg-green-100 w-24">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const shouldRenderTolerance =
                (!row.hasToleranceRowSpan && row.toleranceRowSpan === 0) ||
                (row.hasToleranceRowSpan && row.isFirstRow);

              return (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 text-center font-bold">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 text-left font-medium leading-tight">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center">{row.specified}</td>
                  <td className="border border-black px-4 py-3 text-center font-semibold">{row.measured}</td>
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center text-xs leading-tight"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 text-sm font-bold rounded ${row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                      {row.remarks}
                    </span>
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
