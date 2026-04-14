// Helper file for Radiography Portable Excel export with proper table structures
import * as XLSX from "xlsx";

export interface RadiographyPortableExportData {
    congruenceOfRadiation?: any;
    centralBeamAlignment?: any;
    effectiveFocalSpot?: any;
    accuracyOfIrradiationTime?: any;
    accuracyOfOperatingPotential?: any;
    linearityOfMasLoadingStations?: any;
    consistencyOfRadiationOutput?: any;
    radiationLeakageLevel?: any;
}

export const createRadiographyPortableUploadableExcel = (data: RadiographyPortableExportData, hasTimer: boolean): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    const addSection = (title: string, headers: string[], rows: any[][]) => {
        allData.push(['TEST: ' + title]);
        allData.push(headers);
        rows.forEach(row => allData.push(row));
        allData.push([]); // Empty row after each section
    };

    // 1. CONGRUENCE OF RADIATION & OPTICAL FIELD
    if (data.congruenceOfRadiation) {
        const settings = data.congruenceOfRadiation.settings || {};
        const rows = (data.congruenceOfRadiation.measurements || []).map((row: any) => [
            settings.fcd || '',
            settings.kvp || '',
            settings.mas || '',
            settings.fieldSize || '',
            row.deviationX || '',
            row.deviationY || '',
            row.totalDeviation || '',
            row.edgeShiftX ?? row.edgeShift ?? '',
            row.edgeShiftY ?? row.edgeShift ?? '',
            data.congruenceOfRadiation.tolerance?.value || '',
            row.remarks || ''
        ]);
        if (rows.length === 0 && (settings.fcd || settings.kvp)) {
            rows.push([settings.fcd || '', settings.kvp || '', settings.mas || '', settings.fieldSize || '', '', '', '', '', '', data.congruenceOfRadiation.tolerance?.value || '', '']);
        }
        addSection('CONGRUENCE OF RADIATION & OPTICAL FIELD', ['FCD (cm)', 'kVp', 'mAs', 'Field Size (cm)', 'Deviation X (cm)', 'Deviation Y (cm)', 'Total Deviation (cm)', 'Shift in Edges X (cm)', 'Shift in Edges Y (cm)', 'Tolerance (cm)', 'Remarks'], rows);
    }

    // 2. CENTRAL BEAM ALIGNMENT
    if (data.centralBeamAlignment) {
        const settings = data.centralBeamAlignment.settings || data.centralBeamAlignment.techniqueFactors || {};
        const rows = (data.centralBeamAlignment.measurements || []).map((row: any) => [
            settings.fcd || '',
            settings.kv || settings.kvp || '',
            settings.mas || '',
            row.observedTilt || row.value || (data.centralBeamAlignment.observedTilt?.value) || '',
            data.centralBeamAlignment.tolerance?.value || '1.5',
            row.remarks || data.centralBeamAlignment.observedTilt?.remark || ''
        ]);
        if (rows.length === 0 && (settings.fcd || settings.kv || data.centralBeamAlignment.observedTilt)) {
            rows.push([
                settings.fcd || '',
                settings.kv || '',
                settings.mas || '',
                data.centralBeamAlignment.observedTilt?.value || '',
                data.centralBeamAlignment.tolerance?.value || '1.5',
                data.centralBeamAlignment.observedTilt?.remark || ''
            ]);
        }
        addSection('CENTRAL BEAM ALIGNMENT', ['FCD (cm)', 'kV', 'mAs', 'Observed Tilt (deg)', 'Tolerance (deg)', 'Remarks'], rows);
    }

    // 3. EFFECTIVE FOCAL SPOT MEASUREMENT
    if (data.effectiveFocalSpot) {
        const settings = data.effectiveFocalSpot.settings || { fcd: data.effectiveFocalSpot.fcd };
        const rows = (data.effectiveFocalSpot.focalSpots || data.effectiveFocalSpot.measurements || []).map((row: any) => [
            settings.fcd || '',
            row.focusType || row.direction || '',
            row.statedWidth || '',
            row.statedHeight || '',
            row.measuredWidth || row.measured || '',
            row.measuredHeight || '',
            row.remark || row.remarks || ''
        ]);
        if (rows.length === 0 && settings.fcd) {
            rows.push([settings.fcd || '', 'Large Focus', '', '', '', '', '']);
            rows.push([settings.fcd || '', 'Small Focus', '', '', '', '', '']);
        }
        addSection('EFFECTIVE FOCAL SPOT MEASUREMENT', ['FCD (cm)', 'Focus Type', 'Stated Width', 'Stated Height', 'Measured Width', 'Measured Height', 'Remarks'], rows);
    }

    // 4. ACCURACY OF IRRADIATION TIME (only if hasTimer)
    if (hasTimer && data.accuracyOfIrradiationTime) {
        const settings = data.accuracyOfIrradiationTime.settings || data.accuracyOfIrradiationTime.testConditions || {};
        const rows = (data.accuracyOfIrradiationTime.irradiationTimes || []).map((row: any) => {
            let percentError = row.percentError || '';
            if (!percentError && row.setTime && row.measuredTime) {
                const set = parseFloat(row.setTime);
                const measured = parseFloat(row.measuredTime);
                if (!isNaN(set) && !isNaN(measured) && set !== 0) {
                    percentError = (((measured - set) / set) * 100).toFixed(2);
                }
            }
            return [
                settings.fcd || '',
                settings.kv || '',
                settings.ma || '',
                row.setTime || '',
                row.measuredTime || '',
                percentError,
                data.accuracyOfIrradiationTime.tolerance?.value || '10',
                row.remarks || ''
            ];
        });
        if (rows.length === 0 && (settings.kv || settings.ma)) {
            rows.push([settings.fcd || '', settings.kv || '', settings.ma || '', '', '', '', data.accuracyOfIrradiationTime.tolerance?.value || '10', '']);
        }
        addSection('ACCURACY OF IRRADIATION TIME', ['FCD (cm)', 'kV', 'mA', 'Set Time (ms)', 'Measured Time (ms)', '% Error', 'Tolerance (%)', 'Remarks'], rows);
    }

    // 5. ACCURACY OF OPERATING POTENTIAL (supports measurements + mAStations or table2)
    if (data.accuracyOfOperatingPotential) {
        const aop = data.accuracyOfOperatingPotential;
        const settings = aop.table1?.[0] || aop.settings || {};
        const useMeasurements = Array.isArray(aop.measurements) && aop.measurements.length > 0;
        const stations = (useMeasurements && aop.mAStations?.length) ? aop.mAStations : ['@ mA 10', '@ mA 100', '@ mA 200'];
        const sectionRows = (useMeasurements ? aop.measurements : (aop.table2 || [])).map((row: any) => {
            const applied = useMeasurements ? row.appliedKvp : row.setKV;
            const cells = useMeasurements ? (row.measuredValues || []) : [row.ma10, row.ma100, row.ma200];
            const avg = useMeasurements ? row.averageKvp : row.avgKvp;
            return [
                settings.time || '',
                settings.sliceThickness || '',
                applied || '',
                ...stations.map((_: string, j: number) => cells[j] ?? ''),
                avg || '',
                aop.tolerance?.value || aop.toleranceValue || '5',
                row.remarks || ''
            ];
        });
        if (sectionRows.length === 0 && (settings.time || settings.sliceThickness)) {
            sectionRows.push([settings.time || '', settings.sliceThickness || '', '', ...stations.map(() => ''), '', aop.tolerance?.value || aop.toleranceValue || '5', '']);
        }
        addSection('ACCURACY OF OPERATING POTENTIAL', ['Time (ms)', 'Slice Thickness (mm)', 'Set kVp', ...stations, 'Measured kVp', 'Tolerance (%)', 'Remarks'], sectionRows);
        // Total Filtration (same document as AOP)
        if (aop.totalFiltration && (aop.totalFiltration.required !== '' || aop.totalFiltration.atKvp !== '')) {
            const tf = aop.totalFiltration;
            addSection('TOTAL FILTRATION', ['At kVp', 'Required (mm Al)', 'Measured (mm Al)'], [[tf.atKvp || '', tf.required || '', tf.measured || '']]);
        }
    }

    // 6. LINEARITY OF mAs LOADING STATIONS
    if (data.linearityOfMasLoadingStations) {
        const settings = data.linearityOfMasLoadingStations.table1?.[0] || data.linearityOfMasLoadingStations.settings || {};
        const rows = (data.linearityOfMasLoadingStations.table2 || data.linearityOfMasLoadingStations.measurements || []).map((row: any) => [
            settings.fcd || '',
            settings.kv || '',
            row.mAsApplied || row.mAsRange || '',
            ...(row.measuredOutputs || ['', '', '']),
            row.average || '',
            row.x || '',
            data.linearityOfMasLoadingStations.tolerance || data.linearityOfMasLoadingStations.tolerance?.value || '0.1',
            row.remarks || ''
        ]);
        if (rows.length === 0 && (settings.fcd || settings.kv)) {
            rows.push([settings.fcd || '', settings.kv || '', '', '', '', '', '', '', data.linearityOfMasLoadingStations.tolerance || '0.1', '']);
        }
        addSection('LINEARITY OF mAs LOADING STATIONS', ['FCD (cm)', 'kV', 'mAs', 'Meas 1', 'Meas 2', 'Meas 3', 'Average', 'X (mGy/mAs)', 'Tolerance (%)', 'Remarks'], rows);
    }

    // 7. CONSISTENCY OF RADIATION OUTPUT
    if (data.consistencyOfRadiationOutput) {
        const settings = data.consistencyOfRadiationOutput.ffd || data.consistencyOfRadiationOutput.settings || {};
        const rows = (data.consistencyOfRadiationOutput.outputRows || data.consistencyOfRadiationOutput.measurements || []).map((row: any) => [
            settings.value || '',
            row.kv || '',
            row.mas || '',
            ...(row.outputs || row.readings || []).map((o: any) => o.value || o),
            row.average || row.mean || '',
            row.cov || '',
            data.consistencyOfRadiationOutput.tolerance?.value || '5',
            row.remark || row.remarks || ''
        ]);
        if (rows.length === 0 && settings.value) {
            rows.push([settings.value || '', '', '', '', '', '', '', '', '', '', data.consistencyOfRadiationOutput.tolerance?.value || '5', '']);
        }
        addSection('CONSISTENCY OF RADIATION OUTPUT', ['FCD (cm)', 'kVp', 'mAs', 'Reading 1', 'Reading 2', 'Reading 3', 'Reading 4', 'Reading 5', 'Mean', 'COV (%)', 'Tolerance (%)', 'Remarks'], rows);
    }

    // 8. TUBE HOUSING LEAKAGE LEVEL
    if (data.radiationLeakageLevel) {
        const settings = data.radiationLeakageLevel.settings || { fcd: data.radiationLeakageLevel.fcd, kv: data.radiationLeakageLevel.kv, ma: data.radiationLeakageLevel.ma, time: data.radiationLeakageLevel.time };
        const rows = (data.radiationLeakageLevel.leakageMeasurements || data.radiationLeakageLevel.measurements || []).map((row: any) => [
            settings.fcd || '',
            settings.kv || '',
            settings.ma || '',
            settings.time || '',
            data.radiationLeakageLevel.workload || '',
            row.location || '',
            row.front || '',
            row.back || '',
            row.left || '',
            row.right || '',
            row.top || '',
            data.radiationLeakageLevel.toleranceValue || data.radiationLeakageLevel.tolerance?.value || '1.0',
            row.remarks || ''
        ]);
        if (rows.length === 0 && (settings.kv || settings.ma)) {
            rows.push([settings.fcd || '', settings.kv || '', settings.ma || '', settings.time || '', data.radiationLeakageLevel.workload || '', '', '', '', '', '', '', data.radiationLeakageLevel.toleranceValue || '1.0', '']);
        }
        addSection('TUBE HOUSING LEAKAGE LEVEL', ['FCD (cm)', 'kVp', 'mA', 'Time (s)', 'Workload', 'Location', 'Front (mR/h)', 'Back (mR/h)', 'Left (mR/h)', 'Right (mR/h)', 'Top (mR/h)', 'Tolerance (mR/h)', 'Remarks'], rows);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    const maxCols = Math.max(...allData.map(row => row.length));
    ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Radiography Portable Test Data');

    return wb;
};
