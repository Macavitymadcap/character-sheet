import type { AbilityName } from "./model";

interface CharacterClassDefaults {
  hitDieSides: number;
  spellcastingAbility: AbilityName | null;
}

const classDefaults: Record<string, CharacterClassDefaults> = {
  artificer: { hitDieSides: 8, spellcastingAbility: "intelligence" },
  cleric: { hitDieSides: 8, spellcastingAbility: "wisdom" },
  fighter: { hitDieSides: 10, spellcastingAbility: null },
  ranger: { hitDieSides: 10, spellcastingAbility: "wisdom" },
};

export function characterClassDefaults(className: string): CharacterClassDefaults {
  return classDefaults[normaliseClassName(className)] ?? { hitDieSides: 8, spellcastingAbility: null };
}

export function formatHitDice(level: number, hitDieSides: number) {
  return `${level}d${hitDieSides}`;
}

function normaliseClassName(className: string) {
  return className.trim().toLowerCase();
}
