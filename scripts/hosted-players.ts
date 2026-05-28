#!/usr/bin/env bun
import { readFile } from "node:fs/promises";
import type { SQLQueryBindings } from "bun:sqlite";
import { parse as parseYaml } from "yaml";
import { createSqliteDatabase, type AbilityName, type CharacterSheetReadModel } from "../src/db";

export interface HostedPlayersOptions {
  backupConfirmed?: boolean;
  backupReference?: string | null;
  campaignId?: string;
  databasePath?: string;
  sourcePath?: string;
}

interface HostedPlayersDocument {
  backupReference?: unknown;
  campaignId?: unknown;
  disableUserEmails?: unknown;
  removeCharacterSlugs?: unknown;
  players?: unknown;
}

interface HostedPlayerRecord {
  character?: unknown;
  displayName?: unknown;
  email?: unknown;
}

interface HostedCharacterRecord {
  abilities?: unknown;
  armourClassSources?: unknown;
  background?: unknown;
  backgroundEntries?: unknown;
  className?: unknown;
  defences?: unknown;
  equipment?: unknown;
  faction?: unknown;
  hitPointCurrent?: unknown;
  hitPointMax?: unknown;
  level?: unknown;
  name?: unknown;
  proficiencies?: unknown;
  resources?: unknown;
  senses?: unknown;
  skills?: unknown;
  slug?: unknown;
  species?: unknown;
  subclassName?: unknown;
}

export interface HostedPlayersResult {
  charactersRemoved: string[];
  charactersUpserted: string[];
  membershipsEnsured: string[];
  usersDisabled: string[];
}

const defaultDatabasePath = () => Bun.env.DB_PATH ?? "character-sheet.sqlite3";
const defaultSourcePath = () => Bun.env.HOSTED_PLAYERS_SOURCE ?? "/data/private-rules/friday-players.yml";
const defaultCampaignId = () => Bun.env.HOSTED_PLAYERS_CAMPAIGN_ID ?? "campaign_rovnost_shadows";

export async function applyHostedPlayers(options: HostedPlayersOptions = {}): Promise<HostedPlayersResult> {
  const sourcePath = options.sourcePath ?? defaultSourcePath();
  const backupReference = options.backupReference ?? Bun.env.HOSTED_PLAYERS_BACKUP_REFERENCE ?? null;
  const backupConfirmed = options.backupConfirmed ?? (Bun.env.HOSTED_PLAYERS_BACKUP_CONFIRMED === "1" || Boolean(backupReference));
  if (sourcePath.startsWith("/data/") && !backupConfirmed) {
    throw new Error(
      "Confirm a hosted backup before applying hosted players: set HOSTED_PLAYERS_BACKUP_CONFIRMED=1 or HOSTED_PLAYERS_BACKUP_REFERENCE=<backup manifest>.",
    );
  }

  const parsed = parseYaml(await readFile(sourcePath, "utf8")) as HostedPlayersDocument;
  const campaignId = stringValue(parsed.campaignId, options.campaignId ?? defaultCampaignId());
  const runtime = createSqliteDatabase({ path: options.databasePath ?? defaultDatabasePath(), seed: false });
  try {
    const result: HostedPlayersResult = {
      charactersRemoved: [],
      charactersUpserted: [],
      membershipsEnsured: [],
      usersDisabled: [],
    };

    for (const email of stringArray(parsed.disableUserEmails)) {
      const user = runtime.repositories.authRepository.findUserByEmail(email);
      if (!user) throw new Error(`Cannot disable missing user ${email}.`);
      runtime.repositories.authRepository.updateUserStatus(user.id, "disabled");
      result.usersDisabled.push(email);
    }

    for (const slug of stringArray(parsed.removeCharacterSlugs)) {
      const deleted = runtime.database
        .query<{ id: string }, [string, string]>(
          "select id from characters where campaign_id = ? and slug = ?",
        )
        .get(campaignId, slug);
      if (!deleted) continue;
      runtime.database.run("delete from characters where id = ?", [deleted.id]);
      result.charactersRemoved.push(slug);
    }

    for (const player of playerRecords(parsed.players)) {
      const email = requiredString(player.email, "players[].email").toLowerCase();
      const user = runtime.repositories.authRepository.findUserByEmail(email);
      if (!user) {
        throw new Error(`User ${email} does not exist. Create/accept the invite first, then rerun hosted:players.`);
      }
      if (user.status !== "active") throw new Error(`User ${email} is not active.`);
      if (user.role !== "player" && !user.campaignRoles.includes("player")) {
        throw new Error(`User ${email} must be a player account or campaign player.`);
      }
      runtime.database.run(
        `insert into campaign_members (campaign_id, user_id, role)
         values (?, ?, 'player')
         on conflict(campaign_id, user_id) do update set role = 'player'`,
        [campaignId, user.id],
      );
      result.membershipsEnsured.push(email);

      const character = characterRecord(player.character);
      const sheet = upsertCharacter(runtime, campaignId, user.id, character);
      applyCharacterDetails(runtime.database, sheet.id, character);
      result.charactersUpserted.push(sheet.slug);
    }

    return result;
  } finally {
    runtime.close();
  }
}

