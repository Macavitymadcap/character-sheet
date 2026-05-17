import { describe, expect, test } from "bun:test";
import { SheetTabPanel } from "./SheetTabPanel";
import { sheetTabs } from "../SheetTabs";
import type {
  CharacterBackgroundEntry,
  CharacterEquipment,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
} from "../../../db";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [],
  armourClass: 17,
  armourClassBreakdown: [
    { label: "Breastplate", notes: "Medium armour base AC.", value: 14 },
    { label: "Enhanced Defence", notes: "Active armour infusion.", value: 1 },
  ],
  background: "Special Operations",
  classes: [],
  defences: [{ detail: "None currently recorded.", label: "Resistances", type: "resistance" }],
  hitPoints: {
    current: 31,
    max: 31,
    temporary: 0,
  },
  id: "character_lynott_magulbisson",
  initiative: 3,
  level: 4,
  name: "Lynott Magulbisson",
  proficiencies: [
    { category: "tool", detail: "Expertise from Artificer.", name: "Thieves' tools" },
  ],
  proficiencyBonus: 2,
  senses: [{ label: "Darkvision", value: "60 ft" }],
  skills: [{ ability: "dexterity", modifier: 5, proficiencyLevel: 1, skill: "stealth" }],
  slug: "lynott",
  species: "Hobgoblin",
  speedFeet: 30,
};

const resources: CharacterResource[] = [
  {
    current: 31,
    id: "resource_lynott_hit_points",
    key: "hit_points",
    label: "Hit points",
    max: 31,
    type: "hit_points",
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
];

const equipment: CharacterEquipment[] = [
  {
    category: "weapon",
    equipped: true,
    id: "equipment_lynott_pistol",
    name: "Pistol with Repeating Shot infusion",
    notes: "Range 30/90 ft., 1d10+4 magical piercing damage.",
    quantity: 1,
  },
];

const backgroundEntries: CharacterBackgroundEntry[] = [
  {
    body: "Always watches exits, reads crowds, and catalogues threats.",
    category: "personality",
    id: "background_lynott_personality_exits",
    title: "Threat reading",
  },
  {
    body: "Male human travelling tinker and independent contractor.",
    category: "false_identity",
    id: "background_lynott_identity_jonas",
    title: "Jonas Blarendon",
  },
  {
    body: "Hobgoblin squad leader who gave the order to fire.",
    category: "npc",
    id: "background_lynott_npc_kora",
    title: "Sergeant Kora Steelheart",
  },
];

const notes: CharacterNote[] = [
  {
    body: "Keep the false identities ready and weapons maintained.",
    id: "note_lynott_player",
    title: "Player notes",
    visibility: "player",
  },
];

const ruleLinks: CharacterRuleLink[] = [
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
];

const renderPanel = (tabId: (typeof sheetTabs)[number]["id"]) =>
  render(
    <SheetTabPanel
      backgroundEntries={backgroundEntries}
      equipment={equipment}
      notes={notes}
      resources={resources}
      ruleLinks={ruleLinks}
      sheet={sheet}
      tabId={tabId}
    />,
  );

describe("SheetTabPanel", () => {
  test("renders the skills tab fragment with stable anchors and concrete content", () => {
    const html = renderPanel("skills");

    expect(html).toContain('<section id="sheet-tab-panel" class="sheet-tab-panel"');
    expect(html).toContain('aria-labelledby="sheet-tab-skills"');
    expect(html).toContain('data-tab-id="skills"');
    expect(html).toContain("<h2>Skills</h2>");
    expect(html).toContain('<h3 id="skills-heading">Skills</h3>');
    expect(html).toContain("<strong>Thieves&#39; tools</strong>");
  });

  test("renders the core tab fragment with stable anchors and concrete content", () => {
    const html = renderPanel("core");

    expect(html).toContain('data-tab-id="core"');
    expect(html).toContain('<h3 id="abilities-heading">Abilities and saves</h3>');
    expect(html).toContain("<dt>Darkvision</dt>");
  });

  test("renders unfinished tabs as compact data-backed summaries", () => {
    const actions = renderPanel("actions");
    const spellcasting = renderPanel("spellcasting");
    const features = renderPanel("features");
    const equipmentTab = renderPanel("equipment");
    const backgroundTab = renderPanel("background");
    const notesTab = renderPanel("notes");

    expect(actions).toContain("Action resources");
    expect(actions).toContain("Rest");
    expect(actions).toContain('hx-post="/sheet/lynott/rests/long"');
    expect(actions).toContain('hx-target="#sheet-tab-workspace"');
    expect(actions).toContain("Pistol with Repeating Shot infusion");
    expect(spellcasting).toContain("Mage Hand");
    expect(spellcasting).toContain("1st-level spell slots");
    expect(spellcasting).toContain('hx-patch="/sheet/lynott/resources/resource_lynott_spell_slots_1"');
    expect(spellcasting).toContain('hx-target="#sheet-tab-panel"');
    expect(spellcasting).toContain('name="tabId" value="spellcasting"');
    expect(spellcasting).toContain('aria-label="Spend one 1st-level spell slots"');
    expect(features).toContain("Repeating Shot");
    expect(equipmentTab).toContain("Range 30/90 ft.");
    expect(backgroundTab).toContain("Jonas Blarendon");
    expect(backgroundTab).toContain("Sergeant Kora Steelheart");
    expect(notesTab).toContain("Keep the false identities ready");
    expect(actions).toContain('class="compact-list"');
    expect(actions).not.toContain("labelled-output");
  });

  test("renders every configured tab id as a fragment", () => {
    for (const tab of sheetTabs) {
      const html = renderPanel(tab.id);

      expect(html).toContain(`data-tab-id="${tab.id}"`);
      expect(html).toContain(`<h2>${tab.label}</h2>`);
    }
  });
});
