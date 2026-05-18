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
export type CampaignContentVisibility = "game_master" | "player";
export type WikiPageType = "campaign" | "faction" | "location" | "lore" | "npc" | "session";

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

export interface AdminUserSummary extends AuthUser {
  campaignCount: number;
  characterCount: number;
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
  acceptInvite(inviteId: string, acceptedAt: Date): void;
  createUser(user: AuthUserWithPassword): AuthUser;
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
  listInvites(): LocalInvite[];
  listPasswordResetTokens(): PasswordResetToken[];
  listUserSummaries(): AdminUserSummary[];
  listUsers(): AuthUser[];
  countActiveAdmins(): number;
  updateUserPasswordHash(userId: string, passwordHash: string): void;
  updateUserStatus(userId: string, status: UserStatus): AuthUser | null;
  usePasswordResetToken(tokenId: string, usedAt: Date): void;
}

export interface CampaignSummary {
  gmUserId: string;
  id: string;
  name: string;
  slug: string;
}

export interface CampaignRepository {
  getCampaignById(id: string): CampaignSummary | null;
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

export interface CharacterEquipment {
  category: string;
  equipped: boolean;
  id: string;
  name: string;
  notes: string;
  quantity: number;
}

export type CharacterBackgroundCategory =
  | "backstory"
  | "bond"
  | "false_identity"
  | "flaw"
  | "ideal"
  | "npc"
  | "personality"
  | "rank";

export interface CharacterBackgroundEntry {
  body: string;
  category: CharacterBackgroundCategory;
  id: string;
  title: string;
}

export interface ArmourClassSource {
  label: string;
  notes: string;
  value: number;
}

export interface CharacterDefence {
  detail: string;
  label: string;
  type: "armour" | "condition_immunity" | "immunity" | "resistance";
}

export interface CharacterProficiency {
  category: "armour" | "language" | "tool" | "weapon";
  detail: string;
  name: string;
}

export interface CharacterSense {
  label: string;
  value: string;
}

export interface CharacterSheetReadModel {
  abilities: CharacterAbility[];
  armourClassBreakdown: ArmourClassSource[];
  armourClass: number;
  background: string;
  classes: CharacterClassSummary[];
  defences: CharacterDefence[];
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  id: string;
  initiative: number;
  level: number;
  name: string;
  proficiencies: CharacterProficiency[];
  proficiencyBonus: number;
  senses: CharacterSense[];
  skills: CharacterSkill[];
  slug: string;
  species: string;
  speedFeet: number;
}

export interface CharacterRepository {
  createCharacter(input: CreateCharacterInput): CharacterSheetReadModel;
  getAccessContext(characterId: string): CharacterAccessContext | null;
  getSheetById(id: string): CharacterSheetReadModel | null;
  getSheetBySlug(slug: string): CharacterSheetReadModel | null;
  listCharactersForCampaign(campaignId: string): CharacterRosterItem[];
  listCharactersForPlayer(userId: string): CharacterRosterItem[];
  listBackgroundEntries(characterId: string): CharacterBackgroundEntry[];
  listEquipment(characterId: string): CharacterEquipment[];
  listResources(characterId: string): CharacterResource[];
  updateEquipmentItem(
    characterId: string,
    equipmentId: string,
    patch: { equipped?: boolean; quantity?: number },
  ): CharacterEquipment | null;
  updateResourceCurrent(
    characterId: string,
    resourceId: string,
    current: number,
  ): CharacterResource | null;
  upsertConditionResource(characterId: string, label: string): CharacterResource;
}

export interface CreateCharacterInput {
  background: string;
  campaignId: string;
  className: string;
  hitPointMax: number;
  level: number;
  name: string;
  ownerUserId: string;
  species: string;
  subclassName: string | null;
}

export interface CharacterAccessContext {
  campaignId: string;
  id: string;
  ownerUserId: string;
}

export interface CharacterRosterItem {
  background: string;
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  classSummary: string;
  factionId: string | null;
  factionName: string | null;
  id: string;
  level: number;
  name: string;
  ownerDisplayName: string;
  ownerUserId: string;
  slug: string;
  species: string;
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
  updateNoteBody(
    characterId: string,
    noteId: string,
    viewerRole: UserRole,
    body: string,
  ): CharacterNote | null;
}

export interface CampaignWikiPage {
  bodyMarkdown: string;
  campaignId: string;
  id: string;
  pageType: WikiPageType;
  slug: string;
  sourcePath: string | null;
  sourceTitle: string | null;
  tags: string[];
  title: string;
  visibility: CampaignContentVisibility;
}

export interface CampaignImageAsset {
  altText: string;
  byteSize: number;
  campaignId: string;
  caption: string;
  height: number | null;
  id: string;
  mimeType: string;
  storageKey: string;
  visibility: CampaignContentVisibility;
  width: number | null;
}

export interface CampaignSessionRecord {
  body: string;
  campaignId: string;
  createdByUserId: string | null;
  id: string;
  sessionDate: string | null;
  slug: string;
  summary: string;
  title: string;
  visibility: CampaignContentVisibility;
}

export interface CampaignFaction {
  campaignId: string;
  id: string;
  imageAssetId: string | null;
  name: string;
  playerPrompt: string;
  publicReputation: string;
  rumours: string[];
  slug: string;
  summary: string;
}

export interface CharacterFactionChoice {
  characterId: string;
  connectionNote: string;
  factionId: string;
  factionName: string;
  factionSlug: string;
}

export interface CampaignContentRepository {
  getCharacterFactionChoice(characterId: string): CharacterFactionChoice | null;
  getWikiPageBySlug(
    campaignId: string,
    slug: string,
    viewerRole: UserRole,
  ): CampaignWikiPage | null;
  listFactionsForCampaign(campaignId: string): CampaignFaction[];
  listImageAssetsForCampaign(
    campaignId: string,
    viewerRole: UserRole,
  ): CampaignImageAsset[];
  listSessionsForCampaign(
    campaignId: string,
    viewerRole: UserRole,
  ): CampaignSessionRecord[];
  listWikiPagesForCampaign(campaignId: string, viewerRole: UserRole): CampaignWikiPage[];
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

export type RuleEntityType =
  | "background"
  | "class_feature"
  | "condition"
  | "equipment"
  | "infusion"
  | "species_trait"
  | "spell";

export interface RulesSourceSeedInput {
  abbreviation: string;
  id?: string;
  name: string;
  precedence: number;
  slug: string;
}

export interface RuleMechanicSeedInput {
  data: Record<string, unknown>;
  mechanicType: string;
}

export interface RuleEntitySeedInput {
  entityType: RuleEntityType;
  id?: string;
  mechanics: RuleMechanicSeedInput[];
  name: string;
  slug: string;
  source: RulesSourceSeedInput;
}

export interface UpsertedRuleEntity extends RuleEntitySeedInput {
  id: string;
  source: RulesSourceSeedInput & { id: string };
}

export interface RulesSeedRepository {
  upsertRuleEntity(entity: RuleEntitySeedInput): UpsertedRuleEntity;
}
