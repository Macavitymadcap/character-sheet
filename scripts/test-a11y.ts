#!/usr/bin/env bun
import { setTimeout as delay } from "node:timers/promises";
import { createApp } from "../src/app";
import { AuthService, PasswordService, SessionService } from "../src/auth";
import { createSqliteDatabase } from "../src/db";

const port = Number(Bun.env.A11Y_PORT ?? 3999);
const baseUrl = `http://127.0.0.1:${port}`;
const databaseRuntime = createSqliteDatabase({ path: ":memory:" });
const passwordService = new PasswordService();
const sessionService = new SessionService({
  authRepository: databaseRuntime.repositories.authRepository,
  secret: "a11y-session-secret",
});
const app = createApp({
  appName: "Character Sheet",
  authService: new AuthService({
    authRepository: databaseRuntime.repositories.authRepository,
    passwordService,
  }),
  sessionService,
  ...databaseRuntime.repositories,
});
const server = Bun.serve({
  fetch: app.fetch,
  hostname: "127.0.0.1",
  port,
});

try {
  await waitForHttp(`${baseUrl}/healthz`);
  const playerCookie = await login("lynott.player@example.local");
  const adminCookie = await login("admin@example.local");

  await runPa11y("login", `${baseUrl}/login`);
  await runPa11y("home", `${baseUrl}/`, playerCookie);
  await runPa11y("admin", `${baseUrl}/admin`, adminCookie);
} finally {
  server.stop(true);
  databaseRuntime.close();
}

async function login(email: string) {
  const response = await fetch(`${baseUrl}/login`, {
    body: new URLSearchParams({ email, password: "password123" }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    redirect: "manual",
  });
  const setCookie = response.headers.get("set-cookie");
  if (response.status !== 303 || !setCookie) {
    throw new Error(`Failed to log in ${email}: ${response.status}`);
  }

  return setCookie.split(";")[0] ?? "";
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

async function waitForHttp(url: string, attempts = 40, delayMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}

    await delay(delayMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}
