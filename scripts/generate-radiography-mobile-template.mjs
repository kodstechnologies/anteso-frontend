/**
 * Generate Radiography Mobile With Timer / No Timer Excel templates.
 * Run from anteso-frontend: npx tsx src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/RadiographyMobile/generateTemplate.ts
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const templateScript = path.join(
  root,
  "src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/RadiographyMobile/generateTemplate.ts"
);

const result = spawnSync("npx", ["tsx", templateScript], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
