# Character Sheet

A local-first D&D 5e character sheet app for Lynott Magulbisson, built as a Hono + HTMX + SQLite application.

The first MVP focuses on a small table: one player character, one Game Master, and one admin. It will run locally with SQLite, use server-rendered HTML fragments for sheet interactions, and store D&D 2014 rules data in structured database tables rather than treating markdown as the runtime source of truth.

For the architecture and data model, see [ARCHITECTURE.md](./ARCHITECTURE.md). For the contribution and ticket workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## MVP Scope

- Local SQLite persistence with enough data to support Lynott, a Game Master, and an admin.
- Password-based local authentication with seeded users, sessions, admin invites, and admin-triggered password reset tokens.
- Role-based access:
  - The seeded player can read Lynott's sheet and update table-use state such as hit points, resources, conditions, equipment, rolls, rests, and their existing player note.
  - The seeded Game Master can read and update Lynott's sheet state and existing player/Game Master notes, and can view the seeded campaign shell.
  - The seeded admin can access the admin shell, create local invite tokens, and use the local password-reset token endpoint when a target user id is known.
- A mobile-first sheet page with sticky site and character headers, compact combat/resource controls, dark mode, and tabbed sheet sections.
- Structured D&D 2014 rules data seeded from local sources, normalised to the most recent 2014 official reprint where a rule appears in multiple books.
- British English in product copy, docs, code naming, and CSS custom properties.

The MVP is intentionally a seeded local sheet, not a full group-management app. Character creation/deletion, campaign session management, note creation beyond seeded notes, admin user/read tables, richer rule-mechanics rendering, Railway deployment, and migration from SQLite to Postgres are deferred to later epics.

## Stack

- [Bun](https://bun.sh/) for runtime, package management, TypeScript execution, and tests.
- [Hono](https://hono.dev/) for the HTTP app and route composition.
- [HTMX](https://htmx.org/) for server-rendered interaction contracts and fragment swaps.
- TypeScript + JSX for server-rendered components.
- SQLite through Bun's SQLite APIs for local persistence.
- Pa11y and screenshots for accessibility and visual review once the UI exists.

The app follows the `pace-calculator` template: runtime setup stays separate from `createApp()`, repositories hide database details from routes and components, components own semantic markup, and HTMX attributes make browser interaction visible in HTML.

## Local Setup

Install dependencies and start the local development server:

```bash
bun install
bun run dev
```

The development server should default to `http://localhost:3000`. The root page is public, keeps the shared header for signed-in users, and links to sign in or continue to the user's role workspace. The login route still sends users to their default role home after successful sign in:

| Role | Default route |
| --- | --- |
| Player | `/sheet/lynott` |
| Game Master | `/campaigns/rovnost-shadows` |
| Admin | `/admin` |

After signing in as the seeded player, Lynott's sheet is available at
`/sheet/lynott`. The sheet tab fragments are served from
`/sheet/lynott/tabs/:tabId` for HTMX swaps. Those swaps target only the active panel, so the sticky tab strip keeps its scroll position while the active tab state stays aligned with the displayed content.

The background tab is backed by structured `character_background_entries` rows seeded from Lynott's source notes, including personality, ideals, bonds, flaws, full backstory beats, false identities, NPCs, and rank structure.

The sheet header includes HTMX-backed hit point controls for current and temporary HP, condition chips with an add/remove popover, and an inspiration switch. Abilities, skills, tools, and attacks expose compact d20 popovers that can roll normal, advantage, or disadvantage with extra modifiers. Action, spellcasting, feature, and equipment resources use small HTMX controls so the active tab can refresh without replacing the sticky sheet tabs. Long rests recover hit points, spell slots, feature uses, and hit dice through a workspace-level HTMX swap so the compact header and active tab stay in sync. These flows mutate `character_resources` or `character_equipment`, refresh the relevant compact fragment, and keep the character summary hit point fields in sync.

The notes tab saves visible player or Game Master notes through HTMX panel refreshes. Player users can edit their player-visible note; Game Masters can edit both player and Game Master notes for the campaign sheet.

Current environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port used by Bun. |
| `HOST` | `0.0.0.0` | HTTP host used by Bun. |
| `DB_PATH` | `character-sheet.sqlite3` | SQLite database file path. |
| `SESSION_SECRET` | local development secret | Secret used for signed session cookies. |

SQLite database files and sidecar files should remain ignored by Git.

Local seed users are available for development:

| Role | Email | Password |
| --- | --- | --- |
| Player | `lynott@example.local` | `password123` |
| Game Master | `gm@example.local` | `password123` |
| Admin | `admin@example.local` | `password123` |

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

`bun run verify` runs typecheck, component and route tests, accessibility checks, the MVP smoke workflow, and sheet screenshot capture in sequence.

`bun run test:a11y` starts an in-memory app on an available local port and runs Pa11y against public `/`, `/login`, authenticated `/sheet/lynott`, authenticated `/logout`, authenticated `/campaigns/rovnost-shadows`, and authenticated `/admin`.

`bun run smoke:mvp` starts an in-memory app and walks the seeded local workflow: login as Lynott, open the sheet, mutate hit points, save a seeded player note, render every sheet tab fragment, logout, verify the protected sheet redirects, then login as Game Master and admin to check their role pages.

`bun run screenshots:sheet` captures Lynott's sheet in light and dark mode. Screenshots are written to `docs/pr-screenshots/` by default, which is ignored by Git. Set `SCREENSHOT_DIR` to write them elsewhere.

`bun run import:rules` imports local markdown or JSON rule files from `docs/rules` by default into the configured SQLite database. Pass a path to import one file or directory:

```bash
bun run import:rules -- docs/rules/spells/level-1/cure-wounds.md
```

Repository maintenance scripts:

```bash
bun run protect:branches:bootstrap
bun run protect:branches
```

`import:rules` is intentionally local-first. It reads local markdown or JSON exports, transforms American English spellings to British English where safe, and seeds structured database tables. Direct fetching from 5e.tools can be added after the local importer boundary is stable.

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
