import { describe, expect, test } from "bun:test";
import type { CharacterSheetReadModel } from "../../../db";
import { SheetTabWorkspace } from "./SheetTabWorkspace";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [],
  armourClass: 17,
  armourClassBreakdown: [],
  background: "Special Operations",
  classes: [],
  defences: [],
  hitPoints: { current: 31, max: 31, temporary: 0 },
  id: "character_lynott_magulbisson",
  initiative: 3,
  level: 4,
  name: "Lynott Magulbisson",
  proficiencies: [],
  proficiencyBonus: 2,
  senses: [],
  skills: [],
  slug: "lynott-magulbisson",
  species: "Hobgoblin",
  speedFeet: 30,
};

describe("SheetTabWorkspace", () => {
  test("renders tabs and the active panel as one HTMX swap target", () => {
    const html = render(<SheetTabWorkspace activeTab="skills" resources={[]} sheet={sheet} />);

    expect(html).toContain('<div id="sheet-tab-workspace" class="sheet-tab-workspace">');
    expect(html).toContain('id="sheet-tabs"');
    expect(html).toContain('id="sheet-tab-panel"');
    expect(html).toContain('id="sheet-tab-skills"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('data-tab-id="skills"');
  });
});
