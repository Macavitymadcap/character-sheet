export const buttonStyles = /* css */ `
.button {
  align-items: center;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.6rem 0.85rem;
  text-decoration: none;
}

.button[data-variant="primary"] {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  color: var(--action-text-colour);
}

.button[data-variant="ghost"] {
  background: transparent;
  border: 1px solid var(--border-colour);
  color: var(--muted-text-colour);
  font-weight: 700;
  min-height: 2.25rem;
  padding: 0.45rem 0.6rem;
}
`;
