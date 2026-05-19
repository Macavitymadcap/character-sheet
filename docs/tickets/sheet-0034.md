# Ticket sheet-0034: Hosted Account And Operator Runbooks

## Summary

Prepare hosted account, invite, password-reset, and operator runbook flows for the current group without adding email delivery.

## Implementation

- Document seeded hosted users, password expectations, and first-login responsibilities.
- Document invite and password-reset token preparation for the operator.
- Confirm admin flows remain local/manual and do not imply email delivery.
- Add a concise operator runbook for common hosted rehearsal tasks.

## Tests First

- Add route or smoke coverage for the hosted account-preparation path where practical.
- Add documentation checks for runbook links and deferred email delivery notes.

## Acceptance Criteria

- The operator can prepare player, Game Master, and admin access from documented steps.
- Password-reset and invite behaviour is clear without email delivery.
- Hosted account setup does not bypass existing play permissions.
- `bun run verify` passes.

## Implementation Notes

- Added `docs/operations/hosted-account-runbook.md` for seeded hosted users, first-login password-reset expectations, invite handoff, reset handoff, account status checks, and the explicit no-email boundary.
- Linked the hosted account runbook from README and architecture docs.
- Extended documentation checks to prove the runbook covers manual invite/reset token handoff and admin permission boundaries.
- Extended the MVP smoke workflow to open the operator invite/reset pages, accept an invite, reset a seeded player's password, and log in with the resulting credentials.
