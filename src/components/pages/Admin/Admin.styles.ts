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
  margin-left: 0.5rem;
}

.admin-users-table {
  min-width: 56rem;
}

.admin-invites-table {
  min-width: 38rem;
}

.admin-reset-tokens-table {
  min-width: 32rem;
}
`;
