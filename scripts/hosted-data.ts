#!/usr/bin/env bun
import { copyFile, mkdir, rename, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Database } from "bun:sqlite";
import { createSqliteDatabase } from "../src/db";

export interface HostedDataOptions {
  backupDir?: string;
  confirm?: string;
  databasePath?: string;
  restoreSource?: string;
  timestamp?: Date;
}

const defaultDatabasePath = () => Bun.env.DB_PATH ?? "character-sheet.sqlite3";
const defaultBackupDir = () => Bun.env.HOSTED_BACKUP_DIR ?? "data/backups";

export async function migrateHostedData(options: HostedDataOptions = {}) {
  const databasePath = options.databasePath ?? defaultDatabasePath();
  await ensureParentDirectory(databasePath);
  const runtime = createSqliteDatabase({ path: databasePath, seed: false });
  runtime.close();

  return databasePath;
}

export async function prepareHostedData(options: HostedDataOptions = {}) {
  const databasePath = options.databasePath ?? defaultDatabasePath();
  const confirm = options.confirm ?? Bun.env.HOSTED_DATA_CONFIRM;
  const existingSize = await fileSize(databasePath);

  if (existingSize > 0 && confirm !== "seed-existing") {
    throw new Error(
      `Refusing to seed existing database at ${databasePath}. Back it up first, then set HOSTED_DATA_CONFIRM=seed-existing.`,
    );
  }

  await ensureParentDirectory(databasePath);
  const runtime = createSqliteDatabase({ path: databasePath, seed: true });
  runtime.close();

  return databasePath;
}

export async function backupHostedData(options: HostedDataOptions = {}) {
  const databasePath = options.databasePath ?? defaultDatabasePath();
  const backupDir = options.backupDir ?? defaultBackupDir();
  const existingSize = await fileSize(databasePath);

  if (existingSize === 0) {
    throw new Error(`Cannot back up missing or empty database at ${databasePath}.`);
  }

  await mkdir(backupDir, { recursive: true });
  const backupPath = join(
    backupDir,
    `character-sheet-${formatTimestamp(options.timestamp ?? new Date())}.sqlite3`,
  );
  const database = new Database(databasePath, { readonly: true });
  try {
    database.run(`vacuum into ${quoteSqlString(backupPath)}`);
  } finally {
    database.close();
  }

  return backupPath;
}

export async function restoreHostedData(options: HostedDataOptions = {}) {
  const databasePath = options.databasePath ?? defaultDatabasePath();
  const restoreSource = options.restoreSource ?? Bun.env.HOSTED_RESTORE_SOURCE;
  const confirm = options.confirm ?? Bun.env.HOSTED_DATA_CONFIRM;

  if (!restoreSource) throw new Error("Set HOSTED_RESTORE_SOURCE to the backup file to restore.");
  if (confirm !== "replace") {
    throw new Error("Refusing to replace the database. Set HOSTED_DATA_CONFIRM=replace to restore.");
  }
  if ((await fileSize(restoreSource)) === 0) {
    throw new Error(`Cannot restore missing or empty backup at ${restoreSource}.`);
  }

  await ensureParentDirectory(databasePath);
  const temporaryPath = `${databasePath}.restore-tmp`;
  await copyFile(restoreSource, temporaryPath);
  await rename(temporaryPath, databasePath);

  return databasePath;
}

async function ensureParentDirectory(path: string) {
  const parent = dirname(resolve(path));
  await mkdir(parent, { recursive: true });
}

async function fileSize(path: string) {
  try {
    return (await stat(path)).size;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return 0;
    throw error;
  }
}

function formatTimestamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:]/g, "");
}

function quoteSqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

if (import.meta.main) {
  const command = Bun.argv[2];

  if (command === "migrate") {
    console.log(`Migrated SQLite schema at ${await migrateHostedData()}`);
  } else if (command === "prepare") {
    console.log(`Prepared hosted SQLite database at ${await prepareHostedData()}`);
  } else if (command === "backup") {
    console.log(`Created hosted SQLite backup at ${await backupHostedData()}`);
  } else if (command === "restore") {
    console.log(`Restored hosted SQLite database at ${await restoreHostedData()}`);
  } else {
    console.error("Usage: bun scripts/hosted-data.ts <migrate|prepare|backup|restore>");
    process.exit(1);
  }
}
