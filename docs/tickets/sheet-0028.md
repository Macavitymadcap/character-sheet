# Ticket sheet-0028: SRD Final Acceptance And Follow-Up Boundaries

## Summary

Complete final SRD import verification, acceptance notes, and follow-up boundaries.

## Implementation

- Run a final import against the full local SRD 5.1 corpus and record any deliberate limitations.
- Confirm docs clearly defer Railway to `sheet-0030` and Hyper-Dank adoption to `sheet-0040`.
- Tighten any acceptance gaps found by final smoke, accessibility, screenshots, and docs checks.

## Tests First

- Add final documentation checks for roadmap links, scripts, and deferred epic references.

## Acceptance Criteria

- The SRD/rules epic is ready to land as the immediate player-value roadmap slice.

## Implementation Notes

- Final verification uses the SRD fixture corpus as the acceptance stand-in until the full SRD 5.1
  local corpus is added under `docs/rules/srd-5.1/`.
- README and architecture docs now describe rules browsing, sheet rule links, verification coverage,
  and the remaining full-corpus follow-up boundary.
- Railway remains deferred to `sheet-0030`; Hyper-Dank adoption remains deferred to `sheet-0040`.
