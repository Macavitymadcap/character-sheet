# Ticket sheet-0036: Hosted Rehearsal Verification And Acceptance

## Summary

Add the final hosted-rehearsal smoke, accessibility, screenshot, and documentation checks before the Railway deployment epic lands.

## Implementation

- Extend smoke coverage for the hosted rehearsal path: seed, sign in, open characters, use sheet tabs, browse SRD rules, manage campaign basics, and log out.
- Confirm accessibility targets cover the hosted-ready player, Game Master, admin, rules, and campaign asset surfaces.
- Refresh screenshots for deployment-facing UI changes.
- Update README and architecture notes with final hosted readiness and follow-up boundaries.

## Tests First

- Add failing hosted-rehearsal verification expectations before implementation cleanup.
- Keep `bun run verify` as the final local acceptance command.

## Acceptance Criteria

- The hosted rehearsal workflow is covered by automated checks where practical.
- Accessibility and screenshot coverage matches the deployed user-facing surfaces.
- README and architecture docs describe the deployment state and remaining deferred epics.
- `bun run verify` passes.
