import { afterEach, describe, expect, test } from "bun:test";
import { createApp } from "./app";
import { createSqliteDatabase, type SqliteDatabaseRuntime } from "./db";

let runtime: SqliteDatabaseRuntime | undefined;

afterEach(() => {
  runtime?.close();
  runtime = undefined;
});

const createTestApp = (appName = "Test Character Sheet") => {
  runtime = createSqliteDatabase({ path: ":memory:" });

  return createApp({
    appName,
    ...runtime.repositories,
  });
};

describe("createApp", () => {
  test("can be constructed with test dependencies", () => {
    const app = createTestApp();

    expect(app.fetch).toBeFunction();
  });

  test("serves a health check", async () => {
    const app = createTestApp();
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("renders the home page as a full HTML document", async () => {
    const app = createTestApp("Character Sheet");
    const response = await app.request("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain("Character Sheet");
    expect(html).toContain("Lynott Magulbisson");
  });
});
