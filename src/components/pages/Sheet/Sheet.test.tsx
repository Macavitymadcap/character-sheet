import { describe, expect, test } from "bun:test";
import { SheetPage } from "./Sheet";
import type { CharacterResource, CharacterSheetReadModel } from "../../../db";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [],
  armourClass: 17,
  armourClassBreakdown: [],
  background: "Special Operations",
  classes: [
    {
      className: "Artificer",
      hitDice: "4d8",
      level: 4,
      spellcastingAbility: "intelligence",
      subclassName: "Artillerist",
    },
  ],
  defences: [],
  hitPoints: {
    current: 31,
    max: 31,
    temporary: 0,
  },
  id: "character_lynott_magulbisson",
  initiative: 3,
  level: 4,
  name: "Lynott Magulbisson",
  proficiencies: [],
  proficiencyBonus: 2,
  senses: [],
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

describe("SheetPage", () => {
  test("renders the full sheet page shell", () => {
    const html = render(
      <SheetPage
        activeTab="core"
        appName="Campaign Ledger"
        backgroundEntries={[]}
        campaignFactions={[]}
        equipment={[]}
        factionChoice={null}
        notes={[]}
        resources={resources}
        ruleLinks={[]}
        sheet={sheet}
        user={{ displayName: "Lynott Player", role: "player" }}
      />,
    );

    expect(html).toContain("<title>Lynott Magulbisson - Campaign Ledger</title>");
    expect(html).toContain('id="site-header"');
    expect(html).toContain('<a href="/characters">Characters</a>');
    expect(html).toContain('class="sheet-sticky-stack"');
    expect(html).toContain('id="sheet-header"');
    expect(html).toContain('id="sheet-tab-workspace"');
    expect(html).toContain('id="sheet-tabs"');
    expect(html).toContain('id="sheet-tab-panel"');
  });
});
