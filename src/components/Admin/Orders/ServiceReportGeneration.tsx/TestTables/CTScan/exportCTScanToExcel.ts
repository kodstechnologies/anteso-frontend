// Helper file for CT Scan Excel export with proper table structures
import * as XLSX from "xlsx";

export interface CTScanExportData {
    radiationProfileWidth?: any;
    measurementOfOperatingPotential?: any;
    measurementOfMaLinearity?: any;
    timerAccuracy?: any;
    linearityOfMasLoading?: any;
    measurementOfCTDI?: any;
    totalFiltration?: any;
    radiationLeakage?: any;
    outputConsistency?: any;
    lowContrastResolution?: any;
    highContrastResolution?: any;
    radiationProtectionSurvey?: any;
    alignmentTableGantry?: any;
    tablePosition?: any;
    gantryTilt?: any;
}

export const createCTScanExcelWithTables = (data: CTScanExportData, hasTimer: boolean): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    // Helper function to add section header
    const addSectionHeader = (title: string) => {
        allData.push([title]);
        allData.push([]);
    };

    // Helper function to create table
    const addTable = (headers: string[], rows: any[][]) => {
        allData.push(headers);
        rows.forEach(row => allData.push(row));
        allData.push([]);
    };

    // 1. Radiation Profile Width
    if (data.radiationProfileWidth) {
        addSectionHeader('RADIATION PROFILE WIDTH FOR CT SCAN');

        // Operating Parameters Table
        if (data.radiationProfileWidth.table1?.[0]) {
            addTable(
                ['kVp', 'mA'],
                [[
                    data.radiationProfileWidth.table1[0].kvp || '',
                    data.radiationProfileWidth.table1[0].ma || ''
                ]]
            );
        }

        // Applied vs Measured Table
        if (data.radiationProfileWidth.table2 && data.radiationProfileWidth.table2.length > 0) {
            const table2Rows = data.radiationProfileWidth.table2.map((row: any) => [
                row.applied || '',
                row.measured || ''
            ]);
            addTable(['Applied', 'Measured'], table2Rows);
        }
    }

    // 2. Measurement of Operating Potential
    if (data.measurementOfOperatingPotential) {
        addSectionHeader('MEASUREMENT OF OPERATING POTENTIAL');

        // Operating Parameters
        if (data.measurementOfOperatingPotential.table1?.[0]) {
            const t1 = data.measurementOfOperatingPotential.table1[0];
            addTable(
                ['Time (ms)', 'Slice Thickness (mm)'],
                [[
                    t1.time || t1.kvp || '',
                    t1.sliceThickness || t1.ma || ''
                ]]
            );
        }

        // Set KV vs Measured KV Table
        if (data.measurementOfOperatingPotential.table2 && data.measurementOfOperatingPotential.table2.length > 0) {
            const table2Rows = data.measurementOfOperatingPotential.table2.map((row: any) => [
                row.setKV || '',
                row.ma10 || '',
                row.ma100 || '',
                row.ma200 || ''
            ]);
            addTable(['Set kV', '@ mA 10', '@ mA 100', '@ mA 200'], table2Rows);
        }

        // Tolerance
        if (data.measurementOfOperatingPotential.toleranceValue ||
            data.measurementOfOperatingPotential.toleranceType ||
            data.measurementOfOperatingPotential.toleranceSign) {
            allData.push(['Tolerance']);
            allData.push([
                'Value', data.measurementOfOperatingPotential.toleranceValue || '',
                'Type', data.measurementOfOperatingPotential.toleranceType || '',
                'Sign', data.measurementOfOperatingPotential.toleranceSign || ''
            ]);
            allData.push([]);
        }
    }

    // 3. Measurement of mA Linearity (if hasTimer)
    if (hasTimer && data.measurementOfMaLinearity) {
        addSectionHeader('MEASUREMENT OF mA LINEARITY');

        // Operating Parameters
        if (data.measurementOfMaLinearity.table1?.[0]) {
            const t1 = data.measurementOfMaLinearity.table1[0];
            addTable(
                ['kVp', 'Slice Thickness (mm)', 'Time (ms)'],
                [[
                    t1.kvp || '',
                    t1.sliceThickness || '',
                    t1.time || ''
                ]]
            );
        }

        // mA Applied vs Measured Outputs Table
        if (data.measurementOfMaLinearity.table2 && data.measurementOfMaLinearity.table2.length > 0) {
            // Determine max number of measurements
            const maxMeas = Math.max(...data.measurementOfMaLinearity.table2.map((r: any) =>
                (r.measuredOutputs || []).length
            ));

            const headers = ['mA Applied', ...Array.from({ length: maxMeas }, (_, i) => `Meas ${i + 1}`),
                'Avg Output', 'X', 'X MAX', 'X MIN', 'CoL', 'Remarks'];

            const table2Rows = data.measurementOfMaLinearity.table2.map((row: any) => {
                const outputs = row.measuredOutputs || [];
                const rowData = [
                    row.mAsApplied || '',
                    ...Array.from({ length: maxMeas }, (_, i) => outputs[i] || ''),
                    row.avgOutput || '',
                    row.x || '',
                    row.xMax || '',
                    row.xMin || '',
                    row.col || '',
                    row.remarks || ''
                ];
                return rowData;
            });

            addTable(headers, table2Rows);
        }

        if (data.measurementOfMaLinearity.tolerance) {
            allData.push(['Tolerance:', data.measurementOfMaLinearity.tolerance]);
            allData.push([]);
        }
    }

    // 4. Timer Accuracy (if hasTimer)
    if (hasTimer && data.timerAccuracy) {
        addSectionHeader('TIMER ACCURACY');

        // Operating Parameters
        if (data.timerAccuracy.table1?.[0]) {
            const t1 = data.timerAccuracy.table1[0];
            addTable(
                ['kVp', 'Slice Thickness (mm)', 'mA'],
                [[
                    t1.kvp || '',
                    t1.sliceThickness || '',
                    t1.ma || ''
                ]]
            );
        }

        // Timer Accuracy Table with Set Time, Observed Time, % Error, Remarks
        if (data.timerAccuracy.table2 && data.timerAccuracy.table2.length > 0) {
            const table2Rows = data.timerAccuracy.table2.map((row: any) => {
                // Calculate % Error if not present
                let percentError = row.percentError || '';
                if (!percentError && row.setTime && row.observedTime) {
                    const set = parseFloat(row.setTime);
                    const observed = parseFloat(row.observedTime);
                    if (!isNaN(set) && !isNaN(observed) && set !== 0) {
                        percentError = (((observed - set) / set) * 100).toFixed(2);
                    }
                }

                return [
                    row.setTime || '',
                    row.observedTime || '',
                    percentError || '',
                    row.remarks || ''
                ];
            });
            // Match the image format: "Applied Time in mSec", "Measured Time in mSec", "% Error", "Result"
            addTable(['Applied Time in mSec', 'Measured Time in mSec', '% Error', 'Result'], table2Rows);
        }

        if (data.timerAccuracy.tolerance) {
            allData.push(['Tolerance:', `± ${data.timerAccuracy.tolerance}%`]);
            allData.push([]);
        }
    }

    // 5. Linearity of mAs Loading (if no timer)
    if (!hasTimer && data.linearityOfMasLoading) {
        addSectionHeader('LINEARITY OF mAs LOADING');

        if (data.linearityOfMasLoading.exposureCondition) {
            allData.push(['Exposure Conditions']);
            allData.push([
                'FCD', data.linearityOfMasLoading.exposureCondition.fcd || '',
                'kV', data.linearityOfMasLoading.exposureCondition.kv || ''
            ]);
            allData.push([]);
        }

        if (data.linearityOfMasLoading.table2Rows && data.linearityOfMasLoading.table2Rows.length > 0) {
            const maxMeas = Math.max(...data.linearityOfMasLoading.table2Rows.map((r: any) =>
                (r.measuredOutputs || []).length
            ));

            const headers = ['mAs Range', ...Array.from({ length: maxMeas }, (_, i) => `Meas ${i + 1}`)];
            const table2Rows = data.linearityOfMasLoading.table2Rows.map((row: any) => {
                const outputs = row.measuredOutputs || [];
                return [
                    row.mAsRange || '',
                    ...Array.from({ length: maxMeas }, (_, i) => outputs[i] || '')
                ];
            });

            addTable(headers, table2Rows);
        }

        if (data.linearityOfMasLoading.tolerance) {
            allData.push(['Tolerance:', data.linearityOfMasLoading.tolerance]);
            allData.push([]);
        }
    }

    // 6. Measurement of CTDI
    if (data.measurementOfCTDI) {
        addSectionHeader('MEASUREMENT OF CTDI');

        // Operating Parameters
        if (data.measurementOfCTDI.table1?.[0]) {
            const t1 = data.measurementOfCTDI.table1[0];
            addTable(
                ['kVp', 'mAs', 'Slice Thickness (mm)'],
                [[
                    t1.kvp || '',
                    t1.mAs || '',
                    t1.sliceThickness || ''
                ]]
            );
        }

        // CTDI Results Table
        if (data.measurementOfCTDI.table2 && data.measurementOfCTDI.table2.length > 0) {
            // Build headers - simple structure matching UI
            const headers = ['Results', 'Head', 'Body'];

            const table2Rows: any[][] = [];
            data.measurementOfCTDI.table2.forEach((row: any) => {
                if (row.id === 'peripheral' && row.readings) {
                    // Add peripheral readings as separate rows
                    row.readings.forEach((reading: any) => {
                        table2Rows.push([
                            reading.label || '',
                            reading.head || '',
                            reading.body || ''
                        ]);
                    });
                } else {
                    table2Rows.push([
                        row.result || '',
                        row.head || '',
                        row.body || ''
                    ]);
                }
            });

            addTable(headers, table2Rows);
        } else if (data.measurementOfCTDI.table2Rows && data.measurementOfCTDI.table2Rows.length > 0) {
            // Alternative structure
            const headers = ['Results', 'Head', 'Body'];
            const table2Rows = data.measurementOfCTDI.table2Rows.map((row: any) => [
                row.result || '',
                row.head || '',
                row.body || ''
            ]);
            addTable(headers, table2Rows);
        }

        if (data.measurementOfCTDI.tolerance) {
            allData.push(['Tolerance']);
            allData.push([
                'Sign', data.measurementOfCTDI.tolerance.sign || '',
                'Value', data.measurementOfCTDI.tolerance.value || ''
            ]);
            allData.push([]);
        }
    }

    // 7. Total Filtration
    if (data.totalFiltration && data.totalFiltration.rows?.[0]) {
        addSectionHeader('TOTAL FILTRATION');
        const row = data.totalFiltration.rows[0];
        addTable(
            ['Applied KV', 'Applied MA', 'Time', 'Slice Thickness', 'Measured TF'],
            [[
                row.appliedKV || '',
                row.appliedMA || '',
                row.time || '',
                row.sliceThickness || '',
                row.measuredTF || ''
            ]]
        );
    }

    // 8. Radiation Leakage Level
    if (data.radiationLeakage) {
        addSectionHeader('RADIATION LEAKAGE LEVEL');

        if (data.radiationLeakage.settings) {
            allData.push(['Settings']);
            allData.push([
                'kV', data.radiationLeakage.settings.kv || '',
                'mA', data.radiationLeakage.settings.ma || '',
                'Time', data.radiationLeakage.settings.time || ''
            ]);
            allData.push([]);
        }

        if (data.radiationLeakage.workload) {
            allData.push(['Workload:', data.radiationLeakage.workload]);
        }

        if (data.radiationLeakage.toleranceValue || data.radiationLeakage.toleranceOperator) {
            allData.push(['Tolerance']);
            allData.push([
                'Value', data.radiationLeakage.toleranceValue || '',
                'Operator', data.radiationLeakage.toleranceOperator || '',
                'Time', data.radiationLeakage.toleranceTime || ''
            ]);
            allData.push([]);
        }

        if (data.radiationLeakage.leakageRows && data.radiationLeakage.leakageRows.length > 0) {
            const leakageRows = data.radiationLeakage.leakageRows.map((row: any) => [
                row.location || '',
                row.front || '',
                row.back || '',
                row.left || '',
                row.right || '',
                row.unit || ''
            ]);
            addTable(['Location', 'Front', 'Back', 'Left', 'Right', 'Unit'], leakageRows);
        }
    }

    // 9. Output Consistency
    if (data.outputConsistency) {
        addSectionHeader('OUTPUT CONSISTENCY');

        if (data.outputConsistency.parameters) {
            allData.push(['Test Parameters']);
            allData.push([
                'mAs', data.outputConsistency.parameters.mas || '',
                'Slice Thickness', data.outputConsistency.parameters.sliceThickness || '',
                'Time', data.outputConsistency.parameters.time || ''
            ]);
            allData.push([]);
        }

        if (data.outputConsistency.measurementCount) {
            allData.push(['Measurement Count:', data.outputConsistency.measurementCount]);
        }

        if (data.outputConsistency.tolerance) {
            allData.push(['Tolerance']);
            allData.push([
                'Operator', data.outputConsistency.tolerance.operator || '',
                'Value', data.outputConsistency.tolerance.value || ''
            ]);
            allData.push([]);
        }

        if (data.outputConsistency.outputRows && data.outputConsistency.outputRows.length > 0) {
            const maxMeas = Math.max(...data.outputConsistency.outputRows.map((r: any) =>
                (r.outputs || []).length
            ));

            const headers = ['kVp', ...Array.from({ length: maxMeas }, (_, i) => `Meas ${i + 1}`),
                'Mean', 'COV', 'Remark'];

            const outputRows = data.outputConsistency.outputRows.map((row: any) => {
                const outputs = row.outputs || [];
                return [
                    row.kvp || '',
                    ...Array.from({ length: maxMeas }, (_, i) => {
                        const val = outputs[i];
                        return (val && val.value) ? val.value : (val || '');
                    }),
                    row.mean || '',
                    row.cov || '',
                    row.remark || ''
                ];
            });

            addTable(headers, outputRows);
        }
    }

    // 10. Low Contrast Resolution
    if (data.lowContrastResolution) {
        addSectionHeader('LOW CONTRAST RESOLUTION');

        if (data.lowContrastResolution.acquisitionParams) {
            allData.push(['Acquisition Parameters']);
            allData.push([
                'kVp', data.lowContrastResolution.acquisitionParams.kvp || '',
                'mA', data.lowContrastResolution.acquisitionParams.ma || '',
                'Slice Thickness', data.lowContrastResolution.acquisitionParams.sliceThickness || '',
                'WW', data.lowContrastResolution.acquisitionParams.ww || ''
            ]);
            allData.push([]);
        }

        if (data.lowContrastResolution.result) {
            allData.push(['Result']);
            allData.push([
                'Observed Size', data.lowContrastResolution.result.observedSize || '',
                'Contrast Level', data.lowContrastResolution.result.contrastLevel || ''
            ]);
            allData.push([]);
        }
    }

    // 11. High Contrast Resolution
    if (data.highContrastResolution) {
        addSectionHeader('HIGH CONTRAST RESOLUTION');

        if (data.highContrastResolution.operatingParams) {
            allData.push(['Operating Parameters']);
            allData.push([
                'kVp', data.highContrastResolution.operatingParams.kvp || '',
                'mAs', data.highContrastResolution.operatingParams.mas || '',
                'Slice Thickness', data.highContrastResolution.operatingParams.sliceThickness || '',
                'WW', data.highContrastResolution.operatingParams.ww || ''
            ]);
            allData.push([]);
        }

        if (data.highContrastResolution.result) {
            allData.push(['Result']);
            allData.push([
                'Observed Size', data.highContrastResolution.result.observedSize || '',
                'Contrast Difference', data.highContrastResolution.result.contrastDifference || ''
            ]);
            allData.push([]);
        }

        if (data.highContrastResolution.tolerance) {
            allData.push(['Tolerance']);
            allData.push([
                'Contrast Difference', data.highContrastResolution.tolerance.contrastDifference || '',
                'Size', data.highContrastResolution.tolerance.size || '',
                'lp/cm', data.highContrastResolution.tolerance.lpCm || '',
                'Expected Size', data.highContrastResolution.tolerance.expectedSize || '',
                'Expected lp/cm', data.highContrastResolution.tolerance.expectedLpCm || ''
            ]);
            allData.push([]);
        }
    }

    // 12. Maximum Radiation Level (Radiation Protection Survey)
    if (data.radiationProtectionSurvey) {
        addSectionHeader('MAXIMUM RADIATION LEVEL');

        allData.push(['Survey Information']);
        allData.push([
            'Survey Date', data.radiationProtectionSurvey.surveyDate || '',
            'Valid Calibration', data.radiationProtectionSurvey.hasValidCalibration || '',
            'Applied Current', data.radiationProtectionSurvey.appliedCurrent || '',
            'Applied Voltage', data.radiationProtectionSurvey.appliedVoltage || '',
            'Exposure Time', data.radiationProtectionSurvey.exposureTime || '',
            'Workload', data.radiationProtectionSurvey.workload || ''
        ]);
        allData.push([]);

        if (data.radiationProtectionSurvey.locations && data.radiationProtectionSurvey.locations.length > 0) {
            const locationRows = data.radiationProtectionSurvey.locations.map((loc: any) => [
                loc.location || '',
                loc.mRPerHr || '',
                loc.category || ''
            ]);
            addTable(['Location', 'mR/hr', 'Category'], locationRows);
        }
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    const maxCols = Math.max(...allData.map(row => row.length));
    ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'CT Scan Test Data');

    return wb;
};

