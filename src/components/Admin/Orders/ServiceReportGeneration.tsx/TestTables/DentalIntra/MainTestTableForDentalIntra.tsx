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

  // 1. Accuracy of Irradiation Time — same pattern as RadiographyFixed (irradiationTimes + tolerance.operator/value)
  const irradStandalone = testData.accuracyOfIrradiationTime;
  const mapIrradRow = (r: any) => ({
    setTime: r.setTime,
    measuredTime: r.measuredTime ?? r.maStations?.[0]?.time ?? r.avgTime ?? "",
    remark: r.remark ?? r.remarks,
  });
  const hasIrradFields = (r: any) => !!(r.setTime || r.measuredTime || r.avgTime || r.maStations?.[0]?.time);

  let irradTimes: any[] = [];
  if (Array.isArray(irradStandalone?.irradiationTimes) && irradStandalone!.irradiationTimes.length > 0) {
    irradTimes = irradStandalone!.irradiationTimes;
  } else if (Array.isArray(irradStandalone?.rows)) {
    const mapped = irradStandalone!.rows.map(mapIrradRow).filter(hasIrradFields);
    if (mapped.length > 0) irradTimes = mapped;
  }
  if (
    irradTimes.length === 0 &&
    Array.isArray(testData.accuracyOfOperatingPotentialAndTime?.rows)
  ) {
    irradTimes = testData.accuracyOfOperatingPotentialAndTime.rows
      .filter(hasIrradFields)
      .map(mapIrradRow);
  }

  if (Array.isArray(irradTimes) && irradTimes.length > 0) {
    const tolSource = irradStandalone || testData.accuracyOfOperatingPotentialAndTime || {};
    const toleranceOperator =
      tolSource.tolerance?.operator || tolSource.timeToleranceSign || "<=";
    const toleranceValue =
      tolSource.tolerance?.value ?? tolSource.timeToleranceValue ?? "10";

    const validRows = irradTimes.filter(
      (row: any) => row.setTime || row.measuredTime || row.maStations?.[0]?.time
    );
    if (validRows.length > 0) {
      const timeRows = validRows.map((row: any) => {
        const setTime = parseFloat(row.setTime);
        const measuredStr =
          row.measuredTime != null && row.measuredTime !== ""
            ? String(row.measuredTime)
            : row.maStations?.[0]?.time ?? "-";
        const measuredTime = parseFloat(measuredStr);
        let error = "-";
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          error = Math.abs(((measuredTime - setTime) / setTime) * 100).toFixed(2);
          const errorVal = parseFloat(error);
          const tol = parseFloat(String(toleranceValue));

          if (toleranceOperator === "<=") isPass = errorVal <= tol;
          else if (toleranceOperator === ">=") isPass = errorVal >= tol;
          else if (toleranceOperator === "=") isPass = Math.abs(errorVal - tol) < 0.01;
          else if (toleranceOperator === "<") isPass = errorVal < tol;
          else if (toleranceOperator === ">") isPass = errorVal > tol;
        }

        const rmk = row.remark ?? row.remarks;
        if (rmk === "PASS" || rmk === "Pass") isPass = true;
        else if (rmk === "FAIL" || rmk === "Fail") isPass = false;

        return {
          specified: row.setTime || "-",
          measured: measuredStr === "-" ? "-" : measuredStr,
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time(sec)", timeRows);
    }
  }


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

    }
  }

 
  // Total Filtration — same summary shape as RadiographyFixed (specified = kVp, measured = mm Al, band tolerance string)
  if (
    testData.accuracyOfOperatingPotentialAndTime?.totalFiltration &&
    (testData.accuracyOfOperatingPotentialAndTime.totalFiltration.measured1 != null ||
      testData.accuracyOfOperatingPotentialAndTime.totalFiltration.measured != null)
  ) {
    const tf = testData.accuracyOfOperatingPotentialAndTime.totalFiltration;
    const ft = testData.accuracyOfOperatingPotentialAndTime.filtrationTolerance || {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
    };
    const measuredStr = String(tf.measured1 ?? tf.measured ?? "-");
    const atKvp = tf.atKvp ?? "-";
    const kvp = parseFloat(atKvp);
    const measuredVal = parseFloat(measuredStr);

    const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
    const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");

    let isPass = false;
    if (!isNaN(kvp) && !isNaN(measuredVal)) {
      let requiredTolerance: number;
      if (kvp < threshold1) requiredTolerance = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
      else if (kvp >= threshold1 && kvp <= threshold2) requiredTolerance = parseFloat(ft.forKvBetween70And100 ?? "2.0");
      else requiredTolerance = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
      if (!isNaN(requiredTolerance)) isPass = measuredVal >= requiredTolerance;
    }

    const toleranceStr = "1.5 mm Al for kV ≤ 70; 2.0 mm Al for 70 ≤ kV ≤ 100; 2.5 mm Al for kV > 100";

    addRowsForTest("Total Filtration", [
      {
        specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
        measured:
          measuredStr !== "-" && !Number.isNaN(parseFloat(measuredStr)) ? `${measuredStr} mm Al` : "-",
        tolerance: toleranceStr,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  // Linearity of Time (separate test — not mAs loading)
  if (testData.linearityOfTime?.table2 && Array.isArray(testData.linearityOfTime.table2)) {
    const validRows = testData.linearityOfTime.table2.filter((row: any) => row.time);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfTime.tolerance || "0.1";
      const toleranceOperator = testData.linearityOfTime.toleranceOperator || "<=";
      const col =
        testData.linearityOfTime.col != null && testData.linearityOfTime.col !== ""
          ? String(parseFloat(String(testData.linearityOfTime.col)).toFixed(3))
          : "-";
      const remarks = testData.linearityOfTime.remarks || "";
      let isPass =
        remarks === "Pass" ||
        remarks === "PASS" ||
        (col !== "-" ? parseFloat(col) <= parseFloat(tolerance) : false);
      if (remarks === "FAIL" || remarks === "Fail") isPass = false;
      const specifiedTimes = validRows.map((r: any) => r.time).filter(Boolean).join(", ");
      const testRows = [
        {
          specified: specifiedTimes || "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ];
      addRowsForTest("Linearity of Time (Coefficient of Linearity)", testRows);
    }
  }

  // Linearity of mAs loading (Coefficient of Linearity) — RadiographyFixed pattern (table2 + CoL + kV in specified)
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const linearityLabel = "Linearity of mAs loading (Coefficient of Linearity)";
    const validRows = testData.linearityOfMasLoading.table2.filter((row: any) => row.mAsApplied || row.mAsRange || row.ma);
    if (validRows.length > 0) {
      const tolerance = testData.linearityOfMasLoading.tolerance || "0.1";
      const toleranceOperator = testData.linearityOfMasLoading.toleranceOperator || "<=";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat((o as any).value);
        return NaN;
      };

      let colValue =
        testData.linearityOfMasLoading.col ||
        testData.linearityOfMasLoading.coefficient ||
        testData.linearityOfMasLoading.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg =
            outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? row.ma ?? "");
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

      let isPass =
        testData.linearityOfMasLoading.remarks === "Pass" ||
        testData.linearityOfMasLoading.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(tolerance);
        if (toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const tableLevelKv =
        testData.linearityOfMasLoading?.kv ??
        testData.linearityOfMasLoading?.kV ??
        testData.linearityOfMasLoading?.setKv ??
        testData.linearityOfMasLoading?.setKV ??
        (Array.isArray(testData.linearityOfMasLoading?.table1)
          ? testData.linearityOfMasLoading?.table1?.[0]?.kv
          : testData.linearityOfMasLoading?.table1?.kv);

      const firstRow = validRows[0] || {};
      const kvValue = asDisplayNumber(
        firstRow.kv ?? firstRow.kV ?? firstRow.setKV ?? firstRow.setKv ?? tableLevelKv
      );
      const testRows = [
        {
          specified: kvValue ? `at ${kvValue} kV` : "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ];
      addRowsForTest(linearityLabel, testRows);
    }
  }

  // Output Consistency (CoV) — RadiographyFixed pattern (uses outputConsistency shape; Dental Intra stores as reproducibilityOfRadiationOutput)
  const outputConsistency =
    testData.outputConsistency || testData.reproducibilityOfRadiationOutput;
  if (outputConsistency?.outputRows && Array.isArray(outputConsistency.outputRows)) {
    const validRows = outputConsistency.outputRows.filter(
      (row: any) => row.kv || row.cv || (row.outputs && row.outputs.length > 0) || row.remark
    );

    if (validRows.length > 0) {
      const toleranceOperator = outputConsistency.tolerance?.operator || "<=";
      const toleranceValue = outputConsistency.tolerance?.value || "0.05";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat((o as any).value);
        return NaN;
      };

      const tableLevelKv =
        outputConsistency?.kv ??
        outputConsistency?.kV ??
        outputConsistency?.setKV ??
        outputConsistency?.setKv;
      const tableLevelMa =
        outputConsistency?.mA ??
        outputConsistency?.ma ??
        outputConsistency?.mas ??
        outputConsistency?.tubeCurrent ??
        outputConsistency?.setMA ??
        outputConsistency?.setMa;

      const testRows = validRows.map((row: any) => {
        const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
        const avg =
          outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

        let cvValue = row.cv || row.cov;
        if (!cvValue && avg !== null && avg > 0) {
          const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
          const cov = Math.sqrt(variance) / avg;
          if (isFinite(cov)) cvValue = cov;
        }

        const formattedCv =
          cvValue !== undefined && cvValue !== null && cvValue !== "" && cvValue !== "-"
            ? typeof cvValue === "number"
              ? cvValue.toFixed(3)
              : parseFloat(String(cvValue)).toFixed(3)
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

        const kvValue = asDisplayNumber(row.kv ?? row.kV ?? row.setKV ?? row.setKv ?? tableLevelKv);
        const maValue = asDisplayNumber(
          row.mA ??
            row.ma ??
            row.mas ??
            row.tubeCurrent ??
            row.setMA ??
            row.setMa ??
            tableLevelMa
        );
        const specifiedDisplay =
          kvValue && maValue ? `at ${kvValue} kV ${maValue} mA` : kvValue ? `at ${kvValue} kV` : "Varies";

        return {
          specified: specifiedDisplay,
          measured: formattedCv !== "-" ? "CoV = " + formattedCv : "-",
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
          measured: max !== "-" ? `${max} "mGy in one hour"` : "-",
          tolerance: `≤ ${toleranceValue} mGy in one hour`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation Leakage from Tube Housing", testRows);
    }
  }

  // Radiation Leakage Level — RadiographyFixed summary; Dental Intra rows use left/right/top/up/down (see RadiationLeakageLevel.tsx)
  if (testData.radiationLeakageLevel?.leakageMeasurements && Array.isArray(testData.radiationLeakageLevel.leakageMeasurements)) {
    const hasDirectionalReadings = (row: any) =>
      !!(
        row.max ||
        row.result ||
        row.front ||
        row.back ||
        row.left ||
        row.right ||
        row.top ||
        row.up ||
        row.down
      );
    const validRows = testData.radiationLeakageLevel.leakageMeasurements.filter(
      (row: any) => (row.location || hasDirectionalReadings(row)) && hasDirectionalReadings(row)
    );
    if (validRows.length > 0) {
      const toleranceValue = testData.radiationLeakageLevel.toleranceValue || "1";
      // Row exposure readings are often in mGy/h; summary tolerance line always uses mGy in one hour (RadiographyFixed-style).
      const rowExposureUnit =
        testData.radiationLeakageLevel.leakageMeasurements[0]?.unit || "mGy/h";
      const toleranceDisplayUnit = "mGy in one hour";

      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;

        if (row.result) {
          const resultValue = parseFloat(row.result);
          if (!isNaN(resultValue)) {
            if (rowExposureUnit === "mGy/h") {
              measuredValue = `${(resultValue / 114).toFixed(4)} mGy in one hour`;
              isPass = resultValue / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${resultValue.toFixed(4)} ${rowExposureUnit}`;
              isPass = resultValue < parseFloat(toleranceValue);
            }
          }
        } else if (row.max) {
          const maxValue = parseFloat(row.max);
          if (!isNaN(maxValue) && maxValue > 0) {
            if (rowExposureUnit === "mGy/h") {
              measuredValue = `${(maxValue / 114).toFixed(4)} mGy in one hour`;
              isPass = maxValue / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${maxValue.toFixed(2)} ${rowExposureUnit}`;
              isPass = maxValue < parseFloat(toleranceValue);
            }
          }
        } else {
          const values = [row.front, row.back, row.left, row.right, row.top, row.up, row.down]
            .map((v: any) => parseFloat(v) || 0)
            .filter((v: number) => v > 0);
          if (values.length > 0) {
            const max = Math.max(...values);
            if (rowExposureUnit === "mGy/h") {
              measuredValue = `${(max / 114).toFixed(4)} mGy in one hour`;
              isPass = max / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${max.toFixed(2)} ${rowExposureUnit}`;
              isPass = max < parseFloat(toleranceValue);
            }
          }
        }

        if (row.remark || testData.radiationLeakageLevel.remark) {
          const remark = row.remark || testData.radiationLeakageLevel.remark;
          if (remark === "PASS" || remark === "Pass") isPass = true;
          else if (remark === "FAIL" || remark === "Fail") isPass = false;
        }

        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: `≤ ${toleranceValue} ${toleranceDisplayUnit}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }

  // Radiation Protection Survey — RadiographyFixed summary rows
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.location || loc.mRPerWeek);
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const mRPerWeek = loc.mRPerWeek || "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const isPass =
          loc.result === "PASS" ||
          loc.result === "Pass" ||
          (mRPerWeek !== "-" && parseFloat(mRPerWeek) <= limit);
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

