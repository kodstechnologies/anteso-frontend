import * as XLSX from 'xlsx';
import { resolveMeasHeaders, resolveExcelMeasHeaders, getMeasuredOutputs, cellStr } from '../shared/exportMeasHeaders';

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
        const stations = resolveMeasHeaders(aop.mAStations, maxMeas, 'mA');
        const headers = ['Applied kVp', ...stations, 'Average kVp', 'Remarks'];
        const rows = measurements.map((row: any) => [
            row.appliedKvp || '',
            ...stations.map((_: any, i: number) => (row.measuredValues || [])[i] ?? ''),
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
            const settingsHeader = ['FDD (cm)', table1.fcd || '', 'kV', table1.kv || '', 'mA', table1.ma || ''];
            const headers = ['Set Time (mSec)', 'Measured Time (mSec)', '% Error'];
            addSection('ACCURACY OF IRRADIATION TIME', headers, [settingsHeader, ...rows]);
        }
    }

    // 3. LINEARITY OF mA / mAs LOADING
    if (data.linearityOfMaLoading) {
        const table1 = data.linearityOfMaLoading.table1 || {};
        const isMaLoading = table1.time && table1.time.trim() !== '';

        const table2 = data.linearityOfMaLoading.table2 || [];
        if (table2.length > 0 || table1.fcd) {
            const settingsHeader = ['FDD (cm)', table1.fcd || '', 'kV', table1.kv || '', 'Timer', table1.time || ''];
            const maxMeas = Math.max(0, ...table2.map((r: any) => getMeasuredOutputs(r).length));
            const measHeaders = resolveExcelMeasHeaders(
                data.linearityOfMaLoading.measHeaders || data.linearityOfMaLoading.measurementHeaders,
                maxMeas,
                'Measured Output'
            );

            const alignedRows = table2.map((row: any) => {
                const outs = getMeasuredOutputs(row);
                return [
                    row.ma || row.mAsRange || row.mAsApplied || '',
                    ...measHeaders.map((_, i) => outs[i] ?? ''),
                    row.average || '',
                    row.x || ''
                ];
            });

            if (isMaLoading) {
                const headers = ['mA Station', ...measHeaders, 'Average', 'mR/mAs'];
                addSection('LINEARITY OF mA LOADING', headers, [settingsHeader, ...alignedRows]);
            } else {
                const headers = ['mAs Range', ...measHeaders, 'Average', 'mR/mAs'];
                addSection('LINEARITY OF mAs LOADING', headers, [settingsHeader, ...alignedRows]);
            }
            if (data.linearityOfMaLoading.tolerance != null || data.linearityOfMaLoading.toleranceOperator) {
                allData.push(['Tolerance Operator', data.linearityOfMaLoading.toleranceOperator || '<=']);
                allData.push(['Tolerance Value (CoL)', data.linearityOfMaLoading.tolerance || '0.1']);
                allData.push([]);
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
            allData.push(['FDD (cm)', oc.ffd]);
        }

        const outputRows = oc.outputRows || [];
        if (outputRows.length > 0) {
            const maxMeas = Math.max(0, ...outputRows.map((r: any) => getMeasuredOutputs(r).length));
            const measHeaders = resolveExcelMeasHeaders(
                oc.measurementHeaders || oc.measHeaders || oc.outputHeaders,
                maxMeas,
                'Output'
            );
            const headers = ['kVp', 'mAs', ...measHeaders, 'Mean', 'CoV', 'Remarks'];
            allData.push(headers);
            outputRows.forEach((row: any) => {
                const outs = getMeasuredOutputs(row);
                allData.push([
                    row.kvp || row.kv || '',
                    row.mas || '',
                    ...measHeaders.map((_, i) => outs[i] ?? ''),
                    row.mean || row.avg || '',
                    row.cov || row.cv || '',
                    row.remarks || row.remark || ''
                ]);
            });
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
                'FDD (cm)', s.ffd || s.fdd || s.fcd || '',
                'kV', s.kvp || s.kv || '',
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
