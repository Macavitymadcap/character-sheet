export const sheetHeaderStyles = /* css */ `
.sheet-header {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  position: static;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
  z-index: 4;
}

.sheet-title-block {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: space-between;
}

.sheet-heading {
  color: var(--heading-colour);
  font-size: 1.45rem;
  line-height: 1.1;
  margin: 0;
}

.sheet-subtitle {
  color: var(--muted-text-colour);
  font-weight: 800;
  margin: 0;
}

.sheet-header-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.sheet-metric {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.15rem;
  min-height: 3.25rem;
  padding: 0.5rem;
  position: relative;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition);
}

.sheet-metric dt {
  color: var(--muted-text-colour);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

.sheet-metric dd {
  align-items: center;
  color: var(--heading-colour);
  display: flex;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.05;
  margin: 0;
  overflow-wrap: anywhere;
}

.sheet-metric-wide {
  grid-column: span 2;
}

.hp-control {
  position: relative;
  width: 100%;
}

.metric-value-button {
  appearance: none;
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

.hp-control[open] .metric-popover {
  display: grid;
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

@media (min-width: 720px) {
  .sheet-header {
    gap: 0.75rem;
    padding: 0.85rem;
    position: sticky;
    top: 4.5rem;
  }

  .sheet-heading {
    font-size: 1.55rem;
  }

  .sheet-header-grid {
    gap: 0.5rem;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .sheet-metric-wide {
    grid-column: span 1;
  }
}

@media (min-width: 980px) {
  .sheet-title-block {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  }

  .sheet-subtitle {
    justify-self: end;
  }
}
`;
