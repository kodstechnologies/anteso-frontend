// src/components/reports/TestTables/FixedRadioFluro/MainTestTableForFixedRadioFluro.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForFixedRadioFluro: React.FC<MainTestTableProps> = ({ testData }) => {
  const rows: any[] = [];
  let srNo = 1;

  // Safety check
  if (!testData || typeof testData !== 'object') {
    return <div className="text-center text-gray-500 py-10">No test data provided.</div>;
  }

  // Helper function to check if object is empty or null
  const isEmpty = (obj: any) => {
    if (obj === null || obj === undefined) return true;
    if (typeof obj !== 'object') return false;
    return Object.keys(obj).length === 0;
  };

  // Debug logging
  console.log("MainTestTableForFixedRadioFluro - testData:", testData);
  console.log("MainTestTableForFixedRadioFluro - testData keys:", Object.keys(testData));

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

  // 1. Accuracy of Irradiation Time (Timer Test)
  if (testData.accuracyOfIrradiationTime && !isEmpty(testData.accuracyOfIrradiationTime)) {
    console.log("Processing accuracyOfIrradiationTime:", testData.accuracyOfIrradiationTime);
    if (testData.accuracyOfIrradiationTime.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
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
        addRowsForTest("Accuracy of Irradiation Time", testRows);
      }
    } else if (testData.accuracyOfIrradiationTime.maxDeviation != null) {
      // Fallback: if maxDeviation is available
      const maxDeviation = parseFloat(testData.accuracyOfIrradiationTime.maxDeviation);
      if (!isNaN(maxDeviation)) {
        const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
        const toleranceValue = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "5");
        let isPass = false;
        if (toleranceOperator === "<=") {
          isPass = Math.abs(maxDeviation) <= toleranceValue;
        } else if (toleranceOperator === ">=") {
          isPass = Math.abs(maxDeviation) >= toleranceValue;
        } else if (toleranceOperator === "=") {
          isPass = Math.abs(Math.abs(maxDeviation) - toleranceValue) < 0.01;
        }
        addRowsForTest("Accuracy of Irradiation Time", [{
          specified: "Maximum Deviation",
          measured: `${maxDeviation.toFixed(1)}%`,
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }

  // 2. Accuracy of Operating Potential (kVp)
  if (testData.accuracyOfOperatingPotential && !isEmpty(testData.accuracyOfOperatingPotential) && testData.accuracyOfOperatingPotential.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKvp || row.setKVp || row.measuredKvp || row.measuredKVp);
    if (validRows.length > 0) {
      const toleranceValue = "10"; // ±10% as per ViewServiceReport
      const testRows = validRows.map((row: any) => {
        const setKvp = parseFloat(row.setKvp || row.setKVp || "0");
        const measuredKvp = parseFloat(row.measuredKvp || row.measuredKVp || "0");
        const deviation = row.deviation != null ? Math.abs(row.deviation) : (setKvp > 0 ? Math.abs(((measuredKvp - setKvp) / setKvp) * 100) : 0);
        const isPass = deviation <= 10;
        return {
          specified: setKvp > 0 ? setKvp.toString() : "-",
          measured: measuredKvp > 0 ? measuredKvp.toString() : "-",
          tolerance: "±10%",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp)", testRows);
    }
  }

  // 3. Output Consistency (COV)
  if (testData.outputConsistency) {
    // Check for outputRows array first (like Dental Cone Beam CT)
    if (testData.outputConsistency.outputRows && Array.isArray(testData.outputConsistency.outputRows) && testData.outputConsistency.outputRows.length > 0) {
      const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.cov || row.mean);
      if (validRows.length > 0) {
        const tolerance = testData.outputConsistency.tolerance ? parseFloat(testData.outputConsistency.tolerance) : 0.05;
        const toleranceNum = tolerance > 1 ? tolerance / 100 : tolerance;
        const testRows = validRows.map((row: any) => {
          const covValue = row.cov ? parseFloat(row.cov) : null;
          const cov = covValue != null ? covValue.toFixed(3) : "-";
          const isPass = covValue != null ? covValue <= toleranceNum : false;
          return {
            specified: row.ffd ? `${row.ffd} cm FFD` : "Varies",
            measured: cov,
            tolerance: `≤ ${tolerance > 1 ? tolerance : tolerance * 100}%`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Consistency of Radiation Output (COV)", testRows, true);
      }
    } else if (testData.outputConsistency.cov != null && testData.outputConsistency.cov !== "") {
      // Fallback: if cov is directly on the object
      const cov = parseFloat(testData.outputConsistency.cov);
      if (!isNaN(cov)) {
        const tolerance = 0.05;
        const isPass = cov <= tolerance;
        addRowsForTest("Consistency of Radiation Output (COV)", [{
          specified: "Varies with kVp",
          measured: cov.toFixed(3),
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }


  // 6. Total Filtration (if available)
  if (testData.totalFiltration && !isEmpty(testData.totalFiltration)) {
    const measuredTF = testData.totalFiltration.measuredTF || testData.totalFiltration.measured || "-";
    const appliedKV = testData.totalFiltration.appliedKV || "-";
    const measured = parseFloat(measuredTF);
    const isPass = !isNaN(measured) && measured >= 2.5;
    addRowsForTest("Total Filtration", [{
      specified: appliedKV !== "-" ? `${appliedKV} kV` : "-",
      measured: measuredTF !== "-" ? `${measuredTF} mm Al` : "-",
      tolerance: "≥ 2.5 mm Al (>70 kVp)",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 7. Low Contrast Resolution
  if (testData.lowContrastResolution && !isEmpty(testData.lowContrastResolution) && testData.lowContrastResolution.smallestHoleSize != null && testData.lowContrastResolution.smallestHoleSize !== "") {
    const smallestHoleSize = parseFloat(testData.lowContrastResolution.smallestHoleSize);
    if (!isNaN(smallestHoleSize)) {
      const recommendedStandard = parseFloat(testData.lowContrastResolution.recommendedStandard || "4");
      const isPass = smallestHoleSize <= recommendedStandard;
      addRowsForTest("Low Contrast Resolution", [{
        specified: "Smallest Visible Hole",
        measured: `${smallestHoleSize} mm`,
        tolerance: `≤ ${recommendedStandard} mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 8. High Contrast Resolution
  if (testData.highContrastResolution && !isEmpty(testData.highContrastResolution) && testData.highContrastResolution.measuredLpPerMm != null && testData.highContrastResolution.measuredLpPerMm !== "") {
    const lpmm = parseFloat(testData.highContrastResolution.measuredLpPerMm);
    if (!isNaN(lpmm)) {
      const recommendedStandard = parseFloat(testData.highContrastResolution.recommendedStandard || "1.0");
      const isPass = lpmm >= recommendedStandard;
      addRowsForTest("High Contrast Resolution", [{
        specified: "Line Pairs per mm",
        measured: `${lpmm} lp/mm`,
        tolerance: `≥ ${recommendedStandard} lp/mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 9. Exposure Rate at Table Top
  if (testData.exposureRate && !isEmpty(testData.exposureRate)) {
    console.log("Processing exposureRate:", testData.exposureRate);
    const measuredValue = testData.exposureRate.measuredValue || testData.exposureRate.measured || testData.exposureRate.value;
    if (measuredValue != null && measuredValue !== "") {
      const value = parseFloat(measuredValue);
      if (!isNaN(value)) {
        const limit = 5; // mGy/min
        const isPass = value <= limit;
        addRowsForTest("Exposure Rate at Table Top", [{
          specified: "Measured Value",
          measured: `${value} mGy/min`,
          tolerance: `≤ ${limit} mGy/min`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }

  // 10. Tube Housing Leakage
  if (testData.tubeHousingLeakage && !isEmpty(testData.tubeHousingLeakage)) {
    console.log("Processing tubeHousingLeakage:", testData.tubeHousingLeakage);
    const leakageRate = testData.tubeHousingLeakage.leakageRate || testData.tubeHousingLeakage.leakage || testData.tubeHousingLeakage.value;
    if (leakageRate != null && leakageRate !== "") {
      const rate = parseFloat(leakageRate);
      if (!isNaN(rate)) {
        const limit = 1; // mGy/hr at 1m
        const isPass = rate <= limit;
        addRowsForTest("Radiation Leakage from Tube Housing", [{
          specified: "At 1m distance",
          measured: `${rate} mGy/hr`,
          tolerance: `≤ ${limit} mGy/hr`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }

  // 11. Linearity of mAs Loading
  if (testData.linearityOfmAsLoading && !isEmpty(testData.linearityOfmAsLoading)) {
    console.log("Processing linearityOfmAsLoading:", testData.linearityOfmAsLoading);
    // Check for table2 array first
    if (testData.linearityOfmAsLoading.table2 && Array.isArray(testData.linearityOfmAsLoading.table2) && testData.linearityOfmAsLoading.table2.length > 0) {
      const validRows = testData.linearityOfmAsLoading.table2.filter((row: any) => row.col != null || row.mAs);
      if (validRows.length > 0) {
        const tolerance = 0.1;
        const testRows = validRows.map((row: any) => {
          const col = row.col ? parseFloat(row.col) : null;
          const isPass = col != null ? col <= tolerance : false;
          return {
            specified: row.mAs ? `${row.mAs} mAs` : "Coefficient of Linearity",
            measured: col != null ? col.toFixed(3) : "-",
            tolerance: `≤ ${tolerance}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", testRows);
      }
    } else {
      // Check for col property with various possible names
      const col = testData.linearityOfmAsLoading.col || testData.linearityOfmAsLoading.coefficient || testData.linearityOfmAsLoading.value;
      if (col != null && col !== "") {
        const colValue = parseFloat(col);
        if (!isNaN(colValue)) {
          const tolerance = 0.1;
          const isPass = colValue <= tolerance;
          addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", [{
            specified: "Coefficient of Linearity",
            measured: colValue.toFixed(3),
            tolerance: `≤ ${tolerance}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
        }
      }
    }
  }

  // 12. Congruence of Radiation Field
  if (testData.congruenceOfRadiation && !isEmpty(testData.congruenceOfRadiation)) {
    console.log("Processing congruenceOfRadiation:", testData.congruenceOfRadiation);
    const maxMisalignment = testData.congruenceOfRadiation.maxMisalignment || testData.congruenceOfRadiation.misalignment || testData.congruenceOfRadiation.value;
    if (maxMisalignment != null && maxMisalignment !== "") {
      const misalignment = parseFloat(maxMisalignment);
      if (!isNaN(misalignment)) {
        const limit = 2; // cm
        const isPass = misalignment <= limit;
        addRowsForTest("Congruence of Radiation and Light Field", [{
          specified: "Max Misalignment",
          measured: `${misalignment} cm`,
          tolerance: `≤ ${limit} cm`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }

  // 13. Central Beam Alignment
  if (testData.centralBeamAlignment && !isEmpty(testData.centralBeamAlignment)) {
    console.log("Processing centralBeamAlignment:", testData.centralBeamAlignment);
    const deviation = testData.centralBeamAlignment.deviation || testData.centralBeamAlignment.value;
    const sid = testData.centralBeamAlignment.sid || 100;
    if (deviation != null && deviation !== "") {
      const dev = parseFloat(deviation);
      if (!isNaN(dev)) {
        const limit = 0.01 * sid; // 1% of SID
        const isPass = dev <= limit;
        addRowsForTest("Central Beam Alignment", [{
          specified: "Deviation",
          measured: `${dev} mm`,
          tolerance: `≤ 1% of SID (${sid} mm)`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }

  // Debug: Log rows to see what we're generating
  console.log("MainTestTableForFixedRadioFluro - rows generated:", rows.length);
  console.log("MainTestTableForFixedRadioFluro - rows:", rows);

  if (rows.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>No test results available.</p>
        <p className="text-xs mt-2">Debug: testData keys: {Object.keys(testData).join(", ")}</p>
        <p className="text-xs mt-2">
          accuracyOfOperatingPotential: {testData.accuracyOfOperatingPotential ? "exists" : "null"}
        </p>
        <p className="text-xs mt-2">
          outputConsistency: {testData.outputConsistency ? "exists" : "null"}
        </p>
        <p className="text-xs mt-2">
          lowContrastResolution: {testData.lowContrastResolution ? "exists" : "null"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 print:mt-2">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
        SUMMARY OF QA TEST RESULTS
      </h2>

      <div className="overflow-x-auto print:overflow-visible print:max-w-none">
        <table className="w-full border-2 border-black text-xs print:text-[9px] print:min-w-full" style={{ width: 'auto' }}>
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
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">{row.specified}</td>
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">{row.measured}</td>
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
