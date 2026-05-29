#!/usr/bin/env bun
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { stringify as stringifyYaml } from "yaml";

export interface OcrBookConfig {
  abbreviation: string;
  code: string;
  filenames: string[];
  precedence: number;
  title: string;
}

export interface PrivateRulesOcrOptions {
  campaign?: PrivateRulesCampaign;
  excludeTypes?: string[];
  inputDir?: string;
  outputDir?: string;
}

interface PrivateRulesCampaign {
  id: string;
  name: string;
  slug: string;
}

interface ParsedOcrEntry {
  bodyMarkdown: string;
  id: string;
  mechanics: Record<string, unknown>;
  name: string;
  page: number | null;
  slug: string;
  type: string;
}

interface PrivateRulesSource {
  abbreviation: string;
  category: string;
  code: string;
  precedence: number;
  title: string;
  visibility: "campaign";
}

interface PrivateRulesEntity {
  bodyMarkdown: string;
  id: string;
  mechanics: Array<{
    data: unknown;
    display: string;
    kind: string;
  }>;
  metadata: Record<string, unknown>;
  name: string;
  slug: string;
  source: {
    note?: string;
    page?: number;
    sourceCode: string;
  };
  summary: string;
  tags: string[];
  type: string;
}

interface PrivateRulesDocument {
  campaign: PrivateRulesCampaign;
  entities: PrivateRulesEntity[];
  importNotes: string;
  schemaVersion: 1;
  sources: PrivateRulesSource[];
}

export interface PrivateRulesOcrResult {
  combined: PrivateRulesDocument;
  documents: Array<{
    book: OcrBookConfig;
    document: PrivateRulesDocument;
    inputPath: string;
  }>;
  skippedBooks: OcrBookConfig[];
}

export const defaultOcrBooks: OcrBookConfig[] = [
  {
    abbreviation: "PHB",
    code: "PHB",
    filenames: ["phb.md", "Player_s_Handbook__2014_.md", "Player's Handbook (2014).md"],
    precedence: 10,
    title: "Player's Handbook",
  },
  {
    abbreviation: "DMG",
    code: "DMG",
    filenames: ["dmg.md", "Dungeon_Master_s_Guide__2014_.md", "Dungeon Master's Guide (2014).md"],
    precedence: 20,
    title: "Dungeon Master's Guide",
  },
  {
    abbreviation: "MM",
    code: "MM",
    filenames: ["mm.md", "Monster_Manual__2014_.md", "Monster Manual (2014).md"],
    precedence: 30,
    title: "Monster Manual",
  },
  {
    abbreviation: "XGtE",
    code: "XGTE",
    filenames: ["xgte.md", "Xanathar_s_Guide_to_Everything.md", "Xanathar's Guide to Everything.md"],
    precedence: 40,
    title: "Xanathar's Guide to Everything",
  },
  {
    abbreviation: "TCoE",
    code: "TCOE",
    filenames: ["tcoe.md", "Tasha_s_Cauldron_of_Everything.md", "Tasha's Cauldron of Everything.md"],
    precedence: 50,
    title: "Tasha's Cauldron of Everything",
  },
  {
    abbreviation: "MPMM",
    code: "MPMM",
    filenames: [
      "mpmm.md",
      "Mordenkainen_Presents__Monsters_of_the_Multiverse.md",
      "Mordenkainen Presents - Monsters of the Multiverse.md",
    ],
    precedence: 60,
    title: "Mordenkainen Presents: Monsters of the Multiverse",
  },
];

const defaultCampaign: PrivateRulesCampaign = {
  id: Bun.env.PRIVATE_RULES_CAMPAIGN_ID ?? "campaign_rovnost_shadows",
  name: Bun.env.PRIVATE_RULES_CAMPAIGN_NAME ?? "Rovnost Shadows",
  slug: Bun.env.PRIVATE_RULES_CAMPAIGN_SLUG ?? "rovnost-shadows",
};

const defaultExcludedTypes = () =>
  (Bun.env.PRIVATE_RULES_OCR_EXCLUDE_TYPES ?? "spell,monster")
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

export async function exportPrivateRulesFromOcr(options: PrivateRulesOcrOptions = {}): Promise<PrivateRulesOcrResult> {
  const inputDir = options.inputDir ?? Bun.env.PRIVATE_RULES_OCR_INPUT_DIR ?? "/data/private-rules/ocr-markdown";
  const excludedTypes = new Set(options.excludeTypes ?? defaultExcludedTypes());
  const campaign = options.campaign ?? defaultCampaign;
  const documents: PrivateRulesOcrResult["documents"] = [];
  const skippedBooks: OcrBookConfig[] = [];

  for (const book of defaultOcrBooks) {
    const inputPath = await findBookInput(inputDir, book);
    if (!inputPath) {
      skippedBooks.push(book);
      continue;
    }

    const markdown = await readFile(inputPath, "utf8");
    const entries = parseOcrMarkdown(markdown, book.code);
    const document = createPrivateRulesDocument(entries, book, campaign, excludedTypes);
    if (document.entities.length === 0) {
      skippedBooks.push(book);
      continue;
    }
    documents.push({ book, document, inputPath });
  }

  return {
    combined: combinePrivateRulesDocuments(documents.map((item) => item.document), campaign, excludedTypes),
    documents,
    skippedBooks,
  };
}

