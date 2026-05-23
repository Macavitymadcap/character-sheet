#!/usr/bin/env bun
import { writeSeedAssetPlaceholders } from "../src/assets";
import { RulesImportService } from "../src/rules";
import { createInMemoryApp, login, requestText, startLocalServer, waitForHttp } from "./lib/local-app";

export const mvpSmokeTabs = [
  "core",
  "skills",
  "actions",
  "spellcasting",
  "features",
  "equipment",
  "background",
  "notes",
] as const;

export const operatorSmokePaths = ["/invites/<token>", "/password-reset/<token>"] as const;

export const hostedRehearsalSmokeCoverage = [
  "seeded sign-in",
  "player roster character creation",
  "sheet tabs",
  "SRD rules browsing",
  "public local play storage import/export",
  "campaign sessions",
  "campaign wiki",
  "campaign content import",
  "combined admin campaign access",
  "campaign private rules sources",
  "rule mechanics and sheet disclosures",
  "protected seeded assets",
  "image upload",
  "admin invite handoff",
  "admin password reset handoff",
  "logout protection",
] as const;

export async function runMvpSmoke() {
  const runtime = createInMemoryApp("Campaign Ledger", "mvp-smoke-session-secret");
  const server = await startLocalServer(runtime.app, { envName: "SMOKE_PORT" });
  const baseUrl = `http://127.0.0.1:${server.port}`;

  try {
    await waitForHttp(`${baseUrl}/healthz`);
    const rulesImport = await new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository)
      .importFromLocalSource("docs/rules/srd-5.1");
    if (rulesImport.imported < 2000) {
      throw new Error(`SRD import expected full corpus, imported ${rulesImport.imported}.`);
    }
    const privateRulesImport = await new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository)
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
    if (privateRulesImport.imported !== 1) {
      throw new Error(`Private rules import expected 1 rule, imported ${privateRulesImport.imported}.`);
    }
    const sheetRulesImporter = new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository);
    const srdSource = {
      abbreviation: "SRD 5.1",
      contentCategory: "srd" as const,
      id: "rules_source_srd_5_1",
      name: "Systems Reference Document 5.1",
      precedence: 15,
      slug: "srd-5-1",
    };
    await sheetRulesImporter.importFromLocalSource("docs/rules/srd-5.1-fixtures/spells/level-1/bless.md");
    await sheetRulesImporter.importFromLocalSource("docs/rules/spells/level-0/mage-hand.md");
    for (const rulePath of [
      "docs/rules/spells/level-0/guidance.md",
      "docs/rules/spells/level-0/resistance.md",
      "docs/rules/spells/level-0/spare-the-dying.md",
      "docs/rules/spells/level-1/cure-wounds.md",
      "docs/rules/spells/level-1/detect-magic.md",
      "docs/rules/spells/level-1/purify-food-and-drink.md",
      "docs/rules/spells/level-1/sanctuary.md",
    ]) {
      await sheetRulesImporter.importFromLocalSource(rulePath, { publicExportEligible: true, source: srdSource });
    }
    await writeSeedAssetPlaceholders();

    const playerCookie = await login(baseUrl, "lynott@example.local");
    const miraCookie = await login(baseUrl, "mira@example.local");
    await assertContains("player sheet", `${baseUrl}/sheet/lynott`, playerCookie, "Lynott Magulbisson");
    await assertContains("mira sheet", `${baseUrl}/sheet/mira-voss`, miraCookie, "Mira Voss");
    await assertContains("mira spellcasting", `${baseUrl}/sheet/mira-voss/tabs/spellcasting`, miraCookie, "Cure Wounds");
    await assertContains("mira actions", `${baseUrl}/sheet/mira-voss/tabs/actions`, miraCookie, "Sanctuary");
    await assertContains("mira features", `${baseUrl}/sheet/mira-voss/tabs/features`, miraCookie, "Life Domain");
    await assertContains("mira equipment", `${baseUrl}/sheet/mira-voss/tabs/equipment`, miraCookie, "Shield with holy symbol");
    await assertContains("player roster", `${baseUrl}/characters`, playerCookie, "Player roster");

    const playerCreatedCharacter = await requestText(`${baseUrl}/characters`, {
      body: new URLSearchParams({
        background: "Verifier",
        className: "Rogue",
        hitPointMax: "18",
        level: "2",
        name: "Smoke Runner",
        species: "Human",
        subclassName: "Scout",
      }),
      cookie: playerCookie,
      method: "POST",
    });
    assertResponse("player character creation", playerCreatedCharacter.response, 303);
    const playerCreatedLocation = playerCreatedCharacter.response.headers.get("location");
    if (!playerCreatedLocation?.startsWith("/sheet/")) {
      throw new Error("Player-created character did not redirect to its sheet.");
    }
    await assertContains("player-created sheet", `${baseUrl}${playerCreatedLocation}`, playerCookie, "Smoke Runner");

    const hp = await requestText(`${baseUrl}/sheet/lynott/resources/resource_lynott_hit_points`, {
      body: new URLSearchParams({ delta: "-3" }),
      cookie: playerCookie,
      method: "PATCH",
    });
    assertResponse("damage hit points", hp.response, 200);
    assertBody("damage hit points", hp.body, "28 / 31");

    const sheetSummary = await requestText(`${baseUrl}/sheet/lynott/summary`, {
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
      cookie: playerCookie,
      method: "PATCH",
    });
    assertResponse("manual sheet edit", sheetSummary.response, 200);
    assertBody("manual sheet edit", sheetSummary.body, "Faction-touched artisan");

    const note = await requestText(`${baseUrl}/sheet/lynott/notes/note_lynott_player`, {
      body: new URLSearchParams({ body: "MVP smoke note saved.", title: "Player notes" }),
      cookie: playerCookie,
      method: "PATCH",
    });
    assertResponse("save player note", note.response, 200);
    assertBody("save player note", note.body, "MVP smoke note saved.");

    const faction = await requestText(`${baseUrl}/sheet/lynott/faction`, {
      body: new URLSearchParams({
        connectionNote: "Smoke coverage confirms faction selection.",
        factionId: "faction_tidebound",
      }),
      cookie: playerCookie,
      method: "PATCH",
    });
    assertResponse("faction selection", faction.response, 200);
    assertBody("faction selection", faction.body, "Smoke coverage confirms faction selection.");

    for (const tabId of mvpSmokeTabs) {
      await assertContains(
        `${tabId} tab`,
        `${baseUrl}/sheet/lynott/tabs/${tabId}`,
        playerCookie,
        `data-tab-id="${tabId}"`,
      );
    }
    await assertContains("public rules browse", `${baseUrl}/rules?type=spell&level=1`, "", "Bless");
    await assertContains("public rule detail", `${baseUrl}/rules/spell/bless`, "", "You bless up to three creatures");
    const publicPrivateRules = await requestText(`${baseUrl}/rules?q=special+operations`);
    assertResponse("public private rules search", publicPrivateRules.response, 200);
    if (publicPrivateRules.body.includes("Special Operations")) {
      throw new Error("Public rules search exposed a campaign-scoped private rule.");
    }
    await verifyLocalPlayBrowserStorage(baseUrl);
    await assertContains("signed-in rules browse", `${baseUrl}/rules?type=spell&level=1`, playerCookie, "Bless");
    await assertContains(
      "campaign private rules browse",
      `${baseUrl}/rules?q=special+operations`,
      playerCookie,
      "Special Operations",
    );
    await assertContains(
      "campaign private rule detail",
      `${baseUrl}/rules/background/special-operations`,
      playerCookie,
      "Campaign scoped",
    );
    await assertContains("sheet rule link", `${baseUrl}/sheet/lynott/tabs/spellcasting`, playerCookie, "/rules/spell/mage-hand");
    await assertContains(
      "sheet rule disclosure text",
      `${baseUrl}/sheet/lynott/tabs/spellcasting`,
      playerCookie,
      "A spectral, floating hand appears",
    );

    const logout = await requestText(`${baseUrl}/logout`, {
      cookie: playerCookie,
      method: "POST",
    });
    assertResponse("logout", logout.response, 303);
    if (logout.response.headers.get("location") !== "/") {
      throw new Error("Logout did not redirect home.");
    }
    const afterLogout = await requestText(`${baseUrl}/sheet/lynott`, { cookie: playerCookie });
    assertResponse("sheet after logout", afterLogout.response, 303);
    const returningPlayerCookie = await login(baseUrl, "lynott@example.local");

    const gmCookie = await login(baseUrl, "gm@example.local");
    await assertContains("campaign", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie, "Rovnost Shadows");
    await assertContains("campaign rules sources", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie, "Rovnost Private Notes");
    await assertContains("gm roster", `${baseUrl}/campaigns/rovnost-shadows/characters`, gmCookie, "Campaign roster");
    await assertContains("gm notes", `${baseUrl}/sheet/lynott/tabs/notes`, gmCookie, "Game Master notes");
    await assertContains("wiki read", `${baseUrl}/campaigns/rovnost-shadows/wiki/factions-guide`, returningPlayerCookie, "Factions Guide");

    const gmCreatedCharacter = await requestText(`${baseUrl}/campaigns/rovnost-shadows/characters`, {
      body: new URLSearchParams({
        background: "Factory witness",
        className: "Fighter",
        hitPointMax: "22",
        level: "3",
        name: "Mira Smokecheck",
        ownerUserId: "user_mira_player",
        species: "Dwarf",
        subclassName: "Battle Master",
      }),
      cookie: gmCookie,
      method: "POST",
    });
    assertResponse("gm character creation", gmCreatedCharacter.response, 303);
    const gmCreatedLocation = gmCreatedCharacter.response.headers.get("location");
    if (!gmCreatedLocation?.startsWith("/sheet/")) {
      throw new Error("Game Master-created character did not redirect to its sheet.");
    }
    await assertContains("gm-created player sheet", `${baseUrl}${gmCreatedLocation}`, miraCookie, "Mira Smokecheck");

    const session = await requestText(`${baseUrl}/campaigns/rovnost-shadows/sessions`, {
      body: new URLSearchParams({
        body: "Smoke workflow session body.",
        sessionDate: "2026-05-20",
        summary: "Smoke workflow session summary.",
        title: "Smoke Workflow Session",
        visibility: "player",
      }),
      cookie: gmCookie,
      method: "POST",
    });
    assertResponse("gm session creation", session.response, 303);
    await assertContains("gm session appears", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie, "Smoke Workflow Session");
    const seededAsset = await requestText(`${baseUrl}/campaigns/rovnost-shadows/assets/asset_skywright_sigil`, {
      cookie: returningPlayerCookie,
    });
    assertResponse("seeded campaign asset read", seededAsset.response, 200);
    const assetContentType = seededAsset.response.headers.get("content-type") ?? "";
    if (!assetContentType.includes("image/png") && !assetContentType.includes("image/svg+xml")) {
      throw new Error(`Seeded campaign asset used ${assetContentType}; expected image/png or image/svg+xml.`);
    }

    const imageForm = new FormData();
    imageForm.set("title", "Smoke handout");
    imageForm.set("altText", "A tiny smoke-test sigil");
    imageForm.set("caption", "Generated by the smoke workflow.");
    imageForm.set("visibility", "player");
    imageForm.set("width", "1");
    imageForm.set("height", "1");
    imageForm.set("image", new File([new Uint8Array([137, 80, 78, 71])], "smoke.png", { type: "image/png" }));
    const assetUpload = await requestText(`${baseUrl}/campaigns/rovnost-shadows/assets`, {
      body: imageForm,
      cookie: gmCookie,
      method: "POST",
    });
    assertResponse("gm image upload", assetUpload.response, 303);
    await assertContains("gm image appears", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie, "Smoke handout");

    const wiki = await requestText(`${baseUrl}/campaigns/rovnost-shadows/wiki`, {
      body: new URLSearchParams({
        bodyMarkdown: "# Smoke Wiki\n\n**Known for**\n\n- Verification routes",
        pageType: "lore",
        tags: "smoke, verification",
        title: "Smoke Wiki",
        visibility: "player",
      }),
      cookie: gmCookie,
      method: "POST",
    });
    assertResponse("gm wiki creation", wiki.response, 303);
    await assertContains("created wiki read", `${baseUrl}/campaigns/rovnost-shadows/wiki/smoke-wiki`, returningPlayerCookie, "Smoke Wiki");

    const importPreview = await requestText(`${baseUrl}/campaigns/rovnost-shadows/imports/preview`, {
      body: new URLSearchParams({
        content: "<h1>Smoke Import</h1><p>See https://docs.google.com/document/d/private/edit</p><p>Imported smoke clue.</p>",
        sourceFormat: "html",
        sourceReference: "smoke-export",
        sourceTitle: "Smoke import source",
        targetType: "wiki",
        visibility: "player",
      }),
      cookie: gmCookie,
      method: "POST",
    });
    assertResponse("gm import preview", importPreview.response, 200);
    assertBody("gm import preview", importPreview.body, "Private Google Drive or Docs links were removed");
    const importSave = await requestText(`${baseUrl}/campaigns/rovnost-shadows/imports/save`, {
      body: new URLSearchParams({
        conversionNotes: "Private Google Drive or Docs links were removed from the converted content.",
        convertedMarkdown: "# Smoke Import\n\nSee [private source link removed]\n\nImported smoke clue.",
        provider: "manual",
        sourceFormat: "html",
        sourceReference: "smoke-export",
        sourceTitle: "Smoke import source",
        targetType: "wiki",
        title: "Smoke Import",
        visibility: "player",
      }),
      cookie: gmCookie,
      method: "POST",
    });
    assertResponse("gm import save", importSave.response, 303);
    await assertContains("created import read", `${baseUrl}/campaigns/rovnost-shadows/wiki/smoke-import`, returningPlayerCookie, "Imported smoke clue.");

    const adminCookie = await login(baseUrl, "admin@example.local");
    await assertContains("admin", `${baseUrl}/admin`, adminCookie, "Admin");
    const adminCampaign = await requestText(`${baseUrl}/campaigns/rovnost-shadows`, {
      cookie: adminCookie,
    });
    assertResponse("admin-only campaign access", adminCampaign.response, 403);
    const adminPlayerCookie = await login(baseUrl, "admin.player@example.local");
    await assertContains("admin player admin", `${baseUrl}/admin`, adminPlayerCookie, "Admin");
    await assertContains("admin player roster", `${baseUrl}/characters`, adminPlayerCookie, "Player roster");
    const adminPlayerCampaign = await requestText(`${baseUrl}/campaigns/rovnost-shadows`, {
      cookie: adminPlayerCookie,
    });
    assertResponse("admin player campaign read", adminPlayerCampaign.response, 200);
    assertBody("admin player campaign read", adminPlayerCampaign.body, "Factions Guide");
    if (adminPlayerCampaign.body.includes("Add wiki page")) {
      throw new Error("Admin player unexpectedly saw Game Master campaign controls.");
    }
    const adminGameMasterCookie = await login(baseUrl, "admin.gm@example.local");
    await assertContains("admin gm admin", `${baseUrl}/admin`, adminGameMasterCookie, "Admin");
    await assertContains(
      "admin gm campaign manage",
      `${baseUrl}/campaigns/rovnost-shadows`,
      adminGameMasterCookie,
      "Add wiki page",
    );
    const invite = await requestText(`${baseUrl}/admin/invites`, {
      body: new URLSearchParams({ email: "smoke-player@example.local", role: "player" }),
      cookie: adminCookie,
      headers: { Accept: "application/json" },
      method: "POST",
    });
    assertResponse("admin invite creation", invite.response, 201);
    assertBody("admin invite creation", invite.body, "smoke-player@example.local");
    const inviteJson = JSON.parse(invite.body) as { token: string };
    await assertContains(
      "operator invite handoff page",
      `${baseUrl}/invites/${inviteJson.token}`,
      "",
      "Accept invite",
    );
    const inviteAccept = await requestText(`${baseUrl}/invites/${inviteJson.token}`, {
      body: new URLSearchParams({
        displayName: "Smoke Invited Player",
        password: "smoke-invite-password",
        passwordConfirmation: "smoke-invite-password",
      }),
      method: "POST",
    });
    assertResponse("operator invite acceptance", inviteAccept.response, 303);
    if (inviteAccept.response.headers.get("location") !== "/login") {
      throw new Error("Invite acceptance did not redirect to login.");
    }
    await login(baseUrl, "smoke-player@example.local", "smoke-invite-password");

    const reset = await requestText(`${baseUrl}/admin/users/user_mira_player/password-reset`, {
      cookie: adminCookie,
      headers: { Accept: "application/json" },
      method: "POST",
    });
    assertResponse("admin password reset preparation", reset.response, 201);
    assertBody("admin password reset preparation", reset.body, "user_mira_player");
    const resetJson = JSON.parse(reset.body) as { token: string };
    await assertContains(
      "operator password reset handoff page",
      `${baseUrl}/password-reset/${resetJson.token}`,
      "",
      "Reset password",
    );
    const resetUse = await requestText(`${baseUrl}/password-reset/${resetJson.token}`, {
      body: new URLSearchParams({
        password: "smoke-reset-password",
        passwordConfirmation: "smoke-reset-password",
      }),
      method: "POST",
    });
    assertResponse("operator password reset", resetUse.response, 303);
    if (resetUse.response.headers.get("location") !== "/login") {
      throw new Error("Password reset did not redirect to login.");
    }
    await login(baseUrl, "mira@example.local", "smoke-reset-password");

    console.log("MVP smoke workflow complete.");
  } finally {
    server.stop(true);
    runtime.close();
  }
}

