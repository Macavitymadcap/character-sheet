# Ticket sheet-0069: Game Master Prep Acceptance

## Summary

Complete the `sheet-0061` epic acceptance pass with verification, accessibility, screenshots,
documentation updates, GitHub workflow evidence, and explicit follow-up boundaries.

This final ticket proves the Game Master prep epic is complete enough for table use and that any
remaining work has a named owner outside this epic.

## Dependencies

- Final ticket after `sheet-0062` through `sheet-0068`.

## Implementation

- Add an operations acceptance note for `sheet-0061` under `docs/operations/`.
- Confirm README, architecture, contributing, epic, and ticket docs describe delivered GM prep,
  NPCs, image library, player preview, content import, Google workflow, and GitHub issue/project
  process accurately.
- Confirm `bun run test:hyper-dank` still protects shared package import paths and local boundary
  decisions.
- Extend smoke coverage to prove a Game Master can create a private NPC, upload or use a portrait,
  preview as player, reveal intended content, import synthetic campaign writing, and keep private
  content hidden.
- Extend Pa11y and screenshot targets for prep workspace, NPC list/detail, player preview,
  visibility audit, image library/detail, import preview, and Google/manual import path.
- Confirm protected asset and visibility behaviour for player, Game Master, admin-only, and outsider
  sessions.
- Record follow-up boundaries for full encounter building, combat tracking, production Google sync,
  two-way editing, Postgres, external identity, and any remaining campaign-management polish.

## Interfaces

- [Game Master Prep Acceptance](../operations/game-master-prep-acceptance.md).
- README, architecture, contributing, and ticket docs.
- Smoke, Pa11y, screenshot, and docs-link tests.
- PR body screenshot evidence and GitHub issue/project links for the epic.

## Tests First

- Add failing docs-link checks for the new acceptance note before writing the note.
- Add or extend smoke tests for private NPC creation, reveal, player preview, image upload/detail,
  and staged import.
- Add Pa11y targets for every new user-facing route.
- Add screenshot targets for the new Game Master prep, NPC, image, preview, and import surfaces.
- Add workflow-doc checks proving the GitHub issue/project handoff docs remain linked.

## Acceptance Criteria

- `bun run verify` passes.
- Game Masters can use the prep workspace, NPC dossiers, image library, player preview, and import
  preview flows in a fresh seeded setup.
- Players only see intended revealed/player-visible campaign material.
- Local photo upload and seeded-file placement are documented and covered by tests/screenshots.
- Google/manual import setup and limitations are documented.
- Hyper-Dank package usage and GitHub workflow adoption remain documented and verified.
- The operations acceptance note records delivered scope, verification evidence, screenshots, and
  follow-up boundaries.
