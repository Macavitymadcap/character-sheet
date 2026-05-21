import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type {
  RuleEntitySeedInput,
  RuleEntityType,
  RuleMechanicSeedInput,
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

export interface RulesImportOptions {
  campaignId?: string;
  publicExportEligible?: boolean;
  source?: Partial<RulesSourceSeedInput>;
  visibility?: RulesSourceSeedInput["visibility"];
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
}

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

  if (Array.isArray(parsed)) return parsed;
  if ("entities" in parsed && Array.isArray(parsed.entities)) return parsed.entities;

  return [parsed as RuleEntitySeedInput];
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

function isRuleFile(filePath: string) {
  return filePath.endsWith(".md") || filePath.endsWith(".json");
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
