# GitHub Workflow

Campaign Ledger uses the Hyper-Dank-style GitHub workflow for epics, tickets, pull requests,
project tracking, and acceptance handoff. Markdown planning docs remain the durable source of truth,
while GitHub Issues and GitHub Projects show the current delivery state.

## Issue Types

Use the source-backed issue forms in `.github/ISSUE_TEMPLATE/`:

- `Epic` for accepted or proposed multi-ticket outcomes such as `sheet-0061`.
- `Ticket` for independently reviewable implementation slices such as `sheet-0062`.
- `Bug` for user-visible regressions or broken workflows.
- `Follow-up` for non-blocking work found during review, audit, or acceptance.

Every issue should include its `sheet-*` identifier when one exists. Ticket issues should link the
parent epic issue and the durable Markdown ticket in `docs/tickets/`.

## Branches And Pull Requests

Use the existing documentation-first branch flow:

| Work type | Branch | Pull request base |
| --- | --- | --- |
| Epic planning | `codex/plan-sheet-0061-*` or `sheet-0061` | `main` |
| Accepted epic integration | `sheet-0061` | Final epic PR targets `main` |
| Ticket implementation | `codex/sheet-0062-*` | Active epic branch, for example `sheet-0061` |
| Urgent fix outside an epic | `codex/fix-*` | `main` |

Ticket PRs should keep their scope to the accepted ticket. When a ticket reveals extra work, open a
follow-up issue instead of expanding the PR quietly.

The PR template requires the linked issue, project, base branch, working branch, verification, UI
evidence where relevant, review notes, and follow-up scope. Use `Closes`, `Fixes`, or `Refs` so
GitHub can connect the PR to the issue.

## GitHub Projects

The project board should use these fields. If GitHub Project automation cannot be fully configured
from the repository, maintainers should set or audit the fields manually.

| Field | Expected values |
| --- | --- |
| `Status` | `Backlog`, `Ready`, `In progress`, `In review`, `Done` |
| `Type` | `Epic`, `Ticket`, `Bug`, `Follow-up` |
| `Priority` | `P3`, `P2`, `P1`, `P0` |
| `Epic` | Parent `sheet-*` identifier or linked epic issue |
| `Target branch` | `main`, `sheet-0061`, or another accepted base |

Suggested status flow:

1. `Backlog`: issue exists but is not ready to start.
2. `Ready`: ticket has accepted scope and a clear base branch.
3. `In progress`: implementation branch exists.
4. `In review`: PR is open and linked.
5. `Done`: PR is merged and acceptance evidence is recorded.

## Acceptance Evidence

Before closing an issue or moving it to `Done`, record:

- the merged PR link
- verification commands, usually `bun run verify`
- screenshot or Pa11y evidence for user-facing UI changes
- follow-up issues for deferred work
- updated durable docs when behaviour, workflow, data shape, scripts, or assumptions changed

Final epic acceptance should also record an operations note under `docs/operations/` when the epic
adds a new user-facing workflow or project process.
