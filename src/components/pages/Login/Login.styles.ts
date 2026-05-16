export const loginStyles = /* css */ `
.auth-shell {
  align-items: center;
  display: grid;
  min-height: 100dvh;
  padding: var(--page-gutter);
}

.auth-panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.08);
  display: grid;
  gap: 1rem;
  margin-inline: auto;
  max-width: 28rem;
  padding: 1rem;
  width: 100%;
}

.auth-panel h1 {
  color: var(--heading-colour);
  font-size: 1.6rem;
  line-height: 1.1;
  margin: 0;
}

.auth-form,
.form-field {
  display: grid;
  gap: 0.5rem;
}

.form-field label {
  color: var(--muted-text-colour);
  font-weight: 700;
}

.form-field input {
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  min-height: 2.75rem;
  padding: 0.6rem 0.7rem;
}

.form-error {
  background: #ffe7e3;
  border: 1px solid #d24b3f;
  border-radius: 0.375rem;
  color: #7f1d1d;
  font-weight: 700;
  margin: 0;
  padding: 0.65rem 0.75rem;
}

.submit-button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.375rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 800;
  min-height: 2.75rem;
  padding: 0.6rem 0.85rem;
}
`;
