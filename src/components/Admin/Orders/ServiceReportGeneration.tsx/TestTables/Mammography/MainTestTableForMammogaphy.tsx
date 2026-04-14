// src/components/reports/TestTables/Mammography/MainTestTableForMammography.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForMammography: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // 2. Accuracy of Operating Potential (kVp)
  if (testData.accuracyOfOperatingPotential?.measurements && Array.isArray(testData.accuracyOfOperatingPotential.measurements)) {
    const validRows = testData.accuracyOfOperatingPotential.measurements.filter((row: any) => row.appliedKvp || row.averageKvp);
    if (validRows.length > 0) {
      const toleranceSignRaw = testData.accuracyOfOperatingPotential.tolerance?.sign || "+/-";
      const toleranceSign = toleranceSignRaw === "both" ? "+/-" : toleranceSignRaw === "plus" ? "+" : toleranceSignRaw === "minus" ? "-" : toleranceSignRaw;
      const toleranceValue = testData.accuracyOfOperatingPotential.tolerance?.value || "5";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
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
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp)", testRows);
    }
  }

  // 1. Accuracy of Irradiation Time (Timer Test) - Following Dental Cone Beam CT pattern
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
          } else if (toleranceOperator === "=") {
            isPass = Math.abs(errorVal - tol) < 0.01;
          }
        }

        return {
          specified: row.setTime || "-",
          measured: row.measuredTime || "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time", testRows);
    }
  }



  // 2. Linearity of mAs Loading
  if (testData.linearityOfMasLLoading?.measurements && Array.isArray(testData.linearityOfMasLLoading.measurements)) {
    const validRows = testData.linearityOfMasLLoading.measurements.filter((row: any) => row.mAsRange || row.col);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLLoading.tolerance || "0.1";
      const testRows = validRows.map((row: any) => {
        const col = row.col ? parseFloat(row.col).toFixed(3) : "-";
        const isPass = row.remarks === "Pass" || row.remarks === "PASS" || (row.col ? parseFloat(row.col) <= parseFloat(tolerance) : false);
        return {
          specified: row.mAsRange || "-",
          measured: col,
          tolerance: `<= ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", testRows);
    }
  }

  // 3. Linearity of mA Loading Stations
  if (testData.maLoadingStations?.table2 && Array.isArray(testData.maLoadingStations.table2)) {
    const validRows = testData.maLoadingStations.table2.filter((row: any) => row.mAsApplied || row.x);
    if (validRows.length > 0) {
      const tolerance = testData.maLoadingStations.tolerance || "0.1";
      const testRows = validRows.map((row: any) => {
        const x = row.x ? parseFloat(row.x).toFixed(4) : "-";
        const isPass = row.remarks === "Pass" || row.remarks === "PASS" || (row.col ? parseFloat(row.col) <= parseFloat(tolerance) : false);
        return {
          specified: row.mAsApplied || "-",
          measured: x,
          tolerance: `<= ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Linearity of mA Loading Stations (Coefficient of Linearity)", testRows);
    }
  }

  // 4. Total Filtration & Aluminium Equivalence
  if (testData.totalFiltrationAndAluminium?.table && Array.isArray(testData.totalFiltrationAndAluminium.table)) {
    const validRows = testData.totalFiltrationAndAluminium.table.filter((row: any) => row.kvp || row.hvt);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const hvt = row.hvt ? parseFloat(row.hvt).toFixed(2) : "-";
        const kvp = row.kvp || "-";
        // Check against tolerance - typically >= 0.3 mm Al at 30 kVp
        const isPass = row.hvt ? parseFloat(row.hvt) >= 0.3 : false;
        return {
          specified: kvp !== "-" ? `${kvp} kVp` : "-",
          measured: hvt !== "-" ? `${hvt} mm Al` : "-",
          tolerance: ">= 0.3 mm Al",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Total Filtration & Aluminium Equivalence (HVT)", testRows);
    }
  }

  // 5. Reproducibility of Radiation Output
  if (testData.reproducibilityOfOutput?.outputRows && Array.isArray(testData.reproducibilityOfOutput.outputRows)) {
    const validRows = testData.reproducibilityOfOutput.outputRows.filter((row: any) => row.kv || row.avg || row.remark);
    if (validRows.length > 0) {
      const ro = testData.reproducibilityOfOutput as any;
      const toleranceOperator =
        (typeof ro.tolerance === "object" && ro.tolerance?.operator) || ro.toleranceOperator || "<=";
      const rawTol =
        typeof ro.tolerance === "object" && ro.tolerance?.value != null
          ? String(ro.tolerance.value)
          : ro.tolerance != null && ro.tolerance !== ""
            ? String(ro.tolerance)
            : "0.05";
      const tDec = parseFloat(rawTol);
      const toleranceValue =
        !isNaN(tDec) && tDec > 1 ? String(tDec) : !isNaN(tDec) && tDec <= 1 ? String(tDec * 100) : "5.0";
      const testRows = validRows.map((row: any) => {
        // Extract CV from field or from remark as fallback
        let cvValue = "-";
        let isPass = false;

        // Try 'cov' or 'cv' fields first (new schema)
        const rawCv = row.cov || row.cv || row.CV;
        if (rawCv !== undefined && rawCv !== null && rawCv !== "") {
          const cvNum = parseFloat(String(rawCv));
          if (!isNaN(cvNum)) {
            // If it's a small decimal (e.g., 0.0123), convert to percentage
            if (cvNum > 0 && cvNum < 1) {
              cvValue = (cvNum * 100).toFixed(2);
            } else {
              cvValue = cvNum.toFixed(2);
            }
          }
        }

        // Fallback to extraction from remark
        if (cvValue === "-" && row.remark) {
          const cvMatch = row.remark.match(/CV:\s*([\d.]+)%/i);
          if (cvMatch) {
            cvValue = cvMatch[1];
          }
        }

        // Determine Pass/Fail
        if (row.remark && (row.remark.includes("Pass") || row.remark.includes("PASS"))) {
          isPass = true;
        } else if (row.remark && (row.remark.includes("Fail") || row.remark.includes("FAIL"))) {
          isPass = false;
        } else if (cvValue !== "-") {
          const cv = parseFloat(cvValue);
          const tol = parseFloat(toleranceValue);

          if (toleranceOperator === "<") {
            isPass = cv < tol;
          } else if (toleranceOperator === ">") {
            isPass = cv > tol;
          } else if (toleranceOperator === "<=") {
            isPass = cv <= tol;
          } else if (toleranceOperator === ">=") {
            isPass = cv >= tol;
          } else if (toleranceOperator === "=") {
            isPass = Math.abs(cv - tol) < 0.01;
          }
        }

        return {
          specified: row.kv && row.mas ? `${row.kv} kV, ${row.mas} mAs` : row.kv ? `${row.kv} kV` : "Varies",
          measured: cvValue !== "-" ? cvValue : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Reproducibility of Radiation Output", testRows, true);
    }
  }

  // 5. Radiation Leakage Level
  if (testData.radiationLeakageLevel?.leakageMeasurements && Array.isArray(testData.radiationLeakageLevel.leakageMeasurements)) {
    const validRows = testData.radiationLeakageLevel.leakageMeasurements.filter((location: any) => location.location || location.max);
    if (validRows.length > 0) {
      const rawOp = String(testData.radiationLeakageLevel.toleranceOperator || "<=").toLowerCase();
      const toleranceOperator =
        rawOp === "<=" || rawOp === "≤" || rawOp.includes("less than or equal") ? "<=" :
        rawOp === "<" || rawOp.includes("less than") ? "<" :
        rawOp === ">=" || rawOp === "≥" || rawOp.includes("greater than or equal") ? ">=" :
        rawOp === ">" || rawOp.includes("greater than") ? ">" :
        rawOp === "=" || rawOp.includes("equal") ? "=" : "<=";
      const toleranceValue = parseFloat(String(testData.radiationLeakageLevel.toleranceValue ?? testData.radiationLeakageLevel.toleranceLimit ?? "1"));
      const maValue = parseFloat(String(testData.radiationLeakageLevel.ma || "0"));
      const workloadValue = parseFloat(String(testData.radiationLeakageLevel.workload || "0"));

      const passesByOperator = (value: number, threshold: number) => {
        if (isNaN(value) || isNaN(threshold)) return false;
        if (toleranceOperator === "<") return value < threshold;
        if (toleranceOperator === ">") return value > threshold;
        if (toleranceOperator === ">=") return value >= threshold;
        if (toleranceOperator === "=") return Math.abs(value - threshold) < 1e-6;
        return value <= threshold;
      };

      const testRows = validRows.map((location: any) => {
        const values = [location.left, location.right, location.front, location.back, location.top]
          .map((v: any) => parseFloat(v) || 0)
          .filter((v: number) => v > 0);
        const rowMax = values.length > 0 ? Math.max(...values) : 0;

        // Keep same source as ViewServiceReport: result in mGy in 1 hr.
        let resultMGy = parseFloat(String(location.mgy ?? ""));
        if (isNaN(resultMGy)) {
          const resultMR = parseFloat(String(location.result ?? ""));
          if (!isNaN(resultMR)) {
            resultMGy = resultMR / 114;
          } else if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
            const calculatedMR = (workloadValue * rowMax) / (60 * maValue);
            resultMGy = calculatedMR / 114;
          }
        }

        const isPassFromRemark = location.remark === "Pass" || location.remark === "PASS";
        const isFailFromRemark = location.remark === "Fail" || location.remark === "FAIL";
        const isPass = isPassFromRemark
          ? true
          : isFailFromRemark
            ? false
            : (!isNaN(resultMGy) ? passesByOperator(resultMGy, toleranceValue) : false);

        return {
          specified: location.location || "-",
          measured: !isNaN(resultMGy) ? `${resultMGy.toFixed(4)} mGy (in 1 hr)` : "-",
          tolerance: `${toleranceOperator} ${isNaN(toleranceValue) ? "1" : toleranceValue} mGy (in 1 hr)`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage Level (5 cm from Tube Housing)", testRows);
    }
  }

  // 7. Imaging Performance Evaluation (Phantom)
  if (testData.imagingPhantom?.rows && Array.isArray(testData.imagingPhantom.rows)) {
    const validRows = testData.imagingPhantom.rows.filter((row: any) => row.name || row.visibleCount);
    if (validRows.length > 0) {
      const testRows = validRows.map((row: any) => {
        const visibleCount = row.visibleCount || 0;
        const toleranceValue = row.tolerance?.value || 0;
        const toleranceOperator = row.tolerance?.operator || ">=";
        let isPass = false;

        if (toleranceOperator === ">=") {
          isPass = visibleCount >= toleranceValue;
        } else if (toleranceOperator === ">") {
          isPass = visibleCount > toleranceValue;
        } else if (toleranceOperator === "<=") {
          isPass = visibleCount <= toleranceValue;
        } else if (toleranceOperator === "<") {
          isPass = visibleCount < toleranceValue;
        } else if (toleranceOperator === "=") {
          isPass = visibleCount === toleranceValue;
        }

        return {
          specified: row.name || "-",
          measured: visibleCount.toString(),
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Imaging Performance Evaluation (Phantom)", testRows);
    }
  }

  // 8. Radiation Protection Survey (CT Scan-style: Worker/Public max weekly summary rows)
  if (testData.radiationProtectionSurvey) {
    const survey = testData.radiationProtectionSurvey;
    const locations: any[] = Array.isArray(survey.locations) ? survey.locations : [];
    if (locations.length > 0) {
      const workerLocs = locations.filter((l: any) => l.category === "worker");
      const publicLocs = locations.filter((l: any) => l.category === "public");

      const maxWorkerWeekly = Math.max(...workerLocs.map((l: any) => parseFloat(l.mRPerWeek) || 0), 0);
      const maxPublicWeekly = Math.max(...publicLocs.map((l: any) => parseFloat(l.mRPerWeek) || 0), 0);

      const surveyRows: Array<{ specified: string; measured: string; tolerance: string; remarks: "Pass" | "Fail" }> = [];

      surveyRows.push({
        specified: "For Radiation Worker",
        measured: maxWorkerWeekly > 0 ? `${maxWorkerWeekly.toFixed(3)} mR/week` : "-",
        tolerance: "<= 40 mR/week",
        remarks: (maxWorkerWeekly > 0 ? (maxWorkerWeekly <= 40 ? "Pass" : "Fail") : "Pass") as "Pass" | "Fail",
      });

      surveyRows.push({
        specified: "For Public",
        measured: maxPublicWeekly > 0 ? `${maxPublicWeekly.toFixed(3)} mR/week` : "-",
        tolerance: "<= 2 mR/week",
        remarks: (maxPublicWeekly > 0 ? (maxPublicWeekly <= 2 ? "Pass" : "Fail") : "Pass") as "Pass" | "Fail",
      });

      addRowsForTest("Radiation Protection Survey", surveyRows);
    }
  }

  // 9. Equipment Settings Verification
  if (testData.equipmentSetting) {
    const hasSettings = testData.equipmentSetting.appliedCurrent || testData.equipmentSetting.appliedVoltage || testData.equipmentSetting.exposureTime;
    if (hasSettings) {
      addRowsForTest("Equipment Settings Verification", [{
        specified: "All Settings",
        measured: "Verified",
        tolerance: "As per standard",
        remarks: "Pass" as "Pass" | "Fail",
      }]);
    }
  }

  // 10. Maximum Radiation Levels at Different Locations
  if (testData.maximumRadiationLevel?.readings && Array.isArray(testData.maximumRadiationLevel.readings)) {
    const validRows = testData.maximumRadiationLevel.readings.filter((reading: any) => reading.location || reading.mRPerHr);
    if (validRows.length > 0) {
      const testRows = validRows.map((reading: any) => {
        const mRPerHr = reading.mRPerHr || "-";
        const result = reading.result || "-";
        // Determine limit based on location
        const isWorkerArea = reading.location?.includes("Control Console") || reading.location?.includes("Behind Lead Glass");
        const limit = isWorkerArea ? 2 : 0.2;
        const isPass = result === "Pass" || (mRPerHr !== "-" && parseFloat(mRPerHr) <= limit);
        return {
          specified: reading.location || "-",
          measured: mRPerHr !== "-" ? `${mRPerHr} mR/hr` : "-",
          tolerance: isWorkerArea ? "<= 2 mR/hr" : "<= 0.2 mR/hr",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Maximum Radiation Levels at Different Locations", testRows);
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
        <table
          className="border border-black text-xs print:text-[9px] print:min-w-full"
          style={{ width: '100', textAlign: 'center', borderCollapse: 'collapse', borderWidth: 1, borderStyle: 'solid', borderColor: '#000' }}
        >
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black px-3 py-3 print:px-2 print:py-1.5 w-12 text-center align-middle font-bold print:text-[9px]">Sr. No.</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-72 print:text-[9px]">Parameters Used</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32 print:text-[9px]">Specified Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-32 print:text-[9px]">Measured Values</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold w-40 print:text-[9px]">Tolerance</th>
              <th className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-bold bg-green-100 w-24 print:text-[9px]">Remarks</th>
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
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 print:px-2 print:py-1.5 text-center align-middle font-normal bg-transparent print:bg-transparent print:text-[9px] print:leading-tight">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center align-middle font-normal leading-tight print:leading-tight bg-transparent print:bg-transparent print:text-[9px]">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center align-middle font-normal">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center align-middle font-normal"
                    >
                      {row.measured}
                    </td>
                  )}
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

export default MainTestTableForMammography;

