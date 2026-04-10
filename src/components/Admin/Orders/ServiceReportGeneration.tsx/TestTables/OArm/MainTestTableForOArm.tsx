// src/components/reports/TestTables/OArm/MainTestTableForOArm.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForOArm: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // 0. Accuracy of Operating Potential (Shared with Total Filtration for O-Arm)
  if (testData.operatingPotential?.measurements && Array.isArray(testData.operatingPotential.measurements)) {
    const validRows = testData.operatingPotential.measurements.filter((row: any) => row.appliedKvp || row.averageKvp || row.measuredValues);
    if (validRows.length > 0) {
      const toleranceSign = testData.operatingPotential.tolerance?.sign || "Â±";
      const toleranceValue = testData.operatingPotential.tolerance?.value || "2.0";
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
          if (vals.length > 0) {
            avgKvpNum = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
          }
        }
        const measuredDisplay = avgKvpNum !== null ? avgKvpNum.toFixed(2) : "-";

        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
          const appliedRaw = parseFloat(row.appliedKvp);
          if (!isNaN(appliedRaw) && avgKvpNum !== null && appliedRaw > 0) {
            const deviation = Math.abs(((avgKvpNum - appliedRaw) / appliedRaw) * 100);
            isPass = deviation <= parseFloat(toleranceValue);
          }
        }
        return {
          specified: row.appliedKvp ? `${row.appliedKvp} kVp` : "-",
          measured: `${measuredDisplay} kVp`,
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential", testRows);
    }
  }

  // 0.5. Accuracy of Irradiation Time
  if (
    testData.accuracyOfIrradiationTime?.irradiationTimes &&
    Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)
  ) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter(
      (row: any) => row.setTime || row.measuredTime
    );
    if (validRows.length > 0) {
      const tol = testData.accuracyOfIrradiationTime.tolerance || {};
      const tolOp = tol.operator || "<=";
      const tolVal = parseFloat(tol.value ?? "10");

      const calcError = (setVal: any, measuredVal: any): number | null => {
        const s = parseFloat(String(setVal ?? ""));
        const m = parseFloat(String(measuredVal ?? ""));
        if (isNaN(s) || isNaN(m) || s === 0) return null;
        return Math.abs(((m - s) / s) * 100);
      };

      const passesTolerance = (err: number): boolean => {
        if (isNaN(tolVal)) return false;
        switch (tolOp) {
          case ">":
            return err > tolVal;
          case "<":
            return err < tolVal;
          case ">=":
            return err >= tolVal;
          case "<=":
            return err <= tolVal;
          case "=":
            return Math.abs(err - tolVal) < 0.0001;
          default:
            return err <= tolVal;
        }
      };

      const testRows = validRows.map((row: any) => {
        const err = calcError(row.setTime, row.measuredTime);
        const measured = err !== null ? `${err.toFixed(2)}%` : "-";
        const explicitRemark = row.remark || row.remarks || "";
        const isPass =
          explicitRemark === "Pass" ||
          explicitRemark === "PASS" ||
          (err !== null && passesTolerance(err));

        return {
          specified: row.setTime ? `${row.setTime} mSec` : "-",
          measured,
          tolerance: `Error ${tolOp} ${tol.value || "10"}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });

      addRowsForTest("Accuracy of Irradiation Time", testRows, true);
    }
  }

  // 1. Total Filtration (O-Arm Standardized)
  if (testData.totalFilteration?.totalFiltration) {
    const tf = testData.totalFilteration.totalFiltration;
    const ft = testData.totalFilteration.filtrationTolerance || {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
    };

    const kvpNum = parseFloat(tf.atKvp);
    const measuredNum = parseFloat(tf.required || tf.measured); // O-Arm model uses 'required' often for the result

    let requiredTolerance = 2.5;
    if (!isNaN(kvpNum)) {
      if (kvpNum < parseFloat(ft.kvThreshold1)) requiredTolerance = parseFloat(ft.forKvGreaterThan70);
      else if (kvpNum <= parseFloat(ft.kvThreshold2)) requiredTolerance = parseFloat(ft.forKvBetween70And100);
      else requiredTolerance = parseFloat(ft.forKvGreaterThan100);
    }

    const isPass = !isNaN(measuredNum) && measuredNum >= requiredTolerance;
    const toleranceStr = `â‰¥ ${requiredTolerance} mm Al (At ${tf.atKvp || "-"} kVp)`;

    addRowsForTest("Total Filtration", [{
      specified: (tf.required || tf.measured) ? `${tf.required || tf.measured} mm Al` : "-",
      measured: `â‰¥ ${requiredTolerance} mm Al`,
      tolerance: `Reference kVp: ${tf.atKvp || "-"}`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 2. Consistency of Radiation Output (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kvp || row.cov);
    if (validRows.length > 0) {
      const tolerance = testData.outputConsistency.tolerance || "0.02";
      const testRows = validRows.map((row: any) => {
        const covVal = parseFloat(row.cov);
        const displayCov = !isNaN(covVal) ? covVal.toFixed(4) : "-";
        const isPass = row.remark === "Pass" || (!isNaN(covVal) && covVal <= parseFloat(tolerance));
        return {
          specified: row.kvp && row.ma ? `${row.kvp} kVp, ${row.ma} mA` : row.kvp ? `${row.kvp} kVp` : "Varies",
          measured: displayCov,
          tolerance: `â‰¤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (COV)", testRows, true);
    }
  }

  // 3. High Contrast Resolution
  if (testData.highContrastResolution) {
    const measuredLpPerMm = testData.highContrastResolution.measuredLpPerMm || "";
    const recommendedStandard = testData.highContrastResolution.recommendedStandard || "1.50";
    const measured = parseFloat(measuredLpPerMm);
    const standard = parseFloat(recommendedStandard);
    const isPass = !isNaN(measured) && !isNaN(standard) && measured >= standard;
    addRowsForTest("High Contrast Resolution", [{
      specified: "Line Pairs per mm",
      measured: measuredLpPerMm ? `${measuredLpPerMm} lp/mm` : "-",
      tolerance: `â‰¥ ${recommendedStandard} lp/mm`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 4. Low Contrast Resolution
  if (testData.lowContrastResolution) {
    const smallestHoleSize = testData.lowContrastResolution.smallestHoleSize || "";
    const recommendedStandard = testData.lowContrastResolution.recommendedStandard || "3.0";
    const measured = parseFloat(smallestHoleSize);
    const standard = parseFloat(recommendedStandard);
    const isPass = !isNaN(measured) && !isNaN(standard) && measured <= standard;
    addRowsForTest("Low Contrast Resolution", [{
      specified: "Smallest Visible Hole",
      measured: smallestHoleSize ? `${smallestHoleSize} mm` : "-",
      tolerance: `â‰¤ ${recommendedStandard} mm`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 5. Exposure Rate at Table Top (Enhanced Logic)
  if (testData.exposureRateTableTop?.rows && Array.isArray(testData.exposureRateTableTop.rows)) {
    const validRows = testData.exposureRateTableTop.rows.filter((row: any) => row.distance || row.exposure);
    if (validRows.length > 0) {
      const aecTol = testData.exposureRateTableTop.aecTolerance || "10";
      const manualTol = testData.exposureRateTableTop.nonAecTolerance || "5"; // 'nonAecTolerance' matches OArm component state

      const testRows = validRows.map((row: any) => {
        const isPass = row.result === "PASS" || row.result === "Pass";
        const isAEC = row.remark === "AEC Mode";
        const toleranceVal = isAEC ? aecTol : manualTol;

        return {
          specified: row.distance ? `${row.distance} cm` : "-",
          measured: row.exposure ? `${row.exposure} cGy/min` : "-", // Updated unit to cGy/min
          tolerance: `â‰¤ ${toleranceVal} cGy/min`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
    }
  }

  // 6. Tube Housing Leakage (Enhanced Logic)
  const tubeLeakRows =
    testData.tubeHousingLeakage?.leakageRows ||
    testData.tubeHousingLeakage?.leakageMeasurements ||
    testData.tubeHousingLeakage?.readings ||
    testData.tubeHousingLeakage?.measurements;
  if (tubeLeakRows && Array.isArray(tubeLeakRows)) {
    const validRows = tubeLeakRows.filter((row: any) => row.location || row.max || row.left || row.right || row.front || row.back || row.top);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.toleranceValue || "1.0";
      const toleranceOperator = testData.tubeHousingLeakage.toleranceOperator || "less than or equal to";
      const toleranceTime = testData.tubeHousingLeakage.toleranceTime === '1' ? '1 hour' : '1 hour';

      // Map operator to symbol
      let opSymbol = "â‰¤";
      if (toleranceOperator === "greater than or equal to") opSymbol = "â‰¥";
      if (toleranceOperator === "=") opSymbol = "=";

      const toleranceDisplay = `${opSymbol} ${toleranceValue} mGy/hr`;

      const testRows = validRows.map((row: any) => {
        const max = row.max || "-";
        // Remark logic handled in ViewServiceReport transformation mostly, specifically 'Pass' string vs 'PASS'
        const isPass = row.remark === "Pass" || row.remark === "PASS";

        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} mGy/hr` : "-",
          tolerance: toleranceDisplay,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Tube Housing Leakage", testRows, true); // Use shared tolerance
    }
  }

  // 7. Linearity of mA/mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const lin = testData.linearityOfMasLoading;
    const isMaLinear = lin.selection === "mA" || lin.selection === "ma";
    const selectionLabel = isMaLinear ? "mA" : "mAs";
    const testTitle = isMaLinear
      ? "Linearity of mA Loading (Coefficient of Linearity)"
      : "Linearity of mAs Loading (Coefficient of Linearity)";
    const appliedVal = (row: any) => row.mAsApplied ?? row.ma ?? row.mAsRange;
    const validRows = lin.table2.filter((row: any) => {
      const v = appliedVal(row);
      return v != null && String(v).trim() !== "";
    });
    if (validRows.length > 0) {
      const tolerance = lin.tolerance || "0.1";
      const toleranceOperator = lin.toleranceOperator || "<=";
      const docCol = lin.col;
      const docRemarks = lin.remarks;

      const testRows = validRows.map((row: any) => {
        const colVal = row.col != null && row.col !== "" ? row.col : docCol;
        const colNum = colVal != null && colVal !== "" && !isNaN(parseFloat(String(colVal))) ? parseFloat(String(colVal)) : NaN;
        const col = !isNaN(colNum) ? colNum.toFixed(3) : "-";
        const isPass = row.remarks === "Pass" || row.remarks === "PASS" || docRemarks === "Pass" || docRemarks === "PASS" || (!isNaN(colNum) && colNum <= parseFloat(tolerance));
        const app = appliedVal(row);

        return {
          specified: (row.kv || lin.kv) ? `${row.kv || lin.kv} kV` : (app != null && app !== "" ? `${app} ${selectionLabel}` : "-"),
          measured: col,
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest(testTitle, testRows);
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
        <table className="w-full border-2 border-black text-xs print:text-[9px] mx-auto" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-[7%] text-center">Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-left w-[33%]">Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-[18%]">Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-[18%]">Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-[16%]">Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center bg-green-100 w-[8%]">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const shouldRenderTolerance =
                (!row.hasToleranceRowSpan && row.toleranceRowSpan === 0) ||
                (row.hasToleranceRowSpan && row.isFirstRow);

              return (
                <tr key={index}>
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center font-bold">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-left font-medium leading-tight">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center">{row.specified}</td>
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold">{row.measured}</td>
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center leading-tight"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-bold ${
                    row.remarks === "Pass" ? "bg-green-100 text-green-800" :
                    row.remarks === "Fail" ? "bg-red-100 text-red-800" : ""
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

export default MainTestTableForOArm;

