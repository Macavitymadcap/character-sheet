import { describe, expect, test } from "bun:test";
import { SheetTabPanel } from "./SheetTabPanel";
import { sheetTabs } from "../SheetTabs";
import type { CharacterResource, CharacterSheetReadModel } from "../../../db";

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
];

describe("SheetTabPanel", () => {
  test("renders the skills tab fragment with stable anchors and concrete content", () => {
    const html = render(<SheetTabPanel resources={resources} sheet={sheet} tabId="skills" />);

    expect(html).toContain('<section id="sheet-tab-panel" class="sheet-tab-panel"');
    expect(html).toContain('aria-labelledby="sheet-tab-skills"');
    expect(html).toContain('data-tab-id="skills"');
    expect(html).toContain("<h2>Skills</h2>");
    expect(html).toContain('<h3 id="skills-heading">Skills</h3>');
    expect(html).toContain("<strong>Thieves&#39; tools</strong>");
  });

  test("renders the core tab fragment with stable anchors and concrete content", () => {
    const html = render(<SheetTabPanel resources={resources} sheet={sheet} tabId="core" />);

    expect(html).toContain('data-tab-id="core"');
    expect(html).toContain('<h3 id="abilities-heading">Abilities and saves</h3>');
    expect(html).toContain("<dt>Darkvision</dt>");
  });

  test("renders every configured tab id as a fragment", () => {
    for (const tab of sheetTabs) {
      const html = render(<SheetTabPanel resources={resources} sheet={sheet} tabId={tab.id} />);

      expect(html).toContain(`data-tab-id="${tab.id}"`);
      expect(html).toContain(`<h2>${tab.label}</h2>`);
    }
  });
});
