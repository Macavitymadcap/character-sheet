import { describe, expect, test } from "bun:test";

const schemaFiles = [
  "docs/rules/private-rules/schema.yml",
  "docs/rules/private-rules/entry-types.yml",
  "docs/rules/private-rules/ability-scores.yml",
  "docs/rules/private-rules/subclass-mechanics.yml",
];

const requiredSources = ["PHB", "DMG", "MM", "TCOE", "XGTE", "MPMM"];
const requiredEntityTypes = [
  "class",
  "subclass",
  "class_feature",
  "subclass_feature",
  "species",
  "species_trait",
  "feat",
  "background",
  "spell",
  "monster",
  "equipment",
  "magic_item",
  "condition",
  "optional_rule",
  "invocation",
  "infusion",
  "fighting_style",
  "manoeuvre",
  "metamagic",
  "pact_boon",
  "language",
  "proficiency",
  "rule",
];
const abilityScoreModes = [
  "fixed",
  "flexible_plus_two_plus_one",
  "flexible_three_plus_one",
  "feat_choice",
  "manual",
  "point_buy",
];

describe("private rules schema contract", () => {
  test("documents every Friday-required source book and rule entity type", async () => {
    const text = await readSchemaText();

    for (const source of requiredSources) {
      expect(text).toContain(`code: ${source}`);
    }
    for (const entityType of requiredEntityTypes) {
      expect(text).toContain(`id: ${entityType}`);
    }
    for (const mode of abilityScoreModes) {
      expect(text).toContain(`mode: ${mode}`);
    }
  });

  test("keeps the safe example fixture aligned with the schema vocabulary", async () => {
    const schemaText = await readSchemaText();
    const example = await Bun.file("docs/rules/private-rules.example.yaml").text();
    const schemaSourceCodes = yamlScalarValues(schemaText, "code");
    const schemaEntityTypes = yamlScalarValues(schemaText, "id");
    const schemaAbilityModes = yamlScalarValues(schemaText, "mode");

    expect(example).toContain("schemaVersion: 1");
    expect(example).toContain("campaign_rovnost_shadows");
    for (const sourceCode of yamlScalarValues(example, "sourceCode")) {
      expect(schemaSourceCodes).toContain(sourceCode);
    }
    for (const entityType of yamlScalarValues(example, "type")) {
      expect(schemaEntityTypes).toContain(entityType);
    }
    for (const mode of yamlScalarValues(example, "mode")) {
      expect(schemaAbilityModes).toContain(mode);
    }
    expect(example).toContain("Synthetic fixture text only");
    expect(example).not.toContain("real private YAML");
  });
});

async function readSchemaText() {
  return (await Promise.all(schemaFiles.map((file) => Bun.file(file).text()))).join("\n");
}

function yamlScalarValues(text: string, key: string) {
  return [...text.matchAll(new RegExp(`^\\s*(?:-\\s*)?${key}:\\s*([^\\n#]+)`, "gm"))]
    .map((match) => match[1]?.trim().replace(/^["']|["']$/g, ""))
    .filter((value): value is string => Boolean(value));
}
