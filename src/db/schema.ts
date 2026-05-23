import type { Database } from "bun:sqlite";

const schema = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('player', 'game_master', 'admin')),
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_capabilities (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capability TEXT NOT NULL CHECK (capability IN ('admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, capability)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('player', 'game_master', 'admin')),
  token_hash TEXT NOT NULL UNIQUE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gm_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('player', 'game_master')),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS campaign_image_assets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  storage_key TEXT NOT NULL UNIQUE CHECK (
    storage_key <> ''
    AND storage_key NOT LIKE '/%'
    AND storage_key NOT LIKE '%..%'
    AND storage_key NOT LIKE '%:%'
  ),
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL DEFAULT 0 CHECK (byte_size >= 0),
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'player' CHECK (visibility IN ('player', 'game_master')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_sessions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  session_date TEXT,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'player' CHECK (visibility IN ('player', 'game_master')),
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, slug)
);

CREATE TABLE IF NOT EXISTS campaign_wiki_pages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (
    page_type IN ('campaign', 'faction', 'location', 'lore', 'npc', 'session')
  ),
  tags_json TEXT NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'player' CHECK (visibility IN ('player', 'game_master')),
  body_markdown TEXT NOT NULL,
  cover_image_asset_id TEXT REFERENCES campaign_image_assets(id) ON DELETE SET NULL,
  source_title TEXT,
  source_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, slug)
);

CREATE TABLE IF NOT EXISTS campaign_wiki_page_assets (
  wiki_page_id TEXT NOT NULL REFERENCES campaign_wiki_pages(id) ON DELETE CASCADE,
  image_asset_id TEXT NOT NULL REFERENCES campaign_image_assets(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('inline', 'gallery')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (wiki_page_id, image_asset_id, attachment_type)
);

CREATE TABLE IF NOT EXISTS campaign_npcs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'game_master' CHECK (visibility IN ('player', 'game_master')),
  public_summary TEXT NOT NULL DEFAULT '',
  gm_notes TEXT NOT NULL DEFAULT '',
  secrets TEXT NOT NULL DEFAULT '',
  motivations TEXT NOT NULL DEFAULT '',
  hooks TEXT NOT NULL DEFAULT '',
  scene_notes TEXT NOT NULL DEFAULT '',
  reveal_notes TEXT NOT NULL DEFAULT '',
  portrait_image_asset_id TEXT REFERENCES campaign_image_assets(id) ON DELETE SET NULL,
  public_wiki_page_id TEXT REFERENCES campaign_wiki_pages(id) ON DELETE SET NULL,
  rules_entity_id TEXT REFERENCES rules_entities(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, slug)
);

CREATE TABLE IF NOT EXISTS campaign_factions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  motto TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  public_reputation TEXT NOT NULL DEFAULT '',
  player_prompt TEXT NOT NULL DEFAULT '',
  connections_json TEXT NOT NULL DEFAULT '[]',
  rumours_json TEXT NOT NULL DEFAULT '[]',
  gm_notes TEXT NOT NULL DEFAULT '',
  image_asset_id TEXT REFERENCES campaign_image_assets(id) ON DELETE SET NULL,
  wiki_page_id TEXT REFERENCES campaign_wiki_pages(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, slug)
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  background TEXT NOT NULL,
  alignment TEXT,
  level INTEGER NOT NULL CHECK (level >= 1),
  proficiency_bonus INTEGER NOT NULL CHECK (proficiency_bonus >= 0),
  armour_class INTEGER NOT NULL CHECK (armour_class >= 0),
  initiative INTEGER NOT NULL,
  speed_ft INTEGER NOT NULL CHECK (speed_ft >= 0),
  hit_point_max INTEGER NOT NULL CHECK (hit_point_max >= 0),
  hit_point_current INTEGER NOT NULL CHECK (hit_point_current >= 0),
  temporary_hit_points INTEGER NOT NULL DEFAULT 0 CHECK (temporary_hit_points >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, slug)
);

CREATE TABLE IF NOT EXISTS character_classes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  subclass_name TEXT,
  level INTEGER NOT NULL CHECK (level >= 1),
  hit_dice TEXT NOT NULL,
  spellcasting_ability TEXT CHECK (
    spellcasting_ability IS NULL
    OR spellcasting_ability IN ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')
  )
);

