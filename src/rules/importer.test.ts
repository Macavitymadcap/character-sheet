import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "../db";
import {
  normaliseRuleText,
  parseRuleMarkdown,
  resolveRulesSource,
  RulesImportService,
} from "./importer";

describe("rules importer", () => {
  test("normalises common rule copy to British English without changing names", () => {
    expect(
      normaliseRuleText("Armor colors are gray; recognize the traveling armored traveler."),
    ).toBe("Armour colours are grey; recognise the travelling armoured traveller.");
    expect(normaliseRuleText("Enhanced Defense")).toBe("Enhanced Defence");
  });

  test("resolves source precedence deterministically", () => {
    const phb = {
      abbreviation: "PHB",
      name: "Player's Handbook",
      precedence: 10,
      slug: "players-handbook",
    };
    const tcoe = {
      abbreviation: "TCoE",
      name: "Tasha's Cauldron of Everything",
      precedence: 20,
      slug: "tashas-cauldron-of-everything",
    };

    expect(resolveRulesSource(phb, tcoe)).toBe(tcoe);
    expect(resolveRulesSource(tcoe, phb)).toBe(tcoe);
  });

  test("parses representative local markdown rule files", async () => {
    const cureWounds = parseRuleMarkdown(
      "docs/rules/spells/level-1/cure-wounds.md",
      await Bun.file("docs/rules/spells/level-1/cure-wounds.md").text(),
    );
    const repeatingShot = parseRuleMarkdown(
      "docs/rules/classes/artificer/infusions/repeating-shot.md",
      await Bun.file("docs/rules/classes/artificer/infusions/repeating-shot.md").text(),
    );
    const specialOps = parseRuleMarkdown(
      "docs/rules/backgrounds/special-ops.md",
      await Bun.file("docs/rules/backgrounds/special-ops.md").text(),
    );
    const hobgoblin = parseRuleMarkdown(
      "docs/rules/species/hobgoblin.md",
      await Bun.file("docs/rules/species/hobgoblin.md").text(),
    );
    const classFeature = parseRuleMarkdown(
      "docs/rules/classes/fighter/battle-drill.md",
      "# Battle Drill\n\n*1st-level fighter feature*\n\nYou recognize armor colors.",
    );
    const equipment = parseRuleMarkdown(
      "docs/rules/equipment/adventurers-kit.md",
      "# Adventurer's Kit\n\nA gray pack with armor straps.",
    );
    const condition = parseRuleMarkdown(
      "docs/rules/conditions/poisoned.md",
      "# Poisoned\n\nA poisoned creature has disadvantage on attack rolls.",
    );

    expect(cureWounds).toMatchObject({
      entityType: "spell",
      name: "Cure Wounds",
      slug: "cure-wounds",
      source: { abbreviation: "PHB" },
    });
    expect(cureWounds.mechanics[0]).toMatchObject({
      data: {
        castingTime: "Action",
        level: 1,
        range: "Touch",
        school: "Evocation",
      },
      mechanicType: "spell",
    });
    expect(repeatingShot).toMatchObject({
      entityType: "infusion",
      source: { abbreviation: "TCoE" },
    });
    expect(repeatingShot.mechanics[0]!.data.requiresAttunement).toBe(true);
    expect(specialOps).toMatchObject({
      entityType: "background",
      source: { abbreviation: "Local" },
    });
    expect(specialOps.mechanics[0]!.data.skillProficiencies).toEqual(["Stealth", "Deception"]);
    expect(specialOps.mechanics[0]!.data.equipment).toContain("traveller's clothes");
    expect(hobgoblin).toMatchObject({
      entityType: "species_trait",
      source: { abbreviation: "MPMotM" },
    });
    expect(JSON.stringify(hobgoblin.mechanics[0]!.data)).toContain("colours");
    expect(classFeature).toMatchObject({ entityType: "class_feature" });
    expect(classFeature.mechanics[0]!.data.description).toContain("recognise armour colours");
    expect(equipment).toMatchObject({ entityType: "equipment" });
    expect(equipment.mechanics[0]!.data.description).toContain("grey pack");
    expect(condition).toMatchObject({ entityType: "condition" });
  });

  test("imports local rules into SQLite idempotently", async () => {
    let runtime: SqliteDatabaseRuntime | undefined;

    try {
      runtime = createSqliteDatabase({ path: ":memory:" });
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);

      await importer.importFromLocalSource("docs/rules/spells/level-1/cure-wounds.md");
      await importer.importFromLocalSource("docs/rules/spells/level-1/cure-wounds.md");

      const entity = runtime.database
        .query<{ count: number; id: string }, []>(
          `select count(*) as count, id
           from rules_entities
           where slug = 'cure-wounds' and entity_type = 'spell'`,
        )
        .get();
      const mechanics = runtime.database
        .query<{ count: number }, []>(
          "select count(*) as count from rule_mechanics where rules_entity_id = 'rule_cure_wounds'",
        )
        .get();

      expect(entity).toEqual({ count: 1, id: "rule_cure_wounds" });
      expect(mechanics).toEqual({ count: 1 });
    } finally {
      runtime?.close();
    }
  });

  test("imports every markdown file from a local directory", async () => {
    let runtime: SqliteDatabaseRuntime | undefined;
    const root = mkdtempSync(join(tmpdir(), "rules-importer-"));
    const spellDir = join(root, "spells", "level-1");
    const equipmentDir = join(root, "equipment");
    mkdirSync(spellDir, { recursive: true });
    mkdirSync(equipmentDir, { recursive: true });
    writeFileSync(
      join(spellDir, "chromatic-widget.md"),
      "# Chromatic Widget\n\n*Level 1 Evocation*\n\n**Casting Time:** Action\n\n**Range:** 30 feet\n\n**Components:** V\n\n**Duration:** Instantaneous\n\nThe widget flashes gray colors.",
    );
    writeFileSync(join(equipmentDir, "field-kit.md"), "# Field Kit\n\nA traveler uses this kit.");

    try {
      runtime = createSqliteDatabase({ path: ":memory:" });
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
      const result = await importer.importFromLocalSource(root);

      expect(result.imported).toBe(2);
      expect(result.entities.map((entity) => entity.slug).sort()).toEqual([
        "chromatic-widget",
        "field-kit",
      ]);
      const chromaticWidget = result.entities.find((entity) => entity.slug === "chromatic-widget");
      const fieldKit = result.entities.find((entity) => entity.slug === "field-kit");
      expect(chromaticWidget?.mechanics[0]?.data.description).toContain("grey colours");
      expect(fieldKit?.mechanics[0]?.data.description).toContain("traveller");
    } finally {
      runtime?.close();
    }
  });
});
