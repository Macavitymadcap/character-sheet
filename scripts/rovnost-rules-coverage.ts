import { createSqliteDatabase } from "../src/db";
import {
  buildRovnostCoverageReport,
  formatRovnostCoverageReport,
  relinkLynottPrivateRuleLinks,
} from "../src/rules/rovnost-coverage";

const databasePath = process.env.DB_PATH ?? "character-sheet.sqlite3";
const args = process.argv.slice(2);
const sourceFilesPath = args.find((arg) => !arg.startsWith("--")) ?? process.env.PRIVATE_RULES_SOURCE_PATH ?? "/data/private-rules";
const applyLinks = args.includes("--apply-links") || process.env.ROVNOST_RULES_APPLY_LINKS === "1";
const runtime = createSqliteDatabase({ path: databasePath });

try {
  if (applyLinks) {
    const result = relinkLynottPrivateRuleLinks(runtime.database);
    console.log(`Relinked Lynott private rule links: ${result.updated}`);
  }

  const report = buildRovnostCoverageReport(runtime.database, { sourceFilesPath });
  console.log(formatRovnostCoverageReport(report));

  const hasMissingSource = report.sources.some((source) => source.importedCount === 0);
  const hasMissingLink = report.lynottRules.some((rule) => !rule.usesPrivateLink);
  const hasPublicLeak = report.privateRulesVisiblePublicly > 0;
  if (hasMissingSource || hasMissingLink || hasPublicLeak) process.exitCode = 1;
} finally {
  runtime.close();
}
