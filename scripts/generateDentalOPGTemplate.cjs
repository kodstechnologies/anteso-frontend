/**
 * Generate Dental OPG With Timer / No Timer Excel templates.
 * Run: node scripts/generateDentalOPGTemplate.cjs
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
  "OPG",
  "generateTemplate.ts"
);

execSync(`npx tsx "${script}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
