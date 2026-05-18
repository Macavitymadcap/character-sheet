# Epic sheet-0020: Full SRD 5.1 Rules And Functionality

## Summary

Make Character Sheet rules/functionality complete for table play by importing and exposing the full
SRD 5.1 rules corpus from local source files, rendering it in the app, and connecting those rules to
character sheets. This epic prioritises player and Game Master value before deployment and
Hyper-Dank platform adoption.

The work remains local-first during this epic. Railway deployment, Postgres, production secrets,
hosted asset storage, email delivery, and Hyper-Dank package adoption are deliberately deferred to
`sheet-0030` and `sheet-0040`.

## Goals

- Import the full SRD 5.1 corpus from local files through the existing importer boundary.
- Cover the rule types needed for a functionally complete table experience: classes, subclasses
  where SRD provides them, species/races, backgrounds, feats where present, spells, equipment,
  weapons, armour, adventuring gear, conditions, actions, senses, proficiencies, and core rules.
- Add browseable rules pages with useful filtering, search, source metadata, and detail rendering.
- Link imported rules into character sheets through `character_rule_links` so players can open
  class features, species traits, background features, spells, equipment, and conditions from tabs.
- Expand sheet functionality enough that SRD data is useful in play without committing to a full
  guided character builder.
- Keep source attribution and SRD provenance auditable.

## Non-Goals

- No live fetching from 5e.tools or external rules sites.
- No Railway deployment, Postgres migration, production secret, hosted asset, or email-delivery
  work.
- No Hyper-Dank package migration or shared-library compatibility gate.
- No full guided character builder unless a ticket explicitly scopes a small selection workflow.
- No non-SRD commercial source import in this epic.

## Data And Interface Changes

- Extend the rules importer and repository read models to represent SRD 5.1 rule metadata, including
  type, slug, name, source, tags, class availability, spell level, school, equipment category, and
  searchable text where available.
- Preserve `rules_sources`, `rules_entities`, `rule_mechanics`, and `character_rule_links` as the
  primary runtime tables; add only small metadata fields/tables when filtering or sheet linking
  needs them.
- Add routes for rules browsing and details:
  - `/rules`
  - `/rules/:entityType`
  - `/rules/:entityType/:slug`
- Add sheet-local rule-link surfaces or mutation routes only where they support a focused play
  workflow, such as prepared/known spells, equipment references, conditions, and visible features.
- Keep `bun run import:rules` as the local SRD import command, with fixtures and docs describing the
  expected SRD source folder shape.

## Ticket Map

| Ticket | Purpose |
| --- | --- |
| `sheet-0021` | Define the SRD 5.1 source layout, importer contract, provenance handling, and seed strategy. |
| `sheet-0022` | Expand importer/parser support for SRD rule types and searchable metadata. |
| `sheet-0023` | Add rules repository read models, filtering, search, and source precedence tests. |
| `sheet-0024` | Build rules list/detail pages with accessible filters and compact rule rendering. |
| `sheet-0025` | Link sheet features, species traits, backgrounds, spells, equipment, and conditions to rules. |
| `sheet-0026` | Add focused SRD-backed play workflows without a full guided character builder. |
| `sheet-0027` | Expand smoke, accessibility, screenshot, and documentation coverage for the rules experience. |
| `sheet-0028` | Complete final SRD import verification, acceptance notes, and follow-up boundaries. |

## Branch Strategy

Create `sheet-0020` from the latest `main`. Open the planning pull request into `main`. Once
accepted, keep or recreate `sheet-0020` as the epic integration branch. Tickets `sheet-0021`
through `sheet-0028` should branch from `sheet-0020`, open pull requests back into `sheet-0020`,
and be squash-merged there before the epic lands on `main`.

`sheet-0030` is reserved for Railway deployment after this epic lands. `sheet-0040` is reserved for
Hyper-Dank platform adoption after the app has SRD functionality and a deployment path.

## Test And Verification Strategy

- Importer tests cover representative SRD source files for spells, classes, species/races,
  backgrounds, equipment, conditions, actions, senses, proficiencies, and core rules.
- Schema and repository tests cover idempotent imports, provenance, filtering, search, source
  precedence, and character rule links.
- Route tests cover signed-in rules browsing, public-safe route behaviour, bad slugs, filters, and
  sheet-linked rule access.
- Component tests cover rules lists, filters, detail rendering, rule links in sheet tabs, empty
  states, and dense mobile layout.
- Accessibility and screenshot checks cover the rules index, filtered rules list, rule detail page,
  and a sheet tab with SRD links.
- Smoke coverage proves a player can find a rule, open it from a sheet tab, and continue the
  existing group-use workflow.
- `bun run verify` remains the source-code acceptance command.

## Acceptance Criteria

- A fresh local checkout can import the full SRD 5.1 local corpus idempotently.
- Players and Game Masters can browse, search, filter, and read imported SRD rules in the app.
- Character sheet tabs expose useful links to the rules that apply to the current character.
- SRD-backed functionality improves table play without forcing a full guided builder.
- Docs clearly position Railway deployment as `sheet-0030` and Hyper-Dank adoption as `sheet-0040`.
