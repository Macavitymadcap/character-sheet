import type { Database } from "bun:sqlite";
import { PasswordService } from "../auth/password";

type AbilitySeed = [string, number, number, number, number];
type ArmourClassSourceSeed = [string, string, number, string, number];
type BackgroundEntrySeed = [string, string, string, string, number];
type CampaignFactionSeed = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string | null,
  number,
];
type CampaignImageAssetSeed = [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  string,
  string,
  string,
];
type CampaignSessionSeed = [
  string,
  string,
  string,
  string | null,
  string,
  string,
  string,
  string,
  string,
];
type CampaignWikiPageSeed = [
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
];
type CampaignWikiPageAssetSeed = [string, string, "gallery" | "inline", number];
type CharacterFactionChoiceSeed = [string, string, string];
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
    "user_mira_player",
    "mira@example.local",
    "Mira Player",
    "player",
    new PasswordService().hashPassword("password123", "seed-user-mira-player"),
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
    "equipment_lynott_coin_purse",
    "Coin purse",
    "money",
    0,
    0,
    "Starting gold to be determined.",
  ],
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
  [
    "equipment_lynott_eldritch_cannon",
    "Eldritch Cannon",
    "construct",
    1,
    1,
    "Artillerist cannon; created through the Eldritch Cannon feature.",
  ],
  [
    "equipment_lynott_component_pouch",
    "Component pouch",
    "gear",
    1,
    1,
    "Bits of wire and tools used for artificer casting.",
  ],
  [
    "equipment_lynott_dungeoneers_pack",
    "Dungeoneer's pack",
    "gear",
    1,
    0,
    "Bedroll, mess kit, tinderbox, torches, rations, waterskin, and rope.",
  ],
  [
    "equipment_lynott_travellers_clothes",
    "Traveller's clothes",
    "gear",
    1,
    0,
    "Jonas Blarendon identity clothing.",
  ],
  [
    "equipment_lynott_common_clothes",
    "Common clothes",
    "gear",
    1,
    0,
    "Blending-in clothes for factory district work.",
  ],
  [
    "equipment_lynott_insignia",
    "Insignia of rank",
    "gear",
    1,
    0,
    "Hidden, wrapped, and stashed.",
  ],
  [
    "equipment_lynott_dark_cloak",
    "Dark cloak and hood",
    "gear",
    1,
    0,
    "For moving unseen.",
  ],
  [
    "equipment_lynott_disguise_kit",
    "Disguise kit",
    "tool",
    1,
    0,
    "Special Operations background tool.",
  ],
  [
    "equipment_lynott_forgery_kit",
    "Forgery kit",
    "tool",
    1,
    0,
    "Special Operations background tool.",
  ],
  [
    "equipment_lynott_maintenance_tools",
    "Maintenance tools for weapons",
    "tool",
    1,
    0,
    "Covered by tinker's tools.",
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
    "I grew up in the factory district of Rovnost, part of a long line of hobgoblin engineers. My family worked the machines that kept the city running. My father, his father, generations feeding the furnaces and maintaining the great industrial engines. I had the family gift for tinkering, for understanding how things worked, but I also had ambition. When the military began recruiting technically skilled individuals for their new magitech weapons programme, I saw my opportunity: escape the smog, see the world, make something of myself beyond the factory floor.",
    60,
  ],
  [
    "background_lynott_backstory_artificers",
    "backstory",
    "The 1st Astrilian Artificers",
    "I excelled in the 1st Astrilian Artificers. The discipline came naturally; hobgoblin culture had prepared me for military life. The unit wasn't just about firepower. We were infiltrators, intelligence gatherers, saboteurs with experimental magitech at our disposal. I learned to move unseen through urban terrain, to blend into crowds, to gather information and disappear before anyone noticed. I became proficient with experimental magitech firearms, rose through the ranks to Corporal, and earned respect as both a soldier and a technician. We operated in the shadows, maintaining order through precision strikes and covert operations. The work was dangerous, sometimes morally grey, but I told myself I was protecting progress, maintaining stability. The doubts were there. Whispers in the back of my mind during certain operations. But the alternative was going back to the factories, so I pushed them down and did my duty.",
    70,
  ],
  [
    "background_lynott_backstory_home_order",
    "backstory",
    "Sent home",
    "The order came down: suppress a workers' uprising in my old district. Use the new weapon, an experimental magitech cannon designed for crowd control with minimal casualties. Sergeant Kora Steelheart gave the order without hesitation. We were assured it was humane, effective, necessary. Private First Class Rennik Coppergear had made sure the cannon worked perfectly. I carried out the mission.",
    80,
  ],
  [
    "background_lynott_backstory_cannon",
    "backstory",
    "The cannon",
    "The cannon worked exactly as designed. Alchemically enhanced shot spread over distance, rupturing bodies from within. Turning people inside out without fully killing them. Leaving them dying in agony on the factory floor. I killed people I knew. I heard Riggo Three-Finger Tarn screaming; we'd grown up together, and he'd been organising the workers. I saw Old Korrin in the crowd before I fired; he'd taught me everything I knew about engineering. Childhood friends. Neighbours. Maybe even my Aunt Marta, though I couldn't bring myself to look closely enough to know for sure. Familiar faces now screaming, their insides on the outside, begging for death that wouldn't come quickly.",
    85,
  ],
  [
    "background_lynott_backstory_aftermath",
    "backstory",
    "Aftermath",
    "Corporal Matchstick Venn was sick in the alley afterward, but he stayed. He believed the system could be fixed from within. Private Dulsa Ironbrace deserted three days after me; I don't know if she made it out. Others, like Sergeant Steelheart, believed it was necessary, righteous even. These were traitors threatening the city's prosperity, they said. Captain Theron Blackwood filed his after-action report praising the mission's success. Major Selvanis Kresh, who'd briefed us on the weapon's minimal casualties, knew exactly what it would do all along.",
    87,
  ],
  [
    "background_lynott_backstory_desertion",
    "backstory",
    "Desertion",
    "I couldn't reconcile it anymore. The doubts became certainties. Within days, I deserted. I took my service weapons; a rifle and revolver, both heavily modified to be unrecognisable. I learned minor illusion magic, enough to hide the scars crossing my face and the regimental tattoo marking my shoulder. Now I'm back where I started: the factory district, blood on my hands, maintaining weapons I resent out of pure habit, wearing borrowed faces and hoping nobody looks too closely at who I really am.",
    89,
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

const campaignImageAssets: CampaignImageAssetSeed[] = [
  [
    "asset_rovnost_cover",
    "Campaign cover",
    "campaigns/rovnost-shadows/cover.png",
    "image/png",
    144000,
    1200,
    800,
    "Shadows of Rovnost campaign cover",
    "Campaign cover art for the local table.",
    "player",
  ],
  [
    "asset_magister_vallen",
    "Magister Vallen portrait",
    "campaigns/rovnost-shadows/magister-vallen.png",
    "image/png",
    86000,
    768,
    768,
    "Magister Vallen portrait",
    "Game Master reference portrait.",
    "game_master",
  ],
  [
    "asset_rovnost_factions",
    "Faction sigils",
    "campaigns/rovnost-shadows/faction-sigils.png",
    "image/png",
    94000,
    1200,
    900,
    "A sheet of Rovnost faction sigils",
    "Player-facing sigil reference.",
    "player",
  ],
  [
    "asset_astril_map",
    "Astril map",
    "campaigns/rovnost-shadows/astril-map.webp",
    "image/webp",
    168000,
    1600,
    1000,
    "Map of Astril and the trade routes around Rovnost",
    "Regional map for travel planning.",
    "player",
  ],
  [
    "asset_skywright_sigil",
    "Skywright sigil",
    "campaigns/rovnost-shadows/skywright-sigil.png",
    "image/png",
    42000,
    512,
    512,
    "Skywright guild sigil",
    "Faction sigil for the Skywrights.",
    "player",
  ],
];

const campaignWikiPages: CampaignWikiPageSeed[] = [
  [
    "wiki_rovnost_overview",
    "rovnost-shadows-overview",
    "Rovnost Shadows Overview",
    "campaign",
    JSON.stringify(["overview", "player-facing"]),
    "player",
    "# Rovnost Shadows\n\nRovnost is a city of smoke, ambition, and hungry machinery.\n\n**What everyone knows**\n\n- The rail syndicates own more streets than the council admits.\n- The Skywrights sell miracles by altitude and invoice.\n\n***\n\n_The city looks up when it is afraid._",
    "asset_rovnost_cover",
    "Rovnost player blurb",
    "docs/rovnost/overview.md",
  ],
  [
    "wiki_rovnost_factions",
    "factions-guide",
    "Factions Guide",
    "faction",
    JSON.stringify(["factions", "player-facing"]),
    "player",
    "# Factions Guide\n\n**The Skywrights**\n\n- Control the air docks above Astril Gate.\n- Mark their engines with a blue wing sigil.\n\n![Skywright sigil](asset:asset_skywright_sigil)\n\n---\n\n**The Ash Ledger**\n\nA banking house that prefers its debts hereditary.",
    "asset_rovnost_factions",
    "Rovnost factions guide",
    "docs/rovnost/factions.md",
  ],
  [
    "wiki_rovnost_opening_teaser",
    "opening-teaser",
    "Opening Teaser",
    "lore",
    JSON.stringify(["teaser", "player-facing"]),
    "player",
    "# Opening Teaser\n\n_The first explosion is polite enough to wait until after the speech._\n\nA brass courier presses a sealed card into your hand as the station bells begin to stutter.",
    null,
    "Rovnost opening teaser",
    "docs/rovnost/opening-teaser.md",
  ],
  [
    "wiki_rovnost_session_zero",
    "session-zero-kit",
    "Session Zero Kit",
    "session",
    JSON.stringify(["session-zero", "safety"]),
    "player",
    "# Session Zero Kit\n\n**Campaign promises**\n\n- Intrigue in public places.\n- Consequences that follow the characters home.\n- Time for character ties before the blades come out.",
    null,
    "Rovnost session zero kit",
    "docs/rovnost/session-zero-kit.md",
  ],
  [
    "wiki_astril_map",
    "astril-map",
    "Astril Map",
    "location",
    JSON.stringify(["map", "astril"]),
    "player",
    "# Astril Map\n\nAstril sits east of Rovnost, where the river breaks into crane yards and slate-roofed counting houses.",
    "asset_astril_map",
    "Astril map",
    "docs/rovnost/astril-map.md",
  ],
  [
    "wiki_rovnost_gm_dossier",
    "gm-dossier",
    "Rovnost GM Dossier",
    "lore",
    JSON.stringify(["gm", "secrets"]),
    "game_master",
    "Magister Vallen is watching the faction pressure build.",
    "asset_magister_vallen",
    "Rovnost GM dossier",
    "docs/rovnost/gm-dossier.md",
  ],
];

const campaignWikiPageAssets: CampaignWikiPageAssetSeed[] = [
  ["wiki_rovnost_factions", "asset_skywright_sigil", "inline", 10],
  ["wiki_rovnost_factions", "asset_rovnost_factions", "gallery", 10],
  ["wiki_astril_map", "asset_astril_map", "gallery", 10],
];

const campaignSessions: CampaignSessionSeed[] = [
  [
    "session_rovnost_zero",
    "session-zero",
    "Session Zero",
    "2026-05-24",
    "Agree table tone, character ties, and safety tools.",
    "Review lines, veils, table logistics, and starting faction hooks.",
    "player",
    "user_game_master",
    "",
  ],
  [
    "session_rovnost_gm_fronts",
    "gm-fronts",
    "GM Fronts",
    null,
    "Private pressure map for the campaign opening.",
    "Track faction clocks, the search for Lynott, and Magister Vallen's first move.",
    "game_master",
    "user_game_master",
    "",
  ],
];

const campaignFactions: CampaignFactionSeed[] = [
  [
    "faction_council_of_magisters",
    "council-of-magisters",
    "Council of Magisters",
    "Arcane governors who keep Rovnost's industrial magic licensed and expensive.",
    "Respectable, remote, and feared by anyone who has seen a licence revoked.",
    "Which law have you bent to survive their scrutiny?",
    JSON.stringify(["A junior magistrate is quietly selling stamped exemptions."]),
    "",
    null,
    10,
  ],
  [
    "faction_steel_hand",
    "steel-hand",
    "Steel Hand",
    "Militarised industrial enforcers with contracts across the factory districts.",
    "Orderly, brutal, and usually present before the smoke clears.",
    "Who in the Steel Hand remembers your face?",
    JSON.stringify(["They know every factory gate and every shift boss."]),
    "",
    null,
    20,
  ],
  [
    "faction_discontents",
    "discontents",
    "Discontents",
    "Workers, deserters, and organisers trying to loosen the city's grip.",
    "Dangerous agitators to the powerful; neighbours and cousins to everyone else.",
    "Who in the factory districts still trusts you?",
    JSON.stringify(["They can hide someone for a night, but not for free."]),
    "",
    null,
    30,
  ],
  [
    "faction_black_market",
    "black-market",
    "Black Market",
    "Brokers of weapons, papers, medical favours, and things better left unnamed.",
    "Useful until the debt is called in.",
    "What did you buy that you could not get legally?",
    JSON.stringify(["A forged recommendation can be traced if someone knows the paper stock."]),
    "",
    null,
    40,
  ],
  [
    "faction_tidebound",
    "tidebound",
    "Tidebound",
    "Dockside crews, smugglers, fishers, and canal pilots who move what the city needs.",
    "Rough, practical, and hard to police once the fog rolls in.",
    "Who got you across the water when the streets were watched?",
    JSON.stringify(["The canals have old maintenance routes below the official locks."]),
    "",
    null,
    50,
  ],
  [
    "faction_skywright_guild",
    "skywright-guild",
    "Skywright Guild",
    "Artisans and engineers who build the lifts, cranes, and impossible roofs of Rovnost.",
    "Brilliant, proud, and very aware that the city cannot rise without them.",
    "What did you repair that should have stayed broken?",
    JSON.stringify(["A guild surveyor saw something moving above the old observatory."]),
    "",
    null,
    60,
  ],
];

const characterFactionChoices: CharacterFactionChoiceSeed[] = [
  [
    "character_lynott_magulbisson",
    "faction_discontents",
    "Factory district sympathies make the Discontents the safest first whisper network.",
  ],
  [
    "character_mira_voss",
    "faction_skywright_guild",
    "Mira owes the guild for access to rooftop shrines and lift machinery.",
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
    ["campaign_rovnost_shadows", "user_mira_player", "player"],
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
      "character_mira_voss",
      "mira-voss",
      "user_mira_player",
      "campaign_rovnost_shadows",
      "Mira Voss",
      "Human",
      "Acolyte",
      "Lawful Good",
      1,
      2,
      12,
      1,
      30,
      9,
      9,
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

  database.run(
    "insert or ignore into character_classes (id, character_id, class_name, subclass_name, level, hit_dice, spellcasting_ability) values (?, ?, ?, ?, ?, ?, ?)",
    [
      "class_mira_cleric",
      "character_mira_voss",
      "Cleric",
      null,
      1,
      "1d8",
      "wisdom",
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

  for (const asset of campaignImageAssets) {
    database.run(
      `insert into campaign_image_assets (id, campaign_id, title, storage_key, mime_type, byte_size, width, height, alt_text, caption, visibility)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         title = excluded.title,
         storage_key = excluded.storage_key,
         mime_type = excluded.mime_type,
         byte_size = excluded.byte_size,
         width = excluded.width,
         height = excluded.height,
         alt_text = excluded.alt_text,
         caption = excluded.caption,
         visibility = excluded.visibility,
         updated_at = CURRENT_TIMESTAMP`,
      [asset[0], "campaign_rovnost_shadows", ...asset.slice(1)],
    );
  }

  for (const page of campaignWikiPages) {
    database.run(
      `insert into campaign_wiki_pages (id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown, cover_image_asset_id, source_title, source_path)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         slug = excluded.slug,
         title = excluded.title,
         page_type = excluded.page_type,
         tags_json = excluded.tags_json,
         visibility = excluded.visibility,
         body_markdown = excluded.body_markdown,
         cover_image_asset_id = excluded.cover_image_asset_id,
         source_title = excluded.source_title,
         source_path = excluded.source_path,
         updated_at = CURRENT_TIMESTAMP`,
      [page[0], "campaign_rovnost_shadows", ...page.slice(1)],
    );
  }

  for (const attachment of campaignWikiPageAssets) {
    database.run(
      `insert into campaign_wiki_page_assets (wiki_page_id, image_asset_id, attachment_type, sort_order)
       values (?, ?, ?, ?)
       on conflict(wiki_page_id, image_asset_id, attachment_type) do update set
         sort_order = excluded.sort_order`,
      attachment,
    );
  }

  for (const session of campaignSessions) {
    database.run(
      `insert into campaign_sessions (id, campaign_id, slug, title, session_date, summary, body, visibility, created_by_user_id, notes)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         slug = excluded.slug,
         title = excluded.title,
         session_date = excluded.session_date,
         summary = excluded.summary,
         body = excluded.body,
         visibility = excluded.visibility,
         created_by_user_id = excluded.created_by_user_id,
         notes = excluded.notes,
         updated_at = CURRENT_TIMESTAMP`,
      [session[0], "campaign_rovnost_shadows", ...session.slice(1)],
    );
  }

  for (const faction of campaignFactions) {
    database.run(
      `insert into campaign_factions (id, campaign_id, slug, name, summary, public_reputation, player_prompt, rumours_json, gm_notes, image_asset_id, sort_order)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         slug = excluded.slug,
         name = excluded.name,
         summary = excluded.summary,
         public_reputation = excluded.public_reputation,
         player_prompt = excluded.player_prompt,
         rumours_json = excluded.rumours_json,
         gm_notes = excluded.gm_notes,
         image_asset_id = excluded.image_asset_id,
         sort_order = excluded.sort_order,
         updated_at = CURRENT_TIMESTAMP`,
      [faction[0], "campaign_rovnost_shadows", ...faction.slice(1)],
    );
  }

  for (const choice of characterFactionChoices) {
    database.run(
      `insert into character_faction_choices (character_id, faction_id, connection_note)
       values (?, ?, ?)
       on conflict(character_id) do update set
         faction_id = excluded.faction_id,
         connection_note = excluded.connection_note,
         updated_at = CURRENT_TIMESTAMP`,
      choice,
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
