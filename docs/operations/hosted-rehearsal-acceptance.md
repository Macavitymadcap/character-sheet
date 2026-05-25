# Hosted Rehearsal Acceptance

This checklist is the final local acceptance gate for the `sheet-0030` Railway rehearsal epic. It confirms that the hosted-style path is covered before the epic branch is merged back to `main`.

## Preconditions

- Railway runtime setup follows [Railway Hosted Rehearsal](../deployment/railway.md).
- Fresh hosted deploy rehearsal follows [Fresh Hosted Deploy Runbook](./fresh-hosted-deploy-runbook.md).
- Hosted account setup follows [Hosted Account Operator Runbook](./hosted-account-runbook.md).
- Hosted assets use Railway volume storage at `CAMPAIGN_LEDGER_ASSET_ROOT=/data/assets`; existing `CHARACTER_SHEET_ASSET_ROOT` settings remain a compatibility fallback.
- Email delivery, external identity, Postgres, and Hyper-Dank package adoption remain out of scope for this epic.

## Automated Acceptance

Run the full local gate:

```bash
bun run verify
bun run hosted:rehearse
```

That command covers:

| Check | Hosted rehearsal evidence |
| --- | --- |
| Typecheck and tests | Runtime config, hosted data operations, auth, permissions, rules import, sheet fragments, campaign content, and component contracts. |
| Accessibility | Public home/login, player roster, sheet, rules list/detail, wiki image page, logout, Game Master campaign and roster, and admin pages. |
| MVP smoke | Seeded player and Game Master sign-in, character creation, sheet tabs, SRD rules, rule links, campaign sessions, wiki, protected seeded assets, image upload, admin invite/reset handoff, and logout protection. |
| Screenshots | Sheet light/dark states, Skills controls and roll result, Background faction, partial notes, player roster, admin tables, Game Master campaign images, wiki image page, rules pages, and edited sheet states. |

## Manual Hosted Rehearsal Spot Checks

After deploying to Railway, run these browser checks with the hosted URL:

1. Confirm `/readyz` returns `{ "checks": { "assets": true, "database": true }, "ok": true }` or run `bun run hosted:check -- <hosted-url>`.
2. Sign in as the seeded admin after completing the password reset handoff.
3. Confirm `/admin` lists active seeded users and can create invite/reset tokens.
4. Sign in as the Game Master and open `/campaigns/rovnost-shadows`.
5. Confirm campaign sessions, wiki pages, image assets, and roster links render.
6. Open `/campaigns/rovnost-shadows/wiki/factions-guide` as a player and confirm the inline image renders or shows the readable protected fallback.
7. Open `/sheet/lynott`, use the Core, Skills, Background, and Notes tabs, and complete one non-destructive d20 roll.
8. Sign out and confirm protected sheet routes redirect to `/login`.

## Campaign Density Decision

The Game Master campaign page is acceptable for the first hosted rehearsal because the character roster already has a dedicated subpage, the landing page uses compact sections, and the automated screenshot set captures the current image/session/wiki density. The page is still carrying too many management concerns for longer-term remote play.

`sheet-0037` is the named follow-up for splitting campaign management into focused subpages for sessions, wiki, images, and any richer campaign prep tools.
