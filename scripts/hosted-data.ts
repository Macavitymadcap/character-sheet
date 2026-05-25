#!/usr/bin/env bun
import { copyFile, cp, mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Database } from "bun:sqlite";
import { assetStorageRoot, writeSeedAssetPlaceholders } from "../src/assets";
import { createSqliteDatabase } from "../src/db";
import { RulesImportService } from "../src/rules";

export interface HostedDataOptions {
  assetRoot?: string;
  backupDir?: string;
  confirm?: string;
  databasePath?: string;
  persistenceMode?: string;
  skipAssetBackup?: boolean;
  skipAssetRestore?: boolean;
  skipSeedAssets?: boolean;
  skipRulesImport?: boolean;
  restoreSource?: string;
  timestamp?: Date;
}

interface HostedBackupManifest {
  assetRoot: string;
  assetSnapshotPath: string | null;
  assetTotals: {
    bytes: number;
    files: number;
  };
  backupPath: string;
  createdAt: string;
  databasePath: string;
  mode: typeof hostedPersistenceMode;
}

export const hostedPersistenceMode = "sqlite-volume";

const defaultDatabasePath = () => Bun.env.DB_PATH ?? "character-sheet.sqlite3";
const defaultBackupDir = () => Bun.env.HOSTED_BACKUP_DIR ?? "data/backups";
const defaultPersistenceMode = () => Bun.env.HOSTED_PERSISTENCE_MODE ?? hostedPersistenceMode;

export async function migrateHostedData(options: HostedDataOptions = {}) {
  assertHostedPersistenceMode(options);
  const databasePath = options.databasePath ?? defaultDatabasePath();
  assertHostedDatabasePath(databasePath);
  await ensureParentDirectory(databasePath);
  const runtime = createSqliteDatabase({ path: databasePath, seed: false });
  runtime.close();

  return databasePath;
}

export async function prepareHostedData(options: HostedDataOptions = {}) {
  assertHostedPersistenceMode(options);
  const databasePath = options.databasePath ?? defaultDatabasePath();
  assertHostedDatabasePath(databasePath);
  const confirm = options.confirm ?? Bun.env.HOSTED_DATA_CONFIRM;
  const existingSize = await fileSize(databasePath);

  if (existingSize > 0 && confirm !== "seed-existing") {
    throw new Error(
      `Refusing to seed existing database at ${databasePath}. Back it up first, then set HOSTED_DATA_CONFIRM=seed-existing.`,
    );
  }

  await ensureParentDirectory(databasePath);
  const runtime = createSqliteDatabase({ path: databasePath, seed: true });
  try {
    if (!options.skipRulesImport) {
      await new RulesImportService(runtime.repositories.rulesSeedRepository)
        .importFromLocalSource("docs/rules/srd-5.1");
    }
  } finally {
    runtime.close();
  }
  if (!options.skipSeedAssets) {
    await writeSeedAssetPlaceholders(options.assetRoot ?? assetStorageRoot());
  }

  return databasePath;
}

export async function backupHostedData(options: HostedDataOptions = {}) {
  assertHostedPersistenceMode(options);
  const databasePath = options.databasePath ?? defaultDatabasePath();
  assertHostedDatabasePath(databasePath);
  const backupDir = options.backupDir ?? defaultBackupDir();
  const assetRoot = options.assetRoot ?? assetStorageRoot();
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
  const assetSnapshotPath = hostedBackupAssetSnapshotPath(backupPath);
  const shouldCreateAssetSnapshot = !options.skipAssetBackup;
  if (shouldCreateAssetSnapshot && await pathExists(assetRoot)) {
    await rm(assetSnapshotPath, { force: true, recursive: true });
    await cp(assetRoot, assetSnapshotPath, { force: true, recursive: true });
  } else if (shouldCreateAssetSnapshot) {
    await rm(assetSnapshotPath, { force: true, recursive: true });
    await mkdir(assetSnapshotPath, { recursive: true });
  }
  const manifest: HostedBackupManifest = {
    assetRoot,
    assetSnapshotPath: shouldCreateAssetSnapshot ? assetSnapshotPath : null,
    assetTotals: shouldCreateAssetSnapshot
      ? await collectFileTotals(assetSnapshotPath)
      : { bytes: 0, files: 0 },
    backupPath,
    createdAt: (options.timestamp ?? new Date()).toISOString(),
    databasePath,
    mode: hostedPersistenceMode,
  };
  await writeFile(hostedBackupManifestPath(backupPath), `${JSON.stringify(manifest, null, 2)}\n`);

  return backupPath;
}

