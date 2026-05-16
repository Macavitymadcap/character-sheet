import type { Database } from "bun:sqlite";

type AbilitySeed = [string, number, number, number, number];
type EquipmentSeed = [string, string, string, number, number, string];
type NoteSeed = [string, string, string, string, string];
type ResourceSeed = [string, string, string, string, number, number, number];
type RuleLinkSeed = [string, string, string, number, number, number];
type SourceSeed = [string, string, string, string, number];
type StringSeed = string[];

const users = [
  [
    "user_lynott_player",
    "lynott.player@example.local",
    "Lynott Player",
    "player",
    "local-dev-password-hash",
  ],
  ["user_game_master", "gm@example.local", "Campaign GM", "game_master", "local-dev-password-hash"],
  ["user_site_admin", "admin@example.local", "Site Admin", "admin", "local-dev-password-hash"],
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
  ["stealth", "dexterity", 1, 5],
  ["deception", "charisma", 1, 2],
  ["investigation", "intelligence", 1, 6],
  ["perception", "wisdom", 1, 3],
];

const resources: ResourceSeed[] = [
  ["resource_lynott_hit_points", "hit_points", "hit_points", "Hit points", 31, 31, 10],
  [
    "resource_lynott_temporary_hit_points",
    "temporary_hit_points",
    "temporary_hit_points",
    "Temporary hit points",
    0,
    0,
    20,
  ],
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
      "insert or ignore into users (id, email, display_name, role, password_hash) values (?, ?, ?, ?, ?)",
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

  for (const resource of resources) {
    database.run(
      "insert or ignore into character_resources (id, character_id, resource_key, resource_type, label, current_value, max_value, sort_order) values (?, ?, ?, ?, ?, ?, ?, ?)",
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
