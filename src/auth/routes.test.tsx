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
    appName: "Character Sheet",
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

const postForm = (path: string, body: Record<string, string>, cookie?: string) =>
  app.request(path, {
    body: new URLSearchParams(body),
    headers: {
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
    expect(response.headers.get("location")).toBe("/sheet/lynott");
    expect(response.headers.get("set-cookie")).toContain("character_sheet_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  test("rejects bad login attempts", async () => {
    const response = await postForm("/login", {
      email: "lynott@example.local",
      password: "wrong",
    });

    expect(response.status).toBe(401);
    expect(await response.text()).toContain("Invalid email or password.");
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
    expect(homeHtml).toContain('<a class="action-link" href="/sheet/lynott">Continue</a>');
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
    expect(playerCampaignPage.status).toBe(403);
    expect(gmSheetWrite.status).toBe(200);
    expect(adminSheetWrite.status).toBe(403);
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
    );
    const invite = (await inviteResponse.json()) as { token: string };
    const resetResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { cookie: adminCookie },
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
      role: "player",
    });
    expect(resetResponse.status).toBe(201);
    expect(reset).toMatchObject({
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
    );
    const invite = (await inviteResponse.json()) as { token: string };

    const accept = await postForm(`/invites/${invite.token}`, {
      displayName: "New Player",
      password: "new-password",
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
      headers: { cookie: adminCookie },
      method: "POST",
    });
    const reset = (await resetResponse.json()) as { token: string };

    const useToken = await postForm(`/password-reset/${reset.token}`, { password: "new-password" });

    expect(useToken.status).toBe(303);
    expect(useToken.headers.get("location")).toBe("/login");

    const loginResponse = await postForm("/login", {
      email: "lynott@example.local",
      password: "new-password",
    });

    expect(loginResponse.status).toBe(303);
    expect(loginResponse.headers.get("set-cookie")).toContain("character_sheet_session=");
  });
});
