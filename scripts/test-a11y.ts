#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { RulesImportService } from "../src/rules";
import { createInMemoryApp, login, startLocalServer, waitForHttp } from "./lib/local-app";

export const pa11yTargets = [
  { label: "home", path: "/", role: "public" },
  { label: "login", path: "/login", role: "public" },
  { label: "player roster", path: "/characters", role: "player" },
  { label: "sheet", path: "/sheet/lynott", role: "player" },
  { label: "rules", path: "/rules?type=spell&level=1", role: "player" },
  { label: "rule detail", path: "/rules/spell/bless", role: "player" },
  { label: "wiki", path: "/campaigns/rovnost-shadows/wiki/factions-guide", role: "player" },
  { label: "logout", path: "/logout", role: "player" },
  { label: "campaign", path: "/campaigns/rovnost-shadows", role: "game_master" },
  { label: "gm roster", path: "/campaigns/rovnost-shadows/characters", role: "game_master" },
  { label: "admin", path: "/admin", role: "admin" },
] as const;

if (import.meta.main) {
  const runtime = createInMemoryApp("Character Sheet", "a11y-session-secret");
  const server = await startLocalServer(runtime.app, { envName: "A11Y_PORT" });
  const baseUrl = `http://127.0.0.1:${server.port}`;

  try {
    await waitForHttp(`${baseUrl}/healthz`);
    await new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository)
      .importFromLocalSource("docs/rules/srd-5.1-fixtures");
    await writeSeedAssetPlaceholders();
    const playerCookie = await login(baseUrl, "lynott@example.local");
    const gmCookie = await login(baseUrl, "gm@example.local");
    const adminCookie = await login(baseUrl, "admin@example.local");
    const cookies = {
      admin: adminCookie,
      game_master: gmCookie,
      player: playerCookie,
      public: "",
    };

    for (const target of pa11yTargets) {
      await runPa11y(target.label, `${baseUrl}${target.path}`, cookies[target.role]);
    }
  } finally {
    server.stop(true);
    runtime.close();
  }
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

async function writeSeedAssetPlaceholders() {
  const root = process.env.CHARACTER_SHEET_ASSET_ROOT ?? `${tmpdir()}/character-sheet-script-assets`;
  const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="), (char) => char.charCodeAt(0));

  await mkdir(`${root}/campaigns/rovnost-shadows`, { recursive: true });
  await Bun.write(`${root}/campaigns/rovnost-shadows/skywright-sigil.png`, bytes);
}
