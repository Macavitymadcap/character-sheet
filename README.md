# Campaign Ledger

A local-first D&D 5e campaign ledger for character sheets, campaign records, and table-use rules, built as a Hono + HTMX + SQLite application.

The first MVP focuses on a small table: player characters, one Game Master, and one admin. It runs locally with SQLite, uses server-rendered HTML fragments for sheet interactions, and stores D&D 2014 rules data in structured database tables rather than treating markdown as the runtime source of truth. The campaign companion work now adds public SRD rules, browser-local play tools, multiple players, multiple campaign characters, local character creation, wiki pages, image assets, factions, faction choices, session records, campaign-scoped private rules, and compact table-use UX.

For the architecture and data model, see [ARCHITECTURE.md](./ARCHITECTURE.md). For the contribution and ticket workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## MVP Scope

- Local SQLite persistence with enough data to support Lynott, a second seeded player, a Game Master, and an admin.
- Password-based local authentication with seeded users, sessions, admin invites, and admin-triggered password reset tokens.
- Public SRD rules browsing and browser-local character/campaign tracking with versioned export/import for signed-out visitors.
- Role-based access:
  - Seeded players can manage their character roster, create manual campaign characters, read their own sheets, and update table-use state such as hit points, resources, conditions, equipment, rolls, rests, and player-visible notes.
  - The seeded Game Master can manage the campaign roster, create manual campaign characters for player members, read and update sheet state, manage player/Game Master notes, and maintain campaign session records.
  - The seeded admin can access the admin shell, create local invite links, prepare password reset links, and also keep player or Game Master campaign membership when explicitly granted.
- A mobile-first sheet page with sticky site and character headers, compact combat/resource controls, dark mode, and tabbed sheet sections.
- Structured D&D 2014 rules data seeded from local sources, normalised to the most recent 2014 official reprint where a rule appears in multiple books, with public SRD visibility separated from local/private campaign material.
- British English in product copy, docs, code naming, and CSS custom properties.

The MVP remains intentionally local-first in its data model, while `sheet-0030` adds the first Railway hosted-rehearsal path and `sheet-0050` completes the public campaign companion slice. Character deletion UI, campaign subpage splitting, hosted backup/reset automation, production email delivery, and migration from SQLite to Postgres are deferred to later tickets or epics. The current schema and repositories already include the group-use foundations those flows will need.

## Stack

