import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { parse as parseYaml } from "yaml";
import type {
  AbilityName,
  RuleEntitySeedInput,
  RuleEntityType,
  RuleAbilityScoreModel,
  RuleChoiceKind,
  RuleChoiceRecord,
  RuleChoiceSource,
  RuleEffectGrant,
  RuleEffectTarget,
  RuleMechanicSeedInput,
  RulePrerequisiteKind,
  RulePrerequisiteRecord,
  RulesSeedRepository,
  RulesSourceSeedInput,
  UpsertedRuleEntity,
} from "../db";

export interface RulesImportResult {
  entities: UpsertedRuleEntity[];
  imported: number;
  skippedFiles: string[];
  sourceCounts: Record<string, number>;
}

export interface PrivateRulesImportResult extends RulesImportResult {
  backupConfirmed: boolean;
  backupReference: string | null;
  duplicateEntries: string[];
  failedFiles: Array<{ filePath: string; message: string }>;
  shadowedSrdEntries: string[];
}

export interface RulesImportOptions {
  campaignId?: string;
  publicExportEligible?: boolean;
  source?: Partial<RulesSourceSeedInput>;
  visibility?: RulesSourceSeedInput["visibility"];
}

export interface PrivateRulesImportOptions {
  backupConfirmed?: boolean;
  backupReference?: string | null;
  campaignId: string;
  importedAt?: Date;
}

export class RulesImportService {
  constructor(private readonly repository: RulesSeedRepository) {}

  async importFromLocalSource(sourcePath: string, options: RulesImportOptions = {}): Promise<RulesImportResult> {
    const { files, skippedFiles } = await collectRuleFiles(sourcePath);
    const entities: UpsertedRuleEntity[] = [];
    const sourceCounts: Record<string, number> = {};

    for (const filePath of files) {
      for (const entity of await parseLocalRuleFile(filePath)) {
        const upserted = this.repository.upsertRuleEntity(
          withImportOptions(withImportProvenance(entity, filePath), options),
        );
        entities.push(upserted);
        sourceCounts[upserted.source.slug] = (sourceCounts[upserted.source.slug] ?? 0) + 1;
      }
    }

    return {
      entities,
      imported: entities.length,
      skippedFiles,
      sourceCounts,
    };
  }