export const createCTScanUploadableExcel = (data: CTScanExportData, hasTimer: boolean): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    const addSection = (title: string, headers: string[], rows: any[][]) => {
        allData.push(['TEST: ' + title]);
        allData.push(headers);
        rows.forEach(row => allData.push(row));
        allData.push([]); // Empty row after each section
    };

    // 1. RADIATION PROFILE WIDTH
    if (data.radiationProfileWidth) {
        const t1 = data.radiationProfileWidth.table1?.[0] || {};
        const rows = (data.radiationProfileWidth.table2 || []).map((row: any) => [
            row.applied || '',
            row.measured || '',
            t1.kvp || '',
            t1.ma || ''
        ]);
        // If no table rows but we have t1 data, add one row
        if (rows.length === 0 && (t1.kvp || t1.ma)) {
            rows.push(['', '', t1.kvp, t1.ma]);
        }
        addSection('RADIATION PROFILE WIDTH FOR CT SCAN', ['Applied', 'Measured', 'kVp', 'mA'], rows);
    }

    // 2. MEASUREMENT OF OPERATING POTENTIAL
    if (data.measurementOfOperatingPotential) {
        const t1 = data.measurementOfOperatingPotential.table1?.[0] || {};
        const rows = (data.measurementOfOperatingPotential.table2 || []).map((row: any) => [
            row.setKV || '',
            row.ma10 || '',
            row.ma100 || '',
            row.ma200 || '',
            t1.time || '',
            t1.sliceThickness || '',
            data.measurementOfOperatingPotential.toleranceValue || '',
            data.measurementOfOperatingPotential.toleranceType || '',
            data.measurementOfOperatingPotential.toleranceSign || ''
        ]);
        if (rows.length === 0 && (t1.time || t1.sliceThickness)) {
            rows.push(['', '', '', '', t1.time, t1.sliceThickness, data.measurementOfOperatingPotential.toleranceValue || '', data.measurementOfOperatingPotential.toleranceType || '', data.measurementOfOperatingPotential.toleranceSign || '']);
        }
        addSection('MEASUREMENT OF OPERATING POTENTIAL', ['Set kV', '@ mA 10', '@ mA 100', '@ mA 200', 'Time (ms)', 'Slice Thickness (mm)', 'Tol Value', 'Tol Type', 'Tol Sign'], rows);
    }

    // 3. MEASUREMENT OF MA LINEARITY
    if (data.measurementOfMaLinearity) {
        const t1 = data.measurementOfMaLinearity.table1?.[0] || {};
        const rows = (data.measurementOfMaLinearity.table2 || []).map((row: any) => [
            t1.kvp || '',
            t1.sliceThickness || '',
            t1.time || '',
            row.mAsApplied || '',
            ...(row.measuredOutputs || []),
            row.avgOutput || '',
            row.x || '',
            row.xMax || '',
            row.xMin || '',
            row.col || '',
            row.remarks || ''
        ]);
        const measHeaders = (data.measurementOfMaLinearity.table2?.[0]?.measuredOutputs || []).map((_: any, i: number) => `Meas ${i + 1}`);
        addSection('MEASUREMENT OF MA LINEARITY', ['kVp', 'Slice Thickness (mm)', 'Time (ms)', 'mA Applied', ...measHeaders, 'Avg Output', 'X (mR/mAs)', 'X Max', 'X Min', 'CoL', 'Remarks'], rows);
    }

    // 4. TIMER ACCURACY
    if (data.timerAccuracy) {
        const t1 = data.timerAccuracy.table1?.[0] || {};
        const rows = (data.timerAccuracy.table2 || []).map((row: any) => {
            let percentError = row.percentError || '';
            if (!percentError && row.setTime && row.observedTime) {
                const set = parseFloat(row.setTime);
                const observed = parseFloat(row.observedTime);
                if (!isNaN(set) && !isNaN(observed) && set !== 0) {
                    percentError = (((observed - set) / set) * 100).toFixed(2);
                }
            }
            return [
                t1.kvp || '',
                t1.sliceThickness || '',
                t1.ma || '',
                row.setTime || '',
                row.observedTime || '',
                percentError,
                data.timerAccuracy.tolerance || ''
            ];
        });
        addSection('TIMER ACCURACY', ['kVp', 'Slice Thickness (mm)', 'mA', 'Set Time (ms)', 'Observed Time (ms)', '% Error', 'Tolerance (%)'], rows);
    }

    // 5. LINEARITY OF mAs LOADING
    if (!hasTimer && data.linearityOfMasLoading) {
        const cond = data.linearityOfMasLoading.exposureCondition || {};
        const rows = (data.linearityOfMasLoading.table2Rows || []).map((row: any) => [
            row.mAsRange || '',
            row.avgOutput || (row.measuredOutputs?.[0]) || '',
            cond.fcd || '',
            cond.kv || '',
            row.x || '',
            row.xMax || '',
            row.xMin || '',
            row.col || '',
            row.remarks || '',
            data.linearityOfMasLoading.tolerance || ''
        ]);
        addSection('LINEARITY OF MAS LOADING', ['mAs Range', 'Result', 'FCD', 'kV', 'X', 'X Max', 'X Min', 'CoL', 'Remarks', 'Tolerance'], rows);
    }

    // 6. MEASUREMENT OF CTDI
    if (data.measurementOfCTDI) {
        const t1 = data.measurementOfCTDI.table1?.[0] || {};
        const ctdiwRated = data.measurementOfCTDI.table2?.find((r: any) => r.id === 'ctdiwRated') || {};

        const paramRow = [
            t1.kvp || '',
            t1.mAs || '',
            t1.sliceThickness || '',
            ctdiwRated.head || '',
            ctdiwRated.body || '',
            data.measurementOfCTDI.tolerance?.value || '',
            data.measurementOfCTDI.tolerance?.sign || ''
        ];

        const dataRows = (data.measurementOfCTDI.table2 || [])
            .filter((r: any) => r.id === 'ctdic' || r.id === 'peripheral')
            .flatMap((r: any) => {
                if (r.id === 'ctdic') {
                    return [['', '', '', '', '', '', '', r.result || 'Axial Dose CTDIc', '', r.head || '', r.body || '']];
                }
                if (r.id === 'peripheral' && r.readings) {
                    return r.readings.map((rd: any) => ['', '', '', '', '', '', '', 'Peripheral Dose', rd.label || '', rd.head || '', rd.body || '']);
                }
                return [];
            });

        const rows = [[...paramRow, '', '', '', ''], ...dataRows];
        addSection('MEASUREMENT OF CTDI', ['kVp', 'mAs', 'Slice Thickness (mm)', 'CTDIw (Rated) Head', 'CTDIw (Rated) Body', 'Tol Value', 'Tol Sign', 'Type', 'Label', 'Head', 'Body'], rows);
    }

    // 7. TOTAL FILTRATION
    if (data.totalFiltration && data.totalFiltration.rows?.[0]) {
        const row = data.totalFiltration.rows[0];
        addSection('TOTAL FILTRATION', ['Applied KV', 'Applied MA', 'Time', 'Slice Thickness', 'Measured TF'], [[
            row.appliedKV || '',
            row.appliedMA || '',
            row.time || '',
            row.sliceThickness || '',
            row.measuredTF || ''
        ]]);
    }

    // 8. Radiation Leakage Level from X-Ray Tube House
    if (data.radiationLeakage) {
        const settings = data.radiationLeakage.measurementSettings?.[0] || {};
        const paramRow = [
            settings.kv || '',
            settings.ma || '',
            settings.time || '',
            data.radiationLeakage.workload || '',
            data.radiationLeakage.workloadUnit || '',
            data.radiationLeakage.tolerance || '',
            data.radiationLeakage.toleranceOperator || '',
            data.radiationLeakage.toleranceTime || ''
        ];

        const dataRows = (data.radiationLeakage.leakageMeasurements || []).map((r: any) => [
            '', '', '', '', '', '', '', '',
            r.location || '',
            r.front || '',
            r.back || '',
            r.left || '',
            r.right || ''
        ]);

        const rows = [[...paramRow, '', '', '', '', ''], ...dataRows];
        addSection('Radiation Leakage Level from X-Ray Tube House', ['kV', 'mA', 'Time (sec)', 'Workload', 'Workload Unit', 'Tol Value', 'Tol Operator', 'Tol Time', 'Location', 'Front', 'Back', 'Left', 'Right'], rows);
    }

    // 9. Reproducibility of Radiation Output (Consistency Test)
    if (data.outputConsistency) {
        const params = data.outputConsistency.parameters || {};
        const rows = (data.outputConsistency.outputRows || []).map((row: any) => [
            params.mas || '',
            params.sliceThickness || '',
            params.time || '',
            row.kvp || '',
            ...(row.outputs || []),
            row.mean || '',
            row.cov || '',
            data.outputConsistency.tolerance?.value || '',
            row.remark || ''
        ]);
        const measHeaders = (data.outputConsistency.outputRows?.[0]?.outputs || []).map((_: any, i: number) => `Meas ${i + 1}`);
        addSection('Reproducibility of Radiation Output (Consistency Test)', ['mAs', 'Slice Thickness (mm)', 'Time (s)', 'kVp', ...measHeaders, 'Mean', 'COV', 'Tolerance', 'Remark'], rows);
    }

    // 10. LOW CONTRAST RESOLUTION
    if (data.lowContrastResolution) {
        const p = data.lowContrastResolution.acquisitionParams || {};
        addSection('LOW CONTRAST RESOLUTION', ['Observed Size', 'Contrast Level', 'kVp', 'mA', 'Slice Thickness', 'WW'], [[
            data.lowContrastResolution.result?.observedSize || '',
            data.lowContrastResolution.result?.contrastLevel || '',
            p.kvp || '',
            p.ma || '',
            p.sliceThickness || '',
            p.ww || ''
        ]]);
    }

    // 11. HIGH CONTRAST RESOLUTION
    if (data.highContrastResolution) {
        const p = data.highContrastResolution.operatingParams || {};
        addSection('HIGH CONTRAST RESOLUTION', ['Observed Size', 'Contrast Difference', 'kVp', 'mAs', 'Slice Thickness', 'WW'], [[
            data.highContrastResolution.result?.observedSize || '',
            data.highContrastResolution.result?.contrastDifference || '',
            p.kvp || '',
            p.mas || '',
            p.sliceThickness || '',
            p.ww || ''
        ]]);
    }

    // 12. ALIGNMENT OF TABLE/GANTRY
    if (data.alignmentTableGantry) {
        // Combine sign and value if they are separate in the model
        const tolSign = data.alignmentTableGantry.toleranceSign === 'plus' ? '+' :
            data.alignmentTableGantry.toleranceSign === 'minus' ? '-' :
                data.alignmentTableGantry.toleranceSign === 'both' ? '±' : '';
        const tolValue = data.alignmentTableGantry.toleranceValue || '';
        const tolerance = tolValue ? (tolSign + tolValue) : '';

        addSection('ALIGNMENT OF TABLE/GANTRY', ['Result', 'Tolerance'], [[
            data.alignmentTableGantry.result || '',
            tolerance
        ]]);
    }

    // 13. TABLE POSITION
    if (data.tablePosition) {
        // Use tableIncrementation instead of incrementationRows
        const rows = (data.tablePosition.tableIncrementation || []).map((row: any) => [
            row.tablePosition || '',
            row.expected || '',
            row.measured || '',
            data.tablePosition.initialTablePosition || '',
            data.tablePosition.loadOnCouch || '',
            data.tablePosition.table2?.kvp || '',
            data.tablePosition.table2?.ma || '',
            data.tablePosition.table2?.sliceThickness || ''
        ]);
        addSection('TABLE POSITION', ['Table Position', 'Expected', 'Measured', 'Initial Pos', 'Load', 'kVp', 'mA', 'Slice Thickness'], rows);
    }

    // 14. GANTRY TILT
    if (data.gantryTilt) {
        const rows: any[][] = [];
        data.gantryTilt.parameters?.forEach((row: any) => {
            rows.push(['Parameter', row.name || '', row.value || '']);
        });
        data.gantryTilt.measurements?.forEach((row: any) => {
            rows.push(['Measurement', row.actual || '', row.measured || '']);
        });
        addSection('GANTRY TILT', ['Type', 'Name/Actual', 'Value/Measured'], rows);
    }

    // 15. RADIATION PROTECTION SURVEY
    if (data.radiationProtectionSurvey) {
        const rows = (data.radiationProtectionSurvey.locations || []).map((row: any) => [
            row.location || '',
            row.mRPerHr || '',
            row.category || '',
            data.radiationProtectionSurvey.surveyDate ? data.radiationProtectionSurvey.surveyDate.split('T')[0].split('-').reverse().join(' ') : '',
            data.radiationProtectionSurvey.hasValidCalibration || '',
            data.radiationProtectionSurvey.appliedCurrent || '',
            data.radiationProtectionSurvey.appliedVoltage || '',
            data.radiationProtectionSurvey.exposureTime || '',
            data.radiationProtectionSurvey.workload || ''
        ]);
        addSection('MAXIMUM RADIATION LEVEL', ['Location', 'mR/hr', 'Category', 'Date', 'Calibrated', 'mA', 'kV', 'Time', 'Workload'], rows);
    }

    const ws = XLSX.utils.aoa_to_sheet(allData);
    // Auto-size columns roughly
    ws['!cols'] = Array(10).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, ws, 'CT Scan Export');

    return wb;
};


