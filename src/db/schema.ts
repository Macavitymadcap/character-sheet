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

CREATE TABLE IF NOT EXISTS campaign_sessions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  session_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  category TEXT NOT NULL CHECK (category IN ('armour', 'language', 'tool', 'training', 'weapon')),
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

CREATE TABLE IF NOT EXISTS character_notes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  visibility TEXT NOT NULL CHECK (visibility IN ('player', 'game_master')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rules_sources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  precedence INTEGER NOT NULL DEFAULT 0
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

export const bootstrapDatabase = (database: Database) => {
  database.run("PRAGMA foreign_keys = ON");
  database.exec(schema);
};
