# Hosted Production Readiness Acceptance

This note closes the `sheet-0077` hosted production readiness epic. It records the accepted private-table production boundary, the verification evidence, and the follow-up issues that should own future hosted expansion.

## Delivered Boundary

- Railway deployment uses `bun run start`, `railway.json`, `/readyz`, and a persistent volume mounted at `/data`.
- Hosted data uses SQLite at `/data/character-sheet.sqlite3` with app-managed campaign assets at `/data/assets`.
- Hosted preparation is explicit: `bun run hosted:data -- prepare` seeds the table data, writes seeded asset files, and imports the public SRD 5.1 rules corpus.
- Hosted backup and restore use `bun run hosted:data -- backup` and `bun run hosted:data -- restore`, including the SQLite file, asset snapshot, and manifest.
- Account onboarding remains operator-mediated with `ACCOUNT_DELIVERY_MODE=operator` and canonical links generated from `PUBLIC_BASE_URL`.
- Fresh environment rehearsal is automated by `bun run hosted:rehearse`.
- Deployed environment readiness is checked with `bun run hosted:check -- <hosted-url>`.

## Acceptance Evidence

Run the local acceptance gate before merging the epic branch to `main`:

```bash
bun run verify
bun run hosted:rehearse
```

The rehearsal path creates an empty hosted-style file layout, prepares data and assets, boots the app through Hono request handlers, checks `/readyz`, creates admin invite and password-reset handoff links, reads player and Game Master surfaces, opens public rules, wiki, image, and import routes, confirms a protected seeded asset, and writes a backup bundle.

Manual hosted evidence remains documented in:

- [Railway Hosted Rehearsal](../deployment/railway.md)
- [Fresh Hosted Deploy Runbook](./fresh-hosted-deploy-runbook.md)
- [Hosted Account Operator Runbook](./hosted-account-runbook.md)
- [Hosted Rehearsal Acceptance](./hosted-rehearsal-acceptance.md)

## Accepted Manual Operations

- The operator sets Railway variables and mounts the persistent volume.
- The operator runs hosted preparation and backup commands intentionally; app startup applies schema bootstrap only.
- The operator creates invite and password-reset links from `/admin` and shares them through the group's private channel.
- The operator keeps at least two active admin accounts once the hosted table is live.
- The operator performs the table-ready spot checks after deploy before inviting players into the hosted environment.

## Deferred Follow-Ups

The following production concerns are intentionally outside `sheet-0077` and now have GitHub follow-up issues:

| Follow-up | Boundary |
| --- | --- |
| [#106 Production account delivery](https://github.com/Macavitymadcap/campaign-ledger/issues/106) | Email provider, templates, delivery verification, external identity, or public signup. |
| [#107 Managed database migration](https://github.com/Macavitymadcap/campaign-ledger/issues/107) | Postgres or another managed data store, migration strategy, rollback, and local compatibility. |
| [#108 Hosted asset storage and backup automation](https://github.com/Macavitymadcap/campaign-ledger/issues/108) | Object storage or CDN-backed assets, scheduled backups, export/retention, restore drills, and alerts. |

These follow-ups should be planned as new tickets or epics before they change the accepted hosted runtime.
