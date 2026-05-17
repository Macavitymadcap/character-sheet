export const switchStyles = /* css */ `
.switch {
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0.5rem;
  user-select: none;
}

.switch-label {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

.switch-input {
  opacity: 0;
  pointer-events: none;
  position: absolute;
}

.switch-track {
  align-items: center;
  background-image: var(--switch-track-gradient, linear-gradient(110deg, #e2e8f0 0%, #bae6fd 34%, #3b82f6 66%, #1e1b4b 100%));
  background-position: 0% 50%;
  background-size: 260% 100%;
  border: 1px solid var(--border-colour);
  border-radius: 999px;
  color: var(--switch-icon-dark);
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 2rem;
  overflow: hidden;
  padding: 0.1875rem;
  position: relative;
  transition:
    background-position var(--theme-transition),
    border-color var(--theme-transition),
    color var(--theme-text-transition);
  width: 3.75rem;
}

.switch-track::before {
  background-image: var(--switch-track-overlay, linear-gradient(110deg, #f8fafc, #cffafe, #2563eb, #111827));
  background-position: 0% 50%;
  background-size: 260% 100%;
  content: "";
  inset: 0;
  opacity: 0.5;
  position: absolute;
  transition:
    background-position var(--theme-transition),
    opacity var(--theme-transition);
}

.switch-thumb {
  background-image: var(--switch-thumb-gradient, linear-gradient(135deg, #ffffff 0%, #e0f2fe 38%, #bfdbfe 68%, #111827 100%));
  background-position: 0% 50%;
  background-size: 280% 100%;
  border-radius: 999px;
  box-shadow: 0 0.25rem 0.75rem rgb(15 23 42 / 0.22);
  inset-block: 0.1875rem;
  inset-inline-start: 0.1875rem;
  position: absolute;
  transition:
    background-position var(--theme-transition),
    box-shadow var(--theme-transition),
    transform var(--theme-transition);
  width: 1.5rem;
  z-index: 0;
}

.switch-thumb::before {
  background: radial-gradient(circle, rgb(255 255 255 / 0.7), transparent 62%);
  border-radius: inherit;
  content: "";
  inset: 0.25rem;
  opacity: 0.82;
  position: absolute;
  transition: opacity var(--theme-transition);
}

.switch-icon {
  display: grid;
  font-size: 1.25rem;
  line-height: 1;
  overflow: hidden;
  place-items: center;
  position: relative;
  transition: color var(--theme-text-transition);
  width: 1.25rem;
  z-index: 1;
}

.switch-icon-off {
  color: var(--switch-icon-light);
}

.switch-icon-on {
  color: var(--switch-icon-dark);
}

.switch[data-variant="inspiration"] {
  --switch-track-gradient: linear-gradient(110deg, #164e63 0%, #0891b2 34%, #f59e0b 68%, #fff7ed 100%);
  --switch-track-overlay: linear-gradient(110deg, #0f172a, #0e7490, #fb923c, #fff7ed);
  --switch-thumb-gradient: linear-gradient(135deg, #cffafe 0%, #67e8f9 35%, #fed7aa 72%, #ffffff 100%);
  --switch-icon-dark: #fff7ed;
  --switch-icon-light: #a5f3fc;
}

.switch-input:checked + .switch-track,
:root[data-theme="dark"] .switch[data-variant="theme"] .switch-input + .switch-track {
  background-position: 100% 50%;
}

.switch-input:checked + .switch-track::before,
:root[data-theme="dark"] .switch[data-variant="theme"] .switch-input + .switch-track::before {
  background-position: 100% 50%;
  opacity: 0.7;
}

.switch-input:checked + .switch-track .switch-thumb,
:root[data-theme="dark"] .switch[data-variant="theme"] .switch-input + .switch-track .switch-thumb {
  background-position: 100% 50%;
  transform: translateX(1.75rem);
}

.switch-input:checked + .switch-track .switch-thumb::before,
:root[data-theme="dark"] .switch[data-variant="theme"] .switch-input + .switch-track .switch-thumb::before {
  opacity: 0.2;
}

.switch-input:focus-visible + .switch-track {
  outline: 3px solid var(--focus-colour);
  outline-offset: 3px;
}
`;
