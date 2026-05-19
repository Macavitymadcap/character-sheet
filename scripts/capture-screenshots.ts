#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { RulesImportService } from "../src/rules";
import { createInMemoryApp, login, startLocalServer, waitForHttp } from "./lib/local-app";

export const sheetScreenshotTargets = [
  {
    fileName: "lynott-sheet-light.png",
    label: "Lynott sheet light",
    path: "/sheet/lynott",
    role: "player",
    theme: "light",
  },
  {
    fileName: "lynott-sheet-dark.png",
    label: "Lynott sheet dark",
    path: "/sheet/lynott",
    role: "player",
    theme: "dark",
  },
  {
    action: "edit-strength",
    fileName: "lynott-ability-edit-light.png",
    label: "Lynott ability edit light",
    path: "/sheet/lynott",
    role: "player",
    theme: "light",
  },
  {
    action: "edit-strength",
    fileName: "lynott-ability-edit-dark.png",
    label: "Lynott ability edit dark",
    path: "/sheet/lynott",
    role: "player",
    theme: "dark",
  },
  {
    fileName: "lynott-skills-light.png",
    label: "Lynott skills light",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "light",
  },
  {
    fileName: "lynott-skills-dark.png",
    label: "Lynott skills dark",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "dark",
  },
  {
    action: "edit-stealth",
    fileName: "lynott-skills-edit-light.png",
    label: "Lynott skills edit light",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "light",
  },
  {
    action: "edit-stealth",
    fileName: "lynott-skills-edit-dark.png",
    label: "Lynott skills edit dark",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "dark",
  },
  {
    action: "roll-stealth",
    capture: "viewport",
    fileName: "lynott-skills-roll-light.png",
    label: "Lynott skills roll light",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "light",
  },
  {
    action: "roll-stealth",
    capture: "viewport",
    fileName: "lynott-skills-roll-dark.png",
    label: "Lynott skills roll dark",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "dark",
  },
  {
    fileName: "lynott-background-faction.png",
    label: "Lynott background faction",
    path: "/sheet/lynott",
    role: "player",
    tabId: "background",
    theme: "light",
  },
  {
    fileName: "mira-partial-notes-light.png",
    label: "Mira partial notes light",
    path: "/sheet/mira-voss",
    role: "mira_player",
    tabId: "notes",
    theme: "light",
  },
  {
    fileName: "mira-partial-notes-dark.png",
    label: "Mira partial notes dark",
    path: "/sheet/mira-voss",
    role: "mira_player",
    tabId: "notes",
    theme: "dark",
  },
  {
    fileName: "player-roster.png",
    label: "Player roster",
    path: "/characters",
    role: "player",
    theme: "light",
  },
  {
    fileName: "player-roster-dark.png",
    label: "Player roster dark",
    path: "/characters",
    role: "player",
    theme: "dark",
  },
  {
    fileName: "admin-tables-light.png",
    label: "Admin tables light",
    path: "/admin",
    role: "admin",
    theme: "light",
  },
  {
    fileName: "admin-tables-dark.png",
    label: "Admin tables dark",
    path: "/admin",
    role: "admin",
    theme: "dark",
  },
  {
    fileName: "gm-campaign.png",
    label: "Game Master campaign",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "wiki-factions-image.png",
    label: "Wiki page with image",
    path: "/campaigns/rovnost-shadows/wiki/factions-guide",
    role: "player",
    theme: "light",
  },
  {
    fileName: "rules-spells.png",
    label: "Rules spell list",
    path: "/rules?type=spell&level=1",
    role: "player",
    theme: "light",
  },
  {
    fileName: "rules-bless.png",
    label: "Rules Bless detail",
    path: "/rules/spell/bless",
    role: "player",
    theme: "light",
  },
  {
    fileName: "lynott-edited-sheet.png",
    label: "Lynott edited sheet light",
    path: "/sheet/lynott",
    prepare: "edited-sheet",
    role: "player",
    theme: "light",
  },
  {
    fileName: "lynott-edited-sheet-dark.png",
    label: "Lynott edited sheet dark",
    path: "/sheet/lynott",
    prepare: "edited-sheet",
    role: "player",
    theme: "dark",
  },
] as const;

if (import.meta.main) {
  await captureSheetScreenshots();
}

