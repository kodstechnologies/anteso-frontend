// src/components/reports/TestTables/RadiographyMobileHT/MainTestTableForRadiographyMobileHT.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForRadiographyMobileHT: React.FC<MainTestTableProps> = ({ testData }) => {
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
      addRowsForTest("Accuracy of Irradiation Time", testRows);
    }
  }

  // 2. Accuracy of Operating Potential (kVp Accuracy)
  if (testData.accuracyOfOperatingPotential?.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKV || row.avgKvp);
    if (validRows.length > 0) {
      const toleranceSign = testData.accuracyOfOperatingPotential.toleranceSign || "±";
      const toleranceValue = testData.accuracyOfOperatingPotential.toleranceValue || "2.0";
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
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 3. Central Beam Alignment
  if (testData.centralBeamAlignment?.observedTilt) {
    const tiltValue = testData.centralBeamAlignment.observedTilt.value || "-";
    const isPass = testData.centralBeamAlignment.observedTilt.remark === "Pass" || 
                   (tiltValue !== "-" && parseFloat(tiltValue) <= 5);
    addRowsForTest("Central Beam Alignment", [{
      specified: "≤ 5 degrees",
      measured: tiltValue !== "-" ? `${tiltValue} degrees` : "-",
      tolerance: "≤ 5 degrees",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

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
          tolerance: `≤ ${tolerance}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Congruence of Radiation & Optical Field", testRows);
    }
  }

  // 5. Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((spot: any) => spot.focusType || spot.measuredWidth);
    if (validRows.length > 0) {
      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS";
        return {
          specified: spot.statedWidth && spot.statedHeight ? `${spot.statedWidth} × ${spot.statedHeight} mm` : "-",
          measured: spot.measuredWidth && spot.measuredHeight ? `${spot.measuredWidth} × ${spot.measuredHeight} mm` : "-",
          tolerance: "As per standard",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows);
    }
  }

  // 6. Linearity of mAs Loading
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
      addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 7. Consistency of Radiation Output (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kv || row.cv || row.remark);
    if (validRows.length > 0) {
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = testData.outputConsistency.tolerance?.value || "5.0";
      const testRows = validRows.map((row: any) => {
        // Extract CV from remark if available
        let cvValue = row.cv || "-";
        let isPass = false;
        
        if (row.remark) {
          const cvMatch = row.remark.match(/CV:\s*([\d.]+)%/i);
          if (cvMatch) {
            cvValue = cvMatch[1];
          }
          
          if (row.remark.includes("Pass") || row.remark.includes("PASS")) {
            isPass = true;
          } else if (row.remark.includes("Fail") || row.remark.includes("FAIL")) {
            isPass = false;
          } else if (cvValue !== "-") {
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
        }
        
        return {
          specified: row.kv && row.mas ? `${row.kv} kV, ${row.mas} mAs` : row.kv ? `${row.kv} kV` : "Varies",
          measured: cvValue !== "-" ? `${cvValue}%` : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CV)", testRows, true);
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
          measured: maxStr !== "-" ? `${maxStr} mGy/h` : "-",
          tolerance: `≤ ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage Level", testRows);
    }
  }

  // 9. Radiation Protection Survey
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
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

  // 10. Total Filtration (if available)
  if (testData.totalFilteration) {
    const measuredTF = testData.totalFilteration.measuredTF || testData.totalFilteration.measured || "-";
    const appliedKV = testData.totalFilteration.appliedKV || "-";
    const measured = parseFloat(measuredTF);
    const isPass = !isNaN(measured) && measured >= 2.5;
    addRowsForTest("Total Filtration", [{
      specified: appliedKV !== "-" ? `${appliedKV} kV` : "-",
      measured: measuredTF !== "-" ? `${measuredTF} mm Al` : "-",
      tolerance: "≥ 2.5 mm Al (>70 kVp)",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
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

export default MainTestTableForRadiographyMobileHT;