function upsertCharacter(
  runtime: ReturnType<typeof createSqliteDatabase>,
  campaignId: string,
  ownerUserId: string,
  record: HostedCharacterRecord,
): CharacterSheetReadModel {
  const name = requiredString(record.name, "players[].character.name");
  const slug = stringValue(record.slug, slugify(name));
  const existing = runtime.repositories.characterRepository.getSheetBySlug(slug);
  const className = requiredString(record.className, "players[].character.className");
  const level = positiveInteger(record.level, "players[].character.level");
  const hitPointMax = positiveInteger(record.hitPointMax, "players[].character.hitPointMax");
  const species = requiredString(record.species, "players[].character.species");
  const background = requiredString(record.background, "players[].character.background");
  const subclassName = optionalString(record.subclassName);

  if (!existing) {
    const created = runtime.repositories.characterRepository.createCharacter({
      background,
      campaignId,
      className,
      hitPointMax,
      level,
      name,
      ownerUserId,
      species,
      subclassName,
    });
    if (created.slug !== slug) {
      runtime.database.run("update characters set slug = ? where id = ?", [slug, created.id]);
    }

    return runtime.repositories.characterRepository.getSheetById(created.id)!;
  }

  if (runtime.repositories.characterRepository.getAccessContext(existing.id)?.campaignId !== campaignId) {
    throw new Error(`Character slug ${slug} belongs to another campaign.`);
  }
  runtime.database.run("update characters set owner_user_id = ? where id = ?", [ownerUserId, existing.id]);

  return runtime.repositories.characterRepository.updateSheetSummary(existing.id, {
    background,
    className,
    hitPointMax,
    initiative: integerValue(recordValue(record, "initiative"), existing.initiative),
    level,
    name,
    proficiencyBonus: integerValue(recordValue(record, "proficiencyBonus"), proficiencyBonusForLevel(level)),
    speedFeet: integerValue(recordValue(record, "speedFeet"), existing.speedFeet),
    species,
    subclassName,
  })!;
}

