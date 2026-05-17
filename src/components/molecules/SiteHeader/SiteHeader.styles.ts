export const siteHeaderStyles = /* css */ `
.site-header {
  align-items: center;
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 0.6rem;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 3.5rem;
  padding: 0.6rem;
  position: sticky;
  top: 0.5rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
  z-index: 5;
}

.site-brand {
  color: var(--heading-colour);
  font-weight: 900;
  text-decoration: none;
}

.site-title {
  display: block;
  font-size: 1.1rem;
  line-height: 1.1;
}

.site-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  grid-column: 1 / -1;
  justify-content: flex-start;
}

.site-nav a,
.site-auth-link {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--muted-text-colour);
  font-weight: 700;
  min-height: 2.25rem;
  padding: 0.5rem 0.6rem;
  text-decoration: none;
}

.site-nav a[aria-current="page"],
.site-auth-link[aria-current="page"] {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}

.site-actions {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.site-user {
  color: var(--muted-text-colour);
  display: none;
  font-size: 0.8rem;
  font-weight: 700;
  gap: 0.1rem;
  line-height: 1.2;
  margin: 0;
  text-align: right;
}

@media (min-width: 560px) {
  .site-header {
    padding: 0.75rem;
  }

  .site-title {
    font-size: 1.25rem;
  }

  .site-user {
    display: grid;
  }
}

@media (min-width: 820px) {
  .site-header {
    grid-template-columns: minmax(12rem, 1fr) auto minmax(13rem, 1fr);
    min-height: 4rem;
    padding: 0.85rem 1rem;
    top: var(--page-gutter);
  }

  .site-title {
    font-size: 1.45rem;
  }

  .site-nav {
    grid-column: auto;
    justify-content: center;
  }
}
`;
