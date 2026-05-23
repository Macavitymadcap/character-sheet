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

.campaign-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

.campaign-source-list {
  display: grid;
  gap: 0.75rem;
}

.campaign-prep-grid,
.campaign-npc-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}

.campaign-prep-link,
.campaign-npc-card {
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  color: var(--heading-colour);
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  text-decoration: none;
}

.campaign-prep-link strong {
  font-size: 2rem;
  line-height: 1;
}

.campaign-prep-link small,
.campaign-npc-card p {
  color: var(--muted-text-colour);
  font-weight: 750;
}

.campaign-npc-card h2 {
  font-size: 1rem;
  margin: 0;
}

.campaign-npc-card a {
  color: var(--heading-colour);
}

.campaign-npc-card p,
.campaign-npc-summary {
  margin: 0;
}

.campaign-help-text {
  color: var(--muted-text-colour);
  font-weight: 750;
  margin: 0;
}

.campaign-help-text a {
  color: var(--heading-colour);
}

.campaign-checkbox-list {
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding: 0.65rem;
}

.campaign-checkbox-list legend {
  color: var(--muted-text-colour);
  font-size: 0.82rem;
  font-weight: 850;
  padding-inline: 0.25rem;
}

.campaign-checkbox-list label {
  align-items: center;
  display: flex;
  flex-direction: row;
  font-size: 0.92rem;
  gap: 0.45rem;
}

.campaign-checkbox-list input {
  inline-size: auto;
  min-height: auto;
}

.campaign-npc-portrait-frame {
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  margin: 0;
  overflow: hidden;
  width: min(100%, 24rem);
}

.campaign-npc-portrait {
  aspect-ratio: 16 / 9;
  display: block;
  object-fit: cover;
  width: 100%;
}

.campaign-npc-portrait-frame figcaption {
  background: var(--stat-background-colour);
  color: var(--muted-text-colour);
  font-size: 0.8rem;
  font-weight: 850;
  padding: 0.5rem 0.75rem;
}

.campaign-npc-dossier {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.campaign-npc-dossier div {
  border-block-start: 1px solid var(--border-colour);
  display: grid;
  gap: 0.25rem;
  padding-block-start: 0.75rem;
}

.campaign-npc-dossier dt {
  color: var(--muted-text-colour);
  font-size: 0.8rem;
  font-weight: 850;
}

.campaign-npc-dossier dd {
  margin: 0;
}

.campaign-source-item {
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
}

.campaign-source-item h3 {
  font-size: 1rem;
  margin: 0;
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

.campaign-wiki-grid,
.campaign-asset-list {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.campaign-wiki-card,
.campaign-asset-list figure {
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  margin: 0;
  overflow: hidden;
}

.campaign-wiki-cover,
.campaign-asset-list img,
.campaign-wiki-hero {
  aspect-ratio: 16 / 9;
  background: var(--stat-background-colour);
  display: block;
  object-fit: cover;
  width: 100%;
}

.campaign-wiki-card-body,
.campaign-asset-list figcaption {
  display: grid;
  gap: 0.4rem;
  padding: 0.75rem;
}

.campaign-asset-list figcaption strong,
.campaign-asset-list figcaption > span:not(.campaign-asset-status) {
  overflow-wrap: anywhere;
}

.campaign-asset-status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.campaign-asset-status span {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 999px;
  color: var(--muted-text-colour);
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.1rem 0.45rem;
}

.campaign-wiki-card h3 {
  font-size: 1rem;
  margin: 0;
}

.campaign-wiki-card a {
  color: var(--heading-colour);
}

.campaign-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.campaign-tag-list span {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 999px;
  color: var(--muted-text-colour);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
}

.campaign-markdown {
  color: var(--body-text-colour);
  display: grid;
  gap: 0.75rem;
}

.campaign-markdown h2,
.campaign-markdown h3,
.campaign-markdown p,
.campaign-markdown ul {
  margin: 0;
}

.campaign-markdown hr {
  border: 0;
  border-block-start: 1px solid var(--border-colour);
  width: 100%;
}

.campaign-markdown-asset {
  margin: 0;
}

.campaign-markdown-asset img {
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  max-width: min(100%, 24rem);
}

@media (max-width: 560px) {
  .campaign-session-form,
  .campaign-summary-list {
    grid-template-columns: 1fr;
  }
}
`;
