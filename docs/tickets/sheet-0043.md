# Ticket sheet-0043: Adopt Hyper-Dank Transport Helpers

## Summary

Replace duplicated route, form, and HTMX mechanics with `@macavitymadcap/hyper-dank-transport`
helpers while preserving Campaign Ledger permissions and response contracts.

## Dependencies

- Requires `sheet-0041`.

## Implementation

- Identify local helpers for form value parsing, required route parameters, HTMX detection,
  redirects, validation errors, and fragment-or-page responses.
- Replace them helper by helper behind existing route tests.
- Preserve status codes, redirect targets, fragment IDs, out-of-band swaps, validation copy, and
  permission checks.
- Keep Campaign Ledger domain validation, auth guards, repositories, and route ownership local.

## Interfaces

- Hono route handlers in `src/app.tsx` and related route helpers.
- HTMX response helpers and redirect behaviour.
- Route and app integration tests.

## Tests First

- Add or tighten route tests around representative full-page and HTMX requests before migration.
- Cover invalid params, missing form values, forbidden users, successful redirects, and fragment
  responses.

## Acceptance Criteria

- Replaced route mechanics import from `@macavitymadcap/hyper-dank-transport`.
- Player, Game Master, admin, public, and local-play routes keep their current behaviour.
- HTMX fragments and redirects remain stable.
- `bun run verify` passes.

## Acceptance Notes

- `src/app.tsx` now imports `FormValues`, `HttpResponder`, and `routeParam` from
  `@macavitymadcap/hyper-dank-transport`.
- Character creation, login, admin invite/status, and campaign-session forms use `FormValues`
  where the shared parser preserves Campaign Ledger validation copy.
- Action redirects that can be triggered by HTMX now flow through `HttpResponder`, returning
  `HX-Redirect` for HTMX requests while preserving `303` redirects for normal form posts.
- Route parameter reads for the migrated rule, campaign, asset, character, and session paths use
  the shared `routeParam` helper.
