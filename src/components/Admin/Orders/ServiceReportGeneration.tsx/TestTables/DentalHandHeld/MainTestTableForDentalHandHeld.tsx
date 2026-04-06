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
    if (o === "≤" || o === "<=") return "<=";
    if (o === "≥" || o === ">=") return ">=";
    if (o === "<") return "<";
    if (o === ">") return ">";
    return "<=";
  };

  // 2. Accuracy of Irradiation Time
  // Payload: { irradiationTimes | rows: [...], tolerance | timeToleranceSign/Value }
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
      const toleranceOp = normalizeToleranceOperator(
        irrBlocks.tolerance?.operator ?? irrBlocks.timeToleranceSign
      );
      const toleranceVal =
        irrBlocks.tolerance?.value ?? irrBlocks.timeToleranceValue ?? "10";
      const tolDisplay =
        toleranceOp === "<=" ? "≤" : toleranceOp === ">=" ? "≥" : toleranceOp;

      let overallRemark: "Pass" | "Fail" | "-" = "-";
      const timeRows = validRows.map((row: any) => {
        const setT = irrRowSetTime(row);
        const measT = irrRowMeasuredTime(row);
        const s = parseFloat(String(setT));
        const m = parseFloat(String(measT));
        const err =
          !isNaN(s) && !isNaN(m) && s !== 0
            ? Math.abs(((m - s) / s) * 100).toFixed(2)
            : null;

        const stored = String(row.remark ?? row.remarks ?? "").trim().toUpperCase();
        let rem: "Pass" | "Fail" | "-" = "-";
        if (stored === "PASS") rem = "Pass";
        else if (stored === "FAIL") rem = "Fail";
        else if (err !== null) {
          const e = parseFloat(err);
          const v = parseFloat(String(toleranceVal));
          if (!isNaN(v)) {
            if (toleranceOp === "<=") rem = e <= v ? "Pass" : "Fail";
            else if (toleranceOp === "<") rem = e < v ? "Pass" : "Fail";
            else if (toleranceOp === ">") rem = e > v ? "Pass" : "Fail";
            else if (toleranceOp === ">=") rem = e >= v ? "Pass" : "Fail";
          }
        }

        if (rem === "Fail") overallRemark = "Fail";
        else if (rem === "Pass" && overallRemark !== "Fail") overallRemark = "Pass";

        const measuredDisplay =
          err !== null ? `${measT} (${err}% err)` : measT !== "" ? String(measT) : "-";

        return {
          specified: setT !== "" ? String(setT) : "-",
          measured: measuredDisplay,
          tolerance: `${tolDisplay} ${toleranceVal}% Error`,
          remarks: rem,
        };
      });

      const rowsWithSharedRemark = timeRows.map((r: any) => ({
        ...r,
        remarks: overallRemark !== "-" ? overallRemark : r.remarks,
      }));
      addRowsForTest("Accuracy of Irradiation Time", rowsWithSharedRemark, true);
    }
  }



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

  // 9. Total Filteration
  if (testData.totalFilteration) {
    // Data is nested: totalFiltration sub-object holds atKvp/measured1/measured2
    // filtrationTolerance sub-object holds the threshold values
    const tfObj = testData.totalFilteration.totalFiltration ?? testData.totalFilteration;
    const ftObj = testData.totalFilteration.filtrationTolerance ?? {};

    const atKvp = tfObj.atKvp ?? tfObj.kvp ?? tfObj.kV ?? tfObj.appliedKvp ?? "";
    // measured1 = measured HVL, measured2 = required/tolerance value (legacy storage)
    const measured1 = tfObj.measured1 ?? tfObj.measured ?? tfObj.measuredValue ?? tfObj.measuredHvl ?? "";
    const measured2 = tfObj.measured2 ?? tfObj.required ?? tfObj.requiredValue ?? tfObj.minimumHvl ?? "";

    // Derive required tolerance from filtrationTolerance thresholds based on kVp
    const kvpNum = parseFloat(atKvp);
    const k1 = parseFloat(ftObj.kvThreshold1 ?? ftObj.kvp1 ?? "70");
    const k2 = parseFloat(ftObj.kvThreshold2 ?? ftObj.kvp2 ?? "100");
    let reqNum = NaN;
    if (!isNaN(kvpNum) && !isNaN(k1) && kvpNum < k1) {
      reqNum = parseFloat(ftObj.forKvGreaterThan70 ?? ftObj.value1 ?? "");
    } else if (!isNaN(kvpNum) && !isNaN(k1) && !isNaN(k2) && kvpNum >= k1 && kvpNum <= k2) {
      reqNum = parseFloat(ftObj.forKvBetween70And100 ?? ftObj.value2 ?? "");
    } else if (!isNaN(kvpNum)) {
      reqNum = parseFloat(ftObj.forKvGreaterThan100 ?? ftObj.value3 ?? "");
    }
    // Fallback: measured2 often stores the required value in legacy payloads
    if (isNaN(reqNum) && measured2 !== "") reqNum = parseFloat(measured2);

    const measuredNum = parseFloat(measured1);
    let remark: "Pass" | "Fail" | "-" = "-";
    if (!isNaN(measuredNum) && !isNaN(reqNum)) {
      remark = measuredNum >= reqNum ? "Pass" : "Fail";
    }

    if (atKvp !== "" || measured1 !== "") {
      addRowsForTest("Total Filteration", [{
        specified: atKvp !== "" ? `${atKvp} kVp` : "-",
        measured: measured1 !== "" ? `${measured1} mmAl` : "-",
        tolerance: !isNaN(reqNum) ? `≥ ${reqNum} mmAl` : "-",
        remarks: remark,
      }]);
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
      // col and remarks are stored per-row (on first row), not at top level
      const firstRow = validRows[0];
      const col = testData.linearityOfmALoading.col || firstRow?.col || "-";
      const remarks = testData.linearityOfmALoading.remarks || firstRow?.remarks || "";
      const isPass = remarks.toUpperCase() === "PASS";
      // Specified: list the mA values tested
      const mAValues = validRows.map((r: any) => r.ma).filter(Boolean).join(", ");

      const testRows = [{
        specified: mAValues || "-",
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

  // 6. Consistency of Radiation Output (CV / CoV)
  const parseOutputCell = (o: any): number => {
    if (o == null) return NaN;
    if (typeof o === "number") return o;
    if (typeof o === "string") return parseFloat(o);
    if (typeof o === "object" && "value" in o) return parseFloat(String((o as { value?: unknown }).value ?? ""));
    return NaN;
  };

  const computeCovFromOutputs = (row: any): string => {
    const outs = row.outputs ?? [];
    if (!Array.isArray(outs) || outs.length === 0) return "";
    const nums = outs.map(parseOutputCell).filter((n: number) => !isNaN(n) && n > 0);
    if (nums.length === 0) return "";
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    if (nums.length === 1 || mean <= 0) return "0.0000";
    const variance =
      nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
    const cov = Math.sqrt(variance) / mean;
    return isFinite(cov) ? cov.toFixed(4) : "";
  };

  if (testData.consistencyOfRadiationOutput?.outputRows && Array.isArray(testData.consistencyOfRadiationOutput.outputRows)) {
    const outBlock = testData.consistencyOfRadiationOutput;
    const validRows = outBlock.outputRows.filter((row: any) => {
      const kvp = row.kvp ?? row.kv ?? "";
      const mas = row.mas ?? "";
      const mean = row.mean ?? row.avg ?? "";
      const cov = row.cov ?? row.cv ?? "";
      const outs = row.outputs ?? [];
      const hasOuts =
        Array.isArray(outs) &&
        outs.some((o: any) => {
          const v = parseOutputCell(o);
          return !isNaN(v);
        });
      return !!(kvp || mas || mean || cov || hasOuts);
    });
    if (validRows.length > 0) {
      const tolerance = outBlock.tolerance ?? "0.05";
      const tolObj = typeof tolerance === "object" && tolerance !== null ? tolerance : null;
      const tolVal = String(tolObj?.value ?? (typeof tolerance === "string" || typeof tolerance === "number" ? tolerance : "0.05"));
      const tolOp = normalizeToleranceOperator(tolObj?.operator ?? "<=");
      const tolNum = parseFloat(tolVal);
      const tolSym = tolOp === "<=" ? "≤" : tolOp === ">=" ? "≥" : tolOp;

      const testRows = validRows.map((row: any) => {
        const covRaw = row.cov ?? row.cv ?? "";
        let covStr =
          typeof covRaw === "object" && covRaw !== null && "value" in covRaw
            ? String((covRaw as { value?: unknown }).value ?? "")
            : String(covRaw ?? "");
        if (covStr.trim() === "") covStr = computeCovFromOutputs(row);
        const covNum = parseFloat(covStr);
        let rem: "Pass" | "Fail" | "-" = "-";
        if (!isNaN(covNum) && !isNaN(tolNum)) {
          if (tolOp === "<=" || tolOp === "<") rem = covNum <= tolNum ? "Pass" : "Fail";
          else if (tolOp === ">=" || tolOp === ">") rem = covNum >= tolNum ? "Pass" : "Fail";
        }
        if (rem === "-") {
          const storedRemark = String(row.remarks ?? row.remark ?? "").trim();
          if (storedRemark.toUpperCase() === "PASS") rem = "Pass";
          else if (storedRemark.toUpperCase() === "FAIL") rem = "Fail";
        }
        const kvp = row.kvp ?? row.kv ?? "";
        const mas = row.mas ?? "";
        const meanStr = row.mean ?? row.avg ?? "";
        const measuredParts = [covStr !== "" ? `CoV ${covStr}` : "", meanStr !== "" ? `Mean ${meanStr}` : ""].filter(Boolean);
        return {
          specified: kvp && mas ? `${kvp} kV, ${mas} mAs` : kvp ? `${kvp} kV` : mas ? `${mas} mAs` : "-",
          measured: measuredParts.length > 0 ? measuredParts.join("; ") : "-",
          tolerance: `${tolSym} ${tolVal}`,
          remarks: rem,
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
        specified: `≤ ${toleranceValue} mGy/hr`,
        measured: finalLeakage !== undefined && finalLeakage !== "—" ? `${finalLeakage} mGy/hr` : "-",
        tolerance: `≤ ${toleranceValue} mGy/hr`,
        remarks: (remark?.toUpperCase() === "PASS" ? "Pass" : remark ? "Fail" : "-") as any,
      }];
      addRowsForTest("Radiation Leakage from Tube Housing", testRows);
    }
  }

  // 8. Radiation Protection Survey Report
  if (testData.radiationProtectionSurvey?.locations && Array.isArray(testData.radiationProtectionSurvey.locations)) {
    const locations = testData.radiationProtectionSurvey.locations;
    const validRows = locations.filter((row: any) => row?.location || row?.mRPerWeek || row?.result);
    if (validRows.length > 0) {
      const workerRows = validRows.filter((r: any) => (r.category || "").toLowerCase() === "worker");
      const publicRows = validRows.filter((r: any) => (r.category || "").toLowerCase() === "public");
      const maxWorker = workerRows.reduce((m: number, r: any) => Math.max(m, parseFloat(r.mRPerWeek) || 0), 0);
      const maxPublic = publicRows.reduce((m: number, r: any) => Math.max(m, parseFloat(r.mRPerWeek) || 0), 0);

      const surveyRows = [
        {
          specified: "Worker: 40 mR/week",
          measured: maxWorker > 0 ? `${maxWorker.toFixed(3)} mR/week` : "-",
          tolerance: "≤ 40 mR/week",
          remarks: (maxWorker > 0 ? (maxWorker <= 40 ? "Pass" : "Fail") : "-") as any,
        },
        {
          specified: "Public: 2 mR/week",
          measured: maxPublic > 0 ? `${maxPublic.toFixed(3)} mR/week` : "-",
          tolerance: "≤ 2 mR/week",
          remarks: (maxPublic > 0 ? (maxPublic <= 2 ? "Pass" : "Fail") : "-") as any,
        },
      ];
      addRowsForTest("Radiation Protection Survey Report", surveyRows);
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
