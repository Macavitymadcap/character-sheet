# Railway Hosted Rehearsal

This document covers the first Railway rehearsal deployment for the Campaign Ledger app. It keeps the current Bun, Hono, HTMX, and SQLite runtime shape intact while moving the process onto Railway.

## Service Setup

Create one Railway service from the GitHub repository and point it at the branch being rehearsed for `sheet-0030`. Railway reads `railway.json` from the repository root and uses Railpack to build the Bun app.

Use these service settings:

| Setting | Value |
| --- | --- |
| Build command | Railway default |
| Start command | `bun run start` |
| Healthcheck path | `/readyz` |
| Healthcheck timeout | `60` seconds |
| Restart policy | `ON_FAILURE`, up to `3` retries |

The app exposes `/healthz` without authentication as a boot ping and `/readyz` without authentication as the hosted readiness boundary. Railway should use `/readyz`; it returns `200` only when the app can query its SQLite repositories and write to the configured campaign asset root.

## Environment Variables

Set these Railway variables for the rehearsal environment:

| Variable | Required | Rehearsal value | Notes |
| --- | --- | --- | --- |
| `PORT` | Railway-provided | Use Railway default | Railway injects the public listener port. The app falls back to `3000` only for local development. |
| `HOST` | Optional | `0.0.0.0` | The local default already binds all interfaces, which is suitable for Railway. |
| `DB_PATH` | Required | `/data/character-sheet.sqlite3` | Mount a persistent Railway volume at `/data` and keep the SQLite database there. |
| `SESSION_SECRET` | Required | Generate a long random value | Do not use the local development fallback in Railway. Rotating this signs everyone out. |
| `CAMPAIGN_LEDGER_ASSET_ROOT` | Required | `/data/assets` | Stores app-managed campaign images on the persistent Railway volume. Keep it under `/data`, separate from `DB_PATH`. |
| `CHARACTER_SHEET_ASSET_ROOT` | Optional | Existing value only | Compatibility alias for existing deployments; the renamed variable takes precedence when both are set. |
| `HOSTED_BACKUP_DIR` | Optional | `/data/backups` | Used by the hosted backup command. |
| `HOSTED_PERSISTENCE_MODE` | Optional | `sqlite-volume` | Documents the accepted hosted storage mode. Other values are rejected until a migration ticket changes the persistence boundary. |
| `ACCOUNT_DELIVERY_MODE` | Optional | `operator` | Documents the accepted invite and password-reset delivery mode. Other values are rejected until a planned email provider ticket changes the boundary. |
| `PUBLIC_BASE_URL` | Required for production readiness | Your Railway public URL or custom domain | Used to generate admin invite and password-reset handoff links with the canonical hosted origin. |

Local development remains unchanged if these variables are omitted: `bun run dev` binds to `0.0.0.0:3000`, uses `character-sheet.sqlite3`, and stores assets under `data/assets`. App startup applies schema bootstrap only; seeding is an explicit operation.

The hosted persistence decision is recorded in [Hosted Persistence Decision](../operations/hosted-persistence.md). `sqlite-volume` remains the accepted production-readiness boundary for this private campaign app; Postgres needs a planned migration and rollback path before it becomes a valid hosted mode.

The hosted account delivery decision is recorded in [Hosted Account Operator Runbook](../operations/hosted-account-runbook.md). `operator` remains the accepted production-readiness boundary for this private campaign app; production email delivery needs a planned provider, secret, template, and rollback path before it becomes a valid account delivery mode.

## Asset Storage

Hosted campaign images use the same Railway volume as the SQLite database, but a separate directory: set `CAMPAIGN_LEDGER_ASSET_ROOT=/data/assets`. Existing deployments that still set `CHARACTER_SHEET_ASSET_ROOT` continue to work until the variable is renamed. Uploaded files are copied into app-managed relative keys such as `campaigns/rovnost-shadows/<uuid>.png`; the database never stores a source-machine absolute path.

The first rehearsal does not use object storage or an external CDN. This keeps the deployment small and makes backup expectations clear: back up `/data/character-sheet.sqlite3` and the `/data/assets` directory together. Seeded campaign image records are created by the database seed, and `bun run hosted:data -- prepare` also writes deterministic tiny placeholder files for those seeded keys so hosted pages render images even before final campaign art is uploaded. If a seeded file is missing, the protected asset route serves a readable SVG fallback instead of a broken image.

