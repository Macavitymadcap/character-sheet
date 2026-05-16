import { describe, expect, test } from "bun:test";
import { SkillsTrainingTab } from "./SkillsTrainingTab";
import type { CharacterSheetReadModel } from "../../../db";

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
  proficiencies: [
    { category: "tool", detail: "Expertise from Artificer.", name: "Thieves' tools" },
    { category: "armour", detail: "Artificer training.", name: "Medium armour" },
    { category: "weapon", detail: "1st Astrilian Artificers training.", name: "Firearms" },
    { category: "language", detail: "Known language.", name: "Goblin" },
    {
      category: "training",
      detail: "Infiltration, intelligence gathering, sabotage, and threat assessment.",
      name: "Covert operations",
    },
  ],
  proficiencyBonus: 2,
  senses: [],
  skills: [
    { ability: "dexterity", modifier: 5, proficiencyLevel: 1, skill: "stealth" },
    { ability: "intelligence", modifier: 4, proficiencyLevel: 0, skill: "arcana" },
  ],
  slug: "lynott-magulbisson",
  species: "Hobgoblin",
  speedFeet: 30,
};

describe("SkillsTrainingTab", () => {
  test("renders skills and grouped proficiencies", () => {
    const html = render(<SkillsTrainingTab sheet={sheet} />);

    expect(html).toContain('<h3 id="skills-heading">Skills</h3>');
    expect(html).toContain("<th scope=\"row\">Stealth</th>");
    expect(html).toContain("<td>+5</td>");
    expect(html).toContain("<td>Proficient</td>");
    expect(html).toContain("<th scope=\"row\">Arcana</th>");
    expect(html).toContain("<td>Untrained</td>");
    expect(html).toContain("<h4 id=\"proficiency-tool\">Tools</h4>");
    expect(html).toContain("<strong>Thieves&#39; tools</strong>");
    expect(html).toContain("<h4 id=\"proficiency-armour\">Armour</h4>");
    expect(html).toContain("<strong>Medium armour</strong>");
    expect(html).toContain("<strong>Covert operations</strong>");
  });
});
