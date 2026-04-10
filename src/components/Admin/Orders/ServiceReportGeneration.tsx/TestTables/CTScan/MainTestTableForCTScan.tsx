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
//     addRow("Radiation Profile Width / Slice Thickness (mm)", row.applied || "-", row.measured || "-", "Â±10% or Â±1 mm", isPass ? "Pass" : "Fail");
//   }

//   if (testData.operatingPotential?.table2?.[0]) {
//     const row = testData.operatingPotential.table2[0];
//     const tol = testData.operatingPotential.tolerance?.value || 5;
//     const deviation = row.deviation ? Math.abs(parseFloat(row.deviation)) : null;
//     const isPass = deviation !== null && deviation <= tol;
//     addRow("Measurement of Operating Potential (kVp Accuracy)", row.setKV || "-", row.avgKvp || "-", `Â±${tol}%`, isPass ? "Pass" : "Fail");
//   }

//   if (testData.maLinearity?.table2?.[0]) {
//     const row = testData.maLinearity.table2.reduce((worst: any, curr: any) =>
//       Math.abs(parseFloat(curr.linearity || 0)) > Math.abs(parseFloat(worst.linearity || 0)) ? curr : worst
//     );
//     const linearity = row.linearity || "-";
//     const tol = testData.maLinearity.tolerance || "0.1";
//     const isPass = parseFloat(linearity) <= parseFloat(tol);
//     addRow("mA/mAs Linearity (Coefficient of Linearity)", "Varies", linearity, `â‰¤ Â±${tol}`, isPass ? "Pass" : "Fail");
//   }

//   if (testData.timerAccuracy?.table2?.[0]) {
//     const row = testData.timerAccuracy.table2[0];
//     const tol = testData.timerAccuracy.tolerance || "5";
//     const error = row.setTime && row.observedTime
//       ? Math.abs(((parseFloat(row.observedTime) - parseFloat(row.setTime)) / parseFloat(row.setTime)) * 100).toFixed(2)
//       : null;
//     const isPass = error !== null && parseFloat(error) <= parseFloat(tol);
//     addRow("Timer Accuracy", row.setTime || "-", row.observedTime || "-", `Â±${tol}%`, isPass ? "Pass" : "Fail");
//   }

//   if (testData.ctdi?.table2) {
//     const ctdiwHead = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.head || "-";
//     const ctdiwBody = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.body || "-";
//     addRow("CTDIw (Head Phantom)", "As per protocol", ctdiwHead, "â‰¤ Reference", ctdiwHead === "-" ? "Fail" : "Pass");
//     addRow("CTDIw (Body Phantom)", "As per protocol", ctdiwBody, "â‰¤ Reference", ctdiwBody === "-" ? "Fail" : "Pass");
//   }

