import { describe, expect, test } from "bun:test";
import { SheetHeader, SheetHeaderEdit } from "./SheetHeader";
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
  skills: [],
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
    current: 0,
    id: "resource_lynott_temporary_hit_points",
    key: "temporary_hit_points",
    label: "Temporary hit points",
    max: null,
    type: "temporary_hit_points",
  },
  {
    current: 0,
    id: "resource_lynott_inspiration",
    key: "inspiration",
    label: "Inspiration",
    max: 1,
    type: "inspiration",
  },
];

describe("SheetHeader", () => {
  test("renders sticky sheet summary outputs", () => {
    const html = render(<SheetHeader resources={resources} sheet={sheet} />);

    expect(html).toContain('<section id="sheet-header" class="sheet-header" aria-labelledby="sheet-heading">');
    expect(html).toContain('<h1 id="sheet-heading" class="sheet-heading">Lynott Magulbisson</h1>');
    expect(html).toContain("Hobgoblin · Level 4 Artillerist Artificer");
    expect(html).toContain('hx-get="/sheet/lynott/summary/edit"');
    expect(html).toContain('hx-target="#sheet-header"');
    expect(html).not.toContain("sheet-edit-disclosure");
    expect(html).toContain("<dt>AC</dt>");
    expect(html).toContain("<dd>17</dd>");
    expect(html).toContain("<dt>HP</dt>");
    expect(html).toContain('<details class="hp-control">');
    expect(html).toContain('aria-label="Manage hit points"');
    expect(html).toContain("31 / 31");
    expect(html).toContain('hx-patch="/sheet/lynott/resources/resource_lynott_hit_points"');
    expect(html).toContain('hx-patch="/sheet/lynott/resources/resource_lynott_temporary_hit_points"');
    expect(html).toContain("<dt>Conditions</dt>");
    expect(html).toContain('<span class="condition-control">');
    expect(html).toContain('aria-label="Manage conditions"');
    expect(html).toContain('popovertarget="condition-popover-lynott"');
    expect(html).toContain('popover="auto"');
    expect(html).toContain("No active conditions.");
    expect(html).toContain('hx-post="/sheet/lynott/conditions"');
    expect(html).toContain('id="inspiration-toggle"');
    expect(html).toContain('data-variant="inspiration"');
    expect(html).toContain('hx-trigger="change delay:250ms"');
    expect(html).toContain('data-icon="circle"');
    expect(html).toContain('data-icon="sparkles"');
    expect(html).not.toContain("<dt>Settings</dt>");
  });

  test("renders temporary hit points, active conditions, and inspiration", () => {
    const html = render(
      <SheetHeader
        resources={[
          ...resources.map((resource) =>
            resource.key === "inspiration" ? { ...resource, current: 1 } : resource,
          ),
          {
            current: 1,
            id: "condition_poisoned",
            key: "condition_poisoned",
            label: "Poisoned",
            max: 1,
            type: "condition",
          },
        ]}
        sheet={{ ...sheet, hitPoints: { current: 22, max: 31, temporary: 5 } }}
      />,
    );

    expect(html).toContain("22 / 31 + 5 temporary");
    expect(html).toContain('<span class="condition-chip">Poisoned</span>');
    expect(html).toContain('aria-label="Remove Poisoned"');
    expect(html).toContain('hx-patch="/sheet/lynott/resources/condition_poisoned"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('checked=""');
  });

  test("renders summary editing as a swappable header form", () => {
    const html = render(<SheetHeaderEdit sheet={sheet} />);

    expect(html).toContain('<section id="sheet-header" class="sheet-header sheet-header-edit"');
    expect(html).toContain("Edit sheet summary");
    expect(html).toContain('hx-patch="/sheet/lynott/summary"');
    expect(html).toContain('hx-get="/sheet/lynott/summary"');
    expect(html).toContain('hx-target="#sheet-header"');
    expect(html).toContain('<button type="submit">Save summary</button>');
    expect(html).toContain(">Cancel</button>");
    expect(html).not.toContain("<details");
    expect(html).not.toContain("<summary");
    expect(html).not.toContain("sheet-edit-disclosure");
  });
});
