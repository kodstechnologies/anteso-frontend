import * as XLSX from "xlsx";

export interface DentalIntraExportData {
    accuracyOfOperatingPotential?: any;
    accuracyOfIrradiationTime?: any;
    linearityOfMaLoading?: any;
    linearityOfMasLoading?: any; // For machines without timer
    consistencyOfRadiationOutput?: any;
    radiationLeakageLevel?: any;
    radiationProtectionSurvey?: any;
}

export const createDentalIntraUploadableExcel = (data: DentalIntraExportData, hasTimer: boolean): XLSX.WorkBook => {
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
        const rows = (data.accuracyOfOperatingPotential.readings || []).map((row: any) => [
            row.kvp || '',
            row.avgKvp || '',
            row.remark || '',
            data.accuracyOfOperatingPotential.tolerance || ''
        ]);
        addSection('ACCURACY OF OPERATING POTENTIAL', ['Applied kVp', 'Average kVp', 'Remarks', 'Tolerance'], rows);
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
        const rows = (data.consistencyOfRadiationOutput.readings || []).map((row: any) => [
            row.kv || '',
            row.ma || '',
            row.time || '',
            row.meas1 || '',
            row.meas2 || '',
            row.meas3 || '',
            row.meas4 || '',
            row.average || '',
            row.cov || '',
            data.consistencyOfRadiationOutput.tolerance || ''
        ]);
        addSection('CONSISTENCY OF RADIATION OUTPUT', ['kV', 'mA', 'Time (s)', 'Meas 1', 'Meas 2', 'Meas 3', 'Meas 4', 'Average', 'CoV', 'Tolerance'], rows);
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
