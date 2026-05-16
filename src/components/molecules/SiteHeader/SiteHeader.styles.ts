export const siteHeaderStyles = /* css */ `
.site-header {
  align-items: center;
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.08);
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(12rem, 1fr) auto minmax(10rem, 1fr);
  min-height: 4rem;
  padding: 0.85rem 1rem;
  position: sticky;
  top: var(--page-gutter);
  z-index: 5;
}

.site-brand {
  color: var(--heading-colour);
  font-weight: 900;
  text-decoration: none;
}

.site-title {
  display: block;
  font-size: 1.45rem;
  line-height: 1.1;
}

.site-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.site-nav a,
.site-login-link {
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

.site-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.site-actions form {
  margin: 0;
}

.site-user {
  color: var(--muted-text-colour);
  display: grid;
  font-size: 0.88rem;
  font-weight: 700;
  gap: 0.1rem;
  line-height: 1.2;
  margin: 0;
  text-align: right;
}

@media (max-width: 760px) {
  .site-header {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .site-nav,
  .site-actions {
    justify-content: flex-start;
  }

  .site-user {
    text-align: left;
  }
}
`;
