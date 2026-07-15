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
        const aop = data.accuracyOfOperatingPotential;
        const tolSign = aop.tolerance?.sign || aop.tolerance?.type || '±';
        const tolVal = aop.tolerance?.value ?? '5';
        const measurements = aop.measurements || [];

        const maxMeas = measurements.length > 0
            ? Math.max(...measurements.map((r: any) => (r.measuredValues || []).length), 0)
            : 0;
        const stations = Array.isArray(aop.mAStations) && aop.mAStations.length > 0
            ? aop.mAStations
            : Array.from({ length: Math.max(maxMeas, 2) }, (_, i) => `mA ${i + 1}`);
        const headers = ['Applied kVp', ...stations.slice(0, Math.max(maxMeas, stations.length)), 'Average kVp', 'Remarks'];
        const rows = measurements.map((row: any) => [
            row.appliedKvp || '',
            ...stations.slice(0, Math.max(maxMeas, stations.length)).map((_: any, i: number) => (row.measuredValues || [])[i] ?? ''),
            row.averageKvp || '',
            row.remarks || ''
        ]);

        allData.push(['TEST: ACCURACY OF OPERATING POTENTIAL']);
        allData.push(['Tolerance Sign', tolSign]);
        allData.push(['Tolerance Value (kVp)', tolVal]);
        if (rows.length > 0) {
            allData.push(headers);
            rows.forEach((row: any[]) => allData.push(row));
        }
        allData.push([]);

        // Add Total Filtration Section if present
        if (aop.totalFiltration) {
            const tf = aop.totalFiltration;
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
        const oc = data.outputConsistency;
        const tolOp = oc.toleranceOperator ?? oc.tolerance?.operator ?? '<=';
        const tolVal = oc.tolerance?.value ?? oc.toleranceValue ?? (typeof oc.tolerance === 'object' ? '' : oc.tolerance) ?? '0.05';

        allData.push(['TEST: CONSISTENCY OF RADIATION OUTPUT']);
        allData.push(['Tolerance Operator', tolOp]);
        allData.push(['Tolerance Value (CoV)', tolVal]);
        if (oc.ffd != null && String(oc.ffd).trim() !== '') {
            allData.push(['FFD', oc.ffd]);
        }

        const rows = (oc.outputRows || []).map((row: any) => [
            row.kvp || '',
            row.mas || '',
            ...(row.outputs || []),
            row.mean || '',
            row.cov || '',
            row.remarks || ''
        ]);

        if (rows.length > 0) {
            const maxMeas = Math.max(...(oc.outputRows || []).map((r: any) => (r.outputs || []).length));
            const measHeaders = Array.from({ length: Math.max(0, maxMeas) }, (_, i) => `Meas ${i + 1}`);
            const headers = ['kVp', 'mAs', ...measHeaders, 'Mean', 'CoV', 'Remarks'];
            allData.push(headers);
            rows.forEach((row: any[]) => allData.push(row));
        }
        allData.push([]);
    }

    // 5. RADIATION LEAKAGE LEVEL — Exposure Level (mGy): Front, Back, Left, Right (same as UI)
    if (data.radiationLeakage) {
        const settingsArr = data.radiationLeakage.measurementSettings || data.radiationLeakage.settings;
        const s = Array.isArray(settingsArr) ? (settingsArr[0] || {}) : (settingsArr || {});
        const rows = (data.radiationLeakage.leakageMeasurements || []).map((row: any) => [
            row.location || '',
            row.front ?? row.top ?? '',
            row.back ?? row.up ?? '',
            row.left || '',
            row.right || '',
            row.max || row.maxLeakage || '',
            row.unit || '',
            row.remark || row.remarks || ''
        ]);

        if (rows.length > 0 || s.kv || s.kvp || s.ma) {
            const settingsHeader = [
                'FFD', s.ffd || s.fcd || '',
                'kVp', s.kvp || s.kv || '',
                'mA', s.ma || '',
                'Time', s.time || '',
                'Tolerance', data.radiationLeakage.toleranceValue || data.radiationLeakage.tolerance || ''
            ];
            const workloadHeader = ['Workload', data.radiationLeakage.workload || ''];
            const headers = ['Location', 'Front', 'Back', 'Left', 'Right', 'Max', 'Unit', 'Remark'];
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
