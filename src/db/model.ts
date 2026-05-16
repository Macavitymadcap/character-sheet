export type UserRole = "admin" | "game_master" | "player";
export type UserStatus = "active" | "disabled";
export type AbilityName =
  | "charisma"
  | "constitution"
  | "dexterity"
  | "intelligence"
  | "strength"
  | "wisdom";
export type NoteVisibility = "game_master" | "player";

export interface AuthUser {
  displayName: string;
  email: string;
  id: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthUserWithPassword extends AuthUser {
  passwordHash: string;
}

export interface StoredSession {
  expiresAt: Date;
  id: string;
  userId: string;
}

export interface LocalInvite {
  acceptedAt: Date | null;
  createdByUserId: string;
  email: string;
  expiresAt: Date;
  id: string;
  role: UserRole;
  tokenHash: string;
}

export interface PasswordResetToken {
  createdByUserId: string;
  expiresAt: Date;
  id: string;
  tokenHash: string;
  usedAt: Date | null;
  userId: string;
}

export interface AuthRepository {
  createInvite(invite: LocalInvite): LocalInvite;
  createPasswordResetToken(token: PasswordResetToken): PasswordResetToken;
  createSession(session: StoredSession): StoredSession;
  deleteSession(sessionId: string): void;
  findUserByEmail(email: string): AuthUser | null;
  findUserById(id: string): AuthUser | null;
  findInviteByTokenHash(tokenHash: string): LocalInvite | null;
  findPasswordResetTokenByTokenHash(tokenHash: string): PasswordResetToken | null;
  findSessionById(id: string): StoredSession | null;
  findUserWithPasswordByEmail(email: string): AuthUserWithPassword | null;
  listUsers(): AuthUser[];
}

export interface CampaignSummary {
  gmUserId: string;
  id: string;
  name: string;
  slug: string;
}

export interface CampaignRepository {
  getCampaignBySlug(slug: string): CampaignSummary | null;
  listMembers(campaignId: string): CampaignMember[];
}

export interface CampaignMember {
  campaignId: string;
  role: "game_master" | "player";
  userId: string;
}

export interface CharacterAbility {
  ability: AbilityName;
  modifier: number;
  saveModifier: number;
  saveProficient: boolean;
  score: number;
}

export interface CharacterClassSummary {
  className: string;
  hitDice: string;
  level: number;
  spellcastingAbility: AbilityName | null;
  subclassName: string | null;
}

export interface CharacterResource {
  current: number;
  id: string;
  key: string;
  label: string;
  max: number | null;
  type: string;
}

export interface CharacterSheetReadModel {
  abilities: CharacterAbility[];
  armourClass: number;
  background: string;
  classes: CharacterClassSummary[];
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  id: string;
  initiative: number;
  level: number;
  name: string;
  proficiencyBonus: number;
  skills: CharacterSkill[];
  slug: string;
  species: string;
  speedFeet: number;
}

export interface CharacterRepository {
  getAccessContext(characterId: string): CharacterAccessContext | null;
  getSheetBySlug(slug: string): CharacterSheetReadModel | null;
  listResources(characterId: string): CharacterResource[];
}

export interface CharacterAccessContext {
  campaignId: string;
  id: string;
  ownerUserId: string;
}

export interface CharacterSkill {
  ability: AbilityName;
  modifier: number;
  proficiencyLevel: number;
  skill: string;
}

export interface CharacterNote {
  body: string;
  id: string;
  title: string;
  visibility: NoteVisibility;
}

export interface NotesRepository {
  listNotesForCharacter(characterId: string, viewerRole: UserRole): CharacterNote[];
}

export interface CharacterRuleLink {
  entityName: string;
  entityType: string;
  prepared: boolean;
  selected: boolean;
  selectionType: string;
  sourceName: string;
}

export interface RulesRepository {
  listRuleLinksForCharacter(characterId: string): CharacterRuleLink[];
}
