import type { CharacterAbility, CharacterSheetReadModel } from "../../../db";
import { formatModifier } from "../../../characters/calculations";
import { Icon } from "../../atoms/Icon";
import { DiceRoller } from "../../molecules/DiceRoller";

interface CoreTabProps {
  sheet: CharacterSheetReadModel;
}

export const CoreTab = ({ sheet }: CoreTabProps) => {
  return (
    <div class="core-tab">
      <section class="sheet-data-section" aria-labelledby="abilities-heading">
        <h3 id="abilities-heading">Abilities and saves</h3>
        <div class="table-scroll">
          <table class="sheet-table ability-table">
            <thead>
              <tr>
                <th scope="col">Ability</th>
                <th scope="col">Score</th>
                <th scope="col">Mod</th>
                <th scope="col">Save</th>
                <th scope="col">Prof</th>
                <th scope="col">Roll</th>
                <th scope="col">Edit</th>
              </tr>
            </thead>
            <tbody>
              {sheet.abilities.map((ability) => (
                <tr>
                  <th scope="row">
                    <span class="ability-full">{formatAbility(ability.ability)}</span>
                    <abbr class="ability-short" title={formatAbility(ability.ability)}>
                      {formatAbilityShort(ability.ability)}
                    </abbr>
                  </th>
                  <td>{ability.score}</td>
                  <td>{formatModifier(ability.modifier)}</td>
                  <td>{formatModifier(ability.saveModifier)}</td>
                  <td class="proficiency-icon-cell">{renderSaveProficiencyIcon(ability.saveProficient)}</td>
                  <td>
                    <DiceRoller
                      characterSlug={sheet.slug}
                      defaultModifier={ability.modifier}
                      id={`ability-${ability.ability}`}
                      label={formatAbility(ability.ability)}
                    />
                  </td>
                  <td>
                    <details class="row-edit-disclosure">
                      <summary>Edit</summary>
                      <form
                        class="sheet-edit-form row-edit-form"
                        hx-patch={`/sheet/${sheet.slug}/abilities/${ability.ability}`}
                        hx-target="#sheet-tab-panel"
                        hx-swap="outerHTML"
                      >
                        <label>
                          Score
                          <input min="1" max="30" name="score" type="number" value={ability.score} />
                        </label>
                        <label>
                          Save proficient
                          <select name="saveProficient">
                            <option value="1" selected={ability.saveProficient}>Yes</option>
                            <option value="0" selected={!ability.saveProficient}>No</option>
                          </select>
                        </label>
                        <button type="submit">Save</button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section class="sheet-data-section" aria-labelledby="senses-speed-heading">
        <h3 id="senses-speed-heading">Senses and speed</h3>
        <dl class="sheet-description-grid sheet-description-grid-compact">
          <div>
            <dt>Speed</dt>
            <dd>{sheet.speedFeet} ft</dd>
          </div>
          {sheet.senses.map((sense) => (
            <div>
              <dt>{sense.label}</dt>
              <dd>
                {sense.value}
                {sense.id ? (
                  <details class="row-edit-disclosure">
                    <summary>Edit</summary>
                    <form
                      class="sheet-edit-form row-edit-form"
                      hx-patch={`/sheet/${sheet.slug}/senses/${sense.id}`}
                      hx-target="#sheet-tab-panel"
                      hx-swap="outerHTML"
                    >
                      <label>Label <input name="label" type="text" value={sense.label} /></label>
                      <label>Value <input name="value" type="text" value={sense.value} /></label>
                      <button type="submit">Save</button>
                    </form>
                  </details>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section class="sheet-data-section" aria-labelledby="armour-heading">
        <h3 id="armour-heading">Armour and defence</h3>
        <dl class="sheet-description-grid armour-defence-grid">
          <div class="armour-summary-card">
            <dt>Armour</dt>
            <dd class="armour-summary">
              <span class="armour-class-shield" aria-label={`Armour class ${sheet.armourClass}`}>
                <span>AC</span>
                <strong>{sheet.armourClass}</strong>
              </span>
              <span class="armour-summary-line">
                <strong>{formatArmourName(sheet)}</strong>
                <span>({formatArmourCalculation(sheet)})</span>
              </span>
            </dd>
          </div>
          {sheet.armourClassBreakdown.map((source) => (
            <div>
              <dt>{source.label}</dt>
              <dd>
                {source.value}
                {source.id ? (
                  <details class="row-edit-disclosure">
                    <summary>Edit</summary>
                    <form
                      class="sheet-edit-form row-edit-form"
                      hx-patch={`/sheet/${sheet.slug}/armour/${source.id}`}
                      hx-target="#sheet-tab-panel"
                      hx-swap="outerHTML"
                    >
                      <label>Label <input name="label" type="text" value={source.label} /></label>
                      <label>Value <input name="value" type="number" value={source.value} /></label>
                      <label>Notes <input name="notes" type="text" value={source.notes} /></label>
                      <button type="submit">Save</button>
                    </form>
                  </details>
                ) : null}
              </dd>
            </div>
          ))}
          {sheet.defences
            .filter((defence) => defence.type !== "armour")
            .map((defence) => (
              <div>
                <dt>{defence.label}</dt>
                <dd>
                  {formatDefenceDetail(defence.detail)}
                  {defence.id ? (
                    <details class="row-edit-disclosure">
                      <summary>Edit</summary>
                      <form
                        class="sheet-edit-form row-edit-form"
                        hx-patch={`/sheet/${sheet.slug}/defences/${defence.id}`}
                        hx-target="#sheet-tab-panel"
                        hx-swap="outerHTML"
                      >
                        <label>Label <input name="label" type="text" value={defence.label} /></label>
                        <label>Detail <input name="detail" type="text" value={defence.detail} /></label>
                        <button type="submit">Save</button>
                      </form>
                    </details>
                  ) : null}
                </dd>
              </div>
            ))}
        </dl>
      </section>
    </div>
  );
};

function renderSaveProficiencyIcon(isProficient: boolean) {
  return isProficient ? (
    <Icon name="check_circle" label="Proficient" tone="success" />
  ) : (
    <Icon name="radio_button_unchecked" label="Untrained" tone="muted" />
  );
}

function formatDefenceDetail(detail: string) {
  return detail === "None currently recorded." ? "None" : detail;
}

function formatArmourName(sheet: CharacterSheetReadModel) {
  return sheet.armourClassBreakdown[0]?.label ?? "Armour";
}

function formatArmourCalculation(sheet: CharacterSheetReadModel) {
  const terms = sheet.armourClassBreakdown.map((source, index) => {
    if (index === 0) return String(source.value);
    if (source.value < 0) return `- ${Math.abs(source.value)}`;

    return `+ ${source.value}`;
  });

  if (terms.length === 0) return String(sheet.armourClass);

  return `${terms.join(" ")} = ${sheet.armourClass}`;
}

function formatAbility(ability: CharacterAbility["ability"]) {
  const labels: Record<CharacterAbility["ability"], string> = {
    charisma: "Charisma",
    constitution: "Constitution",
    dexterity: "Dexterity",
    intelligence: "Intelligence",
    strength: "Strength",
    wisdom: "Wisdom",
  };

  return labels[ability];
}

function formatAbilityShort(ability: CharacterAbility["ability"]) {
  const labels: Record<CharacterAbility["ability"], string> = {
    charisma: "CHA",
    constitution: "CON",
    dexterity: "DEX",
    intelligence: "INT",
    strength: "STR",
    wisdom: "WIS",
  };

  return labels[ability];
}
