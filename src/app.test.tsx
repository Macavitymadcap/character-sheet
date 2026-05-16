import { describe, expect, test } from "bun:test";
import { createApp } from "./app";

describe("createApp", () => {
  test("can be constructed with test dependencies", () => {
    const app = createApp({ appName: "Test Character Sheet" });

    expect(app.fetch).toBeFunction();
  });

  test("serves a health check", async () => {
    const app = createApp({ appName: "Test Character Sheet" });
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("renders the home page as a full HTML document", async () => {
    const app = createApp({ appName: "Character Sheet" });
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
