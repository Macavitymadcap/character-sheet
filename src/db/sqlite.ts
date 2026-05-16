import { Database } from "bun:sqlite";
import type {
  AbilityName,
  AuthRepository,
  AuthUser,
  AuthUserWithPassword,
  CampaignMember,
  CampaignRepository,
  CampaignSummary,
  CharacterAccessContext,
  CharacterAbility,
  CharacterNote,
  CharacterRepository,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
  CharacterSkill,
  LocalInvite,
  NotesRepository,
  PasswordResetToken,
  RulesRepository,
  StoredSession,
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

interface CharacterResourceRow {
  current_value: number;
  id: string;
  label: string;
  max_value: number | null;
  resource_key: string;
  resource_type: string;
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

export interface SqliteRepositories {
  authRepository: AuthRepository;
  campaignRepository: CampaignRepository;
  characterRepository: CharacterRepository;
  notesRepository: NotesRepository;
  rulesRepository: RulesRepository;
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

  getSheetBySlug(slug: string): CharacterSheetReadModel | null {
    const character = this.database
      .query<CharacterRow, [string]>(
        `select id, slug, name, species, background, level, proficiency_bonus, armour_class,
          initiative, speed_ft, hit_point_max, hit_point_current, temporary_hit_points
         from characters
         where slug = ?`,
      )
      .get(slug);

    if (!character) return null;

    return {
      abilities: this.listAbilities(character.id),
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
      hitPoints: {
        current: character.hit_point_current,
        max: character.hit_point_max,
        temporary: character.temporary_hit_points,
      },
      id: character.id,
      initiative: character.initiative,
      level: character.level,
      name: character.name,
      proficiencyBonus: character.proficiency_bonus,
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
      .map((row) => ({
        current: row.current_value,
        id: row.id,
        key: row.resource_key,
        label: row.label,
        max: row.max_value,
        type: row.resource_type,
      }));
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

function toAuthUser(row: UserRow): AuthUser {
  return {
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    role: row.role,
    status: row.status,
  };
}

function toSqlDate(date: Date) {
  return date.toISOString();
}
