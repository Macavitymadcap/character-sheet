# Ticket sheet-0018: Rovnost Factions And Background Picker

## Summary

Add campaign factions as first-class Rovnost data and let characters choose a primary faction connection from the sheet Background tab.

## Implementation

- Add campaign faction records for Council of Magisters, Steel Hand, Discontents, Black Market, Tidebound, and Skywright Guild.
- Store player-facing faction fields: motto, overview, public reputation, possible character connections, common rumours, and optional sigil asset.
- Link each faction to a wiki page where available.
- Add one primary faction choice per character, with `Unaffiliated/Other` as a valid state.
- Add a Background tab form for players to choose their own faction connection and for Game Masters to edit any campaign character's faction.
- Render the selected faction summary and link back to the wiki page.

## Tests First

- Write repository tests for faction seeds, faction reads, character faction updates, and campaign isolation.
- Write route tests for player-owned faction changes, Game Master overrides, invalid faction ids, and forbidden updates.
- Write component tests for faction cards, faction picker, selected faction summary, and empty states.
- Add screenshot coverage for the Background tab with a selected faction.

## Acceptance Criteria

- Factions are visible as campaign lore and selectable as character background context.
- Players can maintain their own faction connection.
- Game Masters can edit faction choices for all campaign characters.
- Faction choice does not grant rules mechanics automatically in this epic.
