# Hosted Persistence Decision

Campaign Ledger accepts SQLite on a persistent Railway volume as the hosted persistence boundary for
`sheet-0077`. This preserves the current local-first development model while making data protection
an explicit operational concern instead of an accidental side effect of the first hosted rehearsal.

## Decision

Use one file-backed SQLite database at `DB_PATH`, with app-managed campaign assets under
`CAMPAIGN_LEDGER_ASSET_ROOT` on the same persistent volume. On Railway, both paths should live under
`/data`:

| Setting | Accepted production-readiness value |
| --- | --- |
| `HOSTED_PERSISTENCE_MODE` | `sqlite-volume` or unset |
| `DB_PATH` | `/data/character-sheet.sqlite3` |
| `CAMPAIGN_LEDGER_ASSET_ROOT` | `/data/assets` |
| `HOSTED_BACKUP_DIR` | `/data/backups` |

`bun run hosted:data -- status` reports the resolved persistence mode, database path, asset root, and
backup directory. Hosted data commands reject unsupported persistence modes such as `postgres` so a
storage backend cannot change without a planned migration ticket.

## Why Not Postgres Yet

Postgres remains a valid future direction, but it is not the safest next step for this private
campaign app. The current repository, seed flow, smoke tests, local development loop, and hosted
rehearsal scripts all use Bun's SQLite APIs directly. Moving to Postgres would require a real
repository and migration compatibility layer, plus a rehearsed data-copy and rollback path. That
work should happen only when the app needs concurrent hosted editing, managed database operations, or
multi-environment deployment guarantees that SQLite-on-volume cannot provide.

## Preservation Contract

- App startup applies idempotent schema bootstrap only; it does not seed or reset mutable data.
- `bun run hosted:data -- migrate` runs schema bootstrap without reseeding rows.
- `bun run hosted:data -- prepare` refuses to seed over a non-empty database unless
  `HOSTED_DATA_CONFIRM=seed-existing` is set after a backup.
- `bun run hosted:data -- backup` creates a timestamped SQLite backup with `VACUUM INTO`.
- `bun run hosted:data -- restore` requires `HOSTED_DATA_CONFIRM=replace` and a non-empty
  `HOSTED_RESTORE_SOURCE`.
- Hosted data operations require a file-backed SQLite database, not `DB_PATH=:memory:`.

Database backups are necessary but not sufficient: app-managed campaign images live under the asset
root and must be backed up with the SQLite file. `sheet-0080` owns the fuller backup/restore
automation for database plus assets.

## Future Migration Trigger

Create a new migration ticket before changing `HOSTED_PERSISTENCE_MODE` away from `sqlite-volume`.
That ticket should include:

- schema compatibility and migration tests
- a one-way copy rehearsal from the current SQLite database
- rollback instructions
- local development and in-memory test implications
- Railway variable and service changes
