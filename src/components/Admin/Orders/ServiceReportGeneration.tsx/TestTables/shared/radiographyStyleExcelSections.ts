/** Radiography-Fixed-style vertical Excel sections shared by C-Arm / O-Arm templates. */

const pad = (n: number) => Array(n).fill("");

export const appendRadiographyStyleSection = (rows: any[][], title: string, lines: any[][]) => {
  rows.push([`TEST: ${title}`, ...pad(9)]);
  lines.forEach((line) => rows.push([...line, ...pad(Math.max(0, 10 - line.length))]));
  rows.push([]);
};

export const totalFiltrationSection = (): any[][] => [
  ["Tolerance Sign", "±"],
  ["Tolerance Value (kVp)", "2.0"],
  ["Total Filtration Required (mm Al)", "2.5"],
  ["Total Filtration At kVp", "80"],
  ["mA Station 1", "50"],
  ["mA Station 2", "100"],
  ["mA Station 3", "200"],
  ["Applied kVp", "Measured 1", "Measured 2", "Measured 3"],
  ["60", "60.1", "60.2", "60.0"],
  ["80", "80.1", "80.2", "80.0"],
  ["100", "100.1", "100.2", "100.0"],
  ["120", "120.1", "120.2", "120.0"],
];

export const outputConsistencySection = (): any[][] => [
  ["FDD (cm)", "100"],
  ["Time (s)", "1.0"],
  ["kVp", "mAs", "Measured Output 1", "Measured Output 2", "Measured Output 3", "Measured Output 4", "Measured Output 5"],
  ["80", "100", "10.5", "10.4", "10.6", "10.5", "10.5"],
  ["100", "100", "12.1", "12.0", "12.2", "12.1", "12.0"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoV)", "0.02"],
];

/** O-Arm includes irradiation time in output consistency parameters. */
export const oarmOutputConsistencySection = (): any[][] => [
  ["FDD (cm)", "100"],
  ["Time (s)", "1.0"],
  ["kVp", "mAs", "Measured Output 1", "Measured Output 2", "Measured Output 3", "Measured Output 4", "Measured Output 5"],
  ["80", "100", "1.52", "1.53", "1.51", "1.54", "1.52"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoV)", "0.02"],
];

export const linearityMaSection = (): any[][] => [
  ["FDD (cm)", "100", "kV", "80", "Time (s)", "0.1"],
  ["mA Applied", "Measured Output 1", "Measured Output 2", "Measured Output 3"],
  ["50", "0.10", "0.11", "0.09"],
  ["100", "0.20", "0.21", "0.19"],
  ["200", "0.40", "0.41", "0.39"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
];

export const linearityMasSection = (): any[][] => [
  ["FDD (cm)", "100", "kV", "80"],
  ["mAs", "Measured Output 1", "Measured Output 2", "Measured Output 3"],
  ["5", "0.50", "0.51", "0.49"],
  ["10", "1.00", "1.01", "0.99"],
  ["20", "2.50", "2.51", "2.49"],
  ["50", "5.00", "5.01", "4.99"],
  ["Tolerance Operator", "<="],
  ["Tolerance Value (CoL)", "0.1"],
];
