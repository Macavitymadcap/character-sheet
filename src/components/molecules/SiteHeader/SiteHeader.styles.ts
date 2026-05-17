export const siteHeaderStyles = /* css */ `
.site-header {
  align-items: center;
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 0.75rem 1.75rem var(--shadow-colour);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr) auto;
  min-height: 2.85rem;
  padding: 0.35rem;
  position: sticky;
  top: 0;
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
  font-size: 1rem;
  line-height: 1.1;
}

.site-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
  min-width: 0;
}

.site-nav a,
.site-auth-link {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--muted-text-colour);
  font-weight: 700;
  min-height: 2rem;
  padding: 0.35rem 0.45rem;
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
  gap: 0.35rem;
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
    padding: 0.45rem 0.55rem;
  }

  .site-title {
    font-size: 1.1rem;
  }

  .site-user {
    display: grid;
  }
}

@media (min-width: 820px) {
  .site-header {
    grid-template-columns: minmax(10rem, 1fr) auto minmax(11rem, 1fr);
    min-height: 3.15rem;
    padding: 0.45rem 0.7rem;
  }

  .site-title {
    font-size: 1.2rem;
  }

  .site-nav {
    grid-column: auto;
    justify-content: center;
  }
}
`;
