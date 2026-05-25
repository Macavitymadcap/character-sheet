#!/usr/bin/env bun
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../src/app";
import { AuthService, PasswordService, SessionService } from "../src/auth";
import { createSqliteDatabase } from "../src/db";
import { backupHostedData, hostedBackupAssetSnapshotPath, hostedBackupManifestPath, prepareHostedData } from "./hosted-data";
import { checkHostedHealth } from "./hosted-health";

export const freshHostedRehearsalCoverage = [
  "file-backed SQLite prepare",
  "SRD import during prepare",
  "seed asset preparation",
  "readiness check",
  "admin invite handoff",
  "admin password reset handoff",
  "player sheet",
  "Game Master campaign",
  "rules detail",
  "image library",
  "protected seeded asset",
  "wiki page",
  "content import route",
  "hosted backup bundle",
] as const;

export async function runFreshHostedRehearsal() {
  const previousAssetRoot = process.env.CAMPAIGN_LEDGER_ASSET_ROOT;
  const previousBackupDir = process.env.HOSTED_BACKUP_DIR;
  const root = await mkdtemp(join(tmpdir(), "campaign-ledger-fresh-hosted-"));
  const databasePath = join(root, "data/character-sheet.sqlite3");
  const assetRoot = join(root, "data/assets");
  const backupDir = join(root, "data/backups");

  process.env.CAMPAIGN_LEDGER_ASSET_ROOT = assetRoot;
  process.env.HOSTED_BACKUP_DIR = backupDir;


  try {
    await prepareHostedData({ assetRoot, databasePath });

    const runtime = createSqliteDatabase({ path: databasePath, seed: false });
    const passwordService = new PasswordService();
    const sessionService = new SessionService({
      authRepository: runtime.repositories.authRepository,
      secret: "fresh-hosted-rehearsal-session-secret",
    });
    const app = createApp({
      accountDelivery: {
        mode: "operator",
        publicBaseUrl: "https://campaign-ledger.example.com",
      },
      appName: "Campaign Ledger",
      authService: new AuthService({
        authRepository: runtime.repositories.authRepository,
        passwordService,
      }),
      sessionService,
      ...runtime.repositories,
    });

    try {
      await checkHostedHealth("http://campaign-ledger.local/readyz", async (url, init) => {
        const parsed = new URL(url);
        return app.request(parsed.pathname, init);
      });

      const adminCookie = sessionService.createSession("user_site_admin").cookie;
      const gmCookie = sessionService.createSession("user_game_master").cookie;
      const playerCookie = sessionService.createSession("user_lynott_player").cookie;

      await assertContains(app, "player sheet", "/sheet/lynott", playerCookie, "Lynott Magulbisson");
      await assertContains(app, "gm campaign", "/campaigns/rovnost-shadows", gmCookie, "Rovnost Shadows");
      await assertContains(app, "rules detail", "/rules/spell/bless", "", "You bless up to three creatures");
      await assertContains(app, "image library", "/campaigns/rovnost-shadows/images", gmCookie, "Images");
      await assertContains(app, "wiki page", "/campaigns/rovnost-shadows/wiki/factions-guide", playerCookie, "Factions Guide");
      await assertContains(app, "content import route", "/campaigns/rovnost-shadows/imports", gmCookie, "Import");

      const asset = await requestAppText(app, "/campaigns/rovnost-shadows/assets/asset_skywright_sigil", {
        cookie: playerCookie,
      });
      assertResponse("protected seeded asset", asset.response, 200);
      const assetContentType = asset.response.headers.get("content-type") ?? "";
      if (!assetContentType.includes("image/png") && !assetContentType.includes("image/svg+xml")) {
        throw new Error(`Protected seeded asset returned ${assetContentType}.`);
      }

      const invite = await postForm(app, "/admin/invites", adminCookie, {
        email: "fresh.invitee@example.local",
        role: "player",
      });
      assertResponse("admin invite handoff", invite.response, 201);
      assertBody("admin invite handoff", invite.body, "https://campaign-ledger.example.com/invites/");

      const reset = await requestAppText(app, "/admin/users/user_lynott_player/password-reset", {
        cookie: adminCookie,
        headers: {
          Accept: "application/json",
        },
        method: "POST",
      });
      assertResponse("admin password reset handoff", reset.response, 201);
      assertBody("admin password reset handoff", reset.body, "https://campaign-ledger.example.com/password-reset/");
    } finally {
      runtime.close();
    }

    const backupPath = await backupHostedData({
      assetRoot,
      backupDir,
      databasePath,
      timestamp: new Date("2026-05-25T12:00:00.000Z"),
    });
    if ((await stat(backupPath)).size === 0) throw new Error("Fresh hosted backup was empty.");
    if (!(await stat(hostedBackupAssetSnapshotPath(backupPath))).isDirectory()) {
      throw new Error("Fresh hosted backup did not create an asset snapshot.");
    }
    await Bun.file(hostedBackupManifestPath(backupPath)).json();

    return {
      assetRoot,
      backupDir,
      databasePath,
    };
  } finally {
    if (previousAssetRoot === undefined) {
      delete process.env.CAMPAIGN_LEDGER_ASSET_ROOT;
    } else {
      process.env.CAMPAIGN_LEDGER_ASSET_ROOT = previousAssetRoot;
    }
    if (previousBackupDir === undefined) {
      delete process.env.HOSTED_BACKUP_DIR;
    } else {
      process.env.HOSTED_BACKUP_DIR = previousBackupDir;
    }
    await rm(root, { force: true, recursive: true });
  }
}

async function postForm(app: ReturnType<typeof createApp>, path: string, cookie: string, body: Record<string, string>) {
  return requestAppText(app, path, {
    body: new URLSearchParams(body),
    cookie,
    headers: {
      Accept: "application/json",
    },
    method: "POST",
  });
}

async function assertContains(
  app: ReturnType<typeof createApp>,
  label: string,
  path: string,
  cookie: string,
  expected: string,
) {
  const result = await requestAppText(app, path, { cookie });
  assertResponse(label, result.response, 200);
  assertBody(label, result.body, expected);
}

async function requestAppText(
  app: ReturnType<typeof createApp>,
  path: string,
  {
    body,
    cookie,
    headers,
    method = "GET",
  }: {
    body?: FormData | URLSearchParams;
    cookie?: string;
    headers?: Record<string, string>;
    method?: string;
  } = {},
) {
  const isUrlEncoded = body instanceof URLSearchParams;
  const response = await app.request(path, {
    body,
    headers: {
      ...headers,
      ...(cookie ? { cookie } : {}),
      ...(isUrlEncoded ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    method,
  });

  return {
    body: await response.text(),
    response,
  };
}

function assertResponse(label: string, response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`${label} returned ${response.status}; expected ${status}.`);
  }
}

function assertBody(label: string, body: string, expected: string) {
  if (!body.includes(expected)) {
    throw new Error(`${label} did not include "${expected}".`);
  }
}

if (import.meta.main) {
  await runFreshHostedRehearsal();
  console.log("Fresh hosted rehearsal complete.");
}
