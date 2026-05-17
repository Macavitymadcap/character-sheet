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

.home-shell {
  max-width: 58rem;
}

.home-main {
  align-items: center;
  display: grid;
  min-height: 22rem;
}

.home-intro {
  display: grid;
  gap: 0.9rem;
  max-width: 36rem;
}

.home-kicker {
  color: var(--muted-text-colour);
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.home-intro h1 {
  color: var(--heading-colour);
  font-size: 2.4rem;
  line-height: 0.95;
  margin: 0;
}

.home-intro p:not(.home-kicker) {
  color: var(--muted-text-colour);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.action-link {
  align-items: center;
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.375rem;
  color: var(--action-text-colour);
  display: inline-flex;
  font-weight: 800;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.6rem 0.85rem;
  text-decoration: none;
}

@media (max-width: 760px) {
  .shell {
    padding: 0.75rem;
  }
}

@media (min-width: 760px) {
  .home-intro h1 {
    font-size: 4.5rem;
  }
}
`;
