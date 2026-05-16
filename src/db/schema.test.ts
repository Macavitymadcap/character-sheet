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
      "campaign_members",
      "campaign_sessions",
      "campaigns",
      "character_abilities",
      "character_classes",
      "character_equipment",
      "character_notes",
      "character_resources",
      "character_rule_links",
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
  });
});
