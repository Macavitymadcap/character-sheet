export type CampaignImportTargetType = "draft" | "npc" | "session" | "wiki";

export interface CampaignImportPreview {
  convertedMarkdown: string;
  detectedTitle: string;
  warnings: string[];
}

const privateUrlPattern = /https?:\/\/(?:docs|drive)\.google\.com\/[^\s)\]<>"]+/gi;

export function convertCampaignImportContent(input: {
  content: string;
  sourceFormat: "html" | "markdown";
  sourceTitle?: string;
}): CampaignImportPreview {
  const warnings: string[] = [];
  const withoutPrivateUrls = removePrivateUrls(input.content, warnings);
  const convertedMarkdown = input.sourceFormat === "html"
    ? normaliseImportMarkdown(convertHtmlToMarkdown(withoutPrivateUrls, warnings))
    : normaliseImportMarkdown(withoutPrivateUrls);
  const detectedTitle = detectTitle(convertedMarkdown) ?? input.sourceTitle?.trim() ?? "Imported campaign writing";

  return {
    convertedMarkdown,
    detectedTitle,
    warnings: Array.from(new Set(warnings)),
  };
}

function removePrivateUrls(content: string, warnings: string[]) {
  if (!privateUrlPattern.test(content)) return content;
  warnings.push("Private Google Drive or Docs links were removed from the converted content.");

  return content.replace(privateUrlPattern, "[private source link removed]");
}

function convertHtmlToMarkdown(html: string, warnings: string[]) {
  let output = html;
  output = output.replace(/<script[\s\S]*?<\/script>/gi, () => {
    warnings.push("Unsupported script content was removed.");
    return "";
  });
  output = output.replace(/<style[\s\S]*?<\/style>/gi, "");
  output = output.replace(/<iframe[\s\S]*?<\/iframe>/gi, () => {
    warnings.push("Unsupported embedded content was removed.");
    return "";
  });
  output = output.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n# ${plainText(text)}\n`);
  output = output.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n## ${plainText(text)}\n`);
  output = output.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n### ${plainText(text)}\n`);
  output = output.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n${inlineMarkdown(text)}\n`);
  output = output.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${inlineMarkdown(text)}`);
  output = output.replace(/<br\s*\/?>/gi, "\n");
  output = output.replace(/<\/(?:ul|ol|div|section|article)>/gi, "\n");
  output = output.replace(/<[^>]+>/g, "");

  return decodeEntities(output);
}

function inlineMarkdown(html: string) {
  return decodeEntities(html
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "_$1_")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "_$1_")
    .replace(/<a[^>]*href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, ""))
    .trim();
}

function plainText(html: string) {
  return inlineMarkdown(html).replace(/[*_`]/g, "").trim();
}

function normaliseImportMarkdown(markdown: string) {
  return decodeEntities(markdown)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectTitle(markdown: string) {
  const heading = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  if (!heading) return null;

  return heading.replace(/^#\s+/, "").trim() || null;
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}
