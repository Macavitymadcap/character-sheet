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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}

.sheet-metric {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.15rem;
  min-height: 3.75rem;
  padding: 0.55rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition);
}

.sheet-metric dt {
  color: var(--muted-text-colour);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.sheet-metric dd {
  color: var(--heading-colour);
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.05;
  margin: 0;
  overflow-wrap: anywhere;
}

.sheet-metric-wide {
  grid-column: span 2;
}

@media (min-width: 720px) {
  .sheet-header {
    gap: 1rem;
    padding: 1rem;
    position: sticky;
    top: calc(var(--page-gutter) + 4.75rem);
  }

  .sheet-heading {
    font-size: 1.75rem;
  }

  .sheet-header-grid {
    gap: 0.75rem;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .sheet-metric-wide {
    grid-column: span 1;
  }
}
`;
