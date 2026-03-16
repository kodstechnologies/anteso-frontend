// src/components/reports/TestTables/FixedRadioFluro/MainTestTableForFixedRadioFluro.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForFixedRadioFluro: React.FC<MainTestTableProps> = ({ testData }) => {
  const rows: any[] = [];
  let srNo = 1;

  // Safety check
  if (!testData || typeof testData !== 'object') {
    return <div className="text-center text-gray-500 py-10">No test data provided.</div>;
  }

  // Helper function to check if object is empty or null
  const isEmpty = (obj: any) => {
    if (obj === null || obj === undefined) return true;
    if (typeof obj !== 'object') return false;
    return Object.keys(obj).length === 0;
  };

  // Compute CoV from outputs array (when backend doesn't return cv)
  const computeCovFromOutputs = (outputs: any[]): number | null => {
    if (!Array.isArray(outputs) || outputs.length === 0) return null;
    const values = outputs.map((o: any) => parseFloat(o?.value ?? o)).filter((v: number) => !isNaN(v) && v > 0);
    if (values.length === 0) return null;
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return avg > 0 ? stdDev / avg : null;
  };

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

  // ——— Order matches GenerateServiceReport: Congruence, Central Beam, Effective Focal Spot, then rest ———

  // 1. Congruence of Radiation & Light Field
  if (testData.congruenceOfRadiation && !isEmpty(testData.congruenceOfRadiation)) {
    const cm = testData.congruenceOfRadiation.congruenceMeasurements;
    if (Array.isArray(cm) && cm.length > 0) {
      const testRows = cm.map((m: any) => {
        const percentFED = m.percentFED != null ? parseFloat(m.percentFED) : null;
        const tolVal = m.tolerance != null ? parseFloat(m.tolerance) : 2;
        const isPass = percentFED != null ? percentFED <= tolVal : (m.remark === "Pass" || m.remark === "PASS");
        return {
          specified: m.dimension || "—",
          measured: percentFED != null ? `${percentFED}%` : (m.observedShift != null ? `${m.observedShift} cm` : "-"),
          tolerance: m.tolerance != null ? `≤ ${m.tolerance}%` : "≤ 2%",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Congruence of Radiation & Light Field", testRows);
    } else {
      const maxMisalignment = testData.congruenceOfRadiation.maxMisalignment ?? testData.congruenceOfRadiation.misalignment ?? testData.congruenceOfRadiation.value;
      if (maxMisalignment != null && maxMisalignment !== "") {
        const misalignment = parseFloat(maxMisalignment);
        if (!isNaN(misalignment)) {
          const limit = 2;
          addRowsForTest("Congruence of Radiation & Light Field", [{
            specified: "Max Misalignment",
            measured: `${misalignment} cm`,
            tolerance: `≤ ${limit} cm`,
            remarks: (misalignment <= limit ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
        }
      }
    }
  }

  // 2. Central Beam Alignment Test
  if (testData.centralBeamAlignment && !isEmpty(testData.centralBeamAlignment)) {
    const ot = testData.centralBeamAlignment.observedTilt;
    if (ot && (ot.value != null || ot.remark)) {
      const val = ot.value != null ? parseFloat(ot.value) : null;
      const tol = testData.centralBeamAlignment.tolerance;
      const tolVal = tol?.value != null ? parseFloat(tol.value) : 1;
      const isPass = ot.remark === "Pass" || ot.remark === "PASS" || (val != null && val <= tolVal);
      addRowsForTest("Central Beam Alignment Test", [{
        specified: "Observed tilt",
        measured: val != null ? `${val}°` : (ot.remark || "-"),
        tolerance: tol?.value != null ? `${tol.operator || "≤"} ${tol.value}°` : "≤ 1°",
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    } else {
      const deviation = testData.centralBeamAlignment.deviation ?? testData.centralBeamAlignment.value;
      const sid = testData.centralBeamAlignment.sid || 100;
      if (deviation != null && deviation !== "") {
        const dev = parseFloat(deviation);
        if (!isNaN(dev)) {
          const limit = 0.01 * sid;
          addRowsForTest("Central Beam Alignment Test", [{
            specified: "Deviation",
            measured: `${dev} mm`,
            tolerance: `≤ 1% of SID (${sid} mm)`,
            remarks: (dev <= limit ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
        }
      }
    }
  }

  // 3. Effective Focal Spot Size
  if (testData.effectiveFocalSpot && !isEmpty(testData.effectiveFocalSpot)) {
    if (testData.effectiveFocalSpot.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
      const testRows = testData.effectiveFocalSpot.focalSpots.map((spot: any) => ({
        specified: `${spot.statedWidth || "-"} x ${spot.statedHeight || "-"} mm`,
        measured: `${spot.measuredWidth || "-"} x ${spot.measuredHeight || "-"} mm`,
        tolerance: "Per AERB limits",
        remarks: "Pass" as "Pass" | "Fail",
      }));
      addRowsForTest("Effective Focal Spot Size", testRows);
    } else {
      const nominal = testData.effectiveFocalSpot.nominalFocalSpotSize || "-";
      const measured = testData.effectiveFocalSpot.measuredFocalSpotSize || "-";
      const tolerance = testData.effectiveFocalSpot.tolerance || "-";
      const isPass = testData.effectiveFocalSpot.isPass;
      addRowsForTest("Effective Focal Spot Size", [{
        specified: nominal !== "-" ? `${nominal} mm` : "-",
        measured: measured !== "-" ? `${measured} mm` : "-",
        tolerance: tolerance,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 4. Accuracy of Irradiation Time (Timer Test)
  if (testData.accuracyOfIrradiationTime && !isEmpty(testData.accuracyOfIrradiationTime)) {
    if (testData.accuracyOfIrradiationTime.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
      const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
      if (validRows.length > 0) {
        const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
        const toleranceValue = testData.accuracyOfIrradiationTime.tolerance?.value || "5";
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
    } else if (testData.accuracyOfIrradiationTime.maxDeviation != null) {
      // Fallback: if maxDeviation is available
      const maxDeviation = parseFloat(testData.accuracyOfIrradiationTime.maxDeviation);
      if (!isNaN(maxDeviation)) {
        const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
        const toleranceValue = parseFloat(testData.accuracyOfIrradiationTime.tolerance?.value || "5");
        let isPass = false;
        if (toleranceOperator === "<=") {
          isPass = Math.abs(maxDeviation) <= toleranceValue;
        } else if (toleranceOperator === ">=") {
          isPass = Math.abs(maxDeviation) >= toleranceValue;
        } else if (toleranceOperator === "=") {
          isPass = Math.abs(Math.abs(maxDeviation) - toleranceValue) < 0.01;
        }
        addRowsForTest("Accuracy of Irradiation Time", [{
          specified: "Maximum Deviation",
          measured: `${maxDeviation.toFixed(1)}%`,
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }

  // 2. Accuracy of Operating Potential (kVp)
  if (testData.accuracyOfOperatingPotential && !isEmpty(testData.accuracyOfOperatingPotential) && testData.accuracyOfOperatingPotential.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKvp || row.setKVp || row.setKV || row.measuredKvp || row.measuredKVp || row.avgKvp);
    if (validRows.length > 0) {
      const toleranceValue = "10"; // ±10% as per ViewServiceReport
      const testRows = validRows.map((row: any) => {
        const setKvp = parseFloat(row.setKvp || row.setKVp || row.setKV || "0");
        const measuredKvp = parseFloat(row.measuredKvp || row.measuredKVp || row.avgKvp || "0");
        const deviation = row.deviation != null ? Math.abs(row.deviation) : (setKvp > 0 ? Math.abs(((measuredKvp - setKvp) / setKvp) * 100) : 0);
        const isPass = deviation <= 10;
        return {
          specified: setKvp > 0 ? setKvp.toString() : "-",
          measured: measuredKvp > 0 ? measuredKvp.toString() : "-",
          tolerance: "±10%",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp)", testRows);
    }
  }

  // Output Consistency (COV) — use cv/avg (FixedRadioFluro API); compute cov from outputs if missing
  if (testData.outputConsistency) {
    const tolVal = testData.outputConsistency.tolerance?.value ?? testData.outputConsistency.tolerance;
    const tolerance = typeof tolVal === "object" ? parseFloat(tolVal?.value ?? "0.05") : parseFloat(tolVal || "0.05");
    const toleranceNum = tolerance > 1 ? tolerance / 100 : tolerance;
    const ffdStr = testData.outputConsistency.ffd?.value ?? testData.outputConsistency.ffd;
    if (testData.outputConsistency.outputRows && Array.isArray(testData.outputConsistency.outputRows) && testData.outputConsistency.outputRows.length > 0) {
      const validRows = testData.outputConsistency.outputRows.filter((row: any) => row.cv != null || row.cov != null || row.avg != null || row.mean != null || (row.outputs && row.outputs.length > 0));
      if (validRows.length > 0) {
        const testRows = validRows.map((row: any) => {
          let covValue: number | null = row.cv != null ? parseFloat(row.cv) : (row.cov != null ? parseFloat(row.cov) : null);
          if (covValue === null && Array.isArray(row.outputs)) covValue = computeCovFromOutputs(row.outputs);
          const cov = covValue != null ? covValue.toFixed(3) : "-";
          const isPass = row.remark === "Pass" || row.remark === "PASS" || (covValue != null && covValue <= toleranceNum);
          const specified = row.kv ? `${row.kv} kV` : (row.ffd ? `${row.ffd} cm FFD` : (ffdStr ? `${ffdStr} cm FFD` : "Varies"));
          return {
            specified,
            measured: cov,
            tolerance: `≤ ${tolerance > 1 ? tolerance / 100 : tolerance}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Consistency of Radiation Output (COV)", testRows, true);
      }
    } else if (testData.outputConsistency.cov != null && testData.outputConsistency.cov !== "") {
      const cov = parseFloat(testData.outputConsistency.cov);
      if (!isNaN(cov)) {
        const isPass = cov <= toleranceNum;
        addRowsForTest("Consistency of Radiation Output (COV)", [{
          specified: ffdStr ? `${ffdStr} cm FFD` : "Varies with kVp",
          measured: cov.toFixed(3),
          tolerance: `≤ ${toleranceNum}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
    }
  }


  // 5. Total Filtration (support nested totalFiltration.totalFiltration)
  if (testData.totalFiltration && !isEmpty(testData.totalFiltration)) {
    const nested = testData.totalFiltration.totalFiltration;
    const measuredTF = nested?.measured ?? testData.totalFiltration.measured ?? testData.totalFiltration.measuredTF ?? "-";
    const appliedKV = nested?.atKvp ?? testData.totalFiltration.atKvp ?? testData.totalFiltration.appliedKV ?? "-";
    const measured = parseFloat(measuredTF);
    const isPass = !isNaN(measured) ? measured >= 2.5 : true;
    addRowsForTest("Total Filtration", [{
      specified: appliedKV !== "-" ? `${appliedKV} kV` : "-",
      measured: measuredTF !== "-" ? `${measuredTF} mm Al` : "-",
      tolerance: "≥ 2.5 mm Al (>70 kVp)",
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 7. Low Contrast Resolution
  if (testData.lowContrastResolution && !isEmpty(testData.lowContrastResolution) && testData.lowContrastResolution.smallestHoleSize != null && testData.lowContrastResolution.smallestHoleSize !== "") {
    const smallestHoleSize = parseFloat(testData.lowContrastResolution.smallestHoleSize);
    if (!isNaN(smallestHoleSize)) {
      const recommendedStandard = parseFloat(testData.lowContrastResolution.recommendedStandard || "4");
      const isPass = smallestHoleSize <= recommendedStandard;
      addRowsForTest("Low Contrast Resolution", [{
        specified: "Smallest Visible Hole",
        measured: `${smallestHoleSize} mm`,
        tolerance: `≤ ${recommendedStandard} mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 8. High Contrast Resolution
  if (testData.highContrastResolution && !isEmpty(testData.highContrastResolution) && testData.highContrastResolution.measuredLpPerMm != null && testData.highContrastResolution.measuredLpPerMm !== "") {
    const lpmm = parseFloat(testData.highContrastResolution.measuredLpPerMm);
    if (!isNaN(lpmm)) {
      const recommendedStandard = parseFloat(testData.highContrastResolution.recommendedStandard || "1.0");
      const isPass = lpmm >= recommendedStandard;
      addRowsForTest("High Contrast Resolution", [{
        specified: "Line Pairs per mm",
        measured: `${lpmm} lp/mm`,
        tolerance: `≥ ${recommendedStandard} lp/mm`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }]);
    }
  }

  // 9. Exposure Rate at Table Top
  if (testData.exposureRate && !isEmpty(testData.exposureRate)) {
    if (testData.exposureRate.rows && Array.isArray(testData.exposureRate.rows) && testData.exposureRate.rows.length > 0) {
      const testRows = testData.exposureRate.rows.map((row: any) => {
        const exposure = parseFloat(row.exposure || "0");
        const isAec = row.remark?.toLowerCase().includes("aec") || false;
        const tolerance = isAec ? (testData.exposureRate.aecTolerance || "10") : (testData.exposureRate.nonAecTolerance || "5");
        const isPass = exposure <= parseFloat(tolerance);
        return {
          specified: `${row.appliedKv || "-"} kV / ${row.appliedMa || "-"} mA`,
          measured: `${row.exposure || "-"} cGy/min`,
          tolerance: `≤ ${tolerance} cGy/min`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
    } else {
      const measuredValue = testData.exposureRate.measuredValue || testData.exposureRate.measured || testData.exposureRate.value;
      if (measuredValue != null && measuredValue !== "") {
        const value = parseFloat(measuredValue);
        if (!isNaN(value)) {
          const limit = 5; // mGy/min
          const isPass = value <= limit;
          addRowsForTest("Exposure Rate at Table Top", [{
            specified: "Measured Value",
            measured: `${value} mGy/min`,
            tolerance: `≤ ${limit} mGy/min`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
        }
      }
    }
  }

  // 10. Tube Housing Leakage
  if (testData.tubeHousingLeakage && !isEmpty(testData.tubeHousingLeakage)) {
    if (testData.tubeHousingLeakage.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements) && testData.tubeHousingLeakage.leakageMeasurements.length > 0) {
      const testRows = testData.tubeHousingLeakage.leakageMeasurements.map((measure: any) => {
        const rate = parseFloat(measure.max || measure.mgy || "0");
        const isPass = rate <= 1;
        return {
          specified: measure.location || "Tube Housing",
          measured: `${measure.max || measure.mgy || "-"} mGy/hr`,
          tolerance: "≤ 1 mGy/hr",
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage from Tube Housing", testRows);
    } else {
      const leakageRate = testData.tubeHousingLeakage.leakageRate || testData.tubeHousingLeakage.leakage || testData.tubeHousingLeakage.max || testData.tubeHousingLeakage.value;
      if (leakageRate != null && leakageRate !== "") {
        const rate = parseFloat(leakageRate);
        if (!isNaN(rate)) {
          const limit = 1; // mGy/hr at 1m
          const isPass = rate <= limit;
          addRowsForTest("Radiation Leakage from Tube Housing", [{
            specified: "At 1m distance",
            measured: `${rate} mGy/hr`,
            tolerance: `≤ ${limit} mGy/hr`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
        }
      }
    }
  }

  // 11. Linearity of mAs Loading
  if (testData.linearityOfmAsLoading && !isEmpty(testData.linearityOfmAsLoading)) {
    // Check for table2 array first
    if (testData.linearityOfmAsLoading.table2 && Array.isArray(testData.linearityOfmAsLoading.table2) && testData.linearityOfmAsLoading.table2.length > 0) {
      const validRows = testData.linearityOfmAsLoading.table2.filter((row: any) => row.col != null || row.x != null || row.mAs || row.mAsApplied);
      if (validRows.length > 0) {
        const tolerance = 0.1;
        const testRows = validRows.map((row: any) => {
          const col = row.col != null ? parseFloat(row.col) : (row.x != null ? parseFloat(row.x) : null);
          const isPass = col != null ? col <= tolerance : false;
          const mAs = row.mAs || row.mAsApplied || "-";
          const measured = col != null ? col.toFixed(3) : (Array.isArray(row.measuredOutputs) ? row.measuredOutputs.join(", ") : "-");
          return {
            specified: mAs !== "-" ? `${mAs} mAs` : "Coefficient of Linearity",
            measured: measured,
            tolerance: `≤ ${tolerance}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", testRows);
      }
    } else {
      // Check for col property with various possible names
      const col = testData.linearityOfmAsLoading.col || testData.linearityOfmAsLoading.coefficient || testData.linearityOfmAsLoading.value;
      if (col != null && col !== "") {
        const colValue = parseFloat(col);
        if (!isNaN(colValue)) {
          const tolerance = 0.1;
          const isPass = colValue <= tolerance;
          addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", [{
            specified: "Coefficient of Linearity",
            measured: colValue.toFixed(3),
            tolerance: `≤ ${tolerance}`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          }]);
        }
      }
    }
  }

  // 13. Radiation Protection Survey
  if (testData.radiationProtectionSurvey && !isEmpty(testData.radiationProtectionSurvey)) {
    const surveyRows = testData.radiationProtectionSurvey.surveyRows || testData.radiationProtectionSurvey.locations;
    if (surveyRows && surveyRows.length > 0) {
      const testRows = surveyRows.map((row: any) => ({
        specified: `Limit: ${row.limit || "20"} µGy/hr`,
        measured: `${row.exposureRate || row.mRPerHr || "-"} µGy/hr`,
        tolerance: "Complies with AERB limits",
        remarks: ((row.remarks || row.result) === "Pass" || (row.remarks || row.result) === "PASS" ? "Pass" : "Fail") as "Pass" | "Fail",
      }));
      addRowsForTest("Radiation Protection Survey", testRows);
    } else if (testData.radiationProtectionSurvey.result || testData.radiationProtectionSurvey.remarks) {
      addRowsForTest("Radiation Protection Survey", [{
        specified: "AERB Limits",
        measured: testData.radiationProtectionSurvey.result || testData.radiationProtectionSurvey.remarks,
        tolerance: "Complies",
        remarks: "Pass" as "Pass" | "Fail",
      }]);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>No test results available.</p>
        <p className="text-xs mt-2">Debug: testData keys: {Object.keys(testData).join(", ")}</p>
        <p className="text-xs mt-2">
          accuracyOfOperatingPotential: {testData.accuracyOfOperatingPotential ? "exists" : "null"}
        </p>
        <p className="text-xs mt-2">
          outputConsistency: {testData.outputConsistency ? "exists" : "null"}
        </p>
        <p className="text-xs mt-2">
          lowContrastResolution: {testData.lowContrastResolution ? "exists" : "null"}
        </p>
      </div>
    );
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

export default MainTestTableForFixedRadioFluro;
