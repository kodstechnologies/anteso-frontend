/**
 * Generate Dental CBCT With Timer / No Timer Excel templates.
 * Run: node scripts/generateDentalCBCTTemplate.cjs
 */
const { execSync } = require("child_process");
const path = require("path");

const script = path.join(
  __dirname,
  "..",
  "src",
  "components",
  "Admin",
  "Orders",
  "ServiceReportGeneration.tsx",
  "TestTables",
  "DentalConeBeamCT",
  "generateTemplate.ts"
);

execSync(`npx tsx "${script}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
