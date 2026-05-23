import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import {
  createProviderRegistry,
  type DatabaseProviderBase,
} from "@macavitymadcap/hyper-dank-data";
import { abilityModifier, armourClassTotal, savingThrowModifier, skillModifier } from "../characters/calculations";
import { characterClassDefaults, formatHitDice } from "./class-defaults";
import { standardCharacterResourceTemplates } from "./standard-resources";
import type {
  AbilityName,
  ArmourClassSource,
  AdminUserSummary,
  AuthRepository,
  AuthUser,
  AuthUserWithPassword,
  CampaignMemberRole,
  CampaignContentRepository,
  CampaignContentVisibility,
  CampaignFaction,
  CampaignImageAsset,
  CampaignMember,
  CampaignNpcDossier,
  CampaignNpcSummary,
  CampaignRepository,
  CampaignSessionRecord,
  CampaignSummary,
  CampaignWikiPage,
  CharacterAccessContext,
  CharacterAbility,
  CharacterBackgroundEntry,
  CreateCharacterInput,
  CharacterDefence,
  CharacterEquipment,
  CharacterFactionChoice,
  CharacterNote,
  CharacterProficiency,
  CharacterRepository,
  CharacterResource,
  CharacterRuleLink,
  CharacterRosterItem,
  CharacterSense,
  CharacterSheetReadModel,
  CharacterSkill,
  LocalInvite,
  NotesRepository,
  NpcVisibility,
  PasswordResetToken,
  RulesRepository,
  RulesContentCategory,
  RulesSourceSummary,
  RulesSourceVisibility,
  RuleDetail,
  RuleAccessFilters,
  RulesSeedRepository,
  RuleEntitySeedInput,
  RuleEntityType,
  RuleEntityTypeCount,
  RuleMechanicReadModel,
  RuleSearchFilters,
  RuleSummary,
  StoredSession,
  UserCapability,
  UpsertedRuleEntity,
  UserRole,
  UserStatus,
  WikiPageType,
} from "./model";
import { bootstrapDatabase } from "./schema";
import { seedDatabase } from "./seed";

interface UserRow {
  display_name: string;
  email: string;
  id: string;
  password_hash?: string;
  role: UserRole;
  status: UserStatus;
}

