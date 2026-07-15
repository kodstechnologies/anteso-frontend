import * as XLSX from "xlsx";

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
        const stations = Array.isArray(aop.mAStations) && aop.mAStations.length > 0
            ? aop.mAStations.map((s: any) => String(s))
            : Array.from({ length: Math.max(maxMeas, 2) }, (_, i) => `mA ${i + 1}`);

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

    // 3. LINEARITY OF mA LOADING (if hasTimer)
    if (hasTimer && data.linearityOfMaLoading) {
        const rows = (data.linearityOfMaLoading.readings || []).map((row: any) => [
            row.ma || '',
            row.time || '',
            row.meas1 || '',
            row.meas2 || '',
            row.meas3 || '',
            row.average || '',
            row.mRmAs || '',
            row.col || '',
            data.linearityOfMaLoading.tolerance || ''
        ]);
        addSection('LINEARITY OF mA LOADING', ['mA', 'Time (s)', 'Meas 1', 'Meas 2', 'Meas 3', 'Average', 'mR/mAs', 'CoL', 'Tolerance'], rows);
    }

    // 4. LINEARITY OF mAs LOADING (if !hasTimer)
    if (!hasTimer && data.linearityOfMasLoading) {
        const rows = (data.linearityOfMasLoading.readings || []).map((row: any) => [
            row.mas || '',
            row.meas1 || '',
            row.meas2 || '',
            row.meas3 || '',
            row.average || '',
            row.mRmAs || '',
            row.col || '',
            data.linearityOfMasLoading.tolerance || ''
        ]);
        addSection('LINEARITY OF mAs LOADING', ['mAs', 'Meas 1', 'Meas 2', 'Meas 3', 'Average', 'mR/mAs', 'CoL', 'Tolerance'], rows);
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

        const getOutputs = (row: any): string[] => {
            if (Array.isArray(row.outputs)) {
                return row.outputs.map((o: any) =>
                    o != null && typeof o === 'object' && 'value' in o ? String(o.value ?? '') : String(o ?? '')
                );
            }
            return [row.meas1, row.meas2, row.meas3, row.meas4, row.meas5]
                .filter((v) => v != null && String(v).trim() !== '')
                .map((v) => String(v));
        };

        const maxMeas = measurements.length > 0
            ? Math.max(...measurements.map((r) => getOutputs(r).length), 0)
            : 0;
        const stations = Array.isArray(oc.measurementHeaders) && oc.measurementHeaders.length > 0
            ? oc.measurementHeaders.map((s: any) => String(s))
            : Array.from({ length: Math.max(maxMeas, 3) }, (_, i) => `Meas ${i + 1}`);

        allData.push(['TEST: CONSISTENCY OF RADIATION OUTPUT']);
        allData.push(['Tolerance Operator', tolOp]);
        allData.push(['Tolerance Value (CoV)', tolVal]);
        if (oc.ffd != null && String(oc.ffd).trim() !== '') {
            allData.push(['FFD', oc.ffd]);
        }
        if (measurements.length > 0) {
            allData.push(['Test kV', 'Test mAs', ...stations]);
            measurements.forEach((row) => {
                const outs = getOutputs(row);
                allData.push([
                    row.kvp || row.kv || '',
                    row.mas || row.mAs || row.ma || '',
                    ...stations.map((_: string, i: number) => outs[i] ?? ''),
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
