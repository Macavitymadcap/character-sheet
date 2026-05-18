# Ticket sheet-0019: Group-Use Verification And Documentation

## Summary

Complete the group-use MVP acceptance pass with updated docs, accessibility coverage, screenshots, smoke workflows, and deployment-readiness notes.

## Implementation

- Extend `bun run verify` or supporting scripts to cover the group-use workflow.
- Add smoke coverage for admin account preparation, player character creation, manual sheet editing, note creation, Game Master campaign/session records, wiki reads, image assets, and faction selection.
- Add Pa11y coverage for the new roster, admin, wiki, and campaign pages.
- Add screenshot capture for player roster, GM campaign, wiki page with image, faction picker, and an edited sheet.
- Update README, architecture, and contribution docs for the group-use flows.
- Document deployment readiness and explicitly defer Railway/Postgres/secrets to the next epic.

## Tests First

- Write smoke expectations before filling any final gaps discovered by end-to-end local review.
- Write documentation checks for local links, script names, and current planning documents.
- Write screenshot script expectations for output paths and required view states.

## Acceptance Criteria

- `bun run typecheck` passes.
- `bun run test` passes.
- `bun run test:a11y` passes.
- `bun run verify` passes.
- A fresh local checkout can seed and run the group-use MVP.
- Docs explain the local group workflow and the remaining deployment/homebrew/SRD follow-up work.

## Implementation Notes

- Extended the smoke workflow to cover player and Game Master character creation, manual sheet editing, notes, faction selection, sessions, wiki reads and writes, image upload, and admin invite/password-reset preparation.
- Extended Pa11y targets to cover public, player roster, sheet, wiki, logout, Game Master campaign and roster, and admin pages.
- Extended screenshot targets to include roster, campaign, wiki-with-image, faction picker, and edited-sheet states.
- Added documentation reference checks for local markdown links and documented package scripts.
- Updated README, architecture, and contribution docs with the group-use local workflow and the explicit Railway/Postgres/secrets/email/homebrew/SRD deferrals.
