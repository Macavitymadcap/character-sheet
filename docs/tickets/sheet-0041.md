# Ticket sheet-0041: Hyper-Dank Package Setup And Compatibility Scaffold

## Summary

Add the Hyper-Dank package installation path, shared stylesheet wiring, and Character Sheet
compatibility test scaffold.

## Implementation

- Install the stable public Hyper-Dank component, HTTP, and candidate database packages.
- Import shared component styles through the app asset pipeline while preserving Character Sheet
  theme overrides.
- Add `bun run test:compat` with representative public package imports.
- Document the package update workflow and accepted install strategy.

## Tests First

- Add compatibility tests that fail if public Hyper-Dank imports are unavailable.
- Add style-loading coverage for the shared stylesheet plus local overrides.

## Acceptance Criteria

- Character Sheet can import stable Hyper-Dank package APIs through public package names.
- Compatibility tests run locally without relying on Walking Pace app internals.
