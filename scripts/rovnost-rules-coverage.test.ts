import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { createSqliteDatabase } from "../src/db";
import { RulesImportService } from "../src/rules";
import {
  buildRovnostCoverageReport,
  formatRovnostCoverageReport,
  lynottRequiredRules,
  relinkLynottPrivateRuleLinks,
} from "../src/rules/rovnost-coverage";

describe("Rovnost private rules coverage", () => {
  test("reports required private sources and relinks Lynott to imported private rules", async () => {
    const root = mkdtempSync(join(tmpdir(), "rovnost-coverage-"));
    writeFileSync(join(root, "rovnost-private.yaml"), privateRulesYaml());
    const runtime = createSqliteDatabase({ path: ":memory:" });

    try {
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
      await importer.importPrivateYaml(root, {
        backupConfirmed: true,
        campaignId: "campaign_rovnost_shadows",
      });

      const before = buildRovnostCoverageReport(runtime.database, { sourceFilesPath: root });
      expect(before.sources.every((source) => source.importedCount > 0)).toBe(true);
      expect(before.sources.every((source) => source.presentInSourceFiles)).toBe(true);
      expect(before.lynottRules.every((rule) => rule.privateEntityId)).toBe(true);
      expect(before.lynottRules.some((rule) => !rule.usesPrivateLink)).toBe(true);

      expect(relinkLynottPrivateRuleLinks(runtime.database)).toEqual({ updated: lynottRequiredRules.length });
      const after = buildRovnostCoverageReport(runtime.database, { sourceFilesPath: root });
      expect(after.lynottRules.every((rule) => rule.usesPrivateLink)).toBe(true);
      expect(after.privateRulesVisiblePublicly).toBe(0);
      expect(formatRovnostCoverageReport(after)).toContain("Lynott private links: 17/17");
      expect(runtime.repositories.rulesRepository.getRuleDetail("spell", "shield")).toMatchObject({
        sourceName: "Player's Handbook",
        sourceVisibility: "public",
      });
      expect(runtime.repositories.rulesRepository.getRuleDetail("spell", "shield", {
        campaignIds: ["campaign_rovnost_shadows"],
      })).toMatchObject({
        sourceName: "Player's Handbook",
        sourceVisibility: "campaign",
      });
    } finally {
      runtime.close();
    }
  });

  test("lists missing source files and missing Lynott links", () => {
    const root = mkdtempSync(join(tmpdir(), "rovnost-coverage-missing-"));
    writeFileSync(join(root, "partial.yaml"), [
      "schemaVersion: 1",
      "campaign:",
      "  id: campaign_rovnost_shadows",
      "sources:",
      "  - code: PHB",
      "    title: Player's Handbook",
      "    abbreviation: PHB",
      "    visibility: campaign",
      "    precedence: 10",
      "entities:",
      "  - slug: shield",
      "    type: spell",
      "    name: Shield",
      "    source:",
      "      sourceCode: PHB",
      "    bodyMarkdown: Synthetic private shield text.",
    ].join("\n"));
    const runtime = createSqliteDatabase({ path: ":memory:" });

    try {
      const report = buildRovnostCoverageReport(runtime.database, { sourceFilesPath: root });
      const text = formatRovnostCoverageReport(report);

      expect(text).toContain("Lynott private links: 0/17");
      expect(text).toContain("- TCOE: Magical Tinkering");
      expect(text).toContain("- DMG: Dungeon Master's Guide");
      expect(text).toContain("- MPMM: Mordenkainen Presents: Monsters of the Multiverse");
    } finally {
      runtime.close();
    }
  });
});

function privateRulesYaml() {
  const rules = lynottRequiredRules.map((rule) => [
    `  - slug: ${rule.slug}`,
    `    type: ${privateEntityType(rule.entityType)}`,
    `    name: ${yamlString(rule.name)}`,
    "    source:",
    `      sourceCode: ${rule.sourceCode}`,
    `    summary: Synthetic private ${rule.name} summary.`,
    `    bodyMarkdown: Synthetic private ${rule.name} text only.`,
  ].join("\n"));
  const extras = [
    [
      "  - slug: clockwork-scout",
      "    type: monster",
      "    name: Clockwork Scout",
      "    source:",
      "      sourceCode: MM",
      "    bodyMarkdown: Synthetic private stat block text.",
    ].join("\n"),
    [
      "  - slug: spark-wand",
      "    type: magic_item",
      "    name: Spark Wand",
      "    source:",
      "      sourceCode: DMG",
      "    bodyMarkdown: Synthetic private item text.",
    ].join("\n"),
  ];

  return [
    "schemaVersion: 1",
    "campaign:",
    "  id: campaign_rovnost_shadows",
    "  slug: rovnost-shadows",
    "  name: Rovnost Shadows",
    "sources:",
    ...[
      ["PHB", "Player's Handbook", "PHB", 10],
      ["DMG", "Dungeon Master's Guide", "DMG", 15],
      ["MM", "Monster Manual", "MM", 16],
      ["TCOE", "Tasha's Cauldron of Everything", "TCoE", 20],
      ["XGTE", "Xanathar's Guide to Everything", "XGtE", 15],
      ["MPMM", "Mordenkainen Presents: Monsters of the Multiverse", "MPMM", 30],
    ].flatMap(([code, title, abbreviation, precedence]) => [
      `  - code: ${code}`,
      `    title: ${yamlString(String(title))}`,
      `    abbreviation: ${abbreviation}`,
      "    category: official_2014",
      "    visibility: campaign",
      `    precedence: ${precedence}`,
    ]),
    "entities:",
    ...rules,
    ...extras,
  ].join("\n");
}

function privateEntityType(entityType: string) {
  if (entityType === "class_feature") return "class_feature";
  if (entityType === "species_trait") return "species_trait";
  if (entityType === "subclass_feature") return "subclass_feature";

  return entityType;
}

function yamlString(value: string) {
  return JSON.stringify(value);
}
