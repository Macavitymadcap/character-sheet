# Ticket sheet-0032: Railway Runtime Configuration

## Summary

Add the Railway runtime configuration, health checks, and deployment documentation needed to run the existing app in a hosted rehearsal environment.

## Implementation

- Document the Railway service setup, build/start commands, and required environment variables.
- Confirm `/healthz` is suitable for Railway health checks or add a deployment-specific check that matches the current runtime model.
- Keep runtime setup separate from `createApp()` and preserve local development defaults.
- Document how `DB_PATH`, `SESSION_SECRET`, `PORT`, `HOST`, and `CHARACTER_SHEET_ASSET_ROOT` should be configured for hosted rehearsal.

## Tests First

- Add tests or script checks for required environment handling where practical.
- Add documentation-link checks for the Railway setup instructions.

## Acceptance Criteria

- Railway can start the app with documented commands and environment variables.
- Health checks prove the app is booted without requiring authentication.
- Local development remains unchanged.
- `bun run verify` passes.
