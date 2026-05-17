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
    { label: "Breastplate", notes: "Medium armour base AC.", value: 14 },
    { label: "Dexterity bonus", notes: "Breastplate maximum Dexterity bonus.", value: 2 },
    { label: "Enhanced Defence", notes: "Active armour infusion.", value: 1 },
  ],
  background: "Special Operations",
  classes: [],
  defences: [{ detail: "None currently recorded.", label: "Resistances", type: "resistance" }],
  hitPoints: { current: 31, max: 31, temporary: 0 },
  id: "character_lynott_magulbisson",
  initiative: 3,
  level: 4,
  name: "Lynott Magulbisson",
  proficiencies: [],
  proficiencyBonus: 2,
  senses: [
    { label: "Darkvision", value: "60 ft" },
    { label: "Passive perception", value: "13" },
  ],
  skills: [],
  slug: "lynott-magulbisson",
  species: "Hobgoblin",
  speedFeet: 30,
};

describe("CoreTab", () => {
  test("renders abilities, saves, senses, speed, armour, and defences", () => {
    const html = render(<CoreTab sheet={sheet} />);

    expect(html).toContain('<h3 id="abilities-heading">Abilities and saves</h3>');
    expect(html).toContain("<th scope=\"row\">Strength</th>");
    expect(html).toContain("<td>-1</td>");
    expect(html).toContain('aria-label="Proficient"');
    expect(html).toContain("<dt>Speed</dt>");
    expect(html).toContain("<dd>30 ft</dd>");
    expect(html).toContain("<dt>Darkvision</dt>");
    expect(html).toContain("<dd>60 ft</dd>");
    expect(html).toContain("<dt>Armour</dt>");
    expect(html).toContain("<strong>AC 17</strong>");
    expect(html).toContain("<strong>Enhanced Defence</strong> +1");
    expect(html).toContain("Active armour infusion.");
    expect(html).toContain("<dt>Resistances</dt>");
  });
});
