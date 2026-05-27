import type { Database } from "bun:sqlite";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { slugify } from "./importer";

const rovnostCampaignId = "campaign_rovnost_shadows";
const lynottCharacterId = "character_lynott_magulbisson";

export interface RovnostRequiredSource {
  abbreviation: string;
  code: string;
  title: string;
}

export interface LynottRequiredRule {
  entityType: string;
  name: string;
  selectionType: string;
  slug: string;
  sourceCode: string;
}

export interface RovnostSourceCoverage {
  abbreviation: string;
  code: string;
  importedCount: number;
  presentInSourceFiles: boolean | null;
  sourceSlug: string;
  title: string;
}

export interface LynottRuleCoverage {
  currentSourceSlug: string | null;
  entityType: string;
  linked: boolean;
  name: string;
  privateEntityId: string | null;
  privateSourceSlug: string;
  selectionType: string;
  slug: string;
  sourceCode: string;
  usesPrivateLink: boolean;
}

export interface RovnostCoverageReport {
  campaignId: string;
  characterId: string;
  lynottRules: LynottRuleCoverage[];
  privateRulesVisiblePublicly: number;
  sourceFilesPath: string | null;
  sourceFileReadErrors: string[];
  sources: RovnostSourceCoverage[];
}

export const rovnostRequiredSources: RovnostRequiredSource[] = [
  { abbreviation: "PHB", code: "PHB", title: "Player's Handbook" },
  { abbreviation: "DMG", code: "DMG", title: "Dungeon Master's Guide" },
  { abbreviation: "MM", code: "MM", title: "Monster Manual" },
  { abbreviation: "TCoE", code: "TCOE", title: "Tasha's Cauldron of Everything" },
  { abbreviation: "XGtE", code: "XGTE", title: "Xanathar's Guide to Everything" },
  { abbreviation: "MPMM", code: "MPMM", title: "Mordenkainen Presents: Monsters of the Multiverse" },
];

export const lynottRequiredRules: LynottRequiredRule[] = [
  { entityType: "class_feature", name: "Magical Tinkering", selectionType: "class_feature", slug: "magical-tinkering", sourceCode: "TCOE" },
  { entityType: "class_feature", name: "Spellcasting", selectionType: "class_feature", slug: "spellcasting", sourceCode: "TCOE" },
  { entityType: "class_feature", name: "Infuse Item", selectionType: "class_feature", slug: "infuse-item", sourceCode: "TCOE" },
  { entityType: "class_feature", name: "The Right Tool for the Job", selectionType: "class_feature", slug: "the-right-tool-for-the-job", sourceCode: "TCOE" },
  { entityType: "subclass_feature", name: "Eldritch Cannon", selectionType: "subclass_feature", slug: "eldritch-cannon", sourceCode: "TCOE" },
  { entityType: "species_trait", name: "Fey Gift", selectionType: "species_trait", slug: "fey-gift", sourceCode: "MPMM" },
  { entityType: "species_trait", name: "Fortune from the Many", selectionType: "species_trait", slug: "fortune-from-the-many", sourceCode: "MPMM" },
  { entityType: "infusion", name: "Enhanced Defence", selectionType: "active_infusion", slug: "enhanced-defence", sourceCode: "TCOE" },
  { entityType: "infusion", name: "Repeating Shot", selectionType: "active_infusion", slug: "repeating-shot", sourceCode: "TCOE" },
  { entityType: "spell", name: "Mage Hand", selectionType: "known_cantrip", slug: "mage-hand", sourceCode: "PHB" },
  { entityType: "spell", name: "Mending", selectionType: "known_cantrip", slug: "mending", sourceCode: "PHB" },
  { entityType: "spell", name: "Disguise Self", selectionType: "prepared_spell", slug: "disguise-self", sourceCode: "PHB" },
  { entityType: "spell", name: "Cure Wounds", selectionType: "prepared_spell", slug: "cure-wounds", sourceCode: "PHB" },
  { entityType: "spell", name: "Grease", selectionType: "prepared_spell", slug: "grease", sourceCode: "PHB" },
  { entityType: "spell", name: "Absorb Elements", selectionType: "prepared_spell", slug: "absorb-elements", sourceCode: "XGTE" },
  { entityType: "spell", name: "Shield", selectionType: "artillerist_spell", slug: "shield", sourceCode: "PHB" },
  { entityType: "spell", name: "Thunderwave", selectionType: "artillerist_spell", slug: "thunderwave", sourceCode: "PHB" },
];

