export const adminStyles = /* css */ `
.admin-page-shell {
  max-width: 58rem;
}

.admin-shell {
  display: grid;
  gap: 1rem;
}

.admin-shell h2 {
  color: var(--heading-colour);
  line-height: 1.1;
  margin: 0;
}

.admin-inline-form {
  display: inline;
}

.admin-inline-form + .admin-inline-form {
  margin-left: 0.35rem;
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
  .admin-users-table {
    min-width: 46rem;
  }

  .admin-invites-table,
  .admin-reset-tokens-table {
    min-width: 28rem;
  }

  .admin-users-table th,
  .admin-users-table td,
  .admin-invites-table th,
  .admin-invites-table td,
  .admin-reset-tokens-table th,
  .admin-reset-tokens-table td {
    overflow-wrap: anywhere;
    padding-inline: 0.35rem;
  }

  .admin-inline-form + .admin-inline-form {
    margin-left: 0.3rem;
  }
}
`;
