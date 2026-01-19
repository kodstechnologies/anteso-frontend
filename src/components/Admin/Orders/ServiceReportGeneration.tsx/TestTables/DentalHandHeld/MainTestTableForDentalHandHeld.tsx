// src/components/reports/TestTables/DentalHandHeld/MainTestTableForDentalHandHeld.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForDentalHandHeld: React.FC<MainTestTableProps> = ({ testData }) => {
  const rows: any[] = [];
  let srNo = 1;

  const addRowsForTest = (
    parameter: string,
    testRows: Array<{
      specified: string | number;
      measured: string | number;
      tolerance: string;
      remarks: "Pass" | "Fail" | "-";
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

  // 1. Accuracy of Operating Potential (kVp)
  // Payload: { measurements: [{ appliedKvp, averageKvp, remarks }], tolerance: { value } }
  if (testData.accuracyOfOperatingPotential?.measurements && Array.isArray(testData.accuracyOfOperatingPotential.measurements)) {
    const validRows = testData.accuracyOfOperatingPotential.measurements.filter((row: any) => row.appliedKvp || row.averageKvp);
    if (validRows.length > 0) {
      const toleranceValue = testData.accuracyOfOperatingPotential.tolerance?.value || "2.0";
      const toleranceType = testData.accuracyOfOperatingPotential.tolerance?.type || "±";

      const kvpRows = validRows.map((row: any) => ({
        specified: row.appliedKvp || "-",
        measured: row.averageKvp || "-",
        tolerance: `${toleranceType}${toleranceValue} kVp`,
        remarks: (row.remarks === "PASS" ? "Pass" : row.remarks === "FAIL" ? "Fail" : "-") as any,
      }));
      addRowsForTest("Accuracy of Operating Potential (kVp)", kvpRows);
    }
  }

  // 2. Accuracy of Irradiation Time
  // Payload: { irradiationTimes: [{ setTime, measuredTime }], tolerance: { operator, value } }
  if (testData.accuracyOfIrradiationTime?.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOp = testData.accuracyOfIrradiationTime.tolerance?.operator || "≤";
      const toleranceVal = testData.accuracyOfIrradiationTime.tolerance?.value || "10";

      const timeRows = validRows.map((row: any) => {
        const s = parseFloat(row.setTime);
        const m = parseFloat(row.measuredTime);
        const err = (!isNaN(s) && !isNaN(m) && s !== 0) ? Math.abs((m - s) / s * 100).toFixed(2) : null;

        let rem: any = "-";
        if (err !== null) {
          const e = parseFloat(err);
          const v = parseFloat(toleranceVal);
          if (toleranceOp === "≤") rem = e <= v ? "Pass" : "Fail";
          else if (toleranceOp === "<") rem = e < v ? "Pass" : "Fail";
          else if (toleranceOp === ">") rem = e > v ? "Pass" : "Fail";
          else if (toleranceOp === ">=") rem = e >= v ? "Pass" : "Fail";
        }

        return {
          specified: row.setTime || "-",
          measured: row.measuredTime || "-",
          tolerance: `${toleranceOp} ${toleranceVal}% Error`,
          remarks: rem,
        };
      });
      addRowsForTest("Accuracy of Irradiation Time", timeRows);
    }
  }

  // 3. Linearity of Time
  if (testData.linearityOfTime?.table2 && Array.isArray(testData.linearityOfTime.table2)) {
    const validRows = testData.linearityOfTime.table2.filter((row: any) => row.time);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      const col = testData.linearityOfTime.col || "-";
      const remarks = testData.linearityOfTime.remarks || "";
      const isPass = remarks.toUpperCase() === "PASS";

      const testRows = [{
        specified: "-",
        measured: col,
        tolerance: `≤ ${tolerance}`,
        remarks: (isPass ? "Pass" : remarks ? "Fail" : "-") as any,
      }];
      addRowsForTest("Linearity of Time (Coefficient of Linearity)", testRows);
    }
  }

  // 4. Linearity of mA Loading
  if (testData.linearityOfmALoading?.table2 && Array.isArray(testData.linearityOfmALoading.table2)) {
    const validRows = testData.linearityOfmALoading.table2.filter((row: any) => row.ma);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfmALoading.tolerance || "0.1";
      // Linearity components usually have one CoL for the whole table
      const col = testData.linearityOfmALoading.col || (validRows[0] && validRows[0].col) || "-";
      const remarks = testData.linearityOfmALoading.remarks || (validRows[0] && validRows[0].remarks) || "";
      const isPass = remarks.toUpperCase() === "PASS";

      const testRows = [{
        specified: "-",
        measured: col,
        tolerance: `≤ ${tolerance}`,
        remarks: (isPass ? "Pass" : remarks ? "Fail" : "-") as any,
      }];
      addRowsForTest("Linearity of mA Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 5. Linearity of mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsRange);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const col = testData.linearityOfMasLoading.col || (validRows[0] && validRows[0].col) || "-";
      const remarks = testData.linearityOfMasLoading.remarks || (validRows[0] && validRows[0].remarks) || "";
      const isPass = remarks.toUpperCase() === "PASS";

      const testRows = [{
        specified: "-",
        measured: col,
        tolerance: `≤ ${tolerance}`,
        remarks: (isPass ? "Pass" : remarks ? "Fail" : "-") as any,
      }];
      addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 6. Consistency of Radiation Output
  if (testData.consistencyOfRadiationOutput?.outputRows && Array.isArray(testData.consistencyOfRadiationOutput.outputRows)) {
    const validRows = testData.consistencyOfRadiationOutput.outputRows.filter((row: any) => row.kvp || row.mean);
    if (validRows.length > 0) {
      const tolerance = testData.consistencyOfRadiationOutput.tolerance || "0.05";
      const testRows = validRows.map((row: any) => {
        const isPass = row.remarks?.toUpperCase() === "PASS" || row.remarks === "P";
        return {
          specified: row.kvp && row.mas ? `${row.kvp} kV, ${row.mas} mAs` : row.kvp ? `${row.kvp} kV` : "-",
          measured: row.cov || "-",
          tolerance: `≤ ${tolerance}`,
          remarks: (isPass ? "Pass" : row.remarks ? "Fail" : "-") as any,
        };
      });
      addRowsForTest("Consistency of Radiation Output (CV)", testRows);
    }
  }

  // 7. Radiation Leakage from Tube Housing
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location || row.max);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.tolerance?.value || "1.0";
      const remark = testData.tubeHousingLeakage.calculatedResult?.remark;
      const finalLeakage = testData.tubeHousingLeakage.calculatedResult?.finalLeakageRate;

      const testRows = [{
        specified: "-",
        measured: finalLeakage !== undefined ? `${finalLeakage} mGy/hr` : "-",
        tolerance: `≤ ${toleranceValue} mGy/hr`,
        remarks: (remark?.toUpperCase() === "PASS" ? "Pass" : remark ? "Fail" : "-") as any,
      }];
      addRowsForTest("Radiation Leakage from Tube Housing", testRows);
    }
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available for summary.</div>;
  }

  return (
    <div className="mt-4 print:mt-2 w-full">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
        SUMMARY OF QA TEST RESULTS
      </h2>

      <div className="overflow-x-auto print:overflow-visible print:max-w-none flex justify-center w-full">
        <table className="border-2 border-black text-xs print:text-[10px] min-w-full mx-auto" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1 w-12 text-center text-[11px] print:text-[10px] font-bold">Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1 text-left w-64 text-[11px] print:text-[10px] font-bold">Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1 text-center w-32 text-[11px] print:text-[10px] font-bold">Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1 text-center w-32 text-[11px] print:text-[10px] font-bold">Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1 text-center w-40 text-[11px] print:text-[10px] font-bold">Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1 text-center bg-green-100 w-24 text-[11px] print:text-[10px] font-bold">Remarks</th>
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
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1 text-center font-bold bg-transparent">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1 text-left font-medium leading-tight print:leading-tight bg-transparent">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1 text-center bg-transparent">{row.specified}</td>
                  <td className="border border-black px-4 py-3 print:px-2 print:py-1 text-center font-semibold bg-transparent">{row.measured}</td>
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1 text-center text-xs print:text-[10px] leading-tight print:leading-tight bg-transparent"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className={`border border-black px-4 py-3 print:px-2 print:py-1 text-center font-bold ${row.remarks === "Pass" ? "bg-green-100 text-green-800 font-bold" : row.remarks === "Fail" ? "bg-red-100 text-red-800 font-bold" : "bg-transparent text-gray-400"
                    }`}>
                    {row.remarks || "-"}
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

export default MainTestTableForDentalHandHeld;
