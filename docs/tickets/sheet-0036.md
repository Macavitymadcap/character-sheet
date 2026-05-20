# Ticket sheet-0036: Hosted Rehearsal Verification And Acceptance

## Summary

Add the final hosted-rehearsal smoke, accessibility, screenshot, and documentation checks before the Railway deployment epic lands.

## Implementation

- Extend smoke coverage for the hosted rehearsal path: seed, sign in, open characters, use sheet tabs, browse SRD rules, manage campaign basics, and log out.
- Confirm accessibility targets cover the hosted-ready player, Game Master, admin, rules, and campaign asset surfaces.
- Reassess campaign page density during hosted rehearsal and either confirm subpage splitting is unnecessary or create a named follow-up ticket before the epic lands.
- Refresh screenshots for deployment-facing UI changes.
- Update README and architecture notes with final hosted readiness and follow-up boundaries.

## Tests First

- Add failing hosted-rehearsal verification expectations before implementation cleanup.
- Keep `bun run verify` as the final local acceptance command.

## Acceptance Criteria

- The hosted rehearsal workflow is covered by automated checks where practical.
- Accessibility and screenshot coverage matches the deployed user-facing surfaces.
- Campaign page density has been reviewed for remote table use, with any required subpage split captured as a named follow-up.
- README and architecture docs describe the deployment state and remaining deferred epics.
- `bun run verify` passes.

## Completion Notes

- [Hosted Rehearsal Acceptance](../operations/hosted-rehearsal-acceptance.md) is the final local and manual hosted checklist.
- The campaign page is acceptable for the first hosted rehearsal, with the longer-term split captured as `sheet-0037`.
