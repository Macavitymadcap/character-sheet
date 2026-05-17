export function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

export function savingThrowModifier({
  modifier,
  proficiencyBonus,
  proficient,
}: {
  modifier: number;
  proficiencyBonus: number;
  proficient: boolean;
}) {
  return modifier + (proficient ? proficiencyBonus : 0);
}

export function skillModifier({
  modifier,
  proficiencyBonus,
  proficiencyLevel,
}: {
  modifier: number;
  proficiencyBonus: number;
  proficiencyLevel: number;
}) {
  return modifier + proficiencyBonus * proficiencyLevel;
}

export function armourClassTotal(sources: Array<{ value: number }>) {
  return sources.reduce((total, source) => total + source.value, 0);
}

export function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}
