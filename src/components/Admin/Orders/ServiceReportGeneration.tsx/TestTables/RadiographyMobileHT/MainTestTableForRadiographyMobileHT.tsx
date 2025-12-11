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

  // 2.5. Total Filtration - Accuracy of Operating Potential
  if (testData.totalFilteration?.measurements && Array.isArray(testData.totalFilteration.measurements)) {
    const validRows = testData.totalFilteration.measurements.filter((row: any) => row.appliedKvp || row.averageKvp);
    if (validRows.length > 0) {
      const toleranceSign = testData.totalFilteration.tolerance?.sign || "±";
      const toleranceValue = testData.totalFilteration.tolerance?.value || "2.0";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
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
      addRowsForTest("Accuracy of Operating Potential (Total Filtration)", testRows);
    }
  }

  // 2.6. Total Filtration Result
  if (testData.totalFilteration?.totalFiltration) {
    const measured = testData.totalFilteration.totalFiltration.measured || "-";
    const required = testData.totalFilteration.totalFiltration.required || "-";
    const measuredVal = parseFloat(measured);
    const requiredVal = parseFloat(required);
    const isPass = !isNaN(measuredVal) && !isNaN(requiredVal) && measuredVal >= requiredVal;
    
    // Build tolerance string - show all ranges as per standard
    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";
    
    addRowsForTest("Total Filtration", [{
      specified: required !== "-" ? `${required} mm Al` : "-",
      measured: measured !== "-" ? `${measured} mm Al` : "-",
      tolerance: toleranceStr,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
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
        // Format dimension for specified value - ensure it's properly displayed
        const dimension = row.dimension || "-";
        const formattedDimension = dimension !== "-" && dimension !== undefined && dimension !== null && String(dimension).trim() !== "" 
          ? String(dimension).trim() 
          : "-";
        return {
          specified: formattedDimension,
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
      
      const toleranceStr = `+${smallMultiplier} F FOR F < ${smallLimit} MM; +${mediumMultiplier} F FOR ${mediumLower} ≤ F ≤ ${mediumUpper} MM; +${largeMultiplier} F FOR F > ${mediumUpper} MM`;
      
      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS";
        
        const statedWidth = formatValue(spot.statedWidth);
        const statedHeight = formatValue(spot.statedHeight);
        const measuredWidth = formatValue(spot.measuredWidth);
        const measuredHeight = formatValue(spot.measuredHeight);
        
        return {
          specified: statedWidth !== null && statedHeight !== null ? `${statedWidth} × ${statedHeight} mm` : "-",
          measured: measuredWidth !== null && measuredHeight !== null ? `${measuredWidth} × ${measuredHeight} mm` : "-",
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows, true); // Use toleranceRowSpan since all rows share the same tolerance
    }
  }

  // 6. Linearity of mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const toleranceOperator = testData.linearityOfMasLoading.toleranceOperator || "<=";
      // COL is stored at the top level, not per row
      const colValue = testData.linearityOfMasLoading.col;
      const col = colValue !== undefined && colValue !== null && colValue !== "" && colValue !== "—" 
        ? parseFloat(String(colValue)).toFixed(3) 
        : "-";
      
      // Calculate pass/fail based on COL value vs tolerance
      let isPass = false;
      if (testData.linearityOfMasLoading.remarks === "Pass" || testData.linearityOfMasLoading.remarks === "PASS") {
        isPass = true;
      } else if (testData.linearityOfMasLoading.remarks === "Fail" || testData.linearityOfMasLoading.remarks === "FAIL") {
        isPass = false;
      } else if (col !== "-") {
        const colVal = parseFloat(col);
        const tol = parseFloat(tolerance);
        if (!isNaN(colVal) && !isNaN(tol)) {
          if (toleranceOperator === "<") {
            isPass = colVal < tol;
          } else if (toleranceOperator === ">") {
            isPass = colVal > tol;
          } else if (toleranceOperator === "<=") {
            isPass = colVal <= tol;
          } else if (toleranceOperator === ">=") {
            isPass = colVal >= tol;
          } else if (toleranceOperator === "=") {
            isPass = Math.abs(colVal - tol) < 0.0001;
          }
        }
      }
      
      const testRows = validRows.map((row: any) => {
        return {
          specified: row.mAsApplied ? `${row.mAsApplied} mAs` : "-",
          measured: col,
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Linearity of mA/mAs Loading (Coefficient of Linearity)", testRows, false, true);
    }
  }

  // 7. Consistency of Radiation Output (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kv || row.cv || row.remark);
    if (validRows.length > 0) {
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = testData.outputConsistency.tolerance?.value || "5.0";
      const testRows = validRows.map((row: any) => {
        // Use CV value directly from row.cv
        let cvValue = row.cv || "-";
        let isPass = false;
        
        // Check if remark indicates pass/fail
        if (row.remark === "Pass" || row.remark === "PASS") {
          isPass = true;
        } else if (row.remark === "Fail" || row.remark === "FAIL") {
          isPass = false;
        } else if (cvValue !== "-") {
          // Calculate pass/fail based on CV vs tolerance
          const cv = parseFloat(String(cvValue));
          const tol = parseFloat(toleranceValue);
          
          if (!isNaN(cv) && !isNaN(tol)) {
            if (toleranceOperator === "<") {
              isPass = cv < tol;
            } else if (toleranceOperator === ">") {
              isPass = cv > tol;
            } else if (toleranceOperator === "<=") {
              isPass = cv <= tol;
            } else if (toleranceOperator === ">=") {
              isPass = cv >= tol;
            } else if (toleranceOperator === "=") {
              isPass = Math.abs(cv - tol) < 0.01;
            }
          }
        }
        
        // Format CV value for display
        const formattedCv = cvValue !== "-" && cvValue !== undefined && cvValue !== null && cvValue !== ""
          ? (typeof cvValue === 'number' ? cvValue.toFixed(2) : parseFloat(String(cvValue)).toFixed(2)) + "%"
          : "-";
        
        return {
          specified: row.kv && row.mas ? `${row.kv} kV, ${row.mas} mAs` : row.kv ? `${row.kv} kV` : "Varies",
          measured: formattedCv,
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


  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-2">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
        SUMMARY OF QA TEST RESULTS
      </h2>

      <div className="overflow-x-auto print:overflow-visible print:max-w-none flex justify-center">
        <table className="border-2 border-black text-xs print:text-xxs print:min-w-full" style={{ width: 'auto' }}>
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
              
              const shouldRenderMeasured = 
                (!row.hasMeasuredRowSpan && row.measuredRowSpan === 0) || 
                (row.hasMeasuredRowSpan && row.isFirstRow);
              
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
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center print:text-[9px]">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td 
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center font-semibold"
                    >
                      {row.measured}
                    </td>
                  )}
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

export default MainTestTableForRadiographyMobileHT;
