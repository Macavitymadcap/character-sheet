import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";
import { parse as parseYaml } from "yaml";
import {
  createPrivateRulesDocument,
  defaultOcrBooks,
  exportPrivateRulesFromOcr,
  parseOcrMarkdown,
  writePrivateRulesOcrExport,
} from "./private-rules-ocr";

const campaign = {
  id: "campaign_rovnost_shadows",
  name: "Rovnost Shadows",
  slug: "rovnost-shadows",
};

describe("private rules OCR export", () => {
  test("writes Campaign Ledger private-rules YAML and excludes incomplete spells and monsters by default", () => {
    const entries = parseOcrMarkdown(
      [
        "- *Mage Hand*",
        "- **Goblin**",
        "## Wizard",
        "# Feats",
        "### Alert",
        "| Longsword | 15 gp | 1d8 slashing | 3 lb. |",
        "| Longsword | duplicate row |",
      ].join("\n"),
      "PHB",
    );
    const document = createPrivateRulesDocument(entries, defaultOcrBooks[0]!, campaign);

    expect(document.schemaVersion).toBe(1);
    expect(document.campaign.id).toBe("campaign_rovnost_shadows");
    expect(document.sources).toEqual([
      {
        abbreviation: "PHB",
        category: "official_2014",
        code: "PHB",
        precedence: 10,
        title: "Player's Handbook",
        visibility: "campaign",
      },
    ]);
    expect(document.entities.map((entity) => entity.type)).toEqual(["class", "feat", "equipment"]);
    expect(document.entities.some((entity) => entity.type === "spell")).toBe(false);
    expect(document.entities.some((entity) => entity.type === "monster")).toBe(false);
    expect(document.entities.filter((entity) => entity.slug === "longsword")).toHaveLength(1);
    expect(document.entities[0]?.id).toStartWith("private_phb_");
    expect(document.importNotes).toContain("Excluded entity types: spell, monster");
  });

  test("can include spells when the operator overrides the exclusion list", () => {
    const entries = parseOcrMarkdown("- *Mage Hand*", "PHB");
    const document = createPrivateRulesDocument(entries, defaultOcrBooks[0]!, campaign, new Set());

    expect(document.entities).toHaveLength(1);
    expect(document.entities[0]?.type).toBe("spell");
    expect(document.entities[0]?.mechanics[0]?.kind).toBe("spell");
  });

  test("exports book and combined files from an OCR markdown directory", async () => {
    const inputDir = await mkdtemp(join(tmpdir(), "campaign-ledger-ocr-input-"));
    const outputDir = await mkdtemp(join(tmpdir(), "campaign-ledger-ocr-output-"));
    await writeFile(
      join(inputDir, "phb.md"),
      [
        "## Wizard",
        "# Feats",
        "### Alert",
        "| Longsword | 15 gp | 1d8 slashing | 3 lb. |",
      ].join("\n"),
    );

    const result = await exportPrivateRulesFromOcr({ campaign, inputDir });
    const writtenDir = await writePrivateRulesOcrExport(result, { outputDir });
    const phb = parseYaml(await readFile(join(writtenDir, "phb.yml"), "utf8"));
    const combined = JSON.parse(await readFile(join(writtenDir, "combined.json"), "utf8"));

    expect(result.documents).toHaveLength(1);
    expect(phb.schemaVersion).toBe(1);
    expect(phb.sources[0].code).toBe("PHB");
    expect(phb.entities).toHaveLength(3);
    expect(combined.entities).toHaveLength(3);
    expect(combined.sources.map((source: { code: string }) => source.code)).toEqual(["PHB"]);
  });
});
