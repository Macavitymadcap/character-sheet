# GitHub Workflow

Campaign Ledger uses the Hyper-Dank-style GitHub workflow for epics, tickets, pull requests,
project tracking, and acceptance handoff. GitHub Issues plus issue-backed GitHub Project items are
the operational source of truth for active work. Markdown planning docs remain durable records for
accepted briefs, architecture, and historical implementation detail.

## Issue Types

Use the source-backed issue forms in `.github/ISSUE_TEMPLATE/`:

- `Epic` for accepted or proposed multi-ticket outcomes such as `sheet-0061`.
- `Ticket` for independently reviewable implementation slices such as `sheet-0062`.
- `Bug` for user-visible regressions or broken workflows.
- `Follow-up` for non-blocking work found during review, audit, or acceptance.

Every issue should include its `sheet-*` identifier when one exists. Ticket issues should link the
parent epic issue through GitHub's native parent/sub-issue relationship when possible, and can also
link a durable Markdown ticket in `docs/tickets/` when that record exists.

## Branches And Pull Requests

Use the existing documentation-first branch flow with feature branches under `feat/`. GitHub Actions
run CI for pull requests targeting `main` or any `feat/**` branch, and for pushes to those branches.
The branch-protection script configures `main` by default; pass an explicit `feat/sheet-*` branch
when creating or refreshing protection for an active epic integration branch.

| Work type | Branch | Pull request base |
| --- | --- | --- |
| Epic planning | `feat/plan-sheet-0061-*` or `feat/sheet-0061` | `main` |
| Accepted epic integration | `feat/sheet-0061` | Final epic PR targets `main` |
| Ticket implementation | `feat/sheet-0062-*` | Active epic branch, for example `feat/sheet-0061` |
| Urgent fix outside an epic | `feat/fix-*` | `main` |

Ticket PRs should keep their scope to the accepted ticket. When a ticket reveals extra work, open a
follow-up issue instead of expanding the PR quietly.

The PR template requires the linked issue, project, base branch, working branch, verification, UI
evidence where relevant, review notes, and follow-up scope. Use `Closes`, `Fixes`, or `Refs` so
GitHub can connect the PR to the issue.

## GitHub Projects

The project board should use issue-backed items, not standalone tracking rows. If GitHub Project
automation cannot be fully configured from the repository, maintainers should set or audit the
fields manually. See [Project Tracking](../project-tracking.md) for the full field model, labels,
views, and rollout rules.

| Field | Expected values |
| --- | --- |
| `Status` | `Triage`, `Planned`, `Ready`, `In progress`, `Blocked`, `In review`, `Merged`, `Done`, `Closed` |
| `Parent issue` | GitHub's built-in parent issue relationship |
| `Sub-issues progress` | GitHub's built-in progress field for epic issues |
| `Parent epic` | Parent `sheet-*` identifier mirror for filters and old views |
| `Base branch` | `main`, `feat/sheet-0061`, or another accepted PR base |
| `Branch` | Work branch once implementation starts |
| `PR` | Pull request URL once opened |
| `Type` | `Epic`, `Ticket`, `Bug`, `Audit`, `Follow-up` |
| `Area` | `UI`, `Data`, `Transport`, `Automation`, `Docs`, `Workflow` |
| `Priority` | `P0`, `P1`, `P2`, `P3` |
| `Verification` | `Not started`, `Narrow checks`, `Verify passed`, `CI passed`, `Blocked` |

Suggested status flow:

1. `Triage` or `Planned`: issue exists but is not ready to start.
2. `Ready`: ticket has accepted scope and a clear base branch.
3. `In progress`: implementation branch exists.
4. `Blocked`: work is waiting on a decision, credential, dependency, or external action.
5. `In review`: PR is open and linked.
6. `Merged`: PR has merged but final acceptance or release notes are still being recorded.
7. `Done`: acceptance evidence is recorded and no blocking handoff remains.

## Acceptance Evidence

Before closing an issue or moving it to `Done`, record:

- the merged PR link
- verification commands, usually `bun run verify`
- screenshot or Pa11y evidence for user-facing UI changes
- follow-up issues for deferred work
- updated durable docs when behaviour, workflow, data shape, scripts, or assumptions changed

Final epic acceptance should also record an operations note under `docs/operations/` when the epic
adds a new user-facing workflow or project process.
