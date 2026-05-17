# Ticket sheet-0015: Manual Sheet Editing

## Summary

Let players and Game Masters edit the character sheet sections that the current UI renders, using explicit forms and HTMX fragments instead of a full character builder.

## Implementation

- Add edit routes/forms for identity and summary fields: name, species, class/subclass text, background, level, armour class, initiative, speed, hit point maximum, and proficiency bonus.
- Add edit routes/forms for ability scores, saving throw proficiency, skills, senses, armour class breakdown, defences, proficiencies, resources, equipment, and background entries.
- Recalculate simple derived fields where local helpers already exist, such as ability modifiers and skill modifiers.
- Keep rules selections manual; automatic class/species/background grants are deferred.
- Return the smallest meaningful fragment after each edit.

## Tests First

- Write repository tests for each editable section and validation boundaries.
- Write route tests for player-owned edits, Game Master edits, forbidden edits, invalid values, and fragment responses.
- Write component tests for compact edit forms and rendered updated values.
- Add smoke coverage for editing at least one core field and one section row.

## Acceptance Criteria

- A player can manually maintain their own rendered sheet fields.
- A Game Master can edit any campaign character.
- Invalid numeric values and unsupported section edits are rejected.
- The UI remains table-friendly on mobile after edit controls are added.
