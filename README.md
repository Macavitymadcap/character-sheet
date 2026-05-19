# Character Sheet

A local-first D&D 5e character sheet app for Lynott Magulbisson, built as a Hono + HTMX + SQLite application.

The first MVP focuses on a small table: one player character, one Game Master, and one admin. It runs locally with SQLite, uses server-rendered HTML fragments for sheet interactions, and stores D&D 2014 rules data in structured database tables rather than treating markdown as the runtime source of truth. The group-use campaign work now adds multiple players, multiple campaign characters, local character creation, wiki pages, image assets, factions, faction choices, and session records.

For the architecture and data model, see [ARCHITECTURE.md](./ARCHITECTURE.md). For the contribution and ticket workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## MVP Scope

- Local SQLite persistence with enough data to support Lynott, a second seeded player, a Game Master, and an admin.
- Password-based local authentication with seeded users, sessions, admin invites, and admin-triggered password reset tokens.
- Role-based access:
  - Seeded players can manage their character roster, create manual campaign characters, read their own sheets, and update table-use state such as hit points, resources, conditions, equipment, rolls, rests, and player-visible notes.
  - The seeded Game Master can manage the campaign roster, create manual campaign characters for player members, read and update sheet state, manage player/Game Master notes, and maintain campaign session records.
  - The seeded admin can access the admin shell, create local invite tokens, and use the local password-reset token endpoint when a target user id is known.
- A mobile-first sheet page with sticky site and character headers, compact combat/resource controls, dark mode, and tabbed sheet sections.
- Structured D&D 2014 rules data seeded from local sources, normalised to the most recent 2014 official reprint where a rule appears in multiple books.
- British English in product copy, docs, code naming, and CSS custom properties.

The MVP remains intentionally local-first. Character deletion UI, richer rule-mechanics rendering, Railway deployment, and migration from SQLite to Postgres are deferred to later tickets or epics. The current schema and repositories already include the group-use foundations those flows will need.

## Stack

