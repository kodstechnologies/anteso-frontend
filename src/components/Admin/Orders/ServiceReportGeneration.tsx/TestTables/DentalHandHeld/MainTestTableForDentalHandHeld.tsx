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
    const validRows = testData.linearityOfTime.table2.filter((row: any) => row.time || row.col);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      const testRows = validRows.map((row: any) => {
        const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
        const isPass = row.remarks === "Pass" || row.remarks === "PASS" || (row.col ? parseFloat(row.col) <= parseFloat(tolerance) : false);
        return {
          specified: row.time ? `${row.time} s` : "-",
          measured: col,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
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
        // Extract CV from remark if available (format: "CV: X.XX% Pass" or "CV: X.XX% Fail")
        let cvValue = "-";
        let isPass = false;
        
        if (row.remark) {
          const cvMatch = row.remark.match(/CV:\s*([\d.]+)%/i);
          if (cvMatch) {
            cvValue = cvMatch[1];
            const cv = parseFloat(cvValue);
            const tol = parseFloat(toleranceValue);
            
            if (toleranceOperator === "<=") {
              isPass = cv <= tol;
            } else if (toleranceOperator === ">=") {
              isPass = cv >= tol;
            } else if (toleranceOperator === "=") {
              isPass = Math.abs(cv - tol) < 0.01;
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
          measured: cvValue !== "-" ? `${cvValue}%` : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
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
    <div className="mt-20 print:mt-12">
      <h2 className="text-2xl font-bold text-center underline mb-8 print:mb-6">
        SUMMARY OF QA TEST RESULTS
      </h2>

      <div className="overflow-x-auto print:overflow-visible print:max-w-none">
        <table className="w-full border-2 border-black text-xs print:text-xxs print:min-w-full" style={{ width: 'auto' }}>
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

export default MainTestTableForDentalHandHeld;
