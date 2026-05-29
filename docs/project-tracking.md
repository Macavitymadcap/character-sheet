# Project Tracking

Campaign Ledger uses GitHub Issues and GitHub Projects as the operational source of truth for
active epics, tickets, bugs, audits, and follow-ups. Repository Markdown remains useful for durable
architecture notes, accepted planning briefs, and historical implementation records, but it should
not be the day-to-day status board once work is tracked in GitHub.

## Source Of Truth

| Work item | Operational source | Durable repository record |
| --- | --- | --- |
| Epic | GitHub issue plus project item | Optional `docs/epics/` brief for large plans or accepted architecture |
| Ticket | GitHub issue plus project item | Optional `docs/tickets/` note when versioned implementation detail is useful |
| Bug | GitHub issue plus project item | PR description and regression test when fixed |
| Audit | GitHub issue plus optional Markdown artifact | Findings document when the audit should be preserved |
| Follow-up | GitHub issue plus project item | None unless it becomes an epic, ticket, or durable decision |

Historical `docs/epics/sheet-*.md` and `docs/tickets/sheet-*.md` files remain intact. They explain
how the project got here and are still valid implementation records. New work should start in
GitHub unless the maintainer explicitly asks for a Markdown planning brief.

Durable acceptance notes such as [Rovnost Friday Readiness Acceptance](./operations/rovnost-friday-readiness-acceptance.md)
record final operator boundaries after an epic lands; they complement GitHub issue status rather
than replacing the active project board.

## Identifier Convention

Campaign Ledger keeps the `sheet-*` identifier sequence for GitHub-managed work.

| Surface | Convention |
| --- | --- |
| GitHub issue title | `sheet-0061: concise outcome` when the issue has an assigned identifier |
| Branch | `feat/sheet-0062-short-task-name`, `feat/sheet-0061`, or another accepted branch named in the issue |
| PR title | Conventional Commit title, not the identifier alone |
| PR body | Link the issue with `Closes #123`, `Fixes #123`, or `Refs #123` |
| Project item | Use the issue as the project item; do not create a separate tracking row |
| Markdown artifact | Link existing `docs/epics/` or `docs/tickets/` records only when they add durable context |

## Issue Model

Create issues from the templates in `.github/ISSUE_TEMPLATE/`:

- **Epic**: a coherent outcome that owns multiple tickets as native GitHub sub-issues. It owns
  goals, non-goals, dependencies, target branch, and acceptance criteria.
- **Ticket**: one independently reviewable slice of implementation, documentation, or workflow.
  It owns affected areas, base branch, work branch, verification, and screenshots when relevant.
- **Bug**: a user-visible defect, regression, or broken workflow. It owns impact, reproduction,
  expected behaviour, actual behaviour, evidence, and priority.
- **Follow-up**: triaged work that should not block the current PR or epic.

Use these labels consistently:

| Label | Meaning |
| --- | --- |
| `type: epic` | Parent outcome that groups tickets |
| `type: ticket` | Independently shippable implementation slice |
| `type: bug` | User-visible defect or regression |
| `type: follow-up` | Non-blocking future work |
| `area: ui` | Components, visual behaviour, accessibility, and screenshot evidence |
| `area: data` | Schema, repositories, imports, seed data, and persistence |
| `area: transport` | Hono routes, HTMX fragments, forms, and response contracts |
| `area: automation` | Scripts, verification, GitHub helpers, and deployment automation |
| `area: docs` | README, architecture, operations, acceptance, and copy |
| `area: workflow` | Project management, branch flow, templates, CI policy, and PR process |
| `status: blocked` | Waiting on a decision, dependency, credential, or external action |

## GitHub Project

Use one GitHub Project table or board for active Campaign Ledger work. The project item should be
the issue, not the PR.

Use native GitHub relationships where possible:

- Add every epic child ticket as a native sub-issue of its parent epic.
- Use native blocked-by relationships for sequencing constraints that affect planning or review.
- Keep the built-in `Parent issue` and `Sub-issues progress` fields visible in project views.
- Enable the Project auto-add workflow for Campaign Ledger issues or sub-issues so new tracked work
  lands on the board without a manual backfill step.

| Field | Type | Values / notes |
| --- | --- | --- |
| Status | Single select | Triage, Planned, Ready, In progress, Blocked, In review, Merged, Done, Closed |
| Parent issue | Built-in issue relationship | Populated by native sub-issues |
| Sub-issues progress | Built-in progress | Populated by native sub-issues |
| Parent epic | Text | Optional human-readable `sheet-*` mirror for filters and old views |
| Base branch | Text | `main`, the active `feat/sheet-*` epic branch, or another accepted PR base |
| Branch | Text | Work branch once implementation starts |
| PR | Text or linked PR | PR URL once opened |
| Type | Single select | Epic, Ticket, Bug, Audit, Follow-up |
| Area | Multi select | UI, Data, Transport, Automation, Docs, Workflow |
| Priority | Single select | P0, P1, P2, P3 |
| Verification | Single select | Not started, Narrow checks, Verify passed, CI passed, Blocked |

Recommended views:

- **Roadmap**: epics and planned tickets grouped by native parent issue or parent epic mirror.
- **Active work**: Ready, In progress, Blocked, and In review tickets.
- **Review queue**: open PRs grouped by verification state.
- **Follow-ups**: non-blocking issues created from reviews, audits, and acceptance handoffs.

## Branch And PR Rules

The documentation-first branch flow still applies, but GitHub supplies active tracking state:

| Work type | PR base | Required linkage |
| --- | --- | --- |
| Epic planning | `main` | PR body links the GitHub epic issue and any durable planning brief |
| Ticket implementation | Active epic branch | PR body links the GitHub ticket issue and parent epic relationship |
| Urgent fix | `main` | PR body links the bug or follow-up issue |
| Final epic acceptance | `main` | PR body links the epic issue and records acceptance evidence |

Use normal follow-up commits on open PRs unless the maintainer explicitly asks for history
rewriting. Extra commits are acceptable when the ticket or epic acceptance criteria remain answered.
CI runs for pull requests targeting `main` or any `feat/**` branch, and for pushes to those branches.

## Rollout

1. Keep historical Markdown docs in place.
2. Create or audit labels from this document.
3. Create or audit the GitHub Project with the fields above.
4. Add active epics, tickets, bugs, and follow-ups to the Project as issue-backed items.
5. Add native sub-issue and blocked-by relationships where they clarify delivery.
6. Link every PR to its issue and keep Project `Status`, `Branch`, `PR`, and `Verification` fields
   current during review.
7. Use Markdown only for durable architecture notes, accepted briefs, or implementation records that
   need to live with the code.

Do not bulk-create issues for all historical `sheet-*` docs. Link history when context is needed,
then create only active or future work in GitHub.
