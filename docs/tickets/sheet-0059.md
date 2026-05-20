# Ticket sheet-0059: Compact Management And Table-Use UX

## Summary

Redesign the densest existing surfaces for repeated table use: admin, campaign, rules, roster,
campaign image, and roll popover workflows.

## Dependencies

- Builds on `sheet-0054` for admin token handoff.
- Can absorb or coordinate with `sheet-0037` campaign subpage splitting if that has not already
  landed.

## Implementation

- Compact the admin user, invite, and reset-token views for mobile scanning.
- Compact campaign management, or split it into focused overview, sessions, wiki, and image
  management routes if `sheet-0037` has not landed.
- Improve campaign image management with explicit seeded, uploaded, missing, protected, and fallback
  states.
- Replace horizontally awkward roster tables with compact mobile card/list layouts while preserving
  useful desktop density.
- Fix sheet data tables whose action columns squash roll/edit controls, including Core abilities,
  skills, proficiencies, and similar repeated rows.
- Replace cramped inline `details` edit disclosures with HTMX read/edit swaps for sheet rows and
  compact cards. The editable item should swap into a focused form, and submit or cancel should
  swap the same item back to its read state without replacing unrelated sheet content.
- Reduce rules filter weight on mobile and keep result/detail context visible.
- Give roll popovers a distinct visual treatment and keep results close to the triggering roll.
- Add screenshots for each changed state in light and dark modes where relevant.

## Interfaces

- Components/pages: `AdminPage`, `CampaignPage`, campaign wiki/images/session surfaces,
  `CharactersPage`, `RulesPage`, `RulesDetailPage`, `DiceRoller`.
- CSS modules for affected pages/components.
- Screenshot and Pa11y target configuration.

## Tests First

- Add component tests for compact admin rows/cards and token states.
- Add component/route tests for campaign management split or compact states.
- Add component tests for campaign image status labels.
- Add component tests for roster mobile card/list rendering.
- Add component or screenshot coverage proving sheet row roll/edit controls do not overlap or
  compress into unreadable action columns on 360px mobile and constrained desktop widths.
- Add route/component coverage for opening, submitting, and cancelling HTMX edit states for ability,
  sense, defence, proficiency, equipment, background, or equivalent representative sheet rows.
- Add screenshot targets for admin, campaign, rules, roster, image, and roll popover states.
- Extend Pa11y targets for any new campaign management routes.

## Acceptance Criteria

- Admin, campaign, rules, and roster screens are scannable on a 360px mobile viewport.
- Sheet ability, skill, proficiency, and similar row actions remain readable and easy to hit on
  narrow viewports.
- Sheet edit forms replace the edited row/card instead of opening cramped nested disclosures, and
  cancel returns to the original read state.
- Campaign image states are explicit and do not rely on silent blank/fallback regions.
- Roll popovers are visually distinct from the sheet background.
- Desktop views remain compact and useful.
- Screenshots cover the changed flows.
- `bun run verify` passes.
