export const diceRollerStyles = /* css */ `
.dice-roller {
  display: inline-flex;
  position: relative;
}

.dice-roller-trigger {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 999rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 900;
  min-height: 1.7rem;
  min-width: 2.2rem;
  padding: 0.15rem 0.45rem;
}

.dice-roller-trigger:hover {
  border-color: var(--focus-border-colour);
}

.dice-roller-panel {
  background: var(--surface-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2.5rem var(--shadow-colour);
  color: var(--heading-colour);
  margin: 0;
  min-width: min(16rem, calc(100vw - 1.5rem));
  padding: 0.55rem;
  position-area: bottom center;
}

.dice-roller-panel:popover-open {
  display: grid;
  gap: 0.45rem;
}

.dice-roller-form {
  display: grid;
  gap: 0.45rem;
}

.dice-roller-fields {
  display: grid;
  gap: 0.4rem;
  grid-template-columns: minmax(0, 1fr) 4.5rem;
}

.dice-roller-field-wide {
  grid-column: 1 / -1;
}

.dice-roller-form label {
  color: var(--muted-text-colour);
  display: grid;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.2rem;
  text-transform: uppercase;
}

.dice-roller-form input,
.dice-roller-form select {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.35rem;
  color: var(--heading-colour);
  font-weight: 800;
  min-height: 1.9rem;
  padding: 0.28rem 0.4rem;
}

.dice-roller-extra-field input {
  text-align: center;
}

.dice-roller-form button {
  background: var(--action-background-colour);
  border: 1px solid var(--action-border-colour);
  border-radius: 0.4rem;
  color: var(--action-text-colour);
  cursor: pointer;
  font-weight: 900;
  min-height: 2rem;
}

.dice-roll-result {
  background: var(--stat-background-colour);
  border: 1px solid var(--border-colour);
  border-radius: 0.4rem;
  display: block;
  font-weight: 900;
  padding: 0.4rem 0.5rem;
}

@media (max-width: 760px) {
  .dice-roller {
    width: 100%;
  }

  .dice-roller-trigger {
    min-width: 2.6rem;
    width: 100%;
  }

  .dice-roller-panel {
    inset: auto 0.75rem 1rem auto;
    margin: 0;
    max-height: calc(100vh - 2rem);
    min-width: 0;
    overflow: auto;
    position: fixed;
    width: min(19rem, calc(100vw - 1.5rem));
  }

  .dice-roll-result {
    text-align: center;
  }
}
`;
