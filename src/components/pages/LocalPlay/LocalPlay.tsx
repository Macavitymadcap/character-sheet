import { raw } from "hono/html";
import {
  localPlayDocumentVersion,
  localPlaySchema,
  localPlayStorageKey,
} from "../../../local-play/document";
import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

type LocalPlayKind = "campaigns" | "characters";

interface LocalPlayPageProps {
  appName: string;
  kind: LocalPlayKind;
}

const localPlayScript = /* js */ `
(() => {
  const storageKey = ${JSON.stringify(localPlayStorageKey)};
  const schema = ${JSON.stringify(localPlaySchema)};
  const version = ${localPlayDocumentVersion};

  const emptyDocument = () => ({
    campaigns: [],
    characters: [],
    exportedAt: new Date().toISOString(),
    metadata: { source: "browser-local" },
    schema,
    version,
  });

  const readDocument = () => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return emptyDocument();
      const parsed = JSON.parse(stored);
      const validation = validateDocument(parsed);
      return validation.ok ? parsed : emptyDocument();
    } catch {
      return emptyDocument();
    }
  };

  const writeDocument = (document) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      ...document,
      exportedAt: new Date().toISOString(),
    }));
  };

  const byUpdatedAt = (left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt));

  const render = (root) => {
    const kind = root.dataset.localPlayKind;
    const localDocument = readDocument();
    const records = [...localDocument[kind]].sort(byUpdatedAt);
    const list = root.querySelector("[data-local-play-list]");
    const empty = root.querySelector("[data-local-play-empty]");
    const count = root.querySelector("[data-local-play-count]");
    const status = root.querySelector("[data-local-play-status]");

    if (count) count.textContent = String(records.length);
    if (status && !status.textContent) status.textContent = "Stored only in this browser.";
    if (!list || !empty) return;

    list.replaceChildren();
    empty.hidden = records.length > 0;
    list.hidden = records.length === 0;

    for (const record of records) {
      const item = document.createElement("li");
      item.className = "local-play-record";
      const title = document.createElement("h3");
      title.textContent = record.name;
      const summary = document.createElement("p");
      summary.textContent = kind === "characters"
        ? [record.species, record.className, "Level " + record.level].filter(Boolean).join(" - ")
        : record.currentScene || "No current scene recorded.";
      const notes = document.createElement("p");
      notes.className = "local-play-record-notes";
      notes.textContent = record.notes || "No notes yet.";
      const actions = document.createElement("div");
      actions.className = "local-play-record-actions";
      const edit = document.createElement("button");
      edit.className = "button";
      edit.dataset.localPlayEdit = record.id;
      edit.dataset.variant = "ghost";
      edit.type = "button";
      edit.textContent = "Edit";
      const remove = document.createElement("button");
      remove.className = "button";
      remove.dataset.localPlayDelete = record.id;
      remove.dataset.variant = "ghost";
      remove.type = "button";
      remove.textContent = "Delete";
      actions.append(edit, remove);
      item.append(title, summary, notes, actions);
      list.append(item);
    }
  };

  const normaliseText = (formData, name) => String(formData.get(name) || "").trim();

  const saveRecord = (root, form) => {
    const kind = root.dataset.localPlayKind;
    const formData = new FormData(form);
    const editingId = form.dataset.localPlayEditingId || "";
    const now = new Date().toISOString();
    const localDocument = readDocument();

    if (kind === "characters") {
      const nextRecord = {
        className: normaliseText(formData, "className"),
        id: editingId || "local-character-" + crypto.randomUUID(),
        level: Number(normaliseText(formData, "level")),
        name: normaliseText(formData, "name"),
        notes: normaliseText(formData, "notes"),
        species: normaliseText(formData, "species"),
        updatedAt: now,
      };
      localDocument.characters = editingId
        ? localDocument.characters.map((record) => record.id === editingId ? nextRecord : record)
        : [...localDocument.characters, nextRecord];
    } else {
      const nextRecord = {
        currentScene: normaliseText(formData, "currentScene"),
        id: editingId || "local-campaign-" + crypto.randomUUID(),
        name: normaliseText(formData, "name"),
        notes: normaliseText(formData, "notes"),
        updatedAt: now,
      };
      localDocument.campaigns = editingId
        ? localDocument.campaigns.map((record) => record.id === editingId ? nextRecord : record)
        : [...localDocument.campaigns, nextRecord];
    }

    writeDocument(localDocument);
    resetForm(form);
    setStatus(root, kind === "characters" ? "Local character saved in this browser." : "Local campaign saved in this browser.");
    render(root);
  };

  const editRecord = (root, recordId) => {
    const kind = root.dataset.localPlayKind;
    const form = root.querySelector("[data-local-play-form]");
    const localDocument = readDocument();
    const record = localDocument[kind].find((candidate) => candidate.id === recordId);
    if (!form || !record) return;

    form.dataset.localPlayEditingId = record.id;
    form.elements.name.value = record.name;
    form.elements.notes.value = record.notes;

    if (kind === "characters") {
      form.elements.species.value = record.species;
      form.elements.className.value = record.className;
      form.elements.level.value = String(record.level);
    } else {
      form.elements.currentScene.value = record.currentScene;
    }

    const submit = root.querySelector("[data-local-play-submit]");
    if (submit) submit.textContent = kind === "characters" ? "Update character" : "Update campaign";
    form.scrollIntoView({ block: "start", inline: "nearest" });
    setStatus(root, "Editing " + record.name + ".");
  };

  const deleteRecord = (root, recordId) => {
    const kind = root.dataset.localPlayKind;
    const localDocument = readDocument();
    const records = localDocument[kind];
    const record = records.find((candidate) => candidate.id === recordId);
    if (!record) return;
    if (!window.confirm("Delete " + record.name + " from this browser?")) return;

    if (kind === "characters") {
      localDocument.characters = localDocument.characters.filter((candidate) => candidate.id !== recordId);
    } else {
      localDocument.campaigns = localDocument.campaigns.filter((candidate) => candidate.id !== recordId);
    }

    const form = root.querySelector("[data-local-play-form]");
    if (form?.dataset.localPlayEditingId === recordId) resetForm(form);
    writeDocument(localDocument);
    setStatus(root, record.name + " deleted from this browser.");
    render(root);
  };

  const resetForm = (form) => {
    form.reset();
    delete form.dataset.localPlayEditingId;
    const root = form.closest("[data-local-play]");
    const submit = root?.querySelector("[data-local-play-submit]");
    if (submit) submit.textContent = root.dataset.localPlayKind === "characters" ? "Save character" : "Save campaign";
  };

  const exportDocument = (root) => {
    const localDocument = { ...readDocument(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(localDocument, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "campaign-ledger-local-play.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(root, "Export prepared as a JSON file.");
  };

  const importDocument = async (root, input) => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const validation = validateDocument(parsed);
      if (!validation.ok) {
        setStatus(root, validation.error, true);
        return;
      }
      const current = readDocument();
      const currentCount = current.characters.length + current.campaigns.length;
      const incomingCount = parsed.characters.length + parsed.campaigns.length;
      if (
        currentCount > 0 &&
        !window.confirm("Import " + incomingCount + " records and replace " + currentCount + " records currently stored in this browser?")
      ) {
        setStatus(root, "Import cancelled. Local data was not changed.");
        return;
      }
      writeDocument(parsed);
      const form = root.querySelector("[data-local-play-form]");
      if (form) resetForm(form);
      setStatus(root, "Import complete. Local data was replaced by the file.");
      render(root);
    } catch {
      setStatus(root, "Import file must contain valid JSON.", true);
    } finally {
      input.value = "";
    }
  };

  const validateDocument = (value) => {
    if (!isRecord(value)) return { error: "Import must be a JSON object.", ok: false };
    if (value.schema !== schema) return { error: "Import is not a Campaign Ledger local-play export.", ok: false };
    if (value.version !== version) return { error: "Import version " + String(value.version) + " is not supported.", ok: false };
    if (!isDate(value.exportedAt)) return { error: "Import is missing a valid exportedAt timestamp.", ok: false };
    if (!isRecord(value.metadata) || value.metadata.source !== "browser-local") return { error: "Import metadata is missing or invalid.", ok: false };
    if (!Array.isArray(value.characters)) return { error: "Import characters must be a list.", ok: false };
    if (!Array.isArray(value.campaigns)) return { error: "Import campaigns must be a list.", ok: false };
    for (const character of value.characters) {
      const error = validateCharacter(character);
      if (error) return { error, ok: false };
    }
    for (const campaign of value.campaigns) {
      const error = validateCampaign(campaign);
      if (error) return { error, ok: false };
    }
    return { ok: true };
  };

  const validateCharacter = (value) => {
    if (!isRecord(value)) return "Each character must be a JSON object.";
    if (!hasText(value.id)) return "Each character needs an id.";
    if (!hasText(value.name)) return "Each character needs a name.";
    if (!hasText(value.species)) return "Each character needs a species.";
    if (!hasText(value.className)) return "Each character needs a class.";
    if (!Number.isInteger(value.level) || value.level < 1 || value.level > 20) return "Each character level must be a whole number from 1 to 20.";
    if (typeof value.notes !== "string") return "Each character notes field must be text.";
    if (!isDate(value.updatedAt)) return "Each character needs a valid updatedAt timestamp.";
  };

  const validateCampaign = (value) => {
    if (!isRecord(value)) return "Each campaign must be a JSON object.";
    if (!hasText(value.id)) return "Each campaign needs an id.";
    if (!hasText(value.name)) return "Each campaign needs a name.";
    if (typeof value.currentScene !== "string") return "Each campaign current scene must be text.";
    if (typeof value.notes !== "string") return "Each campaign notes field must be text.";
    if (!isDate(value.updatedAt)) return "Each campaign needs a valid updatedAt timestamp.";
  };

  const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  const hasText = (value) => typeof value === "string" && value.trim().length > 0;
  const isDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

  const setStatus = (root, message, isError = false) => {
    const status = root.querySelector("[data-local-play-status]");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? "error" : "ok";
  };

  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-local-play]").forEach((root) => {
      render(root);
      root.querySelector("[data-local-play-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        saveRecord(root, event.currentTarget);
      });
      root.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const edit = target?.closest?.("[data-local-play-edit]");
        const remove = target?.closest?.("[data-local-play-delete]");
        if (edit) editRecord(root, edit.dataset.localPlayEdit);
        if (remove) deleteRecord(root, remove.dataset.localPlayDelete);
      });
      root.querySelector("[data-local-play-export]")?.addEventListener("click", () => exportDocument(root));
      root.querySelector("[data-local-play-import-trigger]")?.addEventListener("click", () => {
        root.querySelector("[data-local-play-import]")?.click();
      });
      root.querySelector("[data-local-play-import]")?.addEventListener("change", (event) => importDocument(root, event.currentTarget));
    });
  });
})();
`;

