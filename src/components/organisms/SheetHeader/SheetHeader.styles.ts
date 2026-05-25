export const sheetHeaderStyles = /* css */ `
.sheet-header {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 0.55rem;
  padding: 0.55rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
}

.sheet-title-block {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  justify-content: space-between;
}

.sheet-heading {
  color: var(--heading-colour);
  font-size: 1.35rem;
  line-height: 1.1;
  margin: 0;
}

.sheet-subtitle {
  color: var(--muted-text-colour);
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0;
}

.sheet-summary-edit-button,
.sheet-summary-edit-actions button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.35rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 850;
  min-height: 2rem;
  padding: 0.3rem 0.6rem;
}

.sheet-summary-edit-button:hover,
.sheet-summary-edit-actions button:hover {
  border-color: var(--focus-border-colour);
}

.sheet-summary-edit-form {
  align-items: end;
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-summary-edit-form label {
  color: var(--muted-text-colour);
  display: grid;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.25rem;
  text-transform: uppercase;
}

.sheet-summary-edit-form input {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.35rem;
  color: var(--heading-colour);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 750;
  min-height: 2.15rem;
  min-width: 0;
  padding: 0.35rem 0.45rem;
  width: 100%;
}

.sheet-summary-edit-form input:focus {
  border-color: var(--focus-border-colour);
  outline: 2px solid color-mix(in srgb, var(--focus-border-colour) 28%, transparent);
  outline-offset: 1px;
}

.sheet-summary-edit-actions {
  display: flex;
  gap: 0.35rem;
}

.sheet-header-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}

.sheet-metric {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.15rem;
  min-height: 2.85rem;
  padding: 0.42rem;
  position: relative;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition);
}

.sheet-metric dt {
  color: var(--muted-text-colour);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
}

.sheet-metric dd {
  align-items: center;
  color: var(--heading-colour);
  display: flex;
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.05;
  margin: 0;
  overflow-wrap: anywhere;
}

.sheet-metric-wide {
  grid-column: span 1;
}

.hp-control,
.condition-control {
  position: relative;
  width: 100%;
}

.condition-control {
  --condition-anchor-name: --condition-control-anchor;
  display: inline-flex;
}

.metric-value-button {
  appearance: none;
  anchor-name: var(--condition-anchor-name);
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  padding: 0;
  text-align: left;
}

.metric-value-button::-webkit-details-marker {
  display: none;
}

.metric-value-button::marker {
  content: "";
}

.metric-popover {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  color: var(--heading-colour);
  display: none;
  gap: 0.75rem;
  inset-block-start: calc(100% + 0.45rem);
  inset-inline-end: 0;
  min-width: min(17rem, calc(100vw - 1.5rem));
  padding: 0.75rem;
  position: absolute;
  width: min(17rem, calc(100vw - 1.5rem));
  z-index: 30;
}

.hp-control[open] .metric-popover,
.metric-popover:popover-open {
  display: grid;
}

.condition-popover {
  inset-block-start: calc(var(--site-header-height) + 0.5rem);
  inset-inline-start: var(--page-gutter);
  position: fixed;
}

.metric-popover-heading {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 900;
  margin: 0;
  text-transform: uppercase;
}

.metric-stepper,
.metric-popover-form {
  align-items: center;
  display: grid;
  gap: 0.5rem;
}

.metric-stepper {
  grid-template-columns: auto minmax(4rem, 1fr) auto;
}

.metric-popover-form {
  grid-template-columns: minmax(4rem, 1fr) minmax(4.5rem, 6rem) auto;
}

.metric-stepper form {
  margin: 0;
}

.metric-stepper span {
  justify-self: center;
}

.metric-stepper button,
.metric-popover-form button {
  align-items: center;
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.375rem;
  color: var(--action-text-colour);
  cursor: pointer;
  display: inline-flex;
  height: 2.25rem;
  justify-content: center;
  width: 2.25rem;
}

.metric-popover-form label {
  color: var(--muted-text-colour);
  font-size: 0.8rem;
  font-weight: 800;
}

.metric-popover-form input {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  color: var(--heading-colour);
  font-weight: 800;
  min-height: 2.25rem;
  min-width: 0;
  padding: 0.35rem 0.45rem;
}

.condition-chip-list {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.condition-chip {
  background: color-mix(in srgb, var(--success-colour) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--success-colour) 45%, var(--border-colour));
  border-radius: 999rem;
  color: var(--heading-colour);
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1;
  padding: 0.28rem 0.45rem;
}

.condition-chip-form {
  margin: 0;
}

.condition-chip-form button {
  cursor: pointer;
}

.condition-empty {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
}

.condition-add-form {
  display: grid;
  gap: 0.4rem;
}

.condition-add-form label {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.condition-add-form input {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  color: var(--heading-colour);
  font-weight: 800;
  min-height: 2.25rem;
  padding: 0.35rem 0.45rem;
}

.condition-add-form button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.375rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 900;
  min-height: 2.25rem;
}

@supports (position-anchor: --condition-control-anchor) {
  .condition-popover {
    inset: auto;
    position-anchor: var(--condition-anchor-name);
    position-area: block-end span-inline-start;
    position-try-fallbacks: block-end span-inline-end, block-start span-inline-start;
  }
}

@media (min-width: 720px) {
  .sheet-header {
    gap: 0.55rem;
    padding: 0.7rem;
  }

  .sheet-heading {
    font-size: 1.45rem;
  }

  .sheet-header-grid {
    gap: 0.5rem;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .sheet-summary-edit-form {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .sheet-metric-wide {
    grid-column: span 1;
  }
}

@media (max-width: 360px) {
  .sheet-header-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-summary-edit-form {
    grid-template-columns: 1fr;
  }

  .sheet-summary-edit-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-metric-wide {
    grid-column: span 2;
  }
}

@media (min-width: 980px) {
  .sheet-title-block {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr) auto;
  }

  .sheet-subtitle {
    justify-self: end;
  }
}
`;
