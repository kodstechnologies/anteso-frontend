/**
 * Generate C-Arm With Timer / No Timer Excel templates.
 * Run: node scripts/generateCArmTemplate.cjs
 * Or:  npx tsx src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/CArm/generateTemplate.ts
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
  "CArm",
  "generateTemplate.ts"
);

execSync(`npx tsx "${script}"`, { stdio: "inherit", cwd: path.join(__dirname, "..") });
