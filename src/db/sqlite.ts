import { Database } from "bun:sqlite";
import type {
  AbilityName,
  ArmourClassSource,
  AuthRepository,
  AuthUser,
  AuthUserWithPassword,
  CampaignMember,
  CampaignRepository,
  CampaignSummary,
  CharacterAccessContext,
  CharacterAbility,
  CharacterBackgroundEntry,
  CharacterDefence,
  CharacterEquipment,
  CharacterNote,
  CharacterProficiency,
  CharacterRepository,
  CharacterResource,
  CharacterRuleLink,
  CharacterSense,
  CharacterSheetReadModel,
  CharacterSkill,
  LocalInvite,
  NotesRepository,
  PasswordResetToken,
  RulesRepository,
  RulesSeedRepository,
  RuleEntitySeedInput,
  StoredSession,
  UpsertedRuleEntity,
  UserRole,
} from "./model";
import { bootstrapDatabase } from "./schema";
import { seedDatabase } from "./seed";

interface UserRow {
  display_name: string;
  email: string;
  id: string;
  password_hash?: string;
  role: UserRole;
  status: AuthUser["status"];
}

interface StoredSessionRow {
  expires_at: string;
  id: string;
  user_id: string;
}

interface LocalInviteRow {
  accepted_at: string | null;
  created_by_user_id: string;
  email: string;
  expires_at: string;
  id: string;
  role: UserRole;
  token_hash: string;
}

interface PasswordResetTokenRow {
  created_by_user_id: string;
  expires_at: string;
  id: string;
  token_hash: string;
  used_at: string | null;
  user_id: string;
}

interface CharacterRow {
  armour_class: number;
  background: string;
  hit_point_current: number;
  hit_point_max: number;
  id: string;
  initiative: number;
  level: number;
  name: string;
  proficiency_bonus: number;
  slug: string;
  species: string;
  speed_ft: number;
  temporary_hit_points: number;
}

interface CharacterAccessRow {
  campaign_id: string;
  id: string;
  owner_user_id: string;
}

interface CharacterClassRow {
  class_name: string;
  hit_dice: string;
  level: number;
  spellcasting_ability: AbilityName | null;
  subclass_name: string | null;
}

interface CharacterAbilityRow {
  ability: AbilityName;
  modifier: number;
  save_modifier: number;
  save_proficient: number;
  score: number;
}

interface CharacterSkillRow {
  ability: AbilityName;
  modifier: number;
  proficiency_level: number;
  skill: string;
}

interface ArmourClassSourceRow {
  label: string;
  notes: string;
  value: number;
}

interface CharacterDefenceRow {
  defence_type: CharacterDefence["type"];
  detail: string;
  label: string;
}

interface CharacterProficiencyRow {
  category: CharacterProficiency["category"];
  detail: string;
  name: string;
}

interface CharacterSenseRow {
  label: string;
  value: string;
}

interface CharacterResourceRow {
  current_value: number;
  id: string;
  label: string;
  max_value: number | null;
  resource_key: string;
  resource_type: string;
}

interface CharacterEquipmentRow {
  category: string;
  equipped: number;
  id: string;
  name: string;
  notes: string;
  quantity: number;
}

interface CharacterBackgroundEntryRow {
  body: string;
  category: CharacterBackgroundEntry["category"];
  id: string;
  title: string;
}

interface CharacterNoteRow {
  body: string;
  id: string;
  title: string;
  visibility: CharacterNote["visibility"];
}

interface CampaignRow {
  gm_user_id: string;
  id: string;
  name: string;
  slug: string;
}

interface CampaignMemberRow {
  campaign_id: string;
  role: CampaignMember["role"];
  user_id: string;
}

interface RuleLinkRow {
  entity_name: string;
  entity_type: string;
  prepared: number;
  selected: number;
  selection_type: string;
  source_name: string;
}

interface RuleSourceRow {
  abbreviation: string;
  id: string;
  name: string;
  precedence: number;
  slug: string;
}

interface RuleEntityRow {
  entity_type: RuleEntitySeedInput["entityType"];
  id: string;
  name: string;
  slug: string;
  source_id: string;
}

export interface SqliteRepositories {
  authRepository: AuthRepository;
  campaignRepository: CampaignRepository;
  characterRepository: CharacterRepository;
  notesRepository: NotesRepository;
  rulesRepository: RulesRepository;
  rulesSeedRepository: RulesSeedRepository;
}

