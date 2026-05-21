# Ticket sheet-0058: Mira Sheet Content Completion

## Summary

Flesh out Mira's seeded sheet so it is credible for table use, including spells, features, actions,
resources, and rule links.

## Dependencies

- Builds on rules/mechanics work in `sheet-0057` where possible.

## Implementation

- Audit Mira's current seed data and document the intended character concept for this slice.
- Add credible class, spellcasting, spell, feature, equipment, action, and resource data.
- Ensure Eldritch Cannon appears only when appropriate for Mira's actual build, and appears as a
  bonus action with matching resource/rule detail if included.
- Link Mira's spells, features, traits, equipment, and conditions to imported rules where available.
- Make any intentionally incomplete or table-specific data explicit rather than accidentally empty.
- Update screenshots, smoke paths, and docs that currently describe Mira as partial.

## Implementation Notes

- Mira is now seeded as a level 1 human Life Domain cleric with SRD-linked acolyte background,
  Wisdom-based spellcasting, scale mail, shield, mace, priest's pack, and two 1st-level spell slots.
- Her spell set uses imported SRD/local rule docs where available: Guidance, Resistance,
  Spare the Dying, Bless, Cure Wounds, Detect Magic, Purify Food and Drink, and Sanctuary.
- Her class, domain, background, spellcasting focus, broad equipment, and spell records use SRD
  rule links so a full SRD import can hydrate the sheet with rule text.
- Eldritch Cannon remains Lynott-only; Mira has no cannon resource, equipment, or rule link.
- Remaining manual scope is limited to future character-builder automation for level-up and daily
  prepared-spell recalculation.

## Interfaces

- Seed data in `src/db/seed.ts`.
- Character read models, `character_rule_links`, `character_resources`, and equipment.
- Sheet tabs for `/sheet/mira-voss`.
- Screenshot targets and smoke coverage.

## Tests First

- Add seed/repository tests proving Mira has credible spells, features, actions, resources, and rule
  links.
- Add component tests for Mira's spellcasting/actions/features tabs.
- Add smoke coverage for opening Mira's sheet and key tabs.
- Add screenshot coverage for the completed Mira state.

## Acceptance Criteria

- Mira's sheet no longer looks accidentally empty or thin.
- Mira has credible spells, features, actions, resources, and rule links for her intended build.
- Eldritch Cannon is represented correctly if it belongs to Mira's build, or removed if it does not.
- Any remaining partial data is explicit and intentional.
- `bun run verify` passes.
