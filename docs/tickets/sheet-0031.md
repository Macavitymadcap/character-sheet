# Ticket sheet-0031: Pre-Deployment SRD Player-Experience Follow-Up

## Summary

Complete the `sheet-0029` hardening items that were deferred when the SRD epic landed, before the app is exposed through a hosted Railway rehearsal.

This ticket exists to keep `sheet-0020` accepted while giving the remaining player-facing SRD and mobile table-use work a named owner.

## Implementation

- Replace cramped inline edit disclosures for feature, score, and proficiency edits with button-triggered HTMX edit forms.
- Swap edit forms into the relevant row or panel region and support submit and cancel paths without a full page reload.
- Position dice roll results predictably, either near the triggering control or centred on small screens.
- Clean up dense skill and tool roll columns so action controls remain readable on mobile.
- Confirm Mira's seeded human cleric data is either SRD-credible for the available imported data or explicitly marked as intentionally partial in the UI/docs.
- Reassess whether campaign subpage splitting is required before hosted rehearsal; implement only if density still blocks the SRD workflow.

## Tests First

- Add route/component coverage for edit-form open, submit, and cancel flows.
- Add component or screenshot coverage for mobile skill/tool roll controls and dice-result placement.
- Add repository or seed tests that prove Mira's rule links/actions are credible, or route/component assertions that the partial-data limitation is visible.
- Add smoke coverage for the player path most likely to be used remotely: open characters, open a stable sheet tab URL, edit a sheet field, roll from a dense table, follow a sheet rule link, search rules, and return to the character context.

## Acceptance Criteria

- Sheet editing, dice results, skill/tool controls, and tab navigation are usable on mobile and desktop.
- Mira's seeded cleric sheet no longer looks accidentally wrong.
- Rules search and detail views remain connected to sheet context during the player workflow.
- Any remaining density or campaign-splitting work is documented as a deployment non-blocker with a named follow-up.
- `bun run verify` passes.

## Implementation Notes

- Replaced cramped ability, skill, and proficiency row edit disclosures with button-triggered HTMX edit fragments.
- Added focused edit, save, and cancel fragments for ability rows, skill rows, and proficiency list items.
- Improved mobile dice controls so dense skill/tool roll triggers fill their cells and popover results centre predictably on small screens.
- Added a visible seeded note for Mira that marks the human cleric sheet as deliberately partial until a later character-building slice handles automatic cleric grants, prepared spells, and equipment rules.
- Campaign subpage splitting is not required for this pre-deployment hardening slice; `sheet-0036` owns the final hosted-rehearsal check and should add a follow-up ticket if campaign page density blocks remote table use.
