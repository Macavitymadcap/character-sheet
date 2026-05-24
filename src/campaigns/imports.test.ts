import { describe, expect, test } from "bun:test";
import {
  convertCampaignImportContent,
  normaliseGoogleDocsReference,
  prepareGoogleDocsManualImport,
} from "./imports";

describe("campaign import conversion", () => {
  test("keeps Markdown readable and detects the title", () => {
    const preview = convertCampaignImportContent({
      content: "# Brass Market\n\nA tense market scene.",
      sourceFormat: "markdown",
    });

    expect(preview.detectedTitle).toBe("Brass Market");
    expect(preview.convertedMarkdown).toContain("A tense market scene.");
    expect(preview.warnings).toEqual([]);
  });

  test("converts a small safe HTML subset to Markdown", () => {
    const preview = convertCampaignImportContent({
      content: "<h1>Canal Ambush</h1><p>The <strong>watch</strong> arrives.</p><ul><li>Fog</li><li>Lanterns</li></ul>",
      sourceFormat: "html",
    });

    expect(preview.detectedTitle).toBe("Canal Ambush");
    expect(preview.convertedMarkdown).toContain("# Canal Ambush");
    expect(preview.convertedMarkdown).toContain("The **watch** arrives.");
    expect(preview.convertedMarkdown).toContain("- Fog");
  });

  test("removes private Google URLs and reports unsupported embeds", () => {
    const preview = convertCampaignImportContent({
      content: "<h1>Source</h1><p>See https://docs.google.com/document/d/private-id/edit</p><iframe src=\"x\"></iframe>",
      sourceFormat: "html",
    });

    expect(preview.convertedMarkdown).not.toContain("docs.google.com");
    expect(preview.convertedMarkdown).toContain("[private source link removed]");
    expect(preview.warnings).toContain("Private Google Drive or Docs links were removed from the converted content.");
    expect(preview.warnings).toContain("Unsupported embedded content was removed.");
  });

  test("prepares manual Google Docs exports without storing private document URLs", () => {
    const prepared = prepareGoogleDocsManualImport({
      documentReference: "https://docs.google.com/document/d/abc123_private/edit",
      documentTitle: " Canal Notes ",
      exportedContent: " # Canal Notes\n\nExported text. ",
      sourceFormat: "markdown",
    });

    expect(prepared).toEqual({
      content: "# Canal Notes\n\nExported text.",
      provider: "google_docs_manual",
      sourceFormat: "markdown",
      sourceReference: "google-doc:abc123_private",
      sourceTitle: "Canal Notes",
    });
  });

  test("normalises Google Docs references for stable metadata", () => {
    expect(normaliseGoogleDocsReference("https://docs.google.com/document/d/doc_123/edit"))
      .toBe("google-doc:doc_123");
    expect(normaliseGoogleDocsReference("google-doc:doc_123")).toBe("google-doc:doc_123");
    expect(normaliseGoogleDocsReference("Campaign notebook export")).toBe("Campaign notebook export");
  });
});
