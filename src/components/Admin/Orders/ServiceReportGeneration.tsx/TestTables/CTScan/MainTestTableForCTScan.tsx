// // src/components/reports/TestTables/CTScan/MainTestTableForCTScan.tsx
// import React from "react";

// interface MainTestTableProps {
//   testData: any;
// }

// const MainTestTableForCTScan: React.FC<MainTestTableProps> = ({ testData }) => {
//   const rows: any[] = [];
//   let srNo = 1;

//   const addRow = (
//     parameter: string,
//     specified: string | number,
//     measured: string | number,
//     tolerance: string,
//     remarks: "Pass" | "Fail"
//   ) => {
//     rows.push({ srNo: srNo++, parameter, specified, measured, tolerance, remarks });
//   };

//   // Your existing test data processing logic...
//   if (testData.radiationProfile?.table2?.[0]) {
//     const row = testData.radiationProfile.table2[0];
//     const isPass = row.remarks === "Pass";
//     addRow("Radiation Profile Width / Slice Thickness (mm)", row.applied || "-", row.measured || "-", "±10% or ±1 mm", isPass ? "Pass" : "Fail");
//   }

//   if (testData.operatingPotential?.table2?.[0]) {
//     const row = testData.operatingPotential.table2[0];
//     const tol = testData.operatingPotential.tolerance?.value || 5;
//     const deviation = row.deviation ? Math.abs(parseFloat(row.deviation)) : null;
//     const isPass = deviation !== null && deviation <= tol;
//     addRow("Measurement of Operating Potential (kVp Accuracy)", row.setKV || "-", row.avgKvp || "-", `±${tol}%`, isPass ? "Pass" : "Fail");
//   }

//   if (testData.maLinearity?.table2?.[0]) {
//     const row = testData.maLinearity.table2.reduce((worst: any, curr: any) =>
//       Math.abs(parseFloat(curr.linearity || 0)) > Math.abs(parseFloat(worst.linearity || 0)) ? curr : worst
//     );
//     const linearity = row.linearity || "-";
//     const tol = testData.maLinearity.tolerance || "0.1";
//     const isPass = parseFloat(linearity) <= parseFloat(tol);
//     addRow("mA/mAs Linearity (Coefficient of Linearity)", "Varies", linearity, `≤ ±${tol}`, isPass ? "Pass" : "Fail");
//   }

//   if (testData.timerAccuracy?.table2?.[0]) {
//     const row = testData.timerAccuracy.table2[0];
//     const tol = testData.timerAccuracy.tolerance || "5";
//     const error = row.setTime && row.observedTime
//       ? Math.abs(((parseFloat(row.observedTime) - parseFloat(row.setTime)) / parseFloat(row.setTime)) * 100).toFixed(2)
//       : null;
//     const isPass = error !== null && parseFloat(error) <= parseFloat(tol);
//     addRow("Timer Accuracy", row.setTime || "-", row.observedTime || "-", `±${tol}%`, isPass ? "Pass" : "Fail");
//   }

//   if (testData.ctdi?.table2) {
//     const ctdiwHead = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.head || "-";
//     const ctdiwBody = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.body || "-";
//     addRow("CTDIw (Head Phantom)", "As per protocol", ctdiwHead, "≤ Reference", ctdiwHead === "-" ? "Fail" : "Pass");
//     addRow("CTDIw (Body Phantom)", "As per protocol", ctdiwBody, "≤ Reference", ctdiwBody === "-" ? "Fail" : "Pass");
//   }

//   if (testData.totalFiltration?.rows?.[0]) {
//     const row = testData.totalFiltration.rows[0];
//     const measured = parseFloat(row.measuredTF);
//     const isPass = measured >= 2.5;
//     addRow("Total Filtration", row.appliedKV || "-", `${row.measuredTF || "-"} mm Al`, "≥ 2.5 mm Al (>70 kVp)", isPass ? "Pass" : "Fail");
//   }

//   if (testData.leakage?.leakageMeasurements?.[0]) {
//     const item = testData.leakage.leakageMeasurements[0];
//     const values = [item.front, item.back, item.left, item.right].map(parseFloat).filter(v => !isNaN(v));
//     const maxMRperHour = values.length > 0 ? Math.max(...values) : 0;
//     const maxmGy = (maxMRperHour * 60 * 0.00877).toFixed(3);
//     const isPass = parseFloat(maxmGy) < 1;
//     addRow("Radiation Leakage Level", "140 kV, 100 mA", `${maxmGy} mGy in one hour`, "< 1 mGy (114 mR) in one hour", isPass ? "Pass" : "Fail");
//   }

