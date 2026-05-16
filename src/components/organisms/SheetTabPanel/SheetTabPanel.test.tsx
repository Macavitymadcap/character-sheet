import { describe, expect, test } from "bun:test";
import { SheetTabPanel } from "./SheetTabPanel";
import { sheetTabs } from "../SheetTabs";
import type { CharacterResource, CharacterSheetReadModel } from "../../../db";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [],
  armourClass: 17,
  background: "Special Operations",
  classes: [],
  hitPoints: {
    current: 31,
    max: 31,
    temporary: 0,
  },
  id: "character_lynott_magulbisson",
  initiative: 3,
  level: 4,
  name: "Lynott Magulbisson",
  proficiencyBonus: 2,
  skills: [{ ability: "dexterity", modifier: 5, proficiencyLevel: 1, skill: "stealth" }],
  slug: "lynott-magulbisson",
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
  test("renders placeholder tab fragments with stable anchors", () => {
    const html = render(<SheetTabPanel resources={resources} sheet={sheet} tabId="skills" />);

    expect(html).toContain('<section id="sheet-tab-panel" class="sheet-tab-panel"');
    expect(html).toContain('aria-labelledby="sheet-tab-skills"');
    expect(html).toContain('data-tab-id="skills"');
    expect(html).toContain("<h2>Skills</h2>");
    expect(html).toContain('<span class="labelled-output-label">Trained skills</span>');
    expect(html).toContain('<strong class="labelled-output-value">1</strong>');
  });

  test("renders every configured tab id as a fragment", () => {
    for (const tab of sheetTabs) {
      const html = render(<SheetTabPanel resources={resources} sheet={sheet} tabId={tab.id} />);

      expect(html).toContain(`data-tab-id="${tab.id}"`);
      expect(html).toContain(`<h2>${tab.label}</h2>`);
    }
  });
});
