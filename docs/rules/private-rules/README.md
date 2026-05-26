# Private Rules YAML Schema

`sheet-0085` defines the v1 operator contract for private rules YAML. The real private files live
outside git, normally on the Railway volume at `/data/private-rules`, and are supplied by the table
operator from owned books. This repository only stores the schema, safe synthetic examples, tests,
and import code.

The schema is split into small files so later importer work can validate one concern at a time:

- [schema.yml](./schema.yml) is the root document and provenance contract.
- [entry-types.yml](./entry-types.yml) lists supported source books and rule entity types.
- [ability-scores.yml](./ability-scores.yml) documents fixed, flexible, feat-choice, manual, and
  point-buy ability-score models.
- [subclass-mechanics.yml](./subclass-mechanics.yml) documents prerequisites, grants, choices, and
  reusable mechanics records.
- [importer.md](./importer.md) documents the Railway shell import command and hosted backup guard.

Use [private-rules.example.yaml](../private-rules.example.yaml) as a safe shape reference. It uses
dummy names and short synthetic descriptions only; do not copy proprietary rules text into git.

## Import Boundary

Private rule files must be campaign-scoped unless a source is explicitly SRD/licensed. The importer
for `sheet-0086` should reject public visibility for owned-book data, record import provenance, and
link source records to the intended campaign. Inside that campaign, private source entries may
shadow SRD entries with the same slug. Public `/rules` views must continue to show SRD-safe entries
only.

## Versioning

The root field `schemaVersion: 1` identifies this contract. Backwards-compatible additions may add
optional fields. Breaking changes should create a new version and keep v1 fixture tests intact until
all deployed imports have migrated.
