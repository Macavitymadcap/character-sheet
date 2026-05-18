# Ticket sheet-0027: SRD Rules Verification Coverage

## Summary

Expand smoke, accessibility, screenshot, and documentation coverage for the SRD rules experience.

## Implementation

- Add smoke steps for importing rules, browsing/filtering rules, opening a rule from a sheet tab,
  and completing the existing group-use workflow.
- Add Pa11y targets for the rules index, filtered list, and rule detail pages.
- Add screenshot targets for rules browsing and sheet-linked rules.
- Update README, architecture, and contribution docs with SRD workflows.

## Tests First

- Add failing verification expectations for the new rules pages and workflow coverage before final
  implementation cleanup.

## Acceptance Criteria

- `bun run verify` covers the player-facing SRD rules workflow.

## Implementation Notes

- Added smoke coverage for SRD fixture import, rules browsing, rule detail reads, and sheet rule
  links.
- Added Pa11y targets for the rules list and rule detail pages.
- Added screenshot targets for the rules list and Bless detail page.
