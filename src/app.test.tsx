import { afterEach, describe, expect, test } from "bun:test";
import { createApp } from "./app";
import { AuthService, PasswordService, SessionService } from "./auth";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "./db";

let runtime: SqliteDatabaseRuntime | undefined;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

const createTestApp = (appName = "Test Character Sheet") => {
  runtime = createSqliteDatabase({ path: ":memory:" });
  const passwordService = new PasswordService();

  const sessionService = new SessionService({
    authRepository: runtime.repositories.authRepository,
    now: () => new Date("2026-05-16T12:00:00.000Z"),
    secret: "test-session-secret",
  });
  const app = createApp({
    appName,
    authService: new AuthService({
      authRepository: runtime.repositories.authRepository,
      passwordService,
    }),
    sessionService,
    ...runtime.repositories,
  });

  return { app, sessionService };
};

describe("createApp", () => {
  test("can be constructed with test dependencies", () => {
    const { app } = createTestApp();

    expect(app.fetch).toBeFunction();
  });

  test("serves a health check", async () => {
    const { app } = createTestApp();
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("renders the home page as a full HTML document", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/", { headers: { cookie: session.cookie } });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain("Character Sheet");
    expect(html).toContain("Lynott Magulbisson");
  });

  test("renders Lynott's authenticated sheet page with stable shell anchors", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/character_lynott_magulbisson", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("<title>Lynott Magulbisson - Character Sheet</title>");
    expect(html).toContain('id="site-header"');
    expect(html).toContain('id="sheet-header"');
    expect(html).toContain('id="sheet-tabs"');
    expect(html).toContain('id="sheet-tab-panel"');
    expect(html).toContain("Armour class");
    expect(html).toContain("17");
    expect(html).toContain("Short / long");
  });

  test("redirects unauthenticated sheet page requests", async () => {
    const { app } = createTestApp("Character Sheet");
    const response = await app.request("/sheet/character_lynott_magulbisson");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("serves sheet tabs as HTMX fragment-only HTML", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/character_lynott_magulbisson/tabs/spellcasting", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).not.toContain("<html");
    expect(html).toContain('<section id="sheet-tab-panel" class="sheet-tab-panel"');
    expect(html).toContain('data-tab-id="spellcasting"');
    expect(html).toContain("<h2>Spellcasting</h2>");
  });

  test("rejects unauthenticated, unknown, and invalid sheet tab requests", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const unauthenticated = await app.request("/sheet/character_lynott_magulbisson/tabs/core");
    const unknownCharacter = await app.request("/sheet/character_unknown/tabs/core", {
      headers: { cookie: session.cookie },
    });
    const unknownTab = await app.request("/sheet/character_lynott_magulbisson/tabs/unknown", {
      headers: { cookie: session.cookie },
    });

    expect(unauthenticated.status).toBe(303);
    expect(unauthenticated.headers.get("location")).toBe("/login");
    expect(unknownCharacter.status).toBe(404);
    expect(unknownTab.status).toBe(404);
  });
});
