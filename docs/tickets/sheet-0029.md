# Ticket sheet-0029: SRD Player Experience Hardening

## Summary

Harden the SRD rules experience after the initial rules browsing slice so the epic lands as a
player-ready table tool rather than a foundation-only implementation.

This ticket converts the `sheet-0023`-through-`sheet-0028` review notes into the final SRD epic
hardening pass. It focuses on mobile usability, rule detail ergonomics, seeded character accuracy,
and obvious local setup gaps before the roadmap moves on to Railway deployment in `sheet-0030`.

## Implementation

- Fix the seeded campaign image experience for `/campaigns/rovnost-shadows` so a fresh local app does
  not render broken image references. Use committed placeholders, a deterministic local seed asset
  flow, or an explicit empty/fallback state that matches the current asset model.
- Improve mobile sheet ergonomics on `/sheet/:characterRef`:
  - Replace cramped inline edit disclosures for feature, score, and proficiency edits with
    button-triggered HTMX edit forms.
  - Swap the edit form into the relevant row or panel region.
  - Support submit and cancel paths that restore the read state without a full page reload.
  - Restyle the edit controls so they match the current sheet theme on narrow and desktop viewports.
- Improve dice and proficiency affordances:
  - Position roll results predictably, either near the triggering control or centred in the viewport
    on small screens.
  - Clean up dense skill and tool roll columns so action controls remain readable on mobile.
- Add route/history affordances for sheet tabs:
  - Support stable tab URLs such as `/sheet/:characterRef/core` and `/sheet/:characterRef/actions`,
    or an equivalent route shape that matches existing route conventions.
  - Ensure HTMX tab changes update browser history and refresh onto the selected tab.
  - Add a visible back link or breadcrumb path from sheets to `/characters`.
- Make seeded character rule data credible:
  - Ensure `/sheet/mira-voss` does not present incorrect human cleric rules/actions.
  - Prefer linking the seed character to the correct available SRD human, cleric, spell, equipment,
    and action rules.
  - If complete automatic grants are still outside scope, make the limitation explicit in seed data,
    UI copy, or docs so the sheet does not look accidentally wrong.
- Preserve existing non-SRD table content:
  - Keep Lynott's Artificer, Hobgoblin, and local campaign rules visible.
  - Store SRD, local campaign, and third-party/non-SRD sources as distinct source categories.
  - Do not relabel non-SRD content as SRD, and do not delete it while adding SRD coverage.
- Refine `/rules` navigation and details:
  - Keep the rules filter/search form available across list and detail surfaces, with a clear reset
    or back path.
  - Use HTMX result-detail swapping or a consistent detail route layout so selecting a rule does not
    feel like leaving the search workflow.
  - Flesh out rule detail rendering enough for imported SRD rules to be readable in play, including
    type-appropriate metadata for spells, equipment, conditions, actions, features, and core rules.
- Reduce page density where it blocks use:
  - Move character creation away from the `/characters` roster into `/characters/new` or an
    equivalent route if the roster remains crowded.
  - Split the campaign page into focused subpages or tab routes for overview, wiki, sessions, assets,
    and table-facing material where that is needed to keep the SRD workflow usable.

## Interfaces And Routes

- Preserve existing routes while adding canonical, refreshable routes for new surfaces.
- Preserve existing HTMX mutation endpoints unless replacing them with more focused edit-fragment
  routes.
- Keep `character_rule_links` as the sheet-to-rule connection point.
- Keep Railway, Postgres, hosted asset storage, production secrets, email delivery, and Hyper-Dank
  package adoption out of this ticket.

## Tests First

- Add route/component coverage for sheet tab canonical URLs, history behaviour, and invalid tab
  fallback.
- Add HTMX route tests for edit-form open, submit, and cancel flows.
- Add repository or seed tests that prove Mira's seeded rules/actions are credible for the available
  SRD data.
- Add rules route/component coverage for persistent filters, reset/back behaviour, and rule detail
  rendering.
- Add smoke coverage for the player path: open characters, open a sheet tab through a stable URL,
  follow a sheet rule link, search rules, and return to the character context.
- Add screenshot and accessibility coverage for mobile sheet editing, rules list/detail navigation,
  and the campaign image fallback or seeded image state.

## Acceptance Criteria

- A fresh local run does not show broken seeded campaign images on `/campaigns/rovnost-shadows`.
- Sheet editing, dice results, skill/tool controls, and tab navigation are usable on mobile and
  desktop.
- Sheet tabs have refreshable URLs and a visible path back to the characters list.
- Mira's human cleric seed data is either SRD-credible or explicitly marked as intentionally partial.
- Lynott's non-SRD/local rules remain visible and are clearly stored separately from SRD content.
- Rules search and detail views keep players oriented and expose enough rule text and metadata for
  table use.
- The SRD epic is ready to land as the player-value roadmap slice before `sheet-0030` begins.

## Implementation Notes

- Added refreshable sheet tab URLs such as `/sheet/lynott/actions` while preserving the existing
  HTMX fragment endpoints under `/sheet/:characterRef/tabs/:tabId`.
- Sheet tab links now push the canonical tab URL into browser history and sheet pages include a
  breadcrumb link back to `/characters`.
- The player and Game Master rosters now link to separate character creation routes while preserving
  the existing POST endpoints.
- Rules detail pages now keep the filter/search form available, include a reset action, and show a
  breadcrumb back to the rule type list.
- Missing seeded campaign asset files now return a readable SVG fallback instead of a broken image
  response.
- Rule sources now carry a content category (`srd`, `local`, or `third_party`) so SRD imports can
  coexist with Lynott's current non-SRD rules without mislabelling or deleting them.
- Added the local SRD 5.1 corpus under `docs/rules/srd-5.1/` with attribution, and added importer
  acceptance coverage for the full corpus rather than the fixture folder alone.
- Full inline edit-form replacement, dice popover placement, campaign subpage splitting, and deeper
  Mira SRD automation are promoted to `sheet-0031`, the named pre-deployment SRD
  player-experience follow-up in the `sheet-0030` Railway deployment epic.
