import { describe, expect, test } from "bun:test";
import { SkillsTrainingTab } from "./SkillsTrainingTab";
import type { CharacterSheetReadModel } from "../../../db";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [{ ability: "dexterity", modifier: 3, saveModifier: 3, saveProficient: false, score: 16 }],
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
    {
      category: "tool",
      detail: "Expertise from Artificer.",
      id: "proficiency_lynott_thieves_tools",
      name: "Thieves' tools",
    },
    { category: "tool", detail: "Special Operations background.", name: "Forgery kit" },
    { category: "armour", detail: "Artificer training.", name: "Medium armour" },
    { category: "weapon", detail: "Artificer training and campaign exposure.", name: "Firearms" },
    { category: "language", detail: "Known language.", name: "Goblin" },
  ],
  proficiencyBonus: 2,
  senses: [],
  skills: [
    { ability: "dexterity", modifier: 5, proficiencyLevel: 1, skill: "stealth" },
    { ability: "intelligence", modifier: 4, proficiencyLevel: 0, skill: "arcana" },
  ],
  slug: "lynott",
  species: "Hobgoblin",
  speedFeet: 30,
};

describe("SkillsTrainingTab", () => {
  test("renders skills and grouped proficiencies", () => {
    const html = render(<SkillsTrainingTab sheet={sheet} />);

    expect(html).toContain('<h3 id="skills-heading">Skills</h3>');
    expect(html).toContain('<table class="sheet-table skills-table">');
    expect(html).toContain('<span class="skill-name-with-roll"><span>Stealth</span>');
    expect(html).toContain("<td>+5</td>");
    expect(html).toContain('aria-label="Roll Stealth"');
    expect(html).toContain('hx-post="/sheet/lynott/rolls"');
    expect(html).toContain('hx-get="/sheet/lynott/skills/stealth/edit"');
    expect(html).toContain('hx-target="#skill-row-stealth"');
    expect(html).toContain('aria-label="Proficient"');
    expect(html).toContain('data-icon="check-circle"');
    expect(html).toContain('<span class="skill-name-with-roll"><span>Arcana</span>');
    expect(html).toContain('aria-label="Untrained"');
    expect(html).toContain("<h4 id=\"proficiency-tool\">Tools</h4>");
    expect(html).toContain('hx-post="/sheet/lynott/proficiencies"');
    expect(html).toContain("Add proficiency</button>");
    expect(html).toContain("<strong>Thieves&#39; tools</strong>");
    expect(html).toContain('aria-label="Roll Thieves&#39; tools"');
    expect(html).toContain('hx-get="/sheet/lynott/proficiencies/proficiency_lynott_thieves_tools/edit"');
    expect(html).toContain('<select name="baseModifier">');
    expect(html).not.toContain("row-edit-disclosure");
    expect(html).toContain("<strong>Forgery kit</strong>");
    expect(html).toContain("<h4 id=\"proficiency-armour\">Armour</h4>");
    expect(html).toContain("<strong>Medium armour</strong>");
    expect(html).not.toContain("Covert operations");
    expect(html).not.toContain("Training</h4>");
  });
});
