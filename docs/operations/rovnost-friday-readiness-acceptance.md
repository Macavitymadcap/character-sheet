# Rovnost Friday Readiness Acceptance

This note records the `sheet-0084` Friday-critical boundary for the Rovnost table session planned
for Friday, 29 May 2026. It closes `sheet-0092` by documenting the private-rules workflow, manual
hosted steps, level-5 assumption, and known deferred scope.

## Delivered Boundary

- The private-rules v1 YAML contract is documented under [Private Rules YAML Schema](../rules/private-rules/README.md).
- Operator-owned YAML stays outside git and is imported from `/data/private-rules` on the Railway
  volume.
- Private owned-book sources stay campaign-scoped to `campaign_rovnost_shadows`; public rules routes
  remain SRD-only.
- Campaign members can resolve campaign-private duplicate slugs ahead of public SRD entries.
- Lynott is the level-5 proof case for Friday private rule links through the Rovnost coverage
  report.
- Other level-5 characters may be entered or corrected manually for Friday play.

## Hosted Operator Sequence

Run these steps from the hosted environment or an equivalent Railway shell after deploying the
accepted epic branch.

1. Confirm Railway uses `/data/character-sheet.sqlite3`, `/data/assets`, and `/data/backups` as
   documented in [Railway Hosted Rehearsal](../deployment/railway.md).
2. Confirm account handoff uses `ACCOUNT_DELIVERY_MODE=operator` and `PUBLIC_BASE_URL`, as described
   in [Hosted Account Operator Runbook](./hosted-account-runbook.md).
3. Create a backup before importing private rules:

```bash
bun run hosted:data -- backup
```

4. Upload or verify the operator-owned private YAML files under `/data/private-rules`.
5. If the operator source is OCR Markdown, convert it to private-rules YAML:

```bash
bun run import:rules:ocr -- --input-dir /data/private-rules/ocr-markdown --output-dir /data/private-rules
```

The OCR exporter excludes incomplete spell and monster stat-block entries by default; import those
from the dedicated spell/statblock source when ready.

6. Import the private rules with the backup confirmation:

```bash
PRIVATE_RULES_BACKUP_CONFIRMED=1 bun run import:rules:private -- /data/private-rules
```

7. Run the coverage report after import:

```bash
bun run rules:coverage:rovnost -- /data/private-rules
```

8. Check the hosted readiness endpoint:

```bash
bun run hosted:check -- <hosted-url>
```

9. Sign in as the Game Master and Lynott player, open `/sheet/lynott`, and spot-check private rule
   links from the action, spellcasting, and feature surfaces.

## Acceptance Evidence

Local repository evidence:

- `bun run verify`
- Documentation link checks through `scripts/docs-links.test.ts`
- Private rules schema, importer, duplicate-precedence, campaign-permission, and coverage tests
- Screenshot capture through the verifier into a temporary directory

Hosted manual evidence before Friday table use:

- Backup manifest exists under `/data/backups`.
- Private import output reports failed files, duplicate entries, SRD-shadowed entries, source counts,
  Lynott relinks, and the Rovnost coverage summary.
- Coverage report shows all required source books imported, all Lynott private links resolved, zero
  private rules visible without campaign access, and no unreadable source files.
- `/readyz` passes through `bun run hosted:check -- <hosted-url>`.

## Manual Gaps

- The real private YAML corpus is operator-owned and is not committed to the repository.
- The coverage report may list missing Lynott links when the private YAML does not yet include a
  matching entry; those gaps are explicit Friday readiness evidence, not hidden runtime failures.
- Non-Lynott characters can be maintained manually for Friday. Full multi-stage character creation
  and levelling automation are not required for the session.
- Encounter and combat tracking did not land in the Friday-critical path.

## Deferred Scope

| Issue | Friday boundary |
| --- | --- |
| [#116 sheet-0089: Multi-Stage Character Creator MVP](https://github.com/Macavitymadcap/campaign-ledger/issues/116) | Deferred; characters can be entered manually. |
| [#117 sheet-0090: Levelling Workflow MVP](https://github.com/Macavitymadcap/campaign-ledger/issues/117) | Deferred; all Friday characters start at level 5. |
| [#118 sheet-0091: Encounter And Combat Tracker MVP](https://github.com/Macavitymadcap/campaign-ledger/issues/118) | Deferred unless separately completed after the private-rules path. |
| [#120 sheet-0093: Qor'thos Campaign Wiki Seed](https://github.com/Macavitymadcap/campaign-ledger/issues/120) | Deferred; Qor'thos wiki content does not block Rovnost Friday readiness. |
| [#121 sheet-0094: Post-Friday Hyper-Dank Package Refresh And Component Adoption Audit](https://github.com/Macavitymadcap/campaign-ledger/issues/121) | Post-Friday audit and package refresh. |

Production follow-ups remain tracked separately:

- [#106 Production account delivery](https://github.com/Macavitymadcap/campaign-ledger/issues/106)
- [#107 Managed database migration](https://github.com/Macavitymadcap/campaign-ledger/issues/107)
- [#108 Hosted asset storage and backup automation](https://github.com/Macavitymadcap/campaign-ledger/issues/108)
