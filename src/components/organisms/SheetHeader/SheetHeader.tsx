import type { CharacterResource, CharacterSheetReadModel } from "../../../db";
import { LabelledOutput } from "../../atoms/LabelledOutput";

interface SheetHeaderProps {
  resources: CharacterResource[];
  sheet: CharacterSheetReadModel;
}

export const SheetHeader = ({ resources, sheet }: SheetHeaderProps) => {
  return (
    <section id="sheet-header" class="sheet-header" aria-labelledby="sheet-heading">
      <div class="sheet-title-block">
        <h1 id="sheet-heading" class="sheet-heading">
          {sheet.name}
        </h1>
        <p class="sheet-subtitle">
          {sheet.species} {formatClassSummary(sheet)}
        </p>
      </div>
      <div class="sheet-header-grid" aria-label="Sheet summary">
        <LabelledOutput label="Name" value={sheet.name} />
        <LabelledOutput label="Species" value={sheet.species} />
        <LabelledOutput label="Class" value={formatClassSummary(sheet)} />
        <LabelledOutput label="Level" value={String(sheet.level)} />
        <LabelledOutput label="Armour class" value={String(sheet.armourClass)} />
        <LabelledOutput label="Hit points" value={formatHitPoints(sheet)} />
        <LabelledOutput label="Initiative" value={formatModifier(sheet.initiative)} />
        <LabelledOutput label="Conditions" value={formatConditions(resources)} />
        <LabelledOutput label="Inspiration" value={formatInspiration(resources)} />
        <LabelledOutput label="Rest" value="Short / long" />
        <LabelledOutput label="Settings" value="Local" />
      </div>
    </section>
  );
};

function formatClassSummary(sheet: CharacterSheetReadModel) {
  const classes = sheet.classes.map((characterClass) =>
    characterClass.subclassName
      ? `${characterClass.subclassName} ${characterClass.className}`
      : characterClass.className,
  );

  return classes.join(" / ");
}

function formatHitPoints(sheet: CharacterSheetReadModel) {
  const base = `${sheet.hitPoints.current} / ${sheet.hitPoints.max}`;
  if (sheet.hitPoints.temporary <= 0) return base;

  return `${base} + ${sheet.hitPoints.temporary} temporary`;
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function formatConditions(resources: CharacterResource[]) {
  const activeConditions = resources.filter(
    (resource) => resource.type === "condition" && resource.current > 0,
  );

  return activeConditions.length > 0
    ? activeConditions.map((resource) => resource.label).join(", ")
    : "None";
}

function formatInspiration(resources: CharacterResource[]) {
  const inspiration = resources.find((resource) => resource.key === "inspiration");
  if (!inspiration) return "No";

  return inspiration.current > 0 ? "Yes" : "No";
}
