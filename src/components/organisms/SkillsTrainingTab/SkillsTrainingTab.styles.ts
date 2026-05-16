export const skillsTrainingTabStyles = /* css */ `
.skills-training-tab {
  display: grid;
  gap: 1rem;
}

.proficiency-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.proficiency-group {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
}

.proficiency-group h4 {
  font-size: 0.95rem;
  margin: 0;
}

.proficiency-group ul {
  display: grid;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.proficiency-group li {
  display: grid;
  gap: 0.15rem;
}

.proficiency-group span {
  color: var(--muted-text-colour);
  font-size: 0.88rem;
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
