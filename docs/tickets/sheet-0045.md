# Ticket sheet-0045: Platform Regression Coverage

## Summary

Expand compatibility, accessibility, screenshot, and smoke coverage around the shared-package
migration.

## Implementation

- Cover the migrated generic components in representative sheet, campaign, admin, and rules pages.
- Add compatibility checks for public Hyper-Dank imports and Character Sheet usage patterns.
- Refresh accessibility and screenshot targets where shared components affect rendered UI.

## Tests First

- Add failing coverage for the expected compatibility and visual-regression surfaces before final
  migration cleanup.

## Acceptance Criteria

- Verification catches Character Sheet regressions and Hyper-Dank package-contract breakage.
