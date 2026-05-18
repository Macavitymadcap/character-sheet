import type {
  CharacterBackgroundEntry,
  CharacterEquipment,
  CharacterFactionChoice,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
  CampaignFaction,
} from "../../../db";
import { Accordion, type AccordionItem } from "../../molecules/Accordion";
import { CompactList, type CompactListItem } from "../../molecules/CompactList";
import { DiceRoller } from "../../molecules/DiceRoller";
import { CoreTab } from "../CoreTab";
import { SkillsTrainingTab } from "../SkillsTrainingTab";
import { getSheetTab, type SheetTabId } from "../SheetTabs";

interface SheetTabPanelProps {
  backgroundEntries: CharacterBackgroundEntry[];
  campaignFactions: CampaignFaction[];
  equipment: CharacterEquipment[];
  factionChoice: CharacterFactionChoice | null;
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
  tabId: SheetTabId;
}

export const SheetTabPanel = ({
  backgroundEntries,
  campaignFactions,
  equipment,
  factionChoice,
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
      {renderTabContent(tab.id, {
        backgroundEntries,
        campaignFactions,
        equipment,
        factionChoice,
        notes,
        resources,
        ruleLinks,
        sheet,
      })}
    </section>
  );
};

interface TabContentData {
  backgroundEntries: CharacterBackgroundEntry[];
  campaignFactions: CampaignFaction[];
  equipment: CharacterEquipment[];
  factionChoice: CharacterFactionChoice | null;
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
    (resource) => resource.type === "hit_dice",
  );
  const weaponItems = data.equipment
    .filter((item) => item.category === "weapon")
    .map((item) => weaponToActionItem(item, data.sheet.slug));

  return (
    <div class="tab-compact-grid">
      {renderRestControls(data.sheet.slug, "actions")}
      {renderCompactSection(
        "action-resources-heading",
        "Action resources",
        actionResources.map((resource) => resourceToItem(resource, data.sheet.slug, "actions")),
      )}
      {renderCompactSection("available-actions-heading", "Available actions", standardActionItems)}
      {renderCompactSection("bonus-reaction-heading", "Bonus actions and reactions", bonusReactionItems)}
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
  const spellcastingAbility = spellcastingClass?.spellcastingAbility ?? null;
  const spellcastingModifier =
    data.sheet.abilities.find((ability) => ability.ability === spellcastingAbility)?.modifier ?? 0;
  const spellAttack = spellcastingModifier + data.sheet.proficiencyBonus;
  const spellSaveDc = 8 + spellAttack;

  return (
    <div class="tab-compact-grid">
      {renderCompactSection("spellcasting-summary-heading", "Spellcasting", [
        {
          label: "Ability",
          value: spellcastingAbility ? formatWords(spellcastingAbility) : "None",
        },
        {
          label: "Spell attack",
          meta: `${formatModifier(spellcastingModifier)} ${formatModifier(data.sheet.proficiencyBonus)}`,
          value: formatModifier(spellAttack),
        },
        {
          label: "Save DC",
          meta: `8 ${formatModifier(spellcastingModifier)} ${formatModifier(data.sheet.proficiencyBonus)}`,
          value: String(spellSaveDc),
        },
        ...spellSlots.map((resource) => resourceToItem(resource, data.sheet.slug, "spellcasting")),
      ])}
      {renderAccordionSection(
        "prepared-spells-heading",
        "Spells",
        "spell-list",
        spells.map((spell) => spellToAccordionItem(spell, spellSlots[0], data.sheet.slug)),
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
      {renderAccordionSection(
        "selected-features-heading",
        "Selected features",
        "feature-list",
        featureLinks.map((feature) => featureToAccordionItem(feature, data.resources, data.sheet.slug)),
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
        data.equipment.map((item) => equipmentToItem(item, data.sheet.slug)),
      )}
    </div>
  );
};

const BackgroundTab = ({ data }: { data: TabContentData }) => {
  const profileItems = data.backgroundEntries
    .filter((entry) => ["personality", "ideal", "bond", "flaw"].includes(entry.category))
    .map((entry) => backgroundEntryToItem(entry, data.sheet.slug));
  const backstoryItems = data.backgroundEntries
    .filter((entry) => entry.category === "backstory")
    .map((entry) => backgroundEntryToItem(entry, data.sheet.slug));
  const identityItems = data.backgroundEntries
    .filter((entry) => entry.category === "false_identity")
    .map((entry) => backgroundEntryToItem(entry, data.sheet.slug));
  const npcItems = data.backgroundEntries
    .filter((entry) => entry.category === "npc")
    .map((entry) => backgroundEntryToItem(entry, data.sheet.slug));
  const rankItems = data.backgroundEntries
    .filter((entry) => entry.category === "rank")
    .map((entry) => backgroundEntryToItem(entry, data.sheet.slug));
  const selectedFaction = data.campaignFactions.find(
    (faction) => faction.id === data.factionChoice?.factionId,
  );

  return (
    <div class="tab-compact-grid">
      <section class="tab-compact-section faction-picker-section" aria-labelledby="background-faction-heading">
        <h3 id="background-faction-heading">Faction connection</h3>
        <form
          class="faction-picker"
          hx-patch={`/sheet/${data.sheet.slug}/faction`}
          hx-target="#sheet-tab-panel"
          hx-swap="outerHTML"
        >
          <label for={`faction-choice-${slugify(data.sheet.id)}`}>
            <strong>Primary faction</strong>
            <span>Background context</span>
          </label>
          <select id={`faction-choice-${slugify(data.sheet.id)}`} name="factionId">
            <option value="">Unaffiliated/Other</option>
            {data.campaignFactions.map((faction) => (
              <option value={faction.id} selected={faction.id === data.factionChoice?.factionId}>
                {faction.name}
              </option>
            ))}
          </select>
          <label for={`faction-note-${slugify(data.sheet.id)}`}>
            <strong>Connection note</strong>
          </label>
          <textarea id={`faction-note-${slugify(data.sheet.id)}`} name="connectionNote" rows={4}>
            {data.factionChoice?.connectionNote ?? ""}
          </textarea>
          <button type="submit">Save faction</button>
        </form>
        {selectedFaction ? (
          <article class="faction-summary-card">
            <p class="faction-motto">{selectedFaction.motto}</p>
            <h4>{selectedFaction.name}</h4>
            <p>{selectedFaction.summary}</p>
            <dl>
              <div>
                <dt>Public reputation</dt>
                <dd>{selectedFaction.publicReputation}</dd>
              </div>
              <div>
                <dt>Connection</dt>
                <dd>{data.factionChoice?.connectionNote || selectedFaction.playerPrompt}</dd>
              </div>
            </dl>
            {selectedFaction.wikiPageSlug ? (
              <a href={`/campaigns/rovnost-shadows/wiki/${selectedFaction.wikiPageSlug}`}>
                {selectedFaction.wikiPageTitle ?? "Faction wiki"}
              </a>
            ) : null}
          </article>
        ) : (
          <p class="tab-empty-state">
            {data.factionChoice?.connectionNote
              ? `Unaffiliated/Other: ${data.factionChoice.connectionNote}`
              : "No primary faction selected."}
          </p>
        )}
      </section>
      {renderCompactSection(
        "background-faction-options-heading",
        "Faction options",
        data.campaignFactions.map((faction) => ({
          label: faction.name,
          meta: `${faction.publicReputation} ${faction.connections.length > 0 ? `Connections: ${faction.connections.join(", ")}` : ""}`,
          value: faction.playerPrompt,
        })),
      )}
      {renderCompactSection("background-profile-heading", "Profile", profileItems)}
      {renderCompactSection("background-story-heading", "Backstory", backstoryItems)}
      {renderCompactSection("background-identities-heading", "False identities", identityItems)}
      {renderCompactSection("background-npcs-heading", "NPCs", npcItems)}
      {renderCompactSection("background-rank-heading", "Rank structure", rankItems)}
    </div>
  );
};

const NotesTab = ({ data }: { data: TabContentData }) => {
  return (
    <div class="tab-compact-stack">
      <section class="tab-compact-section" aria-labelledby="notes-list-heading">
        <h3 id="notes-list-heading">Notes</h3>
        <form
          class="note-editor note-editor-create"
          hx-post={`/sheet/${data.sheet.slug}/notes`}
          hx-target="#sheet-tab-panel"
          hx-swap="outerHTML"
        >
          <label for={`note-title-new-${slugify(data.sheet.id)}`}>
            <strong>New note</strong>
            <span>Visibility</span>
          </label>
          <input
            id={`note-title-new-${slugify(data.sheet.id)}`}
            name="title"
            placeholder="Title"
            required
            type="text"
          />
          <select name="visibility" aria-label="Note visibility">
            <option value="player">Player</option>
            <option value="game_master">Game Master</option>
          </select>
          <textarea name="body" rows={4} placeholder="Note body" aria-label="New note body"></textarea>
          <button type="submit">Add note</button>
        </form>
        {data.notes.length > 0 ? (
          <div class="note-editor-list">
            {data.notes.map((note) => (
              <form
                class="note-editor"
                hx-patch={`/sheet/${data.sheet.slug}/notes/${note.id}`}
                hx-target="#sheet-tab-panel"
                hx-swap="outerHTML"
              >
                <label for={`note-body-${slugify(note.id)}`}>
                  <strong>{note.title}</strong>
                  <span>{note.visibility === "game_master" ? "Game Master" : "Player"}</span>
                </label>
                <input
                  id={`note-title-${slugify(note.id)}`}
                  name="title"
                  aria-label={`${note.title} title`}
                  type="text"
                  value={note.title}
                />
                <textarea id={`note-body-${slugify(note.id)}`} name="body" rows={4}>
                  {note.body}
                </textarea>
                <div class="note-editor-actions">
                  <button type="submit">Save note</button>
                  <button
                    type="submit"
                    formaction={`/sheet/${data.sheet.slug}/notes/${note.id}/delete`}
                    formmethod="post"
                    hx-post={`/sheet/${data.sheet.slug}/notes/${note.id}/delete`}
                    hx-target="#sheet-tab-panel"
                    hx-swap="outerHTML"
                  >
                    Delete
                  </button>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <p class="tab-empty-state">None recorded.</p>
        )}
      </section>
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

function renderAccordionSection(id: string, heading: string, name: string, items: AccordionItem[]) {
  return (
    <section class="tab-compact-section" aria-labelledby={id}>
      <h3 id={id}>{heading}</h3>
      {items.length > 0 ? <Accordion name={name} items={items} /> : <p class="tab-empty-state">None recorded.</p>}
    </section>
  );
}

const standardActionItems: CompactListItem[] = [
  { label: "Action", value: "Attack" },
  { label: "Action", value: "Cast a spell" },
  { label: "Action", value: "Dash" },
  { label: "Action", value: "Disengage" },
  { label: "Action", value: "Dodge" },
  { label: "Action", value: "Help" },
  { label: "Action", value: "Hide" },
  { label: "Action", value: "Ready" },
  { label: "Action", value: "Search" },
  { label: "Action", value: "Use an object" },
];

const bonusReactionItems: CompactListItem[] = [
  {
    label: "Bonus action",
    meta: "Command, move, or detonate an active eldritch cannon.",
    value: "Eldritch Cannon",
  },
  {
    label: "Reaction",
    meta: "Make one melee attack when a hostile creature leaves reach.",
    value: "Opportunity attack",
  },
  {
    label: "Reaction spell",
    meta: "Spend a 1st-level spell slot when taking acid, cold, fire, lightning, or thunder damage.",
    value: "Absorb Elements",
  },
  {
    label: "Reaction spell",
    meta: "Spend a 1st-level spell slot when hit by an attack or targeted by Magic Missile.",
    value: "Shield",
  },
  {
    label: "Trigger",
    meta: "Add up to +2 from nearby allies after a failed roll or missed attack.",
    value: "Fortune from the Many",
  },
];

function resourceToItem(
  resource: CharacterResource,
  characterSlug?: string,
  tabId?: SheetTabId,
): CompactListItem {
  return {
    controls: characterSlug && tabId ? renderResourceControls(resource, characterSlug, tabId) : undefined,
    label: resource.label,
    value: resource.max === null ? String(resource.current) : `${resource.current} / ${resource.max}`,
  };
}

function weaponToActionItem(item: CharacterEquipment, characterSlug: string): CompactListItem {
  if (item.name.toLowerCase().includes("pistol")) {
    return {
      controls: (
        <DiceRoller
          characterSlug={characterSlug}
          defaultModifier={7}
          id={`attack-${slugify(item.id)}`}
          label="Pistol attack"
        />
      ),
      label: "Ranged weapon attack",
      meta: "+7 to hit; Range 30/90 ft.; Hit: 1d10 + 4 magical piercing damage.",
      value: item.name,
    };
  }

  return equipmentToItem(item);
}

function spellToAccordionItem(
  spell: CharacterRuleLink,
  firstLevelSlot: CharacterResource | undefined,
  characterSlug: string,
): AccordionItem {
  const isCantrip = spell.selectionType === "known_cantrip";

  return {
    body: (
      <div class="tab-card-copy">
        <p>
          {formatSelection(spell.selectionType)} from {spell.sourceName}.
        </p>
        <p>
          {isCantrip
            ? "Cantrip: no spell slot required."
            : "Prepared spell: casting spends one available 1st-level spell slot."}
        </p>
      </div>
    ),
    controls: isCantrip ? undefined : renderSpellCastControls(firstLevelSlot, characterSlug),
    id: `spell-card-${slugify(spell.entityName)}`,
    meta: spell.prepared ? `Prepared · ${spell.sourceName}` : spell.sourceName,
    title: spell.entityName,
  };
}

function renderSpellCastControls(slot: CharacterResource | undefined, characterSlug: string) {
  if (!slot) return null;

  return (
    <form hx-patch={`/sheet/${characterSlug}/resources/${slot.id}`} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
      <input type="hidden" name="tabId" value="spellcasting" />
      <input type="hidden" name="delta" value="-1" />
      <button type="submit" disabled={slot.current <= 0}>
        Cast
      </button>
    </form>
  );
}

function featureToAccordionItem(
  feature: CharacterRuleLink,
  resources: CharacterResource[],
  characterSlug: string,
): AccordionItem {
  const resource = resources.find(
    (candidate) => candidate.label.toLowerCase() === feature.entityName.toLowerCase(),
  );

  return {
    body: (
      <div class="tab-card-copy">
        <p>
          {formatSelection(feature.selectionType)} from {feature.sourceName}.
        </p>
        {resource ? (
          <p>
            Uses: {resource.current} / {resource.max ?? "∞"}
          </p>
        ) : null}
      </div>
    ),
    controls: resource ? renderResourceControls(resource, characterSlug, "features") : undefined,
    id: `feature-card-${slugify(feature.entityName)}`,
    meta: feature.sourceName,
    title: feature.entityName,
  };
}

function renderResourceControls(resource: CharacterResource, characterSlug: string, tabId: SheetTabId) {
  const target = `/sheet/${characterSlug}/resources/${resource.id}`;
  const canSpend = resource.current > 0;
  const canRestore = resource.max === null || resource.current < resource.max;

  return (
    <span class="tab-resource-controls" role="group" aria-label={`${resource.label} controls`}>
      <form hx-patch={target} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
        <input type="hidden" name="tabId" value={tabId} />
        <input type="hidden" name="delta" value="-1" />
        <button type="submit" aria-label={`Spend one ${resource.label}`} disabled={!canSpend}>
          −
        </button>
      </form>
      <form hx-patch={target} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
        <input type="hidden" name="tabId" value={tabId} />
        <input type="hidden" name="delta" value="1" />
        <button type="submit" aria-label={`Restore one ${resource.label}`} disabled={!canRestore}>
          +
        </button>
      </form>
    </span>
  );
}

function renderRestControls(characterSlug: string, tabId: SheetTabId) {
  return (
    <section class="tab-compact-section tab-rest-section" aria-labelledby="rest-actions-heading">
      <h3 id="rest-actions-heading">Rest</h3>
      <div class="tab-rest-controls" role="group" aria-label="Rest actions">
        <form
          hx-post={`/sheet/${characterSlug}/rests/short`}
          hx-target="#sheet-tab-workspace"
          hx-swap="outerHTML"
        >
          <input type="hidden" name="tabId" value={tabId} />
          <button type="submit">Short rest</button>
        </form>
        <form
          hx-post={`/sheet/${characterSlug}/rests/long`}
          hx-target="#sheet-tab-workspace"
          hx-swap="outerHTML"
        >
          <input type="hidden" name="tabId" value={tabId} />
          <button type="submit">Long rest</button>
        </form>
      </div>
    </section>
  );
}

function equipmentToItem(item: CharacterEquipment, characterSlug?: string): CompactListItem {
  if (item.category === "money") {
    return {
      controls: characterSlug ? renderEquipmentControls(item, characterSlug) : undefined,
      label: "Money",
      meta: item.notes,
      value: `${item.quantity} gp`,
    };
  }

  return {
    controls: characterSlug ? renderEquipmentControls(item, characterSlug) : undefined,
    label: formatWords(item.category),
    meta: `${item.equipped ? "Equipped" : "Carried"} · Qty ${item.quantity} · ${item.notes}`,
    value: item.name,
  };
}

function renderEquipmentControls(item: CharacterEquipment, characterSlug: string) {
  const target = `/sheet/${characterSlug}/equipment/${item.id}`;
  const canReduce = item.quantity > 0;
  const showEquippedToggle = item.category !== "money" && item.category !== "gear";

  return (
    <span class="tab-resource-controls" role="group" aria-label={`${item.name} controls`}>
      <form hx-patch={target} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
        <input type="hidden" name="deltaQuantity" value="-1" />
        <button type="submit" aria-label={`Remove one ${item.name}`} disabled={!canReduce}>
          −
        </button>
      </form>
      <form hx-patch={target} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
        <input type="hidden" name="deltaQuantity" value="1" />
        <button type="submit" aria-label={`Add one ${item.name}`}>
          +
        </button>
      </form>
      {showEquippedToggle ? (
        <form hx-patch={target} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
          <input type="hidden" name="equipped" value={item.equipped ? "0" : "1"} />
          <button type="submit" aria-label={item.equipped ? `Carry ${item.name}` : `Equip ${item.name}`}>
            {item.equipped ? "C" : "E"}
          </button>
        </form>
      ) : null}
      <details class="row-edit-disclosure">
        <summary>Edit</summary>
        <form class="sheet-edit-form row-edit-form" hx-patch={target} hx-target="#sheet-tab-panel" hx-swap="outerHTML">
          <label>Name <input name="name" type="text" value={item.name} /></label>
          <label>Category <input name="category" type="text" value={item.category} /></label>
          <label>Quantity <input min="0" name="quantity" type="number" value={item.quantity} /></label>
          <label>
            Equipped
            <select name="equipped">
              <option value="1" selected={item.equipped}>Yes</option>
              <option value="0" selected={!item.equipped}>No</option>
            </select>
          </label>
          <label>Notes <input name="notes" type="text" value={item.notes} /></label>
          <button type="submit">Save</button>
        </form>
      </details>
    </span>
  );
}

function backgroundEntryToItem(entry: CharacterBackgroundEntry, characterSlug?: string): CompactListItem {
  return {
    controls: characterSlug ? (
      <details class="row-edit-disclosure">
        <summary>Edit</summary>
        <form
          class="sheet-edit-form row-edit-form"
          hx-patch={`/sheet/${characterSlug}/background/${entry.id}`}
          hx-target="#sheet-tab-panel"
          hx-swap="outerHTML"
        >
          <label>Title <input name="title" type="text" value={entry.title} /></label>
          <label>Body <textarea name="body" rows={3}>{entry.body}</textarea></label>
          <button type="submit">Save</button>
        </form>
      </details>
    ) : undefined,
    label: formatWords(entry.category.replaceAll("_", " ")),
    meta: entry.body,
    value: entry.title,
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
