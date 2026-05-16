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
});
