export const campaignStyles = /* css */ `
.campaign-shell {
  max-width: 58rem;
}

.campaign-main {
  align-content: start;
  display: grid;
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

@media (max-width: 560px) {
  .campaign-summary-list {
    grid-template-columns: 1fr;
  }
}
`;
