export const adminStyles = /* css */ `
.admin-page-shell {
  max-width: 58rem;
}

.admin-shell {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.admin-shell section,
.admin-shell .table-scroll {
  min-width: 0;
}

.admin-shell h2 {
  color: var(--heading-colour);
  line-height: 1.1;
  margin: 0;
}

.admin-copy,
.admin-handoff p {
  color: var(--muted-text-colour);
  font-weight: 700;
  margin: 0;
}

.admin-kicker {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.admin-handoff {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.85rem;
  min-width: 0;
  padding: 0.85rem;
}

.admin-handoff > div:first-child {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.admin-handoff h2,
.admin-handoff p {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.admin-copy-url {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: minmax(0, 1fr) auto;
}

.admin-copy-url input {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  color: var(--heading-colour);
  min-height: 2.5rem;
  padding: 0.55rem 0.65rem;
  width: 100%;
}

.admin-copy-url .button {
  inline-size: max-content;
  justify-self: start;
}

.admin-inline-form {
  display: inline;
}

.admin-inline-form + .admin-inline-form {
  margin-left: 0.35rem;
}

.admin-compact-list {
  display: none;
  gap: 0.65rem;
}

.admin-compact-card {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.65rem;
  padding: 0.75rem;
}

.admin-compact-card h3,
.admin-compact-card p,
.admin-compact-card dl {
  margin: 0;
}

.admin-compact-card h3 {
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.admin-compact-card p {
  color: var(--muted-text-colour);
  font-weight: 800;
  overflow-wrap: anywhere;
}

.admin-compact-card dl {
  display: grid;
  gap: 0.45rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-compact-card dt {
  color: var(--muted-text-colour);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.admin-compact-card dd {
  font-weight: 800;
  margin: 0;
  overflow-wrap: anywhere;
}

.admin-compact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.admin-compact-actions .admin-inline-form {
  display: block;
  margin: 0;
}

.admin-users-table {
  min-width: 44rem;
  table-layout: fixed;
}

.admin-invites-table {
  min-width: 38rem;
}

.admin-reset-tokens-table {
  min-width: 32rem;
}

.admin-users-table th:first-child,
.admin-users-table td:first-child {
  width: 18%;
}

.admin-users-table th:nth-child(2),
.admin-users-table td:nth-child(2) {
  width: 23%;
}

.admin-users-table th:nth-child(3),
.admin-users-table td:nth-child(3),
.admin-users-table th:nth-child(4),
.admin-users-table td:nth-child(4) {
  width: 10%;
}

.admin-users-table th:nth-child(5),
.admin-users-table td:nth-child(5),
.admin-users-table th:nth-child(6),
.admin-users-table td:nth-child(6) {
  text-align: center;
  width: 8%;
}

.admin-users-table th:last-child,
.admin-users-table td:last-child {
  width: 23%;
}

.admin-users-table .button {
  min-height: 2rem;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .admin-compact-list {
    display: grid;
  }

  .admin-table-wrap {
    display: none;
  }

  .admin-copy-url {
    grid-template-columns: 1fr;
  }
}
`;
