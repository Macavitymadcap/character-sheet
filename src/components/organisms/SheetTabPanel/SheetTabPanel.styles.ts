export const sheetTabPanelStyles = /* css */ `
.sheet-tab-panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 1rem;
  min-height: 18rem;
  padding: 1rem;
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

.tab-placeholder-grid {
  align-content: start;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 960px) {
  .tab-placeholder-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .tab-placeholder-grid {
    grid-template-columns: 1fr;
  }
}
`;
