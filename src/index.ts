import { createApp } from "./app";
import { createSqliteDatabase } from "./db";

const port = Number(Bun.env.PORT ?? 3000);
const hostname = Bun.env.HOST ?? "0.0.0.0";
const databaseRuntime = createSqliteDatabase({
  path: Bun.env.DB_PATH ?? "character-sheet.sqlite3",
});
const app = createApp({
  appName: "Character Sheet",
  ...databaseRuntime.repositories,
});

export default {
  fetch: app.fetch,
  hostname,
  port,
};
