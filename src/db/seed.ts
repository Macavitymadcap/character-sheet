import type { Database } from "bun:sqlite";
import { PasswordService } from "../auth/password";

type AbilitySeed = [string, number, number, number, number];
type ArmourClassSourceSeed = [string, string, number, string, number];
type DefenceSeed = [string, string, string, string, number];
type EquipmentSeed = [string, string, string, number, number, string];
type NoteSeed = [string, string, string, string, string];
type ProficiencySeed = [string, string, string, string, number];
type ResourceSeed = [string, string, string, string, number, number | null, number];
type RuleLinkSeed = [string, string, string, number, number, number];
type SenseSeed = [string, string, string, number];
type SourceSeed = [string, string, string, string, number];
type StringSeed = string[];

const users = [
  [
    "user_lynott_player",
    "lynott.player@example.local",
    "Lynott Player",
    "player",
    new PasswordService().hashPassword("password123", "seed-user-lynott-player"),
  ],
  [
    "user_game_master",
    "gm@example.local",
    "Campaign GM",
    "game_master",
    new PasswordService().hashPassword("password123", "seed-user-game-master"),
  ],
  [
    "user_site_admin",
    "admin@example.local",
    "Site Admin",
    "admin",
    new PasswordService().hashPassword("password123", "seed-user-site-admin"),
  ],
];

const abilities: AbilitySeed[] = [
  ["strength", 8, -1, 0, -1],
  ["dexterity", 16, 3, 0, 3],
  ["constitution", 13, 1, 1, 3],
  ["intelligence", 18, 4, 1, 6],
  ["wisdom", 12, 1, 0, 1],
  ["charisma", 10, 0, 0, 0],
];

const skills: Array<[string, string, number, number]> = [
  ["acrobatics", "dexterity", 0, 3],
  ["animal handling", "wisdom", 0, 1],
  ["arcana", "intelligence", 0, 4],
  ["athletics", "strength", 0, -1],
  ["stealth", "dexterity", 1, 5],
  ["deception", "charisma", 1, 2],
  ["history", "intelligence", 0, 4],
  ["insight", "wisdom", 0, 1],
  ["intimidation", "charisma", 0, 0],
  ["investigation", "intelligence", 1, 6],
  ["medicine", "wisdom", 0, 1],
  ["nature", "intelligence", 0, 4],
  ["perception", "wisdom", 1, 3],
  ["performance", "charisma", 0, 0],
  ["persuasion", "charisma", 0, 0],
  ["religion", "intelligence", 0, 4],
  ["sleight of hand", "dexterity", 0, 3],
  ["survival", "wisdom", 0, 1],
];

const senses: SenseSeed[] = [
  ["sense_lynott_darkvision", "Darkvision", "60 ft", 10],
  ["sense_lynott_passive_perception", "Passive perception", "13", 20],
  ["sense_lynott_passive_investigation", "Passive investigation", "16", 30],
];

const armourClassSources: ArmourClassSourceSeed[] = [
  ["ac_lynott_breastplate", "Breastplate", 14, "Medium armour base AC.", 10],
  ["ac_lynott_dexterity", "Dexterity bonus", 2, "Breastplate maximum Dexterity bonus.", 20],
  ["ac_lynott_enhanced_defence", "Enhanced Defence", 1, "Active armour infusion.", 30],
];

const defences: DefenceSeed[] = [
  ["defence_lynott_armour", "armour", "Armour", "Breastplate with Enhanced Defence infusion.", 10],
  ["defence_lynott_resistances", "resistance", "Resistances", "None currently recorded.", 20],
  ["defence_lynott_immunities", "immunity", "Immunities", "None currently recorded.", 30],
  [
    "defence_lynott_condition_immunities",
    "condition_immunity",
    "Condition immunities",
    "None currently recorded.",
    40,
  ],
];

const proficiencies: ProficiencySeed[] = [
  ["proficiency_lynott_light_armour", "armour", "Light armour", "Artificer training.", 10],
  ["proficiency_lynott_medium_armour", "armour", "Medium armour", "Artificer training.", 20],
  ["proficiency_lynott_shields", "armour", "Shields", "Artificer training.", 30],
  ["proficiency_lynott_simple_weapons", "weapon", "Simple weapons", "Artificer training.", 40],
  ["proficiency_lynott_firearms", "weapon", "Firearms", "Artificer training and campaign exposure.", 50],
  ["proficiency_lynott_thieves_tools", "tool", "Thieves' tools", "Artificer training.", 60],
  ["proficiency_lynott_tinkers_tools", "tool", "Tinker's tools", "Artificer training.", 70],
  ["proficiency_lynott_smiths_tools", "tool", "Smith's tools", "Artificer artisan tool choice.", 80],
  ["proficiency_lynott_woodcarvers_tools", "tool", "Woodcarver's tools", "Artillerist specialist training.", 90],
  ["proficiency_lynott_disguise_kit", "tool", "Disguise kit", "Special Operations background.", 100],
  ["proficiency_lynott_forgery_kit", "tool", "Forgery kit", "Special Operations background.", 110],
  ["proficiency_lynott_common", "language", "Common", "Known language.", 120],
  ["proficiency_lynott_goblin", "language", "Goblin", "Known language.", 130],
  [
    "proficiency_lynott_background_language",
    "language",
    "Additional background language",
    "To be determined by campaign setting.",
    140,
  ],
];

