import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { assetStorageRoot, defaultAssetStorageRoot, writeSeedAssetPlaceholders } from "./assets";

describe("assetStorageRoot", () => {
  test("uses the Campaign Ledger asset root when present", () => {
    expect(assetStorageRoot({ CAMPAIGN_LEDGER_ASSET_ROOT: "/data/campaign-ledger-assets" })).toBe(
      "/data/campaign-ledger-assets",
    );
  });

  test("keeps the previous Character Sheet asset root as a compatibility fallback", () => {
    expect(assetStorageRoot({ CHARACTER_SHEET_ASSET_ROOT: "/data/assets" })).toBe("/data/assets");
  });

  test("prefers the renamed asset root over the compatibility fallback", () => {
    expect(
      assetStorageRoot({
        CAMPAIGN_LEDGER_ASSET_ROOT: "/data/campaign-ledger-assets",
        CHARACTER_SHEET_ASSET_ROOT: "/data/assets",
      }),
    ).toBe("/data/campaign-ledger-assets");
  });

  test("falls back to the local asset directory", () => {
    expect(assetStorageRoot({})).toBe(defaultAssetStorageRoot);
  });

  test("writes bundled Rovnost seed image files when available", async () => {
    const root = await mkdtemp(join(tmpdir(), "campaign-ledger-seed-assets-"));

    try {
      await writeSeedAssetPlaceholders(root);

      const cover = Bun.file(`${root}/campaigns/rovnost-shadows/cover.png`);
      const map = Bun.file(`${root}/campaigns/rovnost-shadows/astril-map.png`);

      expect(await cover.exists()).toBe(true);
      expect(cover.size).toBeGreaterThan(1024);
      expect(await map.exists()).toBe(true);
      expect(map.size).toBeGreaterThan(1024);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
