// src/components/reports/TestTables/BMD/MainTestTableForBMD.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForBMD: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // Helper to check if data exists
  const isEmpty = (obj: any): boolean => {
    if (!obj) return true;
    if (typeof obj !== "object") return false;
    return Object.keys(obj).length === 0;
  };

  // 1. Accuracy of Operating Potential
  if (testData.accuracyOfOperatingPotential && !isEmpty(testData.accuracyOfOperatingPotential)) {
    const test = testData.accuracyOfOperatingPotential;
    if (test.rows && Array.isArray(test.rows) && test.rows.length > 0) {
      const validRows = test.rows.filter((row: any) => row.appliedKvp || row.appliedkVp || row.avgKvp);
      if (validRows.length > 0) {
        const toleranceSign = test.kvpToleranceSign || "±";
        const toleranceValue = test.kvpToleranceValue || "5";
        const testRows = validRows.map((row: any) => {
          const appliedKvp = parseFloat(row.appliedKvp || row.appliedkVp) || 0;
          const avgKvp = parseFloat(row.avgKvp) || 0;
          let isPass = false;
          
          if (row.remark === "PASS" || row.remark === "Pass") {
            isPass = true;
          } else if (row.remark === "FAIL" || row.remark === "Fail") {
            isPass = false;
          } else if (appliedKvp > 0 && avgKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }
          
          return {
            specified: row.appliedKvp || row.appliedkVp || "-",
            measured: row.avgKvp || "-",
            tolerance: `${toleranceSign}${toleranceValue}%`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
      }
    }
  }

  // 2. Accuracy of Irradiation Time (if available)
  if (testData.accuracyOfIrradiationTime && !isEmpty(testData.accuracyOfIrradiationTime)) {
    const test = testData.accuracyOfIrradiationTime;
    if (test.rows && Array.isArray(test.rows) && test.rows.length > 0) {
      const validRows = test.rows.filter((row: any) => row.setTime || row.avgTime);
      if (validRows.length > 0) {
        const toleranceSign = test.timeToleranceSign || "±";
        const toleranceValue = test.timeToleranceValue || "10";
        const testRows = validRows.map((row: any) => {
          const setTime = parseFloat(row.setTime) || 0;
          const avgTime = parseFloat(row.avgTime) || 0;
          let isPass = false;
          
          if (row.remark === "PASS" || row.remark === "Pass") {
            isPass = true;
          } else if (row.remark === "FAIL" || row.remark === "Fail") {
            isPass = false;
          } else if (setTime > 0 && avgTime > 0) {
            const error = Math.abs((avgTime - setTime) / setTime * 100);
            const tol = parseFloat(toleranceValue);
            isPass = error <= tol;
          }
          
          return {
            specified: row.setTime || "-",
            measured: row.avgTime || "-",
            tolerance: `${toleranceSign}${toleranceValue}%`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Accuracy of Irradiation Time", testRows);
      }
    }
  }

  // 3. Reproducibility of Radiation Output (COV)
  if (testData.reproducibilityOfRadiationOutput && !isEmpty(testData.reproducibilityOfRadiationOutput)) {
    const test = testData.reproducibilityOfRadiationOutput;
    if (test.outputRows && Array.isArray(test.outputRows) && test.outputRows.length > 0) {
      const validRows = test.outputRows.filter((row: any) => row.kv || row.cv);
      if (validRows.length > 0) {
        const tolerance = test.tolerance || { operator: "<=", value: "5.0" };
        const tolValue = tolerance.value || "5.0";
        const tolOp = tolerance.operator || "<=";
        const testRows = validRows.map((row: any) => {
          const cv = row.cv ? parseFloat(row.cv) : null;
          let isPass = false;
          
          if (row.remark === "Pass" || row.remark === "PASS") {
            isPass = true;
          } else if (row.remark === "Fail" || row.remark === "FAIL") {
            isPass = false;
          } else if (cv !== null && !isNaN(cv)) {
            const tol = parseFloat(tolValue);
            if (tolOp === "<=" || tolOp === "<") {
              isPass = cv <= tol;
            } else if (tolOp === ">=" || tolOp === ">") {
              isPass = cv >= tol;
            }
          }
          
          return {
            specified: row.kv && row.mas ? `${row.kv} kV, ${row.mas} mAs` : row.kv ? `${row.kv} kV` : "-",
            measured: cv !== null ? cv.toFixed(3) : "-",
            tolerance: `${tolOp} ${tolValue}%`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Reproducibility of Radiation Output (COV)", testRows, true);
      }
    }
  }

  // 4. Linearity of mA Loading
  if (testData.linearityOfMaLoading && !isEmpty(testData.linearityOfMaLoading)) {
    const test = testData.linearityOfMaLoading;
    if (test.rows && Array.isArray(test.rows) && test.rows.length > 0) {
      const validRows = test.rows.filter((row: any) => row.ma || row.coefficient);
      if (validRows.length > 0) {
        const tolerance = test.tolerance || "0.1";
        const testRows = validRows.map((row: any) => {
          const coefficient = row.coefficient ? parseFloat(row.coefficient) : null;
          let isPass = false;
          
          if (row.remark === "Pass" || row.remark === "PASS") {
            isPass = true;
          } else if (row.remark === "Fail" || row.remark === "FAIL") {
            isPass = false;
          } else if (coefficient !== null && !isNaN(coefficient)) {
            const tol = parseFloat(tolerance);
            isPass = coefficient <= tol;
          }
          
          return {
            specified: row.ma ? `${row.ma} mA` : "-",
            measured: coefficient !== null ? coefficient.toFixed(3) : "-",
            tolerance: `≤ ${tolerance}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Linearity of mA Loading (Coefficient of Linearity)", testRows);
      }
    }
  }

  // 5. Radiation Leakage Level
  if (testData.tubeHousingLeakage && !isEmpty(testData.tubeHousingLeakage)) {
    const test = testData.tubeHousingLeakage;
    if (test.leakageRows && Array.isArray(test.leakageRows) && test.leakageRows.length > 0) {
      const validRows = test.leakageRows.filter((row: any) => row.location || row.max);
      if (validRows.length > 0) {
        const toleranceValue = test.toleranceValue || "1";
        const toleranceTime = test.toleranceTime || "1";
        const toleranceOperator = test.toleranceOperator || "less than or equal to";
        const testRows = validRows.map((row: any) => {
          const max = row.max || "-";
          let isPass = false;
          
          if (row.remark === "Pass" || row.remark === "PASS") {
            isPass = true;
          } else if (row.remark === "Fail" || row.remark === "FAIL") {
            isPass = false;
          } else if (max !== "-") {
            const maxVal = parseFloat(max);
            const tol = parseFloat(toleranceValue);
            isPass = maxVal <= tol;
          }
          
          return {
            specified: row.location || "-",
            measured: max !== "-" ? `${max} ${row.unit || "mGy/h"}` : "-",
            tolerance: `${toleranceOperator === "less than or equal to" ? "≤" : toleranceOperator === "greater than or equal to" ? "≥" : "="} ${toleranceValue} mGy/h`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Radiation Leakage Level", testRows);
      }
    }
  }

  // 6. Radiation Protection Survey
  // if (testData.radiationProtectionSurvey && !isEmpty(testData.radiationProtectionSurvey)) {
  //   const test = testData.radiationProtectionSurvey;
  //   if (test.locations && Array.isArray(test.locations) && test.locations.length > 0) {
  //     const validRows = test.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
  //     if (validRows.length > 0) {
  //       const testRows = validRows.map((loc: any) => {
  //         const mRPerWeek = loc.mRPerWeek || "-";
  //         const limit = loc.category === "worker" ? 40 : 2;
  //         let isPass = false;
          
  //         if (loc.result === "PASS" || loc.result === "Pass") {
  //           isPass = true;
  //         } else if (loc.result === "FAIL" || loc.result === "Fail") {
  //           isPass = false;
  //         } else if (mRPerWeek !== "-") {
  //           const val = parseFloat(mRPerWeek);
  //           isPass = val <= limit;
  //         }
          
  //         return {
  //           specified: loc.location || "-",
  //           measured: mRPerWeek !== "-" ? `${mRPerWeek} mR/week` : "-",
  //           tolerance: loc.category === "worker" ? "≤ 40 mR/week" : "≤ 2 mR/week",
  //           remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
  //         };
  //       });
  //       addRowsForTest("Radiation Protection Survey", testRows);
  //     }
  //   }
  // }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-4">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-4">
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
                <tr key={index}>
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 text-center font-bold bg-transparent print:bg-transparent">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 text-left font-medium leading-tight bg-transparent print:bg-transparent">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center bg-transparent print:bg-transparent">{row.specified}</td>
                  <td className="border border-black px-4 py-3 text-center font-semibold bg-transparent print:bg-transparent">{row.measured}</td>
                  {shouldRenderTolerance && (
                    <td 
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center text-xs leading-tight bg-transparent print:bg-transparent"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center bg-transparent print:bg-transparent">
                    <span className={`inline-block px-3 py-1 text-sm font-bold rounded ${
                      row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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

export default MainTestTableForBMD;
