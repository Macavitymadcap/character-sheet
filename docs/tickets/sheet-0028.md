# Ticket sheet-0028: SRD Import Acceptance And Follow-Up Boundaries

## Summary

Complete SRD import verification, acceptance notes, and follow-up boundaries before the final
player-experience hardening pass in `sheet-0029`.

## Implementation

- Run a final import against the full local SRD 5.1 corpus and record any deliberate limitations.
- Fail the final acceptance review if the app is still using only `docs/rules/srd-5.1-fixtures/`
  as the SRD corpus stand-in.
- Confirm docs clearly defer Railway to `sheet-0030` and Hyper-Dank adoption to `sheet-0040`.
- Tighten any acceptance gaps found by final smoke, accessibility, screenshots, and docs checks.

## Tests First

- Add final documentation checks for roadmap links, scripts, and deferred epic references.

## Acceptance Criteria

- Full-corpus import verification has clear acceptance notes and known follow-up boundaries.
- Any remaining player-facing SRD experience gaps are explicitly handed to `sheet-0029`.

## Implementation Notes

- Final verification previously used the SRD fixture corpus as a parser-contract stand-in. That is
  not sufficient for the epic merge to `main`; the actual local corpus must be added under
  `docs/rules/srd-5.1/` and imported idempotently before this epic is accepted as full SRD.
- README and architecture docs now describe rules browsing, sheet rule links, verification coverage,
  and the remaining full-corpus follow-up boundary.
- Railway remains deferred to `sheet-0030`; Hyper-Dank adoption remains deferred to `sheet-0040`.