  async importPrivateYaml(sourcePath: string, options: PrivateRulesImportOptions): Promise<PrivateRulesImportResult> {
    const { files, skippedFiles } = await collectPrivateRuleFiles(sourcePath);
    const entities: UpsertedRuleEntity[] = [];
    const sourceCounts: Record<string, number> = {};
    const duplicateEntries = new Set<string>();
    const failedFiles: PrivateRulesImportResult["failedFiles"] = [];
    const seenEntries = new Set<string>();
    const shadowedSrdEntries = new Set<string>();
    const importedAt = options.importedAt ?? new Date();

    for (const filePath of files) {
      let parsedEntities: RuleEntitySeedInput[];
      try {
        parsedEntities = parsePrivateRuleYaml(
          await readFile(filePath, "utf8"),
          filePath,
          options.campaignId,
          importedAt,
        );
      } catch (error) {
        failedFiles.push({
          filePath,
          message: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      for (const entity of parsedEntities) {
        const naturalKey = `${entity.source.slug}:${entity.entityType}:${entity.slug}`;
        const campaignKey = `${entity.entityType}:${entity.slug}`;
        if (seenEntries.has(naturalKey)) {
          duplicateEntries.add(naturalKey);
          continue;
        }
        seenEntries.add(naturalKey);
        if (
          this.repository.findRuleEntityReference(entity.entityType, entity.slug, {
            contentCategory: "srd",
          })
        ) {
          shadowedSrdEntries.add(campaignKey);
        }

        const upserted = this.repository.upsertRuleEntity(entity);
        entities.push(upserted);
        sourceCounts[upserted.source.slug] = (sourceCounts[upserted.source.slug] ?? 0) + 1;
      }
    }

    return {
      backupConfirmed: options.backupConfirmed ?? false,
      backupReference: options.backupReference ?? null,
      duplicateEntries: [...duplicateEntries].sort(),
      entities,
      failedFiles,
      imported: entities.length,
      shadowedSrdEntries: [...shadowedSrdEntries].sort(),
      skippedFiles,
      sourceCounts,
    };
  }
}

interface PrivateRulesDocument {
  campaign?: {
    id?: unknown;
    name?: unknown;
    slug?: unknown;
  };
  entities?: unknown;
  schemaVersion?: unknown;
  sources?: unknown;
}

interface PrivateRulesSourceDocument {
  abbreviation?: unknown;
  category?: unknown;
  code?: unknown;
  precedence?: unknown;
  title?: unknown;
  visibility?: unknown;
}

interface PrivateRulesEntityDocument {
  abilityScores?: unknown;
  bodyMarkdown?: unknown;
  choices?: unknown;
  grants?: unknown;
  id?: unknown;
  links?: unknown;
  mechanics?: unknown;
  metadata?: unknown;
  name?: unknown;
  prerequisites?: unknown;
  slug?: unknown;
  source?: {
    note?: unknown;
    page?: unknown;
    section?: unknown;
    sourceCode?: unknown;
  };
  summary?: unknown;
  tags?: unknown;
  type?: unknown;
}

function parsePrivateRuleYaml(
  content: string,
  filePath: string,
  campaignId: string,
  importedAt: Date,
): RuleEntitySeedInput[] {
  const parsed = parseYaml(content) as PrivateRulesDocument;
  if (!parsed || typeof parsed !== "object") throw new Error("Private rules YAML must be an object.");
  if (parsed.schemaVersion !== 1) throw new Error("Private rules YAML must use schemaVersion: 1.");
  if (parsed.campaign?.id !== campaignId) {
    throw new Error(`Private rules YAML campaign.id must be ${campaignId}.`);
  }
  if (!Array.isArray(parsed.sources) || parsed.sources.length === 0) {
    throw new Error("Private rules YAML must include at least one source.");
  }
  if (!Array.isArray(parsed.entities) || parsed.entities.length === 0) {
    throw new Error("Private rules YAML must include at least one entity.");
  }

  const sourcesByCode = new Map<string, RulesSourceSeedInput>();
  for (const source of parsed.sources as PrivateRulesSourceDocument[]) {
    const seedSource = privateSourceFromYaml(source, campaignId);
    sourcesByCode.set(sourceCode(source), seedSource);
  }

  return (parsed.entities as PrivateRulesEntityDocument[]).map((entity, index) =>
    privateEntityFromYaml(entity, index, sourcesByCode, filePath, importedAt),
  );
}

function privateSourceFromYaml(source: PrivateRulesSourceDocument, campaignId: string): RulesSourceSeedInput {
  const code = sourceCode(source);
  const name = requiredString(source.title, `source ${code}.title`);
  const category = optionalString(source.category, "official_2014");
  const visibility = optionalString(source.visibility, "campaign");
  if (visibility === "public" && !["srd", "licensed", "operator_public"].includes(category)) {
    throw new Error(`Private source ${code} cannot use public visibility without SRD/licensed category.`);
  }

  return {
    abbreviation: requiredString(source.abbreviation, `source ${code}.abbreviation`),
    campaignIds: visibility === "campaign" ? [campaignId] : [],
    contentCategory: category === "srd" ? "srd" : "third_party",
    id: `rules_source_private_${slugify(campaignId)}_${slugify(code)}`,
    name,
    precedence: requiredNumber(source.precedence, `source ${code}.precedence`),
    publicExportEligible: category === "srd",
    slug: `${slugify(campaignId)}-${slugify(name)}`,
    visibility: visibility === "public" ? "public" : "campaign",
  };
}

function privateEntityFromYaml(
  entity: PrivateRulesEntityDocument,
  index: number,
  sourcesByCode: Map<string, RulesSourceSeedInput>,
  filePath: string,
  importedAt: Date,
): RuleEntitySeedInput {
  const type = requiredString(entity.type, `entities[${index}].type`);
  const entityType = mapPrivateEntityType(type);
  const sourceCode = requiredString(entity.source?.sourceCode, `entities[${index}].source.sourceCode`);
  const source = sourcesByCode.get(sourceCode);
  if (!source) throw new Error(`entities[${index}] references unknown sourceCode ${sourceCode}.`);
  const name = requiredString(entity.name, `entities[${index}].name`);
  const slug = optionalString(entity.slug, slugify(name));
  const tags = stringArray(entity.tags);
  const bodyMarkdown = optionalString(entity.bodyMarkdown, "");
  const summary = optionalString(entity.summary, "");
  const sourceReference = {
    note: optionalString(entity.source?.note, ""),
    page: entity.source?.page ?? null,
    section: optionalString(entity.source?.section, ""),
    sourceCode,
  };
  const provenance = {
    importSourcePath: normalisePath(filePath),
    importTimestamp: importedAt.toISOString(),
    originalPath: normalisePath(filePath),
    ruleType: entityType,
    source: source.abbreviation,
    sourceReference,
  };
  const abilityScores = normaliseAbilityScoreModel(entity.abilityScores, `entities[${index}].abilityScores`);
  const prerequisites = normalisePrerequisites(entity.prerequisites, `entities[${index}].prerequisites`);
  const grants = normaliseGrants(entity.grants, `entities[${index}].grants`);
  const choices = normaliseChoices(entity.choices, `entities[${index}].choices`);
  const baseData = {
    abilityScores,
    choices,
    description: normaliseRuleText(bodyMarkdown || summary),
    grants,
    links: entity.links ?? [],
    metadata: entity.metadata ?? {},
    prerequisites,
    privateRules: true,
    provenance,
    searchableText: normaliseRuleText(stripMarkdown(`${summary}\n${bodyMarkdown}`)),
    sourceReference,
    summary: normaliseRuleText(summary),
    tags: [...new Set([entityType, type, ...tags].map(slugify))].sort(),
  };
  const mechanics = [
    {
      data: baseData,
      mechanicType: entityType,
    },
    ...privateMechanics(entity.mechanics, provenance),
  ];

  return {
    entityType,
    id: typeof entity.id === "string" && entity.id.trim() ? entity.id.trim() : undefined,
    mechanics,
    name,
    slug,
    source,
  };
}

function privateMechanics(mechanics: unknown, provenance: Record<string, unknown>): RuleMechanicSeedInput[] {
  if (!Array.isArray(mechanics)) return [];

  return mechanics.map((mechanic, index) => {
    if (!mechanic || typeof mechanic !== "object") {
      throw new Error(`mechanics[${index}] must be an object.`);
    }
    const record = mechanic as { data?: unknown; display?: unknown; kind?: unknown; sourceLevel?: unknown };
    const kind = requiredString(record.kind, `mechanics[${index}].kind`);

    return {
      data: {
        data: record.data ?? {},
        display: optionalString(record.display, ""),
        provenance,
        sourceLevel: record.sourceLevel ?? null,
      },
      mechanicType: kind,
    };
  });
}

function normaliseAbilityScoreModel(value: unknown, label: string): RuleAbilityScoreModel | null {
  if (value === undefined || value === null) return null;
  const record = requiredRecord(value, label);
  const mode = requiredString(record.mode, `${label}.mode`);

  if (mode === "fixed") {
    const bonuses = requiredRecord(record.bonuses, `${label}.bonuses`);
    const normalised: Partial<Record<AbilityName, number>> = {};
    for (const [ability, bonus] of Object.entries(bonuses)) {
      normalised[normaliseAbilityName(ability, `${label}.bonuses`)] = requiredNumber(bonus, `${label}.bonuses.${ability}`);
    }

    return { bonuses: normalised, mode };
  }
  if (mode === "flexible_plus_two_plus_one") {
    return {
      disallowSameAbility: optionalBoolean(record.disallowSameAbility, true),
      mode,
      plusOne: normaliseChoiceDefinition(record.plusOne, `${label}.plusOne`),
      plusTwo: normaliseChoiceDefinition(record.plusTwo, `${label}.plusTwo`),
    };
  }
  if (mode === "flexible_three_plus_one") {
    return {
      disallowSameAbility: optionalBoolean(record.disallowSameAbility, true),
      mode,
      plusOne: normaliseChoiceDefinition(record.plusOne, `${label}.plusOne`),
    };
  }
  if (mode === "feat_choice") {
    return {
      bonus: requiredNumber(record.bonus, `${label}.bonus`),
      choose: requiredPositiveInteger(record.choose, `${label}.choose`),
      from: normaliseChoiceSource(record.from, `${label}.from`),
      mode,
    };
  }
  if (mode === "manual") {
    return {
      mode,
      note: requiredString(record.note, `${label}.note`),
    };
  }
  if (mode === "point_buy") {
    return {
      budget: requiredPositiveInteger(record.budget, `${label}.budget`),
      maximum: requiredPositiveInteger(record.maximum, `${label}.maximum`),
      minimum: requiredPositiveInteger(record.minimum, `${label}.minimum`),
      mode,
    };
  }

  throw new Error(`${label}.mode must be one of ${abilityScoreModes.join(", ")}.`);
}

function normalisePrerequisites(value: unknown, label: string): RulePrerequisiteRecord[] {
  if (value === undefined || value === null) return [];
  return requiredArray(value, label).map((item, index) => {
    const record = requiredRecord(item, `${label}[${index}]`);
    const kind = normalisePrerequisiteKind(requiredString(record.kind, `${label}[${index}].kind`), `${label}[${index}].kind`);

    return {
      kind,
      minimum: optionalNumber(record.minimum, `${label}[${index}].minimum`),
      note: optionalTrimmedString(record.note),
      target: requiredString(record.target, `${label}[${index}].target`),
    };
  });
}

function normaliseGrants(value: unknown, label: string): RuleEffectGrant[] {
  if (value === undefined || value === null) return [];
  return requiredArray(value, label).map((item, index) => normaliseGrant(item, `${label}[${index}]`));
}

function normaliseChoices(value: unknown, label: string): RuleChoiceRecord[] {
  if (value === undefined || value === null) return [];
  return requiredArray(value, label).map((item, index) => {
    const record = requiredRecord(item, `${label}[${index}]`);
    const kind = normaliseChoiceKind(requiredString(record.kind, `${label}[${index}].kind`), `${label}[${index}].kind`);

    return {
      auditLabel: requiredString(record.auditLabel, `${label}[${index}].auditLabel`),
      choose: requiredPositiveInteger(record.choose, `${label}[${index}].choose`),
      from: normaliseChoiceSource(record.from, `${label}[${index}].from`),
      grants: normaliseGrants(record.grants, `${label}[${index}].grants`),
      kind,
      optional: optionalBoolean(record.optional, false),
    };
  });
}

function normaliseGrant(value: unknown, label: string): RuleEffectGrant {
  const record = requiredRecord(value, label);

  return {
    amount: optionalNumber(record.amount, `${label}.amount`),
    auditLabel: requiredString(record.auditLabel, `${label}.auditLabel`),
    duration: optionalTrimmedString(record.duration),
    sourceLevel: optionalNumber(record.sourceLevel, `${label}.sourceLevel`),
    target: normaliseGrantTarget(requiredString(record.target, `${label}.target`), `${label}.target`),
    value: record.value ?? null,
  };
}

function normaliseChoiceDefinition(value: unknown, label: string) {
  const record = requiredRecord(value, label);

  return {
    choose: requiredPositiveInteger(record.choose, `${label}.choose`),
    from: normaliseChoiceSource(record.from, `${label}.from`),
  };
}

function normaliseChoiceSource(value: unknown, label: string): RuleChoiceSource {
  if (value === "all") return "all";
  if (Array.isArray(value)) {
    const values = value.map((item, index) => requiredString(item, `${label}[${index}]`));
    if (values.length === 0) throw new Error(`${label} must not be empty.`);

    return values;
  }
  const record = requiredRecord(value, label);
  const source: Exclude<RuleChoiceSource, "all" | string[]> = {};
  if (record.entityType !== undefined) source.entityType = requiredString(record.entityType, `${label}.entityType`) as RuleEntityType;
  if (record.sourceSlug !== undefined) source.sourceSlug = requiredString(record.sourceSlug, `${label}.sourceSlug`);
  if (record.tag !== undefined) source.tag = requiredString(record.tag, `${label}.tag`);
  if (!source.entityType && !source.sourceSlug && !source.tag) {
    throw new Error(`${label} must include entityType, sourceSlug, or tag.`);
  }

  return source;
}

function sourceCode(source: PrivateRulesSourceDocument) {
  return requiredString(source.code, "source.code");
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);

  return value.trim();
}

function optionalString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function requiredNumber(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be a number.`);

  return value;
}

function optionalNumber(value: unknown, label: string) {
  if (value === undefined || value === null) return undefined;

  return requiredNumber(value, label);
}

function requiredPositiveInteger(value: unknown, label: string) {
  const number = requiredNumber(value, label);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} must be a positive integer.`);

  return number;
}

function requiredArray(value: unknown, label: string) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);

  return value;
}

function requiredRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function optionalBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function optionalTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : [];
}

function normaliseAbilityName(value: string, label: string): AbilityName {
  if (abilityNames.includes(value as AbilityName)) return value as AbilityName;

  throw new Error(`${label} must use one of ${abilityNames.join(", ")}.`);
}

function normaliseChoiceKind(value: string, label: string): RuleChoiceKind {
  if (choiceKinds.includes(value as RuleChoiceKind)) return value as RuleChoiceKind;

  throw new Error(`${label} must use one of ${choiceKinds.join(", ")}.`);
}

function normaliseGrantTarget(value: string, label: string): RuleEffectTarget {
  if (grantTargets.includes(value as RuleEffectTarget)) return value as RuleEffectTarget;

  throw new Error(`${label} must use one of ${grantTargets.join(", ")}.`);
}

function normalisePrerequisiteKind(value: string, label: string): RulePrerequisiteKind {
  if (prerequisiteKinds.includes(value as RulePrerequisiteKind)) return value as RulePrerequisiteKind;

  throw new Error(`${label} must use one of ${prerequisiteKinds.join(", ")}.`);
}

function mapPrivateEntityType(type: string): RuleEntityType {
  const mapped = privateEntityTypeMap[type];
  if (!mapped) throw new Error(`Unsupported private rules entity type: ${type}.`);

  return mapped;
}

