import { describe, expect, test } from "bun:test";
import { localSessionSecret, resolveRuntimeConfig } from "./runtime";

describe("resolveRuntimeConfig", () => {
  test("keeps local development defaults", () => {
    expect(resolveRuntimeConfig({})).toEqual({
      databasePath: "character-sheet.sqlite3",
      hostname: "0.0.0.0",
      port: 3000,
      sessionSecret: localSessionSecret,
    });
  });

  test("reads hosted runtime environment variables", () => {
    expect(resolveRuntimeConfig({
      DB_PATH: "/data/character-sheet.sqlite3",
      HOST: "0.0.0.0",
      PORT: "8080",
      SESSION_SECRET: "hosted-session-secret",
    })).toEqual({
      databasePath: "/data/character-sheet.sqlite3",
      hostname: "0.0.0.0",
      port: 8080,
      sessionSecret: "hosted-session-secret",
    });
  });

  test("rejects invalid ports before binding the server", () => {
    expect(() => resolveRuntimeConfig({ PORT: "abc" })).toThrow("PORT must be an integer");
    expect(() => resolveRuntimeConfig({ PORT: "70000" })).toThrow("PORT must be an integer");
  });
});
