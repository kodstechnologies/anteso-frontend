import * as XLSX from "xlsx";
import { normalizeCsvComparisonOperator } from "../shared/parseRadiographyStyleTableFormat";
import { resolveMeasHeaders, getMeasuredOutputs, cellStr } from "../shared/exportMeasHeaders";

export interface DentalIntraExportData {
    accuracyOfOperatingPotential?: any;
    accuracyOfOperatingPotentialAndTime?: any;
    accuracyOfIrradiationTime?: any;
    linearityOfMaLoading?: any;
    linearityOfMasLoading?: any;
    consistencyOfRadiationOutput?: any;
    radiationLeakageLevel?: any;
    radiationProtectionSurvey?: any;
}

export const createDentalIntraUploadableExcel = (
    data: DentalIntraExportData,
    _hasTimer?: boolean
): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    const addSection = (title: string, headers: string[], rows: any[][]) => {
        allData.push(["TEST: " + title]);
        allData.push(headers);
        rows.forEach((row) => allData.push(row));
        allData.push([]);
    };

    // 1. ACCURACY OF OPERATING POTENTIAL & TIME (combined — matches generate UI)
    const aop =
        data.accuracyOfOperatingPotentialAndTime ||
        data.accuracyOfOperatingPotential ||
        data.accuracyOfIrradiationTime;

    if (aop) {
        const kvpTolSign = aop.kvpToleranceSign || aop.tolerance?.sign || aop.tolerance?.type || "±";
        const kvpTolVal = aop.kvpToleranceValue ?? aop.tolerance?.value ?? "5";
        const timeTolSign = aop.timeToleranceSign || aop.tolerance?.operator || "±";
        const timeTolVal = aop.timeToleranceValue ?? aop.tolerance?.value ?? "10";

        const measurements: any[] = Array.isArray(aop.rows)
            ? aop.rows
            : Array.isArray(aop.measurements)
                ? aop.measurements
                : Array.isArray(aop.readings)
                    ? aop.readings
                    : [];

        const getStations = (row: any): Array<{ kvp: string; time: string }> => {
            if (Array.isArray(row.maStations) && row.maStations.length > 0) {
                return row.maStations.map((s: any) => ({
                    kvp: String(s?.kvp ?? s?.value ?? ""),
                    time: String(s?.time ?? ""),
                }));
            }
            if (Array.isArray(row.measuredValues)) {
                return row.measuredValues.map((v: any) => ({
                    kvp: String(v ?? ""),
                    time: "",
                }));
            }
            const legacy: Array<{ kvp: string; time: string }> = [];
            if (row.maStation1 || row.maStation2) {
                legacy.push({
                    kvp: String(row.maStation1?.kvp ?? ""),
                    time: String(row.maStation1?.time ?? ""),
                });
                legacy.push({
                    kvp: String(row.maStation2?.kvp ?? ""),
                    time: String(row.maStation2?.time ?? ""),
                });
            }
            return legacy;
        };

        const maxStations = Math.max(
            2,
            ...measurements.map((r) => getStations(r).length),
            Array.isArray(aop.mAStations) ? aop.mAStations.length : 0
        );

        allData.push(["TEST: ACCURACY OF OPERATING POTENTIAL & TIME"]);
        allData.push(["kVp Tolerance Sign", kvpTolSign]);
        allData.push(["kVp Tolerance Value", kvpTolVal]);
        allData.push(["Time Tolerance Sign", timeTolSign]);
        allData.push(["Time Tolerance Value (%)", timeTolVal]);

        if (measurements.length > 0) {
            const headers = ["Applied kVp", "Set Time"];
            for (let i = 1; i <= maxStations; i++) {
                headers.push(`Meas ${i} kVp`, `Meas ${i} Time`);
            }
            allData.push(headers);

            measurements.forEach((row) => {
                const stations = getStations(row);
                while (stations.length < maxStations) stations.push({ kvp: "", time: "" });
                const line: any[] = [
                    row.appliedKvp || row.appliedkVp || row.kvp || "",
                    row.setTime || "",
                ];
                for (let i = 0; i < maxStations; i++) {
                    line.push(stations[i]?.kvp ?? "", stations[i]?.time ?? "");
                }
                allData.push(line);
            });
        }
        allData.push([]);

        // Total Filtration (same combined document)
        const tf = aop.totalFiltration;
        if (tf && (tf.measured1 != null || tf.measured != null || tf.atKvp != null)) {
            allData.push(["TEST: TOTAL FILTRATION"]);
            allData.push([
                "Total Filtration Measured (mm Al)",
                tf.measured1 ?? tf.measured ?? "",
            ]);
            allData.push([
                "Total Filtration Required (mm Al)",
                tf.measured2 ?? tf.required ?? "",
            ]);
            allData.push(["Total Filtration At kVp", tf.atKvp ?? ""]);
            allData.push([]);
        }
    }

    // 2. LINEARITY OF mAs LOADING
    if (data.linearityOfMasLoading) {
        const lm = data.linearityOfMasLoading;
        const t1 = Array.isArray(lm.table1) ? lm.table1[0] || {} : lm.table1 || {};
        const rows = Array.isArray(lm.table2) ? lm.table2 : lm.readings || [];
        const maxMeas = Math.max(0, ...rows.map((r: any) => getMeasuredOutputs(r).length));
        const measHeaders = resolveMeasHeaders(
            lm.measHeaders || lm.measurementHeaders,
            maxMeas,
            "Measured mR"
        );
        allData.push(["TEST: LINEARITY OF mAs LOADING"]);
        allData.push(["FDD (cm)", "kV", "mAs Range", ...measHeaders, "Average", "mR/mAs", "CoL"]);
        rows.forEach((row: any) => {
            const outs = getMeasuredOutputs(row);
            allData.push([
                t1.fcd || t1.fdd || "",
                t1.kv || "",
                row.mas || row.mAsRange || row.mAsApplied || "",
                ...measHeaders.map((_, i) => outs[i] ?? ""),
                row.average || "",
                row.x || row.mRmAs || "",
                row.col || "",
            ]);
        });
        allData.push(["Tolerance Operator", lm.toleranceOperator || "<="]);
        allData.push(["Tolerance Value (CoL)", lm.tolerance || "0.1"]);
        allData.push([]);
    }

    // 3. LINEARITY OF mA LOADING
    if (data.linearityOfMaLoading) {
        const lm = data.linearityOfMaLoading;
        const t1 = Array.isArray(lm.table1) ? lm.table1[0] || {} : lm.table1 || {};
        const rows = Array.isArray(lm.table2) ? lm.table2 : lm.readings || [];
        const maxMeas = Math.max(0, ...rows.map((r: any) => getMeasuredOutputs(r).length));
        const measHeaders = resolveMeasHeaders(
            lm.measHeaders || lm.measurementHeaders,
            maxMeas,
            "Measured mR"
        );
        allData.push(["TEST: LINEARITY OF mA LOADING"]);
        allData.push(["FDD (cm)", "kV", "Time", "mA Station", ...measHeaders, "Average", "mR/mAs"]);
        rows.forEach((row: any) => {
            const outs = getMeasuredOutputs(row);
            allData.push([
                t1.fcd || t1.fdd || "",
                t1.kv || "",
                t1.time || row.time || "",
                row.ma || row.mAApplied || row.time || "",
                ...measHeaders.map((_, i) => outs[i] ?? ""),
                row.average || "",
                row.x || row.mRmAs || "",
            ]);
        });
        allData.push(["Tolerance Operator", lm.toleranceOperator || "<="]);
        allData.push(["Tolerance Value (CoL)", lm.tolerance || "0.1"]);
        allData.push([]);
    }

    // 4. CONSISTENCY OF RADIATION OUTPUT
    if (data.consistencyOfRadiationOutput) {
        const oc = data.consistencyOfRadiationOutput;
        const tolOp = oc.tolerance?.operator ?? oc.toleranceOperator ?? "<=";
        const tolVal =
            oc.tolerance?.value ??
            oc.toleranceValue ??
            (typeof oc.tolerance === "object" ? "" : oc.tolerance) ??
            "0.05";
        const measurements: any[] = Array.isArray(oc.outputRows)
            ? oc.outputRows
            : Array.isArray(oc.readings)
                ? oc.readings
                : [];

        const maxMeas =
            measurements.length > 0
                ? Math.max(...measurements.map((r) => getMeasuredOutputs(r).length), 0)
                : 0;
        const stations = resolveMeasHeaders(
            oc.measurementHeaders || oc.measHeaders || oc.outputHeaders,
            maxMeas,
            "Meas"
        );

        allData.push(["TEST: CONSISTENCY OF RADIATION OUTPUT"]);
        allData.push(["Tolerance Operator", tolOp]);
        allData.push(["Tolerance Value (CoV)", tolVal]);
        if (oc.ffd != null && String(oc.ffd).trim() !== "") {
            allData.push(["FFD", typeof oc.ffd === "object" ? cellStr(oc.ffd) : oc.ffd]);
        }
        if (measurements.length > 0) {
            allData.push(["Test kV", "Test mAs", ...stations, "Mean", "CoV"]);
            measurements.forEach((row) => {
                const outs = getMeasuredOutputs(row);
                allData.push([
                    row.kvp || row.kv || "",
                    row.mas || row.mAs || row.ma || "",
                    ...stations.map((_: string, i: number) => outs[i] ?? ""),
                    row.mean || row.avg || "",
                    row.cov || row.cv || "",
                ]);
            });
        }
        allData.push([]);
    }

    // 5. RADIATION LEAKAGE LEVEL
    if (data.radiationLeakageLevel) {
        const t1 = data.radiationLeakageLevel.settings?.[0] || {};
        const rows = (data.radiationLeakageLevel.leakageMeasurements || []).map((row: any) => [
            t1.ffd || t1.fcd || t1.distance || "",
            t1.kvp || t1.kv || "",
            t1.ma || "",
            t1.time || "",
            row.location || "",
            row.front ?? "",
            row.back ?? "",
            row.left || "",
            row.right || "",
            row.top || "",
            row.max || "",
            row.unit || "",
            row.remark || "",
            data.radiationLeakageLevel.workload || "",
            data.radiationLeakageLevel.workloadUnit || "mA in one hour",
            data.radiationLeakageLevel.toleranceValue || "",
            data.radiationLeakageLevel.toleranceOperator
                ? normalizeCsvComparisonOperator(data.radiationLeakageLevel.toleranceOperator)
                : "<=",
            data.radiationLeakageLevel.toleranceTime || "",
        ]);

        if (rows.length === 0 && (t1.ffd || t1.kvp || t1.fcd)) {
            rows.push([
                t1.ffd || t1.fcd || "",
                t1.kvp || t1.kv || "",
                t1.ma || "",
                t1.time || "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                data.radiationLeakageLevel.workload || "",
                data.radiationLeakageLevel.workloadUnit || "mA in one hour",
                data.radiationLeakageLevel.toleranceValue || "",
                data.radiationLeakageLevel.toleranceOperator
                    ? normalizeCsvComparisonOperator(data.radiationLeakageLevel.toleranceOperator)
                    : "<=",
                data.radiationLeakageLevel.toleranceTime || "",
            ]);
        }

        addSection(
            "RADIATION LEAKAGE LEVEL",
            [
                "Distance",
                "kV",
                "mA",
                "Time",
                "Location",
                "Front",
                "Back",
                "Left",
                "Right",
                "Top",
                "Max",
                "Unit",
                "Remark",
                "Workload",
                "Workload Unit",
                "Tolerance Value",
                "Tolerance Operator",
                "Tolerance Time",
            ],
            rows
        );
    }

    // 6. RADIATION PROTECTION SURVEY
    if (data.radiationProtectionSurvey) {
        const locationRows = (data.radiationProtectionSurvey.locations || []).map((row: any) => [
            data.radiationProtectionSurvey.appliedVoltage || "",
            data.radiationProtectionSurvey.appliedCurrent || "",
            data.radiationProtectionSurvey.exposureTime || "",
            data.radiationProtectionSurvey.workload || "",
            row.location || "",
            row.mRPerHr || row.exposureLevel || "",
        ]);
        addSection(
            "RADIATION PROTECTION SURVEY REPORT",
            ["kV", "mA", "Time", "Workload", "Location", "mR/hr"],
            locationRows
        );
    }

    const ws = XLSX.utils.aoa_to_sheet(allData);
    ws["!cols"] = Array(20).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(wb, ws, "Dental Intra Export");

    return wb;
};
