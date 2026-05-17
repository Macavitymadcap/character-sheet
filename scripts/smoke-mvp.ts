#!/usr/bin/env bun
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

    const playerCookie = await login(baseUrl, "lynott@example.local");
    await assertContains("player sheet", `${baseUrl}/sheet/lynott`, playerCookie, "Lynott Magulbisson");

    const hp = await requestText(`${baseUrl}/sheet/lynott/resources/resource_lynott_hit_points`, {
      body: new URLSearchParams({ delta: "-3" }),
      cookie: playerCookie,
      method: "PATCH",
    });
    assertResponse("damage hit points", hp.response, 200);
    assertBody("damage hit points", hp.body, "28 / 31");

    const note = await requestText(`${baseUrl}/sheet/lynott/notes/note_lynott_player`, {
      body: new URLSearchParams({ body: "MVP smoke note saved." }),
      cookie: playerCookie,
      method: "PATCH",
    });
    assertResponse("save player note", note.response, 200);
    assertBody("save player note", note.body, "MVP smoke note saved.");

    for (const tabId of mvpSmokeTabs) {
      await assertContains(
        `${tabId} tab`,
        `${baseUrl}/sheet/lynott/tabs/${tabId}`,
        playerCookie,
        `data-tab-id="${tabId}"`,
      );
    }

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

    const gmCookie = await login(baseUrl, "gm@example.local");
    await assertContains("campaign", `${baseUrl}/campaigns/rovnost-shadows`, gmCookie, "Rovnost Shadows");
    await assertContains("gm notes", `${baseUrl}/sheet/lynott/tabs/notes`, gmCookie, "Game Master notes");

    const adminCookie = await login(baseUrl, "admin@example.local");
    await assertContains("admin", `${baseUrl}/admin`, adminCookie, "Admin");

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