const privateEntityTypeMap: Record<string, RuleEntityType> = {
  background: "background",
  class: "class",
  class_feature: "class_feature",
  condition: "condition",
  equipment: "equipment",
  feat: "feat",
  fighting_style: "class_feature",
  infusion: "infusion",
  invocation: "class_feature",
  language: "proficiency",
  magic_item: "equipment",
  manoeuvre: "class_feature",
  metamagic: "class_feature",
  monster: "stat_block",
  optional_rule: "core_rule",
  pact_boon: "class_feature",
  proficiency: "proficiency",
  rule: "core_rule",
  species: "species",
  species_trait: "species_trait",
  spell: "spell",
  subclass: "subclass",
  subclass_feature: "subclass_feature",
};

const abilityNames: AbilityName[] = [
  "charisma",
  "constitution",
  "dexterity",
  "intelligence",
  "strength",
  "wisdom",
];

const abilityScoreModes = [
  "feat_choice",
  "fixed",
  "flexible_plus_two_plus_one",
  "flexible_three_plus_one",
  "manual",
  "point_buy",
];

const choiceKinds: RuleChoiceKind[] = [
  "ability_score",
  "equipment",
  "feature_option",
  "language",
  "proficiency",
  "spell",
  "tool",
];

const grantTargets: RuleEffectTarget[] = [
  "ability_score",
  "armour_class_modifier",
  "condition",
  "equipment",
  "feature",
  "hit_die",
  "hit_points",
  "language",
  "proficiency",
  "resource",
  "senses",
  "speed",
  "spell",
];

const prerequisiteKinds: RulePrerequisiteKind[] = [
  "ability_score",
  "character_level",
  "class_level",
  "equipment",
  "feature",
  "manual",
  "pact_boon",
  "proficiency",
  "species",
  "spellcasting",
  "subclass",
];

function withImportOptions(
  entity: RuleEntitySeedInput,
  options: RulesImportOptions,
): RuleEntitySeedInput {
  if (!options.campaignId && !options.visibility && options.publicExportEligible === undefined && !options.source) {
    return entity;
  }
  const campaignIds = new Set(entity.source.campaignIds ?? []);
  if (options.campaignId) campaignIds.add(options.campaignId);

  return {
    ...entity,
    source: {
      ...entity.source,
      ...options.source,
      campaignIds: [...campaignIds].sort(),
      publicExportEligible: options.publicExportEligible ?? entity.source.publicExportEligible ?? false,
      visibility: options.visibility ?? entity.source.visibility ?? (options.campaignId ? "campaign" : "public"),
    },
  };
}

export async function parseLocalRuleFile(filePath: string): Promise<RuleEntitySeedInput[]> {
  const content = await readFile(filePath, "utf8");

  if (filePath.endsWith(".json")) return parseRuleJson(content);
  if (filePath.endsWith(".md")) return [parseRuleMarkdown(filePath, content)];

  return [];
}