export function buildRovnostCoverageReport(
  database: Database,
  options: {
    campaignId?: string;
    characterId?: string;
    sourceFilesPath?: string | null;
  } = {},
): RovnostCoverageReport {
  const campaignId = options.campaignId ?? rovnostCampaignId;
  const characterId = options.characterId ?? lynottCharacterId;
  const sourceFileCodes = options.sourceFilesPath ? readPrivateYamlSourceCodes(options.sourceFilesPath) : null;

  return {
    campaignId,
    characterId,
    lynottRules: lynottRequiredRules.map((rule) => getLynottRuleCoverage(database, rule, campaignId, characterId)),
    privateRulesVisiblePublicly: countPubliclyVisiblePrivateRovnostRules(database, campaignId),
    sourceFileReadErrors: sourceFileCodes?.readErrors ?? [],
    sourceFilesPath: options.sourceFilesPath ?? null,
    sources: rovnostRequiredSources.map((source) => getSourceCoverage(database, source, campaignId, sourceFileCodes?.codes ?? null)),
  };
}

export function relinkLynottPrivateRuleLinks(
  database: Database,
  options: {
    campaignId?: string;
    characterId?: string;
  } = {},
) {
  const campaignId = options.campaignId ?? rovnostCampaignId;
  const characterId = options.characterId ?? lynottCharacterId;
  let updated = 0;

  for (const rule of lynottRequiredRules) {
    const privateEntity = findPrivateEntity(database, rule, campaignId);
    if (!privateEntity) continue;

    const currentLink = database
      .query<{ id: string; rules_entity_id: string }, [string, string]>(
        `select id, rules_entity_id
         from character_rule_links
         where character_id = ? and selection_type = ?
         order by sort_order, id`,
      )
      .all(characterId, rule.selectionType)
      .find((link) => {
        const entity = database
          .query<{ entity_type: string; slug: string }, [string]>(
            "select entity_type, slug from rules_entities where id = ?",
          )
          .get(link.rules_entity_id);

        return entity?.entity_type === rule.entityType && entity.slug === rule.slug;
      });
    if (!currentLink || currentLink.rules_entity_id === privateEntity.id) continue;

    database.run("update character_rule_links set rules_entity_id = ? where id = ?", [
      privateEntity.id,
      currentLink.id,
    ]);
    updated += 1;
  }

  return { updated };
}

export function formatRovnostCoverageReport(report: RovnostCoverageReport) {
  const linked = report.lynottRules.filter((rule) => rule.usesPrivateLink).length;
  const available = report.lynottRules.filter((rule) => rule.privateEntityId).length;
  const sourcesReady = report.sources.filter((source) => source.importedCount > 0).length;
  const lines = [
    "Rovnost private rules coverage",
    `Campaign: ${report.campaignId}`,
    `Character: ${report.characterId}`,
    `Required sources imported: ${sourcesReady}/${report.sources.length}`,
    `Lynott private links: ${linked}/${report.lynottRules.length}`,
    `Lynott private rules available: ${available}/${report.lynottRules.length}`,
    `Private rules visible without campaign access: ${report.privateRulesVisiblePublicly}`,
    `Unreadable source files: ${report.sourceFileReadErrors.length}`,
    "",
    "Sources",
    ...report.sources.map((source) =>
      `- ${source.abbreviation}: ${source.importedCount > 0 ? "imported" : "missing"} (${source.importedCount} rules)${
        source.presentInSourceFiles === null ? "" : source.presentInSourceFiles ? "; source file present" : "; source file missing"
      }`,
    ),
    "",
    "Missing Lynott private links",
    ...missingLines(report.lynottRules.filter((rule) => !rule.usesPrivateLink)),
    "",
    "Missing source files",
    ...missingLines(report.sources.filter((source) => source.presentInSourceFiles === false).map((source) => ({
      name: source.title,
      sourceCode: source.code,
    }))),
    "",
    "Unreadable source files",
    ...fileErrorLines(report.sourceFileReadErrors),
  ];

  return `${lines.join("\n")}\n`;
}

