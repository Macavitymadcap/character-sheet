export const homeStyles = /* css */ `
.shell {
  display: grid;
  gap: 1rem;
  grid-template-rows: auto 1fr;
  margin-inline: auto;
  max-width: 72rem;
  min-height: 100dvh;
  padding: var(--page-gutter);
  width: 100%;
}

.site-header,
.dashboard-panel,
.action-bar {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.08);
}

.site-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  min-height: 4rem;
  padding: 0.85rem 1rem;
  position: sticky;
  top: var(--page-gutter);
  z-index: 2;
}

.site-title {
  color: var(--heading-colour);
  font-size: clamp(1.35rem, 1rem + 1vw, 1.9rem);
  line-height: 1.1;
  margin: 0;
}

.site-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.site-nav a {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--muted-text-colour);
  font-weight: 700;
  padding: 0.45rem 0.6rem;
  text-decoration: none;
}

.site-nav a[aria-current="page"] {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}

.home-main {
  display: grid;
  gap: 1rem;
}

.dashboard-panel {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
  padding: 1rem;
}

.character-summary {
  display: grid;
  gap: 1rem;
}

.section-heading {
  color: var(--heading-colour);
  font-size: 1rem;
  line-height: 1.2;
  margin: 0;
}

.character-heading {
  align-items: start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.character-name {
  color: var(--heading-colour);
  font-size: clamp(1.75rem, 1.35rem + 1vw, 2.35rem);
  line-height: 1.05;
  margin: 0;
}

.character-kicker {
  color: var(--muted-text-colour);
  font-weight: 700;
  margin: 0.25rem 0 0;
}

.badge-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  min-width: 12rem;
}

.stat-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.3rem;
  min-height: 5.25rem;
  padding: 0.75rem;
}

.stat-label {
  color: var(--muted-text-colour);
  font-size: 0.8rem;
  font-weight: 700;
}

.stat-value {
  color: var(--heading-colour);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1;
}

.sheet-list {
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  margin: 0;
  overflow: hidden;
}

.sheet-row {
  align-items: center;
  background: var(--row-background-colour);
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(8rem, 0.75fr) minmax(0, 1fr);
  min-height: 3rem;
  padding: 0.75rem;
}

.sheet-row + .sheet-row {
  border-top: 1px solid var(--border-colour);
}

.sheet-row dt {
  color: var(--muted-text-colour);
  font-weight: 700;
}

.sheet-row dd {
  margin: 0;
}

.action-bar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.85rem 1rem;
}

.action-bar strong {
  color: var(--heading-colour);
}

.action-link {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.375rem;
  color: var(--action-text-colour);
  font-weight: 800;
  min-height: 2.5rem;
  padding: 0.6rem 0.85rem;
  text-decoration: none;
}

@media (max-width: 760px) {
  .shell {
    padding: 0.75rem;
  }

  .site-header,
  .dashboard-panel,
  .character-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .site-nav,
  .badge-row {
    justify-content: flex-start;
  }

  .dashboard-panel,
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
`;
