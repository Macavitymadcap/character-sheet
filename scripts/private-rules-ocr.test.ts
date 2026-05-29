import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
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
        "Invented Spark",
        "Level 1 Evocation",
        "• Casting Time: Action",
        "• Range: 30 feet",
        "• Components: V, S",
        "• Duration: Instantaneous",
        "A harmless synthetic spell for parser tests.",
        "Classes: Wizard",
        "Training Construct",
        "Medium Construct, Unaligned",
        "• Armor Class 12",
        "• Hit Points 22 (4d8 + 4)",
        "• Speed 30 ft.",
        "STR",
        "DEX",
        "CON",
        "INT",
        "WIS",
        "CHA",
        "12 (+1)",
        "10 (+0)",
        "12 (+1)",
        "6 (-2)",
        "10 (+0)",
        "5 (-3)",
        "• Challenge 1/2 (XP 100; PB +2)",
        "Actions",
        "Practice Slam. Melee Weapon Attack: +3 to hit. Hit: 4 bludgeoning damage.",
        "## Wizard",
        "# Feats",
        "### Alert",
        "You gain the following benefits:",
        "• You are hard to surprise.",
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
    const entries = parseOcrMarkdown(
      [
        "Invented Spark",
        "Level 1 Evocation",
        "• Casting Time: Action",
        "• Range: 30 feet",
        "• Components: V, S",
        "• Duration: Instantaneous",
        "A harmless synthetic spell for parser tests.",
        "Classes: Wizard",
      ].join("\n"),
      "PHB",
    );
    const document = createPrivateRulesDocument(entries, defaultOcrBooks[0]!, campaign, new Set());

    expect(document.entities).toHaveLength(1);
    expect(document.entities[0]?.type).toBe("spell");
    expect(document.entities[0]?.mechanics[0]?.kind).toBe("spell");
    expect(document.entities[0]?.mechanics[0]?.data).toMatchObject({
      castingTime: "Action",
      classes: ["Wizard"],
      components: ["V", "S"],
      level: 1,
      range: "30 feet",
      school: "Evocation",
    });
  });

  test("extracts OCR-shaped stat blocks, magic items, species, backgrounds, feats, and tables", () => {
    const entries = parseOcrMarkdown(
      [
        "Training Construct",
        "Medium Construct, Unaligned",
        "• Armor Class 12",
        "• Hit Points 22 (4d8 + 4)",
        "• Speed 30 ft.",
        "STR",
        "DEX",
        "CON",
        "INT",
        "WIS",
        "CHA",
        "12 (+1)",
        "10 (+0)",
        "12 (+1)",
        "6 (-2)",
        "10 (+0)",
        "5 (-3)",
        "• Senses Passive Perception 10",
        "• Languages understands Common",
        "• Challenge 1/2 (XP 100; PB +2)",
        "Patient. The construct waits for instructions.",
        "Actions",
        "Practice Slam. Melee Weapon Attack: +3 to hit. Hit: 4 bludgeoning damage.",
        "Invented Hammer",
        "Weapon (Warhammer), Rare (Requires Attunement), Martial Weapon, Melee Weapon, 2 lb.",
        "1d8 Bludgeoning",
        "This synthetic hammer exists only in tests.",
        "Aarakocra",
        "• Ability Scores: Choose any +2",
        "• Creature Type: Humanoid",
        "• Size: Medium",
        "• Speed: 30 feet",
        "Bright Eyes. You can see well in dim light.",
        "Acolyte",
        "• Skill Proficiencies: Insight, Religion",
        "• Languages: Two of your choice",
        "• Equipment: Robes, a token, and 10 gp",
        "Feature: Quiet Shelter",
        "Temples offer you aid in this synthetic example.",
        "Invented Adept",
        "Prerequisite: Aarakocra",
        "You gain the following benefits:",
        "• Increase one ability score by 1.",
        "Synthetic Results",
        "d6",
        "Result",
        "1",
        "First synthetic result",
        "2",
        "Second synthetic result",
      ].join("\n"),
      "PHB",
    );

    expect(entries.map((entry) => entry.type)).toContain("monster");
    expect(entries.map((entry) => entry.type)).toContain("magic_item");
    expect(entries.map((entry) => entry.type)).toContain("species");
    expect(entries.map((entry) => entry.type)).toContain("background");
    expect(entries.map((entry) => entry.type)).toContain("feat");
    expect(entries.map((entry) => entry.type)).toContain("rule");
    expect(entries.find((entry) => entry.type === "monster")?.mechanics.stat_block).toMatchObject({
      armourClass: { value: 12 },
      challenge: { proficiencyBonus: 2, rating: "1/2", xp: 100 },
      hitPoints: { average: 22, formula: "4d8 + 4" },
    });
    expect(entries.find((entry) => entry.type === "magic_item")?.mechanics.equipment).toMatchObject({
      category: "magic_item",
      rarity: "Rare",
      requiresAttunement: true,
    });
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
        "• You react quickly.",
        "| Longsword | 15 gp | 1d8 slashing | 3 lb. |",
      ].join("\n"),
    );

    const result = await exportPrivateRulesFromOcr({ campaign, inputDir });
    const writtenDir = await writePrivateRulesOcrExport(result, { outputDir });
    const writtenFiles = await readdir(writtenDir);
    const phb = parseYaml(await readFile(join(writtenDir, "phb.yml"), "utf8"));
    const combined = JSON.parse(await readFile(join(writtenDir, "combined.json"), "utf8"));

    expect(result.documents).toHaveLength(1);
    expect(writtenFiles).toContain("phb.yml");
    expect(writtenFiles).toContain("combined.json");
    expect(writtenFiles).not.toContain("combined.yml");
    expect(phb.schemaVersion).toBe(1);
    expect(phb.sources[0].code).toBe("PHB");
    expect(phb.entities).toHaveLength(3);
    expect(combined.entities).toHaveLength(3);
    expect(combined.sources.map((source: { code: string }) => source.code)).toEqual(["PHB"]);
  });
});