export async function writePrivateRulesOcrExport(
  result: PrivateRulesOcrResult,
  options: Pick<PrivateRulesOcrOptions, "outputDir"> = {},
) {
  const outputDir = options.outputDir ?? Bun.env.PRIVATE_RULES_OCR_OUTPUT_DIR ?? "/data/private-rules";
  await mkdir(outputDir, { recursive: true });

  for (const { book, document } of result.documents) {
    await writePrivateRulesDocument(join(outputDir, `${book.code.toLowerCase()}.yml`), document);
    await writeFile(join(outputDir, `${book.code.toLowerCase()}.json`), `${JSON.stringify(document, null, 2)}\n`);
  }
  await writeFile(join(outputDir, "combined.json"), `${JSON.stringify(result.combined, null, 2)}\n`);

  return outputDir;
}

export function parseOcrMarkdown(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const normalised = normaliseOcrMarkdown(markdown);
  return [
    ...parseSpells(normalised, sourceCode),
    ...parseMonsters(normalised, sourceCode),
    ...parseMagicItems(normalised, sourceCode),
    ...parseClasses(normalised, sourceCode),
    ...parseSubclasses(normalised, sourceCode),
    ...parseSpecies(normalised, sourceCode),
    ...parseFeats(normalised, sourceCode),
    ...parseBackgrounds(normalised, sourceCode),
    ...parseEquipment(normalised, sourceCode),
    ...parseReferenceTables(normalised, sourceCode),
  ];
}

export function createPrivateRulesDocument(
  entries: ParsedOcrEntry[],
  book: OcrBookConfig,
  campaign: PrivateRulesCampaign = defaultCampaign,
  excludedTypes: Set<string> = new Set(defaultExcludedTypes()),
): PrivateRulesDocument {
  const entitiesByNaturalKey = new Map<string, PrivateRulesEntity>();
  for (const entity of entries
    .filter((entry) => !excludedTypes.has(entry.type))
    .map((entry) => toPrivateRulesEntity(entry, book))) {
    const naturalKey = `${entity.type}:${entity.slug}`;
    if (!entitiesByNaturalKey.has(naturalKey)) entitiesByNaturalKey.set(naturalKey, entity);
  }

  return {
    campaign,
    entities: [...entitiesByNaturalKey.values()],
    importNotes: importNotes(excludedTypes),
    schemaVersion: 1,
    sources: [privateRulesSource(book)],
  };
}

export function combinePrivateRulesDocuments(
  documents: PrivateRulesDocument[],
  campaign: PrivateRulesCampaign = defaultCampaign,
  excludedTypes: Set<string> = new Set(defaultExcludedTypes()),
): PrivateRulesDocument {
  const sourcesByCode = new Map<string, PrivateRulesSource>();
  const entities = [];
  for (const document of documents) {
    for (const source of document.sources) sourcesByCode.set(source.code, source);
    entities.push(...document.entities);
  }

  return {
    campaign,
    entities,
    importNotes: importNotes(excludedTypes),
    schemaVersion: 1,
    sources: [...sourcesByCode.values()].sort((left, right) => left.precedence - right.precedence),
  };
}

async function main() {
  const args = parseArgs(Bun.argv.slice(2));
  const result = await exportPrivateRulesFromOcr({
    excludeTypes: args.excludeTypes,
    inputDir: args.inputDir,
    outputDir: args.outputDir,
  });
  const outputDir = await writePrivateRulesOcrExport(result, { outputDir: args.outputDir });

  console.log(`Wrote Campaign Ledger private-rules OCR export to ${outputDir}`);
  console.log(`Books exported: ${result.documents.length}`);
  console.log(`Combined entities: ${result.combined.entities.length}`);
  console.log(`Excluded entity types: ${args.excludeTypes.join(", ") || "none"}`);
  for (const { book, document, inputPath } of result.documents) {
    console.log(`${book.code}: ${document.entities.length} entities from ${inputPath}`);
  }
  if (result.skippedBooks.length > 0) {
    console.log(`Skipped books: ${result.skippedBooks.map((book) => book.code).join(", ")}`);
  }
}

