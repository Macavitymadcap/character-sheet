# Private Rules Importer

`sheet-0086` adds the operator command for importing campaign-scoped private YAML from a Railway
volume. The default import path is `/data/private-rules`, matching the hosted volume convention.

```bash
bun run import:rules:private
bun run import:rules:private -- /data/private-rules
```

For local fixture checks, pass a local directory or file:

```bash
bun run import:rules:private -- docs/rules/private-rules.example.yaml
```

## OCR Markdown Export

`bun run import:rules:ocr` converts operator-owned OCR Markdown into Campaign Ledger private-rules
YAML and JSON before the private import step. It defaults to Railway-friendly paths:

```bash
bun run import:rules:ocr
```

The default input directory is `/data/private-rules/ocr-markdown`; the default output directory is
`/data/private-rules`. Override both for local checks:

```bash
bun run import:rules:ocr -- --input-dir ./private-ocr-markdown --output-dir ./private-rules
```

The exporter recognises `phb.md`, `dmg.md`, `mm.md`, `xgte.md`, `tcoe.md`, and `mpmm.md`, plus the
OCR filenames used by the source scans. Spells and monster stat blocks are excluded by default
because those OCR sections are incomplete; provide them through a dedicated spell/statblock source
or deliberately override the exclusion list:

```bash
# Default: excludes both spells and monster stat blocks.
bun run import:rules:ocr

# Include spells from OCR, but keep monster stat blocks excluded.
PRIVATE_RULES_OCR_EXCLUDE_TYPES=monster bun run import:rules:ocr

# Include spells and monster stat blocks from OCR.
PRIVATE_RULES_OCR_EXCLUDE_TYPES= bun run import:rules:ocr
```

Generated files follow the v1 private-rules contract: `schemaVersion: 1`, `campaign`, `sources`,
`entities`, and `importNotes`. The exporter writes per-book `.yml` files for import and
`combined.json` for operator inspection. It deliberately does not write `combined.yml`, so importing
the output directory does not double-import the same OCR entries and produce noisy duplicate
warnings.

## Filling In Incomplete OCR Sections

Prefer dedicated YAML files for any section where the OCR exporter produced placeholders or skipped
entries. Keep these files beside the generated OCR output under `/data/private-rules`; the private
importer reads every `.yml` or `.yaml` file in that directory and reports duplicates, failed files,
and SRD-shadowed entries. Treat `combined.json` as a review aid only; it is not imported.

Useful file split:

- `phb-spells.yml` for spell entries.
- `mm-stat-blocks.yml` or `mpmm-stat-blocks.yml` for monsters and NPC stat blocks.
- `phb-equipment.yml` for armour, weapons, tools, adventuring gear, and magic items.
- `dmg-tables.yml` or `phb-tables.yml` for rule tables that should be searchable or linkable.
- `xgte-missing.yml`, `tcoe-missing.yml`, or similar for hand-cleaned features, invocations,
  infusions, feats, and subclasses that OCR could not structure safely.

Each file uses the same wrapper:

```yaml
schemaVersion: 1
campaign:
  id: campaign_rovnost_shadows
  slug: rovnost-shadows
  name: Rovnost Shadows
sources:
  - code: PHB
    title: Player's Handbook
    abbreviation: PHB
    category: official_2014
    visibility: campaign
    precedence: 10
entities:
  # entries go here
importNotes: Operator-owned private rules. Keep outside git.
```

### Spells

Use `type: spell`. Put the cleaned text in `bodyMarkdown`; put casting metadata in a
`spellcasting` mechanic so the rules browser and sheet links can treat the entry as a spell.

```yaml
entities:
  - id: private_phb_spell_example
    slug: example-spell
    type: spell
    name: Example Spell
    source:
      sourceCode: PHB
      page: 200
      section: Spells
    tags:
      - spell
      - level-1
    summary: Short operator summary.
    bodyMarkdown: |
      Cleaned spell text from the owned book goes here.
    mechanics:
      - kind: spellcasting
        display: Action, 60 feet
        data:
          level: 1
          school: Evocation
          castingTime: Action
          range: 60 feet
          components:
            - V
            - S
            - M
          duration: Instantaneous
          ritual: false
          concentration: false
          classes:
            - Wizard
            - Sorcerer
```

### Monster And NPC Stat Blocks

Use `type: monster`. The importer maps this to the runtime `stat_block` entity type. Keep the full
cleaned stat block in `bodyMarkdown`; add a `stat_block` mechanic for structured values that are
worth querying later. If a value is uncertain, leave it in the markdown and correct the structured
field before relying on it for automation.

