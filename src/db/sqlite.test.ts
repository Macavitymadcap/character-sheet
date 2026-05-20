import { afterEach, describe, expect, test } from "bun:test";
import { RulesImportService } from "../rules";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "./sqlite";
import { standardCharacterResourceKeysForHitDie } from "./standard-resources";

let runtime: SqliteDatabaseRuntime | undefined;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

describe("SQLite repositories", () => {
  test("can bootstrap schema without seeding mutable data", () => {
    runtime = createSqliteDatabase({ path: ":memory:", seed: false });

    expect(runtime.repositories.authRepository.listUsers()).toEqual([]);
  });

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
        displayName: "Mira Player",
        email: "mira@example.local",
        id: "user_mira_player",
        role: "player",
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
    expect(sheet?.senses).toMatchObject([
      { label: "Darkvision", value: "60 ft" },
      { label: "Passive perception", value: "13" },
      { label: "Passive investigation", value: "16" },
    ]);
    expect(sheet?.armourClassBreakdown).toMatchObject([
      { label: "Breastplate", notes: "Medium armour base AC.", value: 14 },
      { label: "Dexterity bonus", notes: "Breastplate maximum Dexterity bonus.", value: 2 },
      { label: "Enhanced Defence", notes: "Active armour infusion.", value: 1 },
    ]);
    expect(sheet?.defences).toMatchObject([
      { detail: "Breastplate with Enhanced Defence infusion.", label: "Armour", type: "armour" },
      { detail: "None currently recorded.", label: "Resistances", type: "resistance" },
      { detail: "None currently recorded.", label: "Immunities", type: "immunity" },
      {
        detail: "None currently recorded.",
        label: "Condition immunities",
        type: "condition_immunity",
      },
    ]);
    expect(sheet?.proficiencies).toMatchObject([
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
      {
        current: 2,
        id: "resource_lynott_fey_gift",
        key: "fey_gift",
        label: "Fey Gift",
        max: 2,
        type: "feature_use",
      },
      {
        current: 2,
        id: "resource_lynott_fortune_from_the_many",
        key: "fortune_from_the_many",
        label: "Fortune from the Many",
        max: 2,
        type: "feature_use",
      },
      {
        current: 1,
        id: "resource_lynott_eldritch_cannon",
        key: "eldritch_cannon",
        label: "Eldritch Cannon",
        max: 1,
        type: "feature_use",
      },
    ]);
  });

  test("reads equipment for Lynott", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const characters = runtime.repositories.characterRepository;
    const equipment = characters.listEquipment("character_lynott_magulbisson");
    const updatedCoinPurse = characters.updateEquipmentItem(
      "character_lynott_magulbisson",
      "equipment_lynott_coin_purse",
      { quantity: 12 },
    );

    expect(equipment).toContainEqual({
      category: "money",
      equipped: false,
      id: "equipment_lynott_coin_purse",
      name: "Coin purse",
      notes: "Starting gold to be determined.",
      quantity: 0,
    });
    expect(equipment).toContainEqual({
      category: "armour",
      equipped: true,
      id: "equipment_lynott_breastplate",
      name: "Breastplate with Enhanced Defence infusion",
      notes: "AC 14 plus Dexterity modifier, improved by the active infusion.",
      quantity: 1,
    });
    expect(equipment).toContainEqual({
      category: "weapon",
      equipped: true,
      id: "equipment_lynott_pistol",
      name: "Pistol with Repeating Shot infusion",
      notes: "Range 30/90 ft., 1d10+4 magical piercing damage.",
      quantity: 1,
    });
    expect(equipment).toHaveLength(13);
    expect(updatedCoinPurse?.quantity).toBe(12);
  });

  test("reads Lynott's structured background entries", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const entries = runtime.repositories.characterRepository.listBackgroundEntries(
      "character_lynott_magulbisson",
    );

    expect(entries).toContainEqual({
      body: "Male human travelling tinker and independent contractor; friendly, skilled with tools, and carrying a forged recommendation.",
      category: "false_identity",
      id: "background_lynott_identity_jonas",
      title: "Jonas Blarendon",
    });
    expect(entries).toContainEqual({
      body: "Hobgoblin squad leader who gave the order to fire and likely leads the search for Lynott.",
      category: "npc",
      id: "background_lynott_npc_kora",
      title: "Sergeant Kora Steelheart",
    });
    expect(
      entries.find((entry) => entry.id === "background_lynott_backstory_artificers")?.body,
    ).toContain("We operated in the shadows");
    expect(entries.map((entry) => entry.category)).toContain("rank");
    expect(entries).toHaveLength(23);
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

  test("updates manual sheet fields and recalculates derived values", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const characters = runtime.repositories.characterRepository;
    const characterId = "character_lynott_magulbisson";

    const summary = characters.updateSheetSummary(characterId, {
      background: "Field Agent",
      className: "Artificer",
      hitPointMax: 28,
      initiative: 2,
      level: 5,
      name: "Lynott Undercover",
      proficiencyBonus: 3,
      speedFeet: 35,
      species: "Hobgoblin",
      subclassName: "Artillerist",
    });
    const ability = characters.updateAbility(characterId, "intelligence", {
      saveProficient: true,
      score: 20,
    });
    const skill = characters.updateSkill(characterId, "arcana", { proficiencyLevel: 1 });
    const armour = characters.updateArmourClassSource(characterId, "ac_lynott_enhanced_defence", {
      label: "Enhanced Defence",
      notes: "Improved infusion.",
      value: 2,
    });
    const sense = characters.updateSense(characterId, "sense_lynott_darkvision", {
      label: "Darkvision",
      value: "90 ft",
    });
    const defence = characters.updateDefence(characterId, "defence_lynott_resistances", {
      detail: "Fire while shielded.",
      label: "Resistances",
    });
    const proficiency = characters.updateProficiency(
      characterId,
      "proficiency_lynott_disguise_kit",
      {
        detail: "Special Operations cover work.",
        name: "Disguise kit",
      },
    );

    expect(summary).toMatchObject({
      background: "Field Agent",
      hitPoints: { current: 28, max: 28 },
      initiative: 2,
      level: 5,
      name: "Lynott Undercover",
      proficiencyBonus: 3,
      speedFeet: 35,
    });
    expect(ability?.abilities.find((candidate) => candidate.ability === "intelligence")).toMatchObject({
      modifier: 5,
      saveModifier: 8,
      score: 20,
    });
    expect(skill?.skills.find((candidate) => candidate.skill === "arcana")).toMatchObject({
      modifier: 8,
      proficiencyLevel: 1,
    });
    expect(armour).toMatchObject({ armourClass: 18 });
    expect(sense).toMatchObject({ value: "90 ft" });
    expect(defence).toMatchObject({ detail: "Fire while shielded." });
    expect(proficiency).toMatchObject({ detail: "Special Operations cover work." });
  });

  test("adds and reactivates custom condition resources", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const characters = runtime.repositories.characterRepository;

    const first = characters.upsertConditionResource("character_lynott_magulbisson", "Frightened");
    characters.updateResourceCurrent("character_lynott_magulbisson", first.id, 0);
    const second = characters.upsertConditionResource("character_lynott_magulbisson", "Frightened");

    expect(first).toMatchObject({
      current: 1,
      key: "condition_frightened",
      label: "Frightened",
      max: 1,
      type: "condition",
    });
    expect(second.id).toBe(first.id);
    expect(second.current).toBe(1);
  });

  test("filters note visibility by viewer role", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const notes = runtime.repositories.notesRepository;

    expect(notes.listNotesForCharacter("character_lynott_magulbisson", "player")).toMatchObject([
      {
        body: "Keep the false identities ready and weapons maintained.",
        id: "note_lynott_player",
        title: "Player notes",
        visibility: "player",
      },
    ]);
    expect(notes.listNotesForCharacter("character_lynott_magulbisson", "game_master")).toMatchObject([
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

  test("updates visible notes without exposing Game Master notes to players", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const notes = runtime.repositories.notesRepository;

    const playerNote = notes.updateNoteBody(
      "character_lynott_magulbisson",
      "note_lynott_player",
      "player",
      "Updated from the MVP smoke path.",
    );
    const blockedGmNote = notes.updateNoteBody(
      "character_lynott_magulbisson",
      "note_lynott_gm",
      "player",
      "Players should not be able to write this.",
    );
    const gmNote = notes.updateNoteBody(
      "character_lynott_magulbisson",
      "note_lynott_gm",
      "game_master",
      "Updated Game Master note.",
    );

    expect(playerNote).toMatchObject({
      body: "Updated from the MVP smoke path.",
      id: "note_lynott_player",
      visibility: "player",
    });
    expect(blockedGmNote).toBeNull();
    expect(gmNote).toMatchObject({
      body: "Updated Game Master note.",
      id: "note_lynott_gm",
      visibility: "game_master",
    });
    expect(notes.listNotesForCharacter("character_lynott_magulbisson", "player")).toMatchObject([
      {
        body: "Updated from the MVP smoke path.",
        id: "note_lynott_player",
        title: "Player notes",
        visibility: "player",
      },
    ]);
  });

  test("creates updates and deletes notes with role visibility", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const notes = runtime.repositories.notesRepository;

    const created = notes.createNote({
      authorUserId: "user_lynott_player",
      body: "A new player note.",
      characterId: "character_lynott_magulbisson",
      title: "Field note",
      visibility: "player",
    });
    const updated = notes.updateNote(
      "character_lynott_magulbisson",
      created.id,
      "player",
      { body: "Updated player note.", title: "Updated field note" },
    );
    const gmOnly = notes.createNote({
      authorUserId: "user_game_master",
      body: "GM-only note.",
      characterId: "character_lynott_magulbisson",
      title: "Private prep",
      visibility: "game_master",
    });
    const blockedDelete = notes.deleteNote("character_lynott_magulbisson", gmOnly.id, "player");
    const gmDelete = notes.deleteNote("character_lynott_magulbisson", gmOnly.id, "game_master");

    expect(created).toMatchObject({
      authorUserId: "user_lynott_player",
      body: "A new player note.",
      title: "Field note",
      visibility: "player",
    });
    expect(updated).toMatchObject({
      body: "Updated player note.",
      title: "Updated field note",
      visibility: "player",
    });
    expect(blockedDelete).toBeFalse();
    expect(gmDelete).toBeTrue();
    expect(notes.listNotesForCharacter("character_lynott_magulbisson", "player")).toContainEqual(
      expect.objectContaining({ body: "Updated player note.", title: "Updated field note" }),
    );
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
    ).toMatchObject([
      {
        contentCategory: "third_party",
        entityName: "Magical Tinkering",
        entitySlug: "magical-tinkering",
        entityType: "class_feature",
        prepared: false,
        selected: true,
        selectionType: "class_feature",
        sourceName: "Tasha's Cauldron of Everything",
        sourceSlug: "tashas-cauldron-of-everything",
      },
      {
        entityName: "Spellcasting",
        entitySlug: "spellcasting",
        entityType: "class_feature",
        prepared: false,
        selected: true,
        selectionType: "class_feature",
        sourceName: "Tasha's Cauldron of Everything",
        sourceSlug: "tashas-cauldron-of-everything",
      },
      {
        entityName: "Infuse Item",
        entitySlug: "infuse-item",
        entityType: "class_feature",
        prepared: false,
        selected: true,
        selectionType: "class_feature",
        sourceName: "Tasha's Cauldron of Everything",
        sourceSlug: "tashas-cauldron-of-everything",
      },
      {
        entityName: "The Right Tool for the Job",
        entitySlug: "the-right-tool-for-the-job",
        entityType: "class_feature",
        prepared: false,
        selected: true,
        selectionType: "class_feature",
        sourceName: "Tasha's Cauldron of Everything",
        sourceSlug: "tashas-cauldron-of-everything",
      },
      {
        entityName: "Eldritch Cannon",
        entityType: "subclass_feature",
        prepared: false,
        selected: true,
        selectionType: "subclass_feature",
        sourceName: "Tasha's Cauldron of Everything",
      },
      {
        contentCategory: "third_party",
        entityName: "Fey Gift",
        entityType: "species_trait",
        prepared: false,
        selected: true,
        selectionType: "species_trait",
        sourceName: "Mordenkainen Presents: Monsters of the Multiverse",
      },
      {
        entityName: "Fortune from the Many",
        entityType: "species_trait",
        prepared: false,
        selected: true,
        selectionType: "species_trait",
        sourceName: "Mordenkainen Presents: Monsters of the Multiverse",
      },
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
      {
        entityName: "Mending",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "known_cantrip",
        sourceName: "Player's Handbook",
      },
      {
        entityName: "Disguise Self",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "prepared_spell",
        sourceName: "Player's Handbook",
      },
      {
        entityName: "Cure Wounds",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "prepared_spell",
        sourceName: "Player's Handbook",
      },
      {
        entityName: "Grease",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "prepared_spell",
        sourceName: "Player's Handbook",
      },
      {
        entityName: "Absorb Elements",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "prepared_spell",
        sourceName: "Xanathar's Guide to Everything",
      },
      {
        entityName: "Shield",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "artillerist_spell",
        sourceName: "Player's Handbook",
      },
      {
        entityName: "Thunderwave",
        entityType: "spell",
        prepared: true,
        selected: true,
        selectionType: "artillerist_spell",
        sourceName: "Player's Handbook",
      },
    ]);
  });

  test("lists and filters imported SRD rules for browsing", async () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const importer = new RulesImportService(runtime.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/srd-5.1-fixtures");
    const rules = runtime.repositories.rulesRepository;

    const entityTypeCounts = rules.listRuleEntityTypes();
    expect(entityTypeCounts).toContainEqual({ count: 1, entityType: "action" });
    expect(entityTypeCounts).toContainEqual({ count: 1, entityType: "species" });
    expect(entityTypeCounts).toContainEqual({ count: 9, entityType: "spell" });
    expect(rules.listRules({ entityType: "spell", spellLevel: 1 }).map((rule) => rule.slug)).toEqual([
      "bless",
    ]);
    expect(rules.listRules({ entityType: "equipment", equipmentCategory: "armour" })).toEqual([
      expect.objectContaining({
        contentCategory: "srd",
        description: expect.stringContaining("Armour Class 16"),
        name: "Chain Mail",
        sourceSlug: "srd-5-1",
        tags: expect.arrayContaining(["armour", "equipment"]),
      }),
    ]);
    expect(rules.listRules({ query: "darkness" }).map((rule) => rule.slug)).toEqual([
      "darkvision",
    ]);
    expect(rules.getRuleDetail("spell", "bless")).toMatchObject({
      entityType: "spell",
      mechanics: [
        expect.objectContaining({
          data: expect.objectContaining({ level: 1, school: "Enchantment" }),
          mechanicType: "spell",
        }),
      ],
      name: "Bless",
      provenance: expect.objectContaining({ srdVersion: "5.1" }),
      slug: "bless",
    });
    expect(rules.getRuleDetail("spell", "missing")).toBeNull();
  });

  test("lists group-use character rosters for players and Game Masters", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const characters = runtime.repositories.characterRepository;

    expect(characters.listCharactersForPlayer("user_lynott_player")).toEqual([
      expect.objectContaining({
        campaignId: "campaign_rovnost_shadows",
        campaignName: "Rovnost Shadows",
        campaignSlug: "rovnost-shadows",
        factionName: "Discontents",
        id: "character_lynott_magulbisson",
        name: "Lynott Magulbisson",
        ownerDisplayName: "Lynott Player",
        ownerUserId: "user_lynott_player",
        slug: "lynott",
      }),
    ]);
    expect(characters.listCharactersForPlayer("user_mira_player")).toEqual([
      expect.objectContaining({
        classSummary: "Cleric 1",
        factionName: "Skywright Guild",
        id: "character_mira_voss",
        name: "Mira Voss",
        ownerDisplayName: "Mira Player",
        slug: "mira-voss",
      }),
    ]);
    expect(characters.listCharactersForCampaign("campaign_rovnost_shadows")).toEqual([
      expect.objectContaining({ id: "character_lynott_magulbisson", name: "Lynott Magulbisson" }),
      expect.objectContaining({ id: "character_mira_voss", name: "Mira Voss" }),
    ]);
    expect(characters.listResources("character_mira_voss").map((resource) => resource.key)).toEqual(
      standardCharacterResourceKeysForHitDie(8),
    );
  });

  test("creates manual characters with stable slugs and renderable defaults", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const characters = runtime.repositories.characterRepository;
    const first = characters.createCharacter({
      background: "Guide",
      campaignId: "campaign_rovnost_shadows",
      className: "Ranger",
      hitPointMax: 12,
      level: 1,
      name: "Ash Vale",
      ownerUserId: "user_mira_player",
      species: "Human",
      subclassName: null,
    });
    const second = characters.createCharacter({
      background: "Guide",
      campaignId: "campaign_rovnost_shadows",
      className: "Ranger",
      hitPointMax: 12,
      level: 1,
      name: "Ash Vale",
      ownerUserId: "user_mira_player",
      species: "Human",
      subclassName: "Gloom Stalker",
    });

    expect(first).toMatchObject({
      armourClass: 10,
      hitPoints: { current: 12, max: 12, temporary: 0 },
      level: 1,
      name: "Ash Vale",
      slug: "ash_vale",
    });
    expect(second.slug).toBe("ash_vale-2");
    expect(first.abilities).toHaveLength(6);
    expect(first.skills).toHaveLength(18);
    expect(first.classes).toEqual([
      {
        className: "Ranger",
        hitDice: "1d10",
        level: 1,
        spellcastingAbility: "wisdom",
        subclassName: null,
      },
    ]);
    expect(characters.listResources(first.id).map((resource) => resource.key)).toEqual(
      standardCharacterResourceKeysForHitDie(10),
    );
    expect(characters.listCharactersForPlayer("user_mira_player").map((character) => character.slug))
      .toContain("ash_vale");
  });

  test("filters seeded wiki pages, image assets, sessions, and factions by campaign visibility", () => {
    runtime = createSqliteDatabase({ path: ":memory:" });
    const content = runtime.repositories.campaignContentRepository;
    const campaignId = "campaign_rovnost_shadows";

    expect(content.listWikiPagesForCampaign(campaignId, "player").map((page) => page.slug)).toEqual([
      "astril-map",
      "factions-guide",
      "opening-teaser",
      "rovnost-shadows-overview",
      "session-zero-kit",
    ]);
    expect(
      content.listWikiPagesForCampaign(campaignId, "game_master").map((page) => page.slug),
    ).toEqual([
      "astril-map",
      "factions-guide",
      "opening-teaser",
      "rovnost-shadows-overview",
      "session-zero-kit",
      "gm-dossier",
    ]);
    expect(content.getWikiPageBySlug(campaignId, "gm-dossier", "player")).toBeNull();
    expect(content.getWikiPageBySlug(campaignId, "gm-dossier", "game_master")).toMatchObject({
      sourceTitle: "Rovnost GM dossier",
      tags: ["gm", "secrets"],
      visibility: "game_master",
    });

    expect(
      content.listImageAssetsForCampaign(campaignId, "player").map((asset) => asset.storageKey),
    ).toEqual([
      "campaigns/rovnost-shadows/astril-map.webp",
      "campaigns/rovnost-shadows/cover.png",
      "campaigns/rovnost-shadows/faction-sigils.png",
      "campaigns/rovnost-shadows/skywright-sigil.png",
    ]);
    expect(
      content.listImageAssetsForCampaign(campaignId, "game_master").map((asset) => asset.storageKey),
    ).toEqual([
      "campaigns/rovnost-shadows/astril-map.webp",
      "campaigns/rovnost-shadows/cover.png",
      "campaigns/rovnost-shadows/faction-sigils.png",
      "campaigns/rovnost-shadows/magister-vallen.png",
      "campaigns/rovnost-shadows/skywright-sigil.png",
    ]);
    expect(
      content
        .listImageAssetsForWikiPage(campaignId, "wiki_rovnost_factions", "inline", "player")
        .map((asset) => asset.id),
    ).toEqual(["asset_skywright_sigil"]);
    expect(
      content
        .listImageAssetsForWikiPage(campaignId, "wiki_rovnost_factions", "gallery", "player")
        .map((asset) => asset.id),
    ).toEqual(["asset_rovnost_factions"]);

    expect(content.listSessionsForCampaign(campaignId, "player").map((session) => session.slug)).toEqual([
      "session-zero",
    ]);
    expect(
      content.listSessionsForCampaign(campaignId, "game_master").map((session) => session.slug),
    ).toEqual(["session-zero", "gm-fronts"]);

    const createdSession = content.createSession({
      body: "GM prep body.",
      campaignId,
      createdByUserId: "user_game_master",
      sessionDate: "2026-05-20",
      summary: "GM prep.",
      title: "Planning Session",
      visibility: "game_master",
    });
    const updatedSession = content.updateSession(campaignId, createdSession.id, {
      body: "Player recap body.",
      sessionDate: "2026-05-21",
      summary: "Player recap.",
      title: "Planning Session Recap",
      visibility: "player",
    });

    expect(createdSession).toMatchObject({
      createdByUserId: "user_game_master",
      slug: "planning-session",
      visibility: "game_master",
    });
    expect(updatedSession).toMatchObject({
      body: "Player recap body.",
      sessionDate: "2026-05-21",
      summary: "Player recap.",
      title: "Planning Session Recap",
      visibility: "player",
    });
    expect(content.getSessionBySlug(campaignId, "planning-session", "player")).toMatchObject({
      title: "Planning Session Recap",
    });
    expect(content.deleteSession(campaignId, createdSession.id)).toBeTrue();

    const factions = content.listFactionsForCampaign(campaignId);
    expect(factions.map((faction) => faction.name)).toEqual([
      "Council of Magisters",
      "Steel Hand",
      "Discontents",
      "Black Market",
      "Tidebound",
      "Skywright Guild",
    ]);
    expect(factions.find((faction) => faction.slug === "discontents")).toMatchObject({
      connections: ["Strike organiser", "Safehouse keeper", "Sympathetic courier"],
      motto: "No city owns the hands that built it.",
      playerPrompt: "Who in the factory districts still trusts you?",
      rumours: ["They can hide someone for a night, but not for free."],
      wikiPageSlug: "factions-guide",
    });
    expect(content.getCharacterFactionChoice("character_lynott_magulbisson")).toMatchObject({
      characterId: "character_lynott_magulbisson",
      factionName: "Discontents",
      factionSlug: "discontents",
    });
    expect(
      content.updateCharacterFactionChoice(
        "character_lynott_magulbisson",
        "faction_tidebound",
        "The canal crews know Lynott's old routes.",
      ),
    ).toMatchObject({
      connectionNote: "The canal crews know Lynott's old routes.",
      factionName: "Tidebound",
      factionSlug: "tidebound",
    });
    expect(
      content.updateCharacterFactionChoice(
        "character_lynott_magulbisson",
        "missing_faction",
        "Nope.",
      ),
    ).toBeNull();
    runtime.database.run(
      "insert into campaigns (id, slug, name, gm_user_id) values (?, ?, ?, ?)",
      ["campaign_elsewhere", "elsewhere", "Elsewhere", "user_game_master"],
    );
    runtime.database.run(
      "insert into campaign_factions (id, campaign_id, slug, name) values (?, ?, ?, ?)",
      ["faction_elsewhere", "campaign_elsewhere", "elsewhere", "Elsewhere"],
    );
    expect(
      content.updateCharacterFactionChoice(
        "character_lynott_magulbisson",
        "faction_elsewhere",
        "Wrong campaign.",
      ),
    ).toBeNull();
    expect(
      content.updateCharacterFactionChoice(
        "character_lynott_magulbisson",
        null,
        "Keeps contacts informal.",
      ),
    ).toEqual({
      characterId: "character_lynott_magulbisson",
      connectionNote: "Keeps contacts informal.",
      factionId: null,
      factionName: null,
      factionSlug: null,
    });
    expect(content.getCharacterFactionChoice("character_lynott_magulbisson")).toEqual({
      characterId: "character_lynott_magulbisson",
      connectionNote: "Keeps contacts informal.",
      factionId: null,
      factionName: null,
      factionSlug: null,
    });
    expect(content.updateCharacterFactionChoice("missing_character", null, "Nope.")).toBeNull();
  });
});
