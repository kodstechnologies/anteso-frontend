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

  const addRow = (
    parameter: string,
    specified: string | number,
    measured: string | number,
    tolerance: string,
    remarks: "Pass" | "Fail"
  ) => {
    rows.push({ srNo: srNo++, parameter, specified, measured, tolerance, remarks });
  };

  // 1. Radiation Profile Width
  if (testData.radiationProfile?.table2?.[0]) {
    const row = testData.radiationProfile.table2[0];
    const isPass = row.remarks === "Pass";
    addRow(
      "Radiation Profile Width / Slice Thickness (mm)",
      row.applied || "-",
      row.measured || "-",
      "±10% or ±1 mm",
      isPass ? "Pass" : "Fail"
    );
  }

  // 2. Operating Potential (kVp Accuracy)
  if (testData.operatingPotential?.table2?.[0]) {
    const row = testData.operatingPotential.table2[0];
    const tol = testData.operatingPotential.tolerance?.value || 5;
    const deviation = row.deviation ? Math.abs(parseFloat(row.deviation)) : null;
    const isPass = deviation !== null && deviation <= tol;
    addRow(
      "Measurement of Operating Potential (kVp Accuracy)",
      row.setKV || "-",
      row.avgKvp || "-",
      `±${tol}%`,
      isPass ? "Pass" : "Fail"
    );
  }

  // 3. mA/mAs Linearity
  if (testData.maLinearity?.table2?.[0]) {
    const row = testData.maLinearity.table2.reduce((worst: any, curr: any) =>
      Math.abs(parseFloat(curr.col || 0)) > Math.abs(parseFloat(worst.col || 0)) ? curr : worst
    );
    const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
    const tol = testData.maLinearity.tolerance || "0.1";
    const isPass = parseFloat(col) <= parseFloat(tol);
    addRow("mA/mAs Linearity (Coefficient of Linearity)", "Varies", col, `≤ ${tol}`, isPass ? "Pass" : "Fail");
  }

  // 4. Timer Accuracy
  if (testData.timerAccuracy?.table2?.[0]) {
    const row = testData.timerAccuracy.table2[0];
    const tol = testData.timerAccuracy.tolerance || "5";
    const error = row.setTime && row.observedTime
      ? Math.abs(((parseFloat(row.observedTime) - parseFloat(row.setTime)) / parseFloat(row.setTime)) * 100).toFixed(2)
      : null;
    const isPass = error !== null && parseFloat(error) <= parseFloat(tol);
    addRow(
      "Timer Accuracy",
      row.setTime || "-",
      row.observedTime || "-",
      `±${tol}%`,
      isPass ? "Pass" : "Fail"
    );
  }

  // 5. CTDIw
  if (testData.ctdi?.table2) {
    const ctdiwHead = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.head || "-";
    const ctdiwBody = testData.ctdi.table2.find((r: any) => r.result?.includes("CTDIw"))?.body || "-";
    addRow("CTDIw (Head Phantom)", "As per protocol", ctdiwHead, "≤ Reference", ctdiwHead === "-" ? "Fail" : "Pass");
    addRow("CTDIw (Body Phantom)", "As per protocol", ctdiwBody, "≤ Reference", ctdiwBody === "-" ? "Fail" : "Pass");
  }

  // 6. Total Filtration
  if (testData.totalFiltration?.rows?.[0]) {
    const row = testData.totalFiltration.rows[0];
    const measured = parseFloat(row.measuredTF);
    const isPass = measured >= 2.5;
    addRow(
      "Total Filtration",
      row.appliedKV || "-",
      `${row.measuredTF || "-"} mm Al`,
      "≥ 2.5 mm Al (>70 kVp)",
      isPass ? "Pass" : "Fail"
    );
  }

  // 7. Radiation Leakage
  if (testData.leakage?.leakageMeasurements?.[0]) {
    const item = testData.leakage.leakageMeasurements[0];
    const values = [item.front, item.back, item.left, item.right]
      .map(parseFloat)
      .filter(v => !isNaN(v));
    const maxMRperHour = values.length > 0 ? Math.max(...values) : 0;
    const maxmGy = (maxMRperHour * 60 * 0.00877).toFixed(3);
    const isPass = parseFloat(maxmGy) < 1;
    addRow(
      "Radiation Leakage Level",
      "140 kV, 100 mA",
      `${maxmGy} mGy in one hour`,
      "< 1 mGy (114 mR) in one hour",
      isPass ? "Pass" : "Fail"
    );
  }

  // 8. OUTPUT CONSISTENCY (NEW!)
  if (testData.outputConsistency) {
    const { outputRows, tolerance } = testData.outputConsistency;
    const tol = tolerance ? parseFloat(tolerance) : 2.0;

    if (outputRows && outputRows.length > 0) {
      // Find worst COV
      const worstCov = outputRows.reduce((max: number, row: any) => {
        const cov = row.cov ? parseFloat(row.cov) * 100 : 0;
        return cov > max ? cov : max;
      }, 0);

      const isPass = worstCov <= tol;

      addRow(
        "Radiation Output Consistency (COV)",
        "Varies with kVp",
        `${worstCov.toFixed(2)}%`,
        `≤ ${tol}%`,
        isPass ? "Pass" : "Fail"
      );
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
        <table className="w-full border-2 border-black text-xs print:text-xxs print:min-w-full">
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
            {rows.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black px-3 py-3 text-center font-bold">{row.srNo}</td>
                <td className="border border-black px-4 py-3 text-left font-medium leading-tight">
                  {row.parameter}
                </td>
                <td className="border border-black px-4 py-3 text-center">{row.specified}</td>
                <td className="border border-black px-4 py-3 text-center font-semibold">{row.measured}</td>
                <td className="border border-black px-4 py-3 text-center text-xs leading-tight">
                  {row.tolerance}
                </td>
                <td className="border border-black px-4 py-4 text-center text-lg font-bold">
                  <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
                    {row.remarks}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default MainTestTableForCTScan;