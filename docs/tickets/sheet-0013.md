# Ticket sheet-0013: Local User Management And Admin Reads

## Summary

Add local account operations so the group can be onboarded without email delivery or production identity providers.

## Implementation

- Add admin views for users, invites, password reset tokens, account status, campaign membership, and character counts.
- Add local invite acceptance or admin-created account flow using existing invite/password primitives.
- Add reset-token use so a known token can set a local password.
- Add user status controls for disabling or reactivating a local account.
- Keep admins out of play-edit permissions by default; admin reads should not become sheet mutation privileges.

## Tests First

- Write repository/service tests for creating users from invites, using reset tokens, disabling accounts, and listing user/admin summaries.
- Write route tests for admin-only access, invalid tokens, expired tokens, duplicate emails, and disabled-user login rejection.
- Write component tests for admin user tables, invite forms, reset forms, and empty states.

## Acceptance Criteria

- An admin can create or accept local accounts for the group without email delivery.
- An admin can see who exists, which role they have, whether they are active, and whether they have campaign characters.
- Disabled accounts cannot sign in.
- Existing seeded users continue to work.
