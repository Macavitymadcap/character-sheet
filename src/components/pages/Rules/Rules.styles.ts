export const rulesStyles = /* css */ `
.rules-shell {
  max-width: 64rem;
}

.rules-main,
.rules-heading,
.rules-result-list,
.rule-mechanic-body {
  display: grid;
  gap: 1rem;
}

.rules-kicker {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.rules-filter-form {
  align-items: end;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
}

.rules-filter-form label {
  color: var(--muted-text-colour);
  font-size: 0.82rem;
  font-weight: 850;
}

.rules-filter-form input,
.rules-filter-form select {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  color: var(--heading-colour);
  display: block;
  margin-block-start: 0.25rem;
  min-height: 2.2rem;
  padding: 0.45rem;
  width: 100%;
}

.rules-filter-form button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.4rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 850;
  min-height: 2.2rem;
  padding: 0.35rem 0.65rem;
}

.rules-results-heading,
.rules-result-title {
  align-items: start;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}

.rules-results-heading p,
.rules-empty-state,
.rules-provenance {
  color: var(--muted-text-colour);
  font-weight: 750;
  margin: 0;
}

.rules-result-card {
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
}

.rules-result-card h3 {
  font-size: 1rem;
  margin: 0;
}

.rules-result-card a {
  color: var(--heading-colour);
}

.rules-result-card p,
.rule-mechanic-body p {
  margin: 0;
}

.rules-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.rules-tag-list span {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 999px;
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.18rem 0.45rem;
}

.rule-mechanic {
  border-block-start: 1px solid var(--border-colour);
  padding-block-start: 0.85rem;
}

.rule-mechanic-body dl {
  display: grid;
  gap: 0.4rem;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  margin: 0;
}

.rule-mechanic-body dt {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 850;
}

.rule-mechanic-body dd {
  margin: 0;
}
`;
