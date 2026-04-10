// src/components/reports/TestTables/RadiographyPortable/MainTestTableForRadiographyPortable.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  hasTimer?: boolean;
}

const MainTestTableForRadiographyPortable: React.FC<MainTestTableProps> = ({ testData, hasTimer = false }) => {
  const rows: any[] = [];
  let srNo = 1;
  const asDisplayNumber = (value: any): string | null => {
    if (value === undefined || value === null || value === "") return null;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isNaN(n) ? String(value).trim() || null : String(Number(n));
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
          tolerance: `<= ${tolerance}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Congruence of Radiation & Optical Field", testRows);
    }
  }


  // 3. Central Beam Alignment
  if (testData.centralBeamAlignment?.observedTilt) {
    const tiltValue = testData.centralBeamAlignment.observedTilt.value || "-";
    const toleranceOperator = testData.centralBeamAlignment.tolerance?.operator || "<=";
    const toleranceValue = testData.centralBeamAlignment.tolerance?.value || "5";
    
    // Determine pass/fail based on tolerance
    let isPass = false;
    if (testData.centralBeamAlignment.observedTilt.remark === "Pass" || testData.centralBeamAlignment.observedTilt.remark === "PASS") {
      isPass = true;
    } else if (testData.centralBeamAlignment.observedTilt.remark === "Fail" || testData.centralBeamAlignment.observedTilt.remark === "FAIL") {
      isPass = false;
    } else if (tiltValue !== "-") {
      const observed = parseFloat(tiltValue);
      const tol = parseFloat(toleranceValue);
      if (!isNaN(observed) && !isNaN(tol)) {
        if (toleranceOperator === "<") {
          isPass = observed < tol;
        } else if (toleranceOperator === ">") {
          isPass = observed > tol;
        } else if (toleranceOperator === "<=") {
          isPass = observed <= tol;
        } else if (toleranceOperator === ">=") {
          isPass = observed >= tol;
        } else if (toleranceOperator === "=") {
          isPass = Math.abs(observed - tol) < 0.01;
        }
      }
    }
    
    // Format specified value and display with degree symbol (Â°)
    const specifiedValue = `${toleranceOperator} ${toleranceValue}°`;
    const toleranceDisplay = `${toleranceOperator} ${toleranceValue}°`;
    addRowsForTest("Central Beam Alignment", [{
      specified: specifiedValue,
      measured: tiltValue !== "-" ? `${tiltValue}°` : "-",
      tolerance: toleranceDisplay,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
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
      
      // Format tolerance criteria as: +0.5 F FOR F < 0.8 MM, +0.4 F FOR 0.8 â‰¤ F â‰¤ 1.5 MM, +0.3 F FOR F > 1.5 MM
      const smallMultiplier = parseFloat(toleranceCriteria.small?.multiplier || "0.5");
      const smallLimit = parseFloat(toleranceCriteria.small?.upperLimit || "0.8");
      const mediumMultiplier = parseFloat(toleranceCriteria.medium?.multiplier || "0.4");
      const mediumLower = parseFloat(toleranceCriteria.medium?.lowerLimit || "0.8");
      const mediumUpper = parseFloat(toleranceCriteria.medium?.upperLimit || "1.5");
      const largeMultiplier = parseFloat(toleranceCriteria.large?.multiplier || "0.3");
      
      const toleranceStr = `+${smallMultiplier} F FOR F < ${smallLimit} mm; +${mediumMultiplier} F FOR ${mediumLower}  F  ${mediumUpper} mm; +${largeMultiplier} F FOR F > ${mediumUpper} mm`;
      
      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS";
        
        const statedWidth = formatValue(spot.statedWidth);
        const statedHeight = formatValue(spot.statedHeight);
        const measuredWidth = formatValue(spot.measuredWidth);
        const measuredHeight = formatValue(spot.measuredHeight);
        
        return {
          specified: statedWidth !== null ? `${statedWidth} mm` : "-",
          measured: measuredWidth !== null ? `${measuredWidth} mm` : "-",
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows, true); // Use toleranceRowSpan since all rows share the same tolerance
    }
  }
  
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
      addRowsForTest("Accuracy of Irradiation Time(sec)", testRows);
    }
  }

  // 2. Accuracy of Operating Potential (kVp Accuracy) - support measurements or table2
  const aop = testData.accuracyOfOperatingPotential;
  const aopRows = Array.isArray(aop?.measurements) && aop.measurements.length > 0
    ? aop.measurements
    : (Array.isArray(aop?.table2) ? aop.table2 : []);
  if (aopRows.length > 0) {
    const validRows = aopRows.filter((row: any) => row.appliedKvp || row.setKV || row.averageKvp || row.avgKvp);
    if (validRows.length > 0) {
      let rawToleranceSign =
        aop.tolerance?.sign ||
        aop.toleranceSign ||
        "±";
      let toleranceSign = rawToleranceSign;
      if (typeof rawToleranceSign === "string") {
        const lowerSign = rawToleranceSign.toLowerCase().replace(/\s+/g, "");
        if (lowerSign.includes("plus") && lowerSign.includes("minus")) toleranceSign = "±";
        else if (lowerSign === "plus") toleranceSign = "+";
        else if (lowerSign === "minus") toleranceSign = "-";
      }
      const toleranceValue = aop.tolerance?.value || "2.0";
      const testRows = validRows.map((row: any) => {
        const applied = row.appliedKvp ?? row.setKV;
        const measured = row.averageKvp ?? row.avgKvp;
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") isPass = true;
        else if (row.remarks === "FAIL" || row.remarks === "Fail") isPass = false;
        else if (applied && measured) {
          const a = parseFloat(String(applied));
          const m = parseFloat(String(measured));
          const tol = parseFloat(toleranceValue);
          if (!isNaN(a) && !isNaN(m) && a > 0 && !isNaN(tol)) {
            const deviation = Math.abs(((m - a) / a) * 100);
            isPass = deviation <= tol;
          }
        }
        return {
          specified: applied || "-",
          measured: measured || "-",
          tolerance: `${toleranceSign} ${toleranceValue} kVp`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 2b. Total Filtration (when stored in AOP document)
  const tf = testData.accuracyOfOperatingPotential?.totalFiltration;
  if (tf && (tf.required !== '' || tf.atKvp !== '')) {
    const kvp = parseFloat(tf.atKvp);
    const measured = parseFloat(tf.required);
    const ft = testData.accuracyOfOperatingPotential?.filtrationTolerance;
    let requiredMin = '';
    if (ft && !isNaN(kvp)) {
      const t1 = parseFloat(ft.kvThreshold1 ?? '70');
      const t2 = parseFloat(ft.kvThreshold2 ?? '100');
      if (kvp < t1) requiredMin = `${ft.forKvGreaterThan70 ?? '1.5'} mm Al`;
      else if (kvp >= t1 && kvp <= t2) requiredMin = `${ft.forKvBetween70And100 ?? '2.0'} mm Al`;
      else requiredMin = `${ft.forKvGreaterThan100 ?? '2.5'} mm Al`;
    }
    const isPass = !isNaN(measured) && requiredMin !== '' ? measured >= parseFloat(requiredMin) : undefined;
    addRowsForTest("Total Filtration", [{
      specified: tf.atKvp ? `${tf.atKvp} kVp` : '-',
      measured: measured ? `${tf.required} mm Al` : '-',
      tolerance: "1.5 mm Al for kV <= 70; 2.0 mm Al for 70 <= kV <= 100; 2.5 mm Al for kV > 100",
      remarks: (isPass === true ? "Pass" : isPass === false ? "Fail" : "Pass") as "Pass" | "Fail",
    }]);
  }





  // 6. Linearity of mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied);
    if (validRows.length > 0) {
      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === 'number') return o;
        if (typeof o === 'string') return parseFloat(o);
        if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
        return NaN;
      };

      const tolerance = parseFloat(testData.linearityOfMasLoading.tolerance ?? "0.1") || 0.1;
      const toleranceOperator = testData.linearityOfMasLoading.toleranceOperator || "â‰¤";

      // Calculate on-the-fly if col is missing or NaN
      let colValue = testData.linearityOfMasLoading.col || testData.linearityOfMasLoading.coefficient || testData.linearityOfMasLoading.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
          
          const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? "");
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
      
      let isPass = testData.linearityOfMasLoading.remarks === "Pass" || testData.linearityOfMasLoading.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(String(tolerance));
        if (toleranceOperator === "â‰¤" || toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const tableLevelKv =
        testData.linearityOfMasLoading?.kv ??
        testData.linearityOfMasLoading?.kV ??
        testData.linearityOfMasLoading?.setKv ??
        testData.linearityOfMasLoading?.setKV ??
        (Array.isArray(testData.linearityOfMasLoading?.table1)
          ? testData.linearityOfMasLoading?.table1?.[0]?.kv
          : testData.linearityOfMasLoading?.table1?.kv);
      const firstRow = validRows[0] || {};
      const kvValue = asDisplayNumber(firstRow.kv ?? firstRow.kV ?? firstRow.setKV ?? firstRow.setKv ?? tableLevelKv);
      const testRows = [{
        specified: kvValue ? `at ${kvValue} kV` : "-",
        measured: col !== "-" ? `CoL = ${col}` : "-",
        tolerance: `${toleranceOperator} ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest(hasTimer ? "Linearity of mA Loading (Coefficient of Linearity)" : "Linearity of mAs Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 7. Consistency of Radiation Output (CoV) - specified and measured in rowspan like Fixed
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => 
      row.kv || row.cv || row.mas || (row.outputs && row.outputs.length > 0) || row.remark
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

      const tableLevelKv =
        testData.outputConsistency?.kv ??
        testData.outputConsistency?.kV ??
        testData.outputConsistency?.setKV ??
        testData.outputConsistency?.setKv;
      const tableLevelMa =
        testData.outputConsistency?.mA ??
        testData.outputConsistency?.ma ??
        testData.outputConsistency?.mas ??
        testData.outputConsistency?.tubeCurrent ??
        testData.outputConsistency?.setMA ??
        testData.outputConsistency?.setMa;
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

        const kvValue = asDisplayNumber(row.kv ?? row.kV ?? row.setKV ?? row.setKv ?? tableLevelKv);
        const maValue = asDisplayNumber(
          row.mA ??
          row.ma ??
          row.mas ??
          row.tubeCurrent ??
          row.setMA ??
          row.setMa ??
          tableLevelMa
        );
        const specifiedDisplay = kvValue && maValue
          ? `at ${kvValue} kV ${maValue} mA`
          : kvValue
            ? `at ${kvValue} kV`
            : "Varies";

        return {
          specified: specifiedDisplay,
          measured: formattedCv !== "-" ? "CoV = " + formattedCv : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CoV)", testRows, true);
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
          measured: maxStr !== "-" ? `${maxStr} mGy in one hour` : "-",
          tolerance: `<= ${toleranceValue} mGy in one hour`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
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
                  {((!row.hasMeasuredRowSpan && row.measuredRowSpan === 0) || (row.hasMeasuredRowSpan && row.isFirstRow)) ? (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight"
                    >
                      {row.measured}
                    </td>
                  ) : null}
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

export default MainTestTableForRadiographyPortable;

