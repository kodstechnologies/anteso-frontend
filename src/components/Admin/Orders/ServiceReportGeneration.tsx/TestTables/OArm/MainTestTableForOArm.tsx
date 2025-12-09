// src/components/reports/TestTables/OArm/MainTestTableForOArm.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForOArm: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // 1. Total Filtration
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

  // 2. Consistency of Radiation Output (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.kvp || row.cov);
    if (validRows.length > 0) {
      const tolerance = testData.outputConsistency.tolerance || "0.02";
      const testRows = validRows.map((row: any) => {
        const cov = row.cov ? parseFloat(row.cov).toFixed(3) : "-";
        const isPass = row.remark === "Pass" || (row.cov ? parseFloat(row.cov) <= parseFloat(tolerance) : false);
        return {
          specified: row.kvp && row.ma ? `${row.kvp} kVp, ${row.ma} mA` : row.kvp ? `${row.kvp} kVp` : "Varies",
          measured: cov,
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (COV)", testRows, true);
    }
  }

  // 3. High Contrast Resolution
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

  // 4. Low Contrast Resolution
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

  // 5. Exposure Rate at Table Top
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

  // 6. Tube Housing Leakage
  if (testData.tubeHousingLeakage?.leakageRows && Array.isArray(testData.tubeHousingLeakage.leakageRows)) {
    const validRows = testData.tubeHousingLeakage.leakageRows.filter((row: any) => row.location || row.max);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.toleranceValue || "1";
      const toleranceOperator = testData.tubeHousingLeakage.toleranceOperator || "less than or equal to";
      const testRows = validRows.map((row: any) => {
        const max = row.max || "-";
        const isPass = row.remark === "Pass" || (max !== "-" && parseFloat(max) < parseFloat(toleranceValue));
        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} ${row.unit || "mGy/h"}` : "-",
          tolerance: `${toleranceOperator === "less than or equal to" ? "≤" : toleranceOperator === "greater than or equal to" ? "≥" : "="} ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Tube Housing Leakage", testRows);
    }
  }

  // 7. Linearity of mAs Loading
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
      addRowsForTest("Linearity of mAs Loading Stations (Coefficient of Linearity)", testRows);
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

export default MainTestTableForOArm;
