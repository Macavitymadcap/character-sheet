import type { ArmourClassSource, CharacterAbility, CharacterDefence, CharacterSense, CharacterSheetReadModel } from "../../../db";
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
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheet.abilities.map((ability) => <AbilityReadRow ability={ability} sheet={sheet} />)}
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
          {sheet.senses.map((sense) => <SenseReadCard sense={sense} sheet={sheet} />)}
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
          {sheet.armourClassBreakdown.map((source) => <ArmourReadCard sheet={sheet} source={source} />)}
          {sheet.defences
            .filter((defence) => defence.type !== "armour")
            .map((defence) => <DefenceReadCard defence={defence} sheet={sheet} />)}
        </dl>
      </section>
    </div>
  );
};

export const AbilityReadRow = ({
  ability,
  sheet,
}: {
  ability: CharacterAbility;
  sheet: CharacterSheetReadModel;
}) => (
  <tr id={abilityRowId(ability.ability)}>
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
    <td class="ability-action-cell">
      <DiceRoller
        characterSlug={sheet.slug}
        defaultModifier={ability.modifier}
        id={`ability-${ability.ability}`}
        label={formatAbility(ability.ability)}
      />
      <button
        class="row-edit-button"
        type="button"
        hx-get={`/sheet/${sheet.slug}/abilities/${ability.ability}/edit`}
        hx-target={`#${abilityRowId(ability.ability)}`}
        hx-swap="outerHTML"
        aria-label={`Edit ${formatAbility(ability.ability)} score and save`}
      >
        Edit
      </button>
    </td>
  </tr>
);

export const AbilityEditRow = ({
  ability,
  sheet,
}: {
  ability: CharacterAbility;
  sheet: CharacterSheetReadModel;
}) => (
  <tr id={abilityRowId(ability.ability)} class="inline-edit-row">
    <th scope="row">{formatAbility(ability.ability)}</th>
    <td colSpan={5}>
      <form
        class="sheet-edit-form row-edit-form row-edit-form-inline"
        hx-patch={`/sheet/${sheet.slug}/abilities/${ability.ability}`}
        hx-target={`#${abilityRowId(ability.ability)}`}
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
        <div class="row-edit-actions">
          <button type="submit">Save</button>
          <button
            type="button"
            hx-get={`/sheet/${sheet.slug}/abilities/${ability.ability}`}
            hx-target={`#${abilityRowId(ability.ability)}`}
            hx-swap="outerHTML"
          >
            Cancel
          </button>
        </div>
      </form>
    </td>
  </tr>
);

export const SenseReadCard = ({ sense, sheet }: { sense: CharacterSense; sheet: CharacterSheetReadModel }) => (
  <div id={senseCardId(sense)}>
    <dt>{sense.label}</dt>
    <dd class="sheet-inline-read">
      <span>{sense.value}</span>
      {sense.id ? (
        <button
          class="row-edit-button"
          type="button"
          hx-get={`/sheet/${sheet.slug}/senses/${sense.id}/edit`}
          hx-target={`#${senseCardId(sense)}`}
          hx-swap="outerHTML"
          aria-label={`Edit ${sense.label}`}
        >
          Edit
        </button>
      ) : null}
    </dd>
  </div>
);

export const SenseEditCard = ({ sense, sheet }: { sense: CharacterSense; sheet: CharacterSheetReadModel }) => (
  <div id={senseCardId(sense)} class="inline-edit-card">
    <dt>{sense.label}</dt>
    <dd>
      <form
        class="sheet-edit-form row-edit-form row-edit-form-inline"
        hx-patch={`/sheet/${sheet.slug}/senses/${sense.id}`}
        hx-target={`#${senseCardId(sense)}`}
        hx-swap="outerHTML"
      >
        <label>Label <input name="label" type="text" value={sense.label} /></label>
        <label>Value <input name="value" type="text" value={sense.value} /></label>
        <div class="row-edit-actions">
          <button type="submit">Save</button>
          <button
            type="button"
            hx-get={`/sheet/${sheet.slug}/senses/${sense.id}`}
            hx-target={`#${senseCardId(sense)}`}
            hx-swap="outerHTML"
          >
            Cancel
          </button>
        </div>
      </form>
    </dd>
  </div>
);

