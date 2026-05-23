# Ticket sheet-0042: Adopt Hyper-Dank UI Primitives

## Summary

Replace low-risk app-local generic UI atoms and molecules with `@macavitymadcap/hyper-dank-ui`
imports where the public component contracts match Campaign Ledger.

## Dependencies

- Requires `sheet-0041` so package imports are already verified.

## Implementation

- Migrate compatible generic primitives such as `Badge`, `Button`, `Panel`, `CompactList`,
  `FormField`, and `LabelledOutput`.
- Preserve Campaign Ledger class hooks, accessible names, HTMX attributes, and visual density.
- Keep app-owned components where they contain domain behaviour, including dice controls, sheet
  tabs, site header, password flows, and campaign-specific layouts.
- Keep `Switch`, `Accordion`, and `PopoverMenu` local until their icon, title, and sheet-rule
  contracts can move without a visual or semantic reset.
- Remove local generic component files only after all imports and tests have moved.
- Refresh screenshots for touched light and dark states.

## Interfaces

- Component imports and exports.
- CSS modules or shared style hooks for migrated components.
- Component tests and screenshot targets.

## Tests First

- Add or update component tests that prove migrated components preserve semantic HTML, form labels,
  button types, switch state, popover attributes, and HTMX passthroughs.
- Run focused component tests before broad verification.

## Acceptance Criteria

- Compatible generic UI primitives are imported from `@macavitymadcap/hyper-dank-ui`.
- Campaign Ledger-specific components remain local.
- No visual reset or table-use regression is introduced.
- Light and dark screenshots cover the changed surfaces.
- `bun run verify` passes.

## Acceptance Notes

- `Badge`, `Button`, `Panel`, `CompactList`, `FormField`, and `LabelledOutput` now resolve through
  `@macavitymadcap/hyper-dank-ui` while preserving existing Campaign Ledger import paths and local
  CSS hooks.
- Button coverage now proves HTMX passthrough attributes from the shared primitive.
- `Switch`, `Accordion`, and `PopoverMenu` remain app-owned for this ticket because their current
  Campaign Ledger contracts include custom icons, non-string rule title links, and menu rendering
  details that are not safe to swap in this slice.
