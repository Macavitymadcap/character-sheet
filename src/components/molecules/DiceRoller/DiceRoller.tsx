import { formatModifier } from "../../../characters/calculations";

export interface DiceRollerAbilityOption {
  label: string;
  value: number;
}

interface DiceRollerProps {
  abilityOptions?: DiceRollerAbilityOption[];
  characterSlug: string;
  defaultModifier?: number;
  id: string;
  label: string;
  proficiencyBonus?: number;
}

export const DiceRoller = ({
  abilityOptions,
  characterSlug,
  defaultModifier,
  id,
  label,
  proficiencyBonus,
}: DiceRollerProps) => {
  const resultId = `${id}-result`;
  const panelId = `${id}-roller`;
  const displayModifier =
    defaultModifier !== undefined
      ? defaultModifier
      : (abilityOptions?.[0]?.value ?? 0) + (proficiencyBonus ?? 0);

  return (
    <span class="dice-roller">
      <button
        class="dice-roller-trigger"
        type="button"
        popovertarget={panelId}
        popovertargetaction="toggle"
        aria-label={`Roll ${label}`}
      >
        d20
      </button>
      <div id={panelId} class="dice-roller-panel" popover="auto">
        <form
          class="dice-roller-form"
          hx-post={`/sheet/${characterSlug}/rolls`}
          hx-target={`#${resultId}`}
          hx-swap="outerHTML"
        >
          <input type="hidden" name="label" value={label} />
          <input type="hidden" name="resultId" value={resultId} />
          {defaultModifier !== undefined ? (
            <input type="hidden" name="modifier" value={String(defaultModifier)} />
          ) : null}
          {proficiencyBonus !== undefined ? (
            <input type="hidden" name="proficiencyBonus" value={String(proficiencyBonus)} />
          ) : null}
          <div class="dice-roller-fields">
            {abilityOptions ? (
              <label class="dice-roller-field dice-roller-field-wide">
                Ability
                <select name="baseModifier">
                  {abilityOptions.map((option) => (
                    <option value={String(option.value)}>
                      {option.label} {formatModifier(option.value)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label class="dice-roller-field">
              Mode
              <select name="mode">
                <option value="normal">Normal</option>
                <option value="advantage">Advantage</option>
                <option value="disadvantage">Disadvantage</option>
              </select>
            </label>
            <label class="dice-roller-field dice-roller-extra-field">
              Extra
              <input inputmode="numeric" name="additionalModifier" type="number" value="0" />
            </label>
          </div>
          <button type="submit">Roll</button>
        </form>
        <output id={resultId} class="dice-roll-result">
          Ready: d20 {formatModifier(displayModifier)}
        </output>
      </div>
    </span>
  );
};
