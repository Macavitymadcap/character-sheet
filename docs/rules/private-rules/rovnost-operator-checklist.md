# Rovnost Private Rules Operator Checklist

`sheet-0088` uses this checklist before the Friday readiness acceptance pass. Real owned-book YAML
stays outside git, normally on the Railway volume at `/data/private-rules`.

## Required Source Files

The private import should include campaign-scoped YAML entries for these source codes:

- `PHB`: Player's Handbook
- `DMG`: Dungeon Master's Guide
- `MM`: Monster Manual
- `TCOE`: Tasha's Cauldron of Everything
- `XGTE`: Xanathar's Guide to Everything
- `MPMM`: Mordenkainen Presents: Monsters of the Multiverse

The files may be split by book or combined, but every file must use `schemaVersion: 1`, campaign
`campaign_rovnost_shadows`, and `visibility: campaign` for owned-book sources.

## Lynott Proof Case

The coverage report expects imported private entries for Lynott's level-5 table sheet:

- TCoE artificer features, Artillerist feature, and active infusions.
- MPMM hobgoblin traits.
- PHB prepared spells and cantrips.
- XGtE prepared spell coverage for Absorb Elements.

Run the import after taking a hosted backup:

```bash
PRIVATE_RULES_BACKUP_CONFIRMED=1 bun run import:rules:private -- /data/private-rules
```

Then run the coverage report:

```bash
bun run rules:coverage:rovnost -- /data/private-rules
```

The report should show all required sources imported, all Lynott private links resolved, zero
private rules visible without campaign access, and no missing source files. Any remaining missing
links are explicit Friday readiness gaps rather than hidden sheet failures.
