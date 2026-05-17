export const compactListStyles = /* css */ `
.compact-list {
  display: grid;
  gap: 0;
  margin: 0;
}

.compact-list-row {
  align-items: baseline;
  border-bottom: 1px solid var(--border-colour);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: minmax(7rem, 0.8fr) minmax(0, 1.6fr);
  min-width: 0;
  padding: 0.5rem 0;
}

.compact-list-row:first-child {
  padding-block-start: 0;
}

.compact-list-row:last-child {
  border-bottom: 0;
  padding-block-end: 0;
}

.compact-list-row dt {
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.compact-list-row dd {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.45rem;
  margin: 0;
  min-width: 0;
}

.compact-list-row strong {
  color: var(--heading-colour);
  font-size: 0.98rem;
  line-height: 1.25;
}

.compact-list-row span {
  color: var(--muted-text-colour);
  font-size: 0.84rem;
  font-weight: 700;
}

.compact-list-controls {
  align-items: center;
  display: inline-flex;
  gap: 0.25rem;
}

@media (max-width: 520px) {
  .compact-list-row {
    grid-template-columns: 1fr;
  }
}
`;