function applyCharacterDetails(database: ReturnType<typeof createSqliteDatabase>["database"], characterId: string, record: HostedCharacterRecord) {
  if (record.hitPointCurrent !== undefined) {
    const current = nonNegativeInteger(record.hitPointCurrent, "players[].character.hitPointCurrent");
    const resource = database
      .query<{ id: string }, [string]>("select id from character_resources where character_id = ? and resource_type = 'hit_points'")
      .get(characterId);
    if (resource) {
      database.run("update character_resources set current_value = ? where id = ?", [current, resource.id]);
    }
    database.run("update characters set hit_point_current = ? where id = ?", [current, characterId]);
  }

  for (const [ability, value] of Object.entries(recordMap(record.abilities))) {
    const abilityName = asAbilityName(ability);
    const score = positiveInteger(value, `abilities.${ability}`);
    const saveProficient = booleanValue(recordMap(recordValue(record, "saveProficiencies"))[ability], false);
    const modifier = abilityModifier(score);
    const proficiencyBonus = database
      .query<{ proficiency_bonus: number }, [string]>("select proficiency_bonus from characters where id = ?")
      .get(characterId)?.proficiency_bonus ?? 2;
    database.run(
      `insert into character_abilities (character_id, ability, score, modifier, save_proficient, save_modifier)
       values (?, ?, ?, ?, ?, ?)
       on conflict(character_id, ability) do update set
         score = excluded.score,
         modifier = excluded.modifier,
         save_proficient = excluded.save_proficient,
         save_modifier = excluded.save_modifier`,
      [
        characterId,
        abilityName,
        score,
        modifier,
        saveProficient ? 1 : 0,
        modifier + (saveProficient ? proficiencyBonus : 0),
      ],
    );
  }

  for (const [skill, value] of Object.entries(recordMap(record.skills))) {
    const ability = defaultSkillAbilities[skill];
    const proficiencyBonus = database
      .query<{ proficiency_bonus: number }, [string]>("select proficiency_bonus from characters where id = ?")
      .get(characterId)?.proficiency_bonus ?? 2;
    const abilityModifierValue = ability
      ? database
        .query<{ modifier: number }, [string, AbilityName]>(
          "select modifier from character_abilities where character_id = ? and ability = ?",
        )
        .get(characterId, ability)?.modifier ?? 0
      : 0;
    const proficiencyLevel = nonNegativeInteger(value, `skills.${skill}`);
    database.run(
      "update character_skills set proficiency_level = ?, modifier = ? where character_id = ? and skill = ?",
      [proficiencyLevel, abilityModifierValue + proficiencyBonus * proficiencyLevel, characterId, skill],
    );
  }

  replaceCollection(database, characterId, "character_equipment", record.equipment, (item, index) => [
    `equipment_${characterId}_${index + 1}`,
    characterId,
    requiredString(item.name, "equipment[].name"),
    stringValue(item.category, "gear"),
    nonNegativeInteger(item.quantity, "equipment[].quantity"),
    booleanValue(item.equipped, false) ? 1 : 0,
    stringValue(item.notes, ""),
  ], `insert into character_equipment (id, character_id, name, category, quantity, equipped, notes) values (?, ?, ?, ?, ?, ?, ?)`);

  replaceCollection(database, characterId, "character_background_entries", record.backgroundEntries, (item, index) => [
    `background_${characterId}_${index + 1}`,
    characterId,
    stringValue(item.category, "backstory"),
    requiredString(item.title, "backgroundEntries[].title"),
    stringValue(item.body, ""),
    index + 1,
  ], `insert into character_background_entries (id, character_id, category, title, body, sort_order) values (?, ?, ?, ?, ?, ?)`);

  replaceCollection(database, characterId, "character_proficiencies", record.proficiencies, (item, index) => [
    `proficiency_${characterId}_${index + 1}`,
    characterId,
    requiredString(item.category, "proficiencies[].category"),
    requiredString(item.name, "proficiencies[].name"),
    stringValue(item.detail, ""),
    index + 1,
  ], `insert into character_proficiencies (id, character_id, category, name, detail, sort_order) values (?, ?, ?, ?, ?, ?)`);

  replaceCollection(database, characterId, "character_senses", record.senses, (item, index) => [
    `sense_${characterId}_${index + 1}`,
    characterId,
    requiredString(item.label, "senses[].label"),
    requiredString(item.value, "senses[].value"),
    index + 1,
  ], `insert into character_senses (id, character_id, label, value, sort_order) values (?, ?, ?, ?, ?)`);

  replaceCollection(database, characterId, "character_armour_class_sources", record.armourClassSources, (item, index) => [
    `ac_${characterId}_${index + 1}`,
    characterId,
    requiredString(item.label, "armourClassSources[].label"),
    nonNegativeInteger(item.value, "armourClassSources[].value"),
    stringValue(item.notes, ""),
    index + 1,
  ], `insert into character_armour_class_sources (id, character_id, label, value, notes, sort_order) values (?, ?, ?, ?, ?, ?)`);

  replaceCollection(database, characterId, "character_defences", record.defences, (item, index) => [
    `defence_${characterId}_${index + 1}`,
    characterId,
    requiredString(item.type, "defences[].type"),
    requiredString(item.label, "defences[].label"),
    stringValue(item.detail, ""),
    index + 1,
  ], `insert into character_defences (id, character_id, defence_type, label, detail, sort_order) values (?, ?, ?, ?, ?, ?)`);

  for (const [resourceKey, value] of Object.entries(recordMap(record.resources))) {
    const resource = recordMap(value);
    database.run(
      `insert into character_resources (id, character_id, resource_key, resource_type, label, current_value, max_value, sort_order)
       values (?, ?, ?, ?, ?, ?, ?, 100)
       on conflict(character_id, resource_key) do update set
         resource_type = excluded.resource_type,
         label = excluded.label,
         current_value = excluded.current_value,
         max_value = excluded.max_value,
         sort_order = excluded.sort_order`,
      [
        `resource_${characterId}_${slugify(resourceKey)}`,
        characterId,
        resourceKey,
        stringValue(resource.type, "feature_use"),
        stringValue(resource.label, resourceKey),
        nonNegativeInteger(resource.current, `resources.${resourceKey}.current`),
        resource.max === null || resource.max === undefined ? null : nonNegativeInteger(resource.max, `resources.${resourceKey}.max`),
      ],
    );
  }

  if (record.faction !== undefined) {
    const factionSlug = stringValue(record.faction, "");
    const faction = factionSlug
      ? database
        .query<{ id: string }, [string]>("select id from campaign_factions where slug = ?")
        .get(factionSlug)
      : null;
    database.run(
      `insert into character_faction_choices (character_id, faction_id, connection_note)
       values (?, ?, '')
       on conflict(character_id) do update set faction_id = excluded.faction_id`,
      [characterId, faction?.id ?? null],
    );
  }

  if (record.armourClassSources !== undefined) {
    const armourClass = database
      .query<{ total: number }, [string]>("select coalesce(sum(value), 0) as total from character_armour_class_sources where character_id = ?")
      .get(characterId)?.total ?? 0;
    database.run("update characters set armour_class = ? where id = ?", [armourClass, characterId]);
  }
}

