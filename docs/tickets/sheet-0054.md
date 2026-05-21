# Ticket sheet-0054: Admin Invite And Password Handoff

## Summary

Turn invite and password-reset preparation into complete admin UI workflows, and make password
entry safer on login, invite acceptance, and password reset screens.

## Implementation

- Show complete invite URLs after invite creation, with user-readable email, role/capability,
  expiry, accepted status, and copy affordance.
- Show complete password reset URLs after reset-token creation, with user-readable target user,
  expiry, used status, and copy affordance.
- Replace raw JSON/token handoff for normal admin use while keeping route tests able to inspect
  token data.
- Add password confirmation or show-password controls to password reset and invite acceptance.
- Add show-password controls to login.
- Validate password confirmation server-side where a confirmation field is submitted.
- Keep no-email-delivery boundaries explicit.

## Interfaces

- Routes: `/admin`, `/admin/invites`, `/admin/invites/:token`,
  `/admin/users/:userId/password-reset`, `/admin/password-reset-tokens/:token`, `/invites/:token`,
  `/password-reset/:token`, `/login`.
- Components: `AdminPage`, `InviteAcceptPage`, `PasswordResetPage`, `LoginPage`, password field
  controls.
- Services: invite and reset token creation/read/use flows.

## Tests First

- Add route tests for HTML invite and reset link responses or fragments.
- Add component tests for token status rows, copyable URLs, and password visibility/confirmation
  controls.
- Add service or route tests for password confirmation mismatch.
- Extend smoke coverage for an admin generating a link, accepting an invite, resetting a password,
  and logging in.

## Acceptance Criteria

- Admins can generate and copy complete invite/reset URLs without reading raw JSON.
- Admin token tables are readable on mobile and show useful token status.
- Login, invite acceptance, and reset screens support safer password entry.
- Password confirmation mismatches fail with a humane error.
- No email delivery is implied.
- `bun run verify` passes.

## Implementation Notes

- Browser admin form submissions redirect back to `/admin` with a handoff panel containing the
  complete invite or password-reset URL and manual-send context.
- JSON callers can still request raw token details by sending `Accept: application/json` to the
  admin invite and password-reset creation routes.
- Invite acceptance and password-reset forms now require matching password confirmation fields on
  the server before consuming tokens.
