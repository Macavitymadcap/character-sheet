# Ticket sheet-0007: Actions, Spellcasting, Features, Equipment, And Resources

## Summary

Implement the action-facing sheet tabs: actions, spellcasting, features and traits, equipment, and mutable resource tracking.

## Implementation

- Add read models for attacks, actions, bonus actions, reactions, spells, spell slots, class features, species traits, infusions, equipment, and conditions.
- Add mutation routes for spending/restoring resources such as hit points, temporary hit points, hit dice, spell slots, inspiration, Fey Gift, Fortune from the Many, and conditions. Current hit points, temporary hit points, conditions, and inspiration are controlled from the compact sheet header.
- Add compact d20 popovers for abilities, skills, tools, and weapon attacks, including advantage/disadvantage and extra modifiers.
- Add equipment controls for carried/equipped state and quantities, including the coin purse.
- Add rest services for the MVP resources, with long rest recovery implemented and short rest kept as a safe no-op until short-rest resources are modelled.
- Render selected spellcasting and feature entries from rules links with source metadata; fuller runtime rendering from `rule_mechanics` is deferred.

```mermaid
sequenceDiagram
    participant Browser
    participant App as Hono App
    participant Guard as Sheet Guard
    participant Service as Resource Service
    participant Repo as Character Repository

    Browser->>App: PATCH /sheet/:id/resources/:resourceId
    App->>Guard: require write access
    App->>Service: applyResourceChange(input)
    Service->>Repo: update resource
    Repo-->>Service: updated sheet summary
    Service-->>App: fragment read model
    App-->>Browser: updated sheet header or tab fragment
```

## Data Changes

- Use `character_resources`, `character_equipment`, `rules_entities`, `rule_mechanics`, and `character_rule_links`.
- Add seed data for Lynott's pistol, Repeating Shot, Enhanced Defence, Artillerist features, Artificer features, prepared spells, and active resources.

## Tests First

- Write repository tests for actions, spellcasting, feature, trait, infusion, and equipment read models.
- Write service tests for resource spending, invalid resource changes, long rest recovery, the current short-rest no-op, spell slot use, and condition updates.
- Write component tests for action rows, spell cards, feature lists, equipment lists, and resource controls.
- Write HTMX mutation tests that assert updated fragments and persisted state.

## Acceptance Criteria

- Lynott's action, spellcasting, feature, trait, and equipment tabs render from SQLite.
- Resource controls persist changes and update relevant fragments.
- Dice roll and condition popovers are reusable, tested components or component patterns.
- Equipment quantity/equipped controls persist changes and update the active tab fragment.
- Long-rest actions reset only the resources documented for the MVP; short rest remains a tested no-op.
- Routes reject unauthorised or invalid mutations.
