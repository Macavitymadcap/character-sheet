import { describe, expect, test } from "bun:test";
import { localSessionSecret, resolveRuntimeConfig } from "./runtime";

describe("resolveRuntimeConfig", () => {
  test("keeps local development defaults", () => {
    expect(resolveRuntimeConfig({})).toEqual({
      accountDelivery: {
        mode: "operator",
      },
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
      PUBLIC_BASE_URL: "https://campaign-ledger.example.com/",
      SESSION_SECRET: "hosted-session-secret",
    })).toEqual({
      accountDelivery: {
        mode: "operator",
        publicBaseUrl: "https://campaign-ledger.example.com",
      },
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

  test("rejects unsupported account delivery modes", () => {
    expect(() => resolveRuntimeConfig({ ACCOUNT_DELIVERY_MODE: "email" })).toThrow(
      "ACCOUNT_DELIVERY_MODE must be operator",
    );
  });

  test("rejects invalid public base URLs", () => {
    expect(() => resolveRuntimeConfig({ PUBLIC_BASE_URL: "campaign-ledger.example.com" })).toThrow(
      "PUBLIC_BASE_URL must be a valid http(s) URL",
    );
    expect(() => resolveRuntimeConfig({ PUBLIC_BASE_URL: "mailto:admin@example.local" })).toThrow(
      "PUBLIC_BASE_URL must be a valid http(s) URL",
    );
  });
});
