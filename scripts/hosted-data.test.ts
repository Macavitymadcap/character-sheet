import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import {
  backupHostedData,
  describeHostedPersistence,
  migrateHostedData,
  prepareHostedData,
  restoreHostedData,
} from "./hosted-data";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { force: true, recursive: true });
  tempDir = undefined;
});

async function createTempDir() {
  tempDir = await mkdtemp(join(tmpdir(), "character-sheet-hosted-data-"));

  return tempDir;
}

describe("hosted data operations", () => {
  const hostedDataTimeout = 20_000;

  test("prepares a fresh hosted-style database with seeded group data", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    const assetRoot = join(dir, "assets");

    await prepareHostedData({ assetRoot, databasePath });

    const database = new Database(databasePath, { readonly: true });
    expect(database.query("select count(*) as count from users").get()).toEqual({ count: 6 });
    expect(database.query("select count(*) as count from characters").get()).toEqual({ count: 2 });
    expect(database.query("select count(*) as count from rule_mechanics").get()).toEqual({ count: 1773 });
    expect(database.query("select count(*) as count from rules_entities where source_id = ?").get("rules_source_srd_5_1"))
      .toEqual({ count: 1773 });
    expect(database.query("select storage_key as storageKey from campaign_image_assets where id = ?").get("asset_skywright_sigil"))
      .toEqual({ storageKey: "campaigns/rovnost-shadows/skywright-sigil.png" });
    expect((await stat(join(assetRoot, "campaigns/rovnost-shadows/skywright-sigil.png"))).size).toBeGreaterThan(0);
    expect((await stat(join(assetRoot, "campaigns/rovnost-shadows/astril-map.png"))).size).toBeGreaterThan(0);
    database.close();
  }, hostedDataTimeout);

  test("migrates an existing database without reseeding mutable data", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    await prepareHostedData({ databasePath });
    const database = new Database(databasePath);
    database.run("update users set display_name = ? where id = ?", ["Hosted Lynott", "user_lynott_player"]);
    database.close();

    await migrateHostedData({ databasePath });

    const migrated = new Database(databasePath, { readonly: true });
    expect(migrated
      .query("select display_name as displayName from users where id = ?")
      .get("user_lynott_player")).toEqual({ displayName: "Hosted Lynott" });
    migrated.close();
  }, hostedDataTimeout);

  test("documents the accepted hosted persistence boundary", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    const assetRoot = join(dir, "assets");
    const backupDir = join(dir, "backups");

    expect(describeHostedPersistence({ assetRoot, backupDir, databasePath })).toEqual({
      assetRoot,
      backupDir,
      databasePath,
      mode: "sqlite-volume",
    });
  });

  test("rejects unsupported hosted persistence modes before touching data", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");

    await expect(migrateHostedData({ databasePath, persistenceMode: "postgres" })).rejects.toThrow(
      'Unsupported hosted persistence mode "postgres"',
    );
    await expect(stat(databasePath)).rejects.toThrow();
  });

  test("rejects in-memory databases for hosted data operations", async () => {
    await expect(migrateHostedData({ databasePath: ":memory:" })).rejects.toThrow(
      "file-backed SQLite database",
    );
  });

  test("refuses to prepare over an existing hosted database without confirmation", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    await prepareHostedData({ databasePath });

    await expect(prepareHostedData({ databasePath })).rejects.toThrow("Refusing to seed existing database");
  }, hostedDataTimeout);

  test("backs up and restores the hosted database with explicit confirmation", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    const backupDir = join(dir, "backups");
    await prepareHostedData({ databasePath });
    const backupPath = await backupHostedData({
      backupDir,
      databasePath,
      timestamp: new Date("2026-05-19T19:30:00.000Z"),
    });
    const database = new Database(databasePath);
    database.run("update users set display_name = ? where id = ?", ["Changed Lynott", "user_lynott_player"]);
    database.close();

    await expect(restoreHostedData({ databasePath, restoreSource: backupPath })).rejects.toThrow(
      "HOSTED_DATA_CONFIRM=replace",
    );
    await restoreHostedData({ confirm: "replace", databasePath, restoreSource: backupPath });

    const restored = new Database(databasePath, { readonly: true });
    expect(restored
      .query("select display_name as displayName from users where id = ?")
      .get("user_lynott_player")).toEqual({ displayName: "Lynott Player" });
    restored.close();
  }, hostedDataTimeout);
});
