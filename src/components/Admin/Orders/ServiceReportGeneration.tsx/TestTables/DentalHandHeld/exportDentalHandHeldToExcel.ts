import * as XLSX from "xlsx";
import { resolveMeasHeaders, getMeasuredOutputs, cellStr } from "../shared/exportMeasHeaders";

export interface DentalHandHeldExportData {
    accuracyOfOperatingPotential?: any;
    accuracyOfIrradiationTime?: any;
    linearityOfMaLoading?: any;
    linearityOfMasLoading?: any; // For machines without timer
    consistencyOfRadiationOutput?: any;
    radiationLeakageLevel?: any;
    radiationProtectionSurvey?: any;
}

export const createDentalHandHeldUploadableExcel = (data: DentalHandHeldExportData, hasTimer: boolean): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    const addSection = (title: string, headers: string[], rows: any[][]) => {
        allData.push(['TEST: ' + title]);
        allData.push(headers);
        rows.forEach(row => allData.push(row));
        allData.push([]); // Empty row after each section
    };

    // 1. ACCURACY OF OPERATING POTENTIAL
    if (data.accuracyOfOperatingPotential) {
        const aop = data.accuracyOfOperatingPotential;
        const tolSign =
            aop.kvpToleranceSign ||
            aop.tolerance?.sign ||
            aop.tolerance?.type ||
            '±';
        const tolVal =
            aop.kvpToleranceValue ??
            aop.tolerance?.value ??
            '5';
        const measurements: any[] =
            Array.isArray(aop.measurements) ? aop.measurements :
            Array.isArray(aop.rows) ? aop.rows :
            Array.isArray(aop.readings) ? aop.readings : [];

        const getMeasured = (row: any): string[] => {
            if (Array.isArray(row.measuredValues)) return row.measuredValues.map((v: any) => String(v ?? ''));
            if (Array.isArray(row.maStations)) {
                return row.maStations.map((s: any) => String(s?.kvp ?? s?.value ?? s ?? ''));
            }
            return [];
        };

        const maxMeas = measurements.length > 0
            ? Math.max(...measurements.map((r) => getMeasured(r).length), 0)
            : 0;
        const stations = resolveMeasHeaders(aop.mAStations, maxMeas, 'mA');

        allData.push(['TEST: ACCURACY OF OPERATING POTENTIAL']);
        allData.push(['Tolerance Sign', tolSign]);
        allData.push(['Tolerance Value (kVp)', tolVal]);
        if (measurements.length > 0) {
            allData.push(['Applied kVp', ...stations]);
            measurements.forEach((row) => {
                const vals = getMeasured(row);
                allData.push([
                    row.appliedKvp || row.kvp || '',
                    ...stations.map((_: string, i: number) => vals[i] ?? ''),
                ]);
            });
        }
        allData.push([]);
    }

    // 2. ACCURACY OF IRRADIATION TIME
    if (data.accuracyOfIrradiationTime) {
        const rows = (data.accuracyOfIrradiationTime.readings || []).map((row: any) => [
            row.time || '',
            row.observedTime || '',
            row.error || '',
            row.remark || '',
            data.accuracyOfIrradiationTime.tolerance || ''
        ]);
        addSection('ACCURACY OF IRRADIATION TIME', ['Set Time (s)', 'Observed Time (s)', '% Error', 'Remarks', 'Tolerance'], rows);
    }

    // 3. LINEARITY OF mA LOADING (if hasTimer) — dynamic measHeaders
    if (hasTimer && data.linearityOfMaLoading) {
        const lm = data.linearityOfMaLoading;
        const t1 = Array.isArray(lm.table1) ? lm.table1[0] || {} : (lm.table1 || {});
        const rows = Array.isArray(lm.table2) ? lm.table2 : (lm.readings || []);
        const maxMeas = Math.max(0, ...rows.map((r: any) => getMeasuredOutputs(r).length));
        const measHeaders = resolveMeasHeaders(
            lm.measHeaders || lm.measurementHeaders,
            maxMeas,
            'Meas'
        );
        allData.push(['TEST: LINEARITY OF mA LOADING']);
        allData.push(['FCD', 'kV', 'Time', 'mA', ...measHeaders, 'Average', 'mR/mAs', 'CoL']);
        rows.forEach((row: any) => {
            const outs = getMeasuredOutputs(row);
            allData.push([
                t1.fcd || '',
                t1.kv || '',
                t1.time || row.time || '',
                row.ma || row.mAApplied || '',
                ...measHeaders.map((_, i) => outs[i] ?? ''),
                row.average || '',
                row.x || row.mRmAs || '',
                row.col || '',
            ]);
        });
        allData.push(['Tolerance Operator', lm.toleranceOperator || '<=']);
        allData.push(['Tolerance Value (CoL)', lm.tolerance || '0.1']);
        allData.push([]);
    }

    // 4. LINEARITY OF mAs LOADING (if !hasTimer) — dynamic measHeaders
    if (!hasTimer && data.linearityOfMasLoading) {
        const lm = data.linearityOfMasLoading;
        const t1 = Array.isArray(lm.table1) ? lm.table1[0] || {} : (lm.table1 || {});
        const rows = Array.isArray(lm.table2) ? lm.table2 : (lm.readings || []);
        const maxMeas = Math.max(0, ...rows.map((r: any) => getMeasuredOutputs(r).length));
        const measHeaders = resolveMeasHeaders(
            lm.measHeaders || lm.measurementHeaders,
            maxMeas,
            'Meas'
        );
        allData.push(['TEST: LINEARITY OF mAs LOADING']);
        allData.push(['FCD', 'kV', 'mAs', ...measHeaders, 'Average', 'mR/mAs', 'CoL']);
        rows.forEach((row: any) => {
            const outs = getMeasuredOutputs(row);
            allData.push([
                t1.fcd || '',
                t1.kv || '',
                row.mas || row.mAsRange || row.mAsApplied || '',
                ...measHeaders.map((_, i) => outs[i] ?? ''),
                row.average || '',
                row.x || row.mRmAs || '',
                row.col || '',
            ]);
        });
        allData.push(['Tolerance Operator', lm.toleranceOperator || '<=']);
        allData.push(['Tolerance Value (CoL)', lm.tolerance || '0.1']);
        allData.push([]);
    }

    // 5. CONSISTENCY OF RADIATION OUTPUT
    if (data.consistencyOfRadiationOutput) {
        const oc = data.consistencyOfRadiationOutput;
        const tolOp = oc.tolerance?.operator ?? oc.toleranceOperator ?? '<=';
        const tolVal =
            oc.tolerance?.value ??
            oc.toleranceValue ??
            (typeof oc.tolerance === 'object' ? '' : oc.tolerance) ??
            '0.05';
        const measurements: any[] =
            Array.isArray(oc.outputRows) ? oc.outputRows :
            Array.isArray(oc.readings) ? oc.readings : [];

        const maxMeas = measurements.length > 0
            ? Math.max(...measurements.map((r) => getMeasuredOutputs(r).length), 0)
            : 0;
        const stations = resolveMeasHeaders(
            oc.measurementHeaders || oc.measHeaders || oc.outputHeaders,
            maxMeas,
            'Meas'
        );

        allData.push(['TEST: CONSISTENCY OF RADIATION OUTPUT']);
        allData.push(['Tolerance Operator', tolOp]);
        allData.push(['Tolerance Value (CoV)', tolVal]);
        if (oc.ffd != null && String(oc.ffd).trim() !== '') {
            allData.push(['FFD', typeof oc.ffd === 'object' ? cellStr(oc.ffd) : oc.ffd]);
        }
        if (measurements.length > 0) {
            allData.push(['Test kV', 'Test mAs', ...stations, 'Mean', 'CoV']);
            measurements.forEach((row) => {
                const outs = getMeasuredOutputs(row);
                allData.push([
                    row.kvp || row.kv || '',
                    row.mas || row.mAs || row.ma || '',
                    ...stations.map((_: string, i: number) => outs[i] ?? ''),
                    row.mean || row.avg || '',
                    row.cov || row.cv || '',
                ]);
            });
        }
        allData.push([]);
    }

    // 6. RADIATION LEAKAGE LEVEL (Tube Housing Leakage)
    if (data.radiationLeakageLevel) {
        const t1 = data.radiationLeakageLevel.settings?.[0] || {};
        // Assuming single row for settings in export or repeated?
        // The settings are usually one-off, but let's put them in the first row or separate columns
        // Similar to CTScan "Radiation Leakage Level"
        const rows = (data.radiationLeakageLevel.leakageMeasurements || []).map((row: any) => [
            t1.ffd || '',
            t1.kvp || '',
            t1.ma || '',
            t1.time || '',
            row.location || '',
            row.left || '',
            row.right || '',
            row.top || '',
            row.up || '',
            row.down || '',
            row.max || '',
            row.unit || '',
            row.remark || '',
            data.radiationLeakageLevel.workload || '',
            data.radiationLeakageLevel.workloadUnit || '',
            data.radiationLeakageLevel.toleranceValue || '',
            data.radiationLeakageLevel.toleranceOperator || '',
            data.radiationLeakageLevel.toleranceTime || ''
        ]);

        // If no leakage rows but settings exist, add a row
        if (rows.length === 0 && (t1.ffd || t1.kvp)) {
            rows.push([t1.ffd || '', t1.kvp || '', t1.ma || '', t1.time || '', '', '', '', '', '', '', '', '', '',
            data.radiationLeakageLevel.workload || '',
            data.radiationLeakageLevel.workloadUnit || '',
            data.radiationLeakageLevel.toleranceValue || '',
            data.radiationLeakageLevel.toleranceOperator || '',
            data.radiationLeakageLevel.toleranceTime || ''
            ]);
        }

        addSection('RADIATION LEAKAGE LEVEL', [
            'FFD', 'kVp', 'mA', 'Time',
            'Location', 'Left', 'Right', 'Top', 'Up', 'Down', 'Max', 'Unit', 'Remark',
            'Workload', 'Workload Unit', 'Tol Value', 'Tol Op', 'Tol Time'
        ], rows);
    }

    // 7. DETAILS OF RADIATION PROTECTION SURVEY
    if (data.radiationProtectionSurvey) {
        // Similar to CT Scan RPS
        // Check `DetailsOfRadiationProtection.tsx` for fields if possible, but guessing standard fields
        const rows = (data.radiationProtectionSurvey.locations || []).map((row: any) => [
            row.location || '',
            row.exposureLevel || '', // or mRPerHr
            row.category || '',
            data.radiationProtectionSurvey.surveyDate ? data.radiationProtectionSurvey.surveyDate.split('T')[0] : '', // Format date
            data.radiationProtectionSurvey.equipment || '', // Valid Calibration?
            data.radiationProtectionSurvey.workload || '',
            data.radiationProtectionSurvey.occupancyFactor || ''
        ]);
        addSection('DETAILS OF RADIATION PROTECTION SURVEY', ['Location', 'Exposure Level', 'Category', 'Date', 'Equipment/Calibration', 'Workload', 'Occupancy Factor'], rows);
    }

    const ws = XLSX.utils.aoa_to_sheet(allData);
    // Auto-size columns roughly
    ws['!cols'] = Array(20).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(wb, ws, 'Dental Intra Export');

    return wb;
};
