export const sheetTabPanelStyles = /* css */ `
.sheet-tab-panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  display: grid;
  gap: 0.65rem;
  padding: 0.75rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    box-shadow var(--theme-transition);
}

.tab-panel-heading {
  display: grid;
  gap: 0.3rem;
}

.tab-panel-heading h2 {
  font-size: 1.25rem;
  line-height: 1.2;
  margin: 0;
}

.tab-panel-heading p {
  color: var(--muted-text-colour);
  font-weight: 700;
  margin: 0;
}

.tab-compact-stack {
  display: grid;
  gap: 0.75rem;
}

.tab-compact-grid {
  align-items: start;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tab-compact-section {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.tab-compact-section h3 {
  font-size: 0.95rem;
  line-height: 1.2;
  margin: 0;
}

.tab-empty-state {
  color: var(--muted-text-colour);
  font-weight: 700;
  margin: 0;
}

.tab-resource-controls,
.tab-resource-controls form {
  align-items: center;
  display: inline-flex;
  gap: 0.25rem;
  margin: 0;
}

.tab-resource-controls button {
  align-items: center;
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.35rem;
  color: var(--action-text-colour);
  cursor: pointer;
  display: inline-flex;
  font-weight: 900;
  height: 1.75rem;
  justify-content: center;
  line-height: 1;
  width: 1.75rem;
}

.tab-resource-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.tab-rest-controls,
.tab-rest-controls form {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin: 0;
}

.tab-rest-controls {
  flex-wrap: wrap;
}

.tab-rest-controls button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.45rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 800;
  min-height: 2.25rem;
  padding: 0.45rem 0.75rem;
}

.tab-rest-controls button:hover {
  border-color: var(--focus-border-colour);
}

.note-editor-list {
  display: grid;
  gap: 0.6rem;
}

.note-editor {
  border-block-end: 1px solid var(--border-colour);
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding-block-end: 0.6rem;
}

.note-editor:last-child {
  border-block-end: 0;
  padding-block-end: 0;
}

.note-editor-create {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.45rem;
  padding: 0.65rem;
}

.note-editor label {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.5rem;
}

.note-editor label strong {
  font-size: 0.98rem;
  line-height: 1.2;
}

.note-editor label span {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.note-editor input,
.note-editor select,
.note-editor textarea {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  color: var(--heading-colour);
  padding: 0.5rem;
  transition:
    background-color var(--theme-transition),
    border-color var(--theme-transition),
    color var(--theme-text-transition);
}

.note-editor textarea {
  min-height: 5.5rem;
  resize: vertical;
}

.note-editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.note-editor button {
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

.faction-picker-section {
  grid-column: 1 / -1;
}

.faction-picker,
.faction-summary-card {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.45rem;
  display: grid;
  gap: 0.55rem;
  padding: 0.65rem;
}

.faction-picker label {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.5rem;
}

.faction-picker label span,
.faction-summary-card dt {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.faction-picker select,
.faction-picker textarea {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  color: var(--heading-colour);
  padding: 0.5rem;
}

.faction-picker textarea {
  min-height: 5rem;
  resize: vertical;
}

.faction-picker button {
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

.faction-summary-card h4,
.faction-summary-card p,
.faction-summary-card dl,
.faction-summary-card dd {
  margin: 0;
}

.faction-summary-card dl {
  display: grid;
  gap: 0.45rem;
}

.faction-motto {
  color: var(--muted-text-colour);
  font-style: italic;
  font-weight: 750;
}

@media (max-width: 760px) {
  .tab-compact-grid {
    grid-template-columns: 1fr;
  }
}
`;
