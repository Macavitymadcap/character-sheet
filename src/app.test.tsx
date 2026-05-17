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

  test("renders the public home page as a full HTML document", async () => {
    const { app } = createTestApp("Character Sheet");
    const response = await app.request("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain('<h1 id="home-heading">Character Sheet</h1>');
    expect(html).toContain('<a class="popover-menu-item" href="/login" role="menuitem">Sign in</a>');
  });

  test("renders signed-in home with role continue links", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const playerSession = sessionService.createSession("user_lynott_player");
    const gmSession = sessionService.createSession("user_game_master");
    const adminSession = sessionService.createSession("user_site_admin");

    const player = await app.request("/", { headers: { cookie: playerSession.cookie } });
    const gm = await app.request("/", { headers: { cookie: gmSession.cookie } });
    const admin = await app.request("/", { headers: { cookie: adminSession.cookie } });
    const playerHtml = await player.text();
    const gmHtml = await gm.text();
    const adminHtml = await admin.text();

    expect(player.status).toBe(200);
    expect(playerHtml).toContain('<a class="action-link" href="/sheet/lynott">Continue</a>');
    expect(gm.status).toBe(200);
    expect(gmHtml).toContain('<a class="action-link" href="/campaigns/rovnost-shadows">Continue</a>');
    expect(admin.status).toBe(200);
    expect(adminHtml).toContain('<a class="action-link" href="/admin">Continue</a>');
  });

  test("renders Lynott's authenticated sheet page with stable shell anchors", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/lynott", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("<title>Lynott Magulbisson - Character Sheet</title>");
    expect(html).toContain('id="site-header"');
    expect(html).toContain('id="sheet-header"');
    expect(html).toContain('id="sheet-tabs"');
    expect(html).toContain('id="sheet-tab-workspace"');
    expect(html).toContain('id="sheet-tab-panel"');
    expect(html).toContain("17");
    expect(html).toContain("Abilities and saves");
    expect(html).toContain("Darkvision");
    expect(html).toContain("Breastplate");
  });

  test("redirects internal sheet ids to the public sheet slug", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/character_lynott_magulbisson", {
      headers: { cookie: session.cookie },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/sheet/lynott");
  });

  test("redirects unauthenticated sheet page requests", async () => {
    const { app } = createTestApp("Character Sheet");
    const response = await app.request("/sheet/lynott");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("serves sheet tab panels as HTMX fragment-only HTML", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/lynott/tabs/spellcasting", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).not.toContain("<html");
    expect(html).not.toContain('id="sheet-tabs"');
    expect(html).not.toContain('id="sheet-tab-workspace"');
    expect(html).toContain('<section id="sheet-tab-panel" class="sheet-tab-panel"');
    expect(html).toContain('data-tab-id="spellcasting"');
    expect(html).toContain("<h2>Spellcasting</h2>");
  });

  test("updates header resources through HTMX fragments", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const cookie = session.cookie;

    const damage = await app.request(
      "/sheet/lynott/resources/resource_lynott_hit_points",
      {
        body: new URLSearchParams({ delta: "-5" }),
        headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );
    const damageHtml = await damage.text();
    const temp = await app.request(
      "/sheet/lynott/resources/resource_lynott_temporary_hit_points",
      {
        body: new URLSearchParams({ current: "4" }),
        headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );
    const inspire = await app.request(
      "/sheet/lynott/resources/resource_lynott_inspiration",
      {
        body: new URLSearchParams({ current: "1" }),
        headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );
    const sheet = await app.request("/sheet/lynott", {
      headers: { cookie },
    });
    const sheetHtml = await sheet.text();

    expect(damage.status).toBe(200);
    expect(damageHtml).toContain('<section id="sheet-header" class="sheet-header"');
    expect(damageHtml).toContain("26 / 31");
    expect(temp.status).toBe(200);
    expect(await temp.text()).toContain("26 / 31 + 4 temporary");
    expect(inspire.status).toBe(200);
    expect(await inspire.text()).toContain('aria-checked="true"');
    expect(sheet.status).toBe(200);
    expect(sheetHtml).toContain("26 / 31 + 4 temporary");
    expect(sheetHtml).toContain('aria-checked="true"');
  });

  test("renders the Game Master campaign page", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_game_master");
    const response = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Rovnost Shadows - Character Sheet</title>");
    expect(html).toContain(
      '<a class="popover-menu-item" href="/campaigns/rovnost-shadows" role="menuitem" aria-current="page">Campaign</a>',
    );
    expect(html).toContain('<h1 id="campaign-heading" class="panel-heading">Rovnost Shadows</h1>');
  });

  test("serves database-backed core and skills tab fragments", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const core = await app.request("/sheet/lynott/tabs/core", {
      headers: { cookie: session.cookie },
    });
    const skills = await app.request("/sheet/lynott/tabs/skills", {
      headers: { cookie: session.cookie },
    });
    const coreHtml = await core.text();
    const skillsHtml = await skills.text();

    expect(core.status).toBe(200);
    expect(coreHtml).toContain("Abilities and saves");
    expect(coreHtml).toContain("Constitution");
    expect(coreHtml).toContain("Darkvision");
    expect(coreHtml).toContain("Breastplate");
    expect(coreHtml).toContain("(14 + 2 + 1 = 17)");
    expect(skills.status).toBe(200);
    expect(skillsHtml).toContain("Skills");
    expect(skillsHtml).toContain("Stealth");
    expect(skillsHtml).toContain("Thieves&#39; tools");
    expect(skillsHtml).toContain("Disguise kit");
    expect(skillsHtml).toContain("Forgery kit");
    expect(skillsHtml).not.toContain("Covert operations");
  });

  test("rejects unauthenticated, unknown, and invalid sheet tab requests", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const unauthenticated = await app.request("/sheet/lynott/tabs/core");
    const unknownCharacter = await app.request("/sheet/character_unknown/tabs/core", {
      headers: { cookie: session.cookie },
    });
    const unknownTab = await app.request("/sheet/lynott/tabs/unknown", {
      headers: { cookie: session.cookie },
    });

    expect(unauthenticated.status).toBe(303);
    expect(unauthenticated.headers.get("location")).toBe("/login");
    expect(unknownCharacter.status).toBe(404);
    expect(unknownTab.status).toBe(404);
  });
});
