export const charactersStyles = /* css */ `
.characters-shell {
  max-width: 68rem;
}

.characters-main,
.characters-heading {
  display: grid;
  gap: 1rem;
}

.characters-kicker {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.form-grid {
  align-items: end;
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.empty-state {
  color: var(--muted-text-colour);
  margin: 0;
}

.characters-table {
  min-width: 48rem;
}
`;