function parseArgs(args: string[]) {
  const inputDir = readFlag(args, "--input-dir") ?? readFlag(args, "-i");
  const outputDir = readFlag(args, "--output-dir") ?? readFlag(args, "-o");
  const excludeTypes = (
    readFlag(args, "--exclude-types") ??
    Bun.env.PRIVATE_RULES_OCR_EXCLUDE_TYPES ??
    "spell,monster"
  )
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

  return { excludeTypes, inputDir, outputDir };
}

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("-")) throw new Error(`${flag} requires a value.`);

  return value;
}

async function findBookInput(inputDir: string, book: OcrBookConfig) {
  for (const filename of book.filenames) {
    const candidate = join(inputDir, filename);
    if (await pathExists(candidate)) return candidate;
  }

  const entries = await safeReaddir(inputDir);
  const normalisedCode = book.code.toLowerCase();
  const fallback = entries.find((entry) =>
    entry.toLowerCase().endsWith(".md") && basename(entry, ".md").toLowerCase() === normalisedCode,
  );

  return fallback ? join(inputDir, fallback) : null;
}

async function safeReaddir(path: string) {
  try {
    return await readdir(path);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function pathExists(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function writePrivateRulesDocument(path: string, document: PrivateRulesDocument) {
  await writeFile(path, stringifyYaml(document, { lineWidth: 100 }));
}

function toPrivateRulesEntity(entry: ParsedOcrEntry, book: OcrBookConfig): PrivateRulesEntity {
  const source: PrivateRulesEntity["source"] = { sourceCode: book.code };
  if (entry.page && entry.page > 0) {
    source.page = entry.page;
  } else {
    source.note = "Page not captured by OCR parser; verify against the owned source before table use.";
  }
  const summary = entry.bodyMarkdown
    ? cleanMarkdown(entry.bodyMarkdown).slice(0, 240)
    : `OCR-derived ${entry.type} entry for ${entry.name}; verify against the owned source before table use.`;

  return {
    bodyMarkdown: entry.bodyMarkdown,
    id: privateRuleId(book.code, entry.type, entry.slug),
    mechanics: Object.entries(entry.mechanics).map(([kind, data]) => ({
      data,
      display: entry.name,
      kind,
    })),
    metadata: {
      originalId: entry.id,
      parser: "scripts/private-rules-ocr.ts",
      parserSourceType: entry.type,
      verificationStatus: entry.bodyMarkdown ? "ocr_review_required" : "ocr_stub_review_required",
    },
    name: entry.name,
    slug: entry.slug,
    source,
    summary,
    tags: [book.code.toLowerCase(), entry.type, "ocr-import"],
    type: entry.type,
  };
}

function privateRulesSource(book: OcrBookConfig): PrivateRulesSource {
  return {
    abbreviation: book.abbreviation,
    category: "official_2014",
    code: book.code,
    precedence: book.precedence,
    title: book.title,
    visibility: "campaign",
  };
}

function importNotes(excludedTypes: Set<string>) {
  return [
    "Generated by scripts/private-rules-ocr.ts for Campaign Ledger private rules import.",
    `Excluded entity types: ${[...excludedTypes].join(", ") || "none"}.`,
    "Review OCR-derived summaries, body text, page references, and mechanics before production import.",
  ].join(" ");
}

function parseSpells(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const lines = ocrLines(markdown);
  const blocks = splitBlocks(lines, (index) => {
    const name = cleanMarkdown(lines[index] ?? "");
    const subtitle = nonEmptyLineAfter(lines, index);

    return isValidName(name) && Boolean(parseSpellSubtitleText(subtitle));
  });

  return blocks.map(({ lines: blockLines, start }) => {
    const name = cleanMarkdown(blockLines[0] ?? "");
    const spell = parseSpellSubtitleText(nonEmptyLineAfter(blockLines, 0))!;
    const metadata = parseBulletMetadata(blockLines);
    const duration = metadata.Duration ?? "Instantaneous";
    const components = metadata.Components ? metadata.Components.split(",").map((item) => item.trim()).filter(Boolean) : [];
    const classes = uniqueStrings(
      blockLines
        .filter((line) => line.startsWith("Classes:"))
        .flatMap((line) => line.replace(/^Classes:\s*/, "").split(",").map((item) => item.trim())),
    );
    const bodyMarkdown = blockLines
      .filter((line, index) =>
        index > 1 &&
        !isBlank(line) &&
        !isBulletLine(line) &&
        !line.startsWith("Classes:"),
      )
      .join("\n\n");

    return {
      bodyMarkdown,
      id: `${sourceCode.toLowerCase()}-spell-${slugify(name)}`,
      mechanics: {
        spell: {
          castingTime: metadata["Casting Time"] ?? "Action",
          classes,
          components,
          concentration: /^concentration\b/i.test(duration),
          duration,
          level: spell.level,
          range: metadata.Range ?? "Self",
          ritual: /\britual\b/i.test(blockLines.join(" ")),
          school: spell.school,
        },
      },
      name,
      page: start,
      slug: slugify(name),
      type: "spell",
    };
  });
}

function parseMonsters(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const lines = ocrLines(markdown);
  const blocks = splitBlocks(lines, (index) => {
    const name = cleanMarkdown(lines[index] ?? "");
    const subtitle = nonEmptyLineAfter(lines, index);

    return isValidName(name) && isMonsterSubtitle(subtitle);
  });

  return blocks.map(({ lines: blockLines, start }) => {
    const name = cleanMarkdown(blockLines[0] ?? "");
    const subtitle = nonEmptyLineAfter(blockLines, 0);
    const metadata = parseBulletMetadata(blockLines);
    const abilityScores = parseMonsterAbilities(blockLines);
    const sections = parseNamedTextSections(blockLines);
    const challenge = parseChallenge(metadata.Challenge ?? "");
    const armourClass = parseFirstInteger(metadata["Armor Class"] ?? metadata["Armour Class"] ?? "");
    const hitPoints = parseHitPoints(metadata["Hit Points"] ?? "");
    const speed = metadata.Speed ?? "";
    const senses = metadata.Senses ?? "";
    const languages = splitList(metadata.Languages ?? "");
    const [size, typeAndAlignment] = subtitle.split(/\s+/, 2);
    const typeAlignment = subtitle.replace(new RegExp(`^${size}\\s+`, "i"), "");
    const typeParts = typeAlignment.split(",").map((item) => item.trim());
    const type = typeParts[0] ?? "Creature";
    const alignment = typeParts.slice(1).join(", ") || "Unaligned";

    return {
      bodyMarkdown: blockLines.join("\n"),
      id: `${sourceCode.toLowerCase()}-monster-${slugify(name)}`,
      mechanics: {
        stat_block: {
          abilities: abilityScores,
          actions: sections.Actions,
          alignment,
          armourClass: { raw: metadata["Armor Class"] ?? metadata["Armour Class"] ?? "", value: armourClass },
          challenge,
          hitPoints,
          languages,
          legendaryActions: sections["Legendary Actions"],
          reactions: sections.Reactions,
          senses: { passivePerception: parsePassivePerception(senses), raw: senses },
          size,
          speed: { raw: speed },
          traits: sections.Traits,
          type,
        },
      },
      name,
      page: start,
      slug: slugify(name),
      type: "monster",
    };
  });
}

function parseMagicItems(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const lines = ocrLines(markdown);
  const blocks = splitBlocks(lines, (index) => {
    const name = cleanMarkdown(lines[index] ?? "");
    const metadata = nonEmptyLineAfter(lines, index);

    return isValidName(name) && !name.includes("\t") && isMagicItemMetadata(metadata);
  });

  return blocks.map(({ lines: blockLines, start }) => {
    const name = cleanMarkdown(blockLines[0] ?? "");
    const metadata = nonEmptyLineAfter(blockLines, 0);
    const rarity = metadata.match(/\b(Artifact|Legendary|Very Rare|Rare|Uncommon|Common)\b/i)?.[1] ?? "";

    return {
      bodyMarkdown: blockLines.join("\n"),
      id: `${sourceCode.toLowerCase()}-magic-item-${slugify(name)}`,
      mechanics: {
        equipment: {
          category: "magic_item",
          itemType: metadata.split(",")[0]?.trim() ?? "Magic Item",
          rarity,
          requiresAttunement: /\brequires attunement\b/i.test(metadata),
        },
      },
      name,
      page: start,
      slug: slugify(name),
      type: "magic_item",
    };
  });
}

function parseClasses(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const classNames = new Set([
    "Artificer",
    "Barbarian",
    "Bard",
    "Cleric",
    "Druid",
    "Fighter",
    "Monk",
    "Paladin",
    "Ranger",
    "Rogue",
    "Sorcerer",
    "Warlock",
    "Wizard",
  ]);

  const lines = ocrLines(markdown);

  return lines.flatMap((line, index) => {
    const name = cleanMarkdown(line.match(/^#{1,3}\s+(.+)$/)?.[1] ?? line);
    if (!classNames.has(name)) return [];
    const body = lines.slice(index, nextLikelyTopLevelIndex(lines, index + 1)).join("\n");

    return [{
      bodyMarkdown: body,
      id: `${sourceCode.toLowerCase()}-class-${slugify(name)}`,
      mechanics: {
        class: {
          armourProficiencies: [],
          hitDie: classHitDie(name),
          levels: [],
          primaryAbilities: ["strength"],
          savingThrows: [],
          skillChoices: { choose: 2, options: [] },
          toolProficiencies: [],
          weaponProficiencies: [],
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "class",
    }];
  });
}

function parseSubclasses(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const keywords = ["archetype", "path", "circle", "college", "domain", "oath", "patron", "school", "tradition", "way", "conclave"];

  return markdown.split("\n").flatMap((line, index) => {
    const name = cleanMarkdown(line.match(/^###\s+(.+)$/)?.[1] ?? "");
    if (!keywords.some((keyword) => name.toLowerCase().includes(keyword))) return [];

    return [{
      bodyMarkdown: "",
      id: `${sourceCode.toLowerCase()}-subclass-${slugify(name)}`,
      mechanics: {
        subclass: {
          featuresByLevel: [],
          parentClass: "unknown",
          subclassLevel: 3,
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "subclass",
    }];
  });
}

function parseSpecies(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const names = [
    "Aarakocra",
    "Aasimar",
    "Bugbear",
    "Dragonborn",
    "Dwarf",
    "Elf",
    "Firbolg",
    "Gnome",
    "Goblin",
    "Goliath",
    "Half-Elf",
    "Half-Orc",
    "Halfling",
    "Hobgoblin",
    "Human",
    "Kenku",
    "Kobold",
    "Lizardfolk",
    "Orc",
    "Tabaxi",
    "Tiefling",
    "Triton",
    "Yuan-ti",
  ];

  const lines = ocrLines(markdown);
  const blocks = splitBlocks(lines, (index) => {
    const name = cleanMarkdown(lines[index] ?? "");
    const bodyPreview = lines.slice(index + 1, index + 8).join("\n");

    return names.some((speciesName) => name === speciesName || name.startsWith(`${speciesName} `)) &&
      /Ability Scores:|Creature Type:|Speed:/i.test(bodyPreview);
  });

  return blocks.map(({ lines: blockLines, start }) => {
    const name = cleanMarkdown(blockLines[0] ?? "");
    const metadata = parseBulletMetadata(blockLines);

    return {
      bodyMarkdown: blockLines.join("\n"),
      id: `${sourceCode.toLowerCase()}-species-${slugify(name)}`,
      mechanics: {
        species: {
          abilityScore: metadata["Ability Scores"] ?? "",
          creatureType: metadata["Creature Type"] ?? "Humanoid",
          languages: parseInlineLanguages(blockLines),
          size: splitList(metadata.Size ?? "Medium"),
          speed: metadata.Speed ?? "",
          traits: parseNamedParagraphs(blockLines),
        },
      },
      name,
      page: start,
      slug: slugify(name),
      type: "species",
    };
  });
}

function parseFeats(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const lines = ocrLines(markdown);
  const blocks = splitBlocks(lines, (index) => {
    const name = cleanMarkdown(lines[index]?.match(/^#{1,3}\s+(.+)$/)?.[1] ?? lines[index] ?? "");
    const next = nonEmptyLineAfter(lines, index);
    const nextLines = lines.slice(index + 1).filter((line) => !isBlank(line)).slice(0, 5);
    const preview = nextLines.join("\n");
    if (
      !isLikelyTitleLine(name) ||
      /^feats?$/i.test(name) ||
      /^(Fast|Normal|Slow)$/i.test(name) ||
      /^(Actions|Reactions|Legendary Actions)$/i.test(name) ||
      parseSpellSubtitleText(next) ||
      isMagicItemMetadata(next) ||
      isMonsterSubtitle(next) ||
      /^[•*-]\s*(Ability Scores|Skill Proficiencies|Casting Time|Armor Class|Armour Class|Hit Points|Speed|Challenge)(:|\s)/i.test(next) ||
      (nextLines[0] !== undefined && isLikelyTitleLine(nextLines[0]))
    ) {
      return false;
    }

    return /Prerequisite:|benefits:|^\s*(?:[•*]\s+|-\s+)/im.test(preview);
  });

  return blocks.map(({ lines: blockLines, start }) => {
    const name = cleanMarkdown(blockLines[0]?.match(/^#{1,3}\s+(.+)$/)?.[1] ?? blockLines[0] ?? "");
    const prerequisite = blockLines.find((line) => line.startsWith("Prerequisite:"))?.replace(/^Prerequisite:\s*/, "") ?? "";
    const type = classifyReferenceType(blockLines.find((line) => line.startsWith("Type:"))?.replace(/^Type:\s*/, "") ?? "");

    return {
      bodyMarkdown: blockLines.join("\n"),
      id: `${sourceCode.toLowerCase()}-${type}-${slugify(name)}`,
      mechanics: { [type]: { prerequisite, repeatable: false } },
      name,
      page: start,
      slug: slugify(name),
      type,
    };
  });
}

function parseBackgrounds(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const backgroundNames = new Set([
    "Acolyte",
    "Charlatan",
    "Criminal",
    "Entertainer",
    "Folk Hero",
    "Guild Artisan",
    "Hermit",
    "Noble",
    "Outlander",
    "Sage",
    "Sailor",
    "Soldier",
    "Urchin",
  ]);

  const lines = ocrLines(markdown);
  const blocks = splitBlocks(lines, (index) => {
    const name = cleanMarkdown(lines[index] ?? "");
    const bodyPreview = lines.slice(index + 1, index + 8).join("\n");

    return backgroundNames.has(name) && /Skill Proficiencies:|Equipment:|Feature:/i.test(bodyPreview);
  });

  return blocks.map(({ lines: blockLines, start }) => {
    const name = cleanMarkdown(blockLines[0] ?? "");
    const metadata = parseBulletMetadata(blockLines);
    const feature = blockLines.find((line) => line.startsWith("Feature:"))?.replace(/^Feature:\s*/, "").trim() ?? slugify(`${name}-feature`);

    return {
      bodyMarkdown: blockLines.join("\n"),
      id: `${sourceCode.toLowerCase()}-background-${slugify(name)}`,
      mechanics: {
        background: {
          equipment: splitList(metadata.Equipment ?? ""),
          feature,
          languages: metadata.Languages ?? metadata["Languages and Tool Proficiencies"] ?? "",
          skillProficiencies: splitList(metadata["Skill Proficiencies"] ?? ""),
          toolProficiencies: splitList(metadata["Tool Proficiencies"] ?? ""),
        },
      },
      name,
      page: start,
      slug: slugify(name),
      type: "background",
    };
  });
}

function parseEquipment(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const lines = ocrLines(markdown);

  return lines.flatMap((line, index) => {
    if (line.includes("|")) {
      if (line.toLowerCase().includes("name") || line.includes("---")) return [];
      const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
      const name = cleanMarkdown(cells[0] ?? "");
      if (cells.length < 2 || !isValidName(name)) return [];

      return [{
        bodyMarkdown: line,
        id: `${sourceCode.toLowerCase()}-equipment-${slugify(name)}`,
        mechanics: {
          equipment: {
            category: inferEquipmentCategory(name, line),
            row: cells,
          },
        },
        name,
        page: index,
        slug: slugify(name),
        type: "equipment",
      }];
    }

    const next = nonEmptyLineAfter(lines, index);
    const following = lines.slice(index + 1, index + 6).join(" ");
    const name = cleanMarkdown(line);
    if (!isValidName(name) || !/^(Weight|Damage|Properties|Category):/i.test(following)) return [];

    return [{
      bodyMarkdown: lines.slice(index, nextLikelyTopLevelIndex(lines, index + 1)).join("\n"),
      id: `${sourceCode.toLowerCase()}-equipment-${slugify(name)}`,
      mechanics: {
        equipment: {
          category: inferEquipmentCategory(name, next),
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "equipment",
    }];
  });
}

function parseReferenceTables(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const lines = ocrLines(markdown);
  const entries: ParsedOcrEntry[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const name = cleanMarkdown(lines[index] ?? "");
    const firstColumn = nonEmptyLineAfter(lines, index);
    const secondColumn = nonEmptyLineAfter(lines, index + 1);
    if (!isValidName(name) || !isTableDieColumn(firstColumn) || !secondColumn) continue;
    const end = nextLikelyTopLevelIndex(lines, index + 1);
    const bodyMarkdown = toMarkdownTable(lines.slice(index + 1, end));
    entries.push({
      bodyMarkdown,
      id: `${sourceCode.toLowerCase()}-rule-${slugify(name)}`,
      mechanics: {
        table: {
          columns: [firstColumn, secondColumn],
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "rule",
    });
    index = end - 1;
  }

  return entries;
}

function normaliseOcrMarkdown(markdown: string) {
  return markdown
    .replace(/\r\n?/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/^\t+[•*-]\t?/gm, "• ")
    .replace(/^\s+[•*-]\s+/gm, "• ");
}

function ocrLines(markdown: string) {
  return normaliseOcrMarkdown(markdown).split("\n").map((line) => line.trimEnd());
}

function isBlank(line: string | undefined) {
  return !line || line.trim() === "";
}

function nonEmptyLineAfter(lines: string[], index: number) {
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    if (!isBlank(lines[cursor])) return cleanMarkdown(lines[cursor]!.trim());
  }

  return "";
}

function splitBlocks(lines: string[], isStart: (index: number) => boolean) {
  const starts = lines.map((_, index) => index).filter(isStart);

  return starts.map((start, index) => ({
    lines: lines.slice(start, Math.min(starts[index + 1] ?? lines.length, nextLikelyTopLevelIndex(lines, start + 1))).filter((line) => !isBlank(line)),
    start,
  }));
}

function parseSpellSubtitleText(subtitle: string) {
  if (subtitle.includes(":")) return null;
  const levelMatch = subtitle.match(/^Level\s+(\d+)\s+(.+)$/i);
  if (levelMatch) return { level: Number(levelMatch[1]), school: cleanMarkdown(levelMatch[2] ?? "") };
  const cantripMatch = subtitle.match(/^(.+?)\s+Cantrip$/i) ?? subtitle.match(/^Cantrip\s+(.+)$/i);
  if (cantripMatch) return { level: 0, school: cleanMarkdown(cantripMatch[1] ?? cantripMatch[2] ?? "") };

  return null;
}

function parseBulletMetadata(lines: string[]) {
  const metadata: Record<string, string> = {};
  for (const line of lines) {
    const colonMatch = line.match(/^[•*-]\s*([^:]+):\s*(.+)$/);
    if (colonMatch?.[1] && colonMatch[2]) {
      metadata[cleanMarkdown(colonMatch[1])] = cleanMarkdown(colonMatch[2]);
      continue;
    }
    const labelMatch = line.match(/^[•*-]\s*(Armor Class|Armour Class|Hit Points|Speed|Initiative|Saving Throws|Skills|Gear|Senses|Languages|Challenge|Proficiency Bonus|Immunities|Resistances|Vulnerabilities)\s+(.+)$/i);
    if (labelMatch?.[1] && labelMatch[2]) metadata[toTitleCase(labelMatch[1])] = cleanMarkdown(labelMatch[2]);
  }

  return metadata;
}

function isBulletLine(line: string) {
  return /^[•*-]\s+/.test(line);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isMonsterSubtitle(value: string) {
  return /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b.+,\s*.+/i.test(value);
}

function isLikelyTitleLine(value: string) {
  const text = cleanMarkdown(value.match(/^#{1,4}\s+(.+)$/)?.[1] ?? value);

  return isValidName(text) &&
    !text.includes(":") &&
    !text.includes("\t") &&
    !/[.!?]$/.test(text) &&
    !/^Suggested Characteristics$/i.test(text) &&
    !/^[A-Z]{2,5}$/.test(text) &&
    text.split(/\s+/).length <= 8;
}

function isMagicItemMetadata(value: string) {
  return /\b(Common|Uncommon|Rare|Very Rare|Legendary|Artifact)\b/i.test(value) &&
    /\b(Wondrous Item|Weapon|Armor|Armour|Potion|Ring|Rod|Staff|Wand|Ammunition|Scroll|Item)\b/i.test(value);
}

function parseMonsterAbilities(lines: string[]) {
  const abilities = {
    charisma: 10,
    constitution: 10,
    dexterity: 10,
    intelligence: 10,
    strength: 10,
    wisdom: 10,
  };
  const labelsIndex = lines.findIndex((line, index) =>
    line.trim() === "STR" &&
    lines[index + 1]?.trim() === "DEX" &&
    lines[index + 2]?.trim() === "CON",
  );
  if (labelsIndex === -1) return abilities;
  const scores = lines.slice(labelsIndex + 6, labelsIndex + 12).map((line) => Number(line.match(/-?\d+/)?.[0] ?? Number.NaN));
  if (scores.length === 6 && scores.every((score) => Number.isFinite(score))) {
    abilities.strength = scores[0]!;
    abilities.dexterity = scores[1]!;
    abilities.constitution = scores[2]!;
    abilities.intelligence = scores[3]!;
    abilities.wisdom = scores[4]!;
    abilities.charisma = scores[5]!;
  }

  return abilities;
}

function parseNamedTextSections(lines: string[]) {
  const sections: Record<string, Array<{ name: string; text: string }>> = {
    Actions: [],
    "Legendary Actions": [],
    Reactions: [],
    Traits: [],
  };
  let active: keyof typeof sections = "Traits";
  for (const line of lines) {
    if (line === "Actions" || line === "Reactions" || line === "Legendary Actions") {
      active = line;
      continue;
    }
    const match = line.match(/^([^.!?]{2,80})\.\s+(.+)$/);
    if (match?.[1] && match[2] && !isBulletLine(line)) {
      sections[active]!.push({ name: cleanMarkdown(match[1]), text: cleanMarkdown(match[2]) });
    }
  }

  return sections;
}

function parseNamedParagraphs(lines: string[]) {
  return lines.flatMap((line) => {
    const match = line.match(/^([^.!?]{2,80})\.\s+(.+)$/);
    return match?.[1] && match[2] ? [{ name: cleanMarkdown(match[1]), text: cleanMarkdown(match[2]) }] : [];
  });
}

function parseFirstInteger(value: string) {
  const parsed = Number(value.match(/\d+/)?.[0] ?? Number.NaN);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseHitPoints(value: string) {
  const match = value.match(/(\d+)(?:\s*\((.+?)\))?/);

  return {
    average: match?.[1] ? Number(match[1]) : null,
    formula: match?.[2] ?? "",
    raw: value,
  };
}

function parseChallenge(value: string) {
  const rating = value.match(/^([^\s(]+)/)?.[1] ?? "0";
  const xp = Number(value.match(/XP\s+([\d,]+)/i)?.[1]?.replaceAll(",", "") ?? 0);
  const proficiencyBonus = Number(value.match(/PB\s*\+?(\d+)/i)?.[1] ?? 0);

  return { proficiencyBonus, rating, xp };
}

function parsePassivePerception(value: string) {
  return Number(value.match(/Passive Perception\s+(\d+)/i)?.[1] ?? 10);
}

function splitList(value: string) {
  return value.split(/,|;|\bor\b/i).map((item) => cleanMarkdown(item.trim())).filter(Boolean);
}

function parseInlineLanguages(lines: string[]) {
  const languageLine = lines.find((line) => /^Languages\./.test(line));
  if (!languageLine) return {};

  return { text: cleanMarkdown(languageLine.replace(/^Languages\.\s*/, "")) };
}

function nextLikelyTopLevelIndex(lines: string[], start: number) {
  for (let index = start; index < lines.length; index += 1) {
    const line = cleanMarkdown(lines[index] ?? "");
    const next = nonEmptyLineAfter(lines, index);
    if (parseSpellSubtitleText(line)) continue;
    if (isLikelyTitleLine(line) && (
      parseSpellSubtitleText(next) ||
      isMonsterSubtitle(next) ||
      isMagicItemMetadata(next) ||
      /^[•*-]\s*(Ability Scores|Skill Proficiencies|Casting Time):/i.test(next) ||
      /^Prerequisite:/.test(next)
    )) {
      return index;
    }
  }

  return lines.length;
}

function inferEquipmentCategory(name: string, context: string) {
  const text = `${name} ${context}`.toLowerCase();
  if (text.includes("armor") || text.includes("armour") || text.includes("shield")) return "armour";
  if (text.includes("weapon") || /\b(damage|melee|ranged|ammunition)\b/.test(text)) return "weapon";
  if (text.includes("tool")) return "tool";

  return "gear";
}

function isTableDieColumn(value: string) {
  return /^d\d+|^d%|^d100|^\d+d\d+/i.test(value);
}

function toMarkdownTable(lines: string[]) {
  const cleaned = lines.map(cleanMarkdown).filter(Boolean);
  if (cleaned.length < 2) return cleaned.join("\n");
  const [leftHeader, rightHeader, ...cells] = cleaned;
  const rows = [];
  for (let index = 0; index < cells.length; index += 2) {
    rows.push(`| ${cells[index] ?? ""} | ${cells[index + 1] ?? ""} |`);
  }

  return [`| ${leftHeader} | ${rightHeader} |`, "| --- | --- |", ...rows].join("\n");
}

function classifyReferenceType(typeText: string) {
  const value = typeText.toLowerCase();
  if (value.includes("invocation")) return "invocation";
  if (value.includes("infusion")) return "infusion";
  if (value.includes("fighting style")) return "fighting_style";
  if (value.includes("manoeuvre") || value.includes("maneuver")) return "manoeuvre";
  if (value.includes("metamagic")) return "metamagic";
  if (value.includes("arcane shot")) return "class_feature";

  return "feat";
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function classHitDie(name: string) {
  const hitDice: Record<string, string> = {
    Artificer: "d8",
    Barbarian: "d12",
    Bard: "d8",
    Cleric: "d8",
    Druid: "d8",
    Fighter: "d10",
    Monk: "d8",
    Paladin: "d10",
    Ranger: "d10",
    Rogue: "d8",
    Sorcerer: "d6",
    Warlock: "d8",
    Wizard: "d6",
  };

  return hitDice[name] ?? "d8";
}

function privateRuleId(sourceCode: string, type: string, slug: string) {
  return `private_${slugify(sourceCode).replaceAll("-", "_")}_${slugify(type).replaceAll("-", "_")}_${slugify(slug).replaceAll("-", "_")}`;
}

function cleanMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)]\(.+?\)/g, "$1")
    .trim();
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function isValidName(name: string) {
  return name.length > 0 && name.length < 50 && /^[A-Z]/.test(name);
}

if (import.meta.main) {
  await main();
}
