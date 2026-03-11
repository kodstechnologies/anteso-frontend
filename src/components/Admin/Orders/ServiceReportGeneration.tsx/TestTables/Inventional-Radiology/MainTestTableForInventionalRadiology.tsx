// src/components/reports/TestTables/InventionalRadiology/MainTestTableForInventionalRadiology.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForInventionalRadiology: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // 1. Central Beam Alignment Test
  if (testData.centralBeamAlignment) {
    const observed = testData.centralBeamAlignment.observedTilt?.value || "-";
    const tolerance = testData.centralBeamAlignment.tolerance?.value || "1.5";
    const remark = testData.centralBeamAlignment.observedTilt?.remark || "-";
    addRowsForTest("Central Beam Alignment Test", [{
      specified: `Tolerance: < ${tolerance}°`,
      measured: observed !== "-" ? `${observed}°` : "-",
      tolerance: `< ${tolerance}°`,
      remarks: (remark === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 2. Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const testRows = testData.effectiveFocalSpot.focalSpots.map((spot: any) => ({
      specified: `${spot.statedWidth} x ${spot.statedHeight} mm`,
      measured: `${spot.measuredWidth} x ${spot.measuredHeight} mm`,
      tolerance: "As per AERB",
      remarks: (spot.remark === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
    }));
    addRowsForTest("Effective Focal Spot Size", testRows);
  }

  // 3. Accuracy of kVp at Different mA Stations
  if (testData.accuracyOfOperatingPotential?.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const testRows = testData.accuracyOfOperatingPotential.table2.map((row: any) => ({
      specified: `${row.setKV} kV`,
      measured: `${row.avgKvp} kV`,
      tolerance: "± 10% of set value",
      remarks: (row.remarks === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
    }));
    addRowsForTest("Accuracy of kVp at Different mA Stations", testRows);
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
        let errorStr = "-";
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          const error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
          errorStr = `${error}%`;
          const errorVal = parseFloat(error);
          const tol = parseFloat(toleranceValue);

          if (toleranceOperator === "<=") isPass = errorVal <= tol;
          else if (toleranceOperator === ">=") isPass = errorVal >= tol;
          else if (toleranceOperator === "<") isPass = errorVal < tol;
          else if (toleranceOperator === ">") isPass = errorVal > tol;
        }

        return {
          specified: row.setTime ? `${row.setTime} ms` : "-",
          measured: row.measuredTime ? `${row.measuredTime} ms (Error: ${errorStr})` : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time", testRows);
    }
  }

  // 5. Total Filtration
  if (testData.totalFilteration?.totalFiltration) {
    const measuredTF = testData.totalFilteration.totalFiltration.measured || "-";
    const requiredTF = testData.totalFilteration.totalFiltration.required || "-";
    const measured = parseFloat(measuredTF);
    const required = parseFloat(requiredTF);
    const isPass = !isNaN(measured) && !isNaN(required) && measured >= required;
    addRowsForTest("Total Filtration", [{
      specified: requiredTF !== "-" ? `${requiredTF} mm Al` : "-",
      measured: measuredTF !== "-" ? `${measuredTF} mm Al` : "-",
      tolerance: "≥ Required value",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 6. Consistency of Radiation Output
  if (testData.consistencyOfRadiationOutput?.outputRows && Array.isArray(testData.consistencyOfRadiationOutput.outputRows)) {
    const testRows = testData.consistencyOfRadiationOutput.outputRows.filter((row: any) => row.kvp).map((row: any) => ({
      specified: `${row.kvp} kV, ${row.mas} mAs`,
      measured: `COV: ${row.cov || "-"}`,
      tolerance: "COV ≤ 0.05",
      remarks: (row.remarks === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
    }));
    addRowsForTest("Consistency of Radiation Output", testRows);
  }

  // 7. Exposure Rate at Table Top
  if (testData.exposureRateTableTop?.rows && Array.isArray(testData.exposureRateTableTop.rows)) {
    const validRows = testData.exposureRateTableTop.rows.filter((row: any) => row.distance || row.exposure);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const isPass = row.result === "PASS" || row.result === "Pass";
        return {
          specified: row.distance ? `${row.distance} cm` : "-",
          measured: row.exposure ? `${row.exposure} mGy/min` : "-",
          tolerance: "As per standard",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
    }
  }

  // 8. Low Contrast Resolution
  if (testData.lowContrastResolution) {
    const smallestHoleSize = testData.lowContrastResolution.smallestHoleSize || "";
    const recommendedStandard = testData.lowContrastResolution.recommendedStandard || "3.0";
    const measured = parseFloat(smallestHoleSize);
    const standard = parseFloat(recommendedStandard);
    const isPass = !isNaN(measured) && !isNaN(standard) && measured < standard;
    addRowsForTest("Low Contrast Resolution", [{
      specified: recommendedStandard !== "3.0" ? `${recommendedStandard} mm` : "3.0 mm",
      measured: smallestHoleSize ? `${smallestHoleSize} mm` : "-",
      tolerance: `< ${recommendedStandard} mm`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 9. High Contrast Resolution
  if (testData.highContrastResolution) {
    const measuredLpPerMm = testData.highContrastResolution.measuredLpPerMm || "";
    const recommendedStandard = testData.highContrastResolution.recommendedStandard || "1.50";
    const measured = parseFloat(measuredLpPerMm);
    const standard = parseFloat(recommendedStandard);
    const isPass = !isNaN(measured) && !isNaN(standard) && measured > standard;
    addRowsForTest("High Contrast Resolution", [{
      specified: recommendedStandard !== "1.50" ? `${recommendedStandard} lp/mm` : "1.50 lp/mm",
      measured: measuredLpPerMm ? `${measuredLpPerMm} lp/mm` : "-",
      tolerance: `> ${recommendedStandard} lp/mm`,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 10. Tube Housing Leakage
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.toleranceValue || "1.0";
      const testRows = validRows.map((row: any) => {
        const values = [row.front, row.back, row.left, row.right, row.top].map(v => parseFloat(v || "0")).filter(v => !isNaN(v));
        const max = values.length > 0 ? Math.max(...values).toString() : "-";
        const isPass = max !== "-" && parseFloat(max) < parseFloat(toleranceValue);
        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} mGy/h` : "-",
          tolerance: `≤ ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Tube Housing Leakage", testRows);
    }
  }

  // 11. Radiation Protection Survey Report
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validLocations = testData.radiationProtectionSurvey.locations.filter((l: any) => l.mRPerHr);
    if (validLocations.length > 0) {
      const testRows = validLocations.map((loc: any) => ({
        specified: loc.category === "worker" ? "Worker Area" : "Public Area",
        measured: `${loc.mRPerHr || "0"} mR/hr (${loc.mRPerWeek || "0"} mR/wk)`,
        tolerance: loc.category === "worker" ? "≤ 40 mR/wk" : "≤ 2 mR/wk",
        remarks: (loc.result === "PASS" ? "Pass" : "Fail") as "Pass" | "Fail",
      }));
      addRowsForTest("Radiation Protection Survey Report", testRows);
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

export default MainTestTableForInventionalRadiology;

