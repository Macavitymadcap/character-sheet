# Ticket sheet-0062: Hyper-Dank GitHub Workflow Adoption

## Summary

Adopt the Hyper-Dank git workflow for Campaign Ledger so epics, tickets, GitHub Issues, Projects,
pull requests, verification, and acceptance handoff all describe the same delivery state.

This is the first ticket in `sheet-0061` because the rest of the epic should use the new workflow
rather than retrofitting it after the implementation stack has started.

## Dependencies

- Builds on the completed `sheet-0040` Hyper-Dank package adoption and compatibility boundary.
- Runs before `sheet-0063` through `sheet-0069`.
- May require manual GitHub Project setup that cannot be fully represented in source files.

## Implementation

- Review the current Hyper-Dank git flow, issue/project conventions, and PR checklist behaviour,
  then document the Campaign Ledger version in `CONTRIBUTING.md` and `ARCHITECTURE.md`.
- Add source-backed GitHub issue templates or issue forms for epics, tickets, bugs, and review
  follow-ups under `.github/`.
- Add or update the PR template so every implementation PR records ticket number, base branch,
  linked issue, verification commands, screenshot evidence for UI changes, and follow-up scope.
- Define branch naming and base-branch rules for planning branches, epic integration branches, and
  ticket branches.
- Document GitHub Project fields, expected status values, and any manual project setup that cannot
  be committed to the repo.
- Add a local documentation or workflow check that proves the workflow docs and templates remain
  linked from README, architecture, or contributing docs.

## Interfaces

- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`
- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `README.md`
- `scripts/docs-links.test.ts` or a focused workflow-docs test

## Tests First

- Add a failing documentation test proving the new issue templates, PR template, and workflow docs
  exist and are linked from project documentation.
- Add assertions for the required PR checklist items before writing the template.
- Add assertions that the docs name GitHub Issues, Projects, ticket branches, epic branches, and
  acceptance evidence.
- Run `bun run test:hyper-dank` to keep the shared package compatibility gate visible while workflow
  docs adopt Hyper-Dank conventions.

## Acceptance Criteria

- Campaign Ledger has source-backed issue templates or issue forms for the work types used by this
  repo.
- The PR template requires linked ticket/issue, target branch, verification, screenshot evidence
  where relevant, and follow-up notes.
- Documentation explains the Hyper-Dank-style flow from issue creation through project status,
  branch creation, PR review, merge, and acceptance.
- Manual GitHub Project setup is documented clearly enough to recreate or audit.
- Later `sheet-0061` tickets can follow the workflow without making new process decisions.
- `bun run verify` passes.
