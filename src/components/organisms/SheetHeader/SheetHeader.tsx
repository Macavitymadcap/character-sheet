import type { CharacterResource, CharacterSheetReadModel } from "../../../db";

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
          {sheet.species} · Level {sheet.level} {formatClassSummary(sheet)}
        </p>
      </div>
      <dl class="sheet-header-grid" aria-label="Sheet summary">
        <div class="sheet-metric">
          <dt>AC</dt>
          <dd>{sheet.armourClass}</dd>
        </div>
        <div class="sheet-metric">
          <dt>HP</dt>
          <dd>{formatHitPoints(sheet)}</dd>
        </div>
        <div class="sheet-metric">
          <dt>Init</dt>
          <dd>{formatModifier(sheet.initiative)}</dd>
        </div>
        <div class="sheet-metric">
          <dt>Speed</dt>
          <dd>{sheet.speedFeet} ft</dd>
        </div>
        <div class="sheet-metric sheet-metric-wide">
          <dt>State</dt>
          <dd>{formatConditions(resources)}</dd>
        </div>
        <div class="sheet-metric">
          <dt>Insp</dt>
          <dd>{formatInspiration(resources)}</dd>
        </div>
      </dl>
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
