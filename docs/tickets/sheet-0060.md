# Ticket sheet-0060: Campaign Companion Acceptance

## Summary

Complete the `sheet-0050` epic acceptance pass with verification, accessibility, screenshots,
documentation updates, and follow-up boundaries.

## Dependencies

- Final ticket after `sheet-0051` through `sheet-0059`.

## Implementation

- Updated README, architecture, operations, and ticket docs to reflect delivered behaviour.
- Confirmed the new app name, public SRD rules, local play, admin handoff, combined access,
  campaign private sources, richer rules, Mira content, and compact UX are accurately documented.
- Confirmed smoke coverage for the full public-to-signed-in campaign companion workflow.
- Confirmed accessibility and screenshot coverage for public, admin, campaign, rules, sheet, and
  local-play surfaces.
- Recorded deferred work explicitly in
  [Campaign Companion Acceptance](../operations/campaign-companion-acceptance.md).
- Local test-server port selection is already covered by `scripts/lib/local-app.test.ts`, and it no
  longer blocks verification.

## Tests First

- Add failing documentation checks for new docs links and renamed product references before final
  docs updates.
- Add or extend smoke tests for public SRD, public local play export/import, admin handoff,
  combined access, campaign private sources, Mira, and compact management surfaces.
- Add final screenshot and Pa11y targets before acceptance.

## Acceptance Criteria

- `bun run verify` passes.
- Public users can browse SRD rules and use browser-local play with export/import.
- Signed-in users retain sheet, campaign, admin, and rules workflows.
- Private campaign rules remain protected.
- Mira and rule detail surfaces are credible for table play.
- Compact UX changes are covered by screenshots and accessibility checks.
- README and architecture docs describe delivered scope and deferred follow-ups accurately.

## Acceptance Notes

- Final acceptance record: [Campaign Companion Acceptance](../operations/campaign-companion-acceptance.md).
- `sheet-0037` remains the campaign-density follow-up.
- `sheet-0040` is the next planned roadmap slice for Hyper-Dank package adoption.
