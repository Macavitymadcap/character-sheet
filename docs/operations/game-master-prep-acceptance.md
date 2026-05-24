# Game Master Prep Acceptance

This checklist is the final acceptance note for the `sheet-0061` Game Master prep epic after
`sheet-0062` through `sheet-0068` have landed and `sheet-0069` has completed the handoff review.
It records the delivered table-prep scope, verification evidence, screenshot coverage, GitHub
Project state, and follow-up boundaries before the epic branch merges back to `main`.

## Delivered Scope

- Game Masters now have a focused prep workspace for Rovnost campaign management.
- NPC dossiers support private, public, and selected-player visibility with player-safe summaries,
  private notes, secrets, motivations, hooks, scene notes, reveal notes, portrait links, wiki links,
  and optional rules/stat-block links.
- Players only see public NPCs or NPCs selected for them; private dossier fields remain hidden from
  player routes and the Game Master player-preview view.
- Campaign wiki pages, sessions, images, notes, and imports keep player-visible and Game-Master-only
  visibility explicit in data reads and UI labels.
- The player-preview route lets the Game Master audit player-visible wiki pages, sessions, NPCs,
  character notes, and images before a session.
- The campaign image library renders seeded and uploaded images as thumbnail cards with detail
  pages, metadata, visibility status, fallback status, and wiki/NPC/faction usage links.
- Local image handling supports both bundled Rovnost seed assets under the app-managed asset root
  and Game Master uploads from this computer. The database stores app-managed relative storage keys,
  not absolute local source paths.
- Staged imports convert Markdown or a small safe HTML subset into campaign Markdown, preserve
  source metadata, remove private Google Drive or Docs URLs, preview the result, and save to wiki
  pages, session records, NPC dossiers, or retained drafts.
- Google Docs writing can be imported through the manual-export path at
  `/campaigns/rovnost-shadows/imports/google-docs`. The implemented boundary records
  `google_docs_manual` and `google-doc:<document-id>` metadata without live Drive credentials.
- Hyper-Dank package boundaries remain protected by compatibility tests, while campaign-specific
  routes, schema, repositories, seed data, permissions, and product copy stay app-owned.
- GitHub Issues, native sub-issues, the Campaign Ledger GitHub Project, branch names, PR links, and
  verification fields now track the epic and its tickets.

## Automated Acceptance

Run the full local gate:

```bash
bun run verify
```

That command covers:

| Check | Game Master prep evidence |
| --- | --- |
| Typecheck and tests | NPC schema and repository visibility, selected-player access, image storage and fallback reads, staged import conversion and persistence, Google Docs reference normalisation, route guards, player preview, docs links, and Hyper-Dank compatibility. |
| `bun run test:hyper-dank` | Public UI, data, transport, automation, and content package imports, adopted UI shim boundaries, and unreviewed local/Hyper-Dank UI name overlaps. |
| Accessibility | Public, player, Game Master, and admin routes, including prep workspace, player preview, NPC list/detail, image library/detail, staged imports, Google Docs manual import, and campaign roster. |
| MVP smoke | Seeded player and Game Master sign-in, roster creation, sheet edits, notes, faction choice, sessions, wiki, private campaign rules, staged import, Google Docs manual import, protected seeded assets, image upload, combined admin campaign access, admin handoff, and logout protection. |
| Screenshots | Public home, sheet, roster, admin, GM campaign, prep workspace, player preview, NPC list/detail, image library/detail, import form, Google Docs import form, player NPC list, wiki image references, rules, faction, edit, roll, and dark-mode states. |

Routine `bun run verify` screenshots are written to a temporary directory to avoid changing tracked
PR evidence. Use `bun run screenshots:sheet` when a PR intentionally refreshes
`docs/pr-screenshots/`.

## PR Evidence

The epic PR body should link this acceptance note and curate the committed screenshot evidence into
reviewable groups:

| Surface | Evidence path |
| --- | --- |
| Prep, NPCs, and player preview | `docs/pr-screenshots/gm-prep-workspace-*.png`, `docs/pr-screenshots/gm-npc-*.png`, `docs/pr-screenshots/player-npc-list-*.png`, `docs/pr-screenshots/gm-player-preview-*.png` |
| Image library and detail | `docs/pr-screenshots/sheet-0066/*image-library*`, `docs/pr-screenshots/sheet-0066/*image-detail*` |
| Staged imports | `docs/pr-screenshots/sheet-0067/gm-import-*` |
| Google Docs manual import | `docs/pr-screenshots/sheet-0068/gm-google-docs-*` |

## GitHub Tracking

- Parent epic issue: `sheet-0061` / #76.
- Final acceptance ticket: `sheet-0069` / #77.
- Epic PR: #78.
- Completed ticket sub-issues: #62, #64, #66, #68, #70, #72, and #74.
- The Campaign Ledger GitHub Project should show completed ticket items as `Done` with verification
  recorded, #76 as the active epic until PR #78 merges, and #77 as complete after this note lands.

## Deferred Follow-Ups

- Production Google Drive OAuth, background sync, revision polling, and two-way editing remain out
  of scope. The manual importer boundary is ready for a later connector.
- Full encounter building, combat tracking, automated NPC rules calculation, and richer stat-block
  generation remain future Game Master tooling.
- SQLite remains the local-first store for this epic; Postgres, external identity, production email,
  and hosted backup automation stay future deployment work.
- Campaign-management polish such as deeper faction-management UI, bulk image operations,
  richer wiki editing, and broader campaign dashboards should be raised as follow-up issues rather
  than expanding this epic.