const staleProficiencyIds = [
  "proficiency_lynott_three_dragon_ante",
  "proficiency_lynott_vehicles_land",
  "training_lynott_infiltration",
  "training_lynott_magitech",
];

const resources: ResourceSeed[] = [
  ["resource_lynott_hit_points", "hit_points", "hit_points", "Hit points", 31, 31, 10],
  [
    "resource_lynott_temporary_hit_points",
    "temporary_hit_points",
    "temporary_hit_points",
    "Temporary hit points",
    0,
    null,
    20,
  ],
  ["resource_lynott_inspiration", "inspiration", "inspiration", "Inspiration", 0, 1, 25],
  ["resource_lynott_hit_dice", "hit_dice_d8", "hit_dice", "Hit dice d8", 4, 4, 30],
  ["resource_lynott_spell_slots_1", "spell_slots_1", "spell_slot", "1st-level spell slots", 3, 3, 40],
];

const equipment: EquipmentSeed[] = [
  [
    "equipment_lynott_breastplate",
    "Breastplate with Enhanced Defence infusion",
    "armour",
    1,
    1,
    "AC 14 plus Dexterity modifier, improved by the active infusion.",
  ],
  [
    "equipment_lynott_pistol",
    "Pistol with Repeating Shot infusion",
    "weapon",
    1,
    1,
    "Range 30/90 ft., 1d10+4 magical piercing damage.",
  ],
];

const notes: NoteSeed[] = [
  [
    "note_lynott_player",
    "user_lynott_player",
    "player",
    "Player notes",
    "Keep the false identities ready and weapons maintained.",
  ],
  [
    "note_lynott_gm",
    "user_game_master",
    "game_master",
    "Game Master notes",
    "Sergeant Kora Steelheart is likely coordinating the search.",
  ],
];

const sources: SourceSeed[] = [
  ["rules_source_phb", "players-handbook", "Player's Handbook", "PHB", 10],
  ["rules_source_tcoe", "tashas-cauldron-of-everything", "Tasha's Cauldron of Everything", "TCoE", 20],
];

const rulesEntities: StringSeed[] = [
  ["rule_enhanced_defence", "rules_source_tcoe", "enhanced-defence", "infusion", "Enhanced Defence"],
  ["rule_repeating_shot", "rules_source_tcoe", "repeating-shot", "infusion", "Repeating Shot"],
  ["rule_mage_hand", "rules_source_phb", "mage-hand", "spell", "Mage Hand"],
];

const ruleLinks: RuleLinkSeed[] = [
  ["link_lynott_enhanced_defence", "rule_enhanced_defence", "active_infusion", 0, 1, 10],
  ["link_lynott_repeating_shot", "rule_repeating_shot", "active_infusion", 0, 1, 20],
  ["link_lynott_mage_hand", "rule_mage_hand", "known_cantrip", 1, 1, 30],
];

