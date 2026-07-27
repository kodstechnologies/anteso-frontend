const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(
  path.join(__dirname, '../public/templates/RadiographyMobileHT_Test_Data_Template_WithTimer.csv'),
  'utf8',
);
const lines = text.split(/\r?\n/).filter((l) => l.trim());
const parseLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result;
};
const rows = lines.map(parseLine);
const i = rows.findIndex((r) => r[0].includes('OPERATING POTENTIAL'));
const header = rows[i + 1];
const dataRow = rows[i + 2];
console.log('Header:', header);
console.log('Data:', dataRow);
const colIdxExact = (hdr, ...names) => {
  for (const name of names) {
    const idx = hdr.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
};
const atIdx = colIdxExact(header, 'Total Filtration At kVp', 'At kVp');
console.log('At kVp exact idx:', atIdx, 'val:', dataRow[atIdx]);
const reqIdx = header.findIndex((h) => h.includes('Required'));
console.log('Required idx:', reqIdx, 'val:', dataRow[reqIdx]);