- [Bun](https://bun.sh/) for runtime, package management, TypeScript execution, and tests.
- [Hono](https://hono.dev/) for the HTTP app and route composition.
- [HTMX](https://htmx.org/) for server-rendered interaction contracts and fragment swaps.
- TypeScript + JSX for server-rendered components.
- SQLite through Bun's SQLite APIs for local persistence.
- Pa11y and screenshots for accessibility and visual review once the UI exists.

The app follows the Hyper-Dank template lineage: runtime setup stays separate from `createApp()`, repositories hide database details from routes and components, components own semantic markup, and HTMX attributes make browser interaction visible in HTML. `sheet-0040` adopts the current Hyper-Dank packages as runtime dependencies where their public contracts fit Campaign Ledger.

`sheet-0041` started that adoption through Hyper-Dank's `hyper-dank-v2.3.1` local package tarballs
while the packages were unpublished. The packages are now available from npm as
`@macavitymadcap/hyper-dank-ui`, `@macavitymadcap/hyper-dank-data`,
`@macavitymadcap/hyper-dank-transport`, and `@macavitymadcap/hyper-dank-automation`, so fresh
installs resolve them from the registry through normal semver dependency ranges.
`bun run test:hyper-dank` verifies Campaign Ledger imports the shared packages through public
package paths only. Local wrappers around adopted UI primitives are compatibility shims for existing
Campaign Ledger import paths and CSS hooks; app-specific components, routes, repositories, seed data,
and product workflows stay local.

`bun install` keeps the exact Hyper-Dank versions pinned by `bun.lock`. To deliberately pick up newly
published Hyper-Dank patches, run `bun run update:hyper-dank`, review any compatibility failures, and
then run `bun run verify`. The compatibility check also fails when a newly exported Hyper-Dank UI
component overlaps a Campaign Ledger local component name that has not been reviewed yet.
[Hyper-Dank Adoption Acceptance](./docs/operations/hyper-dank-adoption-acceptance.md) records the
final package source, compatibility coverage, visual evidence, app-owned boundaries, and follow-ups.

## Local Setup

Install dependencies and start the local development server:

```bash
bun install
bun run dev
```

For a fresh local database, run `bun run seed` before signing in. App startup only applies schema bootstrap; it does not reseed mutable records.

The development server should default to `http://localhost:3000`. The root page is public, keeps the shared header for signed-in users, and links to public SRD rules, browser-local characters/campaigns, sign-in, or the user's role workspace. The login route still sends users to their default role home after successful sign in:

| Role | Default route |
| --- | --- |
| Player | `/characters` |
| Game Master | `/campaigns/rovnost-shadows` |
| Admin | `/admin` |

Signed-out visitors can browse public SRD rules at `/rules`, open public rule details such as `/rules/spell/bless`, and use browser-local play at `/local/characters` and `/local/campaigns`. Local-play data stays in browser storage until exported or imported by the user.

After signing in as a seeded player, their roster and manual create-character form are available at `/characters`. Game Masters can manage the campaign roster and create characters for player members at `/campaigns/rovnost-shadows/characters`.

After signing in as the seeded Lynott player, Lynott's sheet is available at
`/sheet/lynott`. The sheet tab fragments are served from
`/sheet/lynott/tabs/:tabId` for HTMX swaps. Those swaps target only the active panel, so the sticky tab strip keeps its scroll position while the active tab state stays aligned with the displayed content.

The background tab is backed by structured `character_background_entries` rows seeded from Lynott's source notes, including personality, ideals, bonds, flaws, full backstory beats, false identities, NPCs, and rank structure. It also includes the character's primary Rovnost faction connection, with a player-editable or Game-Master-editable picker, connection note, faction summary, and wiki link.

The sheet header includes HTMX-backed hit point controls for current and temporary HP, condition chips with an add/remove popover, and an inspiration switch. Abilities, skills, tools, and attacks expose compact d20 popovers that can roll normal, advantage, or disadvantage with extra modifiers. Action, spellcasting, feature, and equipment resources use small HTMX controls so the active tab can refresh without replacing the sticky sheet tabs. Long rests recover hit points, spell slots, feature uses, and hit dice through a workspace-level HTMX swap so the compact header and active tab stay in sync. These flows mutate `character_resources` or `character_equipment`, refresh the relevant compact fragment, and keep the character summary hit point fields in sync.

The notes tab creates, updates, and deletes visible player or Game Master notes through HTMX panel refreshes. Player users can manage player-visible notes for their own characters; Game Masters can manage both player and Game Master notes for campaign characters.

The Game Master campaign page lists campaign session records and includes local forms for creating, updating, and deleting table prep or recap entries with player-visible or Game-Master-only visibility.

The local group-use workflow is ready for table rehearsal: seed the database, sign in as Lynott or Mira to create player-owned characters, use the Game Master account to manage the campaign roster, sessions, wiki pages, image assets, private campaign rules sources, and faction context, and use the admin account to prepare invite and password-reset links. The hosted Railway work in `sheet-0030` rehearses that same MVP remotely without changing the local-first data model.

Current environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port used by Bun. |
| `HOST` | `0.0.0.0` | HTTP host used by Bun. |
| `DB_PATH` | `character-sheet.sqlite3` | SQLite database file path. |
| `SESSION_SECRET` | local development secret | Secret used for signed session cookies. |
| `CAMPAIGN_LEDGER_ASSET_ROOT` | `data/assets` | Root for app-managed campaign image assets; use `/data/assets` on Railway. |
| `CHARACTER_SHEET_ASSET_ROOT` | unset | Backwards-compatible alias for existing Railway/local asset configuration. |

SQLite database files and sidecar files should remain ignored by Git.

For Railway rehearsal setup, including hosted values for these variables, see [Railway Hosted Rehearsal](./docs/deployment/railway.md).
For manual hosted user preparation, invite handoff, and password-reset handoff, see [Hosted Account Operator Runbook](./docs/operations/hosted-account-runbook.md).
For the final local and hosted browser acceptance checklist, see [Hosted Rehearsal Acceptance](./docs/operations/hosted-rehearsal-acceptance.md). For the completed campaign companion epic acceptance record, see [Campaign Companion Acceptance](./docs/operations/campaign-companion-acceptance.md).

Local seed users are available for development:

| Role | Email | Password |
| --- | --- | --- |
| Player | `lynott@example.local` | `password123` |
| Player | `mira@example.local` | `password123` |
| Game Master | `gm@example.local` | `password123` |
| Admin | `admin@example.local` | `password123` |

The seeded Rovnost campaign also includes initial roster, wiki, image asset, session, faction, and character faction-choice records. Image assets store app-managed relative storage keys such as `campaigns/rovnost-shadows/cover.png`; absolute local source paths are rejected by the schema. Hosted preparation writes deterministic placeholder files for seeded campaign assets under `CAMPAIGN_LEDGER_ASSET_ROOT`, falling back to `CHARACTER_SHEET_ASSET_ROOT` for existing environments, and missing seeded files render a readable protected fallback instead of a broken image.

## Rename Notes

The product and package name is Campaign Ledger. Existing local checkouts and the GitHub repository may still live at `character-sheet` until renamed outside a code PR. When that rename happens, update the GitHub repository name, then rename the local folder or reclone from the new remote URL. Runtime paths such as `character-sheet.sqlite3`, existing session cookies, and the compatibility asset-root variable are intentionally preserved by this ticket so current local and Railway data keeps working.

## Scripts

Current scripts:

```bash
bun run db:bootstrap
bun run dev
Command variants:
bun run hosted:data -- migrate
bun run hosted:data -- prepare
bun run hosted:data -- backup
bun run hosted:data -- restore
bun run import:rules
bun run seed
bun run screenshots:sheet
bun run smoke:mvp
bun run test
bun run test:a11y
bun run test:watch
bun run typecheck
bun run verify
```

`bun run verify` runs typecheck, component and route tests, documentation reference checks, accessibility checks, the group-use MVP smoke workflow, and screenshot capture in sequence. It writes verification screenshots to a temporary directory by default so acceptance runs do not churn committed PR evidence images. It is the local acceptance gate for the first hosted rehearsal.

`bun run hosted:data -- migrate` applies the SQLite schema without seed data, which is what normal hosted startup relies on. `prepare`, `backup`, and `restore` are reserved for hosted rehearsal operations and are documented in [Railway Hosted Rehearsal](./docs/deployment/railway.md).

Hosted account setup stays manual for this epic. Admin-created invite and password-reset links are copied from the admin UI and shared privately by the operator; no email delivery is implied or configured. See [Hosted Account Operator Runbook](./docs/operations/hosted-account-runbook.md).

`bun run test:a11y` starts an in-memory app on an available local port and runs Pa11y against public `/`, `/login`, `/local/characters`, `/local/campaigns`, `/rules`, and `/rules/spell/bless`, player `/characters`, `/sheet/lynott`, `/campaigns/rovnost-shadows/wiki/factions-guide`, and `/logout`, Game Master `/campaigns/rovnost-shadows` and `/campaigns/rovnost-shadows/characters`, and admin `/admin`.

`bun run smoke:mvp` starts an in-memory app and walks the seeded group-use workflow: player login, roster character creation, manual sheet editing, resource mutation, player notes, faction selection, every sheet tab fragment, full SRD import, public and signed-in rules browsing, browser-local play export/import, sheet rule links, logout protection, Game Master roster creation, campaign session creation, wiki reads and writes, campaign private rules, protected seeded asset reads, image upload, combined admin campaign access, and admin invite/password-reset handoff.

`bun run screenshots:sheet` captures public home, local play, Lynott's sheet in light and dark mode, core/skills edit states, roll results, Mira spellcasting, the Background tab faction picker, player and admin roster/cards, the Game Master campaign page, campaign assets and rules sources, rules list/detail pages, a wiki page with image references, and edited sheet states. Screenshots are written to `docs/pr-screenshots/` by default for deliberate PR evidence refreshes. Set `SCREENSHOT_DIR` to write them elsewhere.

`bun run import:rules` imports local markdown or JSON rule files from `docs/rules` by default into the configured SQLite database. Pass a path to import one file or directory:

```bash
bun run import:rules -- docs/rules/spells/level-1/cure-wounds.md
```

Repository maintenance scripts:

```bash
bun run protect:branches:bootstrap
bun run protect:branches
```

`import:rules` is intentionally local-first. It reads local markdown or JSON exports, transforms American English spellings to British English where safe, and seeds structured database tables. The SRD corpus is local rather than live-fetched from external rules sites.

The SRD import contract is documented in [SRD 5.1 Rules Import Contract](./docs/rules-srd-import.md). The full local SRD corpus lives under `docs/rules/srd-5.1/`; `docs/rules/srd-5.1-fixtures/` contains small parser-contract fixtures only. Existing Lynott rules from non-SRD sources remain supported as local or third-party rule-source categories.

Public users can browse SRD rules at `/rules`, filter by type, spell level, equipment category, and search text, and open public detail pages such as `/rules/spell/bless`. Signed-in campaign members can also see permitted local or campaign-scoped private sources. Sheet spell and feature entries link back to their rule detail pages where imported rule links exist.

## Deployment Readiness

The current app is ready for fresh local checkout, seed, verification, Railway deployment rehearsal, and table-use rehearsal with SQLite, Railway volume-backed asset storage, manual hosted account handoff, imported SRD 5.1 rules, public browser-local play, campaign-scoped private rules, richer Mira sheet data, and compact table-use surfaces. `sheet-0020` completed the SRD rules roadmap slice. `sheet-0030` completed the Railway rehearsal path; the first runtime configuration lives in [`railway.json`](./railway.json), with service setup documented in [Railway Hosted Rehearsal](./docs/deployment/railway.md) and final acceptance in [Hosted Rehearsal Acceptance](./docs/operations/hosted-rehearsal-acceptance.md). `sheet-0050` completed the campaign companion, public play, and rules-content product slice. The next planned epic is `sheet-0040` Hyper-Dank package adoption so future Game Master prep work can build on shared framework primitives instead of expanding app-local scaffolding.

## TDD Approach

Development tickets should be implemented tests first wherever the boundary is testable:

- Repository and schema tests use in-memory SQLite before production repository code is written.
- Services and importers get parser, normalisation, and seed-data tests before implementation.
- Routes get Hono `app.request()` tests for full pages, redirects, permissions, validation errors, and HTMX fragments before route handlers are filled in.
- Components get JSX render tests for semantic HTML, headings, labels, ARIA, HTMX attributes, empty states, and error states before component markup is completed.
- User-facing UI changes add accessibility checks and screenshots after the lower-level tests pass.

## Current Planning Documents

- [Source prompt](./docs/sheet-0001-prompt.md)
- [Epic sheet-0001](./docs/epics/sheet-0001.md)
- [Ticket sheet-0002](./docs/tickets/sheet-0002.md)
- [Ticket sheet-0003](./docs/tickets/sheet-0003.md)
- [Ticket sheet-0004](./docs/tickets/sheet-0004.md)
- [Ticket sheet-0005](./docs/tickets/sheet-0005.md)
- [Ticket sheet-0006](./docs/tickets/sheet-0006.md)
- [Ticket sheet-0007](./docs/tickets/sheet-0007.md)
- [Ticket sheet-0008](./docs/tickets/sheet-0008.md)
- [Ticket sheet-0009](./docs/tickets/sheet-0009.md)
- [Ticket sheet-0010](./docs/tickets/sheet-0010.md)
- [Epic sheet-0011](./docs/epics/sheet-0011.md)
- [Ticket sheet-0012](./docs/tickets/sheet-0012.md)
- [Ticket sheet-0013](./docs/tickets/sheet-0013.md)
- [Ticket sheet-0014](./docs/tickets/sheet-0014.md)
- [Ticket sheet-0015](./docs/tickets/sheet-0015.md)
- [Ticket sheet-0016](./docs/tickets/sheet-0016.md)
- [Ticket sheet-0017](./docs/tickets/sheet-0017.md)
- [Ticket sheet-0018](./docs/tickets/sheet-0018.md)
- [Ticket sheet-0019](./docs/tickets/sheet-0019.md)
- [Epic sheet-0020](./docs/epics/sheet-0020.md)
- [Ticket sheet-0021](./docs/tickets/sheet-0021.md)
- [Ticket sheet-0022](./docs/tickets/sheet-0022.md)
- [Ticket sheet-0023](./docs/tickets/sheet-0023.md)
- [Ticket sheet-0024](./docs/tickets/sheet-0024.md)
- [Ticket sheet-0025](./docs/tickets/sheet-0025.md)
- [Ticket sheet-0026](./docs/tickets/sheet-0026.md)
- [Ticket sheet-0027](./docs/tickets/sheet-0027.md)
- [Ticket sheet-0028](./docs/tickets/sheet-0028.md)
- [Ticket sheet-0029](./docs/tickets/sheet-0029.md)
- [Epic sheet-0030](./docs/epics/sheet-0030.md)
- [Ticket sheet-0031](./docs/tickets/sheet-0031.md)
- [Ticket sheet-0032](./docs/tickets/sheet-0032.md)
- [Ticket sheet-0033](./docs/tickets/sheet-0033.md)
- [Ticket sheet-0034](./docs/tickets/sheet-0034.md)
- [Ticket sheet-0035](./docs/tickets/sheet-0035.md)
- [Ticket sheet-0036](./docs/tickets/sheet-0036.md)
- [Ticket sheet-0037](./docs/tickets/sheet-0037.md)
- [Epic sheet-0040](./docs/epics/sheet-0040.md)
- [Ticket sheet-0041](./docs/tickets/sheet-0041.md)
- [Ticket sheet-0042](./docs/tickets/sheet-0042.md)
- [Ticket sheet-0043](./docs/tickets/sheet-0043.md)
- [Ticket sheet-0044](./docs/tickets/sheet-0044.md)
- [Ticket sheet-0045](./docs/tickets/sheet-0045.md)
- [Ticket sheet-0046](./docs/tickets/sheet-0046.md)
- [Ticket sheet-0047](./docs/tickets/sheet-0047.md)
- [Epic sheet-0050](./docs/epics/sheet-0050.md)
- [Ticket sheet-0051](./docs/tickets/sheet-0051.md)
- [Ticket sheet-0052](./docs/tickets/sheet-0052.md)
- [Ticket sheet-0053](./docs/tickets/sheet-0053.md)
- [Ticket sheet-0054](./docs/tickets/sheet-0054.md)
- [Ticket sheet-0055](./docs/tickets/sheet-0055.md)
- [Ticket sheet-0056](./docs/tickets/sheet-0056.md)
- [Ticket sheet-0057](./docs/tickets/sheet-0057.md)
- [Ticket sheet-0058](./docs/tickets/sheet-0058.md)
- [Ticket sheet-0059](./docs/tickets/sheet-0059.md)
- [Ticket sheet-0060](./docs/tickets/sheet-0060.md)
- [Epic sheet-0061](./docs/epics/sheet-0061.md)