async function verifyLocalPlayBrowserStorage(baseUrl: string) {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/local/characters`, { waitUntil: "domcontentloaded" });
    await page.type("#local-play-name", "Smoke Local");
    await page.type("#local-play-species", "Human");
    await page.type("#local-play-class", "Cleric");
    await page.click("#local-play-level", { count: 3 });
    await page.type("#local-play-level", "2");
    await page.type("#local-play-notes", "Browser-only character smoke note.");
    await page.click('button[type="submit"]');
    await page.waitForFunction('document.body.textContent?.includes("Smoke Local")');
    await page.click("[data-local-play-edit]");
    await page.waitForFunction('document.body.textContent?.includes("Editing Smoke Local.")');
    await page.evaluate('document.querySelector("#local-play-notes").value = ""');
    await page.type("#local-play-notes", "Browser-only character smoke note, edited.");
    await page.click('button[type="submit"]');
    await page.waitForFunction('document.body.textContent?.includes("edited.")');

    await page.goto(`${baseUrl}/local/campaigns`, { waitUntil: "domcontentloaded" });
    await page.type("#local-play-name", "Smoke Campaign");
    await page.type("#local-play-scene", "Testing the import table");
    await page.type("#local-play-notes", "Browser-only campaign smoke note.");
    await page.click('button[type="submit"]');
    await page.waitForFunction('document.body.textContent?.includes("Smoke Campaign")');
    await page.click("[data-local-play-export]");
    await page.waitForFunction('document.body.textContent?.includes("Export prepared as a JSON file.")');

    const exportedValue = await page.evaluate('localStorage.getItem("campaign-ledger.local-play.v1")');
    const exported = typeof exportedValue === "string" ? exportedValue : "";
    if (typeof exported !== "string" || exported.length === 0) {
      throw new Error("Local play smoke did not write browser storage.");
    }

    await page.evaluate('localStorage.removeItem("campaign-ledger.local-play.v1")');
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction('document.body.textContent?.includes("No local campaigns yet.")');
    await page.evaluate(fileImportScript(exported));
    await page.waitForFunction('document.body.textContent?.includes("Import complete.")');
    await page.waitForFunction('document.body.textContent?.includes("Smoke Campaign")');
    page.once("dialog", async (dialog) => {
      if (!dialog.message().includes("replace 2 records")) {
        throw new Error(`Unexpected local play import confirmation: ${dialog.message()}`);
      }
      await dialog.dismiss();
    });
    await page.evaluate(fileImportScript(exported));
    await page.waitForFunction('document.body.textContent?.includes("Import cancelled. Local data was not changed.")');

    await page.goto(`${baseUrl}/local/characters`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction('document.body.textContent?.includes("Smoke Local")');
    page.once("dialog", async (dialog) => {
      if (!dialog.message().includes("Delete Smoke Local")) {
        throw new Error(`Unexpected local play delete confirmation: ${dialog.message()}`);
      }
      await dialog.accept();
    });
    await page.click("[data-local-play-delete]");
    await page.waitForFunction('document.body.textContent?.includes("Smoke Local deleted from this browser.")');
    await page.waitForFunction('!document.body.textContent?.includes("Browser-only character smoke note, edited.")');

    await page.evaluate('localStorage.setItem("campaign-ledger.local-play.v1", "not-json")');
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.evaluate(fileImportScript("{}"));
    await page.waitForFunction(
      'document.body.textContent?.includes("Import is not a Campaign Ledger local-play export.")',
    );
  } finally {
    await browser.close();
  }
}

function fileImportScript(json: string) {
  return `
    (() => {
      const input = document.querySelector("[data-local-play-import]");
      if (!input) throw new Error("Local play import input was not found.");
      const transfer = new DataTransfer();
      transfer.items.add(new File([${JSON.stringify(json)}], "campaign-ledger-local-play.json", { type: "application/json" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    })()
  `;
}

async function assertContains(label: string, url: string, cookie: string, expected: string) {
  const result = await requestText(url, { cookie });
  assertResponse(label, result.response, 200);
  assertBody(label, result.body, expected);
}

function assertResponse(label: string, response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`${label} returned ${response.status}; expected ${status}.`);
  }
}

function assertBody(label: string, body: string, expected: string) {
  if (!body.includes(expected)) {
    throw new Error(`${label} did not include ${expected}.`);
  }
}

if (import.meta.main) {
  await runMvpSmoke();
}
