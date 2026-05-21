export const localPlayStorageKey = "campaign-ledger.local-play.v1";
export const localPlaySchema = "campaign-ledger.local-play";
export const localPlayDocumentVersion = 1;

export interface LocalPlayCharacter {
  id: string;
  name: string;
  species: string;
  className: string;
  level: number;
  notes: string;
  updatedAt: string;
}

export interface LocalPlayCampaign {
  id: string;
  name: string;
  currentScene: string;
  notes: string;
  updatedAt: string;
}

export interface LocalPlayDocument {
  schema: typeof localPlaySchema;
  version: typeof localPlayDocumentVersion;
  exportedAt: string;
  metadata: {
    source: "browser-local";
  };
  characters: LocalPlayCharacter[];
  campaigns: LocalPlayCampaign[];
}

export interface LocalPlayValidationResult {
  document?: LocalPlayDocument;
  error?: string;
  ok: boolean;
}

export function createEmptyLocalPlayDocument(exportedAt = new Date().toISOString()): LocalPlayDocument {
  return {
    campaigns: [],
    characters: [],
    exportedAt,
    metadata: {
      source: "browser-local",
    },
    schema: localPlaySchema,
    version: localPlayDocumentVersion,
  };
}

export function validateLocalPlayDocument(value: unknown): LocalPlayValidationResult {
  if (!isRecord(value)) return invalid("Import must be a JSON object.");
  if (value.schema !== localPlaySchema) return invalid("Import is not a Campaign Ledger local-play export.");
  if (value.version !== localPlayDocumentVersion) {
    return invalid(`Import version ${String(value.version)} is not supported.`);
  }
  if (!isIsoDateString(value.exportedAt)) return invalid("Import is missing a valid exportedAt timestamp.");
  if (!isRecord(value.metadata) || value.metadata.source !== "browser-local") {
    return invalid("Import metadata is missing or invalid.");
  }
  if (!Array.isArray(value.characters)) return invalid("Import characters must be a list.");
  if (!Array.isArray(value.campaigns)) return invalid("Import campaigns must be a list.");

  for (const character of value.characters) {
    const error = validateCharacter(character);
    if (error) return invalid(error);
  }

  for (const campaign of value.campaigns) {
    const error = validateCampaign(campaign);
    if (error) return invalid(error);
  }

  return { document: value as unknown as LocalPlayDocument, ok: true };
}

export function parseLocalPlayDocument(json: string): LocalPlayValidationResult {
  try {
    return validateLocalPlayDocument(JSON.parse(json));
  } catch {
    return invalid("Import file must contain valid JSON.");
  }
}

function validateCharacter(value: unknown) {
  if (!isRecord(value)) return "Each character must be a JSON object.";
  if (!isRequiredText(value.id)) return "Each character needs an id.";
  if (!isRequiredText(value.name)) return "Each character needs a name.";
  if (!isRequiredText(value.species)) return "Each character needs a species.";
  if (!isRequiredText(value.className)) return "Each character needs a class.";
  if (
    typeof value.level !== "number" ||
    !Number.isInteger(value.level) ||
    value.level < 1 ||
    value.level > 20
  ) {
    return "Each character level must be a whole number from 1 to 20.";
  }
  if (typeof value.notes !== "string") return "Each character notes field must be text.";
  if (!isIsoDateString(value.updatedAt)) return "Each character needs a valid updatedAt timestamp.";

  return undefined;
}

function validateCampaign(value: unknown) {
  if (!isRecord(value)) return "Each campaign must be a JSON object.";
  if (!isRequiredText(value.id)) return "Each campaign needs an id.";
  if (!isRequiredText(value.name)) return "Each campaign needs a name.";
  if (typeof value.currentScene !== "string") return "Each campaign current scene must be text.";
  if (typeof value.notes !== "string") return "Each campaign notes field must be text.";
  if (!isIsoDateString(value.updatedAt)) return "Each campaign needs a valid updatedAt timestamp.";

  return undefined;
}

function invalid(error: string): LocalPlayValidationResult {
  return { error, ok: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequiredText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateString(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
