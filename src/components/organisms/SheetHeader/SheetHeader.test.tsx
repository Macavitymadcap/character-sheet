import { describe, expect, test } from "bun:test";
import { SheetHeader } from "./SheetHeader";
import type { CharacterResource, CharacterSheetReadModel } from "../../../db";

const render = (node: unknown): string => String(node);

const sheet: CharacterSheetReadModel = {
  abilities: [],
  armourClass: 17,
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
  skills: [],
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

describe("SheetHeader", () => {
  test("renders sticky sheet summary outputs", () => {
    const html = render(<SheetHeader resources={resources} sheet={sheet} />);

    expect(html).toContain('<section id="sheet-header" class="sheet-header" aria-labelledby="sheet-heading">');
    expect(html).toContain('<h1 id="sheet-heading" class="sheet-heading">Lynott Magulbisson</h1>');
    expect(html).toContain('<span class="labelled-output-label">Armour class</span>');
    expect(html).toContain('<strong class="labelled-output-value">17</strong>');
    expect(html).toContain('<span class="labelled-output-label">Hit points</span>');
    expect(html).toContain('<strong class="labelled-output-value">31 / 31</strong>');
    expect(html).toContain('<span class="labelled-output-label">Conditions</span>');
    expect(html).toContain('<strong class="labelled-output-value">None</strong>');
    expect(html).toContain('<span class="labelled-output-label">Settings</span>');
  });

  test("renders temporary hit points, active conditions, and inspiration", () => {
    const html = render(
      <SheetHeader
        resources={[
          ...resources,
          {
            current: 1,
            id: "condition_poisoned",
            key: "condition_poisoned",
            label: "Poisoned",
            max: 1,
            type: "condition",
          },
          {
            current: 1,
            id: "resource_inspiration",
            key: "inspiration",
            label: "Inspiration",
            max: 1,
            type: "state",
          },
        ]}
        sheet={{ ...sheet, hitPoints: { current: 22, max: 31, temporary: 5 } }}
      />,
    );

    expect(html).toContain('<strong class="labelled-output-value">22 / 31 + 5 temporary</strong>');
    expect(html).toContain('<strong class="labelled-output-value">Poisoned</strong>');
    expect(html).toContain('<strong class="labelled-output-value">Yes</strong>');
  });
});
