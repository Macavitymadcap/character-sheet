export const popoverMenuStyles = /* css */ `
.popover-menu {
  display: inline-flex;
}

.popover-menu-trigger {
  align-items: center;
  anchor-name: var(--popover-anchor-name);
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  color: var(--heading-colour);
  cursor: pointer;
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  padding: 0;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    color var(--theme-text-transition);
  width: 2rem;
}

.popover-menu-trigger:hover {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}

.popover-menu-panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: none;
  inset-block-start: calc(var(--site-header-height) + 0.5rem);
  inset-inline-end: var(--page-gutter);
  margin: 0;
  min-width: 12rem;
  padding: 0.35rem;
  position: fixed;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
  z-index: 20;
}

.popover-menu-panel:popover-open {
  display: grid;
  gap: 0.2rem;
}

.popover-menu-form {
  margin: 0;
}

.popover-menu-item {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--heading-colour);
  cursor: pointer;
  display: block;
  font-weight: 800;
  padding: 0.5rem 0.6rem;
  text-align: left;
  text-decoration: none;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    color var(--theme-text-transition);
  width: 100%;
}

.popover-menu-item:hover,
.popover-menu-item[aria-current="page"] {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}

@supports (position-anchor: --site-menu-anchor) {
  .popover-menu-panel {
    inset: auto;
    position-anchor: var(--popover-anchor-name);
    position-area: block-end span-inline-end;
    position-try-fallbacks: block-end span-inline-start, block-start span-inline-end;
  }
}
`;
