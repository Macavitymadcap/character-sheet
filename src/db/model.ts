export type UserRole = "admin" | "game_master" | "player";
export type UserCapability = "admin";
export type CampaignMemberRole = "game_master" | "player";
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
export type NpcVisibility = "private" | "public" | "selected";
export type WikiPageType = "campaign" | "faction" | "location" | "lore" | "npc" | "session";

export interface AuthUser {
  capabilities: UserCapability[];
  campaignRoles: CampaignMemberRole[];
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
  role: CampaignMemberRole;
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
  id?: string;
  label: string;
  notes: string;
  value: number;
}

export interface CharacterDefence {
  detail: string;
  id?: string;
  label: string;
  type: "armour" | "condition_immunity" | "immunity" | "resistance";
}

export interface CharacterProficiency {
  category: "armour" | "language" | "tool" | "weapon";
  detail: string;
  id?: string;
  name: string;
}

export interface CharacterSense {
  id?: string;
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
  updateAbility(
    characterId: string,
    ability: AbilityName,
    patch: { saveProficient: boolean; score: number },
  ): CharacterSheetReadModel | null;
  updateArmourClassSource(
    characterId: string,
    sourceId: string,
    patch: { label: string; notes: string; value: number },
  ): CharacterSheetReadModel | null;
  updateBackgroundEntry(
    characterId: string,
    entryId: string,
    patch: { body: string; title: string },
  ): CharacterBackgroundEntry | null;
  updateDefence(
    characterId: string,
    defenceId: string,
    patch: { detail: string; label: string },
  ): CharacterDefence | null;
  updateEquipmentItem(
    characterId: string,
    equipmentId: string,
    patch: { category?: string; equipped?: boolean; name?: string; notes?: string; quantity?: number },
  ): CharacterEquipment | null;
  updateProficiency(
    characterId: string,
    proficiencyId: string,
    patch: { detail: string; name: string },
  ): CharacterProficiency | null;
  updateResourceCurrent(
    characterId: string,
    resourceId: string,
    current: number,
  ): CharacterResource | null;
  updateSense(
    characterId: string,
    senseId: string,
    patch: { label: string; value: string },
  ): CharacterSense | null;
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
  ): CharacterSheetReadModel | null;
  updateSkill(
    characterId: string,
    skill: string,
    patch: { proficiencyLevel: number },
  ): CharacterSheetReadModel | null;
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
  authorUserId?: string;
  body: string;
  createdAt?: string;
  id: string;
  title: string;
  updatedAt?: string;
  visibility: NoteVisibility;
}

export interface NotesRepository {
  createNote(input: {
    authorUserId: string;
    body: string;
    characterId: string;
    title: string;
    visibility: NoteVisibility;
  }): CharacterNote;
  deleteNote(characterId: string, noteId: string, viewerRole: UserRole): boolean;
  listNotesForCharacter(characterId: string, viewerRole: UserRole): CharacterNote[];
  updateNote(
    characterId: string,
    noteId: string,
    viewerRole: UserRole,
    patch: { body: string; title: string },
  ): CharacterNote | null;
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
  coverImageAssetId: string | null;
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
  title: string;
  visibility: CampaignContentVisibility;
  width: number | null;
}

export interface CampaignSessionRecord {
  body: string;
  campaignId: string;
  createdAt?: string;
  createdByUserId: string | null;
  id: string;
  sessionDate: string | null;
  slug: string;
  summary: string;
  title: string;
  updatedAt?: string;
  visibility: CampaignContentVisibility;
}

export interface CampaignNpcDossier {
  campaignId: string;
  createdAt?: string;
  gmNotes: string;
  hooks: string;
  id: string;
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
  slug: string;
  updatedAt?: string;
  visibility: NpcVisibility;
}

export interface CampaignNpcSummary {
  campaignId: string;
  id: string;
  name: string;
  portraitImageAssetId: string | null;
  publicSummary: string;
  publicWikiPageId: string | null;
  slug: string;
  visibility: NpcVisibility;
}

export interface CampaignFaction {
  campaignId: string;
  connections: string[];
  id: string;
  imageAssetId: string | null;
  motto: string;
  name: string;
  playerPrompt: string;
  publicReputation: string;
  rumours: string[];
  slug: string;
  summary: string;
  wikiPageSlug: string | null;
  wikiPageTitle: string | null;
}

export interface CharacterFactionChoice {
  characterId: string;
  connectionNote: string;
  factionId: string | null;
  factionName: string | null;
  factionSlug: string | null;
}

