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

.ability-table {
  min-width: 0;
  table-layout: fixed;
}

.ability-table th:first-child,
.ability-table td:first-child {
  width: 32%;
}

.ability-table th:nth-child(2),
.ability-table td:nth-child(2),
.ability-table th:nth-child(3),
.ability-table td:nth-child(3),
.ability-table th:nth-child(4),
.ability-table td:nth-child(4),
.ability-table th:last-child,
.ability-table td:last-child {
  width: 17%;
}

.sheet-table th,
.sheet-table td {
  border-bottom: 1px solid var(--border-colour);
  padding: 0.45rem 0.5rem;
  text-align: left;
  vertical-align: top;
}

.sheet-table thead th {
  color: var(--muted-text-colour);
  font-size: 0.82rem;
  text-transform: uppercase;
}

.ability-table th,
.ability-table td {
  padding-inline: 0.25rem;
}

.sheet-description-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}

.sheet-description-grid-compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-description-grid div {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.2rem;
  min-height: 3.25rem;
  padding: 0.5rem;
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

.proficiency-icon-cell {
  text-align: center;
}

.armour-defence-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.armour-summary-card {
  grid-column: 1 / -1;
}

.inline-value-list {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}

.inline-value-list span {
  color: var(--muted-text-colour);
  font-size: 0.86rem;
  font-weight: 700;
}

.inline-value-list strong {
  color: var(--heading-colour);
}

@media (max-width: 760px) {
  .sheet-description-grid {
    grid-template-columns: 1fr;
  }

  .sheet-description-grid-compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 340px) {
  .sheet-description-grid-compact {
    grid-template-columns: 1fr;
  }
}
`;
