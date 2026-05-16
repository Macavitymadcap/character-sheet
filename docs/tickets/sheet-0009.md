# Ticket sheet-0009: Local Rules Importer And British English Normalisation

## Summary

Create the local-first rules importer that turns local markdown or JSON exports into structured SQLite seed data for the MVP rules corpus.

## Implementation

- Add importer services for spells, class features, species traits, backgrounds, infusions, equipment, and conditions needed by Lynott.
- Add source precedence rules for official 2014 material, preferring the most recent 2014 reprint where content overlaps.
- Add British English normalisation for imported text and structured field names where safe.
- Add deterministic seed output so repeated imports do not duplicate rules.
- Keep live 5e.tools fetching behind a future adapter boundary.

```mermaid
flowchart LR
    A["Local markdown or JSON"] --> B["Parser"]
    B --> C["Normaliser"]
    C --> D["Source precedence resolver"]
    D --> E["Rules seed records"]
    E --> F["SQLite repositories"]
```

## Interfaces

- `RulesImportService.importFromLocalSource(path)`.
- `normaliseRuleText(text)`.
- `resolveRulesSource(existing, incoming)`.
- `RulesSeedRepository.upsertRuleEntity(entity)`.

## Tests First

- Write parser fixture tests for representative spell, class feature, species trait, background, infusion, and equipment files.
- Write normalisation tests for common American-to-British spellings used in the imported data.
- Write precedence tests for Artificer and other reprinted 2014 rules.
- Write idempotency tests proving repeated imports do not duplicate entities.

## Acceptance Criteria

- Importer can seed the Lynott MVP rules corpus from local files without network access.
- Imported records include source metadata and structured mechanics where the source supports it.
- Normalisation is deterministic and avoids changing official names when that would create ambiguity.
- Runtime sheet reads use SQLite rules records.