```yaml
entities:
  - id: private_mm_monster_example
    slug: example-monster
    type: monster
    name: Example Monster
    source:
      sourceCode: MM
      page: 10
      section: Monsters
    tags:
      - monster
      - challenge-1
    summary: Short operator summary.
    bodyMarkdown: |
      Cleaned stat block text from the owned book goes here.
    mechanics:
      - kind: stat_block
        display: CR 1, AC 13, HP 27
        data:
          size: Medium
          type: Humanoid
          alignment: Any alignment
          armourClass:
            value: 13
            notes: Natural armour
          hitPoints:
            average: 27
            formula: 5d8 + 5
          speed:
            walking: 30
          abilities:
            strength: 12
            dexterity: 14
            constitution: 12
            intelligence: 10
            wisdom: 11
            charisma: 10
          senses:
            passivePerception: 10
          languages:
            - Common
          challenge:
            rating: "1"
            xp: 200
          traits:
            - name: Example Trait
              text: Trait text.
          actions:
            - name: Example Attack
              text: Attack text.
          reactions: []
          legendaryActions: []
```

### Tables And Other Reference Sections

Use `type: rule` for general tables, `type: optional_rule` for optional or variant rules, and keep
the table as markdown in `bodyMarkdown`. Markdown tables are the safest handoff because they remain
readable even before table-specific automation exists.

```yaml
entities:
  - id: private_dmg_table_example
    slug: example-table
    type: rule
    name: Example Table
    source:
      sourceCode: DMG
      page: 250
      section: Tables
    tags:
      - table
    summary: Lookup table for table use.
    bodyMarkdown: |
      | d6 | Result |
      | --- | --- |
      | 1 | First result |
      | 2 | Second result |
```

### Equipment And Magic Items

Use `type: equipment` for mundane gear and `type: magic_item` for magic items. The importer maps
both to runtime equipment entries, while the original private type remains visible in source data.

```yaml
entities:
  - id: private_phb_equipment_example
    slug: example-weapon
    type: equipment
    name: Example Weapon
    source:
      sourceCode: PHB
      page: 149
      section: Equipment
    tags:
      - equipment
      - weapon
    summary: Weapon summary.
    bodyMarkdown: |
      Cleaned equipment text from the owned book goes here.
    mechanics:
      - kind: equipment
        display: Martial melee weapon
        data:
          category: weapon
          weapon:
            type: martial
            range: melee
          damage:
            dice: 1d8
            type: slashing
          properties:
            - versatile

  - id: private_dmg_magic_item_example
    slug: example-magic-item
    type: magic_item
    name: Example Magic Item
    source:
      sourceCode: DMG
      page: 150
      section: Magic Items
    tags:
      - magic-item
    summary: Magic item summary.
    bodyMarkdown: |
      Cleaned magic item text from the owned book goes here.
    mechanics:
      - kind: equipment
        display: Wondrous item, rare
        data:
          category: magic_item
          rarity: rare
          requiresAttunement: true
```

### Safe Import Loop

After adding or replacing dedicated YAML files:

```bash
# Optional local dry run against a copied directory.
bun run import:rules:private -- ./private-rules

# Hosted import after a backup.
PRIVATE_RULES_BACKUP_CONFIRMED=1 bun run import:rules:private -- /data/private-rules

# Coverage and link audit for Friday.
bun run rules:coverage:rovnost -- /data/private-rules
```

If the coverage report still lists missing Lynott links, add or correct the matching private entries
first, then rerun the private import and coverage report.

## Hosted Runbook

Before importing private production data, create a hosted backup:

```bash
bun run hosted:data -- backup
```

Then run the private import from a Railway shell with the backup confirmed:

```bash
PRIVATE_RULES_BACKUP_CONFIRMED=1 bun run import:rules:private -- /data/private-rules
```

If you have a backup manifest path, record it in the import output:

```bash
PRIVATE_RULES_BACKUP_REFERENCE=/data/backups/character-sheet-2026-05-29.manifest.json \
  bun run import:rules:private -- /data/private-rules
```

The importer rejects `/data/private-rules` imports unless either `PRIVATE_RULES_BACKUP_CONFIRMED=1`
or `PRIVATE_RULES_BACKUP_REFERENCE` is set. Local non-production paths can be imported without that
confirmation.

## Output

The command reports:

- imported entity count
- skipped non-YAML files
- failed YAML files and validation messages
- duplicate entries inside the import batch
- SRD entries shadowed by campaign-private duplicates
- imported counts grouped by source slug
- Lynott private rule links relinked to campaign-scoped private entities where matching entries are
  available
- Rovnost coverage summary, including required source coverage, Lynott missing links, and missing
  source files

Private source entries are linked to `campaign_rovnost_shadows` by default. Override this only for a
deliberate campaign migration:

```bash
PRIVATE_RULES_CAMPAIGN_ID=campaign_other_table bun run import:rules:private -- ./private-rules
```

Owned-book sources must stay campaign-scoped. Public visibility is rejected unless the source is
explicitly marked as SRD or licensed public material in the YAML.

For a report without importing new files, run:

```bash
bun run rules:coverage:rovnost -- /data/private-rules
```

Use `ROVNOST_RULES_APPLY_LINKS=1` or `--apply-links` with the report script to relink Lynott's
sheet to already-imported private entries.

For the final Friday operator sequence, see [Rovnost Friday Readiness Acceptance](../../operations/rovnost-friday-readiness-acceptance.md). The sequence is backup first, import private YAML second, coverage report third, and hosted readiness check last.
