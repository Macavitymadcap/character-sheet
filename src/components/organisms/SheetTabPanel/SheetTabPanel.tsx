import type { CharacterResource, CharacterSheetReadModel } from "../../../db";
import { LabelledOutput } from "../../atoms/LabelledOutput";
import { getSheetTab, type SheetTabId } from "../SheetTabs";

interface SheetTabPanelProps {
  resources: CharacterResource[];
  sheet: CharacterSheetReadModel;
  tabId: SheetTabId;
}

export const SheetTabPanel = ({ resources, sheet, tabId }: SheetTabPanelProps) => {
  const tab = getSheetTab(tabId);

  return (
    <section
      id="sheet-tab-panel"
      class="sheet-tab-panel"
      aria-labelledby={`sheet-tab-${tab.id}`}
      data-tab-id={tab.id}
      role="tabpanel"
    >
      <div class="tab-panel-heading">
        <h2>{tab.label}</h2>
        <p>{tab.description}</p>
      </div>
      <div class="tab-placeholder-grid">
        {getPlaceholderOutputs(tab.id, sheet, resources).map((output) => (
          <LabelledOutput label={output.label} value={output.value} />
        ))}
      </div>
    </section>
  );
};

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function getPlaceholderOutputs(
  tabId: SheetTabId,
  sheet: CharacterSheetReadModel,
  resources: CharacterResource[],
) {
  const resourceCount = String(resources.length);
  const trainedSkills = String(sheet.skills.filter((skill) => skill.proficiencyLevel > 0).length);

  const outputs: Record<SheetTabId, Array<{ label: string; value: string }>> = {
    actions: [
      { label: "Action records", value: "Ready" },
      { label: "Tracked resources", value: resourceCount },
    ],
    background: [
      { label: "Background", value: sheet.background },
      { label: "Campaign", value: "Rovnost Shadows" },
    ],
    core: [
      { label: "Proficiency bonus", value: formatModifier(sheet.proficiencyBonus) },
      { label: "Speed", value: `${sheet.speedFeet} ft` },
    ],
    equipment: [
      { label: "Armour", value: "Enhanced Defence" },
      { label: "Weapon", value: "Repeating Shot pistol" },
    ],
    features: [
      { label: "Infusions", value: "2 active" },
      { label: "Species", value: sheet.species },
    ],
    notes: [
      { label: "Player notes", value: "Available" },
      { label: "Game Master notes", value: "Role-gated" },
    ],
    skills: [
      { label: "Trained skills", value: trainedSkills },
      { label: "Training model", value: "SQLite" },
    ],
    spellcasting: [
      { label: "Spellcasting ability", value: "Intelligence" },
      { label: "Spell slots", value: "1st level" },
    ],
  };

  return outputs[tabId];
}
