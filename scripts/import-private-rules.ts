import { createSqliteDatabase } from "../src/db";
import { RulesImportService } from "../src/rules";
import {
  buildRovnostCoverageReport,
  formatRovnostCoverageReport,
  relinkLynottPrivateRuleLinks,
} from "../src/rules/rovnost-coverage";

const databasePath = process.env.DB_PATH ?? "character-sheet.sqlite3";
const sourcePath = process.argv[2] ?? "/data/private-rules";
const campaignId = process.env.PRIVATE_RULES_CAMPAIGN_ID ?? "campaign_rovnost_shadows";
const backupReference = process.env.PRIVATE_RULES_BACKUP_REFERENCE ?? null;
const backupConfirmed = process.env.PRIVATE_RULES_BACKUP_CONFIRMED === "1" || Boolean(backupReference);

if (sourcePath.startsWith("/data/private-rules") && !backupConfirmed) {
  throw new Error(
    "Confirm a hosted backup before importing production private rules: set PRIVATE_RULES_BACKUP_CONFIRMED=1 or PRIVATE_RULES_BACKUP_REFERENCE=<backup manifest>.",
  );
}

const runtime = createSqliteDatabase({ path: databasePath });

try {
  const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
  const result = await importer.importPrivateYaml(sourcePath, {
    backupConfirmed,
    backupReference,
    campaignId,
  });

  console.log(`Imported ${result.imported} private rules from ${sourcePath} into ${databasePath}`);
  console.log(`Campaign: ${campaignId}`);
  console.log(`Backup confirmed: ${result.backupConfirmed ? "yes" : "no"}`);
  if (result.backupReference) console.log(`Backup reference: ${result.backupReference}`);
  console.log(`Skipped files: ${result.skippedFiles.length}`);
  console.log(`Failed files: ${result.failedFiles.length}`);
  console.log(`Duplicate entries: ${result.duplicateEntries.length}`);
  console.log(`Shadowed SRD entries: ${result.shadowedSrdEntries.length}`);
  for (const [sourceSlug, count] of Object.entries(result.sourceCounts)) {
    console.log(`Source ${sourceSlug}: ${count}`);
  }
  for (const failure of result.failedFiles) {
    console.log(`Failed ${failure.filePath}: ${failure.message}`);
  }
  for (const entry of result.duplicateEntries) console.log(`Duplicate ${entry}`);
  for (const entry of result.shadowedSrdEntries) console.log(`Shadowed SRD ${entry}`);
  const relinkResult = relinkLynottPrivateRuleLinks(runtime.database, { campaignId });
  console.log(`Relinked Lynott private rule links: ${relinkResult.updated}`);
  console.log(formatRovnostCoverageReport(buildRovnostCoverageReport(runtime.database, {
    campaignId,
    sourceFilesPath: sourcePath,
  })));
} finally {
  runtime.close();
}
