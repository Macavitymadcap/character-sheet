import { describe, expect, test } from "bun:test";
import { abilityModifier, armourClassTotal, savingThrowModifier, skillModifier } from "./calculations";

describe("character calculations", () => {
  test("calculates ability modifiers", () => {
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(13)).toBe(1);
    expect(abilityModifier(18)).toBe(4);
  });

  test("calculates proficient and non-proficient saving throws", () => {
    expect(savingThrowModifier({ modifier: 1, proficiencyBonus: 2, proficient: true })).toBe(3);
    expect(savingThrowModifier({ modifier: 3, proficiencyBonus: 2, proficient: false })).toBe(3);
  });

  test("calculates skill modifiers with proficiency and expertise", () => {
    expect(skillModifier({ modifier: 3, proficiencyBonus: 2, proficiencyLevel: 0 })).toBe(3);
    expect(skillModifier({ modifier: 3, proficiencyBonus: 2, proficiencyLevel: 1 })).toBe(5);
    expect(skillModifier({ modifier: 4, proficiencyBonus: 2, proficiencyLevel: 2 })).toBe(8);
  });

  test("totals armour class sources", () => {
    expect(
      armourClassTotal([
        { value: 14 },
        { value: 2 },
        { value: 1 },
      ]),
    ).toBe(17);
  });
});
