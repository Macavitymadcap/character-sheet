export const sheetTabPanelStyles = /* css */ `
.sheet-tab-panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 0.65rem;
  padding: 0.75rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
}

.tab-panel-heading {
  display: grid;
  gap: 0.3rem;
}

.tab-panel-heading h2 {
  font-size: 1.25rem;
  line-height: 1.2;
  margin: 0;
}

.tab-panel-heading p {
  color: var(--muted-text-colour);
  font-weight: 700;
  margin: 0;
}

.tab-compact-stack {
  display: grid;
  gap: 0.75rem;
}

.tab-compact-grid {
  align-items: start;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tab-compact-section {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.tab-compact-section h3 {
  font-size: 0.95rem;
  line-height: 1.2;
  margin: 0;
}

.tab-empty-state {
  color: var(--muted-text-colour);
  font-weight: 700;
  margin: 0;
}

@media (max-width: 760px) {
  .tab-compact-grid {
    grid-template-columns: 1fr;
  }
}
`;