CREATE TABLE IF NOT EXISTS character_abilities (
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  ability TEXT NOT NULL CHECK (ability IN ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 30),
  modifier INTEGER NOT NULL,
  save_proficient INTEGER NOT NULL CHECK (save_proficient IN (0, 1)),
  save_modifier INTEGER NOT NULL,
  PRIMARY KEY (character_id, ability)
);

CREATE TABLE IF NOT EXISTS character_skills (
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  ability TEXT NOT NULL CHECK (ability IN ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')),
  proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 0 AND 2),
  modifier INTEGER NOT NULL,
  PRIMARY KEY (character_id, skill)
);

CREATE TABLE IF NOT EXISTS character_senses (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_armour_class_sources (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_defences (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  defence_type TEXT NOT NULL CHECK (defence_type IN ('armour', 'condition_immunity', 'immunity', 'resistance')),
  label TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_proficiencies (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('armour', 'language', 'tool', 'weapon')),
  name TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_resources (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (
    resource_type IN ('condition', 'feature_use', 'hit_dice', 'hit_points', 'inspiration', 'spell_slot', 'temporary_hit_points')
  ),
  label TEXT NOT NULL,
  current_value INTEGER NOT NULL CHECK (current_value >= 0),
  max_value INTEGER CHECK (max_value IS NULL OR max_value >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (character_id, resource_key)
);

CREATE TABLE IF NOT EXISTS character_equipment (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  equipped INTEGER NOT NULL DEFAULT 0 CHECK (equipped IN (0, 1)),
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS character_background_entries (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN ('backstory', 'bond', 'false_identity', 'flaw', 'ideal', 'npc', 'personality', 'rank')
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_notes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  visibility TEXT NOT NULL CHECK (visibility IN ('player', 'game_master')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_faction_choices (
  character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  faction_id TEXT REFERENCES campaign_factions(id) ON DELETE CASCADE,
  connection_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rules_sources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  content_category TEXT NOT NULL DEFAULT 'third_party' CHECK (content_category IN ('srd', 'local', 'third_party')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'campaign')),
  public_export_eligible INTEGER NOT NULL DEFAULT 0 CHECK (public_export_eligible IN (0, 1)),
  precedence INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campaign_rules_sources (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES rules_sources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id, source_id)
);

CREATE TABLE IF NOT EXISTS rules_entities (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES rules_sources(id),
  slug TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (source_id, entity_type, slug)
);

CREATE TABLE IF NOT EXISTS rule_mechanics (
  id TEXT PRIMARY KEY,
  rules_entity_id TEXT NOT NULL REFERENCES rules_entities(id) ON DELETE CASCADE,
  mechanic_type TEXT NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS character_rule_links (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  rules_entity_id TEXT NOT NULL REFERENCES rules_entities(id),
  selection_type TEXT NOT NULL,
  prepared INTEGER NOT NULL DEFAULT 0 CHECK (prepared IN (0, 1)),
  selected INTEGER NOT NULL DEFAULT 1 CHECK (selected IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (character_id, rules_entity_id, selection_type)
);
`;

const migrationStatements = [
  "ALTER TABLE campaign_sessions ADD COLUMN slug TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE campaign_sessions ADD COLUMN summary TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE campaign_sessions ADD COLUMN body TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE campaign_sessions ADD COLUMN visibility TEXT NOT NULL DEFAULT 'player'",
  "ALTER TABLE campaign_sessions ADD COLUMN created_by_user_id TEXT REFERENCES users(id)",
  "ALTER TABLE campaign_sessions ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE character_notes ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE campaign_image_assets ADD COLUMN title TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE campaign_wiki_pages ADD COLUMN cover_image_asset_id TEXT REFERENCES campaign_image_assets(id) ON DELETE SET NULL",
  "ALTER TABLE campaign_factions ADD COLUMN motto TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE campaign_factions ADD COLUMN connections_json TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE campaign_factions ADD COLUMN wiki_page_id TEXT REFERENCES campaign_wiki_pages(id) ON DELETE SET NULL",
  "ALTER TABLE rules_sources ADD COLUMN content_category TEXT NOT NULL DEFAULT 'third_party'",
  "ALTER TABLE rules_sources ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'",
  "ALTER TABLE rules_sources ADD COLUMN public_export_eligible INTEGER NOT NULL DEFAULT 0",
  "UPDATE rules_sources SET public_export_eligible = 1 WHERE content_category = 'srd'",
];

const triggers = /* sql */ `
CREATE TRIGGER IF NOT EXISTS character_faction_choices_campaign_insert
BEFORE INSERT ON character_faction_choices
FOR EACH ROW
WHEN (
  (SELECT campaign_id FROM characters WHERE id = NEW.character_id)
  !=
  (SELECT campaign_id FROM campaign_factions WHERE id = NEW.faction_id)
)
BEGIN
  SELECT RAISE(ABORT, 'character and faction must belong to the same campaign');
END;

CREATE TRIGGER IF NOT EXISTS character_faction_choices_campaign_update
BEFORE UPDATE OF faction_id ON character_faction_choices
FOR EACH ROW
WHEN (
  (SELECT campaign_id FROM characters WHERE id = NEW.character_id)
  !=
  (SELECT campaign_id FROM campaign_factions WHERE id = NEW.faction_id)
)
BEGIN
  SELECT RAISE(ABORT, 'character and faction must belong to the same campaign');
END;

CREATE TRIGGER IF NOT EXISTS campaign_npcs_links_campaign_insert
BEFORE INSERT ON campaign_npcs
FOR EACH ROW
WHEN (
  (
    NEW.portrait_image_asset_id IS NOT NULL
    AND (SELECT campaign_id FROM campaign_image_assets WHERE id = NEW.portrait_image_asset_id) != NEW.campaign_id
  )
  OR (
    NEW.public_wiki_page_id IS NOT NULL
    AND (SELECT campaign_id FROM campaign_wiki_pages WHERE id = NEW.public_wiki_page_id) != NEW.campaign_id
  )
  OR (
    NEW.rules_entity_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM rules_entities entities
      JOIN rules_sources sources ON sources.id = entities.source_id
      LEFT JOIN campaign_rules_sources campaign_sources ON campaign_sources.source_id = sources.id
      WHERE entities.id = NEW.rules_entity_id
        AND (sources.visibility = 'public' OR campaign_sources.campaign_id = NEW.campaign_id)
    )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'npc links must belong to the same campaign or a public rules source');
END;

CREATE TRIGGER IF NOT EXISTS campaign_npcs_links_campaign_update
BEFORE UPDATE OF portrait_image_asset_id, public_wiki_page_id, rules_entity_id, campaign_id ON campaign_npcs
FOR EACH ROW
WHEN (
  (
    NEW.portrait_image_asset_id IS NOT NULL
    AND (SELECT campaign_id FROM campaign_image_assets WHERE id = NEW.portrait_image_asset_id) != NEW.campaign_id
  )
  OR (
    NEW.public_wiki_page_id IS NOT NULL
    AND (SELECT campaign_id FROM campaign_wiki_pages WHERE id = NEW.public_wiki_page_id) != NEW.campaign_id
  )
  OR (
    NEW.rules_entity_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM rules_entities entities
      JOIN rules_sources sources ON sources.id = entities.source_id
      LEFT JOIN campaign_rules_sources campaign_sources ON campaign_sources.source_id = sources.id
      WHERE entities.id = NEW.rules_entity_id
        AND (sources.visibility = 'public' OR campaign_sources.campaign_id = NEW.campaign_id)
    )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'npc links must belong to the same campaign or a public rules source');
END;
`;

export const bootstrapDatabase = (database: Database) => {
  database.run("PRAGMA foreign_keys = ON");
  database.exec(schema);
  for (const statement of migrationStatements) {
    try {
      database.run(statement);
    } catch (error) {
      if (!isDuplicateColumnError(error)) throw error;
    }
  }
  relaxCharacterFactionChoiceFactionId(database);
  database.exec(triggers);
};

function isDuplicateColumnError(error: unknown) {
  return error instanceof Error && error.message.includes("duplicate column name");
}

function relaxCharacterFactionChoiceFactionId(database: Database) {
  const factionIdColumn = database
    .query<{ notnull: number; name: string }, []>("PRAGMA table_info(character_faction_choices)")
    .all()
    .find((column) => column.name === "faction_id");
  if (!factionIdColumn?.notnull) return;

  database.exec(/* sql */ `
    CREATE TABLE character_faction_choices_relaxed (
      character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
      faction_id TEXT REFERENCES campaign_factions(id) ON DELETE CASCADE,
      connection_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO character_faction_choices_relaxed (character_id, faction_id, connection_note, created_at, updated_at)
    SELECT character_id, faction_id, connection_note, created_at, updated_at
    FROM character_faction_choices;

    DROP TABLE character_faction_choices;
    ALTER TABLE character_faction_choices_relaxed RENAME TO character_faction_choices;
  `);
}
