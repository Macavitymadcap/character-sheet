export const coreTabStyles = /* css */ `
.core-tab {
  display: grid;
  gap: 1rem;
}

.sheet-data-section {
  display: grid;
  gap: 0.75rem;
}

.sheet-data-section h3 {
  font-size: 1rem;
  line-height: 1.2;
  margin: 0;
}

.table-scroll {
  overflow-x: auto;
}

.sheet-table {
  border-collapse: collapse;
  min-width: 42rem;
  width: 100%;
}

.sheet-table th,
.sheet-table td {
  border-bottom: 1px solid var(--border-colour);
  padding: 0.65rem 0.5rem;
  text-align: left;
  vertical-align: top;
}

.sheet-table thead th {
  color: var(--muted-text-colour);
  font-size: 0.82rem;
  text-transform: uppercase;
}

.sheet-description-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}

.sheet-description-grid div {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.2rem;
  min-height: 4.5rem;
  padding: 0.75rem;
}

.sheet-description-grid dt {
  color: var(--muted-text-colour);
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
}

.sheet-description-grid dd {
  display: grid;
  gap: 0.2rem;
  font-weight: 800;
  margin: 0;
}

.sheet-description-grid dd span {
  color: var(--muted-text-colour);
  font-size: 0.88rem;
  font-weight: 700;
}

@media (max-width: 760px) {
  .sheet-description-grid {
    grid-template-columns: 1fr;
  }
}
`;