//   if (rows.length === 0) {
//     return <div className="text-center text-gray-500 py-10">No test results available.</div>;
//   }

//   return (
//     <div className="mt-20 print:mt-12">
//       <h2 className="text-2xl font-bold text-center underline mb-8 print:mb-6">
//         SUMMARY OF QA TEST RESULTS
//       </h2>

//       {/* FIXED TABLE CONTAINER */}
//       <div className="overflow-x-auto print:overflow-visible print:max-w-none">
//         <table className="w-full border-2 border-black text-xs print:text-xxs print:min-w-full">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="border border-black px-3 py-3 w-12 text-center">Sr. No.</th>
//               <th className="border border-black px-4 py-3 text-left w-72">Parameters Used</th>
//               <th className="border border-black px-4 py-3 text-center w-32">Specified Values</th>
//               <th className="border border-black px-4 py-3 text-center w-32">Measured Values</th>
//               <th className="border border-black px-4 py-3 text-center w-40">Tolerance</th>
//               <th className="border border-black px-4 py-3 text-center bg-green-100 w-24">Remarks</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((row, index) => (
//               <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
//                 <td className="border border-black px-3 py-3 text-center font-bold">{row.srNo}</td>
//                 <td className="border border-black px-4 py-3 text-left font-medium leading-tight">
//                   {row.parameter}
//                 </td>
//                 <td className="border border-black px-4 py-3 text-center">{row.specified}</td>
//                 <td className="border border-black px-4 py-3 text-center font-semibold">{row.measured}</td>
//                 <td className="border border-black px-4 py-3 text-center text-xs leading-tight">
//                   {row.tolerance}
//                 </td>
//                 <td className="border border-black px-4 py-4 text-center text-lg font-bold">
//                   <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
//                     {row.remarks}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Print Optimization */}
//       <style jsx>{`
//         @media print {
//           table {
//             font-size: 9px !important;
//             width: 100% !important;
//             max-width: none !important;
//           }
//           th, td {
//             padding: 4px 3px !important;
//           }
//           .w-72 { width: 200px !important; }
//           .w-40 { width: 100px !important; }
//           .w-32 { width: 80px !important; }
//           .w-24 { width: 60px !important; }
//           .w-12 { width: 30px !important; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default MainTestTableForCTScan;
// src/components/reports/TestTables/CTScan/MainTestTableForCTScan.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForCTScan: React.FC<MainTestTableProps> = ({ testData }) => {
  const rows: any[] = [];
  let srNo = 1;

  const addRowsForTest = (
    parameter: string,
    testRows: Array<{
      specified: string | number;
      measured: string | number;
      tolerance: string;
      remarks: "Pass" | "Fail";
    }>
  ) => {
    if (testRows.length === 0) return;
    
    testRows.forEach((testRow, idx) => {
      rows.push({
        srNo: idx === 0 ? srNo++ : null, // Only first row gets serial number
        parameter: idx === 0 ? parameter : null, // Only first row gets parameter name
        rowSpan: idx === 0 ? testRows.length : 0, // First row spans all rows
        specified: testRow.specified,
        measured: testRow.measured,
        tolerance: testRow.tolerance,
        remarks: testRow.remarks,
        isFirstRow: idx === 0,
      });
    });
  };

  // 1. Radiation Profile Width - Separate rows for each value
  if (testData.radiationProfile?.table2 && Array.isArray(testData.radiationProfile.table2)) {
    const validRows = testData.radiationProfile.table2.filter((row: any) => row.applied || row.measured);
    if (validRows.length > 0) {
      // Fixed tolerance values: 0.5 mm, ±50%, ±1.0 mm
      const FIXED_TOLERANCE_VALUES = ['0.5 mm', '±50%', '±1.0 mm'];
      const testRows = validRows.map((row: any, index: number) => ({
        specified: row.applied || "-",
        measured: row.measured || "-",
        tolerance: row.criteriaValue || row.toleranceValue || FIXED_TOLERANCE_VALUES[index] || "±10% or ±1 mm",
        remarks: row.remarks === "Pass" ? "Pass" : "Fail" as "Pass" | "Fail",
      }));
      addRowsForTest("Radiation Profile Width / Slice Thickness (mm)", testRows);
    }
  }

  // 2. Operating Potential (kVp Accuracy) - Separate rows for each value
  if (testData.operatingPotential?.table2 && Array.isArray(testData.operatingPotential.table2)) {
    const tol = testData.operatingPotential.tolerance?.value || 5;
    const validRows = testData.operatingPotential.table2.filter((row: any) => row.setKV || row.avgKvp);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        // Use remarks if available, otherwise calculate Pass/Fail
        let isPass = false;
        if (row.remarks === "Pass" || row.remarks === "pass") {
          isPass = true;
        } else if (row.remarks === "Fail" || row.remarks === "fail") {
          isPass = false;
        } else {
          // Calculate Pass/Fail if remarks not available
          const setKV = parseFloat(row.setKV);
          const avgKvp = parseFloat(row.avgKvp);
          if (!isNaN(setKV) && !isNaN(avgKvp) && setKV > 0) {
            // Calculate percentage deviation
            const deviation = Math.abs(((avgKvp - setKV) / setKV) * 100);
            isPass = deviation <= tol;
          } else if (row.deviation !== null && row.deviation !== undefined && !isNaN(parseFloat(row.deviation))) {
            // Use deviation if available
            const deviation = Math.abs(parseFloat(row.deviation));
            isPass = deviation <= tol;
          } else {
            // Default to Fail if we can't determine
            isPass = false;
          }
        }
        return {
          specified: row.setKV || "-",
          measured: row.avgKvp || "-",
          tolerance: `±${tol}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Measurement of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 3. mA/mAs Linearity - Separate rows for each value
  if (testData.maLinearity?.table2 && Array.isArray(testData.maLinearity.table2)) {
    const tol = testData.maLinearity.tolerance || "0.1";
    const validRows = testData.maLinearity.table2.filter((row: any) => row.mAsApplied || row.col);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
        const isPass = row.col ? parseFloat(row.col) <= parseFloat(tol) : false;
        return {
          specified: row.mAsApplied || "-",
          measured: col,
          tolerance: `≤ ${tol}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("mA/mAs Linearity (Coefficient of Linearity)", testRows);
    }
  }

  // 4. Timer Accuracy - Separate rows for each value
  if (testData.timerAccuracy?.table2 && Array.isArray(testData.timerAccuracy.table2)) {
    const tol = testData.timerAccuracy.tolerance || "5";
    const validRows = testData.timerAccuracy.table2.filter((row: any) => row.setTime || row.observedTime);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const error = row.setTime && row.observedTime
          ? Math.abs(((parseFloat(row.observedTime) - parseFloat(row.setTime)) / parseFloat(row.setTime)) * 100)
          : Infinity;
        const isPass = error !== Infinity && parseFloat(error.toFixed(2)) <= parseFloat(tol);
        return {
          specified: row.setTime || "-",
          measured: row.observedTime || "-",
          tolerance: `±${tol}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Timer Accuracy", testRows);
    }
  }

  // 5. CTDIw - Separate rows for Head and Body
  if (testData.ctdi?.table2) {
    const ctdiwHead = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.head || "-";
    const ctdiwBody = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.body || "-";
    const testRows = [
      {
        specified: "As per protocol",
        measured: ctdiwHead,
        tolerance: "≤ Reference",
        remarks: (ctdiwHead === "-" ? "Fail" : "Pass") as "Pass" | "Fail",
      },
      {
        specified: "As per protocol",
        measured: ctdiwBody,
        tolerance: "≤ Reference",
        remarks: (ctdiwBody === "-" ? "Fail" : "Pass") as "Pass" | "Fail",
      },
    ];
    addRowsForTest("CTDIw", testRows);
  }

  // 6. Total Filtration - Separate rows for each value
  if (testData.totalFiltration?.rows && Array.isArray(testData.totalFiltration.rows)) {
    const validRows = testData.totalFiltration.rows.filter((row: any) => row.appliedKV || row.measuredTF);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const measured = parseFloat(row.measuredTF);
        const isPass = measured >= 2.5;
        return {
          specified: row.appliedKV || "-",
          measured: `${row.measuredTF || "-"} mm Al`,
          tolerance: "≥ 2.5 mm Al (>70 kVp)",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Total Filtration", testRows);
    }
  }

  // 7. Radiation Leakage - Separate rows for each value
  if (testData.leakage?.leakageMeasurements && Array.isArray(testData.leakage.leakageMeasurements)) {
    const validRows = testData.leakage.leakageMeasurements.filter((item: any) => item.location || item.front || item.back || item.left || item.right);
    if (validRows.length > 0) {
      const testRows = validRows.map((item: any) => {
        const values = [item.front, item.back, item.left, item.right]
          .map(parseFloat)
          .filter(v => !isNaN(v));
        const maxMRperHour = values.length > 0 ? Math.max(...values) : 0;
        const maxmGy = (maxMRperHour * 60 * 0.00877).toFixed(3);
        const isPass = parseFloat(maxmGy) < 1;
        return {
          specified: item.location || "140 kV, 100 mA",
          measured: `${maxmGy} mGy in one hour`,
          tolerance: "< 1 mGy (114 mR) in one hour",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage Level", testRows);
    }
  }

  // 8. OUTPUT CONSISTENCY - Separate rows for each value
  if (testData.outputConsistency) {
    const { outputRows, tolerance } = testData.outputConsistency;
    const tol = tolerance ? parseFloat(tolerance) : 2.0;

    if (outputRows && Array.isArray(outputRows) && outputRows.length > 0) {
      const validRows = outputRows.filter((row: any) => row.kvp || row.mean);
      if (validRows.length > 0) {
        const testRows = validRows.map((row: any) => {
          const cov = row.cov ? (parseFloat(row.cov) * 100).toFixed(2) : "-";
          const isPass = row.cov ? parseFloat(row.cov) * 100 <= tol : false;
          return {
            specified: row.kvp ? `${row.kvp} kVp` : "Varies with kVp",
            measured: cov === "-" ? "-" : `${cov}%`,
            tolerance: `≤ ${tol}%`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Radiation Output Consistency (COV)", testRows);
      }
    }
  }

  // 9. Measure Max Radiation Level - Separate rows for each value
  if (testData.measureMaxRadiationLevel?.readings && Array.isArray(testData.measureMaxRadiationLevel.readings)) {
    const validRows = testData.measureMaxRadiationLevel.readings.filter((row: any) => row.location || row.mRPerHr);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => ({
        specified: row.location || "-",
        measured: row.mRPerHr ? `${row.mRPerHr} mR/hr` : "-",
        tolerance: row.permissibleLimit || "-",
        remarks: (row.result === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
      }));
      addRowsForTest("Measure Maximum Radiation Level", testRows);
    }
  }

  // 10. Low Contrast Resolution
  if (testData.lowContrastResolution) {
    const observedSize = testData.lowContrastResolution.result?.observedSize || testData.lowContrastResolution.observedSize || "-";
    const contrastLevel = testData.lowContrastResolution.result?.contrastLevel || testData.lowContrastResolution.contrastLevel || "-";
    const isPass = observedSize !== "-" && parseFloat(observedSize) <= 5.0;
    addRowsForTest("Low Contrast Resolution", [{
      specified: `Contrast: ${contrastLevel}%`,
      measured: `${observedSize} mm`,
      tolerance: "≤ 5.0 mm at 1% contrast",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 11. High Contrast Resolution - Separate rows for each value
  if (testData.highContrastResolution?.table2 && Array.isArray(testData.highContrastResolution.table2)) {
    const validRows = testData.highContrastResolution.table2.filter((row: any) => row.size || row.value);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const value = row.value ? `${row.value} ${row.unit || ""}`.trim() : "-";
        return {
          specified: row.size ? `Size: ${row.size} mm` : "-",
          measured: value,
          tolerance: "As per protocol",
          remarks: "Pass" as "Pass" | "Fail",
        };
      });
      addRowsForTest("High Contrast Resolution", testRows);
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
        <table className="border-2 border-black text-xs print:text-[9px] print:min-w-full" style={{ width: 'auto', margin: '0 auto' }}>
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
            {rows.map((row, index) => (
              <tr key={index}>
                {row.isFirstRow ? (
                  <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center font-bold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">
                    {row.srNo}
                  </td>
                ) : null}
                {row.isFirstRow ? (
                  <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-left font-medium leading-tight print:leading-tight bg-transparent print:bg-transparent print:text-[9px]">
                    {row.parameter}
                  </td>
                ) : null}
                <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">{row.specified}</td>
                <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">{row.measured}</td>
                <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center text-xs print:text-[9px] leading-tight print:leading-tight bg-transparent print:bg-transparent">
                  {row.tolerance}
                </td>
                <td className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center print:text-[9px] print:leading-tight ${
                  row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {row.remarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* <style jsx>{`
        @media print {
          table {
            font-size: 9px !important;
            width: 100% !important;
            max-width: none !important;
          }
          th, td {
            padding: 4px 3px !important;
          }
          .w-72 { width: 200px !important; }
          .w-40 { width: 100px !important; }
          .w-32 { width: 80px !important; }
          .w-24 { width: 60px !important; }
          .w-12 { width: 30px !important; }
        }
      `}</style> */}
    </div>
  );
};

export default MainTestTableForCTScan;