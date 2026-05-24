# Google Docs Manual Import

Campaign Ledger supports a manual Google Docs export workflow for Game Master campaign writing. It
does not connect to Google Drive, request OAuth consent, poll for changes, or sync edits back to
Google Docs.

## Manual Export Steps

1. Open the Google Doc outside Campaign Ledger.
2. Export or copy the content as Markdown or HTML.
3. In Campaign Ledger, sign in as the Game Master and open
   `/campaigns/rovnost-shadows/imports/google-docs`.
4. Enter the document title, paste a stable document reference, choose the export format, target,
   visibility, and paste the exported content.
5. Preview the converted campaign Markdown, review warnings, then save to a wiki page, session
   record, NPC dossier, or retained draft.

## Source Metadata

The manual import records provider `google_docs_manual`, source title, source format, imported-by
user, import time, visibility, target type, converted Markdown, conversion notes, and a stable
source reference.

When the document reference is a Google Docs URL, Campaign Ledger stores only a normalised
`google-doc:<document-id>` reference. Private Google Docs or Drive URLs inside exported content are
removed during preview and cleaned again during save before any player-visible content is created.

## Future Connector Boundary

A later live connector can replace the manual entry form by supplying the same provider-neutral
staged import fields: provider, source title, stable source reference, source format, exported
content, target type, and visibility.

That future connector must keep OAuth tokens, refresh tokens, consent-screen configuration, polling,
Drive document listing, automatic re-import, and two-way editing outside the current staged import
save path until they have their own reviewed security and operations plan.
