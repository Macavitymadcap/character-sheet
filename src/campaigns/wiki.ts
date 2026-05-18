import { raw } from "hono/html";

const allowedPageTypes = ["campaign", "faction", "location", "lore", "npc", "session"] as const;

export type CampaignWikiPageType = (typeof allowedPageTypes)[number];

export function isCampaignWikiPageType(value: unknown): value is CampaignWikiPageType {
  return typeof value === "string" && allowedPageTypes.includes(value as CampaignWikiPageType);
}

export function normaliseGoogleDocsMarkdown(markdown: string) {
  return markdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderCampaignMarkdown(
  markdown: string,
  resolveAsset?: (assetId: string, altText: string) => { altText: string; src: string } | null,
) {
  const blocks = normaliseGoogleDocsMarkdown(markdown).split(/\n{2,}/);
  const html = blocks.map((block) => renderBlock(block, resolveAsset)).join("");

  return raw(html);
}

function renderBlock(
  block: string,
  resolveAsset?: (assetId: string, altText: string) => { altText: string; src: string } | null,
) {
  const lines = block.split("\n");
  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return `<ul>${lines.map((line) => `<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
  }
  const firstLine = lines[0] ?? "";
  if (lines.length === 1 && /^(?:-{3,}|\*{3,})$/.test(firstLine.trim())) return "<hr />";
  if (lines.length === 1 && /^#{1,3}\s+/.test(firstLine)) {
    const depth = firstLine.match(/^#+/)?.[0].length ?? 2;
    const tag = Math.min(depth + 1, 4);

    return `<h${tag}>${renderInline(firstLine.replace(/^#{1,3}\s+/, ""))}</h${tag}>`;
  }
  if (lines.length === 1 && /^\*\*[^*].+\*\*$/.test(firstLine)) {
    return `<h3>${renderInline(firstLine.replace(/^\*\*|\*\*$/g, ""))}</h3>`;
  }
  const image = firstLine.match(/^!\[([^\]]*)\]\(asset:([a-zA-Z0-9_-]+)\)$/);
  if (lines.length === 1 && image && resolveAsset) {
    const asset = resolveAsset(image[2] ?? "", image[1] ?? "");
    if (asset) {
      return `<figure class="campaign-markdown-asset"><img src="${escapeHtml(asset.src)}" alt="${escapeHtml(asset.altText)}" /></figure>`;
    }
  }

  return `<p>${renderInline(lines.join("<br />"))}</p>`;
}

function renderInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
