import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { bootstrapDatabase } from "./schema";

let database: Database;

beforeEach(() => {
  database = new Database(":memory:");
});

afterEach(() => {
  database.close();
});

const tableNames = () =>
  database
    .query<{ name: string }, []>(
      "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name",
    )
    .all()
    .map((row) => row.name);

describe("bootstrapDatabase", () => {
  test("creates the MVP schema and can be run repeatedly", () => {
    bootstrapDatabase(database);
    bootstrapDatabase(database);

    expect(tableNames()).toEqual([
      "campaign_factions",
      "campaign_image_assets",
      "campaign_members",
      "campaign_sessions",
      "campaign_wiki_page_assets",
      "campaign_wiki_pages",
      "campaigns",
      "character_abilities",
      "character_armour_class_sources",
      "character_background_entries",
      "character_classes",
      "character_defences",
      "character_equipment",
      "character_faction_choices",
      "character_notes",
      "character_proficiencies",
      "character_resources",
      "character_rule_links",
      "character_senses",
      "character_skills",
      "characters",
      "invites",
      "password_reset_tokens",
      "rule_mechanics",
      "rules_entities",
      "rules_sources",
      "sessions",
      "users",
    ]);
  });

  test("enforces key data constraints", () => {
    bootstrapDatabase(database);
    database.run(
      "insert into users (id, email, display_name, role, password_hash) values (?, ?, ?, ?, ?)",
      ["user_1", "player@example.test", "Player", "player", "hash"],
    );
    database.run(
      "insert into campaigns (id, slug, name, gm_user_id) values (?, ?, ?, ?)",
      ["campaign_1", "campaign", "Campaign", "user_1"],
    );

    expect(() =>
      database.run(
        "insert into users (id, email, display_name, role, password_hash) values (?, ?, ?, ?, ?)",
        ["user_2", "player@example.test", "Duplicate", "player", "hash"],
      ),
    ).toThrow();
    expect(() =>
      database.run(
        "insert into users (id, email, display_name, role, password_hash) values (?, ?, ?, ?, ?)",
        ["user_3", "invalid@example.test", "Invalid", "wizard", "hash"],
      ),
    ).toThrow();
    expect(() =>
      database.run(
        "insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "character_1",
          "missing-owner",
          null,
          "campaign_1",
          "Missing Owner",
          "Hobgoblin",
          "Special Operations",
          4,
          2,
          17,
          3,
          30,
          31,
          31,
        ],
      ),
    ).toThrow();

    database.run(
      "insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "character_2",
        "lynott",
        "user_1",
        "campaign_1",
        "Lynott",
        "Hobgoblin",
        "Special Operations",
        4,
        2,
        17,
        3,
        30,
        31,
        31,
      ],
    );
    expect(() =>
      database.run(
        "insert into character_resources (id, character_id, resource_key, resource_type, label, current_value, max_value) values (?, ?, ?, ?, ?, ?, ?)",
        ["resource_1", "character_2", "hp", "hit_points", "Hit points", -1, 31],
      ),
    ).toThrow();
    expect(() =>
      database.run(
        "insert into character_proficiencies (id, character_id, category, name) values (?, ?, ?, ?)",
        ["proficiency_1", "character_2", "colour", "Blue"],
      ),
    ).toThrow();
    expect(() =>
      database.run(
        "insert into character_background_entries (id, character_id, category, title, body) values (?, ?, ?, ?, ?)",
        ["background_1", "character_2", "rumour", "Rumour", "Unsupported category."],
      ),
    ).toThrow();
  });

  test("enforces group-use campaign constraints", () => {
    bootstrapDatabase(database);
    for (const user of [
      ["user_gm", "gm@example.test", "GM", "game_master"],
      ["user_player", "player@example.test", "Player", "player"],
    ]) {
      database.run(
        "insert into users (id, email, display_name, role, password_hash) values (?, ?, ?, ?, 'hash')",
        user,
      );
    }
    for (const campaign of [
      ["campaign_1", "campaign-one", "Campaign One", "user_gm"],
      ["campaign_2", "campaign-two", "Campaign Two", "user_gm"],
    ]) {
      database.run(
        "insert into campaigns (id, slug, name, gm_user_id) values (?, ?, ?, ?)",
        campaign,
      );
    }
    database.run(
      "insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "character_1",
        "shared-slug",
        "user_player",
        "campaign_1",
        "One",
        "Human",
        "Acolyte",
        1,
        2,
        12,
        1,
        30,
        9,
        9,
      ],
    );
    expect(() =>
      database.run(
        "insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "character_2",
          "shared-slug",
          "user_player",
          "campaign_2",
          "Two",
          "Human",
          "Acolyte",
          1,
          2,
          12,
          1,
          30,
          9,
          9,
        ],
      ),
    ).not.toThrow();
    expect(() =>
      database.run(
        "insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "character_3",
          "shared-slug",
          "user_player",
          "campaign_1",
          "Three",
          "Human",
          "Acolyte",
          1,
          2,
          12,
          1,
          30,
          9,
          9,
        ],
      ),
    ).toThrow();

    expect(() =>
      database.run(
        "insert into campaign_image_assets (id, campaign_id, storage_key, mime_type, byte_size, width, height, alt_text, visibility) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "asset_bad_path",
          "campaign_1",
          "/Users/dank/source-map.png",
          "image/png",
          1024,
          640,
          480,
          "Absolute path",
          "player",
        ],
      ),
    ).toThrow();
    database.run(
      "insert into campaign_image_assets (id, campaign_id, storage_key, mime_type, byte_size, width, height, alt_text, visibility) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "asset_1",
        "campaign_1",
        "campaigns/campaign-one/map.png",
        "image/png",
        1024,
        640,
        480,
        "Campaign map",
        "player",
      ],
    );

    database.run(
      "insert into campaign_wiki_pages (id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown, source_title) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "wiki_1",
        "campaign_1",
        "overview",
        "Overview",
        "campaign",
        '["overview"]',
        "player",
        "# Overview",
        "Overview source",
      ],
    );
    expect(() =>
      database.run(
        "insert into campaign_wiki_pages (id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown) values (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "wiki_duplicate",
          "campaign_1",
          "overview",
          "Duplicate",
          "campaign",
          "[]",
          "player",
          "# Duplicate",
        ],
      ),
    ).toThrow();
    expect(() =>
      database.run(
        "insert into campaign_wiki_pages (id, campaign_id, slug, title, page_type, tags_json, visibility, body_markdown) values (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "wiki_bad_visibility",
          "campaign_1",
          "secret",
          "Secret",
          "campaign",
          "[]",
          "public",
          "# Secret",
        ],
      ),
    ).toThrow();

    database.run(
      "insert into campaign_factions (id, campaign_id, slug, name, summary, public_reputation, player_prompt, rumours_json, image_asset_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "faction_1",
        "campaign_1",
        "steel-hand",
        "Steel Hand",
        "Industrial enforcers.",
        "Feared.",
        "Who do you owe?",
        '["They know every factory gate."]',
        "asset_1",
      ],
    );
    database.run(
      "insert into character_faction_choices (character_id, faction_id, connection_note) values (?, ?, ?)",
      ["character_1", "faction_1", "Old trouble."],
    );
    expect(() =>
      database.run(
        "insert into character_faction_choices (character_id, faction_id, connection_note) values (?, ?, ?)",
        ["character_1", "faction_1", "Second primary choice."],
      ),
    ).toThrow();
  });
});
