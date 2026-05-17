export const sheetTabsStyles = /* css */ `
.sheet-tab-workspace {
  align-items: start;
  display: grid;
  gap: 0.5rem;
  grid-auto-rows: max-content;
  min-width: 0;
}

.sheet-sticky-stack {
  align-items: start;
  background: var(--background-colour);
  display: grid;
  gap: 0.5rem;
  grid-auto-rows: max-content;
  margin-inline: calc(var(--page-gutter) * -1);
  padding-block-end: 0.5rem;
  padding-block-start: 0.5rem;
  padding-inline: var(--page-gutter);
  position: sticky;
  top: var(--sheet-sticky-top);
  transition: background-color var(--theme-transition);
  z-index: 4;
}

.sheet-tabs {
  align-items: center;
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: flex;
  gap: 0.25rem;
  justify-content: flex-start;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem;
  scrollbar-gutter: stable;
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
  flex: 0 0 auto;
  font-weight: 800;
  inline-size: max-content;
  justify-content: center;
  line-height: 1;
  min-height: 2.2rem;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  text-decoration: none;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    color var(--theme-text-transition);
  white-space: nowrap;
}

.sheet-tab:hover {
  background: var(--stat-background-colour);
  border-color: var(--border-colour);
  color: var(--heading-colour);
}

.sheet-tab[data-state="active"] {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}
`;
