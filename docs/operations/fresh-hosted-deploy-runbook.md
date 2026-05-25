# Fresh Hosted Deploy Runbook

This runbook rehearses a new Campaign Ledger hosted environment from empty persistent storage to table-ready operation. It keeps the accepted private-campaign model: SQLite on a Railway volume, app-managed assets on the same volume, operator-mediated account links, and no automatic email delivery.

## Local Rehearsal

Run the file-backed rehearsal before touching a new hosted environment:

```bash
bun run hosted:rehearse
```

The rehearsal creates temporary hosted-style paths, runs `bun run hosted:data -- prepare` behaviour, imports the full SRD 5.1 corpus, writes seeded campaign asset files, boots the app, checks `/readyz`, exercises table-critical routes, creates admin invite and password-reset handoff links, reads a protected seeded asset, and creates a backup bundle. It removes the temporary database and assets when complete.

## Fresh Railway Checklist

1. Create or select the Railway service using [Railway Hosted Rehearsal](../deployment/railway.md).
2. Attach a persistent volume mounted at `/data`.
3. Set `DB_PATH=/data/character-sheet.sqlite3`.
4. Set `CAMPAIGN_LEDGER_ASSET_ROOT=/data/assets`.
5. Set `HOSTED_BACKUP_DIR=/data/backups`.
6. Set `HOSTED_PERSISTENCE_MODE=sqlite-volume`.
7. Set `ACCOUNT_DELIVERY_MODE=operator`.
8. Set `PUBLIC_BASE_URL` to the Railway public URL or custom domain.
9. Set a long random `SESSION_SECRET`.
10. Run `bun run hosted:data -- prepare` once against the empty volume.
11. Deploy the service and confirm Railway reports `/readyz` as healthy.
12. Run `bun run hosted:check -- <hosted-url>`.
13. Run `bun run hosted:data -- backup` and confirm the SQLite backup, `-assets` snapshot, and manifest are present.

## Table-Ready Spot Checks

After the readiness check passes:

1. Complete the admin password reset handoff from [Hosted Account Operator Runbook](./hosted-account-runbook.md).
2. Open `/admin`, create one invite link, and create one password-reset link.
3. Sign in as the Game Master and open `/campaigns/rovnost-shadows`.
4. Open `/campaigns/rovnost-shadows/images` and confirm seeded images render or show the readable protected fallback.
5. Open `/campaigns/rovnost-shadows/wiki/factions-guide` as a player.
6. Open `/sheet/lynott` as a player and check the Core, Skills, Background, and Notes tabs.
7. Open `/rules/spell/bless` without signing in.
8. Open `/campaigns/rovnost-shadows/imports` as the Game Master.
9. Sign out and confirm a protected sheet route redirects to `/login`.

Manual account link delivery remains accepted for this epic. Any move to email delivery, object storage, Postgres, or public signup needs a new planned ticket.
