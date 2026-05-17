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
        email: "lynott@example.local",
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
    const sheet = runtime.repositories.characterRepository.getSheetBySlug("lynott");
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
      slug: "lynott",
      species: "Hobgoblin",
      speedFeet: 30,
    });
    expect(sheetById?.slug).toBe("lynott");
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
      { ability: "dexterity", modifier: 3, proficiencyLevel: 0, skill: "acrobatics" },
      { ability: "wisdom", modifier: 1, proficiencyLevel: 0, skill: "animal handling" },
      { ability: "intelligence", modifier: 4, proficiencyLevel: 0, skill: "arcana" },
      { ability: "strength", modifier: -1, proficiencyLevel: 0, skill: "athletics" },
      { ability: "charisma", modifier: 2, proficiencyLevel: 1, skill: "deception" },
      { ability: "intelligence", modifier: 4, proficiencyLevel: 0, skill: "history" },
      { ability: "wisdom", modifier: 1, proficiencyLevel: 0, skill: "insight" },
      { ability: "charisma", modifier: 0, proficiencyLevel: 0, skill: "intimidation" },
      { ability: "intelligence", modifier: 6, proficiencyLevel: 1, skill: "investigation" },
      { ability: "wisdom", modifier: 1, proficiencyLevel: 0, skill: "medicine" },
      { ability: "intelligence", modifier: 4, proficiencyLevel: 0, skill: "nature" },
      { ability: "wisdom", modifier: 3, proficiencyLevel: 1, skill: "perception" },
      { ability: "charisma", modifier: 0, proficiencyLevel: 0, skill: "performance" },
      { ability: "charisma", modifier: 0, proficiencyLevel: 0, skill: "persuasion" },
      { ability: "intelligence", modifier: 4, proficiencyLevel: 0, skill: "religion" },
      { ability: "dexterity", modifier: 3, proficiencyLevel: 0, skill: "sleight of hand" },
      { ability: "dexterity", modifier: 5, proficiencyLevel: 1, skill: "stealth" },
      { ability: "wisdom", modifier: 1, proficiencyLevel: 0, skill: "survival" },
    ]);
    expect(sheet?.senses).toEqual([
      { label: "Darkvision", value: "60 ft" },
      { label: "Passive perception", value: "13" },
      { label: "Passive investigation", value: "16" },
    ]);
    expect(sheet?.armourClassBreakdown).toEqual([
      { label: "Breastplate", notes: "Medium armour base AC.", value: 14 },
      { label: "Dexterity bonus", notes: "Breastplate maximum Dexterity bonus.", value: 2 },
      { label: "Enhanced Defence", notes: "Active armour infusion.", value: 1 },
    ]);
    expect(sheet?.defences).toEqual([
      { detail: "Breastplate with Enhanced Defence infusion.", label: "Armour", type: "armour" },
      { detail: "None currently recorded.", label: "Resistances", type: "resistance" },
      { detail: "None currently recorded.", label: "Immunities", type: "immunity" },
      {
        detail: "None currently recorded.",
        label: "Condition immunities",
        type: "condition_immunity",
      },
    ]);
    expect(sheet?.proficiencies).toEqual([
      { category: "armour", detail: "Artificer training.", name: "Light armour" },
      { category: "armour", detail: "Artificer training.", name: "Medium armour" },
      { category: "armour", detail: "Artificer training.", name: "Shields" },
      { category: "weapon", detail: "Artificer training.", name: "Simple weapons" },
      { category: "weapon", detail: "Artificer training and campaign exposure.", name: "Firearms" },
      { category: "tool", detail: "Artificer training.", name: "Thieves' tools" },
      { category: "tool", detail: "Artificer training.", name: "Tinker's tools" },
      { category: "tool", detail: "Artificer artisan tool choice.", name: "Smith's tools" },
      { category: "tool", detail: "Artillerist specialist training.", name: "Woodcarver's tools" },
      { category: "tool", detail: "Special Operations background.", name: "Disguise kit" },
      { category: "tool", detail: "Special Operations background.", name: "Forgery kit" },
      { category: "language", detail: "Known language.", name: "Common" },
      { category: "language", detail: "Known language.", name: "Goblin" },
      {
        category: "language",
        detail: "To be determined by campaign setting.",
        name: "Additional background language",
      },
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
        max: null,
        type: "temporary_hit_points",
      },
      {
        current: 0,
        id: "resource_lynott_inspiration",
        key: "inspiration",
        label: "Inspiration",
        max: 1,
        type: "inspiration",
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

  test("updates resources and mirrors hit point fields on the sheet summary", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const characters = runtime.repositories.characterRepository;

    const hitPoints = characters.updateResourceCurrent(
      "character_lynott_magulbisson",
      "resource_lynott_hit_points",
      40,
    );
    const temporaryHitPoints = characters.updateResourceCurrent(
      "character_lynott_magulbisson",
      "resource_lynott_temporary_hit_points",
      6,
    );
    const inspiration = characters.updateResourceCurrent(
      "character_lynott_magulbisson",
      "resource_lynott_inspiration",
      2,
    );
    const sheet = characters.getSheetById("character_lynott_magulbisson");

    expect(hitPoints?.current).toBe(31);
    expect(temporaryHitPoints?.current).toBe(6);
    expect(inspiration?.current).toBe(1);
    expect(sheet?.hitPoints).toEqual({ current: 31, max: 31, temporary: 6 });
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
