// src/components/reports/TestTables/DentalIntra/MainTestTableForDentalIntra.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForDentalIntra: React.FC<MainTestTableProps> = ({ testData }) => {
  const rows: any[] = [];
  let srNo = 1;

  if (!testData || typeof testData !== "object") {
    return <div className="text-center text-gray-500 py-10">No test data available.</div>;
  }

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
    if (!testRows || !Array.isArray(testRows) || testRows.length === 0) return;

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
  if (testData.accuracyOfOperatingPotentialAndTime?.rows && Array.isArray(testData.accuracyOfOperatingPotentialAndTime.rows)) {
    const validRows = testData.accuracyOfOperatingPotentialAndTime.rows.filter((row: any) => row.appliedKvp || row.avgKvp || row.setTime || row.avgTime);
    if (validRows.length > 0) {
      const kvpToleranceSign = testData.accuracyOfOperatingPotentialAndTime.kvpToleranceSign || "±";
      const kvpToleranceValue = testData.accuracyOfOperatingPotentialAndTime.kvpToleranceValue || "5";
      const timeToleranceSign = testData.accuracyOfOperatingPotentialAndTime.timeToleranceSign || "±";
      const timeToleranceValue = testData.accuracyOfOperatingPotentialAndTime.timeToleranceValue || "10";

      const kvpRows = validRows.map((row: any) => {
        const appliedKvp = parseFloat(row.appliedKvp);
        const avgKvp = parseFloat(row.avgKvp);
        let isPass = false;
        if (row.remark === "PASS" || row.remark === "Pass") isPass = true;
        else if (row.remark === "FAIL" || row.remark === "Fail") isPass = false;
        else if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
          const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
          isPass = deviation <= parseFloat(kvpToleranceValue);
        }
        return {
          specified: row.appliedKvp || "-",
          measured: row.avgKvp || "-",
          tolerance: `${kvpToleranceSign}${kvpToleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp)", kvpRows);

      const timeRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const avgTime = parseFloat(row.avgTime);
        let isPass = false;
        if (row.remark === "PASS" || row.remark === "Pass") isPass = true;
        else if (row.remark === "FAIL" || row.remark === "Fail") isPass = false;
        else if (!isNaN(setTime) && !isNaN(avgTime) && setTime > 0) {
          const deviation = Math.abs(((avgTime - setTime) / setTime) * 100);
          isPass = deviation <= parseFloat(timeToleranceValue);
        }
        return {
          specified: row.setTime ?? "-",
          measured: row.avgTime ?? "-",
          tolerance: `${timeToleranceSign}${timeToleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time", timeRows);
    }
  }

  // 1c. Total Filtration (from same combined test)
  if (testData.accuracyOfOperatingPotentialAndTime?.totalFiltration && (testData.accuracyOfOperatingPotentialAndTime.totalFiltration.measured1 != null || testData.accuracyOfOperatingPotentialAndTime.totalFiltration.measured != null)) {
    const tf = testData.accuracyOfOperatingPotentialAndTime.totalFiltration;
    const measured = tf.measured1 ?? tf.measured ?? "-";
    const required = tf.measured2 ?? tf.required ?? "-";
    const atKvp = tf.atKvp ?? "-";
    const pass = (measured !== "-" && required !== "-") ? parseFloat(measured) >= parseFloat(required) : false;
    addRowsForTest("Total Filtration", [{
      specified: atKvp !== "-" ? `At ${atKvp} kVp` : "-",
      measured: measured !== "-" ? `${measured} mm Al` : "-",
      tolerance: required !== "-" ? `≥ ${required} mm Al` : "-",
      remarks: (pass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 2. Linearity of Time
  if (testData.linearityOfTime?.table2 && Array.isArray(testData.linearityOfTime.table2)) {
    const validRows = testData.linearityOfTime.table2.filter((row: any) => row.time);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      const col = testData.linearityOfTime.col != null && testData.linearityOfTime.col !== "" ? String(parseFloat(String(testData.linearityOfTime.col)).toFixed(3)) : "-";
      const remarks = testData.linearityOfTime.remarks || "";
      const isPass = remarks === "Pass" || remarks === "PASS" || (col !== "-" ? parseFloat(col) <= parseFloat(tolerance) : false);
      const specifiedTimes = validRows.map((r: any) => r.time).filter(Boolean).join(", ");
      const testRows = [{
        specified: specifiedTimes || `≤ ${tolerance}`,
        measured: col,
        tolerance: `≤ ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest("Linearity of Time (Coefficient of Linearity)", testRows);
    }
  }

  // 3b. Linearity of mAs Loading
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.ma);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const col = testData.linearityOfMasLoading.table2?.[0]?.col || "-";
      const remarks = testData.linearityOfMasLoading.table2?.[0]?.remarks || "";
      const isPass = remarks === "Pass" || remarks === "PASS" || (col !== "-" ? parseFloat(col) <= parseFloat(tolerance) : false);

      const testRows = [{
        specified: "-",
        measured: col,
        tolerance: `≤ ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 3. Output Consistency / Reproducibility of Radiation Output (CoV)
  if (testData.reproducibilityOfRadiationOutput?.outputRows && Array.isArray(testData.reproducibilityOfRadiationOutput.outputRows)) {
    const validRows = testData.reproducibilityOfRadiationOutput.outputRows.filter((row: any) => row.kv || row.mas || row.cov || row.remark);
    if (validRows.length > 0) {
      const toleranceOperator = testData.reproducibilityOfRadiationOutput.tolerance?.operator || "<=";
      const toleranceValue = testData.reproducibilityOfRadiationOutput.tolerance?.value || "0.05";
      const tolNum = parseFloat(toleranceValue);
      const tolDecimal = tolNum >= 1 ? tolNum / 100 : tolNum;
      const testRows = validRows.map((row: any) => {
        const cvValue = row.cv != null && row.cv !== "" ? String(row.cv) : "-";
        const cvNum = cvValue !== "-" ? parseFloat(cvValue) : NaN;
        let isPass = false;
        if (row.remark === "Pass" || row.remark === "PASS") isPass = true;
        else if (row.remark === "Fail" || row.remark === "FAIL") isPass = false;
        else if (!isNaN(cvNum) && !isNaN(tolNum)) {
          if (toleranceOperator === "<=") isPass = cvNum <= tolDecimal;
          else if (toleranceOperator === "<") isPass = cvNum < tolDecimal;
          else if (toleranceOperator === ">=") isPass = cvNum >= tolDecimal;
          else if (toleranceOperator === ">") isPass = cvNum > tolDecimal;
        }
        const formattedCv = cvValue !== "-" && !isNaN(cvNum) ? cvNum.toFixed(3) : "-";
        return {
          specified: row.kv && row.mas ? `${row.kv} kV, ${row.mas} mAs` : row.kv ? `${row.kv} kV` : "-",
          measured: formattedCv,
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Output Consistency (CoV)", testRows, true);
    }
  }

  // 4. Radiation Leakage from Tube Housing
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location || row.max);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.tolerance?.value || "1";
      const testRows = validRows.map((row: any) => {
        const max = row.max || "-";
        const isPass = testData.tubeHousingLeakage?.calculatedResult?.remark === "Pass" ||
          (max !== "-" && parseFloat(max) < parseFloat(toleranceValue));
        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} ${row.unit || "mGy/h"}` : "-",
          tolerance: `≤ ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage from Tube Housing", testRows);
    }
  }

  // 4. Radiation Leakage Level - measured values like RadiographyFixed (row.max or row.result, with unit)
  if (testData.radiationLeakageLevel?.leakageMeasurements && Array.isArray(testData.radiationLeakageLevel.leakageMeasurements)) {
    const validRows = testData.radiationLeakageLevel.leakageMeasurements.filter((row: any) => row.location && (row.max || row.result || row.front || row.back || row.left || row.right || row.top));
    if (validRows.length > 0) {
      const toleranceValue = testData.radiationLeakageLevel.toleranceValue || "1";
      const toleranceUnit = testData.radiationLeakageLevel.leakageMeasurements[0]?.unit || "mGy/h";
      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;
        if (row.result != null && row.result !== "") {
          const resultVal = parseFloat(row.result);
          if (!isNaN(resultVal)) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(resultVal / 114).toFixed(4)} mGy/h`;
              isPass = (resultVal / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${resultVal.toFixed(4)} ${toleranceUnit}`;
              isPass = resultVal < parseFloat(toleranceValue);
            }
          }
        } else if (row.max != null && row.max !== "") {
          const maxVal = parseFloat(row.max);
          if (!isNaN(maxVal) && maxVal > 0) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(maxVal / 114).toFixed(4)} mGy/h`;
              isPass = (maxVal / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${maxVal.toFixed(2)} ${toleranceUnit}`;
              isPass = maxVal < parseFloat(toleranceValue);
            }
          }
        } else {
          const values = [row.front, row.back, row.left, row.right, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
          if (values.length > 0) {
            const max = Math.max(...values);
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(max / 114).toFixed(4)} mGy/h`;
              isPass = (max / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${max.toFixed(2)} ${toleranceUnit}`;
              isPass = max < parseFloat(toleranceValue);
            }
          }
        }
        if (row.remark === "PASS" || row.remark === "Pass") isPass = true;
        else if (row.remark === "FAIL" || row.remark === "Fail") isPass = false;
        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: `≤ ${toleranceValue} ${toleranceUnit}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage Level", testRows);
    }
  }

  // 5. Radiation Protection Survey - like RadiographyFixed: location, mR/week, tolerance by category
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const mRPerWeek = loc.mRPerWeek ?? "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const isPass = loc.result === "PASS" || loc.result === "Pass" || (mRPerWeek !== "-" && !isNaN(parseFloat(mRPerWeek)) && parseFloat(mRPerWeek) <= limit);
        return {
          specified: loc.location || "-",
          measured: mRPerWeek !== "-" ? `${mRPerWeek} mR/week` : "-",
          tolerance: loc.category === "worker" ? "≤ 40 mR/week" : "≤ 2 mR/week",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
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

export default MainTestTableForDentalIntra;
