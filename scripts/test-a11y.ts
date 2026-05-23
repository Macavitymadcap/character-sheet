#!/usr/bin/env bun
import { runPa11y, runPa11yTargets } from "@macavitymadcap/hyper-dank-automation";
import { writeSeedAssetPlaceholders } from "../src/assets";
import { RulesImportService } from "../src/rules";
import { createInMemoryApp, login, startLocalServer, waitForHttp } from "./lib/local-app";

export const pa11yTargets = [
  { label: "home", path: "/", role: "public" },
  { label: "login", path: "/login", role: "public" },
  { label: "local characters", path: "/local/characters", role: "public" },
  { label: "local campaigns", path: "/local/campaigns", role: "public" },
  { label: "player roster", path: "/characters", role: "player" },
  { label: "sheet", path: "/sheet/lynott", role: "player" },
  { label: "rules", path: "/rules?type=spell&level=1", role: "public" },
  { label: "rule detail", path: "/rules/spell/bless", role: "public" },
  { label: "wiki", path: "/campaigns/rovnost-shadows/wiki/factions-guide", role: "player" },
  { label: "player npcs", path: "/campaigns/rovnost-shadows/npcs", role: "player" },
  { label: "player images", path: "/campaigns/rovnost-shadows/images", role: "player" },
  { label: "logout", path: "/logout", role: "player" },
  { label: "campaign", path: "/campaigns/rovnost-shadows", role: "game_master" },
  { label: "gm prep", path: "/campaigns/rovnost-shadows/prep", role: "game_master" },
  { label: "gm player preview", path: "/campaigns/rovnost-shadows/preview/player", role: "game_master" },
  { label: "gm npcs", path: "/campaigns/rovnost-shadows/npcs", role: "game_master" },
  { label: "gm npc detail", path: "/campaigns/rovnost-shadows/npcs/magister-vallen", role: "game_master" },
  { label: "gm images", path: "/campaigns/rovnost-shadows/images", role: "game_master" },
  { label: "gm image detail", path: "/campaigns/rovnost-shadows/images/asset_magister_vallen", role: "game_master" },
  { label: "gm imports", path: "/campaigns/rovnost-shadows/imports", role: "game_master" },
  { label: "gm roster", path: "/campaigns/rovnost-shadows/characters", role: "game_master" },
  { label: "admin", path: "/admin", role: "admin" },
] as const;

if (import.meta.main) {
  const runtime = createInMemoryApp("Campaign Ledger", "a11y-session-secret");
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

    await runPa11yTargets(
      pa11yTargets.map((target) => ({
        cookie: cookies[target.role],
        name: target.label,
        path: target.path,
      })),
      {
        baseUrl,
        configPath: "scripts/pa11y-config.cjs",
        executable: "./node_modules/.bin/pa11y",
        runner: async (url, options) => {
          const label = pa11yTargets.find((target) => `${baseUrl}${target.path}` === url)?.label ?? url;
          console.log(`Running Pa11y: ${label} (${url})`);
          await runPa11y(url, options);
        },
        stdio: "inherit",
      },
    );
  } finally {
    server.stop(true);
    runtime.close();
  }
}
