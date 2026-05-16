#!/usr/bin/env bun
import { createSqliteDatabase } from "../src/db";

const databasePath = Bun.env.DB_PATH ?? "character-sheet.sqlite3";
const runtime = createSqliteDatabase({ path: databasePath });
runtime.close();

console.log(`Created and seeded SQLite database at ${databasePath}`);
