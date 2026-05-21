export const localPlayStyles = /* css */ `
.local-play-shell {
  max-width: 68rem;
}

.local-play-main,
.local-play-heading,
.local-play-form,
.local-play-list {
  display: grid;
  gap: 1rem;
}

.local-play-kicker {
  color: var(--muted-text-colour);
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.local-play-heading p,
.local-play-tools p,
.local-play-list-heading p,
.local-play-record p {
  margin: 0;
}

.local-play-warning {
  background: color-mix(in srgb, var(--warning-colour) 14%, var(--stat-background-colour));
  border: 1px solid color-mix(in srgb, var(--warning-colour) 55%, var(--border-colour));
  border-radius: 0.5rem;
  color: var(--heading-colour);
  font-weight: 700;
  padding: 0.75rem 0.85rem;
}

.local-play-tools {
  align-items: center;
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.85rem;
}

.local-play-tools h2,
.local-play-list-heading h2,
.local-play-record h3 {
  margin: 0;
}

.local-play-status {
  color: var(--muted-text-colour);
  font-weight: 700;
}

.local-play-status[data-state="error"] {
  color: #991b1b;
}

:root[data-theme="dark"] .local-play-status[data-state="error"] {
  color: #fecaca;
}

.local-play-tool-actions,
.local-play-form-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.local-play-form {
  align-items: end;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.form-field textarea {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.375rem;
  color: var(--heading-colour);
  min-height: 7rem;
  padding: 0.6rem 0.7rem;
  resize: vertical;
}

.local-play-notes-field {
  grid-column: 1 / -1;
}

.local-play-list-heading {
  align-items: baseline;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.local-play-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.local-play-record {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem;
}

.local-play-record-notes {
  color: var(--muted-text-colour);
}

.local-play-record-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

@media (max-width: 760px) {
  .local-play-tools,
  .local-play-list-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .local-play-form {
    grid-template-columns: 1fr;
  }
}
`;
