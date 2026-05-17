# Ticket sheet-0016: Notes And Campaign Sessions

## Summary

Expand notes from seeded note editing into real note creation, and add Game Master campaign/session records for table prep and recap.

## Implementation

- Add player and Game Master note creation on character sheets.
- Preserve note visibility: player-visible notes are visible to the character owner and Game Master; Game Master notes are visible only to Game Masters.
- Add update and delete flows for notes the viewer is allowed to manage.
- Add campaign session records with title, date, summary/body, visibility, and created/updated metadata.
- Add Game Master session list/detail forms under the campaign page.

## Tests First

- Write repository tests for creating, listing, updating, deleting, and filtering notes and sessions.
- Write permission tests for players, Game Masters, admins, and non-members.
- Write route/component tests for note forms, session forms, empty states, and HTMX refreshes.

## Acceptance Criteria

- Players can create and edit their own player-visible character notes.
- Game Masters can create and edit Game Master notes and campaign session records.
- Players cannot read Game Master-only notes or sessions.
- Existing seeded notes migrate into the same behaviour.