//   if (testData.totalFiltration?.rows?.[0]) {
//     const row = testData.totalFiltration.rows[0];
//     const measured = parseFloat(row.measuredTF);
//     const isPass = measured >= 2.5;
//     addRow("Total Filtration", row.appliedKV || "-", `${row.measuredTF || "-"} mm Al`, "â‰¥ 2.5 mm Al (>70 kVp)", isPass ? "Pass" : "Fail");
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

  // Helper function to get criteria text based on applied value for Radiation Profile Width
  const getRadiationProfileCriteria = (applied: string | number, index?: number): string => {
    // If index is provided (0, 1, 2), use fixed labels from generator
    if (index !== undefined) {
      if (index === 0) return "a. Less than 1.0 mm";
      if (index === 1) return "b. 1.0 mm to 2.0 mm";
      if (index === 2) return "c. Above 2.0 mm";
    }

    const appliedNum = typeof applied === 'string' ? parseFloat(applied) : applied;
    if (isNaN(appliedNum) || appliedNum <= 0) return "-";

    if (appliedNum < 1.0) {
      return "a. Less than 1.0 mm";
    } else if (appliedNum >= 1.0 && appliedNum <= 2.0) {
      return "b. 1.0 mm to 2.0 mm";
    } else {
      return "c. Above 2.0 mm";
    }
  };

  // Helper function to calculate tolerance based on applied value for Radiation Profile Width
  const getRadiationProfileTolerance = (applied: string | number, index?: number): string => {
    // If index is provided (0, 1, 2), use fixed labels from generator
    if (index !== undefined) {
      if (index === 0) return "0.5 mm";
      if (index === 1) return "Â±50%";
      if (index === 2) return "Â±1.0 mm";
    }

    const appliedNum = typeof applied === 'string' ? parseFloat(applied) : applied;
    if (isNaN(appliedNum) || appliedNum <= 0) return "-";

    if (appliedNum < 1.0) {
      return "0.5 mm";
    } else if (appliedNum >= 1.0 && appliedNum <= 2.0) {
      return "Â±50%";
    } else {
      return "Â±1.0 mm";
    }
  };

  // Helper function to format Operating Potential tolerance
  const formatOperatingPotentialTolerance = (tolerance: any): string => {
    if (!tolerance) return "-";
    const value = tolerance.value || tolerance;
    const type = tolerance.type || 'percent';
    const sign = tolerance.sign || 'both';

    const signSymbol = sign === 'both' ? 'Â±' : sign === 'plus' ? '+' : '-';
    const unit = type === 'percent' ? '%' : ' kVp';
    return `${signSymbol}${value}${unit}`;
  };

  // Helper function to format Timer Accuracy tolerance
  const formatTimerAccuracyTolerance = (tolerance: string | number): string => {
    if (!tolerance) return "-";
    return `Â±${tolerance}%`;
  };

  const addRowsForTest = (
    parameter: React.ReactNode,
    testRows: Array<{
      specified: string | number;
      measured: string | number;
      criteria?: string;
      tolerance: string;
      remarks: "Pass" | "Fail";
      measuredRowSpan?: number;
      toleranceRowSpan?: number;
      remarksRowSpan?: number;
    }>
  ) => {
    if (testRows.length === 0) return;

    testRows.forEach((testRow, idx) => {
      rows.push({
        srNo: idx === 0 ? srNo++ : null,
        parameter: idx === 0 ? parameter : null,
        rowSpan: idx === 0 ? testRows.length : 0,
        specified: testRow.specified,
        measured: testRow.measured,
        criteria: testRow.criteria,
        tolerance: testRow.tolerance,
        remarks: testRow.remarks,
        measuredRowSpan: testRow.measuredRowSpan ?? (idx === 0 ? 1 : 0),
        toleranceRowSpan: testRow.toleranceRowSpan ?? (idx === 0 ? 1 : 0),
        remarksRowSpan: testRow.remarksRowSpan ?? (idx === 0 ? 1 : 0),
        isFirstRow: idx === 0,
        isFirstMeasuredRow: testRow.measuredRowSpan !== undefined ? (testRow.measuredRowSpan > 0 && idx === 0) : true,
        isFirstToleranceRow: testRow.toleranceRowSpan !== undefined ? (testRow.toleranceRowSpan > 0 && idx === 0) : true,
        isFirstRemarksRow: testRow.remarksRowSpan !== undefined ? (testRow.remarksRowSpan > 0 && idx === 0) : true,
      });
    });
  };

  // 1. Radiation Profile Width - Separate rows for each value
  if (testData.radiationProfile?.table2 && Array.isArray(testData.radiationProfile.table2)) {
    const validRows = testData.radiationProfile.table2.filter((row: any) => row.applied || row.measured);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any, i: number) => ({
        specified: row.applied || "-",
        measured: row.measured || "-",
        criteria: getRadiationProfileCriteria(row.applied, i),
        tolerance: getRadiationProfileTolerance(row.applied, i),
        remarks: row.remarks === "Pass" ? "Pass" : "Fail" as "Pass" | "Fail",
      }));
      addRowsForTest("Radiation Profile Width / Slice Thickness (mm)", testRows);
    }
  }

  // 2. Operating Potential (kVp Accuracy) - Separate rows for each value
  if (testData.operatingPotential?.table2 && Array.isArray(testData.operatingPotential.table2)) {
    const tolerance = testData.operatingPotential.tolerance;
    const tolValue = parseFloat(tolerance?.value || tolerance || "5");
    const tolType = tolerance?.type || 'percent';
    const tolSign = tolerance?.sign || 'both';

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
            const diff = avgKvp - setKV;
            if (tolType === 'percent') {
              const deviationPercent = (diff / setKV) * 100;
              if (tolSign === 'plus') isPass = deviationPercent <= tolValue;
              else if (tolSign === 'minus') isPass = deviationPercent >= -tolValue;
              else isPass = Math.abs(deviationPercent) <= tolValue;
            } else {
              // Absolute kVp
              if (tolSign === 'plus') isPass = diff <= tolValue;
              else if (tolSign === 'minus') isPass = diff >= -tolValue;
              else isPass = Math.abs(diff) <= tolValue;
            }
          } else if (row.deviation !== null && row.deviation !== undefined && !isNaN(parseFloat(row.deviation)) && tolType === 'percent') {
            // Use deviation if available (legacy or derived)
            const deviation = Math.abs(parseFloat(row.deviation));
            isPass = deviation <= tolValue;
          } else {
            isPass = false;
          }
        }
        return {
          specified: row.setKV || "-",
          measured: row.avgKvp || "-",
          tolerance: formatOperatingPotentialTolerance(tolerance),
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Measurement of Operating Potential (kVp Accuracy)", testRows);
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
          tolerance: formatTimerAccuracyTolerance(tol),
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Timer Accuracy", testRows);
    }
  }

  // 3. mA/mAs Linearity - Separate rows for each value
  if (testData.maLinearity?.table2 && Array.isArray(testData.maLinearity.table2)) {
    const tol = testData.maLinearity.tolerance || "0.1";
    const validRows = testData.maLinearity.table2.filter((row: any) => row.mAsApplied || row.col);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any, idx: number) => {
        const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
        const isPass = row.col ? parseFloat(row.col) <= parseFloat(tol) : false;
        return {
          specified: row.mAsApplied || "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `â‰¤ ${tol}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          measuredRowSpan: idx === 0 ? validRows.length : 0,
          toleranceRowSpan: idx === 0 ? validRows.length : 0,
          remarksRowSpan: idx === 0 ? validRows.length : 0,
        };
      });
      addRowsForTest("mA/mAs Linearity (Coefficient of Linearity)", testRows);
    }
  }

  // 8. OUTPUT CONSISTENCY - Separate rows for each value
  if (testData.outputConsistency) {
    const { outputRows, tolerance } = testData.outputConsistency;
    const tolValue = tolerance && typeof tolerance === 'object' && tolerance.value
      ? parseFloat(tolerance.value)
      : (typeof tolerance === 'string' || typeof tolerance === 'number')
        ? parseFloat(String(tolerance))
        : 0.05;
    const tolOperator = tolerance && typeof tolerance === 'object' && tolerance.operator
      ? tolerance.operator
      : '<=';

    if (outputRows && Array.isArray(outputRows) && outputRows.length > 0) {
      const validRows = outputRows.filter((row: any) => 
        row.kvp || row.mean || row.cov || (row.outputs && row.outputs.length > 0)
      );

      if (validRows.length > 0) {
        const getVal = (o: any): number => {
          if (o == null) return NaN;
          if (typeof o === 'number') return o;
          if (typeof o === 'string') return parseFloat(o);
          if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
          return NaN;
        };

        const testRows = validRows.map((row: any) => {
          // Calculate on-the-fly if cov is missing
          const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
          
          let cvValue = row.cov || row.cv;
          if (!cvValue && avg !== null && avg > 0) {
            const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
            const cov = Math.sqrt(variance) / avg;
            if (isFinite(cov)) {
              cvValue = cov;
            }
          }

          const formattedCov = cvValue !== undefined && cvValue !== null && cvValue !== "" && cvValue !== "-"
            ? (typeof cvValue === 'number' ? cvValue.toFixed(4) : parseFloat(String(cvValue)).toFixed(4))
            : "-";

          let isPass = false;
          if (formattedCov !== "-") {
            const covNum = parseFloat(formattedCov);
            if (tolOperator === '<=' || tolOperator === '<') {
              isPass = covNum <= tolValue;
            } else {
              isPass = covNum >= tolValue;
            }
          }
          const operatorSymbol = tolOperator === '<=' ? 'â‰¤' : tolOperator === '<' ? '<' : tolOperator === '>=' ? 'â‰¥' : '>';
          return {
            specified: row.kvp ? `${row.kvp} kVp` : "Varies with kVp",
            measured: formattedCov !== "-" ? "CoV = " + formattedCov : "-",
            tolerance: `${operatorSymbol} ${tolValue}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Radiation Output Consistency (COV)", testRows);
      }
    }
  }


  // 5. CTDIw - Separate rows for Head and Body
  if (testData.ctdi?.table2) {
    const ctdiw = testData.ctdi.table2.find((r: any) => r.result === "CTDIw") || {};
    const ctdiwRated = testData.ctdi.table2.find((r: any) => r.result === "CTDIw (Rated)") || {};
    const tolerance = testData.ctdi.tolerance;
    const kvp = testData.ctdi.table1?.[0]?.kvp || "-";
    const tolValue = tolerance?.value ? parseFloat(tolerance.value) : 20;
    const tolSign = tolerance?.sign === 'plus' ? '+' : tolerance?.sign === 'minus' ? '-' : 'Â±';
    const tolStr = `${tolSign}${tolValue} % of Stated value`;

    const calculateCtdiPass = (measured: any, specified: any) => {
      const m = parseFloat(measured);
      const s = parseFloat(specified);
      if (isNaN(m) || isNaN(s) || s === 0) return true;
      const diffPercent = (Math.abs(m - s) / s) * 100;
      return diffPercent <= tolValue;
    };

    const headPass = calculateCtdiPass(ctdiw.head, ctdiwRated.head);
    const bodyPass = calculateCtdiPass(ctdiw.body, ctdiwRated.body);
    const overallRemarks = (headPass && bodyPass) ? "Pass" : "Fail";

    const paramNode = (
      <div className="flex flex-col">
        <div style={{ fontSize: '10px' }}>Radiation Dose Test CTDI - (mGy/100mAs) at (kV)</div>
        <div className="mt-1 border-t border-black w-full pt-1 text-center font-bold" style={{ fontSize: '12px' }}>
          {kvp}
        </div>
      </div>
    );

    const testRows = [
      {
        specified: ctdiwRated.head || "-",
        measured: ctdiw.head || "-",
        criteria: "(Head)",
        tolerance: tolStr,
        remarks: overallRemarks as "Pass" | "Fail",
        toleranceRowSpan: 2,
        remarksRowSpan: 2,
      },
      {
        specified: ctdiwRated.body || "-",
        measured: ctdiw.body || "-",
        criteria: "(Body)",
        tolerance: tolStr,
        remarks: overallRemarks as "Pass" | "Fail",
        toleranceRowSpan: 0,
        remarksRowSpan: 0,
      },
    ];
    addRowsForTest(paramNode, testRows);
  }

  // 10. Low Contrast Resolution
  if (testData.lowContrastResolution) {
    const observedSize = testData.lowContrastResolution.result?.observedSize || testData.lowContrastResolution.observedSize || "-";
    const contrastLevel = testData.lowContrastResolution.result?.contrastLevel || testData.lowContrastResolution.contrastLevel || "-";
    const isPass = observedSize !== "-" && parseFloat(observedSize) <= 5.0;
    addRowsForTest("Low Contrast Resolution", [{
      specified: `Contrast: ${contrastLevel}%`,
      measured: `${observedSize} mm`,
      tolerance: "â‰¤ 5.0 mm at 1% contrast",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 11. High Contrast Resolution
  if (testData.highContrastResolution) {
    let hasData = false;
    let testRows: any[] = [];
    const hcr = testData.highContrastResolution;

    const validTable2Rows = hcr.table2 && Array.isArray(hcr.table2) 
      ? hcr.table2.filter((row: any) => row.size || row.value)
      : [];

    if (validTable2Rows.length > 0) {
      hasData = true;
      testRows = validTable2Rows.map((row: any) => {
        const value = row.value ? `${row.value} ${row.unit || ""}`.trim() : "-";
        return {
          specified: row.size ? `Size: ${row.size} mm` : "-",
          measured: value,
          criteria: "As per protocol", // Mapped from the View Report layout idea or generator protocol
          tolerance: "As per protocol",
          remarks: "Pass" as "Pass" | "Fail", // Usually marked pass if evaluated
        };
      });
    } else if (hcr.result && hcr.operatingParams) {
      hasData = true;
      const observedSize = hcr.result.observedSize ?? "-";
      const contrastDiff = hcr.result.contrastDifference ?? "-";
      testRows = [{
        specified: `Contrast Difference: ${contrastDiff}`,
        measured: `Observed Size: ${observedSize} mm`,
        criteria: "-",
        tolerance: "As per protocol",
        remarks: "Pass" as "Pass" | "Fail",
      }];
    }

    if (hasData) {
      addRowsForTest("High Contrast Resolution", testRows);
    }
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
          tolerance: "â‰¥ 2.5 mm Al",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Total Filtration", testRows);
    }
  }

  // 7. Radiation Leakage - Separate rows for each value
  if (testData.leakage?.leakageMeasurements && Array.isArray(testData.leakage.leakageMeasurements)) {
    const validRows = testData.leakage.leakageMeasurements.filter((item: any) => item.location || item.front || item.back || item.left || item.right || item.top);
    if (validRows.length > 0) {
      const testRows = validRows.map((item: any) => {
        // Use saved result and remark if they exist (best accuracy)
        if (item.result && item.remark) {
          return {
            specified: item.location || "Tube",
            measured: `${item.result} mGy in one hour`,
            tolerance: `< ${testData.leakage.toleranceValue || "1"} mGy in one hour`,
            remarks: item.remark as "Pass" | "Fail",
          };
        }

        // Fallback calculation matching the generator logic
        const values = [item.front, item.back, item.left, item.right, item.top]
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));
        const maxMR = values.length > 0 ? Math.max(...values) : 0;
        
        const ma = parseFloat(testData.leakage.ma || testData.leakage.measurementSettings?.[0]?.ma) || 0;
        const workload = parseFloat(testData.leakage.workload) || 0;
        let result = "-";
        let isPass = true;

        if (maxMR > 0 && ma > 0 && workload > 0) {
          const calculatedResult = (workload * maxMR) / (60 * ma);
          const mgyVal = calculatedResult / 114;
          result = mgyVal.toFixed(4);
          const tol = parseFloat(testData.leakage.toleranceValue) || 1;
          isPass = mgyVal <= tol;
        }

        return {
          specified: item.location || "Tube",
          measured: result !== "-" ? `${result} mGy in one hour` : "-",
          tolerance: `< ${testData.leakage.toleranceValue || "1"} mGy in one hour`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage Level", testRows);
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


  // 12. Radiation Protection Survey
  if (testData.radiationProtectionSurvey) {
    const survey = testData.radiationProtectionSurvey;
    const locations: any[] = Array.isArray(survey.locations) ? survey.locations : [];
    if (locations.length > 0) {
      const workerLocs = locations.filter((l: any) => l.category === "worker");
      const publicLocs = locations.filter((l: any) => l.category === "public");

      const maxWorkerWeekly = Math.max(...workerLocs.map((l: any) => parseFloat(l.mRPerWeek) || 0), 0);
      const maxPublicWeekly = Math.max(...publicLocs.map((l: any) => parseFloat(l.mRPerWeek) || 0), 0);

      const surveyRows: any[] = [];

      surveyRows.push({
        specified: "â‰¤ 40 mR/week",
        measured: maxWorkerWeekly > 0 ? `${maxWorkerWeekly.toFixed(3)} mR/week` : "-",
        criteria: "For Radiation Worker",
        tolerance: "â‰¤ 40 mR/week",
        remarks: (maxWorkerWeekly > 0 ? (maxWorkerWeekly <= 40 ? "Pass" : "Fail") : "Pass") as "Pass" | "Fail",
      });

      surveyRows.push({
        specified: "â‰¤ 2 mR/week",
        measured: maxPublicWeekly > 0 ? `${maxPublicWeekly.toFixed(3)} mR/week` : "-",
        criteria: "For Public",
        tolerance: "â‰¤ 2 mR/week",
        remarks: (maxPublicWeekly > 0 ? (maxPublicWeekly <= 2 ? "Pass" : "Fail") : "Pass") as "Pass" | "Fail",
      });

      addRowsForTest("Radiation Protection Survey", surveyRows);
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
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center w-40 print:text-[9px]">Criteria</th>
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
                {row.isFirstMeasuredRow ? (
                  <td rowSpan={row.measuredRowSpan || 1} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">
                    {row.measured}
                  </td>
                ) : null}
                <td className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center text-xs print:text-[9px] leading-tight print:leading-tight bg-transparent print:bg-transparent">
                  {row.criteria || "-"}
                </td>
                {row.isFirstToleranceRow ? (
                  <td rowSpan={row.toleranceRowSpan || 1} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center text-xs print:text-[9px] leading-tight print:leading-tight bg-transparent print:bg-transparent">
                    {row.tolerance}
                  </td>
                ) : null}
                {row.isFirstRemarksRow ? (
                  <td rowSpan={row.remarksRowSpan || 1} className={`border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-bold print:text-[9px] print:leading-tight ${row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                    {row.remarks}
                  </td>
                ) : null}
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
