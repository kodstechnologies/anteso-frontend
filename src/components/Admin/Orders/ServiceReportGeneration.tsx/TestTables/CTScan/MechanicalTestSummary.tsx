// src/components/reports/TestTables/CTScan/MechanicalTestSummary.tsx
import React from "react";

interface MechanicalTestSummaryProps {
  testData: any;
}

const MechanicalTestSummary: React.FC<MechanicalTestSummaryProps> = ({ testData }) => {
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
        srNo: idx === 0 ? srNo++ : null,
        parameter: idx === 0 ? parameter : null,
        rowSpan: idx === 0 ? testRows.length : 0,
        specified: testRow.specified,
        measured: testRow.measured,
        tolerance: testRow.tolerance,
        remarks: testRow.remarks,
        isFirstRow: idx === 0,
      });
    });
  };

  // 1. Alignment of Table/Gantry
  if (testData.alignmentOfTableGantry) {
    const data = testData.alignmentOfTableGantry;
    const result = data.result || "-";
    const toleranceSign = data.toleranceSign || "±";
    const toleranceValue = data.toleranceValue || "2";
    const tolerance = `${toleranceSign}${toleranceValue}`;
    const remark = data.remark || "-";
    
    addRowsForTest("Alignment of Table/Gantry", [{
      specified: "Gantry midline to table midline",
      measured: result,
      tolerance: tolerance,
      remarks: (remark === "Pass" ? "Pass" : remark === "Fail" ? "Fail" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 2. Gantry Tilt - Separate rows for each measurement
  if (testData.gantryTilt?.measurements && Array.isArray(testData.gantryTilt.measurements)) {
    const validRows = testData.gantryTilt.measurements.filter((m: any) => m.actual || m.measured);
    if (validRows.length > 0) {
      const toleranceSign = testData.gantryTilt.toleranceSign || "±";
      const toleranceValue = testData.gantryTilt.toleranceValue || "2";
      const tolerance = `${toleranceSign}${toleranceValue}°`;
      
      const testRows = validRows.map((m: any) => ({
        specified: m.actual || "-",
        measured: m.measured || "-",
        tolerance: tolerance,
        remarks: (m.remark === "Pass" ? "Pass" : m.remark === "Fail" ? "Fail" : "Fail") as "Pass" | "Fail",
      }));
      addRowsForTest("Gantry Tilt Measurement", testRows);
    }
  }

  // 3. Table Position - Separate rows for each table incrementation
  if (testData.tablePosition?.tableIncrementation && Array.isArray(testData.tablePosition.tableIncrementation)) {
    const validRows = testData.tablePosition.tableIncrementation.filter((row: any) => row.expected || row.measured);
    if (validRows.length > 0) {
      const toleranceSign = testData.tablePosition.toleranceSign || "±";
      const toleranceValue = testData.tablePosition.toleranceValue || "2";
      const tolerance = `${toleranceSign}${toleranceValue} mm`;
      
      const testRows = validRows.map((row: any) => ({
        specified: row.expected || "-",
        measured: row.measured || "-",
        tolerance: tolerance,
        remarks: (row.remark === "Pass" ? "Pass" : row.remark === "Fail" ? "Fail" : "Fail") as "Pass" | "Fail",
      }));
      addRowsForTest("Table Position", testRows);
    }
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10 print:py-4 print:text-sm">No mechanical test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-2">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
        SUMMARY OF MECHANICAL TEST RESULTS
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
    </div>
  );
};

export default MechanicalTestSummary;

