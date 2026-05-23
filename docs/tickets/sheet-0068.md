# Ticket sheet-0068: Google Docs Manual Export Import

## Summary

Add Google Docs document-reference support on top of the staged importer from `sheet-0067`, with a
required manual exported-document path and a documented boundary for later Google Drive API/OAuth
selection.

This ticket should integrate with Google Docs without turning Campaign Ledger into a background sync
service.

## Dependencies

- Requires `sheet-0067` staged import models, conversion, preview, and save flows.
- Does not require live Google API credentials for the accepted first implementation.

## Implementation

- Define the Google provider boundary so document reference, exported content, and metadata capture
  are isolated from campaign target persistence.
- Add `/campaigns/:campaignSlug/imports/google-docs` for a Game Master to enter a Google Docs title
  and document reference, paste or upload a Markdown/HTML export, and continue into the staged
  preview flow from `sheet-0067`.
- Record the manual Google Docs export as provider `google_docs_manual`; do not claim live Drive API
  sync or document listing in this ticket.
- Document the future Google Drive API/OAuth connector boundary separately so it can replace the
  manual export input without changing staged preview or save behaviour.
- Pass exported Google Docs Markdown or HTML through the `sheet-0067` conversion and preview boundary.
- Capture source metadata: provider, document id or stable reference, source title, import time,
  imported-by user, conversion notes, and last imported revision where available.
- Do not store OAuth secrets, private Drive URLs, or absolute local paths in player-visible output.
- Document manual export steps, source metadata expectations, and future consent-screen assumptions
  for a later live connector.
- Keep background polling, two-way sync, and automatic re-import out of scope.

## Interfaces

- Provider service: Google document reference and exported-content boundary.
- Routes: Google Docs manual export entry, preview handoff, and save handoff.
- Environment or operator docs for manual export steps and future connector assumptions.
- Existing staged import tables and routes from `sheet-0067`.

## Tests First

- Add provider tests with tiny synthetic Google export fixtures before wiring routes.
- Add route tests for manual Google Docs export import, missing document reference, unsupported
  export content, preview handoff, and validation errors.
- Add tests proving source metadata is stored for the Game Master but not exposed to players.
- Add documentation tests for manual export setup and future connector boundary instructions.
- Add smoke coverage for importing a synthetic Google Docs export through the staged preview flow.

## Acceptance Criteria

- A Game Master can import Google Docs writing by entering source metadata and providing an exported
  Markdown or HTML document through the staged preview flow.
- The manual exported-document path is the accepted first implementation; live Google Drive API/OAuth
  setup remains documented future connector work.
- Imported records preserve source metadata without leaking private Drive details to players.
- Google import uses the same conversion, preview, target selection, and save behaviour from
  `sheet-0067`.
- No background sync, automatic polling, or two-way Google editing is introduced.
- Setup docs explain how to export from Google Docs, what source metadata to enter, and where a
  later Drive API connector would attach.
- `bun run verify` passes.
