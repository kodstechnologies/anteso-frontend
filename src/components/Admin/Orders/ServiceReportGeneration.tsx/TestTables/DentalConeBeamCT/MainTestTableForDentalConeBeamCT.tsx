// src/components/reports/TestTables/DentalConeBeamCT/MainTestTableForDentalConeBeamCT.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForDentalConeBeamCT: React.FC<MainTestTableProps> = ({ testData }) => {
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
    toleranceRowSpan: boolean = false // Optional parameter to control tolerance rowSpan
  ) => {
    if (testRows.length === 0) return;
    
    // Get shared tolerance value if toleranceRowSpan is enabled
    const sharedTolerance = toleranceRowSpan ? testRows[0]?.tolerance : null;
    
    testRows.forEach((testRow, idx) => {
      rows.push({
        srNo: idx === 0 ? srNo++ : null, // Only first row gets serial number
        parameter: idx === 0 ? parameter : null, // Only first row gets parameter name
        rowSpan: idx === 0 ? testRows.length : 0, // First row spans all rows
        specified: testRow.specified,
        measured: testRow.measured,
        tolerance: toleranceRowSpan ? (idx === 0 ? sharedTolerance : null) : testRow.tolerance,
        toleranceRowSpan: toleranceRowSpan ? (idx === 0 ? testRows.length : 0) : 0,
        hasToleranceRowSpan: toleranceRowSpan, // Flag to track if this test uses tolerance rowSpan
        remarks: testRow.remarks,
        isFirstRow: idx === 0,
      });
    });
  };

  // 1. Accuracy of Irradiation Time
  if (testData.irradiationTime?.irradiationTimes && Array.isArray(testData.irradiationTime.irradiationTimes)) {
    const validRows = testData.irradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.irradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.irradiationTime.tolerance?.value || "5";
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

  // 2. Accuracy of Operating Potential (kVp Accuracy)
  if (testData.operatingPotential?.rows && Array.isArray(testData.operatingPotential.rows)) {
    const validRows = testData.operatingPotential.rows.filter((row: any) => row.appliedKvp || row.averageKvp);
    if (validRows.length > 0) {
      const toleranceSign = testData.operatingPotential.toleranceSign || "±";
      const toleranceValue = testData.operatingPotential.toleranceValue || "2.0";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
          // Calculate Pass/Fail if remarks not available
          const appliedKvp = parseFloat(row.appliedKvp);
          const avgKvp = parseFloat(row.averageKvp);
          if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }
        }
        return {
          specified: row.appliedKvp || "-",
          measured: row.averageKvp || "-",
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 3. Consistency of Radiation Output (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kvp || row.cov);
    if (validRows.length > 0) {
      const tolerance = testData.outputConsistency.tolerance || "0.05";
      const testRows = validRows.map((row: any) => {
        const cov = row.cov ? parseFloat(row.cov).toFixed(3) : "-";
        const isPass = row.remarks === "Pass" || (row.cov ? parseFloat(row.cov) <= parseFloat(tolerance) : false);
        return {
          specified: row.kvp ? `${row.kvp} kVp` : "Varies with kVp",
          measured: cov,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (COV)", testRows, true); // Enable tolerance rowSpan
    }
  }

  // 4. Linearity of mA Loading
  if (testData.linearityOfMaLoading?.table2Rows && Array.isArray(testData.linearityOfMaLoading.table2Rows)) {
    const validRows = testData.linearityOfMaLoading.table2Rows.filter((row: any) => row.ma || row.col);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMaLoading.tolerance || "0.1";
      const testRows = validRows.map((row: any) => {
        const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
        const isPass = row.remarks === "Pass" || row.remarks === "PASS" || (row.col ? parseFloat(row.col) <= parseFloat(tolerance) : false);
        return {
          specified: row.ma ? `${row.ma} mA` : "-",
          measured: col,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Linearity of mA Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 5. Maximum Radiation Leakage from Tube Housing
  if (testData.radiationLeakage?.leakageRows && Array.isArray(testData.radiationLeakage.leakageRows)) {
    const validRows = testData.radiationLeakage.leakageRows.filter((row: any) => row.location || row.max);
    if (validRows.length > 0) {
      const toleranceValue = testData.radiationLeakage.toleranceValue || "1";
      const toleranceTime = testData.radiationLeakage.toleranceTime || "1";
      const toleranceOperator = testData.radiationLeakage.toleranceOperator || "<=";
      
      // Use maxRadiationLeakage from the data, or calculate it
      let measuredValue = testData.radiationLeakage.maxRadiationLeakage || "";
      let measuredNum = parseFloat(measuredValue) || 0;
      
      // If maxRadiationLeakage is not available, calculate from maxLeakageResult
      if (!measuredValue || measuredValue === "" || measuredValue === "-") {
        const maxLeakageResult = testData.radiationLeakage.maxLeakageResult || "";
        const maxLeakageResultNum = parseFloat(maxLeakageResult) || 0;
        if (maxLeakageResultNum > 0) {
          measuredNum = maxLeakageResultNum / 114;
          measuredValue = measuredNum.toFixed(3);
        } else {
          measuredValue = "-";
        }
      } else {
        measuredValue = String(measuredValue);
        measuredNum = parseFloat(measuredValue) || 0;
      }
      
      // Calculate remark based on maxRadiationLeakage
      let remark = "";
      if (measuredValue !== "-" && measuredValue !== "") {
        const tol = parseFloat(toleranceValue);
        if (!isNaN(measuredNum) && !isNaN(tol) && tol > 0) {
          if (toleranceOperator === "<=" || toleranceOperator === "less than or equal to") {
            remark = measuredNum <= tol ? "Pass" : "Fail";
          } else if (toleranceOperator === ">=" || toleranceOperator === "greater than or equal to") {
            remark = measuredNum >= tol ? "Pass" : "Fail";
          } else if (toleranceOperator === "<" || toleranceOperator === "less than") {
            remark = measuredNum < tol ? "Pass" : "Fail";
          } else if (toleranceOperator === ">" || toleranceOperator === "greater than") {
            remark = measuredNum > tol ? "Pass" : "Fail";
          } else if (toleranceOperator === "=" || toleranceOperator === "equal to") {
            remark = Math.abs(measuredNum - tol) < 0.001 ? "Pass" : "Fail";
          } else {
            remark = "-";
          }
        } else {
          remark = "-";
        }
      } else {
        remark = "-";
      }
      
      // Format tolerance operator for display
      let toleranceDisplay = "";
      if (toleranceOperator === "<=" || toleranceOperator === "less than or equal to") {
        toleranceDisplay = "≤";
      } else if (toleranceOperator === ">=" || toleranceOperator === "greater than or equal to") {
        toleranceDisplay = "≥";
      } else if (toleranceOperator === "<" || toleranceOperator === "less than") {
        toleranceDisplay = "<";
      } else if (toleranceOperator === ">" || toleranceOperator === "greater than") {
        toleranceDisplay = ">";
      } else {
        toleranceDisplay = "=";
      }
      
      addRowsForTest("Maximum Radiation Leakage from Tube Housing", [{
        specified: "Tube Housing",
        measured: measuredValue !== "-" && measuredValue !== "" ? `${measuredValue} mGy/h` : "-",
        tolerance: `${toleranceDisplay} ${toleranceValue} mGy/h`,
        remarks: (remark === "Pass" || remark === "PASS" ? "Pass" : remark === "Fail" || remark === "FAIL" ? "Fail" : "-") as "Pass" | "Fail",
      }]);
    }
  }

  // 6. Total Filtration (if available)
  if (testData.totalFiltration) {
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

  // 7. Details of Radiation Protection Survey (if available)
  if (testData.radiationSurvey?.locations && Array.isArray(testData.radiationSurvey.locations)) {
    const validRows = testData.radiationSurvey.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const mRPerWeek = loc.mRPerWeek || "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const isPass = loc.result === "PASS" || (mRPerWeek !== "-" && parseFloat(mRPerWeek) <= limit);
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

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-2 flex justify-center">
      <div className="w-full max-w-full">
        <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
          SUMMARY OF QA TEST RESULTS
        </h2>

        <div className="overflow-x-auto print:overflow-visible print:max-w-none flex justify-center">
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
              // Determine if we should render tolerance cell
              // Render tolerance if: 
              // 1. No rowSpan case (toleranceRowSpan === 0 and hasToleranceRowSpan is false), OR
              // 2. RowSpan case AND it's the first row
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
                  <td className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center print:text-[9px] print:leading-tight ${
                    row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
    </div>
  );
};

export default MainTestTableForDentalConeBeamCT;