export interface CampaignContentRepository {
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
  }): CampaignNpcDossier;
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
  }): CampaignImageAsset;
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
  }): CampaignWikiPage;
  createSession(input: {
    body: string;
    campaignId: string;
    createdByUserId: string;
    sessionDate: string | null;
    summary: string;
    title: string;
    visibility: CampaignContentVisibility;
  }): CampaignSessionRecord;
  deleteSession(campaignId: string, sessionId: string): boolean;
  getCharacterFactionChoice(characterId: string): CharacterFactionChoice | null;
  getWikiPageBySlug(
    campaignId: string,
    slug: string,
    viewerRole: UserRole,
  ): CampaignWikiPage | null;
  getImageAssetById(
    campaignId: string,
    assetId: string,
    viewerRole: UserRole,
  ): CampaignImageAsset | null;
  getSessionBySlug(campaignId: string, slug: string, viewerRole: UserRole): CampaignSessionRecord | null;
  getNpcDossierBySlug(campaignId: string, slug: string, viewerRole: UserRole): CampaignNpcDossier | null;
  getNpcSummaryBySlug(
    campaignId: string,
    slug: string,
    viewerRole: UserRole,
    viewerUserId?: string,
  ): CampaignNpcSummary | null;
  listFactionsForCampaign(campaignId: string): CampaignFaction[];
  listImageAssetsForCampaign(
    campaignId: string,
    viewerRole: UserRole,
  ): CampaignImageAsset[];
  listImageAssetsForWikiPage(
    campaignId: string,
    wikiPageId: string,
    attachmentType: "gallery" | "inline",
    viewerRole: UserRole,
  ): CampaignImageAsset[];
  listSessionsForCampaign(
    campaignId: string,
    viewerRole: UserRole,
  ): CampaignSessionRecord[];
  listNpcDossiersForCampaign(campaignId: string, viewerRole: UserRole): CampaignNpcDossier[];
  listNpcSummariesForCampaign(
    campaignId: string,
    viewerRole: UserRole,
    viewerUserId?: string,
  ): CampaignNpcSummary[];
  revealNpcDossier(
    campaignId: string,
    npcId: string,
    visibility: NpcVisibility,
  ): CampaignNpcDossier | null;
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
  ): CampaignNpcDossier | null;
  listWikiPagesForCampaign(campaignId: string, viewerRole: UserRole): CampaignWikiPage[];
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
  ): CampaignSessionRecord | null;
  updateCharacterFactionChoice(
    characterId: string,
    factionId: string | null,
    connectionNote: string,
  ): CharacterFactionChoice | null;
}

export interface CharacterRuleLink {
  actionTiming: string[];
  charges: string;
  contentCategory: RulesContentCategory;
  description: string;
  entityName: string;
  entitySlug: string;
  entityType: string;
  prepared: boolean;
  resetCadence: string;
  selected: boolean;
  selectionType: string;
  sourceName: string;
  sourceSlug: string;
}

export interface RulesRepository {
  getRuleDetail(entityType: RuleEntityType, slug: string, filters?: RuleAccessFilters): RuleDetail | null;
  listRuleEntityTypes(filters?: RuleAccessFilters): RuleEntityTypeCount[];
  listRuleLinksForCharacter(characterId: string): CharacterRuleLink[];
  listRules(filters?: RuleSearchFilters): RuleSummary[];
  listRuleSources(filters?: RuleAccessFilters): RulesSourceSummary[];
}

export type RuleEntityType =
  | "action"
  | "background"
  | "class"
  | "class_feature"
  | "condition"
  | "core_rule"
  | "equipment"
  | "feat"
  | "infusion"
  | "proficiency"
  | "sense"
  | "species"
  | "species_trait"
  | "stat_block"
  | "subclass"
  | "subclass_feature"
  | "spell";

export interface RulesSourceSeedInput {
  abbreviation: string;
  campaignIds?: string[];
  contentCategory?: RulesContentCategory;
  id?: string;
  name: string;
  precedence: number;
  publicExportEligible?: boolean;
  slug: string;
  visibility?: RulesSourceVisibility;
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
  source: RulesSourceSummary & { precedence: number };
}

export type RulesContentCategory = "local" | "srd" | "third_party";
export type RulesSourceVisibility = "campaign" | "public";

export interface RulesSourceSummary {
  abbreviation: string;
  campaignIds: string[];
  contentCategory: RulesContentCategory;
  id: string;
  name: string;
  publicExportEligible: boolean;
  slug: string;
  visibility: RulesSourceVisibility;
}

export interface RulesSeedRepository {
  upsertRuleEntity(entity: RuleEntitySeedInput): UpsertedRuleEntity;
}

export interface RuleSearchFilters {
  campaignIds?: string[];
  contentCategory?: RulesContentCategory;
  entityType?: RuleEntityType;
  equipmentCategory?: string;
  query?: string;
  sourceSlug?: string;
  spellLevel?: number;
}

export interface RuleAccessFilters {
  campaignIds?: string[];
  contentCategory?: RulesContentCategory;
}

export interface RuleEntityTypeCount {
  count: number;
  entityType: RuleEntityType;
}

export interface RuleMechanicReadModel {
  data: Record<string, unknown>;
  mechanicType: string;
}

export interface RuleSummary {
  campaignIds: string[];
  contentCategory: RulesContentCategory;
  description: string;
  entityType: RuleEntityType;
  id: string;
  name: string;
  publicExportEligible: boolean;
  slug: string;
  sourceAbbreviation: string;
  sourceName: string;
  sourceSlug: string;
  sourceVisibility: RulesSourceVisibility;
  tags: string[];
}

export interface RuleDetail extends RuleSummary {
  mechanics: RuleMechanicReadModel[];
  provenance: {
    originalPath?: string;
    ruleType?: string;
    source?: string;
    srdVersion?: string;
  } | null;
}
