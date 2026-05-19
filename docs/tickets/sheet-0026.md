# Ticket sheet-0026: Focused SRD-Backed Play Workflows

## Summary

Use imported SRD data to improve table play without building a full guided character builder.

## Implementation

- Add small workflows for SRD-backed spell references, equipment references, condition rules, and
  visible features.
- Keep character creation and levelling manual unless a narrow selection control is required for
  one workflow.
- Avoid automatic grants that would imply a complete rules engine.

## Tests First

- Add smoke and route tests for the chosen focused workflows before wiring the UI.

## Acceptance Criteria

- SRD data improves active sheet use while preserving the manual character-management model.

## Implementation Notes

- Added SRD-backed rules lookup as the focused play workflow for this slice.
- Kept character creation, levelling, automatic grants, and rule-derived resource mutation manual.
- Used imported rule metadata for reading and linking rather than introducing a rules engine.