export async function captureSheetScreenshots(
  outputDir = Bun.env.SCREENSHOT_DIR ?? "docs/pr-screenshots",
) {
  const runtime = createInMemoryApp("Character Sheet", "screenshots-session-secret");
  const server = await startLocalServer(runtime.app, { envName: "SCREENSHOT_PORT" });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  let browser: Browser | undefined;

  try {
    await waitForHttp(`${baseUrl}/healthz`);
    await mkdir(outputDir, { recursive: true });
    await new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository)
      .importFromLocalSource("docs/rules/srd-5.1-fixtures");
    await writeSeedAssetPlaceholders();

    const playerCookie = await login(baseUrl, "lynott@example.local");
    const miraPlayerCookie = await login(baseUrl, "mira@example.local");
    const gmCookie = await login(baseUrl, "gm@example.local");
    const adminCookie = await login(baseUrl, "admin@example.local");
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ deviceScaleFactor: 1, height: 844, width: 390 });
    await setSessionCookie(page, baseUrl, playerCookie);

    for (const target of sheetScreenshotTargets) {
      const path = resolve(outputDir, target.fileName);
      const cookie = {
        admin: adminCookie,
        game_master: gmCookie,
        mira_player: miraPlayerCookie,
        player: playerCookie,
      }[target.role];

      if ("prepare" in target && target.prepare === "edited-sheet") {
        await prepareEditedSheet(baseUrl, playerCookie);
      }
      await setTheme(page, baseUrl, target.theme);
      await setSessionCookie(page, baseUrl, cookie);
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("main");
      if ("tabId" in target) {
        await page.waitForSelector("#sheet-header");
        await page.waitForSelector('#sheet-tab-panel[data-tab-id="core"]');
        await page.click(`#sheet-tab-${target.tabId}`);
        await page.waitForSelector(`#sheet-tab-panel[data-tab-id="${target.tabId}"]`);
      }
      if ("action" in target) await runScreenshotAction(page, target.action);
      await page.screenshot({ fullPage: !("capture" in target && target.capture === "viewport"), path });

      console.log(`${target.label}: ${path}`);
    }
  } finally {
    await browser?.close();
    server.stop(true);
    runtime.close();
  }
}

async function runScreenshotAction(
  page: Page,
  action: "edit-stealth" | "edit-strength" | "roll-stealth",
) {
  if (action === "edit-strength") {
    await page.click('button[aria-label="Edit Strength score and save"]');
    await page.waitForSelector("#ability-row-strength form");
    return;
  }

  if (action === "edit-stealth") {
    await page.click('button[aria-label="Edit Stealth training"]');
    await page.waitForSelector("#skill-row-stealth form");
    return;
  }

  await page.click('button[aria-label="Roll Stealth"]');
  await page.waitForSelector("#skill-stealth-roller:popover-open");
  await page.click("#skill-stealth-roller button[type='submit']");
  await page.waitForFunction(
    `document.querySelector("#skill-stealth-result")?.textContent?.includes("Stealth: d20")`,
  );
}

async function setSessionCookie(page: Page, baseUrl: string, cookie: string) {
  const [name, value] = cookie.split("=");
  if (!name || !value) throw new Error("Could not parse login cookie for screenshots.");

  await page.setCookie({ name, url: baseUrl, value });
}

async function setTheme(page: Page, baseUrl: string, theme: "dark" | "light") {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((nextTheme) => {
    const storage = (globalThis as {
      localStorage?: { setItem: (key: string, value: string) => void };
    }).localStorage;

    storage?.setItem("character-sheet-theme", nextTheme);
  }, theme);
}

async function prepareEditedSheet(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/sheet/lynott/summary`, {
    body: new URLSearchParams({
      background: "Faction-touched artisan",
      className: "Artificer",
      hitPointMax: "31",
      initiative: "2",
      level: "4",
      name: "Lynott Magulbisson",
      proficiencyBonus: "2",
      species: "Hobgoblin",
      speedFeet: "30",
      subclassName: "Artillerist",
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    method: "PATCH",
  });
  if (!response.ok) throw new Error(`Could not prepare edited sheet screenshot: ${response.status}`);
}

async function writeSeedAssetPlaceholders() {
  const root = process.env.CHARACTER_SHEET_ASSET_ROOT ?? `${tmpdir()}/character-sheet-script-assets`;
  const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="), (char) => char.charCodeAt(0));
  const storageKeys = [
    "cover.png",
    "magister-vallen.png",
    "faction-sigils.png",
    "astril-map.webp",
    "skywright-sigil.png",
  ];

  await mkdir(`${root}/campaigns/rovnost-shadows`, { recursive: true });
  for (const key of storageKeys) {
    await Bun.write(`${root}/campaigns/rovnost-shadows/${key}`, bytes);
  }
}
