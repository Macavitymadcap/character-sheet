import type { CharacterResource, CharacterSheetReadModel } from "../../../db";
import { Switch } from "../../atoms/Switch";

interface SheetHeaderProps {
  resources: CharacterResource[];
  sheet: CharacterSheetReadModel;
}

export const SheetHeader = ({ resources, sheet }: SheetHeaderProps) => {
  const hitPoints = findResource(resources, "hit_points");
  const temporaryHitPoints = findResource(resources, "temporary_hit_points");
  const inspiration = findResource(resources, "inspiration");
  const activeConditions = resources.filter(
    (resource) => resource.type === "condition" && resource.current > 0,
  );
  const hitPointTarget = hitPoints
    ? `/sheet/${sheet.slug}/resources/${hitPoints.id}`
    : undefined;
  const temporaryHitPointTarget = temporaryHitPoints
    ? `/sheet/${sheet.slug}/resources/${temporaryHitPoints.id}`
    : undefined;
  const inspirationTarget = inspiration
    ? `/sheet/${sheet.slug}/resources/${inspiration.id}`
    : undefined;

  return (
    <section id="sheet-header" class="sheet-header" aria-labelledby="sheet-heading">
      <div class="sheet-title-block">
        <h1 id="sheet-heading" class="sheet-heading">
          {sheet.name}
        </h1>
        <p class="sheet-subtitle">
          {sheet.species} · Level {sheet.level} {formatClassSummary(sheet)}
        </p>
        <details class="sheet-edit-disclosure">
          <summary>Edit summary</summary>
          <form
            class="sheet-edit-form sheet-summary-edit-form"
            hx-patch={`/sheet/${sheet.slug}/summary`}
            hx-target="#sheet-header"
            hx-swap="outerHTML"
          >
            <label>Name <input name="name" type="text" value={sheet.name} /></label>
            <label>Species <input name="species" type="text" value={sheet.species} /></label>
            <label>Class <input name="className" type="text" value={sheet.classes[0]?.className ?? ""} /></label>
            <label>Subclass <input name="subclassName" type="text" value={sheet.classes[0]?.subclassName ?? ""} /></label>
            <label>Background <input name="background" type="text" value={sheet.background} /></label>
            <label>Level <input min="1" name="level" type="number" value={sheet.level} /></label>
            <label>Initiative <input name="initiative" type="number" value={sheet.initiative} /></label>
            <label>Speed <input min="0" name="speedFeet" type="number" value={sheet.speedFeet} /></label>
            <label>Max HP <input min="1" name="hitPointMax" type="number" value={sheet.hitPoints.max} /></label>
            <label>Proficiency <input min="0" name="proficiencyBonus" type="number" value={sheet.proficiencyBonus} /></label>
            <button type="submit">Save summary</button>
          </form>
        </details>
      </div>
      <dl class="sheet-header-grid" aria-label="Sheet summary">
        <div class="sheet-metric">
          <dt>AC</dt>
          <dd>{sheet.armourClass}</dd>
        </div>
        <div class="sheet-metric">
          <dt>HP</dt>
          <dd>
            <details class="hp-control">
              <summary class="metric-value-button" aria-label="Manage hit points">
                {formatHitPoints(sheet)}
              </summary>
              <div class="metric-popover" role="group" aria-label="Hit point controls">
                <p class="metric-popover-heading">Hit points</p>
                {hitPointTarget ? (
                  <div class="metric-stepper" role="group" aria-label="Current hit points">
                    <form hx-patch={hitPointTarget} hx-target="#sheet-header" hx-swap="outerHTML">
                      <input type="hidden" name="delta" value="-1" />
                      <button type="submit" aria-label="Subtract 1 hit point">
                        <span aria-hidden="true">−</span>
                      </button>
                    </form>
                    <span>
                      {sheet.hitPoints.current} / {sheet.hitPoints.max}
                    </span>
                    <form hx-patch={hitPointTarget} hx-target="#sheet-header" hx-swap="outerHTML">
                      <input type="hidden" name="delta" value="1" />
                      <button type="submit" aria-label="Add 1 hit point">
                        <span aria-hidden="true">+</span>
                      </button>
                    </form>
                  </div>
                ) : null}
                {temporaryHitPointTarget ? (
                  <form
                    class="metric-popover-form"
                    hx-patch={temporaryHitPointTarget}
                    hx-target="#sheet-header"
                    hx-swap="outerHTML"
                  >
                    <label for="temporary-hit-points-input">Temp HP</label>
                    <input
                      id="temporary-hit-points-input"
                      inputmode="numeric"
                      min="0"
                      name="current"
                      type="number"
                      value={sheet.hitPoints.temporary}
                  />
                  <button type="submit" aria-label="Set temporary hit points">
                    <span aria-hidden="true">✓</span>
                  </button>
                </form>
                ) : null}
              </div>
            </details>
          </dd>
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
          <dt>Conditions</dt>
          <dd>{renderConditions(activeConditions, sheet.slug)}</dd>
        </div>
        <div class="sheet-metric">
          <dt>Insp</dt>
          <dd>
            {inspirationTarget ? (
              <Switch
                id="inspiration-toggle"
                label="Inspiration"
                checked={isInspired(resources)}
                offIcon="radio_button_unchecked"
                onIcon="auto_awesome"
                variant="inspiration"
                hxPatch={inspirationTarget}
                hxTarget="#sheet-header"
                hxTrigger="change delay:250ms"
                hxSwap="outerHTML"
                hxVals="js:{current: event.target.checked ? 1 : 0}"
              />
            ) : (
              "No"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
};

function findResource(resources: CharacterResource[], key: string) {
  return resources.find((resource) => resource.key === key);
}

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

function isInspired(resources: CharacterResource[]) {
  const inspiration = resources.find((resource) => resource.key === "inspiration");

  return Boolean(inspiration && inspiration.current > 0);
}

function renderConditions(activeConditions: CharacterResource[], characterSlug: string) {
  const panelId = `condition-popover-${characterSlug}`;

  return (
    <span class="condition-control">
      <button
        class="metric-value-button"
        type="button"
        aria-label="Manage conditions"
        popovertarget={panelId}
        popovertargetaction="toggle"
      >
        {activeConditions.length > 0 ? (
          <span class="condition-chip-list">
            {activeConditions.map((condition) => (
              <span class="condition-chip">{condition.label}</span>
            ))}
          </span>
        ) : (
          "None"
        )}
      </button>
      <div
        id={panelId}
        class="metric-popover condition-popover"
        role="group"
        aria-label="Condition controls"
        popover="auto"
      >
        <p class="metric-popover-heading">Conditions</p>
        {activeConditions.length > 0 ? (
          <div class="condition-chip-list">
            {activeConditions.map((condition) => (
              <form
                class="condition-chip-form"
                hx-patch={`/sheet/${characterSlug}/resources/${condition.id}`}
                hx-target="#sheet-header"
                hx-swap="outerHTML"
              >
                <input type="hidden" name="current" value="0" />
                <button type="submit" class="condition-chip" aria-label={`Remove ${condition.label}`}>
                  {condition.label} ×
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p class="condition-empty">No active conditions.</p>
        )}
        <form
          class="condition-add-form"
          hx-post={`/sheet/${characterSlug}/conditions`}
          hx-target="#sheet-header"
          hx-swap="outerHTML"
        >
          <label for="condition-label-input">Add condition</label>
          <input id="condition-label-input" name="label" type="text" placeholder="Custom condition" />
          <button type="submit">Add</button>
        </form>
      </div>
    </span>
  );
}
