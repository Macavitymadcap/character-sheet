import { afterEach, describe, expect, test } from "bun:test";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "./sqlite";

let runtime: SqliteDatabaseRuntime | undefined;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

describe("SQLite repositories", () => {
  test("seeds the MVP users idempotently", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    runtime.seed();
    const users = runtime.repositories.authRepository.listUsers();

    expect(users).toEqual([
      {
        displayName: "Lynott Player",
        email: "lynott.player@example.local",
        id: "user_lynott_player",
        role: "player",
        status: "active",
      },
      {
        displayName: "Campaign GM",
        email: "gm@example.local",
        id: "user_game_master",
        role: "game_master",
        status: "active",
      },
      {
        displayName: "Site Admin",
        email: "admin@example.local",
        id: "user_site_admin",
        role: "admin",
        status: "active",
      },
    ]);
  });

  test("reads Lynott's seeded sheet summary", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const sheet = runtime.repositories.characterRepository.getSheetBySlug("lynott-magulbisson");
    const sheetById = runtime.repositories.characterRepository.getSheetById(
      "character_lynott_magulbisson",
    );

    expect(sheet).toMatchObject({
      armourClass: 17,
      background: "Special Operations",
      hitPoints: { current: 31, max: 31, temporary: 0 },
      id: "character_lynott_magulbisson",
      initiative: 3,
      level: 4,
      name: "Lynott Magulbisson",
      proficiencyBonus: 2,
      slug: "lynott-magulbisson",
      species: "Hobgoblin",
      speedFeet: 30,
    });
    expect(sheetById?.slug).toBe("lynott-magulbisson");
    expect(sheet?.classes).toEqual([
      {
        className: "Artificer",
        hitDice: "4d8",
        level: 4,
        spellcastingAbility: "intelligence",
        subclassName: "Artillerist",
      },
    ]);
    expect(sheet?.abilities).toEqual([
      {
        ability: "strength",
        modifier: -1,
        saveModifier: -1,
        saveProficient: false,
        score: 8,
      },
      {
        ability: "dexterity",
        modifier: 3,
        saveModifier: 3,
        saveProficient: false,
        score: 16,
      },
      {
        ability: "constitution",
        modifier: 1,
        saveModifier: 3,
        saveProficient: true,
        score: 13,
      },
      {
        ability: "intelligence",
        modifier: 4,
        saveModifier: 6,
        saveProficient: true,
        score: 18,
      },
      {
        ability: "wisdom",
        modifier: 1,
        saveModifier: 1,
        saveProficient: false,
        score: 12,
      },
      {
        ability: "charisma",
        modifier: 0,
        saveModifier: 0,
        saveProficient: false,
        score: 10,
      },
    ]);
    expect(sheet?.skills).toEqual([
      { ability: "charisma", modifier: 2, proficiencyLevel: 1, skill: "deception" },
      { ability: "intelligence", modifier: 6, proficiencyLevel: 1, skill: "investigation" },
      { ability: "wisdom", modifier: 3, proficiencyLevel: 1, skill: "perception" },
      { ability: "dexterity", modifier: 5, proficiencyLevel: 1, skill: "stealth" },
    ]);
  });

  test("reads resources for Lynott", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const resources = runtime.repositories.characterRepository.listResources(
      "character_lynott_magulbisson",
    );

    expect(resources).toEqual([
      {
        current: 31,
        id: "resource_lynott_hit_points",
        key: "hit_points",
        label: "Hit points",
        max: 31,
        type: "hit_points",
      },
      {
        current: 0,
        id: "resource_lynott_temporary_hit_points",
        key: "temporary_hit_points",
        label: "Temporary hit points",
        max: 0,
        type: "temporary_hit_points",
      },
      {
        current: 4,
        id: "resource_lynott_hit_dice",
        key: "hit_dice_d8",
        label: "Hit dice d8",
        max: 4,
        type: "hit_dice",
      },
      {
        current: 3,
        id: "resource_lynott_spell_slots_1",
        key: "spell_slots_1",
        label: "1st-level spell slots",
        max: 3,
        type: "spell_slot",
      },
    ]);
  });

  test("filters note visibility by viewer role", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const notes = runtime.repositories.notesRepository;

    expect(notes.listNotesForCharacter("character_lynott_magulbisson", "player")).toEqual([
      {
        body: "Keep the false identities ready and weapons maintained.",
        id: "note_lynott_player",
        title: "Player notes",
        visibility: "player",
      },
    ]);
    expect(notes.listNotesForCharacter("character_lynott_magulbisson", "game_master")).toEqual([
      {
        body: "Keep the false identities ready and weapons maintained.",
        id: "note_lynott_player",
        title: "Player notes",
        visibility: "player",
      },
      {
        body: "Sergeant Kora Steelheart is likely coordinating the search.",
        id: "note_lynott_gm",
        title: "Game Master notes",
        visibility: "game_master",
      },
    ]);
  });

  test("reads campaign and starter rules references", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });

    expect(runtime.repositories.campaignRepository.getCampaignBySlug("rovnost-shadows")).toEqual({
      gmUserId: "user_game_master",
      id: "campaign_rovnost_shadows",
      name: "Rovnost Shadows",
      slug: "rovnost-shadows",
    });
    expect(
      runtime.repositories.rulesRepository.listRuleLinksForCharacter("character_lynott_magulbisson"),
    ).toEqual([
      {
        entityName: "Enhanced Defence",
        entityType: "infusion",
        prepared: false,
        selected: true,
        selectionType: "active_infusion",
        sourceName: "Tasha's Cauldron of Everything",
      },
      {
        entityName: "Repeating Shot",
        entityType: "infusion",
        prepared: false,
        selected: true,
        selectionType: "active_infusion",
        sourceName: "Tasha's Cauldron of Everything",
      },
      {
        entityName: "Mage Hand",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "known_cantrip",
        sourceName: "Player's Handbook",
      },
    ]);
  });
});
