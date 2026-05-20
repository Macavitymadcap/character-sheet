export const rulesStyles = /* css */ `
.rules-shell {
  max-width: 64rem;
}

.rules-main,
.rules-heading,
.rules-result-list {
  display: grid;
  gap: 1rem;
}

.rule-mechanic-body {
  display: grid;
  gap: 1.1rem;
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
  gap: 0.55rem;
  grid-template-columns: minmax(10rem, 1.35fr) repeat(3, minmax(7rem, 1fr)) auto auto;
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
  margin-block-start: 0.18rem;
  min-height: 2rem;
  padding: 0.34rem 0.45rem;
  width: 100%;
}

.rules-filter-form button,
.rules-reset-link {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.4rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 850;
  min-height: 2rem;
  padding: 0.28rem 0.65rem;
  text-align: center;
}

.rules-reset-link {
  align-content: center;
  background: var(--stat-background-colour);
  color: var(--heading-colour);
  text-decoration: none;
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

.rule-mechanic-body p {
  font-size: 1rem;
  line-height: 1.45;
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
  padding-block-start: 1rem;
}

.rule-mechanic-body dl {
  display: grid;
  gap: 0.8rem 1rem;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  margin: 0;
}

.rule-mechanic-body dt {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 850;
  line-height: 1.1;
}

.rule-mechanic-body dd {
  line-height: 1.3;
  margin: 0;
}

@media (max-width: 44rem) {
  .rules-main {
    gap: 0.75rem;
  }

  .rules-heading {
    gap: 0.35rem;
  }

  .rules-filter-form {
    gap: 0.45rem;
    grid-template-columns: 1fr 1fr;
  }

  .rules-filter-form label:first-child,
  .rules-filter-form button,
  .rules-reset-link {
    grid-column: 1 / -1;
  }

  .rules-filter-form label {
    font-size: 0.78rem;
  }

  .rules-filter-form input,
  .rules-filter-form select,
  .rules-filter-form button,
  .rules-reset-link {
    min-height: 1.9rem;
  }

  .rule-mechanic-body dl {
    gap: 0.85rem;
    grid-template-columns: 1fr;
  }
}
`;
