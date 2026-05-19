# Epic sheet-0030: Railway Deployment And Hosted Rehearsal

## Summary

Take the local-first Character Sheet app from table rehearsal on a developer machine to a small hosted Railway deployment for the current group. The epic should preserve the existing Hono, HTMX, SQLite, and local-first shape while adding the deployment configuration, environment documentation, production seed path, operational checks, and final player-experience polish needed before the table uses the app remotely.

`sheet-0020` completed the SRD 5.1 rules slice. The deferred SRD hardening work that did not block that epic now lands as `sheet-0031`, the first ticket in this epic, before hosted rollout work begins.

## Goals

- Add a Railway deployment path for the existing app with documented environment variables and start commands.
- Define the hosted database and asset-storage posture for the first group deployment.
- Prepare seeded hosted accounts, passwords, invite/reset expectations, and operator runbooks without adding email delivery.
- Keep SRD rules import, browsing, and sheet rule links working in the hosted rehearsal environment.
- Complete the deferred table-use polish from `sheet-0029` before exposing the hosted app to players.
- Add health, smoke, accessibility, and screenshot checks that prove the hosted-like workflow is ready.

## Non-Goals

- No broad Hyper-Dank package adoption; that remains reserved for `sheet-0040`.
- No full guided character builder, levelling engine, or automatic rule grants.
- No production email delivery or external identity provider.
- No hosted uploads beyond the explicit asset-storage approach selected in this epic.
- No non-SRD commercial rules import expansion.

## Ticket Map

| Ticket | Purpose |
| --- | --- |
| `sheet-0031` | Complete deferred SRD player-experience hardening before deployment. |
| `sheet-0032` | Add Railway runtime configuration, health checks, and deployment documentation. |
| `sheet-0033` | Define hosted SQLite, backup, migration, and seed/reset operations. |
| `sheet-0034` | Prepare hosted account, invite, password-reset, and operator runbook flows. |
| `sheet-0035` | Add hosted asset-storage configuration and seeded campaign asset verification. |
| `sheet-0036` | Add hosted-rehearsal smoke, accessibility, screenshot, and acceptance checks. |

## Branch Strategy

Create `sheet-0030` from the latest `main`. Open the planning pull request into `main`. Once accepted, keep or recreate `sheet-0030` as the epic integration branch. Tickets `sheet-0031` through `sheet-0036` should branch from `sheet-0030`, open pull requests back into `sheet-0030`, and be squash-merged there before the epic lands on `main`.

## Test And Verification Strategy

- `bun run verify` remains the source-code acceptance command.
- Deployment configuration tests cover required environment variables, health checks, and start commands where practical.
- Smoke coverage proves a fresh hosted-like environment can seed, sign in, browse rules, open sheet rule links, manage campaign basics, and log out safely.
- Accessibility and screenshot checks cover the pre-deployment SRD hardening surfaces, hosted account flows, rules pages, sheet tabs, and campaign assets.
- Documentation checks keep Railway, database, asset, and operator runbook links current.

## Acceptance Criteria

- The app can be deployed to Railway with documented configuration and a verified health endpoint.
- A fresh hosted rehearsal can seed or restore the required group data without manual database surgery.
- Players and the Game Master can complete the existing group workflow remotely.
- Deferred `sheet-0029` SRD/table-use hardening is implemented through `sheet-0031` before hosted rollout work begins.
- Hosted asset behaviour is deterministic and does not depend on developer-machine file paths.
- README and architecture docs clearly state that `sheet-0020` is complete, `sheet-0030` is active for deployment, and `sheet-0040` remains reserved for Hyper-Dank adoption.

## Follow-Up Boundaries

- `sheet-0037` captures campaign subpage splitting and management polish after the first hosted rehearsal.
- `sheet-0040` remains reserved for Hyper-Dank package adoption.
