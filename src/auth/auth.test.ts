import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { AuthService } from "./service";
import { PasswordService } from "./password";
import { SessionService } from "./sessions";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "../db";

let runtime: SqliteDatabaseRuntime;
let authService: AuthService;
let sessionService: SessionService;

beforeEach(() => {
  runtime = createSqliteDatabase({ path: ":memory:" });
  authService = new AuthService({
    authRepository: runtime.repositories.authRepository,
    passwordService: new PasswordService(),
  });
  sessionService = new SessionService({
    authRepository: runtime.repositories.authRepository,
    now: () => new Date("2026-05-16T12:00:00.000Z"),
    secret: "test-session-secret",
  });
});

afterEach(() => {
  runtime.close();
});

describe("PasswordService", () => {
  test("hashes and verifies passwords", () => {
    const passwordService = new PasswordService();
    const hash = passwordService.hashPassword("correct horse battery staple", "test-salt");

    expect(hash).toStartWith("pbkdf2$");
    expect(passwordService.verifyPassword("correct horse battery staple", hash)).toBeTrue();
    expect(passwordService.verifyPassword("wrong", hash)).toBeFalse();
  });
});

describe("AuthService", () => {
  test("verifies seeded local credentials", () => {
    const user = authService.verifyCredentials("lynott.player@example.local", "password123");

    expect(user).toMatchObject({
      email: "lynott.player@example.local",
      id: "user_lynott_player",
      role: "player",
    });
  });

  test("rejects missing users and wrong passwords", () => {
    expect(authService.verifyCredentials("missing@example.local", "password123")).toBeNull();
    expect(authService.verifyCredentials("lynott.player@example.local", "wrong")).toBeNull();
  });

  test("creates and reads invite tokens locally", () => {
    const invite = authService.createInvite({
      createdByUserId: "user_site_admin",
      email: "new.player@example.local",
      role: "player",
    });

    expect(invite.token).not.toBe("");
    expect(authService.readInvite(invite.token)).toMatchObject({
      createdByUserId: "user_site_admin",
      email: "new.player@example.local",
      role: "player",
    });
  });

  test("creates and reads password reset tokens locally", () => {
    const reset = authService.createPasswordResetToken({
      createdByUserId: "user_site_admin",
      userId: "user_lynott_player",
    });

    expect(reset.token).not.toBe("");
    expect(authService.readPasswordResetToken(reset.token)).toMatchObject({
      createdByUserId: "user_site_admin",
      userId: "user_lynott_player",
    });
  });
});

describe("SessionService", () => {
  test("creates signed session cookies and reads active sessions", () => {
    const created = sessionService.createSession("user_lynott_player");
    const session = sessionService.readSession(created.cookie);

    expect(created.cookie).toContain("character_sheet_session=");
    expect(created.cookie).toContain("HttpOnly");
    expect(session).toMatchObject({
      id: created.session.id,
      user: {
        id: "user_lynott_player",
        role: "player",
      },
    });
  });

  test("rejects expired sessions", () => {
    const created = sessionService.createSession("user_lynott_player", {
      expiresAt: new Date("2026-05-16T11:59:59.000Z"),
    });

    expect(sessionService.readSession(created.cookie)).toBeNull();
  });

  test("logs out sessions", () => {
    const created = sessionService.createSession("user_lynott_player");

    sessionService.logout(created.cookie);

    expect(sessionService.readSession(created.cookie)).toBeNull();
  });
});
