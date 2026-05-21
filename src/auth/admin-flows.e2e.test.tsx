import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../app";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "../db";
import { PasswordService } from "./password";
import { AuthService } from "./service";
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

const patchForm = (path: string, body: Record<string, string>, cookie?: string) =>
  app.request(path, {
    body: new URLSearchParams(body),
    headers: {
      ...(cookie ? { cookie } : {}),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "PATCH",
  });

const login = async (email: string, password = "password123") => {
  const response = await postForm("/login", { email, password });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error(`Expected login cookie for ${email}`);

  return cookie;
};

describe("admin flows (e2e)", () => {
  test("supports invite acceptance, password resets, and disabling accounts", async () => {
    const adminCookie = await login("admin@example.local");

    const inviteResponse = await postForm(
      "/admin/invites",
      { email: "new.player@example.local", role: "player" },
      adminCookie,
      { Accept: "application/json" },
    );
    expect(inviteResponse.status).toBe(201);
    const invite = (await inviteResponse.json()) as { token: string };

    const invitePage = await app.request(`/invites/${invite.token}`);
    expect(invitePage.status).toBe(200);
    expect(await invitePage.text()).toContain("Accept invite");

    const acceptInvite = await postForm(`/invites/${invite.token}`, {
      displayName: "New Player",
      password: "new-password",
      passwordConfirmation: "new-password",
    });
    expect(acceptInvite.status).toBe(303);

    await login("new.player@example.local", "new-password");

    const resetTokenResponse = await app.request("/admin/users/user_lynott_player/password-reset", {
      headers: { accept: "application/json", cookie: adminCookie },
      method: "POST",
    });
    expect(resetTokenResponse.status).toBe(201);
    const resetToken = (await resetTokenResponse.json()) as { token: string };

    const resetPage = await app.request(`/password-reset/${resetToken.token}`);
    expect(resetPage.status).toBe(200);
    expect(await resetPage.text()).toContain("Reset password");

    const useReset = await postForm(`/password-reset/${resetToken.token}`, {
      password: "lynott-new-password",
      passwordConfirmation: "lynott-new-password",
    });
    expect(useReset.status).toBe(303);

    await login("lynott@example.local", "lynott-new-password");

    const disable = await postForm("/admin/users/user_lynott_player/status", { status: "disabled" }, adminCookie);
    expect(disable.status).toBe(303);

    const disabledLogin = await postForm("/login", {
      email: "lynott@example.local",
      password: "lynott-new-password",
    });
    expect(disabledLogin.status).toBe(401);

    const reactivate = await postForm("/admin/users/user_lynott_player/status", { status: "active" }, adminCookie);
    expect(reactivate.status).toBe(303);

    const activeAgainLogin = await postForm("/login", {
      email: "lynott@example.local",
      password: "lynott-new-password",
    });
    expect(activeAgainLogin.status).toBe(303);

    const forbiddenPatch = await patchForm(
      "/sheet/lynott/resources/resource_lynott_hit_points",
      { delta: "-1" },
      adminCookie,
    );
    expect(forbiddenPatch.status).toBe(403);
  });
});
