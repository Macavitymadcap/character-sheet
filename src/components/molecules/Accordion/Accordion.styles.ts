export const accordionStyles = /* css */ `
.accordion {
  display: grid;
  gap: 0.35rem;
}

.accordion-item {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.45rem;
  overflow: clip;
}

.accordion-item summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: space-between;
  min-height: 2.6rem;
  padding: 0.45rem 0.6rem;
}

.accordion-item summary span {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.5rem;
}

.accordion-item summary small {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 800;
}

.accordion-body {
  border-top: 1px solid var(--border-colour);
  color: var(--text-colour);
  display: grid;
  gap: 0.5rem;
  padding: 0.6rem;
}

.accordion-controls {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
`;
