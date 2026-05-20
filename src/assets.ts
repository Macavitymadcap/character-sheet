import { mkdir } from "node:fs/promises";

export const defaultAssetStorageRoot = "data/assets";

export const seededCampaignAssetFiles = [
  { mimeType: "image/png", storageKey: "campaigns/rovnost-shadows/cover.png" },
  { mimeType: "image/png", storageKey: "campaigns/rovnost-shadows/magister-vallen.png" },
  { mimeType: "image/png", storageKey: "campaigns/rovnost-shadows/faction-sigils.png" },
  { mimeType: "image/webp", storageKey: "campaigns/rovnost-shadows/astril-map.webp" },
  { mimeType: "image/png", storageKey: "campaigns/rovnost-shadows/skywright-sigil.png" },
] as const;

export function assetStorageRoot(env: Record<string, string | undefined> = Bun.env) {
  return env.CAMPAIGN_LEDGER_ASSET_ROOT || env.CHARACTER_SHEET_ASSET_ROOT || defaultAssetStorageRoot;
}

export async function writeSeedAssetPlaceholders(root = assetStorageRoot()) {
  for (const asset of seededCampaignAssetFiles) {
    const bytes = asset.mimeType === "image/webp" ? tinyWebpBytes() : tinyPngBytes();
    const path = `${root}/${asset.storageKey}`;
    await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    await Bun.write(path, bytes);
  }
}

function tinyPngBytes() {
  return bytesFromBase64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=");
}

function tinyWebpBytes() {
  return bytesFromBase64("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vuUAAA=");
}

function bytesFromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
