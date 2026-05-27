# Private Rules Importer

`sheet-0086` adds the operator command for importing campaign-scoped private YAML from a Railway
volume. The default import path is `/data/private-rules`, matching the hosted volume convention.

```bash
bun run import:rules:private
bun run import:rules:private -- /data/private-rules
```

For local fixture checks, pass a local directory or file:

```bash
bun run import:rules:private -- docs/rules/private-rules.example.yaml
```

## Hosted Runbook

Before importing private production data, create a hosted backup:

```bash
bun run hosted:data -- backup
```

Then run the private import from a Railway shell with the backup confirmed:

```bash
PRIVATE_RULES_BACKUP_CONFIRMED=1 bun run import:rules:private -- /data/private-rules
```

If you have a backup manifest path, record it in the import output:

```bash
PRIVATE_RULES_BACKUP_REFERENCE=/data/backups/character-sheet-2026-05-29.manifest.json \
  bun run import:rules:private -- /data/private-rules
```

The importer rejects `/data/private-rules` imports unless either `PRIVATE_RULES_BACKUP_CONFIRMED=1`
or `PRIVATE_RULES_BACKUP_REFERENCE` is set. Local non-production paths can be imported without that
confirmation.

## Output

The command reports:

- imported entity count
- skipped non-YAML files
- failed YAML files and validation messages
- duplicate entries inside the import batch
- SRD entries shadowed by campaign-private duplicates
- imported counts grouped by source slug
- Lynott private rule links relinked to campaign-scoped private entities where matching entries are
  available
- Rovnost coverage summary, including required source coverage, Lynott missing links, and missing
  source files

Private source entries are linked to `campaign_rovnost_shadows` by default. Override this only for a
deliberate campaign migration:

```bash
PRIVATE_RULES_CAMPAIGN_ID=campaign_other_table bun run import:rules:private -- ./private-rules
```

Owned-book sources must stay campaign-scoped. Public visibility is rejected unless the source is
explicitly marked as SRD or licensed public material in the YAML.

For a report without importing new files, run:

```bash
bun run rules:coverage:rovnost -- /data/private-rules
```

Use `ROVNOST_RULES_APPLY_LINKS=1` or `--apply-links` with the report script to relink Lynott's
sheet to already-imported private entries.
