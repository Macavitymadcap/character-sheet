#!/usr/bin/env bun
import { setTimeout as delay } from "node:timers/promises";
import { createApp } from "../src/app";
import { AuthService, PasswordService, SessionService } from "../src/auth";
import { createSqliteDatabase } from "../src/db";

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
const server = startServer();
const baseUrl = `http://127.0.0.1:${server.port}`;

try {
  await waitForHttp(`${baseUrl}/healthz`);
  const playerCookie = await login("lynott.player@example.local");
  const gmCookie = await login("gm@example.local");
  const adminCookie = await login("admin@example.local");

  await runPa11y("home", `${baseUrl}/`);
  await runPa11y("login", `${baseUrl}/login`);
  await runPa11y("sheet", `${baseUrl}/sheet/character_lynott_magulbisson`, playerCookie);
  await runPa11y("campaign", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie);
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

function startServer() {
  const requestedPort = getRequestedPort();

  try {
    return Bun.serve({
      fetch: app.fetch,
      hostname: "127.0.0.1",
      port: requestedPort ?? 0,
    });
  } catch (error) {
    if (requestedPort !== undefined && isAddressInUse(error)) {
      throw new Error(`Requested A11Y_PORT ${requestedPort} is already in use.`);
    }

    throw error;
  }
}

function getRequestedPort() {
  if (Bun.env.A11Y_PORT === undefined) return undefined;

  const port = Number(Bun.env.A11Y_PORT);
  if (!Number.isInteger(port) || port < 0) {
    throw new Error(`A11Y_PORT must be a non-negative integer, received: ${Bun.env.A11Y_PORT}`);
  }

  return port;
}

function isAddressInUse(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EADDRINUSE"
  );
}
