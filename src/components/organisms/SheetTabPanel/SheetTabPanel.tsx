import type {
  CharacterEquipment,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
} from "../../../db";
import { CompactList, type CompactListItem } from "../../molecules/CompactList";
import { CoreTab } from "../CoreTab";
import { SkillsTrainingTab } from "../SkillsTrainingTab";
import { getSheetTab, type SheetTabId } from "../SheetTabs";

interface SheetTabPanelProps {
  equipment: CharacterEquipment[];
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
  tabId: SheetTabId;
}

export const SheetTabPanel = ({
  equipment,
  notes,
  resources,
  ruleLinks,
  sheet,
  tabId,
}: SheetTabPanelProps) => {
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
      {renderTabContent(tab.id, { equipment, notes, resources, ruleLinks, sheet })}
    </section>
  );
};

interface TabContentData {
  equipment: CharacterEquipment[];
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function renderTabContent(tabId: SheetTabId, data: TabContentData) {
  const { sheet } = data;

  if (tabId === "core") return <CoreTab sheet={sheet} />;
  if (tabId === "skills") return <SkillsTrainingTab sheet={sheet} />;

  if (tabId === "actions") return <ActionsTab data={data} />;
  if (tabId === "spellcasting") return <SpellcastingTab data={data} />;
  if (tabId === "features") return <FeaturesTab data={data} />;
  if (tabId === "equipment") return <EquipmentTab data={data} />;
  if (tabId === "background") return <BackgroundTab data={data} />;
  if (tabId === "notes") return <NotesTab data={data} />;

  return null;
}

const ActionsTab = ({ data }: { data: TabContentData }) => {
  const actionResources = data.resources.filter(
    (resource) => !["hit_points", "inspiration", "temporary_hit_points"].includes(resource.type),
  );
  const weaponItems = data.equipment
    .filter((item) => item.category === "weapon")
    .map((item) => equipmentToItem(item));

  return (
    <div class="tab-compact-grid">
      {renderCompactSection(
        "action-resources-heading",
        "Action resources",
        actionResources.map(resourceToItem),
      )}
      {renderCompactSection("readied-actions-heading", "Readied actions", weaponItems)}
    </div>
  );
};

const SpellcastingTab = ({ data }: { data: TabContentData }) => {
  const spellcastingClass = data.sheet.classes.find((characterClass) =>
    Boolean(characterClass.spellcastingAbility),
  );
  const spells = data.ruleLinks.filter((link) => link.entityType === "spell");
  const spellSlots = data.resources.filter((resource) => resource.type === "spell_slot");

  return (
    <div class="tab-compact-grid">
      {renderCompactSection("spellcasting-summary-heading", "Spellcasting", [
        {
          label: "Ability",
          value: spellcastingClass?.spellcastingAbility
            ? formatWords(spellcastingClass.spellcastingAbility)
            : "None",
        },
        { label: "Proficiency", value: formatModifier(data.sheet.proficiencyBonus) },
        ...spellSlots.map(resourceToItem),
      ])}
      {renderCompactSection(
        "prepared-spells-heading",
        "Spells",
        spells.map((spell) => ({
          label: formatSelection(spell.selectionType),
          meta: spell.prepared ? `Prepared, ${spell.sourceName}` : spell.sourceName,
          value: spell.entityName,
        })),
      )}
    </div>
  );
};

const FeaturesTab = ({ data }: { data: TabContentData }) => {
  const featureLinks = data.ruleLinks.filter((link) => link.entityType !== "spell");

  return (
    <div class="tab-compact-grid">
      {renderCompactSection("class-feature-summary-heading", "Class and species", [
        { label: "Species", value: data.sheet.species },
        { label: "Class", value: formatClasses(data.sheet) },
        { label: "Background", value: data.sheet.background },
      ])}
      {renderCompactSection(
        "selected-features-heading",
        "Selected features",
        featureLinks.map((feature) => ({
          label: formatSelection(feature.selectionType),
          meta: feature.sourceName,
          value: feature.entityName,
        })),
      )}
    </div>
  );
};

const EquipmentTab = ({ data }: { data: TabContentData }) => {
  return (
    <div class="tab-compact-stack">
      {renderCompactSection(
        "equipment-list-heading",
        "Equipment",
        data.equipment.map((item) => equipmentToItem(item)),
      )}
    </div>
  );
};

const BackgroundTab = ({ data }: { data: TabContentData }) => {
  const languages = data.sheet.proficiencies
    .filter((proficiency) => proficiency.category === "language")
    .map((proficiency) => proficiency.name)
    .join(", ");
  const tools = data.sheet.proficiencies
    .filter((proficiency) => proficiency.category === "tool")
    .map((proficiency) => proficiency.name)
    .join(", ");

  return (
    <div class="tab-compact-grid">
      {renderCompactSection("background-summary-heading", "Background", [
        { label: "Origin", value: data.sheet.background },
        { label: "Campaign", value: "Rovnost Shadows" },
        { label: "Identity", value: `${data.sheet.name}, ${data.sheet.species}` },
      ])}
      {renderCompactSection("background-training-heading", "Training", [
        { label: "Tools", value: tools || "None recorded" },
        { label: "Languages", value: languages || "None recorded" },
      ])}
    </div>
  );
};

const NotesTab = ({ data }: { data: TabContentData }) => {
  return (
    <div class="tab-compact-stack">
      {renderCompactSection(
        "notes-list-heading",
        "Notes",
        data.notes.map((note) => ({
          label: note.visibility === "game_master" ? "Game Master" : "Player",
          meta: note.body,
          value: note.title,
        })),
      )}
    </div>
  );
};

function renderCompactSection(id: string, heading: string, items: CompactListItem[]) {
  return (
    <section class="tab-compact-section" aria-labelledby={id}>
      <h3 id={id}>{heading}</h3>
      {items.length > 0 ? <CompactList items={items} /> : <p class="tab-empty-state">None recorded.</p>}
    </section>
  );
}

function resourceToItem(resource: CharacterResource): CompactListItem {
  return {
    label: resource.label,
    value: resource.max === null ? String(resource.current) : `${resource.current} / ${resource.max}`,
  };
}

function equipmentToItem(item: CharacterEquipment): CompactListItem {
  return {
    label: formatWords(item.category),
    meta: `${item.equipped ? "Equipped" : "Carried"} · Qty ${item.quantity} · ${item.notes}`,
    value: item.name,
  };
}

function formatClasses(sheet: CharacterSheetReadModel) {
  return sheet.classes
    .map((characterClass) => {
      const className = [characterClass.subclassName, characterClass.className]
        .filter(Boolean)
        .join(" ");

      return `Level ${characterClass.level} ${className}`;
    })
    .join(", ");
}

function formatSelection(selectionType: string) {
  return formatWords(selectionType.replaceAll("_", " "));
}

function formatWords(value: string) {
  return value
    .split(" ")
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}
