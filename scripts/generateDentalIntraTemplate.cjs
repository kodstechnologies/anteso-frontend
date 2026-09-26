/**
 * Generate Dental Intra single Excel/CSV template (matches generate UI).
 * Run: node scripts/generateDentalIntraTemplate.cjs
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
  "DentalIntra",
  "generateTemplate.ts"
);

execSync(`npx tsx "${script}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
