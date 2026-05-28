import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { createApp } from "./app";
import { AuthService, PasswordService, SessionService } from "./auth";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "./db";
import { RulesImportService } from "./rules";

let runtime: SqliteDatabaseRuntime | undefined;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
  delete process.env.CAMPAIGN_LEDGER_ASSET_ROOT;
  delete process.env.CHARACTER_SHEET_ASSET_ROOT;
});

const createTestApp = (appName = "Test Campaign Ledger") => {
  process.env.CAMPAIGN_LEDGER_ASSET_ROOT = `${tmpdir()}/campaign-ledger-test-assets`;
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

const formHeaders = (cookie?: string) => ({
  ...(cookie ? { cookie } : {}),
  "Content-Type": "application/x-www-form-urlencoded",
});

const login = async (app: ReturnType<typeof createTestApp>["app"], email: string) => {
  const response = await app.request("/login", {
    body: new URLSearchParams({ email, password: "password123" }),
    headers: formHeaders(),
    method: "POST",
  });
  const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";

  expect(response.status).toBe(303);
  expect(cookie).toStartWith("character_sheet_session=");

  return cookie;
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

  test("serves a hosted readiness check for database and asset storage", async () => {
    const { app } = createTestApp();
    const response = await app.request("/readyz");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checks: {
        assets: true,
        database: true,
      },
      ok: true,
    });
  });

  test("renders the public home page as a full HTML document", async () => {
    const { app } = createTestApp("Campaign Ledger");
    const response = await app.request("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain("<title>Campaign Ledger</title>");
    expect(html).toContain('<h1 id="home-heading">Campaign Ledger</h1>');
    expect(html).toContain('<a class="action-link" href="/rules">Browse SRD rules</a>');
    expect(html).toContain('href="/local/characters"');
    expect(html).toContain('href="/local/campaigns"');
    expect(html).toContain('<a class="popover-menu-item" href="/rules" role="menuitem">Rules</a>');
    expect(html).toContain('<a class="popover-menu-item" href="/login" role="menuitem">Sign in</a>');
    expect(html).not.toContain('<a class="action-link action-link-secondary" href="/login">Sign in</a>');
  });

  test("renders signed-in home with role-specific entry links", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
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
    expect(playerHtml).toContain('<a class="action-link action-link-secondary" href="/characters">Characters</a>');
    expect(gm.status).toBe(200);
    expect(gmHtml).toContain(
      '<a class="action-link action-link-secondary" href="/campaigns/rovnost-shadows">Campaign</a>',
    );
    expect(admin.status).toBe(200);
    expect(adminHtml).toContain('<a class="action-link action-link-secondary" href="/admin">Admin</a>');
  });

  test("serves public local play entry points", async () => {
    const { app } = createTestApp("Campaign Ledger");
    const characters = await app.request("/local/characters");
    const campaigns = await app.request("/local/campaigns");
    const charactersHtml = await characters.text();
    const campaignsHtml = await campaigns.text();

    expect(characters.status).toBe(200);
    expect(charactersHtml).toContain("<title>Local characters - Campaign Ledger</title>");
    expect(charactersHtml).toContain("Track a quick character on this device");
    expect(charactersHtml).toContain("campaign-ledger.local-play.v1");
    expect(campaigns.status).toBe(200);
    expect(campaignsHtml).toContain("<title>Local campaigns - Campaign Ledger</title>");
    expect(campaignsHtml).toContain("Track a quick campaign record on this device");
  });

  test("renders Lynott's authenticated sheet page with stable shell anchors", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/lynott", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("<title>Lynott Magulbisson - Campaign Ledger</title>");
    expect(html).toContain('id="site-header"');
    expect(html).toContain('<a href="/characters">Characters</a>');
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
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/character_lynott_magulbisson", {
      headers: { cookie: session.cookie },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/sheet/lynott");
  });

  test("redirects unauthenticated sheet page requests", async () => {
    const { app } = createTestApp("Campaign Ledger");
    const response = await app.request("/sheet/lynott");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("uses HX-Redirect for HTMX action redirects", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_mira_player");
    const response = await app.request("/characters", {
      body: new URLSearchParams({
        background: "Archivist",
        className: "Wizard",
        hitPointMax: "18",
        level: "3",
        name: "Ilyra Vale",
        species: "Human",
      }),
      headers: {
        ...formHeaders(session.cookie),
        "HX-Request": "true",
      },
      method: "POST",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("HX-Redirect")).toBe("/sheet/ilyra_vale");
    expect(response.headers.get("location")).toBeNull();
  });

  test("keeps auth cookies on HTMX login redirects", async () => {
    const { app } = createTestApp("Campaign Ledger");
    const response = await app.request("/login", {
      body: new URLSearchParams({ email: "lynott@example.local", password: "password123" }),
      headers: {
        ...formHeaders(),
        "HX-Request": "true",
      },
      method: "POST",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("HX-Redirect")).toBe("/characters");
    expect(response.headers.get("set-cookie")).toStartWith("character_sheet_session=");
  });

  test("serves sheet tab panels as HTMX fragment-only HTML", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
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
    expect(html).toContain("Mage Hand");
    expect(html).toContain("1st-level spell slots");
    expect(html).toContain('href="/rules/spell/mage-hand"');
  });

  test("serves canonical sheet tab pages for refreshable navigation", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/lynott/actions", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();
    const missing = await app.request("/sheet/lynott/unknown", {
      headers: { cookie: session.cookie },
    });

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Lynott Magulbisson - Campaign Ledger</title>");
    expect(html).toContain('data-tab-id="actions"');
    expect(html).toContain('hx-push-url="/sheet/lynott/actions"');
    expect(html).toContain("Available actions");
    expect(missing.status).toBe(404);
  });

  test("serves public SRD rules while protecting non-SRD rules", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/srd-5.1-fixtures");

    const publicList = await app.request("/rules?type=spell&level=1&q=bless");
    const publicListHtml = await publicList.text();
    const publicNonSrdList = await app.request("/rules?q=mage+hand");
    const publicNonSrdListHtml = await publicNonSrdList.text();
    const publicDetail = await app.request("/rules/spell/bless");
    const publicDetailHtml = await publicDetail.text();
    const publicNonSrdDetail = await app.request("/rules/spell/mage-hand");
    const list = await app.request("/rules?type=spell&level=1&q=bless", {
      headers: { cookie: session.cookie },
    });
    const listHtml = await list.text();
    const classList = await app.request("/rules?type=class&level=1&equipment=armour", {
      headers: { cookie: session.cookie },
    });
    const classListHtml = await classList.text();
    const detail = await app.request("/rules/spell/bless", {
      headers: { cookie: session.cookie },
    });
    const detailHtml = await detail.text();
    const typeRedirect = await app.request("/rules/spell", {
      headers: { cookie: session.cookie },
    });
    const missing = await app.request("/rules/spell/missing", {
      headers: { cookie: session.cookie },
    });

    expect(publicList.status).toBe(200);
    expect(publicListHtml).not.toContain("SRD corpus partially imported");
    expect(publicListHtml).not.toContain("bun run import:rules:srd");
    expect(publicListHtml).toContain("Bless");
    expect(publicListHtml).toContain("SRD");
    expect(publicListHtml).toContain("Visitor");
    expect(publicListHtml).toContain(
      '<a class="popover-menu-item" href="/rules" role="menuitem" aria-current="page">Rules</a>',
    );
    expect(publicNonSrdList.status).toBe(200);
    expect(publicNonSrdListHtml).toContain("0 rules");
    expect(publicNonSrdListHtml).not.toContain("Mage Hand");
    expect(publicDetail.status).toBe(200);
    expect(publicDetailHtml).toContain("<h1 id=\"rule-detail-heading\" class=\"panel-heading\">Bless</h1>");
    expect(publicDetailHtml).toContain("You bless up to three creatures");
    expect(publicNonSrdDetail.status).toBe(404);
    expect(list.status).toBe(200);
    expect(listHtml).toContain("<h1 id=\"rules-heading\" class=\"panel-heading\">Rules</h1>");
    expect(listHtml).toContain("Bless");
    expect(listHtml).toContain("SRD 5.1");
    expect(listHtml).toContain("SRD");
    expect(listHtml).not.toContain("Mage Hand");
    expect(classList.status).toBe(200);
    expect(classListHtml).toContain("Wizard");
    expect(classListHtml).toContain('<option value="1">1</option>');
    expect(classListHtml).toContain('<option value="armour">Armour</option>');
    expect(detail.status).toBe(200);
    expect(detailHtml).toContain("<h1 id=\"rules-filter-heading\" class=\"panel-heading\">Rules</h1>");
    expect(detailHtml).toContain('<a class="rules-reset-link" href="/rules">Reset</a>');
    expect(detailHtml).toContain('<a href="/rules?type=spell">Rules</a>');
    expect(detailHtml).toContain("<h1 id=\"rule-detail-heading\" class=\"panel-heading\">Bless</h1>");
    expect(detailHtml).toContain("SRD");
    expect(detailHtml).toContain("You bless up to three creatures");
    expect(detailHtml).toContain("<dt>Casting time</dt>");
    expect(detailHtml).toContain("<dt>At higher levels</dt>");
    expect(detailHtml).toContain("Source: SRD 5.1");
    expect(detailHtml).not.toContain("CastingTime");
    expect(detailHtml).not.toContain("HigherLevels");
    expect(detailHtml).not.toContain("docs/rules/srd-5.1-fixtures/spells/level-1/bless.md");
    expect(typeRedirect.status).toBe(303);
    expect(typeRedirect.headers.get("location")).toBe("/rules?type=spell");
    expect(missing.status).toBe(404);
  });

  test("keeps SRD rules pages user-facing when local data is sparse or fully imported", async () => {
    const { app } = createTestApp("Campaign Ledger");

    const partial = await app.request("/rules?type=spell&q=bless");
    const partialHtml = await partial.text();
    const partialDetail = await app.request("/rules/spell/bless");

    expect(partial.status).toBe(200);
    expect(partialHtml).not.toContain("SRD corpus partially imported");
    expect(partialHtml).not.toContain("searchable SRD entries");
    expect(partialHtml).toContain("No rules match those filters.");
    expect(partialHtml).not.toContain("bun run import:rules:srd");
    expect(partialHtml).not.toContain("Spell (8)");
    expect(partialHtml).not.toContain("<h3><a href=\"/rules/spell/bless\">Bless</a></h3>");
    expect(partialDetail.status).toBe(404);

    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/srd-5.1");

    const ready = await app.request("/rules?type=condition&q=grappled");
    const readyHtml = await ready.text();
    const readyDetail = await app.request("/rules/spell/bless");
    const readyDetailHtml = await readyDetail.text();

    expect(ready.status).toBe(200);
    expect(readyHtml).not.toContain("Full corpus imported");
    expect(readyHtml).not.toContain("searchable public SRD entries are available");
    expect(readyHtml).toContain('<a href="/rules?type=spell">Spells</a>');
    expect(readyHtml).toContain("Grappled");
    expect(readyDetail.status).toBe(200);
    expect(readyDetailHtml).toContain("<dt>Classes</dt>");
    expect(readyDetailHtml).toContain("<dd>Cleric, Paladin</dd>");
  });

  test("serves campaign-scoped private rules only to campaign members", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const playerSession = sessionService.createSession("user_lynott_player");
    const adminSession = sessionService.createSession("user_site_admin");
    const gmSession = sessionService.createSession("user_game_master");
    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/srd-5.1-fixtures/spells/level-1/bless.md");
    await importer.importFromLocalSource("docs/rules/backgrounds/special-ops.md", {
      campaignId: "campaign_rovnost_shadows",
      source: {
        abbreviation: "Rovnost",
        contentCategory: "local",
        id: "rules_source_rovnost_private",
        name: "Rovnost Private Notes",
        slug: "rovnost-private",
      },
    });

    const publicList = await app.request("/rules?q=special+ops");
    const publicDetail = await app.request("/rules/background/special-operations");
    const adminList = await app.request("/rules?q=special+ops", {
      headers: { cookie: adminSession.cookie },
    });
    const playerList = await app.request("/rules?q=special+ops", {
      headers: { cookie: playerSession.cookie },
    });
    const playerDetail = await app.request("/rules/background/special-operations", {
      headers: { cookie: playerSession.cookie },
    });
    const campaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: gmSession.cookie },
    });

    expect(await publicList.text()).toContain("0 rules");
    expect(publicDetail.status).toBe(404);
    expect(await adminList.text()).toContain("0 rules");
    const playerListHtml = await playerList.text();
    expect(playerListHtml).toContain("Special Operations");
    expect(playerListHtml).toContain("Campaign scoped");
    const playerDetailHtml = await playerDetail.text();
    expect(playerDetail.status).toBe(200);
    expect(playerDetailHtml).toContain("Rovnost Private Notes");
    expect(playerDetailHtml).toContain("Not public exportable");
    const campaignHtml = await campaign.text();
    expect(campaignHtml).toContain("Rules sources");
    expect(campaignHtml).toContain("Rovnost Private Notes");
    expect(campaignHtml).toContain("Campaign scoped");
  });

  test("serves imported stat block rule details", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_game_master");
    const statBlockRoot = mkdtempSync(join(tmpdir(), "campaign-ledger-stat-block-"));
    const statBlockDir = join(statBlockRoot, "stat-blocks");
    mkdirSync(statBlockDir, { recursive: true });
    writeFileSync(
      join(statBlockDir, "clockwork-scout.md"),
      [
        "# Clockwork Scout",
        "",
        "**Armor Class:** 14",
        "",
        "**Hit Points:** 27",
        "",
        "**Speed:** 30 ft.",
        "",
        "### Actions",
        "",
        "**Gear Slam.** Melee Weapon Attack.",
        "",
        "### Reactions",
        "",
        "**Parry.** The scout adds 2 to its AC.",
      ].join("\n"),
    );
    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource(statBlockRoot);

    const list = await app.request("/rules?type=stat_block&q=scout", {
      headers: { cookie: session.cookie },
    });
    const listHtml = await list.text();
    const detail = await app.request("/rules/stat_block/clockwork-scout", {
      headers: { cookie: session.cookie },
    });
    const detailHtml = await detail.text();

    expect(list.status).toBe(200);
    expect(listHtml).toContain("Clockwork Scout");
    expect(listHtml).toContain("Stat Block");
    expect(detail.status).toBe(200);
    expect(detailHtml).toContain('<nav class="breadcrumbs" aria-label="Breadcrumb">');
    expect(detailHtml).toContain('<a href="/rules?type=stat_block">Rules</a>');
    expect(detailHtml).toContain('<a href="/rules/stat_block/clockwork-scout" aria-current="page">Clockwork Scout</a>');
    expect(detailHtml).toContain("<h1 id=\"rule-detail-heading\" class=\"panel-heading\">Clockwork Scout</h1>");
    expect(detailHtml).toContain("<dt>Armour Class</dt>");
    expect(detailHtml).toContain("<dd>14</dd>");
    expect(detailHtml).toContain("<dt>Action Timing</dt>");
    expect(detailHtml).toContain("<dd>Reaction, Action</dd>");
  });

  test("updates header resources through HTMX fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
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

  test("updates manual sheet fields through HTMX fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const cookie = sessionService.createSession("user_lynott_player").cookie;
    const headers = formHeaders(cookie);

    const summaryEdit = await app.request("/sheet/lynott/summary/edit", {
      headers: { Cookie: cookie },
    });
    const summaryCancel = await app.request("/sheet/lynott/summary", {
      headers: { Cookie: cookie },
    });
    const summary = await app.request("/sheet/lynott/summary", {
      body: new URLSearchParams({
        background: "Field Agent",
        className: "Artificer",
        hitPointMax: "28",
        initiative: "2",
        level: "5",
        name: "Lynott Undercover",
        proficiencyBonus: "3",
        speedFeet: "35",
        species: "Hobgoblin",
        subclassName: "Artillerist",
      }),
      headers,
      method: "PATCH",
    });
    const ability = await app.request("/sheet/lynott/abilities/intelligence", {
      body: new URLSearchParams({ saveProficient: "1", score: "20" }),
      headers,
      method: "PATCH",
    });
    const skill = await app.request("/sheet/lynott/skills/arcana", {
      body: new URLSearchParams({ proficiencyLevel: "1" }),
      headers,
      method: "PATCH",
    });
    const equipment = await app.request("/sheet/lynott/equipment/equipment_lynott_pistol", {
      body: new URLSearchParams({
        category: "weapon",
        equipped: "1",
        name: "Clockwork pistol",
        notes: "Freshly calibrated.",
        quantity: "1",
      }),
      headers,
      method: "PATCH",
    });

    const summaryEditHtml = await summaryEdit.text();
    const summaryCancelHtml = await summaryCancel.text();

    expect(summaryEdit.status).toBe(200);
    expect(summaryEditHtml).toContain('hx-patch="/sheet/lynott/summary"');
    expect(summaryEditHtml).toContain('hx-get="/sheet/lynott/summary"');
    expect(summaryEditHtml).not.toContain("sheet-edit-disclosure");
    expect(summaryCancel.status).toBe(200);
    expect(summaryCancelHtml).toContain('hx-get="/sheet/lynott/summary/edit"');
    expect(summaryCancelHtml).not.toContain("sheet-edit-disclosure");
    expect(summary.status).toBe(200);
    expect(await summary.text()).toContain("Lynott Undercover");
    expect(ability.status).toBe(200);
    expect(await ability.text()).toContain("+8");
    expect(skill.status).toBe(200);
    expect(await skill.text()).toContain("Arcana");
    expect(equipment.status).toBe(200);
    expect(await equipment.text()).toContain("Clockwork pistol");
  });

  test("serves focused skill and proficiency edit fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const cookie = sessionService.createSession("user_lynott_player").cookie;
    const headers = { Cookie: cookie };

    const skillEdit = await app.request("/sheet/lynott/skills/arcana/edit", { headers });
    const skillCancel = await app.request("/sheet/lynott/skills/arcana", { headers });
    const proficiencyEdit = await app.request(
      "/sheet/lynott/proficiencies/proficiency_lynott_disguise_kit/edit",
      { headers },
    );
    const proficiencyCancel = await app.request(
      "/sheet/lynott/proficiencies/proficiency_lynott_disguise_kit",
      { headers },
    );
    const proficiencySave = await app.request(
      "/sheet/lynott/proficiencies/proficiency_lynott_disguise_kit",
      {
        body: new URLSearchParams({ detail: "Fresh cover credentials.", name: "Disguise kit" }),
        headers: formHeaders(cookie),
        method: "PATCH",
      },
    );
    const proficiencyCreate = await app.request("/sheet/lynott/proficiencies", {
      body: new URLSearchParams({ category: "language", detail: "Rovnost cant.", name: "Rovnost street cant" }),
      headers: formHeaders(cookie),
      method: "POST",
    });

    expect(skillEdit.status).toBe(200);
    expect(await skillEdit.text()).toContain('hx-patch="/sheet/lynott/skills/arcana"');
    expect(skillCancel.status).toBe(200);
    expect(await skillCancel.text()).toContain('hx-get="/sheet/lynott/skills/arcana/edit"');
    expect(proficiencyEdit.status).toBe(200);
    expect(await proficiencyEdit.text()).toContain(
      'hx-patch="/sheet/lynott/proficiencies/proficiency_lynott_disguise_kit"',
    );
    expect(proficiencyCancel.status).toBe(200);
    expect(await proficiencyCancel.text()).toContain("Disguise kit");
    expect(proficiencySave.status).toBe(200);
    expect(await proficiencySave.text()).toContain("Fresh cover credentials.");
    expect(proficiencyCreate.status).toBe(200);
    expect(await proficiencyCreate.text()).toContain("Rovnost street cant");
  });

  test("serves focused ability edit fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const cookie = sessionService.createSession("user_lynott_player").cookie;
    const headers = { Cookie: cookie };

    const abilityEdit = await app.request("/sheet/lynott/abilities/intelligence/edit", { headers });
    const abilityCancel = await app.request("/sheet/lynott/abilities/intelligence", { headers });
    const abilitySave = await app.request("/sheet/lynott/abilities/intelligence", {
      body: new URLSearchParams({ saveProficient: "1", score: "20" }),
      headers: formHeaders(cookie),
      method: "PATCH",
    });

    expect(abilityEdit.status).toBe(200);
    expect(await abilityEdit.text()).toContain('hx-patch="/sheet/lynott/abilities/intelligence"');
    expect(abilityCancel.status).toBe(200);
    expect(await abilityCancel.text()).toContain('hx-get="/sheet/lynott/abilities/intelligence/edit"');
    expect(abilitySave.status).toBe(200);
    expect(await abilitySave.text()).toContain("+7");
  });

  test("serves focused core card edit fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const cookie = sessionService.createSession("user_lynott_player").cookie;
    const headers = { Cookie: cookie };

    const senseEdit = await app.request("/sheet/lynott/senses/sense_lynott_darkvision/edit", { headers });
    const senseCancel = await app.request("/sheet/lynott/senses/sense_lynott_darkvision", { headers });
    const senseSave = await app.request("/sheet/lynott/senses/sense_lynott_darkvision", {
      body: new URLSearchParams({ label: "Darkvision", value: "90 ft" }),
      headers: formHeaders(cookie),
      method: "PATCH",
    });
    const armourEdit = await app.request("/sheet/lynott/armour/ac_lynott_breastplate/edit", { headers });
    const defenceEdit = await app.request("/sheet/lynott/defences/defence_lynott_resistances/edit", { headers });

    expect(senseEdit.status).toBe(200);
    expect(await senseEdit.text()).toContain('hx-patch="/sheet/lynott/senses/sense_lynott_darkvision"');
    expect(senseCancel.status).toBe(200);
    expect(await senseCancel.text()).toContain('hx-get="/sheet/lynott/senses/sense_lynott_darkvision/edit"');
    expect(senseSave.status).toBe(200);
    expect(await senseSave.text()).toContain("<span>90 ft</span>");
    expect(armourEdit.status).toBe(200);
    expect(await armourEdit.text()).toContain('hx-patch="/sheet/lynott/armour/ac_lynott_breastplate"');
    expect(defenceEdit.status).toBe(200);
    expect(await defenceEdit.text()).toContain('hx-patch="/sheet/lynott/defences/defence_lynott_resistances"');
  });

  test("serves focused equipment and background edit fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const cookie = sessionService.createSession("user_lynott_player").cookie;
    const headers = { Cookie: cookie };

    const equipmentEdit = await app.request("/sheet/lynott/equipment/equipment_lynott_pistol/edit", { headers });
    const equipmentCancel = await app.request("/sheet/lynott/equipment/equipment_lynott_pistol", { headers });
    const backgroundEdit = await app.request("/sheet/lynott/background/background_lynott_identity_jonas/edit", { headers });
    const backgroundCancel = await app.request("/sheet/lynott/background/background_lynott_identity_jonas", { headers });
    const backgroundSave = await app.request("/sheet/lynott/background/background_lynott_identity_jonas", {
      body: new URLSearchParams({
        body: "Independent locksmith with fresh Rovnost papers.",
        title: "Jonas Locksmith",
      }),
      headers: {
        Cookie: cookie,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PATCH",
    });
    const equipmentCreate = await app.request("/sheet/lynott/equipment", {
      body: new URLSearchParams({
        category: "gear",
        equipped: "0",
        name: "Rovnost street map",
        notes: "Marked with safehouses.",
        quantity: "1",
      }),
      headers: formHeaders(cookie),
      method: "POST",
    });
    const backgroundCreate = await app.request("/sheet/lynott/background", {
      body: new URLSearchParams({
        body: "Knows the bell codes used around the old foundry.",
        category: "backstory",
        title: "Foundry bell codes",
      }),
      headers: formHeaders(cookie),
      method: "POST",
    });

    const equipmentEditHtml = await equipmentEdit.text();
    const equipmentCancelHtml = await equipmentCancel.text();
    const backgroundEditHtml = await backgroundEdit.text();
    const backgroundCancelHtml = await backgroundCancel.text();
    const backgroundSaveHtml = await backgroundSave.text();
    const equipmentCreateHtml = await equipmentCreate.text();
    const backgroundCreateHtml = await backgroundCreate.text();

    expect(equipmentEdit.status).toBe(200);
    expect(equipmentEditHtml).toContain('id="equipment-item-equipment-lynott-pistol"');
    expect(equipmentEditHtml).toContain('hx-patch="/sheet/lynott/equipment/equipment_lynott_pistol"');
    expect(equipmentEditHtml).toContain('hx-get="/sheet/lynott/equipment/equipment_lynott_pistol"');
    expect(equipmentEditHtml).not.toContain("row-edit-disclosure");
    expect(equipmentCancel.status).toBe(200);
    expect(equipmentCancelHtml).toContain('hx-get="/sheet/lynott/equipment/equipment_lynott_pistol/edit"');
    expect(backgroundEdit.status).toBe(200);
    expect(backgroundEditHtml).toContain('id="background-entry-background-lynott-identity-jonas"');
    expect(backgroundEditHtml).toContain('hx-patch="/sheet/lynott/background/background_lynott_identity_jonas"');
    expect(backgroundEditHtml).toContain('hx-get="/sheet/lynott/background/background_lynott_identity_jonas"');
    expect(backgroundEditHtml).not.toContain("row-edit-disclosure");
    expect(backgroundCancel.status).toBe(200);
    expect(backgroundCancelHtml).toContain("Jonas Blarendon");
    expect(backgroundSave.status).toBe(200);
    expect(backgroundSaveHtml).toContain("Jonas Locksmith");
    expect(backgroundSaveHtml).toContain("Independent locksmith");
    expect(equipmentCreate.status).toBe(200);
    expect(equipmentCreateHtml).toContain("Rovnost street map");
    expect(backgroundCreate.status).toBe(200);
    expect(backgroundCreateHtml).toContain("Foundry bell codes");
  });

  test("adds custom conditions and returns dice roll fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const cookie = session.cookie;
    const headers = { cookie, "Content-Type": "application/x-www-form-urlencoded" };

    const condition = await app.request("/sheet/lynott/conditions", {
      body: new URLSearchParams({ label: "Frightened" }),
      headers,
      method: "POST",
    });
    const conditionHtml = await condition.text();
    const roll = await app.request("/sheet/lynott/rolls", {
      body: new URLSearchParams({
        additionalModifier: "1",
        label: "Stealth",
        mode: "advantage",
        modifier: "5",
      }),
      headers,
      method: "POST",
    });
    const rollHtml = await roll.text();
    const invalidCondition = await app.request("/sheet/lynott/conditions", {
      body: new URLSearchParams({ label: "" }),
      headers,
      method: "POST",
    });

    expect(condition.status).toBe(200);
    expect(conditionHtml).toContain('<span class="condition-chip">Frightened</span>');
    expect(conditionHtml).toContain('hx-patch="/sheet/lynott/resources/condition_character_lynott_magulbisson_frightened"');
    expect(roll.status).toBe(200);
    expect(rollHtml).toContain('<output class="dice-roll-result">');
    expect(rollHtml).toContain("Stealth: d20");
    expect(rollHtml).toContain("+ 6 =");
    expect(invalidCondition.status).toBe(400);
  });

  test("keeps invalid form values rejected after transport parsing", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/lynott/abilities/intelligence", {
      body: new URLSearchParams({ saveProficient: "1", score: "" }),
      headers: formHeaders(session.cookie),
      method: "PATCH",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid ability");
  });

  test("updates tab resources through HTMX panel fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const cookie = session.cookie;

    const spendSlot = await app.request(
      "/sheet/lynott/resources/resource_lynott_spell_slots_1",
      {
        body: new URLSearchParams({ delta: "-1", tabId: "spellcasting" }),
        headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );
    const spendSlotHtml = await spendSlot.text();
    const spellcasting = await app.request("/sheet/lynott/tabs/spellcasting", {
      headers: { cookie },
    });
    const spellcastingHtml = await spellcasting.text();
    const features = await app.request("/sheet/lynott/tabs/features", {
      headers: { cookie },
    });
    const featuresHtml = await features.text();
    const invalidTab = await app.request(
      "/sheet/lynott/resources/resource_lynott_spell_slots_1",
      {
        body: new URLSearchParams({ delta: "-1", tabId: "unknown" }),
        headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );

    expect(spendSlot.status).toBe(200);
    expect(spendSlotHtml).toContain('<section id="sheet-tab-panel" class="sheet-tab-panel"');
    expect(spendSlotHtml).toContain('data-tab-id="spellcasting"');
    expect(spendSlotHtml).not.toContain('id="sheet-header"');
    expect(spendSlotHtml).toContain("2 / 3");
    expect(spellcasting.status).toBe(200);
    expect(spellcastingHtml).toContain("2 / 3");
    expect(invalidTab.status).toBe(400);
  });

  test("applies long rests and refreshes the full sheet workspace", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_lynott_player");
    const cookie = session.cookie;
    const formHeaders = { cookie, "Content-Type": "application/x-www-form-urlencoded" };

    await app.request("/sheet/lynott/resources/resource_lynott_hit_points", {
      body: new URLSearchParams({ current: "12" }),
      headers: formHeaders,
      method: "PATCH",
    });
    await app.request("/sheet/lynott/resources/resource_lynott_temporary_hit_points", {
      body: new URLSearchParams({ current: "5" }),
      headers: formHeaders,
      method: "PATCH",
    });
    await app.request("/sheet/lynott/resources/resource_lynott_hit_dice", {
      body: new URLSearchParams({ current: "1" }),
      headers: formHeaders,
      method: "PATCH",
    });
    await app.request("/sheet/lynott/resources/resource_lynott_spell_slots_1", {
      body: new URLSearchParams({ current: "0" }),
      headers: formHeaders,
      method: "PATCH",
    });
    await app.request("/sheet/lynott/resources/resource_lynott_fey_gift", {
      body: new URLSearchParams({ current: "0" }),
      headers: formHeaders,
      method: "PATCH",
    });

    const longRest = await app.request("/sheet/lynott/rests/long", {
      body: new URLSearchParams({ tabId: "actions" }),
      headers: formHeaders,
      method: "POST",
    });
    const html = await longRest.text();
    const spellcasting = await app.request("/sheet/lynott/tabs/spellcasting", {
      headers: { cookie },
    });
    const spellcastingHtml = await spellcasting.text();
    const features = await app.request("/sheet/lynott/tabs/features", {
      headers: { cookie },
    });
    const featuresHtml = await features.text();
    const invalidRest = await app.request("/sheet/lynott/rests/watch", {
      body: new URLSearchParams({ tabId: "actions" }),
      headers: formHeaders,
      method: "POST",
    });
    const invalidTab = await app.request("/sheet/lynott/rests/long", {
      body: new URLSearchParams({ tabId: "unknown" }),
      headers: formHeaders,
      method: "POST",
    });

    expect(longRest.status).toBe(200);
    expect(html).toContain('id="sheet-tab-workspace"');
    expect(html).toContain('id="sheet-header"');
    expect(html).toContain('data-tab-id="actions"');
    expect(html).toContain("31 / 31");
    expect(html).toContain("Hit dice d8");
    expect(html).toContain("3 / 4");
    expect(featuresHtml).toContain("Fey Gift");
    expect(featuresHtml).toContain("2 / 2");
    expect(spellcastingHtml).toContain("3 / 3");
    expect(invalidRest.status).toBe(400);
    expect(invalidTab.status).toBe(400);
  });

  test("renders the Game Master campaign page", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const session = sessionService.createSession("user_game_master");
    const playerSession = sessionService.createSession("user_lynott_player");
    const response = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();
    const playerResponse = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: playerSession.cookie },
    });
    const playerHtml = await playerResponse.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Rovnost Shadows - Campaign Ledger</title>");
    expect(html).toContain(
      '<a class="popover-menu-item" href="/campaigns/rovnost-shadows" role="menuitem" aria-current="page">Campaign</a>',
    );
    expect(html).toContain('<h1 id="campaign-heading" class="panel-heading">Rovnost Shadows</h1>');
    expect(html).toContain("Sessions");
    expect(html).toContain("Session Zero");
    expect(playerResponse.status).toBe(200);
    expect(playerHtml).toContain(
      '<a class="popover-menu-item" href="/campaigns/rovnost-shadows" role="menuitem" aria-current="page">Campaign</a>',
    );
    expect(playerHtml).toContain('<a class="action-link action-link-secondary" href="/campaigns/rovnost-shadows#campaign-wiki-heading">Wiki</a>');
    expect(playerHtml).toContain("Factions Guide");
    expect(playerHtml).toContain("<dt>Game Master</dt><dd>Campaign GM</dd>");
  });

  test("creates player and Game Master roster characters", async () => {
    const { app } = createTestApp("Campaign Ledger");
    const playerCookie = await login(app, "mira@example.local");
    const gmCookie = await login(app, "gm@example.local");

    const playerRoster = await app.request("/characters", {
      headers: { cookie: playerCookie },
    });
    const playerRosterHtml = await playerRoster.text();
    const createdByPlayer = await app.request("/characters", {
      body: new URLSearchParams({
        background: "Guide",
        className: "Ranger",
        hitPointMax: "12",
        level: "1",
        name: "Ash Vale",
        species: "Human",
        subclassName: "",
      }),
      headers: formHeaders(playerCookie),
      method: "POST",
    });
    const createdByGm = await app.request("/campaigns/rovnost-shadows/characters", {
      body: new URLSearchParams({
        background: "Sailor",
        className: "Fighter",
        hitPointMax: "14",
        level: "1",
        name: "Bran Dock",
        ownerUserId: "user_mira_player",
        species: "Dwarf",
        subclassName: "",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const gmRoster = await app.request("/campaigns/rovnost-shadows/characters", {
      headers: { cookie: gmCookie },
    });
    const gmRosterHtml = await gmRoster.text();
    const newSheet = await app.request("/sheet/ash_vale/tabs/background", {
      headers: { cookie: playerCookie },
    });

    expect(playerRoster.status).toBe(200);
    expect(playerRosterHtml).toContain("Player roster");
    expect(playerRosterHtml).toContain('<a class="action-link character-create-link" href="/characters/new">Create character</a>');
    expect(playerRosterHtml).not.toContain('name="hitPointMax"');
    expect(playerRosterHtml).toContain("Mira Voss");
    const playerCreate = await app.request("/characters/new", {
      headers: { cookie: playerCookie },
    });
    const playerCreateHtml = await playerCreate.text();
    expect(playerCreate.status).toBe(200);
    expect(playerCreateHtml).toContain('<a class="action-link action-link-secondary character-create-link" href="/characters">Back to roster</a>');
    expect(playerCreateHtml).toContain('action="/characters"');
    expect(playerCreateHtml).toContain('name="hitPointMax"');
    expect(playerCreateHtml.indexOf('<h2 id="roster-heading">Roster</h2>')).toBeLessThan(
      playerCreateHtml.indexOf('<h2 id="create-character-heading">Create character</h2>'),
    );
    expect(createdByPlayer.status).toBe(303);
    expect(createdByPlayer.headers.get("location")).toBe("/sheet/ash_vale");
    expect(createdByGm.status).toBe(303);
    expect(createdByGm.headers.get("location")).toBe("/sheet/bran_dock");
    expect(gmRoster.status).toBe(200);
    expect(gmRosterHtml).toContain("Campaign roster");
    expect(gmRosterHtml).toContain('/campaigns/rovnost-shadows/characters/new');
    expect(gmRosterHtml).toContain("Ash Vale");
    expect(gmRosterHtml).toContain("Bran Dock");
    expect(newSheet.status).toBe(200);
    expect(await newSheet.text()).toContain("Starting notes");
  });

  test("serves database-backed core and skills tab fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
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

  test("serves compact action, equipment, and role-filtered notes fragments", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const playerSession = sessionService.createSession("user_lynott_player");
    const gmSession = sessionService.createSession("user_game_master");
    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/spells/level-1/absorb-elements.md");
    await importer.importFromLocalSource("docs/rules/spells/level-1/shield.md");
    const actions = await app.request("/sheet/lynott/tabs/actions", {
      headers: { cookie: playerSession.cookie },
    });
    const equipment = await app.request("/sheet/lynott/tabs/equipment", {
      headers: { cookie: playerSession.cookie },
    });
    const background = await app.request("/sheet/lynott/tabs/background", {
      headers: { cookie: playerSession.cookie },
    });
    const playerNotes = await app.request("/sheet/lynott/tabs/notes", {
      headers: { cookie: playerSession.cookie },
    });
    const gmNotes = await app.request("/sheet/lynott/tabs/notes", {
      headers: { cookie: gmSession.cookie },
    });
    const updateMoney = await app.request("/sheet/lynott/equipment/equipment_lynott_coin_purse", {
      body: new URLSearchParams({ deltaQuantity: "5" }),
      headers: {
        cookie: playerSession.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PATCH",
    });
    const actionsHtml = await actions.text();
    const equipmentHtml = await equipment.text();
    const backgroundHtml = await background.text();
    const playerNotesHtml = await playerNotes.text();
    const gmNotesHtml = await gmNotes.text();
    const updateMoneyHtml = await updateMoney.text();

    expect(actions.status).toBe(200);
    expect(actionsHtml).toContain("Action resources");
    expect(actionsHtml).toContain("Character actions and reactions");
    expect(actionsHtml).toContain("Absorb Elements");
    expect(actionsHtml).toContain("Pistol with Repeating Shot infusion");
    expect(actionsHtml).toContain('class="compact-list"');
    expect(equipment.status).toBe(200);
    expect(equipmentHtml).toContain("Coin purse");
    expect(equipmentHtml).toContain('hx-patch="/sheet/lynott/equipment/equipment_lynott_coin_purse"');
    expect(equipmentHtml).toContain("Breastplate with Enhanced Defence infusion");
    expect(equipmentHtml).toContain("Range 30/90 ft.");
    expect(updateMoney.status).toBe(200);
    expect(updateMoneyHtml).toContain("5 gp");
    expect(background.status).toBe(200);
    expect(backgroundHtml).toContain("Jonas Blarendon");
    expect(backgroundHtml).toContain("Sergeant Kora Steelheart");
    expect(backgroundHtml).toContain("Rank structure");
    expect(playerNotes.status).toBe(200);
    expect(playerNotesHtml).toContain("Player notes");
    expect(playerNotesHtml).not.toContain("Sergeant Kora Steelheart");
    expect(gmNotes.status).toBe(200);
    expect(gmNotesHtml).toContain("Game Master notes");
  });

  test("renders Mira's table-ready cleric sheet content", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/srd-5.1");
    const srdSource = {
      abbreviation: "SRD 5.1",
      contentCategory: "srd" as const,
      id: "rules_source_srd_5_1",
      name: "Systems Reference Document 5.1",
      precedence: 15,
      slug: "srd-5-1",
    };
    await importer.importFromLocalSource("docs/rules/srd-5.1-fixtures/spells/level-1/bless.md");
    for (const rulePath of [
      "docs/rules/spells/level-0/guidance.md",
      "docs/rules/spells/level-0/resistance.md",
      "docs/rules/spells/level-0/spare-the-dying.md",
      "docs/rules/spells/level-1/cure-wounds.md",
      "docs/rules/spells/level-1/detect-magic.md",
      "docs/rules/spells/level-1/purify-food-and-drink.md",
      "docs/rules/spells/level-1/sanctuary.md",
    ]) {
      await importer.importFromLocalSource(rulePath, { publicExportEligible: true, source: srdSource });
    }
    const miraSession = sessionService.createSession("user_mira_player");
    const sheet = await app.request("/sheet/mira-voss", {
      headers: { cookie: miraSession.cookie },
    });
    const spellcasting = await app.request("/sheet/mira-voss/tabs/spellcasting", {
      headers: { cookie: miraSession.cookie },
    });
    const actions = await app.request("/sheet/mira-voss/tabs/actions", {
      headers: { cookie: miraSession.cookie },
    });
    const features = await app.request("/sheet/mira-voss/tabs/features", {
      headers: { cookie: miraSession.cookie },
    });
    const equipment = await app.request("/sheet/mira-voss/tabs/equipment", {
      headers: { cookie: miraSession.cookie },
    });
    const notes = await app.request("/sheet/mira-voss/tabs/notes", {
      headers: { cookie: miraSession.cookie },
    });
    const sheetHtml = await sheet.text();
    const spellcastingHtml = await spellcasting.text();
    const actionsHtml = await actions.text();
    const featuresHtml = await features.text();
    const equipmentHtml = await equipment.text();
    const notesHtml = await notes.text();

    expect(sheet.status).toBe(200);
    expect(sheetHtml).toContain('id="inspiration-toggle"');
    expect(sheetHtml).toContain('hx-patch="/sheet/mira-voss/resources/resource_mira_inspiration"');
    expect(sheetHtml).not.toContain("<dd>No</dd>");
    expect(spellcasting.status).toBe(200);
    expect(spellcastingHtml).toContain("Wisdom");
    expect(spellcastingHtml).toContain("Spell attack");
    expect(spellcastingHtml).toContain("+5");
    expect(spellcastingHtml).toContain("Save DC");
    expect(spellcastingHtml).toContain("13");
    expect(spellcastingHtml).toContain("1st-level spell slots");
    expect(spellcastingHtml).toContain('hx-patch="/sheet/mira-voss/resources/resource_mira_spell_slots_1"');
    expect(spellcastingHtml).toContain("Guidance");
    expect(spellcastingHtml).toContain("Resistance");
    expect(spellcastingHtml).toContain("Spare the Dying");
    expect(spellcastingHtml).toContain("Bless");
    expect(spellcastingHtml).toContain("Cure Wounds");
    expect(spellcastingHtml).toContain("Sanctuary");
    expect(actions.status).toBe(200);
    expect(actionsHtml).toContain("Cure Wounds");
    expect(actionsHtml).toContain("Sanctuary");
    expect(actionsHtml).not.toContain("Eldritch Cannon");
    expect(features.status).toBe(200);
    expect(featuresHtml).toContain("Life Domain");
    expect(featuresHtml).toContain("Disciple of Life");
    expect(featuresHtml).toContain("Acolyte");
    expect(featuresHtml).toContain("Spellcasting Focus");
    expect(featuresHtml).not.toContain("Medium Armor");
    expect(featuresHtml).not.toContain("Eldritch Cannon");
    expect(equipment.status).toBe(200);
    expect(equipmentHtml).toContain("Scale mail");
    expect(equipmentHtml).toContain("Shield with holy symbol");
    expect(equipmentHtml).toContain("Mace");
    expect(equipmentHtml).toContain("Equipment rules");
    expect(equipmentHtml).toContain("Medium Armor");
    expect(equipmentHtml).toContain("Weapons");
    expect(notes.status).toBe(200);
    expect(notesHtml).toContain("Seed data scope");
    expect(notesHtml).toContain("table-ready human cleric seed");
    expect(notesHtml).toContain("daily prepared-spell changes");
    expect(notesHtml).not.toContain("deliberately partial");
  });

  test("saves visible notes and keeps role-only notes protected", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const playerSession = sessionService.createSession("user_lynott_player");
    const gmSession = sessionService.createSession("user_game_master");

    const playerUpdate = await app.request("/sheet/lynott/notes/note_lynott_player", {
      body: new URLSearchParams({ body: "Smoke-tested player note.", title: "Player smoke" }),
      headers: formHeaders(playerSession.cookie),
      method: "PATCH",
    });
    const blockedGmUpdate = await app.request("/sheet/lynott/notes/note_lynott_gm", {
      body: new URLSearchParams({ body: "This should not land.", title: "Blocked" }),
      headers: formHeaders(playerSession.cookie),
      method: "PATCH",
    });
    const gmUpdate = await app.request("/sheet/lynott/notes/note_lynott_gm", {
      body: new URLSearchParams({ body: "Smoke-tested Game Master note.", title: "GM smoke" }),
      headers: formHeaders(gmSession.cookie),
      method: "PATCH",
    });
    const playerCreate = await app.request("/sheet/lynott/notes", {
      body: new URLSearchParams({
        body: "Fresh player-created note.",
        title: "Fresh note",
        visibility: "player",
      }),
      headers: formHeaders(playerSession.cookie),
      method: "POST",
    });
    const blockedGmCreate = await app.request("/sheet/lynott/notes", {
      body: new URLSearchParams({
        body: "Player should not create this.",
        title: "Forbidden GM note",
        visibility: "game_master",
      }),
      headers: formHeaders(playerSession.cookie),
      method: "POST",
    });
    const playerNotes = await app.request("/sheet/lynott/tabs/notes", {
      headers: { cookie: playerSession.cookie },
    });
    const gmNotes = await app.request("/sheet/lynott/tabs/notes", {
      headers: { cookie: gmSession.cookie },
    });
    const playerHtml = await playerNotes.text();
    const gmHtml = await gmNotes.text();

    expect(playerUpdate.status).toBe(200);
    expect(await playerUpdate.text()).toContain("Smoke-tested player note.");
    expect(blockedGmUpdate.status).toBe(404);
    expect(gmUpdate.status).toBe(200);
    expect(await gmUpdate.text()).toContain("Smoke-tested Game Master note.");
    expect(playerCreate.status).toBe(200);
    expect(await playerCreate.text()).toContain("Fresh player-created note.");
    expect(blockedGmCreate.status).toBe(403);
    expect(playerHtml).toContain("Smoke-tested player note.");
    expect(playerHtml).toContain("Fresh player-created note.");
    expect(playerHtml).not.toContain("Smoke-tested Game Master note.");
    expect(gmHtml).toContain("Smoke-tested player note.");
    expect(gmHtml).toContain("Smoke-tested Game Master note.");
  });

  test("lets Game Masters create, update, and delete campaign sessions", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;

    const blockedPlayer = await app.request("/campaigns/rovnost-shadows/sessions", {
      body: new URLSearchParams({
        body: "Player cannot create this.",
        summary: "Blocked",
        title: "Blocked session",
        visibility: "player",
      }),
      headers: formHeaders(playerCookie),
      method: "POST",
    });
    const created = await app.request("/campaigns/rovnost-shadows/sessions", {
      body: new URLSearchParams({
        body: "Prep the faction pressure.",
        sessionDate: "2026-05-20",
        summary: "Opening moves.",
        title: "First field session",
        visibility: "game_master",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const campaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: gmCookie },
    });
    const campaignHtml = await campaign.text();
    const createdId = runtime?.repositories.campaignContentRepository
      .listSessionsForCampaign("campaign_rovnost_shadows", "game_master")
      .find((session) => session.title === "First field session")?.id;
    expect(createdId).toBeString();

    const updated = await app.request(`/campaigns/rovnost-shadows/sessions/${createdId}`, {
      body: new URLSearchParams({
        body: "Updated prep notes.",
        sessionDate: "2026-05-21",
        summary: "Updated summary.",
        title: "First field session updated",
        visibility: "player",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const deleted = await app.request(`/campaigns/rovnost-shadows/sessions/${createdId}/delete`, {
      headers: formHeaders(gmCookie),
      method: "POST",
    });

    expect(blockedPlayer.status).toBe(403);
    expect(created.status).toBe(303);
    expect(created.headers.get("location")).toBe("/campaigns/rovnost-shadows");
    expect(campaign.status).toBe(200);
    expect(campaignHtml).toContain("First field session");
    expect(campaignHtml).toContain("Prep the faction pressure.");
    expect(updated.status).toBe(303);
    expect(deleted.status).toBe(303);
    expect(
      runtime?.repositories.campaignContentRepository
        .listSessionsForCampaign("campaign_rovnost_shadows", "game_master")
        .some((session) => session.id === createdId),
    ).toBe(false);
  });

  test("lets Game Masters manage private NPC dossiers and reveal player-safe summaries", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;
    const outsider = runtime?.repositories.authRepository.createUser({
      capabilities: [],
      campaignRoles: [],
      displayName: "Campaign Outsider",
      email: "npc-outsider@example.local",
      id: "user_npc_outsider",
      passwordHash: "unused",
      role: "player",
      status: "active",
    });
    expect(outsider).toBeDefined();
    const outsiderCookie = sessionService.createSession("user_npc_outsider").cookie;

    const prep = await app.request("/campaigns/rovnost-shadows/prep", {
      headers: { cookie: gmCookie },
    });
    const prepHtml = await prep.text();
    const playerPrep = await app.request("/campaigns/rovnost-shadows/prep", {
      headers: { cookie: playerCookie },
    });
    const playerEmptyNpcList = await app.request("/campaigns/rovnost-shadows/npcs", {
      headers: { cookie: playerCookie },
    });
    const outsiderNpcList = await app.request("/campaigns/rovnost-shadows/npcs", {
      headers: { cookie: outsiderCookie },
    });
    const created = await app.request("/campaigns/rovnost-shadows/npcs", {
      body: new URLSearchParams({
        gmNotes: "Only the Game Master should see this.",
        hooks: "Offers a risky canal favour.",
        motivations: "Protects the dock unions.",
        name: "Canal Broker",
        portraitImageAssetId: "asset_magister_vallen",
        publicSummary: "A broker with friends near the canal gates.",
        publicWikiPageId: "wiki_rovnost_factions",
        revealNotes: "Reveal after the warehouse scene.",
        rulesEntityId: "",
        sceneNotes: "Use during the chase.",
        secrets: "Working for the Tidebound.",
        visibility: "private",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const createdNpc = runtime?.repositories.campaignContentRepository
      .listNpcDossiersForCampaign("campaign_rovnost_shadows", "game_master")
      .find((npc) => npc.name === "Canal Broker");
    expect(createdNpc).toBeDefined();

    const detail = await app.request("/campaigns/rovnost-shadows/npcs/canal-broker", {
      headers: { cookie: gmCookie },
    });
    const detailHtml = await detail.text();
    const playerHiddenDetail = await app.request("/campaigns/rovnost-shadows/npcs/canal-broker", {
      headers: { cookie: playerCookie },
    });
    const updated = await app.request(`/campaigns/rovnost-shadows/npcs/${createdNpc?.id}`, {
      body: new URLSearchParams({
        gmNotes: "Updated Game Master-only prep.",
        hooks: "Trades safe passage for a secret.",
        motivations: "Needs leverage.",
        name: "Canal Broker",
        portraitImageAssetId: "",
        publicSummary: "A broker with leverage in the canal districts.",
        publicWikiPageId: "wiki_rovnost_factions",
        revealNotes: "Now safe to reveal.",
        rulesEntityId: "",
        sceneNotes: "Use at the lock gate.",
        secrets: "Still connected to Tidebound.",
        selectedPlayerIds: "user_lynott_player",
        visibility: "selected",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const selectedVisibleToLynott = runtime?.repositories.campaignContentRepository
      .listNpcSummariesForCampaign("campaign_rovnost_shadows", "player", "user_lynott_player")
      .some((npc) => npc.id === createdNpc?.id);
    const selectedHiddenFromMira = runtime?.repositories.campaignContentRepository
      .listNpcSummariesForCampaign("campaign_rovnost_shadows", "player", "user_mira_player")
      .some((npc) => npc.id === createdNpc?.id);
    const revealed = await app.request(`/campaigns/rovnost-shadows/npcs/${createdNpc?.id}/reveal`, {
      body: new URLSearchParams({ visibility: "public" }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const playerVisibleDetail = await app.request("/campaigns/rovnost-shadows/npcs/canal-broker", {
      headers: { cookie: playerCookie },
    });
    const playerVisibleHtml = await playerVisibleDetail.text();
    const hiddenAgain = await app.request(`/campaigns/rovnost-shadows/npcs/${createdNpc?.id}/reveal`, {
      body: new URLSearchParams({ visibility: "private" }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });

    expect(prep.status).toBe(200);
    expect(prepHtml).toContain("Prep workspace");
    expect(prepHtml).toContain('href="/campaigns/rovnost-shadows/npcs"');
    expect(playerPrep.status).toBe(403);
    expect(playerEmptyNpcList.status).toBe(200);
    expect(outsiderNpcList.status).toBe(403);
    expect(created.status).toBe(303);
    expect(created.headers.get("location")).toBe("/campaigns/rovnost-shadows/npcs/canal-broker");
    expect(detail.status).toBe(200);
    expect(detailHtml).toContain("Only the Game Master should see this.");
    expect(detailHtml).toContain("Make public");
    expect(playerHiddenDetail.status).toBe(404);
    expect(updated.status).toBe(303);
    expect(selectedVisibleToLynott).toBe(true);
    expect(selectedHiddenFromMira).toBe(false);
    expect(revealed.status).toBe(303);
    expect(playerVisibleDetail.status).toBe(200);
    expect(playerVisibleHtml).toContain("A broker with leverage in the canal districts.");
    expect(playerVisibleHtml).not.toContain("Updated Game Master-only prep.");
    expect(playerVisibleHtml).not.toContain("Still connected to Tidebound.");
    expect(hiddenAgain.status).toBe(303);
    expect(
      runtime?.repositories.campaignContentRepository
        .listNpcSummariesForCampaign("campaign_rovnost_shadows", "player", "user_lynott_player")
        .some((npc) => npc.id === createdNpc?.id),
    ).toBe(false);
  });

  test("renders Game Master player preview with production visibility filtering", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;

    const preview = await app.request("/campaigns/rovnost-shadows/preview/player", {
      headers: { cookie: gmCookie },
    });
    const previewHtml = await preview.text();
    const playerPreview = await app.request("/campaigns/rovnost-shadows/preview/player", {
      headers: { cookie: playerCookie },
    });

    expect(preview.status).toBe(200);
    expect(previewHtml).toContain("<title>Player preview - Rovnost Shadows - Campaign Ledger</title>");
    expect(previewHtml).toContain("Previewing as Lynott Player");
    expect(previewHtml).toContain("Visibility audit");
    expect(previewHtml).toContain("Visible to Lynott Player");
    expect(previewHtml).toContain("Magister Vallen");
    expect(previewHtml).toContain("Selected players");
    expect(previewHtml).toContain("Factions Guide");
    expect(previewHtml).toContain("The Skywrights");
    expect(previewHtml).toContain("Review lines, veils, table logistics");
    expect(previewHtml).toContain("Player notes");
    expect(previewHtml).toContain("Keep the false identities ready");
    expect(previewHtml).not.toContain("Game Master reference.");
    expect(previewHtml).not.toContain("Keep Vallen private until the table has enough leverage.");
    expect(previewHtml).not.toContain("Disabled Skybridge Rumour");
    expect(playerPreview.status).toBe(403);
  });

  test("lets players and Game Masters update character faction choices", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;
    const otherPlayerCookie = sessionService.createSession("user_mira_player").cookie;
    const gmCookie = sessionService.createSession("user_game_master").cookie;

    const playerUpdate = await app.request("/sheet/lynott/faction", {
      body: new URLSearchParams({
        connectionNote: "Canal contacts smuggled Lynott through the lock gates.",
        factionId: "faction_tidebound",
      }),
      headers: formHeaders(playerCookie),
      method: "PATCH",
    });
    const blockedOtherPlayer = await app.request("/sheet/lynott/faction", {
      body: new URLSearchParams({
        connectionNote: "Mira cannot edit Lynott.",
        factionId: "faction_skywright_guild",
      }),
      headers: formHeaders(otherPlayerCookie),
      method: "PATCH",
    });
    const invalidFaction = await app.request("/sheet/lynott/faction", {
      body: new URLSearchParams({
        connectionNote: "Wrong campaign.",
        factionId: "missing_faction",
      }),
      headers: formHeaders(playerCookie),
      method: "PATCH",
    });
    const gmOverride = await app.request("/sheet/lynott/faction", {
      body: new URLSearchParams({
        connectionNote: "A magistrate licence file has Lynott's name in the margin.",
        factionId: "faction_council_of_magisters",
      }),
      headers: formHeaders(gmCookie),
      method: "PATCH",
    });
    const unaffiliated = await app.request("/sheet/lynott/faction", {
      body: new URLSearchParams({
        connectionNote: "Keeps faction ties informal.",
        factionId: "",
      }),
      headers: formHeaders(playerCookie),
      method: "PATCH",
    });

    expect(playerUpdate.status).toBe(200);
    expect(await playerUpdate.text()).toContain("Canal contacts smuggled Lynott");
    expect(blockedOtherPlayer.status).toBe(403);
    expect(invalidFaction.status).toBe(400);
    expect(gmOverride.status).toBe(200);
    expect(await gmOverride.text()).toContain("Council of Magisters");
    expect(unaffiliated.status).toBe(200);
    expect(await unaffiliated.text()).toContain("Unaffiliated/Other: Keeps faction ties informal.");
  });

  test("serves campaign wiki pages by visibility", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;
    const gmCookie = sessionService.createSession("user_game_master").cookie;

    const playerPage = await app.request("/campaigns/rovnost-shadows/wiki/factions-guide", {
      headers: { cookie: playerCookie },
    });
    const playerHtml = await playerPage.text();
    const hiddenPage = await app.request("/campaigns/rovnost-shadows/wiki/gm-dossier", {
      headers: { cookie: playerCookie },
    });
    const gmPage = await app.request("/campaigns/rovnost-shadows/wiki/gm-dossier", {
      headers: { cookie: gmCookie },
    });

    expect(playerPage.status).toBe(200);
    expect(playerHtml).toContain("<title>Factions Guide - Rovnost Shadows - Campaign Ledger</title>");
    expect(playerHtml).toContain("<h2>Factions Guide</h2>");
    expect(playerHtml).toContain('src="/campaigns/rovnost-shadows/assets/asset_skywright_sigil"');
    expect(playerHtml).toContain('aria-label="Factions Guide gallery"');
    expect(hiddenPage.status).toBe(404);
    expect(gmPage.status).toBe(200);
    expect(await gmPage.text()).toContain("Magister Vallen is watching");
  });

  test("serves campaign image library and detail pages by role", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;
    runtime?.repositories.authRepository.createUser({
      capabilities: [],
      campaignRoles: [],
      displayName: "Campaign Outsider",
      email: "outsider-images@example.local",
      id: "user_campaign_outsider_images",
      passwordHash: "unused",
      role: "player",
      status: "active",
    });
    const outsiderCookie = sessionService.createSession("user_campaign_outsider_images").cookie;

    const gmLibrary = await app.request("/campaigns/rovnost-shadows/images", {
      headers: { cookie: gmCookie },
    });
    const gmHtml = await gmLibrary.text();
    const playerLibrary = await app.request("/campaigns/rovnost-shadows/images", {
      headers: { cookie: playerCookie },
    });
    const playerHtml = await playerLibrary.text();
    const gmDetail = await app.request("/campaigns/rovnost-shadows/images/asset_magister_vallen", {
      headers: { cookie: gmCookie },
    });
    const gmDetailHtml = await gmDetail.text();
    const playerDetail = await app.request("/campaigns/rovnost-shadows/images/asset_magister_vallen", {
      headers: { cookie: playerCookie },
    });
    const playerDetailHtml = await playerDetail.text();
    const outsiderLibrary = await app.request("/campaigns/rovnost-shadows/images", {
      headers: { cookie: outsiderCookie },
    });

    expect(gmLibrary.status).toBe(200);
    expect(gmHtml).toContain("<title>Images - Rovnost Shadows - Campaign Ledger</title>");
    expect(gmHtml).toContain("Magister Vallen portrait");
    expect(gmHtml).toContain("Fallback active");
    expect(gmHtml).toContain("1 uses");
    expect(playerLibrary.status).toBe(200);
    expect(playerHtml).toContain("Skywright sigil");
    expect(playerHtml).toContain("Magister Vallen portrait");
    expect(gmDetail.status).toBe(200);
    expect(gmDetailHtml).toContain("Storage key");
    expect(gmDetailHtml).toContain("Magister Vallen");
    expect(gmDetailHtml).toContain('href="/campaigns/rovnost-shadows/npcs/magister-vallen"');
    expect(playerDetail.status).toBe(200);
    expect(playerDetailHtml).toContain("Magister Vallen portrait.");
    expect(playerDetailHtml).not.toContain("Storage key");
    expect(outsiderLibrary.status).toBe(403);
  });

  test("lets Game Masters create wiki pages and image assets with protected reads", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;

    const wikiCreate = await app.request("/campaigns/rovnost-shadows/wiki", {
      body: new URLSearchParams({
        bodyMarkdown: "# Brass Market\n\n**Known for**\n\n- Clockwork fruit sellers",
        pageType: "location",
        tags: "market, player-facing",
        title: "Brass Market",
        visibility: "player",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const wikiRead = await app.request("/campaigns/rovnost-shadows/wiki/brass-market", {
      headers: { cookie: playerCookie },
    });
    const privateWikiCreate = await app.request("/campaigns/rovnost-shadows/wiki", {
      body: new URLSearchParams({
        bodyMarkdown: "# Hidden Market\n\nOnly the Game Master sees this.",
        pageType: "location",
        tags: "secret",
        title: "Hidden Market",
        visibility: "game_master",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const playerCampaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: playerCookie },
    });
    const playerCampaignHtml = await playerCampaign.text();

    const imageForm = new FormData();
    imageForm.set("title", "Secret seal");
    imageForm.set("altText", "A red wax seal marked with Vallen's signet");
    imageForm.set("caption", "GM-only handout.");
    imageForm.set("visibility", "game_master");
    imageForm.set("width", "2");
    imageForm.set("height", "2");
    imageForm.set("image", new File([new Uint8Array([1, 2, 3, 4])], "seal.png", { type: "image/png" }));
    const upload = await app.request("/campaigns/rovnost-shadows/assets", {
      body: imageForm,
      headers: { cookie: gmCookie },
      method: "POST",
    });
    const asset = runtime?.repositories.campaignContentRepository
      .listImageAssetsForCampaign("campaign_rovnost_shadows", "game_master")
      .find((item) => item.title === "Secret seal");
    expect(asset).toBeDefined();

    const outsider = runtime?.repositories.authRepository.createUser({
      capabilities: [],
      campaignRoles: [],
      displayName: "Campaign Outsider",
      email: "outsider@example.local",
      id: "user_campaign_outsider",
      passwordHash: "unused",
      role: "player",
      status: "active",
    });
    expect(outsider).toBeDefined();
    const outsiderCookie = sessionService.createSession("user_campaign_outsider").cookie;
    const playerAsset = await app.request(`/campaigns/rovnost-shadows/assets/${asset?.id}`, {
      headers: { cookie: playerCookie },
    });
    const outsiderAsset = await app.request(`/campaigns/rovnost-shadows/assets/${asset?.id}`, {
      headers: { cookie: outsiderCookie },
    });
    const gmAsset = await app.request(`/campaigns/rovnost-shadows/assets/${asset?.id}`, {
      headers: { cookie: gmCookie },
    });

    expect(wikiCreate.status).toBe(303);
    expect(wikiRead.status).toBe(200);
    expect(await wikiRead.text()).toContain("<h2>Brass Market</h2>");
    expect(privateWikiCreate.status).toBe(303);
    expect(playerCampaign.status).toBe(200);
    expect(playerCampaignHtml).toContain('<a href="/campaigns/rovnost-shadows/wiki/brass-market">Brass Market</a>');
    expect(playerCampaignHtml).not.toContain("Hidden Market");
    expect(upload.status).toBe(303);
    expect(upload.headers.get("location")).toBe(`/campaigns/rovnost-shadows/images/${asset?.id}`);
    expect(asset?.storageKey).not.toContain("seal.png");
    expect(playerAsset.status).toBe(404);
    expect(outsiderAsset.status).toBe(403);
    expect(gmAsset.status).toBe(200);
    expect(gmAsset.headers.get("content-type")).toContain("image/png");
  });

  test("lets Game Masters preview and save staged campaign imports", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;

    const form = new URLSearchParams({
      content: "<h1>Canal Clue</h1><p>See https://docs.google.com/document/d/secret/edit</p><p>The tide bell rings.</p>",
      sourceFormat: "html",
      sourceReference: "GM notebook export",
      targetType: "wiki",
      visibility: "player",
    });
    const preview = await app.request("/campaigns/rovnost-shadows/imports/preview", {
      body: form,
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const previewHtml = await preview.text();
    const save = await app.request("/campaigns/rovnost-shadows/imports/save", {
      body: new URLSearchParams({
        conversionNotes: "Private Google Drive or Docs links were removed from the converted content.",
        convertedMarkdown: "# Canal Clue\n\nSee [private source link removed]\n\nThe tide bell rings.",
        provider: "manual",
        sourceFormat: "html",
        sourceReference: "GM notebook export",
        sourceTitle: "Canal Clue",
        targetType: "wiki",
        title: "Canal Clue",
        visibility: "player",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const page = await app.request("/campaigns/rovnost-shadows/wiki/canal-clue", {
      headers: { cookie: playerCookie },
    });
    const pageHtml = await page.text();
    const playerCampaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: playerCookie },
    });
    const playerCampaignHtml = await playerCampaign.text();
    const imports = await app.request("/campaigns/rovnost-shadows/imports", {
      headers: { cookie: gmCookie },
    });
    const importsHtml = await imports.text();

    expect(preview.status).toBe(200);
    expect(previewHtml).toContain("Private Google Drive or Docs links were removed");
    expect(previewHtml).not.toContain("docs.google.com");
    expect(save.status).toBe(303);
    expect(save.headers.get("location")).toBe("/campaigns/rovnost-shadows");
    expect(page.status).toBe(200);
    expect(pageHtml).toContain("The tide bell rings.");
    expect(pageHtml).not.toContain("docs.google.com");
    expect(playerCampaign.status).toBe(200);
    expect(playerCampaignHtml).toContain('<a href="/campaigns/rovnost-shadows/wiki/canal-clue">Canal Clue</a>');
    expect(imports.status).toBe(200);
    expect(importsHtml).toContain("Canal Clue");
    expect(importsHtml).toContain("Saved to campaign content.");
  });

  test("saves staged campaign imports to every supported target type", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const targets = [
      { location: "/campaigns/rovnost-shadows", targetType: "wiki", title: "Review Wiki Import" },
      { location: "/campaigns/rovnost-shadows", targetType: "session", title: "Review Session Import" },
      { location: "/campaigns/rovnost-shadows/npcs", targetType: "npc", title: "Review NPC Import" },
      { location: "/campaigns/rovnost-shadows/imports", targetType: "draft", title: "Review Draft Import" },
    ] as const;

    for (const target of targets) {
      const response = await app.request("/campaigns/rovnost-shadows/imports/save", {
        body: new URLSearchParams({
          conversionNotes: "",
          convertedMarkdown: `# ${target.title}\n\nA staged import for ${target.targetType}.`,
          provider: "manual",
          sourceFormat: "markdown",
          sourceReference: "Route target coverage",
          sourceTitle: `${target.title} Source`,
          targetType: target.targetType,
          title: target.title,
          visibility: target.targetType === "npc" ? "player" : "game_master",
        }),
        headers: formHeaders(gmCookie),
        method: "POST",
      });

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(target.location);
    }

    const content = runtime?.repositories.campaignContentRepository;
    expect(content?.getWikiPageBySlug("campaign_rovnost_shadows", "review-wiki-import", "game_master")?.title)
      .toBe("Review Wiki Import");
    expect(content?.listSessionsForCampaign("campaign_rovnost_shadows", "game_master").some((session) =>
      session.title === "Review Session Import"
    )).toBe(true);
    expect(content?.listNpcSummariesForCampaign("campaign_rovnost_shadows", "player").some((npc) =>
      npc.name === "Review NPC Import"
    )).toBe(true);
    expect(content?.listContentImportsForCampaign("campaign_rovnost_shadows").some((item) =>
      item.targetType === "draft" && item.targetRecordId === null && item.sourceTitle === "Review Draft Import Source"
    )).toBe(true);
  });

  test("lets Game Masters preview manual Google Docs exports through staged imports", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;

    const page = await app.request("/campaigns/rovnost-shadows/imports/google-docs", {
      headers: { cookie: gmCookie },
    });
    const preview = await app.request("/campaigns/rovnost-shadows/imports/preview", {
      body: new URLSearchParams({
        content: "<h1>Clockwork Canal</h1><p>See https://docs.google.com/document/d/private-id/edit</p><p>Imported from export.</p>",
        provider: "google_docs_manual",
        sourceFormat: "html",
        sourceReference: "https://docs.google.com/document/d/manual-doc-123/edit",
        sourceTitle: "Clockwork Canal Export",
        targetType: "wiki",
        visibility: "player",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const previewHtml = await preview.text();
    const save = await app.request("/campaigns/rovnost-shadows/imports/save", {
      body: new URLSearchParams({
        conversionNotes: "Private Google Drive or Docs links were removed from the converted content.",
        convertedMarkdown: "# Clockwork Canal\n\nSee [private source link removed]\n\nImported from export.",
        provider: "google_docs_manual",
        sourceFormat: "html",
        sourceReference: "https://docs.google.com/document/d/manual-doc-123/edit",
        sourceTitle: "Clockwork Canal Export",
        targetType: "wiki",
        title: "Clockwork Canal",
        visibility: "player",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });
    const playerPage = await app.request("/campaigns/rovnost-shadows/wiki/clockwork-canal", {
      headers: { cookie: playerCookie },
    });
    const playerHtml = await playerPage.text();
    const imports = runtime?.repositories.campaignContentRepository.listContentImportsForCampaign(
      "campaign_rovnost_shadows",
    ) ?? [];
    const recorded = imports.find((item) => item.sourceTitle === "Clockwork Canal Export");

    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Google Docs manual export");
    expect(preview.status).toBe(200);
    expect(previewHtml).toContain("Google Docs manual");
    expect(previewHtml).toContain("Private Google Drive or Docs links were removed");
    expect(previewHtml).not.toContain("docs.google.com");
    expect(save.status).toBe(303);
    expect(playerPage.status).toBe(200);
    expect(playerHtml).toContain("Imported from export.");
    expect(playerHtml).not.toContain("docs.google.com");
    expect(recorded).toMatchObject({
      provider: "google_docs_manual",
      sourceReference: "google-doc:manual-doc-123",
      targetType: "wiki",
      visibility: "player",
    });
  });

  test("rejects incomplete manual Google Docs imports before preview", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;

    const response = await app.request("/campaigns/rovnost-shadows/imports/preview", {
      body: new URLSearchParams({
        content: "# Missing Reference",
        provider: "google_docs_manual",
        sourceFormat: "markdown",
        sourceTitle: "Missing Reference",
        targetType: "wiki",
        visibility: "game_master",
      }),
      headers: formHeaders(gmCookie),
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Invalid Google Docs import");
  });

  test("serves a readable fallback for missing seeded campaign asset files", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const playerCookie = sessionService.createSession("user_lynott_player").cookie;
    const quotedAsset = runtime?.repositories.campaignContentRepository.createImageAsset({
      altText: "A missing asset with quote characters",
      byteSize: 0,
      campaignId: "campaign_rovnost_shadows",
      caption: "Regression asset.",
      height: null,
      mimeType: "image/png",
      storageKey: "campaigns/rovnost-shadows/missing-quoted-title.png",
      title: `Vallen's "marked" seal`,
      visibility: "player",
      width: null,
    });
    const response = await app.request("/campaigns/rovnost-shadows/assets/asset_skywright_sigil", {
      headers: { cookie: playerCookie },
    });
    const body = await response.text();
    const quotedResponse = await app.request(`/campaigns/rovnost-shadows/assets/${quotedAsset?.id}`, {
      headers: { cookie: playerCookie },
    });
    const quotedBody = await quotedResponse.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(body).toContain("Skywright sigil");
    expect(body).toContain("Seeded campaign image unavailable locally");
    expect(quotedResponse.status).toBe(200);
    expect(quotedBody).toContain("Vallen&apos;s &quot;marked&quot; seal");
    expect(quotedBody).not.toContain(`aria-label="Vallen's "marked" seal"`);
  });

  test("rejects image uploads without alt text or with unsupported file types", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
    const gmCookie = sessionService.createSession("user_game_master").cookie;

    const missingAlt = new FormData();
    missingAlt.set("title", "Map");
    missingAlt.set("visibility", "player");
    missingAlt.set("image", new File([new Uint8Array([1])], "map.png", { type: "image/png" }));
    const unsupported = new FormData();
    unsupported.set("title", "Map");
    unsupported.set("altText", "A map");
    unsupported.set("visibility", "player");
    unsupported.set("image", new File([new Uint8Array([1])], "map.gif", { type: "image/gif" }));
    const webp = new FormData();
    webp.set("title", "Canal sketch");
    webp.set("altText", "A canal sketch");
    webp.set("visibility", "player");
    webp.set("image", new File([new Uint8Array([1, 2])], "canal.webp", { type: "image/webp" }));

    expect((await app.request("/campaigns/rovnost-shadows/assets", {
      body: missingAlt,
      headers: { cookie: gmCookie },
      method: "POST",
    })).status).toBe(400);
    expect((await app.request("/campaigns/rovnost-shadows/assets", {
      body: unsupported,
      headers: { cookie: gmCookie },
      method: "POST",
    })).status).toBe(400);
    expect((await app.request("/campaigns/rovnost-shadows/assets", {
      body: webp,
      headers: { cookie: gmCookie },
      method: "POST",
    })).status).toBe(303);
  });

  test("smokes the seeded MVP workflow through login, sheet play, notes, roles, and logout", async () => {
    const { app } = createTestApp("Campaign Ledger");
    const playerCookie = await login(app, "lynott@example.local");

    const sheet = await app.request("/sheet/lynott", { headers: { cookie: playerCookie } });
    const damage = await app.request("/sheet/lynott/resources/resource_lynott_hit_points", {
      body: new URLSearchParams({ delta: "-3" }),
      headers: formHeaders(playerCookie),
      method: "PATCH",
    });
    const note = await app.request("/sheet/lynott/notes/note_lynott_player", {
      body: new URLSearchParams({ body: "MVP smoke note saved.", title: "Player notes" }),
      headers: formHeaders(playerCookie),
      method: "PATCH",
    });
    const tabs = await Promise.all(
      ["core", "skills", "actions", "spellcasting", "features", "equipment", "background", "notes"].map(
        async (tabId) => {
          const response = await app.request(`/sheet/lynott/tabs/${tabId}`, {
            headers: { cookie: playerCookie },
          });

          return { html: await response.text(), response, tabId };
        },
      ),
    );
    const logout = await app.request("/logout", {
      headers: formHeaders(playerCookie),
      method: "POST",
    });
    const afterLogout = await app.request("/sheet/lynott", { headers: { cookie: playerCookie } });
    const gmCookie = await login(app, "gm@example.local");
    const campaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: gmCookie },
    });
    const gmNotes = await app.request("/sheet/lynott/tabs/notes", {
      headers: { cookie: gmCookie },
    });
    const adminCookie = await login(app, "admin@example.local");
    const admin = await app.request("/admin", { headers: { cookie: adminCookie } });

    expect(sheet.status).toBe(200);
    expect(await sheet.text()).toContain("<title>Lynott Magulbisson - Campaign Ledger</title>");
    expect(damage.status).toBe(200);
    expect(await damage.text()).toContain("28 / 31");
    expect(note.status).toBe(200);
    expect(await note.text()).toContain("MVP smoke note saved.");
    for (const tab of tabs) {
      expect(tab.response.status).toBe(200);
      expect(tab.html).toContain(`data-tab-id="${tab.tabId}"`);
    }
    expect(logout.status).toBe(303);
    expect(logout.headers.get("location")).toBe("/");
    expect(afterLogout.status).toBe(303);
    expect(afterLogout.headers.get("location")).toBe("/login");
    expect(campaign.status).toBe(200);
    expect(await campaign.text()).toContain("Rovnost Shadows");
    expect(gmNotes.status).toBe(200);
    expect(await gmNotes.text()).toContain("Game Master notes");
    expect(admin.status).toBe(200);
    expect(await admin.text()).toContain("Admin");
  });

  test("rejects unauthenticated, unknown, and invalid sheet tab requests", async () => {
    const { app, sessionService } = createTestApp("Campaign Ledger");
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
