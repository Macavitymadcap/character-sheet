# Railway Hosted Rehearsal

This document covers the first Railway rehearsal deployment for the Character Sheet app. It keeps the current Bun, Hono, HTMX, and SQLite runtime shape intact while moving the process onto Railway.

## Service Setup

Create one Railway service from the GitHub repository and point it at the branch being rehearsed for `sheet-0030`. Railway reads `railway.json` from the repository root and uses Railpack to build the Bun app.

Use these service settings:

| Setting | Value |
| --- | --- |
| Build command | Railway default |
| Start command | `bun run start` |
| Healthcheck path | `/healthz` |
| Healthcheck timeout | `60` seconds |
| Restart policy | `ON_FAILURE`, up to `3` retries |

The app exposes `/healthz` without authentication and returns `200` with `{ "ok": true }` once the Hono app has booted. Railway's healthcheck should use this route before routing traffic to a new deployment.

## Environment Variables

Set these Railway variables for the rehearsal environment:

| Variable | Required | Rehearsal value | Notes |
| --- | --- | --- | --- |
| `PORT` | Railway-provided | Use Railway default | Railway injects the public listener port. The app falls back to `3000` only for local development. |
| `HOST` | Optional | `0.0.0.0` | The local default already binds all interfaces, which is suitable for Railway. |
| `DB_PATH` | Required | `/data/character-sheet.sqlite3` | Use a persistent volume mount for `/data` once `sheet-0033` defines the hosted SQLite posture. Until then, treat hosted data as disposable rehearsal data. |
| `SESSION_SECRET` | Required | Generate a long random value | Do not use the local development fallback in Railway. Rotating this signs everyone out. |
| `CHARACTER_SHEET_ASSET_ROOT` | Required when campaign images are used | `/data/assets` | Use the same persistent volume family as `DB_PATH`; `sheet-0035` will finalise hosted asset storage. |

Local development remains unchanged if these variables are omitted: `bun run dev` binds to `0.0.0.0:3000`, uses `character-sheet.sqlite3`, and stores assets under `data/assets`.

## Bootstrap And Start

For the first rehearsal deploy:

1. Attach or prepare the persistent storage path planned for `/data`.
2. Set the variables above in Railway.
3. Deploy the service from GitHub.
4. Confirm Railway reports `/healthz` as healthy.
5. Run the hosted seed/import workflow only after `sheet-0033` defines backup and reset rules.

Do not run local seed commands blindly against an existing hosted database. The current `bun run seed` command is safe for local development, but hosted data preservation is owned by `sheet-0033`.

## Local Verification

Before opening a deployment PR, run:

```bash
bun run verify
```

For a quick runtime check, start the app with hosted-style variables and hit the health endpoint:

```bash
PORT=3100 HOST=127.0.0.1 DB_PATH=:memory: SESSION_SECRET=local-check bun run start
curl -s http://127.0.0.1:3100/healthz
```

The response should be:

```json
{"ok":true}
```

## References

- [Railway config as code](https://docs.railway.com/config-as-code/reference)
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks)