export interface SqliteDatabaseRuntime {
  close(): void;
  database: Database;
  repositories: SqliteRepositories;
  seed(): void;
}

interface CreateSqliteDatabaseOptions {
  path?: string;
  seed?: boolean;
}

export const createSqliteDatabase = ({
  path = "character-sheet.sqlite3",
  seed = true,
}: CreateSqliteDatabaseOptions = {}): SqliteDatabaseRuntime => {
  const database = new Database(path);
  bootstrapDatabase(database);
  if (seed) seedDatabase(database);

  return {
    close: () => database.close(),
    database,
    repositories: createSqliteRepositories(database),
    seed: () => seedDatabase(database),
  };
};

export const createSqliteRepositories = (database: Database): SqliteRepositories => ({
  authRepository: new SqliteAuthRepository(database),
  campaignRepository: new SqliteCampaignRepository(database),
  characterRepository: new SqliteCharacterRepository(database),
  notesRepository: new SqliteNotesRepository(database),
  rulesRepository: new SqliteRulesRepository(database),
  rulesSeedRepository: new SqliteRulesSeedRepository(database),
});

class SqliteAuthRepository implements AuthRepository {
  constructor(private readonly database: Database) {}

  createInvite(invite: LocalInvite): LocalInvite {
    this.database.run(
      "insert into invites (id, email, role, token_hash, created_by_user_id, expires_at, accepted_at) values (?, ?, ?, ?, ?, ?, ?)",
      [
        invite.id,
        invite.email,
        invite.role,
        invite.tokenHash,
        invite.createdByUserId,
        toSqlDate(invite.expiresAt),
        invite.acceptedAt ? toSqlDate(invite.acceptedAt) : null,
      ],
    );

    return invite;
  }

  createPasswordResetToken(token: PasswordResetToken): PasswordResetToken {
    this.database.run(
      "insert into password_reset_tokens (id, user_id, token_hash, created_by_user_id, expires_at, used_at) values (?, ?, ?, ?, ?, ?)",
      [
        token.id,
        token.userId,
        token.tokenHash,
        token.createdByUserId,
        toSqlDate(token.expiresAt),
        token.usedAt ? toSqlDate(token.usedAt) : null,
      ],
    );

    return token;
  }

  createSession(session: StoredSession): StoredSession {
    this.database.run("insert into sessions (id, user_id, expires_at) values (?, ?, ?)", [
      session.id,
      session.userId,
      toSqlDate(session.expiresAt),
    ]);

    return session;
  }

  deleteSession(sessionId: string): void {
    this.database.run("delete from sessions where id = ?", [sessionId]);
  }

  findUserByEmail(email: string): AuthUser | null {
    const row = this.database
      .query<UserRow, [string]>(
        "select id, email, display_name, role, status from users where email = ?",
      )
      .get(email);

    return row ? toAuthUser(row) : null;
  }

  findInviteByTokenHash(tokenHash: string): LocalInvite | null {
    const row = this.database
      .query<LocalInviteRow, [string]>(
        "select id, email, role, token_hash, created_by_user_id, expires_at, accepted_at from invites where token_hash = ?",
      )
      .get(tokenHash);

    return row
      ? {
          acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
          createdByUserId: row.created_by_user_id,
          email: row.email,
          expiresAt: new Date(row.expires_at),
          id: row.id,
          role: row.role,
          tokenHash: row.token_hash,
        }
      : null;
  }

  findPasswordResetTokenByTokenHash(tokenHash: string): PasswordResetToken | null {
    const row = this.database
      .query<PasswordResetTokenRow, [string]>(
        "select id, user_id, token_hash, created_by_user_id, expires_at, used_at from password_reset_tokens where token_hash = ?",
      )
      .get(tokenHash);

    return row
      ? {
          createdByUserId: row.created_by_user_id,
          expiresAt: new Date(row.expires_at),
          id: row.id,
          tokenHash: row.token_hash,
          usedAt: row.used_at ? new Date(row.used_at) : null,
          userId: row.user_id,
        }
      : null;
  }

  findSessionById(id: string): StoredSession | null {
    const row = this.database
      .query<StoredSessionRow, [string]>("select id, user_id, expires_at from sessions where id = ?")
      .get(id);

    return row
      ? {
          expiresAt: new Date(row.expires_at),
          id: row.id,
          userId: row.user_id,
        }
      : null;
  }

