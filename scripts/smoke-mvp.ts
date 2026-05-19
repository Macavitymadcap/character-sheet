#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
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

if (import.meta.main) {
  await runMvpSmoke();
}

export async function runMvpSmoke() {
  const runtime = createInMemoryApp("Character Sheet", "mvp-smoke-session-secret");
  const server = await startLocalServer(runtime.app, { envName: "SMOKE_PORT" });
  const baseUrl = `http://127.0.0.1:${server.port}`;

  try {
    await waitForHttp(`${baseUrl}/healthz`);
    const rulesImport = await new RulesImportService(runtime.databaseRuntime.repositories.rulesSeedRepository)
      .importFromLocalSource("docs/rules/srd-5.1-fixtures");
    if (rulesImport.imported !== 15) {
      throw new Error(`SRD fixture import expected 15 rules, imported ${rulesImport.imported}.`);
    }

    const playerCookie = await login(baseUrl, "lynott@example.local");
    const miraCookie = await login(baseUrl, "mira@example.local");
    await assertContains("player sheet", `${baseUrl}/sheet/lynott`, playerCookie, "Lynott Magulbisson");
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
    await assertContains("rules browse", `${baseUrl}/rules?type=spell&level=1`, playerCookie, "Bless");
    await assertContains("rule detail", `${baseUrl}/rules/spell/bless`, playerCookie, "You bless up to three creatures");
    await assertContains("sheet rule link", `${baseUrl}/sheet/lynott/tabs/spellcasting`, playerCookie, "/rules/spell/mage-hand");

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

    const imageForm = new FormData();
    imageForm.set("title", "Smoke handout");
    imageForm.set("altText", "A tiny smoke-test sigil");
    imageForm.set("caption", "Generated by the smoke workflow.");
    imageForm.set("visibility", "player");
    imageForm.set("width", "1");
    imageForm.set("height", "1");
    imageForm.set("image", new File([new Uint8Array([137, 80, 78, 71])], "smoke.png", { type: "image/png" }));
    await mkdir(process.env.CHARACTER_SHEET_ASSET_ROOT ?? `${tmpdir()}/character-sheet-script-assets`, { recursive: true });
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

    const adminCookie = await login(baseUrl, "admin@example.local");
    await assertContains("admin", `${baseUrl}/admin`, adminCookie, "Admin");
    const invite = await requestText(`${baseUrl}/admin/invites`, {
      body: new URLSearchParams({ email: "smoke-player@example.local", role: "player" }),
      cookie: adminCookie,
      method: "POST",
    });
    assertResponse("admin invite creation", invite.response, 201);
    assertBody("admin invite creation", invite.body, "smoke-player@example.local");

    const reset = await requestText(`${baseUrl}/admin/users/user_mira_player/password-reset`, {
      cookie: adminCookie,
      method: "POST",
    });
    assertResponse("admin password reset preparation", reset.response, 201);
    assertBody("admin password reset preparation", reset.body, "user_mira_player");

    console.log("MVP smoke workflow complete.");
  } finally {
    server.stop(true);
    runtime.close();
  }
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
