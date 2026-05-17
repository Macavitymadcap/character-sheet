export const formFieldStyles = /* css */ `
.form-stack,
.form-field {
  display: grid;
  gap: 0.5rem;
}

.form-field label {
  color: var(--muted-text-colour);
  font-weight: 700;
}

.form-field input,
.form-field select {
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
`;
