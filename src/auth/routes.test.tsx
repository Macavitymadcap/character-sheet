import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../app";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "../db";
import { AuthService } from "./service";
import { PasswordService } from "./password";
import { SessionService } from "./sessions";

let runtime: SqliteDatabaseRuntime;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  runtime = createSqliteDatabase({ path: ":memory:" });
  app = createApp({
    appName: "Campaign Ledger",
    authService: new AuthService({
      authRepository: runtime.repositories.authRepository,
      passwordService: new PasswordService(),
    }),
    sessionService: new SessionService({
      authRepository: runtime.repositories.authRepository,
      now: () => new Date("2026-05-16T12:00:00.000Z"),
      secret: "test-session-secret",
    }),
    ...runtime.repositories,
  });
});

afterEach(() => {
  runtime.close();
});

const postForm = (
  path: string,
  body: Record<string, string>,
  cookie?: string,
  headers: Record<string, string> = {},
) =>
  app.request(path, {
    body: new URLSearchParams(body),
    headers: {
      ...headers,
      ...(cookie ? { cookie } : {}),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

const login = async (email: string) => {
  const response = await postForm("/login", { email, password: "password123" });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error(`Expected login cookie for ${email}`);

  return cookie;
};

describe("auth routes", () => {
  test("redirects protected pages to login", async () => {
    const response = await app.request("/sheet/lynott");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("renders the login page", async () => {
    const response = await app.request("/login");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Sign in");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
  });

  test("logs in seeded users with HTTP-only sessions", async () => {
    const response = await postForm("/login", {
      email: "lynott@example.local",
      password: "password123",
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/characters");
    expect(response.headers.get("set-cookie")).toContain("character_sheet_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  test("rejects bad login attempts", async () => {
    const response = await postForm("/login", {
      email: "lynott@example.local",
      password: "wrong",
    });

    expect(response.status).toBe(401);
    expect(await response.text()).toContain("Invalid username or password.");
  });

  test("renders the home page for authenticated users and logs out", async () => {
    const cookie = await login("lynott@example.local");
    const home = await app.request("/", { headers: { cookie } });
    const homeHtml = await home.text();
    const logoutPage = await app.request("/logout", { headers: { cookie } });
    const logout = await app.request("/logout", { headers: { cookie }, method: "POST" });
    const afterLogout = await app.request("/", { headers: { cookie } });
    const afterLogoutHtml = await afterLogout.text();

    expect(home.status).toBe(200);
    expect(homeHtml).toContain('<a class="action-link action-link-secondary" href="/characters">Characters</a>');
    expect(logoutPage.status).toBe(200);
    expect(await logoutPage.text()).toContain("End the current session for Lynott Player.");
    expect(logout.status).toBe(303);
    expect(logout.headers.get("location")).toBe("/");
    expect(logout.headers.get("set-cookie")).toContain("character_sheet_session=;");
    expect(afterLogout.status).toBe(200);
    expect(afterLogoutHtml).toContain(
      '<a class="popover-menu-item" href="/login" role="menuitem">Sign in</a>',
    );
  });
});

describe("admin and sheet guards", () => {
  test("separates admin and Game Master permissions", async () => {
    const adminCookie = await login("admin@example.local");
    const gmCookie = await login("gm@example.local");
    const playerCookie = await login("lynott@example.local");

    const adminPage = await app.request("/admin", { headers: { cookie: adminCookie } });
    const gmAdminPage = await app.request("/admin", { headers: { cookie: gmCookie } });
    const gmCampaignPage = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: gmCookie },
    });
    const playerCampaignPage = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: playerCookie },
    });
    const gmSheetWrite = await app.request(
      "/sheet/lynott/resources/resource_lynott_hit_points",
      {
        body: new URLSearchParams({ delta: "-1" }),
        headers: { cookie: gmCookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );
    const adminSheetWrite = await app.request(
      "/sheet/lynott/resources/resource_lynott_hit_points",
      { headers: { cookie: adminCookie }, method: "PATCH" },
    );

    expect(adminPage.status).toBe(200);
    expect(await adminPage.text()).toContain("Admin");
    expect(gmAdminPage.status).toBe(403);
    expect(gmCampaignPage.status).toBe(200);
    expect(await gmCampaignPage.text()).toContain("Rovnost Shadows");
    expect(playerCampaignPage.status).toBe(200);
    const playerCampaignHtml = await playerCampaignPage.text();
    expect(playerCampaignHtml).toContain("Factions Guide");
    expect(playerCampaignHtml).not.toContain("Add wiki page");
    expect(gmSheetWrite.status).toBe(200);
    expect(adminSheetWrite.status).toBe(403);
  });

  test("supports combined admin and campaign membership without admin play bypass", async () => {
    const adminCookie = await login("admin@example.local");
    const adminPlayerCookie = await login("admin.player@example.local");
    const adminGameMasterCookie = await login("admin.gm@example.local");

    const adminOnlyCampaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: adminCookie },
    });
    const adminPlayerAdmin = await app.request("/admin", {
      headers: { cookie: adminPlayerCookie },
    });
    const adminPlayerRoster = await app.request("/characters", {
      headers: { cookie: adminPlayerCookie },
    });
    const adminPlayerCampaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: adminPlayerCookie },
    });
    const adminGameMasterAdmin = await app.request("/admin", {
      headers: { cookie: adminGameMasterCookie },
    });
    const adminGameMasterCampaign = await app.request("/campaigns/rovnost-shadows", {
      headers: { cookie: adminGameMasterCookie },
    });
    const adminGameMasterNotes = await app.request("/sheet/lynott/tabs/notes", {
      headers: { cookie: adminGameMasterCookie },
    });

    expect(adminOnlyCampaign.status).toBe(403);
    expect(adminPlayerAdmin.status).toBe(200);
    expect(await adminPlayerAdmin.text()).toContain("Admin");
    expect(adminPlayerRoster.status).toBe(200);
    expect(await adminPlayerRoster.text()).toContain("Player roster");
    expect(adminPlayerCampaign.status).toBe(200);
    const adminPlayerCampaignHtml = await adminPlayerCampaign.text();
    expect(adminPlayerCampaignHtml).toContain("Factions Guide");
    expect(adminPlayerCampaignHtml).not.toContain("Add wiki page");
    expect(adminGameMasterAdmin.status).toBe(200);
    expect(adminGameMasterCampaign.status).toBe(200);
    expect(await adminGameMasterCampaign.text()).toContain("Add wiki page");
    expect(adminGameMasterNotes.status).toBe(200);
    expect(await adminGameMasterNotes.text()).toContain("Game Master notes");
  });

  test("prevents players from writing other users' sheets", async () => {
    runtime.database.run(
      "insert into characters (id, slug, owner_user_id, campaign_id, name, species, background, level, proficiency_bonus, armour_class, initiative, speed_ft, hit_point_max, hit_point_current) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "character_other",
        "other-character",
        "user_game_master",
        "campaign_rovnost_shadows",
        "Other Character",
        "Human",
        "Acolyte",
        1,
        2,
        10,
        0,
        30,
        8,
        8,
      ],
    );
    const playerCookie = await login("lynott@example.local");

    const ownSheet = await app.request(
      "/sheet/lynott/resources/resource_lynott_hit_points",
      {
        body: new URLSearchParams({ delta: "-1" }),
        headers: { cookie: playerCookie, "Content-Type": "application/x-www-form-urlencoded" },
        method: "PATCH",
      },
    );
    const otherSheet = await app.request("/sheet/character_other/resources/resource_lynott_hit_points", {
      headers: { cookie: playerCookie },
      method: "PATCH",
    });

    expect(ownSheet.status).toBe(200);
    expect(otherSheet.status).toBe(403);
  });

  test("lets admins create invites and password reset tokens", async () => {
    const adminCookie = await login("admin@example.local");
    const inviteResponse = await postForm(
      "/admin/invites",
      { email: "new.player@example.local", role: "player" },
      adminCookie,
      { Accept: "application/json" },
    );
    const invite = (await inviteResponse.json()) as { token: string };
    const resetResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { accept: "application/json", cookie: adminCookie },
      method: "POST",
    });
    const reset = (await resetResponse.json()) as { token: string };
    const readInvite = await app.request(`/admin/invites/${invite.token}`, {
      headers: { cookie: adminCookie },
    });
    const readReset = await app.request(`/admin/password-reset-tokens/${reset.token}`, {
      headers: { cookie: adminCookie },
    });

    expect(inviteResponse.status).toBe(201);
    expect(invite).toMatchObject({
      email: "new.player@example.local",
      inviteUrl: expect.stringContaining("/invites/"),
      role: "player",
    });
    expect(resetResponse.status).toBe(201);
    expect(reset).toMatchObject({
      resetUrl: expect.stringContaining("/password-reset/"),
      userId: "user_lynott_player",
    });
    expect(readInvite.status).toBe(200);
    expect(await readInvite.json()).toMatchObject({
      email: "new.player@example.local",
      role: "player",
    });
    expect(readReset.status).toBe(200);
    expect(await readReset.json()).toMatchObject({
      userId: "user_lynott_player",
    });
  });

  test("returns admin handoff links for browser invite and reset form submissions", async () => {
    const adminCookie = await login("admin@example.local");
    const inviteResponse = await postForm(
      "/admin/invites",
      { email: "browser.player@example.local", role: "player" },
      adminCookie,
    );
    const resetResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { cookie: adminCookie },
      method: "POST",
    });

    expect(inviteResponse.status).toBe(303);
    expect(inviteResponse.headers.get("location")).toContain("/admin?handoff=invite");
    expect(inviteResponse.headers.get("location")).toContain("browser.player%40example.local");
    expect(resetResponse.status).toBe(303);
    expect(resetResponse.headers.get("location")).toContain("/admin?handoff=password_reset");

    const inviteAdminPage = await app.request(inviteResponse.headers.get("location") ?? "", {
      headers: { cookie: adminCookie },
    });
    const inviteHtml = await inviteAdminPage.text();
    expect(inviteHtml).toContain("Invite ready");
    expect(inviteHtml).toContain("/invites/");
    expect(inviteHtml).toContain("Copy URL");
    expect(inviteHtml).toContain("does not send email");
  });

  test("uses the configured public base URL for admin handoff links", async () => {
    app = createApp({
      accountDelivery: {
        mode: "operator",
        publicBaseUrl: "https://campaign-ledger.example.com",
      },
      appName: "Campaign Ledger",
      authService: new AuthService({
        authRepository: runtime.repositories.authRepository,
        passwordService: new PasswordService(),
      }),
      sessionService: new SessionService({
        authRepository: runtime.repositories.authRepository,
        now: () => new Date("2026-05-16T12:00:00.000Z"),
        secret: "test-session-secret",
      }),
      ...runtime.repositories,
    });
    const adminCookie = await login("admin@example.local");
    const inviteResponse = await postForm(
      "/admin/invites",
      { email: "hosted.player@example.local", role: "player" },
      adminCookie,
      { Accept: "application/json" },
    );
    const resetResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { accept: "application/json", cookie: adminCookie },
      method: "POST",
    });

    expect(inviteResponse.status).toBe(201);
    expect(await inviteResponse.json()).toMatchObject({
      inviteUrl: expect.stringContaining("https://campaign-ledger.example.com/invites/"),
    });
    expect(resetResponse.status).toBe(201);
    expect(await resetResponse.json()).toMatchObject({
      resetUrl: expect.stringContaining("https://campaign-ledger.example.com/password-reset/"),
    });

    const browserInviteResponse = await postForm(
      "/admin/invites",
      { email: "browser.hosted@example.local", role: "player" },
      adminCookie,
    );
    const adminPage = await app.request(browserInviteResponse.headers.get("location") ?? "", {
      headers: { cookie: adminCookie },
    });
    const html = await adminPage.text();
    expect(html).toContain("https://campaign-ledger.example.com/invites/");
    expect(html).toContain("Operator delivery mode is active");
  });

  test("ignores external admin handoff URLs", async () => {
    const adminCookie = await login("admin@example.local");

    const externalResponse = await app.request(
      "/admin?handoff=invite&url=https%3A%2F%2Fevil.example%2Finvites%2Ftoken&email=browser.player%40example.local&role=player&expires=2026-05-28T12%3A00%3A00.000Z",
      {
        headers: { cookie: adminCookie },
      },
    );
    const malformedResponse = await app.request(
      "/admin?handoff=invite&url=http%3A%2F%2F%5Bbad&email=browser.player%40example.local&role=player&expires=2026-05-28T12%3A00%3A00.000Z",
      {
        headers: { cookie: adminCookie },
      },
    );
    const html = await externalResponse.text();
    const malformedHtml = await malformedResponse.text();

    expect(externalResponse.status).toBe(200);
    expect(html).not.toContain("Invite ready");
    expect(html).not.toContain("evil.example");
    expect(malformedResponse.status).toBe(200);
    expect(malformedHtml).not.toContain("Invite ready");
  });

  test("keeps admins from disabling themselves while allowing other admin status changes", async () => {
    const adminCookie = await login("admin@example.local");

    const selfDisable = await postForm(
      "/admin/users/user_site_admin/status",
      { status: "disabled" },
      adminCookie,
    );
    expect(selfDisable.status).toBe(400);
    expect(await selfDisable.text()).toBe("Cannot disable your own account");

    runtime.repositories.authRepository.createUser({
      capabilities: ["admin"],
      campaignRoles: [],
      displayName: "Backup Admin",
      email: "backup.admin@example.local",
      id: "user_backup_admin",
      passwordHash: new PasswordService().hashPassword("password123", "backup-admin"),
      role: "admin",
      status: "active",
    });
    const backupAdminCookie = await login("backup.admin@example.local");

    const disableOriginalAdmin = await postForm(
      "/admin/users/user_site_admin/status",
      { status: "disabled" },
      backupAdminCookie,
    );
    expect(disableOriginalAdmin.status).toBe(303);
    expect(runtime.repositories.authRepository.findUserById("user_site_admin")?.status).toBe(
      "disabled",
    );
  });

  test("lets invited users accept local invites", async () => {
    const adminCookie = await login("admin@example.local");
    const inviteResponse = await postForm(
      "/admin/invites",
      { email: "new.player@example.local", role: "player" },
      adminCookie,
      { Accept: "application/json" },
    );
    const invite = (await inviteResponse.json()) as { token: string };

    const accept = await postForm(`/invites/${invite.token}`, {
      displayName: "New Player",
      password: "new-password",
      passwordConfirmation: "new-password",
    });

    expect(accept.status).toBe(303);
    expect(accept.headers.get("location")).toBe("/login");

    const loginResponse = await postForm("/login", {
      email: "new.player@example.local",
      password: "new-password",
    });

    expect(loginResponse.status).toBe(303);
    expect(loginResponse.headers.get("set-cookie")).toContain("character_sheet_session=");
  });

  test("lets password reset token holders set a new password", async () => {
    const adminCookie = await login("admin@example.local");
    const resetResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { accept: "application/json", cookie: adminCookie },
      method: "POST",
    });
    const reset = (await resetResponse.json()) as { token: string };

    const useToken = await postForm(`/password-reset/${reset.token}`, {
      password: "new-password",
      passwordConfirmation: "new-password",
    });

    expect(useToken.status).toBe(303);
    expect(useToken.headers.get("location")).toBe("/login");

    const loginResponse = await postForm("/login", {
      email: "lynott@example.local",
      password: "new-password",
    });

    expect(loginResponse.status).toBe(303);
    expect(loginResponse.headers.get("set-cookie")).toContain("character_sheet_session=");
  });

  test("rejects invite and reset password confirmation mismatches with form errors", async () => {
    const adminCookie = await login("admin@example.local");
    const inviteResponse = await postForm(
      "/admin/invites",
      { email: "mismatch.player@example.local", role: "player" },
      adminCookie,
      { Accept: "application/json" },
    );
    const invite = (await inviteResponse.json()) as { token: string };
    const inviteMismatch = await postForm(`/invites/${invite.token}`, {
      displayName: "Mismatch Player",
      password: "one-password",
      passwordConfirmation: "another-password",
    });

    const resetResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { accept: "application/json", cookie: adminCookie },
      method: "POST",
    });
    const reset = (await resetResponse.json()) as { token: string };
    const resetMismatch = await postForm(`/password-reset/${reset.token}`, {
      password: "one-password",
      passwordConfirmation: "another-password",
    });

    expect(inviteMismatch.status).toBe(400);
    expect(await inviteMismatch.text()).toContain("Passwords do not match.");
    expect(resetMismatch.status).toBe(400);
    expect(await resetMismatch.text()).toContain("Passwords do not match.");
  });
});
