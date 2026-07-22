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
    const tc = it.testConditions || {};
    allData.push(['TEST: ACCURACY OF IRRADIATION TIME']);
    allData.push([
      'FDD (cm)',
      tc.fcd ?? tc.ffd ?? '',
      'kV',
      tc.kv ?? '',
      'mA',
      tc.ma ?? '',
    ]);
    const times = Array.isArray(it.irradiationTimes) ? it.irradiationTimes : [];
    if (times.length > 0) {
      allData.push(['Set Time (ms)', 'Measured Time 1 (ms)', 'Tolerance Operator', 'Tolerance Value (%)']);
      times.forEach((row: any, i: number) => {
        allData.push([
          row.setTime ?? '',
          row.measuredTime ?? row.measuredTime1 ?? '',
          i === 0 ? (it.toleranceOperator ?? it.tolerance?.operator ?? '') : '',
          i === 0 ? (it.toleranceValue ?? it.tolerance?.value ?? it.tolerance ?? '') : '',
        ]);
      });
    }
    allData.push([]);
  }

  // 3. LINEARITY OF mA / mAs LOADING
  const lma = unwrap(data.linearityOfMaLoading);
  if (lma) {
    const t1 = Array.isArray(lma.table1) ? lma.table1[0] || {} : lma.table1 || {};
    const table2 = Array.isArray(lma.table2) ? lma.table2 : [];
    const timeStr = t1.time != null ? String(t1.time).trim() : '';
    const hasTime = timeStr !== '';
    const title = hasTime ? 'LINEARITY OF mA LOADING' : 'LINEARITY OF mAs LOADING';
    const maxMeas = Math.max(
      0,
      ...table2.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
    );
    const measHeaders = resolveMeasHeaders(
      lma.measHeaders || lma.measurementHeaders,
      maxMeas,
      'Measured Output'
    );

    allData.push([`TEST: ${title}`]);
    if (hasTime) {
      allData.push([
        'FDD (cm)',
        t1.fcd ?? '',
        'kV',
        t1.kv ?? '',
        'Time (s)',
        timeStr,
      ]);
      allData.push(['mA Applied', ...measHeaders]);
      table2.forEach((row: any) => {
        const outs = Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
        allData.push([
          row.mAApplied ?? row.mAsApplied ?? row.ma ?? '',
          ...measHeaders.map((_: string, i: number) => cellStr(outs[i])),
        ]);
      });
    } else {
      allData.push(['FDD (cm)', t1.fcd ?? '', 'kV', t1.kv ?? '']);
      allData.push(['mAs Range', ...measHeaders]);
      table2.forEach((row: any) => {
        const outs = Array.isArray(row.measuredOutputs) ? row.measuredOutputs : [];
        allData.push([
          row.mAsRange ?? row.mAsApplied ?? row.ma ?? '',
          ...measHeaders.map((_: string, i: number) => cellStr(outs[i])),
        ]);
      });
    }
    allData.push(['Tolerance Operator', lma.toleranceOperator ?? '<=']);
    allData.push(['Tolerance Value (CoL)', lma.tolerance ?? '0.1']);
    if (lma.col != null && String(lma.col).trim() !== '') {
      allData.push(['CoL', lma.col]);
    }
    if (lma.remarks != null && String(lma.remarks).trim() !== '') {
      allData.push(['Remark', lma.remarks]);
    }
    allData.push([]);
  }

  // 4. OUTPUT CONSISTENCY
  const oc = unwrap(data.outputConsistency) || unwrap(data.consistencyOfRadiationOutput);
  if (oc) {
    const ffdVal = oc.ffd?.value ?? oc.ffd ?? '';
    const outputRows = Array.isArray(oc.outputRows) ? oc.outputRows : [];
    const maxMeas = Math.max(
      0,
      ...outputRows.map((r: any) => (Array.isArray(r.outputs) ? r.outputs.length : 0))
    );
    const headerLabels = resolveMeasHeaders(
      oc.measurementHeaders || oc.measHeaders || oc.outputHeaders,
      maxMeas,
      'Output'
    );
    allData.push(['TEST: CONSISTENCY OF RADIATION OUTPUT']);
    allData.push(['FDD (cm)', ffdVal]);
    allData.push(['kVp', 'mAs', ...headerLabels, 'Average', 'CoV', 'Remark']);
    outputRows.forEach((row: any) => {
      const outs = Array.isArray(row.outputs) ? row.outputs : [];
      allData.push([
        row.kv ?? row.kvp ?? '',
        row.mas ?? row.mAs ?? '',
        ...headerLabels.map((_: string, i: number) => cellStr(outs[i])),
        row.avg ?? row.average ?? row.mean ?? '',
        row.cv ?? row.cov ?? '',
        row.remark ?? row.remarks ?? '',
      ]);
    });
    const tolOp = oc.tolerance?.operator ?? oc.toleranceOperator ?? '<=';
    const tolVal = oc.tolerance?.value ?? oc.toleranceValue ?? (typeof oc.tolerance === 'object' ? '' : oc.tolerance) ?? '0.05';
    allData.push(['Tolerance Operator', tolOp]);
    allData.push(['Tolerance Value (CoV)', typeof tolVal === 'object' ? '' : tolVal]);
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
        row.left || '',
        row.right || '',
        row.top || '',
        row.up || '',
        row.down || '',
        row.max || row.maxLeakage || '',
        row.unit || '',
        row.remark || row.remarks || '',
      ]);
      addSection(
        'RADIATION LEAKAGE LEVEL FROM X-RAY TUBE HOUSE',
        ['Location', 'Left', 'Right', 'Top', 'Up', 'Down', 'Max Leakage', 'Unit', 'Remark'],
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
