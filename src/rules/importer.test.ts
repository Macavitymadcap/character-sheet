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
    const radiantWeapon = parseRuleMarkdown(
      "docs/rules/classes/artificer/infusions/radiant-weapon.md",
      await Bun.file("docs/rules/classes/artificer/infusions/radiant-weapon.md").text(),
    );
    const statBlock = parseRuleMarkdown(
      "docs/rules/stat-blocks/clockwork-scout.md",
      [
        "# Clockwork Scout",
        "",
        "**Armor Class:** 14",
        "",
        "**Hit Points:** 27",
        "",
        "**Speed:** 30 ft.",
        "",
        "### Actions",
        "",
        "**Gear Slam.** Melee Weapon Attack.",
        "",
        "### Reactions",
        "",
        "**Parry.** The scout adds 2 to its AC.",
      ].join("\n"),
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
      source: { abbreviation: "PHB", contentCategory: "third_party" },
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
      source: { abbreviation: "TCoE", contentCategory: "third_party" },
    });
    expect(repeatingShot.mechanics[0]!.data.requiresAttunement).toBe(true);
    expect(specialOps).toMatchObject({
      entityType: "background",
      source: { abbreviation: "Local", contentCategory: "local" },
    });
    expect(specialOps.mechanics[0]!.data.skillProficiencies).toEqual(["Stealth", "Deception"]);
    expect(specialOps.mechanics[0]!.data.equipment).toContain("traveller's clothes");
    expect(hobgoblin).toMatchObject({
      entityType: "species_trait",
      source: { abbreviation: "MPMotM", contentCategory: "third_party" },
    });
    expect(JSON.stringify(hobgoblin.mechanics[0]!.data)).toContain("colours");
    expect(radiantWeapon.mechanics[0]!.data).toMatchObject({
      actionTiming: ["Bonus action", "Reaction"],
      charges: "4 charges",
      resetCadence: "Dawn",
    });
    expect(statBlock).toMatchObject({
      entityType: "stat_block",
      name: "Clockwork Scout",
      slug: "clockwork-scout",
    });
    expect(statBlock.mechanics[0]).toMatchObject({
      data: {
        actionTiming: ["Reaction", "Action"],
        armourClass: "14",
        hitPoints: "27",
        reactions: expect.stringContaining("Parry"),
        speed: "30 ft.",
        statBlock: true,
      },
      mechanicType: "stat_block",
    });
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

  test("imports campaign-scoped private sources without public export eligibility", async () => {
    let runtime: SqliteDatabaseRuntime | undefined;
    const root = mkdtempSync(join(tmpdir(), "rules-private-importer-"));
    const backgroundPath = join(root, "backgrounds", "secret-agent.md");
    mkdirSync(join(root, "backgrounds"), { recursive: true });
    writeFileSync(
      backgroundPath,
      "# Secret Agent\n\n**Skill Proficiencies:** Stealth\n\nA synthetic private fixture.",
    );

    try {
      runtime = createSqliteDatabase({ path: ":memory:" });
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
      const result = await importer.importFromLocalSource(root, {
        campaignId: "campaign_rovnost_shadows",
        source: {
          abbreviation: "Rovnost",
          contentCategory: "local",
          id: "rules_source_rovnost_private",
          name: "Rovnost Private Notes",
          slug: "rovnost-private",
        },
      });

      expect(result.sourceCounts).toEqual({ "rovnost-private": 1 });
      expect(result.entities[0]?.source).toMatchObject({
        campaignIds: ["campaign_rovnost_shadows"],
        contentCategory: "local",
        publicExportEligible: false,
        visibility: "campaign",
      });
      expect(
        runtime.repositories.rulesRepository.getRuleDetail("background", "secret-agent"),
      ).toBeNull();
      expect(
        runtime.repositories.rulesRepository.getRuleDetail("background", "secret-agent", {
          campaignIds: ["campaign_rovnost_shadows"],
        }),
      ).toMatchObject({
        name: "Secret Agent",
        sourceName: "Rovnost Private Notes",
      });
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
    writeFileSync(join(root, "notes.txt"), "Not a rule file.");

    try {
      runtime = createSqliteDatabase({ path: ":memory:" });
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
      const result = await importer.importFromLocalSource(root);

      expect(result.imported).toBe(2);
      expect(result.entities.map((entity) => entity.slug).sort()).toEqual([
        "chromatic-widget",
        "field-kit",
      ]);
      expect(result.skippedFiles.map((filePath) => filePath.replace(root, ""))).toEqual([
        "/notes.txt",
      ]);
      expect(result.sourceCounts).toEqual({ "players-handbook": 2 });
      const chromaticWidget = result.entities.find((entity) => entity.slug === "chromatic-widget");
      const fieldKit = result.entities.find((entity) => entity.slug === "field-kit");
      expect(chromaticWidget?.mechanics[0]?.data.description).toContain("grey colours");
      expect(chromaticWidget?.mechanics[0]?.data.provenance).toMatchObject({
        originalPath: join(spellDir, "chromatic-widget.md"),
        ruleType: "spell",
        source: "PHB",
      });
      expect(fieldKit?.mechanics[0]?.data.description).toContain("traveller");
    } finally {
      runtime?.close();
    }
  });

  test("reports the SRD 5.1 fixture source contract without importing the full corpus", async () => {
    let runtime: SqliteDatabaseRuntime | undefined;

    try {
      runtime = createSqliteDatabase({ path: ":memory:" });
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
      const result = await importer.importFromLocalSource("docs/rules/srd-5.1-fixtures");

      expect(result.imported).toBe(15);
      expect(result.skippedFiles).toEqual(["docs/rules/srd-5.1-fixtures/README.txt"]);
      expect(result.sourceCounts).toEqual({ "srd-5-1": 15 });
      expect(result.entities.map((entity) => `${entity.entityType}:${entity.slug}`)).toEqual([
        "action:dash",
        "background:acolyte",
        "class_feature:action-surge",
        "subclass:evoker",
        "class:wizard",
        "condition:grappled",
        "core_rule:ability-checks",
        "equipment:rope-hempen",
        "equipment:chain-mail",
        "equipment:longsword",
        "feat:grappler",
        "proficiency:longswords",
        "sense:darkvision",
        "species:dwarf",
        "spell:bless",
      ]);
      expect(result.entities.every((entity) => entity.source.abbreviation === "SRD 5.1")).toBe(
        true,
      );
      expect(result.entities.every((entity) => entity.source.contentCategory === "srd")).toBe(
        true,
      );
      expect(result.entities[0]?.mechanics[0]?.data.provenance).toMatchObject({
        originalPath: "docs/rules/srd-5.1-fixtures/actions/dash.md",
        ruleType: "action",
        source: "SRD 5.1",
        srdVersion: "5.1",
      });
    } finally {
      runtime?.close();
    }
  });

  test("imports the full local SRD 5.1 corpus from structured JSON", async () => {
    let runtime: SqliteDatabaseRuntime | undefined;

    try {
      runtime = createSqliteDatabase({ path: ":memory:" });
      const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
      const result = await importer.importFromLocalSource("docs/rules/srd-5.1");

      expect(result.imported).toBeGreaterThan(2000);
      expect(result.skippedFiles).toEqual(["docs/rules/srd-5.1/ATTRIBUTION.txt"]);
      expect(result.sourceCounts).toEqual({ "srd-5-1": result.imported });
      expect(result.entities.every((entity) => entity.source.contentCategory === "srd")).toBe(
        true,
      );
      expect(result.entities.map((entity) => `${entity.entityType}:${entity.slug}`)).toEqual(
        expect.arrayContaining([
          "action:dash",
          "background:acolyte",
          "class:cleric",
          "condition:grappled",
          "equipment:armor",
          "feat:grappler",
          "species:human",
          "spell:fireball",
        ]),
      );
    } finally {
      runtime?.close();
    }
  });

  test("extracts SRD parser metadata needed for filtering and sheet links", async () => {
    const bless = parseRuleMarkdown(
      "docs/rules/srd-5.1-fixtures/spells/level-1/bless.md",
      await Bun.file("docs/rules/srd-5.1-fixtures/spells/level-1/bless.md").text(),
    );
    const chainMail = parseRuleMarkdown(
      "docs/rules/srd-5.1-fixtures/equipment/armour/chain-mail.md",
      await Bun.file("docs/rules/srd-5.1-fixtures/equipment/armour/chain-mail.md").text(),
    );
    const wizard = parseRuleMarkdown(
      "docs/rules/srd-5.1-fixtures/classes/wizard/wizard.md",
      await Bun.file("docs/rules/srd-5.1-fixtures/classes/wizard/wizard.md").text(),
    );
    const actionSurge = parseRuleMarkdown(
      "docs/rules/srd-5.1-fixtures/classes/fighter/action-surge.md",
      await Bun.file("docs/rules/srd-5.1-fixtures/classes/fighter/action-surge.md").text(),
    );
    const evoker = parseRuleMarkdown(
      "docs/rules/srd-5.1-fixtures/classes/wizard/subclasses/evoker.md",
      await Bun.file("docs/rules/srd-5.1-fixtures/classes/wizard/subclasses/evoker.md").text(),
    );
    const dwarf = parseRuleMarkdown(
      "docs/rules/srd-5.1-fixtures/species/dwarf.md",
      await Bun.file("docs/rules/srd-5.1-fixtures/species/dwarf.md").text(),
    );

    expect(bless).toMatchObject({
      entityType: "spell",
      source: { abbreviation: "SRD 5.1", contentCategory: "srd" },
    });
    expect(bless.mechanics[0]?.data).toMatchObject({
      level: 1,
      school: "Enchantment",
    });
    expect(bless.mechanics[0]?.data.tags).toEqual(
      expect.arrayContaining(["level-1", "spell", "spells"]),
    );
    expect(String(bless.mechanics[0]?.data.searchableText)).toContain(
      "You bless up to three creatures",
    );
    expect(chainMail).toMatchObject({ entityType: "equipment" });
    expect(chainMail.mechanics[0]?.data).toMatchObject({
      category: "armour",
      tags: ["armour", "equipment", "heavy-armour"],
    });
    expect(wizard).toMatchObject({ entityType: "class" });
    expect(actionSurge).toMatchObject({ entityType: "class_feature" });
    expect(evoker).toMatchObject({ entityType: "subclass" });
    expect(dwarf).toMatchObject({ entityType: "species" });
  });
});