function getSourceCoverage(
  database: Database,
  source: RovnostRequiredSource,
  campaignId: string,
  codesInSourceFiles: Set<string> | null,
): RovnostSourceCoverage {
  const sourceSlug = privateSourceSlug(campaignId, source.title);
  const row = database
    .query<{ count: number }, [string, string]>(
      `select count(entities.id) as count
       from rules_sources sources
       inner join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
       left join rules_entities entities on entities.source_id = sources.id
       where campaign_sources.campaign_id = ? and sources.slug = ?`,
    )
    .get(campaignId, sourceSlug);

  return {
    ...source,
    importedCount: row?.count ?? 0,
    presentInSourceFiles: codesInSourceFiles ? codesInSourceFiles.has(source.code) : null,
    sourceSlug,
  };
}

function getLynottRuleCoverage(
  database: Database,
  rule: LynottRequiredRule,
  campaignId: string,
  characterId: string,
): LynottRuleCoverage {
  const privateEntity = findPrivateEntity(database, rule, campaignId);
  const current = database
    .query<{ rules_entity_id: string; source_slug: string }, [string, string, string, string]>(
      `select links.rules_entity_id, sources.slug as source_slug
       from character_rule_links links
       inner join rules_entities entities on entities.id = links.rules_entity_id
       inner join rules_sources sources on sources.id = entities.source_id
       where links.character_id = ?
         and links.selection_type = ?
         and entities.entity_type = ?
         and entities.slug = ?
       order by links.sort_order, links.id
       limit 1`,
    )
    .get(characterId, rule.selectionType, rule.entityType, rule.slug);

  return {
    ...rule,
    currentSourceSlug: current?.source_slug ?? null,
    linked: Boolean(current),
    privateEntityId: privateEntity?.id ?? null,
    privateSourceSlug: privateSourceSlugForCode(campaignId, rule.sourceCode),
    usesPrivateLink: Boolean(privateEntity && current?.rules_entity_id === privateEntity.id),
  };
}

function findPrivateEntity(database: Database, rule: LynottRequiredRule, campaignId: string) {
  return database
    .query<{ id: string }, [string, string, string, string]>(
      `select entities.id
       from rules_entities entities
       inner join rules_sources sources on sources.id = entities.source_id
       inner join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
       where campaign_sources.campaign_id = ?
         and sources.slug = ?
         and entities.entity_type = ?
         and entities.slug = ?
       order by sources.precedence desc, entities.id
       limit 1`,
    )
    .get(campaignId, privateSourceSlugForCode(campaignId, rule.sourceCode), rule.entityType, rule.slug);
}

function countPubliclyVisiblePrivateRovnostRules(database: Database, campaignId: string) {
  return database
    .query<{ count: number }, [string]>(
      `select count(entities.id) as count
       from rules_entities entities
       inner join rules_sources sources on sources.id = entities.source_id
       where sources.slug like ? and sources.visibility = 'public'`,
    )
    .get(`${slugify(campaignId)}-%`)?.count ?? 0;
}

function readPrivateYamlSourceCodes(path: string) {
  if (!existsSync(path)) return { codes: new Set<string>(), readErrors: [] };
  const files = statSync(path).isDirectory()
    ? readdirSync(path, { recursive: true })
      .map((entry) => join(path, String(entry)))
      .filter((entry) => /\.(ya?ml)$/i.test(entry) && statSync(entry).isFile())
    : [path].filter((entry) => /\.(ya?ml)$/i.test(entry));
  const codes = new Set<string>();
  const readErrors: string[] = [];

  for (const file of files) {
    let parsed: { sources?: Array<{ code?: unknown }> } | null;
    try {
      parsed = parseYaml(readFileSync(file, "utf8")) as { sources?: Array<{ code?: unknown }> } | null;
    } catch {
      readErrors.push(file);
      continue;
    }
    for (const source of parsed?.sources ?? []) {
      if (typeof source.code === "string" && source.code.trim()) codes.add(source.code.trim());
    }
  }

  return { codes, readErrors };
}

function privateSourceSlugForCode(campaignId: string, code: string) {
  const source = rovnostRequiredSources.find((candidate) => candidate.code === code);
  return privateSourceSlug(campaignId, source?.title ?? code);
}

function privateSourceSlug(campaignId: string, title: string) {
  return `${slugify(campaignId)}-${slugify(title)}`;
}

function missingLines(items: Array<{ name: string; sourceCode: string }>) {
  return items.length
    ? items.map((item) => `- ${item.sourceCode}: ${item.name}`)
    : ["- None"];
}

function fileErrorLines(paths: string[]) {
  return paths.length ? paths.map((path) => `- ${path}`) : ["- None"];
}
