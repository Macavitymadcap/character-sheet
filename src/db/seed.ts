import type { Database } from "bun:sqlite";
import { PasswordService } from "../auth/password";

type AbilitySeed = [string, number, number, number, number];
type ArmourClassSourceSeed = [string, string, number, string, number];
type BackgroundEntrySeed = [string, string, string, string, number];
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
    "lynott@example.local",
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
  ["resource_lynott_fey_gift", "fey_gift", "feature_use", "Fey Gift", 2, 2, 50],
  [
    "resource_lynott_fortune_from_the_many",
    "fortune_from_the_many",
    "feature_use",
    "Fortune from the Many",
    2,
    2,
    60,
  ],
  ["resource_lynott_eldritch_cannon", "eldritch_cannon", "feature_use", "Eldritch Cannon", 1, 1, 70],
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

const backgroundEntries: BackgroundEntrySeed[] = [
  [
    "background_lynott_personality_weapons",
    "personality",
    "Weapon maintenance",
    "Maintains weapons with obsessive precision, even while hating what they represent.",
    10,
  ],
  [
    "background_lynott_personality_exits",
    "personality",
    "Threat reading",
    "Always watches exits, reads crowds, and catalogues threats; military habits die hard.",
    20,
  ],
  [
    "background_lynott_ideal_vengeance",
    "ideal",
    "Vengeance",
    "The army must answer for what they made him do, and for what they did to his people.",
    30,
  ],
  [
    "background_lynott_bond_faces",
    "bond",
    "The faces remain",
    "The faces of those he killed haunt him every night. He owes them justice, even if he can never make it right.",
    40,
  ],
  [
    "background_lynott_flaw_borrowed_faces",
    "flaw",
    "Borrowed faces",
    "He does not know who he is when he is not wearing someone else's face.",
    50,
  ],
  [
    "background_lynott_backstory_factory",
    "backstory",
    "Factory district",
    "Raised in Rovnost's factory district among hobgoblin engineers, Lynott joined the 1st Astrilian Artificers to escape the furnaces and use his technical skill.",
    60,
  ],
  [
    "background_lynott_backstory_uprising",
    "backstory",
    "The uprising",
    "Ordered to suppress a workers' uprising at home, he fired an experimental cannon that maimed people he knew. The mission turned his doubts into certainty.",
    70,
  ],
  [
    "background_lynott_backstory_desertion",
    "backstory",
    "Desertion",
    "Within days he deserted, taking modified service weapons and relying on disguise magic and forged identities to survive in the city.",
    80,
  ],
  [
    "background_lynott_identity_jonas",
    "false_identity",
    "Jonas Blarendon",
    "Male human travelling tinker and independent contractor; friendly, skilled with tools, and carrying a forged recommendation.",
    90,
  ],
  [
    "background_lynott_identity_soot",
    "false_identity",
    "Soot Marren Coalwhisper",
    "Male half-orc factory district hauler; useful for blending into working-class crowds when Jonas draws attention.",
    100,
  ],
  [
    "background_lynott_identity_petra",
    "false_identity",
    "Petra Wrenwright",
    "Female gnome scribe and records clerk; forgettable enough to access offices and records without raising suspicion.",
    110,
  ],
  [
    "background_lynott_npc_kora",
    "npc",
    "Sergeant Kora Steelheart",
    "Hobgoblin squad leader who gave the order to fire and likely leads the search for Lynott.",
    120,
  ],
  [
    "background_lynott_npc_matchstick",
    "npc",
    "Corporal Matchstick Venn Ashlock",
    "Human demolitions specialist who hated the mission but stayed, hoping the system could be fixed from within.",
    130,
  ],
  [
    "background_lynott_npc_dulsa",
    "npc",
    "Private Dulsa Ironbrace",
    "Dwarf sharpshooter who deserted three days after Lynott; her fate is unknown.",
    140,
  ],
  [
    "background_lynott_npc_rennik",
    "npc",
    "Private First Class Rennik Coppergear",
    "Gnome magitech engineer who maintained the experimental cannon and cared more for efficiency than consequence.",
    150,
  ],
  [
    "background_lynott_npc_blackwood",
    "npc",
    "Captain Theron Blackwood",
    "Company commander who sees Lynott as a malfunctioning asset and has the connections to coordinate the search.",
    160,
  ],
  [
    "background_lynott_npc_selvanis",
    "npc",
    "Major Selvanis Kresh",
    "Half-elf intelligence officer who understood what the weapon would do and treated people as variables.",
    170,
  ],
  [
    "background_lynott_npc_home",
    "npc",
    "People from home",
    "Aunt Marta, Riggo Three-Finger Tarn, and Old Korrin tie Lynott back to the factory district and the uprising's cost.",
    180,
  ],
  [
    "background_lynott_rank_enlisted",
    "rank",
    "Enlisted technical specialists",
    "Private, Private First Class, Corporal, and Sergeant cover basic operators through squad leaders.",
    190,
  ],
  [
    "background_lynott_rank_command",
    "rank",
    "Command ranks",
    "Lieutenant, Captain, and Major cover platoon leadership through battalion staff and intelligence operations.",
    200,
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
  ["rules_source_xgte", "xanathars-guide-to-everything", "Xanathar's Guide to Everything", "XGtE", 15],
  ["rules_source_tcoe", "tashas-cauldron-of-everything", "Tasha's Cauldron of Everything", "TCoE", 20],
  [
    "rules_source_mpmotm",
    "mordenkainen-presents-monsters-of-the-multiverse",
    "Mordenkainen Presents: Monsters of the Multiverse",
    "MPMotM",
    30,
  ],
];

const rulesEntities: StringSeed[] = [
  ["rule_enhanced_defence", "rules_source_tcoe", "enhanced-defence", "infusion", "Enhanced Defence"],
  ["rule_repeating_shot", "rules_source_tcoe", "repeating-shot", "infusion", "Repeating Shot"],
  ["rule_magical_tinkering", "rules_source_tcoe", "magical-tinkering", "class_feature", "Magical Tinkering"],
  ["rule_spellcasting", "rules_source_tcoe", "spellcasting", "class_feature", "Spellcasting"],
  ["rule_infuse_item", "rules_source_tcoe", "infuse-item", "class_feature", "Infuse Item"],
  [
    "rule_the_right_tool_for_the_job",
    "rules_source_tcoe",
    "the-right-tool-for-the-job",
    "class_feature",
    "The Right Tool for the Job",
  ],
  ["rule_eldritch_cannon", "rules_source_tcoe", "eldritch-cannon", "subclass_feature", "Eldritch Cannon"],
  ["rule_fey_gift", "rules_source_mpmotm", "fey-gift", "species_trait", "Fey Gift"],
  [
    "rule_fortune_from_the_many",
    "rules_source_mpmotm",
    "fortune-from-the-many",
    "species_trait",
    "Fortune from the Many",
  ],
  ["rule_mage_hand", "rules_source_phb", "mage-hand", "spell", "Mage Hand"],
  ["rule_mending", "rules_source_phb", "mending", "spell", "Mending"],
  ["rule_disguise_self", "rules_source_phb", "disguise-self", "spell", "Disguise Self"],
  ["rule_cure_wounds", "rules_source_phb", "cure-wounds", "spell", "Cure Wounds"],
  ["rule_grease", "rules_source_phb", "grease", "spell", "Grease"],
  ["rule_absorb_elements", "rules_source_xgte", "absorb-elements", "spell", "Absorb Elements"],
  ["rule_shield", "rules_source_phb", "shield", "spell", "Shield"],
  ["rule_thunderwave", "rules_source_phb", "thunderwave", "spell", "Thunderwave"],
];

const ruleLinks: RuleLinkSeed[] = [
  ["link_lynott_magical_tinkering", "rule_magical_tinkering", "class_feature", 0, 1, 10],
  ["link_lynott_spellcasting", "rule_spellcasting", "class_feature", 0, 1, 20],
  ["link_lynott_infuse_item", "rule_infuse_item", "class_feature", 0, 1, 30],
  ["link_lynott_the_right_tool_for_the_job", "rule_the_right_tool_for_the_job", "class_feature", 0, 1, 40],
  ["link_lynott_eldritch_cannon", "rule_eldritch_cannon", "subclass_feature", 0, 1, 50],
  ["link_lynott_fey_gift", "rule_fey_gift", "species_trait", 0, 1, 60],
  ["link_lynott_fortune_from_the_many", "rule_fortune_from_the_many", "species_trait", 0, 1, 70],
  ["link_lynott_enhanced_defence", "rule_enhanced_defence", "active_infusion", 0, 1, 80],
  ["link_lynott_repeating_shot", "rule_repeating_shot", "active_infusion", 0, 1, 90],
  ["link_lynott_mage_hand", "rule_mage_hand", "known_cantrip", 1, 1, 100],
  ["link_lynott_mending", "rule_mending", "known_cantrip", 1, 1, 110],
  ["link_lynott_disguise_self", "rule_disguise_self", "prepared_spell", 1, 1, 120],
  ["link_lynott_cure_wounds", "rule_cure_wounds", "prepared_spell", 1, 1, 130],
  ["link_lynott_grease", "rule_grease", "prepared_spell", 1, 1, 140],
  ["link_lynott_absorb_elements", "rule_absorb_elements", "prepared_spell", 1, 1, 150],
  ["link_lynott_shield", "rule_shield", "artillerist_spell", 1, 1, 160],
  ["link_lynott_thunderwave", "rule_thunderwave", "artillerist_spell", 1, 1, 170],
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
    `insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, alignment, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current, temporary_hit_points)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     on conflict(id) do update set
       slug = excluded.slug,
       owner_user_id = excluded.owner_user_id,
       campaign_id = excluded.campaign_id,
       name = excluded.name,
       species = excluded.species,
       background = excluded.background,
       alignment = excluded.alignment,
       level = excluded.level,
       proficiency_bonus = excluded.proficiency_bonus,
       armour_class = excluded.armour_class,
       initiative = excluded.initiative,
       speed_ft = excluded.speed_ft,
       hit_point_max = excluded.hit_point_max`,
    [
      "character_lynott_magulbisson",
      "lynott",
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

  for (const entry of backgroundEntries) {
    database.run(
      `insert into character_background_entries (id, character_id, category, title, body, sort_order)
       values (?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         category = excluded.category,
         title = excluded.title,
         body = excluded.body,
         sort_order = excluded.sort_order`,
      [entry[0], "character_lynott_magulbisson", ...entry.slice(1)],
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
