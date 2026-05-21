import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import {
  backupHostedData,
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
  test("prepares a fresh hosted-style database with seeded group data", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    const assetRoot = join(dir, "assets");

    await prepareHostedData({ assetRoot, databasePath });

    const database = new Database(databasePath, { readonly: true });
    expect(database.query("select count(*) as count from users").get()).toEqual({ count: 6 });
    expect(database.query("select count(*) as count from characters").get()).toEqual({ count: 2 });
    expect(database.query("select storage_key as storageKey from campaign_image_assets where id = ?").get("asset_skywright_sigil"))
      .toEqual({ storageKey: "campaigns/rovnost-shadows/skywright-sigil.png" });
    expect((await stat(join(assetRoot, "campaigns/rovnost-shadows/skywright-sigil.png"))).size).toBeGreaterThan(0);
    expect((await stat(join(assetRoot, "campaigns/rovnost-shadows/astril-map.webp"))).size).toBeGreaterThan(0);
    database.close();
  });

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
  });

  test("refuses to prepare over an existing hosted database without confirmation", async () => {
    const dir = await createTempDir();
    const databasePath = join(dir, "character-sheet.sqlite3");
    await prepareHostedData({ databasePath });

    await expect(prepareHostedData({ databasePath })).rejects.toThrow("Refusing to seed existing database");
  });

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
  });
});