interface UserSummaryRow extends UserRow {
  campaign_count: number | null;
  character_count: number | null;
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

interface CharacterRosterRow {
  background: string;
  campaign_id: string;
  campaign_name: string;
  campaign_slug: string;
  class_summary: string | null;
  faction_id: string | null;
  faction_name: string | null;
  id: string;
  level: number;
  name: string;
  owner_display_name: string;
  owner_user_id: string;
  slug: string;
  species: string;
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
  id: string;
  label: string;
  notes: string;
  value: number;
}

interface CharacterDefenceRow {
  defence_type: CharacterDefence["type"];
  detail: string;
  id: string;
  label: string;
}

interface CharacterProficiencyRow {
  category: CharacterProficiency["category"];
  detail: string;
  id: string;
  name: string;
}

interface CharacterSenseRow {
  id: string;
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
  author_user_id: string;
  body: string;
  created_at: string;
  id: string;
  title: string;
  updated_at: string;
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

interface CampaignWikiPageRow {
  body_markdown: string;
  campaign_id: string;
  cover_image_asset_id: string | null;
  id: string;
  page_type: WikiPageType;
  slug: string;
  source_path: string | null;
  source_title: string | null;
  tags_json: string;
  title: string;
  visibility: CampaignContentVisibility;
}

interface CampaignImageAssetRow {
  alt_text: string;
  byte_size: number;
  campaign_id: string;
  caption: string;
  height: number | null;
  id: string;
  mime_type: string;
  storage_key: string;
  title: string;
  visibility: CampaignContentVisibility;
  width: number | null;
}

interface CampaignSessionRecordRow {
  body: string;
  campaign_id: string;
  created_at: string;
  created_by_user_id: string | null;
  id: string;
  session_date: string | null;
  slug: string;
  summary: string;
  title: string;
  updated_at: string;
  visibility: CampaignContentVisibility;
}

interface CampaignNpcDossierRow {
  campaign_id: string;
  created_at: string;
  gm_notes: string;
  hooks: string;
  id: string;
  motivations: string;
  name: string;
  portrait_image_asset_id: string | null;
  public_summary: string;
  public_wiki_page_id: string | null;
  reveal_notes: string;
  rules_entity_id: string | null;
  scene_notes: string;
  secrets: string;
  selected_player_ids: string | null;
  slug: string;
  updated_at: string;
  visibility: NpcVisibility;
}

interface CampaignFactionRow {
  campaign_id: string;
  connections_json: string;
  id: string;
  image_asset_id: string | null;
  motto: string;
  name: string;
  player_prompt: string;
  public_reputation: string;
  rumours_json: string;
  slug: string;
  summary: string;
  wiki_page_slug: string | null;
  wiki_page_title: string | null;
}

interface CharacterFactionChoiceRow {
  character_id: string;
  connection_note: string;
  faction_id: string | null;
  faction_name: string | null;
  faction_slug: string | null;
}

interface RuleLinkRow {
  action_timing_json: string | null;
  charges: string | null;
  content_category: RulesContentCategory;
  description: string | null;
  entity_name: string;
  entity_slug: string;
  entity_type: string;
  prepared: number;
  reset_cadence: string | null;
  selected: number;
  selection_type: string;
  source_name: string;
  source_slug: string;
}

interface RuleSourceRow {
  abbreviation: string;
  campaign_ids: string | null;
  content_category: RulesContentCategory;
  id: string;
  name: string;
  precedence: number;
  public_export_eligible: number;
  slug: string;
  visibility: RulesSourceVisibility;
}

interface RuleEntityRow {
  entity_type: RuleEntitySeedInput["entityType"];
  id: string;
  name: string;
  slug: string;
  source_id: string;
}

interface RuleSummaryRow {
  campaign_ids: string | null;
  content_category: RulesContentCategory;
  data_json: string | null;
  entity_type: RuleEntityType;
  id: string;
  mechanic_type: string | null;
  name: string;
  public_export_eligible: number;
  slug: string;
  source_abbreviation: string;
  source_name: string;
  source_slug: string;
  source_visibility: RulesSourceVisibility;
}

interface RuleEntityTypeCountRow {
  count: number;
  entity_type: RuleEntityType;
}

export interface SqliteRepositories {
  authRepository: AuthRepository;
  campaignContentRepository: CampaignContentRepository;
  campaignRepository: CampaignRepository;
  characterRepository: CharacterRepository;
  notesRepository: NotesRepository;
  rulesRepository: RulesRepository;
  rulesSeedRepository: RulesSeedRepository;
}

export interface SqliteDatabaseRuntime extends DatabaseProviderBase<SqliteRepositories, "sqlite"> {
  close(): void;
  database: Database;
  kind: "sqlite";
  repositories: SqliteRepositories;
  seed(): void;
}

export interface CreateSqliteDatabaseOptions {
  path?: string;
  seed?: boolean;
}

const abilityNames: AbilityName[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

const defaultSkills: Array<{ ability: AbilityName; skill: string }> = [
  { ability: "dexterity", skill: "acrobatics" },
  { ability: "wisdom", skill: "animal handling" },
  { ability: "intelligence", skill: "arcana" },
  { ability: "strength", skill: "athletics" },
  { ability: "charisma", skill: "deception" },
  { ability: "intelligence", skill: "history" },
  { ability: "wisdom", skill: "insight" },
  { ability: "charisma", skill: "intimidation" },
  { ability: "intelligence", skill: "investigation" },
  { ability: "wisdom", skill: "medicine" },
  { ability: "intelligence", skill: "nature" },
  { ability: "wisdom", skill: "perception" },
  { ability: "charisma", skill: "performance" },
  { ability: "charisma", skill: "persuasion" },
  { ability: "intelligence", skill: "religion" },
  { ability: "dexterity", skill: "sleight of hand" },
  { ability: "dexterity", skill: "stealth" },
  { ability: "wisdom", skill: "survival" },
];

export const createSqliteDatabase = ({
  path = "character-sheet.sqlite3",
  seed = true,
}: CreateSqliteDatabaseOptions = {}): SqliteDatabaseRuntime => {
  const database = new Database(path);
  bootstrapDatabase(database);
  if (seed) seedDatabase(database);
  const repositories = createSqliteRepositories(database);

  return {
    close: () => database.close(),
    createRepositories: () => createSqliteRepositories(database),
    database,
    kind: "sqlite",
    migrate: () => bootstrapDatabase(database),
    repositories,
    seed: () => seedDatabase(database),
  };
};

export const createSqliteProviderRegistry = () =>
  createProviderRegistry({
    sqlite: createSqliteDatabase,
  });

export const createSqliteRepositories = (database: Database): SqliteRepositories => ({
  authRepository: new SqliteAuthRepository(database),
  campaignContentRepository: new SqliteCampaignContentRepository(database),
  campaignRepository: new SqliteCampaignRepository(database),
  characterRepository: new SqliteCharacterRepository(database),
  notesRepository: new SqliteNotesRepository(database),
  rulesRepository: new SqliteRulesRepository(database),
  rulesSeedRepository: new SqliteRulesSeedRepository(database),
});

class SqliteAuthRepository implements AuthRepository {
  constructor(private readonly database: Database) {}

  acceptInvite(inviteId: string, acceptedAt: Date): void {
    this.database.run("update invites set accepted_at = ? where id = ?", [
      toSqlDate(acceptedAt),
      inviteId,
    ]);
  }

  createUser(user: AuthUserWithPassword): AuthUser {
    this.database.run(
      "insert into users (id, email, display_name, role, password_hash, status) values (?, ?, ?, ?, ?, ?)",
      [user.id, user.email, user.displayName, user.role, user.passwordHash, user.status],
    );
    for (const capability of this.compatibleCapabilities(user)) {
      this.database.run(
        "insert or ignore into user_capabilities (user_id, capability) values (?, ?)",
        [user.id, capability],
      );
    }

    return {
      capabilities: this.compatibleCapabilities(user),
      campaignRoles: [],
      displayName: user.displayName,
      email: user.email,
      id: user.id,
      role: user.role,
      status: user.status,
    };
  }

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

  countActiveAdmins(): number {
    const row = this.database
      .query<{ count: number }, []>(
        `select count(distinct users.id) as count
         from users
         left join user_capabilities
           on user_capabilities.user_id = users.id
          and user_capabilities.capability = 'admin'
         where users.status = 'active'
           and (users.role = 'admin' or user_capabilities.capability = 'admin')`,
      )
      .get();

    return row?.count ?? 0;
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

    return row ? this.toAuthUser(row) : null;
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

    return row ? this.toAuthUser(row) : null;
  }

  findUserWithPasswordByEmail(email: string): AuthUserWithPassword | null {
    const row = this.database
      .query<UserRow, [string]>(
        "select id, email, display_name, role, status, password_hash from users where email = ?",
      )
      .get(email);

    return row && row.password_hash
      ? {
          ...this.toAuthUser(row),
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
           when 'user_mira_player' then 3
           when 'user_site_admin' then 4
           else 5
         end, email`,
      )
      .all()
      .map((row) => this.toAuthUser(row));
  }

  listInvites(): LocalInvite[] {
    return this.database
      .query<LocalInviteRow, []>(
        `select id, email, role, token_hash, created_by_user_id, expires_at, accepted_at
         from invites
         order by created_at desc, email`,
      )
      .all()
      .map((row) => ({
        acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
        createdByUserId: row.created_by_user_id,
        email: row.email,
        expiresAt: new Date(row.expires_at),
        id: row.id,
        role: row.role,
        tokenHash: row.token_hash,
      }));
  }

  listPasswordResetTokens(): PasswordResetToken[] {
    return this.database
      .query<PasswordResetTokenRow, []>(
        `select id, user_id, token_hash, created_by_user_id, expires_at, used_at
         from password_reset_tokens
         order by created_at desc`,
      )
      .all()
      .map((row) => ({
        createdByUserId: row.created_by_user_id,
        expiresAt: new Date(row.expires_at),
        id: row.id,
        tokenHash: row.token_hash,
        usedAt: row.used_at ? new Date(row.used_at) : null,
        userId: row.user_id,
      }));
  }

  listUserSummaries(): AdminUserSummary[] {
    return this.database
      .query<
        UserSummaryRow,
        []
      >(
        `select users.id, users.email, users.display_name, users.role, users.status,
          (select count(1) from campaign_members where campaign_members.user_id = users.id) as campaign_count,
          (select count(1) from characters where characters.owner_user_id = users.id) as character_count
         from users
         order by users.email`,
      )
      .all()
      .map((row) => ({
        campaignCount: row.campaign_count ?? 0,
        characterCount: row.character_count ?? 0,
        capabilities: this.listUserCapabilities(row.id),
        campaignRoles: this.listCampaignRoles(row.id),
        displayName: row.display_name,
        email: row.email,
        id: row.id,
        role: row.role,
        status: row.status,
      }));
  }

  updateUserPasswordHash(userId: string, passwordHash: string): void {
    this.database.run("update users set password_hash = ? where id = ?", [passwordHash, userId]);
  }

  updateUserStatus(userId: string, status: UserStatus): AuthUser | null {
    this.database.run("update users set status = ? where id = ?", [status, userId]);

    return this.findUserById(userId);
  }

  usePasswordResetToken(tokenId: string, usedAt: Date): void {
    this.database.run("update password_reset_tokens set used_at = ? where id = ?", [
      toSqlDate(usedAt),
      tokenId,
    ]);
  }

  private compatibleCapabilities(user: Pick<AuthUser, "capabilities" | "role">): UserCapability[] {
    const capabilities = new Set(user.capabilities ?? []);
    if (user.role === "admin") capabilities.add("admin");

    return [...capabilities].sort();
  }

  private listCampaignRoles(userId: string): CampaignMemberRole[] {
    return this.database
      .query<{ role: CampaignMemberRole }, [string]>(
        `select distinct role
         from campaign_members
         where user_id = ?
         order by role`,
      )
      .all(userId)
      .map((row) => row.role);
  }

  private listUserCapabilities(userId: string): UserCapability[] {
    const capabilities = this.database
      .query<{ capability: UserCapability }, [string]>(
        `select capability
         from user_capabilities
         where user_id = ?
         order by capability`,
      )
      .all(userId)
      .map((row) => row.capability);
    const row = this.database
      .query<Pick<UserRow, "role">, [string]>("select role from users where id = ?")
      .get(userId);
    if (row?.role === "admin" && !capabilities.includes("admin")) capabilities.push("admin");

    return capabilities;
  }

  private toAuthUser(row: UserRow): AuthUser {
    return {
      capabilities: this.listUserCapabilities(row.id),
      campaignRoles: this.listCampaignRoles(row.id),
      displayName: row.display_name,
      email: row.email,
      id: row.id,
      role: row.role,
      status: row.status,
    };
  }
}

class SqliteCharacterRepository implements CharacterRepository {
  constructor(private readonly database: Database) {}

  createCharacter(input: CreateCharacterInput): CharacterSheetReadModel {
    const name = input.name.trim();
    const species = input.species.trim();
    const background = input.background.trim();
    const className = input.className.trim();
    const subclassName = input.subclassName?.trim() || null;
    const level = Math.max(1, Math.floor(input.level));
    const hitPointMax = Math.max(1, Math.floor(input.hitPointMax));
    const classDefaults = characterClassDefaults(className);
    const characterId = randomUUID();
    const slug = this.nextSlug(input.campaignId, name);
    const proficiencyBonus = Math.max(2, Math.ceil(level / 4) + 1);

    const insert = this.database.transaction(() => {
      this.database.run(
        `insert into characters (
          id, slug, owner_user_id, campaign_id, name, species, background, level,
          proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max,
          hit_point_current, temporary_hit_points
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, 10, 0, 30, ?, ?, 0)`,
        [
          characterId,
          slug,
          input.ownerUserId,
          input.campaignId,
          name,
          species,
          background,
          level,
          proficiencyBonus,
          hitPointMax,
          hitPointMax,
        ],
      );
      this.database.run(
        `insert into character_classes (
          id, character_id, class_name, subclass_name, level, hit_dice, spellcasting_ability
        ) values (?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          characterId,
          className,
          subclassName,
          level,
          formatHitDice(level, classDefaults.hitDieSides),
          classDefaults.spellcastingAbility,
        ],
      );

      for (const ability of abilityNames) {
        this.database.run(
          `insert into character_abilities (
            character_id, ability, score, modifier, save_proficient, save_modifier
          ) values (?, ?, 10, 0, 0, 0)`,
          [characterId, ability],
        );
      }
      for (const skill of defaultSkills) {
        this.database.run(
          `insert into character_skills (
            character_id, skill, ability, proficiency_level, modifier
          ) values (?, ?, ?, 0, 0)`,
          [characterId, skill.skill, skill.ability],
        );
      }
      this.database.run(
        `insert into character_senses (id, character_id, label, value, sort_order)
         values (?, ?, 'Passive perception', '10', 10)`,
        [randomUUID(), characterId],
      );
      this.database.run(
        `insert into character_armour_class_sources (id, character_id, label, value, notes, sort_order)
         values (?, ?, 'Unarmoured base', 10, 'Manual character default.', 10)`,
        [randomUUID(), characterId],
      );

      const defences: Array<[CharacterDefence["type"], string]> = [
        ["armour", "Armour"],
        ["resistance", "Resistances"],
        ["immunity", "Immunities"],
        ["condition_immunity", "Condition immunities"],
      ];
      defences.forEach(([type, label], index) => {
        this.database.run(
          `insert into character_defences (id, character_id, defence_type, label, detail, sort_order)
           values (?, ?, ?, ?, 'None currently recorded.', ?)`,
          [randomUUID(), characterId, type, label, index + 1],
        );
      });

      for (const resource of standardCharacterResourceTemplates({
        hitDiceCurrent: level,
        hitDieSides: classDefaults.hitDieSides,
        hitPointMax,
      })) {
        this.database.run(
          `insert into character_resources (id, character_id, resource_key, resource_type, label, current_value, max_value, sort_order)
           values (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            characterId,
            resource.key,
            resource.type,
            resource.label,
            resource.current,
            resource.max,
            resource.sortOrder,
          ],
        );
      }
      this.database.run(
        `insert into character_equipment (id, character_id, name, category, quantity, equipped, notes)
         values (?, ?, 'Coin purse', 'money', 0, 0, 'Starting money to be recorded.')`,
        [randomUUID(), characterId],
      );
      this.database.run(
        `insert into character_background_entries (id, character_id, category, title, body, sort_order)
         values (?, ?, 'backstory', 'Starting notes', '', 10)`,
        [randomUUID(), characterId],
      );
    });

    insert();

    return this.getSheetById(characterId)!;
  }

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

  listCharactersForPlayer(userId: string): CharacterRosterItem[] {
    return this.listRoster(
      `where characters.owner_user_id = ?
         and exists (
           select 1
           from campaign_members members
           where members.campaign_id = characters.campaign_id
             and members.user_id = characters.owner_user_id
         )`,
      [userId],
    );
  }

  listCharactersForCampaign(campaignId: string): CharacterRosterItem[] {
    return this.listRoster("where characters.campaign_id = ?", [campaignId]);
  }

  private nextSlug(campaignId: string, name: string): string {
    const base = slugify(name) || "character";
    let candidate = base;
    let suffix = 2;
    while (
      this.database
        .query<{ id: string }, [string, string]>(
          "select id from characters where campaign_id = ? and slug = ?",
        )
        .get(campaignId, candidate)
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
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

  private listRoster(whereClause: string, parameters: [string]): CharacterRosterItem[] {
    return this.database
      .query<CharacterRosterRow, [string]>(
        `select characters.id,
          characters.slug,
          characters.owner_user_id,
          owners.display_name as owner_display_name,
          characters.campaign_id,
          campaigns.slug as campaign_slug,
          campaigns.name as campaign_name,
          characters.name,
          characters.species,
          characters.background,
          characters.level,
          (
            select group_concat(class_name || ' ' || level, ', ')
            from character_classes
            where character_classes.character_id = characters.id
            order by class_name
          ) as class_summary,
          factions.id as faction_id,
          factions.name as faction_name
         from characters
         inner join users owners on owners.id = characters.owner_user_id
         inner join campaigns on campaigns.id = characters.campaign_id
         left join character_faction_choices faction_choices
           on faction_choices.character_id = characters.id
         left join campaign_factions factions
           on factions.id = faction_choices.faction_id
         ${whereClause}
         order by campaigns.name, owners.display_name, characters.name`,
      )
      .all(...parameters)
      .map((row) => ({
        background: row.background,
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        campaignSlug: row.campaign_slug,
        classSummary: row.class_summary ?? "",
        factionId: row.faction_id,
        factionName: row.faction_name,
        id: row.id,
        level: row.level,
        name: row.name,
        ownerDisplayName: row.owner_display_name,
        ownerUserId: row.owner_user_id,
        slug: row.slug,
        species: row.species,
      }));
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

  updateSheetSummary(
    characterId: string,
    patch: {
      background: string;
      className: string;
      hitPointMax: number;
      initiative: number;
      level: number;
      name: string;
      proficiencyBonus: number;
      speedFeet: number;
      species: string;
      subclassName: string | null;
    },
  ): CharacterSheetReadModel | null {
    const current = this.getSheetById(characterId);
    if (!current) return null;

    const level = Math.max(1, Math.floor(patch.level));
    const hitPointMax = Math.max(1, Math.floor(patch.hitPointMax));
    const proficiencyBonus = Math.max(0, Math.floor(patch.proficiencyBonus));
    const currentHitPoints = Math.min(current.hitPoints.current, hitPointMax);

    const update = this.database.transaction(() => {
      this.database.run(
        `update characters
         set name = ?, species = ?, background = ?, level = ?, proficiency_bonus = ?,
           initiative = ?, speed_ft = ?, hit_point_max = ?,
           hit_point_current = ?
         where id = ?`,
        [
          patch.name.trim(),
          patch.species.trim(),
          patch.background.trim(),
          level,
          proficiencyBonus,
          Math.floor(patch.initiative),
          Math.max(0, Math.floor(patch.speedFeet)),
          hitPointMax,
          currentHitPoints,
          characterId,
        ],
      );
      this.database.run(
        `update character_resources
         set max_value = ?, current_value = ?
         where character_id = ? and resource_type = 'hit_points'`,
        [hitPointMax, currentHitPoints, characterId],
      );
      this.database.run(
        `update character_classes
         set class_name = ?, subclass_name = ?, level = ?
         where id = (
           select id from character_classes where character_id = ? order by class_name limit 1
         )`,
        [patch.className.trim(), patch.subclassName?.trim() || null, level, characterId],
      );
      this.recalculateDerivedStats(characterId, proficiencyBonus);
    });

    update();

    return this.getSheetById(characterId);
  }

  updateAbility(
    characterId: string,
    ability: AbilityName,
    patch: { saveProficient: boolean; score: number },
  ): CharacterSheetReadModel | null {
    const sheet = this.getSheetById(characterId);
    if (!sheet) return null;

    const score = Math.max(1, Math.min(30, Math.floor(patch.score)));
    const modifier = abilityModifier(score);
    const saveModifier = savingThrowModifier({
      modifier,
      proficiencyBonus: sheet.proficiencyBonus,
      proficient: patch.saveProficient,
    });

    this.database.run(
      `update character_abilities
       set score = ?, modifier = ?, save_proficient = ?, save_modifier = ?
       where character_id = ? and ability = ?`,
      [score, modifier, patch.saveProficient ? 1 : 0, saveModifier, characterId, ability],
    );
    this.recalculateSkillsForAbility(characterId, ability, modifier, sheet.proficiencyBonus);

    return this.getSheetById(characterId);
  }

  updateSkill(
    characterId: string,
    skill: string,
    patch: { proficiencyLevel: number },
  ): CharacterSheetReadModel | null {
    const sheet = this.getSheetById(characterId);
    if (!sheet) return null;

    const currentSkill = sheet.skills.find((candidate) => candidate.skill === skill);
    if (!currentSkill) return null;

    const ability = sheet.abilities.find((candidate) => candidate.ability === currentSkill.ability);
    if (!ability) return null;

    const proficiencyLevel = Math.max(0, Math.min(2, Math.floor(patch.proficiencyLevel)));
    this.database.run(
      `update character_skills
       set proficiency_level = ?, modifier = ?
       where character_id = ? and skill = ?`,
      [
        proficiencyLevel,
        skillModifier({
          modifier: ability.modifier,
          proficiencyBonus: sheet.proficiencyBonus,
          proficiencyLevel,
        }),
        characterId,
        skill,
      ],
    );

    return this.getSheetById(characterId);
  }

  updateSense(
    characterId: string,
    senseId: string,
    patch: { label: string; value: string },
  ): CharacterSense | null {
    this.database.run(
      "update character_senses set label = ?, value = ? where character_id = ? and id = ?",
      [patch.label.trim(), patch.value.trim(), characterId, senseId],
    );

    return this.listSenses(characterId).find((sense) => sense.id === senseId) ?? null;
  }

  updateArmourClassSource(
    characterId: string,
    sourceId: string,
    patch: { label: string; notes: string; value: number },
  ): CharacterSheetReadModel | null {
    const existing = this.listArmourClassBreakdown(characterId).find((source) => source.id === sourceId);
    if (!existing) return null;

    this.database.run(
      `update character_armour_class_sources
       set label = ?, value = ?, notes = ?
       where character_id = ? and id = ?`,
      [patch.label.trim(), Math.floor(patch.value), patch.notes.trim(), characterId, sourceId],
    );
    const total = armourClassTotal(this.listArmourClassBreakdown(characterId));
    this.database.run("update characters set armour_class = ? where id = ?", [total, characterId]);

    return this.getSheetById(characterId);
  }

  updateDefence(
    characterId: string,
    defenceId: string,
    patch: { detail: string; label: string },
  ): CharacterDefence | null {
    this.database.run(
      "update character_defences set label = ?, detail = ? where character_id = ? and id = ?",
      [patch.label.trim(), patch.detail.trim(), characterId, defenceId],
    );

    return this.listDefences(characterId).find((defence) => defence.id === defenceId) ?? null;
  }

  updateProficiency(
    characterId: string,
    proficiencyId: string,
    patch: { detail: string; name: string },
  ): CharacterProficiency | null {
    this.database.run(
      "update character_proficiencies set name = ?, detail = ? where character_id = ? and id = ?",
      [patch.name.trim(), patch.detail.trim(), characterId, proficiencyId],
    );

    return this.listProficiencies(characterId).find((proficiency) => proficiency.id === proficiencyId) ?? null;
  }

  updateBackgroundEntry(
    characterId: string,
    entryId: string,
    patch: { body: string; title: string },
  ): CharacterBackgroundEntry | null {
    this.database.run(
      "update character_background_entries set title = ?, body = ? where character_id = ? and id = ?",
      [patch.title.trim(), patch.body.trim(), characterId, entryId],
    );

    return this.listBackgroundEntries(characterId).find((entry) => entry.id === entryId) ?? null;
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
    patch: { category?: string; equipped?: boolean; name?: string; notes?: string; quantity?: number },
  ): CharacterEquipment | null {
    const equipment = this.getEquipment(characterId, equipmentId);
    if (!equipment) return null;

    const nextQuantity =
      patch.quantity === undefined ? equipment.quantity : Math.max(0, patch.quantity);
    const nextEquipped = patch.equipped === undefined ? equipment.equipped : patch.equipped;
    const nextName = patch.name === undefined ? equipment.name : patch.name.trim();
    const nextCategory = patch.category === undefined ? equipment.category : patch.category.trim();
    const nextNotes = patch.notes === undefined ? equipment.notes : patch.notes.trim();

    this.database.run(
      `update character_equipment
       set name = ?, category = ?, quantity = ?, equipped = ?, notes = ?
       where character_id = ? and id = ?`,
      [nextName, nextCategory, nextQuantity, nextEquipped ? 1 : 0, nextNotes, characterId, equipmentId],
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
        `select id, label, value, notes
         from character_armour_class_sources
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map((row) => ({
        id: row.id,
        label: row.label,
        notes: row.notes,
        value: row.value,
      }));
  }

  private listDefences(characterId: string): CharacterDefence[] {
    return this.database
      .query<CharacterDefenceRow, [string]>(
        `select id, defence_type, label, detail
         from character_defences
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map((row) => ({
        detail: row.detail,
        id: row.id,
        label: row.label,
        type: row.defence_type,
      }));
  }

  private listProficiencies(characterId: string): CharacterProficiency[] {
    return this.database
      .query<CharacterProficiencyRow, [string]>(
        `select id, category, name, detail
         from character_proficiencies
         where character_id = ?
         order by sort_order, name`,
      )
      .all(characterId)
      .map((row) => ({
        category: row.category,
        detail: row.detail,
        id: row.id,
        name: row.name,
      }));
  }

  private listSenses(characterId: string): CharacterSense[] {
    return this.database
      .query<CharacterSenseRow, [string]>(
        `select id, label, value
         from character_senses
         where character_id = ?
         order by sort_order, label`,
      )
      .all(characterId)
      .map((row) => ({
        id: row.id,
        label: row.label,
        value: row.value,
      }));
  }

  private recalculateDerivedStats(characterId: string, proficiencyBonus: number) {
    for (const ability of this.listAbilities(characterId)) {
      this.database.run(
        "update character_abilities set save_modifier = ? where character_id = ? and ability = ?",
        [
          savingThrowModifier({
            modifier: ability.modifier,
            proficiencyBonus,
            proficient: ability.saveProficient,
          }),
          characterId,
          ability.ability,
        ],
      );
      this.recalculateSkillsForAbility(characterId, ability.ability, ability.modifier, proficiencyBonus);
    }
  }

  private recalculateSkillsForAbility(
    characterId: string,
    ability: AbilityName,
    modifier: number,
    proficiencyBonus: number,
  ) {
    const skills = this.listSkills(characterId).filter((skill) => skill.ability === ability);
    for (const skill of skills) {
      this.database.run(
        "update character_skills set modifier = ? where character_id = ? and skill = ?",
        [
          skillModifier({
            modifier,
            proficiencyBonus,
            proficiencyLevel: skill.proficiencyLevel,
          }),
          characterId,
          skill.skill,
        ],
      );
    }
  }
}

class SqliteNotesRepository implements NotesRepository {
  constructor(private readonly database: Database) {}

  createNote(input: {
    authorUserId: string;
    body: string;
    characterId: string;
    title: string;
    visibility: CharacterNote["visibility"];
  }): CharacterNote {
    const id = `note_${randomUUID()}`;
    this.database
      .query<never, [string, string, string, string, string, string]>(
        `insert into character_notes (id, character_id, author_user_id, visibility, title, body)
         values (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.characterId, input.authorUserId, input.visibility, input.title, input.body);

    const row = this.database
      .query<CharacterNoteRow, [string, string]>(
        `select id, author_user_id, title, body, visibility, created_at, updated_at
         from character_notes
         where character_id = ? and id = ?`,
      )
      .get(input.characterId, id);
    if (!row) throw new Error(`Created note ${id} could not be read.`);

    return toCharacterNote(row);
  }

  deleteNote(characterId: string, noteId: string, viewerRole: UserRole): boolean {
    const result = this.database
      .query<never, [string, string, UserRole]>(
        `delete from character_notes
         where character_id = ?
           and id = ?
           and (? != 'player' or visibility = 'player')`,
      )
      .run(characterId, noteId, viewerRole);

    return result.changes > 0;
  }

  listNotesForCharacter(characterId: string, viewerRole: UserRole): CharacterNote[] {
    const rows = this.database
      .query<CharacterNoteRow, [string, UserRole]>(
        `select id, author_user_id, title, body, visibility, created_at, updated_at
         from character_notes
         where character_id = ?
           and (? != 'player' or visibility = 'player')
         order by created_at, case visibility when 'player' then 1 else 2 end, title`,
      )
      .all(characterId, viewerRole);

    return rows.map(toCharacterNote);
  }

  updateNote(
    characterId: string,
    noteId: string,
    viewerRole: UserRole,
    patch: { body: string; title: string },
  ): CharacterNote | null {
    this.database
      .query<never, [string, string, string, string, UserRole]>(
        `update character_notes
         set title = ?, body = ?, updated_at = CURRENT_TIMESTAMP
         where character_id = ?
           and id = ?
           and (? != 'player' or visibility = 'player')`,
      )
      .run(patch.title, patch.body, characterId, noteId, viewerRole);

    const row = this.database
      .query<CharacterNoteRow, [string, string, UserRole]>(
        `select id, author_user_id, title, body, visibility, created_at, updated_at
         from character_notes
         where character_id = ?
           and id = ?
           and (? != 'player' or visibility = 'player')`,
      )
      .get(characterId, noteId, viewerRole);

    return row ? toCharacterNote(row) : null;
  }

  updateNoteBody(
    characterId: string,
    noteId: string,
    viewerRole: UserRole,
    body: string,
  ): CharacterNote | null {
    const row = this.database
      .query<CharacterNoteRow, [string, string, UserRole]>(
        `select id, author_user_id, title, body, visibility, created_at, updated_at
         from character_notes
         where character_id = ?
           and id = ?
           and (? != 'player' or visibility = 'player')`,
      )
      .get(characterId, noteId, viewerRole);
    if (!row) return null;

    return this.updateNote(characterId, noteId, viewerRole, { body, title: row.title });
  }
}

class SqliteCampaignContentRepository implements CampaignContentRepository {
  constructor(private readonly database: Database) {}

  createNpcDossier(input: {
    campaignId: string;
    gmNotes: string;
    hooks: string;
    motivations: string;
    name: string;
    portraitImageAssetId: string | null;
    publicSummary: string;
    publicWikiPageId: string | null;
    revealNotes: string;
    rulesEntityId: string | null;
    sceneNotes: string;
    secrets: string;
    selectedPlayerIds: string[];
    visibility: NpcVisibility;
  }): CampaignNpcDossier {
    if (!this.npcLinksBelongToCampaign(input.campaignId, {
      portraitImageAssetId: input.portraitImageAssetId,
      publicWikiPageId: input.publicWikiPageId,
      rulesEntityId: input.rulesEntityId,
    })) {
      throw new Error("NPC links must belong to the same campaign or a public rules source.");
    }

    const id = `campaign_npc_${randomUUID()}`;
    const slug = uniqueCampaignNpcSlug(this.database, input.campaignId, input.name);
    this.database
      .query<never, [
        string,
        string,
        string,
        string,
        NpcVisibility,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
      ]>(
        `insert into campaign_npcs (
          id, campaign_id, slug, name, visibility, public_summary, gm_notes, secrets,
          motivations, hooks, scene_notes, reveal_notes, portrait_image_asset_id,
          public_wiki_page_id, rules_entity_id
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.campaignId,
        slug,
        input.name,
        input.visibility,
        input.publicSummary,
        input.gmNotes,
        input.secrets,
        input.motivations,
        input.hooks,
        input.sceneNotes,
        input.revealNotes,
        input.portraitImageAssetId,
        input.publicWikiPageId,
        input.rulesEntityId,
      );
    this.replaceNpcSelectedPlayers(input.campaignId, id, input.selectedPlayerIds);

    const npc = this.getNpcDossierById(input.campaignId, id);
    if (!npc) throw new Error(`Created NPC dossier ${id} could not be read.`);

    return npc;
  }

  createImageAsset(input: {
    altText: string;
    byteSize: number;
    campaignId: string;
    caption: string;
    height: number | null;
    mimeType: string;
    storageKey: string;
    title: string;
    visibility: CampaignContentVisibility;
    width: number | null;
  }): CampaignImageAsset {
    const id = `campaign_image_asset_${randomUUID()}`;
    this.database
      .query<never, [string, string, string, string, string, number, number | null, number | null, string, string, CampaignContentVisibility]>(
        `insert into campaign_image_assets (
          id, campaign_id, title, storage_key, mime_type, byte_size, width, height, alt_text, caption, visibility
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.campaignId,
        input.title,
        input.storageKey,
        input.mimeType,
        input.byteSize,
        input.width,
        input.height,
        input.altText,
        input.caption,
        input.visibility,
      );

    const asset = this.getImageAssetById(input.campaignId, id, "game_master");
    if (!asset) throw new Error(`Created image asset ${id} could not be read.`);

    return asset;
  }

  createWikiPage(input: {
    bodyMarkdown: string;
    campaignId: string;
    coverImageAssetId: string | null;
    pageType: WikiPageType;
    sourcePath: string | null;
    sourceTitle: string | null;
    tags: string[];
    title: string;
    visibility: CampaignContentVisibility;
  }): CampaignWikiPage {
    const id = `campaign_wiki_${randomUUID()}`;
    const slug = uniqueCampaignWikiSlug(this.database, input.campaignId, input.title);
    this.database
      .query<never, [string, string, string, string, WikiPageType, string, CampaignContentVisibility, string, string | null, string | null, string | null]>(
        `insert into campaign_wiki_pages (
          id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown,
          cover_image_asset_id, source_title, source_path
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.campaignId,
        slug,
        input.title,
        input.pageType,
        JSON.stringify(input.tags),
        input.visibility,
        input.bodyMarkdown,
        input.coverImageAssetId,
        input.sourceTitle,
        input.sourcePath,
      );

    const page = this.getWikiPageBySlug(input.campaignId, slug, "game_master");
    if (!page) throw new Error(`Created wiki page ${id} could not be read.`);

    return page;
  }

  createSession(input: {
    body: string;
    campaignId: string;
    createdByUserId: string;
    sessionDate: string | null;
    summary: string;
    title: string;
    visibility: CampaignContentVisibility;
  }): CampaignSessionRecord {
    const id = `campaign_session_${randomUUID()}`;
    const slug = uniqueCampaignSessionSlug(this.database, input.campaignId, input.title);
    this.database
      .query<never, [string, string, string, string, string | null, string, string, string, string]>(
        `insert into campaign_sessions (
          id, campaign_id, slug, title, session_date, summary, body, visibility, created_by_user_id
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.campaignId,
        slug,
        input.title,
        input.sessionDate,
        input.summary,
        input.body,
        input.visibility,
        input.createdByUserId,
      );

    const row = this.getSessionRowById(input.campaignId, id);
    if (!row) throw new Error(`Created campaign session ${id} could not be read.`);

    return toCampaignSessionRecord(row);
  }

  deleteSession(campaignId: string, sessionId: string): boolean {
    const result = this.database
      .query<never, [string, string]>(
        "delete from campaign_sessions where campaign_id = ? and id = ?",
      )
      .run(campaignId, sessionId);

    return result.changes > 0;
  }

  listWikiPagesForCampaign(campaignId: string, viewerRole: UserRole): CampaignWikiPage[] {
    return this.database
      .query<CampaignWikiPageRow, [string, number]>(
        `select id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown,
          cover_image_asset_id, source_title, source_path
         from campaign_wiki_pages
         where campaign_id = ?
           and (? = 1 or visibility = 'player')
         order by case visibility when 'player' then 1 else 2 end, title`,
      )
      .all(campaignId, canSeeGameMasterContent(viewerRole))
      .map(toCampaignWikiPage);
  }

  getWikiPageBySlug(
    campaignId: string,
    slug: string,
    viewerRole: UserRole,
  ): CampaignWikiPage | null {
    const row = this.database
      .query<CampaignWikiPageRow, [string, string, number]>(
        `select id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown,
          cover_image_asset_id, source_title, source_path
         from campaign_wiki_pages
         where campaign_id = ?
           and slug = ?
           and (? = 1 or visibility = 'player')`,
      )
      .get(campaignId, slug, canSeeGameMasterContent(viewerRole));

    return row ? toCampaignWikiPage(row) : null;
  }

  listImageAssetsForCampaign(
    campaignId: string,
    viewerRole: UserRole,
  ): CampaignImageAsset[] {
    return this.database
      .query<CampaignImageAssetRow, [string, number]>(
        `select id, campaign_id, title, storage_key, mime_type, byte_size, width, height, alt_text,
          caption, visibility
         from campaign_image_assets
         where campaign_id = ?
           and (? = 1 or visibility = 'player')
         order by storage_key`,
      )
      .all(campaignId, canSeeGameMasterContent(viewerRole))
      .map(toCampaignImageAsset);
  }

  getImageAssetById(
    campaignId: string,
    assetId: string,
    viewerRole: UserRole,
  ): CampaignImageAsset | null {
    const row = this.database
      .query<CampaignImageAssetRow, [string, string, number]>(
        `select id, campaign_id, title, storage_key, mime_type, byte_size, width, height, alt_text,
          caption, visibility
         from campaign_image_assets
         where campaign_id = ?
           and id = ?
           and (? = 1 or visibility = 'player')`,
      )
      .get(campaignId, assetId, canSeeGameMasterContent(viewerRole));

    return row ? toCampaignImageAsset(row) : null;
  }

  listImageAssetsForWikiPage(
    campaignId: string,
    wikiPageId: string,
    attachmentType: "gallery" | "inline",
    viewerRole: UserRole,
  ): CampaignImageAsset[] {
    return this.database
      .query<CampaignImageAssetRow, [string, string, string, number]>(
        `select a.id, a.campaign_id, a.title, a.storage_key, a.mime_type, a.byte_size,
          a.width, a.height, a.alt_text, a.caption, a.visibility
         from campaign_wiki_page_assets wa
         join campaign_image_assets a on a.id = wa.image_asset_id
         where a.campaign_id = ?
           and wa.wiki_page_id = ?
           and wa.attachment_type = ?
           and (? = 1 or a.visibility = 'player')
         order by wa.sort_order, a.title`,
      )
      .all(campaignId, wikiPageId, attachmentType, canSeeGameMasterContent(viewerRole))
      .map(toCampaignImageAsset);
  }

  listSessionsForCampaign(
    campaignId: string,
    viewerRole: UserRole,
  ): CampaignSessionRecord[] {
    return this.database
      .query<CampaignSessionRecordRow, [string, number]>(
        `select id, campaign_id, slug, title, session_date, summary, body, visibility,
          created_by_user_id, created_at, updated_at
         from campaign_sessions
         where campaign_id = ?
           and (? = 1 or visibility = 'player')
         order by case visibility when 'player' then 1 else 2 end, session_date, title`,
      )
      .all(campaignId, canSeeGameMasterContent(viewerRole))
      .map(toCampaignSessionRecord);
  }

  getSessionBySlug(
    campaignId: string,
    slug: string,
    viewerRole: UserRole,
  ): CampaignSessionRecord | null {
    const row = this.database
      .query<CampaignSessionRecordRow, [string, string, number]>(
        `select id, campaign_id, slug, title, session_date, summary, body, visibility,
          created_by_user_id, created_at, updated_at
         from campaign_sessions
         where campaign_id = ?
           and slug = ?
           and (? = 1 or visibility = 'player')`,
      )
      .get(campaignId, slug, canSeeGameMasterContent(viewerRole));

    return row ? toCampaignSessionRecord(row) : null;
  }

  listNpcDossiersForCampaign(campaignId: string, viewerRole: UserRole): CampaignNpcDossier[] {
    if (!canSeeGameMasterContent(viewerRole)) return [];

    return this.database
      .query<CampaignNpcDossierRow, [string]>(
        `select id, campaign_id, slug, name, visibility, public_summary, gm_notes, secrets,
          motivations, hooks, scene_notes, reveal_notes, portrait_image_asset_id,
          public_wiki_page_id, rules_entity_id, created_at, updated_at,
          (select group_concat(user_id) from campaign_npc_player_access where npc_id = campaign_npcs.id) as selected_player_ids
         from campaign_npcs
         where campaign_id = ?
         order by case visibility when 'public' then 1 when 'selected' then 2 else 3 end, name`,
      )
      .all(campaignId)
      .map(toCampaignNpcDossier);
  }

  listNpcSummariesForCampaign(
    campaignId: string,
    viewerRole: UserRole,
    viewerUserId?: string,
  ): CampaignNpcSummary[] {
    const canSeePrivate = canSeeGameMasterContent(viewerRole);

    return this.database
      .query<CampaignNpcDossierRow, [number, number, string, number, string | null]>(
        `select npcs.id, npcs.campaign_id, npcs.slug, npcs.name, npcs.visibility,
          npcs.public_summary, npcs.gm_notes, npcs.secrets, npcs.motivations, npcs.hooks,
          npcs.scene_notes, npcs.reveal_notes,
          case when ? = 1 or portrait.visibility = 'player'
            then npcs.portrait_image_asset_id else null end as portrait_image_asset_id,
          case when ? = 1 or wiki.visibility = 'player'
            then npcs.public_wiki_page_id else null end as public_wiki_page_id,
          npcs.rules_entity_id, npcs.created_at, npcs.updated_at,
          null as selected_player_ids
         from campaign_npcs npcs
         left join campaign_image_assets portrait on portrait.id = npcs.portrait_image_asset_id
         left join campaign_wiki_pages wiki on wiki.id = npcs.public_wiki_page_id
         where npcs.campaign_id = ?
           and (
             ? = 1
             or npcs.visibility = 'public'
             or (
               npcs.visibility = 'selected'
               and exists (
                 select 1 from campaign_npc_player_access access
                 where access.npc_id = npcs.id and access.user_id = ?
               )
             )
           )
         order by case npcs.visibility when 'public' then 1 when 'selected' then 2 else 3 end, npcs.name`,
      )
      .all(canSeePrivate, canSeePrivate, campaignId, canSeePrivate, viewerUserId ?? null)
      .map(toCampaignNpcSummary);
  }

  getNpcDossierBySlug(campaignId: string, slug: string, viewerRole: UserRole): CampaignNpcDossier | null {
    if (!canSeeGameMasterContent(viewerRole)) return null;

    const row = this.database
      .query<CampaignNpcDossierRow, [string, string]>(
        `select id, campaign_id, slug, name, visibility, public_summary, gm_notes, secrets,
          motivations, hooks, scene_notes, reveal_notes, portrait_image_asset_id,
          public_wiki_page_id, rules_entity_id, created_at, updated_at,
          (select group_concat(user_id) from campaign_npc_player_access where npc_id = campaign_npcs.id) as selected_player_ids
         from campaign_npcs
         where campaign_id = ? and slug = ?`,
      )
      .get(campaignId, slug);

    return row ? toCampaignNpcDossier(row) : null;
  }

  getNpcSummaryBySlug(
    campaignId: string,
    slug: string,
    viewerRole: UserRole,
    viewerUserId?: string,
  ): CampaignNpcSummary | null {
    const canSeePrivate = canSeeGameMasterContent(viewerRole);
    const row = this.database
      .query<CampaignNpcDossierRow, [number, number, string, string, number, string | null]>(
        `select npcs.id, npcs.campaign_id, npcs.slug, npcs.name, npcs.visibility,
          npcs.public_summary, npcs.gm_notes, npcs.secrets, npcs.motivations, npcs.hooks,
          npcs.scene_notes, npcs.reveal_notes,
          case when ? = 1 or portrait.visibility = 'player'
            then npcs.portrait_image_asset_id else null end as portrait_image_asset_id,
          case when ? = 1 or wiki.visibility = 'player'
            then npcs.public_wiki_page_id else null end as public_wiki_page_id,
          npcs.rules_entity_id, npcs.created_at, npcs.updated_at,
          null as selected_player_ids
         from campaign_npcs npcs
         left join campaign_image_assets portrait on portrait.id = npcs.portrait_image_asset_id
         left join campaign_wiki_pages wiki on wiki.id = npcs.public_wiki_page_id
         where npcs.campaign_id = ?
           and npcs.slug = ?
           and (
             ? = 1
             or npcs.visibility = 'public'
             or (
               npcs.visibility = 'selected'
               and exists (
                 select 1 from campaign_npc_player_access access
                 where access.npc_id = npcs.id and access.user_id = ?
               )
             )
           )`,
      )
      .get(canSeePrivate, canSeePrivate, campaignId, slug, canSeePrivate, viewerUserId ?? null);

    return row ? toCampaignNpcSummary(row) : null;
  }

  updateSession(
    campaignId: string,
    sessionId: string,
    patch: {
      body: string;
      sessionDate: string | null;
      summary: string;
      title: string;
      visibility: CampaignContentVisibility;
    },
  ): CampaignSessionRecord | null {
    this.database
      .query<never, [string, string | null, string, string, CampaignContentVisibility, string, string]>(
        `update campaign_sessions
         set title = ?, session_date = ?, summary = ?, body = ?, visibility = ?,
           updated_at = CURRENT_TIMESTAMP
         where campaign_id = ? and id = ?`,
      )
      .run(
        patch.title,
        patch.sessionDate,
        patch.summary,
        patch.body,
        patch.visibility,
        campaignId,
        sessionId,
      );

    const row = this.getSessionRowById(campaignId, sessionId);

    return row ? toCampaignSessionRecord(row) : null;
  }

  private getSessionRowById(campaignId: string, sessionId: string) {
    return this.database
      .query<CampaignSessionRecordRow, [string, string]>(
        `select id, campaign_id, slug, title, session_date, summary, body, visibility,
          created_by_user_id, created_at, updated_at
         from campaign_sessions
         where campaign_id = ? and id = ?`,
      )
      .get(campaignId, sessionId);
  }

  updateNpcDossier(
    campaignId: string,
    npcId: string,
    patch: {
      gmNotes: string;
      hooks: string;
      motivations: string;
      name: string;
      portraitImageAssetId: string | null;
      publicSummary: string;
      publicWikiPageId: string | null;
      revealNotes: string;
      rulesEntityId: string | null;
      sceneNotes: string;
      secrets: string;
      selectedPlayerIds: string[];
      visibility: NpcVisibility;
    },
  ): CampaignNpcDossier | null {
    if (!this.npcLinksBelongToCampaign(campaignId, {
      portraitImageAssetId: patch.portraitImageAssetId,
      publicWikiPageId: patch.publicWikiPageId,
      rulesEntityId: patch.rulesEntityId,
    })) {
      return null;
    }

    this.database
      .query<never, [
        string,
        NpcVisibility,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
        string,
        string,
      ]>(
        `update campaign_npcs
         set name = ?, visibility = ?, public_summary = ?, gm_notes = ?, secrets = ?,
           motivations = ?, hooks = ?, scene_notes = ?, reveal_notes = ?,
           portrait_image_asset_id = ?, public_wiki_page_id = ?, rules_entity_id = ?,
           updated_at = CURRENT_TIMESTAMP
         where campaign_id = ? and id = ?`,
      )
      .run(
        patch.name,
        patch.visibility,
        patch.publicSummary,
        patch.gmNotes,
        patch.secrets,
        patch.motivations,
        patch.hooks,
        patch.sceneNotes,
        patch.revealNotes,
        patch.portraitImageAssetId,
        patch.publicWikiPageId,
        patch.rulesEntityId,
        campaignId,
        npcId,
      );
    this.replaceNpcSelectedPlayers(campaignId, npcId, patch.selectedPlayerIds);

    return this.getNpcDossierById(campaignId, npcId);
  }

  revealNpcDossier(
    campaignId: string,
    npcId: string,
    visibility: NpcVisibility,
  ): CampaignNpcDossier | null {
    this.database
      .query<never, [NpcVisibility, string, string]>(
        `update campaign_npcs
         set visibility = ?, updated_at = CURRENT_TIMESTAMP
         where campaign_id = ? and id = ?`,
      )
      .run(visibility, campaignId, npcId);

    return this.getNpcDossierById(campaignId, npcId);
  }

  private getNpcDossierById(campaignId: string, npcId: string) {
    const row = this.database
      .query<CampaignNpcDossierRow, [string, string]>(
        `select id, campaign_id, slug, name, visibility, public_summary, gm_notes, secrets,
          motivations, hooks, scene_notes, reveal_notes, portrait_image_asset_id,
          public_wiki_page_id, rules_entity_id, created_at, updated_at,
          (select group_concat(user_id) from campaign_npc_player_access where npc_id = campaign_npcs.id) as selected_player_ids
         from campaign_npcs
         where campaign_id = ? and id = ?`,
      )
      .get(campaignId, npcId);

    return row ? toCampaignNpcDossier(row) : null;
  }

  private replaceNpcSelectedPlayers(campaignId: string, npcId: string, selectedPlayerIds: string[]) {
    this.database
      .query<never, [string]>("delete from campaign_npc_player_access where npc_id = ?")
      .run(npcId);

    const uniquePlayerIds = Array.from(new Set(selectedPlayerIds)).filter((userId) =>
      this.database
        .query<{ id: string }, [string, string]>(
          `select users.id
           from users
           join campaign_members members on members.user_id = users.id
           where members.campaign_id = ? and members.role = 'player' and users.id = ?`,
        )
        .get(campaignId, userId),
    );
    for (const userId of uniquePlayerIds) {
      this.database
        .query<never, [string, string]>(
          "insert or ignore into campaign_npc_player_access (npc_id, user_id) values (?, ?)",
        )
        .run(npcId, userId);
    }
  }

  private npcLinksBelongToCampaign(
    campaignId: string,
    links: {
      portraitImageAssetId: string | null;
      publicWikiPageId: string | null;
      rulesEntityId: string | null;
    },
  ) {
    if (links.portraitImageAssetId) {
      const asset = this.database
        .query<{ id: string }, [string, string]>(
          "select id from campaign_image_assets where id = ? and campaign_id = ?",
        )
        .get(links.portraitImageAssetId, campaignId);
      if (!asset) return false;
    }

    if (links.publicWikiPageId) {
      const page = this.database
        .query<{ id: string }, [string, string]>(
          "select id from campaign_wiki_pages where id = ? and campaign_id = ?",
        )
        .get(links.publicWikiPageId, campaignId);
      if (!page) return false;
    }

    if (links.rulesEntityId) {
      const entity = this.database
        .query<{ id: string }, [string, string]>(
          `select entities.id
           from rules_entities entities
           join rules_sources sources on sources.id = entities.source_id
           left join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
           where entities.id = ?
             and (sources.visibility = 'public' or campaign_sources.campaign_id = ?)`,
        )
        .get(links.rulesEntityId, campaignId);
      if (!entity) return false;
    }

    return true;
  }

  listFactionsForCampaign(campaignId: string): CampaignFaction[] {
    return this.database
      .query<CampaignFactionRow, [string]>(
        `select factions.id, factions.campaign_id, factions.slug, factions.name, factions.motto,
          factions.summary, factions.public_reputation, factions.player_prompt,
          factions.connections_json, factions.rumours_json, factions.image_asset_id,
          wiki.slug as wiki_page_slug, wiki.title as wiki_page_title
         from campaign_factions factions
         left join campaign_wiki_pages wiki on wiki.id = factions.wiki_page_id
         where factions.campaign_id = ?
         order by factions.sort_order, factions.name`,
      )
      .all(campaignId)
      .map(toCampaignFaction);
  }

  getCharacterFactionChoice(characterId: string): CharacterFactionChoice | null {
    const row = this.database
      .query<CharacterFactionChoiceRow, [string]>(
        `select choices.character_id,
          choices.faction_id,
          choices.connection_note,
          factions.slug as faction_slug,
          factions.name as faction_name
         from character_faction_choices choices
         left join campaign_factions factions on factions.id = choices.faction_id
         where choices.character_id = ?`,
      )
      .get(characterId);

    return row
      ? {
          characterId: row.character_id,
          connectionNote: row.connection_note,
          factionId: row.faction_id,
          factionName: row.faction_name,
          factionSlug: row.faction_slug,
        }
      : null;
  }

  updateCharacterFactionChoice(
    characterId: string,
    factionId: string | null,
    connectionNote: string,
  ): CharacterFactionChoice | null {
    if (!this.database.query<{ id: string }, [string]>("select id from characters where id = ?").get(characterId)) {
      return null;
    }

    if (factionId !== null) {
      const faction = this.database
        .query<{ id: string }, [string]>("select id from campaign_factions where id = ?")
        .get(factionId);
      if (!faction) return null;
    }

    try {
      this.database
        .query<never, [string, string | null, string]>(
          `insert into character_faction_choices (character_id, faction_id, connection_note)
           values (?, ?, ?)
           on conflict(character_id) do update set
             faction_id = excluded.faction_id,
             connection_note = excluded.connection_note,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .run(characterId, factionId, connectionNote);
    } catch (error) {
      if (error instanceof Error && error.message.includes("character and faction must belong")) {
        return null;
      }
      throw error;
    }

    return this.getCharacterFactionChoice(characterId);
  }
}

class SqliteCampaignRepository implements CampaignRepository {
  constructor(private readonly database: Database) {}

  getCampaignById(id: string): CampaignSummary | null {
    const row = this.database
      .query<CampaignRow, [string]>("select id, slug, name, gm_user_id from campaigns where id = ?")
      .get(id);

    return row ? toCampaignSummary(row) : null;
  }

  getCampaignBySlug(slug: string): CampaignSummary | null {
    const row = this.database
      .query<CampaignRow, [string]>(
        "select id, slug, name, gm_user_id from campaigns where slug = ?",
      )
      .get(slug);

    return row ? toCampaignSummary(row) : null;
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

  getRuleDetail(entityType: RuleEntityType, slug: string, filters: RuleAccessFilters = {}): RuleDetail | null {
    const rows = this.ruleRows(filters).filter((row) => row.entity_type === entityType && row.slug === slug);
    const summary = rows[0] ? toRuleSummary(rows[0]) : null;
    if (!summary) return null;

    const mechanics = rows
      .filter((row) => row.mechanic_type && row.data_json)
      .map((row) => ({
        data: parseRuleData(row.data_json ?? "{}"),
        mechanicType: row.mechanic_type ?? summary.entityType,
      }));

    const provenance = mechanics
      .map((mechanic) => mechanic.data.provenance)
      .find((candidate): candidate is NonNullable<RuleDetail["provenance"]> =>
        Boolean(candidate && typeof candidate === "object"),
      ) ?? null;

    return {
      ...summary,
      mechanics,
      provenance,
    };
  }

  listRuleEntityTypes(filters: RuleAccessFilters = {}): RuleEntityTypeCount[] {
    const { clause, values } = ruleAccessWhereClause(filters);

    return this.database
      .query<RuleEntityTypeCountRow, Array<RulesContentCategory | string>>(
        `select entity_type, count(distinct rules_entities.id) as count
         from rules_entities
         inner join rules_sources sources on sources.id = rules_entities.source_id
         left join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
         ${clause}
         group by entity_type
         order by entity_type`,
      )
      .all(...values)
      .map((row) => ({
        count: row.count,
        entityType: row.entity_type,
      }));
  }

  listRuleLinksForCharacter(characterId: string): CharacterRuleLink[] {
    return this.database
      .query<RuleLinkRow, [string]>(
        `select entities.name as entity_name,
          entities.slug as entity_slug,
          entities.entity_type,
          links.prepared,
          links.selected,
          links.selection_type,
          sources.content_category,
          sources.name as source_name,
          sources.slug as source_slug,
          mechanics.data_json ->> '$.description' as description,
          mechanics.data_json ->> '$.actionTiming' as action_timing_json,
          mechanics.data_json ->> '$.resetCadence' as reset_cadence,
          mechanics.data_json ->> '$.charges' as charges
        from character_rule_links links
        inner join rules_entities entities on entities.id = links.rules_entity_id
        inner join rules_sources sources on sources.id = entities.source_id
        left join rule_mechanics mechanics on mechanics.id = (
          select id
          from rule_mechanics
          where rule_mechanics.rules_entity_id = entities.id
          order by id
          limit 1
        )
        where links.character_id = ?
        order by links.sort_order, entities.name`,
      )
      .all(characterId)
      .map((row) => ({
        actionTiming: parseStringArray(row.action_timing_json),
        charges: row.charges ?? "",
        contentCategory: row.content_category,
        description: row.description ?? "",
        entityName: row.entity_name,
        entitySlug: row.entity_slug,
        entityType: row.entity_type,
        prepared: row.prepared === 1,
        resetCadence: row.reset_cadence ?? "",
        selected: row.selected === 1,
        selectionType: row.selection_type,
        sourceName: row.source_name,
        sourceSlug: row.source_slug,
      }));
  }

  listRules(filters: RuleSearchFilters = {}): RuleSummary[] {
    const seen = new Set<string>();

    return this.ruleRows(filters)
      .map(toRuleSummary)
      .filter((rule) => {
        if (seen.has(rule.id)) return false;
        seen.add(rule.id);

        if (filters.entityType && rule.entityType !== filters.entityType) return false;
        if (filters.sourceSlug && rule.sourceSlug !== filters.sourceSlug) return false;
        if (filters.spellLevel !== undefined && !rule.tags.includes(`level-${filters.spellLevel}`)) {
          return false;
        }
        if (filters.equipmentCategory && !rule.tags.includes(slugForFilter(filters.equipmentCategory))) {
          return false;
        }
        if (filters.query) {
          const query = filters.query.toLowerCase();
          const haystack = `${rule.name} ${rule.description} ${rule.tags.join(" ")}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      });
  }

  listRuleSources(filters: RuleAccessFilters = {}): RulesSourceSummary[] {
    const { clause, values } = ruleAccessWhereClause(filters);

    return this.database
      .query<RuleSourceRow, Array<RulesContentCategory | string>>(
        `select sources.id,
          sources.slug,
          sources.name,
          sources.abbreviation,
          sources.content_category,
          sources.visibility,
          sources.public_export_eligible,
          sources.precedence,
          group_concat(distinct campaign_sources.campaign_id) as campaign_ids
        from rules_sources sources
        left join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
        ${clause}
        group by sources.id
        order by sources.visibility, sources.content_category, sources.name`,
      )
      .all(...values)
      .map(toRuleSourceSummary);
  }

  private ruleRows(filters: RuleAccessFilters = {}) {
    const { clause, values } = ruleAccessWhereClause(filters);

    return this.database
      .query<RuleSummaryRow, Array<RulesContentCategory | string>>(
        `select entities.id,
          entities.slug,
          entities.entity_type,
          entities.name,
          sources.slug as source_slug,
          sources.name as source_name,
          sources.abbreviation as source_abbreviation,
          sources.content_category,
          sources.visibility as source_visibility,
          sources.public_export_eligible,
          group_concat(distinct campaign_sources.campaign_id) as campaign_ids,
          mechanics.mechanic_type,
          mechanics.data_json
        from rules_entities entities
        inner join rules_sources sources on sources.id = entities.source_id
        left join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
        left join rule_mechanics mechanics on mechanics.rules_entity_id = entities.id
        ${clause}
        group by entities.id, mechanics.id
        order by entities.entity_type, entities.name, mechanics.id`,
      )
      .all(...values);
  }
}

function ruleAccessWhereClause(filters: RuleAccessFilters = {}) {
  const clauses: string[] = [];
  const values: Array<RulesContentCategory | string> = [];
  if (filters.contentCategory) {
    clauses.push("sources.content_category = ?");
    values.push(filters.contentCategory);
  }
  const campaignIds = filters.campaignIds?.filter(Boolean) ?? [];
  if (campaignIds.length > 0) {
    clauses.push(
      `(sources.visibility = 'public' or campaign_sources.campaign_id in (${campaignIds.map(() => "?").join(", ")}))`,
    );
    values.push(...campaignIds);
  } else {
    clauses.push("sources.visibility = 'public'");
  }

  return {
    clause: clauses.length ? `where ${clauses.join(" and ")}` : "",
    values,
  };
}

function parseCampaignIds(value: string | null) {
  return value ? value.split(",").filter(Boolean).sort() : [];
}

function toRuleSourceSummary(row: RuleSourceRow): RulesSourceSummary & { precedence: number } {
  return {
    abbreviation: row.abbreviation,
    campaignIds: parseCampaignIds(row.campaign_ids),
    contentCategory: row.content_category,
    id: row.id,
    name: row.name,
    precedence: row.precedence,
    publicExportEligible: row.public_export_eligible === 1,
    slug: row.slug,
    visibility: row.visibility,
  };
}

function toRuleSummary(row: RuleSummaryRow): RuleSummary {
  const data = parseRuleData(row.data_json ?? "{}");
  const tags = Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const description = typeof data.searchableText === "string"
    ? data.searchableText
    : typeof data.description === "string"
      ? data.description
      : "";

  return {
    campaignIds: parseCampaignIds(row.campaign_ids),
    contentCategory: row.content_category,
    description,
    entityType: row.entity_type,
    id: row.id,
    name: row.name,
    publicExportEligible: row.public_export_eligible === 1,
    slug: row.slug,
    sourceAbbreviation: row.source_abbreviation,
    sourceName: row.source_name,
    sourceSlug: row.source_slug,
    sourceVisibility: row.source_visibility,
    tags,
  };
}

function parseRuleData(dataJson: string): RuleMechanicReadModel["data"] {
  try {
    const data = JSON.parse(dataJson) as unknown;

    return data && typeof data === "object" && !Array.isArray(data)
      ? data as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function slugForFilter(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    const contentCategory = source.contentCategory ?? "third_party";
    const visibility = source.visibility ?? "public";
    const publicExportEligible = source.publicExportEligible ?? contentCategory === "srd";

    this.database.run(
      `insert into rules_sources (id, slug, name, abbreviation, content_category, visibility, public_export_eligible, precedence)
       values (?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(slug) do update set
         name = excluded.name,
         abbreviation = excluded.abbreviation,
         content_category = excluded.content_category,
         visibility = excluded.visibility,
         public_export_eligible = excluded.public_export_eligible,
         precedence = excluded.precedence`,
      [
        sourceId,
        source.slug,
        source.name,
        source.abbreviation,
        contentCategory,
        visibility,
        publicExportEligible ? 1 : 0,
        source.precedence,
      ],
    );
    for (const campaignId of source.campaignIds ?? []) {
      this.database.run(
        "insert or ignore into campaign_rules_sources (campaign_id, source_id) values (?, ?)",
        [campaignId, sourceId],
      );
    }

    const row = this.database
      .query<RuleSourceRow, [string]>(
        `select sources.id,
          sources.slug,
          sources.name,
          sources.abbreviation,
          sources.content_category,
          sources.visibility,
          sources.public_export_eligible,
          sources.precedence,
          group_concat(distinct campaign_sources.campaign_id) as campaign_ids
        from rules_sources sources
        left join campaign_rules_sources campaign_sources on campaign_sources.source_id = sources.id
        where sources.slug = ?
        group by sources.id`,
      )
      .get(source.slug);

    if (!row) throw new Error(`Could not upsert rules source ${source.slug}`);

    return toRuleSourceSummary(row);
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

function toCharacterNote(row: CharacterNoteRow): CharacterNote {
  return {
    authorUserId: row.author_user_id,
    body: row.body,
    createdAt: row.created_at,
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    visibility: row.visibility,
  };
}

function toCampaignSummary(row: CampaignRow): CampaignSummary {
  return {
    gmUserId: row.gm_user_id,
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

function toCampaignWikiPage(row: CampaignWikiPageRow): CampaignWikiPage {
  return {
    bodyMarkdown: row.body_markdown,
    campaignId: row.campaign_id,
    coverImageAssetId: row.cover_image_asset_id,
    id: row.id,
    pageType: row.page_type,
    slug: row.slug,
    sourcePath: row.source_path,
    sourceTitle: row.source_title,
    tags: parseStringArray(row.tags_json),
    title: row.title,
    visibility: row.visibility,
  };
}

function toCampaignImageAsset(row: CampaignImageAssetRow): CampaignImageAsset {
  return {
    altText: row.alt_text,
    byteSize: row.byte_size,
    campaignId: row.campaign_id,
    caption: row.caption,
    height: row.height,
    id: row.id,
    mimeType: row.mime_type,
    storageKey: row.storage_key,
    title: row.title || row.alt_text,
    visibility: row.visibility,
    width: row.width,
  };
}

function toCampaignSessionRecord(row: CampaignSessionRecordRow): CampaignSessionRecord {
  return {
    body: row.body,
    campaignId: row.campaign_id,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id,
    id: row.id,
    sessionDate: row.session_date,
    slug: row.slug,
    summary: row.summary,
    title: row.title,
    updatedAt: row.updated_at,
    visibility: row.visibility,
  };
}

function toCampaignNpcDossier(row: CampaignNpcDossierRow): CampaignNpcDossier {
  return {
    campaignId: row.campaign_id,
    createdAt: row.created_at,
    gmNotes: row.gm_notes,
    hooks: row.hooks,
    id: row.id,
    motivations: row.motivations,
    name: row.name,
    portraitImageAssetId: row.portrait_image_asset_id,
    publicSummary: row.public_summary,
    publicWikiPageId: row.public_wiki_page_id,
    revealNotes: row.reveal_notes,
    rulesEntityId: row.rules_entity_id,
    sceneNotes: row.scene_notes,
    secrets: row.secrets,
    selectedPlayerIds: parseSelectedPlayerIds(row.selected_player_ids),
    slug: row.slug,
    updatedAt: row.updated_at,
    visibility: row.visibility,
  };
}

function parseSelectedPlayerIds(value: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

function toCampaignNpcSummary(row: CampaignNpcDossierRow): CampaignNpcSummary {
  return {
    campaignId: row.campaign_id,
    id: row.id,
    name: row.name,
    portraitImageAssetId: row.portrait_image_asset_id,
    publicSummary: row.public_summary,
    publicWikiPageId: row.public_wiki_page_id,
    slug: row.slug,
    visibility: row.visibility,
  };
}

function toCampaignFaction(row: CampaignFactionRow): CampaignFaction {
  return {
    campaignId: row.campaign_id,
    connections: parseStringArray(row.connections_json),
    id: row.id,
    imageAssetId: row.image_asset_id,
    motto: row.motto,
    name: row.name,
    playerPrompt: row.player_prompt,
    publicReputation: row.public_reputation,
    rumours: parseStringArray(row.rumours_json),
    slug: row.slug,
    summary: row.summary,
    wikiPageSlug: row.wiki_page_slug,
    wikiPageTitle: row.wiki_page_title,
  };
}

function canSeeGameMasterContent(viewerRole: UserRole) {
  return viewerRole === "game_master" ? 1 : 0;
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

function uniqueCampaignSessionSlug(database: Database, campaignId: string, title: string) {
  const base = slugify(title).replaceAll("_", "-") || "session";
  let slug = base;
  let suffix = 2;
  while (
    database
      .query<{ id: string }, [string, string]>(
        "select id from campaign_sessions where campaign_id = ? and slug = ?",
      )
      .get(campaignId, slug)
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function uniqueCampaignWikiSlug(database: Database, campaignId: string, title: string) {
  const base = slugify(title).replaceAll("_", "-") || "wiki-page";
  let slug = base;
  let suffix = 2;
  while (
    database
      .query<{ id: string }, [string, string]>(
        "select id from campaign_wiki_pages where campaign_id = ? and slug = ?",
      )
      .get(campaignId, slug)
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function uniqueCampaignNpcSlug(database: Database, campaignId: string, name: string) {
  const base = slugify(name).replaceAll("_", "-") || "npc";
  let slug = base;
  let suffix = 2;
  while (
    database
      .query<{ id: string }, [string, string]>(
        "select id from campaign_npcs where campaign_id = ? and slug = ?",
      )
      .get(campaignId, slug)
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
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
