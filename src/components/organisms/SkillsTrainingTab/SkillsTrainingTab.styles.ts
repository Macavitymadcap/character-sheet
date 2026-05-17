export const skillsTrainingTabStyles = /* css */ `
.skills-training-tab {
  display: grid;
  gap: 0.75rem;
}

.skills-table {
  min-width: 0;
  table-layout: fixed;
}

.skills-table th,
.skills-table td {
  padding-inline: 0.25rem;
}

.skills-table th:first-child,
.skills-table td:first-child {
  width: 42%;
}

.skills-table th:nth-child(2),
.skills-table td:nth-child(2) {
  width: 30%;
}

.skills-table th:nth-child(3),
.skills-table td:nth-child(3) {
  width: 14%;
}

.skills-table th:last-child,
.skills-table td:last-child {
  text-align: center;
  width: 14%;
}

.proficiency-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.proficiency-group {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem;
}

.proficiency-group h4 {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  margin: 0;
  text-transform: uppercase;
}

.proficiency-group ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.65rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.proficiency-group li {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.35rem;
}

.proficiency-group span {
  color: var(--muted-text-colour);
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 960px) {
  .proficiency-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .proficiency-grid {
    grid-template-columns: 1fr;
  }
}
`;
