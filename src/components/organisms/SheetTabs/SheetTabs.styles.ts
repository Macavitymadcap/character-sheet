export const sheetTabsStyles = /* css */ `
.sheet-tab-workspace {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.sheet-tabs {
  align-items: center;
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 0.25rem;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.35rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
}

.sheet-tab {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--muted-text-colour);
  display: inline-flex;
  font-weight: 800;
  justify-content: center;
  min-height: 2.2rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  text-decoration: none;
  white-space: nowrap;
}

.sheet-tab[data-state="active"] {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}
`;
