export const sheetHeaderStyles = /* css */ `
.sheet-header {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 0.06);
  display: grid;
  gap: 1rem;
  padding: 1rem;
  position: sticky;
  top: calc(var(--page-gutter) + 4.75rem);
  z-index: 4;
}

.sheet-title-block {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: space-between;
}

.sheet-heading {
  color: var(--heading-colour);
  font-size: 1.75rem;
  line-height: 1.1;
  margin: 0;
}

.sheet-subtitle {
  color: var(--muted-text-colour);
  font-weight: 800;
  margin: 0;
}

.sheet-header-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

@media (max-width: 960px) {
  .sheet-header-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .sheet-header {
    position: static;
  }

  .sheet-header-grid {
    grid-template-columns: 1fr;
  }
}
`;
