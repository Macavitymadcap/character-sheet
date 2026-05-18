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

export class RulesImportService {
  constructor(private readonly repository: RulesSeedRepository) {}

  async importFromLocalSource(sourcePath: string): Promise<RulesImportResult> {
    const { files, skippedFiles } = await collectRuleFiles(sourcePath);
    const entities: UpsertedRuleEntity[] = [];
    const sourceCounts: Record<string, number> = {};

    for (const filePath of files) {
      for (const entity of await parseLocalRuleFile(filePath)) {
        const upserted = this.repository.upsertRuleEntity(withImportProvenance(entity, filePath));
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
    mechanics: [parseMechanic(entityType, filePath, body)],
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

function parseMechanic(
  entityType: RuleEntityType,
  filePath: string,
  body: string,
): RuleMechanicSeedInput {
  if (entityType === "spell") return parseSpellMechanic(filePath, body);
  if (entityType === "infusion") return parseInfusionMechanic(body);
  if (entityType === "background") return parseBackgroundMechanic(body);

  return {
    data: {
      description: normaliseRuleText(stripMetadata(body)),
      sections: parseSections(body),
      subtitle: normaliseRuleText(readSubtitle(body) ?? ""),
    },
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
    data: {
      castingTime: normaliseRuleText(fields["Casting Time"] ?? ""),
      components: normaliseRuleText(fields.Components ?? ""),
      description: normaliseRuleText(description),
      duration: normaliseRuleText(fields.Duration ?? ""),
      higherLevels: normaliseRuleText(higherLevels ?? ""),
      level: spellInfo.level,
      range: normaliseRuleText(fields.Range ?? ""),
      school: spellInfo.school,
    },
    mechanicType: "spell",
  };
}

function parseInfusionMechanic(body: string): RuleMechanicSeedInput {
  const subtitle = readSubtitle(body) ?? "";

  return {
    data: {
      description: normaliseRuleText(stripMetadata(body)),
      prerequisite: normaliseRuleText(subtitle),
      requiresAttunement: /requires attunement/i.test(subtitle),
    },
    mechanicType: "infusion",
  };
}

function parseBackgroundMechanic(body: string): RuleMechanicSeedInput {
  const fields = readBoldFields(body);
  const sections = parseSections(body);
  const feature = sections.find((section) => section.title !== "Background Features");

  return {
    data: {
      description: normaliseRuleText(feature?.body ?? stripMetadata(body)),
      equipment: normaliseRuleText(fields.Equipment ?? ""),
      featureName: normaliseRuleText(feature?.title ?? ""),
      skillProficiencies: splitCsv(fields["Skill Proficiencies"]),
      toolProficiencies: splitCsv(fields["Tool Proficiencies"]),
    },
    mechanicType: "background",
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

  if (normalisedPath.includes("/spells/")) return "spell";
  if (normalisedPath.includes("/infusions/")) return "infusion";
  if (normalisedPath.includes("/species/")) return "species_trait";
  if (normalisedPath.includes("/backgrounds/")) return "background";
  if (normalisedPath.includes("/equipment/")) return "equipment";
  if (normalisedPath.includes("/conditions/")) return "condition";

  return "class_feature";
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
    id: "rules_source_srd_5_1",
    name: "Systems Reference Document 5.1",
    precedence: 15,
    slug: "srd-5-1",
  },
  local: {
    abbreviation: "Local",
    id: "rules_source_local",
    name: "Local Campaign",
    precedence: 100,
    slug: "local-campaign",
  },
  mpmotm: {
    abbreviation: "MPMotM",
    id: "rules_source_mpmotm",
    name: "Mordenkainen Presents: Monsters of the Multiverse",
    precedence: 30,
    slug: "mordenkainen-presents-monsters-of-the-multiverse",
  },
  phb: {
    abbreviation: "PHB",
    id: "rules_source_phb",
    name: "Player's Handbook",
    precedence: 10,
    slug: "players-handbook",
  },
  tcoe: {
    abbreviation: "TCoE",
    id: "rules_source_tcoe",
    name: "Tasha's Cauldron of Everything",
    precedence: 20,
    slug: "tashas-cauldron-of-everything",
  },
  xgte: {
    abbreviation: "XGtE",
    id: "rules_source_xgte",
    name: "Xanathar's Guide to Everything",
    precedence: 15,
    slug: "xanathars-guide-to-everything",
  },
} satisfies Record<string, RulesSourceSeedInput>;
