export const skillsTrainingTabStyles = /* css */ `
.skills-training-tab {
  display: grid;
  gap: 0.75rem;
}

.skills-table {
  min-width: 32rem;
  table-layout: fixed;
}

.skills-table th,
.skills-table td {
  padding-inline: 0.25rem;
}

.skills-table th:first-child,
.skills-table td:first-child {
  width: 46%;
}

.skills-table th:nth-child(2),
.skills-table td:nth-child(2) {
  width: 24%;
}

.skills-table th:nth-child(3),
.skills-table td:nth-child(3) {
  width: 13%;
}

.skills-table th:nth-child(4),
.skills-table td:nth-child(4) {
  text-align: center;
  width: 12%;
}

.skills-table th:last-child,
.skills-table td:last-child {
  width: 12%;
}

.skill-name-with-roll {
  align-items: center;
  display: inline-flex;
  gap: 0.35rem;
  justify-content: space-between;
  width: 100%;
}

.skill-name-with-roll > span:first-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.skill-name-with-roll .dice-roller {
  flex: 0 0 auto;
  width: auto;
}

.skill-name-with-roll .dice-roller-trigger {
  font-size: 0.66rem;
  line-height: 1;
  min-height: 1.45rem;
  min-width: 1.9rem;
  padding: 0.1rem 0.3rem;
}

.proficiency-name-with-actions {
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.proficiency-name-with-actions .dice-roller {
  flex: 0 0 auto;
  width: auto;
}

.proficiency-name-with-actions .dice-roller-trigger {
  font-size: 0.66rem;
  line-height: 1;
  min-height: 1.45rem;
  min-width: 1.9rem;
  padding: 0.1rem 0.3rem;
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

.row-action-cell {
  text-align: right;
}

.row-edit-button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.35rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 900;
  min-height: 1.8rem;
  padding: 0.15rem 0.45rem;
}

.row-edit-button:hover {
  border-color: var(--focus-border-colour);
}

.inline-edit-row td,
.inline-edit-item {
  background: var(--stat-background-colour);
}

.inline-edit-item {
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  padding: 0.45rem;
  width: 100%;
}

.row-edit-form-inline {
  align-items: end;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
}

.row-edit-actions {
  display: flex;
  gap: 0.35rem;
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
  .skills-table th:nth-child(2),
  .skills-table td:nth-child(2) {
    display: none;
  }

  .skills-table th:first-child,
  .skills-table td:first-child {
    width: 52%;
  }

  .skills-table th:nth-child(3),
  .skills-table td:nth-child(3),
  .skills-table th:nth-child(4),
  .skills-table td:nth-child(4),
  .skills-table th:last-child,
  .skills-table td:last-child {
    width: 16%;
  }

  .proficiency-grid {
    grid-template-columns: 1fr;
  }

  .row-edit-form-inline {
    grid-template-columns: 1fr;
  }

  .row-edit-actions {
    justify-content: stretch;
  }

  .row-edit-actions button {
    flex: 1;
  }
}
`;
