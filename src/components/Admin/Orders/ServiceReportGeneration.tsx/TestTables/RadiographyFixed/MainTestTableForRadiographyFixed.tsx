// src/components/reports/TestTables/RadiographyFixed/MainTestTableForRadiographyFixed.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  hasTimer?: boolean;
  rows?: any[];
  isContinuation?: boolean;
}

export const generateRadiographySummaryRows = (testData: any, hasTimer: boolean = false) => {
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

  // 1. Congruence of Radiation & Optical Field
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

  // 2. Central Beam Alignment
  if (testData.centralBeamAlignment?.observedTilt) {
    const tiltValue = testData.centralBeamAlignment.observedTilt.value || "-";
    const toleranceOperator = testData.centralBeamAlignment.tolerance?.operator || "<=";
    const toleranceValue = testData.centralBeamAlignment.tolerance?.value || "5";
    let isPass = false;
    if (testData.centralBeamAlignment.observedTilt.remark === "Pass" || testData.centralBeamAlignment.observedTilt.remark === "PASS") {
      isPass = true;
    } else if (testData.centralBeamAlignment.observedTilt.remark === "Fail" || testData.centralBeamAlignment.observedTilt.remark === "FAIL") {
      isPass = false;
    } else if (tiltValue !== "-") {
      const observed = parseFloat(tiltValue);
      const tol = parseFloat(toleranceValue);
      if (!isNaN(observed) && !isNaN(tol)) {
        if (toleranceOperator === "<") isPass = observed < tol;
        else if (toleranceOperator === ">") isPass = observed > tol;
        else if (toleranceOperator === "<=") isPass = observed <= tol;
        else if (toleranceOperator === ">=") isPass = observed >= tol;
        else if (toleranceOperator === "=") isPass = Math.abs(observed - tol) < 0.01;
      }
    }
    const specifiedValue = `${toleranceOperator} ${toleranceValue}°`;
    const toleranceDisplay = `${toleranceOperator} ${toleranceValue}°`;
    addRowsForTest("Central Beam Alignment", [{
      specified: specifiedValue,
      measured: tiltValue !== "-" ? `${tiltValue}°` : "-",
      tolerance: toleranceDisplay,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 3. Effective Focal Spot Size
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
      const toleranceStr = `+${smallMultiplier} F FOR F < ${smallLimit} mm; +${mediumMultiplier} F FOR ${mediumLower} ≤ F ≤ ${mediumUpper} mm; +${largeMultiplier} F FOR F > ${mediumUpper} mm`;
      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS";
        const statedWidth = formatValue(spot.statedWidth);
        return {
          specified: statedWidth !== null ? `${statedWidth} mm` : "-",
          measured: formatValue(spot.measuredWidth) !== null ? `${formatValue(spot.measuredWidth)} mm` : "-",
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows, true);
    }
  }

  // 4. Accuracy of Irradiation Time
  if (testData.accuracyOfIrradiationTime?.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.accuracyOfIrradiationTime.tolerance?.value || "5";
      const testRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const measuredTime = parseFloat(row.measuredTime);
        let isPass = false;
        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          const errorVal = Math.abs((measuredTime - setTime) / setTime * 100);
          const tol = parseFloat(toleranceValue);
          if (toleranceOperator === "<=") isPass = errorVal <= tol;
          else if (toleranceOperator === ">=") isPass = errorVal >= tol;
          else if (toleranceOperator === "=") isPass = Math.abs(errorVal - tol) < 0.01;
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

  // 5. Accuracy of Operating Potential
  if (testData.accuracyOfOperatingPotential?.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKV || row.avgKvp);
    if (validRows.length > 0) {
      const toleranceSign = testData.accuracyOfOperatingPotential.tolerance?.sign || "±";
      const toleranceValue = testData.accuracyOfOperatingPotential.tolerance?.value || "2.0";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") isPass = true;
        else if (row.remarks === "FAIL" || row.remarks === "Fail") isPass = false;
        else {
          const appliedKvp = parseFloat(row.setKV);
          const avgKvp = parseFloat(row.avgKvp);
          if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            isPass = deviation <= parseFloat(toleranceValue);
          }
        }
        return {
          specified: row.setKV || "-",
          measured: row.avgKvp || "-",
          tolerance: `${toleranceSign} ${toleranceValue} kVp`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 6. Total Filtration
  if (testData.totalFilteration?.totalFiltration) {
    const measuredStr = testData.totalFilteration.totalFiltration.required || "-";
    const atKvp = testData.totalFilteration.totalFiltration.atKvp || "-";
    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(measuredStr);
    const ft = testData.totalFilteration.filtrationTolerance || {
      forKvGreaterThan70: "1.5", forKvBetween70And100: "2.0", forKvGreaterThan100: "2.5",
      kvThreshold1: "70", kvThreshold2: "100",
    };
    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal)) {
      let requiredTolerance = 0;
      if (kvp < parseFloat(ft.kvThreshold1)) requiredTolerance = parseFloat(ft.forKvGreaterThan70);
      else if (kvp <= parseFloat(ft.kvThreshold2)) requiredTolerance = parseFloat(ft.forKvBetween70And100);
      else requiredTolerance = parseFloat(ft.forKvGreaterThan100);
      isPass = measuredVal >= requiredTolerance;
    }
    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";
    addRowsForTest("Total Filtration", [{
      specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
      measured: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      tolerance: toleranceStr,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 7. Linearity of mA/mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const linearityLabel = hasTimer ? "Linearity of mA Loading (CoV)" : "Linearity of mAs Loading (CoV)";
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const toleranceOperator = testData.linearityOfMasLoading.toleranceOperator || "<=";
      let colValue = testData.linearityOfMasLoading.col || testData.linearityOfMasLoading.coefficient || "-";
      const col = typeof colValue === 'number' ? colValue.toFixed(3) : parseFloat(String(colValue)).toFixed(3);
      let isPass = testData.linearityOfMasLoading.remarks === "Pass" || testData.linearityOfMasLoading.remarks === "PASS";
      const testRows = [{
        specified: `at ${asDisplayNumber(testData.linearityOfMasLoading.kv || testData.linearityOfMasLoading.setKV)} kV`,
        measured: isNaN(parseFloat(col)) ? "-" : `CoL = ${col}`,
        tolerance: `${toleranceOperator} ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest(linearityLabel, testRows);
    }
  }

  // 8. Consistency of Radiation Output
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kv || row.cv);
    if (validRows.length > 0) {
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = testData.outputConsistency.tolerance?.value || "0.05";
      const testRows = validRows.map((row: any) => {
        const cvValue = row.cv || row.cov || "-";
        const formattedCv = typeof cvValue === 'number' ? cvValue.toFixed(3) : parseFloat(String(cvValue)).toFixed(3);
        let isPass = row.remark === "Pass" || row.remark === "PASS";
        return {
          specified: row.kv ? `at ${row.kv} kV` : "Varies",
          measured: isNaN(parseFloat(formattedCv)) ? "-" : "CoV = " + formattedCv,
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CoV)", testRows, true);
    }
  }

  // 9. Tube Housing Leakage
  if (testData.radiationLeakageLevel?.leakageMeasurements && Array.isArray(testData.radiationLeakageLevel.leakageMeasurements)) {
    const validRows = testData.radiationLeakageLevel.leakageMeasurements.filter((row: any) => row.location);
    if (validRows.length > 0) {
      const toleranceValue = testData.radiationLeakageLevel.toleranceValue || "1";
      const toleranceUnit = testData.radiationLeakageLevel.leakageMeasurements[0]?.unit || "mGy in one hour";
      const testRows = validRows.map((row: any) => {
        let isPass = row.remark === "Pass" || row.remark === "PASS";
        return {
          specified: row.location || "-",
          measured: row.result ? `${parseFloat(row.result).toFixed(4)} ${toleranceUnit}` : "-",
          tolerance: `≤ ${toleranceValue} ${toleranceUnit}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }

  // 10. Radiation Protection Survey
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.location);
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const isPass = loc.result === "PASS" || loc.result === "Pass";
        return {
          specified: loc.location || "-",
          measured: loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-",
          tolerance: loc.category === "worker" ? "≤ 40 mR/week" : "≤ 2 mR/week",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Protection Survey", testRows);
    }
  }

  return rows;
};

const MainTestTableForRadiographyFixed: React.FC<MainTestTableProps> = ({ 
  testData, 
  hasTimer = false, 
  rows: providedRows,
  isContinuation = false
}) => {
  const rows = providedRows || generateRadiographySummaryRows(testData, hasTimer);

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-2">
      {!isContinuation && (
        <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
          SUMMARY OF QA TEST RESULTS
        </h2>
      )}

      <div className="overflow-x-auto print:overflow-visible print:max-w-none flex justify-center">
        <table
          className="border border-black text-xs print:text-[9px] print:min-w-full"
          style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', borderWidth: 1, borderStyle: 'solid', borderColor: '#000' }}
        >
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-12 text-center align-middle font-bold">Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-72">Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32">Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32">Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-40">Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold bg-green-100 w-24">Remarks</th>
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
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center align-middle">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle leading-tight font-normal">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center align-middle">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center align-middle"
                    >
                      {row.measured}
                    </td>
                  )}
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center align-middle text-xs leading-tight"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle ${
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

export default MainTestTableForRadiographyFixed;