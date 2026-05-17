import { createSqliteDatabase } from "../src/db";
import { RulesImportService } from "../src/rules";

const databasePath = process.env.DB_PATH ?? "character-sheet.sqlite3";
const sourcePath = process.argv[2] ?? "docs/rules";

const runtime = createSqliteDatabase({ path: databasePath });

try {
  const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
  const result = await importer.importFromLocalSource(sourcePath);

  console.log(`Imported ${result.imported} rules from ${sourcePath} into ${databasePath}`);
} finally {
  runtime.close();
}
