export const charactersStyles = /* css */ `
.characters-shell {
  max-width: 68rem;
}

.characters-main {
  display: grid;
  gap: 1rem;
}

.characters-heading {
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}

.characters-heading-copy {
  display: grid;
  gap: 0.2rem;
}

.characters-kicker {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.character-create-link {
  inline-size: max-content;
  min-height: 2.2rem;
  padding: 0.45rem 0.7rem;
  width: max-content;
}

.character-create-section {
  border-top: 1px solid var(--border-colour);
  display: grid;
  gap: 0.75rem;
  padding-top: 0.85rem;
}

.character-create-heading {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}

.character-create-heading h2 {
  font-size: 1rem;
  margin: 0;
}

.character-create-section .form-field input,
.character-create-section .form-field select {
  background: var(--stat-background-colour);
  border-color: var(--border-colour);
  color: var(--heading-colour);
  min-height: 2.45rem;
}

.character-create-section .form-field input:focus,
.character-create-section .form-field select:focus {
  border-color: var(--focus-border-colour);
  outline: 2px solid color-mix(in srgb, var(--focus-border-colour) 28%, transparent);
  outline-offset: 1px;
}

.form-grid {
  align-items: end;
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.character-create-actions {
  align-items: end;
  display: flex;
  justify-content: flex-start;
  justify-self: start;
}

.character-create-actions .button {
  background: var(--stat-background-colour);
  color: var(--heading-colour);
  flex: 0 0 auto;
  inline-size: max-content;
  min-height: 2.2rem;
  min-width: 0;
  padding: 0.45rem 0.7rem;
  width: max-content;
}

.character-create-actions .button:hover {
  background: var(--nav-active-background-colour);
  border-color: var(--nav-active-border-colour);
  color: var(--nav-active-text-colour);
}

.empty-state {
  color: var(--muted-text-colour);
  margin: 0;
}

.character-roster-cards {
  display: none;
  gap: 0.65rem;
}

.character-roster-card {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.65rem;
  padding: 0.75rem;
}

.character-roster-card h3,
.character-roster-card p,
.character-roster-card dl {
  margin: 0;
}

.character-roster-card h3 {
  font-size: 1rem;
}

.character-roster-card p {
  color: var(--muted-text-colour);
  font-weight: 800;
}

.character-roster-card dl {
  display: grid;
  gap: 0.45rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.character-roster-card dt {
  color: var(--muted-text-colour);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.character-roster-card dd {
  font-weight: 800;
  margin: 0;
  overflow-wrap: anywhere;
}

.characters-table {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 38rem;
  overflow: hidden;
  table-layout: fixed;
}

.characters-table thead th {
  background: color-mix(in srgb, var(--action-background-colour) 8%, var(--stat-background-colour));
}

.characters-table tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--surface-colour) 72%, var(--stat-background-colour));
}

.characters-table tbody tr:hover {
  background: color-mix(in srgb, var(--nav-active-background-colour) 45%, var(--stat-background-colour));
}

.characters-table td {
  font-weight: 700;
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

.character-roster-link {
  color: var(--nav-active-text-colour);
  font-weight: 900;
  text-decoration-thickness: 0.12em;
  text-underline-offset: 0.16em;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .character-create-actions .button {
    width: max-content;
  }

  .character-roster-cards {
    display: grid;
  }

  .character-roster-table-wrap {
    display: none;
  }
}
`;
