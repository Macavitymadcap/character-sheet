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
  await writePrivateRulesDocument(join(outputDir, "combined.yml"), result.combined);
  await writeFile(join(outputDir, "combined.json"), `${JSON.stringify(result.combined, null, 2)}\n`);

  return outputDir;
}

export function parseOcrMarkdown(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  return [
    ...parseSpells(markdown, sourceCode),
    ...parseMonsters(markdown, sourceCode),
    ...parseClasses(markdown, sourceCode),
    ...parseSubclasses(markdown, sourceCode),
    ...parseSpecies(markdown, sourceCode),
    ...parseFeats(markdown, sourceCode),
    ...parseBackgrounds(markdown, sourceCode),
    ...parseEquipment(markdown, sourceCode),
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
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^[\s]*[-*]\s+\*(.+?)\*/);
    if (!match?.[1] || !isValidName(match[1])) return [];
    const name = match[1].trim();

    return [{
      bodyMarkdown: "",
      id: `${sourceCode.toLowerCase()}-spell-${slugify(name)}`,
      mechanics: {
        spell: {
          classes: [],
          components: { material: false, somatic: false, verbal: false },
          concentration: false,
          duration: "Instantaneous",
          level: 0,
          range: "Self",
          ritual: false,
          school: "evocation",
        },
      },
      name,
      page: null,
      slug: slugify(name),
      type: "spell",
    }];
  });
}

function parseMonsters(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^[\s]*[-*]\s+\*\*(.+?)\*\*/);
    if (!match?.[1] || !isValidName(match[1])) return [];
    const name = match[1].trim();

    return [{
      bodyMarkdown: "",
      id: `${sourceCode.toLowerCase()}-monster-${slugify(name)}`,
      mechanics: {
        monster: {
          abilities: {
            charisma: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            strength: 10,
            wisdom: 10,
          },
          actions: [],
          alignment: "unaligned",
          armourClass: { value: 10 },
          challenge: { rating: "0", xp: 10 },
          hitPoints: { average: 10, formula: "2d8" },
          languages: [],
          legendaryActions: [],
          reactions: [],
          senses: { passivePerception: 10 },
          size: "medium",
          speed: { walking: 30 },
          traits: [],
          type: "humanoid",
        },
      },
      name,
      page: null,
      slug: slugify(name),
      type: "monster",
    }];
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

  return markdown.split("\n").flatMap((line, index) => {
    const name = cleanMarkdown(line.match(/^##\s+(.+)$/)?.[1] ?? "");
    if (!classNames.has(name)) return [];

    return [{
      bodyMarkdown: "",
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

  return markdown.split("\n").flatMap((line, index) => {
    const name = cleanMarkdown(line.match(/^##\s+(.+)$/)?.[1] ?? "");
    if (!names.some((speciesName) => name.includes(speciesName))) return [];

    return [{
      bodyMarkdown: "",
      id: `${sourceCode.toLowerCase()}-species-${slugify(name)}`,
      mechanics: {
        species: {
          abilityScore: { mode: "flexible" },
          creatureType: "humanoid",
          languages: { fixed: ["Common"] },
          size: ["medium"],
          speed: { walking: 30 },
          traits: [],
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "species",
    }];
  });
}

function parseFeats(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  const entries: ParsedOcrEntry[] = [];
  let inFeatSection = false;
  for (const [index, line] of markdown.split("\n").entries()) {
    if (line.match(/^#\s+.*feat/i)) {
      inFeatSection = true;
      continue;
    }
    const name = cleanMarkdown(line.match(/^###\s+(.+)$/)?.[1] ?? "");
    if (!inFeatSection || !name || name.length >= 50) continue;
    entries.push({
      bodyMarkdown: "",
      id: `${sourceCode.toLowerCase()}-feat-${slugify(name)}`,
      mechanics: { feat: { repeatable: false } },
      name,
      page: index,
      slug: slugify(name),
      type: "feat",
    });
  }

  return entries;
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

  return markdown.split("\n").flatMap((line, index) => {
    const name = cleanMarkdown(line.match(/^##\s+(.+)$/)?.[1] ?? "");
    if (!backgroundNames.has(name)) return [];

    return [{
      bodyMarkdown: "",
      id: `${sourceCode.toLowerCase()}-background-${slugify(name)}`,
      mechanics: {
        background: {
          equipment: [],
          feature: slugify(`${name}-feature`),
          languages: {},
          skillProficiencies: [],
          toolProficiencies: [],
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "background",
    }];
  });
}

function parseEquipment(markdown: string, sourceCode: string): ParsedOcrEntry[] {
  return markdown.split("\n").flatMap((line, index) => {
    if (!line.includes("|") || line.toLowerCase().includes("name") || line.includes("---")) return [];
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    const name = cleanMarkdown(cells[0] ?? "");
    if (cells.length < 2 || !isValidName(name)) return [];

    return [{
      bodyMarkdown: line,
      id: `${sourceCode.toLowerCase()}-equipment-${slugify(name)}`,
      mechanics: {
        equipment: {
          category: "weapon",
          weapon: {
            range: "melee",
            type: "simple",
          },
        },
      },
      name,
      page: index,
      slug: slugify(name),
      type: "equipment",
    }];
  });
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
