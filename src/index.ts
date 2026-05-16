import { createApp } from "./app";
import { AuthService, PasswordService, SessionService } from "./auth";
import { createSqliteDatabase } from "./db";

const port = Number(Bun.env.PORT ?? 3000);
const hostname = Bun.env.HOST ?? "0.0.0.0";
const databaseRuntime = createSqliteDatabase({
  path: Bun.env.DB_PATH ?? "character-sheet.sqlite3",
});
const passwordService = new PasswordService();
const app = createApp({
  appName: "Character Sheet",
  authService: new AuthService({
    authRepository: databaseRuntime.repositories.authRepository,
    passwordService,
  }),
  sessionService: new SessionService({
    authRepository: databaseRuntime.repositories.authRepository,
    secret: Bun.env.SESSION_SECRET ?? "local-development-session-secret",
  }),
  ...databaseRuntime.repositories,
});

export default {
  fetch: app.fetch,
  hostname,
  port,
};