export const seedDatabase = (database: Database) => {
  database.run("PRAGMA foreign_keys = ON");

  for (const user of users) {
    database.run(
      `insert into users (id, email, display_name, role, password_hash)
       values (?, ?, ?, ?, ?)
       on conflict(id) do update set
         email = excluded.email,
         display_name = excluded.display_name,
         role = excluded.role,
         password_hash = excluded.password_hash,
         status = 'active'`,
      user,
    );
  }

  database.run(
    "insert or ignore into campaigns (id, slug, name, gm_user_id) values (?, ?, ?, ?)",
    ["campaign_rovnost_shadows", "rovnost-shadows", "Rovnost Shadows", "user_game_master"],
  );

  for (const member of [
    ["campaign_rovnost_shadows", "user_game_master", "game_master"],
    ["campaign_rovnost_shadows", "user_lynott_player", "player"],
  ]) {
    database.run(
      "insert or ignore into campaign_members (campaign_id, user_id, role) values (?, ?, ?)",
      member,
    );
  }

  database.run(
    "insert or ignore into characters (id, slug, owner_user_id, campaign_id, name, species, background, alignment, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current, temporary_hit_points) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      "character_lynott_magulbisson",
      "lynott-magulbisson",
      "user_lynott_player",
      "campaign_rovnost_shadows",
      "Lynott Magulbisson",
      "Hobgoblin",
      "Special Operations",
      "Chaotic Neutral",
      4,
      2,
      17,
      3,
      30,
      31,
      31,
      0,
    ],
  );

  database.run(
    "insert or ignore into character_classes (id, character_id, class_name, subclass_name, level, hit_dice, spellcasting_ability) values (?, ?, ?, ?, ?, ?, ?)",
    [
      "class_lynott_artificer",
      "character_lynott_magulbisson",
      "Artificer",
      "Artillerist",
      4,
      "4d8",
      "intelligence",
    ],
  );

  for (const ability of abilities) {
    database.run(
      "insert or ignore into character_abilities (character_id, ability, score, modifier, save_proficient, save_modifier) values (?, ?, ?, ?, ?, ?)",
      ["character_lynott_magulbisson", ...ability],
    );
  }

  for (const skill of skills) {
    database.run(
      "insert or ignore into character_skills (character_id, skill, ability, proficiency_level, modifier) values (?, ?, ?, ?, ?)",
      ["character_lynott_magulbisson", ...skill],
    );
  }

  for (const sense of senses) {
    database.run(
      "insert or ignore into character_senses (id, character_id, label, value, sort_order) values (?, ?, ?, ?, ?)",
      [sense[0], "character_lynott_magulbisson", ...sense.slice(1)],
    );
  }

  for (const source of armourClassSources) {
    database.run(
      "insert or ignore into character_armour_class_sources (id, character_id, label, value, notes, sort_order) values (?, ?, ?, ?, ?, ?)",
      [source[0], "character_lynott_magulbisson", ...source.slice(1)],
    );
  }

  for (const defence of defences) {
    database.run(
      "insert or ignore into character_defences (id, character_id, defence_type, label, detail, sort_order) values (?, ?, ?, ?, ?, ?)",
      [defence[0], "character_lynott_magulbisson", ...defence.slice(1)],
    );
  }

  database.run(
    `delete from character_proficiencies
     where character_id = ?
       and id in (${staleProficiencyIds.map(() => "?").join(", ")})`,
    ["character_lynott_magulbisson", ...staleProficiencyIds],
  );

  for (const proficiency of proficiencies) {
    database.run(
      `insert into character_proficiencies (id, character_id, category, name, detail, sort_order)
       values (?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         category = excluded.category,
         name = excluded.name,
         detail = excluded.detail,
         sort_order = excluded.sort_order`,
      [proficiency[0], "character_lynott_magulbisson", ...proficiency.slice(1)],
    );
  }

  for (const resource of resources) {
    database.run(
      `insert into character_resources (id, character_id, resource_key, resource_type, label, current_value, max_value, sort_order)
       values (?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         resource_key = excluded.resource_key,
         resource_type = excluded.resource_type,
         label = excluded.label,
         max_value = excluded.max_value,
         sort_order = excluded.sort_order`,
      [resource[0], "character_lynott_magulbisson", ...resource.slice(1)],
    );
  }

  for (const item of equipment) {
    database.run(
      "insert or ignore into character_equipment (id, character_id, name, category, quantity, equipped, notes) values (?, ?, ?, ?, ?, ?, ?)",
      [item[0], "character_lynott_magulbisson", ...item.slice(1)],
    );
  }

  for (const note of notes) {
    database.run(
      "insert or ignore into character_notes (id, character_id, author_user_id, visibility, title, body) values (?, ?, ?, ?, ?, ?)",
      [note[0], "character_lynott_magulbisson", ...note.slice(1)],
    );
  }

  for (const source of sources) {
    database.run(
      "insert or ignore into rules_sources (id, slug, name, abbreviation, precedence) values (?, ?, ?, ?, ?)",
      source,
    );
  }

  for (const entity of rulesEntities) {
    database.run(
      "insert or ignore into rules_entities (id, source_id, slug, entity_type, name) values (?, ?, ?, ?, ?)",
      entity,
    );
  }

  for (const link of ruleLinks) {
    database.run(
      "insert or ignore into character_rule_links (id, character_id, rules_entity_id, selection_type, prepared, selected, sort_order) values (?, ?, ?, ?, ?, ?, ?)",
      [link[0], "character_lynott_magulbisson", ...link.slice(1)],
    );
  }
};
