import { describe, expect, test } from "bun:test";
import {
  createEmptyLocalPlayDocument,
  localPlayDocumentVersion,
  localPlaySchema,
  parseLocalPlayDocument,
  validateLocalPlayDocument,
} from "./document";

describe("local play document validation", () => {
  test("accepts a versioned local-play export", () => {
    const document = {
      ...createEmptyLocalPlayDocument("2026-05-21T12:00:00.000Z"),
      campaigns: [
        {
          currentScene: "The brass observatory",
          id: "campaign-1",
          name: "Rovnost at home",
          notes: "Keep an eye on the skywrights.",
          updatedAt: "2026-05-21T12:01:00.000Z",
        },
      ],
      characters: [
        {
          className: "Cleric",
          id: "character-1",
          level: 3,
          name: "Mira",
          notes: "Prepared Bless.",
          species: "Human",
          updatedAt: "2026-05-21T12:02:00.000Z",
        },
      ],
    };

    expect(validateLocalPlayDocument(document)).toEqual({ document, ok: true });
  });

  test("rejects documents from another schema", () => {
    const result = validateLocalPlayDocument({
      ...createEmptyLocalPlayDocument(),
      schema: "other",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Import is not a Campaign Ledger local-play export.");
  });

  test("rejects unsupported versions", () => {
    const result = validateLocalPlayDocument({
      ...createEmptyLocalPlayDocument(),
      version: localPlayDocumentVersion + 1,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Import version 2 is not supported.");
  });

  test("rejects invalid character entries", () => {
    const result = validateLocalPlayDocument({
      ...createEmptyLocalPlayDocument(),
      characters: [
        {
          className: "Cleric",
          id: "character-1",
          level: 0,
          name: "Mira",
          notes: "",
          species: "Human",
          updatedAt: "2026-05-21T12:02:00.000Z",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Each character level must be a whole number from 1 to 20.");
  });

  test("parses valid JSON and rejects malformed files", () => {
    const result = parseLocalPlayDocument(JSON.stringify(createEmptyLocalPlayDocument()));
    const malformed = parseLocalPlayDocument("{");

    expect(result.ok).toBe(true);
    expect(result.document?.schema).toBe(localPlaySchema);
    expect(malformed).toEqual({ error: "Import file must contain valid JSON.", ok: false });
  });
});
