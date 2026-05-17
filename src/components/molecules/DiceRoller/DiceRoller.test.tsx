import { describe, expect, test } from "bun:test";
import { DiceRoller } from "./DiceRoller";

const render = (node: unknown): string => String(node);

describe("DiceRoller", () => {
  test("renders a native popover-backed roll form", () => {
    const html = render(
      <DiceRoller
        characterSlug="lynott"
        defaultModifier={5}
        id="stealth-roll"
        label="Stealth"
      />,
    );

    expect(html).toContain('popovertarget="stealth-roll-roller"');
    expect(html).toContain('popover="auto"');
    expect(html).toContain('hx-post="/sheet/lynott/rolls"');
    expect(html).toContain('hx-target="#stealth-roll-result"');
    expect(html).toContain('name="resultId" value="stealth-roll-result"');
    expect(html).toContain('name="modifier" value="5"');
    expect(html).toContain("Ready: d20 +5");
  });

  test("renders ability selection for tool rolls", () => {
    const html = render(
      <DiceRoller
        abilityOptions={[{ label: "Dexterity", value: 3 }]}
        characterSlug="lynott"
        id="tools-roll"
        label="Thieves' tools"
        proficiencyBonus={2}
      />,
    );

    expect(html).toContain('<select name="baseModifier">');
    expect(html).toContain('name="proficiencyBonus" value="2"');
    expect(html).toContain("Dexterity +3");
    expect(html).toContain("Ready: d20 +5");
  });
});
