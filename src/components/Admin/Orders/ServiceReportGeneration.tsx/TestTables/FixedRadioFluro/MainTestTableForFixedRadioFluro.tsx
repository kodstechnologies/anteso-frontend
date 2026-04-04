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

  // Helper to safely render Mongoose objects
  const safeVal = (v: any): string => {
    if (v == null) return "-";
    if (typeof v === "object" && "value" in v) return v.value ?? "-";
    return String(v);
  };

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
  // 6. Congruence of Radiation & Optical Field
  if (testData.congruenceOfRadiation?.congruenceMeasurements && Array.isArray(testData.congruenceOfRadiation.congruenceMeasurements)) {
    const validRows = testData.congruenceOfRadiation.congruenceMeasurements.filter((row: any) => row.dimension || row.percentFED);
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


 // 5. Central Beam Alignment
  if (testData.centralBeamAlignment && !isEmpty(testData.centralBeamAlignment)) {
    const ot = testData.centralBeamAlignment.observedTilt;
    const tiltValue = ot?.value || "-";
    const toleranceOperator = testData.centralBeamAlignment.tolerance?.operator || "≤";
    const toleranceValue = testData.centralBeamAlignment.tolerance?.value || "1";
    
    // Determine pass/fail based on tolerance
    let isPass = false;
    if (ot?.remark === "Pass" || ot?.remark === "PASS") {
      isPass = true;
    } else if (ot?.remark === "Fail" || ot?.remark === "FAIL") {
      isPass = false;
    } else if (tiltValue !== "-") {
      const observed = parseFloat(tiltValue);
      const tol = parseFloat(toleranceValue);
      if (!isNaN(observed) && !isNaN(tol)) {
        isPass = observed <= tol;
      }
    }
    
    addRowsForTest("Central Beam Alignment", [{
      specified: `${toleranceOperator} ${toleranceValue}°`,
      measured: tiltValue !== "-" ? `${tiltValue}°` : "-",
      tolerance: `${toleranceOperator} ${toleranceValue}°`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }


  // 7. Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((spot: any) => spot.focusType || spot.measuredWidth);
    if (validRows.length > 0) {
      const formatValue = (val: any) => {
        if (val === undefined || val === null || val === "") return null;
        const numVal = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(numVal)) return null;
        return numVal.toFixed(1);
      };
      
      const toleranceCriteria = testData.effectiveFocalSpot.toleranceCriteria || {};
      
      const smallMultiplier = parseFloat(toleranceCriteria.small?.multiplier || "0.5");
      const smallLimit = parseFloat(toleranceCriteria.small?.upperLimit || "0.8");
      const mediumMultiplier = parseFloat(toleranceCriteria.medium?.multiplier || "0.4");
      const mediumLower = parseFloat(toleranceCriteria.medium?.lowerLimit || "0.8");
      const mediumUpper = parseFloat(toleranceCriteria.medium?.upperLimit || "1.5");
      const largeMultiplier = parseFloat(toleranceCriteria.large?.multiplier || "0.3");
      
      const toleranceStr = `+${smallMultiplier} F FOR F < ${smallLimit} MM; +${mediumMultiplier} F FOR ${mediumLower} ≤ F ≤ ${mediumUpper} MM; +${largeMultiplier} F FOR F > ${mediumUpper} MM`;
      
      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS" || spot.isPass === true;
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
      addRowsForTest("Effective Focal Spot Size", testRows, true);
    }
  }


  // 1. Accuracy of Irradiation Time
  if (testData.accuracyOfIrradiationTime?.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.accuracyOfIrradiationTime.tolerance?.value || "10";
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
      const toleranceSign = "±";
      const toleranceValue = "10";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
          const appliedKvp = parseFloat(row.setKV || row.setKvp || row.setKVp);
          const avgKvp = parseFloat(row.avgKvp || row.measuredKvp || row.measuredKVp);
          if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }
        }
        return {
          specified: row.setKV || row.setKvp || row.setKVp || "-",
          measured: row.avgKvp || row.measuredKvp || row.measuredKVp || "-",
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 3. Accuracy of Operating Potential (Total Filtration Related)
  if (testData.totalFiltration?.measurements && Array.isArray(testData.totalFiltration.measurements)) {
    const validRows = testData.totalFiltration.measurements.filter((row: any) => row.appliedKvp || row.averageKvp || row.measuredValues);
    if (validRows.length > 0) {
      const toleranceSign = "±";
      const toleranceValue = "10";
      const testRows = validRows.map((row: any) => {
        let avgKvpNum: number | null = null;
        if (row.averageKvp !== undefined && row.averageKvp !== null && row.averageKvp !== "") {
          const val = parseFloat(row.averageKvp);
          if (!isNaN(val) && val > 0) avgKvpNum = val;
        }
        if (avgKvpNum === null && Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          const vals = row.measuredValues
            .map((v: any) => parseFloat(v))
            .filter((v: number) => !isNaN(v));
          if (vals.length > 0) {
            avgKvpNum = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
          }
        }
        let measuredDisplay: string;
        if (avgKvpNum !== null) {
          measuredDisplay = avgKvpNum.toFixed(2);
        } else {
          measuredDisplay = "-";
        }

        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else if (avgKvpNum !== null) {
          const appliedKvp = parseFloat(row.appliedKvp);
          if (!isNaN(appliedKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvpNum - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            if (!isNaN(tol)) {
              isPass = deviation <= tol;
            }
          }
        }

        return {
          specified: row.appliedKvp || "-",
          measured: measuredDisplay,
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential", testRows);
    }
  }

  // 4. Total Filtration Result
  if (testData.totalFiltration?.totalFiltration) {
    const tf = testData.totalFiltration.totalFiltration;
    const measuredStr = tf.required || tf.measured || "-"; 
    const atKvp = tf.atKvp || "-";

    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(measuredStr);

    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal)) {
        // Simple logic for FixedRadioFluro if not complex
        isPass = measuredVal >= 2.5;
    }
    
    // Build tolerance string - show all ranges as per standard
    const toleranceStr = "≥ 2.5 mm Al (>70 kVp)";
    
    addRowsForTest("Total Filtration", [{
      specified: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      measured: atKvp !== "-" ? `${atKvp} kVp` : "-",
      tolerance: toleranceStr,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

 

  // 8. Linearity of mAs Loading
  const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
  if (linearityData?.table2 && Array.isArray(linearityData.table2)) {
    const validRows = linearityData.table2.filter((row: any) => row.mAs || row.mAsApplied || row.mA || row.mAsRange);
    if (validRows.length > 0) {
      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === 'number') return o;
        if (typeof o === 'string') return parseFloat(o);
        if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
        return NaN;
      };

      const tolerance = parseFloat(linearityData.tolerance ?? "0.1") || 0.1;
      const toleranceOperator = linearityData.toleranceOperator ?? "<=";

      // Calculate on-the-fly if col is missing or NaN
      let colValue = linearityData.col || linearityData.coefficient || linearityData.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
          
          const mAsLabel = String(row.mAsApplied ?? row.mAs ?? row.mAsRange ?? "");
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
      
      let isPass = linearityData.remarks === "Pass" || linearityData.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        if (toleranceOperator === "<=") isPass = c <= tolerance;
        else if (toleranceOperator === "<") isPass = c < tolerance;
        else if (toleranceOperator === ">=") isPass = c >= tolerance;
        else if (toleranceOperator === ">") isPass = c > tolerance;
      }
      
      const testRows = validRows.map((row: any) => {
        return {
          specified: (row.mAs || row.mAsApplied || row.mA || row.mAsRange) ? `${row.mAs || row.mAsApplied || row.mA || row.mAsRange} mA/mAs` : "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Linearity of mA/mAs Loading (Coefficient of Linearity)", testRows, true, true);
    }
  }

  // 9. Consistency of Radiation Output (CoV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => 
      row.kv || row.cv || row.cov || (row.outputs && row.outputs.length > 0)
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
          ? (typeof cvValue === 'number' ? cvValue.toFixed(3) : parseFloat(String(cvValue)).toFixed(3))
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
          specified: row.kv ? `${row.kv} kV` : "Varies",
          measured: formattedCv !== "-" ? "CoV = " + formattedCv : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CoV)", testRows, true);
    }
  }

  // 11. Low Contrast Resolution (Fluro specific)
  if (testData.lowContrastResolution && !isEmpty(testData.lowContrastResolution)) {
      const hole = testData.lowContrastResolution.smallestHoleSize;
      if (hole != null && hole !== "") {
          const limit = testData.lowContrastResolution.recommendedStandard || "4";
          const isPass = parseFloat(hole) <= parseFloat(limit);
          addRowsForTest("Low Contrast Resolution", [{
              specified: "Smallest Visible Hole",
              measured: `${hole} mm`,
              tolerance: `≤ ${limit} mm`,
              remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
      }
  }

  // 12. High Contrast Resolution (Fluro specific)
  if (testData.highContrastResolution && !isEmpty(testData.highContrastResolution)) {
      const lp = testData.highContrastResolution.measuredLpPerMm;
      if (lp != null && lp !== "") {
          const limit = testData.highContrastResolution.recommendedStandard || "1.0";
          const isPass = parseFloat(lp) >= parseFloat(limit);
          addRowsForTest("High Contrast Resolution", [{
              specified: "Line Pairs per mm",
              measured: `${lp} lp/mm`,
              tolerance: `≥ ${limit} lp/mm`,
              remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
      }
  }

  // 10. Exposure Rate at Table Top (Fluro specific)
  if (testData.exposureRate?.rows && Array.isArray(testData.exposureRate.rows)) {
    const validRows = testData.exposureRate.rows.filter((row: any) => row.exposure);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const isAec = row.remark?.toLowerCase().includes("aec") || false;
        const tolerance = isAec ? (testData.exposureRate.aecTolerance || "10") : (testData.exposureRate.nonAecTolerance || "5");
        const isPass = parseFloat(row.exposure) <= parseFloat(tolerance);
        return {
          specified: `${row.appliedKv || "-"} kV / ${row.appliedMa || "-"} mA`,
          measured: `${row.exposure || "-"} cGy/min`,
          tolerance: `≤ ${tolerance} cGy/min`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
    }
  }



  // 13. Radiation Leakage Level (Tube Housing Leakage)
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const measured = row.max || row.mgy || "-";
        const isPass = measured !== "-" && parseFloat(String(measured)) <= 1;
        return {
          specified: row.location || "-",
          measured: measured !== "-" ? `${measured} mGy/hr` : "-",
          tolerance: `≤ 1 mGy/hr`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Tube Housing Leakage", testRows);
    }
  }

  // 14. Radiation Protection Survey
  if (testData.radiationProtectionSurvey && !isEmpty(testData.radiationProtectionSurvey)) {
    const surveyRows = testData.radiationProtectionSurvey.surveyRows || testData.radiationProtectionSurvey.locations;
    if (Array.isArray(surveyRows) && surveyRows.length > 0) {
      const testRows = surveyRows.map((row: any) => ({
        specified: row.location || "-",
        measured: `${row.exposureRate || row.mRPerHr || "-"} µGy/hr`,
        tolerance: "Complies with AERB limits",
        remarks: (row.remarks === "Pass" || row.result === "PASS" ? "Pass" : "Fail") as "Pass" | "Fail",
      }));
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
        <table className="border-2 border-black text-xs print:text-[9px] print:min-w-full" style={{ width: 'auto' }}>
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
                  <td className="border border-black px-4 py-3 text-center print:text-[9px]">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td 
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center font-semibold print:text-[9px]"
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

export default MainTestTableForFixedRadioFluro;
