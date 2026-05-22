import { describe, expect, test } from "bun:test";
import { CoreTab } from "./CoreTab";
import type { CharacterSheetReadModel } from "../../../db";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [
    { ability: "strength", modifier: -1, saveModifier: -1, saveProficient: false, score: 8 },
    { ability: "constitution", modifier: 1, saveModifier: 3, saveProficient: true, score: 13 },
  ],
  armourClass: 17,
  armourClassBreakdown: [
    { id: "ac_breastplate", label: "Breastplate", notes: "Medium armour base AC.", value: 14 },
    { id: "ac_dexterity", label: "Dexterity bonus", notes: "Breastplate maximum Dexterity bonus.", value: 2 },
    { id: "ac_enhanced_defence", label: "Enhanced Defence", notes: "Active armour infusion.", value: 1 },
  ],
  background: "Special Operations",
  classes: [],
  defences: [{ detail: "None currently recorded.", id: "defence_resistances", label: "Resistances", type: "resistance" }],
  hitPoints: { current: 31, max: 31, temporary: 0 },
  id: "character_lynott_magulbisson",
  initiative: 3,
  level: 4,
  name: "Lynott Magulbisson",
  proficiencies: [],
  proficiencyBonus: 2,
  senses: [
    { id: "sense_darkvision", label: "Darkvision", value: "60 ft" },
    { id: "sense_passive_perception", label: "Passive perception", value: "13" },
  ],
  skills: [],
  slug: "lynott",
  species: "Hobgoblin",
  speedFeet: 30,
};

describe("CoreTab", () => {
  test("renders abilities, saves, senses, speed, armour, and defences", () => {
    const html = render(<CoreTab sheet={sheet} />);

    expect(html).toContain('<h3 id="abilities-heading">Abilities and saves</h3>');
    expect(html).toContain('<table class="sheet-table ability-table">');
    expect(html).toContain('<span class="ability-full">Strength</span>');
    expect(html).toContain('<abbr class="ability-short" title="Constitution">CON</abbr>');
    expect(html).toContain("<td>-1</td>");
    expect(html).toContain('aria-label="Roll Strength"');
    expect(html).toContain('hx-post="/sheet/lynott/rolls"');
    expect(html).toContain('hx-get="/sheet/lynott/abilities/strength/edit"');
    expect(html).toContain('hx-target="#ability-row-strength"');
    expect(html).toContain('aria-label="Proficient"');
    expect(html).not.toContain("row-edit-disclosure");
    expect(html).toContain("<dt>Speed</dt>");
    expect(html).toContain("<dd>30 ft</dd>");
    expect(html).toContain("<dt>Darkvision</dt>");
    expect(html).toContain('<dd class="sheet-inline-read"><span>60 ft</span>');
    expect(html).toContain('hx-get="/sheet/lynott/senses/sense_darkvision/edit"');
    expect(html).toContain('hx-target="#sense-card-sense_darkvision"');
    expect(html).toContain("<dt>Armour</dt>");
    expect(html).toContain('class="armour-class-shield" aria-label="Armour class 17"');
    expect(html).toContain("<strong>17</strong>");
    expect(html).toContain("<strong>Breastplate</strong>");
    expect(html).toContain("(14 + 2 + 1 = 17)");
    expect(html).toContain('hx-get="/sheet/lynott/armour/ac_breastplate/edit"');
    expect(html).toContain("<dt>Resistances</dt>");
    expect(html).toContain('hx-get="/sheet/lynott/defences/defence_resistances/edit"');
  });
});