  findUserById(id: string): AuthUser | null {
    const row = this.database
      .query<UserRow, [string]>("select id, email, display_name, role, status from users where id = ?")
      .get(id);

    return row ? toAuthUser(row) : null;
  }

  findUserWithPasswordByEmail(email: string): AuthUserWithPassword | null {
    const row = this.database
      .query<UserRow, [string]>(
        "select id, email, display_name, role, status, password_hash from users where email = ?",
      )
      .get(email);

    return row && row.password_hash
      ? {
          ...toAuthUser(row),
          passwordHash: row.password_hash,
        }
      : null;
  }

  listUsers(): AuthUser[] {
    return this.database
      .query<UserRow, []>(
        `select id, email, display_name, role, status
         from users
         order by case id
           when 'user_lynott_player' then 1
           when 'user_game_master' then 2
           when 'user_site_admin' then 3
           else 4
         end, email`,
      )
      .all()
      .map(toAuthUser);
  }
}

class SqliteCharacterRepository implements CharacterRepository {
  constructor(private readonly database: Database) {}

  getAccessContext(characterId: string): CharacterAccessContext | null {
    const row = this.database
      .query<CharacterAccessRow, [string]>(
        "select id, owner_user_id, campaign_id from characters where id = ?",
      )
      .get(characterId);

    return row
      ? {
          campaignId: row.campaign_id,
          id: row.id,
          ownerUserId: row.owner_user_id,
        }
      : null;
  }

  getSheetById(id: string): CharacterSheetReadModel | null {
    return this.getSheetBy("id", id);
  }

  getSheetBySlug(slug: string): CharacterSheetReadModel | null {
    return this.getSheetBy("slug", slug);
  }

  private getSheetBy(field: "id" | "slug", value: string): CharacterSheetReadModel | null {
    const whereColumn = field === "id" ? "id" : "slug";
    const character = this.database
      .query<CharacterRow, [string]>(
        `select id, slug, name, species, background, level, proficiency_bonus, armour_class,
          initiative, speed_ft, hit_point_max, hit_point_current, temporary_hit_points
         from characters
         where ${whereColumn} = ?`,
      )
      .get(value);

    if (!character) return null;

    return {
      abilities: this.listAbilities(character.id),
      armourClassBreakdown: this.listArmourClassBreakdown(character.id),
      armourClass: character.armour_class,
      background: character.background,
      classes: this.database
        .query<CharacterClassRow, [string]>(
          `select class_name, subclass_name, level, hit_dice, spellcasting_ability
           from character_classes
           where character_id = ?
           order by class_name`,
        )
        .all(character.id)
        .map((row) => ({
          className: row.class_name,
          hitDice: row.hit_dice,
          level: row.level,
          spellcastingAbility: row.spellcasting_ability,
          subclassName: row.subclass_name,
        })),
      defences: this.listDefences(character.id),
      hitPoints: {
        current: character.hit_point_current,
        max: character.hit_point_max,
        temporary: character.temporary_hit_points,
      },
      id: character.id,
      initiative: character.initiative,
      level: character.level,
      name: character.name,
      proficiencies: this.listProficiencies(character.id),
      proficiencyBonus: character.proficiency_bonus,
      senses: this.listSenses(character.id),
      skills: this.listSkills(character.id),
      slug: character.slug,
      species: character.species,
      speedFeet: character.speed_ft,
    };
  }