function replaceCollection(
  database: ReturnType<typeof createSqliteDatabase>["database"],
  characterId: string,
  table: string,
  value: unknown,
  row: (item: Record<string, unknown>, index: number) => unknown[],
  sql: string,
) {
  if (value === undefined) return;
  const items = recordArray(value, table);
  database.run(`delete from ${table} where character_id = ?`, [characterId]);
  items.forEach((item, index) => database.run(sql, row(item, index) as SQLQueryBindings[]));
}

function playerRecords(value: unknown): HostedPlayerRecord[] {
  return recordArray(value, "players") as HostedPlayerRecord[];
}

function characterRecord(value: unknown): HostedCharacterRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("players[].character must be an object.");
  }

  return value as HostedCharacterRecord;
}

function recordArray(value: unknown, label: string): Record<string, unknown>[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${label} must be a list.`);

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${label}[${index}] must be an object.`);
    }

    return item as Record<string, unknown>;
  });
}

function recordMap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function recordValue(record: object, key: string) {
  return (record as Record<string, unknown>)[key];
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : [];
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);

  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function positiveInteger(value: unknown, label: string) {
  const number = integerValue(value, Number.NaN);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} must be a positive integer.`);

  return number;
}

function nonNegativeInteger(value: unknown, label: string) {
  const number = integerValue(value, Number.NaN);
  if (!Number.isInteger(number) || number < 0) throw new Error(`${label} must be a non-negative integer.`);

  return number;
}

function integerValue(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Math.floor(Number(value));

  return fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asAbilityName(value: string): AbilityName {
  if (["charisma", "constitution", "dexterity", "intelligence", "strength", "wisdom"].includes(value)) {
    return value as AbilityName;
  }

  throw new Error(`Unsupported ability ${value}.`);
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function proficiencyBonusForLevel(level: number) {
  return Math.max(2, Math.ceil(level / 4) + 1);
}

const defaultSkillAbilities: Record<string, AbilityName> = {
  acrobatics: "dexterity",
  "animal handling": "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  "sleight of hand": "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function main() {
  const result = await applyHostedPlayers();
  console.log(`Disabled users: ${result.usersDisabled.length}`);
  for (const email of result.usersDisabled) console.log(`Disabled ${email}`);
  console.log(`Removed characters: ${result.charactersRemoved.length}`);
  for (const slug of result.charactersRemoved) console.log(`Removed ${slug}`);
  console.log(`Memberships ensured: ${result.membershipsEnsured.length}`);
  for (const email of result.membershipsEnsured) console.log(`Member ${email}`);
  console.log(`Characters upserted: ${result.charactersUpserted.length}`);
  for (const slug of result.charactersUpserted) console.log(`Character ${slug}`);
}

if (import.meta.main) {
  await main();
}
