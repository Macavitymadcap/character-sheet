# Ticket sheet-0042: Shared Component Migration

## Summary

Replace local generic atoms and molecules with equivalent Hyper-Dank components where the public API
matches Character Sheet usage.

## Implementation

- Migrate first-fit generic primitives such as badges, buttons, compact lists, form fields, icons,
  panels, popover menus, and switches.
- Keep sheet-specific compositions, copy, HTMX attributes, and dense table UI local.
- Add upstream follow-up notes for missing props rather than forcing a poor local fit.

## Tests First

- Update component tests to prove labels, ARIA attributes, classes, HTMX attributes, and compact
  rendering remain stable.

## Acceptance Criteria

- Generic components are shared where this reduces duplication.
- Character Sheet gameplay UI remains visually and semantically equivalent.
