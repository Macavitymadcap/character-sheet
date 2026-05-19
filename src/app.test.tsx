import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "bun:test";
import { createApp } from "./app";
import { AuthService, PasswordService, SessionService } from "./auth";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "./db";
import { RulesImportService } from "./rules";

let runtime: SqliteDatabaseRuntime | undefined;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
  delete process.env.CHARACTER_SHEET_ASSET_ROOT;
});

const createTestApp = (appName = "Test Character Sheet") => {
  process.env.CHARACTER_SHEET_ASSET_ROOT = `${tmpdir()}/character-sheet-test-assets`;
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
    expect(playerHtml).toContain('<a class="action-link" href="/characters">Continue</a>');
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
    expect(html).toContain("Mage Hand");
    expect(html).toContain("1st-level spell slots");
    expect(html).toContain('href="/rules/spell/mage-hand"');
  });

  test("serves canonical sheet tab pages for refreshable navigation", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const response = await app.request("/sheet/lynott/actions", {
      headers: { cookie: session.cookie },
    });
    const html = await response.text();
    const missing = await app.request("/sheet/lynott/unknown", {
      headers: { cookie: session.cookie },
    });

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Lynott Magulbisson - Character Sheet</title>");
    expect(html).toContain('data-tab-id="actions"');
    expect(html).toContain('hx-push-url="/sheet/lynott/actions"');
    expect(html).toContain("Available actions");
    expect(missing.status).toBe(404);
  });

  test("serves authenticated rules browsing and detail pages", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const session = sessionService.createSession("user_lynott_player");
    const importer = new RulesImportService(runtime!.repositories.rulesSeedRepository);
    await importer.importFromLocalSource("docs/rules/srd-5.1-fixtures");

    const unauthenticated = await app.request("/rules");
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

    expect(unauthenticated.status).toBe(303);
    expect(unauthenticated.headers.get("location")).toBe("/login");
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

  test("updates manual sheet fields through HTMX fragments", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const cookie = sessionService.createSession("user_lynott_player").cookie;
    const headers = formHeaders(cookie);

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

    expect(summary.status).toBe(200);
    expect(await summary.text()).toContain("Lynott Undercover");
    expect(ability.status).toBe(200);
    expect(await ability.text()).toContain("+8");
    expect(skill.status).toBe(200);
    expect(await skill.text()).toContain("Arcana");
    expect(equipment.status).toBe(200);
    expect(await equipment.text()).toContain("Clockwork pistol");
  });

  test("adds custom conditions and returns dice roll fragments", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
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

  test("updates tab resources through HTMX panel fragments", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
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
    const { app, sessionService } = createTestApp("Character Sheet");
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
    const { app, sessionService } = createTestApp("Character Sheet");
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
    expect(html).toContain("<title>Rovnost Shadows - Character Sheet</title>");
    expect(html).toContain(
      '<a class="popover-menu-item" href="/campaigns/rovnost-shadows" role="menuitem" aria-current="page">Campaign</a>',
    );
    expect(html).toContain('<h1 id="campaign-heading" class="panel-heading">Rovnost Shadows</h1>');
    expect(html).toContain("Sessions");
    expect(html).toContain("Session Zero");
    expect(playerResponse.status).toBe(200);
    expect(playerHtml).toContain("<dt>Game Master</dt><dd>Campaign GM</dd>");
  });

  test("creates player and Game Master roster characters", async () => {
    const { app } = createTestApp("Character Sheet");
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
    expect(playerRosterHtml).toContain('<a class="action-link" href="/characters/new">Create character</a>');
    expect(playerRosterHtml).not.toContain('name="hitPointMax"');
    expect(playerRosterHtml).toContain("Mira Voss");
    const playerCreate = await app.request("/characters/new", {
      headers: { cookie: playerCookie },
    });
    const playerCreateHtml = await playerCreate.text();
    expect(playerCreate.status).toBe(200);
    expect(playerCreateHtml).toContain('action="/characters"');
    expect(playerCreateHtml).toContain('name="hitPointMax"');
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

  test("serves compact action, equipment, and role-filtered notes fragments", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
    const playerSession = sessionService.createSession("user_lynott_player");
    const gmSession = sessionService.createSession("user_game_master");
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
    expect(actionsHtml).toContain("Bonus actions and reactions");
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

  test("saves visible notes and keeps role-only notes protected", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
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
    const { app, sessionService } = createTestApp("Character Sheet");
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

  test("lets players and Game Masters update character faction choices", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
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
    const { app, sessionService } = createTestApp("Character Sheet");
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
    expect(playerHtml).toContain("<title>Factions Guide - Rovnost Shadows - Character Sheet</title>");
    expect(playerHtml).toContain("<h2>Factions Guide</h2>");
    expect(playerHtml).toContain('src="/campaigns/rovnost-shadows/assets/asset_skywright_sigil"');
    expect(playerHtml).toContain('aria-label="Factions Guide gallery"');
    expect(hiddenPage.status).toBe(404);
    expect(gmPage.status).toBe(200);
    expect(await gmPage.text()).toContain("Magister Vallen is watching");
  });

  test("lets Game Masters create wiki pages and image assets with protected reads", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
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
    expect(upload.status).toBe(303);
    expect(asset?.storageKey).not.toContain("seal.png");
    expect(playerAsset.status).toBe(404);
    expect(outsiderAsset.status).toBe(403);
    expect(gmAsset.status).toBe(200);
    expect(gmAsset.headers.get("content-type")).toContain("image/png");
  });

  test("serves a readable fallback for missing seeded campaign asset files", async () => {
    const { app, sessionService } = createTestApp("Character Sheet");
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
    const { app, sessionService } = createTestApp("Character Sheet");
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
  });

  test("smokes the seeded MVP workflow through login, sheet play, notes, roles, and logout", async () => {
    const { app } = createTestApp("Character Sheet");
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
    expect(await sheet.text()).toContain("<title>Lynott Magulbisson - Character Sheet</title>");
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
