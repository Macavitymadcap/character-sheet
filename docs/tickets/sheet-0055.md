# Ticket sheet-0055: Combined Admin, Player, And Game Master Access

## Summary

Replace single-role assumptions with capability or membership-based access so admin access can
coexist with player or Game Master campaign participation.

## Dependencies

- Should land before privileged campaign-rules UI in `sheet-0056`.

## Implementation

- Introduce a compatibility path from the current `users.role` model to explicit capabilities,
  memberships, or equivalent access records.
- Preserve existing seeded player, Game Master, and admin behaviour.
- Allow a user to hold admin access while also having player or Game Master campaign membership.
- Update guards so admin tools require admin capability, while sheet and campaign play access still
  depends on ownership or campaign membership.
- Update navigation to show relevant admin and campaign/player destinations for combined users.
- Keep admin access from silently granting sheet play-edit permission.

## Interfaces And Data Changes

- Tables or read models for user capabilities/access grants.
- Auth session user shape and guard helpers.
- `SiteHeader`, home continue destination, admin page, campaign guards, sheet guards.
- Seed data for at least one combined-access test user.

## Tests First

- Add schema/repository tests for combined access records.
- Add guard tests for admin-only, player-only, Game-Master-only, admin+player, and admin+Game Master
  scenarios.
- Add route tests proving combined users see expected navigation and cannot bypass play
  permissions.
- Add smoke coverage for a combined admin/player or admin/Game Master path.

## Acceptance Criteria

- Admin access can coexist with player or Game Master campaign access.
- Existing single-role users keep their current behaviour.
- Admin users do not gain sheet play-edit access unless they also have the relevant campaign access.
- Navigation and home destinations are understandable for combined users.
- `bun run verify` passes.
