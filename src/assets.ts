import { mkdir, rm } from "node:fs/promises";

export const defaultAssetStorageRoot = "data/assets";

export const seededCampaignAssetFiles = [
  {
    bundledPath: "src/assets/seed/rovnost/cover.png",
    mimeType: "image/png",
    storageKey: "campaigns/rovnost-shadows/cover.png",
  },
  {
    bundledPath: "src/assets/seed/rovnost/magister-vallen.png",
    mimeType: "image/png",
    storageKey: "campaigns/rovnost-shadows/magister-vallen.png",
  },
  {
    bundledPath: "src/assets/seed/rovnost/faction-sigils.png",
    mimeType: "image/png",
    storageKey: "campaigns/rovnost-shadows/faction-sigils.png",
  },
  {
    bundledPath: "src/assets/seed/rovnost/astril-map.png",
    mimeType: "image/png",
    storageKey: "campaigns/rovnost-shadows/astril-map.png",
  },
  {
    bundledPath: "src/assets/seed/rovnost/skywright-sigil.png",
    mimeType: "image/png",
    storageKey: "campaigns/rovnost-shadows/skywright-sigil.png",
  },
] as const;

export function assetStorageRoot(env: Record<string, string | undefined> = Bun.env) {
  return env.CAMPAIGN_LEDGER_ASSET_ROOT || env.CHARACTER_SHEET_ASSET_ROOT || defaultAssetStorageRoot;
}

export async function writeSeedAssetPlaceholders(root = assetStorageRoot()) {
  for (const asset of seededCampaignAssetFiles) {
    const source = "bundledPath" in asset ? Bun.file(asset.bundledPath) : null;
    const bytes = source && await source.exists()
      ? new Uint8Array(await source.arrayBuffer())
      : tinyPngBytes();
    const path = `${root}/${asset.storageKey}`;
    await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    await Bun.write(path, bytes);
  }
}

export async function verifyAssetStorageRoot(root = assetStorageRoot()) {
  await mkdir(root, { recursive: true });
  const path = `${root}/.campaign-ledger-healthcheck`;
  await Bun.write(path, "ok");
  await rm(path, { force: true });

  return root;
}

function tinyPngBytes() {
  return bytesFromBase64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=");
}

function bytesFromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
