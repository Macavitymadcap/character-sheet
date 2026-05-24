#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Browser, Page } from "puppeteer";
import { writeSeedAssetPlaceholders } from "../src/assets";
import { RulesImportService } from "../src/rules";
import { createInMemoryApp, login, startLocalServer, waitForHttp } from "./lib/local-app";

export const sheetScreenshotTargets = [
  {
    fileName: "home-public-light.png",
    label: "Public home light",
    path: "/",
    role: "public",
    theme: "light",
  },
  {
    fileName: "home-public-dark.png",
    label: "Public home dark",
    path: "/",
    role: "public",
    theme: "dark",
  },
  {
    action: "open-menu",
    fileName: "home-admin-player-menu-light.png",
    label: "Combined admin player menu light",
    path: "/",
    role: "admin_player",
    theme: "light",
  },
  {
    action: "open-menu",
    fileName: "home-admin-player-menu-dark.png",
    label: "Combined admin player menu dark",
    path: "/",
    role: "admin_player",
    theme: "dark",
  },
  {
    action: "scroll-local-list",
    fileName: "local-characters-light.png",
    label: "Local characters light",
    path: "/local/characters",
    prepare: "local-play",
    role: "public",
    theme: "light",
  },
  {
    action: "scroll-local-list",
    fileName: "local-campaigns-dark.png",
    label: "Local campaigns dark",
    path: "/local/campaigns",
    prepare: "local-play",
    role: "public",
    theme: "dark",
  },
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
    action: "edit-breastplate",
    fileName: "lynott-core-card-edit-light.png",
    label: "Lynott core card edit light",
    path: "/sheet/lynott",
    role: "player",
    theme: "light",
  },
  {
    action: "edit-breastplate",
    fileName: "lynott-core-card-edit-dark.png",
    label: "Lynott core card edit dark",
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
    action: "open-first-accordion",
    fileName: "lynott-spellcasting-rule-text-light.png",
    label: "Lynott spellcasting rule text light",
    path: "/sheet/lynott",
    role: "player",
    tabId: "spellcasting",
    theme: "light",
  },
  {
    action: "open-first-accordion",
    fileName: "lynott-spellcasting-rule-text-dark.png",
    label: "Lynott spellcasting rule text dark",
    path: "/sheet/lynott",
    role: "player",
    tabId: "spellcasting",
    theme: "dark",
  },
  {
    action: "open-first-accordion",
    fileName: "lynott-actions-rule-text-light.png",
    label: "Lynott actions rule text light",
    path: "/sheet/lynott",
    role: "player",
    tabId: "actions",
    theme: "light",
  },
  {
    action: "open-first-accordion",
    fileName: "lynott-actions-rule-text-dark.png",
    label: "Lynott actions rule text dark",
    path: "/sheet/lynott",
    role: "player",
    tabId: "actions",
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
    fileName: "lynott-skills-roll-light.png",
    label: "Lynott skills roll light",
    path: "/sheet/lynott",
    role: "player",
    tabId: "skills",
    theme: "light",
  },
  {
    action: "roll-stealth",
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
    action: "open-bless-accordion",
    fileName: "mira-spellcasting-light.png",
    label: "Mira spellcasting light",
    path: "/sheet/mira-voss",
    role: "mira_player",
    tabId: "spellcasting",
    theme: "light",
  },
  {
    action: "open-bless-accordion",
    fileName: "mira-spellcasting-dark.png",
    label: "Mira spellcasting dark",
    path: "/sheet/mira-voss",
    role: "mira_player",
    tabId: "spellcasting",
    theme: "dark",
  },
  {
    action: "scroll-roster-table",
    fileName: "player-roster.png",
    label: "Player roster",
    path: "/characters",
    role: "player",
    theme: "light",
  },
  {
    action: "scroll-roster-table",
    fileName: "player-roster-dark.png",
    label: "Player roster dark",
    path: "/characters",
    role: "player",
    theme: "dark",
  },
  {
    action: "scroll-admin-users",
    fileName: "admin-tables-light.png",
    label: "Admin tables light",
    path: "/admin",
    role: "admin",
    theme: "light",
  },
  {
    action: "scroll-admin-users",
    fileName: "admin-tables-dark.png",
    label: "Admin tables dark",
    path: "/admin",
    role: "admin",
    theme: "dark",
  },
  {
    fileName: "admin-invite-handoff-light.png",
    label: "Admin invite handoff light",
    path: "/admin?handoff=invite&url=%2Finvites%2Fscreenshot-token&email=screenshot.player%40example.local&role=player&expires=2026-05-28T12%3A00%3A00.000Z",
    role: "admin",
    theme: "light",
  },
  {
    fileName: "admin-invite-handoff-dark.png",
    label: "Admin invite handoff dark",
    path: "/admin?handoff=invite&url=%2Finvites%2Fscreenshot-token&email=screenshot.player%40example.local&role=player&expires=2026-05-28T12%3A00%3A00.000Z",
    role: "admin",
    theme: "dark",
  },
  {
    fileName: "gm-campaign-light.png",
    label: "Game Master campaign light",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-campaign-dark.png",
    label: "Game Master campaign dark",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-prep-workspace-light.png",
    label: "Game Master prep workspace light",
    path: "/campaigns/rovnost-shadows/prep",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-prep-workspace-dark.png",
    label: "Game Master prep workspace dark",
    path: "/campaigns/rovnost-shadows/prep",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-player-preview-light.png",
    label: "Game Master player preview light",
    path: "/campaigns/rovnost-shadows/preview/player",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-player-preview-dark.png",
    label: "Game Master player preview dark",
    path: "/campaigns/rovnost-shadows/preview/player",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-npc-list-light.png",
    label: "Game Master NPC list light",
    path: "/campaigns/rovnost-shadows/npcs",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-npc-list-dark.png",
    label: "Game Master NPC list dark",
    path: "/campaigns/rovnost-shadows/npcs",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "player-npc-list-light.png",
    label: "Player NPC list light",
    path: "/campaigns/rovnost-shadows/npcs",
    role: "player",
    theme: "light",
  },
  {
    fileName: "player-npc-list-dark.png",
    label: "Player NPC list dark",
    path: "/campaigns/rovnost-shadows/npcs",
    role: "player",
    theme: "dark",
  },
  {
    fileName: "gm-npc-detail-light.png",
    label: "Game Master NPC detail light",
    path: "/campaigns/rovnost-shadows/npcs/magister-vallen",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-npc-detail-dark.png",
    label: "Game Master NPC detail dark",
    path: "/campaigns/rovnost-shadows/npcs/magister-vallen",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-image-library-light.png",
    label: "Game Master image library light",
    path: "/campaigns/rovnost-shadows/images",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-image-library-dark.png",
    label: "Game Master image library dark",
    path: "/campaigns/rovnost-shadows/images",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-image-detail-light.png",
    label: "Game Master image detail light",
    path: "/campaigns/rovnost-shadows/images/asset_magister_vallen",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-image-detail-dark.png",
    label: "Game Master image detail dark",
    path: "/campaigns/rovnost-shadows/images/asset_magister_vallen",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-imports-light.png",
    label: "Game Master imports light",
    path: "/campaigns/rovnost-shadows/imports",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-imports-dark.png",
    label: "Game Master imports dark",
    path: "/campaigns/rovnost-shadows/imports",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "gm-google-docs-import-light.png",
    label: "Game Master Google Docs import light",
    path: "/campaigns/rovnost-shadows/imports/google-docs",
    role: "game_master",
    theme: "light",
  },
  {
    fileName: "gm-google-docs-import-dark.png",
    label: "Game Master Google Docs import dark",
    path: "/campaigns/rovnost-shadows/imports/google-docs",
    role: "game_master",
    theme: "dark",
  },
  {
    action: "scroll-campaign-assets",
    fileName: "gm-campaign-assets-light.png",
    label: "Game Master campaign assets light",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "light",
  },
  {
    action: "scroll-campaign-assets",
    fileName: "gm-campaign-assets-dark.png",
    label: "Game Master campaign assets dark",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "dark",
  },
  {
    action: "scroll-campaign-rules-sources",
    fileName: "gm-campaign-rules-sources-light.png",
    label: "Game Master campaign rules sources light",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "light",
  },
  {
    action: "scroll-campaign-rules-sources",
    fileName: "gm-campaign-rules-sources-dark.png",
    label: "Game Master campaign rules sources dark",
    path: "/campaigns/rovnost-shadows",
    role: "game_master",
    theme: "dark",
  },
  {
    fileName: "wiki-factions-image.png",
    label: "Wiki page with image",
    path: "/campaigns/rovnost-shadows/wiki/factions-guide",
    role: "player",
    theme: "light",
  },
  {
    action: "scroll-rules-results",
    fileName: "rules-spells.png",
    label: "Public rules spell list",
    path: "/rules?type=spell&level=1",
    role: "public",
    theme: "light",
  },
  {
    action: "scroll-rules-results",
    fileName: "rules-spells-dark.png",
    label: "Public rules spell list dark",
    path: "/rules?type=spell&level=1",
    role: "public",
    theme: "dark",
  },
  {
    action: "scroll-rule-detail",
    fileName: "rules-bless.png",
    label: "Public Rules Bless detail",
    path: "/rules/spell/bless",
    role: "public",
    theme: "light",
  },
  {
    action: "scroll-rule-detail",
    fileName: "rules-bless-dark.png",
    label: "Public Rules Bless detail dark",
    path: "/rules/spell/bless",
    role: "public",
    theme: "dark",
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

const targetViewport = {
  deviceScaleFactor: 1,
  height: 640,
  width: 360,
} as const;

export async function captureSheetScreenshots(
  outputDir = Bun.env.SCREENSHOT_DIR ?? "docs/pr-screenshots",
) {
  const runtime = createInMemoryApp("Campaign Ledger", "screenshots-session-secret");
  const server = await startLocalServer(runtime.app, { envName: "SCREENSHOT_PORT" });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  let browser: Browser | undefined;

  try {
    await waitForHttp(`${baseUrl}/healthz`);
    await mkdir(outputDir, { recursive: true });
    const rulesImporter = new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository);
    const srdSource = {
      abbreviation: "SRD 5.1",
      contentCategory: "srd" as const,
      id: "rules_source_srd_5_1",
      name: "Systems Reference Document 5.1",
      precedence: 15,
      slug: "srd-5-1",
    };
    await rulesImporter.importFromLocalSource("docs/rules/srd-5.1");
    await new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository)
      .importFromLocalSource("docs/rules/backgrounds/special-ops.md", {
        campaignId: "campaign_rovnost_shadows",
        source: {
          abbreviation: "Rovnost",
          contentCategory: "local",
          id: "rules_source_rovnost_private",
          name: "Rovnost Private Notes",
          slug: "rovnost-private",
        },
      });
    await rulesImporter.importFromLocalSource("docs/rules/srd-5.1-fixtures/spells/level-1/bless.md");
    await rulesImporter.importFromLocalSource("docs/rules/spells/level-0/mage-hand.md");
    await rulesImporter.importFromLocalSource("docs/rules/spells/level-1/absorb-elements.md");
    await rulesImporter.importFromLocalSource("docs/rules/spells/level-1/shield.md");
    for (const rulePath of [
      "docs/rules/spells/level-0/guidance.md",
      "docs/rules/spells/level-0/resistance.md",
      "docs/rules/spells/level-0/spare-the-dying.md",
      "docs/rules/spells/level-1/cure-wounds.md",
      "docs/rules/spells/level-1/detect-magic.md",
      "docs/rules/spells/level-1/purify-food-and-drink.md",
      "docs/rules/spells/level-1/sanctuary.md",
    ]) {
      await rulesImporter.importFromLocalSource(rulePath, { publicExportEligible: true, source: srdSource });
    }
    await writeSeedAssetPlaceholders();

    const playerCookie = await login(baseUrl, "lynott@example.local");
    const miraPlayerCookie = await login(baseUrl, "mira@example.local");
    const gmCookie = await login(baseUrl, "gm@example.local");
    const adminCookie = await login(baseUrl, "admin@example.local");
    const adminPlayerCookie = await login(baseUrl, "admin.player@example.local");
    const { default: puppeteer } = await import("puppeteer");
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport(targetViewport);
    await setSessionCookie(page, baseUrl, playerCookie);

    for (const target of sheetScreenshotTargets) {
      const path = resolve(outputDir, target.fileName);
      const cookie = {
        admin: adminCookie,
        admin_player: adminPlayerCookie,
        game_master: gmCookie,
        mira_player: miraPlayerCookie,
        player: playerCookie,
        public: "",
      }[target.role];

      if ("prepare" in target && target.prepare === "edited-sheet") {
        await prepareEditedSheet(baseUrl, playerCookie);
      } else if ("prepare" in target && target.prepare === "local-play") {
        await prepareLocalPlay(page, baseUrl);
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
      await page.screenshot({ fullPage: false, path });

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
  action:
    | "edit-breastplate"
    | "edit-stealth"
    | "edit-strength"
    | "open-bless-accordion"
    | "open-first-accordion"
    | "open-menu"
    | "roll-stealth"
    | "scroll-campaign-assets"
    | "scroll-campaign-rules-sources"
    | "scroll-local-list"
    | "scroll-admin-users"
    | "scroll-roster-table"
    | "scroll-rule-detail"
    | "scroll-rules-results",
) {
  if (action === "open-menu") {
    await page.click(".popover-menu-trigger");
    await page.waitForSelector("#site-menu-panel:popover-open");
    return;
  }

  if (action === "open-first-accordion") {
    await page.waitForSelector(".accordion-item summary");
    await scrollIntoView(page, ".accordion-item");
    await page.evaluate(`document.querySelector(".accordion-item")?.setAttribute("open", "")`);
    await page.waitForSelector(".accordion-item[open]");
    return;
  }

  if (action === "open-bless-accordion") {
    await page.waitForSelector("#spell-card-bless");
    await page.evaluate(`document.querySelector("#spell-card-bless")?.closest("details")?.setAttribute("open", "")`);
    await page.waitForFunction(`document.querySelector("#spell-card-bless")?.closest("details")?.hasAttribute("open")`);
    await page.evaluate(
      `document.querySelector("#spell-card-bless")?.closest("details")?.scrollIntoView({ block: "start", inline: "nearest" }); window.scrollBy(0, -320); window.scrollTo(0, window.scrollY)`,
    );
    return;
  }

  if (action === "scroll-admin-users") {
    await scrollIntoView(page, ".admin-users-cards");
    return;
  }

  if (action === "scroll-campaign-rules-sources") {
    await scrollIntoView(page, "#campaign-rules-sources-heading", -96);
    return;
  }

  if (action === "scroll-campaign-assets") {
    await scrollIntoView(page, ".campaign-asset-list", -96);
    return;
  }

  if (action === "scroll-local-list") {
    await scrollIntoView(page, "#local-play-list-heading", -72);
    return;
  }

  if (action === "scroll-roster-table") {
    await scrollIntoView(page, ".character-roster-cards");
    return;
  }

  if (action === "scroll-rule-detail") {
    await scrollIntoView(page, "#rule-detail-heading", -96);
    return;
  }

  if (action === "scroll-rules-results") {
    await scrollIntoView(page, "#rules-results-heading", -16);
    return;
  }

  if (action === "edit-strength") {
    await scrollIntoView(page, "#ability-row-strength");
    await page.click('button[aria-label="Edit Strength score and save"]');
    await page.waitForSelector("#ability-row-strength form");
    return;
  }

  if (action === "edit-breastplate") {
    await scrollIntoView(page, "#armour-card-ac_lynott_breastplate", -104);
    await page.evaluate(`(async () => {
      const response = await fetch("/sheet/lynott/armour/ac_lynott_breastplate/edit", { credentials: "same-origin" });
      const html = await response.text();
      const card = document.querySelector("#armour-card-ac_lynott_breastplate");
      if (card) card.outerHTML = html;
    })()`);
    await page.waitForSelector("#armour-card-ac_lynott_breastplate form");
    await scrollIntoView(page, "#armour-card-ac_lynott_breastplate", -410);
    return;
  }

  if (action === "edit-stealth") {
    await scrollIntoView(page, "#skill-row-stealth");
    await page.click('button[aria-label="Edit Stealth training"]');
    await page.waitForSelector("#skill-row-stealth form");
    return;
  }

  await scrollIntoView(page, "#skill-row-stealth");
  await page.click("#skill-row-stealth .dice-roller-trigger");
  await page.evaluate(`document.querySelector("#skill-stealth-roller")?.showPopover?.()`);
  await page.waitForSelector("#skill-stealth-roller:popover-open");
  await page.click("#skill-stealth-roller button[type='submit']");
  await page.waitForFunction(
    `document.querySelector("#skill-stealth-result")?.textContent?.includes("Stealth: d20")`,
  );
}

async function scrollIntoView(page: Page, selector: string, offset = -72) {
  await page.waitForSelector(selector);
  await page.evaluate(
    `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "start", inline: "nearest" }); window.scrollBy(0, ${offset}); window.scrollTo(0, window.scrollY)`,
  );
}

async function setSessionCookie(page: Page, baseUrl: string, cookie: string) {
  if (!cookie) {
    const { hostname } = new URL(baseUrl);
    await page.deleteCookie({ name: "character_sheet_session", domain: hostname, path: "/" });
    return;
  }

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

async function prepareLocalPlay(page: Page, baseUrl: string) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const now = "2026-05-21T12:00:00.000Z";
    const storage = (globalThis as {
      localStorage?: { setItem: (key: string, value: string) => void };
    }).localStorage;

    storage?.setItem("campaign-ledger.local-play.v1", JSON.stringify({
      campaigns: [
        {
          currentScene: "Clockwork lights over Rovnost",
          id: "local-campaign-screenshot",
          name: "Local Rovnost Notes",
          notes: "Track session beats here, then export before clearing browser data.",
          updatedAt: now,
        },
      ],
      characters: [
        {
          className: "Cleric",
          id: "local-character-screenshot",
          level: 3,
          name: "Mira Local",
          notes: "Bless prepared for the market crossing.",
          species: "Human",
          updatedAt: now,
        },
      ],
      exportedAt: now,
      metadata: { source: "browser-local" },
      schema: "campaign-ledger.local-play",
      version: 1,
    }));
  });
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

if (import.meta.main) {
  await captureSheetScreenshots();
}
