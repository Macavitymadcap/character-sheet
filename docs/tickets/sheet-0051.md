# Ticket sheet-0051: Rename App To Campaign Ledger

## Summary

Rename the app from "Character Sheet" to "Campaign Ledger" across product copy, package metadata,
docs, deployment copy, and repository/local-folder guidance.

This ticket should not change gameplay behaviour. It creates the naming baseline so later public
play and campaign features do not keep reinforcing the old sheet-only identity.

## Implementation

- Update app chrome, page titles, README, architecture docs, deployment docs, operator docs, and
  screenshot labels that refer to "Character Sheet" as the product name.
- Update `package.json` package name to a package-safe Campaign Ledger form.
- Document GitHub repository rename and local folder rename steps without assuming the PR can rename
  the remote repository or the user's local checkout automatically.
- Preserve route names such as `/sheet/:characterRef` where they remain accurate user-facing nouns.
- Avoid changing table names, migration history, or deployment storage paths unless a specific
  reference is product-facing and safe to rename.

## Interfaces

- App dependency `appName`.
- `package.json`.
- README, architecture, deployment, operations, and ticket/epic references.
- Screenshot target labels and documentation reference checks.

## Tests First

- Add or update component tests that assert the new app name appears in shared layout/header output.
- Add documentation-link or text checks for old product-name references where practical.
- Run the existing docs link checks after the rename.

## Acceptance Criteria

- The app chrome and document titles use Campaign Ledger.
- Product docs no longer describe the app as only a character sheet.
- Package metadata and deployment/operator docs are consistent with the new name.
- Repository and local folder rename steps are documented clearly.
- No runtime data or permission behaviour changes in this ticket.
- `bun run verify` passes.