export function parseRuleMarkdown(filePath: string, content: string): RuleEntitySeedInput {
  const title = readTitle(content);
  const body = content.replace(/^#\s+.+\n?/, "").trim();
  const entityType = inferEntityType(filePath);
  const source = inferRulesSource(filePath);
  const slug = slugify(title);

  return {
    entityType,
    mechanics: parseMechanics(entityType, filePath, body),
    name: title,
    slug,
    source,
  };
}

export function normaliseRuleText(text: string) {
  return replacements.reduce(
    (normalised, [pattern, replacement]) => normalised.replace(pattern, replacement),
    text,
  );
}

export function resolveRulesSource(
  existing: RulesSourceSeedInput,
  incoming: RulesSourceSeedInput,
): RulesSourceSeedInput {
  return incoming.precedence >= existing.precedence ? incoming : existing;
}

function parseRuleJson(content: string): RuleEntitySeedInput[] {
  const parsed = JSON.parse(content) as RuleEntitySeedInput | RuleEntitySeedInput[] | {
    entities?: RuleEntitySeedInput[];
  };

  if (Array.isArray(parsed)) return enrichSpellClasses(parsed);
  if ("entities" in parsed && Array.isArray(parsed.entities)) return enrichSpellClasses(parsed.entities);

  return enrichSpellClasses([parsed as RuleEntitySeedInput]);
}

const classSpellListLabels: Record<string, string> = {
  "bard-spells": "Bard",
  "cleric-spells": "Cleric",
  "druid-spells": "Druid",
  "paladin-spells": "Paladin",
  "ranger-spells": "Ranger",
  "sorcerer-spells": "Sorcerer",
  "warlock-spells": "Warlock",
  "wizard-spells": "Wizard",
};

const srdSpellClassCorrections: Record<string, string[]> = {
  bless: ["Cleric"],
};

function enrichSpellClasses(entities: RuleEntitySeedInput[]): RuleEntitySeedInput[] {
  const classMap = createSpellClassMap(entities);
  if (classMap.size === 0) return entities;

  return entities.map((entity) => {
    if (entity.entityType !== "spell") return entity;
    const inferredClasses = classMap.get(slugify(entity.name));
    if (!inferredClasses?.size) return entity;

    return {
      ...entity,
      mechanics: entity.mechanics.map((mechanic) => {
        if (mechanic.mechanicType !== "spell") return mechanic;

        const existingClasses = Array.isArray(mechanic.data.classes)
          ? mechanic.data.classes.filter((value): value is string => typeof value === "string" && value.trim() !== "")
          : [];
        const classes = sortClasses([...new Set([...existingClasses, ...inferredClasses])]);
        const existingTags = Array.isArray(mechanic.data.tags)
          ? mechanic.data.tags.filter((value): value is string => typeof value === "string" && value.trim() !== "")
          : [];
        const classListTags = new Set(Object.keys(classSpellListLabels));
        const tags = [
          ...existingTags.filter((tag) => !classListTags.has(tag)),
          ...classes.map((className) => `${slugify(className)}-spells`),
        ];

        return {
          ...mechanic,
          data: {
            ...mechanic.data,
            classes,
            tags: [...new Set(tags)],
          },
        };
      }),
    };
  });
}

function createSpellClassMap(entities: RuleEntitySeedInput[]) {
  const spellNames = entities
    .filter((entity) => entity.entityType === "spell")
    .map((entity) => ({ name: entity.name, slug: slugify(entity.name) }));
  const classMap = new Map<string, Set<string>>();

  for (const entity of entities) {
    const className = classSpellListLabels[entity.slug];
    if (!className) continue;

    const spellListText = entity.mechanics
      .map((mechanic) => String(mechanic.data.description ?? mechanic.data.searchableText ?? ""))
      .join("\n");
    for (const spell of spellNames) {
      if (containsRuleName(spellListText, spell.name)) {
        const classes = classMap.get(spell.slug) ?? new Set<string>();
        classes.add(className);
        classMap.set(spell.slug, classes);
      }
    }
  }

  for (const [spellSlug, classNames] of Object.entries(srdSpellClassCorrections)) {
    const spellExists = spellNames.some((spell) => spell.slug === spellSlug);
    if (!spellExists) continue;
    const classes = classMap.get(spellSlug) ?? new Set<string>();
    for (const className of classNames) classes.add(className);
    classMap.set(spellSlug, classes);
  }

  return classMap;
}

function containsRuleName(text: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

function sortClasses(classes: Iterable<string>) {
  const order = Object.values(classSpellListLabels);

  return [...classes].sort((left, right) => {
    const leftIndex = order.indexOf(left);
    const rightIndex = order.indexOf(right);

    return (leftIndex === -1 ? order.length : leftIndex) - (rightIndex === -1 ? order.length : rightIndex) ||
      left.localeCompare(right);
  });
}

function parseMechanics(
  entityType: RuleEntityType,
  filePath: string,
  body: string,
): RuleMechanicSeedInput[] {
  const mechanic = parseMechanic(entityType, filePath, body);
  const statBlock = parseStatBlockMechanic(body);

  return statBlock && mechanic.mechanicType !== "stat_block" ? [mechanic, statBlock] : [mechanic];
}

function parseMechanic(
  entityType: RuleEntityType,
  filePath: string,
  body: string,
): RuleMechanicSeedInput {
  if (entityType === "spell") return parseSpellMechanic(filePath, body);
  if (entityType === "infusion") return parseInfusionMechanic(filePath, body);
  if (entityType === "background") return parseBackgroundMechanic(filePath, body);
  if (entityType === "equipment") return parseEquipmentMechanic(filePath, body);
  if (entityType === "stat_block") return parseStatBlockMechanic(body) ?? {
    data: enrichMechanicData("stat_block", filePath, body, {
      description: normaliseRuleText(stripMetadata(body)),
      sections: parseSections(body),
    }),
    mechanicType: "stat_block",
  };

  return {
    data: enrichMechanicData(entityType, filePath, body, {
      description: normaliseRuleText(stripMetadata(body)),
      sections: parseSections(body),
      subtitle: normaliseRuleText(readSubtitle(body) ?? ""),
      ...parseCommonMetadata(entityType, filePath, body),
    }),
    mechanicType: entityType,
  };
}

function withImportProvenance(
  entity: RuleEntitySeedInput,
  filePath: string,
): RuleEntitySeedInput {
  const sourcePath = normalisePath(filePath);
  const srdVersion = sourcePath.includes("/srd-5.1/") || sourcePath.includes("/srd-5.1-fixtures/")
    ? "5.1"
    : undefined;

  return {
    ...entity,
    mechanics: entity.mechanics.map((mechanic) => ({
      ...mechanic,
      data: {
        ...mechanic.data,
        provenance: {
          originalPath: sourcePath,
          ruleType: entity.entityType,
          source: entity.source.abbreviation,
          ...(srdVersion ? { srdVersion } : {}),
        },
      },
    })),
  };
}

function parseSpellMechanic(filePath: string, body: string): RuleMechanicSeedInput {
  const fields = readBoldFields(body);
  const subtitle = readSubtitle(body);
  const higherLevels = readHigherLevels(body);
  const description = stripMetadata(body)
    .replace(/^##\s+At Higher Levels\.?[\s\S]*$/im, "")
    .trim();
  const spellInfo = parseSpellSubtitle(filePath, subtitle);

  return {
    data: enrichMechanicData("spell", filePath, body, {
      castingTime: normaliseRuleText(fields["Casting Time"] ?? ""),
      components: normaliseRuleText(fields.Components ?? ""),
      description: normaliseRuleText(description),
      duration: normaliseRuleText(fields.Duration ?? ""),
      higherLevels: normaliseRuleText(higherLevels ?? ""),
      ...parseCommonMetadata("spell", filePath, body),
      classes: splitCsv(fields.Classes),
      level: spellInfo.level,
      range: normaliseRuleText(fields.Range ?? ""),
      school: spellInfo.school,
    }),
    mechanicType: "spell",
  };
}

function parseInfusionMechanic(filePath: string, body: string): RuleMechanicSeedInput {
  const subtitle = readSubtitle(body) ?? "";

  return {
    data: enrichMechanicData("infusion", filePath, body, {
      description: normaliseRuleText(stripMetadata(body)),
      ...parseCommonMetadata("infusion", filePath, body),
      prerequisite: normaliseRuleText(subtitle),
      requiresAttunement: /requires attunement/i.test(subtitle),
    }),
    mechanicType: "infusion",
  };
}

function parseBackgroundMechanic(filePath: string, body: string): RuleMechanicSeedInput {
  const fields = readBoldFields(body);
  const sections = parseSections(body);
  const feature = sections.find((section) => section.title !== "Background Features");

  return {
    data: enrichMechanicData("background", filePath, body, {
      description: normaliseRuleText(feature?.body ?? stripMetadata(body)),
      equipment: normaliseRuleText(fields.Equipment ?? ""),
      featureName: normaliseRuleText(feature?.title ?? ""),
      ...parseCommonMetadata("background", filePath, body),
      skillProficiencies: splitCsv(fields["Skill Proficiencies"]),
      toolProficiencies: splitCsv(fields["Tool Proficiencies"]),
    }),
    mechanicType: "background",
  };
}

function parseEquipmentMechanic(filePath: string, body: string): RuleMechanicSeedInput {
  return {
    data: enrichMechanicData("equipment", filePath, body, {
      category: inferEquipmentCategory(filePath, body),
      description: normaliseRuleText(stripMetadata(body)),
      sections: parseSections(body),
      subtitle: normaliseRuleText(readSubtitle(body) ?? ""),
      ...parseCommonMetadata("equipment", filePath, body),
    }),
    mechanicType: "equipment",
  };
}

function parseStatBlockMechanic(body: string): RuleMechanicSeedInput | null {
  if (!/(^|\n)\s*(?:\*\*Armor Class:\*\*|Armor Class\b)/i.test(body)) return null;
  if (!/(^|\n)\s*(?:###\s+Actions\b|\*\*Hit Points:\*\*)/i.test(body)) return null;
  const fields = readBoldFields(body);
  const sections = parseSections(body);

  return {
    data: enrichMechanicData("stat_block", "", body, {
      actions: normaliseRuleText(sections.find((section) => section.title === "Actions")?.body ?? ""),
      armourClass: normaliseRuleText(fields["Armor Class"] ?? fields["Armour Class"] ?? ""),
      challenge: normaliseRuleText(fields.Challenge ?? ""),
      description: normaliseRuleText(stripMetadata(body)),
      hitPoints: normaliseRuleText(fields["Hit Points"] ?? ""),
      reactions: normaliseRuleText(sections.find((section) => section.title === "Reactions")?.body ?? ""),
      speed: normaliseRuleText(fields.Speed ?? ""),
      statBlock: true,
    }),
    mechanicType: "stat_block",
  };
}

function enrichMechanicData(
  entityType: RuleEntityType,
  filePath: string,
  body: string,
  data: Record<string, unknown>,
) {
  const text = normaliseRuleText(stripMarkdown(body));

  return {
    ...data,
    actionTiming: inferActionTiming(entityType, data, text),
    charges: inferCharges(text),
    resetCadence: inferResetCadence(text),
    tags: Array.isArray(data.tags) ? data.tags : inferTags(entityType, filePath, body),
  };
}

function inferActionTiming(entityType: RuleEntityType, data: Record<string, unknown>, text: string) {
  const timings = new Set<string>();
  const castingTime = typeof data.castingTime === "string" ? data.castingTime.toLowerCase() : "";
  if (castingTime.includes("bonus action")) timings.add("Bonus action");
  else if (castingTime.includes("reaction")) timings.add("Reaction");
  else if (castingTime.includes("action")) timings.add("Action");
  if (/\bbonus action\b/i.test(text)) timings.add("Bonus action");
  if (/\breactions?\b/i.test(text)) timings.add("Reaction");
  if (/\btake an action\b|\bas an action\b|\busing your action\b/i.test(text)) timings.add("Action");
  if (entityType === "stat_block" && /\bActions\b/i.test(text)) timings.add("Action");
  if (entityType === "species_trait" || /\bpassive\b/i.test(text)) timings.add("Passive");

  return [...timings];
}

function inferCharges(text: string) {
  const match = text.match(/\b(?:has|with)\s+(\d+d\d+|\d+)\s+(?:expended\s+)?charges?\b/i);

  return match?.[1] ? `${match[1]} charges` : "";
}

function inferResetCadence(text: string) {
  if (/short or long rest/i.test(text)) return "Short or long rest";
  if (/daily at dawn|regains? [^.]+ at dawn/i.test(text)) return "Dawn";
  if (/finish(?:es)? a long rest|finishing a long rest/i.test(text)) return "Long rest";
  if (/finish(?:es)? a short rest|finishing a short rest/i.test(text)) return "Short rest";

  return "";
}

function parseCommonMetadata(entityType: RuleEntityType, filePath: string, body: string) {
  const subtitle = readSubtitle(body);

  return {
    searchableText: normaliseRuleText(stripMarkdown(`${subtitle ?? ""}\n${stripMetadata(body)}`)),
    tags: inferTags(entityType, filePath, body),
  };
}

function readTitle(content: string) {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) throw new Error("Rule markdown must start with a level-one heading.");

  return match[1]!.trim();
}

function readSubtitle(body: string) {
  const match = body.match(/^\*([^*\n]+)\*$/m);

  return match?.[1]?.trim() ?? null;
}

function readBoldFields(body: string) {
  const fields: Record<string, string> = {};
  const matches = body.matchAll(/^\*\*([^:*]+):\*\*\s*(.+)$/gm);

  for (const match of matches) {
    fields[match[1]!.trim()] = match[2]!.trim();
  }

  return fields;
}

function readHigherLevels(body: string) {
  const match = body.match(/^##\s+At Higher Levels\.?\s*([\s\S]+)$/im);

  return match?.[1]?.trim() ?? null;
}

function stripMetadata(body: string) {
  return body
    .split("\n")
    .filter((line) => !/^\*[^*\n]+\*$/.test(line.trim()))
    .filter((line) => !/^\*\*([^:*]+):\*\*/.test(line.trim()))
    .join("\n")
    .trim();
}

function stripMarkdown(value: string) {
  return value
    .replace(/\*\*([^*]+):\*\*/g, "$1:")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[`>]/g, "")
    .trim();
}

function parseSections(body: string) {
  const sections: Array<{ body: string; title: string }> = [];
  const matches = [...body.matchAll(/^#{2,3}\s+(.+)$/gm)];

  for (const [index, match] of matches.entries()) {
    const start = (match.index ?? 0) + match[0]!.length;
    const end = matches[index + 1]?.index ?? body.length;
    sections.push({
      body: normaliseRuleText(body.slice(start, end).trim()),
      title: normaliseRuleText(match[1]!.replace(/\.$/, "").trim()),
    });
  }

  return sections;
}

function parseSpellSubtitle(filePath: string, subtitle: string | null) {
  const levelFromPath = Number(filePath.match(/level-(\d+)/)?.[1] ?? NaN);
  const match = subtitle?.match(/^Level\s+(\d+)\s+(.+)$/i);
  const level = Number.isFinite(levelFromPath)
    ? levelFromPath
    : match
      ? Number(match[1]!)
      : 0;

  return {
    level,
    school: normaliseRuleText(match?.[2] ?? (level === 0 ? "Cantrip" : "")),
  };
}

function inferEntityType(filePath: string): RuleEntityType {
  const normalisedPath = normalisePath(filePath);

  if (normalisedPath.includes("/actions/")) return "action";
  if (normalisedPath.includes("/spells/")) return "spell";
  if (normalisedPath.includes("/infusions/")) return "infusion";
  if (normalisedPath.includes("/classes/") && normalisedPath.includes("/subclasses/")) {
    return "subclass";
  }
  if (isClassOverviewFile(normalisedPath)) return "class";
  if (normalisedPath.includes("/species/")) {
    return normalisedPath.includes("/srd-5.1/") || normalisedPath.includes("/srd-5.1-fixtures/")
      ? "species"
      : "species_trait";
  }
  if (normalisedPath.includes("/backgrounds/")) return "background";
  if (normalisedPath.includes("/equipment/")) return "equipment";
  if (normalisedPath.includes("/conditions/")) return "condition";
  if (normalisedPath.includes("/core-rules/")) return "core_rule";
  if (normalisedPath.includes("/feats/")) return "feat";
  if (normalisedPath.includes("/proficiencies/")) return "proficiency";
  if (normalisedPath.includes("/senses/")) return "sense";
  if (normalisedPath.includes("/stat-blocks/") || normalisedPath.includes("/stat_blocks/")) {
    return "stat_block";
  }

  return "class_feature";
}

function isClassOverviewFile(filePath: string) {
  const segments = filePath.split("/");
  const classesIndex = segments.indexOf("classes");
  if (classesIndex === -1) return false;

  const classSlug = segments[classesIndex + 1];
  const fileName = segments[classesIndex + 2];

  return Boolean(classSlug && fileName === `${classSlug}.md`);
}

function inferTags(entityType: RuleEntityType, filePath: string, body: string) {
  const tags = new Set<string>([entityType]);
  const normalisedPath = normalisePath(filePath);
  const subtitle = readSubtitle(body);

  for (const segment of normalisedPath.split("/").slice(0, -1)) {
    if (
      [
        "actions",
        "backgrounds",
        "classes",
        "conditions",
        "core-rules",
        "equipment",
        "feats",
        "proficiencies",
        "senses",
        "stat-blocks",
        "species",
        "spells",
        "subclasses",
      ].includes(segment)
    ) {
      tags.add(segment);
    }
  }

  if (subtitle) tags.add(slugify(subtitle));
  if (entityType === "spell") tags.add(`level-${parseSpellSubtitle(filePath, subtitle).level}`);
  const equipmentCategory = entityType === "equipment" ? inferEquipmentCategory(filePath, body) : "";
  if (equipmentCategory) tags.add(slugify(equipmentCategory));

  return [...tags].sort();
}

function inferEquipmentCategory(filePath: string, body: string) {
  const normalisedPath = normalisePath(filePath);
  const subtitle = readSubtitle(body);
  if (normalisedPath.includes("/equipment/armour/")) return "armour";
  if (normalisedPath.includes("/equipment/armor/")) return "armour";
  if (normalisedPath.includes("/equipment/weapons/")) return "weapon";
  if (normalisedPath.includes("/equipment/adventuring-gear/")) return "adventuring gear";
  if (subtitle) return normaliseRuleText(subtitle).toLowerCase();

  return "equipment";
}

function inferRulesSource(filePath: string): RulesSourceSeedInput {
  const normalisedPath = normalisePath(filePath);
  const fileName = basename(filePath, ".md");

  if (normalisedPath.includes("/srd-5.1/") || normalisedPath.includes("/srd-5.1-fixtures/")) {
    return sources.srd51;
  }
  if (normalisedPath.includes("/backgrounds/special-ops.md")) return sources.local;
  if (normalisedPath.includes("/species/hobgoblin.md")) return sources.mpmotm;
  if (normalisedPath.includes("/classes/artificer/")) return sources.tcoe;
  if (["absorb-elements", "catapult", "snare"].includes(fileName)) return sources.xgte;
  if (fileName === "tashas-caustic-brew") return sources.tcoe;

  return sources.phb;
}

interface CollectedRuleFiles {
  files: string[];
  skippedFiles: string[];
}

async function collectRuleFiles(sourcePath: string): Promise<CollectedRuleFiles> {
  const sourceStats = await stat(sourcePath);
  if (sourceStats.isFile()) {
    return isRuleFile(sourcePath)
      ? { files: [sourcePath], skippedFiles: [] }
      : { files: [], skippedFiles: [sourcePath] };
  }

  const entries = await readdir(sourcePath, { withFileTypes: true });
  const files: string[] = [];
  const skippedFiles: string[] = [];

  for (const entry of entries) {
    const childPath = join(sourcePath, entry.name);
    if (entry.isDirectory()) {
      const childFiles = await collectRuleFiles(childPath);
      files.push(...childFiles.files);
      skippedFiles.push(...childFiles.skippedFiles);
    }
    if (entry.isFile() && isRuleFile(childPath)) files.push(childPath);
    if (entry.isFile() && !isRuleFile(childPath)) skippedFiles.push(childPath);
  }

  return {
    files: files.sort(),
    skippedFiles: skippedFiles.sort(),
  };
}

async function collectPrivateRuleFiles(sourcePath: string): Promise<CollectedRuleFiles> {
  const sourceStats = await stat(sourcePath);
  if (sourceStats.isFile()) {
    return isPrivateRuleFile(sourcePath)
      ? { files: [sourcePath], skippedFiles: [] }
      : { files: [], skippedFiles: [sourcePath] };
  }

  const entries = await readdir(sourcePath, { withFileTypes: true });
  const files: string[] = [];
  const skippedFiles: string[] = [];

  for (const entry of entries) {
    const childPath = join(sourcePath, entry.name);
    if (entry.isDirectory()) {
      const childFiles = await collectPrivateRuleFiles(childPath);
      files.push(...childFiles.files);
      skippedFiles.push(...childFiles.skippedFiles);
    }
    if (entry.isFile() && isPrivateRuleFile(childPath)) files.push(childPath);
    if (entry.isFile() && !isPrivateRuleFile(childPath)) skippedFiles.push(childPath);
  }

  return {
    files: files.sort(),
    skippedFiles: skippedFiles.sort(),
  };
}

function isRuleFile(filePath: string) {
  return filePath.endsWith(".md") || filePath.endsWith(".json");
}

function isPrivateRuleFile(filePath: string) {
  return filePath.endsWith(".yaml") || filePath.endsWith(".yml");
}

function splitCsv(value: string | undefined) {
  if (!value) return [];

  return value.split(",").map((item) => normaliseRuleText(item.trim())).filter(Boolean);
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "rule";
}

function normalisePath(filePath: string) {
  return filePath.replaceAll("\\", "/");
}

const replacements: Array<[RegExp, string]> = [
  [/\bArmor\b/g, "Armour"],
  [/\barmor\b/g, "armour"],
  [/\bArmored\b/g, "Armoured"],
  [/\barmored\b/g, "armoured"],
  [/\bDefense\b/g, "Defence"],
  [/\bdefense\b/g, "defence"],
  [/\bColors\b/g, "Colours"],
  [/\bcolors\b/g, "colours"],
  [/\bColor\b/g, "Colour"],
  [/\bcolor\b/g, "colour"],
  [/\bOdor\b/g, "Odour"],
  [/\bodor\b/g, "odour"],
  [/\bGray\b/g, "Grey"],
  [/\bgray\b/g, "grey"],
  [/\bRecognize\b/g, "Recognise"],
  [/\brecognize\b/g, "recognise"],
  [/\bRecognized\b/g, "Recognised"],
  [/\brecognized\b/g, "recognised"],
  [/\bRecognizes\b/g, "Recognises"],
  [/\brecognizes\b/g, "recognises"],
  [/\bRecognizing\b/g, "Recognising"],
  [/\brecognizing\b/g, "recognising"],
  [/\bTraveler's/g, "Traveller's"],
  [/\btraveler's/g, "traveller's"],
  [/\bTraveler\b/g, "Traveller"],
  [/\btraveler\b/g, "traveller"],
  [/\bTravelers\b/g, "Travellers"],
  [/\btravelers\b/g, "travellers"],
  [/\bTraveling\b/g, "Travelling"],
  [/\btraveling\b/g, "travelling"],
];

const sources = {
  srd51: {
    abbreviation: "SRD 5.1",
    contentCategory: "srd",
    id: "rules_source_srd_5_1",
    name: "Systems Reference Document 5.1",
    precedence: 15,
    slug: "srd-5-1",
  },
  local: {
    abbreviation: "Local",
    contentCategory: "local",
    id: "rules_source_local",
    name: "Local Campaign",
    precedence: 100,
    slug: "local-campaign",
  },
  mpmotm: {
    abbreviation: "MPMotM",
    contentCategory: "third_party",
    id: "rules_source_mpmotm",
    name: "Mordenkainen Presents: Monsters of the Multiverse",
    precedence: 30,
    slug: "mordenkainen-presents-monsters-of-the-multiverse",
  },
  phb: {
    abbreviation: "PHB",
    contentCategory: "third_party",
    id: "rules_source_phb",
    name: "Player's Handbook",
    precedence: 10,
    slug: "players-handbook",
  },
  tcoe: {
    abbreviation: "TCoE",
    contentCategory: "third_party",
    id: "rules_source_tcoe",
    name: "Tasha's Cauldron of Everything",
    precedence: 20,
    slug: "tashas-cauldron-of-everything",
  },
  xgte: {
    abbreviation: "XGtE",
    contentCategory: "third_party",
    id: "rules_source_xgte",
    name: "Xanathar's Guide to Everything",
    precedence: 15,
    slug: "xanathars-guide-to-everything",
  },
} satisfies Record<string, RulesSourceSeedInput>;
