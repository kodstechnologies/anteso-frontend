import * as XLSX from 'xlsx';

export const createOPGUploadableExcel = (data: any) => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    // Helper to add a section with a header row
    const addSection = (title: string, headers: string[], rows: any[][]) => {
        allData.push([`TEST: ${title}`]); // Section Title with TEST: prefix
        allData.push(headers); // Column Headers
        rows.forEach(row => allData.push(row));
        allData.push([]); // Empty row for spacing
    };

    // 1. ACCURACY OF OPERATING POTENTIAL
    if (data.accuracyOfOperatingPotential) {
        // Data has 'measurements' array with 'measuredValues' array inside
        // Key: measurements -> [ { appliedKvp, measuredValues: [], averageKvp, remarks } ]
        const rows = (data.accuracyOfOperatingPotential.measurements || []).map((row: any) => [
            row.appliedKvp || '',
            ...(row.measuredValues || []),
            row.averageKvp || '',
            row.remarks || ''
        ]);

        if (rows.length > 0) {
            // Calculate dynamic headers based on max measured values
            const maxMeas = Math.max(...(data.accuracyOfOperatingPotential.measurements || []).map((r: any) => (r.measuredValues || []).length));
            const subHeaders = Array.from({ length: maxMeas }, (_, i) => `mA ${i + 1}`);
            const headers = ['Applied kVp', ...subHeaders, 'Average kVp', 'Remarks'];
            addSection('ACCURACY OF OPERATING POTENTIAL', headers, rows);
        }

        // Add Total Filtration Section if present
        if (data.accuracyOfOperatingPotential.totalFiltration) {
            const tf = data.accuracyOfOperatingPotential.totalFiltration;
            const tfRows = [[
                'TotalFiltration',
                tf.measured || '',
                tf.required || '',
                tf.atKvp || ''
            ]];
            // Header: Parameter, Measured, Required, atKvp
            const tfHeaders = ['Parameter', 'Measured (mm Al)', 'Required (mm Al)', 'At kVp'];
            addSection('TOTAL FILTRATION', tfHeaders, tfRows);
        }
    }

    // 2. ACCURACY OF IRRADIATION TIME
    if (data.accuracyOfIrradiationTime) {
        const table1 = data.accuracyOfIrradiationTime.table1 || {};
        const rows = (data.accuracyOfIrradiationTime.irradiationTimes || []).map((row: any) => {
            const set = parseFloat(row.setTime);
            const meas = parseFloat(row.measuredTime);
            let error = '';
            if (!isNaN(set) && !isNaN(meas) && set !== 0) {
                error = Math.abs((meas - set) / set * 100).toFixed(2);
            }

            return [
                row.setTime || '',
                row.measuredTime || '',
                error,
                '' // Remarks
            ];
        });

        if (rows.length > 0 || table1.fcd) {
            const settingsHeader = ['FCD', table1.fcd || '', 'kV', table1.kv || '', 'mA', table1.ma || ''];
            const headers = ['Set Time (mSec)', 'Measured Time (mSec)', '% Error'];
            addSection('ACCURACY OF IRRADIATION TIME', headers, [settingsHeader, ...rows]);
        }
    }

    // 3. LINEARITY OF mA / mAs LOADING
    if (data.linearityOfMaLoading) {
        const table1 = data.linearityOfMaLoading.table1 || {};
        const isMaLoading = table1.time && table1.time.trim() !== '';

        const rows = (data.linearityOfMaLoading.table2 || []).map((row: any) => [
            row.ma || '',
            ...(row.measuredOutputs || []),
            row.average || '',
            row.x || ''
        ]);

        if (rows.length > 0 || table1.fcd) {
            const settingsHeader = ['FCD', table1.fcd || '', 'kV', table1.kv || '', 'Timer', table1.time || ''];
            const maxMeas = Math.max(...(data.linearityOfMaLoading.table2 || []).map((r: any) => (r.measuredOutputs || []).length));
            const measHeaders = Array.from({ length: Math.max(0, maxMeas) }, (_, i) => `Measured mR ${i + 1}`);

            if (isMaLoading) {
                const headers = ['mA Station', ...measHeaders, 'Average', 'mR/mAs'];
                addSection('LINEARITY OF mA LOADING', headers, [settingsHeader, ...rows]);
            } else {
                const headers = ['mAs Range', ...measHeaders, 'Average', 'mR/mAs'];
                addSection('LINEARITY OF mAs LOADING', headers, [settingsHeader, ...rows]);
            }
        }
    }

    // 4. OUTPUT CONSISTENCY
    if (data.outputConsistency) {
        const rows = (data.outputConsistency.outputRows || []).map((row: any) => [
            row.kvp || '',
            row.mas || '',
            ...(row.outputs || []),
            row.mean || '',
            row.cov || '',
            row.remarks || ''
        ]);

        if (rows.length > 0) {
            const settingsHeader = ['FFD', data.outputConsistency.ffd || ''];
            const maxMeas = Math.max(...(data.outputConsistency.outputRows || []).map((r: any) => (r.outputs || []).length));
            const measHeaders = Array.from({ length: Math.max(0, maxMeas) }, (_, i) => `Meas ${i + 1}`);
            const headers = ['kVp', 'mAs', ...measHeaders, 'Mean', 'CoV', 'Remarks'];
            addSection('CONSISTENCY OF RADIATION OUTPUT', headers, [settingsHeader, ...rows]);
        }
    }

    // 5. RADIATION LEAKAGE LEVEL
    if (data.radiationLeakage) {
        const s = data.radiationLeakage.settings?.[0] || {};
        const rows = (data.radiationLeakage.leakageMeasurements || []).map((row: any) => [
            row.location || '',
            row.left || '',
            row.right || '',
            row.top || '',
            row.up || '',
            row.down || '',
            row.max || '',
            row.unit || '',
            row.remark || ''
        ]);

        if (rows.length > 0) {
            const settingsHeader = ['FFD', s.ffd || '', 'kVp', s.kvp || '', 'mA', s.ma || '', 'Time', s.time || '', 'Tolerance', data.radiationLeakage.toleranceValue || ''];
            const workloadHeader = ['Workload', data.radiationLeakage.workload || ''];
            const headers = ['Location', 'Left', 'Right', 'Top', 'Up', 'Down', 'Max Leakage', 'Unit', 'Remark'];
            addSection('RADIATION LEAKAGE LEVEL FROM X-RAY TUBE HOUSE', headers, [settingsHeader, workloadHeader, ...rows]);
        }
    }

    // 6. RADIATION PROTECTION SURVEY
    if (data.radiationProtectionSurvey) {
        const rows = (data.radiationProtectionSurvey.locations || []).map((row: any) => [
            row.location || '',
            row.mRPerHr || '',
            row.category || ''
        ]);

        if (rows.length > 0) {
            const settingsHeader = [
                'Survey Date', data.radiationProtectionSurvey.surveyDate || '',
                'Applied Current (mA)', data.radiationProtectionSurvey.appliedCurrent || '',
                'Applied Voltage (kV)', data.radiationProtectionSurvey.appliedVoltage || '',
                'Exposure Time (s)', data.radiationProtectionSurvey.exposureTime || '',
                'Workload (mA.min/week)', data.radiationProtectionSurvey.workload || ''
            ];
            const headers = ['LOCATION', 'MAX. RADIATION LEVEL (MR/HR)', 'RESULT'];
            addSection('RADIATION PROTECTION SURVEY REPORT', headers, [settingsHeader, ...rows]);
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, ws, "Service Report Data");

    return wb;
};
