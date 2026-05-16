export const sheetTabsStyles = /* css */ `
.sheet-tabs {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.06);
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.65rem;
}

.sheet-tab {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--muted-text-colour);
  flex: 0 0 auto;
  font-weight: 800;
  min-height: 2.5rem;
  padding: 0.6rem 0.75rem;
  text-decoration: none;
}

.sheet-tab[data-state="active"] {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}
`;
