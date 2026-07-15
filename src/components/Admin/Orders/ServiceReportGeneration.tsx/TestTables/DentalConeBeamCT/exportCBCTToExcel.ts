import * as XLSX from 'xlsx';

const unwrap = (raw: any) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && (raw.data.measurements || raw.data.table2 || raw.data.outputRows || raw.data._id)) {
    return raw.data;
  }
  return raw;
};

const cellStr = (v: any): string => {
  if (v == null) return '';
  if (typeof v === 'object' && 'value' in v) return String((v as any).value ?? '');
  return String(v);
};

/** Prefer saved custom headers; pad to match measurement column count. */
const resolveMeasHeaders = (
  saved: any,
  maxFromRows: number,
  fallbackPrefix: string
): string[] => {
  const cleaned = Array.isArray(saved)
    ? saved.map((h: any) => String(h ?? '').trim()).filter(Boolean)
    : [];
  const count = Math.max(maxFromRows, cleaned.length);
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => cleaned[i] || `${fallbackPrefix} ${i + 1}`);
};

export const createCBCTUploadableExcel = (data: any) => {
  const wb = XLSX.utils.book_new();
  const allData: any[][] = [];

  const addSection = (title: string, headers: string[], rows: any[][]) => {
    allData.push([`TEST: ${title}`]);
    allData.push(headers);
    rows.forEach((row) => allData.push(row));
    allData.push([]);
  };

  // 1. ACCURACY OF OPERATING POTENTIAL
  const aop = unwrap(data.accuracyOfOperatingPotential);
  if (aop) {
    const measurements = Array.isArray(aop.measurements) ? aop.measurements : [];
    const tolSign = aop.tolerance?.sign || aop.tolerance?.type || '±';
    const tolVal = aop.tolerance?.value ?? '5';

    allData.push(['TEST: ACCURACY OF OPERATING POTENTIAL']);
    allData.push(['Tolerance Sign', tolSign]);
    allData.push(['Tolerance Value (kVp)', tolVal]);

    if (measurements.length > 0) {
      const maxMeas = Math.max(
        0,
        ...measurements.map((r: any) => (Array.isArray(r.measuredValues) ? r.measuredValues.length : 0))
      );
      const stationHeaders = resolveMeasHeaders(aop.mAStations, maxMeas, 'mA');
      const headers = ['Applied kVp', ...stationHeaders, 'Average kVp', 'Remarks'];
      allData.push(headers);
      measurements.forEach((row: any) => {
        const vals = Array.isArray(row.measuredValues) ? row.measuredValues : [];
        allData.push([
          row.appliedKvp || '',
          ...stationHeaders.map((_: string, i: number) => cellStr(vals[i])),
          row.averageKvp || '',
          row.remarks || '',
        ]);
      });
    }
    allData.push([]);

    if (aop.totalFiltration) {
      const tf = aop.totalFiltration;
      addSection(
        'TOTAL FILTRATION',
        ['Parameter', 'Measured (mm Al)', 'Required (mm Al)', 'At kVp'],
        [['TotalFiltration', tf.measured || '', tf.required || '', tf.atKvp || '']]
      );
    }
  }

  // 2. ACCURACY OF IRRADIATION TIME
  const it = unwrap(data.accuracyOfIrradiationTime);
  if (it) {
    if (it.testConditions) {
      const tc = it.testConditions;
      addSection('ACCURACY OF IRRADIATION TIME - CONDITIONS', ['kV', 'mA', 'FCD'], [
        [tc.kv || '', tc.ma || '', tc.fcd || ''],
      ]);
    }

    const times = Array.isArray(it.irradiationTimes) ? it.irradiationTimes : [];
    if (times.length > 0) {
      const rows = times.map((row: any) => {
        const set = parseFloat(row.setTime);
        const meas = parseFloat(row.measuredTime);
        let error = '';
        if (!isNaN(set) && !isNaN(meas) && set !== 0) {
          error = Math.abs(((meas - set) / set) * 100).toFixed(2);
        }
        return [row.setTime || '', row.measuredTime || '', error, row.remarks || row.remark || ''];
      });
      addSection(
        'ACCURACY OF IRRADIATION TIME',
        ['Set Time (mSec)', 'Measured Time (mSec)', '% Error', 'Remarks'],
        rows
      );
    }
  }

  // 3. LINEARITY OF mA / mAs LOADING
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma) {
    const t1 = Array.isArray(lma.table1) ? lma.table1[0] || {} : lma.table1 || {};
    if (t1 && (t1.kv || t1.time || t1.fcd)) {
      addSection('LINEARITY OF mA/mAs LOADING - CONDITIONS', ['kV', 'time', 'FCD'], [
        [t1.kv || '', t1.time || '', t1.fcd || ''],
      ]);
    }

    const table2 = Array.isArray(lma.table2) ? lma.table2 : [];
    if (table2.length > 0) {
      const isMaLoading = t1?.time != null && String(t1.time).trim() !== '';
      const maxMeas = Math.max(
        0,
        ...table2.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
      );
      const measHeaders = resolveMeasHeaders(
        lma.measHeaders || lma.measurementHeaders,
        maxMeas,
        'Measured mR'
      );

      const rows = table2.map((row: any) => {
        const outs = Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
        return [
          row.ma || row.mAApplied || row.mAsApplied || row.mAsRange || '',
          ...measHeaders.map((_: string, i: number) => cellStr(outs[i])),
          row.average || '',
          row.x || '',
        ];
      });

      if (isMaLoading) {
        addSection('LINEARITY OF mA LOADING', ['mA Station', ...measHeaders, 'Average', 'mR/mAs'], rows);
      } else {
        addSection('LINEARITY OF mAs LOADING', ['mAs Range', ...measHeaders, 'Average', 'mR/mAs'], rows);
      }

      if (lma.col != null && String(lma.col).trim() !== '') {
        allData.push(['CoL', lma.col]);
      }
      if (lma.remarks != null && String(lma.remarks).trim() !== '') {
        allData.push(['Remark', lma.remarks]);
      }
      allData.push([]);
    }
  }

  // 4. OUTPUT CONSISTENCY
  const oc = unwrap(data.outputConsistency) || unwrap(data.consistencyOfRadiationOutput);
  if (oc) {
    const tolOp = oc.tolerance?.operator ?? oc.toleranceOperator ?? '<=';
    const tolVal = oc.tolerance?.value ?? oc.toleranceValue ?? (typeof oc.tolerance === 'object' ? '' : oc.tolerance) ?? '0.05';

    allData.push(['TEST: CONSISTENCY OF RADIATION OUTPUT']);
    allData.push(['Tolerance Operator', tolOp]);
    allData.push(['Tolerance Value (CoV)', tolVal]);

    if (oc.ffd != null && String(oc.ffd).trim() !== '') {
      allData.push(['FFD', oc.ffd]);
    }

    const outputRows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
    if (outputRows.length > 0) {
      const maxMeas = Math.max(
        0,
        ...outputRows.map((r: any) => (Array.isArray(r.outputs) ? r.outputs.length : 0))
      );
      const measHeaders = resolveMeasHeaders(
        oc.measurementHeaders || oc.measHeaders || oc.outputHeaders,
        maxMeas,
        'Meas'
      );

      allData.push(['kVp', 'mAs', ...measHeaders, 'Mean', 'CoV', 'Remarks']);
      outputRows.forEach((row: any) => {
        const outs = Array.isArray(row.outputs) ? row.outputs : [];
        allData.push([
          row.kvp || row.kv || '',
          row.mas || row.mAs || '',
          ...measHeaders.map((_: string, i: number) => cellStr(outs[i])),
          row.mean || row.avg || '',
          row.cov || row.cv || '',
          row.remarks || row.remark || '',
        ]);
      });
    }
    allData.push([]);
  }

  // 5. RADIATION LEAKAGE LEVEL
  const rl = unwrap(data.radiationLeakage) || unwrap(data.radiationLeakageLevel);
  if (rl) {
    if (rl.kvp || rl.ma || rl.ffd || rl.time || rl.settings) {
      const s = rl.settings || {};
      addSection('RADIATION LEAKAGE LEVEL - CONDITIONS', ['kV', 'mA', 'FFD', 'Time'], [
        [rl.kvp || s.kv || '', rl.ma || s.ma || '', rl.ffd || s.fcd || s.ffd || '', rl.time || s.time || ''],
      ]);
    }

    const leaks = Array.isArray(rl.leakageMeasurements) ? rl.leakageMeasurements : [];
    if (leaks.length > 0) {
      const rows = leaks.map((row: any) => [
        row.location || '',
        row.front || '',
        row.back || '',
        row.left || '',
        row.right || '',
        row.max || row.maxLeakage || '',
        row.unit || '',
        row.remark || row.remarks || '',
      ]);
      addSection(
        'RADIATION LEAKAGE LEVEL FROM X-RAY TUBE HOUSE',
        ['Location', 'Front', 'Back', 'Left', 'Right', 'Max Leakage', 'Unit', 'Remark'],
        rows
      );
    }
  }

  // 6. RADIATION PROTECTION SURVEY
  const rps = unwrap(data.radiationProtectionSurvey);
  if (rps) {
    if (rps.appliedVoltage || rps.appliedCurrent || rps.exposureTime || rps.workload) {
      addSection('RADIATION PROTECTION SURVEY - CONDITIONS', ['kV', 'mA', 'Time', 'Workload'], [
        [rps.appliedVoltage || '', rps.appliedCurrent || '', rps.exposureTime || '', rps.workload || ''],
      ]);
    }

    const locs = Array.isArray(rps.locations) ? rps.locations : [];
    if (locs.length > 0) {
      const rows = locs.map((row: any) => [
        row.location || '',
        row.mRPerHr || '',
        row.mRPerWeek || '',
        row.result || '',
        row.calculatedResult || '',
      ]);
      addSection(
        'RADIATION PROTECTION SURVEY REPORT',
        ['LOCATION', 'MAX. RADIATION LEVEL (MR/HR)', 'MR/WEEK', 'STATUS', 'RESULT'],
        rows
      );
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(allData.length ? allData : [['No data']]);
  XLSX.utils.book_append_sheet(wb, ws, 'Service Report Data');
  return wb;
};
