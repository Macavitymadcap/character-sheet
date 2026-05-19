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
  min-width: 38rem;
  table-layout: fixed;
}

.characters-table th:first-child,
.characters-table td:first-child {
  width: 24%;
}

.characters-table th:nth-child(2),
.characters-table td:nth-child(2) {
  width: 20%;
}

.characters-table th:nth-child(3),
.characters-table td:nth-child(3) {
  text-align: center;
  width: 9%;
}

.characters-table th:nth-child(4),
.characters-table td:nth-child(4),
.characters-table th:nth-child(5),
.characters-table td:nth-child(5) {
  width: 15%;
}

.characters-table th:last-child,
.characters-table td:last-child {
  width: 17%;
}

@media (max-width: 760px) {
  .characters-table {
    min-width: 32rem;
  }

  .characters-table th,
  .characters-table td {
    overflow-wrap: anywhere;
    padding-inline: 0.35rem;
  }
}
`;
