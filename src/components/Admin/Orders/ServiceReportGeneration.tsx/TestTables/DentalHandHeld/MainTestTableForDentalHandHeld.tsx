// src/components/reports/TestTables/DentalHandHeld/MainTestTableForDentalHandHeld.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  /** When true, summary label matches RadiographyFixed mA timer variant. */
  hasTimer?: boolean;
}

const MainTestTableForDentalHandHeld: React.FC<MainTestTableProps> = ({ testData, hasTimer = false }) => {
  const rows: any[] = [];
  let srNo = 1;

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
      remarks: "Pass" | "Fail" | "-";
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

  /** Dental HandHeld API: times often live on `rows[]` with measured value in `maStations[0].time`. */
  const irrRowSetTime = (row: any) =>
    row?.setTime ?? row?.set_time ?? "";
  const irrRowMeasuredTime = (row: any) =>
    row?.measuredTime ??
    row?.measured_time ??
    row?.maStations?.[0]?.time ??
    row?.mAStations?.[0]?.time ??
    "";

  const normalizeToleranceOperator = (op: string | undefined): "<=" | "<" | ">=" | ">" => {
    const o = String(op ?? "<=").trim();
    if (o === "â‰¤" || o === "<=") return "<=";
    if (o === "â‰¥" || o === ">=") return ">=";
    if (o === "<") return "<";
    if (o === ">") return ">";
    return "<=";
  };

  // Accuracy of Irradiation Time — same summary shape as RadiographyFixed (per-row remarks, tolerance text)
  const irrBlocks = testData.accuracyOfIrradiationTime;
  const irrList =
    irrBlocks?.irradiationTimes ??
    irrBlocks?.table2 ??
    irrBlocks?.rows ??
    [];
  if (Array.isArray(irrList) && irrList.length > 0) {
    const validRows = irrList.filter(
      (row: any) => String(irrRowSetTime(row)).trim() !== "" || String(irrRowMeasuredTime(row)).trim() !== ""
    );
    if (validRows.length > 0) {
      const toleranceOperator =
        irrBlocks?.tolerance?.operator ??
        normalizeToleranceOperator(irrBlocks?.timeToleranceSign) ??
        "<=";
      const toleranceValue =
        irrBlocks?.tolerance?.value ?? irrBlocks?.timeToleranceValue ?? "5";

      const testRows = validRows.map((row: any) => {
        const setTime = parseFloat(String(irrRowSetTime(row)));
        const measuredTime = parseFloat(String(irrRowMeasuredTime(row)));
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          const errorVal = Math.abs(((measuredTime - setTime) / setTime) * 100);
          const tol = parseFloat(String(toleranceValue));
          if (!isNaN(tol)) {
            if (toleranceOperator === "<=") isPass = errorVal <= tol;
            else if (toleranceOperator === ">=") isPass = errorVal >= tol;
            else if (toleranceOperator === "=") isPass = Math.abs(errorVal - tol) < 0.01;
            else if (toleranceOperator === "<") isPass = errorVal < tol;
            else if (toleranceOperator === ">") isPass = errorVal > tol;
          }
        }

        return {
          specified: irrRowSetTime(row) !== "" ? String(irrRowSetTime(row)) : "-",
          measured: irrRowMeasuredTime(row) !== "" ? String(irrRowMeasuredTime(row)) : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time(sec)", testRows);
    }
  }



  // 1. Accuracy of Operating Potential (kVp)
  // Payload: { measurements: [{ appliedKvp, averageKvp, remarks }], tolerance: { value } }
  if (testData.accuracyOfOperatingPotential?.measurements && Array.isArray(testData.accuracyOfOperatingPotential.measurements)) {
    const validRows = testData.accuracyOfOperatingPotential.measurements.filter((row: any) => row.appliedKvp || row.averageKvp);
    if (validRows.length > 0) {
      const toleranceValue = testData.accuracyOfOperatingPotential.tolerance?.value || "2.0";
      const toleranceType = testData.accuracyOfOperatingPotential.tolerance?.type || "Â±";

      const kvpRows = validRows.map((row: any) => ({
        specified: row.appliedKvp || "-",
        measured: row.averageKvp || "-",
        tolerance: `${toleranceType}${toleranceValue} kVp`,
        remarks: (row.remarks === "PASS" ? "Pass" : row.remarks === "FAIL" ? "Fail" : "-") as any,
      }));
      addRowsForTest("Accuracy of Operating Potential (kVp)", kvpRows);
    }
  }

  // Total Filtration — RadiographyFixed: measurements -> "Accuracy of Operating Potential"; result -> "Total Filtration"
  if (testData.totalFilteration?.measurements && Array.isArray(testData.totalFilteration.measurements)) {
    const validRows = testData.totalFilteration.measurements.filter(
      (row: any) => row.appliedKvp || row.averageKvp || row.measuredValues
    );
    if (validRows.length > 0) {
      const toleranceSign = testData.totalFilteration.tolerance?.sign || "\u00B1";
      const toleranceValue = testData.totalFilteration.tolerance?.value || "2.0";
      const tfMeasRows = validRows.map((row: any) => {
        let avgKvpNum: number | null = null;
        if (row.averageKvp !== undefined && row.averageKvp !== null && row.averageKvp !== "") {
          const val = parseFloat(row.averageKvp);
          if (!isNaN(val)) avgKvpNum = val;
        }
        if (avgKvpNum === null && Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          const vals = row.measuredValues.map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v));
          if (vals.length > 0) avgKvpNum = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        }
        let measuredDisplay: string;
        if (avgKvpNum !== null) {
          measuredDisplay = avgKvpNum.toFixed(2);
        } else if (Array.isArray(row.measuredValues) && row.measuredValues.length > 0) {
          measuredDisplay =
            row.measuredValues.filter((v: any) => v !== undefined && v !== null && v !== "").join(", ") || "-";
        } else {
          measuredDisplay = "-";
        }

        let isPass = false;
        if (row.remarks === "PASS" || row.remarks === "Pass") isPass = true;
        else if (row.remarks === "FAIL" || row.remarks === "Fail") isPass = false;
        else if (avgKvpNum !== null) {
          const appliedKvp = parseFloat(row.appliedKvp);
          if (!isNaN(appliedKvp) && appliedKvp > 0) {
            const deviation = Math.abs(((avgKvpNum - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            if (!isNaN(tol)) isPass = deviation <= tol;
          }
        }

        return {
          specified: row.appliedKvp || "-",
          measured: measuredDisplay,
          tolerance: `${toleranceSign} ${toleranceValue} kVp`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Operating Potential", tfMeasRows);
    }
  }

  {
    const tfInner = testData.totalFilteration?.totalFiltration;
    if (tfInner && typeof tfInner === "object") {
      const measuredStr =
        tfInner.required ??
        tfInner.measured1 ??
        tfInner.measured ??
        tfInner.measuredValue ??
        tfInner.measuredHvl ??
        "";
      const atKvpRaw =
        tfInner.atKvp ?? tfInner.kvp ?? tfInner.kV ?? tfInner.appliedKvp ?? "";
      const atKvp = atKvpRaw !== "" && atKvpRaw != null ? String(atKvpRaw) : "-";
      const measuredDisplay = measuredStr !== "" && measuredStr != null ? String(measuredStr) : "-";

      if (atKvp !== "-" || measuredDisplay !== "-") {
        const kvp = parseFloat(String(atKvpRaw));
        const measuredVal = parseFloat(String(measuredStr));

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
          specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
          measured: measuredDisplay !== "-" ? `${measuredDisplay} mm Al` : "-",
          tolerance: toleranceStr,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        }]);
      }
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
        tolerance: `â‰¤ ${tolerance}`,
        remarks: (isPass ? "Pass" : remarks ? "Fail" : "-") as any,
      }];
      addRowsForTest("Linearity of Time (Coefficient of Linearity)", testRows);
    }
  }

  const linearityToleranceValue = (tol: any, fallback: string) => {
    if (tol == null || tol === "") return fallback;
    if (typeof tol === "object" && tol !== null && "value" in tol && (tol as { value?: unknown }).value != null) {
      return String((tol as { value: unknown }).value);
    }
    return String(tol);
  };
  const linearityToleranceOperator = (tol: any, explicit: string | undefined, fallback: string) => {
    if (explicit) return explicit;
    if (tol && typeof tol === "object" && "operator" in tol && (tol as { operator?: string }).operator) {
      return String((tol as { operator: string }).operator);
    }
    return fallback;
  };

  const addLinearityOfMaLoadingSummary = (lob: any, validRows: any[], label: string) => {
    if (!lob || validRows.length === 0) return;
    const tolerance = linearityToleranceValue(lob.tolerance, "0.1");
    const toleranceOperator = linearityToleranceOperator(lob.tolerance, lob.toleranceOperator, "<=");

    const getVal = (o: any): number => {
      if (o == null) return NaN;
      if (typeof o === "number") return o;
      if (typeof o === "string") return parseFloat(o);
      if (typeof o === "object" && "value" in o) return parseFloat(String((o as { value?: unknown }).value ?? ""));
      return NaN;
    };

    let colValue = lob.col || lob.coefficient || lob.colValue;
    const parsedStoredCol = parseFloat(String(colValue));
    if (!colValue || isNaN(parsedStoredCol)) {
      const xValues: number[] = [];
      validRows.forEach((row: any) => {
        const outputs = (row.measuredOutputs ?? [])
          .map(getVal)
          .filter((v: number) => !isNaN(v) && v > 0);
        const avg =
          outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

        const loadLabel = String(row.ma ?? row.mAsApplied ?? row.mAsRange ?? "");
        const match = loadLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
        const midLoad = match
          ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
          : parseFloat(loadLabel) || 0;

        if (avg !== null && midLoad > 0) {
          const xVal = avg / midLoad;
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

    let isPass = lob.remarks === "Pass" || lob.remarks === "PASS";
    if (!isPass && col !== "-") {
      const c = parseFloat(col);
      const t = parseFloat(String(tolerance));
      if (toleranceOperator === "<=") isPass = c <= t;
      else if (toleranceOperator === "<") isPass = c < t;
      else if (toleranceOperator === ">=") isPass = c >= t;
      else if (toleranceOperator === ">") isPass = c > t;
    }

    const tableLevelKv =
      lob?.kv ??
      lob?.kV ??
      lob?.setKv ??
      lob?.setKV ??
      (Array.isArray(lob?.table1) ? lob?.table1?.[0]?.kv : lob?.table1?.kv);

    const firstRow = validRows[0] || {};
    const kvValue = asDisplayNumber(
      firstRow.kv ?? firstRow.kV ?? firstRow.setKV ?? firstRow.setKv ?? tableLevelKv
    );
    addRowsForTest(label, [
      {
        specified: kvValue ? `at ${kvValue} kV` : "-",
        measured: col !== "-" ? `CoL = ${col}` : "-",
        tolerance: `${toleranceOperator} ${tolerance}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  };

  // Linearity of mA Loading — RadiographyFixed (dedicated linearityOfmALoading + ma rows)
  let addedMaLinearityFromMaLoading = false;
  if (testData.linearityOfmALoading?.table2 && Array.isArray(testData.linearityOfmALoading.table2)) {
    const lob = testData.linearityOfmALoading;
    const validRows = lob.table2.filter((row: any) => row.ma);
    if (validRows.length > 0) {
      addLinearityOfMaLoadingSummary(lob, validRows, "Linearity of mA Loading (Coefficient of Linearity)");
      addedMaLinearityFromMaLoading = true;
    }
  }

  // RadiographyFixed (hasTimer): mA linearity is read from linearityOfMasLoading rows with mAsApplied only
  if (
    hasTimer &&
    !addedMaLinearityFromMaLoading &&
    testData.linearityOfMasLoading?.table2 &&
    Array.isArray(testData.linearityOfMasLoading.table2)
  ) {
    const masLob = testData.linearityOfMasLoading;
    const maRows = masLob.table2.filter((row: any) => row.mAsApplied);
    if (maRows.length > 0) {
      addLinearityOfMaLoadingSummary(masLob, maRows, "Linearity of mA Loading (Coefficient of Linearity)");
      addedMaLinearityFromMaLoading = true;
    }
  }

  // Linearity of mA/mAs loading — RadiographyFixed (single block: mAsApplied only; label from hasTimer)
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const linearityLabel = hasTimer
      ? "Linearity of mA Loading (Coefficient of Linearity)"
      : "Linearity of mAs Loading (Coefficient of Linearity)";

    const lob = testData.linearityOfMasLoading;
    const validRows = lob.table2.filter((row: any) => row.mAsApplied);
    if (validRows.length > 0 && !(hasTimer && addedMaLinearityFromMaLoading)) {
      const tolerance = linearityToleranceValue(lob.tolerance, "0.1");
      const toleranceOperator = linearityToleranceOperator(lob.tolerance, lob.toleranceOperator, "<=");

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat((o as { value?: unknown }).value as string);
        return NaN;
      };

      let colValue = lob.col || lob.coefficient || lob.colValue;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg =
            outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const mAsLabel = String(row.mAsApplied ?? row.mAsRange ?? "");
          const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          const midMas = match
            ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
            : parseFloat(mAsLabel) || 0;

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

      let isPass = lob.remarks === "Pass" || lob.remarks === "PASS";
      if (!isPass && col !== "-") {
        const c = parseFloat(col);
        const t = parseFloat(String(tolerance));
        if (toleranceOperator === "<=") isPass = c <= t;
        else if (toleranceOperator === "<") isPass = c < t;
        else if (toleranceOperator === ">=") isPass = c >= t;
        else if (toleranceOperator === ">") isPass = c > t;
      }

      const tableLevelKv =
        lob?.kv ??
        lob?.kV ??
        lob?.setKv ??
        lob?.setKV ??
        (Array.isArray(lob?.table1) ? lob?.table1?.[0]?.kv : lob?.table1?.kv);

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

  // Consistency of Radiation Output (CoV) — RadiographyFixed (tolerance row-span)
  const outBlock = testData.outputConsistency || testData.consistencyOfRadiationOutput;
  if (outBlock?.outputRows && Array.isArray(outBlock.outputRows)) {
    const validRows = outBlock.outputRows.filter(
      (row: any) =>
        row.kv || row.cv || row.cov || (row.outputs && row.outputs.length > 0) || row.remark || row.remarks
    );

    if (validRows.length > 0) {
      const toleranceOperator = outBlock.tolerance?.operator || "<=";
      const toleranceValue = outBlock.tolerance?.value || "0.05";

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(String((o as { value?: unknown }).value ?? ""));
        return NaN;
      };

      const tableLevelKv =
        outBlock?.kv ?? outBlock?.kV ?? outBlock?.setKV ?? outBlock?.setKv;
      const tableLevelMa =
        outBlock?.mA ??
        outBlock?.ma ??
        outBlock?.mas ??
        outBlock?.tubeCurrent ??
        outBlock?.setMA ??
        outBlock?.setMa;

      const testRows = validRows.map((row: any) => {
        const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
        const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

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

        const kvValue = asDisplayNumber(
          row.kv ?? row.kV ?? row.kvp ?? row.setKV ?? row.setKv ?? tableLevelKv
        );
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
          kvValue && maValue
            ? `at ${kvValue} kV ${maValue} mA`
            : kvValue
              ? `at ${kvValue} kV`
              : "Varies";

        return {
          specified: specifiedDisplay,
          measured: formattedCv !== "-" ? "CoV = " + formattedCv : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Consistency of Radiation Output (CoV)", testRows, true);
    }
  }

  // Radiation leakage level — RadiographyFixed (per location; supports tubeHousingLeakage payload)
  const leakageBlock = testData.radiationLeakageLevel || testData.tubeHousingLeakage;
  if (leakageBlock?.leakageMeasurements && Array.isArray(leakageBlock.leakageMeasurements)) {
    const validRows = leakageBlock.leakageMeasurements.filter(
      (row: any) =>
        row.location &&
        (row.max ||
          row.result ||
          row.resultMR ||
          row.resultMGy ||
          row.front ||
          row.back ||
          row.left ||
          row.right ||
          row.top ||
          row.up ||
          row.down)
    );
    if (validRows.length > 0) {
      const toleranceValue = leakageBlock.toleranceValue || leakageBlock.tolerance?.value || "1";
      const toleranceUnit = leakageBlock.leakageMeasurements[0]?.unit || "mGy in one hour";

      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;

        if (row.result) {
          const resultValue = parseFloat(row.result);
          if (!isNaN(resultValue)) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(resultValue / 114).toFixed(4)} mGy in one hour`;
              isPass = resultValue / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${resultValue.toFixed(4)} ${toleranceUnit}`;
              isPass = resultValue < parseFloat(toleranceValue);
            }
          }
        } else if (row.resultMGy != null && row.resultMGy !== "") {
          const g = parseFloat(String(row.resultMGy));
          if (!isNaN(g)) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(g / 114).toFixed(4)} mGy in one hour`;
              isPass = g / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${g.toFixed(4)} ${toleranceUnit}`;
              isPass = g < parseFloat(toleranceValue);
            }
          }
        } else if (row.max) {
          const maxValue = parseFloat(row.max);
          if (!isNaN(maxValue) && maxValue > 0) {
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(maxValue / 114).toFixed(4)} mGy in one hour`;
              isPass = maxValue / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${maxValue.toFixed(2)} ${toleranceUnit}`;
              isPass = maxValue < parseFloat(toleranceValue);
            }
          }
        } else {
          const values = [row.front, row.back, row.left, row.right, row.top, row.up, row.down]
            .map((v: any) => parseFloat(v) || 0)
            .filter((v: number) => v > 0);
          if (values.length > 0) {
            const max = Math.max(...values);
            if (toleranceUnit === "mGy/h") {
              measuredValue = `${(max / 114).toFixed(4)} mGy in one hour`;
              isPass = max / 114 < parseFloat(toleranceValue);
            } else {
              measuredValue = `${max.toFixed(2)} ${toleranceUnit}`;
              isPass = max < parseFloat(toleranceValue);
            }
          }
        }

        if (row.remark || row.remarks || leakageBlock.remark) {
          const remark = row.remark || row.remarks || leakageBlock.remark;
          if (remark === "PASS" || remark === "Pass") isPass = true;
          else if (remark === "FAIL" || remark === "Fail") isPass = false;
        }

        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: `≤ ${toleranceValue} ${toleranceUnit}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }

  // Radiation Protection Survey — RadiographyFixed (one row per location)
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter(
      (loc: any) => loc.location || loc.mRPerWeek
    );
    if (validRows.length > 0) {
      const testRows = validRows.map((loc: any) => {
        const mRPerWeek = loc.mRPerWeek || "-";
        const limit = loc.category === "worker" ? 40 : 2;
        const isPass =
          loc.result === "PASS" || (mRPerWeek !== "-" && parseFloat(mRPerWeek) <= limit);
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

              const shouldRenderMeasured =
                (!row.hasMeasuredRowSpan && row.measuredRowSpan === 0) ||
                (row.hasMeasuredRowSpan && row.isFirstRow);

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
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 print:px-2 print:py-1 text-center font-semibold bg-transparent"
                    >
                      {row.measured}
                    </td>
                  )}
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

