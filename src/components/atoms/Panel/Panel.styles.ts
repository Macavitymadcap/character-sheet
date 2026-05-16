export const panelStyles = /* css */ `
.panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.panel[data-width="narrow"] {
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.08);
  margin-inline: auto;
  max-width: 28rem;
  width: 100%;
}

.panel-heading {
  color: var(--heading-colour);
  font-size: 1.6rem;
  line-height: 1.1;
  margin: 0;
}
`;
