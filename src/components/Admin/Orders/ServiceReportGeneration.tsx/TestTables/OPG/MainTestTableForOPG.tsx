// src/components/reports/TestTables/OPG/MainTestTableForOPG.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForOPG: React.FC<MainTestTableProps> = ({ testData }) => {
  let srNo = 1;
  const rows: any[] = [];
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
    toleranceRowSpan: boolean = false // Optional parame  ter to control tolerance rowSpan
  ) => {
    if (testRows.length === 0) return;

    // Get shared tolerance value if toleranceRowSpan is enabled
    const sharedTolerance = toleranceRowSpan ? testRows[0]?.tolerance : null;

    testRows.forEach((testRow, idx) => {
      rows.push({
        srNo: idx === 0 ? srNo++ : null, // Only first row gets serial number
        parameter: idx === 0 ? parameter : null, // Only first row gets parameter name
        rowSpan: idx === 0 ? testRows.length : 0, // First row spans all rows
        specified: testRow.specified,
        measured: testRow.measured,
        tolerance: toleranceRowSpan ? (idx === 0 ? sharedTolerance : null) : testRow.tolerance,
        toleranceRowSpan: toleranceRowSpan ? (idx === 0 ? testRows.length : 0) : 0,
        hasToleranceRowSpan: toleranceRowSpan, // Flag to track if this test uses tolerance rowSpan
        remarks: testRow.remarks,
        isFirstRow: idx === 0,
      });
    });
  };

  // 1. Accuracy of Irradiation Time
  if (testData.irradiationTime?.irradiationTimes && Array.isArray(testData.irradiationTime.irradiationTimes)) {
    const validRows = testData.irradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.irradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.irradiationTime.tolerance?.value || "5";
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
          } else if (toleranceOperator === "<") {
            isPass = errorVal < tol;
          } else if (toleranceOperator === ">") {
            isPass = errorVal > tol;
          } else if (toleranceOperator === "=") {
            isPass = Math.abs(errorVal - tol) < 0.01;
          } else {
            // Default to <=
            isPass = errorVal <= tol;
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

  // 2. Accuracy of Operating Potential (kVp Accuracy)
  if (testData.operatingPotential?.rows && Array.isArray(testData.operatingPotential.rows)) {
    const validRows = testData.operatingPotential.rows.filter((row: any) => row.appliedKvp || row.averageKvp);
    if (validRows.length > 0) {
      const toleranceSign =
        testData.operatingPotential.tolerance?.sign ||
        testData.operatingPotential.toleranceSign ||
        "±";
      const toleranceValue = testData.operatingPotential.toleranceValue || "2.0";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
          // Calculate Pass/Fail if remarks not available
          const appliedKvp = parseFloat(row.appliedKvp);
          const avgKvp = parseFloat(row.averageKvp);
          if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }
        }
        return {
          specified: row.appliedKvp || "-",
          measured: row.averageKvp || "-",
          tolerance: `${toleranceSign} ${toleranceValue} kVp`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

  // 6. Total Filtration Result (aligned with Radiography Fixed)
  const totalFiltrationData =
    testData.totalFiltration ||
    testData.totalFilteration ||
    testData.operatingPotential?.totalFiltration;
  const totalFiltrationResult = totalFiltrationData?.totalFiltration || totalFiltrationData;
  if (totalFiltrationResult) {
    const measuredStr =
      totalFiltrationResult.required ||
      totalFiltrationResult.measured ||
      totalFiltrationData?.required ||
      totalFiltrationData?.measured ||
      "-";
    const atKvp =
      totalFiltrationResult.atKvp ||
      totalFiltrationResult.kv ||
      totalFiltrationResult.kVp ||
      totalFiltrationData?.atKvp ||
      totalFiltrationData?.kv ||
      totalFiltrationData?.kVp ||
      "-";

    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(measuredStr);

    const ft = totalFiltrationData?.filtrationTolerance || {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
    };

    const threshold1 = parseFloat(ft.kvThreshold1);
    const threshold2 = parseFloat(ft.kvThreshold2);

    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal)) {
      let requiredTolerance: number;
      if (kvp < threshold1) requiredTolerance = parseFloat(ft.forKvGreaterThan70);
      else if (kvp >= threshold1 && kvp <= threshold2) requiredTolerance = parseFloat(ft.forKvBetween70And100);
      else requiredTolerance = parseFloat(ft.forKvGreaterThan100);
      if (!isNaN(requiredTolerance)) isPass = measuredVal >= requiredTolerance;
    }

    const toleranceStr = "1.5 mm Al for kV <= 70; 2.0 mm Al for 70 <= kV <= 100; 2.5 mm Al for kV > 100";

    addRowsForTest("Total Filtration", [{
      specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
      measured: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      tolerance: toleranceStr,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }


    // 4. Linearity of mA Loading (or mAs Loading)
  // Backend may return table2 or table2Rows
  const linearityRows = testData.linearityOfMaLoading?.table2Rows || testData.linearityOfMaLoading?.table2;
  if (linearityRows && Array.isArray(linearityRows)) {
    const validRows = linearityRows.filter((row: any) => row.ma || row.mA || row.col || row.measuredOutputs?.length);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMaLoading.tolerance || "0.1";
      const toleranceOperator = testData.linearityOfMaLoading.toleranceOperator || "<=";
      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(o.value);
        return NaN;
      };

      let colValue = testData.linearityOfMaLoading.col || testData.linearityOfMaLoading.coefficient || testData.linearityOfMaLoading.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? []).map(getVal).filter((v: number) => !isNaN(v) && v > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
          const maVal = parseFloat(String(row.ma ?? row.mA ?? row.appliedCurrent ?? ""));
          if (avg !== null && !isNaN(maVal) && maVal > 0) {
            const xVal = avg / maVal;
            if (isFinite(xVal)) xValues.push(xVal);
          }
        });
        if (xValues.length > 0) {
          const xMax = Math.max(...xValues);
          const xMin = Math.min(...xValues);
          if (xMax + xMin > 0) colValue = Math.abs(xMax - xMin) / (xMax + xMin);
        }
      }

      const colRaw = parseFloat(String(colValue));
      const col = !isNaN(colRaw) && isFinite(colRaw) ? colRaw.toFixed(3) : "-";

      let isPass = testData.linearityOfMaLoading.remarks === "Pass" || testData.linearityOfMaLoading.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(tolerance);
        if (toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const tableLevelKv =
        testData.linearityOfMaLoading?.kv ??
        testData.linearityOfMaLoading?.kV ??
        testData.linearityOfMaLoading?.setKv ??
        testData.linearityOfMaLoading?.setKV ??
        (Array.isArray(testData.linearityOfMaLoading?.table1)
          ? testData.linearityOfMaLoading?.table1?.[0]?.kv
          : testData.linearityOfMaLoading?.table1?.kv);

      const firstRow = validRows[0] || {};
      const kvValue = asDisplayNumber(firstRow.kv ?? firstRow.kV ?? firstRow.setKV ?? firstRow.setKv ?? tableLevelKv);
      const testRows = [{
        specified: kvValue ? `at ${kvValue} kV` : "-",
        measured: col !== "-" ? `CoL = ${col}` : "-",
        tolerance: `${toleranceOperator} ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }];
      addRowsForTest("Linearity of mA Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 3. Consistency of Radiation Output (COV)
  if (testData.outputConsistency?.outputRows && Array.isArray(testData.outputConsistency.outputRows)) {
    const validRows = testData.outputConsistency.outputRows.filter((row: any) =>
      row.kv || row.kV || row.kvp || row.cv || row.cov || (row.outputs && row.outputs.length > 0) || row.remark
    );
    if (validRows.length > 0) {
      const toleranceOperator = testData.outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = testData.outputConsistency.tolerance?.value || "0.05";
      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(o.value);
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
        const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
        const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

        let cvValue = row.cv || row.cov;
        if (!cvValue && avg !== null && avg > 0) {
          const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
          const cov = Math.sqrt(variance) / avg;
          if (isFinite(cov)) cvValue = cov;
        }

        const formattedCv = cvValue !== undefined && cvValue !== null && cvValue !== "" && cvValue !== "-"
          ? (typeof cvValue === "number" ? cvValue.toFixed(3) : parseFloat(String(cvValue)).toFixed(3))
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

        const kvValue = asDisplayNumber(row.kv ?? row.kV ?? row.kvp ?? row.setKV ?? row.setKv ?? tableLevelKv);
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
          measured: formattedCv !== "-" ? `CoV = ${formattedCv}` : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (COV)", testRows, true);
    }
  }



  // 5. Maximum Radiation Leakage from Tube Housing
  if (testData.radiationLeakage?.leakageRows && Array.isArray(testData.radiationLeakage.leakageRows)) {
    const validRows = testData.radiationLeakage.leakageRows.filter((row: any) => row.location && (row.max || row.result || row.front || row.back));
    if (validRows.length > 0) {
      const toleranceValue = testData.radiationLeakage.toleranceValue || "1";
      const toleranceUnit = validRows[0]?.unit || "mGy in one hour";
      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;

        if (row.result) {
          const resultValue = parseFloat(row.result);
          if (!isNaN(resultValue)) {
            if (toleranceUnit === "mGy/h" || toleranceUnit === "mGy in one hour") {
              measuredValue = `${(resultValue / 114).toFixed(4)} mGy in one hour`;
              isPass = (resultValue / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${resultValue.toFixed(4)} ${toleranceUnit}`;
              isPass = resultValue < parseFloat(toleranceValue);
            }
          }
        } else if (row.max) {
          const maxValue = parseFloat(row.max);
          if (!isNaN(maxValue) && maxValue > 0) {
            if (toleranceUnit === "mGy/h" || toleranceUnit === "mGy in one hour") {
              measuredValue = `${(maxValue / 114).toFixed(4)} mGy in one hour`;
              isPass = (maxValue / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${maxValue.toFixed(2)} ${toleranceUnit}`;
              isPass = maxValue < parseFloat(toleranceValue);
            }
          }
        } else {
          const values = [row.front, row.back, row.left, row.right, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
          if (values.length > 0) {
            const max = Math.max(...values);
            if (toleranceUnit === "mGy/h" || toleranceUnit === "mGy in one hour") {
              measuredValue = `${(max / 114).toFixed(4)} mGy in one hour`;
              isPass = (max / 114) < parseFloat(toleranceValue);
            } else {
              measuredValue = `${max.toFixed(2)} mGy in one hour`;
              isPass = max < parseFloat(toleranceValue);
            }
          }
        }

        if (row.remark || testData.radiationLeakage.remark) {
          const remark = row.remark || testData.radiationLeakage.remark;
          if (remark === "PASS" || remark === "Pass") isPass = true;
          else if (remark === "FAIL" || remark === "Fail") isPass = false;
        }

        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: `<= ${toleranceValue} mGy in one hour`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }


  // 7. Details of Radiation Protection Survey (if available)
  const radiationProtectionSurveyData = testData.radiationProtectionSurvey || testData.radiationSurvey;
  if (radiationProtectionSurveyData?.locations && Array.isArray(radiationProtectionSurveyData.locations)) {
    const validRows = radiationProtectionSurveyData.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const mRPerWeek = loc.mRPerWeek || "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const isPass = loc.result === "PASS" || (mRPerWeek !== "-" && parseFloat(mRPerWeek) <= limit);
        return {
          specified: loc.location || "-",
          measured: mRPerWeek !== "-" ? `${mRPerWeek} mR/week` : "-",
          tolerance: loc.category === "worker" ? "<= 40 mR/week" : "<= 2 mR/week",
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
    <div className="mt-4 print:mt-2 flex justify-center">
      <div className="w-full max-w-full">
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
    </div>
  );
};

export default MainTestTableForOPG;


