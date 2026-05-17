# Ticket sheet-0014: Character Rosters And Manual Creation

## Summary

Add player and Game Master character roster pages, plus manual character creation for the fields needed to start a playable local sheet.

## Implementation

- Add a signed-in player roster at `/characters` with their campaign characters and a create-character form.
- Add a Game Master campaign roster at `/campaigns/:campaignSlug/characters` with all campaign characters.
- Create characters from manual inputs: name, owner, campaign, species, class/subclass text, background, level, and starting summary values.
- Generate stable slugs per campaign and redirect canonical sheet urls to the slug.
- Seed sensible default abilities, skills, resources, and empty sections so a newly created character renders every existing sheet tab.

## Tests First

- Write repository tests for roster reads, slug generation, character creation defaults, and Game Master ownership changes.
- Write route tests for player creation, Game Master creation for another player, duplicate slugs, invalid owners, and unauthorised roster access.
- Write component tests for player roster, Game Master roster, create form, and empty character state.

## Acceptance Criteria

- Players can create and open their own campaign characters.
- Game Masters can create and inspect characters for campaign members.
- Newly created characters render the existing sheet shell and every tab without crashing.
- Character creation remains manual and does not pretend to be a guided rules builder.