export async function restoreHostedData(options: HostedDataOptions = {}) {
  assertHostedPersistenceMode(options);
  const databasePath = options.databasePath ?? defaultDatabasePath();
  assertHostedDatabasePath(databasePath);
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
  const assetSnapshotPath = hostedBackupAssetSnapshotPath(restoreSource);
  const restoreAssets = !options.skipAssetRestore && await pathExists(assetSnapshotPath);
  const assetRoot = options.assetRoot ?? assetStorageRoot();
  const temporaryAssetRoot = `${assetRoot}.restore-tmp`;
  if (restoreAssets) {
    await rm(temporaryAssetRoot, { force: true, recursive: true });
    await cp(assetSnapshotPath, temporaryAssetRoot, { force: true, recursive: true });
  }

  await copyFile(restoreSource, temporaryPath);
  await rename(temporaryPath, databasePath);
  if (restoreAssets) {
    await rm(assetRoot, { force: true, recursive: true });
    await ensureParentDirectory(assetRoot);
    await rename(temporaryAssetRoot, assetRoot);
  }

  return databasePath;
}

export function describeHostedPersistence(options: HostedDataOptions = {}) {
  assertHostedPersistenceMode(options);

  return {
    assetRoot: options.assetRoot ?? assetStorageRoot(),
    backupDir: options.backupDir ?? defaultBackupDir(),
    databasePath: options.databasePath ?? defaultDatabasePath(),
    mode: hostedPersistenceMode,
  };
}

export function hostedBackupAssetSnapshotPath(backupPath: string) {
  return backupPath.replace(/\.sqlite3$/, "-assets");
}

export function hostedBackupManifestPath(backupPath: string) {
  return backupPath.replace(/\.sqlite3$/, ".manifest.json");
}

function assertHostedPersistenceMode(options: HostedDataOptions) {
  const mode = options.persistenceMode ?? defaultPersistenceMode();
  if (mode === hostedPersistenceMode) return;

  throw new Error(
    `Unsupported hosted persistence mode "${mode}". Campaign Ledger currently accepts only "${hostedPersistenceMode}"; plan a migration before changing storage backends.`,
  );
}

function assertHostedDatabasePath(databasePath: string) {
  if (databasePath !== ":memory:") return;

  throw new Error("Hosted data operations require a file-backed SQLite database, not DB_PATH=:memory:.");
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

async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function collectFileTotals(root: string) {
  let files = 0;
  let bytes = 0;
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      const childTotals = await collectFileTotals(path);
      files += childTotals.files;
      bytes += childTotals.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(path)).size;
    }
  }

  return { bytes, files };
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
    const backupPath = await backupHostedData();
    console.log(`Created hosted SQLite backup at ${backupPath}`);
    console.log(`Hosted asset snapshot path: ${hostedBackupAssetSnapshotPath(backupPath)}`);
    console.log(`Created hosted backup manifest at ${hostedBackupManifestPath(backupPath)}`);
  } else if (command === "restore") {
    console.log(`Restored hosted SQLite database at ${await restoreHostedData()}`);
  } else if (command === "status") {
    const status = describeHostedPersistence();
    console.log(`Hosted persistence mode: ${status.mode}`);
    console.log(`Database path: ${status.databasePath}`);
    console.log(`Asset root: ${status.assetRoot}`);
    console.log(`Backup directory: ${status.backupDir}`);
  } else {
    console.error("Usage: bun scripts/hosted-data.ts <migrate|prepare|backup|restore|status>");
    process.exit(1);
  }
}
