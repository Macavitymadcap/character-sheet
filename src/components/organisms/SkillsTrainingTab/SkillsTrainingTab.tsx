import type { CharacterProficiency, CharacterSheetReadModel } from "../../../db";
import { formatModifier } from "../../../characters/calculations";
import { Icon } from "../../atoms/Icon";
import { DiceRoller } from "../../molecules/DiceRoller";

interface SkillsTrainingTabProps {
  sheet: CharacterSheetReadModel;
}

const proficiencyGroups: Array<{
  category: CharacterProficiency["category"];
  heading: string;
}> = [
  { category: "tool", heading: "Tools" },
  { category: "armour", heading: "Armour" },
  { category: "weapon", heading: "Weapons" },
  { category: "language", heading: "Languages" },
];

export const SkillsTrainingTab = ({ sheet }: SkillsTrainingTabProps) => {
  return (
    <div class="skills-training-tab">
      <section class="sheet-data-section" aria-labelledby="skills-heading">
        <h3 id="skills-heading">Skills</h3>
        <div class="table-scroll">
          <table class="sheet-table skills-table">
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Ability</th>
                <th scope="col">Mod</th>
                <th scope="col">Prof</th>
                <th scope="col">Roll</th>
                <th scope="col">Edit</th>
              </tr>
            </thead>
            <tbody>
              {sheet.skills.map((skill) => (
                <tr>
                  <th scope="row">{formatSkill(skill.skill)}</th>
                  <td>{formatAbility(skill.ability)}</td>
                  <td>{formatModifier(skill.modifier)}</td>
                  <td class="proficiency-icon-cell">{renderProficiencyIcon(skill.proficiencyLevel)}</td>
                  <td>
                    <DiceRoller
                      characterSlug={sheet.slug}
                      defaultModifier={skill.modifier}
                      id={`skill-${slugify(skill.skill)}`}
                      label={formatSkill(skill.skill)}
                    />
                  </td>
                  <td>
                    <details class="row-edit-disclosure">
                      <summary>Edit</summary>
                      <form
                        class="sheet-edit-form row-edit-form"
                        hx-patch={`/sheet/${sheet.slug}/skills/${encodeURIComponent(skill.skill)}`}
                        hx-target="#sheet-tab-panel"
                        hx-swap="outerHTML"
                      >
                        <label>
                          Training
                          <select name="proficiencyLevel">
                            <option value="0" selected={skill.proficiencyLevel === 0}>Untrained</option>
                            <option value="1" selected={skill.proficiencyLevel === 1}>Proficient</option>
                            <option value="2" selected={skill.proficiencyLevel === 2}>Expertise</option>
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

      <section class="sheet-data-section" aria-labelledby="proficiencies-heading">
        <h3 id="proficiencies-heading">Proficiencies</h3>
        <div class="proficiency-grid">
          {proficiencyGroups.map((group) => (
            <section class="proficiency-group" aria-labelledby={`proficiency-${group.category}`}>
              <h4 id={`proficiency-${group.category}`}>{group.heading}</h4>
              <ul>
                {sheet.proficiencies
                  .filter((proficiency) => proficiency.category === group.category)
                  .map((proficiency) => (
                    <li>
                      <strong>{proficiency.name}</strong>
                      {group.category === "tool" ? (
                        <DiceRoller
                          abilityOptions={abilityOptions(sheet)}
                          characterSlug={sheet.slug}
                          id={`tool-${slugify(proficiency.name)}`}
                          label={proficiency.name}
                          proficiencyBonus={sheet.proficiencyBonus}
                        />
                      ) : null}
                      {proficiency.detail ? <span>{proficiency.detail}</span> : null}
                      {proficiency.id ? (
                        <details class="row-edit-disclosure">
                          <summary>Edit</summary>
                          <form
                            class="sheet-edit-form row-edit-form"
                            hx-patch={`/sheet/${sheet.slug}/proficiencies/${proficiency.id}`}
                            hx-target="#sheet-tab-panel"
                            hx-swap="outerHTML"
                          >
                            <label>Name <input name="name" type="text" value={proficiency.name} /></label>
                            <label>Detail <input name="detail" type="text" value={proficiency.detail} /></label>
                            <button type="submit">Save</button>
                          </form>
                        </details>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
};

function formatAbility(ability: string) {
  return ability
    .split(" ")
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

function formatSkill(skill: string) {
  return formatAbility(skill);
}

function renderProficiencyIcon(level: number) {
  if (level === 2) return <Icon name="workspace_premium" label="Expertise" tone="warning" />;
  if (level === 1) return <Icon name="check_circle" label="Proficient" tone="success" />;

  return <Icon name="radio_button_unchecked" label="Untrained" tone="muted" />;
}

function abilityOptions(sheet: CharacterSheetReadModel) {
  return [
    { label: "None", value: 0 },
    ...sheet.abilities.map((ability) => ({
      label: formatAbility(ability.ability),
      value: ability.modifier,
    })),
  ];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
