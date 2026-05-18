export const campaignStyles = /* css */ `
.campaign-shell {
  max-width: 58rem;
}

.campaign-main {
  align-content: start;
  display: grid;
  gap: 1rem;
}

.campaign-heading {
  display: grid;
  gap: 0.35rem;
}

.campaign-kicker {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.campaign-summary-list {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.campaign-summary-list div {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  display: grid;
  gap: 0.25rem;
  min-height: 4.5rem;
  padding: 0.75rem;
}

.campaign-summary-list dt {
  color: var(--muted-text-colour);
  font-size: 0.8rem;
  font-weight: 800;
}

.campaign-summary-list dd {
  color: var(--heading-colour);
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.1;
  margin: 0;
}

.campaign-session-form,
.campaign-session-item {
  display: grid;
  gap: 0.65rem;
}

.campaign-session-form {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.campaign-session-form label,
.campaign-session-item {
  color: var(--muted-text-colour);
  font-size: 0.82rem;
  font-weight: 850;
}

.campaign-session-form-wide,
.campaign-session-form button {
  grid-column: 1 / -1;
}

.campaign-session-form input,
.campaign-session-form select,
.campaign-session-form textarea,
.campaign-session-item input,
.campaign-session-item select,
.campaign-session-item textarea {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  color: var(--heading-colour);
  display: block;
  margin-block-start: 0.25rem;
  padding: 0.5rem;
  width: 100%;
}

.campaign-session-form textarea,
.campaign-session-item textarea {
  resize: vertical;
}

.campaign-session-form button,
.campaign-session-actions button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.4rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 850;
  justify-self: start;
  min-height: 2rem;
  padding: 0.35rem 0.65rem;
}

.campaign-session-list {
  display: grid;
  gap: 0.75rem;
}

.campaign-session-item {
  border-block-start: 1px solid var(--border-colour);
  padding-block-start: 0.75rem;
}

.campaign-session-meta,
.campaign-session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.campaign-session-meta input,
.campaign-session-meta select {
  width: min(100%, 13rem);
}

.campaign-empty-state {
  color: var(--muted-text-colour);
  font-weight: 750;
  margin: 0;
}

@media (max-width: 560px) {
  .campaign-session-form,
  .campaign-summary-list {
    grid-template-columns: 1fr;
  }
}
`;
