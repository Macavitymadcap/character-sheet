import { createApp } from "./app";
import { AuthService, PasswordService, SessionService } from "./auth";
import { createSqliteDatabase } from "./db";
import { resolveRuntimeConfig } from "./runtime";

const runtimeConfig = resolveRuntimeConfig();
const databaseRuntime = createSqliteDatabase({
  path: runtimeConfig.databasePath,
  seed: false,
});
const passwordService = new PasswordService();
const app = createApp({
  accountDelivery: runtimeConfig.accountDelivery,
  appName: "Campaign Ledger",
  authService: new AuthService({
    authRepository: databaseRuntime.repositories.authRepository,
    passwordService,
  }),
  sessionService: new SessionService({
    authRepository: databaseRuntime.repositories.authRepository,
    secret: runtimeConfig.sessionSecret,
  }),
  ...databaseRuntime.repositories,
});

export default {
  fetch: app.fetch,
  hostname: runtimeConfig.hostname,
  port: runtimeConfig.port,
};