## Bootstrap And Start

For the first rehearsal deploy:

1. Attach or prepare the persistent storage path planned for `/data`.
2. Set the variables above in Railway.
3. Run `bun run hosted:data -- prepare` once against an empty `DB_PATH` to create the schema, seed the group data, and write seeded campaign asset placeholders under `CAMPAIGN_LEDGER_ASSET_ROOT`.
4. Deploy the service from GitHub.
5. Confirm Railway reports `/readyz` as healthy.

Normal app startup does not seed data or rewrite asset files. This prevents a deployment restart from rewriting existing hosted records or uploaded images. Use `bun run hosted:data -- migrate` when you need to apply idempotent schema bootstrap without touching seed rows.

## Backup And Restore

Create a backup before any hosted seed, import, or manual recovery operation:

```bash
bun run hosted:data -- backup
```

By default backups are written under `HOSTED_BACKUP_DIR` or `data/backups` with a timestamped filename. On Railway, set `HOSTED_BACKUP_DIR=/data/backups` so backups stay on the attached volume. Each backup creates three operator evidence artifacts:

- `character-sheet-<timestamp>.sqlite3`, created with SQLite `VACUUM INTO`.
- `character-sheet-<timestamp>-assets/`, a recursive snapshot of `CAMPAIGN_LEDGER_ASSET_ROOT`.
- `character-sheet-<timestamp>.manifest.json`, recording the database path, asset root, snapshot path, file count, byte count, persistence mode, and timestamp.

Restore from a named backup with an explicit replacement confirmation:

```bash
HOSTED_RESTORE_SOURCE=/data/backups/character-sheet-2026-05-19T193000Z.sqlite3 \
HOSTED_DATA_CONFIRM=replace \
bun run hosted:data -- restore
```

The restore command copies the backup to a temporary file and then renames it over `DB_PATH`. It refuses to run without `HOSTED_DATA_CONFIRM=replace`.
When a matching `-assets` snapshot exists beside the SQLite backup, restore also replaces `CAMPAIGN_LEDGER_ASSET_ROOT` from that snapshot. This keeps uploaded campaign images aligned with the restored database records. Set `CAMPAIGN_LEDGER_ASSET_ROOT` before restoring if the hosted asset root differs from the environment default.

## Reseeding Or Resetting

`bun run hosted:data -- prepare` refuses to seed over a non-empty database by default. For a deliberate reset:

1. Run `bun run hosted:data -- backup`.
2. Confirm the backup file exists under `/data/backups`.
3. Set `HOSTED_DATA_CONFIRM=seed-existing`.
4. Run `bun run hosted:data -- prepare`.

This reseeds the known baseline records and may update seeded users, characters, campaign wiki, sessions, factions, resources, and notes. Do not use it as part of normal deploy startup.

## Local Verification

Before opening a deployment PR, run:

```bash
bun run verify
```

For a quick runtime check, start the app with hosted-style variables and hit the health endpoint:

```bash
PORT=3100 HOST=127.0.0.1 DB_PATH=:memory: SESSION_SECRET=local-check bun run start
curl -s http://127.0.0.1:3100/readyz
```

The response should be:

```json
{"checks":{"assets":true,"database":true},"ok":true}
```

After a Railway deployment has a public URL, run the operator readiness check:

```bash
bun run hosted:check -- https://your-railway-domain.example
```

The script calls `/readyz` by default and fails if either the database or asset-root check is not healthy.

For a local hosted-data rehearsal:

```bash
DB_PATH=/tmp/character-sheet-hosted.sqlite3 bun run hosted:data -- status
DB_PATH=/tmp/character-sheet-hosted.sqlite3 bun run hosted:data -- prepare
DB_PATH=/tmp/character-sheet-hosted.sqlite3 HOSTED_BACKUP_DIR=/tmp/character-sheet-backups bun run hosted:data -- backup
HOSTED_RESTORE_SOURCE=/tmp/character-sheet-backups/character-sheet-<timestamp>.sqlite3 HOSTED_DATA_CONFIRM=replace DB_PATH=/tmp/character-sheet-hosted.sqlite3 bun run hosted:data -- restore
DB_PATH=/tmp/character-sheet-hosted.sqlite3 bun run hosted:data -- migrate
```

## References

- [Railway config as code](https://docs.railway.com/config-as-code/reference)
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks)
