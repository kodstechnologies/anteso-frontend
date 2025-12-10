// src/components/reports/TestTables/DentalHandHeld/MainTestTableForDentalHandHeld.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForDentalHandHeld: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // 1. Accuracy of Operating Potential (kVp) and Irradiation Time
  if (testData.accuracyOfOperatingPotentialAndTime?.rows && Array.isArray(testData.accuracyOfOperatingPotentialAndTime.rows)) {
    const validRows = testData.accuracyOfOperatingPotentialAndTime.rows.filter((row: any) => row.appliedKvp || row.avgKvp || row.setTime || row.avgTime);
    if (validRows.length > 0) {
      const kvpToleranceSign = testData.accuracyOfOperatingPotentialAndTime.kvpToleranceSign || "±";
      const kvpToleranceValue = testData.accuracyOfOperatingPotentialAndTime.kvpToleranceValue || "5";
      const timeToleranceSign = testData.accuracyOfOperatingPotentialAndTime.timeToleranceSign || "±";
      const timeToleranceValue = testData.accuracyOfOperatingPotentialAndTime.timeToleranceValue || "10";
      
      // Add kVp rows
      const kvpRows = validRows.map((row: any) => {
        const appliedKvp = parseFloat(row.appliedKvp || row.appliedkVp);
        const avgKvp = parseFloat(row.avgKvp);
        let isPass = false;
        
        if (row.remark === "PASS" || row.remark === "Pass") {
          isPass = true;
        } else if (row.remark === "FAIL" || row.remark === "Fail") {
          isPass = false;
        } else if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
          const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
          const tol = parseFloat(kvpToleranceValue);
          isPass = deviation <= tol;
        }
        
        return {
          specified: row.appliedKvp || row.appliedkVp || "-",
          measured: row.avgKvp || "-",
          tolerance: `${kvpToleranceSign}${kvpToleranceValue} kV`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp)", kvpRows);
      
      // Add Time rows
      const timeRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const avgTime = parseFloat(row.avgTime);
        let isPass = false;
        
        if (row.remark === "PASS" || row.remark === "Pass") {
          isPass = true;
        } else if (row.remark === "FAIL" || row.remark === "Fail") {
          isPass = false;
        } else if (!isNaN(setTime) && !isNaN(avgTime) && setTime > 0) {
          const deviation = Math.abs(((avgTime - setTime) / setTime) * 100);
          const tol = parseFloat(timeToleranceValue);
          isPass = deviation <= tol;
        }
        
        return {
          specified: row.setTime || "-",
          measured: row.avgTime || "-",
          tolerance: `${timeToleranceSign}${timeToleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time", timeRows);
    }
  }

  // 2. Linearity of Time
  if (testData.linearityOfTime?.table2 && Array.isArray(testData.linearityOfTime.table2)) {
    const validRows = testData.linearityOfTime.table2.filter((row: any) => row.time);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      // Get col and remarks from top level (not from rows)
      const col = testData.linearityOfTime.col ? parseFloat(testData.linearityOfTime.col).toFixed(3) : "-";
      const remarks = testData.linearityOfTime.remarks || "";
      const isPass = remarks === "Pass" || remarks === "PASS" || (col !== "-" ? parseFloat(col) <= parseFloat(tolerance) : false);
      
      // Create a single row for Coefficient of Linearity (it's calculated from all rows, not per row)
      const testRows = [{
        specified: "-",
        measured: col,
        tolerance: `≤ ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest("Linearity of Time (Coefficient of Linearity)", testRows);
    }
  }

  // 3. Reproducibility of Radiation Output
  if (testData.reproducibilityOfRadiationOutput?.outputRows && Array.isArray(testData.reproducibilityOfRadiationOutput.outputRows)) {
    const validRows = testData.reproducibilityOfRadiationOutput.outputRows.filter((row: any) => row.kv || row.avg || row.remark);
    if (validRows.length > 0) {
      const toleranceOperator = testData.reproducibilityOfRadiationOutput.tolerance?.operator || "<=";
      const toleranceValue = testData.reproducibilityOfRadiationOutput.tolerance?.value || "5.0";
      const testRows = validRows.map((row: any) => {
        // Extract CV from remark (format: "X.XXXX → Pass" or "X.XXXX → Fail" - CV is stored as decimal)
        let cvValue = "-";
        let isPass = false;
        
        if (row.remark) {
          // Match format: "X.XXXX → Pass" or "X.XXXX → Fail" (CV is stored as decimal)
          const cvMatch = row.remark.match(/^([\d.]+)\s*→/);
          if (cvMatch) {
            const cvDecimal = parseFloat(cvMatch[1]);
            // Display CV as decimal (not percentage)
            cvValue = cvDecimal.toFixed(4);
            
            // Convert tolerance to decimal for comparison
            // If tolerance >= 1, assume it's percentage and convert to decimal
            // If tolerance < 1, assume it's already in decimal format
            const tol = parseFloat(toleranceValue);
            const toleranceDecimal = tol >= 1 ? tol / 100 : tol;
            
            // Compare using the selected operator (both values in decimal)
            if (toleranceOperator === "<") {
              isPass = cvDecimal < toleranceDecimal;
            } else if (toleranceOperator === ">") {
              isPass = cvDecimal > toleranceDecimal;
            } else if (toleranceOperator === "<=") {
              isPass = cvDecimal <= toleranceDecimal;
            } else if (toleranceOperator === ">=") {
              isPass = cvDecimal >= toleranceDecimal;
            } else if (toleranceOperator === "=") {
              isPass = Math.abs(cvDecimal - toleranceDecimal) < 0.0001;
            }
          }
          
          // Check if remark already contains Pass/Fail
          if (row.remark.includes("Pass") || row.remark.includes("PASS")) {
            isPass = true;
          } else if (row.remark.includes("Fail") || row.remark.includes("FAIL")) {
            isPass = false;
          }
        }
        
        return {
          specified: row.kv && row.mas ? `${row.kv} kV, ${row.mas} mAs` : row.kv ? `${row.kv} kV` : "-",
          measured: cvValue !== "-" ? cvValue : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Reproducibility of Radiation Output (CV)", testRows);
    }
  }

  // 4. Radiation Leakage from Tube Housing
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location || row.max);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.tolerance?.value || "1.0";
      const testRows = validRows.map((row: any) => {
        const max = row.max || "-";
        const isPass = testData.tubeHousingLeakage.calculatedResult?.remark === "Pass" || 
                      (max !== "-" && parseFloat(max) < parseFloat(toleranceValue));
        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} ${row.unit || "mGy/h"}` : "-",
          tolerance: `≤ ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage from Tube Housing", testRows);
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
        <table className="border-2 border-black text-xs print:text-[9px] print:min-w-full mx-auto" style={{ width: 'auto' }}>
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
  );
};

export default MainTestTableForDentalHandHeld;
