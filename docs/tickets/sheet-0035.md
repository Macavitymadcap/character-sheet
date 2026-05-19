# Ticket sheet-0035: Hosted Asset Storage And Campaign Asset Verification

## Summary

Configure and verify deterministic campaign asset behaviour for hosted rehearsal.

## Implementation

- Choose the hosted asset-storage approach for the first Railway deployment.
- Document `CHARACTER_SHEET_ASSET_ROOT` for hosted and local environments.
- Ensure seeded campaign assets do not depend on developer-machine file paths.
- Preserve protected campaign asset routes and visibility checks.

## Tests First

- Add route or smoke coverage for hosted-style campaign asset reads.
- Add screenshot or accessibility coverage for seeded campaign image surfaces.

## Acceptance Criteria

- Hosted campaign image behaviour is deterministic.
- Missing or unavailable assets show a readable fallback rather than broken images.
- Asset paths remain app-managed relative keys, not absolute local paths.
- `bun run verify` passes.