- [Bun](https://bun.sh/) for runtime, package management, TypeScript execution, and tests.
- [Hono](https://hono.dev/) for the HTTP app and route composition.
- [HTMX](https://htmx.org/) for server-rendered interaction contracts and fragment swaps.
- TypeScript + JSX for server-rendered components.
- SQLite through Bun's SQLite APIs for local persistence.
- Pa11y and screenshots for accessibility and visual review once the UI exists.

The app follows the `pace-calculator` template: runtime setup stays separate from `createApp()`, repositories hide database details from routes and components, components own semantic markup, and HTMX attributes make browser interaction visible in HTML. The current `pace-calculator` Hyper-Dank packages remain a pattern reference rather than runtime dependencies for this app.

## Local Setup

Install dependencies and start the local development server:

```bash
bun install
bun run dev
```

The development server should default to `http://localhost:3000`. The root page is public, keeps the shared header for signed-in users, and links to sign in or continue to the user's role workspace. The login route still sends users to their default role home after successful sign in:

| Role | Default route |
| --- | --- |
| Player | `/characters` |
| Game Master | `/campaigns/rovnost-shadows` |
| Admin | `/admin` |

After signing in as a seeded player, their roster and manual create-character form are available at `/characters`. Game Masters can manage the campaign roster and create characters for player members at `/campaigns/rovnost-shadows/characters`.

After signing in as the seeded Lynott player, Lynott's sheet is available at
`/sheet/lynott`. The sheet tab fragments are served from
`/sheet/lynott/tabs/:tabId` for HTMX swaps. Those swaps target only the active panel, so the sticky tab strip keeps its scroll position while the active tab state stays aligned with the displayed content.

The background tab is backed by structured `character_background_entries` rows seeded from Lynott's source notes, including personality, ideals, bonds, flaws, full backstory beats, false identities, NPCs, and rank structure. It also includes the character's primary Rovnost faction connection, with a player-editable or Game-Master-editable picker, connection note, faction summary, and wiki link.

The sheet header includes HTMX-backed hit point controls for current and temporary HP, condition chips with an add/remove popover, and an inspiration switch. Abilities, skills, tools, and attacks expose compact d20 popovers that can roll normal, advantage, or disadvantage with extra modifiers. Action, spellcasting, feature, and equipment resources use small HTMX controls so the active tab can refresh without replacing the sticky sheet tabs. Long rests recover hit points, spell slots, feature uses, and hit dice through a workspace-level HTMX swap so the compact header and active tab stay in sync. These flows mutate `character_resources` or `character_equipment`, refresh the relevant compact fragment, and keep the character summary hit point fields in sync.

The notes tab creates, updates, and deletes visible player or Game Master notes through HTMX panel refreshes. Player users can manage player-visible notes for their own characters; Game Masters can manage both player and Game Master notes for campaign characters.

The Game Master campaign page lists campaign session records and includes local forms for creating, updating, and deleting table prep or recap entries with player-visible or Game-Master-only visibility.

The local group-use workflow is ready for table rehearsal: seed the database, sign in as Lynott or Mira to create player-owned characters, use the Game Master account to manage the campaign roster, sessions, wiki pages, image assets, and faction context, and use the admin account to prepare invite and password-reset tokens. This remains a local MVP rather than a hosted deployment.

Current environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port used by Bun. |
| `HOST` | `0.0.0.0` | HTTP host used by Bun. |
| `DB_PATH` | `character-sheet.sqlite3` | SQLite database file path. |
| `SESSION_SECRET` | local development secret | Secret used for signed session cookies. |
| `CHARACTER_SHEET_ASSET_ROOT` | `data/assets` | Local root for app-managed campaign image assets. |

SQLite database files and sidecar files should remain ignored by Git.

Local seed users are available for development:

| Role | Email | Password |
| --- | --- | --- |
| Player | `lynott@example.local` | `password123` |
| Player | `mira@example.local` | `password123` |
| Game Master | `gm@example.local` | `password123` |
| Admin | `admin@example.local` | `password123` |

The seeded Rovnost campaign also includes initial roster, wiki, image asset, session, faction, and character faction-choice records. Image assets store app-managed relative storage keys such as `campaigns/rovnost-shadows/cover.png`; absolute local source paths are rejected by the schema.

## Scripts

Current scripts:

```bash
bun run db:bootstrap
bun run dev
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

`bun run verify` runs typecheck, component and route tests, documentation reference checks, accessibility checks, the group-use MVP smoke workflow, and screenshot capture in sequence.

`bun run test:a11y` starts an in-memory app on an available local port and runs Pa11y against public `/` and `/login`, player `/characters`, `/sheet/lynott`, `/rules`, `/rules/spell/bless`, `/campaigns/rovnost-shadows/wiki/factions-guide`, and `/logout`, Game Master `/campaigns/rovnost-shadows` and `/campaigns/rovnost-shadows/characters`, and admin `/admin`.

`bun run smoke:mvp` starts an in-memory app and walks the seeded group-use workflow: player login, roster character creation, manual sheet editing, resource mutation, player notes, faction selection, every sheet tab fragment, SRD fixture import, rules browsing, sheet rule links, logout protection, Game Master roster creation, campaign session creation, wiki reads and writes, image upload, and admin invite/password-reset preparation.

`bun run screenshots:sheet` captures Lynott's sheet in light and dark mode, the Background tab faction picker, the player roster, the Game Master campaign page, rules list/detail pages, a wiki page with image references, and an edited sheet state. Screenshots are written to `docs/pr-screenshots/` by default, which is ignored by Git. Set `SCREENSHOT_DIR` to write them elsewhere.

`bun run import:rules` imports local markdown or JSON rule files from `docs/rules` by default into the configured SQLite database. Pass a path to import one file or directory:

```bash
bun run import:rules -- docs/rules/spells/level-1/cure-wounds.md
```

Repository maintenance scripts:

```bash
bun run protect:branches:bootstrap
bun run protect:branches
```

`import:rules` is intentionally local-first. It reads local markdown or JSON exports, transforms American English spellings to British English where safe, and seeds structured database tables. The next rules epic expands this boundary to the full SRD 5.1 local corpus rather than live-fetching from external rules sites.

The SRD import contract is documented in [SRD 5.1 Rules Import Contract](./docs/rules-srd-import.md). `docs/rules/srd-5.1-fixtures/` contains small parser-contract fixtures only; the full SRD corpus must live under `docs/rules/srd-5.1/` before the SRD epic can be accepted as complete. Existing Lynott rules from non-SRD sources remain supported as local or third-party rule-source categories.

Signed-in users can browse imported rules at `/rules`, filter by type, spell level, equipment category, and search text, and open detail pages such as `/rules/spell/bless`. Sheet spell and feature entries link back to their rule detail pages where imported rule links exist.

## Deployment Readiness

The current app is ready for fresh local checkout, seed, verification, and table-use rehearsal with SQLite and local asset storage. The roadmap now reserves `sheet-0020` for full SRD 5.1 rules and functionality, `sheet-0030` for Railway deployment with seeded hosted accounts/passwords, and `sheet-0040` for Hyper-Dank package adoption.

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