export const ArmourReadCard = ({ sheet, source }: { sheet: CharacterSheetReadModel; source: ArmourClassSource }) => (
  <div id={armourCardId(source)}>
    <dt>{source.label}</dt>
    <dd class="sheet-inline-read">
      <span>{source.value}</span>
      {source.id ? (
        <button
          class="row-edit-button"
          type="button"
          hx-get={`/sheet/${sheet.slug}/armour/${source.id}/edit`}
          hx-target={`#${armourCardId(source)}`}
          hx-swap="outerHTML"
          aria-label={`Edit ${source.label}`}
        >
          Edit
        </button>
      ) : null}
    </dd>
  </div>
);

export const ArmourEditCard = ({ sheet, source }: { sheet: CharacterSheetReadModel; source: ArmourClassSource }) => (
  <div id={armourCardId(source)} class="inline-edit-card">
    <dt>{source.label}</dt>
    <dd>
      <form
        class="sheet-edit-form row-edit-form row-edit-form-inline"
        hx-patch={`/sheet/${sheet.slug}/armour/${source.id}`}
        hx-target={`#${armourCardId(source)}`}
        hx-swap="outerHTML"
      >
        <label>Label <input name="label" type="text" value={source.label} /></label>
        <label>Value <input name="value" type="number" value={source.value} /></label>
        <label>Notes <input name="notes" type="text" value={source.notes} /></label>
        <div class="row-edit-actions">
          <button type="submit">Save</button>
          <button
            type="button"
            hx-get={`/sheet/${sheet.slug}/armour/${source.id}`}
            hx-target={`#${armourCardId(source)}`}
            hx-swap="outerHTML"
          >
            Cancel
          </button>
        </div>
      </form>
    </dd>
  </div>
);

export const DefenceReadCard = ({ defence, sheet }: { defence: CharacterDefence; sheet: CharacterSheetReadModel }) => (
  <div id={defenceCardId(defence)}>
    <dt>{defence.label}</dt>
    <dd class="sheet-inline-read">
      <span>{formatDefenceDetail(defence.detail)}</span>
      {defence.id ? (
        <button
          class="row-edit-button"
          type="button"
          hx-get={`/sheet/${sheet.slug}/defences/${defence.id}/edit`}
          hx-target={`#${defenceCardId(defence)}`}
          hx-swap="outerHTML"
          aria-label={`Edit ${defence.label}`}
        >
          Edit
        </button>
      ) : null}
    </dd>
  </div>
);

export const DefenceEditCard = ({ defence, sheet }: { defence: CharacterDefence; sheet: CharacterSheetReadModel }) => (
  <div id={defenceCardId(defence)} class="inline-edit-card">
    <dt>{defence.label}</dt>
    <dd>
      <form
        class="sheet-edit-form row-edit-form row-edit-form-inline"
        hx-patch={`/sheet/${sheet.slug}/defences/${defence.id}`}
        hx-target={`#${defenceCardId(defence)}`}
        hx-swap="outerHTML"
      >
        <label>Label <input name="label" type="text" value={defence.label} /></label>
        <label>Detail <input name="detail" type="text" value={defence.detail} /></label>
        <div class="row-edit-actions">
          <button type="submit">Save</button>
          <button
            type="button"
            hx-get={`/sheet/${sheet.slug}/defences/${defence.id}`}
            hx-target={`#${defenceCardId(defence)}`}
            hx-swap="outerHTML"
          >
            Cancel
          </button>
        </div>
      </form>
    </dd>
  </div>
);

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

function abilityRowId(ability: CharacterAbility["ability"]) {
  return `ability-row-${ability}`;
}

function senseCardId(sense: CharacterSense) {
  return `sense-card-${sense.id ?? slugify(sense.label)}`;
}

function armourCardId(source: ArmourClassSource) {
  return `armour-card-${source.id ?? slugify(source.label)}`;
}

function defenceCardId(defence: CharacterDefence) {
  return `defence-card-${defence.id ?? slugify(defence.label)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
