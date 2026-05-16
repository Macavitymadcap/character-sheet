# Character Sheet

A local-first D&D 5e character sheet app for Lynott Magulbisson, built as a Hono + HTMX + SQLite application.

The first MVP focuses on a small table: one player character, one Game Master, and one admin. It will run locally with SQLite, use server-rendered HTML fragments for sheet interactions, and store D&D 2014 rules data in structured database tables rather than treating markdown as the runtime source of truth.

For the architecture and data model, see [ARCHITECTURE.md](./ARCHITECTURE.md). For the contribution and ticket workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## MVP Scope

- Local SQLite persistence with enough data to support Lynott, a Game Master, and an admin.
- Password-based local authentication with seeded users, sessions, admin invites, and admin-triggered password reset tokens.
- Role-based access:
  - Player users can create, read, update, and delete their own sheet data.
  - Game Masters can manage all character sheets and campaign/session notes.
  - Admins can manage invites, password resets, and basic administrative reads.
- A sheet page with sticky site and character headers, labelled combat/state outputs, and tabbed sheet sections.
- Structured D&D 2014 rules data seeded from local sources, normalised to the most recent 2014 official reprint where a rule appears in multiple books.
- British English in product copy, docs, code naming, and CSS custom properties.

Deployment to Railway and migration from SQLite to Postgres are intentionally deferred to a later epic.

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

The development server should default to `http://localhost:3000`.

Current environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port used by Bun. |
| `HOST` | `0.0.0.0` | HTTP host used by Bun. |
| `DB_PATH` | `character-sheet.sqlite3` | SQLite database file path. |

Environment variables planned for later MVP tickets:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | local development secret | Secret used for signed session cookies. |

SQLite database files and sidecar files should remain ignored by Git.

## Scripts

Current scaffold scripts:

```bash
bun run db:bootstrap
bun run dev
bun run seed
bun run test
bun run test:a11y
bun run test:watch
bun run typecheck
```

Repository maintenance scripts:

```bash
bun run protect:branches:bootstrap
bun run protect:branches
```

Planned later scripts:

```bash
bun run import:rules
```

`import:rules` is planned as a local-first importer. It should read local markdown or JSON exports, transform American English spellings to British English where needed, and seed structured database tables. Direct fetching from 5e.tools can be added after the local importer boundary is stable.

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
