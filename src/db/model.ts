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

export interface AuthRepository {
  findUserByEmail(email: string): AuthUser | null;
  findUserById(id: string): AuthUser | null;
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
  getSheetBySlug(slug: string): CharacterSheetReadModel | null;
  listResources(characterId: string): CharacterResource[];
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
