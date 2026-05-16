import type { CharacterProficiency, CharacterSheetReadModel } from "../../../db";
import { formatModifier } from "../../../characters/calculations";

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
  { category: "training", heading: "Training" },
];

export const SkillsTrainingTab = ({ sheet }: SkillsTrainingTabProps) => {
  return (
    <div class="skills-training-tab">
      <section class="sheet-data-section" aria-labelledby="skills-heading">
        <h3 id="skills-heading">Skills</h3>
        <div class="table-scroll">
          <table class="sheet-table">
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Ability</th>
                <th scope="col">Modifier</th>
                <th scope="col">Training</th>
              </tr>
            </thead>
            <tbody>
              {sheet.skills.map((skill) => (
                <tr>
                  <th scope="row">{formatSkill(skill.skill)}</th>
                  <td>{formatAbility(skill.ability)}</td>
                  <td>{formatModifier(skill.modifier)}</td>
                  <td>{formatProficiencyLevel(skill.proficiencyLevel)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section class="sheet-data-section" aria-labelledby="proficiencies-heading">
        <h3 id="proficiencies-heading">Proficiencies and training</h3>
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
                      {proficiency.detail ? <span>{proficiency.detail}</span> : null}
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

function formatProficiencyLevel(level: number) {
  if (level === 2) return "Expertise";
  if (level === 1) return "Proficient";

  return "Untrained";
}