  listResources(characterId: string): CharacterResource[] {
    return this.database
      .query<CharacterResourceRow, [string]>(
        `select id, resource_key, resource_type, label, current_value, max_value
         from character_resources
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map(toCharacterResource);
  }

  listEquipment(characterId: string): CharacterEquipment[] {
    return this.database
      .query<CharacterEquipmentRow, [string]>(
        `select id, name, category, quantity, equipped, notes
         from character_equipment
         where character_id = ?
         order by
           case
             when category = 'money' then 0
             when equipped = 1 then 1
             else 2
           end,
           category,
           name`,
      )
      .all(characterId)
      .map(toCharacterEquipment);
  }

  listBackgroundEntries(characterId: string): CharacterBackgroundEntry[] {
    return this.database
      .query<CharacterBackgroundEntryRow, [string]>(
        `select id, category, title, body
         from character_background_entries
         where character_id = ?
         order by sort_order, title`,
      )
      .all(characterId)
      .map((row) => ({
        body: row.body,
        category: row.category,
        id: row.id,
        title: row.title,
      }));
  }

  updateResourceCurrent(
    characterId: string,
    resourceId: string,
    current: number,
  ): CharacterResource | null {
    const resource = this.getResource(characterId, resourceId);
    if (!resource) return null;

    const nextCurrent = clampResourceCurrent(resource, current);
    this.database.run(
      "update character_resources set current_value = ? where character_id = ? and id = ?",
      [nextCurrent, characterId, resourceId],
    );

    if (resource.type === "hit_points") {
      this.database.run("update characters set hit_point_current = ? where id = ?", [
        nextCurrent,
        characterId,
      ]);
    }

    if (resource.type === "temporary_hit_points") {
      this.database.run("update characters set temporary_hit_points = ? where id = ?", [
        nextCurrent,
        characterId,
      ]);
    }

    return this.getResource(characterId, resourceId);
  }

  updateEquipmentItem(
    characterId: string,
    equipmentId: string,
    patch: { equipped?: boolean; quantity?: number },
  ): CharacterEquipment | null {
    const equipment = this.getEquipment(characterId, equipmentId);
    if (!equipment) return null;

    const nextQuantity =
      patch.quantity === undefined ? equipment.quantity : Math.max(0, patch.quantity);
    const nextEquipped = patch.equipped === undefined ? equipment.equipped : patch.equipped;

    this.database.run(
      "update character_equipment set quantity = ?, equipped = ? where character_id = ? and id = ?",
      [nextQuantity, nextEquipped ? 1 : 0, characterId, equipmentId],
    );

    return this.getEquipment(characterId, equipmentId);
  }

  upsertConditionResource(characterId: string, label: string): CharacterResource {
    const conditionLabel = label.trim();
    const conditionSlug = slugify(conditionLabel);
    const id = `condition_${characterId}_${conditionSlug}`;
    const key = `condition_${conditionSlug}`;

    this.database.run(
      `insert into character_resources (id, character_id, resource_key, resource_type, label, current_value, max_value, sort_order)
       values (?, ?, ?, 'condition', ?, 1, 1, 500)
       on conflict(character_id, resource_key) do update set
         label = excluded.label,
         current_value = 1,
         max_value = 1,
         sort_order = excluded.sort_order`,
      [id, characterId, key, conditionLabel],
    );

    return this.getResourceByKey(characterId, key)!;
  }

  private getResource(characterId: string, resourceId: string): CharacterResource | null {
    const row = this.database
      .query<CharacterResourceRow, [string, string]>(
        `select id, resource_key, resource_type, label, current_value, max_value
         from character_resources
         where character_id = ? and id = ?`,
      )
      .get(characterId, resourceId);

    return row ? toCharacterResource(row) : null;
  }

  private getResourceByKey(characterId: string, resourceKey: string): CharacterResource | null {
    const row = this.database
      .query<CharacterResourceRow, [string, string]>(
        `select id, resource_key, resource_type, label, current_value, max_value
         from character_resources
         where character_id = ? and resource_key = ?`,
      )
      .get(characterId, resourceKey);

    return row ? toCharacterResource(row) : null;
  }

  private getEquipment(characterId: string, equipmentId: string): CharacterEquipment | null {
    const row = this.database
      .query<CharacterEquipmentRow, [string, string]>(
        `select id, name, category, quantity, equipped, notes
         from character_equipment
         where character_id = ? and id = ?`,
      )
      .get(characterId, equipmentId);

    return row ? toCharacterEquipment(row) : null;
  }

  private listAbilities(characterId: string): CharacterAbility[] {
    return this.database
      .query<CharacterAbilityRow, [string]>(
        `select ability, score, modifier, save_proficient, save_modifier
         from character_abilities
         where character_id = ?
         order by case ability
           when 'strength' then 1
           when 'dexterity' then 2
           when 'constitution' then 3
           when 'intelligence' then 4
           when 'wisdom' then 5
           when 'charisma' then 6
         end`,
      )
      .all(characterId)
      .map((row) => ({
        ability: row.ability,
        modifier: row.modifier,
        saveModifier: row.save_modifier,
        saveProficient: row.save_proficient === 1,
        score: row.score,
      }));
  }

  private listSkills(characterId: string): CharacterSkill[] {
    return this.database
      .query<CharacterSkillRow, [string]>(
        `select skill, ability, proficiency_level, modifier
         from character_skills
         where character_id = ?
         order by skill`,
      )
      .all(characterId)
      .map((row) => ({
        ability: row.ability,
        modifier: row.modifier,
        proficiencyLevel: row.proficiency_level,
        skill: row.skill,
      }));
  }

  private listArmourClassBreakdown(characterId: string): ArmourClassSource[] {
    return this.database
      .query<ArmourClassSourceRow, [string]>(
        `select label, value, notes
         from character_armour_class_sources
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map((row) => ({
        label: row.label,
        notes: row.notes,
        value: row.value,
      }));
  }

  private listDefences(characterId: string): CharacterDefence[] {
    return this.database
      .query<CharacterDefenceRow, [string]>(
        `select defence_type, label, detail
         from character_defences
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map((row) => ({
        detail: row.detail,
        label: row.label,
        type: row.defence_type,
      }));
  }

  private listProficiencies(characterId: string): CharacterProficiency[] {
    return this.database
      .query<CharacterProficiencyRow, [string]>(
        `select category, name, detail
         from character_proficiencies
         where character_id = ?
         order by sort_order, name`,
      )
      .all(characterId)
      .map((row) => ({
        category: row.category,
        detail: row.detail,
        name: row.name,
      }));
  }

  private listSenses(characterId: string): CharacterSense[] {
    return this.database
      .query<CharacterSenseRow, [string]>(
        `select label, value
         from character_senses
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map((row) => ({
        label: row.label,
        value: row.value,
      }));
  }
}

class SqliteNotesRepository implements NotesRepository {
  constructor(private readonly database: Database) {}

  listNotesForCharacter(characterId: string, viewerRole: UserRole): CharacterNote[] {
    const rows = this.database
      .query<CharacterNoteRow, [string, UserRole]>(
        `select id, title, body, visibility
         from character_notes
         where character_id = ?
           and (? != 'player' or visibility = 'player')
         order by case visibility when 'player' then 1 else 2 end, title`,
      )
      .all(characterId, viewerRole);

    return rows.map((row) => ({
      body: row.body,
      id: row.id,
      title: row.title,
      visibility: row.visibility,
    }));
  }

  updateNoteBody(
    characterId: string,
    noteId: string,
    viewerRole: UserRole,
    body: string,
  ): CharacterNote | null {
    this.database
      .query<never, [string, string, string, UserRole]>(
        `update character_notes
         set body = ?
         where character_id = ?
           and id = ?
           and (? != 'player' or visibility = 'player')`,
      )
      .run(body, characterId, noteId, viewerRole);

    const row = this.database
      .query<CharacterNoteRow, [string, string, UserRole]>(
        `select id, title, body, visibility
         from character_notes
         where character_id = ?
           and id = ?
           and (? != 'player' or visibility = 'player')`,
      )
      .get(characterId, noteId, viewerRole);

    return row
      ? {
          body: row.body,
          id: row.id,
          title: row.title,
          visibility: row.visibility,
        }
      : null;
  }
}

class SqliteCampaignRepository implements CampaignRepository {
  constructor(private readonly database: Database) {}

  getCampaignBySlug(slug: string): CampaignSummary | null {
    const row = this.database
      .query<CampaignRow, [string]>(
        "select id, slug, name, gm_user_id from campaigns where slug = ?",
      )
      .get(slug);

    return row
      ? {
          gmUserId: row.gm_user_id,
          id: row.id,
          name: row.name,
          slug: row.slug,
        }
      : null;
  }

  listMembers(campaignId: string): CampaignMember[] {
    return this.database
      .query<CampaignMemberRow, [string]>(
        "select campaign_id, user_id, role from campaign_members where campaign_id = ? order by role, user_id",
      )
      .all(campaignId)
      .map((row) => ({
        campaignId: row.campaign_id,
        role: row.role,
        userId: row.user_id,
      }));
  }
}

class SqliteRulesRepository implements RulesRepository {
  constructor(private readonly database: Database) {}

  listRuleLinksForCharacter(characterId: string): CharacterRuleLink[] {
    return this.database
      .query<RuleLinkRow, [string]>(
        `select entities.name as entity_name,
          entities.entity_type,
          links.prepared,
          links.selected,
          links.selection_type,
          sources.name as source_name
        from character_rule_links links
        inner join rules_entities entities on entities.id = links.rules_entity_id
        inner join rules_sources sources on sources.id = entities.source_id
        where links.character_id = ?
        order by links.sort_order, entities.name`,
      )
      .all(characterId)
      .map((row) => ({
        entityName: row.entity_name,
        entityType: row.entity_type,
        prepared: row.prepared === 1,
        selected: row.selected === 1,
        selectionType: row.selection_type,
        sourceName: row.source_name,
      }));
  }
}

class SqliteRulesSeedRepository implements RulesSeedRepository {
  constructor(private readonly database: Database) {}

  upsertRuleEntity(entity: RuleEntitySeedInput): UpsertedRuleEntity {
    const source = this.upsertSource(entity.source);
    const existingEntity = this.getEntityByNaturalKey(source.id, entity.entityType, entity.slug);
    const entityId = existingEntity?.id ?? entity.id ?? ruleEntityId(source.slug, entity.entityType, entity.slug);

    this.database.run(
      `insert into rules_entities (id, source_id, slug, entity_type, name)
       values (?, ?, ?, ?, ?)
       on conflict(source_id, entity_type, slug) do update set
         name = excluded.name`,
      [entityId, source.id, entity.slug, entity.entityType, entity.name],
    );

    this.database.run("delete from rule_mechanics where rules_entity_id = ?", [entityId]);
    entity.mechanics.forEach((mechanic, index) => {
      this.database.run(
        `insert into rule_mechanics (id, rules_entity_id, mechanic_type, data_json)
         values (?, ?, ?, ?)`,
        [
          ruleMechanicId(entityId, mechanic.mechanicType, index),
          entityId,
          mechanic.mechanicType,
          JSON.stringify(mechanic.data),
        ],
      );
    });

    return {
      ...entity,
      id: entityId,
      source,
    };
  }

  private upsertSource(source: RuleEntitySeedInput["source"]) {
    const sourceId = source.id ?? ruleSourceId(source.slug);

    this.database.run(
      `insert into rules_sources (id, slug, name, abbreviation, precedence)
       values (?, ?, ?, ?, ?)
       on conflict(slug) do update set
         name = excluded.name,
         abbreviation = excluded.abbreviation,
         precedence = excluded.precedence`,
      [sourceId, source.slug, source.name, source.abbreviation, source.precedence],
    );

    const row = this.database
      .query<RuleSourceRow, [string]>(
        "select id, slug, name, abbreviation, precedence from rules_sources where slug = ?",
      )
      .get(source.slug);

    if (!row) throw new Error(`Could not upsert rules source ${source.slug}`);

    return row;
  }

  private getEntityByNaturalKey(
    sourceId: string,
    entityType: RuleEntitySeedInput["entityType"],
    slug: string,
  ) {
    return this.database
      .query<RuleEntityRow, [string, string, string]>(
        `select id, source_id, slug, entity_type, name
         from rules_entities
         where source_id = ? and entity_type = ? and slug = ?`,
      )
      .get(sourceId, entityType, slug);
  }
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    role: row.role,
    status: row.status,
  };
}

function toCharacterResource(row: CharacterResourceRow): CharacterResource {
  return {
    current: row.current_value,
    id: row.id,
    key: row.resource_key,
    label: row.label,
    max: row.max_value,
    type: row.resource_type,
  };
}

function toCharacterEquipment(row: CharacterEquipmentRow): CharacterEquipment {
  return {
    category: row.category,
    equipped: row.equipped === 1,
    id: row.id,
    name: row.name,
    notes: row.notes,
    quantity: row.quantity,
  };
}

function clampResourceCurrent(resource: CharacterResource, current: number) {
  const wholeCurrent = Math.trunc(current);
  const lowerBounded = Math.max(0, wholeCurrent);

  return resource.max === null ? lowerBounded : Math.min(lowerBounded, resource.max);
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "custom";
}

function ruleSourceId(sourceSlug: string) {
  return `rules_source_${slugify(sourceSlug)}`;
}

function ruleEntityId(sourceSlug: string, entityType: string, entitySlug: string) {
  return `rule_${slugify(sourceSlug)}_${slugify(entityType)}_${slugify(entitySlug)}`;
}

function ruleMechanicId(entityId: string, mechanicType: string, index: number) {
  return `${entityId}_${slugify(mechanicType)}_${index + 1}`;
}

function toSqlDate(date: Date) {
  return date.toISOString();
}
