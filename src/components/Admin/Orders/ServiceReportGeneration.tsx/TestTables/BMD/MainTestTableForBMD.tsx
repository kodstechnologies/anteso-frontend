// src/components/reports/TestTables/BMD/MainTestTableForBMD.tsx
import React from "react";

interface MainTestTableProps {
  testData: any;
  /** Matches RadiographyFixed: mA vs mAs linearity label when using linearityOfMasLoading. */
  hasTimer?: boolean;
}

const MainTestTableForBMD: React.FC<MainTestTableProps> = ({ testData, hasTimer = false }) => {
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

  const isEmpty = (obj: any): boolean => {
    if (!obj) return true;
    if (typeof obj !== "object") return false;
    return Object.keys(obj).length === 0;
  };

  // --- Accuracy of Irradiation Time (RadiographyFixed shape) ---
  const irrFull = testData.accuracyOfIrradiationTimeFull;
  const irr = testData.accuracyOfIrradiationTime;
  const irrList =
    irrFull?.irradiationTimes ??
    irr?.irradiationTimes ??
    irr?.rows ??
    [];
  if (Array.isArray(irrList) && irrList.length > 0) {
    const validRows = irrList.filter((row: any) => {
      const st = row.setTime ?? row.set_time ?? "";
      const mt = row.measuredTime ?? row.measured_time ?? row.avgTime ?? "";
      return String(st).trim() !== "" || String(mt).trim() !== "";
    });
    if (validRows.length > 0) {
      const toleranceOperator =
        irrFull?.tolerance?.operator ?? irr?.tolerance?.operator ?? "<=";
      const toleranceValue =
        irrFull?.tolerance?.value ?? irr?.tolerance?.value ?? irr?.timeToleranceValue ?? "5";

      const testRows = validRows.map((row: any) => {
        const setTime = parseFloat(String(row.setTime ?? row.set_time ?? ""));
        const measuredTime = parseFloat(
          String(row.measuredTime ?? row.measured_time ?? row.avgTime ?? "")
        );
        let isPass = false;

        if (!isNaN(setTime) && !isNaN(measuredTime) && setTime > 0) {
          const errorVal = Math.abs(((measuredTime - setTime) / setTime) * 100);
          const tol = parseFloat(String(toleranceValue));
          if (toleranceOperator === "<=") isPass = errorVal <= tol;
          else if (toleranceOperator === ">=") isPass = errorVal >= tol;
          else if (toleranceOperator === "=") isPass = Math.abs(errorVal - tol) < 0.01;
          else if (toleranceOperator === "<") isPass = errorVal < tol;
          else if (toleranceOperator === ">") isPass = errorVal > tol;
        }

        return {
          specified: row.setTime != null && row.setTime !== "" ? String(row.setTime) : "-",
          measured:
            row.measuredTime != null && row.measuredTime !== ""
              ? String(row.measuredTime)
              : row.avgTime != null && row.avgTime !== ""
                ? String(row.avgTime)
                : "-",
          tolerance: `${toleranceOperator} ${toleranceValue}%`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Accuracy of Irradiation Time(sec)", testRows);
    }
  }

  // 1. Accuracy of Operating Potential (kVp Accuracy) — BMD payload
  if (testData.accuracyOfOperatingPotential && !isEmpty(testData.accuracyOfOperatingPotential)) {
    const test = testData.accuracyOfOperatingPotential;
    if (test.rows && Array.isArray(test.rows) && test.rows.length > 0) {
      const getAvgKvpDisplay = (row: any): string => {
        const directAvg = row.avgKvp ?? row.averageKvp ?? row.avgKV ?? row.avgkvp;
        if (directAvg !== undefined && directAvg !== null && String(directAvg).trim() !== "") {
          return String(directAvg);
        }
        const rawMeasured = Array.isArray(row.measuredValues) ? row.measuredValues : [];
        const nums = rawMeasured
          .map((v: any) => (typeof v === "object" && v !== null ? v.value ?? v.measured ?? "" : v))
          .map((v: any) => parseFloat(String(v)))
          .filter((n: number) => !isNaN(n));
        if (nums.length === 0) return "";
        const avg = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
        return avg.toFixed(2);
      };

      const validRows = test.rows.filter(
        (row: any) =>
          row.appliedKvp ||
          row.appliedkVp ||
          row.avgKvp ||
          row.averageKvp ||
          (Array.isArray(row.measuredValues) && row.measuredValues.length > 0)
      );
      if (validRows.length > 0) {
        const toleranceSign = test.kvpToleranceSign || test.tolerance?.sign || "\u00B1";
        const toleranceValue = test.kvpToleranceValue || test.tolerance?.value || "5";
        const testRows = validRows.map((row: any) => {
          const avgKvpDisplay = getAvgKvpDisplay(row);
          const appliedKvp = parseFloat(row.appliedKvp || row.appliedkVp) || 0;
          const avgKvp = parseFloat(avgKvpDisplay) || 0;
          let isPass = false;

          if (row.remark === "PASS" || row.remark === "Pass") isPass = true;
          else if (row.remark === "FAIL" || row.remark === "Fail") isPass = false;
          else if (appliedKvp > 0 && avgKvp > 0) {
            const deviation = Math.abs(((avgKvp - appliedKvp) / appliedKvp) * 100);
            const tol = parseFloat(toleranceValue);
            isPass = deviation <= tol;
          }

          return {
            specified: row.appliedKvp || row.appliedkVp || "-",
            measured: avgKvpDisplay || "-",
            tolerance: `${toleranceSign} ${toleranceValue} kVp`,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          };
        });
        addRowsForTest("Accuracy of Operating Potential (kVp Accuracy)", testRows);
      }
    }
  }

  // Total Filtration — RadiographyFixed (BMD uses totalFiltration)
  const tfRoot = testData.totalFiltration;
  if (tfRoot?.measurements && Array.isArray(tfRoot.measurements)) {
    const validRows = tfRoot.measurements.filter(
      (row: any) => row.appliedKvp || row.averageKvp || row.measuredValues
    );
    if (validRows.length > 0) {
      const toleranceSign = tfRoot.tolerance?.sign || "\u00B1";
      const toleranceValue = tfRoot.tolerance?.value || "2.0";
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
      addRowsForTest("Accuracy of Operating Potential", testRows);
    }
  }

  {
    const tfInner = tfRoot?.totalFiltration;
    if (tfInner && typeof tfInner === "object") {
      const measuredStr =
        tfInner.required ??
        tfInner.measured1 ??
        tfInner.measured ??
        tfInner.measuredValue ??
        tfInner.measuredHvl ??
        "";
      const atKvpRaw = tfInner.atKvp ?? tfInner.kvp ?? tfInner.kV ?? tfInner.appliedKvp ?? "";
      const atKvp = atKvpRaw !== "" && atKvpRaw != null ? String(atKvpRaw) : "-";
      const measuredDisplay = measuredStr !== "" && measuredStr != null ? String(measuredStr) : "-";

      if (atKvp !== "-" || measuredDisplay !== "-") {
        const kvp = parseFloat(String(atKvpRaw));
        const measuredVal = parseFloat(String(measuredStr));

        const ft = tfRoot.filtrationTolerance || {
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

        addRowsForTest("Total Filtration", [
          {
            specified: atKvp !== "-" ? `${atKvp} kVp` : "-",
            measured: measuredDisplay !== "-" ? `${measuredDisplay} mm Al` : "-",
            tolerance: toleranceStr,
            remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
          },
        ]);
      }
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

  // Linearity of mAs loading — RadiographyFixed (linearityOfMasLoading.table2 + mAsApplied)
  if (testData.linearityOfMasLoading?.table2 && Array.isArray(testData.linearityOfMasLoading.table2)) {
    const lob = testData.linearityOfMasLoading;
    const linearityLabel = hasTimer
      ? "Linearity of mA Loading (Coefficient of Linearity)"
      : "Linearity of mAs Loading (Coefficient of Linearity)";
    const validRows = lob.table2.filter((row: any) => row.mAsApplied);
    if (validRows.length > 0) {
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
      addRowsForTest(linearityLabel, [
        {
          specified: kvValue ? `at ${kvValue} kV` : "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ]);
    }
  } else if (testData.linearityOfMaLoading && !isEmpty(testData.linearityOfMaLoading)) {
    const lob = testData.linearityOfMaLoading;
    const validRows = (lob.rows || []).filter((row: any) => row.ma || (row.measuredOutputs && row.measuredOutputs.length));
    if (validRows.length > 0) {
      const tolerance = linearityToleranceValue(lob.tolerance, "0.1");
      const toleranceOperator = linearityToleranceOperator(lob.tolerance, undefined, "<=");

      const getVal = (o: any): number => {
        if (o == null) return NaN;
        if (typeof o === "number") return o;
        if (typeof o === "string") return parseFloat(o);
        if (typeof o === "object" && "value" in o) return parseFloat(String((o as { value?: unknown }).value ?? ""));
        return NaN;
      };

      let colValue = lob.col ?? lob.coefficient ?? validRows[0]?.coefficient;
      const parsedStoredCol = parseFloat(String(colValue));
      if (!colValue || isNaN(parsedStoredCol)) {
        const xValues: number[] = [];
        validRows.forEach((row: any) => {
          const outputs = (row.measuredOutputs ?? [])
            .map(getVal)
            .filter((v: number) => !isNaN(v) && v > 0);
          const avg =
            outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;

          const loadLabel = String(row.ma ?? "");
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

      let isPass =
        lob.remarks === "Pass" ||
        lob.remarks === "PASS" ||
        validRows.some((r: any) => r.remark === "Pass" || r.remark === "PASS");
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
        (lob.table1 && typeof lob.table1 === "object" && !Array.isArray(lob.table1)
          ? lob.table1.kv
          : Array.isArray(lob.table1)
            ? lob.table1[0]?.kv
            : undefined);

      const firstRow = validRows[0] || {};
      const kvValue = asDisplayNumber(firstRow.kv ?? firstRow.kV ?? tableLevelKv);

      addRowsForTest("Linearity of mAs Loading (Coefficient of Linearity)", [
        {
          specified: kvValue ? `at ${kvValue} kV` : "-",
          measured: col !== "-" ? `CoL = ${col}` : "-",
          tolerance: `${toleranceOperator} ${tolerance}`,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        },
      ]);
    }
  }

  // Output consistency (CoV) — RadiographyFixed (outputConsistency or BMD reproducibilityOfRadiationOutput)
  const outBlock = testData.outputConsistency || testData.reproducibilityOfRadiationOutput;
  if (outBlock?.outputRows && Array.isArray(outBlock.outputRows)) {
    const validRows = outBlock.outputRows.filter(
      (row: any) =>
        row.kv || row.cv || row.cov || (row.outputs && row.outputs.length > 0) || row.remark
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

      const tableLevelKv = outBlock?.kv ?? outBlock?.kV ?? outBlock?.setKV ?? outBlock?.setKv;
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
  } else if (outBlock && (outBlock.cov != null || outBlock.result)) {
    const tol = outBlock.tolerance || { operator: "<=", value: "0.05" };
    const tolValue = String(tol.value ?? "0.05");
    const tolOp = String(tol.operator ?? "<=");
    const cv = parseFloat(String(outBlock.cov ?? ""));
    let isPass = outBlock.result === "Pass" || outBlock.result === "PASS";
    if (!isPass && !isNaN(cv)) {
      const t = parseFloat(tolValue);
      if (tolOp === "<=") isPass = cv <= t;
      else if (tolOp === "<") isPass = cv < t;
      else if (tolOp === ">=") isPass = cv >= t;
      else if (tolOp === ">") isPass = cv > t;
    }
    const kv = outBlock.kv || "-";
    const ma = outBlock.ma || outBlock.mas || "-";
    const specified =
      kv !== "-" && ma !== "-" ? `at ${kv} kV ${ma} mA` : kv !== "-" ? `at ${kv} kV` : "Varies";
    addRowsForTest("Consistency of Radiation Output (CoV)", [
      {
        specified,
        measured: !isNaN(cv) ? `CoV = ${cv.toFixed(3)}` : "-",
        tolerance: `${tolOp} ${tolValue}`,
        remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
      },
    ]);
  }

  // Radiation leakage — RadiographyFixed (map BMD tubeHousingLeakage.leakageRows → measurements-like)
  const leakageBlock = testData.radiationLeakageLevel || testData.tubeHousingLeakage;
  const rawMeasurements =
    leakageBlock?.leakageMeasurements ||
    (Array.isArray(leakageBlock?.leakageRows)
      ? leakageBlock.leakageRows.map((r: any) => ({
          location: r.location,
          result: r.result,
          max: r.max,
          resultMGy: r.mgy,
          front: r.foot != null && r.foot !== "-" ? parseFloat(String(r.foot)) : undefined,
          back: r.head != null && r.head !== "-" ? parseFloat(String(r.head)) : undefined,
          left: r.left != null && r.left !== "-" ? parseFloat(String(r.left)) : undefined,
          right: r.right != null && r.right !== "-" ? parseFloat(String(r.right)) : undefined,
          top: undefined,
          unit: r.unit,
          remark: r.remark,
        }))
      : null);

  if (rawMeasurements && Array.isArray(rawMeasurements)) {
    const validRows = rawMeasurements.filter(
      (row: any) =>
        row.location &&
        (row.max || row.result || row.front || row.back || row.left || row.right || row.top)
    );
    if (validRows.length > 0) {
      const MGY_IN_ONE_HR = "mGy in one hour";
      const toleranceNum =
        parseFloat(String(leakageBlock.toleranceValue ?? leakageBlock.tolerance?.value ?? "1")) || 1;
      const tolOpRaw = String(
        leakageBlock.toleranceOperator ?? leakageBlock.tolerance?.operator ?? "less than or equal to"
      );
      const tolSymbol =
        tolOpRaw === "less than or equal to" || tolOpRaw === "<="
          ? "≤"
          : tolOpRaw === "greater than or equal to" || tolOpRaw === ">="
            ? "≥"
            : tolOpRaw === "="
              ? "="
              : "≤";
      const toleranceDisplay = `${tolSymbol} ${toleranceNum} ${MGY_IN_ONE_HR}`;

      const maVal =
        parseFloat(String(leakageBlock.ma ?? leakageBlock.settings?.ma ?? "")) || 0;
      const wlVal = parseFloat(String(leakageBlock.workload ?? "")) || 0;

      const leakagePasses = (mGy: number, tol: number, op: string) => {
        if (op === "less than or equal to" || op === "<=") return mGy <= tol;
        if (op === "greater than or equal to" || op === ">=") return mGy >= tol;
        if (op === "=") return Math.abs(mGy - tol) < 0.01;
        return mGy <= tol;
      };

      const mGyFromWorkloadMax = (maxMrPerHr: number) => {
        if (!(maxMrPerHr > 0) || !(maVal > 0) || !(wlVal > 0)) return null;
        const mRInOneHr = (wlVal * maxMrPerHr) / (60 * maVal);
        return mRInOneHr / 114;
      };

      const testRows = validRows.map((row: any) => {
        let measuredValue = "-";
        let isPass = false;
        let mGyHour: number | null = null;

        const mgyRaw = row.resultMGy;
        if (mgyRaw != null && mgyRaw !== "" && mgyRaw !== "-") {
          const g = parseFloat(String(mgyRaw));
          if (!isNaN(g)) mGyHour = g;
        } else if (row.result != null && row.result !== "" && row.result !== "-") {
          const resultMr = parseFloat(String(row.result));
          if (!isNaN(resultMr)) mGyHour = resultMr / 114;
        } else if (row.max != null && row.max !== "" && row.max !== "-") {
          const maxV = parseFloat(String(row.max));
          if (!isNaN(maxV) && maxV > 0) mGyHour = mGyFromWorkloadMax(maxV);
        } else {
          const values = [row.front, row.back, row.left, row.right, row.top]
            .map((v: any) => parseFloat(v) || 0)
            .filter((v: number) => v > 0);
          if (values.length > 0) mGyHour = mGyFromWorkloadMax(Math.max(...values));
        }

        if (mGyHour != null && !isNaN(mGyHour)) {
          measuredValue = `${mGyHour.toFixed(4)} ${MGY_IN_ONE_HR}`;
          isPass = leakagePasses(mGyHour, toleranceNum, tolOpRaw);
        }

        if (row.remark || leakageBlock.remark) {
          const remark = row.remark || leakageBlock.remark;
          if (remark === "PASS" || remark === "Pass") isPass = true;
          else if (remark === "FAIL" || remark === "Fail") isPass = false;
        }

        return {
          specified: row.location || "-",
          measured: measuredValue,
          tolerance: toleranceDisplay,
          remarks: (isPass ? "Pass" : "Fail") as "Pass" | "Fail",
        };
      });
      addRowsForTest("Radiation leakage level at 1m from tube housing", testRows);
    }
  }

  // Radiation Protection Survey — RadiographyFixed
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const validRows = testData.radiationProtectionSurvey.locations.filter(
      (loc: any) => loc.location || loc.mRPerWeek
    );
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
    <div className="mt-4 print:mt-4">
      <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-4">
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
                    <td rowSpan={row.rowSpan} className="border border-black px-3 py-3 text-center font-bold bg-transparent print:bg-transparent">
                      {row.srNo}
                    </td>
                  )}
                  {row.isFirstRow && (
                    <td rowSpan={row.rowSpan} className="border border-black px-4 py-3 text-left font-medium leading-tight bg-transparent print:bg-transparent">
                      {row.parameter}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center bg-transparent print:bg-transparent">{row.specified}</td>
                  {shouldRenderMeasured && (
                    <td
                      {...(row.measuredRowSpan > 0 ? { rowSpan: row.measuredRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center font-semibold bg-transparent print:bg-transparent"
                    >
                      {row.measured}
                    </td>
                  )}
                  {shouldRenderTolerance && (
                    <td
                      {...(row.toleranceRowSpan > 0 ? { rowSpan: row.toleranceRowSpan } : {})}
                      className="border border-black px-4 py-3 text-center text-xs leading-tight bg-transparent print:bg-transparent"
                    >
                      {row.tolerance}
                    </td>
                  )}
                  <td className="border border-black px-4 py-3 text-center bg-transparent print:bg-transparent">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-bold rounded ${
                        row.remarks === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.remarks}
                    </span>
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

export default MainTestTableForBMD;
