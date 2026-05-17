#!/usr/bin/env bun
import { createInMemoryApp, login, startLocalServer, waitForHttp } from "./lib/local-app";

const runtime = createInMemoryApp("Character Sheet", "a11y-session-secret");
const server = await startLocalServer(runtime.app, { envName: "A11Y_PORT" });
const baseUrl = `http://127.0.0.1:${server.port}`;

try {
  await waitForHttp(`${baseUrl}/healthz`);
  const playerCookie = await login(baseUrl, "lynott@example.local");
  const gmCookie = await login(baseUrl, "gm@example.local");
  const adminCookie = await login(baseUrl, "admin@example.local");

  await runPa11y("home", `${baseUrl}/`);
  await runPa11y("login", `${baseUrl}/login`);
  await runPa11y("sheet", `${baseUrl}/sheet/lynott`, playerCookie);
  await runPa11y("logout", `${baseUrl}/logout`, playerCookie);
  await runPa11y("campaign", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie);
  await runPa11y("admin", `${baseUrl}/admin`, adminCookie);
} finally {
  server.stop(true);
  runtime.close();
}

async function runPa11y(label: string, url: string, cookie = "") {
  console.log(`Running Pa11y: ${label} (${url})`);
  const child = Bun.spawn(
    ["./node_modules/.bin/pa11y", url, "--config", "scripts/pa11y-config.cjs"],
    {
      env: {
        ...Bun.env,
        PA11Y_COOKIE: cookie,
      },
      stderr: "inherit",
      stdout: "inherit",
    },
  );
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(`Pa11y failed for ${label}`);
}
