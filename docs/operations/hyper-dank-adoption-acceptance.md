# Hyper-Dank Adoption Acceptance

This checklist is the final acceptance note for the `sheet-0040` Hyper-Dank package adoption epic
after `sheet-0041` through `sheet-0046` have landed. It records the package source, compatibility
coverage, visual evidence, and remaining app-owned boundaries before the next Game Master prep epic
begins.

## Delivered Scope

- Campaign Ledger resolves Hyper-Dank packages from npm through
  `@macavitymadcap/hyper-dank-ui`, `@macavitymadcap/hyper-dank-data`,
  `@macavitymadcap/hyper-dank-transport`, and `@macavitymadcap/hyper-dank-automation`.
- `bun.lock` pins the installed package versions for reproducible installs.
- `bun run update:hyper-dank` refreshes the four shared packages and immediately runs the
  compatibility check.
- Generic `Badge`, `Button`, `Panel`, `CompactList`, `FormField`, and `LabelledOutput` imports are
  now thin compatibility shims over Hyper-Dank UI primitives.
- Transport helpers now cover form values, route parameters, HTMX detection, redirects, and
  fragment/page response selection where they fit Campaign Ledger route contracts.
- SQLite remains app-owned while its runtime implements Hyper-Dank lifecycle and provider-registry
  boundaries.
- Automation helpers now cover shared command execution, Pa11y target running, and HTTP readiness
  where the public contracts fit the local scripts.
- Compatibility tests import Hyper-Dank through public package paths and flag newly exported UI
  component names that overlap local Campaign Ledger components before they are reviewed.

## `sheet-0071` Package Update Audit

`sheet-0071` moves all four Hyper-Dank packages from the `0.1.0` line to the current npm-published
`0.2.0` line:

- `@macavitymadcap/hyper-dank-automation`
- `@macavitymadcap/hyper-dank-data`
- `@macavitymadcap/hyper-dank-transport`
- `@macavitymadcap/hyper-dank-ui`

Running the original `bun run update:hyper-dank` command against `^0.1.0` correctly reinstalled
`0.1.0`: for pre-1.0 packages, the caret range does not include the next minor line. The package
ranges were therefore bumped to `^0.2.0`, then the lockfile was refreshed and
`bun run test:hyper-dank` was rerun.

The `0.2.0` UI package already exports `Breadcrumbs`, so Campaign Ledger does not need an upstream
Hyper-Dank breadcrumb issue. This ticket deliberately keeps route markup unchanged because visible
breadcrumb adoption belongs to `sheet-0075`. The compatibility test now covers the public
`Breadcrumbs` contract so that planned ticket can replace local breadcrumb markup deliberately.

Newly available or reviewed UI primitives include `HxForm`, `ButtonGroup`, `Toolbar`, `PageHeader`,
`CheckboxField`, `TextareaField`, `SelectField`, `RadioGroup`, `ValidationSummary`, `SideNav`,
`StatusSummary`, `ScrollableTable`, and related display helpers. `HxForm` is relevant to the sheet
edit-control work in `sheet-0073`, but the current ticket defers those visible form swaps so package
adoption stays behaviour-preserving.

## Automated Acceptance

Run the full local gate:

```bash
bun run verify
```

That command covers:

| Check | Hyper-Dank adoption evidence |
| --- | --- |
| Typecheck and tests | Public package imports, local UI shims, transport-helper route behaviour, SQLite lifecycle/provider contracts, automation helpers, docs links, and unchanged app flows. |
| `bun run test:hyper-dank` | Public UI, data, transport, automation, and content imports, adopted UI shim boundaries, and unreviewed local/Hyper-Dank UI name overlaps. |
| Accessibility | Public home/login, local play, player roster, sheet, public rules list/detail, wiki, logout, Game Master campaign and roster, and admin pages still pass after shared package adoption. |
| MVP smoke | Seeded sign-in, public SRD rules, browser-local play, character creation, sheet tabs, private campaign rules, Mira content, wiki/assets, admin handoff, and logout protection still pass after shared package adoption. |
| Screenshots | Existing deliberate evidence in `docs/pr-screenshots/` covers the user-facing surfaces affected by the UI primitive migration. Routine `bun run verify` screenshots are written to a temporary directory to avoid changing those tracked PR images. |

## Remaining App-Owned Boundaries

- Campaign routes, permissions, validation, product copy, seed data, schema definitions, and
  repositories remain Campaign Ledger-owned.
- `Icon`, `Switch`, `Accordion`, and `PopoverMenu` remain local after review because their current
  Campaign Ledger behaviour and styling hooks are already accepted.
- Sheet-specific organisms, page components, dice controls, password flows, and Game Master campaign
  surfaces remain local unless a later Hyper-Dank release exposes a matching public contract.
- New Hyper-Dank package releases should be adopted deliberately with `bun run update:hyper-dank`,
  followed by compatibility review, `bun run verify`, and relevant screenshot evidence when visible
  UI changes.

## Deferred Follow-Ups

- The next product epic should cover GM/player visibility for private NPCs and unrevealed prep.
- Google Docs import remains a product integration follow-up for Game Master writing workflows.
- Local image asset handling should keep improving map/wiki thumbnails, detail views, and import
  ergonomics.
- Any future Hyper-Dank component overlap flagged by `bun run test:hyper-dank` should become either
  a migration ticket or an explicit local-boundary note.
