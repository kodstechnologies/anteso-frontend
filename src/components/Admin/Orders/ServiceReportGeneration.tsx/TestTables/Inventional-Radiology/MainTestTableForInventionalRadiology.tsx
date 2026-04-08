// src/components/reports/TestTables/InventionalRadiology/MainTestTableForInventionalRadiology.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
}

const MainTestTableForInventionalRadiology: React.FC<MainTestTableProps> = ({ testData }) => {
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

  // 1. Central Beam Alignment Test
  if (testData.centralBeamAlignment) {
    const observed = testData.centralBeamAlignment.observedTilt?.value || "-";
    const tolerance = testData.centralBeamAlignment.tolerance?.value || "1.5";
    const remark = testData.centralBeamAlignment.observedTilt?.remark || "-";
    addRowsForTest("Central Beam Alignment Test", [{
      specified: `Tolerance: < ${tolerance}°`,
      measured: observed !== "-" ? `${observed}°` : "-",
      tolerance: `< ${tolerance}°`,
      remarks: (remark === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 2. Effective Focal Spot Size
  if (testData.effectiveFocalSpot?.focalSpots && Array.isArray(testData.effectiveFocalSpot.focalSpots)) {
    const validRows = testData.effectiveFocalSpot.focalSpots.filter((spot: any) => spot.focusType || spot.measuredWidth || spot.measuredNominal);
    if (validRows.length > 0) {
      // Format values to always show one decimal place (e.g., 1.0, 2.0)
      const formatValue = (val: any) => {
        if (val === undefined || val === null || val === "") return null;
        const numVal = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(numVal)) return null;
        return numVal.toFixed(1);
      };

      const toleranceCriteria = testData.effectiveFocalSpot.toleranceCriteria || {};

      // Format tolerance criteria as: +0.5 F FOR F < 0.8 MM, +0.4 F FOR 0.8 ≤ F ≤ 1.5 MM, +0.3 F FOR F > 1.5 MM
      const smallMultiplier = parseFloat(toleranceCriteria.small?.multiplier || "0.5");
      const smallLimit = parseFloat(toleranceCriteria.small?.upperLimit || "0.8");
      const mediumMultiplier = parseFloat(toleranceCriteria.medium?.multiplier || "0.4");
      const mediumLower = parseFloat(toleranceCriteria.medium?.lowerLimit || "0.8");
      const mediumUpper = parseFloat(toleranceCriteria.medium?.upperLimit || "1.5");
      const largeMultiplier = parseFloat(toleranceCriteria.large?.multiplier || "0.3");

      const toleranceStr = `+${smallMultiplier} F FOR F < ${smallLimit} MM; +${mediumMultiplier} F FOR ${mediumLower} ≤ F ≤ ${mediumUpper} MM; +${largeMultiplier} F FOR F > ${mediumUpper} MM`;

      const testRows = validRows.map((spot: any) => {
        const isPass = spot.remark === "Pass" || spot.remark === "PASS";

        const statedWidth = formatValue(spot.statedWidth);
        const statedHeight = formatValue(spot.statedHeight);
        const measuredWidth = formatValue(spot.measuredWidth);
        const measuredHeight = formatValue(spot.measuredHeight);

        let specifiedStr = "-";
        if (statedWidth !== null && statedHeight !== null) {
          specifiedStr = `${statedWidth} × ${statedHeight} mm`;
        } else if (spot.statedNominal != null) {
          specifiedStr = `${formatValue(spot.statedNominal)} mm`;
        }

        let measuredStr = "-";
        if (measuredWidth !== null && measuredHeight !== null) {
          measuredStr = `${measuredWidth} × ${measuredHeight} mm`;
        } else if (spot.measuredNominal != null) {
          measuredStr = `${formatValue(spot.measuredNominal)} mm`;
        }

        return {
          specified: specifiedStr,
          measured: measuredStr,
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Effective Focal Spot Size", testRows, true); // Use toleranceRowSpan since all rows share the same tolerance
    }
  }

  // 6. Accuracy of Irradiation Time
  if (testData.accuracyOfIrradiationTime?.irradiationTimes && Array.isArray(testData.accuracyOfIrradiationTime.irradiationTimes)) {
    const validRows = testData.accuracyOfIrradiationTime.irradiationTimes.filter((row: any) => row.setTime || row.measuredTime);
    if (validRows.length > 0) {
      const toleranceOperator = testData.accuracyOfIrradiationTime.tolerance?.operator || "<=";
      const toleranceValue = testData.accuracyOfIrradiationTime.tolerance?.value || "5";
      const testRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const measuredTime = parseFloat(row.measuredTime);
        let errorStr = "-";
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          const error = Math.abs((measuredTime - setTime) / setTime * 100).toFixed(2);
          errorStr = `${error}%`;
          const errorVal = parseFloat(error);
          const tol = parseFloat(toleranceValue);

          if (toleranceOperator === "<=") isPass = errorVal <= tol;
          else if (toleranceOperator === ">=") isPass = errorVal >= tol;
          else if (toleranceOperator === "<") isPass = errorVal < tol;
          else if (toleranceOperator === ">") isPass = errorVal > tol;
        }

        return {
          specified: row.setTime ? `${row.setTime} ms` : "-",
          measured: row.measuredTime ? `${row.measuredTime} ms (Error: ${errorStr})` : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time", testRows);
    }
  }

  // 5. Accuracy of Operating Potential (Total Filtration) — from measurements array
  if (testData.totalFilteration?.measurements && Array.isArray(testData.totalFilteration.measurements)) {
    const validRows = testData.totalFilteration.measurements.filter((row: any) => row.appliedKvp || row.averageKvp || row.measuredValues);
    if (validRows.length > 0) {
      const toleranceSign = testData.totalFilteration.tolerance?.sign || "±";
      const toleranceValue = testData.totalFilteration.tolerance?.value || "2.0";
      const testRows = validRows.map((row: any) => {
        let avgKvpNum: number | null = null;
        if (row.averageKvp !== undefined && row.averageKvp !== null && row.averageKvp !== "") {
          const val = parseFloat(row.averageKvp);
          if (!isNaN(val)) avgKvpNum = val;
        }
        if (avgKvpNum === null && Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          const vals = row.measuredValues
            .map((v: any) => parseFloat(v))
            .filter((v: number) => !isNaN(v));
          if (vals.length > 0) {
            avgKvpNum = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
          }
        }
        let measuredDisplay: string;
        if (avgKvpNum !== null) {
          measuredDisplay = avgKvpNum.toFixed(2);
        } else if (Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          measuredDisplay = row.measuredValues.filter((v: any) => v !== undefined && v !== null && v !== "").join(", ") || "-";
        } else {
          measuredDisplay = "-";
        }

        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else if (avgKvpNum !== null) {
          const appliedKvp = parseFloat(row.appliedKvp);
          if (!isNaN(appliedKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvpNum - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            if (!isNaN(tol)) {
              isPass = deviation <= tol;
            }
          }
        }

        return {
          specified: row.appliedKvp || "-",
          measured: measuredDisplay,
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential", testRows);
    }
  }

  // 7. Total Filtration result — same field mapping and kVp-band tolerance as Radiography Fixed
  if (testData.totalFilteration?.totalFiltration) {
    const tf = testData.totalFilteration.totalFiltration;
    const measuredStr = (tf.required ?? tf.measured ?? "-").toString();
    const atKvp = tf.atKvp || "-";

    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(measuredStr);

    const ft = testData.totalFilteration.filtrationTolerance || {
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
      if (kvp < threshold1) {
        requiredTolerance = parseFloat(ft.forKvGreaterThan70);
      } else if (kvp >= threshold1 && kvp <= threshold2) {
        requiredTolerance = parseFloat(ft.forKvBetween70And100);
      } else {
        requiredTolerance = parseFloat(ft.forKvGreaterThan100);
      }

      if (!isNaN(requiredTolerance)) {
        isPass = measuredVal >= requiredTolerance;
      }
    }

    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";

    addRowsForTest("Total Filtration", [{
      specified: measuredStr !== "-" ? `${measuredStr} mm Al` : "-",
      measured: atKvp !== "-" ? `${atKvp} kVp` : "-",
      tolerance: toleranceStr,
      remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
    }]);
  }

  // 3. Linearity of mA/mAs Loading (Coefficient of Linearity)
  const maLinearity = testData.measurementOfMaLinearity || testData.MeasurementOfMaLinearityInventionalRadiology;
  const maLinearityRows = maLinearity?.table2 || maLinearity?.Table2;
  if (Array.isArray(maLinearityRows)) {
    const validRows = maLinearityRows.filter((row: any) => row?.mAsApplied || row?.mAsRange);
    if (validRows.length > 0) {
      const t1First = (maLinearity?.table1 || maLinearity?.Table1 || [])[0];
      const hasMas = t1First?.time && String(t1First.time).trim() !== "" && String(t1First.time).trim() !== "-";
      const linearityLabel = hasMas ? "Linearity of mAs Loading (Coefficient of Linearity)" : "Linearity of mA Loading (Coefficient of Linearity)";
      const tolerance = maLinearity?.tolerance ?? maLinearity?.Tolerance ?? "0.1";
      const toleranceOperator = maLinearity?.toleranceOperator ?? maLinearity?.ToleranceOperator ?? "<=";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(o.value);
        return NaN;
      };

      // Prefer stored CoL, otherwise compute from Xmax/Xmin derived across rows
      let colValue = maLinearity?.col || maLinearity?.coefficient || maLinearity?.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? "");
          const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          const midMas = match ? (parseFloat(match[1]) + parseFloat(match[2])) / 2 : parseFloat(mAsLabel) || 0;

          if (avg !== null && midMas > 0) {
            const xVal = avg / midMas;
            if (isFinite(xVal)) xValues.push(xVal);
          }
        });

        if (xValues.length > 0) {
          const xMax = Math.max(...xValues);
          const xMin = Math.min(...xValues);
          if (xMax + xMin > 0) {
            colValue = Math.abs(xMax - xMin) / (xMax + xMin);
          }
        }
      }

      const colRaw = parseFloat(String(colValue));
      const col = !isNaN(colRaw) && isFinite(colRaw) ? colRaw.toFixed(3) : "-";

      let isPass = maLinearity?.remarks === "Pass" || maLinearity?.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(String(tolerance));
        if (toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const testRows = validRows.map((row: any) => ({
        specified: row.mAsApplied || row.mAsRange ? `${row.mAsApplied || row.mAsRange} mAs` : "-",
        measured: col !== "-" ? `CoL = ${col}` : "-",
        tolerance: `${toleranceOperator} ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      }));

      // Shared CoL + tolerance across mAs rows (same as RF summary behavior)
      addRowsForTest(linearityLabel, testRows, true, true);
    }
  }



  // 4. Accuracy of Operating Potential (kVp Accuracy) — aligned with Radiography Fixed
  if (testData.accuracyOfOperatingPotential?.table2 && Array.isArray(testData.accuracyOfOperatingPotential.table2)) {
    const validRows = testData.accuracyOfOperatingPotential.table2.filter((row: any) => row.setKV || row.avgKvp);
    if (validRows.length > 0) {
      const toleranceSign = testData.accuracyOfOperatingPotential.toleranceSign || "±";
      const toleranceValue = testData.accuracyOfOperatingPotential.toleranceValue || "2.0";
      const testRows = validRows.map((row: any) => {
        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") {
          isPass = true;
        } else if (row.remarks === "FAIL" || row.remarks === "Fail") {
          isPass = false;
        } else {
          const appliedKvp = parseFloat(row.setKV);
          const avgKvp = parseFloat(row.avgKvp);
          if (!isNaN(appliedKvp) && !isNaN(avgKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }
        }
        return {
          specified: row.setKV || "-",
          measured: row.avgKvp || "-",
          tolerance: `${toleranceSign}${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
    }
  }

 // 8. Consistency of Radiation Output
  if (testData.consistencyOfRadiationOutput?.outputRows && Array.isArray(testData.consistencyOfRadiationOutput.outputRows)) {
    const testRows = testData.consistencyOfRadiationOutput.outputRows.filter((row: any) => row.kvp).map((row: any) => ({
      specified: `${row.kvp} kV, ${row.mas} mAs`,
      measured: `COV: ${row.cov || "-"}`,
      tolerance: "COV ≤ 0.05",
      remarks: (row.remarks === "Pass" ? "Pass" : "Fail") as "Pass" | "Fail",
    }));
    addRowsForTest("Consistency of Radiation Output", testRows);
  }

  



 

 

  // 10. Low Contrast Resolution
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

  // 11. High Contrast Resolution
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

 // 9. Exposure Rate at Table Top
  if (testData.exposureRateTableTop?.rows && Array.isArray(testData.exposureRateTableTop.rows)) {
    const validRows = testData.exposureRateTableTop.rows.filter((row: any) => row.distance || row.exposure);
    if (validRows.length > 0) {
      const aecTolerance = parseFloat(String(testData.exposureRateTableTop.aecTolerance ?? "10"));
      const manualTolerance = parseFloat(String(testData.exposureRateTableTop.nonAecTolerance ?? "5"));
      const getMode = (row: any) => String(row.mode || row.remark || row.remarks || "").trim();
      const getToleranceByMode = (mode: string) => {
        if (/aec/i.test(mode)) return !isNaN(aecTolerance) ? `≤ ${aecTolerance} mGy/min` : "≤ 10 mGy/min";
        if (/manual/i.test(mode)) return !isNaN(manualTolerance) ? `≤ ${manualTolerance} mGy/min` : "≤ 5 mGy/min";
        return "As per selected mode";
      };

      const testRows = validRows.map((row: any) => {
        const mode = getMode(row);
        const exposure = parseFloat(String(row.exposure ?? ""));
        const hasResult = row.result === "PASS" || row.result === "Pass" || row.result === "FAIL" || row.result === "Fail";
        let isPass = row.result === "PASS" || row.result === "Pass";
        if (!hasResult && !isNaN(exposure)) {
          if (/aec/i.test(mode) && !isNaN(aecTolerance)) isPass = exposure <= aecTolerance;
          else if (/manual/i.test(mode) && !isNaN(manualTolerance)) isPass = exposure <= manualTolerance;
        }

        return {
          specified: row.distance ? `${row.distance} cm${mode ? ` (${mode})` : ""}` : (mode || "-"),
          measured: row.exposure ? `${row.exposure} mGy/min` : "-",
          tolerance: getToleranceByMode(mode),
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Exposure Rate at Table Top", testRows);
    }
  }

  // 12. Tube Housing Leakage
  if (testData.tubeHousingLeakage?.leakageMeasurements && Array.isArray(testData.tubeHousingLeakage.leakageMeasurements)) {
    const validRows = testData.tubeHousingLeakage.leakageMeasurements.filter((row: any) => row.location);
    if (validRows.length > 0) {
      const toleranceValue = testData.tubeHousingLeakage.toleranceValue || "1.0";
      const testRows = validRows.map((row: any) => {
        const values = [row.front, row.back, row.left, row.right, row.top].map(v => parseFloat(v || "0")).filter(v => !isNaN(v));
        const max = values.length > 0 ? Math.max(...values).toString() : "-";
        const isPass = max !== "-" && parseFloat(max) < parseFloat(toleranceValue);
        return {
          specified: row.location || "-",
          measured: max !== "-" ? `${max} mGy/h` : "-",
          tolerance: `≤ ${toleranceValue} mGy/h`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Tube Housing Leakage", testRows);
    }
  }

  // 13. Radiation Protection Survey Report
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validLocations = testData.radiationProtectionSurvey.locations.filter((l: any) => l.mRPerHr);
    if (validLocations.length > 0) {
      const testRows = validLocations.map((loc: any) => ({
        specified: loc.category === "worker" ? "Worker Area" : "Public Area",
        measured: `${loc.mRPerHr || "0"} mR/hr (${loc.mRPerWeek || "0"} mR/wk)`,
        tolerance: loc.category === "worker" ? "≤ 40 mR/wk" : "≤ 2 mR/wk",
        remarks: (loc.result === "PASS" ? "Pass" : "Fail") as "Pass" | "Fail",
      }));
      addRowsForTest("Radiation Protection Survey Report", testRows);
    }
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">No test results available.</div>;
  }

  return (
    <div className="mt-4 print:mt-2">
      <h2 className="text-xl font-bold text-center underline mb-4 print:mb-2 print:text-sm">
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

              const shouldRenderMeasured =
                (!row.hasMeasuredRowSpan && row.measuredRowSpan === 0) ||
                (row.hasMeasuredRowSpan && row.isFirstRow);

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
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1.5 text-center font-semibold bg-transparent print:bg-transparent print:text-[9px] print:leading-tight"
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

export default MainTestTableForInventionalRadiology;

