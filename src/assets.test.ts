import { describe, expect, test } from "bun:test";
import { assetStorageRoot, defaultAssetStorageRoot } from "./assets";

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
});