export const LocalPlayPage = ({ appName, kind }: LocalPlayPageProps) => {
  const isCharacters = kind === "characters";
  const title = isCharacters ? "Local characters" : "Local campaigns";
  const description = isCharacters
    ? "Track a quick character on this device without creating an account."
    : "Track a quick campaign record on this device without creating an account.";

  return (
    <Layout title={`${title} - ${appName}`}>
      <div class="shell local-play-shell">
        <SiteHeader appName={appName} currentSection="local" />
        <main class="local-play-main" aria-labelledby="local-play-heading" data-local-play data-local-play-kind={kind}>
          <Panel labelledBy="local-play-heading">
            <div class="local-play-heading">
              <p class="local-play-kicker">Public local play</p>
              <h1 id="local-play-heading" class="panel-heading">{title}</h1>
              <p>{description}</p>
              <p class="local-play-warning">
                This data lives in your browser storage only. Export it before clearing browser data,
                changing devices, or relying on it at the table.
              </p>
            </div>

            <section class="local-play-tools" aria-labelledby="local-play-tools-heading">
              <div>
                <h2 id="local-play-tools-heading">Portable data</h2>
                <p class="local-play-status" data-local-play-status aria-live="polite">
                  Stored only in this browser.
                </p>
              </div>
              <div class="local-play-tool-actions">
                <button class="button" data-variant="ghost" type="button" data-local-play-export>
                  Export JSON
                </button>
                <button class="button" data-variant="ghost" type="button" data-local-play-import-trigger>
                  Import JSON
                </button>
                <input
                  class="visually-hidden"
                  type="file"
                  accept="application/json,.json"
                  aria-label="Import local play JSON"
                  data-local-play-import
                />
              </div>
            </section>

            <section aria-labelledby="local-play-create-heading">
              <h2 id="local-play-create-heading">{isCharacters ? "Add character" : "Add campaign"}</h2>
              <form class="local-play-form" data-local-play-form>
                <div class="form-field">
                  <label for="local-play-name">Name</label>
                  <input id="local-play-name" name="name" required />
                </div>
                {isCharacters ? (
                  <>
                    <div class="form-field">
                      <label for="local-play-species">Species</label>
                      <input id="local-play-species" name="species" required />
                    </div>
                    <div class="form-field">
                      <label for="local-play-class">Class</label>
                      <input id="local-play-class" name="className" required />
                    </div>
                    <div class="form-field">
                      <label for="local-play-level">Level</label>
                      <input id="local-play-level" name="level" required type="number" min="1" max="20" value="1" />
                    </div>
                  </>
                ) : (
                  <div class="form-field">
                    <label for="local-play-scene">Current scene</label>
                    <input id="local-play-scene" name="currentScene" />
                  </div>
                )}
                <div class="form-field local-play-notes-field">
                  <label for="local-play-notes">Notes</label>
                  <textarea id="local-play-notes" name="notes" rows={4}></textarea>
                </div>
                <div class="local-play-form-actions">
                  <button class="button" data-variant="primary" type="submit">
                  <span data-local-play-submit>
                    {isCharacters ? "Save character" : "Save campaign"}
                  </span>
                  </button>
                </div>
              </form>
            </section>

            <section aria-labelledby="local-play-list-heading">
              <div class="local-play-list-heading">
                <h2 id="local-play-list-heading">{isCharacters ? "Character records" : "Campaign records"}</h2>
                <p><span data-local-play-count>0</span> stored</p>
              </div>
              <p class="empty-state" data-local-play-empty>
                {isCharacters ? "No local characters yet." : "No local campaigns yet."}
              </p>
              <ol class="local-play-list" data-local-play-list hidden></ol>
            </section>

            <div class="home-actions">
              <a class="action-link" href="/rules">Browse SRD rules</a>
              <a class="action-link action-link-secondary" href={isCharacters ? "/local/campaigns" : "/local/characters"}>
                {isCharacters ? "Local campaigns" : "Local characters"}
              </a>
              <a class="action-link action-link-secondary" href="/login">Sign in</a>
            </div>
          </Panel>
        </main>
      </div>
      <script>{raw(localPlayScript)}</script>
    </Layout>
  );
};
